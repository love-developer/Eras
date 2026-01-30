import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface WelcomeSceneProps {
  onContinue: () => void;
  onAutoAdvance?: () => void;
}

export function WelcomeScene({ onContinue }: WelcomeSceneProps) {
  // Auto-advance after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onContinue();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onContinue]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 md:px-12">
      {/* Floating capsule hologram */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="relative mb-12 md:mb-16"
      >
        {/* Glowing ring */}
        <motion.div
          className="absolute inset-0 w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-purple-400/30"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />

        {/* Central capsule icon */}
        <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
          <motion.div
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear'
            }}
          >
            <Sparkles className="w-16 h-16 md:w-20 md:h-20 text-purple-300" strokeWidth={1.5} />
          </motion.div>
        </div>

        {/* Orbiting particles */}
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-blue-400 rounded-full"
            style={{
              top: '50%',
              left: '50%',
              marginLeft: '-4px',
              marginTop: '-4px'
            }}
            animate={{
              x: [
                Math.cos((i * 120 * Math.PI) / 180) * 60,
                Math.cos(((i * 120 + 360) * Math.PI) / 180) * 60
              ],
              y: [
                Math.sin((i * 120 * Math.PI) / 180) * 60,
                Math.sin(((i * 120 + 360) * Math.PI) / 180) * 60
              ]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 0.3
            }}
          />
        ))}
      </motion.div>

      {/* Text content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="text-center max-w-2xl"
      >
        <h1 className="text-4xl md:text-6xl mb-4 md:mb-6 bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200 bg-clip-text text-transparent">
          Welcome to Eras
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="text-lg md:text-xl text-white/80 leading-relaxed px-4"
        >
          Capture Today, Unlock Tomorrow
        </motion.p>
      </motion.div>

      {/* Subtle hint to wait */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-12 text-white/40 text-sm"
      >
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ↓
        </motion.div>
      </motion.div>

      {/* Optional: Tap anywhere to continue (mobile) */}
      <button
        onClick={onContinue}
        className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
        aria-label="Continue to next step"
      />
    </div>
  );
}