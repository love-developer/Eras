/**
 * Echo Social Timeline Component
 * PHASE 1: Social Echo System
 * 
 * Displays ALL echoes from ALL recipients in a Facebook/Instagram-style timeline
 * Features:
 * - Emoji grouping (groups reactions by emoji type)
 * - Real-time updates via Supabase Broadcast Channels
 * - Fallback polling if broadcast fails
 * - Shows sender name, avatar, and timestamp
 * - Excludes sender's own echoes from the view
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Loader2, User } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { formatDistanceToNow } from 'date-fns@4.1.0';
import { CommentReactions } from './CommentReactions';

interface Echo {
  id: string;
  capsuleId: string;
  senderId: string;
  senderName: string;
  type: 'emoji' | 'text';
  content: string;
  createdAt: string;
  readBy: string[];
  commentReactions?: {
    [emoji: string]: string[];
  };
}

interface EmojiGroup {
  emoji: string;
  echoes: Echo[];
  count: number;
}

interface EchoSocialTimelineProps {
  capsuleId: string;
}

export const EchoSocialTimeline: React.FC<EchoSocialTimelineProps> = ({ capsuleId }) => {
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Refs for real-time and fallback
  const channelRef = useRef<any>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const broadcastFailedRef = useRef(false);

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchEchoes();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [capsuleId]);

  // Set up Supabase Broadcast Channel for real-time updates
  useEffect(() => {
    if (!capsuleId) return;

    console.log(`📡 [Echo Social] Setting up broadcast channel for capsule ${capsuleId}`);

    try {
      // Create broadcast channel
      const channel = supabase.channel(`echoes:${capsuleId}`, {
        config: {
          broadcast: { self: false }, // Don't receive our own broadcasts
        },
      });

      // Listen for new echoes
      channel
        .on('broadcast', { event: 'new-echo' }, (payload) => {
          console.log('✨ [Echo Social] Received new echo via broadcast:', payload);
          
          if (payload.payload?.echo && isMountedRef.current) {
            const newEcho = payload.payload.echo;
            
            // Don't show sender's own echo in their view
            if (currentUserId && newEcho.senderId === currentUserId) {
              console.log('🚫 [Echo Social] Skipping own echo');
              return;
            }
            
            // Add new echo with animation
            setEchoes(prev => {
              // Check if echo already exists
              if (prev.some(e => e.id === newEcho.id)) {
                return prev;
              }
              // Add and sort by timestamp
              return [...prev, newEcho].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
            });
          }
        })
        .subscribe((status) => {
          console.log(`📡 [Echo Social] Channel status: ${status}`);
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ [Echo Social] Broadcast channel connected');
            broadcastFailedRef.current = false;
            
            // Stop polling since broadcast is working
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
              console.log('⏹️ [Echo Social] Stopped polling (using broadcast)');
            }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            // Broadcast not available - use polling fallback (this is normal if Realtime is not enabled)
            console.log('📊 [Echo Social] Using polling fallback (Realtime broadcast not available)');
            broadcastFailedRef.current = true;
            startFallbackPolling();
          }
        });

      channelRef.current = channel;

      // Cleanup
      return () => {
        console.log('🧹 [Echo Social] Cleaning up broadcast channel');
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
      };
    } catch (error) {
      console.error('⚠️ [Echo Social] Broadcast setup failed:', error);
      broadcastFailedRef.current = true;
      startFallbackPolling();
    }
  }, [capsuleId, currentUserId]);

  // Fallback polling if broadcast fails (Facebook approach)
  const startFallbackPolling = () => {
    if (pollIntervalRef.current) return; // Already polling
    
    console.log('🔄 [Echo Social] Starting fallback polling (10s interval)');
    
    pollIntervalRef.current = setInterval(() => {
      if (isMountedRef.current && broadcastFailedRef.current) {
        fetchEchoes(true); // Silent refresh
      }
    }, 10000); // 10 second polling
  };

  const fetchEchoes = async (isSilent = false) => {
    try {
      if (!isSilent) {
        setIsLoading(true);
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !isMountedRef.current) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/echoes/${capsuleId}/social`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && isMountedRef.current) {
        const allEchoes = data.echoes || [];
        
        // Filter out current user's own echoes (don't show sender their own echoes)
        const filteredEchoes = allEchoes.filter((echo: Echo) => 
          echo.senderId !== currentUserId
        );
        
        setEchoes(filteredEchoes);
      }
    } catch (error) {
      console.error('Failed to fetch social echoes:', error);
      
      // Start polling on fetch error
      if (!pollIntervalRef.current) {
        broadcastFailedRef.current = true;
        startFallbackPolling();
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  // Group echoes by emoji
  const groupEchoesByEmoji = (): EmojiGroup[] => {
    const emojiMap = new Map<string, Echo[]>();
    
    // Only group emoji reactions, not text notes
    const emojiEchoes = echoes.filter(echo => echo.type === 'emoji');
    
    emojiEchoes.forEach(echo => {
      const emoji = echo.content;
      if (!emojiMap.has(emoji)) {
        emojiMap.set(emoji, []);
      }
      emojiMap.get(emoji)!.push(echo);
    });
    
    // Convert to array and sort by count (most popular first)
    return Array.from(emojiMap.entries())
      .map(([emoji, echoes]) => ({
        emoji,
        echoes: echoes.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
        count: echoes.length,
      }))
      .sort((a, b) => b.count - a.count);
  };

  // Get text notes (separate from emoji reactions)
  const getTextNotes = (): Echo[] => {
    return echoes
      .filter(echo => echo.type === 'text')
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
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
          Be the first to send an echo! ✨
        </p>
      </div>
    );
  }

  const emojiGroups = groupEchoesByEmoji();
  const textNotes = getTextNotes();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-violet-400" />
          Echoes ({echoes.length})
        </h3>
      </div>

      {/* Emoji Groups */}
      {emojiGroups.length > 0 && (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {emojiGroups.map((group, groupIndex) => (
              <motion.div
                key={group.emoji}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: groupIndex * 0.1 }}
                className="relative"
              >
                {/* Emoji Group Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))',
                      boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
                    }}
                  >
                    {group.emoji}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-300">
                      {group.count} {group.count === 1 ? 'reaction' : 'reactions'}
                    </h4>
                  </div>
                </div>

                {/* Echo Items in Group */}
                <div className="ml-6 space-y-2 border-l-2 border-violet-500/20 pl-4">
                  {group.echoes.map((echo, index) => (
                    <motion.div
                      key={echo.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (groupIndex * 0.1) + (index * 0.05) }}
                      className="flex items-center gap-3 py-2 group"
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-sm font-medium ring-2 ring-violet-500/30">
                          <User className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Name and Timestamp */}
                      <div className="flex-1 min-w-0 flex items-baseline gap-2">
                        <span className="font-medium text-slate-300 truncate">
                          {echo.senderName}
                        </span>
                        <span className="text-xs text-slate-500 flex-shrink-0">
                          {formatDistanceToNow(new Date(echo.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Text Notes Section */}
      {textNotes.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-700/50 overflow-visible">
          <h4 className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Notes ({textNotes.length})
          </h4>
          
          <AnimatePresence mode="popLayout">
            {textNotes.map((echo, index) => (
              <motion.div
                key={echo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50 overflow-visible"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-sm font-medium ring-2 ring-violet-500/30">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-slate-300">
                      {echo.senderName}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 flex-shrink-0">
                    {formatDistanceToNow(new Date(echo.createdAt), { addSuffix: true })}
                  </span>
                </div>

                {/* Note Content */}
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap break-words ml-10 mb-3">
                  {echo.content}
                </p>

                {/* Comment Reactions */}
                <div className="ml-10 mt-3 flex items-center overflow-visible">
                  <CommentReactions 
                    echoId={echo.id}
                    capsuleId={echo.capsuleId}
                    reactions={echo.commentReactions || {}}
                    compact={true}
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};