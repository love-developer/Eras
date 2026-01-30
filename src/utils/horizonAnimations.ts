/**
 * 🌅 HORIZON ANIMATIONS - Sunrise/Sunset Sequences
 * 
 * Activation: Gradient rises like sunrise, colors bloom outward
 * Deactivation: Gradient fades like sunset, colors dim and descend
 */

import { Variants } from 'motion/react';

/**
 * Sunrise animation - Title Activation
 */
export const sunriseVariants: Variants = {
  initial: {
    opacity: 0,
    y: 100,
    scale: 0.8,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 2.5,
      ease: [0.22, 1, 0.36, 1], // Smooth ease-out
      opacity: { duration: 1.5 },
      y: { duration: 2.5 },
      scale: { duration: 2.5 }
    }
  },
  exit: {
    opacity: 0,
    y: -50,
    scale: 0.95,
    transition: {
      duration: 1,
      ease: [0.64, 0, 0.78, 0] // Smooth ease-in
    }
  }
};

/**
 * Sunset animation - Title Deactivation
 */
export const sunsetVariants: Variants = {
  initial: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    y: 80,
    scale: 0.85,
    filter: 'brightness(0.5)',
    transition: {
      duration: 2,
      ease: [0.64, 0, 0.78, 0], // Smooth ease-in
      opacity: { duration: 1.5, delay: 0.3 },
      y: { duration: 2 },
      scale: { duration: 2 },
      filter: { duration: 1.5 }
    }
  }
};

/**
 * Color bloom animation - for gradient backgrounds
 */
export const colorBloomVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.5,
    filter: 'brightness(0.3)',
  },
  animate: {
    opacity: 1,
    scale: 1,
    filter: 'brightness(1)',
    transition: {
      duration: 2.8,
      ease: [0.22, 1, 0.36, 1],
      opacity: { duration: 1.2, delay: 0.3 },
      scale: { duration: 2.8 },
      filter: { duration: 2.2, delay: 0.4 }
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    filter: 'brightness(0.2)',
    transition: {
      duration: 2,
      ease: [0.64, 0, 0.78, 0],
      opacity: { duration: 1.5 },
      scale: { duration: 2 },
      filter: { duration: 1.8 }
    }
  }
};

/**
 * Text float animation - title text floats up on activation
 */
export const textFloatVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    filter: 'blur(2px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 1.5,
      ease: [0.22, 1, 0.36, 1],
      delay: 0.1, // Minimal delay so text appears with the gradient
      opacity: { duration: 1.0, delay: 0.1 },
      y: { duration: 1.5, delay: 0.1 },
      filter: { duration: 1.2, delay: 0.1 }
    }
  },
  exit: {
    opacity: 0,
    y: 20,
    filter: 'blur(4px)',
    transition: {
      duration: 1.2,
      ease: [0.64, 0, 0.78, 0]
    }
  }
};

/**
 * Glow pulse animation - for active title glow effect
 */
export const glowPulseVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8,
  },
  animate: {
    opacity: [0, 0.6, 0.3, 0.6, 0],
    scale: [0.8, 1.2, 1.4, 1.6, 1.8],
    transition: {
      duration: 3,
      ease: 'easeOut',
      times: [0, 0.3, 0.5, 0.7, 1]
    }
  }
};

/**
 * Card hover animation - for title cards in gallery
 */
export const cardHoverVariants: Variants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  },
  hover: {
    scale: 1.05,
    y: -8,
    boxShadow: '0 12px 40px rgba(147, 51, 234, 0.4)',
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

/**
 * Preview gradient rise - for HeaderBackground preview at top of modal
 */
export const previewGradientVariants: Variants = {
  initial: {
    opacity: 0,
    scaleY: 0,
    transformOrigin: 'bottom',
  },
  animate: {
    opacity: 1,
    scaleY: 1,
    transition: {
      duration: 1.5,
      ease: [0.22, 1, 0.36, 1],
      opacity: { duration: 0.8, delay: 0.2 },
      scaleY: { duration: 1.5 }
    }
  },
  exit: {
    opacity: 0,
    scaleY: 0,
    transition: {
      duration: 1,
      ease: [0.64, 0, 0.78, 0]
    }
  }
};