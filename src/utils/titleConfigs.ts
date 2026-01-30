/**
 * Shared title configuration for PrestigeBar and TitleCarousel
 * Maps title names to their emoji icons, animations, and visual themes
 */

export interface TitleConfig {
  icon: string;
  flavorText: string;
  colors: string[];
  bgPattern: string;
  animation: string;
  particleCount: number;
  particleType: string;
  intensity: 'low' | 'medium' | 'high' | 'supreme';
}

export const titleConfigs: Record<string, TitleConfig> = {
  // ============ COMMON TIER ============
  'Time Novice': {
    icon: '⏰',
    flavorText: 'Just Beginning the Journey',
    colors: ['#3b82f6', '#64748b'],
    bgPattern: 'clockwork',
    animation: 'clock-tick',
    particleCount: 4,
    particleType: 'clock',
    intensity: 'low'
  },
  'Future Messenger': {
    icon: '📨',
    flavorText: 'Sending Hope to Tomorrow',
    colors: ['#A78BFA', '#7C3AED'],
    bgPattern: 'subtle-gradient',
    animation: 'gentle-pulse',
    particleCount: 6,
    particleType: 'sparkle',
    intensity: 'low'
  },
  'Past Receiver': {
    icon: '📬',
    flavorText: "Opening Yesterday's Treasures",
    colors: ['#FBBF24', '#D97706'],
    bgPattern: 'subtle-gradient',
    animation: 'gentle-pulse',
    particleCount: 6,
    particleType: 'sparkle',
    intensity: 'low'
  },
  'Snapshot Keeper': {
    icon: '📷',
    flavorText: 'Freezing Time in Frames',
    colors: ['#34D399', '#059669'],
    bgPattern: 'photo-frames',
    animation: 'camera-flash',
    particleCount: 5,
    particleType: 'camera',
    intensity: 'low'
  },
  'Cinema Pioneer': {
    icon: '🎥',
    flavorText: 'Capturing Motion and Memory',
    colors: ['#F59E0B', '#DC2626'],
    bgPattern: 'subtle-gradient',
    animation: 'gentle-pulse',
    particleCount: 6,
    particleType: 'sparkle',
    intensity: 'low'
  },
  'Voice Keeper': {
    icon: '🎙️',
    flavorText: 'Preserving Echoes of the Heart',
    colors: ['#F472B6', '#DB2777'],
    bgPattern: 'sound-waves',
    animation: 'wave-pulse',
    particleCount: 5,
    particleType: 'note',
    intensity: 'low'
  },
  'Habit Builder': {
    icon: '🔥',
    flavorText: 'Kindling Daily Dedication',
    colors: ['#10B981', '#047857'],
    bgPattern: 'subtle-gradient',
    animation: 'gentle-pulse',
    particleCount: 6,
    particleType: 'sparkle',
    intensity: 'low'
  },
  'Moment Collector': {
    icon: '📸',
    flavorText: "Gathering Life's Snapshots",
    colors: ['#a855f7', '#ec4899'],
    bgPattern: 'photo-frames',
    animation: 'camera-flash',
    particleCount: 5,
    particleType: 'camera',
    intensity: 'low'
  },

  // ============ UNCOMMON TIER ============
  // 🎨 SPECTACULAR VISUAL ENHANCEMENTS - More impressive than Common
  
  'Golden Hour Guardian': {
    icon: '🌅',
    flavorText: 'Bathed in Amber Light',
    colors: ['#FBBF24', '#EA580C'], // Warm amber to deep orange
    bgPattern: 'sunset-rays',
    animation: 'golden-shimmer',
    particleCount: 12,
    particleType: 'sun-ray',
    intensity: 'medium'
  },
  'Neon Dreamer': {
    icon: '💡',
    flavorText: 'Illuminating Tomorrow',
    colors: ['#22D3EE', '#0284C7'], // Electric cyan
    bgPattern: 'neon-pulse',
    animation: 'electric-glow',
    particleCount: 14,
    particleType: 'electric-spark',
    intensity: 'medium'
  },
  'Surrealist': {
    icon: '🎨',
    flavorText: 'Painting Dreams into Reality',
    colors: ['#818CF8', '#4F46E5'], // Deep indigo
    bgPattern: 'paint-splash',
    animation: 'color-swirl',
    particleCount: 10,
    particleType: 'paint-drop',
    intensity: 'medium'
  },
  'Time Sculptor': {
    icon: '🗿',
    flavorText: 'Carving Memories in Stone',
    colors: ['#14B8A6', '#0D9488'], // Teal/aqua
    bgPattern: 'stone-chisel',
    animation: 'marble-texture',
    particleCount: 9,
    particleType: 'stone-chip',
    intensity: 'medium'
  },
  'Memory Broadcaster': {
    icon: '📡',
    flavorText: 'Transmitting Across Time',
    colors: ['#FB7185', '#E11D48'], // Rose pink
    bgPattern: 'signal-waves',
    animation: 'broadcast-pulse',
    particleCount: 12,
    particleType: 'signal-wave',
    intensity: 'medium'
  },
  'Ritual Keeper': {
    icon: '🕯️',
    flavorText: 'Sacred Flames of Tradition',
    colors: ['#34D399', '#059669'], // Emerald green
    bgPattern: 'candle-flicker',
    animation: 'flame-dance',
    particleCount: 11,
    particleType: 'flame-ember',
    intensity: 'medium'
  },
  'Vault Starter': {
    icon: '📦',
    flavorText: 'Opening New Chapters',
    colors: ['#60A5FA', '#2563EB'], // Sky blue
    bgPattern: 'vault-doors',
    animation: 'door-unlock',
    particleCount: 9,
    particleType: 'key-sparkle',
    intensity: 'medium'
  },
  'Multimedia Virtuoso': {
    icon: '🎭',
    flavorText: 'Master of All Mediums',
    colors: ['#06B6D4', '#0891B2'], // Cyan-teal gradient
    bgPattern: 'media-mosaic',
    animation: 'stage-spotlight',
    particleCount: 14,
    particleType: 'media-icon',
    intensity: 'medium'
  },
  'Word Painter': {
    icon: '🖌️',
    flavorText: 'Brushing Stories to Life',
    colors: ['#818CF8', '#6366F1'], // Violet-indigo
    bgPattern: 'ink-calligraphy',
    animation: 'brush-stroke',
    particleCount: 10,
    particleType: 'ink-splatter',
    intensity: 'medium'
  },
  'Frequency Keeper': {
    icon: '📻',
    flavorText: 'Tuned to the Past',
    colors: ['#F472B6', '#EC4899'], // Pink-magenta
    bgPattern: 'radio-waves',
    animation: 'frequency-scan',
    particleCount: 12,
    particleType: 'sound-wave',
    intensity: 'medium'
  },
  'Quantum Scheduler': {
    icon: '⚛️',
    flavorText: 'Bending Time Itself',
    colors: ['#A78BFA', '#7C3AED'], // Purple-violet
    bgPattern: 'quantum-field',
    animation: 'particle-spin',
    particleCount: 15,
    particleType: 'quantum-particle',
    intensity: 'medium'
  },
  'Community Weaver': {
    icon: '🤝',
    flavorText: 'Connecting Hearts Together',
    colors: ['#FB7185', '#E11D48'], // Warm rose-pink
    bgPattern: 'web-network',
    animation: 'connection-pulse',
    particleCount: 13,
    particleType: 'connection-node',
    intensity: 'medium'
  },
  'Echo Artisan': {
    icon: '🌊',
    flavorText: 'Rippling Through Time',
    colors: ['#34D399', '#10B981'], // Bright emerald-green
    bgPattern: 'water-ripple',
    animation: 'wave-echo',
    particleCount: 14,
    particleType: 'water-droplet',
    intensity: 'medium'
  },
  'Chrono Apprentice': {
    icon: '⏳',
    flavorText: 'Learning the Ways of Time',
    colors: ['#CD7F32', '#8B4513'], // Bronze/copper
    bgPattern: 'hourglass-flow',
    animation: 'sand-cascade',
    particleCount: 14,
    particleType: 'sand-grain',
    intensity: 'medium'
  },

  // ============ RARE TIER ============
  'Era Enthusiast': {
    icon: '🌟',
    flavorText: 'Embracing Every Chapter',
    colors: ['#06b6d4', '#0891b2'],
    bgPattern: 'constellation',
    animation: 'star-twinkle',
    particleCount: 10,
    particleType: 'star',
    intensity: 'medium'
  },
  'Story Curator': {
    icon: '🎭',
    flavorText: 'Crafting Narratives with Care',
    colors: ['#991b1b', '#b45309'],
    bgPattern: 'theater-stage',
    animation: 'curtain-sway',
    particleCount: 8,
    particleType: 'theater-mask',
    intensity: 'medium'
  },
  'Chronicler': {
    icon: '📖',
    flavorText: 'Recording History Daily',
    colors: ['#34D399', '#059669'],
    bgPattern: 'book-pages',
    animation: 'page-turn',
    particleCount: 8,
    particleType: 'bookmark',
    intensity: 'medium'
  },

  // ============ EPIC TIER ============
  'Nostalgia Weaver': {
    icon: '🧵',
    flavorText: 'Stitching Memories Together',
    colors: ['#d97706', '#92400e'],
    bgPattern: 'tapestry',
    animation: 'thread-weave',
    particleCount: 15,
    particleType: 'thread',
    intensity: 'high'
  },
  'Legacy Forger': {
    icon: '⚡',
    flavorText: 'Hammering Out Eternal Marks',
    colors: ['#ea580c', '#dc2626'],
    bgPattern: 'forge-metal',
    animation: 'anvil-strike',
    particleCount: 18,
    particleType: 'spark',
    intensity: 'high'
  },
  'Audio Alchemist': {
    icon: '🎵',
    flavorText: 'Transforming Sound into Magic',
    colors: ['#F472B6', '#E11D48'],
    bgPattern: 'sound-waves',
    animation: 'wave-pulse',
    particleCount: 16,
    particleType: 'note',
    intensity: 'high'
  },
  'Echo Magnet': {
    icon: '💬',
    flavorText: 'Drawing Voices from the Void',
    colors: ['#8B5CF6', '#6366F1'],
    bgPattern: 'echo-rings',
    animation: 'ripple-out',
    particleCount: 14,
    particleType: 'comment',
    intensity: 'high'
  },
  
  // NEW EPIC HORIZONS (Phase 1)
  'Genesis Eternal': {
    icon: '🌌',
    flavorText: 'Witnessing the Birth of Universes',
    colors: ['#0f0f23', '#1a0a2e', '#4169e1', '#8b5cf6'],
    bgPattern: 'cosmic-void',
    animation: 'big-bang-cycle',
    particleCount: 200,
    particleType: 'star',
    intensity: 'supreme'
  },
  'Prismatic Dusk': {
    icon: '🌈',
    flavorText: 'Refracting All Colors of Memory',
    colors: ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'],
    bgPattern: 'prism-refraction',
    animation: 'color-cycle',
    particleCount: 180,
    particleType: 'rainbow',
    intensity: 'supreme'
  },
  'Dawn Eternal': {
    icon: '🌄',
    flavorText: 'Guardian of the Golden Hour',
    colors: ['#fbbf24', '#f59e0b', '#fb923c', '#fcd34d'],
    bgPattern: 'sunrise-rays',
    animation: 'sun-rise',
    particleCount: 160,
    particleType: 'light-ray',
    intensity: 'supreme'
  },
  'Creative Nexus': {
    icon: '🎬',
    flavorText: 'Where All Media Converges',
    colors: ['#06b6d4', '#ec4899', '#fbbf24'],
    bgPattern: 'media-grid',
    animation: 'convergence',
    particleCount: 170,
    particleType: 'media-icon',
    intensity: 'supreme'
  },
  'Legacy Architect': {
    icon: '🏛️',
    flavorText: 'Building Eternal Monuments of Memory',
    colors: ['#FFD700', '#FF8C00'], // Gold to dark orange
    bgPattern: 'architectural-blueprint',
    animation: 'monument-materialize',
    particleCount: 190,
    particleType: 'construction',
    intensity: 'supreme'
  },

  // ============ LEGENDARY TIER ============
  'Memory Architect': {
    icon: '🏛️',
    flavorText: 'Building Legacies for Eternity',
    colors: ['#f59e0b', '#fef3c7'],
    bgPattern: 'blueprint-grid',
    animation: 'blueprint-scan',
    particleCount: 25,
    particleType: 'blueprint',
    intensity: 'supreme'
  },
  'Chronicle Keeper': {
    icon: '📜',
    flavorText: "Guardian of Time's Stories",
    colors: ['#92400e', '#451a03'],
    bgPattern: 'ancient-scroll',
    animation: 'scroll-unfurl',
    particleCount: 22,
    particleType: 'ink-drop',
    intensity: 'supreme'
  },
  'Temporal Sovereign': {
    icon: '👑',
    flavorText: 'Master of All Moments',
    colors: ['#7c3aed', '#fbbf24'],
    bgPattern: 'royal-velvet',
    animation: 'crown-sparkle',
    particleCount: 28,
    particleType: 'crown-jewel',
    intensity: 'supreme'
  },
  'Grand Historian': {
    icon: '📚',
    flavorText: 'Chronicling Centuries',
    colors: ['#FBBF24', '#D97706'],
    bgPattern: 'library-shelves',
    animation: 'book-glow',
    particleCount: 24,
    particleType: 'ancient-tome',
    intensity: 'supreme'
  },
  'Legend': {
    icon: '⭐',
    flavorText: 'Transcending Time Itself',
    colors: ['#F59E0B', '#DC2626'],
    bgPattern: 'cosmic-stars',
    animation: 'supernova',
    particleCount: 30,
    particleType: 'star-burst',
    intensity: 'supreme'
  },
  'Time Lord': {
    icon: '⌛',
    flavorText: 'Bending Eras to Your Will',
    colors: ['#8B5CF6', '#6D28D9'],
    bgPattern: 'time-vortex',
    animation: 'vortex-spin',
    particleCount: 26,
    particleType: 'time-fragment',
    intensity: 'supreme'
  },
  'Master Archivist': {
    icon: '🗃️',
    flavorText: 'Perfecting Preservation',
    colors: ['#818CF8', '#4F46E5'],
    bgPattern: 'archive-files',
    animation: 'file-organize',
    particleCount: 20,
    particleType: 'document',
    intensity: 'high'
  },
  'Keeper of Eras': {
    icon: '🗝️',
    flavorText: 'Guardian of the Vault',
    colors: ['#c026d3', '#e879f9'], // Fuchsia/Purple
    bgPattern: 'crystal-vault',
    animation: 'prism-refract',
    particleCount: 22,
    particleType: 'crystal',
    intensity: 'high'
  },
  
  // Additional Titles
  'Futurist': {
    icon: '🔮',
    flavorText: 'Glimpsing Tomorrow Today',
    colors: ['#22D3EE', '#0284C7'],
    bgPattern: 'time-vortex',
    animation: 'vortex-spin',
    particleCount: 12,
    particleType: 'time-fragment',
    intensity: 'medium'
  },
  'Dream Weaver': {
    icon: '💭',
    flavorText: 'Crafting Visions of the Night',
    colors: ['#C7D2FE', '#A5B4FC'],
    bgPattern: 'constellation',
    animation: 'gentle-pulse',
    particleCount: 10,
    particleType: 'star',
    intensity: 'medium'
  },
  'Sticker Master': {
    icon: '🎨',
    flavorText: 'Embellishing Every Moment',
    colors: ['#FB923C', '#DC2626'],
    bgPattern: 'subtle-gradient',
    animation: 'gentle-pulse',
    particleCount: 12,
    particleType: 'sparkle',
    intensity: 'medium'
  },
  'Chrononaut': {
    icon: '🚀',
    flavorText: 'Exploring the Temporal Expanse',
    colors: ['#C084FC', '#EC4899'],
    bgPattern: 'cosmic-stars',
    animation: 'vortex-spin',
    particleCount: 18,
    particleType: 'star-burst',
    intensity: 'high'
  },
  'Veteran': {
    icon: '🏅',
    flavorText: 'A Year of Dedication',
    colors: ['#FCD34D', '#F59E0B'],
    bgPattern: 'subtle-gradient',
    animation: 'gentle-pulse',
    particleCount: 15,
    particleType: 'sparkle',
    intensity: 'high'
  },
  'Midnight Chronicler': {
    icon: '🌙',
    flavorText: 'Writing Under Moonlight',
    colors: ['#6366F1', '#312E81'],
    bgPattern: 'constellation',
    animation: 'star-twinkle',
    particleCount: 14,
    particleType: 'star',
    intensity: 'high'
  },
  'Legacy Guardian': {
    icon: '🛡️',
    flavorText: 'Protecting What Matters',
    colors: ['#D8B4FE', '#A855F7'],
    bgPattern: 'subtle-gradient',
    animation: 'gentle-pulse',
    particleCount: 16,
    particleType: 'sparkle',
    intensity: 'high'
  },
  'Cinematographer': {
    icon: '🎬',
    flavorText: 'Capturing Motion and Emotion',
    colors: ['#4C1D95', '#6B21A8'],
    bgPattern: 'subtle-gradient',
    animation: 'camera-flash',
    particleCount: 14,
    particleType: 'camera',
    intensity: 'high'
  },
  'Social Connector': {
    icon: '🤝',
    flavorText: 'Building Bridges Between Hearts',
    colors: ['#10B981', '#047857'],
    bgPattern: 'echo-rings',
    animation: 'ripple-out',
    particleCount: 12,
    particleType: 'comment',
    intensity: 'medium'
  },
  'Master Curator': {
    icon: '🖼️',
    flavorText: 'Arranging Perfection',
    colors: ['#FDE047', '#FACC15'],
    bgPattern: 'archive-files',
    animation: 'file-organize',
    particleCount: 18,
    particleType: 'document',
    intensity: 'high'
  },
  'Archive Master': {
    icon: '📦',
    flavorText: 'Preserving a Thousand Stories',
    colors: ['#EAB308', '#CA8A04'],
    bgPattern: 'archive-files',
    animation: 'file-organize',
    particleCount: 22,
    particleType: 'document',
    intensity: 'supreme'
  },
  'Perfect Chronicler': {
    icon: '✍️',
    flavorText: 'Flawless Daily Documentation',
    colors: ['#F43F5E', '#BE123C'],
    bgPattern: 'book-pages',
    animation: 'page-turn',
    particleCount: 20,
    particleType: 'bookmark',
    intensity: 'high'
  },
  'Media Master': {
    icon: '🎞️',
    flavorText: 'Mastering All Forms',
    colors: ['#0EA5E9', '#06B6D4'],
    bgPattern: 'subtle-gradient',
    animation: 'gentle-pulse',
    particleCount: 10,
    particleType: 'camera',
    intensity: 'medium'
  },
  'Chronicle Weaver': {
    icon: '📝',
    flavorText: 'Writing Epic Tales',
    colors: ['#6366F1', '#4F46E5'],
    bgPattern: 'book-pages',
    animation: 'page-turn',
    particleCount: 12,
    particleType: 'bookmark',
    intensity: 'medium'
  },
  'Sonic Archivist': {
    icon: '🎧',
    flavorText: 'Preserving Every Sound',
    colors: ['#EC4899', '#DB2777'],
    bgPattern: 'sound-waves',
    animation: 'wave-pulse',
    particleCount: 14,
    particleType: 'note',
    intensity: 'medium'
  },
  'Parallel Keeper': {
    icon: '⏱️',
    flavorText: 'Synchronizing Timelines',
    colors: ['#A78BFA', '#7C3AED'],
    bgPattern: 'time-vortex',
    animation: 'vortex-spin',
    particleCount: 12,
    particleType: 'time-fragment',
    intensity: 'medium'
  },
  'Circle Builder': {
    icon: '💫',
    flavorText: 'Connecting Many Hearts',
    colors: ['#FB7185', '#E11D48'],
    bgPattern: 'echo-rings',
    animation: 'ripple-out',
    particleCount: 14,
    particleType: 'comment',
    intensity: 'medium'
  },
  'Moment Harvester': {
    icon: '🌾',
    flavorText: "Gathering the Day's Bounty",
    colors: ['#FBBF24', '#D97706'],
    bgPattern: 'subtle-gradient',
    animation: 'gentle-pulse',
    particleCount: 16,
    particleType: 'sparkle',
    intensity: 'high'
  },
  'Eternal Witness': {
    icon: '👁️',
    flavorText: 'Observing Every Hour',
    colors: ['#14B8A6', '#0D9488'],
    bgPattern: 'constellation',
    animation: 'star-twinkle',
    particleCount: 18,
    particleType: 'star',
    intensity: 'high'
  },
  'Sevenfold Sage': {
    icon: '🔯',
    flavorText: 'Mastering Sacred Numbers',
    colors: ['#F59E0B', '#DC2626'],
    bgPattern: 'cosmic-stars',
    animation: 'supernova',
    particleCount: 24,
    particleType: 'star-burst',
    intensity: 'supreme'
  },
  'Harmony Architect': {
    icon: '🎼',
    flavorText: 'Composing Perfect Balance',
    colors: ['#A78BFA', '#8B5CF6'],
    bgPattern: 'sound-waves',
    animation: 'wave-pulse',
    particleCount: 20,
    particleType: 'note',
    intensity: 'supreme'
  },

  // Fallback for unknown titles
  'default': {
    icon: '✨',
    flavorText: 'Preserving Your Story',
    colors: ['#6366f1', '#8b5cf6'],
    bgPattern: 'subtle-gradient',
    animation: 'gentle-pulse',
    particleCount: 8,
    particleType: 'sparkle',
    intensity: 'medium'
  }
};

// Helper function to get title config by name
export function getTitleConfig(titleName: string): TitleConfig {
  return titleConfigs[titleName] || titleConfigs['default'];
}

// Helper function to get title emoji icon
export function getTitleIcon(titleName: string): string {
  const config = getTitleConfig(titleName);
  return config.icon;
}