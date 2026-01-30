import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Compass, MapPin, Anchor } from 'lucide-react';

interface VoyageMapUnfoldProps {
  onUnlock: () => void;
  senderName?: string;
}

type Phase = 'sealed' | 'unfolding' | 'revealed' | 'celebrating';

export function VoyageMapUnfold({ onUnlock, senderName }: VoyageMapUnfoldProps) {
  const [phase, setPhase] = useState<Phase>('sealed');
  const [hasInteracted, setHasInteracted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const autoProgressTimerRef = useRef<NodeJS.Timeout>();
  
  // Auto-progress for non-touchscreen users
  useEffect(() => {
    if (!hasInteracted) {
      autoProgressTimerRef.current = setTimeout(() => {
        console.log('🗺️ Auto-progressing Voyage ceremony (no interaction detected)');
        handleUnfold();
      }, 2500); // Auto-progress after 2.5s
      
      return () => {
        if (autoProgressTimerRef.current) {
          clearTimeout(autoProgressTimerRef.current);
        }
      };
    }
  }, [hasInteracted]);
  
  // Nautical confetti
  const fireNauticalConfetti = () => {
    const duration = 2500;
    const end = Date.now() + duration;

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

      // Nautical shapes
      const shapes = ['⚓', '🧭', '⛵', '🗺️', '🏴‍☠️'];
      
      // Gold coins burst
      myConfetti({
        particleCount: 30,
        spread: 80,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#FFD700', '#FFA500', '#FF8C00', '#DAA520'],
        scalar: 1.2,
        gravity: 0.8
      });
      
      // Cleanup
      setTimeout(() => {
        if (canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
      }, duration + 1000);
    }
  };

  const handleUnfold = () => {
    if (phase !== 'sealed') return;
    
    setHasInteracted(true);
    
    // Clear auto-progress timer
    if (autoProgressTimerRef.current) {
      clearTimeout(autoProgressTimerRef.current);
    }
    
    // Phase 1 → 2: Unfolding
    setPhase('unfolding');
    
    setTimeout(() => {
      // Phase 2 → 3: X Revealed
      setPhase('revealed');
      
      setTimeout(() => {
        // Phase 3 → 4: Celebrating
        setPhase('celebrating');
        fireNauticalConfetti();
        
        setTimeout(() => {
          onUnlock();
        }, 2500);
      }, 800);
    }, 1800);
  };

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(to bottom, #1e3a8a 0%, #0c4a6e 50%, #0e7490 100%)'
      }}
    >
      {/* Phase 1: Sealed Map */}
      {phase === 'sealed' && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className="relative cursor-pointer"
          onClick={handleUnfold}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleUnfold();
            }
          }}
          aria-label="Click to unfold the treasure map"
        >
          <div className="text-center mb-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              className="inline-block mb-4"
            >
              <Compass className="w-16 h-16 text-amber-400" />
            </motion.div>
            <motion.h2 
              className="text-3xl font-bold text-amber-100 mb-2"
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              Voyage Awaits
            </motion.h2>
            <p className="text-cyan-200">
              {senderName ? `${senderName} sent you a treasure` : 'A treasure awaits'}
            </p>
            <p className="text-sm text-cyan-300/70 mt-2">Click to unfold the map</p>
          </div>

          {/* Folded Map with Wax Seal */}
          <motion.div
            className="relative w-80 h-80 rounded-lg shadow-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #f5e6d3 0%, #d4b896 100%)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
            }}
            animate={{
              boxShadow: [
                '0 20px 60px rgba(245, 158, 11, 0.3)',
                '0 20px 80px rgba(245, 158, 11, 0.5)',
                '0 20px 60px rgba(245, 158, 11, 0.3)'
              ]
            }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            {/* Folded texture lines */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-amber-900" />
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-amber-900" />
            </div>
            
            {/* Wax Seal */}
            <motion.div
              className="relative w-32 h-32 rounded-full bg-gradient-to-br from-red-600 to-red-800 shadow-xl flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              {/* Seal impression */}
              <div className="absolute inset-2 rounded-full border-4 border-red-900/30" />
              <Compass className="w-16 h-16 text-red-900/50" />
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      {/* Phase 2: Unfolding */}
      {phase === 'unfolding' && (
        <motion.div
          initial={{ scale: 0.5, rotateX: 90 }}
          animate={{ scale: 1, rotateX: 0 }}
          transition={{ 
            type: 'spring',
            stiffness: 100,
            damping: 15,
            duration: 1.8 
          }}
          className="relative w-[800px] h-[600px] max-w-[90vw] max-h-[80vh] rounded-lg"
          style={{
            background: 'linear-gradient(135deg, #f5e6d3 0%, #d4b896 100%)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
            perspective: '1000px',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Vintage grid background */}
          <svg className="absolute inset-0 opacity-20" width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#8B4513" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          
          {/* Compass rose in background */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center opacity-10"
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 0.1, rotate: 360 }}
            transition={{ duration: 1.8 }}
          >
            <Compass className="w-96 h-96 text-amber-900" />
          </motion.div>
          
          {/* Travel routes drawing */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute bg-red-700/30"
              style={{
                height: '2px',
                left: `${20 + i * 15}%`,
                top: `${30 + i * 20}%`,
                transformOrigin: 'left center'
              }}
              initial={{ width: 0 }}
              animate={{ width: `${30 + i * 10}%` }}
              transition={{ duration: 1, delay: 0.3 + i * 0.2 }}
            />
          ))}
          
          {/* Decorative corners */}
          {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner) => (
            <motion.div
              key={corner}
              className={`absolute w-16 h-16 ${corner}`}
              style={{
                ...(corner === 'top-left' && { top: 8, left: 8 }),
                ...(corner === 'top-right' && { top: 8, right: 8 }),
                ...(corner === 'bottom-left' && { bottom: 8, left: 8 }),
                ...(corner === 'bottom-right' && { bottom: 8, right: 8 })
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.6, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.4 }}
            >
              <svg viewBox="0 0 100 100" className="text-amber-800">
                <path
                  d={
                    corner.includes('top-left') ? 'M 0,20 Q 0,0 20,0' :
                    corner.includes('top-right') ? 'M 80,0 Q 100,0 100,20' :
                    corner.includes('bottom-left') ? 'M 0,80 Q 0,100 20,100' :
                    'M 80,100 Q 100,100 100,80'
                  }
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Phase 3: X Revealed */}
      {phase === 'revealed' && (
        <motion.div
          className="relative w-[800px] h-[600px] max-w-[90vw] max-h-[80vh] rounded-lg flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #f5e6d3 0%, #d4b896 100%)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.5)'
          }}
        >
          {/* Background elements from unfolding phase */}
          <svg className="absolute inset-0 opacity-20" width="100%" height="100%">
            <defs>
              <pattern id="grid2" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#8B4513" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid2)" />
          </svg>
          
          {/* Giant X Mark */}
          <motion.div
            className="relative"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15
            }}
          >
            {/* Glowing aura */}
            <motion.div
              className="absolute -inset-12 rounded-full opacity-40"
              style={{
                background: 'radial-gradient(circle, #F59E0B 0%, transparent 70%)',
                filter: 'blur(20px)'
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            
            <svg width="200" height="200" viewBox="0 0 200 200">
              <motion.path
                d="M 20,20 L 180,180 M 180,20 L 20,180"
                stroke="#DC2626"
                strokeWidth="20"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </svg>
          </motion.div>
        </motion.div>
      )}

      {/* Phase 4: Celebrating */}
      {phase === 'celebrating' && (
        <motion.div
          className="relative w-[800px] h-[600px] max-w-[90vw] max-h-[80vh] rounded-lg flex flex-col items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #f5e6d3 0%, #d4b896 100%)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.5)'
          }}
        >
          {/* Background */}
          <svg className="absolute inset-0 opacity-20" width="100%" height="100%">
            <defs>
              <pattern id="grid3" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#8B4513" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid3)" />
          </svg>
          
          {/* X Mark (stays) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <svg width="200" height="200" viewBox="0 0 200 200">
              <path
                d="M 20,20 L 180,180 M 180,20 L 20,180"
                stroke="#DC2626"
                strokeWidth="20"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
          
          {/* Treasure Chest Emerging */}
          <motion.div
            className="relative z-10"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ 
              type: 'spring',
              stiffness: 150,
              damping: 20,
              delay: 0.2
            }}
          >
            {/* Chest */}
            <div className="relative w-64 h-48">
              {/* Chest lid */}
              <motion.div
                className="absolute top-0 left-0 right-0 h-24 rounded-t-2xl"
                style={{
                  background: 'linear-gradient(to bottom, #8B4513 0%, #654321 100%)',
                  transformOrigin: 'bottom center'
                }}
                initial={{ rotateX: 0 }}
                animate={{ rotateX: -120 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                <div className="absolute inset-x-4 top-1/2 h-1 bg-yellow-600 rounded" />
              </motion.div>
              
              {/* Chest body */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-32 rounded-b-2xl shadow-2xl"
                style={{
                  background: 'linear-gradient(to bottom, #654321 0%, #4a2c1b 100%)'
                }}
              >
                <div className="absolute inset-x-4 top-1/2 h-1 bg-yellow-600 rounded" />
                <div className="absolute inset-x-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-8 h-12 bg-yellow-600 rounded" />
              </div>
              
              {/* Light rays */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-1 bg-yellow-400/60 origin-bottom"
                  style={{
                    height: '200px',
                    transform: `translateX(-50%) rotate(${i * 45}deg)`
                  }}
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: [0, 0.8, 0], scaleY: [0, 1, 0] }}
                  transition={{
                    delay: 0.8,
                    duration: 1.5,
                    ease: 'easeOut'
                  }}
                />
              ))}
              
              {/* Gold coins scatter */}
              {[...Array(12)].map((_, i) => {
                const angle = (i / 12) * Math.PI * 2;
                const distance = 80 + Math.random() * 40;
                return (
                  <motion.div
                    key={i}
                    className="absolute top-12 left-1/2 w-6 h-6 rounded-full bg-yellow-400 shadow-lg"
                    initial={{ x: 0, y: 0, opacity: 0 }}
                    animate={{
                      x: Math.cos(angle) * distance,
                      y: Math.sin(angle) * distance - 50,
                      opacity: [0, 1, 0],
                      rotate: 360 * (i % 2 === 0 ? 1 : -1)
                    }}
                    transition={{
                      delay: 1,
                      duration: 1.5,
                      ease: 'easeOut'
                    }}
                  />
                );
              })}
            </div>
          </motion.div>
          
          {/* Sender Name */}
          {senderName && (
            <motion.p
              className="absolute bottom-12 text-2xl font-bold text-amber-900"
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
