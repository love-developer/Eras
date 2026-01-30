/**
 * Unified Home Component
 * 
 * Combines Timeline, Classic, and Calendar views into one tab with a segmented control switcher.
 * - Classic: Grid + stats (Dashboard)
 * - Timeline: Activity stream (MemoryFeed)
 * - Calendar: Month/week calendar view (CalendarView)
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { MemoryFeed } from './MemoryFeed';
import { Dashboard } from './Dashboard';
import { CalendarView } from './CalendarView';

interface UnifiedHomeProps {
  user: any;
  onViewCapsule?: (capsule: any) => void;
  onCreateCapsule?: (date?: Date) => void; // Optional date parameter for Quick Add
  onEditCapsule?: (capsule: any) => void;
  onEditCapsuleDetails?: (capsule: any) => void; // Added prop
  initialViewingCapsuleId?: string | null;
  viewingCapsuleFromNotification?: string | null;
  onOpenVault?: () => void;
  onClearNotificationCapsuleId?: () => void; // Added prop for clearing notification ID
}

type HomeView = 'classic' | 'timeline' | 'calendar';

export function UnifiedHome({ 
  user, 
  onViewCapsule, 
  onCreateCapsule, 
  onEditCapsule,
  onEditCapsuleDetails,
  initialViewingCapsuleId,
  viewingCapsuleFromNotification,
  onOpenVault,
  onClearNotificationCapsuleId
}: UnifiedHomeProps) {
  // Get saved preference from localStorage or default to Classic
  const getDefaultView = (): HomeView => {
    // Check localStorage for persistent preference across sessions
    const saved = localStorage.getItem('eras-home-view');
    if (saved === 'timeline' || saved === 'classic' || saved === 'calendar') {
      return saved as HomeView;
    }
    
    // Default: Always start with Classic view on first visit
    return 'classic';
  };

  const [activeView, setActiveView] = useState<HomeView>(getDefaultView);

  // Save preference to localStorage (persists across sessions)
  useEffect(() => {
    localStorage.setItem('eras-home-view', activeView);
  }, [activeView]);

  // Listen for external changes to localStorage (e.g., from dropdown menu)
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('eras-home-view');
      if (saved && (saved === 'timeline' || saved === 'classic' || saved === 'calendar')) {
        if (saved !== activeView) {
          console.log(`📲 External view change detected: ${activeView} → ${saved}`);
          setActiveView(saved as HomeView);
        }
      }
    };

    // Check on window focus (when user returns to tab)
    window.addEventListener('focus', handleStorageChange);
    
    // Also check periodically (for same-tab changes)
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener('focus', handleStorageChange);
      clearInterval(interval);
    };
  }, [activeView]);

  // Handle view change with logging
  const handleViewChange = (view: HomeView) => {
    console.log(`🔄 Home view switching: ${activeView} → ${view}`);
    setActiveView(view);
  };

  // Mobile swipe gesture support
  const handleDragEnd = (event: any, info: PanInfo) => {
    const swipeThreshold = 50; // Minimum swipe distance in pixels
    const swipeVelocity = 500; // Minimum velocity for quick swipes
    
    // Get current view index
    const views: HomeView[] = ['classic', 'timeline', 'calendar'];
    const currentIndex = views.indexOf(activeView);
    
    // Determine swipe direction
    const isSwipeLeft = info.offset.x < -swipeThreshold || info.velocity.x < -swipeVelocity;
    const isSwipeRight = info.offset.x > swipeThreshold || info.velocity.x > swipeVelocity;
    
    // Navigate to next/previous view
    if (isSwipeLeft && currentIndex < views.length - 1) {
      // Swipe left = next view
      handleViewChange(views[currentIndex + 1]);
    } else if (isSwipeRight && currentIndex > 0) {
      // Swipe right = previous view
      handleViewChange(views[currentIndex - 1]);
    }
  };

  return (
    <div className="relative h-full">
      {/* Sticky Header with Segmented Control */}
      <div className="sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 -mt-3 sm:mt-0">
          <div className="flex items-center justify-center">
            {/* Segmented Control - Centered with 3 options */}
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
              {/* Classic button */}
              <button
                onClick={() => handleViewChange('classic')}
                className={`
                  relative px-2 sm:px-3 py-3.5 sm:py-2 rounded-lg text-[9px] sm:text-sm font-bold
                  transition-all duration-300 ease-out whitespace-nowrap min-w-[88px] sm:min-w-0
                  ${activeView === 'classic' 
                    ? 'text-slate-800 dark:text-slate-100' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }
                `}
              >
                {/* Active background */}
                {activeView === 'classic' && (
                  <motion.div
                    layoutId="activeViewBg"
                    className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                
                <span className="relative flex items-center justify-center gap-0.5 sm:gap-1">
                  <span className="text-sm sm:text-base">📊</span>
                  <span>Classic</span>
                </span>
              </button>
              
              {/* Timeline button */}
              <button
                onClick={() => handleViewChange('timeline')}
                className={`
                  relative px-2 sm:px-3 py-3.5 sm:py-2 rounded-lg text-[9px] sm:text-sm font-bold
                  transition-all duration-300 ease-out whitespace-nowrap min-w-[88px] sm:min-w-0
                  ${activeView === 'timeline' 
                    ? 'text-slate-800 dark:text-slate-100' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }
                `}
              >
                {/* Active background */}
                {activeView === 'timeline' && (
                  <motion.div
                    layoutId="activeViewBg"
                    className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                
                <span className="relative flex items-center justify-center gap-0.5 sm:gap-1">
                  <span className="text-sm sm:text-base">📜</span>
                  <span>Timeline</span>
                </span>
              </button>

              {/* Calendar button - NEW */}
              <button
                onClick={() => handleViewChange('calendar')}
                className={`
                  relative px-2 sm:px-3 py-3.5 sm:py-2 rounded-lg text-[9px] sm:text-sm font-bold
                  transition-all duration-300 ease-out whitespace-nowrap min-w-[88px] sm:min-w-0
                  ${activeView === 'calendar' 
                    ? 'text-slate-800 dark:text-slate-100' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }
                `}
              >
                {/* Active background */}
                {activeView === 'calendar' && (
                  <motion.div
                    layoutId="activeViewBg"
                    className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                
                <span className="relative flex items-center justify-center gap-0.5 sm:gap-1">
                  <span className="text-sm sm:text-base">📅</span>
                  <span>Calendar</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View Content with Fade Transition + Swipe Support */}
      <motion.div 
        className="relative"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        dragDirectionLock
      >
        {/* Classic View - Always mounted, hidden with CSS */}
        <div 
          className={activeView === 'classic' ? 'block' : 'hidden'}
          style={{ 
            opacity: activeView === 'classic' ? 1 : 0,
            transition: 'opacity 0.2s ease-out'
          }}
        >
          <Dashboard 
            user={user}
            onEditCapsule={onEditCapsule}
            onEditCapsuleDetails={onEditCapsuleDetails}
            onCreateCapsule={onCreateCapsule}
            onOpenCapsule={onViewCapsule}
            initialViewingCapsuleId={viewingCapsuleFromNotification}
            onOpenVault={onOpenVault}
            onClearNotificationCapsuleId={onClearNotificationCapsuleId}
          />
        </div>

        {/* Timeline View - Always mounted, hidden with CSS */}
        <div 
          className={activeView === 'timeline' ? 'block' : 'hidden'}
          style={{ 
            opacity: activeView === 'timeline' ? 1 : 0,
            transition: 'opacity 0.2s ease-out'
          }}
        >
          <MemoryFeed 
            user={user}
            onViewCapsule={onViewCapsule}
            onCreateCapsule={onCreateCapsule}
            initialViewingCapsuleId={initialViewingCapsuleId}
          />
        </div>

        {/* Calendar View - Always mounted, hidden with CSS */}
        <div 
          className={activeView === 'calendar' ? 'block' : 'hidden'}
          style={{ 
            opacity: activeView === 'calendar' ? 1 : 0,
            transition: 'opacity 0.2s ease-out'
          }}
        >
          <CalendarView 
            onViewCapsule={onViewCapsule}
            onCreateCapsule={onCreateCapsule}
          />
        </div>
      </motion.div>
    </div>
  );
}