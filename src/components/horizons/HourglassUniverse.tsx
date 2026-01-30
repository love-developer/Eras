import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface HourglassUniverseProps {
  colors: string[];
  isPreview?: boolean;
}

/**
 * ⏳ HOURGLASS UNIVERSE - Time Lord Achievement
 * Cosmic hourglass with falling time particles that periodically reverses
 * Features: Falling clock particles, hourglass flip, rotating clock hands, time bridge
 */
export function HourglassUniverse({ colors, isPreview = false }: HourglassUniverseProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [isFlipped, setIsFlipped] = useState(false);

  // Flip hourglass every 15 seconds
  useEffect(() => {
    if (isPreview) return;
    const interval = setInterval(() => {
      setIsFlipped(prev => !prev);
    }, 15000);
    return () => clearInterval(interval);
  }, [isPreview]);

  // Generate falling time particles (clocks, hourglasses, calendars)
  const timeParticles = useMemo(() => {
    const count = isMobile ? 20 : 40;
    const icons = ['🕐', '⏳', '📅', '⏰', '🕰️'];
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      icon: icons[i % icons.length],
      x: 30 + Math.random() * 40, // Keep in center channel
      delay: Math.random() * 8,
      duration: 6 + Math.random() * 4,
      size: 12 + Math.random() * 8,
      rotation: Math.random() * 360
    }));
  }, [isMobile]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Background gradient - hourglass shape */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${colors[0]}20 0%, transparent 45%, ${colors[1]}10 50%, transparent 55%, ${colors[1]}20 100%)`
        }}
      />

      {/* Top triangle (upper bulb) */}
      <div 
        className="absolute left-1/2 top-0 -translate-x-1/2"
        style={{
          width: 0,
          height: 0,
          borderLeft: `${isMobile ? 150 : 250}px solid transparent`,
          borderRight: `${isMobile ? 150 : 250}px solid transparent`,
          borderTop: `${isMobile ? 120 : 200}px solid ${colors[0]}15`,
          filter: 'blur(2px)'
        }}
      />

      {/* Bottom triangle (lower bulb) */}
      <div 
        className="absolute left-1/2 bottom-0 -translate-x-1/2"
        style={{
          width: 0,
          height: 0,
          borderLeft: `${isMobile ? 150 : 250}px solid transparent`,
          borderRight: `${isMobile ? 150 : 250}px solid transparent`,
          borderBottom: `${isMobile ? 120 : 200}px solid ${colors[1]}15`,
          filter: 'blur(2px)'
        }}
      />

      {/* Central time bridge - glowing horizon line */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{
          scaleX: [1, 1.2, 1],
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          width: isMobile ? '100px' : '180px',
          height: '4px',
          background: `linear-gradient(90deg, transparent 0%, ${colors[0]} 50%, transparent 100%)`,
          boxShadow: `0 0 20px ${colors[0]}, 0 0 40px ${colors[1]}`
        }}
      />

      {/* Ornate hourglass frame - left side */}
      <div 
        className="absolute left-0 top-1/2 -translate-y-1/2 h-32 w-8"
        style={{
          background: `linear-gradient(180deg, ${colors[0]}60 0%, ${colors[0]}80 50%, ${colors[1]}60 100%)`,
          clipPath: 'polygon(50% 0%, 100% 20%, 100% 80%, 50% 100%, 0% 80%, 0% 20%)',
          boxShadow: `0 0 20px ${colors[0]}`
        }}
      />

      {/* Ornate hourglass frame - right side */}
      <div 
        className="absolute right-0 top-1/2 -translate-y-1/2 h-32 w-8"
        style={{
          background: `linear-gradient(180deg, ${colors[0]}60 0%, ${colors[0]}80 50%, ${colors[1]}60 100%)`,
          clipPath: 'polygon(50% 0%, 100% 20%, 100% 80%, 50% 100%, 0% 80%, 0% 20%)',
          boxShadow: `0 0 20px ${colors[0]}`
        }}
      />

      {/* Falling time particles */}
      <motion.div
        className="absolute inset-0"
        animate={{
          scaleY: isFlipped ? -1 : 1
        }}
        transition={{
          duration: 1,
          ease: "easeInOut"
        }}
      >
        {timeParticles.map(particle => (
          <motion.div
            key={particle.id}
            className="absolute font-bold"
            style={{
              left: `${particle.x}%`,
              fontSize: `${particle.size}px`,
              filter: `drop-shadow(0 0 8px ${colors[0]})`,
              rotate: `${particle.rotation}deg`
            }}
            animate={{
              y: ['-10%', '110%'],
              rotate: [particle.rotation, particle.rotation + 360],
              opacity: [0, 1, 1, 0]
            }}
            transition={{
              y: {
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
                ease: "easeIn"
              },
              rotate: {
                duration: particle.duration * 1.5,
                repeat: Infinity,
                delay: particle.delay,
                ease: "linear"
              },
              opacity: {
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
                times: [0, 0.1, 0.9, 1]
              }
            }}
          >
            {particle.icon}
          </motion.div>
        ))}
      </motion.div>

      {/* Background clock hands - hour hand */}
      <motion.div
        className="absolute left-1/2 top-1/2 origin-bottom"
        animate={{ rotate: 360 }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          width: '3px',
          height: isMobile ? '40px' : '70px',
          background: `linear-gradient(180deg, ${colors[0]}40 0%, transparent 100%)`,
          transform: 'translate(-50%, -100%)',
          filter: 'blur(1px)'
        }}
      />

      {/* Background clock hands - minute hand */}
      <motion.div
        className="absolute left-1/2 top-1/2 origin-bottom"
        animate={{ rotate: -360 }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          width: '2px',
          height: isMobile ? '60px' : '100px',
          background: `linear-gradient(180deg, ${colors[1]}40 0%, transparent 100%)`,
          transform: 'translate(-50%, -100%)',
          filter: 'blur(1px)'
        }}
      />

      {/* Background clock hands - second hand */}
      <motion.div
        className="absolute left-1/2 top-1/2 origin-bottom"
        animate={{ rotate: 360 }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          width: '1px',
          height: isMobile ? '50px' : '85px',
          background: `linear-gradient(180deg, ${colors[0]}60 0%, transparent 100%)`,
          transform: 'translate(-50%, -100%)',
          filter: 'blur(0.5px)'
        }}
      />

      {/* Clock center pivot */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: '8px',
          height: '8px',
          background: colors[0],
          boxShadow: `0 0 15px ${colors[0]}`
        }}
      />

      {/* Particle trails - glowing paths */}
      {Array.from({ length: isMobile ? 3 : 5 }).map((_, i) => (
        <motion.div
          key={`trail-${i}`}
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            width: '2px',
            height: '100%',
            background: `linear-gradient(180deg, transparent 0%, ${colors[i % 2]}20 50%, transparent 100%)`,
            left: `${35 + i * 7}%`
          }}
          animate={{
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Sand accumulation effect - bottom */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        animate={{
          height: isFlipped ? ['0%', '15%'] : ['15%', '0%']
        }}
        transition={{
          duration: 14,
          ease: "linear"
        }}
        style={{
          width: isMobile ? '120px' : '200px',
          background: `linear-gradient(180deg, ${colors[1]}40 0%, ${colors[1]}20 100%)`,
          borderRadius: '50% 50% 0 0',
          filter: 'blur(4px)'
        }}
      />

      {/* Hourglass flip indicator */}
      <motion.div
        className="absolute left-1/2 top-4 -translate-x-1/2 text-xs font-bold"
        style={{
          color: colors[0],
          textShadow: `0 0 10px ${colors[0]}`
        }}
        animate={{
          opacity: isFlipped ? [1, 0] : [0, 1]
        }}
        transition={{
          duration: 0.5
        }}
      >
        ⏳ {isFlipped ? 'REVERSED' : 'FLOWING'}
      </motion.div>
    </div>
  );
}
