import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface LivingMemoryTreeProps {
  colors: string[];
  isPreview?: boolean;
}

/**
 * 🌳 LIVING MEMORY TREE - Archive Master Achievement
 * Majestic golden tree with 1,000 glowing leaves representing capsules
 * Features: Swaying leaves, pulsing roots, wisdom bursts, firefly particles
 */
export function LivingMemoryTree({ colors, isPreview = false }: LivingMemoryTreeProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [wisdomBurst, setWisdomBurst] = useState(false);

  // Trigger wisdom burst every 8 seconds
  useEffect(() => {
    if (isPreview) return;
    const interval = setInterval(() => {
      setWisdomBurst(true);
      setTimeout(() => setWisdomBurst(false), 1000);
    }, 8000);
    return () => clearInterval(interval);
  }, [isPreview]);

  // Generate leaves (representing capsules)
  const leaves = useMemo(() => {
    const count = isMobile ? 80 : 150; // Scaled down for performance, represents 1000
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * 360;
      const radius = 30 + (i % 5) * 12;
      return {
        id: i,
        x: 50 + Math.cos(angle * Math.PI / 180) * radius,
        y: 30 + Math.sin(angle * Math.PI / 180) * (radius * 0.6), // Compressed vertically
        size: 3 + Math.random() * 4,
        swayDelay: Math.random() * 4,
        swayAmount: 1 + Math.random() * 2,
        glowDelay: Math.random() * 3,
        cluster: Math.floor(i / 10) // Group leaves into clusters
      };
    });
  }, [isMobile]);

  // Branch paths (SVG paths for tree branches)
  const branches = useMemo(() => [
    { d: 'M 50,90 Q 45,70 40,50 Q 38,35 35,20', width: 3 },
    { d: 'M 50,90 Q 52,70 48,50 Q 46,35 42,25', width: 2.5 },
    { d: 'M 50,90 Q 55,70 60,50 Q 62,35 65,20', width: 3 },
    { d: 'M 50,90 Q 48,70 52,50 Q 54,35 58,25', width: 2.5 },
    { d: 'M 50,90 Q 50,70 45,45 Q 42,30 38,18', width: 2 },
    { d: 'M 50,90 Q 50,70 55,45 Q 58,30 62,18', width: 2 },
  ], []);

  // Firefly particles
  const fireflies = useMemo(() => {
    return Array.from({ length: isMobile ? 8 : 15 }, (_, i) => ({
      id: i,
      startX: Math.random() * 100,
      startY: Math.random() * 100,
      delay: Math.random() * 5
    }));
  }, [isMobile]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Background bokeh effect */}
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${colors[0]}15 0%, transparent 50%)`
        }}
      />

      {/* Roots - pulsing energy at bottom */}
      <svg className="absolute bottom-0 w-full h-1/3" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="root-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors[0]} stopOpacity="0.6" />
            <stop offset="100%" stopColor={colors[1]} stopOpacity="0.2" />
          </linearGradient>
          
          <filter id="root-glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Root paths */}
        {[
          'M 50,0 Q 30,20 20,50 Q 15,70 10,100',
          'M 50,0 Q 40,15 35,40 Q 30,60 25,100',
          'M 50,0 Q 60,15 65,40 Q 70,60 75,100',
          'M 50,0 Q 70,20 80,50 Q 85,70 90,100',
          'M 50,0 Q 45,25 40,60 Q 35,80 30,100',
          'M 50,0 Q 55,25 60,60 Q 65,80 70,100'
        ].map((path, i) => (
          <motion.path
            key={`root-${i}`}
            d={path}
            fill="none"
            stroke="url(#root-gradient)"
            strokeWidth={3 - i * 0.3}
            strokeLinecap="round"
            style={{ filter: 'url(#root-glow)' }}
            animate={{
              strokeOpacity: [0.4, 0.7, 0.4],
              strokeWidth: [3 - i * 0.3, 4 - i * 0.3, 3 - i * 0.3]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}

        {/* Energy pulses from roots */}
        {[0, 1, 2].map(i => (
          <motion.circle
            key={`pulse-${i}`}
            cx="50"
            cy="0"
            r="3"
            fill={colors[0]}
            style={{ filter: 'url(#root-glow)' }}
            animate={{
              cy: [0, 100],
              opacity: [1, 0],
              r: [3, 1]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 1.5,
              ease: "easeOut"
            }}
          />
        ))}
      </svg>

      {/* Tree trunk with circuit patterns */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="trunk-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors[0]} stopOpacity="0.4" />
            <stop offset="100%" stopColor={colors[1]} stopOpacity="0.7" />
          </linearGradient>
        </defs>

        {/* Main trunk */}
        <motion.rect
          x="48"
          y="60"
          width="4"
          height="40"
          fill="url(#trunk-gradient)"
          rx="2"
          animate={{
            opacity: wisdomBurst ? 1 : 0.8
          }}
          transition={{ duration: 0.5 }}
        />

        {/* Trunk highlights - data veins */}
        <motion.path
          d="M 49,90 L 49,70 L 51,65 L 49,60"
          stroke={colors[0]}
          strokeWidth="0.5"
          fill="none"
          animate={{
            opacity: [0.3, 0.8, 0.3],
            strokeWidth: wisdomBurst ? [0.5, 1, 0.5] : 0.5
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Branches */}
        {branches.map((branch, i) => (
          <motion.path
            key={`branch-${i}`}
            d={branch.d}
            fill="none"
            stroke="url(#trunk-gradient)"
            strokeWidth={branch.width}
            strokeLinecap="round"
            style={{ filter: 'url(#root-glow)' }}
            animate={{
              opacity: wisdomBurst ? 1 : 0.7
            }}
            transition={{ duration: 0.5 }}
          />
        ))}
      </svg>

      {/* Leaves - glowing memory capsules */}
      {leaves.map(leaf => (
        <motion.div
          key={leaf.id}
          className="absolute rounded-full"
          style={{
            left: `${leaf.x}%`,
            top: `${leaf.y}%`,
            width: `${leaf.size}px`,
            height: `${leaf.size}px`,
            background: colors[leaf.cluster % 2],
            boxShadow: `0 0 ${leaf.size * 2}px ${colors[leaf.cluster % 2]}`
          }}
          animate={{
            x: [0, leaf.swayAmount, 0, -leaf.swayAmount, 0],
            y: [0, -leaf.swayAmount * 0.5, 0],
            scale: wisdomBurst ? [1, 1.5, 1] : 1,
            opacity: wisdomBurst ? [0.7, 1, 0.7] : [0.6, 1, 0.6]
          }}
          transition={{
            x: {
              duration: 4,
              repeat: Infinity,
              delay: leaf.swayDelay,
              ease: "easeInOut"
            },
            y: {
              duration: 4,
              repeat: Infinity,
              delay: leaf.swayDelay,
              ease: "easeInOut"
            },
            scale: {
              duration: wisdomBurst ? 1 : 2,
              ease: "easeInOut"
            },
            opacity: {
              duration: 3,
              repeat: Infinity,
              delay: leaf.glowDelay,
              ease: "easeInOut"
            }
          }}
        />
      ))}

      {/* Floating detached leaves */}
      {Array.from({ length: isMobile ? 3 : 6 }).map((_, i) => (
        <motion.div
          key={`float-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${30 + Math.random() * 40}%`,
            width: '4px',
            height: '4px',
            background: colors[i % 2],
            boxShadow: `0 0 8px ${colors[i % 2]}`
          }}
          animate={{
            y: ['100%', '-20%'],
            x: [0, Math.sin(i) * 30, 0],
            opacity: [0, 1, 1, 0],
            rotate: [0, 360]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            delay: i * 2,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Firefly particles - bokeh lights */}
      {fireflies.map(firefly => (
        <motion.div
          key={firefly.id}
          className="absolute rounded-full"
          style={{
            width: isMobile ? '3px' : '5px',
            height: isMobile ? '3px' : '5px',
            background: colors[firefly.id % 2],
            boxShadow: `0 0 15px ${colors[firefly.id % 2]}`,
            filter: 'blur(1px)'
          }}
          animate={{
            x: [`${firefly.startX}%`, `${(firefly.startX + 20) % 100}%`, `${firefly.startX}%`],
            y: [`${firefly.startY}%`, `${(firefly.startY - 20 + 100) % 100}%`, `${firefly.startY}%`],
            opacity: [0, 1, 0],
            scale: [1, 1.5, 1]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            delay: firefly.delay,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Tree rings on trunk (age indicator) */}
      <div className="absolute left-1/2 top-[70%] -translate-x-1/2 -translate-y-1/2">
        {[0, 1, 2].map(i => (
          <motion.div
            key={`ring-${i}`}
            className="rounded-full border absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: `${(i + 1) * 15}px`,
              height: `${(i + 1) * 15}px`,
              borderColor: `${colors[0]}40`,
              borderWidth: '1px'
            }}
            animate={{
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3
            }}
          />
        ))}
      </div>

      {/* Wisdom burst indicator */}
      {wisdomBurst && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.4, 0] }}
          transition={{ duration: 1 }}
          style={{
            background: `radial-gradient(circle at 50% 40%, ${colors[0]} 0%, transparent 50%)`,
            mixBlendMode: 'screen'
          }}
        />
      )}

      {/* Sparkles on healthy branches */}
      {!isPreview && Array.from({ length: isMobile ? 5 : 10 }).map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute text-xs"
          style={{
            left: `${40 + Math.random() * 20}%`,
            top: `${20 + Math.random() * 30}%`,
            filter: `drop-shadow(0 0 5px ${colors[i % 2]})`
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.8,
            ease: "easeInOut"
          }}
        >
          ✨
        </motion.div>
      ))}
    </div>
  );
}
