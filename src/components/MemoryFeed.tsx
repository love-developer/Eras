/**
 * Memory Feed Component
 * 
 * The Home tab - shows a unified activity stream of YOUR personal capsule journey:
 * - Capsules received from others
 * - Capsules created by you
 * - Capsules opened/unlocked
 * - Capsules delivered to others
 * - Scheduled capsule reminders
 * - Draft capsules saved
 * - Achievements earned (personal milestones)
 * - Legacy access events (guardians, vaults, access grants)
 * 
 * This is NOT just notifications - it's your complete Eras timeline.
 * 
 * NOTE: Social interactions (echoes, reactions, comments) appear in the Bell notifications only.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Calendar, Heart, Award, Mail, Clock, Sparkles, FolderOpen, ChevronDown, Loader2, Edit, Send, Inbox } from 'lucide-react';
import { DatabaseService } from '../utils/supabase/database';
import { formatDistanceToNow, format } from 'date-fns';
import type { TimeCapsule } from '../utils/supabase/client';
import { useIsMobile } from './ui/use-mobile';
import { toast } from 'sonner@2.0.3';

import { PullToRefresh } from './PullToRefresh';
import { useOfflineSync } from '../hooks/useOfflineSync';

interface MemoryFeedProps {
  user: any;
  onViewCapsule?: (capsule: any) => void;
  onCreateCapsule?: () => void;
  initialViewingCapsuleId?: string | null;
}

interface FeedItem {
  id: string;
  type: 'received' | 'opened' | 'achievement' | 'scheduled' | 'legacy' | 'draft' | 'delivered'; // REMOVED 'created' - drafts are the only "in-progress" state
  timestamp: string;
  data: any;
}

export function MemoryFeed({ user, onViewCapsule, onCreateCapsule, initialViewingCapsuleId }: MemoryFeedProps) {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(100); // Start with 100 items to show all recent activity
  
  // Pagination state for created capsules
  const [hasMoreCreated, setHasMoreCreated] = useState(false);
  const [createdOffset, setCreatedOffset] = useState(0);
  const BATCH_SIZE = 50;

  const isMobile = useIsMobile();
  const { sync: syncOfflineActions } = useOfflineSync();

  // Load all activity from database
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    loadInitialData();
  }, [user?.id]);

  const processCapsulesToFeedItems = (createdCapsules: TimeCapsule[], receivedCapsules: TimeCapsule[]): FeedItem[] => {
    const items: FeedItem[] = [];

    console.log(`📊 [Feed Processing] Processing ${createdCapsules.length} created + ${receivedCapsules.length} received capsules`);

    // Add created capsules
    createdCapsules.forEach((capsule: TimeCapsule) => {
      // CRITICAL: Match Dashboard's exact filtering logic for consistency
      
      // 1. DRAFT DETECTION
      const isDraft = (capsule.status === 'draft') || 
                     (!capsule.delivery_date && capsule.status !== 'delivered' && capsule.status !== 'failed');
      
      // 2. SELF-DELIVERED (show as RECEIVED, not DELIVERED)
      const isSelfDelivered = capsule.status === 'delivered' && capsule.recipient_type === 'self';
      
      // 3. DELIVERED TO OTHERS
      const isDelivered = capsule.status === 'delivered' && capsule.recipient_type !== 'self';
      
      // 4. SCHEDULED DETECTION
      const isScheduled = capsule.delivery_date && 
                         capsule.status !== 'delivered' && 
                         capsule.status !== 'failed' &&
                         capsule.status !== 'draft';
      
      if (isDraft) {
        items.push({
          id: `draft-${capsule.id}`,
          type: 'draft',
          timestamp: capsule.updated_at || capsule.created_at,
          data: capsule
        });
      } else if (isSelfDelivered) {
        // Self-delivered capsules show as RECEIVED (yellow) on the delivery date
        items.push({
          id: `received-${capsule.id}`,
          type: 'received',
          timestamp: capsule.delivery_date || capsule.created_at,
          data: { ...capsule, isReceived: true }
        });
      } else if (isDelivered) {
        items.push({
          id: `delivered-${capsule.id}`,
          type: 'delivered',
          timestamp: capsule.delivery_date || capsule.created_at,
          data: capsule
        });
      } else if (isScheduled) {
        items.push({
          id: `scheduled-${capsule.id}`,
          type: 'scheduled',
          timestamp: capsule.created_at,
          data: capsule
        });
      }

      // If capsule was opened, add an opened item
      if (capsule.opened_at) {
        items.push({
          id: `opened-${capsule.id}`,
          type: 'opened',
          timestamp: capsule.opened_at,
          data: capsule
        });
      }
    });

    // Add received capsules (excluding self-delivered ones that are already processed above)
    // Self-delivered capsules appear in createdCapsules, so we filter them out here to avoid duplicates
    const createdCapsuleIds = new Set(createdCapsules.map(c => c.id));
    
    receivedCapsules.forEach((capsule: TimeCapsule) => {
      // Skip if this capsule was already processed as a self-delivered capsule from createdCapsules
      if (createdCapsuleIds.has(capsule.id)) {
        console.log(`⏭️ [Feed Processing] Skipping duplicate received capsule ${capsule.id} (already processed as self-delivered)`);
        return;
      }
      
      const receivedCapsule = { ...capsule, isReceived: true };
      
      items.push({
        id: `received-${capsule.id}`,
        type: 'received',
        timestamp: capsule.received_at || capsule.delivery_date || capsule.created_at,
        data: receivedCapsule
      });
    });

    return items;
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      console.log('📰 [Memory Feed] Loading activity stream...');

      // Fetch ALL created capsules + ALL received capsules to match Classic/Calendar views
      // This ensures Timeline shows the same data as the other views
      const [createdResult, receivedResult] = await Promise.all([
        DatabaseService.getUserTimeCapsules(user.id).catch(err => {
          console.warn('📰 [Memory Feed] Error fetching created capsules:', err);
          return { capsules: [], total: 0, hasMore: false };
        }),
        DatabaseService.getReceivedCapsules(user.id).catch(err => {
          console.warn('📰 [Memory Feed] Error fetching received capsules:', err);
          return [];
        })
      ]);

      const createdCapsules = Array.isArray(createdResult) 
        ? createdResult 
        : (createdResult?.capsules || []);
      const receivedCapsules = Array.isArray(receivedResult) ? receivedResult : [];

      // Update pagination state
      if (!Array.isArray(createdResult)) {
        setHasMoreCreated(createdResult.hasMore);
        setCreatedOffset(createdCapsules.length);
      }

      console.log('📰 [Memory Feed] Loaded capsules:', {
        created: createdCapsules.length,
        received: receivedCapsules.length,
        hasMoreCreated: !Array.isArray(createdResult) && createdResult.hasMore
      });

      // Transform and Sort
      const items = processCapsulesToFeedItems(createdCapsules, receivedCapsules);
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setFeedItems(items);
    } catch (error) {
      console.error('❌ [Memory Feed] Error loading feed:', error);
      setFeedItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFeedData = loadInitialData;

  const handleLoadMore = async () => {
    try {
      setLoadingMore(true);
      
      // 1. Calculate new limit
      const nextLimit = displayLimit + BATCH_SIZE;
      
      // 2. Check if we need to fetch more data from server to fulfill this limit?
      // Only if we have "hasMoreCreated" AND we are showing nearly all current items
      // (Received items are all fetched, so only Created items need fetching)
      
      let newItems: FeedItem[] = [];
      
      if (hasMoreCreated) {
        console.log(`📰 [Memory Feed] Fetching more created capsules (offset: ${createdOffset})...`);
        
        const createdResult = await DatabaseService.getUserTimeCapsules(user.id, BATCH_SIZE, createdOffset);
        
        if (!Array.isArray(createdResult)) {
          const newCapsules = createdResult.capsules || [];
          
          if (newCapsules.length > 0) {
            // Process ONLY the new capsules
            newItems = processCapsulesToFeedItems(newCapsules, []);
            
            // Update state
            setHasMoreCreated(createdResult.hasMore);
            setCreatedOffset(prev => prev + newCapsules.length);
            
            // Add to feed and re-sort
            setFeedItems(prev => {
              const updated = [...prev, ...newItems];
              return updated.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            });

            // NOTIFY USER ACCURATELY
            toast.success(`Loaded ${newItems.length} earlier memories`);
          } else {
            // No new capsules found despite hasMore being true (rare edge case)
            setHasMoreCreated(false);
            toast.info('No more earlier memories found');
          }
        }
      } else {
         // No more server data to fetch, just showing more locally if available
         // But we check if there are actually more hidden items locally
         if (feedItems.length > displayLimit) {
             // We have local items hidden
             // No toast needed, just expanding view
         } else {
             toast.info('All memories loaded');
         }
      }
      
      // 3. Update display limit
      setDisplayLimit(nextLimit);
      
    } catch (error) {
      console.error('❌ [Memory Feed] Error loading more:', error);
      toast.error('Failed to load more memories');
    } finally {
      setLoadingMore(false);
    }
  };

  // Group items by date - filtered by displayLimit
  const groupedRows = useMemo(() => {
    // 1. Filter visible items first
    const visibleItems = feedItems.slice(0, displayLimit);
    
    // 2. Group visible items by date
    const groups: { [key: string]: FeedItem[] } = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    visibleItems.forEach(item => {
      const itemDate = new Date(item.timestamp);
      itemDate.setHours(0, 0, 0, 0);
      
      let dateKey: string;
      if (itemDate.getTime() === today.getTime()) {
        dateKey = 'Today';
      } else if (itemDate.getTime() === yesterday.getTime()) {
        dateKey = 'Yesterday';
      } else {
        dateKey = format(itemDate, 'MMMM d, yyyy');
      }

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });
    
    const displayedDates = Object.keys(groups);
    const rows: Array<{ dates: string[]; items: { [key: string]: FeedItem[] } }> = [];
    
    // MOBILE: Always show one date per row (vertical stacking)
    if (isMobile) {
      displayedDates.forEach((dateKey) => {
        rows.push({
          dates: [dateKey],
          items: { [dateKey]: groups[dateKey] }
        });
      });
      return rows;
    }
    
    // DESKTOP: Group consecutive single-entry dates side-by-side (up to 3)
    let currentRow: string[] = [];

    displayedDates.forEach((dateKey, index) => {
      const itemCount = groups[dateKey].length;
      
      // If this date has only 1 item, try to group it
      if (itemCount === 1) {
        currentRow.push(dateKey);
        
        // Check if we should flush the row:
        // 1. We've accumulated 3 dates (max per row)
        // 2. This is the last date
        // 3. Next date has multiple items
        const isLastDate = index === displayedDates.length - 1;
        const nextDateHasMultiple = !isLastDate && groups[displayedDates[index + 1]]?.length > 1;
        
        if (currentRow.length === 3 || isLastDate || nextDateHasMultiple) {
          // Flush current row
          const rowItems: { [key: string]: FeedItem[] } = {};
          currentRow.forEach(date => {
            rowItems[date] = groups[date];
          });
          rows.push({ dates: currentRow, items: rowItems });
          currentRow = [];
        }
      } else {
        // Multiple items - flush any pending single-entry row first
        if (currentRow.length > 0) {
          const rowItems: { [key: string]: FeedItem[] } = {};
          currentRow.forEach(date => {
            rowItems[date] = groups[date];
          });
          rows.push({ dates: currentRow, items: rowItems });
          currentRow = [];
        }
        
        // Add this multi-item date as its own row
        rows.push({ 
          dates: [dateKey], 
          items: { [dateKey]: groups[dateKey] } 
        });
      }
    });

    return rows;
  }, [feedItems, displayLimit, isMobile]);

  // For new users with no activity
  if (!loading && feedItems.length === 0) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        {/* Layered Aurora Background - Desktop Only */}
        <div className="absolute inset-0 hidden md:block">
          {/* Layer 1 - Pink/Rose */}
          <motion.div
            className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] rounded-full blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(251, 207, 232, 0.6) 0%, rgba(251, 207, 232, 0.3) 40%, transparent 70%)',
            }}
            animate={{
              x: [0, 150, 0],
              y: [0, -100, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          {/* Layer 2 - Purple */}
          <motion.div
            className="absolute -top-1/4 -right-1/4 w-[900px] h-[900px] rounded-full blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(221, 214, 254, 0.7) 0%, rgba(221, 214, 254, 0.4) 40%, transparent 70%)',
            }}
            animate={{
              x: [0, -120, 0],
              y: [0, 120, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          {/* Layer 3 - Blue */}
          <motion.div
            className="absolute top-1/2 left-1/2 w-[700px] h-[700px] rounded-full blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(219, 234, 254, 0.6) 0%, rgba(219, 234, 254, 0.3) 40%, transparent 70%)',
            }}
            animate={{
              x: [0, 100, 0],
              y: [0, -80, 0],
              scale: [1, 1.25, 1],
            }}
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Dark mode overlay with deep jewel tones */}
          <div className="absolute inset-0 hidden dark:block">
            <motion.div
              className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] rounded-full blur-3xl"
              style={{
                background: 'radial-gradient(circle, rgba(126, 34, 206, 0.25) 0%, rgba(126, 34, 206, 0.15) 40%, transparent 70%)',
              }}
              animate={{
                x: [0, 150, 0],
                y: [0, -100, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute -top-1/4 -right-1/4 w-[900px] h-[900px] rounded-full blur-3xl"
              style={{
                background: 'radial-gradient(circle, rgba(79, 70, 229, 0.3) 0%, rgba(79, 70, 229, 0.18) 40%, transparent 70%)',
              }}
              animate={{
                x: [0, -120, 0],
                y: [0, 120, 0],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 w-[700px] h-[700px] rounded-full blur-3xl"
              style={{
                background: 'radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, rgba(37, 99, 235, 0.12) 40%, transparent 70%)',
              }}
              animate={{
                x: [0, 100, 0],
                y: [0, -80, 0],
                scale: [1, 1.25, 1],
              }}
              transition={{
                duration: 22,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </div>

        {/* Mobile - Soft gradient background (not solid) */}
        <div className="absolute inset-0 md:hidden bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-slate-950 dark:via-purple-950/50 dark:to-indigo-950/50" />

        {/* Content */}
        <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 text-center">
          {/* Icon */}
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-white/10 shadow-xl">
            <Inbox className="w-12 h-12 text-blue-400 dark:text-blue-300" />
          </div>

          {/* Title */}
          <h3 className="text-2xl font-semibold mb-3 bg-gradient-to-br from-slate-700 to-slate-900 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            No capsules yet
          </h3>

          {/* Description */}
          <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
            Create your first time capsule to get started with Eras
          </p>

          {/* Create Button */}
          <div className="flex justify-center">
            <button 
              onClick={onCreateCapsule}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Capsule
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        {/* Layered Aurora Background - Desktop Only */}
        <div className="absolute inset-0 hidden md:block">
          {/* Layer 1 - Pink/Rose */}
          <motion.div
            className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] rounded-full blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(251, 207, 232, 0.6) 0%, rgba(251, 207, 232, 0.3) 40%, transparent 70%)',
            }}
            animate={{
              x: [0, 150, 0],
              y: [0, -100, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          {/* Layer 2 - Purple */}
          <motion.div
            className="absolute -top-1/4 -right-1/4 w-[900px] h-[900px] rounded-full blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(221, 214, 254, 0.7) 0%, rgba(221, 214, 254, 0.4) 40%, transparent 70%)',
            }}
            animate={{
              x: [0, -120, 0],
              y: [0, 120, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          {/* Layer 3 - Blue */}
          <motion.div
            className="absolute top-1/2 left-1/2 w-[700px] h-[700px] rounded-full blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(219, 234, 254, 0.6) 0%, rgba(219, 234, 254, 0.3) 40%, transparent 70%)',
            }}
            animate={{
              x: [0, 100, 0],
              y: [0, -80, 0],
              scale: [1, 1.25, 1],
            }}
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Dark mode overlay with deep jewel tones */}
          <div className="absolute inset-0 hidden dark:block">
            <motion.div
              className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] rounded-full blur-3xl"
              style={{
                background: 'radial-gradient(circle, rgba(126, 34, 206, 0.25) 0%, rgba(126, 34, 206, 0.15) 40%, transparent 70%)',
              }}
              animate={{
                x: [0, 150, 0],
                y: [0, -100, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute -top-1/4 -right-1/4 w-[900px] h-[900px] rounded-full blur-3xl"
              style={{
                background: 'radial-gradient(circle, rgba(79, 70, 229, 0.3) 0%, rgba(79, 70, 229, 0.18) 40%, transparent 70%)',
              }}
              animate={{
                x: [0, -120, 0],
                y: [0, 120, 0],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute top-1/2 left-1/2 w-[700px] h-[700px] rounded-full blur-3xl"
              style={{
                background: 'radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, rgba(37, 99, 235, 0.12) 40%, transparent 70%)',
              }}
              animate={{
                x: [0, 100, 0],
                y: [0, -80, 0],
                scale: [1, 1.25, 1],
              }}
              transition={{
                duration: 22,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </div>

        {/* Mobile - Soft gradient background (not solid) */}
        <div className="absolute inset-0 md:hidden bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-slate-950 dark:via-purple-950/50 dark:to-indigo-950/50" />

        {/* Content */}
        <div className="relative z-10 max-w-2xl mx-auto px-4 py-12 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 dark:text-purple-400" />
            <p className="text-slate-600 dark:text-slate-400">Loading your timeline...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render feed
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Layered Aurora Background - Desktop Only */}
      <div className="absolute inset-0 hidden md:block">
        {/* Layer 1 - Pink/Rose */}
        <motion.div
          className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(251, 207, 232, 0.6) 0%, rgba(251, 207, 232, 0.3) 40%, transparent 70%)',
          }}
          animate={{
            x: [0, 150, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        {/* Layer 2 - Purple */}
        <motion.div
          className="absolute -top-1/4 -right-1/4 w-[900px] h-[900px] rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(221, 214, 254, 0.7) 0%, rgba(221, 214, 254, 0.4) 40%, transparent 70%)',
          }}
          animate={{
            x: [0, -120, 0],
            y: [0, 120, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        {/* Layer 3 - Blue */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-[700px] h-[700px] rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(219, 234, 254, 0.6) 0%, rgba(219, 234, 254, 0.3) 40%, transparent 70%)',
          }}
          animate={{
            x: [0, 100, 0],
            y: [0, -80, 0],
            scale: [1, 1.25, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Dark mode overlay with deep jewel tones */}
        <div className="absolute inset-0 hidden dark:block">
          <motion.div
            className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] rounded-full blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(126, 34, 206, 0.25) 0%, rgba(126, 34, 206, 0.15) 40%, transparent 70%)',
            }}
            animate={{
              x: [0, 150, 0],
              y: [0, -100, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute -top-1/4 -right-1/4 w-[900px] h-[900px] rounded-full blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(79, 70, 229, 0.3) 0%, rgba(79, 70, 229, 0.18) 40%, transparent 70%)',
            }}
            animate={{
              x: [0, -120, 0],
              y: [0, 120, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 w-[700px] h-[700px] rounded-full blur-3xl"
            style={{
              background: 'radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, rgba(37, 99, 235, 0.12) 40%, transparent 70%)',
            }}
            animate={{
              x: [0, 100, 0],
              y: [0, -80, 0],
              scale: [1, 1.25, 1],
            }}
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </div>

      {/* Mobile - Soft gradient background (not solid) */}
      <div className="absolute inset-0 md:hidden bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-slate-950 dark:via-purple-950/50 dark:to-indigo-950/50" />

      {/* Content */}
      <PullToRefresh 
        onRefresh={async () => {
          await loadFeedData();
          syncOfflineActions();
        }}
      >
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Create Button */}
        <div className="max-w-2xl mx-auto">
          <button
            onClick={onCreateCapsule}
            className="w-full p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-2 border-dashed border-purple-300 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
          >
            <div className="flex items-center justify-center gap-3">
              <Plus className="w-6 h-6 text-purple-600 dark:text-purple-400 group-hover:rotate-90 transition-transform duration-300" />
              <span className="font-semibold text-purple-700 dark:text-purple-300">Create New Capsule</span>
            </div>
          </button>
        </div>

        {/* Feed Items - Horizontal Scrolling Sections */}
        <div className="space-y-8">
          {groupedRows.map(row => (
            <HorizontalDateSection 
              key={row.dates.join('-')} 
              dateKeys={row.dates} 
              items={row.items}
              onViewCapsule={onViewCapsule}
            />
          ))}
        </div>

        {/* Load More Button */}
        {(feedItems.length > displayLimit || hasMoreCreated) && (
          <div className="flex justify-center pt-4">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-lg transition-all duration-300 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600 dark:text-purple-400" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Loading...
                  </span>
                </>
              ) : (
                <>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-purple-700 dark:group-hover:text-purple-400">
                    Load Earlier Memories
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
      </PullToRefresh>
    </div>
  );
}

// Horizontal Date Section Component
function HorizontalDateSection({ 
  dateKeys, 
  items, 
  onViewCapsule 
}: { 
  dateKeys: string[]; 
  items: { [key: string]: FeedItem[] }; 
  onViewCapsule?: (capsule: any) => void;
}) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const [expandedDates, setExpandedDates] = React.useState<Set<string>>(new Set());
  const isMobile = useIsMobile();

  const checkScrollButtons = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  React.useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      window.addEventListener('resize', checkScrollButtons);
      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, [items]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    
    const scrollAmount = 320; // card width + gap
    const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
    
    scrollContainerRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  const toggleExpanded = (dateKey: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateKey)) {
        next.delete(dateKey);
      } else {
        next.add(dateKey);
      }
      return next;
    });
  };

  // Track how many items to show per date (expandable incrementally)
  const [visibleCountPerDate, setVisibleCountPerDate] = React.useState<Map<string, number>>(new Map());

  const expandMore = (dateKey: string, totalCount: number) => {
    setVisibleCountPerDate(prev => {
      const next = new Map(prev);
      const current = next.get(dateKey) || 5;
      const remaining = totalCount - current;
      
      // If less than 5 remaining, show all. Otherwise show 5 more
      const newCount = remaining < 5 ? totalCount : current + 5;
      next.set(dateKey, newCount);
      return next;
    });
  };

  const showLess = (dateKey: string) => {
    setVisibleCountPerDate(prev => {
      const next = new Map(prev);
      next.delete(dateKey); // Reset to default (5)
      return next;
    });
  };

  // Calculate total items across all dates in this row
  const totalItems = Object.values(items).reduce((sum, arr) => sum + arr.length, 0);
  const shouldShowScrollArrows = totalItems > 1;
  const isGroupedRow = dateKeys.length > 1;
  
  // Grid layout logic: Use grid for 5+ items, always show first 5, expand incrementally
  const useGridLayout = !isGroupedRow && totalItems >= 5;

  // Diagnostic logging - MORE VERBOSE
  React.useEffect(() => {
    console.log(`🔍 [Timeline Row] dateKeys: ${dateKeys.join(', ')}, totalItems: ${totalItems}, isGroupedRow: ${isGroupedRow}, useGridLayout: ${useGridLayout}`);
    if (!isGroupedRow && totalItems >= 5) {
      console.log(`📊 Grid layout ACTIVATED for ${dateKeys[0]}: ${totalItems} items`);
    } else if (isGroupedRow) {
      console.log(`⏭️ Grouped row - skipping grid for: ${dateKeys.join(', ')}`);
    } else {
      console.log(`⏭️ Not enough items for grid (${totalItems} < 5)`);
    }
  }, [totalItems, isGroupedRow, dateKeys, useGridLayout]);

  return (
    <div className="space-y-4">
      {/* For single date sections with multiple items, show header at top */}
      {!isGroupedRow && (
        <>
          {/* Date Header */}
          <div className="flex items-center justify-center gap-3 px-2">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">{dateKeys[0]}</h3>
              {dateKeys[0] === 'Today' && totalItems > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </span>
              )}
            </div>
          </div>

          {/* Desktop Scroll Arrows - only show if horizontal scroll mode AND more than 1 item */}
          {!useGridLayout && shouldShowScrollArrows && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                  canScrollLeft 
                    ? 'bg-white dark:bg-slate-800 shadow-md hover:shadow-lg text-slate-700 dark:text-slate-300 hover:scale-110' 
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                }`}
                aria-label="Scroll left"
              >
                ←
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                  canScrollRight 
                    ? 'bg-white dark:bg-slate-800 shadow-md hover:shadow-lg text-slate-700 dark:text-slate-300 hover:scale-110' 
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                }`}
                aria-label="Scroll right"
              >
                →
              </button>
            </div>
          )}
        </>
      )}

      {/* GRID LAYOUT for days with many items */}
      {useGridLayout ? (
        <div className="space-y-4">
          {Object.keys(items).flatMap(dateKey => {
            const dateItems = items[dateKey];
            const visibleCount = visibleCountPerDate.get(dateKey) || 5;
            const visibleItems = dateItems.slice(0, visibleCount);
            const remaining = dateItems.length - visibleCount;
            const showingAll = visibleCount >= dateItems.length;
            
            console.log(`🎯 [Grid Button] ${dateKey}: total=${dateItems.length}, visible=${visibleCount}, remaining=${remaining}, showingAll=${showingAll}, shouldShowButton=${!showingAll}`);
            
            return (
              <div key={dateKey} className="space-y-4">
                {/* Grid of capsules */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-6xl mx-auto">
                  {visibleItems.map(item => (
                    <div key={item.id} className="w-full">
                      <FeedItemCard item={item} onViewCapsule={onViewCapsule} />
                    </div>
                  ))}
                </div>
                
                {/* Expand/Collapse Button - WITH EXPLICIT VISIBILITY */}
                {!showingAll && remaining > 0 ? (
                  <div className="flex justify-center py-2">
                    <button
                      onClick={() => expandMore(dateKey, dateItems.length)}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-purple-300 dark:border-purple-600 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg transition-all duration-300 group shadow-md"
                    >
                      <span className="font-bold text-base text-slate-700 dark:text-slate-300 group-hover:text-purple-700 dark:group-hover:text-purple-400">
                        +{remaining} more
                      </span>
                      <ChevronDown className="w-5 h-5 text-purple-600 dark:text-purple-400 transition-transform group-hover:scale-110" />
                    </button>
                  </div>
                ) : visibleCount > 5 && (
                  <div className="flex justify-center py-2">
                    <button
                      onClick={() => showLess(dateKey)}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-purple-300 dark:border-purple-600 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg transition-all duration-300 group shadow-md"
                    >
                      <span className="font-bold text-base text-slate-700 dark:text-slate-300 group-hover:text-purple-700 dark:group-hover:text-purple-400">
                        Show Less
                      </span>
                      <ChevronDown className="w-5 h-5 text-purple-600 dark:text-purple-400 rotate-180 transition-transform group-hover:scale-110" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* HORIZONTAL SCROLL LAYOUT for days with fewer items */
        <div 
          ref={scrollContainerRef}
          className={`
            ${isGroupedRow ? 'flex gap-4 justify-center' : 'flex gap-4 pb-4'}
            ${!isGroupedRow && totalItems === 1 ? 'justify-center' : ''}
            ${!isGroupedRow && totalItems > 1 ? 'overflow-x-auto snap-x snap-mandatory md:justify-center scrollbar-thin scrollbar-thumb-purple-300 dark:scrollbar-thumb-purple-700 scrollbar-track-transparent hover:scrollbar-thumb-purple-400 dark:hover:scrollbar-thumb-purple-600' : ''}
          `}
          style={{
            scrollbarWidth: !isGroupedRow && totalItems > 1 ? 'thin' : 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {isGroupedRow ? (
            // Grouped single-entry dates: show each with its own date label, same spacing as horizontal scroll
            dateKeys.map(dateKey => (
              <div key={dateKey} className="flex flex-col items-center gap-3 w-[85vw] sm:w-[45vw] md:w-[320px] flex-shrink-0">
                {/* Date label above card */}
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {dateKey}
                </h3>
                {/* Single card for this date */}
                <div className="w-full">
                  <FeedItemCard item={items[dateKey][0]} onViewCapsule={onViewCapsule} />
                </div>
              </div>
            ))
          ) : (
            // Standard horizontal scroll for multi-item dates
            Object.keys(items).flatMap(dateKey => 
              items[dateKey].map(item => (
                <div 
                  key={item.id} 
                  className={`
                    flex-shrink-0 snap-start
                    ${totalItems === 1 ? 'w-full max-w-[320px]' : 'w-[85vw] sm:w-[45vw] md:w-[320px]'}
                  `}
                >
                  <FeedItemCard item={item} onViewCapsule={onViewCapsule} />
                </div>
              ))
            )
          )}
        </div>
      )}
    </div>
  );
}

// Individual Feed Item Card
function FeedItemCard({ item, onViewCapsule }: { item: FeedItem; onViewCapsule?: (capsule: any) => void }) {
  // Get activity-specific colors and styling
  const getActivityColors = () => {
    switch (item.type) {
      case 'received':
        return {
          accent: '#eab308', // yellow-500
          accentDark: '#ca8a04', // yellow-600
          pillBg: 'bg-yellow-50 dark:bg-yellow-950/30',
          pillText: 'text-yellow-700 dark:text-yellow-300',
          emoji: '💌'
        };
      case 'opened':
        return {
          accent: '#06b6d4', // cyan-500
          accentDark: '#0891b2', // cyan-600
          pillBg: 'bg-cyan-50 dark:bg-cyan-950/30',
          pillText: 'text-cyan-700 dark:text-cyan-300',
          emoji: '📬'
        };
      case 'delivered':
        return {
          accent: '#10b981', // emerald-500
          accentDark: '#059669', // emerald-600
          pillBg: 'bg-emerald-50 dark:bg-emerald-950/30',
          pillText: 'text-emerald-700 dark:text-emerald-300',
          emoji: '🎁'
        };
      case 'scheduled':
        return {
          accent: '#3b82f6', // blue-500
          accentDark: '#2563eb', // blue-600
          pillBg: 'bg-blue-50 dark:bg-blue-950/30',
          pillText: 'text-blue-700 dark:text-blue-300',
          emoji: '⏰'
        };
      case 'draft':
        return {
          accent: '#ec4899', // pink-500
          accentDark: '#db2777', // pink-600
          pillBg: 'bg-pink-50 dark:bg-pink-950/30',
          pillText: 'text-pink-700 dark:text-pink-300',
          emoji: '📝'
        };
      case 'achievement':
        return {
          accent: '#6366f1', // indigo-500
          accentDark: '#4f46e5', // indigo-600
          pillBg: 'bg-indigo-50 dark:bg-indigo-950/30',
          pillText: 'text-indigo-700 dark:text-indigo-300',
          emoji: '🏆'
        };
      default:
        return {
          accent: '#64748b', // slate-500
          accentDark: '#475569', // slate-600
          pillBg: 'bg-slate-50 dark:bg-slate-950/30',
          pillText: 'text-slate-700 dark:text-slate-300',
          emoji: '📋'
        };
    }
  };

  const getActivityLabel = () => {
    const capsule = item.data;
    switch (item.type) {
      case 'received':
        return capsule.sender_name ? `FROM ${capsule.sender_name.toUpperCase()}` : 'RECEIVED';
      case 'opened':
        return 'OPENED';
      case 'scheduled':
        // Show recipient names for scheduled capsules
        // Use recipient_names if available (from backend lookup), otherwise fallback to recipients array
        const scheduledNames = capsule.recipient_names && capsule.recipient_names.length > 0
          ? capsule.recipient_names
          : (capsule.recipients || []).map((r: any) => {
              if (typeof r === 'string') return r;
              if (typeof r === 'object' && r !== null) {
                return r.name || r.email || r.phone || r.contact || r.value || r.address || 'Unknown';
              }
              return 'Unknown';
            });
        
        if (scheduledNames.length === 0) {
          return 'SCHEDULED';
        }
        
        // Multi-line display: First recipient, then each additional one on a new line with &
        return (
          <div className="flex flex-col">
            <div>TO {scheduledNames[0].toUpperCase()}</div>
            {scheduledNames.slice(1, 3).map((name: string, i: number) => (
              <div key={i}>& {name.toUpperCase()}</div>
            ))}
            {scheduledNames.length > 3 && (
              <div>& +{scheduledNames.length - 3} MORE</div>
            )}
          </div>
        );
      case 'draft':
        return 'DRAFT';
      case 'delivered':
        // Show recipient names for delivered capsules
        // Use recipient_names if available (from backend lookup), otherwise fallback to recipients array
        const deliveredNames = capsule.recipient_names && capsule.recipient_names.length > 0
          ? capsule.recipient_names
          : (capsule.recipients || []).map((r: any) => {
              if (typeof r === 'string') return r;
              if (typeof r === 'object' && r !== null) {
                return r.name || r.email || r.phone || r.contact || r.value || r.address || 'Unknown';
              }
              return 'Unknown';
            });
        
        if (deliveredNames.length === 0) {
          return 'DELIVERED';
        }
        
        // Multi-line display: First recipient, then each additional one on a new line with &
        return (
          <div className="flex flex-col">
            <div>TO {deliveredNames[0].toUpperCase()}</div>
            {deliveredNames.slice(1, 3).map((name: string, i: number) => (
              <div key={i}>& {name.toUpperCase()}</div>
            ))}
            {deliveredNames.length > 3 && (
              <div>& +{deliveredNames.length - 3} MORE</div>
            )}
          </div>
        );
      case 'achievement':
        return 'ACHIEVEMENT';
      default:
        return 'ACTIVITY';
    }
  };

  const getCapsuleTitle = () => {
    return item.data.title || 'Untitled Capsule';
  };

  const getAttachmentBadges = () => {
    const capsule = item.data;
    const attachments = capsule.attachments || [];
    const photoCount = attachments.filter((a: any) => a.type === 'photo').length;
    const videoCount = attachments.filter((a: any) => a.type === 'video').length;
    const audioCount = attachments.filter((a: any) => a.type === 'audio').length;

    const badges = [];
    if (photoCount > 0) badges.push({ icon: '📸', text: photoCount.toString() });
    if (videoCount > 0) badges.push({ icon: '🎥', text: videoCount.toString() });
    if (audioCount > 0) badges.push({ icon: '🎵', text: audioCount.toString() });
    
    return badges;
  };

  const handleClick = () => {
    if (onViewCapsule && item.data) {
      console.log('🖱️ Memory card clicked:', {
        type: item.type,
        capsuleId: item.data.id,
        capsuleTitle: item.data.title,
        isReceived: item.data.isReceived,
        hasData: !!item.data
      });
      onViewCapsule(item.data);
    }
  };

  const colors = getActivityColors();
  
  // Calculate rotation based on item index (alternating tilt)
  const itemIndex = parseInt(item.id.split('-')[1] || '0', 10);
  const tiltDirection = itemIndex % 2 === 0 ? -1 : 1;
  const tiltDegrees = tiltDirection * 0.8; // Subtle alternating tilt for scrapbook feel

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
      style={{
        transform: `rotate(${tiltDegrees}deg)`,
      }}
    >
      <button
        onClick={handleClick}
        aria-label={`View capsule: ${getCapsuleTitle()}`}
        className="
          w-full h-full p-5 rounded-2xl
          bg-white dark:bg-slate-800
          shadow-lg hover:shadow-2xl
          transition-all duration-300 
          cursor-pointer
          group 
          text-left
          touch-manipulation
          relative
          overflow-hidden
        "
        style={{
          borderLeft: `4px solid ${colors.accent}`,
          transform: 'rotate(0deg)', // Counter base rotation on hover
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = `rotate(${-tiltDegrees * 0.3}deg) translateY(-4px) scale(1.02)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'rotate(0deg)';
        }}
      >
        {/* Content */}
        <div className="space-y-3">
          {/* Header: Emoji Icon + Activity Label */}
          <div className="flex flex-col gap-2">
            {/* Row 1: Icon + Title (always together on one line) */}
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-2xl shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12 flex-shrink-0"
                style={{ backgroundColor: colors.accent }}
              >
                {colors.emoji}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug" style={{ wordBreak: 'normal', overflowWrap: 'normal', hyphens: 'none' }}>
                {getCapsuleTitle()}
              </h3>
            </div>
            {/* Row 2: Activity Label (below icon/title) */}
            <div 
              className="text-xs font-bold tracking-wide"
              style={{ color: colors.accent }}
            >
              {getActivityLabel()}
            </div>
          </div>

          {/* Attachment Badges */}
          {getAttachmentBadges().length > 0 && (
            <div className="flex flex-wrap gap-2">
              {getAttachmentBadges().map((badge, i) => (
                <span 
                  key={i}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${colors.pillBg} ${colors.pillText}`}
                >
                  <span className="text-base">{badge.icon}</span>
                  {badge.text}
                </span>
              ))}
            </div>
          )}

          {/* Timestamp - Centered at bottom for all devices */}
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center pt-1">
            {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
          </p>
        </div>
      </button>
    </motion.div>
  );
}