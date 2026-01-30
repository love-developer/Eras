import { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { 
  getOfflineQueue, 
  removeOfflineAction, 
  OfflineAction, 
  cacheCapsules, 
  getCachedCapsules
} from '../utils/offline-storage';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner';
import { projectId } from '../utils/supabase/info';

export function useOfflineSync() {
  const { isOnline } = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Check queue status
  const checkQueue = useCallback(async () => {
    try {
      const queue = await getOfflineQueue();
      setPendingCount(queue.length);
      return queue;
    } catch (error) {
      console.error('Failed to check offline queue:', error);
      return [];
    }
  }, []);

  // Process a single action
  const processAction = async (action: OfflineAction) => {
    console.log(`🔄 Processing offline action: ${action.type}`, action.id);
    
    try {
      const { session } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('No auth session');

      if (action.type === 'CREATE_CAPSULE') {
        const capsuleData = action.payload;
        
        // Handle media uploads if they are stored as Blobs/Files in the payload
        // Note: IndexedDB stores Files/Blobs correctly
        
        // We assume payload has mediaFiles array with actual File/Blob objects if they were pending
        // Or updated logic in CreateCapsule to store them that way
        
        let mediaUrls = capsuleData.media_urls || [];
        
        // If we have pending media files to upload
        if (capsuleData.pendingMedia && capsuleData.pendingMedia.length > 0) {
          mediaUrls = await uploadPendingMedia(capsuleData.pendingMedia, session.user.id);
        }

        // Prepare final payload
        const finalPayload = {
          ...capsuleData,
          media_urls: mediaUrls,
          // Remove client-side only properties
          pendingMedia: undefined
        };

        // Call API
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/capsules`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(finalPayload)
          }
        );

        if (!response.ok) {
          throw new Error('Failed to create capsule on server');
        }
      } 
      else if (action.type === 'EDIT_CAPSULE') {
        const { id, last_known_updated_at, ...updateData } = action.payload;
        
        if (!id) throw new Error('No capsule ID for edit action');
        
        // Conflict Resolution Strategy:
        // 1. Fetch current server version
        // 2. Compare updated_at timestamps
        // 3. If server is newer, save as COPY instead of overwriting
        
        let isConflict = false;
        
        if (last_known_updated_at) {
          try {
            const checkRes = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/capsules/${id}`,
              {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
              }
            );
            
            if (checkRes.ok) {
              const { capsule: serverCapsule } = await checkRes.json();
              const serverTime = new Date(serverCapsule.updated_at).getTime();
              const localTime = new Date(last_known_updated_at).getTime();
              
              // If server is newer by more than 2 seconds (allow small drift)
              if (serverTime > localTime + 2000) {
                console.warn('⚠️ Conflict detected for capsule update:', id);
                isConflict = true;
              }
            }
          } catch (err) {
            console.warn('Failed to check for conflicts, proceeding with update:', err);
          }
        }
        
        if (isConflict) {
          // CONFLICT DETECTED: Save as new draft copy
          toast.warning('Conflict detected! Saving your offline changes as a copy to prevent data loss.');
          
          const copyPayload = {
            ...updateData,
            title: `${updateData.title || 'Untitled'} (Offline Copy)`,
            status: 'draft',
            media_urls: updateData.media_urls || []
          };
          
          // Upload any pending media for this copy
          if (updateData.pendingMedia && updateData.pendingMedia.length > 0) {
             const uploadedUrls = await uploadPendingMedia(updateData.pendingMedia, session.user.id);
             copyPayload.media_urls = [...copyPayload.media_urls, ...uploadedUrls];
             delete copyPayload.pendingMedia;
          }
          
          // Create as new capsule
          const createRes = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/capsules`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(copyPayload)
            }
          );
          
          if (!createRes.ok) throw new Error('Failed to save conflict copy');
          
        } else {
          // NO CONFLICT: Proceed with update
          
          // Handle media uploads first
          let mediaUrls = updateData.media_urls || [];
          if (updateData.pendingMedia && updateData.pendingMedia.length > 0) {
            const uploadedUrls = await uploadPendingMedia(updateData.pendingMedia, session.user.id);
            mediaUrls = [...mediaUrls, ...uploadedUrls];
          }
          
          const finalPayload = {
            ...updateData,
            media_urls: mediaUrls,
            pendingMedia: undefined
          };
          
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/capsules/${id}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(finalPayload)
            }
          );
          
          if (!response.ok) throw new Error('Failed to update capsule on server');
        }
      }
      else if (action.type === 'DELETE_CAPSULE') {
        const { id } = action.payload;
        if (!id) throw new Error('No capsule ID for delete action');
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/capsules/${id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          }
        );
        
        // If 404, it's already deleted, so we consider it success
        if (!response.ok && response.status !== 404) {
          throw new Error('Failed to delete capsule on server');
        }
      }
      
      // Remove from queue on success
      if (action.id) {
        await removeOfflineAction(action.id);
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to process action ${action.id}:`, error);
      // Keep in queue, maybe increment retry count?
      return false;
    }
  };

  // Helper for media upload
  const uploadPendingMedia = async (pendingMedia: any[], userId: string) => {
    const STORAGE_BUCKET = 'make-f9be53a7-media';
    
    return Promise.all(
      pendingMedia.map(async (media: any) => {
        // If it's already a URL, skip
        if (typeof media === 'string') return media;
        
        // It's a file object (restored from IndexedDB)
        const file = media.file || media;
        const fileName = `${userId}/${Date.now()}-${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(fileName);
          
        return urlData.publicUrl;
      })
    );
  };

  // Sync all pending actions
  const sync = useCallback(async () => {
    if (!isOnline || isSyncing) return;
    
    const queue = await checkQueue();
    if (queue.length === 0) return;

    setIsSyncing(true);
    toast.info(`Syncing ${queue.length} offline actions...`);

    let successCount = 0;
    
    for (const action of queue) {
      const success = await processAction(action);
      if (success) successCount++;
    }

    setIsSyncing(false);
    checkQueue(); // Update count

    if (successCount > 0) {
      toast.success(`Synced ${successCount} items successfully!`);
    }
    
    if (successCount < queue.length) {
      toast.error(`Failed to sync ${queue.length - successCount} items. Will retry later.`);
    }
  }, [isOnline, isSyncing, checkQueue]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline) {
      sync();
    }
  }, [isOnline, sync]);

  // Initial check
  useEffect(() => {
    checkQueue();
  }, [checkQueue]);

  return {
    isSyncing,
    pendingCount,
    sync,
    refreshQueue: checkQueue
  };
}
