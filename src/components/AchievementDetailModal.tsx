import React from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Award, Target, Gift, Check, Lock as LockIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AchievementBadge } from './AchievementBadge';

interface AchievementDetailModalProps {
  achievement: any;
  isOpen: boolean;
  onClose: () => void;
  accessToken?: string;
  rarityPercentage?: number;
}

export function AchievementDetailModal({ 
  achievement, 
  isOpen, 
  onClose,
  accessToken,
  rarityPercentage 
}: AchievementDetailModalProps) {

  // AGGRESSIVE scroll lock for mobile
  React.useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      const html = document.documentElement;
      const body = document.body;
      
      // Lock html and body
      html.style.overflow = 'hidden';
      html.style.position = 'fixed';
      html.style.width = '100%';
      html.style.height = '100%';
      
      body.style.overflow = 'hidden';
      body.style.position = 'fixed';
      body.style.width = '100%';
      body.style.height = '100%';
      body.style.top = `-${scrollY}px`;
      
      return () => {
        html.style.overflow = '';
        html.style.position = '';
        html.style.width = '';
        html.style.height = '';
        
        body.style.overflow = '';
        body.style.position = '';
        body.style.width = '';
        body.style.height = '';
        body.style.top = '';
        
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen || !achievement) return null;

  // Use REAL rarity percentage from backend or fallback to rarity-based estimate
  const displayRarityPercentage = rarityPercentage !== undefined 
    ? rarityPercentage 
    : {
        common: 85,
        uncommon: 45,
        rare: 18,
        epic: 7,
        legendary: 2
      }[achievement.rarity] || 50;

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not unlocked';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Rarity theme colors
  const rarityTheme = {
    common: {
      from: '#64748b',
      to: '#475569',
      accent: '#94a3b8',
      text: 'text-slate-600',
      bg: 'bg-slate-50',
      darkBg: 'dark:bg-slate-900/50',
      border: 'border-slate-300',
      glow: '0 20px 60px rgba(100, 116, 139, 0.15)',
    },
    uncommon: {
      from: '#10b981',
      to: '#059669',
      accent: '#34d399',
      text: 'text-emerald-600',
      bg: 'bg-emerald-50',
      darkBg: 'dark:bg-emerald-900/20',
      border: 'border-emerald-300',
      glow: '0 20px 60px rgba(16, 185, 129, 0.25)',
    },
    rare: {
      from: '#3b82f6',
      to: '#8b5cf6',
      accent: '#60a5fa',
      text: 'text-blue-600',
      bg: 'bg-blue-50',
      darkBg: 'dark:bg-blue-900/20',
      border: 'border-blue-300',
      glow: '0 20px 60px rgba(59, 130, 246, 0.35)',
    },
    epic: {
      from: '#a855f7',
      to: '#7c3aed',
      accent: '#c084fc',
      text: 'text-purple-600',
      bg: 'bg-purple-50',
      darkBg: 'dark:bg-purple-900/20',
      border: 'border-purple-300',
      glow: '0 20px 60px rgba(168, 85, 247, 0.45)',
    },
    legendary: {
      from: '#f59e0b',
      to: '#eab308',
      accent: '#fbbf24',
      text: 'text-yellow-600',
      bg: 'bg-yellow-50',
      darkBg: 'dark:bg-yellow-900/20',
      border: 'border-yellow-300',
      glow: '0 20px 60px rgba(245, 158, 11, 0.55)',
    },
  };

  const theme = rarityTheme[achievement.rarity as keyof typeof rarityTheme] || rarityTheme.common;

  // Render modal using Portal to bypass parent CSS
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div 
          onClick={onClose}
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100dvh',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            margin: 0,
            overflow: 'hidden',
            touchAction: 'none',
          }}
        >
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-lg"
          />

          {/* Premium Card - Modern Design */}
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ 
              opacity: 0, 
              scale: 0.9,
              y: 20
            }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: 0
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.9,
              y: 20
            }}
            transition={{ 
              duration: 0.3,
              type: 'spring',
              stiffness: 300,
              damping: 30
            }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
            style={{
              maxHeight: '85vh',
              boxShadow: theme.glow,
            }}
          >
            {/* Gradient Header with Pattern */}
            <div
              className="relative px-6 pt-8 pb-6 overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
              }}
            >
              {/* Decorative pattern overlay */}
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px),
                                   radial-gradient(circle at 80% 80%, white 1px, transparent 1px)`,
                  backgroundSize: '50px 50px',
                }}
              />

              {/* Close button - floating, glass-morphism */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-xl bg-white/20 hover:bg-white/30 border border-white/30 transition-all hover:scale-110 active:scale-95 z-10"
              >
                <X className="w-5 h-5 text-white" strokeWidth={2.5} />
              </button>

              {/* Rarity Badge - Top left, glass-morphism */}
              <div className="absolute top-4 left-4 px-4 py-1.5 rounded-full backdrop-blur-xl bg-black/20 border border-white/20">
                <span className="text-xs uppercase tracking-widest text-white font-bold">
                  {achievement.rarity}
                </span>
              </div>

              {/* Achievement Badge - Centered, elevated */}
              <div className="flex justify-center mt-8 mb-6">
                <motion.div
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                >
                  <AchievementBadge
                    achievement={achievement}
                    locked={!achievement.isUnlocked}
                    size="xl"
                  />
                </motion.div>
              </div>

              {/* Title */}
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-center text-3xl text-white mb-2 px-4"
                style={{
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                }}
              >
                {achievement.title}
              </motion.h2>
              
              {/* Rarity percentage - glass pill */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex justify-center"
              >
                <div className="px-4 py-1.5 rounded-full backdrop-blur-xl bg-white/15 border border-white/20">
                  <p className="text-white/90 text-sm">
                    {rarityPercentage !== undefined 
                      ? `${displayRarityPercentage.toFixed(1)}% unlocked` 
                      : `${achievement.rarity} achievement`}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Card Body - Scrollable content */}
            <div className="overflow-y-auto max-h-[50vh] px-6 py-6 space-y-5">
              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <p className="text-center text-slate-700 dark:text-slate-300 leading-relaxed">
                  {achievement.description}
                </p>
              </motion.div>

              {/* Unlock Status - Premium design */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {achievement.isUnlocked ? (
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 p-[2px]">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                          <Check className="w-6 h-6 text-white" strokeWidth={3} />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">
                            Achievement Unlocked!
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            {formatDate(achievement.unlockedAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : achievement.progress !== undefined && achievement.progress > 0 ? (
                  <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        Progress
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {Math.round(achievement.progress)}%
                      </span>
                    </div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${achievement.progress}%` }}
                        transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${theme.from}, ${theme.to})`,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <LockIcon className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                          Locked
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-500">
                          {achievement.hidden ? 'Requirements hidden' : 'Keep exploring to unlock'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Info Grid - Modern cards */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="grid grid-cols-2 gap-3"
              >
                {/* Category */}
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-slate-500" />
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Category
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white capitalize">
                    {achievement.category.replace('_', ' ')}
                  </div>
                </div>
                
                {/* Points */}
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-slate-500" />
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Points
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {achievement.rewards.points}
                  </div>
                </div>
              </motion.div>

              {/* Title Reward - Special highlight */}
              {achievement.rewards.title && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="relative overflow-hidden rounded-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${theme.from}15, ${theme.to}15)`,
                  }}
                >
                  <div className="border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div 
                        className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
                        }}
                      >
                        <Gift className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                          Unlocks Title
                        </div>
                        <div className="text-base font-semibold text-slate-900 dark:text-white italic">
                          "{achievement.rewards.title}"
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Requirements hint (if locked and not hidden) */}
              {!achievement.isUnlocked && !achievement.hidden && achievement.unlockCriteria && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4"
                >
                  <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                    How to Unlock
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    {achievement.unlockCriteria.description || achievement.description}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer - Gradient accent */}
            <div 
              className="h-2"
              style={{
                background: `linear-gradient(90deg, ${theme.from}, ${theme.to})`,
              }}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // Render to document.body using Portal
  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
