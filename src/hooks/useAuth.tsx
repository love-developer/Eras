import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../utils/supabase/client';
import { DatabaseService } from '../utils/supabase/database';
import { toast } from 'sonner';
import { CacheService } from '../utils/cache';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const handleAuthError = useCallback((error) => {
    console.error('Auth error:', error);
    
    // Handle specific auth errors
    if (error?.message?.includes('Invalid Refresh Token') || 
        error?.message?.includes('Refresh Token Not Found') ||
        error?.message?.includes('refresh_token_not_found')) {
      console.warn('🔑 Refresh token is invalid - clearing session and signing out');
      
      // Clear all auth state
      setUser(null);
      setIsAuthenticated(false);
      setIsCheckingAuth(false);
      setAccessToken(null);
      
      // Clear stored tokens and auth state
      try {
        localStorage.removeItem('eras-auth-state');
        localStorage.removeItem('eras_capsule_draft');
        sessionStorage.removeItem('capsule_redirect');
        sessionStorage.removeItem('capsule_view_token');
        
        // Clear Supabase's stored session
        supabase.auth.signOut({ scope: 'local' });
      } catch (clearError) {
        console.warn('Error clearing auth state:', clearError);
      }
      
      // Show friendly error message
      toast.error('Your session has expired. Please sign in again.', {
        duration: 5000,
        position: 'top-center'
      });
    }
  }, []);

  const setUserFromSession = (session) => {
    const userData = {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.user_metadata?.firstName || 
                 session.user.user_metadata?.first_name || 
                 session.user.user_metadata?.full_name?.split(' ')[0] || 
                 session.user.user_metadata?.name?.split(' ')[0] ||
                 'User',
      lastName: session.user.user_metadata?.lastName || 
                session.user.user_metadata?.last_name || 
                session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') ||
                session.user.user_metadata?.name?.split(' ').slice(1).join(' ') ||
                ''
    };
    
    const provider = session.user.app_metadata?.provider;
    if (provider) {
      console.log(`✅ User authenticated via ${provider}`);
    }
    
    // Clear explicit logout flag on successful authentication
    try {
      sessionStorage.removeItem('eras-explicit-logout');
      sessionStorage.removeItem('eras-logout-timestamp');
      console.log('🔓 Cleared logout flag - auto-login now enabled');
    } catch (e) {
      console.warn('Could not clear logout flag:', e);
    }
    
    try {
      localStorage.setItem('eras-auth-state', JSON.stringify({
        isAuthenticated: true,
        user: userData,
        provider: provider,
        timestamp: Date.now()
      }));
    } catch (storageError) {
      console.warn('Could not store auth state:', storageError);
    }

    setUser(userData);
    setIsAuthenticated(true);
    setAccessToken(session.access_token);
    
    // Claim any pending capsules for this user's email
    const claimPendingCapsules = async () => {
      try {
        // Use the access token from the session we already have
        const accessToken = session.access_token;
        console.log('🔑 Using access token from active session');
        
        const result = await DatabaseService.claimPendingCapsules(accessToken);
        if (result.claimed > 0) {
          console.log(`🎉 Claimed ${result.claimed} pending capsule(s)`);
          
          // Clear received capsules cache to force refresh
          CacheService.delete(`received_capsules_${userData.id}`);
          CacheService.delete(`received_count_${userData.id}`);
          
          toast.success(
            `Welcome! You have ${result.claimed} capsule${result.claimed > 1 ? 's' : ''} waiting for you in your Received tab.`,
            {
              duration: 6000,
              position: 'top-center'
            }
          );
        }
      } catch (error) {
        console.error('Error claiming pending capsules:', error);
        // Silently fail - user can still view capsules via email links
      }
    };
    
    // Run immediately since we already have the access token
    claimPendingCapsules();
    
    // Onboarding disabled
    // const checkOnboarding = () => {
    //   const hasCompletedOnboarding = localStorage.getItem('eras-onboarding-completed');
    //   const dontShowAgain = localStorage.getItem('eras-onboarding-dont-show-again');
    //   const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    //   
    //   if (!hasCompletedOnboarding && !dontShowAgain && !showOnboarding) {
    //     if (isIOSDevice) {
    //       setTimeout(() => setShowOnboarding(true), 800);
    //     } else {
    //       setShowOnboarding(true);
    //     }
    //   }
    // };
    // 
    // setTimeout(checkOnboarding, 150);
  };

  const checkExistingSession = async () => {
    try {
      console.log('🔍 Checking for existing session...');
      

      
      // CRITICAL: Check for explicit logout flag
      try {
        const explicitLogout = sessionStorage.getItem('eras-explicit-logout');
        const logoutTimestamp = sessionStorage.getItem('eras-logout-timestamp');
        
        if (explicitLogout === 'true') {
          const logoutAge = logoutTimestamp ? Date.now() - parseInt(logoutTimestamp) : 0;
          const fiveMinutes = 5 * 60 * 1000;
          
          if (logoutAge < fiveMinutes) {
            console.log('🔐 [SESSION CHECK] User explicitly logged out recently - blocking auto-login');
            console.log(`⏱️ Logout was ${Math.round(logoutAge / 1000)} seconds ago`);
            
            // Clear the flag after 5 minutes (in case user closed browser)
            if (logoutAge >= fiveMinutes) {
              sessionStorage.removeItem('eras-explicit-logout');
              sessionStorage.removeItem('eras-logout-timestamp');
            }
            
            setIsCheckingAuth(false);
            return;
          } else {
            // Flag expired, clear it
            console.log('ℹ️ Logout flag expired (>5 min), clearing...');
            sessionStorage.removeItem('eras-explicit-logout');
            sessionStorage.removeItem('eras-logout-timestamp');
          }
        }
      } catch (flagError) {
        console.warn('Could not check logout flag:', flagError);
      }
      
      if (!navigator.onLine) {
        console.log('📵 Device is offline, skipping auth check');
        setIsCheckingAuth(false);
        return;
      }

      // Check localStorage for existing auth state (backup/cache)
      let usedCachedAuth = false;
      try {
        const cachedAuth = localStorage.getItem('eras-auth-state');
        if (cachedAuth) {
          const authData = JSON.parse(cachedAuth);
          const age = Date.now() - (authData.timestamp || 0);
          const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
          
          if (age < maxAge && authData.isAuthenticated && authData.user) {
            console.log('📦 Found cached auth state (age: ' + Math.round(age / 1000 / 60) + ' minutes)');
            // Set cached state immediately for better UX
            setUser(authData.user);
            setIsAuthenticated(true);
            usedCachedAuth = true;
            
            // Show a subtle toast to let user know we're restoring their session
            toast.success('Welcome back! Restoring your session...', {
              duration: 2000,
              id: 'session-restore'
            });
          } else if (age >= maxAge) {
            console.log('⏰ Cached auth state expired, clearing...');
            localStorage.removeItem('eras-auth-state');
          }
        }
      } catch (cacheError) {
        console.warn('Could not read cached auth state:', cacheError);
      }

      // CRITICAL: If this is an OAuth callback, skip auto-login and let Auth.tsx handle it
      // This ensures the Auth component's useEffect can run and trigger ErasGate
      try {
        const hash = window.location.hash;
        const isOAuthCallback = hash && hash.includes('access_token') && !hash.includes('type=');
        
        if (isOAuthCallback) {
          console.log('🚪 [OAUTH] OAuth callback detected in checkExistingSession');
          console.log('🚪 [OAUTH] Skipping automatic session check to let Auth.tsx handle it');
          console.log('🚪 [OAUTH] This ensures ErasGate is triggered properly');
          setIsCheckingAuth(false);
          return;
        }
      } catch (e) {
        console.warn('Could not check for OAuth callback:', e);
      }

      try {
        const { data: { session }, error } = await Promise.race([
          supabase.auth.getSession(),
          new Promise<{ data: { session: null }, error: Error }>((_, reject) => 
            setTimeout(() => reject(new Error('Session check timeout')), 8000) // Increased to 8 seconds
          )
        ]);
        
        if (error) {
          console.error('❌ Auth session error:', error.message);
          
          // Handle refresh token errors specifically
          if (error.message?.includes('Invalid Refresh Token') || 
              error.message?.includes('Refresh Token Not Found') ||
              error.message?.includes('refresh_token_not_found')) {
            console.warn('🔑 Invalid refresh token detected during session check');
            
            // Clear everything and force re-authentication
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem('eras-auth-state');
            
            try {
              await supabase.auth.signOut({ scope: 'local' });
            } catch (signOutError) {
              console.warn('Error during local sign out:', signOutError);
            }
            
            toast.error('Your session has expired. Please sign in again.', {
              duration: 5000,
              position: 'top-center'
            });
          } else {
            // For other errors, keep cached state if we have it
            if (!isAuthenticated) {
              setIsCheckingAuth(false);
            }
          }
          setIsCheckingAuth(false);
          return;
        }

        if (session?.user) {
          console.log('✅ Found existing session from Supabase');
          setUserFromSession(session);
          
          // Dismiss the cached session toast if we verified with Supabase
          if (usedCachedAuth) {
            toast.dismiss('session-restore');
            // Removed annoying "Session verified!" toast
          }
        } else {
          console.log('ℹ️ No existing session found in Supabase');
          // Clear cached auth if Supabase session doesn't exist
          if (isAuthenticated) {
            console.log('⚠️ Cached auth exists but Supabase session is gone - clearing cache');
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem('eras-auth-state');
            
            toast.error('Your session has expired. Please sign in again.', {
              duration: 4000
            });
          }
        }
      } catch (error) {
        // Handle timeout and other errors gracefully
        if (error.message === 'Session check timeout') {
          console.warn('⏱️ Session check timed out after 8 seconds');
          
          // If we have cached auth, let the user continue with it
          if (usedCachedAuth && isAuthenticated) {
            console.log('✅ Continuing with cached session (server check timed out)');
            toast.dismiss('session-restore');
            toast.success('Welcome back! (Using cached session)', { duration: 2000 });
          } else {
            console.log('⚠️ Session check timeout with no cached auth - user needs to sign in');
          }
        } else {
          console.error('❌ Auth check error:', error.message);
          handleAuthError(error);
        }
      } finally {
        setIsCheckingAuth(false);
      }
    } catch (error) {
      console.error('❌ Auth check error:', error.message);
      handleAuthError(error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleAuthenticated = useCallback((userData, accessToken = null) => {
    setUser(userData);
    setIsAuthenticated(true);
    
    // Clear explicit logout flag on successful authentication
    try {
      sessionStorage.removeItem('eras-explicit-logout');
      sessionStorage.removeItem('eras-logout-timestamp');
      console.log('🔓 Cleared logout flag - auto-login now enabled');
    } catch (e) {
      console.warn('Could not clear logout flag:', e);
    }
    
    // Claim any pending capsules for this user's email
    const claimPendingCapsules = async () => {
      try {
        // Use provided access token if available, otherwise get from session
        if (accessToken) {
          console.log('🔑 Using provided access token');
          const result = await DatabaseService.claimPendingCapsules(accessToken);
          if (result.claimed > 0) {
            console.log(`🎉 Claimed ${result.claimed} pending capsule(s)`);
            
            // Clear received capsules cache to force refresh
            CacheService.delete(`received_capsules_${userData.id}`);
            CacheService.delete(`received_count_${userData.id}`);
            
            toast.success(
              `Welcome! You have ${result.claimed} capsule${result.claimed > 1 ? 's' : ''} waiting for you in your Received tab.`,
              {
                duration: 6000,
                position: 'top-center'
              }
            );
          }
        } else {
          // Fallback: wait for session to be persisted
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const result = await DatabaseService.claimPendingCapsules();
          if (result.claimed > 0) {
            console.log(`🎉 Claimed ${result.claimed} pending capsule(s)`);
            
            // Clear received capsules cache to force refresh
            CacheService.delete(`received_capsules_${userData.id}`);
            CacheService.delete(`received_count_${userData.id}`);
            
            toast.success(
              `Welcome! You have ${result.claimed} capsule${result.claimed > 1 ? 's' : ''} waiting for you in your Received tab.`,
              {
                duration: 6000,
                position: 'top-center'
              }
            );
          }
        }
      } catch (error) {
        console.error('Error claiming pending capsules:', error);
        // Silently fail - user can still view capsules via email links
      }
    };
    
    // Run immediately if we have access token, otherwise wait
    if (accessToken) {
      claimPendingCapsules();
    } else {
      setTimeout(claimPendingCapsules, 1500);
    }
    
    // Onboarding disabled
    // const checkOnboarding = () => {
    //   const hasCompletedOnboarding = localStorage.getItem('eras-onboarding-completed');
    //   const dontShowAgain = localStorage.getItem('eras-onboarding-dont-show-again');
    //   const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    //   
    //   if (!hasCompletedOnboarding && !dontShowAgain && !showOnboarding) {
    //     if (isIOSDevice) {
    //       setTimeout(() => setShowOnboarding(true), 1000);
    //     } else {
    //       setShowOnboarding(true);
    //     }
    //   }
    // };
    // 
    // setTimeout(checkOnboarding, 100);
  }, []);

  const handleLogout = useCallback(async () => {
    console.log('👋 Starting sign out process...');
    console.log('🧹 [LOGOUT] COMPLETE CLEANUP - Ensuring user is fully signed out');
    
    setIsLoggingOut(true);
    setUser(null);
    setIsAuthenticated(false);
    setIsCheckingAuth(false);
    setShowOnboarding(false);
    setAccessToken(null);
    
    // Step 1: Clear ALL localStorage items
    try {
      localStorage.removeItem('eras_capsule_draft');
      localStorage.removeItem('eras-onboarding-completed');
      localStorage.removeItem('eras-auth-state');
      localStorage.removeItem('eras-remember-email');
      localStorage.removeItem('eras-remember-me');
      localStorage.removeItem('eras-session-created');
      sessionStorage.removeItem('capsule_redirect');
      sessionStorage.removeItem('capsule_view_token');
      sessionStorage.removeItem('eras-tab-validated');
      
      // 🔒 BULLETPROOF CLEANUP: Clear all achievement session locks
      const sessionKeys = Object.keys(sessionStorage);
      for (const key of sessionKeys) {
        if (key.startsWith('eras_achievement_shown_') || 
            key.startsWith('eras_title_event_')) {
          sessionStorage.removeItem(key);
        }
      }
      console.log('🏆 Achievement session locks cleared');
      
      // Clear global achievement flags
      if (typeof window !== 'undefined') {
        (window as any).__erasAchievementShownIds = new Set();
        console.log('🌐 Global achievement flags reset');
      }
      
      // CRITICAL: Set explicit logout flag to prevent auto-login on next visit
      sessionStorage.setItem('eras-explicit-logout', 'true');
      sessionStorage.setItem('eras-logout-timestamp', Date.now().toString());
      
      console.log('🔒 Remember Me settings and capsule redirect tokens cleared');
      console.log('🔐 [LOGOUT] Set explicit logout flag - auto-login disabled');
      console.log('🌙 [LOGOUT] ✨ Lunar Eclipse will play on next sign-in');
    } catch (storageError) {
      console.warn('Could not clear localStorage:', storageError);
    }
    
    console.log('✅ Local session cleared - UI updated');
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Step 2: Force Supabase signOut with aggressive cleanup
    try {
      if (!navigator.onLine) {
        console.log('📵 Device offline - performing local sign out only');
        // Even offline, clear Supabase's local storage
        try {
          await supabase.auth.signOut({ scope: 'local' });
          console.log('✅ Local Supabase session cleared (offline mode)');
        } catch (localSignOutError) {
          console.warn('⚠️ Could not clear local Supabase session:', localSignOutError);
        }
        setIsLoggingOut(false);
        return;
      }
      
      console.log('🌐 [LOGOUT] Performing GLOBAL sign out to clear all sessions');
      
      // Use 'global' scope to sign out from all devices/tabs
      // This is critical for mobile browsers where session might persist
      await Promise.race([
        supabase.auth.signOut({ scope: 'global' }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Logout timeout')), 3000)
        )
      ]);
      
      console.log('✅ Server sign out successful (global scope)');
      console.log('🧹 [LOGOUT] Supabase session cleared from all devices');
    } catch (signOutError) {
      if (signOutError.message === 'Logout timeout') {
        console.log('⚠️ Server sign out timed out - forcing local cleanup');
        // Even if server times out, ensure local session is cleared
        try {
          await supabase.auth.signOut({ scope: 'local' });
          console.log('✅ Fallback: Local session cleared');
        } catch (localError) {
          console.warn('⚠️ Could not clear local session:', localError);
        }
      } else {
        console.warn('⚠️ Server sign out error:', signOutError.message);
        // Try local signout as fallback
        try {
          await supabase.auth.signOut({ scope: 'local' });
          console.log('✅ Fallback: Local session cleared after error');
        } catch (localError) {
          console.warn('⚠️ Could not clear local session:', localError);
        }
      }
    } finally {
      // Step 3: Final aggressive cleanup - clear any Supabase storage keys
      try {
        // Clear Supabase auth keys from localStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.startsWith('sb-') || 
            key.includes('supabase') || 
            key.includes('auth-token')
          )) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
          console.log(`🧹 [LOGOUT] Removed Supabase key: ${key.substring(0, 20)}...`);
        });
        
        if (keysToRemove.length > 0) {
          console.log(`✅ Cleared ${keysToRemove.length} Supabase storage keys`);
        }
      } catch (cleanupError) {
        console.warn('⚠️ Could not perform final storage cleanup:', cleanupError);
      }
      
      console.log('🎉 [LOGOUT] COMPLETE - User fully signed out, all sessions cleared');
      console.log('🔐 [LOGOUT] Next login will require authentication');
      setIsLoggingOut(false);
    }
  }, []);

  // Initialize auth
  useEffect(() => {
    let mounted = true;
    let pageLoadTimeout = null;
    let sessionMonitor = null;

    if (!isAuthenticated) {
      pageLoadTimeout = setTimeout(() => {
        if (mounted && isCheckingAuth && !isAuthenticated) {
          console.log('⏱️ Initial auth check completed - ready for login');
          setIsCheckingAuth(false);
        }
      }, 3000);
    }

    // Monitor session persistence every 30 seconds when authenticated
    if (isAuthenticated && user) {
      sessionMonitor = setInterval(async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          // Check for refresh token errors
          if (error) {
            if (error.message?.includes('Invalid Refresh Token') || 
                error.message?.includes('Refresh Token Not Found') ||
                error.message?.includes('refresh_token_not_found')) {
              console.warn('⚠️ Invalid refresh token detected in session monitor');
              handleAuthError(error);
              return;
            }
          }
          
          if (!session && isAuthenticated) {
            console.warn('⚠️ Session lost unexpectedly - logging out');
            handleLogout();
          }
        } catch (error) {
          console.warn('Session monitor error:', error);
          
          // Handle refresh token errors
          if (error.message?.includes('Invalid Refresh Token') || 
              error.message?.includes('Refresh Token Not Found')) {
            handleAuthError(error);
          }
        }
      }, 30000); // Check every 30 seconds
    }

    checkExistingSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('🔐 Auth state change:', event, 'Session exists:', !!session?.user);
      
      if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setUser(null);
        setIsAuthenticated(false);
        
        try {
          localStorage.removeItem('eras-auth-state');
          sessionStorage.removeItem('capsule_redirect');
          sessionStorage.removeItem('capsule_view_token');
          sessionStorage.removeItem('capsule_redirect_timestamp');
        } catch (storageError) {
          console.warn('Could not clear stored auth state:', storageError);
        }
      }
      
      if (event === 'SIGNED_IN' && session?.user && !isAuthenticated) {
        // CRITICAL: Check if this is an OAuth callback that should trigger ErasGate
        try {
          const oauthExpectsGate = sessionStorage.getItem('eras-oauth-expects-gate');
          const hash = window.location.hash;
          const isOAuthCallback = (hash && hash.includes('access_token') && !hash.includes('type=')) || oauthExpectsGate === 'true';
          
          if (isOAuthCallback) {
            console.log('🚪 [OAUTH] SIGNED_IN event for OAuth callback detected!');
            console.log('🚪 [OAUTH] This will be handled through Auth.tsx → ErasGate flow');
            // Set a flag so Auth component knows to process this
            sessionStorage.setItem('eras-oauth-callback-ready', 'true');
            return;
          }
        } catch (e) {
          console.warn('Could not check for OAuth callback:', e);
        }
        
        console.log('✅ User signed in');
        setUserFromSession(session);
        
        // Check for capsule redirect after OAuth completion
        // IMPORTANT: Only redirect if we're NOT already on a /view/ route to prevent redirect loops
        const currentPath = window.location.pathname;
        const isAlreadyOnViewRoute = currentPath.startsWith('/view/');
        
        if (!isAlreadyOnViewRoute) {
          const capsuleRedirect = sessionStorage.getItem('capsule_redirect');
          const viewToken = sessionStorage.getItem('capsule_view_token');
          const capsuleRedirectTimestamp = sessionStorage.getItem('capsule_redirect_timestamp');
          
          // CRITICAL FIX: Only redirect if the redirect token is fresh (less than 30 seconds old)
          // This prevents stale tokens from previous sessions from triggering unwanted redirects after app updates/refreshes
          const isFreshRedirect = capsuleRedirectTimestamp && 
            (Date.now() - parseInt(capsuleRedirectTimestamp)) < 30000; // 30 seconds
          
          if (capsuleRedirect && viewToken && isFreshRedirect) {
            console.log('📬 Redirecting to received capsule after OAuth authentication (fresh redirect token)');
            // Clear sessionStorage IMMEDIATELY to prevent redirect loops
            sessionStorage.removeItem('capsule_redirect');
            sessionStorage.removeItem('capsule_view_token');
            sessionStorage.removeItem('capsule_redirect_timestamp');
            
            // Add a small delay to ensure auth is fully set up
            setTimeout(() => {
              window.location.href = `/view/${viewToken}`;
            }, 500);
          } else if (capsuleRedirect || viewToken) {
            // Clear stale redirect tokens
            console.log('🧹 Clearing stale capsule redirect tokens (too old or incomplete)');
            sessionStorage.removeItem('capsule_redirect');
            sessionStorage.removeItem('capsule_view_token');
            sessionStorage.removeItem('capsule_redirect_timestamp');
          }
        } else {
          console.log('ℹ️ Already on view route, skipping capsule redirect check');
          // Clear any stale redirect tokens to prevent future issues
          sessionStorage.removeItem('capsule_redirect');
          sessionStorage.removeItem('capsule_view_token');
          sessionStorage.removeItem('capsule_redirect_timestamp');
        }
      }
      
      // Handle email verification/password recovery
      if (event === 'PASSWORD_RECOVERY' || event === 'USER_UPDATED') {
        console.log(`🔐 Auth event: ${event}`, { hasSession: !!session, hasUser: !!session?.user });
        
        // If user is updated with a valid session, update our state
        if (session?.user && event === 'USER_UPDATED') {
          console.log('✅ User updated with valid session');
          
          // Only update if not already authenticated (avoid unnecessary updates)
          if (!isAuthenticated) {
            setUserFromSession(session);
          }
        }
      }
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed silently - no action needed');
        // CRITICAL: Do NOT update user state on token refresh
        // This was causing unwanted re-renders and tab resets
        // Supabase client handles token refresh automatically in the background
        // The session remains valid and all API calls will use the new token
        // We don't need to do anything here
      }
      
      // Handle token refresh errors
      if (event === 'USER_UPDATED' && !session?.user) {
        console.warn('⚠️ User update event with no session - possible token refresh failure');
      }
    });

    return () => {
      mounted = false;
      if (pageLoadTimeout) {
        clearTimeout(pageLoadTimeout);
      }
      if (sessionMonitor) {
        clearInterval(sessionMonitor);
      }
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Helper function to get current access token (async)
  const getAccessToken = useCallback(async () => {
    if (accessToken) {
      return accessToken;
    }
    
    // Fallback: get from current session
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        setAccessToken(session.access_token);
        return session.access_token;
      }
    } catch (error) {
      console.error('Error getting access token:', error);
    }
    
    return null;
  }, [accessToken]);

  // Memoize the return object to prevent unnecessary re-renders in parent components
  // This ensures that if nothing actually changed, we return the same object reference
  // CRITICAL: Stringify user to ensure we only re-create object when user actually changes
  const userString = useMemo(() => user ? JSON.stringify(user) : null, [user]);
  
  // CRITICAL: Memoize setState functions to ensure stable references
  const setShowOnboardingMemoized = useCallback(setShowOnboarding, []);
  const setUserMemoized = useCallback(setUser, []);
  
  // CRITICAL FIX: Memoize user object separately using userString to prevent recreation
  // Parse userString back to object to ensure consistent reference when data hasn't changed
  const userObject = useMemo(() => {
    return userString ? JSON.parse(userString) : null;
  }, [userString]);
  
  // CRITICAL: Memoize session object separately to prevent creating new object every render
  // IMPORTANT: Use userString for memoization so session only changes when token OR user data changes
  const sessionObject = useMemo(() => {
    return accessToken && userObject ? { access_token: accessToken, user: userObject } : null;
  }, [accessToken, userString, userObject]);
  
  const authObject = useMemo(() => ({
    user: userObject,
    isAuthenticated,
    isCheckingAuth,
    isLoggingOut,
    showOnboarding,
    accessToken,
    session: sessionObject,
    isLoading: isCheckingAuth,
    setShowOnboarding: setShowOnboardingMemoized,
    handleAuthenticated,
    handleLogout,
    setUser: setUserMemoized,
    getAccessToken
  }), [userObject, userString, isAuthenticated, isCheckingAuth, isLoggingOut, showOnboarding, accessToken, sessionObject, setShowOnboardingMemoized, handleAuthenticated, handleLogout, setUserMemoized, getAccessToken]);
  
  // CRITICAL DIAGNOSTIC: Track what's causing authObject to recreate
  const authObjectRef = React.useRef(authObject);
  const authRenderCount = React.useRef(0);
  authRenderCount.current++;
  
  React.useEffect(() => {
    if (authObjectRef.current !== authObject) {
      // Only log if it's an unexpected recreation (not during initial auth check)
      const isExpectedChange = (
        authObjectRef.current?.isCheckingAuth !== authObject.isCheckingAuth ||
        authObjectRef.current?.isAuthenticated !== authObject.isAuthenticated ||
        authObjectRef.current?.accessToken !== authObject.accessToken
      );
      
      if (!isExpectedChange) {
        console.log('🔴 [useAuth] AUTH OBJECT RECREATED!', {
          renderCount: authRenderCount.current,
          isAuthenticated,
          hasUser: !!userObject,
          userId: userObject?.id,
          userChanged: authObjectRef.current?.user !== authObject.user,
          isCheckingAuth,
          isCheckingAuthChanged: authObjectRef.current?.isCheckingAuth !== authObject.isCheckingAuth,
          isLoggingOut,
          isLoggingOutChanged: authObjectRef.current?.isLoggingOut !== authObject.isLoggingOut,
          showOnboarding,
          showOnboardingChanged: authObjectRef.current?.showOnboarding !== authObject.showOnboarding,
          hasAccessToken: !!accessToken,
          accessTokenChanged: authObjectRef.current?.accessToken !== authObject.accessToken,
          sessionObjectChanged: authObjectRef.current?.session !== authObject.session,
          handleAuthenticatedChanged: authObjectRef.current?.handleAuthenticated !== authObject.handleAuthenticated,
          handleLogoutChanged: authObjectRef.current?.handleLogout !== authObject.handleLogout,
          getAccessTokenChanged: authObjectRef.current?.getAccessToken !== authObject.getAccessToken,
          setUserChanged: authObjectRef.current?.setUser !== authObject.setUser,
          sessionChanged: authObjectRef.current?.session !== authObject.session
        });
      }
      authObjectRef.current = authObject;
    }
  }, [authObject, isAuthenticated, userObject?.id, isCheckingAuth, isLoggingOut, showOnboarding, accessToken]);
  
  return authObject;
}