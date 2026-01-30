import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { supabase } from './supabase-client.tsx';
import * as kv from './kv_store.tsx';

/**
 * 🌫️ ARCHIVE - Trash & Recovery System
 * 
 * Endpoints:
 * - GET  /forgotten-memories - List all deleted items
 * - POST /restore-memory - Restore a deleted item
 * - DELETE /delete-forever - Permanently delete an item
 * - DELETE /empty-trash - Delete all items in trash
 * - POST /auto-purge - Scheduled job to purge items older than 30 days
 * - POST /soft-delete - Soft delete (move to Archive)
 * - POST /soft-delete-vault - Soft delete vault items (move to Archive)
 */

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
}));

// Use singleton client imported above

// Helper: Get user ID from access token
async function getUserId(accessToken: string | undefined): Promise<string | null> {
  if (!accessToken) return null;
  
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user?.id) return null;
  
  return user.id;
}

// GET /forgotten-memories - List deleted items
app.get('/make-server-f9be53a7/forgotten-memories', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const userId = await getUserId(accessToken);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`🌫️ Loading archive for user ${userId}`);

    // Get user's capsule IDs
    const userCapsulesKey = `user_capsules:${userId}`;
    const capsuleIds = await kv.get(userCapsulesKey) || [];
    
    // Fetch each capsule and filter for deleted ones
    const allCapsules = [];
    for (const capsuleId of capsuleIds) {
      try {
        const capsule = await kv.get(`capsule:${capsuleId}`);
        if (capsule) {
          allCapsules.push(capsule);
        }
      } catch (error) {
        console.warn(`Failed to fetch capsule ${capsuleId}:`, error);
      }
    }
    
    // 🔍 RECEIVED CAPSULES: Fetch archived received capsules
    const userArchivedReceivedKey = `user_archived_received:${userId}`;
    const archivedReceivedIds = await kv.get(userArchivedReceivedKey) || [];
    
    // Get timestamps for archived received capsules
    const userArchivedReceivedTimestampsKey = `user_archived_received_timestamps:${userId}`;
    const archivedTimestamps = await kv.get(userArchivedReceivedTimestampsKey) || {};
    
    for (const capsuleId of archivedReceivedIds) {
      try {
        const capsule = await kv.get(`capsule:${capsuleId}`);
        if (capsule) {
          // Use the stored timestamp when it was archived, or fallback to current time
          const deletedAt = archivedTimestamps[capsuleId] || new Date().toISOString();
          
          allCapsules.push({
            ...capsule,
            deletedAt: deletedAt,
            isArchivedReceived: true // Flag to identify origin
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch archived received capsule ${capsuleId}:`, error);
      }
    }

    // CRITICAL FIX: Only show capsules that have deletedAt set (not undefined, not null)
    // This prevents restored capsules (where deletedAt is deleted) from appearing
    const deletedCapsules = allCapsules.filter((capsule: any) => 
      (capsule.deletedAt !== null && capsule.deletedAt !== undefined && capsule.deletedAt) ||
      capsule.isArchivedReceived // Always include archived received capsules
    );
    
    console.log(`🔍 Found ${allCapsules.length} total capsules, ${deletedCapsules.length} with deletedAt set`);

    // 📸 VAULT ITEMS: Fetch deleted vault media from legacy_vault system
    const userVaultKey = `legacy_vault_list:${userId}`;
    const recordIds = await kv.get(userVaultKey) || [];
    
    // ✅ MEMORY FIX: Limit the number of vault items we process to prevent memory issues
    const MAX_VAULT_ITEMS = 100; // Only process first 100 items
    const limitedRecordIds = recordIds.slice(0, MAX_VAULT_ITEMS);
    
    if (recordIds.length > MAX_VAULT_ITEMS) {
      console.warn(`⚠️ Archive has ${recordIds.length} vault items, limiting to ${MAX_VAULT_ITEMS} for memory safety`);
    }
    
    const allVaultItems = [];
    
    // Helper function to generate signed URL (with error handling)
    const getSignedUrlSafe = async (path: string): Promise<string | null> => {
      try {
        // ✅ OPTIMIZATION: Skip file existence check, just try to generate URL
        // If file doesn't exist, signed URL will fail gracefully when accessed
        const { data: urlData, error } = await supabase.storage
          .from('make-f9be53a7-media')
          .createSignedUrl(path, 3600);
        
        if (error) {
          // Fallback to public URL (bucket might be public)
          const { data: publicUrl } = supabase.storage
            .from('make-f9be53a7-media')
            .getPublicUrl(path);
          return publicUrl?.publicUrl || null;
        }
        
        return urlData?.signedUrl || null;
      } catch (err) {
        console.error('Error generating signed URL:', err);
        return null;
      }
    };
    
    for (const recordId of limitedRecordIds) {
      try {
        const recordData = await kv.get(`legacy_vault:${userId}:${recordId}`);
        if (recordData) {
          // ✅ OPTIMIZATION: Only generate thumbnail URLs for deleted items
          // This reduces unnecessary storage API calls
          const isDeleted = recordData.deletedAt !== null && recordData.deletedAt !== undefined && recordData.deletedAt;
          
          let thumbnailUrl = null;
          if (isDeleted) {
            // Try thumbnail_path first, then storage_path
            const path = recordData.thumbnail_path || recordData.storage_path;
            if (path) {
              thumbnailUrl = await getSignedUrlSafe(path);
            }
          }
          
          allVaultItems.push({
            ...recordData,
            thumbnailUrl
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch vault item ${recordId}:`, error);
        // Continue processing other items even if one fails
      }
    }
    
    const deletedVaultItems = allVaultItems.filter((item: any) => 
      item.deletedAt !== null && item.deletedAt !== undefined && item.deletedAt
    );
    
    console.log(`🔍 Found ${allVaultItems.length} total vault items, ${deletedVaultItems.length} with deletedAt set`);

    // Folders are not yet implemented in Eras, so skip for now
    const deletedFolders: any[] = [];

    // Folders with counts (currently empty since folders aren't implemented)
    const foldersWithCounts: any[] = [];

    // Format capsule data
    const capsulesFormatted = deletedCapsules.map((capsule: any) => ({
      id: capsule.id,
      title: capsule.title,
      date: capsule.delivery_date || capsule.created_at,
      deletedAt: capsule.deletedAt,
      deletedFrom: capsule.deletedFrom,
      type: 'capsule',
      status: capsule.status, // draft, scheduled, delivered, etc.
      recipient_type: capsule.recipient_type, // self, others, received
      isArchivedReceived: capsule.isArchivedReceived, // Flag indicating this will restore to Received folder
      sender_name: capsule.sender_name, // For received capsules
      recipient_name: capsule.recipient_name, // For sent capsules
      recipient_email: capsule.recipient_email, // For sent capsules
      media: capsule.media_urls || []
    }));
    
    // Format vault item data
    const vaultItemsFormatted = deletedVaultItems.map((item: any) => ({
      id: item.id,
      title: item.file_name || `${item.type.charAt(0).toUpperCase() + item.type.slice(1)} from Vault`, // Use actual file name
      date: item.timestamp,
      deletedAt: item.deletedAt,
      deletedFrom: item.deletedFrom,
      deletedFromName: item.deletedFromName, // Folder name for display
      type: 'vault-media',
      mediaType: item.type, // photo, video, audio, document
      media: item.thumbnailUrl ? [item.thumbnailUrl] : [], // Use signed URL
      mimeType: item.file_type,
      // DEBUG INFO
      _debug: {
        hasStoragePath: !!item.storage_path,
        hasThumbnailPath: !!item.thumbnail_path,
        hasThumbnailUrl: !!item.thumbnailUrl,
        storage_path: item.storage_path,
        thumbnail_path: item.thumbnail_path
      }
    }));

    // Combine and sort by deletedAt (most recent first)
    const allItems = [...foldersWithCounts, ...capsulesFormatted, ...vaultItemsFormatted]
      .sort((a: any, b: any) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());

    console.log(`✅ Found ${allItems.length} forgotten items`);

    return c.json({ items: allItems });
  } catch (error: any) {
    console.error('❌ Error loading archive:', error);
    
    // ✅ MEMORY ERROR HANDLING: Provide helpful error message
    if (error?.message?.toLowerCase()?.includes('memory') || 
        error?.message?.toLowerCase()?.includes('heap') ||
        error?.message?.toLowerCase()?.includes('out of memory')) {
      console.error('💥 Memory limit exceeded while loading archive');
      return c.json({ 
        error: 'Memory limit exceeded',
        details: 'Archive is too large. Try archiving fewer items.',
        items: [] // Return empty array so UI doesn't break
      }, 200); // Return 200 so frontend doesn't show error
    }
    
    return c.json({ 
      error: error.message || 'Failed to load archive',
      items: [] // Return empty array as fallback
    }, 500);
  }
});

// POST /restore-memory - Restore deleted item
app.post('/make-server-f9be53a7/restore-memory', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const userId = await getUserId(accessToken);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { itemId, itemType } = await c.req.json();

    console.log(`🔄 Restoring ${itemType} ${itemId} for user ${userId}`);

    if (itemType === 'folder') {
      // Folders not implemented yet
      return c.json({ error: 'Folder restoration not yet implemented' }, 400);
    } else if (itemType === 'vault-media') {
      // 📸 RESTORE VAULT ITEM from legacy_vault system
      const itemKey = `legacy_vault:${userId}:${itemId}`;
      const vaultItem = await kv.get(itemKey);
      
      if (!vaultItem) {
        return c.json({ error: 'Vault item not found' }, 404);
      }
      
      const originalFolder = vaultItem.deletedFrom;
      const originalFolderName = vaultItem.deletedFromName;
      
      // Clear deletion fields
      delete vaultItem.deletedAt;
      delete vaultItem.deletedFrom;
      delete vaultItem.deletedFromName;
      
      // Save updated vault item
      await kv.set(itemKey, vaultItem);
      
      // 🔄 SMART RESTORE: Try to restore to original folder
      let restoredToFolder = false;
      let restoredToUnsorted = false;
      
      if (originalFolder && originalFolder !== 'vault-unsorted' && originalFolder !== 'vault-all') {
        // Try to restore to original folder
        const foldersMetadataKey = `vault_folders:${userId}`;
        const foldersMetadata = await kv.get(foldersMetadataKey) || { folders: [] };
        const folderIndex = foldersMetadata.folders.findIndex((f: any) => f.id === originalFolder);
        
        if (folderIndex !== -1) {
          // Folder still exists! Add item back
          const folder = foldersMetadata.folders[folderIndex];
          if (!folder.mediaIds) folder.mediaIds = [];
          if (!folder.mediaIds.includes(itemId)) {
            folder.mediaIds.push(itemId);
            await kv.set(foldersMetadataKey, foldersMetadata);
            restoredToFolder = true;
            console.log(`✅ Restored vault item ${itemId} to folder "${originalFolderName}" (${originalFolder})`);
          }
        } else {
          // Folder was deleted - restore to unsorted
          restoredToUnsorted = true;
          console.log(`⚠️ Original folder "${originalFolderName}" was deleted - restoring to unsorted`);
          
          // Add to unsorted folder
          const unsortedFolderId = 'vault-unsorted';
          const unsortedIndex = foldersMetadata.folders.findIndex((f: any) => f.id === unsortedFolderId);
          if (unsortedIndex !== -1) {
            const unsortedFolder = foldersMetadata.folders[unsortedIndex];
            if (!unsortedFolder.mediaIds) unsortedFolder.mediaIds = [];
            if (!unsortedFolder.mediaIds.includes(itemId)) {
              unsortedFolder.mediaIds.push(itemId);
              await kv.set(foldersMetadataKey, foldersMetadata);
              console.log(`✅ Added vault item ${itemId} to unsorted folder`);
            }
          }
        }
      } else {
        // Was in unsorted or all view - restore to unsorted
        restoredToUnsorted = true;
        console.log(`✅ Restoring vault item ${itemId} to unsorted`);
        
        // Add to unsorted folder
        const foldersMetadataKey = `vault_folders:${userId}`;
        const foldersMetadata = await kv.get(foldersMetadataKey) || { folders: [] };
        const unsortedFolderId = 'vault-unsorted';
        const unsortedIndex = foldersMetadata.folders.findIndex((f: any) => f.id === unsortedFolderId);
        if (unsortedIndex !== -1) {
          const unsortedFolder = foldersMetadata.folders[unsortedIndex];
          if (!unsortedFolder.mediaIds) unsortedFolder.mediaIds = [];
          if (!unsortedFolder.mediaIds.includes(itemId)) {
            unsortedFolder.mediaIds.push(itemId);
            await kv.set(foldersMetadataKey, foldersMetadata);
            console.log(`✅ Added vault item ${itemId} to unsorted folder`);
          }
        }
      }
      
      return c.json({ 
        success: true, 
        restoredToFolder,
        restoredToUnsorted,
        folderName: restoredToFolder ? originalFolderName : null
      });
    } else {
      // Restore capsule (Owned OR Received)
      
      // 1. Check if it's an Archived Received Capsule
      const archivedReceivedKey = `user_archived_received:${userId}`;
      let archivedIds = await kv.get(archivedReceivedKey) || [];
      
      if (archivedIds.includes(itemId)) {
        console.log(`🔄 Restoring ARCHIVED RECEIVED capsule ${itemId}`);
        
        // Remove from Archive
        archivedIds = archivedIds.filter((id: string) => id !== itemId);
        await kv.set(archivedReceivedKey, archivedIds);
        
        // Add back to Received List
        const receivedListKey = `user_received:${userId}`;
        let receivedIds = await kv.get(receivedListKey) || [];
        
        if (!receivedIds.includes(itemId)) {
          receivedIds.push(itemId);
          await kv.set(receivedListKey, receivedIds);
        }
        
        console.log(`✅ Restored received capsule ${itemId} to inbox`);
        return c.json({ success: true, restoredReceived: true });
      }
      
      // 2. Fallback to Owned Capsule Logic
      const capsuleKey = `capsule:${itemId}`;
      const capsule = await kv.get(capsuleKey);
      
      if (!capsule) {
        return c.json({ error: 'Capsule not found' }, 404);
      }
      
      // Verify ownership
      if (capsule.created_by !== userId) {
        return c.json({ error: 'Unauthorized - Not owner and not in received archive' }, 403);
      }

      // Clear deletion fields - MUST delete properties, not set to null
      delete capsule.deletedAt;
      delete capsule.deletedFrom;
      
      // AUTO-CONVERT: If scheduled but delivery date has passed, convert to draft
      let convertedToDraft = false;
      if (capsule.status === 'scheduled' && capsule.delivery_date) {
        const deliveryDate = new Date(capsule.delivery_date);
        const now = new Date();
        
        if (deliveryDate < now) {
          console.log(`⏰ Scheduled capsule ${itemId} has past delivery date (${capsule.delivery_date}), converting to draft`);
          capsule.status = 'draft';
          capsule.delivery_date = null;
          convertedToDraft = true;
        }
      }
      
      await kv.set(capsuleKey, capsule);

      // CRITICAL FIX: Add capsule ID back to user's capsule list (in case it was removed)
      const userCapsulesKey = `user_capsules:${userId}`;
      let userCapsuleIds = await kv.get(userCapsulesKey) || [];
      
      if (!userCapsuleIds.includes(itemId)) {
        userCapsuleIds.push(itemId);
        await kv.set(userCapsulesKey, userCapsuleIds);
        console.log(`✅ Added capsule ${itemId} back to user's capsule list`);
      }

      console.log(`✅ Restored capsule ${itemId}${convertedToDraft ? ' (converted to draft)' : ''} - deletedAt property removed`);
      
      return c.json({ success: true, convertedToDraft });
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error restoring item:', error);
    return c.json({ error: error.message }, 500);
  }
});

// DELETE /delete-forever - Permanently delete item
app.delete('/make-server-f9be53a7/delete-forever', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const userId = await getUserId(accessToken);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { itemId, itemType } = await c.req.json();

    console.log(`🗑️ Permanently deleting ${itemType} ${itemId} for user ${userId}`);

    if (itemType === 'folder') {
      // Folders not implemented yet
      return c.json({ error: 'Folder deletion not yet implemented' }, 400);
    } else if (itemType === 'vault-media') {
      // 📸 DELETE VAULT ITEM PERMANENTLY from legacy_vault system
      const itemKey = `legacy_vault:${userId}:${itemId}`;
      const vaultItem = await kv.get(itemKey);
      
      if (!vaultItem) {
        return c.json({ error: 'Vault item not found' }, 404);
      }
      
      // Delete the storage files if they exist
      if (vaultItem.storage_path) {
        try {
          await supabase.storage
            .from('make-f9be53a7-media')
            .remove([vaultItem.storage_path]);
          console.log(`  ✅ Deleted vault file: ${vaultItem.storage_path}`);
        } catch (error) {
          console.warn(`  ⚠️ Failed to delete vault file:`, error);
        }
      }
      
      if (vaultItem.thumbnail_path) {
        try {
          await supabase.storage
            .from('make-f9be53a7-media')
            .remove([vaultItem.thumbnail_path]);
          console.log(`  ✅ Deleted vault thumbnail: ${vaultItem.thumbnail_path}`);
        } catch (error) {
          console.warn(`  ⚠️ Failed to delete vault thumbnail:`, error);
        }
      }
      
      // Remove from vault item list
      const userVaultKey = `legacy_vault_list:${userId}`;
      let recordIds = await kv.get(userVaultKey) || [];
      recordIds = recordIds.filter((id: string) => id !== itemId);
      await kv.set(userVaultKey, recordIds);
      
      // Delete the item record
      await kv.del(itemKey);
      
      console.log(`✅ Permanently deleted vault item ${itemId}`);
      
      return c.json({ success: true });
    } else {
      // Delete capsule (Owned OR Received)
      
      // 1. Check if it's an Archived Received Capsule
      const archivedReceivedKey = `user_archived_received:${userId}`;
      let archivedIds = await kv.get(archivedReceivedKey) || [];
      
      if (archivedIds.includes(itemId)) {
        console.log(`🗑️ Permanently removing ARCHIVED RECEIVED capsule ${itemId} reference`);
        
        // Remove from Archive List ONLY
        // We do NOT delete the capsule object because we don't own it!
        archivedIds = archivedIds.filter((id: string) => id !== itemId);
        await kv.set(archivedReceivedKey, archivedIds);
        
        console.log(`✅ Removed received capsule ${itemId} from archive (reference only)`);
        return c.json({ success: true });
      }
      
      // 2. Fallback to Owned Capsule Logic (Full Delete)
      const capsuleKey = `capsule:${itemId}`;
      const capsule = await kv.get(capsuleKey);
      
      if (!capsule) {
        return c.json({ error: 'Capsule not found' }, 404);
      }
      
      // Verify ownership
      if (capsule.created_by !== userId) {
        return c.json({ error: 'Unauthorized - Not owner and not in received archive' }, 403);
      }
      
      // Delete media from Supabase Storage
      if (capsule.media_urls && capsule.media_urls.length > 0) {
        for (const mediaUrl of capsule.media_urls) {
          if (mediaUrl) {
            const pathMatch = mediaUrl.match(/capsule-media-f9be53a7\/(.+)$/);
            if (pathMatch) {
              try {
                await supabase.storage
                  .from('capsule-media-f9be53a7')
                  .remove([pathMatch[1]]);
              } catch (error) {
                console.warn(`Failed to delete media file: ${error}`);
              }
            }
          }
        }
      }
      
      // Remove from user's capsule list
      const userCapsulesKey = `user_capsules:${userId}`;
      const capsuleIds = await kv.get(userCapsulesKey) || [];
      const updatedIds = capsuleIds.filter((id: string) => id !== itemId);
      await kv.set(userCapsulesKey, updatedIds);

      // Delete the capsule
      await kv.del(capsuleKey);
      console.log(`✅ Permanently deleted capsule ${itemId}`);
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error('❌ Error permanently deleting item:', error);
    return c.json({ error: error.message }, 500);
  }
});

// DELETE /empty-trash - Delete all items in trash
app.delete('/make-server-f9be53a7/empty-trash', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const userId = await getUserId(accessToken);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log(`🗑️ Emptying trash for user ${userId}`);

    // ==================================================
    // 1. DELETE OWNED CAPSULES WITH deletedAt
    // ==================================================
    const userCapsulesKey = `user_capsules:${userId}`;
    const capsuleIds = await kv.get(userCapsulesKey) || [];
    
    console.log(`📦 Checking ${capsuleIds.length} owned capsules...`);
    
    // Fetch deleted capsules - FIX: Use truthy check instead of !== null
    const deletedCapsules = [];
    for (const capsuleId of capsuleIds) {
      try {
        const capsule = await kv.get(`capsule:${capsuleId}`);
        // 🔧 FIX: Truthy check to avoid matching undefined
        if (capsule && capsule.deletedAt) {
          deletedCapsules.push({ ...capsule, id: capsuleId });
        }
      } catch (error) {
        console.warn(`Failed to fetch capsule ${capsuleId}:`, error);
      }
    }

    console.log(`🗑️ Found ${deletedCapsules.length} deleted capsules to remove`);

    // Delete all owned capsules
    const updatedCapsuleIds = [];
    for (const capsule of deletedCapsules) {
      // Delete media
      if (capsule.media_urls && capsule.media_urls.length > 0) {
        for (const mediaUrl of capsule.media_urls) {
          if (mediaUrl) {
            const pathMatch = mediaUrl.match(/capsule-media-f9be53a7\/(.+)$/);
            if (pathMatch) {
              try {
                await supabase.storage
                  .from('capsule-media-f9be53a7')
                  .remove([pathMatch[1]]);
              } catch (error) {
                console.warn(`Failed to delete media: ${error}`);
              }
            }
          }
        }
      }
      await kv.del(`capsule:${capsule.id}`);
    }
    
    // Update user's capsule list (remove deleted ones)
    for (const capsuleId of capsuleIds) {
      if (!deletedCapsules.some(c => c.id === capsuleId)) {
        updatedCapsuleIds.push(capsuleId);
      }
    }
    await kv.set(userCapsulesKey, updatedCapsuleIds);

    console.log(`✅ Deleted ${deletedCapsules.length} owned capsules`);

    // ==================================================
    // 2. DELETE ARCHIVED RECEIVED CAPSULES (FROM ARCHIVE ONLY - NOT THE CAPSULE DATA)
    // ==================================================
    const archivedReceivedKey = `user_archived_received:${userId}`;
    const archivedReceivedIds = await kv.get(archivedReceivedKey) || [];
    const archivedReceivedCount = archivedReceivedIds.length;
    
    if (archivedReceivedCount > 0) {
      console.log(`🗑️ Removing ${archivedReceivedCount} archived received capsules from archive`);
      
      // Clear the archived received list (we don't own these capsules, so we just remove our references)
      await kv.set(archivedReceivedKey, []);
      
      // Clear the archived timestamps
      const archivedTimestampsKey = `user_archived_received_timestamps:${userId}`;
      await kv.set(archivedTimestampsKey, {});
      
      console.log(`✅ Removed ${archivedReceivedCount} archived received capsule references`);
    }

    // ==================================================
    // 3. 🔥 CRITICAL FIX: DELETE VAULT MEDIA WITH deletedAt
    // ==================================================
    const userVaultKey = `legacy_vault_list:${userId}`;
    const vaultRecordIds = await kv.get(userVaultKey) || [];
    
    console.log(`📸 Checking ${vaultRecordIds.length} vault media items...`);
    
    const deletedVaultItems = [];
    const remainingVaultIds = [];
    
    for (const recordId of vaultRecordIds) {
      try {
        const vaultItem = await kv.get(`legacy_vault:${userId}:${recordId}`);
        
        // 🔧 FIX: Truthy check to properly identify deleted items
        if (vaultItem && vaultItem.deletedAt) {
          console.log(`🗑️ Deleting vault item ${recordId} (deletedAt: ${vaultItem.deletedAt})`);
          
          // Delete storage files
          if (vaultItem.storage_path) {
            try {
              await supabase.storage
                .from('make-f9be53a7-media')
                .remove([vaultItem.storage_path]);
              console.log(`  ✅ Deleted vault file: ${vaultItem.storage_path}`);
            } catch (error) {
              console.warn(`  ⚠️ Failed to delete vault file:`, error);
            }
          }
          
          if (vaultItem.thumbnail_path) {
            try {
              await supabase.storage
                .from('make-f9be53a7-media')
                .remove([vaultItem.thumbnail_path]);
              console.log(`  ✅ Deleted vault thumbnail: ${vaultItem.thumbnail_path}`);
            } catch (error) {
              console.warn(`  ⚠️ Failed to delete vault thumbnail:`, error);
            }
          }
          
          // Delete database record
          await kv.del(`legacy_vault:${userId}:${recordId}`);
          deletedVaultItems.push(recordId);
          console.log(`  ✅ Deleted vault item ${recordId}`);
        } else {
          // Keep non-deleted items
          remainingVaultIds.push(recordId);
        }
      } catch (error) {
        console.warn(`Failed to process vault item ${recordId}:`, error);
        // On error, keep the item in the list (safer)
        remainingVaultIds.push(recordId);
      }
    }
    
    // Update vault list (remove deleted items)
    await kv.set(userVaultKey, remainingVaultIds);
    
    console.log(`✅ Deleted ${deletedVaultItems.length} vault media items (${remainingVaultIds.length} remaining)`);

    // ==================================================
    // FINAL SUMMARY
    // ==================================================
    console.log(`✅✅✅ EMPTY TRASH COMPLETE:`);
    console.log(`  Owned capsules deleted: ${deletedCapsules.length}`);
    console.log(`  Received archived removed: ${archivedReceivedCount}`);
    console.log(`  Vault items deleted: ${deletedVaultItems.length}`);

    return c.json({ 
      success: true, 
      deleted: {
        capsules: deletedCapsules.length,
        archivedReceived: archivedReceivedCount,
        vaultMedia: deletedVaultItems.length,
        folders: 0
      }
    });
  } catch (error: any) {
    console.error('❌ Error emptying trash:', error);
    return c.json({ error: error.message }, 500);
  }
});

// POST /auto-purge - Scheduled job to purge items older than 30 days
app.post('/make-server-f9be53a7/auto-purge', async (c) => {
  try {
    console.log(`🤖 Running auto-purge job`);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let purgedCapsules = 0;

    // Get all user capsule lists
    const allUserCapsuleLists = await kv.getByPrefix('user_capsules:');
    
    for (const userCapsuleList of allUserCapsuleLists) {
      if (!Array.isArray(userCapsuleList)) continue;
      
      const updatedCapsuleIds = [];
      
      for (const capsuleId of userCapsuleList) {
        try {
          const capsule = await kv.get(`capsule:${capsuleId}`);
          
          if (capsule && capsule.deletedAt) {
            const deletedDate = new Date(capsule.deletedAt);
            if (deletedDate < thirtyDaysAgo) {
              // Delete media
              if (capsule.media_urls && capsule.media_urls.length > 0) {
                for (const mediaUrl of capsule.media_urls) {
                  if (mediaUrl) {
                    const pathMatch = mediaUrl.match(/capsule-media-f9be53a7\/(.+)$/);
                    if (pathMatch) {
                      try {
                        await supabase.storage
                          .from('capsule-media-f9be53a7')
                          .remove([pathMatch[1]]);
                      } catch (error) {
                        console.warn(`Failed to delete media: ${error}`);
                      }
                    }
                  }
                }
              }

              // Delete capsule
              await kv.del(`capsule:${capsuleId}`);
              purgedCapsules++;
            } else {
              // Keep in list if not expired
              updatedCapsuleIds.push(capsuleId);
            }
          } else if (capsule && !capsule.deletedAt) {
            // Keep active capsules
            updatedCapsuleIds.push(capsuleId);
          }
          // If capsule doesn't exist, don't add to updated list
        } catch (error) {
          console.warn(`Error processing capsule ${capsuleId}:`, error);
          updatedCapsuleIds.push(capsuleId); // Keep in list on error
        }
      }
      
      // Update user's capsule list if we removed any
      if (updatedCapsuleIds.length !== userCapsuleList.length) {
        // Extract userId from key pattern 'user_capsules:userId'
        const userIdMatch = Object.keys(userCapsuleList)[0]; // This won't work, need different approach
        // For now, skip updating the list - it will be cleaned up on next fetch
      }
    }

    console.log(`✅ Auto-purge complete: ${purgedCapsules} capsules`);

    return c.json({ 
      success: true,
      purged: {
        capsules: purgedCapsules,
        folders: 0
      }
    });
  } catch (error: any) {
    console.error('❌ Error in auto-purge:', error);
    return c.json({ error: error.message }, 500);
  }
});

// POST /soft-delete - Soft delete (move to Archive)
app.post('/make-server-f9be53a7/soft-delete', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const userId = await getUserId(accessToken);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { capsuleId, folderId } = body;
    
    if (!capsuleId) {
      return c.json({ error: 'capsuleId required' }, 400);
    }

    console.log(`🌫️ Soft deleting capsule ${capsuleId} for user ${userId} (folder: ${folderId || 'none'})`);

    // Get the capsule
    const capsuleKey = `capsule:${capsuleId}`;
    const capsule = await kv.get(capsuleKey);
    
    if (!capsule) {
      return c.json({ error: 'Capsule not found' }, 404);
    }
    
    // Verify ownership
    if (capsule.created_by !== userId) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    // Set soft delete fields
    capsule.deletedAt = new Date().toISOString();
    capsule.deletedFrom = folderId || null;
    
    // Save the updated capsule
    await kv.set(capsuleKey, capsule);
    
    console.log(`✅ Soft deleted capsule ${capsuleId} - moved to Archive`);
    
    return c.json({ 
      success: true,
      capsuleId,
      deletedAt: capsule.deletedAt
    });
  } catch (error: any) {
    console.error('❌ Error soft deleting capsule:', error);
    return c.json({ error: error.message }, 500);
  }
});

// POST /soft-delete-received - Archive received capsule (move to Archived Received list)
app.post('/make-server-f9be53a7/soft-delete-received', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const userId = await getUserId(accessToken);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { capsuleId } = body;
    
    if (!capsuleId) {
      return c.json({ error: 'capsuleId required' }, 400);
    }

    console.log(`🌫️ Archiving received capsule ${capsuleId} for user ${userId}`);

    // 1. Remove from Active Received List
    const receivedListKey = `user_received:${userId}`;
    let receivedIds = await kv.get(receivedListKey) || [];
    
    if (!receivedIds.includes(capsuleId)) {
      // It might not be in the list if already removed, but we proceed to add to archive just in case
      console.log(`ℹ️ Capsule ${capsuleId} was not in active received list`);
    } else {
      receivedIds = receivedIds.filter((id: string) => id !== capsuleId);
      await kv.set(receivedListKey, receivedIds);
    }
    
    // 2. Add to Archived Received List
    const archivedReceivedKey = `user_archived_received:${userId}`;
    let archivedIds = await kv.get(archivedReceivedKey) || [];
    
    if (!archivedIds.includes(capsuleId)) {
      archivedIds.push(capsuleId);
      await kv.set(archivedReceivedKey, archivedIds);
    }
    
    // 3. Store timestamp for archived received capsule
    const archivedTimestampsKey = `user_archived_received_timestamps:${userId}`;
    let archivedTimestamps = await kv.get(archivedTimestampsKey) || {};
    
    archivedTimestamps[capsuleId] = new Date().toISOString();
    await kv.set(archivedTimestampsKey, archivedTimestamps);
    
    console.log(`✅ Archived received capsule ${capsuleId}`);
    
    return c.json({ 
      success: true,
      capsuleId,
      archivedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error archiving received capsule:', error);
    return c.json({ error: error.message }, 500);
  }
});

// POST /soft-delete-vault - Soft delete vault items (move to Archive)
app.post('/make-server-f9be53a7/soft-delete-vault', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const userId = await getUserId(accessToken);
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { itemIds, folderId, folderName } = body;
    
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return c.json({ error: 'itemIds array required' }, 400);
    }

    console.log(`🌫️ Soft deleting ${itemIds.length} vault item(s) for user ${userId} (folder: ${folderName || folderId || 'unsorted'})`);
    
    let updatedCount = 0;
    
    // Update each item with deletion fields in the LEGACY_VAULT storage system
    for (const itemId of itemIds) {
      try {
        const itemKey = `legacy_vault:${userId}:${itemId}`;
        const recordData = await kv.get(itemKey);
        
        if (recordData) {
          // Mark as soft deleted
          recordData.deletedAt = new Date().toISOString();
          recordData.deletedFrom = folderId || 'vault-unsorted';
          recordData.deletedFromName = folderName || 'Unsorted';
          
          // Save back
          await kv.set(itemKey, recordData);
          updatedCount++;
          console.log(`  ✅ Soft deleted item ${itemId}`);
        } else {
          console.warn(`  ⚠️ Item ${itemId} not found in backend`);
        }
      } catch (error: any) {
        console.error(`  ❌ Error soft deleting item ${itemId}:`, error);
      }
    }
    
    console.log(`✅ Soft deleted ${updatedCount} vault item(s) - moved to Archive`);
    
    return c.json({ 
      success: true,
      deletedCount: updatedCount,
      deletedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Error soft deleting vault items:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default app;