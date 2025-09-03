# Google Drive API Repository

This repository contains functions for interacting with Google Drive API, providing comprehensive file and folder management capabilities, campaign creation, and AI-powered file analysis.

## Table of Contents

- [Authentication](#authentication)
- [File Operations](#file-operations)
- [Folder Operations](#folder-operations)
- [Path Management](#path-management)
- [Campaign Management](#campaign-management)
- [AI Integration](#ai-integration)
- [Utility Functions](#utility-functions)
- [Environment Variables](#environment-variables)
- [Error Handling](#error-handling)

## Authentication

### `getAuthClient()`
Creates Google authentication client using service account credentials.

**Input**: None (uses environment variables)
**Output**: JWT authentication client
**Environment Variables**: 
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`

### `getDriveClient()`
Creates authenticated Google Drive API client.

**Input**: None
**Output**: Google Drive API client instance
**Dependencies**: Uses `getAuthClient()` for authentication

## File Operations

### `createFileInPath(options: CreateFileOptions)`
Creates a file in a specific folder path within a workspace.

**Input**:
```typescript
{
  name: string;           // File name
  content: string;        // File content
  mimeType?: string;      // File type (default: 'text/plain')
  description?: string;   // File description
  workspaceId?: string;   // Workspace ID
  folderPath?: string;    // Target folder path
}
```

**Output**:
```typescript
{
  success: boolean;
  file: {
    id: string;
    name: string;
    link: string;
    size: string;
    createdTime: string;
    folderId: string;
    folderPath: string;
  };
  message: string;
}
```

### `createFileWithPath(options: CreateFileOptions)`
Utility function to create a file with automatic folder path creation.

**Input**: Same as `createFileInPath`
**Output**: Same as `createFileInPath`
**Dependencies**: Uses `ensureFolderPath()` and `createFileInPath()`

### `deleteFile(fileId: string, workspaceId?: string)`
Deletes a file from Google Drive by file ID.

**Input**:
- `fileId`: The ID of the file to delete
- `workspaceId`: Optional workspace ID for validation

**Output**:
```typescript
{
  success: boolean;
  deletedFile: {
    id: string;
    name: string;
    mimeType: string;
  };
  message: string;
}
```

### `deleteFileByPath(fileName: string, folderPath?: string, workspaceId?: string)`
Deletes a file by name and path (resolves path to find the file).

**Input**:
- `fileName`: Name of the file to delete
- `folderPath`: Path to the folder containing the file (optional, defaults to root)
- `workspaceId`: Optional workspace ID

**Output**:
```typescript
{
  success: boolean;
  deletedFile: {
    id: string;
    name: string;
    mimeType: string;
    path: string;
  };
  message: string;
}
```

## Folder Operations

### `createFolderInPath(options: CreateFolderOptions)`
Creates a folder in a specific path within a workspace.

**Input**:
```typescript
{
  name: string;              // Folder name
  description?: string;      // Folder description
  workspaceId?: string;      // Workspace ID
  parentFolderPath?: string; // Parent folder path
}
```

**Output**:
```typescript
{
  success: boolean;
  folder: {
    id: string;
    name: string;
    link: string;
    createdTime: string;
    parentFolderId: string;
    parentFolderPath: string;
    fullPath: string;
  };
  message: string;
}
```

### `getFoldersInPath(folderPath: string, workspaceId?: string)`
Retrieves all existing folders in a given path.

**Input**:
- `folderPath`: Path to search for folders (e.g., "Documents/Projects")
- `workspaceId`: Optional workspace ID

**Output**:
```typescript
{
  success: boolean;
  folder: {
    id: string;
    path: string;
  };
  folders: Array<Folder objects>;
  count: number;
  message: string;
}
```

## Path Management

### `resolveFolderPath(folderPath: string, workspaceId?: string)`
Resolves a folder path to a folder ID within a workspace.

**Input**:
- `folderPath`: Path like "Documents/Projects/2024"
- `workspaceId`: Optional workspace ID

**Output**:
```typescript
{
  folderId: string;    // Resolved folder ID
  path: string;        // Full path
  exists: boolean;     // Whether folder exists
}
```

### `ensureFolderPath(folderPath: string, workspaceId?: string)`
Creates a complete folder path if it doesn't exist.

**Input**:
- `folderPath`: Path like "Documents/Projects/2024"
- `workspaceId`: Optional workspace ID

**Output**:
```typescript
{
  folderId: string;        // Final folder ID
  path: string;           // Full path
  exists: boolean;        // Always true after execution
  created: boolean;       // Whether any folders were created
  createdFolders: string[]; // Names of created folders
}
```

## Content Listing

### `listFolderContents(folderPath: string, workspaceId?: string)`
Lists all files and folders in a specific path.

**Input**:
- `folderPath`: Path to list contents from
- `workspaceId`: Optional workspace ID

**Output**:
```typescript
{
  success: boolean;
  folder: {
    id: string;
    path: string;
  };
  contents: Array<{
    id: string;
    name: string;
    mimeType: string;
    size: string;
    createdTime: string;
    webViewLink: string;
  }>;
  message: string;
}
```

### `listRootContents(workspaceId?: string)`
Lists all files and folders in the root of a workspace.

**Input**:
- `workspaceId`: Optional workspace ID

**Output**:
```typescript
{
  success: boolean;
  workspace: {
    id: string;
    path: string;
  };
  contents: Array<File/Folder objects>;
  message: string;
}
```

### `listRootFiles(workspaceId?: string)`
Fetches all files (excluding folders) in the root folder of a workspace.

**Input**:
- `workspaceId`: Optional workspace ID

**Output**:
```typescript
{
  success: boolean;
  workspace: {
    id: string;
    path: string;
  };
  files: Array<File objects>;
  message: string;
}
```

## Campaign Management

### `createCampaign(campaignData, workspaceId?: string)`
Creates a complete campaign folder structure in Google Drive.

**Input**:
```typescript
{
  challengeName: string;
  files: Array<{
    name: string;
    type: string;
    size: number;
    buffer: Buffer;
  }>;
  channels: Array<{
    name: string;
    description?: string;
  }>;
  touchpoints: Array<{
    id: number;
    name: string;
    channel: string;
    purpose: string;
  }>;
}
```

**Output**:
```typescript
{
  success: boolean;
  campaign: {
    challengeName: string;
    challengeFolder: Folder object;
    dataFolder: Folder object;
    channels: Array<{
      id: string;
      name: string;
      link: string;
      touchpoints: Array<Touchpoint objects>;
    }>;
    uploadedFiles: Array<File objects>;
    totalFolders: number;
    totalFiles: number;
  };
  message: string;
}
```

**Creates Structure**:
```
[Challenge Name]/
├── Data/                    # Uploaded files
├── [Channel 1]/            # e.g., "Organic"
│   ├── [Touchpoint 1]/     # e.g., "Teaser"
│   └── [Touchpoint 2]/     # e.g., "Announcement"
└── [Channel 2]/            # e.g., "Email"
    ├── [Touchpoint 1]/     # e.g., "Welcome Email"
    └── [Touchpoint 2]/     # e.g., "Follow-up"
```

### `getCampaigns(workspaceId?: string)`
Retrieves all campaign folders from the root directory with their channel folders.

**Input**:
- `workspaceId`: Optional workspace ID

**Output**:
```typescript
{
  success: boolean;
  campaigns: Array<{
    id: string;
    name: string;
    mimeType: string;
    createdTime: string;
    modifiedTime: string;
    webViewLink: string;
    parents: string[];
    channels: string[];      // Channel folder names
    channelCount: number;    // Number of channels
  }>;
  totalCampaigns: number;
  message: string;
}
```

**Features**:
- Filters out "Global" folder from results
- Excludes "Data" folder from channel list
- Provides channel information for each campaign

## AI Integration

### `analyzeFileWithAI(fileId: string, prompt: string)`
Analyzes a Google Drive file using OpenAI.

**Input**:
- `fileId`: The ID of the file to analyze
- `prompt`: The prompt/question for analysis

**Output**:
```typescript
{
  success: boolean;
  analysis: string;        // AI analysis result
  fileName: string;
  fileType: string;
  prompt: string;
  message: string;
}
```

**Environment Variables**: `OPENAI_API_KEY`

**Features**:
- Downloads file content from Google Drive
- Sends content to OpenAI GPT-4o-mini model
- Returns comprehensive analysis based on user prompt
- Handles various file types (text files work best)

## Environment Variables

Required environment variables for the repository to function:

```bash
# Google Drive API
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_WORKSPACE_ID=your-workspace-id

# OpenAI API (for file analysis)
OPENAI_API_KEY=sk-your-openai-api-key
```

## Error Handling

All functions include comprehensive error handling:

- **Try-catch blocks** around all API calls
- **Detailed error logging** with context
- **Graceful degradation** for partial failures
- **Consistent error response format**
- **Input validation** for required parameters

## Usage Examples

### Creating a Campaign
```typescript
import { createCampaign } from './drive';

const campaignData = {
  challengeName: "Summer Sale 2024",
  files: [
    {
      name: "brief.pdf",
      type: "application/pdf",
      size: 1024,
      buffer: fileBuffer
    }
  ],
  channels: [
    { name: "Organic", description: "Organic marketing channel" },
    { name: "Email", description: "Email marketing channel" }
  ],
  touchpoints: [
    { id: 1, name: "Teaser", channel: "Organic", purpose: "Create anticipation" },
    { id: 2, name: "Welcome Email", channel: "Email", purpose: "Onboard new users" }
  ]
};

const result = await createCampaign(campaignData);
```

### Analyzing a File
```typescript
import { analyzeFileWithAI } from './drive';

const analysis = await analyzeFileWithAI(
  "file-id-123",
  "Analyze this document and provide key insights"
);
```

### Getting Campaigns
```typescript
import { getCampaigns } from './drive';

const campaigns = await getCampaigns();
console.log(`Found ${campaigns.totalCampaigns} campaigns`);
```

## Dependencies

- `googleapis`: Google APIs client library
- `openai`: OpenAI API client
- `stream`: Node.js stream utilities

## License

This repository is part of the Copy Tool project and follows the same licensing terms.
