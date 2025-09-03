import { NextRequest, NextResponse } from 'next/server';
import { getCampaign } from '@/repository/drive';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ challengeName: string }> }
) {
  try {
    const { challengeName } = await params;
    
    // Decode the challenge name in case it contains special characters
    const decodedChallengeName = decodeURIComponent(challengeName);
    
    console.log('Fetching campaign:', decodedChallengeName);
    
    // Get workspace ID from query parameters if provided
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || undefined;
    
    console.log('Workspace ID:', workspaceId || 'using default from environment');
    
    // Call the getCampaign function
    const result = await getCampaign(decodedChallengeName, workspaceId);
    
    console.log('Campaign retrieved successfully:', {
      campaignName: result.campaign.name,
      channelCount: result.campaign.channelCount,
      totalTouchpoints: result.campaign.totalTouchpoints,
      channelNames: result.campaign.channels.map(c => c.name)
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch campaign',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
