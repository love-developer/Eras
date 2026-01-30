import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CeremonyPhase } from '../../hooks/useCeremonySequence';
import { BirthdayUnwrap } from './themes/BirthdayUnwrap';
import { VoyageMapUnfold } from './themes/VoyageMapUnfold';
import { SunriseAlarmClock } from './themes/SunriseAlarmClock';
// We can import other themes here as we build them

interface CeremonyOverlayProps {
  theme: string;
  phase: CeremonyPhase;
  onUnlock: () => void;
  onComplete: () => void;
  senderName?: string;
}

export function CeremonyOverlay({ 
  theme, 
  phase, 
  onUnlock, 
  onComplete,
  senderName 
}: CeremonyOverlayProps) {
  
  // Map themes to components
  const renderTheme = () => {
    switch (theme) {
      case 'birthday':
        return (
          <BirthdayUnwrap 
            onUnlock={() => {
              onUnlock();
              // Small delay to let the celebration finish before fully unmounting
              setTimeout(onComplete, 1000); 
            }}
            senderName={senderName}
          />
        );
      case 'travel':
        return (
          <VoyageMapUnfold 
            onUnlock={() => {
              onUnlock();
              // Small delay to let the celebration finish before fully unmounting
              setTimeout(onComplete, 1000); 
            }}
            senderName={senderName}
          />
        );
      case 'first_day':
        return (
          <SunriseAlarmClock 
            onUnlock={() => {
              onUnlock();
              // Small delay to let the celebration finish before fully unmounting
              setTimeout(onComplete, 1000); 
            }}
            senderName={senderName}
          />
        );
      case 'anniversary':
        // return <AnniversaryWipe ... />;
        return null; // Placeholder
      default:
        // For standard theme or if logic fails, we immediately complete
        // This is a safeguard; normally logic handles this upstream
        return null; 
    }
  };

  return (
    <AnimatePresence>
      {(phase === 'locked' || phase === 'interacting' || phase === 'celebrating') && (
        <motion.div
          key="ceremony-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 z-[100] overflow-hidden rounded-lg"
          style={{ pointerEvents: 'auto' }}
        >
          {renderTheme()}
        </motion.div>
      )}
    </AnimatePresence>
  );
}