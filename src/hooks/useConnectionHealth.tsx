import { useEffect, useRef } from 'react';
import { ConnectionHealthMonitor, detectCloudflareError } from '../utils/cloudflare-detection';
import { emitConnectionHealth } from '../components/ConnectionHealthIndicator';

/**
 * Hook to automatically monitor connection health and emit events
 * for the ConnectionHealthIndicator component.
 * 
 * This should be used at the app level to track all database operations.
 */
export function useConnectionHealth() {
  const monitorRef = useRef<ConnectionHealthMonitor>(new ConnectionHealthMonitor());
  
  useEffect(() => {
    const monitor = monitorRef.current;
    
    // Listen for successful database operations
    const handleDatabaseSuccess = () => {
      monitor.recordSuccess();
      const health = monitor.getHealth();
      
      if (health.status === 'healthy') {
        emitConnectionHealth('healthy', 'Connected');
      }
    };
    
    // Listen for database errors
    const handleDatabaseError = (event: CustomEvent) => {
      const error = event.detail.error;
      const cfError = monitor.recordError(error);
      const health = monitor.getHealth();
      
      // Only emit if it's a Cloudflare error
      if (cfError.isCloudflareError) {
        console.warn('🔴 Cloudflare error detected:', cfError.technicalMessage);
        
        if (health.status === 'unavailable') {
          emitConnectionHealth('unavailable', health.message);
        } else if (health.status === 'degraded') {
          emitConnectionHealth('degraded', health.message);
        }
      }
    };
    
    // Set up event listeners
    window.addEventListener('database-success' as any, handleDatabaseSuccess);
    window.addEventListener('database-error' as any, handleDatabaseError);
    
    // Clean up
    return () => {
      window.removeEventListener('database-success' as any, handleDatabaseSuccess);
      window.removeEventListener('database-error' as any, handleDatabaseError);
    };
  }, []);
  
  return monitorRef.current;
}

/**
 * Helper functions to emit database events from anywhere in the app
 */
export function emitDatabaseSuccess() {
  const event = new CustomEvent('database-success');
  window.dispatchEvent(event);
}

export function emitDatabaseError(error: any) {
  const event = new CustomEvent('database-error', { detail: { error } });
  window.dispatchEvent(event);
}
