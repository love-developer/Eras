import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// 🐕 Custom Dog SVG Component - Golden Retriever
const DogIcon = ({ 
  className = "", 
  excited = false
}: { 
  className?: string; 
  excited?: boolean;
}) => {
  return (
    <svg
      viewBox="0 0 120 100"
      className={className}
      style={{ width: '100%', height: 'auto' }}
    >
      {/* Tail - wags when excited */}
      <motion.path
        d="M 15 50 Q 8 47, 5 40"
        stroke="#D4A574"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
        animate={excited ? { 
          rotate: [0, 25, -15, 25, 0] 
        } : {}}
        transition={{ 
          duration: 0.4, 
          repeat: excited ? Infinity : 0, 
          repeatDelay: 0 
        }}
        style={{ transformOrigin: '15px 50px' }}
      />
      
      {/* Body */}
      <ellipse cx="45" cy="50" rx="25" ry="18" fill="#E6C896" />
      <ellipse cx="45" cy="48" rx="23" ry="16" fill="#F4D9A6" />
      
      {/* Chest */}
      <ellipse cx="65" cy="53" rx="15" ry="16" fill="#F4D9A6" />
      <ellipse cx="65" cy="51" rx="13" ry="14" fill="#F8E4B8" />
      
      {/* Left ear */}
      <ellipse cx="70" cy="33" rx="8" ry="14" fill="#D4A574" transform="rotate(-35 70 33)" />
      <ellipse cx="71" cy="33" rx="6" ry="12" fill="#E6C896" transform="rotate(-35 71 33)" />
      
      {/* Head */}
      <ellipse cx="80" cy="40" rx="18" ry="16" fill="#E6C896" />
      <ellipse cx="80" cy="38" rx="16" ry="14" fill="#F4D9A6" />
      
      {/* Right ear */}
      <ellipse cx="88" cy="31" rx="8" ry="14" fill="#D4A574" transform="rotate(35 88 31)" />
      <ellipse cx="87" cy="31" rx="6" ry="12" fill="#E6C896" transform="rotate(35 87 31)" />
      
      {/* Snout */}
      <ellipse cx="93" cy="45" rx="11" ry="10" fill="#F8E4B8" />
      <ellipse cx="97" cy="45" rx="7" ry="8" fill="#FFEFC9" />
      
      {/* Nose */}
      <ellipse cx="100" cy="44" rx="4" ry="3.5" fill="#2C1810" />
      
      {/* Eyes */}
      <ellipse cx="75" cy="36" rx="3" ry="3.5" fill="#3D2817" />
      <circle cx="75.8" cy="35" r="1.2" fill="#FFF" />
      
      <ellipse cx="85" cy="36" rx="3" ry="3.5" fill="#3D2817" />
      <circle cx="85.8" cy="35" r="1.2" fill="#FFF" />
      
      {/* Legs */}
      <rect x="30" y="60" width="8" height="18" rx="4" fill="#D4A574" />
      <rect x="42" y="60" width="8" height="18" rx="4" fill="#C9985C" />
      <rect x="65" y="60" width="8" height="18" rx="4" fill="#D4A574" />
      <rect x="77" y="60" width="8" height="18" rx="4" fill="#C9985C" />
      
      {/* Paws */}
      <ellipse cx="34" cy="78" rx="5" ry="3.5" fill="#C19A6B" />
      <ellipse cx="46" cy="78" rx="5" ry="3.5" fill="#B8895A" />
      <ellipse cx="69" cy="78" rx="5" ry="3.5" fill="#C19A6B" />
      <ellipse cx="81" cy="78" rx="5" ry="3.5" fill="#B8895A" />
      
      {/* Collar */}
      <ellipse cx="72" cy="55" rx="10" ry="3" fill="#DC143C" />
      <circle cx="72" cy="56" r="2.5" fill="#FFD700" />
      
      {/* Happy mouth when excited */}
      {excited && (
        <path
          d="M 98 48 Q 96 51, 94 48"
          stroke="#3D2817"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
};

// 🐱 Custom Cat SVG Component - Tuxedo Cat
const CatIcon = ({ 
  className = "", 
  excited = false
}: { 
  className?: string; 
  excited?: boolean;
}) => {
  return (
    <svg
      viewBox="0 0 120 100"
      className={className}
      style={{ width: '100%', height: 'auto' }}
    >
      {/* Tail - curls when excited */}
      <motion.path
        d="M 10 55 Q 5 45, 8 35 Q 11 25, 15 30"
        stroke="#1A1A1A"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        animate={excited ? { 
          d: [
            "M 10 55 Q 5 45, 8 35 Q 11 25, 15 30",
            "M 10 55 Q 8 42, 12 32 Q 16 22, 18 28",
            "M 10 55 Q 5 45, 8 35 Q 11 25, 15 30"
          ]
        } : {}}
        transition={{ 
          duration: 0.6, 
          repeat: excited ? Infinity : 0, 
          repeatDelay: 0.2 
        }}
      />
      
      {/* Body */}
      <ellipse cx="45" cy="55" rx="22" ry="16" fill="#1A1A1A" />
      
      {/* White chest */}
      <ellipse cx="50" cy="58" rx="12" ry="12" fill="#FFFFFF" />
      
      {/* Head */}
      <ellipse cx="75" cy="45" rx="16" ry="15" fill="#1A1A1A" />
      
      {/* White face marking */}
      <ellipse cx="75" cy="48" rx="8" ry="10" fill="#FFFFFF" />
      
      {/* Left ear */}
      <motion.path
        d="M 65 32 L 60 22 L 70 30 Z"
        fill="#1A1A1A"
        animate={excited ? {
          rotate: [-5, 5, -5]
        } : {}}
        transition={{
          duration: 0.4,
          repeat: excited ? Infinity : 0
        }}
        style={{ transformOrigin: '65px 32px' }}
      />
      <path d="M 65 32 L 62 25 L 68 31 Z" fill="#FFB6C1" />
      
      {/* Right ear */}
      <motion.path
        d="M 85 32 L 90 22 L 80 30 Z"
        fill="#1A1A1A"
        animate={excited ? {
          rotate: [5, -5, 5]
        } : {}}
        transition={{
          duration: 0.4,
          repeat: excited ? Infinity : 0
        }}
        style={{ transformOrigin: '85px 32px' }}
      />
      <path d="M 85 32 L 88 25 L 82 31 Z" fill="#FFB6C1" />
      
      {/* Eyes - slow blink when excited */}
      <motion.g
        animate={excited ? {
          scaleY: [1, 0.2, 1, 1, 1, 1]
        } : {}}
        transition={{
          duration: 2,
          repeat: excited ? Infinity : 0,
          repeatDelay: 3
        }}
        style={{ transformOrigin: '70px 43px' }}
      >
        <ellipse cx="70" cy="43" rx="3.5" ry="4.5" fill="#22C55E" />
        <ellipse cx="70" cy="42" rx="1.5" ry="2.5" fill="#000000" />
        <circle cx="69" cy="41" r="0.8" fill="#FFFFFF" />
      </motion.g>
      
      <motion.g
        animate={excited ? {
          scaleY: [1, 0.2, 1, 1, 1, 1]
        } : {}}
        transition={{
          duration: 2,
          repeat: excited ? Infinity : 0,
          repeatDelay: 3
        }}
        style={{ transformOrigin: '80px 43px' }}
      >
        <ellipse cx="80" cy="43" rx="3.5" ry="4.5" fill="#22C55E" />
        <ellipse cx="80" cy="42" rx="1.5" ry="2.5" fill="#000000" />
        <circle cx="79" cy="41" r="0.8" fill="#FFFFFF" />
      </motion.g>
      
      {/* Nose */}
      <path d="M 75 50 L 73 52 L 77 52 Z" fill="#FFB6C1" />
      
      {/* Mouth - happy when excited */}
      {excited ? (
        <>
          <path d="M 75 52 Q 72 55, 70 54" stroke="#000" strokeWidth="1" fill="none" strokeLinecap="round" />
          <path d="M 75 52 Q 78 55, 80 54" stroke="#000" strokeWidth="1" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M 75 52 L 70 54" stroke="#000" strokeWidth="1" strokeLinecap="round" />
          <path d="M 75 52 L 80 54" stroke="#000" strokeWidth="1" strokeLinecap="round" />
        </>
      )}
      
      {/* Whiskers */}
      <path d="M 65 48 L 50 46" stroke="#000" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M 65 51 L 48 51" stroke="#000" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M 65 54 L 50 56" stroke="#000" strokeWidth="0.8" strokeLinecap="round" />
      
      <path d="M 85 48 L 100 46" stroke="#000" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M 85 51 L 102 51" stroke="#000" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M 85 54 L 100 56" stroke="#000" strokeWidth="0.8" strokeLinecap="round" />
      
      {/* Front legs */}
      <rect x="50" y="65" width="6" height="16" rx="3" fill="#1A1A1A" />
      <rect x="62" y="65" width="6" height="16" rx="3" fill="#1A1A1A" />
      
      {/* White socks */}
      <rect x="50" y="75" width="6" height="6" rx="1" fill="#FFFFFF" />
      <rect x="62" y="75" width="6" height="6" rx="1" fill="#FFFFFF" />
      
      {/* Back legs */}
      <rect x="35" y="65" width="6" height="16" rx="3" fill="#1A1A1A" />
      
      {/* Toe beans */}
      <ellipse cx="53" cy="81" rx="3.5" ry="2.5" fill="#FFB6C1" />
      <ellipse cx="65" cy="81" rx="3.5" ry="2.5" fill="#FFB6C1" />
    </svg>
  );
};

interface PetCeremonyProps {
  onComplete: () => void;
  isVisible: boolean;
}

export function PetCeremony({ onComplete, isVisible }: PetCeremonyProps) {
  const [phase, setPhase] = useState<'intro' | 'waiting' | 'success' | 'celebration'>('intro');
  const [dogJumped, setDogJumped] = useState(false);
  const [catJumped, setCatJumped] = useState(false);
  const [platformTilt, setPlatformTilt] = useState(0); // -15 (left), 0 (balanced), 15 (right)
  const [attempt, setAttempt] = useState(0);
  const [showHighFive, setShowHighFive] = useState(false);
  const [hearts, setHearts] = useState<Array<{ id: number; x: number; y: number }>>([]);

  // Reset jump states when only one is active (they slide off!)
  useEffect(() => {
    if ((dogJumped && !catJumped) || (!dogJumped && catJumped)) {
      const timer = setTimeout(() => {
        setDogJumped(false);
        setCatJumped(false);
        setAttempt(prev => prev + 1);
        
        // Haptic feedback for failure
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [dogJumped, catJumped]);

  // Calculate platform tilt based on who's jumped
  useEffect(() => {
    if (dogJumped && !catJumped) {
      setPlatformTilt(-15); // Tilt left (dog side)
    } else if (!dogJumped && catJumped) {
      setPlatformTilt(15); // Tilt right (cat side)
    } else if (dogJumped && catJumped) {
      setPlatformTilt(0); // Balanced!
    } else {
      setPlatformTilt(0);
    }
  }, [dogJumped, catJumped]);

  // Success when both jump together
  useEffect(() => {
    if (dogJumped && catJumped && phase === 'waiting') {
      // Success haptic
      if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
      
      setPhase('success');
      
      // Show high-five after a moment
      setTimeout(() => {
        setShowHighFive(true);
      }, 800);

      // Trigger celebration
      setTimeout(() => {
        setPhase('celebration');
        setTimeout(onComplete, 3000);
      }, 2500);
    }
  }, [dogJumped, catJumped, phase, onComplete]);

  // Handle swipe left (dog jumps)
  const handleSwipeLeft = useCallback(() => {
    if (phase !== 'waiting' || dogJumped) return;
    
    setDogJumped(true);
    if (navigator.vibrate) navigator.vibrate(30);
    
    // Spawn heart
    const heart = { id: Date.now(), x: 25, y: 40 };
    setHearts(prev => [...prev, heart]);
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== heart.id));
    }, 1000);
  }, [phase, dogJumped]);

  // Handle swipe right (cat jumps)
  const handleSwipeRight = useCallback(() => {
    if (phase !== 'waiting' || catJumped) return;
    
    setCatJumped(true);
    if (navigator.vibrate) navigator.vibrate(30);
    
    // Spawn heart
    const heart = { id: Date.now(), x: 75, y: 40 };
    setHearts(prev => [...prev, heart]);
    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== heart.id));
    }, 1000);
  }, [phase, catJumped]);

  // Touch/swipe detection
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [mouseStart, setMouseStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchEnd - touchStart;
    const threshold = 50;
    
    if (diff > threshold) {
      // Swipe right
      handleSwipeRight();
    } else if (diff < -threshold) {
      // Swipe left
      handleSwipeLeft();
    }
    
    setTouchStart(null);
  };

  // ✅ Mouse drag detection for non-touch devices
  const handleMouseDown = (e: React.MouseEvent) => {
    setMouseStart(e.clientX);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (mouseStart === null) return;
    
    const mouseEnd = e.clientX;
    const diff = mouseEnd - mouseStart;
    const threshold = 50;
    
    if (diff > threshold) {
      // Drag right
      handleSwipeRight();
    } else if (diff < -threshold) {
      // Drag left
      handleSwipeLeft();
    }
    
    setMouseStart(null);
  };

  // ✅ Click detection - left side = dog, right side = cat
  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    
    if (clickX < width / 2) {
      // Clicked left side - dog jumps
      handleSwipeLeft();
    } else {
      // Clicked right side - cat jumps
      handleSwipeRight();
    }
  };

  // Auto-start
  useEffect(() => {
    if (isVisible && phase === 'intro') {
      setTimeout(() => setPhase('waiting'), 1500);
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
      {/* Warm background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-100 via-orange-50 to-yellow-100" />

      {/* Decorative paw prints */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-4xl"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              rotate: [0, 360],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 3
            }}
          >
            🐾
          </motion.div>
        ))}
      </div>

      {/* Instructions */}
      <AnimatePresence>
        {phase === 'waiting' && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="absolute top-8 z-50 text-center px-6"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-amber-900 mb-2 drop-shadow-lg">
              Best Friends Teamwork! 🐕🤝🐱
            </h2>
            <p className="text-amber-800 text-lg md:text-xl drop-shadow">
              Swipe <span className="font-bold">LEFT</span> for dog, <span className="font-bold">RIGHT</span> for cat
            </p>
            <p className="text-amber-700 text-base md:text-lg mt-1">
              They must jump <span className="font-bold">together</span> to balance!
            </p>
            {attempt > 0 && (
              <motion.p
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-orange-600 text-sm mt-2"
              >
                Try again! Timing is everything! 🎯
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating hearts */}
      <AnimatePresence>
        {hearts.map(heart => (
          <motion.div
            key={heart.id}
            className="absolute text-3xl pointer-events-none z-30"
            initial={{ 
              opacity: 1, 
              scale: 0.5,
              x: `${heart.x}%`,
              y: `${heart.y}%`
            }}
            animate={{ 
              opacity: 0,
              scale: 1.5,
              y: `${heart.y - 20}%`
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            💕
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Main scene container */}
      <div className="relative w-full h-full flex items-center justify-center">
        
        {/* Split screen indicator lines */}
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-amber-300/30 z-0" />
        
        {/* Platform base */}
        <motion.div
          className="absolute bottom-[35%] left-1/2 -translate-x-1/2 flex flex-col items-center z-10"
          animate={{
            rotate: platformTilt
          }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 15
          }}
        >
          {/* Platform surface */}
          <div className="relative">
            {/* Platform board */}
            <div className="w-80 md:w-96 h-6 bg-gradient-to-b from-amber-700 to-amber-800 rounded-lg shadow-xl border-2 border-amber-900" />
            
            {/* Platform center fulcrum/support */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-gray-600 rounded-sm" />
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-12 h-4 bg-gray-700 rounded-b-lg" />
            
            {/* Success glow when balanced */}
            {dogJumped && catJumped && (
              <motion.div
                className="absolute inset-0 rounded-lg"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [0.5, 1, 0.5],
                  boxShadow: [
                    '0 0 20px rgba(34, 197, 94, 0.5)',
                    '0 0 40px rgba(34, 197, 94, 1)',
                    '0 0 20px rgba(34, 197, 94, 0.5)'
                  ]
                }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            )}
          </div>
        </motion.div>

        {/* Capsule in center - rises when successful */}
        <motion.div
          className="absolute z-20"
          initial={{ y: 0, opacity: 0.3, scale: 0.8 }}
          animate={{
            y: phase === 'success' || phase === 'celebration' ? -120 : 0,
            opacity: phase === 'success' || phase === 'celebration' ? 1 : 0.3,
            scale: phase === 'success' || phase === 'celebration' ? 1.2 : 0.8,
          }}
          transition={{
            type: 'spring',
            stiffness: 150,
            damping: 15
          }}
        >
          <div className="w-16 h-20 md:w-20 md:h-24 bg-gradient-to-b from-purple-400 to-purple-600 rounded-2xl shadow-2xl border-4 border-purple-300 flex items-center justify-center">
            <div className="text-3xl md:text-4xl">📦</div>
          </div>
          
          {/* Glow effect */}
          {(phase === 'success' || phase === 'celebration') && (
            <motion.div
              className="absolute inset-0 rounded-2xl"
              animate={{
                boxShadow: [
                  '0 0 30px rgba(168, 85, 247, 0.8)',
                  '0 0 60px rgba(168, 85, 247, 1)',
                  '0 0 30px rgba(168, 85, 247, 0.8)'
                ]
              }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </motion.div>

        {/* LEFT SIDE - DOG */}
        <div className="absolute left-[8%] md:left-[15%] bottom-[25%] flex flex-col items-center z-30">
          {/* Ball/toy */}
          <motion.div
            className="mb-4 text-4xl"
            animate={{
              rotate: dogJumped ? 360 : 0,
              scale: dogJumped ? 1.2 : 1
            }}
            transition={{ duration: 0.5 }}
          >
            🎾
          </motion.div>
          
          {/* Dog */}
          <motion.div
            className="w-24 h-20 md:w-32 md:h-24"
            animate={{
              y: dogJumped ? -100 : 0,
              rotate: dogJumped ? (catJumped ? 0 : -25) : 0
            }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 12
            }}
          >
            <DogIcon excited={dogJumped} />
          </motion.div>
          
          {/* Label */}
          <div className="mt-2 text-center">
            <div className="text-xl md:text-2xl font-bold text-amber-900">Dog</div>
            <div className="text-sm text-amber-700">Swipe LEFT ⬅️</div>
          </div>
        </div>

        {/* RIGHT SIDE - CAT */}
        <div className="absolute right-[8%] md:right-[15%] bottom-[25%] flex flex-col items-center z-30">
          {/* String toy */}
          <motion.div
            className="mb-4 text-4xl"
            animate={{
              rotate: catJumped ? [0, 180, 360] : 0,
              scale: catJumped ? 1.2 : 1
            }}
            transition={{ duration: 0.5 }}
          >
            🧶
          </motion.div>
          
          {/* Cat */}
          <motion.div
            className="w-24 h-20 md:w-32 md:h-24"
            animate={{
              y: catJumped ? -100 : 0,
              rotate: catJumped ? (dogJumped ? 0 : 25) : 0
            }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 12
            }}
          >
            <CatIcon excited={catJumped} />
          </motion.div>
          
          {/* Label */}
          <div className="mt-2 text-center">
            <div className="text-xl md:text-2xl font-bold text-gray-800">Cat</div>
            <div className="text-sm text-gray-700">Swipe RIGHT ➡️</div>
          </div>
        </div>

        {/* High-five moment */}
        <AnimatePresence>
          {showHighFive && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-[25%] z-40 flex items-center gap-4"
            >
              {/* Dog paw */}
              <motion.div
                className="text-6xl md:text-7xl"
                initial={{ x: -100, rotate: -45 }}
                animate={{ x: 0, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 10
                }}
              >
                🐾
              </motion.div>
              
              {/* Sparkle burst */}
              <motion.div
                className="text-5xl md:text-6xl"
                animate={{
                  scale: [0, 1.5, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{ duration: 0.6 }}
              >
                ✨
              </motion.div>
              
              {/* Cat paw */}
              <motion.div
                className="text-6xl md:text-7xl"
                initial={{ x: 100, rotate: 45 }}
                animate={{ x: 0, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 10
                }}
              >
                🐾
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Success celebration */}
      <AnimatePresence>
        {phase === 'celebration' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center z-50 bg-gradient-to-b from-green-200/70 via-emerald-200/70 to-teal-200/70"
          >
            {/* Explosion of hearts, paw prints, sparkles */}
            {[...Array(50)].map((_, i) => {
              const emoji = ['❤️', '🐾', '✨', '💚', '⭐', '💛'][i % 6];
              const angle = (i / 50) * Math.PI * 2;
              const distance = 100 + Math.random() * 250;
              
              return (
                <motion.div
                  key={i}
                  className="absolute text-3xl md:text-4xl"
                  initial={{
                    x: 0,
                    y: 0,
                    rotate: 0,
                    opacity: 0,
                  }}
                  animate={{
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    rotate: Math.random() * 720,
                    opacity: [0, 1, 0.9, 0],
                  }}
                  transition={{
                    duration: 2 + Math.random(),
                    ease: 'easeOut',
                  }}
                >
                  {emoji}
                </motion.div>
              );
            })}

            {/* Success message */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="relative z-10 text-center bg-white/95 backdrop-blur-md p-8 md:p-12 rounded-3xl border-4 border-green-500 shadow-2xl max-w-md"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, -5, 5, -5, 0]
                }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
                className="text-7xl md:text-8xl mb-4 flex items-center justify-center gap-2"
              >
                <span>🐕</span>
                <span>🤝</span>
                <span>🐱</span>
              </motion.div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-green-900 mb-3">
                Perfect Teamwork!
              </h2>
              
              <p className="text-green-700 text-xl md:text-2xl mb-2">
                Better Together! 💚
              </p>
              
              <p className="text-green-600 text-lg">
                Friendship unlocked the capsule! 🏆
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}