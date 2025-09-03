'use client';

import { useState, useContext } from 'react';
import { MarketingContext } from '@/context/MarketingContext';
import ChallengeSetup from '@/components/ChallengeSetup';
import ChannelSelector from '@/components/ChannelSelector';
import TouchpointSelector from '@/components/TouchpointSelector';
import { uploadFilesToBlob } from '@/lib/blob-upload';
import { Button } from '@/components/ui/button';

export default function NewPage() {
  const context = useContext(MarketingContext);
  if (!context) {
    throw new Error('NewPage must be used within MarketingProvider');
  }
  const { data, setChallengeName, setFiles, setLinks, addChannel, removeChannel, addTouchpoint, removeTouchpoint, resetState } = context;
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [creationResult, setCreationResult] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleTouchpointToggle = (touchpoint: { id: number; name: string; channel: string; purpose: string }) => {
    const isSelected = data.touchpoints.some(
      (tp: any) => tp.name === touchpoint.name && tp.channel === touchpoint.channel
    );
    
    if (isSelected) {
      removeTouchpoint(touchpoint.name, touchpoint.channel);
    } else {
      addTouchpoint(touchpoint);
    }
  };

  const handleCreateCampaign = async () => {
    setCurrentStep(4);
    setIsCreating(true);
    setCreationResult(null);
    setUploadProgress(0);
    
    try {
      console.log('=== FRONTEND: Starting Blob upload process ===');
      console.log('Total files in data.files:', data.files.length);
      console.log('Files:', data.files.map(f => ({ name: f.name, size: f.size, type: f.type })));

      let blobUrls: string[] = [];

      // Upload files to Vercel Blob if there are any files
      if (data.files.length > 0) {
        console.log('=== FRONTEND: Uploading files to Vercel Blob ===');
        const blobResults = await uploadFilesToBlob(data.files, (progress) => {
          setUploadProgress(progress);
        });
        
        console.log('=== FRONTEND: Waiting for all uploads to complete ===');
        // Wait for all uploads to be fully complete before proceeding
        await Promise.all(blobResults.map(result => result.uploadPromise));
        
        blobUrls = blobResults.map(result => result.url);
        console.log('=== FRONTEND: All Blob uploads fully completed ===');
        console.log('Blob URLs:', blobUrls);
      }

      const requestBody = {
        challengeName: data.challengeName,
        blobUrls: blobUrls, // Send Blob URLs instead of file content
        links: data.links,
        channels: data.channels,
        touchpoints: data.touchpoints,
      };

      console.log('=== FRONTEND: Sending request to API ===');
      console.log('Request body size:', JSON.stringify(requestBody).length);
      console.log('Challenge name:', data.challengeName);
      console.log('Channels:', data.channels.length);
      console.log('Touchpoints:', data.touchpoints.length);
      console.log('Blob URLs count:', blobUrls.length);

      const response = await fetch('/api/create-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create campaign');
      }
      
      setCreationResult(result);
      console.log('Campaign created successfully:', result);
      
      // Clean up the context state after successful creation
      if (result.success) {
        console.log('Cleaning up context state...');
        resetState();
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      setCreationResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ChallengeSetup
            challengeName={data.challengeName}
            files={data.files}
            links={data.links}
            onChallengeNameChange={setChallengeName}
            onFilesChange={setFiles}
            onLinksChange={setLinks}
            onNext={() => setCurrentStep(2)}
          />
        );
      case 2:
        return (
          <ChannelSelector
            channels={data.channels}
            onAddChannel={addChannel}
            onRemoveChannel={removeChannel}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        );
      case 3:
        return (
          <TouchpointSelector
            selectedChannels={data.channels.map((c: any) => c.name)}
            selectedTouchpoints={data.touchpoints}
            onTouchpointToggle={handleTouchpointToggle}
            onNext={handleCreateCampaign}
            onBack={() => setCurrentStep(2)}
          />
        );
      case 4:
        return (
          <div className="rounded-lg shadow-sm border p-8">
            <div className="text-center">
              {isCreating ? (
                <div>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"></div>
                  <h2 className="text-2xl font-bold mb-2">
                    {uploadProgress > 0 && uploadProgress < 100 ? 'Uploading Files...' : 'Creating Campaign...'}
                  </h2>
                  <p>
                    {uploadProgress > 0 && uploadProgress < 100 
                      ? `Uploading files to storage... ${uploadProgress}%`
                      : 'Setting up your campaign structure in Google Drive. This may take a few moments.'
                    }
                  </p>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="w-full bg-muted rounded-full h-2 mt-4">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              ) : creationResult ? (
                <div>
                  {creationResult.success ? (
                    <div>
                      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Campaign Created Successfully!</h2>
                      <p className="mb-6">{creationResult.message}</p>
                      
                      <div className="rounded-lg p-6 mb-6 border bg-card">
                        <h3 className="text-lg font-semibold mb-4">Campaign Structure</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span>Challenge Folder:</span>
                            <a 
                              href={creationResult.campaign.challengeFolder.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="underline hover:opacity-70"
                            >
                              {creationResult.campaign.challengeFolder.name}
                            </a>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Data Folder:</span>
                            <a 
                              href={creationResult.campaign.dataFolder.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="underline hover:opacity-70"
                            >
                              {creationResult.campaign.dataFolder.name}
                            </a>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Channels:</span>
                            <span>{creationResult.campaign.channels.length}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span >Total Folders:</span>
                            <span>{creationResult.campaign.totalFolders}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Uploaded Files:</span>
                            <span>{creationResult.campaign.totalFiles}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-4 justify-center">
                        <Button 
                          onClick={() => window.location.href = '/campaigns'}
                          variant="secondary"
                        >
                          View Campaigns
                        </Button>
                        <Button 
                          onClick={() => {
                            setCurrentStep(1);
                            setCreationResult(null);
                            setIsCreating(false);
                            // Context state is already cleaned up from successful creation
                          }}
                          variant="secondary"
                        >
                          Create Another
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold mb-2">Campaign Creation Failed</h2>
                      <p className="mb-6">{creationResult.error}</p>
                      <Button 
                        onClick={() => {
                          setCurrentStep(3);
                          setCreationResult(null);
                          setIsCreating(false);
                        }}
                        variant="secondary"
                      >
                        Try Again
                      </Button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step <= currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step}
                </div>
                <div className="ml-2 text-sm font-medium">
                  {step === 1 && 'Challenge Setup'}
                  {step === 2 && 'Choose Channels'}
                  {step === 3 && 'Select Touchpoints'}
                  {step === 4 && 'Create Campaign'}
                </div>
                {step < 4 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    step < currentStep ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {renderStep()}
      </main>
    </div>
  );
}
