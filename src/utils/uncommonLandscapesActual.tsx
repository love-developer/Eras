import React, { useMemo } from 'react';
import { motion } from 'motion/react';

// Device detection
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

// ============================================================
// 🌟 ACTUAL UNCOMMON TIER - SPECTACULAR LANDSCAPE EFFECTS
// Each of the 12 uncommon horizons gets a unique landscape!
// ============================================================

/**
 * 🧵 Nostalgia Weaver - Tapestry threads and memories
 */
export function NostalgiaWeaverLandscape({ colorTheme }: { colorTheme: string[] }) {
  const threads = useMemo(() => Array.from({ length: isMobile ? 10 : 20 }, (_, i) => ({
    id: i,
    x: 5 + i * 5,
    delay: i * 0.2,
    height: 40 + Math.random() * 30
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Woven tapestry background */}
      <div className="absolute bottom-0 left-0 right-0 h-3/5" style={{
        background: `linear-gradient(180deg, transparent 0%, ${colorTheme[0]}15 40%, ${colorTheme[0]}30 100%)`
      }}>
        {/* Vertical threads weaving */}
        {threads.map((thread) => (
          <motion.div
            key={thread.id}
            className="absolute bottom-0"
            style={{
              left: `${thread.x}%`,
              width: '2px',
              height: `${thread.height}%`,
              background: `linear-gradient(180deg, transparent, ${colorTheme[0]}AA, ${colorTheme[1] || colorTheme[0]}FF)`,
              boxShadow: `0 0 8px ${colorTheme[0]}80`
            }}
            animate={{
              height: [`${thread.height}%`, `${thread.height + 15}%`, `${thread.height}%`],
              opacity: [0.5, 0.9, 0.5]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: thread.delay,
              ease: 'easeInOut'
            }}
          />
        ))}
        
        {/* Horizontal weave pattern */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={`h-${i}`}
            className="absolute w-full h-px"
            style={{
              bottom: `${10 + i * 10}%`,
              background: `linear-gradient(90deg, transparent, ${colorTheme[1] || colorTheme[0]}60, transparent)`
            }}
            animate={{
              opacity: [0.3, 0.7, 0.3],
              scaleX: [0.9, 1, 0.9]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>

      {/* Floating memory fragments */}
      {Array.from({ length: isMobile ? 8 : 15 }).map((_, i) => (
        <motion.div
          key={`memory-${i}`}
          className="absolute text-2xl"
          style={{
            left: `${Math.random() * 100}%`,
            bottom: '-5%'
          }}
          animate={{
            y: [0, -window.innerHeight * 0.8],
            rotate: [0, 360],
            opacity: [0, 0.7, 0]
          }}
          transition={{
            duration: 8 + Math.random() * 3,
            repeat: Infinity,
            delay: i * 0.5,
            ease: 'easeOut'
          }}
        >
          🧵
        </motion.div>
      ))}

      {/* Shimmering fabric effect */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 70%, ${colorTheme[0]}20 0%, transparent 50%)`
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    </div>
  );
}

/**
 * 📚 The Appreciator - Library of treasures
 */
export function AppreciatorLandscape({ colorTheme }: { colorTheme: string[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Library shelves silhouette */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2">
        <svg viewBox="0 0 1000 200" className="w-full h-full" preserveAspectRatio="none">
          {/* Bookshelf layers */}
          <motion.rect
            x="0" y="140" width="1000" height="8"
            fill={`${colorTheme[0]}60`}
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.rect
            x="0" y="100" width="1000" height="8"
            fill={`${colorTheme[0]}50`}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
          <motion.rect
            x="0" y="60" width="1000" height="8"
            fill={`${colorTheme[0]}40`}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
        </svg>
      </div>

      {/* Floating books */}
      {Array.from({ length: isMobile ? 6 : 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-sm"
          style={{
            left: `${10 + i * 8}%`,
            bottom: '15%',
            width: isMobile ? '20px' : '30px',
            height: isMobile ? '28px' : '42px',
            background: `linear-gradient(135deg, ${colorTheme[0]}80, ${colorTheme[1] || colorTheme[0]}60)`,
            border: `1px solid ${colorTheme[0]}AA`,
            boxShadow: `0 4px 12px ${colorTheme[0]}60`
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [-2, 2, -2]
          }}
          transition={{
            duration: 3 + i * 0.2,
            repeat: Infinity,
            delay: i * 0.3,
            ease: 'easeInOut'
          }}
        />
      ))}

      {/* Knowledge sparkles */}
      {Array.from({ length: isMobile ? 15 : 30 }).map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: colorTheme[0],
            boxShadow: `0 0 8px ${colorTheme[0]}`
          }}
          animate={{
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 2 + Math.random(),
            repeat: Infinity,
            delay: Math.random() * 3
          }}
        />
      ))}
    </div>
  );
}

/**
 * 🗄️ Archivist - Filing cabinet landscape
 */
export function ArchivistLandscape({ colorTheme }: { colorTheme: string[] }) {
  const drawers = useMemo(() => Array.from({ length: isMobile ? 4 : 7 }, (_, i) => ({
    id: i,
    x: 15 + i * 12,
    delay: i * 0.4
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Filing cabinets */}
      {drawers.map((drawer) => (
        <motion.div
          key={drawer.id}
          className="absolute bottom-10"
          style={{
            left: `${drawer.x}%`,
            width: isMobile ? '50px' : '80px',
            height: isMobile ? '70px' : '110px',
            background: `linear-gradient(135deg, ${colorTheme[0]}50, ${colorTheme[1] || colorTheme[0]}40)`,
            border: `2px solid ${colorTheme[0]}80`,
            borderRadius: '4px',
            boxShadow: `0 8px 20px ${colorTheme[0]}40`
          }}
          animate={{
            y: [0, -10, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: drawer.delay,
            ease: 'easeInOut'
          }}
        >
          {/* Drawer lines */}
          {[0, 1, 2].map((line) => (
            <div
              key={line}
              className="absolute w-full h-px"
              style={{
                top: `${(line + 1) * 25}%`,
                background: `${colorTheme[0]}60`
              }}
            />
          ))}
        </motion.div>
      ))}

      {/* Flying documents */}
      {Array.from({ length: isMobile ? 8 : 15 }).map((_, i) => (
        <motion.div
          key={`doc-${i}`}
          className="absolute text-3xl"
          style={{
            left: `${Math.random() * 100}%`,
            bottom: '-5%'
          }}
          animate={{
            y: [0, -window.innerHeight * 0.7],
            rotate: [0, 360],
            opacity: [0, 0.8, 0]
          }}
          transition={{
            duration: 7 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.6,
            ease: 'easeOut'
          }}
        >
          📄
        </motion.div>
      ))}

      {/* Grid background */}
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(${colorTheme[0]}15 1px, transparent 1px), linear-gradient(90deg, ${colorTheme[0]}15 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        opacity: 0.3
      }} />
    </div>
  );
}

/**
 * ✍️ Chronicle Weaver - Scroll and quill landscape
 */
export function ChronicleWeaverLandscape({ colorTheme }: { colorTheme: string[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Unfurling scrolls */}
      {Array.from({ length: isMobile ? 3 : 5 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute bottom-20 rounded"
          style={{
            left: `${20 + i * 18}%`,
            width: isMobile ? '40px' : '70px',
            height: isMobile ? '60px' : '100px',
            background: `linear-gradient(180deg, ${colorTheme[0]}30, ${colorTheme[1] || colorTheme[0]}50)`,
            border: `2px solid ${colorTheme[0]}80`,
            boxShadow: `0 6px 20px ${colorTheme[0]}40`
          }}
          animate={{
            scaleY: [1, 1.2, 1],
            y: [0, -15, 0]
          }}
          transition={{
            duration: 4 + i * 0.3,
            repeat: Infinity,
            delay: i * 0.5,
            ease: 'easeInOut'
          }}
        >
          {/* Scroll lines */}
          {[0, 1, 2, 3].map((line) => (
            <div
              key={line}
              className="absolute w-4/5 h-px left-1/2 -translate-x-1/2"
              style={{
                top: `${20 + line * 20}%`,
                background: `${colorTheme[0]}50`
              }}
            />
          ))}
        </motion.div>
      ))}

      {/* Falling ink drops */}
      {Array.from({ length: isMobile ? 10 : 20 }).map((_, i) => (
        <motion.div
          key={`ink-${i}`}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-5%',
            background: colorTheme[0],
            boxShadow: `0 0 10px ${colorTheme[0]}`
          }}
          animate={{
            y: [0, window.innerHeight],
            scale: [1, 1.5, 1]
          }}
          transition={{
            duration: 5 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.3,
            ease: 'linear'
          }}
        />
      ))}

      {/* Quill feathers floating */}
      {Array.from({ length: isMobile ? 4 : 7 }).map((_, i) => (
        <motion.div
          key={`feather-${i}`}
          className="absolute"
          style={{
            left: `${15 + i * 14}%`,
            bottom: '30%',
            width: isMobile ? '30px' : '50px',
            height: '3px',
            background: `linear-gradient(90deg, ${colorTheme[0]}FF, transparent)`,
            borderRadius: '50%'
          }}
          animate={{
            y: [0, -100, 0],
            rotate: [0, 15, -15, 0],
            opacity: [0, 0.8, 0]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            delay: i * 0.8,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
}

/**
 * 📖 Chronicler - Ancient tome landscape
 */
export function ChroniquerLandscape({ colorTheme }: { colorTheme: string[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Giant open book in background */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2" style={{
        width: isMobile ? '200px' : '400px',
        height: isMobile ? '100px' : '200px'
      }}>
        {/* Left page */}
        <motion.div
          className="absolute left-0 rounded-l"
          style={{
            width: '48%',
            height: '100%',
            background: `linear-gradient(135deg, ${colorTheme[0]}40, ${colorTheme[1] || colorTheme[0]}30)`,
            border: `2px solid ${colorTheme[0]}60`,
            transformOrigin: 'right center',
            transformStyle: 'preserve-3d'
          }}
          animate={{
            rotateY: [0, -5, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        
        {/* Right page */}
        <motion.div
          className="absolute right-0 rounded-r"
          style={{
            width: '48%',
            height: '100%',
            background: `linear-gradient(225deg, ${colorTheme[0]}40, ${colorTheme[1] || colorTheme[0]}30)`,
            border: `2px solid ${colorTheme[0]}60`,
            transformOrigin: 'left center',
            transformStyle: 'preserve-3d'
          }}
          animate={{
            rotateY: [0, 5, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </div>

      {/* Turning pages */}
      {Array.from({ length: isMobile ? 4 : 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded"
          style={{
            left: `${10 + i * 11}%`,
            top: `${20 + (i % 3) * 20}%`,
            width: isMobile ? '25px' : '40px',
            height: isMobile ? '35px' : '55px',
            background: `${colorTheme[0]}40`,
            border: `1px solid ${colorTheme[0]}80`
          }}
          animate={{
            rotateY: [0, 180, 360],
            opacity: [0.5, 0.9, 0.5]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            delay: i * 0.6,
            ease: 'linear'
          }}
        />
      ))}

      {/* Glowing text particles */}
      {Array.from({ length: isMobile ? 20 : 40 }).map((_, i) => (
        <motion.div
          key={`text-${i}`}
          className="absolute text-xs"
          style={{
            left: `${Math.random() * 100}%`,
            bottom: '20%',
            color: colorTheme[0],
            textShadow: `0 0 8px ${colorTheme[0]}`
          }}
          animate={{
            y: [0, -200],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 4 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeOut'
          }}
        >
          ✍
        </motion.div>
      ))}
    </div>
  );
}

/**
 * 🤝 Circle Builder - Network nodes forming
 */
export function CircleBuilderLandscape({ colorTheme }: { colorTheme: string[] }) {
  const nodes = useMemo(() => Array.from({ length: isMobile ? 8 : 15 }, (_, i) => ({
    id: i,
    x: 20 + (i * 60 / 15) + Math.random() * 10,
    y: 30 + Math.random() * 40,
    size: 8 + Math.random() * 8
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Connection lines between nodes */}
      <svg className="absolute inset-0 w-full h-full">
        {nodes.map((node, i) => 
          nodes.slice(i + 1, i + 3).map((target, j) => (
            <motion.line
              key={`${i}-${j}`}
              x1={`${node.x}%`}
              y1={`${node.y}%`}
              x2={`${target.x}%`}
              y2={`${target.y}%`}
              stroke={colorTheme[0]}
              strokeWidth="2"
              opacity="0.4"
              animate={{
                opacity: [0.2, 0.6, 0.2]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut'
              }}
            />
          ))
        )}
      </svg>

      {/* Network nodes */}
      {nodes.map((node, i) => (
        <motion.div
          key={node.id}
          className="absolute rounded-full"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            width: `${node.size}px`,
            height: `${node.size}px`,
            background: `radial-gradient(circle, ${colorTheme[0]}FF, ${colorTheme[1] || colorTheme[0]}80)`,
            boxShadow: `0 0 20px ${colorTheme[0]}AA`
          }}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: 2 + i * 0.1,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut'
          }}
        />
      ))}

      {/* Expanding circles from center */}
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={`circle-${i}`}
          className="absolute left-1/2 top-1/2 rounded-full border-2"
          style={{
            borderColor: `${colorTheme[0]}60`,
            transform: 'translate(-50%, -50%)'
          }}
          animate={{
            width: ['0px', '800px'],
            height: ['0px', '800px'],
            opacity: [0.8, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 1,
            ease: 'easeOut'
          }}
        />
      ))}
    </div>
  );
}

/**
 * 💫 Circle Keeper - Protective rings
 */
export function CircleKeeperLandscape({ colorTheme }: { colorTheme: string[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Concentric protective circles */}
      {Array.from({ length: isMobile ? 5 : 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full border-2"
          style={{
            width: `${(i + 1) * (isMobile ? 60 : 100)}px`,
            height: `${(i + 1) * (isMobile ? 60 : 100)}px`,
            borderColor: `${colorTheme[0]}${Math.floor((8 - i) / 8 * 255).toString(16).padStart(2, '0')}`,
            transform: 'translate(-50%, -50%)',
            boxShadow: `0 0 ${10 + i * 5}px ${colorTheme[0]}60`
          }}
          animate={{
            rotate: [0, i % 2 === 0 ? 360 : -360],
            scale: [1, 1.05, 1],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      ))}

      {/* Orbiting protection symbols */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i * 60) * Math.PI / 180;
        const radius = isMobile ? 100 : 180;
        return (
          <motion.div
            key={`orbit-${i}`}
            className="absolute text-2xl"
            style={{
              left: '50%',
              top: '50%'
            }}
            animate={{
              x: [
                Math.cos(angle) * radius - 12,
                Math.cos(angle + Math.PI * 2) * radius - 12
              ],
              y: [
                Math.sin(angle) * radius - 12,
                Math.sin(angle + Math.PI * 2) * radius - 12
              ],
              rotate: [0, 360]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 0.3
            }}
          >
            🛡️
          </motion.div>
        );
      })}

      {/* Energy pulses */}
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={`pulse-${i}`}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: '20px',
            height: '20px',
            background: `radial-gradient(circle, ${colorTheme[0]}FF, transparent)`,
            transform: 'translate(-50%, -50%)'
          }}
          animate={{
            scale: [1, 15],
            opacity: [0.8, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 1,
            ease: 'easeOut'
          }}
        />
      ))}
    </div>
  );
}

/**
 * 💭 Dream Weaver - Ethereal clouds and stars
 */
export function DreamWeaverLandscape({ colorTheme }: { colorTheme: string[] }) {
  const clouds = useMemo(() => Array.from({ length: isMobile ? 4 : 7 }, (_, i) => ({
    id: i,
    y: 20 + i * 12,
    delay: i * 1.5,
    scale: 0.8 + Math.random() * 0.6
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Dreamy clouds drifting */}
      {clouds.map((cloud) => (
        <motion.div
          key={cloud.id}
          className="absolute w-40 h-24 rounded-full blur-2xl"
          style={{
            left: '-10%',
            top: `${cloud.y}%`,
            background: `radial-gradient(ellipse, ${colorTheme[0]}40, ${colorTheme[1] || colorTheme[0]}20, transparent)`,
            transform: `scale(${cloud.scale})`
          }}
          animate={{
            x: ['0%', '120vw'],
            opacity: [0, 0.6, 0]
          }}
          transition={{
            duration: 20 + cloud.delay,
            repeat: Infinity,
            delay: cloud.delay,
            ease: 'linear'
          }}
        />
      ))}

      {/* Twinkling dream stars */}
      {Array.from({ length: isMobile ? 30 : 60 }).map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${2 + Math.random() * 3}px`,
            height: `${2 + Math.random() * 3}px`,
            background: colorTheme[0],
            boxShadow: `0 0 ${4 + Math.random() * 6}px ${colorTheme[0]}`
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1.5, 0.5]
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: 'easeInOut'
          }}
        />
      ))}

      {/* Floating dream bubbles */}
      {Array.from({ length: isMobile ? 6 : 12 }).map((_, i) => (
        <motion.div
          key={`bubble-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${10 + i * 8}%`,
            bottom: '-10%',
            width: `${30 + Math.random() * 40}px`,
            height: `${30 + Math.random() * 40}px`,
            background: `radial-gradient(circle at 30% 30%, ${colorTheme[0]}40, ${colorTheme[0]}10)`,
            border: `1px solid ${colorTheme[0]}60`
          }}
          animate={{
            y: [0, -window.innerHeight * 1.2],
            x: [0, (Math.random() - 0.5) * 100],
            opacity: [0, 0.7, 0]
          }}
          transition={{
            duration: 10 + Math.random() * 5,
            repeat: Infinity,
            delay: i * 0.8,
            ease: 'easeOut'
          }}
        />
      ))}
    </div>
  );
}

/**
 * 🔮 Futurist - Holographic cityscape
 */
export function FuturistLandscape({ colorTheme }: { colorTheme: string[] }) {
  const buildings = useMemo(() => Array.from({ length: isMobile ? 8 : 15 }, (_, i) => ({
    id: i,
    x: i * 7,
    height: 30 + Math.random() * 40
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Futuristic city skyline */}
      <div className="absolute bottom-0 left-0 right-0 h-2/3" style={{
        background: `linear-gradient(180deg, transparent 0%, ${colorTheme[0]}10 50%, ${colorTheme[0]}20 100%)`,
        transform: 'perspective(600px) rotateX(10deg)',
        transformOrigin: 'bottom'
      }}>
        {buildings.map((building) => (
          <motion.div
            key={building.id}
            className="absolute bottom-0"
            style={{
              left: `${building.x}%`,
              width: isMobile ? '20px' : '35px',
              height: `${building.height}%`,
              background: `linear-gradient(180deg, transparent 0%, ${colorTheme[0]}60 50%, ${colorTheme[0]}80 100%)`,
              border: `1px solid ${colorTheme[0]}AA`,
              boxShadow: `0 0 20px ${colorTheme[0]}80, inset 0 0 10px ${colorTheme[0]}40`
            }}
            animate={{
              opacity: [0.5, 0.9, 0.5],
              boxShadow: [
                `0 0 20px ${colorTheme[0]}80`,
                `0 0 40px ${colorTheme[0]}FF`,
                `0 0 20px ${colorTheme[0]}80`
              ]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: building.id * 0.2,
              ease: 'easeInOut'
            }}
          >
            {/* Building windows */}
            {Array.from({ length: 4 }).map((_, w) => (
              <div
                key={w}
                className="absolute w-1 h-1 left-1/2 -translate-x-1/2"
                style={{
                  top: `${20 + w * 20}%`,
                  background: colorTheme[0],
                  boxShadow: `0 0 4px ${colorTheme[0]}`
                }}
              />
            ))}
          </motion.div>
        ))}
      </div>

      {/* Flying vehicles */}
      {Array.from({ length: isMobile ? 3 : 5 }).map((_, i) => (
        <motion.div
          key={`vehicle-${i}`}
          className="absolute w-6 h-2 rounded-full"
          style={{
            left: '-10%',
            top: `${30 + i * 15}%`,
            background: `linear-gradient(90deg, ${colorTheme[0]}FF, ${colorTheme[1] || colorTheme[0]}AA)`,
            boxShadow: `0 0 15px ${colorTheme[0]}FF`
          }}
          animate={{
            x: ['0%', '120vw'],
            y: [0, -20, 0]
          }}
          transition={{
            duration: 6 + i,
            repeat: Infinity,
            delay: i * 2,
            ease: 'linear'
          }}
        />
      ))}

      {/* Holographic grid */}
      <div className="absolute inset-0" style={{
        backgroundImage: `
          linear-gradient(${colorTheme[0]}20 1px, transparent 1px),
          linear-gradient(90deg, ${colorTheme[0]}20 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        opacity: 0.3
      }} />
    </div>
  );
}

/**
 * 📺 Media Master - Screens and broadcasts
 */
export function MediaMasterLandscape({ colorTheme }: { colorTheme: string[] }) {
  const screens = useMemo(() => Array.from({ length: isMobile ? 4 : 7 }, (_, i) => ({
    id: i,
    x: 12 + i * 13,
    y: 20 + (i % 2) * 25,
    delay: i * 0.5
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating media screens */}
      {screens.map((screen) => (
        <motion.div
          key={screen.id}
          className="absolute rounded border-2"
          style={{
            left: `${screen.x}%`,
            top: `${screen.y}%`,
            width: isMobile ? '50px' : '80px',
            height: isMobile ? '35px' : '55px',
            borderColor: `${colorTheme[0]}AA`,
            background: `linear-gradient(135deg, ${colorTheme[0]}40, ${colorTheme[1] || colorTheme[0]}30)`,
            boxShadow: `0 0 25px ${colorTheme[0]}80`
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [-2, 2, -2],
            boxShadow: [
              `0 0 25px ${colorTheme[0]}80`,
              `0 0 45px ${colorTheme[0]}FF`,
              `0 0 25px ${colorTheme[0]}80`
            ]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: screen.delay,
            ease: 'easeInOut'
          }}
        >
          {/* Screen scan lines */}
          {Array.from({ length: 5 }).map((_, l) => (
            <div
              key={l}
              className="absolute w-full h-px"
              style={{
                top: `${l * 20}%`,
                background: `${colorTheme[0]}40`
              }}
            />
          ))}
        </motion.div>
      ))}

      {/* Broadcasting signals */}
      {Array.from({ length: isMobile ? 4 : 6 }).map((_, i) => (
        <motion.div
          key={`signal-${i}`}
          className="absolute left-1/2 top-1/2 rounded-full border-2"
          style={{
            borderColor: `${colorTheme[0]}60`,
            transform: 'translate(-50%, -50%)'
          }}
          animate={{
            width: ['0px', '500px'],
            height: ['0px', '500px'],
            opacity: [0.8, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.5,
            ease: 'easeOut'
          }}
        />
      ))}

      {/* Media icons floating */}
      {['📺', '📻', '📡', '🎥', '🎬'].map((icon, i) => (
        <motion.div
          key={i}
          className="absolute text-3xl"
          style={{
            left: `${15 + i * 18}%`,
            bottom: '-5%',
            filter: `drop-shadow(0 0 10px ${colorTheme[0]})`
          }}
          animate={{
            y: [0, -window.innerHeight * 0.6],
            rotate: [0, 360],
            opacity: [0, 0.8, 0]
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            delay: i * 1.4,
            ease: 'easeOut'
          }}
        >
          {icon}
        </motion.div>
      ))}
    </div>
  );
}

/**
 * 🌐 Parallel Keeper - Parallel dimensions
 */
export function ParallelKeeperLandscape({ colorTheme }: { colorTheme: string[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Parallel dimension layers */}
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={`layer-${i}`}
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at ${50 + i * 10}% 50%, ${colorTheme[0]}${(5 - i) * 10} 0%, transparent 40%)`,
            transform: `translateZ(${i * -50}px) scale(${1 + i * 0.1})`
          }}
          animate={{
            opacity: [0.2, 0.5, 0.2],
            x: [(i - 2) * -20, (i - 2) * 20, (i - 2) * -20]
          }}
          transition={{
            duration: 6 + i,
            repeat: Infinity,
            delay: i * 0.8,
            ease: 'easeInOut'
          }}
        />
      ))}

      {/* Dimensional portals */}
      {Array.from({ length: isMobile ? 3 : 5 }).map((_, i) => (
        <motion.div
          key={`portal-${i}`}
          className="absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: `${80 + i * 40}px`,
            height: `${80 + i * 40}px`,
            border: `2px solid ${colorTheme[0]}80`,
            transform: 'translate(-50%, -50%)',
            boxShadow: `inset 0 0 30px ${colorTheme[0]}60, 0 0 30px ${colorTheme[0]}60`
          }}
          animate={{
            rotate: [0, i % 2 === 0 ? 360 : -360],
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.8, 0.4]
          }}
          transition={{
            duration: 10 + i * 2,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      ))}

      {/* Reality fragments */}
      {Array.from({ length: isMobile ? 15 : 30 }).map((_, i) => (
        <motion.div
          key={`fragment-${i}`}
          className="absolute w-3 h-3"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `linear-gradient(135deg, ${colorTheme[0]}AA, ${colorTheme[1] || colorTheme[0]}60)`,
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            boxShadow: `0 0 10px ${colorTheme[0]}`
          }}
          animate={{
            rotate: [0, 360],
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: 'linear'
          }}
        />
      ))}
    </div>
  );
}

/**
 * 🎵 Sonic Archivist - Sound archive vaults
 */
export function SonicArchivistLandscape({ colorTheme }: { colorTheme: string[] }) {
  const vaults = useMemo(() => Array.from({ length: isMobile ? 4 : 7 }, (_, i) => ({
    id: i,
    x: 15 + i * 12,
    delay: i * 0.4
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Sound vaults/archives */}
      {vaults.map((vault) => (
        <motion.div
          key={vault.id}
          className="absolute bottom-10"
          style={{
            left: `${vault.x}%`,
            width: isMobile ? '45px' : '70px',
            height: isMobile ? '65px' : '100px',
            background: `linear-gradient(180deg, ${colorTheme[0]}30, ${colorTheme[1] || colorTheme[0]}50)`,
            border: `2px solid ${colorTheme[0]}AA`,
            borderRadius: '8px',
            boxShadow: `0 8px 25px ${colorTheme[0]}60`
          }}
          animate={{
            y: [0, -15, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: vault.delay,
            ease: 'easeInOut'
          }}
        >
          {/* Circular record on vault */}
          <div
            className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
            style={{
              width: '50%',
              paddingBottom: '50%',
              borderColor: `${colorTheme[0]}80`
            }}
          />
        </motion.div>
      ))}

      {/* Floating musical notes */}
      {['♪', '♫', '♬', '♩', '♭', '♯'].map((note, i) => (
        <motion.div
          key={i}
          className="absolute text-3xl"
          style={{
            left: `${10 + i * 15}%`,
            bottom: '-5%',
            color: colorTheme[0],
            textShadow: `0 0 15px ${colorTheme[0]}`
          }}
          animate={{
            y: [0, -window.innerHeight * 0.8],
            x: [(Math.random() - 0.5) * 50],
            rotate: [0, 360],
            opacity: [0, 0.9, 0]
          }}
          transition={{
            duration: 6 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.8,
            ease: 'easeOut'
          }}
        >
          {note}
        </motion.div>
      ))}

      {/* Sound wave rings */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={`wave-${i}`}
          className="absolute left-1/2 bottom-1/4 rounded-full border-2"
          style={{
            borderColor: `${colorTheme[0]}60`,
            transform: 'translate(-50%, 0)'
          }}
          animate={{
            width: ['0px', '600px'],
            height: ['0px', '300px'],
            opacity: [0.8, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 0.7,
            ease: 'easeOut'
          }}
        />
      ))}

      {/* Vinyl records spinning */}
      {Array.from({ length: isMobile ? 3 : 5 }).map((_, i) => (
        <motion.div
          key={`vinyl-${i}`}
          className="absolute rounded-full border-4"
          style={{
            left: `${20 + i * 18}%`,
            top: `${25 + (i % 2) * 20}%`,
            width: isMobile ? '30px' : '50px',
            height: isMobile ? '30px' : '50px',
            borderColor: `${colorTheme[0]}AA`,
            background: `radial-gradient(circle, ${colorTheme[0]}40, ${colorTheme[0]}20)`,
            boxShadow: `0 0 20px ${colorTheme[0]}60`
          }}
          animate={{
            rotate: [0, 360]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
            delay: i * 0.5
          }}
        />
      ))}
    </div>
  );
}