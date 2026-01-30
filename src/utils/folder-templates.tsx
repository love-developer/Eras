// Eras-Themed Folder Templates
// 8 unique pre-designed folder structures for common use cases

export interface FolderTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'personal' | 'family' | 'creative' | 'travel' | 'work';
  folders: FolderDefinition[];
  theme: 'cosmic' | 'family' | 'adventure' | 'professional' | 'artistic';
}

export interface FolderDefinition {
  name: string;
  color: string;
  description?: string;
  tags?: string[];
  icon?: string;
}

// ============================================
// ERAS-THEMED FOLDER TEMPLATES
// ============================================

export const FOLDER_TEMPLATES: Record<string, FolderTemplate> = {
  // ============================================
  // PERSONAL TEMPLATES
  // ============================================
  cosmic_journey: {
    id: 'cosmic_journey',
    name: 'Cosmic Journey',
    description: 'Organize your memories across the universe of time',
    icon: '🌌',
    category: 'personal',
    theme: 'cosmic',
    folders: [
      {
        name: 'My Photos',
        color: 'blue',
        description: 'Visual memories frozen in time',
        tags: ['images', 'pictures', 'snapshots'],
        icon: '📷'
      },
      {
        name: 'My Videos',
        color: 'purple',
        description: 'Moving moments captured forever',
        tags: ['clips', 'recordings', 'footage'],
        icon: '🎬'
      },
      {
        name: 'Voice Notes',
        color: 'green',
        description: 'Echoes of your thoughts and feelings',
        tags: ['audio', 'recordings', 'notes'],
        icon: '🎙️'
      },
      {
        name: 'Special Moments',
        color: 'pink',
        description: 'The memories that matter most',
        tags: ['highlights', 'favorites', 'milestones'],
        icon: '✨'
      }
    ]
  },

  life_chapters: {
    id: 'life_chapters',
    name: 'Life Chapters',
    description: 'Organize memories by the chapters of your life',
    icon: '📖',
    category: 'personal',
    theme: 'cosmic',
    folders: [
      {
        name: 'Childhood',
        color: 'yellow',
        description: 'The early years and formative memories',
        tags: ['youth', 'early-years', 'growing-up'],
        icon: '🎈'
      },
      {
        name: 'School Days',
        color: 'blue',
        description: 'Learning, friends, and adventures',
        tags: ['education', 'friends', 'growth'],
        icon: '🎓'
      },
      {
        name: 'Milestones',
        color: 'purple',
        description: 'Life-changing moments and achievements',
        tags: ['achievements', 'celebrations', 'special'],
        icon: '🏆'
      },
      {
        name: 'Recent Years',
        color: 'pink',
        description: 'The present era and current memories',
        tags: ['current', 'now', 'today'],
        icon: '🌟'
      }
    ]
  },

  // ============================================
  // FAMILY TEMPLATES
  // ============================================
  family_legacy: {
    id: 'family_legacy',
    name: 'Family Legacy',
    description: 'Preserve memories across generations',
    icon: '👨‍👩‍👧‍👦',
    category: 'family',
    theme: 'family',
    folders: [
      {
        name: 'Grandparents',
        color: 'yellow',
        description: 'Stories and memories from the elders',
        tags: ['heritage', 'wisdom', 'roots'],
        icon: '👵'
      },
      {
        name: 'Parents',
        color: 'orange',
        description: 'Our guides and first teachers',
        tags: ['mom', 'dad', 'guardians'],
        icon: '👨‍👩'
      },
      {
        name: 'Siblings',
        color: 'blue',
        description: 'Partners in crime and lifelong friends',
        tags: ['brothers', 'sisters', 'family'],
        icon: '👫'
      },
      {
        name: 'Kids',
        color: 'pink',
        description: 'The next generation and their adventures',
        tags: ['children', 'youth', 'future'],
        icon: '👶'
      },
      {
        name: 'Family Events',
        color: 'purple',
        description: 'Gatherings, celebrations, and traditions',
        tags: ['reunions', 'holidays', 'celebrations'],
        icon: '🎉'
      }
    ]
  },

  kids_growing_up: {
    id: 'kids_growing_up',
    name: 'Kids Growing Up',
    description: 'Track your children\'s journey through life',
    icon: '👶',
    category: 'family',
    theme: 'family',
    folders: [
      {
        name: 'First Year',
        color: 'pink',
        description: 'Precious moments from year one',
        tags: ['baby', 'infant', 'firsts'],
        icon: '🍼'
      },
      {
        name: 'Toddler Years',
        color: 'yellow',
        description: 'Walking, talking, and exploring',
        tags: ['toddler', 'learning', 'growth'],
        icon: '🧸'
      },
      {
        name: 'School Years',
        color: 'blue',
        description: 'Education and friendships',
        tags: ['school', 'learning', 'friends'],
        icon: '🎒'
      },
      {
        name: 'Milestones',
        color: 'purple',
        description: 'Special achievements and firsts',
        tags: ['achievements', 'firsts', 'special'],
        icon: '🏆'
      }
    ]
  },

  // ============================================
  // TRAVEL TEMPLATES
  // ============================================
  travel_archive: {
    id: 'travel_archive',
    name: 'Travel Archive',
    description: 'Document your adventures around the world',
    icon: '✈️',
    category: 'travel',
    theme: 'adventure',
    folders: [
      {
        name: 'Destinations',
        color: 'blue',
        description: 'Places you\'ve explored and conquered',
        tags: ['locations', 'cities', 'countries'],
        icon: '🗺️'
      },
      {
        name: 'Food & Culture',
        color: 'orange',
        description: 'Local flavors and cultural experiences',
        tags: ['cuisine', 'traditions', 'local'],
        icon: '🍜'
      },
      {
        name: 'Adventures',
        color: 'red',
        description: 'Thrilling experiences and activities',
        tags: ['activities', 'experiences', 'fun'],
        icon: '🏔️'
      },
      {
        name: 'People Met',
        color: 'pink',
        description: 'Friends made along the journey',
        tags: ['friends', 'locals', 'connections'],
        icon: '👥'
      },
      {
        name: 'Souvenirs',
        color: 'purple',
        description: 'Mementos and treasures collected',
        tags: ['keepsakes', 'memories', 'items'],
        icon: '🎁'
      }
    ]
  },

  // ============================================
  // CREATIVE TEMPLATES
  // ============================================
  creative_portfolio: {
    id: 'creative_portfolio',
    name: 'Creative Portfolio',
    description: 'Showcase your artistic journey and creations',
    icon: '🎨',
    category: 'creative',
    theme: 'artistic',
    folders: [
      {
        name: 'Photography',
        color: 'blue',
        description: 'Your best shots and photo work',
        tags: ['photos', 'art', 'visual'],
        icon: '📸'
      },
      {
        name: 'Videos',
        color: 'purple',
        description: 'Film projects and video content',
        tags: ['film', 'video', 'projects'],
        icon: '🎥'
      },
      {
        name: 'Audio Projects',
        color: 'green',
        description: 'Music, podcasts, and audio work',
        tags: ['music', 'audio', 'sound'],
        icon: '🎵'
      },
      {
        name: 'Work in Progress',
        color: 'yellow',
        description: 'Current projects and ideas',
        tags: ['wip', 'drafts', 'ideas'],
        icon: '🔨'
      },
      {
        name: 'Completed Works',
        color: 'pink',
        description: 'Finished masterpieces',
        tags: ['finished', 'complete', 'portfolio'],
        icon: '✨'
      }
    ]
  },

  music_collection: {
    id: 'music_collection',
    name: 'Music Collection',
    description: 'Organize your musical memories and recordings',
    icon: '🎵',
    category: 'creative',
    theme: 'artistic',
    folders: [
      {
        name: 'Original Songs',
        color: 'purple',
        description: 'Your musical creations',
        tags: ['original', 'compositions', 'songs'],
        icon: '🎼'
      },
      {
        name: 'Live Performances',
        color: 'red',
        description: 'Concert and performance recordings',
        tags: ['live', 'concerts', 'performances'],
        icon: '🎤'
      },
      {
        name: 'Practice Sessions',
        color: 'blue',
        description: 'Learning and improvement',
        tags: ['practice', 'learning', 'progress'],
        icon: '🎹'
      },
      {
        name: 'Collaborations',
        color: 'pink',
        description: 'Working with other artists',
        tags: ['collab', 'team', 'together'],
        icon: '👥'
      }
    ]
  },

  // ============================================
  // WORK/PROFESSIONAL TEMPLATES
  // ============================================
  project_workspace: {
    id: 'project_workspace',
    name: 'Project Workspace',
    description: 'Organize professional work and projects',
    icon: '💼',
    category: 'work',
    theme: 'professional',
    folders: [
      {
        name: 'Active Projects',
        color: 'blue',
        description: 'Current work in progress',
        tags: ['active', 'current', 'wip'],
        icon: '📊'
      },
      {
        name: 'Research & References',
        color: 'green',
        description: 'Background materials and resources',
        tags: ['research', 'references', 'resources'],
        icon: '📚'
      },
      {
        name: 'Deliverables',
        color: 'purple',
        description: 'Completed work and final outputs',
        tags: ['final', 'complete', 'delivered'],
        icon: '📦'
      },
      {
        name: 'Archive',
        color: 'slate',
        description: 'Completed and archived projects',
        tags: ['archived', 'old', 'complete'],
        icon: '🗄️'
      }
    ]
  }
};

// ============================================
// TEMPLATE CATEGORIES
// ============================================

export const TEMPLATE_CATEGORIES = [
  { id: 'personal', name: 'Personal', icon: '👤', description: 'For individual memory keeping' },
  { id: 'family', name: 'Family', icon: '👨‍👩‍👧‍👦', description: 'For family memories and legacy' },
  { id: 'travel', name: 'Travel', icon: '✈️', description: 'For adventures and journeys' },
  { id: 'creative', name: 'Creative', icon: '🎨', description: 'For artistic and creative work' },
  { id: 'work', name: 'Work', icon: '💼', description: 'For professional projects' }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all templates for a specific category
 */
export function getTemplatesByCategory(category: string): FolderTemplate[] {
  return Object.values(FOLDER_TEMPLATES).filter(t => t.category === category);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): FolderTemplate | undefined {
  return FOLDER_TEMPLATES[id];
}

/**
 * Get all template IDs
 */
export function getAllTemplateIds(): string[] {
  return Object.keys(FOLDER_TEMPLATES);
}

/**
 * Get popular templates (most commonly used)
 */
export function getPopularTemplates(): FolderTemplate[] {
  return [
    FOLDER_TEMPLATES.cosmic_journey,
    FOLDER_TEMPLATES.family_legacy,
    FOLDER_TEMPLATES.travel_archive,
    FOLDER_TEMPLATES.creative_portfolio
  ];
}

/**
 * Search templates by name or description
 */
export function searchTemplates(query: string): FolderTemplate[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(FOLDER_TEMPLATES).filter(
    t => 
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery)
  );
}
