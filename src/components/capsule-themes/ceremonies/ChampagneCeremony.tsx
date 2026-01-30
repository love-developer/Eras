import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wine, Sparkles, Heart } from 'lucide-react';
// import { getOptimalParticleCount } from '@/utils/performance';
import { getOptimalParticleCount, getOptimalDuration } from '../../../utils/performance';


interface ChampagneCeremonyProps {
  onComplete: () => void;
  isVisible: boolean;
}

export function ChampagneCeremony({ onComplete, isVisible }: ChampagneCeremonyProps) {
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [hasPopped, setHasPopped] = useState(false);
  const [celebrationPhase, setCelebrationPhase] = useState<'idle' | 'anticipation' | 'popped' | 'clinking' | 'celebration'>('idle');
  const [showAnticipation, setShowAnticipation] = useState(false);
  const [leftGlassTouched, setLeftGlassTouched] = useState(false);
  const [rightGlassTouched, setRightGlassTouched] = useState(false);
  const [glassesPosition, setGlassesPosition] = useState({ left: 30, right: 70 });
  const [sunsetIntensity, setSunsetIntensity] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastShakeTime = useRef<number>(0);
  const shakeCount = useRef<number>(0);

  // Initialize audio
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  // Play cork pop sound with more bass
  const playPopSound = useCallback(() => {
    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(120, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(0.6, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  }, [initAudio]);

  // Play glass clink sound
  const playClinkSound = useCallback(() => {
    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;

    // High-pitched crystal glass sound
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = 'sine';
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(2000, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.8);
  }, [initAudio]);

  // Play fizz sound
  const playFizzSound = useCallback(() => {
    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = 'sine';
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(4000, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  }, [initAudio]);

  // Play celebration chime with reverb
  const playCelebrationChime = useCallback(() => {
    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;

    // Play ascending notes with longer sustain
    const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C
    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 1.5);
      
      oscillator.start(ctx.currentTime + i * 0.15);
      oscillator.stop(ctx.currentTime + i * 0.15 + 1.5);
    });
  }, [initAudio]);

  // Handle shake gesture
  const handleShake = useCallback(() => {
    if (hasPopped) return;

    const now = Date.now();
    
    // Count rapid shakes
    if (now - lastShakeTime.current < 500) {
      shakeCount.current++;
    } else {
      shakeCount.current = 1;
    }
    lastShakeTime.current = now;

    setIsShaking(true);
    initAudio();

    // Increase intensity
    setShakeIntensity(prev => {
      const newIntensity = Math.min(100, prev + 8);
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(20);
      }

      // Play fizz sound
      if (Math.random() > 0.7) {
        playFizzSound();
      }

      // Ready to pop at 100%
      if (newIntensity >= 100 && celebrationPhase === 'idle') {
        triggerPop();
      }

      return newIntensity;
    });

    setTimeout(() => setIsShaking(false), 100);
  }, [hasPopped, celebrationPhase, playFizzSound, initAudio]);

  // Trigger cork pop with golden hour bloom
  const triggerPop = useCallback(() => {
    setHasPopped(true);
    setCelebrationPhase('anticipation');
    setShowAnticipation(true);

    // Strong haptic
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);

    // Anticipation pause
    setTimeout(() => {
      setShowAnticipation(false);
      setCelebrationPhase('popped');

      // Pop sound
      playPopSound();

      // Trigger sunset bloom
      let intensity = 0;
      const bloomInterval = setInterval(() => {
        intensity += 5;
        setSunsetIntensity(intensity);
        if (intensity >= 100) {
          clearInterval(bloomInterval);
        }
      }, 30);

      // Celebration haptic
      if (navigator.vibrate) navigator.vibrate([100, 30, 100]);

      // Show glasses after 800ms
      setTimeout(() => {
        setCelebrationPhase('clinking');
      }, 800);
    }, 800);
  }, [playPopSound]);

  // Handle glass touch
  const handleGlassTouch = useCallback((side: 'left' | 'right') => {
    if (celebrationPhase !== 'clinking') return;

    if (side === 'left') {
      setLeftGlassTouched(true);
      // Haptic
      if (navigator.vibrate) navigator.vibrate(10);
    } else {
      setRightGlassTouched(true);
      // Haptic
      if (navigator.vibrate) navigator.vibrate(10);
    }
  }, [celebrationPhase]);

  // Check if both glasses are touched - trigger clink
  useEffect(() => {
    if (leftGlassTouched && rightGlassTouched && celebrationPhase === 'clinking') {
      // Animate glasses moving together
      const moveInterval = setInterval(() => {
        setGlassesPosition(prev => {
          const newLeft = prev.left + 2;
          const newRight = prev.right - 2;
          
          if (newLeft >= 45) {
            clearInterval(moveInterval);
            // Trigger celebration
            setTimeout(() => {
              playClinkSound();
              playCelebrationChime();
              setCelebrationPhase('celebration');
              
              // Strong clink haptic
              if (navigator.vibrate) navigator.vibrate([50, 30, 100, 30, 50]);

              // Complete after celebration
              setTimeout(() => {
                onComplete();
              }, 3500);
            }, 100);
            return { left: 47, right: 53 };
          }
          
          return { left: newLeft, right: newRight };
        });
      }, 16);
    }
  }, [leftGlassTouched, rightGlassTouched, celebrationPhase, playClinkSound, playCelebrationChime, onComplete]);

  // Device motion shake detection
  useEffect(() => {
    if (!isVisible || hasPopped) return;

    let lastX = 0, lastY = 0, lastZ = 0;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      const x = acc.x || 0;
      const y = acc.y || 0;
      const z = acc.z || 0;

      const deltaX = Math.abs(x - lastX);
      const deltaY = Math.abs(y - lastY);
      const deltaZ = Math.abs(z - lastZ);

      const totalShake = deltaX + deltaY + deltaZ;

      if (totalShake > 20) {
        handleShake();
      }

      lastX = x;
      lastY = y;
      lastZ = z;
    };

    window.addEventListener('devicemotion', handleMotion);

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [isVisible, hasPopped, handleShake]);

  if (!isVisible) return null;

  return (
    <motion.div 
      className="relative flex flex-col items-center justify-center w-full h-full select-none overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* GOLDEN HOUR SUNSET BLOOM BACKGROUND */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          opacity: sunsetIntensity / 100
        }}
        style={{
          background: `
            radial-gradient(ellipse at center, 
              rgba(251, 191, 36, 0.4) 0%, 
              rgba(245, 158, 11, 0.3) 30%, 
              rgba(217, 119, 6, 0.2) 60%, 
              transparent 100%
            )
          `
        }}
      />

      {/* VOLUMETRIC GOD RAYS */}
      <AnimatePresence>
        {celebrationPhase === 'popped' || celebrationPhase === 'clinking' || celebrationPhase === 'celebration' ? (
          <>
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={`godray-${i}`}
                className="absolute bottom-0 left-1/2 origin-bottom pointer-events-none"
                style={{
                  width: '2px',
                  height: '100%',
                  background: `linear-gradient(to top, rgba(251, 191, 36, 0.6), transparent)`,
                  transform: `translateX(-50%) rotate(${(i - 6) * 15}deg)`,
                  filter: 'blur(2px)'
                }}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ 
                  opacity: [0, 0.8, 0.6],
                  scaleY: [0, 1]
                }}
                transition={{ duration: 1.2, delay: i * 0.05 }}
              />
            ))}
          </>
        ) : null}
      </AnimatePresence>

      {/* LENS FLARE */}
      <AnimatePresence>
        {celebrationPhase === 'celebration' && (
          <motion.div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 pointer-events-none"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 0.7, 0],
              scale: [0, 1.5, 2, 3]
            }}
            transition={{ duration: 2 }}
          >
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 bg-amber-200/40 rounded-full blur-3xl" />
              <div className="absolute inset-4 bg-amber-100/60 rounded-full blur-2xl" />
              <div className="absolute inset-8 bg-white/80 rounded-full blur-xl" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BACKGROUND SPARKLES */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={`sparkle-bg-${i}`}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.2
            }}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
          </motion.div>
        ))}
      </div>

      {/* INSTRUCTIONS */}
      <AnimatePresence>
        {!hasPopped && shakeIntensity < 30 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-32 z-50"
          >
            <div className="flex flex-col items-center gap-3">
              <motion.div
                animate={{
                  rotate: isShaking ? [-10, 10, -10, 10, 0] : 0
                }}
                transition={{ duration: 0.3 }}
              >
                <Wine className="w-12 h-12 text-amber-600 drop-shadow-lg" />
              </motion.div>
              <div className="px-6 py-3 rounded-full bg-amber-900/20 backdrop-blur-md border border-amber-600/30">
                <p className="text-amber-900 font-serif text-xl font-bold">
                  Shake to uncork the champagne!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CLINKING INSTRUCTIONS */}
      <AnimatePresence>
        {celebrationPhase === 'clinking' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-32 z-50"
          >
            <div className="px-6 py-3 rounded-full bg-amber-900/20 backdrop-blur-md border border-amber-600/30">
              <p className="text-amber-900 font-serif text-xl font-bold">
                Tap both glasses to toast! 🥂
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PROGRESS INDICATOR */}
      <div className="absolute top-8 right-8 z-50">
        <motion.div 
          className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-amber-900/20 backdrop-blur-md border border-amber-600/30"
          animate={{
            scale: hasPopped ? [1, 1.2, 1] : 1
          }}
          transition={{ duration: 0.5 }}
        >
          <Heart className="w-5 h-5 text-amber-700" fill={shakeIntensity > 50 ? "currentColor" : "none"} />
          <span className="text-amber-900 font-bold text-sm">
            {shakeIntensity}%
          </span>
        </motion.div>
      </div>

      {/* PREMIUM CHAMPAGNE BOTTLE - Enhanced SVG Rendering */}
      <motion.div
        className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10"
        onClick={handleShake}
        onTouchStart={handleShake}
        animate={{
          rotate: isShaking ? [0, -5, 5, -3, 3, 0] : 0,
          y: isShaking ? [0, -3, 3, -2, 2, 0] : 0,
          scale: celebrationPhase === 'anticipation' ? [1, 1.05, 1.02] : 
                 celebrationPhase === 'popped' || celebrationPhase === 'clinking' || celebrationPhase === 'celebration' ? 0.8 : 1,
          opacity: celebrationPhase === 'popped' || celebrationPhase === 'clinking' || celebrationPhase === 'celebration' ? 0.3 : 1
        }}
        transition={{ duration: 0.1 }}
        style={{ cursor: hasPopped ? 'default' : 'pointer' }}
      >
        <svg width="128" height="384" viewBox="0 0 128 384" className="drop-shadow-2xl">
          <defs>
            {/* Metallic Gold Gradient for Foil */}
            <linearGradient id="goldFoil" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="30%" stopColor="#f59e0b" />
              <stop offset="60%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>

            {/* Glass Gradient with Refraction */}
            <linearGradient id="glassGreen" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#064e3b" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#065f46" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0.8" />
            </linearGradient>

            {/* Champagne Liquid */}
            <linearGradient id="champagneLiquid" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.5" />
            </linearGradient>

            {/* Glass Shine */}
            <linearGradient id="glassShine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="50%" stopColor="white" stopOpacity="0.4" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Cork (pops off) */}
          <AnimatePresence>
            {!hasPopped && (
              <motion.g
                exit={{
                  y: -200,
                  x: (Math.random() - 0.5) * 100,
                  rotate: 360,
                  opacity: 0
                }}
                transition={{
                  exit: { duration: 0.8, ease: 'easeOut' }
                }}
              >
                {/* Cork body */}
                <rect x="40" y="8" width="48" height="32" rx="8" fill="#92400e" />
                <rect x="44" y="40" width="40" height="12" fill="#78350f" />
                
                {/* Wire cage */}
                <path d="M 40 12 L 88 12 L 88 36 L 40 36 Z" 
                      stroke="#d97706" 
                      strokeWidth="2" 
                      fill="none" 
                      opacity="0.6" />
              </motion.g>
            )}
          </AnimatePresence>

          {/* Foil Wrapper with Embossing */}
          <rect x="36" y="48" width="56" height="20" fill="url(#goldFoil)" />
          <rect x="36" y="48" width="56" height="20" fill="url(#glassShine)" opacity="0.3" />

          {/* Bottle Neck */}
          <rect x="40" y="68" width="48" height="96" rx="4" fill="url(#glassGreen)" />
          
          {/* Neck Shine */}
          <rect x="48" y="68" width="4" height="96" fill="white" opacity="0.3" rx="2" />
          
          {/* Liquid in Neck */}
          <motion.rect 
            x="40" 
            y="68" 
            width="48" 
            height="96" 
            rx="4" 
            fill="url(#champagneLiquid)"
            animate={{
              height: isShaking ? [96, 88, 96] : 96
            }}
            transition={{ duration: 0.2 }}
          />

          {/* Bottle Body */}
          <ellipse cx="64" cy="164" rx="60" ry="12" fill="url(#glassGreen)" />
          <rect x="4" y="164" width="120" height="180" fill="url(#glassGreen)" />
          <ellipse cx="64" cy="344" rx="60" ry="12" fill="url(#glassGreen)" />

          {/* Body Glass Shine */}
          <ellipse cx="28" cy="250" rx="8" ry="80" fill="white" opacity="0.3" />
          <ellipse cx="96" cy="250" rx="4" ry="80" fill="white" opacity="0.2" />

          {/* Liquid in Body */}
          <motion.g
            animate={{
              y: isShaking ? [0, -4, 4, -2, 2, 0] : 0
            }}
            transition={{ duration: 0.2 }}
          >
            <ellipse cx="64" cy="290" rx="56" ry="10" fill="url(#champagneLiquid)" />
            <rect x="8" y="290" width="112" height="50" fill="url(#champagneLiquid)" />
            <ellipse cx="64" cy="340" rx="56" ry="10" fill="url(#champagneLiquid)" />
          </motion.g>

          {/* Embossed Label */}
          <g>
            <rect x="24" y="220" width="80" height="64" rx="4" fill="#fef3c7" opacity="0.95" />
            <rect x="24" y="220" width="80" height="64" rx="4" stroke="#d97706" strokeWidth="1" fill="none" opacity="0.4" />
            
            {/* Label Text */}
            <text x="64" y="245" textAnchor="middle" fontSize="14" fontFamily="serif" fontWeight="bold" fill="#78350f">
              Golden
            </text>
            <text x="64" y="260" textAnchor="middle" fontSize="10" fontFamily="serif" fill="#92400e">
              Hour
            </text>
            
            {/* Label Heart */}
            <path d="M 64 268 L 68 264 Q 72 260 72 266 Q 72 272 64 278 Q 56 272 56 266 Q 56 260 60 264 Z" 
                  fill="#d97706" />
          </g>

          {/* Pressure Glow */}
          <AnimatePresence>
            {shakeIntensity > 50 && !hasPopped && (
              <motion.rect
                x="4"
                y="164"
                width="120"
                height="180"
                fill="#fbbf24"
                opacity="0.2"
                animate={{
                  opacity: [0.1, 0.3, 0.1]
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity
                }}
              />
            )}
          </AnimatePresence>

          {/* Bottle Base */}
          <ellipse cx="64" cy="356" rx="64" ry="8" fill="#064e3b" opacity="0.9" />
        </svg>

        {/* Condensation Droplets */}
        <AnimatePresence>
          {!hasPopped && shakeIntensity > 30 && Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={`droplet-${i}`}
              className="absolute w-1 h-2 bg-white/40 rounded-full blur-[0.5px]"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${30 + Math.random() * 40}%`
              }}
              initial={{ opacity: 0, y: 0 }}
              animate={{
                opacity: [0, 0.6, 0],
                y: [0, 20]
              }}
              transition={{
                duration: 2 + Math.random(),
                delay: i * 0.3,
                repeat: Infinity
              }}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* ANTICIPATION EFFECT */}
      <AnimatePresence>
        {showAnticipation && (
          <>
            {/* Screen shake */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{
                x: [0, -8, 8, -6, 6, -4, 4, 0],
                y: [0, 6, -6, 4, -4, 2, -2, 0]
              }}
              transition={{ duration: 0.6 }}
            >
              {/* Brightness build */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-b from-amber-200 to-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.5] }}
                transition={{ duration: 0.6 }}
              />
            </motion.div>

            {/* Pop text */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1.3, 1],
                opacity: [0, 1, 1]
              }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-6xl font-bold text-amber-900 drop-shadow-2xl font-serif">
                🍾 POP! 
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CHAMPAGNE GLASSES - Interactive Clinking */}
      <AnimatePresence>
        {celebrationPhase === 'clinking' && (
          <>
            {/* Left Glass */}
            <motion.div
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer"
              style={{ left: `${glassesPosition.left}%` }}
              initial={{ scale: 0, rotate: -180, opacity: 0, x: -100 }}
              animate={{
                scale: leftGlassTouched ? [1, 1.1, 1] : 1,
                rotate: 0,
                opacity: 1,
                x: 0
              }}
              transition={{ duration: 0.6, type: 'spring' }}
              onTouchStart={() => handleGlassTouch('left')}
              onClick={() => handleGlassTouch('left')}
            >
              <motion.div
                animate={{
                  y: leftGlassTouched ? [0, -10, 0] : 0,
                  filter: leftGlassTouched ? 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.8))' : 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))'
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-7xl">🥂</div>
              </motion.div>
              {/* Sparkle indicator */}
              <AnimatePresence>
                {leftGlassTouched && (
                  <>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <motion.div
                        key={`left-sparkle-${i}`}
                        className="absolute top-0 left-1/2"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                          opacity: [0, 1, 0],
                          scale: [0, 1],
                          x: Math.cos((i / 6) * Math.PI * 2) * 30,
                          y: Math.sin((i / 6) * Math.PI * 2) * 30
                        }}
                        transition={{ duration: 0.6 }}
                      >
                        <Sparkles className="w-4 h-4 text-amber-400" />
                      </motion.div>
                    ))}
                  </>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Right Glass */}
            <motion.div
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer"
              style={{ left: `${glassesPosition.right}%` }}
              initial={{ scale: 0, rotate: 180, opacity: 0, x: 100 }}
              animate={{
                scale: rightGlassTouched ? [1, 1.1, 1] : 1,
                rotate: 0,
                opacity: 1,
                x: 0
              }}
              transition={{ duration: 0.6, type: 'spring', delay: 0.1 }}
              onTouchStart={() => handleGlassTouch('right')}
              onClick={() => handleGlassTouch('right')}
            >
              <motion.div
                animate={{
                  y: rightGlassTouched ? [0, -10, 0] : 0,
                  filter: rightGlassTouched ? 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.8))' : 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))'
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-7xl">🥂</div>
              </motion.div>
              {/* Sparkle indicator */}
              <AnimatePresence>
                {rightGlassTouched && (
                  <>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <motion.div
                        key={`right-sparkle-${i}`}
                        className="absolute top-0 left-1/2"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                          opacity: [0, 1, 0],
                          scale: [0, 1],
                          x: Math.cos((i / 6) * Math.PI * 2) * 30,
                          y: Math.sin((i / 6) * Math.PI * 2) * 30
                        }}
                        transition={{ duration: 0.6 }}
                      >
                        <Sparkles className="w-4 h-4 text-amber-400" />
                      </motion.div>
                    ))}
                  </>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* GOLDEN ROSE BLOOM CELEBRATION */}
      <AnimatePresence>
        {celebrationPhase === 'celebration' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Ring Flash */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 bg-white" />
            </motion.div>

            {/* Champagne Spray → Golden Sparkles → Crystallized Gems */}
            {Array.from({ length: getOptimalParticleCount(80) }).map((_, i) => {
              const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
              const velocity = 150 + Math.random() * 350;
              const x = Math.cos(angle) * velocity;
              const y = Math.sin(angle) * velocity;
              const delay = i * 0.01;
              
              return (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: i % 3 === 0 ? '8px' : '4px',
                    height: i % 3 === 0 ? '8px' : '4px',
                    background: i % 3 === 0 
                      ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' 
                      : '#fef3c7'
                  }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: [0, x * 0.5, x],
                    y: [0, y * 0.5, y, y + 200],
                    opacity: [1, 1, 0.8, 0],
                    scale: [1, i % 3 === 0 ? 1.5 : 1, 0.5],
                    rotate: [0, Math.random() * 360]
                  }}
                  transition={{
                    duration: 2.5,
                    delay,
                    ease: [0.22, 0.61, 0.36, 1]
                  }}
                />
              );
            })}

            {/* Blooming Golden Rose */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              initial={{ scale: 0, opacity: 0, rotate: 0 }}
              animate={{
                scale: [0, 1.5, 1.2],
                opacity: [0, 1, 0.9, 0],
                rotate: [0, 180]
              }}
              transition={{ duration: 3, ease: 'easeOut' }}
            >
              <svg width="200" height="200" viewBox="0 0 200 200">
                {/* Rose petals forming from champagne spray */}
                {Array.from({ length: 12 }).map((_, i) => {
                  const angle = (i / 12) * Math.PI * 2;
                  const x = 100 + Math.cos(angle) * 60;
                  const y = 100 + Math.sin(angle) * 60;
                  
                  return (
                    <motion.ellipse
                      key={`petal-${i}`}
                      cx={x}
                      cy={y}
                      rx="25"
                      ry="40"
                      fill="url(#goldFoil)"
                      opacity="0.8"
                      initial={{ scale: 0, rotate: 0 }}
                      animate={{
                        scale: [0, 1.2, 1],
                        rotate: [0, angle * (180 / Math.PI)]
                      }}
                      transition={{
                        duration: 1.5,
                        delay: i * 0.08,
                        ease: 'easeOut'
                      }}
                      style={{
                        transformOrigin: '100px 100px'
                      }}
                    />
                  );
                })}
                
                {/* Rose center */}
                <motion.circle
                  cx="100"
                  cy="100"
                  r="20"
                  fill="#f59e0b"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1] }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                />
              </svg>
            </motion.div>

            {/* Heart Burst */}
            {Array.from({ length: 16 }).map((_, i) => {
              const angle = (i / 16) * Math.PI * 2;
              const distance = 200;
              
              return (
                <motion.div
                  key={`heart-${i}`}
                  className="absolute top-1/2 left-1/2 text-4xl"
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    scale: 0,
                    opacity: 0 
                  }}
                  animate={{
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    scale: [0, 1.5, 1],
                    opacity: [0, 1, 0],
                    rotate: [0, 360]
                  }}
                  transition={{
                    duration: 2.5,
                    delay: 0.5 + i * 0.05,
                    ease: 'easeOut'
                  }}
                >
                  💛
                </motion.div>
              );
            })}

            {/* Cascading Golden Leaves */}
            {Array.from({ length: getOptimalParticleCount(30) }).map((_, i) => (
              <motion.div
                key={`leaf-${i}`}
                className="absolute text-3xl"
                style={{
                  left: `${(i * 3.33) % 100}%`,
                  top: '-10%'
                }}
                initial={{ y: 0, opacity: 0, rotate: 0 }}
                animate={{
                  y: [0, 700],
                  x: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 200],
                  rotate: [0, Math.random() * 720],
                  opacity: [0, 1, 0.9, 0]
                }}
                transition={{
                  duration: 3.5 + Math.random() * 2,
                  delay: 0.8 + i * 0.1,
                  ease: 'easeIn'
                }}
              >
                {i % 4 === 0 ? '🍂' : i % 4 === 1 ? '🌟' : i % 4 === 2 ? '✨' : '💫'}
              </motion.div>
            ))}

            {/* Floating Toast Glasses */}
            {[0, 1].map((i) => (
              <motion.div
                key={`toast-glass-${i}`}
                className="absolute text-6xl"
                style={{
                  left: i === 0 ? '25%' : '75%',
                  top: '40%'
                }}
                initial={{ scale: 0, rotate: -180, opacity: 0 }}
                animate={{
                  scale: [0, 1.3, 1.1],
                  rotate: [-180, 0],
                  y: [0, -60, -40],
                  opacity: [0, 1, 1, 0]
                }}
                transition={{
                  duration: 2.5,
                  delay: 1 + i * 0.15,
                  ease: 'easeOut'
                }}
              >
                🥂
              </motion.div>
            ))}

            {/* Golden Rings */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={`ring-${i}`}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-amber-400/60"
                style={{
                  width: `${100 + i * 80}px`,
                  height: `${100 + i * 80}px`
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 3],
                  opacity: [0.8, 0]
                }}
                transition={{
                  duration: 2,
                  delay: 0.3 + i * 0.2,
                  ease: 'easeOut'
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}