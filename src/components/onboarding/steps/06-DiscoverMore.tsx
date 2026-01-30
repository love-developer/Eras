import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, MessageCircle, Palette, ChevronLeft, ChevronRight } from 'lucide-react';

interface DiscoverMoreProps {
  onContinue: () => void;
  onBack: () => void;
}

const features = [
  {
    id: 'achievements',
    name: 'Achievements',
    icon: Trophy,
    tagline: 'Unlock 57 achievements across 5 tiers',
    color: 'from-amber-500 to-yellow-500',
    description: 'Earn achievements from Common to Legendary tiers. 51 grant special titles like "Chrononaut" and "Legend" that you can equip and display.',
    visual: (
      <motion.div className="flex items-center justify-center gap-3 md:gap-4 flex-wrap">
        {[
          { emoji: '🌟', label: 'Time Novice', tier: 'Common', gradient: 'from-blue-400 to-cyan-400' },
          { emoji: '⏰', label: 'Chrononaut', tier: 'Rare', gradient: 'from-purple-500 to-violet-500' },
          { emoji: '💎', label: 'Legend', tier: 'Legendary', gradient: 'from-red-500 to-pink-500' }
        ].map((achievement, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0, rotate: -180 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: i * 0.2, type: 'spring' }}
            className="flex flex-col items-center"
          >
            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${achievement.gradient} flex items-center justify-center mb-2 shadow-lg relative`}>
              <span className="text-3xl md:text-4xl">{achievement.emoji}</span>
              {achievement.tier === 'Legendary' && (
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(239, 68, 68, 0.3)',
                      '0 0 30px rgba(236, 72, 153, 0.5)',
                      '0 0 20px rgba(239, 68, 68, 0.3)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>
            <span className="text-white/80 text-xs font-medium mb-1">{achievement.label}</span>
            <span className="text-white/40 text-xs">{achievement.tier}</span>
          </motion.div>
        ))}
      </motion.div>
    )
  },
  {
    id: 'echoes',
    name: 'Echoes',
    icon: MessageCircle,
    tagline: 'React and comment on opened capsules',
    color: 'from-blue-500 to-cyan-500',
    description: 'Add reactions and comments to your opened capsules, creating a conversation across time.',
    visual: (
      <motion.div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 rounded-xl p-3 md:p-4"
        >
          <div className="text-white/70 text-sm mb-2">
            "Wow, I can't believe how much has changed!"
          </div>
          <div className="flex gap-2">
            {['❤️', '😊', '🎉'].map((emoji, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
                className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 cursor-pointer"
              >
                {emoji}
              </motion.div>
            ))}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-blue-500/20 rounded-xl p-3 border border-blue-400/30 flex items-start gap-2"
        >
          <MessageCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-white/70 text-xs md:text-sm">
            Reflect on your journey with notes and reactions
          </div>
        </motion.div>
      </motion.div>
    )
  },
  {
    id: 'themes',
    name: 'Themed Capsules',
    icon: Palette,
    tagline: '15+ themed experiences with unique ceremonies',
    color: 'from-pink-500 to-rose-500',
    description: 'Each theme includes custom opening and closing ceremonies that bring your memories to life.',
    visual: (
      <motion.div className="grid grid-cols-2 gap-3">
        {[
          { name: 'Birthday', emoji: '🎂', gradient: 'from-pink-500 via-purple-500 to-pink-600' },
          { name: 'Wedding', emoji: '💝', gradient: 'from-rose-400 via-pink-400 to-amber-300' },
          { name: 'Travel', emoji: '✈️', gradient: 'from-sky-500 via-blue-500 to-cyan-500' },
          { name: 'Graduation', emoji: '🎓', gradient: 'from-slate-700 via-slate-600 to-yellow-500' }
        ].map((theme, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0, rotate: -90 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: i * 0.1, type: 'spring' }}
            className={`h-20 md:h-24 rounded-xl bg-gradient-to-br ${theme.gradient} flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-lg relative overflow-hidden`}
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-2xl md:text-3xl mb-1">{theme.emoji}</span>
            <span className="text-white text-xs font-medium">{theme.name}</span>
            {/* Subtle sparkle effect for Birthday */}
            {theme.name === 'Birthday' && (
              <motion.div
                className="absolute top-1 right-1 text-yellow-200 text-xs"
                animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                ✨
              </motion.div>
            )}
          </motion.div>
        ))}
      </motion.div>
    )
  }
];

export function DiscoverMore({ onContinue }: DiscoverMoreProps) {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  // Auto-advance through features
  useEffect(() => {
    if (!autoAdvance) return;

    const timer = setTimeout(() => {
      if (currentFeature < features.length - 1) {
        setDirection('forward');
        setCurrentFeature(prev => prev + 1);
      }
    }, 5000); // 5 seconds per feature

    return () => clearTimeout(timer);
  }, [currentFeature, autoAdvance]);

  const handleNext = () => {
    setAutoAdvance(false);
    if (currentFeature < features.length - 1) {
      setDirection('forward');
      setCurrentFeature(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setAutoAdvance(false);
    if (currentFeature > 0) {
      setDirection('backward');
      setCurrentFeature(prev => prev - 1);
    }
  };

  const feature = features[currentFeature];
  const FeatureIcon = feature.icon;

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
          Discover More
        </h2>
        <p className="text-white/60 text-sm md:text-base max-w-md">
          Eras grows with you
        </p>
      </motion.div>

      {/* Feature carousel */}
      <div className="relative w-full max-w-2xl mb-8">
        {/* Navigation arrows - desktop */}
        <button
          onClick={handlePrev}
          disabled={currentFeature === 0}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 w-12 h-12 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        <button
          onClick={handleNext}
          disabled={currentFeature === features.length - 1}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 w-12 h-12 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>

        {/* Feature card with animation */}
        <div className="relative min-h-[400px] md:min-h-[450px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentFeature}
              custom={direction}
              initial={{
                opacity: 0,
                x: direction === 'forward' ? 100 : -100,
                scale: 0.95
              }}
              animate={{
                opacity: 1,
                x: 0,
                scale: 1
              }}
              exit={{
                opacity: 0,
                x: direction === 'forward' ? -100 : 100,
                scale: 0.95
              }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0"
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/10 h-full flex flex-col">
                {/* Icon and title */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`
                    w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${feature.color}
                    flex items-center justify-center shadow-lg
                  `}>
                    <FeatureIcon className="w-7 h-7 md:w-8 md:h-8 text-white" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl text-white font-medium mb-1">
                      {feature.name}
                    </h3>
                    <p className="text-white/60 text-sm md:text-base">
                      {feature.tagline}
                    </p>
                  </div>
                </div>

                {/* Visual preview */}
                <div className="flex-1 flex items-center justify-center mb-6 py-4">
                  {feature.visual}
                </div>

                {/* Description */}
                <p className="text-white/70 text-sm md:text-base text-center">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile navigation - bottom */}
        <div className="flex md:hidden justify-center gap-4 mt-6">
          <button
            onClick={handlePrev}
            disabled={currentFeature === 0}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentFeature === features.length - 1}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {features.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setAutoAdvance(false);
              setDirection(i > currentFeature ? 'forward' : 'backward');
              setCurrentFeature(i);
            }}
            className="group"
          >
            <motion.div
              className={
                currentFeature === i 
                  ? 'h-2 w-8 rounded-full transition-all'
                  : 'h-2 w-2 rounded-full transition-all bg-white/20 group-hover:bg-white/40'
              }
              style={currentFeature === i ? {
                background: i === 0 ? 'linear-gradient(to right, #f59e0b, #eab308)' :
                           i === 1 ? 'linear-gradient(to right, #3b82f6, #06b6d4)' :
                           'linear-gradient(to right, #ec4899, #f43f5e)'
              } : undefined}
              animate={currentFeature === i ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5 }}
            />
          </button>
        ))}
      </div>

      {/* Hint text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-white/40 text-xs md:text-sm text-center mb-8 max-w-md"
      >
        {autoAdvance ? 'Auto-advancing...' : 'Discover these features as you explore'}
      </motion.p>
    </div>
  );
}