import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { getThemeConfig } from './ThemeRegistry';
import { Gift, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { getOptimalParticleCount, getOptimalDuration } from '@/utils/performance';
import { EternalFlameCeremony } from './ceremonies/EternalFlameCeremony';
import { SolarReturnCeremony } from './ceremonies/SolarReturnCeremony';
import { BirthdayCakeCeremony } from './ceremonies/BirthdayCakeCeremony';
import { LuxeBirthdayCeremony } from './ceremonies/LuxeBirthdayCeremony';
import { ChampagneCeremony } from './ceremonies/ChampagneCeremony';
import { TimeTravelerCeremony } from './ceremonies/TimeTravelerCeremony';
import { VoyageCeremony } from './ceremonies/VoyageCeremony';
import { GraduationCeremony } from './ceremonies/GraduationCeremony';
import { NewLifeCeremony } from './ceremonies/NewLifeCeremony';
import { FriendshipCeremony } from './ceremonies/FriendshipCeremony';
import { PetCeremony } from './ceremonies/PetCeremony';
import { GratitudeCeremony } from './ceremonies/GratitudeCeremony';
import { CareerCeremony } from './ceremonies/CareerCeremony';
import { NewYearCeremony } from './ceremonies/NewYearCeremony';
import { NewHomeCeremony } from './ceremonies/NewHomeCeremony';
import { FreshStartCeremony } from './ceremonies/FreshStartCeremony';
import { StandardCeremony } from './ceremonies/StandardCeremony';

interface CeremonyOverlayProps {
  themeId: string;
  onComplete: () => void;
  isVisible: boolean;
  isNewReceived?: boolean; // CRITICAL: New received capsules should show opening animation
}

export function CeremonyOverlay({ themeId, onComplete, isVisible, isNewReceived = false }: CeremonyOverlayProps) {
  const [phase, setPhase] = useState<'locked' | 'interacting' | 'revealing' | 'complete'>('locked');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = getThemeConfig(themeId);
  const [progress, setProgress] = useState(0);
  
  // ⚡ MOBILE DETECTION for performance optimizations
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // Detect mobile on mount
    setIsMobile(window.innerWidth < 768);
  }, []);

  // Handle successful interaction (e.g. tear complete)
  const handleInteractionComplete = () => {
    setPhase('revealing');
    
    // ⚡ CONFETTI REMOVED: Animation/challenge is sufficient without extra effects
    // Keeping performance optimized and avoiding slowdowns on mobile
    
    // 🔥 FIX: Increase fade out duration so animation is visible (was 1500ms/750ms, now 2000ms/1000ms)
    setTimeout(() => {
      setPhase('complete');
      onComplete();
    }, getOptimalDuration(2000)); // 2s on desktop, 1s on mobile
  };

  // Return null only when complete or not visible
  if (!isVisible || phase === 'complete') return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{
        // ⚡ FIX: Use solid color on mobile to prevent rendering issues with complex gradients
        background: isMobile ? theme.primaryColor : theme.bgGradient,
        touchAction: 'none' // Prevent scrolling while interacting
      }}
    >
      {/* Confetti Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none w-full h-full"
        style={{ zIndex: 60 }}
      />

      {/* Content Container */}
      <div className="absolute inset-0 flex flex-col items-center justify-center w-full h-full p-6 text-center">
        


        {/* Theme-Specific Ceremony Component */}
        {themeId === 'anniversary' ? (
          <EternalFlameCeremony 
            isVisible={isVisible && phase !== 'revealing'} 
            onComplete={handleInteractionComplete} 
          />
        ) : themeId === 'future' ? (
          <TimeTravelerCeremony
            isVisible={isVisible && phase !== 'revealing'} 
            onComplete={handleInteractionComplete}
          />
        ) : themeId === 'travel' ? (
          <VoyageCeremony
            isVisible={isVisible && phase !== 'revealing'}
            onComplete={handleInteractionComplete}
          />
        ) : themeId === 'graduation' ? (
          <GraduationCeremony
            isVisible={isVisible && phase !== 'revealing'}
            onComplete={handleInteractionComplete}
          />
        ) : themeId === 'new_life' ? (
          <NewLifeCeremony
            isVisible={isVisible && phase !== 'revealing'}
            onComplete={handleInteractionComplete}
          />
        ) : themeId === 'wedding' ? (
          <ChampagneCeremony
            isVisible={isVisible && phase !== 'revealing'}
            onComplete={handleInteractionComplete}
          />
        ) : themeId === 'friendship' ? (
          <FriendshipCeremony
            isVisible={isVisible && phase !== 'revealing'}
            onComplete={handleInteractionComplete}
          />
        ) : themeId === 'birthday' ? (
          <LuxeBirthdayCeremony
            isVisible={isVisible && phase !== 'revealing'}
            onComplete={handleInteractionComplete}
          />
        ) : themeId === 'luxe_birthday' ? (
          <LuxeBirthdayCeremony
            isVisible={isVisible && phase !== 'revealing'}
            onComplete={handleInteractionComplete}
          />
        ) : themeId === 'pet' ? (
          <PetCeremony
            isVisible={isVisible && phase !== 'revealing'}
            onComplete={handleInteractionComplete}
          />
        ) : themeId === 'gratitude' ? (
          <GratitudeCeremony
            isVisible={isVisible && phase !== 'revealing'}
            onComplete={handleInteractionComplete}
          />
        ) : themeId === 'career' ? (
          <CareerCeremony
            isVisible={isVisible && phase !== 'revealing'}
            onComplete={handleInteractionComplete}
          />
        ) : themeId === 'new_year' ? (
          <NewYearCeremony
            isVisible={isVisible && phase !== 'revealing'}
            onComplete={handleInteractionComplete}
          />
        ) : themeId === 'new_home' ? (
          <NewHomeCeremony
            isVisible={isVisible && phase !== 'revealing'}
            onComplete={handleInteractionComplete}
          />
        ) : themeId === 'first_day' ? (
          <FreshStartCeremony
            isVisible={isVisible && phase !== 'revealing'}
            onComplete={handleInteractionComplete}
          />
        ) : themeId === 'standard' ? (
          <StandardCeremony
            isVisible={isVisible && phase !== 'revealing'}
            onComplete={handleInteractionComplete}
          />
        ) : (
          <SolarReturnCeremony 
            isVisible={isVisible && phase !== 'revealing'} 
            onComplete={handleInteractionComplete}
            themeConfig={theme}
          />
        )}

      </div>
    </motion.div>
  );
}