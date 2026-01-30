import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/button';
import { Dialog, DialogContent } from './ui/dialog';
import { Progress } from './ui/progress';
import { 
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { MomentPrismLogo } from './MomentPrismLogo';
import { motion, AnimatePresence } from 'motion/react';

interface UserOnboardingProps {
  onComplete: () => void;
  isOpen?: boolean;
}

interface TutorialSlide {
  emoji: string;
  title: string;
  description: string;
  highlights: string[];
  bgColor: string;
  accentColor: string;
}

const tutorialSlides: TutorialSlide[] = [
  {
    emoji: '🏡',
    title: 'Welcome to Eras',
    description: 'Create AI-enhanced time capsules for yourself and loved ones. Schedule memories to be delivered at the perfect moment.',
    highlights: [
      'Record video, audio, or text messages',
      'Apply AI enhancements and filters',
      'Schedule delivery for any future date',
      'Send to yourself or others via email/SMS'
    ],
    bgColor: 'bg-indigo-100 dark:bg-indigo-950',
    accentColor: 'bg-indigo-500'
  },
  {
    emoji: '🎥',
    title: 'Record Tab',
    description: 'Jump straight into recording mode. Capture HD video, crystal-clear audio, or heartfelt text messages in seconds.',
    highlights: [
      '🎬 One-tap HD video recording',
      '🎙️ High-quality audio capture',
      '✍️ Quick text messages',
      '📱 Mobile-optimized interface'
    ],
    bgColor: 'bg-orange-100 dark:bg-orange-950',
    accentColor: 'bg-orange-500'
  },
  {
    emoji: '✨',
    title: 'Create Tab',
    description: 'Turn your recordings into beautiful time capsules. Apply AI enhancements, add multiple media files, and schedule delivery.',
    highlights: [
      '🎨 10+ AI enhancement filters',
      '🖼️ Combine multiple media files',
      '📅 Schedule for any future date',
      '📧 Email & SMS delivery options'
    ],
    bgColor: 'bg-emerald-100 dark:bg-emerald-950',
    accentColor: 'bg-emerald-500'
  },
  {
    emoji: '🏛️',
    title: 'Vault Tab',
    description: 'Your mission control. View all capsules - scheduled, delivered, and received. Track delivery status and manage everything in one place.',
    highlights: [
      '📊 Real-time delivery tracking',
      '📬 Received capsules from others',
      '🔄 Quick actions (edit, resend, delete)',
      '🗓️ Calendar view of all capsules'
    ],
    bgColor: 'bg-purple-100 dark:bg-purple-950',
    accentColor: 'bg-purple-500'
  },
  {
    emoji: '🏆',
    title: 'Achievements & Titles',
    description: 'Unlock achievements as you use Eras and earn exclusive Legacy Titles to display on your profile. Ready to begin your journey?',
    highlights: [
      '🎖️ 35 unique achievements to unlock',
      '👑 Rare, Epic, and Legendary titles',
      '⚡ Automatic retroactive unlocking',
      '✨ Animated unlock celebrations'
    ],
    bgColor: 'bg-amber-100 dark:bg-amber-950',
    accentColor: 'bg-amber-500'
  }
];

export function UserOnboarding({ onComplete, isOpen }: UserOnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [direction, setDirection] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    setIsMounted(true);
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isVisible) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isVisible]);

  // Respond to isOpen prop changes
  useEffect(() => {
    if (isOpen !== undefined) {
      setIsVisible(isOpen);
      if (isOpen) {
        setCurrentSlide(0);
      }
    }
  }, [isOpen]);

  // Initial automatic onboarding check
  useEffect(() => {
    if (isOpen !== undefined) return;
    
    const hasCompletedOnboarding = localStorage.getItem('eras-onboarding-completed');
    const dontShowAgainPref = localStorage.getItem('eras-onboarding-dont-show-again');
    
    if (!hasCompletedOnboarding && !dontShowAgainPref) {
      setTimeout(() => setIsVisible(true), 500);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentSlide < tutorialSlides.length - 1) {
      setDirection(1);
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleClose = () => {
    localStorage.setItem('eras-onboarding-completed', 'true');
    setIsVisible(false);
    onComplete();
  };

  const handleComplete = () => {
    localStorage.setItem('eras-onboarding-completed', 'true');
    setIsVisible(false);
    onComplete();
  };

  const progress = ((currentSlide + 1) / tutorialSlides.length) * 100;
  const slide = tutorialSlides[currentSlide];

  if (!isVisible || !isMounted) return null;

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  // Tutorial Content
  const TutorialContent = () => (
    <div 
      className="relative flex flex-col overflow-hidden"
      style={{
        width: '100%',
        height: '100%',
        minHeight: isMobile ? '100dvh' : 'auto',
        backgroundColor: isMobile ? '#0f172a' : '', // SOLID slate-900 for mobile ONLY
      }}
    >
      {/* Close Button */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="rounded-full w-10 h-10 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 shadow-lg"
          aria-label="Close tutorial"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Header */}
      <div 
        className="flex-shrink-0 pt-8 pb-4 px-6 text-center border-b border-purple-200 dark:border-purple-800"
        style={isMobile ? { backgroundColor: '#1e1b4b' } : {}}
      >
        <div className="flex justify-center mb-3">
          <MomentPrismLogo size={60} showSubtitle={false} />
        </div>
        <h2 className="text-sm uppercase tracking-wider text-purple-700 dark:text-purple-300 mb-2 font-medium">
          Eras Tutorial
        </h2>
        
        {/* Progress Bar */}
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between text-xs text-purple-700 dark:text-purple-300 mb-2">
            <span>{currentSlide + 1} / {tutorialSlides.length}</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress 
            value={progress} 
            className="h-2 bg-purple-200/60 dark:bg-purple-900"
          />
        </div>
      </div>

      {/* Slide Content */}
      <div 
        className="flex-1 overflow-y-auto relative px-6 sm:px-12 py-8"
        style={isMobile ? { backgroundColor: '#0f172a' } : {}}
      >
        {/* Background Color - HIDDEN ON MOBILE */}
        {!isMobile && (
          <div 
            className={`absolute inset-0 ${slide.bgColor} transition-all duration-700`}
            style={{ zIndex: 0 }}
          />
        )}
        
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="relative z-10 flex flex-col items-center justify-center min-h-full py-8"
          >
            {/* Emoji Icon */}
            <div className="mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 15,
                  delay: 0.1
                }}
                className={`w-28 h-28 rounded-3xl ${slide.accentColor} flex items-center justify-center shadow-2xl`}
              >
                <span style={{ fontSize: '64px', lineHeight: 1 }}>
                  {slide.emoji}
                </span>
              </motion.div>
            </div>

            {/* Title */}
            <motion.h3 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl sm:text-3xl font-bold text-center mb-4 text-slate-900 dark:text-slate-100"
            >
              {slide.title}
            </motion.h3>

            {/* Description */}
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center text-slate-600 dark:text-slate-400 mb-8 max-w-xl leading-relaxed"
            >
              {slide.description}
            </motion.p>

            {/* Highlights */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="w-full max-w-2xl"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {slide.highlights.map((highlight, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 + (index * 0.05) }}
                    className="flex items-center gap-3 rounded-xl p-4 shadow-lg"
                    style={isMobile ? { backgroundColor: '#1e293b' } : {}}
                  >
                    <div className={`w-2 h-2 rounded-full ${slide.accentColor} flex-shrink-0`} />
                    <span className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
                      {highlight}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Footer */}
      <div 
        className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700"
        style={isMobile ? { backgroundColor: '#0f172a' } : {}}
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4 max-w-2xl mx-auto">
            {/* Back Button */}
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentSlide === 0}
              className="min-w-[100px] min-h-[48px] disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            {/* Slide Indicators */}
            <div className="flex items-center gap-2">
              {tutorialSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setDirection(index > currentSlide ? 1 : -1);
                    setCurrentSlide(index);
                  }}
                  className={`transition-all duration-300 rounded-full ${
                    index === currentSlide
                      ? `w-8 h-2 ${slide.accentColor}`
                      : 'w-2 h-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Next/Finish Button */}
            <Button
              onClick={handleNext}
              className={`min-w-[100px] min-h-[48px] ${slide.accentColor} hover:opacity-90 text-white font-medium`}
            >
              {currentSlide === tutorialSlides.length - 1 ? (
                <>
                  Get Started
                  <Sparkles className="w-4 h-4 ml-1" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Mobile: Custom fullscreen portal
  if (isMobile) {
    return createPortal(
      <div 
        className="tutorial-mobile-fullscreen"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          height: '100dvh',
          backgroundColor: '#000000',
          zIndex: 2147483647,
          overflow: 'hidden',
        }}
      >
        {/* Dark Overlay */}
        <div 
          className="tutorial-mobile-overlay" 
          onClick={handleClose}
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#000000',
            zIndex: 1,
          }}
        />
        
        {/* Content */}
        <div 
          className="relative z-10 w-full h-full"
          style={{
            position: 'relative',
            zIndex: 10,
            width: '100%',
            height: '100%',
            backgroundColor: '#0f172a',
          }}
        >
          <TutorialContent />
        </div>
      </div>,
      document.body
    );
  }

  // Desktop: Dialog component
  return (
    <Dialog open={isVisible} onOpenChange={(open) => {
      if (!open) {
        handleClose();
      }
    }}>
      <DialogContent 
        className="max-w-3xl w-[calc(100vw-2rem)] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden"
        aria-describedby="tutorial-description"
      >
        <div id="tutorial-description" className="sr-only">
          Interactive tutorial showing you how to use Eras to create time capsules
        </div>
        <TutorialContent />
      </DialogContent>
    </Dialog>
  );
}