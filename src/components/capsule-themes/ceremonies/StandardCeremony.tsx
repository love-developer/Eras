import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Sparkles } from 'lucide-react';

interface StandardCeremonyProps {
  onComplete: () => void;
  isVisible: boolean;
}

export function StandardCeremony({ onComplete, isVisible }: StandardCeremonyProps) {
  const [phase, setPhase] = useState<'intro' | 'opening' | 'opened'>('intro');

  useEffect(() => {
    if (!isVisible) return;

    // Auto-advance through phases
    const timer1 = setTimeout(() => {
      setPhase('opening');
    }, 500);

    const timer2 = setTimeout(() => {
      setPhase('opened');
    }, 1800);

    const timer3 = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full">
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div
            key="intro"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative"
          >
            {/* Closed Box */}
            <motion.div
              className="relative w-32 h-32 md:w-40 md:h-40"
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {/* Box body */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl shadow-2xl border-4 border-purple-300" />
              
              {/* Box lid */}
              <div className="absolute -top-3 left-0 right-0 h-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-t-2xl border-4 border-purple-300 border-b-0" />
              
              {/* Ribbon */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-full bg-gradient-to-b from-yellow-300 to-yellow-500 shadow-lg" />
              <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-8 bg-gradient-to-r from-yellow-300 to-yellow-500 shadow-lg" />
              
              {/* Bow */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-8">
                <div className="absolute left-0 top-2 w-7 h-6 bg-yellow-400 rounded-full transform -rotate-45" />
                <div className="absolute right-0 top-2 w-7 h-6 bg-yellow-400 rounded-full transform rotate-45" />
                <div className="absolute left-1/2 -translate-x-1/2 top-0 w-6 h-6 bg-yellow-500 rounded-full border-2 border-yellow-300" />
              </div>
            </motion.div>

            {/* Sparkles around box */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${50 + 40 * Math.cos((i * Math.PI) / 4)}%`,
                  top: `${50 + 40 * Math.sin((i * Math.PI) / 4)}%`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  rotate: [0, 180, 360],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              >
                <Sparkles className="w-4 h-4 text-yellow-400" />
              </motion.div>
            ))}
          </motion.div>
        )}

        {phase === 'opening' && (
          <motion.div
            key="opening"
            className="relative"
          >
            {/* Opening box with lid flying up */}
            <motion.div className="relative w-32 h-32 md:w-40 md:h-40">
              {/* Lid flying away */}
              <motion.div
                className="absolute left-0 right-0 h-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-t-2xl border-4 border-purple-300"
                initial={{ top: -12, rotate: 0 }}
                animate={{ 
                  top: -100, 
                  rotate: -45,
                  scale: 0.8,
                  opacity: 0,
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                {/* Bow on lid */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-8">
                  <div className="absolute left-0 top-2 w-7 h-6 bg-yellow-400 rounded-full transform -rotate-45" />
                  <div className="absolute right-0 top-2 w-7 h-6 bg-yellow-400 rounded-full transform rotate-45" />
                  <div className="absolute left-1/2 -translate-x-1/2 top-0 w-6 h-6 bg-yellow-500 rounded-full border-2 border-yellow-300" />
                </div>
              </motion.div>

              {/* Box body stays */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl shadow-2xl border-4 border-purple-300"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.5 }}
              />
              
              {/* Ribbon breaks */}
              <motion.div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-full bg-gradient-to-b from-yellow-300 to-yellow-500 shadow-lg origin-top"
                animate={{ 
                  scaleY: 0,
                  opacity: 0,
                }}
                transition={{ duration: 0.4 }}
              />
              <motion.div
                className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-8 bg-gradient-to-r from-yellow-300 to-yellow-500 shadow-lg origin-left"
                animate={{ 
                  scaleX: 0,
                  opacity: 0,
                }}
                transition={{ duration: 0.4 }}
              />

              {/* Burst of light from inside */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 2, opacity: [0, 1, 0] }}
                transition={{ duration: 0.8 }}
              >
                <div className="w-full h-full bg-gradient-radial from-yellow-200 via-yellow-400 to-transparent rounded-2xl" />
              </motion.div>

              {/* Particles bursting out */}
              {[...Array(12)].map((_, i) => {
                const angle = (i / 12) * Math.PI * 2;
                return (
                  <motion.div
                    key={i}
                    className="absolute left-1/2 top-1/2"
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{
                      x: Math.cos(angle) * 80,
                      y: Math.sin(angle) * 80,
                      opacity: 0,
                      scale: [1, 1.5, 0],
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  >
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        )}

        {phase === 'opened' && (
          <motion.div
            key="opened"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 0.6 }}
            >
              <Gift className="w-24 h-24 md:w-32 md:h-32 text-purple-400 mx-auto mb-4" />
            </motion.div>
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg"
            >
              Time Capsule Opened!
            </motion.h2>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
