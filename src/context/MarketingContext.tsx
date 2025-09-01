'use client';

import  { createContext, useState, ReactNode } from 'react';

// Define the data structure types
interface Channel {
  name: string;
  description?: string;
}

interface Touchpoint {
    name: string;
    channel: string;
    purpose: string;
}



interface CampaignState {
  marketing_deck_id: string | null;
  copy_strategy_id: string | null;
  channels: Channel[];
  touchpoints: Touchpoint[];
}

interface MarketingContextType {
  data: CampaignState;
  addChannel: (channel: Channel) => void;
  removeChannel: (id: string) => void;
  addTouchpoint: (touchpoint: Touchpoint) => void;
  removeTouchpoint: (name: string, channel_name: string) => void;
  resetState: () => void;
}


// Initial state
const initialState: CampaignState = {
  marketing_deck_id: null,
  copy_strategy_id: null,
  channels: [],
  touchpoints: [],
};

// Create the context
const MarketingContext = createContext<MarketingContextType | undefined>(undefined);

// Provider component
export const MarketingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setState] = useState<CampaignState>(initialState);

 
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

  const addTouchpoint = (touchpoint: Touchpoint) => {
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

