/**
 * Export History Management
 * Tracks the last 5 exports with timestamps and allows re-download
 * Stores in localStorage
 */

export interface ExportHistoryItem {
  id: string;
  folderName: string;
  fileCount: number;
  timestamp: number;
  estimatedSize: string;
}

const STORAGE_KEY = 'eras_export_history';
const MAX_HISTORY = 5;

/**
 * Get export history from localStorage
 */
export function getExportHistory(): ExportHistoryItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load export history:', error);
    return [];
  }
}

/**
 * Add new export to history
 */
export function addToExportHistory(item: Omit<ExportHistoryItem, 'id' | 'timestamp'>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const history = getExportHistory();
    const newItem: ExportHistoryItem = {
      ...item,
      id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    // Add to beginning and keep only last 5
    const updated = [newItem, ...history].slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save export history:', error);
  }
}

/**
 * Clear all export history
 */
export function clearExportHistory(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear export history:', error);
  }
}

/**
 * Format timestamp to readable string
 */
export function formatExportTimestamp(timestamp: number): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}
