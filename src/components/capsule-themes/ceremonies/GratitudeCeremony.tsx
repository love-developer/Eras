import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart } from 'lucide-react';

interface GratitudeCeremonyProps {
  onComplete: () => void;
  isVisible: boolean;
}

interface Lantern {
  id: number;
  x: number;
  y: number;
  color: string;
  released: boolean;
  releaseDelay: number;
  sway: number;
}

const LANTERN_COLORS = ['#ff6b6b', '#ff8c42', '#ffd93d', '#ff91a4', '#ffb38a'];

export function GratitudeCeremony({ onComplete, isVisible }: GratitudeCeremonyProps) {
  const [lanterns, setLanterns] = useState<Lantern[]>([]);
  const [currentLantern, setCurrentLantern] = useState<Lantern | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lanternCountRef = useRef(0);
  const lanternIdRef = useRef(0); // Unique ID counter
  const isReleasingRef = useRef(false); // Prevent double-release

  const TOTAL_LANTERNS = 10;

  // Vibration feedback
  const vibrate = (pattern: number | number[]) => {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  // Create a new lantern at click/tap position
  const createLantern = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current || lanternCountRef.current >= TOTAL_LANTERNS) return;
    
    // Reset releasing flag for new lantern
    isReleasingRef.current = false;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    
    const newLantern: Lantern = {
      id: lanternIdRef.current++,
      x,
      y: Math.min(90, Math.max(70, y)), // Keep in lower portion
      color: LANTERN_COLORS[lanternCountRef.current % LANTERN_COLORS.length],
      released: false,
      releaseDelay: 0,
      sway: Math.random() * 20 - 10,
    };
    
    setCurrentLantern(newLantern);
    setShowInstructions(false);
    vibrate(30);
  }, []);

  // Handle mouse/touch start
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (showCompletion || lanternCountRef.current >= TOTAL_LANTERNS) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    createLantern(clientX, clientY);
    setIsDragging(true);
    setDragY(clientY);
  };

  // Handle drag to release
  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !currentLantern) return;
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = dragY - clientY; // Positive = dragging upward
    
    // If dragged down significantly, release the lantern
    if (deltaY < -50) {
      releaseLantern();
    }
  };

  // Release lantern to float upward
  const releaseLantern = () => {
    if (!currentLantern || isReleasingRef.current) return;
    
    isReleasingRef.current = true;
    
    const releasedLantern = { ...currentLantern, released: true };
    setLanterns(prev => [...prev, releasedLantern]);
    setCurrentLantern(null);
    setIsDragging(false);
    
    lanternCountRef.current += 1;
    vibrate(40);
    
    // Check if all lanterns released
    if (lanternCountRef.current >= TOTAL_LANTERNS) {
      setTimeout(() => {
        setShowCompletion(true);
        vibrate([50, 30, 50, 30, 100]);
        
        setTimeout(() => {
          onComplete();
        }, 3000);
      }, 2000);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setCurrentLantern(null);
  };

  // Sky gradient based on progress
  const progress = lanternCountRef.current / TOTAL_LANTERNS;
  const getSkyGradient = () => {
    if (progress < 0.3) {
      // Early twilight
      return 'linear-gradient(to bottom, #1a1438 0%, #2d1b4e 40%, #583a70 100%)';
    } else if (progress < 0.6) {
      // Deeper twilight
      return 'linear-gradient(to bottom, #0f0a2e 0%, #1e1242 40%, #3d2463 100%)';
    } else if (progress < 0.9) {
      // Night approaching
      return 'linear-gradient(to bottom, #0a0520 0%, #150835 40%, #291550 100%)';
    } else {
      // Full night
      return 'linear-gradient(to bottom, #030112 0%, #0d0628 40%, #1a0e3d 100%)';
    }
  };

  const starsOpacity = Math.min(1, progress * 1.5);

  if (!isVisible) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: getSkyGradient(),
        transition: 'background 1.5s ease',
      }}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    >
      {/* Stars */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: starsOpacity, transition: 'opacity 1s ease' }}
      >
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${(i * 7) % 100}%`,
              top: `${(i * 11) % 60}%`,
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + (i % 3),
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </div>

      {/* Horizon silhouette */}
      <svg
        className="absolute bottom-0 w-full h-32 pointer-events-none"
        viewBox="0 0 100 20"
        preserveAspectRatio="none"
      >
        <path
          d="M 0,20 L 0,12 Q 20,10 40,12 T 80,11 L 100,12 L 100,20 Z"
          fill="#0a0514"
          opacity="0.8"
        />
      </svg>

      {/* Tree silhouettes */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        {/* Left tree */}
        <svg
          className="absolute bottom-0 left-8"
          width="60"
          height="120"
          viewBox="0 0 60 120"
        >
          <path
            d="M 30,120 L 30,40 M 30,40 Q 10,30 15,20 Q 20,10 30,5 Q 40,10 45,20 Q 50,30 30,40"
            stroke="#0a0514"
            strokeWidth="3"
            fill="none"
            opacity="0.6"
          />
        </svg>

        {/* Right tree */}
        <svg
          className="absolute bottom-0 right-12"
          width="80"
          height="140"
          viewBox="0 0 80 140"
        >
          <path
            d="M 40,140 L 40,50 M 40,50 Q 15,38 20,25 Q 25,12 40,5 Q 55,12 60,25 Q 65,38 40,50"
            stroke="#0a0514"
            strokeWidth="4"
            fill="none"
            opacity="0.6"
          />
        </svg>
      </div>

      {/* Released lanterns */}
      <AnimatePresence>
        {lanterns.map((lantern) => (
          <motion.div
            key={lantern.id}
            className="absolute pointer-events-none"
            style={{
              left: `${lantern.x}%`,
              bottom: `${lantern.y}%`,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              bottom: ['0%', '110%'],
              left: [`${lantern.x}%`, `${lantern.x + lantern.sway}%`],
              opacity: [0, 1, 1, 0.8, 0],
              scale: [0.8, 1, 1, 0.9, 0.7],
            }}
            transition={{
              duration: 8,
              ease: 'easeOut',
            }}
          >
            {/* Lantern body */}
            <div className="relative" style={{ width: '40px', height: '50px' }}>
              {/* Glow */}
              <div
                className="absolute inset-0 rounded-lg blur-md"
                style={{
                  background: lantern.color,
                  opacity: 0.6,
                }}
              />
              
              {/* Paper body */}
              <div
                className="absolute inset-0 rounded-lg"
                style={{
                  background: `linear-gradient(135deg, ${lantern.color} 0%, ${lantern.color}dd 100%)`,
                  boxShadow: `inset 0 -10px 20px rgba(0,0,0,0.3), 0 0 20px ${lantern.color}80`,
                }}
              >
                {/* Horizontal ribs */}
                <div className="absolute top-1/4 left-0 right-0 h-px bg-black/20" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-black/20" />
                <div className="absolute top-3/4 left-0 right-0 h-px bg-black/20" />
              </div>
              
              {/* Inner light */}
              <motion.div
                className="absolute inset-2 rounded-md"
                style={{
                  background: 'radial-gradient(circle at center, #fffacd, transparent)',
                }}
                animate={{
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              />
              
              {/* Top ring */}
              <div
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full"
                style={{
                  background: '#2a1a0a',
                }}
              />
              
              {/* Bottom ring */}
              <div
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full"
                style={{
                  background: '#2a1a0a',
                }}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Current lantern being held */}
      {currentLantern && !currentLantern.released && (
        <motion.div
          className="absolute pointer-events-none z-50"
          style={{
            left: `${currentLantern.x}%`,
            top: `${currentLantern.y}%`,
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          {/* Lantern body */}
          <div className="relative" style={{ width: '50px', height: '60px' }}>
            {/* Glow */}
            <div
              className="absolute inset-0 rounded-lg blur-lg"
              style={{
                background: currentLantern.color,
                opacity: 0.7,
              }}
            />
            
            {/* Paper body */}
            <div
              className="absolute inset-0 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${currentLantern.color} 0%, ${currentLantern.color}dd 100%)`,
                boxShadow: `inset 0 -10px 20px rgba(0,0,0,0.3), 0 0 25px ${currentLantern.color}`,
              }}
            >
              {/* Horizontal ribs */}
              <div className="absolute top-1/4 left-0 right-0 h-px bg-black/20" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-black/20" />
              <div className="absolute top-3/4 left-0 right-0 h-px bg-black/20" />
            </div>
            
            {/* Inner light */}
            <motion.div
              className="absolute inset-2 rounded-md"
              style={{
                background: 'radial-gradient(circle at center, #fffacd, transparent)',
              }}
              animate={{
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
            />
            
            {/* Top ring */}
            <div
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-10 h-2 rounded-full"
              style={{
                background: '#2a1a0a',
              }}
            />
            
            {/* Bottom ring */}
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-2 rounded-full"
              style={{
                background: '#2a1a0a',
              }}
            />
          </div>

          {/* Drag instruction arrow */}
          {isDragging && (
            <motion.div
              className="absolute top-16 left-1/2 -translate-x-1/2"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              <div className="text-white/80 text-2xl">⬇️</div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Instructions */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 text-center z-40"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mb-4"
            >
              <Heart className="w-16 h-16 mx-auto text-orange-300" />
            </motion.div>
            <h2 className="text-3xl text-white mb-3" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
              Grateful Heart
            </h2>
            <p className="text-white/90 text-lg mb-2" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
              Tap to light a lantern
            </p>
            <p className="text-white/80 text-sm" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
              Drag down to release it to the sky
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress counter */}
      {!showInstructions && !showCompletion && (
        <div className="absolute top-8 right-8 z-40">
          <div className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
            <div className="text-white/80 text-sm">
              {lanternCountRef.current} / {TOTAL_LANTERNS} lanterns
            </div>
          </div>
        </div>
      )}

      {/* Completion celebration */}
      <AnimatePresence>
        {showCompletion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center z-50"
          >
            {/* Radial light burst */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 2 }}
              style={{
                background: 'radial-gradient(circle at center, #ff8c42 0%, transparent 60%)',
              }}
            />

            {/* Message */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="bg-white/95 backdrop-blur-md p-8 rounded-2xl border-4 border-orange-400 text-center shadow-2xl"
            >
              <motion.div
                animate={{ rotate: [0, -5, 5, -5, 5, 0] }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <Heart className="w-20 h-20 text-orange-500 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-4xl font-bold text-orange-600 mb-2">Gratitude Rises</h2>
              <p className="text-orange-500 text-lg">Your wishes light the way</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}