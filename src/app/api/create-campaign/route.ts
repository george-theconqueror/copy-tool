import { NextRequest, NextResponse } from 'next/server';
import { createCampaign } from '@/repository/drive';

export async function POST(request: NextRequest) {
  try {
    const campaignData = await request.json();
    
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

    // Convert file data to a format that can be used by Google Drive API
    const files = campaignData.files?.map((fileData: any) => {
      const buffer = Buffer.from(fileData.content);
      console.log(`Processing file: ${fileData.name}, size: ${fileData.size}, buffer size: ${buffer.length}`);
      return {
        name: fileData.name,
        type: fileData.type,
        size: fileData.size,
        buffer: buffer
      };
    }) || [];

    console.log(`Total files to upload: ${files.length}`);

    const result = await createCampaign({
      challengeName: campaignData.challengeName,
      files: files,
      links: campaignData.links || [],
      channels: campaignData.channels,
      touchpoints: campaignData.touchpoints,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}
