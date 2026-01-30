// This file contains the NEW SPECTACULAR Uncommon Horizon effects
// To be inserted into HeaderBackground.tsx

  if (titleName === 'Neon Dreamer') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Electric cyberpunk gradient with glow */}
        <motion.div 
          className="absolute inset-0"
          animate={{
            background: [
              'radial-gradient(ellipse at 30% 50%, #22D3EE 0%, #0C4A6E 100%)',
              'radial-gradient(ellipse at 70% 50%, #06B6D4 0%, #0369A1 100%)',
              'radial-gradient(ellipse at 30% 50%, #22D3EE 0%, #0C4A6E 100%)'
            ]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        
        {/* 3D LIGHTNING BOLTS - Multiple layers with depth */}
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.svg
            key={`lightning-${i}`}
            className="absolute inset-0 w-full h-full"
            style={{
              opacity: 0.7,
              filter: `drop-shadow(0 0 ${8 + i * 2}px rgba(34, 211, 238, 0.8))`
            }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 0.3,
              repeat: Infinity,
              repeatDelay: 3 + i * 0.5,
              delay: i * 0.7
            }}
          >
            <motion.path
              d={`M ${20 + i * 15} 0 L ${25 + i * 15} 40 L ${22 + i * 15} 40 L ${27 + i * 15} 100`}
              stroke="#22D3EE"
              strokeWidth={2 + i * 0.5}
              fill="none"
              strokeLinecap="round"
              animate={{
                d: [
                  `M ${20 + i * 15} 0 L ${25 + i * 15} 40 L ${22 + i * 15} 40 L ${27 + i * 15} 100`,
                  `M ${22 + i * 15} 0 L ${27 + i * 15} 35 L ${24 + i * 15} 35 L ${29 + i * 15} 100`,
                  `M ${20 + i * 15} 0 L ${25 + i * 15} 40 L ${22 + i * 15} 40 L ${27 + i * 15} 100`
                ]
              }}
              transition={{
                duration: 0.1,
                repeat: Infinity,
                repeatDelay: 3 + i * 0.5,
                delay: i * 0.7
              }}
            />
          </motion.svg>
        ))}
        
        {/* DIGITAL RAIN EFFECT - Matrix-style */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={`rain-${i}`}
            className="absolute top-0 w-px bg-gradient-to-b from-cyan-400 via-cyan-300 to-transparent"
            style={{
              left: `${(i * 5) % 100}%`,
              height: `${30 + (i % 3) * 20}px`,
            }}
            animate={{
              y: ['-100%', '300%'],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 2 + (i % 3),
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'linear'
            }}
          />
        ))}
        
        {/* HOLOGRAPHIC SCAN LINES */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(34, 211, 238, 0.03) 0px, transparent 2px)',
          }}
          animate={{
            backgroundPosition: ['0px 0px', '0px 4px']
          }}
          transition={{
            duration: 0.1,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
        
        {/* ELECTRIC PARTICLES with trails */}
        {Array.from({ length: 25 }).map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full"
            style={{
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              background: '#22D3EE',
              boxShadow: `0 0 ${10 + (i % 3) * 5}px rgba(34, 211, 238, 0.9)`,
              left: `${(i * 7) % 100}%`,
              top: `${(i * 11) % 80}%`,
            }}
            animate={{
              x: [(i % 2 ? -50 : 50), (i % 2 ? 50 : -50)],
              y: [0, -40, 0],
              opacity: [0, 1, 0],
              scale: [0.5, 1.5, 0.5]
            }}
            transition={{
              duration: 3 + (i % 4),
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut'
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
        {/* AURORA BOREALIS - Shifting ethereal colors */}
        <motion.div 
          className="absolute inset-0"
          animate={{
            background: [
              'linear-gradient(135deg, #818CF8 0%, #6366F1 50%, #4F46E5 100%)',
              'linear-gradient(135deg, #A78BFA 0%, #818CF8 50%, #6366F1 100%)',
              'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #7C3AED 100%)',
              'linear-gradient(135deg, #818CF8 0%, #6366F1 50%, #4F46E5 100%)'
            ]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        
        {/* AURORA WAVES - Flowing light curtains */}
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={`aurora-${i}`}
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, 
                transparent 0%, 
                rgba(129, 140, 248, ${0.3 - i * 0.05}) 40%, 
                rgba(167, 139, 250, ${0.2 - i * 0.03}) 60%, 
                transparent 100%)`,
              transformOrigin: 'top',
            }}
            animate={{
              scaleY: [1, 1.2, 0.9, 1],
              x: [0, 30, -20, 0],
              opacity: [0.6, 0.8, 0.6]
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              delay: i * 1.5,
              ease: 'easeInOut'
            }}
          />
        ))}
        
        {/* DREAMY FLOATING ORBS with blur */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={`orb-${i}`}
            className="absolute rounded-full"
            style={{
              width: `${20 + (i % 4) * 15}px`,
              height: `${20 + (i % 4) * 15}px`,
              background: `radial-gradient(circle, 
                rgba(${i % 2 ? '129, 140, 248' : '167, 139, 250'}, 0.6), 
                transparent)`,
              filter: `blur(${8 + (i % 3) * 4}px)`,
              left: `${(i * 17) % 100}%`,
              top: `${(i * 23) % 80}%`,
            }}
            animate={{
              y: [0, -60, 0],
              x: [(i % 2 ? -20 : 20), (i % 2 ? 20 : -20), (i % 2 ? -20 : 20)],
              scale: [1, 1.4, 1],
              opacity: [0.3, 0.7, 0.3]
            }}
            transition={{
              duration: 6 + (i % 4),
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'easeInOut'
            }}
          />
        ))}
        
        {/* PAINT SPLATTER EXPLOSIONS */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={`splatter-${i}`}
            className="absolute"
            style={{
              left: `${(i * 25) % 100}%`,
              top: `${(i * 30) % 70}%`,
            }}
          >
            {/* Main splatter */}
            <motion.div
              className="absolute w-8 h-8 rounded-full"
              style={{
                background: i % 3 === 0 ? '#818CF8' : i % 3 === 1 ? '#A78BFA' : '#6366F1',
                filter: 'blur(2px)'
              }}
              animate={{
                scale: [0, 1.5, 1],
                opacity: [0, 0.7, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 4,
                delay: i * 0.6
              }}
            />
            {/* Splatter droplets */}
            {Array.from({ length: 6 }).map((_, j) => {
              const angle = (j * 60) * (Math.PI / 180);
              return (
                <motion.div
                  key={j}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    background: '#C4B5FD',
                    left: '50%',
                    top: '50%'
                  }}
                  animate={{
                    x: [0, Math.cos(angle) * 30],
                    y: [0, Math.sin(angle) * 30],
                    scale: [0, 1, 0.5],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 4.5,
                    delay: i * 0.6 + j * 0.05
                  }}
                />
              );
            })}
          </motion.div>
        ))}
        
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
        {/* PRISMATIC GRADIENT - Color refraction */}
        <motion.div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
          }}
        />
        
        {/* CRYSTAL FACETS - 3D prismatic reflections */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={`facet-${i}`}
            className="absolute"
            style={{
              left: `${15 + i * 12}%`,
              top: `${20 + (i % 3) * 20}%`,
              width: `${40 + (i % 3) * 20}px`,
              height: `${60 + (i % 3) * 30}px`,
              background: `linear-gradient(${45 + i * 30}deg, 
                rgba(20, 184, 166, 0.3), 
                rgba(94, 234, 212, 0.5), 
                rgba(20, 184, 166, 0.3))`,
              clipPath: 'polygon(50% 0%, 100% 40%, 75% 100%, 25% 100%, 0% 40%)',
              transform: `rotate(${i * 15}deg)`,
              filter: 'drop-shadow(0 0 10px rgba(94, 234, 212, 0.5))'
            }}
            animate={{
              rotate: [i * 15, i * 15 + 20, i * 15],
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{
              duration: 4 + (i % 3),
              repeat: Infinity,
              delay: i * 0.4
            }}
          />
        ))}
        
        {/* CHROMATIC ABERRATION EFFECT - Light splitting */}
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={`chroma-${i}`}
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at ${50 + i * 10}% 50%, 
                rgba(${i === 0 ? '20, 184, 166' : i === 1 ? '94, 234, 212' : '45, 212, 191'}, 0.15), 
                transparent 60%)`,
            }}
            animate={{
              x: [0, (i - 1) * 3, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
        
        {/* LIGHT REFRACTION PARTICLES - Rainbow sparkles */}
        {Array.from({ length: 30 }).map((_, i) => {
          const colors = ['#14B8A6', '#5EEAD4', '#2DD4BF', '#99F6E4'];
          return (
            <motion.div
              key={`refract-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${2 + (i % 3)}px`,
                height: `${2 + (i % 3)}px`,
                background: colors[i % colors.length],
                boxShadow: `0 0 ${8 + (i % 3) * 4}px ${colors[i % colors.length]}`,
                left: `${(i * 7) % 100}%`,
                top: `${(i * 13) % 80}%`,
              }}
              animate={{
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0],
                rotate: [0, 180]
              }}
              transition={{
                duration: 2 + (i % 3) * 0.5,
                repeat: Infinity,
                delay: i * 0.1,
                repeatDelay: 1
              }}
            />
          );
        })}
        
        {/* SCULPTING HAMMER IMPACTS - Flash effects */}
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={`impact-${i}`}
            className="absolute"
            style={{
              left: `${20 + i * 18}%`,
              top: `${40 + (i % 2) * 20}%`,
            }}
          >
            <motion.div
              className="w-12 h-12 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.8), transparent)',
              }}
              animate={{
                scale: [0, 2, 0],
                opacity: [0, 0.8, 0]
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                repeatDelay: 3 + i * 0.5,
                delay: i * 0.7
              }}
            />
          </motion.div>
        ))}
        
        {cosmicEvents}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
