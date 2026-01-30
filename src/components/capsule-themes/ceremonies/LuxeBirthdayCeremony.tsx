import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LuxeBirthdayCeremonyProps {
  onComplete: () => void;
  isVisible: boolean;
  age?: number;
  recipientName?: string;
}

export function LuxeBirthdayCeremony({ onComplete, isVisible, age, recipientName }: LuxeBirthdayCeremonyProps) {
  const [phase, setPhase] = useState<'entrance' | 'cake-reveal' | 'candle-lit' | 'blow' | 'celebration'>('entrance');
  const [candleLit, setCandleLit] = useState(false);
  const [hasBlown, setHasBlown] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  // Soft candle lighting sound
  const playLightSound = useCallback(() => {
    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.4);
    
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  }, [initAudio]);

  // Gentle whoosh blow sound
  const playBlowSound = useCallback(() => {
    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  }, [initAudio]);

  // Elegant chime sound
  const playChimeSound = useCallback(() => {
    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;

    // Play a beautiful major 7th chord: C, E, G, B
    const frequencies = [523.25, 659.25, 783.99, 987.77];
    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gainNode.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);
      
      oscillator.start(ctx.currentTime + i * 0.08);
      oscillator.stop(ctx.currentTime + 2);
    });
  }, [initAudio]);

  // Animation sequence
  useEffect(() => {
    if (!isVisible) return;

    // Phase 1: Entrance (0-1.5s)
    const entranceTimer = setTimeout(() => {
      setPhase('cake-reveal');
    }, 1500);

    // Phase 2: Cake reveal & candle lighting (1.5-3s)
    const revealTimer = setTimeout(() => {
      setPhase('candle-lit');
      setCandleLit(true);
      playLightSound();
      if (navigator.vibrate) navigator.vibrate(40);
    }, 3000);

    return () => {
      clearTimeout(entranceTimer);
      clearTimeout(revealTimer);
    };
  }, [isVisible, playLightSound]);

  // Handle blow interaction
  const handleBlow = useCallback(() => {
    if (phase !== 'candle-lit' || hasBlown) return;
    
    initAudio();
    setPhase('blow');
    setHasBlown(true);
    setCandleLit(false);
    
    playBlowSound();
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    
    // Transition to celebration
    setTimeout(() => {
      setPhase('celebration');
      playChimeSound();
      if (navigator.vibrate) navigator.vibrate([80, 40, 80, 40, 120]);
      
      // Complete after celebration
      setTimeout(() => {
        onComplete();
      }, 2500);
    }, 800);
  }, [phase, hasBlown, playBlowSound, playChimeSound, onComplete, initAudio]);

  if (!isVisible) return null;

  return (
    <motion.div 
      className="relative flex flex-col items-center justify-center w-full h-full overflow-hidden select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        background: 'radial-gradient(ellipse at center, #2d1b3d 0%, #1a0f25 50%, #0a0510 100%)'
      }}
      onClick={handleBlow}
    >
      {/* Floating light bokeh particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={`bokeh-${i}`}
            className="absolute rounded-full"
            style={{
              width: `${8 + Math.random() * 16}px`,
              height: `${8 + Math.random() * 16}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: [
                'radial-gradient(circle, rgba(255,215,0,0.3), transparent)',
                'radial-gradient(circle, rgba(255,182,193,0.3), transparent)',
                'radial-gradient(circle, rgba(230,230,250,0.3), transparent)',
                'radial-gradient(circle, rgba(255,240,245,0.3), transparent)',
              ][i % 4],
              filter: 'blur(4px)',
            }}
            animate={{
              y: [0, -30, 0],
              x: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 20],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Elegant "Happy Birthday" text */}
      <AnimatePresence>
        {phase === 'entrance' && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
            className="absolute top-24 z-50"
          >
            <h1 
              className="text-5xl font-serif text-transparent bg-clip-text tracking-wider"
              style={{
                fontFamily: "'Playfair Display', serif",
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF69B4 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                textShadow: '0 0 40px rgba(255,215,0,0.4)',
              }}
            >
              Happy Birthday
            </h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main cake container */}
      <motion.div
        className="relative z-10"
        initial={{ y: 100, opacity: 0 }}
        animate={{ 
          y: phase === 'entrance' ? 100 : 0, 
          opacity: phase === 'entrance' ? 0 : 1,
          scale: phase === 'celebration' ? [1, 1.05, 1] : 1,
        }}
        transition={{ 
          duration: 1.2, 
          delay: 0.5,
          ease: [0.19, 1, 0.22, 1],
        }}
      >
        {/* Spotlight glow */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(255,215,0,0.2) 0%, transparent 70%)',
            filter: 'blur(60px)',
            transform: 'scale(2)',
          }}
          animate={{
            opacity: phase === 'entrance' ? 0 : [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <div className="relative flex flex-col items-center">
          {/* Candle and flame */}
          <div className="relative mb-6 z-30">
            <AnimatePresence>
              {candleLit && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ 
                    scale: [1, 1.8, 0],
                    opacity: [1, 0.6, 0],
                    y: [-60],
                  }}
                  transition={{ exit: { duration: 0.6, ease: 'easeOut' } }}
                  className="absolute -top-20 left-1/2 -translate-x-1/2"
                >
                  {/* Flame glow */}
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      width: '60px',
                      height: '60px',
                      marginLeft: '-22px',
                      marginTop: '-22px',
                      background: 'radial-gradient(circle, rgba(255,140,0,0.8) 0%, rgba(255,215,0,0.4) 40%, transparent 70%)',
                      filter: 'blur(20px)',
                    }}
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.8, 1, 0.8],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />

                  {/* Flame SVG */}
                  <motion.svg
                    width="32"
                    height="44"
                    viewBox="0 0 32 44"
                    className="relative z-10"
                    animate={{
                      scale: [1, 1.1, 0.95, 1],
                      rotate: [-2, 2, -1, 0],
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <defs>
                      <radialGradient id="flame-grad-outer" cx="50%" cy="60%">
                        <stop offset="0%" stopColor="#FF8C00" stopOpacity="1" />
                        <stop offset="50%" stopColor="#FFA500" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#FFD700" stopOpacity="0.3" />
                      </radialGradient>
                      <radialGradient id="flame-grad-inner" cx="50%" cy="70%">
                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                        <stop offset="40%" stopColor="#FFF8DC" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                    
                    {/* Outer flame */}
                    <path
                      d="M16 2 C12 8, 8 14, 8 24 C8 34, 12 40, 16 40 C20 40, 24 34, 24 24 C24 14, 20 8, 16 2Z"
                      fill="url(#flame-grad-outer)"
                    />
                    
                    {/* Inner flame */}
                    <ellipse
                      cx="16"
                      cy="28"
                      rx="5"
                      ry="8"
                      fill="url(#flame-grad-inner)"
                    />
                  </motion.svg>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Smoke after blow */}
            <AnimatePresence>
              {phase === 'blow' && !candleLit && (
                <>
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={`smoke-${i}`}
                      className="absolute -top-16 left-1/2 -translate-x-1/2"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: [1, 3, 4],
                        opacity: [0.6, 0.3, 0],
                        y: [0, -60, -100],
                        x: [(Math.random() - 0.5) * 30],
                      }}
                      transition={{ duration: 1.8, delay: i * 0.1, ease: 'easeOut' }}
                    >
                      <div 
                        className="w-8 h-8 rounded-full"
                        style={{
                          background: 'radial-gradient(circle, rgba(200,200,200,0.5) 0%, transparent 70%)',
                          filter: 'blur(8px)',
                        }}
                      />
                    </motion.div>
                  ))}
                </>
              )}
            </AnimatePresence>

            {/* Candle stick */}
            <motion.div
              className="relative w-3 h-14 rounded-t-md"
              style={{
                background: 'linear-gradient(to right, #F8F8FF 0%, #FFFACD 50%, #F0E68C 100%)',
                boxShadow: 'inset 1px 0 2px rgba(255,255,255,0.8), inset -1px 0 2px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.3)',
              }}
              animate={{
                y: candleLit ? [0, -1, 0] : 0,
              }}
              transition={{
                duration: 0.6,
                repeat: candleLit ? Infinity : 0,
              }}
            >
              {/* Wick */}
              <div 
                className="absolute -top-3 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-gray-800 rounded-sm"
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
              />
            </motion.div>
          </div>

          {/* Luxe Ombre Cake - 2 Tiers */}
          <div className="relative flex flex-col items-center gap-2">
            {/* Top Tier - Lavender to Pink */}
            <motion.div
              className="relative w-48 h-20 rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(to bottom, #E6E6FA 0%, #DDA0DD 50%, #FFB6C1 100%)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.5)',
              }}
            >
              {/* Gold leaf accent - top edge */}
              <div 
                className="absolute top-0 left-0 right-0 h-1"
                style={{
                  background: 'linear-gradient(90deg, transparent, #FFD700, #FFA500, #FFD700, transparent)',
                  opacity: 0.8,
                }}
              />
              
              {/* Subtle shimmer overlay */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)',
                }}
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 2,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>

            {/* Bottom Tier - Pink to Sky Blue */}
            <motion.div
              className="relative w-64 h-28 rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(to bottom, #FFB6C1 0%, #FFE4E1 25%, #E0F2FE 75%, #87CEEB 100%)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.5)',
              }}
            >
              {/* Gold drip effect */}
              <div className="absolute top-0 left-0 right-0 h-8 overflow-hidden">
                {[20, 35, 50, 65, 80].map((left, i) => (
                  <motion.div
                    key={`drip-${i}`}
                    className="absolute top-0 w-4 rounded-b-full"
                    style={{
                      left: `${left}%`,
                      height: '20px',
                      background: 'linear-gradient(to bottom, #FFD700, #FFA500)',
                      opacity: 0.9,
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: '20px' }}
                    transition={{ 
                      duration: 1.2, 
                      delay: 1 + (i * 0.15),
                      ease: 'easeOut',
                    }}
                  />
                ))}
              </div>

              {/* Shimmer */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
                }}
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 2,
                  ease: 'easeInOut',
                  delay: 0.5,
                }}
              />
            </motion.div>

            {/* Elegant plate */}
            <div 
              className="w-72 h-3 rounded-full mt-2"
              style={{
                background: 'linear-gradient(to bottom, #E5E5E5, #C0C0C0)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.5)',
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* Interaction prompt */}
      <AnimatePresence>
        {phase === 'candle-lit' && !hasBlown && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="absolute bottom-32 z-50"
          >
            <motion.p
              className="text-white/90 font-light text-lg tracking-wide"
              style={{
                fontFamily: "'Playfair Display', serif",
                textShadow: '0 2px 12px rgba(0,0,0,0.6)',
              }}
              animate={{
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              Make a wish and blow the candle
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebration light rays */}
      <AnimatePresence>
        {phase === 'celebration' && (
          <>
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={`ray-${i}`}
                className="absolute"
                style={{
                  top: '50%',
                  left: '50%',
                  width: '4px',
                  height: '200px',
                  background: `linear-gradient(to bottom, ${
                    ['rgba(255,215,0,0.8)', 'rgba(255,182,193,0.8)', 'rgba(230,230,250,0.8)'][i % 3]
                  }, transparent)`,
                  transformOrigin: 'top center',
                  rotate: `${(i * 360) / 12}deg`,
                }}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scaleY: [0, 1.5, 2],
                }}
                transition={{
                  duration: 1.5,
                  ease: 'easeOut',
                }}
              />
            ))}

            {/* Floating elegant particles */}
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                className="absolute rounded-full"
                style={{
                  left: '50%',
                  top: '50%',
                  width: `${4 + Math.random() * 8}px`,
                  height: `${4 + Math.random() * 8}px`,
                  background: [
                    'radial-gradient(circle, #FFD700, transparent)',
                    'radial-gradient(circle, #FFB6C1, transparent)',
                    'radial-gradient(circle, #E6E6FA, transparent)',
                  ][i % 3],
                }}
                initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
                animate={{ 
                  scale: [0, 1.5, 1],
                  opacity: [1, 0.8, 0],
                  x: (Math.random() - 0.5) * 400,
                  y: -(Math.random() * 300 + 100),
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.03,
                  ease: 'easeOut',
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
