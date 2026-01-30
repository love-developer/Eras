import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from './ui/use-mobile';

// Template data with enhanced visual design
const TEMPLATES = [
  {
    id: 'birthday',
    emoji: '🎂',
    title: 'Birthday',
    subtitle: 'Happy Future Birthday!',
    message: 'Dear future me,\n\nAnother year has passed! I hope you\'re celebrating this birthday with joy and surrounded by the people you love. Here\'s what I want you to remember from this year...',
    gradientFrom: '#ec4899',
    gradientTo: '#a855f7',
    glowColor: 'rgba(236, 72, 153, 0.6)',
  },
  {
    id: 'goals',
    emoji: '🎯',
    title: 'Goals',
    subtitle: 'Check-in: Did I Achieve My Dreams?',
    message: 'Hey future me!\n\nToday I\'m setting some goals for us. I hope by the time you read this, you\'ve accomplished amazing things. Here\'s what I\'m working toward...',
    gradientFrom: '#06b6d4',
    gradientTo: '#3b82f6',
    glowColor: 'rgba(6, 182, 212, 0.6)',
  },
  {
    id: 'gratitude',
    emoji: '🙏',
    title: 'Gratitude',
    subtitle: 'Things I\'m Grateful For Today',
    message: 'Dear future self,\n\nI wanted to capture this moment of gratitude. Today I\'m thankful for so many things in my life. I hope when you read this, you\'ll remember to appreciate...',
    gradientFrom: '#f59e0b',
    gradientTo: '#eab308',
    glowColor: 'rgba(245, 158, 11, 0.6)',
  },
  {
    id: 'love',
    emoji: '💕',
    title: 'Love Note',
    subtitle: 'A Message From the Heart',
    message: 'My dearest,\n\nI wanted to send you this message through time to remind you how much you mean to me. No matter what changes, my love for you remains constant...',
    gradientFrom: '#f43f5e',
    gradientTo: '#fb7185',
    glowColor: 'rgba(244, 63, 94, 0.6)',
  },
  {
    id: 'memories',
    emoji: '📸',
    title: 'Memories',
    subtitle: 'Capturing Today\'s Memories',
    message: 'Future me,\n\nI\'m preserving this moment in time for you to rediscover. Today was special because... Here are the memories I want you to revisit...',
    gradientFrom: '#1e3a8a',
    gradientTo: '#7c3aed',
    glowColor: 'rgba(124, 58, 237, 0.6)',
  },
  {
    id: 'advice',
    emoji: '💡',
    title: 'Advice',
    subtitle: 'Wisdom From Past Me',
    message: 'Hello future self!\n\nI\'ve learned some important lessons recently that I want to share with you. These insights might help you navigate whatever you\'re facing...',
    gradientFrom: '#0ea5e9',
    gradientTo: '#06b6d4',
    glowColor: 'rgba(14, 165, 233, 0.6)',
  },
  {
    id: 'milestone',
    emoji: '🏆',
    title: 'Milestone',
    subtitle: 'Celebrating an Achievement',
    message: 'Dear future me,\n\nToday I reached an important milestone! I wanted to capture this moment of accomplishment and share the journey that led me here...',
    gradientFrom: '#b45309',
    gradientTo: '#f59e0b',
    glowColor: 'rgba(180, 83, 9, 0.6)',
  },
  {
    id: 'inspire',
    emoji: '🌟',
    title: 'Inspire',
    subtitle: 'You\'ve Got This!',
    message: 'Hey champion!\n\nI know life can be challenging sometimes, so I\'m sending you this message of encouragement from the past. Remember how strong and capable you are...',
    gradientFrom: '#06b6d4',
    gradientTo: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.6)',
  },
  {
    id: 'reflection',
    emoji: '🌙',
    title: 'Reflection',
    subtitle: 'A Moment of Reflection',
    message: 'Dear future self,\n\nToday I\'m taking time to reflect on my journey, my growth, and where I\'m heading. I want to share these thoughts with you so we never forget where we came from...',
    gradientFrom: '#312e81',
    gradientTo: '#4c1d95',
    glowColor: 'rgba(79, 70, 229, 0.6)',
  },
];

interface QuickStartCarouselProps {
  onSelectTemplate: (template: {
    id: string;
    title: string;
    message: string;
    icon: string;
    name: string;
  }) => void;
}

export function QuickStartCarousel({ onSelectTemplate }: QuickStartCarouselProps) {
  const isMobile = useIsMobile();
  const isTablet = !isMobile && typeof window !== 'undefined' && window.innerWidth < 1024;
  
  // Snake-loop setup: Show 3 cards on mobile, 4 on tablet, 4-5 on desktop
  const visibleCards = isMobile ? 3 : isTablet ? 4 : 4.5;
  const gap = 8; // 8px gutter spacing
  
  // Calculate container width percentage for each card based on device
  const cardWidthPercent = isMobile ? 31 : isTablet ? 24 : 20; // 30-32% mobile, 24-26% tablet, 20-22% desktop
  const cardHeight = isMobile ? 115 : isTablet ? 130 : 160; // Height in px
  
  const [currentIndex, setCurrentIndex] = useState(TEMPLATES.length); // Start at first real item
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [containerWidth, setContainerWidth] = useState(0);

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Create snake-loop by cloning first 3 cards at end
  const cloneCount = 3;
  const extendedTemplates = [
    ...TEMPLATES.slice(-cloneCount), // Clone last items to beginning
    ...TEMPLATES,                      // Original items
    ...TEMPLATES.slice(0, cloneCount)  // Clone first items to end
  ];

  // Snake-loop: Seamlessly jump when reaching clones
  useEffect(() => {
    if (!isTransitioning) return;
    
    const timer = setTimeout(() => {
      if (currentIndex >= TEMPLATES.length + cloneCount) {
        // At end clones, jump to real beginning
        setIsTransitioning(false);
        setCurrentIndex(currentIndex - TEMPLATES.length);
      } else if (currentIndex < cloneCount) {
        // At beginning clones, jump to real end
        setIsTransitioning(false);
        setCurrentIndex(currentIndex + TEMPLATES.length);
      }
    }, 400); // Slightly faster than transition

    return () => clearTimeout(timer);
  }, [currentIndex, isTransitioning]);

  // Re-enable transitions after instant jump
  useEffect(() => {
    if (!isTransitioning) {
      const timer = setTimeout(() => setIsTransitioning(true), 20);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  // Navigation with snake-loop
  const navigate = useCallback((direction: 'next' | 'prev') => {
    setIsTransitioning(true);
    setCurrentIndex((prev) => direction === 'next' ? prev + 1 : prev - 1);
  }, []);

  // Handle drag end - MUCH smoother, less aggressive snapping
  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    setIsDragging(false);
    const threshold = 100; // Much higher threshold - requires deliberate swipe
    const velocityThreshold = 1200; // Very high velocity requirement - nearly disabled
    
    // Only snap if user makes a very deliberate swipe
    if (Math.abs(info.velocity.x) > velocityThreshold) {
      if (info.velocity.x > 0) {
        navigate('prev');
      } else {
        navigate('next');
      }
    } else if (info.offset.x > threshold) {
      navigate('prev');
    } else if (info.offset.x < -threshold) {
      navigate('next');
    }
    // Otherwise, spring back to current position (no snap)
  }, [navigate]);

  // Get actual template index
  const getActualIndex = (index: number) => {
    return ((index - cloneCount) % TEMPLATES.length + TEMPLATES.length) % TEMPLATES.length;
  };

  // Calculate which card is at center
  const getCenterCardIndex = () => {
    return currentIndex;
  };

  // Handle template selection
  const handleSelectTemplate = (template: typeof TEMPLATES[0]) => {
    if (isDragging) return;
    onSelectTemplate({
      id: template.id,
      title: template.title,
      message: template.message,
      icon: template.emoji,
      name: template.title,
    });
  };

  const actualCurrentIndex = getActualIndex(currentIndex);
  const centerCardIndex = getCenterCardIndex();
  
  // Calculate card width in pixels
  const cardWidth = (containerWidth * cardWidthPercent) / 100;

  return (
    <div className="relative w-full py-4">
      {/* Header */}
      <div className="text-center mb-5">
        <h3 className="text-lg mb-1 bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 bg-clip-text text-transparent font-bold">
          Quick Start Templates
        </h3>
        <p className="text-xs text-muted-foreground">
          Choose a template to begin your time capsule journey
        </p>
      </div>

      {/* Carousel with Navigation - Flex layout with arrows on far sides */}
      <div className="flex items-center gap-2 w-full">
        {/* Left Arrow - FAR LEFT */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('prev')}
          className={`flex-shrink-0 rounded-full shadow-lg transition-all duration-300 ${
            isMobile 
              ? 'w-8 h-8' 
              : 'w-10 h-10'
          } bg-white dark:bg-white hover:bg-white/90 dark:hover:bg-white/90 border-2 border-black/20 flex items-center justify-center`}
          style={{
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
          }}
          aria-label="Previous template"
        >
          <ChevronLeft className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-black`} strokeWidth={2.5} />
        </motion.button>

        {/* Carousel Container - Takes remaining space */}
        <div className="flex-1 relative">
          <div 
            ref={containerRef}
            className="relative w-full overflow-hidden" 
            style={{ 
              height: `${cardHeight + 16}px`,
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x',
            }}
          >
            {/* Cards scrolling container - snake flow */}
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.3}
              dragTransition={{ 
                bounceStiffness: 300, 
                bounceDamping: 30,
                power: 0.2,
                timeConstant: 300,
              }}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
              animate={{ 
                x: -currentIndex * (cardWidth + gap) + (containerWidth / 2) - (cardWidth / 2)
              }}
              transition={isTransitioning ? { 
                type: 'spring',
                stiffness: 300,
                damping: 40,
                mass: 0.8,
              } : { duration: 0 }}
              className="flex items-center absolute left-0"
              style={{ 
                gap: `${gap}px`,
                cursor: isDragging ? 'grabbing' : 'grab',
                willChange: 'transform',
              }}
            >
              {extendedTemplates.map((template, index) => {
                const distanceFromCenter = Math.abs(index - centerCardIndex);
                const isCenterCard = distanceFromCenter === 0;
                const isNearCenter = distanceFromCenter <= 1;
                
                return (
                  <TemplateCard
                    key={`${template.id}-${index}`}
                    template={template}
                    isCenterCard={isCenterCard}
                    isNearCenter={isNearCenter}
                    distanceFromCenter={distanceFromCenter}
                    isHovered={hoveredCard === `${template.id}-${index}`}
                    onHover={() => setHoveredCard(`${template.id}-${index}`)}
                    onLeave={() => setHoveredCard(null)}
                    onClick={() => handleSelectTemplate(template)}
                    isMobile={isMobile}
                    cardWidth={cardWidth}
                    cardHeight={cardHeight}
                  />
                );
              })}
            </motion.div>
          </div>
        </div>

        {/* Right Arrow - FAR RIGHT */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('next')}
          className={`flex-shrink-0 rounded-full shadow-lg transition-all duration-300 ${
            isMobile 
              ? 'w-8 h-8' 
              : 'w-10 h-10'
          } bg-white dark:bg-white hover:bg-white/90 dark:hover:bg-white/90 border-2 border-black/20 flex items-center justify-center`}
          style={{
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
          }}
          aria-label="Next template"
        >
          <ChevronRight className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-black`} strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: typeof TEMPLATES[0];
  isCenterCard: boolean;
  isNearCenter: boolean;
  distanceFromCenter: number;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
  isMobile: boolean;
  cardWidth: number;
  cardHeight: number;
}

function TemplateCard({
  template,
  isCenterCard,
  isNearCenter,
  distanceFromCenter,
  isHovered,
  onHover,
  onLeave,
  onClick,
  isMobile,
  cardWidth,
  cardHeight,
}: TemplateCardProps) {
  // Optimized scaling: smoother on mobile, no 3D rotation for performance
  const scale = isCenterCard ? 1.05 : isNearCenter ? 1.0 : 0.95;
  const opacity = isCenterCard ? 1 : isNearCenter ? 0.95 : 0.75;
  
  return (
    <motion.div
      whileHover={!isMobile ? { scale: scale + 0.03, y: -6 } : {}}
      whileTap={{ scale: scale - 0.05 }}
      onHoverStart={onHover}
      onHoverEnd={onLeave}
      onClick={onClick}
      className="flex-shrink-0 cursor-pointer rounded-3xl overflow-hidden relative select-none"
      style={{
        width: `${cardWidth}px`,
        height: `${cardHeight}px`,
        background: isMobile 
          ? template.gradientFrom 
          : `linear-gradient(135deg, ${template.gradientFrom} 0%, ${template.gradientTo} 100%)`,
        willChange: 'transform, opacity', // GPU acceleration
      }}
      animate={{
        scale,
        opacity,
        boxShadow: isCenterCard
          ? `0 12px 40px -8px ${template.glowColor}, 0 0 24px -4px ${template.glowColor}, inset 0 0 0 2px rgba(255, 255, 255, 0.3)`
          : isHovered
          ? `0 8px 28px -6px ${template.glowColor}, 0 0 18px -4px ${template.glowColor}`
          : '0 4px 14px -4px rgba(0, 0, 0, 0.2)',
        zIndex: isCenterCard ? 10 : isNearCenter ? 5 : 1,
      }}
      transition={{ 
        duration: isMobile ? 0.25 : 0.35,
        ease: isMobile ? [0.25, 0.1, 0.25, 1] : [0.34, 1.56, 0.64, 1],
      }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/20" />
      
      {/* Center card highlight ring - static on mobile for performance */}
      {isCenterCard && (
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            boxShadow: 'inset 0 0 0 2px rgba(255, 255, 255, 0.5)'
          }}
        />
      )}

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center p-2 text-center z-10">
        {/* Emoji - optimized animation for mobile */}
        <motion.div
          animate={{
            scale: isCenterCard ? 1.1 : 1,
          }}
          transition={{
            duration: 0.3,
            ease: 'easeOut',
          }}
          className={`${isMobile ? 'text-2xl mb-1' : 'text-4xl mb-2'}`}
          style={{ 
            filter: isCenterCard 
              ? 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))' 
              : 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3))',
            willChange: 'transform',
          }}
        >
          {template.emoji}
        </motion.div>

        {/* Title */}
        <h4 
          className={`${isMobile ? 'text-xs' : 'text-sm'} mb-0.5 text-white font-semibold leading-tight`}
          style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)' }}
        >
          {template.title}
        </h4>

        {/* Subtitle - only show on larger cards */}
        {!isMobile && (
          <p 
            className="text-[10px] text-white/95 line-clamp-2 px-1 leading-snug"
            style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.4)' }}
          >
            {template.subtitle}
          </p>
        )}
      </div>

      {/* Trail blur effect - disabled on mobile for performance */}
      {isCenterCard && !isMobile && (
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent, ${template.glowColor}, transparent)`,
            opacity: 0.3,
          }}
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}

      {/* Shimmer on hover - desktop only */}
      <AnimatePresence>
        {isHovered && !isMobile && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            exit={{ x: '200%' }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none"
            style={{ transform: 'skewX(-15deg)' }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}