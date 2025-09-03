import { google } from 'googleapis';
import { Readable } from 'stream';

// Google Drive API configuration
const SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/presentations.readonly',
        'https://www.googleapis.com/auth/documents.readonly',
        'https://www.googleapis.com/auth/spreadsheets.readonly'];

// Service account authentication
const getAuthClient = () => {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('Google service account credentials not configured');
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES,
  });
};

// Get Google Drive client
const getDriveClient = () => {
  const auth = getAuthClient();
  return google.drive({ version: 'v3', auth });
};

// Helper function to detect link type
const getLinkType = (url: string) => {
  if (url.includes('/document/')) return 'Google Doc';
  if (url.includes('/presentation/')) return 'Google Slides';
  if (url.includes('/spreadsheets/')) return 'Google Sheets';
  if (url.includes('/forms/')) return 'Google Form';
  return 'Google Link';
};

// Interface for file creation options
export interface CreateFileOptions {
  name: string;
  content: string;
  mimeType?: string;
  description?: string;
  workspaceId?: string;
  folderPath?: string; // e.g., "Documents/Projects/2024"
}

// Interface for folder creation options
export interface CreateFolderOptions {
  name: string;
  description?: string;
  workspaceId?: string;
  parentFolderPath?: string; // e.g., "Documents/Projects"
}

// Interface for path resolution result
export interface PathResolution {
  folderId: string;
  path: string;
  exists: boolean;
}

/**
 * Creates a file in a specific folder path within a workspace
 * @param options - File creation options
 * @returns Created file details
 */
export const createFileInPath = async (options: CreateFileOptions) => {
  try {
    const drive = getDriveClient();
    const { name, content, mimeType = 'text/plain', description, workspaceId, folderPath } = options;

    // Resolve the folder path to get the target folder ID
    const targetFolder = await resolveFolderPath(folderPath || '', workspaceId);
    
    if (!targetFolder.exists) {
      throw new Error(`Target folder path '${folderPath}' does not exist`);
    }

    // Create file metadata
    const fileMetadata: any = {
      name,
      mimeType,
      description: description || `File created via Copy Tool`,
      parents: [targetFolder.folderId],
      // Make file publicly accessible for external APIs
      permissions: [{
        type: 'anyone',
        role: 'reader',
        allowFileDiscovery: false
      }]
    };

    // Create the file with content
    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType,
        body: content,
      },
      fields: 'id,name,webViewLink,size,createdTime,parents',
      supportsAllDrives: true,
    });

    return {
      success: true,
      file: {
        id: file.data.id,
        name: file.data.name,
        link: file.data.webViewLink,
        size: file.data.size,
        createdTime: file.data.createdTime,
        folderId: targetFolder.folderId,
        folderPath: targetFolder.path,
      },
      message: `File created successfully in ${targetFolder.path}`,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Creates a folder in a specific path within a workspace
 * @param options - Folder creation options
 * @returns Created folder details
 */
export const createFolderInPath = async (options: CreateFolderOptions) => {
  try {
    const drive = getDriveClient();
    const { name, description, workspaceId, parentFolderPath } = options;

    // Resolve the parent folder path
    const parentFolder = await resolveFolderPath(parentFolderPath || '', workspaceId);
    
    if (!parentFolder.exists) {
      throw new Error(`Parent folder path '${parentFolderPath}' does not exist`);
    }

    // Create folder metadata
    const folderMetadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      description: description || `Folder created via Copy Tool`,
      parents: [parentFolder.folderId],
    };

    // Create the folder
    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id,name,webViewLink,createdTime,parents',
      supportsAllDrives: true,
    });

    return {
      success: true,
      folder: {
        id: folder.data.id,
        name: folder.data.name,
        link: folder.data.webViewLink,
        createdTime: folder.data.createdTime,
        parentFolderId: parentFolder.folderId,
        parentFolderPath: parentFolder.path,
        fullPath: `${parentFolder.path}/${name}`,
      },
      message: `Folder created successfully in ${parentFolder.path}`,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Resolves a folder path to a folder ID within a workspace
 * @param folderPath - Path like "Documents/Projects/2024"
 * @param workspaceId - Optional workspace ID, defaults to environment variable
 * @returns Folder ID and path information
 */
export const resolveFolderPath = async (folderPath: string, workspaceId?: string): Promise<PathResolution> => {
  try {
    const drive = getDriveClient();
    const targetWorkspaceId = workspaceId || process.env.GOOGLE_WORKSPACE_ID;

    if (!targetWorkspaceId) {
      throw new Error('No workspace ID specified');
    }

    // If no path specified, return the workspace root
    if (!folderPath || folderPath.trim() === '') {
      return {
        folderId: targetWorkspaceId,
        path: '/',
        exists: true,
      };
    }

    // Split the path into folder names
    const folderNames = folderPath.split('/').filter((name: string) => name.trim() !== '');
    
    if (folderNames.length === 0) {
      return {
        folderId: targetWorkspaceId,
        path: '/',
        exists: true,
      };
    }

    let currentFolderId = targetWorkspaceId;
    let currentPath = '';

    // Navigate through each folder in the path
    for (const folderName of folderNames) {
      currentPath += `/${folderName}`;
      
      // Search for the folder in the current parent
      const searchQuery = `'${currentFolderId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      
      const searchResult = await drive.files.list({
        q: searchQuery,
        fields: 'files(id,name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      if (searchResult.data.files && searchResult.data.files.length > 0) {
        // Folder exists, continue to next level
        currentFolderId = searchResult.data.files[0].id!;
      } else {
        // Folder doesn't exist
        return {
          folderId: '',
          path: currentPath,
          exists: false,
        };
      }
    }

    return {
      folderId: currentFolderId,
      path: currentPath,
      exists: true,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Creates a complete folder path if it doesn't exist
 * @param folderPath - Path like "Documents/Projects/2024"
 * @param workspaceId - Optional workspace ID
 * @returns Created folder details
 */
export const ensureFolderPath = async (folderPath: string, workspaceId?: string) => {
  try {
    const drive = getDriveClient();
    const targetWorkspaceId = workspaceId || process.env.GOOGLE_WORKSPACE_ID;

    if (!targetWorkspaceId) {
      throw new Error('No workspace ID specified');
    }

    // If no path specified, return the workspace root
    if (!folderPath || folderPath.trim() === '') {
      return {
        folderId: targetWorkspaceId,
        path: '/',
        exists: true,
        created: false,
      };
    }

    // Split the path into folder names
    const folderNames = folderPath.split('/').filter((name: string) => name.trim() !== '');
    
    if (folderNames.length === 0) {
      return {
        folderId: targetWorkspaceId,
        path: '/',
        exists: true,
        created: false,
      };
    }

    let currentFolderId = targetWorkspaceId;
    let currentPath = '';
    const createdFolders: string[] = [];

    // Navigate through each folder in the path
    for (const folderName of folderNames) {
      currentPath += `/${folderName}`;
      
      // Search for the folder in the current parent
      const searchQuery = `'${currentFolderId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      
      const searchResult = await drive.files.list({
        q: searchQuery,
        fields: 'files(id,name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      if (searchResult.data.files && searchResult.data.files.length > 0) {
        // Folder exists, continue to next level
        currentFolderId = searchResult.data.files[0].id!;
      } else {
        // Folder doesn't exist, create it
        const folderMetadata = {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          description: `Auto-created folder for path: ${currentPath}`,
          parents: [currentFolderId],
        };

        const newFolder = await drive.files.create({
          requestBody: folderMetadata,
          fields: 'id,name',
          supportsAllDrives: true,
        });

        currentFolderId = newFolder.data.id!;
        createdFolders.push(folderName);
      }
    }

    return {
      folderId: currentFolderId,
      path: currentPath,
      exists: true,
      created: createdFolders.length > 0,
      createdFolders,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Lists all files and folders in a specific path
 * @param folderPath - Path to list contents from
 * @param workspaceId - Optional workspace ID
 * @returns List of files and folders
 */
export const listFolderContents = async (folderPath: string, workspaceId?: string) => {
  try {
    const drive = getDriveClient();
    const targetWorkspaceId = workspaceId || process.env.GOOGLE_WORKSPACE_ID;

    if (!targetWorkspaceId) {
      throw new Error('No workspace ID specified');
    }

    // Resolve the folder path
    const folder = await resolveFolderPath(folderPath, targetWorkspaceId);
    
    if (!folder.exists) {
      throw new Error(`Folder path '${folderPath}' does not exist`);
    }

    // List contents of the folder
    const result = await drive.files.list({
      q: `'${folder.folderId}' in parents and trashed=false`,
      fields: 'files(id,name,mimeType,size,createdTime,webViewLink)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    return {
      success: true,
      folder: {
        id: folder.folderId,
        path: folder.path,
      },
      contents: result.data.files || [],
      message: `Contents of ${folder.path}`,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Lists all files and folders in the root of a workspace
 * @param workspaceId - Optional workspace ID, defaults to environment variable
 * @returns List of files and folders in the root
 */
export const listRootContents = async (workspaceId?: string) => {
  try {
    const drive = getDriveClient();
    const targetWorkspaceId = workspaceId || process.env.GOOGLE_WORKSPACE_ID;

    if (!targetWorkspaceId) {
      throw new Error('No workspace ID specified');
    }

    // List contents of the workspace root
    const result = await drive.files.list({
      q: `'${targetWorkspaceId}' in parents and trashed=false`,
      fields: 'files(id,name,mimeType,size,createdTime,webViewLink,parents)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      orderBy: 'name',
    });

    return {
      success: true,
      workspace: {
        id: targetWorkspaceId,
        path: '/',
      },
      contents: result.data.files || [],
      message: 'Contents of workspace root',
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Fetches all files in the root folder of a workspace
 * @param workspaceId - Optional workspace ID, defaults to environment variable
 * @returns List of files (excluding folders) in the root
 */
export const listRootFiles = async (workspaceId?: string) => {
  try {
    const drive = getDriveClient();
    const targetWorkspaceId = workspaceId || process.env.GOOGLE_WORKSPACE_ID;

    if (!targetWorkspaceId) {
      throw new Error('No workspace ID specified');
    }

    // List only files (excluding folders) in the workspace root
    const result = await drive.files.list({
      q: `'${targetWorkspaceId}' in parents and trashed=false and mimeType!='application/vnd.google-apps.folder'`,
      fields: 'files(id,name,mimeType,size,createdTime,webViewLink,parents,description)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      orderBy: 'name',
    });

    return {
      success: true,
      workspace: {
        id: targetWorkspaceId,
        path: '/',
      },
      files: result.data.files || [],
      message: 'Files in workspace root',
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Analyzes a Google Drive file using OpenAI
 * @param fileId - The ID of the file to analyze
 * @param prompt - The prompt/question for analysis
 * @returns Analysis result from OpenAI
 */
export const analyzeFileWithAI = async (fileId: string, prompt: string) => {
  try {
    const drive = getDriveClient();
    
    // Get file info and download content
    const fileInfo = await drive.files.get({
      fileId: fileId,
      fields: 'id,name,mimeType,size',
      supportsAllDrives: true,
    });

    // Download file content
    const fileContent = await drive.files.get({
      fileId: fileId,
      alt: 'media',
      supportsAllDrives: true,
    });

    // Convert content to string
    const content = fileContent.data as string;
    
    // Use OpenAI to analyze the content
    const openai = new (await import('openai')).default({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const analysis = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant that analyzes files and provides insights based on user prompts.'
        },
        {
          role: 'user',
          content: `File: ${fileInfo.data.name}\nFile Type: ${fileInfo.data.mimeType}\n\nContent:\n${content}\n\nUser Question: ${prompt}\n\nPlease provide a comprehensive analysis and insights based on the file content and the user's question.`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return {
      success: true,
      analysis: analysis.choices[0]?.message?.content || 'No analysis generated',
      fileName: fileInfo.data.name,
      fileType: fileInfo.data.mimeType,
      prompt: prompt,
      message: 'File analyzed successfully with AI',
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Deletes a file from Google Drive by file ID
 * @param fileId - The ID of the file to delete
 * @param workspaceId - Optional workspace ID for validation
 * @returns Deletion result
 */
export const deleteFile = async (fileId: string, workspaceId?: string) => {
  try {
    const drive = getDriveClient();
    const targetWorkspaceId = workspaceId || process.env.GOOGLE_WORKSPACE_ID;

    if (!targetWorkspaceId) {
      throw new Error('No workspace ID specified');
    }

    if (!fileId || typeof fileId !== 'string') {
      throw new Error('Valid file ID is required');
    }

    // First, get file info to validate it exists and get its name
    const fileInfo = await drive.files.get({
      fileId: fileId,
      fields: 'id,name,mimeType,parents',
      supportsAllDrives: true,
    });

    if (!fileInfo.data.id) {
      throw new Error('File not found');
    }

    // Delete the file (moves to trash by default)
    await drive.files.delete({
      fileId: fileId,
      supportsAllDrives: true,
    });

    return {
      success: true,
      deletedFile: {
        id: fileInfo.data.id,
        name: fileInfo.data.name || 'Unknown file',
        mimeType: fileInfo.data.mimeType || 'Unknown type',
      },
      message: `File "${fileInfo.data.name || 'Unknown'}" deleted successfully`,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Deletes a file by name and path (resolves path to find the file)
 * @param fileName - Name of the file to delete
 * @param folderPath - Path to the folder containing the file (optional, defaults to root)
 * @param workspaceId - Optional workspace ID
 * @returns Deletion result
 */
export const deleteFileByPath = async (fileName: string, folderPath?: string, workspaceId?: string) => {
  try {
    const drive = getDriveClient();
    const targetWorkspaceId = workspaceId || process.env.GOOGLE_WORKSPACE_ID;

    if (!targetWorkspaceId) {
      throw new Error('No workspace ID specified');
    }

    if (!fileName || typeof fileName !== 'string') {
      throw new Error('Valid file name is required');
    }

    let searchQuery: string;

    if (folderPath && folderPath.trim() !== '') {
      // Search in specific folder path
      const targetFolder = await resolveFolderPath(folderPath, targetWorkspaceId);
      
      if (!targetFolder.exists) {
        throw new Error(`Target folder path '${folderPath}' does not exist`);
      }

      searchQuery = `'${targetFolder.folderId}' in parents and name='${fileName}' and trashed=false`;
    } else {
      // Search in workspace root
      searchQuery = `'${targetWorkspaceId}' in parents and name='${fileName}' and trashed=false`;
    }

    // Find the file
    const searchResult = await drive.files.list({
      q: searchQuery,
      fields: 'files(id,name,mimeType,parents)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    if (!searchResult.data.files || searchResult.data.files.length === 0) {
      throw new Error(`File '${fileName}' not found in ${folderPath || 'root'}`);
    }

    if (searchResult.data.files.length > 1) {
      throw new Error(`Multiple files found with name '${fileName}' in ${folderPath || 'root'}. Please use file ID for deletion.`);
    }

    const fileToDelete = searchResult.data.files[0];

    // Delete the file
    await drive.files.delete({
      fileId: fileToDelete.id!,
      supportsAllDrives: true,
    });

    return {
      success: true,
      deletedFile: {
        id: fileToDelete.id,
        name: fileToDelete.name || 'Unknown file',
        mimeType: fileToDelete.mimeType || 'Unknown type',
        path: folderPath || 'root',
      },
      message: `File "${fileToDelete.name || 'Unknown'}" deleted successfully from ${folderPath || 'root'}`,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Retrieves all existing folders in a given path
 * @param folderPath - Path to search for folders (e.g., "Documents/Projects")
 * @param workspaceId - Optional workspace ID, defaults to environment variable
 * @returns List of folders in the specified path
 */
export const getFoldersInPath = async (folderPath: string, workspaceId?: string) => {
  try {
    const drive = getDriveClient();
    const targetWorkspaceId = workspaceId || process.env.GOOGLE_WORKSPACE_ID;

    if (!targetWorkspaceId) {
      throw new Error('No workspace ID specified');
    }

    // Resolve the folder path to get the target folder ID
    const targetFolder = await resolveFolderPath(folderPath, targetWorkspaceId);
    
    if (!targetFolder.exists) {
      throw new Error(`Target folder path '${folderPath}' does not exist`);
    }

    // Search for folders only in the specified path
    const searchQuery = `'${targetFolder.folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    
    const result = await drive.files.list({
      q: searchQuery,
      fields: 'files(id,name,mimeType,createdTime,modifiedTime,webViewLink,parents)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      orderBy: 'name',
    });

    return {
      success: true,
      folder: {
        id: targetFolder.folderId,
        path: targetFolder.path,
      },
      folders: result.data.files || [],
      count: result.data.files?.length || 0,
      message: `Found ${result.data.files?.length || 0} folders in ${targetFolder.path}`,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Utility function to create a file with automatic folder path creation
 * @param options - File creation options
 * @returns Created file details
 */
export const createFileWithPath = async (options: CreateFileOptions) => {
  try {
    // Ensure the folder path exists
    if (options.folderPath) {
      await ensureFolderPath(options.folderPath, options.workspaceId);
    }

    // Create the file in the path
    return await createFileInPath(options);
  } catch (error) {
    throw error;
  }
};

/**
 * Creates a complete campaign folder structure in Google Drive
 * @param campaignData - Campaign data from MarketingContext
 * @param workspaceId - Optional workspace ID, defaults to environment variable
 * @returns Created campaign structure details
 */
export const createCampaign = async (campaignData: {
  challengeName: string;
  files: Array<{ name: string; type: string; size: number; buffer: Buffer }>;
  links: string[];
  channels: Array<{ name: string; description?: string }>;
  touchpoints: Array<{ id: number; name: string; channel: string; purpose: string }>;
}, workspaceId?: string) => {
  try {
    const drive = getDriveClient();
    const targetWorkspaceId = workspaceId || process.env.GOOGLE_WORKSPACE_ID;

    if (!targetWorkspaceId) {
      throw new Error('No workspace ID specified');
    }

    if (!campaignData.challengeName.trim()) {
      throw new Error('Challenge name is required');
    }

    const results = {
      challengeFolder: null as any,
      dataFolder: null as any,
      channelFolders: [] as any[],
      touchpointFolders: [] as any[],
      uploadedFiles: [] as any[]
    };

    // Step 1: Create main challenge folder in root
    const challengeFolder = await drive.files.create({
      requestBody: {
        name: campaignData.challengeName,
        mimeType: 'application/vnd.google-apps.folder',
        description: `Campaign folder for: ${campaignData.challengeName}`,
        parents: [targetWorkspaceId],
      },
      fields: 'id,name,webViewLink',
      supportsAllDrives: true,
    });

    results.challengeFolder = {
      id: challengeFolder.data.id,
      name: challengeFolder.data.name,
      link: challengeFolder.data.webViewLink,
    };

    // Step 2: Create "Data" folder inside challenge folder
    const dataFolder = await drive.files.create({
      requestBody: {
        name: 'Data',
        mimeType: 'application/vnd.google-apps.folder',
        description: 'Uploaded files and campaign data',
        parents: [challengeFolder.data.id!],
      },
      fields: 'id,name,webViewLink',
      supportsAllDrives: true,
    });

    results.dataFolder = {
      id: dataFolder.data.id,
      name: dataFolder.data.name,
      link: dataFolder.data.webViewLink,
    };

    // Step 3: Upload files to Data folder
    if (campaignData.files.length > 0) {
      for (const file of campaignData.files) {
        try {
          const uploadedFile = await drive.files.create({
            requestBody: {
              name: file.name,
              mimeType: file.type || 'application/octet-stream',
              description: `Uploaded file for campaign: ${campaignData.challengeName}`,
              parents: [dataFolder.data.id!],
            },
            media: {
              mimeType: file.type || 'application/octet-stream',
              body: Readable.from(file.buffer),
            },
            fields: 'id,name,webViewLink,size',
            supportsAllDrives: true,
          });

          results.uploadedFiles.push({
            id: uploadedFile.data.id,
            name: uploadedFile.data.name,
            link: uploadedFile.data.webViewLink,
            size: uploadedFile.data.size,
          });
        } catch (fileError) {
          console.error(`Error uploading file ${file.name}:`, fileError);
          // Continue with other files even if one fails
        }
      }
    }

    // Step 3.5: Export Google Docs/Presentations as PDF files
    if (campaignData.links && campaignData.links.length > 0) {
      for (const link of campaignData.links) {
        try {
          // Extract file ID from Google Docs URL using multiple patterns
          const patterns = [
            /\/presentation\/d\/([a-zA-Z0-9-_]+)/, // Google Slides
            /\/document\/d\/([a-zA-Z0-9-_]+)/,     // Google Docs
            /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/, // Google Sheets
            /\/drawings\/d\/([a-zA-Z0-9-_]+)/,     // Google Drawings
            /\/file\/d\/([a-zA-Z0-9-_]+)/,         // Generic Drive file
            /\/d\/([a-zA-Z0-9_-]+)/,               // Fallback pattern
            /id=([a-zA-Z0-9-_]+)/                  // Alternative format
          ];

          let fileIdMatch = null;
          for (const pattern of patterns) {
            fileIdMatch = link.match(pattern);
            if (fileIdMatch) break;
          }
          if (fileIdMatch) {
            const originalFileId = fileIdMatch[1];
            const linkType = getLinkType(link);
            
            // Export the original document as PDF using the correct method
            const exportedContent = await drive.files.export({
              fileId: originalFileId,
              mimeType: 'application/pdf',
            }, {
              responseType: 'stream'
            });

            // Convert stream to buffer using proper stream handling
            const chunks: Buffer[] = [];
            const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
              (exportedContent.data as any).on('data', (chunk: Buffer) => {
                chunks.push(chunk);
              });
              
              (exportedContent.data as any).on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve(buffer);
              });
              
              (exportedContent.data as any).on('error', (error: Error) => {
                reject(new Error(`Export stream error: ${error.message}`));
              });
            });

            // Upload the exported PDF to Data folder
            const pdfFile = await drive.files.create({
              requestBody: {
                name: `Copy - ${linkType} - ${originalFileId.substring(0, 8)}.pdf`,
                mimeType: 'application/pdf',
                description: `PDF export of ${linkType}: ${link}`,
                parents: [dataFolder.data.id!],
              },
              media: {
                mimeType: 'application/pdf',
                body: Readable.from(pdfBuffer),
              },
              fields: 'id,name,webViewLink,size',
              supportsAllDrives: true,
            });

            results.uploadedFiles.push({
              id: pdfFile.data.id,
              name: pdfFile.data.name,
              link: pdfFile.data.webViewLink,
              size: pdfFile.data.size,
              type: 'exported-pdf',
              originalUrl: link,
              originalType: linkType,
            });
          } else {
            console.warn(`Could not extract file ID from link: ${link}`);
          }
        } catch (error) {
          console.error(`Error exporting ${link} as PDF:`, error);
          // Continue with other links even if one fails
        }
      }
    }

    // Step 4: Create channel folders
    for (const channel of campaignData.channels) {
      const channelFolder = await drive.files.create({
        requestBody: {
          name: channel.name,
          mimeType: 'application/vnd.google-apps.folder',
          description: channel.description || `Channel folder for ${channel.name}`,
          parents: [challengeFolder.data.id!],
        },
        fields: 'id,name,webViewLink',
        supportsAllDrives: true,
      });

      const channelFolderData = {
        id: channelFolder.data.id,
        name: channelFolder.data.name,
        link: channelFolder.data.webViewLink,
        touchpoints: [] as any[]
      };

      // Step 5: Create touchpoint folders for this channel
      const channelTouchpoints = campaignData.touchpoints
        .filter(tp => tp.channel === channel.name)
        .sort((a, b) => a.id - b.id);

      for (const touchpoint of channelTouchpoints) {
        const touchpointFolder = await drive.files.create({
          requestBody: {
            name: touchpoint.name,
            mimeType: 'application/vnd.google-apps.folder',
            description: touchpoint.purpose,
            parents: [channelFolder.data.id!],
          },
          fields: 'id,name,webViewLink',
          supportsAllDrives: true,
        });

        channelFolderData.touchpoints.push({
          id: touchpoint.id,
          name: touchpoint.name,
          folderId: touchpointFolder.data.id,
          folderName: touchpointFolder.data.name,
          link: touchpointFolder.data.webViewLink,
          purpose: touchpoint.purpose,
        });
      }

      results.channelFolders.push(channelFolderData);
    }

    return {
      success: true,
      campaign: {
        challengeName: campaignData.challengeName,
        challengeFolder: results.challengeFolder,
        dataFolder: results.dataFolder,
        channels: results.channelFolders,
        uploadedFiles: results.uploadedFiles,
        totalFolders: 1 + 1 + results.channelFolders.length + results.touchpointFolders.length, // challenge + data + channels + touchpoints
        totalFiles: results.uploadedFiles.length,
      },
      message: `Campaign "${campaignData.challengeName}" created successfully with ${results.channelFolders.length} channels and ${results.uploadedFiles.length} uploaded files`,
    };

  } catch (error) {
    throw error;
  }
};

/**
 * Retrieves all campaign folders from the root directory with their channel folders
 * Filters out the "Global" folder from the results
 * @param workspaceId - Optional workspace ID, defaults to environment variable
 * @returns List of campaign folders with their channel information
 */
export const getCampaigns = async (workspaceId?: string) => {
  try {
    const drive = getDriveClient();
    const targetWorkspaceId = workspaceId || process.env.GOOGLE_WORKSPACE_ID;

    if (!targetWorkspaceId) {
      throw new Error('No workspace ID specified');
    }

    // List all folders in the workspace root
    const result = await drive.files.list({
      q: `'${targetWorkspaceId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name,mimeType,createdTime,modifiedTime,webViewLink,parents)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      orderBy: 'name',
    });

    const allFolders = result.data.files || [];
    
    // Filter out the "Global" folder from the results
    const campaignFolders = allFolders.filter(folder => 
      folder.name && folder.name.toLowerCase() !== 'global'
    );

    // For each campaign folder, get its channel folders (excluding "Data")
    const campaignsWithChannels = await Promise.all(
      campaignFolders.map(async (campaign) => {
        try {
          // Get all folders inside this campaign folder
          const channelResult = await drive.files.list({
            q: `'${campaign.id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id,name,mimeType)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
            orderBy: 'name',
          });

          const channelFolders = channelResult.data.files || [];
          
          // Filter out "Data" folder and get channel names
          const channels = channelFolders
            .filter(folder => folder.name && folder.name.toLowerCase() !== 'data')
            .map(folder => folder.name);

          return {
            ...campaign,
            channels: channels,
            channelCount: channels.length
          };
        } catch (error) {
          console.error(`Error getting channels for campaign ${campaign.name}:`, error);
          // Return campaign with empty channels if there's an error
          return {
            ...campaign,
            channels: [],
            channelCount: 0
          };
        }
      })
    );

    return {
      success: true,
      campaigns: campaignsWithChannels,
      totalCampaigns: campaignsWithChannels.length,
      message: `Found ${campaignsWithChannels.length} campaign folders with channel information`,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Retrieves touchpoint structure and content for a specific channel in a campaign
 * @param challengeName - Name of the campaign
 * @param channelName - Name of the channel
 * @param workspaceId - Optional workspace ID, defaults to environment variable
 * @returns Touchpoint structure with content from text files
 */
export const getTouchpointContent = async (challengeName: string, channelName: string, workspaceId?: string) => {
  try {
    const drive = getDriveClient();
    const targetWorkspaceId = workspaceId || process.env.GOOGLE_WORKSPACE_ID;

    if (!targetWorkspaceId) {
      throw new Error('No workspace ID specified');
    }

    if (!challengeName || challengeName.trim() === '') {
      throw new Error('Challenge name is required');
    }

    if (!channelName || channelName.trim() === '') {
      throw new Error('Channel name is required');
    }

    // Step 1: Find the campaign folder by name in the root
    const campaignSearchResult = await drive.files.list({
      q: `'${targetWorkspaceId}' in parents and name='${challengeName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const campaignFolders = campaignSearchResult.data.files || [];
    
    if (campaignFolders.length === 0) {
      throw new Error(`Campaign "${challengeName}" not found`);
    }

    const campaignFolder = campaignFolders[0];

    // Step 2: Find the channel folder within the campaign
    const channelSearchResult = await drive.files.list({
      q: `'${campaignFolder.id}' in parents and name='${channelName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const channelFolders = channelSearchResult.data.files || [];
    
    if (channelFolders.length === 0) {
      throw new Error(`Channel "${channelName}" not found in campaign "${challengeName}"`);
    }

    if (channelFolders.length > 1) {
      throw new Error(`Multiple channels found with name "${channelName}" in campaign "${challengeName}". Please ensure channel names are unique.`);
    }

    const channelFolder = channelFolders[0];

    // Step 3: Get all touchpoint folders within the channel
    const touchpointsResult = await drive.files.list({
      q: `'${channelFolder.id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name,mimeType,createdTime,modifiedTime,webViewLink)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      orderBy: 'name',
    });

    const touchpointFolders = touchpointsResult.data.files || [];

    // Step 4: For each touchpoint, get its files and extract content from text files
    const touchpointsWithContent = await Promise.all(
      touchpointFolders.map(async (touchpoint) => {
        try {
          // Get all files in the touchpoint folder
          const filesResult = await drive.files.list({
            q: `'${touchpoint.id}' in parents and trashed=false`,
            fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
            orderBy: 'name',
          });

          const files = filesResult.data.files || [];
          
          // Filter for text files and extract their content
          const textFiles = files.filter(file => 
            file.mimeType && (
              file.mimeType.startsWith('text/') ||
              file.mimeType === 'application/octet-stream' ||
              file.name?.toLowerCase().endsWith('.txt') ||
              file.name?.toLowerCase().endsWith('.md')
            )
          );

          // Extract content from each text file
          const fileContents = await Promise.all(
            textFiles.map(async (file) => {
              try {
                // Download file content
                const fileContent = await drive.files.get({
                  fileId: file.id!,
                  alt: 'media',
                  supportsAllDrives: true,
                });

                // Convert content to string
                const content = fileContent.data as string;
                
                return {
                  id: file.id,
                  name: file.name,
                  mimeType: file.mimeType,
                  size: file.size,
                  createdTime: file.createdTime,
                  modifiedTime: file.modifiedTime,
                  webViewLink: file.webViewLink,
                  content: content,
                };
              } catch (contentError) {
                console.error(`Error reading content from file ${file.name}:`, contentError);
                return {
                 error: `Failed to read content: ${contentError instanceof Error ? contentError.message : 'Unknown error'}`,
                };
              }
            })
          );

          // Get all files (including non-text files) for complete structure
          const allFiles = files.map(file => ({
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            size: file.size,
            createdTime: file.createdTime,
            modifiedTime: file.modifiedTime,
            webViewLink: file.webViewLink,
            isTextFile: textFiles.some(tf => tf.id === file.id),
          }));

          return {
            id: touchpoint.id,
            name: touchpoint.name,
            mimeType: touchpoint.mimeType,
            createdTime: touchpoint.createdTime,
            modifiedTime: touchpoint.modifiedTime,
            webViewLink: touchpoint.webViewLink,
            files: allFiles,
            textFiles: fileContents,
            fileCount: files.length,
            textFileCount: textFiles.length,
          };
        } catch (error) {
          console.error(`Error getting content for touchpoint ${touchpoint.name}:`, error);
          return {
            id: touchpoint.id,
            name: touchpoint.name,
            mimeType: touchpoint.mimeType,
            createdTime: touchpoint.createdTime,
            modifiedTime: touchpoint.modifiedTime,
            webViewLink: touchpoint.webViewLink,
            files: [],
            textFiles: [],
            fileCount: 0,
            textFileCount: 0,
            error: `Failed to get content: ${error instanceof Error ? error.message : 'Unknown error'}`,
          };
        }
      })
    );

    return {
      success: true,
      campaign: {
        name: challengeName,
        id: campaignFolder.id,
      },
      channel: {
        name: channelName,
        id: channelFolder.id,
      },
      touchpoints: touchpointsWithContent,
      totalTouchpoints: touchpointsWithContent.length,
      totalFiles: touchpointsWithContent.reduce((sum, tp) => sum + tp.fileCount, 0),
      totalTextFiles: touchpointsWithContent.reduce((sum, tp) => sum + tp.textFileCount, 0),
      message: `Retrieved ${touchpointsWithContent.length} touchpoints with content for channel "${channelName}" in campaign "${challengeName}"`,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Retrieves a specific campaign by challenge name with its channels and touchpoints
 * @param challengeName - Name of the campaign to retrieve
 * @param workspaceId - Optional workspace ID, defaults to environment variable
 * @returns Campaign details with channels and touchpoints
 */
export const getCampaign = async (challengeName: string, workspaceId?: string) => {
  try {
    const drive = getDriveClient();
    const targetWorkspaceId = workspaceId || process.env.GOOGLE_WORKSPACE_ID;

    if (!challengeName || challengeName.trim() === '') {
      throw new Error('Challenge name is required');
    }

    // Step 1: Find the campaign folder by name in the root
    const campaignSearchResult = await drive.files.list({
      q: `'${targetWorkspaceId}' in parents and name='${challengeName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name,mimeType,createdTime,modifiedTime,webViewLink,parents)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const campaignFolders = campaignSearchResult.data.files || [];
    
    if (campaignFolders.length === 0) {
      throw new Error(`Campaign "${challengeName}" not found`);
    }

    const campaignFolder = campaignFolders[0];

    // Step 2: Get all folders inside the campaign folder (channels)
    const channelsResult = await drive.files.list({
      q: `'${campaignFolder.id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name,mimeType,createdTime,modifiedTime,webViewLink)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      orderBy: 'name',
    });

    const allChannelFolders = channelsResult.data.files || [];
    
    // Filter out "Data" folder
    const channelFolders = allChannelFolders.filter(folder => 
      folder.name && folder.name.toLowerCase() !== 'data'
    );

    // Step 3: For each channel, get its touchpoints (subfolders)
    const channelsWithTouchpoints = await Promise.all(
      channelFolders.map(async (channel) => {
        try {
          // Get all folders inside this channel folder (touchpoints)
          const touchpointsResult = await drive.files.list({
            q: `'${channel.id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id,name,mimeType,createdTime,modifiedTime,webViewLink)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
            orderBy: 'name',
          });

          const touchpointFolders = touchpointsResult.data.files || [];
          
          // Map touchpoint folders to touchpoint objects
          const touchpoints = touchpointFolders.map(touchpoint => ({
            id: touchpoint.id,
            name: touchpoint.name,
            mimeType: touchpoint.mimeType,
            createdTime: touchpoint.createdTime,
            modifiedTime: touchpoint.modifiedTime,
            webViewLink: touchpoint.webViewLink,
          }));

          return {
            id: channel.id,
            name: channel.name,
            mimeType: channel.mimeType,
            createdTime: channel.createdTime,
            modifiedTime: channel.modifiedTime,
            webViewLink: channel.webViewLink,
            touchpoints: touchpoints,
            touchpointCount: touchpoints.length,
          };
        } catch (error) {
          console.error(`Error getting touchpoints for channel ${channel.name}:`, error);
          // Return channel with empty touchpoints if there's an error
          return {
            id: channel.id,
            name: channel.name,
            mimeType: channel.mimeType,
            createdTime: channel.createdTime,
            modifiedTime: channel.modifiedTime,
            webViewLink: channel.webViewLink,
            touchpoints: [],
            touchpointCount: 0,
          };
        }
      })
    );

    // Step 4: Check if Data folder exists and get its info
    const dataFolder = allChannelFolders.find(folder => 
      folder.name && folder.name.toLowerCase() === 'data'
    );

    return {
      success: true,
      campaign: {
        id: campaignFolder.id,
        name: campaignFolder.name,
        mimeType: campaignFolder.mimeType,
        createdTime: campaignFolder.createdTime,
        modifiedTime: campaignFolder.modifiedTime,
        webViewLink: campaignFolder.webViewLink,
        dataFolder: dataFolder ? {
          id: dataFolder.id,
          name: dataFolder.name,
          webViewLink: dataFolder.webViewLink,
        } : null,
        channels: channelsWithTouchpoints,
        channelCount: channelsWithTouchpoints.length,
        totalTouchpoints: channelsWithTouchpoints.reduce((sum, channel) => sum + channel.touchpointCount, 0),
      },
      message: `Campaign "${challengeName}" retrieved successfully with ${channelsWithTouchpoints.length} channels and ${channelsWithTouchpoints.reduce((sum, channel) => sum + channel.touchpointCount, 0)} touchpoints`,
    };
  } catch (error) {
    throw error;
  }
};

// Export all functions
export default {
  createFileInPath,
  createFolderInPath,
  resolveFolderPath,
  ensureFolderPath,
  listFolderContents,
  listRootContents,
  listRootFiles,
  deleteFile,
  deleteFileByPath,
  analyzeFileWithAI,
  createFileWithPath,
  getFoldersInPath,
  createCampaign,
  getCampaigns,
  getCampaign,
  getTouchpointContent,
};
