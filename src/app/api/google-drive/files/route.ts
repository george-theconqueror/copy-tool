import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Google Drive API configuration
const SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'];

export async function GET(request: NextRequest) {
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

    // List only files (excluding folders) in the workspace root
    const result = await drive.files.list({
      q: `'${targetWorkspaceId}' in parents and trashed=false and mimeType!='application/vnd.google-apps.folder'`,
      fields: 'files(id,name,mimeType,size,createdTime,webViewLink,parents,description)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      orderBy: 'name',
    });

    return NextResponse.json({
      success: true,
      workspace: {
        id: targetWorkspaceId,
        path: '/',
      },
      files: result.data.files || [],
      message: 'Files in workspace root',
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
            details: 'Service account does not have permission to list files in Google Drive'
          },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch files from Google Drive',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
