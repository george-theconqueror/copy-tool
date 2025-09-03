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
    const { name } = await request.json();

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { 
          error: 'Invalid folder name',
          details: 'Folder name is required and must be a non-empty string'
        },
        { status: 400 }
      );
    }

    // Create service account client
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: SCOPES,
    });

    // Create Drive client
    const drive = google.drive({ version: 'v3', auth });

    // Create the folder metadata
    const folderMetadata = {
      name: name.trim(),
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Folder created via copy-tool application',
    };

    // For shared drives, use the parents parameter with the shared drive ID
    if (process.env.GOOGLE_WORKSPACE_ID) {
      console.log('Using workspace ID:', process.env.GOOGLE_WORKSPACE_ID);
      folderMetadata.parents = [process.env.GOOGLE_WORKSPACE_ID];
    } else {
      console.log('No workspace ID specified, will create in root');
    }

    // Create the folder
    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id,name,webViewLink,createdTime',
      supportsAllDrives: true, // Required for shared drives
    });

    // Return success response with folder details
    return NextResponse.json({
      success: true,
      folder: {
        id: folder.data.id,
        name: folder.data.name,
        link: folder.data.webViewLink,
        createdTime: folder.data.createdTime,
      },
      message: 'Folder created successfully in Google Drive',
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
            details: 'Service account does not have permission to create folders in Google Drive'
          },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create folder in Google Drive',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
