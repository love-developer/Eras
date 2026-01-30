import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Send, Bell, Package } from 'lucide-react';

interface SeeItInActionProps {
  onContinue: () => void;
  onBack: () => void;
}

export function SeeItInAction({ onContinue }: SeeItInActionProps) {
  const [phase, setPhase] = useState(0);

  // Auto-progress through phases
  useEffect(() => {
    if (phase === 0) {
      const timer = setTimeout(() => setPhase(1), 2000);
      return () => clearTimeout(timer);
    }
    if (phase === 1) {
      const timer = setTimeout(() => setPhase(2), 2500);
      return () => clearTimeout(timer);
    }
    if (phase === 2) {
      const timer = setTimeout(() => setPhase(3), 2500);
      return () => clearTimeout(timer);
    }
    if (phase === 3) {
      const timer = setTimeout(() => setPhase(4), 2500);
      return () => clearTimeout(timer);
    }
    if (phase === 4) {
      // Auto-advance to next step after completion
      const timer = setTimeout(() => onContinue(), 2000);
      return () => clearTimeout(timer);
    }
  }, [phase, onContinue]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 md:px-12 py-8">
      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl md:text-4xl text-white mb-8 md:mb-12 text-center"
      >
        How Eras Works
      </motion.h2>

      {/* Animated demonstration area */}
      <div className="relative w-full max-w-md md:max-w-lg h-80 md:h-96 mb-8">
        <AnimatePresence mode="wait">
          {/* Phase 0: Someone writing */}
          {phase === 0 && (
            <motion.div
              key="write"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <div className="w-full max-w-sm bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-400/30 rounded-full flex items-center justify-center">
                    <Send className="w-5 h-5 text-purple-300" />
                  </div>
                  <div className="text-white/90 font-medium">Create a Capsule</div>
                </div>
                
                {/* Typing animation */}
                <motion.div
                  className="bg-white/5 rounded-lg p-4 text-white/70 min-h-[100px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    "Future me, I hope you're doing well..."
                  </motion.span>
                  <motion.span
                    className="inline-block w-1 h-4 bg-purple-400 ml-1"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Phase 1: Schedule with calendar */}
          {phase === 1 && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <div className="w-full max-w-sm bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-400/30 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-300" />
                  </div>
                  <div className="text-white/90 font-medium">Schedule Delivery</div>
                </div>
                
                {/* Simulated calendar */}
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 28 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className={`aspect-square rounded flex items-center justify-center text-xs ${
                        i === 20 ? 'bg-purple-500 text-white' : 'bg-white/5 text-white/50'
                      }`}
                    >
                      {i + 1}
                    </motion.div>
                  ))}
                </div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mt-4 text-center text-purple-300 text-sm"
                >
                  Opens in 1 year
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Phase 2: Time travel animation */}
          {phase === 2 && (
            <motion.div
              key="travel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              {/* Capsule traveling through time */}
              <motion.div
                className="relative"
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: 1,
                  ease: 'easeInOut'
                }}
              >
                <Package className="w-20 h-20 md:w-24 md:h-24 text-purple-300" />
              </motion.div>

              {/* Time rings expanding */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 border-2 border-purple-400/30 rounded-full"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 2.5, opacity: [0, 0.5, 0] }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.5,
                    repeat: 1
                  }}
                />
              ))}

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute bottom-20 text-white/70 text-center"
              >
                Time passes...
              </motion.p>
            </motion.div>
          )}

          {/* Phase 3: Notification arrives */}
          {phase === 3 && (
            <motion.div
              key="notification"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <motion.div
                className="w-full max-w-sm bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 0.5,
                  times: [0, 0.5, 1]
                }}
              >
                <div className="flex items-start gap-4">
                  <motion.div
                    className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0"
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 15, -15, 0]
                    }}
                    transition={{
                      duration: 0.6,
                      times: [0, 0.3, 0.6, 1]
                    }}
                  >
                    <Bell className="w-6 h-6 text-white" />
                  </motion.div>
                  
                  <div className="flex-1">
                    <div className="text-white font-medium mb-1">Your capsule has arrived!</div>
                    <div className="text-white/60 text-sm">
                      A message from 1 year ago is ready to open
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Phase 4: Opening and reaction */}
          {phase === 4 && (
            <motion.div
              key="open"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <div className="w-full max-w-sm bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/20 relative overflow-hidden">
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{
                    x: ['-100%', '200%']
                  }}
                  transition={{
                    duration: 1.5,
                    ease: 'easeInOut'
                  }}
                />

                <div className="relative">
                  <div className="text-white/50 text-xs mb-2">From: Past You • 1 year ago</div>
                  <div className="text-white/90 mb-4">
                    "Future me, I hope you're doing well..."
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-purple-300 text-sm text-center"
                  >
                    ✨ A moment preserved
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className={`w-2 h-2 rounded-full ${
              phase >= i ? 'bg-purple-400' : 'bg-white/20'
            }`}
            animate={phase === i ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.5 }}
          />
        ))}
      </div>

      {/* Skip button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={onContinue}
        className="px-6 py-2 text-white/60 hover:text-white/90 text-sm transition-colors"
      >
        Skip animation →
      </motion.button>
    </div>
  );
}
