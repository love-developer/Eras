import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { titleConfigs } from '../utils/titleConfigs';
import { getHeaderTransition, transitionVariants } from '../utils/headerTransitions';
import { getHorizonEffects } from '../utils/horizonEffects';
import { getRandomCosmicEvent, renderCosmicEvent, COSMIC_EVENTS } from '../utils/cosmicEvents';
import { BigBangHorizon } from './horizons/BigBangHorizon';
import { PrismaticDuskHorizon } from './horizons/PrismaticDuskHorizon';
import { DawnEternalHorizon } from './horizons/DawnEternalHorizon';
import { CreativeNexusHorizon } from './horizons/CreativeNexusHorizon';
import { NostalgiaWeaverHorizon } from './horizons/NostalgiaWeaverHorizon';
import { LegacyArchitectHorizon } from './horizons/LegacyArchitectHorizon';
import { ChronoApprenticeHorizon } from './horizons/ChronoApprenticeHorizon';
// 🌟 LEGENDARY HORIZONS - Ultimate Achievement Rewards
import { DimensionalRiftPortal } from './horizons/DimensionalRiftPortal';
import { HourglassUniverse } from './horizons/HourglassUniverse';
import { GoldenBrushstroke } from './horizons/GoldenBrushstroke';
import { LivingMemoryTree } from './horizons/LivingMemoryTree';
import { PrecisionTargetReticle } from './horizons/PrecisionTargetReticle';
import { SevenSealsMystical } from './horizons/SevenSealsMystical';

interface HeaderBackgroundProps {
  titleName: string;
  titleRarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  preview?: boolean; // Preview mode for contained rendering (e.g., in modals)
}

// ============================================================================
// COSMIC EVENTS HOOK - Manages random event spawning
// ============================================================================

function useCosmicEvents(themeColors: string[], isActive: boolean) {
  const [currentEvent, setCurrentEvent] = React.useState<{
    type: string;
    key: number;
  } | null>(null);

  React.useEffect(() => {
    if (!isActive) return;

    // Schedule next random event
    const scheduleNextEvent = () => {
      // Random interval: 15-45 seconds
      const minInterval = 15000;
      const maxInterval = 45000;
      const interval = minInterval + Math.random() * (maxInterval - minInterval);

      return setTimeout(() => {
        const event = getRandomCosmicEvent();
        
        // Spawn event
        setCurrentEvent({
          type: event.type,
          key: Date.now(),
        });

        // Clear event after its duration
        setTimeout(() => {
          setCurrentEvent(null);
        }, event.duration * 1000);

        // Schedule next event
        scheduleNextEvent();
      }, interval);
    };

    const timeoutId = scheduleNextEvent();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isActive]);

  // Render the current event
  if (!currentEvent) return null;

  return (
    <div key={currentEvent.key} className="absolute inset-0 pointer-events-none z-30">
      {renderCosmicEvent(currentEvent.type as any, themeColors)}
    </div>
  );
}

export function HeaderBackground({ titleName, titleRarity, preview = false }: HeaderBackgroundProps) {
  const config = titleConfigs[titleName] || titleConfigs['default'];
  const transitionConfig = getHeaderTransition(titleName);
  const variants = transitionVariants[transitionConfig.type];
  
  // Get cosmic effects for this horizon
  const effects = getHorizonEffects(titleName, titleRarity, config.colors, 'active');
  
  // 🌌 COSMIC EVENTS - Random celestial phenomena (active only when not in preview mode)
  const cosmicEvents = useCosmicEvents(config.colors, !preview);
  
  // HEIGHT CONFIGURATION
  // Desktop: extends from top to ~200px (below logo)
  // Mobile: ~150px
  // Preview mode: fills container with absolute positioning
  const height = preview ? 'h-full' : 'h-[150px] sm:h-[200px]';
  const positioning = preview ? 'absolute' : 'fixed';
  
  // 🎯 PERFORMANCE FIX: Force GPU acceleration and isolate animations from scroll events
  const performanceStyle = {
    willChange: 'auto',
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden' as const,
  };
  
  // RARITY-BASED APPROACH (Option 7: Thematic Hybrid)
  // Each tier uses distinct techniques, individual titles have unique customizations
  
  // ============================================================================
  // EPIC TIER - PHASE 1: Big Bang Horizon (Genesis Eternal)
  // ============================================================================
  
  if (titleName === 'Genesis Eternal') {
    const isMobile = window.innerWidth < 640;
    return (
      <BigBangHorizon
        height={height}
        positioning={positioning}
        performanceStyle={performanceStyle}
        isMobile={isMobile}
      />
    );
  }
  
  if (titleName === 'Prismatic Dusk') {
    const isMobile = window.innerWidth < 640;
    return (
      <PrismaticDuskHorizon
        height={height}
        positioning={positioning}
        performanceStyle={performanceStyle}
        isMobile={isMobile}
      />
    );
  }
  
  if (titleName === 'Dawn Eternal') {
    const isMobile = window.innerWidth < 640;
    return (
      <DawnEternalHorizon
        height={height}
        positioning={positioning}
        performanceStyle={performanceStyle}
        isMobile={isMobile}
      />
    );
  }
  
  if (titleName === 'Creative Nexus') {
    const isMobile = window.innerWidth < 640;
    return (
      <CreativeNexusHorizon
        height={height}
        positioning={positioning}
        performanceStyle={performanceStyle}
        isMobile={isMobile}
      />
    );
  }
  
  if (titleName === 'Nostalgia Weaver') {
    const isMobile = window.innerWidth < 640;
    return (
      <NostalgiaWeaverHorizon
        height={height}
        positioning={positioning}
        performanceStyle={performanceStyle}
        isMobile={isMobile}
      />
    );
  }
  
  if (titleName === 'Legacy Architect') {
    const isMobile = window.innerWidth < 640;
    return (
      <LegacyArchitectHorizon
        height={height}
        positioning={positioning}
        performanceStyle={performanceStyle}
        isMobile={isMobile}
      />
    );
  }
  
  if (titleName === 'Chrono Apprentice') {
    const isMobile = window.innerWidth < 640;
    return (
      <ChronoApprenticeHorizon
        height={height}
        positioning={positioning}
        performanceStyle={performanceStyle}
        isMobile={isMobile}
      />
    );
  }
  
  // ============================================================================
  // COMMON TIER (5 titles): Textured Gradients + Subtle Patterns
  // ============================================================================
  
  if (titleName === 'Time Novice') {
    const particles = useMemo(() => Array.from({ length: 3 }, (_, i) => ({
      id: i,
      left: 20 + i * 30,
      top: 40 + i * 10,
      delay: i * 0.5,
      duration: 3 + i
    })), []);

    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Warm amber leather-bound journal texture */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, #3b82f6 0%, #64748b 100%)`,
          }}
        />
        
        {/* Leather texture overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 2px, rgba(0,0,0,0.03) 3px),
              repeating-linear-gradient(90deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 2px, rgba(0,0,0,0.03) 3px)
            `,
          }}
        />
        
        {/* Clock gears subtle pattern */}
        <div className="absolute inset-0 opacity-15">
          <motion.div
            className="absolute top-1/4 left-1/4 w-16 h-16 sm:w-24 sm:h-24 border-2 border-blue-300/40 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute top-1/2 left-1/2 w-px h-6 sm:h-10 bg-blue-300/50 origin-bottom -translate-x-1/2" />
          </motion.div>
          <motion.div
            className="absolute top-1/2 right-1/4 w-12 h-12 sm:w-16 sm:h-16 border-2 border-slate-300/40 rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
        </div>
        
        {/* Paper particles */}
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute w-1 h-1 bg-blue-200 rounded-full"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`
            }}
            animate={{ 
              y: [0, -15, 0],
              opacity: [0.2, 0.6, 0.2]
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay
            }}
          />
        ))}
        
        {/* Cosmic effects */}
        {Object.values(effects).map(effect => effect)}
        
        {/* 🌌 RANDOM COSMIC EVENTS */}
        {cosmicEvents}
        
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  if (titleName === 'Moment Collector') {
    const flashes = useMemo(() => Array.from({ length: 4 }, (_, i) => ({
      id: i,
      left: 15 + i * 25,
      top: 30 + (i % 2) * 20,
      delay: i * 0.6
    })), []);

    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Photo album gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, #a855f7 0%, #ec4899 100%)`,
          }}
        />
        
        {/* Photo frame texture */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-8 w-12 h-12 sm:w-16 sm:h-16 border-3 border-purple-200/60 rotate-12 rounded-sm" />
          <div className="absolute top-6 right-12 w-10 h-10 sm:w-14 sm:h-14 border-3 border-pink-200/60 -rotate-6 rounded-sm" />
          <div className="absolute bottom-8 left-1/3 w-14 h-14 sm:w-20 sm:h-20 border-3 border-purple-300/60 rotate-6 rounded-sm" />
          <div className="absolute bottom-6 right-1/4 w-8 h-8 sm:w-12 sm:h-12 border-3 border-pink-300/60 -rotate-12 rounded-sm" />
        </div>
        
        {/* Camera flash particles */}
        {flashes.map((f) => (
          <motion.div
            key={f.id}
            className="absolute text-lg sm:text-2xl opacity-0"
            style={{
              left: `${f.left}%`,
              top: `${f.top}%`
            }}
            animate={{ 
              scale: [0.5, 1.2, 0.5],
              opacity: [0, 0.7, 0]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: f.delay
            }}
          >
            ✨
          </motion.div>
        ))}
        
        {/* Cosmic effects */}
        {Object.values(effects).map(effect => effect)}
        
        {/* 🌌 RANDOM COSMIC EVENTS */}
        {cosmicEvents}
        
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  // ============================================================================
  // UNCOMMON TIER (13 titles): 🌟 NEXT-LEVEL COSMIC PHENOMENA
  // UNIQUE FEATURES: 3D Depth, Weather Effects, Lens Flares, Fluid Dynamics, Auroras
  // ============================================================================
  
  if (titleName === 'Golden Hour Guardian') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Animated time-of-day gradient transition */}
        <motion.div 
          className="absolute inset-0"
          animate={{
            background: [
              'linear-gradient(135deg, #FBBF24 0%, #EA580C 100%)',
              'linear-gradient(135deg, #F59E0B 0%, #DC2626 100%)',
              'linear-gradient(135deg, #FBBF24 0%, #EA580C 100%)'
            ]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        
        {/* PARALLAX LAYER 1 (Background) - Slow moving clouds */}
        <motion.div 
          className="absolute inset-0 opacity-30"
          animate={{ x: [0, -100, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`cloud-bg-${i}`}
              className="absolute rounded-full blur-2xl"
              style={{
                left: `${i * 25}%`,
                top: `${20 + (i % 3) * 15}%`,
                width: `${80 + i * 20}px`,
                height: `${40 + i * 10}px`,
                background: 'rgba(255, 255, 255, 0.2)'
              }}
            />
          ))}
        </motion.div>
        
        {/* PARALLAX LAYER 2 (Mid) - God rays with depth */}
        <div className="absolute inset-0 overflow-hidden" style={{ perspective: '1000px' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={`ray-${i}`}
              className="absolute top-0 left-1/2 origin-top"
              style={{
                width: '60px',
                height: '200%',
                background: `linear-gradient(to bottom, 
                  rgba(251, 191, 36, ${0.15 + (i % 3) * 0.05}), 
                  transparent 70%)`,
                transform: `rotate(${i * 15}deg) translateZ(${-50 + i * 10}px)`,
                transformStyle: 'preserve-3d',
              }}
              animate={{
                opacity: [0.3, 0.7, 0.3],
                scaleY: [0.95, 1.05, 0.95]
              }}
              transition={{
                duration: 5 + (i % 3),
                repeat: Infinity,
                delay: i * 0.3
              }}
            />
          ))}
        </div>
        
        {/* LENS FLARE EFFECT - Distinctive visual signature */}
        <motion.div
          className="absolute"
          style={{
            left: '70%',
            top: '20%',
          }}
          animate={{
            left: ['70%', '30%', '70%'],
            top: ['20%', '40%', '20%']
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          {/* Main flare */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-amber-400/40 blur-xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/60 blur-md" />
          </div>
          {/* Flare artifacts */}
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={`flare-${i}`}
              className="absolute rounded-full"
              style={{
                left: `${-40 - i * 30}px`,
                top: `${-10 + i * 15}px`,
                width: `${20 - i * 3}px`,
                height: `${20 - i * 3}px`,
                background: `rgba(251, 191, 36, ${0.4 - i * 0.08})`,
                filter: 'blur(4px)'
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{
                duration: 2 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </motion.div>
        
        {/* PARALLAX LAYER 3 (Foreground) - Fast floating embers with depth */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={`ember-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${(i * 11) % 100}%`,
              top: `${(i * 17) % 80}%`,
              width: `${3 + (i % 4)}px`,
              height: `${3 + (i % 4)}px`,
              background: i % 3 === 0 ? '#FEF3C7' : '#FCD34D',
              boxShadow: `0 0 ${8 + (i % 3) * 4}px rgba(251, 191, 36, 0.8)`,
              filter: 'blur(0.5px)'
            }}
            animate={{
              y: [0, -80, -150],
              x: [(i % 2 ? -10 : 10), (i % 2 ? -20 : 20), (i % 2 ? -30 : 30)],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.3]
            }}
            transition={{
              duration: 4 + (i % 3),
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeOut'
            }}
          />
        ))}
        
        {Object.values(effects).map(effect => effect)}
        {cosmicEvents}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  if (titleName === 'Neon Dreamer') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Electric cyan gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, #22D3EE 0%, #0284C7 100%)`,
          }}
        />
        
        {/* Neon grid lines */}
        <motion.div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(34, 211, 238, 0.3) 1px, transparent 1px),
              linear-gradient(180deg, rgba(34, 211, 238, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
          animate={{
            backgroundPosition: ['0px 0px', '40px 40px']
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
        
        {/* Electric sparks */}
        {Array.from({ length: 14 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-0.5 h-3 bg-cyan-300 rounded-full"
            style={{
              left: `${(i * 13) % 100}%`,
              top: `${(i * 19) % 80}%`,
              boxShadow: '0 0 8px rgba(34, 211, 238, 0.8)'
            }}
            animate={{
              scaleY: [0, 1.5, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              delay: i * 0.4,
              repeatDelay: 2
            }}
          />
        ))}
        
        {/* Glowing orbs */}
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={`orb-${i}`}
            className="absolute w-4 h-4 rounded-full bg-cyan-400"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
              boxShadow: '0 0 20px rgba(34, 211, 238, 0.8)'
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2 + (i % 2),
              repeat: Infinity,
              delay: i * 0.5
            }}
          />
        ))}
        
        {cosmicEvents}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  if (titleName === 'Surrealist') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Deep indigo gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, #818CF8 0%, #4F46E5 100%)`,
          }}
        />
        
        {/* Paint splatter effect */}
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${(i * 23) % 100}%`,
              top: `${(i * 31) % 80}%`,
              width: `${20 + (i % 3) * 15}px`,
              height: `${20 + (i % 3) * 15}px`,
              background: `rgba(129, 140, 248, ${0.2 + (i % 3) * 0.1})`
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 4 + (i % 3),
              repeat: Infinity,
              delay: i * 0.3
            }}
          />
        ))}
        
        {/* Swirling color ribbons */}
        <svg className="absolute inset-0 w-full h-full opacity-40">
          <motion.path
            d="M 0,50 Q 50,20 100,50 T 200,50"
            stroke="rgba(129, 140, 248, 0.5)"
            strokeWidth="2"
            fill="none"
            animate={{
              d: [
                "M 0,50 Q 50,20 100,50 T 200,50",
                "M 0,50 Q 50,80 100,50 T 200,50",
                "M 0,50 Q 50,20 100,50 T 200,50"
              ]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </svg>
        
        {cosmicEvents}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  if (titleName === 'Time Sculptor') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Teal marble gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)`,
          }}
        />
        
        {/* Marble veins */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255, 255, 255, 0.1) 20px, rgba(255, 255, 255, 0.1) 22px),
              repeating-linear-gradient(-45deg, transparent, transparent 25px, rgba(255, 255, 255, 0.05) 25px, rgba(255, 255, 255, 0.05) 27px)
            `
          }}
        />
        
        {/* Chiseling sparks */}
        {Array.from({ length: 9 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-teal-200 rounded-full"
            style={{
              left: `${20 + i * 10}%`,
              top: `${40 + (i % 3) * 15}%`,
              boxShadow: '0 0 6px rgba(20, 184, 166, 0.8)'
            }}
            animate={{
              scale: [0, 1.5, 0],
              opacity: [0, 1, 0],
              x: [0, Math.random() * 20 - 10, Math.random() * 30 - 15]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.4,
              repeatDelay: 1.5
            }}
          />
        ))}
        
        {cosmicEvents}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  if (titleName === 'Memory Broadcaster') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Rose pink gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, #FB7185 0%, #E11D48 100%)`,
          }}
        />
        
        {/* Radio wave rings */}
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-rose-300"
            style={{
              width: `${50 + i * 40}px`,
              height: `${50 + i * 40}px`,
            }}
            animate={{
              scale: [1, 2.5],
              opacity: [0.6, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.6,
              ease: 'easeOut'
            }}
          />
        ))}
        
        {/* Broadcasting signals */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={`signal-${i}`}
            className="absolute w-0.5 h-8"
            style={{
              left: `${(i * 11) % 100}%`,
              top: '50%',
              background: 'linear-gradient(to bottom, rgba(251, 113, 133, 0.8), transparent)',
              transformOrigin: 'top'
            }}
            animate={{
              scaleY: [0, 1, 0],
              opacity: [0, 0.8, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.15
            }}
          />
        ))}
        
        {cosmicEvents}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  if (titleName === 'Ritual Keeper') {
    const candles = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
      id: i,
      left: 15 + i * 15,
      height: 30 + (i % 3) * 10
    })), []);

    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Emerald green gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, #34D399 0%, #059669 100%)`,
          }}
        />
        
        {/* Candle flames */}
        {candles.map((candle) => (
          <div key={candle.id} className="absolute bottom-20" style={{ left: `${candle.left}%` }}>
            {/* Flame */}
            <motion.div
              className="w-3 h-6 bg-gradient-to-t from-emerald-400 via-emerald-300 to-emerald-200 rounded-full"
              animate={{
                scaleY: [1, 1.2, 0.9, 1],
                scaleX: [1, 0.9, 1.1, 1],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: candle.id * 0.1
              }}
            />
            {/* Glow */}
            <motion.div
              className="absolute -top-2 -left-2 w-7 h-10 bg-emerald-400 rounded-full blur-md"
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: candle.id * 0.1
              }}
            />
          </div>
        ))}
        
        {/* Floating embers */}
        {Array.from({ length: 11 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-emerald-300 rounded-full"
            style={{
              left: `${(i * 13) % 100}%`,
              bottom: '20%',
              boxShadow: '0 0 4px rgba(52, 211, 153, 0.8)'
            }}
            animate={{
              y: [0, -60],
              opacity: [0.8, 0],
              x: [0, (Math.random() - 0.5) * 20]
            }}
            transition={{
              duration: 3 + (i % 2),
              repeat: Infinity,
              delay: i * 0.5
            }}
          />
        ))}
        
        {cosmicEvents}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  if (titleName === 'Vault Starter') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Sky blue gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)`,
          }}
        />
        
        {/* Vault door mechanism */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <motion.div
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-blue-300"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <div className="absolute top-1/2 left-1/2 w-20 h-1 bg-blue-300 origin-left -translate-y-1/2" />
            <div className="absolute top-1/2 left-1/2 w-1 h-20 bg-blue-300 origin-top -translate-x-1/2" />
          </motion.div>
        </div>
        
        {/* Key sparkles */}
        {Array.from({ length: 9 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl"
            style={{
              left: `${(i * 17) % 100}%`,
              top: `${(i * 23) % 80}%`,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              rotate: [0, 180]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.5,
              repeatDelay: 1
            }}
          >
            🔑
          </motion.div>
        ))}
        
        {cosmicEvents}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  if (titleName === 'Multimedia Virtuoso') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Cyan-teal gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)`,
          }}
        />
        
        {/* Stage spotlights */}
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-0 w-20 sm:w-32 h-full"
            style={{
              left: `${15 + i * 25}%`,
              background: `linear-gradient(to bottom, rgba(6, 182, 212, 0.4), transparent)`,
              clipPath: 'polygon(40% 0%, 60% 0%, 70% 100%, 30% 100%)'
            }}
            animate={{
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.5
            }}
          />
        ))}
        
        {/* Media icons floating */}
        {['📸', '🎬', '🎵', '📝', '🎨', '🎭'].map((icon, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl opacity-70"
            style={{
              left: `${10 + i * 15}%`,
              top: `${30 + (i % 2) * 30}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, -10, 0]
            }}
            transition={{
              duration: 3 + (i % 2),
              repeat: Infinity,
              delay: i * 0.3
            }}
          >
            {icon}
          </motion.div>
        ))}
        
        {cosmicEvents}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  if (titleName === 'Word Painter') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Violet-indigo gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, #818CF8 0%, #6366F1 100%)`,
          }}
        />
        
        {/* Brush strokes */}
        <svg className="absolute inset-0 w-full h-full opacity-40">
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.path
              key={i}
              d={`M ${20 + i * 20},${30 + i * 10} Q ${50 + i * 15},${20 + i * 15} ${80 + i * 10},${40 + i * 10}`}
              stroke="rgba(129, 140, 248, 0.6)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: [0, 1, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: i * 0.6
              }}
            />
          ))}
        </svg>
        
        {/* Ink splatters */}
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${(i * 19) % 100}%`,
              top: `${(i * 27) % 80}%`,
              width: `${8 + (i % 3) * 6}px`,
              height: `${8 + (i % 3) * 6}px`,
              background: `rgba(99, 102, 241, ${0.3 + (i % 3) * 0.1})`
            }}
            animate={{
              scale: [0, 1.2, 1],
              opacity: [0, 0.7, 0.7]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.4,
              repeatDelay: 2
            }}
          />
        ))}
        
        {cosmicEvents}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  if (titleName === 'Frequency Keeper') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Pink-magenta gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, #F472B6 0%, #EC4899 100%)`,
          }}
        />
        
        {/* Radio frequency bars */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute bottom-20 w-3 bg-pink-300 rounded-t"
            style={{
              left: `${5 + i * 4.5}%`,
            }}
            animate={{
              height: [`${10 + Math.random() * 20}px`, `${30 + Math.random() * 40}px`, `${10 + Math.random() * 20}px`]
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.05
            }}
          />
        ))}
        
        {/* Sound wave particles */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={`wave-${i}`}
            className="absolute w-1.5 h-1.5 rounded-full bg-pink-200"
            style={{
              left: `${(i * 11) % 100}%`,
              top: '50%',
              boxShadow: '0 0 8px rgba(244, 114, 182, 0.6)'
            }}
            animate={{
              x: [0, 100],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
        
        {cosmicEvents}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  if (titleName === 'Quantum Scheduler') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Purple-violet gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)`,
          }}
        />
        
        {/* Quantum field grid */}
        <motion.div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              radial-gradient(circle, rgba(167, 139, 250, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: '30px 30px'
          }}
          animate={{
            backgroundPosition: ['0px 0px', '30px 30px']
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
        
        {/* Spinning particles (like atoms) */}
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-purple-300"
            style={{
              left: '50%',
              top: '50%',
              boxShadow: '0 0 10px rgba(167, 139, 250, 0.8)'
            }}
            animate={{
              x: [0, Math.cos((i * 2 * Math.PI) / 15) * 80, 0],
              y: [0, Math.sin((i * 2 * Math.PI) / 15) * 60, 0],
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
        
        {cosmicEvents}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  if (titleName === 'Community Weaver') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Warm rose-pink gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, #FB7185 0%, #E11D48 100%)`,
          }}
        />
        
        {/* Connection network */}
        <svg className="absolute inset-0 w-full h-full opacity-40">
          {Array.from({ length: 8 }).map((_, i) => (
            <React.Fragment key={i}>
              {/* Node */}
              <motion.circle
                cx={`${20 + (i % 4) * 25}%`}
                cy={`${30 + Math.floor(i / 4) * 40}%`}
                r="4"
                fill="rgba(251, 113, 133, 0.8)"
                animate={{
                  r: [4, 6, 4],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
              {/* Connection lines */}
              {i < 7 && (
                <motion.line
                  x1={`${20 + (i % 4) * 25}%`}
                  y1={`${30 + Math.floor(i / 4) * 40}%`}
                  x2={`${20 + ((i + 1) % 4) * 25}%`}
                  y2={`${30 + Math.floor((i + 1) / 4) * 40}%`}
                  stroke="rgba(251, 113, 133, 0.5)"
                  strokeWidth="2"
                  animate={{
                    opacity: [0.3, 0.7, 0.3]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.15
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </svg>
        
        {/* Pulse particles along connections */}
        {Array.from({ length: 13 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-rose-300"
            style={{
              left: `${(i * 11) % 100}%`,
              top: `${30 + (i % 3) * 20}%`,
              boxShadow: '0 0 8px rgba(251, 113, 133, 0.8)'
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.3
            }}
          />
        ))}
        
        {cosmicEvents}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  if (titleName === 'Echo Artisan') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Bright emerald gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, #34D399 0%, #10B981 100%)`,
          }}
        />
        
        {/* Water ripple rings */}
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-1/3 left-1/3 rounded-full border-2 border-emerald-300"
            style={{
              width: `${40 + i * 30}px`,
              height: `${40 + i * 30}px`,
              marginLeft: `-${20 + i * 15}px`,
              marginTop: `-${20 + i * 15}px`
            }}
            animate={{
              scale: [1, 2],
              opacity: [0.6, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'easeOut'
            }}
          />
        ))}
        
        {/* Water droplets */}
        {Array.from({ length: 14 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-emerald-200"
            style={{
              left: `${(i * 13) % 100}%`,
              top: `${20 + (i % 5) * 12}%`,
              boxShadow: '0 0 6px rgba(52, 211, 153, 0.8)'
            }}
            animate={{
              y: [0, 40],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.8]
            }}
            transition={{
              duration: 2 + (i % 3) * 0.5,
              repeat: Infinity,
              delay: i * 0.4
            }}
          />
        ))}
        
        {cosmicEvents}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  // ============================================================================
  // RARE TIER (7+ titles): Environmental Scenes + Energy Effects
  // ============================================================================
  
  if (titleName === 'Era Enthusiast') {
    const stars = useMemo(() => Array.from({ length: 25 }, (_, i) => ({
      id: i,
      top: Math.random() * 70,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2
    })), []);

    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Deep space nebula gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at bottom, #06b6d4 0%, #1e3a5f 40%, #0a0e27 100%)`,
          }}
        />
        
        {/* Animated grid floor */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1/2 opacity-20"
          style={{
            backgroundImage: `linear-gradient(0deg, transparent 24%, rgba(6, 182, 212, .3) 25%, rgba(6, 182, 212, .3) 26%, transparent 27%, transparent 74%, rgba(6, 182, 212, .3) 75%, rgba(6, 182, 212, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(6, 182, 212, .3) 25%, rgba(6, 182, 212, .3) 26%, transparent 27%, transparent 74%, rgba(6, 182, 212, .3) 75%, rgba(6, 182, 212, .3) 76%, transparent 77%, transparent)`,
            backgroundSize: '50px 50px',
            transform: 'perspective(500px) rotateX(60deg) translateY(100px)'
          }}
          animate={{ backgroundPosition: ['0px 0px', '0px 50px'] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Constellation stars */}
        <div className="absolute inset-0">
          {stars.map((s) => (
            <motion.div
              key={s.id}
              className="absolute w-1 h-1 bg-cyan-200 rounded-full"
              style={{
                top: `${s.top}%`,
                left: `${s.left}%`,
              }}
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: s.duration,
                repeat: Infinity,
                delay: s.delay
              }}
            />
          ))}
          
          {/* Connecting constellation lines */}
          <svg className="absolute inset-0 w-full h-full opacity-30">
            <motion.path
              d="M 20,30 L 40,25 L 60,35 L 80,20"
              stroke="rgba(6, 182, 212, 0.5)"
              strokeWidth="1"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          </svg>
        </div>
        
        {/* Cosmic effects */}
        {Object.values(effects).map(effect => effect)}
        
        {/* 🌌 RANDOM COSMIC EVENTS */}
        {cosmicEvents}
        
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  if (titleName === 'Story Curator') {
    const masks = useMemo(() => Array.from({ length: 3 }, (_, i) => ({
      id: i,
      left: 25 + i * 25,
      top: 40 + i * 5,
      delay: i * 1.3
    })), []);

    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Grand museum hall gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 100%, #b45309 0%, #7f1d1d 50%, #1a0505 100%)`,
          }}
        />
        
        {/* Velvet texture overlay */}
        <div 
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '4px 4px'
          }}
        />
        
        {/* Theater curtains at top - Enhanced */}
        <motion.div
          className="absolute top-0 left-0 w-full h-12"
          style={{
            background: 'linear-gradient(to bottom, #7f1d1d 0%, transparent 100%)',
            boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.5)'
          }}
        />
        <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-black/40 to-transparent" />
        <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-black/40 to-transparent" />
        
        {/* Spotlight beams - Volumetric */}
        <motion.div
          className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-[150%] opacity-20 pointer-events-none"
          style={{
            background: 'conic-gradient(from 180deg at 50% 0%, transparent 160deg, rgba(251, 191, 36, 0.4) 180deg, transparent 200deg)',
            filter: 'blur(20px)'
          }}
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Theater masks floating */}
        {masks.map((m) => (
          <motion.div
            key={m.id}
            className="absolute text-2xl sm:text-3xl opacity-0"
            style={{
              left: `${m.left}%`,
              top: `${m.top}%`,
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))'
            }}
            animate={{ 
              y: [0, -15, 0],
              opacity: [0, 0.6, 0],
              rotate: [-10, 10, -10]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              delay: m.delay
            }}
          >
            🎭
          </motion.div>
        ))}
        
        {/* Cosmic effects */}
        {Object.values(effects).map(effect => effect)}
        
        {/* 🌌 RANDOM COSMIC EVENTS */}
        {cosmicEvents}
        
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  if (titleName === 'Chronicler') {
    const ribbons = useMemo(() => Array.from({ length: 3 }, (_, i) => ({
      id: i,
      left: 30 + i * 20,
      background: i === 1 ? '#10b981' : '#059669',
      delay: i * 0.7
    })), []);

    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Ink-stained parchment gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, #064e3b 0%, #065f46 50%, #34d399 100%)`,
          }}
        />
        
        {/* Floating text fragments */}
        <div className="absolute inset-0 overflow-hidden opacity-10 font-serif">
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-white whitespace-nowrap"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                fontSize: `${Math.random() * 20 + 10}px`
              }}
              animate={{ y: -50, opacity: 0 }}
              transition={{ duration: 5 + Math.random() * 5, repeat: Infinity }}
            >
              {['Memories', 'Stories', 'Time', 'Legacy', 'Echoes'][i % 5]}
            </motion.div>
          ))}
        </div>
        
        {/* Book spine lines (vertical rules) */}
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-0 left-1/4 w-px h-full bg-green-800" />
          <div className="absolute top-0 left-1/2 w-2 h-full bg-black/20 blur-sm" /> {/* Spine shadow */}
          <div className="absolute top-0 left-3/4 w-px h-full bg-green-800" />
        </div>
        
        {/* Aged paper texture */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Bookmark ribbons */}
        {ribbons.map((r) => (
          <motion.div
            key={r.id}
            className="absolute w-1 sm:w-1.5 h-20 sm:h-32 opacity-30"
            style={{
              left: `${r.left}%`,
              top: 0,
              background: r.background
            }}
            animate={{ 
              y: [0, 5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: r.delay
            }}
          />
        ))}
        
        {/* Cosmic effects */}
        {Object.values(effects).map(effect => effect)}
        
        {/* 🌌 RANDOM COSMIC EVENTS */}
        {cosmicEvents}
        
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  if (titleName === 'Moment Harvester') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Golden harvest gradient - Richer */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, #78350f 0%, #b45309 40%, #f59e0b 100%)`, 
          }}
        />
        
        {/* Swaying Field of Dreams at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-24 overflow-hidden opacity-30 pointer-events-none">
           {Array.from({ length: 20 }).map((_, i) => (
             <motion.div
               key={i}
               className="absolute bottom-0 w-1 bg-yellow-500/50 rounded-t-full origin-bottom"
               style={{
                 left: `${i * 5}%`,
                 height: `${30 + Math.random() * 50}%`
               }}
               animate={{ rotate: [-5, 5, -5] }}
               transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}
             />
           ))}
        </div>
        
        {/* Agricultural/Field texture */}
         <div 
            className="absolute inset-0 opacity-20"
            style={{
                backgroundImage: `
                    repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(251, 191, 36, 0.1) 10px, rgba(251, 191, 36, 0.1) 12px)
                `,
            }}
        />
        
        {/* Sun rays from top - Enhanced */}
        <motion.div
            className="absolute -top-20 left-1/2 -translate-x-1/2 w-[150%] h-[150%] opacity-40 pointer-events-none"
            style={{
                background: 'conic-gradient(from 180deg at 50% 0%, transparent 150deg, rgba(255, 251, 235, 0.5) 180deg, transparent 210deg)'
            }}
            animate={{ rotate: [-10, 10, -10] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Cosmic effects */}
        {Object.values(effects).map(effect => effect)}
        
        {/* 🌌 RANDOM COSMIC EVENTS */}
        {cosmicEvents}
        
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  if (titleName === 'Eternal Witness') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Deep time vortex gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at center, #1e1b4b 0%, #312e81 60%, #000000 100%)`,
          }}
        />
        
        {/* Rotating clockwork texture */}
        <motion.div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `repeating-conic-gradient(rgba(255,255,255,0.1) 0deg 10deg, transparent 10deg 20deg)`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* The Eye of Time - Central glow */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-30"
          style={{ background: '#6366f1' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Cosmic effects */}
        {Object.values(effects).map(effect => effect)}
        
        {/* 🌌 RANDOM COSMIC EVENTS */}
        {cosmicEvents}
        
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  if (titleName === 'Master Archivist') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Deep digital void */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)`,
          }}
        />
        
        {/* Binary Overlay */}
        <div 
          className="absolute inset-0 opacity-10 font-mono text-[10px] leading-3 break-all overflow-hidden"
          style={{ color: '#818cf8' }}
        >
          {Array.from({ length: 400 }).map(() => Math.random() > 0.5 ? '1 ' : '0 ').join('')}
        </div>

        {/* Scanning line */}
        <motion.div
            className="absolute left-0 right-0 h-1 bg-indigo-400/50 shadow-[0_0_10px_#818cf8]"
            animate={{ top: ['0%', '100%'], opacity: [0, 1, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Cosmic effects */}
        {Object.values(effects).map(effect => effect)}
        
        {/* 🌌 RANDOM COSMIC EVENTS */}
        {cosmicEvents}
        
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }

  if (titleName === 'Keeper of Eras') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Crystalline Vault Gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 120%, #701a75 0%, #4a044e 50%, #1a0505 100%)`,
          }}
        />
        
        {/* Faceted Crystal Overlay */}
        <div className="absolute inset-0 opacity-20"
             style={{
                 backgroundImage: `linear-gradient(60deg, transparent 40%, rgba(255,255,255,0.1) 41%, transparent 42%), 
                                   linear-gradient(-60deg, transparent 40%, rgba(255,255,255,0.1) 41%, transparent 42%)`
             }}
        />
        
        {/* Cosmic effects */}
        {Object.values(effects).map(effect => effect)}
        
        {/* 🌌 RANDOM COSMIC EVENTS */}
        {cosmicEvents}
        
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }

  if (titleName === 'Social Connector' || titleName === 'Circle Builder') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Network Gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, #064e3b 0%, #065f46 100%)`,
          }}
        />
        
        {/* Grid Texture */}
        <div 
            className="absolute inset-0 opacity-10"
            style={{
                backgroundImage: `radial-gradient(circle, #34d399 1px, transparent 1px)`,
                backgroundSize: '20px 20px'
            }}
        />
        
        {/* Cosmic effects */}
        {Object.values(effects).map(effect => effect)}
        
        {/* 🌌 RANDOM COSMIC EVENTS */}
        {cosmicEvents}
        
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }

  if (titleName === 'Futurist') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Cyberpunk Gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0891b2 100%)`,
          }}
        />
        
        {/* Digital rain/lines */}
        <div className="absolute inset-0 opacity-20">
             <div className="absolute top-0 left-1/4 w-px h-full bg-cyan-400 blur-sm" />
             <div className="absolute top-0 right-1/4 w-px h-full bg-cyan-400 blur-sm" />
        </div>
        
        {/* Cosmic effects */}
        {Object.values(effects).map(effect => effect)}
        
        {/* 🌌 RANDOM COSMIC EVENTS */}
        {cosmicEvents}
        
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }

  if (titleName === 'Dream Weaver') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Dreamy Gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, #4f46e5 0%, #a5b4fc 50%, #e0e7ff 100%)`,
          }}
        />
        
        {/* Cosmic effects */}
        {Object.values(effects).map(effect => effect)}
        
        {/* 🌌 RANDOM COSMIC EVENTS */}
        {cosmicEvents}
        
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }

  if (titleName === 'Frequency Keeper') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Synthwave Gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, #be185d 0%, #831843 100%)`,
          }}
        />
        
        {/* Equalizer lines background */}
         <div 
            className="absolute inset-0 opacity-10"
            style={{
                backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 10px, #fbcfe8 10px, #fbcfe8 11px)`
            }}
        />
        
        {/* Cosmic effects */}
        {Object.values(effects).map(effect => effect)}
        
        {/* 🌌 RANDOM COSMIC EVENTS */}
        {cosmicEvents}
        
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }

  // ============================================================================
  // EPIC TIER (3+ titles): Cinematic Lighting + Premium Materials
  // ============================================================================
  
  if (titleName === 'Golden Hour Guardian') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Warm tapestry gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, #d97706 0%, #92400e 100%)`,
          }}
        />
        
        {/* Woven fabric texture */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(146, 64, 14, 0.2) 10px, rgba(146, 64, 14, 0.2) 11px),
              repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(217, 119, 6, 0.2) 10px, rgba(217, 119, 6, 0.2) 11px)
            `,
          }}
        />
        
        {/* Flowing thread animations */}
        <svg className="absolute inset-0 w-full h-full opacity-30">
          <motion.path
            d="M 0,30 Q 25,20 50,30 T 100,30"
            stroke="rgba(251, 191, 36, 0.6)"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.path
            d="M 0,50 Q 25,60 50,50 T 100,50"
            stroke="rgba(217, 119, 6, 0.6)"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 0] }}
            transition={{ duration: 4, delay: 1, repeat: Infinity }}
          />
          <motion.path
            d="M 0,70 Q 25,80 50,70 T 100,70"
            stroke="rgba(146, 64, 14, 0.6)"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 0] }}
            transition={{ duration: 4, delay: 2, repeat: Infinity }}
          />
        </svg>
        
        {/* Golden hour cinematic lighting */}
        <motion.div
          className="absolute top-0 right-0 w-64 h-full opacity-20"
          style={{
            background: 'radial-gradient(ellipse at top right, rgba(251, 191, 36, 0.5) 0%, transparent 60%)',
          }}
          animate={{ opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        
        {/* Cosmic effects */}
        {Object.values(effects).map(effect => effect)}
        
        {/* 🌌 RANDOM COSMIC EVENTS */}
        {cosmicEvents}
        
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  if (titleName === 'Legacy Forger') {
    const sparks = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: 20 + Math.random() * 60,
      x: (Math.random() - 0.5) * 40,
      delay: i * 0.3,
      duration: 1 + Math.random()
    })), []);

    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Molten metal gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, #450a0a 0%, #ea580c 50%, #dc2626 100%)`,
          }}
        />
        
        {/* Forge glow from bottom */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-32 opacity-40"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(234, 88, 12, 0.8) 100%)',
          }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Sparks flying */}
        {sparks.map((s) => (
          <motion.div
            key={s.id}
            className="absolute w-1 h-1 bg-orange-400 rounded-full"
            style={{
              left: `${s.left}%`,
              bottom: '20%'
            }}
            animate={{ 
              y: [-20, -60],
              x: [0, s.x],
              opacity: [1, 0],
              scale: [1, 0.3]
            }}
            transition={{
              duration: s.duration,
              repeat: Infinity,
              delay: s.delay
            }}
          />
        ))}
        
        {/* Metallic shimmer */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Cosmic effects */}
        {Object.values(effects).map(effect => effect)}
        
        {/* 🌌 RANDOM COSMIC EVENTS */}
        {cosmicEvents}
        
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  if (titleName === 'Audio Alchemist') {
    const waves = useMemo(() => Array.from({ length: 7 }, (_, i) => ({
      id: i,
      top: 15 + i * 12,
      duration: 1.5 + i * 0.2,
      delay: i * 0.15
    })), []);

    const notes = useMemo(() => ['🎵', '🎶', '🎵'].map((note, i) => ({
      id: i,
      note,
      left: 20 + i * 30,
      top: 30 + i * 10,
      delay: i * 1
    })), []);

    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Sound wave gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, #F472B6 0%, #E11D48 100%)`,
          }}
        />
        
        {/* Animated sound waves */}
        <div className="absolute inset-0 opacity-25">
          {waves.map((w) => (
            <motion.div
              key={w.id}
              className="absolute left-0 right-0 h-px bg-pink-200"
              style={{ top: `${w.top}%` }}
              animate={{ 
                scaleX: [1, 1.3, 1],
                opacity: [0.3, 0.7, 0.3]
              }}
              transition={{ 
                duration: w.duration, 
                repeat: Infinity,
                delay: w.delay 
              }}
            />
          ))}
        </div>
        
        {/* Music notes floating */}
        {notes.map((n) => (
          <motion.div
            key={n.id}
            className="absolute text-xl sm:text-3xl opacity-0"
            style={{
              left: `${n.left}%`,
              top: `${n.top}%`
            }}
            animate={{ 
              y: [0, -20, 0],
              opacity: [0, 0.6, 0],
              rotate: [0, 10, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: n.delay
            }}
          >
            {n.note}
          </motion.div>
        ))}
        
        {/* Cinematic rim lighting */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20"
          style={{
            background: 'radial-gradient(ellipse at top, rgba(251, 113, 133, 0.4) 0%, transparent 50%)',
          }}
        />
        
        {/* Cosmic effects */}
        {Object.values(effects).map(effect => effect)}
        
        {/* 🌌 RANDOM COSMIC EVENTS */}
        {cosmicEvents}
        
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  if (titleName === 'Echo Magnet') {
    const rings = useMemo(() => Array.from({ length: 4 }, (_, i) => ({
      id: i,
      scale: 2 + i * 0.5,
      delay: i * 0.7
    })), []);

    const bubbles = useMemo(() => Array.from({ length: 5 }, (_, i) => ({
      id: i,
      left: 15 + i * 18,
      top: 25 + (i % 2) * 30,
      delay: i * 0.5
    })), []);

    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Purple cosmic gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)`,
          }}
        />
        
        {/* Rippling echo rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          {rings.map((r) => (
            <motion.div
              key={r.id}
              className="absolute border-2 border-purple-300 rounded-full"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: r.scale, opacity: 0 }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                delay: r.delay
              }}
              style={{
                width: '100px',
                height: '100px'
              }}
            />
          ))}
        </div>
        
        {/* Comment bubbles */}
        {bubbles.map((b) => (
          <motion.div
            key={b.id}
            className="absolute text-lg sm:text-2xl opacity-0"
            style={{
              left: `${b.left}%`,
              top: `${b.top}%`
            }}
            animate={{ 
              scale: [0.8, 1.2, 0.8],
              opacity: [0, 0.5, 0]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: b.delay
            }}
          >
            💬
          </motion.div>
        ))}
        
        {/* Cosmic effects */}
        {Object.values(effects).map(effect => effect)}
        
        {/* 🌌 RANDOM COSMIC EVENTS */}
        {cosmicEvents}
        
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  // ============================================================================
  // LEGENDARY TIER: UNIQUE IMPLEMENTATIONS - Each title is completely distinct
  // ============================================================================
  
  // Memory Architect 🏛️ - Architectural blueprints with golden light
  if (titleName === 'Memory Architect') {
    const gridH = useMemo(() => Array.from({ length: 8 }, (_, i) => i), []);
    const gridV = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);
    const particles = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
      id: i,
      top: Math.random() * 70,
      left: Math.random() * 100,
      duration: 2 + Math.random(),
      delay: Math.random() * 2
    })), []);

    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #fef3c7 100%)' }} />
        
        {/* Blueprint grid */}
        <div className="absolute inset-0 opacity-15">
          <svg className="w-full h-full">
            {gridH.map((i) => (
              <line key={`h-${i}`} x1="0" y1={`${i * 12.5}%`} x2="100%" y2={`${i * 12.5}%`} stroke="#d97706" strokeWidth="0.5" />
            ))}
            {gridV.map((i) => (
              <line key={`v-${i}`} x1={`${i * 8.33}%`} y1="0" x2={`${i * 8.33}%`} y2="100%" stroke="#d97706" strokeWidth="0.5" />
            ))}
          </svg>
        </div>
        
        {/* Golden particles */}
        {particles.map((p) => (
          <motion.div key={p.id} className="absolute w-1 h-1 bg-amber-300 rounded-full"
            style={{ top: `${p.top}%`, left: `${p.left}%` }}
            animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.5, 1] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay }}
          />
        ))}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  // Chronicle Keeper 📜 - Ancient scroll with sepia tones
  if (titleName === 'Chronicle Keeper') {
    const drops = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
      id: i,
      top: 20 + i * 15,
      left: 15 + i * 12,
      duration: 3 + i * 0.5
    })), []);

    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #92400e 0%, #451a03 100%)' }} />
        
        {/* Aged paper texture */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent 18px, rgba(120, 53, 15, 0.2) 19px)`
        }} />
        
        {/* Ink drops */}
        {drops.map((d) => (
          <motion.div key={d.id} className="absolute w-2 h-2 bg-amber-900/40 rounded-full blur-sm"
            style={{ top: `${d.top}%`, left: `${d.left}%` }}
            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: d.duration, repeat: Infinity }}
          />
        ))}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  // Temporal Sovereign 👑 - Royal purple with gold crown motifs
  if (titleName === 'Temporal Sovereign') {
    const sparkles = useMemo(() => Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: 10 + i * 6,
      top: 30 + (i % 3) * 15,
      delay: i * 0.3
    })), []);

    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #fbbf24 100%)' }} />
        
        {/* Crown sparkles */}
        {sparkles.map((s) => (
          <motion.div key={s.id} className="absolute text-2xl opacity-0"
            style={{ left: `${s.left}%`, top: `${s.top}%` }}
            animate={{ opacity: [0, 0.7, 0], scale: [0.5, 1.2, 0.5], rotate: [0, 180, 360] }}
            transition={{ duration: 3, repeat: Infinity, delay: s.delay }}
          >
            ✨
          </motion.div>
        ))}
        
        {/* Royal vignette */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(124, 58, 237, 0.3) 100%)'
        }} />
        
        {/* Cosmic effects */}
        {Object.values(effects).map(effect => effect)}
        
        {/* 🌌 RANDOM COSMIC EVENTS */}
        {cosmicEvents}
        
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  // Grand Historian 📚 - Library with warm amber lighting
  if (titleName === 'Grand Historian') {
    const spines = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: i * 8,
      bg: i % 2 === 0 ? '#b45309' : '#92400e'
    })), []);

    const pages = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
      id: i,
      top: 25 + i * 8,
      left: 20 + (i % 2) * 40,
      duration: 2 + i * 0.3
    })), []);

    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #FBBF24 0%, #D97706 100%)' }} />
        
        {/* Book spines */}
        <div className="absolute inset-0 opacity-20">
          {spines.map((s) => (
            <div key={s.id} className="absolute h-full" style={{
              left: `${s.left}%`,
              width: '6px',
              background: s.bg
            }} />
          ))}
        </div>
        
        {/* Glowing pages */}
        {pages.map((p) => (
          <motion.div key={p.id} className="absolute w-16 h-1 bg-amber-200/40"
            style={{ top: `${p.top}%`, left: `${p.left}%` }}
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: p.duration, repeat: Infinity }}
          />
        ))}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  // Legend ⭐ - Cosmic supernova with fiery explosion
  if (titleName === 'Legend') {
    const rays = useMemo(() => Array.from({ length: 24 }, (_, i) => ({
      id: i,
      rotate: i * 15,
      delay: i * 0.05
    })), []);

    const stars = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
      id: i,
      top: Math.random() * 70,
      left: Math.random() * 100,
      duration: 1.5 + Math.random(),
      delay: Math.random() * 2
    })), []);

    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #DC2626 100%)' }} />
        
        {/* Supernova explosion */}
        {rays.map((r) => (
          <motion.div key={r.id} className="absolute w-1 h-8 bg-gradient-to-b from-yellow-200 to-transparent origin-bottom"
            style={{ 
              left: '50%', 
              top: '40%',
              transform: `rotate(${r.rotate}deg)`,
            }}
            animate={{ 
              scaleY: [0.5, 1.2, 0.5],
              opacity: [0.4, 0.9, 0.4]
            }}
            transition={{ duration: 2, repeat: Infinity, delay: r.delay }}
          />
        ))}
        
        {/* Star particles */}
        {stars.map((s) => (
          <motion.div key={s.id} className="absolute w-1 h-1 bg-amber-200 rounded-full"
            style={{ top: `${s.top}%`, left: `${s.left}%` }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [1, 2, 1] }}
            transition={{ duration: s.duration, repeat: Infinity, delay: s.delay }}
          />
        ))}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  // Time Lord ⌛ - Temporal vortex with purple/violet swirls
  if (titleName === 'Time Lord') {
    const vortex = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
      id: i,
      width: (i + 1) * 40,
      height: (i + 1) * 40
    })), []);

    const fragments = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
      id: i,
      left: 15 + i * 7,
      top: 25 + (i % 3) * 20,
      delay: i * 0.25
    })), []);

    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' }} />
        
        {/* Time vortex spiral */}
        <motion.div className="absolute inset-0 opacity-30"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          {vortex.map((v) => (
            <div key={v.id} className="absolute rounded-full border-2 border-purple-300/50"
              style={{
                left: '50%',
                top: '50%',
                width: `${v.width}px`,
                height: `${v.height}px`,
                transform: 'translate(-50%, -50%)'
              }}
            />
          ))}
        </motion.div>
        
        {/* Time fragments */}
        {fragments.map((f) => (
          <motion.div key={f.id} className="absolute text-lg opacity-0"
            style={{ left: `${f.left}%`, top: `${f.top}%` }}
            animate={{ opacity: [0, 0.6, 0], y: [0, -20, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: f.delay }}
          >
            ⏳
          </motion.div>
        ))}
        
        {/* Cosmic effects */}
        {Object.values(effects).map(effect => effect)}
        
        {/* 🌌 RANDOM COSMIC EVENTS */}
        {cosmicEvents}
        
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  // Archive Master 📦
  if (titleName === 'Archive Master') {
    const drawers = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
      id: i,
      top: 15 + i * 12,
      delay: i * 0.3
    })), []);

    const docs = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: 20 + i * 10,
      top: 30 + (i % 2) * 25,
      delay: i * 0.4
    })), []);

    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #818CF8 0%, #4F46E5 100%)' }} />
        
        {/* Filing cabinet drawers */}
        <div className="absolute inset-0 opacity-15">
          {drawers.map((d) => (
            <motion.div key={d.id} className="absolute left-0 right-0 h-px bg-indigo-300"
              style={{ top: `${d.top}%` }}
              animate={{ scaleX: [0.9, 1, 0.9] }}
              transition={{ duration: 2, repeat: Infinity, delay: d.delay }}
            />
          ))}
        </div>
        
        {/* Document icons */}
        {docs.map((d) => (
          <motion.div key={d.id} className="absolute text-xl opacity-0"
            style={{ left: `${d.left}%`, top: `${d.top}%` }}
            animate={{ opacity: [0, 0.5, 0], y: [0, -10, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: d.delay }}
          >
            📄
          </motion.div>
        ))}
        
        {/* Cosmic effects */}
        {Object.values(effects).map(effect => effect)}
        
        {/* 🌌 RANDOM COSMIC EVENTS */}
        {cosmicEvents}
        
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  // ============================================================================
  // LEGENDARY TIER - ULTIMATE HORIZONS 🌟
  // ============================================================================
  
  // Legend (500 capsules) - Dimensional Rift Portal
  if (titleName === 'Legend') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        <DimensionalRiftPortal colors={config.colors} isPreview={preview} />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  // Time Lord (capsules across 5+ years) - Hourglass Universe
  if (titleName === 'Time Lord') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        <HourglassUniverse colors={config.colors} isPreview={preview} />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  // Master Curator (100+ enhancements) - Golden Brushstroke Canvas
  if (titleName === 'Master Curator') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        <GoldenBrushstroke colors={config.colors} isPreview={preview} />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  // Archive Master (1,000 capsules) - Living Memory Tree
  if (titleName === 'Archive Master') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        <LivingMemoryTree colors={config.colors} isPreview={preview} />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  // Perfect Chronicler (30 consecutive days with media) - Precision Target Reticle
  if (titleName === 'Perfect Chronicler') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        <PrecisionTargetReticle colors={config.colors} isPreview={preview} />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  // Sevenfold Sage (777 capsules) - Seven Seals Mystical Unlock
  if (titleName === 'Sevenfold Sage') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        <SevenSealsMystical colors={config.colors} isPreview={preview} />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  // Fallback for any other legendary titles
  if (titleRarity === 'legendary') {
    const legendaryGradient = config.colors.length >= 2 
      ? `linear-gradient(135deg, ${config.colors[0]} 0%, ${config.colors[1]} 100%)`
      : 'linear-gradient(135deg, #f59e0b 0%, #fef3c7 100%)';
    
    const stars = useMemo(() => Array.from({ length: 25 }, (_, i) => ({
      id: i,
      top: Math.random() * 70,
      left: Math.random() * 100,
      duration: 2 + Math.random(),
      delay: Math.random() * 2
    })), []);

    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        <div className="absolute inset-0" style={{ background: legendaryGradient }} />
        
        {/* Simple cosmic stars */}
        {stars.map((s) => (
          <motion.div key={s.id} className="absolute w-1 h-1 bg-white/60 rounded-full"
            style={{ top: `${s.top}%`, left: `${s.left}%` }}
            animate={{ opacity: [0.3, 0.9, 0.3], scale: [1, 1.5, 1] }}
            transition={{ duration: s.duration, repeat: Infinity, delay: s.delay }}
          />
        ))}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  // ============================================================================
  // FALLBACK: Default elegant gradient with FULL EFFECTS for any unmapped titles
  // ============================================================================
  
  return (
    <motion.div 
      className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      style={performanceStyle}
    >
      {/* Base gradient using config colors */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${config.colors[0]} 0%, ${config.colors[1]} 100%)`,
        }}
      />
      
      {/* 🌌 RENDER ALL COSMIC EFFECTS */}
      {Object.values(effects).map(effect => effect)}
      
      {/* 🌌 RANDOM COSMIC EVENTS */}
      {cosmicEvents}
      
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
    </motion.div>
  );
}
