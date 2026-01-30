import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Gift } from 'lucide-react';

interface BirthdayUnwrapProps {
  onUnlock: () => void;
  senderName?: string;
}

export function BirthdayUnwrap({ onUnlock, senderName }: BirthdayUnwrapProps) {
  const [unwrapProgress, setUnwrapProgress] = useState(0);
  const [isUnwrapped, setIsUnwrapped] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Confetti trigger
  const fireConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    // Create a dedicated canvas for this ceremony to avoid conflicts
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '100'; // Inside the container
    
    if (containerRef.current) {
      containerRef.current.appendChild(canvas);
      
      const myConfetti = confetti.create(canvas, {
        resize: true,
        useWorker: true
      });

      // Fire!
      myConfetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#F472B6']
      });
      
      // Cleanup
      setTimeout(() => {
        if (canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
      }, duration + 1000);
    }
  };

  const handleTap = () => {
    if (isUnwrapped) return;
    
    // Increment progress
    const newProgress = unwrapProgress + 25;
    setUnwrapProgress(newProgress);
    
    // Play sound here if we had audio context
    
    if (newProgress >= 100) {
      setIsUnwrapped(true);
      fireConfetti();
      
      // Allow the animation to play before calling onUnlock
      setTimeout(() => {
        onUnlock();
      }, 1500);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xl"
      onClick={handleTap}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.5, opacity: 0 }}
        className="relative cursor-pointer"
      >
        <div className="text-center mb-8">
          <motion.h2 
            className="text-3xl font-bold text-white mb-2"
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            Happy Birthday!
          </motion.h2>
          <p className="text-slate-300">
            {senderName ? `${senderName} sent you a gift` : 'You have a birthday capsule'}
          </p>
          <p className="text-sm text-slate-400 mt-2">Tap repeatedly to unwrap</p>
        </div>

        {/* The Gift Box */}
        <motion.div
          className="relative w-64 h-64 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl shadow-[0_0_50px_rgba(236,72,153,0.3)] flex items-center justify-center border border-white/20"
          animate={{
            rotate: unwrapProgress > 0 ? [-2, 2, -2, 0] : 0,
            scale: isUnwrapped ? 1.1 : 1
          }}
          transition={{ duration: 0.2 }}
        >
          {/* Ribbon Vertical */}
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-12 bg-rose-300/30 border-x border-white/10" />
          {/* Ribbon Horizontal */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-12 bg-rose-300/30 border-y border-white/10" />
          
          <Gift className="w-24 h-24 text-white drop-shadow-lg" />
          
          {/* Progress Overlay (Tearing Effect) */}
          {unwrapProgress > 0 && (
            <div className="absolute inset-0 bg-black/20 rounded-xl overflow-hidden">
               <motion.div 
                 className="absolute inset-0 bg-slate-900/50"
                 initial={{ scaleY: 0 }}
                 animate={{ scaleY: unwrapProgress / 100 }}
                 style={{ originY: 0.5 }}
               />
            </div>
          )}
        </motion.div>
        
        {/* Progress Bar */}
        <div className="mt-8 w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-pink-500"
            animate={{ width: `${unwrapProgress}%` }}
          />
        </div>
      </motion.div>
    </div>
  );
}
