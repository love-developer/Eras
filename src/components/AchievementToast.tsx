import React from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, Sparkles,
  // Achievement Icons
  Lock, Star, Crown,
  PlayCircle, Send, Inbox, Camera, Video, Mic,
  Sunset, Palette, Wand2, Sticker,
  Clock, CalendarDays, CalendarRange, Cake,
  Package, Archive, Landmark, Film,
  Moon, Gift, Shield, Clapperboard, Globe,
  Wand, Layers, CalendarClock, CalendarCheck2,
  RefreshCcw, Users, Hourglass, Target,
  Mailbox, Medal, Library, ScrollText, Rocket, Zap,
  AudioWaveform, Shapes, Compass, Flame, Sunrise, Stars,
  Cloud, Heart, PartyPopper, Gem, ImagePlay, MoonStar
} from 'lucide-react';

interface AchievementToastProps {
  achievement: any;
  onClick?: () => void;
}

export function AchievementToast({ achievement, onClick }: AchievementToastProps) {
  if (!achievement) return null;

  // Map icon names to lucide-react components
  const iconMap: Record<string, any> = {
    PlayCircle, Send, Inbox, Camera, Video, Mic,
    Sunset, Sparkles, Palette, Wand2, Sticker,
    Clock, CalendarDays, CalendarRange, Cake,
    Package, Archive, Landmark, Star, Film,
    Moon, Gift, Shield, Clapperboard, Globe,
    Wand, Layers, CalendarClock, CalendarCheck2,
    RefreshCcw, Users, Hourglass, Crown, Trophy, Target,
    Lock,
    Mailbox, Medal, Library, ScrollText, Rocket, Zap,
    AudioWaveform, Shapes, Compass, Flame, Sunrise, Stars,
    Cloud, Heart, PartyPopper, Gem, ImagePlay, MoonStar
  };

  // Get the icon component from the map
  const IconComponent = iconMap[achievement.icon];

  const rarityColors = {
    common: 'from-gray-400 to-gray-600',
    uncommon: 'from-green-400 to-emerald-600',
    rare: 'from-blue-400 to-indigo-600',
    epic: 'from-purple-400 to-pink-600',
    legendary: 'from-amber-400 to-orange-600'
  };

  const rarityBorderColors = {
    common: 'border-gray-400',
    uncommon: 'border-green-400',
    rare: 'border-blue-400',
    epic: 'border-purple-400',
    legendary: 'border-amber-400'
  };

  return (
    <motion.div
      initial={{ y: -20, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -20, opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className={`relative flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border-2 ${rarityBorderColors[achievement.rarity] || rarityBorderColors.common} cursor-pointer hover:scale-105 transition-transform overflow-hidden max-w-md`}
    >
      {/* Gradient Background Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-r ${rarityColors[achievement.rarity] || rarityColors.common} opacity-10`} />
      
      {/* Animated Sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: `${Math.random() * 100}%`, 
              y: '100%',
              opacity: 0,
              scale: 0
            }}
            animate={{ 
              y: '-20%',
              opacity: [0, 1, 0],
              scale: [0, 1, 0.5]
            }}
            transition={{ 
              duration: 1.5 + Math.random(),
              delay: i * 0.15,
              repeat: Infinity,
              repeatDelay: 1,
              ease: "easeOut"
            }}
            className="absolute w-1 h-1 bg-white rounded-full"
          />
        ))}
      </div>

      {/* Badge Icon Container */}
      <div className="relative flex-shrink-0">
        <motion.div
          animate={{ 
            rotate: [0, -5, 5, -5, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 0.6,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "easeInOut"
          }}
          className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${rarityColors[achievement.rarity] || rarityColors.common} flex items-center justify-center shadow-lg`}
        >
          {/* Glow Effect */}
          <motion.div
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.3, 0, 0.3]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${rarityColors[achievement.rarity] || rarityColors.common}`}
          />
          
          {/* Icon */}
          <div className="relative z-10">
            {IconComponent ? (
              <IconComponent className="w-8 h-8 text-white" strokeWidth={1.5} />
            ) : (
              <span className="text-3xl">{achievement.icon}</span>
            )}
          </div>
        </motion.div>

        {/* Floating Trophy Icon */}
        <motion.div
          animate={{ 
            y: [-2, 2, -2],
            rotate: [-5, 5, -5]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg"
        >
          <Trophy className="w-3 h-3 text-white" />
        </motion.div>
      </div>

      {/* Text Content */}
      <div className="flex-1 relative z-10 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Achievement Unlocked
          </span>
        </div>
        <h4 className="text-slate-900 dark:text-white mb-1 truncate">
          {achievement.title}
        </h4>
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
          {achievement.description}
        </p>
        
        {/* Click hint */}
        <div className="mt-2 flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400">
          <Sparkles className="w-3 h-3" />
          <span>Tap to view details</span>
        </div>
      </div>

      {/* Shimmer Effect */}
      <motion.div
        animate={{ 
          x: ['-100%', '200%']
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
          ease: "easeInOut"
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
        style={{ width: '50%' }}
      />
    </motion.div>
  );
}
