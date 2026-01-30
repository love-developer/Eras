import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Key, Heart } from 'lucide-react';

interface NewHomeCeremonyProps {
  onComplete: () => void;
  isVisible: boolean;
}

export function NewHomeCeremony({ onComplete, isVisible }: NewHomeCeremonyProps) {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [doorOpen, setDoorOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleUnlock = () => {
    if (isUnlocking) return;

    setIsUnlocking(true);
    if (navigator.vibrate) navigator.vibrate(50);

    // Unlock animation
    setTimeout(() => {
      setDoorOpen(true);
      if (navigator.vibrate) navigator.vibrate([30, 20, 30]);

      setTimeout(() => {
        setShowCelebration(true);
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        setTimeout(onComplete, 2500);
      }, 1000);
    }, 800);
  };

  if (!isVisible) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full relative overflow-hidden bg-gradient-to-b from-amber-50 to-amber-100">
      <AnimatePresence>
        {!showCelebration && (
          <motion.div
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center space-y-8"
          >
            <div className="space-y-2">
              <Home className="w-16 h-16 text-amber-700 mx-auto" />
              <h2 className="text-3xl font-serif text-amber-800 font-bold">New Nest</h2>
              <p className="text-amber-700/60 text-sm">Tap the key to unlock your home</p>
            </div>

            {/* Door */}
            <div className="relative w-80 h-96">
              {/* Door frame */}
              <div className="absolute inset-0 bg-gradient-to-b from-amber-900 to-amber-800 rounded-t-3xl border-8 border-amber-950 shadow-2xl" />

              {/* Door panels */}
              <motion.div
                className="absolute inset-4 bg-gradient-to-b from-amber-700 to-amber-600 rounded-t-2xl overflow-hidden"
                animate={doorOpen ? { rotateY: -90, x: -150 } : {}}
                transition={{ duration: 1, type: 'spring' }}
                style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d' }}
              >
                {/* Door panels design */}
                <div className="absolute inset-8 border-4 border-amber-800 rounded" />
                <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 border-2 border-amber-800" />

                {/* Doorknob */}
                <motion.div
                  className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-yellow-600 border-2 border-yellow-700 shadow-lg"
                  animate={isUnlocking ? { rotate: 90 } : {}}
                  transition={{ duration: 0.5 }}
                />
              </motion.div>

              {/* Inside view (visible when door opens) */}
              <AnimatePresence>
                {doorOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-gradient-to-b from-yellow-200 to-orange-100 rounded-t-3xl flex items-center justify-center"
                  >
                    <div className="text-center">
                      <div className="text-7xl mb-4">🏡</div>
                      <p className="text-2xl font-serif text-amber-800 font-bold">Welcome Home!</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Welcome mat */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-48 h-12 bg-gradient-to-b from-red-800 to-red-900 rounded border-2 border-red-950 flex items-center justify-center">
                <span className="text-xs font-serif text-amber-100">WELCOME</span>
              </div>
            </div>

            {/* Key button */}
            <motion.button
              onClick={handleUnlock}
              disabled={isUnlocking}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <motion.div
                animate={isUnlocking ? { y: [0, -20, 0], rotate: [0, 15, -15, 0] } : {}}
                transition={{ duration: 0.8 }}
                className="text-8xl"
              >
                🔑
              </motion.div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebration */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center z-50"
          >
            {/* Hearts floating up */}
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-4xl"
                style={{
                  left: `${Math.random() * 100}%`,
                  bottom: '-10%'
                }}
                animate={{
                  y: [0, -window.innerHeight - 100],
                  x: [(Math.random() - 0.5) * 100],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: i * 0.1
                }}
              >
                ❤️
              </motion.div>
            ))}

            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white/95 backdrop-blur-md p-8 rounded-2xl border-4 border-amber-500 text-center shadow-2xl"
            >
              <Heart className="w-20 h-20 text-red-500 mx-auto mb-4" fill="currentColor" />
              <h2 className="text-4xl font-serif font-bold text-amber-800 mb-2">Home Sweet Home</h2>
              <p className="text-amber-700 text-lg">A new chapter begins</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
