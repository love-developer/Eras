import React, { useRef, useState } from 'react';
import { RefreshCw, ArrowDown } from 'lucide-react';
import { motion } from 'motion/react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
}

export function PullToRefresh({ onRefresh, children, disabled = false, scrollContainerRef }: PullToRefreshProps & { scrollContainerRef?: React.RefObject<HTMLElement> }) {
  const [pullHeight, setPullHeight] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const [isPulling, setIsPulling] = useState(false);

  // Maximum pull distance
  const MAX_PULL = 120;
  // Threshold to trigger refresh
  const THRESHOLD = 70;

  const getScrollY = () => {
    if (scrollContainerRef?.current) {
      return scrollContainerRef.current.scrollTop;
    }
    return window.scrollY;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    // Only enable if we are at the top of the page
    if (getScrollY() <= 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    // Only handle pull down
    if (diff > 0 && getScrollY() <= 0) {
      // Add resistance
      const newHeight = Math.min(diff * 0.4, MAX_PULL);
      setPullHeight(newHeight);
      
      // Prevent default scrolling only if we are effectively pulling
      if (newHeight > 10) {
        // We can't preventDefault here easily because it's a passive listener usually
        // But in React 18+ it might work if not passive
      }
    } else {
      setPullHeight(0);
      setIsPulling(false);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling || disabled || isRefreshing) return;
    
    setIsPulling(false);
    
    if (pullHeight >= THRESHOLD) {
      setIsRefreshing(true);
      setPullHeight(THRESHOLD); // Stay at threshold while refreshing
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullHeight(0);
      }
    } else {
      setPullHeight(0); // Snap back
    }
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Refresh Indicator */}
      <div 
        className="fixed top-0 left-0 w-full flex justify-center items-center pointer-events-none z-50 transition-transform duration-200"
        style={{ 
          transform: `translateY(${pullHeight > 0 ? pullHeight - 40 : -100}px)`,
          opacity: pullHeight > 0 ? Math.min(pullHeight / THRESHOLD, 1) : 0
        }}
      >
        <div className="bg-white dark:bg-slate-800 rounded-full p-2 shadow-lg border border-slate-200 dark:border-slate-700">
          {isRefreshing ? (
            <RefreshCw className="w-5 h-5 text-purple-600 animate-spin" />
          ) : (
            <ArrowDown 
              className="w-5 h-5 text-purple-600 transition-transform duration-200" 
              style={{ transform: `rotate(${pullHeight >= THRESHOLD ? 180 : 0}deg)` }}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <motion.div
        animate={{ y: pullHeight }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
