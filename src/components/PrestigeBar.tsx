import React from 'react';
import { motion } from 'motion/react';
import { titleConfigs } from '../utils/titleConfigs';

interface PrestigeBarProps {
  titleName: string;
  titleRarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  onClick?: () => void;
}

export function PrestigeBar({ titleName, titleRarity, onClick }: PrestigeBarProps) {
  const config = titleConfigs[titleName] || titleConfigs['default'];
  
  // Determine glow intensity based on config
  const glowIntensity = {
    low: 'shadow-md',
    medium: 'shadow-lg shadow-amber-500/30',
    high: 'shadow-xl shadow-amber-500/50',
    supreme: 'shadow-2xl shadow-amber-500/70'
  }[config.intensity];

  // Background pattern component
  const BackgroundPattern = () => {
    switch (config.bgPattern) {
      case 'clockwork':
        return (
          <div className="absolute inset-0 opacity-10 overflow-hidden">
            <motion.div
              className="absolute top-1/2 left-1/4 w-12 h-12 sm:w-16 sm:h-16 border-2 border-blue-300 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute top-1/2 left-1/2 w-px h-4 sm:h-6 bg-blue-300 origin-bottom -translate-x-1/2" />
              <div className="absolute top-1/2 left-1/2 w-px h-3 sm:h-4 bg-blue-400 origin-bottom -translate-x-1/2 rotate-90" />
            </motion.div>
            <motion.div
              className="absolute top-1/2 right-1/4 w-8 h-8 sm:w-12 sm:h-12 border-2 border-slate-300 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            />
          </div>
        );
      
      case 'photo-frames':
        return (
          <div className="absolute inset-0 opacity-15 overflow-hidden">
            <div className="absolute top-2 left-4 w-8 h-8 sm:w-10 sm:h-10 border-2 border-purple-300 rotate-12" />
            <div className="absolute top-2 right-4 w-6 h-6 sm:w-8 sm:h-8 border-2 border-pink-300 -rotate-12" />
            <div className="absolute bottom-2 left-1/3 w-7 h-7 sm:w-9 sm:h-9 border-2 border-purple-400 rotate-6" />
          </div>
        );
      
      case 'constellation':
        return (
          <div className="absolute inset-0 opacity-20 overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-cyan-200 rounded-full"
                style={{
                  top: `${20 + (i * 7)}%`,
                  left: `${10 + (i * 8)}%`
                }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2 + i * 0.3, repeat: Infinity }}
              />
            ))}
          </div>
        );
      
      case 'theater-stage':
        return (
          <div className="absolute inset-0 opacity-15 overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 w-full h-2 bg-gradient-to-b from-red-900 to-transparent"
              animate={{ scaleX: [1, 0.98, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-600 to-transparent" />
          </div>
        );
      
      case 'book-pages':
        return (
          <div className="absolute inset-0 opacity-10 overflow-hidden">
            <div className="absolute top-1 left-1/4 w-px h-full bg-green-300" />
            <div className="absolute top-1 left-1/2 w-px h-full bg-green-400" />
            <div className="absolute top-1 left-3/4 w-px h-full bg-green-300" />
          </div>
        );
      
      case 'tapestry':
        return (
          <div className="absolute inset-0 opacity-20 overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 100 40">
              <motion.path
                d="M 0,20 Q 25,10 50,20 T 100,20"
                stroke="rgba(217, 119, 6, 0.4)"
                strokeWidth="1"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.path
                d="M 0,25 Q 25,35 50,25 T 100,25"
                stroke="rgba(146, 64, 14, 0.4)"
                strokeWidth="1"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 0.5, repeat: Infinity }}
              />
            </svg>
          </div>
        );
      
      case 'forge-metal':
        return (
          <div className="absolute inset-0 opacity-15 overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-red-900/30 to-transparent"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
          </div>
        );
      
      case 'sound-waves':
        return (
          <div className="absolute inset-0 opacity-15 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute left-0 right-0 h-px bg-pink-300"
                style={{ top: `${20 + i * 15}%` }}
                animate={{ 
                  scaleX: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ 
                  duration: 1 + i * 0.2, 
                  repeat: Infinity,
                  delay: i * 0.1 
                }}
              />
            ))}
          </div>
        );
      
      case 'echo-rings':
        return (
          <div className="absolute inset-0 opacity-15 overflow-hidden">
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-16 h-16 border-2 border-purple-300 rounded-full" />
            </motion.div>
          </div>
        );
      
      case 'blueprint-grid':
        return (
          <div className="absolute inset-0 opacity-20 overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 100 40">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(245, 158, 11, 0.3)" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100" height="40" fill="url(#grid)" />
            </svg>
            <motion.div
              className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </div>
        );
      
      case 'ancient-scroll':
        return (
          <div className="absolute inset-0 opacity-15 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 to-transparent" 
              style={{ 
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(146, 64, 14, 0.1) 10px, rgba(146, 64, 14, 0.1) 11px)'
              }}
            />
          </div>
        );
      
      case 'royal-velvet':
        return (
          <div className="absolute inset-0 opacity-20 overflow-hidden">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(251, 191, 36, 0.2) 0%, transparent 50%)'
            }} />
            <motion.div
              className="absolute top-0 left-0 w-full h-full"
              style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(251, 191, 36, 0.1) 50%, transparent 70%)',
                backgroundSize: '200% 200%'
              }}
              animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            />
          </div>
        );
      
      case 'library-shelves':
        return (
          <div className="absolute inset-0 opacity-10 overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i}
                className="absolute left-0 right-0 h-px bg-amber-600"
                style={{ top: `${25 + i * 25}%` }}
              />
            ))}
          </div>
        );
      
      case 'cosmic-stars':
        return (
          <div className="absolute inset-0 opacity-25 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-amber-200 rounded-full"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`
                }}
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3] 
                }}
                transition={{ 
                  duration: 1 + Math.random() * 2, 
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              />
            ))}
          </div>
        );
      
      case 'time-vortex':
        return (
          <div className="absolute inset-0 opacity-20 overflow-hidden">
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i}
                  className="absolute inset-0 border-2 border-purple-400 rounded-full"
                  style={{ transform: `scale(${1 - i * 0.3})` }}
                />
              ))}
            </motion.div>
          </div>
        );
      
      case 'archive-files':
        return (
          <div className="absolute inset-0 opacity-10 overflow-hidden">
            <div className="absolute top-2 left-8 w-12 h-16 border-2 border-indigo-300 rounded-sm" />
            <div className="absolute top-4 left-12 w-12 h-16 border-2 border-indigo-400 rounded-sm" />
            <div className="absolute top-2 right-8 w-12 h-16 border-2 border-indigo-300 rounded-sm" />
          </div>
        );
      
      default:
        return (
          <div className="absolute inset-0 opacity-10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
          </div>
        );
    }
  };

  // Particle component
  const Particles = () => {
    const particles = [];
    for (let i = 0; i < config.particleCount; i++) {
      const delay = (i / config.particleCount) * 5;
      const duration = 3 + Math.random() * 2;
      const size = config.intensity === 'supreme' ? 'text-sm' : config.intensity === 'high' ? 'text-xs' : 'text-[10px]';
      
      particles.push(
        <motion.div
          key={i}
          className={`absolute ${size} opacity-0`}
          style={{
            left: `${5 + (i * (90 / config.particleCount))}%`,
            top: `${20 + Math.random() * 60}%`
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0, 0.6, 0],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: duration,
            repeat: Infinity,
            delay: delay,
            ease: "easeInOut"
          }}
        >
          {config.particleType === 'clock' && '⏰'}
          {config.particleType === 'camera' && '📷'}
          {config.particleType === 'star' && '⭐'}
          {config.particleType === 'theater-mask' && '🎭'}
          {config.particleType === 'bookmark' && '🔖'}
          {config.particleType === 'thread' && '🧵'}
          {config.particleType === 'spark' && '✨'}
          {config.particleType === 'note' && '🎵'}
          {config.particleType === 'comment' && '💭'}
          {config.particleType === 'blueprint' && '📐'}
          {config.particleType === 'ink-drop' && '🖋️'}
          {config.particleType === 'crown-jewel' && '💎'}
          {config.particleType === 'ancient-tome' && '📖'}
          {config.particleType === 'star-burst' && '💫'}
          {config.particleType === 'time-fragment' && '⏳'}
          {config.particleType === 'document' && '📄'}
          {config.particleType === 'sparkle' && '✨'}
        </motion.div>
      );
    }
    return <>{particles}</>;
  };

  return (
    <motion.button
      onClick={onClick}
      className={`
        relative w-full py-1.5 sm:py-2.25 
        overflow-hidden cursor-pointer
        transition-all duration-300
        ${glowIntensity}
      `}
      style={{
        background: `linear-gradient(135deg, ${config.colors[0]} 0%, ${config.colors[1]} 100%)`
      }}
      whileHover={{ 
        scale: 1.01,
        brightness: 1.1
      }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Background pattern */}
      <BackgroundPattern />
      
      {/* Particles */}
      <Particles />
      
      {/* Shine overlay for epic+ */}
      {(config.intensity === 'high' || config.intensity === 'supreme') && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ 
            duration: config.intensity === 'supreme' ? 2 : 3, 
            repeat: Infinity,
            ease: "linear"
          }}
        />
      )}
      
      {/* Centered Group: Icon + Text Together */}
      <div className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Icon in Circular Halo - Same row as text */}
          <motion.div
            className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex-shrink-0"
            animate={
              config.animation === 'clock-tick' ? { rotate: [0, 5, 0] } :
              config.animation === 'camera-flash' ? { scale: [1, 1.1, 1] } :
              config.animation === 'star-twinkle' ? { scale: [1, 1.2, 1], rotate: [0, 180, 360] } :
              config.animation === 'curtain-sway' ? { x: [-2, 2, -2] } :
              config.animation === 'page-turn' ? { rotateY: [0, 10, 0] } :
              config.animation === 'thread-weave' ? { x: [-3, 3, -3], y: [-2, 2, -2] } :
              config.animation === 'anvil-strike' ? { y: [0, -3, 0], scale: [1, 1.1, 1] } :
              config.animation === 'wave-pulse' ? { scaleY: [1, 1.2, 1] } :
              config.animation === 'ripple-out' ? { scale: [1, 1.15, 1] } :
              config.animation === 'blueprint-scan' ? { opacity: [1, 0.7, 1] } :
              config.animation === 'scroll-unfurl' ? { scaleX: [1, 1.05, 1] } :
              config.animation === 'crown-sparkle' ? { scale: [1, 1.2, 1], rotate: [0, -10, 0] } :
              config.animation === 'book-glow' ? { filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)'] } :
              config.animation === 'supernova' ? { scale: [1, 1.3, 1], rotate: [0, 360, 720] } :
              config.animation === 'vortex-spin' ? { rotate: [0, 360] } :
              { scale: [1, 1.05, 1] }
            }
            transition={{ 
              duration: config.intensity === 'supreme' ? 2 : config.intensity === 'high' ? 3 : 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <span className="text-xl sm:text-2xl drop-shadow-lg">
              {config.icon}
            </span>
            
            {/* Halo ring glow for higher rarities */}
            {(config.intensity === 'high' || config.intensity === 'supreme') && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-white/50"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
          </motion.div>
          
          {/* Title and Flavor Text - Column next to icon */}
          <div className="flex flex-col items-start">
            <div className="font-bold text-white drop-shadow-lg tracking-wide text-sm sm:text-lg whitespace-nowrap leading-tight">
              {titleName}
            </div>
            <div className="text-white/90 drop-shadow-md text-[10px] sm:text-xs italic whitespace-nowrap leading-tight">
              {config.flavorText}
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}