import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Folder, AlertCircle, RotateCcw, Trash2, X } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { MediaPreviewModal } from './MediaPreviewModal';
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

interface DeletedCapsule {
  id: string;
  title: string;
  date: string;
  deletedAt: string;
  deletedFrom: string | null;
  type: 'capsule';
  status?: string;
  recipient_type?: string;
  isArchivedReceived?: boolean; // Flag from backend indicating this will restore to Received folder
  sender_name?: string;
  recipient_name?: string;
  recipient_email?: string;
  media?: Array<{ type: string; url: string }>;
}

interface DeletedFolder {
  id: string;
  name: string;
  color: string;
  deletedAt: string;
  capsuleCount: number;
  type: 'folder';
}

interface DeletedVaultMedia {
  id: string;
  title: string;
  date: number;
  deletedAt: string;
  deletedFrom: string | null;
  deletedFromName: string;
  type: 'vault-media';
  mediaType: 'photo' | 'video' | 'audio' | 'document';
  media?: string[];
  mimeType?: string;
  _debug?: any; // Add debug info from backend
}

type DeletedItem = DeletedCapsule | DeletedFolder | DeletedVaultMedia;

interface ForgottenMemoriesProps {
  accessToken: string;
  onClose: () => void;
  onRestore?: () => void; // Callback to trigger data reload in parent
}

/**
 * 📦 ARCHIVE
 * 
 * Trash & Recovery system for time capsules
 * - 30-day retention before auto-purge
 * - Restore to original location
 * - Mobile-optimized (no custom font sizes, no heavy gradients)
 * - Uses React Portal for proper z-index and positioning
 */
export function ForgottenMemories({ accessToken, onClose, onRestore }: ForgottenMemoriesProps) {
  const [items, setItems] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [emptyingTrash, setEmptyingTrash] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<string[] | null>(null);
  const [showEmptyArchiveDialog, setShowEmptyArchiveDialog] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (accessToken) {
      loadDeletedItems();
    }
  }, [accessToken]);

  const loadDeletedItems = async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/forgotten-memories`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load archive');
      }

      const data = await response.json();
      
      // ✅ MEMORY ERROR HANDLING: Check for memory errors from backend
      if (data.error && data.error.toLowerCase().includes('memory')) {
        console.warn('⚠️ Archive memory limit:', data.details);
        toast.error('Archive is too large', {
          description: 'Some items may not be shown. Try permanently deleting old items.'
        });
      }
      
      console.log('🌫️ Loaded archive:', data.items);
      
      // Debug vault items with media
      const vaultItems = data.items?.filter((item: any) => item.type === 'vault-media') || [];
      console.log('🖼️ Vault items with media:', vaultItems.map((item: any) => ({
        id: item.id,
        title: item.title,
        mediaType: item.mediaType,
        hasMedia: !!item.media,
        mediaCount: item.media?.length || 0,
        firstMediaUrl: item.media?.[0]?.substring(0, 100),
        debug: item._debug // Show debug info from backend
      })));
      
      setItems(data.items || []);
    } catch (error) {
      console.error('Error loading archive:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (itemId: string, itemType: 'capsule' | 'folder' | 'vault-media') => {
    setRestoring(itemId);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/restore-memory`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ itemId, itemType })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to restore');
      }

      const result = await response.json();

      // Show appropriate success message
      if (result.convertedToDraft) {
        console.log('✨ Restored to Drafts (delivery date had passed)');
        toast.success('Restored to Drafts (delivery date had passed)');
      } else if (result.restoredToFolder && result.folderName) {
        console.log(`✅ Restored vault item to folder "${result.folderName}"`);
        toast.success(`Restored to "${result.folderName}" folder`);
      } else if (result.restoredToUnsorted) {
        console.log('✅ Restored vault item to unsorted');
        toast.success('Restored to Vault (original folder was deleted)');
      } else {
        console.log('✅ Restored successfully');
        toast.success('Restored successfully');
      }

      // Remove from list
      setItems(prev => prev.filter(item => item.id !== itemId));
      if (onRestore) {
        onRestore();
      }
    } catch (error) {
      console.error('Error restoring:', error);
      toast.error('Error restoring');
    } finally {
      setRestoring(null);
    }
  };

  const handleDeleteForever = async (itemId: string, itemType: 'capsule' | 'folder' | 'vault-media') => {
    // Create a custom confirmation dialog with Archive theme
    const itemToDelete = items.find(item => item.id === itemId);
    const itemTypeLabel = 
      itemType === 'capsule' ? 'memory' : 
      itemType === 'vault-media' ? 'vault item' : 
      'folder';
    
    const confirmed = confirm(
      `🌫️ Erase from Archive?\n\n` +
      `You're about to permanently erase this ${itemTypeLabel} from existence.\n\n` +
      `"${itemToDelete?.title || 'Untitled'}"\n\n` +
      `This action cannot be undone. The ${itemTypeLabel} will be lost forever, never to be recovered.`
    );
    
    if (!confirmed) {
      return;
    }

    setDeleting(itemId);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/delete-forever`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ itemId, itemType })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete permanently');
      }

      toast.success('Permanently deleted');

      // Remove from list
      setItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting permanently:', error);
      toast.error('Error deleting permanently');
    } finally {
      setDeleting(null);
    }
  };

  const handleEmptyTrash = async () => {
    const confirmed = confirm(
      `📦 Empty Archive?\n\n` +
      `You're about to permanently delete all ${items.length} ${items.length === 1 ? 'item' : 'items'} from the archive.\n\n` +
      `This action cannot be undone. All items will be permanently erased.`
    );
    
    if (!confirmed) {
      return;
    }

    setEmptyingTrash(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/empty-trash`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to empty trash');
      }

      setItems([]);
    } catch (error) {
      console.error('Error emptying trash:', error);
      toast.error('Error emptying trash');
    } finally {
      setEmptyingTrash(false);
    }
  };

  const getDaysRemaining = (deletedAt: string): number => {
    if (!deletedAt) return 30; // Fallback if not set
    
    const deleted = new Date(deletedAt);
    const now = new Date();
    const diffTime = 30 * 24 * 60 * 60 * 1000 - (now.getTime() - deleted.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const formatDeletedDate = (deletedAt: string): string => {
    if (!deletedAt) return 'Deleted recently'; // Fallback
    
    const deleted = new Date(deletedAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - deleted.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Deleted today';
    if (diffDays === 1) return 'Deleted yesterday';
    return `Deleted ${diffDays} days ago`;
  };

  const getStatusBadge = (capsule: DeletedCapsule) => {
    // 🎯 SOURCE OF TRUTH: Check if it will restore to Received folder
    // This flag is set by the backend based on which list the capsule is in
    if (capsule.isArchivedReceived) {
      return { label: 'Received', color: 'bg-yellow-950/20 text-yellow-300 border border-yellow-700/50' };
    }
    
    const status = capsule.status?.toLowerCase();
    const recipientType = capsule.recipient_type;

    // Fallback checks (for backwards compatibility)
    if (recipientType === 'received' || status === 'received') {
      return { label: 'Received', color: 'bg-yellow-950/20 text-yellow-300 border border-yellow-700/50' };
    }
    
    // Status-based badges matching app-wide color scheme
    if (status === 'draft') {
      return { label: 'Draft', color: 'bg-gray-950/20 text-gray-300 border border-gray-700/50' };
    } else if (status === 'scheduled') {
      return { label: 'Scheduled', color: 'bg-blue-950/20 text-blue-300 border border-blue-700/50' };
    } else if (status === 'delivered') {
      return { label: 'Delivered', color: 'bg-green-950/20 text-green-300 border border-green-700/50' };
    }

    return { label: 'Unknown', color: 'bg-slate-950/20 text-slate-400 border border-slate-700/50' };
  };

  const modalContent = (
    <div 
      className="fixed inset-0 bg-slate-950/95 z-[9999] overflow-hidden" 
      style={{ 
        pointerEvents: showEmptyArchiveDialog ? 'none' : 'auto' 
      }}
    >
      <div className="h-full flex flex-col" style={{ pointerEvents: 'auto' }}>
        {/* DESKTOP HEADER - Hidden on mobile */}
        <div className="hidden md:flex flex-shrink-0 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/50">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h2 className="text-white">Archive</h2>
                <p className="text-slate-400 text-sm">
                  {items.length === 0 ? 'No archived items' : `${items.length} ${items.length === 1 ? 'item' : 'items'}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* MOBILE HEADER - Brand new design */}
        <div className="md:hidden flex-shrink-0 bg-gradient-to-b from-slate-900 to-slate-900/95 border-b border-slate-800/50">
          {/* Top bar */}
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h2 className="text-white font-semibold">Archive</h2>
                <p className="text-slate-400 text-xs">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800/50 active:bg-slate-700 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-slate-300" />
            </button>
          </div>
          
          {/* Info banner - mobile compact */}
          {items.length > 0 && (
            <div className="px-4 pb-3">
              <div className="bg-blue-950/20 border border-blue-800/30 rounded-xl px-3 py-2 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-200/80 leading-relaxed">
                  Items auto-delete after 30 days
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Content - Scrollable area that starts at top */}
        <div className="flex-1 overflow-y-auto">
          {/* DESKTOP INFO BANNER - Hidden on mobile */}
          <div className="hidden md:block max-w-4xl mx-auto px-4 pt-6">
            <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-slate-300 text-sm">
                  Items are automatically deleted after 30 days. Restore them before they're gone forever.
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto md:px-4 pb-6">

            {/* Loading state */}
            {loading && (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mx-auto mb-4" />
                <p className="text-slate-400">Loading archive...</p>
              </div>
            )}

            {/* Empty state */}
            {!loading && items.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/50">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-slate-400 mb-2">Archive is empty</p>
                <p className="text-slate-500 text-sm">Deleted items will appear here</p>
              </div>
            )}

            {/* Items list */}
            {!loading && (
              <div className="md:space-y-3">
                <AnimatePresence>
                  {items.map((item) => {
                    const daysRemaining = getDaysRemaining(item.deletedAt);
                    const isUrgent = daysRemaining <= 3;

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="
                          bg-slate-800/50 border-slate-700 rounded-lg hover:bg-slate-800/70 transition-colors
                          md:border md:p-4
                          border-b border-x-0 first:border-t-0 last:border-b-0 p-3 rounded-none
                        "
                      >
                        {/* MOBILE LAYOUT - Completely redesigned */}
                        <div className="md:hidden">
                          {/* Top row: Thumbnail + Title + Badge */}
                          <div className="flex items-start gap-3 mb-2">
                            {/* Thumbnail */}
                            <div className="flex-shrink-0">
                              {item.type === 'folder' ? (
                                <div
                                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                                  style={{ backgroundColor: item.color + '30' }}
                                >
                                  <Folder className="w-5 h-5" style={{ color: item.color }} />
                                </div>
                              ) : item.type === 'vault-media' ? (
                                <div className="flex gap-1">
                                  {item.media && item.media.length > 0 ? (
                                    <div 
                                      className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-700 border border-purple-500/40 active:border-purple-400 transition-colors"
                                      onClick={() => {
                                        // Only preview if not a document
                                        if (item.mediaType !== 'document') {
                                          setPreviewMedia(item.media!);
                                        }
                                      }}
                                    >
                                      <img 
                                        src={item.media[0]} 
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          console.error('❌ Vault thumbnail failed to load:', item.media?.[0]);
                                          console.warn('⚠️ No pre-generated thumbnail - falling back to client-side generation (slow)');
                                          e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23334155" width="100" height="100"/><text x="50" y="50" font-size="40" text-anchor="middle" dy=".3em">📸</text></svg>';
                                        }}
                                        onLoad={() => {
                                          console.log('✅ Vault thumbnail loaded successfully:', item.media?.[0]?.substring(0, 100));
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-11 h-11 rounded-xl bg-purple-900/30 border border-purple-700/40 flex items-center justify-center">
                                      <span className="text-base">
                                        {item.mediaType === 'photo' ? '📸' : item.mediaType === 'video' ? '🎥' : item.mediaType === 'audio' ? '🎵' : '📄'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex gap-1">
                                  {item.media && item.media.length > 0 ? (
                                    <div 
                                      className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-700 border border-slate-600/50 active:border-blue-500 transition-colors"
                                      onClick={() => {
                                        const mediaUrls = item.media!.map((m: any) => m.url || m);
                                        setPreviewMedia(mediaUrls);
                                      }}
                                    >
                                      <img 
                                        src={item.media[0].url || item.media[0]} 
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                      {item.media.length > 1 && (
                                        <div className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[10px] px-1 rounded">
                                          +{item.media.length - 1}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="w-11 h-11 rounded-xl bg-slate-700/50 flex items-center justify-center">
                                      <span className="text-base">📝</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Title + Badge */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2 mb-0.5">
                                <h3 className="text-white text-sm font-medium truncate flex-1">
                                  {item.type === 'folder' ? item.name : item.title}
                                </h3>
                                {item.type === 'capsule' && (
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] flex-shrink-0 ${getStatusBadge(item).color}`}>
                                    {getStatusBadge(item).label}
                                  </span>
                                )}
                                {item.type === 'vault-media' && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] flex-shrink-0 bg-purple-950/30 text-purple-300 border border-purple-700/40">
                                    Vault
                                  </span>
                                )}
                              </div>

                              {/* Subtitle info */}
                              <p className="text-slate-400 text-xs truncate">
                                {item.type === 'folder' && `${item.capsuleCount} ${item.capsuleCount === 1 ? 'capsule' : 'capsules'}`}
                                {item.type === 'vault-media' && `📁 ${item.deletedFromName || 'Unsorted'}`}
                                {item.type === 'capsule' && item.date && (() => {
                                  const capsule = item as DeletedCapsule;
                                  if (capsule.isArchivedReceived) {
                                    return `From ${capsule.sender_name || 'Unknown'}`;
                                  }
                                  if (capsule.recipient_type === 'received' || capsule.status === 'received') {
                                    return `From ${capsule.sender_name || 'Unknown'}`;
                                  } else if (capsule.status === 'delivered') {
                                    const recipientName = capsule.recipient_name || capsule.recipient_email || 'recipient';
                                    return capsule.recipient_type === 'self' ? 'To yourself' : `To ${recipientName}`;
                                  } else if (capsule.status === 'scheduled') {
                                    return new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                  }
                                  return new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                })()}
                              </p>
                            </div>
                          </div>

                          {/* Bottom row: Timer + Actions */}
                          <div className="flex items-center justify-between gap-2">
                            {/* Countdown timer */}
                            <div className="flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${isUrgent ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`} />
                              <span className={`text-xs ${isUrgent ? 'text-red-400 font-medium' : 'text-slate-500'}`}>
                                {daysRemaining}d left
                              </span>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleRestore(item.id, item.type)}
                                disabled={restoring === item.id}
                                className="
                                  h-8 px-3 rounded-lg text-xs font-medium transition-all
                                  bg-blue-600 active:bg-blue-500 text-white
                                  disabled:bg-blue-600/50 disabled:active:bg-blue-600/50
                                  flex items-center gap-1.5
                                "
                              >
                                {restoring === item.id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent" />
                                ) : (
                                  <>
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Restore
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteForever(item.id, item.type)}
                                disabled={deleting === item.id}
                                className="
                                  w-8 h-8 flex items-center justify-center rounded-lg transition-all
                                  bg-slate-700/50 active:bg-red-600 text-slate-400 active:text-white
                                  disabled:bg-slate-700/30 disabled:active:bg-slate-700/30
                                "
                              >
                                {deleting === item.id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* DESKTOP LAYOUT - Unchanged */}
                        <div className="hidden md:flex items-start gap-3">
                          {/* Icon / Thumbnail Preview */}
                          <div className="flex-shrink-0 mt-1">
                            {item.type === 'folder' ? (
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: item.color + '20' }}
                              >
                                <Folder className="w-5 h-5" style={{ color: item.color }} />
                              </div>
                            ) : item.type === 'vault-media' ? (
                              // 📸 VAULT MEDIA: Show clickable thumbnail preview
                              <div className="flex gap-1">
                                {item.media && item.media.length > 0 ? (
                                  <div 
                                    className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-700 border-2 border-purple-500/50 cursor-pointer hover:border-purple-400 transition-colors"
                                    onClick={() => {
                                      console.log('🖼️ Vault thumbnail clicked, media:', item.media);
                                      // Only preview if not a document
                                      if (item.mediaType !== 'document') {
                                        setPreviewMedia(item.media!);
                                      }
                                    }}
                                  >
                                    {/* Only try to load image if it's actually an image/video type, not a document */}
                                    {item.mediaType === 'photo' ? (
                                      <img 
                                        src={item.media[0]} 
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          console.error('❌ Vault thumbnail failed to load:', item.media?.[0]);
                                          e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23334155" width="100" height="100"/><text x="50" y="50" font-size="40" text-anchor="middle" dy=".3em">📸</text></svg>';
                                        }}
                                        onLoad={() => {
                                          console.log('✅ Vault thumbnail loaded successfully:', item.media?.[0]?.substring(0, 100));
                                        }}
                                      />
                                    ) : item.mediaType === 'video' ? (
                                      <>
                                        <img 
                                          src={item.media[0]} 
                                          alt={item.title}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            console.error('❌ Vault thumbnail failed to load:', item.media?.[0]);
                                            e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23334155" width="100" height="100"/><text x="50" y="50" font-size="40" text-anchor="middle" dy=".3em">🎥</text></svg>';
                                          }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                          <span className="text-white text-lg">▶️</span>
                                        </div>
                                      </>
                                    ) : item.mediaType === 'audio' ? (
                                      <div className="absolute inset-0 flex items-center justify-center bg-purple-900/50">
                                        <span className="text-white text-lg">🎵</span>
                                      </div>
                                    ) : null}
                                  </div>
                                ) : (
                                  // Fallback icon if no thumbnail
                                  <div className="w-12 h-12 rounded-lg bg-purple-900/30 border-2 border-purple-700/50 flex items-center justify-center">
                                    {item.mediaType === 'photo' ? (
                                      <span className="text-lg">📸</span>
                                    ) : item.mediaType === 'video' ? (
                                      <span className="text-lg">🎥</span>
                                    ) : item.mediaType === 'audio' ? (
                                      <span className="text-lg">🎵</span>
                                    ) : (
                                      <span className="text-lg">📄</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              // 📦 CAPSULE: Show media thumbnails (up to 2, then +#)
                              <div className="flex gap-1">
                                {item.media && item.media.length > 0 ? (
                                  <>
                                    {item.media.slice(0, 2).map((mediaItem: any, idx: number) => (
                                      <div 
                                        key={idx}
                                        className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-700 border border-slate-600 cursor-pointer hover:border-blue-500 transition-colors"
                                        onClick={() => {
                                          // Extract URLs from capsule media
                                          const mediaUrls = item.media!.map((m: any) => m.url || m);
                                          setPreviewMedia(mediaUrls);
                                        }}
                                      >
                                        <img 
                                          src={mediaItem.url || mediaItem} 
                                          alt=""
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    ))}
                                    {item.media.length > 2 && (
                                      <div 
                                        className="w-12 h-12 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 text-sm cursor-pointer hover:border-blue-500 transition-colors"
                                        onClick={() => {
                                          // Extract URLs from capsule media
                                          const mediaUrls = item.media!.map((m: any) => m.url || m);
                                          setPreviewMedia(mediaUrls);
                                        }}
                                      >
                                        +{item.media.length - 2}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
                                    <span className="text-lg">📝</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-white truncate">
                                {item.type === 'folder' ? item.name : item.title}
                              </h3>
                              {/* Status Badge */}
                              {item.type === 'capsule' && (
                                <span className={`px-2 py-0.5 rounded text-xs flex-shrink-0 ${getStatusBadge(item).color}`}>
                                  {getStatusBadge(item).label}
                                </span>
                              )}
                              {/* Vault Media Badge */}
                              {item.type === 'vault-media' && (
                                <span className="px-2 py-0.5 rounded text-xs flex-shrink-0 bg-purple-950/20 text-purple-300 border border-purple-700/50">
                                  Vault
                                </span>
                              )}
                            </div>
                            
                            {item.type === 'folder' && (
                              <p className="text-slate-400 text-sm">
                                {item.capsuleCount} {item.capsuleCount === 1 ? 'capsule' : 'capsules'}
                              </p>
                            )}
                            {item.type === 'vault-media' && (
                              <p className="text-slate-400 text-sm">
                                📁 {item.deletedFromName || 'Unsorted'}
                              </p>
                            )}
                            {item.type === 'capsule' && item.date && (
                              <p className="text-slate-400 text-sm">
                                {(() => {
                                  const capsule = item as DeletedCapsule;
                                  
                                  // 🎯 SOURCE OF TRUTH: Use isArchivedReceived flag
                                  if (capsule.isArchivedReceived) {
                                    return `Received from ${capsule.sender_name || 'Unknown'}`;
                                  }
                                  
                                  // Fallback to status/recipient_type checks
                                  if (capsule.recipient_type === 'received' || capsule.status === 'received') {
                                    return `Received from ${capsule.sender_name || 'Unknown'}`;
                                  } else if (capsule.status === 'delivered') {
                                    const recipientName = capsule.recipient_name || capsule.recipient_email || 'recipient';
                                    if (capsule.recipient_type === 'self') {
                                      return `Delivered to yourself`;
                                    }
                                    return `Delivered to ${recipientName}`;
                                  } else if (capsule.status === 'scheduled') {
                                    return `Scheduled for ${new Date(item.date).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}`;
                                  }
                                  // Fallback: just show the date
                                  return new Date(item.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  });
                                })()}
                              </p>
                            )}
                            
                            <div className="mt-2 flex items-center gap-2 text-xs">
                              <span className="text-slate-500">
                                {formatDeletedDate(item.deletedAt)}
                              </span>
                              <span className="text-slate-600">•</span>
                              <span className={isUrgent ? 'text-red-400' : 'text-slate-500'}>
                                {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
                                {isUrgent && ' ⚠️'}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleRestore(item.id, item.type)}
                              disabled={restoring === item.id}
                              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                            >
                              {restoring === item.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                              ) : (
                                <>
                                  <RotateCcw className="w-4 h-4" />
                                  <span className="hidden sm:inline">Restore</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteForever(item.id, item.type)}
                              disabled={deleting === item.id}
                              className="px-3 py-2 bg-slate-700 hover:bg-red-600 disabled:bg-slate-700/50 text-slate-300 hover:text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                            >
                              {deleting === item.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                              ) : (
                                <>
                                  <Trash2 className="w-4 h-4" />
                                  <span className="hidden sm:inline">Delete</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {/* Empty archive button */}
            {!loading && items.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-800 px-4 md:px-0">
                <button
                  onClick={() => setShowEmptyArchiveDialog(true)}
                  disabled={emptyingTrash}
                  className="w-full sm:w-auto px-6 py-3 bg-red-600/10 hover:bg-red-600/20 active:bg-red-600/20 border border-red-600/30 text-red-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {emptyingTrash ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent" />
                      Emptying...
                    </span>
                  ) : (
                    `Empty Archive (${items.length})`
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to render at document body level
  return createPortal(
    <>
      {modalContent}
      
      {/* Media Preview Modal */}
      {previewMedia && previewMedia.length > 0 && (
        <div 
          className="fixed inset-0 bg-black/90 z-[10000] flex items-center justify-center p-4"
          onClick={() => setPreviewMedia(null)}
        >
          <div 
            className="relative max-w-5xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setPreviewMedia(null)}
              className="absolute top-2 right-2 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              aria-label="Close preview"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Media display */}
            <div className="flex items-center justify-center">
              <img
                src={previewMedia[0]}
                alt="Preview"
                className="max-w-full max-h-[90vh] rounded-lg object-contain"
                onClick={() => setPreviewMedia(null)}
              />
            </div>
            
            {/* Media count indicator if multiple */}
            {previewMedia.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/70 text-white text-sm rounded-full">
                1 of {previewMedia.length}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Empty Archive Confirmation Dialog */}
      {showEmptyArchiveDialog && (
        <div 
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ 
            zIndex: 2147483647,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            pointerEvents: 'auto'
          }}
          onClick={() => setShowEmptyArchiveDialog(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-md w-full shadow-xl"
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white text-lg font-semibold mb-2">📦 Empty Archive?</h3>
            <p className="text-slate-300 text-sm mb-6">
              You're about to permanently delete all {items.length} {items.length === 1 ? 'item' : 'items'} from the archive.
              <br /><br />
              This action cannot be undone. All items will be permanently erased.
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <button
                onClick={() => setShowEmptyArchiveDialog(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 rounded-lg transition-colors"
                style={{ pointerEvents: 'auto' }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setEmptyingTrash(true);
                  try {
                    const response = await fetch(
                      `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/empty-trash`,
                      {
                        method: 'DELETE',
                        headers: {
                          'Authorization': `Bearer ${accessToken}`
                        }
                      }
                    );

                    if (!response.ok) {
                      throw new Error('Failed to empty trash');
                    }

                    setItems([]);
                    toast.success('Archive emptied');
                  } catch (error) {
                    console.error('Error emptying trash:', error);
                    toast.error('Error emptying trash');
                  } finally {
                    setEmptyingTrash(false);
                    setShowEmptyArchiveDialog(false);
                  }
                }}
                disabled={emptyingTrash}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors disabled:opacity-50"
                style={{ pointerEvents: 'auto' }}
              >
                {emptyingTrash ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Emptying...
                  </span>
                ) : (
                  `Empty Archive (${items.length})`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}