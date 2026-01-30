import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Bell, Sun, Coffee } from 'lucide-react';

interface FreshStartCeremonyProps {
  onComplete: () => void;
  isVisible: boolean;
}

type Phase = 'ticking' | 'ringing' | 'sunrise' | 'celebrating';

export function FreshStartCeremony({ onComplete, isVisible }: FreshStartCeremonyProps) {
  const [phase, setPhase] = useState<Phase>('ticking');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [currentMinute, setCurrentMinute] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoProgressTimerRef = useRef<NodeJS.Timeout>();
  
  // ⚡ MOBILE DETECTION for responsive sizing
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);
  
  // Ticking minute hand animation
  useEffect(() => {
    if (phase === 'ticking') {
      const interval = setInterval(() => {
        setCurrentMinute(prev => (prev + 6) % 360); // Move 6 degrees per tick (every 100ms = fast ticking)
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [phase]);
  
  // Auto-progress for non-touchscreen users
  useEffect(() => {
    if (!hasInteracted && phase === 'ticking' && isVisible) {
      autoProgressTimerRef.current = setTimeout(() => {
        console.log('⏰ Auto-progressing Fresh Start ceremony (no interaction detected)');
        handleStopAlarm();
      }, 2500); // Auto-progress after 2.5s
      
      return () => {
        if (autoProgressTimerRef.current) {
          clearTimeout(autoProgressTimerRef.current);
        }
      };
    }
  }, [hasInteracted, phase, isVisible]);
  
  // Morning sparkles confetti
  const fireMorningSparkles = () => {
    const duration = 2500;

    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '100';
    
    if (containerRef.current) {
      containerRef.current.appendChild(canvas);
      
      const myConfetti = confetti.create(canvas, {
        resize: true,
        useWorker: true
      });

      // Morning sparkles
      myConfetti({
        particleCount: 30,
        spread: 100,
        origin: { y: 0.4 },
        colors: ['#FFD700', '#FFA500', '#FFED4E', '#FFF9E6'],
        scalar: 1.5,
        gravity: 0.3,
        drift: 0.5
      });
      
      // Cleanup
      setTimeout(() => {
        if (canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
      }, duration + 1000);
    }
  };

  const handleStopAlarm = () => {
    if (phase !== 'ticking') return;
    
    setHasInteracted(true);
    
    // Clear auto-progress timer
    if (autoProgressTimerRef.current) {
      clearTimeout(autoProgressTimerRef.current);
    }
    
    // Phase 1 → 2: Ringing
    setPhase('ringing');
    
    setTimeout(() => {
      // Phase 2 → 3: Sunrise
      setPhase('sunrise');
      
      setTimeout(() => {
        // Phase 3 → 4: Celebrating
        setPhase('celebrating');
        fireMorningSparkles();
        
        setTimeout(() => {
          onComplete();
        }, 2500);
      }, 2500);
    }, 1500);
  };

  // Background gradient based on phase
  const getBackgroundGradient = () => {
    switch (phase) {
      case 'ticking':
        return 'linear-gradient(to bottom, #0f172a 0%, #1e293b 50%, #334155 100%)'; // Dark night
      case 'ringing':
        return 'linear-gradient(to bottom, #1e293b 0%, #475569 50%, #64748b 100%)'; // Pre-dawn gray
      case 'sunrise':
        return 'linear-gradient(to bottom, #ea580c 0%, #fb923c 50%, #fcd34d 100%)'; // Orange sunrise
      case 'celebrating':
        return 'linear-gradient(to bottom, #fbbf24 0%, #fde047 50%, #fef9c3 100%)'; // Golden morning
      default:
        return 'linear-gradient(to bottom, #0f172a 0%, #1e293b 100%)';
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center transition-all duration-1000 overflow-hidden"
      style={{
        background: getBackgroundGradient()
      }}
    >
      {/* Twinkling Stars (fade out during sunrise) */}
      {(phase === 'ticking' || phase === 'ringing') && (
        <>
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                top: `${Math.random() * 60}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [1, 1.5, 1]
              }}
              transition={{
                repeat: Infinity,
                duration: 2 + Math.random() * 2,
                delay: Math.random() * 2
              }}
            />
          ))}
        </>
      )}

      {/* Phase 1: Ticking */}
      {phase === 'ticking' && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className="relative cursor-pointer px-4 w-full max-w-md flex flex-col items-center"
        >
          <div className="text-center mb-4 md:mb-6">
            <motion.h2 
              className="text-2xl md:text-3xl font-bold text-amber-100 mb-2"
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              Fresh Start
            </motion.h2>
            <p className="text-sm md:text-base text-slate-200">A new day awaits</p>
            <p className="text-xs md:text-sm text-slate-300/70 mt-2">Click to stop the alarm</p>
          </div>

          {/* Alarm Clock Container - 🔥 FIXED OVERFLOW ISSUE */}
          <div className="relative w-full flex flex-col items-center" style={{ minHeight: isMobile ? '280px' : '360px' }}>
            {/* Twin Bells on Top - 🔥 MOVED OUTSIDE CLOCK FOR BETTER VISIBILITY */}
            <motion.div
              className={`flex gap-2 mb-2 z-10`}
              animate={{
                rotate: [-3, 3, -3]
              }}
              transition={{
                repeat: Infinity,
                duration: 1.5
              }}
            >
              <div className={`${isMobile ? 'w-7 h-9' : 'w-9 h-12'} rounded-t-full bg-amber-600 border-2 border-amber-700 shadow-lg`} />
              <div className={`${isMobile ? 'w-7 h-9' : 'w-9 h-12'} rounded-t-full bg-amber-600 border-2 border-amber-700 shadow-lg`} />
            </motion.div>
            
            {/* Clock Body */}
            <motion.div
              className={`relative ${isMobile ? 'w-56 h-56' : 'w-72 h-72'} rounded-full shadow-2xl flex items-center justify-center`}
              style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                border: isMobile ? '8px solid #475569' : '10px solid #475569',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
              }}
            >
              {/* Clock Face */}
              <div className={`absolute ${isMobile ? 'inset-7' : 'inset-9'} rounded-full bg-slate-100 shadow-inner`}>
                {/* Hour markers */}
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className={`absolute ${isMobile ? 'w-1 h-3' : 'w-1.5 h-4'} bg-slate-800 rounded-full`}
                    style={{
                      top: isMobile ? '8px' : '10px',
                      left: '50%',
                      transformOrigin: isMobile ? 'center 104px' : 'center 135px',
                      transform: `translateX(-50%) rotate(${i * 30}deg)`
                    }}
                  />
                ))}
                
                {/* Center dot */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'} rounded-full bg-slate-800 z-20 shadow-md`} />
                
                {/* Hour hand (pointing at 7) */}
                <div
                  className={`absolute ${isMobile ? 'w-2 h-14' : 'w-2.5 h-18'} bg-slate-800 rounded-full origin-bottom shadow-md`}
                  style={{
                    bottom: '50%',
                    left: '50%',
                    transform: 'translateX(-50%) rotate(210deg)' // 7 o'clock
                  }}
                />
                
                {/* Minute hand (pointing at 12, then ticking) */}
                <motion.div
                  className={`absolute ${isMobile ? 'w-1.5 h-20' : 'w-2 h-24'} bg-slate-600 rounded-full origin-bottom shadow-sm`}
                  style={{
                    bottom: '50%',
                    left: '50%',
                    transform: `translateX(-50%) rotate(${currentMinute}deg)`
                  }}
                />
                
                {/* Digital display */}
                <div className={`absolute ${isMobile ? 'top-14' : 'top-18'} left-1/2 -translate-x-1/2 ${isMobile ? 'px-3 py-1' : 'px-4 py-1.5'} bg-slate-800 text-amber-400 ${isMobile ? 'text-sm' : 'text-base'} font-mono rounded shadow-inner`}>
                  7:00 AM
                </div>
              </div>
            </motion.div>
            
            {/* Red Stop Button - 🔥 BETTER POSITIONED WITH MORE SPACE */}
            <motion.button
              onClick={handleStopAlarm}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleStopAlarm();
                }
              }}
              className={`mt-4 ${isMobile ? 'w-20 h-20' : 'w-24 h-24'} rounded-full bg-red-600 hover:bg-red-500 shadow-2xl flex items-center justify-center cursor-pointer border-4 border-red-700 z-10`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              animate={{
                boxShadow: [
                  '0 0 20px rgba(220, 38, 38, 0.5)',
                  '0 0 40px rgba(220, 38, 38, 0.8)',
                  '0 0 20px rgba(220, 38, 38, 0.5)'
                ]
              }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              aria-label="Stop alarm"
            >
              <Bell className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-white`} strokeWidth={2.5} />
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Phase 2: Ringing */}
      {phase === 'ringing' && (
        <motion.div
          className="relative w-full max-w-md flex flex-col items-center px-4"
          style={{ minHeight: isMobile ? '280px' : '360px' }}
        >
          {/* Ringing Bells - 🔥 MOVED OUTSIDE FOR VISIBILITY */}
          <motion.div
            className={`flex gap-2 mb-2 z-10`}
            animate={{
              rotate: [-15, 15, -15, 15, -15, 15, -15, 0]
            }}
            transition={{
              duration: 0.3,
              repeat: 5
            }}
          >
            <div className={`${isMobile ? 'w-7 h-9' : 'w-9 h-12'} rounded-t-full bg-amber-600 border-2 border-amber-700 shadow-lg`} />
            <div className={`${isMobile ? 'w-7 h-9' : 'w-9 h-12'} rounded-t-full bg-amber-600 border-2 border-amber-700 shadow-lg`} />
          </motion.div>
          
          {/* Shaking Clock */}
          <motion.div
            className={`relative ${isMobile ? 'w-56 h-56' : 'w-72 h-72'} rounded-full shadow-2xl flex items-center justify-center`}
            style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
              border: isMobile ? '8px solid #475569' : '10px solid #475569',
            }}
            animate={{
              x: [-5, 5, -5, 5, -5, 5, -5, 0],
              rotate: [-2, 2, -2, 2, -2, 2, -2, 0]
            }}
            transition={{
              duration: 0.5,
              repeat: 3
            }}
          >
            {/* Clock Face */}
            <div className={`absolute ${isMobile ? 'inset-7' : 'inset-9'} rounded-full bg-slate-100 shadow-inner`}>
              {/* Hour markers */}
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute ${isMobile ? 'w-1 h-3' : 'w-1.5 h-4'} bg-slate-800 rounded-full`}
                  style={{
                    top: isMobile ? '8px' : '10px',
                    left: '50%',
                    transformOrigin: isMobile ? 'center 104px' : 'center 135px',
                    transform: `translateX(-50%) rotate(${i * 30}deg)`
                  }}
                />
              ))}
              
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'} rounded-full bg-slate-800 z-20 shadow-md`} />
              
              <div
                className={`absolute ${isMobile ? 'w-2 h-14' : 'w-2.5 h-18'} bg-slate-800 rounded-full origin-bottom shadow-md`}
                style={{
                  bottom: '50%',
                  left: '50%',
                  transform: 'translateX(-50%) rotate(210deg)'
                }}
              />
              
              <div
                className={`absolute ${isMobile ? 'w-1.5 h-20' : 'w-2 h-24'} bg-slate-600 rounded-full origin-bottom shadow-sm`}
                style={{
                  bottom: '50%',
                  left: '50%',
                  transform: 'translateX(-50%) rotate(0deg)'
                }}
              />
              
              <div className={`absolute ${isMobile ? 'top-14' : 'top-18'} left-1/2 -translate-x-1/2 ${isMobile ? 'px-3 py-1' : 'px-4 py-1.5'} bg-slate-800 text-amber-400 ${isMobile ? 'text-sm' : 'text-base'} font-mono rounded shadow-inner`}>
                7:00 AM
              </div>
            </div>
          </motion.div>
          
          {/* Sound Wave Ripples */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${isMobile ? 'border-2' : 'border-4'} border-amber-400`}
              initial={{ width: 0, height: 0, opacity: 0.8 }}
              animate={{
                width: isMobile ? 350 : 450,
                height: isMobile ? 350 : 450,
                opacity: 0
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.5,
                ease: 'easeOut'
              }}
            />
          ))}
        </motion.div>
      )}

      {/* Phase 3: Sunrise */}
      {phase === 'sunrise' && (
        <>
          {/* Rising Sun */}
          <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2"
            initial={{ y: 200 }}
            animate={{ y: -100 }}
            transition={{
              duration: 2.5,
              ease: 'easeOut'
            }}
          >
            {/* Sun Rays */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 ${isMobile ? 'h-28' : 'h-36'} bg-gradient-to-t from-transparent via-yellow-400/60 to-transparent origin-bottom`}
                style={{
                  transform: `translateX(-50%) translateY(-50%) rotate(${i * 30}deg)`,
                }}
                animate={{
                  opacity: [0.6, 1, 0.6],
                  scaleY: [1, 1.2, 1]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  delay: i * 0.1
                }}
              />
            ))}
            
            {/* Sun Circle */}
            <motion.div
              className={`${isMobile ? 'w-56 h-56' : 'w-72 h-72'} rounded-full shadow-2xl`}
              style={{
                background: 'radial-gradient(circle, #fde047 0%, #fb923c 100%)',
                boxShadow: '0 0 80px rgba(251, 146, 60, 0.8)'
              }}
              animate={{
                boxShadow: [
                  '0 0 80px rgba(251, 146, 60, 0.6)',
                  '0 0 120px rgba(251, 146, 60, 1)',
                  '0 0 80px rgba(251, 146, 60, 0.6)'
                ]
              }}
              transition={{
                repeat: Infinity,
                duration: 3
              }}
            />
          </motion.div>
          
          {/* Fading stars */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                top: `${Math.random() * 60}%`,
                left: `${Math.random() * 100}%`,
              }}
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 2 }}
            />
          ))}
        </>
      )}

      {/* Phase 4: Celebrating */}
      {phase === 'celebrating' && (
        <motion.div
          className="relative z-10 flex flex-col items-center justify-center px-4 w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Sun in background */}
          <div className={`absolute ${isMobile ? 'top-12' : 'top-20'} left-1/2 -translate-x-1/2`}>
            <motion.div
              className={`${isMobile ? 'w-36 h-36' : 'w-52 h-52'} rounded-full`}
              style={{
                background: 'radial-gradient(circle, #fde047 0%, #fb923c 100%)',
                boxShadow: '0 0 100px rgba(251, 146, 60, 0.6)'
              }}
              animate={{
                rotate: 360
              }}
              transition={{
                repeat: Infinity,
                duration: 20,
                ease: 'linear'
              }}
            >
              {/* Rotating sun rays */}
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 ${isMobile ? 'h-20' : 'h-28'} bg-gradient-to-t from-transparent via-yellow-400/40 to-transparent origin-bottom`}
                  style={{
                    transform: `translateX(-50%) translateY(-50%) rotate(${i * 30}deg)`,
                  }}
                />
              ))}
            </motion.div>
          </div>
          
          {/* Good Morning Text */}
          <motion.div
            className="text-center mb-4 md:mb-8 relative z-20"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-2 md:mb-3 drop-shadow-lg">
              Good Morning!
            </h2>
            <p className="text-xl md:text-2xl text-amber-100 drop-shadow">
              A fresh start awaits
            </p>
          </motion.div>
          
          {/* Coffee Cup */}
          <motion.div
            className="relative mb-4 md:mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
          >
            <Coffee className={`${isMobile ? 'w-20 h-20' : 'w-24 h-24'} text-amber-900 drop-shadow-lg`} strokeWidth={1.5} />
            
            {/* Steam particles */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute -top-4 left-1/2 w-2 h-2 bg-white/60 rounded-full"
                animate={{
                  y: [-20, -40],
                  x: [0, (i - 2) * 5],
                  opacity: [0.6, 0],
                  scale: [1, 1.5]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  delay: i * 0.3,
                  ease: 'easeOut'
                }}
              />
            ))}
          </motion.div>
          
          {/* Flying Doves */}
          {[...Array(isMobile ? 3 : 6)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute ${isMobile ? 'text-2xl' : 'text-4xl'}`}
              style={{
                top: `${30 + i * 10}%`,
                left: -50
              }}
              animate={{
                x: ['0vw', '110vw'],
                y: [0, -20, 0, -20, 0]
              }}
              transition={{
                duration: 5 + i,
                delay: 0.5 + i * 0.3,
                ease: 'linear'
              }}
            >
              🕊️
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
