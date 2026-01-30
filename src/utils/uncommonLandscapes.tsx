import React, { useMemo } from 'react';
import { motion } from 'motion/react';

// Device detection
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

// ============================================================
// 🎨 UNCOMMON TIER - SPECTACULAR LANDSCAPE EFFECTS
// Each uncommon horizon gets a unique landscape-based effect!
// ============================================================

/**
 * 📨 Digital Horizon - Futuristic grid landscape for Future Messenger
 */
export function DigitalHorizon({ colorTheme }: { colorTheme: string[] }) {
  const gridLines = useMemo(() => Array.from({ length: isMobile ? 8 : 15 }, (_, i) => i), []);
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Futuristic grid floor */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3" style={{
        background: `linear-gradient(180deg, transparent 0%, ${colorTheme[0]}15 50%, ${colorTheme[0]}30 100%)`
      }}>
        {/* Horizontal grid lines */}
        {gridLines.map((i) => (
          <motion.div
            key={`h-${i}`}
            className="absolute w-full h-px"
            style={{
              bottom: `${i * 8}%`,
              background: `linear-gradient(90deg, transparent, ${colorTheme[0]}60, transparent)`,
              transformOrigin: 'center bottom',
              transform: `perspective(400px) rotateX(${70 - i * 2}deg)`
            }}
            animate={{
              opacity: [0.3, 0.7, 0.3],
              scaleX: [0.9, 1.1, 0.9]
            }}
            transition={{
              duration: 3 + i * 0.2,
              repeat: Infinity,
              delay: i * 0.1,
              ease: 'easeInOut'
            }}
          />
        ))}
        
        {/* Vertical grid lines */}
        {gridLines.slice(0, isMobile ? 5 : 10).map((i) => (
          <motion.div
            key={`v-${i}`}
            className="absolute h-full w-px"
            style={{
              left: `${10 + i * 10}%`,
              background: `linear-gradient(180deg, transparent, ${colorTheme[1] || colorTheme[0]}50)`,
              transformOrigin: 'center bottom',
              transform: 'perspective(400px) rotateX(70deg)'
            }}
            animate={{
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>
      
      {/* Data packets flying across */}
      <motion.div
        className="absolute top-1/3 left-0 w-8 h-2 rounded-full"
        style={{
          background: colorTheme[0],
          boxShadow: `0 0 20px ${colorTheme[0]}`
        }}
        animate={{
          x: ['0%', '100vw'],
          y: [0, -30, -60]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    </div>
  );
}

/**
 * 📬 Vintage Sunset - Warm nostalgic landscape for Past Receiver
 */
export function VintageSunset({ colorTheme }: { colorTheme: string[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Golden sunset horizon */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2" style={{
        background: `linear-gradient(180deg, transparent 0%, ${colorTheme[0]}20 40%, ${colorTheme[1] || colorTheme[0]}40 70%, ${colorTheme[0]}60 100%)`
      }}>
        {/* Sun disc */}
        <motion.div
          className="absolute left-1/2 rounded-full"
          style={{
            bottom: '15%',
            width: isMobile ? '60px' : '120px',
            height: isMobile ? '60px' : '120px',
            transform: 'translateX(-50%)',
            background: `radial-gradient(circle, ${colorTheme[0]}FF 0%, ${colorTheme[0]}CC 50%, ${colorTheme[0]}00 100%)`,
            boxShadow: `0 0 80px ${colorTheme[0]}CC, 0 0 120px ${colorTheme[0]}80`
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        
        {/* Sun rays */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 origin-bottom"
            style={{
              bottom: '15%',
              width: '2px',
              height: isMobile ? '40px' : '80px',
              background: `linear-gradient(180deg, ${colorTheme[0]}AA, transparent)`,
              transform: `translateX(-50%) rotate(${i * 45}deg)`,
              transformOrigin: 'bottom center'
            }}
            animate={{
              opacity: [0.4, 0.8, 0.4],
              scaleY: [1, 1.2, 1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>
      
      {/* Silhouette hills */}
      <div className="absolute bottom-0 left-0 right-0 h-1/4">
        <svg viewBox="0 0 1000 200" className="w-full h-full" preserveAspectRatio="none">
          <motion.path
            d="M0,150 Q250,100 500,120 T1000,140 L1000,200 L0,200 Z"
            fill={`${colorTheme[1] || colorTheme[0]}40`}
            animate={{
              opacity: [0.5, 0.7, 0.5]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          <motion.path
            d="M0,170 Q200,140 400,155 T800,165 T1000,160 L1000,200 L0,200 Z"
            fill={`${colorTheme[0]}60`}
            animate={{
              opacity: [0.6, 0.8, 0.6]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </svg>
      </div>
    </div>
  );
}

/**
 * 📷 Aperture Landscape - Camera lens opening for Snapshot Keeper
 */
export function ApertureLandscape({ colorTheme }: { colorTheme: string[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
      {/* Aperture blades */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            width: isMobile ? '100px' : '200px',
            height: isMobile ? '100px' : '200px',
            background: `linear-gradient(135deg, ${colorTheme[0]}40, ${colorTheme[1] || colorTheme[0]}20)`,
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
            transform: `rotate(${i * 45}deg)`,
            transformOrigin: 'center'
          }}
          animate={{
            scale: [0.8, 1, 0.8],
            rotate: [i * 45, i * 45 + 5, i * 45],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut'
          }}
        />
      ))}
      
      {/* Center lens highlight */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: isMobile ? '60px' : '100px',
          height: isMobile ? '60px' : '100px',
          background: `radial-gradient(circle, ${colorTheme[0]}60, transparent)`,
          border: `2px solid ${colorTheme[0]}80`
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    </div>
  );
}

/**
 * 🎬 Hollywood Hills - Premiere lights landscape for Cinema Pioneer
 */
export function HollywoodHills({ colorTheme }: { colorTheme: string[] }) {
  const spotlights = useMemo(() => Array.from({ length: isMobile ? 3 : 5 }, (_, i) => ({
    id: i,
    x: 20 + i * 18,
    delay: i * 0.5
  })), []);
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Hollywood hills silhouette */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3">
        <svg viewBox="0 0 1000 150" className="w-full h-full" preserveAspectRatio="none">
          <path
            d="M0,100 L100,80 L200,90 L300,70 L400,85 L500,65 L600,80 L700,60 L800,75 L900,70 L1000,80 L1000,150 L0,150 Z"
            fill={`${colorTheme[0]}50`}
            opacity="0.6"
          />
        </svg>
      </div>
      
      {/* Premiere spotlights */}
      {spotlights.map(light => (
        <motion.div
          key={light.id}
          className="absolute bottom-0"
          style={{
            left: `${light.x}%`,
            width: '2px',
            height: '100%',
            background: `linear-gradient(180deg, transparent 0%, ${colorTheme[0]}80 60%, ${colorTheme[0]}FF 100%)`,
            transformOrigin: 'bottom center'
          }}
          animate={{
            rotate: [0, 10, -10, 0],
            opacity: [0.4, 0.8, 0.4],
            scaleX: [1, 1.5, 1]
          }}
          transition={{
            duration: 5 + light.delay,
            repeat: Infinity,
            delay: light.delay,
            ease: 'easeInOut'
          }}
        >
          {/* Spotlight cone */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-full"
            style={{
              background: `linear-gradient(180deg, ${colorTheme[1] || colorTheme[0]}40 0%, transparent 40%)`,
              clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)',
              filter: 'blur(8px)'
            }}
          />
        </motion.div>
      ))}
      
      {/* Film strip border at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-8 opacity-40"
        style={{
          background: `repeating-linear-gradient(90deg, ${colorTheme[0]}80 0px, ${colorTheme[0]}80 10px, transparent 10px, transparent 20px)`,
          borderTop: `2px solid ${colorTheme[0]}`
        }}
      />
    </div>
  );
}

/**
 * 🎙️ Audio Wave Terrain - Sound visualizer landscape for Voice Keeper
 * ENHANCED UNCOMMON VERSION with 3D concert stage!
 */
export function AudioWaveTerrain({ colorTheme }: { colorTheme: string[] }) {
  const waves = useMemo(() => Array.from({ length: isMobile ? 20 : 40 }, (_, i) => ({
    id: i,
    height: 30 + Math.sin(i * 0.5) * 25 + Math.cos(i * 0.3) * 15,
    delay: i * 0.03
  })), []);
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 3D Concert Stage Floor */}
      <div className="absolute bottom-0 left-0 right-0 h-2/3" style={{
        background: `linear-gradient(180deg, transparent 0%, ${colorTheme[0]}10 30%, ${colorTheme[0]}30 100%)`,
        transform: 'perspective(800px) rotateX(5deg)',
        transformOrigin: 'bottom'
      }}>
        {/* Animated audio wave terrain */}
        <div className="absolute bottom-0 left-0 right-0 h-3/4 flex items-end justify-around">
          {waves.map((wave, i) => (
            <motion.div
              key={wave.id}
              className="rounded-t-full relative"
              style={{
                width: `${100 / waves.length}%`,
                height: `${wave.height}%`,
                background: `linear-gradient(180deg, ${colorTheme[0]}FF 0%, ${colorTheme[1] || colorTheme[0]}CC 50%, ${colorTheme[0]}80 100%)`,
                boxShadow: `0 -4px 20px ${colorTheme[0]}AA, inset 0 -2px 10px ${colorTheme[1] || colorTheme[0]}60`
              }}
              animate={{
                height: [
                  `${wave.height}%`,
                  `${wave.height + 25 + Math.sin(i * 0.3) * 15}%`,
                  `${wave.height}%`
                ],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: wave.delay,
                ease: 'easeInOut'
              }}
            >
              {/* Glow cap on each bar */}
              <div 
                className="absolute top-0 left-0 right-0 h-2 rounded-full blur-sm"
                style={{
                  background: colorTheme[0],
                  boxShadow: `0 0 15px ${colorTheme[0]}FF`
                }}
              />
            </motion.div>
          ))}
        </div>
        
        {/* Stage lights from above */}
        {Array.from({ length: isMobile ? 3 : 5 }).map((_, i) => (
          <motion.div
            key={`light-${i}`}
            className="absolute top-0"
            style={{
              left: `${20 + i * 15}%`,
              width: '120px',
              height: '100%',
              background: `linear-gradient(180deg, ${colorTheme[0]}60 0%, transparent 50%)`,
              clipPath: 'polygon(45% 0%, 55% 0%, 60% 100%, 40% 100%)',
              filter: 'blur(12px)'
            }}
            animate={{
              opacity: [0.3, 0.7, 0.3],
              scaleX: [0.8, 1.2, 0.8]
            }}
            transition={{
              duration: 2 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>
      
      {/* Circular sound ripples emanating from center */}
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={`ripple-${i}`}
          className="absolute left-1/2 top-1/2 rounded-full border-2"
          style={{
            borderColor: `${colorTheme[0]}60`,
            transform: 'translate(-50%, -50%)'
          }}
          animate={{
            width: ['0px', '600px'],
            height: ['0px', '600px'],
            opacity: [0.8, 0],
            borderWidth: ['4px', '1px']
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.75,
            ease: 'easeOut'
          }}
        />
      ))}
      
      {/* Frequency particles shooting out */}
      {Array.from({ length: isMobile ? 10 : 20 }).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${50 + (Math.random() - 0.5) * 10}%`,
            bottom: '30%',
            width: '8px',
            height: '8px',
            background: colorTheme[0],
            boxShadow: `0 0 20px ${colorTheme[0]}FF, 0 0 40px ${colorTheme[0]}AA`
          }}
          animate={{
            y: [0, -400],
            x: [(Math.random() - 0.5) * 200],
            opacity: [1, 0.8, 0],
            scale: [1, 1.8, 0.2]
          }}
          transition={{
            duration: 2.5 + Math.random() * 1.5,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeOut'
          }}
        />
      ))}
      
      {/* Waveform horizon line */}
      <svg className="absolute bottom-20 left-0 right-0 h-24" viewBox="0 0 1000 100" preserveAspectRatio="none">
        <motion.path
          d={`M0,50 ${Array.from({ length: 20 }).map((_, i) => 
            `Q${i * 50 + 25},${30 + Math.sin(i) * 20} ${(i + 1) * 50},50`
          ).join(' ')}`}
          fill="none"
          stroke={colorTheme[0]}
          strokeWidth="3"
          opacity="0.6"
          animate={{
            d: [
              `M0,50 ${Array.from({ length: 20 }).map((_, i) => 
                `Q${i * 50 + 25},${30 + Math.sin(i) * 20} ${(i + 1) * 50},50`
              ).join(' ')}`,
              `M0,50 ${Array.from({ length: 20 }).map((_, i) => 
                `Q${i * 50 + 25},${70 - Math.sin(i + 1) * 20} ${(i + 1) * 50},50`
              ).join(' ')}`
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </svg>
    </div>
  );
}

/**
 * 🔥 Volcanic Terrain - Epic lava landscape for Habit Builder
 * ENHANCED UNCOMMON VERSION with active eruption!
 */
export function VolcanicTerrain({ colorTheme }: { colorTheme: string[] }) {
  const lavaFlows = useMemo(() => Array.from({ length: isMobile ? 5 : 8 }, (_, i) => ({
    id: i,
    x: 15 + i * 10,
    delay: i * 0.6,
    width: 3 + Math.random() * 4
  })), []);
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Dramatic volcanic mountains with multiple peaks */}
      <div className="absolute bottom-0 left-0 right-0 h-3/5">
        <svg viewBox="0 0 1000 300" className="w-full h-full" preserveAspectRatio="none">
          {/* Background mountains */}
          <motion.path
            d="M0,300 L150,200 L300,180 L450,160 L600,190 L750,170 L900,200 L1000,220 L1000,300 Z"
            fill={`${colorTheme[1] || colorTheme[0]}20`}
            animate={{
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          
          {/* Main volcanic peak */}
          <motion.path
            d="M0,300 L250,180 L450,140 L500,100 L550,140 L750,170 L1000,240 L1000,300 Z"
            fill={`${colorTheme[0]}50`}
            animate={{
              opacity: [0.6, 0.8, 0.6]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </svg>
        
        {/* Massive glowing crater with eruption */}
        <motion.div
          className="absolute left-1/2 rounded-full"
          style={{
            bottom: '45%',
            width: isMobile ? '120px' : '220px',
            height: isMobile ? '60px' : '110px',
            transform: 'translateX(-50%)',
            background: `radial-gradient(ellipse, ${colorTheme[0]}FF 0%, ${colorTheme[1] || colorTheme[0]}EE 30%, ${colorTheme[0]}AA 60%, transparent 100%)`,
            boxShadow: `0 0 100px ${colorTheme[0]}FF, 0 0 200px ${colorTheme[0]}CC, 0 0 300px ${colorTheme[0]}80`,
            filter: 'blur(4px)'
          }}
          animate={{
            opacity: [0.8, 1, 0.8],
            scale: [1, 1.3, 1],
            boxShadow: [
              `0 0 100px ${colorTheme[0]}FF, 0 0 200px ${colorTheme[0]}CC`,
              `0 0 150px ${colorTheme[0]}FF, 0 0 300px ${colorTheme[0]}FF`,
              `0 0 100px ${colorTheme[0]}FF, 0 0 200px ${colorTheme[0]}CC`
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        
        {/* Lava eruption particles shooting up */}
        {Array.from({ length: isMobile ? 15 : 30 }).map((_, i) => (
          <motion.div
            key={`eruption-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${48 + (Math.random() - 0.5) * 8}%`,
              bottom: '45%',
              width: `${4 + Math.random() * 8}px`,
              height: `${4 + Math.random() * 8}px`,
              background: i % 3 === 0 ? colorTheme[0] : colorTheme[1] || colorTheme[0],
              boxShadow: `0 0 15px ${colorTheme[0]}FF`
            }}
            animate={{
              y: [0, -300 - Math.random() * 200],
              x: [(Math.random() - 0.5) * 150],
              opacity: [1, 0.8, 0],
              scale: [1, 1.5, 0.3]
            }}
            transition={{
              duration: 2 + Math.random() * 1.5,
              repeat: Infinity,
              delay: i * 0.1,
              ease: 'easeOut'
            }}
          />
        ))}
      </div>
      
      {/* Multiple lava flows with enhanced glow */}
      {lavaFlows.map(flow => (
        <motion.div
          key={flow.id}
          className="absolute bottom-0 rounded-t-full"
          style={{
            left: `${flow.x}%`,
            width: `${flow.width}px`,
            height: '50%',
            background: `linear-gradient(180deg, transparent 0%, ${colorTheme[1] || colorTheme[0]}60 30%, ${colorTheme[0]}CC 60%, ${colorTheme[0]}FF 100%)`,
            boxShadow: `0 0 30px ${colorTheme[0]}FF, inset 0 0 20px ${colorTheme[0]}AA`,
            filter: 'blur(1px)'
          }}
          animate={{
            height: ['45%', '55%', '45%'],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: flow.delay,
            ease: 'easeInOut'
          }}
        />
      ))}
      
      {/* Falling ash and embers */}
      {Array.from({ length: isMobile ? 20 : 40 }).map((_, i) => (
        <motion.div
          key={`ash-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-5%',
            width: `${1 + Math.random() * 3}px`,
            height: `${1 + Math.random() * 3}px`,
            background: i % 4 === 0 ? colorTheme[0] : '#ffffff80',
            boxShadow: i % 4 === 0 ? `0 0 8px ${colorTheme[0]}` : 'none'
          }}
          animate={{
            y: [0, window.innerHeight * 1.2],
            x: [(Math.random() - 0.5) * 100],
            opacity: [0, 0.8, 0.4, 0],
            scale: [1, 0.5, 0.2]
          }}
          transition={{
            duration: 5 + Math.random() * 3,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'linear'
          }}
        />
      ))}
      
      {/* Heat waves distortion effect */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1/2 pointer-events-none"
        style={{
          background: `linear-gradient(180deg, transparent 0%, ${colorTheme[0]}05 50%, ${colorTheme[0]}10 100%)`,
          backdropFilter: 'blur(0.5px)'
        }}
        animate={{
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    </div>
  );
}

/**
 * 📸 Polaroid Frame Landscape - Enhanced photo gallery for Moment Collector
 * ENHANCED UNCOMMON VERSION with 3D photo wall and camera effects!
 */
export function PolaroidFrameLandscape({ colorTheme }: { colorTheme: string[] }) {
  const frames = useMemo(() => Array.from({ length: isMobile ? 6 : 10 }, (_, i) => ({
    id: i,
    x: 10 + i * 9,
    y: 15 + (i % 3) * 25,
    rotate: (Math.random() - 0.5) * 20,
    delay: i * 0.3,
    scale: 0.8 + Math.random() * 0.4
  })), []);
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 3D Photo wall background */}
      <div className="absolute inset-0" style={{
        background: `radial-gradient(ellipse at center, ${colorTheme[0]}15 0%, ${colorTheme[0]}05 50%, transparent 100%)`,
        transform: 'perspective(1000px) rotateY(0deg)'
      }}>
        {/* Scattered polaroid frames throughout the scene */}
        {frames.map(frame => (
          <motion.div
            key={frame.id}
            className="absolute bg-white rounded shadow-2xl"
            style={{
              left: `${frame.x}%`,
              bottom: `${frame.y}%`,
              width: `${(isMobile ? 50 : 90) * frame.scale}px`,
              height: `${(isMobile ? 60 : 110) * frame.scale}px`,
              border: '4px solid white',
              boxShadow: `0 10px 30px rgba(0,0,0,0.4), 0 0 40px ${colorTheme[0]}80, inset 0 0 20px ${colorTheme[0]}20`,
              transform: `rotate(${frame.rotate}deg)`,
              transformStyle: 'preserve-3d'
            }}
            animate={{
              y: [0, -30, 0],
              rotate: [frame.rotate, frame.rotate + 8, frame.rotate],
              scale: [frame.scale, frame.scale * 1.08, frame.scale],
              boxShadow: [
                `0 10px 30px rgba(0,0,0,0.4), 0 0 40px ${colorTheme[0]}80`,
                `0 15px 40px rgba(0,0,0,0.5), 0 0 60px ${colorTheme[0]}FF`,
                `0 10px 30px rgba(0,0,0,0.4), 0 0 40px ${colorTheme[0]}80`
              ]
            }}
            transition={{
              duration: 4 + frame.delay,
              repeat: Infinity,
              delay: frame.delay,
              ease: 'easeInOut'
            }}
          >
            {/* Inner photo area with gradient */}
            <div className="w-full h-3/4 relative overflow-hidden" style={{
              background: `linear-gradient(135deg, ${colorTheme[0]}50, ${colorTheme[1] || colorTheme[0]}40, ${colorTheme[0]}30)`
            }}>
              {/* Film grain texture */}
              <motion.div
                className="absolute inset-0"
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.3\'/%3E%3C/svg%3E")',
                  opacity: 0.2
                }}
              />
            </div>
            
            {/* Polaroid caption line */}
            <div className="absolute bottom-2 left-2 right-2 h-0.5" style={{
              background: `${colorTheme[0]}40`
            }} />
          </motion.div>
        ))}
      </div>
      
      {/* Massive camera shutter aperture effect */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: isMobile ? '180px' : '320px',
          height: isMobile ? '180px' : '320px'
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${colorTheme[0]}40, ${colorTheme[1] || colorTheme[0]}20)`,
              clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((i * 45 - 22.5) * Math.PI / 180)}% ${50 + 50 * Math.sin((i * 45 - 22.5) * Math.PI / 180)}%, ${50 + 50 * Math.cos((i * 45 + 22.5) * Math.PI / 180)}% ${50 + 50 * Math.sin((i * 45 + 22.5) * Math.PI / 180)}%)`,
              transformOrigin: 'center',
              boxShadow: `inset 0 0 30px ${colorTheme[0]}60`
            }}
            animate={{
              scale: [0, 1.2, 0],
              rotate: [0, 5, 0],
              opacity: [0, 0.6, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeOut'
            }}
          />
        ))}
      </motion.div>
      
      {/* Camera flash bursts */}
      {Array.from({ length: isMobile ? 4 : 7 }).map((_, i) => (
        <motion.div
          key={`flash-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${20 + i * 12}%`,
            top: `${20 + (i % 3) * 20}%`,
            width: isMobile ? '80px' : '140px',
            height: isMobile ? '80px' : '140px',
            background: `radial-gradient(circle, ${colorTheme[0]}FF 0%, ${colorTheme[0]}AA 30%, transparent 70%)`,
            filter: 'blur(20px)'
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1.5, 0.5]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: 2 + i * 0.8,
            ease: 'easeOut'
          }}
        />
      ))}
      
      {/* Floating camera icons */}
      {Array.from({ length: isMobile ? 3 : 5 }).map((_, i) => (
        <motion.div
          key={`camera-${i}`}
          className="absolute text-4xl"
          style={{
            left: `${15 + i * 18}%`,
            bottom: '-5%',
            filter: `drop-shadow(0 0 10px ${colorTheme[0]})`
          }}
          animate={{
            y: [0, -window.innerHeight * 0.6],
            rotate: [0, 360],
            opacity: [0, 0.7, 0],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: 6 + i * 0.5,
            repeat: Infinity,
            delay: i * 1.2,
            ease: 'easeOut'
          }}
        >
          📷
        </motion.div>
      ))}
      
      {/* Photo sparkles */}
      {Array.from({ length: isMobile ? 15 : 30 }).map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: colorTheme[0],
            boxShadow: `0 0 10px ${colorTheme[0]}FF`
          }}
          animate={{
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
}