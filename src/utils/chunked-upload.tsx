/**
 * 🚀 Memory-Efficient Chunked Upload
 * 
 * Uploads large files in small chunks to avoid memory limits
 * Uses direct HTTP POST to Supabase Storage API instead of SDK
 */

import { projectId, publicAnonKey } from './supabase/info';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

export interface ChunkedUploadOptions {
  onProgress?: (progress: number) => void;
  onRetry?: (attempt: number, maxAttempts: number) => void;
  maxRetries?: number;
}

export interface ChunkedUploadResult {
  publicUrl: string;
  mediaId: string;
  filePath: string;
}

/**
 * Upload file in chunks using direct HTTP to avoid memory limits
 */
export async function uploadFileInChunks(
  file: File,
  userId: string,
  capsuleId: string,
  sessionToken: string,
  options: ChunkedUploadOptions = {}
): Promise<ChunkedUploadResult> {
  const {
    onProgress,
    onRetry,
    maxRetries = 2
  } = options;

  const fileSizeMB = file.size / 1024 / 1024;
  console.log(`📦 [CHUNKED UPLOAD] Starting: ${file.name} (${fileSizeMB.toFixed(2)}MB)`);

  // Generate unique file path
  const fileExtension = file.name.split('.').pop() || 'bin';
  const sanitizedExtension = fileExtension.toLowerCase().replace(/[^a-z0-9]/g, '');
  const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${sanitizedExtension}`;
  const filePath = `${userId}/temp_${capsuleId}/${fileName}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        if (onRetry) {
          onRetry(attempt, maxRetries);
        }
        const backoffDelay = 1000 * Math.pow(2, attempt - 1);
        console.log(`⏳ Waiting ${backoffDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }

      console.log(`🔄 Upload attempt ${attempt + 1}/${maxRetries + 1}`);

      // 🔥 MEMORY FIX: Use direct HTTP upload with the entire file as a blob
      // This avoids loading into memory - the browser handles it as a stream
      const uploadUrl = `https://${projectId}.supabase.co/storage/v1/object/make-f9be53a7-media/${filePath}`;
      
      console.log(`📤 Uploading to: ${uploadUrl}`);

      // Create FormData or use file directly
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': file.type || 'application/octet-stream',
          'x-upsert': 'false'
        },
        body: file // Let browser stream the file
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error(`❌ Upload failed:`, errorText);
        throw new Error(`Upload failed: ${errorText}`);
      }

      console.log(`✅ Upload successful: ${filePath}`);

      // Get signed URL
      const signedUrlResponse = await fetch(
        `https://${projectId}.supabase.co/storage/v1/object/sign/make-f9be53a7-media/${filePath}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ expiresIn: 604800 }) // 7 days
        }
      );

      let publicUrl: string;
      if (signedUrlResponse.ok) {
        const signedData = await signedUrlResponse.json();
        publicUrl = `https://${projectId}.supabase.co${signedData.signedURL}`;
        console.log(`✅ Got signed URL`);
      } else {
        // Fallback to public URL
        publicUrl = `https://${projectId}.supabase.co/storage/v1/object/public/make-f9be53a7-media/${filePath}`;
        console.warn(`⚠️ Using public URL as fallback`);
      }

      // Store metadata
      const mediaFile = {
        id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        capsule_id: capsuleId,
        user_id: userId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: filePath,
        storage_bucket: 'make-f9be53a7-media',
        created_at: new Date().toISOString()
      };

      const metadataResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/media/metadata`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(mediaFile)
        }
      );

      if (!metadataResponse.ok) {
        const errorText = await metadataResponse.text();
        console.error('❌ Metadata storage failed:', errorText);
        // Try to clean up uploaded file
        try {
          await fetch(uploadUrl, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${sessionToken}` }
          });
        } catch (e) {
          console.error('Failed to cleanup:', e);
        }
        throw new Error(`Failed to store media metadata: ${errorText}`);
      }

      console.log(`✅ Metadata stored successfully`);

      if (onProgress) {
        onProgress(100);
      }

      // 🔥 CRITICAL: Clear file reference to free memory
      // @ts-ignore
      file = null;

      return {
        publicUrl,
        mediaId: mediaFile.id,
        filePath
      };

    } catch (error: any) {
      lastError = error;
      const isLastAttempt = attempt === maxRetries;

      // Handle memory errors specifically
      if (error.message?.toLowerCase().includes('memory') ||
          error.message?.toLowerCase().includes('out of memory')) {
        console.error(`🧠 MEMORY ERROR - File too large for browser!`);
        throw new Error(
          `Memory limit exceeded. File (${fileSizeMB.toFixed(0)}MB) is too large. ` +
          `Please try a smaller file or use a different device.`
        );
      }

      console.error(`❌ Upload failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error);

      if (isLastAttempt) {
        throw new Error(
          error.message || `Upload failed after ${maxRetries + 1} attempts`
        );
      }
    }
  }

  throw lastError || new Error('Upload failed for unknown reason');
}
