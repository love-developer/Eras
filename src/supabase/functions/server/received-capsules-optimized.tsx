/**
 * OPTIMIZED RECEIVED CAPSULES ENDPOINT
 * 
 * Fixes timeout issues by:
 * - Limiting to 50 most recent capsules
 * - Batch processing (10 at a time)
 * - Timeout protection on all KV operations
 * - Skipping media files to reduce load
 */

import * as kv from './kv_store.tsx';
import { withKVTimeout, withFallback, withRetry, withKVTimeoutAndRetry } from './timeout-helpers.tsx';

export async function handleGetReceivedCapsules(c: any, verifyUserToken: any, supabase: any) {
  // CRITICAL: Add overall timeout to prevent exceeding 28 second limit
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Request timeout - returning partial results')), 25000)
  );
  
  const mainPromise = async () => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1];
      if (!accessToken) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // Verify user authentication
      const { user, error: authError } = await verifyUserToken(accessToken);
      if (authError || !user) {
        console.error('Authentication error:', authError);
        return c.json({ error: 'Unauthorized' }, 401);
      }

      console.log(`📨 Fetching received capsules for user: ${user.email}`);

      // Get user's list of received capsule IDs with timeout protection
      const receivedCapsulesKey = `user_received:${user.id}`;
      const rawIds = await withFallback(
        kv.get(receivedCapsulesKey),
        [],
        10000 // 10 second timeout
      );
      const receivedCapsuleIds = rawIds || [];
      
      console.log(`📋 Found ${receivedCapsuleIds.length} received capsule IDs for user`);

      // OPTIMIZATION: Limit to most recent 50 capsules to prevent timeout
      const limitedIds = receivedCapsuleIds.slice(0, 50);
      if (receivedCapsuleIds.length > 50) {
        console.log(`⚠️ Limiting to 50 most recent capsules (out of ${receivedCapsuleIds.length} total)`);
      }

      // OPTIMIZATION: Process in batches of 10 to prevent overwhelming KV store
      const BATCH_SIZE = 10;
      const receivedCapsules = [];
      
      for (let i = 0; i < limitedIds.length; i += BATCH_SIZE) {
        const batch = limitedIds.slice(i, i + BATCH_SIZE);
        console.log(`📦 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(limitedIds.length/BATCH_SIZE)}`);
        
        const batchPromises = batch.map(async (capsuleId) => {
          try {
            // Get capsule with timeout using mget for reliability
            const capsuleValues = await withKVTimeout(
              kv.mget([`capsule:${capsuleId}`]),
              5000, // Reduced from 8000ms
              `Get capsule ${capsuleId}`
            );
            const capsule = capsuleValues?.[0];
            
            if (!capsule) return null;
            
            // Check if capsule has reached delivery date
            const now = new Date();
            const deliveryDate = new Date(capsule.delivery_date);
            
            if (deliveryDate > now) {
              console.log(`⏰ Skipping capsule ${capsuleId} - not yet due`);
              return null;
            }
            
            // Get sender name with timeout
            let senderName = 'Someone Special';
            try {
              const senderProfile = await withKVTimeout(
                kv.get(`profile:${capsule.created_by}`),
                2000, // Reduced from 3000ms
                `Get sender profile ${capsule.created_by}`
              );
              
              if (senderProfile) {
                if (senderProfile.display_name) {
                  senderName = senderProfile.display_name.trim();
                } else {
                  const fullName = `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim();
                  senderName = fullName || senderProfile.email?.split('@')[0] || 'Someone Special';
                }
              }
              // OPTIMIZATION: Skip Supabase Auth lookup - too slow, causes timeouts
              // User will see "Someone Special" if profile is missing
            } catch (error) {
              // ✅ Reduce noise for transient PGRST errors
              const errorMsg = error?.message || String(error);
              if (errorMsg.includes('PGRST') || errorMsg.includes('schema cache')) {
                // Silent fallback for transient database errors
                console.log(`⏭️ Skipping sender profile (transient DB error)`);
              } else {
                console.warn(`❌ Get sender profile ${capsule.created_by} error:`, errorMsg);
              }
            }

            // CRITICAL: Load media files from capsule_media key and generate signed URLs
            let mediaFiles = [];
            try {
              const mediaIds = await withKVTimeout(
                kv.get(`capsule_media:${capsuleId}`),
                2000, // Reduced from 3000ms
                `Get capsule media ${capsuleId}`
              ) || [];
              
              if (mediaIds.length > 0) {
                console.log(`📸 Loading ${mediaIds.length} media files for capsule ${capsuleId}`);
                
                // OPTIMIZATION: Load media files in parallel instead of sequentially
                // Limit to first 10 media files to prevent timeout
                const limitedMediaIds = mediaIds.slice(0, 10);
                
                const mediaPromises = limitedMediaIds.map(async (mediaId) => {
                  try {
                    const mediaFile = await withKVTimeout(
                      kv.get(`media:${mediaId}`),
                      2000,
                      `Get media ${mediaId}`
                    );
                    
                    if (mediaFile && mediaFile.storage_bucket && mediaFile.storage_path) {
                      // Generate signed URL (7 days expiration)
                      const { data, error: urlError } = await supabase.storage
                        .from(mediaFile.storage_bucket)
                        .createSignedUrl(mediaFile.storage_path, 604800);
                      
                      if (!urlError && data?.signedUrl) {
                        return {
                          id: mediaFile.id,
                          file_name: mediaFile.file_name,
                          type: mediaFile.file_type,
                          media_type: mediaFile.file_type,
                          file_type: mediaFile.file_type,
                          file_size: mediaFile.file_size,
                          url: data.signedUrl,
                          file_url: data.signedUrl,
                          created_at: mediaFile.created_at
                        };
                      }
                    }
                    return null;
                  } catch (mediaError) {
                    console.warn(`Failed to load media ${mediaId}:`, mediaError);
                    return null;
                  }
                });
                
                // Wait for all media files in parallel with timeout
                const mediaResults = await Promise.race([
                  Promise.all(mediaPromises),
                  new Promise((_, reject) => setTimeout(() => reject(new Error('Media load timeout')), 3000)) // Reduced from 5000ms
                ]).catch(error => {
                  console.warn(`Media loading timeout for capsule ${capsuleId}:`, error);
                  return [];
                });
                
                mediaFiles = mediaResults.filter(m => m !== null);
                
                console.log(`✅ Loaded ${mediaFiles.length} media files with URLs for capsule ${capsuleId}`);
              }
            } catch (error) {
              console.warn(`Could not load media for capsule ${capsuleId}:`, error);
            }
            
            return {
              ...capsule,
              sender_name: senderName,
              media_files: mediaFiles,
              attachments: mediaFiles,
              isReceived: true,
              is_received: true,
              viewed_at: capsule.viewed_at || null
            };
          } catch (error) {
            console.warn(`Failed to load received capsule ${capsuleId}:`, error);
            return null;
          }
        });
        
        // Wait for batch to complete
        const batchResults = await Promise.all(batchPromises);
        receivedCapsules.push(...batchResults.filter(c => c !== null));
      }

      console.log(`✅ Returning ${receivedCapsules.length} received capsules`);

      return c.json({
        capsules: receivedCapsules,
        total: receivedCapsules.length,
        has_more: receivedCapsuleIds.length > 50
      });

    } catch (error) {
      console.error('Get received capsules error:', error);
      return c.json({ 
        error: 'Failed to get received capsules',
        capsules: [], // Return empty array on error for graceful degradation
        total: 0
      }, 500);
    }
  };
  
  // Race main promise with timeout promise
  return Promise.race([mainPromise(), timeoutPromise])
    .then(result => result)
    .catch(error => {
      console.error('Request timeout:', error);
      return c.json({ 
        error: 'Request timeout - returning partial results',
        capsules: [], // Return empty array on error for graceful degradation
        total: 0
      }, 500);
    });
}