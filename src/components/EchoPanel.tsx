/**
 * Echo Panel Component
 * Allows recipients to send echoes (reactions) to capsules
 * Phase 1: Emoji and text echoes only
 */

import React, { useState } from 'react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Laugh, Frown, PartyPopper, AlertCircle, Sparkles, MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { EchoTextModal } from './EchoTextModal';

interface EchoPanelProps {
  capsuleId: string;
  onEchoSent?: () => void;
}

const QUICK_EMOJIS = [
  { emoji: '❤️', label: 'Love', icon: Heart, color: '#ef4444' },
  { emoji: '😂', label: 'Funny', icon: Laugh, color: '#f59e0b' },
  { emoji: '😢', label: 'Touching', icon: Frown, color: '#3b82f6' },
  { emoji: '🎉', label: 'Celebrate', icon: PartyPopper, color: '#10b981' },
  { emoji: '😮', label: 'Amazing', icon: AlertCircle, color: '#8b5cf6' },
  { emoji: '✨', label: 'Special', icon: Sparkles, color: '#ec4899' },
];

export const EchoPanel: React.FC<EchoPanelProps> = ({ capsuleId, onEchoSent }) => {
  const [isSending, setIsSending] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [sentEmoji, setSentEmoji] = useState<string | null>(null);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [isLoadingReaction, setIsLoadingReaction] = useState(true);

  // Load user's existing reaction on mount
  React.useEffect(() => {
    const loadUserReaction = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsLoadingReaction(false);
          return;
        }

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/echoes/${capsuleId}/my-reaction`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSelectedReaction(data.reaction);
        }
      } catch (error) {
        console.error('Failed to load user reaction:', error);
      } finally {
        setIsLoadingReaction(false);
      }
    };

    loadUserReaction();
  }, [capsuleId]);

  const sendEcho = async (type: 'emoji' | 'text', content: string) => {
    console.log(`🚀 [EchoPanel] Starting echo send: type="${type}", content="${content}", capsuleId="${capsuleId}"`);
    setIsSending(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ [EchoPanel] No session found - user not logged in');
        toast.error('Please sign in to send an echo');
        return;
      }

      console.log(`🔑 [EchoPanel] Session found, sending request to server...`);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/echoes/send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            capsuleId,
            type,
            content,
          }),
        }
      );

      console.log(`📡 [EchoPanel] Server response status: ${response.status} ${response.statusText}`);
      const data = await response.json();
      console.log(`📦 [EchoPanel] Server response data:`, data);

      if (!response.ok) {
        // Handle 403 Forbidden (unauthorized access)
        if (response.status === 403) {
          console.error('❌ [EchoPanel] 403 Forbidden - user not authorized for this capsule');
          throw new Error('You don\'t have permission to interact with this capsule');
        }
        console.error(`❌ [EchoPanel] Server error: ${data.error}`);
        throw new Error(data.error || 'Failed to send echo');
      }

      console.log(`✅ [EchoPanel] Echo sent successfully!`);

      // Haptic feedback on successful send
      try {
        if ('vibrate' in navigator) {
          navigator.vibrate([40, 30, 40]); // Success vibration pattern
        }
      } catch (err) {
        // Haptics not supported
      }

      if (type === 'emoji') {
        setSentEmoji(content);
        setTimeout(() => setSentEmoji(null), 2000);
        toast.success('Echo sent! 💫', {
          description: 'Everyone can see your reaction',
        });
        setSelectedReaction(content); // Update local state immediately for instant feedback
        console.log(`🎉 [EchoPanel] Emoji reaction "${content}" sent and UI updated`);
      } else {
        toast.success('Note sent! ✍️', {
          description: 'Your message has been shared',
        });
        console.log(`✍️ [EchoPanel] Text note sent successfully`);
      }

      onEchoSent?.();
      console.log(`🔄 [EchoPanel] onEchoSent callback triggered`);
      
      // CRITICAL FIX: Dispatch custom event to trigger immediate timeline refresh
      // This ensures the timeline refreshes immediately instead of waiting for polling interval
      window.dispatchEvent(new CustomEvent('echo-sent', { 
        detail: { capsuleId, type, content } 
      }));
      console.log(`📡 [EchoPanel] Dispatched echo-sent event for immediate timeline refresh`);
    } catch (error) {
      console.error('❌❌❌ [EchoPanel] FAILED to send echo:', error);
    } finally {
      setIsSending(false);
      console.log(`🏁 [EchoPanel] Echo send operation complete (isSending = false)`);
    }
  };

  const handleEmojiClick = async (emoji: string) => {
    // Users can only react once - all emoji buttons disabled after selecting
    if (selectedReaction) {
      toast.info('You\'ve already reacted', {
        description: 'You can only send one emoji reaction per capsule',
      });
      return;
    }
    
    // First reaction - send it
    await sendEcho('emoji', emoji);
  };

  const handleTextSubmit = (text: string) => {
    sendEcho('text', text);
    setShowTextModal(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="relative"
      >
        {/* Cosmic background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-violet-500/10 rounded-2xl -z-10" />
        
        {/* Animated stars */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/40 rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="relative bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <h3 className="text-lg font-semibold text-slate-100">Send an Echo</h3>
          </div>

          {/* Quick emoji reactions - 3x2 grid on all devices */}
          <div className="mb-6">
            {selectedReaction && (
              <div className="mb-3 text-center">
                <p className="text-xs text-slate-400">
                  You reacted with {selectedReaction} • You can still send notes below
                </p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4 md:gap-6">
              {QUICK_EMOJIS.map((item) => {
                const isSelected = selectedReaction === item.emoji;
                const isDisabled = selectedReaction && !isSelected; // Disable if another emoji is selected
                return (
                  <motion.button
                    key={item.emoji}
                    onClick={() => handleEmojiClick(item.emoji)}
                    disabled={isSending || isLoadingReaction || isDisabled}
                    whileHover={!isDisabled ? { scale: 1.1 } : {}}
                    whileTap={!isDisabled ? { scale: 0.9 } : {}}
                    className={`relative flex items-center justify-center py-4 md:py-6 touch-manipulation ${
                      isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    {/* Glow on selected */}
                    {isSelected && (
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `radial-gradient(circle, ${item.color}60 0%, transparent 70%)`,
                        }}
                        animate={{
                          opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                        }}
                      />
                    )}
                    
                    {/* Emoji - responsive size */}
                    <span 
                      className={`relative transition-all ${
                        isSelected 
                          ? 'drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]' 
                          : isDisabled
                          ? 'opacity-20 grayscale'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{ fontSize: '2.5rem', lineHeight: 1 }}
                    >
                      {item.emoji}
                    </span>
                  
                    {/* Sent animation */}
                    <AnimatePresence>
                      {sentEmoji === item.emoji && (
                        <motion.div
                          initial={{ scale: 1, opacity: 1 }}
                          animate={{ scale: 2, opacity: 0, y: -40 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1 }}
                          className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                          <span style={{ fontSize: '3rem' }}>{item.emoji}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Text note button */}
          <div className="pt-4 border-t border-slate-700/50">
            <Button
              onClick={() => setShowTextModal(true)}
              disabled={isSending}
              variant="outline"
              className="w-full border-slate-600 text-slate-200 hover:bg-slate-700/50 hover:border-slate-500 transition-all"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Write a Note
            </Button>
          </div>

          {/* Loading state */}
          {isSending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm rounded-2xl flex items-center justify-center"
            >
              <div className="flex items-center gap-2 text-slate-200">
                <Send className="w-5 h-5 animate-pulse" />
                <span>Sending echo...</span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Text modal */}
      <EchoTextModal
        isOpen={showTextModal}
        onClose={() => setShowTextModal(false)}
        onSubmit={handleTextSubmit}
      />
    </>
  );
};