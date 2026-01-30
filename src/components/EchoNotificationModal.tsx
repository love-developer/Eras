import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Heart, MessageCircle, User, Calendar, Sparkles,
  Laugh, Frown, PartyPopper, AlertCircle as Amazing
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface EchoNotificationModalProps {
  notification: {
    id: string;
    capsuleTitle: string;
    senderName: string;
    echoType: 'emoji' | 'text';
    echoContent: string;
    timestamp: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onViewCapsule?: () => void;
}

/**
 * 💫 ECHO NOTIFICATION MODAL
 * 
 * Similar to Achievement/Title Unlock modals but themed for social interactions
 * - Warm, friendly design (not achievement-focused)
 * - Emoji-centric for reaction echoes
 * - Gentle animations (not celebratory like achievements)
 * - Quick display (2-3s auto-dismiss option)
 */
export function EchoNotificationModal({ 
  notification, 
  isOpen, 
  onClose,
  onViewCapsule
}: EchoNotificationModalProps) {
  const [phase, setPhase] = useState<'trigger' | 'reveal' | 'complete'>('trigger');
  const [mounted, setMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Haptic feedback (mobile)
  const triggerHaptic = useCallback(() => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([30, 50, 30]); // Gentle vibration
      }
    } catch (err) {
      // Haptics not supported
    }
  }, []);

  // Animation sequence
  useEffect(() => {
    if (!isOpen || !notification) return;

    triggerHaptic();
    setPhase('trigger');

    const timeline = [
      { delay: 300, action: () => setPhase('reveal') },
      { delay: 2800, action: () => setPhase('complete') }
    ];

    const timeouts = timeline.map(({ delay, action }) => 
      setTimeout(action, delay)
    );

    return () => timeouts.forEach(clearTimeout);
  }, [isOpen, notification, triggerHaptic]);

  // Confetti for emoji reactions
  useEffect(() => {
    if (phase === 'reveal' && !prefersReducedMotion) {
      // Create dedicated confetti canvas with ultra-high z-index
      const existingCanvas = document.getElementById('echo-notification-confetti-canvas');
      if (existingCanvas) {
        existingCanvas.remove();
      }
      
      const confettiCanvas = document.createElement('canvas');
      confettiCanvas.id = 'echo-notification-confetti-canvas';
      confettiCanvas.style.position = 'fixed';
      confettiCanvas.style.top = '0';
      confettiCanvas.style.left = '0';
      confettiCanvas.style.width = '100%';
      confettiCanvas.style.height = '100%';
      confettiCanvas.style.pointerEvents = 'none';
      confettiCanvas.style.zIndex = '2147483647'; // Maximum z-index to be above modal
      document.body.appendChild(confettiCanvas);

      // Create custom confetti instance
      const customConfetti = confetti.create(confettiCanvas, {
        resize: true,
        useWorker: false
      });

      // Different effects based on echo type
      if (notification?.echoType === 'emoji') {
        // Colorful confetti burst for emoji reactions
        customConfetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b']
        });
      } else {
        // Subtle sparkle effect for text notes
        customConfetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.6 },
          colors: ['#a78bfa', '#c084fc', '#e879f9'],
          shapes: ['circle'],
          scalar: 0.8,
          gravity: 0.6,
          drift: 0.2
        });
      }

      // Cleanup canvas after animation
      const cleanup = setTimeout(() => {
        const canvas = document.getElementById('echo-notification-confetti-canvas');
        if (canvas && canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
      }, 3000);

      return () => {
        clearTimeout(cleanup);
        if (confettiCanvas && confettiCanvas.parentNode) {
          confettiCanvas.parentNode.removeChild(confettiCanvas);
        }
      };
    }
  }, [phase, notification?.echoType, prefersReducedMotion]);

  const handleViewCapsule = () => {
    onViewCapsule?.();
    onClose();
  };

  if (!mounted || !notification) return null;

  const getEmojiIcon = (emoji: string) => {
    switch (emoji) {
      case '❤️': return Heart;
      case '😂': return Laugh;
      case '😢': return Frown;
      case '🎉': return PartyPopper;
      case '😮': return Amazing;
      default: return Sparkles;
    }
  };

  const content = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="echo-notification-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[999999] flex items-center justify-center p-4"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={onClose}
        >
          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ 
              scale: phase === 'trigger' ? 0.95 : 1,
              opacity: 1,
              y: 0
            }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ 
              type: 'spring',
              damping: 25,
              stiffness: 300
            }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl overflow-hidden"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Cosmic Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Gradient glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20" />
              
              {/* Animated particles */}
              {!prefersReducedMotion && Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white/30 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    opacity: [0.2, 0.6, 0.2],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Content */}
            <div className="relative p-8 text-center">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: phase !== 'trigger' ? 1 : 0, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 text-blue-300 text-sm mb-6">
                  <Sparkles className="w-4 h-4" />
                  <span>New Echo Received</span>
                </div>
              </motion.div>

              {/* Main Content */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ 
                  scale: phase !== 'trigger' ? 1 : 0.5,
                  opacity: phase !== 'trigger' ? 1 : 0
                }}
                transition={{ delay: 0.4, duration: 0.5, type: 'spring' }}
                className="mb-6"
              >
                {notification.echoType === 'emoji' ? (
                  // Emoji Display
                  <div className="mb-4">
                    <motion.div
                      animate={!prefersReducedMotion ? {
                        rotate: [0, -10, 10, -5, 5, 0],
                        scale: [1, 1.1, 1, 1.05, 1]
                      } : {}}
                      transition={{ 
                        duration: 0.8,
                        delay: 0.6,
                        repeat: 2
                      }}
                      className="inline-block text-8xl mb-4"
                    >
                      {notification.echoContent}
                    </motion.div>
                    <h2 className="text-2xl text-white mb-2">
                      Received from <span className="text-blue-400">{notification.senderName}</span>
                    </h2>
                  </div>
                ) : (
                  // Text Note Display
                  <div className="mb-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <MessageCircle className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl text-white mb-4">
                      <span className="text-purple-400">{notification.senderName}</span> sent a note
                    </h2>
                    <div className="max-w-sm mx-auto p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                      <p className="text-slate-200 text-sm leading-relaxed">
                        "{notification.echoContent}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Capsule Title */}
                <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span className="italic">{notification.capsuleTitle}</span>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: phase === 'complete' ? 1 : 0, y: 0 }}
                transition={{ delay: 2.5, duration: 0.3 }}
                className="flex gap-3"
              >
                <button
                  onClick={handleViewCapsule}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl"
                >
                  View Capsule
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  Dismiss
                </button>
              </motion.div>
            </div>

            {/* Bottom Glow */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-500/20 via-purple-500/10 to-transparent pointer-events-none" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}