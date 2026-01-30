import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  DigitalHorizon,
  VintageSunset,
  ApertureLandscape,
  HollywoodHills,
  AudioWaveTerrain,
  VolcanicTerrain,
  PolaroidFrameLandscape
} from './uncommonLandscapes';
import {
  NostalgiaWeaverLandscape,
  AppreciatorLandscape,
  ArchivistLandscape,
  ChronicleWeaverLandscape,
  ChroniquerLandscape,
  CircleBuilderLandscape,
  CircleKeeperLandscape,
  DreamWeaverLandscape,
  FuturistLandscape,
  MediaMasterLandscape,
  ParallelKeeperLandscape,
  SonicArchivistLandscape
} from './uncommonLandscapesActual';

/**
 * 🌌 HORIZON EFFECTS SYSTEM - ULTIMATE EDITION
 * 
 * Provides an absolutely EPIC collection of star fields, particles, and cosmic effects
 * for EVERY horizon. Every tier gets special treatment - no boring horizons allowed!
 * 
 * Effects include:
 * - Twinkling star fields
 * - Shooting stars (ALL tiers now get some!)
 * - Theme-specific particles
 * - Camera flashes, theater curtains, black holes, galaxies, nebulas
 * - Film reels, clock animations, flying letters, photo frames
 * - Sound waves, flame bursts, constellations, page turns
 * - Anvil strikes, cosmic effects, and SO MUCH MORE
 */

// Device detection
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

// Rarity-based configuration - UPDATED to be more generous!
const rarityConfig = {
  common: {
    starCount: isMobile ? 20 : 40,  // ⬆️ Increased from 12/25
    particleCount: isMobile ? 5 : 10,  // ⬆️ Increased from 3/6
    intensity: 0.4,  // ⬆️ Increased from 0.3
    shootingStars: 1  // ⬆️ NEW! Common gets shooting stars now!
  },
  uncommon: {
    starCount: isMobile ? 25 : 50,  // ⬆️ Increased from 15/30
    particleCount: isMobile ? 6 : 12,  // ⬆️ Increased from 4/8
    intensity: 0.5,  // ⬆️ Increased from 0.4
    shootingStars: 1  // ⬆️ NEW! Uncommon gets shooting stars!
  },
  rare: {
    starCount: isMobile ? 35 : 70,  // ⬆️ Increased from 25/50
    particleCount: isMobile ? 10 : 20,  // ⬆️ Increased from 8/15
    intensity: 0.6,  // ⬆️ Increased from 0.5
    shootingStars: 2  // ⬆️ Increased from 1
  },
  epic: {
    starCount: isMobile ? 50 : 100,  // ⬆️ Increased from 40/80
    particleCount: isMobile ? 15 : 30,  // ⬆️ Increased from 12/25
    intensity: 0.8,  // ⬆️ Increased from 0.7
    shootingStars: 3  // ⬆️ Increased from 2
  },
  legendary: {
    starCount: isMobile ? 80 : 150,  // ⬆️ Increased from 60/120
    particleCount: isMobile ? 25 : 50,  // ⬆️ Increased from 20/40
    intensity: 1.0,
    shootingStars: 4  // ⬆️ Increased from 3
  }
};

interface StarFieldProps {
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  colorTheme: string[];
  context: 'active' | 'transition';
}

/**
 * ⭐ Star Field Component - Enhanced twinkling background stars
 */
export function StarField({ rarity, colorTheme, context }: StarFieldProps) {
  const config = rarityConfig[rarity];
  const stars = useMemo(() => Array.from({ length: config.starCount }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2.5 + 0.5,  // ⬆️ Slightly bigger stars
    delay: Math.random() * 3,
    duration: 2 + Math.random() * 2,
    opacity: 0.4 + Math.random() * 0.6  // ⬆️ Brighter stars
  })), [config.starCount]);

  const baseOpacity = context === 'transition' ? 0.9 : 0.5;  // ⬆️ Increased from 0.8/0.4

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map(star => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`
          }}
          animate={{
            opacity: [star.opacity * baseOpacity, baseOpacity, star.opacity * baseOpacity],
            scale: [1, 1.4, 1]  // ⬆️ More dramatic twinkle
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
}

interface ShootingStarProps {
  colorTheme: string[];
  count: number;
}

/**
 * 🌠 Shooting Stars - Now available to ALL tiers!
 */
export function ShootingStars({ colorTheme, count }: ShootingStarProps) {
  const stars = useMemo(() => {
    if (count === 0) return [];
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      startX: Math.random() * 60,
      startY: Math.random() * 60,
      delay: i * 5 + Math.random() * 3
    }));
  }, [count]);

  if (count === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map(star => (
        <motion.div
          key={star.id}
          className="absolute w-20 h-0.5 rounded-full"
          style={{
            left: `${star.startX}%`,
            top: `${star.startY}%`,
            background: `linear-gradient(90deg, transparent, ${colorTheme[0]}, transparent)`,
            boxShadow: `0 0 12px ${colorTheme[0]}`
          }}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{
            x: [0, 250],
            y: [0, 250],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            delay: star.delay,
            ease: 'easeOut'
          }}
        />
      ))}
    </div>
  );
}

interface ThemeParticlesProps {
  titleName: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  colorTheme: string[];
  context: 'active' | 'transition';
}

/**
 * ✨ Theme-Specific Particles - Unique emoji for each horizon
 */
export function ThemeParticles({ titleName, rarity, colorTheme, context }: ThemeParticlesProps) {
  const config = rarityConfig[rarity];
  const particleCount = config.particleCount;

  const particles = useMemo(() => Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    x: Math.random() * 90 + 5,
    y: Math.random() * 80 + 10,
    delay: Math.random() * 3,
    duration: 4 + Math.random() * 3
  })), [particleCount]);

  const getParticleEmoji = (name: string) => {
    const emojiMap: Record<string, string> = {
      'Time Novice': '⏰',
      'Future Messenger': '✉️',
      'Past Receiver': '📬',
      'Snapshot Keeper': '📷',
      'Cinema Pioneer': '🎬',
      'Voice Keeper': '🎙️',
      'Habit Builder': '🔥',
      'Moment Collector': '📸',
      'Era Enthusiast': '⭐',
      'Story Curator': '🎭',
      'Chronicler': '📖',
      'Nostalgia Weaver': '🧵',
      'Legacy Forger': '⚡',
      'Audio Alchemist': '🎵',
      'Echo Magnet': '💬',
      'Memory Architect': '✨',
      'Chronicle Keeper': '📜',
      'Temporal Sovereign': '👑',
      'Grand Historian': '📚',
      'Legend': '⭐',
      'Time Lord': '⌛'
    };
    return emojiMap[name] || '✨';
  };

  const emoji = getParticleEmoji(titleName);
  const baseOpacity = context === 'transition' ? 0.8 : 0.4;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            fontSize: rarity === 'legendary' ? '1.75rem' : rarity === 'epic' ? '1.5rem' : rarity === 'rare' ? '1.25rem' : '1rem'
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0, baseOpacity, 0],
            scale: [0.8, 1.3, 0.8],
            rotate: [0, 15, -15, 0]
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut'
          }}
        >
          {emoji}
        </motion.div>
      ))}
    </div>
  );
}

interface AmbientGlowProps {
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  colorTheme: string[];
}

/**
 * 🌟 Ambient Glow - Now even Common/Uncommon get subtle glows!
 */
export function AmbientGlow({ rarity, colorTheme }: AmbientGlowProps) {
  // Legendary gets multiple glow points
  if (rarity === 'legendary') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 w-72 h-72 rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle, ${colorTheme[0]}50, transparent)`
          }}
          animate={{
            opacity: [0.4, 0.7, 0.4],
            scale: [1, 1.3, 1]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 w-56 h-56 rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle, ${colorTheme[1] || colorTheme[0]}50, transparent)`
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.4, 1]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            delay: 1,
            ease: 'easeInOut'
          }}
        />
      </div>
    );
  }

  // Epic/Rare get single glow
  if (rarity === 'epic' || rarity === 'rare') {
    return (
      <motion.div
        className="absolute top-1/4 right-1/4 w-56 h-56 rounded-full blur-3xl pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${colorTheme[0]}40, transparent)`
        }}
        animate={{
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.3, 1]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    );
  }

  // NEW! Even Common/Uncommon get a subtle glow now
  if (rarity === 'common' || rarity === 'uncommon') {
    return (
      <motion.div
        className="absolute top-1/3 right-1/3 w-40 h-40 rounded-full blur-3xl pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${colorTheme[0]}25, transparent)`
        }}
        animate={{
          opacity: [0.15, 0.3, 0.15],
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    );
  }

  return null;
}

/**
 * 🌈 Legendary Aurora Effect - Sweeping light beams
 */
export function LegendaryAurora({ colorTheme }: { colorTheme: string[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, transparent, ${colorTheme[0]}25, ${colorTheme[1] || colorTheme[0]}25, transparent)`
        }}
        animate={{
          x: ['-100%', '100%'],
          opacity: [0, 0.6, 0]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    </div>
  );
}

// ============================================================
// 🎨 NEW SPECIAL EFFECTS - Title-Specific Awesomeness!
// ============================================================

/**
 * 📸 Camera Flash - For Snapshot Keeper & Moment Collector
 */
export function CameraFlash({ colorTheme }: { colorTheme: string[] }) {
  const flashes = useMemo(() => Array.from({ length: isMobile ? 2 : 3 }, (_, i) => ({
    id: i,
    x: 20 + Math.random() * 60,
    y: 20 + Math.random() * 60,
    delay: i * 4 + Math.random() * 2
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {flashes.map(flash => (
        <motion.div
          key={flash.id}
          className="absolute w-32 h-32 rounded-full"
          style={{
            left: `${flash.x}%`,
            top: `${flash.y}%`,
            background: 'radial-gradient(circle, rgba(255,255,255,0.9), transparent)'
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0]
          }}
          transition={{
            duration: 0.4,
            repeat: Infinity,
            delay: flash.delay,
            ease: 'easeOut'
          }}
        />
      ))}
    </div>
  );
}

/**
 * 🎞️ Polaroid Photos - Floating up and fading
 */
export function FloatingPhotos({ colorTheme }: { colorTheme: string[] }) {
  const photos = useMemo(() => Array.from({ length: isMobile ? 2 : 4 }, (_, i) => ({
    id: i,
    x: 10 + Math.random() * 80,
    delay: i * 3 + Math.random() * 2
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {photos.map(photo => (
        <motion.div
          key={photo.id}
          className="absolute w-12 h-14 bg-white rounded-sm shadow-lg"
          style={{
            left: `${photo.x}%`,
            bottom: '-10%',
            border: '2px solid white',
            boxShadow: `0 4px 12px ${colorTheme[0]}40`
          }}
          animate={{
            y: [0, -window.innerHeight * 1.2],
            rotate: [-5, 5, -5],
            opacity: [0, 0.6, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            delay: photo.delay,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
}

/**
 * 🎭 Theater Curtains - Opening and closing at edges
 */
export function TheaterCurtains({ colorTheme }: { colorTheme: string[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Left curtain */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-16"
        style={{
          background: `linear-gradient(90deg, ${colorTheme[0]}60, transparent)`
        }}
        animate={{
          x: [-20, 0, -20],
          opacity: [0.4, 0.7, 0.4]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      {/* Right curtain */}
      <motion.div
        className="absolute right-0 top-0 bottom-0 w-16"
        style={{
          background: `linear-gradient(270deg, ${colorTheme[0]}60, transparent)`
        }}
        animate={{
          x: [20, 0, 20],
          opacity: [0.4, 0.7, 0.4]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    </div>
  );
}

/**
 * 🎬 Film Reels - Spinning in corners
 */
export function FilmReels({ colorTheme }: { colorTheme: string[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Top left reel */}
      <motion.div
        className="absolute top-4 left-4 w-12 h-12 rounded-full border-4 opacity-30"
        style={{
          borderColor: colorTheme[0],
          boxShadow: `inset 0 0 8px ${colorTheme[0]}`
        }}
        animate={{
          rotate: 360
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'linear'
        }}
      >
        <div className="absolute inset-2 rounded-full border-2" style={{ borderColor: colorTheme[0] }} />
      </motion.div>
      
      {/* Top right reel */}
      <motion.div
        className="absolute top-4 right-4 w-12 h-12 rounded-full border-4 opacity-30"
        style={{
          borderColor: colorTheme[1] || colorTheme[0],
          boxShadow: `inset 0 0 8px ${colorTheme[1] || colorTheme[0]}`
        }}
        animate={{
          rotate: -360
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'linear'
        }}
      >
        <div className="absolute inset-2 rounded-full border-2" style={{ borderColor: colorTheme[1] || colorTheme[0] }} />
      </motion.div>
    </div>
  );
}

/**
 * ⏰ Clock Hands - Rotating around screen
 */
export function ClockHands({ colorTheme }: { colorTheme: string[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
      <div className="relative w-32 h-32 opacity-20">
        {/* Hour hand */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-1 h-10 rounded-full origin-bottom"
          style={{
            background: colorTheme[0],
            transform: 'translateX(-50%) translateY(-100%)'
          }}
          animate={{
            rotate: 360
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
        {/* Minute hand */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-0.5 h-14 rounded-full origin-bottom"
          style={{
            background: colorTheme[1] || colorTheme[0],
            transform: 'translateX(-50%) translateY(-100%)'
          }}
          animate={{
            rotate: 360
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      </div>
    </div>
  );
}

/**
 * 🌊 Time Ripples - Emanating from corners
 */
export function TimeRipples({ colorTheme }: { colorTheme: string[] }) {
  const ripples = useMemo(() => [
    { corner: 'top-0 left-0', delay: 0 },
    { corner: 'top-0 right-0', delay: 1 },
    { corner: 'bottom-0 left-0', delay: 2 },
    { corner: 'bottom-0 right-0', delay: 3 }
  ], []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {ripples.map((ripple, i) => (
        <div key={i} className={`absolute ${ripple.corner}`}>
          <motion.div
            className="w-32 h-32 rounded-full border-2"
            style={{
              borderColor: `${colorTheme[0]}40`
            }}
            animate={{
              scale: [0, 2],
              opacity: [0.5, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: ripple.delay,
              ease: 'easeOut'
            }}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * ✉️ Flying Envelopes - Paper airplane style
 */
export function FlyingEnvelopes({ colorTheme }: { colorTheme: string[] }) {
  const envelopes = useMemo(() => Array.from({ length: isMobile ? 2 : 3 }, (_, i) => ({
    id: i,
    startY: 20 + Math.random() * 60,
    delay: i * 4 + Math.random() * 2
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {envelopes.map(env => (
        <motion.div
          key={env.id}
          className="absolute text-2xl"
          style={{
            left: '-5%',
            top: `${env.startY}%`
          }}
          animate={{
            x: ['0%', '110%'],
            y: [0, -30, 0, 30, 0],
            rotate: [0, -10, 0, 10, 0],
            opacity: [0, 0.7, 0.7, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            delay: env.delay,
            ease: 'easeInOut'
          }}
        >
          ✉️
        </motion.div>
      ))}
    </div>
  );
}

/**
 * 📮 Floating Letters - Vintage mail falling like snow
 */
export function FloatingLetters({ colorTheme }: { colorTheme: string[] }) {
  const letters = useMemo(() => Array.from({ length: isMobile ? 3 : 5 }, (_, i) => ({
    id: i,
    x: Math.random() * 90,
    delay: i * 2
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {letters.map(letter => (
        <motion.div
          key={letter.id}
          className="absolute text-xl"
          style={{
            left: `${letter.x}%`,
            top: '-5%'
          }}
          animate={{
            y: [0, window.innerHeight * 1.1],
            rotate: [0, 360],
            opacity: [0, 0.6, 0]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            delay: letter.delay,
            ease: 'linear'
          }}
        >
          📄
        </motion.div>
      ))}
    </div>
  );
}

/**
 * 📬 Postal Stamps - Appearing and fading
 */
export function PostalStamps({ colorTheme }: { colorTheme: string[] }) {
  const stamps = useMemo(() => Array.from({ length: isMobile ? 2 : 4 }, (_, i) => ({
    id: i,
    x: 10 + Math.random() * 80,
    y: 10 + Math.random() * 80,
    delay: i * 3
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stamps.map(stamp => (
        <motion.div
          key={stamp.id}
          className="absolute w-10 h-12 border-2 rounded"
          style={{
            left: `${stamp.x}%`,
            top: `${stamp.y}%`,
            borderColor: colorTheme[0],
            borderStyle: 'dashed',
            background: `${colorTheme[0]}20`
          }}
          animate={{
            scale: [0, 1, 1, 0],
            rotate: [-5, 5, -5],
            opacity: [0, 0.6, 0.6, 0]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            delay: stamp.delay,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
}

/**
 * 🎵 Sound Wave Ripples - From center outward
 */
export function SoundWaveRipples({ colorTheme }: { colorTheme: string[] }) {
  const waves = useMemo(() => Array.from({ length: 3 }, (_, i) => ({
    id: i,
    delay: i * 0.8
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
      {waves.map(wave => (
        <motion.div
          key={wave.id}
          className="absolute w-20 h-20 rounded-full border-2"
          style={{
            borderColor: `${colorTheme[0]}60`
          }}
          animate={{
            scale: [1, 4],
            opacity: [0.6, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: wave.delay,
            ease: 'easeOut'
          }}
        />
      ))}
    </div>
  );
}

/**
 * 🎵 Musical Notes - Dancing around
 */
export function MusicalNotes({ colorTheme }: { colorTheme: string[] }) {
  const noteElements = useMemo(() => {
    const notes = ['♪', '♫', '♬', '♩'];
    return Array.from({ length: isMobile ? 3 : 5 }, (_, i) => ({
      id: i,
      note: notes[i % notes.length],
      x: Math.random() * 90,
      y: Math.random() * 80,
      delay: i * 1.5
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {noteElements.map(note => (
        <motion.div
          key={note.id}
          className="absolute text-2xl"
          style={{
            left: `${note.x}%`,
            top: `${note.y}%`,
            color: colorTheme[0]
          }}
          animate={{
            y: [0, -50, 0],
            x: [-10, 10, -10],
            scale: [0.8, 1.2, 0.8],
            opacity: [0, 0.7, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: note.delay,
            ease: 'easeInOut'
          }}
        >
          {note.note}
        </motion.div>
      ))}
    </div>
  );
}

/**
 * 🔥 Flame Bursts - Achievement unlocked style!
 */
export function FlameBursts({ colorTheme }: { colorTheme: string[] }) {
  const bursts = useMemo(() => Array.from({ length: isMobile ? 2 : 3 }, (_, i) => ({
    id: i,
    x: 20 + Math.random() * 60,
    y: 20 + Math.random() * 60,
    delay: i * 4
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {bursts.map(burst => (
        <motion.div
          key={burst.id}
          className="absolute text-4xl"
          style={{
            left: `${burst.x}%`,
            top: `${burst.y}%`
          }}
          animate={{
            scale: [0, 1.5, 0],
            rotate: [0, 180, 360],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: burst.delay,
            ease: 'easeOut'
          }}
        >
          🔥
        </motion.div>
      ))}
    </div>
  );
}

/**
 * 🪨 Ember Particles - Floating upward like campfire
 */
export function EmberParticles({ colorTheme }: { colorTheme: string[] }) {
  const embers = useMemo(() => Array.from({ length: isMobile ? 4 : 8 }, (_, i) => ({
    id: i,
    x: 20 + Math.random() * 60,
    delay: i * 1.5
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {embers.map(ember => (
        <motion.div
          key={ember.id}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            left: `${ember.x}%`,
            bottom: '0%',
            background: colorTheme[0],
            boxShadow: `0 0 8px ${colorTheme[0]}`
          }}
          animate={{
            y: [0, -window.innerHeight * 0.8],
            x: [0, (Math.random() - 0.5) * 100],
            opacity: [1, 0]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            delay: ember.delay,
            ease: 'easeOut'
          }}
        />
      ))}
    </div>
  );
}

/**
 * ⭐ Constellation Formation - Stars forming patterns
 */
export function ConstellationFormation({ colorTheme }: { colorTheme: string[] }) {
  const stars = useMemo(() => Array.from({ length: 5 }, (_, i) => ({
    id: i,
    x: 30 + i * 10,
    y: 30 + (i % 2) * 20
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="w-full h-full">
        {/* Connection lines */}
        <motion.polyline
          points={stars.map(s => `${s.x}%,${s.y}%`).join(' ')}
          fill="none"
          stroke={colorTheme[0]}
          strokeWidth="1"
          animate={{
            opacity: [0, 0.4, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </svg>
      {/* Stars */}
      {stars.map(star => (
        <motion.div
          key={star.id}
          className="absolute w-2 h-2 rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`
          }}
          animate={{
            scale: [0, 1, 1, 0],
            opacity: [0, 1, 1, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
}

/**
 * 📖 Page Turning - Book pages flipping
 */
export function PageTurning({ colorTheme }: { colorTheme: string[] }) {
  const pages = useMemo(() => Array.from({ length: isMobile ? 2 : 3 }, (_, i) => ({
    id: i,
    x: 20 + i * 30,
    y: 30,
    delay: i * 2
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pages.map(page => (
        <motion.div
          key={page.id}
          className="absolute w-16 h-20 rounded shadow-lg"
          style={{
            left: `${page.x}%`,
            top: `${page.y}%`,
            background: `linear-gradient(90deg, ${colorTheme[0]}40, white, ${colorTheme[0]}20)`,
            border: '1px solid rgba(0,0,0,0.1)'
          }}
          animate={{
            rotateY: [0, 180, 180, 0],
            opacity: [0, 0.8, 0.8, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: page.delay,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
}

/**
 * 🖋️ Quill Feathers - Floating down gracefully
 */
export function QuillFeathers({ colorTheme }: { colorTheme: string[] }) {
  const feathers = useMemo(() => Array.from({ length: isMobile ? 2 : 3 }, (_, i) => ({
    id: i,
    x: Math.random() * 90,
    delay: i * 3
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {feathers.map(feather => (
        <motion.div
          key={feather.id}
          className="absolute text-2xl"
          style={{
            left: `${feather.x}%`,
            top: '-5%'
          }}
          animate={{
            y: [0, window.innerHeight * 1.1],
            x: [0, (Math.random() - 0.5) * 50],
            rotate: [0, 360],
            opacity: [0, 0.6, 0]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            delay: feather.delay,
            ease: 'easeInOut'
          }}
        >
          🪶
        </motion.div>
      ))}
    </div>
  );
}

/**
 * 🕳️ Black Hole - Swirling vortex that appears and disappears
 */
export function BlackHole({ colorTheme }: { colorTheme: string[] }) {
  const particles = useMemo(() => Array.from({ length: 8 }, (_, i) => i), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
      <motion.div
        className="absolute w-32 h-32 rounded-full"
        style={{
          background: `radial-gradient(circle, #000000, ${colorTheme[0]}40, transparent)`
        }}
        animate={{
          scale: [0, 1, 1, 0],
          rotate: [0, 360],
          opacity: [0, 0.8, 0.8, 0]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      {/* Swirling particles being sucked in */}
      {particles.map((i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-white"
          style={{
            left: '50%',
            top: '50%'
          }}
          animate={{
            x: [Math.cos(i * 45 * Math.PI / 180) * 100, 0],
            y: [Math.sin(i * 45 * Math.PI / 180) * 100, 0],
            scale: [1, 0],
            opacity: [0.8, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: 5 + (i * 0.2),
            ease: 'easeIn'
          }}
        />
      ))}
    </div>
  );
}

/**
 * 🌌 Galaxy Spiral - Appearing and disappearing
 */
export function GalaxySpiral({ colorTheme }: { colorTheme: string[] }) {
  const arms = useMemo(() => Array.from({ length: 3 }, (_, i) => i), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
      <motion.div
        className="absolute w-48 h-48 rounded-full"
        style={{
          background: `radial-gradient(ellipse, ${colorTheme[0]}40, ${colorTheme[1] || colorTheme[0]}30, transparent)`
        }}
        animate={{
          scale: [0, 1.5, 0],
          rotate: [0, 720],
          opacity: [0, 0.6, 0]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      {/* Spiral arms */}
      {arms.map((i) => (
        <motion.div
          key={i}
          className="absolute w-24 h-1 rounded-full origin-left"
          style={{
            background: `linear-gradient(90deg, ${colorTheme[0]}, transparent)`,
            left: '50%',
            top: '50%',
            rotate: i * 120
          }}
          animate={{
            rotate: [i * 120, i * 120 + 720],
            opacity: [0, 0.6, 0]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      ))}
    </div>
  );
}

/**
 * 🌫️ Nebula Clouds - Drifting cosmic dust
 */
export function NebulaClouds({ colorTheme }: { colorTheme: string[] }) {
  const clouds = useMemo(() => Array.from({ length: isMobile ? 1 : 2 }, (_, i) => ({
    id: i,
    startX: i % 2 === 0 ? -20 : 120,
    y: 20 + Math.random() * 60,
    delay: i * 8
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {clouds.map(cloud => (
        <motion.div
          key={cloud.id}
          className="absolute w-64 h-64 rounded-full blur-3xl"
          style={{
            left: `${cloud.startX}%`,
            top: `${cloud.y}%`,
            background: `radial-gradient(circle, ${colorTheme[0]}30, ${colorTheme[1] || colorTheme[0]}20, transparent)`
          }}
          animate={{
            x: cloud.startX < 50 ? ['0%', '120%'] : ['0%', '-120%'],
            opacity: [0, 0.5, 0]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            delay: cloud.delay,
            ease: 'linear'
          }}
        />
      ))}
    </div>
  );
}

/**
 * 🎨 Color Burst - Explosion from random point
 */
export function ColorBurst({ colorTheme }: { colorTheme: string[] }) {
  const bursts = useMemo(() => Array.from({ length: isMobile ? 1 : 2 }, (_, i) => ({
    id: i,
    x: 30 + Math.random() * 40,
    y: 30 + Math.random() * 40,
    delay: i * 10
  })), []);

  const particles = useMemo(() => Array.from({ length: 5 }, (_, i) => i), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {bursts.map(burst => (
        <div key={burst.id} style={{ position: 'absolute', left: `${burst.x}%`, top: `${burst.y}%` }}>
          {/* Radiating circles */}
          {particles.map((i) => (
            <motion.div
              key={i}
              className="absolute w-4 h-4 rounded-full"
              style={{
                background: colorTheme[i % colorTheme.length]
              }}
              animate={{
                x: [0, Math.cos(i * 72 * Math.PI / 180) * 100],
                y: [0, Math.sin(i * 72 * Math.PI / 180) * 100],
                scale: [1, 0],
                opacity: [1, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: burst.delay + (i * 0.1),
                ease: 'easeOut'
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * 🔨 Anvil Strike - For Legacy Forger
 */
export function AnvilStrike({ colorTheme }: { colorTheme: string[] }) {
  const sparks = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 70%, ${colorTheme[0]}30, transparent)`
        }}
        animate={{
          opacity: [0, 1, 0],
          scale: [0.8, 1.2, 0.8]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeOut'
        }}
      />
      {/* Sparks flying */}
      {sparks.map((i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: '50%',
            top: '70%',
            background: colorTheme[0],
            boxShadow: `0 0 8px ${colorTheme[0]}`
          }}
          animate={{
            x: [0, (Math.random() - 0.5) * 200],
            y: [0, -100 - Math.random() * 100],
            opacity: [1, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: (i * 0.1),
            ease: 'easeOut'
          }}
        />
      ))}
    </div>
  );
}

/**
 * 🌈 Universal Aurora Wave - Available to ALL tiers!
 */
export function UniversalAurora({ colorTheme }: { colorTheme: string[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(120deg, transparent, ${colorTheme[0]}15, ${colorTheme[1] || colorTheme[0]}15, transparent)`
        }}
        animate={{
          x: ['-100%', '100%'],
          opacity: [0, 0.5, 0]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    </div>
  );
}

/**
 * 🌙 Moon Phases - For Midnight Chronicler
 */
export function MoonPhases({ colorTheme }: { colorTheme: string[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute w-24 h-24 rounded-full"
        style={{
          right: '10%',
          top: '15%',
          background: `radial-gradient(circle at 30% 30%, ${colorTheme[0]}90, ${colorTheme[1] || colorTheme[0]}60)`,
          boxShadow: `0 0 60px ${colorTheme[0]}60, inset -10px -10px 20px rgba(0,0,0,0.3)`
        }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.9, 1, 0.9]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    </div>
  );
}

/**
 * 🌠 Constellation Lines - For Midnight Chronicler
 */
export function ConstellationLines({ colorTheme }: { colorTheme: string[] }) {
  const lines = useMemo(() => Array.from({ length: isMobile ? 3 : 6 }, (_, i) => ({
    id: i,
    x1: 10 + Math.random() * 80,
    y1: 10 + Math.random() * 80,
    x2: 15 + Math.random() * 70,
    y2: 15 + Math.random() * 70,
    delay: i * 0.5
  })), []);

  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
      {lines.map(line => (
        <motion.line
          key={line.id}
          x1={`${line.x1}%`}
          y1={`${line.y1}%`}
          x2={`${line.x2}%`}
          y2={`${line.y2}%`}
          stroke={colorTheme[0]}
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1, 1, 0],
            opacity: [0, 0.6, 0.6, 0]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            delay: line.delay,
            ease: 'easeInOut'
          }}
        />
      ))}
    </svg>
  );
}

/**
 * 💭 Dream Bubbles - For Dream Weaver
 */
export function DreamBubbles({ colorTheme }: { colorTheme: string[] }) {
  const bubbles = useMemo(() => Array.from({ length: isMobile ? 4 : 8 }, (_, i) => ({
    id: i,
    x: 10 + Math.random() * 80,
    size: 40 + Math.random() * 60,
    delay: Math.random() * 5,
    duration: 15 + Math.random() * 10
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {bubbles.map(bubble => (
        <motion.div
          key={bubble.id}
          className="absolute rounded-full"
          style={{
            left: `${bubble.x}%`,
            bottom: '-10%',
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            background: `radial-gradient(circle at 30% 30%, ${colorTheme[0]}30, ${colorTheme[1] || colorTheme[0]}15, transparent)`,
            border: `2px solid ${colorTheme[0]}40`,
            backdropFilter: 'blur(4px)'
          }}
          animate={{
            y: [0, -600],
            x: [0, (Math.random() - 0.5) * 100],
            scale: [1, 1.2, 0.8],
            opacity: [0, 0.7, 0]
          }}
          transition={{
            duration: bubble.duration,
            repeat: Infinity,
            delay: bubble.delay,
            ease: 'easeOut'
          }}
        />
      ))}
    </div>
  );
}

/**
 * ☁️ Ethereal Clouds - For Dream Weaver
 */
export function EtherealClouds({ colorTheme }: { colorTheme: string[] }) {
  const clouds = useMemo(() => Array.from({ length: isMobile ? 2 : 4 }, (_, i) => ({
    id: i,
    y: 20 + i * 25,
    delay: i * 3
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {clouds.map(cloud => (
        <motion.div
          key={cloud.id}
          className="absolute w-64 h-32 rounded-full blur-2xl"
          style={{
            left: '-20%',
            top: `${cloud.y}%`,
            background: `linear-gradient(90deg, ${colorTheme[0]}20, ${colorTheme[1] || colorTheme[0]}30, ${colorTheme[0]}20)`,
            opacity: 0.3
          }}
          animate={{
            x: ['0%', '120%'],
            scale: [1, 1.3, 1],
            opacity: [0, 0.4, 0]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            delay: cloud.delay,
            ease: 'linear'
          }}
        />
      ))}
    </div>
  );
}

/**
 * 🔷 Holographic Grid - For Futurist
 */
export function HolographicGrid({ colorTheme }: { colorTheme: string[] }) {
  const lines = useMemo(() => Array.from({ length: isMobile ? 5 : 10 }, (_, i) => i), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {lines.map((i) => (
        <motion.div
          key={`h-${i}`}
          className="absolute w-full h-px"
          style={{
            top: `${(i + 1) * (100 / (lines.length + 1))}%`,
            background: `linear-gradient(90deg, transparent, ${colorTheme[0]}50, transparent)`
          }}
          animate={{
            opacity: [0.2, 0.6, 0.2],
            scaleX: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
}

/**
 * ⚡ Neon Pulses - For Futurist
 */
export function NeonPulses({ colorTheme }: { colorTheme: string[] }) {
  const pulses = useMemo(() => Array.from({ length: isMobile ? 2 : 4 }, (_, i) => ({
    id: i,
    delay: i * 2
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pulses.map(pulse => (
        <motion.div
          key={pulse.id}
          className="absolute inset-0 border-2 rounded-full"
          style={{
            borderColor: colorTheme[0],
            boxShadow: `0 0 20px ${colorTheme[0]}80`
          }}
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{
            scale: [0, 2.5],
            opacity: [0.8, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: pulse.delay,
            ease: 'easeOut'
          }}
        />
      ))}
    </div>
  );
}

/**
 * 🎊 Confetti Burst - For Sticker Master
 */
export function ConfettiBurst({ colorTheme }: { colorTheme: string[] }) {
  const confetti = useMemo(() => Array.from({ length: isMobile ? 15 : 30 }, (_, i) => ({
    id: i,
    x: 50 + (Math.random() - 0.5) * 40,
    delay: Math.random() * 3,
    rotate: Math.random() * 360,
    color: i % 2 === 0 ? colorTheme[0] : colorTheme[1] || colorTheme[0]
  })), [colorTheme]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {confetti.map(piece => (
        <motion.div
          key={piece.id}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            left: `${piece.x}%`,
            top: '-5%',
            backgroundColor: piece.color,
            rotate: piece.rotate
          }}
          animate={{
            y: [0, 600],
            x: [(Math.random() - 0.5) * 200],
            rotate: [piece.rotate, piece.rotate + 720],
            opacity: [1, 0.8, 0]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: piece.delay,
            ease: 'easeIn'
          }}
        />
      ))}
    </div>
  );
}

/**
 * 🚀 Orbital Rings - For Chrononaut
 */
export function OrbitalRings({ colorTheme }: { colorTheme: string[] }) {
  const rings = useMemo(() => Array.from({ length: 3 }, (_, i) => ({
    id: i,
    size: 150 + i * 100,
    duration: 20 + i * 10,
    delay: i * 2
  })), []);

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
      {rings.map(ring => (
        <motion.div
          key={ring.id}
          className="absolute rounded-full border-2"
          style={{
            width: `${ring.size}px`,
            height: `${ring.size}px`,
            borderColor: colorTheme[0],
            opacity: 0.3
          }}
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: ring.duration,
            repeat: Infinity,
            delay: ring.delay,
            ease: 'linear'
          }}
        />
      ))}
    </div>
  );
}

/**
 * ✨ Rocket Trails - For Chrononaut
 */
export function RocketTrails({ colorTheme }: { colorTheme: string[] }) {
  const trails = useMemo(() => Array.from({ length: isMobile ? 2 : 4 }, (_, i) => ({
    id: i,
    delay: i * 3
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {trails.map(trail => (
        <motion.div
          key={trail.id}
          className="absolute w-1 h-20"
          style={{
            left: `${20 + trail.id * 25}%`,
            bottom: '-20%',
            background: `linear-gradient(180deg, ${colorTheme[0]}, transparent)`,
            boxShadow: `0 0 20px ${colorTheme[0]}`
          }}
          animate={{
            y: [0, -700],
            opacity: [0, 1, 0.5, 0]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            delay: trail.delay,
            ease: 'easeOut'
          }}
        />
      ))}
    </div>
  );
}

/**
 * 🏅 Medal Shine - For Veteran
 */
export function MedalShine({ colorTheme }: { colorTheme: string[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute w-20 h-20 rounded-full"
        style={{
          left: '10%',
          top: '20%',
          background: `radial-gradient(circle, ${colorTheme[0]}, ${colorTheme[1] || colorTheme[0]})`,
          boxShadow: `0 0 40px ${colorTheme[0]}80`
        }}
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
          opacity: [0.8, 1, 0.8]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    </div>
  );
}

/**
 * 🛡️ Shield Pulses - For Legacy Guardian
 */
export function ShieldPulses({ colorTheme }: { colorTheme: string[] }) {
  const pulses = useMemo(() => Array.from({ length: 3 }, (_, i) => ({
    id: i,
    delay: i * 1.3
  })), []);

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
      {pulses.map(pulse => (
        <motion.div
          key={pulse.id}
          className="absolute"
          style={{
            width: '200px',
            height: '240px',
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            border: `2px solid ${colorTheme[0]}`,
            opacity: 0.3
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: pulse.delay,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
}

/**
 * 🎬 Film Strip Scroll - For Cinematographer
 */
export function FilmStripScroll({ colorTheme }: { colorTheme: string[] }) {
  const strips = useMemo(() => [0, 1], []);
  const frames = useMemo(() => Array.from({ length: 20 }, (_, i) => i), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
      {strips.map(stripIndex => (
        <motion.div
          key={stripIndex}
          className="absolute h-16 flex items-center gap-2"
          style={{
            left: stripIndex === 0 ? '-100%' : '100%',
            top: `${30 + stripIndex * 40}%`,
            width: '200%'
          }}
          animate={{
            x: stripIndex === 0 ? ['0%', '200%'] : ['-200%', '0%']
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear'
          }}
        >
          {frames.map((i) => (
            <div
              key={i}
              className="w-12 h-12 border-2 flex-shrink-0"
              style={{
                borderColor: colorTheme[0],
                backgroundColor: `${colorTheme[0]}20`
              }}
            />
          ))}
        </motion.div>
      ))}
    </div>
  );
}

/**
 * 💫 Spotlight Sweep - For Cinematographer
 */
export function SpotlightSweep({ colorTheme }: { colorTheme: string[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute w-32 h-full blur-2xl"
        style={{
          left: '-20%',
          background: `linear-gradient(90deg, transparent, ${colorTheme[0]}30, transparent)`
        }}
        animate={{
          x: ['0%', '150%']
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    </div>
  );
}

/**
 * 💕 Heart Particles - For Social Connector
 */
export function HeartParticles({ colorTheme }: { colorTheme: string[] }) {
  const hearts = useMemo(() => Array.from({ length: isMobile ? 5 : 10 }, (_, i) => ({
    id: i,
    x: 10 + Math.random() * 80,
    delay: Math.random() * 4,
    size: 12 + Math.random() * 12
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {hearts.map(heart => (
        <motion.div
          key={heart.id}
          className="absolute"
          style={{
            left: `${heart.x}%`,
            bottom: '-10%',
            fontSize: `${heart.size}px`,
            color: colorTheme[0]
          }}
          animate={{
            y: [0, -700],
            x: [(Math.random() - 0.5) * 50],
            rotate: [0, (Math.random() - 0.5) * 90],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 6 + Math.random() * 3,
            repeat: Infinity,
            delay: heart.delay,
            ease: 'easeOut'
          }}
        >
          ❤️
        </motion.div>
      ))}
    </div>
  );
}

/**
 * 🔗 Connection Lines - For Social Connector
 */
export function ConnectionLines({ colorTheme }: { colorTheme: string[] }) {
  const connections = useMemo(() => Array.from({ length: isMobile ? 3 : 6 }, (_, i) => ({
    id: i,
    x1: 10 + Math.random() * 30,
    y1: 20 + Math.random() * 60,
    x2: 60 + Math.random() * 30,
    y2: 20 + Math.random() * 60,
    delay: i * 0.8
  })), []);

  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
      {connections.map(conn => (
        <g key={conn.id}>
          <motion.line
            x1={`${conn.x1}%`}
            y1={`${conn.y1}%`}
            x2={`${conn.x2}%`}
            y2={`${conn.y2}%`}
            stroke={colorTheme[0]}
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: [0, 1],
              opacity: [0, 0.6, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: conn.delay,
              ease: 'easeInOut'
            }}
          />
          <circle cx={`${conn.x1}%`} cy={`${conn.y1}%`} r="3" fill={colorTheme[0]} opacity="0.8" />
          <circle cx={`${conn.x2}%`} cy={`${conn.y2}%`} r="3" fill={colorTheme[0]} opacity="0.8" />
        </g>
      ))}
    </svg>
  );
}

/**
 * 🧭 Chrono Compass - For Era Enthusiast
 * A rotating compass/astrolabe effect in the background
 */
export function ChronoCompass({ colorTheme }: { colorTheme: string[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
      {/* Outer Ring */}
      <motion.div
        className="absolute w-[80vw] h-[80vw] sm:w-[400px] sm:h-[400px] rounded-full border-2 border-dashed opacity-20"
        style={{ borderColor: colorTheme[0] }}
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      />
      {/* Middle Ring */}
      <motion.div
        className="absolute w-[60vw] h-[60vw] sm:w-[300px] sm:h-[300px] rounded-full border opacity-30"
        style={{ borderColor: colorTheme[1] || colorTheme[0] }}
        animate={{ rotate: -360 }}
        transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute top-0 left-1/2 w-2 h-2 rounded-full bg-current -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-1/2 w-2 h-2 rounded-full bg-current -translate-x-1/2 translate-y-1/2" />
      </motion.div>
      {/* Inner Star/Compass */}
      <motion.div
        className="absolute w-[40vw] h-[40vw] sm:w-[200px] sm:h-[200px] opacity-40"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full fill-current" style={{ color: colorTheme[0] }}>
          <path d="M50 0 L60 40 L100 50 L60 60 L50 100 L40 60 L0 50 L40 40 Z" />
        </svg>
      </motion.div>
    </div>
  );
}

/**
 * 🖋️ Ink Spills - For Chronicler
 * Organic ink blot animations spreading across the screen
 */
export function InkSpills({ colorTheme }: { colorTheme: string[] }) {
  const blobs = useMemo(() => Array.from({ length: 3 }, (_, i) => ({
    id: i,
    x: 20 + i * 30,
    y: 30 + i * 20,
    scale: 1 + Math.random(),
    delay: i * 2
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {blobs.map(blob => (
        <motion.div
          key={blob.id}
          className="absolute rounded-full filter blur-xl opacity-30 mix-blend-multiply"
          style={{
            left: `${blob.x}%`,
            top: `${blob.y}%`,
            width: '150px',
            height: '150px',
            background: colorTheme[0]
          }}
          animate={{
            scale: [0, blob.scale],
            opacity: [0.6, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            delay: blob.delay,
            ease: 'easeOut'
          }}
        />
      ))}
    </div>
  );
}

/**
 * 🖼️ Museum Pedestals - For Story Curator
 * Floating pedestals with artifacts
 */
export function MuseumPedestals({ colorTheme }: { colorTheme: string[] }) {
  const items = useMemo(() => Array.from({ length: 3 }, (_, i) => ({
    id: i,
    x: 20 + i * 30,
    delay: i * 1.5
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {items.map(item => (
        <motion.div
          key={item.id}
          className="absolute bottom-0 w-24 h-32 bg-gradient-to-t from-black/40 to-transparent"
          style={{
            left: `${item.x}%`,
            borderTop: `2px solid ${colorTheme[0]}40`
          }}
          animate={{
            y: [20, 0, 20],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            delay: item.delay,
            ease: 'easeInOut'
          }}
        >
          {/* Floating artifact above */}
          <motion.div
            className="absolute -top-12 left-1/2 -translate-x-1/2 w-8 h-8 rounded border rotate-45"
            style={{ borderColor: colorTheme[0] }}
            animate={{ rotate: [45, 225], y: [-5, 5, -5] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      ))}
    </div>
  );
}

/**
 * 🕰️ Time Gears - For Eternal Witness
 * Massive rotating gears
 */
export function TimeGears({ colorTheme }: { colorTheme: string[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Big Gear Left */}
      <motion.div
        className="absolute -left-20 -bottom-20 w-64 h-64 opacity-10"
        style={{ 
          backgroundImage: `repeating-conic-gradient(${colorTheme[0]} 0% 5%, transparent 5% 10%)`,
          borderRadius: '50%'
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      />
      {/* Big Gear Right */}
      <motion.div
        className="absolute -right-20 -top-20 w-80 h-80 opacity-10"
        style={{ 
          backgroundImage: `repeating-conic-gradient(${colorTheme[1] || colorTheme[0]} 0% 5%, transparent 5% 10%)`,
          borderRadius: '50%'
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

/**
 * 💾 Digital Stream - For Master Archivist
 * Matrix-style raining data streams
 */
export function DigitalStream({ colorTheme }: { colorTheme: string[] }) {
  const streams = useMemo(() => Array.from({ length: typeof window !== 'undefined' && window.innerWidth < 768 ? 6 : 12 }, (_, i) => ({
    id: i,
    x: 5 + i * (100 / (typeof window !== 'undefined' && window.innerWidth < 768 ? 6 : 12)),
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none font-mono text-xs opacity-30">
      {streams.map(stream => (
        <motion.div
          key={stream.id}
          className="absolute top-0 flex flex-col items-center"
          style={{
            left: `${stream.x}%`,
            color: colorTheme[1] || colorTheme[0]
          }}
          initial={{ y: -200 }}
          animate={{ y: '120vh' }}
          transition={{
            duration: stream.duration,
            repeat: Infinity,
            delay: stream.delay,
            ease: 'linear'
          }}
        >
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} style={{ opacity: 1 - i * 0.05 }}>
              {Math.random() > 0.5 ? '1' : '0'}
            </div>
          ))}
        </motion.div>
      ))}
    </div>
  );
}

/**
 * 💎 Crystal Vault - For Keeper of Eras
 * Rotating 3D crystal structures
 */
export function CrystalVault({ colorTheme }: { colorTheme: string[] }) {
  const crystals = useMemo(() => Array.from({ length: 3 }, (_, i) => ({
    id: i,
    x: 20 + i * 30,
    y: 30 + i * 10,
    size: 60 + Math.random() * 40,
    delay: i * 2
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {crystals.map(crystal => (
        <motion.div
          key={crystal.id}
          className="absolute border border-white/30 backdrop-blur-sm"
          style={{
            left: `${crystal.x}%`,
            top: `${crystal.y}%`,
            width: crystal.size,
            height: crystal.size,
            background: `linear-gradient(135deg, ${colorTheme[0]}20, ${colorTheme[1] || colorTheme[0]}10)`,
            transformStyle: 'preserve-3d'
          }}
          animate={{
            rotateX: [0, 180, 360],
            rotateY: [0, 180, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            delay: crystal.delay,
            ease: 'linear'
          }}
        >
          {/* Internal reflection */}
          <div className="absolute inset-2 border border-white/20" />
        </motion.div>
      ))}
      {/* Light beams */}
      <motion.div
        className="absolute top-0 left-1/4 w-px h-full bg-white/20"
        animate={{ opacity: [0, 0.5, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-0 right-1/3 w-px h-full bg-white/20"
        animate={{ opacity: [0, 0.5, 0] }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
      />
    </div>
  );
}

/**
 * 🕸️ Social Network - For Social Connector
 * Connected nodes pulsing and sharing signals
 */
export function SocialNetwork({ colorTheme }: { colorTheme: string[] }) {
  const nodes = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    id: i,
    x: 20 + Math.random() * 60,
    y: 20 + Math.random() * 60
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="w-full h-full">
        {/* Connections */}
        {nodes.map((node, i) => (
          nodes.slice(i + 1).map((target, j) => (
            <motion.line
              key={`${i}-${j}`}
              x1={`${node.x}%`}
              y1={`${node.y}%`}
              x2={`${target.x}%`}
              y2={`${target.y}%`}
              stroke={colorTheme[0]}
              strokeWidth="1"
              strokeOpacity="0.3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1, opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 3, repeat: Infinity, delay: (i + j) * 0.2 }}
            />
          ))
        ))}
        {/* Nodes */}
        {nodes.map(node => (
          <g key={node.id}>
             <motion.circle
              cx={`${node.x}%`}
              cy={`${node.y}%`}
              r="4"
              fill={colorTheme[1] || colorTheme[0]}
              animate={{ r: [4, 6, 4], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, delay: node.id * 0.5 }}
            />
            {/* Ripple */}
            <motion.circle
              cx={`${node.x}%`}
              cy={`${node.y}%`}
              r="4"
              fill="none"
              stroke={colorTheme[0]}
              strokeWidth="1"
              animate={{ r: [4, 20], opacity: [0.8, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: node.id * 0.5 }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

/**
 * 🏙️ Neon City - For Futurist
 * Moving perspective grid and floating holographic elements
 */
export function NeonCity({ colorTheme }: { colorTheme: string[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
       {/* Retro Grid Floor */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-2/3 opacity-20"
        style={{
          backgroundImage: `linear-gradient(0deg, transparent 24%, ${colorTheme[0]} 25%, ${colorTheme[0]} 26%, transparent 27%, transparent 74%, ${colorTheme[0]} 75%, ${colorTheme[0]} 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, ${colorTheme[0]} 25%, ${colorTheme[0]} 26%, transparent 27%, transparent 74%, ${colorTheme[0]} 75%, ${colorTheme[0]} 76%, transparent 77%, transparent)`,
          backgroundSize: '40px 40px',
          transform: 'perspective(300px) rotateX(45deg) translateY(20px)'
        }}
        animate={{ backgroundPosition: ['0px 0px', '0px 40px'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />
      {/* Floating Holograms */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-16 h-16 border border-dashed rounded-full"
        style={{ borderColor: colorTheme[1] || colorTheme[0] }}
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute top-1/3 right-1/4 w-24 h-24 border border-dotted rounded-lg"
        style={{ borderColor: colorTheme[0] }}
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

/**
 * ☁️ Dream Mist - For Dream Weaver
 * Soft, multi-layered clouds drifting
 */
export function DreamMist({ colorTheme }: { colorTheme: string[] }) {
  const clouds = useMemo(() => Array.from({ length: 4 }, (_, i) => ({
    id: i,
    width: 200 + Math.random() * 100,
    top: Math.random() * 60,
    delay: i * 5
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {clouds.map(cloud => (
        <motion.div
          key={cloud.id}
          className="absolute h-32 rounded-full blur-3xl opacity-30"
          style={{
            left: '-20%',
            top: `${cloud.top}%`,
            width: `${cloud.width}px`,
            background: colorTheme[0]
          }}
          animate={{ x: ['0vw', '120vw'] }}
          transition={{ duration: 25 + Math.random() * 10, repeat: Infinity, delay: cloud.delay, ease: 'linear' }}
        />
      ))}
      <motion.div
         className="absolute inset-0"
         style={{ background: `radial-gradient(circle at 50% 0%, ${colorTheme[1]}40, transparent)` }}
         animate={{ opacity: [0.3, 0.6, 0.3] }}
         transition={{ duration: 5, repeat: Infinity }}
      />
    </div>
  );
}

/**
 * 🎹 Audio Visualizer - For Sonic Archivist
 * Jumping frequency bars
 */
export function AudioVisualizer({ colorTheme }: { colorTheme: string[] }) {
  const bars = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: 10 + i * 7
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-end justify-center pb-0">
      <div className="flex items-end justify-center space-x-1 h-32 w-full max-w-md opacity-40">
        {bars.map(bar => (
          <motion.div
            key={bar.id}
            className="w-4 rounded-t-md"
            style={{ background: colorTheme[0] }}
            animate={{
              height: ['10%', `${20 + Math.random() * 80}%`, '10%']
            }}
            transition={{
              duration: 0.5 + Math.random() * 0.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>
      {/* Floating Notes */}
      {Array.from({ length: 3 }).map((_, i) => (
         <motion.div
           key={`note-${i}`}
           className="absolute text-2xl"
           style={{
             left: `${20 + i * 30}%`,
             bottom: '20%',
             color: colorTheme[1] || colorTheme[0]
           }}
           animate={{ y: -100, opacity: [1, 0] }}
           transition={{ duration: 2, repeat: Infinity, delay: i * 0.7 }}
         >
           🎵
         </motion.div>
      ))}
    </div>
  );
}

/**
 * 🌾 Golden Harvest - Floating bounty for Moment Harvester
 */
export function GoldenHarvest({ colorTheme }: { colorTheme: string[] }) {
  const particles = useMemo(() => Array.from({ length: typeof window !== 'undefined' && window.innerWidth < 768 ? 4 : 8 }, (_, i) => ({
    id: i,
    left: 10 + Math.random() * 80,
    delay: i * 1.5,
    duration: 4 + Math.random() * 2
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute text-xl sm:text-2xl"
          style={{
            left: `${p.left}%`,
            bottom: '-10%'
          }}
          animate={{
            y: [0, -window.innerHeight * 0.6],
            opacity: [0, 0.8, 0],
            rotate: [-10, 10, -10]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeOut'
          }}
        >
          🌾
        </motion.div>
      ))}
      
      {/* Golden sparkles */}
      {Array.from({ length: 10 }).map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute w-1 h-1 bg-yellow-300 rounded-full box-shadow-lg shadow-yellow-500/50"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`
          }}
          animate={{
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2
          }}
        />
      ))}
    </div>
  );
}

// ============================================================
// 🎯 MAIN EFFECT ASSIGNMENT FUNCTION
// ============================================================

/**
 * Get all effects for a specific horizon based on title name and rarity
 */
export function getHorizonEffects(
  titleName: string,
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary',
  colorTheme: string[],
  context: 'active' | 'transition' = 'active'
) {
  const config = rarityConfig[rarity];
  
  // Base effects (everyone gets these)
  const effects: Record<string, React.ReactNode> = {
    starField: <StarField key="stars" rarity={rarity} colorTheme={colorTheme} context={context} />,
    shootingStars: config.shootingStars > 0 ? (
      <ShootingStars key="shooting" colorTheme={colorTheme} count={config.shootingStars} />
    ) : null,
    particles: <ThemeParticles key="particles" titleName={titleName} rarity={rarity} colorTheme={colorTheme} context={context} />,
    ambientGlow: <AmbientGlow key="glow" rarity={rarity} colorTheme={colorTheme} />
  };

  // Title-specific special effects
  switch (titleName) {
    // ====== COMMON TIER ======
    case 'Time Novice':
      effects.clockHands = <ClockHands key="clock" colorTheme={colorTheme} />;
      effects.timeRipples = <TimeRipples key="ripples" colorTheme={colorTheme} />;
      break;

    // ====== UNCOMMON TIER - WITH SPECTACULAR LANDSCAPES! ======
    case 'Future Messenger':
      effects.flyingEnvelopes = <FlyingEnvelopes key="envelopes" colorTheme={colorTheme} />;
      effects.digitalHorizon = <DigitalHorizon key="digital-horizon" colorTheme={colorTheme} />;
      effects.universalAurora = <UniversalAurora key="aurora" colorTheme={colorTheme} />;
      break;

    case 'Past Receiver':
      effects.floatingLetters = <FloatingLetters key="letters" colorTheme={colorTheme} />;
      effects.postalStamps = <PostalStamps key="stamps" colorTheme={colorTheme} />;
      effects.vintageSunset = <VintageSunset key="vintage-sunset" colorTheme={colorTheme} />;
      break;

    case 'Snapshot Keeper':
      effects.cameraFlash = <CameraFlash key="flash" colorTheme={colorTheme} />;
      effects.floatingPhotos = <FloatingPhotos key="photos" colorTheme={colorTheme} />;
      effects.apertureLandscape = <ApertureLandscape key="aperture-landscape" colorTheme={colorTheme} />;
      break;

    case 'Cinema Pioneer':
      effects.theaterCurtains = <TheaterCurtains key="curtains" colorTheme={colorTheme} />;
      effects.filmReels = <FilmReels key="reels" colorTheme={colorTheme} />;
      effects.hollywoodHills = <HollywoodHills key="hollywood-hills" colorTheme={colorTheme} />;
      break;

    case 'Voice Keeper':
      effects.soundWaves = <SoundWaveRipples key="waves" colorTheme={colorTheme} />;
      effects.musicalNotes = <MusicalNotes key="notes" colorTheme={colorTheme} />;
      effects.audioWaveTerrain = <AudioWaveTerrain key="audio-terrain" colorTheme={colorTheme} />;
      break;

    case 'Habit Builder':
      effects.flameBursts = <FlameBursts key="flames" colorTheme={colorTheme} />;
      effects.emberParticles = <EmberParticles key="embers" colorTheme={colorTheme} />;
      effects.volcanicTerrain = <VolcanicTerrain key="volcanic-terrain" colorTheme={colorTheme} />;
      break;

    case 'Moment Collector':
      effects.cameraFlash = <CameraFlash key="flash" colorTheme={colorTheme} />;
      effects.floatingPhotos = <FloatingPhotos key="photos" colorTheme={colorTheme} />;
      effects.polaroidFrameLandscape = <PolaroidFrameLandscape key="polaroid-landscape" colorTheme={colorTheme} />;
      break;

    // ====== RARE TIER ======
    case 'Era Enthusiast':
      effects.chronoCompass = <ChronoCompass key="compass" colorTheme={colorTheme} />;
      effects.constellationFormation = <ConstellationFormation key="constellations" colorTheme={colorTheme} />;
      effects.universalAurora = <UniversalAurora key="aurora" colorTheme={colorTheme} />;
      break;

    case 'Story Curator':
      effects.museumPedestals = <MuseumPedestals key="pedestals" colorTheme={colorTheme} />;
      effects.theaterCurtains = <TheaterCurtains key="curtains" colorTheme={colorTheme} />;
      effects.filmReels = <FilmReels key="reels" colorTheme={colorTheme} />;
      break;

    case 'Chronicler':
      effects.inkSpills = <InkSpills key="ink" colorTheme={colorTheme} />;
      effects.pageTurning = <PageTurning key="pages" colorTheme={colorTheme} />;
      effects.quillFeathers = <QuillFeathers key="feathers" colorTheme={colorTheme} />;
      break;

    case 'Moment Harvester':
      effects.goldenHarvest = <GoldenHarvest key="harvest" colorTheme={colorTheme} />;
      effects.universalAurora = <UniversalAurora key="aurora" colorTheme={colorTheme} />;
      break;

    case 'Eternal Witness':
      effects.timeGears = <TimeGears key="gears" colorTheme={colorTheme} />;
      effects.clockHands = <ClockHands key="clock" colorTheme={colorTheme} />;
      effects.universalAurora = <UniversalAurora key="aurora" colorTheme={colorTheme} />;
      break;

    case 'Master Archivist':
      effects.digitalStream = <DigitalStream key="stream" colorTheme={colorTheme} />;
      effects.hologram = <NeonCity key="hologram" colorTheme={colorTheme} />;
      break;

    case 'Keeper of Eras':
      effects.crystalVault = <CrystalVault key="vault" colorTheme={colorTheme} />;
      effects.universalAurora = <UniversalAurora key="aurora" colorTheme={colorTheme} />;
      break;

    case 'Social Connector':
      effects.socialNetwork = <SocialNetwork key="network" colorTheme={colorTheme} />;
      effects.connectionLines = <ConnectionLines key="lines" colorTheme={colorTheme} />;
      break;

    // ====== UNCOMMON TIER - SPECTACULAR LANDSCAPES! ======
    case 'Nostalgia Weaver':
      effects.nebulaClouds = <NebulaClouds key="nebula" colorTheme={colorTheme} />;
      effects.floatingPhotos = <FloatingPhotos key="photos" colorTheme={colorTheme} />;
      effects.nostalgiaWeaverLandscape = <NostalgiaWeaverLandscape key="nostalgia-landscape" colorTheme={colorTheme} />;
      break;

    case 'The Appreciator':
      effects.appreciatorLandscape = <AppreciatorLandscape key="appreciator-landscape" colorTheme={colorTheme} />;
      break;

    case 'Archivist':
      effects.archivistLandscape = <ArchivistLandscape key="archivist-landscape" colorTheme={colorTheme} />;
      break;

    case 'Chronicle Weaver':
      effects.chronicleWeaverLandscape = <ChronicleWeaverLandscape key="chronicle-weaver-landscape" colorTheme={colorTheme} />;
      break;

    case 'Chronicler':
      effects.inkSpills = <InkSpills key="ink" colorTheme={colorTheme} />;
      effects.pageTurning = <PageTurning key="pages" colorTheme={colorTheme} />;
      effects.quillFeathers = <QuillFeathers key="feathers" colorTheme={colorTheme} />;
      effects.chroniclerLandscape = <ChroniquerLandscape key="chronicler-landscape" colorTheme={colorTheme} />;
      break;

    case 'Circle Builder':
      effects.circleBuilderLandscape = <CircleBuilderLandscape key="circle-builder-landscape" colorTheme={colorTheme} />;
      break;

    case 'Circle Keeper':
      effects.circleKeeperLandscape = <CircleKeeperLandscape key="circle-keeper-landscape" colorTheme={colorTheme} />;
      break;

    case 'Dream Weaver':
      effects.dreamMist = <DreamMist key="mist" colorTheme={colorTheme} />;
      effects.starField = <StarField key="stars" rarity={rarity} colorTheme={colorTheme} context={context} />;
      effects.dreamWeaverLandscape = <DreamWeaverLandscape key="dream-weaver-landscape" colorTheme={colorTheme} />;
      break;

    case 'Futurist':
      effects.neonCity = <NeonCity key="neon" colorTheme={colorTheme} />;
      effects.shootingStars = <ShootingStars key="shooting" colorTheme={colorTheme} count={5} />;
      effects.futuristLandscape = <FuturistLandscape key="futurist-landscape" colorTheme={colorTheme} />;
      break;

    case 'Media Master':
      effects.mediaMasterLandscape = <MediaMasterLandscape key="media-master-landscape" colorTheme={colorTheme} />;
      break;

    case 'Parallel Keeper':
      effects.parallelKeeperLandscape = <ParallelKeeperLandscape key="parallel-keeper-landscape" colorTheme={colorTheme} />;
      break;

    case 'Sonic Archivist':
      effects.audioVisualizer = <AudioVisualizer key="audio" colorTheme={colorTheme} />;
      effects.soundWaveRipples = <SoundWaveRipples key="ripples" colorTheme={colorTheme} />;
      effects.sonicArchivistLandscape = <SonicArchivistLandscape key="sonic-archivist-landscape" colorTheme={colorTheme} />;
      break;

    // ====== EPIC TIER ======

    case 'Legacy Forger':
      effects.anvilStrike = <AnvilStrike key="anvil" colorTheme={colorTheme} />;
      effects.emberParticles = <EmberParticles key="embers" colorTheme={colorTheme} />;
      break;

    case 'Audio Alchemist':
      effects.soundWaves = <SoundWaveRipples key="waves" colorTheme={colorTheme} />;
      effects.musicalNotes = <MusicalNotes key="notes" colorTheme={colorTheme} />;
      effects.colorBurst = <ColorBurst key="burst" colorTheme={colorTheme} />;
      break;

    case 'Echo Magnet':
      effects.timeRipples = <TimeRipples key="ripples" colorTheme={colorTheme} />;
      effects.universalAurora = <UniversalAurora key="aurora" colorTheme={colorTheme} />;
      break;

    // ====== LEGENDARY TIER ======
    case 'Memory Architect':
      effects.blackHole = <BlackHole key="blackhole" colorTheme={colorTheme} />;
      effects.galaxySpiral = <GalaxySpiral key="galaxy" colorTheme={colorTheme} />;
      break;

    case 'Midnight Chronicler':
      effects.constellationLines = <ConstellationLines key="constellations" colorTheme={colorTheme} />;
      effects.moonPhases = <MoonPhases key="moon" colorTheme={colorTheme} />;
      break;

    case 'Temporal Sovereign':
      effects.orbitalRings = <OrbitalRings key="rings" colorTheme={colorTheme} />;
      effects.rocketTrails = <RocketTrails key="trails" colorTheme={colorTheme} />;
      effects.legendaryAurora = <LegendaryAurora key="aurora" colorTheme={colorTheme} />;
      break;

    case 'Grand Historian':
      effects.medalShine = <MedalShine key="medal" colorTheme={colorTheme} />;
      effects.shieldPulses = <ShieldPulses key="shield" colorTheme={colorTheme} />;
      break;

    case 'Legend':
      effects.filmStripScroll = <FilmStripScroll key="strips" colorTheme={colorTheme} />;
      effects.spotlightSweep = <SpotlightSweep key="spotlight" colorTheme={colorTheme} />;
      break;

    case 'Time Lord':
      effects.heartParticles = <HeartParticles key="hearts" colorTheme={colorTheme} />;
      effects.connectionLines = <ConnectionLines key="connections" colorTheme={colorTheme} />;
      break;
  }

  return effects;
}
