/**
 * Comment Reactions Component
 * Reusable reaction component for Echo comments/notes
 * Supports both capsule-level and comment-level reactions
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner';

const REACTION_EMOJIS = [
  { emoji: '👍', label: 'Like' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '😂', label: 'Haha' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😠', label: 'Angry' }
];

interface CommentReactionsProps {
  echoId: string;
  capsuleId: string;
  reactions?: { [emoji: string]: string[] };
  compact?: boolean;
  className?: string;
}

export const CommentReactions: React.FC<CommentReactionsProps> = ({
  echoId,
  capsuleId,
  reactions = {},
  compact = false,
  className = ''
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [currentReactions, setCurrentReactions] = useState(reactions);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const instanceId = useRef(`reaction-picker-${Math.random()}`);

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

  // Listen for other pickers opening (singleton pattern)
  useEffect(() => {
    const handlePickerOpen = (e: CustomEvent) => {
      if (e.detail.instanceId !== instanceId.current && showPicker) {
        console.log('💬 [CommentReactions] Another picker opened, closing this one');
        setShowPicker(false);
      }
    };

    window.addEventListener('reaction-picker-open', handlePickerOpen as EventListener);
    return () => {
      window.removeEventListener('reaction-picker-open', handlePickerOpen as EventListener);
    };
  }, [showPicker]);

  // Update reactions when prop changes
  useEffect(() => {
    setCurrentReactions(reactions);
  }, [reactions]);

  // Get user's current reaction
  const getUserReaction = (): string | null => {
    if (!currentUserId) return null;
    
    for (const emoji of Object.keys(currentReactions)) {
      if (currentReactions[emoji]?.includes(currentUserId)) {
        return emoji;
      }
    }
    return null;
  };

  const userReaction = getUserReaction();

  // Handle reaction
  const handleReaction = async (emoji: string) => {
    console.log('💬 [CommentReactions] handleReaction called:', { emoji, currentUserId, isSubmitting });
    
    if (!currentUserId || isSubmitting) {
      console.log('💬 [CommentReactions] Blocked - no user or submitting');
      return;
    }

    setIsSubmitting(true);
    setShowPicker(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        console.error('💬 [CommentReactions] No auth token');
        toast.error('Authentication required');
        setIsSubmitting(false);
        return;
      }
      
      console.log('💬 [CommentReactions] Sending reaction:', { emoji, echoId, capsuleId });

      // If clicking the same emoji, remove reaction
      if (userReaction === emoji) {
        console.log('💬 [CommentReactions] Removing reaction');
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/echoes/${echoId}/react-comment`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ capsuleId })
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log('✅ [CommentReactions] Reaction removed successfully:', data);
          setCurrentReactions(data.commentReactions || {});
          toast.success('Reaction removed');
        } else {
          const error = await response.text();
          console.error('❌ [CommentReactions] Failed to remove reaction:', response.status, error);
          toast.error('Failed to remove reaction');
        }
      } else {
        // Add new reaction (or change existing one)
        console.log('💬 [CommentReactions] Adding reaction');
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/echoes/${echoId}/react-comment`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ emoji, capsuleId })
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log('✅ [CommentReactions] Reaction added successfully:', data);
          setCurrentReactions(data.commentReactions || {});
          
          // Get emoji label
          const emojiData = REACTION_EMOJIS.find(e => e.emoji === emoji);
          const label = emojiData?.label || 'Reaction';
          
          // Show different message if changing vs adding
          if (userReaction) {
            toast.success(`Changed to ${emoji} ${label}`);
          } else {
            toast.success(`Reacted with ${emoji} ${label}`);
          }
        } else {
          const error = await response.text();
          console.error('❌ [CommentReactions] Failed to add reaction:', response.status, error);
          toast.error('Failed to add reaction');
        }
      }
    } catch (error) {
      console.error('❌ [CommentReactions] Failed to react to comment:', error);
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get reaction counts (only non-zero)
  const getReactionCounts = () => {
    return REACTION_EMOJIS.map(({ emoji }) => ({
      emoji,
      count: currentReactions[emoji]?.length || 0
    })).filter(r => r.count > 0);
  };

  const reactionCounts = getReactionCounts();
  const hasReactions = reactionCounts.length > 0;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Reaction Counts Display */}
      {hasReactions && (
        <div className={`flex items-center gap-1 ${compact ? 'text-xs' : 'text-sm'}`}>
          {reactionCounts.map(({ emoji, count }) => (
            <motion.button
              key={emoji}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={() => handleReaction(emoji)}
              disabled={isSubmitting}
              className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${
                userReaction === emoji
                  ? 'bg-blue-500/20 border border-blue-500/40'
                  : 'bg-slate-800/40 border border-slate-700/40 hover:bg-slate-700/40'
              }`}
            >
              <span className={compact ? 'text-sm' : 'text-base'}>{emoji}</span>
              <span className="text-white/80">{count}</span>
            </motion.button>
          ))}
        </div>
      )}

      {/* Add Reaction Button */}
      <div className="relative">
        <motion.button
          ref={buttonRef}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => {
            e.stopPropagation();
            console.log('💬 [CommentReactions] Button clicked, showPicker:', showPicker);
            
            if (!showPicker) {
              // Calculate position for portal
              if (buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                console.log('💬 [CommentReactions] Button position:', rect);
                
                // MOBILE FIX: Center picker on mobile, position above button on desktop
                const isMobile = window.innerWidth < 640;
                setPickerPosition({
                  top: isMobile ? rect.top - 70 : rect.top - 65,
                  left: isMobile ? Math.max(10, Math.min(rect.left - 120, window.innerWidth - 350)) : rect.left - 50
                });
                
                console.log('💬 [CommentReactions] Picker position calculated:', {
                  isMobile,
                  top: isMobile ? rect.top - 70 : rect.top - 65,
                  left: isMobile ? Math.max(10, Math.min(rect.left - 120, window.innerWidth - 350)) : rect.left - 50,
                  screenWidth: window.innerWidth
                });
              }
              
              // Notify other pickers to close
              const event = new CustomEvent('reaction-picker-open', {
                detail: { instanceId: instanceId.current }
              });
              window.dispatchEvent(event);
              
              setShowPicker(true);
            } else {
              setShowPicker(false);
            }
          }}
          disabled={isSubmitting}
          className={`${compact ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5'} rounded-full bg-slate-800/40 border border-slate-700/40 hover:bg-slate-700/40 transition-colors text-white/60 hover:text-white/90 cursor-pointer`}
        >
          {userReaction ? '😊' : '+ React'}
        </motion.button>

        {/* Reaction Picker Popup - Using Portal */}
        {showPicker && createPortal(
          <>
            {console.log('💬 [CommentReactions] RENDERING PICKER IN PORTAL at position:', pickerPosition)}
            
            {/* Backdrop - pointer-events only for backdrop area */}
            <div 
              className="fixed inset-0"
              style={{ zIndex: 99998, pointerEvents: 'auto', touchAction: 'auto' }}
              onClick={(e) => {
                console.log('💬 [CommentReactions] Backdrop clicked, closing picker');
                setShowPicker(false);
              }}
              onTouchEnd={(e) => {
                console.log('💬 [CommentReactions] Backdrop touched, closing picker');
                e.preventDefault();
                setShowPicker(false);
              }}
            />
            
            {/* Emoji Picker - stops propagation so backdrop doesn't close */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => {
                // Prevent clicks inside picker from closing it via backdrop
                e.stopPropagation();
              }}
              style={{
                position: 'fixed',
                top: pickerPosition.top,
                left: pickerPosition.left,
                zIndex: 99999,
                width: '340px',
                height: '60px',
                padding: '8px',
                background: 'rgba(15, 23, 42, 0.98)',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: '16px',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                gap: '4px',
                pointerEvents: 'auto',
                touchAction: 'auto',
                WebkitTouchCallout: 'default',
                WebkitUserSelect: 'none'
              }}
            >
              {REACTION_EMOJIS.map(({ emoji, label }) => (
                <button
                  key={emoji}
                  onClick={(e) => {
                    console.log('💬 [CommentReactions] Emoji clicked:', emoji);
                    e.stopPropagation();
                    handleReaction(emoji);
                  }}
                  onTouchEnd={(e) => {
                    console.log('💬 [CommentReactions] Emoji touched:', emoji);
                    e.preventDefault();
                    e.stopPropagation();
                    handleReaction(emoji);
                  }}
                  disabled={isSubmitting}
                  title={label}
                  style={{
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    lineHeight: '1',
                    background: userReaction === emoji ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                    borderRadius: '10px',
                    border: userReaction === emoji ? '2px solid rgba(59, 130, 246, 0.5)' : 'none',
                    cursor: isSubmitting ? 'wait' : 'pointer',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                    pointerEvents: isSubmitting ? 'none' : 'auto',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'rgba(0, 0, 0, 0)',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.transform = 'scale(1.25) translateY(-4px)';
                      e.currentTarget.style.background = 'rgba(71, 85, 105, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = userReaction === emoji ? 'rgba(59, 130, 246, 0.2)' : 'transparent';
                  }}
                  onTouchStart={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.transform = 'scale(1.15)';
                      e.currentTarget.style.background = 'rgba(71, 85, 105, 0.4)';
                    }
                  }}
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          </>,
          document.body
        )}
      </div>
    </div>
  );
};
