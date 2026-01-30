import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface ConnectionHealthIndicatorProps {
  onRetry?: () => void;
}

export function ConnectionHealthIndicator({ onRetry }: ConnectionHealthIndicatorProps) {
  const [health, setHealth] = useState<{
    status: 'healthy' | 'degraded' | 'unavailable';
    message: string;
    show: boolean;
  }>({ status: 'healthy', message: '', show: false });

  useEffect(() => {
    // Listen for connection health events from the app
    const handleHealthChange = (event: CustomEvent) => {
      const { status, message } = event.detail;
      setHealth({
        status,
        message,
        show: status !== 'healthy'
      });

      // Auto-hide after 10 seconds if degraded (but not if unavailable)
      if (status === 'degraded') {
        setTimeout(() => {
          setHealth(prev => prev.status === 'degraded' ? { ...prev, show: false } : prev);
        }, 10000);
      }
    };

    window.addEventListener('connection-health-change' as any, handleHealthChange);
    return () => window.removeEventListener('connection-health-change' as any, handleHealthChange);
  }, []);

  if (!health.show) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-5 duration-300">
      <Alert 
        variant={health.status === 'unavailable' ? 'destructive' : 'default'}
        className="max-w-md shadow-lg border-2"
      >
        <div className="flex items-center gap-2">
          {health.status === 'healthy' && <Wifi className="h-4 w-4 text-green-500" />}
          {health.status === 'degraded' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
          {health.status === 'unavailable' && <WifiOff className="h-4 w-4" />}
          <AlertDescription className="flex-1">
            <span className="font-medium">{health.message}</span>
            {health.status === 'unavailable' && (
              <p className="text-sm mt-1 opacity-90">
                The database is experiencing connectivity issues. Your data is safe and will sync when the connection is restored.
              </p>
            )}
            {health.status === 'degraded' && (
              <p className="text-sm mt-1 opacity-90">
                Some features may respond slowly. The connection will stabilize shortly.
              </p>
            )}
          </AlertDescription>
          {onRetry && health.status === 'unavailable' && (
            <button
              onClick={onRetry}
              className="px-3 py-1 text-sm bg-white/20 hover:bg-white/30 rounded transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </Alert>
    </div>
  );
}

/**
 * Helper to emit connection health events
 */
export function emitConnectionHealth(status: 'healthy' | 'degraded' | 'unavailable', message: string) {
  const event = new CustomEvent('connection-health-change', {
    detail: { status, message }
  });
  window.dispatchEvent(event);
}
