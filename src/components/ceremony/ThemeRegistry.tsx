import React from 'react';
import { Gift, Heart, Baby, Rocket, Camera, Map, PartyPopper, Sparkles } from 'lucide-react';

// Theme Metadata Definitions
export interface ThemeDefinition {
  id: string;
  name: string;
  icon: React.ElementType;
  primaryColor: string;
  secondaryColor: string;
  description: string;
}

export const CAPSULE_THEMES: Record<string, ThemeDefinition> = {
  standard: {
    id: 'standard',
    name: 'Standard',
    icon: Sparkles,
    primaryColor: '#6366f1', // Indigo
    secondaryColor: '#a5b4fc',
    description: 'Classic time capsule experience'
  },
  birthday: {
    id: 'birthday',
    name: 'Solar Return',
    icon: PartyPopper,
    primaryColor: '#ec4899', // Pink
    secondaryColor: '#fbcfe8',
    description: 'Joyful birthday celebration with confetti'
  },
  anniversary: {
    id: 'anniversary',
    name: 'Eternal Flame',
    icon: Heart,
    primaryColor: '#e11d48', // Rose Red
    secondaryColor: '#fda4af',
    description: 'Romantic atmosphere for anniversaries'
  },
  baby: {
    id: 'baby',
    name: 'New Life',
    icon: Baby,
    primaryColor: '#0ea5e9', // Sky Blue
    secondaryColor: '#bae6fd',
    description: 'Soft and gentle for new arrivals'
  },
  wedding: {
    id: 'wedding',
    name: 'Golden Hour',
    icon: Gift,
    primaryColor: '#d97706', // Gold/Amber
    secondaryColor: '#fde68a',
    description: 'Elegant golden theme for weddings'
  },
  graduation: {
    id: 'graduation',
    name: 'Launchpad',
    icon: Rocket,
    primaryColor: '#7c3aed', // Violet
    secondaryColor: '#ddd6fe',
    description: 'Energetic theme for big achievements'
  },
  friendship: {
    id: 'friendship',
    name: 'Vaudeville',
    icon: Camera,
    primaryColor: '#f59e0b', // Orange
    secondaryColor: '#fcd34d',
    description: 'Retro scrapbook style for friends'
  },
  travel: {
    id: 'travel',
    name: 'Odyssey',
    icon: Map,
    primaryColor: '#059669', // Emerald
    secondaryColor: '#6ee7b7',
    description: 'Adventure themed for travelers'
  }
};

export type ThemeId = keyof typeof CAPSULE_THEMES;

export function getTheme(id?: string): ThemeDefinition {
  return CAPSULE_THEMES[id as ThemeId] || CAPSULE_THEMES.standard;
}
