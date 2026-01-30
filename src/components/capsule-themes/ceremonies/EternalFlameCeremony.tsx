import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Hand } from 'lucide-react';

interface EternalFlameCeremonyProps {
  onComplete: () => void;
  isVisible: boolean;
}

export function EternalFlameCeremony({ onComplete, isVisible }: EternalFlameCeremonyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showAnticipation, setShowAnticipation] = useState(false);
  const [celebrationPhase, setCelebrationPhase] = useState<'idle' | 'anticipation' | 'explosion'>('idle');
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Initialize audio
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  // Play whoosh sound when wiping
  const playWhooshSound = useCallback(() => {
    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  }, [initAudio]);

  // Play flame ignite sound
  const playIgniteSound = useCallback(() => {
    initAudio();
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(100, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  }, [initAudio]);
  
  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      // Reset fog on resize
      initFog(ctx, rect.width, rect.height);
    };

    const initFog = (context: CanvasRenderingContext2D, width: number, height: number) => {
      context.globalCompositeOperation = 'source-over';
      
      // Draw misty background
      // Base layer
      context.fillStyle = 'rgba(255, 255, 255, 0.85)';
      context.fillRect(0, 0, width, height);
      
      // Add some noise/texture for steam effect
      // (Simplified for performance)
      
      // Reset composite operation for erasing
      context.globalCompositeOperation = 'destination-out';
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Check progress
  const checkProgress = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Optimization: Check a grid of points instead of getting all image data
    // This is much faster than getImageData for the whole canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const gridSize = 20; // Check every 20 pixels
    const totalPoints = Math.floor(width / gridSize) * Math.floor(height / gridSize);
    
    // We actually need getImageData to check transparency, but we can do it on a smaller scaled-down version
    // Or just sample specific points if we accept `getImageData(x, y, 1, 1)` overhead (lots of calls)
    // Better approach: Get image data once but iterate with a step
    
    try {
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      let transparentPixels = 0;
      
      // Check alpha channel (every 4th byte) with a step
      // Step size allows checking fewer pixels for performance
      const step = 32; // Check every 8th pixel (4 bytes * 8)
      
      for (let i = 3; i < data.length; i += step) {
        if (data[i] < 128) { // Less than 50% opacity
          transparentPixels++;
        }
      }
      
      const checkedPixels = data.length / step;
      const currentProgress = transparentPixels / checkedPixels;
      
      setProgress(Math.min(100, Math.round(currentProgress * 100)));
      
      if (currentProgress > 0.6 && !isCompleted && celebrationPhase === 'idle') { // 60% cleared
        setIsCompleted(true);
        setCelebrationPhase('anticipation');
        setShowAnticipation(true);
        
        // Success haptic
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
        
        // Anticipation pause then explosion
        setTimeout(() => {
          setShowAnticipation(false);
          setCelebrationPhase('explosion');
          
          // Play ignite sound
          playIgniteSound();
          
          // Celebration haptic
          if (navigator.vibrate) navigator.vibrate([100, 30, 100, 30, 200]);
          
          // Complete after explosion
          setTimeout(() => {
            onComplete();
          }, 1500);
        }, 800);
      }
    } catch (e) {
      console.error('Error checking fog progress:', e);
    }
  }, [isCompleted, onComplete, celebrationPhase, playIgniteSound]);

  // Handle drawing (erasing)
  const handleMove = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isCompleted) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    // Create a natural looking "wipe" shape
    // A circle is simple and effective
    const radius = 40;
    
    // Use radial gradient for soft edges
    const gradient = ctx.createRadialGradient(x, y, radius * 0.5, x, y, radius);
    gradient.addColorStop(0, 'rgba(0,0,0,1)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.fillStyle = gradient;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Throttle progress checks to every 10th move or use a timestamp
    if (Math.random() > 0.8) {
      checkProgress();
    }

    // Play whoosh sound
    playWhooshSound();
  }, [isCompleted, checkProgress, playWhooshSound]);

  if (!isVisible) return null;

  return (
    <motion.div 
      ref={containerRef}
      className="absolute inset-0 z-40 touch-none select-none cursor-crosshair"
      initial={{ opacity: 0 }}
      animate={{ opacity: isCompleted ? 0 : 1 }}
      transition={{ duration: 1.5 }}
    >
      {/* The Fog Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchStart={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
      />

      {/* Floating UI Hints */}
      <AnimatePresence>
        {!isCompleted && progress < 10 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="flex flex-col items-center gap-4 text-slate-600">
              <motion.div
                animate={{ 
                  x: [-30, 30, -30],
                  y: [0, -10, 0],
                  rotate: [-5, 5, -5]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Hand className="w-12 h-12" />
              </motion.div>
              <p className="font-handwriting text-2xl font-bold bg-white/30 backdrop-blur-sm px-4 py-2 rounded-full">
                Wipe the steam to reveal...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Heart (Appears as you wipe) */}
      <div className="absolute top-8 right-8 pointer-events-none">
        <motion.div 
          className="relative"
          animate={{ scale: 1 + (progress / 200) }}
        >
          <Heart 
            className="w-8 h-8 text-rose-500/50" 
            fill={progress > 0 ? "currentColor" : "none"}
          />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold text-white">
            {progress}%
          </span>
        </motion.div>
      </div>
      
      {/* Condensation drips (Optional visual polish) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-0 w-[2px] bg-white rounded-full"
            style={{ 
              left: `${15 + i * 20}%`,
              height: '20px'
            }}
            animate={{ 
              y: ['0vh', '100vh'],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* ANTICIPATION EFFECT */}
      <AnimatePresence>
        {showAnticipation && (
          <>
            {/* Screen shake container */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{
                x: [0, -6, 6, -4, 4, 0],
                y: [0, 4, -4, 2, -2, 0]
              }}
              transition={{ duration: 0.6 }}
            >
              {/* Brightness build */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-b from-orange-200 to-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.5] }}
                transition={{ duration: 0.6 }}
              />
            </motion.div>

            {/* Flame ignite text */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1.3, 1],
                opacity: [0, 1, 1]
              }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 drop-shadow-2xl">
                🔥 Ignited! 🔥
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* EMBER PARTICLES */}
      <AnimatePresence>
        {celebrationPhase === 'explosion' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Rose Petals Falling */}
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={`petal-${i}`}
                className="absolute text-2xl"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-20px'
                }}
                initial={{ y: 0, opacity: 0, rotate: 0 }}
                animate={{
                  y: ['0vh', '120vh'],
                  x: [0, (Math.random() - 0.5) * 100],
                  opacity: [0, 1, 0.8, 0],
                  rotate: [0, Math.random() * 720]
                }}
                transition={{
                  duration: 4 + Math.random() * 2,
                  delay: i * 0.1,
                  ease: 'linear'
                }}
              >
                🌹
              </motion.div>
            ))}

            {/* Rising embers */}
            {Array.from({ length: 40 }).map((_, i) => (
              <motion.div
                key={`ember-${i}`}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: `${40 + (i % 20) * 2}%`,
                  bottom: '30%',
                  background: `radial-gradient(circle, 
                    ${['#ff6b35', '#f7931e', '#ffd700'][i % 3]}, 
                    transparent)`,
                  boxShadow: `0 0 ${4 + (i % 3) * 2}px ${['#ff6b35', '#f7931e', '#ffd700'][i % 3]}`
                }}
                initial={{ y: 0, opacity: 0 }}
                animate={{
                  y: [0, -300],
                  x: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 150],
                  opacity: [0, 1, 0.8, 0],
                  scale: [1, 0.5]
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: i * 0.05,
                  ease: 'easeOut'
                }}
              />
            ))}

            {/* Heart explosions */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              const distance = 150;
              
              return (
                <motion.div
                  key={`heart-${i}`}
                  className="absolute top-1/2 left-1/2 text-3xl"
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
                    duration: 1.5,
                    delay: i * 0.05,
                    ease: 'easeOut'
                  }}
                >
                  ❤️
                </motion.div>
              );
            })}

            {/* Candles merging animation */}
            <motion.div
              className="absolute top-1/3 left-1/2 -translate-x-1/2 flex items-end gap-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              {/* Left candle */}
              <motion.div
                className="text-6xl"
                animate={{
                  x: [0, 40]
                }}
                transition={{ delay: 1, duration: 1 }}
              >
                🕯️
              </motion.div>

              {/* Right candle */}
              <motion.div
                className="text-6xl"
                animate={{
                  x: [0, -40]
                }}
                transition={{ delay: 1, duration: 1 }}
              >
                🕯️
              </motion.div>
            </motion.div>

            {/* Merged flame */}
            <motion.div
              className="absolute top-1/3 left-1/2 -translate-x-1/2 text-8xl"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0, 1],
                scale: [0, 0, 1.2, 1]
              }}
              transition={{ delay: 2, duration: 0.5 }}
            >
              🔥
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}