import React, { useEffect, useState } from 'react';
import { useAchievements } from '../hooks/useAchievements';
import { useAuth } from '../contexts/AuthContext';
import { useTitles } from '../contexts/TitlesContext';
import { AchievementUnlockModal } from './AchievementUnlockModal';
import { TitleRewardModalEnhanced } from './TitleRewardModalEnhanced';

interface AchievementUnlockManagerProps {
  onNavigateToAchievements?: () => void;
  onNavigateToTitles?: () => void;
}

/**
 * Global Achievement Unlock Manager
 * Handles the display of achievement unlock modals and notifications
 * Place this component at the root level of your app (e.g., in App.tsx)
 */
export function AchievementUnlockManager({ onNavigateToAchievements, onNavigateToTitles }: AchievementUnlockManagerProps) {
  const { session } = useAuth();
  const { refresh: refreshTitles } = useTitles();
  const {
    showUnlockModal,
    currentUnlock,
    closeUnlockModal,
    checkPendingNotifications,
    checkQueuedAchievements,
    definitions
  } = useAchievements();

  // State for title reward modal
  const [showTitleModal, setShowTitleModal] = useState(false);
  const [titleQueue, setTitleQueue] = useState<Array<{ 
    title: string; 
    rarity: string; 
    achievementName: string;
  }>>([]);
  const [currentTitle, setCurrentTitle] = useState<{ 
    title: string; 
    rarity: string;
    achievementName: string;
  } | null>(null);

  // Check for pending notifications on mount and when definitions load
  useEffect(() => {
    if (session?.access_token && Object.keys(definitions).length > 0) {
      checkPendingNotifications(session.access_token);
    }
  }, [session, definitions, checkPendingNotifications]);

  // 🎯 Check queued achievements when window gains focus (user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      console.log('🔍 [Achievement] Window focused - checking for queued achievements');
      checkQueuedAchievements();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkQueuedAchievements]);

  // 🎯 Check queued achievements on visibility change (tab becomes visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔍 [Achievement] Tab became visible - checking for queued achievements');
        checkQueuedAchievements();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkQueuedAchievements]);

  // 🔄 Poll for pending achievements every 5 seconds
  // This ensures achievements are shown even if they're unlocked server-side
  useEffect(() => {
    if (!session?.access_token || Object.keys(definitions).length === 0) {
      // Silently wait for session and definitions
      return;
    }

    console.log('▶️ [Achievement Polling] Active (checks every 5s)');
    
    // Wait 2 seconds before first check to allow server cold start
    const startupTimeout = setTimeout(() => {
      checkPendingNotifications(session.access_token);
    }, 2000);

    // Then poll every 5 seconds
    const pollInterval = setInterval(() => {
      if (session?.access_token && Object.keys(definitions).length > 0) {
        checkPendingNotifications(session.access_token);
      }
    }, 5000);

    return () => {
      console.log('⏹️ [Achievement Polling] Stopped');
      clearTimeout(startupTimeout);
      clearInterval(pollInterval);
    };
  }, [session, definitions, checkPendingNotifications]);

  // 🎯 EVENT-DRIVEN TITLE UNLOCK SEQUENCE
  // Listen for Achievement Modal close event, then trigger Title Unlock after 2s delay
  useEffect(() => {
    // 🔒 Track event IDs to prevent duplicate processing
    const processedEventIds = new Set<string>();
    
    const handleAchievementClosed = async (event: CustomEvent) => {
      console.log('🎯 [Title Sequence] achievementClosed event received:', event.detail);
      
      const { title, rarity, achievementName, achievement, timestamp } = event.detail;
      
      // 🔒 BULLETPROOF CHECK: Prevent duplicate event processing
      const eventId = `${achievement}_${timestamp}`;
      if (processedEventIds.has(eventId)) {
        console.log('⏭️ [Title Sequence] Event already processed, ignoring duplicate:', eventId);
        return;
      }
      processedEventIds.add(eventId);
      
      // Only proceed if there's a title reward
      if (!title) {
        console.log('⚠️ [Title Sequence] No title reward for this achievement, skipping.');
        return;
      }
      
      console.log('✅ [Title Sequence] Title reward detected:', title);
      console.log('⏳ [Title Sequence] Waiting 2s for visual breathing space...');
      
      // CRITICAL: Double-check no modals are overlapping
      // Close any lingering modals to ensure clean state
      setShowTitleModal(false);
      setCurrentTitle(null);
      
      // Safety buffer - visual breathing space (1000ms for smooth transition)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🎬 [Title Sequence] Triggering Title Unlock Modal for:', title);
      
      // Add to queue (will be processed by queue effect)
      setTitleQueue(prev => [...prev, { title, rarity, achievementName }]);
    };
    
    // Bind event listener
    window.addEventListener('achievementClosed', handleAchievementClosed as EventListener);
    console.log('👂 [Title Sequence] Event listener registered for achievementClosed');
    
    // Cleanup: Remove listener on unmount
    return () => {
      window.removeEventListener('achievementClosed', handleAchievementClosed as EventListener);
      console.log('🧹 [Title Sequence] Event listener cleaned up');
    };
  }, []); // Empty deps - listener stays constant

  // Process title queue - show next title when modal closes
  useEffect(() => {
    if (!showTitleModal && titleQueue.length > 0) {
      console.log('👑 [Title Queue] Processing queue, titles remaining:', titleQueue.length);
      
      // Show next title immediately (delay already handled in event listener)
      const nextTitle = titleQueue[0];
      setCurrentTitle(nextTitle);
      setShowTitleModal(true);
      setTitleQueue(prev => prev.slice(1)); // Remove from queue
      console.log('👑 [Title Queue] Showing title:', nextTitle.title);
    }
  }, [showTitleModal, titleQueue]);

  const closeTitleModal = () => {
    console.log('👑 [Title Reward Manager] Closing title modal');
    setShowTitleModal(false);
    setCurrentTitle(null);
    
    // 🔄 CRITICAL: Refresh titles immediately so new horizon is available in Horizon Gallery
    console.log('🔄 [Title Reward Manager] Refreshing titles for immediate horizon availability');
    refreshTitles();
    
    // After 2s delay, check if there are more titles in queue
    setTimeout(() => {
      if (titleQueue.length > 0) {
        console.log('👑 [Title Reward Manager] More titles in queue, showing next...');
      }
    }, 1000);
  };

  // Wrap closeUnlockModal to pass access token
  const handleCloseAchievementModal = () => {
    console.log('🔒 [Achievement Manager] Closing achievement modal with access token');
    closeUnlockModal(session?.access_token);
  };

  return (
    <>
      <AchievementUnlockModal
        achievement={currentUnlock}
        isOpen={showUnlockModal}
        onClose={handleCloseAchievementModal}
        onViewAll={onNavigateToAchievements}
      />
      
      {currentTitle && (
        <TitleRewardModalEnhanced
          title={currentTitle.title}
          rarity={currentTitle.rarity as 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'}
          achievementName={currentTitle.achievementName}
          isOpen={showTitleModal}
          onClose={closeTitleModal}
          onViewTitles={onNavigateToTitles}
        />
      )}
    </>
  );
}