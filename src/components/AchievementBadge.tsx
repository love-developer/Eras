import React from 'react';
import { 
  Lock, Star, Crown, ArrowUpRight, Sparkle as SparkleIcon,
  PlayCircle, Send, Inbox, Camera, Video, Mic,
  Sunset, Sparkles, Palette, Wand2, Sticker,
  Clock, CalendarDays, CalendarRange, Cake,
  Package, Archive, Landmark, Film,
  Moon, Gift, Shield, Clapperboard, Globe,
  Wand, Layers, CalendarClock, CalendarCheck2,
  RefreshCcw, Users, Hourglass, Trophy, Target,
  Mailbox, Medal, Library, ScrollText, Rocket, Zap,
  AudioWaveform, Shapes, Compass, Flame, Sunrise, Stars,
  Cloud, Heart, PartyPopper, Gem, ImagePlay, MoonStar,
  Radio, Satellite, Gauge, Timer, Clover, Sparkle,
  BookOpen, Music, Copy, Share2, FolderTree, MessageCircle, Waves
} from 'lucide-react';
import { motion } from 'motion/react';

interface AchievementBadgeProps {
  achievement: any;
  locked?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  progress?: number;
  rarityPercentage?: number;
  isNew?: boolean;
  unlockedAt?: string;
}

export function AchievementBadge({ 
  achievement, 
  locked = false, 
  size = 'md',
  onClick,
  progress = 0,
  rarityPercentage,
  isNew = false,
  unlockedAt
}: AchievementBadgeProps) {
  // BULLETPROOF: If achievement is unlocked, force locked to false and progress to 0
  const isActuallyLocked = locked && !achievement.isUnlocked;
  const actualProgress = isActuallyLocked ? progress : 0;

  // Squircle sizes (rounded squares with continuous curve)
  const sizes = {
    sm: 'w-14 h-14',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
    xl: 'w-36 h-36'
  };
  
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-18 h-18'
  };

  // NEW: Enhanced rarity theme system
  const rarityTheme = {
    common: {
      border: '#cbd5e1',
      borderClass: 'border-slate-300',
      icon: '#475569',
      iconClass: 'text-slate-600',
      glow: '#e2e8f0',
      text: 'text-slate-500',
      shadow: '0 2px 8px rgba(203, 213, 225, 0.3)',
      hoverShadow: '0 4px 12px rgba(203, 213, 225, 0.4)',
    },
    uncommon: {
      border: '#34d399',
      borderClass: 'border-emerald-400',
      icon: '#059669',
      iconClass: 'text-emerald-600',
      glow: '#a7f3d0',
      text: 'text-emerald-600',
      shadow: '0 4px 12px rgba(52, 211, 153, 0.25)',
      hoverShadow: '0 6px 16px rgba(52, 211, 153, 0.35)',
      badge: '↗',
    },
    rare: {
      border: '#60a5fa',
      borderClass: 'border-blue-400',
      icon: '#3b82f6',
      iconClass: 'text-blue-500',
      glow: '#93c5fd',
      text: 'text-blue-600',
      shadow: '0 6px 20px rgba(59, 130, 246, 0.3)',
      hoverShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
      gradient: ['#3b82f6', '#8b5cf6'],
      badge: '★',
    },
    epic: {
      border: '#a855f7',
      borderClass: 'border-purple-500',
      icon: '#7c3aed',
      iconClass: 'text-violet-600',
      glow: '#c4b5fd',
      text: 'text-purple-600',
      shadow: '0 8px 24px rgba(168, 85, 247, 0.4)',
      hoverShadow: '0 10px 28px rgba(168, 85, 247, 0.5)',
      badge: '✦',
    },
    legendary: {
      border: '#eab308',
      borderClass: 'border-yellow-500',
      icon: '#f59e0b',
      iconClass: 'text-amber-500',
      glow: '#fde047',
      text: 'text-yellow-600',
      shadow: '0 10px 32px rgba(234, 179, 8, 0.5)',
      hoverShadow: '0 12px 36px rgba(234, 179, 8, 0.6)',
      gradient: ['#f59e0b', '#eab308', '#fbbf24'],
      badge: '👑',
    },
  };

  const theme = rarityTheme[achievement.rarity as keyof typeof rarityTheme] || rarityTheme.common;

  // Map icon names to components
  const iconMap: Record<string, any> = {
    PlayCircle, Send, Inbox, Camera, Video, Mic,
    Sunset, Sparkles, Palette, Wand2, Sticker,
    Clock, CalendarDays, CalendarRange, Cake,
    Package, Archive, Landmark, Star, Film,
    Moon, Gift, Shield, Clapperboard, Globe,
    Wand, Layers, CalendarClock, CalendarCheck2,
    RefreshCcw, Users, Hourglass, Crown, Trophy, Target,
    Mailbox, Medal, Library, ScrollText, Rocket, Zap,
    AudioWaveform, Shapes, Compass, Flame, Sunrise, Stars,
    Cloud, Heart, PartyPopper, Gem, ImagePlay, MoonStar,
    Radio, Satellite, Gauge, Timer, Clover, Sparkle,
    BookOpen, Music, Copy, Share2, FolderTree, MessageCircle, Waves
  };

  const IconComponent = iconMap[achievement.icon];

  // RARE+: Shimmer ray effect (like holographic card)
  const ShimmerRay = () => (
    <motion.div
      className="absolute inset-0 overflow-hidden rounded-[28%] pointer-events-none hidden md:block"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.6, 0] }}
      transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
        style={{ width: '50%' }}
        animate={{ x: ['-100%', '300%'] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 1, ease: 'easeInOut' }}
      />
    </motion.div>
  );

  // EPIC: Orbiting particles
  const OrbitingParticles = () => {
    const particles = [0, 1, 2, 3];
    const radius = size === 'xl' ? 60 : size === 'lg' ? 50 : size === 'md' ? 40 : 30;
    
    return (
      <div className="absolute inset-0 pointer-events-none hidden md:block">
        {particles.map((i) => {
          const angle = (360 / particles.length) * i;
          return (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: theme.glow,
                left: '50%',
                top: '50%',
                marginLeft: '-4px',
                marginTop: '-4px',
                boxShadow: `0 0 8px ${theme.glow}`,
              }}
              animate={{
                x: [
                  Math.cos((angle * Math.PI) / 180) * radius,
                  Math.cos(((angle + 360) * Math.PI) / 180) * radius,
                ],
                y: [
                  Math.sin((angle * Math.PI) / 180) * radius,
                  Math.sin(((angle + 360) * Math.PI) / 180) * radius,
                ],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'linear',
                delay: i * 0.2,
              }}
            />
          );
        })}
      </div>
    );
  };

  // LEGENDARY: Light rays
  const LightRays = () => (
    <motion.div
      className="absolute inset-0 pointer-events-none hidden md:block"
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
    >
      {[0, 45, 90, 135].map((angle) => (
        <div
          key={angle}
          className="absolute w-1 h-full bg-gradient-to-b from-transparent via-yellow-300/30 to-transparent"
          style={{
            left: '50%',
            top: '50%',
            transformOrigin: 'center',
            transform: `rotate(${angle}deg) translateY(-50%)`,
          }}
        />
      ))}
    </motion.div>
  );

  // LEGENDARY: Floating sparkles
  const FloatingSparkles = () => {
    const sparkles = [0, 1, 2, 3, 4, 5];
    
    return (
      <div className="absolute inset-0 pointer-events-none hidden md:block">
        {sparkles.map((i) => {
          const randomX = Math.random() * 100 - 50;
          const randomY = Math.random() * 100 - 50;
          
          return (
            <motion.div
              key={i}
              className="absolute text-yellow-300"
              style={{
                left: '50%',
                top: '50%',
                fontSize: '8px',
              }}
              animate={{
                x: [randomX, randomX + (Math.random() * 20 - 10)],
                y: [randomY, randomY - 30],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 2 + Math.random(),
                repeat: Infinity,
                delay: i * 0.3,
                ease: 'easeOut',
              }}
            >
              ✨
            </motion.div>
          );
        })}
      </div>
    );
  };

  // Get background style based on rarity and platform
  const getBackgroundStyle = () => {
    if (isActuallyLocked) {
      return {
        background: '#64748b',
      };
    }

    // Mobile: Solid colors only
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    
    if (isMobile) {
      return {
        background: achievement.visual.gradientStart,
      };
    }

    // Desktop: Gradients and special effects
    switch (achievement.rarity) {
      case 'rare':
        return {
          background: `linear-gradient(135deg, ${theme.gradient![0]} 0%, ${theme.gradient![1]} 100%)`,
        };
      case 'epic':
        return {
          background: `linear-gradient(135deg, ${achievement.visual.gradientStart} 0%, ${achievement.visual.gradientEnd} 100%)`,
          backdropFilter: 'blur(10px)',
        };
      case 'legendary':
        return {
          background: `linear-gradient(135deg, ${theme.gradient![0]} 0%, ${theme.gradient![1]} 50%, ${theme.gradient![2]} 100%)`,
        };
      default:
        return {
          background: `linear-gradient(135deg, ${achievement.visual.gradientStart} 0%, ${achievement.visual.gradientEnd} 100%)`,
        };
    }
  };

  return (
    <div className="relative group flex flex-col items-center">
      {/* Main badge - Squircle shape */}
      <motion.div
        className={`
          ${sizes[size]}
          relative
          cursor-pointer
          transition-all duration-300
          ${locked ? 'opacity-40' : ''}
        `}
        style={{
          borderRadius: '28%', // Squircle!
          ...getBackgroundStyle(),
          boxShadow: locked ? 'none' : theme.shadow,
        }}
        onClick={onClick}
        whileHover={!locked ? { 
          y: -4,
          boxShadow: theme.hoverShadow,
          transition: { duration: 0.2 }
        } : {}}
        whileTap={!locked ? { scale: 0.95 } : {}}
      >
        {/* Border ring with rarity color - only show colored border for uncommon+ */}
        <div 
          className={`absolute inset-0 border-2 ${locked ? 'border-slate-400 dark:border-slate-600' : achievement.rarity === 'common' ? 'border-slate-200 dark:border-slate-700' : theme.borderClass}`}
          style={{ 
            borderRadius: '28%',
            borderWidth: achievement.rarity === 'epic' || achievement.rarity === 'legendary' ? '3px' : '2px',
          }}
        />

        {/* EPIC: Holographic rainbow border animation - behind main border */}
        {!locked && achievement.rarity === 'epic' && (
          <div
            className="absolute -inset-[3px] hidden md:block rounded-[28%] overflow-hidden"
            style={{ zIndex: -1 }}
          >
            <motion.div
              className="absolute inset-0 opacity-50"
              style={{
                background: 'linear-gradient(0deg, #a855f7, #ec4899, #f59e0b, #10b981, #3b82f6, #a855f7)',
              }}
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%'],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        )}

        {/* Locked: Frosted glass effect */}
        {locked && (
          <div 
            className="absolute inset-0 backdrop-blur-md bg-slate-500/30"
            style={{ borderRadius: '28%' }}
          />
        )}

        {/* Icon with depth */}
        <div className="absolute inset-0 flex items-center justify-center">
          {IconComponent && (
            <IconComponent 
              className={`
                ${iconSizes[size]}
                ${locked ? 'text-slate-400' : 'text-white'}
                transition-all duration-300
                ${!locked && achievement.rarity === 'legendary' ? 'drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]' : ''}
                ${!locked && (achievement.rarity === 'epic' || achievement.rarity === 'rare') ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]' : ''}
              `}
              strokeWidth={1.5}
            />
          )}
        </div>

        {/* Lock icon - small, in corner */}
        {locked && (
          <div className="absolute top-1 right-1">
            <Lock className="w-4 h-4 text-slate-400" />
          </div>
        )}

        {/* RARE: Shimmer ray effect */}
        {!locked && achievement.rarity === 'rare' && <ShimmerRay />}

        {/* EPIC: Orbiting particles */}
        {!locked && achievement.rarity === 'epic' && <OrbitingParticles />}

        {/* LEGENDARY: Light rays + floating sparkles */}
        {!locked && achievement.rarity === 'legendary' && (
          <>
            <LightRays />
            <FloatingSparkles />
          </>
        )}

        {/* LEGENDARY: Breathing glow animation */}
        {!locked && achievement.rarity === 'legendary' && (
          <motion.div
            className="absolute inset-0 hidden md:block pointer-events-none"
            style={{ borderRadius: '28%' }}
            animate={{
              boxShadow: [
                `0 0 20px ${theme.glow}80`,
                `0 0 40px ${theme.glow}60`,
                `0 0 20px ${theme.glow}80`,
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Rarity badge - top right */}
        {!locked && theme.badge && (
          <div 
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-lg"
            style={{
              background: locked ? '#64748b' : theme.border,
              color: 'white',
            }}
          >
            {theme.badge}
          </div>
        )}

        {/* LEGENDARY: Crown badge with animation */}
        {!locked && achievement.rarity === 'legendary' && (
          <motion.div
            className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg text-xs"
            animate={{ 
              scale: [1, 1.15, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            👑
          </motion.div>
        )}

        {/* "NEW" Badge - Premium pill */}
        {!locked && isNew && (
          <motion.div
            initial={{ scale: 0, y: -10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="absolute -top-2 -left-2 px-2 py-0.5 rounded-full shadow-lg border border-white/30 flex items-center gap-1"
            style={{
              background: 'linear-gradient(to right, #10b981, #14b8a6)',
              fontSize: '9px',
              fontWeight: 700,
              color: 'white',
              letterSpacing: '0.05em',
            }}
          >
            <span style={{ fontSize: '10px' }}>✨</span>
            NEW
          </motion.div>
        )}
      </motion.div>
      
      {/* Title and rarity below badge */}
      <div className="mt-3 text-center max-w-[120px]">
        <p 
          className={`
            text-sm truncate
            ${locked ? 'text-slate-500 dark:text-slate-600' : 'text-slate-900 dark:text-white'}
          `}
          style={{
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}
        >
          {locked && achievement.hidden ? '???' : achievement.title}
        </p>
        
        {/* Rarity label with percentage */}
        <div className="flex items-center justify-center gap-1 mt-1">
          <p 
            className={`text-xs uppercase ${theme.text}`}
            style={{
              fontWeight: 700,
              letterSpacing: '0.08em',
            }}
          >
            {achievement.rarity}
          </p>
          {!locked && rarityPercentage !== undefined && (
            <p 
              className="text-xs text-slate-500 dark:text-slate-600"
              style={{
                fontWeight: 500,
                opacity: 0.8,
              }}
            >
              ({rarityPercentage.toFixed(1)}%)
            </p>
          )}
        </div>

        {/* Progress text for locked achievements */}
        {isActuallyLocked && actualProgress > 0 && !achievement.hidden && (
          <p className="text-xs text-slate-500 dark:text-slate-600 mt-1">
            {Math.round(actualProgress)}% complete
          </p>
        )}
      </div>
    </div>
  );
}