import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import confetti from 'canvas-confetti';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  detailedDescription: string;
  category: 'starter' | 'era_themed' | 'time_based' | 'volume' | 'special' | 'enhance';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  icon: string;
  unlockCriteria: any;
  rewards: {
    points: number;
    title?: string;
  };
  visual: {
    gradientStart: string;
    gradientEnd: string;
    particleColor: string;
    glowColor: string;
    animation?: string;
  };
  eraTheme?: string;
  shareText: string;
  hidden: boolean;
  order: number;
}

export interface UserStats {
  capsules_created: number;
  capsules_sent: number;
  capsules_received: number;
  media_uploaded: number;
  filter_usage: Record<string, number>;
  enhancements_used: number;
  current_streak: number;
  achievement_count: number;
  achievement_points: number;
  [key: string]: any;
}

/**
 * Detects if the current UI context is restricted (camera, recording, etc.)
 * where showing a modal overlay would be disruptive
 */
function isRestrictedContext(): boolean {
  // Check if camera is active (explicit marker)
  if (document.querySelector('[data-camera-active="true"]')) {
    console.log('🚫 [Achievement] Restricted context detected: Camera is active');
    return true;
  }
  
  // Check if camera is active (video element with autoplay)
  if (document.querySelector('video[autoplay]')) {
    console.log('🚫 [Achievement] Restricted context detected: Video autoplay active');
    return true;
  }
  
  // Check if user is recording
  if (document.querySelector('[data-recording="true"]')) {
    console.log('🚫 [Achievement] Restricted context detected: Recording in progress');
    return true;
  }
  
  // Check if enhancement overlay is open (full-screen media editing)
  if (document.querySelector('[data-enhancement-overlay="true"]')) {
    console.log('🚫 [Achievement] Restricted context detected: Enhancement overlay open');
    return true;
  }
  
  // Check if upload is in progress (look for progress indicators)
  if (document.querySelector('[data-uploading="true"]')) {
    console.log('🚫 [Achievement] Restricted context detected: Upload in progress');
    return true;
  }
  
  return false;
}

export function useAchievements() {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [definitions, setDefinitions] = useState<Record<string, Achievement>>({});
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDefinitions, setLoadingDefinitions] = useState(true);
  const [loadingAchievements, setLoadingAchievements] = useState(false);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [currentUnlock, setCurrentUnlock] = useState<Achievement | null>(null);
  const unlockQueueRef = useRef<Achievement[]>([]);
  const queuedForRestrictedContextRef = useRef<Achievement[]>([]); // Separate queue for restricted contexts
  const shownAchievementsRef = useRef<Set<string>>(new Set()); // Track achievements already shown to prevent duplicates
  const isClosingRef = useRef<boolean>(false); // Prevent multiple close calls
  
  // 🔒 BULLETPROOF SESSION LOCK - Prevents replays across re-renders
  useEffect(() => {
    // Initialize global flags if not present
    if (typeof window !== 'undefined') {
      if (!(window as any).__erasAchievementShownIds) {
        (window as any).__erasAchievementShownIds = new Set<string>();
      }
    }
  }, []);

  // Fetch achievement definitions (static data, cached)
  const fetchDefinitions = useCallback(async () => {
    console.log('🏆 Fetching achievement definitions...');
    setLoadingDefinitions(true);
    
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/achievements/definitions`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Achievement definitions loaded:', Object.keys(data.definitions || {}).length);
        setDefinitions(data.definitions || {});
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch definitions:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('⏱️ Achievement definitions request timed out - server may be cold-starting');
      } else {
        console.warn('⚠️ Could not fetch achievement definitions:', error instanceof Error ? error.message : String(error));
      }
    } finally {
      setLoadingDefinitions(false);
    }
  }, []);

  // Fetch user's achievements
  const fetchUserAchievements = useCallback(async (accessToken: string) => {
    console.log('🏆 Fetching user achievements...');
    setLoadingAchievements(true);
    
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/achievements/user`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ User achievements loaded:', (data.achievements || []).length);
        setAchievements(data.achievements || []);
      } else {
        console.error('❌ Failed to fetch user achievements:', response.status, response.statusText);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('❌ User achievements request timed out after 8 seconds');
      } else {
        console.error('❌ Failed to fetch user achievements:', error);
      }
    } finally {
      setLoadingAchievements(false);
    }
  }, []);

  // Fetch user stats
  const fetchUserStats = useCallback(async (accessToken: string) => {
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/achievements/stats`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setUserStats(data.stats || null);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('❌ User stats request timed out after 8 seconds');
      } else {
        console.error('Failed to fetch user stats:', error);
      }
    }
  }, []);

  // Check for pending notifications
  const checkPendingNotifications = useCallback(async (accessToken: string) => {
    try {
      // Silently skip if no token (avoid network errors during startup)
      if (!accessToken) {
        return;
      }
      
      // console.log('🔍 [Achievement] Checking for pending notifications...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/achievements/pending`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const pending = data.pending || [];
        // Only log if there are pending notifications
        if (pending.length > 0) {
          console.log(`🔍 [Achievement] Found ${pending.length} pending notification(s):`, pending.map(p => p.achievementId));
        }
        
        if (pending.length > 0 && Object.keys(definitions).length > 0) {
          console.log('🎉 [Achievement] Showing pending notification modal(s)');
          
          // Get existing achievement IDs in the queue to prevent duplicates
          const queuedIds = new Set(unlockQueueRef.current.map(a => a.id));
          const currentUnlockId = currentUnlock?.id;
          
          // Add all pending achievements to unlock queue (with deduplication)
          for (const item of pending) {
            // 🔒 BULLETPROOF CHECK 1: Global window flag (survives re-renders)
            const globalShownIds = (window as any).__erasAchievementShownIds || new Set();
            if (globalShownIds.has(item.achievementId)) {
              console.log(`⏭️ [Achievement] Skipping (global flag): ${item.achievementId}`);
              continue;
            }
            
            // 🔒 BULLETPROOF CHECK 2: Local ref (component scope)
            if (shownAchievementsRef.current.has(item.achievementId)) {
              console.log(`⏭️ [Achievement] Skipping (local ref): ${item.achievementId}`);
              continue;
            }
            
            // 🔒 BULLETPROOF CHECK 3: Session storage (persists across page reloads)
            const sessionKey = `eras_achievement_shown_${item.achievementId}`;
            if (sessionStorage.getItem(sessionKey)) {
              console.log(`⏭️ [Achievement] Skipping (session storage): ${item.achievementId}`);
              continue;
            }
            
            if (queuedIds.has(item.achievementId) || currentUnlockId === item.achievementId) {
              console.log(`⏭️ [Achievement] Skipping duplicate: ${item.achievementId} - already in queue or showing`);
              continue;
            }
            
            const achievement = definitions[item.achievementId];
            if (achievement) {
              console.log(`🏆 [Achievement] Queueing unlock modal for: ${achievement.title} (${achievement.id})`);
              unlockQueueRef.current.push(achievement);
              queuedIds.add(achievement.id); // Track that we've queued it
            } else {
              console.warn(`⚠️ [Achievement] Definition not found for: ${item.achievementId}`);
            }
          }
          
          // Show first achievement modal immediately if not already showing one
          if (!showUnlockModal && unlockQueueRef.current.length > 0) {
            const firstAchievement = unlockQueueRef.current.shift();
            if (firstAchievement) {
              console.log(`🏆 [Achievement] Opening unlock modal for: ${firstAchievement.title}`);
              
              // 🔒 TRIPLE LOCK: Mark as shown IMMEDIATELY (before modal opens)
              // 1. Local ref
              shownAchievementsRef.current.add(firstAchievement.id);
              
              // 2. Global window flag
              const globalShownIds = (window as any).__erasAchievementShownIds || new Set();
              globalShownIds.add(firstAchievement.id);
              (window as any).__erasAchievementShownIds = globalShownIds;
              
              // 3. Session storage
              const sessionKey = `eras_achievement_shown_${firstAchievement.id}`;
              sessionStorage.setItem(sessionKey, 'true');
              
              setCurrentUnlock(firstAchievement);
              setShowUnlockModal(true);
            }
          }
          
          // DON'T mark as shown yet - will be marked when user closes modal
          // This prevents re-queuing during polling
        } else if (pending.length === 0) {
          // Don't log every poll, only log when checking
          // console.log('✓ [Achievement] No pending notifications');
        }
      } else if (response.status === 401) {
        // Auth token expired or invalid - this is expected, fail silently
        console.log('🔐 [Achievement] Session expired, skipping notification check');
      } else {
        console.warn('⚠️ [Achievement] Error fetching notifications:', response.status);
      }
    } catch (error) {
      // Network errors during server cold start are expected - fail silently
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.log('🔌 [Achievement] Server warming up, will retry...');
      } else {
        console.warn('⚠️ [Achievement] Notification check error:', error.message);
      }
    }
  }, [definitions]);

  // Track an action and check for new achievements
  const trackAction = useCallback(async (
    action: string,
    metadata?: any,
    accessToken?: string
  ) => {
    try {
      // Get access token from context if not provided
      if (!accessToken) {
        console.warn('No access token provided for achievement tracking');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/achievements/track`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ action, metadata })
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        
        // Update local stats
        setUserStats(result.stats);
        
        // Show full unlock modal for each newly unlocked achievement
        if (result.newlyUnlocked && result.newlyUnlocked.length > 0) {
          setNewlyUnlocked(result.newlyUnlocked);
          
          console.log(`🎉 [Achievement] ${result.newlyUnlocked.length} new achievement(s) unlocked!`);
          
          // Check if we're in a restricted context
          if (isRestrictedContext()) {
            console.log('📦 [Achievement] In restricted context - queueing unlocks for later');
            
            // Deduplicate before adding to restricted queue
            const restrictedQueueIds = new Set(queuedForRestrictedContextRef.current.map(a => a.id));
            for (const achievement of result.newlyUnlocked) {
              if (!restrictedQueueIds.has(achievement.id)) {
                queuedForRestrictedContextRef.current.push(achievement);
              } else {
                console.log(`⏭️ [Achievement] Skipping duplicate in restricted queue: ${achievement.id}`);
              }
            }
          } else {
            // Get existing achievement IDs in the queue to prevent duplicates
            const queuedIds = new Set(unlockQueueRef.current.map(a => a.id));
            const currentUnlockId = currentUnlock?.id;
            
            // Immediately show unlock modal for first achievement
            // Others will be queued and shown sequentially (with deduplication)
            for (const achievement of result.newlyUnlocked) {
              // Skip if already in queue or currently showing
              if (queuedIds.has(achievement.id) || currentUnlockId === achievement.id) {
                console.log(`⏭️ [Achievement] Skipping duplicate: ${achievement.id} - already in queue or showing`);
                continue;
              }
              unlockQueueRef.current.push(achievement);
              queuedIds.add(achievement.id); // Track that we've queued it
            }
            
            // Show first achievement modal immediately if not already showing
            if (!showUnlockModal && unlockQueueRef.current.length > 0) {
              const firstAchievement = unlockQueueRef.current.shift();
              if (firstAchievement) {
                console.log(`🏆 [Achievement] Opening unlock modal for: ${firstAchievement.title}`);
                setCurrentUnlock(firstAchievement);
                setShowUnlockModal(true);
              }
            }
          }
          
          // Refresh achievement list
          await fetchUserAchievements(accessToken);
        }
      }
    } catch (error) {
      console.error('Achievement tracking error:', error);
      // Fail silently - don't break user experience
    }
  }, [fetchUserAchievements]);

  // Show animated toast notification with custom component
  const showAchievementToast = (achievement: Achievement) => {
    // Check if we're in a restricted context (camera, recording, etc.)
    if (isRestrictedContext()) {
      console.log('📦 [Achievement] Queueing achievement for restricted context:', achievement.title);
      // Queue for later - will display when context is safe
      queuedForRestrictedContextRef.current.push(achievement);
      
      // Trigger light haptic feedback (suppressed if Do Not Disturb)
      try {
        if ('vibrate' in navigator) {
          navigator.vibrate(50); // Single subtle tap
        }
      } catch (error) {
        // Haptic not supported, ignore
      }
      return;
    }
    
    // Add to unlock queue
    unlockQueueRef.current.push(achievement);
    
    console.log('🏆 [Achievement] Showing unlock notification:', achievement.title);
    
    // Trigger confetti for major achievements
    if (achievement.rarity === 'epic' || achievement.rarity === 'legendary') {
      const colors = achievement.category === 'starter' 
        ? ['#10b981', '#3b82f6', '#f59e0b']
        : achievement.category === 'era_themed'
        ? ['#8b5cf6', '#ec4899', '#f59e0b']
        : ['#6366f1', '#a855f7', '#ec4899'];

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors,
        zIndex: 99999 // Ensure confetti is on top
      });
    }
    
    // Show toast with click handler to open modal
    const toastId = toast(
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleToastClick(achievement)}>
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg flex-shrink-0`}
          style={{
            background: `linear-gradient(135deg, ${achievement.visual.gradientStart} 0%, ${achievement.visual.gradientEnd} 100%)`
          }}
        >
          <span className="text-2xl">{achievement.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-xs font-medium opacity-90">🏆 Achievement Unlocked</span>
          </div>
          <div className="font-semibold text-sm mb-0.5">{achievement.title}</div>
          <div className="text-xs opacity-80 line-clamp-1">{achievement.description}</div>
        </div>
      </div>,
      {
        duration: 6000,
        position: 'top-center',
        style: {
          background: `linear-gradient(135deg, ${achievement.visual.gradientStart} 0%, ${achievement.visual.gradientEnd} 100%)`,
          color: 'white',
          border: 'none',
          padding: '16px',
          borderRadius: '16px',
          boxShadow: `0 8px 32px ${achievement.visual.glowColor}60`,
          minWidth: '320px',
          maxWidth: '400px'
        }
      }
    );
  };
  
  // Handle toast click to show unlock modal
  const handleToastClick = (achievement: Achievement) => {
    setCurrentUnlock(achievement);
    setShowUnlockModal(true);
  };
  
  // Mark notifications as shown
  const markNotificationsShown = useCallback(async (accessToken: string, achievementIds: string[]) => {
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/achievements/mark-shown`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ achievementIds })
        }
      );
    } catch (error) {
      console.error('Failed to mark notifications shown:', error);
    }
  }, []);
  
  // Close unlock modal and process queue
  const closeUnlockModal = useCallback((accessToken?: string) => {
    // ⛔ BULLETPROOF GUARD: Prevent duplicate close calls
    if (isClosingRef.current) {
      console.log('⏭️ [Achievement] Close already in progress, ignoring duplicate call');
      return;
    }
    
    isClosingRef.current = true;
    const closedAchievementId = currentUnlock?.id;
    
    console.log('🔒 [Achievement] Closing modal for:', closedAchievementId);
    
    // Close modal visually first
    setShowUnlockModal(false);
    setCurrentUnlock(null);
    
    // Mark this achievement as shown AFTER user closes it
    if (closedAchievementId && accessToken) {
      console.log('✅ [Achievement] User closed modal, marking as shown:', closedAchievementId);
      markNotificationsShown(accessToken, [closedAchievementId]);
    }
    
    // Reset closing flag after a brief delay
    setTimeout(() => {
      isClosingRef.current = false;
    }, 100);
    
    // Process next in queue after a delay
    setTimeout(() => {
      if (unlockQueueRef.current.length > 0) {
        const next = unlockQueueRef.current.shift();
        if (next) {
          console.log(`🏆 [Achievement] Processing next in queue: ${next.title}`);
          
          // 🔒 TRIPLE LOCK: Mark as shown IMMEDIATELY (before modal opens)
          // 1. Local ref
          shownAchievementsRef.current.add(next.id);
          
          // 2. Global window flag
          const globalShownIds = (window as any).__erasAchievementShownIds || new Set();
          globalShownIds.add(next.id);
          (window as any).__erasAchievementShownIds = globalShownIds;
          
          // 3. Session storage
          const sessionKey = `eras_achievement_shown_${next.id}`;
          sessionStorage.setItem(sessionKey, 'true');
          
          setCurrentUnlock(next);
          setShowUnlockModal(true);
        }
      }
    }, 500);
  }, [currentUnlock, markNotificationsShown]);

  // Mark achievement as shared
  const markAsShared = async (accessToken: string, achievementId: string) => {
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/achievements/mark-shared`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ achievementId })
        }
      );
    } catch (error) {
      console.error('Failed to mark achievement as shared:', error);
    }
  };

  // Get achievement rarity percentages
  const fetchRarityPercentages = useCallback(async () => {
    try {
      console.log('🌐 Fetching rarity from:', `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/achievements/rarity`);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/achievements/rarity`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Full backend response:', data);
        console.log('🎯 Extracted rarity object:', data.rarity);
        console.log('📊 Total users:', data.totalUsers);
        console.log('📊 Total achievements:', data.totalAchievements);
        return data.rarity || {};
      } else {
        const errorText = await response.text();
        console.error('❌ Bad response:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Failed to fetch rarity percentages:', error);
    }
    return {};
  }, []);

  // Get user achievement insights
  const fetchInsights = useCallback(async (accessToken: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/achievements/insights`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.insights || null;
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    }
    return null;
  }, []);

  // Run retroactive unlock migration
  const runRetroactiveMigration = useCallback(async (accessToken: string) => {
    try {
      console.log('🔄 [Retroactive] Starting migration...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/achievements/retroactive-migration`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.newUnlocks > 0) {
          console.log(`✅ [Retroactive] Unlocked ${result.newUnlocks} achievements`);
          
          // Show special notification for retroactive unlocks
          toast.success(
            `🎉 Recognized your past milestones! ${result.newUnlocks} achievement${result.newUnlocks > 1 ? 's' : ''} unlocked retroactively.`,
            {
              duration: 6000,
              position: 'top-center',
              style: {
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                color: 'white',
                padding: '16px',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)',
                minWidth: '320px'
              }
            }
          );
          
          // Refresh achievements
          await fetchUserAchievements(accessToken);
          await fetchUserStats(accessToken);
        } else {
          console.log('ℹ️ [Retroactive] No new achievements to unlock');
        }
        
        return result;
      }
    } catch (error) {
      console.error('Failed to run retroactive migration:', error);
    }
    return { success: false, newUnlocks: 0, achievements: [] };
  }, [fetchUserAchievements, fetchUserStats]);

  // Check retroactive unlock status
  const checkRetroactiveStatus = useCallback(async (accessToken: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/achievements/retroactive-status`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.status || null;
      }
    } catch (error) {
      console.error('Failed to check retroactive status:', error);
    }
    return null;
  }, []);

  // Mark retroactive notification as shown
  const markRetroactiveShown = useCallback(async (accessToken: string) => {
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/achievements/mark-retroactive-shown`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('Failed to mark retroactive shown:', error);
    }
  }, []);

  // Utility: Rebuild global achievement stats (admin function)
  const rebuildGlobalStats = useCallback(async () => {
    try {
      console.log('🔧 Triggering global stats rebuild...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/achievements/rebuild-global-stats`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Global stats rebuilt:', data);
        return data;
      } else {
        const error = await response.text();
        console.error('❌ Failed to rebuild stats:', error);
      }
    } catch (error) {
      console.error('❌ Error rebuilding global stats:', error);
    }
  }, []);

  // Initialize - fetch definitions
  useEffect(() => {
    fetchDefinitions();
  }, [fetchDefinitions]);

  // Update combined loading state
  // Only consider definitions loading as blocking - achievements load based on session
  useEffect(() => {
    const isLoading = loadingDefinitions;
    console.log('🏆 Loading state:', { loadingDefinitions, loadingAchievements, combined: isLoading });
    setLoading(isLoading);
  }, [loadingDefinitions, loadingAchievements]);

  // Safety timeout - if definitions loading takes more than 10 seconds, force it to stop
  useEffect(() => {
    if (loadingDefinitions) {
      const timeout = setTimeout(() => {
        console.error('⚠️ Achievement definitions loading timeout after 10 seconds');
        console.error('Server may not be responding. Forcing completion...');
        console.error('Check server logs at: https://supabase.com/dashboard/project/[your-project]/functions/make-server-f9be53a7/logs');
        setLoadingDefinitions(false);
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [loadingDefinitions]);

  // 🎯 Monitor context changes and display queued achievements when safe
  useEffect(() => {
    // Check every 2 seconds if we have queued achievements and context is now safe
    const checkQueuedAchievements = () => {
      if (queuedForRestrictedContextRef.current.length > 0 && !isRestrictedContext()) {
        console.log(`🎉 [Achievement] Context is now safe! Displaying ${queuedForRestrictedContextRef.current.length} queued achievement(s)`);
        
        // Display all queued achievements
        const queued = [...queuedForRestrictedContextRef.current];
        queuedForRestrictedContextRef.current = []; // Clear the queue
        
        queued.forEach((achievement, index) => {
          // Delay between multiple achievements
          setTimeout(() => {
            showAchievementToast(achievement);
          }, index * 500);
        });
      }
    };
    
    // Check immediately when definitions are loaded
    if (Object.keys(definitions).length > 0) {
      checkQueuedAchievements();
    }
    
    // Poll every 2 seconds to check if context is safe
    const intervalId = setInterval(checkQueuedAchievements, 2000);
    
    return () => clearInterval(intervalId);
  }, [definitions]); // Re-run when definitions load

  // 🔧 Expose function to manually check queued achievements (for navigation events)
  const checkQueuedAchievements = useCallback(() => {
    if (queuedForRestrictedContextRef.current.length > 0 && !isRestrictedContext()) {
      console.log(`🎉 [Achievement] Manual check - Displaying ${queuedForRestrictedContextRef.current.length} queued achievement(s)`);
      
      const queued = [...queuedForRestrictedContextRef.current];
      queuedForRestrictedContextRef.current = [];
      
      queued.forEach((achievement, index) => {
        setTimeout(() => {
          showAchievementToast(achievement);
        }, index * 500);
      });
    }
  }, []);

  return {
    achievements,
    definitions,
    userStats,
    loading,
    newlyUnlocked,
    showUnlockModal,
    currentUnlock,
    trackAction,
    markAsShared,
    fetchUserAchievements,
    fetchUserStats,
    checkPendingNotifications,
    closeUnlockModal,
    refresh: fetchUserAchievements,
    // New enhanced functions
    fetchRarityPercentages,
    fetchInsights,
    runRetroactiveMigration,
    checkRetroactiveStatus,
    markRetroactiveShown,
    // Context-aware queue checking
    checkQueuedAchievements,
    // Admin utility
    rebuildGlobalStats
  };
}