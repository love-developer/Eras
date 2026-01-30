import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useAuth } from '../contexts/AuthContext';

export interface TitleData {
  achievementId: string;
  title: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  category: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  isEquipped: boolean;
  visual: {
    gradientStart: string;
    gradientEnd: string;
    particleColor: string;
    glowColor: string;
    animation: string;
  };
}

export interface TitleProfile {
  equipped_title: string | null;
  equipped_achievement_id: string | null;
  unlocked_titles: Array<{
    title: string;
    achievementId: string;
    rarity: string;
    unlockedAt: string;
  }>;
}

export interface AvailableTitles {
  titles: TitleData[];
  equipped: string | null;
  equippedAchievementId: string | null;
  unlockedCount: number;
  totalCount: number;
}

export function useTitles() {
  const { session } = useAuth();
  const [titleProfile, setTitleProfile] = useState<TitleProfile | null>(null);
  const [availableTitles, setAvailableTitles] = useState<AvailableTitles | null>(null);
  const [loading, setLoading] = useState(true);
  const [equipping, setEquipping] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0); // Force re-render trigger
  
  // CRITICAL FIX: Extract access token to avoid session object reference changes
  const accessToken = session?.access_token;
  
  // DIAGNOSTIC: Log when accessToken changes
  React.useEffect(() => {
    console.log('🔑 [useTitles] accessToken changed:', {
      hasToken: !!accessToken,
      tokenPreview: accessToken ? `${accessToken.substring(0, 20)}...` : 'none',
      hasSession: !!session
    });
  }, [accessToken, session]);
  
  // Debug state changes
  useEffect(() => {
    console.log('📊 [useTitles] titleProfile state changed:', titleProfile);
  }, [titleProfile]);

  useEffect(() => {
    console.log('📊 [useTitles] availableTitles state changed:', { 
      hasData: !!availableTitles,
      titlesCount: availableTitles?.titles?.length || 0,
      unlockedCount: availableTitles?.unlockedCount,
      data: availableTitles
    });
  }, [availableTitles]);
  
  // Store access token AND current state in refs to avoid closure issues
  const accessTokenRef = React.useRef<string | undefined>(accessToken);
  const titleProfileRef = React.useRef<TitleProfile | null>(null);
  const availableTitlesRef = React.useRef<AvailableTitles | null>(null);
  
  React.useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);
  
  // Keep refs in sync with state
  React.useEffect(() => {
    titleProfileRef.current = titleProfile;
  }, [titleProfile]);
  
  React.useEffect(() => {
    availableTitlesRef.current = availableTitles;
  }, [availableTitles]);

  // Fetch title profile
  const fetchTitleProfile = useCallback(async () => {
    const token = accessTokenRef.current;
    if (!token) {
      console.log('[Titles] Skipping profile fetch - no token');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/titles/profile`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('[Titles] Profile fetched:', data);
        console.log('[Titles] Setting titleProfile state...');
        // Force new object reference to trigger React re-render
        setTitleProfile({ ...data });
        console.log('[Titles] State setter called');
      } else if (response.status === 401) {
        // 401 is expected during auth transition - don't log as error
        console.log('[Titles] Auth not ready yet (401), will retry when token updates');
      } else {
        console.error('[Titles] Failed to fetch profile:', response.status);
      }
    } catch (error) {
      console.error('[Titles] Failed to fetch title profile:', error);
    }
  }, []);

  // Fetch available titles
  const fetchAvailableTitles = useCallback(async () => {
    const token = accessTokenRef.current;
    if (!token) {
      console.log('[Titles] Skipping available titles fetch - no token');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/titles/available`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('[Titles] Available titles fetched:', { 
          equipped: data.equipped, 
          equippedId: data.equippedAchievementId,
          unlockedCount: data.unlockedCount,
          titlesArrayLength: data.titles?.length || 0,
          titlesArray: data.titles
        });
        // Force new object reference to trigger React re-render
        setAvailableTitles({ ...data });
      } else if (response.status === 401) {
        // 401 is expected during auth transition - don't log as error
        console.log('[Titles] Auth not ready yet (401), will retry when token updates');
      } else {
        console.error('[Titles] Failed to fetch available titles:', response.status);
      }
    } catch (error) {
      console.error('[Titles] Failed to fetch available titles:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Equip a title
  const equipTitle = useCallback(async (achievementId: string | null) => {
    const token = accessTokenRef.current;
    if (!token) return { success: false };

    try {
      setEquipping(true);
      
      // OPTIMISTIC UPDATE - Update UI immediately for instant feedback
      console.log('[Titles] 🚀 Optimistic update - updating state immediately');
      
      // Use refs to get current state to avoid closure issues
      const currentProfile = titleProfileRef.current;
      const currentTitles = availableTitlesRef.current;
      
      if (achievementId === null) {
        // Unequipping - set to null immediately
        const newProfile = {
          ...currentProfile,
          equipped_title: null,
          equipped_achievement_id: null
        };
        const newTitles = currentTitles ? {
          ...currentTitles,
          equipped: null,
          equippedAchievementId: null,
          titles: currentTitles.titles.map(t => ({ ...t, isEquipped: false }))
        } : null;
        
        console.log('[Titles] Setting unequipped state:', { newProfile, newTitles });
        setTitleProfile(newProfile);
        if (newTitles) setAvailableTitles(newTitles);
        setUpdateTrigger(prev => prev + 1); // Force re-render
      } else {
        // Equipping - find the title and update immediately
        const titleToEquip = currentTitles?.titles.find(t => t.achievementId === achievementId);
        if (titleToEquip) {
          const newProfile = {
            ...currentProfile,
            equipped_title: titleToEquip.title,
            equipped_achievement_id: achievementId
          };
          const newTitles = currentTitles ? {
            ...currentTitles,
            equipped: titleToEquip.title,
            equippedAchievementId: achievementId,
            titles: currentTitles.titles.map(t => ({ 
              ...t, 
              isEquipped: t.achievementId === achievementId 
            }))
          } : null;
          
          console.log('[Titles] Setting equipped state:', { newProfile, newTitles });
          setTitleProfile(newProfile);
          if (newTitles) setAvailableTitles(newTitles);
          setUpdateTrigger(prev => prev + 1); // Force re-render
        }
      }
      
      console.log('[Titles] ✅ Optimistic update complete, now sending to server...');
      
      // Now send to server
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/titles/equip`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ achievementId })
        }
      );

      const result = await response.json();
      console.log('[Titles] Server response:', result);

      if (result.success) {
        console.log('[Titles] 🔄 Server confirmed, refetching to ensure sync...');
        // Refresh to ensure we're in sync with server
        await Promise.all([
          fetchTitleProfile(),
          fetchAvailableTitles()
        ]);
        setUpdateTrigger(prev => prev + 1); // Force re-render after sync
        console.log('[Titles] ✅ Refresh complete');
      } else {
        console.error('[Titles] ❌ Server rejected, rolling back optimistic update...');
        // Rollback optimistic update on failure
        await Promise.all([
          fetchTitleProfile(),
          fetchAvailableTitles()
        ]);
        setUpdateTrigger(prev => prev + 1); // Force re-render after rollback
      }

      return result;
    } catch (error) {
      console.error('Failed to equip title:', error);
      // Rollback on error
      console.log('[Titles] ❌ Error occurred, rolling back...');
      await Promise.all([
        fetchTitleProfile(),
        fetchAvailableTitles()
      ]);
      setUpdateTrigger(prev => prev + 1); // Force re-render after rollback
      return { success: false, error: 'Failed to equip title' };
    } finally {
      setEquipping(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetchTitleProfile and fetchAvailableTitles are stable memoized functions

  // Load data on mount and when access token changes
  // CRITICAL FIX: Use extracted accessToken instead of session?.access_token to avoid unnecessary re-fetches
  // This prevents refetching when session object reference changes but token is the same
  useEffect(() => {
    console.log('🔄 [useTitles] Effect triggered - session:', {
      hasSession: !!session,
      hasToken: !!accessToken,
      tokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : 'none'
    });
    
    if (accessToken) {
      console.log('✅ [useTitles] Token available, fetching titles immediately...');
      // ✅ FIX: Fetch immediately without delay to prevent race conditions during rapid sign-in/sign-out
      fetchTitleProfile();
      fetchAvailableTitles();
    } else {
      console.log('⏭️ [useTitles] No token available yet, clearing state');
      // Clear state when logged out
      setTitleProfile(null);
      setAvailableTitles(null);
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // Memoize refresh function to maintain stable reference
  // CRITICAL: Don't include fetch functions in deps since they're stable memoized functions
  const refresh = useCallback(() => {
    console.log('🔄 [useTitles] refresh() called');
    
    // Use ref to get current token value (stable across renders)
    const currentToken = accessTokenRef.current;
    console.log('🔄 [useTitles] refresh() - token available:', !!currentToken);
    
    if (!currentToken) {
      console.warn('⚠️ [useTitles] refresh() called but no accessToken available');
      return;
    }
    
    fetchTitleProfile();
    fetchAvailableTitles();
    setUpdateTrigger(prev => prev + 1);
    console.log('[Titles] ✅ Refresh complete');
  // CRITICAL FIX: Empty deps array - refresh uses accessTokenRef.current which is kept in sync
  // Including accessToken here caused infinite render loops because refresh changed on every auth update
  }, []);

  // Memoize return object to prevent unnecessary re-renders of consuming components
  // This is critical for preventing unexpected remounts in the app
  // CRITICAL FIX: Include equipTitle and refresh in deps to ensure consistency
  // Since they're memoized with useCallback and empty deps, they won't cause extra re-renders
  // IMPORTANT: updateTrigger is internal only - NOT exported to prevent render loops
  return useMemo(() => ({
    titleProfile,
    availableTitles,
    loading,
    equipping,
    equipTitle,
    refresh
  }), [titleProfile, availableTitles, loading, equipping, equipTitle, refresh]);
}