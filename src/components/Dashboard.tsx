import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar as CalendarComponent } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Checkbox } from './ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from './ui/dialog';
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
import { ScrollArea } from './ui/scroll-area';
import { FolderHeader } from './FolderHeaders';
import { MobileSearchBar } from './MobileSearchBar';
import { 
  Clock, 
  Video, 
  Mic, 
  Image, 
  MessageSquare, 
  Search, 
  Filter,
  Edit,
  Calendar,
  User,
  Play,
  Trash2,
  Phone,
  Instagram,
  Twitter,
  Facebook,
  RefreshCw,
  Globe,
  Check,
  Square,
  CheckCircle,
  Wifi,
  WifiOff,
  Inbox,
  Send,
  PlusCircle,
  Camera,
  Wand2,
  BarChart3,
  Settings,
  HelpCircle,
  FileText,
  Upload,
  Download,
  X,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Grid3x3,
  List,
  AlertTriangle,
  Mail
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { DatabaseService } from '../utils/supabase/database';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner';
import { MediaPreview } from './MediaPreview';
import { MediaThumbnail } from './MediaThumbnail';
import { MediaPreviewModal } from './MediaPreviewModal';
import { EditDeliveryTime } from './EditDeliveryTime';
import { DashboardSkeleton, DashboardSkeletonMobile } from './DashboardSkeleton';
import { PullToRefresh } from './PullToRefresh';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { cacheCapsules, getCachedCapsules } from '../utils/offline-storage';
import { getUserTimeZone, formatInUserTimeZone, fromUTC, getTimeZoneAbbreviation, TIME_ZONES } from '../utils/timezone';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { ReceivedCapsules } from './ReceivedCapsules';
import { CapsuleCard } from './CapsuleCard';
import { CapsuleGridSkeleton } from './CapsuleGridSkeleton';
import { CosmicEmptyState } from './CosmicEmptyState';
import { CapsuleDetailModal } from './CapsuleDetailModal';
import { measurePerformance } from '../utils/performance-monitor';
import { useIsMobile } from './ui/use-mobile';

// Phase 1B - Enhanced Interactions (Quick Actions, Batch Operations, Skeleton, Empty States)

// Utility functions for formatting delivery date and time - optimized
const formatDeliveryDateTime = (deliveryDate, deliveryTime, timeZone) => {
  console.log('🕐 formatDeliveryDateTime called with:', { deliveryDate, deliveryTime, timeZone });
  
  if (!deliveryDate) {
    console.log('❌ No delivery date provided');
    return 'No delivery date set';
  }
  
  try {
    // Parse delivery date - it's already an ISO timestamp
    let utcDateTime = new Date(deliveryDate);
    
    // If the deliveryDate doesn't include time info and we have a separate deliveryTime, combine them
    if (deliveryTime && deliveryDate.length === 10) {
      // deliveryDate is just a date string (YYYY-MM-DD), combine with time
      const dateTimeString = `${deliveryDate}T${deliveryTime}:00Z`;
      console.log('🕐 Combining date and time:', dateTimeString);
      utcDateTime = new Date(dateTimeString);
    } else {
      console.log('🕐 Parsing ISO timestamp:', deliveryDate);
    }
    
    if (isNaN(utcDateTime.getTime())) {
      console.log('❌ Invalid UTC datetime');
      return 'Invalid delivery date';
    }
    
    // Convert to display timezone
    const displayTimeZone = timeZone || getUserTimeZone();
    console.log('🌍 Converting to timezone:', displayTimeZone);
    
    const formatted = utcDateTime.toLocaleString('en-US', {
      timeZone: displayTimeZone,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    console.log('✅ Formatted:', formatted);
    return formatted;
  } catch (error) {
    console.error('❌ Error formatting delivery date:', error);
    return 'Error formatting date';
  }
};

const formatRelativeDeliveryTime = (deliveryDate, deliveryTime, timeZone, status) => {
  if (!deliveryDate) return null;
  
  // Don't show relative time for delivered capsules - the date is sufficient
  if (status === 'delivered') return null;
  
  try {
    // Parse delivery date - it's already an ISO timestamp
    let utcDateTime = new Date(deliveryDate);
    
    // If the deliveryDate doesn't include time info and we have a separate deliveryTime, combine them
    if (deliveryTime && deliveryDate.length === 10) {
      const dateTimeString = `${deliveryDate}T${deliveryTime}:00Z`;
      utcDateTime = new Date(dateTimeString);
    }
    
    if (isNaN(utcDateTime.getTime())) {
      return null;
    }
    
    const now = new Date();
    
    // Get start of today in local timezone for accurate day comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const deliveryDay = new Date(utcDateTime.getFullYear(), utcDateTime.getMonth(), utcDateTime.getDate());
    
    // Calculate difference in days (using start of day for accurate counting)
    const diffMs = deliveryDay.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    // Don't show "Past due" for any capsules - if it's past the date, don't show relative time
    if (diffDays < 0) {
      return null;
    } else if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays <= 7) {
      return `In ${diffDays} days`;
    } else if (diffDays <= 30) {
      const weeks = Math.floor(diffDays / 7);
      return `In ${weeks} week${weeks !== 1 ? 's' : ''}`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `In ${months} month${months !== 1 ? 's' : ''}`;
    }
  } catch (error) {
    console.error('Error calculating relative time:', error);
    return null;
  }
};

// Media Carousel Component for capsule cards
function MediaCarousel({ mediaFiles, onMediaClick }) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  
  // Debug logging
  if (mediaFiles && mediaFiles.length > 0) {
    console.log('📸 MediaCarousel received media files:', mediaFiles.length, mediaFiles);
  }
  
  if (!Array.isArray(mediaFiles) || mediaFiles.length === 0) return null;
  
  const currentMedia = mediaFiles[currentIndex];
  const hasMultipleMedia = mediaFiles.length > 1;
  
  // Support both 'type' and 'file_type' field names
  const mediaType = currentMedia?.type || currentMedia?.file_type || '';
  const isImage = mediaType.startsWith('image/');
  const isVideo = mediaType.startsWith('video/');
  const isAudio = mediaType.startsWith('audio/');
  
  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? mediaFiles.length - 1 : prev - 1));
  };
  
  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === mediaFiles.length - 1 ? 0 : prev + 1));
  };
  
  return (
    <div className="space-y-2">
      {/* Media Display */}
      {(isImage || isVideo) && currentMedia ? (
        <div className="relative group overflow-hidden rounded-lg">
          <div 
            className="relative w-full h-56 sm:h-64 rounded-lg overflow-hidden bg-muted cursor-pointer transition-all duration-300"
            onClick={(e) => {
              e.stopPropagation();
              onMediaClick(currentMedia);
            }}
          >
            {isVideo ? (
              <>
                <video 
                  src={currentMedia.url} 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  muted
                  playsInline
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors duration-300">
                  <Play className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
              </>
            ) : (
              <img 
                src={currentMedia.url} 
                alt="Preview" 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            )}
            
            {/* Navigation Arrows - Only show if multiple media */}
            {hasMultipleMedia && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 p-1 sm:p-1.5 bg-black/60 hover:bg-black/90 rounded flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-all z-10"
                  aria-label="Previous media"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 p-1 sm:p-1.5 bg-black/60 hover:bg-black/90 rounded flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-all z-10"
                  aria-label="Next media"
                >
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
                </button>
              </>
            )}
            
            {/* Media counter */}
            {hasMultipleMedia && (
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded-full">
                {currentIndex + 1}/{mediaFiles.length}
              </div>
            )}
          </div>
        </div>
      ) : isAudio && currentMedia ? (
        <div className="relative">
          <div 
            className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:opacity-80 transition-opacity p-3 rounded-lg border border-border"
            onClick={(e) => {
              e.stopPropagation();
              onMediaClick(currentMedia);
            }}
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center">
              <Mic className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <span className="font-medium block">Audio message</span>
              {currentMedia.file_name && (
                <span className="text-xs text-muted-foreground/70">{currentMedia.file_name}</span>
              )}
            </div>
            {hasMultipleMedia && (
              <>
                <button
                  onClick={handlePrev}
                  className="p-1.5 hover:bg-muted rounded transition-colors"
                  aria-label="Previous audio"
                >
                  <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
                </button>
                <span className="text-xs bg-purple-100 dark:bg-purple-950/30 px-2 py-1 rounded-full">
                  {currentIndex + 1}/{mediaFiles.length}
                </span>
                <button
                  onClick={handleNext}
                  className="p-1.5 hover:bg-muted rounded transition-colors"
                  aria-label="Next audio"
                >
                  <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
      
      {/* Dot indicators for multiple media */}
      {hasMultipleMedia && (
        <div className="flex justify-center gap-1.5 pt-1">
          {mediaFiles.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-primary w-4' 
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`View media ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Dashboard({ onEditCapsule, onEditCapsuleDetails, onCreateCapsule, onNavigateToAchievements, user, initialViewingCapsuleId, onCloseHamburgerMenu, onCloseOverlays, onClearNotificationCapsuleId }) {
  const isMobile = useIsMobile();
  const [capsules, setCapsules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMediaType, setFilterMediaType] = useState('all');
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Track which notification ID we've processed to avoid reprocessing on remount
  const processedNotificationIdRef = useRef(null);
  
  // FIXED: Initialize selection state from localStorage to survive re-mounts
  const [selectedCapsules, setSelectedCapsules] = useState(() => {
    try {
      const savedSelection = sessionStorage.getItem(`dashboard_selection_${user?.id}`);
      if (savedSelection) {
        const ids = JSON.parse(savedSelection);
        console.log('🔄 Restored selection state:', ids.length, 'capsules');
        return new Set(ids);
      }
    } catch (e) {
      console.warn('Could not restore selection state:', e);
    }
    return new Set();
  });
  
  const [activeTab, setActiveTab] = useState(null); // null means no tab active, no capsules shown
  const [editingDeliveryId, setEditingDeliveryId] = useState(null);
  const [editingDelivery, setEditingDelivery] = useState(null);
  const [networkStatus, setNetworkStatus] = useState('online');
  const [lastSync, setLastSync] = useState(null);
  const [dashboardError, setDashboardError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    // Load view preference from localStorage
    try {
      const saved = localStorage.getItem(`dashboard_view_mode_${user?.id}`);
      return (saved as 'grid' | 'list') || 'grid';
    } catch {
      return 'grid';
    }
  });
  const [totalCapsules, setTotalCapsules] = useState(0);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [folderBeforePreview, setFolderBeforePreview] = useState(null); // Track folder before media preview
  const [receivedCount, setReceivedCount] = useState(0); // Track count of received capsules
  const [receivedCapsules, setReceivedCapsules] = useState([]); // Full received capsules data for "All Capsules" view
  const [receivedLoading, setReceivedLoading] = useState(true); // ✅ NEW: Track loading state for received capsules
  const [expandedMediaCapsules, setExpandedMediaCapsules] = useState(new Set()); // Track which capsules have expanded media on mobile
  const [viewingCapsule, setViewingCapsule] = useState(null); // Track which capsule is being viewed in detail modal
  const [showDeleteDialog, setShowDeleteDialog] = useState(false); // Delete confirmation dialog
  const [capsulesToDelete, setCapsulesToDelete] = useState<Set<string>>(new Set()); // Capsules pending deletion
  const [isDeleting, setIsDeleting] = useState(false); // Track deletion in progress
  const [displayLimit, setDisplayLimit] = useState(10); // Number of capsules to display at once
  const [serverStats, setServerStats] = useState(null); // Stats from server (accurate regardless of pagination)

  // Offline Sync
  const { sync: syncOfflineActions } = useOfflineSync();
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  const statsRef = useRef(null);
  const folderBeforeActionRef = useRef(null); // Store folder state during delete/view operations
  
  // ULTIMATE NUCLEAR FIX: Force clear hover states during scroll - targets ALL scroll containers
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    let isScrolling = false;

    const handleScroll = () => {
      if (!isScrolling) {
        isScrolling = true;
        // Immediately add scrolling class to disable ALL hover effects
        document.body.classList.add('is-scrolling');
        
        // Also add to specific grid element for capsules
        const gridElement = document.querySelector('[data-capsule-grid]');
        if (gridElement) {
          gridElement.classList.add('is-scrolling');
        }
      }

      // Clear previous timeout
      clearTimeout(scrollTimeout);

      // Remove class after scrolling stops (100ms increased for better mobile performance)
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
        document.body.classList.remove('is-scrolling');
        
        const gridElement = document.querySelector('[data-capsule-grid]');
        if (gridElement) {
          gridElement.classList.remove('is-scrolling');
        }
      }, 100);
    };

    // CRITICAL FIX: Simplified scroll listener - attach ONLY to primary scroll container
    // Removed multiple listeners and MutationObserver to reduce overhead
    const scrollViewport = document.querySelector('[data-radix-scroll-area-viewport]');
    
    if (scrollViewport) {
      scrollViewport.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      // Fallback to window scroll if ScrollArea not found
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    // REMOVED: touchmove listener - was interfering with native momentum scrolling
    // REMOVED: MutationObserver - was creating unnecessary overhead
    // REMOVED: Multiple scroll listeners - was causing performance issues
    
    return () => {
      if (scrollViewport) {
        scrollViewport.removeEventListener('scroll', handleScroll);
      } else {
        window.removeEventListener('scroll', handleScroll);
      }
      clearTimeout(scrollTimeout);
      document.body.classList.remove('is-scrolling');
    };
  }, []);
  const capsulesDisplayRef = useRef(null); // Ref for auto-scrolling to capsules display
  const lastFetchTimeRef = useRef(0); // Track last fetch time to avoid redundant polling

  const maxRetries = 3;
  const PAGE_SIZE = 10; // Load 10 capsules at a time for pagination (Load More button)
  const INITIAL_FETCH_SIZE = undefined; // Fetch ALL capsules initially (metadata only)
  
  // CRITICAL: Utility function to completely clear all Dashboard-related cache
  const clearAllDashboardCache = () => {
    if (!user?.id) return;
    
    const cacheKey = `dashboard_capsules_${user.id}`;
    const selectionKey = `dashboard_selection_${user.id}`;
    const restoredKey = `dashboard_selection_restored_${user.id}`;
    const receivedCacheKey = `received_capsules_${user.id}`;
    
    try {
      localStorage.removeItem(cacheKey);
      sessionStorage.removeItem(cacheKey);
      sessionStorage.removeItem(selectionKey);
      sessionStorage.removeItem(restoredKey);
      localStorage.removeItem(receivedCacheKey); // Clear received capsules cache
      
      // Set invalidation timestamp to prevent stale cache from being used
      localStorage.setItem(`dashboard_invalidated_${user.id}`, Date.now().toString());
      
      console.log('🧹 All Dashboard cache cleared completely (including received capsules)');
    } catch (error) {
      console.warn('Failed to clear all cache:', error);
    }
  };
  
  // Helper function to refresh received capsules count and data
  const refreshReceivedCount = async () => {
    if (!user?.id || !user?.email) return;
    
    try {
      setReceivedLoading(true); // ✅ Show loading state
      console.log('🔄 Refreshing received capsules...');
      const received = await DatabaseService.getReceivedCapsules(user.id, user.email);
      const count = received?.length || 0;
      
      setReceivedCount(count);
      setReceivedCapsules(received || []); // Store full capsules data
      setReceivedLoading(false); // ✅ Done loading
      
      // Update cache
      const cacheKey = `received_capsules_${user.id}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        count,
        capsules: received,
        timestamp: Date.now()
      }));
      
      console.log('✅ Received capsules refreshed:', count);
    } catch (error) {
      console.error('❌ Failed to refresh received capsules:', error);
      setReceivedLoading(false); // ✅ Stop loading even on error
    }
  };
  
  // FIXED: Persist selection state to survive re-mounts
  useEffect(() => {
    try {
      if (selectedCapsules.size > 0) {
        sessionStorage.setItem(
          `dashboard_selection_${user?.id}`, 
          JSON.stringify(Array.from(selectedCapsules))
        );
      } else {
        sessionStorage.removeItem(`dashboard_selection_${user?.id}`);
      }
    } catch (e) {
      console.warn('Could not save selection state:', e);
    }
  }, [selectedCapsules, user?.id]);
  
  // FIXED: Notify user when selection is restored after Dashboard loads
  useEffect(() => {
    if (!isLoading && selectedCapsules.size > 0) {
      const restoredFlag = sessionStorage.getItem(`dashboard_selection_restored_${user?.id}`);
      if (!restoredFlag) {
        console.log('✅ Selection restored:', selectedCapsules.size, 'capsules');
        toast.info(`Selection restored: ${selectedCapsules.size} capsule${selectedCapsules.size !== 1 ? 's' : ''} selected`, {
          duration: 3000,
        });
        sessionStorage.setItem(`dashboard_selection_restored_${user?.id}`, 'true');
        
        // Clear the flag after a short delay so it can show again on next mount
        setTimeout(() => {
          sessionStorage.removeItem(`dashboard_selection_restored_${user?.id}`);
        }, 5000);
      }
    }
  }, [isLoading, selectedCapsules.size, user?.id]);

  // NOTE: Old notification click handler removed - proper handling with received capsules prioritization is at lines ~1166-1221

  // Mark received capsules as viewed when opened
  useEffect(() => {
    if (viewingCapsule && viewingCapsule.isReceived && !viewingCapsule.viewed_at) {
      // Mark capsule as viewed to remove NEW badge
      const markAsViewed = async () => {
        try {
          if (!viewingCapsule?.id) {
            console.error('❌ Cannot mark capsule as viewed: capsule ID is missing', viewingCapsule);
            return;
          }
          
          console.log('👁️ 🚨 MARKING CAPSULE AS VIEWED:', {
            id: viewingCapsule.id,
            title: viewingCapsule.title,
            isReceived: viewingCapsule.isReceived,
            currentViewedAt: viewingCapsule.viewed_at,
            deliveryDate: viewingCapsule.delivery_date
          });
          
          const success = await DatabaseService.markCapsuleAsViewed(viewingCapsule.id);
          
          if (!success) {
            console.error('❌ Backend failed to mark capsule as viewed');
            return;
          }
          
          console.log('✅ Backend confirmed viewed, now fetching updated capsule from server...');
          
          // CRITICAL FIX: Fetch the capsule from backend to get the EXACT timestamp the backend set
          // This prevents timestamp mismatch between frontend and backend
          const updatedCapsule = await DatabaseService.getTimeCapsule(viewingCapsule.id);
          
          if (!updatedCapsule || !updatedCapsule.viewed_at) {
            console.error('❌ Failed to fetch updated capsule or viewed_at not set');
            return;
          }
          
          const viewedTimestamp = updatedCapsule.viewed_at;
          console.log('✅ Got viewed timestamp from backend:', viewedTimestamp);
          
          // CRITICAL: Update the capsule in ALL relevant state arrays for real-time UI update
          
          // 1. Update the viewing capsule itself
          setViewingCapsule(prev => {
            if (!prev) return prev;
            const updated = { ...prev, viewed_at: viewedTimestamp };
            console.log('📝 Updated viewingCapsule state:', { id: updated.id, viewed_at: updated.viewed_at });
            return updated;
          });
          
          // 2. Update in main capsules array (for "All Capsules" view)
          setCapsules(prev => {
            const updated = prev.map(c => 
              c.id === viewingCapsule.id 
                ? { ...c, viewed_at: viewedTimestamp }
                : c
            );
            const found = updated.find(c => c.id === viewingCapsule.id);
            console.log('📝 Updated main capsules array:', { 
              found: !!found, 
              viewed_at: found?.viewed_at,
              totalCapsules: updated.length 
            });
            return updated;
          });
          
          // 3. Update in received capsules list (for "Received" folder view)
          setReceivedCapsules(prev => {
            const updated = prev.map(c => 
              c.id === viewingCapsule.id 
                ? { ...c, viewed_at: viewedTimestamp }
                : c
            );
            const found = updated.find(c => c.id === viewingCapsule.id);
            console.log('📝 Updated receivedCapsules array:', { 
              found: !!found, 
              viewed_at: found?.viewed_at,
              totalReceived: updated.length 
            });
            return updated;
          });
          
          console.log('✅ ✅ ✅ ALL STATE UPDATED! NEW badge should disappear NOW!');
        } catch (error) {
          console.error('❌ Failed to mark capsule as viewed:', error);
        }
      };
      
      markAsViewed();
    } else if (viewingCapsule && viewingCapsule.isReceived) {
      console.log('ℹ️ Capsule already viewed:', {
        id: viewingCapsule.id,
        viewed_at: viewingCapsule.viewed_at
      });
    }
  }, [viewingCapsule]);

  // Restore folder view after returning from editing capsule
  useEffect(() => {
    if (!user?.id) return;
    
    // Check if we have a saved folder to restore
    const savedFolder = sessionStorage.getItem(`dashboard_folder_before_edit_${user.id}`);
    if (savedFolder && !activeTab) {
      console.log('🔄 Restoring folder view after edit:', savedFolder);
      setActiveTab(savedFolder);
      sessionStorage.removeItem(`dashboard_folder_before_edit_${user.id}`);
    }
  }, [user?.id, activeTab]);

  // Hydrate media for specific capsules (lazy loading)
  const hydrateMedia = async (capsulesToHydrate) => {
    if (!capsulesToHydrate || capsulesToHydrate.length === 0) return;

    // Filter out ones that already have attachments
    // CRITICAL FIX: Only hydrate if attachments is undefined/null (not initialized)
    // If it's an empty array [], it means we already tried to fetch and found nothing
    const needingHydration = capsulesToHydrate.filter(c => !c.attachments);
    if (needingHydration.length === 0) return;

    console.log(`💧 Hydrating media for ${needingHydration.length} capsules...`);
    
    // Process in parallel
    const hydrationPromises = needingHydration.map(async (capsule) => {
      try {
        const files = await DatabaseService.getCapsuleMediaFiles(capsule.id);
        return {
          id: capsule.id,
          attachments: files.map(file => ({
            id: file.id,
            url: file.url,
            type: file.file_type,
            filename: file.file_name,
            size: file.file_size
          }))
        };
      } catch (e) {
        console.warn(`Failed to hydrate media for ${capsule.id}`, e);
        return null;
      }
    });
    
    const results = await Promise.all(hydrationPromises);
    const updates = new Map();
    results.forEach(res => {
      if (res) updates.set(res.id, res.attachments);
    });
    
    if (updates.size > 0) {
      setCapsules(prev => {
        const updatedCapsules = prev.map(c => {
          if (updates.has(c.id)) {
            return { ...c, attachments: updates.get(c.id) };
          }
          return c;
        });
        
        // Update cache with hydrated media
        setTimeout(() => {
          if (user?.id) {
            const cacheKey = `dashboard_capsules_${user.id}`;
            try {
              const existingCache = localStorage.getItem(cacheKey);
              if (existingCache) {
                const parsed = JSON.parse(existingCache);
                localStorage.setItem(cacheKey, JSON.stringify({
                  ...parsed,
                  capsules: updatedCapsules
                }));
                console.log('💾 Cache updated with hydrated media for', updates.size, 'capsules');
              }
            } catch (e) {
              console.warn('Failed to update cache after hydration:', e);
            }
          }
        }, 0);
        
        return updatedCapsules;
      });
    }
  };

  // Enhanced dashboard initialization with caching and pagination
  useEffect(() => {
    let mounted = true;
    let retryTimeout = null;

  const initializeDashboard = async (attempt = 1) => {
      if (!mounted) return;

      // IMPORTANT: Declare hasValidCache at function scope so it's accessible in catch block
      let hasValidCache = false;
      const cacheKey = user?.id ? `dashboard_capsules_${user.id}` : null;

      try {
        console.log(`🔄 Dashboard initialization attempt ${attempt}/${maxRetries}`);
        
        // Get user ID from current user context
        if (!user?.id) {
          throw new Error('User not authenticated');
        }

        // STEP 1: Try to load cached data immediately for instant display
        
        try {
          const cachedDataStr = localStorage.getItem(cacheKey);
          if (cachedDataStr) {
            const cachedData = JSON.parse(cachedDataStr);
            const cacheAge = Date.now() - cachedData.timestamp;
            
            // CRITICAL: Check if cache was invalidated (e.g., after delete operation)
            const invalidationTimestampStr = localStorage.getItem(`dashboard_invalidated_${user.id}`);
            const invalidationTimestamp = invalidationTimestampStr ? parseInt(invalidationTimestampStr) : 0;
            
            if (invalidationTimestamp > cachedData.timestamp) {
              console.log('🔄 Cache invalidated by recent operation (delete/update). Fetching fresh data.');
              localStorage.removeItem(cacheKey);
              sessionStorage.removeItem(cacheKey);
            } else {
              // CRITICAL: Validate cache integrity - check for deleted capsules
              const capsulesArray = cachedData.capsules || [];
              const hasDuplicateIds = new Set(capsulesArray.map(c => c.id)).size !== capsulesArray.length;
              const hasInvalidCapsules = capsulesArray.some(c => !c.id || !c.created_at);
              
              if (hasDuplicateIds || hasInvalidCapsules) {
                console.warn('🚨 Cache corruption detected! Clearing cache and fetching fresh data');
                localStorage.removeItem(cacheKey);
                sessionStorage.removeItem(cacheKey);
              } else if (cacheAge < 1 * 60 * 1000) {
                // Reduced cache validity to 1 minute (from 2) to ensure fresher data after operations
                console.log('✨ Loading cached capsules for instant display (cache age:', Math.round(cacheAge / 1000), 'seconds)');
                setCapsules(cachedData.capsules || []);
                setTotalCapsules(cachedData.total || 0);
                setHasMore(cachedData.hasMore || false);
                
                // 🔥 CRITICAL: Hydrate cached capsules if they don't have attachments
                // This handles old cache data from before the media hydration fix
                const cachedCapsulesNeedingMedia = (cachedData.capsules || []).filter(c => !c.attachments);
                if (cachedCapsulesNeedingMedia.length > 0) {
                  console.log(`⚡ Hydrating ${cachedCapsulesNeedingMedia.length} cached capsules without media...`);
                  hydrateMedia(cachedCapsulesNeedingMedia.slice(0, 10)).then(() => {
                    setIsLoading(false);
                    console.log('✅ Cached capsules hydrated');
                  });
                } else {
                  setIsLoading(false); // Show UI immediately - cached data already has media
                }
                
                hasValidCache = true;
                
                // Continue to fetch fresh data in background
                console.log('🔄 Fetching fresh data in background...');
              } else {
                console.log('⏰ Cache expired (age:', Math.round(cacheAge / 1000), 'seconds), fetching fresh data');
              }
            }
          }
        } catch (cacheError) {
          console.warn('Cache read failed:', cacheError);
        }

        // STEP 2: Fetch fresh data
        setDashboardError(null);

        // Check network connectivity
        if (!navigator.onLine) {
          if (hasValidCache) {
            console.log('📵 Offline but using cached data');
            return; // Use cached data when offline
          }
          throw new Error('No internet connection');
        }

        console.log('📡 Fetching capsules from database...');
        
        // PHASE 1 OPTIMIZATION: Performance monitoring
        const perfTimer = measurePerformance('Dashboard: Load Capsules');
        
        // CRITICAL FIX: Fetch enough capsules initially to avoid "Load More" for small datasets
        // Fetch 30 initially to ensure we have at least 10 in each filtered view (delivered, scheduled, etc.)
        // This prevents users from having to click "Load More" multiple times for small datasets
        
        // Fetch with pagination and reasonable timeout
        // Backend has 15s timeout, frontend waits 30s (reduced from 45s for faster feedback)
        // CRITICAL FIX: Fetch ALL capsules metadata (limit=undefined, skipMedia=true)
        // This ensures accurate counts and prevents "Load More" appearing when no more items exist
        const fetchPromise = DatabaseService.getUserTimeCapsules(user.id, undefined, 0, true);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout - the server is not responding')), 30000) // 30 seconds
        );
        
        const result = await Promise.race([fetchPromise, timeoutPromise]);
        perfTimer.end({ capsulesLoaded: result.capsules?.length || 0, totalInDB: result.total });
        console.log('✅ Successfully fetched all capsules (metadata):', result.capsules?.length || 0, 'of', result.total);
        console.log('📊 Fetch result details:', {
          capsulesLoaded: result.capsules?.length || 0,
          totalInDatabase: result.total,
          hasMore: result.hasMore,
          pageSize: PAGE_SIZE
        });

        if (!mounted) return;

        // DEBUG: Log delivered capsules order from server
        const deliveredCapsules = (result.capsules || []).filter(c => c.status === 'delivered');
        if (deliveredCapsules.length > 0) {
          console.log(`\n📊 DELIVERED CAPSULES ORDER FROM SERVER (should be newest first):`);
          deliveredCapsules.slice(0, 10).forEach((c, idx) => {
            const sortKey = c.delivered_at || c.delivery_date || c.created_at;
            console.log(`  ${idx + 1}. "${c.title}" | delivered_at: ${c.delivered_at || 'MISSING'} | delivery_date: ${c.delivery_date} | created_at: ${c.created_at} | Sort Key: ${sortKey}`);
          });
        }

        // Merge with existing state to preserve hydrated media
        // This prevents media flickering/re-loading when fresh metadata arrives
        setCapsules(prev => {
          const attachmentMap = new Map();
          prev.forEach(c => {
            if (c.attachments && c.attachments.length > 0) {
              attachmentMap.set(c.id, c.attachments);
            }
          });
          
          return (result.capsules || []).map(newCapsule => {
            const existingAttachments = attachmentMap.get(newCapsule.id);
            if (existingAttachments) {
              // Preserve existing attachments
              return { ...newCapsule, attachments: existingAttachments };
            }
            return newCapsule;
          });
        });
        setTotalCapsules(result.total);
        setHasMore(false); // We fetched all, so no more in DB
        setCurrentPage(0);
        setLastSync(new Date());
        setNetworkStatus('online');
        setRetryCount(0);
        
        // 🔥 CRITICAL UX FIX: Hydrate media for visible capsules BEFORE showing UI
        // This prevents the visual glitch where capsules appear without attachments
        console.log('🎬 Hydrating media for initial visible capsules...');
        await hydrateMedia((result.capsules || []).slice(0, 10));
        console.log('✅ Initial media hydration complete');
        
        // PHASE 1 FIX: Track last fetch time to avoid redundant polling
        lastFetchTimeRef.current = Date.now();
        
        console.log('📝 Dashboard state updated - capsules in state:', result.capsules?.length || 0);

        // Fetch accurate stats from server (not affected by pagination)
        try {
          console.log('📊 Fetching accurate stats from server...');
          const statsResponse = await DatabaseService.getCapsuleStats(user.id);
          if (statsResponse && !statsResponse.error) {
            console.log('✅ Server stats loaded:', statsResponse);
            setServerStats(statsResponse);
          } else {
            console.log('ℹ️ Server stats not available, using client-side calculation');
          }
        } catch (statsError) {
          console.log('ℹ️ Stats fetch failed (non-critical), using client-side calculation:', statsError);
          // Don't fail the whole dashboard if stats fail - use client-side calculation
        }

        // 🔥 CRITICAL: Cache capsules AFTER media hydration to include attachments
        // This prevents the visual glitch when loading from cache
        try {
          // Get the current state which now includes hydrated media
          const capsulesWithMedia = await new Promise<any[]>(resolve => {
            setCapsules(prev => {
              resolve(prev); // Capture current state with hydrated media
              return prev; // Don't modify state
            });
          });
          
          localStorage.setItem(cacheKey, JSON.stringify({
            capsules: capsulesWithMedia,
            total: result.total,
            hasMore: result.hasMore,
            timestamp: Date.now()
          }));
          
          // Also cache to IndexedDB for offline use (more robust)
          if (capsulesWithMedia && capsulesWithMedia.length > 0) {
            cacheCapsules(capsulesWithMedia).catch(err => 
              console.warn('Failed to cache capsules to IndexedDB:', err)
            );
          }
        } catch (cacheError) {
          console.warn('Cache write failed:', cacheError);
        }
      } catch (error) {
        console.error(`❌ Dashboard initialization failed (attempt ${attempt}):`, error);

        if (!mounted) return;
        
        // Check if this is a timeout error
        const isTimeoutError = error.message?.includes('timeout') || 
                              error.message?.includes('timed out');

        // For timeout errors, show cached data if available instead of retrying indefinitely
        if (isTimeoutError && hasValidCache) {
          console.warn('⚠️ Query timeout but using cached data');
          toast.warning('Loading from cache. Some data may be outdated.', {
            duration: 3000,
          });
          setNetworkStatus('offline');
          setIsLoading(false);
          return; // Don't retry, use cached data
        }
        
        // Try IndexedDB if localStorage cache not available
        if (isTimeoutError || !navigator.onLine) {
          try {
            const cachedCapsules = await getCachedCapsules();
            if (cachedCapsules && cachedCapsules.length > 0) {
              console.log('📱 Loaded capsules from offline storage:', cachedCapsules.length);
              setCapsules(cachedCapsules);
              setTotalCapsules(cachedCapsules.length);
              setNetworkStatus('offline');
              setIsLoading(false);
              return;
            }
          } catch (e) {
            console.warn('Failed to load from offline storage:', e);
          }
        }

        if (attempt < maxRetries) {
          const retryDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`⏳ Retrying in ${retryDelay}ms...`);
          
          setRetryCount(attempt);
          retryTimeout = setTimeout(() => {
            if (mounted) {
              initializeDashboard(attempt + 1);
            }
          }, retryDelay);
        } else {
          // After all retries failed
          if (isTimeoutError) {
            setDashboardError('The server is taking longer than expected to respond. Your capsules are safe. Please try refreshing the page, or wait a moment and try again.');
            toast.error('Loading timeout. Please refresh to try again.', {
              duration: 5000,
            });
          } else {
            setDashboardError(error.message);
          }
          setNetworkStatus('offline');
          console.error('🚨 Dashboard initialization failed after all retries');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeDashboard();

    return () => {
      mounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [user?.id]); // Re-run when user ID changes

  // Check for newly received capsule from email link
  useEffect(() => {
    if (!isLoading) {
      const capsuleId = sessionStorage.getItem('capsule_just_received');
      const capsuleTitle = sessionStorage.getItem('capsule_just_received_title');
      
      if (capsuleId && capsuleTitle) {
        console.log('🎉 Capsule just received from email:', capsuleId);
        toast.success(`Time capsule "${capsuleTitle}" opened! You can view it in your dashboard.`, {
          duration: 5000,
        });
        
        // Clear the flags
        sessionStorage.removeItem('capsule_just_received');
        sessionStorage.removeItem('capsule_just_received_title');
        
        // Refresh received capsules to ensure it shows up
        refreshReceivedCount();
      }
    }
  }, [isLoading]);

  // ✅ OPTIMIZED: Fetch received capsules with cache-first strategy and loading state
  useEffect(() => {
    const fetchReceivedCount = async () => {
      if (!user?.id) return;
      
      const cacheKey = `received_capsules_${user.id}`;
      
      try {
        // ✅ PHASE 3: Cache-First Strategy - Show cached data IMMEDIATELY
        const cachedDataStr = localStorage.getItem(cacheKey);
        
        if (cachedDataStr) {
          try {
            const cachedData = JSON.parse(cachedDataStr);
            const cacheAge = Date.now() - cachedData.timestamp;
            
            // ✅ Show cached data immediately regardless of age (to prevent flash)
            console.log(`⚡ [INSTANT] Using cached received data (age: ${Math.round(cacheAge/1000)}s):`, cachedData.count);
            setReceivedCount(cachedData.count);
            setReceivedCapsules(cachedData.capsules || []);
            setReceivedLoading(false); // ✅ Cache loaded, not loading anymore
            
            // If cache is fresh (< 1 minute), don't fetch in background
            if (cacheAge < 60 * 1000) {
              console.log('✨ Cache is fresh, skipping background fetch');
              return;
            }
            
            // Cache is stale, fetch fresh data in background (silent update)
            console.log('🔄 Cache stale, fetching fresh data in background...');
          } catch (parseError) {
            console.warn('⚠️ Failed to parse cached received data:', parseError);
            // Continue to fetch fresh data
          }
        } else {
          // No cache, show loading state
          setReceivedLoading(true);
        }
        
        // ✅ PHASE 1: Fetch fresh data (either no cache, or background update)
        console.log('📡 Fetching received capsules from server...');
        const received = await DatabaseService.getReceivedCapsules(user.id, user.email);
        const count = received?.length || 0;
        
        setReceivedCount(count);
        setReceivedCapsules(received || []);
        setReceivedLoading(false); // ✅ Done loading
        
        // Cache the fresh data
        localStorage.setItem(cacheKey, JSON.stringify({
          count,
          capsules: received,
          timestamp: Date.now()
        }));
        
        console.log('✅ Received capsules loaded:', count);
      } catch (error) {
        console.error('❌ Failed to fetch received count:', error);
        // Don't show error to user, keep cached data if available or use 0
        setReceivedLoading(false);
        if (!cachedDataStr) {
          setReceivedCount(0);
        }
      }
    };
    
    fetchReceivedCount();
  }, [user?.id]);

  // Real-time WebSocket listener for new received capsules
  useEffect(() => {
    if (!user?.id) return;
    
    console.log(`📡 [Dashboard] Setting up real-time listener for received capsules: ${user.id}`);
    
    const channel = supabase.channel(`received_capsules:${user.id}`);
    
    channel.on('broadcast', { event: 'new_received_capsule' }, (payload) => {
      console.log('📨 [Dashboard] Received new capsule broadcast:', payload);
      
      // Refresh received capsules count
      refreshReceivedCount();
      
      // Show toast notification if not on received tab
      if (activeTab !== 'received') {
        const senderName = payload.payload?.senderName || 'Someone';
        const capsuleTitle = payload.payload?.title || 'a capsule';
        toast.success(`${senderName} sent you "${capsuleTitle}"!`, {
          description: 'Check your Received Capsules tab',
          duration: 5000
        });
      }
    });
    
    channel.subscribe((status) => {
      console.log(`📡 [Dashboard] Channel subscription status: ${status}`);
    });
    
    return () => {
      console.log('📡 [Dashboard] Cleaning up real-time listener');
      supabase.removeChannel(channel);
    };
  }, [user?.id, activeTab]);

  // ✅ CRITICAL FIX: Handle notification clicks - open capsule overlay when initialViewingCapsuleId is set
  useEffect(() => {
    if (!initialViewingCapsuleId) return;
    
    // Extract capsule ID and notification type
    const capsuleId = typeof initialViewingCapsuleId === 'string' 
      ? initialViewingCapsuleId 
      : initialViewingCapsuleId.capsuleId;
    const notificationType = typeof initialViewingCapsuleId === 'object'
      ? initialViewingCapsuleId.notificationType
      : undefined;
    
    console.log('🔔 Notification click detected, finding capsule:', capsuleId, 'notificationType:', notificationType);
    
    // ✅ CRITICAL: If notification type is "received", ALWAYS show as received (yellow)
    const shouldForceAsReceived = notificationType === 'received';
    
    // ✅ CRITICAL: Search in receivedCapsules FIRST (notifications are primarily for received capsules)
    let capsule = receivedCapsules.find(c => c.id === capsuleId);
    let isFromReceived = false;
    
    if (capsule) {
      console.log('✅ Found capsule in receivedCapsules array');
      isFromReceived = true;
    } else {
      // If not found in received, check sent capsules
      capsule = capsules.find(c => c.id === capsuleId);
    }
    
    if (capsule) {
      console.log('✅ Found capsule from notification, opening overlay:', capsule.title);
      // Mark it as received if it came from receivedCapsules OR notification type is "received"
      const capsuleToView = (isFromReceived || shouldForceAsReceived) ? {
        ...capsule,
        isReceived: true // Ensure it displays as received (yellow modal)
      } : capsule;
      // Open the capsule detail modal
      setViewingCapsule(capsuleToView);
      
      // ✅ Clear the notification capsule ID after successfully processing it
      if (onClearNotificationCapsuleId) {
        console.log('🧹 Clearing notification capsule ID after processing');
        onClearNotificationCapsuleId();
      }
    } else {
      // ⚡ INSTANT FETCH: Use direct API call instead of slow sequential fetches  
      console.log('⚡ [INSTANT FETCH] Capsule not in memory, fetching directly by ID...');
      
      // Get access token from Supabase session
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error || !session?.access_token) {
          console.error('❌ Missing access token:', error);
          toast.error('Authentication error. Please refresh the page.');
          return;
        }
        
        const accessToken = session.access_token;
        
        if (!projectId || !accessToken) {
          console.error('❌ Missing project ID or access token');
          toast.error('Authentication error. Please refresh the page.');
          return;
        }
        
        // Single direct API call - much faster than fetching entire arrays
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/capsules/${capsuleId}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          console.log('⚡ [INSTANT FETCH] Raw API response:', data);
          console.log('⚡ [INSTANT FETCH] Capsule loaded (<500ms):', data.capsule?.title || data.title);
          const capsuleData = data.capsule || data; // Handle both response formats
          console.log('⚡ [INSTANT FETCH] Extracted capsule data:', { id: capsuleData?.id, title: capsuleData?.title });
          const capsuleToView = shouldForceAsReceived ? { ...capsuleData, isReceived: true } : capsuleData;
          setViewingCapsule(capsuleToView);
          
          // ✅ Clear the notification capsule ID after successfully processing it
          if (onClearNotificationCapsuleId) {
            console.log('🧹 Clearing notification capsule ID after processing');
            onClearNotificationCapsuleId();
          }
        })
        .catch(err => {
          console.error('❌ [INSTANT FETCH] Error:', err);
          // Fallback to old method if direct fetch fails
          console.log('🔄 Falling back to full array fetch...');
          DatabaseService.getReceivedCapsules(user?.id, user?.email)
            .then(received => {
          console.log(`🔍 [RE-FETCH] Received capsules fetched: ${received?.length || 0} capsules`);
          console.log(`🔍 [RE-FETCH] Looking for capsule ID: ${capsuleId}`);
          console.log(`🔍 [RE-FETCH] Received capsule IDs:`, received?.map(c => c.id));
          let found = received?.find(c => c.id === capsuleId);
          if (found) {
            console.log('✅ Found capsule in received capsules after re-fetch, opening:', found.title);
            setViewingCapsule({ ...found, isReceived: true });
            
            // ✅ Clear the notification capsule ID after successfully processing it
            if (onClearNotificationCapsuleId) {
              console.log('🧹 Clearing notification capsule ID after processing');
              onClearNotificationCapsuleId();
            }
          } else {
            // Only if not found in received, check user's own capsules
            console.log('🔍 [RE-FETCH] Not found in received, trying user capsules...');
            return DatabaseService.getUserTimeCapsules(user?.id, undefined, 0, false)
              .then(result => {
                console.log(`🔍 [RE-FETCH] User capsules fetched: ${result.capsules?.length || 0} capsules`);
                console.log(`🔍 [RE-FETCH] User capsule IDs:`, result.capsules?.map(c => c.id));
                found = result.capsules?.find(c => c.id === capsuleId);
                if (found) {
                  console.log('✅ Found capsule in user capsules after re-fetch, opening:', found.title);
                  // ✅ FIX: Use notification type to determine if should show as received
                  if (shouldForceAsReceived) {
                    console.log('✅ [FIX] Notification type is "received" - showing as YELLOW/RECEIVED modal');
                    setViewingCapsule({ ...found, isReceived: true });
                  } else {
                    console.log('ℹ️ Showing as delivered (green) modal - notification type was:', notificationType);
                    setViewingCapsule(found);
                  }
                  
                  // ✅ Clear the notification capsule ID after successfully processing it
                  if (onClearNotificationCapsuleId) {
                    console.log('🧹 Clearing notification capsule ID after processing');
                    onClearNotificationCapsuleId();
                  }
                } else {
                  console.error('❌ Capsule not found even after re-fetch');
                  toast.error('Could not find the capsule. It may have been deleted.');
                }
              });
          }
            })
            .catch(fallbackErr => {
              console.error('❌ Error in fallback fetch:', fallbackErr);
              toast.error('Failed to load capsule');
            });
        });
      }).catch(authErr => {
        console.error('❌ Error getting auth session:', authErr);
        toast.error('Authentication error. Please refresh the page.');
      });
    }
  }, [initialViewingCapsuleId, capsules, receivedCapsules, user?.id, user?.email]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Network connection restored');
      setNetworkStatus('online');
      setDashboardError(null);
      // Only auto-retry if we have an error state AND actually came back online
      // Don't retry just because capsules.length changes
      if (dashboardError && user?.id) {
        console.log('🔄 Auto-retrying after network restoration...');
        DatabaseService.getUserTimeCapsules(user.id, INITIAL_FETCH_SIZE, 0)
          .then(result => {
            // Merge with existing state to preserve hydrated media
            setCapsules(prev => {
              const attachmentMap = new Map();
              prev.forEach(c => {
                if (c.attachments && c.attachments.length > 0) {
                  attachmentMap.set(c.id, c.attachments);
                }
              });
              
              return (result.capsules || []).map(newCapsule => {
                const existingAttachments = attachmentMap.get(newCapsule.id);
                if (existingAttachments) {
                  return { ...newCapsule, attachments: existingAttachments };
                }
                return newCapsule;
              });
            });
            setTotalCapsules(result.total || 0);
            setHasMore(result.hasMore);
            setCurrentPage(0);
            setDisplayLimit(10);
            setHasMore(result.hasMore || false);
            setLastSync(new Date());
          })
          .catch(error => {
            console.error('❌ Auto-retry failed:', error);
          });
      }
    };

    const handleOffline = () => {
      console.log('📵 Network connection lost');
      setNetworkStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dashboardError, user?.id]); // Removed capsules.length dependency

  // 🔄 Real-time polling for stats updates (every 30 seconds to match scheduler)
  useEffect(() => {
    if (!user?.id || isLoading) return;

    const POLLING_INTERVAL = 30 * 1000; // 30 seconds (matches scheduler interval)
    const INITIAL_DELAY = 5 * 1000; // Wait 5 seconds before first poll (REDUCED from 60s for faster updates)
    
    // PHASE 1 FIX: Skip initial poll if data was fetched within last 30 seconds
    const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
    const skipInitialPoll = timeSinceLastFetch < 30000;
    
    if (skipInitialPoll) {
      console.log('⏭️ Skipping initial poll - data was just loaded', Math.round(timeSinceLastFetch / 1000), 'seconds ago');
    }
    
    let isFirstPoll = true;
    
    const pollForUpdates = async () => {
      try {
        // Only poll if tab is visible and network is online
        if (document.hidden || networkStatus === 'offline') {
          return;
        }

        console.log('🔄 Polling for real-time updates...');
        
        // Fetch ALL capsules (metadata only) to ensure we have the complete list for filtering
        // We use skipMedia=true because we rely on the hydration system (and state preservation) for media
        console.log('📊 Polling for ALL capsules to maintain consistency...');
        
        const result = await DatabaseService.getUserTimeCapsules(user.id, undefined, 0, true);
        
        // PHASE 1 FIX: Update last fetch time after polling
        lastFetchTimeRef.current = Date.now();
        
        // Only update if data actually changed
        const currentIds = capsules.map(c => c.id).sort().join(',');
        const newIds = (result.capsules || []).map(c => c.id).sort().join(',');
        const currentStatuses = capsules.map(c => `${c.id}:${c.status}`).sort().join(',');
        const newStatuses = (result.capsules || []).map(c => `${c.id}:${c.status}`).sort().join(',');
        
        // CRITICAL FIX: Also check if timestamps changed (e.g. edited capsule)
        // This ensures we catch updates even if IDs and status are same
        const currentUpdates = capsules.map(c => `${c.id}:${c.updated_at}`).sort().join(',');
        const newUpdates = (result.capsules || []).map(c => `${c.id}:${c.updated_at}`).sort().join(',');
        
        if (currentIds !== newIds || currentStatuses !== newStatuses || currentUpdates !== newUpdates || result.total !== totalCapsules) {
          console.log('✨ Real-time update detected! Refreshing capsules...');
          
          // Merge with existing state to preserve hydrated media
          setCapsules(prev => {
            const attachmentMap = new Map();
            prev.forEach(c => {
              // CRITICAL: Preserve attachments if they exist and are not empty
              // If we have valid attachments, keep them!
              if (c.attachments && c.attachments.length > 0) {
                attachmentMap.set(c.id, c.attachments);
              }
            });
            
            return (result.capsules || []).map(newCapsule => {
              const existingAttachments = attachmentMap.get(newCapsule.id);
              
              // CRITICAL: Since we polled with skipMedia=true, newCapsule.attachments will be undefined or empty
              // So we ALWAYS prefer the existing attachments if we have them
              if (existingAttachments) {
                return { ...newCapsule, attachments: existingAttachments };
              }
              
              // If we don't have existing attachments, and since we skipped media loading,
              // we should mark this capsule as potentially needing hydration if it doesn't have media
              // But how do we know if it *should* have media? 
              // The backend result from skipMedia=true should ideally include a metadata flag like 'has_media'
              
              return newCapsule;
            });
          });
          setTotalCapsules(result.total);
          setHasMore(result.hasMore);
          // CRITICAL: DON'T reset pagination - preserve user's current view
          // setCurrentPage(0); // REMOVED - was causing capsules to disappear
          // setDisplayLimit(10); // REMOVED - preserve user's display limit
          setLastSync(new Date());
          
          // Update cache
          const cacheKey = `dashboard_capsules_${user.id}`;
          localStorage.setItem(cacheKey, JSON.stringify({
            capsules: result.capsules,
            total: result.total,
            hasMore: result.hasMore,
            timestamp: Date.now()
          }));
        }
        
        // Also poll received capsules
        const received = await DatabaseService.getReceivedCapsules(user.id, user.email);
        const newReceivedCount = received?.length || 0;
        
        // Refresh server stats to keep counters in sync with real-time updates
        try {
          const statsResponse = await DatabaseService.getCapsuleStats(user.id);
          if (statsResponse && !statsResponse.error) {
            // Only update if stats actually changed
            if (JSON.stringify(statsResponse) !== JSON.stringify(serverStats)) {
              console.log('📊 Real-time stats update:', statsResponse);
              setServerStats(statsResponse);
            }
          }
        } catch (statsError) {
          // Non-critical, just log
          console.log('⚠️ Stats poll failed:', statsError);
        }
        
        if (newReceivedCount !== receivedCount) {
          console.log('✨ Received count changed:', receivedCount, '→', newReceivedCount);
          const newCapsulesCount = newReceivedCount - receivedCount;
          
          setReceivedCount(newReceivedCount);
          setReceivedCapsules(received || []);
          
          // Show toast notification for NEW received capsules (only if count increased, not on first load)
          if (newCapsulesCount > 0 && receivedCount > 0) {
            const newCapsule = received?.[0]; // Most recent capsule
            // DISABLED: Toast notification not needed
            /*toast.success(
              `📬 ${newCapsulesCount} new time capsule${newCapsulesCount > 1 ? 's' : ''} received!`,
              {
                description: newCapsule?.title ? `"${newCapsule.title}"` : 'Check your dashboard to view',
                duration: 6000,
              }
            );*/
            console.log('🎉 NEW CAPSULE RECEIVED! (toast disabled)');
          }
          
          // Update cache
          const cacheKey = `received_capsules_${user.id}`;
          localStorage.setItem(cacheKey, JSON.stringify({
            count: newReceivedCount,
            capsules: received,
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        console.error('❌ Polling error (will retry):', error);
        // Don't show error to user, polling will retry
      }
    };

    // Debounce timer for visibility changes
    let visibilityDebounceTimer: NodeJS.Timeout | null = null;

    // Start polling with initial delay - but skip if data was just loaded
    let firstPollTimer = null;
    let intervalId = null;
    
    if (skipInitialPoll) {
      // Skip initial poll, start regular polling immediately
      console.log('⏭️ Starting regular polling without initial poll');
      intervalId = setInterval(pollForUpdates, POLLING_INTERVAL);
    } else {
      // Normal flow: wait INITIAL_DELAY before first poll, then start interval
      firstPollTimer = setTimeout(() => {
        isFirstPoll = false;
        pollForUpdates();
      }, INITIAL_DELAY);
      
      intervalId = setInterval(pollForUpdates, POLLING_INTERVAL);
    }

    // Poll when tab becomes visible (debounced to prevent rapid polls)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Clear any existing debounce timer
        if (visibilityDebounceTimer) {
          clearTimeout(visibilityDebounceTimer);
        }
        
        // Debounce: wait 2 seconds before polling
        visibilityDebounceTimer = setTimeout(() => {
          console.log('👀 Tab visible, triggering poll...');
          pollForUpdates();
        }, 2000);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (firstPollTimer) clearTimeout(firstPollTimer);
      if (intervalId) clearInterval(intervalId);
      if (visibilityDebounceTimer) {
        clearTimeout(visibilityDebounceTimer);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, isLoading, networkStatus]);

  // Safety filter: Ensure all capsules are valid objects with required properties
  const validCapsules = React.useMemo(() => {
    const filtered = capsules.filter(c => {
      if (!c) {
        console.warn('⚠️ Skipping null/undefined capsule');
        return false;
      }
      if (typeof c !== 'object') {
        console.warn('⚠️ Skipping non-object capsule:', c);
        return false;
      }
      if (!c.id) {
        console.warn('⚠️ Skipping capsule without ID:', c);
        return false;
      }
      
      // CRITICAL: Exclude soft-deleted capsules (moved to Archive)
      if (c.deletedAt) {
        console.log(`🌫️ Excluding soft-deleted capsule ${c.id} from display (deletedAt: ${c.deletedAt})`);
        return false;
      }
      
      // Be lenient - if status is missing, default to 'draft'
      if (!c.status) {
        console.warn(`⚠️ Capsule ${c.id} missing status, defaulting to 'draft'`);
        c.status = 'draft';
      }
      return true;
    });
    
    if (filtered.length !== capsules.length) {
      console.warn(`⚠️ Filtered out ${capsules.length - filtered.length} invalid capsules`);
    }
    
    return filtered;
  }, [capsules]);

  // Tab-based filtering - only show capsules when a tab is active
  // For "all" tab, include received capsules with proper status='received'
  const filteredCapsules = React.useMemo(() => {
    if (!activeTab) return [];
    
    // For "all" tab and "received" tab, include received capsules with GOLD/YELLOW color
    const capsulesToFilter = (activeTab === 'all' || activeTab === 'received')
      ? (() => {
          // Step 1: Process ALL validCapsules and transform self-delivered immediately
          // This eliminates race conditions with receivedCapsules state loading
          const processedValidCapsules = validCapsules
            .map(vc => {
              // ✅ CRITICAL FIX: Immediately transform self-delivered capsules to received status
              // This prevents race condition where receivedCapsules state hasn't loaded yet
              const isSelfDelivered = vc.status === 'delivered' && vc.recipient_type === 'self';
              const isInReceivedList = receivedCapsules.some(rc => rc.id === vc.id);
              
              if (isSelfDelivered || isInReceivedList) {
                return { ...vc, isReceived: true, status: 'received' };
              }
              return vc;
            });
          
          // Step 2: Build set of IDs already included (for deduplication)
          const includedIds = new Set(processedValidCapsules.map(vc => vc.id));
          
          // Step 3: Add received capsules that are NOT already in processedValidCapsules
          // Skip self-delivered ones since they're already handled above
          const processedReceivedCapsules = receivedCapsules
            .filter(rc => {
              const alreadyIncluded = includedIds.has(rc.id);
              const isSelfDelivered = rc.status === 'delivered' && rc.recipient_type === 'self';
              return !alreadyIncluded && !isSelfDelivered;
            })
            .map(rc => {
              return { ...rc, isReceived: true, status: 'received' };
            });
          
          return [...processedValidCapsules, ...processedReceivedCapsules];
        })()
      : validCapsules;
    
    return capsulesToFilter.filter(capsule => {
      // First filter by tab (status) - MUST MATCH stats calculation exactly
      let matchesTab = false;
      if (activeTab === 'all') {
        matchesTab = true;
      } else if (activeTab === 'received') {
        // Show only received capsules (isReceived flag or status='received')
        matchesTab = capsule.isReceived || capsule.status === 'received';
      } else if (activeTab === 'scheduled') {
        // CRITICAL: Match stats calculation - has delivery_date, not delivered, not failed, not draft
        matchesTab = capsule.delivery_date && capsule.status !== 'delivered' && capsule.status !== 'failed' && capsule.status !== 'draft';
      } else if (activeTab === 'draft') {
        // FIXED: Drafts are identified by status='draft' OR no delivery_date (for legacy drafts)
        // This ensures we catch all drafts, even if they have a delivery_date filled in
        matchesTab = (capsule.status === 'draft') || (!capsule.delivery_date && capsule.status !== 'delivered' && capsule.status !== 'failed');
      } else if (activeTab === 'delivered') {
        // CRITICAL: Match stats calculation - exclude self-only delivered capsules
        // Self-only delivered capsules appear in "received" instead
        matchesTab = capsule.status === 'delivered' && capsule.recipient_type !== 'self';
      } else if (activeTab === 'failed') {
        matchesTab = capsule.status === 'failed';
      }
      
      const matchesSearch = !searchTerm || 
        (capsule.title && capsule.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (capsule.message && capsule.message.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (capsule.recipient_email && capsule.recipient_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (capsule.sender_name && capsule.sender_name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesMediaType = filterMediaType === 'all' || 
        (capsule.attachments && Array.isArray(capsule.attachments) && capsule.attachments.length > 0 &&
         capsule.attachments.some(att => {
           const fileType = (att.type || att.file_type || '').toLowerCase();
           if (filterMediaType === 'video') return fileType.startsWith('video/') || fileType.includes('video');
           if (filterMediaType === 'audio') return fileType.startsWith('audio/') || fileType.includes('audio');
           if (filterMediaType === 'image') return fileType.startsWith('image/') || fileType.includes('image');
           return false;
         })) ||
        (capsule.media_files && Array.isArray(capsule.media_files) && capsule.media_files.length > 0 &&
         capsule.media_files.some(att => {
           const fileType = (att.type || att.file_type || '').toLowerCase();
           if (filterMediaType === 'video') return fileType.startsWith('video/') || fileType.includes('video');
           if (filterMediaType === 'audio') return fileType.startsWith('audio/') || fileType.includes('audio');
           if (filterMediaType === 'image') return fileType.startsWith('image/') || fileType.includes('image');
           return false;
         }));

      const matchesDate = !selectedDate || 
        (capsule.delivery_date && 
         new Date(capsule.delivery_date).toDateString() === selectedDate.toDateString());

      return matchesTab && matchesSearch && matchesMediaType && matchesDate;
    })
    .sort((a, b) => {
      // SPECIAL CASE: For scheduled tab, sort by delivery_date ASCENDING (soonest first)
      if (activeTab === 'scheduled') {
        const aDeliveryDate = a.delivery_date ? new Date(a.delivery_date).getTime() : Infinity;
        const bDeliveryDate = b.delivery_date ? new Date(b.delivery_date).getTime() : Infinity;
        return aDeliveryDate - bDeliveryDate; // Soonest first (ascending)
      }
      
      // Default sorting for other tabs: most recent date first
      // Sort by most recent date: delivered_at/received_at > delivery_date > updated_at (drafts) > created_at
      const getRelevantDate = (capsule) => {
        // For delivered capsules, use delivered_at first
        if (capsule.status === 'delivered' && capsule.delivered_at) {
          return new Date(capsule.delivered_at).getTime();
        }
        // For received capsules, use received_at first
        if (capsule.status === 'received' && capsule.received_at) {
          return new Date(capsule.received_at).getTime();
        }
        // For drafts, use updated_at (revised date) if available, otherwise created_at
        if (capsule.status === 'draft' || !capsule.delivery_date) {
          if (capsule.updated_at) {
            return new Date(capsule.updated_at).getTime();
          }
          return new Date(capsule.created_at || 0).getTime();
        }
        // Fall back to delivery_date if it exists (for scheduled)
        if (capsule.delivery_date) {
          return new Date(capsule.delivery_date).getTime();
        }
        // Finally, use created_at as last resort
        return new Date(capsule.created_at || 0).getTime();
      };
      
      const aDate = getRelevantDate(a);
      const bDate = getRelevantDate(b);
      
      // Most recent first (descending order)
      return bDate - aDate;
    });
  }, [activeTab, validCapsules, receivedCapsules, searchTerm, filterMediaType, selectedDate]);

  // Displayed capsules with pagination limit
  const displayedCapsules = React.useMemo(() => {
    return filteredCapsules.slice(0, displayLimit);
  }, [filteredCapsules, displayLimit]);

  // Hydrate visible capsules whenever they change
  useEffect(() => {
    if (displayedCapsules.length > 0) {
      hydrateMedia(displayedCapsules);
    }
  }, [displayedCapsules]);
  
  // CRITICAL FIX: Auto-adjust displayLimit when switching folders
  // If folder has 10 or fewer capsules, show ALL immediately (no Load More needed)
  useEffect(() => {
    if (filteredCapsules.length > 0 && filteredCapsules.length <= 10) {
      if (displayLimit < filteredCapsules.length) {
        console.log(`📊 Auto-adjusting displayLimit from ${displayLimit} to ${filteredCapsules.length} (folder has ≤10 capsules)`);
        setDisplayLimit(filteredCapsules.length);
      }
    }
  }, [filteredCapsules.length, activeTab]);

  // Check if there are more capsules to load
  // CRITICAL FIX: Only show Load More if there are MORE than 10 capsules total
  // If folder has 10 or fewer, load all and never show Load More
  const hasMoreToDisplay = filteredCapsules.length > 10 && filteredCapsules.length > displayLimit;

  // CRITICAL: Check if we need to load more from database
  // With fetch-all strategy, this should always be false (we have all IDs)
  const needsLoadFromDatabase = false; // !hasMoreToDisplay && hasMore && !isLoading;

  // Stats calculation - use actual valid capsules count (not database total which may include deleted capsules)
  const stats = React.useMemo(() => {
    // ✅ CRITICAL FIX: Calculate received count from capsules, not separate API
    // This ensures self-sent delivered capsules are counted correctly
    const calculatedReceivedCount = validCapsules.filter(c => 
      c.status === 'delivered' && c.recipient_type === 'self'
    ).length + receivedCapsules.filter(rc => 
      !validCapsules.some(vc => vc.id === rc.id) // Don't double-count
    ).length;
    
    // PRIORITY: Use server stats if available (accurate regardless of pagination)
    // CRITICAL FIX: Wait for serverStats to load before calculating
    // This prevents the flash from incorrect fallback (28) to correct (22)
    
    if (serverStats) {
      console.log('📊 Using accurate server stats (not affected by pagination)');
      
      // SIMPLE FORMULA: All Capsules = Scheduled + Delivered + Received + Drafts
      const calculatedStats = {
        scheduled: serverStats.scheduled,
        delivered: serverStats.delivered, // Excludes self-only delivered
        draft: serverStats.draft,
        failed: serverStats.failed,
        received: receivedLoading ? null : calculatedReceivedCount, // ✅ null = loading
        receivedLoading: receivedLoading, // ✅ Pass loading state to UI
        // All Capsules = sum of all folders shown in UI
        total: serverStats.scheduled + serverStats.delivered + calculatedReceivedCount + serverStats.draft + serverStats.failed
      };
      
      console.log('📊 Server-based Dashboard Stats:');
      console.log(`   ⏰ Scheduled: ${calculatedStats.scheduled}`);
      console.log(`   ✅ Delivered: ${calculatedStats.delivered}`);
      console.log(`   📨 Received: ${calculatedStats.received}`);
      console.log(`   💭 Drafts: ${calculatedStats.draft}`);
      console.log(`   ❌ Failed: ${calculatedStats.failed}`);
      console.log(`   🌌 All Capsules (total): ${calculatedStats.total} = ${calculatedStats.scheduled} + ${calculatedStats.delivered} + ${calculatedStats.received} + ${calculatedStats.draft} + ${calculatedStats.failed}`);
      
      return calculatedStats;
    }
    
    // LOADING STATE: Return current stats without recalculating if waiting for serverStats
    // This prevents the flash of incorrect numbers while loading
    if (!serverStats) {
      console.log('⏳ Waiting for server stats to load (using cached/previous values)...');
      // Return previous stats or zeros to prevent flash
      // ✅ Show loading state for received if still loading
      return {
        scheduled: 0,
        delivered: 0,
        draft: 0,
        failed: 0,
        received: receivedLoading ? null : (receivedCount || 0), // ✅ null = loading
        receivedLoading: receivedLoading, // ✅ Pass loading state to UI
        total: 0
      };
    }
    
    // FALLBACK: Calculate stats from loaded capsules (only if server stats unavailable)
    console.log('ℹ️ Calculating stats from loaded capsules (server stats unavailable)');
    
    const scheduled = validCapsules.filter(c => c.delivery_date && c.status !== 'delivered' && c.status !== 'failed' && c.status !== 'draft');
    
    // CRITICAL: Exclude self-only delivered capsules from "delivered" stat
    const delivered = validCapsules.filter(c => 
      c.status === 'delivered' && c.recipient_type !== 'self'
    );
    
    // Self-only delivered capsules (these appear in received, not delivered)
    const selfOnlyDelivered = validCapsules.filter(c => 
      c.status === 'delivered' && c.recipient_type === 'self'
    );
    
    // Drafts: Match filter logic - status='draft' OR (no delivery_date and not delivered/failed)
    const draft = validCapsules.filter(c => 
      (c.status === 'draft') || (!c.delivery_date && c.status !== 'delivered' && c.status !== 'failed')
    );
    // Failed capsules should be filtered by status, not delivery_date
    const failed = validCapsules.filter(c => c.status === 'failed');
    
    // Filter out received capsules that you also created (self-delivered capsules)
    // to avoid double-counting in "All Capsules" total
    const receivedFromOthers = receivedCapsules.filter(rc => 
      !validCapsules.some(vc => vc.id === rc.id)
    );
    const receivedFromOthersCount = receivedFromOthers.length;
    
    const calculatedStats = {
      total: delivered.length + receivedFromOthersCount + scheduled.length + draft.length + failed.length + selfOnlyDelivered.length, // FIXED: Use receivedFromOthersCount to avoid double-counting + add self-only delivered
      scheduled: scheduled.length,
      delivered: delivered.length, // Excludes self-only delivered
      draft: draft.length,
      failed: failed.length,
      received: receivedLoading ? null : receivedCount, // ✅ null = loading
      receivedLoading: receivedLoading // ✅ Pass loading state to UI
    };
    
    // Debug: Log stats breakdown
    const sum = calculatedStats.scheduled + calculatedStats.delivered + calculatedStats.draft + calculatedStats.failed;
    console.log(`📊 Dashboard Stats:`);
    console.log(`   🌌 All Capsules (total): ${calculatedStats.total} = Delivered (${delivered.length}) + Self-only (${selfOnlyDelivered.length}) + Received from others (${receivedFromOthersCount}) + Scheduled (${scheduled.length}) + Drafts (${draft.length}) + Failed (${failed.length})`);
    console.log(`   📦 Created by you: ${validCapsules.length} (including ${selfOnlyDelivered.length} self-only delivered)`);
    console.log(`      ⏰ Scheduled: ${calculatedStats.scheduled}`);
    console.log(`      ✨ Delivered (excluding self-only): ${calculatedStats.delivered}`);
    console.log(`      ✨ Self-only delivered: ${selfOnlyDelivered.length} (counted in received instead)`);
    console.log(`      💭 Drafts: ${calculatedStats.draft}`);
    console.log(`      ❌ Failed: ${calculatedStats.failed}`);
    console.log(`   🎁 Received (all): ${receivedCount} (from others: ${receivedFromOthersCount}, from self: ${receivedCount - receivedFromOthersCount})`);
    
    // NEW: Log all delivered capsules for debugging the count issue
    console.log(`   🔍 Delivered capsules breakdown (${delivered.length}):`);
    delivered.forEach(c => {
      console.log(`      - ID: ${c.id.substring(0, 8)}, status: "${c.status}", recipient_type: "${c.recipient_type}", title: "${c.title || 'Untitled'}"`);
    });
    
    if (sum + selfOnlyDelivered.length !== validCapsules.length) {
      console.warn('⚠️ CREATED CAPSULES MISMATCH!');
      console.warn(`Created total: ${validCapsules.length}, but Scheduled (${calculatedStats.scheduled}) + Delivered (${calculatedStats.delivered}) + Self-only (${selfOnlyDelivered.length}) + Draft (${calculatedStats.draft}) + Failed (${calculatedStats.failed}) = ${sum + selfOnlyDelivered.length}`);
      console.warn('Capsules breakdown:');
      validCapsules.forEach(c => {
        console.warn(`- ${c.id}: status="${c.status}", recipient_type="${c.recipient_type}", has_delivery_date=${!!c.delivery_date}`);
      });
    }
    
    return calculatedStats;
  }, [validCapsules, receivedCapsules, receivedCount, serverStats, receivedLoading]);

  const toggleSelectCapsule = (capsuleId) => {
    setSelectedCapsules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(capsuleId)) {
        newSet.delete(capsuleId);
      } else {
        newSet.add(capsuleId);
      }
      return newSet;
    });
  };

  const bulkDeleteCapsules = async () => {
    if (selectedCapsules.size === 0) return;

    // Store current folder before showing delete dialog
    folderBeforeActionRef.current = activeTab;
    
    // Show delete confirmation dialog instead of window.confirm
    setCapsulesToDelete(new Set(selectedCapsules));
    setShowDeleteDialog(true);
  };

  // New function to handle confirmed deletion
  const confirmDelete = async () => {
    const capsuleIds = Array.from(capsulesToDelete);
    console.log('✅ Delete confirmed for capsules:', capsuleIds);
    if (capsuleIds.length === 0) {
      console.warn('⚠️ No capsules to delete');
      return;
    }

    setIsDeleting(true);
    setShowDeleteDialog(false);
    console.log('🗑️ Starting deletion process...');

    const startTime = Date.now();
    
    // CRITICAL: Clear ALL cache IMMEDIATELY before deletion to prevent stale data
    clearAllDashboardCache();
    
    // Show progress toast
    toast.loading(`Moving ${capsuleIds.length} capsule${capsuleIds.length === 1 ? '' : 's'} to Archive...`, { 
      id: 'bulk-delete',
      duration: Infinity 
    });

    try {
      console.log(`🗑️ Starting parallel deletion of ${capsuleIds.length} capsules...`);
      
      // Separate owned capsules from received capsules
      const capsulesMap = new Map();
      [...capsules, ...receivedCapsules].forEach(c => capsulesMap.set(c.id, c));
      
      const ownedIds = [];
      const receivedIds = [];
      
      capsuleIds.forEach(id => {
        const capsule = capsulesMap.get(id);
        if (capsule?.isReceived) {
          receivedIds.push(id);
        } else {
          ownedIds.push(id);
        }
      });
      
      console.log(`📊 Deletion breakdown: ${ownedIds.length} owned, ${receivedIds.length} received`);
      
      // PERFORMANCE FIX: Delete all capsules in parallel instead of sequentially
      // For owned capsules: SOFT DELETE (move to Archive)
      // For received capsules: ARCHIVE (move to Archived Received list)
      const deletePromises = [
        ...ownedIds.map(async id => {
          try {
            // SOFT DELETE: Move to Archive instead of permanent delete
            const { data: { session } } = await supabase.auth.getSession();
            const response = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/soft-delete`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session?.access_token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                  capsuleId: id,
                  folderId: activeTab === 'home' ? null : activeTab
                })
              }
            );
            
            if (!response.ok) {
              throw new Error(`Soft delete failed: ${response.statusText}`);
            }
            
            return { success: true };
          } catch (error) {
            console.error(`Failed to soft delete owned capsule ${id}:`, error);
            return { id, error, type: 'owned' };
          }
        }),
        ...receivedIds.map(id =>
          DatabaseService.archiveReceivedCapsule(id).catch(error => {
            console.error(`Failed to archive received capsule ${id}:`, error);
            return { id, error, type: 'received' };
          })
        )
      ];
      
      const results = await Promise.all(deletePromises);
      
      // Check for any failures
      const failures = results.filter(r => r && r.error);
      const successCount = capsuleIds.length - failures.length;
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ Bulk deletion completed in ${elapsed}s (${successCount} successful, ${failures.length} failed)`);

      // Clear selection immediately
      setSelectedCapsules(new Set());
      
      // CRITICAL: Always fetch fresh data from database after delete to prevent stale capsules
      console.log('🔄 Fetching fresh data after deletion...');
      try {
        const result = await DatabaseService.getUserTimeCapsules(user.id, INITIAL_FETCH_SIZE, 0);
        setCapsules(result.capsules || []);
        setTotalCapsules(result.total);
        setHasMore(result.hasMore);
        setCurrentPage(0); // CRITICAL: Reset current page to 0 after refresh
        setDisplayLimit(10); // Reset display limit to default
        console.log('✅ Fresh data loaded:', result.capsules?.length || 0, 'capsules');
        
        // CRITICAL: Refresh server stats to update counts immediately
        try {
          const statsResponse = await DatabaseService.getCapsuleStats(user.id);
          if (statsResponse && !statsResponse.error) {
            console.log('✅ Server stats refreshed after delete:', statsResponse);
            setServerStats(statsResponse);
          }
        } catch (statsError) {
          console.log('⚠️ Stats refresh failed (non-critical):', statsError);
        }
        
        // Also refresh received count in case deleted capsules affected it
        await refreshReceivedCount();
      } catch (refreshError) {
        console.error('Failed to refresh after deletion:', refreshError);
        // Fallback: Update UI by filtering
        setCapsules(prev => prev.filter(c => !capsuleIds.includes(c.id)));
      }
      
      // Dismiss loading toast and show result
      toast.dismiss('bulk-delete');
      
      if (failures.length === 0) {
        toast.success(`Moved to Archive • ${successCount === 1 ? '30 days' : '30 days'} to restore`);
      } else if (successCount > 0) {
        toast.warning(`Removed ${successCount} capsule${successCount === 1 ? '' : 's'}, but ${failures.length} failed`);
        
        // On partial failure, force refresh from database to ensure accuracy
        console.log('🔄 Partial failure, refreshing from database...');
        try {
          const result = await DatabaseService.getUserTimeCapsules(user.id, INITIAL_FETCH_SIZE, 0);
          setCapsules(result.capsules || []);
          setTotalCapsules(result.total);
          setHasMore(result.hasMore);
          setCurrentPage(0); // CRITICAL: Reset current page to 0 after refresh
          setDisplayLimit(10); // Reset display limit to default
          
          // Refresh server stats
          try {
            const statsResponse = await DatabaseService.getCapsuleStats(user.id);
            if (statsResponse && !statsResponse.error) {
              setServerStats(statsResponse);
            }
          } catch (statsError) {
            console.log('⚠️ Stats refresh failed (non-critical):', statsError);
          }
          
          await refreshReceivedCount();
        } catch (refreshError) {
          console.error('Failed to refresh after partial failure:', refreshError);
        }
      } else {
        toast.error(`Failed to delete all ${capsuleIds.length} capsule${capsuleIds.length === 1 ? '' : 's'}`);
        
        // On complete failure, force refresh from database
        console.log('🔄 Complete failure, refreshing from database...');
        try {
          const result = await DatabaseService.getUserTimeCapsules(user.id, INITIAL_FETCH_SIZE, 0);
          setCapsules(result.capsules || []);
          setTotalCapsules(result.total);
          setHasMore(result.hasMore);
          setCurrentPage(0); // CRITICAL: Reset current page to 0 after refresh
          setDisplayLimit(10); // Reset display limit to default
          
          // Refresh server stats
          try {
            const statsResponse = await DatabaseService.getCapsuleStats(user.id);
            if (statsResponse && !statsResponse.error) {
              setServerStats(statsResponse);
            }
          } catch (statsError) {
            console.log('⚠️ Stats refresh failed (non-critical):', statsError);
          }
          
          await refreshReceivedCount();
        } catch (refreshError) {
          console.error('Failed to refresh after complete failure:', refreshError);
        }
      }
    } catch (error) {
      console.error('Error during bulk deletion:', error);
      toast.dismiss('bulk-delete');
      toast.error('Failed to delete capsules');
      
      // On error, force refresh from database
      console.log('🔄 Error occurred, refreshing from database...');
      try {
        const result = await DatabaseService.getUserTimeCapsules(user.id, INITIAL_FETCH_SIZE, 0);
        setCapsules(result.capsules || []);
        setTotalCapsules(result.total);
        setHasMore(result.hasMore);
        setCurrentPage(0); // Reset pagination on error recovery
        setDisplayLimit(10);
        
        // Refresh server stats
        try {
          const statsResponse = await DatabaseService.getCapsuleStats(user.id);
          if (statsResponse && !statsResponse.error) {
            setServerStats(statsResponse);
          }
        } catch (statsError) {
          console.log('⚠️ Stats refresh failed (non-critical):', statsError);
        }
        
        await refreshReceivedCount();
      } catch (refreshError) {
        console.error('Failed to refresh after error:', refreshError);
      }
    } finally {
      setIsDeleting(false);
      setCapsulesToDelete(new Set());
      
      // Restore folder if it was closed during delete
      if (folderBeforeActionRef.current && !activeTab) {
        console.log('🔄 Restoring folder after delete:', folderBeforeActionRef.current);
        setActiveTab(folderBeforeActionRef.current);
        folderBeforeActionRef.current = null;
      }
    }
  };

  // Load more capsules from database (pagination)
  const loadMoreFromDatabase = async () => {
    // Legacy support or fallback if we revert to pagination
    if (!user?.id || isLoading || !hasMore) {
      console.log('⏭️ Skipping loadMoreFromDatabase:', { hasUser: !!user?.id, isLoading, hasMore });
      return;
    }

    // Since we fetch all metadata now, this function handles "hydration" of next batch if needed,
    // or true pagination if we revert to server-side paging.
    
    // For now, with fetch-all strategy, this function shouldn't be called for "Load More" button 
    // unless we re-enable needsLoadFromDatabase.
    
    console.log('📥 Loading more capsules from database...', { currentPage, currentCount: capsules.length });
    setIsLoading(true);

    try {
      const nextPage = currentPage + 1;
      const result = await DatabaseService.getUserTimeCapsules(user.id, PAGE_SIZE, nextPage);
      
      console.log(`✅ Loaded page ${nextPage}:`, result.capsules.length, 'capsules');
      
      // CRITICAL FIX: Deduplicate capsules before appending to prevent duplicate keys
      let actualNewCapsulesCount = 0;
      setCapsules(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const newCapsules = (result.capsules || []).filter(c => !existingIds.has(c.id));
        actualNewCapsulesCount = newCapsules.length;
        
        // Log if duplicates are detected (should not happen with proper pagination)
        if (newCapsules.length < (result.capsules || []).length) {
          console.log(`ℹ️ Filtered out ${(result.capsules || []).length - newCapsules.length} duplicate capsules (pagination overlap detected)`);
        }
        
        return [...prev, ...newCapsules];
      });
      setCurrentPage(nextPage);
      setHasMore(result.hasMore);
      setTotalCapsules(result.total);
      
      // Increase display limit to show the newly loaded capsules (use ACTUAL count after deduplication)
      setDisplayLimit(prev => prev + actualNewCapsulesCount);
      
      // Show accurate notification about how many capsules were actually loaded
      if (actualNewCapsulesCount > 0) {
        toast.success(`Loaded ${actualNewCapsulesCount} more capsule${actualNewCapsulesCount !== 1 ? 's' : ''}`);
      } else {
        // Edge case: all capsules were duplicates
        toast.info('No new capsules to load');
      }
    } catch (error) {
      console.error('Failed to load more capsules:', error);
      toast.error('Failed to load more capsules. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getMediaTypeIcon = (attachments) => {
    if (!attachments || !Array.isArray(attachments) || attachments.length === 0) {
      return <MessageSquare className="w-4 h-4" />;
    }

    const types = attachments.map(att => att.type || '');
    
    if (types.some(type => type.startsWith('video/'))) {
      return <Video className="w-4 h-4" />;
    }
    if (types.some(type => type.startsWith('audio/'))) {
      return <Mic className="w-4 h-4" />;
    }
    if (types.some(type => type.startsWith('image/'))) {
      return <Image className="w-4 h-4" />;
    }
    
    return <MessageSquare className="w-4 h-4" />;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'delivered':
        return {
          color: 'bg-green-500',
          icon: CheckCircle,
          label: 'Delivered'
        };
      case 'received':
        return {
          color: 'bg-yellow-500',  // Gold/yellow for received capsules
          icon: CheckCircle,
          label: 'Received'
        };
      case 'scheduled':
        return {
          color: 'bg-blue-500',
          icon: Clock,
          label: 'Scheduled'
        };
      case 'draft':
        return {
          color: 'bg-yellow-500',
          icon: AlertCircle,
          label: 'Draft'
        };
      default:
        return {
          color: 'bg-gray-500',
          icon: AlertCircle,
          label: status || 'Unknown'
        };
    }
  };

  const getDeliveryMethodIcon = (deliveryMethod) => {
    switch (deliveryMethod) {
      case 'email': return <Globe className="w-4 h-4" />;
      case 'social_instagram': return <Instagram className="w-4 h-4" />;
      case 'social_twitter': return <Twitter className="w-4 h-4" />;
      case 'social_facebook': return <Facebook className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  // Helper function to get recipient display information
  const getRecipientInfo = (capsule) => {
    // Don't show recipient for drafts unless they have a recipient saved
    if (capsule.status === 'draft') {
      const hasRecipient = capsule.recipient_type === 'self' 
        ? (capsule.self_contact) 
        : (capsule.recipients && capsule.recipients.length > 0);
      
      if (!hasRecipient) {
        return null;
      }
    }

    // Handle self-delivery
    if (capsule.recipient_type === 'self') {
      let selfContact = '';
      
      if (typeof capsule.self_contact === 'string') {
        selfContact = capsule.self_contact;
      } else if (typeof capsule.self_contact === 'object' && capsule.self_contact !== null) {
        const sc = capsule.self_contact;
        selfContact = sc.email || sc.phone || sc.contact || sc.value || sc.address || '';
      }
      
      // FALLBACK: Check recipient_email or recipient_phone if self_contact is empty
      if (!selfContact && capsule.recipient_email) {
        selfContact = capsule.recipient_email;
      }
      if (!selfContact && capsule.recipient_phone) {
        selfContact = capsule.recipient_phone;
      }
      
      if (selfContact) {
        return {
          display: `Yourself (${selfContact})`,
          icon: <Mail className="w-4 h-4" />,
          isSelf: true,
          // For scheduled capsules, show full email detail
          fullDisplay: capsule.status === 'scheduled' ? selfContact : null
        };
      }
      
      // LAST RESORT: Return a generic "Yourself" if we can't find contact info
      return {
        display: 'Yourself',
        icon: <Mail className="w-4 h-4" />,
        isSelf: true,
        fullDisplay: capsule.status === 'scheduled' ? 'Yourself' : null
      };
    }
    
    // Handle multiple recipients
    if (capsule.recipient_type === 'others' && capsule.recipients && capsule.recipients.length > 0) {
      // Extract raw email addresses (not display names) for scheduled capsules
      const emailAddresses = capsule.recipients.map(r => {
        if (typeof r === 'string') return r;
        if (typeof r === 'object' && r !== null) {
          return r.email || r.phone || r.contact || r.value || r.address || '';
        }
        return '';
      }).filter(Boolean);
      
      if (emailAddresses.length === 0) return null;
      
      // For SCHEDULED capsules: Show full email list with multi-line format
      if (capsule.status === 'scheduled') {
        const MAX_DISPLAY = 3; // Show up to 3 emails, then "+X others"
        const displayEmails = emailAddresses.slice(0, MAX_DISPLAY);
        const remaining = emailAddresses.length - MAX_DISPLAY;
        
        // Create multi-line display: "email@example.com\n& email2@example.com\n& email3@example.com\n+2 others"
        let fullDisplay = displayEmails[0];
        for (let i = 1; i < displayEmails.length; i++) {
          fullDisplay += `\n& ${displayEmails[i]}`;
        }
        if (remaining > 0) {
          fullDisplay += `\n+${remaining} other${remaining > 1 ? 's' : ''}`;
        }
        
        return {
          display: emailAddresses.length === 1 ? emailAddresses[0] : `${emailAddresses[0]} +${emailAddresses.length - 1} more`,
          icon: <Mail className="w-4 h-4" />,
          label: 'To:',
          count: emailAddresses.length,
          allRecipients: emailAddresses,
          fullDisplay: fullDisplay, // Multi-line format for scheduled capsules
          isMultiLine: emailAddresses.length > 1
        };
      }
      
      // For NON-SCHEDULED capsules: Use display names if available (original logic)
      const displayNames = capsule.recipient_names && capsule.recipient_names.length > 0 
        ? capsule.recipient_names  // Backend provided display names (e.g., ["Sarah Cohen", "Ryan Cohen"])
        : emailAddresses;
      
      const firstRecipient = displayNames[0];
      
      return {
        display: displayNames.length === 1 ? firstRecipient : `${firstRecipient} +${displayNames.length - 1} more`,
        icon: <Mail className="w-4 h-4" />,
        label: 'To:',
        count: displayNames.length,
        allRecipients: displayNames  // Updated for tooltips/modals
      };
    }
    
    // Fallback to old recipient_email field if it exists
    if (capsule.recipient_email) {
      return {
        display: capsule.recipient_email,
        icon: <Mail className="w-4 h-4" />,
        label: 'To:',
        fullDisplay: capsule.status === 'scheduled' ? capsule.recipient_email : null
      };
    }
    
    return null;
  };

  // Check if a capsule can be edited (drafts always editable, scheduled must be at least 1 minute before delivery)
  const canEditCapsule = (capsule) => {
    if (!capsule) {
      return false;
    }

    // Drafts (no delivery date) are always editable
    if (!capsule.delivery_date || capsule.status === 'draft') {
      return true;
    }

    // Delivered capsules cannot be edited
    if (capsule.status === 'delivered') {
      return false;
    }

    // For scheduled capsules, check if there's enough time before delivery
    if (capsule.status === 'scheduled') {
      try {
        const deliveryTime = new Date(capsule.delivery_date);
        const now = new Date();
        const minMinutesBeforeDelivery = 1;
        const minTimeBeforeDelivery = minMinutesBeforeDelivery * 60 * 1000; // 1 minute in milliseconds

        // Check if delivery is more than 1 minute away
        return (deliveryTime.getTime() - now.getTime()) > minTimeBeforeDelivery;
      } catch (error) {
        console.error('Error checking edit eligibility:', error);
        return false;
      }
    }

    return false;
  };



  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterMediaType('all');
    setSelectedDate(null);
  };

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem(`dashboard_view_mode_${user?.id}`, mode);
  };

  const handleRefresh = async () => {
    localStorage.removeItem(`dashboard_capsules_${user.id}`);
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/capsules`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setCapsules(result.capsules || []);
        setTotalCapsules(result.capsules?.length || 0);
        setLastSync(new Date());
        toast.success('Refreshed!');
      }
    }
    setIsLoading(false);
  };

  const deleteCapsule = async (capsuleId) => {
    console.log('🗑️ Delete capsule requested:', capsuleId);
    
    // Store current folder before showing delete dialog
    folderBeforeActionRef.current = activeTab;
    
    // Show delete confirmation dialog instead of window.confirm
    setCapsulesToDelete(new Set([capsuleId]));
    setShowDeleteDialog(true);
    console.log('✅ Delete dialog shown for capsule:', capsuleId);
    return; // Early return - confirmDelete will handle the actual deletion

    // CRITICAL: Clear ALL cache IMMEDIATELY before deletion to prevent stale data
    clearAllDashboardCache();

    try {
      // Add timeout protection
      const deletePromise = DatabaseService.deleteTimeCapsule(capsuleId);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Delete operation timeout')), 10000)
      );
      
      await Promise.race([deletePromise, timeoutPromise]);
      
      // Update UI immediately
      setCapsules(prev => prev.filter(c => c.id !== capsuleId));
      toast.success('Moved to Archive • 30 days to restore');
      
      // Refresh received count in case this affected it
      await refreshReceivedCount();
      
      console.log('✅ Capsule moved to Archive and UI updated');
    } catch (error) {
      console.error('Error deleting capsule:', error);
      if (error.message === 'Delete operation timeout') {
        toast.error('Delete operation timed out. Please check your connection and try again.');
      } else {
        toast.error('Failed to delete capsule');
      }
      
      // On error, force refresh from database
      console.log('🔄 Error occurred, refreshing from database...');
      try {
        const result = await DatabaseService.getUserTimeCapsules(user.id, INITIAL_FETCH_SIZE, 0);
        setCapsules(result.capsules || []);
        setTotalCapsules(result.total);
        setHasMore(result.hasMore);
        setCurrentPage(0); // Reset pagination on error recovery
        setDisplayLimit(10);
        
        // Refresh server stats
        try {
          const statsResponse = await DatabaseService.getCapsuleStats(user.id);
          if (statsResponse && !statsResponse.error) {
            setServerStats(statsResponse);
          }
        } catch (statsError) {
          console.log('⚠️ Stats refresh failed (non-critical):', statsError);
        }
        
        await refreshReceivedCount();
      } catch (refreshError) {
        console.error('Failed to refresh after error:', refreshError);
      }
    }
  };

  const handleTabClick = (tab) => {
    if (activeTab === tab) {
      // If clicking the same active tab, close the overlay
      setActiveTab(null);
      setSelectedCapsules(new Set()); // Clear selection when closing overlay
      setDisplayLimit(10); // Reset display limit when closing
    } else {
      // Open overlay with new tab
      const previousTab = activeTab;
      setActiveTab(tab);
      
      // Clear selection when switching tabs
      if (previousTab !== null && selectedCapsules.size > 0) {
        console.log(`⚠️ Switching from ${previousTab} to ${tab} - clearing ${selectedCapsules.size} selected capsules`);
      }
      setSelectedCapsules(new Set());
      
      // Reset display limit when switching tabs to 10 (useEffect will adjust if folder has ≤10 total)
      setDisplayLimit(10);
      
      // OPTIMIZATION: Preload next page in background if we have more data
      if (hasMore && capsules.length < 20) {
        console.log('🔄 Preloading next page in background...');
        DatabaseService.getUserTimeCapsules(user.id, PAGE_SIZE, currentPage + 1)
          .then(result => {
            console.log('✅ Preloaded', result.capsules.length, 'more capsules');
          })
          .catch(err => console.warn('Preload failed:', err));
      }
    }
  };

  // Keyboard shortcuts for selection - only when capsules are visible (tab is active)
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle shortcuts when a tab is active, capsules are visible, and no input is focused
      if (!activeTab || filteredCapsules.length === 0 || 
          event.target.tagName === 'INPUT' || 
          event.target.tagName === 'TEXTAREA') {
        return;
      }

      // Ctrl/Cmd + A: Select all
      if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault();
        setSelectedCapsules(new Set(filteredCapsules.map(c => c.id)));
      }

      // Escape: Clear selection
      if (event.key === 'Escape' && selectedCapsules.size > 0) {
        event.preventDefault();
        setSelectedCapsules(new Set());
      }

      // Delete: Delete selected capsules
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedCapsules.size > 0) {
        event.preventDefault();
        bulkDeleteCapsules();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTab, filteredCapsules, selectedCapsules, bulkDeleteCapsules]);

  // Show loading skeleton while data is being fetched
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        {/* Desktop skeleton */}
        <div className="hidden sm:block">
          <DashboardSkeleton />
        </div>
        {/* Mobile skeleton */}
        <div className="block sm:hidden">
          <DashboardSkeletonMobile />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-3 lg:space-y-3 -mt-4 sm:mt-0 px-1 sm:px-0 relative">
      {/* NEON CYBERPUNK: Decorative background grid pattern */}
      <div className="fixed inset-0 opacity-[0.02] dark:opacity-[0.03] pointer-events-none z-0" 
        style={{
          backgroundImage: `linear-gradient(#0EA5E9 1px, transparent 1px), linear-gradient(90deg, #0EA5E9 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)'
        }}
      />
      
      {/* NEON CYBERPUNK: Scanline overlay effect */}
      <div className="fixed inset-0 opacity-[0.015] dark:opacity-[0.02] pointer-events-none z-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(14, 165, 233, 0.03) 2px, rgba(14, 165, 233, 0.03) 4px)'
        }}
      />

      {/* Network Status Banner */}
      {networkStatus === 'offline' && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <WifiOff className="w-5 h-5 text-red-600" />
            <span className="text-red-700 dark:text-red-300">
              You're offline. Some features may not work properly.
            </span>
          </div>
        </div>
      )}

      {/* Error State */}
      {dashboardError && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-200">Temporary Loading Issue</h3>
              <p className="text-sm text-amber-600 dark:text-amber-400">{dashboardError}</p>
            </div>
          </div>
          {retryCount > 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mb-3">
              Retry attempt {retryCount}/{maxRetries}
            </p>
          )}
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
            className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Page
          </Button>
        </div>
      )}

      {/* Capsule Tabs - Click to show/hide capsules */}
      {/* MOBILE PERFORMANCE FIX: Hide stats dashboard when modal is open */}
      {!viewingCapsule && (
      <>
      {/* Desktop: 4-1 Grid Layout with Emojis - NEON CYBERPUNK FACELIFT */}
      <div ref={statsRef} className="hidden lg:block lg:space-y-4">
        {/* Row 1: Scheduled, Delivered */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { 
              key: 'scheduled', 
              label: 'Scheduled', 
              value: stats.scheduled, 
              emoji: '⏰', 
              ringGradient: 'ring-cyan-400', 
              bgGradient: 'bg-gradient-to-br from-cyan-500/60 via-blue-500/50 to-cyan-600/60', 
              activeBgGradient: 'bg-gradient-to-br from-cyan-400/70 via-blue-400/60 to-cyan-500/70',
              hoverGlow: 'hover:shadow-cyan-500/60',
              textGradient: 'from-cyan-400 via-blue-400 to-cyan-300',
              neonBorder: 'border-cyan-400/50',
              neonGlow: 'shadow-cyan-400/30'
            },
            { 
              key: 'delivered', 
              label: 'Delivered', 
              value: stats.delivered, 
              emoji: '📬', 
              ringGradient: 'ring-emerald-400', 
              bgGradient: 'bg-gradient-to-br from-emerald-500/60 via-teal-500/50 to-green-500/60', 
              activeBgGradient: 'bg-gradient-to-br from-emerald-400/70 via-teal-400/60 to-green-400/70',
              hoverGlow: 'hover:shadow-emerald-500/60',
              textGradient: 'from-emerald-400 via-teal-300 to-green-400',
              neonBorder: 'border-emerald-400/50',
              neonGlow: 'shadow-emerald-400/30'
            }
          ].map(({ key, label, value, emoji, ringGradient, bgGradient, activeBgGradient, hoverGlow, textGradient, neonBorder, neonGlow }) => (
            <Card
              key={key}
              className={`cursor-pointer transition-all duration-500 ease-out group relative overflow-hidden backdrop-blur-sm
                border-2 ${activeTab === key ? ringGradient.replace('ring-', 'border-') : neonBorder}
                hover:scale-[1.08] hover:shadow-2xl hover:-translate-y-1 ${hoverGlow}
                ${activeTab === key ? `ring-4 ${ringGradient} shadow-2xl ${neonGlow} scale-105 ${activeBgGradient}` : bgGradient}
              `}
              onClick={() => handleTabClick(key)}
            >
              {/* NEON: Animated border glow pulse */}
              {activeTab === key && (
                <div className="absolute inset-0 opacity-50 pointer-events-none">
                  <div className={`absolute inset-0 ${ringGradient.replace('ring-', 'border-')} border-2 animate-pulse`} />
                </div>
              )}
              
              {/* Shimmer effect on hover - intensified */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </div>
              
              <CardContent className="p-6 relative z-10">
                <div className="flex flex-col items-center text-center gap-3">
                  <p className="text-base font-bold text-white dark:text-white tracking-widest uppercase drop-shadow-lg">{label}</p>
                  <span className={`text-7xl inline-block transition-all duration-500 ease-out
                    ${activeTab === key ? 'scale-125 drop-shadow-2xl' : 'group-hover:scale-110 group-hover:drop-shadow-xl'}
                  `} style={{
                    filter: activeTab === key ? 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.6))' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                  }}>{emoji}</span>
                  <p className={`text-4xl font-bold bg-gradient-to-br ${textGradient} bg-clip-text text-transparent drop-shadow-sm`}>
                    {/* ✅ Desktop: Show loading state for received count */}
                    {key === 'received' && stats.receivedLoading ? (
                      <span className="animate-pulse opacity-60">...</span>
                    ) : (
                      value ?? 0
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Row 2: Received, Drafts */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { 
              key: 'received', 
              label: 'Received', 
              value: stats.received, 
              emoji: '🎁', 
              ringGradient: 'ring-amber-400', 
              bgGradient: 'bg-gradient-to-br from-amber-500/60 via-yellow-500/50 to-orange-500/60', 
              activeBgGradient: 'bg-gradient-to-br from-amber-400/70 via-yellow-400/60 to-orange-400/70',
              hoverGlow: 'hover:shadow-amber-500/60',
              textGradient: 'from-amber-300 via-yellow-300 to-orange-300',
              neonBorder: 'border-amber-400/50',
              neonGlow: 'shadow-amber-400/30'
            },
            { 
              key: 'draft', 
              label: 'Drafts', 
              value: stats.draft, 
              emoji: '🖊️', 
              ringGradient: 'ring-purple-400', 
              bgGradient: 'bg-gradient-to-br from-purple-500/60 via-violet-500/50 to-fuchsia-500/60', 
              activeBgGradient: 'bg-gradient-to-br from-purple-400/70 via-violet-400/60 to-fuchsia-400/70',
              hoverGlow: 'hover:shadow-purple-500/60',
              textGradient: 'from-purple-300 via-violet-300 to-fuchsia-300',
              neonBorder: 'border-purple-400/50',
              neonGlow: 'shadow-purple-400/30'
            }
          ].map(({ key, label, value, emoji, ringGradient, bgGradient, activeBgGradient, hoverGlow, textGradient, neonBorder, neonGlow }) => (
            <Card
              key={key}
              className={`cursor-pointer transition-all duration-500 ease-out group relative overflow-hidden backdrop-blur-sm
                border-2 ${activeTab === key ? ringGradient.replace('ring-', 'border-') : neonBorder}
                hover:scale-[1.08] hover:shadow-2xl hover:-translate-y-1 ${hoverGlow}
                ${activeTab === key ? `ring-4 ${ringGradient} shadow-2xl ${neonGlow} scale-105 ${activeBgGradient}` : bgGradient}
              `}
              onClick={() => handleTabClick(key)}
            >
              {/* NEON: Animated border glow pulse */}
              {activeTab === key && (
                <div className="absolute inset-0 opacity-50 pointer-events-none">
                  <div className={`absolute inset-0 ${ringGradient.replace('ring-', 'border-')} border-2 animate-pulse`} />
                </div>
              )}
              
              {/* Shimmer effect on hover - intensified */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </div>
              
              <CardContent className="p-6 relative z-10">
                <div className="flex flex-col items-center text-center gap-3">
                  <p className="text-base font-bold text-white dark:text-white tracking-widest uppercase drop-shadow-lg">{label}</p>
                  <span className={`text-7xl inline-block transition-all duration-500 ease-out
                    ${activeTab === key ? 'scale-125 drop-shadow-2xl' : 'group-hover:scale-110 group-hover:drop-shadow-xl'}
                  `} style={{
                    filter: activeTab === key ? 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.6))' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                  }}>{emoji}</span>
                  <p className={`text-4xl font-bold bg-gradient-to-br ${textGradient} bg-clip-text text-transparent drop-shadow-sm`}>{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Row 3: All Capsules (Full Width) - NEON HOT PINK */}
        <Card
          className={`cursor-pointer transition-all duration-500 ease-out group relative overflow-hidden backdrop-blur-sm
            border-2 ${activeTab === 'all' ? 'border-pink-400' : 'border-pink-400/50'}
            hover:scale-[1.03] hover:shadow-2xl hover:-translate-y-1 hover:shadow-pink-500/60
            ${activeTab === 'all' ? 'ring-4 ring-pink-400 shadow-2xl shadow-pink-400/30 scale-[1.02] bg-gradient-to-br from-pink-500/70 via-fuchsia-500/60 to-rose-500/70' : 'bg-gradient-to-br from-pink-500/60 via-fuchsia-500/50 to-rose-500/60'}
          `}
          onClick={() => handleTabClick('all')}
        >
          {/* NEON: Animated border glow pulse */}
          {activeTab === 'all' && (
            <div className="absolute inset-0 opacity-50 pointer-events-none">
              <div className="absolute inset-0 border-pink-400 border-2 animate-pulse" />
            </div>
          )}
          
          {/* Shimmer effect on hover - intensified */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </div>
          
          <CardContent className="p-6 overflow-visible relative z-10">
            <div className="flex flex-col items-center gap-3 overflow-visible">
              <p className="text-base font-bold text-white dark:text-white tracking-widest uppercase text-center drop-shadow-lg">All Capsules</p>
              <p className="text-[13.2px] text-white dark:text-white text-center -mt-2 opacity-90">(Note: Self-sent capsules count toward Received, not Delivered)</p>
              <span className={`text-7xl inline-block transition-all duration-500 ease-out
                ${activeTab === 'all' ? 'scale-125 drop-shadow-2xl' : 'group-hover:scale-110 group-hover:drop-shadow-xl'}
              `} style={{
                filter: activeTab === 'all' ? 'drop-shadow(0 0 20px rgba(244, 63, 94, 0.8))' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
              }}>🌌</span>
              <p className="text-4xl font-bold bg-gradient-to-br from-pink-200 via-fuchsia-200 to-rose-200 bg-clip-text text-transparent text-center drop-shadow-sm">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile/Tablet: 2-2-1 Grid Layout - NEON CYBERPUNK with SOLID COLORS */}
      <div className="lg:hidden space-y-3 sm:space-y-3">
        {/* Row 1: Scheduled, Delivered */}
        <div className="grid grid-cols-2 gap-3 sm:gap-3">
          {[
            { 
              key: 'scheduled', 
              label: 'Scheduled', 
              value: stats.scheduled, 
              emoji: '⏰', 
              ringGradient: 'ring-cyan-400', 
              bgSolid: 'bg-cyan-600/60 dark:bg-cyan-700/70', 
              activeBgSolid: 'bg-cyan-500/70 dark:bg-cyan-600/80',
              textColor: 'text-cyan-200 dark:text-cyan-200',
              borderColor: 'border-cyan-400/60',
              activeBorder: 'border-cyan-400'
            },
            { 
              key: 'delivered', 
              label: 'Delivered', 
              value: stats.delivered, 
              emoji: '📬', 
              ringGradient: 'ring-emerald-400', 
              bgSolid: 'bg-emerald-600/60 dark:bg-emerald-700/70', 
              activeBgSolid: 'bg-emerald-500/70 dark:bg-emerald-600/80',
              textColor: 'text-emerald-200 dark:text-emerald-200',
              borderColor: 'border-emerald-400/60',
              activeBorder: 'border-emerald-400'
            }
          ].map(({ key, label, value, emoji, ringGradient, bgSolid, activeBgSolid, textColor, borderColor, activeBorder }) => (
            <Card
              key={key}
              className={`cursor-pointer transition-all duration-300 active:scale-95 group relative overflow-hidden
                backdrop-blur-sm border-2 ${activeTab === key ? `${activeBorder} ring-2 ${ringGradient} shadow-xl ${activeBgSolid}` : `${borderColor} ${bgSolid}`}
              `}
              onClick={() => handleTabClick(key)}
            >
              {/* Shimmer effect on active */}
              {activeTab === key && (
                <div className="absolute inset-0 opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
              )}
              
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col items-center text-center gap-2 sm:gap-2">
                  <p className="text-sm sm:text-base font-bold text-white dark:text-white tracking-wider uppercase lg:normal-case drop-shadow-md">{label}</p>
                  <span className={`text-[52px] sm:text-5xl inline-block transition-all duration-300
                    ${activeTab === key ? 'scale-110' : ''}
                  `} style={{
                    filter: activeTab === key ? 'drop-shadow(0 0 12px rgba(255, 215, 0, 0.6))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                  }}>{emoji}</span>
                  <p className={`text-2xl sm:text-3xl font-bold ${textColor} drop-shadow-sm`}>{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Row 2: Received, Drafts */}
        <div className="grid grid-cols-2 gap-3 sm:gap-3">
          {[
            { 
              key: 'received', 
              label: 'Received', 
              value: stats.received, 
              emoji: '🎁', 
              ringGradient: 'ring-amber-400', 
              bgSolid: 'bg-amber-600/60 dark:bg-amber-700/70', 
              activeBgSolid: 'bg-amber-500/70 dark:bg-amber-600/80',
              textColor: 'text-amber-200 dark:text-amber-200',
              borderColor: 'border-amber-400/60',
              activeBorder: 'border-amber-400'
            },
            { 
              key: 'draft', 
              label: 'Drafts', 
              value: stats.draft, 
              emoji: '🖊️', 
              ringGradient: 'ring-purple-400', 
              bgSolid: 'bg-purple-600/60 dark:bg-purple-700/70', 
              activeBgSolid: 'bg-purple-500/70 dark:bg-purple-600/80',
              textColor: 'text-purple-200 dark:text-purple-200',
              borderColor: 'border-purple-400/60',
              activeBorder: 'border-purple-400'
            }
          ].map(({ key, label, value, emoji, ringGradient, bgSolid, activeBgSolid, textColor, borderColor, activeBorder }) => (
            <Card
              key={key}
              className={`cursor-pointer transition-all duration-300 active:scale-95 group relative overflow-hidden
                backdrop-blur-sm border-2 ${activeTab === key ? `${activeBorder} ring-2 ${ringGradient} shadow-xl ${activeBgSolid}` : `${borderColor} ${bgSolid}`}
              `}
              onClick={() => handleTabClick(key)}
            >
              {/* Shimmer effect on active */}
              {activeTab === key && (
                <div className="absolute inset-0 opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
              )}
              
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col items-center text-center gap-2 sm:gap-2">
                  <p className="text-sm sm:text-base font-bold text-white dark:text-white tracking-wider uppercase lg:normal-case drop-shadow-md">{label}</p>
                  <span className={`text-[52px] sm:text-5xl inline-block transition-all duration-300
                    ${activeTab === key ? 'scale-110' : ''}
                  `} style={{
                    filter: activeTab === key ? 'drop-shadow(0 0 12px rgba(255, 215, 0, 0.6))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                  }}>{emoji}</span>
                  <p className={`text-2xl sm:text-3xl font-bold ${textColor} drop-shadow-sm`}>
                    {/* ✅ Mobile: Show loading state for received count */}
                    {key === 'received' && stats.receivedLoading ? (
                      <span className="animate-pulse opacity-60">...</span>
                    ) : (
                      value ?? 0
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Row 3: All Capsules (Full Width) - NEON HOT PINK with SOLID COLOR */}
        <Card
          className={`cursor-pointer transition-all duration-300 active:scale-[0.98] group relative overflow-hidden
            backdrop-blur-sm border-2 ${activeTab === 'all' ? 'border-pink-400 ring-2 ring-pink-400 shadow-xl bg-pink-600/70 dark:bg-pink-700/80' : 'border-pink-400/60 bg-pink-600/60 dark:bg-pink-700/70'}
          `}
          onClick={() => handleTabClick('all')}
        >
          {/* Shimmer effect on active */}
          {activeTab === 'all' && (
            <div className="absolute inset-0 opacity-100 transition-opacity duration-500 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          )}
          
          <CardContent className="p-3 sm:p-4 overflow-visible">
            <div className="flex flex-col items-center gap-2 sm:gap-2 overflow-visible">
              <p className="text-sm sm:text-base font-bold text-white dark:text-white tracking-wider text-center uppercase lg:normal-case drop-shadow-md">All Capsules</p>
              <p className="text-[11px] sm:text-[13.2px] text-white dark:text-white text-center -mt-1 opacity-90">(Note: Self-sent capsules count toward Received, not Delivered)</p>
              <span className={`text-[52px] sm:text-5xl inline-block transition-all duration-300
                ${activeTab === 'all' ? 'scale-110' : ''}
              `} style={{
                filter: activeTab === 'all' ? 'drop-shadow(0 0 12px rgba(244, 63, 94, 0.8))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
              }}>🌌</span>
              <p className="text-2xl sm:text-3xl font-bold text-pink-200 dark:text-pink-200 text-center drop-shadow-sm">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      </>
      )}

      {/* Empty state - Show on main dashboard when no tab is active */}
      {!isLoading && !activeTab && capsules.length === 0 && (
        <Card className="mt-6 bg-white/5 dark:bg-slate-800/30 border-white/10 dark:border-slate-700/50 overflow-hidden relative">
          {/* Subtle Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
          
          <CardContent className="p-16 text-center relative z-10">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-white/10 shadow-xl">
              <Inbox className="w-12 h-12 text-blue-400 dark:text-blue-300" />
            </div>
            <h3 className="text-2xl font-semibold mb-3 bg-gradient-to-br from-slate-700 to-slate-900 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">No capsules yet</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
              Create your first time capsule to get started with Eras
            </p>
            <div className="flex justify-center">
              <Button 
                onClick={onCreateCapsule}
                size="lg"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                <PlusCircle className="w-5 h-5" />
                Create Capsule
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Capsules Overlay - Fullscreen modal similar to camera */}
      <AnimatePresence mode="wait">
        {activeTab && (
          <>
            {/* Force high z-index for Dialog overlay and content to appear above hamburger menu */}
            <style>{`
              [data-slot="dialog-overlay"] {
                z-index: 199 !important;
              }
              [data-slot="dialog-content"] {
                z-index: 200 !important;
              }
            `}</style>
            
            <Dialog key={activeTab} open={!!activeTab} onOpenChange={(open) => {
              // Don't close the folder if we're showing delete dialog, viewing capsule, or deleting
              if (!open && !showDeleteDialog && !viewingCapsule && !isDeleting) {
                setActiveTab(null);
              }
            }} modal={false}>
              <DialogContent 
                className="max-w-full h-screen w-screen p-0 gap-0 [&>button]:!hidden !top-0 !left-0 !translate-x-0 !translate-y-0 !rounded-none bg-slate-900 dark:bg-slate-950"
                style={{ overflow: 'hidden' }}
                aria-describedby="folder-description"
            >
              <DialogDescription id="folder-description" className="sr-only">
                Browse and manage capsules in this folder
              </DialogDescription>
              <motion.div
                key={`overlay-${activeTab}`}
                initial={{ rotateY: 45, opacity: 0, scale: 0.95 }}
                animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                exit={{ rotateY: -45, opacity: 0, scale: 0.95 }}
                transition={{ 
                  duration: 0.6,
                  ease: [0.34, 1.56, 0.64, 1],
                  opacity: { duration: 0.4 }
                }}
                style={{ 
                  transformStyle: 'preserve-3d',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  willChange: 'transform, opacity',
                  backfaceVisibility: 'hidden',
                  WebkitFontSmoothing: 'antialiased'
                }}
              >
                {/* NEW CLEAN HEADER - Brand new design for each folder */}
                <FolderHeader 
                  folderType={activeTab}
                  count={activeTab === 'received' ? stats.received : (activeTab === 'all' ? stats.total : filteredCapsules.length)}
                  onClose={() => setActiveTab(null)}
                />
                
                {/* Hidden accessibility elements */}
                <DialogTitle className="sr-only">
                  {activeTab === 'all' && 'All Capsules'}
                  {activeTab === 'scheduled' && 'Scheduled'}
                  {activeTab === 'delivered' && 'Delivered'}
                  {activeTab === 'received' && 'Received'}
                  {activeTab === 'draft' && 'Drafts'}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  {activeTab === 'all' && 'View and manage all your time capsules'}
                  {activeTab === 'scheduled' && 'View capsules scheduled for future delivery'}
                  {activeTab === 'delivered' && 'View capsules that have been delivered'}
                  {activeTab === 'received' && 'View capsules you have received from others'}
                  {activeTab === 'draft' && 'View and edit your draft capsules'}
                </DialogDescription>

            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
              <div className="absolute top-1/2 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Scrollable content */}
            <ScrollArea 
              className="flex-1 bg-transparent relative z-10"
              viewportRef={scrollViewportRef}
              style={{ 
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <PullToRefresh 
                onRefresh={async () => {
                  console.log('🔄 Pull-to-refresh triggered');
                  if (activeTab === 'received') {
                    await refreshReceivedCount();
                  } else {
                    await handleRefresh();
                  }
                  // Sync offline actions if needed
                  syncOfflineActions();
                }}
                scrollContainerRef={scrollViewportRef}
              >
              <div className="p-4 sm:p-6 space-y-4" style={{ minHeight: '100%' }}>
      
      {/* NEW MOBILE SEARCH BAR - Complete redesign for mobile only */}
      {/* MOBILE PERFORMANCE FIX: Hide search bar when modal is open */}
      {!viewingCapsule && (
        <MobileSearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          hasActiveFilters={!!(searchTerm || filterMediaType !== 'all' || selectedDate)}
          onClearFilters={clearFilters}
          onRefresh={lastSync ? handleRefresh : undefined}
          lastSync={lastSync}
          placeholder={`Search ${activeTab === 'all' ? 'all' : activeTab} capsules...`}
          filterMediaType={filterMediaType}
          onFilterMediaTypeChange={setFilterMediaType}
        />
      )}

      {/* DESKTOP SEARCH - Keep original desktop implementation */}
      {/* MOBILE PERFORMANCE FIX: Hide search bar when modal is open */}
      {!viewingCapsule && (
        <Card className="hidden md:block bg-slate-800/60 border-slate-700/50 shadow-xl">
          <CardContent className="p-2">
            <div className="flex items-center gap-2 h-9 flex-wrap sm:flex-nowrap">
              <div className="flex-1 relative min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none z-10" />
                <Input
                  placeholder={`Search ${activeTab === 'all' ? 'all' : activeTab} capsules...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 pl-10 pr-3 bg-slate-900/50 border-slate-700/50"
                />
              </div>
              <Select value={filterMediaType} onValueChange={setFilterMediaType}>
                <SelectTrigger className="w-[110px] h-9 bg-slate-900/50 border-slate-700/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[100px] h-9 bg-slate-900/50 border-slate-700/50">
                    <Calendar className="mr-1 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'M/d') : 'Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent mode="single" selected={selectedDate} onSelect={handleDateSelect} initialFocus />
                </PopoverContent>
              </Popover>
              <div className="flex border border-slate-700/50 rounded-md h-9">
                <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => handleViewModeChange('grid')} className={`rounded-none h-9 px-2 ${viewMode === 'grid' ? 'bg-gradient-to-r from-blue-500 to-violet-600' : ''}`}>
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => handleViewModeChange('list')} className={`rounded-none h-9 px-2 ${viewMode === 'list' ? 'bg-gradient-to-r from-blue-500 to-violet-600' : ''}`}>
                  <List className="w-4 h-4" />
                </Button>
              </div>
              {(searchTerm || filterMediaType !== 'all' || selectedDate) && (
                <Button variant="ghost" onClick={clearFilters} className="h-9 px-2 hover:text-red-400">
                  <X className="w-4 h-4" />
                </Button>
              )}
              {lastSync && (
                <Button variant="ghost" onClick={handleRefresh} className="h-9 px-2 hover:text-blue-400" title={`Last synced: ${format(lastSync, 'PPp')}`}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

          {/* Loading State */}
          {isLoading && (
            <Card className="bg-slate-800/60 border-slate-700/50 shadow-xl">
              <CardContent className="p-12 text-center">
                <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-indigo-400" />
                <p className="text-slate-300">Loading your capsules...</p>
              </CardContent>
            </Card>
          )}

          {/* Loading Skeleton - Show when fetching capsules */}
          {isLoading && activeTab && (
            <CapsuleGridSkeleton count={8} />
          )}

          {/* Capsules Grid/List View - Cosmic card layout */}
          {/* MOBILE PERFORMANCE FIX: Only render grid when modal is NOT open */}
          {!viewingCapsule && !isLoading && activeTab && filteredCapsules.length > 0 && (
            <>
              <div 
                key={`capsules-grid-${displayLimit}`}
                data-capsule-grid
                className={viewMode === 'grid' 
                  ? 'grid gap-2 grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full overflow-hidden'
                  : 'flex flex-col gap-3 w-full'
                }
              >
                {displayedCapsules.map(capsule => {
                const isSelected = selectedCapsules.has(capsule.id);
                
                return (
                  <CapsuleCard 
                    key={capsule.isReceived ? `received-${capsule.id}` : capsule.id}
                    capsule={capsule}
                    isSelected={isSelected}
                    onClick={() => {
                      console.log('🎯 Dashboard onClick called for capsule:', {
                        id: capsule.id,
                        title: capsule.title,
                        status: capsule.status,
                        isReceived: capsule.isReceived,
                        capsuleObject: capsule
                      });
                      // Store current folder before viewing capsule
                      folderBeforeActionRef.current = activeTab;
                      setViewingCapsule(capsule);
                      console.log('✅ setViewingCapsule called with capsule');
                    }}
                    onToggleSelect={() => {
                      if (!capsule.isReceived) {
                        toggleSelectCapsule(capsule.id);
                      }
                    }}
                    formatRelativeDeliveryTime={formatRelativeDeliveryTime}
                    getRecipientInfo={getRecipientInfo}
                    getStatusDisplay={getStatusDisplay}
                    expandedMediaCapsules={expandedMediaCapsules}
                    onToggleMediaExpand={(id) => {
                      setExpandedMediaCapsules(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(id)) {
                          newSet.delete(id);
                        } else {
                          newSet.add(id);
                        }
                        return newSet;
                      });
                    }}
                    onMediaClick={(media, index, allMedia) => {
                      // Remember the current folder before opening preview
                      if (activeTab) {
                        setFolderBeforePreview(activeTab);
                      }
                      setPreviewAttachment(media);
                    }}
                    onEditDetails={(capsule) => {
                      // Remember the current folder before editing
                      // EXCEPT for drafts/scheduled - those should go to Home after editing
                      if (activeTab && user?.id && activeTab !== 'drafts' && activeTab !== 'scheduled') {
                        sessionStorage.setItem(`dashboard_folder_before_edit_${user.id}`, activeTab);
                      }
                      onEditCapsuleDetails(capsule);
                    }}
                    onEditCapsule={(capsule) => {
                      // Remember the current folder before editing
                      // EXCEPT for drafts/scheduled - those should go to Home after editing
                      if (activeTab && user?.id && activeTab !== 'drafts' && activeTab !== 'scheduled') {
                        sessionStorage.setItem(`dashboard_folder_before_edit_${user.id}`, activeTab);
                      }
                      onEditCapsule(capsule);
                    }}
                    onDelete={deleteCapsule}
                    canEditCapsule={canEditCapsule}
                    currentFolder={activeTab}
                  />
                );
              })}
              </div>

              {/* Load More Button - Show when there are more FILTERED capsules to display */}
              {hasMoreToDisplay && (
                <div className="flex justify-center py-6">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      const remainingCount = filteredCapsules.length - displayLimit;
                      const loadCount = Math.min(10, remainingCount);
                      
                      // NUCLEAR FIX: Force complete DOM repaint to clear stuck hover states
                      const gridContainer = document.querySelector('[data-capsule-grid]');
                      if (gridContainer) {
                        // Force reflow by hiding and showing
                        (gridContainer as HTMLElement).style.visibility = 'hidden';
                        (gridContainer as HTMLElement).style.pointerEvents = 'none';
                        
                        requestAnimationFrame(() => {
                          if (gridContainer) {
                            (gridContainer as HTMLElement).style.visibility = 'visible';
                            (gridContainer as HTMLElement).style.pointerEvents = '';
                          }
                        });
                      }
                      
                      setDisplayLimit(prev => prev + loadCount);
                      console.log(`📊 Loading ${loadCount} more capsules (${remainingCount} remaining)`);
                    }}
                    className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Load More ({Math.min(10, filteredCapsules.length - displayLimit)} of {filteredCapsules.length - displayLimit} remaining)
                  </Button>
                </div>
              )}

              {/* Load More from Database - Show when all fetched capsules are displayed AND more exist in database */}
              {needsLoadFromDatabase && (
                <div className="flex justify-center py-6">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={loadMoreFromDatabase}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Load More Capsules
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {/* MOBILE PERFORMANCE FIX: Only render empty state when modal is NOT open */}
          {!viewingCapsule && !isLoading && activeTab && filteredCapsules.length === 0 && (
            <CosmicEmptyState
              activeTab={activeTab}
              searchTerm={searchTerm}
              filterMediaType={filterMediaType}
              selectedDate={selectedDate}
              onClearFilters={clearFilters}
              onCreateCapsule={onCreateCapsule}
            />
          )}
              </div>
              </PullToRefresh>
            </ScrollArea>

            {/* Batch Actions Toolbar at bottom - Fixed positioning */}
              </motion.div>
            </DialogContent>
          </Dialog>
          </>
        )}
      </AnimatePresence>

      {/* Capsule Detail Modal */}
      {(() => {
        console.log('🔍 Modal render check:', {
          hasViewingCapsule: !!viewingCapsule,
          viewingCapsuleId: viewingCapsule?.id,
          viewingCapsuleTitle: viewingCapsule?.title
        });
        return viewingCapsule ? (
        <CapsuleDetailModal
          capsule={viewingCapsule}
          isOpen={true}
          onClose={() => {
            setViewingCapsule(null);
            // Restore folder if it was set before viewing
            if (folderBeforeActionRef.current && !activeTab) {
              console.log('🔄 Restoring folder after closing capsule detail:', folderBeforeActionRef.current);
              setActiveTab(folderBeforeActionRef.current);
              folderBeforeActionRef.current = null;
            }
          }}
          onEditDetails={(capsule) => {
            // Remember the current folder before editing
            // EXCEPT for drafts/scheduled - those should go to Home after editing
            if (activeTab && user?.id && activeTab !== 'drafts' && activeTab !== 'scheduled') {
              sessionStorage.setItem(`dashboard_folder_before_edit_${user.id}`, activeTab);
            }
            onEditCapsuleDetails(capsule);
            setViewingCapsule(null);
          }}
          onEditCapsule={(capsule) => {
            // Remember the current folder before editing
            // EXCEPT for drafts/scheduled - those should go to Home after editing
            if (activeTab && user?.id && activeTab !== 'drafts' && activeTab !== 'scheduled') {
              sessionStorage.setItem(`dashboard_folder_before_edit_${user.id}`, activeTab);
            }
            onEditCapsule(capsule);
            setViewingCapsule(null);
          }}
          onMediaClick={(media) => {
            // Remember the current folder before opening preview
            if (activeTab) {
              setFolderBeforePreview(activeTab);
            }
            setPreviewAttachment(media);
          }}
          canEdit={canEditCapsule(viewingCapsule)}
          onEchoSent={async () => {
            // FIXED: Don't re-fetch and update viewing capsule which causes opening animation to replay
            // Just refresh capsule list in background without touching viewingCapsule
            console.log('💫 Echo sent in Dashboard, refreshing data silently...');
            try {
              // Refresh the main capsule list in background for next time
              // But DON'T update viewingCapsule - keep it stable so animation doesn't replay
              const result = await DatabaseService.getUserTimeCapsules(user.id, INITIAL_FETCH_SIZE, 0);
              
              // Update the main capsule list silently (for dashboard refresh)
              setCapsules(prev => prev.map(c => {
                const updated = result.capsules.find(rc => rc.id === c.id);
                return updated || c;
              }));
              
              // DO NOT call setViewingCapsule() - this would cause the modal to re-render
              // and trigger the opening animation again. The EchoSocialTimeline component
              // will automatically refresh via its polling mechanism.
              console.log('✅ Echo data refresh complete (viewing capsule unchanged)');
            } catch (error) {
              console.error('Failed to refresh capsule data after echo in Dashboard:', error);
            }
          }}
        />
      ) : null;
      })()}

      {/* Media Preview Modal */}
      {previewAttachment && (
        <MediaPreviewModal
          isOpen={true}
          mediaFile={{
            id: previewAttachment.id || 'preview',
            file_name: previewAttachment.filename || previewAttachment.file_name || previewAttachment.name || 'Media Preview',
            file_type: previewAttachment.type || previewAttachment.file_type || previewAttachment.media_type || previewAttachment.content_type || '',
            file_size: previewAttachment.size || previewAttachment.file_size || 0,
            url: previewAttachment.url || previewAttachment.file_url || '',
            created_at: previewAttachment.created_at || new Date().toISOString()
          }}
          onClose={() => {
            setPreviewAttachment(null);
            // Restore the folder the user was in before opening preview
            if (folderBeforePreview) {
              setTimeout(() => {
                setActiveTab(folderBeforePreview);
                setFolderBeforePreview(null);
              }, 100);
            }
          }}
        />
      )}

      {/* Edit Delivery Time Dialog */}
      {editingDelivery && (
        <EditDeliveryTime
          capsule={editingDelivery}
          onClose={() => setEditingDelivery(null)}
          onUpdate={async (capsuleId, newDeliveryDate, newDeliveryTime) => {
            try {
              await DatabaseService.updateCapsuleDelivery(capsuleId, newDeliveryDate, newDeliveryTime);
              
              setCapsules(prev => prev.map(c => 
                c.id === capsuleId 
                  ? { ...c, deliveryDate: newDeliveryDate, deliveryTime: newDeliveryTime }
                  : c
              ));
              
              toast.success('Delivery time updated!');
              setEditingDelivery(null);
            } catch (error) {
              console.error('Error updating delivery time:', error);
              toast.error('Failed to update delivery time');
            }
          }}
        />
      )}

      {/* Delete Confirmation Alert Dialog */}
      {/* Force AlertDialog to appear ABOVE folder overlay with high z-index */}
      <style>{`
        /* Delete dialog must appear above folder dialog (z-index 200) and dropdown menus (z-index 9999) */
        [role="alertdialog"] {
          z-index: 10000 !important;
        }
        [data-radix-alert-dialog-overlay] {
          z-index: 9999 !important;
          background-color: rgba(0, 0, 0, 0.7) !important;
          pointer-events: all !important;
        }
      `}</style>
      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => {
        console.log('🔄 Delete dialog state changed:', open);
        setShowDeleteDialog(open);
        if (!open) {
          console.log('🔒 Delete dialog closed, clearing state');
          // Clear delete state when dialog is closed
          setCapsulesToDelete(new Set());
        }
      }}>
        <AlertDialogContent className={`max-w-md ${
          isMobile
            ? 'bg-slate-900/98 border-slate-700'
            : 'bg-slate-900/95 border-slate-700/50'
        }`}>
          <AlertDialogHeader>
            <AlertDialogTitle className={`flex items-center gap-2 ${
              isMobile ? 'text-xl' : 'text-2xl'
            }`}>
              {(() => {
                // Check if deleting received capsules
                const capsulesMap = new Map();
                [...capsules, ...receivedCapsules].forEach(c => capsulesMap.set(c.id, c));
                const hasReceived = Array.from(capsulesToDelete).some(id => capsulesMap.get(id)?.isReceived);
                const hasOwned = Array.from(capsulesToDelete).some(id => !capsulesMap.get(id)?.isReceived);
                
                if (hasReceived && !hasOwned) {
                  return (
                    <>
                      <AlertTriangle className={`${isMobile ? 'w-6 h-6' : 'w-7 h-7'} text-blue-500`} />
                      <span className="bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">
                        Move to Archive?
                      </span>
                    </>
                  );
                } else if (hasReceived && hasOwned) {
                  return (
                    <>
                      <AlertTriangle className={`${isMobile ? 'w-6 h-6' : 'w-7 h-7'} text-blue-500`} />
                      <span className="bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">
                        Move to Archive?
                      </span>
                    </>
                  );
                } else {
                  return (
                    <>
                      <AlertTriangle className={`${isMobile ? 'w-6 h-6' : 'w-7 h-7'} text-blue-500`} />
                      <span className="bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">
                        Move to Archive?
                      </span>
                    </>
                  );
                }
              })()}
            </AlertDialogTitle>
            <AlertDialogDescription asChild className={`space-y-3 ${isMobile ? 'text-base' : 'text-lg'} text-slate-300`}>
              <div>
                <div className="bg-slate-800/60 rounded-lg p-3 sm:p-4 border border-slate-700/50">
                  {(() => {
                  const capsulesMap = new Map();
                  [...capsules, ...receivedCapsules].forEach(c => capsulesMap.set(c.id, c));
                  const receivedToDelete = Array.from(capsulesToDelete).filter(id => capsulesMap.get(id)?.isReceived);
                  const ownedToDelete = Array.from(capsulesToDelete).filter(id => !capsulesMap.get(id)?.isReceived);
                  
                  if (receivedToDelete.length > 0 && ownedToDelete.length === 0) {
                    return (
                      <>
                        <p className="font-semibold text-white">
                          You're about to move <span className="text-orange-400">{receivedToDelete.length}</span> received capsule{receivedToDelete.length !== 1 ? 's' : ''} to Archive.
                        </p>
                        <p className="text-sm text-slate-400 mt-2">
                          {receivedToDelete.length === 1 ? 'It' : 'They'} will be kept for <span className="text-blue-300">30 days</span> in Archive. The original sender's capsule remains intact.
                        </p>
                      </>
                    );
                  } else if (receivedToDelete.length > 0 && ownedToDelete.length > 0) {
                    return (
                      <>
                        <p className="font-semibold text-white">
                          You're about to move to Archive:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-300 mt-2">
                          <li><span className="text-blue-400">{ownedToDelete.length}</span> of your capsule{ownedToDelete.length !== 1 ? 's' : ''}</li>
                          <li><span className="text-orange-400">{receivedToDelete.length}</span> received capsule{receivedToDelete.length !== 1 ? 's' : ''}</li>
                        </ul>
                        <p className="text-xs text-slate-400 mt-2">
                          🌫️ All capsules will be kept for 30 days in Archive before being permanently deleted.
                        </p>
                      </>
                    );
                  } else {
                    return (
                      <>
                        <p className="font-semibold text-white flex items-center gap-2">
                          <span className="text-2xl">🌫️</span>
                          Moving <span className="text-blue-400">{capsulesToDelete.size}</span> capsule{capsulesToDelete.size !== 1 ? 's' : ''} to Archive
                        </p>
                        <p className="text-sm text-slate-400 mt-2">
                          Your capsule{capsulesToDelete.size !== 1 ? 's' : ''} will be stored for <span className="text-blue-300">30 days</span> before being permanently deleted.
                        </p>
                        <p className="text-sm text-slate-400 mt-2">
                          You can restore {capsulesToDelete.size === 1 ? 'it' : 'them'} anytime from <span className="text-blue-300">Archive</span> in the gear menu.
                        </p>
                      </>
                    );
                  }
                })()}
              </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel 
              className={`w-full sm:w-auto shadow-lg ${
                isMobile
                  ? 'bg-slate-800/80 text-white border-slate-600 hover:bg-slate-700'
                  : 'bg-white/20 text-white border-white/40 hover:bg-white/30'
              }`}
              disabled={isDeleting}
              onClick={() => {
                console.log('❌ Delete cancelled by user');
                // Explicitly clear the delete state when cancelling
                setShowDeleteDialog(false);
                setCapsulesToDelete(new Set());
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className={`text-white w-full sm:w-auto font-bold shadow-lg ${
                isMobile
                  ? 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 shadow-blue-500/50'
                  : 'bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 shadow-blue-500/60'
              } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? 'Processing...' : 'Move to Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}