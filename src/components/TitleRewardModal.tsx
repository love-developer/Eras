import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Share2, Crown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { TitleDisplay } from './TitleDisplay';
import { toast } from 'sonner@2.0.3';

interface TitleRewardModalProps {
  title: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  achievementName: string;
  isOpen: boolean;
  onClose: () => void;
  onViewTitles?: () => void;
}

/**
 * 👑 Title Reward Celebration Modal - ERAS CELESTIAL GEOMETRY SYSTEM
 * 
 * DESIGN PHILOSOPHY:
 * Every title badge represents a moment captured in time.
 * Geometry evokes celestial mechanics — orbits, eclipses, constellations.
 * 
 * GEOMETRIC PRINCIPLES:
 * - Circular foundation (the "Eras orbit")
 * - Celestial motif (cosmic relics, medallions, sigils)
 * - Time & motion cues (arcs, rings, radial divisions)
 * - Light intensity > color for rarity communication
 * - Minimal clutter: one shape, one glow, one essence
 * 
 * GEOMETRY BY RARITY:
 * - Common: Circle (∞ edges) - The seed, simplicity, beginning
 * - Uncommon: Rounded Hexagon (6 edges) - Growth, stability, discovery
 * - Rare: 12-point Star - Radiance, cosmic significance
 * - Epic: Octagon (8 edges) - Mastery, brilliance, legacy
 * - Legendary: Dynamic Eclipse (dual-ring orbit) - Transcendence, timelessness
 * 
 * LIGHT + MATERIAL LAYERS:
 * 1. Core Shape (gradient fill center → edge)
 * 2. Inner Glow (pulsing, screen blend)
 * 3. Halo (atmospheric aura, overlay blend)
 * 4. Specular Spark (reflective spot)
 * 5. Particle Drift Layer (visual motion)
 * 
 * LOGIC UNCHANGED - Only visual geometry and styling updated
 */
export function TitleRewardModal({ 
  title, 
  rarity,
  achievementName,
  isOpen, 
  onClose,
  onViewTitles
}: TitleRewardModalProps) {
  const [animationPhase, setAnimationPhase] = useState<'entry' | 'glow' | 'idle' | 'complete'>('entry');
  const [showButtons, setShowButtons] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const getRarityColors = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return ['#FFFFFF', '#E5E7EB', '#D1D5DB', '#F3F4F6'];
      case 'uncommon':
        return ['#4DD4A3', '#3ECFA0', '#6FE0B7', '#A0F0D1'];
      case 'rare':
        return ['#B084F4', '#9B6CFF', '#C9A8FF', '#E0C9FF'];
      case 'epic':
        return ['#FFD44D', '#FFBF3F', '#FFE07C', '#FFF3C7'];
      case 'legendary':
        return ['#FF8E4D', '#FF4DD8', '#4DFFEA', '#FFD44D', '#FF6B6B'];
      default:
        return ['#FFFFFF'];
    }
  };

  useEffect(() => {
    if (isOpen && title) {
      console.log('👑 [Title Reward] Starting celebration for:', title, 'rarity:', rarity);
      setAnimationPhase('entry');
      setShowButtons(false);

      const existingCanvas = document.getElementById('title-reward-confetti');
      if (existingCanvas && existingCanvas.parentNode) {
        existingCanvas.parentNode.removeChild(existingCanvas);
      }

      const confettiCanvas = document.createElement('canvas');
      confettiCanvas.id = 'title-reward-confetti';
      confettiCanvas.style.position = 'fixed';
      confettiCanvas.style.top = '0';
      confettiCanvas.style.left = '0';
      confettiCanvas.style.width = '100%';
      confettiCanvas.style.height = '100%';
      confettiCanvas.style.pointerEvents = 'none';
      confettiCanvas.style.zIndex = '2147483647';
      document.body.appendChild(confettiCanvas);

      const customConfetti = confetti.create(confettiCanvas, {
        resize: true,
        useWorker: false
      });

      const colors = getRarityColors(rarity);

      const fireConfetti = () => {
        if (prefersReducedMotion) {
          setTimeout(() => {
            customConfetti({
              particleCount: 10,
              angle: 90,
              spread: 45,
              origin: { y: 0.5, x: 0.5 },
              colors,
              startVelocity: 20,
              gravity: 0.8
            });
          }, 500);
          return;
        }

        switch (rarity) {
          case 'common':
            setTimeout(() => {
              customConfetti({
                particleCount: 30,
                angle: 90,
                spread: 60,
                origin: { y: 0.5, x: 0.5 },
                colors,
                startVelocity: 25,
                gravity: 0.8
              });
            }, 500);
            break;

          case 'uncommon':
            setTimeout(() => {
              customConfetti({
                particleCount: 50,
                angle: 90,
                spread: 90,
                origin: { y: 0.5, x: 0.5 },
                colors,
                startVelocity: 30,
                gravity: 0.8,
                shapes: ['circle']
              });
            }, 500);
            setTimeout(() => {
              customConfetti({
                particleCount: 30,
                angle: 90,
                spread: 120,
                origin: { y: 0.5, x: 0.5 },
                colors,
                startVelocity: 25,
                gravity: 0.7
              });
            }, 800);
            break;

          case 'rare':
            for (let i = 0; i < 8; i++) {
              setTimeout(() => {
                const angle = (i / 8) * 360;
                customConfetti({
                  particleCount: 10,
                  angle: angle,
                  spread: 30,
                  origin: { y: 0.5, x: 0.5 },
                  colors,
                  startVelocity: 35,
                  gravity: 0.6,
                  shapes: ['circle', 'square']
                });
              }, 500 + i * 100);
            }
            break;

          case 'epic':
            setTimeout(() => {
              customConfetti({
                particleCount: 80,
                angle: 90,
                spread: 100,
                origin: { y: 0.5, x: 0.5 },
                colors,
                startVelocity: 40,
                gravity: 0.7
              });
            }, 500);
            setTimeout(() => {
              customConfetti({
                particleCount: 50,
                angle: 60,
                spread: 80,
                origin: { y: 0.5, x: 0.3 },
                colors,
                startVelocity: 35
              });
              customConfetti({
                particleCount: 50,
                angle: 120,
                spread: 80,
                origin: { y: 0.5, x: 0.7 },
                colors,
                startVelocity: 35
              });
            }, 800);
            break;

          case 'legendary':
            for (let i = 0; i < 5; i++) {
              setTimeout(() => {
                customConfetti({
                  particleCount: 100,
                  angle: 90,
                  spread: 160,
                  origin: { y: 0.5, x: 0.5 },
                  colors,
                  startVelocity: 50,
                  gravity: 0.8,
                  shapes: ['circle', 'square']
                });
              }, i * 200);
            }
            setTimeout(() => {
              customConfetti({
                particleCount: 60,
                angle: 90,
                spread: 100,
                origin: { y: 0.4, x: 0.5 },
                colors,
                startVelocity: 45
              });
            }, 1200);
            break;
        }
      };

      fireConfetti();

      setTimeout(() => setAnimationPhase('glow'), 800);
      setTimeout(() => setAnimationPhase('idle'), 1500);
      setTimeout(() => setShowButtons(true), 2000);
      setTimeout(() => setAnimationPhase('complete'), 4000);
      
      // 🔒 NO AUTO-CLOSE: User must explicitly close the modal
      // Modal only closes via:
      // - X button click
      // - Backdrop click
      // - ESC key press
      // - "View All Titles" button (navigates away)
      console.log('👑 [Title Reward] Modal will stay open until user closes it');

      return () => {
        setTimeout(() => {
          const canvas = document.getElementById('title-reward-confetti');
          if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
          }
        }, 3000);
      };
    }
  }, [isOpen, title, rarity, prefersReducedMotion]);

  if (!mounted || !title) return null;

  // ERAS CELESTIAL GEOMETRY SYSTEM - Badge Configuration
  const badgeGeometry = {
    common: {
      // Circle - The seed, simplicity, beginning
      baseGeometry: 'circle',
      edges: Infinity,
      clipPath: 'circle(50% at 50% 50%)',
      cornerRadius: '100%',
      orbitRing: false,
      orbitThickness: 0,
      haloRadius: 24,
      glowOpacity: 0.15,
      motionProfile: 'fade',
      primary: '#9EA5AE',
      accent: '#FFFFFF',
      gradient: 'radial-gradient(circle at 35% 35%, #FFFFFF 0%, #E6E6E6 40%, #B8B8B8 100%)',
      innerGlow: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.6) 0%, transparent 70%)',
      haloGradient: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.15) 0%, transparent 100%)',
      particles: '#FFFFFF',
      symbolic: 'The seed — simplicity and beginning'
    },
    uncommon: {
      // Rounded Hexagon - Growth, stability, discovery
      baseGeometry: 'polygon',
      edges: 6,
      clipPath: 'polygon(25% 5%, 75% 5%, 95% 50%, 75% 95%, 25% 95%, 5% 50%)',
      cornerRadius: '40%',
      orbitRing: true,
      orbitThickness: 4,
      haloRadius: 32,
      glowOpacity: 0.25,
      motionProfile: 'ripple',
      primary: '#4DD4A3',
      accent: '#6FE0B7',
      gradient: 'radial-gradient(circle at 35% 35%, #6FE0B7 0%, #4DD4A3 40%, #2EA87D 100%)',
      innerGlow: 'radial-gradient(circle at center, rgba(111, 224, 183, 0.6) 0%, transparent 70%)',
      haloGradient: 'radial-gradient(circle at center, rgba(77, 212, 163, 0.25) 0%, transparent 100%)',
      particles: '#6FE0B7',
      symbolic: 'Growth, stability, discovery'
    },
    rare: {
      // 12-point Star - Radiance, cosmic significance
      baseGeometry: 'star',
      edges: 12,
      clipPath: 'polygon(50% 0%, 58% 28%, 86% 18%, 68% 43%, 98% 50%, 68% 57%, 86% 82%, 58% 72%, 50% 100%, 42% 72%, 14% 82%, 32% 57%, 2% 50%, 32% 43%, 14% 18%, 42% 28%)',
      cornerRadius: '0%',
      orbitRing: true,
      orbitThickness: 6,
      haloRadius: 48,
      glowOpacity: 0.4,
      motionProfile: 'spiral',
      primary: '#B084F4',
      accent: '#D3A8FF',
      gradient: 'radial-gradient(circle at 35% 35%, #E0C9FF 0%, #B084F4 40%, #7044CC 100%)',
      innerGlow: 'radial-gradient(circle at center, rgba(211, 168, 255, 0.7) 0%, transparent 70%)',
      haloGradient: 'radial-gradient(circle at center, rgba(176, 132, 244, 0.4) 0%, transparent 100%)',
      particles: '#D3A8FF',
      symbolic: 'Radiance, cosmic significance'
    },
    epic: {
      // Octagon (faceted crystal) - Mastery, brilliance, legacy
      baseGeometry: 'polygon',
      edges: 8,
      clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
      cornerRadius: '20%',
      orbitRing: true,
      orbitThickness: 8,
      haloRadius: 64,
      glowOpacity: 0.6,
      motionProfile: 'burst',
      primary: '#FFD44D',
      accent: '#FFE07C',
      gradient: 'radial-gradient(circle at 35% 35%, #FFF3C7 0%, #FFD44D 40%, #CC8800 100%)',
      innerGlow: 'radial-gradient(circle at center, rgba(255, 224, 124, 0.8) 0%, transparent 70%)',
      haloGradient: 'radial-gradient(circle at center, rgba(255, 212, 77, 0.6) 0%, transparent 100%)',
      particles: '#FFE07C',
      symbolic: 'Mastery, brilliance, legacy'
    },
    legendary: {
      // Dynamic Eclipse (dual-ring orbit) - Transcendence, timelessness
      baseGeometry: 'dualRing',
      edges: null,
      clipPath: 'circle(50% at 50% 50%)',
      cornerRadius: '100%',
      orbitRing: true,
      orbitThickness: 10,
      haloRadius: 96,
      glowOpacity: 0.9,
      motionProfile: 'spiral',
      primary: '#FF8E4D',
      accent: '#FF4DD8',
      gradient: 'radial-gradient(circle at 35% 35%, #FFD44D 0%, #FF8E4D 20%, #FF4DD8 50%, #4DFFEA 80%, #9B59B6 100%)',
      innerGlow: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.9) 0%, rgba(255, 77, 216, 0.6) 50%, transparent 70%)',
      haloGradient: 'radial-gradient(circle at center, rgba(255, 142, 77, 0.9) 0%, rgba(255, 77, 216, 0.5) 50%, transparent 100%)',
      particles: '#FF4DD8',
      symbolic: 'Transcendence, timelessness'
    }
  };

  const config = badgeGeometry[rarity];

  // MATERIAL + LIGHT SYSTEM CONFIGURATION
  const materialConfig = {
    common: {
      buttonBg: 'rgba(255, 255, 255, 0.15)',
      buttonGlow: 'rgba(255, 255, 255, 0.15)',
      buttonBorder: 'rgba(255, 255, 255, 0.3)',
      textShadow: '0 2px 8px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 255, 255, 0.5)'
    },
    uncommon: {
      buttonBg: 'rgba(77, 212, 163, 0.2)',
      buttonGlow: 'rgba(77, 212, 163, 0.25)',
      buttonBorder: 'rgba(111, 224, 183, 0.4)',
      textShadow: '0 2px 8px rgba(0, 0, 0, 0.6), 0 0 30px rgba(77, 212, 163, 0.7)'
    },
    rare: {
      buttonBg: 'rgba(176, 132, 244, 0.2)',
      buttonGlow: 'rgba(176, 132, 244, 0.3)',
      buttonBorder: 'rgba(211, 168, 255, 0.5)',
      textShadow: '0 2px 8px rgba(0, 0, 0, 0.6), 0 0 40px rgba(176, 132, 244, 0.8)'
    },
    epic: {
      buttonBg: 'rgba(255, 212, 77, 0.2)',
      buttonGlow: 'rgba(255, 212, 77, 0.35)',
      buttonBorder: 'rgba(255, 224, 124, 0.6)',
      textShadow: '0 2px 8px rgba(0, 0, 0, 0.6), 0 0 50px rgba(255, 212, 77, 0.9)'
    },
    legendary: {
      buttonBg: 'rgba(255, 142, 77, 0.25)',
      buttonGlow: 'rgba(255, 77, 216, 0.4)',
      buttonBorder: 'rgba(255, 255, 255, 0.5)',
      textShadow: '0 2px 8px rgba(0, 0, 0, 0.6), 0 0 60px rgba(255, 142, 77, 1), 0 0 80px rgba(255, 77, 216, 0.8)'
    }
  };

  const material = materialConfig[rarity];

  const shareTitle = () => {
    const shareText = `I just earned the "${title}" title on Eras 🕰️\nFrom Achievement: ${achievementName}\n\nJoin me in preserving memories for the future! ✨`;
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://eras.app';

    if (navigator.share) {
      navigator.share({
        title: `New Title Earned: ${title}`,
        text: shareText,
        url: shareUrl
      }).catch(() => {
        navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
        toast.success('Share text copied to clipboard!', {
          icon: '📋',
          duration: 2000
        });
      });
    } else {
      navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      toast.success('Share text copied to clipboard!', {
        icon: '📋',
        duration: 2000
      });
    }
  };

  const handleViewTitles = () => {
    onClose();
    if (onViewTitles) {
      onViewTitles();
    }
  };

  // RARITY-SPECIFIC ENTRANCE ANIMATIONS (Motion Profiles)
  const getEntranceAnimation = () => {
    if (prefersReducedMotion) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.5 }
      };
    }

    const erasCubicBezier = [0.25, 1, 0.5, 1]; // Eras signature easing

    switch (config.motionProfile) {
      case 'fade':
        // Common: Fade-in upward (easeOut)
        return {
          initial: { scale: 0.7, opacity: 0, y: 30 },
          animate: { scale: 1, opacity: 1, y: 0 },
          transition: { 
            duration: 0.8,
            ease: erasCubicBezier
          }
        };
      
      case 'ripple':
        // Uncommon: Slide from left, settle softly
        return {
          initial: { scale: 0.8, opacity: 0, x: -100, rotate: -15 },
          animate: { scale: 1, opacity: 1, x: 0, rotate: 0 },
          transition: {
            duration: 0.85,
            ease: erasCubicBezier
          }
        };
      
      case 'spiral':
        // Rare/Legendary: Spiral in + brief spin with 15° loop oscillation
        return {
          initial: { scale: 0.6, opacity: 0, rotate: 0 },
          animate: { scale: 1, opacity: 1, rotate: 360 },
          transition: {
            duration: 1.2,
            ease: erasCubicBezier,
            rotate: {
              duration: 1.2,
              ease: [0.34, 1.56, 0.64, 1]
            }
          }
        };
      
      case 'burst':
        // Epic: Bottom burst + shimmer trail
        return {
          initial: { scale: 0.5, opacity: 0, y: 150 },
          animate: { scale: 1, opacity: 1, y: 0 },
          transition: {
            duration: 1.0,
            ease: erasCubicBezier,
            type: 'spring',
            stiffness: 100,
            damping: 12
          }
        };
      
      default:
        return {
          initial: { scale: 0.6, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          transition: { duration: 0.85, ease: erasCubicBezier }
        };
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Celestial Backdrop - Dark radial vignette */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 backdrop-blur-[8px]"
            style={{ 
              zIndex: 9999,
              background: 'radial-gradient(circle at center, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.85) 100%)'
            }}
            onClick={onClose}
          />

          {/* Particle Drift Layer (lowest z-index in particle field) */}
          {!prefersReducedMotion && (
            <div 
              className="fixed inset-0 overflow-hidden pointer-events-none"
              style={{ zIndex: 9999 }}
            >
              {[...Array(15)].map((_, i) => {
                const depth = 0.1 + Math.random() * 0.2;
                const size = 1 + Math.random() * 2.5;
                return (
                  <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      backgroundColor: config.particles,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      boxShadow: `0 0 ${size * 3}px ${config.particles}`
                    }}
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: [0, 0.2 + depth, 0.3, 0.2 + depth, 0],
                      scale: [depth, depth * 1.3, depth],
                      y: [0, -30 * depth, -60 * depth, -90 * depth, -120 * depth],
                    }}
                    transition={{
                      duration: 6 + Math.random() * 3,
                      repeat: Infinity,
                      ease: 'linear',
                      delay: Math.random() * 3,
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Modal Container */}
          <div 
            className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
            style={{ zIndex: 9999 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ 
                duration: 0.5,
                ease: [0.25, 1, 0.5, 1]
              }}
              className="relative w-[500px] max-w-[90vw] md:w-[45vw] pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 z-50 p-3 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md transition-all hover:scale-110 active:scale-95 border border-white/30"
                aria-label="Close"
                style={{
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                }}
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Content Container */}
              <div className="relative flex flex-col items-center text-center px-6 md:px-8 py-12 md:py-16">
                {/* Title Unlocked Label */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
                  className="mb-8 md:mb-10"
                >
                  <div 
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-full backdrop-blur-md border"
                    style={{
                      borderColor: material.buttonBorder,
                      background: `linear-gradient(135deg, ${material.buttonBg}, ${material.buttonGlow}05)`,
                      boxShadow: `0 0 30px ${material.buttonGlow}, 0 4px 16px rgba(0, 0, 0, 0.5)`
                    }}
                  >
                    <Sparkles className="w-6 h-6 text-white" style={{ filter: 'drop-shadow(0 0 6px white)' }} />
                    <span 
                      className="tracking-[0.25em] text-base uppercase text-white"
                      style={{
                        fontWeight: 900,
                        textShadow: '0 2px 8px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 255, 255, 0.8)'
                      }}
                    >
                      TITLE UNLOCKED!
                    </span>
                  </div>
                </motion.div>

                {/* CELESTIAL BADGE - Multi-Layer Geometry System */}
                <motion.div
                  {...getEntranceAnimation()}
                  className="relative mb-10 md:mb-12"
                  style={{ perspective: '1000px' }}
                >
                  {/* Layer 5: Halo (Atmospheric Aura) - Expands/fades on entry */}
                  <motion.div
                    className="absolute inset-0"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{
                      scale: animationPhase === 'complete' ? [1.3, 1.5, 1.3] : 1.3,
                      opacity: animationPhase === 'complete' ? [config.glowOpacity * 0.6, config.glowOpacity * 0.3, config.glowOpacity * 0.6] : config.glowOpacity * 0.6
                    }}
                    transition={{
                      scale: { duration: 1.2, ease: 'easeOut' },
                      opacity: {
                        duration: 2.5,
                        repeat: animationPhase === 'complete' ? Infinity : 0,
                        ease: 'easeInOut'
                      }
                    }}
                    style={{
                      background: config.haloGradient,
                      filter: `blur(${config.haloRadius}px)`,
                      transform: `scale(${1 + config.haloRadius / 100})`
                    }}
                  />

                  {/* Badge Container - Responsive sizing */}
                  <div className="relative w-[260px] h-[260px] md:w-[320px] md:h-[320px]">
                    {/* Orbit Ring (if enabled) */}
                    {config.orbitRing && (
                      <motion.div
                        className="absolute inset-0"
                        animate={
                          !prefersReducedMotion && rarity === 'legendary' 
                            ? { rotate: 360 } 
                            : rarity === 'rare' || rarity === 'epic'
                            ? { rotate: [0, 15, 0, -15, 0] }
                            : {}
                        }
                        transition={
                          rarity === 'legendary'
                            ? { duration: 20, repeat: Infinity, ease: 'linear' }
                            : { duration: 5, repeat: Infinity, ease: 'easeInOut' }
                        }
                        style={{
                          border: `${config.orbitThickness}px solid ${config.accent}40`,
                          borderRadius: config.cornerRadius,
                          clipPath: config.clipPath,
                          transform: 'scale(1.1)'
                        }}
                      />
                    )}

                    {/* Legendary: Dual-Ring Orbit System */}
                    {rarity === 'legendary' && config.orbitRing && (
                      <>
                        {/* Inner Ring (60% curvature) */}
                        <motion.div
                          className="absolute inset-0"
                          animate={{ rotate: -360 }}
                          transition={{
                            duration: 15,
                            repeat: Infinity,
                            ease: 'linear'
                          }}
                          style={{
                            border: `6px solid ${config.accent}60`,
                            borderRadius: '60%',
                            transform: 'scale(0.85)'
                          }}
                        />
                        {/* Outer Ring (0% curvature - sharp) */}
                        <motion.div
                          className="absolute inset-0"
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 25,
                            repeat: Infinity,
                            ease: 'linear'
                          }}
                          style={{
                            border: `${config.orbitThickness}px solid ${config.primary}30`,
                            borderRadius: '0%',
                            clipPath: config.clipPath,
                            transform: 'scale(1.15)'
                          }}
                        />
                      </>
                    )}

                    {/* Layer 1: Core Shape (Gradient Fill) */}
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        background: config.gradient,
                        clipPath: config.clipPath,
                        boxShadow: `0 0 ${config.haloRadius * 2}px rgba(0, 0, 0, 0.4)`,
                        transition: 'box-shadow 0.5s ease'
                      }}
                    >
                      {/* Layer 2: Inner Glow (Pulsing, Screen Blend) */}
                      <motion.div
                        className="absolute inset-0"
                        animate={
                          animationPhase === 'complete'
                            ? {
                                opacity: [0.6, 0.9, 0.6],
                                scale: [1, 1.05, 1]
                              }
                            : { opacity: 0.6 }
                        }
                        transition={{
                          duration: 2.5,
                          repeat: animationPhase === 'complete' ? Infinity : 0,
                          ease: 'easeInOut'
                        }}
                        style={{
                          background: config.innerGlow,
                          clipPath: config.clipPath,
                          mixBlendMode: 'screen'
                        }}
                      />

                      {/* Layer 4: Specular Spark (Reflective Spot) */}
                      <div 
                        className="absolute inset-0"
                        style={{
                          background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.6) 0%, transparent 40%)',
                          clipPath: config.clipPath
                        }}
                      />

                      {/* Light Sweep Animation */}
                      {!prefersReducedMotion && animationPhase !== 'entry' && (
                        <motion.div
                          className="absolute inset-0"
                          initial={{ x: '-200%', opacity: 0 }}
                          animate={{ x: '200%', opacity: [0, 0.8, 0] }}
                          transition={{
                            duration: 1.5,
                            delay: 0.5,
                            ease: [0.25, 1, 0.5, 1]
                          }}
                          style={{
                            background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.9) 50%, transparent 100%)',
                            clipPath: config.clipPath,
                            width: '50%'
                          }}
                        />
                      )}

                      {/* Crown Icon */}
                      <Crown 
                        className="relative z-10 text-white" 
                        style={{ 
                          width: '120px', 
                          height: '120px',
                          filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.6)) drop-shadow(0 0 20px rgba(255, 255, 255, 0.4))'
                        }}
                        strokeWidth={1.2}
                      />

                      {/* Legendary: Animated Iridescent Conic Gradient */}
                      {rarity === 'legendary' && !prefersReducedMotion && (
                        <motion.div
                          className="absolute inset-0"
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: 'linear'
                          }}
                          style={{
                            background: 'conic-gradient(from 0deg, transparent 0%, rgba(255, 255, 255, 0.5) 10%, transparent 20%, transparent 80%, rgba(255, 255, 255, 0.5) 90%, transparent 100%)',
                            clipPath: config.clipPath
                          }}
                        />
                      )}

                      {/* Uncommon: Comet Trail Effect */}
                      {rarity === 'uncommon' && !prefersReducedMotion && animationPhase === 'entry' && (
                        <motion.div
                          className="absolute inset-0"
                          initial={{ x: -200, opacity: 0.6 }}
                          animate={{ x: 0, opacity: 0 }}
                          transition={{ duration: 0.85, ease: 'easeOut' }}
                          style={{
                            background: `linear-gradient(90deg, transparent 0%, ${config.accent}80 50%, transparent 100%)`,
                            filter: 'blur(20px)',
                            width: '200%',
                            left: '-100%'
                          }}
                        />
                      )}
                    </div>

                    {/* Micro-burst Sparkles at 1.0s mark */}
                    {!prefersReducedMotion && animationPhase !== 'entry' && (
                      <>
                        {[...Array(config.edges === 12 ? 12 : 8)].map((_, i) => {
                          const angle = (i / (config.edges === 12 ? 12 : 8)) * 360;
                          const distance = 150;
                          return (
                            <motion.div
                              key={`sparkle-${i}`}
                              className="absolute rounded-full"
                              style={{
                                width: '5px',
                                height: '5px',
                                backgroundColor: config.particles,
                                boxShadow: `0 0 10px ${config.particles}, 0 0 15px ${config.particles}`,
                                left: '50%',
                                top: '50%',
                                marginLeft: '-2.5px',
                                marginTop: '-2.5px',
                              }}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{
                                scale: [0, 1.5, 0],
                                opacity: [0, 1, 0],
                                x: Math.cos(angle * Math.PI / 180) * distance,
                                y: Math.sin(angle * Math.PI / 180) * distance
                              }}
                              transition={{
                                duration: 0.8,
                                delay: 1.0 + (i * 0.05),
                                ease: 'easeOut'
                              }}
                            />
                          );
                        })}
                      </>
                    )}

                    {/* Orbiting Light Particles (Rare+) */}
                    {!prefersReducedMotion && config.orbitRing && animationPhase === 'complete' && (
                      <>
                        {[...Array(rarity === 'legendary' ? 8 : 6)].map((_, i) => {
                          const angle = (i / (rarity === 'legendary' ? 8 : 6)) * 360;
                          const radius = 170;
                          return (
                            <motion.div
                              key={`orbit-${i}`}
                              className="absolute rounded-full"
                              style={{
                                width: '7px',
                                height: '7px',
                                backgroundColor: config.particles,
                                boxShadow: `0 0 15px ${config.accent}, 0 0 25px ${config.accent}`,
                                left: '50%',
                                top: '50%',
                                marginLeft: '-3.5px',
                                marginTop: '-3.5px',
                              }}
                              animate={{
                                x: [
                                  Math.cos(angle * Math.PI / 180) * radius,
                                  Math.cos((angle + 360) * Math.PI / 180) * radius
                                ],
                                y: [
                                  Math.sin(angle * Math.PI / 180) * radius,
                                  Math.sin((angle + 360) * Math.PI / 180) * radius
                                ],
                                scale: [1, 1.5, 1],
                                opacity: [0.7, 1, 0.7]
                              }}
                              transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: 'linear',
                                delay: (i / (rarity === 'legendary' ? 8 : 6)) * 4
                              }}
                            />
                          );
                        })}
                      </>
                    )}
                  </div>
                </motion.div>

                {/* Title Display */}
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    delay: 1.3, 
                    duration: 1.1,
                    ease: [0.25, 1, 0.5, 1]
                  }}
                  className="mb-3"
                >
                  <TitleDisplay 
                    title={title} 
                    rarity={rarity}
                    className="text-4xl md:text-5xl"
                    style={{
                      textShadow: material.textShadow,
                      filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5))'
                    }}
                  />
                </motion.div>

                {/* Achievement Subtitle */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.7, duration: 0.4 }}
                  className="mb-10 md:mb-12"
                >
                  <p 
                    className="text-gray-400 text-xs uppercase tracking-[0.15em] mb-1.5 font-semibold"
                    style={{
                      textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)'
                    }}
                  >
                    Unlocked from
                  </p>
                  <p 
                    className="text-white font-medium text-sm"
                    style={{
                      textShadow: '0 2px 6px rgba(0, 0, 0, 0.7)'
                    }}
                  >
                    {achievementName}
                  </p>
                </motion.div>

                {/* Action Buttons */}
                <AnimatePresence>
                  {showButtons && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                      className="flex flex-col gap-3 w-full max-w-md"
                    >
                      {/* Share Button */}
                      <motion.button
                        initial={{ opacity: 0, y: 15, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ 
                          delay: 0.1, 
                          duration: 0.4,
                          type: 'spring',
                          stiffness: 200,
                          damping: 15
                        }}
                        whileHover={{ scale: 1.05, brightness: 1.15 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={shareTitle}
                        className="w-full px-8 py-4 rounded-2xl text-white font-bold transition-all flex items-center justify-center gap-2.5 backdrop-blur-xl border-2"
                        style={{
                          background: material.buttonBg,
                          borderColor: material.buttonBorder,
                          boxShadow: `0 0 30px ${material.buttonGlow}, 0 8px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
                          textShadow: '0 2px 4px rgba(0, 0, 0, 0.6)'
                        }}
                      >
                        <Share2 className="w-5 h-5" style={{ filter: 'drop-shadow(0 0 4px white)' }} />
                        Share
                      </motion.button>

                      {/* View Titles Button */}
                      <motion.button
                        initial={{ opacity: 0, y: 15, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ 
                          delay: 0.2, 
                          duration: 0.4,
                          type: 'spring',
                          stiffness: 200,
                          damping: 15
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleViewTitles}
                        className="w-full px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white font-semibold transition-all flex items-center justify-center gap-2.5 border border-white/30"
                        style={{
                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                          textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)'
                        }}
                      >
                        <Crown className="w-5 h-5" />
                        View Titles
                      </motion.button>

                      {/* Close Button */}
                      <motion.button
                        initial={{ opacity: 0, y: 15, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ 
                          delay: 0.3, 
                          duration: 0.4,
                          type: 'spring',
                          stiffness: 200,
                          damping: 15
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onClose}
                        className="w-full px-8 py-3 rounded-2xl bg-transparent hover:bg-white/5 text-white/70 hover:text-white transition-all text-sm font-medium"
                        style={{
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
                        }}
                      >
                        Close
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
