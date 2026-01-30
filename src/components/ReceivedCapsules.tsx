import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Search, Calendar, Clock, User, X, Star, StarOff, RefreshCw,
  CheckCircle, AlertCircle, Inbox, Sparkles, ArrowRight
} from 'lucide-react';
import { format, formatDistanceToNow, isAfter, startOfDay } from 'date-fns';
import { toast } from 'sonner';
import { DatabaseService } from '../utils/supabase/database';
import { supabase } from '../utils/supabase/client';
import { MediaPreviewModal } from './MediaPreviewModal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
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
import { CapsuleCard } from './CapsuleCard';
import { CapsuleGridSkeleton } from './CapsuleGridSkeleton';
import { CosmicEmptyState } from './CosmicEmptyState';
import { CapsuleDetailModal } from './CapsuleDetailModal';
import { MobileReceivedSearchBar } from './MobileReceivedSearchBar';

// PHASE 1A+ & 1B COMPLETE ENHANCEMENT - Cosmic Card Grid Layout
export function ReceivedCapsules({ onCountChange }) {
  const [receivedCapsules, setReceivedCapsules] = useState([]);
  const [filteredCapsules, setFilteredCapsules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [viewingCapsule, setViewingCapsule] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [selectedCapsules, setSelectedCapsules] = useState(new Set());
  const [previewMedia, setPreviewMedia] = useState(null);
  const [showMediaPreview, setShowMediaPreview] = useState(false);
  const [expandedMediaCapsules, setExpandedMediaCapsules] = useState(new Set());
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [capsuleToRemove, setCapsuleToRemove] = useState(null);
  const [displayLimit, setDisplayLimit] = useState(10); // Pagination: Show 10 initially
  
  // CRITICAL: Reset displayLimit when filters change
  useEffect(() => {
    setDisplayLimit(10);
  }, [searchQuery, selectedFilter]);

  // Mark received capsules as viewed when opened
  useEffect(() => {
    if (viewingCapsule && viewingCapsule.isReceived && !viewingCapsule.viewed_at) {
      // Mark capsule as viewed to remove NEW badge
      const markAsViewed = async () => {
        try {
          const success = await DatabaseService.markCapsuleAsViewed(viewingCapsule.id);
          
          if (!success) {
            return;
          }
          
          // CRITICAL FIX: Fetch the capsule from backend to get the EXACT timestamp the backend set
          // This prevents timestamp mismatch between frontend and backend
          const updatedCapsule = await DatabaseService.getTimeCapsule(viewingCapsule.id);
          
          if (!updatedCapsule || !updatedCapsule.viewed_at) {
            return;
          }
          
          const viewedTimestamp = updatedCapsule.viewed_at;
          
          // CRITICAL: Update the capsule in ALL relevant state arrays for real-time UI update
          
          // 1. Update the viewing capsule itself
          setViewingCapsule(prev => {
            if (!prev) return prev;
            return { ...prev, viewed_at: viewedTimestamp };
          });
          
          // 2. Update in receivedCapsules array
          setReceivedCapsules(prev => {
            const updated = prev.map(c => 
              c.id === viewingCapsule.id 
                ? { ...c, viewed_at: viewedTimestamp }
                : c
            );
            return updated;
          });
          
          // 3. Update in filteredCapsules array (for display)
          setFilteredCapsules(prev => {
            const updated = prev.map(c => 
              c.id === viewingCapsule.id 
                ? { ...c, viewed_at: viewedTimestamp }
                : c
            );
            return updated;
          });
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ Failed to mark capsule as viewed:', error);
          }
        }
      };
      
      markAsViewed();
    }
  }, [viewingCapsule]);

  // Fetch received capsules
  const fetchReceivedCapsules = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be signed in to view received capsules');
        return;
      }

      // Get user's email and phone for matching
      const profile = await DatabaseService.getUserProfile(user.id);
      const userEmail = profile?.email || user.email;
      const userPhone = profile?.phone;

      // Fetch capsules where this user is the recipient
      const capsules = await DatabaseService.getReceivedCapsules(user.id, userEmail, userPhone);
      
      // Mark all as received AND override status to 'received' for proper Gold/Yellow color
      const capsulesWithFlag = capsules.map(c => ({ 
        ...c, 
        isReceived: true,
        status: 'received'  // Override status for Gold/Yellow gradient
      }));
      
      setReceivedCapsules(capsulesWithFlag);
      setFilteredCapsules(capsulesWithFlag);
      
      // Notify parent of count change
      if (onCountChange) {
        onCountChange();
      }
      
      // Load favorites from localStorage
      const storedFavorites = localStorage.getItem(`favorites_${user.id}`);
      if (storedFavorites) {
        setFavorites(new Set(JSON.parse(storedFavorites)));
      }

    } catch (error) {
      console.error('Error fetching received capsules:', error);
      toast.error('Failed to load received capsules');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReceivedCapsules();
  }, []);

  // Real-time WebSocket listener for new received capsules
  useEffect(() => {
    let channel = null;
    
    const setupRealtimeListener = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      console.log(`📡 [ReceivedCapsules] Setting up real-time listener for user: ${user.id}`);
      
      channel = supabase.channel(`received_capsules:${user.id}`);
      
      channel.on('broadcast', { event: 'new_received_capsule' }, (payload) => {
        // Refresh capsules list to show the new capsule
        fetchReceivedCapsules();
        
        // Show toast notification
        const senderName = payload.payload?.senderName || 'Someone';
        const capsuleTitle = payload.payload?.title || 'a capsule';
        toast.success(`${senderName} sent you "${capsuleTitle}"!`, {
          description: 'Check your Received Capsules',
          duration: 5000
        });
      });
      
      channel.subscribe();
    };
    
    setupRealtimeListener();
    
    return () => {
      if (channel) {
        console.log('📡 [ReceivedCapsules] Cleaning up real-time listener');
        supabase.removeChannel(channel);
      }
    };
  }, []);
  
  // Filter and search functionality
  useEffect(() => {
    let filtered = [...receivedCapsules];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(capsule => 
        capsule.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        capsule.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        capsule.text_message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        capsule.sender_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    switch (selectedFilter) {
      case 'delivered':
        filtered = filtered.filter(capsule => capsule.status === 'delivered');
        break;
      case 'scheduled':
        filtered = filtered.filter(capsule => capsule.status === 'scheduled');
        break;
      case 'favorites':
        filtered = filtered.filter(capsule => favorites.has(capsule.id));
        break;
      case 'with_media':
        filtered = filtered.filter(capsule => capsule.media_files?.length > 0);
        break;
      case 'this_week':
        const weekStart = startOfDay(new Date());
        weekStart.setDate(weekStart.getDate() - 7);
        filtered = filtered.filter(capsule => 
          isAfter(new Date(capsule.delivery_date), weekStart)
        );
        break;
    }

    // Sort by delivery date (most recent first)
    filtered.sort((a, b) => {
      const aDate = new Date(a.delivery_date);
      const bDate = new Date(b.delivery_date);
      return bDate.getTime() - aDate.getTime();
    });

    setFilteredCapsules(filtered);
  }, [receivedCapsules, searchQuery, selectedFilter, favorites]);

  // Toggle favorite
  const toggleFavorite = async (capsuleId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newFavorites = new Set(favorites);
    if (newFavorites.has(capsuleId)) {
      newFavorites.delete(capsuleId);
      toast.success('Removed from favorites');
    } else {
      newFavorites.add(capsuleId);
      toast.success('Added to favorites');
    }
    
    setFavorites(newFavorites);
    localStorage.setItem(`favorites_${user.id}`, JSON.stringify([...newFavorites]));
  };

  // Toggle selection
  const toggleSelectCapsule = (id) => {
    const newSelected = new Set(selectedCapsules);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCapsules(newSelected);
  };

  // Handle remove capsule (show confirmation dialog)
  const handleRemoveCapsule = async (capsuleId) => {
    setCapsuleToRemove(capsuleId);
    setShowRemoveDialog(true);
  };

  // Confirm remove - actually archives the capsule
  const confirmRemove = async () => {
    if (!capsuleToRemove) return;

    try {
      setShowRemoveDialog(false);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be signed in');
        return;
      }

      toast.loading('Archiving capsule...', { id: 'remove-capsule' });

      // Archive the received capsule (move to Archived Received list)
      await DatabaseService.archiveReceivedCapsule(capsuleToRemove);

      // Update UI optimistically
      setReceivedCapsules(prev => prev.filter(c => c.id !== capsuleToRemove));
      setFilteredCapsules(prev => prev.filter(c => c.id !== capsuleToRemove));

      // Notify parent of count change
      if (onCountChange) {
        onCountChange();
      }

      toast.dismiss('remove-capsule');
      toast.success('Capsule moved to Archive');

      setCapsuleToRemove(null);
    } catch (error) {
      console.error('Error removing capsule:', error);
      toast.dismiss('remove-capsule');
      toast.error('Failed to remove capsule');
      
      // Refresh to get accurate state
      await fetchReceivedCapsules();
    }
  };

  // Bulk delete
  const bulkDeleteCapsules = async () => {
    if (selectedCapsules.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to move ${selectedCapsules.size} capsule${selectedCapsules.size > 1 ? 's' : ''} to the Archive?`
    );
    if (!confirmed) return;

    try {
      const capsuleIdsToDelete = Array.from(selectedCapsules);
      
      console.log(`🗑️ Starting archive of ${capsuleIdsToDelete.length} received capsules...`);
      toast.loading(`Archiving ${capsuleIdsToDelete.length} capsules...`, { id: 'bulk-archive' });

      for (const capsuleId of capsuleIdsToDelete) {
        try {
          await DatabaseService.archiveReceivedCapsule(capsuleId);
          console.log(`✅ Archived capsule: ${capsuleId}`);
        } catch (error) {
          console.error(`❌ Failed to archive capsule ${capsuleId}:`, error);
        }
      }

      toast.dismiss('bulk-archive');
      toast.success(`${capsuleIdsToDelete.length} capsule${capsuleIdsToDelete.length > 1 ? 's' : ''} moved to Archive`);
      setSelectedCapsules(new Set());
      
      // Refresh the list
      await fetchReceivedCapsules();
    } catch (error) {
      console.error('Error archiving capsules:', error);
      toast.dismiss('bulk-archive');
      toast.error('Failed to archive capsules');
    }
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedFilter('all');
  };

  // Get status display for capsule - RECEIVED CAPSULES HAVE SPECIAL "RECEIVED" STATUS
  const getStatusDisplay = (status) => {
    // ALL received capsules get the GOLD/YELLOW "Received" status (valuable treasure!)
    // Note: parameter is 'status' string to match CapsuleCard's usage pattern
    return {
      color: 'bg-yellow-500',  // Gold/yellow for received capsules
      icon: CheckCircle,
      label: 'Received'
    };
  };

  // Format relative delivery time
  const formatRelativeDeliveryTime = (deliveryDate, deliveryTime, timeZone, status) => {
    if (!deliveryDate) return null;

    try {
      const date = new Date(deliveryDate);
      if (isNaN(date.getTime())) return null;

      // Received capsules should show "X ago" format (when they were received)
      if (status === 'delivered' || status === 'received') {
        return formatDistanceToNow(date, { addSuffix: true });
      }

      // For scheduled capsules, show time remaining
      const now = new Date();
      const diffMs = date.getTime() - now.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (diffDays > 0) {
        return `In ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
      } else if (diffHours > 0) {
        return `In ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
      } else if (diffMinutes > 0) {
        return `In ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
      } else {
        return 'Soon';
      }
    } catch (error) {
      console.error('Error formatting delivery time:', error);
      return null;
    }
  };

  // Get recipient info (not used for received, but needed for CapsuleCard)
  const getRecipientInfo = (capsule) => {
    return {
      icon: <User className="w-3.5 h-3.5" />,
      display: capsule.sender_name || 'Unknown Sender',
      allRecipients: []
    };
  };

  // Loading state - Cosmic card grid skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Filter Controls Skeleton */}
        <Card className="bg-slate-800/60 border-slate-700/50 shadow-xl">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 h-9 bg-slate-700/50 rounded-lg animate-pulse" />
              <div className="w-full sm:w-[180px] h-9 bg-slate-700/50 rounded-lg animate-pulse" />
              <div className="w-full sm:w-[100px] h-9 bg-slate-700/50 rounded-lg animate-pulse" />
            </div>
          </CardContent>
        </Card>

        {/* Capsule Grid Skeleton */}
        <CapsuleGridSkeleton count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* NEW MOBILE SEARCH - MATCHES DASHBOARD EXACTLY */}
      <MobileReceivedSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        hasActiveFilters={!!(searchQuery || selectedFilter !== 'all')}
        onClearFilters={clearFilters}
        onRefresh={fetchReceivedCapsules}
        placeholder="Search received capsules..."
      />

      {/* DESKTOP SEARCH - Keep original desktop implementation */}
      <Card className="hidden md:block bg-slate-800/60 border-slate-700/50 shadow-xl">
        <CardContent className="p-2">
          <div className="flex items-center gap-2 h-9 flex-wrap sm:flex-nowrap">
            <div className="flex-1 relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none z-10" />
              <Input
                placeholder="Search received capsules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-10 pr-3 bg-slate-900/50 border-slate-700/50"
              />
            </div>
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-[110px] h-9 bg-slate-900/50 border-slate-700/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="favorites">⭐ Favorites</SelectItem>
                <SelectItem value="with_media">📷 Media</SelectItem>
                <SelectItem value="this_week">📅 Week</SelectItem>
              </SelectContent>
            </Select>
            {(searchQuery || selectedFilter !== 'all') && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={clearFilters}
                className="h-9 w-9 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchReceivedCapsules}
              className="h-9 w-9 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredCapsules.length === 0 && !isLoading && (
        <CosmicEmptyState
          icon={Inbox}
          title={searchQuery || selectedFilter !== 'all' 
            ? 'No capsules match your filters' 
            : 'No capsules received yet'}
          description={searchQuery || selectedFilter !== 'all'
            ? 'Try adjusting your search or filter settings'
            : 'When others send you time capsules, they\'ll appear here'}
          action={
            (searchQuery || selectedFilter !== 'all') ? (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="mt-4"
              >
                Clear Filters
              </Button>
            ) : null
          }
        />
      )}

      {/* Capsules Grid - Cosmic Card Layout */}
      {!isLoading && filteredCapsules.length > 0 && (
        <div 
          data-capsule-grid 
          className="grid gap-2 grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full overflow-hidden"
        >
          {filteredCapsules.slice(0, displayLimit).map(capsule => {
            const isSelected = selectedCapsules.has(capsule.id);
            
            return (
              <CapsuleCard 
                key={`received-${capsule.id}`}
                capsule={capsule}
                isSelected={isSelected}
                onToggleSelect={() => toggleSelectCapsule(capsule.id)}
                onClick={() => setViewingCapsule(capsule)}
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
                onMediaClick={(media) => {
                  setPreviewMedia(media);
                  setShowMediaPreview(true);
                }}
                onEditDetails={null}
                onEditCapsule={null}
                onDelete={handleRemoveCapsule}
                canEditCapsule={() => false}
                onFavoriteToggle={() => toggleFavorite(capsule.id)}
                isFavorite={favorites.has(capsule.id)}
                currentFolder="received"
              />
            );
          })}
        </div>
      )}

      {/* Load More Button - Show when there are more capsules to display */}
      {!isLoading && filteredCapsules.length > 10 && filteredCapsules.length > displayLimit && (
        <div className="flex justify-center py-6">
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              setDisplayLimit(prev => prev + 10);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Load More ({Math.min(10, filteredCapsules.length - displayLimit)} of {filteredCapsules.length - displayLimit} remaining)
          </Button>
        </div>
      )}

      {/* Capsule Portal Viewer - Cinematic Experience */}
      <CapsuleDetailModal
        capsule={viewingCapsule}
        isOpen={!!viewingCapsule}
        onClose={() => setViewingCapsule(null)}
        onMediaClick={(media, index, allMedia) => {
          setPreviewMedia(media);
          setShowMediaPreview(true);
        }}
        canEdit={false}
        onEchoSent={async () => {
          // FIXED: Don't re-fetch entire capsule list which causes opening animation to replay
          // Just refresh the echo data in the background without touching viewingCapsule
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            
            // Refresh the capsule list in background for next time user opens dashboard
            // But DON'T update viewingCapsule - keep it stable so animation doesn't replay
            await fetchReceivedCapsules();
            
            // DO NOT call setViewingCapsule() - this would cause the modal to re-render
            // and trigger the opening animation again. The EchoSocialTimeline component
            // will automatically refresh via its polling mechanism.
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Failed to refresh capsule data after echo in ReceivedCapsules:', error);
            }
          }
        }}
      />

      {/* Media Preview Modal */}
      {showMediaPreview && previewMedia && (
        <MediaPreviewModal
          isOpen={showMediaPreview}
          onClose={() => {
            setShowMediaPreview(false);
            setPreviewMedia(null);
          }}
          mediaFile={{
            id: previewMedia.id || 'preview',
            file_name: previewMedia.filename || previewMedia.file_name || 'Media Preview',
            file_type: previewMedia.type || previewMedia.file_type || '',
            file_size: previewMedia.size || previewMedia.file_size || 0,
            url: previewMedia.url || '',
            created_at: previewMedia.created_at || new Date().toISOString()
          }}
        />
      )}

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Archive Capsule</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Are you sure you want to move this capsule to the Archive? You can restore it later from the Settings menu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowRemoveDialog(false);
                setCapsuleToRemove(null);
              }}
              className="bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-600"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}