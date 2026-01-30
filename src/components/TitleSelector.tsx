import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, Check, Sparkles, Crown, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TitleDisplay, TitleBadge } from './TitleDisplay';
import { useTitles } from '../contexts/TitlesContext';
import { TitleData } from '../hooks/useTitles';
import { toast } from 'sonner@2.0.3';

interface TitleSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 🌙 Legacy Title Selection Modal - ERAS CELESTIAL REDESIGN
 * 
 * Visual overhaul with:
 * - Badge-based display using TitleBadge geometry system
 * - Locked/unlocked states with grayscale for locked titles
 * - Hover animations and micro-interactions
 * - Smooth fade transitions
 * - Particle effects on selection
 * - Cosmic elegance theme
 * 
 * FUNCTIONALITY UNCHANGED - Only visual styling updated
 */
export function TitleSelector({ isOpen, onClose }: TitleSelectorProps) {
  const { availableTitles, equipTitle, equipping, refresh } = useTitles();
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const handleEquip = async (achievementId: string | null) => {
    console.log('[TitleSelector] handleEquip called with:', {
      achievementId,
      isNull: achievementId === null,
      type: typeof achievementId
    });
    
    const result = await equipTitle(achievementId);
    console.log('[TitleSelector] equipTitle result:', result);
    
    if (result.success) {
      toast.success(
        achievementId 
          ? `✨ Title equipped: "${result.equipped_title}"` 
          : 'Title removed',
        {
          description: achievementId 
            ? 'Your new title is now visible across Eras' 
            : 'Your name will display without a title',
          duration: 3000
        }
      );
      onClose();
    } else {
      toast.error('Failed to activate title', {
        description: result.error || 'Please try again',
        duration: 3000
      });
    }
  };

  const unlockedTitles = availableTitles?.titles.filter(t => t.isUnlocked) || [];
  const lockedTitles = availableTitles?.titles.filter(t => !t.isUnlocked) || [];

  // Badge geometry configurations for locked states
  const getBadgeClipPath = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'circle(50% at 50% 50%)';
      case 'uncommon':
        return 'polygon(25% 5%, 75% 5%, 95% 50%, 75% 95%, 25% 95%, 5% 50%)';
      case 'rare':
        return 'polygon(50% 0%, 58% 28%, 86% 18%, 68% 43%, 98% 50%, 68% 57%, 86% 82%, 58% 72%, 50% 100%, 42% 72%, 14% 82%, 32% 57%, 2% 50%, 32% 43%, 14% 18%, 42% 28%)';
      case 'epic':
        return 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)';
      case 'legendary':
        return 'circle(50% at 50% 50%)';
      default:
        return 'circle(50% at 50% 50%)';
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] backdrop-blur-xl"
            style={{
              background: 'radial-gradient(circle at center, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.9) 100%)'
            }}
            onClick={onClose}
          />

          {/* Floating particles background */}
          {!prefersReducedMotion && (
            <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-purple-400/30 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [-20, -100],
                    opacity: [0, 0.6, 0],
                    scale: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 4 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 3,
                    ease: 'linear'
                  }}
                />
              ))}
            </div>
          )}

          {/* Modal Container */}
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ 
                duration: 0.4,
                ease: [0.25, 1, 0.5, 1]
              }}
              className="relative w-full max-w-3xl max-h-[85vh] bg-gradient-to-br from-gray-950 via-gray-900 to-black rounded-3xl shadow-2xl border border-purple-900/30 overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Ambient glow layer */}
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  background: 'radial-gradient(circle at 50% 0%, rgba(147, 51, 234, 0.15), transparent 60%)'
                }}
              />

              {/* Header */}
              <div className="sticky top-0 z-10 px-8 py-6 bg-gradient-to-r from-purple-950/80 via-indigo-950/80 to-purple-950/80 border-b border-purple-900/30 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <motion.h2 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-3xl font-bold text-white flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Crown className="w-6 h-6 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 bg-clip-text text-transparent">
                        Select Your Legacy Title
                      </span>
                    </motion.h2>
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-sm text-purple-300/70 mt-2 ml-13"
                    >
                      <span className="font-bold text-purple-300">{availableTitles?.unlockedCount || 0}</span>
                      {' '}of{' '}
                      <span className="font-bold text-purple-300">{availableTitles?.totalCount || 0}</span>
                      {' '}titles unlocked
                    </motion.p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-all hover:scale-110 active:scale-95 border border-white/10"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(85vh-180px)] p-8 space-y-8">
                {/* No Title Option */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="text-xs uppercase tracking-widest text-purple-400/60 mb-4 font-semibold">Display Options</h3>
                  <motion.button
                    onClick={() => handleEquip(null)}
                    disabled={equipping}
                    whileHover={{ scale: !equipping ? 1.02 : 1 }}
                    whileTap={{ scale: !equipping ? 0.98 : 1 }}
                    className={`
                      w-full px-6 py-4 rounded-2xl border-2 text-left
                      transition-all duration-300 backdrop-blur-sm
                      ${!availableTitles?.equippedAchievementId
                        ? 'border-green-500/50 bg-green-500/10 shadow-lg shadow-green-500/20'
                        : 'border-purple-800/30 hover:border-purple-700/50 bg-purple-900/10'
                      }
                      ${equipping ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-semibold text-lg">No Title</div>
                        <div className="text-sm text-gray-400 mt-1">Show just your name</div>
                      </div>
                      {!availableTitles?.equippedAchievementId && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/50"
                        >
                          <Check className="w-5 h-5 text-green-400" />
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                </motion.div>

                {/* Unlocked Titles */}
                {unlockedTitles.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="text-xs uppercase tracking-widest text-purple-400/60 mb-4 font-semibold flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Unlocked Titles ({unlockedTitles.length})
                    </h3>
                    <div className="space-y-3">
                      {unlockedTitles.map((title, index) => (
                        <motion.div
                          key={title.achievementId}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                        >
                          <TitleBadge
                            title={title.title}
                            rarity={title.rarity}
                            icon={title.icon}
                            isEquipped={title.isEquipped}
                            onClick={() => {
                              if (title.isEquipped) {
                                handleEquip(null);
                              } else {
                                handleEquip(title.achievementId);
                              }
                            }}
                            className="w-full"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Locked Titles - Grayscale Badge Display */}
                {lockedTitles.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: unlockedTitles.length * 0.05 + 0.3 }}
                  >
                    <h3 className="text-xs uppercase tracking-widest text-gray-500/60 mb-4 font-semibold flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Locked Titles ({lockedTitles.length})
                    </h3>
                    <div className="space-y-3">
                      {lockedTitles.map((title, index) => {
                        const rarityGlow = {
                          common: 'rgba(156, 163, 175, 0.1)',
                          uncommon: 'rgba(59, 130, 246, 0.1)',
                          rare: 'rgba(168, 85, 247, 0.1)',
                          epic: 'rgba(251, 191, 36, 0.1)',
                          legendary: 'rgba(236, 72, 153, 0.1)'
                        }[title.rarity];

                        return (
                          <motion.div
                            key={title.achievementId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + index * 0.03 }}
                            whileHover={{ scale: 1.01, opacity: 0.9 }}
                            className="relative px-5 py-4 rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm opacity-60 hover:opacity-75 transition-all duration-300"
                            style={{
                              boxShadow: `0 0 20px ${rarityGlow}`
                            }}
                          >
                            {/* Sleeping badge shape */}
                            <div className="flex items-center gap-4">
                              {/* Badge icon container */}
                              <div className="relative">
                                <div
                                  className="w-14 h-14 flex items-center justify-center bg-gray-800/50 border border-gray-700/30"
                                  style={{
                                    clipPath: getBadgeClipPath(title.rarity)
                                  }}
                                >
                                  <Lock className="w-6 h-6 text-gray-600" />
                                </div>
                                {/* Subtle glow */}
                                <div
                                  className="absolute inset-0 blur-xl opacity-20"
                                  style={{
                                    background: rarityGlow,
                                    clipPath: getBadgeClipPath(title.rarity)
                                  }}
                                />
                              </div>
                              
                              <div className="flex-1">
                                <div className="text-gray-400 font-semibold text-base mb-1">
                                  {title.title}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {title.description}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* No titles message */}
                {unlockedTitles.length === 0 && lockedTitles.length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center py-16"
                  >
                    <div className="w-20 h-20 rounded-full bg-purple-900/20 flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-10 h-10 text-purple-500/50" />
                    </div>
                    <p className="text-gray-400 text-lg">No titles available yet</p>
                    <p className="text-sm text-gray-600 mt-2">
                      Complete achievements to unlock titles
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 px-8 py-5 bg-gradient-to-t from-gray-950 via-gray-900/95 to-transparent border-t border-purple-900/20 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      refresh();
                      toast.success('Titles refreshed!', {
                        description: 'Checking for newly unlocked titles...',
                        duration: 2000
                      });
                    }}
                    className="px-6 py-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 transition-all flex items-center gap-2 border border-purple-500/30"
                    style={{
                      boxShadow: '0 0 20px rgba(147, 51, 234, 0.2)'
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Refresh Titles
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="px-6 py-3 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 text-white transition-all border border-gray-700/50"
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}