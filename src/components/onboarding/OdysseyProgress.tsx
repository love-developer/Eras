import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface OdysseyProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function OdysseyProgress({ currentStep, totalSteps }: OdysseyProgressProps) {
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  // Step labels for new 7-step tutorial
  const stepLabels = ['Welcome', 'Demo', 'Gallery', 'Vault', 'Dashboard', 'Features', 'Begin'];

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: ['-100%', '200%']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        </motion.div>
      </div>

      {/* Step counter with label */}
      <div className="text-center mt-3">
        <span className="text-sm text-white/70">
          {stepLabels[currentStep]} · Step {currentStep + 1} of {totalSteps}
        </span>
      </div>
    </div>
  );
}