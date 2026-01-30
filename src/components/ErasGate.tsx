import React, { useState, useEffect, useRef } from 'react';
import { LoadingAnimation } from './LoadingAnimation';
import { motion, AnimatePresence } from 'motion/react';

interface ErasGateProps {
  userData: any;
  accessToken: string;
  isFreshLogin: boolean;
  onGateComplete: (userData: any, accessToken: string) => void;
}

/**
 * 🌙 ErasGate - Universal Authentication Interceptor
 * 
 * CORE PURPOSE:
 * Acts as a mandatory checkpoint between ANY authentication event and the Dashboard.
 * Ensures the Lunar Eclipse animation ALWAYS plays on fresh logins before granting access.
 * 
 * FLOW:
 * 1. User authenticates (manual login / Google OAuth / any provider)
 * 2. Auth.tsx → ErasGate (instead of directly to Dashboard)
 * 3. ErasGate checks: Should Eclipse play?
 * 4. If YES → Play Eclipse animation → Transition to Dashboard
 * 5. If NO (session restore) → Immediate transition to Dashboard
 * 
 * BEHAVIOR:
 * - Fresh Login (isFreshLogin: true) → ALWAYS plays Eclipse
 * - Session Restore (isFreshLogin: false) → Skip Eclipse, go direct to Dashboard
 * - Google OAuth redirect → Plays Eclipse (because isFreshLogin: true)
 * - Manual login → Plays Eclipse (because isFreshLogin: true)
 * - Logout → Re-login → Plays Eclipse again (no cooldown)
 * 
 * GUARANTEES:
 * ✅ No user ever sees Dashboard before Eclipse on fresh login
 * ✅ Works for ALL authentication methods (email, Google, Apple, etc.)
 * ✅ Acts as single source of truth for "should Eclipse play?"
 * ✅ Prevents any race conditions or routing bypasses
 */
export function ErasGate({ userData, accessToken, isFreshLogin, onGateComplete }: ErasGateProps) {
  const [shouldPlayEclipse, setShouldPlayEclipse] = useState(false);
  const [isEclipsePlaying, setIsEclipsePlaying] = useState(false);
  const [gateOpened, setGateOpened] = useState(false);
  const hasProcessedRef = useRef(false);

  console.log('🚪 [ERAS GATE] Component mounted');
  console.log('🚪 [ERAS GATE] Props:', {
    hasUserData: !!userData,
    userEmail: userData?.email,
    hasToken: !!accessToken,
    isFreshLogin,
  });

  // On mount, determine if Eclipse should play
  useEffect(() => {
    if (hasProcessedRef.current) {
      console.log('🚪 [ERAS GATE] Already processed - skipping');
      return;
    }

    hasProcessedRef.current = true;

    console.log('🚪 [ERAS GATE] Processing authentication...');
    console.log('🚪 [ERAS GATE] isFreshLogin:', isFreshLogin);

    // DECISION LOGIC:
    // Fresh login = User actively signed in → PLAY ECLIPSE
    // Session restore = Silent background check → SKIP ECLIPSE
    if (isFreshLogin) {
      console.log('🌙 [ERAS GATE] ✅ FRESH LOGIN DETECTED');
      console.log('🌙 [ERAS GATE] → Lunar Eclipse animation WILL PLAY');
      console.log('🌙 [ERAS GATE] → User will see Eclipse before Dashboard');
      setShouldPlayEclipse(true);
      setIsEclipsePlaying(true);
    } else {
      console.log('🚪 [ERAS GATE] ℹ️ Session restore detected');
      console.log('🚪 [ERAS GATE] → Skipping Eclipse animation');
      console.log('🚪 [ERAS GATE] → Direct transition to Dashboard');
      
      // Session restore - skip animation and open gate immediately
      setShouldPlayEclipse(false);
      setIsEclipsePlaying(false);
      setGateOpened(true);
      
      // Small delay to ensure smooth transition
      setTimeout(() => {
        console.log('🚪 [ERAS GATE] ✅ Gate opened - passing through to Dashboard');
        onGateComplete(userData, accessToken);
      }, 50);
    }
  }, [isFreshLogin, userData, accessToken, onGateComplete]);

  // Handle Eclipse animation completion
  const handleEclipseComplete = () => {
    console.log('🌙 [ERAS GATE] ✅ Lunar Eclipse animation completed');
    console.log('🚪 [ERAS GATE] → Opening gate to Dashboard');
    
    setIsEclipsePlaying(false);
    setGateOpened(true);
    
    // Transition to Dashboard after Eclipse completes
    setTimeout(() => {
      console.log('🚪 [ERAS GATE] ✅ Gate opened - transitioning to Dashboard');
      onGateComplete(userData, accessToken);
    }, 100);
  };

  // RENDER LOGIC:
  // 1. If Eclipse should play → Show LoadingAnimation (full-screen, blocking)
  // 2. If gate opened → Show transition animation (optional)
  // 3. If session restore → Pass through immediately (handled in useEffect)

  return (
    <div className="eras-gate-container">
      <AnimatePresence mode="wait">
        {/* PHASE 1: Lunar Eclipse Animation (Fresh Login Only) */}
        {shouldPlayEclipse && isEclipsePlaying && (
          <motion.div
            key="eclipse-animation"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999999]"
          >
            <LoadingAnimation onComplete={handleEclipseComplete} />
          </motion.div>
        )}

        {/* PHASE 2: Gate Transition (Optional fade effect) */}
        {gateOpened && !isEclipsePlaying && (
          <motion.div
            key="gate-transition"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[99998] pointer-events-none"
          >
            {/* Invisible - just for smooth transition timing */}
            <div className="w-full h-full bg-transparent" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * 🔍 DEBUGGING GUIDE:
 * 
 * Success Indicators (Console Logs):
 * ✅ "FRESH LOGIN DETECTED → Lunar Eclipse animation WILL PLAY"
 * ✅ "Lunar Eclipse animation completed → Opening gate to Dashboard"
 * ✅ "Gate opened - transitioning to Dashboard"
 * 
 * Common Issues:
 * 
 * 1. Eclipse doesn't play on Google OAuth:
 *    → Check Auth.tsx is passing isFreshLogin: true
 *    → Verify OAuth callback detection is working
 * 
 * 2. Eclipse plays on page refresh:
 *    → Check that isFreshLogin is false for session restores
 *    → Verify useAuth hook is setting isFreshLogin correctly
 * 
 * 3. User sees Dashboard before Eclipse:
 *    → Check z-index (should be 99999)
 *    → Verify LoadingAnimation is rendering
 *    → Check that onGateComplete is only called after animation
 * 
 * 4. Animation plays twice:
 *    → Check hasProcessedRef.current guard
 *    → Verify ErasGate isn't remounting
 * 
 * Expected Flow Logs:
 * 
 * FRESH LOGIN (Manual/OAuth):
 * 1. "🚪 [ERAS GATE] Component mounted"
 * 2. "🌙 [ERAS GATE] ✅ FRESH LOGIN DETECTED"
 * 3. "🎬🎬🎬 LoadingAnimation component RENDERING"
 * 4. "🌙 [ERAS GATE] ✅ Lunar Eclipse animation completed"
 * 5. "🚪 [ERAS GATE] ✅ Gate opened - transitioning to Dashboard"
 * 
 * SESSION RESTORE (Page Refresh):
 * 1. "🚪 [ERAS GATE] Component mounted"
 * 2. "🚪 [ERAS GATE] ℹ️ Session restore detected"
 * 3. "🚪 [ERAS GATE] → Skipping Eclipse animation"
 * 4. "🚪 [ERAS GATE] ✅ Gate opened - passing through to Dashboard"
 */