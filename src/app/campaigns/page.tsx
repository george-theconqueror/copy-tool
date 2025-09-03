'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Campaign {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink: string;
  parents: string[];
  channels: string[];
  channelCount: number;
}

interface CampaignsResponse {
  success: boolean;
  campaigns: Campaign[];
  totalCampaigns: number;
  message: string;
  error?: string;
  details?: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/campaigns');
      const data: CampaignsResponse = await response.json();
      
      if (data.success) {
        setCampaigns(data.campaigns);
      } else {
        setError(data.error || 'Failed to fetch campaigns');
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Failed to fetch campaigns. Please try again.');
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

  return (
    <div className="min-h-screen">
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="rounded-lg shadow-sm border p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">
                Campaigns
              </h1>
              <p className="mt-2">
                Manage and view all your marketing campaigns
              </p>
            </div>
            <Link href="/new">
              <Button>
                Create New Campaign
              </Button>
            </Link>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2"></div>
                <span>Loading campaigns...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="rounded-lg p-6 mb-8">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">
                    Error loading campaigns
                  </h3>
                  <p className="text-sm mt-1">{error}</p>
                  <button
                    onClick={fetchCampaigns}
                    className="text-sm mt-2 underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && campaigns.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">No campaigns found</h3>
              <p className="mb-6">
                Get started by creating your first marketing campaign
              </p>
              <Link href="/new">
                <Button>
                  Create Your First Campaign
                </Button>
              </Link>
            </div>
          )}

          {/* Campaigns Grid */}
          {!isLoading && !error && campaigns.length > 0 && (
            <div>
              {/* Campaign Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">
                          {campaign.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2">
                          {campaign.channels.length > 0 ? (
                            campaign.channels.map((channel, index) => (
                              <Badge key={index} variant="outline">
                                {channel}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline">
                              No Channels
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <a
                          href={campaign.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:opacity-70"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>

                    <div className="space-y-3 mb-2">
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Created: {formatDate(campaign.createdTime)}
                      </div>
                      <div className="flex items-center text-sm">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Modified: {formatDateTime(campaign.modifiedTime)}
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={() => window.open(campaign.webViewLink, '_blank', 'noopener,noreferrer')}
                      >
                        Open in Drive
                      </Button>
                      <Link href={`/campaigns/${encodeURIComponent(campaign.name)}`}>
                        <Button variant="outline" className="px-4 py-2 text-sm font-medium">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
