import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getHorizonEffects } from '../utils/horizonEffects';
import { getTitleConfig } from '../utils/titleConfigs';
import { useIsMobile } from './ui/use-mobile';

interface HorizonActivationSequenceProps {
  isActivating: boolean;
  oldTitle: { name: string; rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'; colors: string[] } | null;
  newTitle: { name: string; rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'; colors: string[] };
  onComplete: () => void;
}

type Phase = 'zoom-out' | 'sunset' | 'travel' | 'sunrise' | 'celebration' | 'complete';

/**
 * 🌅 HORIZON ACTIVATION SEQUENCE - ULTRA EPIC EDITION
 * 
 * MASSIVE cinematic transition when activating a new horizon
 * Phases: Zoom Out → Sunset → CHAOS TRAVEL → EXPLOSIVE Sunrise → INSANE Celebration
 * Total duration: ~4.5s of PURE SPECTACLE
 * 
 * ⚡ PERFORMANCE OPTIMIZED:
 * - Adaptive particle counts based on device (75% reduction on mobile)
 * - GPU-accelerated animations with will-change hints
 * - Hardware-accelerated transforms only
 */
export function HorizonActivationSequence({ 
  isActivating, 
  oldTitle, 
  newTitle, 
  onComplete 
}: HorizonActivationSequenceProps) {
  const [phase, setPhase] = useState<Phase>('zoom-out');
  const isMobile = useIsMobile();
  
  // ⚡ PERFORMANCE: Adaptive particle counts based on device
  const particleCounts = {
    stars: isMobile ? 8 : 20,           // 60% reduction on mobile
    oldParticles: isMobile ? 25 : 100,  // 75% reduction on mobile
    waves: isMobile ? 3 : 5,            // 40% reduction on mobile
    newParticles: isMobile ? 30 : 120,  // 75% reduction on mobile
    meteors: isMobile ? 5 : 15,         // 67% reduction on mobile
    spirals: isMobile ? 4 : 8,          // 50% reduction on mobile
    streaks: isMobile ? 8 : 20,         // 60% reduction on mobile
    commonSparkles: isMobile ? 15 : 30, // 50% reduction on mobile
    commonConfetti: isMobile ? 20 : 40, // 50% reduction on mobile
    uncommonRipples: isMobile ? 3 : 6,  // 50% reduction on mobile
    uncommonRing: isMobile ? 12 : 24,   // 50% reduction on mobile
    rareStars: isMobile ? 25 : 50,      // 50% reduction on mobile
    rareLightning: isMobile ? 4 : 8,    // 50% reduction on mobile
    epicRays: isMobile ? 8 : 16,        // 50% reduction on mobile
    epicEnergy: isMobile ? 3 : 5,       // 40% reduction on mobile
    epicParticles: isMobile ? 40 : 80,  // 50% reduction on mobile
    legendaryNova: isMobile ? 24 : 48,  // 50% reduction on mobile
    legendaryGalaxy: isMobile ? 3 : 6,  // 50% reduction on mobile
    legendaryBurst: isMobile ? 75 : 150 // 50% reduction on mobile
  };
  
  // Phase timing (in ms) - Extended for more drama
  const phaseDurations = {
    'zoom-out': 600,
    'sunset': 900,
    'travel': 1400,
    'sunrise': 900,
    'celebration': 700
  };

  // Auto-advance through phases
  useEffect(() => {
    if (!isActivating) return;

    const phases: Phase[] = ['zoom-out', 'sunset', 'travel', 'sunrise', 'celebration', 'complete'];
    let currentIndex = 0;

    const advancePhase = () => {
      currentIndex++;
      if (currentIndex >= phases.length) {
        onComplete();
        return;
      }
      setPhase(phases[currentIndex]);
      const nextDuration = phaseDurations[phases[currentIndex] as keyof typeof phaseDurations];
      if (nextDuration) {
        setTimeout(advancePhase, nextDuration);
      }
    };

    const initialDuration = phaseDurations[phases[0]];
    const timer = setTimeout(advancePhase, initialDuration);

    return () => clearTimeout(timer);
  }, [isActivating]);

  // Reset phase when activation starts
  useEffect(() => {
    if (isActivating) {
      setPhase('zoom-out');
    }
  }, [isActivating]);

  if (!isActivating) return null;

  const newConfig = getTitleConfig(newTitle.name);
  const newEffects = getHorizonEffects(newTitle.name, newTitle.rarity, newConfig.colors, 'transition');

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] overflow-hidden"
        style={{
          contain: 'layout style paint', // ⚡ Isolate from rest of page
          isolation: 'isolate',           // ⚡ Create new stacking context
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* PHASE 1: ZOOM OUT */}
        {phase === 'zoom-out' && oldTitle && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${oldTitle.colors[0]}, ${oldTitle.colors[1]})`,
              willChange: 'transform, opacity', // ⚡ GPU acceleration hint
            }}
            initial={{ scale: 1 }}
            animate={{ scale: 0.3, opacity: 0.8 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            {/* Old horizon shrinking into distance */}
            <motion.div
              className="text-center"
              style={{ willChange: 'opacity' }} // ⚡ GPU acceleration
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div className="text-6xl mb-4">{getTitleConfig(oldTitle.name).icon}</div>
              <h2 className="text-2xl text-white">{oldTitle.name}</h2>
            </motion.div>
          </motion.div>
        )}

        {/* PHASE 2: SUNSET */}
        {phase === 'sunset' && oldTitle && (
          <motion.div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${oldTitle.colors[0]}, ${oldTitle.colors[1]})`,
              willChange: 'opacity, filter', // ⚡ GPU acceleration hint
            }}
            initial={{ opacity: 1, filter: 'brightness(1)' }}
            animate={{ opacity: 0.3, filter: 'brightness(0.3) saturate(0.3)' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {/* Stars fading out */}
            {[...Array(particleCounts.stars)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  willChange: 'transform, opacity', // ⚡ GPU acceleration
                }}
                initial={{ opacity: 0.6, scale: 1 }}
                animate={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.8, delay: i * 0.03 }}
              />
            ))}
          </motion.div>
        )}

        {/* PHASE 3: TWILIGHT TRAVEL - ULTRA CHAOS MODE */}
        {phase === 'travel' && (
          <div className="absolute inset-0">
            {/* Deep space background with screen shake */}
            <motion.div
              className="absolute inset-0 bg-slate-950"
              style={{ willChange: 'transform, opacity' }} // ⚡ GPU acceleration
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: 1,
                x: [0, -5, 5, -5, 5, 0],
                y: [0, 5, -5, 5, -5, 0]
              }}
              transition={{ 
                opacity: { duration: 0.3 },
                x: { duration: 1.4, times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
                y: { duration: 1.4, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }
              }}
            />

            {/* MASSIVE particle explosion from old horizon - 3x more particles */}
            {oldTitle && [...Array(particleCounts.oldParticles)].map((_, i) => (
              <motion.div
                key={`old-${i}`}
                className="absolute rounded-full"
                style={{
                  width: `${Math.random() * 6 + 2}px`,
                  height: `${Math.random() * 6 + 2}px`,
                  background: i % 3 === 0 ? oldTitle.colors[0] : oldTitle.colors[1] || oldTitle.colors[0],
                  left: '50%',
                  top: '50%',
                  boxShadow: `0 0 ${10 + Math.random() * 20}px ${oldTitle.colors[i % 2]}`,
                  willChange: 'transform, opacity', // ⚡ GPU acceleration
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: (Math.random() - 0.5) * 1200,
                  y: (Math.random() - 0.5) * 1200,
                  opacity: 0,
                  scale: [1, Math.random() * 3, 0],
                  rotate: Math.random() * 720
                }}
                transition={{ duration: 1.4, ease: 'easeOut', delay: i * 0.005 }}
              />
            ))}

            {/* Rainbow color waves transitioning */}
            {[...Array(particleCounts.waves)].map((_, i) => (
              <motion.div
                key={`wave-${i}`}
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(circle at ${50 + i * 10}% ${50 - i * 10}%, ${
                    ['#ff0080', '#7928ca', '#0070f3', '#00dfd8', '#7cf'][ i % 5]
                  }40, transparent 60%)`,
                  willChange: 'transform, opacity', // ⚡ GPU acceleration
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 0.6, 0],
                  scale: [0, 2, 3]
                }}
                transition={{ duration: 1.2, delay: i * 0.15 }}
              />
            ))}

            {/* EXPLOSION flash from center */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at center, ${newTitle.colors[0]}FF, ${newTitle.colors[1] || newTitle.colors[0]}80, transparent 70%)`,
                willChange: 'transform, opacity', // ⚡ GPU acceleration
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 3, 5]
              }}
              transition={{ duration: 0.6, delay: 0.2 }}
            />

            {/* New horizon particles appearing - WAY MORE */}
            {[...Array(particleCounts.newParticles)].map((_, i) => (
              <motion.div
                key={`new-${i}`}
                className="absolute rounded-full"
                style={{
                  width: `${Math.random() * 4 + 1}px`,
                  height: `${Math.random() * 4 + 1}px`,
                  background: i % 2 === 0 ? newTitle.colors[0] : newTitle.colors[1] || newTitle.colors[0],
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  boxShadow: `0 0 ${8 + Math.random() * 12}px ${newTitle.colors[i % 2]}`,
                  willChange: 'transform, opacity', // ⚡ GPU acceleration
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 1, 0.8],
                  scale: [0, 2, 1],
                  rotate: [0, 360]
                }}
                transition={{ duration: 1, delay: 0.4 + i * 0.008 }}
              />
            ))}

            {/* METEOR SHOWER - way more shooting stars */}
            {[...Array(particleCounts.meteors)].map((_, i) => (
              <motion.div
                key={`shooting-${i}`}
                className="absolute h-1 rounded-full"
                style={{
                  left: `${Math.random() * 80}%`,
                  top: `${Math.random() * 80}%`,
                  width: `${80 + Math.random() * 100}px`,
                  background: `linear-gradient(90deg, transparent, ${
                    i % 3 === 0 ? '#fff' : i % 3 === 1 ? newTitle.colors[0] : newTitle.colors[1] || newTitle.colors[0]
                  }, transparent)`,
                  boxShadow: `0 0 15px ${newTitle.colors[0]}, 0 0 30px ${newTitle.colors[1] || newTitle.colors[0]}`,
                  willChange: 'transform, opacity', // ⚡ GPU acceleration
                }}
                initial={{ x: 0, y: 0, opacity: 0, scaleX: 0 }}
                animate={{
                  x: 400 + Math.random() * 200,
                  y: 400 + Math.random() * 200,
                  opacity: [0, 1, 0],
                  scaleX: [0, 1, 0.5]
                }}
                transition={{ duration: 0.8, delay: 0.3 + i * 0.08, ease: 'easeOut' }}
              />
            ))}

            {/* Cosmic spiral vortex */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              style={{ willChange: 'transform, opacity' }} // ⚡ GPU acceleration
              initial={{ opacity: 0, rotate: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 0.4, 0],
                rotate: 720,
                scale: [0, 2, 3]
              }}
              transition={{ duration: 1.4 }}
            >
              {[...Array(particleCounts.spirals)].map((_, i) => (
                <motion.div
                  key={`spiral-${i}`}
                  className="absolute w-32 h-1"
                  style={{
                    background: `linear-gradient(90deg, ${newTitle.colors[0]}, transparent)`,
                    transformOrigin: '0% 50%',
                    transform: `rotate(${i * 45}deg)`,
                    willChange: 'transform', // ⚡ GPU acceleration
                  }}
                  animate={{
                    scaleX: [0, 1.5, 0]
                  }}
                  transition={{ duration: 1.2, delay: i * 0.05 }}
                />
              ))}
            </motion.div>

            {/* Light speed streaks */}
            {[...Array(particleCounts.streaks)].map((_, i) => (
              <motion.div
                key={`streak-${i}`}
                className="absolute w-1 rounded-full"
                style={{
                  left: `${50 + (Math.random() - 0.5) * 60}%`,
                  top: `${50 + (Math.random() - 0.5) * 60}%`,
                  height: '200px',
                  background: `linear-gradient(to bottom, ${newTitle.colors[i % 2]}, transparent)`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                  boxShadow: `0 0 10px ${newTitle.colors[i % 2]}`,
                  willChange: 'transform, opacity', // ⚡ GPU acceleration
                }}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{
                  scaleY: [0, 1.5, 0],
                  opacity: [0, 0.8, 0]
                }}
                transition={{ duration: 0.8, delay: 0.4 + i * 0.03 }}
              />
            ))}

            {/* Color morph supernova center */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at center, ${newTitle.colors[0]}40, ${newTitle.colors[1] || newTitle.colors[0]}20, transparent 70%)`,
                willChange: 'transform, opacity', // ⚡ GPU acceleration
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0, 1, 1],
                scale: [0, 1.5, 2.5]
              }}
              transition={{ duration: 1.4 }}
            />
          </div>
        )}

        {/* PHASE 4: SUNRISE */}
        {phase === 'sunrise' && (
          <motion.div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${newTitle.colors[0]}, ${newTitle.colors[1]})`,
              willChange: 'opacity, filter', // ⚡ GPU acceleration
            }}
            initial={{ opacity: 0, filter: 'brightness(0.2)' }}
            animate={{ opacity: 1, filter: 'brightness(1)' }}
            transition={{ duration: 0.8, ease: 'easeIn' }}
          >
            {/* Star burst - all stars twinkle on */}
            {newEffects.starField}

            {/* New horizon title emerging */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              style={{ willChange: 'transform, opacity' }} // ⚡ GPU acceleration
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="text-center">
                <motion.div
                  className="text-8xl mb-6"
                  style={{ willChange: 'transform' }} // ⚡ GPU acceleration
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
                >
                  {newConfig.icon}
                </motion.div>
                <motion.h2
                  className="text-3xl font-bold text-white drop-shadow-lg"
                  style={{ willChange: 'transform, opacity' }} // ⚡ GPU acceleration
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  {newTitle.name}
                </motion.h2>
              </div>
            </motion.div>

            {/* Particles swirling into formation */}
            {newEffects.particles}
            {newEffects.ambientGlow}
          </motion.div>
        )}

        {/* PHASE 5: CELEBRATION - ULTRA RARITY-BASED FINALE */}
        {phase === 'celebration' && (
          <motion.div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${newTitle.colors[0]}, ${newTitle.colors[1]})`
            }}
          >
            {/* Common: BIGGER sparkle wave with colors */}
            {newTitle.rarity === 'common' && (
              <div>
                {/* Sparkle wave */}
                {[...Array(particleCounts.commonSparkles)].map((_, i) => (
                  <motion.div
                    key={`sparkle-${i}`}
                    className="absolute text-4xl"
                    style={{
                      left: `${(i * 3.5) % 100}%`,
                      top: `${40 + Math.sin(i * 0.5) * 20}%`,
                      filter: `hue-rotate(${i * 12}deg)`
                    }}
                    initial={{ opacity: 0, y: 0, scale: 0 }}
                    animate={{ 
                      opacity: [0, 1, 0.8, 0],
                      y: -80,
                      scale: [0, 1.5, 1, 0.5],
                      rotate: [0, 360]
                    }}
                    transition={{ duration: 0.7, delay: i * 0.02 }}
                  >
                    ✨
                  </motion.div>
                ))}
                {/* Confetti burst */}
                {[...Array(particleCounts.commonConfetti)].map((_, i) => (
                  <motion.div
                    key={`confetti-${i}`}
                    className="absolute w-2 h-2 rounded-sm"
                    style={{
                      background: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'][i % 4],
                      left: '50%',
                      top: '30%'
                    }}
                    initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                    animate={{
                      x: (Math.random() - 0.5) * 600,
                      y: Math.random() * 400,
                      opacity: 0,
                      rotate: Math.random() * 720
                    }}
                    transition={{ duration: 0.8, delay: i * 0.01 }}
                  />
                ))}
              </div>
            )}

            {/* Uncommon: MASSIVE ripple shockwave */}
            {newTitle.rarity === 'uncommon' && (
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Multiple colored ripples */}
                {[...Array(particleCounts.uncommonRipples)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute border-8 rounded-full"
                    style={{
                      borderColor: i % 2 === 0 ? newTitle.colors[0] : newTitle.colors[1] || newTitle.colors[0],
                      width: '80px',
                      height: '80px',
                      boxShadow: `0 0 30px ${newTitle.colors[0]}, 0 0 60px ${newTitle.colors[1] || newTitle.colors[0]}`
                    }}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ 
                      scale: 5 + i * 0.5,
                      opacity: 0,
                      borderWidth: i % 2 === 0 ? 2 : 8
                    }}
                    transition={{ duration: 0.9, delay: i * 0.08, ease: 'easeOut' }}
                  />
                ))}
                {/* Particle ring explosion */}
                {[...Array(particleCounts.uncommonRing)].map((_, i) => (
                  <motion.div
                    key={`ring-${i}`}
                    className="absolute w-3 h-3 rounded-full"
                    style={{
                      background: newTitle.colors[i % 2],
                      boxShadow: `0 0 15px ${newTitle.colors[i % 2]}`
                    }}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                    animate={{
                      x: Math.cos(i * 15 * Math.PI / 180) * 300,
                      y: Math.sin(i * 15 * Math.PI / 180) * 300,
                      opacity: 0,
                      scale: [0, 2, 0]
                    }}
                    transition={{ duration: 0.7, delay: i * 0.02 }}
                  />
                ))}
              </div>
            )}

            {/* Rare: EXPLOSIVE constellation with lightning */}
            {newTitle.rarity === 'rare' && (
              <div>
                {/* Constellation stars burst */}
                {[...Array(particleCounts.rareStars)].map((_, i) => (
                  <motion.div
                    key={`star-${i}`}
                    className="absolute rounded-full"
                    style={{
                      width: `${Math.random() * 6 + 2}px`,
                      height: `${Math.random() * 6 + 2}px`,
                      background: '#fff',
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      boxShadow: `0 0 ${15 + Math.random() * 30}px ${newTitle.colors[0]}, 0 0 ${30 + Math.random() * 40}px ${newTitle.colors[1] || newTitle.colors[0]}`
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0.8, 0],
                      scale: [0, 3, 2, 0],
                      rotate: [0, 180]
                    }}
                    transition={{ duration: 0.6, delay: i * 0.008 }}
                  />
                ))}
                {/* Lightning bolts */}
                {[...Array(particleCounts.rareLightning)].map((_, i) => (
                  <motion.div
                    key={`lightning-${i}`}
                    className="absolute w-1 bg-white"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: 0,
                      height: `${Math.random() * 60 + 40}%`,
                      boxShadow: `0 0 20px ${newTitle.colors[0]}`,
                      transform: `rotate(${(Math.random() - 0.5) * 30}deg)`
                    }}
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{
                      scaleY: [0, 1, 1, 0],
                      opacity: [0, 1, 0.8, 0]
                    }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                  />
                ))}
              </div>
            )}

            {/* Epic: INSANE cosmic ray explosion */}
            {newTitle.rarity === 'epic' && (
              <div>
                {/* Massive ray beams */}
                {[...Array(particleCounts.epicRays)].map((_, i) => (
                  <motion.div
                    key={`ray-${i}`}
                    className="absolute h-full origin-bottom"
                    style={{
                      left: '50%',
                      bottom: 0,
                      width: '24px',
                      background: `linear-gradient(to top, ${newTitle.colors[0]}, ${newTitle.colors[1] || newTitle.colors[0]}, transparent)`,
                      transform: `rotate(${i * 22.5}deg)`,
                      boxShadow: `0 0 40px ${newTitle.colors[0]}, 0 0 80px ${newTitle.colors[1] || newTitle.colors[0]}`,
                      filter: 'blur(6px)'
                    }}
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{ 
                      scaleY: [0, 1.5, 1, 0],
                      opacity: [0, 1, 0.8, 0]
                    }}
                    transition={{ duration: 0.7, delay: i * 0.02 }}
                  />
                ))}
                {/* Energy rings */}
                {[...Array(particleCounts.epicEnergy)].map((_, i) => (
                  <motion.div
                    key={`energy-${i}`}
                    className="absolute border-4 rounded-full"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: '100px',
                      height: '100px',
                      transform: 'translate(-50%, -50%)',
                      borderColor: i % 2 === 0 ? newTitle.colors[0] : newTitle.colors[1] || newTitle.colors[0],
                      boxShadow: `0 0 30px ${newTitle.colors[i % 2]}, inset 0 0 30px ${newTitle.colors[i % 2]}`
                    }}
                    initial={{ scale: 0, opacity: 1, rotate: 0 }}
                    animate={{
                      scale: 8 + i * 2,
                      opacity: 0,
                      rotate: 360
                    }}
                    transition={{ duration: 0.8, delay: i * 0.08 }}
                  />
                ))}
                {/* Particle fountain */}
                {[...Array(particleCounts.epicParticles)].map((_, i) => (
                  <motion.div
                    key={`particle-${i}`}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      background: [newTitle.colors[0], newTitle.colors[1] || newTitle.colors[0], '#fff'][i % 3],
                      left: '50%',
                      top: '50%',
                      boxShadow: `0 0 15px ${newTitle.colors[i % 2]}`
                    }}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                    animate={{
                      x: (Math.random() - 0.5) * 800,
                      y: -Math.random() * 400,
                      opacity: 0,
                      scale: [0, 2, 0]
                    }}
                    transition={{ duration: 0.9, delay: i * 0.005 }}
                  />
                ))}
              </div>
            )}

            {/* Legendary: ABSOLUTELY INSANE SUPERNOVA + Everything */}
            {newTitle.rarity === 'legendary' && (
              <div>
                {/* White flash impact */}
                <motion.div
                  className="absolute inset-0 bg-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.8, 0] }}
                  transition={{ duration: 0.3 }}
                />
                
                {/* MASSIVE supernova explosion */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {[...Array(particleCounts.legendaryNova)].map((_, i) => (
                    <motion.div
                      key={`nova-${i}`}
                      className="absolute origin-bottom"
                      style={{
                        left: '50%',
                        top: '50%',
                        width: '6px',
                        height: '150px',
                        background: `linear-gradient(to top, ${newTitle.colors[0]}, ${newTitle.colors[1] || newTitle.colors[0]}, #fff, transparent)`,
                        transform: `rotate(${i * 7.5}deg)`,
                        boxShadow: `0 0 30px ${newTitle.colors[0]}, 0 0 60px ${newTitle.colors[1] || newTitle.colors[0]}`
                      }}
                      initial={{ scaleY: 0, opacity: 0 }}
                      animate={{
                        scaleY: [0, 2.5, 1.5, 0],
                        opacity: [0, 1, 0.8, 0]
                      }}
                      transition={{ duration: 0.8, delay: i * 0.003 }}
                    />
                  ))}
                </motion.div>

                {/* Aurora waves */}
                {newEffects.aurora}
                
                {/* Rainbow spiral galaxy */}
                {[...Array(particleCounts.legendaryGalaxy)].map((_, i) => (
                  <motion.div
                    key={`galaxy-${i}`}
                    className="absolute inset-0"
                    style={{
                      background: `conic-gradient(from ${i * 60}deg, ${
                        ['#ff0080', '#7928ca', '#0070f3', '#00dfd8', newTitle.colors[0], newTitle.colors[1] || newTitle.colors[0]]
                      [i % 6]}40, transparent)`
                    }}
                    initial={{ opacity: 0, rotate: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 0.6, 0],
                      rotate: 360,
                      scale: [0, 2, 3]
                    }}
                    transition={{ duration: 0.9, delay: i * 0.08 }}
                  />
                ))}

                {/* MASSIVE particle burst - 150 particles */}
                {[...Array(particleCounts.legendaryBurst)].map((_, i) => (
                  <motion.div
                    key={`particle-${i}`}
                    className="absolute rounded-full"
                    style={{
                      width: `${Math.random() * 4 + 2}px`,
                      height: `${Math.random() * 4 + 2}px`,
                      background: [newTitle.colors[0], newTitle.colors[1] || newTitle.colors[0], '#fff', '#ff0080', '#7928ca'][i % 5],
                      left: '50%',
                      top: '50%',
                      boxShadow: `0 0 ${10 + Math.random() * 20}px ${newTitle.colors[i % 2]}`
                    }}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                    animate={{
                      x: (Math.random() - 0.5) * 1200,
                      y: (Math.random() - 0.5) * 1200,
                      opacity: 0,
                      scale: [0, 3, 0],
                      rotate: Math.random() * 720
                    }}
                    transition={{ duration: 1, delay: i * 0.002, ease: 'easeOut' }}
                  />
                ))}

                {/* Star explosions across screen */}
                {[...Array(30)].map((_, i) => (
                  <motion.div
                    key={`starburst-${i}`}
                    className="absolute text-6xl"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`
                    }}
                    initial={{ opacity: 0, scale: 0, rotate: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 2, 0],
                      rotate: 360
                    }}
                    transition={{ duration: 0.6, delay: i * 0.02 }}
                  >
                    ⭐
                  </motion.div>
                ))}
              </div>
            )}

            {/* Title display during celebration with pulse */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 1 }}
              animate={{ 
                opacity: 1,
                scale: [1, 1.05, 1]
              }}
              transition={{
                scale: { duration: 0.7, repeat: 1 }
              }}
            >
              <div className="text-center">
                <motion.div 
                  className="text-8xl mb-6"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 0.6 }}
                >
                  {newConfig.icon}
                </motion.div>
                <h2 className="text-3xl font-bold text-white drop-shadow-lg">{newTitle.name}</h2>
              </div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}