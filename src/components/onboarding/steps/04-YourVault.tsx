import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FolderOpen, Image, Video, Music, ArrowRight, Shield, Users } from 'lucide-react';

interface YourVaultProps {
  onContinue: () => void;
  onBack: () => void;
}

export function YourVault({ onContinue }: YourVaultProps) {
  const [phase, setPhase] = useState(0);

  // Auto-progress through phases
  useEffect(() => {
    if (phase === 0) {
      const timer = setTimeout(() => setPhase(1), 8000);
      return () => clearTimeout(timer);
    }
    if (phase === 1) {
      const timer = setTimeout(() => setPhase(2), 8000);
      return () => clearTimeout(timer);
    }
    if (phase === 2) {
      const timer = setTimeout(() => setPhase(3), 7000);
      return () => clearTimeout(timer);
    }
    if (phase === 3) {
      // Stay on final phase, user must click continue
      return;
    }
  }, [phase]);

  return (
    <div className="relative flex flex-col items-center justify-center h-full px-6 md:px-12 py-8 pb-28 md:pb-8">
      {/* Continue button - Top Right (only show on final phase) */}
      <AnimatePresence>
        {phase === 3 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={onContinue}
            className="fixed top-4 right-4 z-50 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 text-sm font-medium shadow-xl"
            style={{ top: 'max(1rem, env(safe-area-inset-top, 1rem))' }}
          >
            Continue
          </motion.button>
        )}
      </AnimatePresence>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 md:mb-12"
      >
        <motion.div
          className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 mb-4 shadow-2xl shadow-purple-500/50"
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 2, -2, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <Shield className="w-8 h-8 md:w-10 md:h-10 text-white" strokeWidth={1.5} />
        </motion.div>

        <h2 className="text-3xl md:text-4xl text-white mb-3">
          Your Vault
        </h2>
        <p className="text-white/60 text-sm md:text-base max-w-md">
          A secure space for all your memories
        </p>
      </motion.div>

      {/* Animated demonstration area */}
      <div className="relative w-full max-w-2xl h-80 md:h-96 mb-8">
        <AnimatePresence mode="wait">
          {/* Phase 0: Media Library */}
          {phase === 0 && (
            <motion.div
              key="library"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/20">
                <div className="flex items-center gap-3 mb-6">
                  <FolderOpen className="w-6 h-6 text-purple-300" />
                  <div className="text-white/90 font-medium text-lg">My Folders</div>
                </div>

                {/* Folder grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { icon: Image, label: 'Photos', count: 24, color: 'from-blue-500 to-cyan-500', delay: 0 },
                    { icon: Video, label: 'Videos', count: 12, color: 'from-purple-500 to-pink-500', delay: 0.15 },
                    { icon: Music, label: 'Audio', count: 8, color: 'from-orange-500 to-red-500', delay: 0.3 }
                  ].map((folder, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20, scale: 0 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: folder.delay, type: 'spring' }}
                      className={`
                        bg-gradient-to-br ${folder.color}
                        rounded-xl p-4 flex flex-col items-center justify-center
                        cursor-pointer hover:scale-105 transition-transform
                        shadow-lg
                      `}
                    >
                      <folder.icon className="w-8 h-8 md:w-10 md:h-10 text-white mb-2" strokeWidth={1.5} />
                      <div className="text-white text-xs md:text-sm font-medium mb-1">{folder.label}</div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: folder.delay + 0.3 }}
                        className="text-white/80 text-xs md:text-sm"
                      >
                        {folder.count}
                      </motion.div>
                    </motion.div>
                  ))}
                </div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-white/70 text-sm text-center"
                >
                  Store photos, videos, audio, and documents in one place
                </motion.p>
              </div>
            </motion.div>
          )}

          {/* Phase 1: Import to Capsule */}
          {phase === 1 && (
            <motion.div
              key="import"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <div className="w-full max-w-2xl">
                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-8"
                >
                  <h3 className="text-xl md:text-2xl text-white/90 mb-2">Import to Capsules</h3>
                  <p className="text-white/60 text-sm">Use your stored media anytime</p>
                </motion.div>

                {/* Animation: Vault → Capsule */}
                <div className="relative flex items-center justify-center gap-12 md:gap-20 py-12">
                  {/* Vault folder */}
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-3 shadow-xl">
                      <FolderOpen className="w-10 h-10 md:w-12 md:h-12 text-white" strokeWidth={1.5} />
                    </div>
                    <div className="text-white/70 text-sm">Vault</div>
                  </motion.div>

                  {/* Animated photo traveling */}
                  <motion.div
                    className="absolute"
                    initial={{ 
                      x: -80,
                      scale: 1,
                      opacity: 0
                    }}
                    animate={{ 
                      x: 80,
                      scale: [1, 1.2, 1],
                      opacity: [0, 1, 1, 0.5]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1,
                      ease: 'easeInOut'
                    }}
                  >
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg">
                      <Image className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    </div>
                  </motion.div>

                  {/* Arrow */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="absolute"
                  >
                    <ArrowRight className="w-8 h-8 md:w-10 md:h-10 text-purple-300/50" strokeWidth={2} />
                  </motion.div>

                  {/* Capsule */}
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col items-center"
                  >
                    <motion.div
                      className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center mb-3 shadow-xl"
                      animate={{
                        scale: [1, 1.1, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 1
                      }}
                    >
                      <div className="text-3xl md:text-4xl">📦</div>
                    </motion.div>
                    <div className="text-white/70 text-sm">Capsule</div>
                  </motion.div>
                </div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-white/60 text-sm text-center max-w-md mx-auto"
                >
                  Drag and drop media from your Vault into any capsule
                </motion.p>
              </div>
            </motion.div>
          )}

          {/* Phase 2: Organize with Templates */}
          {phase === 2 && (
            <motion.div
              key="organize"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/20">
                {/* Folder header */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 mb-6"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <FolderOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium">Vacation 2025</div>
                    <div className="text-white/50 text-sm">24 files</div>
                  </div>
                </motion.div>

                {/* Template badge */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="inline-flex items-center gap-2 px-3 py-2 mb-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-400/30"
                >
                  <div className="text-lg">✨</div>
                  <div className="text-white/90 text-sm font-medium">Created from Template: Travel</div>
                </motion.div>

                {/* Folder contents preview */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="grid grid-cols-3 gap-2 mb-4"
                >
                  {[
                    { icon: '🏖️', label: 'Beach', delay: 0.8 },
                    { icon: '🏔️', label: 'Mountains', delay: 0.9 },
                    { icon: '🍽️', label: 'Food', delay: 1.0 }
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: item.delay, type: 'spring' }}
                      className="bg-white/5 rounded-lg p-3 flex flex-col items-center border border-white/10"
                    >
                      <div className="text-2xl mb-1">{item.icon}</div>
                      <div className="text-white/70 text-xs">{item.label}</div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Organization info */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="flex items-start gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-400/20"
                >
                  <FolderOpen className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-white/90 text-sm mb-1">Pre-organized Structure</div>
                    <div className="text-white/60 text-xs">Templates help you organize memories instantly</div>
                  </div>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  className="text-white/60 text-sm text-center mt-6"
                >
                  Create custom folders or use templates to stay organized
                </motion.p>
              </div>
            </motion.div>
          )}

          {/* Phase 3: Legacy Access */}
          {phase === 3 && (
            <motion.div
              key="legacy"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <div className="w-full max-w-md">
                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-8"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-xl">
                    <Users className="w-8 h-8 text-white" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xl md:text-2xl text-white/90 mb-2">Legacy Access</h3>
                  <p className="text-white/60 text-sm">Grant access to loved ones</p>
                </motion.div>

                {/* Beneficiaries card */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                  <div className="text-white/90 font-medium mb-4">Legacy Beneficiaries</div>

                  {/* Beneficiary list */}
                  <div className="space-y-3 mb-6">
                    {[
                      { name: 'Sarah', role: 'Daughter', delay: 0.3 },
                      { name: 'John', role: 'Partner', delay: 0.5 }
                    ].map((person, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: person.delay }}
                        className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-lg">
                          👤
                        </div>
                        <div className="flex-1">
                          <div className="text-white/90 text-sm font-medium">{person.name}</div>
                          <div className="text-white/50 text-xs">{person.role}</div>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-green-400" />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Access info */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex items-start gap-3 p-4 bg-indigo-500/10 rounded-lg border border-indigo-400/20"
                  >
                    <Shield className="w-5 h-5 text-indigo-300 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-white/90 text-sm mb-1">Secure & Private</div>
                      <div className="text-white/60 text-xs leading-relaxed">
                        You choose when beneficiaries gain access after account inactivity
                      </div>
                    </div>
                  </motion.div>
                </div>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="text-white/60 text-sm text-center mt-6"
                >
                  Plan your digital legacy with confidence
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className={`h-2 rounded-full transition-all ${
              phase >= i 
                ? 'w-8 bg-gradient-to-r from-purple-500 to-indigo-500'
                : 'w-2 bg-white/20'
            }`}
            animate={phase === i ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.5 }}
          />
        ))}
      </div>

      {/* Phase labels */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-white/50 text-xs md:text-sm text-center mb-8"
      >
        {phase === 0 && 'Media Library'}
        {phase === 1 && 'Import to Capsules'}
        {phase === 2 && 'Organize with Templates'}
        {phase === 3 && 'Legacy Access'}
      </motion.div>

      {/* Skip button for earlier phases */}
      {phase < 3 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={onContinue}
          className="px-6 py-2 text-white/60 hover:text-white/90 text-sm transition-colors"
        >
          Skip ahead →
        </motion.button>
      )}
    </div>
  );
}