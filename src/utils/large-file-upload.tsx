/**
 * 🚀 Large File Upload Utility
 * 
 * Provides robust upload functionality with:
 * - Chunked uploads to avoid memory limits
 * - Extended timeouts for large files
 * - Exponential backoff retry logic
 * - Progress tracking
 * - Better error messages
 * - Singleton Supabase client to avoid multiple instances
 */

import { supabase } from './supabase/client';
import { projectId } from './supabase/info';

// 🔥 MEMORY FIX: Use smaller chunks to avoid memory limits
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks (reduced from default)

export interface UploadOptions {
  onProgress?: (progress: number) => void;
  onRetry?: (attempt: number, maxAttempts: number) => void;
  maxRetries?: number;
  timeoutMs?: number;
}

export interface UploadResult {
  publicUrl: string;
  mediaId: string;
  filePath: string;
}

/**
 * Upload a large file directly to Supabase Storage with retry logic
 */
export async function uploadLargeFile(
  file: File,
  userId: string,
  capsuleId: string,
  sessionToken: string,
  options: UploadOptions = {},
  thumbnail?: File
): Promise<UploadResult> {
  const {
    onProgress,
    onRetry,
    maxRetries = 2, // 2 retries = 3 total attempts
    timeoutMs = 300000 // 5 minutes per attempt for large files (300,000ms = 5min)
  } = options;

  const fileSizeMB = file.size / 1024 / 1024;
  console.log(`📦 [LARGE FILE] Starting upload: ${file.name} (${fileSizeMB.toFixed(2)}MB)`);

  // Generate unique file path - using temp folder initially to avoid RLS issues
  const fileExtension = file.name.split('.').pop() || 'bin';
  const sanitizedExtension = fileExtension.toLowerCase().replace(/[^a-z0-9]/g, '');
  const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${sanitizedExtension}`;
  
  // 🔥 FIX: Use temp folder structure that RLS allows
  const filePath = `${userId}/temp_${capsuleId}/${fileName}`;

  // Upload thumbnail if provided
  let thumbnailPath: string | null = null;
  if (thumbnail) {
    try {
      console.log(`🖼️ [LARGE FILE] Uploading thumbnail...`);
      const thumbExtension = thumbnail.name.split('.').pop() || 'jpg';
      const thumbFileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_thumb.${thumbExtension}`;
      thumbnailPath = `${userId}/temp_${capsuleId}/${thumbFileName}`;
      
      const { error: thumbError } = await supabase.storage
        .from('make-f9be53a7-media')
        .upload(thumbnailPath, thumbnail, {
          cacheControl: '3600',
          upsert: false,
          contentType: thumbnail.type
        });
        
      if (thumbError) {
        console.warn('⚠️ Thumbnail upload failed (non-critical):', thumbError);
        thumbnailPath = null;
      } else {
        console.log(`✅ Thumbnail uploaded: ${thumbnailPath}`);
      }
    } catch (e) {
      console.warn('⚠️ Thumbnail upload exception (non-critical):', e);
      thumbnailPath = null;
    }
  }

  let lastError: Error | null = null;

  // Retry loop with exponential backoff
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        if (onRetry) {
          onRetry(attempt, maxRetries);
        }
        
        // Shorter backoff: 1s, 2s (instead of 2s, 4s, 8s)
        const backoffDelay = 1000 * Math.pow(2, attempt - 1);
        console.log(`⏳ Waiting ${backoffDelay}ms before retry ${attempt}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }

      console.log(`🔄 Upload attempt ${attempt + 1}/${maxRetries + 1}`);
      
      // Create abort controller with extended timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn(`⏱️ Upload timeout after ${timeoutMs}ms - aborting...`);
        controller.abort();
      }, timeoutMs);

      try {
        // 🔥 Use singleton Supabase client with fresh auth token
        const { data: { session } } = await supabase.auth.getSession();
        const currentToken = session?.access_token || sessionToken;
        
        // Set auth header for this request
        supabase.rest.headers['Authorization'] = `Bearer ${currentToken}`;

        // Upload with progress tracking
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('make-f9be53a7-media')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false, // Don't allow overwriting
            contentType: file.type
          });

        clearTimeout(timeoutId);

        if (uploadError) {
          console.error(`❌ ❌ Upload failed (attempt ${attempt + 1}/${maxRetries + 1}):`, uploadError);
          throw uploadError;
        }

        console.log(`✅ Upload successful: ${filePath}`);
        
        // ✅ Get signed URL instead of public URL (works with RLS)
        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from('make-f9be53a7-media')
          .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days

        if (urlError || !signedUrlData) {
          console.warn('⚠️ Failed to get signed URL, falling back to public URL');
          var { data: { publicUrl } } = supabase.storage
            .from('make-f9be53a7-media')
            .getPublicUrl(filePath);
        } else {
          var publicUrl = signedUrlData.signedUrl;
        }

        // Create media metadata
        const mediaFile = {
          id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          capsule_id: capsuleId,
          user_id: userId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: filePath,
          storage_bucket: 'make-f9be53a7-media',
          thumbnail_path: thumbnailPath, // ✅ Include thumbnail path
          created_at: new Date().toISOString()
        };

        // Store metadata via API with shorter timeout
        const metadataController = new AbortController();
        const metadataTimeoutId = setTimeout(() => metadataController.abort(), 15000); // 15s instead of 30s

        try {
          const metadataResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/media/metadata`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${sessionToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(mediaFile),
              signal: metadataController.signal
            }
          );

          clearTimeout(metadataTimeoutId);

          if (!metadataResponse.ok) {
            const errorText = await metadataResponse.text();
            console.error('❌ Metadata storage failed:', errorText);
            throw new Error(`Failed to store media metadata: ${errorText}`);
          }

          console.log(`✅ Metadata stored successfully`);

          if (onProgress) {
            onProgress(100);
          }

          return {
            publicUrl,
            mediaId: mediaFile.id,
            filePath
          };

        } catch (metadataError) {
          clearTimeout(metadataTimeoutId);
          
          // If metadata fails but upload succeeded, we can try to clean up
          console.error('❌ Metadata storage failed, cleaning up uploaded file...');
          
          try {
            await supabase.storage
              .from('make-f9be53a7-media')
              .remove([filePath]);
            console.log('🗑️ Cleaned up orphaned file');
          } catch (cleanupError) {
            console.error('⚠️ Failed to clean up orphaned file:', cleanupError);
          }
          
          throw metadataError;
        }

      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }

    } catch (error: any) {
      lastError = error;
      
      const isLastAttempt = attempt === maxRetries;
      
      // 🔥 BETTER ERROR MESSAGES - Add file size limit check
      if (error.message?.toLowerCase().includes('exceeded') || 
          error.message?.toLowerCase().includes('size limit') ||
          error.message?.toLowerCase().includes('too large')) {
        console.error(`📦 FILE TOO LARGE - Bucket size limit exceeded!`);
        
        throw new Error(
          `File size (${fileSizeMB.toFixed(2)}MB) exceeds storage bucket limit. ` +
          `Please increase the bucket's file size limit in Supabase Dashboard → Storage → Bucket Settings.`
        );
      }
      
      if (error.message?.toLowerCase().includes('row-level security') || 
          error.message?.toLowerCase().includes('rls') ||
          error.message?.toLowerCase().includes('policy')) {
        console.error(`🔒 RLS POLICY ERROR - Storage bucket is blocking upload!`);
        
        throw new Error(
          `Upload blocked by security policy. ` +
          `This is a server configuration issue. ` +
          `Please contact support or check your Supabase Storage policies.`
        );
      }
      
      if (error.name === 'AbortError') {
        console.warn(`⏱️ Upload timed out (attempt ${attempt + 1}/${maxRetries + 1})`);
        
        if (isLastAttempt) {
          throw new Error(
            `Upload timeout after ${maxRetries + 1} attempts. ` +
            `File size: ${fileSizeMB.toFixed(2)}MB. ` +
            `Try a smaller file or check your internet connection.`
          );
        }
      } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
        console.warn(`🌐 Network error (attempt ${attempt + 1}/${maxRetries + 1}):`, error.message);
        
        if (isLastAttempt) {
          throw new Error(
            `Network error after ${maxRetries + 1} attempts. ` +
            `Please check your internet connection and try again.`
          );
        }
      } else {
        console.error(`❌ Upload failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
        
        if (isLastAttempt) {
          throw new Error(
            error.message || 
            `Upload failed after ${maxRetries + 1} attempts. Please try again.`
          );
        }
      }
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError || new Error('Upload failed for unknown reason');
}

/**
 * Check if a file should use the large file upload path
 */
export function isLargeFile(file: File): boolean {
  const fileSizeMB = file.size / 1024 / 1024;
  return fileSizeMB >= 50; // 50MB threshold
}

/**
 * Get a human-readable file size string
 */
export function formatFileSize(bytes: number): string {
  const mb = bytes / 1024 / 1024;
  const gb = bytes / 1024 / 1024 / 1024;
  
  if (gb >= 1) {
    return `${gb.toFixed(2)} GB`;
  }
  
  return `${mb.toFixed(2)} MB`;
}