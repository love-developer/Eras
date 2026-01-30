/**
 * Helper to clear old tutorial flags and ensure new Odyssey shows
 * Call this from console if you want to reset the tutorial:
 * import { clearOldTutorialFlags } from './utils/clearOldTutorial'
 * clearOldTutorialFlags()
 */
export function clearOldTutorialFlags() {
  localStorage.removeItem('eras-onboarding-completed');
  localStorage.removeItem('eras-onboarding-dont-show-again');
  localStorage.removeItem('eras_odyssey_completed');
  localStorage.removeItem('eras_odyssey_skipped');
  localStorage.removeItem('eras_odyssey_completion_date');
  
  console.log('✅ Tutorial flags cleared! Reload to see the Odyssey.');
}

// Expose to window for easy console access
if (typeof window !== 'undefined') {
  (window as any).clearTutorial = clearOldTutorialFlags;
}
