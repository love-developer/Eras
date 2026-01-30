/**
 * PHASE 1 PERFORMANCE OPTIMIZATION - Performance Monitoring Utility
 * Tracks and logs performance metrics for optimization
 */

interface PerformanceMetric {
  label: string;
  duration: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 100; // Keep last 100 measurements
  private readonly SLOW_THRESHOLD = 3500; // Warn if operation takes > 3.5 seconds (adjusted for database queries with 20+ capsules)

  /**
   * Measure the duration of an operation
   */
  measure(label: string) {
    const start = performance.now();
    
    return {
      end: (metadata?: Record<string, any>) => {
        const duration = performance.now() - start;
        
        // Store metric
        this.metrics.push({
          label,
          duration,
          timestamp: Date.now()
        });

        // Keep only recent metrics
        if (this.metrics.length > this.MAX_METRICS) {
          this.metrics = this.metrics.slice(-this.MAX_METRICS);
        }

        // Log with appropriate level
        const metadataStr = metadata ? ` | ${JSON.stringify(metadata)}` : '';
        
        if (duration > this.SLOW_THRESHOLD) {
          console.warn(`⏱️ SLOW: ${label}: ${duration.toFixed(2)}ms${metadataStr}`);
        } else if (duration > 500) {
          console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms${metadataStr}`);
        } else {
          console.log(`⚡ ${label}: ${duration.toFixed(2)}ms${metadataStr}`);
        }

        return duration;
      }
    };
  }

  /**
   * Measure async operation
   */
  async measureAsync<T>(
    label: string, 
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const timer = this.measure(label);
    try {
      const result = await fn();
      timer.end({ ...metadata, status: 'success' });
      return result;
    } catch (error) {
      timer.end({ ...metadata, status: 'error', error: error.message });
      throw error;
    }
  }

  /**
   * Get statistics for a specific operation
   */
  getStats(label?: string): {
    count: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    p95Duration: number;
  } {
    const relevantMetrics = label 
      ? this.metrics.filter(m => m.label === label)
      : this.metrics;

    if (relevantMetrics.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p95Duration: 0
      };
    }

    const durations = relevantMetrics.map(m => m.duration).sort((a, b) => a - b);
    const sum = durations.reduce((a, b) => a + b, 0);
    const p95Index = Math.floor(durations.length * 0.95);

    return {
      count: relevantMetrics.length,
      avgDuration: sum / durations.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p95Duration: durations[p95Index] || 0
    };
  }

  /**
   * Log all statistics
   */
  logStats() {
    const operations = [...new Set(this.metrics.map(m => m.label))];
    
    console.group('📊 Performance Statistics');
    operations.forEach(label => {
      const stats = this.getStats(label);
      console.log(`${label}:`, {
        count: stats.count,
        avg: `${stats.avgDuration.toFixed(2)}ms`,
        min: `${stats.minDuration.toFixed(2)}ms`,
        max: `${stats.maxDuration.toFixed(2)}ms`,
        p95: `${stats.p95Duration.toFixed(2)}ms`
      });
    });
    console.groupEnd();
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
    console.log('🧹 Performance metrics cleared');
  }

  /**
   * Mark a Web Vitals metric (for Core Web Vitals tracking)
   */
  markWebVital(name: string, value: number) {
    console.log(`🎯 Web Vital - ${name}: ${value.toFixed(2)}ms`);
    
    // Store as regular metric
    this.metrics.push({
      label: `WebVital:${name}`,
      duration: value,
      timestamp: Date.now()
    });
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Convenience exports
export const measurePerformance = (label: string) => performanceMonitor.measure(label);
export const measureAsync = <T,>(label: string, fn: () => Promise<T>, metadata?: Record<string, any>) => 
  performanceMonitor.measureAsync(label, fn, metadata);

// Auto-initialize and expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).__performanceMonitor = performanceMonitor;
  console.log('💡 Performance monitor available at window.__performanceMonitor');
}