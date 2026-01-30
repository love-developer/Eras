import React from 'react';
import { motion } from 'motion/react';

interface BronzeHourglassHorizonProps {
  isActive?: boolean;
}

export function BronzeHourglassHorizon({ isActive = true }: BronzeHourglassHorizonProps) {
  if (!isActive) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Bronze gradient glow */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(205, 127, 50, 0.15) 0%, transparent 60%)',
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Rotating hourglass icon (center) */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          fontSize: '120px',
          filter: 'drop-shadow(0 0 20px rgba(205, 127, 50, 0.8))',
        }}
        animate={{
          rotate: [0, 180, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        ⏳
      </motion.div>

      {/* Falling sand particles */}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-amber-300"
          style={{
            left: `${20 + Math.random() * 60}%`,
            top: `-${Math.random() * 20}%`,
            boxShadow: '0 0 4px rgba(222, 184, 135, 0.8)',
          }}
          animate={{
            y: ['0vh', '120vh'],
            x: [0, Math.sin(i) * 30],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: 'linear',
          }}
        />
      ))}

      {/* Bronze shimmer waves */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`wave-${i}`}
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, transparent 0%, rgba(205, 127, 50, 0.1) 50%, transparent 100%)`,
          }}
          animate={{
            y: ['-100%', '100%'],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            delay: i * 2.5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
