import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';

interface SevenSealsMysticalProps {
  colors: string[];
  isPreview?: boolean;
}

/**
 * 🔮 SEVEN SEALS MYSTICAL UNLOCK - Sevenfold Sage Achievement
 * Ancient mystical seals arranged in sacred geometry, periodically aligning
 * Features: 7 rotating seals, sacred geometry, unlock sequences, mystical runes, enlightenment flash
 */
export function SevenSealsMystical({ colors, isPreview = false }: SevenSealsMysticalProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [isEnlightened, setIsEnlightened] = useState(false);
  const [alignmentActive, setAlignmentActive] = useState(false);

  // Trigger alignment every 7 seconds
  useEffect(() => {
    if (isPreview) return;
    const interval = setInterval(() => {
      setAlignmentActive(true);
      setTimeout(() => {
        setIsEnlightened(true);
        setTimeout(() => {
          setIsEnlightened(false);
          setAlignmentActive(false);
        }, 1000);
      }, 1500);
    }, 7000);
    return () => clearInterval(interval);
  }, [isPreview]);

  // Seven seals arranged in flower of life pattern (6 around 1 center)
  const seals = useMemo(() => {
    const centerSeal = {
      id: 0,
      x: 50,
      y: 50,
      size: isMobile ? 50 : 80,
      rotationSpeed: 20,
      number: 7, // Represents 111 × 7 = 777
      isCenter: true
    };

    const outerSeals = Array.from({ length: 6 }, (_, i) => {
      const angle = (i * 360) / 6;
      const radius = isMobile ? 25 : 35;
      return {
        id: i + 1,
        x: 50 + Math.cos(angle * Math.PI / 180) * radius,
        y: 50 + Math.sin(angle * Math.PI / 180) * radius,
        size: isMobile ? 35 : 55,
        rotationSpeed: 15 + i * 2,
        number: (i % 6) + 1,
        isCenter: false
      };
    });

    return [centerSeal, ...outerSeals];
  }, [isMobile]);

  // Mystical runes orbiting the seals
  const runes = useMemo(() => {
    const runeSymbols = ['ᚨ', 'ᚱ', 'ᚲ', 'ᚺ', 'ᛁ', 'ᚹ', 'ᛖ', 'ᛏ', 'ᛚ', 'ᛗ'];
    return Array.from({ length: 10 }, (_, i) => ({
      id: i,
      symbol: runeSymbols[i],
      orbit: 40 + (i % 3) * 5,
      speed: 30 + i * 3,
      delay: i * 0.5
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Cosmic mist background */}
      <motion.div 
        className="absolute inset-0"
        animate={{
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          background: `radial-gradient(circle at center, ${colors[0]}20 0%, ${colors[1]}15 50%, transparent 80%)`
        }}
      />

      {/* Swirling cosmic mist */}
      <motion.div
        className="absolute inset-0"
        animate={{
          rotate: 360
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, ${colors[0]}10 120deg, transparent 240deg, ${colors[1]}10 360deg)`,
          filter: 'blur(40px)'
        }}
      />

      {/* Light beams connecting all seals */}
      <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="beam-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors[0]} stopOpacity="0.3" />
            <stop offset="50%" stopColor={colors[1]} stopOpacity="0.5" />
            <stop offset="100%" stopColor={colors[0]} stopOpacity="0.3" />
          </linearGradient>

          <filter id="beam-glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Connect center to all outer seals */}
        {seals.slice(1).map((seal, i) => (
          <motion.line
            key={`beam-${i}`}
            x1="50%"
            y1="50%"
            x2={`${seal.x}%`}
            y2={`${seal.y}%`}
            stroke="url(#beam-gradient)"
            strokeWidth={alignmentActive ? "3" : "1"}
            style={{ filter: 'url(#beam-glow)' }}
            animate={{
              strokeOpacity: alignmentActive ? [0.3, 1, 0.3] : [0.2, 0.4, 0.2]
            }}
            transition={{
              duration: alignmentActive ? 1 : 3,
              repeat: Infinity,
              delay: i * 0.1
            }}
          />
        ))}

        {/* Connect outer seals to each other (hexagon) */}
        {seals.slice(1).map((seal, i) => {
          const nextSeal = seals.slice(1)[(i + 1) % 6];
          return (
            <motion.line
              key={`hex-${i}`}
              x1={`${seal.x}%`}
              y1={`${seal.y}%`}
              x2={`${nextSeal.x}%`}
              y2={`${nextSeal.y}%`}
              stroke="url(#beam-gradient)"
              strokeWidth={alignmentActive ? "2" : "0.5"}
              style={{ filter: 'url(#beam-glow)' }}
              animate={{
                strokeOpacity: alignmentActive ? [0.2, 0.8, 0.2] : [0.1, 0.3, 0.1]
              }}
              transition={{
                duration: alignmentActive ? 1 : 4,
                repeat: Infinity,
                delay: i * 0.15
              }}
            />
          );
        })}
      </svg>

      {/* The Seven Seals */}
      {seals.map(seal => (
        <motion.div
          key={seal.id}
          className="absolute"
          style={{
            left: `${seal.x}%`,
            top: `${seal.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Seal outer ring */}
          <motion.div
            className="relative rounded-full flex items-center justify-center"
            style={{
              width: `${seal.size}px`,
              height: `${seal.size}px`,
              background: `radial-gradient(circle, ${colors[seal.id % 2]}40 0%, ${colors[(seal.id + 1) % 2]}20 50%, transparent 100%)`,
              border: `2px solid ${alignmentActive ? colors[0] : colors[seal.id % 2]}`,
              boxShadow: alignmentActive 
                ? `0 0 30px ${colors[0]}, 0 0 60px ${colors[1]}`
                : `0 0 15px ${colors[seal.id % 2]}`
            }}
            animate={{
              rotate: alignmentActive ? 0 : 360,
              scale: isEnlightened ? [1, 1.2, 1] : 1
            }}
            transition={{
              rotate: {
                duration: seal.rotationSpeed,
                repeat: Infinity,
                ease: "linear"
              },
              scale: {
                duration: 1,
                ease: "easeInOut"
              }
            }}
          >
            {/* Inner mandala pattern */}
            <div
              className="absolute inset-2 rounded-full"
              style={{
                background: `conic-gradient(from 0deg, ${colors[0]}60 0deg, transparent 45deg, ${colors[1]}60 90deg, transparent 135deg, ${colors[0]}60 180deg, transparent 225deg, ${colors[1]}60 270deg, transparent 315deg, ${colors[0]}60 360deg)`,
                border: `1px solid ${colors[seal.id % 2]}80`
              }}
            />

            {/* Sacred number "7" in center */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center font-bold"
              style={{
                fontSize: seal.isCenter ? (isMobile ? '24px' : '32px') : (isMobile ? '16px' : '20px'),
                color: colors[0],
                textShadow: `0 0 20px ${colors[0]}, 0 0 40px ${colors[1]}`,
                fontFamily: 'serif'
              }}
              animate={{
                opacity: isEnlightened ? 1 : 0.8,
                textShadow: isEnlightened 
                  ? `0 0 30px ${colors[0]}, 0 0 60px ${colors[1]}`
                  : `0 0 20px ${colors[0]}, 0 0 40px ${colors[1]}`
              }}
              transition={{ duration: 0.5 }}
            >
              7
            </motion.div>

            {/* Seal pulse rings */}
            {[0, 1, 2].map(i => (
              <motion.div
                key={`pulse-${seal.id}-${i}`}
                className="absolute rounded-full border-2"
                style={{
                  inset: `-${i * 8}px`,
                  borderColor: `${colors[seal.id % 2]}30`
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0, 0.5]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.5 + seal.id * 0.2
                }}
              />
            ))}
          </motion.div>

          {/* Seal designation text */}
          {!isMobile && (
            <div
              className="absolute top-full mt-2 left-1/2 -translate-x-1/2 text-xs font-mono whitespace-nowrap"
              style={{
                color: colors[0],
                opacity: 0.6,
                textShadow: `0 0 5px ${colors[0]}`
              }}
            >
              {seal.isCenter ? 'MASTER' : `SEAL ${seal.number}`}
            </div>
          )}
        </motion.div>
      ))}

      {/* Orbiting mystical runes */}
      {runes.map(rune => (
        <motion.div
          key={rune.id}
          className="absolute left-1/2 top-1/2 font-serif text-lg"
          style={{
            color: colors[rune.id % 2],
            opacity: 0.5,
            textShadow: `0 0 10px ${colors[rune.id % 2]}`
          }}
          animate={{
            rotate: 360,
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            rotate: {
              duration: rune.speed,
              repeat: Infinity,
              ease: "linear",
              delay: rune.delay
            },
            opacity: {
              duration: 3,
              repeat: Infinity,
              delay: rune.delay
            }
          }}
        >
          <div
            style={{
              transform: `translateX(${rune.orbit}%) rotate(-360deg)`,
              transformOrigin: 'center'
            }}
          >
            {rune.symbol}
          </div>
        </motion.div>
      ))}

      {/* Energy particles flowing between seals */}
      {!isPreview && Array.from({ length: isMobile ? 10 : 20 }).map((_, i) => {
        const sealIndex = i % 7;
        const targetSealIndex = (i + 1) % 7;
        
        return (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full"
            style={{
              width: '3px',
              height: '3px',
              background: colors[i % 2],
              boxShadow: `0 0 8px ${colors[i % 2]}`
            }}
            animate={{
              x: [`${seals[sealIndex].x}%`, `${seals[targetSealIndex].x}%`],
              y: [`${seals[sealIndex].y}%`, `${seals[targetSealIndex].y}%`],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "linear"
            }}
          />
        );
      })}

      {/* Enlightenment flash - moment of perfection */}
      {isEnlightened && (
        <>
          {/* Bright flash */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 1 }}
            style={{
              background: `radial-gradient(circle at center, ${colors[0]} 0%, ${colors[1]} 50%, transparent 100%)`,
              mixBlendMode: 'screen'
            }}
          />

          {/* Expanding sacred geometry */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 3, opacity: [0, 1, 0] }}
            transition={{ duration: 1 }}
          >
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="80" fill="none" stroke={colors[0]} strokeWidth="2" opacity="0.5" />
              <circle cx="100" cy="100" r="60" fill="none" stroke={colors[1]} strokeWidth="2" opacity="0.5" />
              <circle cx="100" cy="100" r="40" fill="none" stroke={colors[0]} strokeWidth="2" opacity="0.5" />
              {/* Flower of life petals */}
              {Array.from({ length: 6 }).map((_, i) => {
                const angle = (i * 60) * Math.PI / 180;
                const cx = 100 + Math.cos(angle) * 40;
                const cy = 100 + Math.sin(angle) * 40;
                return (
                  <circle 
                    key={i} 
                    cx={cx} 
                    cy={cy} 
                    r="40" 
                    fill="none" 
                    stroke={colors[1]} 
                    strokeWidth="1" 
                    opacity="0.3" 
                  />
                );
              })}
            </svg>
          </motion.div>

          {/* Enlightenment text */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-serif text-2xl font-bold"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: [0, 1, 0] }}
            transition={{ duration: 1 }}
            style={{
              color: colors[0],
              textShadow: `0 0 30px ${colors[0]}, 0 0 60px ${colors[1]}`
            }}
          >
            ✧ 777 ✧
          </motion.div>
        </>
      )}

      {/* Background sacred text scroll */}
      <div
        className="absolute inset-0 font-serif text-xs opacity-5 overflow-hidden pointer-events-none"
        style={{
          color: colors[0],
          lineHeight: '2'
        }}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i}>
            ✧ Seven Seals ✧ Seven Virtues ✧ Seven Wonders ✧ Sevenfold Path ✧
          </div>
        ))}
      </div>

      {/* Hidden eighth seal (infinity symbol) - only appears when enlightened */}
      {isEnlightened && (
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.8 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            color: colors[0],
            textShadow: `0 0 40px ${colors[0]}, 0 0 80px ${colors[1]}`
          }}
        >
          ∞
        </motion.div>
      )}
    </div>
  );
}
