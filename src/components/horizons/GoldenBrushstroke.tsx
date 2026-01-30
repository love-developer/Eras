import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface GoldenBrushstrokeProps {
  colors: string[];
  isPreview?: boolean;
}

/**
 * 💎 CRYSTALLINE MEMORY PRISM - Master Curator Achievement
 * Giant floating crystal with light refraction, rainbow beams, and perfect clarity moments
 * Features: Geometric crystal, light caustics, orbiting gems, spectrum breakdown, clarity bursts
 */
export function GoldenBrushstroke({ colors, isPreview = false }: GoldenBrushstrokeProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [perfectClarity, setPerfectClarity] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);

  // Perfect clarity moment every 10 seconds
  useEffect(() => {
    if (isPreview) return;
    const interval = setInterval(() => {
      setPerfectClarity(true);
      setTimeout(() => setPerfectClarity(false), 2500);
    }, 10000);
    return () => clearInterval(interval);
  }, [isPreview]);

  // Track rotation for facet effects
  useEffect(() => {
    if (isPreview) return;
    const interval = setInterval(() => {
      setCurrentRotation(prev => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, [isPreview]);

  // Spectrum colors - proper ROY G BIV
  const spectrumColors = [
    { name: 'Red', color: '#FF0000', glow: 'rgba(255, 0, 0, 0.4)' },
    { name: 'Orange', color: '#FF7F00', glow: 'rgba(255, 127, 0, 0.4)' },
    { name: 'Yellow', color: '#FFFF00', glow: 'rgba(255, 255, 0, 0.4)' },
    { name: 'Green', color: '#00FF00', glow: 'rgba(0, 255, 0, 0.4)' },
    { name: 'Blue', color: '#0000FF', glow: 'rgba(0, 0, 255, 0.4)' },
    { name: 'Indigo', color: '#4B0082', glow: 'rgba(75, 0, 130, 0.4)' },
    { name: 'Violet', color: '#9400D3', glow: 'rgba(148, 0, 211, 0.4)' }
  ];

  // Orbiting small crystals
  const orbitingCrystals = useMemo(() => {
    return Array.from({ length: isMobile ? 8 : 12 }, (_, i) => ({
      id: i,
      angle: (i * 360) / (isMobile ? 8 : 12),
      distance: isMobile ? 120 : 200,
      size: isMobile ? 20 : 30,
      speed: 15 + (i % 3) * 5,
      color: spectrumColors[i % spectrumColors.length].color
    }));
  }, [isMobile]);

  // Caustic pattern generators
  const causticPatterns = useMemo(() => {
    return Array.from({ length: isMobile ? 4 : 8 }, (_, i) => ({
      id: i,
      x: 20 + (i % 4) * 20,
      y: 20 + Math.floor(i / 4) * 30,
      scale: 0.8 + Math.random() * 0.6,
      delay: i * 0.8
    }));
  }, [isMobile]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950/40 to-slate-950">
      {/* Deep space background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(30,27,75,0.4) 0%, rgba(0,0,0,0) 70%)',
        }}
      />

      {/* Golden light source from above - "sunlight" */}
      <motion.div
        className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 pointer-events-none"
        animate={{
          opacity: perfectClarity ? [0.6, 1, 0.6] : [0.3, 0.5, 0.3],
          scale: perfectClarity ? [1, 1.3, 1] : [1, 1.05, 1]
        }}
        transition={{
          duration: perfectClarity ? 2.5 : 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          background: 'radial-gradient(circle, #FFD700 0%, #FFA500 30%, transparent 70%)',
          filter: 'blur(40px)'
        }}
      />

      {/* Light caustics dancing on background */}
      {causticPatterns.map(pattern => (
        <motion.div
          key={pattern.id}
          className="absolute pointer-events-none"
          style={{
            left: `${pattern.x}%`,
            top: `${pattern.y}%`,
            width: isMobile ? '100px' : '200px',
            height: isMobile ? '100px' : '200px',
            background: 'radial-gradient(ellipse, rgba(255,215,0,0.15) 0%, transparent 60%)',
            filter: 'blur(20px)',
            mixBlendMode: 'screen'
          }}
          animate={{
            scale: [pattern.scale, pattern.scale * 1.4, pattern.scale],
            opacity: [0.3, 0.6, 0.3],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            delay: pattern.delay,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Rainbow light beams shooting through crystal */}
      {spectrumColors.map((spectrum, i) => (
        <React.Fragment key={spectrum.name}>
          {/* Main beam from crystal to edges */}
          <motion.div
            className="absolute left-1/2 top-1/2 origin-left pointer-events-none"
            style={{
              width: '150%',
              height: isMobile ? '4px' : '6px',
              background: `linear-gradient(90deg, ${spectrum.color}00 0%, ${spectrum.color} 20%, ${spectrum.color} 80%, ${spectrum.color}00 100%)`,
              filter: 'blur(3px)',
              boxShadow: `0 0 20px ${spectrum.glow}`,
              transform: `rotate(${i * 360 / spectrumColors.length}deg)`,
              transformOrigin: 'left center'
            }}
            animate={{
              opacity: perfectClarity ? [0.6, 1, 0.6] : [0.3, 0.5, 0.3],
              scaleX: perfectClarity ? [1, 1.2, 1] : [0.9, 1.1, 0.9]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
          />

          {/* Secondary scattered beams */}
          <motion.div
            className="absolute left-1/2 top-1/2 origin-left pointer-events-none"
            style={{
              width: '100%',
              height: isMobile ? '2px' : '3px',
              background: `linear-gradient(90deg, ${spectrum.color}00 0%, ${spectrum.color} 30%, ${spectrum.color}00 100%)`,
              filter: 'blur(2px)',
              transform: `rotate(${i * 360 / spectrumColors.length + 15}deg)`,
              transformOrigin: 'left center',
              opacity: 0.4
            }}
            animate={{
              opacity: [0.2, 0.4, 0.2],
              scaleX: [0.8, 1, 0.8]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.3 + 1,
              ease: "easeInOut"
            }}
          />
        </React.Fragment>
      ))}

      {/* Main central crystal - geometric prism */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          className="relative"
          style={{
            width: isMobile ? '180px' : '280px',
            height: isMobile ? '180px' : '280px',
            transformStyle: 'preserve-3d'
          }}
          animate={{
            rotateY: perfectClarity ? [0, 360] : [0, 360],
            rotateX: perfectClarity ? [0, 360] : [0, 15, 0],
            rotateZ: [0, 360]
          }}
          transition={{
            rotateY: { duration: perfectClarity ? 2.5 : 20, ease: "linear", repeat: Infinity },
            rotateX: { duration: perfectClarity ? 2.5 : 8, ease: "easeInOut", repeat: Infinity },
            rotateZ: { duration: perfectClarity ? 2.5 : 30, ease: "linear", repeat: Infinity }
          }}
        >
          {/* Crystal core - octahedron shape with facets */}
          {/* Top pyramid */}
          <motion.div
            className="absolute inset-0"
            style={{
              clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
              background: `linear-gradient(135deg, 
                rgba(255,215,0,0.9) 0%, 
                rgba(255,215,0,0.6) 25%,
                rgba(255,255,255,0.9) 50%,
                rgba(255,215,0,0.6) 75%,
                rgba(255,215,0,0.9) 100%
              )`,
              boxShadow: `
                inset -20px -20px 40px rgba(255,255,255,0.4),
                inset 20px 20px 40px rgba(255,165,0,0.4),
                0 0 80px rgba(255,215,0,0.6),
                0 0 40px rgba(255,215,0,0.8)
              `,
              backdropFilter: 'blur(2px)',
              border: '2px solid rgba(255,255,255,0.3)'
            }}
            animate={{
              boxShadow: perfectClarity
                ? [
                    '0 0 80px rgba(255,215,0,0.6), 0 0 120px rgba(255,215,0,1), 0 0 160px rgba(255,255,255,1)',
                    '0 0 120px rgba(255,215,0,1), 0 0 160px rgba(255,215,0,1), 0 0 200px rgba(255,255,255,1)',
                    '0 0 80px rgba(255,215,0,0.6), 0 0 120px rgba(255,215,0,1), 0 0 160px rgba(255,255,255,1)'
                  ]
                : undefined
            }}
            transition={{
              duration: 2.5,
              ease: "easeInOut"
            }}
          />

          {/* Facet highlights - diamond cut edges */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 360) / 8;
            return (
              <motion.div
                key={`facet-${i}`}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  width: '60%',
                  height: '60%',
                  background: `linear-gradient(${angle}deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)`,
                  transform: `rotate(${angle}deg)`,
                  filter: 'blur(1px)',
                  mixBlendMode: 'screen'
                }}
                animate={{
                  opacity: [0.3, 0.8, 0.3]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.25,
                  ease: "easeInOut"
                }}
              />
            );
          })}

          {/* Central brilliant - most intense point */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: isMobile ? '40px' : '60px',
              height: isMobile ? '40px' : '60px',
              background: 'radial-gradient(circle, #FFFFFF 0%, #FFD700 50%, transparent 70%)',
              filter: 'blur(8px)',
              mixBlendMode: 'screen'
            }}
            animate={{
              scale: perfectClarity ? [1, 2, 1] : [1, 1.3, 1],
              opacity: perfectClarity ? [0.8, 1, 0.8] : [0.6, 0.9, 0.6]
            }}
            transition={{
              duration: perfectClarity ? 2.5 : 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Memory fragments in facets - tiny golden sparkles */}
          {Array.from({ length: isMobile ? 12 : 24 }).map((_, i) => {
            const angle = Math.random() * 360;
            const distance = 30 + Math.random() * 40;
            return (
              <motion.div
                key={`fragment-${i}`}
                className="absolute left-1/2 top-1/2"
                style={{
                  width: '3px',
                  height: '3px',
                  background: spectrumColors[i % spectrumColors.length].color,
                  borderRadius: '50%',
                  boxShadow: `0 0 6px ${spectrumColors[i % spectrumColors.length].glow}`,
                  transform: `rotate(${angle}deg) translate(${distance}px) rotate(-${angle}deg)`
                }}
                animate={{
                  opacity: [0.4, 1, 0.4],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeInOut"
                }}
              />
            );
          })}
        </motion.div>
      </div>

      {/* Orbiting smaller crystals */}
      {orbitingCrystals.map(crystal => (
        <motion.div
          key={crystal.id}
          className="absolute left-1/2 top-1/2"
          style={{
            width: `${crystal.size}px`,
            height: `${crystal.size}px`,
            marginLeft: `-${crystal.size / 2}px`,
            marginTop: `-${crystal.size / 2}px`
          }}
          animate={{
            rotate: [0, 360]
          }}
          transition={{
            duration: crystal.speed,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <motion.div
            className="absolute"
            style={{
              width: '100%',
              height: '100%',
              transform: `translateX(${crystal.distance}px)`,
              transformOrigin: 'center'
            }}
          >
            <motion.div
              className="w-full h-full"
              style={{
                clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                background: `linear-gradient(135deg, ${crystal.color}CC 0%, #FFFFFFCC 50%, ${crystal.color}CC 100%)`,
                boxShadow: `0 0 20px ${crystal.color}80, inset -4px -4px 8px rgba(255,255,255,0.4)`,
                filter: 'blur(0.5px)'
              }}
              animate={{
                rotate: [0, 360],
                scale: perfectClarity ? [1, 1.5, 1] : [0.9, 1.1, 0.9]
              }}
              transition={{
                rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: crystal.id * 0.2 }
              }}
            />
          </motion.div>
        </motion.div>
      ))}

      {/* Spectrum breakdown labels - ROY G BIV */}
      {!isMobile && (
        <div className="absolute right-8 top-1/2 -translate-y-1/2 space-y-2">
          {spectrumColors.map((spectrum, i) => (
            <motion.div
              key={spectrum.name}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ 
                opacity: perfectClarity ? 1 : [0.4, 0.7, 0.4],
                x: perfectClarity ? 0 : [20, 0, 20]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            >
              <motion.div
                className="w-12 h-1 rounded-full"
                style={{
                  background: spectrum.color,
                  boxShadow: `0 0 10px ${spectrum.glow}`
                }}
                animate={{
                  scaleX: perfectClarity ? [1, 1.5, 1] : [0.8, 1, 0.8]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.15
                }}
              />
              <span 
                className="text-xs font-medium tracking-wider"
                style={{ 
                  color: spectrum.color,
                  textShadow: `0 0 10px ${spectrum.glow}`
                }}
              >
                {spectrum.name.toUpperCase()}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Jeweler's loupe - magnification tool */}
      {!isMobile && (
        <motion.div
          className="absolute bottom-8 left-8"
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div 
            className="relative w-16 h-16"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
              border: '3px solid rgba(192,192,192,0.6)',
              borderRadius: '50%',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.2)'
            }}
          >
            {/* Handle */}
            <div
              className="absolute -bottom-2 right-0 w-2 h-8 origin-top"
              style={{
                background: 'linear-gradient(180deg, #C0C0C0 0%, #808080 100%)',
                borderRadius: '2px',
                transform: 'rotate(45deg)',
                boxShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}
            />
            
            {/* Lens reflection */}
            <motion.div
              className="absolute top-2 left-2 w-4 h-4 rounded-full"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, transparent 60%)',
                filter: 'blur(1px)'
              }}
              animate={{
                opacity: [0.6, 1, 0.6]
              }}
              transition={{
                duration: 2,
                repeat: Infinity
              }}
            />
          </div>
        </motion.div>
      )}

      {/* Light box indicator */}
      {!isMobile && (
        <motion.div
          className="absolute bottom-8 right-8 px-4 py-2 rounded-lg flex items-center gap-2"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,215,0,0.1) 100%)',
            border: '1px solid rgba(255,215,0,0.3)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)'
          }}
          animate={{
            boxShadow: perfectClarity
              ? '0 4px 24px rgba(255,215,0,0.6), inset 0 1px 2px rgba(255,255,255,0.4)'
              : '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.2)'
          }}
        >
          <motion.div
            className="w-3 h-3 rounded-full"
            style={{
              background: perfectClarity ? '#00FF00' : '#FFD700',
              boxShadow: perfectClarity 
                ? '0 0 12px #00FF00' 
                : '0 0 8px #FFD700'
            }}
            animate={{
              scale: perfectClarity ? [1, 1.3, 1] : 1
            }}
            transition={{
              duration: 0.5,
              repeat: perfectClarity ? 5 : 0
            }}
          />
          <span className="text-xs font-medium text-amber-200 tracking-wider">
            {perfectClarity ? 'FLAWLESS' : 'CLARITY'}
          </span>
        </motion.div>
      )}

      {/* Perfect clarity moment - white flash and alignment */}
      {perfectClarity && (
        <>
          {/* White flash overlay */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
            style={{
              background: 'radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, rgba(255,215,0,0.4) 40%, transparent 70%)',
              mixBlendMode: 'screen'
            }}
          />

          {/* Radial burst lines */}
          {Array.from({ length: isMobile ? 12 : 24 }).map((_, i) => {
            const angle = (i * 360) / (isMobile ? 12 : 24);
            return (
              <motion.div
                key={`burst-${i}`}
                className="absolute left-1/2 top-1/2 origin-left"
                style={{
                  width: '50%',
                  height: '2px',
                  background: `linear-gradient(90deg, #FFFFFF 0%, ${spectrumColors[i % spectrumColors.length].color} 50%, transparent 100%)`,
                  transform: `rotate(${angle}deg)`,
                  filter: 'blur(1px)'
                }}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ 
                  scaleX: [0, 1, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 1.5,
                  ease: "easeOut",
                  delay: i * 0.02
                }}
              />
            );
          })}

          {/* "PERFECT CLARITY" text */}
          <motion.div
            className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 text-center"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1.2, 1],
              opacity: [0, 1, 0.8, 0]
            }}
            transition={{ 
              duration: 2.5,
              times: [0, 0.3, 0.7, 1],
              ease: "easeOut" 
            }}
          >
            <div 
              className="text-2xl md:text-4xl font-bold tracking-widest mb-2"
              style={{
                color: '#FFFFFF',
                textShadow: '0 0 30px #FFFFFF, 0 0 60px #FFD700, 0 4px 8px rgba(0,0,0,0.3)',
                WebkitTextStroke: '1px rgba(255,215,0,0.5)'
              }}
            >
              PERFECT CLARITY
            </div>
            <div 
              className="text-sm md:text-lg tracking-widest"
              style={{
                color: '#FFD700',
                textShadow: '0 0 20px #FFD700'
              }}
            >
              100+ ENHANCEMENTS
            </div>
          </motion.div>

          {/* Diamond sparkles burst */}
          {Array.from({ length: isMobile ? 8 : 16 }).map((_, i) => {
            const angle = (i * 360) / (isMobile ? 8 : 16);
            const distance = isMobile ? 80 : 150;
            return (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute left-1/2 top-1/2 text-2xl"
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 0,
                  scale: 0
                }}
                animate={{
                  x: Math.cos(angle * Math.PI / 180) * distance,
                  y: Math.sin(angle * Math.PI / 180) * distance,
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 2,
                  ease: "easeOut",
                  delay: i * 0.05
                }}
                style={{
                  filter: 'drop-shadow(0 0 10px #FFFFFF)'
                }}
              >
                💎
              </motion.div>
            );
          })}
        </>
      )}

      {/* Floating enhancement counter crystals */}
      {!isPreview && Array.from({ length: isMobile ? 3 : 6 }).map((_, i) => (
        <motion.div
          key={`float-${i}`}
          className="absolute text-xl"
          style={{
            left: `${15 + Math.random() * 70}%`,
            bottom: '10%'
          }}
          animate={{
            y: [0, -150, -300],
            opacity: [0, 1, 0],
            rotate: [0, 180, 360],
            scale: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            delay: i * 2.5,
            ease: "easeOut"
          }}
        >
          <div style={{ filter: `drop-shadow(0 0 10px ${spectrumColors[i % spectrumColors.length].color})` }}>
            💎
          </div>
        </motion.div>
      ))}
    </div>
  );
}