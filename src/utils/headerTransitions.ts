/**
 * Header Background Transition System
 * Hybrid approach: Signature animations for featured titles + color-temperature based for all others
 */

import { titleConfigs } from './titleConfigs';

// ============================================================================
// TIER 1: SIGNATURE MOVES - 9 Featured Titles
// ============================================================================
const signatureMoves = {
  'Phoenix Ascendant': 'flame-rise',
  'Void Walker': 'void-creep',
  'Cosmic Wanderer': 'galaxy-spiral',
  'Arctic Sentinel': 'ice-crystallize',
  'Solar Flare': 'radial-burst',
  'Emerald Dynasty': 'vine-growth',
  'Obsidian Crown': 'obsidian-pour',
  'Oceanic Sage': 'wave-ripple',
  'Eternal Flame': 'ember-rise'
} as const;

type SignatureMove = typeof signatureMoves[keyof typeof signatureMoves];

// ============================================================================
// TIER 2: COLOR-TEMPERATURE BASED TRANSITIONS
// ============================================================================

/**
 * Detect if a color is warm (red, orange, gold, yellow)
 */
function isWarmColor(hexColor: string): boolean {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return false;
  
  // Warm if red channel dominant and higher than blue
  return rgb.r > rgb.b && (rgb.r > 150 || rgb.r > rgb.g);
}

/**
 * Detect if a color is cool (blue, cyan, teal)
 */
function isCoolColor(hexColor: string): boolean {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return false;
  
  // Cool if blue channel dominant
  return rgb.b > rgb.r && rgb.b > rgb.g;
}

/**
 * Detect if a color is in the purple/magenta/pink family
 */
function isPurpleFamily(hexColor: string): boolean {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return false;
  
  // Purple if red and blue both high, green lower
  return rgb.r > rgb.g && rgb.b > rgb.g && Math.abs(rgb.r - rgb.b) < 80;
}

/**
 * Detect if a color is in the green/emerald family
 */
function isGreenFamily(hexColor: string): boolean {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return false;
  
  // Green if green channel dominant
  return rgb.g > rgb.r && rgb.g > rgb.b;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Get the transition type for a title based on color temperature
 */
function getColorTemperatureTransition(primaryColor: string): string {
  if (isWarmColor(primaryColor)) return 'heat-shimmer';
  if (isCoolColor(primaryColor)) return 'crystallize-fade';
  if (isPurpleFamily(primaryColor)) return 'nebula-fade';
  if (isGreenFamily(primaryColor)) return 'nature-bloom';
  return 'mist-fade'; // default
}

// ============================================================================
// MAIN TRANSITION RESOLVER
// ============================================================================

export interface TransitionConfig {
  type: SignatureMove | 'heat-shimmer' | 'crystallize-fade' | 'nebula-fade' | 'nature-bloom' | 'mist-fade';
  duration: number;
  tier: 'featured' | 'regular';
}

/**
 * Get the transition configuration for a title
 */
export function getHeaderTransition(titleName: string): TransitionConfig {
  // Check if this is a featured title with signature move
  if (titleName in signatureMoves) {
    const durations: Record<SignatureMove, number> = {
      'flame-rise': 0.9,
      'void-creep': 1.0,
      'galaxy-spiral': 1.1,
      'ice-crystallize': 0.8,
      'radial-burst': 0.7,
      'vine-growth': 0.8,
      'obsidian-pour': 0.9,
      'wave-ripple': 0.8,
      'ember-rise': 0.9
    };
    
    const type = signatureMoves[titleName as keyof typeof signatureMoves];
    return {
      type,
      duration: durations[type],
      tier: 'featured'
    };
  }
  
  // Otherwise, use color-temperature based transition
  const titleConfig = titleConfigs[titleName];
  if (!titleConfig) {
    return {
      type: 'mist-fade',
      duration: 0.3,
      tier: 'regular'
    };
  }
  
  const primaryColor = titleConfig.colors[0];
  const transitionType = getColorTemperatureTransition(primaryColor);
  
  const durations: Record<string, number> = {
    'heat-shimmer': 0.5,
    'crystallize-fade': 0.5,
    'nebula-fade': 0.6,
    'nature-bloom': 0.5,
    'mist-fade': 0.3
  };
  
  return {
    type: transitionType as any,
    duration: durations[transitionType],
    tier: 'regular'
  };
}

// ============================================================================
// MOTION VARIANTS FOR EACH TRANSITION TYPE
// ============================================================================

export const transitionVariants = {
  // TIER 1: SIGNATURE MOVES
  'flame-rise': {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.9,
        ease: [0.43, 0.13, 0.23, 0.96]
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: {
        duration: 0.5,
        ease: [0.43, 0.13, 0.23, 0.96]
      }
    }
  },
  'void-creep': {
    initial: { opacity: 0, scale: 1.1 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 1.0,
        ease: [0.19, 1, 0.22, 1]
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: {
        duration: 0.6,
        ease: [0.19, 1, 0.22, 1]
      }
    }
  },
  'galaxy-spiral': {
    initial: { opacity: 0, rotate: -5 },
    animate: { 
      opacity: 1, 
      rotate: 0,
      transition: {
        duration: 1.1,
        ease: [0.34, 1.56, 0.64, 1]
      }
    },
    exit: { 
      opacity: 0, 
      rotate: 5,
      transition: {
        duration: 0.7,
        ease: [0.34, 1.56, 0.64, 1]
      }
    }
  },
  'ice-crystallize': {
    initial: { opacity: 0, y: -20, scaleY: 0.8 },
    animate: { 
      opacity: 1, 
      y: 0,
      scaleY: 1,
      transition: {
        duration: 0.8,
        ease: [0.215, 0.61, 0.355, 1]
      }
    },
    exit: { 
      opacity: 0, 
      y: 20,
      scaleY: 1.1,
      transition: {
        duration: 0.5,
        ease: [0.215, 0.61, 0.355, 1]
      }
    }
  },
  'radial-burst': {
    initial: { opacity: 0, scale: 0.5 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.7,
        ease: [0.68, -0.55, 0.265, 1.55]
      }
    },
    exit: { 
      opacity: 0, 
      scale: 1.3,
      transition: {
        duration: 0.4,
        ease: [0.68, -0.55, 0.265, 1.55]
      }
    }
  },
  'vine-growth': {
    initial: { opacity: 0, y: 10, scaleY: 0.9 },
    animate: { 
      opacity: 1, 
      y: 0,
      scaleY: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    exit: { 
      opacity: 0, 
      y: -10,
      scaleY: 0.95,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  },
  'obsidian-pour': {
    initial: { opacity: 0, y: -30 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.9,
        ease: [0.87, 0, 0.13, 1]
      }
    },
    exit: { 
      opacity: 0, 
      y: 30,
      transition: {
        duration: 0.6,
        ease: [0.87, 0, 0.13, 1]
      }
    }
  },
  'wave-ripple': {
    initial: { opacity: 0, x: -10 },
    animate: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.8,
        ease: [0.36, 0.66, 0.04, 1]
      }
    },
    exit: { 
      opacity: 0, 
      x: 10,
      transition: {
        duration: 0.5,
        ease: [0.36, 0.66, 0.04, 1]
      }
    }
  },
  'ember-rise': {
    initial: { opacity: 0, y: 15, scale: 0.95 },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.9,
        ease: [0.16, 1, 0.3, 1]
      }
    },
    exit: { 
      opacity: 0, 
      y: -15,
      scale: 1.05,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  },
  
  // TIER 2: COLOR-TEMPERATURE BASED
  'heat-shimmer': {
    initial: { opacity: 0, filter: 'blur(2px)' },
    animate: { 
      opacity: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 0.5,
        ease: 'easeOut'
      }
    },
    exit: { 
      opacity: 0,
      filter: 'blur(2px)',
      transition: {
        duration: 0.3,
        ease: 'easeIn'
      }
    }
  },
  'crystallize-fade': {
    initial: { opacity: 0, scale: 0.98 },
    animate: { 
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1]
      }
    },
    exit: { 
      opacity: 0,
      scale: 1.02,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1]
      }
    }
  },
  'nebula-fade': {
    initial: { opacity: 0, scale: 1.05 },
    animate: { 
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1]
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  },
  'nature-bloom': {
    initial: { opacity: 0, y: 5 },
    animate: { 
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.34, 1.56, 0.64, 1]
      }
    },
    exit: { 
      opacity: 0,
      y: -5,
      transition: {
        duration: 0.3,
        ease: [0.34, 1.56, 0.64, 1]
      }
    }
  },
  'mist-fade': {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: 'easeInOut'
      }
    },
    exit: { 
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: 'easeInOut'
      }
    }
  }
};
