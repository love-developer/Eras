/**
 * 🚀 TUS Resumable Upload (Supabase Compatible)
 * 
 * Uses TUS protocol for true chunked/resumable uploads
 * Supabase Storage supports TUS out of the box
 * This avoids BOTH memory limits AND payload size limits
 */

import { projectId } from './supabase/info';

// TUS protocol implementation
const CHUNK_SIZE = 6 * 1024 * 1024; // 6MB chunks (Supabase recommended size)

export interface TUSUploadOptions {
  onProgress?: (progress: number) => void;
  onRetry?: (attempt: number, maxAttempts: number) => void;
  maxRetries?: number;
}

export interface TUSUploadResult {
  publicUrl: string;
  mediaId: string;
  filePath: string;
}

/**
 * Upload file using TUS resumable protocol (Supabase-compatible)
 */
export async function uploadWithTUS(
  file: File,
  userId: string,
  capsuleId: string,
  sessionToken: string,
  options: TUSUploadOptions = {}
): Promise<TUSUploadResult> {
  const {
    onProgress,
    onRetry,
    maxRetries = 2
  } = options;

  const fileSizeMB = file.size / 1024 / 1024;
  console.log(`📦 [TUS UPLOAD] Starting: ${file.name} (${fileSizeMB.toFixed(2)}MB)`);

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

      // Step 1: Create TUS upload session using proper TUS protocol
      const bucketName = 'make-f9be53a7-media';
      
      // Encode metadata in base64 as per TUS spec
      const metadata = [
        `bucketName ${btoa(bucketName)}`,
        `objectName ${btoa(filePath)}`,
        `contentType ${btoa(file.type || 'application/octet-stream')}`,
        `cacheControl ${btoa('3600')}`
      ].join(',');

      console.log(`📝 Creating TUS session for: ${filePath}`);
      
      const createResponse = await fetch(
        `https://${projectId}.supabase.co/storage/v1/upload/resumable`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
            'Tus-Resumable': '1.0.0',
            'Upload-Length': file.size.toString(),
            'Upload-Metadata': metadata,
            'x-upsert': 'false'
          }
          // Note: No body for TUS POST request - all info goes in headers
        }
      );

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error(`❌ Failed to create TUS session:`, errorText);
        throw new Error(`Failed to create upload session: ${errorText}`);
      }

      // Get upload URL from Location header (TUS spec)
      const uploadUrl = createResponse.headers.get('Location');
      if (!uploadUrl) {
        throw new Error('Server did not return upload URL (Location header missing)');
      }
      
      console.log(`✅ TUS session created: ${uploadUrl}`);

      // Step 2: Upload in chunks using PATCH requests
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      let uploadedBytes = 0;

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        console.log(`📤 Uploading chunk ${chunkIndex + 1}/${totalChunks} (${(chunk.size / 1024 / 1024).toFixed(2)}MB)`);

        const patchResponse = await fetch(uploadUrl, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
            'Content-Type': 'application/offset+octet-stream',
            'Upload-Offset': uploadedBytes.toString(),
            'Tus-Resumable': '1.0.0'
          },
          body: chunk
        });

        if (!patchResponse.ok) {
          const errorText = await patchResponse.text();
          console.error(`❌ Chunk upload failed:`, errorText);
          throw new Error(`Chunk upload failed: ${errorText}`);
        }

        uploadedBytes = end;
        const progress = Math.round((uploadedBytes / file.size) * 100);
        
        if (onProgress) {
          onProgress(progress);
        }

        console.log(`✅ Chunk ${chunkIndex + 1}/${totalChunks} uploaded (${progress}%)`);
      }

      console.log(`✅ All chunks uploaded successfully`);

      // Step 3: Get signed URL
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
      } else {
        publicUrl = `https://${projectId}.supabase.co/storage/v1/object/public/make-f9be53a7-media/${filePath}`;
      }

      // Step 4: Store metadata
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

    } catch (error: any) {
      lastError = error;
      const isLastAttempt = attempt === maxRetries;

      // Check for bucket size limit error
      if (error.message?.toLowerCase().includes('payload too large') ||
          error.message?.toLowerCase().includes('exceeded') ||
          error.message?.toLowerCase().includes('size limit')) {
        console.error(`📦 BUCKET SIZE LIMIT - File exceeds bucket settings!`);
        throw new Error(
          `⚠️ Storage Bucket Size Limit Exceeded\n\n` +
          `Your file (${fileSizeMB.toFixed(0)}MB) exceeds the Supabase Storage bucket limit.\n\n` +
          `To fix this:\n` +
          `1. Go to Supabase Dashboard → Storage\n` +
          `2. Click on "make-f9be53a7-media" bucket\n` +
          `3. Click Settings (gear icon)\n` +
          `4. Increase "Maximum file size" to 500MB or higher\n` +
          `5. Click Save\n\n` +
          `Then try uploading again.`
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
