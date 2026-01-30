import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface PrecisionTargetReticleProps {
  colors: string[];
  isPreview?: boolean;
}

/**
 * 🎯 PRECISION TARGET RETICLE - Perfect Chronicler Achievement
 * Military sniper scope with HUD and lock-on targeting system
 * Features: Crosshair, targeting rings, scanning lines, lock acquisition, HUD elements
 */
export function PrecisionTargetReticle({ colors, isPreview = false }: PrecisionTargetReticleProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [lockAcquired, setLockAcquired] = useState(false);

  // Lock acquisition sequence every 5 seconds
  useEffect(() => {
    if (isPreview) return;
    const interval = setInterval(() => {
      setLockAcquired(true);
      setTimeout(() => setLockAcquired(false), 1500);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPreview]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-black/20">
      {/* Thermal gradient background */}
      <motion.div 
        className="absolute inset-0"
        animate={{
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          background: `radial-gradient(circle at center, ${colors[0]}15 0%, ${colors[1]}10 50%, transparent 80%)`
        }}
      />

      {/* Concentric targeting rings */}
      {[1, 2, 3, 4, 5].map(i => (
        <motion.div
          key={`ring-${i}`}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
          style={{
            width: `${i * (isMobile ? 60 : 100)}px`,
            height: `${i * (isMobile ? 60 : 100)}px`,
            borderColor: lockAcquired && i === 3 ? colors[0] : `${colors[0]}40`,
            borderStyle: i % 2 === 0 ? 'solid' : 'dashed'
          }}
          animate={{
            scale: lockAcquired && i === 3 ? [1, 0.95, 1] : 1,
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{
            scale: { duration: 0.3 },
            opacity: {
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }
          }}
        />
      ))}

      {/* Tick marks on rings (numbered 1-30) */}
      {Array.from({ length: 30 }).map((_, i) => {
        const angle = (i * 360) / 30;
        const radius = isMobile ? 180 : 300;
        const x = 50 + Math.cos(angle * Math.PI / 180) * (radius / 10);
        const y = 50 + Math.sin(angle * Math.PI / 180) * (radius / 10);
        
        return (
          <div
            key={`tick-${i}`}
            className="absolute text-xs font-mono"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
              color: colors[0],
              opacity: 0.6,
              fontSize: isMobile ? '8px' : '10px',
              textShadow: `0 0 5px ${colors[0]}`
            }}
          >
            {i + 1}
          </div>
        );
      })}

      {/* Central crosshair */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* Horizontal crosshair */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-y-1/2"
          style={{
            width: isMobile ? '100px' : '160px',
            height: '2px',
            background: `linear-gradient(90deg, transparent 0%, ${colors[0]} 45%, ${colors[0]} 55%, transparent 100%)`,
            boxShadow: `0 0 10px ${colors[0]}`
          }}
          animate={{
            scaleX: lockAcquired ? [1, 0.8, 1] : 1
          }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Vertical crosshair */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2"
          style={{
            width: '2px',
            height: isMobile ? '100px' : '160px',
            background: `linear-gradient(180deg, transparent 0%, ${colors[0]} 45%, ${colors[0]} 55%, transparent 100%)`,
            boxShadow: `0 0 10px ${colors[0]}`
          }}
          animate={{
            scaleY: lockAcquired ? [1, 0.8, 1] : 1
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Center dot */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: isMobile ? '6px' : '8px',
            height: isMobile ? '6px' : '8px',
            background: colors[0],
            boxShadow: `0 0 15px ${colors[0]}, 0 0 30px ${colors[0]}`
          }}
          animate={{
            scale: lockAcquired ? [1, 1.5, 1] : [1, 1.2, 1],
            boxShadow: lockAcquired 
              ? `0 0 25px ${colors[0]}, 0 0 50px ${colors[0]}`
              : `0 0 15px ${colors[0]}, 0 0 30px ${colors[0]}`
          }}
          transition={{
            duration: lockAcquired ? 0.3 : 2,
            repeat: lockAcquired ? 0 : Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Scanning radar lines */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{ rotate: 360 }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          width: isMobile ? '300px' : '500px',
          height: isMobile ? '300px' : '500px'
        }}
      >
        <div
          className="absolute left-1/2 top-1/2 origin-left"
          style={{
            width: '50%',
            height: '1px',
            background: `linear-gradient(90deg, ${colors[0]} 0%, transparent 100%)`,
            boxShadow: `0 0 8px ${colors[0]}`
          }}
        />
      </motion.div>

      {/* Corner HUD elements */}
      {/* Top Left - Accuracy */}
      <motion.div
        className="absolute top-4 left-4 font-mono text-xs"
        style={{
          color: colors[0],
          textShadow: `0 0 10px ${colors[0]}`
        }}
        animate={{
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          duration: 2,
          repeat: Infinity
        }}
      >
        <div className="border border-current p-2 backdrop-blur-sm bg-black/30">
          <div>ACCURACY</div>
          <div className="text-lg font-bold">100%</div>
        </div>
      </motion.div>

      {/* Top Right - Target Lock Status */}
      <motion.div
        className="absolute top-4 right-4 font-mono text-xs"
        style={{
          color: lockAcquired ? colors[0] : `${colors[0]}80`,
          textShadow: `0 0 10px ${colors[0]}`
        }}
        animate={{
          opacity: lockAcquired ? 1 : [0.5, 0.8, 0.5]
        }}
        transition={{
          duration: lockAcquired ? 0 : 2,
          repeat: lockAcquired ? 0 : Infinity
        }}
      >
        <div className="border border-current p-2 backdrop-blur-sm bg-black/30">
          <div>{lockAcquired ? '🎯 LOCKED' : 'SCANNING'}</div>
        </div>
      </motion.div>

      {/* Bottom Left - Streak Counter */}
      <motion.div
        className="absolute bottom-4 left-4 font-mono text-xs"
        style={{
          color: colors[0],
          textShadow: `0 0 10px ${colors[0]}`
        }}
        animate={{
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: 0.5
        }}
      >
        <div className="border border-current p-2 backdrop-blur-sm bg-black/30">
          <div>STREAK</div>
          <div className="text-lg font-bold">30 DAYS</div>
        </div>
      </motion.div>

      {/* Bottom Right - Coordinates */}
      <motion.div
        className="absolute bottom-4 right-4 font-mono text-xs"
        style={{
          color: colors[0],
          textShadow: `0 0 10px ${colors[0]}`
        }}
        animate={{
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: 1
        }}
      >
        <div className="border border-current p-2 backdrop-blur-sm bg-black/30">
          <div>TARGET: ACQUIRED</div>
          <div className="text-[10px] opacity-70">LAT: 100.0° LONG: 30.0°</div>
        </div>
      </motion.div>

      {/* Distance markers radiating from center */}
      {[50, 100, 150, 200].map((dist, i) => (
        <motion.div
          key={`dist-${i}`}
          className="absolute left-1/2 font-mono text-[8px]"
          style={{
            top: `calc(50% - ${dist}px)`,
            transform: 'translateX(-50%)',
            color: colors[0],
            opacity: 0.4,
            textShadow: `0 0 5px ${colors[0]}`
          }}
          animate={{
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.2
          }}
        >
          {dist}m
        </motion.div>
      ))}

      {/* Lock acquisition animation */}
      {lockAcquired && (
        <>
          {/* Flash effect */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 0.5 }}
            style={{
              background: colors[0],
              mixBlendMode: 'screen'
            }}
          />

          {/* Corner brackets converging */}
          {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(corner => {
            const positions = {
              'top-left': { top: '40%', left: '40%' },
              'top-right': { top: '40%', right: '40%' },
              'bottom-left': { bottom: '40%', left: '40%' },
              'bottom-right': { bottom: '40%', right: '40%' }
            };
            
            return (
              <motion.div
                key={corner}
                className="absolute"
                style={{
                  ...positions[corner as keyof typeof positions],
                  width: isMobile ? '30px' : '50px',
                  height: isMobile ? '30px' : '50px',
                  borderColor: colors[0],
                  borderWidth: '3px',
                  borderStyle: 'solid',
                  ...(corner.includes('top') && corner.includes('left') && { borderRight: 'none', borderBottom: 'none' }),
                  ...(corner.includes('top') && corner.includes('right') && { borderLeft: 'none', borderBottom: 'none' }),
                  ...(corner.includes('bottom') && corner.includes('left') && { borderRight: 'none', borderTop: 'none' }),
                  ...(corner.includes('bottom') && corner.includes('right') && { borderLeft: 'none', borderTop: 'none' })
                }}
                initial={{ 
                  scale: 2,
                  opacity: 0 
                }}
                animate={{ 
                  scale: 1,
                  opacity: 1 
                }}
                exit={{ 
                  scale: 0.8,
                  opacity: 0 
                }}
                transition={{ duration: 0.3 }}
              />
            );
          })}
        </>
      )}

      {/* Glitch scan lines effect */}
      {!isPreview && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              ${colors[0]}08 2px,
              ${colors[0]}08 4px
            )`
          }}
          animate={{
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{
            duration: 0.1,
            repeat: Infinity
          }}
        />
      )}

      {/* Heat signature particles */}
      {!isPreview && Array.from({ length: isMobile ? 6 : 12 }).map((_, i) => (
        <motion.div
          key={`heat-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${30 + Math.random() * 40}%`,
            top: `${30 + Math.random() * 40}%`,
            width: `${3 + Math.random() * 4}px`,
            height: `${3 + Math.random() * 4}px`,
            background: colors[0],
            boxShadow: `0 0 10px ${colors[0]}`,
            filter: 'blur(1px)'
          }}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.5, 0.5]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}
