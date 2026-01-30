// Achievement Service - Backend logic for Legacy Achievements System
// Total: 57 achievements (45 base + 2 vault + 2 echo + 2 multi-recipient + 6 epic tier achievements)
// Distribution: 14 Common, 13 Uncommon/Rare Era-Themed, 5 Time-Based, 5 Volume, 13 Special/Legendary, 7 Epic
// v2.6.0: PRODUCTION READY
//   - Fixed 4 critical achievements (Cinematic, Golden Hour Guardian, Golden Ratio, Memory Weaver)
//   - Adjusted difficulty (Lucky Number: 777→177, Perfect Chronicle: 30→14, Archive Master: 1000→750)
//   - Verified all custom validators working
//   - Added unique echo sender tracking for Community Beacon (A053)
import * as kv from './kv_store.tsx';

// Initialize achievement service
console.log('🏆 Achievement Service initialized - v2.6.0 (57 Achievements - PRODUCTION READY)');

// ============================================
// ACHIEVEMENT DEFINITIONS (57 Total)
// ============================================
// 
// Grid Layout (45 achievements in 9×5 grid):
// Row 1 (1-9):   Starter Basics
// Row 2 (10-18): Era-Themed & Consistency  
// Row 3 (19-27): Time & Volume Mastery
// Row 4 (28-36): Special & Legendary
// Row 5 (37-45): New Achievements (v2.1.0)
// 
// Additional Achievements:
// A046-A047: Vault Achievements (v2.2.0)
// A048-A053: Epic Tier Achievements Phase 2 (v2.5.0)
// ECH001-ECH002: Echo Achievements (v2.3.0)
// MR001-MR002: Multi-Recipient Achievements (v2.4.0 - Phase 1 Feature A1)
// ============================================

export interface Achievement {
  id: string;
  title: string;
  description: string;
  detailedDescription: string;
  category: 'starter' | 'era_themed' | 'time_based' | 'volume' | 'special' | 'enhance';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  icon: string;
  unlockCriteria: {
    type: 'count' | 'streak' | 'time_wait' | 'specific_action' | 'combo' | 'custom';
    stat?: string;
    threshold?: number;
    operator?: string;
    action?: string;
    requirements?: Array<{ stat: string; threshold: number; operator?: string }>;
    validator?: string; // For custom validators
  };
  rewards: {
    points: number;
    title?: string;
  };
  visual: {
    gradientStart: string;
    gradientEnd: string;
    particleColor: string;
    glowColor: string;
    animation?: string;
  };
  eraTheme?: string;
  shareText: string;
  hidden: boolean;
  order: number;
}

export const ACHIEVEMENT_DEFINITIONS: Record<string, Achievement> = {
  // ============================================
  // STARTER ACHIEVEMENTS (Common) - IDs A001-A010
  // ============================================
  A001: {
    id: 'A001',
    title: 'First Step',
    description: 'Creating your Eras account!',
    detailedDescription: 'Every journey begins with a single step. You\'ve taken yours by creating your Eras account - welcome to a world where memories transcend time!',
    category: 'starter',
    rarity: 'common',
    icon: 'Rocket',
    unlockCriteria: {
      type: 'count',
      stat: 'capsules_created',
      threshold: 1,
      operator: '>='
    },
    rewards: { 
      points: 10,
      title: 'Time Novice'
    },
    visual: {
      gradientStart: '#60A5FA',
      gradientEnd: '#2563EB',
      particleColor: '#93C5FD',
      glowColor: '#3B82F6'
    },
    shareText: 'Just created my first time capsule in Eras! 🎬 #ErasApp #TimeCapsule',
    hidden: false,
    order: 1
  },

  A002: {
    id: 'A002',
    title: 'Into the Future',
    description: 'Send your first capsule',
    detailedDescription: 'The die is cast. Your first capsule is scheduled and will arrive exactly when you intended.',
    category: 'starter',
    rarity: 'common',
    icon: 'Send',
    unlockCriteria: {
      type: 'count',
      stat: 'capsules_sent',
      threshold: 1,
      operator: '>='
    },
    rewards: { 
      points: 15,
      title: 'Future Messenger'
    },
    visual: {
      gradientStart: '#A78BFA',
      gradientEnd: '#7C3AED',
      particleColor: '#DDD6FE',
      glowColor: '#8B5CF6'
    },
    shareText: 'Sent my first time capsule into the future! 📤 #ErasApp',
    hidden: false,
    order: 2
  },

  A003: {
    id: 'A003',
    title: 'From the Past',
    description: 'Receive your first capsule',
    detailedDescription: 'A message from your past self has arrived. The first of many conversations across time.',
    category: 'starter',
    rarity: 'common',
    icon: 'Mailbox',
    unlockCriteria: {
      type: 'count',
      stat: 'capsules_received',
      threshold: 1,
      operator: '>='
    },
    rewards: { 
      points: 20,
      title: 'Past Receiver'
    },
    visual: {
      gradientStart: '#FBBF24',
      gradientEnd: '#D97706',
      particleColor: '#FCD34D',
      glowColor: '#F59E0B'
    },
    shareText: 'Received my first time capsule from the past! 📥 #ErasApp',
    hidden: false,
    order: 3
  },

  A004: {
    id: 'A004',
    title: 'Captured Moment',
    description: 'Add your first photo',
    detailedDescription: 'A picture is worth a thousand words. You\'ve added your first photo to preserve.',
    category: 'starter',
    rarity: 'common',
    icon: 'Camera',
    unlockCriteria: {
      type: 'count',
      stat: 'media_by_type.photo',
      threshold: 1,
      operator: '>='
    },
    rewards: { 
      points: 10,
      title: 'Snapshot Keeper'
    },
    visual: {
      gradientStart: '#34D399',
      gradientEnd: '#059669',
      particleColor: '#6EE7B7',
      glowColor: '#10B981'
    },
    shareText: 'Captured my first moment in Eras! 📸 #ErasApp',
    hidden: false,
    order: 4
  },

  A005: {
    id: 'A005',
    title: 'Motion Picture',
    description: 'Add your first video',
    detailedDescription: 'Moving images capture life in a way still photos cannot. You\'ve added your first video memory.',
    category: 'starter',
    rarity: 'common',
    icon: 'Film',
    unlockCriteria: {
      type: 'count',
      stat: 'media_by_type.video',
      threshold: 1,
      operator: '>='
    },
    rewards: { 
      points: 10,
      title: 'Cinema Pioneer'
    },
    visual: {
      gradientStart: '#F59E0B',
      gradientEnd: '#DC2626',
      particleColor: '#FCD34D',
      glowColor: '#F97316'
    },
    shareText: 'Added my first video to Eras! 🎥 #ErasApp',
    hidden: false,
    order: 5
  },

  A006: {
    id: 'A006',
    title: 'Voice of Time',
    description: 'Record your first audio message',
    detailedDescription: 'Your voice carries emotion that text cannot. You\'ve recorded your first audio message for the future.',
    category: 'starter',
    rarity: 'common',
    icon: 'AudioWaveform',
    unlockCriteria: {
      type: 'count',
      stat: 'media_by_type.audio',
      threshold: 1,
      operator: '>='
    },
    rewards: { 
      points: 10,
      title: 'Voice Keeper'
    },
    visual: {
      gradientStart: '#F472B6',
      gradientEnd: '#DB2777',
      particleColor: '#FBCFE8',
      glowColor: '#EC4899'
    },
    shareText: 'Recorded my first voice message for the future! 🎤 #ErasApp',
    hidden: false,
    order: 6
  },

  A007: {
    id: 'A007',
    title: 'Enhanced Memory',
    description: 'Use any enhancement feature 5 times',
    detailedDescription: 'You\'ve discovered the power of AI enhancement. Filters, stickers, effects - you\'re making your memories special.',
    category: 'enhance',
    rarity: 'common',
    icon: 'Sparkles',
    unlockCriteria: {
      type: 'count',
      stat: 'enhancements_used',
      threshold: 5,
      operator: '>='
    },
    rewards: { points: 10 },
    visual: {
      gradientStart: '#22D3EE',
      gradientEnd: '#0891B2',
      particleColor: '#67E8F9',
      glowColor: '#06B6D4'
    },
    shareText: 'Enhanced 5 memories in Eras! ✨ #ErasApp',
    hidden: false,
    order: 7
  },

  A008: {
    id: 'A008',
    title: 'Multimedia Creator',
    description: 'Create a capsule with 3+ different content types',
    detailedDescription: 'Text, photo, video, audio - you\'ve mastered combining multiple formats into a rich memory capsule.',
    category: 'special',
    rarity: 'common',
    icon: 'Shapes',
    unlockCriteria: {
      type: 'specific_action',
      action: 'multimedia_capsule_created'
    },
    rewards: { 
      points: 15,
      title: 'Moment Collector'
    },
    visual: {
      gradientStart: '#A78BFA',
      gradientEnd: '#6D28D9',
      particleColor: '#DDD6FE',
      glowColor: '#8B5CF6'
    },
    shareText: 'Created a multimedia masterpiece! 🎨 #ErasApp',
    hidden: false,
    order: 8
  },

  A009: {
    id: 'A009',
    title: 'Future Planner',
    description: 'Schedule a capsule 30+ days in advance',
    detailedDescription: 'You\'re thinking ahead. This capsule will arrive over a month from now, carrying your message into a distant tomorrow.',
    category: 'time_based',
    rarity: 'common',
    icon: 'Compass',
    unlockCriteria: {
      type: 'count',
      stat: 'max_schedule_days',
      threshold: 30,
      operator: '>='
    },
    rewards: { points: 10 },
    visual: {
      gradientStart: '#FB923C',
      gradientEnd: '#EA580C',
      particleColor: '#FDBA74',
      glowColor: '#F97316'
    },
    shareText: 'Scheduled a capsule 30+ days in advance! 📅 #ErasApp',
    hidden: false,
    order: 9
  },

  A010: {
    id: 'A010',
    title: 'Consistent Creator',
    description: 'Create capsules on 3 different days',
    detailedDescription: 'You\'re building a habit. Three separate days of memory-making shows you\'re getting the rhythm of Eras.',
    category: 'time_based',
    rarity: 'common',
    icon: 'Flame',
    unlockCriteria: {
      type: 'count',
      stat: 'unique_creation_days',
      threshold: 3,
      operator: '>='
    },
    rewards: { 
      points: 10,
      title: 'Habit Builder'
    },
    visual: {
      gradientStart: '#10B981',
      gradientEnd: '#047857',
      particleColor: '#6EE7B7',
      glowColor: '#059669'
    },
    shareText: 'Created capsules on 3 different days! 📆 #ErasApp',
    hidden: false,
    order: 10
  },

  // ============================================
  // ROW 2: ERA-THEMED & CONSISTENCY (Order 11-18)
  // ============================================
  B001: {
    id: 'B001',
    title: 'Yesterday\'s Echo',
    description: 'Use the "Yesterday" filter 10 times',
    detailedDescription: 'The warm, nostalgic glow of memories. You\'ve mastered the Yesterday filter, wrapping your moments in a golden hue that whispers of times gone by.',
    category: 'era_themed',
    rarity: 'uncommon',
    icon: 'Sunrise',
    unlockCriteria: {
      type: 'count',
      stat: 'filter_usage.yesterday',
      threshold: 10,
      operator: '>='
    },
    rewards: { points: 25, title: 'Golden Hour Guardian' },
    visual: {
      gradientStart: '#FBBF24',
      gradientEnd: '#EA580C',
      particleColor: '#FCD34D',
      glowColor: '#F59E0B',
      animation: 'pulse'
    },
    eraTheme: 'yesterday',
    shareText: 'Unlocked "Yesterday\'s Echo" in Eras! 🌅 Mastering the art of nostalgia. #ErasApp',
    hidden: false,
    order: 11
  },

  B002: {
    id: 'B002',
    title: 'Future Light',
    description: 'Use the "Future Light" filter 10 times',
    detailedDescription: 'Illuminating tomorrow with hope and wonder. The Future Light filter has become your signature.',
    category: 'era_themed',
    rarity: 'uncommon',
    icon: 'Stars',
    unlockCriteria: {
      type: 'count',
      stat: 'filter_usage.future_light',
      threshold: 10,
      operator: '>='
    },
    rewards: { points: 25, title: 'Neon Dreamer' },
    visual: {
      gradientStart: '#22D3EE',
      gradientEnd: '#0284C7',
      particleColor: '#67E8F9',
      glowColor: '#06B6D4',
      animation: 'pulse'
    },
    eraTheme: 'future_light',
    shareText: 'Mastered the Future Light! 💫 #ErasApp',
    hidden: false,
    order: 12
  },

  B003: {
    id: 'B003',
    title: 'Dream Weaver',
    description: 'Use the "Dream" filter 10 times',
    detailedDescription: 'Reality blurs into fantasy. You\'ve perfected the ethereal, dreamlike quality that makes memories feel magical.',
    category: 'era_themed',
    rarity: 'uncommon',
    icon: 'Cloud',
    unlockCriteria: {
      type: 'count',
      stat: 'filter_usage.dream',
      threshold: 10,
      operator: '>='
    },
    rewards: { points: 25, title: 'Surrealist' },
    visual: {
      gradientStart: '#818CF8',
      gradientEnd: '#4F46E5',
      particleColor: '#C7D2FE',
      glowColor: '#6366F1',
      animation: 'pulse'
    },
    eraTheme: 'dream',
    shareText: 'Mastered the Dream filter! 🎨 #ErasApp',
    hidden: false,
    order: 13
  },

  B004: {
    id: 'B004',
    title: 'Effect Master',
    description: 'Use all 8 audio filters',
    detailedDescription: 'A true master of atmosphere. You\'ve experimented with every audio filter Eras offers - Yesterday, Future Light, Echo, Dream, and all the rest.',
    category: 'era_themed',
    rarity: 'rare',
    icon: 'Radio',
    unlockCriteria: {
      type: 'combo',
      requirements: [
        { stat: 'filter_usage.yesterday', threshold: 1, operator: '>=' },
        { stat: 'filter_usage.future_light', threshold: 1, operator: '>=' },
        { stat: 'filter_usage.echo', threshold: 1, operator: '>=' },
        { stat: 'filter_usage.dream', threshold: 1, operator: '>=' },
        { stat: 'filter_usage.vintage', threshold: 1, operator: '>=' },
        { stat: 'filter_usage.cosmic', threshold: 1, operator: '>=' },
        { stat: 'filter_usage.underwater', threshold: 1, operator: '>=' },
        { stat: 'filter_usage.cathedral', threshold: 1, operator: '>=' }
      ]
    },
    rewards: { points: 75, title: 'Audio Alchemist' },
    visual: {
      gradientStart: '#F472B6',
      gradientEnd: '#E11D48',
      particleColor: '#FBCFE8',
      glowColor: '#EC4899',
      animation: 'rainbow'
    },
    shareText: 'Became an Effect Master in Eras! ✨ Mastered all 8 audio filters. #ErasApp',
    hidden: false,
    order: 14
  },

  B005: {
    id: 'B005',
    title: 'Sticker Collector',
    description: 'Use 50+ stickers across capsules',
    detailedDescription: 'You\'ve embraced the playful side of memory-making. Stickers add personality and joy to your time capsules.',
    category: 'era_themed',
    rarity: 'rare',
    icon: 'Sticker',
    unlockCriteria: {
      type: 'count',
      stat: 'stickers_used',
      threshold: 50,
      operator: '>='
    },
    rewards: { points: 50, title: 'Sticker Master' },
    visual: {
      gradientStart: '#FB923C',
      gradientEnd: '#DC2626',
      particleColor: '#FDBA74',
      glowColor: '#F97316',
      animation: 'pulse'
    },
    shareText: 'Became a Sticker Collector! 🎭 50+ stickers used in Eras. #ErasApp',
    hidden: false,
    order: 15
  },

  B006: {
    id: 'B006',
    title: 'Memory Revisited',
    description: 'Edit 5 existing capsules after creation',
    detailedDescription: 'Memories aren\'t set in stone. You\'ve gone back to refine, update, or enhance 5 of your time capsules before they\'re delivered.',
    category: 'enhance',
    rarity: 'uncommon',
    icon: 'Wand2',
    unlockCriteria: {
      type: 'count',
      stat: 'capsules_edited',
      threshold: 5,
      operator: '>='
    },
    rewards: { points: 30, title: 'Time Sculptor' },
    visual: {
      gradientStart: '#14B8A6',
      gradientEnd: '#0D9488',
      particleColor: '#5EEAD4',
      glowColor: '#14B8A6'
    },
    shareText: 'Edited 5 capsules in Eras! 🔄 #ErasApp',
    hidden: false,
    order: 16
  },

  B007: {
    id: 'B007',
    title: 'Social Butterfly',
    description: 'Send capsules to 5 different recipients',
    detailedDescription: 'You\'re spreading memories across your circle. Five unique people will receive time capsules from you.',
    category: 'special',
    rarity: 'uncommon',
    icon: 'Heart',
    unlockCriteria: {
      type: 'count',
      stat: 'unique_recipients',
      threshold: 5,
      operator: '>='
    },
    rewards: { points: 35, title: 'Memory Broadcaster' },
    visual: {
      gradientStart: '#FB7185',
      gradientEnd: '#E11D48',
      particleColor: '#FECDD3',
      glowColor: '#FB7185'
    },
    shareText: 'Became a Social Butterfly! 🦋 Sent capsules to 5 people. #ErasApp',
    hidden: false,
    order: 17
  },

  C002: {
    id: 'C002',
    title: 'Weekly Ritual',
    description: 'Create capsules for 7 consecutive days',
    detailedDescription: 'Consistency is the key to meaningful documentation. You\'ve made Eras part of your daily life.',
    category: 'time_based',
    rarity: 'uncommon',
    icon: 'CalendarDays',
    unlockCriteria: {
      type: 'streak',
      stat: 'current_streak',
      threshold: 7,
      operator: '>='
    },
    rewards: { points: 50, title: 'Ritual Keeper' },
    visual: {
      gradientStart: '#34D399',
      gradientEnd: '#059669',
      particleColor: '#6EE7B7',
      glowColor: '#10B981'
    },
    shareText: '7-day streak unlocked! 📅 Making memories daily with Eras. #ErasApp',
    hidden: false,
    order: 18
  },

  // ============================================
  // ROW 3: TIME & VOLUME MASTERY (Order 19-27)
  // ============================================
  C001: {
    id: 'C001',
    title: 'Time Traveler',
    description: 'Successfully deliver a capsule scheduled 1+ year in advance',
    detailedDescription: 'You\'ve sent a message across the chasm of time. A capsule scheduled for a year or more from now shows true faith in the future.',
    category: 'time_based',
    rarity: 'rare',
    icon: 'Satellite',
    unlockCriteria: {
      type: 'time_wait',
      stat: 'max_schedule_days',
      threshold: 365,
      operator: '>='
    },
    rewards: { points: 100, title: 'Chrononaut' },
    visual: {
      gradientStart: '#C084FC',
      gradientEnd: '#EC4899',
      particleColor: '#E9D5FF',
      glowColor: '#A855F7',
      animation: 'shimmer'
    },
    shareText: 'Just became a Time Traveler in Eras! ⏰ Sending messages to 2026 and beyond. #ErasApp #TimeCapsule',
    hidden: false,
    order: 19
  },

  C003: {
    id: 'C003',
    title: 'Monthly Chronicle',
    description: 'Create at least 1 capsule per month for 6 months',
    detailedDescription: 'Half a year of consistent memory-making. You\'ve built a lasting habit of preserving your life\'s moments.',
    category: 'time_based',
    rarity: 'rare',
    icon: 'Medal',
    unlockCriteria: {
      type: 'specific_action',
      action: 'monthly_streak_check',
      threshold: 6
    },
    rewards: { points: 75, title: 'Chronicler' },
    visual: {
      gradientStart: '#10B981',
      gradientEnd: '#047857',
      particleColor: '#6EE7B7',
      glowColor: '#059669'
    },
    shareText: '6 months of consistent capsule creation! 🗓️ #ErasApp',
    hidden: false,
    order: 20
  },

  C004: {
    id: 'C004',
    title: 'Anniversary',
    description: 'Been using Eras for 1 year',
    detailedDescription: 'A full year of preserving memories. You\'ve been with Eras through all four seasons.',
    category: 'time_based',
    rarity: 'rare',
    icon: 'PartyPopper',
    unlockCriteria: {
      type: 'specific_action',
      action: 'account_age_check',
      threshold: 365
    },
    rewards: { points: 100, title: 'Veteran' },
    visual: {
      gradientStart: '#F59E0B',
      gradientEnd: '#D97706',
      particleColor: '#FCD34D',
      glowColor: '#FBBF24',
      animation: 'shimmer'
    },
    shareText: 'Celebrating 1 year with Eras! 🎂 #ErasApp #Anniversary',
    hidden: false,
    order: 21
  },

  D001: {
    id: 'D001',
    title: 'Capsule Collector',
    description: 'Create 10 capsules',
    detailedDescription: 'You\'re building a rich archive of memories and moments.',
    category: 'volume',
    rarity: 'uncommon',
    icon: 'Package',
    unlockCriteria: {
      type: 'count',
      stat: 'capsules_created',
      threshold: 10,
      operator: '>='
    },
    rewards: { points: 30, title: 'Vault Starter' },
    visual: {
      gradientStart: '#60A5FA',
      gradientEnd: '#2563EB',
      particleColor: '#93C5FD',
      glowColor: '#3B82F6'
    },
    shareText: 'Created 10 time capsules! 📦 #ErasApp',
    hidden: false,
    order: 22
  },

  D002: {
    id: 'D002',
    title: 'Archivist',
    description: 'Create 50 capsules',
    detailedDescription: 'You\'re not just documenting life - you\'re curating it. An impressive collection.',
    category: 'volume',
    rarity: 'rare',
    icon: 'Library',
    unlockCriteria: {
      type: 'count',
      stat: 'capsules_created',
      threshold: 50,
      operator: '>='
    },
    rewards: { points: 100, title: 'Master Archivist' },
    visual: {
      gradientStart: '#818CF8',
      gradientEnd: '#4F46E5',
      particleColor: '#C7D2FE',
      glowColor: '#6366F1'
    },
    shareText: '50 time capsules created! 🗃️ I\'m an Archivist in Eras. #ErasApp',
    hidden: false,
    order: 23
  },

  D003: {
    id: 'D003',
    title: 'Historian',
    description: 'Create 100 capsules',
    detailedDescription: 'A legendary achievement. You\'ve documented a century of moments.',
    category: 'volume',
    rarity: 'rare',
    icon: 'ScrollText',
    unlockCriteria: {
      type: 'count',
      stat: 'capsules_created',
      threshold: 100,
      operator: '>='
    },
    rewards: { points: 200, title: 'Grand Historian' },
    visual: {
      gradientStart: '#FBBF24',
      gradientEnd: '#D97706',
      particleColor: '#FCD34D',
      glowColor: '#F59E0B',
      animation: 'shimmer'
    },
    shareText: '100 time capsules! 🏛️ I\'m a Historian in Eras. #ErasApp',
    hidden: false,
    order: 24
  },

  D004: {
    id: 'D004',
    title: 'Legend',
    description: 'Create 500 capsules',
    detailedDescription: 'An extraordinary milestone. You\'ve built an epic archive of 500 time capsules - a true legend of memory preservation.',
    category: 'volume',
    rarity: 'legendary',
    icon: 'Gem',
    unlockCriteria: {
      type: 'count',
      stat: 'capsules_created',
      threshold: 500,
      operator: '>='
    },
    rewards: { points: 500, title: 'Legend' },
    visual: {
      gradientStart: '#F59E0B',
      gradientEnd: '#DC2626',
      particleColor: '#FCD34D',
      glowColor: '#F97316',
      animation: 'rainbow'
    },
    shareText: '500 time capsules created! 🌟 I\'m a Legend in Eras. #ErasApp',
    hidden: false,
    order: 25
  },

  D005: {
    id: 'D005',
    title: 'Media Mogul',
    description: 'Upload 100 media files total',
    detailedDescription: 'Photos, videos, audio - you\'ve preserved a vast multimedia archive.',
    category: 'volume',
    rarity: 'rare',
    icon: 'ImagePlay',
    unlockCriteria: {
      type: 'count',
      stat: 'media_uploaded',
      threshold: 100,
      operator: '>='
    },
    rewards: { points: 75 },
    visual: {
      gradientStart: '#F472B6',
      gradientEnd: '#DB2777',
      particleColor: '#FBCFE8',
      glowColor: '#EC4899'
    },
    shareText: 'Uploaded 100 media files! 💎 #ErasApp',
    hidden: false,
    order: 26
  },

  E001: {
    id: 'E001',
    title: 'Night Owl',
    description: 'Create a capsule between 12 AM - 3 AM',
    detailedDescription: 'The world sleeps, but you\'re wide awake with thoughts to preserve. Created a capsule in the quiet hours when creativity flows differently.',
    category: 'special',
    rarity: 'rare',
    icon: 'MoonStar',
    unlockCriteria: {
      type: 'specific_action',
      action: 'capsule_created_at_hour_range',
      threshold: [0, 3] // 12 AM (hour 0) to 3 AM (hour 3, exclusive)
    },
    rewards: { points: 50, title: 'Midnight Chronicler' },
    visual: {
      gradientStart: '#6366F1',
      gradientEnd: '#312E81',
      particleColor: '#A5B4FC',
      glowColor: '#4F46E5'
    },
    shareText: 'Unlocked the rare "Night Owl" achievement! 🌙 Creating memories in the midnight hours. #ErasApp',
    hidden: true,
    order: 27
  },

  // ============================================
  // ROW 4: SPECIAL & LEGENDARY (Order 28-36)
  // ============================================

  E002: {
    id: 'E002',
    title: 'Echo Chamber',
    description: 'Receive 50 echoes across all your capsules',
    detailedDescription: 'Your memories resonate! You\'ve sparked 50 emotional connections, proving your stories touch hearts across time and space.',
    category: 'special',
    rarity: 'rare',
    icon: 'Radio',
    unlockCriteria: {
      type: 'specific_action',
      action: 'received_50_echoes'
    },
    rewards: { points: 75, title: 'Echo Magnet' },
    visual: {
      gradientStart: '#8B5CF6',
      gradientEnd: '#6366F1',
      particleColor: '#C4B5FD',
      glowColor: '#7C3AED',
      animation: 'pulse'
    },
    shareText: 'Unlocked Echo Chamber! 🌊 50 echoes received across my time capsules. #ErasApp',
    hidden: false,
    order: 28
  },

  E003: {
    id: 'E003',
    title: 'Vault Guardian',
    description: 'Set up Legacy Access with beneficiaries',
    detailedDescription: 'You\'ve planned for the unplannable. Your digital legacy is secured for those who matter most.',
    category: 'special',
    rarity: 'rare',
    icon: 'Shield',
    unlockCriteria: {
      type: 'specific_action',
      action: 'legacy_vault_setup'
    },
    rewards: { points: 100, title: 'Legacy Guardian' },
    visual: {
      gradientStart: '#A78BFA',
      gradientEnd: '#6D28D9',
      particleColor: '#DDD6FE',
      glowColor: '#8B5CF6',
      animation: 'shimmer'
    },
    shareText: 'Secured my digital legacy! 🔮 #ErasApp',
    hidden: false,
    order: 29
  },

  E004: {
    id: 'E004',
    title: 'Cinematic',
    description: 'Create a capsule with 10+ media files',
    detailedDescription: 'You\'ve created a multimedia masterpiece. A capsule packed with 10 or more photos, videos, and audio creates a rich, cinematic experience.',
    category: 'special',
    rarity: 'rare',
    icon: 'Clapperboard',
    unlockCriteria: {
      type: 'specific_action',
      action: 'capsule_with_10_media'
    },
    rewards: { points: 75, title: 'Cinematographer' },
    visual: {
      gradientStart: '#8B5CF6',
      gradientEnd: '#6D28D9',
      particleColor: '#C4B5FD',
      glowColor: '#7C3AED',
      animation: 'pulse'
    },
    shareText: 'Created a cinematic capsule with 10+ media files! 📺 #ErasApp',
    hidden: false,
    order: 30
  },

  E005: {
    id: 'E005',
    title: 'Globe Trotter',
    description: 'Send capsules to 10+ different recipients',
    detailedDescription: 'You\'re spreading memories across your social circle. Ten or more unique recipients have received your time capsules.',
    category: 'special',
    rarity: 'rare',
    icon: 'Globe',
    unlockCriteria: {
      type: 'count',
      stat: 'unique_recipients',
      threshold: 10,
      operator: '>='
    },
    rewards: { points: 80, title: 'Social Connector' },
    visual: {
      gradientStart: '#10B981',
      gradientEnd: '#047857',
      particleColor: '#6EE7B7',
      glowColor: '#059669',
      animation: 'pulse'
    },
    shareText: 'Became a Globe Trotter! 🌍 Sent capsules to 10+ people. #ErasApp',
    hidden: false,
    order: 31
  },

  E006: {
    id: 'E006',
    title: 'Time Lord',
    description: 'Have active capsules scheduled across 5+ different years',
    detailedDescription: 'You\'re playing the long game. With capsules scheduled across five or more different years, you\'ve shown exceptional commitment to your future self.',
    category: 'time_based',
    rarity: 'legendary',
    icon: 'Clock',
    unlockCriteria: {
      type: 'specific_action',
      action: 'capsules_across_years',
      threshold: 5
    },
    rewards: { points: 100, title: 'Time Lord' },
    visual: {
      gradientStart: '#8B5CF6',
      gradientEnd: '#6D28D9',
      particleColor: '#C4B5FD',
      glowColor: '#7C3AED',
      animation: 'rainbow'
    },
    shareText: 'Became a Time Lord! ⏳ Capsules across 5+ years. #ErasApp',
    hidden: false,
    order: 32
  },

  E007: {
    id: 'E007',
    title: 'Master Curator',
    description: 'Apply 100+ total enhancements across all capsules',
    detailedDescription: 'You\'ve become an artist of memory. With over 100 filters, effects, stickers, and enhancements applied, you\'re crafting masterpieces.',
    category: 'enhance',
    rarity: 'legendary',
    icon: 'Crown',
    unlockCriteria: {
      type: 'count',
      stat: 'enhancements_used',
      threshold: 100,
      operator: '>='
    },
    rewards: { points: 100, title: 'Master Curator' },
    visual: {
      gradientStart: '#FBBF24',
      gradientEnd: '#F59E0B',
      particleColor: '#FCD34D',
      glowColor: '#FBBF24',
      animation: 'shimmer'
    },
    shareText: 'Became a Master Curator! 👑 100+ enhancements applied. #ErasApp',
    hidden: false,
    order: 33
  },

  E008: {
    id: 'E008',
    title: 'Archive Master',
    description: 'Create 750 capsules',
    detailedDescription: 'An extraordinary milestone. Seven hundred and fifty time capsules - you\'ve built a legendary archive that spans countless moments of your life.',
    category: 'volume',
    rarity: 'legendary',
    icon: 'Trophy',
    unlockCriteria: {
      type: 'count',
      stat: 'capsules_created',
      threshold: 750,
      operator: '>='
    },
    rewards: { points: 150, title: 'Archive Master' },
    visual: {
      gradientStart: '#EAB308',
      gradientEnd: '#CA8A04',
      particleColor: '#FDE047',
      glowColor: '#FACC15',
      animation: 'rainbow'
    },
    shareText: 'Became an Archive Master! 🏆 750 capsules created. #ErasApp',
    hidden: false,
    order: 34
  },

  E009: {
    id: 'E009',
    title: 'Perfect Chronicle',
    description: 'Create 14 consecutive days of capsules, each with media',
    detailedDescription: 'Flawless consistency. You\'ve created capsules with media for 14 consecutive days, demonstrating mastery of quality memory-making.',
    category: 'time_based',
    rarity: 'legendary',
    icon: 'Target',
    unlockCriteria: {
      type: 'specific_action',
      action: 'consecutive_media_capsules',
      threshold: 14
    },
    rewards: { points: 100, title: 'Perfect Chronicler' },
    visual: {
      gradientStart: '#F43F5E',
      gradientEnd: '#BE123C',
      particleColor: '#FDA4AF',
      glowColor: '#F43F5E',
      animation: 'shimmer'
    },
    shareText: 'Achieved Perfect Chronicle! 🎯 14 days of media-rich capsules. #ErasApp',
    hidden: false,
    order: 35
  },

  A036: {
    id: 'A036',
    title: 'Multimedia Maestro',
    description: 'Create a capsule with all 4 media types',
    detailedDescription: 'A symphony of memories! You\'ve crafted a capsule containing photos, videos, audio, and text - the ultimate multi-sensory experience.',
    category: 'special',
    rarity: 'uncommon',
    icon: 'Layers',
    unlockCriteria: {
      type: 'specific_action',
      action: 'capsule_with_all_media_types'
    },
    rewards: { points: 30, title: 'Multimedia Virtuoso' },
    visual: {
      gradientStart: '#06B6D4',
      gradientEnd: '#0891B2',
      particleColor: '#67E8F9',
      glowColor: '#06B6D4',
      animation: 'shimmer'
    },
    shareText: 'Created a multimedia masterpiece! 🎨 All 4 media types in one capsule. #ErasApp',
    hidden: false,
    order: 36
  },

  // ============================================
  // ROW 5: NEW ACHIEVEMENTS v2.1.0 (Order 37-45)
  // ============================================

  A037: {
    id: 'A037',
    title: 'Shared Achievement',
    description: 'Share an achievement to social media',
    detailedDescription: 'Spreading the word! You\'ve shared one of your Eras achievements with the world.',
    category: 'special',
    rarity: 'common',
    icon: 'Share2',
    unlockCriteria: {
      type: 'specific_action',
      action: 'achievement_shared_to_social'
    },
    rewards: { points: 15 },
    visual: {
      gradientStart: '#60A5FA',
      gradientEnd: '#3B82F6',
      particleColor: '#93C5FD',
      glowColor: '#2563EB'
    },
    shareText: 'Shared my first achievement! 📣 Building memories with Eras. #ErasApp',
    hidden: false,
    order: 37
  },

  A038: {
    id: 'A038',
    title: 'Storyteller',
    description: 'Write a capsule with 500+ words',
    detailedDescription: 'Words flow like rivers through time. You\'ve crafted a detailed, immersive narrative capsule that truly captures a moment in depth.',
    category: 'special',
    rarity: 'uncommon',
    icon: 'BookOpen',
    unlockCriteria: {
      type: 'specific_action',
      action: 'capsule_with_500_words'
    },
    rewards: { points: 25, title: 'Word Painter' },
    visual: {
      gradientStart: '#818CF8',
      gradientEnd: '#6366F1',
      particleColor: '#C7D2FE',
      glowColor: '#4F46E5'
    },
    shareText: 'Became a Storyteller! 📖 Wrote a 500+ word time capsule. #ErasApp',
    hidden: false,
    order: 38
  },

  // ============================================
  // ONBOARDING ACHIEVEMENTS (Order 39-40)
  // ============================================

  time_keeper: {
    id: 'time_keeper',
    title: 'Time Keeper',
    description: 'Complete your first capsule tutorial',
    detailedDescription: 'The journey of a thousand time capsules begins with a single sealed moment. You\'ve mastered the basics and created your first memory to preserve.',
    category: 'starter',
    rarity: 'uncommon',
    icon: 'Hourglass',
    unlockCriteria: {
      type: 'specific_action',
      action: 'onboarding_first_capsule_complete'
    },
    rewards: { 
      points: 50,
      title: 'Chrono Apprentice'
    },
    visual: {
      gradientStart: '#CD7F32',
      gradientEnd: '#8B4513',
      particleColor: '#DEB887',
      glowColor: '#CD7F32',
      animation: 'rotate'
    },
    shareText: 'Just became a Time Keeper! ⏳ First capsule sealed in Eras. #ErasApp #TimeCapsule',
    hidden: false,
    order: 39
  },

  vault_guardian: {
    id: 'vault_guardian',
    title: 'Vault Guardian',
    description: 'Complete the Vault Mastery tutorial',
    detailedDescription: 'Protector of memories, architect of legacy. You understand the sacred duty of preserving capsules, organizing your vault, and planning for beneficiaries.',
    category: 'special',
    rarity: 'epic',
    icon: 'Landmark',
    unlockCriteria: {
      type: 'specific_action',
      action: 'onboarding_vault_mastery_complete'
    },
    rewards: { 
      points: 200,
      title: 'Legacy Architect'
    },
    visual: {
      gradientStart: '#FFD700',
      gradientEnd: '#FF8C00',
      particleColor: '#FFF8DC',
      glowColor: '#FFD700',
      animation: 'pulse'
    },
    shareText: 'Achieved Vault Guardian status! 🏛️ Master of storage and legacy. #ErasApp',
    hidden: false,
    order: 40
  },

  A039: {
    id: 'A039',
    title: 'Music Memory',
    description: 'Add audio to 20 capsules',
    detailedDescription: 'Sound preservation specialist. You\'ve enriched 20 different time capsules with audio - voices, music, ambient sounds that bring memories to life.',
    category: 'volume',
    rarity: 'uncommon',
    icon: 'Music',
    unlockCriteria: {
      type: 'count',
      stat: 'capsules_with_audio_count',
      threshold: 20,
      operator: '>='
    },
    rewards: { points: 30, title: 'Frequency Keeper' },
    visual: {
      gradientStart: '#F472B6',
      gradientEnd: '#EC4899',
      particleColor: '#FBCFE8',
      glowColor: '#DB2777'
    },
    shareText: 'Became a Sonic Archivist! 🎵 Added audio to 20 capsules. #ErasApp',
    hidden: false,
    order: 39
  },

  A040: {
    id: 'A040',
    title: 'Double Feature',
    description: 'Schedule 2 capsules for the same delivery time',
    detailedDescription: 'Parallel moments converging. You\'ve orchestrated two separate capsules to arrive at the exact same moment - a double dose of memories.',
    category: 'special',
    rarity: 'uncommon',
    icon: 'Copy',
    unlockCriteria: {
      type: 'specific_action',
      action: 'two_capsules_same_delivery_time'
    },
    rewards: { points: 30, title: 'Quantum Scheduler' },
    visual: {
      gradientStart: '#A78BFA',
      gradientEnd: '#7C3AED',
      particleColor: '#DDD6FE',
      glowColor: '#8B5CF6'
    },
    shareText: 'Unlocked Double Feature! 🎬 Two capsules, one moment. #ErasApp',
    hidden: false,
    order: 41
  },

  A041: {
    id: 'A041',
    title: 'Group Hug',
    description: 'Send one capsule to 5+ people',
    detailedDescription: 'Shared joy multiplied. You\'ve sent a single capsule to five or more recipients, spreading the same memory across your circle.',
    category: 'special',
    rarity: 'uncommon',
    icon: 'Users',
    unlockCriteria: {
      type: 'specific_action',
      action: 'capsule_sent_to_5_plus_recipients'
    },
    rewards: { points: 35, title: 'Community Weaver' },
    visual: {
      gradientStart: '#FB7185',
      gradientEnd: '#E11D48',
      particleColor: '#FECDD3',
      glowColor: '#F43F5E'
    },
    shareText: 'Unlocked Group Hug! 🤗 Sent one capsule to 5+ people. #ErasApp',
    hidden: false,
    order: 42
  },

  A042: {
    id: 'A042',
    title: 'Marathon Session',
    description: 'Create 10 capsules in one day',
    detailedDescription: 'An epic burst of creativity and documentation. You\'ve created 10 time capsules in a single day - capturing life at full speed.',
    category: 'special',
    rarity: 'rare',
    icon: 'Zap',
    unlockCriteria: {
      type: 'specific_action',
      action: 'ten_capsules_in_one_day'
    },
    rewards: { points: 60, title: 'Moment Harvester' },
    visual: {
      gradientStart: '#F59E0B',
      gradientEnd: '#DC2626',
      particleColor: '#FCD34D',
      glowColor: '#F97316',
      animation: 'pulse'
    },
    shareText: 'Completed a Marathon Session! 💪 Created 10 capsules in one day. #ErasApp',
    hidden: false,
    order: 43
  },

  A043: {
    id: 'A043',
    title: 'Around the Clock',
    description: 'Create capsules at 12 different hours',
    detailedDescription: 'Time knows no boundaries. You\'ve created capsules at 12 different hours of the day, documenting life around the clock.',
    category: 'time_based',
    rarity: 'rare',
    icon: 'Timer',
    unlockCriteria: {
      type: 'specific_action',
      action: 'capsules_at_12_different_hours'
    },
    rewards: { points: 75, title: 'Eternal Witness' },
    visual: {
      gradientStart: '#14B8A6',
      gradientEnd: '#0D9488',
      particleColor: '#5EEAD4',
      glowColor: '#14B8A6',
      animation: 'pulse'
    },
    shareText: 'Unlocked Around the Clock! 🕐 Created capsules at 12 different hours. #ErasApp',
    hidden: false,
    order: 44
  },

  A044: {
    id: 'A044',
    title: 'Lucky Number',
    description: 'Create capsule #7, #77, and #177',
    detailedDescription: 'Triple sevens in succession. You\'ve reached the mystical milestones of 7, 77, and 177 capsules - the numbers of fortune and completion.',
    category: 'special',
    rarity: 'legendary',
    icon: 'Clover',
    unlockCriteria: {
      type: 'combo',
      requirements: [
        { stat: 'capsules_created', threshold: 177, operator: '>=' }
      ]
    },
    rewards: { points: 120, title: 'Sevenfold Sage' },
    visual: {
      gradientStart: '#FBBF24',
      gradientEnd: '#DC2626',
      particleColor: '#FCD34D',
      glowColor: '#F59E0B',
      animation: 'rainbow'
    },
    shareText: 'Unlocked Lucky Number! 🎰 Reached the legendary 177 capsules. #ErasApp',
    hidden: false,
    order: 45
  },

  A045: {
    id: 'A045',
    title: 'Golden Ratio',
    description: 'Reach 161+ capsules + 100+ media files',
    detailedDescription: 'Mathematical excellence achieved. You\'ve surpassed the Fibonacci milestone of 161 capsules with 100+ media files - the golden ratio of memory preservation.',
    category: 'special',
    rarity: 'epic',
    icon: 'Sparkle',
    unlockCriteria: {
      type: 'combo',
      requirements: [
        { stat: 'capsules_created', threshold: 161, operator: '>=' },
        { stat: 'media_uploaded', threshold: 100, operator: '>=' }
      ]
    },
    rewards: { points: 115, title: 'Harmony Architect' },
    visual: {
      gradientStart: '#C084FC',
      gradientEnd: '#7C3AED',
      particleColor: '#E9D5FF',
      glowColor: '#A855F7',
      animation: 'shimmer'
    },
    shareText: 'Unlocked Golden Ratio! 🏆 Perfect harmony: 161+ capsules + 100+ media. #ErasApp',
    hidden: false,
    order: 46
  },

  // ============================================
  // VAULT ACHIEVEMENTS (Phase 4B) - IDs A046-A047
  // ============================================
  A046: {
    id: 'A046',
    title: 'Memory Architect',
    description: 'Create 5 custom folders in Vault',
    detailedDescription: 'Organization is key to preservation. You\'ve structured your memories by creating 5 custom folders - a true architect of the past.',
    category: 'special',
    rarity: 'uncommon',
    icon: 'FolderTree',
    unlockCriteria: {
      type: 'count',
      stat: 'vault_folders_created',
      threshold: 5,
      operator: '>='
    },
    rewards: { 
      points: 25,
      title: 'Archivist'
    },
    visual: {
      gradientStart: '#3B82F6',
      gradientEnd: '#1D4ED8',
      particleColor: '#93C5FD',
      glowColor: '#2563EB'
    },
    shareText: 'Unlocked Memory Architect! 📁 Organized my Vault with 5 custom folders. #ErasApp',
    hidden: false,
    order: 47
  },

  A047: {
    id: 'A047',
    title: 'Vault Curator',
    description: 'Organize 50 media items into folders',
    detailedDescription: 'Chaos transformed into order. You\'ve meticulously organized 50 media items, proving yourself a master curator of memories.',
    category: 'special',
    rarity: 'rare',
    icon: 'Archive',
    unlockCriteria: {
      type: 'count',
      stat: 'vault_media_organized',
      threshold: 50,
      operator: '>='
    },
    rewards: { 
      points: 50,
      title: 'Keeper of Eras'
    },
    visual: {
      gradientStart: '#8B5CF6',
      gradientEnd: '#6D28D9',
      particleColor: '#C4B5FD',
      glowColor: '#7C3AED'
    },
    shareText: 'Unlocked Vault Curator! 🏛️ Organized 50+ memories in my Vault. #ErasApp',
    hidden: false,
    order: 48
  },

  // ============================================
  // EPIC TIER ACHIEVEMENTS - Phase 2 (IDs A048-A053)
  // ============================================
  
  A048: {
    id: 'A048',
    title: 'Eternal Keeper',
    description: 'Use Eras for 3 consecutive years',
    detailedDescription: 'A testament to dedication. You\'ve been preserving memories with Eras for three full years without interruption - truly eternal in your commitment.',
    category: 'loyalty',
    rarity: 'epic',
    icon: 'Sparkles',
    unlockCriteria: {
      type: 'custom',
      validator: 'check_consecutive_years_3'
    },
    rewards: { 
      points: 200, 
      title: 'Genesis Eternal'
    },
    visual: {
      gradientStart: '#0f0f23',
      gradientEnd: '#8b5cf6',
      particleColor: '#4169e1',
      glowColor: '#1a0a2e',
      animation: 'cosmic-explosion'
    },
    shareText: 'Unlocked Eternal Keeper! 🌌 3 years of preserving memories. Genesis Eternal horizon activated! #ErasApp',
    hidden: false,
    order: 49
  },

  A049: {
    id: 'A049',
    title: 'Theme Connoisseur',
    description: 'Create at least 1 capsule with all 15 themes',
    detailedDescription: 'A master of variety. You\'ve experienced the full spectrum of memory-making by creating capsules with all 15 different themes.',
    category: 'variety',
    rarity: 'epic',
    icon: 'Palette',
    unlockCriteria: {
      type: 'custom',
      validator: 'check_all_themes_used'
    },
    rewards: { 
      points: 200, 
      title: 'Prismatic Dusk'
    },
    visual: {
      gradientStart: '#ec4899',
      gradientEnd: '#3b82f6',
      particleColor: '#8b5cf6',
      glowColor: '#f59e0b',
      animation: 'rainbow-refraction'
    },
    shareText: 'Unlocked Theme Connoisseur! 🌈 Mastered all 15 themes. Prismatic Dusk horizon unlocked! #ErasApp',
    hidden: false,
    order: 49
  },

  A050: {
    id: 'A050',
    title: 'Golden Hour Guardian',
    description: 'Share 50 capsules with recipients',
    detailedDescription: 'A beacon of connection. You\'ve shared 50 time capsules with others, spreading memories and bringing people closer across time.',
    category: 'social',
    rarity: 'epic',
    icon: 'Sunrise',
    unlockCriteria: {
      type: 'count',
      stat: 'capsules_to_others',
      threshold: 50,
      operator: '>='
    },
    rewards: { 
      points: 200, 
      title: 'Dawn Eternal'
    },
    visual: {
      gradientStart: '#fbbf24',
      gradientEnd: '#fb923c',
      particleColor: '#fcd34d',
      glowColor: '#f59e0b',
      animation: 'sunrise-burst'
    },
    shareText: 'Unlocked Golden Hour Guardian! 🌄 Shared 50 capsules with others. Dawn Eternal horizon rises! #ErasApp',
    hidden: false,
    order: 50
  },

  A051: {
    id: 'A051',
    title: 'Multimedia Master',
    description: 'Upload 50 photos, 50 videos, and 50 audio files',
    detailedDescription: 'The ultimate content creator. You\'ve mastered every medium - photos, videos, and audio - uploading 50 of each type.',
    category: 'content',
    rarity: 'epic',
    icon: 'Film',
    unlockCriteria: {
      type: 'combo',
      requirements: [
        { stat: 'media_by_type.photo', threshold: 50, operator: '>=' },
        { stat: 'media_by_type.video', threshold: 50, operator: '>=' },
        { stat: 'media_by_type.audio', threshold: 50, operator: '>=' }
      ]
    },
    rewards: { 
      points: 200, 
      title: 'Creative Nexus'
    },
    visual: {
      gradientStart: '#06b6d4',
      gradientEnd: '#ec4899',
      particleColor: '#fbbf24',
      glowColor: '#8b5cf6',
      animation: 'media-convergence'
    },
    shareText: 'Unlocked Multimedia Master! 🎬 50 photos + 50 videos + 50 audio. Creative Nexus horizon converges! #ErasApp',
    hidden: false,
    order: 51
  },

  A052: {
    id: 'A052',
    title: 'Memory Weaver',
    description: 'Create 100 capsules with photos or videos',
    detailedDescription: 'A keeper of visual memories. You\'ve woven together 100 capsules filled with photos and videos, creating a beautiful tapestry of life\'s moments.',
    category: 'content',
    rarity: 'epic',
    icon: 'Heart',
    unlockCriteria: {
      type: 'count',
      stat: 'capsules_with_media_count',
      threshold: 100,
      operator: '>='
    },
    rewards: { 
      points: 200, 
      title: 'Nostalgia Weaver'
    },
    visual: {
      gradientStart: '#d97706',
      gradientEnd: '#92400e',
      particleColor: '#fbbf24',
      glowColor: '#78350f',
      animation: 'thread-weaving'
    },
    shareText: 'Unlocked Memory Weaver! 🧵 100 visual memories woven together into a tapestry of time. #ErasApp',
    hidden: false,
    order: 52
  },

  A053: {
    id: 'A053',
    title: 'Community Beacon',
    description: 'Receive echoes from 25 different people',
    detailedDescription: 'Your capsules resonate across communities. You\'ve received echoes from 25 different people, proving your memories inspire meaningful connections.',
    category: 'engagement',
    rarity: 'epic',
    icon: 'Users',
    unlockCriteria: {
      type: 'custom',
      validator: 'check_unique_echo_senders'
    },
    rewards: { 
      points: 200
      // NO title unlock - just like "Shared Achievement"
    },
    visual: {
      gradientStart: '#10b981',
      gradientEnd: '#059669',
      particleColor: '#6ee7b7',
      glowColor: '#047857',
      animation: 'community-pulse'
    },
    shareText: 'Unlocked Community Beacon! 🌟 Received echoes from 25 different people. Building bridges through memories! #ErasApp',
    hidden: false,
    order: 53
  },

  // ============================================
  // ECHO ACHIEVEMENTS (Phase 1) - IDs ECH001-ECH002
  // ============================================

  ECH001: {
    id: 'ECH001',
    title: 'Echo Initiate',
    description: 'Send your first echo',
    detailedDescription: 'You\'ve sent your first echo! This simple gesture closes the emotional loop, letting senders know their capsule was appreciated.',
    category: 'engagement',
    rarity: 'common',
    icon: 'MessageCircle',
    unlockCriteria: {
      type: 'count',
      stat: 'echoes_sent',
      threshold: 1,
      operator: '>='
    },
    rewards: { points: 10 },
    visual: {
      gradientStart: '#60A5FA',
      gradientEnd: '#3B82F6',
      particleColor: '#93C5FD',
      glowColor: '#2563EB'
    },
    shareText: 'Sent my first echo in Eras! 💫 #ErasApp',
    hidden: false,
    order: 54
  },

  ECH002: {
    id: 'ECH002',
    title: 'Warm Wave',
    description: 'Send 10 echoes',
    detailedDescription: 'You\'re spreading appreciation throughout Eras. Ten echoes sent means ten moments where someone felt heard and valued.',
    category: 'engagement',
    rarity: 'uncommon',
    icon: 'Waves',
    unlockCriteria: {
      type: 'count',
      stat: 'echoes_sent',
      threshold: 10,
      operator: '>='
    },
    rewards: { 
      points: 25,
      title: 'Echo Artisan'
    },
    visual: {
      gradientStart: '#34D399',
      gradientEnd: '#10B981',
      particleColor: '#6EE7B7',
      glowColor: '#059669'
    },
    shareText: 'Sent 10 echoes in Eras! 🌊 Spreading appreciation. #ErasApp',
    hidden: false,
    order: 55
  },

  // ============================================
  // MULTI-RECIPIENT ACHIEVEMENTS (Phase 1 A1) - IDs MR001-MR002
  // ============================================

  MR001: {
    id: 'MR001',
    title: 'Circle of Trust',
    description: 'Send one capsule to 5 recipients',
    detailedDescription: 'You\'ve brought five people into a shared moment. This capsule will reach multiple hearts at once, creating a circle of connection across time.',
    category: 'special',
    rarity: 'uncommon',
    icon: 'Users',
    unlockCriteria: {
      type: 'specific_action',
      action: 'multi_recipient_capsule',
      threshold: 5,
      operator: '>='
    },
    rewards: { 
      points: 35,
      title: 'Circle Keeper'
    },
    visual: {
      gradientStart: '#F59E0B',
      gradientEnd: '#D97706',
      particleColor: '#FCD34D',
      glowColor: '#F59E0B',
      animation: 'pulse'
    },
    shareText: 'Unlocked Circle of Trust! ⭕ Sent a capsule to 5 people at once. #ErasApp',
    hidden: false,
    order: 50
  },

  MR002: {
    id: 'MR002',
    title: 'Grand Broadcast',
    description: 'Send one capsule to 10 recipients',
    detailedDescription: 'A perfect ten. You\'ve orchestrated a grand broadcast, sending a single message to ten people simultaneously. This is the art of mass connection across time.',
    category: 'special',
    rarity: 'rare',
    icon: 'Broadcast',
    unlockCriteria: {
      type: 'specific_action',
      action: 'multi_recipient_capsule',
      threshold: 10,
      operator: '>='
    },
    rewards: { 
      points: 50,
      title: 'The Broadcaster'
    },
    visual: {
      gradientStart: '#8B5CF6',
      gradientEnd: '#6D28D9',
      particleColor: '#C4B5FD',
      glowColor: '#7C3AED',
      animation: 'shimmer'
    },
    shareText: 'Unlocked Grand Broadcast! 📡 Sent a capsule to 10 people at once! #ErasApp',
    hidden: false,
    order: 51
  }
};

// ============================================
// USER STATS INTERFACE
// ============================================

export interface UserStats {
  capsules_created: number;
  capsules_sent: number;
  capsules_received: number;
  capsules_opened: number;
  capsules_deleted: number;
  media_uploaded: number;
  media_by_type: {
    photo: number;
    video: number;
    audio: number;
  };
  total_media_size_mb: number;
  filter_usage: {
    yesterday: number;
    future_light: number;
    echo: number;
    dream: number;
    vintage: number;
    cosmic: number;
    underwater: number;
    cathedral: number;
  };
  stickers_used: number;
  text_overlays_added: number;
  enhancements_used: number;
  max_schedule_days: number;
  min_schedule_days: number;
  avg_schedule_days: number;
  current_streak: number;
  longest_streak: number;
  last_capsule_date: string;
  total_recipients: number;
  unique_recipients: number;
  capsules_to_self: number;
  capsules_to_others: number;
  legacy_vault_setup: boolean;
  beneficiaries_added: number;
  night_owl_capsules: number;
  account_created_at: string;
  days_since_signup: number;
  achievement_count: number;
  achievement_points: number;
  rarest_achievement: string | null;
  first_capsule_at: string | null;
  most_recent_capsule_at: string | null;
  last_stats_update: string;
  monthly_active_months: number; // Track how many months user has been active
  monthly_streak: number; // Current consecutive months with at least 1 capsule
  cinematic_capsules: number; // Capsules with 10+ media files
  unique_recipient_emails: string[]; // Track unique recipients for Globe Trotter
  capsules_edited: number; // Track edits for Memory Revisited
  unique_creation_days: number; // Track unique days for Consistent Creator
  creation_day_set: string[]; // Track set of unique creation days (YYYY-MM-DD)
  multimedia_capsules: number; // Capsules with 3+ content types
  capsule_years: number[]; // Track years with scheduled capsules for Time Lord
  consecutive_media_days: number; // Track consecutive days with media capsules for Perfect Chronicle
  last_media_capsule_date: string; // Last date a media capsule was created
  
  // NEW STATS - v2.1.0
  onboarding_first_capsule_complete?: boolean; // Track tutorial completion
  onboarding_vault_mastery_complete?: boolean; // Track tutorial completion
  social_shares_count: number; // Track social shares for Shared Achievement
  capsules_with_audio_count: number; // Track capsules with audio for Music Memory
  capsule_delivery_times: string[]; // Track delivery times for Double Feature (ISO strings)
  capsule_creation_hours: number[]; // Track unique hours for Around the Clock
  daily_capsule_counts: { [date: string]: number }; // Track capsules per day for Marathon Session
  
  // VAULT STATS - v2.2.0 (Phase 4B)
  vault_folders_created: number; // Total custom folders created
  vault_media_organized: number; // Total media items moved into folders
  vault_auto_organize_used: number; // Times auto-organize was used
  vault_smart_folders_created: number; // Smart folders (Photos, Videos, Audio)
  
  // ECHO STATS - v2.3.0 (Phase 1 Echoes)
  echoes_sent: number; // Total echoes sent (emoji + text)
  echoes_received: number; // Total echoes received on user's capsules
  emoji_echoes_sent: number; // Emoji reactions sent
  text_echoes_sent: number; // Text notes sent
  unique_echo_senders?: string[]; // Array of unique sender emails
  unique_echo_senders_count?: number; // Number of unique people who sent echoes
  
  // EPIC TIER STATS - v2.5.0 (Phase 2 Epic Achievements)
  themes_used?: { [theme: string]: number }; // Track usage count for each theme
  hourly_capsule_counts?: { [hour: string]: number }; // Track capsules created at each hour (0-23)
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getNestedStat(stats: UserStats, path: string): number {
  const parts = path.split('.');
  let value: any = stats;
  
  for (const part of parts) {
    if (value && typeof value === 'object') {
      value = value[part];
    } else {
      return 0;
    }
  }
  
  return typeof value === 'number' ? value : 0;
}

function compareValues(value: number, threshold: number, operator: string = '>='): boolean {
  switch (operator) {
    case '>=': return value >= threshold;
    case '>': return value > threshold;
    case '==': return value === threshold;
    case '<=': return value <= threshold;
    case '<': return value < threshold;
    default: return false;
  }
}

function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Initialize default user stats
 */
function initializeUserStats(): UserStats {
  return {
    capsules_created: 0,
    capsules_sent: 0,
    capsules_received: 0,
    capsules_opened: 0,
    capsules_deleted: 0,
    media_uploaded: 0,
    media_by_type: { photo: 0, video: 0, audio: 0 },
    total_media_size_mb: 0,
    filter_usage: {
      yesterday: 0,
      future_light: 0,
      echo: 0,
      dream: 0,
      vintage: 0,
      cosmic: 0,
      underwater: 0,
      cathedral: 0
    },
    stickers_used: 0,
    text_overlays_added: 0,
    enhancements_used: 0,
    max_schedule_days: 0,
    min_schedule_days: 0,
    avg_schedule_days: 0,
    current_streak: 0,
    longest_streak: 0,
    last_capsule_date: '',
    total_recipients: 0,
    unique_recipients: 0,
    capsules_to_self: 0,
    capsules_to_others: 0,
    legacy_vault_setup: false,
    beneficiaries_added: 0,
    night_owl_capsules: 0,
    account_created_at: new Date().toISOString(),
    days_since_signup: 0,
    achievement_count: 0,
    achievement_points: 0,
    rarest_achievement: null,
    first_capsule_at: null,
    most_recent_capsule_at: null,
    last_stats_update: new Date().toISOString(),
    monthly_active_months: 0,
    monthly_streak: 0,
    cinematic_capsules: 0,
    unique_recipient_emails: [],
    capsules_edited: 0,
    unique_creation_days: 0,
    creation_day_set: [],
    multimedia_capsules: 0,
    capsule_years: [],
    consecutive_media_days: 0,
    last_media_capsule_date: '',
    
    // NEW STATS - v2.1.0
    social_shares_count: 0,
    capsules_with_audio_count: 0,
    capsules_with_media_count: 0,
    capsule_delivery_times: [],
    capsule_creation_hours: [],
    daily_capsule_counts: {},
    
    // VAULT STATS - v2.2.0
    vault_folders_created: 0,
    vault_media_organized: 0,
    vault_auto_organize_used: 0,
    vault_smart_folders_created: 0,
    
    // ECHO STATS - v2.3.0
    echoes_sent: 0,
    echoes_received: 0,
    emoji_echoes_sent: 0,
    text_echoes_sent: 0,
    unique_echo_senders: [],
    unique_echo_senders_count: 0,
    
    // MULTI-RECIPIENT STATS - v2.4.0
    max_recipients_in_single_capsule: 0,
    total_multi_recipient_capsules: 0,
    
    // EPIC TIER STATS - v2.5.0
    themes_used: {},
    hourly_capsule_counts: {}
  };
}

// ============================================
// CRITERIA EVALUATION
// ============================================

function evaluateCriteria(
  achievement: Achievement,
  stats: UserStats,
  action: string,
  metadata: any
): boolean {
  const { type, stat, threshold, operator, action: criteriaAction, requirements } = achievement.unlockCriteria;
  
  switch (type) {
    case 'count':
      if (!stat || threshold === undefined) return false;
      const value = getNestedStat(stats, stat);
      return compareValues(value, threshold, operator || '>=');
      
    case 'streak':
      if (!stat || threshold === undefined) return false;
      return compareValues(stats.current_streak, threshold, operator || '>=');
      
    case 'time_wait':
      if (!stat || threshold === undefined) return false;
      return compareValues(stats.max_schedule_days, threshold, operator || '>=');
      
    case 'specific_action':
      if (criteriaAction === 'capsule_created_at_hour' && threshold !== undefined) {
        // CRITICAL FIX: Use user's local hour from frontend, not server time
        const userLocalHour = metadata?.userLocalHour;
        console.log(`[Night Owl Criteria Check] Looking for hour ${threshold}, user local hour: ${userLocalHour}`);
        
        if (userLocalHour === undefined) {
          console.log(`[Night Owl Criteria Check] ⚠️ No userLocalHour in metadata, cannot check`);
          return false;
        }
        
        // Exact hour match (3am = 3)
        const matches = userLocalHour === threshold;
        console.log(`[Night Owl Criteria Check] ${matches ? '✅' : '❌'} Match result: ${matches}`);
        return matches;
      }
      if (criteriaAction === 'capsule_created_at_hour_range' && threshold !== undefined) {
        // Check if capsule was created within a time range (e.g., 12 AM - 3 AM)
        const userLocalHour = metadata?.userLocalHour;
        const [startHour, endHour] = Array.isArray(threshold) ? threshold : [0, 0];
        
        console.log(`[Night Owl Range Check] Looking for hours ${startHour}-${endHour}, user local hour: ${userLocalHour}`);
        
        if (userLocalHour === undefined) {
          console.log(`[Night Owl Range Check] ⚠️ No userLocalHour in metadata, cannot check`);
          return false;
        }
        
        // Check if hour is within range (inclusive start, exclusive end)
        // For 12 AM - 3 AM: hours 0, 1, 2 (not 3)
        const matches = userLocalHour >= startHour && userLocalHour < endHour;
        console.log(`[Night Owl Range Check] ${matches ? '✅' : '❌'} Match result: ${matches}`);
        return matches;
      }
      if (criteriaAction === 'legacy_vault_setup') {
        return stats.legacy_vault_setup === true;
      }
      if (criteriaAction === 'monthly_streak_check' && threshold !== undefined) {
        return stats.monthly_streak >= threshold;
      }
      if (criteriaAction === 'account_age_check' && threshold !== undefined) {
        return stats.days_since_signup >= threshold;
      }
      if (criteriaAction === 'received_50_echoes') {
        return stats.echoes_received >= 50;
      }
      if (criteriaAction === 'capsule_with_10_media') {
        return stats.cinematic_capsules > 0;
      }
      if (criteriaAction === 'multimedia_capsule_created') {
        return stats.multimedia_capsules > 0;
      }
      if (criteriaAction === 'capsules_across_years' && threshold !== undefined) {
        return stats.capsule_years && stats.capsule_years.length >= threshold;
      }
      if (criteriaAction === 'consecutive_media_capsules' && threshold !== undefined) {
        return stats.consecutive_media_days >= threshold;
      }
      // NEW CRITERIA - v2.1.0
      if (criteriaAction === 'capsule_with_all_media_types') {
        // Check if capsule has photo, video, audio, and text (all 4 types)
        return metadata?.hasAllMediaTypes === true;
      }
      if (criteriaAction === 'achievement_shared_to_social') {
        return stats.social_shares_count > 0;
      }
      if (criteriaAction === 'capsule_with_500_words') {
        return metadata?.wordCount !== undefined && metadata.wordCount >= 500;
      }
      if (criteriaAction === 'two_capsules_same_delivery_time') {
        // Check if there are at least 2 capsules with the same delivery time
        if (!stats.capsule_delivery_times || stats.capsule_delivery_times.length < 2) return false;
        const deliveryTimes = stats.capsule_delivery_times;
        const timeMap = new Map<string, number>();
        for (const time of deliveryTimes) {
          timeMap.set(time, (timeMap.get(time) || 0) + 1);
          if (timeMap.get(time)! >= 2) return true;
        }
        return false;
      }
      if (criteriaAction === 'capsule_sent_to_5_plus_recipients') {
        return metadata?.recipientCount !== undefined && metadata.recipientCount >= 5;
      }
      // PHASE 1 A1: Multi-recipient capsule achievements
      if (criteriaAction === 'multi_recipient_capsule' && threshold !== undefined) {
        const recipientCount = metadata?.recipientCount || 0;
        return recipientCount >= threshold;
      }
      if (criteriaAction === 'ten_capsules_in_one_day') {
        // Check if any day has 10+ capsules
        if (!stats.daily_capsule_counts) return false;
        return Object.values(stats.daily_capsule_counts).some(count => count >= 10);
      }
      if (criteriaAction === 'capsules_at_12_different_hours') {
        return stats.capsule_creation_hours && stats.capsule_creation_hours.length >= 12;
      }
      
      // Generic specific_action check - if no specific handler matched, check if action matches criteriaAction
      if (criteriaAction && action === criteriaAction) {
        console.log(`[Achievement] ✅ Generic specific_action match: ${action} === ${criteriaAction}`);
        return true;
      }
      
      return false;
      
    case 'combo':
      if (!requirements || requirements.length === 0) return false;
      return requirements.every(req => {
        const val = getNestedStat(stats, req.stat);
        return compareValues(val, req.threshold, req.operator || '>=');
      });
      
    case 'custom':
      // Custom validators for complex achievement logic
      const validator = achievement.unlockCriteria.validator;
      
      if (validator === 'check_consecutive_years_3') {
        // Check if user has been active for 3 consecutive years
        // Requires first_capsule_date tracking
        if (!stats.first_capsule_at) return false;
        const firstDate = new Date(stats.first_capsule_at);
        const currentDate = new Date();
        const yearsDiff = currentDate.getFullYear() - firstDate.getFullYear();
        
        // Simple check: at least 3 years since first capsule
        // More sophisticated: check capsules exist in each year
        if (yearsDiff >= 2 && stats.capsule_years && stats.capsule_years.length >= 3) {
          return true;
        }
        return false;
      }
      
      if (validator === 'check_all_themes_used') {
        // Check if user has created capsules with all 15 themes
        const requiredThemes = [
          'classic-blue', 'birthday', 'love', 'new-beginnings', 'golden-hour',
          'milestone', 'adventure', 'grateful-heart', 'fresh-start', 'new-years-eve',
          'new-nest', 'furry-friends', 'career-summit', 'achievement', 'memory-lane'
        ];
        
        if (stats.themes_used && typeof stats.themes_used === 'object') {
          const usedThemes = Object.keys(stats.themes_used).filter(theme => 
            stats.themes_used && stats.themes_used[theme] > 0
          );
          return requiredThemes.every(theme => usedThemes.includes(theme));
        }
        return false;
      }
      
      if (validator === 'check_golden_hour_capsules') {
        // Check if user has created 50 capsules between 5-7 AM
        if (stats.hourly_capsule_counts && typeof stats.hourly_capsule_counts === 'object') {
          const goldenHourCount = (stats.hourly_capsule_counts['5'] || 0) + 
                                 (stats.hourly_capsule_counts['6'] || 0);
          return goldenHourCount >= 50;
        }
        return false;
      }
      
      if (validator === 'check_nostalgic_capsules') {
        // Check if user has 100 capsules with nostalgic themes
        const nostalgicThemes = ['birthday', 'love', 'memory-lane', 'golden-hour'];
        
        if (stats.themes_used && typeof stats.themes_used === 'object') {
          const nostalgicCount = nostalgicThemes.reduce((sum, theme) => 
            sum + (stats.themes_used && stats.themes_used[theme] || 0), 0
          );
          return nostalgicCount >= 100;
        }
        return false;
      }
      
      if (validator === 'check_unique_echo_senders') {
        // Check if user has received echoes from 25 different people
        // This would require tracking unique echo senders (new stat needed)
        return (stats.unique_echo_senders_count || 0) >= 25;
      }
      
      return false;
      
    default:
      return false;
  }
}

// ============================================
// STAT UPDATE LOGIC
// ============================================

export async function updateUserStats(
  userId: string,
  action: string,
  metadata?: any
): Promise<UserStats> {
  console.log(`[Stats] Updating user stats for ${userId}, action: ${action}`);
  
  try {
    let stats = await kvGetWithTimeout<UserStats | null>(`user_stats:${userId}`, null, 5000);
    
    // Initialize stats if not exists or if stats is not a valid object
    if (!stats || typeof stats !== 'object' || stats === null) {
      console.log(`[Stats] No existing stats found or invalid stats, initializing for ${userId}`);
      stats = initializeUserStats();
    }
    
    // CRITICAL: Ensure nested objects are always initialized to prevent hasOwnProperty errors
    if (!stats.filter_usage || typeof stats.filter_usage !== 'object' || stats.filter_usage === null) {
      stats.filter_usage = {
        yesterday: 0,
        future_light: 0,
        echo: 0,
        dream: 0,
        vintage: 0,
        cosmic: 0,
        underwater: 0,
        cathedral: 0
      };
    }
    
    if (!stats.media_by_type || typeof stats.media_by_type !== 'object' || stats.media_by_type === null) {
      stats.media_by_type = { photo: 0, video: 0, audio: 0 };
    }
    
    // Ensure arrays are initialized
    if (!Array.isArray(stats.unique_recipient_emails)) {
      stats.unique_recipient_emails = [];
    }
    if (!Array.isArray(stats.creation_day_set)) {
      stats.creation_day_set = [];
    }
    if (!Array.isArray(stats.capsule_years)) {
      stats.capsule_years = [];
    }
    
    // NEW v2.1.0 - Ensure new stats are initialized
    if (!Array.isArray(stats.capsule_delivery_times)) {
      stats.capsule_delivery_times = [];
    }
    if (!Array.isArray(stats.capsule_creation_hours)) {
      stats.capsule_creation_hours = [];
    }
    if (!stats.daily_capsule_counts || typeof stats.daily_capsule_counts !== 'object') {
      stats.daily_capsule_counts = {};
    }
    if (stats.social_shares_count === undefined) {
      stats.social_shares_count = 0;
    }
    if (stats.capsules_with_audio_count === undefined) {
      stats.capsules_with_audio_count = 0;
    }
    if (stats.capsules_with_media_count === undefined) {
      stats.capsules_with_media_count = 0;
    }
    
    // NEW v2.4.0 - Ensure multi-recipient stats are initialized
    if (stats.max_recipients_in_single_capsule === undefined) {
      stats.max_recipients_in_single_capsule = 0;
    }
    if (stats.total_multi_recipient_capsules === undefined) {
      stats.total_multi_recipient_capsules = 0;
    }
    
    // NEW v2.5.0 - Ensure epic tier stats are initialized
    if (!stats.themes_used || typeof stats.themes_used !== 'object') {
      stats.themes_used = {};
    }
    if (!stats.hourly_capsule_counts || typeof stats.hourly_capsule_counts !== 'object') {
      stats.hourly_capsule_counts = {};
    }
    if (!Array.isArray(stats.unique_echo_senders)) {
      stats.unique_echo_senders = [];
    }
    if (stats.unique_echo_senders_count === undefined) {
      stats.unique_echo_senders_count = 0;
    }
    
    // Safely create updated object using Object.assign to avoid prototype issues
    const updated = Object.assign({}, stats);
  
  switch (action) {
    case 'capsule_created':
      updated.capsules_created++;
      updated.most_recent_capsule_at = new Date().toISOString();
      
      if (!updated.first_capsule_at) {
        updated.first_capsule_at = new Date().toISOString();
      }
      
      // Update streak
      const today = new Date().toISOString().split('T')[0];
      const lastDate = stats.last_capsule_date;
      
      if (lastDate) {
        const daysDiff = daysBetween(lastDate, today);
        if (daysDiff === 1) {
          updated.current_streak = (stats.current_streak || 0) + 1;
        } else if (daysDiff > 1) {
          updated.current_streak = 1;
        }
      } else {
        updated.current_streak = 1;
      }
      
      updated.last_capsule_date = today;
      updated.longest_streak = Math.max(updated.current_streak, stats.longest_streak || 0);
      
      // Update schedule tracking
      if (metadata?.scheduleDays !== undefined) {
        updated.max_schedule_days = Math.max(
          metadata.scheduleDays,
          stats.max_schedule_days || 0
        );
        updated.min_schedule_days = stats.min_schedule_days === 0 
          ? metadata.scheduleDays 
          : Math.min(metadata.scheduleDays, stats.min_schedule_days);
      }
      
      // Night owl check - USE USER'S LOCAL TIME (passed from frontend)
      // CRITICAL: We must use the user's local hour, not server UTC time
      const userLocalHour = metadata?.userLocalHour;
      console.log(`[Night Owl Check] User local hour: ${userLocalHour}, Server UTC hour: ${new Date().getHours()}`);
      
      if (userLocalHour === 3) {
        updated.night_owl_capsules = (stats.night_owl_capsules || 0) + 1;
        console.log(`🦉 [Night Owl] User created capsule at 3am local time! Count: ${updated.night_owl_capsules}`);
      }
      
      // Recipient tracking
      if (metadata?.recipientEmail || metadata?.recipientCount) {
        // Handle multi-recipient capsules
        if (metadata?.recipientCount && metadata.recipientCount > 0) {
          const count = metadata.recipientCount;
          
          // If sending to others (not self)
          if (metadata.recipientEmail !== metadata.userEmail) {
            updated.capsules_to_others++;
            updated.total_recipients += count;
            
            // Track max recipients in single capsule
            updated.max_recipients_in_single_capsule = Math.max(
              stats.max_recipients_in_single_capsule || 0,
              count
            );
            
            // Track total multi-recipient capsules (strictly > 1 recipient)
            if (count > 1) {
              updated.total_multi_recipient_capsules = (stats.total_multi_recipient_capsules || 0) + 1;
            }
          } else {
            // Self capsule
            updated.capsules_to_self++;
          }
          
          // Track unique recipients (if email list provided)
          if (Array.isArray(metadata.recipientEmails)) {
             if (!Array.isArray(updated.unique_recipient_emails)) {
              updated.unique_recipient_emails = [];
            }
            
            for (const email of metadata.recipientEmails) {
              if (email && !updated.unique_recipient_emails.includes(email)) {
                updated.unique_recipient_emails.push(email);
              }
            }
            updated.unique_recipients = updated.unique_recipient_emails.length;
          } else if (metadata.recipientEmail && metadata.recipientEmail !== metadata.userEmail) {
            // Legacy/Single recipient fallback
            if (!Array.isArray(updated.unique_recipient_emails)) {
              updated.unique_recipient_emails = [];
            }
            if (!updated.unique_recipient_emails.includes(metadata.recipientEmail)) {
              updated.unique_recipient_emails.push(metadata.recipientEmail);
              updated.unique_recipients = updated.unique_recipient_emails.length;
            }
          }
        }
        // Legacy single recipient handling
        else if (metadata.recipientEmail) {
          if (metadata.recipientEmail !== metadata.userEmail) {
            updated.capsules_to_others++;
            updated.total_recipients++;
            
            // Track unique recipients for Globe Trotter achievement
            if (!Array.isArray(updated.unique_recipient_emails)) {
              updated.unique_recipient_emails = [];
            }
            if (!updated.unique_recipient_emails.includes(metadata.recipientEmail)) {
              updated.unique_recipient_emails.push(metadata.recipientEmail);
              updated.unique_recipients = updated.unique_recipient_emails.length;
            }
          } else {
            updated.capsules_to_self++;
          }
        }
      }
      
      // Track cinematic capsules (10+ media files)
      if (metadata?.mediaCount && metadata.mediaCount >= 10) {
        updated.cinematic_capsules = (stats.cinematic_capsules || 0) + 1;
      }
      
      // Track birthday capsules
      if (metadata?.isBirthdayCapsule) {
        updated.birthday_capsules = (stats.birthday_capsules || 0) + 1;
      }
      
      // Update monthly streak tracking
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const lastMonth = stats.last_capsule_date ? stats.last_capsule_date.slice(0, 7) : '';
      
      if (lastMonth && currentMonth !== lastMonth) {
        // Check if this is a consecutive month
        const lastMonthDate = new Date(lastMonth + '-01');
        const currentMonthDate = new Date(currentMonth + '-01');
        const monthsDiff = (currentMonthDate.getFullYear() - lastMonthDate.getFullYear()) * 12 + 
                          (currentMonthDate.getMonth() - lastMonthDate.getMonth());
        
        if (monthsDiff === 1) {
          updated.monthly_streak = (stats.monthly_streak || 0) + 1;
        } else if (monthsDiff > 1) {
          updated.monthly_streak = 1;
        }
        
        updated.monthly_active_months = (stats.monthly_active_months || 0) + 1;
      } else if (!lastMonth) {
        updated.monthly_streak = 1;
        updated.monthly_active_months = 1;
      }
      
      // Update account age
      if (stats.account_created_at) {
        updated.days_since_signup = daysBetween(stats.account_created_at, new Date().toISOString());
      }
      
      // Track unique creation days for Consistent Creator (A010)
      if (!Array.isArray(updated.creation_day_set)) {
        updated.creation_day_set = [];
      }
      if (!updated.creation_day_set.includes(today)) {
        updated.creation_day_set.push(today);
        updated.unique_creation_days = updated.creation_day_set.length;
      }
      
      // Track multimedia capsules for Multimedia Creator (A008)
      if (metadata?.contentTypes) {
        const types = metadata.contentTypes; // Array like ['text', 'photo', 'video']
        if (types.length >= 3) {
          updated.multimedia_capsules = (stats.multimedia_capsules || 0) + 1;
        }
      }
      
      // Track capsule years for Time Lord (E006)
      if (metadata?.deliveryDate) {
        const deliveryYear = new Date(metadata.deliveryDate).getFullYear();
        if (!Array.isArray(updated.capsule_years)) {
          updated.capsule_years = [];
        }
        if (!updated.capsule_years.includes(deliveryYear)) {
          updated.capsule_years.push(deliveryYear);
        }
      }
      
      // Track consecutive media capsules for Perfect Chronicle (E009)
      if (metadata?.hasMedia) {
        const lastMediaDate = stats.last_media_capsule_date;
        if (lastMediaDate) {
          const daysDiff = daysBetween(lastMediaDate, today);
          if (daysDiff === 1) {
            updated.consecutive_media_days = (stats.consecutive_media_days || 0) + 1;
          } else if (daysDiff > 1) {
            updated.consecutive_media_days = 1;
          }
        } else {
          updated.consecutive_media_days = 1;
        }
        updated.last_media_capsule_date = today;
      } else {
        // Reset consecutive media days if no media in this capsule
        updated.consecutive_media_days = 0;
      }
      
      // ============================================
      // NEW STAT TRACKING - v2.1.0
      // ============================================
      
      // Note: Multimedia Maestro (A036) is checked via metadata.hasAllMediaTypes in checkAchievements
      // No persistent stat tracking needed - it's checked per-capsule
      
      // Track delivery time for Double Feature (A040)
      if (metadata?.deliveryTime) {
        if (!Array.isArray(updated.capsule_delivery_times)) {
          updated.capsule_delivery_times = [];
        }
        updated.capsule_delivery_times.push(metadata.deliveryTime);
      }
      
      // Track creation hour for Around the Clock (A043)
      if (userLocalHour !== undefined) {
        if (!Array.isArray(updated.capsule_creation_hours)) {
          updated.capsule_creation_hours = [];
        }
        if (!updated.capsule_creation_hours.includes(userLocalHour)) {
          updated.capsule_creation_hours.push(userLocalHour);
        }
      }
      
      // Track daily capsule count for Marathon Session (A042)
      if (!updated.daily_capsule_counts) {
        updated.daily_capsule_counts = {};
      }
      updated.daily_capsule_counts[today] = (updated.daily_capsule_counts[today] || 0) + 1;
      
      // Track audio capsules for Music Memory (A039)
      if (metadata?.hasAudio) {
        updated.capsules_with_audio_count = (stats.capsules_with_audio_count || 0) + 1;
      }
      
      // Track capsules with any media (photos/videos) for Memory Weaver (A052)
      if (metadata?.hasMedia || metadata?.mediaCount > 0) {
        updated.capsules_with_media_count = (stats.capsules_with_media_count || 0) + 1;
      }
      
      // ============================================
      // EPIC TIER STAT TRACKING - v2.5.0
      // ============================================
      
      // Track theme usage for Theme Connoisseur (A049)
      if (metadata?.theme) {
        if (!updated.themes_used || typeof updated.themes_used !== 'object') {
          updated.themes_used = {};
        }
        const theme = metadata.theme;
        updated.themes_used[theme] = (updated.themes_used[theme] || 0) + 1;
      }
      
      // Track hourly capsule counts for Golden Hour Guardian (A050)
      if (userLocalHour !== undefined) {
        if (!updated.hourly_capsule_counts || typeof updated.hourly_capsule_counts !== 'object') {
          updated.hourly_capsule_counts = {};
        }
        const hourKey = userLocalHour.toString();
        updated.hourly_capsule_counts[hourKey] = (updated.hourly_capsule_counts[hourKey] || 0) + 1;
      }
      
      break;
      
    case 'capsule_sent':
      updated.capsules_sent++;
      break;
      
    case 'filter_used':
      // Handle filter usage for photo/video filters
      const filterName = metadata?.filterName || metadata?.filter;
      if (filterName) {
        // Normalize filter name: 'future-light' → 'future_light'
        const normalizedFilter = filterName.replace(/-/g, '_');
        if (updated.filter_usage && typeof updated.filter_usage === 'object' && normalizedFilter in updated.filter_usage) {
          updated.filter_usage[normalizedFilter] = (stats.filter_usage[normalizedFilter] || 0) + 1;
          updated.enhancements_used++;
        }
      }
      break;
    
    case 'audio_filter_used':
      // Handle audio filter usage
      const audioFilterName = metadata?.filterName;
      if (audioFilterName) {
        const normalizedAudioFilter = audioFilterName.replace(/-/g, '_');
        if (updated.filter_usage && typeof updated.filter_usage === 'object' && normalizedAudioFilter in updated.filter_usage) {
          updated.filter_usage[normalizedAudioFilter] = (stats.filter_usage[normalizedAudioFilter] || 0) + 1;
          updated.enhancements_used++;
        }
      }
      break;
      
    case 'sticker_added':
    case 'sticker_used':
      updated.stickers_used++;
      updated.enhancements_used++;
      break;
    
    case 'visual_effect_added':
      updated.enhancements_used++;
      break;
      
    case 'enhancement_used':
      updated.enhancements_used++;
      break;
      
    case 'media_uploaded':
      updated.media_uploaded++;
      const mediaType = metadata?.type;
      if (mediaType && updated.media_by_type && typeof updated.media_by_type === 'object' && mediaType in updated.media_by_type) {
        updated.media_by_type[mediaType]++;
      }
      if (metadata?.sizeMB) {
        updated.total_media_size_mb += metadata.sizeMB;
      }
      break;
      
    case 'capsule_received':
      updated.capsules_received++;
      break;
      
    case 'capsule_opened':
      updated.capsules_opened++;
      break;
      
    case 'legacy_vault_setup':
      updated.legacy_vault_setup = true;
      if (metadata?.beneficiaryCount) {
        updated.beneficiaries_added = metadata.beneficiaryCount;
      }
      break;
      
    case 'capsule_edited':
      updated.capsules_edited = (stats.capsules_edited || 0) + 1;
      break;
      
    // ============================================
    // NEW ACTIONS - v2.1.0
    // ============================================
    case 'onboarding_first_capsule_complete':
      // Track first capsule tutorial completion
      updated.onboarding_first_capsule_complete = true;
      break;
      
    case 'onboarding_vault_mastery_complete':
      // Track vault mastery tutorial completion
      updated.onboarding_vault_mastery_complete = true;
      break;
      
    case 'social_share':
      // Track social media shares for Shared Achievement (A037)
      updated.social_shares_count = (stats.social_shares_count || 0) + 1;
      break;
      
    // ============================================
    // VAULT ACTIONS - v2.2.0 (Phase 4B)
    // ============================================
    case 'vault_folder_created':
      // Track folder creation for A046: Memory Architect
      // ONLY count CUSTOM folders (exclude default permanent folders: Photos, Videos, Audio, Documents)
      const PERMANENT_FOLDERS = ['Photos', 'Videos', 'Audio', 'Documents'];
      const folderName = metadata?.folderName || '';
      
      // Only increment count if it's NOT one of the permanent default folders
      if (!PERMANENT_FOLDERS.includes(folderName)) {
        updated.vault_folders_created = (stats.vault_folders_created || 0) + 1;
        console.log(`📁 [Achievement] Custom folder created: "${folderName}" (count: ${updated.vault_folders_created})`);
      } else {
        console.log(`📁 [Achievement] Permanent folder created: "${folderName}" (not counted for Memory Architect)`);
      }
      
      // Track if it's a smart folder (Photos, Videos, Audio)
      if (metadata?.folderName) {
        const lowerName = metadata.folderName.toLowerCase();
        if (lowerName.includes('photo') || lowerName.includes('video') || lowerName.includes('audio')) {
          updated.vault_smart_folders_created = (stats.vault_smart_folders_created || 0) + 1;
        }
      }
      break;
      
    case 'vault_media_organized':
      // Track media organization for A047: Vault Curator
      const organizedCount = metadata?.count || 1;
      updated.vault_media_organized = (stats.vault_media_organized || 0) + organizedCount;
      break;
      
    case 'vault_auto_organize_used':
      // Track auto-organize usage
      updated.vault_auto_organize_used = (stats.vault_auto_organize_used || 0) + 1;
      const autoOrganizedCount = metadata?.movedCount || 0;
      updated.vault_media_organized = (stats.vault_media_organized || 0) + autoOrganizedCount;
      break;
      
    // ============================================
    // ECHO ACTIONS - v2.3.0 (Phase 1)
    // ============================================
    case 'echo_sent':
      // Track echoes for E001: Echo Initiate and E002: Warm Wave
      updated.echoes_sent = (stats.echoes_sent || 0) + 1;
      
      // Track by type
      if (metadata?.type === 'emoji') {
        updated.emoji_echoes_sent = (stats.emoji_echoes_sent || 0) + 1;
      } else if (metadata?.type === 'text') {
        updated.text_echoes_sent = (stats.text_echoes_sent || 0) + 1;
      }
      break;
      
    case 'echo_received':
      // Track when users receive echoes on their capsules
      updated.echoes_received = (stats.echoes_received || 0) + 1;
      
      // Track unique echo senders for A053: Community Beacon
      if (metadata?.senderEmail) {
        if (!Array.isArray(updated.unique_echo_senders)) {
          updated.unique_echo_senders = [];
        }
        if (!updated.unique_echo_senders.includes(metadata.senderEmail)) {
          updated.unique_echo_senders.push(metadata.senderEmail);
          updated.unique_echo_senders_count = updated.unique_echo_senders.length;
        }
      }
      break;
      
    // ============================================
    // MULTI-RECIPIENT ACTIONS - v2.4.0 (Phase 1 Feature A1)
    // ============================================
    case 'multi_recipient_capsule':
      // Track multi-recipient capsules for MR001: Circle of Trust and MR002: Grand Broadcast
      const recipientCount = metadata?.recipientCount || 0;
      
      // Track the highest recipient count for a single capsule
      if (!updated.highest_recipient_count || recipientCount > updated.highest_recipient_count) {
        updated.highest_recipient_count = recipientCount;
      }
      
      // Track total multi-recipient capsules sent
      updated.multi_recipient_capsules_sent = (stats.multi_recipient_capsules_sent || 0) + 1;
      
      // Track capsules by recipient count brackets
      if (!updated.recipient_count_brackets) {
        updated.recipient_count_brackets = {
          '5+': 0,
          '10': 0
        };
      }
      
      if (recipientCount >= 10) {
        updated.recipient_count_brackets['10'] = (stats.recipient_count_brackets?.['10'] || 0) + 1;
        updated.recipient_count_brackets['5+'] = (stats.recipient_count_brackets?.['5+'] || 0) + 1;
      } else if (recipientCount >= 5) {
        updated.recipient_count_brackets['5+'] = (stats.recipient_count_brackets?.['5+'] || 0) + 1;
      }
      
      console.log(`📊 [Multi-Recipient] Tracked capsule with ${recipientCount} recipients. Highest: ${updated.highest_recipient_count}`);
      break;
  }
  
    updated.last_stats_update = new Date().toISOString();
    
    await kv.set(`user_stats:${userId}`, updated);
    
    return updated;
  } catch (error) {
    console.error(`[Stats] Error updating user stats for ${userId}:`, error);
    // Return initialized stats on error to prevent cascade failures
    const fallbackStats = initializeUserStats();
    console.log(`[Stats] Returning fallback stats for ${userId}`);
    return fallbackStats;
  }
}

// ============================================
// HELPER: KV TIMEOUT WRAPPER
// ============================================

/**
 * Helper function to wrap KV operations with timeout protection
 * This prevents the achievement system from hanging if KV is slow
 */
async function kvGetWithTimeout<T>(key: string, defaultValue: T, timeoutMs: number = 5000): Promise<T> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(`Query timed out after ${timeoutMs}ms`)), timeoutMs)
    );
    
    const result = await Promise.race([
      kv.get<T>(key),
      timeoutPromise
    ]);
    
    return result ?? defaultValue;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    // Check if it's a connection reset or network error (very common during database issues)
    const isConnectionError = 
      errorMsg.includes('connection reset') ||
      errorMsg.includes('connection error') ||
      errorMsg.includes('SendRequest') ||
      errorMsg.includes('client error') ||
      errorMsg.includes('Network connection lost') ||
      errorMsg.includes('gateway error') ||
      errorMsg.includes('ECONNRESET');
    
    // Check if it's a timeout
    const isTimeout = errorMsg.includes('timed out');
    
    // For connection errors, only log if it's NOT an achievement_queue key (these are frequent and non-critical)
    if (isConnectionError) {
      if (!key.includes('achievement_queue')) {
        console.warn(`⚠️ Connection error for key "${key.substring(0, 40)}...": Returning fallback value`);
      }
      // Silently return default for achievement queues during connection issues
      return defaultValue;
    }
    
    // For timeouts, use warn since we return a fallback value
    if (isTimeout) {
      console.warn(`⏱️ KV Store: Query timed out after ${timeoutMs}ms for ${key.split(':')[0]}:...`);
      return defaultValue;
    }
    
    // For other errors, log normally
    console.error(`[KV] ❌ Error getting ${key}:`, errorMsg);
    return defaultValue;
  }
}

// ============================================
// ACHIEVEMENT UNLOCK LOGIC
// ============================================

export async function checkAndUnlockAchievements(
  userId: string,
  action: string,
  metadata?: any
): Promise<{ newlyUnlocked: Achievement[]; stats: UserStats }> {
  console.log(`[Achievements] Checking achievements for user ${userId}, action: ${action}`);
  
  // Update stats first
  const stats = await updateUserStats(userId, action, metadata);
  
  // Get user's unlocked achievements with timeout protection
  let userAchievements = await kvGetWithTimeout<any[]>(`user_achievements:${userId}`, [], 5000);
  const unlockedIds = userAchievements.map(a => a.achievementId);
  
  const newlyUnlocked: Achievement[] = [];
  
  // Anti-cheating: Check for action cooldown (prevent spam)
  const cooldownKey = `achievement_cooldown_${userId}_${action}`;
  const lastActionTime = await kvGetWithTimeout<string | null>(cooldownKey, null, 3000);
  
  if (lastActionTime) {
    const timeSinceLastAction = Date.now() - new Date(lastActionTime).getTime();
    const cooldownMs = 5000; // 5 second cooldown between same actions
    
    if (timeSinceLastAction < cooldownMs) {
      console.log(`[ANTI-CHEAT] Action ${action} on cooldown for user ${userId}. Time remaining: ${(cooldownMs - timeSinceLastAction) / 1000}s`);
      return { newlyUnlocked: [], stats }; // Silently ignore
    }
  }
  
  // Set cooldown for this action
  await kv.set(cooldownKey, new Date().toISOString());
  
  // Check each achievement
  for (const achievement of Object.values(ACHIEVEMENT_DEFINITIONS)) {
    // Skip if already unlocked (UNIQUE CONSTRAINT at app level)
    if (unlockedIds.includes(achievement.id)) continue;
    
    const meetsRequirements = evaluateCriteria(achievement, stats, action, metadata);
    
    if (meetsRequirements) {
      // Unlock achievement with detailed logging
      const unlockRecord = {
        achievementId: achievement.id,
        unlockedAt: new Date().toISOString(),
        notificationShown: false,
        shared: false,
        progress: getNestedStat(stats, achievement.unlockCriteria.stat || 'capsules_created'),
        sourceAction: action, // Track which action triggered unlock
        retroactive: metadata?.retroactive || false, // Flag retroactive unlocks
        metadata: {
          ...metadata,
          unlockContext: `Action: ${action}, Time: ${new Date().toISOString()}`
        }
      };
      
      userAchievements.push(unlockRecord);
      newlyUnlocked.push(achievement);
      
      // Update global stats & rarity tracking
      await incrementGlobalUnlockCount(achievement.id);
      
      // Add title to user's collection if achievement has a title
      if (achievement.rewards.title) {
        console.log(`👑 [Title Unlock] Achievement ${achievement.id} (${achievement.title}) has title reward: "${achievement.rewards.title}"`);
        await addTitleToCollection(userId, achievement.id);
        console.log(`👑 [Title Unlock] ✅ Title added to collection for user ${userId}`);
      } else {
        console.log(`[Title Unlock] Achievement ${achievement.id} has no title reward`);
      }
      
      // Analytics logging
      await logAchievementEvent(userId, achievement.id, 'unlocked', {
        action,
        retroactive: metadata?.retroactive || false,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Save updated achievements with deduplication
  if (newlyUnlocked.length > 0) {
    // Ensure unique achievement IDs (deduplication at save time)
    const uniqueAchievements = userAchievements.reduce((acc, current) => {
      const exists = acc.find(item => item.achievementId === current.achievementId);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, [] as any[]);
    
    await kv.set(`user_achievements:${userId}`, uniqueAchievements);
    
    // Update user stats with achievement info
    stats.achievement_count = uniqueAchievements.length;
    stats.achievement_points = uniqueAchievements.reduce((sum, ua) => {
      const achievement = ACHIEVEMENT_DEFINITIONS[ua.achievementId];
      return sum + (achievement?.rewards.points || 0);
    }, 0);
    
    // Update rarest achievement
    const rarityOrder = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
    const rarest = uniqueAchievements
      .map(ua => ACHIEVEMENT_DEFINITIONS[ua.achievementId])
      .filter(a => a)
      .sort((a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity])[0];
    
    if (rarest) {
      stats.rarest_achievement = rarest.id;
    }
    
    await kv.set(`user_stats:${userId}`, stats);
    
    // Queue notifications (with deduplication)
    await queueAchievementNotifications(userId, newlyUnlocked);
    
    // Increment total user count for rarity calculations
    await incrementTotalUserCount();
  }
  
  return { newlyUnlocked, stats };
}

async function incrementGlobalUnlockCount(achievementId: string): Promise<void> {
  let globalStats = await kvGetWithTimeout<any>('achievement_global_stats', null, 3000);
  
  if (!globalStats) {
    globalStats = {
      total_users: 0,
      last_updated: new Date().toISOString(),
      unlock_counts: {},
      first_unlock_times: {} // Track when each achievement was first unlocked globally
    };
  }
  
  if (!globalStats.unlock_counts[achievementId]) {
    globalStats.unlock_counts[achievementId] = 0;
    globalStats.first_unlock_times[achievementId] = new Date().toISOString();
  }
  
  globalStats.unlock_counts[achievementId]++;
  globalStats.last_updated = new Date().toISOString();
  
  await kv.set('achievement_global_stats', globalStats);
}

async function incrementTotalUserCount(): Promise<void> {
  let globalStats = await kvGetWithTimeout<any>('achievement_global_stats', null, 3000);
  
  if (!globalStats) {
    globalStats = {
      total_users: 1,
      last_updated: new Date().toISOString(),
      unlock_counts: {},
      first_unlock_times: {}
    };
  } else {
    // Only increment if user is new (has < 5 achievements unlocked)
    // This prevents inflating user count on every unlock
    globalStats.total_users = Math.max(globalStats.total_users, 1);
  }
  
  await kv.set('achievement_global_stats', globalStats);
}

async function logAchievementEvent(
  userId: string,
  achievementId: string,
  eventType: 'unlocked' | 'shared' | 'viewed',
  metadata: any
): Promise<void> {
  // Log to achievement analytics
  let analyticsKey = `achievement_analytics_${achievementId}`;
  let analytics = await kv.get<any>(analyticsKey) || {
    achievementId,
    total_unlocks: 0,
    total_shares: 0,
    total_views: 0,
    unlock_times: [],
    retroactive_unlocks: 0,
    last_updated: new Date().toISOString()
  };
  
  if (eventType === 'unlocked') {
    analytics.total_unlocks++;
    analytics.unlock_times.push(new Date().toISOString());
    if (metadata.retroactive) {
      analytics.retroactive_unlocks++;
    }
  } else if (eventType === 'shared') {
    analytics.total_shares++;
  } else if (eventType === 'viewed') {
    analytics.total_views++;
  }
  
  analytics.last_updated = new Date().toISOString();
  
  // Keep only last 100 unlock times to prevent unbounded growth
  if (analytics.unlock_times.length > 100) {
    analytics.unlock_times = analytics.unlock_times.slice(-100);
  }
  
  await kv.set(analyticsKey, analytics);
}

async function queueAchievementNotifications(userId: string, achievements: Achievement[]): Promise<void> {
  console.log(`📬 [Achievement Queue] Queueing ${achievements.length} achievement(s) for user ${userId}`);
  let queue = await kv.get<any[]>(`achievement_queue_${userId}`) || [];
  console.log(`📬 [Achievement Queue] Current queue length: ${queue.length}`);
  
  // Get existing achievement IDs in queue (both shown and unshown)
  const existingIds = new Set(queue.map(q => q.achievementId));
  
  // Only add achievements that aren't already in the queue
  let addedCount = 0;
  for (const achievement of achievements) {
    if (!existingIds.has(achievement.id)) {
      console.log(`📬 [Achievement Queue] Adding to queue: ${achievement.title} (${achievement.id})`);
      queue.push({
        achievementId: achievement.id,
        unlockedAt: new Date().toISOString(),
        shown: false
      });
      addedCount++;
    } else {
      console.log(`📬 [Achievement Queue] ⏭️  Skipping duplicate: ${achievement.title} (${achievement.id}) - already in queue`);
    }
  }
  
  // Clean up old shown notifications (keep only last 10 shown items to prevent unbounded growth)
  const unshown = queue.filter(q => !q.shown);
  const shown = queue.filter(q => q.shown).slice(-10); // Keep only last 10 shown
  queue = [...unshown, ...shown];
  
  await kv.set(`achievement_queue_${userId}`, queue);
  console.log(`📬 [Achievement Queue] ✅ Saved queue with ${queue.length} total items (${addedCount} newly added, ${unshown.length} pending)`);
}

// ============================================
// PUBLIC API FUNCTIONS WITH TIMEOUT PROTECTION
// ============================================

/**
 * Get all achievement definitions (static data, no KV access needed)
 */
export async function getAchievementDefinitions(): Promise<Record<string, Achievement>> {
  console.log('[Achievements] Returning achievement definitions (static data)');
  // This is static data, just return it immediately
  return ACHIEVEMENT_DEFINITIONS;
}

/**
 * Get user's unlocked achievements with timeout protection
 */
export async function getUserAchievements(userId: string): Promise<any[]> {
  console.log(`[Achievements] Getting user achievements for: ${userId}`);
  try {
    const achievements = await kvGetWithTimeout<any[]>(`user_achievements:${userId}`, [], 5000);
    console.log(`[Achievements] ✅ Found ${achievements.length} achievements for user`);
    return achievements;
  } catch (error) {
    console.error(`[Achievements] ❌ Error getting user achievements:`, error);
    return [];
  }
}

/**
 * Get user stats with timeout protection
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  console.log(`[Achievements] Getting user stats for: ${userId}`);
  try {
    const stats = await kvGetWithTimeout<UserStats | null>(`user_stats:${userId}`, null, 5000);
    
    if (!stats) {
      console.log(`[Achievements] No stats found, initializing defaults for user`);
      return initializeUserStats();
    }
    
    console.log(`[Achievements] ✅ Found stats for user (${stats.capsules_created} capsules, ${stats.achievement_count} achievements)`);
    return stats;
  } catch (error) {
    console.error(`[Achievements] ❌ Error getting user stats:`, error);
    return initializeUserStats();
  }
}

/**
 * Get global achievement statistics with timeout protection
 */
export async function getGlobalStats(): Promise<any> {
  console.log('[Achievements] Getting global stats');
  try {
    const globalStats = await kvGetWithTimeout<any>('achievement_global_stats', null, 5000);
    
    if (!globalStats) {
      console.log('[Achievements] No global stats found, returning defaults');
      return {
        total_users: 0,
        unlock_counts: {},
        last_updated: new Date().toISOString()
      };
    }
    
    console.log(`[Achievements] ✅ Found global stats (${globalStats.total_users} users)`);
    return globalStats;
  } catch (error) {
    console.error('[Achievements] ❌ Error getting global stats:', error);
    return {
      total_users: 0,
      unlock_counts: {},
      last_updated: new Date().toISOString()
    };
  }
}

/**
 * Get pending achievement notifications with timeout protection
 */
export async function getPendingNotifications(userId: string): Promise<any[]> {
  console.log(`[Achievements] Getting pending notifications for: ${userId}`);
  try {
    const queue = await kvGetWithTimeout<any[]>(`achievement_queue_${userId}`, [], 5000);
    console.log(`[Achievements] Total queue items: ${queue.length}`, queue.map(q => ({ id: q.achievementId, shown: q.shown })));
    const pending = queue.filter(q => !q.shown);
    console.log(`[Achievements] ✅ Found ${pending.length} pending (unshown) notifications:`, pending.map(p => p.achievementId));
    return pending;
  } catch (error) {
    console.error('[Achievements] ❌ Error getting pending notifications:', error);
    return [];
  }
}

export async function markNotificationsShown(userId: string, achievementIds: string[]): Promise<void> {
  let queue = await kv.get<any[]>(`achievement_queue_${userId}`) || [];
  
  queue = queue.map(q => {
    if (achievementIds.includes(q.achievementId)) {
      return { ...q, shown: true };
    }
    return q;
  });
  
  await kv.set(`achievement_queue_${userId}`, queue);
}

export async function markAchievementShared(userId: string, achievementId: string): Promise<void> {
  let userAchievements = await kv.get<any[]>(`user_achievements:${userId}`) || [];
  
  userAchievements = userAchievements.map(a => {
    if (a.achievementId === achievementId) {
      return { ...a, shared: true, shareTimestamp: new Date().toISOString() };
    }
    return a;
  });
  
  await kv.set(`user_achievements:${userId}`, userAchievements);
}

export async function getAchievementProgress(userId: string, achievementId: string): Promise<number> {
  const achievement = ACHIEVEMENT_DEFINITIONS[achievementId];
  if (!achievement) return 0;
  
  const stats = await getUserStats(userId);
  if (!stats) return 0;
  
  const { stat, threshold } = achievement.unlockCriteria;
  if (!stat || !threshold) return 0;
  
  const current = getNestedStat(stats, stat);
  return Math.min(100, (current / threshold) * 100);
}

// ============================================
// RARITY PERCENTAGE TRACKING
// ============================================

export async function getAchievementRarityPercentage(achievementId: string): Promise<number> {
  const globalStats = await kv.get<any>('achievement_global_stats');
  
  if (!globalStats || !globalStats.total_users || globalStats.total_users === 0) {
    return 0; // No data yet
  }
  
  const unlockCount = globalStats.unlock_counts?.[achievementId] || 0;
  const totalUsers = globalStats.total_users;
  
  // Calculate rarity percentage
  const rarityPercentage = (unlockCount / totalUsers) * 100;
  
  return Math.round(rarityPercentage * 10) / 10; // Round to 1 decimal place
}

export async function getAllRarityPercentages(): Promise<Record<string, number>> {
  const globalStats = await kv.get<any>('achievement_global_stats');
  
  if (!globalStats || !globalStats.total_users || globalStats.total_users === 0) {
    return {};
  }
  
  const rarityPercentages: Record<string, number> = {};
  
  for (const achievementId of Object.keys(ACHIEVEMENT_DEFINITIONS)) {
    const unlockCount = globalStats.unlock_counts?.[achievementId] || 0;
    const percentage = (unlockCount / globalStats.total_users) * 100;
    rarityPercentages[achievementId] = Math.round(percentage * 10) / 10;
  }
  
  return rarityPercentages;
}

// ============================================
// RETROACTIVE UNLOCK MIGRATION
// ============================================

export async function runRetroactiveUnlockMigration(userId: string): Promise<{
  success: boolean;
  newUnlocks: number;
  achievements: string[];
  error?: string;
}> {
  try {
    console.log(`[RETROACTIVE] Running migration for user ${userId}`);
    
    // Get current stats
    const stats = await getUserStats(userId);
    if (!stats) {
      console.log(`[RETROACTIVE] No stats found for user ${userId}, skipping`);
      return { success: true, newUnlocks: 0, achievements: [] };
    }
    
    // Get already unlocked achievements
    const userAchievements = await kv.get<any[]>(`user_achievements:${userId}`) || [];
    const unlockedIds = userAchievements.map(a => a.achievementId);
    
    const retroactiveUnlocks: Achievement[] = [];
    
    // Check all achievements against current stats
    for (const achievement of Object.values(ACHIEVEMENT_DEFINITIONS)) {
      if (unlockedIds.includes(achievement.id)) continue;
      
      // Evaluate criteria with current stats (no specific action)
      const meetsRequirements = evaluateCriteria(achievement, stats, 'retroactive_check', { 
        retroactive: true,
        migrationRun: new Date().toISOString()
      });
      
      if (meetsRequirements) {
        // Unlock achievement retroactively
        const unlockRecord = {
          achievementId: achievement.id,
          unlockedAt: new Date().toISOString(),
          notificationShown: false,
          shared: false,
          progress: getNestedStat(stats, achievement.unlockCriteria.stat || 'capsules_created'),
          sourceAction: 'retroactive_migration',
          retroactive: true,
          metadata: {
            migrationRun: new Date().toISOString(),
            note: 'Unlocked based on existing activity before Achievement System launch'
          }
        };
        
        userAchievements.push(unlockRecord);
        retroactiveUnlocks.push(achievement);
        
        // Update global stats
        await incrementGlobalUnlockCount(achievement.id);
        
        // Log analytics
        await logAchievementEvent(userId, achievement.id, 'unlocked', {
          action: 'retroactive_migration',
          retroactive: true,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Save updated achievements
    if (retroactiveUnlocks.length > 0) {
      await kv.set(`user_achievements:${userId}`, userAchievements);
      
      // Update user stats
      stats.achievement_count = userAchievements.length;
      stats.achievement_points = userAchievements.reduce((sum, ua) => {
        const achievement = ACHIEVEMENT_DEFINITIONS[ua.achievementId];
        return sum + (achievement?.rewards.points || 0);
      }, 0);
      
      await kv.set(`user_stats:${userId}`, stats);
      
      // Queue special retroactive notification
      await kv.set(`retroactive_unlocks_${userId}`, {
        count: retroactiveUnlocks.length,
        achievements: retroactiveUnlocks.map(a => a.id),
        shownNotification: false,
        migratedAt: new Date().toISOString()
      });
      
      console.log(`[RETROACTIVE] User ${userId}: Unlocked ${retroactiveUnlocks.length} achievements`);
    }
    
    return {
      success: true,
      newUnlocks: retroactiveUnlocks.length,
      achievements: retroactiveUnlocks.map(a => a.id)
    };
    
  } catch (error: any) {
    console.error(`[RETROACTIVE] Error for user ${userId}:`, error);
    return {
      success: false,
      newUnlocks: 0,
      achievements: [],
      error: error.message
    };
  }
}

export async function getRetroactiveUnlockStatus(userId: string): Promise<any> {
  return await kv.get(`retroactive_unlocks_${userId}`);
}

export async function markRetroactiveNotificationShown(userId: string): Promise<void> {
  const status = await kv.get<any>(`retroactive_unlocks_${userId}`);
  if (status) {
    status.shownNotification = true;
    await kv.set(`retroactive_unlocks_${userId}`, status);
  }
}

// ============================================
// ANALYTICS & INSIGHTS
// ============================================

export async function getAchievementAnalytics(achievementId: string): Promise<any> {
  return await kv.get(`achievement_analytics_${achievementId}`);
}

export async function getUserAchievementInsights(userId: string): Promise<{
  totalPoints: number;
  achievementCount: number;
  rarityBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  recentUnlocks: any[];
  nextClosest: any[];
}> {
  const userAchievements = await getUserAchievements(userId);
  const stats = await getUserStats(userId);
  
  if (!stats) {
    return {
      totalPoints: 0,
      achievementCount: 0,
      rarityBreakdown: {},
      categoryBreakdown: {},
      recentUnlocks: [],
      nextClosest: []
    };
  }
  
  // Rarity breakdown
  const rarityBreakdown: Record<string, number> = {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0
  };
  
  const categoryBreakdown: Record<string, number> = {
    starter: 0,
    era_themed: 0,
    time_based: 0,
    volume: 0,
    special: 0,
    enhance: 0
  };
  
  let totalPoints = 0;
  
  for (const ua of userAchievements) {
    const achievement = ACHIEVEMENT_DEFINITIONS[ua.achievementId];
    if (achievement) {
      rarityBreakdown[achievement.rarity]++;
      categoryBreakdown[achievement.category]++;
      totalPoints += achievement.rewards.points;
    }
  }
  
  // Recent unlocks (last 5)
  const recentUnlocks = userAchievements
    .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
    .slice(0, 5)
    .map(ua => ({
      ...ua,
      achievement: ACHIEVEMENT_DEFINITIONS[ua.achievementId]
    }));
  
  // Next closest achievements
  const unlockedIds = userAchievements.map(a => a.achievementId);
  const nextClosest = Object.values(ACHIEVEMENT_DEFINITIONS)
    .filter(a => !unlockedIds.includes(a.id))
    .map(achievement => {
      const progress = getNestedStat(stats, achievement.unlockCriteria.stat || 'capsules_created');
      const threshold = achievement.unlockCriteria.threshold || 1;
      const percentage = (progress / threshold) * 100;
      
      return {
        achievement,
        progress,
        threshold,
        percentage: Math.min(100, percentage)
      };
    })
    .filter(item => item.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);
  
  return {
    totalPoints,
    achievementCount: userAchievements.length,
    rarityBreakdown,
    categoryBreakdown,
    recentUnlocks,
    nextClosest
  };
}

// ============================================
// LEGACY TITLES SYSTEM
// ============================================

/**
 * Get user's title profile (equipped title + unlocked titles)
 */
export async function getUserTitleProfile(userId: string): Promise<any> {
  console.log(`[Titles] Getting title profile for: ${userId}`);
  try {
    const profile = await kvGetWithTimeout<any>(
      `user_title_profile:${userId}`,
      {
        equipped_title: null,
        equipped_achievement_id: null,
        unlocked_titles: []
      },
      5000
    );
    
    console.log(`[Titles] ✅ Profile loaded:`, {
      equipped: profile.equipped_title,
      unlocked_count: profile.unlocked_titles?.length || 0
    });
    
    return profile;
  } catch (error) {
    console.error(`[Titles] ❌ Error getting title profile:`, error);
    return {
      equipped_title: null,
      equipped_achievement_id: null,
      unlocked_titles: []
    };
  }
}

/**
 * Equip a title (or unequip by passing null)
 */
export async function equipTitle(userId: string, achievementId: string | null): Promise<any> {
  console.log(`[Titles] ⚙️ equipTitle called for ${userId}:`, {
    achievementId,
    isNull: achievementId === null,
    isUndefined: achievementId === undefined,
    type: typeof achievementId
  });
  
  try {
    // Get current profile
    const profile = await getUserTitleProfile(userId);
    console.log(`[Titles] 📋 Current profile before change:`, profile);
    
    // If unequipping (null)
    if (achievementId === null || achievementId === undefined) {
      console.log(`[Titles] 🔄 Unequipping title - setting to null`);
      profile.equipped_title = null;
      profile.equipped_achievement_id = null;
      
      console.log(`[Titles] 💾 Saving updated profile:`, profile);
      await kv.set(`user_title_profile:${userId}`, profile);
      
      // Verify it was saved
      const verifyProfile = await kv.get(`user_title_profile:${userId}`);
      console.log(`[Titles] ✅ Verified saved profile:`, verifyProfile);
      
      return { success: true, equipped_title: null };
    }
    
    // Check if achievement exists and has a title
    const achievement = ACHIEVEMENT_DEFINITIONS[achievementId];
    if (!achievement || !achievement.rewards.title) {
      console.error(`[Titles] ❌ Achievement ${achievementId} has no title`);
      return { success: false, error: 'Achievement has no title' };
    }
    
    // Check if user has unlocked this achievement
    const userAchievements = await kv.get<any[]>(`user_achievements:${userId}`) || [];
    const hasUnlocked = userAchievements.some(a => a.achievementId === achievementId);
    
    if (!hasUnlocked) {
      console.error(`[Titles] ❌ User ${userId} hasn't unlocked ${achievementId}`);
      return { success: false, error: 'Achievement not unlocked' };
    }
    
    // Equip the title
    profile.equipped_title = achievement.rewards.title;
    profile.equipped_achievement_id = achievementId;
    
    // Ensure this title is in the unlocked list
    if (!profile.unlocked_titles) {
      profile.unlocked_titles = [];
    }
    
    const titleData = {
      title: achievement.rewards.title,
      achievementId: achievementId,
      rarity: achievement.rarity,
      unlockedAt: userAchievements.find(a => a.achievementId === achievementId)?.unlockedAt
    };
    
    // Add to unlocked titles if not already there
    if (!profile.unlocked_titles.some((t: any) => t.achievementId === achievementId)) {
      profile.unlocked_titles.push(titleData);
    }
    
    await kv.set(`user_title_profile:${userId}`, profile);
    
    console.log(`[Titles] ✅ Title equipped: "${achievement.rewards.title}" for ${userId}`);
    
    return {
      success: true,
      equipped_title: achievement.rewards.title,
      rarity: achievement.rarity,
      achievementId: achievementId
    };
  } catch (error) {
    console.error(`[Titles] ❌ Error equipping title:`, error);
    return { success: false, error: 'Failed to equip title' };
  }
}

/**
 * Add a title to user's collection when achievement is unlocked
 * CRITICAL: This function is called from checkAndUnlockAchievements AFTER the achievement
 * has been added to user_achievements array. It should only update the title profile.
 * However, we add a safety check to ensure consistency between achievements and titles.
 */
export async function addTitleToCollection(userId: string, achievementId: string): Promise<void> {
  console.log(`👑 [Titles] Adding title from achievement ${achievementId} to ${userId}'s collection`);
  
  try {
    const achievement = ACHIEVEMENT_DEFINITIONS[achievementId];
    if (!achievement || !achievement.rewards.title) {
      console.log(`👑 [Titles] ⚠️ Achievement ${achievementId} has no title, skipping`);
      return;
    }
    
    console.log(`👑 [Titles] Achievement found: "${achievement.title}" with title reward: "${achievement.rewards.title}"`);
    
    // SAFETY CHECK: Verify achievement is in user_achievements array (for horizon availability)
    // This ensures the horizon will show as unlocked in the gallery
    const userAchievements = await kv.get<any[]>(`user_achievements:${userId}`) || [];
    const achievementExists = userAchievements.some(a => a.achievementId === achievementId);
    
    if (!achievementExists) {
      console.error(`👑 [Titles] ⚠️ CRITICAL: Achievement ${achievementId} NOT in user_achievements array!`);
      console.error(`👑 [Titles] This will cause horizon to show as locked even though title is unlocked.`);
      console.error(`👑 [Titles] Adding achievement to user_achievements array now as safety measure...`);
      
      // Add the achievement to ensure horizon availability
      const unlockRecord = {
        achievementId: achievementId,
        unlockedAt: new Date().toISOString(),
        notificationShown: false, // Will be shown via achievement unlock modal
        shared: false,
        progress: 1,
        sourceAction: 'title_collection_safety_check',
        retroactive: false,
        metadata: {
          unlockContext: `Safety check during addTitleToCollection, Time: ${new Date().toISOString()}`
        }
      };
      
      userAchievements.push(unlockRecord);
      await kv.set(`user_achievements:${userId}`, userAchievements);
      console.log(`👑 [Titles] ✅ Added achievement ${achievementId} to user_achievements array`);
    } else {
      console.log(`👑 [Titles] ✅ Achievement ${achievementId} exists in user_achievements (horizon will be available)`);
    }
    
    const profile = await getUserTitleProfile(userId);
    console.log(`👑 [Titles] Retrieved profile, current unlocked titles: ${profile.unlocked_titles?.length || 0}`);
    
    if (!profile.unlocked_titles) {
      profile.unlocked_titles = [];
      console.log(`👑 [Titles] Initialized empty unlocked_titles array`);
    }
    
    // Check if already in collection
    const alreadyHas = profile.unlocked_titles.some((t: any) => t.achievementId === achievementId);
    if (alreadyHas) {
      console.log(`👑 [Titles] ⏭️ User already has title from ${achievementId}, skipping`);
      return;
    }
    
    // Add to collection
    const titleData = {
      title: achievement.rewards.title,
      achievementId: achievementId,
      rarity: achievement.rarity,
      unlockedAt: new Date().toISOString()
    };
    
    profile.unlocked_titles.push(titleData);
    console.log(`👑 [Titles] Added title to profile. New count: ${profile.unlocked_titles.length}`);
    
    await kv.set(`user_title_profile:${userId}`, profile);
    console.log(`👑 [Titles] ✅ Saved profile to KV store`);
    
    // Verify it was saved
    const verifyProfile = await kv.get(`user_title_profile:${userId}`);
    console.log(`👑 [Titles] 🔍 Verification: Profile has ${verifyProfile?.unlocked_titles?.length || 0} titles after save`);
    
    console.log(`👑 [Titles] ✅✅✅ Successfully added title "${achievement.rewards.title}" to ${userId}'s collection`);
  } catch (error) {
    console.error(`👑 [Titles] ❌❌❌ Error adding title to collection:`, error);
    console.error(`👑 [Titles] Error details:`, {
      userId,
      achievementId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

/**
 * Initialize new user with "Time Novice" title as a freebie (already unlocked and equipped)
 */
export async function initializeUserTitles(userId: string): Promise<void> {
  console.log(`[Titles] 🎁 Initializing new user ${userId} with Time Novice title`);
  
  try {
    const profile = await getUserTitleProfile(userId);
    
    // Only initialize if user has no equipped title (brand new user)
    if (profile.equipped_title) {
      console.log(`[Titles] User already has a title, skipping initialization`);
      return;
    }
    
    const firstStepAchievement = ACHIEVEMENT_DEFINITIONS['A001'];
    if (!firstStepAchievement || !firstStepAchievement.rewards.title) {
      console.error(`[Titles] ❌ First Step achievement not found or has no title`);
      return;
    }
    
    // Check if user already has this achievement unlocked
    let userAchievements = await kv.get<any[]>(`user_achievements:${userId}`) || [];
    const alreadyUnlocked = userAchievements.some(a => a.achievementId === 'A001');
    
    if (!alreadyUnlocked) {
      // Unlock the achievement properly (this will create the notification)
      const unlockRecord = {
        achievementId: 'A001',
        unlockedAt: new Date().toISOString(),
        notificationShown: false,
        shared: false,
        progress: 1,
        sourceAction: 'signup',
        retroactive: false,
        metadata: {
          unlockContext: `Action: signup, Time: ${new Date().toISOString()}`
        }
      };
      
      userAchievements.push(unlockRecord);
      await kv.set(`user_achievements:${userId}`, userAchievements);
      
      // Queue the notification so the modal will show
      await queueAchievementNotifications(userId, [firstStepAchievement]);
      
      console.log(`[Titles] ✅ Achievement "A001" (First Step) unlocked for user ${userId}`);
    }
    
    // Add "Time Novice" to collection (this is still needed for the title system)
    const titleData = {
      title: firstStepAchievement.rewards.title,
      achievementId: 'A001',
      rarity: firstStepAchievement.rarity,
      unlockedAt: new Date().toISOString()
    };
    
    profile.unlocked_titles = [titleData];
    profile.equipped_title = titleData.title;
    profile.equipped_achievement_id = 'A001';
    
    await kv.set(`user_title_profile:${userId}`, profile);
    
    console.log(`[Titles] ✅ User ${userId} initialized with Time Novice title (unlocked, equipped, & notification queued)`);
  } catch (error) {
    console.error(`[Titles] ❌ Error initializing user titles:`, error);
  }
}

/**
 * Get all available titles (locked and unlocked) for a user
 */
export async function getAvailableTitles(userId: string): Promise<any> {
  console.log(`[Titles] Getting available titles for: ${userId}`);
  
  try {
    const profile = await getUserTitleProfile(userId);
    const userAchievements = await kv.get<any[]>(`user_achievements:${userId}`) || [];
    const unlockedIds = userAchievements.map(a => a.achievementId);
    
    // Get all achievements with titles
    const allTitles = Object.values(ACHIEVEMENT_DEFINITIONS)
      .filter(a => a.rewards.title)
      .map(achievement => {
        const isUnlocked = unlockedIds.includes(achievement.id);
        const unlockRecord = userAchievements.find(a => a.achievementId === achievement.id);
        
        return {
          achievementId: achievement.id,
          title: achievement.rewards.title,
          rarity: achievement.rarity,
          category: achievement.category,
          description: achievement.description,
          icon: achievement.icon,
          isUnlocked,
          unlockedAt: unlockRecord?.unlockedAt,
          isEquipped: profile.equipped_achievement_id === achievement.id,
          visual: achievement.visual
        };
      })
      .sort((a, b) => {
        // Sort: Equipped first, then by unlock status, then by rarity (low to high)
        
        // 1. Equipped title always first
        if (a.isEquipped && !b.isEquipped) return -1;
        if (!a.isEquipped && b.isEquipped) return 1;
        
        // 2. Unlocked titles before locked titles
        if (a.isUnlocked && !b.isUnlocked) return -1;
        if (!a.isUnlocked && b.isUnlocked) return 1;
        
        // 3. Within same unlock status, sort by rarity (Common → Legendary)
        const rarityOrder: Record<string, number> = {
          common: 1,
          uncommon: 2,
          rare: 3,
          epic: 4,
          legendary: 5
        };
        
        const rarityDiff = (rarityOrder[a.rarity] || 0) - (rarityOrder[b.rarity] || 0);
        if (rarityDiff !== 0) return rarityDiff;
        
        // 4. If same rarity and status, sort alphabetically by title name
        return a.title.localeCompare(b.title);
      });
    
    console.log(`[Titles] ✅ Found ${allTitles.length} total titles (${allTitles.filter(t => t.isUnlocked).length} unlocked)`);
    
    return {
      titles: allTitles,
      equipped: profile.equipped_title,
      equippedAchievementId: profile.equipped_achievement_id,
      unlockedCount: allTitles.filter(t => t.isUnlocked).length,
      totalCount: allTitles.length
    };
  } catch (error) {
    console.error(`[Titles] ❌ Error getting available titles:`, error);
    return {
      titles: [],
      equipped: null,
      equippedAchievementId: null,
      unlockedCount: 0,
      totalCount: 0
    };
  }
}


