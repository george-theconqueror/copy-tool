import { NextRequest, NextResponse } from 'next/server';
import { getCampaigns } from '@/repository/drive';

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching campaigns from Google Drive...');
    
    // Get workspace ID from query parameters if provided
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId') || undefined;
    
    console.log('Workspace ID:', workspaceId || 'using default from environment');
    
    // Call the getCampaigns function
    const result = await getCampaigns(workspaceId);
    
    console.log('Campaigns retrieved successfully:', {
      totalCampaigns: result.totalCampaigns,
      campaignNames: result.campaigns.map(c => c.name)
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch campaigns',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
