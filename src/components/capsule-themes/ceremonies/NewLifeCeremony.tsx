import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// 🔥 Custom Phoenix SVG Component
const PhoenixIcon = ({ 
  className = "",
  burning = false,
  size = 120
}: { 
  className?: string;
  burning?: boolean;
  size?: number;
}) => {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      style={{ width: size, height: size }}
    >
      {/* Tail feathers - flowing flames */}
      <motion.path
        d="M 100 180 Q 70 160, 60 120 Q 50 80, 65 60"
        stroke={burning ? "#FF6B00" : "#8B4513"}
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        animate={burning ? {
          d: [
            "M 100 180 Q 70 160, 60 120 Q 50 80, 65 60",
            "M 100 180 Q 75 165, 65 125 Q 55 85, 70 65",
            "M 100 180 Q 70 160, 60 120 Q 50 80, 65 60"
          ]
        } : {}}
        transition={{ duration: 0.8, repeat: burning ? Infinity : 0 }}
      />
      <motion.path
        d="M 100 180 Q 130 160, 140 120 Q 150 80, 135 60"
        stroke={burning ? "#FFD700" : "#A0522D"}
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        animate={burning ? {
          d: [
            "M 100 180 Q 130 160, 140 120 Q 150 80, 135 60",
            "M 100 180 Q 125 165, 135 125 Q 145 85, 130 65",
            "M 100 180 Q 130 160, 140 120 Q 150 80, 135 60"
          ]
        } : {}}
        transition={{ duration: 0.8, repeat: burning ? Infinity : 0, delay: 0.2 }}
      />
      
      {/* Body */}
      <ellipse 
        cx="100" 
        cy="100" 
        rx="30" 
        ry="40" 
        fill={burning ? "#FF8C00" : "#CD853F"}
      />
      <ellipse 
        cx="100" 
        cy="98" 
        rx="25" 
        ry="35" 
        fill={burning ? "#FFA500" : "#DEB887"}
      />
      
      {/* Chest - golden glow when burning */}
      <ellipse 
        cx="100" 
        cy="105" 
        rx="18" 
        ry="25" 
        fill={burning ? "#FFD700" : "#F4A460"}
      />
      {burning && (
        <motion.ellipse 
          cx="100" 
          cy="105" 
          rx="18" 
          ry="25" 
          fill="#FFFF00"
          animate={{
            opacity: [0.3, 0.7, 0.3]
          }}
          transition={{ duration: 0.6, repeat: Infinity }}
        />
      )}
      
      {/* Head */}
      <circle 
        cx="100" 
        cy="70" 
        r="22" 
        fill={burning ? "#FF8C00" : "#CD853F"}
      />
      <circle 
        cx="100" 
        cy="68" 
        r="18" 
        fill={burning ? "#FFA500" : "#DEB887"}
      />
      
      {/* Crown feathers - flame-like when burning */}
      <motion.path
        d="M 90 55 Q 85 45, 88 35"
        stroke={burning ? "#FF4500" : "#8B4513"}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        animate={burning ? {
          d: [
            "M 90 55 Q 85 45, 88 35",
            "M 90 55 Q 83 42, 86 32",
            "M 90 55 Q 85 45, 88 35"
          ]
        } : {}}
        transition={{ duration: 0.5, repeat: burning ? Infinity : 0 }}
      />
      <motion.path
        d="M 100 52 Q 100 40, 103 28"
        stroke={burning ? "#FFD700" : "#A0522D"}
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        animate={burning ? {
          d: [
            "M 100 52 Q 100 40, 103 28",
            "M 100 52 Q 100 37, 103 25",
            "M 100 52 Q 100 40, 103 28"
          ]
        } : {}}
        transition={{ duration: 0.5, repeat: burning ? Infinity : 0, delay: 0.1 }}
      />
      <motion.path
        d="M 110 55 Q 115 45, 112 35"
        stroke={burning ? "#FF6B00" : "#8B4513"}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        animate={burning ? {
          d: [
            "M 110 55 Q 115 45, 112 35",
            "M 110 55 Q 117 42, 114 32",
            "M 110 55 Q 115 45, 112 35"
          ]
        } : {}}
        transition={{ duration: 0.5, repeat: burning ? Infinity : 0, delay: 0.2 }}
      />
      
      {/* Beak */}
      <path
        d="M 115 70 L 125 68 L 115 73 Z"
        fill={burning ? "#FFD700" : "#DAA520"}
      />
      
      {/* Eyes - glowing when burning */}
      <circle cx="92" cy="68" r="3.5" fill={burning ? "#FFFF00" : "#8B4513"} />
      <circle cx="108" cy="68" r="3.5" fill={burning ? "#FFFF00" : "#8B4513"} />
      {burning && (
        <>
          <motion.circle 
            cx="92" 
            cy="68" 
            r="5" 
            fill="#FFA500"
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          <motion.circle 
            cx="108" 
            cy="68" 
            r="5" 
            fill="#FFA500"
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        </>
      )}
      
      {/* Left wing */}
      <motion.g
        animate={burning ? {
          rotate: [0, -15, 0]
        } : {}}
        style={{ transformOrigin: '70px 100px' }}
        transition={{ duration: 1, repeat: burning ? Infinity : 0 }}
      >
        <path
          d="M 70 90 Q 30 80, 20 100 Q 15 115, 30 125 Q 45 115, 70 110 Z"
          fill={burning ? "#FF8C00" : "#CD853F"}
        />
        <path
          d="M 70 95 Q 35 85, 28 102 Q 25 112, 35 120 Q 48 112, 70 108 Z"
          fill={burning ? "#FFA500" : "#DEB887"}
        />
        {/* Wing feather details */}
        <path d="M 25 105 Q 20 110, 25 115" stroke={burning ? "#FFD700" : "#8B4513"} strokeWidth="2" fill="none" />
        <path d="M 35 100 Q 30 105, 35 110" stroke={burning ? "#FFD700" : "#8B4513"} strokeWidth="2" fill="none" />
        <path d="M 45 98 Q 40 103, 45 108" stroke={burning ? "#FFD700" : "#8B4513"} strokeWidth="2" fill="none" />
      </motion.g>
      
      {/* Right wing */}
      <motion.g
        animate={burning ? {
          rotate: [0, 15, 0]
        } : {}}
        style={{ transformOrigin: '130px 100px' }}
        transition={{ duration: 1, repeat: burning ? Infinity : 0, delay: 0.5 }}
      >
        <path
          d="M 130 90 Q 170 80, 180 100 Q 185 115, 170 125 Q 155 115, 130 110 Z"
          fill={burning ? "#FF8C00" : "#CD853F"}
        />
        <path
          d="M 130 95 Q 165 85, 172 102 Q 175 112, 165 120 Q 152 112, 130 108 Z"
          fill={burning ? "#FFA500" : "#DEB887"}
        />
        {/* Wing feather details */}
        <path d="M 175 105 Q 180 110, 175 115" stroke={burning ? "#FFD700" : "#8B4513"} strokeWidth="2" fill="none" />
        <path d="M 165 100 Q 170 105, 165 110" stroke={burning ? "#FFD700" : "#8B4513"} strokeWidth="2" fill="none" />
        <path d="M 155 98 Q 160 103, 155 108" stroke={burning ? "#FFD700" : "#8B4513"} strokeWidth="2" fill="none" />
      </motion.g>
    </svg>
  );
};

interface NewLifeCeremonyProps {
  isVisible: boolean;
  onComplete: () => void;
}

export function NewLifeCeremony({ isVisible, onComplete }: NewLifeCeremonyProps) {
  const [phase, setPhase] = useState<'intro' | 'fanning' | 'ignition' | 'rising' | 'flight' | 'reveal' | 'celebration'>('intro');
  const [swipeCount, setSwipeCount] = useState(0);
  const [fireIntensity, setFireIntensity] = useState(0);
  const [flames, setFlames] = useState<{ id: number; x: number; delay: number; }[]>([]);
  const [embers, setEmbers] = useState<{ id: number; x: number; y: number; }[]>([]);
  const [ashGlow, setAshGlow] = useState(false);
  const [phoenixVisible, setPhoenixVisible] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [mouseStart, setMouseStart] = useState<number | null>(null);

  const requiredSwipes = 7;

  // ✅ UNIFIED SWIPE HANDLER for both touch and mouse
  const handleSwipeUp = useCallback(() => {
    if (phase !== 'fanning') return;
    
    // Swipe UP detected!
    const newCount = swipeCount + 1;
    setSwipeCount(newCount);
    
    const newIntensity = Math.min((newCount / requiredSwipes) * 100, 100);
    setFireIntensity(newIntensity);
    
    // Haptic feedback - stronger as fire builds
    if (navigator.vibrate) {
      navigator.vibrate(30 + newIntensity * 0.5);
    }
    
    // Spawn flame
    const flame = { id: Date.now(), x: 45 + Math.random() * 10, delay: 0 };
    setFlames(prev => [...prev, flame]);
    setTimeout(() => {
      setFlames(prev => prev.filter(f => f.id !== flame.id));
    }, 1500);
    
    // Spawn embers
    if (newIntensity > 30) {
      const ember = { id: Date.now() + Math.random(), x: 40 + Math.random() * 20, y: 70 };
      setEmbers(prev => [...prev, ember]);
      setTimeout(() => {
        setEmbers(prev => prev.filter(e => e.id !== ember.id));
      }, 2000);
    }
    
    // Ash glow feedback
    setAshGlow(true);
    setTimeout(() => setAshGlow(false), 300);
    
    // Check for ignition
    if (newCount >= requiredSwipes) {
      setTimeout(() => {
        setPhase('ignition');
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100, 50, 200]);
        }
        
        setTimeout(() => {
          setPhase('rising');
          setPhoenixVisible(true);
          
          setTimeout(() => {
            setPhase('flight');
            
            setTimeout(() => {
              setPhase('reveal');
              
              setTimeout(() => {
                setPhase('celebration');
                setTimeout(onComplete, 3500);
              }, 2500);
            }, 3500);
          }, 2000);
        }, 2000);
      }, 500);
    }
  }, [phase, swipeCount, onComplete]);

  // Handle touch swipe up gesture
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStart === null || phase !== 'fanning') return;
    
    const touchEnd = e.changedTouches[0].clientY;
    const diff = touchStart - touchEnd; // Positive = swipe up
    const threshold = 50;
    
    if (diff > threshold) {
      handleSwipeUp();
    }
    
    setTouchStart(null);
  }, [touchStart, phase, handleSwipeUp]);

  // ✅ Handle mouse click/drag up gesture
  const handleMouseDown = (e: React.MouseEvent) => {
    setMouseStart(e.clientY);
  };

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (mouseStart === null || phase !== 'fanning') return;
    
    const mouseEnd = e.clientY;
    const diff = mouseStart - mouseEnd; // Positive = drag up
    const threshold = 50;
    
    if (diff > threshold) {
      handleSwipeUp();
    }
    
    setMouseStart(null);
  }, [mouseStart, phase, handleSwipeUp]);

  // ✅ Alternative: Simple click handler (for easier interaction)
  const handleClick = () => {
    if (phase !== 'fanning') return;
    handleSwipeUp();
  };

  // Auto-start
  useEffect(() => {
    if (isVisible && phase === 'intro') {
      setTimeout(() => setPhase('fanning'), 2000);
    }
  }, [isVisible, phase]);

  if (!isVisible) return null;

  return (
    <div
      className="relative inset-0 w-full h-full flex flex-col items-center justify-center overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
    >
      {/* Background - dark to sunrise */}
      <motion.div
        className="absolute inset-0"
        initial={{ background: 'linear-gradient(to bottom, #1a1a2e, #16213e)' }}
        animate={{
          background: phase === 'celebration' 
            ? 'linear-gradient(to bottom, #FF6B6B, #FFD93D, #6BCB77)'
            : phase === 'flight' || phase === 'reveal'
            ? 'linear-gradient(to bottom, #2C3E50, #34495E, #5D6D7E)'
            : 'linear-gradient(to bottom, #1a1a2e, #16213e)'
        }}
        transition={{ duration: 2 }}
      />

      {/* Stars - fade out during ignition */}
      <AnimatePresence>
        {(phase === 'intro' || phase === 'fanning') && (
          <>
            {[...Array(40)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 60}%`,
                  width: '2px',
                  height: '2px',
                  backgroundColor: '#FFF',
                  borderRadius: '50%',
                  boxShadow: '0 0 2px #FFF'
                }}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0.2, 0.8, 0.2],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Intro message */}
      <AnimatePresence>
        {phase === 'intro' && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="absolute top-20 text-center z-50"
          >
            <motion.div
              animate={{
                opacity: [0.6, 1, 0.6],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-gray-300 text-xl"
            >
              From the ashes...
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <AnimatePresence>
        {phase === 'fanning' && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="absolute top-12 md:top-16 text-center z-50 px-6"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-orange-300 mb-2 drop-shadow-lg">
              Fan the Flames 🔥
            </h2>
            <p className="text-orange-200 text-lg">
              Swipe UP to stoke the fire
            </p>
            <motion.div
              className="mt-2 text-yellow-400 text-base"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {swipeCount}/{requiredSwipes}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ash pile - transforms based on fire intensity */}
      <AnimatePresence>
        {(phase === 'fanning' || phase === 'intro') && (
          <motion.div
            className="absolute bottom-[30%] z-20"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
          >
            {/* Ash mound */}
            <div className="relative">
              {/* Base ash pile */}
              <div className="relative">
                <div 
                  className="w-40 h-24 md:w-48 md:h-28 rounded-t-full"
                  style={{
                    background: ashGlow
                      ? 'linear-gradient(to top, #4A4A4A, #6B6B6B)'
                      : 'linear-gradient(to top, #3A3A3A, #5A5A5A)',
                    boxShadow: ashGlow
                      ? '0 0 30px rgba(255, 140, 0, 0.5)'
                      : 'none',
                    transition: 'all 0.3s'
                  }}
                />
                
                {/* Cracks forming - appear as intensity increases */}
                {fireIntensity > 40 && (
                  <motion.div
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute h-full"
                        style={{
                          left: `${20 + i * 15}%`,
                          top: 0,
                          width: '2px',
                          background: 'linear-gradient(to bottom, #FF6B00, #FF4500)',
                          boxShadow: '0 0 8px #FF6B00'
                        }}
                        initial={{ scaleY: 0 }}
                        animate={{ 
                          scaleY: 1,
                          opacity: [0.6, 1, 0.6]
                        }}
                        transition={{
                          scaleY: { duration: 0.5, delay: i * 0.1 },
                          opacity: { duration: 1, repeat: Infinity }
                        }}
                      />
                    ))}
                  </motion.div>
                )}
                
                {/* Internal glow - intensifies with swipes */}
                {fireIntensity > 0 && (
                  <motion.div
                    className="absolute inset-0 rounded-t-full"
                    style={{
                      background: 'radial-gradient(circle, rgba(255, 107, 0, 0.6), transparent)',
                      opacity: fireIntensity / 100
                    }}
                    animate={{
                      opacity: [(fireIntensity / 100) * 0.5, fireIntensity / 100, (fireIntensity / 100) * 0.5]
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </div>
              
              {/* Small dormant phoenix silhouette visible in ashes */}
              {fireIntensity < 50 && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30">
                  <PhoenixIcon size={60} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flames rising from ashes */}
      <AnimatePresence>
        {flames.map(flame => (
          <motion.div
            key={flame.id}
            className="absolute bottom-[35%] text-4xl md:text-5xl pointer-events-none z-30"
            style={{
              left: `${flame.x}%`,
            }}
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ 
              opacity: [0, 1, 0.8, 0],
              y: -80,
              scale: [0.5, 1.2, 1, 0.8],
              rotate: [-10, 10, -5, 0]
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          >
            🔥
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Embers floating up */}
      <AnimatePresence>
        {embers.map(ember => (
          <motion.div
            key={ember.id}
            className="absolute pointer-events-none z-25"
            style={{
              left: `${ember.x}%`,
              top: `${ember.y}%`,
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#FF6B00',
              boxShadow: '0 0 8px #FF4500'
            }}
            initial={{ opacity: 1, y: 0 }}
            animate={{ 
              opacity: [1, 0.8, 0],
              y: -150 - Math.random() * 100,
              x: (Math.random() - 0.5) * 50
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
          />
        ))}
      </AnimatePresence>

      {/* Swipe up indicator */}
      <AnimatePresence>
        {phase === 'fanning' && swipeCount < 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 1, 0.4], y: [0, -30, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-[15%] text-5xl pointer-events-none z-40"
          >
            ☝️
          </motion.div>
        )}
      </AnimatePresence>

      {/* IGNITION - Massive explosion */}
      <AnimatePresence>
        {phase === 'ignition' && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-40"
          >
            {/* Flash of light */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.5 }}
              style={{ backgroundColor: '#FFD700' }}
            />
            
            {/* Explosion particles */}
            {[...Array(40)].map((_, i) => {
              const angle = (i / 40) * Math.PI * 2;
              const distance = 150 + Math.random() * 200;
              return (
                <motion.div
                  key={i}
                  className="absolute text-3xl md:text-4xl"
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                  initial={{ x: 0, y: 0, opacity: 0, rotate: 0 }}
                  animate={{
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    opacity: [0, 1, 0.8, 0],
                    rotate: Math.random() * 360
                  }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                >
                  {i % 3 === 0 ? '🔥' : i % 3 === 1 ? '✨' : '💥'}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* PHOENIX RISING */}
      <AnimatePresence>
        {phase === 'rising' && phoenixVisible && (
          <motion.div
            className="absolute z-50"
            initial={{ 
              bottom: '-20%',
              left: '50%',
              x: '-50%',
              scale: 0.5,
              opacity: 0
            }}
            animate={{ 
              bottom: '40%',
              scale: 1.5,
              opacity: 1,
              rotate: [0, -10, 10, 0]
            }}
            transition={{ 
              duration: 2,
              type: 'spring',
              stiffness: 100
            }}
          >
            <PhoenixIcon burning={true} size={150} />
            
            {/* Fire trail behind */}
            <motion.div
              className="absolute -bottom-20 left-1/2 -translate-x-1/2 text-6xl"
              animate={{
                opacity: [0.6, 1, 0.6],
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              🔥
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PHOENIX FLIGHT - Circling */}
      <AnimatePresence>
        {phase === 'flight' && (
          <>
            {/* Phoenix flies in a circle */}
            <motion.div
              className="absolute z-50"
              initial={{ 
                left: '50%',
                top: '40%',
              }}
              animate={{ 
                left: ['50%', '70%', '50%', '30%', '50%'],
                top: ['40%', '30%', '20%', '30%', '40%'],
              }}
              transition={{ 
                duration: 3.5,
                times: [0, 0.25, 0.5, 0.75, 1],
                ease: 'easeInOut'
              }}
              style={{ x: '-50%', y: '-50%' }}
            >
              <motion.div
                animate={{
                  rotate: [0, 360]
                }}
                transition={{ duration: 3.5, ease: 'linear' }}
              >
                <PhoenixIcon burning={true} size={120} />
              </motion.div>
            </motion.div>
            
            {/* Golden fire trails following flight path */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full z-45"
                style={{
                  background: 'radial-gradient(circle, #FFD700, #FF8C00)',
                  boxShadow: '0 0 10px #FFD700'
                }}
                initial={{ 
                  left: '50%',
                  top: '40%',
                  opacity: 0
                }}
                animate={{ 
                  left: ['50%', '70%', '50%', '30%', '50%'],
                  top: ['40%', '30%', '20%', '30%', '40%'],
                  opacity: [0, 0.8, 0]
                }}
                transition={{ 
                  duration: 3.5,
                  times: [0, 0.25, 0.5, 0.75, 1],
                  delay: i * 0.15,
                  ease: 'easeInOut'
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* REVEAL - Wings wrap capsule */}
      <AnimatePresence>
        {phase === 'reveal' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center z-50"
          >
            {/* Phoenix swoops to center */}
            <motion.div
              className="relative"
              initial={{ y: -200, scale: 1.5 }}
              animate={{ y: 0, scale: 1.8 }}
              transition={{ duration: 1, type: 'spring', stiffness: 80 }}
            >
              <PhoenixIcon burning={true} size={200} />
            </motion.div>
            
            {/* Capsule appears in center (protected by phoenix) */}
            <motion.div
              className="absolute"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              <div 
                className="w-20 h-24 md:w-24 md:h-28 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 0 40px rgba(255, 215, 0, 0.8)'
                }}
              >
                <div className="text-4xl md:text-5xl">📦</div>
              </div>
            </motion.div>

            {/* Pillar of flame beneath */}
            <motion.div
              className="absolute bottom-0 left-1/2 -translate-x-1/2"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: '50%', opacity: 0.8 }}
              transition={{ delay: 0.5, duration: 1 }}
              style={{
                width: '100px',
                background: 'linear-gradient(to top, #FF4500, #FFD700, transparent)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* CELEBRATION - Phoenix soars into sunrise */}
      <AnimatePresence>
        {phase === 'celebration' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center z-50"
          >
            {/* Phoenix flies upward into sky */}
            <motion.div
              className="absolute"
              initial={{ bottom: '40%', left: '50%', x: '-50%' }}
              animate={{ 
                bottom: '120%',
                scale: [1.8, 1.5, 1.2]
              }}
              transition={{ duration: 3, ease: 'easeInOut' }}
            >
              <PhoenixIcon burning={true} size={200} />
            </motion.div>

            {/* Radiating light rays */}
            {[...Array(12)].map((_, i) => {
              const angle = (i / 12) * 360;
              return (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    width: '4px',
                    height: '300px',
                    background: 'linear-gradient(to bottom, rgba(255, 215, 0, 0.8), transparent)',
                    transformOrigin: 'top center',
                    transform: `rotate(${angle}deg)`,
                    left: '50%',
                    top: '50%',
                    marginLeft: '-2px'
                  }}
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ 
                    opacity: [0, 0.8, 0.6],
                    scaleY: 1
                  }}
                  transition={{ 
                    duration: 1.5,
                    delay: i * 0.1
                  }}
                />
              );
            })}

            {/* Golden feathers falling */}
            {[...Array(30)].map((_, i) => {
              const startX = Math.random() * 100;
              const drift = (Math.random() - 0.5) * 40;
              return (
                <motion.div
                  key={i}
                  className="absolute text-3xl"
                  initial={{
                    left: `${startX}%`,
                    top: '-10%',
                    opacity: 0,
                    rotate: 0
                  }}
                  animate={{
                    left: `${startX + drift}%`,
                    top: '110%',
                    opacity: [0, 1, 1, 0],
                    rotate: Math.random() * 720
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    delay: i * 0.1,
                    ease: 'linear'
                  }}
                >
                  🪶
                </motion.div>
              );
            })}

            {/* Success message */}
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 1, type: 'spring', stiffness: 150 }}
              className="relative z-10 text-center bg-white/95 backdrop-blur-md p-8 md:p-12 rounded-3xl border-4 border-yellow-500 shadow-2xl max-w-md"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, -5, 5, 0]
                }}
                transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1 }}
                className="text-7xl md:text-8xl mb-4"
              >
                🔥🦅🔥
              </motion.div>
              
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-600 bg-clip-text text-transparent mb-3">
                REBORN!
              </h2>
              
              <p className="text-orange-700 text-xl md:text-2xl mb-2">
                Rise from the ashes! 🔥
              </p>
              
              <p className="text-orange-600 text-lg">
                A new phoenix soars! ✨
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}