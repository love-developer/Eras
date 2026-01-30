// 🌟 RARE TIER HORIZONS - Part 2

// 4. MOMENT HARVESTER - GOLDEN WHEAT FIELDS AT SUNSET
if (titleName === 'Moment Harvester') {
  return (
    <motion.div 
      className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      style={performanceStyle}
    >
      {/* GOLDEN HOUR SKY - Animated sunset */}
      <motion.div 
        className="absolute inset-0"
        animate={{
          background: [
            'linear-gradient(180deg, #fbbf24 0%, #f59e0b 40%, #78350f 100%)',
            'linear-gradient(180deg, #fcd34d 0%, #fbbf24 40%, #92400e 100%)',
            'linear-gradient(180deg, #fbbf24 0%, #f59e0b 40%, #78350f 100%)'
          ]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      
      {/* SUN DISK - Large glowing sun */}
      <motion.div
        className="absolute rounded-full"
        style={{
          top: '20%',
          right: '20%',
          width: '80px',
          height: '80px',
          background: 'radial-gradient(circle, rgba(255, 251, 235, 0.9), rgba(251, 191, 36, 0.6))',
          boxShadow: '0 0 60px rgba(251, 191, 36, 0.8)',
          filter: 'blur(2px)'
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.8, 1, 0.8]
        }}
        transition={{
          duration: 4,
          repeat: Infinity
        }}
      >
        {/* Sun rays */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={`sun-ray-${i}`}
            className="absolute top-1/2 left-1/2 origin-left"
            style={{
              width: '100px',
              height: '3px',
              background: 'linear-gradient(to right, rgba(251, 191, 36, 0.6), transparent)',
              transform: `rotate(${i * 30}deg)`,
              transformOrigin: 'left center'
            }}
            animate={{
              opacity: [0.3, 0.7, 0.3],
              scaleX: [0.8, 1.2, 0.8]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.1
            }}
          />
        ))}
      </motion.div>
      
      {/* WHEAT FIELD - Swaying stalks with depth */}
      <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden">
        {/* Background wheat */}
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={`wheat-bg-${i}`}
            className="absolute bottom-0 w-1 bg-gradient-to-t from-yellow-700 to-yellow-500 rounded-t-full origin-bottom"
            style={{
              left: `${i * 3.5}%`,
              height: `${40 + Math.random() * 30}%`,
              opacity: 0.4,
              filter: 'blur(1px)'
            }}
            animate={{ 
              rotate: [-3, 3, -3],
              scaleY: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 2 + Math.random() * 2, 
              repeat: Infinity, 
              ease: 'easeInOut', 
              delay: i * 0.05 
            }}
          />
        ))}
        
        {/* Foreground wheat */}
        {Array.from({ length: 25 }).map((_, i) => (
          <motion.div
            key={`wheat-fg-${i}`}
            className="absolute bottom-0 origin-bottom"
            style={{
              left: `${i * 4}%`,
              height: `${50 + Math.random() * 40}%`,
            }}
            animate={{ 
              rotate: [-5, 5, -5] 
            }}
            transition={{ 
              duration: 3 + Math.random() * 2, 
              repeat: Infinity, 
              ease: 'easeInOut', 
              delay: i * 0.08 
            }}
          >
            <div className="w-1.5 h-full bg-gradient-to-t from-yellow-800 to-yellow-400 rounded-t-full relative">
              {/* Wheat head */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-3 bg-yellow-500 rounded-full opacity-80" />
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* WIND EFFECT - Visible air currents */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={`wind-${i}`}
          className="absolute h-px bg-gradient-to-r from-transparent via-yellow-300/30 to-transparent"
          style={{
            top: `${30 + i * 10}%`,
            left: '-20%',
            width: '40%'
          }}
          animate={{
            x: ['0%', '350%'],
            opacity: [0, 0.6, 0]
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.8,
            ease: 'easeInOut'
          }}
        />
      ))}
      
      {/* FLOATING POLLEN/SEEDS */}
      {Array.from({ length: 35 }).map((_, i) => (
        <motion.div
          key={`pollen-${i}`}
          className="absolute w-1 h-1 rounded-full bg-yellow-200"
          style={{
            left: `${(i * 7) % 100}%`,
            top: `${(i * 13) % 60}%`,
            boxShadow: '0 0 4px rgba(251, 191, 36, 0.6)',
            opacity: 0.7
          }}
          animate={{
            x: [0, (i % 2 ? 30 : -30), (i % 2 ? -20 : 20), 0],
            y: [0, -40, -80, -120],
            opacity: [0, 0.7, 0.5, 0],
            scale: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 6 + (i % 4),
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeOut'
          }}
        />
      ))}
      
      {/* HARVEST MOON GLOW */}
      <motion.div
        className="absolute top-10 right-10 w-24 h-24 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(254, 240, 138, 0.4), transparent 70%)',
          filter: 'blur(20px)'
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 5,
          repeat: Infinity
        }}
      />
      
      {/* GOLDEN HOUR LIGHT RAYS */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={`light-ray-${i}`}
          className="absolute top-0 origin-top"
          style={{
            left: `${20 + i * 10}%`,
            width: '2px',
            height: '60%',
            background: 'linear-gradient(to bottom, rgba(251, 191, 36, 0.3), transparent)',
            filter: 'blur(3px)',
            transform: `rotate(${5 + i * 2}deg)`
          }}
          animate={{
            opacity: [0.2, 0.5, 0.2],
            scaleY: [0.9, 1.1, 0.9]
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.3
          }}
        />
      ))}
      
      {cosmicEvents}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
    </motion.div>
  );
}

// 5. ETERNAL WITNESS - TIME VORTEX WITH CLOCKWORK
if (titleName === 'Eternal Witness') {
  return (
    <motion.div 
      className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      style={performanceStyle}
    >
      {/* DEEP COSMIC VOID */}
      <motion.div 
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(circle at center, #1e1b4b 0%, #312e81 60%, #000000 100%)',
            'radial-gradient(circle at center, #312e81 0%, #1e1b4b 60%, #000000 100%)',
            'radial-gradient(circle at center, #1e1b4b 0%, #312e81 60%, #000000 100%)'
          ]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      
      {/* ROTATING CLOCKWORK MECHANISM */}
      <motion.div 
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `
            repeating-conic-gradient(
              rgba(255,255,255,0.1) 0deg 5deg, 
              transparent 5deg 15deg
            )
          `,
        }}
        animate={{ rotate: 360 }}
        transition={{ 
          duration: 120, 
          repeat: Infinity, 
          ease: 'linear' 
        }}
      />
      
      {/* THE EYE OF TIME - Central cosmic eye */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* Iris */}
        <motion.div
          className="relative w-32 h-32 rounded-full"
          style={{
            background: 'radial-gradient(circle, #6366f1 30%, #4f46e5 50%, #312e81 80%)',
            boxShadow: '0 0 60px rgba(99, 102, 241, 0.8), inset 0 0 30px rgba(0,0,0,0.8)'
          }}
          animate={{
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          {/* Pupil */}
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black"
            animate={{
              scale: [1, 0.8, 1]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          
          {/* Eye reflection */}
          <div className="absolute top-4 left-6 w-3 h-3 rounded-full bg-white/60 blur-sm" />
        </motion.div>
        
        {/* Outer glow */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3), transparent 70%)',
            filter: 'blur(30px)'
          }}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity
          }}
        />
      </div>
      
      {/* CLOCK GEARS - Rotating mechanisms */}
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={`gear-${i}`}
          className="absolute rounded-full border-4 border-indigo-400/30"
          style={{
            width: `${60 + i * 40}px`,
            height: `${60 + i * 40}px`,
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 2) * 30}%`,
          }}
          animate={{
            rotate: i % 2 === 0 ? 360 : -360
          }}
          transition={{
            duration: 20 + i * 5,
            repeat: Infinity,
            ease: 'linear'
          }}
        >
          {/* Gear teeth */}
          {Array.from({ length: 8 }).map((_, j) => (
            <div
              key={j}
              className="absolute w-1 h-3 bg-indigo-400/40"
              style={{
                left: '50%',
                top: '-6px',
                transform: `rotate(${j * 45}deg) translateX(-50%)`,
                transformOrigin: `center ${30 + i * 20}px`
              }}
            />
          ))}
        </motion.div>
      ))}
      
      {/* TIME SPIRAL - Hypnotic vortex */}
      <svg className="absolute inset-0 w-full h-full opacity-40">
        {Array.from({ length: 6 }).map((_, i) => {
          const radius = 20 + i * 15;
          return (
            <motion.circle
              key={`spiral-${i}`}
              cx="50%"
              cy="50%"
              r={radius}
              stroke="rgba(99, 102, 241, 0.4)"
              strokeWidth="1"
              fill="none"
              strokeDasharray="4,4"
              animate={{
                strokeDashoffset: [0, -8],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                strokeDashoffset: {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear'
                },
                opacity: {
                  duration: 4,
                  repeat: Infinity,
                  delay: i * 0.3
                }
              }}
            />
          );
        })}
      </svg>
      
      {/* TEMPORAL PARTICLES - Time fragments */}
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={`temporal-${i}`}
          className="absolute w-1 h-1 rounded-full bg-indigo-300"
          style={{
            left: '50%',
            top: '50%',
            boxShadow: '0 0 4px rgba(99, 102, 241, 0.8)'
          }}
          animate={{
            x: [0, Math.cos((i * 2 * Math.PI) / 40) * 150],
            y: [0, Math.sin((i * 2 * Math.PI) / 40) * 100],
            opacity: [0, 0.8, 0],
            scale: [0, 1.5, 0]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeOut'
          }}
        />
      ))}
      
      {/* CLOCK HANDS - Moving time indicators */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* Hour hand */}
        <motion.div
          className="absolute w-1 h-16 bg-indigo-400 origin-bottom"
          style={{
            bottom: '0',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 60,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
        
        {/* Minute hand */}
        <motion.div
          className="absolute w-0.5 h-24 bg-indigo-300 origin-bottom"
          style={{
            bottom: '0',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      </div>
      
      {cosmicEvents}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
    </motion.div>
  );
}

// 6. KEEPER OF ERAS - CRYSTALLINE VAULT
if (titleName === 'Keeper of Eras') {
  return (
    <motion.div 
      className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      style={performanceStyle}
    >
      {/* CRYSTAL CAVE GRADIENT */}
      <motion.div 
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(circle at 50% 120%, #701a75 0%, #4a044e 50%, #1a0505 100%)',
            'radial-gradient(circle at 50% 120%, #86198f 0%, #581c87 50%, #1a0505 100%)',
            'radial-gradient(circle at 50% 120%, #701a75 0%, #4a044e 50%, #1a0505 100%)'
          ]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      
      {/* CRYSTAL FORMATIONS - 3D faceted gems */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={`crystal-${i}`}
          className="absolute"
          style={{
            left: `${10 + i * 8}%`,
            top: `${20 + (i % 4) * 20}%`,
            width: `${30 + (i % 3) * 20}px`,
            height: `${50 + (i % 3) * 30}px`,
            background: `linear-gradient(${45 + i * 25}deg, 
              rgba(168, 85, 247, ${0.4 + (i % 3) * 0.1}), 
              rgba(236, 72, 153, ${0.3 + (i % 2) * 0.1}), 
              rgba(168, 85, 247, ${0.4 + (i % 3) * 0.1}))`,
            clipPath: 'polygon(50% 0%, 100% 40%, 80% 100%, 20% 100%, 0% 40%)',
            transform: `rotate(${i * 20}deg)`,
            filter: `drop-shadow(0 0 ${10 + i * 2}px rgba(168, 85, 247, 0.6))`,
            opacity: 0.7
          }}
          animate={{
            rotate: [i * 20, i * 20 + 10, i * 20],
            scale: [1, 1.05, 1],
            opacity: [0.6, 0.9, 0.6]
          }}
          transition={{
            duration: 5 + (i % 4),
            repeat: Infinity,
            delay: i * 0.3
          }}
        />
      ))}
      
      {/* LIGHT REFRACTION - Crystal light beams */}
      {Array.from({ length: 10 }).map((_, i) => (
        <motion.div
          key={`beam-${i}`}
          className="absolute origin-left"
          style={{
            left: `${15 + i * 10}%`,
            top: `${25 + (i % 3) * 20}%`,
            width: '80px',
            height: '2px',
            background: `linear-gradient(to right, 
              rgba(168, 85, 247, ${0.6 - i * 0.03}), 
              transparent)`,
            transform: `rotate(${-30 + i * 15}deg)`,
            filter: 'blur(1px)'
          }}
          animate={{
            opacity: [0.3, 0.8, 0.3],
            scaleX: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: 3 + i * 0.3,
            repeat: Infinity,
            delay: i * 0.2
          }}
        />
      ))}
      
      {/* FACETED OVERLAY - Geometric crystal pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(60deg, transparent 40%, rgba(255,255,255,0.15) 41%, transparent 42%),
            linear-gradient(-60deg, transparent 40%, rgba(255,255,255,0.15) 41%, transparent 42%)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* CRYSTAL PARTICLES - Floating gem shards */}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={`shard-${i}`}
          className="absolute"
          style={{
            left: `${(i * 11) % 100}%`,
            top: `${(i * 17) % 70}%`,
            width: `${3 + (i % 3)}px`,
            height: `${3 + (i % 3)}px`,
            background: i % 2 === 0 ? '#a855f7' : '#ec4899',
            boxShadow: `0 0 ${6 + (i % 3) * 2}px ${i % 2 === 0 ? '#a855f7' : '#ec4899'}`,
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
          }}
          animate={{
            y: [0, -50, 0],
            rotate: [0, 180, 360],
            opacity: [0.3, 0.8, 0.3],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: 4 + (i % 4),
            repeat: Infinity,
            delay: i * 0.15
          }}
        />
      ))}
      
      {/* PRISMATIC GLOW - Central energy source */}
      <motion.div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4), transparent 70%)',
          filter: 'blur(40px)'
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.7, 0.4]
        }}
        transition={{
          duration: 5,
          repeat: Infinity
        }}
      />
      
      {cosmicEvents}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
    </motion.div>
  );
}

// Continue with remaining horizons in next file...
