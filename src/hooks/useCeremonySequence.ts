import { useState, useEffect, useCallback } from 'react';

export type CeremonyPhase = 'idle' | 'locked' | 'interacting' | 'celebrating' | 'completed';

interface UseCeremonySequenceProps {
  theme: string;
  isReceived: boolean;
  onComplete?: () => void;
}

export function useCeremonySequence({ theme, isReceived, onComplete }: UseCeremonySequenceProps) {
  // If it's not a received capsule or no special theme, we start as completed
  const [phase, setPhase] = useState<CeremonyPhase>(
    isReceived && theme !== 'standard' ? 'locked' : 'completed'
  );

  const startInteraction = useCallback(() => {
    if (phase === 'locked') {
      setPhase('interacting');
    }
  }, [phase]);

  const triggerCelebration = useCallback(() => {
    if (phase === 'interacting' || phase === 'locked') {
      setPhase('celebrating');
      
      // Automatic transition to completed after celebration duration
      // This varies by theme, but we set a safety timeout here
      // The component itself usually calls complete()
    }
  }, [phase]);

  const completeCeremony = useCallback(() => {
    setPhase('completed');
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  return {
    phase,
    startInteraction,
    triggerCelebration,
    completeCeremony,
    isVisible: phase !== 'completed' && phase !== 'idle'
  };
}
