import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useIsMobile } from './ui/use-mobile';
import { useDraftAutoSave, formatTimeAgo } from '../hooks/useDraftAutoSave';
import { useUploadQueue } from '../hooks/useUploadQueue';
import { UploadQueueManager } from './UploadQueueManager';
import { FileSizeWarningDialog } from './FileSizeWarningDialog';
import { CapsuleMilestoneShare } from './CapsuleMilestoneShare';
import { CalendarIcon, Upload, X, Users, Mail, Smartphone, Plus, CheckCircle, Sparkles, Clock, Save, Wand2, Palette, Lightbulb, Loader2, Mic, Video, Trash2, CheckSquare, Folder, FolderOpen, ChevronRight, ChevronLeft, ArrowRight, ArrowLeft, MoreVertical, Download, RefreshCw, FolderUp, Rocket } from 'lucide-react';
import { format, isBefore, startOfDay } from 'date-fns';
import { MediaThumbnail } from './MediaThumbnail';
import { MediaPreviewModal } from './MediaPreviewModal';

import { QuickStartCarousel } from './QuickStartCarousel';
import { MultiRecipientSelector } from './MultiRecipientSelector';
import { supabase } from '../utils/supabase/client';
import { DatabaseService } from '../utils/supabase/database';
import { mediaCache } from '../utils/mediaCache';
import { toast } from 'sonner';
import { getUserTimeZone, TIME_ZONES, getTimeZoneDisplay, convertToUTCForStorage, fromUTC } from '../utils/timezone';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { compressVideo, compressImage, shouldCompress } from '../utils/video-compression';
import { uploadLargeFile, isLargeFile, formatFileSize } from '../utils/large-file-upload';
import { uploadFileInChunks } from '../utils/chunked-upload';
import { uploadWithTUS } from '../utils/tus-upload';
import confetti from 'canvas-confetti';
import { useAchievements } from '../hooks/useAchievements';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { queueOfflineAction } from '../utils/offline-storage';

import { ThemeSelector } from './capsule-themes/ThemeSelector';
import { getThemeConfig } from './capsule-themes/ThemeRegistry';
import { ThemeSpecificInputs } from './capsule-themes/ThemeSpecificInputs';
import { SealingOverlay } from './SealingOverlay';
import { VaultLoadingModal } from './VaultLoadingModal';

// AI Enhancement Suggestions - REMOVED
const AI_SUGGESTIONS: any[] = [];

// Slide animation variants for step transitions
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0
  })
};

// Media type interface
interface MediaItem {
  id: string;
  file: File;
  type: 'image' | 'video' | 'audio' | 'document';
  mimeType: string; // Actual MIME type from the file
  url: string;
  thumbnail?: string;
  duration?: number;
  size: number;
  compressed?: boolean;
  originalSize?: number;
  fromVault?: boolean; // Track if media came from vault (for debugging)
  alreadyUploaded?: boolean; // Flag to indicate media is from existing capsule (don't re-upload)
  originalId?: string; // 🔄 Track which media this enhanced version replaces
  uploading?: boolean; // 🎯 NEW: Flag to show loading state while vault media uploads in background
  vault_id?: string; // 🔥 FIX: Original vault ID for checkbox tracking when media is server-copied
}

// Recipient interface
interface Recipient {
  id: string;
  type: 'email' | 'phone';
  value: string;
  name?: string;
}

// Component Props
interface CreateCapsuleProps {
  onCapsuleCreated?: () => void;
  onNavigateToHome?: () => void; // ADDED: Navigate to Home (for draft saves)
  editingCapsule?: any;
  onCancelEdit?: () => void;
  initialMedia?: any[];
  workflowStep?: string;
  workflowTheme?: string | null; // 🎨 Theme from workflow
  workflowThemeMetadata?: any; // 🎨 Theme metadata from workflow
  onWorkInProgressChange?: (hasWork: boolean) => void;
  user?: any;
  onEnhance?: (media: any) => void;
  onOpenVault?: ((currentMedia?: any[], currentTheme?: string, currentThemeMetadata?: any) => void) | null;
  onOpenRecord?: () => void; // ADDED: Callback to navigate to Record tab
  initialDeliveryDate?: Date; // ADDED: Pre-fill delivery date (for Quick Add from Calendar)
  onMediaRemoved?: (mediaId: string, wasFromVault: boolean, vaultId?: string) => void; // ADDED: Notify when media is removed
  onVaultMediaIdsLoaded?: (vaultMediaIds: string[]) => void; // 🔥 ADDED: Notify when vault media IDs are loaded from editing capsule
  workflow?: any; // 🔥 ADDED: Workflow object for populating workflowMedia after draft hydration
  onRegisterRemoveMedia?: (removeMediaFn: (vaultId: string) => void) => void; // 🔥 ADDED: Register removeMedia function with parent
}

export function CreateCapsule({ 
  onCapsuleCreated,
  onNavigateToHome,
  editingCapsule, 
  onCancelEdit,
  initialMedia,
  workflowStep,
  workflowTheme,
  workflowThemeMetadata,
  onWorkInProgressChange,
  user,
  onEnhance,
  onOpenVault,
  onOpenRecord,
  initialDeliveryDate,
  workflow,
  onMediaRemoved,
  onVaultMediaIdsLoaded,
  onRegisterRemoveMedia
}: CreateCapsuleProps) {
  // 🔍 MOUNT/UNMOUNT TRACKING
  const mountId = useRef(`CC-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  console.log('🎬 CreateCapsule RENDER:', mountId.current, {
    initialMedia: initialMedia?.length || 0,
    workflowStep,
    editingCapsule: !!editingCapsule
  });
  
  useEffect(() => {
    console.log('✅ CreateCapsule MOUNTED:', mountId.current, {
      hasInitialMedia: !!initialMedia && initialMedia.length > 0,
      editingCapsule: !!editingCapsule
    });
    return () => {
      console.log('❌ CreateCapsule UNMOUNTED:', mountId.current);
    };
  }, []);
  
  const isMobile = useIsMobile();
  const { trackAction } = useAchievements();
  const { session } = useAuth();
  const { isOnline } = useNetworkStatus();
  // Internal state to track newly created drafts that have not been sealed yet
  // CRITICAL FIX: Initialize with unique ID to prevent collisions and ensure vault media linking works
  // FIX: Include setter so we can update when draft is saved to DB
  const [internalDraftId, setInternalDraftId] = useState<string | null>(null);
  
  // 🔥 CRITICAL FIX: Generate stable temp capsule ID ONCE at mount for consistent media linking
  // This ensures ALL vault media copies use the SAME temp ID, preventing orphaned media
  const stableTempCapsuleId = useRef<string | null>(null);
  
  // Initialize stable temp ID on mount
  useEffect(() => {
    if (!stableTempCapsuleId.current && !editingCapsule && !internalDraftId) {
      stableTempCapsuleId.current = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('🆔 Generated stable temp capsule ID:', stableTempCapsuleId.current);
    }
  }, [editingCapsule, internalDraftId]);
  
  // CRITICAL FIX: Track which initialMedia has been processed to prevent duplicate processing
  const processedInitialMediaRef = useRef<Set<string>>(new Set());
  
  // 🔥 CRITICAL FIX: Track if editing capsule media has been hydrated to prevent re-adding removed items
  const editingCapsuleHydratedRef = useRef(false);
  
  // 🔥 ADDED: Track if workflow has been populated to prevent infinite loops
  const workflowPopulatedRef = useRef(false);
  
  // 🔥 Track previous initialMedia to detect when it actually changes (coming from vault/record)
  const prevInitialMediaRef = useRef<any[] | null>(null);
  
  // Upload Queue System - Phase 1A
  const uploadQueue = useUploadQueue();
  
  // Track which files from the queue we've already processed to prevent infinite re-renders
  const processedQueueFilesRef = useRef<Set<string>>(new Set());
  
  // Phase 1A: Sync completed uploads from queue to media array
  // CRITICAL FIX: Use functional update to avoid stale closure and prevent duplicates
  // PERFORMANCE FIX: Track processed files to avoid re-processing on every render
  useEffect(() => {
    const completedFiles = uploadQueue.files.filter(f => f.status === 'completed' && f.url);
    
    // Only process files we haven't seen before
    const newCompletedFiles = completedFiles.filter(f => !processedQueueFilesRef.current.has(f.id));
    
    if (newCompletedFiles.length === 0) {
      return; // Nothing new to process - prevents infinite loop
    }
    
    console.log(`📤 UPLOAD QUEUE: Processing ${newCompletedFiles.length} newly completed file(s)`);
    
    newCompletedFiles.forEach(queueFile => {
      const mediaItem: MediaItem = {
        id: queueFile.id,
        file: queueFile.file,
        type: queueFile.type,
        mimeType: queueFile.file.type,
        url: queueFile.url!,
        size: queueFile.compressedSize || queueFile.size,
        compressed: !!queueFile.compressedSize,
        originalSize: queueFile.size,
        thumbnail: queueFile.thumbnailUrl, // Add thumbnail from upload queue
        uploading: false // Upload complete
      };
      
      setMedia(prev => {
        // 🎯 THUMBNAIL FIX: Check if there's a temp media item (vault OR record) to replace
        const tempIndex = prev.findIndex(m => m.uploading && m.file?.name === queueFile.file.name);
        
        if (tempIndex !== -1) {
          // ✅ Preserve thumbnail from temp item when replacing with completed upload
          const tempItem = prev[tempIndex];
          console.log('✅ Replacing temp media with completed upload:', {
            tempId: tempItem.id,
            newId: mediaItem.id,
            fileName: queueFile.file.name,
            preservingThumbnail: !!tempItem.thumbnail
          });
          const updated = [...prev];
          updated[tempIndex] = {
            ...mediaItem,
            thumbnail: tempItem.thumbnail || mediaItem.thumbnail // Preserve from temp
          };
          return updated;
        }
        
        // Double-check not already added (defensive programming)
        const alreadyAdded = prev.some(m => m.url === queueFile.url || m.id === queueFile.id);
        
        if (!alreadyAdded) {
          console.log('✅ Adding completed upload to media:', {
            id: mediaItem.id,
            type: mediaItem.type,
            mimeType: mediaItem.mimeType,
            hasThumbnail: !!mediaItem.thumbnail
          });
          return [...prev, mediaItem];
        }
        
        return prev;
      });
      
      // Mark this file as processed
      processedQueueFilesRef.current.add(queueFile.id);
    });
  }, [uploadQueue.files]);
  
  // Clean up processed queue files ref when component unmounts
  useEffect(() => {
    return () => {
      processedQueueFilesRef.current.clear();
    };
  }, []);
  
  // ============================================================================
  // VAULT MEDIA UPLOAD ARCHITECTURE (CRITICAL DATA INTEGRITY FIX)
  // ============================================================================
  // 
  // PROBLEM: Previously, vault media was NOT uploaded when attached to capsules.
  // Instead, vault IDs were sent as media_files, creating broken references.
  // When vault media was deleted, capsules lost their attachments!
  //
  // SOLUTION: Vault media is now uploaded as INDEPENDENT MediaFiles.
  // - Vault media goes through the same upload queue as recorded media
  // - Creates new MediaFile entries with new IDs
  // - Capsule stores MediaFile IDs (not vault IDs)
  // - Deleting vault media does NOT affect capsules ✅
  //
  // FLOW:
  // 1. User selects vault media → initialMedia arrives with fromVault: true
  // 2. Vault media enters upload queue (line ~497) 
  // 3. File is uploaded to capsule-media storage
  // 4. New MediaFile entry created with new ID
  // 5. Capsule stores MediaFile ID in media_files array
  // 6. Vault and capsule media are now INDEPENDENT
  //
  // NOTE: vault_media_ids in metadata was removed - no longer needed
  // ============================================================================
  
  // CRITICAL FIX: Process initialMedia from workflow (recorded/enhanced media AND Vault media)
  useEffect(() => {
    // If initialMedia is not provided (null/undefined), do nothing.
    // If it IS provided (array), we respect it, even if empty.
    if (!initialMedia) {
      console.log('📥 No initialMedia to process');
      return;
    }
    
    // CRITICAL: Create a unique key for this batch of initialMedia to prevent duplicate processing
    // Use multiple attributes to create a stable signature
    const mediaSignature = initialMedia.map(m => {
      // Create a unique identifier using multiple attributes
      const id = m.id || 'no-id';
      const filename = m.filename || m.file?.name || 'no-name';
      const size = m.file?.size || m.blob?.size || 0;
      const type = m.type || m.file?.type || 'no-type';
      const fromVault = m.fromVault ? 'vault' : 'other';
      return `${id}:${filename}:${size}:${type}:${fromVault}`;
    }).sort().join('|');
    
    if (processedInitialMediaRef.current.has(mediaSignature)) {
      console.log('⏭️ Skipping initialMedia - already processed this batch:', {
        signature: mediaSignature.substring(0, 150),
        alreadyProcessed: Array.from(processedInitialMediaRef.current)
      });
      return;
    }
    
    // Mark this batch as being processed
    processedInitialMediaRef.current.add(mediaSignature);
    console.log('🔄 Processing new initialMedia batch, signature:', mediaSignature.substring(0, 100));
    
    // Check if this is from Vault or Record workflow
    // 🔥 CRITICAL: Also check for vaultId property (enhanced vault media has this)
    const isFromVault = initialMedia.some(m => m.fromVault === true || !!m.vaultId);
    // ALLOW existing media (alreadyUploaded or has URL) - CRITICAL for preserving pre-selected media
    const isExisting = initialMedia.some(m => m.alreadyUploaded === true || (m.url && m.url.startsWith('http')));

    const isFromRecord = !isFromVault && !isExisting && initialMedia.some(m => {
      const hasValidBlob = m.blob instanceof Blob && m.blob.size > 0;
      const hasValidFile = m.file instanceof File && m.file.size > 0;
      console.log('🔍 Checking media item:', {
        hasBlob: !!m.blob,
        isBlob: m.blob instanceof Blob,
        blobSize: m.blob?.size,
        hasFile: !!m.file,
        isFile: m.file instanceof File,
        fileSize: m.file?.size,
        hasUrl: !!m.url,
        fromVault: m.fromVault,
        vaultId: m.vaultId,  // Also log vaultId
        isExisting,
        isFromRecord: hasValidBlob || hasValidFile
      });
      return hasValidBlob || hasValidFile;
    });
    
    if (!isFromRecord && !isFromVault && !isExisting) {
      console.log('📥 Skipping - media has no valid blob/file and is not from Vault or Existing');
      return;
    }
    
    const workflowSource = isFromVault ? 'Vault' : isExisting ? 'Existing' : 'Record';
    console.log(`📥 Processing initialMedia from ${workflowSource} workflow:`, {
      count: initialMedia.length,
      isFromVault,
      items: initialMedia.map(m => ({
        hasBlob: !!m.blob,
        hasFile: !!m.file,
        hasUrl: !!m.url,
        type: m.type,
        filename: m.filename || m.file?.name,
        fromVault: m.fromVault
      }))
    });
    
    // Phase 2: Show loading state while processing
    const loadingToast = toast.loading(`Processing ${initialMedia.length} media file${initialMedia.length > 1 ? 's' : ''}...`);
    
    // 🔥 CRITICAL FIX: When receiving initialMedia from Vault workflow, REPLACE media entirely
    // because initialMedia already contains the complete set (previously uploaded + new vault items)
    // Detect if initialMedia reference/content actually changed (indicates return from vault/record workflow)
    const initialMediaChanged = prevInitialMediaRef.current !== initialMedia;
    const prevMediaLength = prevInitialMediaRef.current?.length || 0;
    // 🔥 CRITICAL: Also check for vaultId property (enhanced vault media has this)
    const hasVaultItems = initialMedia.some(m => m.fromVault === true || !!m.vaultId);
    const hadVaultItems = prevInitialMediaRef.current?.some((m: any) => m.fromVault === true || !!m.vaultId) || false;
    const hasNonVaultItems = initialMedia.some(m => !m.fromVault && !m.vaultId);
    
    // 🔥 CRITICAL: Replace media when initialMedia changes (from vault/record workflow)
    // Key indicators:
    // 1. initialMedia reference changed (new array from workflow)
    // 2. We have vault items (vault workflow) OR from vault/record flags
    // 3. OR we previously had vault items and now have fewer items (vault removal case)
    // 4. BUT: If editing a capsule, NEVER replace - always merge to preserve existing attachments
    const isReturningFromWorkflow = initialMediaChanged && (
      hasVaultItems ||                                    // Has vault items
      isFromVault ||                                      // Detected as vault workflow
      isFromRecord ||                                     // Detected as record workflow
      (hadVaultItems && initialMedia.length < prevMediaLength) // Vault items were removed
    );
    // 🔥 CRITICAL: When editing a capsule, ALWAYS merge (never replace) to preserve existing attachments
    const shouldReplaceMedia = isReturningFromWorkflow && !editingCapsule;
    
    // Update the previous initialMedia ref for next comparison
    prevInitialMediaRef.current = initialMedia;
    
    console.log('🔍 shouldReplaceMedia decision:', {
      shouldReplaceMedia,
      initialMediaChanged,
      editingCapsule: !!editingCapsule,
      hasVaultItems,
      isFromVault,
      isFromRecord,
      prevInitialMediaLength: prevInitialMediaRef.current?.length || 0,
      currentInitialMediaLength: initialMedia.length,
      currentMediaLength: media.length
    });
    
    if (shouldReplaceMedia && media.length > 0) {
      console.log('🏛️ WORKFLOW RETURN DETECTED: Will REPLACE existing media');
      console.log('🏛️ Current media count:', media.length);
      console.log('🏛️ Current media IDs:', media.map(m => ({ id: m.id, url: m.url?.substring(0, 40) })));
      console.log('🏛️ Initial media count:', initialMedia.length);
      console.log('🏛️ Vault items:', initialMedia.filter(m => m.fromVault).length);
      console.log('🏛️ Non-vault items:', initialMedia.filter(m => !m.fromVault).length);
      console.log('🏛️ Initial media items:', initialMedia.map(m => ({ 
        id: m.id, 
        fromVault: m.fromVault,
        type: m.type,
        filename: m.filename || m.file?.name 
      })));
    }
    
    // CRITICAL FIX: Don't clear existing media - we want to APPEND new media from subsequent recordings
    // Only clear if this is from editing a capsule (fresh start) and we haven't loaded any media yet
    if (editingCapsule && media.length === 0 && !initialMedia) {
      console.log('📝 Editing capsule - clearing media for fresh start');
      setMedia([]);
    }
    
    // Explicitly handle empty array
    // 🔥 CRITICAL FIX: Also clear media when returning from workflow with empty initialMedia
    // This handles the case where user removed all vault items
    if (initialMedia.length === 0) {
       if (!editingCapsule || shouldReplaceMedia) {
         console.log('📥 initialMedia is empty array - setting media to empty', {
           shouldReplaceMedia,
           editingCapsule: !!editingCapsule
         });
         setMedia([]);
       }
       return;
    }
    const processedMedia: MediaItem[] = [];
    const errors: string[] = [];
    let successCount = 0;
    
    console.log('🔍 DIAGNOSTIC: Starting to process initialMedia array:', {
      arrayLength: initialMedia.length,
      items: initialMedia.map((item, i) => ({
        index: i,
        id: item.id,
        type: item.type,
        hasBlob: !!item.blob,
        blobSize: item.blob?.size,
        hasFile: !!item.file,
        fileSize: item.file?.size,
        hasUrl: !!item.url
      }))
    });
    
    initialMedia.forEach((item, index) => {
      try {
        console.log(`🔍 DIAGNOSTIC: Processing item ${index + 1}/${initialMedia.length}:`, {
          id: item.id,
          type: item.type,
          hasBlob: !!item.blob,
          isBlobInstance: item.blob instanceof Blob,
          blobType: item.blob?.type,
          blobSize: item.blob?.size,
          hasFile: !!item.file,
          isFileInstance: item.file instanceof File,
          fromVault: item.fromVault
        });
        
        // 🔥 CRITICAL FIX: Vault media has http URLs (signed URLs) but should NOT be treated as existing
        // Existing items are media already uploaded as MediaFiles (not vault media)
        const isExistingItem = !item.fromVault && (item.alreadyUploaded || (item.url && item.url.startsWith('http')));

        // 🎯 UX FIX: For vault items needing conversion, do it asynchronously
        // This prevents blocking the vault close animation
        console.log(`🔍 Checking vault conversion for item ${index + 1}:`, {
          fromVault: item.fromVault,
          needsConversion: (item as any).needsConversion,
          hasBase64Data: !!(item as any).base64Data,
          hasFile: !!item.file,
          hasBlob: !!item.blob
        });
        
        if (item.fromVault && (item as any).needsConversion && (item as any).base64Data) {
          console.log(`🔄 Vault item ${index + 1} needs conversion - processing in background...`);
          
          const convertAndUpload = async () => {
            try {
              const base64Data = (item as any).base64Data;
              const fileName = (item as any).fileName || `vault-${item.type}-${item.timestamp}`;
              const vaultMediaId = (item as any).vaultMediaId;
              const useServerCopy = (item as any).useServerCopy;
              
              // 🚀 TIER 2 OPTIMIZATION: Try server-side copy first (97% faster!)
              // Note: Server-side copy only works for files <50MB due to Edge Function memory limits
              // Larger files automatically fall back to standard import
              if (useServerCopy && vaultMediaId && session?.access_token) {
                try {
                  console.log(`🚀 [Server Copy] Attempting server-side copy for vault media: ${vaultMediaId}`);
                  
                  // Update modal to show cloud copy status
                  setVaultLoadingState({
                    isOpen: true,
                    fileName: fileName,
                    fileType: item.type === 'video' ? 'video' :
                             item.type === 'image' || item.type === 'photo' ? 'image' :
                             item.type === 'audio' ? 'audio' : 'unknown',
                    fileSize: 0, // Don't know size yet
                    progress: 0,
                    receivedBytes: 0,
                    status: 'downloading' // Will show as "Copying in cloud..."
                  });
                  
                  const serverCopyResponse = await fetch(
                    `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/vault/copy-to-capsule`,
                    {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        vaultMediaId,
                        capsuleId: editingCapsule?.id || internalDraftId || stableTempCapsuleId.current, // 🔥 FIX: Use stable temp ID
                        fileName,
                        fileType: item.type,
                        fileSize: 0 // Server will get this from vault metadata
                      })
                    }
                  );
                  
                  if (!serverCopyResponse.ok) {
                    const errorData = await serverCopyResponse.json();
                    
                    // Check if server suggests fallback
                    if (errorData.fallback) {
                      // Special handling for file too large
                      if (errorData.reason === 'file_too_large') {
                        const fileSizeMB = (errorData.fileSize / 1024 / 1024).toFixed(1);
                        console.warn(`⚠️ File too large for server copy (${fileSizeMB}MB), using standard import`);
                      } else {
                        console.warn(`⚠️ Server copy failed, falling back to client-side download:`, errorData.error);
                      }
                      throw new Error('FALLBACK_TO_CLIENT'); // Special error to trigger fallback
                    }
                    
                    throw new Error(`Server copy failed: ${errorData.error}`);
                  }
                  
                  const { media: serverCopiedMedia } = await serverCopyResponse.json();
                  
                  console.log(`✅ [Server Copy] Success! Copied in ${serverCopiedMedia.copiedInMs}ms`);
                  console.log(`📊 [Server Copy] Performance improvement: ~${((60000 / serverCopiedMedia.copiedInMs) * 100).toFixed(0)}x faster than client-side!`);
                  
                  // Create a temporary File object for compatibility with upload queue
                  // Note: This file is already uploaded, we just need the metadata
                  const blob = new Blob([''], { type: serverCopiedMedia.mimeType });
                  const file = new File([blob], serverCopiedMedia.fileName, {
                    type: serverCopiedMedia.mimeType
                  });
                  
                  // Add directly to media array (skip upload queue - already uploaded!)
                  const mediaItem: MediaItem = {
                    id: serverCopiedMedia.id,
                    file: file,
                    type: item.type as any,
                    mimeType: serverCopiedMedia.mimeType,
                    url: serverCopiedMedia.url,
                    thumbnail: serverCopiedMedia.thumbnail,
                    size: serverCopiedMedia.size || 0,
                    fromVault: true,
                    alreadyUploaded: true, // 🔥 CRITICAL: Mark as already uploaded
                    uploading: false,
                    vault_id: item.vaultMediaId // 🔥 FIX: Preserve original vault ID for checkbox tracking
                  };
                  
                  setMedia(prev => {
                    // Replace temp vault item if it exists
                    const tempVaultIndex = prev.findIndex(m => m.uploading && m.file?.name === fileName);
                    
                    if (tempVaultIndex !== -1) {
                      const updated = [...prev];
                      updated[tempVaultIndex] = mediaItem;
                      return updated;
                    }
                    
                    return [...prev, mediaItem];
                  });
                  
                  // Close modal and show success
                  setTimeout(() => {
                    setVaultLoadingState(prev => ({
                      ...prev,
                      isOpen: false
                    }));
                    toast.success(`${fileName} imported instantly!`, { 
                      duration: 2000,
                      description: `Copied in ${(serverCopiedMedia.copiedInMs / 1000).toFixed(1)}s via cloud`
                    });
                  }, 500);
                  
                  return; // ✅ Success - exit early, don't do client-side download
                  
                } catch (serverCopyError) {
                  // Close the modal before falling back
                  setVaultLoadingState(prev => ({
                    ...prev,
                    isOpen: false
                  }));
                  
                  // Only fallback if it's our special fallback error
                  if (serverCopyError.message === 'FALLBACK_TO_CLIENT') {
                    console.log(`🔄 Falling back to client-side download...`);
                    // Show a brief toast - the Tier 1 loading modal will show detailed progress
                    // Continue to client-side download below (no toast needed, loading modal will show)
                  } else {
                    // Unexpected error - log and fallback
                    console.error(`❌ [Server Copy] Unexpected error:`, serverCopyError);
                    // Continue to client-side download below (no toast needed, loading modal will show)
                  }
                }
              }
              
              // 🔄 FALLBACK: Client-side download (original method)
              
              // Helper functions
              const base64ToBlob = (b64Data: string, contentType: string): Blob => {
                const byteCharacters = atob(b64Data.split(',')[1] || b64Data);
                const byteArrays = [];
                for (let offset = 0; offset < byteCharacters.length; offset += 512) {
                  const slice = byteCharacters.slice(offset, offset + 512);
                  const byteNumbers = new Array(slice.length);
                  for (let i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                  }
                  byteArrays.push(new Uint8Array(byteNumbers));
                }
                return new Blob(byteArrays, { type: contentType });
              };
              
              // 🚀 Enhanced urlToBlob with progress tracking
              const urlToBlob = async (url: string): Promise<Blob> => {
                console.log(`🌐 Fetching from URL: ${url.substring(0, 100)}...`);
                
                let response;
                try {
                  response = await fetch(url);
                } catch (fetchError) {
                  console.error(`❌ Network error fetching URL:`, fetchError);
                  throw new Error(`Network error: ${fetchError.message}`);
                }
                
                console.log(`📡 Fetch response:`, {
                  status: response.status,
                  statusText: response.statusText,
                  ok: response.ok,
                  headers: {
                    contentType: response.headers.get('Content-Type'),
                    contentLength: response.headers.get('Content-Length')
                  }
                });
                
                if (!response.ok) {
                  // Try to get error details from response body
                  let errorDetails = '';
                  try {
                    const errorText = await response.text();
                    errorDetails = errorText.substring(0, 200);
                  } catch (e) {
                    errorDetails = '(could not read error body)';
                  }
                  
                  console.error(`❌ HTTP error:`, {
                    status: response.status,
                    statusText: response.statusText,
                    details: errorDetails
                  });
                  
                  throw new Error(`HTTP ${response.status}: ${response.statusText}. ${errorDetails}`);
                }
                
                // Get file size from Content-Length header
                const contentLength = response.headers.get('Content-Length');
                const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
                
                // Only show modal for large files (>10MB)
                const isLargeFile = totalBytes > 10 * 1024 * 1024;
                
                if (isLargeFile && totalBytes > 0) {
                  console.log(`📥 Large vault file detected (${(totalBytes / 1024 / 1024).toFixed(1)} MB) - showing progress modal`);
                  
                  // Determine file type from item
                  const fileType = item.type === 'video' ? 'video' :
                                   item.type === 'image' ? 'image' :
                                   item.type === 'audio' ? 'audio' : 'unknown';
                  
                  // Show loading modal
                  setVaultLoadingState({
                    isOpen: true,
                    fileName: fileName,
                    fileType: fileType as any,
                    fileSize: totalBytes,
                    progress: 0,
                    receivedBytes: 0,
                    status: 'downloading'
                  });
                  
                  // Track download progress
                  const reader = response.body!.getReader();
                  const chunks: Uint8Array[] = [];
                  let receivedBytes = 0;
                  let startTime = Date.now();
                  
                  while (true) {
                    const { done, value } = await reader.read();
                    
                    if (done) break;
                    
                    chunks.push(value);
                    receivedBytes += value.length;
                    
                    // Calculate progress
                    const progress = (receivedBytes / totalBytes) * 100;
                    
                    // Calculate time remaining
                    const elapsedTime = (Date.now() - startTime) / 1000; // seconds
                    const bytesPerSecond = receivedBytes / elapsedTime;
                    const remainingBytes = totalBytes - receivedBytes;
                    const timeRemaining = remainingBytes / bytesPerSecond;
                    
                    // Update progress every 100KB to avoid too many updates
                    if (value.length > 100 * 1024 || progress > 99) {
                      setVaultLoadingState(prev => ({
                        ...prev,
                        progress,
                        receivedBytes,
                        timeRemaining: timeRemaining > 0 ? timeRemaining : undefined
                      }));
                    }
                  }
                  
                  // Download complete - switch to converting status
                  setVaultLoadingState(prev => ({
                    ...prev,
                    progress: 100,
                    receivedBytes: totalBytes,
                    status: 'converting'
                  }));
                  
                  // Combine chunks into blob
                  const blob = new Blob(chunks);
                  return blob;
                } else {
                  // Small file - no progress tracking needed
                  return await response.blob();
                }
              };
              
              // Convert based on data format
              let blob: Blob;
              let url: string;
              
              if (base64Data.startsWith('http')) {
                // 🔄 CRITICAL FIX: Refresh signed URL if it might be expired
                // Vault URLs expire after 1 hour, so refresh before downloading
                let downloadUrl = base64Data;
                
                console.log(`🔍 URL Refresh Check:`, {
                  hasVaultMediaId: !!vaultMediaId,
                  vaultMediaId,
                  hasSession: !!session,
                  hasAccessToken: !!session?.access_token,
                  urlPreview: base64Data.substring(0, 100)
                });
                
                if (vaultMediaId && session?.access_token) {
                  try {
                    console.log(`🔄 Refreshing signed URL for vault media ${vaultMediaId}...`);
                    const refreshResponse = await fetch(
                      `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-vault/refresh-url`,
                      {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${session.access_token}`,
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ vaultMediaId })
                      }
                    );
                    
                    if (refreshResponse.ok) {
                      const { url: freshUrl } = await refreshResponse.json();
                      downloadUrl = freshUrl;
                      console.log(`✅ Got fresh signed URL (preview): ${freshUrl.substring(0, 100)}...`);
                    } else if (refreshResponse.status === 404) {
                      // Vault media not found in backend - it's a localStorage-only item
                      console.warn(`⚠️ Vault media not synced to backend - trying existing URL`);
                      console.warn(`💡 If this fails, the user needs to re-upload to Vault while signed in`);
                      // Continue with existing URL - might work if it hasn't expired yet
                    } else {
                      const errorData = await refreshResponse.json().catch(() => ({}));
                      console.error(`❌ Failed to refresh URL:`, {
                        status: refreshResponse.status,
                        statusText: refreshResponse.statusText,
                        error: errorData
                      });
                      // Continue with existing URL - it might still work
                    }
                  } catch (refreshError) {
                    console.error(`❌ URL refresh exception:`, refreshError);
                    // Continue with existing URL
                  }
                } else {
                  console.warn(`⚠️ Skipping URL refresh - missing vaultMediaId or session`);
                  console.warn(`💡 This might be a localStorage-only vault item`);
                }
                
                // 🔍 PRE-FLIGHT CHECK: Validate URL is accessible before downloading
                console.log(`🔍 Pre-flight: Validating URL accessibility...`);
                try {
                  const headResponse = await fetch(downloadUrl, { method: 'HEAD' });
                  
                  console.log(`📡 Pre-flight response:`, {
                    status: headResponse.status,
                    statusText: headResponse.statusText,
                    ok: headResponse.ok,
                    contentLength: headResponse.headers.get('Content-Length'),
                    contentType: headResponse.headers.get('Content-Type')
                  });
                  
                  if (!headResponse.ok) {
                    // URL is not accessible - fail fast with clear error
                    if (headResponse.status === 403) {
                      throw new Error('Access denied. This file was stored locally with an expired link. Please upload it to Vault again while signed in, then try importing.');
                    } else if (headResponse.status === 404) {
                      throw new Error('File not found. The storage link is broken or the file was deleted. Please re-upload to Vault.');
                    } else {
                      throw new Error(`Cannot access file (HTTP ${headResponse.status}). The storage link may be expired or invalid.`);
                    }
                  }
                  
                  console.log(`✅ Pre-flight passed - URL is accessible`);
                } catch (preflightError) {
                  console.error(`❌ Pre-flight check failed:`, preflightError);
                  
                  // If pre-flight check fails, don't attempt download
                  if (preflightError instanceof Error && preflightError.message.includes('Access denied')) {
                    throw preflightError; // Throw our custom error
                  } else if (preflightError instanceof Error && preflightError.message.includes('File not found')) {
                    throw preflightError; // Throw our custom error
                  } else if (preflightError instanceof Error && preflightError.message.includes('Cannot access file')) {
                    throw preflightError; // Throw our custom error
                  } else {
                    // Network error during pre-flight
                    throw new Error(`Cannot reach storage server. Check your internet connection and try again.`);
                  }
                }
                
                console.log(`📥 Starting download from URL...`);
                
                // ⚠️ LARGE FILE WARNING: Downloading very large files to browser memory can fail
                // Files are likely >400MB if they hit the server copy limit and fallback here
                try {
                  blob = await urlToBlob(downloadUrl);
                  url = downloadUrl;
                } catch (downloadError) {
                  console.error(`❌ Download failed:`, downloadError);
                  
                  // Enhance error message for large files
                  const errorMsg = downloadError instanceof Error ? downloadError.message : String(downloadError);
                  if (errorMsg.includes('403') || errorMsg.includes('Forbidden')) {
                    throw new Error('Access denied. This file may need to be re-uploaded to Vault while signed in.');
                  } else if (errorMsg.includes('404')) {
                    throw new Error('File not found. It may have been deleted from storage.');
                  } else {
                    // Re-throw with original error
                    throw downloadError;
                  }
                }
              } else if (base64Data.startsWith('blob:')) {
                // Blob URLs also benefit from progress tracking for large files
                blob = await urlToBlob(base64Data);
                url = base64Data;
              } else {
                blob = base64ToBlob(base64Data, (item as any).mimeType || 'application/octet-stream');
                url = URL.createObjectURL(blob);
              }
              
              // Convert QuickTime to MP4
              if (blob.type === 'video/quicktime' || (item as any).mimeType === 'video/quicktime') {
                blob = new Blob([blob], { type: 'video/mp4' });
              }
              
              // Determine filename
              const extension = item.type === 'video' ? 'mp4' : 
                                item.type === 'audio' ? 'mp3' : 
                                item.type === 'document' ? 'pdf' : 'jpg';
              const filename = (item as any).fileName || `vault-${item.type}-${item.timestamp}.${extension}`;
              
              // Create File object
              const file = new File([blob], filename, {
                type: blob.type,
                lastModified: item.timestamp || Date.now()
              });
              
              console.log(`✅ Vault item converted: ${filename} (${(blob.size / 1024 / 1024).toFixed(2)} MB)`);
              
              // Add to upload queue
              uploadQueue.addFiles([file]);
              
              // ✅ Close modal after successful conversion
              setTimeout(() => {
                setVaultLoadingState(prev => ({
                  ...prev,
                  isOpen: false
                }));
                toast.success(`${filename} ready!`, { duration: 2000 });
              }, 500); // Brief delay to show "Converting" status
              
            } catch (err) {
              console.error(`❌ Failed to convert vault item ${index + 1}:`, err);
              
              // Provide helpful error message
              const errorMessage = err instanceof Error ? err.message : 'Unknown error';
              const fileName = (item as any).fileName || 'vault media';
              
              // Check different error types
              const isAccessDenied = errorMessage.includes('Access denied') || errorMessage.includes('expired link');
              const isNotFound = errorMessage.includes('File not found') || errorMessage.includes('storage link is broken');
              const isCannotAccess = errorMessage.includes('Cannot access file') || errorMessage.includes('storage link may be expired');
              const isNetworkError = errorMessage.includes('Cannot reach storage server') || errorMessage.includes('Check your internet connection');
              
              if (isAccessDenied) {
                // Pre-flight caught expired URL
                toast.error(`⚠️ Access Expired`, {
                  description: `${fileName}: This file was stored locally with an expired link. Please upload it to Vault again while signed in, then try importing.`,
                  duration: 8000
                });
              } else if (isNotFound) {
                // Pre-flight caught missing file
                toast.error(`⚠️ File Not Found`, {
                  description: `${fileName}: The storage link is broken or the file was deleted. Please re-upload to Vault.`,
                  duration: 7000
                });
              } else if (isCannotAccess) {
                // Pre-flight caught other HTTP error
                toast.error(`⚠️ Cannot Access File`, {
                  description: `${fileName}: ${errorMessage}`,
                  duration: 7000
                });
              } else if (isNetworkError) {
                // Network/connectivity issue
                toast.error(`⚠️ Connection Error`, {
                  description: `${fileName}: Cannot reach storage server. Check your internet connection and try again.`,
                  duration: 6000
                });
              } else {
                // Other errors - show the message
                toast.error(`Failed to load ${fileName}`, {
                  description: errorMessage.substring(0, 200),
                  duration: 5000
                });
              }
              
              // Close modal on error
              setVaultLoadingState(prev => ({
                ...prev,
                isOpen: false
              }));
            }
          };
          
          // 🎯 CRITICAL: Defer conversion until AFTER vault close animation completes
          // Without this delay, the fetch starts immediately and blocks the vault
          setTimeout(() => {
            convertAndUpload();
          }, 500); // 500ms = vault close animation duration
          
          successCount++;
          return; // Skip rest of processing for this item
        }

        // Phase 2: Comprehensive validation
        // 🔥 FIX: Skip validation for vault items with needsConversion - they'll be validated after async conversion
        // 🔥 FIX: Skip validation for already-uploaded vault items - they're already validated on server
        const isVaultItemNeedingConversion = item.fromVault && (item as any).needsConversion;
        const isAlreadyUploadedVaultItem = item.fromVault && (item as any).alreadyUploaded;
        
        if (!isExistingItem && !isVaultItemNeedingConversion && !isAlreadyUploadedVaultItem) {
          if (!item.blob && !item.file) {
            throw new Error(`Media item ${index + 1}: No blob or file provided (hasBlob: ${!!item.blob}, hasFile: ${!!item.file})`);
          }
          
          if (item.blob && !(item.blob instanceof Blob)) {
            throw new Error(`Media item ${index + 1}: blob is not a Blob instance (type: ${typeof item.blob})`);
          }
          
          if (item.blob && item.blob.size === 0) {
            throw new Error(`Media item ${index + 1}: Empty blob (size: 0)`);
          }
          
          if (item.file && item.file.size === 0) {
            throw new Error(`Media item ${index + 1}: Empty file (size: 0)`);
          }
        }
        
        const itemSize = item.blob?.size || item.file?.size || 0;
        if (itemSize > 500 * 1024 * 1024) {
          throw new Error(`Media item ${index + 1}: File too large (max 500MB)`);
        }
        
        console.log(`✅ Media item ${index + 1} validation passed:`, {
          size: `${(itemSize / 1024 / 1024).toFixed(2)} MB`,
          hasBlob: !!item.blob,
          hasFile: !!item.file
        });
        
        // Use existing File object if available, otherwise create from blob
        const file = item.file || (item.blob ? new File(
          [item.blob], 
          item.filename || `media-${Date.now()}-${index}.${item.type?.includes('video') ? 'mp4' : item.type?.includes('audio') ? 'mp3' : 'jpg'}`,
          { 
            type: item.blob.type || item.type,
            lastModified: Date.now()
          }
        ) : null);
        
        if (!file) {
          throw new Error(`Media item ${index + 1}: Failed to create file object`);
        }
        
        // Create blob URL for preview if needed
        let previewUrl = item.url;
        if (!previewUrl && item.blob) {
          previewUrl = URL.createObjectURL(item.blob);
          console.log('✅ Created preview URL for media:', previewUrl);
        }
        
        // Validate preview URL
        if (!previewUrl || (!previewUrl.startsWith('blob:') && !previewUrl.startsWith('http'))) {
          console.warn(`⚠️ Media item ${index + 1}: Invalid preview URL, will use file directly`);
        }
        
        // 🔥 CRITICAL FIX: VAULT MEDIA MUST BE UPLOADED AS INDEPENDENT MEDIAFILES
        // Previously, vault media was skipped from upload, causing vault IDs to be sent as media_files
        // This created broken references - when vault media was deleted, capsules lost their attachments
        // NOW: Vault media is uploaded like regular media to create independent MediaFile entries
        // vault_media_ids in metadata is used ONLY for UI checkbox tracking when editing
        // 🔥 FIX: Check alreadyUploaded flag or http URL to avoid re-uploading vault media
        const isItemAlreadyUploaded = (item as any).alreadyUploaded || (item.url && item.url.startsWith('http'));
        const isEnhancedMedia = !!(item as any).originalId; // Enhanced media has originalId pointing to what it replaces
        
        if (!isExistingItem && !isItemAlreadyUploaded && !isEnhancedMedia) {
          // 🔥 UPLOAD VAULT MEDIA: Removed !item.fromVault check to fix data integrity bug
          // Vault media now gets uploaded as independent MediaFiles, preventing data loss when vault is deleted
          const uploadSource = item.fromVault ? 'Vault' : 'Record';
          console.log(`📤 Adding ${file.name} to upload queue (${uploadSource} workflow) - will create independent MediaFile`);
          
          // ✅ THUMBNAIL FIX: Add ALL media (vault AND record) to processedMedia immediately with thumbnail
          // This preserves thumbnails from RecordInterface for instant display
          if (true) { // Changed from: if (item.fromVault)
            const normalizeMediaType = (rawType: string | undefined, mimeType?: string): 'image' | 'video' | 'audio' | 'document' => {
              if (rawType === 'photo') return 'image';
              if (rawType === 'image') return 'image';
              if (rawType === 'video') return 'video';
              if (rawType === 'audio') return 'audio';
              if (rawType === 'document') return 'document';
              
              const typeStr = (rawType || mimeType || '').toLowerCase();
              if (typeStr.includes('video')) return 'video';
              if (typeStr.includes('audio')) return 'audio';
              if (typeStr.includes('image') || typeStr.includes('photo')) return 'image';
              if (typeStr.includes('application') || typeStr.includes('text') || typeStr.includes('document') || typeStr.includes('pdf')) return 'document';
              
              return 'image';
            };
            
            // Add to processedMedia immediately with preview URL
            // The upload queue will update this item when upload completes
            const tempMediaItem: MediaItem = {
              id: item.fromVault ? `vault-temp-${Date.now()}-${index}` : `record-temp-${Date.now()}-${index}`,
              file: file,
              type: normalizeMediaType(item.type, file.type),
              mimeType: file.type,
              url: previewUrl || '',
              size: file.size,
              thumbnail: item.thumbnail, // ✅ PRESERVE THUMBNAIL from RecordInterface
              fromVault: item.fromVault || false,
              alreadyUploaded: false,
              uploading: true
            };
            
            processedMedia.push(tempMediaItem);
            console.log(`✅ ${uploadSource} media added with thumbnail (uploading in background): ${file.name}`, {
              hasThumbnail: !!item.thumbnail
            });
          }
          
          uploadQueue.addFiles([file]); // Upload in background
          successCount++;
          // ✅ THUMBNAIL FIX: Both vault AND record media are now added to processedMedia above
        } else {
          // Skip upload if: existing item, already has blob URL, OR is enhanced media
          if (isItemAlreadyUploaded) {
            console.log(`⏭️ Skipping upload for ${file.name} - already uploaded (has blob URL)`);
          }
          if (isEnhancedMedia) {
            console.log(`✨ Adding enhanced media directly to capsule (no upload needed): ${file.name}`);
          }
          
          // Existing media or Enhanced media: create mediaItem and add to processedMedia
          // (no upload needed since it's already stored as MediaFile or fully processed)
          // NOTE: Vault media is NOT handled here - it goes through upload queue above
          
          const normalizeMediaType = (rawType: string | undefined, mimeType?: string): 'image' | 'video' | 'audio' | 'document' => {
            // First check the explicit type field
            if (rawType === 'photo') return 'image';
            if (rawType === 'image') return 'image';
            if (rawType === 'video') return 'video';
            if (rawType === 'audio') return 'audio';
            if (rawType === 'document') return 'document';
            
            // Fallback: check MIME type or type string
            const typeStr = (rawType || mimeType || '').toLowerCase();
            if (typeStr.includes('video')) return 'video';
            if (typeStr.includes('audio')) return 'audio';
            if (typeStr.includes('image') || typeStr.includes('photo')) return 'image';
            if (typeStr.includes('application') || typeStr.includes('text') || typeStr.includes('document') || typeStr.includes('pdf')) return 'document';
            
            // Default to image
            return 'image';
          };
          
          const mediaItem: MediaItem = {
            id: item.id || `initial-${Date.now()}-${index}`,
            file: file,
            type: normalizeMediaType(item.type, file.type),
            mimeType: file.type,
            url: previewUrl || '',
            size: file.size,
            thumbnail: item.thumbnail,
            fromVault: false, // Vault media no longer reaches this branch
            originalId: (item as any).originalId, // 🔄 CRITICAL: Preserve originalId for enhanced media replacement
            alreadyUploaded: item.alreadyUploaded || isExistingItem
          };
          
          processedMedia.push(mediaItem);
          successCount++;
          
          const mediaSource = isEnhancedMedia ? 'Enhanced' : isExistingItem ? 'Existing' : 'Already uploaded';
          console.log(`✅ ${mediaSource} media added to processedMedia (no upload needed):`, {
            id: mediaItem.id,
            fileName: file.name,
            fileSize: file.size,
            type: mediaItem.type,
            rawType: item.type,
            urlType: previewUrl?.startsWith('blob:') ? 'blob' : previewUrl?.startsWith('http') ? 'http' : 'unknown'
          });
        }
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : `Failed to process media ${index + 1}`;
        console.error(`❌ Error processing initialMedia item ${index + 1}:`, errorMsg, {
          itemId: item?.id,
          itemType: item?.type,
          hasBlob: !!item?.blob,
          hasFile: !!item?.file,
          error: error
        });
        errors.push(errorMsg);
      }
    });
    
    // Dismiss loading toast
    toast.dismiss(loadingToast);
    
    console.log('🔍 DIAGNOSTIC: Processing complete:', {
      totalItems: initialMedia.length,
      successCount,
      errorCount: errors.length,
      processedMediaCount: processedMedia.length
    });
    
    if (successCount > 0 || (shouldReplaceMedia && processedMedia.length === 0)) {
      // For Vault workflow: Add processedMedia directly since no upload needed
      if (processedMedia.length > 0 || shouldReplaceMedia) {
        // 🔥 CRITICAL FIX: Deduplicate by BOTH ID and URL to prevent duplicates
        // Vault items have real IDs, uploaded items have temp IDs
        // Also check URL (without query params) as fallback
        setMedia(prev => {
          // 🔄 CRITICAL: Check if we need to replace media (enhanced media replacing originals)
          const replacementIds = workflow?.mediaReplacementMap || [];
          const hasReplacements = replacementIds.length > 0;
          
          if (hasReplacements) {
            console.log('🔄 Removing original media being replaced by enhanced versions:', {
              replacementIds,
              prevCount: prev.length,
              incomingCount: processedMedia.length
            });
            // Remove the original media items that are being replaced
            prev = prev.filter(m => !replacementIds.includes(m.id));
            console.log('🔄 After removal, media count:', prev.length);
          }
          
          // 🔥 CRITICAL: If shouldReplaceMedia is true AND we don't have a replacement map, REPLACE entirely
          // If we have a replacement map, we already removed the originals above, so just MERGE
          if (shouldReplaceMedia && replacementIds.length === 0) {
            console.log('🏛️🏛️🏛️ REPLACING media entirely (ignoring prev):', {
              prevCount: prev.length,
              prevItems: prev.map(m => ({ id: m.id, url: m.url?.substring(0, 30) })),
              processedCount: processedMedia.length,
              processedItems: processedMedia.map(m => ({
                id: m.id,
                url: m.url?.substring(0, 30),
                type: m.type,
                fromVault: (m as any).fromVault
              }))
            });
            return processedMedia;
          } else if (replacementIds.length > 0) {
            console.log('🔄 MERGING enhanced media with existing (after removing originals):', {
              existingCount: prev.length,
              newCount: processedMedia.length,
              totalCount: prev.length + processedMedia.length
            });
            // Keep existing media (originals already removed) + add new enhanced items
            // Don't return yet - continue to deduplication logic below
          }
          
          const getBaseUrl = (url: string) => url ? url.split('?')[0] : '';
          
          const existingIds = new Set(prev.map(m => m.id));
          const existingUrls = new Set(prev.map(m => getBaseUrl(m.url)).filter(Boolean));
          
          const newMedia = processedMedia.filter(m => {
            const isDuplicateById = existingIds.has(m.id);
            const isDuplicateByUrl = m.url && existingUrls.has(getBaseUrl(m.url));
            
            if (isDuplicateById || isDuplicateByUrl) {
              console.log('🔍 Filtering duplicate media:', {
                id: m.id,
                url: getBaseUrl(m.url),
                isDuplicateById,
                isDuplicateByUrl
              });
              return false;
            }
            return true;
          });
          
          console.log('✅ Media merge summary:', {
            existing: prev.length,
            incoming: processedMedia.length,
            new: newMedia.length,
            duplicatesFiltered: processedMedia.length - newMedia.length
          });
          
          return [...prev, ...newMedia];
        });
      }
      
      // For Record workflow: Media gets added by uploadQueue effect, just show appropriate message
      if (errors.length === 0) {
        if (!isFromVault) {
          toast.success(`Processing ${successCount} media file${successCount > 1 ? 's' : ''}...`);
        } else {
          // 🎯 UX: Vault media uploads in background - user can continue editing
          toast.success(`${successCount} media file${successCount > 1 ? 's' : ''} added! Uploading in background...`, {
            duration: 3000
          });
        }
      } else {
        toast.warning(`${successCount} media added, ${errors.length} failed. Check console for details.`);
      }
    } else if (errors.length > 0) {
      toast.error('Failed to load media. Please try recording again.');
      console.error('All media processing failed:', errors);
    }
    
    // ❌ REMOVED DUPLICATE VAULT PROCESSING - Already handled above (lines 336-368)
    // This duplicate processing was causing:
    // 1. Invalid File objects created from URL strings (line 432: new File([item.url], ...) )
    // 2. Potential state conflicts and duplicate media
    // 3. Capsule creation failures because files weren't properly created with blob data
    // All vault media is now properly processed in the main loop above with proper File objects
    
    // 🔄 Clear the replacement map after processing
    if (workflow?.mediaReplacementMap?.length > 0) {
      workflow.setMediaReplacementMap([]);
      console.log('🔄 Cleared media replacement map');
    }
    
    return () => {
      toast.dismiss(loadingToast);
    };
  }, [initialMedia, workflowStep, workflow]);
  
  // CRITICAL FIX: Clear processed initialMedia ref when starting a new capsule
  useEffect(() => {
    // If we're not editing any capsule and have no initialMedia, we're starting fresh
    if (!editingCapsule && !initialMedia) {
      console.log('🆕 Starting new capsule - clearing processed initialMedia ref');
      processedInitialMediaRef.current.clear();
    }
  }, [editingCapsule]); // FIXED: Removed initialMedia to prevent infinite loop - only track editing state changes
  
  // Step management
  // CRITICAL FIX: Initialize step based on props to prevent resetting to step 1 (Theme) 
  // when returning from Record/Vault workflow (which provides initialMedia)
  const [currentStep, setCurrentStep] = useState(() => {
    // 🎨 THEME SELECTION FIX: Always start at step 1 when using media from vault
    // Only skip theme selection when editing existing capsules (theme already chosen)
    if (editingCapsule) {
      return 2; // Skip to content step for existing capsules
    }
    return 1; // Start at theme selection for new capsules (including vault media)
  });
  const [direction, setDirection] = useState(0);
  
  // Core state
  const [title, setTitle] = useState('');
  const [themeId, setThemeId] = useState('standard');
  const [themeMetadata, setThemeMetadata] = useState<any>({});
  const [message, setMessage] = useState('');
  const [deliveryDate, setDeliveryDate] = useState<Date>();
  const [deliveryTime, setDeliveryTime] = useState(''); // Empty by default - user must select
  const [timeZone, setTimeZone] = useState(getUserTimeZone());
  const [recipientType, setRecipientType] = useState<'self' | 'others' | null>(null); // No default - user must select
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  
  // 🚀 VAULT LOADING MODAL STATE - Track vault media download/conversion progress
  const [vaultLoadingState, setVaultLoadingState] = useState<{
    isOpen: boolean;
    fileName: string;
    fileType: 'image' | 'video' | 'audio' | 'unknown';
    fileSize: number;
    progress: number;
    receivedBytes: number;
    status: 'downloading' | 'converting' | 'complete';
    timeRemaining?: number;
  }>({
    isOpen: false,
    fileName: '',
    fileType: 'unknown',
    fileSize: 0,
    progress: 0,
    receivedBytes: 0,
    status: 'downloading'
  });
  

  
  // Folder state
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [attachedFolderId, setAttachedFolderId] = useState<string | null>(null);
  const [showFolderSelector, setShowFolderSelector] = useState(false);
  const [showAttachFolderDialog, setShowAttachFolderDialog] = useState(false);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMediaPreview, setShowMediaPreview] = useState(false);
  const [previewMediaId, setPreviewMediaId] = useState<string>('');
  
  // Sealing Ceremony State
  const [showSealingOverlay, setShowSealingOverlay] = useState(false);
  const [sealingSuccess, setSealingSuccess] = useState(false);
  const [sealingMode, setSealingMode] = useState<'seal' | 'draft'>('seal'); // Track if we're sealing or saving draft

  const [isAIEnhancing, setIsAIEnhancing] = useState(false);
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  
  // Phase 1B: File size warning dialog
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showFileSizeWarning, setShowFileSizeWarning] = useState(false);
  
  // Calendar popover state for auto-close
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Milestone celebration state
  const [milestoneData, setMilestoneData] = useState<{
    capsuleCount: number;
    photoCount?: number;
    videoCount?: number;
    audioCount?: number;
    textCount?: number;
  } | null>(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const messageTextareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Draft auto-save
  const { lastSaved, saveDraft: saveDraftToStorage, clearDraft, loadDraft: loadDraftFromStorage, hasDraft: draftExists } = useDraftAutoSave();
  
  // Helper to restore media from draft
  const restoreDraftMedia = useCallback(async (draftMedia: any[]) => {
    if (!draftMedia || draftMedia.length === 0) return;
    
    const loadingToast = toast.loading('Restoring media from draft...');
    const restoredMedia: MediaItem[] = [];
    
    try {
      for (const [index, item] of draftMedia.entries()) {
        try {
          let file: File | null = null;
          let url = item.url || '';
          
          if (item.base64) {
            // Convert base64 or blob URL to Blob/File
            const res = await fetch(item.base64);
            let blob = await res.blob();
            
            // 🎥 FIX: Convert QuickTime videos to use video/mp4 MIME type
            if (blob.type === 'video/quicktime' || item.type === 'video/quicktime' || item.name.toLowerCase().endsWith('.mov')) {
              console.log('🔄 Converting QuickTime blob to video/mp4 MIME type in CreateCapsule');
              blob = new Blob([blob], { type: 'video/mp4' });
            }
            
            file = new File([blob], item.name, { type: blob.type || item.type, lastModified: Date.now() });
            // Create a new object URL for the restored blob
            url = URL.createObjectURL(blob);
          } else if (url && url.startsWith('http')) {
            // Remote URL (Vault) - Create a dummy file object since we have the URL
            // This prevents re-uploading while keeping the UI working
            // 🔥 FIX: For vault items, create a minimal file placeholder
            file = new File([""], item.name, { type: item.type, lastModified: Date.now() });
          }
          
          if (file) {
            restoredMedia.push({
              id: item.id || `restored-${Date.now()}-${index}`, // Use stored ID if available, otherwise generate temp
              file: file,
              type: item.type.includes('video') ? 'video' 
                  : item.type.includes('audio') ? 'audio' 
                  : item.type.includes('application') || item.type.includes('text') ? 'document'
                  : 'image',
              mimeType: item.type,
              url: url,
              size: item.size,
              fromVault: item.fromVault,
              alreadyUploaded: item.alreadyUploaded || !!item.fromVault || (!!url && url.startsWith('http')), // 🔥 FIX: Restore alreadyUploaded flag
              vault_id: item.vault_id // 🔥 FIX: Preserve vault_id from draft
            });
          }
        } catch (e) {
          console.error('Failed to restore draft media item:', item, e);
        }
      }
      
      if (restoredMedia.length > 0) {
        setMedia(restoredMedia);
        toast.success(`Restored ${restoredMedia.length} media files`);
      }
    } catch (e) {
      console.error('Error restoring draft media:', e);
    } finally {
      toast.dismiss(loadingToast);
    }
  }, []);

  // Wrapper functions to adapt data structure
  const saveDraft = useCallback(() => {
    console.log('💾 Manual save draft with', media.length, 'media files');
    saveDraftToStorage({
      title,
      themeId,
      themeMetadata,
      textMessage: message,
      recipientType,
      deliveryMethod: 'email',
      selfContact: '',
      recipients,
      deliveryDate: deliveryDate?.toISOString() || null,
      deliveryTime,
      timeZone,
      mediaFiles: media.map(m => ({
        id: m.id, // Pass ID to draft storage
        name: m.file.name,
        type: m.file.type || `${m.type}/unknown`, // Include proper MIME type
        size: m.size,
        url: m.url,
        fromVault: m.fromVault,
        alreadyUploaded: m.alreadyUploaded, // 🔥 FIX: Preserve vault upload status
        vault_id: m.vault_id // 🔥 FIX: Preserve original vault ID
      }))
    }, { manual: true });
  }, [title, themeId, themeMetadata, message, recipientType, recipients, deliveryDate, deliveryTime, timeZone, media, saveDraftToStorage]);

  const loadDraft = useCallback(() => {
    const draft = loadDraftFromStorage();
    if (draft) {
      setTitle(draft.title || '');
      setThemeId(draft.themeId || 'standard');
      setThemeMetadata(draft.themeMetadata || {});
      setMessage(draft.textMessage || '');
      setRecipientType(draft.recipientType || null);
      setRecipients(draft.recipients || []);
      setDeliveryTime(draft.deliveryTime || '');
      setTimeZone(draft.timeZone || getUserTimeZone());
      
      if (draft.deliveryDate) {
        try {
          const date = new Date(draft.deliveryDate);
          if (!isNaN(date.getTime())) {
            setDeliveryDate(date);
          }
        } catch (e) {
          console.error('Failed to parse delivery date:', e);
        }
      }
      
      // Restore media files
      if (draft.mediaFiles && draft.mediaFiles.length > 0) {
        restoreDraftMedia(draft.mediaFiles);
      } else {
        toast.success('Draft loaded!');
      }
    }
  }, [loadDraftFromStorage, restoreDraftMedia]);
  
  // 🔥 AUTO-LOAD DRAFT ON MOUNT
  useEffect(() => {
    // Load draft unless we're editing an existing capsule
    if (!editingCapsule) {
      const draft = loadDraftFromStorage();
      if (draft && (draft.title || draft.textMessage || draft.themeId)) {
        console.log('🔄 Auto-loading draft on mount:', {
          hasTitle: !!draft.title,
          hasMessage: !!draft.textMessage,
          hasTheme: !!draft.themeId,
          hasInitialMedia: !!initialMedia && initialMedia.length > 0
        });
        setTitle(draft.title || '');
        setThemeId(draft.themeId || 'standard');
        setThemeMetadata(draft.themeMetadata || {});
        setMessage(draft.textMessage || '');
        setRecipientType(draft.recipientType || null);
        setRecipients(draft.recipients || []);
        setDeliveryTime(draft.deliveryTime || '');
        setTimeZone(draft.timeZone || getUserTimeZone());
        
        if (draft.deliveryDate) {
          try {
            const date = new Date(draft.deliveryDate);
            if (!isNaN(date.getTime())) {
              setDeliveryDate(date);
            }
          } catch (e) {
            console.error('Failed to parse delivery date:', e);
          }
        }
        
        // 🔥 CRITICAL FIX: Don't restore draft media if initialMedia exists
        // initialMedia from workflow takes priority over saved draft
        if (draft.mediaFiles && draft.mediaFiles.length > 0 && (!initialMedia || initialMedia.length === 0)) {
          restoreDraftMedia(draft.mediaFiles);
        } else if (initialMedia && initialMedia.length > 0) {
          console.log('⏭️ Skipping draft media restoration - initialMedia takes priority');
        }
      }
    }
  }, []); // Run once on mount
  
  // 🎨 CRITICAL FIX: Restore theme from workflow when returning from Vault
  useEffect(() => {
    if (workflowTheme && !editingCapsule) {
      console.log('🎨 Restoring theme from workflow:', workflowTheme);
      setThemeId(workflowTheme);
      if (workflowThemeMetadata) {
        setThemeMetadata(workflowThemeMetadata);
      }
    }
  }, [workflowTheme, workflowThemeMetadata, editingCapsule]);
  
  // Track previous content state to prevent infinite loops
  const prevHasContentRef = useRef<boolean | null>(null);

  // Auto-save draft when content changes
  useEffect(() => {
    const hasContent = !!(title.trim() || message.trim() || media.length > 0 || recipients.length > 0 || deliveryDate || themeId !== 'standard');
    
    if (hasContent) {
      console.log('💾 Auto-saving draft...');
      
      // 🔥 CRITICAL FIX: Skip auto-save immediately after processing initialMedia
      // to avoid race condition where media state hasn't updated yet from vault selection
      const isProcessingInitialMedia = initialMedia && initialMedia.length > 0 && media.length < initialMedia.length;
      if (isProcessingInitialMedia) {
        console.log('⏭️ Skipping auto-save - waiting for media state to update from initialMedia');
        return;
      }
      
      saveDraftToStorage({
        title,
        themeId,
        themeMetadata,
        textMessage: message,
        recipientType,
        deliveryMethod: 'email',
        selfContact: '',
        recipients,
        deliveryDate: deliveryDate?.toISOString() || null,
        deliveryTime,
        timeZone,
        mediaFiles: media.map(m => ({
          name: m.file.name,
          type: m.file.type || `${m.type}/unknown`,
          size: m.size,
          url: m.url
        }))
      });
    }
    
    // Notify parent about work in progress - ONLY if state changed to prevent infinite loops
    if (prevHasContentRef.current !== hasContent) {
      prevHasContentRef.current = hasContent;
      onWorkInProgressChange?.(hasContent);
    }
  }, [title, message, recipientType, recipients, deliveryDate, deliveryTime, timeZone, media, saveDraftToStorage, onWorkInProgressChange, themeId, themeMetadata]); // ❌ REMOVED initialMedia from dependencies to prevent infinite loop when vault media is loading

  // Load editing capsule data
  useEffect(() => {
    if (editingCapsule) {
      console.log('📝 Loading editing capsule:', editingCapsule);
      // 🔥 Reset hydration flag when loading a new editing capsule ONLY if initialMedia doesn't exist
      // If initialMedia exists, we're returning from vault and should NOT reset hydration flag
      if (!initialMedia || initialMedia.length === 0) {
        editingCapsuleHydratedRef.current = false;
        workflowPopulatedRef.current = false; // Also reset workflow population flag
      }
      setTitle(editingCapsule.title || '');
      
      // Parse metadata for theme
      try {
        let metadata = typeof editingCapsule.metadata === 'string' 
          ? JSON.parse(editingCapsule.metadata) 
          : editingCapsule.metadata;
          
        // Handle case where metadata is null/undefined
        if (!metadata) {
          console.log('ℹ️ No metadata found in editingCapsule, initializing defaults');
          metadata = {};
        }
          
        console.log('📝 Parsed metadata:', metadata);
        
        // Check for theme in metadata OR at root level (fallback)
        // We check root 'theme' first now since we are saving it there explicitly
        const themeFromMetadata = metadata?.theme;
        const themeFromRoot = editingCapsule.theme || editingCapsule.themeId || editingCapsule.theme_id;
        
        const resolvedTheme = themeFromRoot || themeFromMetadata || 'standard';
        console.log('🎨 Resolved theme:', resolvedTheme, '(Root:', themeFromRoot, 'Meta:', themeFromMetadata, ')');
        
        // Only update state if we found a valid theme or if it's explicitly standard
        if (resolvedTheme) {
          setThemeId(resolvedTheme);
        }
        
        // Extract rest of metadata excluding theme
        const { theme, vault_media_ids, ...rest } = metadata || {};
        setThemeMetadata(rest);
        
        // 🔥 REMOVED: vault_media_ids tracking - no longer needed since vault media is uploaded as independent MediaFiles
        // The capsule will have all media in the media_files array regardless of source (vault or direct upload)
      } catch (e) {
        console.warn('Failed to parse metadata:', e);
        setThemeId('standard');
        setThemeMetadata({});
      }

      // Handle both message and text_message fields
      setMessage(editingCapsule.message || editingCapsule.text_message || '');
      
      setRecipientType(editingCapsule.recipient_type || null);
      
      // ❌ REMOVED: Don't set delivery_time here - we'll calculate it from the zonedDate below
      // setDeliveryTime(editingCapsule.delivery_time || '');
      
      const tz = editingCapsule.time_zone || getUserTimeZone();
      setTimeZone(tz);
      
      setSelectedFolderId(editingCapsule.folder_id || null);
      setAttachedFolderId(editingCapsule.attached_folder_id || null);
      
      // ✅ NEW: Detect if this is a failed draft (capsule that failed delivery and was converted to draft)
      const isFailedDraft = editingCapsule.failure_reason != null;
      
      if (isFailedDraft) {
        console.log('🚨 [FAILED DRAFT] Loading capsule that failed delivery:', {
          id: editingCapsule.id,
          failure_reason: editingCapsule.failure_reason,
          failed_at: editingCapsule.failed_at,
          original_delivery_date: editingCapsule.original_delivery_date,
          media_files: editingCapsule.media_files?.length || 0
        });
        
        // ✅ Show context about the failure
        toast.info(
          <div className="text-sm">
            <p className="font-semibold mb-1">⚠️ Editing Failed Delivery</p>
            <p>Original delivery failed: {editingCapsule.failure_reason}</p>
            {editingCapsule.original_delivery_date && (
              <p className="mt-1 text-xs opacity-80">
                Was scheduled: {format(new Date(editingCapsule.original_delivery_date), 'MMM d, yyyy h:mm a')}
              </p>
            )}
          </div>,
          { duration: 10000, id: 'failed-draft-context' }
        );
        
        // ✅ CRITICAL: Don't pre-fill delivery date for failed drafts (force user to set new date)
        // Leave deliveryDate and deliveryTime empty
        console.log('🚨 Clearing delivery fields for failed draft - user must set new date/time');
      } else if (editingCapsule.delivery_date) {
        try {
          // Use fromUTC to get the correct date components for the target timezone
          // This prevents date shifting when saving back
          const utcDate = new Date(editingCapsule.delivery_date);
          const zonedDate = fromUTC(utcDate, tz);
          
          // ✅ CRITICAL FIX: Calculate delivery_time from zonedDate, not from editingCapsule.delivery_time
          // The delivery_time field in old capsules may be corrupted (contains UTC time instead of local time)
          // By extracting from zonedDate, we get the correct local time
          const localHours = zonedDate.getHours();
          const localMinutes = zonedDate.getMinutes();
          const correctLocalTime = `${String(localHours).padStart(2, '0')}:${String(localMinutes).padStart(2, '0')}`;
          setDeliveryTime(correctLocalTime);
          
          // ❌ REMOVED: Manual time override was causing double-conversion bug
          // fromUTC() already extracts the correct time components from the UTC date
          // in the target timezone. Manually calling setHours() was re-applying the time
          // in the browser's timezone, causing the time to shift incorrectly.
          
          console.log('📅 Loaded delivery date for editing:', {
            originalUTC: editingCapsule.delivery_date,
            timezone: tz,
            zonedDateString: zonedDate.toString(),
            zonedDateComponents: {
              year: zonedDate.getFullYear(),
              month: zonedDate.getMonth() + 1,
              day: zonedDate.getDate(),
              hour: zonedDate.getHours(),
              minute: zonedDate.getMinutes()
            },
            storedDeliveryTime: editingCapsule.delivery_time,
            calculatedLocalTime: correctLocalTime
          });
          setDeliveryDate(zonedDate);
        } catch (e) {
          console.error('❌ Failed to parse delivery date:', e);
        }
      }
      
      if (editingCapsule.recipients && editingCapsule.recipients.length > 0) {
        setRecipients(editingCapsule.recipients.map((r: any) => ({
          id: r.id || `recipient-${Date.now()}-${Math.random()}`,
          type: r.type || 'email',
          value: r.value || r.contact || '',
          name: r.name || ''
        })));
      }
      
      // Load media if available - check both media_urls and attachments
      const mediaUrls = editingCapsule.media_urls || 
                       (editingCapsule.attachments ? editingCapsule.attachments.map((a: any) => a.url) : []);
                       
      // CRITICAL FIX: ALWAYS hydrate DB media if we have an editing capsule
      // This ensures we have the base state (with real IDs) even if initialMedia is provided
      if (mediaUrls && mediaUrls.length > 0 && media.length === 0 && !initialMedia) {
        // Visual optimisic load (only if no media loaded yet)
        console.log('📎 Loading existing media (visual):', mediaUrls.length);
        const existingMedia: MediaItem[] = mediaUrls.map((url: string, idx: number) => {
          const mediaType = url.includes('video') ? 'video' 
                          : url.includes('audio') ? 'audio'
                          : url.includes('.pdf') || url.includes('.doc') || url.includes('.txt') ? 'document'
                          : 'image';
          return {
            id: `existing-${idx}-${Date.now()}`, // Temp ID
            file: new File([], `existing-${idx}`, { type: `${mediaType}/unknown` }),
            type: mediaType,
            mimeType: `${mediaType}/unknown`,
            url: url,
            size: 0,
            alreadyUploaded: true
          };
        });
        setMedia(existingMedia);
      }
        
      // Hydrate real IDs from DB in background to ensure save works correctly
      // 🔥 CRITICAL FIX: Only hydrate once to avoid re-adding items user removed
      // 🔥 CRITICAL: Always hydrate when editing, even if initialMedia exists!
      // The initialMedia from vault needs to be MERGED with existing attachments, not replace them
      if (editingCapsule.id && !editingCapsuleHydratedRef.current) {
            console.log('📎 Hydrating media for editing capsule (fetching real IDs):', editingCapsule.id);
            
            // ✅ CRITICAL: For failed drafts, verify expected media count
            const isFailedDraft = editingCapsule.failure_reason != null;
            const expectedMediaCount = editingCapsule.media_files?.length || 0;
            
            if (isFailedDraft && expectedMediaCount > 0) {
              console.log(`🚨 [FAILED DRAFT] Verifying ${expectedMediaCount} media files are intact...`);
            }
            
            editingCapsuleHydratedRef.current = true; // Mark as hydrated
            DatabaseService.getCapsuleMediaFiles(editingCapsule.id).then(files => {
                if (files && files.length > 0) {
                    console.log('✅ Hydrated media loaded:', files.length);
                    
                    // ✅ VERIFICATION: Check if all expected media loaded for failed drafts
                    if (isFailedDraft) {
                      if (files.length < expectedMediaCount) {
                        console.warn(`⚠️ Media loading incomplete: ${files.length}/${expectedMediaCount} files loaded`);
                        toast.error(
                          `${expectedMediaCount - files.length} media file${expectedMediaCount - files.length > 1 ? 's' : ''} could not be loaded. They may have been deleted.`,
                          { duration: 10000 }
                        );
                      } else {
                        console.log(`✅ All ${files.length} media files loaded successfully`);
                        toast.success(
                          `✅ All ${files.length} media file${files.length > 1 ? 's' : ''} restored from failed capsule`,
                          { duration: 5000 }
                        );
                      }
                    }
                    const realMedia: MediaItem[] = files.map((file: any, idx: number) => {
                        // Use the actual MIME type from the database
                        const mediaType = file.file_type || file.type || file.media_type || 'application/octet-stream';
                        
                        // Determine simple type for UI rendering
                        const simpleType = mediaType.startsWith('video') ? 'video' 
                                        : mediaType.startsWith('audio') ? 'audio'
                                        : mediaType.includes('application') || mediaType.includes('text') ? 'document'
                                        : 'image';
                        return {
                            id: file.id, // REAL UUID
                            file: new File([], file.file_name || `existing-${idx}`, { type: mediaType }), // ✅ Use actual MIME type, not "video/unknown"
                            type: simpleType,
                            mimeType: mediaType, // Full MIME type
                            url: file.url,
                            size: file.file_size || 0,
                            alreadyUploaded: true
                        };
                    });
                    
                    // Smart merge to preserve user edits/additions that happened during fetch
                    setMedia(prev => {
                       // Helper to strip query params for comparison
                       const getBaseUrl = (url: string) => url ? url.split('?')[0] : '';
                       
                       // Create a map of real media by BASE URL for easy lookup
                       const realMediaMap = new Map(realMedia.map(m => [getBaseUrl(m.url), m]));
                       
                       // Check if we have any non-placeholder items (user added ones)
                       const userAddedItems = prev.filter(m => 
                         !m.id.toString().startsWith('existing-') && 
                         !m.id.toString().startsWith('hydrated-')
                       );
                       
                       // If prev is empty, just use realMedia
                       if (prev.length === 0) {
                         // 🔥 CRITICAL FIX: Populate workflow with hydrated media (single source of truth)
                         // This makes drafts work identically to fresh templates after initial load
                         if (workflow && workflow.setWorkflowMedia && !workflowPopulatedRef.current) {
                           console.log('🏛️ Populating workflow with hydrated media:', realMedia.length);
                           workflowPopulatedRef.current = true;
                          workflow.setWorkflowMedia(realMedia);
                         }
                         return realMedia;
                       }
                       
                       // If we have user added items, we need to merge carefully
                       const merged = [...prev];
                       
                       // 1. Upgrade placeholders to real items
                       for (let i = 0; i < merged.length; i++) {
                           // Check if it's a placeholder OR if it matches a real item by URL (even if not placeholder)
                           // This handles the case where we just saved and have local items that are now in DB
                           const baseItemUrl = getBaseUrl(merged[i].url);
                           if (realMediaMap.has(baseItemUrl)) {
                               const real = realMediaMap.get(baseItemUrl);
                               if (real) {
                                   // Preserve the file object if we have it locally but not in the "real" one (which is from DB)
                                   // But actually, we want the real ID.
                                   merged[i] = {
                                       ...real,
                                       file: merged[i].file.size > 0 ? merged[i].file : real.file // Keep local file if valid
                                   };
                               }
                           }
                       }
                       
                       // 2. Append any real items that aren't in prev (by BASE URL)
                       const existingBaseUrls = new Set(merged.map(m => getBaseUrl(m.url)));
                       
                       realMedia.forEach(rm => {
                           const rmBaseUrl = getBaseUrl(rm.url);
                           // Also check by ID to be safe
                           const idExists = merged.some(m => m.id === rm.id);
                           
                           if (!existingBaseUrls.has(rmBaseUrl) && !idExists) {
                               merged.push(rm);
                           }
                       });
                       
                       return merged;
                    });
                }
                // 🔥 After hydration, populate workflow (handles merge case) - SECOND OCCURRENCE
                if (workflow && workflow.setWorkflowMedia && !workflowPopulatedRef.current) {
                  workflowPopulatedRef.current = true;
                   workflow.setWorkflowMedia(files.map((file: any, idx: number) => {
                    const mediaType = file.file_type || file.type || file.media_type || 'application/octet-stream';
                    const simpleType = mediaType.startsWith('video') ? 'video' 
                                    : mediaType.startsWith('audio') ? 'audio'
                                    : mediaType.includes('application') || mediaType.includes('text') ? 'document'
                                    : 'image';
                    return {
                        id: file.id,
                        file: new File([], file.file_name || `existing-${idx}`, { type: mediaType }),
                        type: simpleType,
                        mimeType: mediaType,
                        url: file.url,
                        size: file.file_size || 0,
                        alreadyUploaded: true
                    };
                  }));
                }
            }).catch(err => console.warn('Failed to hydrate media for editing:', err));
      }
    }
  }, [editingCapsule]); // FIXED: Removed initialMedia to prevent infinite loop - initialMedia handled by separate effect

  // Initialize with pre-filled delivery date (Quick Add from Calendar)
  useEffect(() => {
    if (initialDeliveryDate && !editingCapsule) {
      console.log('📅 Quick Add: Pre-filling delivery date:', initialDeliveryDate);
      setDeliveryDate(initialDeliveryDate);
    }
  }, [initialDeliveryDate, editingCapsule]);

  // Apply template
  const applyTemplate = (template: { id: string; title: string; message: string; icon: string; name: string }) => {
    setTitle(template.title);
    setMessage(template.message);
    toast.success(`Applied ${template.name} template`);
  };

  // Media handling - Phase 1B: Upload Queue with File Size Warnings
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // ✅ REMOVED QuickTime/MOV restriction - modern browsers support .mov files well
    // iPhones save videos as .mov by default, so we now accept them
    // ✅ WebM (.webm) is also fully supported

    // Check for large files (>10MB)
    const largeFiles = files.filter((f) => f.size > 10 * 1024 * 1024);

    if (largeFiles.length > 0) {
      // Show warning dialog for large files
      setPendingFiles(files);
      setShowFileSizeWarning(true);
    } else {
      // Upload directly for small files
      await uploadQueue.addFiles(files);
      toast.success(`Added ${files.length} file${files.length > 1 ? 's' : ''} to queue`);
    }
    
    // Reset the file input so the same file can be selected again
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleFileSizeWarningConfirm = async (shouldCompress: boolean) => {
    setShowFileSizeWarning(false);
    if (shouldCompress) {
      await uploadQueue.addFiles(pendingFiles, { compress: true });
      toast.success(`Added ${pendingFiles.length} file${pendingFiles.length > 1 ? 's' : ''} to queue with compression`);
    } else {
      await uploadQueue.addFiles(pendingFiles, { compress: false });
      toast.success(`Added ${pendingFiles.length} file${pendingFiles.length > 1 ? 's' : ''} to queue`);
    }
    setPendingFiles([]);
  };

  const handleFileSizeWarningCancel = () => {
    setShowFileSizeWarning(false);
    setPendingFiles([]);
  };

  const toggleMediaSelection = (mediaId: string) => {
    setSelectedMediaIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(mediaId)) {
        newSet.delete(mediaId);
      } else {
        newSet.add(mediaId);
      }
      return newSet;
    });
  };

  const handleDeleteSelectedMedia = async () => {
    if (selectedMediaIds.size === 0) {
      toast.error('No media selected');
      return;
    }

    // 🔥 CRITICAL FIX: If editing capsule, delete from database first
    if (editingCapsule) {
      const itemsToDelete = media.filter(m => selectedMediaIds.has(m.id) && m.alreadyUploaded);
      if (itemsToDelete.length > 0) {
        try {
          console.log('🗑️ Bulk deleting from database:', itemsToDelete.length, 'items');
          const deleteResults = await Promise.allSettled(
            itemsToDelete.map(item => DatabaseService.deleteMediaFile(item.id))
          );
          
          // Count failures (excluding "not found" errors)
          const failures = deleteResults.filter((r, idx) => {
            if (r.status === 'rejected') {
              const error = r.reason?.message || '';
              if (!error.includes('Media file not found')) {
                return true; // Real failure
              }
              console.log(`ℹ️ Media ${itemsToDelete[idx].id} not in DB yet, skipping`);
            }
            return false;
          });
          
          if (failures.length > 0) {
            console.error('❌ Failed to bulk delete from database:', failures);
            toast.error('Failed to remove some media from server');
            return; // Don't remove from UI if database deletion failed
          }
          
          console.log('✅ Bulk delete from database complete');
        } catch (error) {
          console.error('❌ Failed to bulk delete from database:', error);
          toast.error('Failed to remove media from server');
          return; // Don't remove from UI if database deletion failed
        }
      }
    }

    // Notify parent about each removed vault media item
    if (onMediaRemoved) {
      media.forEach(item => {
        if (selectedMediaIds.has(item.id)) {
          const wasFromVault = item.fromVault || false;
          // 🔥 CRITICAL FIX: Use vault_id for vault items to properly uncheck them
          const vaultId = item.vault_id || item.id; // Use vault_id if available, fallback to id
          console.log('🗑️ Bulk delete - removing media:', { id: item.id, wasFromVault, vaultId, hasVaultId: !!item.vault_id });
          onMediaRemoved(item.id, wasFromVault, vaultId);
        }
      });
    }

    setMedia(prev => prev.filter(m => !selectedMediaIds.has(m.id)));
    setSelectedMediaIds(new Set());
    setIsMultiSelectMode(false);
    toast.success(`Deleted ${selectedMediaIds.size} item${selectedMediaIds.size > 1 ? 's' : ''}`);
  };

  const handleEnhanceSelectedMedia = () => {
    if (selectedMediaIds.size === 0) {
      toast.error('No media selected');
      return;
    }

    const selectedMedia = media.filter(m => selectedMediaIds.has(m.id));
    
    // 🎬 Filter out documents AND videos - they cannot be enhanced
    const enhanceableMedia = selectedMedia.filter(m => 
      m.type === 'image' || m.type === 'audio'
    );
    
    const documentCount = selectedMedia.filter(m => m.type === 'document').length;
    const videoCount = selectedMedia.filter(m => m.type === 'video').length;
    
    if (enhanceableMedia.length === 0) {
      toast.error('No items can be enhanced', {
        description: 'Please select photos or audio files.'
      });
      return;
    }
    
    // Show warning if videos or documents were filtered out
    const excludedItems = [];
    if (documentCount > 0) excludedItems.push(`${documentCount} document${documentCount > 1 ? 's' : ''}`);
    if (videoCount > 0) excludedItems.push(`${videoCount} video${videoCount > 1 ? 's' : ''}`);
    
    if (excludedItems.length > 0) {
      toast.warning(`${excludedItems.join(' and ')} skipped`, {
        description: 'Only photos and audio files can be enhanced.'
      });
    }
    
    if (onEnhance && enhanceableMedia.length > 0) {
      // Pass ALL enhanceable media with their IDs for replacement tracking
      const mediaWithIds = enhanceableMedia.map(m => ({
        ...m,
        originalId: m.id, // Track original ID for replacement
        vaultId: m.vault_id || m.vaultId, // 🆕 Track vault ID if from vault
        fromVault: m.fromVault // 🆕 Track if from vault
      }));
      
      // If single media, pass as single object; if multiple, pass as array
      if (mediaWithIds.length === 1) {
        onEnhance(mediaWithIds[0]);
      } else {
        onEnhance(mediaWithIds); // Pass array for batch enhancement
      }
      
      setIsMultiSelectMode(false);
      setSelectedMediaIds(new Set());
    } else {
      toast.error('Enhancement not available');
    }
  };

  const removeMedia = async (id: string) => {
    // Find the media item before removing it
    const mediaItem = media.find(m => m.id === id);
    
    // 🔥 CRITICAL FIX: If editing a capsule and media is already uploaded, delete from database
    // This prevents hydration from re-adding the deleted media
    if (editingCapsule && mediaItem?.alreadyUploaded) {
      try {
        console.log('🗑️ Deleting media from database:', { capsuleId: editingCapsule.id, mediaId: id });
        await DatabaseService.deleteMediaFile(id);
        console.log('✅ Media deleted from database');
      } catch (error: any) {
        console.error('❌ Failed to delete media from database:', error);
        
        // 🔥 FIX: Only show error if it's NOT a "not found" error
        // Media might not be in DB yet if it was just uploaded via TUS
        if (!error?.message?.includes('Media file not found')) {
          toast.error('Failed to remove media from server');
          return; // Don't remove from UI if database deletion failed
        } else {
          console.log('ℹ️ Media not in database yet (probably just uploaded), safe to remove from UI');
        }
      }
    }
    
    setMedia(prev => prev.filter(m => m.id !== id));
    toast.success('Media removed');
    
    // Notify parent if this media came from vault
    if (onMediaRemoved && mediaItem) {
      const wasFromVault = mediaItem.fromVault || false;
      // 🔥 CRITICAL FIX: Use vault_id for vault items to properly uncheck them
      const vaultId = mediaItem.vault_id || mediaItem.id; // Use vault_id if available, fallback to id
      console.log('🗑️ Media removed:', { id, wasFromVault, vaultId, hasVaultId: !!mediaItem.vault_id });
      onMediaRemoved(id, wasFromVault, vaultId);
    }
  };

  // 🔥 Register removeMedia function with parent so vault can call it directly
  const mediaRef = useRef(media);
  useEffect(() => {
    mediaRef.current = media;
  }, [media]);
  
  useEffect(() => {
    if (onRegisterRemoveMedia) {
      const removeByVaultId = (vaultId: string) => {
        // Find media by vault_id or id using ref to avoid dependency
        const mediaItem = mediaRef.current.find(m => m.id === vaultId || m.vault_id === vaultId);
        if (mediaItem) {
          console.log('🗑️ [VAULT UNCHECK] Removing media via vault_id:', vaultId, 'mediaId:', mediaItem.id);
          removeMedia(mediaItem.id);
        }
      };
      onRegisterRemoveMedia(removeByVaultId);
    }
  }, [onRegisterRemoveMedia]);

  // Recipient management
  const addRecipient = () => {
    const newRecipient: Recipient = {
      id: `recipient-${Date.now()}`,
      type: 'email',
      value: '',
      name: ''
    };
    setRecipients([...recipients, newRecipient]);
  };

  // Detect mobile device for UI adjustments (buttons visibility)
  const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
  };
  const [isMobileForButtons] = useState(isMobileDevice());

  const updateRecipient = (id: string, field: keyof Recipient, value: string) => {
    setRecipients(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const removeRecipient = (id: string) => {
    setRecipients(prev => prev.filter(r => r.id !== id));
  };

  // AI Enhancement
  const handleAIEnhancement = async (prompt: string) => {
    if (!message.trim()) {
      toast.error('Please write a message first');
      return;
    }

    setIsAIEnhancing(true);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/ai/enhance-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          text: message,
          instruction: prompt
        })
      });

      if (!response.ok) throw new Error('AI enhancement failed');

      const data = await response.json();
      setMessage(data.enhanced || message);
      toast.success('Message enhanced with AI');
    } catch (error) {
      console.error('AI enhancement error:', error);
      toast.error('Failed to enhance message');
    } finally {
      setIsAIEnhancing(false);
    }
  };

  // Folder handling
  const handleFolderSelect = (folderId: string) => {
    setSelectedFolderId(folderId);
    setShowFolderSelector(false);
    toast.success('Folder selected');
  };

  const handleAttachFolder = (folderId: string) => {
    setAttachedFolderId(folderId);
    setShowAttachFolderDialog(false);
    toast.success('Entire folder will be attached to this capsule');
  };

  // Navigation
  const goToNextStep = () => {
    if (currentStep === 1) {
      // Step 1: Theme Selection (Always valid)
      setDirection(1);
      setCurrentStep(2);
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else if (currentStep === 2) {
      // Step 2: Content (Title, Message, Media)
      if (!title.trim()) {
        toast.error('Please add a title');
        return;
      }
      if (!message.trim() && media.length === 0 && !attachedFolderId) {
        toast.error('Please add a message, media, or attach a folder');
        return;
      }
      setDirection(1);
      setCurrentStep(3);
      
      // Scroll to top of the container
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep === 3) {
      setDirection(-1);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setDirection(-1);
      setCurrentStep(1);
    }
  };

  // Background save draft function (called when navigating away with media)
  const saveDraftInBackground = async () => {
    const activeCapsuleId = editingCapsule?.id || internalDraftId;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Failed to save draft - not signed in', { id: 'draft-save' });
        return;
      }

      // Upload media and save capsule
      const filesToUpload = media.filter(m => !m.alreadyUploaded);
      const alreadyUploadedFiles = media.filter(m => m.alreadyUploaded);
      
      console.log(`📸 [BACKGROUND] Upload summary: ${filesToUpload.length} new file(s) to upload, ${alreadyUploadedFiles.length} already uploaded`);
      
      const mediaResults = [];
      
      // Add already-uploaded files to results first
      for (const m of alreadyUploadedFiles) {
        mediaResults.push({ url: m.url, id: m.id });
      }
      
      // Upload new files sequentially
      for (let index = 0; index < filesToUpload.length; index++) {
        const m = filesToUpload[index];
        
        console.log(`📤 [BACKGROUND] Uploading file ${index + 1}/${filesToUpload.length}: ${m.file.name}`);
        
        // 🔥 MEMORY FIX: For large files (≥50MB), upload directly to storage to avoid Edge Function memory limits
        if (isLargeFile(m.file)) {
          const fileSizeMB = m.file.size / 1024 / 1024;
          console.log(`📦 [LARGE FILE] Uploading ${fileSizeMB.toFixed(2)}MB file directly to storage (bypassing server)`);
          
          // Show progress toast
          toast.loading(`Uploading ${m.file.name} (${fileSizeMB.toFixed(0)}MB) - this may take a few minutes...`, {
            id: `upload-${m.id}`,
            duration: Infinity // Keep showing until we update/dismiss it
          });
          
          try {
            // 🔥 TUS PROTOCOL: True chunked/resumable upload (no memory limits!)
            const result = await uploadWithTUS(
              m.file,
              session.user.id,
              activeCapsuleId || `draft_${Date.now()}`,
              session.access_token,
              {
                onProgress: (progress) => {
                  // Update toast with progress
                  if (progress < 100) {
                    toast.loading(`Uploading ${m.file.name}: ${progress}%`, { 
                      id: `upload-${m.id}`
                    });
                  }
                },
                onRetry: (attempt, maxAttempts) => {
                  console.log(`🔄 Retrying upload (${attempt}/${maxAttempts})...`);
                  toast.loading(`Retrying ${m.file.name} (attempt ${attempt + 1}/${maxAttempts + 1})...`, { 
                    id: `upload-${m.id}`
                  });
                },
                maxRetries: 2 // 2 retries = 3 total attempts
              }
            );
            
            mediaResults.push({ 
              url: result.publicUrl, 
              id: result.mediaId 
            });
            
            // 🔥 FIX: Update media item's ID so deletion works
            // The UI has a temp ID, but DB has the real mediaId
            setMedia(prev => prev.map(item => 
              item.id === m.id 
                ? { ...item, id: result.mediaId, alreadyUploaded: true, url: result.publicUrl }
                : item
            ));
            
            console.log(`✅ [LARGE FILE] Uploaded ${m.file.name} successfully (ID: ${result.mediaId})`);
            toast.success(`Uploaded ${m.file.name}`, { id: `upload-${m.id}` });
            
            // 🔥 MEMORY: Clear file reference to help garbage collection
            // @ts-ignore
            m.file = null;
          } catch (error: any) {
            console.error('❌ [LARGE FILE] Upload failed:', error);
            
            // Show specific error message for bucket size limit
            if (error.message?.includes('Storage Bucket Size Limit') || 
                error.message?.includes('Payload too large')) {
              toast.error(
                `Bucket size limit exceeded! File is ${(m.file.size / 1024 / 1024).toFixed(0)}MB. ` +
                `Please increase bucket limit in Supabase Dashboard.`,
                { 
                  id: `upload-${m.id}`,
                  duration: 10000 // Show for 10 seconds
                }
              );
            } else {
              toast.error(`Failed to upload ${m.file.name}: ${error.message}`, { id: `upload-${m.id}` });
            }
            
            throw new Error(`Failed to upload ${m.file.name}: ${error.message}`);
          }
        } else {
          // Small file - use existing server endpoint
          const formData = new FormData();
          formData.append('file', m.file);
          formData.append('capsuleId', activeCapsuleId || `draft_${Date.now()}`);
          formData.append('userId', session.user.id);

          const uploadResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/media/upload`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`
              },
              body: formData
            }
          );

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({}));
            throw new Error(errorData.error || 'Upload failed');
          }

          const uploadResult = await uploadResponse.json();
          mediaResults.push({ 
            url: uploadResult.publicUrl, 
            id: uploadResult.mediaFile?.id 
          });
        }
      }

      const mediaUrls = mediaResults.map(r => r.url);
      const mediaIds = mediaResults
        .map(r => r.id)
        .filter(id => id && !id.toString().startsWith('existing-') && !id.toString().startsWith('hydrated-') && !id.toString().startsWith('restored-') && !id.toString().startsWith('initial-'));

      // Calculate delivery date if set
      let deliveryIsoString = null;
      if (deliveryDate) {
        const [hour, minute] = deliveryTime.split(':').map(Number);
        const deliveryDateTime = convertToUTCForStorage(
          deliveryDate.getFullYear(),
          deliveryDate.getMonth(),
          deliveryDate.getDate(),
          hour,
          minute,
          timeZone
        );
        deliveryIsoString = deliveryDateTime.toISOString();
      }

      const hasAllRequiredFields = deliveryDate && deliveryTime && deliveryTime.trim() !== '' && recipientType;
      const statusToSave = hasAllRequiredFields ? 'scheduled' : 'draft';

      // Update/create capsule
      // 🔥 CRITICAL FIX: Only use PUT if we have a real DB ID (editingCapsule.id)
      // internalDraftId is client-side only, so we must use POST to create the record in DB
      const isUpdatingExisting = !!editingCapsule?.id;
      const endpoint = isUpdatingExisting
        ? `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/capsules/${editingCapsule.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/capsules`;

      const response = await fetch(endpoint, {
        method: isUpdatingExisting ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          text_message: message,
          metadata: { 
            ...themeMetadata, 
            theme: themeId
            // 🔥 REMOVED: vault_media_ids tracking - no longer needed
            // Vault media is now uploaded as independent MediaFiles, so we use the new MediaFile IDs
            // The capsule's media_files array contains all media (from vault or direct upload)
          },
          temp_capsule_id: internalDraftId, // 🔥 CRITICAL FIX: Pass temp_capsule_id to link uploaded media
          theme: themeId,
          media_urls: mediaUrls,
          media_files: mediaIds,
          delivery_date: deliveryIsoString,
          delivery_time: deliveryTime,
          time_zone: timeZone,
          recipient_type: recipientType,
          delivery_method: 'email',
          recipients: recipients,
          folder_id: selectedFolderId,
          attached_folder_id: attachedFolderId,
          status: statusToSave,
          updated_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save capsule');
      }

      const result = await response.json();
      const savedCapsuleId = result.id || editingCapsule?.id;

      // Success!
      console.log('✅ [BACKGROUND] Draft saved successfully');
      toast.success('Draft saved!', { id: 'draft-save' });
      
      // Invalidate dashboard cache
      if (session.user.id) {
        localStorage.setItem(`dashboard_invalidated_${session.user.id}`, Date.now().toString());
        DatabaseService.clearMediaCache();
        // 🚀 PERFORMANCE: Invalidate media cache for instant updates
        if (savedCapsuleId) {
          mediaCache.invalidate(savedCapsuleId);
        }
      }
      
      // Clear local storage draft
      clearDraft();

    } catch (error) {
      console.error('❌ [BACKGROUND] Failed to save draft:', error);
      toast.error('Failed to save draft', { id: 'draft-save' });
    }
  };

  // Manual save draft
  const handleSaveDraft = async () => {
    // ✅ CRITICAL FIX: Check if vault media is still converting (same as handleSubmit)
    const uploadingMedia = media.filter(m => m.uploading);
    if (uploadingMedia.length > 0) {
      console.log(`⏳ [DRAFT] Waiting for ${uploadingMedia.length} media file(s) to finish converting...`);
      toast.loading(`Finalizing ${uploadingMedia.length} media file(s)...`, { id: 'finalizing-media-draft' });
      
      // Auto-wait for conversion to complete (max 30 seconds)
      const maxWaitTime = 30000;
      const startTime = Date.now();
      const pollInterval = 300;
      
      while (media.some(m => m.uploading) && (Date.now() - startTime < maxWaitTime)) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        const elapsed = Date.now() - startTime;
        if (elapsed > 5000 && elapsed % 2000 < pollInterval) {
          const stillUploading = media.filter(m => m.uploading).length;
          toast.loading(`Still processing ${stillUploading} file(s)... ${Math.floor((maxWaitTime - elapsed) / 1000)}s remaining`, { id: 'finalizing-media-draft' });
        }
      }
      
      toast.dismiss('finalizing-media-draft');
      
      if (media.some(m => m.uploading)) {
        toast.error('Media conversion timed out', {
          description: 'Large media files are still processing. Please wait a moment and try again.',
          duration: 5000
        });
        return;
      }
      
      console.log('✅ [DRAFT] All media files ready - proceeding with draft save');
      toast.success('Media ready!', { duration: 1000 });
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 🚀 UX FIX: Navigate to Home immediately and process save in background
    // This prevents users from being stuck on the saving animation
    const hasMedia = media.length > 0;
    
    if (hasMedia) {
      // Navigate to Home immediately
      console.log('🚀 [DRAFT] Navigating to Home immediately - processing save in background');
      toast.loading('Saving draft in background...', { id: 'draft-save' });
      
      // Navigate to Home with last selected view preserved
      onNavigateToHome?.();
      
      // Continue save process in background (non-blocking)
      saveDraftInBackground();
      return;
    } else {
      // No media - can save quickly, show the normal overlay
      console.log('💾 [DRAFT] No media attached - using normal save flow');
    }
    
    // Determine the capsule ID to update (either editing existing or internal draft)
    const activeCapsuleId = editingCapsule?.id || internalDraftId;
    
    // If updating an existing capsule (from prop or internal state)
    if (activeCapsuleId) {
      console.log('💾 Saving changes to existing capsule in database:', activeCapsuleId);
      
      try {
        // Get user session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error('Please sign in to save changes');
          return;
        }
        
        // Show sealing overlay for draft mode
        setSealingMode('draft');
        setShowSealingOverlay(true);
        setIsSubmitting(true);

        // NOTE: Storage bucket is managed by the server on startup
        
        // ⚡ Performance: Filter already-uploaded files BEFORE upload loop
        // 🔥 DEFENSIVE FIX: Also exclude any media still in uploading state (safety net)
        const filesToUpload = media.filter(m => !m.alreadyUploaded && !m.uploading);
        const alreadyUploadedFiles = media.filter(m => m.alreadyUploaded);
        
        console.log(`📸 Upload summary: ${filesToUpload.length} new file(s) to upload, ${alreadyUploadedFiles.length} already uploaded`);
        
        // Upload media files to storage
        // CRITICAL FIX: Upload files SEQUENTIALLY instead of parallel to prevent race conditions
        // When multiple files write to capsule_media:CAPSULE_ID simultaneously, they can overwrite each other
        const mediaResults = [];
        
        // Add already-uploaded files to results first
        for (const m of alreadyUploadedFiles) {
          mediaResults.push({ url: m.url, id: m.id });
        }
        
        // Upload new files
        for (let index = 0; index < filesToUpload.length; index++) {
          const m = filesToUpload[index];
          
          // ⚡ Show upload progress
          const progressMessage = filesToUpload.length === 1 
            ? `Uploading ${m.file.name}...`
            : `Uploading ${index + 1}/${filesToUpload.length}: ${m.file.name}`;
          toast.loading(progressMessage, { id: 'upload-progress' });
          
          console.log(`📤 Uploading file ${index + 1}/${filesToUpload.length}: ${m.file.name} (${(m.file.size / 1024 / 1024).toFixed(2)} MB)`);
          
          // ✅ THUMBNAIL FIX: Retrieve thumbnail blob if available (for videos)
          let thumbnailFile: File | undefined = undefined;
          if (m.thumbnail && m.thumbnail.startsWith('blob:') && m.type === 'video') {
            try {
              console.log(`🖼️ Fetching thumbnail blob for ${m.file.name}...`);
              const thumbResponse = await fetch(m.thumbnail);
              const thumbBlob = await thumbResponse.blob();
              thumbnailFile = new File([thumbBlob], `thumb_${Date.now()}.jpg`, { type: 'image/jpeg' });
              console.log(`✅ Prepared thumbnail for upload (${thumbnailFile.size} bytes)`);
            } catch (e) {
              console.warn('⚠️ Failed to prepare thumbnail for upload:', e);
            }
          }

          // 🔥 MEMORY FIX: For large files (≥50MB), upload directly to storage to avoid Edge Function memory limits
          if (isLargeFile(m.file)) {
            const fileSizeMB = m.file.size / 1024 / 1024;
            console.log(`📦 [LARGE FILE] Uploading ${fileSizeMB.toFixed(2)}MB file directly to storage (bypassing server)`);
            
            try {
              const result = await uploadLargeFile(
                m.file,
                session.user.id,
                activeCapsuleId,
                session.access_token,
                {
                  onRetry: (attempt, maxAttempts) => {
                    const retryMessage = filesToUpload.length === 1 
                      ? `Retrying ${m.file.name}... (${attempt}/${maxAttempts})`
                      : `Retrying ${index + 1}/${filesToUpload.length}: ${m.file.name} (${attempt}/${maxAttempts})`;
                    toast.loading(retryMessage, { id: 'upload-progress' });
                  },
                  maxRetries: 3,
                  timeoutMs: 180000 // 3 minutes per attempt
                },
                thumbnailFile // ✅ Pass thumbnail
              );
              
              mediaResults.push({ 
                url: result.publicUrl, 
                id: result.mediaId 
              });
              
              console.log(`✅ [LARGE FILE] Uploaded ${m.file.name} successfully`);
            } catch (error: any) {
              console.error('❌ [LARGE FILE] Upload failed:', error);
              throw new Error(`Failed to upload ${m.file.name}: ${error.message}`);
            }
          } else {
            // Small file - use existing server endpoint
            const formData = new FormData();
            formData.append('file', m.file);
            formData.append('capsuleId', activeCapsuleId);
            formData.append('userId', session.user.id);
            
            // ✅ Append thumbnail if available
            if (thumbnailFile) {
              formData.append('thumbnail', thumbnailFile);
            }

            const uploadResponse = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/media/upload`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`
                },
                body: formData
              }
            );

            if (!uploadResponse.ok) {
              const errorData = await uploadResponse.json().catch(() => ({}));
              const errorMessage = errorData.error || errorData.details || `Upload failed with status ${uploadResponse.status}`;
              
              // Better error logging for debugging
              console.error('⚠️ ⚠️ Backend upload failed for:', m.file.name, 'Error:', errorMessage);
              if (errorMessage.toLowerCase().includes('memory')) {
                console.error('❌ [Supabase] Memory limit exceeded');
              }
              
              throw new Error(errorMessage);
            }

            const uploadResult = await uploadResponse.json();
            mediaResults.push({ 
              url: uploadResult.publicUrl, 
              id: uploadResult.mediaFile?.id 
            });
            
            console.log(`✅ Successfully uploaded file ${index + 1}/${filesToUpload.length}: ${m.file.name}`);
          }
        }
        
        // ⚡ Dismiss upload progress toast
        toast.dismiss('upload-progress');

        const mediaUrls = mediaResults.map(r => r.url);
        // Filter out fake IDs to prevent DB errors
        const mediaIds = mediaResults
          .map(r => r.id)
          .filter(id => id && !id.toString().startsWith('existing-') && !id.toString().startsWith('hydrated-') && !id.toString().startsWith('restored-') && !id.toString().startsWith('initial-'));

        // Calculate correct UTC delivery date if date is set
        let deliveryIsoString = null;
        if (deliveryDate) {
          const [hour, minute] = deliveryTime.split(':').map(Number);
          const deliveryDateTime = convertToUTCForStorage(
            deliveryDate.getFullYear(),
            deliveryDate.getMonth(),
            deliveryDate.getDate(),
            hour,
            minute,
            timeZone
          );
          deliveryIsoString = deliveryDateTime.toISOString();
        }

        // CRITICAL: Determine status based on whether all required fields are present
        // A capsule becomes "scheduled" when it has: date, time, AND recipient selected
        // Otherwise it remains a "draft"
        const hasAllRequiredFields = deliveryDate && deliveryTime && deliveryTime.trim() !== '' && recipientType;
        
        const currentStatus = editingCapsule?.status || 'draft';
        
        // If all required fields are present, upgrade to 'scheduled'
        // If any required field is missing, keep/revert to 'draft'
        const statusToSave = hasAllRequiredFields ? 'scheduled' : 'draft';
        
        console.log('📊 Status determination:', {
          hasDate: !!deliveryDate,
          hasTime: !!(deliveryTime && deliveryTime.trim()),
          hasRecipient: !!recipientType,
          hasAllRequiredFields,
          currentStatus,
          statusToSave
        });

        // Update via backend API
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/capsules/${activeCapsuleId}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              title,
              text_message: message,
              metadata: { 
                ...themeMetadata, 
                theme: themeId
                // 🔥 REMOVED: vault_media_ids tracking - vault media is now uploaded as independent MediaFiles
              },
              theme: themeId,
              media_urls: mediaUrls,
              media_files: mediaIds,
              delivery_date: deliveryIsoString,
              delivery_time: deliveryTime,
              time_zone: timeZone,
              recipient_type: recipientType,
              delivery_method: 'email',
              recipients: recipients,
              folder_id: selectedFolderId,
              attached_folder_id: attachedFolderId,
              status: statusToSave, // Ensure status is preserved or set to draft
              updated_at: new Date().toISOString()
            })
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update capsule');
        }

        // CRITICAL FIX: Update local media state with real IDs and URLs from upload
        // This prevents duplication when the capsule re-hydrates from DB because local items will now match DB items
        setMedia(prev => {
           return prev.map((item, index) => {
               if (mediaResults[index]) {
                   return {
                       ...item,
                       id: mediaResults[index].id || item.id,
                       url: mediaResults[index].url || item.url,
                       alreadyUploaded: true,
                       fromVault: false // It's now a native capsule file (persisted in capsule storage)
                   };
               }
               return item;
           });
        });

        // Trigger success state for overlay
        setSealingSuccess(true);
        
        // Invalidate dashboard cache
        if (session.user.id) {
           localStorage.setItem(`dashboard_invalidated_${session.user.id}`, Date.now().toString());
           DatabaseService.clearMediaCache();
           // 🚀 PERFORMANCE: Invalidate media cache for instant updates
           if (activeCapsuleId) {
             mediaCache.invalidate(activeCapsuleId);
           }
        }
        
        // Clear local storage draft since we have a cloud draft now
        clearDraft();
        
      } catch (error) {
        setShowSealingOverlay(false);
        setIsSubmitting(false);
        console.error('Failed to save capsule:', error);
        toast.dismiss();
        toast.error('Failed to save capsule');
      }
    } else {
      // For NEW capsules -> Create DB Draft
      console.log('💾 Creating NEW DB draft...');
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error('Please sign in to save a draft');
          return;
        }

        // OFFLINE: Fallback to local storage
        if (!isOnline) {
          saveDraft();
          toast.success('Draft saved (offline)');
          return;
        }
        
        // Show sealing overlay for draft mode
        setSealingMode('draft');
        setShowSealingOverlay(true);
        setIsSubmitting(true);
        
        // Generate a temporary ID for media upload association
        const tempCapsuleId = `draft_${Date.now()}`;
        
        // Upload media first
        console.log(`📸 Uploading ${media.length} media file(s) for new draft...`);
        // CRITICAL FIX: Upload files SEQUENTIALLY instead of parallel to prevent race conditions
        const mediaResults = [];
        for (let index = 0; index < media.length; index++) {
          const m = media[index];
          
          // Skip upload if media is already uploaded
          if (m.alreadyUploaded) {
            console.log(`⏭️ Skipping upload for already uploaded media: ${m.file?.name}`);
            mediaResults.push({ url: m.url, id: m.id });
            continue;
          }

          console.log(`📤 Uploading media ${index + 1}/${media.length}: ${m.file.name}`);
          
          // 🔥 MEMORY FIX: For large files (≥50MB), upload directly to storage to avoid Edge Function memory limits
          const fileSizeMB = m.file.size / 1024 / 1024;
          const isLargeFile = fileSizeMB >= 50;
          
          if (isLargeFile) {
            console.log(`📦 [LARGE FILE] Uploading ${fileSizeMB.toFixed(2)}MB file directly to storage (bypassing server)`);
            
            // Generate unique file path
            const fileExtension = m.file.name.split('.').pop() || 'bin';
            const sanitizedExtension = fileExtension.toLowerCase().replace(/[^a-z0-9]/g, '');
            const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${sanitizedExtension}`;
            const filePath = `${session.user.id}/${tempCapsuleId}/${fileName}`;
            
            // Upload directly to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('make-f9be53a7-media')
              .upload(filePath, m.file, {
                cacheControl: '3600',
                upsert: false
              });
            
            if (uploadError) {
              console.error('❌ [LARGE FILE] Direct upload failed:', uploadError);
              throw new Error(`Failed to upload ${m.file.name}: ${uploadError.message}`);
            }
            
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('make-f9be53a7-media')
              .getPublicUrl(filePath);
            
            // Create media metadata
            const mediaFile = {
              id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              capsule_id: tempCapsuleId,
              user_id: session.user.id,
              file_name: m.file.name,
              file_type: m.file.type,
              file_size: m.file.size,
              storage_path: filePath,
              storage_bucket: 'make-f9be53a7-media',
              created_at: new Date().toISOString()
            };
            
            // Store metadata via API
            const metadataResponse = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/media/metadata`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(mediaFile)
              }
            );
            
            if (!metadataResponse.ok) {
              console.error('❌ [LARGE FILE] Failed to store metadata');
              throw new Error('Failed to store media metadata');
            }
            
            mediaResults.push({ 
              url: publicUrl, 
              id: mediaFile.id 
            });
            
            console.log(`✅ [LARGE FILE] Uploaded ${m.file.name} directly to storage`);
          } else {
            // Small file - use existing server endpoint
            const formData = new FormData();
            formData.append('file', m.file);
            formData.append('capsuleId', tempCapsuleId);
            formData.append('userId', session.user.id);

            const uploadResponse = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/media/upload`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`
                },
                body: formData
              }
            );

            if (!uploadResponse.ok) {
              const errorData = await uploadResponse.json().catch(() => ({}));
              const errorMessage = errorData.error || errorData.details || `Upload failed with status ${uploadResponse.status}`;
              
              // Better error logging for debugging
              console.error('⚠️ ⚠️ Backend upload failed for:', m.file.name, 'Error:', errorMessage);
              if (errorMessage.toLowerCase().includes('memory')) {
                console.error('❌ [Supabase] Memory limit exceeded');
              }
              
              throw new Error(errorMessage);
            }

            const uploadResult = await uploadResponse.json();
            mediaResults.push({ 
              url: uploadResult.publicUrl, 
              id: uploadResult.mediaFile?.id 
            });
            
            console.log(`✅ Successfully uploaded ${index + 1}/${media.length}: ${m.file.name}`);
          }
        }
        
        const mediaUrls = mediaResults.map(r => r.url);
        // Filter out fake IDs to prevent DB errors
        const mediaIds = mediaResults
          .map(r => r.id)
          .filter(id => id && !id.toString().startsWith('existing-') && !id.toString().startsWith('hydrated-') && !id.toString().startsWith('restored-') && !id.toString().startsWith('initial-'));
        
        // Prepare delivery date
        let deliveryIsoString = null;
        if (deliveryDate) {
          const [hour, minute] = deliveryTime.split(':').map(Number);
          const deliveryDateTime = convertToUTCForStorage(
            deliveryDate.getFullYear(),
            deliveryDate.getMonth(),
            deliveryDate.getDate(),
            hour,
            minute,
            timeZone
          );
          deliveryIsoString = deliveryDateTime.toISOString();
        }
        
        // CRITICAL: Determine status based on whether all required fields are present
        const hasAllRequiredFields = deliveryDate && deliveryTime && deliveryTime.trim() !== '' && recipientType;
        const initialStatus = hasAllRequiredFields ? 'scheduled' : 'draft';
        
        console.log('📊 New draft status determination:', {
          hasDate: !!deliveryDate,
          hasTime: !!(deliveryTime && deliveryTime.trim()),
          hasRecipient: !!recipientType,
          hasAllRequiredFields,
          initialStatus
        });
        
        // Create Payload
        const capsulePayload = {
          user_id: session.user.id,
          title: title || 'Untitled Draft', // Ensure title exists
          text_message: message,
          metadata: { ...themeMetadata, theme: themeId },
          theme: themeId,
          media_urls: mediaUrls,
          media_files: mediaIds,
          delivery_date: deliveryIsoString, // Can be null for drafts
          delivery_time: deliveryTime,
          time_zone: timeZone,
          recipient_type: recipientType,
          delivery_method: 'email',
          recipients: recipientType === 'others' ? recipients : [],
          folder_id: selectedFolderId,
          attached_folder_id: attachedFolderId,
          status: initialStatus, // 'draft' or 'scheduled' based on fields
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/capsules`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(capsulePayload)
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create draft');
        }
        
        const result = await response.json();
        const newDraftId = result.capsule?.id || result.id;
        
        console.log('✅ Cloud draft created:', newDraftId);
        
        // Set internal draft ID so subsequent saves UPDATE this draft
        if (newDraftId) {
          setInternalDraftId(newDraftId);
        }

        // CRITICAL FIX: Update local media state with real IDs and URLs from upload
        // This prevents duplication when the capsule re-hydrates from DB because local items will now match DB items
        setMedia(prev => {
           return prev.map((item, index) => {
               if (mediaResults[index]) {
                   return {
                       ...item,
                       id: mediaResults[index].id || item.id,
                       url: mediaResults[index].url || item.url,
                       alreadyUploaded: true,
                       fromVault: false // It's now a native capsule file (persisted in capsule storage)
                   };
               }
               return item;
           });
        });

        // Trigger success state for overlay
        setSealingSuccess(true);
        
        // Clear local storage draft
        clearDraft();
        
        // Invalidate dashboard
        localStorage.setItem(`dashboard_invalidated_${session.user.id}`, Date.now().toString());
        
      } catch (error) {
        setShowSealingOverlay(false);
        setIsSubmitting(false);
        console.error('Failed to create cloud draft:', error);
        toast.dismiss();
        toast.error('Failed to save draft');
        // Fallback to local save
        saveDraft();
      }
    }
  };

  const handleClear = () => {
    setTitle('');
    setThemeId('standard');
    setMessage('');
    setDeliveryDate(undefined);
    setDeliveryTime('');
    setTimeZone(getUserTimeZone());
    setRecipientType(null);
    setRecipients([]);
    setMedia([]);
    setSelectedFolderId(null);
    setAttachedFolderId(null);
    setCurrentStep(1);
    clearDraft();
    
    // CRITICAL: Clear editing state to prevent loading loop when adding media
    if (onCancelEdit) {
      onCancelEdit(); // This will reset editingCapsule in parent
    }
    
    toast.success('Form cleared');
  };

  const handleSealingAnimationComplete = () => {
    // Final cleanup after animation
    clearDraft();
    
    // Different message based on mode
    if (sealingMode === 'draft') {
      toast.success('Draft saved!');
    } else {
      toast.success(editingCapsule ? 'Capsule updated!' : 'Capsule sealed for the future!');
    }

    // Reset form
    setTitle('');
    setThemeId('standard');
    setThemeMetadata({});
    setMessage('');
    setDeliveryDate(undefined);
    setDeliveryTime('');
    setTimeZone(getUserTimeZone());
    setRecipientType(null);
    setRecipients([]);
    setMedia([]);
    setSelectedFolderId(null);
    setAttachedFolderId(null);
    setCurrentStep(1);

    // Navigate - for drafts go to Home, otherwise use callback
    if (sealingMode === 'draft') {
      // Navigate to Home with last selected view preserved
      onNavigateToHome?.();
    } else {
      onCapsuleCreated?.();
    }
    
    // Reset overlay state
    setTimeout(() => {
      setShowSealingOverlay(false);
      setSealingSuccess(false);
      setSealingMode('seal');
      setIsSubmitting(false);
    }, 500);
  };

  // Form submission
  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      toast.error('Please add a title');
      setDirection(-1);
      setCurrentStep(1);
      return;
    }

    if (!message.trim() && media.length === 0 && !attachedFolderId) {
      toast.error('Please add a message, media, or attach a folder');
      setDirection(-1);
      setCurrentStep(1);
      return;
    }

    if (!deliveryDate) {
      toast.error('Please select a delivery date');
      return;
    }

    if (!deliveryTime || deliveryTime.trim() === '') {
      toast.error('Please select a delivery time');
      return;
    }

    if (isBefore(startOfDay(deliveryDate), startOfDay(new Date()))) {
      toast.error('Delivery date must be in the future');
      return;
    }

    if (!recipientType) {
      toast.error('Please select a recipient (Myself or Someone Else)');
      return;
    }

    if (recipientType === 'others' && recipients.length === 0) {
      toast.error('Please add at least one recipient');
      return;
    }

    // Validate recipients
    if (recipientType === 'others') {
      for (const recipient of recipients) {
        if (!recipient.value.trim()) {
          toast.error('Please fill in all recipient contact information');
          return;
        }
        if (recipient.type === 'email' && !recipient.value.includes('@')) {
          toast.error('Please enter a valid email address');
          return;
        }
      }
    }

    // ✅ CRITICAL FIX: Check if vault media is still converting
    const uploadingMedia = media.filter(m => m.uploading);
    if (uploadingMedia.length > 0) {
      console.log(`⏳ Waiting for ${uploadingMedia.length} media file(s) to finish converting...`);
      toast.loading(`Finalizing ${uploadingMedia.length} media file(s)...`, { id: 'finalizing-media' });
      
      // Auto-wait for conversion to complete (max 30 seconds)
      const maxWaitTime = 30000;
      const startTime = Date.now();
      const pollInterval = 300; // Check every 300ms for speed
      
      while (media.some(m => m.uploading) && (Date.now() - startTime < maxWaitTime)) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        // Update progress message every 2 seconds
        const elapsed = Date.now() - startTime;
        if (elapsed > 5000 && elapsed % 2000 < pollInterval) {
          const stillUploading = media.filter(m => m.uploading).length;
          toast.loading(`Still processing ${stillUploading} file(s)... ${Math.floor((maxWaitTime - elapsed) / 1000)}s remaining`, { id: 'finalizing-media' });
        }
      }
      
      toast.dismiss('finalizing-media');
      
      // Check if conversion completed
      if (media.some(m => m.uploading)) {
        toast.error('Media conversion timed out', {
          description: 'Large media files are still processing. Please wait a moment and try again.',
          duration: 5000
        });
        return;
      }
      
      console.log('✅ All media files ready - proceeding with capsule seal');
      toast.success('Media ready!', { duration: 1000 });
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause for user feedback
    }

    setIsSubmitting(true);
    
    // Only show sealing animation if online
    if (isOnline) {
      setSealingMode('seal');
      setShowSealingOverlay(true);
    }

    try {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to create a capsule');
        return;
      }

      // OFFLINE HANDLER - Queue for sync
      if (!isOnline) {
        console.log('🔌 Offline mode detected, queuing capsule creation...');
        
        // Convert delivery date/time to UTC for storage
        const [hour, minute] = deliveryTime.split(':').map(Number);
        const deliveryDateTime = convertToUTCForStorage(
          deliveryDate.getFullYear(),
          deliveryDate.getMonth(),
          deliveryDate.getDate(),
          hour,
          minute,
          timeZone
        );

        // Create capsule data with theme metadata
        const capsuleData = {
          user_id: session.user.id,
          title,
          text_message: message,
          metadata: { theme: themeId, ...themeMetadata },
          media_urls: [], // Will be filled on sync
          pendingMedia: media.map(m => m.file), // Store files for upload
          delivery_date: deliveryDateTime.toISOString(),
          delivery_time: deliveryTime,
          time_zone: timeZone,
          recipient_type: recipientType,
          delivery_method: 'email',
          recipients: recipientType === 'others' ? recipients : [],
          status: 'scheduled',
          folder_id: selectedFolderId,
          attached_folder_id: attachedFolderId
        };

        await queueOfflineAction('CREATE_CAPSULE', offlineCapsuleData);
        
        // Track action locally (optimistic)
        if (session?.access_token) {
          trackAction('capsule_created', {}, session.access_token);
        }

        // Clear draft
        clearDraft();

        toast.success('Saved offline', {
          description: 'Your capsule will be uploaded automatically when you are back online.',
          duration: 5000,
          icon: <Save className="h-5 w-5 text-green-500" />
        });

        // Reset form
        setTitle('');
        setMessage('');
        setDeliveryDate(undefined);
        setDeliveryTime('');
        setTimeZone(getUserTimeZone());
        setRecipientType(null);
        setRecipients([]);
        setMedia([]);
        setSelectedFolderId(null);
        setAttachedFolderId(null);
        setCurrentStep(1);

        setIsSubmitting(false);
        
        // Navigate back after delay
        setTimeout(() => {
          onCapsuleCreated?.();
        }, 1000);
        
        return;
      }

      console.log('📤 Starting capsule creation with media upload...');
      
      // NOTE: Storage bucket is managed by the server on startup
      const STORAGE_BUCKET = 'make-f9be53a7-media';
      
      // Determine if we're editing an existing capsule (from prop or internal draft)
      const existingCapsuleId = editingCapsule?.id || internalDraftId || null;
      
      // ✅ Use stable temp ID for new capsules to link media
      // This ensures all uploaded media (including vault copies) is linked to the same temporary ID
      const tempCapsuleId = existingCapsuleId || stableTempCapsuleId.current || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // ⚡ Performance: Filter already-uploaded files BEFORE upload loop
      // 🔥 DEFENSIVE FIX: Also exclude any media still in uploading state (shouldn't happen after auto-wait, but safety net)
      const filesToUpload = media.filter(m => !m.alreadyUploaded && !m.uploading);
      const alreadyUploadedFiles = media.filter(m => m.alreadyUploaded);
      
      console.log(`📸 Upload summary: ${filesToUpload.length} new file(s) to upload, ${alreadyUploadedFiles.length} already uploaded`);
      
      // DIAGNOSTIC: Log each media item being uploaded
      filesToUpload.forEach((m, idx) => {
        console.log(`📋 File to upload ${idx + 1}/${filesToUpload.length}:`, {
          name: m.file.name,
          type: m.type,
          mimeType: m.mimeType,
          size: (m.file.size / 1024 / 1024).toFixed(2) + ' MB'
        });
      });
      
      // CRITICAL FIX: Upload files SEQUENTIALLY instead of parallel to prevent race conditions
      const mediaUrls = [];
      
      // Add already-uploaded files to results first
      for (const m of alreadyUploadedFiles) {
        mediaUrls.push(m.url);
      }
      
      // Upload new files
      for (let index = 0; index < filesToUpload.length; index++) {
        const m = filesToUpload[index];
        
        // ⚡ Show upload progress
        const progressMessage = filesToUpload.length === 1 
          ? `Uploading ${m.file.name}...`
          : `Uploading ${index + 1}/${filesToUpload.length}: ${m.file.name}`;
        toast.loading(progressMessage, { id: 'upload-progress' });
        
        console.log(`📤 Uploading file ${index + 1}/${filesToUpload.length}: ${m.file.name} (${(m.file.size / 1024 / 1024).toFixed(2)} MB)`);
        
        // Upload via server endpoint to bypass RLS issues
        // Retry logic for transient network errors
        let retries = 2;
        let lastError: any = null;
        let uploadedUrl: string | null = null;
        
        for (let attempt = 0; attempt <= retries; attempt++) {
          try {
            if (attempt > 0) {
              console.log(`🔄 Retry attempt ${attempt}/${retries} for ${m.file.name}...`);
              // Wait before retry (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
            
            // 🔥 MEMORY FIX: For large files (≥50MB), upload directly to storage to avoid Edge Function memory limits
            const fileSizeMB = m.file.size / 1024 / 1024;
            const isLargeFile = fileSizeMB >= 50;
            
            if (isLargeFile) {
              console.log(`📦 [LARGE FILE] Uploading ${fileSizeMB.toFixed(2)}MB file directly to storage (bypassing server)`);
              
              // Generate unique file path
              const fileExtension = m.file.name.split('.').pop() || 'bin';
              const sanitizedExtension = fileExtension.toLowerCase().replace(/[^a-z0-9]/g, '');
              const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${sanitizedExtension}`;
              const filePath = `${session.user.id}/${tempCapsuleId}/${fileName}`;
              
              // Upload directly to Supabase Storage
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('make-f9be53a7-media')
                .upload(filePath, m.file, {
                  cacheControl: '3600',
                  upsert: false
                });
              
              if (uploadError) {
                console.error('❌ [LARGE FILE] Direct upload failed:', uploadError);
                lastError = new Error(`Failed to upload ${m.file.name}: ${uploadError.message}`);
                continue; // Retry
              }
              
              // Get public URL
              const { data: { publicUrl } } = supabase.storage
                .from('make-f9be53a7-media')
                .getPublicUrl(filePath);
              
              // ✅ THUMBNAIL FIX: Upload thumbnail for large files
              let thumbnailPath = null;
              if (m.thumbnail) {
                try {
                  const thumbnailBlob = await fetch(m.thumbnail).then(r => r.blob());
                  const thumbnailFileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_thumb.jpg`;
                  thumbnailPath = `${session.user.id}/${tempCapsuleId}/${thumbnailFileName}`;
                  
                  const { error: thumbError } = await supabase.storage
                    .from('make-f9be53a7-media')
                    .upload(thumbnailPath, thumbnailBlob, {
                      cacheControl: '3600',
                      upsert: false
                    });
                  
                  if (thumbError) {
                    console.warn(`⚠️ [LARGE FILE] Thumbnail upload failed (non-critical):`, thumbError);
                    thumbnailPath = null;
                  } else {
                    console.log(`✅ [LARGE FILE] Uploaded thumbnail: ${thumbnailPath}`);
                  }
                } catch (err) {
                  console.warn(`⚠️ [LARGE FILE] Failed to process thumbnail:`, err);
                }
              }
              
              // Create media metadata
              const mediaFile = {
                id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                capsule_id: tempCapsuleId,
                user_id: session.user.id,
                file_name: m.file.name,
                file_type: m.file.type,
                file_size: m.file.size,
                storage_path: filePath,
                storage_bucket: 'make-f9be53a7-media',
                thumbnail_path: thumbnailPath, // ✅ Store thumbnail path
                created_at: new Date().toISOString()
              };
              
              // Store metadata via API
              const metadataResponse = await fetch(
                `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/media/metadata`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(mediaFile)
                }
              );
              
              if (!metadataResponse.ok) {
                console.error('❌ [LARGE FILE] Failed to store metadata');
                lastError = new Error('Failed to store media metadata');
                continue; // Retry
              }
              
              uploadedUrl = publicUrl;
              console.log(`✅ [LARGE FILE] Uploaded ${m.file.name} directly to storage`);
              break; // Success!
            } else {
              // Small file - use existing server endpoint
              const formData = new FormData();
              formData.append('file', m.file);
              formData.append('capsuleId', tempCapsuleId);
              formData.append('userId', session.user.id);
              
              // ✅ THUMBNAIL FIX: Upload thumbnail if available
              if (m.thumbnail) {
                try {
                  // Convert data URL to Blob
                  const thumbnailBlob = await fetch(m.thumbnail).then(r => r.blob());
                  formData.append('thumbnail', thumbnailBlob, `${m.file.name}_thumb.jpg`);
                  console.log(`✅ Including thumbnail for ${m.file.name}`);
                } catch (err) {
                  console.warn(`⚠️ Failed to convert thumbnail for ${m.file.name}:`, err);
                }
              }

              const uploadResponse = await fetch(
                `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/media/upload`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${session.access_token}`
                  },
                  body: formData
                }
              );

              if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json().catch(() => ({}));
                console.error(`❌ Upload failed with status ${uploadResponse.status}:`, errorData);
                console.error(`❌ Failed file details:`, {
                  fileName: m.file.name,
                  fileType: m.file.type,
                  mimeType: m.mimeType,
                  mediaType: m.type,
                  size: m.file.size
                });
                const errorMsg = errorData.details || errorData.error || `Upload failed with status ${uploadResponse.status}`;
                
                // Better error logging for debugging
                console.error('⚠️ ⚠️ Backend upload failed for:', m.file.name, 'Error:', errorMsg);
                if (errorMsg.toLowerCase().includes('memory')) {
                  console.error('❌ [Supabase] Memory limit exceeded');
                }
                
                // Don't retry for client errors (4xx) except for 408 (timeout) and 429 (rate limit)
                if (uploadResponse.status >= 400 && uploadResponse.status < 500 && 
                    uploadResponse.status !== 408 && uploadResponse.status !== 429) {
                  throw new Error(errorMsg);
                }
                
                lastError = new Error(errorMsg);
                continue; // Retry
              }

              const uploadResult = await uploadResponse.json();
              console.log(`✅ File ${index + 1}/${filesToUpload.length} uploaded successfully:`, {
                fileName: m.file.name,
                fileType: m.file.type,
                mimeType: m.mimeType,
                mediaType: m.type,
                url: uploadResult.publicUrl
              });
              uploadedUrl = uploadResult.publicUrl;
              break; // Success, exit retry loop
            }
            
          } catch (uploadError: any) {
            lastError = uploadError;
            console.error(`❌ Upload attempt ${attempt + 1} failed:`, {
              file: m.file.name,
              error: uploadError.message,
              type: uploadError.name
            });
            
            // Don't retry on non-network errors
            if (!uploadError.message.includes('fetch') && 
                !uploadError.message.includes('network') &&
                !uploadError.message.includes('timeout') &&
                attempt < retries) {
              // This is likely a server error, break and throw
              break;
            }
          }
        }
        
        // Check if upload succeeded
        if (!uploadedUrl) {
          console.error(`❌ All upload attempts failed for ${m.file.name}:`, lastError);
          throw new Error(`Failed to upload ${m.file.name}: ${lastError?.message || 'Unknown error'}`);
        }
        
        mediaUrls.push(uploadedUrl);
      }
      
      // ⚡ Dismiss upload progress toast
      toast.dismiss('upload-progress');
      
      console.log(`✅ All ${mediaUrls.length} media files uploaded successfully`);
      console.log(`📊 DIAGNOSTIC - Upload summary:`, {
        totalMediaItems: media.length,
        totalUrlsReturned: mediaUrls.length,
        urls: mediaUrls,
        mediaTypes: media.map(m => ({ name: m.file.name, type: m.type, mimeType: m.mimeType }))
      });
      
      // CRITICAL DIAGNOSTIC: Verify all media types were uploaded
      if (mediaUrls.length !== media.length) {
        console.error(`❌❌❌ CRITICAL: Media count mismatch!`, {
          expected: media.length,
          actual: mediaUrls.length,
          missing: media.length - mediaUrls.length,
          mediaList: media.map((m, idx) => ({
            index: idx,
            name: m.file.name,
            type: m.type,
            mimeType: m.mimeType,
            size: (m.file.size / 1024 / 1024).toFixed(2) + ' MB',
            hasUrl: mediaUrls[idx] ? 'YES' : 'NO'
          }))
        });
      }

      // Convert delivery date/time to UTC for storage
      const [hour, minute] = deliveryTime.split(':').map(Number);
      
      console.log('💾 Converting to UTC for storage:', {
        deliveryDateComponents: {
          year: deliveryDate.getFullYear(),
          month: deliveryDate.getMonth() + 1,
          day: deliveryDate.getDate(),
          hour,
          minute
        },
        timezone: timeZone,
        deliveryDateString: deliveryDate.toString()
      });
      
      const deliveryDateTime = convertToUTCForStorage(
        deliveryDate.getFullYear(),
        deliveryDate.getMonth(),
        deliveryDate.getDate(),
        hour,
        minute,
        timeZone
      );
      
      console.log('✅ Converted to UTC:', {
        utcISO: deliveryDateTime.toISOString(),
        originalTime: `${hour}:${minute}`,
        timezone: timeZone
      });

        // Create capsule data object (shared for both create and update to ensure consistency)
        // 🏆 ACHIEVEMENT TRACKING: Calculate metadata for achievements
        const wordCount = message?.split(/\s+/).filter(w => w.length > 0).length || 0;
        const userLocalHour = new Date().getHours(); // 0-23 for time-based achievements
        const deliveryTimeISO = deliveryDateTime.toISOString(); // For Double Feature achievement
        
        const capsulePayload = {
          title,
          text_message: message,
          // CRITICAL: Ensure theme is preserved by putting it LAST in the metadata object
          // this prevents it from being overwritten by any stale data in themeMetadata
          metadata: { 
            ...themeMetadata, 
            theme: themeId,
            // 🏆 Achievement metadata
            wordCount: wordCount,
            userLocalHour: userLocalHour,
            deliveryTime: deliveryTimeISO
            // 🔥 REMOVED: vault_media_ids tracking - vault media is now uploaded as independent MediaFiles
          },
          theme: themeId, // Redundant backup at root level for safer retrieval
          media_urls: mediaUrls,
          delivery_date: deliveryDateTime.toISOString(),
          delivery_time: deliveryTime,
          time_zone: timeZone,
          recipient_type: recipientType,
          delivery_method: 'email',
          recipients: recipientType === 'others' ? recipients : [],
          folder_id: selectedFolderId,
          attached_folder_id: attachedFolderId,
          updated_at: new Date().toISOString()
        };

        // For creation, add user_id and status
        const createPayload = {
          ...capsulePayload,
          user_id: session.user.id,
          status: 'scheduled',
          temp_capsule_id: tempCapsuleId // Pass this to backend to link media
        };

        console.log('📦 Submitting capsule data:', {
          isUpdate: !!existingCapsuleId,
          id: existingCapsuleId,
          theme: themeId,
          metadata: capsulePayload.metadata
        });

      if (existingCapsuleId) {
        // Update existing capsule via backend API
        // 🔥 CRITICAL FIX: Include status when updating - if all fields present, it should be 'scheduled'
        const updatePayload = {
          ...capsulePayload,
          status: 'scheduled' // All required fields are present (validated above), so status is 'scheduled'
        };
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/capsules/${existingCapsuleId}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatePayload)
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Capsule update failed:', errorData);
          throw new Error(errorData.error || errorData.details || 'Failed to update capsule');
        }
        
        console.log('✅ Capsule updated successfully');
        
        // Clear media cache to ensure updates show immediately
        DatabaseService.clearMediaCache();
        // 🚀 PERFORMANCE: Invalidate media cache for instant updates
        mediaCache.invalidate(existingCapsuleId);
      } else {
        // Create new capsule via backend API
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/capsules`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(createPayload)
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Capsule creation failed:', errorData);
          throw new Error(errorData.error || errorData.details || 'Failed to create capsule');
        }
        
        const result = await response.json();
        console.log('✅ Capsule created successfully:', result);
      }

      // Track achievements
      if (!editingCapsule && session?.access_token) {
        trackAction('capsule_created', {}, session.access_token);
        if (media.length > 0) {
          trackAction('media_attached', {}, session.access_token);
        }
        if (recipientType === 'others') {
          trackAction('capsule_shared', {}, session.access_token);
        }

        // Check for milestone
        try {
          // Fetch total capsule count
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession) {
            const response = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/capsules/count`,
              {
                headers: {
                  'Authorization': `Bearer ${currentSession.access_token}`
                }
              }
            );
            
            if (response.ok) {
              const { count, photoCount, videoCount, audioCount } = await response.json();
              
              // Check if this is a milestone (1, 10, 25, 50, 100+)
              if ([1, 10, 25, 50, 100].includes(count) || (count > 100 && count % 100 === 0)) {
                // Trigger confetti immediately
                confetti({
                  particleCount: 200,
                  spread: 100,
                  origin: { y: 0.5 }
                });
                
                // Set milestone data
                setMilestoneData({
                  capsuleCount: count,
                  photoCount: photoCount || 0,
                  videoCount: videoCount || 0,
                  audioCount: audioCount || 0,
                  textCount: count // All capsules have text
                });
                
                // Show milestone modal after confetti (delay 2 seconds)
                setTimeout(() => {
                  setShowMilestoneModal(true);
                }, 2000);
              }
            }
          }
        } catch (error) {
          console.error('Failed to check milestone:', error);
          // Don't block capsule creation if milestone check fails
        }
      }

      // Clear draft
      // clearDraft(); // Moved to animation complete

      // Show confetti celebration
      // confetti({ ... }); // Disabled in favor of sealing animation

      // Trigger success state for overlay
      if (isOnline) {
        setSealingSuccess(true);
      } else {
        // Fallback for offline (original flow)
        clearDraft();
        toast.success(editingCapsule ? 'Capsule updated!' : 'Capsule created!');
        handleClear();
        setTimeout(() => {
          onCapsuleCreated?.();
        }, 1000);
      }

      /* Original cleanup code moved to handleSealingAnimationComplete */
    } catch (error) {
      setShowSealingOverlay(false);
      console.error('❌ Capsule creation error:', error);
      console.error('❌ Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'N/A');
      
      // ⚡ Dismiss upload progress toast on error
      toast.dismiss('upload-progress');
      
      // Provide detailed error message to user
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // More specific error handling
      if (errorMessage.includes('Storage service is not properly configured')) {
        toast.error('Storage service unavailable', {
          description: 'The media storage service is temporarily unavailable. Please try again later or contact support.',
          duration: 7000
        });
      } else if (errorMessage.includes('Storage bucket permissions error') || errorMessage.includes('RLS')) {
        toast.error('Storage permissions issue', {
          description: 'There is a configuration issue with the storage service. Please contact support.',
          duration: 7000
        });
      } else if (errorMessage.includes('timed out') || errorMessage.includes('timeout')) {
        toast.error('Upload timeout', {
          description: 'The upload took too long. Try with a smaller file or check your internet connection.',
          duration: 7000
        });
      } else if (errorMessage.includes('Network') || errorMessage.includes('Failed to fetch')) {
        toast.error('Network error', {
          description: 'Unable to connect to the server. Please check your internet connection and try again.',
          duration: 7000
        });
      } else if (errorMessage.includes('Storage') || errorMessage.includes('upload')) {
        toast.error('Media upload failed', {
          description: errorMessage.length > 100 ? 'An error occurred during upload. Please try again.' : errorMessage,
          duration: 7000
        });
      } else if (errorMessage.includes('sign in')) {
        toast.error('Authentication required', {
          description: 'Please sign in and try again.',
          duration: 5000
        });
      } else {
        toast.error('Failed to create capsule', {
          description: errorMessage,
          duration: 7000
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentTheme = getThemeConfig(themeId);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 relative overflow-hidden">
        {/* Optimized Static Background Stars - No animation for performance */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(2px 2px at 20% 30%, white, transparent), radial-gradient(2px 2px at 60% 70%, white, transparent), radial-gradient(1px 1px at 50% 50%, white, transparent), radial-gradient(1px 1px at 80% 10%, white, transparent), radial-gradient(2px 2px at 90% 60%, white, transparent), radial-gradient(1px 1px at 10% 20%, #a855f7, transparent), radial-gradient(1px 1px at 40% 80%, #3b82f6, transparent), radial-gradient(1px 1px at 70% 40%, #10b981, transparent), radial-gradient(2px 2px at 30% 60%, #ec4899, transparent), radial-gradient(2px 2px at 65% 25%, #f59e0b, transparent)',
              backgroundSize: '200px 200px',
              willChange: 'auto'
            }}
          />
        </div>

        {/* Main Container - Optimized for smooth scrolling */}
        <div ref={containerRef} className="relative z-10 max-w-5xl mx-auto px-4 py-8" style={{ willChange: 'auto', transform: 'translateZ(0)' }}>
          {/* Header */}
          <div className="relative mb-8">
            <div className={`backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl ${isMobile ? 'bg-slate-800' : 'bg-gradient-to-r from-purple-900/40 via-blue-900/40 to-purple-900/40'}`} style={{ willChange: 'auto' }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {editingCapsule ? 'Edit Time Capsule' : 'Create Time Capsule'}
                  </h1>
                  <p className="text-white/70">
                    {currentStep === 1 ? 'Choose the visual theme for your capsule' : 
                     currentStep === 2 ? 'Compose your message to the future' : 
                     'Schedule delivery to your future self'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="relative w-12 h-12 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all border border-white/20">
                          <MoreVertical className="h-5 w-5 text-white" />
                          
                          {/* Badge indicator when draft exists or was saved */}
                          {(lastSaved || draftExists) && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-purple-700 flex items-center justify-center z-10">
                              <span className="text-white text-[10px] font-bold leading-none">{draftExists ? '!' : '✓'}</span>
                            </div>
                          )}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-700 z-[9999]" sideOffset={8}>
                        <DropdownMenuItem onClick={handleSaveDraft} className="text-white focus:bg-slate-800 focus:text-white cursor-pointer">
                          <Save className="h-4 w-4 mr-2" />
                          Save Draft
                          {lastSaved && <span className="ml-auto text-xs text-green-600">✓</span>}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-700" />
                        <DropdownMenuItem onClick={handleClear} className="text-red-400 focus:bg-red-900/30 focus:text-red-400 cursor-pointer">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear All
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  
                  {editingCapsule && onCancelEdit && (
                    <Button variant="ghost" className="text-white hover:bg-white/20" onClick={onCancelEdit}>
                      <X className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="space-y-4 pt-2 px-2">
                <div className="relative">
                  {/* Background Track */}
                  <div className="absolute top-2 left-0 w-full h-1 bg-white/10 -translate-y-1/2 rounded-full" />
                  
                  {/* Progress Fill */}
                  <motion.div 
                    className="absolute top-2 left-0 h-1 bg-gradient-to-r from-purple-500 to-blue-500 -translate-y-1/2 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${((currentStep - 1) / 2) * 100}%` }} 
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  />
                  
                  {/* Steps */}
                  <div className="flex justify-between relative z-10">
                     {[
                       { step: 1, label: 'Theme' }, 
                       { step: 2, label: 'Content' }, 
                       { step: 3, label: 'Delivery' }
                     ].map((item) => {
                       const isActive = currentStep >= item.step;
                       const isCurrent = currentStep === item.step;
                       
                       return (
                         <div key={item.step} className="flex flex-col items-center gap-2">
                            <motion.div 
                              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${
                                isActive 
                                  ? 'bg-purple-500 border-purple-500' 
                                  : 'bg-slate-900 border-white/20'
                              }`}
                              animate={{ 
                                scale: isCurrent ? 1.2 : 1,
                                backgroundColor: isActive ? '#a855f7' : '#0f172a',
                                borderColor: isActive ? '#a855f7' : 'rgba(255,255,255,0.2)'
                              }}
                            >
                              {isActive && (
                                <motion.div 
                                  initial={{ scale: 0 }} 
                                  animate={{ scale: 1 }}
                                  className="w-1.5 h-1.5 bg-white rounded-full" 
                                />
                              )}
                            </motion.div>
                            <span className={`text-xs font-medium transition-colors duration-300 ${
                              isActive ? 'text-white' : 'text-white/40'
                            }`}>
                              {item.label}
                            </span>
                         </div>
                       );
                     })}
                  </div>
                </div>
                
                {/* Draft status indicator */}
                {lastSaved && (
                  <div className="flex items-center justify-center gap-2 text-[10px] text-white/50">
                    <Save className="h-3 w-3" />
                    <span>Draft saved {formatTimeAgo(lastSaved)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Cosmic glow effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 via-transparent to-blue-500/20 pointer-events-none rounded-2xl" />
          </div>

          {/* Steps Container with Animation */}
          <div className="relative overflow-hidden" style={{ minHeight: '600px', willChange: 'auto', transform: 'translateZ(0)' }}>
            <AnimatePresence initial={false} custom={direction} mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: 'spring', stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                  className="space-y-6"
                >
                  <Card className={`border-2 shadow-2xl ${isMobile ? 'border-purple-700 bg-purple-950' : 'border-purple-500/30 bg-white/5 backdrop-blur-md'}`} style={{ willChange: 'auto' }}>
                    <CardHeader className={`border-b ${isMobile ? 'bg-purple-900 border-purple-700' : 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-500/30'}`}>
                      <CardTitle className="flex items-center gap-3 text-white">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg">
                          <Palette className="h-5 w-5 text-white" />
                        </div>
                        Choose a Theme
                      </CardTitle>
                      <p className="text-sm text-white/70 mt-2">
                        Select a visual style and unboxing experience for your recipient
                      </p>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <ThemeSelector 
                        selectedThemeId={themeId}
                        onSelectTheme={(id) => {
                          setThemeId(id);
                          // Show success toast
                          const themeName = getThemeConfig(id).name;
                          toast.success(`${themeName} theme selected! ✨`);
                          
                          // Auto-advance to next step after brief delay for visual feedback
                          setTimeout(() => {
                            goToNextStep();
                          }, 400);
                        }}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: 'spring', stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                  className="space-y-6"
                >
                  {/* Quick Start Templates - Only for Standard Theme */}
                  {themeId === 'standard' && (
                    <Card className={`border-2 shadow-2xl ${isMobile ? 'border-purple-700 bg-purple-950' : 'border-purple-500/30 bg-white/5 backdrop-blur-md'}`} style={{ willChange: 'auto' }}>
                      <CardHeader className={`border-b ${isMobile ? 'bg-purple-900 border-purple-700' : 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-purple-500/30'}`}>
                        <CardTitle className="flex items-center gap-3 text-white">
                          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg">
                            <Sparkles className="h-5 w-5 text-white" />
                          </div>
                          Quick Start Templates
                        </CardTitle>
                        <p className="text-sm text-white/70 mt-2">
                          Choose a template to begin your time capsule journey
                        </p>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <QuickStartCarousel onSelectTemplate={applyTemplate} />
                      </CardContent>
                    </Card>
                  )}

                  {/* Message Card */}
                  <Card 
                    className={`border-2 shadow-2xl ${isMobile ? 'border-blue-700 bg-blue-950' : 'border-blue-500/30 bg-white/5 backdrop-blur-md'}`} 
                    style={{ 
                      willChange: 'auto',
                      // Apply theme glow if not standard
                      borderColor: themeId !== 'standard' ? currentTheme.primaryColor : undefined,
                      boxShadow: themeId !== 'standard' ? `0 0 20px ${currentTheme.primaryColor}20` : undefined
                    }}
                  >
                    <CardHeader 
                      className={`border-b ${isMobile ? 'bg-blue-900 border-blue-700' : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30'}`}
                      style={{
                        background: themeId !== 'standard' ? currentTheme.bgGradient : undefined,
                        opacity: themeId !== 'standard' ? 0.9 : 1
                      }}
                    >
                      <CardTitle className="flex items-center gap-3 text-white">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg"
                             style={{ background: themeId !== 'standard' ? 'rgba(255,255,255,0.2)' : undefined }}>
                          <currentTheme.icon className="h-5 w-5 text-white" />
                        </div>
                        Your Message ({currentTheme.name} Theme)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                      {/* Title */}
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-base text-white/90">Title</Label>
                        <Input
                          id="title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Give your capsule a memorable title..."
                          className="h-12 text-base bg-white/10 border-white/20 text-white placeholder:text-white/40"
                        />
                      </div>

                      {/* Theme Specific Inputs */}
                      <ThemeSpecificInputs 
                        themeId={themeId}
                        metadata={themeMetadata}
                        onChange={setThemeMetadata}
                      />

                      {/* Message */}
                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-lg font-semibold text-white/90">Your Message</Label>
                        <Textarea
                          id="message"
                          ref={messageTextareaRef}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Write your message to the future..."
                          className="text-base md:text-sm p-5 leading-relaxed !text-left bg-white/10 border-white/20 text-white placeholder:text-white/40"
                          style={{ 
                            minHeight: window.innerWidth < 768 ? '240px' : '140px',
                            height: window.innerWidth < 768 ? '240px' : '140px',
                            textAlign: 'left',
                            WebkitTextAlign: 'left',
                            direction: 'ltr',
                            display: 'block',
                            justifyContent: 'flex-start',
                            alignItems: 'flex-start'
                          }}
                        />
                        
                        {/* AI Enhancement */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                          {AI_SUGGESTIONS.map((suggestion, idx) => (
                            <Button
                              key={idx}
                              size="sm"
                              variant="outline"
                              disabled={isAIEnhancing || !message.trim()}
                              onClick={() => handleAIEnhancement(suggestion.prompt)}
                              className="text-xs h-9 w-full justify-center bg-white/5 border-white/20 text-white/90 hover:bg-white/10"
                            >
                              {isAIEnhancing ? (
                                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                              ) : (
                                <suggestion.icon className="h-3 w-3 mr-1.5" />
                              )}
                              <span className="truncate">{suggestion.label}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Media Card */}
                  <Card className={`border-2 shadow-2xl ${isMobile ? 'border-emerald-700 bg-emerald-950' : 'border-emerald-500/30 bg-white/5 backdrop-blur-md'}`} style={{ willChange: 'auto' }}>
                    <CardHeader className={`border-b ${isMobile ? 'bg-emerald-900 border-emerald-700' : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/30'}`}>
                      <CardTitle className="flex items-center gap-3 text-white">
                        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg">
                          <Upload className="h-5 w-5 text-white" />
                        </div>
                        Add Media (Optional)
                      </CardTitle>
                      <p className="text-sm text-white/70 mt-2">
                        Enhance your capsule with photos, videos, or audio
                      </p>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      {/* Phase 1B: Upload controls with folder & drag-drop */}
                      <div className="space-y-3">
                        {/* File & Folder Inputs */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,video/*,audio/*,application/pdf,.pdf,.doc,.docx,.txt"
                          multiple
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                        <input
                          ref={folderInputRef}
                          type="file"
                          // @ts-ignore - webkitdirectory is not in TypeScript types
                          webkitdirectory=""
                          // @ts-ignore
                          directory=""
                          multiple
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                        
                        {/* Action Buttons Row */}
                        <div className="grid grid-cols-4 gap-2">
                          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full justify-center bg-white/5 border-white/20 text-white/90 hover:bg-white/10">
                            <Upload className="h-4 w-4 mr-1.5" />
                            Upload
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            folderInputRef.current?.click();
                            toast.info('Select a folder - files will appear in the queue', { duration: 3000 });
                          }} className="w-full justify-center bg-white/5 border-white/20 text-white/90 hover:bg-white/10">
                            <FolderUp className="h-4 w-4 mr-1.5" />
                            Folder
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            console.log('🎥 Record button clicked - navigating to Record tab');
                            onOpenRecord?.();
                          }} className="w-full justify-center bg-white/5 border-white/20 text-white/90 hover:bg-white/10">
                            <Video className="h-4 w-4 mr-1.5" />
                            Record
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            console.log('🏛️ From Vault clicked - navigating to Vault tab with theme:', themeId);
                            onOpenVault?.(media, themeId, themeMetadata);
                          }} className="w-full justify-center bg-white/5 border-white/20 text-white/90 hover:bg-white/10">
                            <Folder className="h-4 w-4 mr-1.5" />
                            Vault
                          </Button>
                        </div>

                        {/* Drag & Drop Zone */}
                        <div
                          className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-emerald-400/50 hover:bg-emerald-500/10 transition-all cursor-pointer"
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add('!border-emerald-500', '!bg-emerald-500/20');
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove('!border-emerald-500', '!bg-emerald-500/20');
                          }}
                          onDrop={async (e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('!border-emerald-500', '!bg-emerald-500/20');
                            const files = Array.from(e.dataTransfer.files);
                            if (files.length > 0) {
                              const largeFiles = files.filter((f) => f.size > 10 * 1024 * 1024);
                              if (largeFiles.length > 0) {
                                setPendingFiles(files);
                                setShowFileSizeWarning(true);
                              } else {
                                await uploadQueue.addFiles(files);
                                toast.success(`Added ${files.length} file${files.length > 1 ? 's' : ''} to queue`);
                              }
                            }
                          }}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="w-8 h-8 mx-auto mb-2 text-white/40" />
                          <p className="text-sm text-white/70 font-medium mb-1">Drag & drop files here</p>
                          <p className="text-xs text-white/50">or click to browse</p>
                        </div>
                      </div>

                      {/* Phase 1A: Upload Queue Manager */}
                      <UploadQueueManager
                        files={uploadQueue.files}
                        onRemove={uploadQueue.removeFile}
                        onPause={uploadQueue.pauseFile}
                        onResume={uploadQueue.resumeFile}
                        onRetry={uploadQueue.retryFile}
                        onClearCompleted={uploadQueue.clearCompleted}
                        onClearAll={uploadQueue.clearAll}
                      />

                      {/* 🎯 UX: Show uploading status banner */}
                      {media.some(m => m.uploading) && (
                        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 mb-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                            <span className="text-sm text-blue-100">
                              Uploading {media.filter(m => m.uploading).length} file{media.filter(m => m.uploading).length > 1 ? 's' : ''} in background...
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Multi-select controls */}
                      {media.length > 0 && (
                        <div className="flex items-center justify-between pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setIsMultiSelectMode(!isMultiSelectMode);
                              if (isMultiSelectMode) setSelectedMediaIds(new Set());
                            }}
                            className="bg-white/5 border-white/20 text-white/90 hover:bg-white/10"
                          >
                            {isMultiSelectMode ? <X className="h-4 w-4 mr-1" /> : <CheckSquare className="h-4 w-4 mr-1" />}
                            {isMultiSelectMode ? 'Cancel' : 'Select Multiple'}
                          </Button>

                          {isMultiSelectMode && selectedMediaIds.size > 0 && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleEnhanceSelectedMedia}
                                className="bg-white/5 border-white/20 text-white/90 hover:bg-white/10"
                              >
                                <Palette className="h-4 w-4 mr-1" />
                                Enhance ({selectedMediaIds.size})
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={handleDeleteSelectedMedia}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete ({selectedMediaIds.size})
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Media Grid */}
                      {media.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {media.map((item) => (
                            <div key={item.id} className="relative group">
                              {isMultiSelectMode && (
                                <div
                                  className="absolute top-2 left-2 z-10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMediaSelection(item.id);
                                  }}
                                >
                                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${
                                    selectedMediaIds.has(item.id)
                                      ? 'bg-blue-500 border-blue-500'
                                      : 'bg-white/20 border-white/40 hover:border-white'
                                  }`}>
                                    {selectedMediaIds.has(item.id) && (
                                      <CheckCircle className="h-4 w-4 text-white" />
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              <div className="relative">
                                <MediaThumbnail
                                  mediaFile={{
                                    id: item.id,
                                    file_name: item.file?.name,
                                    file_type: item.mimeType,
                                    url: item.url,
                                    thumbnail: item.thumbnail, // ✅ Pass pre-generated thumbnail for instant loading
                                  }}
                                  size="lg"
                                  onClick={() => {
                                    setPreviewMediaId(item.id);
                                    setShowMediaPreview(true);
                                  }}
                                />
                                
                                {/* 🎯 UX: Show uploading overlay for vault media */}
                                {item.uploading && (
                                  <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                    <div className="flex flex-col items-center gap-2">
                                      <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                      <span className="text-xs text-white/90 font-medium">Uploading...</span>
                                    </div>
                                  </div>
                                )}
                                
                                {!isMultiSelectMode && (
                                  <div className={`absolute top-2 right-2 flex gap-1 transition-opacity ${
                                    isMobileForButtons 
                                      ? 'opacity-100' // Always visible on mobile
                                      : 'opacity-0 group-hover:opacity-100' // Hover on desktop
                                  }`}>
                                    {/* 🎬 HIDE ENHANCE FOR VIDEOS: Videos cannot be enhanced */}
                                    {onEnhance && (item.type === 'image' || item.type === 'audio') && (
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-8 w-8 p-0 bg-purple-600 hover:bg-purple-700 shadow-lg"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onEnhance({ 
                                            ...item, 
                                            originalId: item.id,
                                            vaultId: item.vault_id || item.vaultId, // 🆕 Pass vault ID if from vault
                                            fromVault: item.fromVault // 🆕 Pass vault flag
                                          });
                                        }}
                                      >
                                        <Palette className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="h-8 w-8 p-0 shadow-lg"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeMedia(item.id);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Attach Folder */}
                      {attachedFolderId && (
                        <div className="flex items-center gap-2 p-3 bg-white/10 border border-white/20 rounded-lg">
                          <FolderOpen className="h-5 w-5 text-emerald-400" />
                          <span className="text-sm text-white/90">Entire folder attached</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setAttachedFolderId(null)}
                            className="ml-auto text-white/70 hover:text-white hover:bg-white/10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: 'spring', stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                  className="space-y-6"
                >
                  {/* Delivery Card */}
                  <Card className={`border-2 shadow-2xl ${isMobile ? 'border-orange-700 bg-orange-950' : 'border-orange-500/30 bg-white/5 backdrop-blur-md'}`} style={{ willChange: 'auto' }}>
                    <CardHeader className={`border-b ${isMobile ? 'bg-orange-900 border-orange-700' : 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-orange-500/30'}`}>
                      <CardTitle className="flex items-center gap-3 text-white">
                        <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg">
                          <Clock className="h-5 w-5 text-white" />
                        </div>
                        Schedule Delivery
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      {/* Date & Time */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-white/90">Delivery Date</Label>
                          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full h-12 justify-start text-left bg-white/10 border-white/20 text-white hover:bg-white/20"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {deliveryDate ? format(deliveryDate, 'PPP') : 'Select date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-700" align="start">
                              <Calendar
                                mode="single"
                                selected={deliveryDate}
                                onSelect={(date) => {
                                  setDeliveryDate(date);
                                  setCalendarOpen(false);
                                }}
                                disabled={(date) => isBefore(startOfDay(date), startOfDay(new Date()))}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="time" className="text-white/90">Delivery Time</Label>
                          <Input
                            id="time"
                            type="time"
                            value={deliveryTime}
                            onChange={(e) => setDeliveryTime(e.target.value)}
                            className="h-12 bg-white/10 border-white/20 text-white text-center"
                          />
                        </div>
                      </div>

                      {/* Timezone */}
                      <div className="space-y-2">
                        <Label className="text-white/90">Time Zone</Label>
                        <Select value={timeZone} onValueChange={setTimeZone}>
                          <SelectTrigger className="h-12 bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700">
                            {TIME_ZONES.map((tz) => (
                              <SelectItem key={tz.value} value={tz.value} className="text-white focus:bg-slate-800 focus:text-white">
                                {getTimeZoneDisplay(tz)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                    </CardContent>
                  </Card>

                  {/* Recipients Card */}
                  <Card className={`border-2 shadow-2xl ${isMobile ? 'border-pink-700 bg-pink-950' : 'border-pink-500/30 bg-white/5 backdrop-blur-md'}`} style={{ willChange: 'auto' }}>
                    <CardHeader className={`border-b ${isMobile ? 'bg-pink-900 border-pink-700' : 'bg-gradient-to-r from-pink-500/20 to-rose-500/20 border-pink-500/30'}`}>
                      <CardTitle className="flex items-center gap-3 text-white">
                        <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        Who should receive this?
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      {/* Recipient Type Selection */}
                      <div className="grid grid-cols-2 gap-4">
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card
                            className={`cursor-pointer transition-all ${
                              recipientType === 'self' 
                                ? 'ring-2 ring-pink-500 shadow-lg bg-pink-500/10' 
                                : 'hover:shadow-md bg-white/5'
                            }`}
                            onClick={() => setRecipientType(recipientType === 'self' ? null : 'self')}
                          >
                            <CardContent className="p-6 text-center">
                              <Users className="h-10 w-10 mx-auto mb-3 text-pink-400" />
                              <p className="font-semibold text-base mb-1 text-white">Just Me</p>
                              <p className="text-sm text-white/60">Send to yourself</p>
                            </CardContent>
                          </Card>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card
                            className={`cursor-pointer transition-all ${
                              recipientType === 'others' 
                                ? 'ring-2 ring-pink-500 shadow-lg bg-pink-500/10' 
                                : 'hover:shadow-md bg-white/5'
                            }`}
                            onClick={() => setRecipientType(recipientType === 'others' ? null : 'others')}
                          >
                            <CardContent className="p-6 text-center">
                              <Mail className="h-10 w-10 mx-auto mb-3 text-pink-400" />
                              <p className="font-semibold text-base mb-1 text-white">Others</p>
                              <p className="text-sm text-white/60">Share with people</p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </div>

                      {/* Recipients List */}
                      {recipientType === 'others' && (
                        <MultiRecipientSelector 
                          recipients={recipients} 
                          onRecipientsChange={setRecipients} 
                        />
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Buttons - Hidden on Step 1 (theme selection auto-advances) */}
          {currentStep !== 1 && (
            <Card className={`mt-8 border-2 shadow-2xl ${isMobile ? 'border-slate-700 bg-slate-800' : 'border-white/10 bg-white/5 backdrop-blur-md'}`} style={{ willChange: 'auto' }}>
              <CardContent className="p-6">
                <div className="flex justify-between items-center gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={goToPreviousStep}
                    className="flex-1 bg-slate-900/80 backdrop-blur-md border-white/20 text-white hover:bg-slate-800"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  
                  {currentStep < 3 ? (
                    <Button
                      size="lg"
                      onClick={goToNextStep}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg border-0"
                    >
                      Next Step
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={deliveryDate && deliveryTime && deliveryTime.trim() !== '' && recipientType ? handleSubmit : handleSaveDraft}
                    disabled={isSubmitting || media.some(m => m.uploading)}
                    className={`flex-1 ${
                      deliveryDate && deliveryTime && deliveryTime.trim() !== '' && recipientType
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400'
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500'
                    } text-white shadow-lg shadow-emerald-500/20 border-0`}
                  >
                    {media.some(m => m.uploading) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing {media.filter(m => m.uploading).length} file(s)...
                      </>
                    ) : isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {deliveryDate && deliveryTime && deliveryTime.trim() !== '' && recipientType
                          ? (editingCapsule ? 'Updating...' : 'Sealing Capsule...')
                          : 'Saving Draft...'}
                      </>
                    ) : (
                      <>
                        {deliveryDate && deliveryTime && deliveryTime.trim() !== '' && recipientType
                          ? (editingCapsule ? 'Update Capsule' : 'Seal & Send')
                          : 'Save Draft'}
                        {deliveryDate && deliveryTime && deliveryTime.trim() !== '' && recipientType ? (
                          <Rocket className="ml-2 h-4 w-4" />
                        ) : (
                          <Save className="ml-2 h-4 w-4" />
                        )}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          )}
        </div>
      </div>

      {/* Media Preview */}
      {showMediaPreview && (
        <MediaPreviewModal
          media={media.find(m => m.id === previewMediaId)}
          onClose={() => setShowMediaPreview(false)}
        />
      )}

      {/* Folder Selector */}
      {showFolderSelector && (
        <FolderSelector
          onSelect={handleFolderSelect}
          onClose={() => setShowFolderSelector(false)}
        />
      )}

      {/* Attach Folder Dialog */}
      {showAttachFolderDialog && (
        <FolderSelector
          onSelect={handleAttachFolder}
          onClose={() => setShowAttachFolderDialog(false)}
          title="Attach Entire Folder"
          description="All media from this folder will be included in the capsule"
        />
      )}

      {/* Phase 1B: File Size Warning Dialog */}
      <FileSizeWarningDialog
        open={showFileSizeWarning}
        onOpenChange={setShowFileSizeWarning}
        files={pendingFiles.map((file) => {
          const canCompress =
            file.type.startsWith('image/') ||
            file.type.startsWith('video/') ||
            file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|mp4|mov|avi)$/i);
          
          return {
            name: file.name,
            size: file.size,
            canCompress: !!canCompress,
          };
        })}
        onConfirm={handleFileSizeWarningConfirm}
        onCancel={handleFileSizeWarningCancel}
      />

      {/* Milestone Celebration Modal */}
      {milestoneData && (
        <CapsuleMilestoneShare
          milestone={milestoneData}
          isOpen={showMilestoneModal}
          onClose={() => {
            setShowMilestoneModal(false);
            setMilestoneData(null);
          }}
        />
      )}
      {/* Sealing Ceremony Overlay */}
      <SealingOverlay 
        isVisible={showSealingOverlay}
        isSuccess={sealingSuccess}
        onAnimationComplete={handleSealingAnimationComplete}
        themeId={themeId}
        mode={sealingMode}
      />
      
      {/* Vault Loading Modal - Shows progress when loading large files from vault */}
      <VaultLoadingModal
        isOpen={vaultLoadingState.isOpen}
        fileName={vaultLoadingState.fileName}
        fileType={vaultLoadingState.fileType}
        fileSize={vaultLoadingState.fileSize}
        progress={vaultLoadingState.progress}
        receivedBytes={vaultLoadingState.receivedBytes}
        status={vaultLoadingState.status}
        timeRemaining={vaultLoadingState.timeRemaining}
      />
    </>
  );
}
