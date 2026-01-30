import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Video, Mic, ChevronRight, Sparkles, Home, Film } from 'lucide-react';
import { Button } from '../../ui/button';
import { OnboardingModuleProps } from '../../../utils/onboarding/registry';
import { MomentPrismLogo } from '../../MomentPrismLogo';
import { logger } from '../../../utils/logger';

// Theme definitions (tutorial only - doesn't affect app)
const THEMES = [
  { 
    id: 'champagne', 
    name: 'Golden Hour', 
    icon: '🍾', 
    color: '#FFD700',
    gradient: 'from-amber-500/20 via-yellow-500/10 to-transparent'
  },
  { 
    id: 'aurora', 
    name: 'Birthday', 
    icon: '🎂', 
    color: '#8B5CF6',
    gradient: 'from-purple-500/20 via-teal-500/10 to-green-500/10'
  },
  { 
    id: 'retro', 
    name: 'Voyage', 
    icon: '✈️', 
    color: '#FF6B35',
    gradient: 'from-orange-500/20 via-amber-600/10 to-transparent'
  }
];

export default function FirstCapsule({ onComplete, onSkip }: OnboardingModuleProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const totalSteps = 6;

  // Safe area handling for mobile
  useEffect(() => {
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
  }, []);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // This will be called from CompletionScreen if user chooses "Finish"
      logger.info('First Capsule: Onboarding completed');
      onComplete();
    }
  };

  const handleThemeSelect = (theme: typeof THEMES[0]) => {
    setSelectedTheme(theme);
    setTimeout(() => handleNext(), 400);
  };

  return (
    <div 
      className="relative w-full h-full min-h-screen bg-black text-white overflow-hidden flex flex-col"
      style={{
        paddingTop: 'max(24px, env(safe-area-inset-top))',
        paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
        paddingLeft: 'max(16px, env(safe-area-inset-left))',
        paddingRight: 'max(16px, env(safe-area-inset-right))',
      }}
    >
      {/* Close Button */}
      <button
        onClick={onSkip}
        className="absolute top-4 right-4 z-50 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        style={{ top: 'max(16px, env(safe-area-inset-top))' }}
        aria-label="Skip onboarding"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Progress Indicator */}
      {currentStep > 0 && currentStep < totalSteps - 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex gap-2">
          {Array.from({ length: totalSteps - 2 }).map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === currentStep - 1 ? 'w-8 bg-white' : 'w-2 bg-white/30'
              }`}
            />
          ))}
        </div>
      )}

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {currentStep === 0 && (
          <IntroScreen key="intro" onNext={handleNext} />
        )}
        
        {currentStep === 1 && (
          <ThemeScreen 
            key="theme" 
            themes={THEMES}
            selected={selectedTheme}
            onSelect={handleThemeSelect}
          />
        )}
        
        {currentStep === 2 && (
          <CreateScreen 
            key="create" 
            theme={selectedTheme}
            title={title}
            message={message}
            onTitleChange={setTitle}
            onMessageChange={setMessage}
            onNext={handleNext}
          />
        )}
        
        {currentStep === 3 && (
          <MediaScreen 
            key="media" 
            theme={selectedTheme}
            onNext={handleNext}
          />
        )}
        
        {currentStep === 4 && (
          <ScheduleScreen 
            key="schedule" 
            theme={selectedTheme}
            onNext={handleNext}
          />
        )}

        {currentStep === 5 && (
          <CompletionScreen 
            key="completion" 
            onComplete={onComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// STEP 1: INTRO WITH GHOSTED HAND (7-8s)
// ============================================================================
function IntroScreen({ onNext }: { onNext: () => void }) {
  const [handPosition, setHandPosition] = useState({ x: 0, y: 0 }); // Pixel positions
  const [tapCount, setTapCount] = useState(0);
  const [showButton, setShowButton] = useState(false);
  const [handOpacity, setHandOpacity] = useState(0);

  useEffect(() => {
    // Show "Got it" button at same time as second tap
    setTimeout(() => setShowButton(true), 4800);

    // Hand animation timeline
    const startTime = Date.now();
    const animationDuration = 2800; // 2.8 seconds for smooth, gradual movement
    
    // Calculate exact Compose button position
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // CRITICAL: Get actual button element position for pixel-perfect targeting
    // Fallback to calculation if DOM not ready yet
    let targetX, targetY;
    
    // Try to get actual DOM element position
    setTimeout(() => {
      const buttons = document.querySelectorAll('.fixed.top-16 button');
      if (buttons.length >= 2) {
        const composeButton = buttons[1]; // Second button (Compose)
        const rect = composeButton.getBoundingClientRect();
        const emojiDiv = composeButton.querySelector('div');
        const emojiRect = emojiDiv?.getBoundingClientRect();
        
        // Target the center of the emoji - ADD OFFSET to move hand DOWN
        targetX = emojiRect ? emojiRect.left + emojiRect.width / 2 : rect.left + rect.width / 2;
        targetY = emojiRect ? emojiRect.top + emojiRect.height / 2 + 100 : rect.top + rect.height / 2 + 100; // +100px to move DOWN
        
        console.log('🎯 Using DOM-measured Compose button position:', { targetX, targetY });
      }
    }, 100);
    
    // Fallback calculation
    const containerMaxWidth = Math.min(768, viewportWidth - 32); // max-w-3xl with px-4 padding (16px each side)
    const containerLeft = (viewportWidth - containerMaxWidth) / 2;
    
    // Each button: min-w-[85px] with px-4 (16px each side) = 85px + 32px = 117px total
    // Justify-evenly distributes remaining space
    const buttonWidth = 85 + 32; // min-w + horizontal padding
    const totalButtonsWidth = buttonWidth * 4;
    const remainingSpace = containerMaxWidth - totalButtonsWidth;
    const gapSize = remainingSpace / 5; // 5 gaps (before, between, after)
    
    // Compose is 2nd button: left edge + 1 gap + 1 button + 1 gap + half button width
    const composeLeft = containerLeft + gapSize + buttonWidth + gapSize + (buttonWidth / 2);
    targetX = targetX || composeLeft;
    
    // Vertical: Fixed top (64px) + py-3 (12px) + emoji text-5xl height (~48px) + offset = ~240px
    targetY = targetY || 240;
    
    // Start position: bottom center
    const startX = viewportWidth * 0.5;
    const startY = viewportHeight + 100; // Off screen bottom

    // Fade in and move up with smooth calculation
    const moveInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      // Smoother easing - ease-in-out quad
      const easeProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      if (progress < 1) {
        // Simple linear interpolation in pixels
        const currentX = startX + ((targetX || composeLeft) - startX) * easeProgress;
        const currentY = startY + ((targetY || 108) - startY) * easeProgress;
        
        setHandPosition({ x: currentX, y: currentY });
        setHandOpacity(Math.min(progress * 2, 1)); // Fade in quickly
      } else {
        // Reached target - settle exactly on Compose button
        setHandPosition({ x: targetX || composeLeft, y: targetY || 108 });
        setHandOpacity(1);
        clearInterval(moveInterval);
      }
    }, 16); // ~60fps

    // Tap sequence: 2 taps only
    const tapSequence = [
      3200,  // First tap after hand settles
      4800,  // Second tap (1.6s later) - same time as "Got it!" button
    ];

    const timeouts = tapSequence.map((delay, i) => 
      setTimeout(() => setTapCount(i + 1), delay)
    );

    return () => {
      clearInterval(moveInterval);
      timeouts.forEach(clearTimeout);
    };
  }, []);

  // Calculate if currently tapping (only 2 taps now)
  const isTapping = tapCount > 0 && tapCount <= 2;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center px-6 text-center relative"
    >
      {/* Four-Button Menu ABOVE (colored emojis) - BIGGER */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="fixed top-16 left-0 right-0 z-40"
        style={{ top: 'max(64px, env(safe-area-inset-top) + 44px)' }}
      >
        <div className="flex items-stretch justify-evenly max-w-3xl mx-auto px-4">
          {/* Home */}
          <button className="flex flex-col items-center justify-start gap-2 py-3 px-4 min-w-[85px]">
            <div className="text-5xl leading-none">🏡</div>
            <span className="text-sm text-slate-400 font-semibold whitespace-nowrap">Home</span>
          </button>

          {/* Compose (highlighted) */}
          <button className="flex flex-col items-center justify-start gap-2 py-3 px-4 min-w-[85px] relative">
            <div className="text-5xl leading-none">✨</div>
            <span className="text-sm text-emerald-400 font-bold whitespace-nowrap">Compose</span>
            {/* Subtle pulse glow */}
            <motion.div
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [0.95, 1.05, 0.95]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-xl -z-10"
            />
          </button>

          {/* Capture */}
          <button className="flex flex-col items-center justify-start gap-2 py-3 px-4 min-w-[85px]">
            <div className="text-5xl leading-none">📸</div>
            <span className="text-sm text-amber-400 font-semibold whitespace-nowrap">Capture</span>
          </button>

          {/* Vault */}
          <button className="flex flex-col items-center justify-start gap-2 py-3 px-4 min-w-[85px]">
            <div className="text-5xl leading-none">🏛️</div>
            <span className="text-sm text-purple-400 font-semibold whitespace-nowrap">Vault</span>
          </button>
        </div>
      </motion.div>

      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mb-8 mt-32"
      >
        <MomentPrismLogo size={80} showSubtitle={false} />
      </motion.div>
      
      {/* Title */}
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-2xl sm:text-3xl font-bold mb-3"
      >
        Let's create your first capsule
      </motion.h1>
      
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-base text-white/60 max-w-sm"
      >
        Tap the Compose button to begin
      </motion.p>

      {/* Ghosted Hand - Moves UP with manual pixel-perfect animation */}
      <div
        className="fixed text-7xl pointer-events-none z-50"
        style={{ 
          left: `${handPosition.x}px`,
          top: `${handPosition.y}px`,
          transform: `translate(-50%, -50%) scale(${isTapping ? 0.85 : 1}) rotate(${isTapping ? -8 : 0}deg)`,
          opacity: handOpacity,
          filter: 'drop-shadow(0 8px 32px rgba(168, 85, 247, 0.8))',
          transformOrigin: 'center center',
          transition: isTapping ? 'transform 0.8s cubic-bezier(0.32, 0.72, 0, 1)' : 'none'
        }}
      >
        👆

        {/* Tap emphasis glow */}
        {isTapping && (
          <motion.div
            key={tapCount}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 2.5, 3.5],
              opacity: [0.9, 0.5, 0]
            }}
            transition={{ duration: 0.9 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-purple-400/50 blur-2xl"
            style={{ pointerEvents: 'none' }}
          />
        )}
      </div>

      {/* Got it button */}
      {showButton && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-16 z-50"
        >
          <Button
            onClick={onNext}
            size="lg"
            className="min-h-[56px] px-8 text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            Got it!
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================================================
// STEP 2: THEME SELECTION (8-10s)
// ============================================================================
function ThemeScreen({ themes, selected, onSelect }: { 
  themes: typeof THEMES;
  selected: typeof THEMES[0];
  onSelect: (theme: typeof THEMES[0]) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="flex-1 flex flex-col items-center justify-center px-6"
    >
      <motion.h2
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-2xl sm:text-3xl font-bold mb-6 text-center"
      >
        Pick a themed capsule opening celebration!
      </motion.h2>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">{themes.map((theme, i) => (
          <motion.button
            key={theme.id}
            initial={{ scale: 0, opacity: 0, rotateY: -90 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{ 
              delay: 0.3 + i * 0.1,
              type: 'spring',
              stiffness: 200,
              damping: 20
            }}
            onClick={() => onSelect(theme)}
            className={`flex-1 flex flex-col items-center gap-2 sm:gap-3 p-5 sm:p-8 rounded-3xl transition-all duration-300 ${
              selected.id === theme.id
                ? 'bg-white/20 border-2 border-white scale-105 shadow-2xl'
                : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-102'
            }`}
          >
            <span className="text-4xl sm:text-6xl mb-1 sm:mb-2">{theme.icon}</span>
            <span className="text-base sm:text-lg font-semibold">{theme.name}</span>
            
            {/* Preview gradient */}
            <div 
              className={`w-full h-2 rounded-full bg-gradient-to-r ${theme.gradient} mt-1 sm:mt-2`}
            />
          </motion.button>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-white/30 text-sm mt-8"
      >
        You can change this anytime
      </motion.p>
    </motion.div>
  );
}

// ============================================================================
// STEP 3: TITLE + MESSAGE WITH THEME EFFECTS (12s)
// ============================================================================
function CreateScreen({ theme, title, message, onTitleChange, onMessageChange, onNext }: { 
  theme: typeof THEMES[0];
  title: string;
  message: string;
  onTitleChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="flex-1 flex flex-col items-center justify-center px-6 relative"
    >
      {/* Theme Background Effects */}
      <ThemeBackground theme={theme} />

      <motion.h2
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-2xl sm:text-3xl font-bold mb-2 text-center relative z-10"
      >
        Create your capsule
      </motion.h2>
      
      <motion.p
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-white/60 mb-8 text-center relative z-10"
      >
        What message will you send to the future?
      </motion.p>

      <div className="w-full max-w-md space-y-4 relative z-10">
        {/* Title Input */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <label className="block text-sm text-white/60 mb-2 ml-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="My First Memory"
            className="w-full px-6 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
          />
        </motion.div>

        {/* Message Input */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <label className="block text-sm text-white/60 mb-2 ml-1">Message</label>
          <textarea
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="Dear future me..."
            rows={4}
            className="w-full px-6 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none transition-all"
          />
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={onNext}
            size="lg"
            className="w-full min-h-[56px] text-lg font-semibold bg-white/20 hover:bg-white/30 border border-white/30"
          >
            Continue
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-white/30 text-sm mt-6 relative z-10"
      >
        This is just practice - nothing will be saved
      </motion.p>
    </motion.div>
  );
}

// ============================================================================
// STEP 4: MEDIA AWARENESS WITH THEME EFFECTS (6-8s)
// ============================================================================
function MediaScreen({ theme, onNext }: { 
  theme: typeof THEMES[0];
  onNext: () => void;
}) {
  const mediaTypes = [
    { icon: Camera, label: 'Photos', desc: 'Capture moments' },
    { icon: Video, label: 'Videos', desc: 'Record memories' },
    { icon: Mic, label: 'Voice Notes', desc: 'Share your voice' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="flex-1 flex flex-col items-center justify-center px-6 relative"
    >
      {/* Theme Background Effects */}
      <ThemeBackground theme={theme} />

      <motion.h2
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-2xl sm:text-3xl font-bold mb-2 text-center relative z-10"
      >
        Attach memories
      </motion.h2>
      
      <motion.p
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-white/60 mb-10 text-center relative z-10"
      >
        Add these when creating real capsules
      </motion.p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-2xl relative z-10">
        {mediaTypes.map((media, i) => (
          <motion.button
            key={media.label}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              delay: 0.3 + i * 0.15,
              type: 'spring',
              stiffness: 200,
              damping: 15
            }}
            onClick={onNext}
            onTouchEnd={onNext}
            className="flex flex-col items-center gap-2 sm:gap-3 p-5 sm:p-8 rounded-3xl bg-white/10 border border-white/20 hover:bg-white/20 active:bg-white/30 active:scale-95 hover:scale-105 hover:border-white/40 transition-all duration-300 cursor-pointer touch-manipulation"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/10 flex items-center justify-center pointer-events-none">
              <media.icon className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <span className="text-base sm:text-lg font-semibold pointer-events-none">{media.label}</span>
            <span className="text-xs sm:text-sm text-white/50 pointer-events-none">{media.desc}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================================
// STEP 5: SCHEDULE WITH THEME EFFECTS (10s)
// ============================================================================
function ScheduleScreen({ theme, onNext }: { 
  theme: typeof THEMES[0];
  onNext: () => void;
}) {
  const [selected, setSelected] = useState('1week');

  const timeOptions = [
    { id: '1week', label: '1 Week', icon: '📅' },
    { id: '1month', label: '1 Month', icon: '🗓️' },
    { id: '1year', label: '1 Year', icon: '⏳' }
  ];

  const handleSelect = (id: string) => {
    setSelected(id);
    setTimeout(() => onNext(), 400);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="flex-1 flex flex-col items-center justify-center px-6 relative"
    >
      {/* Theme Background Effects */}
      <ThemeBackground theme={theme} />

      <motion.h2
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-2xl sm:text-3xl font-bold mb-2 text-center relative z-10"
      >
        When should this open?
      </motion.h2>
      
      <motion.p
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-white/60 mb-10 text-center relative z-10"
      >
        Choose when to unlock your memory
      </motion.p>

      <div className="flex flex-col gap-4 w-full max-w-md relative z-10">
        {timeOptions.map((option, i) => (
          <motion.button
            key={option.id}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            onClick={() => handleSelect(option.id)}
            className={`flex items-center gap-4 p-6 rounded-2xl transition-all duration-300 ${
              selected === option.id
                ? 'bg-white/20 border-2 border-white scale-105'
                : 'bg-white/10 border border-white/20 hover:bg-white/15'
            }`}
          >
            <span className="text-3xl">{option.icon}</span>
            <span className="text-xl font-semibold">{option.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================================================
// STEP 6: COMPLETION SCREEN WITH VAULT MASTERY OPTION
// ============================================================================
function CompletionScreen({ onComplete }: { onComplete: () => void }) {
  const [continueToVault, setContinueToVault] = useState(false);

  const handleContinue = () => {
    setContinueToVault(true);
    // Signal to start Vault Mastery module (which will defer achievements)
    setTimeout(() => {
      // Store flag to defer achievements until after Vault Mastery
      localStorage.setItem('eras_defer_first_capsule_achievements', 'true');
      // Navigate to Vault Mastery
      window.dispatchEvent(new CustomEvent('start-vault-mastery'));
    }, 300);
  };

  const handleFinish = () => {
    onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex-1 flex flex-col items-center justify-center px-6 relative"
    >
      {/* Celebration confetti effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-10%',
              backgroundColor: ['#FFD700', '#A855F7', '#10B981', '#F59E0B'][i % 4]
            }}
            animate={{
              y: [0, window.innerHeight + 100],
              x: [0, (Math.random() - 0.5) * 200],
              rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
              opacity: [0, 1, 0.8, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.05,
              ease: 'easeOut'
            }}
          />
        ))}
      </div>

      {/* Success Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          delay: 0.2,
          type: 'spring',
          stiffness: 200,
          damping: 15
        }}
        className="mb-8 text-8xl"
      >
        🎉
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-3xl sm:text-4xl font-bold mb-3 text-center relative z-10"
      >
        Great job!
      </motion.h2>
      
      <motion.p
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-lg text-white/70 mb-12 text-center max-w-md relative z-10"
      >
        You've learned the basics of creating capsules
      </motion.p>

      {/* Options */}
      <div className="flex flex-col gap-4 w-full max-w-md relative z-10">
        {/* Continue to Vault Mastery */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <Button
            onClick={handleContinue}
            size="lg"
            disabled={continueToVault}
            className="w-full min-h-[64px] text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-2 border-purple-400/50 relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              <span>Continue Learning</span>
              <span className="text-2xl">🔐</span>
            </span>
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ['-100%', '100%']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          </Button>
          <p className="text-sm text-white/50 mt-2 text-center">
            Learn how to manage and access your vault
          </p>
        </motion.div>

        {/* Finish */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <Button
            onClick={handleFinish}
            size="lg"
            variant="outline"
            className="w-full min-h-[56px] text-lg font-semibold bg-white/10 hover:bg-white/20 border border-white/30"
          >
            Finish for now
          </Button>
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-white/40 text-sm mt-8 relative z-10 text-center"
      >
        You can access tutorials anytime from settings
      </motion.p>
    </motion.div>
  );
}

// ============================================================================
// THEME BACKGROUND COMPONENT
// ============================================================================
function ThemeBackground({ theme }: { theme: typeof THEMES[0] }) {
  return (
    <>
      {/* Gradient Overlay */}
      <div 
        className={`absolute inset-0 bg-gradient-to-b ${theme.gradient} pointer-events-none`}
      />

      {/* Champagne Bubbles */}
      {theme.id === 'champagne' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-yellow-300/40"
              style={{
                left: `${(i * 17) % 100}%`,
                bottom: '-10%'
              }}
              animate={{
                y: [0, -800],
                x: [0, Math.sin(i) * 30],
                opacity: [0, 0.6, 0]
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                repeat: Infinity,
                delay: i * 0.3,
                ease: 'easeOut'
              }}
            />
          ))}
        </div>
      )}

      {/* Aurora Flow */}
      {theme.id === 'aurora' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-teal-500/20 to-green-500/20"
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut'
            }}
            style={{ backgroundSize: '200% 200%' }}
          />
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-purple-300/60"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
              animate={{
                scale: [0, 1.5, 0],
                opacity: [0, 0.8, 0]
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.1
              }}
            />
          ))}
        </div>
      )}

      {/* Retro Film Grain */}
      {theme.id === 'retro' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
              backgroundRepeat: 'repeat',
              backgroundSize: '100px 100px'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-amber-600/5 to-transparent" />
        </div>
      )}
    </>
  );
}