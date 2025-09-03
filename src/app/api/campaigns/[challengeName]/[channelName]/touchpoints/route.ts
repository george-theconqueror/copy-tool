import { NextRequest, NextResponse } from 'next/server';
import { getTouchpointContent } from '@/repository/drive';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ challengeName: string; channelName: string }> }
) {
  try {
    const { challengeName, channelName } = await params;
    
    // Decode the challenge name and channel name in case they contain special characters
    const decodedChallengeName = decodeURIComponent(challengeName);
    const decodedChannelName = decodeURIComponent(channelName);
    
    console.log('Fetching touchpoint content for:', {
      challenge: decodedChallengeName,
      channel: decodedChannelName
    });
    
    // Get workspace ID from query parameters if provided
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || undefined;
    
    console.log('Workspace ID:', workspaceId || 'using default from environment');
    
    // Call the getTouchpointContent function
    const result = await getTouchpointContent(decodedChallengeName, decodedChannelName, workspaceId);
    
    console.log('Touchpoint content retrieved successfully:', {
      campaignName: result.campaign.name,
      channelName: result.channel.name,
      totalTouchpoints: result.totalTouchpoints,
      totalFiles: result.totalFiles,
      totalTextFiles: result.totalTextFiles,
      touchpointNames: result.touchpoints.map(tp => tp.name)
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching touchpoint content:', error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Resource not found',
            details: error.message
          },
          { status: 404 }
        );
      }
      
      if (error.message.includes('No workspace ID specified')) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Configuration error',
            details: 'No workspace ID specified. Please provide workspaceId parameter or configure GOOGLE_WORKSPACE_ID environment variable.'
          },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch touchpoint content',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
