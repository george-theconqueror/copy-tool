'use client';

import  { createContext, useState, ReactNode } from 'react';

// Define the data structure types
interface Channel {
  name: string;
  description?: string;
}

import { BaseTouchpoint } from '@/types/touchpoint';



interface CampaignState {
  marketing_deck_id: string | null;
  copy_strategy_id: string | null;
  challengeName: string;
  files: File[];
  links: string[];
  channels: Channel[];
  touchpoints: BaseTouchpoint[];
}

interface MarketingContextType {
  data: CampaignState;
  setChallengeName: (name: string) => void;
  setFiles: (files: File[]) => void;
  setLinks: (links: string[]) => void;
  addChannel: (channel: Channel) => void;
  removeChannel: (id: string) => void;
  addTouchpoint: (touchpoint: BaseTouchpoint) => void;
  removeTouchpoint: (name: string, channel_name: string) => void;
  resetState: () => void;
}


// Initial state
const initialState: CampaignState = {
  marketing_deck_id: null,
  copy_strategy_id: null,
  challengeName: '',
  files: [],
  links: [],
  channels: [],
  touchpoints: [],
};

// Create the context
export const MarketingContext = createContext<MarketingContextType | undefined>(undefined);

// Provider component
export const MarketingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setState] = useState<CampaignState>(initialState);

  const setChallengeName = (name: string) => {
    setState(prev => ({ ...prev, challengeName: name }));
  };

  const setFiles = (files: File[]) => {
    setState(prev => ({ ...prev, files }));
  };

  const setLinks = (links: string[]) => {
    setState(prev => ({ ...prev, links }));
  };
 
  const addChannel = (channel: Channel) => {
    setState(prev => ({ ...prev, channels: [...prev.channels, channel] }));
  };

  const removeChannel = (name: string) => {
    setState(prev => ({ 
      ...prev, 
      channels: prev.channels.filter(channel => channel.name !== name),
      touchpoints: prev.touchpoints.filter(touchpoint => touchpoint.channel!== name)
    }));
  };

  const addTouchpoint = (touchpoint: BaseTouchpoint) => {
    setState(prev => ({ ...prev, touchpoints: [...prev.touchpoints, touchpoint] }));
  };

  const removeTouchpoint = (name: string, channel_name: string) => {
    setState(prev => ({ 
      ...prev, 
      touchpoints: prev.touchpoints.filter(touchpoint => touchpoint.channel !== channel_name || touchpoint.name !== name)
    }));
  };

  

  const resetState = () => {
    setState(initialState);
  };

  const contextValue: MarketingContextType = {
    data,
    setChallengeName,
    setFiles,
    setLinks,
    addChannel,
    removeChannel,
    addTouchpoint,
    removeTouchpoint,
    resetState,
  };

  return (
    <MarketingContext.Provider value={contextValue}>
      {children}
    </MarketingContext.Provider>
  );
};

