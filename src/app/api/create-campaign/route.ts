import { NextRequest, NextResponse } from 'next/server';
import { createCampaign } from '@/repository/drive';
import { del } from '@vercel/blob';

// Helper function to download file from Vercel Blob
const downloadFromBlob = async (blobUrl: string): Promise<{ buffer: Buffer; filename: string; size: number; type: string }> => {
  try {
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`Failed to download from Blob: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Extract filename from URL or use a default
    const urlParts = blobUrl.split('/');
    const filename = urlParts[urlParts.length - 1] || 'uploaded-file';
    
    // Get content type from response headers
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    return {
      buffer,
      filename,
      size: buffer.length,
      type: contentType
    };
  } catch (error) {
    console.error('Error downloading from Blob:', error);
    throw new Error(`Failed to download file from Blob: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper function to delete file from Vercel Blob
const deleteFromBlob = async (blobUrl: string): Promise<void> => {
  try {
    await del(blobUrl);
    console.log('Blob file deleted successfully:', blobUrl);
  } catch (error) {
    console.error('Failed to delete Blob file:', error);
    // Don't throw error for cleanup failures
  }
};

export async function POST(request: NextRequest) {
  let campaignData: any = null;
  
  try {
    campaignData = await request.json();
    
    // Validate required fields
    if (!campaignData.challengeName || !campaignData.challengeName.trim()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Challenge name is required' 
        },
        { status: 400 }
      );
    }

    if (!campaignData.channels || campaignData.channels.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'At least one channel must be selected' 
        },
        { status: 400 }
      );
    }

    if (!campaignData.touchpoints || campaignData.touchpoints.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'At least one touchpoint must be selected' 
        },
        { status: 400 }
      );
    }

    // Handle file uploads - support both Blob URLs and traditional file content
    let files: Array<{ name: string; type: string; size: number; buffer: Buffer }> = [];
    const blobUrlsToCleanup: string[] = [];

    if (campaignData.blobUrls && campaignData.blobUrls.length > 0) {
      // New flow: Download files from Vercel Blob
      console.log(`Processing ${campaignData.blobUrls.length} files from Vercel Blob`);
      
      try {
        const blobFiles = await Promise.all(
          campaignData.blobUrls.map(async (blobUrl: string) => {
            const blobData = await downloadFromBlob(blobUrl);
            blobUrlsToCleanup.push(blobUrl);
            
            console.log(`Downloaded from Blob: ${blobData.filename}, size: ${blobData.size}`);
            return {
              name: blobData.filename,
              type: blobData.type,
              size: blobData.size,
              buffer: blobData.buffer
            };
          })
        );
        
        files = blobFiles;
      } catch (error) {
        console.error('Error downloading files from Blob:', error);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to download files from storage' 
          },
          { status: 500 }
        );
      }
    } else if (campaignData.files && campaignData.files.length > 0) {
      // Legacy flow: Convert file data from request body
      console.log(`Processing ${campaignData.files.length} files from request body`);
      
      files = campaignData.files.map((fileData: any) => {
        const buffer = Buffer.from(fileData.content);
        console.log(`Processing file: ${fileData.name}, size: ${fileData.size}, buffer size: ${buffer.length}`);
        return {
          name: fileData.name,
          type: fileData.type,
          size: fileData.size,
          buffer: buffer
        };
      });
    }

    console.log(`Total files to upload: ${files.length}`);

    const result = await createCampaign({
      challengeName: campaignData.challengeName,
      files: files,
      links: campaignData.links || [],
      channels: campaignData.channels,
      touchpoints: campaignData.touchpoints,
    });
    
    // Clean up Blob files after successful campaign creation
    if (blobUrlsToCleanup.length > 0) {
      console.log(`Cleaning up ${blobUrlsToCleanup.length} Blob files`);
      await Promise.all(
        blobUrlsToCleanup.map(blobUrl => deleteFromBlob(blobUrl))
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating campaign:', error);
    
    // Clean up Blob files even if campaign creation failed
    if (campaignData?.blobUrls && campaignData.blobUrls.length > 0) {
      console.log(`Cleaning up ${campaignData.blobUrls.length} Blob files after error`);
      await Promise.all(
        campaignData.blobUrls.map((blobUrl: string) => deleteFromBlob(blobUrl))
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}
