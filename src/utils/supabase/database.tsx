import { projectId, publicAnonKey } from './info';
import { TimeCapsule, MediaFile } from './client';
import { supabase } from './client';
import { toast } from 'sonner';

// KV Store based database service - no separate tables needed
export class DatabaseService {
  private static baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7`;
  private static REQUEST_TIMEOUT = 60000; // 60 seconds - reduced from 120s
  private static QUICK_TIMEOUT = 15000; // 15 seconds - reduced to fail fast
  private static MEDIUM_TIMEOUT = 30000; // 30 seconds - reduced from 45s
  private static CLAIM_TIMEOUT = 10000; // 10 seconds for claim-pending (returns immediately now)
  
  // In-memory cache for media file requests to prevent duplicate parallel requests
  private static mediaFileCache = new Map<string, Promise<MediaFile[]>>();
  private static MEDIA_CACHE_TTL = 5000; // 5 seconds TTL for deduplication during batch loads

  // Clear media cache - call this when media is updated
  static clearMediaCache() {
    this.mediaFileCache.clear();
    console.log('🧹 Media file cache cleared');
  }

  // Get the current user's access token
  private static async getAccessToken(): Promise<string | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('⚠️ Error getting session:', error);
        return null;
      }
      
      if (!session) {
        // This is normal when user is not logged in - don't log as error
        console.log('ℹ️ No active session (user not authenticated)');
        return null;
      }
      
      if (!session.access_token) {
        console.error('❌ Session exists but no access_token');
        return null;
      }
      
      console.log('✅ Access token retrieved');
      return session.access_token;
    } catch (error) {
      console.error('❌ Exception getting access token:', error);
      return null;
    }
  }

  static async makeRequest(
    endpoint: string, 
    options: RequestInit = {}, 
    maxRetries: number = 3, // Total number of attempts (not additional retries). Minimum 1.
    useAuth: boolean = true, // Changed default to true - most requests need authentication
    customTimeout?: number // Optional custom timeout in milliseconds
  ) {
    const requestStartTime = Date.now();
    const timeoutToUse = customTimeout || this.REQUEST_TIMEOUT;
    
    console.log(`🌐 Making database request to: ${this.baseUrl}${endpoint}`);
    console.log(`🌐 Request options:`, { 
      method: options.method || 'GET', 
      hasBody: !!options.body,
      timeout: `${timeoutToUse / 1000}s`,
      maxRetries 
    });
    
    // Check if baseUrl is valid
    if (!projectId || projectId === 'undefined' || projectId === '') {
      throw new Error('Supabase project ID is not configured. Please check your environment settings.');
    }
    
    // Get access token if authentication is required
    let authToken = publicAnonKey;
    if (useAuth) {
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        // Don't log as error - this is expected when user is not authenticated
        throw new Error('Authentication required but no valid session found');
      }
      authToken = accessToken;
      console.log('✅ Using authenticated request');
    } else {
      console.log('🔓 Using public request');
    }
    
    // Ensure at least 1 attempt is made (maxRetries = 0 means 1 attempt, no retries)
    const totalAttempts = Math.max(maxRetries, 1);
    
    for (let attempt = 1; attempt <= totalAttempts; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutToUse);
        
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });
        
        clearTimeout(timeoutId);

        console.log(`🌐 Response status (attempt ${attempt}): ${response.status} ${response.statusText}`);

        // Handle 502 Bad Gateway errors with retry
        if (response.status === 502 && attempt < totalAttempts) {
          console.warn(`⚠️ 502 Bad Gateway on attempt ${attempt}, retrying in ${attempt * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          continue;
        }

        if (!response.ok) {
          let errorDetails;
          try {
            const errorText = await response.text();
            console.error(`❌ Server error response:`, errorText);
            try {
              errorDetails = JSON.parse(errorText);
            } catch {
              errorDetails = { message: errorText };
            }
          } catch (parseError) {
            console.error(`❌ Failed to parse error response:`, parseError);
            errorDetails = { message: `HTTP ${response.status}: ${response.statusText}` };
          }
          
          const errorMessage = errorDetails.error || errorDetails.message || `Database request failed: ${response.status} ${response.statusText}`;
          console.error(`❌ Database request failed:`, errorMessage);
          
          // Special handling for 502 errors
          if (response.status === 502) {
            throw new Error(`Server temporarily unavailable (502). Please try again in a moment.`);
          }
          
          throw new Error(errorMessage);
        }

        const responseData = await response.json();
        const requestDuration = Date.now() - requestStartTime;
        console.log(`✅ Database request successful on attempt ${attempt}/${totalAttempts} (took ${requestDuration}ms)`);
        return responseData;
      } catch (error) {
        console.error(`💥 Database request error (attempt ${attempt}):`, error);
        
        // Check if this is an abort/timeout error
        const isTimeoutError = error.name === 'AbortError' || 
                              error.message?.includes('aborted') ||
                              error.message?.includes('timeout');
        
        // Check if this is a network/fetch error
        const isNetworkError = error.message?.includes('Failed to fetch') ||
                              error.message?.includes('fetch') ||
                              error.message?.includes('NetworkError') ||
                              error.name === 'TypeError';
        
        if (isTimeoutError) {
          const requestDuration = Date.now() - requestStartTime;
          console.error(`⏱️ Request to ${endpoint} timed out after ${requestDuration}ms (limit: ${timeoutToUse}ms)`);
        }
        
        if (isNetworkError && !isTimeoutError) {
          console.error(`🌐 Network error detected. Possible causes:`);
          console.error(`   - Supabase Edge Function server may be unreachable`);
          console.error(`   - CORS configuration issue`);
          console.error(`   - No internet connection`);
          console.error(`   - Supabase project ID: ${projectId ? 'Set' : 'Missing'}`);
          console.error(`   - Target URL: ${this.baseUrl}${endpoint}`);
        }
        
        // If this is the last attempt or it's not a retryable error, throw
        if (attempt === totalAttempts || 
            (!error.message?.includes('502') && 
             !isNetworkError && 
             !isTimeoutError)) {
          
          // Provide helpful error messages
          if (isTimeoutError) {
            throw new Error(`Request to ${endpoint} timed out after ${timeoutToUse}ms. The server may be slow or unreachable.`);
          }
          
          if (isNetworkError) {
            throw new Error(`Cannot connect to the server. Please check:\n• Your internet connection\n• The Supabase Edge Function is deployed and running\n• Project ID is configured correctly: ${projectId ? '✓' : '✗'}`);
          }
          
          throw error;
        }
        
        // Wait before retry with exponential backoff
        const delay = Math.min(attempt * 1000, 5000);
        console.log(`⏳ Waiting ${delay}ms before retry (attempt ${attempt}/${totalAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // If we get here, all attempts failed
    throw new Error(`All ${totalAttempts} connection attempt(s) failed. The server appears to be unreachable.`);
  }

  // Time Capsules - stored in KV with prefix "capsule:"
  static async createTimeCapsule(capsuleData: Omit<TimeCapsule, 'id' | 'created_at' | 'updated_at'>) {
    const id = `capsule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    // Capture the frontend URL for generating viewing links later
    const frontendUrl = window.location.origin;
    
    const capsule: TimeCapsule = {
      ...capsuleData,
      id,
      created_at: timestamp,
      updated_at: timestamp,
      frontend_url: frontendUrl, // Store the frontend URL for email links
    };

    await this.makeRequest('/api/kv/set', {
      method: 'POST',
      body: JSON.stringify({
        key: `capsule:${id}`,
        value: capsule
      })
    });

    // Also store in user's capsule list
    const userCapsulesKey = `user_capsules:${capsuleData.user_id}`;
    let isFirstCapsule = false;
    try {
      const existingCapsules = await this.makeRequest(`/api/kv/get?key=${userCapsulesKey}`);
      const capsuleList = existingCapsules?.value || [];
      isFirstCapsule = capsuleList.length === 0; // Check if this is the first capsule
      capsuleList.push(id);
      
      await this.makeRequest('/api/kv/set', {
        method: 'POST',
        body: JSON.stringify({
          key: userCapsulesKey,
          value: capsuleList
        })
      });
    } catch {
      // First capsule for this user
      isFirstCapsule = true;
      await this.makeRequest('/api/kv/set', {
        method: 'POST',
        body: JSON.stringify({
          key: userCapsulesKey,
          value: [id]
        })
      });
    }

    // 🏆 TRACK ACHIEVEMENT: Capsule created
    // This will automatically check for and unlock relevant achievements
    try {
      console.log('🏆 Tracking capsule_created achievement...');
      const accessToken = await this.getAccessToken();
      if (accessToken) {
        await this.makeRequest('/achievements/track', {
          method: 'POST',
          body: JSON.stringify({
            action: 'capsule_created',
            metadata: {
              capsuleId: id,
              isFirstCapsule: isFirstCapsule,
              hasMedia: capsuleData.media_files && capsuleData.media_files.length > 0,
              mediaCount: capsuleData.media_files?.length || 0
            }
          })
        }, 2, true, 10000); // 2 retries, auth required, 10 second timeout
        
        console.log('✅ Achievement tracking completed');
        
        // If this is the first capsule, show a special celebration
        if (isFirstCapsule) {
          console.log('🎉 First capsule created - achievement should unlock!');
        }
      } else {
        console.warn('⚠️ Could not track achievement: No access token');
      }
    } catch (error) {
      console.error('⚠️ Achievement tracking failed (non-critical):', error);
      // Don't fail capsule creation if achievement tracking fails
    }

    return capsule;
  }

  static async getUserTimeCapsules(userId: string, limit?: number, offset: number = 0, skipMedia: boolean = false) {
    try {
      // Use the proper REST API endpoint to get all user's capsules
      console.log(`📡 Fetching capsules for user ${userId} via REST API...`);
      // Use shorter timeout with 1 retry for faster failure and recovery
      const response = await this.makeRequest(
        '/api/capsules', 
        {}, 
        1, // Only 1 retry (reduced from 2) for faster error detection
        true, // Use authentication
        25000 // 25 second timeout (reduced from 40) to fail faster
      );
      
      if (!response) {
        console.log('ℹ️ Empty response from server');
        return { capsules: [], total: 0, hasMore: false };
      }
      
      // Handle timeout or error response from backend
      if (response.error) {
        console.warn('⚠️ Backend query error:', response.error);
        
        // If it's a timeout, return empty gracefully (don't throw error)
        if (response.timeout) {
          console.log('⏳ Database timeout - returning empty result for graceful degradation');
          return { capsules: [], total: 0, hasMore: false };
        }
        
        // For other errors, return empty array for graceful degradation
        return { capsules: [], total: 0, hasMore: false };
      }
      
      if (!response.capsules) {
        console.log('ℹ️ No capsules found for user');
        return { capsules: [], total: 0, hasMore: false };
      }

      let allCapsules = response.capsules;
      const total = allCapsules.length;
      
      console.log(`✅ Fetched ${total} capsules from API`);

      // Sort by created_at (newest first)
      allCapsules.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Apply pagination
      const paginatedCapsules = limit ? allCapsules.slice(offset, offset + limit) : allCapsules;
      const hasMore = limit ? offset + limit < total : false;

      // Skip media loading if requested (for fetching all metadata quickly)
      if (skipMedia) {
        // CRITICAL FIX: Explicitly set attachments to undefined (not empty array)
        // This ensures the frontend knows that media hasn't been loaded yet
        // and can trigger hydration/merging logic correctly
        const capsulesWithoutMedia = paginatedCapsules.map(c => {
          const { attachments, ...rest } = c; // Remove existing attachments if any
          return rest;
        });

        return {
          capsules: capsulesWithoutMedia,
          total: total,
          hasMore: hasMore
        };
      }

      // Load media files for each capsule in parallel with timeout protection
      console.log('📎 Loading media files for capsules...');
      const mediaLoadPromises = paginatedCapsules.map(async (capsule) => {
        try {
          // Backfill delivery_time from delivery_date if missing
          if (!capsule.delivery_time && capsule.delivery_date) {
            const deliveryDateTime = new Date(capsule.delivery_date);
            if (!isNaN(deliveryDateTime.getTime())) {
              const hours = String(deliveryDateTime.getUTCHours()).padStart(2, '0');
              const minutes = String(deliveryDateTime.getUTCMinutes()).padStart(2, '0');
              capsule.delivery_time = `${hours}:${minutes}`;
              
              // Update the capsule in the background (don't await to avoid slowing down response)
              this.makeRequest('/api/kv/set', {
                method: 'POST',
                body: JSON.stringify({
                  key: `capsule:${capsule.id}`,
                  value: capsule
                })
              }).catch(err => console.warn('Failed to backfill delivery_time:', err));
            }
          }
          
          // Fetch media with increased timeout to prevent hanging
          const mediaFetchPromise = this.getCapsuleMediaFiles(capsule.id);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Media fetch timeout')), 60000) // 60 seconds for slow connections
          );
          
          const mediaFiles = await Promise.race([mediaFetchPromise, timeoutPromise]);
          
          // Add attachments property to capsule with basic info
          capsule.attachments = mediaFiles.map(file => ({
            id: file.id,
            url: file.url,
            thumbnail: file.thumbnail, // ✅ Pass through pre-generated thumbnail for instant loading
            type: file.file_type,
            filename: file.file_name,
            size: file.file_size
          }));
        } catch (error) {
          const timeoutMsg = error.message?.includes('timeout') ? 'Media fetch timeout' : error.message;
          console.warn(`⚠️ Could not fetch media files for ${capsule.status === 'received' ? 'received capsule' : 'capsule'} ${capsule.id}: ${timeoutMsg}`);
          capsule.attachments = [];
        }
      });
      
      // Wait for all media loads but don't fail if some timeout
      await Promise.allSettled(mediaLoadPromises);
      console.log('✅ Media files loaded for all capsules');

      return {
        capsules: paginatedCapsules,
        total: total,
        hasMore: hasMore
      };
    } catch (error) {
      console.error('Error getting user capsules:', error);
      return { capsules: [], total: 0, hasMore: false };
    }
  }

  // Get basic stats without loading full capsules
  static async getUserCapsulesStats(userId: string) {
    try {
      const userCapsulesKey = `user_capsules:${userId}`;
      const response = await this.makeRequest(`/api/kv/get?key=${userCapsulesKey}`);
      const capsuleIds = response?.value || [];
      
      return {
        total: capsuleIds.length,
        hasCapsules: capsuleIds.length > 0
      };
    } catch (error) {
      console.error('Error getting capsule stats:', error);
      return { total: 0, hasCapsules: false };
    }
  }

  static async getTimeCapsule(id: string) {
    try {
      console.log(`📡 Fetching capsule ${id} via REST API...`);
      const response = await this.makeRequest(`/api/capsules/${id}`, {}, 3, true);
      return response?.capsule || null;
    } catch (error) {
      console.error(`Failed to fetch capsule ${id}:`, error);
      return null;
    }
  }

  static async updateTimeCapsule(id: string, updates: Partial<TimeCapsule>) {
    const existing = await this.getTimeCapsule(id);
    if (!existing) throw new Error('Capsule not found');

    const updated = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString()
    };

    await this.makeRequest('/api/kv/set', {
      method: 'POST',
      body: JSON.stringify({
        key: `capsule:${id}`,
        value: updated
      })
    });

    return updated;
  }

  static async deleteTimeCapsule(id: string) {
    console.log(`🗑️ Deleting capsule ${id}...`);
    const capsule = await this.getTimeCapsule(id);
    if (!capsule) {
      console.log(`ℹ️ Capsule ${id} not found (already deleted) - will clean up references`);
      
      // GHOST CLEANUP DISABLED: These queries fetch ALL user lists and timeout on large databases
      // If there are ghost references, they should be cleaned up lazily (ignored when user capsules load)
      // Trying to clean up ALL lists when ONE capsule is deleted is inefficient
      // The capsule is already gone, ghost IDs in user lists are harmless (filtered out on load)
      if (false) {
        try {
          // Get all user_received lists and remove this ID
          const allReceivedResponse = await this.makeRequest('/api/kv/prefix?prefix=user_received:', {}, 1);
          const allReceivedLists = allReceivedResponse?.values || {};
          
          for (const [key, receivedIds] of Object.entries(allReceivedLists)) {
            if (Array.isArray(receivedIds) && receivedIds.includes(id)) {
              const updatedReceivedList = receivedIds.filter((cId: string) => cId !== id);
              await this.makeRequest('/api/kv/set', {
                method: 'POST',
                body: JSON.stringify({
                  key,
                  value: updatedReceivedList
                })
              });
              console.log(`🧹 Cleaned up ghost reference to ${id} from ${key}`);
            }
          }
          
          // Get all user capsule lists and remove this ID
          const allCapsulesResponse = await this.makeRequest('/api/kv/prefix?prefix=user_capsules:', {}, 1);
          const allCapsuleLists = allCapsulesResponse?.values || {};
          
          for (const [key, capsuleIds] of Object.entries(allCapsuleLists)) {
            if (Array.isArray(capsuleIds) && capsuleIds.includes(id)) {
              const updatedList = capsuleIds.filter((cId: string) => cId !== id);
              await this.makeRequest('/api/kv/set', {
                method: 'POST',
                body: JSON.stringify({
                  key,
                  value: updatedList
                })
              });
              console.log(`🧹 Cleaned up ghost reference to ${id} from ${key}`);
            }
          }
        } catch (error) {
          console.warn(`⚠️ Failed to clean up ghost references for ${id}:`, error);
        }
      }
      console.log(`ℹ️ Ghost cleanup skipped for ${id} - references will be filtered out on load`);
      
      return; // Successfully handled (nothing to delete)
    }

    // CRITICAL: Remove from user's capsule list FIRST to prevent re-appearance
    // IMPORTANT: Capsules use 'created_by' field, not 'user_id'
    const userId = capsule.created_by || capsule.user_id;
    if (!userId) {
      console.error(`❌ CRITICAL: Capsule ${id} has no user ID (neither created_by nor user_id)`);
      throw new Error(`Cannot delete capsule ${id}: missing user ID`);
    }
    
    // Remove from creator's capsule list
    try {
      const userCapsulesKey = `user_capsules:${userId}`;
      const response = await this.makeRequest(`/api/kv/get?key=${userCapsulesKey}`);
      const capsuleList = response?.value || [];
      const updatedList = capsuleList.filter((cId: string) => cId !== id);
      
      console.log(`📝 Updating user capsule list for ${userId}: ${capsuleList.length} -> ${updatedList.length}`);
      
      await this.makeRequest('/api/kv/set', {
        method: 'POST',
        body: JSON.stringify({
          key: userCapsulesKey,
          value: updatedList
        })
      });
      
      console.log(`✅ Removed capsule ${id} from creator's list`);
    } catch (error) {
      console.error(`❌ CRITICAL: Failed to update user capsule list for ${id}:`, error);
      throw new Error(`Failed to remove capsule from user list: ${error.message}`);
    }

    // GHOST CLEANUP DISABLED: Fetching ALL user_received lists times out on large databases
    // The deleted capsule won't appear in recipient lists because the capsule is gone
    // When users load their received lists, missing capsules are filtered out automatically
    // This cleanup is expensive (scans ALL users) for minimal benefit (prevents ghost IDs)
    if (false) {
      try {
        console.log(`🧹 Searching for all users who received capsule ${id}...`);
        
        // Get all user_received lists
        const allReceivedResponse = await this.makeRequest('/api/kv/prefix?prefix=user_received:', {}, 1);
        const allReceivedLists = allReceivedResponse?.values || {};
        
        let recipientsUpdated = 0;
        
        for (const [key, receivedIds] of Object.entries(allReceivedLists)) {
          if (Array.isArray(receivedIds) && receivedIds.includes(id)) {
            const recipientUserId = key.replace('user_received:', '');
            
            // IMPORTANT: Don't remove from creator's own received list (keep as backup)
            if (recipientUserId === userId) {
              console.log(`🔒 Keeping capsule ${id} in creator's Received list (self-delivered backup)`);
            continue;
            }
            
            const updatedReceivedList = receivedIds.filter((cId: string) => cId !== id);
            
            await this.makeRequest('/api/kv/set', {
              method: 'POST',
              body: JSON.stringify({
                key,
                value: updatedReceivedList
              })
            });
            
            recipientsUpdated++;
            console.log(`✅ Removed capsule ${id} from ${recipientUserId}'s received list (${receivedIds.length} -> ${updatedReceivedList.length})`);
          }
        }
        
        console.log(`✅ Removed capsule ${id} from ${recipientsUpdated} recipient(s)' received lists (kept in creator's list as backup)`);
      } catch (error) {
        console.error(`⚠️ Failed to clean up recipient lists for capsule ${id}:`, error);
        // Don't throw - capsule deletion is more important
      }
    }
    console.log(`ℹ️ Recipient list cleanup skipped for ${id} - ghost IDs will be filtered out automatically`);

    // Remove capsule data AND media associations from KV store
    try {
      // Delete the capsule data
      await this.makeRequest('/api/kv/delete', {
        method: 'POST',
        body: JSON.stringify({
          key: `capsule:${id}`
        })
      });
      console.log(`✅ Deleted capsule data for ${id}`);
      
      // Also delete the capsule_media key (media associations)
      try {
        await this.makeRequest('/api/kv/delete', {
          method: 'POST',
          body: JSON.stringify({
            key: `capsule_media:${id}`
          })
        });
        console.log(`✅ Deleted media associations for ${id}`);
      } catch (mediaError) {
        console.warn(`⚠️ Failed to delete media associations for ${id}:`, mediaError);
        // Don't throw - capsule deletion is more important
      }
    } catch (error) {
      console.error(`❌ Failed to delete capsule data for ${id}:`, error);
      // Don't throw here - the important part is removing from user list
    }
    
    console.log(`✅ Capsule ${id} fully deleted`);
  }

  // User Profile - stored in KV with prefix "profile:"
  static async updateUserProfile(userId: string, updates: {
    first_name?: string;
    last_name?: string;
    display_name?: string;
    email?: string;
  }) {
    const profileKey = `profile:${userId}`;
    try {
      const existing = await this.makeRequest(`/api/kv/get?key=${profileKey}`);
      const profile = {
        ...existing?.value,
        ...updates,
        id: userId,
        updated_at: new Date().toISOString()
      };

      await this.makeRequest('/api/kv/set', {
        method: 'POST',
        body: JSON.stringify({
          key: profileKey,
          value: profile
        })
      });

      return profile;
    } catch (error) {
      // Create new profile
      const profile = {
        ...updates,
        id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await this.makeRequest('/api/kv/set', {
        method: 'POST',
        body: JSON.stringify({
          key: profileKey,
          value: profile
        })
      });

      return profile;
    }
  }

  static async getUserProfile(userId: string) {
    try {
      // Use quick timeout and only 1 retry for simple profile fetch
      const response = await this.makeRequest(
        `/api/kv/get?key=profile:${userId}`,
        {},
        1, // Only 1 retry
        false,
        this.QUICK_TIMEOUT // Use 20 second timeout instead of 60
      );
      return response?.value;
    } catch (error) {
      console.warn(`⚠️ Could not fetch profile for user ${userId}:`, error.message);
      return null;
    }
  }

  // Analytics/Stats
  static async getUserStats(userId: string) {
    const capsules = await this.getUserTimeCapsules(userId);
    
    const total = capsules.length;
    const scheduled = capsules.filter(c => c.status === 'scheduled').length;
    const delivered = capsules.filter(c => c.status === 'delivered').length;
    
    return {
      total,
      scheduled,
      delivered
    };
  }

  // Get accurate capsule stats from server (not affected by pagination)
  static async getCapsuleStats(userId: string) {
    try {
      console.log(`📊 Fetching capsule stats from server for user ${userId}...`);
      const response = await this.makeRequest(
        '/api/capsules/stats', 
        {}, 
        1, // 1 attempt, no retries - fail fast if server is down
        true, // Use authentication
        this.QUICK_TIMEOUT // 15 second timeout
      );
      
      console.log('📊 Raw stats response:', response);
      
      if (!response) {
        console.warn('⚠️ Stats response is null/undefined, returning empty stats');
        return {
          scheduled: 0,
          delivered: 0,
          selfOnlyDelivered: 0,
          draft: 0,
          failed: 0,
          total: 0
        };
      }
      
      if (response.error) {
        console.warn('⚠️ Stats response contains error:', response.error);
        return {
          scheduled: 0,
          delivered: 0,
          selfOnlyDelivered: 0,
          draft: 0,
          failed: 0,
          total: 0
        };
      }
      
      console.log('✅ Server stats loaded successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Exception fetching capsule stats:', error);
      console.error('❌ Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      // Return empty stats instead of null to prevent UI errors
      console.log('⚠️ Returning empty stats due to error');
      return {
        scheduled: 0,
        delivered: 0,
        selfOnlyDelivered: 0,
        draft: 0,
        failed: 0,
        total: 0
      };
    }
  }

  // Mark a capsule as received by the current user
  static async markCapsuleAsReceived(capsuleId: string) {
    try {
      console.log('📨 Marking capsule as received:', capsuleId);
      
      await this.makeRequest(`/api/capsules/${capsuleId}/mark-received`, {
        method: 'POST'
      }, 3, true); // Use authentication

      console.log('✅ Capsule marked as received');
      return true;
    } catch (error) {
      console.error('Error marking capsule as received:', error);
      return false;
    }
  }

  // Mark a capsule as viewed (removes NEW badge)
  static async markCapsuleAsViewed(capsuleId: string) {
    try {
      console.log('👁️ Marking capsule as viewed:', capsuleId);
      
      await this.makeRequest(`/api/capsules/${capsuleId}/mark-viewed`, {
        method: 'POST'
      }, 3, true); // Use authentication

      console.log('✅ Capsule marked as viewed');
      return true;
    } catch (error) {
      console.error('Error marking capsule as viewed:', error);
      return false;
    }
  }

  // Claim pending capsules for the current user (called after login/signup)
  // Optional accessToken parameter to use a specific token instead of getting from session
  static async claimPendingCapsules(accessToken?: string) {
    try {
      console.log('🔍 Checking for pending capsules...');
      
      // If access token is provided, use it directly; otherwise get from session
      if (accessToken) {
        console.log('✅ Using provided access token');
        const response = await this.makeRequest('/api/capsules/claim-pending', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }, 2, false, this.CLAIM_TIMEOUT); // 2 retries, 30s timeout

        if (response.claimed > 0) {
          console.log(`✅ Claimed ${response.claimed} pending capsule(s)`);
        }

        return {
          claimed: response.claimed || 0,
          capsuleIds: response.capsuleIds || []
        };
      } else {
        // Fallback to getting token from session
        const response = await this.makeRequest('/api/capsules/claim-pending', {
          method: 'POST'
        }, 2, true, this.CLAIM_TIMEOUT); // 2 retries, 30s timeout

        if (response.claimed > 0) {
          console.log(`✅ Claimed ${response.claimed} pending capsule(s)`);
        }

        return {
          claimed: response.claimed || 0,
          capsuleIds: response.capsuleIds || []
        };
      }
    } catch (error) {
      console.error('Error claiming pending capsules:', error);
      // Return partial success if available in error response
      if (error.response?.claimed) {
        console.log('⚠️ Partial claim success despite error');
        return {
          claimed: error.response.claimed || 0,
          capsuleIds: error.response.capsuleIds || []
        };
      }
      return { claimed: 0, capsuleIds: [] };
    }
  }

  // Media Files - real implementation with Supabase Storage
  static async uploadMediaFile(file: File, capsuleId: string, userId: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('capsuleId', capsuleId);
    formData.append('userId', userId);

    // Get access token for authenticated request
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      throw new Error('Authentication required for media upload');
    }

    const response = await fetch(`${this.baseUrl}/api/media/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upload failed: ${error}`);
    }

    const result = await response.json();
    return result.mediaFile;
  }

  static async deleteMediaFile(id: string) {
    await this.makeRequest(`/api/media/${id}`, {
      method: 'DELETE'
    });
  }

  static async getMediaFileUrl(mediaId: string) {
    const response = await this.makeRequest(`/api/media/url/${mediaId}`);
    return response.url;
  }

  static async getCapsuleMediaFiles(capsuleId: string) {
    // Check if we already have a pending request for this capsule
    // This prevents duplicate parallel requests during batch loading
    const cacheKey = `media:${capsuleId}`;
    
    if (this.mediaFileCache.has(cacheKey)) {
      console.log(`🔄 Using in-flight request for capsule ${capsuleId}`);
      return this.mediaFileCache.get(cacheKey)!;
    }
    
    // Create the request promise and cache it
    const requestPromise = (async () => {
      try {
        const response = await this.makeRequest(`/api/media/capsule/${capsuleId}`);
        return response.mediaFiles || [];
      } finally {
        // Remove from cache after a short TTL to allow fresh fetches later
        setTimeout(() => {
          this.mediaFileCache.delete(cacheKey);
        }, this.MEDIA_CACHE_TTL);
      }
    })();
    
    this.mediaFileCache.set(cacheKey, requestPromise);
    return requestPromise;
  }

  // Delivery System APIs
  static async processDeliveries() {
    const response = await this.makeRequest('/api/delivery/process', {
      method: 'POST'
    });
    return response;
  }

  static async getDeliveryHealth() {
    // Public health check endpoint
    const response = await this.makeRequest('/api/health/delivery', {}, 3, false);
    return response;
  }

  static async getViewingCapsule(token: string) {
    // Public endpoint - no auth required for viewing capsules via token
    const response = await this.makeRequest(`/api/view/${token}`, {}, 3, false);
    return response;
  }

  // Saved Contacts Management
  static async getSavedContacts(userId: string) {
    try {
      // Use quick timeout for simple key fetch
      const response = await this.makeRequest(
        `/api/kv/get?key=saved_contacts:${userId}`,
        {},
        1, // Only 1 retry
        false,
        this.QUICK_TIMEOUT
      );
      return response?.value || [];
    } catch (error) {
      console.error('Error fetching saved contacts:', error);
      return [];
    }
  }

  static async addSavedContact(userId: string, contact: { type: 'email' | 'phone', value: string, label?: string }) {
    try {
      const savedContacts = await this.getSavedContacts(userId);
      
      // Check if contact already exists
      const exists = savedContacts.find(c => c.type === contact.type && c.value === contact.value);
      if (exists) {
        // Update timestamp to move to top
        exists.lastUsed = new Date().toISOString();
        exists.usageCount = (exists.usageCount || 1) + 1;
      } else {
        // Add new contact
        const newContact = {
          ...contact,
          id: Date.now().toString(),
          lastUsed: new Date().toISOString(),
          usageCount: 1,
          label: contact.label || (contact.type === 'email' ? 'Email' : 'Phone')
        };
        savedContacts.push(newContact);
      }

      // Sort by last used and limit to 20 contacts
      savedContacts.sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime());
      const limitedContacts = savedContacts.slice(0, 20);

      await this.makeRequest('/api/kv/set', {
        method: 'POST',
        body: JSON.stringify({
          key: `saved_contacts:${userId}`,
          value: limitedContacts
        })
      });

      return limitedContacts;
    } catch (error) {
      console.error('Error saving contact:', error);
      throw error;
    }
  }

  static async removeSavedContact(userId: string, contactId: string) {
    try {
      const savedContacts = await this.getSavedContacts(userId);
      const updatedContacts = savedContacts.filter(c => c.id !== contactId);
      
      await this.makeRequest('/api/kv/set', {
        method: 'POST',
        body: JSON.stringify({
          key: `saved_contacts:${userId}`,
          value: updatedContacts
        })
      });

      return updatedContacts;
    } catch (error) {
      console.error('Error removing saved contact:', error);
      throw error;
    }
  }

  // Health and diagnostics
  static async testConnection() {
    try {
      console.log('🔍 Testing backend connection...');
      
      // First test basic server health
      const healthResponse = await this.makeRequest('/health', {}, 1);
      console.log('✅ Server health check passed');
      
      // Then test environment variables
      const envResponse = await this.makeRequest('/env-check', {}, 1);
      console.log('✅ Environment check completed:', envResponse);
      
      // Finally test database connection
      const dbResponse = await this.makeRequest('/test/db', {}, 1);
      console.log('✅ Database test completed:', dbResponse);
      
      return {
        status: 'ok',
        health: healthResponse,
        environment: envResponse,
        database: dbResponse
      };
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      throw error;
    }
  }

  static async checkBackendHealth() {
    try {
      const response = await this.makeRequest('/health', {}, 1);
      return response;
    } catch (error) {
      console.error('❌ Backend health check failed:', error);
      throw new Error(`Backend health check failed: ${error.message}`);
    }
  }

  // Get capsules received by a user (where user is recipient)
  static async getReceivedCapsules(userId: string, userEmail?: string, userPhone?: string) {
    try {
      console.log('📨 Fetching received capsules from server endpoint...');
      
      // CRITICAL FIX: Use the server endpoint which has proper sender name enrichment
      // The server endpoint dynamically fetches sender names from profiles
      const response = await this.makeRequest(
        '/api/capsules/received', 
        {}, 
        2, // Reduced retries
        true,
        this.MEDIUM_TIMEOUT // 40 second timeout
      );
      
      if (!response) {
        console.log('ℹ️ Empty response from server');
        return [];
      }
      
      // Handle error response from backend (e.g., timeout)
      if (response.error) {
        console.warn('⚠️ Backend error fetching received capsules:', response.error);
        
        // Show user-friendly message for timeout
        if (response.error.includes('timeout')) {
          toast.error('Server is slow. Please try again in a moment.', {
            duration: 5000,
          });
        }
        
        // Return empty array to allow graceful degradation
        return [];
      }
      
      const capsules = response.capsules || [];
      console.log(`✅ Fetched ${capsules.length} received capsules with sender names from server`);
      return capsules;
    } catch (error) {
      console.error('⚠️ Error getting received capsules (non-critical, returning empty array):', error);
      
      // GRACEFUL DEGRADATION: Don't show error toasts for received capsules
      // This could be because the user simply has no received capsules
      // or there's a transient network issue. Just log and return empty array.
      console.log('ℹ️ Returning empty capsules array - user may have no received capsules');
      
      return [];
    }
  }
  
  // OLD IMPLEMENTATION - Kept for reference but replaced with server endpoint
  static async _getReceivedCapsulesOld_DEPRECATED(userId: string, userEmail?: string, userPhone?: string) {
    try {
      console.log('📨 [DEPRECATED] Fetching received capsules for user:', userId, userEmail, userPhone || '(no phone)');
      
      // Check if user is authenticated before proceeding
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        console.warn('⚠️ Cannot fetch received capsules: User not authenticated');
        return [];
      }
      
      // OPTIMIZATION: First try to get from user's received list (much faster!)
      // This list is populated by the delivery service when capsules are delivered
      const receivedListKey = `user_received:${userId}`;
      const receivedResponse = await this.makeRequest(`/api/kv/get?key=${receivedListKey}`, {}, 1);
      const receivedIds = receivedResponse?.value || [];
      
      console.log(`📋 User has ${receivedIds.length} capsules in received list:`, receivedIds);
      
      const receivedCapsules = [];
      const validIds = []; // Track valid capsule IDs for cleanup
      const orphanedIds = []; // Track orphaned IDs to remove
      
      // Fetch each received capsule in parallel
      if (receivedIds.length > 0) {
        const capsulePromises = receivedIds.map(async (capsuleId: string) => {
          try {
            console.log(`🔍 Fetching capsule ${capsuleId} from KV store...`);
            const capsuleResponse = await this.makeRequest(`/api/kv/get?key=capsule:${capsuleId}`);
            const capsule = capsuleResponse?.value;
            
            if (!capsule) {
              console.log(`🧹 Cleaning up: ${capsuleId} no longer exists (will be removed from list)`);
              orphanedIds.push(capsuleId);
              return null;
            }
            
            if (!capsule.id) {
              console.log(`🧹 Cleaning up: ${capsuleId} is corrupted (will be removed from list)`);
              orphanedIds.push(capsuleId);
              return null;
            }
            
            if (capsule.status !== 'delivered') {
              console.log(`🧹 Cleaning up: ${capsuleId} is not delivered (status: ${capsule.status}) - will be removed`);
              orphanedIds.push(capsuleId);
              return null;
            }
            
            // Mark as valid
            validIds.push(capsuleId);
            
            // Add sender information if available (with quick fallback)
            let senderName = 'Someone Special';
            try {
              const senderId = capsule.created_by || capsule.user_id;
              if (senderId) {
                // Use Promise.race with a 2-second timeout for faster loading
                const senderProfile = await Promise.race([
                  this.getUserProfile(senderId),
                  new Promise((resolve) => setTimeout(() => resolve(null), 2000))
                ]) as any;
                
                if (senderProfile) {
                  // Try display_name first, then first_name + last_name, then fallback
                  if (senderProfile.display_name) {
                    senderName = senderProfile.display_name.trim();
                  } else {
                    const fullName = `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim();
                    senderName = fullName || 'Someone Special';
                  }
                }
              }
            } catch (error) {
              console.warn('Could not fetch sender profile:', error);
            }
            
            // Get media files for this capsule with timeout
            let mediaFiles = [];
            if (capsule.media_files && Array.isArray(capsule.media_files) && capsule.media_files.length > 0) {
              // Check if these are media IDs (strings) or full media objects
              const firstItem = capsule.media_files[0];
              if (typeof firstItem === 'string') {
                // These are media IDs, need to fetch full objects
                try {
                  mediaFiles = await Promise.race([
                    this.getCapsuleMediaFiles(capsuleId),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Media fetch timeout')), 60000))
                  ]) as any[];
                } catch (error) {
                  console.warn(`⚠️ Could not fetch media files for received capsule ${capsuleId}:`, error?.message || error);
                  mediaFiles = [];
                }
              } else {
                // Already full objects
                mediaFiles = capsule.media_files;
              }
            } else {
              // Otherwise try to fetch from storage with timeout
              try {
                mediaFiles = await Promise.race([
                  this.getCapsuleMediaFiles(capsuleId),
                  new Promise((_, reject) => setTimeout(() => reject(new Error('Media fetch timeout')), 60000))
                ]) as any[];
              } catch (error) {
                console.warn(`⚠️ Could not fetch media files for received capsule ${capsuleId}:`, error?.message || error);
                mediaFiles = [];
              }
            }
            
            return {
              ...capsule,
              sender_name: senderName,
              media_files: mediaFiles
            };
          } catch (error) {
            console.warn(`Failed to load capsule ${capsuleId}:`, error);
            return null;
          }
        });
        
        const results = await Promise.all(capsulePromises);
        receivedCapsules.push(...results.filter(c => c !== null));
      }
      
      // CLEANUP: Remove orphaned/invalid capsule IDs from the received list
      if (orphanedIds.length > 0) {
        console.log(`🧹 CLEANUP: Removing ${orphanedIds.length} orphaned/invalid capsules from received list:`, orphanedIds);
        try {
          await this.makeRequest('/api/kv/set', {
            method: 'POST',
            body: JSON.stringify({
              key: receivedListKey,
              value: validIds
            })
          });
          console.log(`✅ Cleaned up received list: ${receivedIds.length} -> ${validIds.length} capsules`);
        } catch (error) {
          console.error('❌ Failed to cleanup received list:', error);
        }
      }
      
      console.log(`✅ Found ${receivedCapsules.length} valid received capsules from received list`);
      
      // FALLBACK DISABLED: This query tries to fetch ALL capsules and will timeout
      // The received list (user_received:{userId}) should be comprehensive and updated
      // when capsules are delivered via the delivery service
      // If there are edge cases, they should be fixed in the delivery service, not here
      if (false && userEmail) {
        console.log('🔍 Checking for additional delivered capsules where user is recipient...');
        
        try {
          const allCapsulesResponse = await this.makeRequest('/api/kv/prefix?prefix=capsule:', {}, 1);
          const allCapsules = allCapsulesResponse?.values || {};
          
          for (const [key, capsule] of Object.entries(allCapsules)) {
            // Skip if already in received list
            if (receivedIds.includes(capsule.id)) continue;
            
            // Only check delivered capsules
            if (capsule.status !== 'delivered') continue;
            
            // Check if user is a recipient
            let isRecipient = false;
            
            if (capsule.recipient_type === 'self') {
              let selfContact = '';
              if (typeof capsule.self_contact === 'string') {
                selfContact = capsule.self_contact;
              } else if (typeof capsule.self_contact === 'object' && capsule.self_contact !== null) {
                const sc = capsule.self_contact as any;
                selfContact = sc.email || sc.phone || sc.contact || sc.value || sc.address || '';
              }
              
              if (selfContact) {
                if (selfContact.includes('@')) {
                  isRecipient = selfContact.toLowerCase() === userEmail.toLowerCase();
                } else if (userPhone) {
                  isRecipient = selfContact === userPhone;
                }
              }
            } else if (capsule.recipient_type === 'others' && capsule.recipients && Array.isArray(capsule.recipients)) {
              for (const recipient of capsule.recipients) {
                let recipientContact = '';
                if (typeof recipient === 'string') {
                  recipientContact = recipient;
                } else if (typeof recipient === 'object' && recipient !== null) {
                  const r = recipient as any;
                  recipientContact = r.email || r.phone || r.contact || r.value || r.address || '';
                }
                
                if (recipientContact) {
                  if (recipientContact.includes('@') && recipientContact.toLowerCase() === userEmail.toLowerCase()) {
                    isRecipient = true;
                    break;
                  } else if (userPhone && recipientContact === userPhone) {
                    isRecipient = true;
                    break;
                  }
                }
              }
            }
            
            if (isRecipient) {
              console.log(`✅ Found additional received capsule: ${capsule.id}`);
              
              // Add sender info and media
              let senderName = 'Someone Special';
              try {
                const senderId = capsule.created_by || capsule.user_id;
                if (senderId) {
                  const senderProfile = await this.getUserProfile(senderId);
                  if (senderProfile) {
                    // Try display_name first, then first_name + last_name, then fallback
                    if (senderProfile.display_name) {
                      senderName = senderProfile.display_name.trim();
                    } else {
                      const fullName = `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim();
                      senderName = fullName || 'Someone Special';
                    }
                  }
                }
              } catch (error) {
                console.warn('Could not fetch sender profile:', error);
              }
              
              // Get media files for this capsule (same logic as above)
              let mediaFiles = [];
              if (capsule.media_files && Array.isArray(capsule.media_files) && capsule.media_files.length > 0) {
                console.log(`✅ Capsule ${capsule.id} already has media_files array`);
                const firstItem = capsule.media_files[0];
                if (typeof firstItem === 'string') {
                  // These are media IDs, need to fetch full objects
                  try {
                    mediaFiles = await Promise.race([
                      this.getCapsuleMediaFiles(capsule.id),
                      new Promise((_, reject) => setTimeout(() => reject(new Error('Media fetch timeout')), 60000))
                    ]) as any[];
                  } catch (error) {
                    console.warn(`⚠️ Could not fetch media files:`, error?.message || error);
                    mediaFiles = [];
                  }
                } else {
                  mediaFiles = capsule.media_files;
                }
              } else {
                try {
                  console.log(`📡 Fetching media files for received capsule ${capsule.id} (fallback path)...`);
                  mediaFiles = await Promise.race([
                    this.getCapsuleMediaFiles(capsule.id),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Media fetch timeout')), 60000))
                  ]) as any[];
                  console.log(`✅ Fetched ${mediaFiles.length} media files`);
                } catch (error) {
                  console.warn(`⚠️ Could not fetch media files for received capsule ${capsule.id}:`, error?.message || error);
                  mediaFiles = [];
                }
              }
              
              receivedCapsules.push({
                ...capsule,
                sender_name: senderName,
                media_files: mediaFiles
              });
              
              // Add to user's received list for next time
              try {
                validIds.push(capsule.id);
                await this.makeRequest('/api/kv/set', {
                  method: 'POST',
                  body: JSON.stringify({
                    key: receivedListKey,
                    value: validIds
                  })
                });
                console.log(`✅ Added capsule ${capsule.id} to user's received list`);
              } catch (error) {
                console.warn('Failed to add capsule to received list:', error);
              }
            }
          }
        } catch (error) {
          console.warn('Failed to check for additional received capsules:', error);
        }
      }
      
      console.log(`✅ Total received capsules: ${receivedCapsules.length}`);
      
      // Sort by delivery date descending (newest first)
      return receivedCapsules.sort((a, b) => 
        new Date(b.delivery_date || b.delivered_at || 0).getTime() - 
        new Date(a.delivery_date || a.delivered_at || 0).getTime()
      );
    } catch (error) {
      console.error('Error getting received capsules:', error);
      return [];
    }
  }

  // Manually cleanup ghost capsules from user's received list
  static async cleanupReceivedList(userId: string) {
    try {
      console.log('🧹 Starting manual cleanup of received list for user:', userId);
      
      const receivedListKey = `user_received:${userId}`;
      const receivedResponse = await this.makeRequest(`/api/kv/get?key=${receivedListKey}`, {}, 1);
      const receivedIds = receivedResponse?.value || [];
      
      console.log(`📋 Found ${receivedIds.length} capsule IDs in received list`);
      
      if (receivedIds.length === 0) {
        console.log('✅ Received list is empty, nothing to cleanup');
        return { removed: 0, kept: 0 };
      }
      
      const validIds = [];
      const invalidIds = [];
      
      // Check each capsule
      for (const capsuleId of receivedIds) {
        try {
          const capsuleResponse = await this.makeRequest(`/api/kv/get?key=capsule:${capsuleId}`);
          const capsule = capsuleResponse?.value;
          
          if (capsule && capsule.id && capsule.status === 'delivered') {
            validIds.push(capsuleId);
            console.log(`✅ Capsule ${capsuleId} is valid`);
          } else {
            invalidIds.push(capsuleId);
            console.log(`🗑️ Capsule ${capsuleId} is invalid or not found`);
          }
        } catch (error) {
          invalidIds.push(capsuleId);
          console.log(`🗑️ Capsule ${capsuleId} failed to load:`, error);
        }
      }
      
      // Update the list if we found invalid IDs
      if (invalidIds.length > 0) {
        await this.makeRequest('/api/kv/set', {
          method: 'POST',
          body: JSON.stringify({
            key: receivedListKey,
            value: validIds
          })
        });
        
        console.log(`✅ Cleanup complete: Removed ${invalidIds.length} invalid capsules, kept ${validIds.length} valid capsules`);
      } else {
        console.log(`✅ No invalid capsules found, list is clean`);
      }
      
      return { removed: invalidIds.length, kept: validIds.length };
    } catch (error) {
      console.error('❌ Failed to cleanup received list:', error);
      throw error;
    }
  }

  // Archive a received capsule (move to Archived Received list)
  static async archiveReceivedCapsule(capsuleId: string) {
    try {
      console.log(`🗑️ Archiving received capsule ${capsuleId}...`);
      
      return await this.makeRequest('/soft-delete-received', {
        method: 'POST',
        body: JSON.stringify({ capsuleId })
      });
    } catch (error) {
      console.error(`❌ Failed to archive received capsule:`, error);
      throw error;
    }
  }

  // Remove a capsule from user's received list (doesn't delete the capsule itself)
  static async removeFromReceivedList(userId: string, capsuleId: string) {
    try {
      console.log(`🗑️ Removing capsule ${capsuleId} from user ${userId}'s received list...`);
      
      const receivedListKey = `user_received:${userId}`;
      const receivedResponse = await this.makeRequest(`/api/kv/get?key=${receivedListKey}`, {}, 1);
      const receivedIds = receivedResponse?.value || [];
      
      console.log(`📋 Current received list has ${receivedIds.length} capsules`);
      
      if (!receivedIds.includes(capsuleId)) {
        console.log(`ℹ️ Capsule ${capsuleId} not in received list, nothing to remove`);
        return;
      }
      
      const updatedList = receivedIds.filter((id: string) => id !== capsuleId);
      
      await this.makeRequest('/api/kv/set', {
        method: 'POST',
        body: JSON.stringify({
          key: receivedListKey,
          value: updatedList
        })
      });
      
      console.log(`✅ Removed capsule ${capsuleId} from received list: ${receivedIds.length} -> ${updatedList.length}`);
    } catch (error) {
      console.error(`❌ Failed to remove capsule from received list:`, error);
      throw error;
    }
  }

  // Generic API call method for custom endpoints
  static async callFunction(endpoint: string, method: string = 'GET', data?: any) {
    const options: RequestInit = {
      method,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    return this.makeRequest(endpoint, options);
  }
}