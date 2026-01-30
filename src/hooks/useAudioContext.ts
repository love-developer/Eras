import { useRef, useCallback, useEffect } from 'react';

/**
 * Shared AudioContext hook with proper cleanup
 * Prevents memory leaks and improves performance
 */

// Global singleton AudioContext (reused across all components)
let globalAudioContext: AudioContext | null = null;

export function useAudioContext() {
  const isInitialized = useRef(false);

  const getContext = useCallback((): AudioContext | null => {
    if (!globalAudioContext) {
      try {
        globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        isInitialized.current = true;
      } catch (e) {
        console.warn('AudioContext not supported');
        return null;
      }
    }
    return globalAudioContext;
  }, []);

  const playSound = useCallback((
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    gain: number = 0.3
  ) => {
    const ctx = getContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    oscillator.type = type;

    gainNode.gain.setValueAtTime(gain, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, [getContext]);

  const playChord = useCallback((
    frequencies: number[],
    duration: number = 1.5,
    stagger: number = 0.1
  ) => {
    const ctx = getContext();
    if (!ctx) return;

    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.2, ctx.currentTime + i * stagger);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime + i * stagger);
      oscillator.stop(ctx.currentTime + duration);
    });
  }, [getContext]);

  // Don't close the global context on unmount (it's shared)
  // It will be closed when the user leaves the app

  return {
    playSound,
    playChord,
    getContext,
  };
}

// Close the global audio context (call when app is closing)
export function closeGlobalAudioContext() {
  if (globalAudioContext) {
    globalAudioContext.close();
    globalAudioContext = null;
  }
}
