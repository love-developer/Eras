import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { logger } from '../utils/logger';

/**
 * 🛡️ ENHANCED ERROR BOUNDARY - PHASE 0: PRODUCTION STABILIZATION
 * 
 * Improvements over standard ErrorBoundary:
 * - Contextual error messages based on component
 * - User-friendly fallback UI
 * - Error reporting to backend (optional)
 * - Recovery actions (reload, go home, report bug)
 * - Development vs production error details
 * - Automatic error logging
 */

interface EnhancedErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  context?: string; // e.g., "Dashboard", "CapsuleCreation", "Media"
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean; // Show error stack in UI (dev mode)
}

interface EnhancedErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorCount: number;
}

export class EnhancedErrorBoundary extends Component<
  EnhancedErrorBoundaryProps,
  EnhancedErrorBoundaryState
> {
  constructor(props: EnhancedErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<EnhancedErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { context, onError } = this.props;
    
    // Log error with context
    logger.error(`Error in ${context || 'application'}:`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorCount: this.state.errorCount + 1
    });

    // Update error count
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Report to backend (optional - implement if needed)
    this.reportError(error, errorInfo);
  }

  reportError = async (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      // TODO: Implement error reporting to backend
      // Example: POST to /api/errors with error details
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     error: error.message,
      //     stack: error.stack,
      //     componentStack: errorInfo.componentStack,
      //     context: this.props.context,
      //     timestamp: new Date().toISOString(),
      //     userAgent: navigator.userAgent
      //   })
      // });
      
      logger.info('Error reported (reporting system not yet implemented)');
    } catch (reportError) {
      logger.warn('Failed to report error:', reportError);
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  getErrorMessage(): { title: string; description: string } {
    const { context } = this.props;
    const { error } = this.state;

    // Context-specific error messages
    const contextMessages: Record<string, { title: string; description: string }> = {
      Dashboard: {
        title: 'Dashboard Error',
        description: 'We encountered an issue loading your capsules. Your data is safe, but we need to reload the dashboard.'
      },
      CapsuleCreation: {
        title: 'Capsule Creation Error',
        description: 'Something went wrong while creating your capsule. Your progress may have been saved as a draft.'
      },
      Media: {
        title: 'Media Error',
        description: 'We had trouble processing your media files. Please try uploading them again.'
      },
      Vault: {
        title: 'Vault Error',
        description: 'We encountered an issue accessing your vault. Your files are safe.'
      },
      Achievements: {
        title: 'Achievements Error',
        description: 'We had trouble loading your achievements. They\'re still there, just temporarily hidden.'
      },
      Profile: {
        title: 'Profile Error',
        description: 'We encountered an issue with your profile. Please try again.'
      }
    };

    const contextMessage = context ? contextMessages[context] : null;

    if (contextMessage) {
      return contextMessage;
    }

    // Default error message
    return {
      title: 'Something Went Wrong',
      description: 'We encountered an unexpected error. Don\'t worry, your data is safe.'
    };
  }

  render() {
    const { hasError, error, errorInfo, errorCount } = this.state;
    const { children, fallback, showDetails } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      const { title, description } = this.getErrorMessage();
      const isDev = window.location.hostname === 'localhost';

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
          <Card className="max-w-lg w-full shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-red-100">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-red-600">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error count warning */}
              {errorCount > 3 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> This error has occurred {errorCount} times. 
                    Consider clearing your browser cache or contacting support.
                  </p>
                </div>
              )}

              {/* Development error details */}
              {(isDev || showDetails) && error && (
                <details className="text-xs bg-gray-50 p-3 rounded-lg border">
                  <summary className="cursor-pointer font-semibold mb-2">
                    Error Details (Development Mode)
                  </summary>
                  <div className="space-y-2">
                    <div>
                      <strong>Error:</strong>
                      <pre className="mt-1 p-2 bg-white rounded overflow-x-auto">
                        {error.message}
                      </pre>
                    </div>
                    {error.stack && (
                      <div>
                        <strong>Stack Trace:</strong>
                        <pre className="mt-1 p-2 bg-white rounded overflow-x-auto text-[10px]">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                    {errorInfo?.componentStack && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 p-2 bg-white rounded overflow-x-auto text-[10px]">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Recovery actions */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={this.handleReload}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  className="flex-1"
                  variant="outline"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {/* Try again button (resets error boundary) */}
              <Button
                onClick={this.handleReset}
                className="w-full"
                variant="ghost"
              >
                Try Again Without Reloading
              </Button>

              {/* Report bug link */}
              <div className="text-center">
                <a
                  href={`mailto:support@erastimecapsule.com?subject=Bug Report: ${encodeURIComponent(error?.message || 'Error')}&body=${encodeURIComponent(`Error Details:\n\nContext: ${this.props.context}\nError: ${error?.message}\nTimestamp: ${new Date().toISOString()}\n\nPlease describe what you were doing when this error occurred:`)}`}
                  className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
                >
                  <Bug className="w-3 h-3" />
                  Report this issue
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

/**
 * Convenience wrapper components for common sections
 */

export function DashboardErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <EnhancedErrorBoundary context="Dashboard">
      {children}
    </EnhancedErrorBoundary>
  );
}

export function CapsuleCreationErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <EnhancedErrorBoundary context="CapsuleCreation">
      {children}
    </EnhancedErrorBoundary>
  );
}

export function MediaErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <EnhancedErrorBoundary context="Media">
      {children}
    </EnhancedErrorBoundary>
  );
}

export function VaultErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <EnhancedErrorBoundary context="Vault">
      {children}
    </EnhancedErrorBoundary>
  );
}

export function AchievementsErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <EnhancedErrorBoundary context="Achievements">
      {children}
    </EnhancedErrorBoundary>
  );
}

export function ProfileErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <EnhancedErrorBoundary context="Profile">
      {children}
    </EnhancedErrorBoundary>
  );
}
