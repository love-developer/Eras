// Part 2 of NEW SPECTACULAR Uncommon Horizon effects

  if (titleName === 'Memory Broadcaster') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Holographic rose gradient */}
        <motion.div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #FB7185 0%, #E11D48 100%)',
          }}
        />
        
        {/* HOLOGRAPHIC SCAN EFFECT - TV static transmission */}
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              rgba(251, 113, 133, 0.1) 0px,
              transparent 2px,
              transparent 4px,
              rgba(251, 113, 133, 0.1) 6px
            )`
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            backgroundPosition: ['0px 0px', '0px 8px']
          }}
          transition={{
            opacity: { duration: 2, repeat: Infinity },
            backgroundPosition: { duration: 0.5, repeat: Infinity, ease: 'linear' }
          }}
        />
        
        {/* BROADCAST SIGNAL TOWERS with expanding waves */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={`tower-${i}`}
            className="absolute bottom-20"
            style={{ left: `${25 + i * 25}%` }}
          >
            {/* Tower */}
            <div className="relative">
              <div className="w-1 h-16 bg-rose-300 mx-auto" />
              <div className="w-3 h-3 bg-rose-400 rounded-full mx-auto -mt-1 shadow-lg shadow-rose-400/50" />
            </div>
            
            {/* Expanding broadcast waves */}
            {Array.from({ length: 4 }).map((_, j) => (
              <motion.div
                key={`wave-${j}`}
                className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full border-2 border-rose-300"
                style={{
                  width: `${40 + j * 30}px`,
                  height: `${20 + j * 15}px`,
                }}
                animate={{
                  scale: [1, 2.5],
                  opacity: [0.7, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.8 + j * 0.6,
                  ease: 'easeOut'
                }}
              />
            ))}
          </div>
        ))}
        
        {/* HOLOGRAPHIC MEMORY FRAGMENTS */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={`fragment-${i}`}
            className="absolute"
            style={{
              left: `${(i * 15) % 100}%`,
              top: `${(i * 20) % 60}%`,
              width: `${30 + (i % 3) * 15}px`,
              height: `${20 + (i % 2) * 10}px`,
              background: `rgba(251, 113, 133, ${0.2 + (i % 3) * 0.1})`,
              border: '1px solid rgba(251, 113, 133, 0.4)',
              backdropFilter: 'blur(2px)'
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 0.7, 0],
              rotateY: [0, 180, 360]
            }}
            transition={{
              duration: 4 + (i % 3),
              repeat: Infinity,
              delay: i * 0.5
            }}
          />
        ))}
        
        {/* GLITCH EFFECT - Digital artifacts */}
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={`glitch-${i}`}
            className="absolute inset-0"
            style={{
              background: `linear-gradient(90deg, 
                transparent ${i * 15}%, 
                rgba(251, 113, 133, 0.1) ${i * 15 + 1}%, 
                transparent ${i * 15 + 2}%)`,
              mixBlendMode: 'screen'
            }}
            animate={{
              x: [0, -10, 10, 0],
              opacity: [0, 0.5, 0]
            }}
            transition={{
              duration: 0.2,
              repeat: Infinity,
              repeatDelay: 4 + i * 0.3,
              delay: i * 0.5
            }}
          />
        ))}
        
        {cosmicEvents}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  if (titleName === 'Ritual Keeper') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Mystical emerald gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
          }}
        />
        
        {/* MYSTICAL FOG LAYERS - Depth with parallax */}
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={`fog-${i}`}
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at ${30 + i * 15}% ${60 - i * 10}%, 
                rgba(52, 211, 153, ${0.15 + i * 0.05}), 
                transparent 70%)`,
              filter: `blur(${20 + i * 10}px)`
            }}
            animate={{
              x: [(i % 2 ? -30 : 30), (i % 2 ? 30 : -30), (i % 2 ? -30 : 30)],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 15 + i * 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        ))}
        
        {/* FLOATING MYSTICAL LANTERNS with depth */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={`lantern-${i}`}
            className="absolute"
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + (i % 3) * 20}%`,
              filter: `blur(${(i % 3) * 0.5}px)` // depth effect
            }}
          >
            {/* Lantern body */}
            <motion.div
              className="relative"
              animate={{
                y: [0, -20, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 4 + (i % 3),
                repeat: Infinity,
                delay: i * 0.5
              }}
            >
              <div 
                className="w-8 h-10 rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.4), rgba(5, 150, 105, 0.6))',
                  border: '1px solid rgba(52, 211, 153, 0.6)',
                  boxShadow: '0 0 20px rgba(52, 211, 153, 0.5)'
                }}
              />
              {/* Inner glow */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-6 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.9), rgba(52, 211, 153, 0.6))',
                  filter: 'blur(2px)'
                }}
                animate={{
                  opacity: [0.6, 1, 0.6],
                  scale: [0.9, 1.1, 0.9]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity
                }}
              />
            </motion.div>
            
            {/* Light rays emanating down */}
            <motion.div
              className="absolute top-full left-1/2 -translate-x-1/2 w-16 h-24"
              style={{
                background: 'linear-gradient(to bottom, rgba(52, 211, 153, 0.3), transparent)',
                clipPath: 'polygon(30% 0%, 70% 0%, 80% 100%, 20% 100%)'
              }}
              animate={{
                opacity: [0.4, 0.7, 0.4]
              }}
              transition={{
                duration: 2,
                repeat: Infinity
              }}
            />
          </motion.div>
        ))}
        
        {/* FIREFLIES - Magical atmosphere */}
        {Array.from({ length: 25 }).map((_, i) => (
          <motion.div
            key={`firefly-${i}`}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: '#D1FAE5',
              boxShadow: '0 0 6px rgba(209, 250, 229, 0.9)',
              left: `${(i * 11) % 100}%`,
              top: `${(i * 17) % 80}%`,
            }}
            animate={{
              x: [0, (i % 2 ? 15 : -15), (i % 2 ? -10 : 10), 0],
              y: [0, -25, -10, 0],
              opacity: [0.3, 1, 0.3],
              scale: [0.5, 1.5, 0.5]
            }}
            transition={{
              duration: 5 + (i % 4),
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut'
            }}
          />
        ))}
        
        {cosmicEvents}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  if (titleName === 'Vault Starter') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Security blue gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)',
          }}
        />
        
        {/* SECURITY LASER SCAN GRID */}
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={`scan-h-${i}`}
            className="absolute left-0 right-0 h-px"
            style={{
              top: `${20 + i * 15}%`,
              background: 'linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.8), transparent)',
              boxShadow: '0 0 10px rgba(96, 165, 250, 0.8)'
            }}
            animate={{
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.4
            }}
          />
        ))}
        
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={`scan-v-${i}`}
            className="absolute top-0 bottom-0 w-px"
            style={{
              left: `${10 + i * 11}%`,
              background: 'linear-gradient(180deg, transparent, rgba(96, 165, 250, 0.6), transparent)',
              boxShadow: '0 0 8px rgba(96, 165, 250, 0.6)'
            }}
            animate={{
              opacity: [0, 0.8, 0]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: i * 0.3
            }}
          />
        ))}
        
        {/* SWEEPING SECURITY BEAM */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.4), transparent)',
            width: '30%',
          }}
          animate={{
            x: ['-30%', '130%']
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear',
            repeatDelay: 2
          }}
        />
        
        {/* CHROMATIC ABERRATION on beam */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(147, 197, 253, 0.3), transparent)',
            width: '30%',
          }}
          animate={{
            x: ['-32%', '128%']
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear',
            repeatDelay: 2,
            delay: 0.02
          }}
        />
        
        {/* VAULT LOCK MECHANISM - Rotating */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <motion.div
            className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-blue-300"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            {/* Lock tumblers */}
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 w-2 h-12 bg-blue-300 origin-bottom -translate-x-1/2"
                style={{
                  transform: `rotate(${i * 60}deg) translateY(-50%)`
                }}
                animate={{
                  scaleY: [1, 0.7, 1]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.15
                }}
              />
            ))}
          </motion.div>
        </div>
        
        {/* SECURE DATA PARTICLES */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={`data-${i}`}
            className="absolute text-xs opacity-70"
            style={{
              left: `${(i * 13) % 100}%`,
              top: `${(i * 19) % 80}%`,
              color: '#BFDBFE',
              fontFamily: 'monospace',
              textShadow: '0 0 4px rgba(191, 219, 254, 0.6)'
            }}
            animate={{
              y: [0, -50],
              opacity: [0, 0.7, 0]
            }}
            transition={{
              duration: 3 + (i % 3),
              repeat: Infinity,
              delay: i * 0.3
            }}
          >
            {i % 2 === 0 ? '🔒' : '01'}
          </motion.div>
        ))}
        
        {cosmicEvents}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  if (titleName === 'Multimedia Virtuoso') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Stage cyan gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
          }}
        />
        
        {/* STAGE SPOTLIGHTS with volumetric lighting */}
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={`spotlight-${i}`}
            className="absolute top-0"
            style={{
              left: `${10 + i * 15}%`,
              width: '60px',
              height: '100%',
              background: `linear-gradient(to bottom, 
                rgba(6, 182, 212, ${0.4 - i * 0.03}), 
                rgba(6, 182, 212, ${0.1 - i * 0.01}), 
                transparent 70%)`,
              clipPath: 'polygon(35% 0%, 65% 0%, 75% 100%, 25% 100%)',
              filter: 'blur(2px)'
            }}
            animate={{
              opacity: [0.3, 0.7, 0.3],
              x: [0, (i % 2 ? 20 : -20), 0]
            }}
            transition={{
              duration: 3 + (i % 3),
              repeat: Infinity,
              delay: i * 0.5
            }}
          />
        ))}
        
        {/* BOKEH LIGHT PARTICLES - Out of focus lights */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={`bokeh-${i}`}
            className="absolute rounded-full"
            style={{
              width: `${15 + (i % 4) * 10}px`,
              height: `${15 + (i % 4) * 10}px`,
              background: `radial-gradient(circle, 
                rgba(165, 243, 252, ${0.4 + (i % 3) * 0.1}), 
                rgba(6, 182, 212, ${0.2 + (i % 2) * 0.1}), 
                transparent)`,
              left: `${(i * 11) % 100}%`,
              top: `${(i * 17) % 80}%`,
              filter: `blur(${4 + (i % 3) * 2}px)`
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 0.8, 0.4],
              y: [0, -20, 0]
            }}
            transition={{
              duration: 4 + (i % 4),
              repeat: Infinity,
              delay: i * 0.3
            }}
          />
        ))}
        
        {/* MEDIA FORMAT ICONS - Floating and rotating */}
        {['📸', '🎬', '🎵', '📝', '🎨', '🎭', '🎪', '🎯'].map((icon, i) => (
          <motion.div
            key={`media-${i}`}
            className="absolute text-3xl"
            style={{
              left: `${15 + i * 11}%`,
              top: `${25 + (i % 3) * 20}%`,
              opacity: 0.6,
              filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.6))'
            }}
            animate={{
              y: [0, -30, 0],
              rotate: [0, 15, -15, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 5 + (i % 3),
              repeat: Infinity,
              delay: i * 0.4
            }}
          >
            {icon}
          </motion.div>
        ))}
        
        {/* LIGHT LENS FLARE */}
        <motion.div
          className="absolute"
          style={{
            left: '60%',
            top: '30%',
          }}
          animate={{
            left: ['60%', '40%', '60%'],
            top: ['30%', '50%', '30%']
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <div className="w-16 h-16 rounded-full bg-cyan-300/40 blur-2xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/50 blur-md" />
        </motion.div>
        
        {cosmicEvents}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  if (titleName === 'Word Painter') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Artistic indigo gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)',
          }}
        />
        
        {/* INK FLUID DYNAMICS - Flowing paint */}
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={`ink-flow-${i}`}
            className="absolute"
            style={{
              top: `${10 + i * 15}%`,
              left: '-10%',
              width: '120%',
              height: `${30 + (i % 3) * 20}px`,
              background: `radial-gradient(ellipse, 
                rgba(129, 140, 248, ${0.2 + (i % 3) * 0.05}), 
                transparent 70%)`,
              filter: `blur(${15 + i * 5}px)`
            }}
            animate={{
              x: [0, 40, -20, 0],
              scaleX: [1, 1.2, 0.9, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        ))}
        
        {/* CALLIGRAPHY BRUSH STROKES - Animated writing */}
        <svg className="absolute inset-0 w-full h-full opacity-50">
          {Array.from({ length: 6 }).map((_, i) => {
            const startX = 10 + i * 15;
            const startY = 20 + i * 10;
            return (
              <motion.path
                key={`stroke-${i}`}
                d={`M ${startX},${startY} Q ${startX + 20},${startY + 10} ${startX + 40},${startY + 5}`}
                stroke="rgba(129, 140, 248, 0.6)"
                strokeWidth={3 + (i % 2)}
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: [0, 1],
                  opacity: [0, 0.8, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 2,
                  delay: i * 0.6
                }}
              />
            );
          })}
        </svg>
        
        {/* INK DROPLETS - Dripping effect */}
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={`droplet-${i}`}
            className="absolute rounded-full"
            style={{
              width: `${4 + (i % 3) * 2}px`,
              height: `${6 + (i % 3) * 3}px`,
              background: `rgba(99, 102, 241, ${0.6 + (i % 3) * 0.1})`,
              left: `${(i * 13) % 100}%`,
              top: '10%',
              filter: 'blur(1px)'
            }}
            animate={{
              y: [0, 120],
              opacity: [0, 0.8, 0],
              scaleY: [1, 1.5, 1]
            }}
            transition={{
              duration: 3 + (i % 3),
              repeat: Infinity,
              delay: i * 0.5,
              ease: 'easeIn'
            }}
          />
        ))}
        
        {/* COLOR MIXING EFFECT - Paint palette */}
        {Array.from({ length: 8 }).map((_, i) => {
          const colors = ['#818CF8', '#A78BFA', '#C4B5FD', '#DDD6FE'];
          return (
            <motion.div
              key={`color-mix-${i}`}
              className="absolute rounded-full"
              style={{
                width: `${20 + (i % 4) * 10}px`,
                height: `${20 + (i % 4) * 10}px`,
                background: colors[i % colors.length],
                left: `${(i * 18) % 100}%`,
                top: `${(i * 25) % 70}%`,
                filter: 'blur(8px)',
                mixBlendMode: 'screen'
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.7, 0.3]
              }}
              transition={{
                duration: 4 + (i % 3),
                repeat: Infinity,
                delay: i * 0.4
              }}
            />
          );
        })}
        
        {/* SHIMMER TEXT PARTICLES */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={`text-${i}`}
            className="absolute"
            style={{
              left: `${(i * 11) % 100}%`,
              top: `${(i * 17) % 80}%`,
              fontSize: `${8 + (i % 3) * 4}px`,
              color: '#C4B5FD',
              opacity: 0.6,
              fontWeight: 'bold',
              textShadow: '0 0 8px rgba(196, 181, 253, 0.8)'
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0, 0.8, 0],
              rotate: [0, (i % 2 ? 10 : -10), 0]
            }}
            transition={{
              duration: 3 + (i % 3),
              repeat: Infinity,
              delay: i * 0.25
            }}
          >
            {String.fromCharCode(65 + (i % 26))}
          </motion.div>
        ))}
        
        {cosmicEvents}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  if (titleName === 'Frequency Keeper') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Audio pink gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #F472B6 0%, #EC4899 100%)',
          }}
        />
        
        {/* WAVEFORM OSCILLOSCOPE - Animated sine waves */}
        <svg className="absolute inset-0 w-full h-full opacity-60">
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.path
              key={`wave-${i}`}
              d={`M 0,${50 + i * 10} Q 25,${30 + i * 10} 50,${50 + i * 10} T 100,${50 + i * 10} T 150,${50 + i * 10} T 200,${50 + i * 10}`}
              stroke={`rgba(244, 114, 182, ${0.7 - i * 0.1})`}
              strokeWidth={2 + i * 0.5}
              fill="none"
              animate={{
                d: [
                  `M 0,${50 + i * 10} Q 25,${30 + i * 10} 50,${50 + i * 10} T 100,${50 + i * 10} T 150,${50 + i * 10} T 200,${50 + i * 10}`,
                  `M 0,${50 + i * 10} Q 25,${70 + i * 10} 50,${50 + i * 10} T 100,${50 + i * 10} T 150,${50 + i * 10} T 200,${50 + i * 10}`,
                  `M 0,${50 + i * 10} Q 25,${30 + i * 10} 50,${50 + i * 10} T 100,${50 + i * 10} T 150,${50 + i * 10} T 200,${50 + i * 10}`
                ]
              }}
              transition={{
                duration: 2 + i * 0.5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          ))}
        </svg>
        
        {/* SPECTRUM ANALYZER BARS - Reactive frequency bands */}
        <div className="absolute bottom-20 left-0 right-0 flex justify-center items-end gap-1">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={`freq-${i}`}
              className="w-2 bg-pink-300 rounded-t"
              style={{
                opacity: 0.7 + (i % 3) * 0.1
              }}
              animate={{
                height: [`${15 + Math.random() * 20}px`, `${40 + Math.random() * 60}px`, `${15 + Math.random() * 20}px`]
              }}
              transition={{
                duration: 0.4 + (i % 5) * 0.1,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.02
              }}
            />
          ))}
        </div>
        
        {/* SOUND WAVE PARTICLES - Traveling audio signals */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={`sound-particle-${i}`}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: '#FDF2F8',
              boxShadow: '0 0 10px rgba(244, 114, 182, 0.8)',
              left: '0%',
              top: `${40 + (i % 5) * 10}%`,
            }}
            animate={{
              x: [0, '100vw'],
              scale: [1, 1.5, 1],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 3 + (i % 3),
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'linear'
            }}
          />
        ))}
        
        {/* AUDIO RINGS - Pulsing frequency circles */}
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={`audio-ring-${i}`}
            className="absolute top-1/3 left-1/2 -translate-x-1/2 rounded-full border-2 border-pink-300"
            style={{
              width: `${60 + i * 40}px`,
              height: `${60 + i * 40}px`,
            }}
            animate={{
              scale: [1, 1.5],
              opacity: [0.6, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.6,
              ease: 'easeOut'
            }}
          />
        ))}
        
        {/* BASS PULSE - Low frequency thump */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at center, rgba(244, 114, 182, 0.1), transparent 60%)'
          }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity
          }}
        />
        
        {cosmicEvents}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  if (titleName === 'Quantum Scheduler') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Quantum purple gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)',
          }}
        />
        
        {/* QUANTUM FIELD GRID - Particle probability cloud */}
        <motion.div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(167, 139, 250, 0.3) 1px, transparent 1px)`,
            backgroundSize: '25px 25px'
          }}
          animate={{
            backgroundPosition: ['0px 0px', '25px 25px'],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            backgroundPosition: { duration: 4, repeat: Infinity, ease: 'linear' },
            opacity: { duration: 2, repeat: Infinity }
          }}
        />
        
        {/* QUANTUM ENTANGLEMENT - Connected particle pairs */}
        <svg className="absolute inset-0 w-full h-full opacity-40">
          {Array.from({ length: 8 }).map((_, i) => {
            const x1 = 20 + (i % 4) * 20;
            const y1 = 30 + Math.floor(i / 4) * 40;
            const x2 = x1 + 30;
            const y2 = y1 + (i % 2 ? 20 : -20);
            return (
              <g key={`entangle-${i}`}>
                {/* Connection line */}
                <motion.line
                  x1={`${x1}%`}
                  y1={`${y1}%`}
                  x2={`${x2}%`}
                  y2={`${y2}%`}
                  stroke="rgba(167, 139, 250, 0.6)"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                  animate={{
                    strokeDashoffset: [0, -8],
                    opacity: [0.4, 0.8, 0.4]
                  }}
                  transition={{
                    strokeDashoffset: { duration: 1, repeat: Infinity, ease: 'linear' },
                    opacity: { duration: 2, repeat: Infinity, delay: i * 0.2 }
                  }}
                />
                {/* Particle 1 */}
                <motion.circle
                  cx={`${x1}%`}
                  cy={`${y1}%`}
                  r="3"
                  fill="rgba(167, 139, 250, 0.8)"
                  animate={{
                    r: [3, 5, 3],
                    opacity: [0.6, 1, 0.6]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
                {/* Particle 2 */}
                <motion.circle
                  cx={`${x2}%`}
                  cy={`${y2}%`}
                  r="3"
                  fill="rgba(124, 58, 237, 0.8)"
                  animate={{
                    r: [3, 5, 3],
                    opacity: [0.6, 1, 0.6]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              </g>
            );
          })}
        </svg>
        
        {/* QUANTUM TUNNELING - Particles phasing through barriers */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={`tunnel-${i}`}
            className="absolute w-3 h-3 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(196, 181, 253, 0.9), rgba(167, 139, 250, 0.6))',
              boxShadow: '0 0 12px rgba(167, 139, 250, 0.8)',
              left: `${5 + (i * 8) % 90}%`,
              top: `${30 + (i % 4) * 15}%`,
            }}
            animate={{
              x: [0, 50, 100],
              opacity: [0, 1, 0.3, 1, 0],
              scale: [0.5, 1, 0.8, 1, 0.5]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeInOut'
            }}
          />
        ))}
        
        {/* PROBABILITY WAVE - Schrödinger wave function */}
        <svg className="absolute inset-0 w-full h-full opacity-50">
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.path
              key={`probability-${i}`}
              d={`M 0,${60 + i * 15} Q 50,${40 + i * 15} 100,${60 + i * 15} T 200,${60 + i * 15}`}
              stroke={`rgba(167, 139, 250, ${0.6 - i * 0.15})`}
              strokeWidth="3"
              fill="none"
              animate={{
                d: [
                  `M 0,${60 + i * 15} Q 50,${40 + i * 15} 100,${60 + i * 15} T 200,${60 + i * 15}`,
                  `M 0,${60 + i * 15} Q 50,${80 + i * 15} 100,${60 + i * 15} T 200,${60 + i * 15}`,
                  `M 0,${60 + i * 15} Q 50,${40 + i * 15} 100,${60 + i * 15} T 200,${60 + i * 15}`
                ]
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />
          ))}
        </svg>
        
        {/* ENERGY LEVELS - Atomic orbital transitions */}
        {Array.from({ length: 25 }).map((_, i) => (
          <motion.div
            key={`orbital-${i}`}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              background: '#DDD6FE',
              boxShadow: '0 0 8px rgba(221, 214, 254, 0.9)',
              left: '50%',
              top: '50%',
            }}
            animate={{
              x: [
                0,
                Math.cos((i * 2 * Math.PI) / 25) * 100,
                Math.cos((i * 2 * Math.PI) / 25) * 60,
                0
              ],
              y: [
                0,
                Math.sin((i * 2 * Math.PI) / 25) * 70,
                Math.sin((i * 2 * Math.PI) / 25) * 40,
                0
              ],
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              delay: i * 0.15
            }}
          />
        ))}
        
        {cosmicEvents}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  if (titleName === 'Community Weaver') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Social rose gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #FB7185 0%, #E11D48 100%)',
          }}
        />
        
        {/* NEURAL NETWORK - Brain-like connections */}
        <svg className="absolute inset-0 w-full h-full opacity-50">
          {/* Nodes */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 2 * Math.PI) / 12;
            const cx = 50 + Math.cos(angle) * 35;
            const cy = 50 + Math.sin(angle) * 30;
            return (
              <motion.circle
                key={`node-${i}`}
                cx={`${cx}%`}
                cy={`${cy}%`}
                r="5"
                fill="rgba(251, 113, 133, 0.8)"
                stroke="rgba(251, 113, 133, 0.6)"
                strokeWidth="2"
                animate={{
                  r: [5, 8, 5],
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.15
                }}
              />
            );
          })}
          
          {/* Connections - Full mesh network */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle1 = (i * 2 * Math.PI) / 12;
            const cx1 = 50 + Math.cos(angle1) * 35;
            const cy1 = 50 + Math.sin(angle1) * 30;
            
            return Array.from({ length: 3 }).map((_, j) => {
              const targetIdx = (i + j + 3) % 12;
              const angle2 = (targetIdx * 2 * Math.PI) / 12;
              const cx2 = 50 + Math.cos(angle2) * 35;
              const cy2 = 50 + Math.sin(angle2) * 30;
              
              return (
                <motion.line
                  key={`conn-${i}-${j}`}
                  x1={`${cx1}%`}
                  y1={`${cy1}%`}
                  x2={`${cx2}%`}
                  y2={`${cy2}%`}
                  stroke="rgba(251, 113, 133, 0.4)"
                  strokeWidth="1.5"
                  animate={{
                    opacity: [0.2, 0.6, 0.2]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.2 + j * 0.5
                  }}
                />
              );
            });
          })}
        </svg>
        
        {/* SYNAPTIC PULSES - Data traveling through network */}
        {Array.from({ length: 20 }).map((_, i) => {
          const angle = (i * 2 * Math.PI) / 20;
          const startX = 50 + Math.cos(angle) * 10;
          const startY = 50 + Math.sin(angle) * 8;
          const endX = 50 + Math.cos(angle) * 35;
          const endY = 50 + Math.sin(angle) * 30;
          
          return (
            <motion.div
              key={`pulse-${i}`}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: '#FECDD3',
                boxShadow: '0 0 8px rgba(251, 113, 133, 0.9)',
                left: `${startX}%`,
                top: `${startY}%`,
              }}
              animate={{
                left: [`${startX}%`, `${endX}%`],
                top: [`${startY}%`, `${endY}%`],
                scale: [1, 1.5, 0.5],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.25,
                ease: 'easeInOut'
              }}
            />
          );
        })}
        
        {/* COMMUNITY AVATARS - Floating user icons */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={`avatar-${i}`}
            className="absolute w-8 h-8 rounded-full border-2 border-rose-300"
            style={{
              left: `${15 + i * 12}%`,
              top: `${25 + (i % 3) * 20}%`,
              background: `linear-gradient(135deg, 
                rgba(251, 113, 133, ${0.4 + (i % 3) * 0.1}), 
                rgba(225, 29, 72, ${0.3 + (i % 2) * 0.1}))`,
              boxShadow: '0 0 12px rgba(251, 113, 133, 0.5)'
            }}
            animate={{
              y: [0, -15, 0],
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 4 + (i % 3),
              repeat: Infinity,
              delay: i * 0.4
            }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs">
              👤
            </div>
          </motion.div>
        ))}
        
        {/* INFORMATION PACKETS - Data exchange */}
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={`packet-${i}`}
            className="absolute text-xs opacity-70"
            style={{
              left: `${(i * 13) % 100}%`,
              top: `${(i * 19) % 80}%`,
              color: '#FECDD3',
              fontWeight: 'bold'
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0, 0.7, 0],
              scale: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 3 + (i % 3),
              repeat: Infinity,
              delay: i * 0.3
            }}
          >
            {i % 3 === 0 ? '💬' : i % 3 === 1 ? '❤️' : '🤝'}
          </motion.div>
        ))}
        
        {cosmicEvents}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
  
  if (titleName === 'Echo Artisan') {
    return (
      <motion.div 
        className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        style={performanceStyle}
      >
        {/* Water emerald gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
          }}
        />
        
        {/* CAUSTIC LIGHT PATTERNS - Underwater light refraction */}
        <motion.svg
          className="absolute inset-0 w-full h-full opacity-40"
          animate={{
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.path
              key={`caustic-${i}`}
              d={`M ${i * 20},0 Q ${i * 20 + 10},30 ${i * 20 + 20},20 T ${i * 20 + 40},40 T ${i * 20 + 60},30`}
              stroke="rgba(167, 243, 208, 0.6)"
              strokeWidth="2"
              fill="none"
              animate={{
                d: [
                  `M ${i * 20},0 Q ${i * 20 + 10},30 ${i * 20 + 20},20 T ${i * 20 + 40},40 T ${i * 20 + 60},30`,
                  `M ${i * 20},0 Q ${i * 20 + 15},25 ${i * 20 + 20},35 T ${i * 20 + 40},25 T ${i * 20 + 60},40`,
                  `M ${i * 20},0 Q ${i * 20 + 10},30 ${i * 20 + 20},20 T ${i * 20 + 40},40 T ${i * 20 + 60},30`
                ],
                opacity: [0.4, 0.7, 0.4]
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.3
              }}
            />
          ))}
        </motion.svg>
        
        {/* WATER RIPPLES - Multiple expanding circles */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`ripple-center-${i}`}
            style={{
              position: 'absolute',
              left: `${25 + i * 20}%`,
              top: `${30 + (i % 2) * 25}%`
            }}
          >
            {Array.from({ length: 5 }).map((_, j) => (
              <motion.div
                key={`ripple-${i}-${j}`}
                className="absolute rounded-full border-2 border-emerald-300"
                style={{
                  width: `${30 + j * 25}px`,
                  height: `${30 + j * 25}px`,
                  left: '50%',
                  top: '50%',
                  marginLeft: `${-(15 + j * 12.5)}px`,
                  marginTop: `${-(15 + j * 12.5)}px`,
                }}
                animate={{
                  scale: [1, 2.5],
                  opacity: [0.7, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  delay: i * 1.2 + j * 0.7,
                  ease: 'easeOut'
                }}
              />
            ))}
          </div>
        ))}
        
        {/* WATER DROPLETS with splash */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`drop-${i}`}
            style={{
              position: 'absolute',
              left: `${(i * 17) % 100}%`,
              top: '10%'
            }}
          >
            {/* Falling droplet */}
            <motion.div
              className="w-2 h-3 rounded-full"
              style={{
                background: 'linear-gradient(to bottom, rgba(209, 250, 229, 0.9), rgba(52, 211, 153, 0.7))',
                boxShadow: '0 0 6px rgba(52, 211, 153, 0.6)'
              }}
              animate={{
                y: [0, 80],
                opacity: [0, 1, 0],
                scaleY: [1, 1.5, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.5,
                ease: 'easeIn'
              }}
            />
            
            {/* Splash on impact */}
            <motion.div
              className="absolute"
              style={{
                top: '80px',
                left: '50%',
                transform: 'translateX(-50%)'
              }}
              animate={{
                opacity: [0, 0, 1, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.5,
                times: [0, 0.9, 0.95, 1]
              }}
            >
              {/* Splash droplets */}
              {Array.from({ length: 6 }).map((_, j) => {
                const angle = (j * 60) * (Math.PI / 180);
                return (
                  <motion.div
                    key={j}
                    className="absolute w-1 h-1 rounded-full bg-emerald-200"
                    animate={{
                      x: [0, Math.cos(angle) * 15],
                      y: [0, Math.sin(angle) * 10 - 5],
                      opacity: [0, 0, 0.8, 0],
                      scale: [0, 1, 0.5]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.5,
                      times: [0, 0.9, 0.95, 1]
                    }}
                  />
                );
              })}
            </motion.div>
          </div>
        ))}
        
        {/* FLOATING BUBBLES - Rising through water */}
        {Array.from({ length: 18 }).map((_, i) => (
          <motion.div
            key={`bubble-${i}`}
            className="absolute rounded-full border border-emerald-200"
            style={{
              width: `${5 + (i % 4) * 3}px`,
              height: `${5 + (i % 4) * 3}px`,
              background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), rgba(52, 211, 153, 0.3))',
              boxShadow: 'inset 0 0 5px rgba(255, 255, 255, 0.5)',
              left: `${(i * 11) % 100}%`,
              bottom: '0%'
            }}
            animate={{
              y: [0, -200],
              x: [(i % 2 ? -10 : 10), (i % 2 ? 10 : -10), (i % 2 ? -10 : 10)],
              opacity: [0, 0.8, 0],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{
              duration: 5 + (i % 4),
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeOut'
            }}
          />
        ))}
        
        {/* SURFACE SHIMMER - Light reflection */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-20"
          style={{
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.2), transparent)',
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 3,
            repeat: Infinity
          }}
        />
        
        {cosmicEvents}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
      </motion.div>
    );
  }
