/**
 * Echo Notification Toast Component
 * 
 * Non-blocking notification that slides in from bottom-right
 * Features: Subtle pulse animation, 7s auto-dismiss, close button
 * Z-index: 45 (below modals, non-interfering)
 */

import { useEffect, useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { EchoNotification } from '../hooks/useEchoNotifications';

interface EchoNotificationToastProps {
  notification: EchoNotification;
  onDismiss: () => void;
  onViewCapsule: () => void;
}

export function EchoNotificationToast({
  notification,
  onDismiss,
  onViewCapsule,
}: EchoNotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Play notification sound on mount
  useEffect(() => {
    // Create a simple notification sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Create pleasant notification chime (two-tone)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      console.log('🔔 Echo notification sound played');
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }, []);

  // Auto-dismiss after 7 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, 7000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss();
    }, 300); // Wait for exit animation
  };

  const handleViewCapsule = () => {
    setIsVisible(false);
    setTimeout(() => {
      onViewCapsule();
    }, 300);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ 
            x: 0, 
            opacity: 1,
            scale: [1, 1.02, 1], // Subtle pulse
          }}
          exit={{ x: 400, opacity: 0 }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 300,
            scale: {
              repeat: 2,
              duration: 1,
            }
          }}
          className="fixed bottom-6 right-6 z-[45] w-[380px] max-w-[calc(100vw-3rem)]"
        >
          <div
            className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-purple-500/30 rounded-xl shadow-2xl overflow-hidden"
            style={{
              boxShadow: '0 0 20px rgba(167, 139, 250, 0.3), 0 10px 30px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Glowing border animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-amber-500/20 to-purple-500/20 animate-pulse pointer-events-none" />
            
            {/* Content */}
            <div className="relative p-4">
              {/* Header with close button */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💫</span>
                  <span className="font-semibold text-white">New Echo Received</span>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent mb-3" />

              {/* Sender info */}
              <p className="text-slate-300 text-sm mb-1">
                <span className="font-medium text-white">{notification.senderName}</span> sent an echo on:
              </p>

              {/* Capsule title */}
              <p className="text-purple-300 font-medium text-sm mb-3">
                "{truncateText(notification.capsuleTitle, 50)}"
              </p>

              {/* Echo content preview */}
              <div className="bg-gradient-to-br from-amber-500/10 to-purple-500/10 border border-amber-500/20 rounded-lg p-3 mb-4">
                <p className={`${
                  notification.echoType === 'emoji' 
                    ? 'text-3xl text-center' 
                    : 'text-slate-200 text-sm italic'
                }`}>
                  {notification.echoType === 'emoji' 
                    ? notification.echoContent
                    : truncateText(notification.echoContent, 100)
                  }
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleViewCapsule}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/50"
                >
                  View Capsule
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2.5 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}