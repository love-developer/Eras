import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface NewYearCeremonyProps {
  onComplete: () => void;
  isVisible: boolean;
  capsule?: {
    deliveryDate?: string;
    createdAt?: string;
  };
}

type CountdownLevel = 5 | 4 | 3 | 2 | 1 | 0;

export function NewYearCeremony({ onComplete, isVisible, capsule }: NewYearCeremonyProps) {
  const [countdown, setCountdown] = useState<CountdownLevel>(5);
  const [isStarted, setIsStarted] = useState(false);
  const [ballDrop, setBallDrop] = useState(0); // 0-5 (drop level)
  const [showExplosion, setShowExplosion] = useState(false);
  const [fireworks, setFireworks] = useState<Array<{ id: number; x: number; y: number; color: string; size: 'small' | 'large'; delay: number }>>([]);
  const [showBanner, setShowBanner] = useState(false);
  const [showYear, setShowYear] = useState(false);
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; rotation: number; color: string; delay: number }>>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const clickSoundTimerRef = useRef<number | null>(null);

  // Initialize audio
  React.useEffect(() => {
    if (isVisible && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.log('Audio not available');
      }
    }
  }, [isVisible]);

  // Calculate celebration year
  const getCelebrationYear = (): string => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (capsule?.deliveryDate || capsule?.createdAt) {
      const capsuleDate = new Date(capsule.deliveryDate || capsule.createdAt);
      return capsuleDate.getFullYear().toString();
    }
    
    if (currentMonth === 11) {
      return (currentYear + 1).toString();
    }
    
    return currentYear.toString();
  };

  const celebrationYear = getCelebrationYear();

  // Sound effects
  const playSound = (frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) => {
    if (!audioContextRef.current) return;
    
    try {
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.log('Sound playback failed');
    }
  };

  const playTick = (count: number) => {
    const frequency = count <= 1 ? 900 : 700;
    playSound(frequency, 0.08, 'square', 0.25);
  };

  const playExplosion = () => {
    playSound(150, 0.6, 'sawtooth', 0.4);
    setTimeout(() => playSound(200, 0.4, 'sine', 0.3), 100);
  };

  const vibrate = (pattern: number | number[]) => {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  // Start the countdown
  const handleStart = () => {
    setIsStarted(true);
    vibrate(50);
  };

  // Handle each click to drop the ball
  const handleClick = () => {
    if (!isStarted || countdown === 0) return;

    const newCountdown = (countdown - 1) as CountdownLevel;
    setCountdown(newCountdown);
    setBallDrop(5 - newCountdown);
    
    playTick(newCountdown);
    vibrate(newCountdown <= 1 ? [60, 30, 60] : 40);

    if (newCountdown === 0) {
      // MIDNIGHT! Start celebration
      setTimeout(() => {
        triggerCelebration();
      }, 300);
    }
  };

  // Trigger massive celebration
  const triggerCelebration = () => {
    setShowExplosion(true);
    playExplosion();
    vibrate([100, 50, 100, 50, 150]);

    // Launch fireworks in waves for performance
    setTimeout(() => launchFireworksWave1(), 200);
    setTimeout(() => launchFireworksWave2(), 600);
    setTimeout(() => launchFireworksWave3(), 1100);
    setTimeout(() => launchFireworksWave4(), 1600);
    setTimeout(() => launchFireworksFinale(), 2100);

    // Show banner
    setTimeout(() => {
      setShowBanner(true);
    }, 800);

    // Show year
    setTimeout(() => {
      setShowYear(true);
    }, 1300);

    // Generate confetti efficiently
    setTimeout(() => {
      const confettiArray = Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        rotation: Math.random() * 360,
        color: ['#FF0000', '#FFD700', '#00FF00', '#0000FF', '#FF00FF', '#FFA500', '#00FFFF', '#FF69B4'][i % 8],
        delay: Math.random() * 0.8,
      }));
      setConfetti(confettiArray);
    }, 400);

    // Complete ceremony
    setTimeout(() => {
      onComplete();
    }, 5000);
  };

  // Fireworks waves - staggered for performance
  const launchFireworksWave1 = () => {
    const wave1 = [
      { id: 1, x: 20, y: 25, color: '#FF0000', size: 'small' as const, delay: 0 },
      { id: 2, x: 80, y: 30, color: '#00FF00', size: 'small' as const, delay: 0.1 },
      { id: 3, x: 50, y: 20, color: '#0000FF', size: 'small' as const, delay: 0.2 },
    ];
    setFireworks(prev => [...prev, ...wave1]);
  };

  const launchFireworksWave2 = () => {
    const wave2 = [
      { id: 4, x: 35, y: 28, color: '#FFD700', size: 'large' as const, delay: 0 },
      { id: 5, x: 65, y: 22, color: '#FF00FF', size: 'large' as const, delay: 0.15 },
    ];
    setFireworks(prev => [...prev, ...wave2]);
  };

  const launchFireworksWave3 = () => {
    const wave3 = [
      { id: 6, x: 15, y: 35, color: '#00FFFF', size: 'small' as const, delay: 0 },
      { id: 7, x: 50, y: 15, color: '#FFA500', size: 'large' as const, delay: 0.1 },
      { id: 8, x: 85, y: 33, color: '#FF69B4', size: 'small' as const, delay: 0.2 },
    ];
    setFireworks(prev => [...prev, ...wave3]);
  };

  const launchFireworksWave4 = () => {
    const wave4 = [
      { id: 9, x: 25, y: 18, color: '#FFD700', size: 'large' as const, delay: 0 },
      { id: 10, x: 75, y: 25, color: '#FF0000', size: 'large' as const, delay: 0.12 },
      { id: 11, x: 45, y: 30, color: '#00FF00', size: 'small' as const, delay: 0.25 },
    ];
    setFireworks(prev => [...prev, ...wave4]);
  };

  const launchFireworksFinale = () => {
    const finale = [
      { id: 12, x: 30, y: 12, color: '#FFD700', size: 'large' as const, delay: 0 },
      { id: 13, x: 50, y: 8, color: '#FFD700', size: 'large' as const, delay: 0.08 },
      { id: 14, x: 70, y: 15, color: '#FFD700', size: 'large' as const, delay: 0.16 },
      { id: 15, x: 40, y: 20, color: '#FF00FF', size: 'large' as const, delay: 0.24 },
      { id: 16, x: 60, y: 18, color: '#00FFFF', size: 'large' as const, delay: 0.32 },
    ];
    setFireworks(prev => [...prev, ...finale]);
  };

  if (!isVisible) return null;

  return (
    <div 
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden select-none"
      style={{
        background: showExplosion 
          ? 'linear-gradient(to bottom, #1a0a3e, #2a1a4e, #1a0a3e)'
          : 'linear-gradient(to bottom, #0a0a2e, #1a1a3e, #0a0a1e)',
        transition: 'background 0.5s ease',
      }}
      onClick={isStarted ? handleClick : undefined}
    >
      {/* City Skyline */}
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none">
        {/* Buildings silhouette */}
        <div className="absolute bottom-0 left-[5%] w-[15%] h-36 bg-gradient-to-t from-slate-900 to-slate-800" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 20%, 90% 20%, 90% 10%, 80% 10%, 80% 0, 20% 0, 20% 10%, 10% 10%, 10% 20%, 0 20%)' }}>
          {/* Windows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="absolute w-2 h-2 bg-yellow-200/60" style={{ left: `${20 + (i % 3) * 25}%`, top: `${30 + Math.floor(i / 3) * 20}%` }} />
          ))}
        </div>
        <div className="absolute bottom-0 left-[22%] w-[18%] h-44 bg-gradient-to-t from-slate-900 to-slate-800" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 15%, 85% 15%, 85% 5%, 15% 5%, 15% 15%, 0 15%)' }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="absolute w-2 h-2 bg-yellow-200/60" style={{ left: `${15 + (i % 4) * 20}%`, top: `${25 + Math.floor(i / 4) * 18}%` }} />
          ))}
        </div>
        <div className="absolute bottom-0 left-[42%] w-[16%] h-32 bg-gradient-to-t from-slate-900 to-slate-800" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 25%, 0 25%)' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="absolute w-2 h-2 bg-yellow-200/60" style={{ left: `${20 + (i % 3) * 30}%`, top: `${35 + Math.floor(i / 3) * 25}%` }} />
          ))}
        </div>
        <div className="absolute bottom-0 right-[22%] w-[20%] h-40 bg-gradient-to-t from-slate-900 to-slate-800" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 10%, 75% 10%, 75% 0, 25% 0, 25% 10%, 0 10%)' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="absolute w-2 h-2 bg-yellow-200/60" style={{ left: `${15 + (i % 4) * 22}%`, top: `${20 + Math.floor(i / 4) * 20}%` }} />
          ))}
        </div>
        <div className="absolute bottom-0 right-[5%] w-[14%] h-36 bg-gradient-to-t from-slate-900 to-slate-800" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 22%, 0 22%)' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="absolute w-2 h-2 bg-yellow-200/60" style={{ left: `${20 + (i % 3) * 25}%`, top: `${30 + Math.floor(i / 3) * 22}%` }} />
          ))}
        </div>
      </div>

      {/* Instructions */}
      <AnimatePresence>
        {!isStarted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center z-50 px-4"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="mb-6"
            >
              <Sparkles className="w-24 h-24 mx-auto text-yellow-300" />
            </motion.div>
            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 mb-4" style={{ textShadow: '0 0 40px rgba(255, 215, 0, 0.5)' }}>
              New Year's Eve
            </h2>
            <p className="text-white/90 text-xl mb-3 font-medium">
              Times Square Ball Drop
            </p>
            <p className="text-white/70 text-lg mb-10">
              Click 5 times to drop the ball!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
              className="px-16 py-5 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-slate-900 rounded-full text-2xl font-black shadow-2xl uppercase tracking-wide"
              style={{ boxShadow: '0 0 40px rgba(250, 204, 21, 0.6), 0 10px 30px rgba(0, 0, 0, 0.5)' }}
            >
              Start Countdown
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Times Square Tower with Ball */}
      <AnimatePresence>
        {isStarted && countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Tower structure */}
            <div className="relative" style={{ width: '200px', height: '70vh' }}>
              {/* Main pole */}
              <div 
                className="absolute left-1/2 -translate-x-1/2 w-3 bg-gradient-to-b from-slate-400 via-slate-500 to-slate-600"
                style={{ 
                  height: '100%',
                  boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.5), 0 0 20px rgba(255,255,255,0.2)',
                }}
              />

              {/* Level markers (5 levels) */}
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className="absolute left-1/2 -translate-x-1/2 transition-all duration-300"
                  style={{
                    top: `${level * 20}%`,
                    width: '120px',
                    height: '2px',
                    background: ballDrop > level 
                      ? 'linear-gradient(to right, transparent, #fbbf24, transparent)' 
                      : 'linear-gradient(to right, transparent, #64748b, transparent)',
                    boxShadow: ballDrop > level ? '0 0 10px #fbbf24' : 'none',
                  }}
                />
              ))}

              {/* Illuminated number markers */}
              {[5, 4, 3, 2, 1].map((num, idx) => (
                <motion.div
                  key={num}
                  className="absolute left-full ml-8 font-black text-4xl transition-all duration-300"
                  style={{
                    top: `${idx * 20 - 2}%`,
                    color: ballDrop >= idx ? '#fbbf24' : '#475569',
                    textShadow: ballDrop >= idx ? '0 0 20px #fbbf24' : 'none',
                  }}
                  animate={{
                    scale: ballDrop === idx ? [1, 1.3, 1] : 1,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {num}
                </motion.div>
              ))}

              {/* Crystal Ball */}
              <motion.div
                className="absolute left-1/2 -translate-x-1/2"
                animate={{
                  top: `${ballDrop * 20}%`,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 20,
                }}
                style={{
                  marginTop: '-60px', // Center on markers
                }}
              >
                {/* Ball structure */}
                <div className="relative w-28 h-28">
                  {/* Main sphere */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'radial-gradient(circle at 30% 30%, #ffffff, #fbbf24 30%, #f59e0b 60%, #d97706)',
                      boxShadow: `
                        inset -8px -8px 20px rgba(0,0,0,0.3),
                        inset 8px 8px 20px rgba(255,255,255,0.4),
                        0 0 60px rgba(251, 191, 36, ${0.6 + ballDrop * 0.1}),
                        0 0 100px rgba(251, 191, 36, ${0.3 + ballDrop * 0.1})
                      `,
                    }}
                  />

                  {/* Crystal facets */}
                  {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-sm"
                      style={{
                        width: '16px',
                        height: '16px',
                        left: `${25 + (i % 4) * 18}%`,
                        top: `${20 + Math.floor(i / 4) * 20}%`,
                        background: ['#FFD700', '#FFA500', '#FFFF00', '#FFE55C'][i % 4],
                        opacity: 0.5,
                        transform: `rotate(${i * 30}deg)`,
                      }}
                      animate={{
                        opacity: [0.4, 0.8, 0.4],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}

                  {/* Highlight */}
                  <div
                    className="absolute rounded-full"
                    style={{
                      width: '36px',
                      height: '36px',
                      top: '18%',
                      left: '18%',
                      background: 'radial-gradient(circle, rgba(255,255,255,0.9), transparent)',
                    }}
                  />

                  {/* Rotating light rays */}
                  <motion.div
                    className="absolute inset-0"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  >
                    {[0, 60, 120, 180, 240, 300].map((angle) => (
                      <div
                        key={angle}
                        className="absolute left-1/2 top-1/2 w-1 bg-yellow-200/60"
                        style={{
                          height: '80px',
                          transformOrigin: 'top center',
                          transform: `rotate(${angle}deg) translateX(-50%)`,
                          filter: 'blur(2px)',
                        }}
                      />
                    ))}
                  </motion.div>

                  {/* Pulsing glow rings */}
                  <motion.div
                    className="absolute inset-[-12px] rounded-full border-4 border-yellow-400/40"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.4, 0.7, 0.4],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Countdown Number Display */}
      <AnimatePresence mode="wait">
        {isStarted && countdown > 0 && (
          <motion.div
            key={countdown}
            initial={{ scale: 0.3, opacity: 0, y: -50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.5, opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="absolute z-40 pointer-events-none"
            style={{ top: '65%' }}
          >
            <div
              className="text-[140px] font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600"
              style={{
                textShadow: '0 0 50px rgba(251, 191, 36, 0.9), 0 0 100px rgba(251, 191, 36, 0.5)',
                WebkitTextStroke: '3px rgba(255, 215, 0, 0.3)',
              }}
            >
              {countdown}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click instruction */}
      <AnimatePresence>
        {isStarted && countdown > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-[12%] z-40 pointer-events-none"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="text-white/80 text-xl font-semibold"
            >
              Click to drop! 👆
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ball explosion when it reaches bottom */}
      <AnimatePresence>
        {showExplosion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute z-30 pointer-events-none"
            style={{ top: '50%', left: '50%' }}
          >
            {/* Central flash */}
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 4, opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(255, 255, 255, 1), rgba(251, 191, 36, 0.8), transparent)',
              }}
            />

            {/* Explosion particles */}
            {Array.from({ length: 40 }).map((_, i) => {
              const angle = (i * 9) * (Math.PI / 180);
              const distance = 80 + Math.random() * 60;
              return (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 rounded-full -translate-x-1/2 -translate-y-1/2"
                  style={{
                    background: ['#FFD700', '#FFA500', '#FFFF00', '#FFE55C'][i % 4],
                    boxShadow: '0 0 8px currentColor',
                  }}
                  initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                  animate={{
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    scale: 0,
                    opacity: 0,
                  }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fireworks - optimized rendering */}
      <AnimatePresence>
        {fireworks.map((firework) => {
          const particleCount = firework.size === 'large' ? 28 : 18;
          
          return (
            <motion.div
              key={firework.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute pointer-events-none"
              style={{
                left: `${firework.x}%`,
                top: `${firework.y}%`,
              }}
            >
              {/* Center burst flash */}
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: [0, 2.5, 0], opacity: [1, 0.6, 0] }}
                transition={{ duration: 0.7, delay: firework.delay }}
                className="absolute w-8 h-8 rounded-full -translate-x-1/2 -translate-y-1/2"
                style={{ 
                  backgroundColor: firework.color,
                  filter: 'blur(8px)',
                }}
              />

              {/* Firework particles */}
              {Array.from({ length: particleCount }).map((_, i) => {
                const angle = (i * (360 / particleCount) * Math.PI) / 180;
                const distance = firework.size === 'large' ? 100 : 70;
                const variation = Math.random() * 25;
                
                return (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2"
                    style={{ backgroundColor: firework.color }}
                    initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                    animate={{
                      x: Math.cos(angle) * (distance + variation),
                      y: Math.sin(angle) * (distance + variation),
                      scale: 0,
                      opacity: 0,
                    }}
                    transition={{
                      duration: firework.size === 'large' ? 1.8 : 1.4,
                      delay: firework.delay,
                      ease: 'easeOut',
                    }}
                  />
                );
              })}

              {/* Sparkle trails for large fireworks */}
              {firework.size === 'large' && Array.from({ length: 8 }).map((_, i) => {
                const angle = (i * 45 * Math.PI) / 180;
                return (
                  <motion.div
                    key={`sparkle-${i}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                    animate={{
                      x: Math.cos(angle) * 60,
                      y: Math.sin(angle) * 60,
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: firework.delay + 0.3,
                      ease: 'easeOut',
                    }}
                  >
                    <Sparkles className="w-4 h-4" style={{ color: firework.color }} />
                  </motion.div>
                );
              })}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Happy New Year Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 150, damping: 20 }}
            className="absolute z-50 top-[15%] px-8 py-6 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 rounded-lg"
            style={{
              boxShadow: '0 0 60px rgba(251, 191, 36, 0.8), 0 10px 40px rgba(0, 0, 0, 0.5)',
              border: '4px solid #FFD700',
            }}
          >
            <motion.h1
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-5xl md:text-6xl font-black text-white uppercase tracking-wider"
              style={{
                textShadow: '0 0 30px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6)',
              }}
            >
              Happy New Year!
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Year Reveal */}
      <AnimatePresence>
        {showYear && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -180 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 150, damping: 15, delay: 0.2 }}
            className="absolute z-50"
            style={{ top: '40%' }}
          >
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                textShadow: [
                  '0 0 40px rgba(251, 191, 36, 0.8)',
                  '0 0 60px rgba(251, 191, 36, 1)',
                  '0 0 40px rgba(251, 191, 36, 0.8)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600"
              style={{
                WebkitTextStroke: '4px rgba(255, 215, 0, 0.5)',
              }}
            >
              {celebrationYear}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confetti storm - optimized */}
      <AnimatePresence>
        {confetti.map((piece) => (
          <motion.div
            key={piece.id}
            className="absolute w-3 h-3 pointer-events-none"
            style={{
              left: `${piece.x}%`,
              backgroundColor: piece.color,
              borderRadius: piece.id % 3 === 0 ? '50%' : '0',
            }}
            initial={{ y: '-5%', opacity: 1, rotate: piece.rotation }}
            animate={{
              y: '110%',
              rotate: piece.rotation + (Math.random() > 0.5 ? 720 : -720),
              opacity: [1, 1, 0.8, 0],
            }}
            transition={{
              duration: 3.5 + Math.random() * 1.5,
              delay: piece.delay,
              ease: 'linear',
            }}
          />
        ))}
      </AnimatePresence>

      {/* Additional streamer ribbons */}
      <AnimatePresence>
        {showBanner && Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={`streamer-${i}`}
            className="absolute w-2 h-32 pointer-events-none"
            style={{
              left: `${i * 7}%`,
              background: `linear-gradient(to bottom, ${['#FF0000', '#FFD700', '#00FF00', '#0000FF', '#FF00FF'][i % 5]}, transparent)`,
              transformOrigin: 'top center',
            }}
            initial={{ y: '-10%', scaleY: 0, opacity: 1, rotate: 0 }}
            animate={{
              y: '110%',
              scaleY: 1,
              rotate: Math.sin(i) * 180,
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: 4,
              delay: 0.4 + Math.random() * 0.6,
              ease: 'easeIn',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
