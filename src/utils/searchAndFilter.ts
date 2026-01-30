import { FilterOptions } from '../components/AdvancedFilters';
import { SortOption } from '../components/SortDropdown';

interface Capsule {
  id: string;
  title?: string;
  message?: string;
  deliveryDate: string;
  recipient?: string;
  sender?: string;
  media?: any[];
  status?: string;
  echoes?: any[];
  reactions?: any[];
  folder?: string;
}

/**
 * Enhanced search function - searches across all capsule fields
 */
export function searchCapsules(capsules: Capsule[], searchTerm: string): Capsule[] {
  if (!searchTerm.trim()) {
    return capsules;
  }

  const term = searchTerm.toLowerCase();

  return capsules.filter(capsule => {
    // Search in title
    if (capsule.title?.toLowerCase().includes(term)) {
      return true;
    }

    // Search in message
    if (capsule.message?.toLowerCase().includes(term)) {
      return true;
    }

    // Search in recipient
    if (capsule.recipient?.toLowerCase().includes(term)) {
      return true;
    }

    // Search in sender
    if (capsule.sender?.toLowerCase().includes(term)) {
      return true;
    }

    // Search in media filenames
    if (capsule.media && capsule.media.length > 0) {
      const hasMatchingMedia = capsule.media.some(media => {
        const filename = media.url?.split('/').pop()?.toLowerCase() || '';
        return filename.includes(term);
      });
      if (hasMatchingMedia) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Apply advanced filters to capsules
 */
export function filterCapsules(capsules: Capsule[], filters: FilterOptions): Capsule[] {
  let filtered = [...capsules];

  // Date range filter
  if (filters.dateFrom) {
    const fromDate = new Date(filters.dateFrom);
    fromDate.setHours(0, 0, 0, 0);
    filtered = filtered.filter(capsule => {
      const capsuleDate = new Date(capsule.deliveryDate);
      return capsuleDate >= fromDate;
    });
  }

  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo);
    toDate.setHours(23, 59, 59, 999);
    filtered = filtered.filter(capsule => {
      const capsuleDate = new Date(capsule.deliveryDate);
      return capsuleDate <= toDate;
    });
  }

  // Media type filter
  if (filters.mediaTypes && filters.mediaTypes.length > 0) {
    filtered = filtered.filter(capsule => {
      if (!capsule.media || capsule.media.length === 0) {
        return false;
      }

      return capsule.media.some(media => {
        const mediaType = media.type || '';
        return filters.mediaTypes!.some(filterType => 
          mediaType.startsWith(filterType)
        );
      });
    });
  }

  // Folder filter
  if (filters.folder) {
    filtered = filtered.filter(capsule => 
      capsule.folder === filters.folder
    );
  }

  // Status filter
  if (filters.status && filters.status.length > 0) {
    filtered = filtered.filter(capsule => {
      const capsuleStatus = getCapsuleStatus(capsule);
      return filters.status!.includes(capsuleStatus);
    });
  }

  // Has echoes filter
  if (filters.hasEchoes !== undefined) {
    filtered = filtered.filter(capsule => {
      const hasEchoes = (capsule.echoes && capsule.echoes.length > 0) ||
                       (capsule.reactions && capsule.reactions.length > 0);
      return filters.hasEchoes ? hasEchoes : !hasEchoes;
    });
  }

  return filtered;
}

/**
 * Sort capsules based on sort option
 */
export function sortCapsules(capsules: Capsule[], sortOption: SortOption): Capsule[] {
  const sorted = [...capsules];

  switch (sortOption) {
    case 'newest':
      return sorted.sort((a, b) => 
        new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime()
      );

    case 'oldest':
      return sorted.sort((a, b) => 
        new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime()
      );

    case 'most-media':
      return sorted.sort((a, b) => {
        const aMedia = a.media?.length || 0;
        const bMedia = b.media?.length || 0;
        return bMedia - aMedia;
      });

    case 'most-echoes':
      return sorted.sort((a, b) => {
        const aEchoes = (a.echoes?.length || 0) + (a.reactions?.length || 0);
        const bEchoes = (b.echoes?.length || 0) + (b.reactions?.length || 0);
        return bEchoes - aEchoes;
      });

    case 'alphabetical':
      return sorted.sort((a, b) => {
        const aTitle = (a.title || 'Untitled').toLowerCase();
        const bTitle = (b.title || 'Untitled').toLowerCase();
        return aTitle.localeCompare(bTitle);
      });

    default:
      return sorted;
  }
}

/**
 * Get capsules from "On This Day" (same month/day from previous years)
 */
export function getOnThisDayCapsules(capsules: Capsule[]): Capsule[] {
  const today = new Date();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();
  const currentYear = today.getFullYear();

  return capsules.filter(capsule => {
    const deliveryDate = new Date(capsule.deliveryDate);
    const capsuleMonth = deliveryDate.getMonth();
    const capsuleDay = deliveryDate.getDate();
    const capsuleYear = deliveryDate.getFullYear();

    // Same month/day but from a previous year
    return capsuleMonth === todayMonth && 
           capsuleDay === todayDay && 
           capsuleYear < currentYear;
  });
}

/**
 * Helper function to determine capsule status
 */
function getCapsuleStatus(capsule: Capsule): string {
  if (capsule.status) {
    return capsule.status;
  }

  const now = new Date();
  const deliveryDate = new Date(capsule.deliveryDate);

  if (deliveryDate > now) {
    return 'scheduled';
  } else if (capsule.recipient) {
    return 'delivered';
  } else {
    return 'received';
  }
}

/**
 * Highlight matching text in search results
 */
export function highlightText(text: string, searchTerm: string): string {
  if (!searchTerm.trim()) {
    return text;
  }

  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-400/30 text-yellow-200">$1</mark>');
}

/**
 * Combined search, filter, and sort function
 */
export function processCapsulesWithSearchAndFilters(
  capsules: Capsule[],
  searchTerm: string,
  filters: FilterOptions,
  sortOption: SortOption
): Capsule[] {
  // Step 1: Search
  let processed = searchCapsules(capsules, searchTerm);

  // Step 2: Filter
  processed = filterCapsules(processed, filters);

  // Step 3: Sort
  processed = sortCapsules(processed, sortOption);

  return processed;
}
