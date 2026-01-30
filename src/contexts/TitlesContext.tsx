import React, { createContext, useContext, ReactNode } from 'react';
import { useTitles as useTitlesHook } from '../hooks/useTitles';
import type { TitleProfile, AvailableTitles } from '../hooks/useTitles';

interface TitlesContextValue {
  titleProfile: TitleProfile | null;
  availableTitles: AvailableTitles | null;
  loading: boolean;
  equipping: boolean;
  equipTitle: (achievementId: string | null) => Promise<{ success: boolean; error?: string; equipped_title?: string }>;
  refresh: () => void;
}

const TitlesContext = createContext<TitlesContextValue | undefined>(undefined);

export function TitlesProvider({ children }: { children: ReactNode }) {
  const titles = useTitlesHook();
  
  // DIAGNOSTIC: Track TitlesProvider lifecycle
  const providerIdRef = React.useRef(Math.random().toString(36).substring(7));
  const renderCountRef = React.useRef(0);
  renderCountRef.current++;
  
  console.log(`🔄 TitlesProvider rendering (ID: ${providerIdRef.current}, Render #${renderCountRef.current})`);
  
  React.useEffect(() => {
    // Track last mount to detect unexpected remounts
    let lastMountTime = 0;
    let lastMountId = '';
    try {
      const stored = sessionStorage.getItem('eras-titlesprovider-last-mount-time');
      const storedId = sessionStorage.getItem('eras-titlesprovider-last-mount-id');
      if (stored) lastMountTime = parseInt(stored);
      if (storedId) lastMountId = storedId;
    } catch (e) {
      // Ignore
    }
    
    const now = Date.now();
    const currentId = providerIdRef.current;
    const timeSinceLastMount = lastMountTime > 0 ? now - lastMountTime : 0;
    
    // Detect remounts (expected in Figma Make dev mode due to HMR)
    if (timeSinceLastMount > 0 && timeSinceLastMount < 5000 && timeSinceLastMount > 100 && lastMountId !== currentId) {
      console.log(`⚠️ HMR: TitlesProvider remounted (${timeSinceLastMount}ms since last mount)`);
      console.log(`📋 Previous ID: ${lastMountId}, Current ID: ${currentId}`);
    }
    
    // Store current mount info
    try {
      sessionStorage.setItem('eras-titlesprovider-last-mount-time', now.toString());
      sessionStorage.setItem('eras-titlesprovider-last-mount-id', currentId);
    } catch (e) {
      // Ignore
    }
    
    console.log(`🎬 TitlesProvider mounted (ID: ${providerIdRef.current})`);
    return () => {
      console.log(`🎬 TitlesProvider unmounting (ID: ${providerIdRef.current})`);
    };
  }, []);
  
  // CRITICAL FIX: Memoize the context value with ALL dependencies for consistency
  // Even though equipTitle and refresh are stable memoized functions, we include them
  // in the dependency array to ensure the context value is consistent with the hook's return value
  // IMPORTANT: updateTrigger is internal only - NOT included to prevent render loops
  const contextValue = React.useMemo(() => ({
    titleProfile: titles.titleProfile,
    availableTitles: titles.availableTitles,
    loading: titles.loading,
    equipping: titles.equipping,
    equipTitle: titles.equipTitle,
    refresh: titles.refresh
  }), [
    titles.titleProfile,
    titles.availableTitles,
    titles.loading,
    titles.equipping,
    titles.equipTitle,
    titles.refresh
  ]);
  
  // DIAGNOSTIC: Track when titles value changes
  React.useEffect(() => {
    console.log(`📊 TitlesProvider value updated:`, {
      hasTitleProfile: !!titles.titleProfile,
      hasAvailableTitles: !!titles.availableTitles,
      loading: titles.loading
    });
  }, [titles.titleProfile, titles.availableTitles, titles.loading]);
  
  // This prevents unnecessary re-renders and remounts of consuming components
  return (
    <TitlesContext.Provider value={contextValue}>
      {children}
    </TitlesContext.Provider>
  );
}

export function useTitles() {
  const context = useContext(TitlesContext);
  if (context === undefined) {
    throw new Error('useTitles must be used within a TitlesProvider');
  }
  return context;
}
