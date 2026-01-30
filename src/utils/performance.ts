/**
 * ⚡ PERFORMANCE UTILITIES
 * Helper functions for optimizing performance, especially on mobile devices
 */

/**
 * Determines optimal particle count based on device capabilities
 * Mobile devices get significantly reduced particle counts
 */
export function getOptimalParticleCount(baseCount: number): number {
  // Check if mobile (screen width < 768px)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  if (isMobile) {
    // Mobile: Reduce to 10% of base count (e.g., 150 → 15)
    return Math.max(Math.floor(baseCount * 0.1), 5);
  }
  
  // Desktop: Use full count
  return baseCount;
}

/**
 * Determines optimal animation duration based on device
 * Mobile devices get faster animations
 */
export function getOptimalDuration(baseDuration: number): number {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  if (isMobile) {
    // Mobile: 60% of base duration (e.g., 3000ms → 1800ms)
    return Math.floor(baseDuration * 0.6);
  }
  
  return baseDuration;
}

/**
 * Checks if device should skip heavy effects
 * Returns true if device is low-powered or prefers reduced motion
 */
export function shouldReduceEffects(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Check if mobile
  const isMobile = window.innerWidth < 768;
  
  // Check for low-end device indicators
  const isLowEnd = navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 4 : false;
  
  return prefersReducedMotion || (isMobile && isLowEnd);
}
