/**
 * Developer helpers for Eras Odyssey
 * These are exposed to window for easy console access
 */

export const odysseyDevHelpers = {
  /**
   * Clear all tutorial flags and show it again
   */
  reset: () => {
    localStorage.removeItem('eras-onboarding-completed');
    localStorage.removeItem('eras-onboarding-dont-show-again');
    localStorage.removeItem('eras_odyssey_completed');
    localStorage.removeItem('eras_odyssey_skipped');
    localStorage.removeItem('eras_odyssey_completion_date');
    console.log('✅ Tutorial reset! Click "Tutorial" in gear menu or reload page.');
  },

  /**
   * Show current tutorial status
   */
  status: () => {
    const completed = localStorage.getItem('eras_odyssey_completed');
    const skipped = localStorage.getItem('eras_odyssey_skipped');
    const completionDate = localStorage.getItem('eras_odyssey_completion_date');
    const legacyCompleted = localStorage.getItem('eras-onboarding-completed');
    
    console.log('📊 Eras Odyssey Status:');
    console.log('  Completed:', completed || 'No');
    console.log('  Skipped:', skipped || 'No');
    console.log('  Completion Date:', completionDate ? new Date(completionDate).toLocaleString() : 'N/A');
    console.log('  Legacy Tutorial:', legacyCompleted || 'No');
    
    return {
      completed: !!completed,
      skipped: !!skipped,
      completionDate: completionDate ? new Date(completionDate) : null,
      legacyCompleted: !!legacyCompleted
    };
  },

  /**
   * Mark as completed (for testing)
   */
  complete: () => {
    localStorage.setItem('eras_odyssey_completed', 'true');
    localStorage.setItem('eras_odyssey_completion_date', new Date().toISOString());
    console.log('✅ Marked as completed');
  },

  /**
   * Mark as skipped (for testing)
   */
  skip: () => {
    localStorage.setItem('eras_odyssey_skipped', 'true');
    console.log('⏭️ Marked as skipped');
  },

  /**
   * Show help
   */
  help: () => {
    console.log(`
🚀 Eras Odyssey Dev Helpers
===========================

Available commands (type in console):

  odyssey.reset()     - Clear all flags, show tutorial again
  odyssey.status()    - Check current tutorial status
  odyssey.complete()  - Mark as completed (testing)
  odyssey.skip()      - Mark as skipped (testing)
  odyssey.help()      - Show this help

Quick Start:
1. odyssey.reset()
2. Click "Tutorial" in gear menu (⚙️)
3. Enjoy the show! 🎉

Tip: Use window.clearTutorial() as a shortcut for reset()
    `);
  }
};

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as any).odyssey = odysseyDevHelpers;
  
  // Show help on first load (in dev mode)
  if (process.env.NODE_ENV === 'development') {
    console.log('💡 Eras Odyssey dev helpers loaded! Type "odyssey.help()" for commands.');
  }
}

export default odysseyDevHelpers;
