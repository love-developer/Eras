/**
 * Echo Timeline Component
 * Displays echoes received on a capsule (for the sender)
 * 
 * Phase 3A + 3B Features:
 * - Smart polling (15s → 30s → 60s exponential backoff)
 * - Pull-to-refresh (mobile)
 * - Focus-based auto-refresh
 * - Page Visibility API integration
 * - Toast notifications for new echoes
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Heart, FileText, Loader2, RefreshCw } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { formatDistanceToNow } from 'date-fns@4.1.0';
import { toast } from 'sonner@2.0.3';

interface Echo {
  id: string;
  capsuleId: string;
  senderId: string;
  senderName: string;
  type: 'emoji' | 'text';
  content: string;
  createdAt: string;
  readBy: string[];
}

interface EchoTimelineProps {
  capsuleId: string;
}

export const EchoTimeline: React.FC<EchoTimelineProps> = ({ capsuleId }) => {
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  
  // Refs for polling and performance
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollDelayRef = useRef(15000); // Start at 15s
  const lastFetchTimeRef = useRef<number>(Date.now());
  const previousEchoCountRef = useRef(0);
  const touchStartYRef = useRef(0);
  const isPullingRef = useRef(false);
  const isMountedRef = useRef(true);

  // Initial fetch
  useEffect(() => {
    fetchEchoes(false);
    previousEchoCountRef.current = 0;
    
    // CRITICAL FIX: Listen for echo-sent events to refresh immediately
    const handleEchoSent = (event: CustomEvent) => {
      const { capsuleId: eventCapsuleId } = event.detail;
      // Only refresh if this timeline is for the same capsule
      if (eventCapsuleId === capsuleId) {
        console.log('💫 [Echo Timeline] Received echo-sent event, refreshing immediately...');
        fetchEchoes(true); // Silent refresh to avoid loading spinner
      }
    };
    
    window.addEventListener('echo-sent', handleEchoSent as EventListener);
    
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('echo-sent', handleEchoSent as EventListener);
    };
  }, [capsuleId]);

  // Smart polling with exponential backoff
  useEffect(() => {
    // Start polling
    const startPolling = () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      
      pollIntervalRef.current = setInterval(() => {
        fetchEchoes(true); // Silent background refresh
      }, pollDelayRef.current);
      
      console.log(`🔄 [Echo Polling] Started (interval: ${pollDelayRef.current}ms)`);
    };
    
    startPolling();
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        console.log('⏹️ [Echo Polling] Stopped');
      }
    };
  }, [capsuleId, pollDelayRef.current]);
  
  // Page Visibility API - pause polling when tab hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden - stop polling
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          console.log('⏸️ [Echo Polling] Paused (tab hidden)');
        }
      } else {
        // Tab visible - refresh immediately and resume polling
        console.log('▶️ [Echo Polling] Resumed (tab visible)');
        fetchEchoes(true);
        
        // Restart polling
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
        pollIntervalRef.current = setInterval(() => {
          fetchEchoes(true);
        }, pollDelayRef.current);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [capsuleId, pollDelayRef.current]);
  
  // Window focus - refresh on focus
  useEffect(() => {
    const handleFocus = () => {
      const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
      
      // Only refresh if it's been more than 10 seconds since last fetch
      if (timeSinceLastFetch > 10000) {
        console.log('👁️ [Echo Timeline] Window focused, refreshing...');
        fetchEchoes(true);
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [capsuleId]);

  const fetchEchoes = async (isSilent = false) => {
    try {
      if (!isSilent && !isLoading) {
        setIsRefreshing(true);
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !isMountedRef.current) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/echoes/${capsuleId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && isMountedRef.current) {
        const newEchoes = data.echoes || [];
        const previousCount = previousEchoCountRef.current;
        const newCount = newEchoes.length;
        
        setEchoes(newEchoes);
        setUnreadCount(data.metadata?.unreadCount || 0);
        lastFetchTimeRef.current = Date.now();
        
        // Detect new echoes and show toast
        if (isSilent && previousCount > 0 && newCount > previousCount) {
          const newEchoesCount = newCount - previousCount;
          toast.success(`${newEchoesCount} new ${newEchoesCount === 1 ? 'echo' : 'echoes'}!`, {
            icon: '💫',
            duration: 3000,
          });
          
          // Reset poll delay to 15s when new activity detected
          pollDelayRef.current = 15000;
          console.log('✨ [Echo Polling] New echoes detected, reset to 15s interval');
        } else if (isSilent && newCount === previousCount) {
          // No changes - apply exponential backoff
          if (pollDelayRef.current < 60000) {
            const oldDelay = pollDelayRef.current;
            pollDelayRef.current = Math.min(pollDelayRef.current * 2, 60000);
            console.log(`⏱️ [Echo Polling] No changes, backoff: ${oldDelay}ms → ${pollDelayRef.current}ms`);
          }
        }
        
        previousEchoCountRef.current = newCount;
        
        // Mark all as read
        if (newEchoes.length > 0) {
          markAllAsRead();
        }
      }
    } catch (error) {
      console.error('Failed to fetch echoes:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
        setPullDistance(0);
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/echoes/mark-all-read`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ capsuleId }),
        }
      );
    } catch (error) {
      console.error('Failed to mark echoes as read:', error);
    }
  };
  
  // Pull-to-refresh handlers (mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only allow pull-to-refresh at top of scroll
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollTop <= 0) {
      touchStartYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPullingRef.current) return;
    
    const touchY = e.touches[0].clientY;
    const distance = touchY - touchStartYRef.current;
    
    // Only show pull indicator if pulling down
    if (distance > 0) {
      setPullDistance(Math.min(distance, 100));
    }
  };
  
  const handleTouchEnd = () => {
    if (isPullingRef.current && pullDistance > 60) {
      // Trigger refresh if pulled far enough
      console.log('🔄 [Pull to Refresh] Triggered');
      fetchEchoes(false);
    } else {
      setPullDistance(0);
    }
    
    isPullingRef.current = false;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (echoes.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No echoes yet</p>
        <p className="text-xs text-slate-500 mt-1">
          Recipients can send echoes when they open your capsule
        </p>
      </div>
    );
  }

  return (
    <div 
      className="space-y-4 relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <AnimatePresence>
        {pullDistance > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute -top-12 left-0 right-0 flex items-center justify-center"
          >
            <div className="bg-slate-800/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 border border-slate-700/50">
              <RefreshCw 
                className={`w-4 h-4 text-violet-400 transition-transform ${
                  pullDistance > 60 ? 'rotate-180' : ''
                }`}
                style={{ 
                  transform: `rotate(${pullDistance * 3.6}deg)` 
                }}
              />
              <span className="text-xs text-slate-300">
                {pullDistance > 60 ? 'Release to refresh' : 'Pull to refresh'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Background refresh indicator - subtle */}
      <AnimatePresence>
        {isRefreshing && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -top-1 right-0 bg-slate-800/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2 border border-violet-500/20"
          >
            <RefreshCw className="w-3 h-3 text-violet-400 animate-spin" />
            <span className="text-xs text-violet-300">Checking...</span>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-violet-400" />
          Echoes ({echoes.length})
        </h3>
        {unreadCount > 0 && (
          <span className="px-2 py-1 text-xs bg-violet-500/20 text-violet-300 rounded-full">
            {unreadCount} new
          </span>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {echoes.map((echo, index) => (
            <motion.div
              key={echo.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Timeline connector */}
              {index < echoes.length - 1 && (
                <div className="absolute left-[18px] top-12 bottom-0 w-0.5 bg-gradient-to-b from-slate-600 to-transparent" />
              )}

              {/* Echo card */}
              <div className="flex gap-3 group">
                {/* Timeline dot */}
                <div className="flex-shrink-0 mt-1">
                  <motion.div
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-lg"
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(139, 92, 246, 0.3)',
                        '0 0 30px rgba(139, 92, 246, 0.5)',
                        '0 0 20px rgba(139, 92, 246, 0.3)',
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    {echo.type === 'emoji' ? (
                      <span className="text-lg">{echo.content.length <= 2 ? echo.content : '💬'}</span>
                    ) : (
                      <FileText className="w-4 h-4 text-white" />
                    )}
                  </motion.div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="bg-slate-800/70 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 group-hover:border-slate-600 transition-all">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-slate-200 truncate">
                          {echo.senderName}
                        </span>
                        {echo.type === 'emoji' && (
                          <span className="text-xs text-slate-500">reacted</span>
                        )}
                        {echo.type === 'text' && (
                          <span className="text-xs text-slate-500">sent a note</span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0">
                        {formatDistanceToNow(new Date(echo.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Content */}
                    {echo.type === 'emoji' ? (
                      <div className="text-4xl">{echo.content}</div>
                    ) : (
                      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {echo.content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};