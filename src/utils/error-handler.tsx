// Error handling utilities for the Eras application

export interface AppError {
  type: 'network' | 'auth' | 'validation' | 'server' | 'unknown';
  message: string;
  originalError?: Error;
  timestamp: string;
}

export class ErrorHandler {
  static handleError(error: Error | any, context: string = 'Unknown'): AppError {
    console.error(`❌ Error in ${context}:`, error);
    
    const timestamp = new Date().toISOString();
    
    // Network/fetch errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        type: 'network',
        message: 'Network error: Please check your internet connection and try again.',
        originalError: error,
        timestamp
      };
    }
    
    // AbortError (timeout)
    if (error.name === 'AbortError') {
      return {
        type: 'network',
        message: 'Request timeout: Please check your internet connection and try again.',
        originalError: error,
        timestamp
      };
    }
    
    // Supabase auth errors
    if (error.message?.includes('Invalid Refresh Token') || 
        error.message?.includes('Refresh Token Not Found') ||
        error.message?.includes('refresh_token_not_found')) {
      return {
        type: 'auth',
        message: 'Your session has expired. Please sign in again.',
        originalError: error,
        timestamp
      };
    }
    
    if (error.message?.includes('Invalid login credentials') || 
        error.message?.includes('invalid_credentials')) {
      return {
        type: 'auth',
        message: 'Invalid email or password. Please check your credentials.',
        originalError: error,
        timestamp
      };
    }
    
    if (error.message?.includes('Email not confirmed') || 
        error.message?.includes('email_not_confirmed')) {
      return {
        type: 'auth',
        message: 'Please verify your email address first.',
        originalError: error,
        timestamp
      };
    }
    
    if (error.message?.includes('too many requests') || 
        error.message?.includes('rate_limit')) {
      return {
        type: 'auth',
        message: 'Too many attempts. Please wait a moment and try again.',
        originalError: error,
        timestamp
      };
    }
    
    // Validation errors
    if (error.message?.includes('required') || 
        error.message?.includes('validation')) {
      return {
        type: 'validation',
        message: error.message || 'Please check your input and try again.',
        originalError: error,
        timestamp
      };
    }
    
    // Server errors
    if (error.status >= 500 || error.message?.includes('server')) {
      return {
        type: 'server',
        message: 'Server error: Please try again later.',
        originalError: error,
        timestamp
      };
    }
    
    // Default unknown error
    return {
      type: 'unknown',
      message: error.message || 'Something went wrong. Please try again.',
      originalError: error,
      timestamp
    };
  }
  
  static getUserFriendlyMessage(error: Error | any, context?: string): string {
    const appError = this.handleError(error, context);
    return appError.message;
  }
  
  static isNetworkError(error: Error | any): boolean {
    return error.name === 'TypeError' && error.message.includes('fetch') ||
           error.name === 'AbortError' ||
           error.message?.includes('network') ||
           error.message?.includes('NETWORK_ERROR');
  }
  
  static isRefreshTokenError(error: Error | any): boolean {
    return error.message?.includes('Invalid Refresh Token') ||
           error.message?.includes('Refresh Token Not Found') ||
           error.message?.includes('refresh_token_not_found') ||
           error.name === 'AuthApiError' && error.message?.includes('Refresh Token');
  }
  
  static logError(error: Error | any, context: string, additionalData?: any): void {
    const appError = this.handleError(error, context);
    
    console.group(`🚨 Error Log - ${context}`);
    console.error('Type:', appError.type);
    console.error('Message:', appError.message);
    console.error('Timestamp:', appError.timestamp);
    if (additionalData) {
      console.error('Additional Data:', additionalData);
    }
    console.error('Original Error:', appError.originalError);
    console.groupEnd();
  }
}

// Network status utilities
export class NetworkManager {
  private static listeners: Set<(isOnline: boolean) => void> = new Set();
  
  static isOnline(): boolean {
    return navigator.onLine;
  }
  
  static addListener(callback: (isOnline: boolean) => void): () => void {
    this.listeners.add(callback);
    
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      this.listeners.delete(callback);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
  
  static async checkConnectivity(): Promise<boolean> {
    if (!navigator.onLine) {
      return false;
    }
    
    try {
      // Simple connectivity check
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        signal: AbortSignal.timeout(5000)
      });
      return true;
    } catch {
      return false;
    }
  }
}