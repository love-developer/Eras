// Smart Folder Rule Engine - Declarative folder filtering system
// Matches the pattern used in achievement-service.tsx

export interface FolderRule {
  id: string;
  name: string;
  description: string;
  conditions: FolderCondition[];
  autoColor?: string;
  icon?: string;
}

export interface FolderCondition {
  field: 'type' | 'timestamp' | 'duration' | 'size' | 'folderId';
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'in';
  value: any;
}

// Predefined smart folder templates
export const SMART_FOLDER_TEMPLATES: Record<string, FolderRule> = {
  photos: {
    id: 'smart_photos',
    name: 'Photos',
    description: 'Automatically collect all photo media',
    conditions: [
      { field: 'type', operator: '=', value: 'photo' }
    ],
    autoColor: 'blue',
    icon: '📷'
  },
  videos: {
    id: 'smart_videos',
    name: 'Videos',
    description: 'Automatically collect all video media',
    conditions: [
      { field: 'type', operator: '=', value: 'video' }
    ],
    autoColor: 'purple',
    icon: '🎬'
  },
  audio: {
    id: 'smart_audio',
    name: 'Voice Notes',
    description: 'Automatically collect all audio recordings',
    conditions: [
      { field: 'type', operator: '=', value: 'audio' }
    ],
    autoColor: 'green',
    icon: '🎙️'
  },
  recent_photos: {
    id: 'smart_recent_photos',
    name: 'Recent Photos',
    description: 'Photos from the last 7 days',
    conditions: [
      { field: 'type', operator: '=', value: 'photo' },
      { field: 'timestamp', operator: '>', value: Date.now() - 7 * 24 * 60 * 60 * 1000 }
    ],
    autoColor: 'pink',
    icon: '✨'
  },
  long_videos: {
    id: 'smart_long_videos',
    name: 'Long Videos',
    description: 'Videos longer than 60 seconds',
    conditions: [
      { field: 'type', operator: '=', value: 'video' },
      { field: 'duration', operator: '>', value: 60 }
    ],
    autoColor: 'orange',
    icon: '🎞️'
  },
  this_month: {
    id: 'smart_this_month',
    name: 'This Month',
    description: 'All media from current month',
    conditions: [
      { field: 'timestamp', operator: '>', value: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime() }
    ],
    autoColor: 'yellow',
    icon: '📅'
  }
};

// Evaluate if a media item matches folder conditions
export function matchesRule(item: any, rule: FolderRule): boolean {
  return rule.conditions.every(condition => evaluateCondition(item, condition));
}

function evaluateCondition(item: any, condition: FolderCondition): boolean {
  const itemValue = item[condition.field];
  const conditionValue = condition.value;

  switch (condition.operator) {
    case '=':
      return itemValue === conditionValue;
    case '!=':
      return itemValue !== conditionValue;
    case '>':
      return itemValue > conditionValue;
    case '<':
      return itemValue < conditionValue;
    case '>=':
      return itemValue >= conditionValue;
    case '<=':
      return itemValue <= conditionValue;
    case 'contains':
      return String(itemValue).toLowerCase().includes(String(conditionValue).toLowerCase());
    case 'in':
      return Array.isArray(conditionValue) && conditionValue.includes(itemValue);
    default:
      return false;
  }
}

// Apply rules to filter media items
export function filterByRules(items: any[], rules: FolderRule[]): Map<string, any[]> {
  const results = new Map<string, any[]>();
  
  rules.forEach(rule => {
    const matchingItems = items.filter(item => matchesRule(item, rule));
    if (matchingItems.length > 0) {
      results.set(rule.id, matchingItems);
    }
  });
  
  return results;
}

// Check if folder name suggests it's a smart folder
export function isSmartFolderName(folderName: string): string | null {
  const lowerName = folderName.toLowerCase();
  
  for (const [key, template] of Object.entries(SMART_FOLDER_TEMPLATES)) {
    if (lowerName.includes(template.name.toLowerCase())) {
      return key;
    }
  }
  
  return null;
}

// Get suggested smart folder rule based on folder name
export function getSuggestedRule(folderName: string): FolderRule | null {
  const smartKey = isSmartFolderName(folderName);
  return smartKey ? SMART_FOLDER_TEMPLATES[smartKey] : null;
}
