import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Google Drive API configuration
const SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'];

export async function POST(request: NextRequest) {
  try {
    // Get service account credentials from environment variables
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
      return NextResponse.json(
        { 
          error: 'Google service account credentials not configured',
          details: 'Please check GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY environment variables'
        },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    console.log('Delete API received body:', body); // Debug log
    
    const { fileId, fileName, folderPath } = body;

    if (!fileId && !fileName) {
      console.log('Delete API: Missing fileId and fileName'); // Debug log
      return NextResponse.json(
        { 
          error: 'Invalid request',
          details: 'Either fileId or fileName is required'
        },
        { status: 400 }
      );
    }

    console.log('Delete API: Processing request with:', { fileId, fileName, folderPath }); // Debug log

    // Create service account client
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: SCOPES,
    });

    // Create Drive client
    const drive = google.drive({ version: 'v3', auth });

    const targetWorkspaceId = process.env.GOOGLE_WORKSPACE_ID;

    if (!targetWorkspaceId) {
      return NextResponse.json(
        { 
          error: 'No workspace ID specified',
          details: 'Please check GOOGLE_WORKSPACE_ID environment variable'
        },
        { status: 500 }
      );
    }

    let fileToDelete: any;
    let searchQuery: string;

    if (fileId) {
      // Delete by file ID
      console.log('Delete API: Attempting to delete by file ID:', fileId); // Debug log
      
      try {
        const fileInfo = await drive.files.get({
          fileId: fileId,
          fields: 'id,name,mimeType,parents,capabilities',
          supportsAllDrives: true,
        });

        console.log('Delete API: File info retrieved:', fileInfo.data); // Debug log

        if (!fileInfo.data.id) {
          console.log('Delete API: File not found - no ID in response'); // Debug log
          return NextResponse.json(
            { 
              error: 'File not found',
              details: `No file found with ID: ${fileId}`
            },
            { status: 404 }
          );
        }

        // Check if we have permission to delete this file
        if (fileInfo.data.capabilities && !fileInfo.data.capabilities.canDelete) {
          console.log('Delete API: No permission to delete file'); // Debug log
          return NextResponse.json(
            { 
              error: 'Permission denied',
              details: 'You do not have permission to delete this file. It may be owned by another user or in a restricted location.'
            },
            { status: 403 }
          );
        }

        fileToDelete = fileInfo.data;
        console.log('Delete API: File to delete set to:', fileToDelete); // Debug log
      } catch (error) {
        console.log('Delete API: Error getting file info:', error); // Debug log
        return NextResponse.json(
          { 
            error: 'File not found',
            details: `No file found with ID: ${fileId}`
          },
          { status: 404 }
        );
      }
    } else {
      // Delete by file name and path
      if (folderPath && folderPath.trim() !== '') {
        // Search in specific folder path
        const folderQuery = `'${targetWorkspaceId}' in parents and name='${folderPath.split('/').pop()}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
        const folderResult = await drive.files.list({
          q: folderQuery,
          fields: 'files(id)',
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        });

        if (!folderResult.data.files || folderResult.data.files.length === 0) {
          return NextResponse.json(
            { 
              error: 'Folder not found',
              details: `Target folder path '${folderPath}' does not exist`
            },
            { status: 404 }
          );
        }

        const folderId = folderResult.data.files[0].id;
        searchQuery = `'${folderId}' in parents and name='${fileName}' and trashed=false`;
      } else {
        // Search in workspace root
        searchQuery = `'${targetWorkspaceId}' in parents and name='${fileName}' and trashed=false`;
      }

      // Find the file
      const searchResult = await drive.files.list({
        q: searchQuery,
        fields: 'files(id,name,mimeType,parents)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      if (!searchResult.data.files || searchResult.data.files.length === 0) {
        return NextResponse.json(
          { 
            error: 'File not found',
            details: `File '${fileName}' not found in ${folderPath || 'root'}`
          },
          { status: 404 }
        );
      }

      if (searchResult.data.files.length > 1) {
        return NextResponse.json(
          { 
            error: 'Multiple files found',
            details: `Multiple files found with name '${fileName}' in ${folderPath || 'root'}. Please use file ID for deletion.`
          },
          { status: 400 }
        );
      }

      fileToDelete = searchResult.data.files[0];
    }

    // Delete the file (moves to trash by default)
    console.log('Delete API: Attempting to delete file with ID:', fileToDelete.id); // Debug log
    
    try {
      await drive.files.delete({
        fileId: fileToDelete.id!,
        supportsAllDrives: true,
      });
      console.log('Delete API: File deleted successfully'); // Debug log
    } catch (deleteError) {
      console.log('Delete API: Delete operation failed:', deleteError); // Debug log
      
      // Check if it's a permission issue
      if (deleteError && typeof deleteError === 'object' && 'code' in deleteError) {
        if (deleteError.code === 404) {
          return NextResponse.json(
            { 
              error: 'File not found or inaccessible',
              details: 'The file may have been moved, deleted, or you may not have permission to delete it'
            },
            { status: 404 }
          );
        }
        
        if (deleteError.code === 403) {
          return NextResponse.json(
            { 
              error: 'Permission denied',
              details: 'You do not have permission to delete this file. It may be owned by another user or in a restricted location.'
            },
            { status: 403 }
          );
        }
      }
      
      throw deleteError; // Re-throw to be caught by outer catch block
    }

    // Return success response
    return NextResponse.json({
      success: true,
      deletedFile: {
        id: fileToDelete.id,
        name: fileToDelete.name || 'Unknown file',
        mimeType: fileToDelete.mimeType || 'Unknown type',
        path: folderPath || 'root',
      },
      message: `File "${fileToDelete.name || 'Unknown'}" deleted successfully from ${folderPath || 'root'}`,
    });
  } catch (error) {
    console.error('Google Drive API error:', error);
    
    // Handle specific Google API errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 401) {
        return NextResponse.json(
          { 
            error: 'Authentication failed',
            details: 'Please check your service account credentials and permissions'
          },
          { status: 401 }
        );
      }
      
      if (error.code === 403) {
        return NextResponse.json(
          { 
            error: 'Permission denied',
            details: 'Service account does not have permission to delete files in Google Drive'
          },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to delete file from Google Drive',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
