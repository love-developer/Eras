/**
 * 🚀 PERFORMANCE: Global in-memory cache for capsule media files
 * 
 * This cache stores enriched media data (with thumbnails) to enable
 * instantaneous loading in CapsuleDetailModal and other components.
 * 
 * Cache is populated by:
 * 1. Dashboard/Calendar/Timeline pre-fetching on load
 * 2. CapsuleDetailModal fetching on-demand for cache misses
 * 
 * Cache is invalidated when capsules are edited/deleted.
 */

interface CachedMedia {
  capsuleId: string;
  media: any[];
  timestamp: number;
}

class MediaCacheManager {
  private cache = new Map<string, CachedMedia>();
  private maxAge = 5 * 60 * 1000; // 5 minutes cache TTL
  
  /**
   * Get cached media for a capsule
   * @returns Cached media array, or null if not found/expired
   */
  get(capsuleId: string): any[] | null {
    const cached = this.cache.get(capsuleId);
    
    if (!cached) {
      return null;
    }
    
    // Check if cache is stale
    const age = Date.now() - cached.timestamp;
    if (age > this.maxAge) {
      console.log(`🗑️ [MediaCache] Expired cache for capsule ${capsuleId} (age: ${Math.round(age / 1000)}s)`);
      this.cache.delete(capsuleId);
      return null;
    }
    
    console.log(`✅ [MediaCache] Cache HIT for capsule ${capsuleId} (${cached.media.length} files, age: ${Math.round(age / 1000)}s)`);
    return cached.media;
  }
  
  /**
   * Store media in cache
   */
  set(capsuleId: string, media: any[]): void {
    console.log(`💾 [MediaCache] Caching ${media.length} files for capsule ${capsuleId}`);
    this.cache.set(capsuleId, {
      capsuleId,
      media,
      timestamp: Date.now()
    });
  }
  
  /**
   * Invalidate cache for a specific capsule (call after edits)
   */
  invalidate(capsuleId: string): void {
    const existed = this.cache.has(capsuleId);
    this.cache.delete(capsuleId);
    if (existed) {
      console.log(`🗑️ [MediaCache] Invalidated cache for capsule ${capsuleId}`);
    }
  }
  
  /**
   * Invalidate all cached media
   */
  invalidateAll(): void {
    const count = this.cache.size;
    this.cache.clear();
    console.log(`🗑️ [MediaCache] Cleared all cache (${count} entries)`);
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
  
  /**
   * Check if capsule has cached media
   */
  has(capsuleId: string): boolean {
    return this.get(capsuleId) !== null;
  }
}

// Singleton instance
export const mediaCache = new MediaCacheManager();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).__mediaCache = mediaCache;
}
