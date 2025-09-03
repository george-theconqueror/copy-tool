import { upload } from '@vercel/blob/client';

export interface BlobUploadResult {
  url: string;
  pathname: string;
  size: number;
  uploadPromise: Promise<void>;
}

/**
 * Upload a file to Vercel Blob storage
 * @param file - The file to upload
 * @param onProgress - Optional progress callback
 * @returns Promise with the blob upload result
 */
export async function uploadFileToBlob(
  file: File, 
  onProgress?: (progress: number) => void
): Promise<BlobUploadResult> {
  try {
    // Create a promise that resolves when upload is complete
    let resolveUpload: () => void;
    const uploadPromise = new Promise<void>((resolve) => {
      resolveUpload = resolve;
    });

    const blob = await upload(file.name, file, {
      access: 'public',
      handleUploadUrl: '/api/blob/upload',
    });

    if (onProgress) {
      onProgress(100); // Blob upload is complete
    }

    // Resolve the upload promise
    resolveUpload!();

    return {
      url: blob.url,
      pathname: blob.pathname,
      size: file.size, // Use the original file size instead
      uploadPromise,
    };
  } catch (error) {
    console.error('Error uploading file to Blob:', error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload multiple files to Vercel Blob storage
 * @param files - Array of files to upload
 * @param onProgress - Optional progress callback for overall progress
 * @returns Promise with array of blob upload results
 */
export async function uploadFilesToBlob(
  files: File[], 
  onProgress?: (progress: number) => void
): Promise<BlobUploadResult[]> {
  try {
    const results: BlobUploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await uploadFileToBlob(file);
      results.push(result);
      
      if (onProgress) {
        const progress = Math.round(((i + 1) / files.length) * 100);
        onProgress(progress);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error uploading files to Blob:', error);
    throw new Error(`Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
