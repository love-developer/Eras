import { useState, useRef, useEffect, useMemo, useCallback } from 'react';

export function useTabNavigation() {
  // Initialize activeTab from URL hash first, then sessionStorage, then default to home
  const getInitialTab = () => {
    try {
      // Check URL hash first (e.g., #home, #create, #vault)
      const hash = window.location.hash.slice(1); // Remove the # symbol
      const validTabs = ['home', 'create', 'record', 'vault', 'received', 'settings', 'notifications', 'legacy-access', 'terms', 'privacy', 'achievements', 'calendar'];
      
      if (hash && validTabs.includes(hash)) {
        console.log(`✅ [TAB INIT] Restoring active tab from URL hash: "${hash}"`);
        return hash;
      }
      
      // Fall back to sessionStorage
      const stored = sessionStorage.getItem('eras-active-tab');
      
      console.log('📍 [TAB INIT] Checking sessionStorage for saved tab:', { 
        stored, 
        isValid: stored ? validTabs.includes(stored) : false,
        validTabs 
      });
      
      if (stored && validTabs.includes(stored)) {
        console.log(`✅ [TAB INIT] Restoring active tab from sessionStorage: \"${stored}\"`);
        return stored;
      } else if (stored) {
        console.warn(`⚠️ [TAB INIT] Invalid tab \"${stored}\" in sessionStorage, defaulting to home`);
      }
    } catch (e) {
      console.error('❌ [TAB INIT] Could not read active tab from sessionStorage:', e);
    }
    // Always default to home when app loads or invalid tab is stored
    console.log('📍 [TAB INIT] No valid tab found, defaulting to home');
    return 'home';
  };
  
  const [activeTab, setActiveTabInternal] = useState(getInitialTab);
  const [lastActiveTab, setLastActiveTab] = useState('home');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const tabChangeSource = useRef('initial');
  
  // Track if we're handling a popstate event to prevent duplicate history pushes
  const isHandlingPopState = useRef(false);
  
  // Initialize browser history on mount
  useEffect(() => {
    // Replace current history entry with proper state on initial load
    const initialTab = getInitialTab();
    window.history.replaceState({ tab: initialTab }, '', `#${initialTab}`);
    console.log('🔗 Initialized browser history with tab:', initialTab);
  }, []); // Only run once on mount

  // Persist active tab to sessionStorage and update URL hash
  useEffect(() => {
    try {
      sessionStorage.setItem('eras-active-tab', activeTab);
      console.log('💾 Persisted active tab to sessionStorage:', activeTab);
      
      // Update URL hash without triggering navigation (only if not handling popstate)
      if (!isHandlingPopState.current) {
        const newHash = `#${activeTab}`;
        if (window.location.hash !== newHash) {
          // Use pushState to add to browser history
          window.history.pushState({ tab: activeTab }, '', newHash);
          console.log('🔗 Updated URL hash and browser history:', newHash);
        }
      }
    } catch (e) {
      console.warn('Could not persist active tab to sessionStorage:', e);
    }
  }, [activeTab]);

  // Listen for browser back/forward button clicks
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      console.log('⬅️ Browser back/forward button clicked', event.state);
      
      // Set flag to prevent duplicate history push
      isHandlingPopState.current = true;
      
      // Get tab from URL hash
      const hash = window.location.hash.slice(1);
      const validTabs = ['home', 'create', 'record', 'vault', 'received', 'settings', 'notifications', 'legacy-access', 'terms', 'privacy', 'achievements', 'calendar'];
      
      if (hash && validTabs.includes(hash)) {
        console.log(`✅ Navigating to tab from browser history: "${hash}"`);
        tabChangeSource.current = 'browser-navigation';
        setLastActiveTab(activeTab);
        setActiveTabInternal(hash);
      } else {
        // If no valid hash, go to home
        console.log('📍 No valid hash found, navigating to home');
        tabChangeSource.current = 'browser-navigation';
        setLastActiveTab(activeTab);
        setActiveTabInternal('home');
      }
      
      // Reset flag after a brief delay
      setTimeout(() => {
        isHandlingPopState.current = false;
      }, 100);
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activeTab]);

  // Monitor unexpected tab changes
  useEffect(() => {
    // Don't warn about initial tab restoration from sessionStorage
    const isInitialRestore = tabChangeSource.current === 'initial';
    
    // Don't warn about legitimate tab changes (user clicks or direct navigation)
    const isLegitimateChange = tabChangeSource.current === 'user' || tabChangeSource.current === 'direct' || tabChangeSource.current === 'browser-navigation';
    
    if (activeTab !== 'home' && activeTab !== lastActiveTab && !isLegitimateChange && !isInitialRestore) {
      console.warn('⚠️ Unexpected tab change detected:', {
        from: lastActiveTab,
        to: activeTab,
        source: tabChangeSource.current
      });
    }
    // Reset source after change is processed
    tabChangeSource.current = 'unknown';
  }, [activeTab, lastActiveTab]);

  const handleTabChange = useCallback(async (newTab) => {
    if (newTab === activeTab) return;
    if (isTransitioning) {
      console.log('🔄 Tab change requested but transition in progress, ignoring');
      return;
    }
    
    tabChangeSource.current = 'user';
    console.log(`🔄 Tab change requested: ${activeTab} → ${newTab}`);
    
    setIsTransitioning(true);
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    setLastActiveTab(activeTab);
    setActiveTabInternal(newTab);
    console.log(`✅ Tab changed to: ${newTab}`);
    setIsTransitioning(false);
  }, [activeTab, isTransitioning]);

  // Wrapped setActiveTab to track all direct tab changes
  const setActiveTab = useCallback((newTab) => {
    console.log(`📍 setActiveTab called:`, {
      from: activeTab,
      to: newTab,
      timestamp: new Date().toISOString()
    });
    
    // Log stack trace to identify who's calling this
    if (newTab === 'home' && activeTab !== 'home') {
      console.warn('⚠️ NAVIGATING TO HOME - Stack trace:', new Error().stack);
    }
    
    // Ignore if trying to set to the same tab
    if (newTab === activeTab) {
      console.log('⚠️ Ignoring setActiveTab - already on this tab');
      return;
    }
    
    tabChangeSource.current = 'direct';
    setActiveTabInternal(newTab);
    console.log(`✅ Tab changed to: ${newTab}`);
  }, [activeTab]);

  // CRITICAL FIX: Memoize return object to prevent parent remounts
  return useMemo(() => ({
    activeTab,
    lastActiveTab,
    isTransitioning,
    setActiveTab,
    setLastActiveTab,
    handleTabChange
  }), [activeTab, lastActiveTab, isTransitioning, setActiveTab, handleTabChange]);
}