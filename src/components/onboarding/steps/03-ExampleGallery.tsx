import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Heart, Target, Clock, Lock, Check } from 'lucide-react';

interface ExampleGalleryProps {
  onContinue: () => void;
  onBack: () => void;
}

const exampleCapsules = [
  {
    id: 1,
    title: 'Birthday Memory',
    icon: Gift,
    color: 'from-pink-500 to-rose-500',
    ringColor: 'border-pink-400/30',
    deliveryDate: 'Opens in 14 days',
    preview: 'A special message for your 30th birthday...',
    type: 'text',
    countdown: true
  },
  {
    id: 2,
    title: 'Wedding Anniversary',
    icon: Heart,
    color: 'from-red-500 to-pink-500',
    ringColor: 'border-red-400/30',
    deliveryDate: 'Opens in 3 months',
    preview: '5 photos from our special day',
    type: 'photos',
    photoCount: 5
  },
  {
    id: 3,
    title: 'Future Goals',
    icon: Target,
    color: 'from-purple-500 to-indigo-500',
    ringColor: 'border-purple-400/30',
    deliveryDate: 'Opens in 10 years',
    preview: 'Voice memo to future me...',
    type: 'audio',
    locked: true
  }
];

export function ExampleGallery({ onContinue }: ExampleGalleryProps) {
  const [selectedCapsule, setSelectedCapsule] = useState<number | null>(null);

  return (
    <div className="relative flex flex-col items-center justify-between min-h-full px-6 md:px-12 py-8 pb-24 md:pb-8 overflow-y-auto">
      {/* Continue button - Top Right */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
        onClick={onContinue}
        className="fixed top-4 right-4 z-50 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 text-sm font-medium shadow-xl"
        style={{ top: 'max(1rem, env(safe-area-inset-top, 1rem))' }}
      >
        Continue
      </motion.button>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 md:mb-12"
      >
        <h2 className="text-3xl md:text-4xl text-white mb-3">
          Your Capsule Gallery
        </h2>
        <p className="text-white/60 text-sm md:text-base max-w-md">
          Tap a capsule to preview what's inside
        </p>
      </motion.div>

      {/* Example capsules grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-4xl mb-8">
        {exampleCapsules.map((capsule, index) => (
          <motion.button
            key={capsule.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15 }}
            onClick={() => setSelectedCapsule(selectedCapsule === capsule.id ? null : capsule.id)}
            className="relative group"
          >
            {/* Card */}
            <div className={`
              relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10
              hover:border-white/20 transition-all duration-300
              ${selectedCapsule === capsule.id ? 'ring-2 ring-purple-400/50 border-purple-400/30' : ''}
            `}>
              {/* Icon with gradient background */}
              <div className="relative mb-4 flex justify-center">
                <div className={`
                  relative w-20 h-20 rounded-2xl bg-gradient-to-br ${capsule.color}
                  flex items-center justify-center
                `}>
                  <capsule.icon className="w-10 h-10 text-white" strokeWidth={1.5} />
                  
                  {/* Pulsing ring for countdown */}
                  {capsule.countdown && (
                    <motion.div
                      className={`absolute inset-0 rounded-2xl border-2 ${capsule.ringColor}`}
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.6, 0.3]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    />
                  )}
                </div>

                {/* Lock indicator for long-term capsules */}
                {capsule.locked && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center"
                  >
                    <Lock className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </div>

              {/* Title */}
              <h3 className="text-white font-medium mb-2 text-lg">
                {capsule.title}
              </h3>

              {/* Delivery date */}
              <div className="flex items-center justify-center gap-2 text-white/50 text-sm mb-3">
                <Clock className="w-4 h-4" />
                <span>{capsule.deliveryDate}</span>
              </div>

              {/* Type indicator */}
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-white/5 rounded-full text-xs text-white/60">
                {capsule.type === 'photos' && `${capsule.photoCount} photos`}
                {capsule.type === 'text' && 'Text message'}
                {capsule.type === 'audio' && 'Voice memo'}
              </div>

              {/* Selection indicator */}
              <AnimatePresence>
                {selectedCapsule === capsule.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute top-3 right-3 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Preview on selection */}
            <AnimatePresence>
              {selectedCapsule === capsule.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                    <div className="text-white/70 text-sm italic">
                      "{capsule.preview}"
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>

      {/* Explainer text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-white/50 text-sm text-center max-w-lg mb-8"
      >
        Each capsule is a moment in time, waiting to be rediscovered. Schedule them for days, months, or years into the future.
      </motion.p>
    </div>
  );
}