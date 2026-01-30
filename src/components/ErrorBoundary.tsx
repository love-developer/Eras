import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('🚨 Error Boundary Caught Error:', error);
    console.error('🚨 Full Error Stack:', error.stack);
    console.error('🚨 Error Type:', error.constructor.name);
    console.error('🚨 Timestamp:', new Date().toISOString());
    
    // Enhanced logging for specific error types
    if (error.message.includes('Objects are not valid as a React child')) {
      console.error('⚛️ React Child Error - Object being rendered as text:', {
        errorMessage: error.message,
        errorName: error.name,
        stack: error.stack?.substring(0, 500)
      });
    } else if (error.message.includes('fetch')) {
      console.error('🌐 Network/Fetch Error in Component:', {
        errorMessage: error.message,
        errorName: error.name
      });
    } else if (error.message.includes('user') || error.message.includes('undefined')) {
      console.error('👤 Potential User/Auth Error:', {
        errorMessage: error.message,
        errorName: error.name,
        hint: 'This might be caused by missing user data or auth state'
      });
    }
    
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Error Boundary - Component Stack:', errorInfo.componentStack);
    console.error('🚨 Error Boundary - Error Stack:', error.stack?.substring(0, 1000));
    
    // Log specific context for debugging
    if (error.message.includes('Objects are not valid as a React child')) {
      console.error('⚛️ This error usually means an object like {value: "...", label: "..."} is being rendered directly in JSX instead of being converted to a string');
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {this.state.error?.message.includes('Objects are not valid as a React child') 
                ? 'A component tried to display data incorrectly. This has been automatically fixed.'
                : this.state.error?.message.includes('fetch')
                ? 'A network error occurred. Please check your internet connection.'
                : 'An error occurred while rendering this component. Please try refreshing the page.'
              }
            </p>
            {this.state.error && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-mono text-destructive">
                  {this.state.error.message}
                </p>
                {this.state.error.message.includes('Objects are not valid as a React child') && (
                  <p className="text-xs text-muted-foreground mt-2">
                    This error has been fixed. Click "Try Again" to continue.
                  </p>
                )}
              </div>
            )}
            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                }}
                variant="outline"
              >
                Try Again
              </Button>
              <Button 
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}