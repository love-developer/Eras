import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Compass } from 'lucide-react';

interface ReadyToBeginProps {
  onComplete: () => void;
  reward?: string;
}

export function ReadyToBegin({ onComplete }: ReadyToBeginProps) {
  const handleCreateCapsule = () => {
    // Mark tutorial as complete and navigate to create page
    localStorage.setItem('eras_odyssey_completed', 'true');
    localStorage.setItem('eras_odyssey_completion_date', new Date().toISOString());
    localStorage.setItem('eras_odyssey_redirect_to_create', 'true');
    onComplete();
  };

  const handleExploreDashboard = () => {
    // Mark tutorial as complete and go to dashboard
    localStorage.setItem('eras_odyssey_completed', 'true');
    localStorage.setItem('eras_odyssey_completion_date', new Date().toISOString());
    onComplete();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 md:px-12 py-8 pb-28 md:pb-8">
      {/* Celebration icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: 'spring', duration: 1, bounce: 0.5 }}
        className="relative mb-8 md:mb-12"
      >
        {/* Glowing rings */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-purple-400/20"
            initial={{ scale: 1, opacity: 0 }}
            animate={{
              scale: [1, 1.5, 2],
              opacity: [0.5, 0.3, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.6
            }}
          />
        ))}

        {/* Central icon */}
        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-purple-500 flex items-center justify-center shadow-2xl shadow-purple-500/50">
          <Sparkles className="w-16 h-16 md:w-20 md:h-20 text-white" strokeWidth={1.5} />
        </div>

        {/* Orbiting particles */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 bg-gradient-to-br from-yellow-400 to-pink-400 rounded-full"
            style={{
              top: '50%',
              left: '50%',
              marginLeft: '-6px',
              marginTop: '-6px'
            }}
            animate={{
              x: [
                Math.cos((i * 45 * Math.PI) / 180) * 80,
                Math.cos(((i * 45 + 360) * Math.PI) / 180) * 80
              ],
              y: [
                Math.sin((i * 45 * Math.PI) / 180) * 80,
                Math.sin(((i * 45 + 360) * Math.PI) / 180) * 80
              ],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
              delay: i * 0.2
            }}
          />
        ))}
      </motion.div>

      {/* Title and description */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-center max-w-2xl mb-12"
      >
        <h1 className="text-4xl md:text-5xl mb-4 md:mb-6 bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200 bg-clip-text text-transparent">
          Ready to Begin
        </h1>

        <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-8">
          Your journey through time starts now. Create your first capsule or explore your dashboard.
        </p>

        {/* Quick stats preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-12"
        >
          {[
            { emoji: '✨', label: 'Create' },
            { emoji: '⏰', label: 'Schedule' },
            { emoji: '🎁', label: 'Receive' }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + i * 0.1, type: 'spring' }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
            >
              <div className="text-3xl mb-2">{item.emoji}</div>
              <div className="text-white/60 text-sm">{item.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="flex flex-col sm:flex-row gap-4 w-full max-w-lg"
      >
        {/* Primary CTA - Create Capsule */}
        <motion.button
          onClick={handleCreateCapsule}
          className="flex-1 group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-medium shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/60 transition-all duration-300"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: ['-100%', '200%']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1
            }}
          />

          <div className="relative flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" />
            <span>Create My First Capsule</span>
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight className="w-5 h-5" />
            </motion.div>
          </div>
        </motion.button>

        {/* Secondary CTA - Explore Dashboard */}
        <motion.button
          onClick={handleExploreDashboard}
          className="flex-1 px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/20 text-white rounded-2xl font-medium hover:bg-white/10 hover:border-white/30 transition-all duration-300"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-center gap-2">
            <Compass className="w-5 h-5" />
            <span>Explore Dashboard</span>
          </div>
        </motion.button>
      </motion.div>

      {/* Subtle hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
        className="mt-8 text-white/40 text-xs md:text-sm text-center"
      >
        You can access this tutorial anytime from Settings
      </motion.p>
    </div>
  );
}