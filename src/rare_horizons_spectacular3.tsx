// 🌟 RARE TIER HORIZONS - Part 3 (Final)

// 7. SOCIAL CONNECTOR / CIRCLE BUILDER - DIGITAL NETWORK WEB
if (titleName === 'Social Connector' || titleName === 'Circle Builder') {
  return (
    <motion.div 
      className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      style={performanceStyle}
    >
      {/* NETWORK MATRIX GRADIENT */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
        }}
      />
      
      {/* ANIMATED GRID NETWORK - Moving connection lines */}
      <motion.div 
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `
            radial-gradient(circle, #34d399 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px'
        }}
        animate={{
          backgroundPosition: ['0px 0px', '30px 30px']
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
      
      {/* 3D NETWORK NODES - Floating connection points */}
      <svg className="absolute inset-0 w-full h-full">
        {/* Connection nodes */}
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i * 2 * Math.PI) / 16;
          const cx = 50 + Math.cos(angle) * 30;
          const cy = 50 + Math.sin(angle) * 25;
          
          return (
            <g key={`node-group-${i}`}>
              {/* Node */}
              <motion.circle
                cx={`${cx}%`}
                cy={`${cy}%`}
                r="6"
                fill="rgba(52, 211, 153, 0.6)"
                stroke="rgba(52, 211, 153, 0.8)"
                strokeWidth="2"
                filter="drop-shadow(0 0 8px rgba(52, 211, 153, 0.8))"
                animate={{
                  r: [6, 9, 6],
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.15
                }}
              />
              
              {/* Connection lines to nearby nodes */}
              {Array.from({ length: 3 }).map((_, j) => {
                const targetIdx = (i + j + 2) % 16;
                const targetAngle = (targetIdx * 2 * Math.PI) / 16;
                const tx = 50 + Math.cos(targetAngle) * 30;
                const ty = 50 + Math.sin(targetAngle) * 25;
                
                return (
                  <motion.line
                    key={`line-${i}-${j}`}
                    x1={`${cx}%`}
                    y1={`${cy}%`}
                    x2={`${tx}%`}
                    y2={`${ty}%`}
                    stroke="rgba(52, 211, 153, 0.4)"
                    strokeWidth="1.5"
                    strokeDasharray="3,3"
                    animate={{
                      strokeDashoffset: [0, -6],
                      opacity: [0.2, 0.6, 0.2]
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
                        delay: i * 0.2 + j * 0.5
                      }
                    }}
                  />
                );
              })}
            </g>
          );
        })}
        
        {/* Central hub */}
        <motion.circle
          cx="50%"
          cy="50%"
          r="12"
          fill="rgba(16, 185, 129, 0.7)"
          stroke="rgba(16, 185, 129, 1)"
          strokeWidth="3"
          filter="drop-shadow(0 0 16px rgba(16, 185, 129, 0.9))"
          animate={{
            r: [12, 16, 12],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 2,
            repeat: Infinity
          }}
        />
      </svg>
      
      {/* DATA PACKETS - Traveling through network */}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i * 2 * Math.PI) / 24;
        const startX = 50;
        const startY = 50;
        const endX = 50 + Math.cos(angle) * 35;
        const endY = 50 + Math.sin(angle) * 28;
        
        return (
          <motion.div
            key={`packet-${i}`}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: '#6ee7b7',
              boxShadow: '0 0 8px rgba(110, 231, 183, 0.9)',
              left: `${startX}%`,
              top: `${startY}%`
            }}
            animate={{
              left: [`${startX}%`, `${endX}%`, `${startX}%`],
              top: [`${startY}%`, `${endY}%`, `${startY}%`],
              scale: [1, 1.5, 1],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut'
            }}
          />
        );
      })}
      
      {/* PROFILE AVATARS - Floating user icons */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={`avatar-${i}`}
          className="absolute w-10 h-10 rounded-full border-2 border-emerald-400"
          style={{
            left: `${15 + i * 12}%`,
            top: `${30 + (i % 3) * 20}%`,
            background: `linear-gradient(135deg, 
              rgba(52, 211, 153, ${0.3 + (i % 3) * 0.1}), 
              rgba(16, 185, 129, ${0.2 + (i % 2) * 0.1}))`,
            boxShadow: '0 0 15px rgba(52, 211, 153, 0.6)',
            backdropFilter: 'blur(4px)'
          }}
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 5 + (i % 3),
            repeat: Infinity,
            delay: i * 0.5
          }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg">
            👤
          </div>
        </motion.div>
      ))}
      
      {/* SOCIAL SIGNALS - Chat bubbles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={`signal-${i}`}
          className="absolute text-sm"
          style={{
            left: `${(i * 15) % 100}%`,
            top: `${(i * 20) % 70}%`,
            color: '#6ee7b7',
            opacity: 0.7,
            filter: 'drop-shadow(0 0 4px rgba(110, 231, 183, 0.8))'
          }}
          animate={{
            y: [0, -50, 0],
            opacity: [0, 0.7, 0],
            scale: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 4 + (i % 3),
            repeat: Infinity,
            delay: i * 0.4
          }}
        >
          {i % 3 === 0 ? '💬' : i % 3 === 1 ? '👍' : '❤️'}
        </motion.div>
      ))}
      
      {/* NETWORK PULSE - Expanding waves */}
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={`pulse-${i}`}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-emerald-400"
          style={{
            width: `${60 + i * 40}px`,
            height: `${60 + i * 40}px`,
          }}
          animate={{
            scale: [1, 2.5],
            opacity: [0.6, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 0.8,
            ease: 'easeOut'
          }}
        />
      ))}
      
      {cosmicEvents}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
    </motion.div>
  );
}

// 8. FUTURIST - CYBERPUNK CITYSCAPE
if (titleName === 'Futurist') {
  return (
    <motion.div 
      className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      style={performanceStyle}
    >
      {/* CYBERPUNK SKY GRADIENT */}
      <motion.div 
        className="absolute inset-0"
        animate={{
          background: [
            'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0891b2 100%)',
            'linear-gradient(180deg, #1e293b 0%, #334155 50%, #06b6d4 100%)',
            'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0891b2 100%)'
          ]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      
      {/* CITY SKYLINE SILHOUETTE */}
      <div className="absolute bottom-0 left-0 right-0 h-32 flex items-end justify-around opacity-40">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`building-${i}`}
            className="relative bg-slate-900 rounded-t-sm"
            style={{
              width: `${40 + Math.random() * 30}px`,
              height: `${60 + Math.random() * 80}%`,
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
            }}
          >
            {/* Building windows */}
            <div className="absolute inset-2 grid grid-cols-2 gap-1">
              {Array.from({ length: 8 }).map((_, j) => (
                <motion.div
                  key={`window-${i}-${j}`}
                  className="w-full h-2 bg-cyan-400 rounded-sm"
                  animate={{
                    opacity: [0.3, 0.8, 0.3]
                  }}
                  transition={{
                    duration: 2 + Math.random(),
                    repeat: Infinity,
                    delay: Math.random() * 2
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* HOLOGRAPHIC BILLBOARDS */}
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={`billboard-${i}`}
          className="absolute border-2 border-cyan-400 rounded"
          style={{
            left: `${20 + i * 20}%`,
            top: `${30 + (i % 2) * 15}%`,
            width: '60px',
            height: '40px',
            background: 'rgba(6, 182, 212, 0.1)',
            backdropFilter: 'blur(2px)',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)'
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
            boxShadow: [
              '0 0 20px rgba(6, 182, 212, 0.5)',
              '0 0 30px rgba(6, 182, 212, 0.8)',
              '0 0 20px rgba(6, 182, 212, 0.5)'
            ]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.5
          }}
        >
          <motion.div
            className="absolute inset-0 flex items-center justify-center text-xs text-cyan-300 font-mono"
            animate={{
              opacity: [1, 0, 1]
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              delay: i * 0.3
            }}
          >
            AD {i + 1}
          </motion.div>
        </motion.div>
      ))}
      
      {/* FLYING VEHICLES - Hovercars */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={`vehicle-${i}`}
          className="absolute w-8 h-3 rounded-full"
          style={{
            background: 'linear-gradient(90deg, #0891b2, #06b6d4)',
            boxShadow: '0 0 10px rgba(6, 182, 212, 0.8)',
            top: `${20 + i * 10}%`
          }}
          animate={{
            x: ['-10%', '110%']
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            delay: i * 1.5,
            ease: 'linear'
          }}
        >
          {/* Headlights */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full" />
          {/* Trail */}
          <motion.div
            className="absolute right-full top-1/2 -translate-y-1/2 h-px w-16 bg-gradient-to-r from-cyan-400 to-transparent"
            animate={{
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1,
              repeat: Infinity
            }}
          />
        </motion.div>
      ))}
      
      {/* NEON RAIN - Digital data streams */}
      {Array.from({ length: 25 }).map((_, i) => (
        <motion.div
          key={`rain-${i}`}
          className="absolute top-0 w-px bg-gradient-to-b from-cyan-400 via-cyan-300 to-transparent"
          style={{
            left: `${(i * 4) % 100}%`,
            height: `${40 + (i % 3) * 20}px`,
            opacity: 0.6
          }}
          animate={{
            y: ['-100%', '400%'],
            opacity: [0, 0.8, 0]
          }}
          transition={{
            duration: 3 + (i % 4),
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'linear'
          }}
        />
      ))}
      
      {/* LASER SCAN LINES */}
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={`scan-${i}`}
          className="absolute left-0 right-0 h-px bg-cyan-400"
          style={{
            boxShadow: '0 0 10px rgba(6, 182, 212, 0.8)',
            opacity: 0.6
          }}
          animate={{
            top: ['0%', '100%']
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            delay: i * 1.5,
            ease: 'linear'
          }}
        />
      ))}
      
      {/* DIGITAL GLITCH EFFECT */}
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={`glitch-${i}`}
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, 
              transparent ${i * 20}%, 
              rgba(6, 182, 212, 0.1) ${i * 20 + 2}%, 
              transparent ${i * 20 + 4}%)`,
            mixBlendMode: 'screen'
          }}
          animate={{
            x: [0, -20, 20, 0],
            opacity: [0, 0.5, 0]
          }}
          transition={{
            duration: 0.3,
            repeat: Infinity,
            repeatDelay: 6 + i,
            delay: i * 0.5
          }}
        />
      ))}
      
      {cosmicEvents}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
    </motion.div>
  );
}

// 9. DREAM WEAVER - SURREAL DREAMSCAPE
if (titleName === 'Dream Weaver') {
  return (
    <motion.div 
      className={`top-0 left-0 right-0 ${height} overflow-hidden z-0 ${positioning}`}
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      style={performanceStyle}
    >
      {/* ETHEREAL DREAM GRADIENT */}
      <motion.div 
        className="absolute inset-0"
        animate={{
          background: [
            'linear-gradient(to bottom, #4f46e5 0%, #a5b4fc 50%, #e0e7ff 100%)',
            'linear-gradient(to bottom, #6366f1 0%, #c7d2fe 50%, #ddd6fe 100%)',
            'linear-gradient(to bottom, #4f46e5 0%, #a5b4fc 50%, #e0e7ff 100%)'
          ]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      
      {/* DREAM CLOUDS - Soft floating formations */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={`cloud-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${10 + i * 12}%`,
            top: `${15 + (i % 3) * 25}%`,
            width: `${60 + (i % 4) * 30}px`,
            height: `${30 + (i % 3) * 15}px`,
            background: `radial-gradient(ellipse, 
              rgba(165, 180, 252, ${0.4 - i * 0.03}), 
              transparent 70%)`,
            filter: `blur(${15 + (i % 3) * 8}px)`
          }}
          animate={{
            x: [0, (i % 2 ? 40 : -40), 0],
            y: [0, (i % 2 ? -20 : 20), 0],
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 15 + i * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.8
          }}
        />
      ))}
      
      {/* FLOATING DREAM SYMBOLS */}
      {['🌙', '⭐', '✨', '💫', '🌟', '☁️', '🦋', '🌸'].map((symbol, i) => (
        <motion.div
          key={`symbol-${i}`}
          className="absolute text-3xl"
          style={{
            left: `${15 + i * 12}%`,
            top: `${25 + (i % 4) * 20}%`,
            filter: 'drop-shadow(0 0 12px rgba(99, 102, 241, 0.6))',
            opacity: 0.7
          }}
          animate={{
            y: [0, -40, 0],
            rotate: [0, 15, -15, 0],
            scale: [0.9, 1.2, 0.9],
            opacity: [0.4, 0.8, 0.4]
          }}
          transition={{
            duration: 8 + i,
            repeat: Infinity,
            delay: i * 0.6,
            ease: 'easeInOut'
          }}
        >
          {symbol}
        </motion.div>
      ))}
      
      {/* STARDUST PARTICLES - Magical sparkles */}
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={`dust-${i}`}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: i % 3 === 0 ? '#c7d2fe' : i % 3 === 1 ? '#ddd6fe' : '#e0e7ff',
            boxShadow: `0 0 ${4 + (i % 3) * 2}px rgba(165, 180, 252, 0.8)`,
            left: `${(i * 7) % 100}%`,
            top: `${(i * 13) % 80}%`,
          }}
          animate={{
            y: [0, (i % 2 ? -80 : -120)],
            x: [(i % 2 ? -20 : 20), (i % 2 ? 20 : -20)],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.5, 0.5]
          }}
          transition={{
            duration: 5 + (i % 5),
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeOut'
          }}
        />
      ))}
      
      {/* DREAM BUBBLES - Soap bubble effect */}
      {Array.from({ length: 10 }).map((_, i) => (
        <motion.div
          key={`bubble-${i}`}
          className="absolute rounded-full border-2 border-indigo-300"
          style={{
            left: `${(i * 15) % 100}%`,
            bottom: '0%',
            width: `${30 + (i % 4) * 20}px`,
            height: `${30 + (i % 4) * 20}px`,
            background: `radial-gradient(circle at 30% 30%, 
              rgba(255, 255, 255, 0.6), 
              rgba(165, 180, 252, 0.3))`,
            boxShadow: 'inset 0 0 15px rgba(255, 255, 255, 0.4)',
          }}
          animate={{
            y: [0, -250],
            x: [(i % 2 ? -30 : 30), (i % 2 ? 30 : -30)],
            opacity: [0, 0.8, 0],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: 8 + (i % 4),
            repeat: Infinity,
            delay: i * 0.7,
            ease: 'easeOut'
          }}
        >
          {/* Bubble shine */}
          <div 
            className="absolute top-2 left-3 w-3 h-3 rounded-full bg-white/70 blur-sm"
          />
        </motion.div>
      ))}
      
      {/* AURORA WAVES - Dreamy light curtains */}
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={`aurora-${i}`}
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, 
              transparent 0%, 
              rgba(165, 180, 252, ${0.2 - i * 0.04}) 50%, 
              transparent 100%)`,
            transformOrigin: 'top',
          }}
          animate={{
            scaleY: [1, 1.3, 0.9, 1],
            x: [0, 30, -20, 0],
            opacity: [0.5, 0.7, 0.5]
          }}
          transition={{
            duration: 12 + i * 2,
            repeat: Infinity,
            delay: i * 2,
            ease: 'easeInOut'
          }}
        />
      ))}
      
      {cosmicEvents}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent" />
    </motion.div>
  );
}

// NOTE: "Frequency Keeper" appears twice in the file - once in Uncommon tier and once in Rare tier
// The Rare tier version should have been handled already in the Uncommon tier section
// Skipping duplicate implementation

