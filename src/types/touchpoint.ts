// Base touchpoint interface for predefined touchpoint data
export interface BaseTouchpoint {
  id: number;
  name: string;
  channel: string;
  purpose: string;
}

// Touchpoint metadata from Google Drive API
export interface DriveTouchpoint {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink: string;
}

// Text file structure within a touchpoint
export interface TouchpointTextFile {
  id: string;
  name: string;
  content: string | null;
  mimeType: string;
  size: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink: string;
  error?: string;
}

// Complete touchpoint with content and files
export interface TouchpointWithContent {
  id: string;
  name: string;
  files: any[];
  textFiles: TouchpointTextFile[];
  fileCount: number;
  textFileCount: number;
  error?: string;
}

// Channel with touchpoints (for campaign structure)
export interface ChannelWithTouchpoints extends DriveTouchpoint {
  touchpoints: DriveTouchpoint[];
  touchpointCount: number;
}

// Campaign response structure
export interface CampaignResponse {
  success: boolean;
  campaign: {
    name: string;
    id: string;
  };
  channel: {
    name: string;
    id: string;
  };
  touchpoints: TouchpointWithContent[];
  totalTouchpoints: number;
  totalFiles: number;
  totalTextFiles: number;
  message: string;
}

// Touchpoint content props for components
export interface TouchpointContentProps {
  challengeName: string;
  channelName: string;
  workspaceId?: string;
}

// Touchpoint selector props
export interface TouchpointSelectorProps {
  selectedChannels: string[];
  selectedTouchpoints: BaseTouchpoint[];
  onTouchpointToggle: (touchpoint: BaseTouchpoint) => void;
  onNext: () => void;
  onBack: () => void;
}

// Campaign state interface
export interface CampaignState {
  marketing_deck_id: string | null;
  copy_strategy_id: string | null;
  challengeName: string;
  files: File[];
  links: string[];
  channels: Array<{
    name: string;
    description?: string;
  }>;
  touchpoints: BaseTouchpoint[];
}

// Type aliases for backward compatibility
export type Touchpoint = BaseTouchpoint;
export type TouchpointContentData = CampaignResponse;
