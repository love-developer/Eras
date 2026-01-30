import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Crown, Sparkles, Star, Award, Clock, Calendar, Camera, Users, Sunrise, Moon, Cake, Shield, Trophy, Film, Image, Music, Zap, Target, Wand2, Heart, Package, Layers, BookOpen, Copy, Waves } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { TitleDisplay } from './TitleDisplay';

interface TitleUnlockModalProps {
  title: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  isOpen: boolean;
  onClose: () => void;
  onViewAll?: () => void;
}

/**
 * 👑 Title Unlock Modal
 * 
 * Displays a beautiful animation when a new title is unlocked.
 * Shows AFTER the achievement unlock modal closes.
 */
export function TitleUnlockModal({ 
  title, 
  rarity,
  isOpen, 
  onClose,
  onViewAll
}: TitleUnlockModalProps) {
  const [animationPhase, setAnimationPhase] = useState<'appear' | 'glow' | 'complete'>('appear');
  const [mounted, setMounted] = useState(true); // Changed to true by default

  // Get unique icon for each title
  const getTitleIcon = () => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      'Time Novice': Clock,
      'Golden Hour Guardian': Sparkles,
      'Neon Dreamer': Zap,
      'Surrealist': Moon,
      'Time Sculptor': Wand2,
      'Memory Broadcaster': Heart,
      'Ritual Keeper': Calendar,
      'Vault Starter': Package,
      'Multimedia Virtuoso': Layers,
      'Word Painter': BookOpen,
      'Frequency Keeper': Music,
      'Quantum Scheduler': Copy,
      'Community Weaver': Users,
      'Echo Artisan': Waves,
      'Audio Alchemist': Music,
      'Sticker Master': Star,
      'Chrononaut': Target,
      'Master Archivist': Trophy,
      'Grand Historian': Award,
      'Legend': Crown,
      'Veteran': Shield,
      'Midnight Chronicler': Sunrise,
      'Birthday Planner': Cake,
      'Legacy Guardian': Shield,
      'Cinematographer': Film,
      'Social Connector': Users,
      'Time Lord': Crown,
      'Master Curator': Image,
      'Archive Master': Trophy,
      'Perfect Chronicler': Star,
    };
    
    const icon = iconMap[title] || Crown;
    console.log('🎨 [Title Modal] Icon selected for', title, ':', icon.name || 'Crown');
    return icon;
  };

  const TitleIcon = getTitleIcon();

  useEffect(() => {
    console.log('👑 [Title Modal] useEffect triggered - isOpen:', isOpen, 'title:', title);
    if (isOpen && title) {
      console.log('👑 [Title Modal] Starting animation sequence for title:', title);
      setAnimationPhase('appear');

      // Golden confetti burst for title unlock
      const goldenColors = ['#FFD700', '#FFA500', '#FFED4E', '#FFB800', '#FFC107'];

      // Create a custom canvas for confetti - Fresh canvas each time to avoid worker conflicts
      const existingCanvas = document.getElementById('title-confetti-canvas');
      if (existingCanvas) {
        existingCanvas.remove();
      }
      
      const confettiCanvas = document.createElement('canvas');
      confettiCanvas.id = 'title-confetti-canvas';
      confettiCanvas.style.position = 'fixed';
      confettiCanvas.style.top = '0';
      confettiCanvas.style.left = '0';
      confettiCanvas.style.width = '100%';
      confettiCanvas.style.height = '100%';
      confettiCanvas.style.pointerEvents = 'none';
      confettiCanvas.style.zIndex = '2147483647';
      document.body.appendChild(confettiCanvas);

      // Create confetti instance - useWorker: false to avoid canvas resize errors
      const customConfetti = confetti.create(confettiCanvas, {
        resize: true,
        useWorker: false
      });

      // Golden crown confetti burst from top
      setTimeout(() => {
        customConfetti({
          particleCount: 100,
          angle: 90,
          spread: 180,
          origin: { y: 0.3, x: 0.5 },
          colors: goldenColors,
          startVelocity: 50,
          gravity: 0.8,
          shapes: ['circle', 'square'],
          scalar: 1.2
        });
      }, 200);

      // Side bursts
      setTimeout(() => {
        customConfetti({
          particleCount: 40,
          angle: 60,
          spread: 70,
          origin: { y: 0.6, x: 0 },
          colors: goldenColors,
          startVelocity: 35,
          gravity: 0.8
        });
        customConfetti({
          particleCount: 40,
          angle: 120,
          spread: 70,
          origin: { y: 0.6, x: 1 },
          colors: goldenColors,
          startVelocity: 35,
          gravity: 0.8
        });
      }, 400);

      // Animation phases
      setTimeout(() => setAnimationPhase('glow'), 600);
      setTimeout(() => setAnimationPhase('complete'), 1200);

      // Cleanup
      return () => {
        setTimeout(() => {
          const canvas = document.getElementById('title-confetti-canvas');
          if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
          }
        }, 5000);
      };
    }
  }, [isOpen, title]);

  console.log('👑 [Title Modal] Render - title:', title, 'isOpen:', isOpen);
  
  if (!title) {
    console.log('👑 [Title Modal] Not rendering - no title provided');
    return null;
  }

  console.log('👑 [Title Modal] Rendering modal content - isOpen:', isOpen);
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            style={{ zIndex: 2147483646 }}
            onClick={onClose}
          />

          {/* Modal Card */}
          <div 
            className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
            style={{ zIndex: 2147483647 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 30 }}
              transition={{ 
                duration: 0.5, 
                ease: [0.22, 1, 0.36, 1]
              }}
              className={`relative w-[400px] rounded-[32px] overflow-hidden pointer-events-auto bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 ${
                animationPhase === 'glow' || animationPhase === 'complete' 
                  ? 'shadow-[0_0_60px_rgba(147,51,234,0.8)]' 
                  : ''
              } transition-shadow duration-300`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Content */}
              <div className="relative p-10 flex flex-col items-center text-center">
                {/* Header Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="mb-6"
                >
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-white/40 bg-white/20">
                    <TitleIcon className="w-5 h-5 text-yellow-300" />
                    <span className="text-base font-semibold text-white">
                      Title Unlocked!
                    </span>
                  </div>
                </motion.div>

                {/* Crown Icon with Animation */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
                  animate={{ 
                    scale: animationPhase === 'complete' ? [1, 1.1, 1] : 1, 
                    opacity: 1, 
                    rotate: 0 
                  }}
                  transition={{ 
                    scale: { duration: 0.6, delay: 0.2 },
                    opacity: { duration: 0.4, delay: 0.2 },
                    rotate: { duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }
                  }}
                  className="relative mb-8"
                >
                  <div className={`
                    w-28 h-28 rounded-full 
                    bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500
                    flex items-center justify-center
                    ${animationPhase === 'glow' || animationPhase === 'complete' ? 'ring-8 ring-yellow-300/40' : ''}
                  `}>
                    <TitleIcon className="w-16 h-16 text-white drop-shadow-lg" strokeWidth={1.5} />
                  </div>

                  {/* Sparkles around crown */}
                  {animationPhase === 'complete' && (
                    <>
                      {[...Array(8)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ 
                            scale: [0, 1, 0],
                            opacity: [0, 1, 0],
                            x: [0, Math.cos(i * 45 * Math.PI / 180) * 60],
                            y: [0, Math.sin(i * 45 * Math.PI / 180) * 60]
                          }}
                          transition={{ 
                            duration: 1.2,
                            delay: i * 0.1,
                            repeat: Infinity,
                            repeatDelay: 1
                          }}
                          className="absolute w-2 h-2 bg-yellow-300 rounded-full"
                          style={{ 
                            top: '50%', 
                            left: '50%',
                            transform: 'translate(-50%, -50%)'
                          }}
                        />
                      ))}
                    </>
                  )}
                </motion.div>

                {/* Title Display */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="mb-4"
                >
                  <TitleDisplay 
                    title={title} 
                    rarity={rarity}
                    className="text-3xl"
                  />
                </motion.div>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                  className="text-white/90 text-sm mb-6"
                >
                  You can now equip this title in your profile!
                </motion.p>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.4 }}
                  className="flex gap-3 w-full"
                >
                  <button
                    onClick={onClose}
                    className="flex-1 px-6 py-3 rounded-full bg-white/30 hover:bg-white/40 text-white font-medium transition-all hover:scale-105"
                  >
                    Awesome!
                  </button>
                  {onViewAll && (
                    <button
                      onClick={() => {
                        onViewAll();
                        onClose();
                      }}
                      className="flex-1 px-6 py-3 rounded-full font-medium transition-all hover:scale-105 flex items-center justify-center gap-2"
                      style={{
                        background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
                        color: 'rgba(0, 0, 0, 0.85)',
                        boxShadow: '0 4px 20px rgba(212, 175, 55, 0.4)'
                      }}
                    >
                      <Crown className="w-4 h-4" />
                      <span className="text-sm">View All Titles</span>
                    </button>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}