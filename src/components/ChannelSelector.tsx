'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';

interface Channel {
  name: string;
  description?: string;
}

interface ChannelSelectorProps {
  channels: Channel[];
  onAddChannel: (channel: Channel) => void;
  onRemoveChannel: (name: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const predefinedChannels = [
  { name: 'Organic', description: 'Organic social media, SEO content, and word-of-mouth marketing' },
  { name: 'Email', description: 'Email campaigns, newsletters, and direct marketing' },
  { name: 'Website', description: 'Website content, landing pages, and on-site marketing' },
];

export default function ChannelSelector({ channels, onAddChannel, onRemoveChannel, onNext, onBack }: ChannelSelectorProps) {
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  const handleToggleChannel = (channel: Channel) => {
    const isSelected = channels.find(c => c.name === channel.name);
    if (isSelected) {
      onRemoveChannel(channel.name);
    } else {
      onAddChannel(channel);
    }
  };

  const handleAddCustomChannel = () => {
    if (newChannelName.trim()) {
      onAddChannel({
        name: newChannelName.trim(),
        description: newChannelDescription.trim() || undefined
      });
      setNewChannelName('');
      setNewChannelDescription('');
      setShowCustomForm(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Select Marketing Channels</h2>
        <p>
          Choose the channels where you want to run your campaign. You can select from predefined options or create custom channels.
        </p>
      </div>

      {/* Predefined Channels */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Marketing Channels</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {predefinedChannels.map((channel) => {
            const isSelected = channels.find(c => c.name === channel.name);
            return (
              <div
                key={channel.name}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-border/80 hover:bg-muted/50'
                }`}
                onClick={() => handleToggleChannel(channel)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{channel.name}</h4>
                    <p className="text-sm mt-1">{channel.description}</p>
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

      {/* Custom Channel Form */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Custom Channel</h3>
          <Button
            variant="outline"
            onClick={() => setShowCustomForm(!showCustomForm)}
          >
            {showCustomForm ? 'Cancel' : 'Add Custom Channel'}
          </Button>
        </div>

        {showCustomForm && (
          <div className="space-y-4 border rounded-lg p-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Channel Name *
              </label>
              <Input
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="e.g., Podcast Marketing"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Description (Optional)
              </label>
              <Input
                value={newChannelDescription}
                onChange={(e) => setNewChannelDescription(e.target.value)}
                placeholder="Brief description of this channel"
                className="w-full"
              />
            </div>
            <div className="flex space-x-3">
              <Button onClick={handleAddCustomChannel} disabled={!newChannelName.trim()}>
                Add Channel
              </Button>
              <Button variant="outline" onClick={() => setShowCustomForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={onNext}
          disabled={channels.length === 0}
          className=""
        >
          Next
        </Button>
      </div>
    </Card>
  );
}
