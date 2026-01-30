import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAchievements } from '../hooks/useAchievements';
import { useAuth } from '../contexts/AuthContext';
import { downloadAsZip, downloadSingleFile, formatBytes, estimateZipSize, type ExportableMedia } from '../utils/vault-export';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import { Input } from './ui/input';
import { 
  ArrowLeft, 
  CheckCircle, 
  Trash2, 
  Image, 
  Video, 
  Mic, 
  FileText,
  AlertTriangle, 
  Edit3, 
  Wand2,
  Lock,
  SortAsc,
  SortDesc,
  Filter,
  MoreVertical,
  X,
  Sparkles,
  Upload,
  Loader2,
  Grid3x3,
  LayoutGrid,
  List,
  Play,
  Pause,
  FolderOpen,
  Folder,
  Search,
  SlidersHorizontal,
  Grid2x2,
  Calendar,
  Download,
  Layers,
  Archive,
  RefreshCw
} from 'lucide-react';
import { Badge } from './ui/badge';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useIsMobile } from './ui/use-mobile';
import { VaultFolder } from './VaultFolder';
import { VaultFolderDialog } from './VaultFolderDialog';
import { VaultPasswordDialog } from './VaultPasswordDialog';
import { VaultToolbar } from './VaultToolbar';
import { FolderOverlay } from './FolderOverlay';
import { FolderTemplateSelector } from './FolderTemplateSelector';
// REMOVED: FolderShareManager - share folder functionality redundant with Legacy Access
import { ExportPreviewDialog } from './ExportPreviewDialog';
import { ExportProgressModal } from './ExportProgressModal';
import { ExportHistoryModal } from './ExportHistoryModal';
import { FolderPlus } from 'lucide-react';
import type { FolderTemplate } from '../utils/folder-templates';
import type { FolderLegacyAccess } from '../utils/legacyAccessInheritance';
import { uploadWithTUS } from '../utils/tus-upload';

interface LibraryItem {
  id: string;
  type: 'photo' | 'video' | 'audio' | 'document';
  base64Data: string;
  timestamp: number;
  thumbnail?: string;
  mimeType: string;
  duration?: number; // Duration in seconds for audio/video
  fileName?: string; // Custom filename for documents
}

interface MediaItem {
  id: string;
  type: 'photo' | 'video' | 'audio' | 'document';
  url: string;
  blob: Blob;
  file: File; // Added File object for compatibility with CreateCapsule
  timestamp: number;
  thumbnail?: string;
  fromVault?: boolean; // Flag to indicate this media is from Vault (don't re-upload)
}

interface LegacyVaultProps {
  onUseMedia?: (selectedMedia: MediaItem[]) => void;
  onEdit?: (media: MediaItem) => void;
  onClose?: () => void;
  onNavigateToGlobalSettings?: () => void; // NEW: Navigate to global legacy access settings
  importedMediaIds?: Set<string>; // IDs of media already imported to current capsule
  onRemoveFromCapsule?: (vaultId: string) => void; // NEW: Remove media from capsule when unchecked
}

type SortOption = 'newest' | 'oldest' | 'type-asc' | 'type-desc';
type FilterOption = 'all' | 'photo' | 'video' | 'audio' | 'document';
type ViewMode = '2x2' | '3x3' | '4x4' | 'list';
type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year';

// Permanent system folders that cannot be deleted or renamed
const PERMANENT_FOLDERS = ['Photos', 'Videos', 'Audio', 'Documents'];

export const LegacyVault = React.memo(function LegacyVault({ onUseMedia, onEdit, onClose, onNavigateToGlobalSettings, importedMediaIds, onRemoveFromCapsule }: LegacyVaultProps) {
  // 🐛 DEBUG: Log imported media IDs
  React.useEffect(() => {
    console.log('📦 [VAULT] importedMediaIds prop changed:', {
      size: importedMediaIds?.size || 0,
      ids: importedMediaIds ? Array.from(importedMediaIds) : []
    });
  }, [importedMediaIds]);
  
  // Achievement tracking
  const { trackAction} = useAchievements();
  const { session } = useAuth();
  
  const [vaultItems, setVaultItems] = useState<LibraryItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // ⚡ Start false - only show loading if no localStorage data
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Load from localStorage or default to 3x3
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('vault_view_mode') as ViewMode) || '3x3';
    }
    return '3x3';
  });
  const [isUploading, setIsUploading] = useState(false);
  const [previewItem, setPreviewItem] = useState<LibraryItem | null>(null);
  const [isRefreshingUrl, setIsRefreshingUrl] = useState(false); // Track URL refresh state
  const [editingMediaName, setEditingMediaName] = useState(false);
  const [mediaName, setMediaName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const controlPanelRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  // 🔧 FIX: Composite loading state to prevent flash when vault loads before folders
  const [vaultLoaded, setVaultLoaded] = useState(false);
  const [foldersLoaded, setFoldersLoaded] = useState(false);
  
  // Folder system state
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [folderDialogMode, setFolderDialogMode] = useState<'create' | 'rename'>('create');
  const [editingFolder, setEditingFolder] = useState<any | null>(null);
  const [isFolderOperationLoading, setIsFolderOperationLoading] = useState(false);
  const [showDeleteFolderDialog, setShowDeleteFolderDialog] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<any | null>(null);
  
  // Private folder state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordFolder, setPasswordFolder] = useState<any | null>(null);
  const [unlockedFolders, setUnlockedFolders] = useState<Set<string>>(new Set());

  // NEW: Global Legacy Access Configuration
  const [globalLegacyConfig, setGlobalLegacyConfig] = useState<any | null>(null);
  const [loadingGlobalLegacy, setLoadingGlobalLegacy] = useState(false);
  
  // Track which folder menu is currently open (prevents multiple menus)
  const [openFolderMenuId, setOpenFolderMenuId] = useState<string | null>(null);
  
  // Mobile folder overlay state
  const [mobileOpenFolder, setMobileOpenFolder] = useState<any | null>(null);
  const [previousFolder, setPreviousFolder] = useState<any | null>(null);
  
  // Preview modal playing state
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  
  // Optimistic updates tracking
  const [optimisticItemIds, setOptimisticItemIds] = useState<Set<string>>(new Set());
  
  // 🔒 NUCLEAR: Block loadVault during uploads to prevent flicker
  const uploadInProgressRef = useRef(false);
  
  // 🔒 NUCLEAR: Block folder cleanup briefly after upload completes
  const cleanupBlockedUntilRef = useRef(0);
  
  // Template selector state - Phase 4C
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  
  // Folder sharing dialog state - Phase 4C
  // REMOVED: Share folder functionality - redundant with Legacy Access system
  
  // Export enhancement state - Phase 2
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [showExportProgress, setShowExportProgress] = useState(false);
  const [showExportHistory, setShowExportHistory] = useState(false);
  const [exportingFolder, setExportingFolder] = useState<any | null>(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportCurrentFile, setExportCurrentFile] = useState<string | undefined>(undefined);
  const [exportProcessedFiles, setExportProcessedFiles] = useState(0);
  const [exportStatus, setExportStatus] = useState<'preparing' | 'exporting' | 'complete'>('preparing');
  
  // 🔄 SYNC: Track last sync time for cross-device sync detection
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());
  const [isSyncing, setIsSyncing] = useState(false);
  
  console.log('📱 isMobile value:', isMobile);
  
  // Initialize media name when preview opens
  useEffect(() => {
    if (previewItem) {
      // Use saved fileName if available, otherwise extract from ID
      const savedName = previewItem.fileName;
      const nameWithoutExt = previewItem.id.replace(/\.[^/.]+$/, '');
      setMediaName(savedName || nameWithoutExt || previewItem.id);
      setEditingMediaName(false);
    }
  }, [previewItem?.id, previewItem?.fileName]);
  
  // Generate stable audio bar heights once per item
  const audioBarHeights = useMemo(() => {
    const heights: Record<string, number[]> = {};
    vaultItems.forEach(item => {
      if (item.type === 'audio') {
        heights[item.id] = Array.from({ length: 8 }, () => 30 + Math.random() * 40);
      }
    });
    return heights;
  }, [vaultItems.map(i => i.id).join(',')]);

  // Load global legacy access configuration
  const loadGlobalLegacyConfig = React.useCallback(async () => {
    try {
      setLoadingGlobalLegacy(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('🔐 No session - skipping global legacy config load');
        setLoadingGlobalLegacy(false);
        return;
      }

      console.log('🔐 Loading global legacy access config...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-access/config`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Global legacy access config loaded:', {
          beneficiaryCount: data.config?.beneficiaries?.length || 0,
          verifiedCount: data.config?.beneficiaries?.filter((b: any) => b.status === 'verified').length || 0
        });
        setGlobalLegacyConfig(data.config);
      } else {
        console.warn('⚠️ Failed to load global legacy config:', response.status);
        // Don't show error toast - this is optional data
      }
    } catch (err) {
      console.error('Failed to load global legacy config:', err);
      // Silent fail - this is optional data
    } finally {
      setLoadingGlobalLegacy(false);
    }
  }, []);

  // Load vault items on mount
  useEffect(() => {
    loadVault();
    loadFolders(); // 🔧 FIX: Load folders on mount to prevent sync issues
  }, []);

  // Load global legacy config after component mounts
  useEffect(() => {
    loadGlobalLegacyConfig();
  }, [loadGlobalLegacyConfig]);

  // 🐛 DEBUG: Track vaultItems changes
  useEffect(() => {
    console.log('📊 vaultItems changed! Count:', vaultItems.length);
    console.log('📊 Optimistic IDs tracked:', optimisticItemIds.size);
    console.log('📊 Lock state:', uploadInProgressRef.current);
    console.trace('☝️ vaultItems was updated from:');
  }, [vaultItems]);

  // 🔍 SYNC DIAGNOSTIC: Detect and auto-fix sync issues between devices
  useEffect(() => {
    if (vaultItems.length > 0 && folders.length > 0) {
      const allFolderMediaIds = folders.flatMap(f => f.mediaIds || []);
      const vaultItemIds = vaultItems.map(item => item.id);
      
      // Check for orphaned IDs in folders (IDs in folders but not in vault)
      const orphanedIds = allFolderMediaIds.filter(id => !vaultItemIds.includes(id));
      if (orphanedIds.length > 0) {
        console.warn('⚠️ SYNC ISSUE: Orphaned IDs in folders (in folder but not in vault):', orphanedIds);
        console.log('🧹 Auto-cleaning orphaned IDs from folders...');
        
        // Clean up orphaned IDs
        const cleanOrphanedIds = async () => {
          try {
            const vaultItemIdSet = new Set(vaultItemIds);
            let hasChanges = false;
            
            const cleanedFolders = folders.map(folder => {
              const originalMediaIds = folder.mediaIds || [];
              const cleanedMediaIds = originalMediaIds.filter(id => vaultItemIdSet.has(id));
              
              if (cleanedMediaIds.length !== originalMediaIds.length) {
                hasChanges = true;
                const orphanedCount = originalMediaIds.length - cleanedMediaIds.length;
                console.log(`🧹 Cleaning folder "${folder.name}": removed ${orphanedCount} orphaned ID(s)`);
              }
              
              return {
                ...folder,
                mediaIds: cleanedMediaIds
              };
            });
            
            if (hasChanges) {
              // 🔥 CRITICAL FIX: Use new backend endpoint for safe cleanup
              const { data: { session } } = await supabase.auth.getSession();
              if (session) {
                const response = await fetch(
                  `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/vault/folders`,
                  {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${session.access_token}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                      action: 'clean_orphaned_ids',
                      validMediaIds: vaultItemIds // Send list of valid IDs to backend
                    })
                  }
                );
                
                if (response.ok) {
                  const result = await response.json();
                  console.log(`✅ Orphaned IDs cleaned via backend: ${result.cleanedCount} orphaned ID(s) removed`);
                  // Update local state with cleaned folders
                  setFolders(cleanedFolders);
                } else {
                  const errorText = await response.text();
                  console.error('❌ Failed to clean orphaned IDs via backend:', response.status, errorText);
                }
              }
            }
          } catch (error) {
            console.error('❌ Error cleaning orphaned IDs:', error);
          }
        };
        
        cleanOrphanedIds();
      }
      
      // Check for items in vault that aren't tracked by folders
      const unsortedItems = vaultItems.filter(item => !allFolderMediaIds.includes(item.id));
      console.log('🔍 SYNC STATUS:', {
        totalVaultItems: vaultItems.length,
        totalFolders: folders.length,
        itemsInFolders: allFolderMediaIds.length,
        unsortedItems: unsortedItems.length,
        orphanedFolderIds: orphanedIds.length
      });
    }
  }, [vaultItems.length, folders.length]);

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Persist view mode to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vault_view_mode', viewMode);
    }
  }, [viewMode]);

  // Auto-scroll control panel into view when first media item is selected
  const prevSelectedCountRef = useRef(0);
  useEffect(() => {
    const currentCount = selectedIds.size;
    const prevCount = prevSelectedCountRef.current;
    
    // Only scroll when going from 0 to 1+ selections (first item selected)
    if (prevCount === 0 && currentCount > 0 && controlPanelRef.current) {
      console.log('📜 Scrolling control panel into view');
      // Small delay to ensure the panel has rendered and animated in
      setTimeout(() => {
        controlPanelRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest',
          inline: 'nearest'
        });
      }, 200);
    }
    
    prevSelectedCountRef.current = currentCount;
  }, [selectedIds.size]);

  // Update mobileOpenFolder when folders change (after MOVE TO operations or uploads)
  // This ensures the FolderOverlay shows real-time updates
  useEffect(() => {
    if (mobileOpenFolder) {
      // Find the updated folder from the newly loaded folders
      const updatedFolder = folders.find(f => f.id === mobileOpenFolder.id);
      if (updatedFolder) {
        // 🔒 CRITICAL FIX: Only update if vaultItems has ALL the folder's items!
        // This prevents flicker when folder has IDs that vaultItems doesn't have yet
        const folderItemIds = updatedFolder.mediaIds || [];
        const vaultItemIds = vaultItems.map(item => item.id);
        const allItemsExist = folderItemIds.every(id => vaultItemIds.includes(id));
        
        if (allItemsExist) {
          // Safe to update - vaultItems has all the folder's items
          setMobileOpenFolder(updatedFolder);
          console.log('✅ Updated open folder with latest data (mediaIds:', updatedFolder.mediaIds?.length || 0, ')');
        } else {
          // Wait for vaultItems to sync first
          console.log('⏳ Waiting for vaultItems to sync before updating folder (need', folderItemIds.length, 'items, have', folderItemIds.filter(id => vaultItemIds.includes(id)).length, ')');
        }
      }
    }
  }, [folders, mobileOpenFolder?.id, vaultItems.length]); // Also depend on vaultItems.length so we re-check when items are added

  console.log('🔍 About to register global click listener useEffect');

  // 🐛 DEBUG: Global click listener to see where clicks are going
  useEffect(() => {
    console.log('🎯 INSTALLING GLOBAL CLICK LISTENER');
    
    const handleGlobalClick = (e: MouseEvent) => {
      console.log('🖱️ GLOBAL CLICK detected!');
      console.log('🖱️ Target tag:', (e.target as HTMLElement).tagName);
      console.log('🖱️ Target class:', (e.target as HTMLElement).className);
      console.log('🖱️ Target id:', (e.target as HTMLElement).id);
      console.log('🖱️ Computed z-index:', window.getComputedStyle(e.target as HTMLElement).zIndex);
      console.log('🖱️ Pointer events:', window.getComputedStyle(e.target as HTMLElement).pointerEvents);
      
      // Check for invisible overlays
      const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);
      console.log('🎯 All elements at click point:', elementsAtPoint.map(el => ({
        tag: el.tagName,
        classes: el.className,
        id: el.id,
        zIndex: window.getComputedStyle(el).zIndex,
        pointerEvents: window.getComputedStyle(el).pointerEvents
      })));
    };
    
    document.addEventListener('click', handleGlobalClick, true); // Use capture phase
    console.log('✅ GLOBAL CLICK LISTENER INSTALLED');
    
    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
      console.log('❌ GLOBAL CLICK LISTENER REMOVED');
    };
  }, []);

  // MOBILE UX: Force 3x3 grid view on mobile (best for touch and visual scanning)
  useEffect(() => {
    if (isMobile && viewMode !== '3x3') {
      setViewMode('3x3');
      console.log('📱 Set mobile vault to 3x3 grid view');
    }
  }, [isMobile, viewMode]);

  // 🚫💣 NUCLEAR OPTION: FRONTEND FOLDER CLEANUP DISABLED! 💣🚫
  // Backend is source of truth. DO NOT RE-ENABLE!
  /*
  useEffect(() => {
    // 🔒 NUCLEAR: Don't cleanup during uploads to prevent removing newly uploaded items
    if (uploadInProgressRef.current) {
      console.log('⏸️ Upload in progress - deferring folder cleanup');
      return;
    }
    
    // 🔒 NUCLEAR: Don't cleanup immediately after upload (give loadVault time to complete)
    const now = Date.now();
    const blockedUntil = cleanupBlockedUntilRef.current;
    const shouldBlock = now < blockedUntil;
    console.log('🔍 Cleanup check:', { now, blockedUntil, shouldBlock, diff: blockedUntil - now });
    
    if (shouldBlock) {
      console.log('⏸️ Cleanup blocked briefly after upload to prevent race condition');
      return;
    }
    
    if (folders.length > 0 && vaultItems.length > 0) {
      const vaultItemIds = new Set(vaultItems.map(item => item.id));
      let needsCleanup = false;
      
      const cleanedFolders = folders.map(folder => {
        const folderMediaIds = folder.mediaIds || [];
        const validMediaIds = folderMediaIds.filter(id => vaultItemIds.has(id));
        
        if (validMediaIds.length !== folderMediaIds.length) {
          needsCleanup = true;
          console.log(`🧹 Cleaning folder "${folder.name}": ${folderMediaIds.length} -> ${validMediaIds.length} items`);
          return { ...folder, mediaIds: validMediaIds };
        }
        return folder;
      });
      
      if (needsCleanup) {
        setFolders(cleanedFolders);
      }
    }
  }, [vaultItems, folders.length]);
  */

  const loadVault = async () => {
    // 🔒 NUCLEAR: Don't refresh during uploads to prevent disappear/reappear
    if (uploadInProgressRef.current) {
      console.log('⏸️ Upload in progress - deferring loadVault()');
      console.trace('☝️ loadVault() was called from:'); // Show call stack
      return;
    }
    
    console.log('📥 loadVault() executing...');
    console.trace('☝️ loadVault() was called from:'); // Show call stack
    
    // Always load localStorage first to ensure users can access their media
    let localItems: LibraryItem[] = [];
    let hasLocalData = false;
    try {
      const stored = localStorage.getItem('legacyVault');
      if (stored) {
        const rawItems = JSON.parse(stored);
        // Normalize: ensure fileName (camelCase) is used, not file_name (snake_case)
        localItems = rawItems.map((item: any) => ({
          ...item,
          fileName: item.fileName || item.file_name // Support both formats
        }));
        console.log(`🏛️ Loaded ${localItems.length} items from Vault (localStorage)`);
        // Show localStorage items immediately
        setVaultItems(localItems);
        setVaultLoaded(true); // 🔧 FIX: Mark vault as loaded even from localStorage
        hasLocalData = localItems.length > 0;
      }
    } catch (localErr) {
      console.error('Failed to load from localStorage:', localErr);
    }
    
    // ⚡ OPTIMIZATION: Only show loading if there's no local data
    // If we have data, backend sync happens silently in the background
    if (!hasLocalData) {
      setIsLoading(true);
    }
    
    // Try to sync with backend (but don't block on it)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('☁️ Syncing with backend Vault...');
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-vault`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Synced ${data.records.length} items from backend Vault`);
          
          // Only log failed items to console - don't alarm users with UI warnings
          // Failed items can be due to archiving (expected) or temporary database issues
          if (data.metadata && data.metadata.failedItems > 0) {
            console.log(`ℹ️ ${data.metadata.failedItems} items not loaded (may be archived or temporarily unavailable)`);
          }
          
          // Convert backend records to LibraryItem format
          const backendItems: LibraryItem[] = data.records.map(record => {
            console.log('🔄 Backend record:', { id: record.id, type: record.type, file_type: record.file_type });
            return {
              id: record.id,
              type: record.type,
              base64Data: record.url, // Store the signed URL instead of base64
              timestamp: record.timestamp,
              thumbnail: record.thumbnail,
              mimeType: record.file_type,
              fileName: record.file_name // Custom document name
            };
          });
          
          // Merge backend items with local items (backend takes precedence)
          const mergedItems = [...backendItems];
          
          // 🧹 SYNC FIX: Smart merge that purges zombie items
          localItems.forEach(localItem => {
            // If already in backend list, skip (backend version wins)
            if (mergedItems.find(item => item.id === localItem.id)) {
              return;
            }

            // If not in backend, only keep if it's:
            // 1. Explicitly tracked as optimistic (upload in progress/recent)
            // 2. OR It's actual local data (starts with data:), not a remote URL reference
            //    (If it starts with http, it's a stale reference to a deleted server file)
            
            const isRemoteRef = localItem.base64Data && localItem.base64Data.startsWith('http');
            const isOptimistic = optimisticItemIds.has(localItem.id);
            
            if (isOptimistic || !isRemoteRef) {
              mergedItems.push(localItem);
            } else {
              console.log(`🧹 Purging stale remote item from local view: ${localItem.id}`);
            }
          });
          
          // 🚀 PRESERVE OPTIMISTIC ITEMS: Keep any optimistic items during refresh
          const currentOptimisticItems = vaultItems.filter(item => 
            optimisticItemIds.has(item.id)
          );
          
          // Add optimistic items that aren't in merged items yet
          currentOptimisticItems.forEach(optimisticItem => {
            if (!mergedItems.find(item => item.id === optimisticItem.id)) {
              mergedItems.push(optimisticItem);
            }
          });
          
          // Update localStorage to match the cleaned merged list
          // This permanently fixes the "zombie item" issue on this device
          if (typeof window !== 'undefined') {
             localStorage.setItem('legacyVault', JSON.stringify(mergedItems));
          }
          
          setVaultItems(mergedItems);
          setVaultLoaded(true); // 🔧 FIX: Mark vault as loaded
          console.log(`🏛️ Total items in Vault after sync: ${mergedItems.length} (${currentOptimisticItems.length} optimistic)`);
          
          // 🔍 SYNC DIAGNOSTIC: Log all vault item IDs for troubleshooting
          console.log('🔍 Vault item IDs:', mergedItems.map(item => item.id));
          console.log('🔍 Backend items:', backendItems.length, 'Local-only items:', mergedItems.length - backendItems.length);
        } else if (response.status === 401 || response.status === 403) {
          console.warn('⚠️ Backend sync permission denied - using localStorage only');
        } else {
          console.warn(`⚠️ Backend sync failed (${response.status}) - using localStorage only`);
        }
      } else {
        console.log('📱 No session - using localStorage only');
        setVaultLoaded(true); // 🔧 FIX: Mark vault as loaded even without session
      }
    } catch (err) {
      console.warn('⚠️ Backend sync error - using localStorage only:', err);
      setVaultLoaded(true); // 🔧 FIX: Mark vault as loaded even on error
    } finally {
      setIsLoading(false);
      setLastSyncTime(Date.now());
      console.log('✅ Vault refreshed with real backend data');
      
      // 🧹 CLEANUP AFTER SYNC: Remove orphaned IDs from backend folders
      // This ensures folders only contain IDs that exist in vaultItems
      setTimeout(() => {
        cleanupOptimisticIdsFromBackend();
      }, 1000); // Wait 1s for vaultItems and folders to update
    }
  };



  const toggleSelect = (id: string) => {
    // Check if this item is already imported to the capsule
    const isImported = importedMediaIds?.has(id);
    
    if (isImported) {
      // Item is already in capsule - unchecking should remove it from capsule
      console.log('🔄 Unchecking imported media - removing from capsule:', id);
      if (onRemoveFromCapsule) {
        onRemoveFromCapsule(id);
        toast.success('Media removed from capsule');
      }
      // Also remove from selectedIds if it's there
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      return;
    }
    
    // Normal toggle behavior for non-imported items
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    const filteredItems = getFilteredAndSortedItems();
    setSelectedIds(new Set(filteredItems.map(item => item.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // 🔄 Refresh signed URL for a vault item (when preview opens or URL expires)
  const refreshSignedUrl = async (itemId: string): Promise<string | null> => {
    try {
      // 🛡️ CRITICAL FIX: Don't try to refresh optimistic items (not uploaded yet)
      if (itemId.startsWith('optimistic-')) {
        console.log(`⏭️ Skipping URL refresh for optimistic item (still uploading): ${itemId}`);
        return null; // Use existing blob URL
      }

      setIsRefreshingUrl(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('⚠️ No session - cannot refresh signed URL');
        setIsRefreshingUrl(false);
        return null;
      }

      console.log(`🔄 Refreshing signed URL for item: ${itemId}`);
      
      // Fetch fresh signed URL from backend
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-vault/refresh-url/${itemId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Refreshed signed URL for ${itemId}`);
        
        // Update the vault item with the new URL
        setVaultItems(prev => prev.map(item => 
          item.id === itemId 
            ? { ...item, base64Data: data.url }
            : item
        ));
        
        setIsRefreshingUrl(false);
        return data.url;
      } else {
        console.error('❌ Failed to refresh signed URL:', response.status);
        setIsRefreshingUrl(false);
        return null;
      }
    } catch (error) {
      console.error('❌ Error refreshing signed URL:', error);
      setIsRefreshingUrl(false);
      return null;
    }
  };

  const handleDelete = () => {
    if (selectedIds.size === 0) return;
    setShowDeleteWarning(true);
  };

  const confirmDelete = async () => {
    const idsToDelete = Array.from(selectedIds);
    
    console.log('🗑️ confirmDelete called with:', {
      idsToDelete,
      selectedFolderId,
      vaultItemsCount: vaultItems.length
    });
    
    // 🚀 OPTIMISTIC DELETE: Remove from UI immediately
    setVaultItems(prev => {
      const filtered = prev.filter(item => !idsToDelete.includes(item.id));
      console.log('📊 Optimistic delete - Before:', prev.length, 'After:', filtered.length);
      
      // 💾 CRITICAL: Also update localStorage immediately!
      try {
        localStorage.setItem('legacyVault', JSON.stringify(filtered));
        console.log('💾 Updated localStorage - removed deleted items');
      } catch (err) {
        console.error('Failed to update localStorage:', err);
      }
      
      return filtered;
    });
    
    // Remove from optimistic tracking
    setOptimisticItemIds(prev => {
      const newSet = new Set(prev);
      idsToDelete.forEach(id => newSet.delete(id));
      return newSet;
    });
    
    // Also remove from folder mediaIds
    setFolders(prevFolders => {
      const updated = prevFolders.map(folder => ({
        ...folder,
        mediaIds: (folder.mediaIds || []).filter(id => !idsToDelete.includes(id))
      }));
      console.log('📁 Updated folder mediaIds');
      return updated;
    });
    
    // Update mobileOpenFolder if it's open
    if (mobileOpenFolder) {
      setMobileOpenFolder({
        ...mobileOpenFolder,
        mediaIds: (mobileOpenFolder.mediaIds || []).filter(id => !idsToDelete.includes(id))
      });
      console.log('📱 Updated mobileOpenFolder mediaIds');
    }
    
    setSelectedIds(new Set());
    setShowDeleteWarning(false);
    toast.success(`Moved ${idsToDelete.length} item(s) to Archive`);
    
    // 🌫️ SOFT DELETE: Move to Archive (instead of permanent delete)
    // Determine folder context - check BOTH desktop (selectedFolderId) AND mobile (mobileOpenFolder)
    const currentFolder = selectedFolderId 
      ? folders.find(f => f.id === selectedFolderId)
      : mobileOpenFolder // 🔧 FIX: Use mobileOpenFolder on mobile
        ? mobileOpenFolder
        : null;
    
    console.log('🌫️ Calling softDeleteVaultItems with:', {
      idsToDelete,
      folderId: currentFolder?.id,
      folderName: currentFolder?.name,
      source: selectedFolderId ? 'desktop' : mobileOpenFolder ? 'mobile' : 'fallback'
    });
    
    softDeleteVaultItems(
      idsToDelete, 
      currentFolder?.id,
      currentFolder?.name
    ).then(() => {
      console.log('✅ Soft delete complete - items moved to Archive');
      // ✅ No need to reload - we've already optimistically updated the UI!
      // User stays in their current folder/view 🎯
    }).catch((error) => {
      console.error('❌ Soft delete failed:', error);
      toast.error('Failed to move items - please try again');
      // On error, reload to restore correct state
      loadVault();
    });
  };

  const handleUseMedia = async () => {
    if (!onUseMedia) return;
    
    if (selectedIds.size === 0) {
      toast.error('Please select at least one item to use');
      return;
    }
    
    // Check if any selected items are already imported
    const selectedItems = vaultItems.filter(item => selectedIds.has(item.id));
    const alreadyImported = selectedItems.filter(item => importedMediaIds?.has(item.id));
    const newItems = selectedItems.filter(item => !importedMediaIds?.has(item.id));
    
    if (alreadyImported.length > 0 && newItems.length === 0) {
      toast.error(`All ${alreadyImported.length} selected item${alreadyImported.length > 1 ? 's are' : ' is'} already imported to this capsule!`);
      return;
    }
    
    if (alreadyImported.length > 0) {
      toast.warning(`${alreadyImported.length} item${alreadyImported.length > 1 ? 's' : ''} already imported - importing ${newItems.length} new item${newItems.length > 1 ? 's' : ''}`);
    }
    
    // Only convert and use new items
    const itemsToUse = newItems.length > 0 ? newItems : selectedItems;
    
    // 🎯 UX FIX: Pass raw vault items - CreateCapsule will convert in background
    // This allows vault to close immediately without blocking
    console.log('🏛️ Passing', itemsToUse.length, 'raw vault items for background conversion');
    
    // 🚀 OPTIMIZATION: Pass vault items with metadata for server-side copy
    // New strategy: Try server-side copy first (instant), fallback to client-side if needed
    const rawVaultItems = itemsToUse.map(item => ({
      id: item.id,
      vaultMediaId: item.id, // 🚀 NEW: Vault media ID for server-side copy
      type: item.type,
      base64Data: item.base64Data, // Fallback: signed URL for client-side download if server copy fails
      timestamp: item.timestamp,
      thumbnail: item.thumbnail,
      mimeType: item.mimeType,
      fileName: item.fileName,
      fromVault: true,
      needsConversion: true, // Flag to indicate conversion needed
      useServerCopy: true // 🚀 NEW: Try server-side copy first for performance
    }));
    
    // 🚀 CRITICAL UX FIX: Fire onUseMedia in next tick to avoid blocking vault close
    // Without setTimeout, the async onUseMedia blocks this function and traps user
    setTimeout(() => {
      onUseMedia(rawVaultItems as any);
    }, 0);
    
    // Clear selection after use
    setSelectedIds(new Set());
  };

  const handleEdit = async () => {
    console.log('🎨 handleEdit called in LegacyVault');
    console.log('🎨 Selected IDs:', Array.from(selectedIds));
    console.log('🎨 onEdit prop exists?', !!onEdit);
    
    if (selectedIds.size === 0 || !onEdit) {
      console.warn('⚠️ Cannot enhance: no items selected or onEdit not provided');
      toast.error('Please select at least one item to enhance');
      return;
    }
    
    const selectedItems = vaultItems.filter(item => selectedIds.has(item.id));
    console.log('🎨 Found selected items:', selectedItems.length);
    
    // 📄🎬 FILTER OUT DOCUMENTS AND VIDEOS: Cannot be enhanced
    const enhanceableItems = selectedItems.filter(item => item.type !== 'document' && item.type !== 'video');
    const documentCount = selectedItems.filter(item => item.type === 'document').length;
    const videoCount = selectedItems.filter(item => item.type === 'video').length;
    
    // Show notification if documents or videos were excluded
    const excludedItems = [];
    if (documentCount > 0) excludedItems.push(`${documentCount} document${documentCount > 1 ? 's' : ''}`);
    if (videoCount > 0) excludedItems.push(`${videoCount} video${videoCount > 1 ? 's' : ''}`);
    
    if (excludedItems.length > 0) {
      toast.warning(
        `${excludedItems.join(' and ')} skipped`,
        {
          description: 'Only photos and audio files can be enhanced.'
        }
      );
      console.log(`📄🎬 Filtered out ${documentCount} document(s) and ${videoCount} video(s) from enhancement`);
    }
    
    // If no enhanceable items remain, show error and return
    if (enhanceableItems.length === 0) {
      toast.error('No items can be enhanced', {
        description: 'Please select photos or audio files to enhance.'
      });
      return;
    }
    
    if (enhanceableItems.length > 0) {
      console.log('🎨 Converting to MediaItems...');
      const mediaItems = await convertToMediaItems(enhanceableItems);
      console.log(`🎨 Converted ${mediaItems.length} item(s) to MediaItems:`, mediaItems);
      console.log('🎨 Sample converted item:', mediaItems[0]);
      
      // Close mobile folder overlay before opening enhancement overlay
      if (isMobile && mobileOpenFolder) {
        console.log('🎨 Closing mobile folder overlay before enhancement');
        setMobileOpenFolder(null);
      }
      
      // Pass single item for single selection, or array for multiple
      if (mediaItems.length === 1) {
        console.log('🎨 Calling onEdit with single item');
        onEdit(mediaItems[0]);
      } else {
        // For multiple items, pass the array
        console.log('🎨 Calling onEdit with array of', mediaItems.length, 'items');
        onEdit(mediaItems as any);
      }
      console.log('🎨 onEdit called successfully');
    } else {
      console.warn('⚠️ No selected items found after filtering');
    }
  };

  const convertToMediaItems = async (items: LibraryItem[]): Promise<MediaItem[]> => {
    // Helper to infer MIME type from media type
    const inferMimeType = (type: string, existingMime?: string): string => {
      if (existingMime && existingMime !== 'application/octet-stream') {
        return existingMime;
      }
      
      switch (type) {
        case 'video':
          return 'video/mp4';
        case 'audio':
          return 'audio/mpeg';
        case 'photo':
          return 'image/jpeg';
        case 'document':
          return 'application/pdf';
        default:
          return 'application/octet-stream';
      }
    };
    
    // Helper to convert base64 to blob
    const base64ToBlob = (base64: string, mediaType: string): Blob => {
      const arr = base64.split(',');
      let mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
      
      // If MIME type couldn't be detected, infer from media type
      mime = inferMimeType(mediaType, mime);
      
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    };

    // Helper to fetch blob from URL
    const urlToBlob = async (url: string, mimeType: string): Promise<Blob> => {
      const response = await fetch(url);
      return await response.blob();
    };

    const mediaItems: MediaItem[] = await Promise.all(
      items.map(async (item) => {
        try {
          let blob: Blob;
          let url: string;
          
          // Check if base64Data is a URL (from backend), blob URL, or base64 (from localStorage)
          if (item.base64Data.startsWith('http')) {
            // It's a URL from backend - fetch it
            blob = await urlToBlob(item.base64Data, item.mimeType);
            url = item.base64Data; // Use the URL directly
          } else if (item.base64Data.startsWith('blob:')) {
            // It's already a blob URL - fetch the blob from it
            const response = await fetch(item.base64Data);
            blob = await response.blob();
            
            // 🎥 FIX: Convert QuickTime blobs to use video/mp4 MIME type
            if (blob.type === 'video/quicktime' || item.mimeType === 'video/quicktime') {
              console.log('🔄 Converting QuickTime blob to video/mp4 MIME type');
              blob = new Blob([blob], { type: 'video/mp4' });
            }
            
            url = URL.createObjectURL(blob);
          } else {
            // It's base64 from localStorage - convert it
            blob = base64ToBlob(item.base64Data, item.type);
            url = URL.createObjectURL(blob);
          }
          
          // CRITICAL FIX: Create a File object from the Blob for compatibility with CreateCapsule
          // The CreateCapsule component expects media items to have both blob and file properties
          const mimeType = inferMimeType(item.type, item.mimeType);
          
          // FIXED: Use custom fileName if available (from rename), otherwise generate generic name
          let filename: string;
          if (item.fileName) {
            // User has renamed this media - use their custom name
            filename = item.fileName;
          } else {
            // No custom name - generate a generic one with appropriate extension
            const extension = item.type === 'video' ? 'mp4' : 
                              item.type === 'audio' ? 'mp3' : 
                              item.type === 'document' ? 'pdf' : 
                              'jpg';
            filename = `vault-${item.type}-${item.timestamp}.${extension}`;
          }
          
          const file = new File([blob], filename, {
            type: mimeType,
            lastModified: item.timestamp
          });
          
          return {
            id: item.id,
            type: item.type,
            url,
            blob,
            file, // Include File object
            timestamp: item.timestamp,
            thumbnail: item.thumbnail,
            fromVault: true // Mark as Vault media to prevent re-uploading
          } as MediaItem;
        } catch (err) {
          console.error('Failed to convert item to MediaItem:', item.id, err);
          return null;
        }
      })
    );

    return mediaItems.filter(item => item !== null) as MediaItem[];
  };

  // 🌫️ SOFT DELETE: Move vault items to Archive
  const softDeleteVaultItems = async (itemIds: string[], currentFolderId?: string, currentFolderName?: string) => {
    if (itemIds.length === 0) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please sign in to move items to Archive');
        return;
      }

      // Determine folder context
      let folderId = currentFolderId;
      let folderName = currentFolderName;
      
      // If no folder specified, check if items belong to a folder
      if (!folderId) {
        const firstItemId = itemIds[0];
        const folder = folders.find(f => f.mediaIds?.includes(firstItemId));
        if (folder) {
          folderId = folder.id;
          folderName = folder.name;
        }
      }

      console.log(`🌫️ Soft deleting ${itemIds.length} vault items (folder: ${folderName || folderId || 'unsorted'})`);

      // Call soft delete endpoint
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/soft-delete-vault`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            itemIds, 
            folderId,
            folderName 
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Soft delete failed:', response.status, errorData);
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Soft deleted ${result.deletedCount} vault items`);
      
    } catch (error) {
      console.error('Error soft deleting vault items:', error);
      // Don't show error toast - soft delete is non-critical (items stay in localStorage)
      console.warn('⚠️ Soft delete failed, but items remain in local storage');
    }
  };

  const deleteItems = async (itemIds: string[]) => {
    if (itemIds.length === 0) return;

    // Always delete from localStorage first
    try {
      const stored = localStorage.getItem('legacyVault');
      if (stored) {
        const vault = JSON.parse(stored);
        const filtered = vault.filter(item => !itemIds.includes(item.id));
        localStorage.setItem('legacyVault', JSON.stringify(filtered));
        console.log(`✅ Deleted ${itemIds.length} items from localStorage`);
      }
    } catch (localErr) {
      console.error('Failed to delete from localStorage:', localErr);
    }

    // Try to delete from backend (but don't block on it)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log(`☁️ Syncing deletion of ${itemIds.length} items to backend...`);
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-vault`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ recordIds: itemIds })
          }
        );

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Synced deletion of ${result.deleted} items to backend`);
        } else if (response.status === 401 || response.status === 403) {
          console.warn('⚠️ Backend deletion permission denied - localStorage deletion completed');
        } else {
          console.warn(`⚠️ Backend deletion failed (${response.status}) - localStorage deletion completed`);
        }
      }
    } catch (err) {
      console.warn('⚠️ Backend deletion error - localStorage deletion completed:', err);
    }
  };

  // 💾 Save media name to backend (works for all media types)
  const saveMediaName = async (itemId: string, newName: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to rename documents');
        return false;
      }

      // 🚫 DUPLICATE CHECK: Prevent duplicate filenames in the same folder
      const currentItem = vaultItems.find(item => item.id === itemId);
      if (currentItem) {
        // Find which folder this item belongs to (if any)
        const itemFolder = folders.find(f => f.mediaIds?.includes(itemId));
        
        // Get all items in the same folder (or unsorted if no folder)
        const siblingItems = itemFolder
          ? vaultItems.filter(item => 
              itemFolder.mediaIds?.includes(item.id) && item.id !== itemId
            )
          : vaultItems.filter(item => {
              // Unsorted items: not in any folder
              const inAnyFolder = folders.some(f => f.mediaIds?.includes(item.id));
              return !inAnyFolder && item.id !== itemId;
            });

        // Check if any sibling has the same filename
        const duplicate = siblingItems.find(item => {
          const itemName = item.fileName || `vault-${item.type}-${item.timestamp}`;
          return itemName.toLowerCase() === newName.toLowerCase();
        });

        if (duplicate) {
          const locationName = itemFolder ? `folder "${itemFolder.name}"` : 'unsorted files';
          toast.error('Duplicate filename', {
            description: `A file named "${newName}" already exists in ${locationName}. Please choose a different name.`
          });
          return false;
        }
      }

      console.log(`💾 Saving document name: ${itemId} → ${newName}`);
      console.log(`💾 URL: https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-vault/${itemId}`);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-vault/${itemId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ fileName: newName })
        }
      );

      console.log(`💾 Response status: ${response.status}`);

      if (!response.ok) {
        let errorMsg = `Server error: ${response.status}`;
        try {
          const error = await response.json();
          console.error('❌ Server error response:', error);
          errorMsg = error.error || errorMsg;
        } catch (e) {
          console.error('❌ Could not parse error response');
        }
        toast.error(`Failed to save: ${errorMsg}`);
        return false;
      }

      const result = await response.json();
      console.log(`✅ Document name saved:`, result);

      // Update local state
      setVaultItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, fileName: newName } : item
      ));

      // Update localStorage
      try {
        const stored = localStorage.getItem('legacyVault');
        if (stored) {
          const vault = JSON.parse(stored);
          const updated = vault.map((item: any) =>
            item.id === itemId ? { ...item, fileName: newName } : item
          );
          localStorage.setItem('legacyVault', JSON.stringify(updated));
        }
      } catch (err) {
        console.warn('Failed to update localStorage:', err);
      }

      toast.success('Document name saved');
      return true;

    } catch (error) {
      console.error('❌ Network error saving document name:', error);
      console.error('❌ Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      toast.error(`Network error: ${error?.message || 'Failed to save'}`);
      return false;
    }
  };

  // 🔒 STABLE FOLDER ITEMS: Compute folder overlay items once per folder
  // This prevents flicker when vaultItems updates during loadVault() sync
  const folderOverlayItems = useMemo(() => {
    console.log('🎨 [FOLDER OVERLAY] useMemo recalculating!');
    console.log('🎨 mobileOpenFolder:', mobileOpenFolder?.id, 'mediaIds:', mobileOpenFolder?.mediaIds?.length);
    console.log('🎨 vaultItems.length:', vaultItems.length);
    
    if (!mobileOpenFolder) {
      console.log('🎨 No folder open - returning empty array');
      return [];
    }
    
    const folderMediaIds = mobileOpenFolder.mediaIds || [];
    const filteredItems = vaultItems.filter(item => folderMediaIds.includes(item.id));
    
    console.log('🎨 Filtered items:', filteredItems.length, 'from', folderMediaIds.length, 'folder IDs');
    console.log('🎨 Folder IDs:', folderMediaIds);
    console.log('🎨 Filtered item IDs:', filteredItems.map(i => i.id));
    
    return filteredItems;
  }, [mobileOpenFolder?.id, mobileOpenFolder?.mediaIds?.join(','), vaultItems]);

  const getFilteredAndSortedItems = (): LibraryItem[] => {
    let filtered = vaultItems;

    // 🌫️ CRITICAL: Filter out soft-deleted items (moved to Archive)
    const beforeDeletedFilter = filtered.length;
    filtered = filtered.filter((item: any) => 
      !item.deletedAt || item.deletedAt === null || item.deletedAt === undefined
    );
    const afterDeletedFilter = filtered.length;
    if (beforeDeletedFilter !== afterDeletedFilter) {
      console.log(`🗑️ Filtered out ${beforeDeletedFilter - afterDeletedFilter} deleted items (${afterDeletedFilter} remaining)`);
    }

    // Apply folder filter first
    if (selectedFolderId) {
      // Show only items in the selected folder
      const selectedFolder = folders.find(f => f.id === selectedFolderId);
      const folderMediaIds = selectedFolder?.mediaIds || [];
      filtered = filtered.filter(item => folderMediaIds.includes(item.id));
    } else {
      // Show only items NOT in any folder (unsorted)
      const allFolderMediaIds = folders.flatMap(f => f.mediaIds || []);
      
      // 🔍 SYNC DIAGNOSTIC: Log unsorted filter calculation
      console.log('🔍 Unsorted filter - Total vault items:', vaultItems.length);
      console.log('🔍 Unsorted filter - Folders loaded:', folders.length);
      console.log('🔍 Unsorted filter - Total items in folders:', allFolderMediaIds.length);
      console.log('🔍 All folder media IDs:', allFolderMediaIds);
      
      // 🔍 DEBUG: Log items before filter
      const itemsBeforeFilter = filtered.map(item => ({ id: item.id, type: item.type, deletedAt: item.deletedAt }));
      console.log('🔍 Items before unsorted filter:', itemsBeforeFilter);
      
      filtered = filtered.filter(item => !allFolderMediaIds.includes(item.id));
      
      // 🔍 DEBUG: Log items after filter
      const itemsAfterFilter = filtered.map(item => ({ id: item.id, type: item.type }));
      console.log('🔍 Items after unsorted filter:', itemsAfterFilter);
      console.log('🔍 Unsorted filter - Items passing filter:', filtered.length);
    }

    // Apply type filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(item => item.type === filterBy);
    }

    // Apply search filter (debounced)
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => {
        // Search by type
        if (item.type.toLowerCase().includes(query)) return true;
        // Search by date
        if (formatDate(item.timestamp).toLowerCase().includes(query)) return true;
        // Search by mime type
        if (item.mimeType?.toLowerCase().includes(query)) return true;
        return false;
      });
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;
      
      filtered = filtered.filter(item => {
        const itemAge = now - item.timestamp;
        
        switch (dateFilter) {
          case 'today':
            return itemAge < oneDayMs;
          case 'week':
            return itemAge < 7 * oneDayMs;
          case 'month':
            return itemAge < 30 * oneDayMs;
          case 'year':
            return itemAge < 365 * oneDayMs;
          default:
            return true;
        }
      });
    }

    // Apply sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.timestamp - a.timestamp;
        case 'oldest':
          return a.timestamp - b.timestamp;
        case 'type-asc':
          return a.type.localeCompare(b.type);
        case 'type-desc':
          return b.type.localeCompare(a.type);
        default:
          return b.timestamp - a.timestamp;
      }
    });

    return sorted;
  };

  const getFileExtension = (mimeType: string): string => {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/quicktime': 'mov',
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/webm': 'webm',
      'audio/ogg': 'ogg',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.ms-powerpoint': 'ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'text/plain': 'txt',
      'application/rtf': 'rtf',
      'text/csv': 'csv',
    };
    return map[mimeType] || 'bin';
  };

  const getMediaType = (mimeType: string): 'photo' | 'video' | 'audio' | 'document' | null => {
    console.log('🔍 getMediaType called with:', mimeType);
    if (mimeType.startsWith('image/')) return 'photo';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    
    // Document detection
    if (mimeType.startsWith('application/pdf') ||
        mimeType.startsWith('application/msword') ||
        mimeType.startsWith('application/vnd.openxmlformats-officedocument') ||
        mimeType.startsWith('application/vnd.ms-') ||
        mimeType.startsWith('text/plain') ||
        mimeType.startsWith('text/csv') ||
        mimeType.startsWith('application/rtf')) {
      console.log('✅ Detected as DOCUMENT');
      return 'document';
    }
    
    console.log('❌ No type detected, returning null');
    return null;
  };

  const saveToLocalStorage = async (item: LibraryItem) => {
    try {
      const stored = localStorage.getItem('legacyVault');
      const vault = stored ? JSON.parse(stored) : [];
      vault.push(item);
      localStorage.setItem('legacyVault', JSON.stringify(vault));
      console.log('✅ Saved to localStorage Vault');
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
      throw err;
    }
  };

  const uploadToBackend = async (file: File, type: 'photo' | 'video' | 'audio' | 'document', thumbnail?: string, targetFolderId?: string | null) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }

    // Determine upload strategy based on file size
    const TUS_THRESHOLD = 50 * 1024 * 1024; // 50MB
    const useTUS = file.size >= TUS_THRESHOLD;

    if (useTUS) {
      // 🚀 LARGE FILES: Use TUS protocol for reliable chunked uploads
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      console.log(`📦 Large file (${sizeMB}MB) - using TUS protocol for vault upload`);
      
      try {
        // Upload using TUS protocol
        const result = await uploadWithTUS(
          file,
          session.user.id,
          'vault_direct', // Special capsule ID for direct vault uploads
          session.access_token,
          {
            onProgress: (progress) => {
              console.log(`📤 Vault upload progress: ${progress}%`);
            }
          }
        );
        
        console.log('✅ TUS upload completed:', result.mediaId);
        
        // ✅ THUMBNAIL FIX: Upload thumbnail to storage if provided
        let thumbnailPath = null;
        if (thumbnail) {
          try {
            console.log('📸 Uploading thumbnail for large video...');
            const thumbnailBlob = await fetch(thumbnail).then(r => r.blob());
            const thumbnailFileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_thumb.jpg`;
            thumbnailPath = `${session.user.id}/vault_direct/${thumbnailFileName}`;
            
            const { error: thumbError } = await supabase.storage
              .from('make-f9be53a7-media')
              .upload(thumbnailPath, thumbnailBlob, {
                cacheControl: '3600',
                upsert: false
              });
            
            if (thumbError) {
              console.warn('⚠️ Thumbnail upload failed (non-critical):', thumbError);
              thumbnailPath = null;
            } else {
              console.log('✅ Uploaded thumbnail:', thumbnailPath);
            }
          } catch (err) {
            console.warn('⚠️ Failed to process thumbnail:', err);
            thumbnailPath = null;
          }
        }
        
        // Now create vault entry using the uploaded file
        const vaultRecord = {
          id: result.mediaId,
          user_id: session.user.id,
          type,
          storage_path: result.filePath,
          thumbnail_path: thumbnailPath, // ✅ Include thumbnail path
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          timestamp: Date.now(),
          folderId: targetFolderId // Include folder ID for atomic association
        };
        
        // Create vault entry via metadata endpoint
        const vaultResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-vault/create-from-storage`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(vaultRecord)
          }
        );
        
        if (!vaultResponse.ok) {
          const errorData = await vaultResponse.json().catch(() => ({}));
          throw new Error(`Failed to create vault entry: ${errorData.error || vaultResponse.statusText}`);
        }
        
        const vaultResult = await vaultResponse.json();
        console.log('✅ Vault entry created via TUS:', result.mediaId);
        
        return vaultResult;
        
      } catch (error) {
        console.error('❌ TUS vault upload failed:', error);
        throw error;
      }
      
    } else {
      // 📦 SMALL FILES: Use existing FormData upload (faster for small files)
      console.log(`📦 Small file (${(file.size / (1024 * 1024)).toFixed(1)}MB) - using FormData upload`);
      
      const formData = new FormData();
      formData.append('file', file, `${type}-${Date.now()}.${getFileExtension(file.type)}`);
      formData.append('type', type);
      
      // 🔥 CRITICAL FIX: Send folderId to backend for atomic association
      if (targetFolderId) {
        formData.append('folderId', targetFolderId);
        console.log(`🔗 [ATOMIC] Sending folderId ${targetFolderId} to backend for atomic folder association`);
      }
      
      if (thumbnail) {
        const thumbnailBlob = await fetch(thumbnail).then(r => r.blob());
        formData.append('thumbnail', thumbnailBlob, `thumb-${Date.now()}.jpg`);
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-vault/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Enhanced error message for file size issues
        if (response.status === 413 || errorData.statusCode === '413') {
          throw new Error('File too large. Maximum file size is 500MB.');
        }
        
        throw new Error(errorData.error || 'Upload failed');
      }

      return await response.json();
    }
  };

  const handleFileUpload = async (files: FileList | null, targetFolderId: string | null = null) => {
    if (!files || files.length === 0) return;

    // 🔒 NUCLEAR: Block loadVault during entire upload process
    uploadInProgressRef.current = true;
    console.log('🔒 Upload started - loadVault() blocked');
    console.log('🔒 Lock state:', uploadInProgressRef.current);
    console.log('📁 Target folder ID for upload:', targetFolderId);
    console.log('📁 Selected folder ID state:', selectedFolderId);

    setIsUploading(true);
    let filesArray = Array.from(files);
    let successCount = 0;
    let errorCount = 0;
    let typeRejectedCount = 0; // Track files rejected due to folder type restrictions
    const optimisticItems: LibraryItem[] = []; // For instant UI updates
    const backgroundTasks: Promise<string | null>[] = []; // Track backend uploads

    // Get target folder info if uploading to a folder
    const targetFolder = targetFolderId ? folders.find(f => f.id === targetFolderId) : null;
    const folderName = targetFolder?.name || 'Vault';

    // Validate file sizes upfront - Industry standard limit is 500MB
    const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB in bytes (industry standard)
    const oversizedFiles = filesArray.filter(file => file.size > MAX_FILE_SIZE);
    
    if (oversizedFiles.length > 0) {
      const formatSize = (bytes: number) => {
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(1)}MB`;
      };
      
      const fileList = oversizedFiles.map(f => `${f.name} (${formatSize(f.size)})`).join(', ');
      toast.error(
        oversizedFiles.length === 1
          ? `File too large: ${fileList}. Maximum size is 500MB.`
          : `${oversizedFiles.length} files are too large. Maximum size is 500MB per file.`,
        { duration: 5000 }
      );
      
      // Continue with valid files
      filesArray = filesArray.filter(file => file.size <= MAX_FILE_SIZE);
      if (filesArray.length === 0) {
        setIsUploading(false);
        uploadInProgressRef.current = false;
        return;
      }
    }

    // ✅ REMOVED QuickTime/MOV restriction - modern browsers support .mov files well
    // iPhones save videos as .mov by default, so we now accept them
    // ✅ WebM (.webm) is also fully supported

    // Process all files in parallel for speed
    const filePromises = filesArray.map(async (file) => {
      try {
        const mediaType = getMediaType(file.type);
        if (!mediaType) {
          console.warn(`Skipping unsupported file type: ${file.type}`);
          return { success: false };
        }

        // Check if uploading to a PERMANENT system folder (type-restricted)
        if (targetFolder) {
          const isPermanentFolder = PERMANENT_FOLDERS.includes(targetFolder.name);
          
          if (isPermanentFolder) {
            let expectedType: 'photo' | 'video' | 'audio' | 'document' | null = null;
            if (targetFolder.name === 'Photos') expectedType = 'photo';
            else if (targetFolder.name === 'Videos') expectedType = 'video';
            else if (targetFolder.name === 'Audio') expectedType = 'audio';
            else if (targetFolder.name === 'Documents') expectedType = 'document';
            
            if (expectedType && mediaType !== expectedType) {
              console.warn(`Skipping ${mediaType} file for ${expectedType}-only folder: ${targetFolder.name}`);
              return { success: false, typeRestricted: true };
            }
          }
        }

        // 🎥 MEMORY FIX: For videos, use blob URLs instead of base64 to avoid memory issues
        // Only convert small files (photos, documents) to base64
        let base64Data: string;
        
        if (mediaType === 'video' || file.size > 10 * 1024 * 1024) { // Videos or files > 10MB
          // 🎥 MEMORY FIX: Use blob URL directly without creating new File object
          // Creating new File([file], ...) causes memory duplication for large files
          base64Data = URL.createObjectURL(file);
          console.log('📦 Using blob URL for large file:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB', 'Type:', file.type);
        } else {
          // Convert small files to base64 for immediate display
          base64Data = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
        }

        // Create optimistic item with base64 data or blob URL (thumbnails generated in background)
        const libraryItem: LibraryItem = {
          id: `optimistic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: mediaType,
          base64Data,
          timestamp: Date.now(),
          thumbnail: (mediaType === 'photo' && !base64Data.startsWith('blob:')) ? base64Data : undefined, // Photos can use base64 as thumbnail (but not blob URLs)
          mimeType: file.type === 'video/quicktime' ? 'video/mp4' : file.type, // Fix MIME type for QuickTime
          duration: undefined // Will be calculated in background
        };
        
        console.log('📦 Created optimistic item:', {
          id: libraryItem.id,
          type: libraryItem.type,
          fileName: file.name,
          mimeType: libraryItem.mimeType,
          mediaType: mediaType
        });

        // Generate thumbnails and upload in background (non-blocking)
        const backgroundTask = (async (): Promise<string | null> => {
          try {
            let thumbnail: string | undefined;
            let duration: number | undefined;
            
            if (mediaType === 'video') {
              // 🎥 THUMBNAIL FIX: Generate lightweight thumbnails for ALL videos
              // Use smaller canvas size for large videos to minimize memory usage
              const isLargeVideo = file.size > 100 * 1024 * 1024; // 100MB threshold
              
              if (isLargeVideo) {
                console.log('📸 Generating lightweight thumbnail for large video:', file.name, 
                           'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
              }
              
              try {
                const result = await new Promise<{ thumbnail: string; duration: number }>((resolve, reject) => {
                  const video = document.createElement('video');
                  video.preload = 'metadata';
                  video.onloadedmetadata = () => {
                    const videoDuration = video.duration;
                    video.currentTime = Math.min(0.1, videoDuration / 10); // Sample from first 10%
                    video.onseeked = () => {
                      const canvas = document.createElement('canvas');
                      // ✅ Use smaller canvas for large videos (reduces memory usage by 75%)
                      canvas.width = isLargeVideo ? 100 : 200;
                      canvas.height = isLargeVideo ? 75 : 150;
                      const ctx = canvas.getContext('2d');
                      if (ctx) {
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        resolve({ 
                          // ✅ Lower quality for large videos (reduces file size by ~50%)
                          thumbnail: canvas.toDataURL('image/jpeg', isLargeVideo ? 0.5 : 0.7),
                          duration: videoDuration
                        });
                      } else {
                        reject(new Error('Failed to create canvas context'));
                      }
                      URL.revokeObjectURL(video.src);
                      video.remove();
                    };
                  };
                  video.onerror = () => {
                    URL.revokeObjectURL(video.src);
                    video.remove();
                    reject(new Error('Video load failed'));
                  };
                  video.src = URL.createObjectURL(file);
                });
                thumbnail = result.thumbnail;
                duration = result.duration;
              } catch (err) {
                console.warn('⚠️ Thumbnail generation failed (non-critical):', err);
                // Continue without thumbnail
                thumbnail = undefined;
                duration = undefined;
              }
            } else if (mediaType === 'audio') {
              duration = await new Promise<number>((resolve, reject) => {
                const audio = document.createElement('audio');
                audio.preload = 'metadata';
                audio.onloadedmetadata = () => {
                  resolve(audio.duration);
                  URL.revokeObjectURL(audio.src);
                  audio.remove();
                };
                audio.onerror = () => {
                  URL.revokeObjectURL(audio.src);
                  audio.remove();
                  reject(new Error('Failed to load audio metadata'));
                };
                audio.src = URL.createObjectURL(file);
              });
            }

            // Upload to backend with targetFolderId for atomic association
            const backendResponse = await uploadToBackend(file, mediaType, thumbnail, targetFolderId);
            console.log('✅ Uploaded to backend:', file.name);
            const backendMediaId = backendResponse?.record?.id || null;
            console.log('📝 Backend returned ID:', backendMediaId);
            return backendMediaId;
          } catch (backendErr) {
            console.warn('⚠️ Backend upload failed for:', file.name, backendErr);
            // Fallback to localStorage
            await saveToLocalStorage(libraryItem);
            return null;
          }
        })();
        
        backgroundTasks.push(backgroundTask);

        return { success: true, item: libraryItem };
      } catch (err) {
        console.error('Failed to process file:', file.name, err);
        return { success: false };
      }
    });

    // Wait for initial processing (base64 conversion only - fast!)
    const results = await Promise.all(filePromises);
    
    results.forEach(result => {
      if (result.success) {
        optimisticItems.push(result.item!);
        successCount++;
      } else {
        if (result.typeRestricted) {
          typeRejectedCount++;
        } else {
          errorCount++;
        }
      }
    });

    // 🚀 INSTANT UPDATE: Show files in UI immediately
    if (optimisticItems.length > 0) {
      // Track optimistic IDs to preserve them during loadVault refreshes
      const optimisticIds = optimisticItems.map(item => item.id);
      console.log('🎯 Adding optimistic items:', optimisticIds);
      console.log('🔒 Current lock state:', uploadInProgressRef.current);
      setOptimisticItemIds(prev => new Set([...prev, ...optimisticIds]));
      
      setVaultItems(prev => {
        console.log('📝 setVaultItems: Adding', optimisticItems.length, 'optimistic items');
        console.log('📝 Optimistic items types:', optimisticItems.map(item => ({ id: item.id, type: item.type, mimeType: item.mimeType })));
        console.log('📝 Previous count:', prev.length, '→ New count:', prev.length + optimisticItems.length);
        return [...prev, ...optimisticItems];
      });
      
      // If uploading to a folder, update folder's mediaIds immediately
      if (targetFolderId) {
        setFolders(prevFolders => 
          prevFolders.map(f => 
            f.id === targetFolderId 
              ? { ...f, mediaIds: [...(f.mediaIds || []), ...optimisticIds] }
              : f
          )
        );
        
        // Update mobileOpenFolder if it's the target folder
        if (mobileOpenFolder && mobileOpenFolder.id === targetFolderId) {
          setMobileOpenFolder({
            ...mobileOpenFolder,
            mediaIds: [...(mobileOpenFolder.mediaIds || []), ...optimisticIds]
          });
        }
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      const folderMessage = targetFolderId ? ` to ${folderName}` : ' to Vault';
      toast.success(`Uploaded ${successCount} file${successCount !== 1 ? 's' : ''}${folderMessage}`);
    }

    if (typeRejectedCount > 0) {
      const folderTypeName = targetFolder?.name || '';
      const expectedType = 
        folderTypeName === 'Photos' ? 'images' :
        folderTypeName === 'Videos' ? 'videos' :
        folderTypeName === 'Audio' ? 'audio files' :
        folderTypeName === 'Documents' ? 'documents' : 'compatible files';
      
      toast.error(
        `${typeRejectedCount} file${typeRejectedCount !== 1 ? 's' : ''} rejected`,
        {
          description: `${folderTypeName} folder only accepts ${expectedType}`
        }
      );
    }

    if (errorCount > 0) {
      toast.error(`Failed to upload ${errorCount} file${errorCount !== 1 ? 's' : ''}`);
    }

    // 🔄 BACKGROUND: Wait for all uploads to complete, then refresh ONCE
    if (backgroundTasks.length > 0) {
      const optimisticIds = optimisticItems.map(item => item.id);
      (async () => {
        console.log('⏳ Waiting for', backgroundTasks.length, 'background uploads...');
        const backendMediaIds = await Promise.all(backgroundTasks);
        const validIds = backendMediaIds.filter(id => id !== null) as string[];
        console.log('✅ All uploads complete! Got', validIds.length, 'backend IDs');
        
        // Move to folder if needed (batch operation)
        if (targetFolderId && validIds.length > 0) {
          // 🔥 ATOMIC FIX: Backend now handles folder association during upload
          // No need to call moveMediaToFolder - just replace optimistic IDs
          console.log('🔥 [ATOMIC] Skipping moveMediaToFolder - backend handled it atomically');
          
          // 🔧 CRITICAL FIX: Replace optimistic IDs with real IDs in vaultItems FIRST!
          // This ensures the filter can find all items when mobileOpenFolder updates
          setVaultItems(prevItems => 
            prevItems.map(item => {
              const index = optimisticIds.indexOf(item.id);
              if (index !== -1) {
                console.log(`🔄 Replaced optimistic ID in vaultItems: ${item.id} → ${validIds[index]}`);
                return { ...item, id: validIds[index] };
              }
              return item;
            })
          );
          
          // Then update folder state
          setFolders(prevFolders => 
            prevFolders.map(f => {
              if (f.id === targetFolderId) {
                const updatedMediaIds = (f.mediaIds || []).map(id => {
                  const index = optimisticIds.indexOf(id);
                  return index !== -1 ? validIds[index] : id;
                });
                console.log(`🔄 Replaced optimistic IDs in folder "${f.name}":`, optimisticIds, '→', validIds);
                return { ...f, mediaIds: updatedMediaIds };
              }
              return f;
            })
          );
          
          // Update mobileOpenFolder if it's the target folder
          if (mobileOpenFolder && mobileOpenFolder.id === targetFolderId) {
            // 🔒 CRITICAL: Use the UPDATED folder from folders state, not the stale mobileOpenFolder!
            // This ensures we have all the latest IDs including previous uploads
            setFolders(prevFolders => {
              const updatedFolder = prevFolders.find(f => f.id === targetFolderId);
              if (updatedFolder) {
                setMobileOpenFolder(updatedFolder);
                console.log(`🔄 Replaced optimistic IDs in mobileOpenFolder (now has ${updatedFolder.mediaIds?.length} items)`);
              }
              return prevFolders; // No change to folders, just using them to get latest data
            });
          }
        }
        
        // Clear optimistic IDs now that backend has real data
        setOptimisticItemIds(prev => {
          const newSet = new Set(prev);
          optimisticIds.forEach(id => newSet.delete(id));
          return newSet;
        });
        
        // 🔓 NUCLEAR: Unlock loadVault() before final refresh
        uploadInProgressRef.current = false;
        console.log('🔓 Upload complete - loadVault() unblocked');
        console.log('🔓 Lock state:', uploadInProgressRef.current);
        
        // 🔒 NUCLEAR: Block folder cleanup briefly (500ms) for stability
        cleanupBlockedUntilRef.current = Date.now() + 500;
        console.log('🔒 Folder cleanup blocked for 500ms for stability');
        
        // ✅ SYNC: Reload folders and vault to ensure cross-device consistency
        // Small delay to let backend writes complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('🔄 Syncing vault and folders from backend after upload...');
        await Promise.all([
          loadVault(),
          loadFolders()
        ]);
        console.log('✅ Upload complete - vault and folders synced from backend');
        
        // 🔄 CRITICAL FIX: Force UI update after background sync
        // Update lastSyncTime to ensure displayedItems useMemo recalculates
        setLastSyncTime(Date.now());
      })();
    } else {
      // No background tasks - unlock immediately
      uploadInProgressRef.current = false;
      cleanupBlockedUntilRef.current = Date.now() + 500;
      console.log('🔓 No background tasks - loadVault() unblocked');
      console.log('🔒 Folder cleanup blocked for 500ms');
    }
  };

  // ============================================
  // FOLDER MANAGEMENT FUNCTIONS
  // ============================================

  const loadFolders = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('🗂️ No session - skipping folder load');
        setFoldersLoaded(true); // 🔧 FIX: Mark folders as loaded even without session
        return;
      }

      console.log('📥 loadFolders() executing...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/vault/metadata`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        const loadedFolders = result.metadata?.folders || [];
        
        // 🔍 SYNC DIAGNOSTIC: Log folder details with media IDs
        console.log('🗂️ Loaded folders from backend:', loadedFolders.length);
        loadedFolders.forEach(folder => {
          console.log(`  📁 ${folder.name}: ${folder.mediaIds?.length || 0} items`, folder.mediaIds || []);
        });
        
        setFolders(loadedFolders);
        
        // Auto-create permanent system folders if they don't exist
        const foldersCreated = await ensurePermanentFolders(loadedFolders);
        
        // If any folders were created, reload to get them in state
        if (foldersCreated) {
          console.log('🔄 Reloading folders after creating permanent folders...');
          const reloadResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/vault/folders`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ action: 'list' })
            }
          );
          if (reloadResponse.ok) {
            const reloadResult = await reloadResponse.json();
            const reloadedFolders = reloadResult.metadata?.folders || [];
            setFolders(reloadedFolders);
            console.log('✅ Folders reloaded:', reloadedFolders.length);
          }
        }
        
        console.log('✅ loadFolders() complete');
        setFoldersLoaded(true); // 🔧 FIX: Mark folders as loaded
        setLastSyncTime(Date.now());
      } else {
        console.error(`❌ Failed to load folders (${response.status})`);
        setFoldersLoaded(true); // 🔧 FIX: Mark folders as loaded even on error
      }
    } catch (err) {
      console.error('❌ Failed to load folders:', err);
      setFoldersLoaded(true); // 🔧 FIX: Mark folders as loaded even on error
    }
  };

  // Ensure permanent system folders exist
  const ensurePermanentFolders = async (currentFolders: any[]): Promise<boolean> => {
    // Permanent folders with EXCLUSIVE icons (not used in templates)
    const permanentFolders = [
      { name: 'Photos', color: 'blue', icon: '🖼️', description: 'Your photo collection' },
      { name: 'Videos', color: 'purple', icon: '📹', description: 'Video recordings and clips' },
      { name: 'Audio', color: 'green', icon: '🎧', description: 'Voice memos and audio files' },
      { name: 'Documents', color: 'orange', icon: '📄', description: 'Important documents and files' }
    ];

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    let foldersCreated = false;

    for (const folder of permanentFolders) {
      // CRITICAL FIX: Use EXACT name match only to prevent duplicate folder creation
      // Previously used .includes() which caused "My Documents" to match "Documents", creating duplicates
      const existingFolder = currentFolders.find(f => 
        f.name === folder.name
      );
      
      if (!existingFolder) {
        // Create new permanent folder WITHOUT reloading folders (prevents infinite loop)
        console.log(`📁 Auto-creating permanent folder: ${folder.name}`);
        // ✅ FIX: Pass parameters in correct order (name, color, icon, isPrivate, password, description, isTemplateFolder, skipReload)
        await createFolder(folder.name, folder.color, folder.icon, false, undefined, folder.description, false, true);
        foldersCreated = true;
      } else if (!existingFolder.icon || existingFolder.icon !== folder.icon) {
        // Update existing folder with exclusive icon and description
        console.log(`🔄 Updating permanent folder with exclusive icon: ${folder.name}`);
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/vault/folders`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                action: 'update_metadata',
                folderId: existingFolder.id,
                icon: folder.icon,
                description: folder.description,
                isTemplateFolder: false
              })
            }
          );
          
          if (response.ok) {
            console.log(`✅ Updated ${folder.name} with icon ${folder.icon}`);
          }
        } catch (error) {
          console.error(`Failed to update folder ${folder.name}:`, error);
        }
      }
    }
    
    return foldersCreated;
  };

  const handlePasswordUnlock = async (password: string) => {
    if (!passwordFolder) return;

    try {
      // If folder has no password hash (legacy or error), allow access or fail?
      // Assuming all private folders have a hash.
      if (!passwordFolder.passwordHash) {
         // Fallback for folders that are marked private but have no password set (shouldn't happen with new logic)
         console.warn('Private folder has no password hash');
         setUnlockedFolders(prev => new Set(prev).add(passwordFolder.id));
         setShowPasswordDialog(false);
         setMobileOpenFolder(passwordFolder);
         setPasswordFolder(null);
         return;
      }

      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      if (hashHex === passwordFolder.passwordHash) {
        setUnlockedFolders(prev => new Set(prev).add(passwordFolder.id));
        setShowPasswordDialog(false);
        setMobileOpenFolder(passwordFolder);
        setPasswordFolder(null);
        toast.success('Folder unlocked');
        
        // Track achievement if applicable
      } else {
        toast.error('Incorrect password');
      }
    } catch (err) {
      console.error('Password verification failed:', err);
      toast.error('Verification failed');
    }
  };

  const createFolder = async (
    name: string, 
    color: string = 'blue', 
    icon?: string, 
    isPrivate: boolean = false,
    password?: string,
    description?: string,
    isTemplateFolder: boolean = false,
    skipReload: boolean = false // Skip reload to prevent infinite loop when called from ensurePermanentFolders
  ) => {
    setIsFolderOperationLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to create folders');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/vault/folders`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'create',
            folderName: name,
            color: color,
            icon: icon || null,
            description: description || null,
            isTemplateFolder: isTemplateFolder,
            isPrivate: isPrivate,
            password: password
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        
        // Only show toast and reload if not skipping (i.e., user-initiated creation)
        if (!skipReload) {
          toast.success(`Created folder "${name}"`);
          await loadFolders();
          setShowFolderDialog(false);
          
          // Track achievement - Phase 4B (A046: Memory Architect)
          if (session?.access_token) {
            trackAction('vault_folder_created', { folderName: name, color }, session.access_token);
          }
        } else {
          console.log(`✅ Permanent folder "${name}" created successfully (silent)`);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create folder');
      }
    } catch (err) {
      console.error('Failed to create folder:', err);
      toast.error('Failed to create folder');
    } finally {
      setIsFolderOperationLoading(false);
    }
  };

  const renameFolder = async (
    name: string, 
    color: string = 'blue', 
    icon?: string,
    isPrivate: boolean = false,
    password?: string
  ) => {
    if (!editingFolder) return;
    
    // Prevent renaming permanent folders
    if (PERMANENT_FOLDERS.includes(editingFolder.name)) {
      toast.error('Cannot rename system folders');
      setShowFolderDialog(false);
      return;
    }
    
    setIsFolderOperationLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to rename folders');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/vault/folders`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'rename',
            folderId: editingFolder.id,
            folderName: name,
            color: color,
            icon: icon || editingFolder.icon || null,
            isPrivate: isPrivate,
            password: password
          })
        }
      );

      if (response.ok) {
        toast.success(`Renamed to "${name}"`);
        await loadFolders();
        setShowFolderDialog(false);
        setEditingFolder(null);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to rename folder');
      }
    } catch (err) {
      console.error('Failed to rename folder:', err);
      toast.error('Failed to rename folder');
    } finally {
      setIsFolderOperationLoading(false);
    }
  };

  const deleteFolder = async () => {
    if (!folderToDelete) return;
    
    // Prevent deleting permanent folders
    if (PERMANENT_FOLDERS.includes(folderToDelete.name)) {
      toast.error('Cannot delete system folders');
      setShowDeleteFolderDialog(false);
      setFolderToDelete(null);
      return;
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to delete folders');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/vault/folders`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'delete',
            folderId: folderToDelete.id
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        const movedCount = result.movedMediaCount || 0;
        toast.success(`Deleted folder "${folderToDelete.name}"${movedCount > 0 ? ` (${movedCount} items moved to unsorted)` : ''}`);
        await loadFolders();
        setShowDeleteFolderDialog(false);
        setFolderToDelete(null);
        if (selectedFolderId === folderToDelete.id) {
          setSelectedFolderId(null);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete folder');
      }
    } catch (err) {
      console.error('Failed to delete folder:', err);
      toast.error('Failed to delete folder');
    }
  };

  // DISABLED: Folder-level Legacy Access - now redirects to global settings
  // Keeping this code for potential future use if per-folder permissions are re-enabled
  /*
  const handleSaveLegacyAccess = async (folderId: string, legacyAccess: FolderLegacyAccess) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to configure Legacy Access');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/vault/folders`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'update_legacy_access',
            folderId: folderId,
            legacyAccess: legacyAccess
          })
        }
      );

      if (response.ok) {
        // Update local folder state
        setFolders(prevFolders => 
          prevFolders.map(f => 
            f.id === folderId ? { ...f, legacyAccess } : f
          )
        );
        toast.success('Legacy Access settings saved');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save Legacy Access settings');
      }
    } catch (err) {
      console.error('Failed to save legacy access:', err);
      toast.error('Failed to save settings');
    }
  };
  */

  const moveMediaToFolder = async (mediaIds: string | string[], folderId: string | null, silent: boolean = false) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('⚠️ No session for moving media');
        return;
      }

      // Normalize to array
      const idsArray = Array.isArray(mediaIds) ? mediaIds : [mediaIds];
      const isBatch = idsArray.length > 1;

      // 🚫 DUPLICATE FILENAME CHECK: Prevent moving files with duplicate names
      if (folderId) {
        const targetFolder = folders.find(f => f.id === folderId);
        if (targetFolder) {
          // Get items being moved
          const itemsToMove = vaultItems.filter(item => idsArray.includes(item.id));
          
          // Get existing items in target folder
          const existingItems = vaultItems.filter(item => 
            targetFolder.mediaIds?.includes(item.id)
          );

          // Check for filename conflicts
          const conflicts: Array<{ movingItem: LibraryItem, existingItem: LibraryItem }> = [];
          
          itemsToMove.forEach(movingItem => {
            const movingName = (movingItem.fileName || `vault-${movingItem.type}-${movingItem.timestamp}`).toLowerCase();
            
            const conflictingItem = existingItems.find(existingItem => {
              const existingName = (existingItem.fileName || `vault-${existingItem.type}-${existingItem.timestamp}`).toLowerCase();
              return existingName === movingName;
            });
            
            if (conflictingItem) {
              conflicts.push({ movingItem, existingItem: conflictingItem });
            }
          });

          if (conflicts.length > 0) {
            if (isBatch) {
              toast.error(`Cannot move ${conflicts.length} file${conflicts.length > 1 ? 's' : ''}`, {
                description: `${conflicts.length} file${conflicts.length > 1 ? 's have' : ' has'} duplicate name${conflicts.length > 1 ? 's' : ''} in "${targetFolder.name}". Please rename ${conflicts.length > 1 ? 'them' : 'it'} first.`
              });
            } else {
              const conflictName = conflicts[0].movingItem.fileName || `vault-${conflicts[0].movingItem.type}-${conflicts[0].movingItem.timestamp}`;
              toast.error('Duplicate filename', {
                description: `A file named "${conflictName}" already exists in "${targetFolder.name}". Please rename it first.`
              });
            }
            return;
          }
        }
      }

      // TYPE RESTRICTION: Validate media types for PERMANENT system folders only
      if (folderId) {
        const targetFolder = folders.find(f => f.id === folderId);
        if (targetFolder) {
          // Check if this is one of the PERMANENT system folders (Photos, Videos, Audio, Documents)
          const isPermanentFolder = PERMANENT_FOLDERS.includes(targetFolder.name);
          
          if (isPermanentFolder) {
            // Determine expected type based on permanent folder name (EXACT match)
            let expectedType: 'photo' | 'video' | 'audio' | 'document' | null = null;
            if (targetFolder.name === 'Photos') expectedType = 'photo';
            else if (targetFolder.name === 'Videos') expectedType = 'video';
            else if (targetFolder.name === 'Audio') expectedType = 'audio';
            else if (targetFolder.name === 'Documents') expectedType = 'document';

            // Get the media items being moved
            const itemsToMove = vaultItems.filter(item => idsArray.includes(item.id));
            
            // Check if any items don't match the expected type
            const invalidItems = itemsToMove.filter(item => item.type !== expectedType);
            
            if (invalidItems.length > 0) {
              const folderTypeName = expectedType === 'photo' ? 'Photos' : expectedType === 'video' ? 'Videos' : expectedType === 'audio' ? 'Audio' : 'Documents';
              
              if (isBatch) {
                // For batch operations, filter out invalid items and only move valid ones
                const validItems = itemsToMove.filter(item => item.type === expectedType);
                
                if (validItems.length === 0) {
                  toast.error(`Cannot move to ${targetFolder.name}`, {
                    description: `This folder only accepts ${expectedType} files. All ${invalidItems.length} selected items are incompatible.`
                  });
                  return;
                } else {
                  // Move only valid items and show warning about skipped items
                  toast.warning(`Moved ${validItems.length} of ${itemsToMove.length} items`, {
                    description: `Skipped ${invalidItems.length} incompatible ${invalidItems.length === 1 ? 'file' : 'files'}. ${targetFolder.name} only accepts ${expectedType} files.`
                  });
                  // Update idsArray to only include valid items
                  const validIds = validItems.map(item => item.id);
                  idsArray.length = 0;
                  idsArray.push(...validIds);
                }
              } else {
                // For single item, show error
                const itemType = itemsToMove[0]?.type || 'unknown';
                toast.error(`Cannot move ${itemType} to ${targetFolder.name}`, {
                  description: `This folder only accepts ${expectedType} files. Create a custom folder to store mixed media types.`
                });
                return;
              }
            }
          }
        }
      }

      console.log(`🔄 Moving ${idsArray.length} item(s) to folder:`, folderId || 'Unsorted');
      console.log(`📋 Media IDs being moved:`, idsArray);
      console.log(`🎯 Target folder ID:`, folderId, `(null = Unsorted)`);

      // 🚀 OPTIMISTIC UPDATE: Update folders state immediately for instant UI response
      setFolders(prevFolders => {
        const updatedFolders = prevFolders.map(folder => ({
          ...folder,
          // Remove these media IDs from ALL folders first (critical for "unsorted" calculation)
          mediaIds: (folder.mediaIds || []).filter(id => !idsArray.includes(id))
        }));
        
        // If moving to a specific folder, add the IDs to that folder
        if (folderId) {
          const targetFolderIndex = updatedFolders.findIndex(f => f.id === folderId);
          if (targetFolderIndex !== -1) {
            const existingIds = updatedFolders[targetFolderIndex].mediaIds || [];
            // Only add IDs that aren't already there
            const newIds = idsArray.filter(id => !existingIds.includes(id));
            updatedFolders[targetFolderIndex] = {
              ...updatedFolders[targetFolderIndex],
              mediaIds: [...existingIds, ...newIds]
            };
          }
        }
        
        console.log('🚀 [OPTIMISTIC] Updated folders state immediately');
        return updatedFolders;
      });
      
      // Also update mobileOpenFolder if it's affected
      if (mobileOpenFolder) {
        setMobileOpenFolder(prevFolder => {
          if (!prevFolder) return null;
          
          // If this is the target folder, add the items
          if (folderId === prevFolder.id) {
            const existingIds = prevFolder.mediaIds || [];
            const newIds = idsArray.filter(id => !existingIds.includes(id));
            return {
              ...prevFolder,
              mediaIds: [...existingIds, ...newIds]
            };
          }
          
          // If this is the source folder, remove the items
          if ((prevFolder.mediaIds || []).some(id => idsArray.includes(id))) {
            return {
              ...prevFolder,
              mediaIds: (prevFolder.mediaIds || []).filter(id => !idsArray.includes(id))
            };
          }
          
          return prevFolder;
        });
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/vault/folders`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'move_media',
            mediaIds: idsArray,
            folderId: folderId // null means move to unsorted
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Move successful:', result);
        
        if (!silent) {
          const folderName = folderId 
            ? folders.find(f => f.id === folderId)?.name || 'folder'
            : 'Unsorted';
          
          if (isBatch) {
            toast.success(`Moved ${idsArray.length} items to ${folderName}`, {
              description: `${idsArray.length} media items organized successfully`
            });
            // Clear selection after batch move
            clearSelection();
          } else {
            toast.success(`Moved to ${folderName}`);
          }
        }
        
        // Track achievement - Phase 4B (A047: Vault Curator)
        if (folderId && session?.access_token) {
          trackAction('vault_media_organized', { 
            count: idsArray.length, 
            folderId,
            isBatch 
          }, session.access_token);
        }
        
        // 🔄 SYNC: Reload from backend to ensure consistency (sequential to avoid race)
        await loadFolders();
        await loadVault();
        console.log('✅ Folders and vault synced with backend after move');
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to move media' }));
        console.error('❌ Move failed:', error);
        
        // 🔴 REVERT: Reload to revert optimistic update
        await Promise.all([
          loadFolders(),
          loadVault()
        ]);
        
        if (!silent) {
          toast.error(error.error || 'Failed to move media');
        }
      }
    } catch (err) {
      console.error('❌ Failed to move media:', err);
      
      // 🔴 REVERT: Reload to revert optimistic update
      await Promise.all([
        loadFolders(),
        loadVault()
      ]);
      
      if (!silent) {
        toast.error('Failed to move media');
      }
    }
  };

  // 🧹 Clean up optimistic IDs from backend folders
  const cleanupOptimisticIdsFromBackend = async () => {
    try {
      console.log('🧹 cleanupOptimisticIdsFromBackend() called');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('🧹 No session - aborting cleanup');
        return;
      }
      
      // Fetch current vault items from backend
      const vaultResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-vault`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );
      
      if (!vaultResponse.ok) {
        console.error('🧹 Failed to fetch vault items');
        return;
      }
      
      const vaultData = await vaultResponse.json();
      const validItemIds = new Set(vaultData.records.map((r: any) => r.id));
      console.log('🧹 Valid vault item IDs count:', validItemIds.size);
      
      // Get current folders from backend
      const foldersResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/vault/metadata`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      );
      
      if (!foldersResponse.ok) {
        console.error('🧹 Failed to fetch folders');
        return;
      }
      
      const foldersData = await foldersResponse.json();
      const currentFolders = foldersData.metadata?.folders || [];
      console.log('🧹 Current backend folders count:', currentFolders.length);
      
      // Check each folder for invalid (optimistic) IDs
      let cleanupNeeded = false;
      const cleanupPromises = currentFolders.map(async (folder: any) => {
        const folderMediaIds = folder.mediaIds || [];
        const validMediaIds = folderMediaIds.filter(id => validItemIds.has(id));
        const invalidMediaIds = folderMediaIds.filter(id => !validItemIds.has(id));
        
        // If folder has invalid IDs, clean them up
        if (validMediaIds.length !== folderMediaIds.length) {
          const removedCount = folderMediaIds.length - validMediaIds.length;
          console.log(`🧹 Cleaning backend folder "${folder.name}": removing ${removedCount} invalid ID(s)`);
          console.log(`🧹 Invalid IDs to remove:`, invalidMediaIds);
          cleanupNeeded = true;
          
          // Update folder on backend with only valid IDs
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/vault/folders`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                action: 'update_folder',
                folderId: folder.id,
                updates: {
                  mediaIds: validMediaIds
                }
              })
            }
          );
          
          if (!response.ok) {
            console.error(`❌ Failed to clean folder "${folder.name}":`, await response.text());
          } else {
            console.log(`✅ Cleaned folder "${folder.name}" successfully`);
          }
        }
      });
      
      await Promise.all(cleanupPromises);
      
      if (cleanupNeeded) {
        // Reload folders to get cleaned data
        await loadFolders();
        console.log('✅ Backend folders cleaned successfully');
        toast.success('Vault folders cleaned up! 🧹', {
          description: 'Removed stale IDs from backend folders'
        });
      } else {
        console.log('✅ No cleanup needed - all folder IDs are valid');
      }
    } catch (err) {
      console.error('❌ Failed to cleanup optimistic IDs:', err);
      toast.error('Failed to clean up folders');
    }
  };

  // Auto-organize media by type
  const autoOrganizeByType = async () => {
    // Get all media IDs that are already in folders
    const allFolderMediaIds = folders.flatMap(f => f.mediaIds || []);
    // Filter to only unsorted media
    const unsortedMedia = vaultItems.filter(item => !allFolderMediaIds.includes(item.id));
    if (unsortedMedia.length === 0) {
      toast.info('All media is already organized!');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Group media by type
      const photoIds = unsortedMedia.filter(m => m.type === 'photo').map(m => m.id);
      const videoIds = unsortedMedia.filter(m => m.type === 'video').map(m => m.id);
      const audioIds = unsortedMedia.filter(m => m.type === 'audio').map(m => m.id);
      const documentIds = unsortedMedia.filter(m => m.type === 'document').map(m => m.id);

      // Track which folders need to be created - Check EXACT names to prevent duplicates
      const needsPhotoFolder = photoIds.length > 0 && !folders.find(f => f.name === 'Photos');
      const needsVideoFolder = videoIds.length > 0 && !folders.find(f => f.name === 'Videos');
      const needsAudioFolder = audioIds.length > 0 && !folders.find(f => f.name === 'Audio');
      const needsDocumentFolder = documentIds.length > 0 && !folders.find(f => f.name === 'Documents');

      console.log('🔍 Auto-organize folder check:', {
        needsPhotoFolder,
        needsVideoFolder,
        needsAudioFolder,
        needsDocumentFolder,
        existingFolderNames: folders.map(f => f.name)
      });

      // Auto-create missing folders with exclusive icons
      // ✅ FIX: Pass parameters in correct order - skipReload must be true to suppress toast notifications
      // createFolder signature: (name, color, icon, isPrivate, password, description, isTemplateFolder, skipReload)
      if (needsPhotoFolder) await createFolder('Photos', 'blue', '🖼️', false, undefined, 'Your photo collection', false, true);
      if (needsVideoFolder) await createFolder('Videos', 'purple', '📹', false, undefined, 'Video recordings and clips', false, true);
      if (needsAudioFolder) await createFolder('Audio', 'green', '🎧', false, undefined, 'Voice memos and audio files', false, true);
      if (needsDocumentFolder) await createFolder('Documents', 'orange', '📄', false, undefined, 'Important documents and files', false, true);

      // Reload folders once to get all IDs
      await loadFolders();
      
      // Wait a moment for state to update, then fetch fresh folder list
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Fetch fresh folder list with error handling (use correct endpoint)
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/vault/metadata`,
        {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch folders: ${response.status}`);
      }
      
      const responseText = await response.text();
      let currentFolders = [];
      
      try {
        const data = JSON.parse(responseText);
        currentFolders = data.metadata?.folders || [];
      } catch (parseError) {
        console.error('Failed to parse folder response:', responseText);
        throw new Error('Invalid response from server');
      }

      // Find folders by EXACT name only to prevent duplicate folder issues
      const photoFolder = currentFolders.find((f: any) => f.name === 'Photos');
      const videoFolder = currentFolders.find((f: any) => f.name === 'Videos');
      const audioFolder = currentFolders.find((f: any) => f.name === 'Audio');
      const documentFolder = currentFolders.find((f: any) => f.name === 'Documents');

      // Move media to appropriate folders (silently - no individual toasts)
      let movedCount = 0;
      if (photoIds.length > 0 && photoFolder) {
        await moveMediaToFolder(photoIds, photoFolder.id, true);
        movedCount += photoIds.length;
      }
      if (videoIds.length > 0 && videoFolder) {
        await moveMediaToFolder(videoIds, videoFolder.id, true);
        movedCount += videoIds.length;
      }
      if (audioIds.length > 0 && audioFolder) {
        await moveMediaToFolder(audioIds, audioFolder.id, true);
        movedCount += audioIds.length;
      }
      if (documentIds.length > 0 && documentFolder) {
        await moveMediaToFolder(documentIds, documentFolder.id, true);
        movedCount += documentIds.length;
      }

      if (movedCount > 0) {
        toast.success(`Auto-organized ${movedCount} items by type! 🎯`, {
          description: 'Media sorted into Photos, Videos, Audio, and Documents folders'
        });
        
        // Track achievement - Phase 4B
        if (session?.access_token) {
          trackAction('vault_auto_organize_used', { movedCount }, session.access_token);
        }
        
        // CRITICAL FIX: Force a final reload to ensure UI reflects the changes
        // This ensures the auto-organize button visibility updates correctly
        console.log('🔄 Auto-organize complete, reloading vault and folders...');
        await Promise.all([
          loadVault(),
          loadFolders()
        ]);
        console.log('✅ Post-organize reload complete');
      } else {
        toast.info('No items needed organizing');
      }
    } catch (err) {
      console.error('Auto-organize failed:', err);
      console.error('Error details:', err instanceof Error ? err.message : String(err));
      toast.error('Failed to auto-organize media');
    }
  };

  // 🧹 CLEANUP: Remove duplicate permanent folders
  // This function identifies and removes duplicate permanent folders that were created due to the .includes() bug
  const cleanupDuplicatePermanentFolders = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to cleanup folders');
        return;
      }

      // Permanent folder names we want to keep (exact match only)
      const permanentFolderNames = ['Photos', 'Videos', 'Audio', 'Documents'];
      
      // Find the "correct" permanent folders (exact name match)
      const correctPermanentFolders = permanentFolderNames
        .map(name => folders.find(f => f.name === name))
        .filter(Boolean); // Remove nulls
      
      // Find duplicate/extra folders that should be removed
      const foldersToCheck = [...folders];
      const duplicateFolders: any[] = [];
      
      for (const permanentName of permanentFolderNames) {
        // Find ALL folders that match this permanent folder (including .includes matches)
        const matchingFolders = foldersToCheck.filter(f => {
          const nameLower = f.name.toLowerCase();
          const permanentLower = permanentName.toLowerCase();
          // Match if name includes the permanent name (e.g., "My Photos" includes "photos")
          return nameLower.includes(permanentLower);
        });
        
        // If we found multiple matches, the extras are duplicates
        if (matchingFolders.length > 1) {
          // Keep the exact match, remove the others
          const exactMatch = matchingFolders.find(f => f.name === permanentName);
          const duplicates = matchingFolders.filter(f => f !== exactMatch);
          
          console.log(`🔍 Found ${duplicates.length} duplicate(s) for "${permanentName}":`, 
            duplicates.map(f => f.name));
          
          duplicateFolders.push(...duplicates);
        }
      }
      
      if (duplicateFolders.length === 0) {
        toast.success('No duplicate folders found! Your vault is clean. ✨');
        return;
      }
      
      console.log('🗑️ Folders to remove:', duplicateFolders.map(f => ({ name: f.name, id: f.id, mediaCount: f.mediaIds?.length || 0 })));
      
      // Ask for confirmation
      const folderList = duplicateFolders.map(f => `  • "${f.name}" (${f.mediaIds?.length || 0} items)`).join('\n');
      const confirmed = confirm(
        `Found ${duplicateFolders.length} duplicate permanent folder(s):\n\n${folderList}\n\nDelete these folders? (Media will be moved to unsorted)`
      );
      
      if (!confirmed) {
        toast.info('Cleanup cancelled');
        return;
      }
      
      // Delete each duplicate folder
      let deletedCount = 0;
      for (const folder of duplicateFolders) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/vault/folders`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              action: 'delete',
              folderId: folder.id
            })
          }
        );
        
        if (response.ok) {
          deletedCount++;
          console.log(`✅ Deleted duplicate folder: ${folder.name}`);
        } else {
          console.error(`❌ Failed to delete folder: ${folder.name}`);
        }
      }
      
      // Reload both folders and vault to ensure UI is fully in sync
      await Promise.all([
        loadFolders(),
        loadVault()
      ]);
      
      toast.success(`Cleaned up ${deletedCount} duplicate folder(s)! 🧹`, {
        description: 'Your vault is now organized correctly'
      });
      
    } catch (err) {
      console.error('Cleanup failed:', err);
      toast.error('Failed to cleanup duplicate folders');
    }
  };

  // Apply folder template - Phase 4C
  const applyFolderTemplate = async (template: FolderTemplate) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to use templates');
        return;
      }

      setIsFolderOperationLoading(true);
      toast.loading(`Creating ${template.folders.length} folders from "${template.name}"...`, {
        id: 'template-apply'
      });

      let createdCount = 0;
      let skippedCount = 0;

      // Create each folder from template
      for (const folderDef of template.folders) {
        // Check if folder with similar name already exists
        const existingFolder = folders.find(
          f => f.name.toLowerCase() === folderDef.name.toLowerCase()
        );

        if (existingFolder) {
          skippedCount++;
          console.log(`⏭️ Skipping "${folderDef.name}" - already exists`);
          continue;
        }

        // Create folder
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/vault/folders`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              action: 'create',
              folderName: folderDef.name,
              color: folderDef.color,
              icon: folderDef.icon, // Save custom emoji icon
              description: folderDef.description, // Save folder description
              isTemplateFolder: true // Mark as template-generated
            })
          }
        );

        if (response.ok) {
          createdCount++;
          console.log(`✅ Created folder: ${folderDef.name}`);
          
          // Track achievement for each folder
          if (session?.access_token) {
            trackAction('vault_folder_created', { 
              folderName: folderDef.name, 
              color: folderDef.color,
              fromTemplate: template.id 
            }, session.access_token);
          }
        } else {
          console.error(`❌ Failed to create folder: ${folderDef.name}`);
        }

        // Small delay between creates to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await loadFolders();
      setIsFolderOperationLoading(false);

      toast.success(
        `Template applied! Created ${createdCount} folders${skippedCount > 0 ? `, skipped ${skippedCount} existing` : ''}`,
        {
          id: 'template-apply',
          description: `${template.icon} ${template.name} is ready to use`
        }
      );
    } catch (err) {
      console.error('Failed to apply template:', err);
      toast.error('Failed to apply template', { id: 'template-apply' });
      setIsFolderOperationLoading(false);
    }
  };

  // Export folder as ZIP - Phase 4C
  const exportFolder = async (folder: any) => {
    try {
      // Get media items in this folder
      const folderMediaItems = vaultItems.filter(item => 
        folder.mediaIds?.includes(item.id)
      );

      if (folderMediaItems.length === 0) {
        toast.info('This folder is empty - nothing to export');
        return;
      }

      // Show loading toast
      const estimatedSize = estimateZipSize(
        folderMediaItems.map(m => ({ ...m, size: 0 }))
      );
      
      toast.loading(
        `Preparing ${folderMediaItems.length} files for export...`,
        {
          id: 'folder-export',
          description: `This may take a moment`
        }
      );

      // Convert to ExportableMedia format
      const exportableItems: ExportableMedia[] = folderMediaItems.map(item => ({
        id: item.id,
        type: item.type,
        url: item.base64Data, // FIXED: Use base64Data which contains the URL or base64 data
        name: item.fileName || item.name || `${item.type}_${item.id}`,
        timestamp: item.timestamp
      }));

      // Download as ZIP
      await downloadAsZip(exportableItems, {
        folderName: folder.name,
        includeMetadata: true
      });

      toast.success(
        `Exported ${folderMediaItems.length} files successfully!`,
        {
          id: 'folder-export',
          description: `"${folder.name}" downloaded as ZIP`
        }
      );
    } catch (err) {
      console.error('Failed to export folder:', err);
      toast.error('Failed to export folder', { 
        id: 'folder-export',
        description: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  };

  // Manual sync function for troubleshooting
  const manualSync = async () => {
    if (isSyncing) {
      console.log('⏸️ Sync already in progress');
      return;
    }
    
    setIsSyncing(true);
    toast.loading('Syncing vault from backend...', { id: 'manual-sync' });
    
    try {
      console.log('🔄 Manual sync initiated');
      await Promise.all([
        loadVault(),
        loadFolders()
      ]);
      
      toast.success('Vault synced successfully!', { 
        id: 'manual-sync',
        description: `Last synced: ${new Date().toLocaleTimeString()}`
      });
    } catch (error) {
      console.error('❌ Manual sync failed:', error);
      toast.error('Sync failed', { 
        id: 'manual-sync',
        description: 'Please try again'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Load folders on mount (removed - now in main useEffect)
  // useEffect(() => {
  //   loadFolders();
  // }, []);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins === 0) return `${secs}s`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const dataURLtoBlob = (dataURL: string): Blob => {
    try {
      // Check if it's a data URL
      if (!dataURL.startsWith('data:')) {
        // If it's not a data URL, create a blob with default type
        return new Blob([dataURL], { type: 'application/octet-stream' });
      }
      
      const arr = dataURL.split(',');
      if (arr.length < 2) {
        throw new Error('Invalid data URL format');
      }
      
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    } catch (error) {
      console.error('Error converting data URL to blob:', error);
      // Return a minimal blob as fallback
      return new Blob([''], { type: 'application/octet-stream' });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'photo':
        return <Image className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'audio':
        return <Mic className="w-5 h-5" />;
      case 'document':
        return <FileText className="w-5 h-5" />;
      default:
        return null;
    }
  };

  // MOBILE FIX: Make displayedItems reactive so UI updates after MOVE TO operations
  // 🔄 CRITICAL: Include lastSyncTime to force recalculation after background uploads
  // 🔧 FIX: Only show items when BOTH vault and folders are loaded to prevent flash
  const displayedItems = useMemo(() => {
    if (!vaultLoaded || !foldersLoaded) {
      console.log('⏳ Waiting for data to load - vaultLoaded:', vaultLoaded, 'foldersLoaded:', foldersLoaded);
      return []; // Return empty array while loading to prevent flash
    }
    return getFilteredAndSortedItems();
  }, [vaultItems, selectedFolderId, folders, filterBy, debouncedSearchQuery, dateFilter, sortBy, lastSyncTime, vaultLoaded, foldersLoaded]);

  // 🔧 FIX: Composite loading state - data is ready only when BOTH vault and folders are loaded
  const isDataReady = vaultLoaded && foldersLoaded;

  // Media Card Component
  const MediaCard = React.memo(({ item }: { item: LibraryItem }) => {
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [isHovering, setIsHovering] = useState(false);
    const nameInputRef = useRef<HTMLInputElement>(null);

    // Get display name: custom fileName or auto-generated from type and timestamp
    const getDisplayName = () => {
      if (item.fileName) {
        return item.fileName;
      }
      // Auto-generate name from type and timestamp
      const extension = item.type === 'video' ? 'mp4' : 
                       item.type === 'audio' ? 'mp3' : 
                       item.type === 'document' ? 'pdf' : 
                       'jpg';
      return `vault-${item.type}-${item.timestamp}.${extension}`;
    };

    // Focus input when editing mode is activated
    useEffect(() => {
      if (isEditingName && nameInputRef.current) {
        nameInputRef.current.focus();
        nameInputRef.current.select();
      }
    }, [isEditingName]);

    const handleStartEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditedName(getDisplayName());
      setIsEditingName(true);
    };

    const handleSaveName = async () => {
      if (!editedName.trim() || editedName === getDisplayName()) {
        setIsEditingName(false);
        return;
      }

      // 🚫 DUPLICATE CHECK: Prevent duplicate filenames in the same folder/unsorted
      const itemFolder = folders.find(f => f.mediaIds?.includes(item.id));
      
      // Get all items in the same folder (or unsorted if no folder)
      const siblingItems = itemFolder
        ? vaultItems.filter(i => 
            itemFolder.mediaIds?.includes(i.id) && i.id !== item.id
          )
        : vaultItems.filter(i => {
            // Unsorted items: not in any folder
            const inAnyFolder = folders.some(f => f.mediaIds?.includes(i.id));
            return !inAnyFolder && i.id !== item.id;
          });

      // Check if any sibling has the same filename
      const duplicate = siblingItems.find(i => {
        const iName = i.fileName || `vault-${i.type}-${i.timestamp}`;
        return iName.toLowerCase() === editedName.trim().toLowerCase();
      });

      if (duplicate) {
        const locationName = itemFolder ? `folder "${itemFolder.name}"` : 'unsorted files';
        toast.error('Duplicate filename', {
          description: `A file named "${editedName.trim()}" already exists in ${locationName}. Please choose a different name.`
        });
        setIsEditingName(false);
        return;
      }

      // Use the shared saveMediaName function which handles everything properly
      const saved = await saveMediaName(item.id, editedName.trim());
      setIsEditingName(false);
      
      // If save failed, the saveMediaName function already showed an error toast
      // and the duplicate check is already handled inside saveMediaName
    };

    const handleCancelEdit = () => {
      setEditedName('');
      setIsEditingName(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSaveName();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelEdit();
      }
    };

    return (
      <div className="pointer-events-auto">
        <Card
          key={item.id}
          style={{ 
            zIndex: selectedIds.has(item.id) ? 10 : 1,
            pointerEvents: 'auto'
          }}
          className={`relative transition-all duration-200 group overflow-hidden backdrop-blur-md isolate ${
            viewMode === 'list' 
              ? 'hover:scale-[1.01]' 
              : viewMode === '4x4'
              ? (isMobile ? 'hover:scale-[1.02] active:scale-100' : 'hover:scale-110')
              : (isMobile ? 'hover:scale-[1.01] active:scale-100' : 'hover:scale-105')
          } ${
            isMobile ? (
              selectedIds.has(item.id)
                ? `${viewMode === '4x4' ? 'ring-2' : 'ring-2'} ring-purple-400 shadow-lg shadow-purple-500/40 bg-slate-800 border-purple-400`
                : `hover:ring-2 hover:ring-purple-400/50 hover:shadow-lg hover:shadow-purple-500/30 bg-slate-900 ${viewMode === '4x4' ? 'border-slate-800' : 'border-slate-700'} shadow-sm`
            ) : (
              selectedIds.has(item.id)
                ? 'ring-4 ring-yellow-400 shadow-xl shadow-yellow-500/80 bg-gradient-to-br from-white/30 to-white/20 scale-105 border-white/30'
                : 'hover:ring-4 hover:ring-white/60 hover:shadow-xl hover:shadow-white/50 bg-gradient-to-br from-white/10 to-white/5 border-white/30 shadow-md'
            )
          }`}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
        <CardContent className={`${viewMode === 'list' ? 'p-0 flex items-center' : 'p-0'} pointer-events-auto`}>
          {/* Already Imported Badge */}
          {/* Checkbox - Now also shows imported/used state */}
          <div 
            className={`absolute z-10 cursor-pointer pointer-events-auto ${
              viewMode === 'list'
                ? 'top-1/2 -translate-y-1/2 right-3'
                : isMobile 
                ? (viewMode === 'compact' ? 'top-1 left-1' : 'top-1.5 left-1.5')
                : 'top-2 left-2'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              toggleSelect(item.id);
            }}
          >
            <div className={`${
              isMobile 
                ? (viewMode === '4x4' ? 'w-5 h-5' : 'w-5 h-5')
                : 'w-6 lg:w-7 h-6 lg:h-7'
            } rounded-full border-2 flex items-center justify-center transition-all shadow-lg ${
              isMobile ? (
                selectedIds.has(item.id) || importedMediaIds?.has(item.id)
                  ? 'bg-gradient-to-br from-purple-500 to-fuchsia-600 border-purple-300 shadow-purple-500/60'
                  : 'bg-black/70 border-white/60 backdrop-blur-sm group-hover:border-purple-400 group-hover:bg-purple-500/30'
              ) : (
                selectedIds.has(item.id) || importedMediaIds?.has(item.id)
                  ? 'bg-gradient-to-br from-yellow-400 to-orange-500 border-yellow-300 shadow-yellow-500/80'
                  : 'bg-black/70 border-white/80 backdrop-blur-sm group-hover:border-yellow-400 group-hover:bg-yellow-500/30'
              )
            }`}>
              {(selectedIds.has(item.id) || importedMediaIds?.has(item.id)) && (
                <CheckCircle className={`text-white ${
                  isMobile 
                    ? (viewMode === '4x4' ? 'w-3 h-3' : 'w-3.5 h-3.5')
                    : 'w-4 lg:w-5 h-4 lg:h-5'
                }`} />
              )}
            </div>
          </div>

          {/* Media Preview */}
          <div 
            className={`${
              viewMode === 'list' 
                ? 'w-16 h-16 shrink-0' 
                : 'aspect-square'
            } bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden relative group/preview cursor-pointer pointer-events-auto`}
            onClick={async (e) => {
              e.stopPropagation();
              console.log('🖼️ Preview clicked for item:', item.id, {
                type: item.type,
                hasUrl: !!item.base64Data,
                urlLength: item.base64Data?.length || 0,
                isBase64: item.base64Data?.startsWith('data:')
              });
              setPreviewItem(item);
              
              // 🔄 Refresh signed URL for videos (they expire after 1 hour or are empty)
              if (item.type === 'video') {
                const needsRefresh = !item.base64Data || 
                                     (item.base64Data && !item.base64Data.startsWith('data:'));
                const isOptimistic = item.id.startsWith('optimistic-');
                
                if (needsRefresh && !isOptimistic) {
                  // Only refresh for real backend items, not optimistic uploads
                  console.log('🔄 Refreshing video URL for preview... (empty or http URL)');
                  const freshUrl = await refreshSignedUrl(item.id);
                  if (freshUrl) {
                    console.log('✅ Updated preview with fresh URL');
                    // Update preview item with fresh URL
                    setPreviewItem(prev => prev?.id === item.id ? { ...prev, base64Data: freshUrl } : prev);
                  } else {
                    console.error('❌ Failed to get fresh URL');
                    toast.error('Failed to load video - please try again');
                  }
                } else if (isOptimistic) {
                  // Optimistic items use blob URL - no refresh needed
                  console.log('ℹ️ Optimistic item - using blob URL (upload in progress)');
                }
              }
            }}
          >
            {/* Thumbnail */}
            {item.thumbnail ? (
              <img 
                src={item.thumbnail}
                alt={item.type}
                className="w-full h-full object-cover"
              />
            ) : item.type === 'photo' ? (
              <img 
                src={item.base64Data}
                alt="Photo"
                className="w-full h-full object-cover"
              />
            ) : item.type === 'video' ? (
              <video 
                src={item.base64Data}
                className="w-full h-full object-cover"
                muted
              />
            ) : item.type === 'document' ? (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-600">
                <FileText className={`${
                  viewMode === '4x4' 
                    ? (isMobile ? 'w-6 h-6' : 'w-8 h-8')
                    : (isMobile ? 'w-10 h-10' : 'w-12 h-12')
                } text-white drop-shadow-lg`} />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600">
                <Mic className={`${
                  viewMode === '4x4' 
                    ? (isMobile ? 'w-6 h-6' : 'w-8 h-8')
                    : (isMobile ? 'w-10 h-10' : 'w-12 h-12')
                } text-white drop-shadow-lg`} />
              </div>
            )}

            {/* Duration Badge for Audio/Video */}
            {item.duration && viewMode !== 'compact' && (
              <div className="absolute bottom-1 left-1 z-10">
                <Badge variant="secondary" className={`${
                  isMobile ? 'text-[10px] px-1 py-0' : 'text-xs'
                } bg-black/70 text-white border-white/30 backdrop-blur-sm`}>
                  {formatDuration(item.duration)}
                </Badge>
              </div>
            )}
          </div>

          {/* Item Info */}
          {viewMode === 'list' ? (
            <div 
              className="flex-1 flex items-center justify-between p-3 sm:p-4"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  {/* Display mode - Always show, no inline editing */}
                  <div className="flex items-center gap-2 group/name min-w-0">
                    <p className={`font-medium truncate flex-1 min-w-0 ${
                      isMobile ? 'text-white' : 'text-white'
                    }`}>
                      {getDisplayName()}
                    </p>
                    {/* Desktop: Show on hover | Mobile: Always visible */}
                    {!isMobile ? (
                      <button
                        onClick={handleStartEdit}
                        className="shrink-0 opacity-0 group-hover/name:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                      >
                        <Edit3 className="w-3 h-3 text-white stroke-2" />
                      </button>
                    ) : (
                      <button
                        onClick={handleStartEdit}
                        className="shrink-0 px-0.5 py-0 h-2 hover:bg-slate-800 rounded transition-colors flex items-center justify-center"
                      >
                        <Edit3 className="w-2 h-2 text-purple-400" />
                      </button>
                    )}
                  </div>
                  <p className={`text-xs truncate ${
                    isMobile ? 'text-slate-300' : 'text-white/70'
                  }`}>
                    {formatDate(item.timestamp)}
                  </p>
                </div>
              </div>
              {!isMobile && item.duration && (
                <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  {formatDuration(item.duration)}
                </Badge>
              )}
            </div>
          ) : (
            <div 
              className={`${
                viewMode === 'compact' 
                  ? (isMobile ? 'p-1' : 'p-1.5') 
                  : (isMobile ? 'p-1.5' : 'p-2 sm:p-3')
              } ${viewMode === 'compact' ? '' : 'space-y-1'} bg-gradient-to-t from-black/95 via-black/70 to-transparent backdrop-blur-sm`}
            >
              <div className={`flex items-center justify-between ${ 
                viewMode === 'compact' 
                  ? (isMobile ? 'gap-0.5' : 'gap-1') 
                  : 'gap-1.5 sm:gap-2'
              }`}>
                <div className={`flex items-center ${
                  viewMode === 'compact' 
                    ? (isMobile ? 'gap-0.5' : 'gap-1') 
                    : 'gap-1.5 sm:gap-2'
                } ${
                  viewMode === 'compact' 
                    ? (isMobile ? 'text-[10px]' : 'text-xs') 
                    : 'text-xs sm:text-sm'
                } text-white flex-1 min-w-0`}>
                  {/* Desktop: Show icon | Mobile: Hide icon to save space */}
                  {!isMobile && (
                    <div className={`shrink-0 rounded shadow-sm ${
                      viewMode === 'compact' ? 'p-1' : 'p-1'
                    } bg-yellow-400/40`}>
                      <div className={viewMode === 'compact' ? 'scale-75' : ''}>
                        {getIcon(item.type)}
                      </div>
                    </div>
                  )}
                  {/* Always show display name - No inline editing */}
                  {viewMode !== 'compact' && (
                    <span className={`font-medium lg:font-semibold flex-1 min-w-0 ${
                      isMobile ? 'line-clamp-2' : 'truncate'
                    }`}>{getDisplayName()}</span>
                  )}
                </div>
                {/* Desktop: Show pencil on hover | Mobile: Always visible */}
                {!isMobile ? (
                  viewMode !== 'compact' && (
                    <button
                      onClick={handleStartEdit}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                    >
                      <Edit3 className="w-3 h-3 text-white stroke-2" />
                    </button>
                  )
                ) : (
                  viewMode !== 'compact' && (
                    <button
                      onClick={handleStartEdit}
                      className="shrink-0 px-0.5 py-0 h-2 hover:bg-slate-800 active:bg-slate-700 rounded transition-colors flex items-center justify-center"
                    >
                      <Edit3 className="w-2 h-2 text-purple-400" />
                    </button>
                  )
                )}
              </div>
              {viewMode !== 'compact' && !isMobile && (
                <p className={`text-xs truncate ${
                  isMobile ? 'text-slate-300' : 'text-white/80'
                }`}>
                  {formatDate(item.timestamp)}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Centered Editing Modal - Mobile + Desktop */}
      {isEditingName && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleSaveName();
            }
          }}
        >
          <div className="w-full max-w-md bg-slate-800 rounded-lg border border-purple-400 shadow-2xl shadow-purple-500/50 p-4">
            <label className="block text-sm text-slate-300 mb-2">Edit Name</label>
            <input
              ref={nameInputRef}
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveName();
                } else if (e.key === 'Escape') {
                  setIsEditingName(false);
                }
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full px-3 py-2 text-base bg-slate-700 text-white border border-purple-400 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveName();
                }}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white rounded-lg hover:from-purple-600 hover:to-fuchsia-700 transition-all"
              >
                Save
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingName(false);
                }}
                className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      </div>
    );
  });

  // Folder Card Component
  const FolderCard = ({ folder }: { folder: any }) => {
    console.log('🔄 FolderCard rendering for:', folder.name);
    
    const isOver = false;
    const canDrop = false;
    const drop = useRef(null);

    const handleFolderClick = useCallback(() => {
      console.log('📂 FolderCard onClick called for:', folder.name, folder.id);
      
      // Check if folder is private and locked
      if (folder.isPrivate && !unlockedFolders.has(folder.id)) {
        setPasswordFolder(folder);
        setShowPasswordDialog(true);
        return;
      }

      console.log('📂 Setting mobileOpenFolder to:', folder);
      setMobileOpenFolder(folder);
    }, [folder, mobileOpenFolder, previewItem, folders, unlockedFolders]);

    // Calculate ACTUAL item count (only items that exist in vaultItems)
    const actualMediaCount = useMemo(() => {
      const folderMediaIds = folder.mediaIds || [];
      const existingItems = vaultItems.filter(item => folderMediaIds.includes(item.id));
      return existingItems.length;
    }, [folder.mediaIds, vaultItems]);

    return (
      <div 
        ref={drop} 
        style={{ pointerEvents: 'auto' }}
        onClick={(e) => {
          console.log('🎯 WRAPPER DIV CLICKED for:', folder.name);
          console.log('🎯 Event target tag:', (e.target as HTMLElement).tagName);
          console.log('🎯 Event currentTarget tag:', (e.currentTarget as HTMLElement).tagName);
        }}
      >
        <VaultFolder
          key={folder.id}
          id={folder.id}
          name={folder.name}
          color={folder.color || 'blue'}
          mediaCount={actualMediaCount}
          isSelected={selectedFolderId === folder.id}
          isHovering={isOver && canDrop}
          onClick={handleFolderClick}
          onRename={() => {
            setEditingFolder(folder);
            setFolderDialogMode('rename');
            setShowFolderDialog(true);
          }}
          onDelete={() => {
            setFolderToDelete(folder);
            setShowDeleteFolderDialog(true);
          }}
          onExport={() => {
            setExportingFolder(folder);
            setShowExportPreview(true);
          }}
          onLegacyAccess={() => {
            console.log('🛡️ Navigating to Legacy Access Settings');
            // Navigate to global legacy access settings instead of folder-specific modal
            if (onNavigateToGlobalSettings) {
              onNavigateToGlobalSettings();
            }
          }}
          icon={folder.icon}
          description={folder.description}
          isPrivate={folder.isPrivate}
          isTemplateFolder={folder.isTemplateFolder || false}
          legacyAccessMode={folder.legacyAccess?.mode || null}
          legacyAccessBeneficiaryCount={folder.legacyAccess?.beneficiaries?.length || 0}
          isMenuOpen={openFolderMenuId === folder.id}
          onMenuOpenChange={(open) => {
            setOpenFolderMenuId(open ? folder.id : null);
          }}
        />
      </div>
    );
  };

  // Unsorted Zone Component
  const UnsortedZone = React.memo(() => {
    const isOver = false;
    const canDrop = false;
    const drop = useRef(null);

    const unsortedCount = vaultItems.filter(item => {
      const matchesFolder = selectedFolderId 
        ? folders.find(f => f.id === selectedFolderId)?.mediaIds?.includes(item.id)
        : !folders.some(f => f.mediaIds?.includes(item.id));
      return matchesFolder;
    }).length;

    return (
      <div ref={drop}>
        <Card 
          className={`
            group relative overflow-hidden cursor-pointer
            transition-all duration-500
            ${isMobile
              ? selectedFolderId === null
                ? 'bg-blue-900/70 border-blue-400/60 shadow-2xl shadow-blue-500/30 ring-1 ring-white/10'
                : 'bg-slate-900/85 border-slate-700/70 shadow-xl hover:border-purple-500/40'
              : isOver && canDrop
                ? 'bg-gradient-to-br from-emerald-900/70 via-green-900/70 to-emerald-900/70 border-emerald-400/70 shadow-2xl shadow-emerald-500/40 scale-[1.03] ring-4 ring-emerald-400/50 backdrop-blur-xl'
                : selectedFolderId === null
                  ? 'bg-gradient-to-br from-blue-900/70 via-purple-900/70 to-blue-900/70 border-blue-400/60 shadow-2xl shadow-blue-500/30 backdrop-blur-xl ring-1 ring-white/10 hover:scale-[1.03]' 
                  : 'bg-slate-900/90 backdrop-blur-xl border-slate-600/80 shadow-2xl shadow-black/40 ring-1 ring-white/10 hover:border-purple-500/40 hover:shadow-purple-500/20 hover:scale-[1.03]'
            }
          `}
          onClick={() => setSelectedFolderId(null)}
        >
          <div className="relative p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className={`
                  p-2.5 sm:p-3 rounded-xl transition-all duration-300 shadow-lg
                  ${isMobile
                    ? selectedFolderId === null
                      ? 'bg-blue-500/40 border-2 border-blue-400/60 shadow-blue-500/30'
                      : 'bg-slate-600/40 border border-slate-500/50 group-hover:border-purple-400/60'
                    : selectedFolderId === null
                      ? 'bg-gradient-to-br from-blue-500/30 to-purple-500/30 border-2 border-blue-400/50 shadow-blue-500/40'
                      : 'bg-gradient-to-br from-slate-600/30 to-slate-700/30 border border-slate-500/40 group-hover:border-purple-400/50'
                  }
                `}>
                  <Grid3x3 className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                    selectedFolderId === null ? 'text-blue-300' : 'text-slate-400 group-hover:text-purple-400'
                  }`} />
                </div>
                
                {/* Title */}
                <div>
                  <h3 className={`font-semibold transition-colors ${
                    selectedFolderId === null ? 'text-blue-200' : 'text-slate-200 group-hover:text-purple-200'
                  }`}>
                    Unsorted
                  </h3>
                  <p className="text-xs text-slate-400">
                    All media not in folders
                  </p>
                </div>
              </div>
              
              {/* Count badge */}
              <Badge 
                variant="outline"
                className={`
                  ${selectedFolderId === null 
                    ? 'bg-blue-500/20 border-blue-400/50 text-blue-200' 
                    : 'bg-slate-700/50 border-slate-600 text-slate-300 group-hover:border-purple-500/30'
                  }
                `}
              >
                <Image className="w-3 h-3 mr-1.5" />
                {unsortedCount}
              </Badge>
            </div>
            
            {/* Hover hint - disabled */}
            {false && !isMobile && isOver && canDrop && (
              <div className="mt-3 p-2 bg-emerald-500/20 border border-emerald-400/30 rounded-lg">
                <p className="text-xs text-emerald-200 text-center font-medium">
                  Drop to move to Unsorted
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  });

  console.log('🎬 About to return JSX - component render completing');

  return (
      <div 
        className={`min-h-screen relative overflow-x-hidden ${
          isMobile 
            ? 'bg-slate-950' 
            : 'bg-slate-950'
        }`}
        style={{ colorScheme: 'dark' }}
      >
      {/* Animated Background Elements - Different for Mobile vs Desktop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {isMobile ? (
          // Mobile: Simple solid dark background with subtle accent (NO gradients)
          <>
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-950/30 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-slate-900/40 rounded-full blur-3xl" />
          </>
        ) : (
          // Desktop: Toned-down gradient overlay with glassmorphism-friendly background
          <>
            {/* Base gradient - toned down to 40% opacity */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/40 via-fuchsia-500/40 to-pink-600/40" />
            {/* Animated orbs for depth */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          </>
        )}
      </div>

      <div className={`relative max-w-7xl mx-auto space-y-4 ${
        isMobile ? 'p-4' : 'p-4 sm:p-6 space-y-6'
      }`}>
        {/* Header */}
        <div className={`flex items-center ${
          isMobile ? 'gap-2' : 'gap-3 sm:gap-4'
        }`}>
          {/* Mobile: Single row layout with everything aligned */}
          {isMobile ? (
            <>
              <div className="shrink-0 p-2 rounded-xl shadow-lg bg-gradient-to-br from-purple-600 to-fuchsia-700">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white truncate flex-1">Vault</h1>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg,audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm,audio/aac,application/pdf,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.csv,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/rtf,text/csv"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files, selectedFolderId)}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="gap-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/50 shrink-0"
                size="sm"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
              </Button>
              {onClose && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="shrink-0 border-2 border-slate-600 bg-slate-800/90 hover:bg-slate-700 hover:border-slate-500 text-white transition-all shadow-lg"
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
            </>
          ) : (
            // Desktop: Original layout
            <>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="shrink-0 p-2 rounded-xl shadow-lg bg-gradient-to-br from-yellow-400 to-orange-500 shadow-yellow-500/60">
                    <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">Vault</h1>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Show folder name when inside a folder */}
                {selectedFolderId && (
                  <div className="flex items-center gap-2 mr-2">
                    <Button
                      onClick={() => setSelectedFolderId(null)}
                      variant="outline"
                      size="sm"
                      className="gap-1 border-white/30 bg-white/10 hover:bg-white/20 text-white"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Back</span>
                    </Button>
                    <Badge 
                      variant="secondary" 
                      className="text-xs sm:text-sm bg-purple-500/20 text-purple-200 border-purple-400/40 shadow-lg"
                    >
                      <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
                      {folders.find(f => f.id === selectedFolderId)?.name || 'Folder'}
                    </Badge>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg,audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm,audio/aac,application/pdf,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.csv,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/rtf,text/csv"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files, selectedFolderId)}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/50"
                  size="sm"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="hidden sm:inline">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span className="hidden sm:inline">{selectedFolderId ? 'Upload to Folder' : 'Upload'}</span>
                    </>
                  )}
                </Button>
                {/* 🔄 Sync Button - Manual sync from backend */}
                <Button
                  onClick={manualSync}
                  disabled={isSyncing || isLoading}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-2 border-blue-400/40 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-400/60 text-blue-200 transition-all shadow-lg backdrop-blur-sm"
                  title="Sync vault from backend"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync'}</span>
                </Button>
                {onClose && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                    className="shrink-0 border-2 border-white/30 bg-white/10 hover:bg-white/20 hover:border-white/50 text-white transition-all shadow-lg backdrop-blur-sm"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        {/* OLD TOOLBAR - DISABLED - Filters and Sort Controls - Compact & Sticky */}
        {false && (
          <Card className={`backdrop-blur-xl shadow-xl sticky top-20 z-40 ${
            isMobile
              ? 'bg-slate-900/95 border-slate-700'
              : 'bg-gradient-to-r from-white/10 to-white/5 border-white/30'
          }`}>
            <CardContent className={isMobile ? 'p-2' : 'p-2.5 sm:p-3'}>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center justify-between">
                <div className="grid grid-cols-3 sm:flex gap-1.5 sm:gap-2 w-full sm:w-auto">
                  <Select value={filterBy} onValueChange={(value) => setFilterBy(value as FilterOption)}>
                    <SelectTrigger className={`h-9 text-xs sm:text-sm shadow-md backdrop-blur-sm ${
                      isMobile
                        ? 'bg-slate-800 border-slate-600 text-white'
                        : 'sm:w-[155px] bg-white/20 border-white/40 text-white'
                    }`}>
                      <Filter className="w-3.5 h-3.5 mr-1 sm:mr-1.5 text-white shrink-0" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Media</SelectItem>
                      <SelectItem value="photo">Photos</SelectItem>
                      <SelectItem value="video">Videos</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                    <SelectTrigger className={`h-9 text-xs sm:text-sm shadow-md backdrop-blur-sm ${
                      isMobile
                        ? 'bg-slate-800 border-slate-600 text-white'
                        : 'sm:w-[180px] bg-white/20 border-white/40 text-white'
                    }`}>
                      <SortDesc className="w-3.5 h-3.5 mr-1 sm:mr-1.5 text-white shrink-0" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="type-asc">Type (A-Z)</SelectItem>
                      <SelectItem value="type-desc">Type (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                    <SelectTrigger className={`h-9 text-xs sm:text-sm shadow-md backdrop-blur-sm ${
                      isMobile
                        ? 'bg-slate-800 border-slate-600 text-white'
                        : 'sm:w-[135px] bg-white/20 border-white/40 text-white'
                    }`}>
                      {viewMode === 'grid' && <LayoutGrid className="w-3.5 h-3.5 mr-1 sm:mr-1.5 text-white shrink-0" />}
                      {viewMode === 'compact' && <Grid3x3 className="w-3.5 h-3.5 mr-1 sm:mr-1.5 text-white shrink-0" />}
                      {viewMode === 'list' && <List className="w-3.5 h-3.5 mr-1 sm:mr-1.5 text-white shrink-0" />}
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grid</SelectItem>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="list">List</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State - Show when either vault or folders is not loaded */}
        {!isDataReady && (
          <Card className={`backdrop-blur-xl shadow-xl ${
            isMobile
              ? 'py-8 bg-slate-900/90 border-slate-700'
              : 'py-12 sm:py-16 bg-gradient-to-br from-white/10 to-white/5 border-white/30'
          }`}>
            <CardContent className={`text-center ${
              isMobile ? 'space-y-3' : 'space-y-4'
            }`}>
              <div className={`inline-block rounded-full animate-pulse shadow-lg ${
                isMobile
                  ? 'p-4 bg-gradient-to-br from-purple-600 to-fuchsia-700'
                  : 'p-5 sm:p-6 bg-gradient-to-br from-yellow-400 to-orange-500 shadow-yellow-500/60'
              }`}>
                <Lock className={`text-white ${
                  isMobile ? 'w-8 h-8' : 'w-10 h-10 sm:w-12 sm:h-12'
                }`} />
              </div>
              <div>
                <h3 className={`font-semibold mb-2 text-white ${
                  isMobile ? 'text-base' : 'text-base sm:text-lg'
                }`}>Opening Vault...</h3>
                <p className={`text-sm ${
                  isMobile ? 'text-slate-300' : 'text-white/80'
                }`}>
                  Syncing your media across devices
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Folders Section */}
        {isDataReady && (
          <Card className={`backdrop-blur-xl shadow-xl ${
            isMobile
              ? 'bg-slate-900/95 border-slate-700'
              : 'bg-gradient-to-br from-white/10 to-white/5 border-white/30'
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3 overflow-x-auto">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30 ${
                    isMobile ? '' : 'shadow-lg shadow-blue-500/20'
                  }`}>
                    <FolderPlus className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className={`${
                      isMobile ? 'text-base' : 'text-lg'
                    } bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent`}>
                      Folders
                    </CardTitle>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {folders.length === 0 ? 'Organize your media' : `${folders.length} ${folders.length === 1 ? 'folder' : 'folders'}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {/* Phase 4C: Template Button - ALWAYS VISIBLE */}
                  <Button
                    onClick={() => setShowTemplateSelector(true)}
                    size="sm"
                    variant="outline"
                    className="h-9 !h-9 min-h-[2.25rem] max-h-[2.25rem] flex items-center justify-center px-3 bg-gradient-to-r from-pink-600/20 to-purple-600/20 border-pink-500/30 hover:border-pink-400/50 text-pink-200 hover:text-pink-100 flex-shrink-0"
                  >
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    {!isMobile && 'Template'}
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setFolderDialogMode('create');
                      setEditingFolder(null);
                      setShowFolderDialog(true);
                    }}
                    size="sm"
                    className="h-9 !h-9 min-h-[2.25rem] max-h-[2.25rem] flex items-center justify-center px-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0 shadow-lg shadow-blue-500/30 flex-shrink-0"
                  >
                    <FolderPlus className="w-4 h-4 mr-1.5" />
                    {!isMobile && 'New'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className={isMobile ? 'px-3' : ''}>
              {folders.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-flex p-4 rounded-full bg-slate-800/50 border border-slate-700 mb-3">
                    <FolderPlus className="w-8 h-8 text-slate-500" />
                  </div>
                  <p className="text-sm text-slate-400">
                    Create your first folder to organize your media
                  </p>
                </div>
              ) : (
                <div className={`grid ${
                  isMobile ? 'grid-cols-2 gap-2 auto-cols-fr' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'
                }`}>
                  {folders.map((folder) => (
                    <FolderCard key={folder.id} folder={folder} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Phase 4A: Advanced Search & Filter Toolbar - Positioned above Unsorted */}
        {isDataReady && vaultItems.length > 0 && (
          <VaultToolbar
            isMobile={isMobile}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            debouncedSearchQuery={debouncedSearchQuery}
            filterBy={filterBy}
            setFilterBy={setFilterBy}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            viewMode={viewMode}
            setViewMode={setViewMode}
            resultCount={displayedItems.length}
            showMobileFilters={showMobileFilters}
            setShowMobileFilters={setShowMobileFilters}
          />
        )}

        {/* Unsorted Zone - Show when there are folders (Desktop only) */}
        {/* HIDE when viewing unsorted items (selectedFolderId === null && displayedItems.length > 0) to avoid duplicate "Unsorted" sections */}
        {isDataReady && folders.length > 0 && !isMobile && !(selectedFolderId === null && displayedItems.length > 0) && (
          <UnsortedZone />
        )}

        {/* Empty State */}
        {isDataReady && vaultItems.length === 0 && (
          <Card className={`backdrop-blur-xl shadow-xl ${
            isMobile
              ? 'py-10 bg-slate-900/90 border-slate-700'
              : 'py-16 sm:py-20 bg-gradient-to-br from-white/10 to-white/5 border-white/30'
          }`}>
            <CardContent className={`text-center px-4 ${
              isMobile ? 'space-y-4' : 'space-y-4 sm:space-y-6'
            }`}>
              <div className={`inline-block rounded-full shadow-lg ${
                isMobile
                  ? 'p-5 bg-gradient-to-br from-purple-600 to-fuchsia-700'
                  : 'p-6 sm:p-8 bg-gradient-to-br from-yellow-400 to-orange-500 shadow-yellow-500/60'
              }`}>
                <Lock className={`text-white ${
                  isMobile ? 'w-10 h-10' : 'w-12 h-12 sm:w-16 sm:h-16'
                }`} />
              </div>
              <div>
                <h3 className={`font-semibold mb-2 text-white ${
                  isMobile ? 'text-base' : 'text-lg sm:text-xl'
                }`}>Your Vault is Empty</h3>
                <p className={`text-sm max-w-md mx-auto ${
                  isMobile ? 'text-slate-300' : 'text-white/80'
                }`}>
                  Record photos, videos, or audio and save them to your Vault to access them anytime.
                </p>
              </div>
              {onClose && (
                <Button 
                  onClick={onClose} 
                  variant="outline" 
                  className={`shadow-lg ${
                    isMobile
                      ? 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700'
                      : 'bg-white/20 border-white/40 text-white hover:bg-white/30'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Vault Grid - Always show on both mobile and desktop */}
        {isDataReady && displayedItems.length > 0 && (
          <>
            {/* Folder Breadcrumb / Navigation */}
            <Card className={`backdrop-blur-xl shadow-md ${
              isMobile
                ? 'bg-slate-900/95 border-slate-700'
                : 'bg-gradient-to-r from-white/10 to-white/5 border-white/30'
            }`}>
              <CardContent className={isMobile ? 'p-3' : 'p-3 sm:p-4'}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedFolderId ? (
                      <>
                        {/* Back to All Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFolderId(null);
                            // 🔥 FIX: Scroll to top when exiting folder
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`h-8 ${
                            isMobile
                              ? 'text-purple-300 hover:text-white hover:bg-slate-800'
                              : 'text-white/80 hover:text-white hover:bg-white/20'
                          }`}
                        >
                          <ArrowLeft className="w-4 h-4 mr-1" />
                          {!isMobile && 'All'}
                        </Button>
                        
                        {/* Separator */}
                        <span className={isMobile ? 'text-slate-600' : 'text-white/40'}>/</span>
                        
                        {/* Current Folder */}
                        <div className="flex items-center gap-2">
                          <Folder className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-purple-400`} />
                          <span className={`font-semibold ${
                            isMobile ? 'text-white text-sm' : 'text-white'
                          }`}>
                            {folders.find(f => f.id === selectedFolderId)?.name || 'Folder'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <Grid3x3 className={`${
                          isMobile ? 'w-4 h-4' : 'w-5 h-5'
                        } ${isMobile ? 'text-purple-400' : 'text-white/80'}`} />
                        <span className={`font-semibold ${
                          isMobile ? 'text-white text-sm' : 'text-white'
                        }`}>
                          Unsorted Media
                        </span>
                      </>
                    )}
                  </div>
                  
                  {/* Item count */}
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${
                      isMobile
                        ? 'bg-slate-800 text-white border-slate-700'
                        : 'bg-white/20 text-white border-white/30'
                    }`}
                  >
                    {displayedItems.length} {displayedItems.length === 1 ? 'item' : 'items'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <div className={
              viewMode === 'list' 
                ? 'flex flex-col gap-2 sm:gap-3'
                : viewMode === '2x2'
                ? `grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-2'}`
                : viewMode === '3x3'
                ? `grid gap-4 ${isMobile ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-3 lg:grid-cols-3'}`
                : viewMode === '4x4'
                ? `grid gap-3 ${isMobile ? 'grid-cols-4' : 'grid-cols-4 sm:grid-cols-4 lg:grid-cols-4'}`
                : `grid gap-4 ${isMobile ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-3 lg:grid-cols-3'}` // Default to 3x3
            }>
              {displayedItems.map((item) => (
                <MediaCard key={item.id} item={item} />
              ))}
            </div>

            {/* Action Buttons - Sticky Bottom Bar */}
            {selectedIds.size > 0 && (
              <div ref={controlPanelRef}>
                <Card 
                  className={`sticky bottom-0 mt-4 mx-4 sm:ml-auto sm:mr-4 sm:max-w-md shadow-2xl backdrop-blur-xl z-50 animate-in slide-in-from-bottom duration-300 ${
                  isMobile
                    ? 'bg-slate-900/98 border-slate-700'
                    : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 border-white/50'
                }`}>
                <CardContent className={isMobile ? 'p-2.5' : 'p-3 sm:p-4'}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-white">
                      <div>
                        <p className="text-sm sm:text-base font-bold">{selectedIds.size} Selected</p>
                        <p className={`text-xs ${
                          isMobile ? 'text-slate-300' : 'text-white/90'
                        }`}>Choose an action</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearSelection}
                        className={`text-white shrink-0 ${
                          isMobile
                            ? 'hover:bg-slate-800'
                            : 'hover:bg-white/30'
                        }`}
                      >
                        {/* ULTRA NUCLEAR FIX: Unicode X character - guaranteed to work */}
                        <span className="text-2xl font-bold leading-none">×</span>
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {/* MOBILE: All 4 buttons in 2x2 grid for maximum visibility */}
                      {/* DESKTOP: Flexible layout */}
                      
                      {/* First Row - Use Media and Move to */}
                      <div className={`grid gap-2 ${onUseMedia ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {onUseMedia && (
                          <Button
                            onClick={handleUseMedia}
                            className="h-10 !h-10 min-h-[2.5rem] max-h-[2.5rem] bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/50 transition-all hover:scale-105 flex items-center justify-center px-3"
                          >
                            <Sparkles className="w-4 h-4 mr-1.5 sm:mr-2 shrink-0" />
                            <span className="text-xs sm:text-sm whitespace-nowrap">Use Media</span>
                          </Button>
                        )}
                        
                        <Select
                          value=""
                          onValueChange={(folderId) => {
                            const selectedArray = Array.from(selectedIds);
                            moveMediaToFolder(selectedArray, folderId === 'unsorted' ? null : folderId);
                          }}
                        >
                          <SelectTrigger className="h-10 !h-10 min-h-[2.5rem] max-h-[2.5rem] shadow-md transition-all hover:scale-105 !text-white border-cyan-400/50 bg-cyan-500/20 hover:bg-cyan-500/30 flex items-center px-3">
                            <FolderOpen className="w-4 h-4 mr-1.5 sm:mr-2 !text-white shrink-0" />
                            <span className="text-xs sm:text-sm whitespace-nowrap">
                              {folders.length > 0 ? 'Move to' : 'Create folder'}
                            </span>
                          </SelectTrigger>
                          <SelectContent>
                            {folders.length > 0 ? (
                              <>
                                {folders.map((folder) => {
                                  // Check if this is a PERMANENT system folder (Photos, Videos, Audio, Documents)
                                  const isPermanentFolder = PERMANENT_FOLDERS.includes(folder.name);
                                  
                                  // Determine folder type badge
                                  let folderType = '';
                                  if (isPermanentFolder) {
                                    if (folder.name === 'Photos') folderType = '📷 Photos only';
                                    else if (folder.name === 'Videos') folderType = '🎥 Videos only';
                                    else if (folder.name === 'Audio') folderType = '🎵 Audio only';
                                    else if (folder.name === 'Documents') folderType = '📄 Documents only';
                                  }
                                  
                                  return (
                                    <SelectItem key={folder.id} value={folder.id}>
                                      <div className="flex items-center justify-between gap-3 w-full">
                                        <div className="flex items-center gap-2">
                                          <Folder className="w-4 h-4" />
                                          {folder.name}
                                        </div>
                                        {isPermanentFolder && (
                                          <span className="text-xs text-muted-foreground ml-2">
                                            {folderType}
                                          </span>
                                        )}
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                                <SelectItem value="unsorted">
                                  <div className="flex items-center gap-2">
                                    <Grid3x3 className="w-4 h-4" />
                                    Unsorted
                                  </div>
                                </SelectItem>
                              </>
                            ) : (
                              <SelectItem value="" disabled>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <FolderPlus className="w-4 h-4" />
                                  Create a folder first
                                </div>
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Second Row - Enhance and Delete */}
                      <div className={`grid gap-2 ${onEdit ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {(() => {
                          // 🎬 Check if selected items include videos/documents (cannot be enhanced)
                          const selectedItems = vaultItems.filter(item => selectedIds.has(item.id));
                          const hasEnhanceableItems = selectedItems.some(item => item.type !== 'video' && item.type !== 'document');
                          const onlyVideosOrDocs = selectedIds.size > 0 && !hasEnhanceableItems;
                          
                          console.log('🎨 📋 ENHANCE BUTTON RENDER:', {
                            onEditExists: !!onEdit,
                            selectedCount: selectedIds.size,
                            selected: Array.from(selectedIds),
                            hasEnhanceableItems,
                            onlyVideosOrDocs,
                            willBeDisabled: selectedIds.size === 0 || onlyVideosOrDocs
                          });
                          return null;
                        })()}
                        {onEdit && (() => {
                          // 🎬 Calculate if button should be disabled (no selection OR only videos/documents)
                          const selectedItems = vaultItems.filter(item => selectedIds.has(item.id));
                          const hasEnhanceableItems = selectedItems.some(item => item.type !== 'video' && item.type !== 'document');
                          const isDisabled = selectedIds.size === 0 || !hasEnhanceableItems;
                          
                          return (
                            <Button
                              onClick={(e) => {
                                console.log('🎨 ========== ENHANCE CLICKED ==========');
                                console.log('🎨 Selected count:', selectedIds.size);
                                console.log('🎨 Selected IDs:', Array.from(selectedIds));
                                e.stopPropagation();
                                e.preventDefault();
                                handleEdit();
                              }}
                              variant="outline"
                              disabled={isDisabled}
                              type="button"
                              className={`h-10 !h-10 min-h-[2.5rem] max-h-[2.5rem] disabled:opacity-50 shadow-md transition-all hover:scale-105 flex items-center justify-center px-3 ${
                                isMobile
                                  ? 'border-purple-400/50 bg-purple-500/20 text-white hover:bg-purple-500/30'
                                  : 'border-purple-300/50 bg-purple-500/20 text-white hover:bg-purple-500/30'
                              }`}
                              title={isDisabled && selectedIds.size > 0 ? 'Videos and documents cannot be enhanced' : ''}
                            >
                              <Wand2 className="w-4 h-4 mr-1.5 sm:mr-2 shrink-0" />
                              <span className="text-xs sm:text-sm whitespace-nowrap">
                                {selectedIds.size > 1 ? `Enhance (${selectedIds.size})` : 'Enhance'}
                              </span>
                            </Button>
                          );
                        })()}
                        
                        <Button
                          onClick={handleDelete}
                          variant="outline"
                          className={`h-10 !h-10 min-h-[2.5rem] max-h-[2.5rem] shadow-md shadow-red-500/30 transition-all hover:scale-105 flex items-center justify-center px-3 ${
                            isMobile
                              ? 'border-red-400/60 bg-red-500/20 text-red-100 hover:bg-red-500/30'
                              : 'border-red-400/50 bg-red-500/20 text-red-200 hover:bg-red-500/30'
                          }`}
                        >
                          <Trash2 className="w-4 h-4 mr-1.5 sm:mr-2 shrink-0" />
                          <span className="text-xs sm:text-sm whitespace-nowrap">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </div>
            )}
          </>
        )}
      </div>

      {/* Media Preview Dialog */}
      <Dialog open={!!previewItem} onOpenChange={(open) => {
        if (!open) {
          setPreviewItem(null);
          // If we came from a folder overlay (mobile or desktop), re-open it
          if (previousFolder) {
            setTimeout(() => {
              setMobileOpenFolder(previousFolder);
              setPreviousFolder(null);
            }, 100);
          }
        }
      }}>
        <DialogContent 
          className={`max-w-3xl pointer-events-auto ${
            isMobile 
              ? 'bg-slate-900 border-slate-700' 
              : 'bg-gradient-to-br from-slate-900 to-slate-800 border-white/20'
          }`}
          style={{ zIndex: 10001, pointerEvents: 'auto' }}
        >
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-3">
              <div className={`p-2 rounded-lg shadow-lg ${
                isMobile ? 'bg-purple-600' : 'bg-gradient-to-br from-purple-500 to-fuchsia-600'
              }`}>
                {previewItem?.type === 'photo' && <Image className="w-5 h-5 text-white" />}
                {previewItem?.type === 'video' && <Video className="w-5 h-5 text-white" />}
                {previewItem?.type === 'audio' && <Mic className="w-5 h-5 text-white" />}
                {previewItem?.type === 'document' && <FileText className="w-5 h-5 text-white" />}
              </div>
              <div>
                <div className="capitalize">{previewItem?.type} Preview</div>
                {previewItem?.duration && (
                  <div className="text-sm font-normal text-slate-400">
                    Duration: {formatDuration(previewItem.duration)}
                  </div>
                )}
              </div>
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              View and interact with your media file
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative w-full bg-black rounded-lg overflow-hidden pointer-events-auto">
            {previewItem?.type === 'photo' && (
              <div className="flex flex-col items-center">
                <img 
                  src={previewItem.base64Data}
                  alt="Preview"
                  className="w-full max-h-[60vh] object-contain"
                />
                
                {/* Photo Name - Editable */}
                <div className="w-full max-w-md mt-4 bg-black/30 backdrop-blur-sm rounded-lg p-4 space-y-3">
                  <label className="text-white/80 text-sm font-medium block">Photo Name</label>
                  {editingMediaName ? (
                    <div className="flex gap-2">
                      <Input
                        value={mediaName}
                        onChange={(e) => setMediaName(e.target.value)}
                        className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                        placeholder="Enter photo name"
                        autoFocus
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter') {
                            const saved = await saveMediaName(previewItem.id, mediaName);
                            if (saved) {
                              setEditingMediaName(false);
                            }
                          } else if (e.key === 'Escape') {
                            const originalName = previewItem.fileName || previewItem.id.replace(/\.[^/.]+$/, '');
                            setMediaName(originalName);
                            setEditingMediaName(false);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={async () => {
                          const saved = await saveMediaName(previewItem.id, mediaName);
                          if (saved) {
                            setEditingMediaName(false);
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="flex-1 text-white font-medium truncate">{mediaName || previewItem.id}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setMediaName(previewItem.id);
                          setEditingMediaName(true);
                        }}
                        className="text-white/70 hover:text-white hover:bg-white/10"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {previewItem?.type === 'video' && (() => {
              console.log('🎬 Video Preview:', {
                url: previewItem.base64Data?.substring(0, 100),
                urlType: previewItem.base64Data?.startsWith('data:') ? 'base64' : 'http',
                mimeType: previewItem.mimeType,
                isRefreshing: isRefreshingUrl
              });
              
              return (
                <div className="flex flex-col items-center w-full">
                  {isRefreshingUrl && (
                    <div className="w-full max-h-[55vh] bg-black flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-2" />
                        <p className="text-white/70 text-sm">Loading video...</p>
                      </div>
                    </div>
                  )}
                  <video 
                    key={previewItem.id}
                    controls 
                    className={`w-full max-h-[55vh] object-contain bg-black relative z-10 pointer-events-auto vault-video-with-controls ${isRefreshingUrl ? 'hidden' : ''}`}
                    style={{ pointerEvents: 'auto' }}
                    src={previewItem.base64Data}
                    playsInline
                    preload="metadata"
                    controlsList="nodownload"
                    onLoadStart={() => console.log('📥 Video load start')}
                    onError={(e) => {
                      const v = e.currentTarget;
                      console.error('❌ Video error:', {
                        errorCode: v.error?.code,
                        errorMsg: v.error?.message,
                        networkState: v.networkState,
                        src: v.src?.substring(0, 100)
                      });
                      toast.error('Video failed to load - check console');
                    }}
                    onLoadedMetadata={(e) => {
                      console.log('✅ Video metadata loaded:', e.currentTarget.duration);
                    }}
                    onCanPlay={() => console.log('✅ Video can play')}
                  >
                    Your browser does not support the video tag.
                  </video>
                  
                  {/* Video Name - Editable */}
                  <div className="w-full max-w-md mt-4 bg-black/30 backdrop-blur-sm rounded-lg p-4 space-y-3">
                    <label className="text-white/80 text-sm font-medium block">Video Name</label>
                    {editingMediaName ? (
                      <div className="flex gap-2">
                        <Input
                          value={mediaName}
                          onChange={(e) => setMediaName(e.target.value)}
                          className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                          placeholder="Enter video name"
                          autoFocus
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              const saved = await saveMediaName(previewItem.id, mediaName);
                              if (saved) {
                                setEditingMediaName(false);
                              }
                            } else if (e.key === 'Escape') {
                              const originalName = previewItem.fileName || previewItem.id.replace(/\.[^/.]+$/, '');
                              setMediaName(originalName);
                              setEditingMediaName(false);
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={async () => {
                            const saved = await saveMediaName(previewItem.id, mediaName);
                            if (saved) {
                              setEditingMediaName(false);
                            }
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="flex-1 text-white font-medium truncate">{mediaName || previewItem.id}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setMediaName(previewItem.id);
                            setEditingMediaName(true);
                          }}
                          className="text-white/70 hover:text-white hover:bg-white/10"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
            
            {previewItem?.type === 'audio' && (
              <div className="p-8 flex flex-col items-center justify-center bg-purple-600 min-h-[300px]">
                <div className="mb-6 p-6 rounded-full bg-black/30 backdrop-blur-sm shadow-2xl">
                  <Mic className="w-16 h-16 text-white drop-shadow-lg" />
                </div>
                <audio 
                  controls 
                  className="w-full max-w-md"
                  src={previewItem.base64Data}
                  preload="metadata"
                  controlsList="nodownload"
                  onError={(e) => {
                    console.error('❌ Audio failed to load:', e);
                    toast.error('Failed to load audio file.');
                  }}
                  onCanPlay={() => {
                    console.log('✅ Audio is ready to play');
                  }}
                >
                  Your browser does not support the audio tag.
                </audio>
                
                {/* Audio Name - Editable */}
                <div className="w-full max-w-md mt-4 bg-black/30 backdrop-blur-sm rounded-lg p-4 space-y-3">
                  <label className="text-white/80 text-sm font-medium block">Audio Name</label>
                  {editingMediaName ? (
                    <div className="flex gap-2">
                      <Input
                        value={mediaName}
                        onChange={(e) => setMediaName(e.target.value)}
                        className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                        placeholder="Enter audio name"
                        autoFocus
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter') {
                            const saved = await saveMediaName(previewItem.id, mediaName);
                            if (saved) {
                              setEditingMediaName(false);
                            }
                          } else if (e.key === 'Escape') {
                            const originalName = previewItem.fileName || previewItem.id.replace(/\.[^/.]+$/, '');
                            setMediaName(originalName);
                            setEditingMediaName(false);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={async () => {
                          const saved = await saveMediaName(previewItem.id, mediaName);
                          if (saved) {
                            setEditingMediaName(false);
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="flex-1 text-white font-medium truncate">{mediaName || previewItem.id}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setMediaName(previewItem.id);
                          setEditingMediaName(true);
                        }}
                        className="text-white/70 hover:text-white hover:bg-white/10"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="mt-2 text-white/80 text-sm text-center">
                  {formatDate(previewItem.timestamp)}
                </div>
              </div>
            )}
            
            {previewItem?.type === 'document' && (
              <div className="p-8 flex flex-col items-center justify-center bg-amber-600 min-h-[300px]">
                <div className="mb-6 p-6 rounded-full bg-black/30 backdrop-blur-sm shadow-2xl">
                  <FileText className="w-16 h-16 text-white drop-shadow-lg" />
                </div>
                
                <div className="w-full max-w-md space-y-4">
                  {/* Document Name - Editable */}
                  <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 space-y-3">
                    <label className="text-white/80 text-sm font-medium block">Document Name</label>
                    {editingMediaName ? (
                      <div className="flex gap-2">
                        <Input
                          value={mediaName}
                          onChange={(e) => setMediaName(e.target.value)}
                          className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                          placeholder="Enter document name"
                          autoFocus
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              const saved = await saveMediaName(previewItem.id, mediaName);
                              if (saved) {
                                setEditingMediaName(false);
                              }
                            } else if (e.key === 'Escape') {
                              // Revert to original name
                              const originalName = previewItem.fileName || previewItem.id.replace(/\.[^/.]+$/, '');
                              setMediaName(originalName);
                              setEditingMediaName(false);
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={async () => {
                            const saved = await saveMediaName(previewItem.id, mediaName);
                            if (saved) {
                              setEditingMediaName(false);
                            }
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="flex-1 text-white font-medium truncate">{mediaName || previewItem.id}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setMediaName(previewItem.id);
                            setEditingMediaName(true);
                          }}
                          className="text-white/70 hover:text-white hover:bg-white/10"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* File Info */}
                  <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Type:</span>
                      <span className="text-white font-medium">{(() => {
                        const mimeType = previewItem.mimeType?.toLowerCase() || '';
                        if (mimeType.includes('pdf')) return 'PDF';
                        if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) return 'Word Document';
                        if (mimeType.includes('spreadsheetml') || mimeType.includes('ms-excel')) return 'Excel Spreadsheet';
                        if (mimeType.includes('presentationml') || mimeType.includes('ms-powerpoint')) return 'PowerPoint';
                        if (mimeType.includes('text/plain')) return 'Text File';
                        if (mimeType.includes('text/csv')) return 'CSV File';
                        if (mimeType.includes('rtf')) return 'Rich Text';
                        return 'Document';
                      })()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/70">Created:</span>
                      <span className="text-white font-medium">{formatDate(previewItem.timestamp)}</span>
                    </div>
                  </div>
                  
                  {/* Download Button */}
                  <Button
                    onClick={async () => {
                      try {
                        // Fetch the file
                        const response = await fetch(previewItem.base64Data);
                        const blob = await response.blob();
                        
                        // Get file extension from MIME type
                        const extension = previewItem.mimeType ? getFileExtension(previewItem.mimeType) : 'bin';
                        const fileName = `${documentName || previewItem.id}${extension.startsWith('.') ? extension : '.' + extension}`;
                        
                        // Create blob URL and download
                        const blobUrl = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = blobUrl;
                        a.download = fileName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        
                        // Clean up
                        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                        toast.success(`Downloaded: ${fileName}`);
                      } catch (error) {
                        console.error('❌ Download failed:', error);
                        toast.error('Failed to download document');
                      }
                    }}
                    className="w-full bg-white/20 hover:bg-white/30 text-white gap-2 border border-white/30"
                  >
                    <Download className="w-4 h-4" />
                    Download Document
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button
              onClick={() => {
                setPreviewItem(null);
                // On mobile, if we came from a folder overlay, re-open it after closing preview
                if (isMobile && previousFolder) {
                  setTimeout(() => {
                    setMobileOpenFolder(previousFolder);
                    setPreviousFolder(null);
                  }, 100);
                }
              }}
              className={`${
                isMobile
                  ? 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700'
                  : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
              }`}
            >
              Close
            </Button>
            {previewItem && onEdit && previewItem.type !== 'document' && (
              <Button
                onClick={async () => {
                  try {
                    // Fetch the blob from the URL (could be base64 data URL or signed URL)
                    let blob: Blob;
                    if (previewItem.base64Data.startsWith('data:')) {
                      // Convert base64 to blob
                      const response = await fetch(previewItem.base64Data);
                      blob = await response.blob();
                    } else {
                      // Fetch from signed URL
                      const response = await fetch(previewItem.base64Data);
                      blob = await response.blob();
                    }
                    
                    const mediaItem: MediaItem = {
                      id: previewItem.id,
                      type: previewItem.type,
                      url: previewItem.base64Data,
                      blob,
                      timestamp: previewItem.timestamp,
                      thumbnail: previewItem.thumbnail
                    };
                    onEdit(mediaItem);
                    setPreviewItem(null);
                  } catch (error) {
                    console.error('❌ Failed to prepare media for enhancement:', error);
                    toast.error('Failed to load media for enhancement');
                  }
                }}
                className="bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-600 hover:to-fuchsia-700 text-white"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Enhance
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Warning Dialog - Archive Theme */}
      <AlertDialog open={showDeleteWarning} onOpenChange={setShowDeleteWarning}>
        <AlertDialogContent 
          className={`shadow-2xl shadow-slate-500/30 ${
            isMobile
              ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-600/50'
              : 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border-slate-500/60'
          }`}
          style={{ zIndex: 10002 }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-white text-base sm:text-lg">
              <div className={`p-2 rounded-full shadow-lg ${
                isMobile ? 'bg-slate-700/50' : 'bg-slate-600/40'
              }`}>
                <AlertTriangle className={`w-5 h-5 ${
                  isMobile ? 'text-slate-300' : 'text-slate-200'
                }`} />
              </div>
              🌫️ Move to Archive?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className={`space-y-3 text-sm ${
                isMobile ? 'text-slate-200' : 'text-white'
              }`}>
                <div>
                  These <strong className={isMobile ? 'text-blue-400' : 'text-blue-300'}>{selectedIds.size}</strong> item(s) will be moved to Archive where they'll be kept for 30 days.
                </div>
                <div className={`font-medium shadow-lg ${
                  isMobile
                    ? 'text-slate-300 bg-slate-700/30 border border-slate-600/40'
                    : 'text-slate-100 bg-black/20 border border-slate-500/40'
                } p-3 rounded-lg`}>
                  💡 You can restore them anytime from Archive in the gear menu.
                </div>
                <div className={`text-sm ${
                  isMobile ? 'text-slate-300' : 'text-white/90'
                }`}>
                  Items will be permanently deleted after 30 days.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className={`w-full sm:w-auto shadow-lg ${
              isMobile
                ? 'bg-slate-800/80 text-white border-slate-600 hover:bg-slate-700'
                : 'bg-white/20 text-white border-white/40 hover:bg-white/30'
            }`}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className={`text-white w-full sm:w-auto font-bold shadow-lg ${
                isMobile
                  ? 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 shadow-slate-500/50'
                  : 'bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 shadow-slate-500/60'
              }`}
            >
              <Archive className="w-4 h-4 mr-2" />
              Move to Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Folder Create/Rename Dialog */}
      <VaultFolderDialog
        open={showFolderDialog}
        onOpenChange={setShowFolderDialog}
        mode={folderDialogMode}
        initialName={editingFolder?.name || ''}
        initialColor={editingFolder?.color || 'blue'}
        initialIsPrivate={editingFolder?.isPrivate || false}
        initialIcon={editingFolder?.icon}
        onConfirm={folderDialogMode === 'create' ? createFolder : renameFolder}
        isLoading={isFolderOperationLoading}
      />

      {/* Private Folder Password Dialog */}
      <VaultPasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        folderName={passwordFolder?.name || 'Private Folder'}
        onConfirm={handlePasswordUnlock}
      />

      {/* Folder Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteFolderDialog} onOpenChange={setShowDeleteFolderDialog}>
        <AlertDialogContent className={`shadow-2xl shadow-red-500/50 ${
          isMobile
            ? 'bg-gradient-to-br from-slate-900 to-red-950 border-red-500/50'
            : 'bg-gradient-to-br from-red-600 via-red-700 to-red-800 border-red-400/60'
        }`}>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-white text-base sm:text-lg">
              <div className={`p-2 rounded-full shadow-lg ${
                isMobile ? 'bg-red-500/30' : 'bg-yellow-400/30'
              }`}>
                <AlertTriangle className={`w-5 h-5 ${
                  isMobile ? 'text-red-200' : 'text-yellow-200'
                }`} />
              </div>
              Delete Folder?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className={`space-y-3 text-sm ${
                isMobile ? 'text-slate-200' : 'text-white'
              }`}>
                <div>
                  You are about to delete the folder <strong className={isMobile ? 'text-red-400' : 'text-yellow-200'}>"{folderToDelete?.name}"</strong>
                  {folderToDelete?.mediaIds?.length > 0 && (
                    <> containing <strong className={isMobile ? 'text-red-400' : 'text-yellow-200'}>{folderToDelete.mediaIds.length}</strong> item(s)</>
                  )}.
                </div>
                <div className={`font-medium shadow-lg ${
                  isMobile
                    ? 'text-blue-300 bg-blue-500/20 border border-blue-500/40'
                    : 'text-blue-100 font-semibold bg-black/30 border-2 border-blue-400/50'
                } p-3 rounded-lg`}>
                  ℹ️ Media files will be moved to "Unsorted" and won't be deleted.
                </div>
                <div className={`text-sm ${
                  isMobile ? 'text-slate-300' : 'text-white/90'
                }`}>
                  Are you sure you want to continue?
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className={`w-full sm:w-auto shadow-lg ${
              isMobile
                ? 'bg-slate-800/80 text-white border-slate-600 hover:bg-slate-700'
                : 'bg-white/20 text-white border-white/40 hover:bg-white/30'
            }`}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteFolder}
              className={`text-white w-full sm:w-auto font-bold shadow-lg ${
                isMobile
                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-500/50'
                  : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-orange-500/60'
              }`}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Folder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Folder Overlay Portal - Now works on Desktop + Mobile */}
      {(() => {
        console.log('🎭 Render check - mobileOpenFolder:', !!mobileOpenFolder, 'previewItem:', !!previewItem);
        console.log('🎭 Should render FolderOverlay:', mobileOpenFolder && !previewItem);
        return null;
      })()}
      {mobileOpenFolder && !previewItem && (
        <FolderOverlay
          folder={mobileOpenFolder}
          items={folderOverlayItems}
          onClose={() => {
            setMobileOpenFolder(null);
            setPreviousFolder(null);
            // 🔥 FIX: Scroll to top when exiting folder
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onItemPreview={(item) => {
            console.log('🖼️ Item preview requested from folder overlay:', item.id);
            // Store the current folder so we can return to it
            setPreviousFolder(mobileOpenFolder);
            // Close the folder overlay first to avoid z-index conflicts
            setMobileOpenFolder(null);
            // Then open the preview with a slight delay to ensure clean transition
            setTimeout(() => {
              setPreviewItem(item);
            }, 50);
          }}
          selectedIds={selectedIds}
          onToggleSelect={(id) => {
            toggleSelect(id);
          }}
          onUseMedia={onUseMedia ? handleUseMedia : undefined}
          onEdit={onEdit ? handleEdit : undefined}
          onDelete={handleDelete}
          onClearSelection={clearSelection}
          onMoveToFolder={(folderId) => {
            const selectedArray = Array.from(selectedIds);
            moveMediaToFolder(selectedArray, folderId);
          }}
          folders={folders}
          onUploadToFolder={handleFileUpload}
          isUploading={isUploading}
          importedMediaIds={importedMediaIds}
          onExportFolder={() => exportFolder(mobileOpenFolder)}
          onSaveMediaName={saveMediaName}
        />
      )}
      
      {/* Phase 4C: Folder Template Selector */}
      <FolderTemplateSelector
        open={showTemplateSelector}
        onOpenChange={setShowTemplateSelector}
        onSelectTemplate={applyFolderTemplate}
      />
      
      {/* Phase 5A: Folder Share Manager */}
      {/* REMOVED: Share folder functionality - redundant with Legacy Access system */}
      
      {/* Export Preview Dialog */}
      {exportingFolder && (
        <ExportPreviewDialog
          open={showExportPreview}
          onOpenChange={setShowExportPreview}
          onConfirm={() => exportFolder(exportingFolder)}
          folderName={exportingFolder.name}
          fileCount={vaultItems.filter(item => exportingFolder.mediaIds?.includes(item.id)).length}
          estimatedSize={estimateZipSize(vaultItems.filter(item => exportingFolder.mediaIds?.includes(item.id)).map(m => ({ ...m, size: 0 })))}
          files={vaultItems.filter(item => exportingFolder.mediaIds?.includes(item.id)).map(item => ({
            type: item.type,
            name: item.name || `${item.type}_${item.id}`,
            timestamp: item.timestamp
          }))}
        />
      )}

      {/* Export Progress Modal */}
      <ExportProgressModal
        open={showExportProgress}
        progress={exportProgress}
        currentFile={exportCurrentFile}
        processedFiles={exportProcessedFiles}
        totalFiles={exportingFolder ? vaultItems.filter(item => exportingFolder.mediaIds?.includes(item.id)).length : 0}
        status={exportStatus}
      />

      {/* Export History Modal */}
      <ExportHistoryModal
        open={showExportHistory}
        onOpenChange={setShowExportHistory}
        onReExport={(folderName) => {
          const folder = folders.find(f => f.name === folderName);
          if (folder) {
            setExportingFolder(folder);
            setShowExportPreview(true);
          } else {
            toast.error('Folder not found');
          }
        }}
      />

    </div>
  );
});
