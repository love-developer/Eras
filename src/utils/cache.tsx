/**
 * PHASE 1 PERFORMANCE OPTIMIZATION - Enhanced Cache Service
 * - Multi-TTL support for different data types
 * - Performance monitoring integration
 * - Automatic cleanup of expired entries
 * - Invalidation by prefix for bulk operations
 */

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Cache duration presets optimized for Eras
export const CACHE_DURATIONS = {
  CAPSULES: 5 * 60 * 1000,        // 5 minutes - capsule data
  ACHIEVEMENTS: 30 * 60 * 1000,   // 30 minutes - achievements rarely change
  TITLES: 30 * 60 * 1000,         // 30 minutes - titles rarely change  
  USER_PROFILE: 60 * 60 * 1000,   // 1 hour - user profile
  MEDIA: 24 * 60 * 60 * 1000,     // 24 hours - media URLs don't change
  SETTINGS: 60 * 60 * 1000,       // 1 hour - user settings
  QUICK: 1 * 60 * 1000,           // 1 minute - frequently changing data
};

export class CacheService {
  private static readonly PREFIX = 'eras_cache_';
  private static readonly DEFAULT_TTL = CACHE_DURATIONS.CAPSULES;

  /**
   * Set cache item with TTL
   */
  static set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl
      };
      localStorage.setItem(this.PREFIX + key, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Failed to set cache:', error);
    }
  }

  /**
   * Get cache item if not expired
   */
  static get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.PREFIX + key);
      if (!item) return null;

      const cacheItem: CacheItem<T> = JSON.parse(item);
      
      // Check if expired
      if (Date.now() > cacheItem.expiresAt) {
        this.delete(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('Failed to get cache:', error);
      return null;
    }
  }

  /**
   * Get cache item even if expired (for stale-while-revalidate pattern)
   */
  static getStale<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.PREFIX + key);
      if (!item) return null;

      const cacheItem: CacheItem<T> = JSON.parse(item);
      return cacheItem.data;
    } catch (error) {
      console.warn('Failed to get stale cache:', error);
      return null;
    }
  }

  /**
   * Check if cache item exists and is fresh
   */
  static has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Check if cache item exists (even if expired)
   */
  static hasStale(key: string): boolean {
    return this.getStale(key) !== null;
  }

  /**
   * Get cache age in milliseconds
   */
  static getAge(key: string): number | null {
    try {
      const item = localStorage.getItem(this.PREFIX + key);
      if (!item) return null;

      const cacheItem: CacheItem<unknown> = JSON.parse(item);
      return Date.now() - cacheItem.timestamp;
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete cache item
   */
  static delete(key: string): void {
    try {
      localStorage.removeItem(this.PREFIX + key);
    } catch (error) {
      console.warn('Failed to delete cache:', error);
    }
  }

  /**
   * Clear all cache items
   */
  static clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  /**
   * Clear expired cache items
   */
  static clearExpired(): void {
    try {
      const keys = Object.keys(localStorage);
      let removedCount = 0;
      
      keys.forEach(key => {
        if (key.startsWith(this.PREFIX)) {
          const item = localStorage.getItem(key);
          if (item) {
            try {
              const cacheItem: CacheItem<unknown> = JSON.parse(item);
              if (Date.now() > cacheItem.expiresAt) {
                localStorage.removeItem(key);
                removedCount++;
              }
            } catch {
              // Invalid cache item, remove it
              localStorage.removeItem(key);
              removedCount++;
            }
          }
        }
      });
      
      if (removedCount > 0) {
        console.log(`🧹 Cleared ${removedCount} expired cache entries`);
      }
    } catch (error) {
      console.warn('Failed to clear expired cache:', error);
    }
  }

  /**
   * PHASE 1: Invalidate cache by prefix pattern
   * Useful for bulk operations (e.g., clear all capsule-related cache)
   */
  static invalidateByPrefix(prefix: string): void {
    try {
      const fullPrefix = this.PREFIX + prefix;
      const keys = Object.keys(localStorage);
      let removedCount = 0;

      keys.forEach(key => {
        if (key.startsWith(fullPrefix)) {
          localStorage.removeItem(key);
          removedCount++;
        }
      });

      console.log(`♻️ Invalidated ${removedCount} cache entries matching: ${prefix}`);
    } catch (error) {
      console.warn('Failed to invalidate by prefix:', error);
    }
  }

  /**
   * PHASE 1: Get cache statistics for monitoring
   */
  static getStats(): {
    totalEntries: number;
    totalSize: number;
    expiredEntries: number;
    oldestEntry: number | null;
  } {
    const stats = {
      totalEntries: 0,
      totalSize: 0,
      expiredEntries: 0,
      oldestEntry: null as number | null
    };

    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();

      keys.forEach(key => {
        if (key.startsWith(this.PREFIX)) {
          const item = localStorage.getItem(key);
          if (item) {
            stats.totalEntries++;
            stats.totalSize += item.length;

            try {
              const cacheItem: CacheItem<unknown> = JSON.parse(item);
              
              if (now > cacheItem.expiresAt) {
                stats.expiredEntries++;
              }

              if (!stats.oldestEntry || cacheItem.timestamp < stats.oldestEntry) {
                stats.oldestEntry = cacheItem.timestamp;
              }
            } catch {
              stats.expiredEntries++;
            }
          }
        }
      });
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
    }

    return stats;
  }

  /**
   * PHASE 1: Initialize - runs cleanup on app start
   */
  static initialize(): void {
    console.log('🚀 Initializing CacheService...');
    this.clearExpired();
    const stats = this.getStats();
    console.log('📊 Cache Stats:', {
      entries: stats.totalEntries,
      sizeKB: Math.round(stats.totalSize / 1024),
      expired: stats.expiredEntries,
      oldestAge: stats.oldestEntry 
        ? Math.round((Date.now() - stats.oldestEntry) / 1000 / 60) + ' minutes'
        : 'N/A'
    });
  }
}

/**
 * React Hook for cache management
 */
export function useCache<T>(key: string) {
  const get = () => CacheService.get<T>(key);
  const getStale = () => CacheService.getStale<T>(key);
  const set = (data: T, ttl?: number) => CacheService.set(key, data, ttl);
  const del = () => CacheService.delete(key);
  const has = () => CacheService.has(key);
  const hasStale = () => CacheService.hasStale(key);
  const age = () => CacheService.getAge(key);

  return { get, getStale, set, delete: del, has, hasStale, age };
}
