import { useState, useEffect } from 'react';

export function useActivityTracking(activeTab, showQuickRecorder) {
  const [lastUserActivity, setLastUserActivity] = useState(Date.now());

  useEffect(() => {
    const updateActivity = () => {
      const now = Date.now();
      setLastUserActivity(now);
      
      try {
        sessionStorage.setItem('eras-last-activity', now.toString());
        
        if (activeTab === 'create' || activeTab === 'editor' || showQuickRecorder) {
          sessionStorage.setItem('eras-work-tab-active', 'true');
          sessionStorage.setItem('eras-work-tab-name', activeTab);
        } else {
          sessionStorage.removeItem('eras-work-tab-active');
        }
      } catch (e) {
        // Ignore storage errors
      }
    };
    
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'focus', 'input', 'change'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [activeTab, showQuickRecorder]);

  return {
    lastUserActivity
  };
}
