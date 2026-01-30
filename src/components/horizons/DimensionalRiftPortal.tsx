import React, { useMemo } from 'react';
import { motion } from 'motion/react';

interface DimensionalRiftPortalProps {
  colors: string[];
  isPreview?: boolean;
}

/**
 * 🌀 DIMENSIONAL RIFT PORTAL - Legend Achievement
 * A massive interdimensional portal tears through reality itself
 * Features: Spinning energy rings, reality shards, energy bursts, parallax depth
 */
export function DimensionalRiftPortal({ colors, isPreview = false }: DimensionalRiftPortalProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // Generate reality shards (broken mirror fragments)
  const shards = useMemo(() => {
    const count = isMobile ? 15 : 25;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      rotation: Math.random() * 360,
      size: 20 + Math.random() * 40,
      speed: 0.3 + Math.random() * 0.7, // For parallax
      delay: Math.random() * 5,
      colorIndex: Math.floor(Math.random() * colors.length)
    }));
  }, [isMobile, colors.length]);

  // Energy rings around portal
  const rings = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      id: i,
      scale: 0.3 + (i * 0.2),
      duration: 8 + (i * 2),
      delay: i * 0.5,
      opacity: 0.8 - (i * 0.15)
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Background cosmic mist */}
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at center, ${colors[0]}15 0%, transparent 70%)`
        }}
      />

      {/* Central Portal Vortex */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Portal core - pulsing center */}
        <motion.div
          className="absolute"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            width: isMobile ? '150px' : '250px',
            height: isMobile ? '150px' : '250px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors[0]} 0%, ${colors[1]} 50%, transparent 70%)`,
            boxShadow: `0 0 ${isMobile ? '40px' : '80px'} ${colors[0]}, 0 0 ${isMobile ? '80px' : '160px'} ${colors[1]}`
          }}
        />

        {/* Spinning energy rings */}
        {rings.map(ring => (
          <motion.div
            key={ring.id}
            className="absolute rounded-full border-2"
            animate={{
              rotate: 360,
              scale: [ring.scale, ring.scale * 1.1, ring.scale]
            }}
            transition={{
              rotate: {
                duration: ring.duration,
                repeat: Infinity,
                ease: "linear"
              },
              scale: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: ring.delay
              }
            }}
            style={{
              width: `${(isMobile ? 200 : 350) * ring.scale}px`,
              height: `${(isMobile ? 200 : 350) * ring.scale}px`,
              borderColor: `${colors[ring.id % colors.length]}${Math.round(ring.opacity * 255).toString(16).padStart(2, '0')}`,
              borderWidth: '3px',
              borderStyle: 'dashed',
              boxShadow: `0 0 20px ${colors[ring.id % colors.length]}${Math.round(ring.opacity * 128).toString(16).padStart(2, '0')}`
            }}
          />
        ))}

        {/* Inner vortex spiral */}
        <motion.div
          className="absolute"
          animate={{ rotate: -360 }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            width: isMobile ? '100px' : '180px',
            height: isMobile ? '100px' : '180px',
            borderRadius: '50%',
            background: `conic-gradient(from 0deg, transparent 0deg, ${colors[0]} 90deg, transparent 180deg, ${colors[1]} 270deg, transparent 360deg)`,
            opacity: 0.6
          }}
        />
      </div>

      {/* Reality shards - floating mirror fragments */}
      {shards.map(shard => (
        <motion.div
          key={shard.id}
          className="absolute"
          initial={{ 
            x: `${shard.x}%`, 
            y: `${shard.y}%`,
            rotate: shard.rotation 
          }}
          animate={{
            y: [`${shard.y}%`, `${(shard.y + 10) % 100}%`, `${shard.y}%`],
            rotate: [shard.rotation, shard.rotation + 360],
            scale: [1, 1.1, 1]
          }}
          transition={{
            y: {
              duration: 15 / shard.speed,
              repeat: Infinity,
              ease: "easeInOut",
              delay: shard.delay
            },
            rotate: {
              duration: 20 / shard.speed,
              repeat: Infinity,
              ease: "linear",
              delay: shard.delay
            },
            scale: {
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: shard.delay
            }
          }}
          style={{
            width: `${shard.size}px`,
            height: `${shard.size * 1.4}px`,
            background: `linear-gradient(135deg, ${colors[shard.colorIndex]}40 0%, ${colors[(shard.colorIndex + 1) % colors.length]}20 100%)`,
            backdropFilter: 'blur(2px)',
            clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
            boxShadow: `0 0 15px ${colors[shard.colorIndex]}60, inset 0 0 10px ${colors[shard.colorIndex]}40`,
            border: `1px solid ${colors[shard.colorIndex]}80`,
            transform: `translateZ(${shard.speed * 100}px)` // Parallax depth
          }}
        />
      ))}

      {/* Energy burst particles */}
      {!isPreview && Array.from({ length: isMobile ? 8 : 15 }).map((_, i) => (
        <motion.div
          key={`burst-${i}`}
          className="absolute rounded-full"
          style={{
            left: '50%',
            top: '50%',
            width: '4px',
            height: '4px',
            background: colors[i % colors.length]
          }}
          animate={{
            x: [0, (Math.cos(i * (360 / 15) * Math.PI / 180) * (isMobile ? 150 : 250))],
            y: [0, (Math.sin(i * (360 / 15) * Math.PI / 180) * (isMobile ? 150 : 250))],
            opacity: [1, 0],
            scale: [1, 0.5]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeOut"
          }}
        />
      ))}

      {/* Ripple waves emanating from portal */}
      {[0, 1, 2].map(i => (
        <motion.div
          key={`ripple-${i}`}
          className="absolute rounded-full border-2"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            borderColor: `${colors[i % colors.length]}30`
          }}
          animate={{
            width: ['0px', `${isMobile ? 400 : 700}px`],
            height: ['0px', `${isMobile ? 400 : 700}px`],
            opacity: [0.6, 0]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            delay: i * 1.5,
            ease: "easeOut"
          }}
        />
      ))}

      {/* Portal breathing effect - subtle expansion/contraction */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        animate={{
          scale: [1, 1.05, 1]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div 
          className="rounded-full"
          style={{
            width: isMobile ? '300px' : '500px',
            height: isMobile ? '300px' : '500px',
            background: `radial-gradient(circle, transparent 40%, ${colors[0]}05 60%, transparent 80%)`,
            filter: 'blur(20px)'
          }}
        />
      </motion.div>
    </div>
  );
}
