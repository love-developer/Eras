import { useEffect, useRef } from 'react';

/**
 * Performance monitoring hook
 * Tracks FPS and warns about performance issues
 */

export function usePerformanceMonitor(componentName: string, enabled: boolean = false) {
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const fpsHistory = useRef<number[]>([]);

  useEffect(() => {
    if (!enabled) return;

    let rafId: number;
    
    const measureFPS = () => {
      frameCount.current++;
      const currentTime = performance.now();
      
      // Calculate FPS every second
      if (currentTime >= lastTime.current + 1000) {
        const fps = Math.round((frameCount.current * 1000) / (currentTime - lastTime.current));
        fpsHistory.current.push(fps);
        
        // Keep only last 10 measurements
        if (fpsHistory.current.length > 10) {
          fpsHistory.current.shift();
        }
        
        // Calculate average FPS
        const avgFPS = fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length;
        
        // Warn if FPS drops below 30
        if (avgFPS < 30) {
          console.warn(`⚠️ [Performance] ${componentName} - Low FPS: ${avgFPS.toFixed(1)} fps (target: 60 fps)`);
        } else if (avgFPS < 50) {
          console.log(`📊 [Performance] ${componentName} - FPS: ${avgFPS.toFixed(1)} fps`);
        }
        
        frameCount.current = 0;
        lastTime.current = currentTime;
      }
      
      rafId = requestAnimationFrame(measureFPS);
    };
    
    rafId = requestAnimationFrame(measureFPS);
    
    return () => {
      cancelAnimationFrame(rafId);
      
      // Log final stats
      if (fpsHistory.current.length > 0) {
        const avgFPS = fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length;
        console.log(`📊 [Performance] ${componentName} - Average FPS: ${avgFPS.toFixed(1)} fps`);
      }
    };
  }, [componentName, enabled]);
}

/**
 * Measure component render time
 */
export function useRenderTime(componentName: string, enabled: boolean = false) {
  const renderCount = useRef(0);
  const renderStart = useRef(performance.now());

  useEffect(() => {
    if (!enabled) return;
    
    renderCount.current++;
    const renderTime = performance.now() - renderStart.current;
    
    // Warn if render takes more than 16ms (60fps threshold)
    if (renderTime > 16) {
      console.warn(`⚠️ [Performance] ${componentName} - Slow render: ${renderTime.toFixed(2)}ms (target: <16ms)`);
    }
    
    renderStart.current = performance.now();
  });
}

/**
 * Detect layout thrashing
 */
export function useLayoutThrashing(componentName: string, enabled: boolean = false) {
  const readCount = useRef(0);
  const writeCount = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    // Monitor for forced reflows
    const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    
    Element.prototype.getBoundingClientRect = function() {
      readCount.current++;
      if (writeCount.current > 0 && readCount.current > 0) {
        console.warn(`⚠️ [Performance] ${componentName} - Potential layout thrashing detected (read after write)`);
      }
      return originalGetBoundingClientRect.call(this);
    };

    return () => {
      Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    };
  }, [componentName, enabled]);
}
