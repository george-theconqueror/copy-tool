# Copy Tool API Documentation

This document describes the API endpoints available in the Copy Tool application and how they integrate with the Google Drive functionality.

## Overview

The Copy Tool uses a service account-based Google Drive API integration to create text files in shared drives. All endpoints are located in the `/api` folder and handle Google Drive operations without requiring user authentication.

## API Endpoints

### 1. Google Drive API (`/api/google-drive`)

**Base URL:** `/api/google-drive`

#### GET - Fetch Workspaces
**Purpose:** Retrieves all available Google Drive workspaces (shared drives) that the service account can access.

**Request:**
```http
GET /api/google-drive
```

**Response:**
```json
{
  "success": true,
  "drives": [
    {
      "id": "0ANm8RG4TFLNhUk9PVA",
      "name": "Copy Tool Drive",
      "createdTime": "2025-09-01T12:42:38.650Z",
      "capabilities": {
        "canAddChildren": true,
        "canEdit": true,
        "canShare": true
      }
    }
  ],
  "message": "Workspaces fetched successfully"
}
```

**Used by:** `GoogleDriveButton` component to display available workspaces and their IDs.

#### POST - Create Text File
**Purpose:** Creates a new text file in the specified Google Drive workspace with test content.

**Request:**
```http
POST /api/google-drive
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "1ABC123DEF456GHI789JKL",
    "name": "test-file-1735732800000.txt",
    "link": "https://drive.google.com/file/d/1ABC123DEF456GHI789JKL/view",
    "size": "89",
    "createdTime": "2025-09-01T12:42:38.650Z"
  },
  "message": "File created successfully in Google Drive"
}
```

**Used by:** `GoogleDriveButton` component to create test files when the user clicks "Create Test File in Google Drive".

## Authentication

### Service Account Authentication
- **Type:** Google Service Account (JWT)
- **Scopes:** 
  - `https://www.googleapis.com/auth/drive.file` - File creation and management
  - `https://www.googleapis.com/auth/drive` - Broader Drive access
- **No user interaction required** - works immediately when app loads

### Required Environment Variables
```bash
# .env.local
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key content here\n-----END PRIVATE KEY-----\n"
GOOGLE_WORKSPACE_ID=your_workspace_id_here  # Optional, for specific workspace
```

## How It's Used in the App

### 1. GoogleDriveButton Component
The main component that provides the user interface for Google Drive operations:

- **Workspace Fetching:** Calls `GET /api/google-drive` to display available workspaces
- **File Creation:** Calls `POST /api/google-drive` to create test text files
- **Real-time Updates:** Shows loading states and success/error messages

### 2. App Integration
- **No authentication flow** - works immediately when app loads
- **Service account handles all operations** in the background
- **Files created in specified workspace** or service account's root Drive

## File Creation Process

1. **User clicks "Create Test File"**
2. **API creates file metadata** with workspace parent (if specified)
3. **File created with content** in single API call
4. **Response includes file details** and Google Drive link
5. **UI updates** to show success/error status

## Error Handling

### Common Error Responses

#### 401 - Authentication Failed
```json
{
  "error": "Authentication failed",
  "details": "Please check your service account credentials and permissions"
}
```

#### 403 - Permission Denied
```json
{
  "error": "Permission denied",
  "details": "Service account does not have permission to create files in Google Drive"
}
```

#### 500 - Server Error
```json
{
  "error": "Failed to create file in Google Drive",
  "details": "Specific error message"
}
```

## Security Features

- **Service account authentication** - no user credentials stored
- **Workspace isolation** - files only created in specified shared drives
- **Minimal required scopes** - follows principle of least privilege
- **Environment variable protection** - sensitive data not in code

## Development Notes

### Testing
- **Local development:** Uses `localhost:3000` as base URL
- **Workspace fetching:** Test with "Fetch My Workspaces" button
- **File creation:** Test with "Create Test File" button

### Debugging
- **Console logs** show workspace IDs and API responses
- **Network tab** displays all API calls and responses
- **Error messages** provide specific details about failures

### Dependencies
- **googleapis:** Google Drive API client library
- **Next.js API routes:** Server-side API handling
- **React hooks:** Client-side state management

## Future Enhancements

- **File upload support** for different file types
- **Folder creation** within workspaces
- **File management** (rename, delete, move)
- **Batch operations** for multiple files
- **User-specific file organization**

## Troubleshooting

### Common Issues

1. **"Service Accounts do not have storage quota"**
   - **Solution:** Use shared drives (workspaces) instead of personal Drive
   - **Fix:** Set `GOOGLE_WORKSPACE_ID` and add service account to workspace

2. **"Permission denied"**
   - **Solution:** Ensure service account has "Editor" access to workspace
   - **Fix:** Add service account email to workspace sharing settings

3. **"File not found"**
   - **Solution:** Verify workspace ID is correct
   - **Fix:** Use "Fetch My Workspaces" to get correct ID

4. **"Google service account credentials not configured"**
   - **Solution:** Check environment variables
   - **Fix:** Ensure `.env.local` has correct service account credentials
