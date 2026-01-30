// 🌟 RARE TIER HORIZONS - NEXT-LEVEL SPECTACULAR EFFECTS
// These are EVEN MORE IMPRESSIVE than Uncommon tier!

// 1. ERA ENTHUSIAST - SPACE-TIME OBSERVATORY
if (titleName === 'Era Enthusiast') {
  const stars = useMemo(() => Array.from({ length: 40 }, (_, i) => ({
    id: i,
    top: Math.random() * 70,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    size: 1 + Math.random() * 2
  })), []);

  return (
    <motion.div 
      className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      style={performanceStyle}
    >
      {/* DEEP SPACE NEBULA - Multi-layer cosmic clouds */}
      <motion.div 
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(ellipse at 30% 50%, #06b6d4 0%, #1e3a5f 40%, #0a0e27 100%)',
            'radial-gradient(ellipse at 70% 50%, #0891b2 0%, #1e3a8f 40%, #0a0e27 100%)',
            'radial-gradient(ellipse at 30% 50%, #06b6d4 0%, #1e3a5f 40%, #0a0e27 100%)'
          ]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      
      {/* NEBULA CLOUDS - Volumetric fog layers */}
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={`nebula-${i}`}
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at ${30 + i * 15}% ${40 + i * 10}%, 
              rgba(6, 182, 212, ${0.15 - i * 0.02}), 
              transparent 60%)`,
            filter: `blur(${40 + i * 20}px)`
          }}
          animate={{
            x: [0, (i % 2 ? 50 : -50), 0],
            y: [0, (i % 2 ? -30 : 30), 0],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 30 + i * 5,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      ))}
      
      {/* 3D TRON GRID FLOOR - Enhanced perspective */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-2/3 opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, rgba(6, 182, 212, .4) 25%, rgba(6, 182, 212, .4) 26%, transparent 27%, transparent 74%, rgba(6, 182, 212, .4) 75%, rgba(6, 182, 212, .4) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(6, 182, 212, .4) 25%, rgba(6, 182, 212, .4) 26%, transparent 27%, transparent 74%, rgba(6, 182, 212, .4) 75%, rgba(6, 182, 212, .4) 76%, transparent 77%, transparent)
          `,
          backgroundSize: '50px 50px',
          transform: 'perspective(400px) rotateX(65deg) translateY(120px)',
          filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.5))'
        }}
        animate={{ 
          backgroundPosition: ['0px 0px', '0px 50px'],
        }}
        transition={{ 
          duration: 8, 
          repeat: Infinity, 
          ease: 'linear' 
        }}
      />
      
      {/* SHOOTING STARS - Multiple meteors */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={`meteor-${i}`}
          className="absolute w-1 h-1 bg-cyan-200 rounded-full"
          style={{
            left: `${10 + i * 15}%`,
            top: '10%',
            boxShadow: '0 0 8px rgba(6, 182, 212, 0.9)'
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            x: [0, 100],
            y: [0, 80],
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 5 + i * 2,
            delay: i * 1.2,
            ease: 'easeOut'
          }}
        >
          {/* Trail */}
          <motion.div
            className="absolute right-full top-0 h-px bg-gradient-to-r from-transparent to-cyan-300"
            style={{ width: '40px' }}
          />
        </motion.div>
      ))}
      
      {/* CONSTELLATION STARS - Twinkling with depth */}
      <div className="absolute inset-0">
        {stars.map((s) => (
          <motion.div
            key={s.id}
            className="absolute rounded-full bg-cyan-200"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              boxShadow: `0 0 ${s.size * 4}px rgba(6, 182, 212, 0.8)`,
              filter: `blur(${s.size * 0.3}px)`
            }}
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{
              duration: s.duration,
              repeat: Infinity,
              delay: s.delay
            }}
          />
        ))}
        
        {/* CONSTELLATION LINES - Animated connections */}
        <svg className="absolute inset-0 w-full h-full opacity-40">
          {Array.from({ length: 6 }).map((_, i) => {
            const x1 = 15 + i * 15;
            const y1 = 20 + i * 8;
            const x2 = x1 + 15;
            const y2 = y1 + 12;
            return (
              <motion.line
                key={`line-${i}`}
                x1={`${x1}%`}
                y1={`${y1}%`}
                x2={`${x2}%`}
                y2={`${y2}%`}
                stroke="rgba(6, 182, 212, 0.6)"
                strokeWidth="1"
                strokeDasharray="4,4"
                initial={{ pathLength: 0 }}
                animate={{ 
                  pathLength: 1,
                  strokeDashoffset: [0, -8]
                }}
                transition={{ 
                  pathLength: { duration: 4, repeat: Infinity },
                  strokeDashoffset: { duration: 2, repeat: Infinity, ease: 'linear' }
                }}
              />
            );
          })}
        </svg>
      </div>
      
      {/* COSMIC DUST PARTICLES */}
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={`dust-${i}`}
          className="absolute w-px h-px bg-cyan-300 rounded-full"
          style={{
            left: `${(i * 7) % 100}%`,
            top: `${(i * 13) % 70}%`,
            opacity: 0.3
          }}
          animate={{
            y: [0, -100],
            x: [(i % 2 ? -20 : 20), (i % 2 ? 20 : -20)],
            opacity: [0, 0.6, 0]
          }}
          transition={{
            duration: 10 + (i % 5),
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'linear'
          }}
        />
      ))}
      
      {/* PULSING CELESTIAL GATEWAY */}
      <motion.div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 rounded-full"
        style={{
          width: '120px',
          height: '120px',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.3), transparent 70%)',
          filter: 'blur(20px)'
        }}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 4,
          repeat: Infinity
        }}
      />
      
      {cosmicEvents}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
    </motion.div>
  );
}

// 2. STORY CURATOR - THEATRICAL GRAND STAGE
if (titleName === 'Story Curator') {
  const masks = useMemo(() => Array.from({ length: 5 }, (_, i) => ({
    id: i,
    left: 15 + i * 18,
    top: 35 + (i % 3) * 15,
    delay: i * 1.1,
    emoji: i % 2 === 0 ? '🎭' : '🎪'
  })), []);

  return (
    <motion.div 
      className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      style={performanceStyle}
    >
      {/* GRAND THEATER HALL - Rich burgundy */}
      <motion.div 
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(circle at 50% 100%, #b45309 0%, #7f1d1d 50%, #1a0505 100%)',
            'radial-gradient(circle at 50% 100%, #d97706 0%, #991b1b 50%, #1a0505 100%)',
            'radial-gradient(circle at 50% 100%, #b45309 0%, #7f1d1d 50%, #1a0505 100%)'
          ]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      
      {/* VELVET CURTAIN TEXTURE */}
      <motion.div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            repeating-linear-gradient(90deg, 
              transparent, transparent 8px, 
              rgba(255,255,255,0.1) 8px, rgba(255,255,255,0.1) 9px
            )
          `
        }}
        animate={{
          backgroundPosition: ['0px 0px', '16px 0px']
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
      
      {/* THEATRICAL SPOTLIGHTS - Multiple moving beams */}
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={`spotlight-${i}`}
          className="absolute -top-20 opacity-30 pointer-events-none"
          style={{
            left: `${20 + i * 20}%`,
            width: '80px',
            height: '150%',
            background: 'conic-gradient(from 180deg at 50% 0%, transparent 165deg, rgba(251, 191, 36, 0.6) 180deg, transparent 195deg)',
            filter: 'blur(15px)',
            transformOrigin: 'top center'
          }}
          animate={{ 
            rotate: [i % 2 ? -15 : 15, i % 2 ? 15 : -15, i % 2 ? -15 : 15],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ 
            duration: 6 + i,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.5
          }}
        />
      ))}
      
      {/* THEATER CURTAINS - Animated drapes */}
      <motion.div
        className="absolute top-0 left-0 w-full h-16"
        style={{
          background: 'linear-gradient(to bottom, #7f1d1d 0%, transparent 100%)',
          boxShadow: 'inset 0 8px 20px rgba(0,0,0,0.6)'
        }}
      />
      
      {/* STAGE SMOKE/FOG EFFECT */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={`fog-${i}`}
          className="absolute bottom-0 rounded-full"
          style={{
            left: `${10 + i * 15}%`,
            width: `${80 + i * 20}px`,
            height: `${40 + i * 10}px`,
            background: 'radial-gradient(ellipse, rgba(180, 83, 9, 0.2), transparent 70%)',
            filter: `blur(${15 + i * 5}px)`
          }}
          animate={{
            y: [0, -80, -120],
            scale: [1, 1.5, 0.5],
            opacity: [0, 0.5, 0]
          }}
          transition={{
            duration: 8 + i,
            repeat: Infinity,
            delay: i * 1.5,
            ease: 'easeOut'
          }}
        />
      ))}
      
      {/* THEATER MASKS & PROPS - Floating */}
      {masks.map((m) => (
        <motion.div
          key={m.id}
          className="absolute text-4xl"
          style={{
            left: `${m.left}%`,
            top: `${m.top}%`,
            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.7))'
          }}
          animate={{ 
            y: [0, -25, 0],
            opacity: [0.4, 0.8, 0.4],
            rotate: [-15, 15, -15],
            scale: [0.9, 1.1, 0.9]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            delay: m.delay,
            ease: 'easeInOut'
          }}
        >
          {m.emoji}
        </motion.div>
      ))}
      
      {/* GOLDEN SPARKLES - Stage magic */}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute w-1 h-1 rounded-full bg-amber-300"
          style={{
            left: `${(i * 11) % 100}%`,
            top: `${(i * 17) % 70}%`,
            boxShadow: '0 0 6px rgba(251, 191, 36, 0.9)'
          }}
          animate={{
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0],
            rotate: [0, 180]
          }}
          transition={{
            duration: 2 + (i % 3) * 0.5,
            repeat: Infinity,
            delay: i * 0.15,
            repeatDelay: 2
          }}
        />
      ))}
      
      {/* AUDIENCE APPLAUSE EFFECT - Light ripples */}
      <motion.div
        className="absolute bottom-20 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent"
        animate={{
          opacity: [0, 0.6, 0],
          scaleX: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatDelay: 5
        }}
      />
      
      {cosmicEvents}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
    </motion.div>
  );
}

// 3. CHRONICLER - ANCIENT MANUSCRIPT WITH CALLIGRAPHY
if (titleName === 'Chronicler') {
  const inkDrops = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    id: i,
    left: 15 + i * 12,
    delay: i * 0.8
  })), []);

  return (
    <motion.div 
      className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      style={performanceStyle}
    >
      {/* PARCHMENT PAPER GRADIENT */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #34d399 100%)',
        }}
      />
      
      {/* AGED PAPER TEXTURE - Enhanced */}
      <div 
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z' fill='%23ffffff' fill-opacity='0.15' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: '50px 50px'
        }}
      />
      
      {/* ANIMATED CALLIGRAPHY - Writing effect */}
      <svg className="absolute inset-0 w-full h-full opacity-40">
        {Array.from({ length: 8 }).map((_, i) => {
          const y = 20 + i * 10;
          return (
            <g key={`text-line-${i}`}>
              <motion.path
                d={`M 10,${y} Q 50,${y - 2} 90,${y}`}
                stroke="rgba(52, 211, 153, 0.6)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: [0, 1, 1, 0] }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  delay: i * 0.6,
                  times: [0, 0.5, 0.8, 1]
                }}
              />
            </g>
          );
        })}
      </svg>
      
      {/* INK WELL DRIPS - Falling ink */}
      {inkDrops.map((drop) => (
        <motion.div
          key={drop.id}
          className="absolute"
          style={{
            left: `${drop.left}%`,
            top: '5%'
          }}
        >
          <motion.div
            className="w-2 h-3 rounded-full"
            style={{
              background: 'linear-gradient(to bottom, rgba(5, 150, 105, 0.8), rgba(5, 150, 105, 0.4))'
            }}
            animate={{
              y: [0, 100],
              scaleY: [1, 1.5, 1],
              opacity: [0, 0.8, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: drop.delay,
              ease: 'easeIn'
            }}
          />
        </motion.div>
      ))}
      
      {/* FLOATING MANUSCRIPT PAGES */}
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={`page-${i}`}
          className="absolute w-16 h-20 border border-emerald-300 rounded"
          style={{
            left: `${20 + i * 20}%`,
            top: `${30 + (i % 2) * 20}%`,
            background: 'rgba(6, 78, 59, 0.3)',
            backdropFilter: 'blur(2px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
          }}
          animate={{
            y: [0, -30, 0],
            rotate: [0, (i % 2 ? 10 : -10), 0],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{
            duration: 6 + i,
            repeat: Infinity,
            delay: i * 1.2
          }}
        >
          {/* Simulated text lines */}
          <div className="absolute top-3 left-2 right-2 space-y-1">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="h-px bg-emerald-400/50" />
            ))}
          </div>
        </motion.div>
      ))}
      
      {/* QUILL PEN WRITING - Animated */}
      <motion.div
        className="absolute text-2xl"
        style={{
          top: '40%',
          left: '60%',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))'
        }}
        animate={{
          x: [0, 20, 40, 20, 0],
          y: [0, -2, 0, -2, 0],
          rotate: [0, -5, 0, -5, 0]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        ✒️
      </motion.div>
      
      {/* BOOK SPINE SHADOWS */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-0 left-1/4 w-px h-full bg-green-900" />
        <div className="absolute top-0 left-1/2 w-3 h-full bg-black/30 blur-sm" />
        <div className="absolute top-0 left-3/4 w-px h-full bg-green-900" />
      </div>
      
      {/* ILLUMINATED LETTER SPARKLES */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={`illumination-${i}`}
          className="absolute w-1 h-1 rounded-full bg-emerald-200"
          style={{
            left: `${(i * 13) % 100}%`,
            top: `${(i * 19) % 70}%`,
            boxShadow: '0 0 4px rgba(52, 211, 153, 0.9)'
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3,
            repeatDelay: 3
          }}
        />
      ))}
      
      {cosmicEvents}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
    </motion.div>
  );
}

// Continue in next file...
