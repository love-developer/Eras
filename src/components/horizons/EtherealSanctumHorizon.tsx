import React from 'react';
import { motion } from 'motion/react';

interface EtherealSanctumHorizonProps {
  isActive?: boolean;
}

export function EtherealSanctumHorizon({ isActive = true }: EtherealSanctumHorizonProps) {
  if (!isActive) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Golden vault glow */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 100%, rgba(255, 215, 0, 0.25) 0%, transparent 70%)',
        }}
        animate={{
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Vault door backdrop */}
      <motion.div
        className="absolute left-1/2 bottom-0 -translate-x-1/2"
        style={{
          width: '300px',
          height: '400px',
          background: 'linear-gradient(180deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 140, 0, 0.05) 100%)',
          borderRadius: '150px 150px 0 0',
          border: '2px solid rgba(255, 215, 0, 0.3)',
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [0.95, 1, 0.95],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Floating golden keys */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const radius = 180;
        const x = Math.cos((angle * Math.PI) / 180) * radius;
        const y = Math.sin((angle * Math.PI) / 180) * radius;
        
        return (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2"
            style={{
              fontSize: '40px',
              filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))',
            }}
            animate={{
              x: [x, x + 20, x],
              y: [y, y - 20, y],
              rotate: [0, 360],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'easeInOut',
            }}
          >
            🔑
          </motion.div>
        );
      })}

      {/* Shield shimmer effect */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          border: '3px solid rgba(255, 215, 0, 0.3)',
          boxShadow: '0 0 40px rgba(255, 215, 0, 0.4), inset 0 0 40px rgba(255, 215, 0, 0.2)',
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3],
          rotate: [0, 360],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Vault icon center */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          fontSize: '100px',
          filter: 'drop-shadow(0 0 30px rgba(255, 215, 0, 1))',
        }}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        🏛️
      </motion.div>

      {/* Golden particle rain */}
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-yellow-300"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-${Math.random() * 20}%`,
            boxShadow: '0 0 6px rgba(255, 248, 220, 0.9)',
          }}
          animate={{
            y: ['0vh', '120vh'],
            x: [0, Math.sin(i * 0.5) * 40],
            opacity: [0, 1, 1, 0],
            scale: [0.5, 1.5, 0.5],
          }}
          transition={{
            duration: 5 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: 'linear',
          }}
        />
      ))}

      {/* Radial light beams */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <motion.div
          key={`beam-${i}`}
          className="absolute left-1/2 top-1/2"
          style={{
            width: '4px',
            height: '50%',
            background: 'linear-gradient(to bottom, rgba(255, 215, 0, 0.4), transparent)',
            transformOrigin: 'top center',
            transform: `rotate(${angle}deg)`,
          }}
          animate={{
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
