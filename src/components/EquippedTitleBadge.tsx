import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Crown, Star, Zap } from 'lucide-react';

interface EquippedTitleBadgeProps {
  title: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  isNew?: boolean; // Whether this title was just equipped (triggers entrance animation)
}

/**
 * 🌟 Equipped Title Badge - Appears under username
 * 
 * ERAS CELESTIAL DESIGN - Rarity-Based Styling
 * 
 * Features:
 * - Rarity-specific typography and styling
 * - Entrance animations on equip (scaled by rarity)
 * - Ambient glow effects
 * - Responsive sizing (desktop/mobile)
 * - Subtle hover effects (desktop only)
 * - Accessibility compliant (4.5:1 contrast)
 */
export function EquippedTitleBadge({ title, rarity, isNew = false }: EquippedTitleBadgeProps) {
  const [hasAnimated, setHasAnimated] = useState(!isNew);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
  }, []);

  useEffect(() => {
    if (isNew && !hasAnimated) {
      // Mark as animated after entrance completes
      const duration = rarityConfig[rarity].entranceDuration * 1000;
      setTimeout(() => setHasAnimated(true), duration);
    }
  }, [isNew, hasAnimated, rarity]);

  // Rarity-based configuration
  const rarityConfig = {
    common: {
      fontFamily: 'Inter, sans-serif',
      fontWeight: '500',
      textTransform: 'capitalize' as const,
      color: '#E5E7EB',
      glow: 'rgba(255, 255, 255, 0.3)',
      glowSize: '0 0 8px',
      icon: Sparkles,
      iconColor: '#9CA3AF',
      entranceDuration: 0.8,
      textShadow: '0 1px 3px rgba(0, 0, 0, 0.6), 0 0 10px rgba(255, 255, 255, 0.2)'
    },
    uncommon: {
      fontFamily: 'Poppins, sans-serif',
      fontWeight: '600',
      textTransform: 'capitalize' as const,
      color: 'transparent',
      gradient: 'linear-gradient(135deg, #4DD4A3 0%, #3ECFA0 50%, #6FE0B7 100%)',
      glow: 'rgba(77, 212, 163, 0.4)',
      glowSize: '0 0 12px',
      icon: Crown,
      iconColor: '#4DD4A3',
      entranceDuration: 1.0,
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.6), 0 0 15px rgba(77, 212, 163, 0.5)'
    },
    rare: {
      fontFamily: 'Playfair Display, serif',
      fontWeight: '600',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      fontSize: '0.95em',
      color: 'transparent',
      gradient: 'linear-gradient(135deg, #B084F4 0%, #9B6CFF 50%, #C9A8FF 100%)',
      glow: 'rgba(176, 132, 244, 0.5)',
      glowSize: '0 0 16px',
      icon: Star,
      iconColor: '#B084F4',
      entranceDuration: 1.4,
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.7), 0 0 20px rgba(176, 132, 244, 0.6), 0 0 30px rgba(176, 132, 244, 0.3)'
    },
    epic: {
      fontFamily: 'Cinzel, serif',
      fontWeight: '700',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.08em',
      fontSize: '0.9em',
      color: 'transparent',
      gradient: 'linear-gradient(135deg, #FFD44D 0%, #FFBF3F 30%, #FFE07C 70%, #FFD44D 100%)',
      glow: 'rgba(255, 212, 77, 0.6)',
      glowSize: '0 0 20px',
      icon: Zap,
      iconColor: '#FFD44D',
      entranceDuration: 1.8,
      textShadow: '0 2px 6px rgba(0, 0, 0, 0.7), 0 0 25px rgba(255, 212, 77, 0.7), 0 0 40px rgba(255, 212, 77, 0.4)',
      shimmer: true
    },
    legendary: {
      fontFamily: 'Playfair Display, serif',
      fontWeight: '700',
      fontStyle: 'italic' as const,
      textTransform: 'none' as const,
      letterSpacing: '0.02em',
      color: 'transparent',
      gradient: 'linear-gradient(135deg, #FF8E4D 0%, #FF4DD8 25%, #4DFFEA 50%, #FFD44D 75%, #FF8E4D 100%)',
      glow: 'rgba(255, 77, 216, 0.7)',
      glowSize: '0 0 25px',
      icon: Crown,
      iconColor: '#FF4DD8',
      entranceDuration: 2.2,
      textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 142, 77, 0.8), 0 0 50px rgba(255, 77, 216, 0.6)',
      shimmer: true,
      animate: true
    }
  };

  const config = rarityConfig[rarity];
  const IconComponent = config.icon;

  // Entrance animation variants based on rarity
  const getEntranceAnimation = () => {
    if (prefersReducedMotion || !isNew || hasAnimated) {
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 }
      };
    }

    const erasCubicBezier = [0.25, 1, 0.5, 1];

    switch (rarity) {
      case 'common':
        // Fade-in up from opacity 0 → 100%
        return {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { 
            duration: config.entranceDuration,
            ease: erasCubicBezier
          }
        };
      
      case 'uncommon':
        // Slide in from right + soft glow bloom
        return {
          initial: { opacity: 0, x: 20, scale: 0.95 },
          animate: { opacity: 1, x: 0, scale: 1 },
          transition: {
            duration: config.entranceDuration,
            ease: erasCubicBezier
          }
        };
      
      case 'rare':
        // Letter-by-letter reveal effect (simulated with opacity + blur)
        return {
          initial: { opacity: 0, filter: 'blur(4px)' },
          animate: { opacity: 1, filter: 'blur(0px)' },
          transition: {
            duration: config.entranceDuration,
            ease: 'easeOut'
          }
        };
      
      case 'epic':
        // Radial burst → text emerges from light center
        return {
          initial: { opacity: 0, scale: 0.5, filter: 'brightness(2)' },
          animate: { opacity: 1, scale: 1, filter: 'brightness(1)' },
          transition: {
            duration: config.entranceDuration,
            ease: erasCubicBezier
          }
        };
      
      case 'legendary':
        // Orbit reveal (letters rotate in arc) + spectrum wave
        return {
          initial: { opacity: 0, scale: 0.6, rotate: -15 },
          animate: { 
            opacity: 1, 
            scale: [0.6, 1.1, 1], 
            rotate: 0
          },
          transition: {
            duration: config.entranceDuration,
            times: [0, 0.6, 1],
            ease: erasCubicBezier
          }
        };
      
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.8 }
        };
    }
  };

  const animation = getEntranceAnimation();

  return (
    <motion.div
      {...animation}
      className="flex items-center gap-2 justify-center md:justify-start mt-1 md:mt-1.5"
      style={{
        marginRight: '24px',
        paddingRight: '8px'
      }}
    >
      {/* Rarity indicator icon */}
      <motion.div
        initial={isNew && !prefersReducedMotion ? { scale: 0, rotate: -180 } : { scale: 1 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          delay: isNew && !prefersReducedMotion ? config.entranceDuration * 0.6 : 0,
          duration: 0.4,
          ease: [0.34, 1.56, 0.64, 1]
        }}
      >
        <IconComponent 
          className="w-3.5 h-3.5 md:w-4 md:h-4" 
          style={{
            color: config.iconColor,
            filter: `drop-shadow(0 0 6px ${config.glow})`
          }}
        />
      </motion.div>

      {/* Title text */}
      <motion.div
        className="relative"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <span
          className="text-sm md:text-base"
          style={{
            fontFamily: config.fontFamily,
            fontWeight: config.fontWeight,
            fontStyle: config.fontStyle,
            textTransform: config.textTransform,
            letterSpacing: config.letterSpacing,
            fontSize: config.fontSize,
            color: config.gradient ? 'transparent' : config.color,
            backgroundImage: config.gradient,
            backgroundClip: config.gradient ? 'text' : undefined,
            WebkitBackgroundClip: config.gradient ? 'text' : undefined,
            textShadow: config.textShadow,
            filter: `drop-shadow(${config.glowSize} ${config.glow})`
          }}
        >
          {title}
        </span>

        {/* Shimmer effect for Epic/Legendary */}
        {config.shimmer && !prefersReducedMotion && hasAnimated && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear'
            }}
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              mixBlendMode: 'overlay'
            }}
          />
        )}

        {/* Legendary: Spectrum sweep animation */}
        {config.animate && !prefersReducedMotion && hasAnimated && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              backgroundPosition: ['0% 50%', '200% 50%']
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'linear'
            }}
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 142, 77, 0.3) 20%, rgba(255, 77, 216, 0.3) 40%, rgba(77, 255, 234, 0.3) 60%, rgba(255, 212, 77, 0.3) 80%, transparent 100%)',
              backgroundSize: '200% 100%',
              mixBlendMode: 'screen',
              opacity: 0.6
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}
