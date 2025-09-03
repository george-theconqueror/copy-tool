"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTouchpointData } from '@/hooks/useTouchpointData';
import { touchpoints } from '@/data/touchpoints';
import { 
  TouchpointContentProps, 
  TouchpointContentData, 
  TouchpointWithContent, 
  TouchpointTextFile 
} from '@/types/touchpoint';


// AI icon component
const SparklesIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
    />
  </svg>
);



export default function TouchpointContent({ 
  challengeName, 
  channelName, 
  workspaceId
}: TouchpointContentProps) {
  const { data, error, isLoading } = useTouchpointData(challengeName, channelName, workspaceId);
  const [editingContent, setEditingContent] = useState<{ [key: string]: string }>({});
  const [prompts, setPrompts] = useState<{ [key: string]: string }>({});
  const [improving, setImproving] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (data) {
      initializeContent(data);
    }
  }, [data]);

  const initializeContent = (result: TouchpointContentData) => {
    // Initialize editing content and prompts
    const initialEditingContent: { [key: string]: string } = {};
    const initialPrompts: { [key: string]: string } = {};
    
    result.touchpoints.forEach((touchpoint: TouchpointWithContent) => {
      touchpoint.textFiles.forEach((file: TouchpointTextFile) => {
        const key = `${touchpoint.id}-${file.id}`;
        initialEditingContent[key] = file.content || '';
        initialPrompts[key] = '';
      });
    });
    
    setEditingContent(initialEditingContent);
    setPrompts(initialPrompts);
  };



  const handleContentChange = (touchpointId: string, fileId: string, value: string) => {
    const key = `${touchpointId}-${fileId}`;
    setEditingContent(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePromptChange = (touchpointId: string, fileId: string, value: string) => {
    const key = `${touchpointId}-${fileId}`;
    setPrompts(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleEditCopy = async (touchpointId: string, fileId: string) => {
    const key = `${touchpointId}-${fileId}`;
    const content = editingContent[key];
    
    if (!content) {
      alert('Please enter content to save');
      return;
    }
    
    try {
      // TODO: Implement API call to save edited content
      console.log('Saving edited content:', { touchpointId, fileId, content });
      alert('Copy saved successfully!');
    } catch (err) {
      console.error('Error saving copy:', err);
      alert('Failed to save copy');
    }
  };

  const handleImproveCopy = async (touchpointId: string, fileId: string) => {
    const key = `${touchpointId}-${fileId}`;
    const content = editingContent[key];
    const prompt = prompts[key];
    
    if (!content) {
      alert('Please enter content to improve');
      return;
    }
    
    if (!prompt.trim()) {
      alert('Please enter a prompt for improvement');
      return;
    }
    
    try {
      setImproving(prev => ({ ...prev, [key]: true }));
      
      // TODO: Implement API call to improve content with AI
      console.log('Improving content with AI:', { touchpointId, fileId, content, prompt });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // TODO: Update content with improved version
      alert('Copy improved successfully!');
    } catch (err) {
      console.error('Error improving copy:', err);
      alert('Failed to improve copy');
    } finally {
      setImproving(prev => ({ ...prev, [key]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2"></div>
        <span className="ml-2">Loading touchpoint content...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Error</h3>
              <p>{error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data || data.touchpoints.length === 0) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No Touchpoints Found</h3>
              <p>
                No touchpoints found for channel "{channelName}" in campaign "{challengeName}".
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      
      {data.touchpoints
        .sort((a, b) => {
          // Find the predefined touchpoint data for the current channel
          const channelData = touchpoints.find(tp => tp.campaign === data.channel.name);
          
          if (channelData) {
            // Find the touchpoint in the predefined data by name
            const aTouchpoint = channelData.options.find(opt => opt.name === a.name);
            const bTouchpoint = channelData.options.find(opt => opt.name === b.name);
            
            // Sort by predefined ID if found, otherwise by name
            const aId = aTouchpoint?.id || 999;
            const bId = bTouchpoint?.id || 999;
            return aId - bId;
          }
          
          // Fallback to alphabetical sorting if no predefined data found
          return a.name.localeCompare(b.name);
        })
        .map((touchpoint) => (
        <Card key={touchpoint.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{touchpoint.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {touchpoint.textFiles.length === 0 ? (
              <div className="text-center py-8">
                No text files found in this touchpoint
              </div>
            ) : (
              <Tabs defaultValue={`${touchpoint.id}-${touchpoint.textFiles[0].id}`} className="w-full">
                <TabsList 
                  className={`grid w-full ${
                    touchpoint.textFiles.length === 1 ? 'grid-cols-1' :
                    touchpoint.textFiles.length === 2 ? 'grid-cols-2' :
                    touchpoint.textFiles.length === 3 ? 'grid-cols-3' :
                    touchpoint.textFiles.length === 4 ? 'grid-cols-4' :
                    touchpoint.textFiles.length === 5 ? 'grid-cols-5' :
                    touchpoint.textFiles.length === 6 ? 'grid-cols-6' :
                    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  }`}
                >
                  {touchpoint.textFiles.map((file, idx) => (
                    <TabsTrigger 
                      key={file.id} 
                      value={`${touchpoint.id}-${file.id}`}
                      className="text-xs"
                    >
                      Version {idx + 1}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {touchpoint.textFiles.map((file) => {
                  const key = `${touchpoint.id}-${file.id}`;
                  const isImproving = improving[key];
                  
                  return (
                    <TabsContent key={file.id} value={key} className="mt-6">
                      <div className="space-y-4">
                        {/* Content Input */}
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Copy Content
                          </label>
                          <textarea
                            value={editingContent[key] || ''}
                            onChange={(e) => handleContentChange(touchpoint.id, file.id, e.target.value)}
                            className="w-full min-h-[200px] p-3 border rounded-md resize-vertical focus:ring-2 focus:border-transparent"
                            placeholder="Enter your copy content here..."
                          />
                        </div>

                        {/* Prompt Input */}
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Improvement Prompt
                          </label>
                          <Input
                            value={prompts[key] || ''}
                            onChange={(e) => handlePromptChange(touchpoint.id, file.id, e.target.value)}
                            placeholder="e.g., Make it more engaging, shorter, or add a call-to-action..."
                            className="w-full"
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3">
                          <Button
                            onClick={() => handleEditCopy(touchpoint.id, file.id)}
                            variant="outline"
                          >
                            Edit Copy
                          </Button>
                          <Button
                            onClick={() => handleImproveCopy(touchpoint.id, file.id)}
                            disabled={isImproving}
                          >
                            {isImproving ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2"></div>
                                Improving...
                              </>
                            ) : (
                              <>
                                <SparklesIcon className="h-4 w-4 " />
                                Improve Copy
                              </>
                            )}
                          </Button>
                        </div>

                       
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
