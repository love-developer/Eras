// Onboarding Module Registry System
// Provides a centralized, extensible system for managing all onboarding modules

export interface OnboardingModule {
  id: string;
  name: string;
  description: string;
  icon: string;
  duration: number; // seconds
  category: 'core' | 'feature';
  mandatory: boolean;
  priority: number; // for suggested order
  
  // Completion tracking
  completionKey: string; // KV store key
  
  // Triggers
  contextualTriggers?: {
    afterCapsulesCreated?: number;
    onScreenVisit?: string[]; // screen names
    afterDaysSinceSignup?: number;
  };
  
  // Component (lazy loaded)
  component: React.LazyExoticComponent<React.ComponentType<OnboardingModuleProps>>;
}

export interface OnboardingModuleProps {
  onComplete: () => void;
  onSkip: () => void;
  isForced?: boolean; // If user explicitly requested replay
}

// Lazy load components for better performance
import React, { lazy } from 'react';

const FirstCapsuleOnboarding = lazy(() => import('../../components/onboarding/modules/FirstCapsule'));
const VaultMasteryOnboarding = lazy(() => import('../../components/onboarding/modules/VaultMastery'));
const ThemeExplorerOnboarding = lazy(() => import('../../components/onboarding/modules/ThemeExplorer'));
const SocialFeaturesOnboarding = lazy(() => import('../../components/onboarding/modules/SocialFeatures'));

export const ONBOARDING_MODULES: Record<string, OnboardingModule> = {
  FIRST_CAPSULE: {
    id: 'first_capsule',
    name: 'Your First Capsule',
    description: 'Create your first time capsule in 60 seconds',
    icon: '🎁',
    duration: 60,
    category: 'core',
    mandatory: true,
    priority: 1,
    completionKey: 'onboarding_first_capsule_completed',
    component: FirstCapsuleOnboarding
  },
  
  VAULT_MASTERY: {
    id: 'vault_mastery',
    name: 'Vault Mastery',
    description: 'Learn storage, folders, and legacy features',
    icon: '🏛️',
    duration: 120,
    category: 'feature',
    mandatory: false, // Semi-mandatory via strong encouragement
    priority: 2,
    completionKey: 'onboarding_vault_completed',
    contextualTriggers: {
      afterCapsulesCreated: 1, // Show right after first capsule
    },
    component: VaultMasteryOnboarding
  },
  
  THEME_EXPLORER: {
    id: 'theme_explorer',
    name: 'Theme Explorer',
    description: 'Discover all ceremony themes',
    icon: '🎨',
    duration: 90,
    category: 'feature',
    mandatory: false,
    priority: 3,
    completionKey: 'onboarding_themes_completed',
    contextualTriggers: {
      afterCapsulesCreated: 2,
    },
    component: ThemeExplorerOnboarding
  },
  
  SOCIAL_FEATURES: {
    id: 'social_features',
    name: 'Social Features',
    description: 'Send capsules to friends and family',
    icon: '👥',
    duration: 90,
    category: 'feature',
    mandatory: false,
    priority: 4,
    completionKey: 'onboarding_social_completed',
    contextualTriggers: {
      afterCapsulesCreated: 1
    },
    component: SocialFeaturesOnboarding
  },
  
  // Easy to add more modules in the future:
  // LEGACY_BENEFICIARIES: { ... },
  // OCCASIONS: { ... },
  // CEREMONY_CUSTOMIZATION: { ... },
};

// Get module by ID
export function getModule(moduleId: string): OnboardingModule | null {
  // Support both uppercase keys (FIRST_CAPSULE) and lowercase IDs (first_capsule)
  if (ONBOARDING_MODULES[moduleId]) return ONBOARDING_MODULES[moduleId];
  
  // Search by id property
  return Object.values(ONBOARDING_MODULES).find(m => m.id === moduleId) || null;
}

// Get all modules in priority order
export function getAllModules(): OnboardingModule[] {
  return Object.values(ONBOARDING_MODULES).sort((a, b) => a.priority - b.priority);
}

// Get modules by category
export function getModulesByCategory(category: 'core' | 'feature'): OnboardingModule[] {
  return getAllModules().filter(m => m.category === category);
}

// Get mandatory modules
export function getMandatoryModules(): OnboardingModule[] {
  return getAllModules().filter(m => m.mandatory);
}

// Get suggested next module based on user stats
export function getSuggestedModule(userStats: { capsulesCreated: number; daysSinceSignup: number }, completionState: Record<string, boolean>): OnboardingModule | null {
  for (const module of getAllModules()) {
    // Skip if already completed
    if (completionState[module.id]) continue;
    
    // Skip mandatory modules (handled separately)
    if (module.mandatory) continue;
    
    // Check contextual triggers
    const triggers = module.contextualTriggers;
    if (!triggers) continue;
    
    let shouldTrigger = false;
    
    if (triggers.afterCapsulesCreated !== undefined && 
        userStats.capsulesCreated === triggers.afterCapsulesCreated) {
      shouldTrigger = true;
    }
    
    if (triggers.afterDaysSinceSignup !== undefined &&
        userStats.daysSinceSignup >= triggers.afterDaysSinceSignup) {
      shouldTrigger = true;
    }
    
    if (shouldTrigger) {
      return module;
    }
  }
  
  return null;
}
