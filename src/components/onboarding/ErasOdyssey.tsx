import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { OdysseyProgress } from './OdysseyProgress';
import './devHelpers'; // Exposes window.odyssey dev helpers
import { WelcomeScene } from './steps/01-WelcomeScene';
import { SeeItInAction } from './steps/02-SeeItInAction';
import { ExampleGallery } from './steps/03-ExampleGallery';
import { YourVault } from './steps/04-YourVault';
import { DashboardTour } from './steps/05-DashboardTour';
import { DiscoverMore } from './steps/06-DiscoverMore';
import { ReadyToBegin } from './steps/07-ReadyToBegin';

export interface OdysseyState {
  currentStep: number;
  totalSteps: number;
}

interface ErasOdysseyProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function ErasOdyssey({ onComplete, onSkip }: ErasOdysseyProps) {
  const [state, setState] = useState<OdysseyState>({
    currentStep: 0,
    totalSteps: 7,
  });

  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  // Navigation handlers
  const nextStep = () => {
    if (state.currentStep < state.totalSteps - 1) {
      setDirection('forward');
      setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
    } else {
      // Tutorial complete!
      handleComplete();
    }
  };

  const prevStep = () => {
    if (state.currentStep > 0) {
      setDirection('backward');
      setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  };

  const goToStep = (stepIndex: number) => {
    setDirection(stepIndex > state.currentStep ? 'forward' : 'backward');
    setState(prev => ({ ...prev, currentStep: stepIndex }));
  };

  // Completion handler
  const handleComplete = () => {
    // Check if user wants to go to create page
    const redirectToCreate = localStorage.getItem('eras_odyssey_redirect_to_create');
    
    if (redirectToCreate) {
      localStorage.removeItem('eras_odyssey_redirect_to_create');
      // Will be handled by App.tsx to navigate to create
    }
    
    // Call parent completion handler
    onComplete();
  };

  // Skip handler
  const handleSkip = () => {
    const confirmSkip = window.confirm(
      'Are you sure you want to skip the tutorial? You can always access it later from Settings.'
    );
    
    if (confirmSkip) {
      localStorage.setItem('eras_odyssey_skipped', 'true');
      onSkip();
    }
  };

  // Step components
  const steps = [
    <WelcomeScene key="welcome" onContinue={nextStep} />,
    <SeeItInAction key="action" onContinue={nextStep} onBack={prevStep} />,
    <ExampleGallery key="gallery" onContinue={nextStep} onBack={prevStep} />,
    <YourVault key="vault" onContinue={nextStep} onBack={prevStep} />,
    <DashboardTour key="dashboard" onContinue={nextStep} onBack={prevStep} />,
    <DiscoverMore key="discover" onContinue={nextStep} onBack={prevStep} />,
    <ReadyToBegin key="ready" onComplete={handleComplete} />
  ];

  // Page transition variants
  const pageVariants = {
    initial: (direction: 'forward' | 'backward') => ({
      opacity: 0,
      x: direction === 'forward' ? 100 : -100,
      scale: 0.95
    }),
    animate: {
      opacity: 1,
      x: 0,
      scale: 1
    },
    exit: (direction: 'forward' | 'backward') => ({
      opacity: 0,
      x: direction === 'forward' ? -100 : 100,
      scale: 0.95
    })
  };

  return (
    <div 
      className="fixed inset-0 overflow-hidden"
      style={{
        zIndex: 2147483647,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)',
        isolation: 'isolate',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      {/* Background stars */}
      <div className="absolute inset-0 opacity-50">
        {Array.from({ length: 100 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      {/* Skip button - only show on steps 1-6 */}
      {state.currentStep < 7 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          onClick={handleSkip}
          className="absolute top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
        >
          <span>Skip Tutorial</span>
          <X className="w-4 h-4" />
        </motion.button>
      )}

      {/* Progress indicator - hide on first and last step */}
      {state.currentStep > 0 && state.currentStep < 7 && (
        <div className="absolute top-6 left-6 right-24 z-40">
          <OdysseyProgress 
            currentStep={state.currentStep} 
            totalSteps={state.totalSteps}
          />
        </div>
      )}

      {/* Step content with transitions */}
      <div className="relative w-full h-full flex items-center justify-center">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={state.currentStep}
            custom={direction}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
              duration: 0.5
            }}
            className="w-full h-full"
          >
            {steps[state.currentStep]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Ambient aurora effect */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </div>
    </div>
  );
}