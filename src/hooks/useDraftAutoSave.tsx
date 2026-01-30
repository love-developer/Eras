import { useEffect, useRef, useCallback, useState } from 'react';

const DRAFT_KEY = 'eras_capsule_draft';
const AUTO_SAVE_INTERVAL = 10000; // 10 seconds (reduced from 30 for better protection)

export interface DraftData {
  title: string;
  textMessage: string;
  recipientType: 'self' | 'others';
  deliveryMethod: 'email' | 'sms';
  selfContact: string;
  recipients: any[];
  deliveryDate: string | null;
  deliveryTime: string;
  timeZone: string;
  mediaFiles: Array<{
    id?: string; // Store original ID (UUID) if available
    name: string;
    type: string;
    size: number;
    base64?: string; // For smaller files
    url?: string; // For preview or remote files (Vault)
    fromVault?: boolean;
  }>;
  savedAt: number;
}

export function useDraftAutoSave() {
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<string>('');

  // Check if draft exists on mount
  useEffect(() => {
    const draft = loadDraft();
    setHasDraft(!!draft);
    if (draft) {
      setLastSaved(draft.savedAt);
    }
  }, []);

  // Load draft from localStorage
  const loadDraft = useCallback((): DraftData | null => {
    try {
      const draftStr = localStorage.getItem(DRAFT_KEY);
      if (!draftStr) return null;

      const draft = JSON.parse(draftStr);
      
      // Validate draft structure
      if (!draft.savedAt || typeof draft.savedAt !== 'number') {
        console.warn('Invalid draft structure, clearing...');
        localStorage.removeItem(DRAFT_KEY);
        return null;
      }

      // Check if draft is older than 30 days
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      if (draft.savedAt < thirtyDaysAgo) {
        console.log('Draft expired (>30 days old), clearing...');
        localStorage.removeItem(DRAFT_KEY);
        return null;
      }

      console.log('✅ Draft loaded successfully:', {
        savedAt: new Date(draft.savedAt).toLocaleString(),
        hasTitle: !!draft.title,
        hasMessage: !!draft.textMessage,
        mediaCount: draft.mediaFiles?.length || 0
      });

      return draft;
    } catch (error) {
      console.error('Error loading draft:', error);
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
  }, []);

  // Save draft to localStorage
  const saveDraft = useCallback(async (data: Partial<DraftData>, options?: { manual?: boolean }) => {
    try {
      setIsSaving(true);
      // Don't save if data is empty
      if (!data.title && !data.textMessage && (!data.mediaFiles || data.mediaFiles.length === 0)) {
        console.log('Skipping save - no content to save');
        return;
      }

      // Convert current data to string for comparison
      const dataStr = JSON.stringify(data);
      
      // Skip if data hasn't changed
      if (dataStr === lastDataRef.current && !options?.manual) {
        console.log('Skipping save - no changes detected');
        return;
      }

      // Process media files - convert blobs to base64 for smaller files
      let processedMediaFiles = [];
      if (data.mediaFiles && data.mediaFiles.length > 0) {
        // 🔧 PROACTIVE SIZE CHECK: Calculate total size before encoding
        // ✅ CRITICAL FIX: Exclude vault media from size check (they're stored in Supabase, not localStorage)
        const newMediaFiles = data.mediaFiles.filter(file => !file.fromVault);
        const totalFileSize = newMediaFiles.reduce((sum, file) => sum + (file.size || 0), 0);
        const MAX_DRAFT_FILE_SIZE = 1 * 1024 * 1024; // 1MB per file
        const LOCALSTORAGE_SAFE_LIMIT = 10 * 1024 * 1024; // 10MB total (conservative, as localStorage limit is typically 5-10MB)
        
        // If total size of small files exceeds safe limit, skip base64 encoding entirely
        const shouldSkipBase64 = totalFileSize > LOCALSTORAGE_SAFE_LIMIT;
        
        if (shouldSkipBase64) {
          console.log(`ℹ️ Draft contains ${(totalFileSize / 1024 / 1024).toFixed(2)}MB of new media - files tracked by reference (will be included in capsule)`);
        }
        
        // Log vault vs new media stats
        const vaultMediaCount = data.mediaFiles.filter(file => file.fromVault).length;
        if (vaultMediaCount > 0) {
          console.log(`📦 Draft contains ${vaultMediaCount} vault media item(s) (stored by reference only)`);
        }
        
        processedMediaFiles = await Promise.all(
          data.mediaFiles.map(async (file: any) => {
            const mediaItem: any = {
              id: file.id, // Store ID to preserve Vault/Existing media associations
              name: file.name || file.file_name || 'untitled',
              type: file.type || file.file_type || 'unknown',
              size: file.size || 0,
              // Store original URL if it's remote (Vault/Existing) and not a blob/data URL
              url: (file.url && !file.url.startsWith('blob:') && !file.url.startsWith('data:')) ? file.url : undefined,
              fromVault: file.fromVault
            };

            // ✅ VAULT MEDIA: Skip base64 encoding for vault media (already stored in Supabase)
            if (file.fromVault) {
              console.log(`📦 Vault media "${file.name}" stored by reference (ID: ${file.id})`);
              return mediaItem; // Just store metadata, not the actual file data
            }

            // 🔧 CRITICAL FIX: Only store base64 for files smaller than 1MB to avoid localStorage quota
            // Base64 encoding adds ~33% overhead, so 1MB becomes ~1.3MB
            // This prevents QuotaExceededError while still preserving small images/audio clips
            
            if (!shouldSkipBase64 && file.size && file.size < MAX_DRAFT_FILE_SIZE) {
              try {
                if (file.url && file.url.startsWith('blob:')) {
                  // Fetch blob and convert to base64
                  const response = await fetch(file.url);
                  const blob = await response.blob();
                  const base64 = await blobToBase64(blob);
                  mediaItem.base64 = base64;
                  console.log(`✅ Saved media to draft: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
                } else if (file.url && file.url.startsWith('data:')) {
                  mediaItem.base64 = file.url;
                  console.log(`✅ Saved media to draft: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
                }
              } catch (err) {
                console.warn('Failed to convert file to base64:', err);
              }
            } else if (file.size && file.size >= MAX_DRAFT_FILE_SIZE) {
              // Large files are tracked by reference only (not base64-encoded to localStorage)
              // This is normal and doesn't affect capsule functionality
              console.log(`📎 Media file "${file.name}" (${(file.size / 1024 / 1024).toFixed(2)}MB) tracked by reference (file preserved in capsule)`);
            }
            // Silent fall-through for 0-byte files (placeholders/remote) to avoid warnings

            return mediaItem;
          })
        );
      }

      const draftData: DraftData = {
        title: data.title || '',
        textMessage: data.textMessage || '',
        recipientType: data.recipientType || 'self',
        deliveryMethod: data.deliveryMethod || 'email',
        selfContact: data.selfContact || '',
        recipients: data.recipients || [],
        deliveryDate: data.deliveryDate || null,
        deliveryTime: data.deliveryTime || '12:00',
        timeZone: data.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        mediaFiles: processedMediaFiles,
        savedAt: Date.now()
      };

      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      lastDataRef.current = dataStr;
      setLastSaved(draftData.savedAt);
      setHasDraft(true);

      console.log('💾 Draft saved:', {
        timestamp: new Date(draftData.savedAt).toLocaleString(),
        manual: options?.manual,
        mediaCount: processedMediaFiles.length
      });
    } catch (error) {
      console.error('Error saving draft:', error);
      
      // 🔧 ENHANCED: Multi-tier fallback strategy for quota errors
      if (error.name === 'QuotaExceededError') {
        console.warn('⚠️ Storage quota exceeded - attempting fallback strategies...');
        
        try {
          // Strategy 1: Save with metadata only (no base64 data)
          console.log('📦 Attempting to save with metadata only (no base64)...');
          const metadataOnlyFiles = data.mediaFiles?.map(file => ({
            id: file.id,
            name: file.name || file.file_name || 'untitled',
            type: file.type || file.file_type || 'unknown',
            size: file.size || 0,
            url: (file.url && !file.url.startsWith('blob:') && !file.url.startsWith('data:')) ? file.url : undefined,
            fromVault: file.fromVault
            // Deliberately omitting base64 to save space
          })) || [];
          
          const minimalDraft = {
            title: data.title || '',
            textMessage: data.textMessage || '',
            recipientType: data.recipientType || 'self',
            deliveryMethod: data.deliveryMethod || 'email',
            selfContact: data.selfContact || '',
            recipients: data.recipients || [],
            deliveryDate: data.deliveryDate || null,
            deliveryTime: data.deliveryTime || '12:00',
            timeZone: data.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            mediaFiles: metadataOnlyFiles,
            savedAt: Date.now()
          };
          
          localStorage.setItem(DRAFT_KEY, JSON.stringify(minimalDraft));
          setLastSaved(minimalDraft.savedAt);
          setHasDraft(true);
          console.log('✅ Draft saved with metadata only (media content not saved)');
        } catch (metadataError) {
          // Strategy 2: Save text only, no media at all
          console.warn('⚠️ Metadata fallback failed, saving text only...');
          try {
            const textOnlyDraft = {
              title: data.title || '',
              textMessage: data.textMessage || '',
              recipientType: data.recipientType || 'self',
              deliveryMethod: data.deliveryMethod || 'email',
              selfContact: data.selfContact || '',
              recipients: data.recipients || [],
              deliveryDate: data.deliveryDate || null,
              deliveryTime: data.deliveryTime || '12:00',
              timeZone: data.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
              mediaFiles: [],
              savedAt: Date.now()
            };
            localStorage.setItem(DRAFT_KEY, JSON.stringify(textOnlyDraft));
            setLastSaved(textOnlyDraft.savedAt);
            setHasDraft(true);
            console.log('✅ Draft saved with text only (no media)');
          } catch (textError) {
            console.error('❌ All fallback strategies failed:', textError);
          }
        }
      }
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Clear draft
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      setHasDraft(false);
      setLastSaved(null);
      lastDataRef.current = '';
      console.log('🗑️ Draft cleared');
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  }, []);

  // Start auto-save
  const startAutoSave = useCallback((getData: () => Partial<DraftData>) => {
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }

    // Set up new auto-save interval
    autoSaveTimerRef.current = setInterval(() => {
      const data = getData();
      saveDraft(data);
    }, AUTO_SAVE_INTERVAL);

    console.log('🔄 Auto-save started (every 30 seconds)');
  }, [saveDraft]);

  // Stop auto-save
  const stopAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
      console.log('⏸️ Auto-save stopped');
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAutoSave();
    };
  }, [stopAutoSave]);

  return {
    loadDraft,
    saveDraft,
    clearDraft,
    startAutoSave,
    stopAutoSave,
    lastSaved,
    hasDraft,
    isSaving
  };
}

// Helper function to convert blob to base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Helper to format time ago
export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
  
  return new Date(timestamp).toLocaleDateString();
}