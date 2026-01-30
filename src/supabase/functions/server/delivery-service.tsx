import { supabase } from "./supabase-client.tsx";
import * as kv from "./kv_store.tsx";
import { EmailService } from "./email-service.tsx";
import { checkAndUnlockAchievements } from "./achievement-service.tsx";
import { safeKvGet, safeKvSet, safeKvDel } from './cloudflare-recovery.tsx';

interface TimeCapsule {
  id: string;
  created_by: string; // Changed from user_id to match our API
  title: string;
  text_message?: string;
  delivery_date: string; // Now contains full ISO datetime string
  time_zone?: string; // User's time zone when the capsule was created
  recipient_type: 'self' | 'others'; // Updated to match our API
  delivery_method?: 'email' | 'phone';
  self_contact?: string | any; // For self delivery - can be string or object with email/phone
  recipients?: (string | any)[]; // For others delivery - can be array of strings or objects with email/phone
  status: 'scheduled' | 'delivering' | 'delivered' | 'failed' | 'draft'; // ✅ Added 'draft' for failed→draft conversion
  created_at: string;
  updated_at: string;
  delivery_attempts?: number;
  last_delivery_attempt?: string;
  delivery_error?: string;
  frontend_url?: string; // Frontend URL for generating viewing links in emails
  
  // ✅ NEW: Media preservation fields
  media_files?: string[]; // Array of MediaFile IDs
  media_urls?: string[]; // Array of storage URLs
  
  // ✅ NEW: Failure context fields (for failed→draft conversion)
  failure_reason?: string; // Why delivery failed
  failed_at?: string; // When it failed
  original_delivery_date?: string; // What was the original scheduled date
}

interface MediaFile {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  storage_bucket: string;
  created_at: string;
}

export class DeliveryService {
  // Use singleton client instead of creating a new instance
  private static supabase = supabase;

  static async processDueDeliveries(): Promise<{ processed: number; successful: number; failed: number }> {
    const processingStartTime = new Date();
    console.log('🚀 Starting delivery processing...');
    console.log(`🕐 [DELIVERY] Processing started at: ${processingStartTime.toISOString()}`);
    console.log(`🕐 [DELIVERY] Local time: ${processingStartTime.toLocaleString()}`);
    
    // CRITICAL: Acquire distributed lock to prevent multiple instances from processing simultaneously
    const deliveryLockKey = 'delivery_processing_lock';
    const instanceId = Math.random().toString(36).substring(7);
    let lockAcquired = false;
    
    try {
      // Try to acquire the lock (with Cloudflare recovery) - Use quiet mode to reduce log spam during outages
      // TIMEOUT PROTECTION: Use shorter timeout (5 seconds) for lock acquisition to fail fast
      const lockCheckPromise = safeKvGet(() => kv.get(deliveryLockKey), deliveryLockKey, null, { quiet: true, maxRetries: 2 });
      const lockCheckTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Lock check timeout')), 5000)
      );
      
      let existingLock;
      try {
        existingLock = await Promise.race([lockCheckPromise, lockCheckTimeout]);
      } catch (timeoutError) {
        console.warn('⏱️ Lock check timed out after 5s - database may be slow, skipping this delivery cycle');
        return { processed: 0, successful: 0, failed: 0 };
      }
      
      if (existingLock) {
        const lockAge = Date.now() - existingLock.timestamp;
        
        // If lock is less than 60 seconds old, another instance is processing
        if (lockAge < 60000) {
          console.log(`⏸️ Delivery processing already in progress (lock held by ${existingLock.holder} for ${Math.round(lockAge / 1000)}s), skipping...`);
          return { processed: 0, successful: 0, failed: 0 };
        }
        
        // Lock is stale, we can take it over
        console.log(`🔓 Taking over stale delivery lock (${Math.round(lockAge / 1000)}s old)`);
      }
      
      // Acquire the lock (with Cloudflare recovery) - Use quiet mode and fewer retries with timeout
      const lockSetPromise = safeKvSet(() => kv.set(deliveryLockKey, { timestamp: Date.now(), holder: instanceId }), deliveryLockKey, { quiet: true, maxRetries: 2 });
      const lockSetTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Lock set timeout')), 5000)
      );
      
      try {
        await Promise.race([lockSetPromise, lockSetTimeout]);
        lockAcquired = true;
        console.log(`🔒 Delivery processing lock acquired by ${instanceId}`);
      } catch (timeoutError) {
        console.warn('⏱️ Lock acquisition timed out after 5s - database may be slow, skipping this delivery cycle');
        return { processed: 0, successful: 0, failed: 0 };
      }
    } catch (lockError) {
      // Check if this is a temporary network/database error
      const errorMsg = lockError?.message || String(lockError);
      
      // Suppress verbose HTML errors from Cloudflare
      const isHtmlError = errorMsg.includes('<!DOCTYPE html>') || errorMsg.length > 500;
      
      // Check if it's a retryable network/database error or timeout
      if (errorMsg.includes('500') ||
          errorMsg.includes('502') || 
          errorMsg.includes('503') ||
          errorMsg.includes('504') ||
          errorMsg.includes('Internal Server Error') ||
          errorMsg.includes('Internal server error') ||
          errorMsg.includes('Bad Gateway') || 
          errorMsg.includes('timeout') ||
          errorMsg.includes('timed out') ||
          errorMsg.includes('Query timeout') ||
          errorMsg.includes('ETIMEDOUT') ||
          errorMsg.includes('<html>') ||
          errorMsg.includes('<title>') ||
          errorMsg.includes('cloudflare') ||
          errorMsg.includes('Cloudflare') ||
          errorMsg.includes('connection') ||
          errorMsg.includes('Connection error') ||
          errorMsg.includes('Network connection lost') ||
          errorMsg.includes('Unable to reach database') ||
          errorMsg.includes('gateway error') ||
          errorMsg.includes('ECONNRESET') ||
          errorMsg.includes('fetch failed') ||
          errorMsg.includes('undefined') ||
          errorMsg.includes('network') ||
          isHtmlError) {
        console.warn('⚠️ Temporary Cloudflare/database issue acquiring delivery lock, will retry next interval');
        // Don't log HTML error details to avoid console spam
        if (!isHtmlError) {
          console.warn('   Error:', errorMsg.substring(0, 150));
        }
        return { processed: 0, successful: 0, failed: 0 };
      }
      
      // For other unknown errors, log and skip but don't crash
      console.error('❌ Unexpected error acquiring delivery processing lock');
      if (!isHtmlError) {
        console.error('   Error:', lockError);
      }
      console.error('   Skipping this delivery cycle to prevent multiple processing instances');
      return { processed: 0, successful: 0, failed: 0 };
    }
    
    try {
      const dueCapsules = await this.getDueCapsules();
      console.log(`📦 Found ${dueCapsules.length} due capsules`);
      
      let processed = 0;
      let successful = 0;
      let failed = 0;

      for (const capsule of dueCapsules) {
        // No delay needed - EmailService queue handles rate limiting automatically
        processed++;
        const capsuleProcessTime = new Date();
        console.log(`📨 Processing delivery for capsule: ${capsule.id} - "${capsule.title}"`);
        console.log(`🕐 [DELIVERY] Capsule "${capsule.title}" processing at: ${capsuleProcessTime.toISOString()}`);
        console.log(`🕐 [DELIVERY] Scheduled for: ${capsule.delivery_date}`);
        
        try {
          const success = await this.deliverCapsule(capsule);
          if (success) {
            successful++;
            console.log(`✅ Successfully delivered capsule: ${capsule.id}`);
          } else {
            failed++;
            console.log(`❌ Failed to deliver capsule: ${capsule.id}`);
          }
        } catch (error) {
          failed++;
          console.error(`💥 Error delivering capsule ${capsule.id}:`, error);
          await this.markDeliveryFailed(capsule, error.message);
        }
      }

      console.log(`📊 Delivery processing complete: ${processed} processed, ${successful} successful, ${failed} failed`);
      return { processed, successful, failed };
    } catch (error) {
      console.error('🚨 Error in delivery processing:', error);
      throw error;
    } finally {
      // CRITICAL: Always release the lock, even if processing failed
      if (lockAcquired) {
        try {
          await safeKvDel(() => kv.del(deliveryLockKey), deliveryLockKey);
          console.log(`🔓 Delivery processing lock released by ${instanceId}`);
        } catch (unlockError) {
          // Log but don't throw - lock will expire naturally
          console.warn('⚠️ Failed to release delivery lock (will expire naturally):', unlockError?.message);
        }
      }
    }
  }

  private static async getDueCapsules(): Promise<TimeCapsule[]> {
    try {
      // Get all capsules with scheduled status
      let allCapsules: any[];
      try {
        // CRITICAL FIX: Always fetch fresh data to prevent duplicate deliveries
        // The cache was causing race conditions where capsules marked as 'delivering'
        // would still appear as 'scheduled' in cached data, resulting in duplicate emails
        console.log('🔍 Fetching scheduled capsules from database (cache disabled for delivery processing)...');
        
        const now = Date.now();
        
        // PHASE 5B: Use global scheduled capsules list instead of scanning ALL capsules
        // This is MUCH faster than fetching capsule:% which gets every capsule from every user
        // The list is maintained when capsules are created/updated/delivered
        console.log('📋 Fetching scheduled capsules list...');
        
        // Try to get the global scheduled capsules list first (efficient!)
        let scheduledIds: string[] = [];
        try {
          scheduledIds = await kv.get('scheduled_capsules_global') || [];
          console.log(`✅ Found ${scheduledIds.length} capsules in global scheduled list`);
        } catch (error) {
          console.warn('⚠️ Failed to get scheduled capsules list, will return empty:', error);
          scheduledIds = [];
        }
        
        // Fetch only the scheduled capsules (efficient!) with batching
        allCapsules = [];
        if (scheduledIds.length > 0) {
          console.log(`📦 Fetching ${scheduledIds.length} scheduled capsules by ID...`);
          
          // Process in batches of 5 to avoid overwhelming the database connection
          // Previous batch size of 50 caused connection pool exhaustion (PGRST000)
          const BATCH_SIZE = 5;
          for (let i = 0; i < scheduledIds.length; i += BATCH_SIZE) {
            const batchIds = scheduledIds.slice(i, i + BATCH_SIZE);
            console.log(`📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(scheduledIds.length / BATCH_SIZE)} (${batchIds.length} items)`);
            
            // Wrap each fetch in try-catch to prevent individual failures from breaking the batch
            const batchPromises = batchIds.map(async (id, index) => {
              // Add small staggered delay within the batch to prevent exact simultaneous hits
              // This helps distribute the connection load even within the small batch
              await new Promise(resolve => setTimeout(resolve, index * 100));
              
              try {
                return await safeKvGet(
                  () => kv.get(`capsule:${id}`),
                  `capsule:${id}`,
                  null,
                  { quiet: true, maxRetries: 4 }
                );
              } catch (error) {
                // Check for critical database exhaustion
                const errorMsg = error?.message || String(error);
                if (errorMsg.includes('PGRST000') || errorMsg.includes('connection slots')) {
                   console.error(`🛑 Critical database exhaustion detected while fetching capsule ${id}. Aborting batch.`);
                   throw error; // Throw to stop processing
                }
                
                // Log but don't throw for other errors - return null to continue processing other capsules
                console.warn(`⚠️ Failed to fetch capsule ${id}, skipping:`, error?.message || error);
                return null;
              }
            });
            
            try {
              const batchResults = await Promise.all(batchPromises);
              const validBatchCapsules = batchResults.filter(c => c !== null);
              allCapsules.push(...validBatchCapsules);
              
              // Log if we had any failures in this batch
              const failedCount = batchResults.length - validBatchCapsules.length;
              if (failedCount > 0) {
                console.warn(`⚠️ Batch had ${failedCount} failed fetches out of ${batchResults.length}`);
              }
            } catch (batchError) {
              const errorMsg = batchError?.message || String(batchError);
              if (errorMsg.includes('PGRST000') || errorMsg.includes('connection slots')) {
                console.error('🛑 Stopping delivery processing due to database exhaustion');
                break; // Stop processing entirely for this run
              }
            }
            
            // Larger delay between batches to let connection pool recover
            if (i + BATCH_SIZE < scheduledIds.length) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
          
          console.log(`✅ Fetched ${allCapsules.length} valid capsules out of ${scheduledIds.length} IDs`);
        
          // Process each capsule to check status
          let updatedScheduledIds = [...scheduledIds];
          let idsChanged = false;

          for (const capsuleData of allCapsules) {
            if (!capsuleData) continue;
            const capsule = capsuleData as any;
            
            // CRITICAL: Remove archived capsules from scheduled list
            // Archived capsules should NEVER be in the scheduled list
            if (capsule.deletedAt) {
              console.log(`🗑️ Removing archived capsule ${capsule.id} from scheduled list`);
              updatedScheduledIds = updatedScheduledIds.filter(id => id !== capsule.id);
              idsChanged = true;
              continue;
            }
            
            // Check for stuck 'delivering' capsules and reset them to 'scheduled'
            if (capsule.status === 'delivering') {
              const lastAttempt = capsule.last_delivery_attempt;
              if (lastAttempt) {
                const lastAttemptTime = new Date(lastAttempt);
                const timeSinceAttempt = now - lastAttemptTime.getTime();
                const minutesSinceAttempt = timeSinceAttempt / (1000 * 60);
                
                // If stuck for more than 5 minutes, reset to scheduled
                if (minutesSinceAttempt > 5) {
                  console.warn(`⚠️ Found stuck 'delivering' capsule ${capsule.id}, resetting to 'scheduled'`);
                  const resetCapsule = {
                    ...capsule,
                    status: 'scheduled' as const
                  };
                  // Use safeKvSet for recovery
                  await safeKvSet(() => kv.set(`capsule:${capsule.id}`, resetCapsule), `capsule:${capsule.id}`, { quiet: true });
                  
                  // Update the object in our local list so it gets processed
                  Object.assign(capsule, resetCapsule);
                }
              }
            }
            // If status is 'delivered' or 'failed', remove from scheduled list
            else if (capsule.status === 'delivered' || capsule.status === 'failed') {
              console.log(`🧹 Removing ${capsule.status} capsule ${capsule.id} from scheduled list`);
              updatedScheduledIds = updatedScheduledIds.filter(id => id !== capsule.id);
              idsChanged = true;
            }
          }
          
          // Update global list if changed
          if (idsChanged) {
            await safeKvSet(() => kv.set('scheduled_capsules_global', updatedScheduledIds), 'scheduled_capsules_global', { quiet: true });
          }
        }
        
      } catch (kvError) {
        // Check error type first before logging to avoid verbose HTML errors
        const errorMsg = kvError?.message || String(kvError);
        const isTemporaryError = errorMsg.includes('500') ||
            errorMsg.includes('502') || 
            errorMsg.includes('503') ||
            errorMsg.includes('504') ||
            errorMsg.includes('Internal Server Error') ||
            errorMsg.includes('Bad Gateway') || 
            errorMsg.includes('timeout') ||
            errorMsg.includes('timed out') ||
            errorMsg.includes('html') ||
            errorMsg.includes('<html>') ||
            errorMsg.includes('<title>') ||
            errorMsg.includes('fetch') ||
            errorMsg.includes('cloudflare') ||
            errorMsg.includes('connection') ||
            errorMsg.includes('reset') ||
            errorMsg.includes('ECONNRESET') ||
            errorMsg.includes('network') ||
            errorMsg.includes('SendRequest');
        
        if (isTemporaryError) {
          // Log concise message for temporary errors instead of full HTML
          console.warn('⚠️ Temporary database/network error while fetching due capsules (likely Cloudflare timeout or 500 error). Will retry on next interval.');
          return [];
        }
        
        // Only log full error for unexpected errors
        console.error('❌ [Supabase] Unexpected error getting due capsules:', kvError);
        throw kvError; // Re-throw non-temporary errors
      }
      
      const dueCapsules: TimeCapsule[] = [];
      
      const now = new Date(); // Current time in UTC

      for (const capsuleData of allCapsules) {
        // Skip if not scheduled or currently being delivered (prevents race conditions)
        if (!capsuleData || capsuleData.status !== 'scheduled' || capsuleData.status === 'delivering') continue;
        
        // CRITICAL: Skip archived capsules (capsules with deletedAt timestamp)
        // Archived capsules should NEVER be delivered even if they were scheduled
        if (capsuleData.deletedAt) {
          console.log(`🗑️ Skipping archived capsule ${capsuleData.id} - will not deliver`);
          continue;
        }

        const capsule = capsuleData as TimeCapsule;
        
        // Parse the delivery date (which is already a full ISO string with time)
        let deliveryDateTime: Date;
        try {
          // Additional validation for malformed date strings
          if (!capsule.delivery_date || typeof capsule.delivery_date !== 'string') {
            console.error(`❌ Missing or invalid delivery_date field for capsule ${capsule.id}: ${capsule.delivery_date}`);
            continue;
          }

          // Check for malformed ISO strings (like having multiple T or Z characters)
          const tCount = (capsule.delivery_date.match(/T/g) || []).length;
          const zCount = (capsule.delivery_date.match(/Z/g) || []).length;
          
          if (tCount > 1 || zCount > 1) {
            console.error(`❌ Malformed ISO date string for capsule ${capsule.id}: ${capsule.delivery_date}`);
            console.error(`❌ Contains ${tCount} 'T' characters and ${zCount} 'Z' characters`);
            
            // Mark this capsule as failed due to data corruption
            await this.markDeliveryFailed(capsule, `Corrupted delivery date: ${capsule.delivery_date}`);
            continue;
          }

          deliveryDateTime = new Date(capsule.delivery_date);
          
          // Validate the date
          if (isNaN(deliveryDateTime.getTime())) {
            console.error(`❌ Invalid delivery date for capsule ${capsule.id}: ${capsule.delivery_date}`);
            await this.markDeliveryFailed(capsule, `Invalid delivery date: ${capsule.delivery_date}`);
            continue;
          }
        } catch (error) {
          console.error(`❌ Error parsing delivery date for capsule ${capsule.id}:`, error);
          console.error(`❌ Invalid date created from: ${capsule.delivery_date}`);
          await this.markDeliveryFailed(capsule, `Date parsing error: ${error.message}`);
          continue;
        }
        
        const timeDiffMs = now.getTime() - deliveryDateTime.getTime();
        const timeDiffMinutes = Math.round(timeDiffMs / (1000 * 60));
        
        console.log(`📅 Checking capsule ${capsule.id}: "${capsule.title}"`);
        console.log(`   Scheduled: ${deliveryDateTime.toISOString()}`);
        console.log(`   Raw delivery_date: ${capsule.delivery_date}`);
        console.log(`   Current:   ${now.toISOString()}`);
        console.log(`   Time zone: ${capsule.time_zone || 'UTC'}`);
        console.log(`   Difference: ${timeDiffMinutes} minutes`);
        
        // CRITICAL FIX: Only deliver AT or AFTER the scheduled time, never early
        // Changed from "<= ONE_MINUTE_MS" which allowed 1 minute early delivery
        // Now uses "<= 0" to ensure delivery happens only at/after scheduled time
        const timeUntilDelivery = deliveryDateTime.getTime() - now.getTime();
        const isDue = timeUntilDelivery <= 0; // Changed: Was ONE_MINUTE_MS (60000), now 0
        console.log(`   Due: ${isDue} (${timeUntilDelivery > 0 ? Math.round(timeUntilDelivery / 1000) + 's until delivery' : 'overdue by ' + Math.abs(Math.round(timeUntilDelivery / 1000)) + 's'})`);
        
        if (isDue) {
          // Don't retry too frequently for failed deliveries
          const attempts = capsule.delivery_attempts || 0;
          const lastAttempt = capsule.last_delivery_attempt;
          
          if (attempts === 0 || !lastAttempt || this.shouldRetryDelivery(lastAttempt, attempts)) {
            dueCapsules.push(capsule);
          }
        }
      }

      console.log(`🔍 Found ${dueCapsules.length} due capsules out of ${allCapsules.length} total`);
      return dueCapsules;
    } catch (error) {
      console.error('Error getting due capsules:', error);
      return [];
    }
  }

  private static shouldRetryDelivery(lastAttempt: string, attempts: number): boolean {
    // DISABLED: No automatic retries - fail immediately on first attempt
    return false;
    
    // Original retry logic (commented out):
    // const lastAttemptTime = new Date(lastAttempt);
    // const now = new Date();
    // const hoursSinceLastAttempt = (now.getTime() - lastAttemptTime.getTime()) / (1000 * 60 * 60);
    // const retryDelays = [1, 4, 12, 24, 24, 24]; // hours
    // const maxRetries = retryDelays.length;
    // if (attempts >= maxRetries) return false;
    // const requiredDelay = retryDelays[attempts - 1] || 24;
    // return hoursSinceLastAttempt >= requiredDelay;
  }

  static async deliverCapsule(capsule: TimeCapsule): Promise<boolean> {
    const capsuleLockKey = `delivery_lock:${capsule.id}`;
    const instanceId = Math.random().toString(36).substring(7);
    
    try {
      // CRITICAL: Acquire per-capsule lock FIRST to prevent ANY duplicates
      // This is an additional layer beyond the global delivery lock
      
      // 🔥 FIX: Use atomic check-and-set to prevent race condition
      // The old code had a check-then-set race where two instances could both get null,
      // then both set the lock, leading to duplicate deliveries
      const existingCapsuleLock = await kv.get(capsuleLockKey);
      
      if (existingCapsuleLock) {
        const lockAge = Date.now() - existingCapsuleLock.timestamp;
        
        // If lock is less than 5 minutes old, another instance is processing this specific capsule
        if (lockAge < 300000) { // 5 minutes
          console.log(`⏸️ Capsule ${capsule.id} is already being processed by instance ${existingCapsuleLock.holder} (${Math.round(lockAge / 1000)}s ago), skipping...`);
          return true; // Return true to avoid marking as failed
        }
        
        console.log(`🔓 Taking over stale capsule lock for ${capsule.id} (${Math.round(lockAge / 1000)}s old)`);
      }
      
      // 🔥 FIX: Atomically acquire the lock with a unique token to detect overwrites
      const lockToken = `${instanceId}-${Date.now()}-${Math.random()}`;
      const lockData = { 
        timestamp: Date.now(), 
        holder: instanceId,
        capsule_id: capsule.id,
        token: lockToken
      };
      
      await kv.set(capsuleLockKey, lockData);
      console.log(`🔒 Capsule-specific lock acquisition attempted for ${capsule.id} by ${instanceId}`);
      
      // 🔥 FIX: Immediately verify we actually got the lock (detect race condition)
      // Wait a small random delay to let any racing instance finish their set
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 50));
      
      const verifyLock = await kv.get(capsuleLockKey);
      if (!verifyLock || verifyLock.token !== lockToken) {
        console.log(`⚠️ Lock verification FAILED for capsule ${capsule.id} - another instance won the race (our token: ${lockToken}, current: ${verifyLock?.token})`);
        console.log(`⏸️ Skipping delivery to prevent duplicate - capsule ${capsule.id} is being handled by instance ${verifyLock?.holder}`);
        return true; // Return true to avoid marking as failed
      }
      
      console.log(`✅ Lock verified for ${capsule.id} by ${instanceId} - proceeding with delivery`);
      
      // CRITICAL: Re-fetch capsule from database to get absolute latest status
      // This prevents race conditions if multiple scheduler instances are running
      const latestCapsule = await kv.get(`capsule:${capsule.id}`);
      
      if (!latestCapsule) {
        console.log(`⚠️ Capsule ${capsule.id} no longer exists, skipping...`);
        await kv.del(capsuleLockKey); // Release lock
        return true;
      }
      
      // CRITICAL: Check if already being processed to prevent duplicates
      if (latestCapsule.status === 'delivering' || latestCapsule.status === 'delivered' || latestCapsule.status === 'failed') {
        console.log(`⚠️ Capsule ${capsule.id} status is '${latestCapsule.status}', skipping to prevent duplicate delivery...`);
        await kv.del(capsuleLockKey); // Release lock
        return true; // Return true to avoid marking as failed
      }
      
      // CRITICAL: Mark capsule as "delivering" IMMEDIATELY to prevent duplicate processing
      // This prevents race conditions where multiple scheduler runs process the same capsule
      const lockCapsule = {
        ...latestCapsule, // Use latest capsule data
        status: 'delivering' as const,
        delivery_attempts: (latestCapsule.delivery_attempts || 0) + 1,
        last_delivery_attempt: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await kv.set(`capsule:${capsule.id}`, lockCapsule);
      
      console.log(`🔒 Capsule ${capsule.id} locked for delivery (status: 'delivering')`);

      // Get media files for this capsule
      const mediaFiles = await this.getCapsuleMediaFiles(capsule.id);
      
      // Generate viewing URL
      const viewingUrl = await this.generateViewingUrl(capsule);
      
      // Get sender information
      const senderProfile = await kv.get(`profile:${capsule.created_by}`);
      let senderName: string | undefined = undefined;
      
      if (senderProfile) {
        // Try display_name first, then first_name + last_name, then fallback
        if (senderProfile.display_name) {
          senderName = senderProfile.display_name.trim();
        } else {
          const fullName = `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim();
          senderName = fullName || 'Someone Special';
        }
      } else {
        // No profile found - use fallback
        senderName = 'Someone Special';
      }

      let deliverySuccess = false;
      
      console.log(`📊 [DEBUG] Starting delivery for capsule ${capsule.id}`);
      console.log(`📊 [DEBUG] recipient_type: ${capsule.recipient_type}`);
      console.log(`📊 [DEBUG] self_contact: ${JSON.stringify(capsule.self_contact)}`);
      console.log(`📊 [DEBUG] recipients: ${JSON.stringify(capsule.recipients)}`);
      
      if (capsule.recipient_type === 'self') {
        // Self-delivery - use the self_contact field
        if (capsule.self_contact) {
          // Handle both string and object self_contact
          let selfContact: string;
          
          if (typeof capsule.self_contact === 'string') {
            selfContact = capsule.self_contact;
          } else if (typeof capsule.self_contact === 'object' && capsule.self_contact !== null) {
            // Log the actual structure to debug
            console.log(`🔍 [DEBUG] Self-contact object structure for capsule ${capsule.id}:`, JSON.stringify(capsule.self_contact, null, 2));
            
            // Try multiple possible property names for the contact information
            const selfContactObj = capsule.self_contact as any;
            selfContact = 
              selfContactObj.email || 
              selfContactObj.phone || 
              selfContactObj.contact || 
              selfContactObj.value || 
              selfContactObj.address || 
              selfContactObj.recipient || 
              selfContactObj.to ||
              // If it's a nested object, try to extract from common patterns
              selfContactObj.contactInfo?.email ||
              selfContactObj.contactInfo?.phone ||
              selfContactObj.data?.email ||
              selfContactObj.data?.phone ||
              '';
            
            console.log(`📧 Extracted self contact from object: "${selfContact}"`);
          } else {
            console.error(`❌ Invalid self_contact format for capsule ${capsule.id}:`, capsule.self_contact);
            selfContact = '';
          }
          
          // Only proceed if we have a valid contact
          if (selfContact && selfContact.trim() !== '') {
            // Determine delivery method based on contact format
            if (selfContact.includes('@')) {
              // Email delivery
              console.log(`📧 Sending self-delivery email to: ${selfContact}`);
              deliverySuccess = await this.sendEmailDelivery(selfContact, capsule, mediaFiles, senderName, viewingUrl);
            } else {
              // Phone/SMS delivery not supported
              console.error(`❌ SMS delivery not supported in this version of Eras. Contact: ${selfContact}`);
              await this.markDeliveryFailed(capsule, 'SMS delivery not supported - please use email');
              deliverySuccess = false;
            }
          } else {
            console.error(`❌ Empty self_contact for capsule ${capsule.id}, falling back to user auth email`);
            // Fallback: Get user's email from auth
            const userAuth = await this.getUserAuth(capsule.created_by);
            if (userAuth?.email) {
              console.log(`📧 Using fallback email from auth: ${userAuth.email}`);
              deliverySuccess = await this.sendEmailDelivery(userAuth.email, capsule, mediaFiles, senderName, viewingUrl);
            }
          }
        } else {
          // Fallback: Get user's email from auth
          const userAuth = await this.getUserAuth(capsule.created_by);
          if (userAuth?.email) {
            console.log(`📧 Using user auth email: ${userAuth.email}`);
            deliverySuccess = await this.sendEmailDelivery(userAuth.email, capsule, mediaFiles, senderName, viewingUrl);
          }
        }
      } else if (capsule.recipient_type === 'others') {
        // Deliver to multiple recipients
        if (capsule.recipients && capsule.recipients.length > 0) {
          let allSuccessful = true;
          let recipientIndex = 0;
          
          // CRITICAL: Get sender's email to detect self-recipients
          let senderEmail: string | null = null;
          try {
            const senderAuth = await this.getUserAuth(capsule.created_by);
            senderEmail = senderAuth?.email?.toLowerCase().trim() || null;
            console.log(`📧 Sender email for self-detection: ${senderEmail}`);
          } catch (error) {
            console.warn('⚠️ Could not get sender email for self-detection:', error);
          }
          
          // Deduplicate recipients to prevent multiple emails to the same address
      const uniqueRecipients = new Map<string, any>();
      
      for (const recipient of capsule.recipients) {
        let contactStr = '';
        if (typeof recipient === 'string') {
          contactStr = recipient;
        } else if (typeof recipient === 'object' && recipient !== null) {
          const r = recipient as any;
          contactStr = r.email || r.phone || r.contact || r.value || r.address || '';
        }
        
        if (contactStr && contactStr.trim()) {
          const normalizedContact = contactStr.toLowerCase().trim();
          if (!uniqueRecipients.has(normalizedContact)) {
            uniqueRecipients.set(normalizedContact, recipient);
          }
        }
      }
      
      const recipientsList = Array.from(uniqueRecipients.values());
      console.log(`📧 Processing ${recipientsList.length} unique recipients (deduplicated from ${capsule.recipients.length})`);
      
      for (const recipient of recipientsList) {
            // No delay needed - EmailService queue handles rate limiting automatically
            recipientIndex++;
            
            let success = false;
            
            // Handle both string recipients and object recipients
            let recipientContact: string;
            
            if (typeof recipient === 'string') {
              recipientContact = recipient;
            } else if (typeof recipient === 'object' && recipient !== null) {
              // Log the actual structure to debug
              console.log(`🔍 [DEBUG] Recipient object structure for capsule ${capsule.id}:`, JSON.stringify(recipient, null, 2));
              
              // Try multiple possible property names for the contact information
              const recipientObj = recipient as any;
              recipientContact = 
                recipientObj.email || 
                recipientObj.phone || 
                recipientObj.contact || 
                recipientObj.value || 
                recipientObj.address || 
                recipientObj.recipient || 
                recipientObj.to ||
                // If it's a nested object, try to extract from common patterns
                recipientObj.contactInfo?.email ||
                recipientObj.contactInfo?.phone ||
                recipientObj.data?.email ||
                recipientObj.data?.phone ||
                '';
              
              console.log(`📧 Extracted contact from object: "${recipientContact}"`);
            } else {
              console.error(`❌ Invalid recipient format for capsule ${capsule.id}:`, recipient);
              allSuccessful = false;
              continue;
            }
            
            // Skip empty contacts
            if (!recipientContact || recipientContact.trim() === '') {
              console.error(`❌ Empty recipient contact for capsule ${capsule.id}`);
              console.error(`   Original recipient data:`, JSON.stringify(recipient, null, 2));
              console.error(`   Recipient type: ${typeof recipient}`);
              console.error(`   Available properties:`, Object.keys(recipient || {}).join(', '));
              allSuccessful = false;
              continue;
            }
            
            // Determine delivery method based on contact format
            if (recipientContact.includes('@')) {
              // CRITICAL: Check if recipient is the sender (self-recipient)
              const recipientEmailNormalized = recipientContact.toLowerCase().trim();
              const isSelfRecipient = senderEmail && recipientEmailNormalized === senderEmail;
              
              if (isSelfRecipient) {
                console.log(`📬 SELF-RECIPIENT DETECTED: ${recipientContact} is the sender! Using "from yourself" email template.`);
              }
              
              // Email delivery - pass isSelfRecipient flag
              console.log(`📧 Sending email to: ${recipientContact} (self: ${isSelfRecipient})`);
              success = await this.sendEmailDelivery(
                recipientContact, 
                capsule, 
                mediaFiles, 
                senderName, 
                viewingUrl,
                isSelfRecipient // NEW: Pass self-recipient flag
              );
            } else {
              // Phone/SMS delivery not supported
              console.error(`❌ SMS delivery not supported in this version of Eras. Contact: ${recipientContact}`);
              success = false;
            }
            
            if (!success) {
              allSuccessful = false;
              console.error(`❌ Failed to deliver to recipient: ${recipientContact}`);
              console.error(`   💡 If this is due to Resend sandbox mode, you need to verify a domain at resend.com/domains`);
            } else {
              console.log(`✅ Successfully delivered to recipient: ${recipientContact}`);
            }
          }
          deliverySuccess = allSuccessful;
        }
      }

      if (deliverySuccess) {
        await this.markDeliverySuccessful(capsule);
        
        // Send delivery confirmation email (only for "Someone Else" capsules, respects user preferences)
        await this.sendDeliveryConfirmation(capsule, 'success');
        
        // CRITICAL: Release capsule lock after successful delivery
        await kv.del(capsuleLockKey);
        console.log(`🔓 Capsule lock released for ${capsule.id} after successful delivery`);
        
        return true;
      } else {
        await this.markDeliveryFailed(capsule, 'Delivery method failed');
        // DISABLED: No failure notifications to prevent retry messaging
        // await this.sendDeliveryConfirmation(capsule, 'failed');
        console.log(`📧 Skipping failure notification for capsule ${capsule.id} to prevent retry messaging`);
        
        // CRITICAL: Release capsule lock after failed delivery
        await kv.del(capsuleLockKey);
        console.log(`🔓 Capsule lock released for ${capsule.id} after failed delivery`);
        
        return false;
      }
    } catch (error) {
      console.error(`Error delivering capsule ${capsule.id}:`, error);
      await this.markDeliveryFailed(capsule, error.message);
      
      // CRITICAL: Always release capsule lock even on error
      try {
        await kv.del(capsuleLockKey);
        console.log(`🔓 Capsule lock released for ${capsule.id} after error`);
      } catch (unlockError) {
        console.error(`⚠️ Failed to release capsule lock for ${capsule.id}:`, unlockError);
      }
      
      return false;
    }
  }

  private static async sendEmailDelivery(
    recipientEmail: string,
    capsule: TimeCapsule,
    mediaFiles: MediaFile[],
    senderName: string | undefined,
    viewingUrl: string,
    isSelfRecipient: boolean = false // NEW: Add self-recipient flag
  ): Promise<boolean> {
    try {
      // 🛡️ IDEMPOTENCY CHECK: Prevent duplicate emails for the same capsule and recipient
      // This prevents race conditions where the scheduler might process the same capsule twice
      const idempotencyKey = `email_sent:${capsule.id}:${recipientEmail.toLowerCase().trim()}`;
      
      // 🔥 FIX: Use atomic test-and-set to prevent race conditions
      // Check if key exists FIRST, but don't trust the check alone
      const existingKey = await safeKvGet(() => kv.get(idempotencyKey), idempotencyKey, null, { quiet: true });
      
      if (existingKey) {
        // Email was already sent or is currently being sent
        const status = existingKey.status || 'unknown';
        const age = Date.now() - (existingKey.timestamp || 0);
        
        console.warn(`🛑 [DUPLICATE-PREVENTION] Email to ${recipientEmail} for capsule ${capsule.id} is ${status} (${Math.round(age / 1000)}s ago)`);
        
        // If it's been "sending" for > 5 minutes, assume it failed and allow retry
        if (status === 'sending' && age > 300000) {
          console.warn(`⚠️ [DUPLICATE-PREVENTION] Stale "sending" state (${Math.round(age / 1000)}s old), allowing retry...`);
          // Continue to set the key and send
        } else {
          // Key exists and is recent - definitely a duplicate
          return true; // Return true so we treat it as "handled"
        }
      }
      
      // 🔥 CRITICAL: Set the key IMMEDIATELY with "sending" status to claim this email
      // This prevents any other process from sending the same email (atomic operation)
      await safeKvSet(() => kv.set(idempotencyKey, { 
        timestamp: Date.now(),
        status: 'sending',
        attempt: 1
      }), idempotencyKey, { quiet: true });
      
      console.log(`🔒 [DUPLICATE-PREVENTION] Idempotency key claimed for ${recipientEmail} on capsule ${capsule.id}`);
      
      console.log(`📧 [DELIVERY-SERVICE] sendEmailDelivery called for capsule ${capsule.id}`);
      console.log(`📧 [DELIVERY-SERVICE] Recipient: ${recipientEmail}`);
      console.log(`📧 [DELIVERY-SERVICE] viewingUrl: ${viewingUrl}`);
      
      const mediaData = await this.getMediaFilesWithUrls(mediaFiles);
      
      // Determine if this is self-delivery
      const isSelfDelivery = capsule.recipient_type === 'self';
      
      // IMPORTANT: Use capsule creation/last edit date for email, NOT delivery date
      // This shows when the capsule was originally created or last saved
      const capsuleCreateDate = capsule.updated_at || capsule.created_at || new Date().toISOString();
      
      console.log(`📧 [DELIVERY-SERVICE] Calling EmailService.sendCapsuleDelivery...`);
      const result = await EmailService.sendCapsuleDelivery(recipientEmail, {
        capsuleTitle: capsule.title,
        textMessage: capsule.text_message,
        mediaFiles: mediaData,
        senderName,
        deliveryDate: capsuleCreateDate, // Changed from capsule.delivery_date
        viewingUrl,
        isSelfDelivery,
        isSelfRecipient // NEW: Pass self-recipient flag
      });
      
      console.log(`📧 [DELIVERY-SERVICE] EmailService.sendCapsuleDelivery returned:`, JSON.stringify(result, null, 2));
      console.log(`📧 [DELIVERY-SERVICE] result.success = ${result.success}`);
      
      // If delivery failed, remove the idempotency key so we can retry
      if (!result.success) {
        console.warn(`⚠️ [DELIVERY-SERVICE] Email failed, removing idempotency key to allow retry`);
        await safeKvDel(() => kv.del(idempotencyKey), idempotencyKey);
        return false;
      }
      
      // Update idempotency key to 'sent'
      await safeKvSet(() => kv.set(idempotencyKey, { 
        timestamp: Date.now(),
        status: 'sent' 
      }), idempotencyKey, { quiet: true });
      
      // CRITICAL FIX: Return result.success boolean, not the whole result object
      if (typeof result.success !== 'boolean') {
        console.error(`❌ [DELIVERY-SERVICE] ERROR: result.success is not a boolean! Type: ${typeof result.success}, Value:`, result.success);
        console.error(`❌ [DELIVERY-SERVICE] Full result object:`, result);
        return false;
      }
      
      return result.success;
    } catch (error) {
      console.error(`❌ [DELIVERY-SERVICE] Email delivery error for capsule ${capsule.id}:`, error);
      console.error(`❌ [DELIVERY-SERVICE] Error stack:`, error?.stack);
      
      // Remove idempotency key on error
      try {
        const idempotencyKey = `email_sent:${capsule.id}:${recipientEmail.toLowerCase().trim()}`;
        await safeKvDel(() => kv.del(idempotencyKey), idempotencyKey);
      } catch (e) {
        // Ignore error clearing key
      }
      
      return false;
    }
  }

  private static async getCapsuleMediaFiles(capsuleId: string): Promise<MediaFile[]> {
    try {
      const mediaIds = await kv.get(`capsule_media:${capsuleId}`) || [];
      const mediaFiles: MediaFile[] = [];
      
      for (const mediaId of mediaIds) {
        const mediaFile = await kv.get(`media:${mediaId}`);
        if (mediaFile) {
          mediaFiles.push(mediaFile);
        }
      }
      
      return mediaFiles;
    } catch (error) {
      console.error('Error getting capsule media files:', error);
      return [];
    }
  }

  private static async getMediaFilesWithUrls(mediaFiles: MediaFile[]) {
    const mediaData = [];
    
    for (const file of mediaFiles) {
      try {
        const { data } = await this.supabase.storage
          .from(file.storage_bucket)
          .createSignedUrl(file.storage_path, 3600 * 24 * 7); // 1 week validity for delivery emails
          
        mediaData.push({
          id: file.id,
          file_name: file.file_name,
          file_type: file.file_type,
          url: data?.signedUrl || '#'
        });
      } catch (error) {
        console.warn(`Failed to generate URL for media file ${file.id}:`, error);
      }
    }
    
    return mediaData;
  }

  private static async generateViewingUrl(capsule: TimeCapsule): Promise<string> {
    // Generate a secure viewing token
    const viewingToken = `view_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    
    // Store the viewing token with capsule reference
    await kv.set(`viewing_token:${viewingToken}`, {
      capsule_id: capsule.id,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    });
    
    // Get frontend URL - prefer stored URL from capsule, then env var, then default Figma Make URL
    let frontendUrl = (capsule as any).frontend_url || 
                      Deno.env.get('FRONTEND_URL') || 
                      'https://found-shirt-81691824.figma.site';
    
    if ((capsule as any).frontend_url) {
      console.log('✅ Using stored frontend_url from capsule:', frontendUrl);
    } else if (Deno.env.get('FRONTEND_URL')) {
      console.log('✅ Using FRONTEND_URL environment variable:', frontendUrl);
    } else {
      console.log('⚠️ Using default Figma Make URL (capsule created before frontend_url feature):', frontendUrl);
    }
    
    const viewingUrl = `${frontendUrl}/view/${viewingToken}`;
    console.log('🔗 Generated viewing URL:', viewingUrl);
    
    return viewingUrl;
  }

  private static async getUserAuth(userId: string) {
    try {
      const { data } = await this.supabase.auth.admin.getUserById(userId);
      return data.user;
    } catch (error) {
      console.error('Error getting user auth:', error);
      return null;
    }
  }

  private static async updateDeliveryAttempt(capsule: TimeCapsule) {
    const attempts = (capsule.delivery_attempts || 0) + 1;
    const updatedCapsule = {
      ...capsule,
      delivery_attempts: attempts,
      last_delivery_attempt: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await kv.set(`capsule:${capsule.id}`, updatedCapsule);
  }

  private static async markDeliverySuccessful(capsule: TimeCapsule) {
    // Get media file IDs to include in the capsule object for easier retrieval later
    const mediaIds = await kv.get(`capsule_media:${capsule.id}`) || [];
    
    const updatedCapsule = {
      ...capsule,
      status: 'delivered' as const,
      delivered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      media_files: mediaIds // Store media IDs for easier access when fetching received capsules
    };
    
    await kv.set(`capsule:${capsule.id}`, updatedCapsule);

    // PHASE 5B: Remove from global scheduled list
    try {
      const scheduledList = await kv.get('scheduled_capsules_global') || [];
      const filtered = scheduledList.filter((id: string) => id !== capsule.id);
      if (filtered.length < scheduledList.length) {
        await kv.set('scheduled_capsules_global', filtered);
        console.log(`✅ Removed capsule ${capsule.id} from global scheduled list (${filtered.length} remaining)`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to remove capsule from scheduled list (non-critical):', error);
    }

    // Add capsule to recipient's received list
    try {
      // For self-delivery, add to sender's received list
      if (capsule.recipient_type === 'self') {
        const userId = capsule.created_by;
        const receivedKey = `user_received:${userId}`;
        const receivedList = await kv.get(receivedKey) || [];
        
        if (!receivedList.includes(capsule.id)) {
          receivedList.push(capsule.id);
          await kv.set(receivedKey, receivedList);
          console.log(`✅ Added capsule ${capsule.id} to user ${userId}'s received list (self-delivery)`);
          
          // CREATE NOTIFICATION: New received capsule
          await this.createReceivedNotification(userId, capsule, 'You (Past Self)');
          
          // Track achievement
          try {
            console.log(`🎯 [Achievement] Tracking capsule_received for user ${userId}`);


            await checkAndUnlockAchievements(userId, 'capsule_received', {
              capsuleId: capsule.id,
              deliveryType: 'self',
              deliveredAt: new Date().toISOString()
            });
            console.log(`✅ [Achievement] Successfully tracked capsule_received`);
          } catch (achievementError) {
            console.error(`❌ [Achievement] Failed to track capsule_received:`, achievementError);
            // Don't let achievement tracking failure block delivery
          }
        }
      } else {
        // ✅ CRITICAL FIX: For "others" delivery, try to find existing user by email
        // If user exists, add to their received list immediately
        // If not, add to pending list (existing behavior)
        
        console.log(`📧 Processing "others" delivery for capsule ${capsule.id}`);
        
        let recipientEmails: string[] = [];
        
        // Extract all recipient emails from the recipients array
        if (capsule.recipients && Array.isArray(capsule.recipients)) {
          for (const recipient of capsule.recipients) {
            let email: string | null = null;
            
            if (typeof recipient === 'string' && recipient.includes('@')) {
              email = recipient.toLowerCase().trim();
            } else if (typeof recipient === 'object' && recipient !== null) {
              const r = recipient as any;
              const extracted = r.email || r.value || r.contact || r.address;
              if (extracted && typeof extracted === 'string' && extracted.includes('@')) {
                email = extracted.toLowerCase().trim();
              }
            }
            
            if (email && !recipientEmails.includes(email)) {
              recipientEmails.push(email);
            }
          }
        }
        
        console.log(`📧 Found ${recipientEmails.length} unique recipient email(s) for capsule ${capsule.id}`);
        
        // Track whether we found ANY existing users
        let foundExistingUser = false;
        
        // For each recipient email, check if user exists
        for (const email of recipientEmails) {
          try {
            console.log(`🔍 Checking if user exists for email: ${email}`);
            
            // Try to find user by email using Supabase Auth
            const { data: users, error } = await this.supabase.auth.admin.listUsers();
            
            if (!error && users && users.users) {
              const matchingUser = users.users.find(u => u.email?.toLowerCase() === email);
              
              if (matchingUser) {
                foundExistingUser = true;
                
                // ✅ User exists! Add directly to their received list
                const receivedKey = `user_received:${matchingUser.id}`;
                const receivedList = await kv.get(receivedKey) || [];
                
                if (!receivedList.includes(capsule.id)) {
                  receivedList.push(capsule.id);
                  await kv.set(receivedKey, receivedList);
                  console.log(`✅ 🎯 IMMEDIATELY added capsule ${capsule.id} to existing user ${matchingUser.id}'s (${email}) received list - NO CLAIM-PENDING NEEDED!`);
                  
                  // Get sender name for notification
                  let senderName = 'Someone Special';
                  try {
                    const senderProfile = await kv.get(`profile:${capsule.created_by}`);
                    if (senderProfile) {
                      senderName = senderProfile.display_name || 
                                 `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim() || 
                                 'Someone Special';
                    }
                  } catch (profileError) {
                    console.warn(`⚠️ Could not load sender profile:`, profileError);
                  }
                  
                  // Create notification for existing user
                  await this.createReceivedNotification(matchingUser.id, capsule, senderName);
                  
                  // Track achievement for existing user
                  try {
                    console.log(`🎯 [Achievement] Tracking capsule_received for existing user ${matchingUser.id}`);
                    await checkAndUnlockAchievements(matchingUser.id, 'capsule_received', {
                      capsuleId: capsule.id,
                      deliveryType: 'received',
                      deliveredAt: new Date().toISOString()
                    });
                    console.log(`✅ [Achievement] Successfully tracked capsule_received for existing user`);
                  } catch (achievementError) {
                    console.error(`❌ [Achievement] Failed to track capsule_received:`, achievementError);
                    // Don't let achievement tracking failure block delivery
                  }
                } else {
                  console.log(`ℹ️ Capsule ${capsule.id} already in user ${matchingUser.id}'s received list`);
                }
              } else {
                console.log(`📋 User ${email} doesn't exist yet, will add to pending list`);
              }
            } else {
              console.warn(`⚠️ Error querying users for ${email}:`, error);
            }
          } catch (userLookupError) {
            console.warn(`⚠️ Error looking up user ${email}:`, userLookupError);
          }
        }
        
        // If no existing users were found, add to pending list (existing behavior)
        if (!foundExistingUser) {
          console.log(`📋 No existing users found for capsule ${capsule.id}, adding to pending list`);
          await this.addToPendingCapsules(capsule);
          console.log(`📋 [Achievement] capsule_received tracking deferred until recipient claims capsule`);
          console.log(`📋 Notification for capsule ${capsule.id} will be created when recipient claims it`);
        }
      }
    } catch (error) {
      console.warn('Failed to add capsule to received list:', error);
    }
  }

  // Helper function to create received notification (centralized for both self and others delivery)
  private static async createReceivedNotification(userId: string, capsule: TimeCapsule, senderName: string) {
    try {
      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const notification = {
        id: notificationId,
        type: (senderName === 'You (Past Self)' || senderName.includes('Past Self')) ? 'received' : 'received_capsule',
        capsuleId: capsule.id,
        capsuleTitle: capsule.title || 'Untitled Capsule',
        senderName: senderName,
        message: senderName === 'You (Past Self)' 
          ? `Your time capsule "${capsule.title || 'Untitled Capsule'}" has been delivered!`
          : `${senderName} sent you a time capsule: "${capsule.title || 'Untitled Capsule'}"`,
        timestamp: new Date().toISOString(),
        read: false
      };
      
      // Add to user's notifications array (using single array system)
      const notificationsKey = `notifications:${userId}`;
      const notifications = await kv.get(notificationsKey) || [];
      notifications.unshift(notification); // Add to front
      
      // Keep only last 100 notifications
      if (notifications.length > 100) {
        notifications.splice(100);
      }
      
      await kv.set(notificationsKey, notifications);
      console.log(`🔔 Created "received_capsule" notification for user ${userId}`);
    } catch (notifError) {
      console.error(`❌ Failed to create notification:`, notifError);
      // Don't let notification failure block delivery
    }
  }

  private static async addToPendingCapsules(capsule: TimeCapsule) {
    try {
      // Extract recipient email from recipient_contacts
      let recipientEmail: string | null = null;

      if (capsule.recipient_contacts && Array.isArray(capsule.recipient_contacts)) {
        for (const contact of capsule.recipient_contacts) {
          if (typeof contact === 'string' && contact.includes('@')) {
            recipientEmail = contact.toLowerCase();
            break;
          } else if (typeof contact === 'object' && contact !== null) {
            const contactObj = contact as any;
            const email = 
              contactObj.email || 
              contactObj.value || 
              contactObj.contact || 
              contactObj.address;
            if (email && typeof email === 'string' && email.includes('@')) {
              recipientEmail = email.toLowerCase();
              break;
            }
          }
        }
      }

      if (recipientEmail) {
        const pendingKey = `pending_capsules:${recipientEmail}`;
        const pendingList = await kv.get(pendingKey) || [];
        
        if (!pendingList.includes(capsule.id)) {
          pendingList.push(capsule.id);
          await kv.set(pendingKey, pendingList);
          console.log(`✅ Added capsule ${capsule.id} to pending list for ${recipientEmail}`);
        }
      } else {
        console.warn(`⚠️ Could not extract email from capsule ${capsule.id} recipient_contacts`);
      }
    } catch (error) {
      console.error('Error adding to pending capsules:', error);
    }
  }

  private static async markDeliveryFailed(capsule: TimeCapsule, error: string) {
    const attempts = capsule.delivery_attempts || 0;
    
    console.log(`🔄 Converting failed capsule ${capsule.id} to draft`);
    console.log(`📎 Media files to preserve: ${capsule.media_files?.length || 0}`);
    console.log(`🔗 Media URLs to preserve: ${capsule.media_urls?.length || 0}`);
    
    // ✅ CRITICAL: Explicitly preserve media arrays
    const preservedMediaFiles = capsule.media_files || [];
    const preservedMediaUrls = capsule.media_urls || [];
    
    // Log each media file for verification
    if (preservedMediaFiles.length > 0) {
      console.log(`📋 Preserving media files:`, preservedMediaFiles);
    }
    
    // Convert to draft with explicit media preservation
    const updatedCapsule = {
      ...capsule,
      status: 'draft' as const, // ✅ Changed from 'failed' to 'draft'
      
      // ✅ EXPLICIT: Preserve media (don't rely on spread)
      media_files: preservedMediaFiles,
      media_urls: preservedMediaUrls,
      
      // Add failure context
      failure_reason: error,
      failed_at: new Date().toISOString(),
      original_delivery_date: capsule.delivery_date,
      
      // Clear delivery fields (user must set new date/time)
      delivery_date: null as any,
      delivery_time: null as any,
      
      // Keep old error field for backwards compatibility
      delivery_error: error,
      updated_at: new Date().toISOString()
    };
    
    // ✅ VERIFICATION: Confirm media counts match
    if (updatedCapsule.media_files.length !== preservedMediaFiles.length) {
      console.error(`❌ MEDIA LOSS DETECTED! Expected ${preservedMediaFiles.length}, got ${updatedCapsule.media_files.length}`);
      throw new Error('Media files would be lost during failure conversion - aborting');
    }
    
    console.log(`✅ Verified: ${updatedCapsule.media_files.length} media files preserved`);
    console.log(`🔄 Converting capsule ${capsule.id} from 'failed' to 'draft' after ${attempts} attempt(s): ${error}`);
    await kv.set(`capsule:${capsule.id}`, updatedCapsule);
    
    // 🔔 CRITICAL: Create failure notification for the creator
    try {
      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const notification = {
        id: notificationId,
        type: 'delivery_failed',
        capsuleId: capsule.id,
        capsuleTitle: capsule.title || 'Untitled Capsule',
        message: `Your time capsule "${capsule.title || 'Untitled Capsule'}" couldn't be delivered and is back in Drafts`, // ✅ Updated message
        errorMessage: error,
        originalDeliveryDate: capsule.delivery_date, // ✅ Include original date
        mediaCount: preservedMediaFiles.length, // ✅ Include media count
        timestamp: new Date().toISOString(),
        read: false
      };
      
      // Add to creator's notifications array
      const notificationsKey = `notifications:${capsule.created_by}`;
      const notifications = await kv.get(notificationsKey) || [];
      notifications.unshift(notification); // Add to front
      
      // Keep only last 100 notifications
      if (notifications.length > 100) {
        notifications.splice(100);
      }
      
      await kv.set(notificationsKey, notifications);
      console.log(`🔔 Created "delivery_failed" notification for user ${capsule.created_by} (${preservedMediaFiles.length} media files preserved)`);
    } catch (notifError) {
      console.error(`❌ Failed to create failure notification:`, notifError);
      // Don't let notification failure block the failure marking
    }
    
    // PHASE 5B: Remove from global scheduled list
    try {
      const scheduledList = await kv.get('scheduled_capsules_global') || [];
      const filtered = scheduledList.filter((id: string) => id !== capsule.id);
      if (filtered.length < scheduledList.length) {
        await kv.set('scheduled_capsules_global', filtered);
        console.log(`✅ Removed failed capsule ${capsule.id} from global scheduled list (${filtered.length} remaining)`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to remove capsule from scheduled list (non-critical):', error);
    }
    
    // IMPORTANT: Remove from received lists if it was incorrectly added
    try {
      if (capsule.recipient_type === 'self') {
        const userId = capsule.created_by;
        const receivedKey = `user_received:${userId}`;
        const receivedList = await kv.get(receivedKey) || [];
        
        const filteredList = receivedList.filter((id: string) => id !== capsule.id);
        if (filteredList.length !== receivedList.length) {
          await kv.set(receivedKey, filteredList);
          console.log(`🧹 Removed failed capsule ${capsule.id} from user ${userId}'s received list`);
        }
      } else if (capsule.recipient_type === 'others' && capsule.recipients) {
        // Also clean up from "others" recipients' pending lists
        for (const recipient of capsule.recipients) {
          let recipientEmail = '';
          if (typeof recipient === 'string') {
            recipientEmail = recipient;
          } else if (typeof recipient === 'object' && recipient !== null) {
            const r = recipient as any;
            recipientEmail = r.email || r.phone || r.contact || r.value || r.address || '';
          }
          
          if (recipientEmail && recipientEmail.includes('@')) {
            const pendingKey = `pending_capsules:${recipientEmail.toLowerCase().trim()}`;
            try {
              const pendingList = await kv.get(pendingKey) || [];
              const filteredList = pendingList.filter((id: string) => id !== capsule.id);
              if (filteredList.length !== pendingList.length) {
                await kv.set(pendingKey, filteredList);
                console.log(`🧹 Removed failed capsule ${capsule.id} from pending list for ${recipientEmail}`);
              }
            } catch (err) {
              console.warn(`⚠️ Failed to clean up pending list for ${recipientEmail}:`, err);
            }
          }
        }
      }
    } catch (cleanupError) {
      console.error('Error cleaning up failed capsule from received list:', cleanupError);
    }
    
    // ✅ Final confirmation log
    console.log(`✅ Capsule ${capsule.id} converted to draft with ${preservedMediaFiles.length} media files intact`);
  }

  private static async sendDeliveryConfirmation(capsule: TimeCapsule, status: 'success' | 'failed') {
    try {
      // ONLY send success confirmations - no failure notifications
      if (status === 'failed') {
        console.log(`📧 Skipping failure notification for capsule ${capsule.id} - failure notifications disabled`);
        return;
      }

      // ONLY send delivery confirmation for "someone else" capsules, NOT for self-delivery
      if (capsule.recipient_type === 'self') {
        console.log(`📧 Skipping delivery confirmation for self-delivery capsule ${capsule.id}`);
        return;
      }

      const userAuth = await this.getUserAuth(capsule.created_by);
      if (!userAuth?.email) return;
      
      // CRITICAL FIX: If the sender sent a capsule to themselves using "Someone Else" mode,
      // don't send a delivery confirmation because they already got the capsule delivery email
      const senderEmail = userAuth.email.toLowerCase().trim();
      if (capsule.recipients && capsule.recipients.length > 0) {
        // Check if any recipient is the sender themselves
        for (const recipient of capsule.recipients) {
          let recipientContact = '';
          if (typeof recipient === 'string') {
            recipientContact = recipient;
          } else if (typeof recipient === 'object' && recipient !== null) {
            const r = recipient as any;
            recipientContact = r.email || r.phone || r.contact || r.value || r.address || '';
          }
          
          // If sender sent to themselves, skip confirmation
          if (recipientContact && recipientContact.toLowerCase().trim() === senderEmail) {
            console.log(`📧 Skipping delivery confirmation - sender ${senderEmail} sent capsule to themselves using "Someone Else" mode`);
            return;
          }
        }
      }

      // Check user's notification preferences
      const notificationPrefs = userAuth.user_metadata?.notificationPreferences;
      if (notificationPrefs && notificationPrefs.emailDeliveryConfirmations === false) {
        console.log(`📧 User has disabled delivery confirmation emails, skipping for capsule ${capsule.id}`);
        return;
      }

      // Get the first recipient email from the capsule
      let recipientEmail = 'recipient';
      
      if (capsule.recipients && capsule.recipients.length > 0) {
        const firstRecipient = capsule.recipients[0];
        
        if (typeof firstRecipient === 'string') {
          recipientEmail = firstRecipient;
        } else if (typeof firstRecipient === 'object' && firstRecipient !== null) {
          const recipientObj = firstRecipient as any;
          recipientEmail = 
            recipientObj.email || 
            recipientObj.phone || 
            recipientObj.contact || 
            recipientObj.value || 
            recipientObj.address || 
            'recipient';
        }
      }

      console.log(`📧 Sending delivery confirmation to ${userAuth.email} about delivery to ${recipientEmail}`);

      await EmailService.sendDeliveryNotification(
        userAuth.email,
        capsule.title,
        recipientEmail
      );
    } catch (error) {
      console.error('Error sending delivery confirmation:', error);
    }
  }

  static async getViewingCapsule(viewingToken: string) {
    try {
      const tokenData = await kv.get(`viewing_token:${viewingToken}`);
      if (!tokenData) return null;

      // Check if token is expired
      const expiresAt = new Date(tokenData.expires_at);
      if (expiresAt < new Date()) {
        await kv.del(`viewing_token:${viewingToken}`);
        return null;
      }

      const capsule = await kv.get(`capsule:${tokenData.capsule_id}`);
      return capsule;
    } catch (error) {
      console.error('Error getting viewing capsule:', error);
      return null;
    }
  }

  private static async getUserAuth(userId: string) {
    try {
      // Get user information from Supabase Auth
      const { data: user, error } = await this.supabase.auth.admin.getUserById(userId);
      if (error || !user) {
        console.error('Error getting user auth:', error);
        return null;
      }
      return user.user;
    } catch (error) {
      console.error('Error in getUserAuth:', error);
      return null;
    }
  }
}