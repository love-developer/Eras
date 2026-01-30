import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Bell, Sun, Coffee } from 'lucide-react';

interface SunriseAlarmClockProps {
  onUnlock: () => void;
  senderName?: string;
}

type Phase = 'ticking' | 'ringing' | 'sunrise' | 'celebrating';

export function SunriseAlarmClock({ onUnlock, senderName }: SunriseAlarmClockProps) {
  const [phase, setPhase] = useState<Phase>('ticking');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [currentMinute, setCurrentMinute] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoProgressTimerRef = useRef<NodeJS.Timeout>();
  
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
    if (!hasInteracted && phase === 'ticking') {
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
  }, [hasInteracted, phase]);
  
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
          onUnlock();
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

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center transition-all duration-1000"
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
          className="relative cursor-pointer"
        >
          <div className="text-center mb-8">
            <motion.h2 
              className="text-3xl font-bold text-amber-100 mb-2"
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              Fresh Start
            </motion.h2>
            <p className="text-slate-200">
              {senderName ? `${senderName} sent you a new beginning` : 'A new day awaits'}
            </p>
            <p className="text-sm text-slate-300/70 mt-2">Click to stop the alarm</p>
          </div>

          {/* Alarm Clock */}
          <div className="relative">
            {/* Clock Body */}
            <motion.div
              className="relative w-64 h-64 rounded-full shadow-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                border: '8px solid #475569',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
              }}
            >
              {/* Clock Face */}
              <div className="absolute inset-8 rounded-full bg-slate-100 shadow-inner">
                {/* Hour markers */}
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-3 bg-slate-800"
                    style={{
                      top: '8px',
                      left: '50%',
                      transformOrigin: 'center 120px',
                      transform: `translateX(-50%) rotate(${i * 30}deg)`
                    }}
                  />
                ))}
                
                {/* Center dot */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-800 z-20" />
                
                {/* Hour hand (pointing at 7) */}
                <div
                  className="absolute w-2 h-16 bg-slate-800 rounded-full origin-bottom"
                  style={{
                    bottom: '50%',
                    left: '50%',
                    transform: 'translateX(-50%) rotate(210deg)' // 7 o'clock
                  }}
                />
                
                {/* Minute hand (pointing at 12, then ticking) */}
                <motion.div
                  className="absolute w-1.5 h-20 bg-slate-600 rounded-full origin-bottom"
                  style={{
                    bottom: '50%',
                    left: '50%',
                    transform: `translateX(-50%) rotate(${currentMinute}deg)`
                  }}
                />
                
                {/* Digital display */}
                <div className="absolute top-16 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-800 text-amber-400 text-sm font-mono rounded">
                  7:00 AM
                </div>
              </div>
              
              {/* Twin Bells on Top */}
              <motion.div
                className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-2"
                animate={{
                  rotate: [-3, 3, -3]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5
                }}
              >
                <div className="w-8 h-10 rounded-t-full bg-amber-600 border-2 border-amber-700" />
                <div className="w-8 h-10 rounded-t-full bg-amber-600 border-2 border-amber-700" />
              </motion.div>
            </motion.div>
            
            {/* Red Stop Button */}
            <motion.button
              onClick={handleStopAlarm}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleStopAlarm();
                }
              }}
              className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-red-600 hover:bg-red-500 shadow-xl flex items-center justify-center cursor-pointer border-4 border-red-700"
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
              <Bell className="w-8 h-8 text-white" />
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Phase 2: Ringing */}
      {phase === 'ringing' && (
        <motion.div
          className="relative"
        >
          {/* Shaking Clock */}
          <motion.div
            className="relative w-64 h-64 rounded-full shadow-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
              border: '8px solid #475569',
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
            <div className="absolute inset-8 rounded-full bg-slate-100 shadow-inner">
              {/* Hour markers */}
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-3 bg-slate-800"
                  style={{
                    top: '8px',
                    left: '50%',
                    transformOrigin: 'center 120px',
                    transform: `translateX(-50%) rotate(${i * 30}deg)`
                  }}
                />
              ))}
              
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-800 z-20" />
              
              <div
                className="absolute w-2 h-16 bg-slate-800 rounded-full origin-bottom"
                style={{
                  bottom: '50%',
                  left: '50%',
                  transform: 'translateX(-50%) rotate(210deg)'
                }}
              />
              
              <div
                className="absolute w-1.5 h-20 bg-slate-600 rounded-full origin-bottom"
                style={{
                  bottom: '50%',
                  left: '50%',
                  transform: 'translateX(-50%) rotate(0deg)'
                }}
              />
              
              <div className="absolute top-16 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-800 text-amber-400 text-sm font-mono rounded">
                7:00 AM
              </div>
            </div>
            
            {/* Ringing Bells */}
            <motion.div
              className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-2"
              animate={{
                rotate: [-15, 15, -15, 15, -15, 15, -15, 0]
              }}
              transition={{
                duration: 0.3,
                repeat: 5
              }}
            >
              <div className="w-8 h-10 rounded-t-full bg-amber-600 border-2 border-amber-700" />
              <div className="w-8 h-10 rounded-t-full bg-amber-600 border-2 border-amber-700" />
            </motion.div>
          </motion.div>
          
          {/* Sound Wave Ripples */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-amber-400"
              initial={{ width: 0, height: 0, opacity: 0.8 }}
              animate={{
                width: 400,
                height: 400,
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
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-32 bg-gradient-to-t from-transparent via-yellow-400/60 to-transparent origin-bottom"
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
              className="w-64 h-64 rounded-full shadow-2xl"
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
          className="relative z-10 flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Sun in background */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2">
            <motion.div
              className="w-48 h-48 rounded-full"
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
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-24 bg-gradient-to-t from-transparent via-yellow-400/40 to-transparent origin-bottom"
                  style={{
                    transform: `translateX(-50%) translateY(-50%) rotate(${i * 30}deg)`,
                  }}
                />
              ))}
            </motion.div>
          </div>
          
          {/* Good Morning Text */}
          <motion.div
            className="text-center mb-8 relative z-20"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-5xl font-bold text-white mb-3 drop-shadow-lg">
              Good Morning!
            </h2>
            <p className="text-2xl text-amber-100 drop-shadow">
              A fresh start awaits
            </p>
          </motion.div>
          
          {/* Coffee Cup */}
          <motion.div
            className="relative mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
          >
            <Coffee className="w-20 h-20 text-amber-900" />
            
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
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-4xl"
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
          
          {/* Sender Name */}
          {senderName && (
            <motion.p
              className="absolute bottom-12 text-2xl font-bold text-amber-900 drop-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
            >
              From: {senderName}
            </motion.p>
          )}
        </motion.div>
      )}
    </div>
  );
}
