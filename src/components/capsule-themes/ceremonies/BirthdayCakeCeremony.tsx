import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, PartyPopper, Cake } from 'lucide-react';
import { getOptimalParticleCount } from '@/utils/performance';

// 🔥 PREMIUM SVG FLAME COMPONENT
const PremiumFlame = ({ isLit, index }: { isLit: boolean; index: number }) => {
  if (!isLit) return null;
  
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ 
        scale: [1, 1.5, 0],
        opacity: [1, 0.5, 0],
        y: [-50],
        rotate: [(Math.random() - 0.5) * 90]
      }}
      transition={{ 
        exit: { duration: 0.5, ease: 'easeOut' }
      }}
      className="absolute -top-8 left-1/2 -translate-x-1/2"
    >
      {/* Multi-layer radial glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,107,53,0.9) 0%, rgba(255,165,0,0.6) 30%, rgba(255,210,63,0.3) 60%, transparent 100%)',
          filter: 'blur(12px)',
          width: '32px',
          height: '32px',
          marginLeft: '-8px',
          marginTop: '-8px'
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      
      {/* Custom SVG Gradient Flame */}
      <motion.svg
        width="20"
        height="28"
        viewBox="0 0 20 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{
          scale: [1, 1.08, 0.98, 1],
          rotate: [-3, 3, -2, 0],
          y: [0, -1, 0]
        }}
        transition={{
          duration: 0.5 + (index * 0.05), // Slight variation per candle
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        <defs>
          {/* Outer flame gradient (orange-red) */}
          <radialGradient id={`flame-outer-${index}`} cx="50%" cy="60%">
            <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#FF8C42" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FFA500" stopOpacity="0.4" />
          </radialGradient>
          
          {/* Middle flame gradient (orange-yellow) */}
          <radialGradient id={`flame-middle-${index}`} cx="50%" cy="65%">
            <stop offset="0%" stopColor="#FFD23F" stopOpacity="1" />
            <stop offset="60%" stopColor="#FFA500" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FF8C42" stopOpacity="0" />
          </radialGradient>
          
          {/* Inner flame gradient (yellow-white core) */}
          <radialGradient id={`flame-inner-${index}`} cx="50%" cy="70%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="40%" stopColor="#FFF4E6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FFD23F" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Outer flame shape */}
        <path
          d="M10 2 C7 6, 4 10, 4 16 C4 22, 7 26, 10 26 C13 26, 16 22, 16 16 C16 10, 13 6, 10 2Z"
          fill={`url(#flame-outer-${index})`}
          opacity="0.8"
        />
        
        {/* Middle flame shape */}
        <path
          d="M10 4 C8 7, 6 11, 6 16 C6 20, 8 23, 10 23 C12 23, 14 20, 14 16 C14 11, 12 7, 10 4Z"
          fill={`url(#flame-middle-${index})`}
        />
        
        {/* Inner white-hot core */}
        <ellipse
          cx="10"
          cy="18"
          rx="3"
          ry="5"
          fill={`url(#flame-inner-${index})`}
        />
      </motion.svg>

      {/* Heat wave smoke particles while lit */}
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={`smoke-${index}-${i}`}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: '50%',
            top: '-10px',
            background: 'rgba(150, 150, 150, 0.4)'
          }}
          animate={{
            y: [0, -40],
            x: [(Math.random() - 0.5) * 8, (Math.random() - 0.5) * 16],
            opacity: [0.4, 0],
            scale: [1, 2.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'easeOut'
          }}
        />
      ))}
    </motion.div>
  );
};

// 💨 PREMIUM SMOKE WISP COMPONENT
const SmokeWisp = ({ index }: { index: number }) => {
  return (
    <motion.svg
      width="40"
      height="60"
      viewBox="0 0 40 60"
      className="absolute -top-8 left-1/2 -translate-x-1/2"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: [1, 2.5, 3],
        opacity: [0.7, 0.4, 0],
        y: [0, -50, -80],
        x: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 30]
      }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
    >
      <defs>
        <radialGradient id={`smoke-gradient-${index}`}>
          <stop offset="0%" stopColor="#9CA3AF" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#D1D5DB" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#E5E7EB" stopOpacity="0" />
        </radialGradient>
      </defs>
      
      {/* Organic smoke wisp path */}
      <path
        d="M20 50 Q15 40, 18 30 Q22 20, 17 10 Q15 5, 20 2"
        stroke="none"
        fill={`url(#smoke-gradient-${index})`}
        opacity="0.8"
      />
      <path
        d="M20 50 Q25 40, 22 30 Q18 20, 23 10 Q25 5, 20 2"
        stroke="none"
        fill={`url(#smoke-gradient-${index})`}
        opacity="0.6"
      />
    </motion.svg>
  );
};

interface BirthdayCakeCeremonyProps {
  onComplete: () => void;
  isVisible: boolean;
  age?: number; // NEW: Optional age for customization
  recipientName?: string; // NEW: Optional recipient name
}

export function BirthdayCakeCeremony({ onComplete, isVisible, age, recipientName }: BirthdayCakeCeremonyProps) {
  // Determine candle count based on age (default 5, max 20 for display)
  const candleCount = age && age <= 20 ? age : (age && age > 20 ? Math.min(age, 99) : 5);
  const displayCandleCount = Math.min(candleCount, 20); // Max 20 candles visually
  const useNumberCandle = age && age > 20; // Use number candle for ages > 20
  
  const [candlesLit, setCandlesLit] = useState(Array(displayCandleCount).fill(true));
  const [isBlowing, setIsBlowing] = useState(false);
  const [showAnticipation, setShowAnticipation] = useState(false);
  const [celebrationPhase, setCelebrationPhase] = useState<'idle' | 'anticipation' | 'wish' | 'explosion'>('idle');
  const [showWishPrompt, setShowWishPrompt] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const totalCandles = candlesLit.length;
  const litCount = candlesLit.filter(lit => lit).length;
  const allBlown = litCount === 0;

  // Initialize audio context on first interaction
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  // Play synth sound (for candle blow)
  const playBlowSound = useCallback(() => {
    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(150, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  }, [initAudio]);

  // Play success chime
  const playSuccessChime = useCallback(() => {
    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;

    // Play a major chord
    const frequencies = [523.25, 659.25, 783.99]; // C, E, G
    frequencies.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
      
      oscillator.start(ctx.currentTime + i * 0.1);
      oscillator.stop(ctx.currentTime + 1.5);
    });
  }, [initAudio]);

  // Play party horn sound
  const playPartyHorn = useCallback(() => {
    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(400, ctx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  }, [initAudio]);

  // Handle blow (click/tap anywhere)
  const handleBlow = useCallback(() => {
    if (allBlown || isBlowing) return;
    
    initAudio();
    setIsBlowing(true);
    
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(30);
    
    // Play blow sound
    playBlowSound();
    
    // Blow out random candle(s)
    setCandlesLit(prev => {
      const litIndices = prev.map((lit, i) => lit ? i : -1).filter(i => i !== -1);
      if (litIndices.length === 0) return prev;
      
      // Blow out 1-2 candles
      const numToBlow = Math.min(Math.ceil(Math.random() * 2), litIndices.length);
      const indicesToBlow = [];
      for (let i = 0; i < numToBlow; i++) {
        const randomIndex = litIndices[Math.floor(Math.random() * litIndices.length)];
        indicesToBlow.push(randomIndex);
        litIndices.splice(litIndices.indexOf(randomIndex), 1);
      }
      
      const newState = [...prev];
      indicesToBlow.forEach(i => {
        newState[i] = false;
      });
      
      return newState;
    });
    
    setTimeout(() => setIsBlowing(false), 300);
  }, [allBlown, isBlowing, playBlowSound, initAudio]);

  // Check if all candles are blown
  useEffect(() => {
    if (allBlown && celebrationPhase === 'idle') {
      // ANTICIPATION PHASE
      setCelebrationPhase('anticipation');
      setShowAnticipation(true);
      
      // Success haptic
      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
      
      // After anticipation, EXPLODE
      setTimeout(() => {
        setShowAnticipation(false);
        setCelebrationPhase('explosion');
        
        // Party horn sound
        playPartyHorn();
        
        // Success chime
        setTimeout(() => playSuccessChime(), 200);
        
        // Celebration haptic
        if (navigator.vibrate) navigator.vibrate([100, 30, 100, 30, 200]);
        
        // Complete after explosion
        setTimeout(() => {
          onComplete();
        }, 2000);
      }, 800);
    }
  }, [allBlown, celebrationPhase, onComplete, playPartyHorn, playSuccessChime]);

  if (!isVisible) return null;

  return (
    <motion.div 
      className="relative flex flex-col items-center justify-center w-full h-full select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={handleBlow}
      onTouchStart={handleBlow}
    >
      {/* BACKGROUND BALLOONS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={`balloon-${i}`}
            className="absolute text-4xl"
            style={{
              left: `${(i * 13) % 100}%`,
              bottom: '-10%'
            }}
            animate={{
              y: [0, -800],
              x: [(i % 2 ? -20 : 20), (i % 2 ? 20 : -20)],
              rotate: [(i % 2 ? -10 : 10), (i % 2 ? 10 : -10)]
            }}
            transition={{
              duration: 8 + (i % 4),
              repeat: Infinity,
              delay: i * 0.7,
              ease: 'easeOut'
            }}
          >
            {['🎈', '🎉', '🎊'][i % 3]}
          </motion.div>
        ))}
      </div>

      {/* INSTRUCTIONS */}
      <AnimatePresence>
        {!allBlown && litCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-24 z-50"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="px-6 py-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30">
                <p className="text-white font-handwriting text-xl font-bold">
                  Tap to blow out the candles!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WIND ICON - Just above candles, just below instructions */}
      <AnimatePresence>
        {!allBlown && litCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: 1, 
              scale: isBlowing ? [1, 1.3, 1] : 1,
              y: isBlowing ? [0, -10, 0] : 0
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-44 z-50"
            transition={{ duration: 0.3 }}
          >
            <Wind className="w-12 h-12 text-cyan-300 drop-shadow-lg" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* PROGRESS INDICATOR */}
      <div className="absolute top-8 right-8 z-50">
        <motion.div 
          className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30"
          animate={{
            scale: allBlown ? [1, 1.2, 1] : 1
          }}
          transition={{ duration: 0.5 }}
        >
          <PartyPopper className="w-5 h-5 text-pink-300" />
          <span className="text-white font-bold text-sm">
            {litCount}/{totalCandles}
          </span>
        </motion.div>
      </div>

      {/* AGE DISPLAY - Sparklers spelling out age */}
      <AnimatePresence>
        {age && !allBlown && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-32 z-40"
          >
            <div className="relative px-8 py-4 rounded-xl bg-gradient-to-r from-yellow-400/20 to-orange-500/20 backdrop-blur-md border-2 border-yellow-400/50">
              <motion.div
                className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-400"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  textShadow: '0 0 20px rgba(251, 191, 36, 0.5), 0 0 40px rgba(251, 146, 60, 0.3)'
                }}
                animate={{
                  textShadow: [
                    '0 0 20px rgba(251, 191, 36, 0.5), 0 0 40px rgba(251, 146, 60, 0.3)',
                    '0 0 30px rgba(251, 191, 36, 0.8), 0 0 60px rgba(251, 146, 60, 0.5)',
                    '0 0 20px rgba(251, 191, 36, 0.5), 0 0 40px rgba(251, 146, 60, 0.3)'
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {age}
              </motion.div>
              
              {/* Sparkle particles around number */}
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={`sparkle-${i}`}
                  className="absolute w-2 h-2"
                  style={{
                    left: `${10 + (i * 12)}%`,
                    top: i % 2 === 0 ? '-8px' : 'calc(100% + 8px)',
                    background: 'radial-gradient(circle, #fbbf24, #f59e0b)',
                    borderRadius: '50%',
                    boxShadow: '0 0 8px #fbbf24'
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                    y: i % 2 === 0 ? [-10, -20, -30] : [10, 20, 30]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeOut'
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RECIPIENT NAME - Balloon banner */}
      <AnimatePresence>
        {recipientName && !allBlown && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-16 z-30 flex gap-2"
          >
            {recipientName.split('').map((letter, i) => (
              <motion.div
                key={`letter-${i}`}
                className="relative"
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.1, type: 'spring', bounce: 0.5 }}
              >
                {/* Balloon */}
                <div className="relative w-10 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" 
                  style={{
                    background: ['#ff6b9d', '#c084fc', '#60a5fa', '#fbbf24', '#34d399'][i % 5],
                    boxShadow: `0 4px 12px ${['#ff6b9d', '#c084fc', '#60a5fa', '#fbbf24', '#34d399'][i % 5]}80`
                  }}
                >
                  {letter.toUpperCase()}
                  {/* Balloon shine */}
                  <div className="absolute top-1 left-2 w-3 h-3 rounded-full bg-white/40" />
                </div>
                {/* String */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gray-400" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* BIRTHDAY CAKE */}
      <motion.div 
        className="relative z-10"
        animate={{
          scale: celebrationPhase === 'anticipation' ? [1, 1.05, 1.02] : 1,
          rotate: celebrationPhase === 'anticipation' ? [0, -2, 2, -1, 1, 0] : 0
        }}
        transition={{
          duration: 0.6,
          ease: 'easeInOut'
        }}
      >
        <div className="relative w-72 h-80 flex flex-col items-center justify-end pb-8">
          
          {/* CANDLES */}
          <div className="relative flex gap-6 mb-4 z-20">
            {candlesLit.map((isLit, index) => {
              // 🎨 JEWEL TONE COLORS (refined palette)
              const candleColors = [
                { base: '#E91E63', highlight: '#F48FB1', shadow: '#AD1457' }, // Ruby
                { base: '#9C27B0', highlight: '#CE93D8', shadow: '#6A1B9A' }, // Amethyst
                { base: '#2196F3', highlight: '#90CAF9', shadow: '#1565C0' }, // Sapphire
                { base: '#00BCD4', highlight: '#80DEEA', shadow: '#00838F' }, // Aquamarine
                { base: '#4CAF50', highlight: '#A5D6A7', shadow: '#2E7D32' }, // Emerald
                { base: '#FFC107', highlight: '#FFE082', shadow: '#F57C00' }, // Gold
              ];
              const color = candleColors[index % candleColors.length];
              
              return (
                <div key={index} className="relative flex flex-col items-center">
                  {/* FLAME */}
                  <AnimatePresence>
                    {isLit && (
                      <PremiumFlame isLit={isLit} index={index} />
                    )}
                  </AnimatePresence>

                  {/* Smoke puff when blown out */}
                  <AnimatePresence>
                    {!isLit && (
                      <SmokeWisp index={index} />
                    )}
                  </AnimatePresence>

                  {/* PREMIUM CANDLE STICK - Wider with 3D effect */}
                  <motion.div
                    className="relative"
                    animate={{
                      y: isLit ? [0, -2, 0] : 0
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: isLit ? Infinity : 0
                    }}
                  >
                    {/* Main candle body - 8px wide with cylindrical gradient */}
                    <div
                      className="w-8 h-16 rounded-t-md relative overflow-hidden"
                      style={{
                        background: `linear-gradient(to right, ${color.shadow} 0%, ${color.base} 20%, ${color.highlight} 40%, ${color.base} 60%, ${color.shadow} 100%)`,
                        boxShadow: `inset 2px 0 4px ${color.highlight}40, inset -2px 0 4px ${color.shadow}60`
                      }}
                    >
                      {/* Glossy shine on left edge */}
                      <div 
                        className="absolute left-1 top-2 bottom-2 w-1.5 rounded-full opacity-50"
                        style={{
                          background: `linear-gradient(to bottom, ${color.highlight}, transparent)`
                        }}
                      />
                      
                      {/* Candy stripes - more visible */}
                      <div className="absolute inset-0 opacity-20"
                        style={{
                          background: `repeating-linear-gradient(
                            135deg,
                            transparent,
                            transparent 3px,
                            rgba(255,255,255,0.4) 3px,
                            rgba(255,255,255,0.4) 6px
                          )`
                        }}
                      />
                      
                      {/* Candle wick */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-3 bg-gray-800 rounded-sm" 
                        style={{
                          boxShadow: '0 1px 2px rgba(0,0,0,0.5)'
                        }}
                      />
                      
                      {/* Wax drip on side */}
                      {isLit && (
                        <motion.div
                          className="absolute top-4 -right-0.5 w-2 h-6 rounded-full opacity-80"
                          style={{
                            background: `linear-gradient(to bottom, ${color.base}, ${color.shadow})`,
                            clipPath: 'ellipse(40% 50% at 50% 30%)'
                          }}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 24, opacity: 0.8 }}
                          transition={{ duration: 2, delay: index * 0.3 }}
                        />
                      )}
                    </div>
                    
                    {/* Metallic candle holder base */}
                    <div 
                      className="w-10 h-2 rounded-full -mt-0.5"
                      style={{
                        background: 'linear-gradient(to bottom, #D4AF37, #C5A028, #B8941E)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
                      }}
                    />
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* CAKE - 3 Tiers */}
          <div className="relative flex flex-col items-center">
            {/* Top tier */}
            <motion.div 
              className="w-32 h-16 rounded-lg relative overflow-hidden mb-1"
              style={{
                background: 'linear-gradient(to bottom, #fbbf24, #f59e0b)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
              animate={{
                y: allBlown ? [0, -5, 0] : 0
              }}
              transition={{
                duration: 0.5,
                ease: 'easeInOut'
              }}
            >
              {/* Frosting */}
              <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-pink-200 to-pink-300 rounded-t-lg" />
              {/* Decorative dots */}
              <div className="absolute top-6 left-0 right-0 flex justify-around px-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-red-400" />
                ))}
              </div>
            </motion.div>

            {/* Middle tier */}
            <motion.div 
              className="w-48 h-20 rounded-lg relative overflow-hidden mb-1"
              style={{
                background: 'linear-gradient(to bottom, #f59e0b, #d97706)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-cyan-200 to-cyan-300 rounded-t-lg" />
              <div className="absolute top-8 left-0 right-0 flex justify-around px-4">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-purple-400" />
                ))}
              </div>
            </motion.div>

            {/* Bottom tier */}
            <motion.div 
              className="w-64 h-24 rounded-lg relative overflow-hidden"
              style={{
                background: 'linear-gradient(to bottom, #d97706, #b45309)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.4)'
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-5 bg-gradient-to-b from-purple-200 to-purple-300 rounded-t-lg" />
              <div className="absolute top-10 left-0 right-0 flex justify-around px-6">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-pink-400" />
                ))}
              </div>
            </motion.div>
          </div>

          {/* PLATE */}
          <div className="w-72 h-4 rounded-full bg-gradient-to-b from-gray-300 to-gray-400 mt-2 shadow-xl" />
        </div>
      </motion.div>

      {/* ANTICIPATION EFFECT */}
      <AnimatePresence>
        {showAnticipation && (
          <>
            {/* Screen shake container */}
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
                className="absolute inset-0 bg-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6] }}
                transition={{ duration: 0.6 }}
              />
            </motion.div>

            {/* "HAPPY BIRTHDAY!" text */}
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50 gap-6"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1.5, 1.2],
                opacity: [0, 1, 1]
              }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 drop-shadow-2xl font-handwriting">
                🎂 YAY! 🎂
              </div>
              
              {/* "Make a Wish!" message */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="px-8 py-4 rounded-full bg-white/90 backdrop-blur-md border-2 border-yellow-400 shadow-2xl"
              >
                <p className="text-2xl font-handwriting font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  ✨ Make a wish! ✨
                </p>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CONFETTI EXPLOSION */}
      <AnimatePresence>
        {celebrationPhase === 'explosion' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Premium confetti pieces with physics - 3x LARGER with variety */}
            {Array.from({ length: getOptimalParticleCount() }).map((_, i) => {
              const angle = (Math.random() * Math.PI * 2);
              const velocity = 200 + Math.random() * 300;
              const x = Math.cos(angle) * velocity;
              const y = Math.sin(angle) * velocity - 200; // Bias upward
              
              // 🎨 VARIETY: ribbons, circles, stars
              const shapes = ['ribbon', 'circle', 'star'];
              const shape = shapes[i % 3];
              
              // 🎨 METALLIC & JEWEL COLORS
              const colors = ['#FFD700', '#FF6B9D', '#C084FC', '#60A5FA', '#34D399', '#FFC107', '#E91E63', '#9C27B0'];
              const color = colors[i % colors.length];
              
              return (
                <motion.div
                  key={`confetti-${i}`}
                  className="absolute"
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                  initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                  animate={{
                    x: [0, x],
                    y: [0, y, y + 400], // Gravity
                    rotate: [0, Math.random() * 720],
                    opacity: [1, 1, 0]
                  }}
                  transition={{
                    duration: 2,
                    ease: [0.22, 0.61, 0.36, 1]
                  }}
                >
                  {shape === 'ribbon' && (
                    // Rectangle ribbon - 10px x 4px
                    <div 
                      className="w-10 h-1 rounded-sm"
                      style={{
                        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 50%, ${color} 100%)`,
                        boxShadow: `0 0 4px ${color}80`
                      }}
                    />
                  )}
                  {shape === 'circle' && (
                    // Circle - 8px
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: `radial-gradient(circle, ${color}, ${color}dd)`,
                        boxShadow: `0 0 6px ${color}aa`
                      }}
                    />
                  )}
                  {shape === 'star' && (
                    // Star shape
                    <svg width="12" height="12" viewBox="0 0 12 12">
                      <path
                        d="M6 0 L7.5 4 L12 4.5 L8.5 7.5 L9.5 12 L6 9.5 L2.5 12 L3.5 7.5 L0 4.5 L4.5 4 Z"
                        fill={color}
                        style={{ filter: `drop-shadow(0 0 3px ${color}aa)` }}
                      />
                    </svg>
                  )}
                </motion.div>
              );
            })}

            {/* Party poppers */}
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={`popper-${i}`}
                className="absolute text-4xl"
                style={{
                  left: `${20 + i * 15}%`,
                  top: '60%'
                }}
                initial={{ scale: 0, rotate: 0 }}
                animate={{
                  scale: [0, 1.5, 1],
                  rotate: [0, (i % 2 ? 360 : -360)],
                  y: [0, -100]
                }}
                transition={{
                  duration: 1,
                  delay: i * 0.1
                }}
              >
                🎉
              </motion.div>
            ))}

            {/* Balloons rising */}
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={`balloon-rise-${i}`}
                className="absolute text-5xl"
                style={{
                  left: `${15 + i * 12}%`,
                  bottom: '20%'
                }}
                initial={{ y: 0, opacity: 0 }}
                animate={{
                  y: [-600],
                  x: [(i % 2 ? -40 : 40)],
                  opacity: [0, 1, 0.8, 0],
                  rotate: [(i % 2 ? -20 : 20)]
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.15,
                  ease: 'easeOut'
                }}
              >
                🎈
              </motion.div>
            ))}

            {/* Present boxes */}
            {Array.from({ length: 4 }).map((_, i) => (
              <motion.div
                key={`present-${i}`}
                className="absolute text-3xl"
                style={{
                  left: `${25 + i * 20}%`,
                  top: '40%'
                }}
                initial={{ scale: 0, rotate: -180 }}
                animate={{
                  scale: [0, 1.2, 1],
                  rotate: [-180, 0],
                  y: [0, 50, 100, 150]
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.1,
                  ease: 'easeOut'
                }}
              >
                🎁
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}