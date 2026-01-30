import React from 'react';
import { motion } from 'motion/react';

// ============================================================================
// COSMIC EVENTS SYSTEM - Random rare celestial phenomena across all horizons
// ============================================================================

export type CosmicEventType = 
  | 'shooting-comet'
  | 'meteor-shower'
  | 'satellite-pass'
  | 'star-birth'
  | 'asteroid-tumble'
  | 'supernova-burst'
  | 'nebula-bloom'
  | 'planet-transit'
  | 'black-hole'
  | 'cosmic-vortex'
  | 'space-lightning'
  | 'ufo-streak'
  | 'cosmic-ray-burst'
  | 'wormhole'
  | 'crystal-formation'
  | 'stardust-explosion'
  | 'spacex-starship'
  | 'space-station';

export type CosmicEventRarity = 'common' | 'uncommon' | 'rare' | 'very-rare';

interface CosmicEventDefinition {
  type: CosmicEventType;
  rarity: CosmicEventRarity;
  duration: number; // in seconds
  probability: number; // weight for random selection
  name: string;
}

// ============================================================================
// EVENT DEFINITIONS with Rarity System
// ============================================================================

export const COSMIC_EVENTS: CosmicEventDefinition[] = [
  // COMMON (40% total probability)
  { type: 'shooting-comet', rarity: 'common', duration: 1.5, probability: 25, name: 'Shooting Comet' },
  { type: 'meteor-shower', rarity: 'common', duration: 3, probability: 15, name: 'Meteor Shower' },
  
  // UNCOMMON (30% total probability)
  { type: 'satellite-pass', rarity: 'uncommon', duration: 5, probability: 12, name: 'Satellite Pass' },
  { type: 'star-birth', rarity: 'uncommon', duration: 4, probability: 10, name: 'Star Birth' },
  { type: 'asteroid-tumble', rarity: 'uncommon', duration: 4, probability: 8, name: 'Asteroid Tumble' },
  
  // RARE (20% total probability)
  { type: 'supernova-burst', rarity: 'rare', duration: 3, probability: 8, name: 'Supernova Burst' },
  { type: 'nebula-bloom', rarity: 'rare', duration: 6, probability: 7, name: 'Nebula Bloom' },
  { type: 'planet-transit', rarity: 'rare', duration: 8, probability: 5, name: 'Planet Transit' },
  
  // VERY RARE (10% total probability)
  { type: 'black-hole', rarity: 'very-rare', duration: 8, probability: 4, name: 'Black Hole Formation' },
  { type: 'cosmic-vortex', rarity: 'very-rare', duration: 6, probability: 3, name: 'Cosmic Vortex' },
  { type: 'space-lightning', rarity: 'very-rare', duration: 2, probability: 2, name: 'Space Lightning' },
  { type: 'ufo-streak', rarity: 'very-rare', duration: 3, probability: 1, name: 'UFO Streak' },
  { type: 'cosmic-ray-burst', rarity: 'very-rare', duration: 4, probability: 1, name: 'Cosmic Ray Burst' },
  { type: 'wormhole', rarity: 'very-rare', duration: 5, probability: 1, name: 'Wormhole' },
  { type: 'crystal-formation', rarity: 'very-rare', duration: 3, probability: 1, name: 'Crystal Formation' },
  { type: 'stardust-explosion', rarity: 'very-rare', duration: 2, probability: 1, name: 'Stardust Explosion' },
  { type: 'spacex-starship', rarity: 'very-rare', duration: 2, probability: 1, name: 'SpaceX Starship' },
  { type: 'space-station', rarity: 'very-rare', duration: 2, probability: 1, name: 'Space Station' },
];

// ============================================================================
// RANDOM EVENT SELECTOR with Weighted Probability
// ============================================================================

export function getRandomCosmicEvent(): CosmicEventDefinition {
  const totalProbability = COSMIC_EVENTS.reduce((sum, event) => sum + event.probability, 0);
  let random = Math.random() * totalProbability;
  
  for (const event of COSMIC_EVENTS) {
    random -= event.probability;
    if (random <= 0) {
      return event;
    }
  }
  
  // Fallback (should never happen)
  return COSMIC_EVENTS[0];
}

// ============================================================================
// EVENT RENDERERS - Each cosmic event's visual implementation
// ============================================================================

interface EventProps {
  themeColors: string[]; // Adapt to current horizon's theme
}

// 💫 SHOOTING COMET - AUTHENTIC blazing trail with proper physics and glow
export function ShootingComet({ themeColors }: EventProps) {
  // Random entry point and direction for variety
  const entryPoints = [
    { startX: -5, startY: 10, endX: 70, endY: 80 },  // Top-left to bottom-right
    { startX: 105, startY: 15, endX: 30, endY: 75 }, // Top-right to bottom-left
    { startX: 20, startY: -5, endX: 80, endY: 70 },  // Top to bottom-right
  ];
  
  const entry = entryPoints[Math.floor(Math.random() * entryPoints.length)];
  const color = themeColors[0] || '#60a5fa';
  const coreColor = '#ffffff';
  
  // Calculate trajectory distance for proper speed
  const deltaX = entry.endX - entry.startX;
  const deltaY = entry.endY - entry.startY;
  
  return (
    <>
      {/* Main comet body with intense glow */}
      <motion.div
        className="absolute"
        style={{
          left: `${entry.startX}%`,
          top: `${entry.startY}%`,
        }}
        initial={{ opacity: 0 }}
        animate={{ 
          x: `${deltaX}vw`,
          y: `${deltaY}vh`,
          opacity: [0, 1, 1, 0],
        }}
        transition={{ 
          duration: 1.5, 
          ease: [0.22, 1, 0.36, 1],
          times: [0, 0.1, 0.7, 1]
        }}
      >
        {/* Bright white core */}
        <div
          className="absolute w-3 h-3 rounded-full"
          style={{
            background: `radial-gradient(circle, ${coreColor} 0%, ${color} 60%, transparent 100%)`,
            boxShadow: `0 0 20px ${coreColor}, 0 0 40px ${color}, 0 0 60px ${color}`,
          }}
        />
        
        {/* Multi-layered tail with gradient fade */}
        <motion.div
          className="absolute w-64 h-2 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${coreColor} 0%, ${color} 20%, ${color}aa 50%, ${color}44 80%, transparent 100%)`,
            boxShadow: `0 0 15px ${color}aa`,
            left: -256,
            top: 0,
            filter: 'blur(1px)',
          }}
          initial={{ scaleX: 0.3 }}
          animate={{ scaleX: [0.3, 1, 1, 0.5] }}
          transition={{ duration: 1.5, times: [0, 0.2, 0.7, 1] }}
        />
        
        {/* Secondary wider tail glow */}
        <motion.div
          className="absolute w-48 h-4 rounded-full blur-md"
          style={{
            background: `linear-gradient(90deg, ${color}66 0%, ${color}33 50%, transparent 100%)`,
            left: -192,
            top: -1,
          }}
          animate={{ opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 0.5, repeat: 2 }}
        />
        
        {/* Particle debris trail */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              background: i % 3 === 0 ? coreColor : color,
              boxShadow: `0 0 8px ${color}`,
              left: -i * 18,
              top: (Math.random() - 0.5) * 6,
            }}
            initial={{ opacity: 1, scale: 1 }}
            animate={{ 
              opacity: 0, 
              scale: 0.2,
              y: (Math.random() - 0.5) * 20,
            }}
            transition={{ 
              duration: 1.2, 
              delay: i * 0.08,
              ease: "easeOut"
            }}
          />
        ))}
        
        {/* Atmospheric ionization glow */}
        <motion.div
          className="absolute w-12 h-12 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2"
          style={{
            background: `radial-gradient(circle, ${color}88 0%, transparent 70%)`,
            left: 0,
            top: 0,
          }}
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{ duration: 0.6, repeat: 1 }}
        />
      </motion.div>
    </>
  );
}

// 🌠 HALLEY'S COMET - LEGENDARY massive blazing comet with iridescent rainbow trail
export function HalleysComet({ themeColors }: EventProps) {
  // Diagonal paths for dramatic crossing
  const paths = [
    { startX: -10, startY: 15, endX: 110, endY: 85, angle: 45 },   // Top-left to bottom-right
    { startX: 110, startY: 20, endX: -10, endY: 90, angle: -45 },  // Top-right to bottom-left
    { startX: 15, startY: -10, endX: 85, endY: 110, angle: 60 },   // Top to bottom steep
  ];
  
  const path = paths[Math.floor(Math.random() * paths.length)];
  const deltaX = path.endX - path.startX;
  const deltaY = path.endY - path.startY;
  
  // Iridescent rainbow colors
  const iridescent = [
    '#ff0080', // Hot pink
    '#ff4d00', // Orange-red
    '#ffd700', // Gold
    '#00ff88', // Cyan-green
    '#00d4ff', // Bright cyan
    '#8800ff', // Purple
    '#ff00ff', // Magenta
  ];
  
  return (
    <>
      {/* MASSIVE COMET CORE with intense white-hot center */}
      <motion.div
        className="absolute"
        style={{
          left: `${path.startX}%`,
          top: `${path.startY}%`,
          zIndex: 100,
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ 
          x: `${deltaX}vw`,
          y: `${deltaY}vh`,
          opacity: [0, 1, 1, 1, 0],
          scale: [0.5, 1.2, 1, 1, 0.8],
        }}
        transition={{ 
          duration: 6, 
          ease: [0.25, 0.1, 0.25, 1],
          times: [0, 0.1, 0.3, 0.8, 1]
        }}
      >
        {/* Ultra-bright white core */}
        <div
          className="absolute w-8 h-8 rounded-full"
          style={{
            background: `radial-gradient(circle, #ffffff 0%, #fffacd 30%, ${iridescent[2]} 60%, transparent 100%)`,
            boxShadow: `
              0 0 40px #ffffff,
              0 0 80px ${iridescent[2]},
              0 0 120px ${iridescent[0]},
              0 0 160px ${iridescent[5]}
            `,
          }}
        />
        
        {/* Pulsing nuclear core */}
        <motion.div
          className="absolute w-6 h-6 rounded-full top-1 left-1"
          style={{
            background: `radial-gradient(circle, #ffffff 0%, ${iridescent[2]} 100%)`,
          }}
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [1, 0.7, 1],
          }}
          transition={{ duration: 0.4, repeat: Infinity }}
        />
        
        {/* MASSIVE IRIDESCENT TAIL - Rainbow gradient */}
        <motion.div
          className="absolute w-[600px] h-6 rounded-full"
          style={{
            background: `linear-gradient(90deg, 
              #ffffff 0%,
              ${iridescent[0]} 10%,
              ${iridescent[1]} 20%,
              ${iridescent[2]} 30%,
              ${iridescent[3]} 40%,
              ${iridescent[4]} 50%,
              ${iridescent[5]} 60%,
              ${iridescent[6]} 70%,
              ${iridescent[0]}66 80%,
              transparent 100%
            )`,
            boxShadow: `0 0 30px ${iridescent[4]}aa`,
            left: -600,
            top: 1,
            filter: 'blur(2px)',
            transform: `rotate(${path.angle}deg)`,
          }}
          initial={{ scaleX: 0.2, opacity: 0 }}
          animate={{ 
            scaleX: [0.2, 1.2, 1, 0.8],
            opacity: [0, 1, 1, 0.7],
          }}
          transition={{ duration: 6, times: [0, 0.2, 0.7, 1] }}
        />
        
        {/* Secondary shimmering tail layer */}
        <motion.div
          className="absolute w-[500px] h-8 rounded-full blur-lg"
          style={{
            background: `linear-gradient(90deg, 
              ${iridescent[6]}99 0%,
              ${iridescent[4]}88 25%,
              ${iridescent[2]}77 50%,
              ${iridescent[0]}55 75%,
              transparent 100%
            )`,
            left: -500,
            top: -1,
            transform: `rotate(${path.angle}deg)`,
          }}
          animate={{ 
            opacity: [0.5, 1, 0.7],
            scaleY: [1, 1.2, 1],
          }}
          transition={{ duration: 1, repeat: 5 }}
        />
        
        {/* SMOLDERING PARTICLE TRAIL */}
        {[...Array(30)].map((_, i) => {
          const colorIndex = i % iridescent.length;
          return (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: iridescent[colorIndex],
                boxShadow: `0 0 15px ${iridescent[colorIndex]}`,
                left: -i * 25,
                top: (Math.random() - 0.5) * 12,
              }}
              initial={{ opacity: 1, scale: 1.2 }}
              animate={{ 
                opacity: 0, 
                scale: 0,
                x: (Math.random() - 0.5) * 40,
                y: (Math.random() - 0.5) * 40,
              }}
              transition={{ 
                duration: 2 + Math.random() * 2, 
                delay: i * 0.05,
                ease: "easeOut"
              }}
            />
          );
        })}
        
        {/* Ionization wave glow */}
        <motion.div
          className="absolute w-32 h-32 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
          style={{
            background: `radial-gradient(circle, ${iridescent[4]}66 0%, ${iridescent[5]}44 50%, transparent 100%)`,
            left: 0,
            top: 0,
          }}
          animate={{ 
            scale: [1, 2, 1.5],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{ duration: 1.2, repeat: 4 }}
        />
        
        {/* Trailing dust cloud */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`dust-${i}`}
            className="absolute rounded-full blur-xl"
            style={{
              width: `${40 + i * 10}px`,
              height: `${20 + i * 5}px`,
              background: `radial-gradient(ellipse, ${iridescent[i % iridescent.length]}33 0%, transparent 70%)`,
              left: -80 - i * 60,
              top: -10 - i * 2,
            }}
            initial={{ opacity: 0.8, scale: 0.8 }}
            animate={{ 
              opacity: 0,
              scale: 1.5,
            }}
            transition={{ 
              duration: 3,
              delay: i * 0.3,
              ease: "easeOut"
            }}
          />
        ))}
      </motion.div>
      
      {/* ATMOSPHERIC SHOCKWAVE - Expanding ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          left: `${path.startX + 20}%`,
          top: `${path.startY + 20}%`,
          width: '100px',
          height: '100px',
          border: `3px solid ${iridescent[4]}66`,
          boxShadow: `0 0 30px ${iridescent[4]}`,
        }}
        initial={{ scale: 0, opacity: 1 }}
        animate={{ 
          scale: 8,
          opacity: 0,
        }}
        transition={{ duration: 3, ease: "easeOut" }}
      />
    </>
  );
}

// ✨ STAR BIRTH - Particles converging to form new star
export function StarBirth({ themeColors }: EventProps) {
  const centerX = 30 + Math.random() * 40;
  const centerY = 30 + Math.random() * 30;
  const color = themeColors[0] || '#fbbf24';
  
  return (
    <motion.div
      className="absolute"
      style={{ left: `${centerX}%`, top: `${centerY}%` }}
    >
      {/* Converging particles */}
      {[...Array(16)].map((_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const distance = 100;
        
        return (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              background: color,
              boxShadow: `0 0 8px ${color}`,
            }}
            initial={{ 
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              opacity: 0,
            }}
            animate={{ 
              x: 0,
              y: 0,
              opacity: [0, 1, 1, 0],
            }}
            transition={{ duration: 4, ease: "easeInOut" }}
          />
        );
      })}
      
      {/* New star glow */}
      <motion.div
        className="absolute w-6 h-6 rounded-full -translate-x-1/2 -translate-y-1/2"
        style={{
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: [0, 1.5, 1],
          opacity: [0, 1, 0.8, 0],
        }}
        transition={{ duration: 4, delay: 2 }}
      />
    </motion.div>
  );
}

// 🪨 ASTEROID FIELD - Realistic asteroids tumbling through space with depth
export function AsteroidTumble({ themeColors }: EventProps) {
  const asteroidCount = 3 + Math.floor(Math.random() * 3); // 3-5 asteroids
  
  return (
    <>
      {[...Array(asteroidCount)].map((_, i) => {
        const startY = 15 + Math.random() * 50;
        const size = 12 + Math.random() * 16; // Larger, more varied sizes
        const speed = 5 + Math.random() * 3;
        const rotationSpeed = 360 + Math.random() * 720;
        
        // Realistic asteroid colors - grays and browns
        const asteroidColors = [
          { surface: '#78716c', crater: '#57534e', shadow: '#44403c' },
          { surface: '#a8a29e', crater: '#78716c', shadow: '#57534e' },
          { surface: '#92827a', crater: '#6b5e54', shadow: '#57534e' },
        ];
        const colorSet = asteroidColors[i % asteroidColors.length];
        
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: '-15%',
              top: `${startY}%`,
              filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.4))',
            }}
            initial={{ x: 0, rotate: 0 }}
            animate={{ 
              x: window.innerWidth + 150,
              rotate: rotationSpeed,
            }}
            transition={{ 
              duration: speed, 
              delay: i * 0.8,
              ease: "linear"
            }}
          >
            {/* Asteroid body with realistic shading */}
            <div
              className="relative rounded-full"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                background: `radial-gradient(circle at 35% 35%, ${colorSet.surface} 0%, ${colorSet.shadow} 100%)`,
                boxShadow: `inset -3px -3px 6px ${colorSet.shadow}`,
              }}
            >
              {/* Surface craters - irregular placement */}
              <div 
                className="absolute rounded-full"
                style={{
                  width: `${size * 0.35}px`,
                  height: `${size * 0.35}px`,
                  background: `radial-gradient(circle, ${colorSet.crater} 0%, transparent 80%)`,
                  top: '15%',
                  left: '60%',
                  opacity: 0.6,
                }}
              />
              <div 
                className="absolute rounded-full"
                style={{
                  width: `${size * 0.25}px`,
                  height: `${size * 0.25}px`,
                  background: `radial-gradient(circle, ${colorSet.crater} 0%, transparent 80%)`,
                  top: '55%',
                  left: '20%',
                  opacity: 0.5,
                }}
              />
              <div 
                className="absolute rounded-full"
                style={{
                  width: `${size * 0.2}px`,
                  height: `${size * 0.2}px`,
                  background: `radial-gradient(circle, ${colorSet.crater} 0%, transparent 80%)`,
                  top: '70%',
                  left: '65%',
                  opacity: 0.4,
                }}
              />
              
              {/* Subtle highlight for 3D effect */}
              <div
                className="absolute rounded-full"
                style={{
                  width: `${size * 0.4}px`,
                  height: `${size * 0.4}px`,
                  background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
                  top: '20%',
                  left: '25%',
                }}
              />
            </div>
            
            {/* Dust trail */}
            <motion.div
              className="absolute blur-sm"
              style={{
                width: `${size * 2}px`,
                height: `${size * 0.5}px`,
                background: `linear-gradient(90deg, ${colorSet.shadow}40 0%, transparent 100%)`,
                right: size,
                top: size * 0.25,
              }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>
        );
      })}
    </>
  );
}

// ☄️ METEOR SHOWER - Brief intense shower (7-10 meteors)
export function MeteorShower({ themeColors }: EventProps) {
  const meteorCount = 7 + Math.floor(Math.random() * 4);
  const color = themeColors[1] || '#fb923c';
  
  return (
    <>
      {[...Array(meteorCount)].map((_, i) => {
        const startX = 20 + Math.random() * 60;
        const startY = Math.random() * 30;
        const delay = Math.random() * 2;
        
        return (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              left: `${startX}%`,
              top: `${startY}%`,
              background: color,
              boxShadow: `0 0 10px ${color}`,
            }}
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{ 
              x: 150 + Math.random() * 100, 
              y: 100 + Math.random() * 50, 
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 1 + Math.random() * 0.5, delay, ease: "easeIn" }}
          >
            <motion.div
              className="absolute w-16 h-px rounded-full"
              style={{
                background: `linear-gradient(90deg, ${color} 0%, transparent 100%)`,
                left: -64,
                top: 0,
              }}
            />
          </motion.div>
        );
      })}
    </>
  );
}

// 🪐 PLANET TRANSIT - Small planet slowly crosses horizon
export function PlanetTransit({ themeColors }: EventProps) {
  const startY = 25 + Math.random() * 40;
  const planetSize = 30 + Math.random() * 20;
  const color = themeColors[1] || '#f97316';
  
  return (
    <motion.div
      className="absolute"
      style={{
        top: `${startY}%`,
      }}
      initial={{ left: '-10%' }}
      animate={{ left: '110%' }}
      transition={{ duration: 8, ease: "linear" }}
    >
      {/* Planet body */}
      <div
        className="relative rounded-full"
        style={{
          width: `${planetSize}px`,
          height: `${planetSize}px`,
          background: `radial-gradient(circle at 35% 35%, ${color} 0%, #7c2d12 100%)`,
          boxShadow: 'inset -4px -4px 12px rgba(0,0,0,0.6)',
        }}
      >
        {/* Surface details */}
        <div 
          className="absolute w-1/2 h-1/3 rounded-full opacity-30"
          style={{ 
            background: '#451a03',
            top: '30%',
            left: '20%',
          }}
        />
        
        {/* Rings (if large enough) */}
        {planetSize > 35 && (
          <div
            className="absolute border-2 rounded-full opacity-60"
            style={{
              width: `${planetSize * 1.8}px`,
              height: `${planetSize * 0.5}px`,
              borderColor: `${color}80`,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%) rotateX(75deg)',
            }}
          />
        )}
      </div>
      
      {/* Atmospheric glow */}
      <motion.div
        className="absolute rounded-full blur-xl -translate-x-1/2 -translate-y-1/2"
        style={{
          width: `${planetSize * 1.4}px`,
          height: `${planetSize * 1.4}px`,
          background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
          top: '50%',
          left: '50%',
        }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </motion.div>
  );
}

// 🌑 BLACK HOLE - Forms, pulls particles, then disappears
export function BlackHole({ themeColors }: EventProps) {
  const centerX = 35 + Math.random() * 30;
  const centerY = 30 + Math.random() * 30;
  const accentColor = themeColors[0] || '#8b5cf6';
  
  return (
    <motion.div
      className="absolute"
      style={{ left: `${centerX}%`, top: `${centerY}%` }}
    >
      {/* Event horizon */}
      <motion.div
        className="absolute rounded-full -translate-x-1/2 -translate-y-1/2"
        style={{
          background: `radial-gradient(circle, #000000 0%, #1a0033 30%, transparent 60%)`,
          border: `2px solid ${accentColor}`,
        }}
        initial={{ width: 0, height: 0, opacity: 0 }}
        animate={{ 
          width: [0, 80, 80, 0],
          height: [0, 80, 80, 0],
          opacity: [0, 1, 1, 0],
        }}
        transition={{ duration: 8, times: [0, 0.2, 0.8, 1] }}
      />
      
      {/* Accretion disk */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border -translate-x-1/2 -translate-y-1/2"
          style={{
            borderColor: accentColor,
            borderWidth: '2px',
          }}
          initial={{ width: 100 + i * 40, height: 20 + i * 10, opacity: 0 }}
          animate={{ 
            width: 100 + i * 40,
            height: 20 + i * 10,
            opacity: [0, 0.8, 0.8, 0],
            rotate: [0, 360],
          }}
          transition={{ 
            duration: 8,
            times: [0, 0.2, 0.8, 1],
            rotate: { duration: 4 + i, repeat: 1, ease: "linear" }
          }}
        />
      ))}
      
      {/* Particles being pulled in */}
      {[...Array(24)].map((_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        const distance = 120;
        
        return (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              background: accentColor,
              boxShadow: `0 0 6px ${accentColor}`,
            }}
            initial={{ 
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              opacity: 0,
            }}
            animate={{ 
              x: 0,
              y: 0,
              opacity: [0, 1, 1, 0],
              scale: [1, 1, 0],
            }}
            transition={{ 
              duration: 6,
              delay: 1 + (i / 24) * 2,
              ease: "easeIn"
            }}
          />
        );
      })}
      
      {/* Gravitational lensing effect */}
      <motion.div
        className="absolute w-48 h-48 rounded-full border-4 border-white/20 -translate-x-1/2 -translate-y-1/2 blur-sm"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: [0, 1.2, 0],
          opacity: [0, 0.4, 0],
        }}
        transition={{ duration: 8 }}
      />
    </motion.div>
  );
}

// 🌪️ COSMIC VORTEX - Swirling portal that opens and closes
export function CosmicVortex({ themeColors }: EventProps) {
  const centerX = 30 + Math.random() * 40;
  const centerY = 30 + Math.random() * 30;
  const color1 = themeColors[0] || '#a855f7';
  const color2 = themeColors[1] || '#3b82f6';
  
  return (
    <motion.div
      className="absolute"
      style={{ left: `${centerX}%`, top: `${centerY}%` }}
    >
      {/* Vortex spirals */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2 -translate-x-1/2 -translate-y-1/2"
          style={{
            borderColor: i % 2 === 0 ? color1 : color2,
            width: 40 + i * 20,
            height: 40 + i * 20,
          }}
          initial={{ opacity: 0, scale: 0, rotate: 0 }}
          animate={{ 
            opacity: [0, 0.8, 0.8, 0],
            scale: [0, 1, 1, 0],
            rotate: [0, 720],
          }}
          transition={{ 
            duration: 6,
            delay: i * 0.2,
            ease: "easeInOut"
          }}
        />
      ))}
      
      {/* Portal energy */}
      <motion.div
        className="absolute w-32 h-32 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"
        style={{
          background: `radial-gradient(circle, ${color1} 0%, ${color2} 50%, transparent 70%)`,
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: [0, 0.8, 0],
          scale: [0, 1.5, 0],
        }}
        transition={{ duration: 6 }}
      />
      
      {/* Swirling particles */}
      {[...Array(16)].map((_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const radius = 60;
        
        return (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: i % 2 === 0 ? color1 : color2,
              boxShadow: `0 0 8px ${i % 2 === 0 ? color1 : color2}`,
            }}
            initial={{ 
              x: Math.cos(angle) * radius,
              y: Math.sin(angle) * radius,
              opacity: 0,
            }}
            animate={{ 
              x: [
                Math.cos(angle) * radius,
                Math.cos(angle + Math.PI * 4) * 10,
                0
              ],
              y: [
                Math.sin(angle) * radius,
                Math.sin(angle + Math.PI * 4) * 10,
                0
              ],
              opacity: [0, 1, 0],
            }}
            transition={{ 
              duration: 6,
              delay: i * 0.1,
              ease: "easeInOut"
            }}
          />
        );
      })}
    </motion.div>
  );
}

// ⚡ SPACE LIGHTNING - DRAMATIC diagonal purple/blue lightning bolts across sky
export function SpaceLightning({ themeColors }: EventProps) {
  // Generate dramatic diagonal paths
  const paths = [
    { startX: 10, startY: 0, midX: 40, midY: 50, endX: 70, endY: 100 },  // Top-left to bottom-right
    { startX: 85, startY: 10, midX: 55, midY: 55, endX: 25, endY: 95 },  // Top-right to bottom-left
    { startX: 50, startY: 5, midX: 30, midY: 60, endX: 10, endY: 100 },  // Top-center diagonal
  ];
  
  const path = paths[Math.floor(Math.random() * paths.length)];
  const color = themeColors[0] || '#8b5cf6';
  const lightningColor = '#a5b4fc';
  
  // Create jagged lightning path with more dramatic angles
  const generateLightningPath = () => {
    const segments: string[] = [];
    segments.push(`M ${path.startX},${path.startY}`);
    
    // Main zigzag from start to mid
    const midSteps = 5;
    for (let i = 1; i <= midSteps; i++) {
      const progress = i / midSteps;
      const x = path.startX + (path.midX - path.startX) * progress + (Math.random() - 0.5) * 15;
      const y = path.startY + (path.midY - path.startY) * progress;
      const deviation = i % 2 === 0 ? 8 : -8;
      segments.push(`L ${x + deviation},${y}`);
    }
    
    // Mid to end with more aggressive zigzag
    const endSteps = 6;
    for (let i = 1; i <= endSteps; i++) {
      const progress = i / endSteps;
      const x = path.midX + (path.endX - path.midX) * progress + (Math.random() - 0.5) * 20;
      const y = path.midY + (path.endY - path.midY) * progress;
      const deviation = i % 2 === 0 ? 12 : -12;
      segments.push(`L ${x + deviation},${y}`);
    }
    
    return segments.join(' ');
  };
  
  const mainBoltPath = generateLightningPath();
  
  return (
    <motion.div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
      {/* Main lightning bolt - DRAMATIC */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Outer glow bolt */}
        <motion.path
          d={mainBoltPath}
          stroke={color}
          strokeWidth="1.5"
          fill="none"
          filter="url(#lightning-glow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1, 1, 0],
            opacity: [0, 1, 1, 0],
          }}
          transition={{ duration: 0.4, times: [0, 0.15, 0.6, 1], ease: "easeInOut" }}
        />
        
        {/* Core bright bolt */}
        <motion.path
          d={mainBoltPath}
          stroke="#ffffff"
          strokeWidth="0.8"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1, 1, 0],
            opacity: [0, 1, 1, 0],
          }}
          transition={{ duration: 0.4, times: [0, 0.15, 0.6, 1], ease: "easeInOut" }}
        />
        
        {/* Secondary branch bolts */}
        {[...Array(3)].map((_, i) => {
          const branchStart = 30 + i * 20;
          const branchPath = `M ${branchStart + (Math.random() - 0.5) * 10},${20 + i * 20} L ${branchStart + 15},${35 + i * 20} L ${branchStart + 10},${45 + i * 20}`;
          
          return (
            <motion.path
              key={i}
              d={branchPath}
              stroke={lightningColor}
              strokeWidth="0.5"
              fill="none"
              filter="url(#lightning-glow)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: [0, 1, 0],
                opacity: [0, 0.8, 0],
              }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.05, times: [0, 0.5, 1] }}
            />
          );
        })}
        
        <defs>
          <filter id="lightning-glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      </svg>
      
      {/* SCREEN FLASH - Multiple intense flashes */}
      <motion.div
        className="absolute inset-0"
        style={{ background: `radial-gradient(circle at ${path.midX}% ${path.midY}%, rgba(139, 92, 246, 0.4) 0%, transparent 60%)` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.8, 0, 0.5, 0, 0.3, 0] }}
        transition={{ duration: 0.5, times: [0, 0.1, 0.15, 0.25, 0.3, 0.4, 0.5] }}
      />
      
      {/* Electric discharge particles along the bolt path */}
      {[...Array(12)].map((_, i) => {
        const progress = i / 12;
        const x = path.startX + (path.endX - path.startX) * progress + (Math.random() - 0.5) * 10;
        const y = path.startY + (path.endY - path.startY) * progress;
        
        return (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full blur-sm"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              background: i % 2 === 0 ? '#ffffff' : color,
              boxShadow: `0 0 12px ${color}`,
            }}
            animate={{ 
              scale: [0, 2.5, 0],
              opacity: [0, 1, 0],
            }}
            transition={{ 
              duration: 0.3,
              delay: 0.05 + i * 0.02,
            }}
          />
        );
      })}
      
      {/* Thunder energy ripples */}
      {[...Array(2)].map((_, i) => (
        <motion.div
          key={`ripple-${i}`}
          className="absolute rounded-full border-2"
          style={{
            left: `${path.midX - 10}%`,
            top: `${path.midY - 10}%`,
            width: '20%',
            height: '20%',
            borderColor: `${color}66`,
          }}
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ 
            scale: [0, 3],
            opacity: [0.8, 0],
          }}
          transition={{ duration: 0.6, delay: 0.1 + i * 0.15 }}
        />
      ))}
    </motion.div>
  );
}

// 🛸 UFO STREAK - Mysterious object zips across with erratic movement
export function UFOStreak({ themeColors }: EventProps) {
  // UFOs should move erratically through the horizon
  const paths = [
    { startX: -10, startY: 25, endX: 110, endY: 40, wobble: true },  // Slight descent with wobble
    { startX: 110, startY: 35, endX: -10, endY: 20, wobble: true },  // Slight ascent with wobble
    { startX: -10, startY: 50, endX: 110, endY: 55, wobble: true },  // Nearly horizontal with wobble
  ];
  
  const path = paths[Math.floor(Math.random() * paths.length)];
  const color = themeColors[0] || '#22d3ee';
  
  return (
    <motion.div
      className="absolute"
      initial={{ left: `${path.startX}%`, top: `${path.startY}%` }}
      animate={{ 
        left: `${path.endX}%`,
        top: `${path.endY}%`,
        y: path.wobble ? [0, -8, 5, -3, 0] : 0,  // Erratic wobble pattern
      }}
      transition={{ 
        duration: 3, 
        ease: [0.22, 1, 0.36, 1],
        y: { duration: 3, ease: "easeInOut" }
      }}
    >
      {/* UFO body */}
      <div className="relative">
        {/* Dome */}
        <div
          className="w-8 h-4 rounded-t-full mx-auto"
          style={{
            background: `linear-gradient(180deg, ${color} 0%, #0e7490 100%)`,
          }}
        />
        {/* Base */}
        <div
          className="w-16 h-3 rounded-full"
          style={{
            background: `radial-gradient(ellipse, ${color} 0%, #155e75 100%)`,
            boxShadow: `0 0 20px ${color}`,
          }}
        />
        
        {/* Lights */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bottom-0"
            style={{
              left: `${i * 25}%`,
              background: i % 2 === 0 ? '#fbbf24' : color,
              boxShadow: `0 0 4px ${i % 2 === 0 ? '#fbbf24' : color}`,
            }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ 
              duration: 0.5,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </div>
      
      {/* Energy trail */}
      <motion.div
        className="absolute w-32 h-6 blur-md"
        style={{
          right: 64,
          top: 0,
          background: `linear-gradient(90deg, transparent 0%, ${color}60 100%)`,
        }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
      
      {/* Beam effect */}
      <motion.div
        className="absolute w-2 h-12 blur-sm"
        style={{
          left: '50%',
          top: 12,
          background: `linear-gradient(180deg, ${color}80 0%, transparent 100%)`,
          transform: 'translateX(-50%)',
        }}
        animate={{ opacity: [0, 0.8, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      />
    </motion.div>
  );
}

// 🌈 COSMIC RAY BURST - Rainbow beam shoots through like a prism
export function CosmicRayBurst({ themeColors }: EventProps) {
  const startSide = Math.random() > 0.5 ? 'left' : 'top';
  const angle = Math.random() * 60 - 30; // -30 to 30 degrees
  
  const rainbowColors = [
    '#ef4444', // red
    '#f97316', // orange
    '#fbbf24', // yellow
    '#34d399', // green
    '#3b82f6', // blue
    '#8b5cf6', // indigo
    '#a855f7', // violet
  ];
  
  return (
    <motion.div
      className="absolute inset-0"
      style={{
        transform: `rotate(${angle}deg)`,
        transformOrigin: startSide === 'left' ? 'left center' : 'top center',
      }}
    >
      {/* Rainbow beam layers */}
      {rainbowColors.map((color, i) => (
        <motion.div
          key={i}
          className="absolute blur-sm"
          style={{
            left: startSide === 'left' ? 0 : `${10 + i * 5}%`,
            top: startSide === 'top' ? 0 : `${10 + i * 3}%`,
            width: startSide === 'left' ? '100%' : '6px',
            height: startSide === 'top' ? '100%' : '6px',
            background: `linear-gradient(${startSide === 'left' ? '90deg' : '180deg'}, ${color} 0%, transparent 100%)`,
            transform: `translateY(${i * 2}px)`,
          }}
          initial={{ opacity: 0, scaleX: startSide === 'left' ? 0 : 1, scaleY: startSide === 'top' ? 0 : 1 }}
          animate={{ 
            opacity: [0, 0.9, 0],
            scaleX: startSide === 'left' ? 1 : 1,
            scaleY: startSide === 'top' ? 1 : 1,
          }}
          transition={{ duration: 4, delay: i * 0.1 }}
        />
      ))}
      
      {/* Prismatic sparkles */}
      {[...Array(20)].map((_, i) => {
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const sparkleColor = rainbowColors[i % rainbowColors.length];
        
        return (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              background: sparkleColor,
              boxShadow: `0 0 12px ${sparkleColor}`,
            }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              rotate: [0, 180, 360],
            }}
            transition={{ 
              duration: 2,
              delay: 1 + i * 0.1,
            }}
          />
        );
      })}
    </motion.div>
  );
}

// 🔮 WORMHOLE - Portal opens, distorts space, then closes
export function Wormhole({ themeColors }: EventProps) {
  const centerX = 30 + Math.random() * 40;
  const centerY = 30 + Math.random() * 30;
  const color1 = themeColors[0] || '#a855f7';
  const color2 = themeColors[1] || '#3b82f6';
  
  return (
    <motion.div
      className="absolute"
      style={{ left: `${centerX}%`, top: `${centerY}%` }}
    >
      {/* Wormhole opening - concentric rings */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-4 -translate-x-1/2 -translate-y-1/2"
          style={{
            borderColor: i % 2 === 0 ? color1 : color2,
            borderStyle: 'dashed',
          }}
          initial={{ width: 0, height: 0, opacity: 0, rotate: 0 }}
          animate={{ 
            width: 40 + i * 30,
            height: 40 + i * 30,
            opacity: [0, 0.8, 0.8, 0],
            rotate: i % 2 === 0 ? [0, 360] : [0, -360],
          }}
          transition={{ 
            duration: 5,
            delay: i * 0.2,
            ease: "easeInOut",
            rotate: { duration: 5, ease: "linear" }
          }}
        />
      ))}
      
      {/* Central vortex */}
      <motion.div
        className="absolute w-24 h-24 rounded-full -translate-x-1/2 -translate-y-1/2 blur-xl"
        style={{
          background: `radial-gradient(circle, ${color2} 0%, ${color1} 40%, transparent 70%)`,
        }}
        initial={{ opacity: 0, scale: 0, rotate: 0 }}
        animate={{ 
          opacity: [0, 1, 1, 0],
          scale: [0, 1.2, 1.2, 0],
          rotate: [0, 720],
        }}
        transition={{ 
          duration: 5,
          rotate: { duration: 5, ease: "linear" }
        }}
      />
      
      {/* Space distortion particles */}
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 70;
        
        return (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              background: 'white',
              boxShadow: `0 0 6px white`,
            }}
            initial={{ 
              x: Math.cos(angle) * radius,
              y: Math.sin(angle) * radius,
              opacity: 1,
            }}
            animate={{ 
              x: [
                Math.cos(angle) * radius,
                Math.cos(angle) * 20,
                Math.cos(angle) * radius,
              ],
              y: [
                Math.sin(angle) * radius,
                Math.sin(angle) * 20,
                Math.sin(angle) * radius,
              ],
              opacity: [1, 0.3, 1, 0],
            }}
            transition={{ 
              duration: 5,
              delay: i * 0.1,
              ease: "easeInOut"
            }}
          />
        );
      })}
    </motion.div>
  );
}

// 💎 CRYSTAL FORMATION - Geometric crystals grow and shatter
export function CrystalFormation({ themeColors }: EventProps) {
  const centerX = 30 + Math.random() * 40;
  const centerY = 30 + Math.random() * 30;
  const color = themeColors[0] || '#ec4899';
  const crystalColor1 = `${color}ee`;
  const crystalColor2 = `${color}88`;
  
  return (
    <motion.div
      className="absolute"
      style={{ left: `${centerX}%`, top: `${centerY}%` }}
    >
      {/* Central crystal core */}
      <motion.div
        className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2"
        style={{
          background: `linear-gradient(135deg, ${crystalColor1} 0%, ${crystalColor2} 100%)`,
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          boxShadow: `0 0 20px ${color}`,
        }}
        initial={{ scale: 0, rotate: 0, opacity: 0 }}
        animate={{ 
          scale: [0, 1.5, 1.5, 0.5],
          rotate: [0, 0, 180, 180],
          opacity: [0, 1, 1, 0],
        }}
        transition={{ duration: 3, times: [0, 0.3, 0.7, 1] }}
      />
      
      {/* Growing crystal spikes */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const distance = 60;
        
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              width: '4px',
              height: '30px',
              background: `linear-gradient(180deg, ${crystalColor1} 0%, transparent 100%)`,
              boxShadow: `0 0 10px ${color}`,
              transformOrigin: 'bottom center',
            }}
            initial={{ 
              x: Math.cos(angle) * 5,
              y: Math.sin(angle) * 5,
              scaleY: 0,
              rotate: (angle * 180 / Math.PI),
              opacity: 0,
            }}
            animate={{ 
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              scaleY: [0, 1, 1, 0],
              opacity: [0, 1, 1, 0],
            }}
            transition={{ 
              duration: 3,
              delay: 0.3 + i * 0.1,
              times: [0, 0.4, 0.8, 1]
            }}
          />
        );
      })}
      
      {/* Shatter particles */}
      {[...Array(16)].map((_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const distance = 80;
        
        return (
          <motion.div
            key={`shatter-${i}`}
            className="absolute w-1 h-1"
            style={{
              background: crystalColor1,
              clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
              boxShadow: `0 0 6px ${color}`,
            }}
            initial={{ 
              x: 0,
              y: 0,
              opacity: 0,
              rotate: 0,
            }}
            animate={{ 
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              opacity: [0, 1, 0],
              rotate: Math.random() * 360,
            }}
            transition={{ 
              duration: 1.5,
              delay: 2,
              ease: "easeOut"
            }}
          />
        );
      })}
    </motion.div>
  );
}

// 🎆 STARDUST EXPLOSION - Particle burst like fireworks
export function StardustExplosion({ themeColors }: EventProps) {
  const centerX = 30 + Math.random() * 40;
  const centerY = 25 + Math.random() * 30;
  const colors = themeColors.length >= 3 ? themeColors : ['#fbbf24', '#ec4899', '#8b5cf6'];
  
  return (
    <motion.div
      className="absolute"
      style={{ left: `${centerX}%`, top: `${centerY}%` }}
    >
      {/* Initial bright flash */}
      <motion.div
        className="absolute w-4 h-4 rounded-full -translate-x-1/2 -translate-y-1/2"
        style={{
          background: 'white',
          boxShadow: '0 0 40px white',
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: [0, 3, 0],
          opacity: [0, 1, 0],
        }}
        transition={{ duration: 0.6 }}
      />
      
      {/* Firework explosion particles */}
      {[...Array(32)].map((_, i) => {
        const angle = (i / 32) * Math.PI * 2;
        const distance = 80 + Math.random() * 40;
        const color = colors[i % colors.length];
        
        return (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: color,
              boxShadow: `0 0 8px ${color}`,
            }}
            initial={{ 
              x: 0,
              y: 0,
              opacity: 0,
              scale: 0,
            }}
            animate={{ 
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance + (Math.random() * 20 + 10), // Add gravity
              opacity: [0, 1, 1, 0],
              scale: [0, 1.2, 0.8, 0],
            }}
            transition={{ 
              duration: 2,
              delay: 0.2 + (i / 32) * 0.3,
              ease: [0.22, 0.61, 0.36, 1] // easeOutCubic
            }}
          />
        );
      })}
      
      {/* Trailing sparkles */}
      {[...Array(48)].map((_, i) => {
        const angle = (Math.random() * Math.PI * 2);
        const distance = 40 + Math.random() * 60;
        const color = colors[i % colors.length];
        
        return (
          <motion.div
            key={`trail-${i}`}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: color,
              boxShadow: `0 0 4px ${color}`,
            }}
            initial={{ 
              x: 0,
              y: 0,
              opacity: 0,
            }}
            animate={{ 
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance + (Math.random() * 15 + 5),
              opacity: [0, 0.8, 0],
              scale: [0, 1, 0],
            }}
            transition={{ 
              duration: 1.5,
              delay: 0.5 + Math.random() * 0.8,
              ease: "easeOut"
            }}
          />
        );
      })}
    </motion.div>
  );
}

// ⭐ SUPERNOVA BURST - Sudden explosion of light
export function SupernovaBurst({ themeColors }: EventProps) {
  const centerX = 30 + Math.random() * 40;
  const centerY = 25 + Math.random() * 30;
  const color = themeColors[0] || '#f59e0b';
  
  return (
    <motion.div
      className="absolute"
      style={{ left: `${centerX}%`, top: `${centerY}%` }}
    >
      {/* Core explosion */}
      <motion.div
        className="absolute rounded-full -translate-x-1/2 -translate-y-1/2"
        style={{
          background: `radial-gradient(circle, white 0%, ${color} 40%, transparent 70%)`,
        }}
        initial={{ width: 0, height: 0, opacity: 0 }}
        animate={{ 
          width: [0, 200, 300],
          height: [0, 200, 300],
          opacity: [0, 1, 0],
        }}
        transition={{ duration: 3, ease: "easeOut" }}
      />
      
      {/* Shockwave ring */}
      <motion.div
        className="absolute border-4 rounded-full -translate-x-1/2 -translate-y-1/2"
        style={{
          borderColor: color,
        }}
        initial={{ width: 0, height: 0, opacity: 1 }}
        animate={{ 
          width: 400,
          height: 400,
          opacity: 0,
        }}
        transition={{ duration: 3, ease: "easeOut" }}
      />
      
      {/* Ejected particles */}
      {[...Array(20)].map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const distance = 150;
        
        return (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: color,
              boxShadow: `0 0 10px ${color}`,
            }}
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{ 
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              opacity: 0,
              scale: [1, 0.3],
            }}
            transition={{ duration: 3, delay: 0.5, ease: "easeOut" }}
          />
        );
      })}
    </motion.div>
  );
}

// 🌫️ NEBULA BLOOM - Colorful nebula cloud expands and fades
export function NebulaBloom({ themeColors }: EventProps) {
  const centerX = 25 + Math.random() * 50;
  const centerY = 30 + Math.random() * 30;
  const color1 = themeColors[0] || '#ec4899';
  const color2 = themeColors[1] || '#8b5cf6';
  const color3 = themeColors[2] || '#3b82f6';
  
  return (
    <motion.div
      className="absolute"
      style={{ left: `${centerX}%`, top: `${centerY}%` }}
    >
      {/* Multi-layered nebula clouds */}
      {[
        { color: color1, delay: 0, scale: 1.2 },
        { color: color2, delay: 0.5, scale: 1 },
        { color: color3, delay: 1, scale: 0.8 },
      ].map((layer, i) => (
        <motion.div
          key={i}
          className="absolute w-64 h-64 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
          style={{
            background: `radial-gradient(circle, ${layer.color} 0%, transparent 70%)`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, layer.scale * 1.5, layer.scale * 2],
            opacity: [0, 0.6, 0],
          }}
          transition={{ 
            duration: 6, 
            delay: layer.delay,
            ease: "easeOut"
          }}
        />
      ))}
      
      {/* Twinkling stars within nebula */}
      {[...Array(12)].map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = 40 + Math.random() * 60;
        
        return (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white"
            style={{
              left: Math.cos(angle) * distance,
              top: Math.sin(angle) * distance,
            }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{ 
              duration: 2,
              delay: 2 + Math.random() * 2,
              repeat: 2,
            }}
          />
        );
      })}
    </motion.div>
  );
}

// 🛰️ SATELLITE PASS - Realistic satellite crossing with solar panels
export function SatellitePass({ themeColors }: EventProps) {
  const startY = 20 + Math.random() * 40;
  const direction = Math.random() > 0.5 ? 1 : -1;
  const color = themeColors[0] || '#94a3b8';
  
  return (
    <motion.div
      className="absolute"
      style={{ top: `${startY}%` }}
      initial={{ left: direction > 0 ? '-5%' : '105%' }}
      animate={{ left: direction > 0 ? '105%' : '-5%' }}
      transition={{ duration: 5, ease: "linear" }}
    >
      <div className="relative" style={{ transform: direction > 0 ? 'none' : 'scaleX(-1)' }}>
        {/* Satellite body */}
        <div
          className="w-6 h-4"
          style={{
            background: `linear-gradient(135deg, ${color} 0%, #64748b 100%)`,
            boxShadow: 'inset -1px -1px 2px rgba(0,0,0,0.4)',
          }}
        />
        
        {/* Solar panels */}
        <div
          className="absolute w-8 h-2 -left-8 top-1"
          style={{
            background: 'linear-gradient(90deg, #1e40af 0%, #3b82f6 50%, #1e40af 100%)',
            boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)',
          }}
        />
        <div
          className="absolute w-8 h-2 -right-8 top-1"
          style={{
            background: 'linear-gradient(90deg, #1e40af 0%, #3b82f6 50%, #1e40af 100%)',
            boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)',
          }}
        />
        
        {/* Antenna */}
        <div className="absolute w-px h-3 bg-slate-400 left-1/2 -top-3" />
        
        {/* Blinking signal light */}
        <motion.div
          className="absolute w-1 h-1 rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            background: '#ef4444',
            boxShadow: '0 0 4px #ef4444',
          }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </div>
    </motion.div>
  );
}

// 🛩️ PRIVATE JET - Sleek business jet with fast cruising path
export function PrivateJet({ themeColors }: EventProps) {
  // Private jets move faster and can have steeper ascent/descent
  const flightPaths = [
    { startX: -6, startY: 30, endX: 106, endY: 20, direction: 1 },   // Ascending
    { startX: 106, startY: 25, endX: -6, endY: 35, direction: -1 },  // Descending
    { startX: -6, startY: 40, endX: 106, endY: 30, direction: 1 },   // Shallow ascent
  ];
  
  const path = flightPaths[Math.floor(Math.random() * flightPaths.length)];
  
  return (
    <motion.div
      className="absolute"
      initial={{ left: `${path.startX}%`, top: `${path.startY}%` }}
      animate={{ left: `${path.endX}%`, top: `${path.endY}%` }}
      transition={{ duration: 5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative" style={{ transform: path.direction > 0 ? 'none' : 'scaleX(-1)' }}>
        {/* Jet body */}
        <div className="relative">
          {/* Fuselage */}
          <div
            className="w-12 h-2 rounded-full"
            style={{
              background: 'linear-gradient(180deg, #ffffff 0%, #e2e8f0 100%)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3), inset 0 -1px 1px rgba(0,0,0,0.1)',
            }}
          />
          
          {/* Cockpit window */}
          <div className="absolute left-8 top-0 w-2 h-1 rounded-t-full bg-slate-700/30" />
          
          {/* Tail */}
          <div
            className="absolute -left-0.5 top-0 w-2 h-2"
            style={{
              background: '#e2e8f0',
              clipPath: 'polygon(100% 0%, 100% 100%, 0% 60%)',
            }}
          />
          
          {/* Wings */}
          <div
            className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-px bg-slate-200"
            style={{ boxShadow: '0 0 3px rgba(226, 232, 240, 0.9)' }}
          />
        </div>
        
        {/* Contrail */}
        <motion.div
          className="absolute h-px right-11 top-1/2 -translate-y-1/2 blur-sm"
          style={{
            width: '100px',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.5) 0%, transparent 100%)',
          }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
    </motion.div>
  );
}

// 🚀 SPACEX STARSHIP - Iconic spacecraft with powerful ascent trajectory
export function SpaceXStarship({ themeColors }: EventProps) {
  // Starship should move like it's actually traveling through space - diagonal with thrust
  const trajectories = [
    { startX: -7, startY: 60, endX: 107, endY: 10, direction: 1, angle: -25 },   // Powerful ascent left to right
    { startX: 107, startY: 55, endX: -7, endY: 15, direction: -1, angle: 25 },   // Powerful ascent right to left
    { startX: 20, startY: 70, endX: 80, endY: 5, direction: 1, angle: -35 },     // Steep ascent through center
  ];
  
  const path = trajectories[Math.floor(Math.random() * trajectories.length)];
  const color = themeColors[0] || '#3b82f6';
  
  return (
    <motion.div
      className="absolute"
      initial={{ left: `${path.startX}%`, top: `${path.startY}%`, rotate: path.angle }}
      animate={{ 
        left: `${path.endX}%`, 
        top: `${path.endY}%`,
      }}
      transition={{ duration: 3.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="relative" style={{ transform: path.direction > 0 ? 'none' : 'scaleX(-1)' }}>
        {/* Starship body */}
        <div className="relative">
          {/* Main body */}
          <div
            className="w-8 h-16 rounded-t-lg"
            style={{
              background: 'linear-gradient(180deg, #f8fafc 0%, #cbd5e1 50%, #94a3b8 100%)',
              boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.2), 0 0 12px rgba(59, 130, 246, 0.3)',
            }}
          />
          
          {/* Nose cone */}
          <div
            className="absolute -top-4 left-0 w-8 h-6"
            style={{
              background: 'linear-gradient(180deg, #e2e8f0 0%, #f8fafc 100%)',
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            }}
          />
          
          {/* Grid fins */}
          <div className="absolute top-2 -left-1 w-2 h-2 bg-slate-400/60" />
          <div className="absolute top-2 -right-1 w-2 h-2 bg-slate-400/60" />
          
          {/* Window */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-3 h-2 rounded-full bg-slate-800/40" />
        </div>
        
        {/* Engine glow */}
        <motion.div
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-12 h-12 blur-lg"
          style={{
            background: `radial-gradient(circle, #fbbf24 0%, ${color} 50%, transparent 80%)`,
          }}
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{ duration: 0.3, repeat: Infinity }}
        />
        
        {/* Engine particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: '50%',
              bottom: -12 - i * 4,
              background: i % 2 === 0 ? '#fbbf24' : color,
              boxShadow: `0 0 6px ${i % 2 === 0 ? '#fbbf24' : color}`,
            }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{ 
              duration: 0.5,
              repeat: Infinity,
              delay: i * 0.08,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// 🛸 SPACE STATION - ISS-style structure
export function SpaceStation({ themeColors }: EventProps) {
  const startY = 20 + Math.random() * 30;
  const direction = Math.random() > 0.5 ? 1 : -1;
  
  return (
    <motion.div
      className="absolute"
      style={{ top: `${startY}%` }}
      initial={{ left: direction > 0 ? '-10%' : '110%' }}
      animate={{ left: direction > 0 ? '110%' : '-10%' }}
      transition={{ duration: 6, ease: "linear" }}
    >
      <div className="relative" style={{ transform: direction > 0 ? 'none' : 'scaleX(-1)' }}>
        {/* Main structure */}
        <div className="relative">
          {/* Central beam */}
          <div
            className="w-24 h-1 bg-slate-400"
            style={{ boxShadow: '0 0 4px rgba(148, 163, 184, 0.5)' }}
          />
          
          {/* Modules */}
          <div
            className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-4 bg-slate-300 rounded"
            style={{ boxShadow: 'inset -1px -1px 2px rgba(0,0,0,0.3)' }}
          />
          <div
            className="absolute left-14 top-1/2 -translate-y-1/2 w-6 h-3 bg-slate-300 rounded"
            style={{ boxShadow: 'inset -1px -1px 2px rgba(0,0,0,0.3)' }}
          />
          
          {/* Solar panels */}
          <div
            className="absolute left-0 -top-6 w-12 h-12"
            style={{
              background: 'linear-gradient(45deg, #1e40af 25%, #3b82f6 25%, #3b82f6 50%, #1e40af 50%, #1e40af 75%, #3b82f6 75%)',
              backgroundSize: '4px 4px',
              boxShadow: '0 0 12px rgba(59, 130, 246, 0.6)',
              opacity: 0.9,
            }}
          />
          <div
            className="absolute right-0 -bottom-6 w-12 h-12"
            style={{
              background: 'linear-gradient(45deg, #1e40af 25%, #3b82f6 25%, #3b82f6 50%, #1e40af 50%, #1e40af 75%, #3b82f6 75%)',
              backgroundSize: '4px 4px',
              boxShadow: '0 0 12px rgba(59, 130, 246, 0.6)',
              opacity: 0.9,
            }}
          />
          
          {/* Blinking lights */}
          {[0, 8, 16].map((offset, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                left: `${offset}px`,
                top: '50%',
                background: i % 2 === 0 ? '#ef4444' : '#22c55e',
                boxShadow: `0 0 4px ${i % 2 === 0 ? '#ef4444' : '#22c55e'}`,
              }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// EVENT COMPONENT MAPPER
// ============================================================================

export function renderCosmicEvent(eventType: CosmicEventType, themeColors: string[]): JSX.Element {
  const EventComponent = eventComponents[eventType];
  return <EventComponent key={`cosmic-${Date.now()}`} themeColors={themeColors} />;
}

const eventComponents: Record<CosmicEventType, React.ComponentType<EventProps>> = {
  'shooting-comet': ShootingComet,
  'meteor-shower': MeteorShower,
  'satellite-pass': SatellitePass,
  'star-birth': StarBirth,
  'asteroid-tumble': AsteroidTumble,
  'supernova-burst': SupernovaBurst,
  'nebula-bloom': NebulaBloom,
  'planet-transit': PlanetTransit,
  'black-hole': BlackHole,
  'cosmic-vortex': CosmicVortex,
  'space-lightning': SpaceLightning,
  'ufo-streak': UFOStreak,
  'cosmic-ray-burst': CosmicRayBurst,
  'wormhole': Wormhole,
  'crystal-formation': CrystalFormation,
  'stardust-explosion': StardustExplosion,
  'spacex-starship': SpaceXStarship,
  'space-station': SpaceStation,
};