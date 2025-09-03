import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Google Drive API configuration
const SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.readonly'];

export async function GET(request: NextRequest) {
  try {
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

    // Create service account client
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    // Create Drive client
    const drive = google.drive({ version: 'v3', auth });

    // Fetch all available drives (workspaces)
    const drives = await drive.drives.list({
      fields: 'drives(id,name,createdTime,capabilities,restrictions)',
    });
    
    console.log('Available workspaces:', drives.data.drives);

    return NextResponse.json({
      success: true,
      drives: drives.data.drives || [],
      message: 'Workspaces fetched successfully',
    });
  } catch (error) {
    console.error('Google Drive API error:', error);
    
    // Handle specific Google API errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 401) {
        return NextResponse.json(
          { 
            error: 'API key invalid',
            details: 'Please check your Google API key'
          },
          { status: 401 }
        );
      }
      
      if (error.code === 403) {
        return NextResponse.json(
          { 
            error: 'Permission denied',
            details: 'API key does not have permission to access workspaces'
          },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch workspaces',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

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

    // Create service account client
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'],
    });

    // Create Drive client
    const drive = google.drive({ version: 'v3', auth });

    // Get request body to check for custom file parameters
    const body = await request.json();
    
    // Use custom file parameters if provided, otherwise use default test file
    const testText = body.fileContent || 'This is a test file created via Google Drive API from the copy-tool application.';
    const fileName = body.fileName || `test-file-${Date.now()}.txt`;

    // Create the file metadata
    const fileMetadata: any = {
      name: fileName,
      mimeType: 'text/plain',
      description: body.fileContent ? 'Custom text file created via copy-tool application' : 'Test file created via copy-tool application',
    };

    // For shared drives, use the parents parameter with the shared drive ID
    if (process.env.GOOGLE_WORKSPACE_ID) {
      console.log('Using workspace ID:', process.env.GOOGLE_WORKSPACE_ID);
      fileMetadata.parents = [process.env.GOOGLE_WORKSPACE_ID];
    } else {
      console.log('No workspace ID specified, will create in root');
    }

    // Create the file directly in the workspace with content
    const createOptions: any = {
      requestBody: fileMetadata,
      media: {
        mimeType: 'text/plain',
        body: testText,
      },
      fields: 'id,name,webViewLink,size,createdTime',
      supportsAllDrives: true, // Required for shared drives
    };

    const file = await drive.files.create(createOptions);

    // Return success response with file details
    return NextResponse.json({
      success: true,
      file: {
        id: file.data.id,
        name: file.data.name,
        link: file.data.webViewLink,
        size: file.data.size,
        createdTime: file.data.createdTime,
      },
      message: 'File created successfully in Google Drive',
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
            details: 'Service account does not have permission to create files in Google Drive'
          },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create file in Google Drive',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
