import React from 'react';
import { Gift, Heart, Baby, Rocket, Camera, Map, Star, Zap, PawPrint, Sparkles, Briefcase, Home, GraduationCap, Plane } from 'lucide-react';

// Theme Definitions
export type ThemeId = 'standard' | 'birthday' | 'anniversary' | 'new_life' | 'future' | 'wedding' | 'graduation' | 'friendship' | 'travel' | 'pet' | 'gratitude' | 'career' | 'new_year' | 'new_home' | 'first_day';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  icon: React.ElementType;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  accentColor: string;
  bgGradient: string; // CSS gradient string
  interactionPrompt: string; // "Tear to open", "Wipe fog", "Scan finger"
  particleColors: string[]; // For confetti/effects
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  standard: {
    id: 'standard',
    name: 'Standard Eras',
    description: 'The classic timeless capsule experience',
    icon: Star,
    primaryColor: '#0f172a', // Dark blue (slate-900) for mobile visibility and contrast
    secondaryColor: '#94a3b8',
    textColor: '#ffffff',
    accentColor: '#3b82f6',
    bgGradient: 'radial-gradient(circle at center, rgba(15, 20, 40, 0.98) 0%, rgba(5, 5, 15, 0.99) 100%)',
    interactionPrompt: 'Tap to unlock',
    particleColors: ['#ffffff', '#3b82f6']
  },
  birthday: {
    id: 'birthday',
    name: 'Solar Return',
    description: 'A celebration of another trip around the sun',
    icon: Gift,
    primaryColor: '#FF6B6B',
    secondaryColor: '#FFD93D',
    textColor: '#ffffff',
    accentColor: '#FF6B6B',
    bgGradient: 'linear-gradient(135deg, #FF6B6B 0%, #FFD93D 100%)',
    interactionPrompt: 'Swipe to tear open',
    particleColors: ['#FF6B6B', '#FFD93D', '#4ECDC4', '#FFFFFF', '#FF8C42']
  },
  anniversary: {
    id: 'anniversary',
    name: 'Eternal Flame',
    description: 'For celebrating milestones of love',
    icon: Heart,
    primaryColor: '#db2777', // Pink-600, darker/richer than Birthday
    secondaryColor: '#fce7f3',
    textColor: '#ffffff',
    accentColor: '#db2777',
    bgGradient: 'linear-gradient(to top, #db2777 0%, #fbc2eb 100%)',
    interactionPrompt: 'Wipe the steam to reveal',
    particleColors: ['#db2777', '#fbc2eb', '#FFFFFF']
  },
  new_life: {
    id: 'new_life',
    name: 'New Life',
    description: 'Welcoming a new arrival',
    icon: Baby,
    primaryColor: '#A18CD1',
    secondaryColor: '#FBC2EB',
    textColor: '#ffffff',
    accentColor: '#A18CD1',
    bgGradient: 'linear-gradient(120deg, #a18cd1 0%, #fbc2eb 100%)',
    interactionPrompt: 'Swipe up to fan the flames',
    particleColors: ['#A18CD1', '#FBC2EB', '#E0C3FC', '#FFFFFF']
  },
  future: {
    id: 'future',
    name: 'Time Traveler',
    description: 'A message to your future self',
    icon: Zap,
    primaryColor: '#00F260',
    secondaryColor: '#0575E6',
    textColor: '#ffffff',
    accentColor: '#00F260',
    bgGradient: 'linear-gradient(to right, #00f260, #0575e6)',
    interactionPrompt: 'Scan biometric ID',
    particleColors: ['#00F260', '#0575E6', '#FFFFFF']
  },
  wedding: {
    id: 'wedding',
    name: 'Golden Hour',
    description: 'Elegant memories for the big day',
    icon: Heart,
    primaryColor: '#e6b980',
    secondaryColor: '#eacda3',
    textColor: '#000000',
    accentColor: '#e6b980',
    bgGradient: 'linear-gradient(to top, #e6b980 0%, #eacda3 100%)',
    interactionPrompt: 'Tap to shake & pop',
    particleColors: ['#e6b980', '#eacda3', '#FFFFFF', '#C0C0C0']
  },
  graduation: {
    id: 'graduation',
    name: 'Launchpad',
    description: 'For big achievements and next steps',
    icon: Rocket,
    primaryColor: '#4facfe',
    secondaryColor: '#00f2fe',
    textColor: '#ffffff',
    accentColor: '#4facfe',
    bgGradient: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
    interactionPrompt: 'Click to begin countdown',
    particleColors: ['#4facfe', '#00f2fe', '#FFFFFF', '#FFD700']
  },
  friendship: {
    id: 'friendship',
    name: 'Mixtape',
    description: 'Fun, retro vibes for friends',
    icon: Camera,
    primaryColor: '#0d9488', // Teal-600, distinct from others
    secondaryColor: '#99f6e4', // Teal-200
    textColor: '#ffffff',
    accentColor: '#0d9488',
    bgGradient: 'linear-gradient(to right, #0d9488 0%, #2dd4bf 100%)',
    interactionPrompt: 'Play to unwrap',
    particleColors: ['#0d9488', '#2dd4bf', '#fde047', '#ffffff']
  },
  travel: {
    id: 'travel',
    name: 'Voyage',
    description: 'For adventures and journeys',
    icon: Map,
    primaryColor: '#F97316', // Orange-500
    secondaryColor: '#FDBA74', // Orange-300
    textColor: '#ffffff',
    accentColor: '#F97316',
    bgGradient: 'linear-gradient(to right, #F97316 0%, #FDBA74 100%)',
    interactionPrompt: 'Click to scan boarding pass',
    particleColors: ['#F97316', '#FDBA74', '#FFEDD5', '#C2410C']
  },
  pet: {
    id: 'pet',
    name: 'Furry Friends',
    description: 'Celebrate your beloved pet companion',
    icon: PawPrint,
    primaryColor: '#8B5A3C', // Warm brown for mobile (solid)
    secondaryColor: '#FFE4B5',
    textColor: '#ffffff',
    accentColor: '#8B5A3C',
    bgGradient: 'linear-gradient(135deg, #8B5A3C 0%, #CD853F 50%, #FFE4B5 100%)',
    interactionPrompt: 'Balance the teeter-totter',
    particleColors: ['#8B5A3C', '#CD853F', '#FFE4B5', '#FFFFFF']
  },
  gratitude: {
    id: 'gratitude',
    name: 'Grateful Heart',
    description: 'Express heartfelt thanks and appreciation',
    icon: Sparkles,
    primaryColor: '#DC2626', // Deep red for mobile (solid)
    secondaryColor: '#FCA5A5',
    textColor: '#ffffff',
    accentColor: '#DC2626',
    bgGradient: 'linear-gradient(135deg, #DC2626 0%, #F87171 50%, #FCA5A5 100%)',
    interactionPrompt: 'Release sky lanterns',
    particleColors: ['#DC2626', '#F87171', '#FCA5A5', '#FFD700', '#FFFFFF']
  },
  career: {
    id: 'career',
    name: 'Career Summit',
    description: 'Mark your professional achievements',
    icon: Briefcase,
    primaryColor: '#1E3A8A', // Deep blue for mobile (solid)
    secondaryColor: '#60A5FA',
    textColor: '#ffffff',
    accentColor: '#1E3A8A',
    bgGradient: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 50%, #60A5FA 100%)',
    interactionPrompt: 'Tap to climb the mountain',
    particleColors: ['#1E3A8A', '#3B82F6', '#60A5FA', '#FFD700', '#FFFFFF']
  },
  new_year: {
    id: 'new_year',
    name: 'New Year\'s Eve',
    description: 'Ring in the new year with resolutions',
    icon: Sparkles,
    primaryColor: '#7C3AED', // Deep purple for mobile (solid)
    secondaryColor: '#FDE047',
    textColor: '#ffffff',
    accentColor: '#7C3AED',
    bgGradient: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 50%, #FDE047 100%)',
    interactionPrompt: 'Click to drop the ball',
    particleColors: ['#7C3AED', '#A78BFA', '#FDE047', '#FFD700', '#FFFFFF']
  },
  new_home: {
    id: 'new_home',
    name: 'New Nest',
    description: 'Celebrate your new home sweet home',
    icon: Home,
    primaryColor: '#059669', // Deep green for mobile (solid)
    secondaryColor: '#A7F3D0',
    textColor: '#ffffff',
    accentColor: '#059669',
    bgGradient: 'linear-gradient(135deg, #059669 0%, #10B981 50%, #A7F3D0 100%)',
    interactionPrompt: 'Turn the key',
    particleColors: ['#059669', '#10B981', '#A7F3D0', '#FFD700', '#FFFFFF']
  },
  first_day: {
    id: 'first_day',
    name: 'Fresh Start',
    description: 'Your exciting first day adventure',
    icon: GraduationCap,
    primaryColor: '#EA580C', // Warm orange for mobile (solid)
    secondaryColor: '#FED7AA',
    textColor: '#ffffff',
    accentColor: '#EA580C',
    bgGradient: 'linear-gradient(135deg, #EA580C 0%, #FB923C 50%, #FED7AA 100%)',
    interactionPrompt: 'Click to stop the alarm',
    particleColors: ['#EA580C', '#FB923C', '#FED7AA', '#FFD700', '#FFFFFF']
  }
};

export const getThemeConfig = (themeId: string | undefined): ThemeConfig => {
  // Safe fallback if themeId doesn't exist in registry
  if (!themeId || !THEMES[themeId as ThemeId]) {
    return THEMES.standard;
  }
  return THEMES[themeId as ThemeId];
};