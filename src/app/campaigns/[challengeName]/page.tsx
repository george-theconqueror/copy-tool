'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import TouchpointContent from '@/components/TouchpointContent';
import { DriveTouchpoint, ChannelWithTouchpoints } from '@/types/touchpoint';

interface Campaign {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink: string;
  dataFolder: {
    id: string;
    name: string;
    webViewLink: string;
  } | null;
  channels: ChannelWithTouchpoints[];
  channelCount: number;
  totalTouchpoints: number;
}

interface CampaignResponse {
  success: boolean;
  campaign: Campaign;
  message: string;
  error?: string;
  details?: string;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const challengeName = params.challengeName as string;
  
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (challengeName) {
      fetchCampaign();
    }
  }, [challengeName]);



  const fetchCampaign = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/campaigns/${encodeURIComponent(challengeName)}`);
      const data: CampaignResponse = await response.json();
      
      if (data.success) {
        setCampaign(data.campaign);
      } else {
        setError(data.error || 'Failed to fetch campaign');
      }
    } catch (err) {
      console.error('Error fetching campaign:', err);
      setError('Failed to fetch campaign. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2"></div>
              <span>Loading campaign...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen ">
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className=" rounded-lg shadow-sm border  p-8">
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24  rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium  mb-2">Error loading campaign</h3>
              <p className=" mb-6">{error}</p>
              <div className="space-x-4">
                <Button onClick={fetchCampaign} className="">
                  Try Again
                </Button>
                <Link href="/campaigns">
                  <Button variant="outline">Back to Campaigns</Button>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen ">
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className=" rounded-lg shadow-sm border  p-8">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium  mb-2">Campaign not found</h3>
              <p className=" mb-6">The requested campaign could not be found.</p>
              <Link href="/campaigns">
                <Button variant="outline">Back to Campaigns</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <main className="max-w-7xl mx-auto px-6 py-2">
        <div className="  p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Link href="/campaigns">
                  <Button variant="outline" size="sm">
                    ← Back to Campaigns
                  </Button>
                </Link>
                
              </div>
              
            </div>
            
            <a
              href={campaign.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="  px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Open in Drive</span>
            </a>
          </div>
          <h1 className="text-3xl font-bold mb-6">
                  {campaign.name}
          </h1>
          

          {/* Data Folder */}
          {campaign.dataFolder && (
            <div className="mb-8">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10  rounded flex items-center justify-center">
                      <svg className="w-5 h-5 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium ">{campaign.dataFolder.name}</h3>
                      <p className="text-sm ">Uploaded files and campaign data</p>
                    </div>
                  </div>
                  <a
                    href={campaign.dataFolder.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="  px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Open
                  </a>
                </div>
              </Card>
            </div>
          )}

          {/* Channels & Touchpoints */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Channels & Touchpoints</h2>
            {campaign.channels.length > 0 ? (
              <Tabs defaultValue={campaign.channels[0].name} className="w-full">
                <TabsList 
                  className={`grid w-full  mb-6 ${
                    campaign.channels.length === 1 ? 'grid-cols-1' :
                    campaign.channels.length === 2 ? 'grid-cols-2' :
                    campaign.channels.length === 3 ? 'grid-cols-3' :
                    campaign.channels.length === 4 ? 'grid-cols-4' :
                    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  }`}
                >
                  {campaign.channels.map((channel) => (
                    <TabsTrigger key={channel.id} value={channel.name} className="text-sm ">
                      <div className="flex flex-col items-center  h-full">
                        <span>{channel.name}</span>
                        
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {campaign.channels.map((channel) => (
                  <TabsContent key={channel.id} value={channel.name} className="mt-0">
                    <div className=" rounded-lg border  p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold  mb-1">
                            {channel.name}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm ">
                            <span>Created: {formatDate(channel.createdTime)}</span>
                            <span>Modified: {formatDateTime(channel.modifiedTime)}</span>
                          </div>
                        </div>
                        <a
                          href={channel.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="  px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          Open Channel
                        </a>
                      </div>
                      
                      <TouchpointContent
                        challengeName={challengeName}
                        channelName={channel.name}
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24  rounded-full flex items-center justify-center mb-4">
                  <svg className="w-12 h-12 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium  mb-2">No channels found</h3>
                <p className="">
                  This campaign doesn't have any channels configured yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
