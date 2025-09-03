'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { touchpoints } from '@/data/touchpoints';
import { TouchpointSelectorProps } from '@/types/touchpoint';

export default function TouchpointSelector({ 
  selectedChannels, 
  selectedTouchpoints, 
  onTouchpointToggle, 
  onNext, 
  onBack 
}: TouchpointSelectorProps) {
  const [activeChannel, setActiveChannel] = useState<string>(selectedChannels[0] || '');

  const getTouchpointsForChannel = (channelName: string) => {
    const channelData = touchpoints.find(tp => tp.campaign === channelName);
    return channelData?.options || [];
  };

  const getSelectedTouchpointsForChannel = (channelName: string) => {
    return selectedTouchpoints
      .filter(tp => tp.channel === channelName)
      .sort((a, b) => a.id - b.id);
  };

  const isTouchpointSelected = (touchpointName: string, channelName: string) => {
    return selectedTouchpoints.some(
      tp => tp.name === touchpointName && tp.channel === channelName
    );
  };

  const getSelectedCountForChannel = (channelName: string) => {
    return selectedTouchpoints.filter(tp => tp.channel === channelName).length;
  };

  return (
    <Card className="p-6">
      <div className="mb-2">
        <h2 className="text-2xl font-bold  mb-2">Select Touchpoints</h2>
        <p className="">
          Choose the specific touchpoints you want to create for each selected channel.
        </p>
      </div>

      {selectedTouchpoints.length > 0 && (
        <div className="mb-4 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Selected Touchpoints</h3>
          <div className="space-y-2">
            {selectedChannels.map((channel) => {
              const channelTouchpoints = getSelectedTouchpointsForChannel(channel);
              if (channelTouchpoints.length === 0) return null;
              
              return (
                <div key={channel} className="rounded-lg p-3">
                  <h4 className="font-medium mb-2">{channel}</h4>
                  <div className="flex flex-wrap gap-2">
                    {channelTouchpoints.map((touchpoint, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {touchpoint.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Channel Tabs */}
      <div className="mb-6">
        <div className="border-b">
          <nav className="-mb-px flex space-x-8">
            {selectedChannels.map((channel) => {
              const selectedCount = getSelectedCountForChannel(channel);
              return (
                <button
                  key={channel}
                  onClick={() => setActiveChannel(channel)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeChannel === channel
                      ? 'border-primary'
                      : 'border-transparent'
                  }`}
                >
                  {channel}
                  {selectedCount > 0 && (
                    <span className="ml-2 text-xs px-2 py-1 rounded-full">
                      {selectedCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Touchpoints for Active Channel */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">
          {activeChannel} Touchpoints
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {getTouchpointsForChannel(activeChannel).map((touchpoint) => {
            const isSelected = isTouchpointSelected(touchpoint.name, activeChannel);
            return (
              <div
                key={`${activeChannel}-${touchpoint.name}`}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-border/80 hover:bg-muted/50'
                }`}
                onClick={() => onTouchpointToggle({
                  id: touchpoint.id,
                  name: touchpoint.name,
                  channel: activeChannel,
                  purpose: touchpoint.purpose
                })}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">
                      {touchpoint.name}
                    </h4>
                    <p className="text-sm">
                      {touchpoint.purpose}
                    </p>
                  </div>
                  <div className="ml-4">
                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 border-2 rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={onNext}
          disabled={selectedTouchpoints.length === 0}
          className=""
        >
          Create Campaign
        </Button>
      </div>
    </Card>
  );
}
