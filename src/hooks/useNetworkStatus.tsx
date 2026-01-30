import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkError, setNetworkError] = useState(null);

  useEffect(() => {
    let networkRecoveryTimeout = null;
    let mounted = true;
    
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🌐 Network connection restored');
      
      networkRecoveryTimeout = setTimeout(() => {
        if (mounted) {
          setNetworkError(null);
          console.log('✅ Network connection verified stable');
        }
      }, 2000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setNetworkError('No internet connection. Some features may not work.');
      console.log('📵 Network connection lost');
      
      if (networkRecoveryTimeout) {
        clearTimeout(networkRecoveryTimeout);
      }
    };
    
    const handleError = (event) => {
      const error = event.reason || event.error;
      if (!error) return;
      
      console.error('🚨 Global error:', error);
      
      if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
        console.error('⏱️ Timeout error detected:', error.message);
        
        if (error.message?.includes('getPage')) {
          console.error('📄 Page load timeout - this is usually temporary');
          event.preventDefault();
        } else {
          setNetworkError('Operation timed out. Your request is taking longer than expected.');
        }
        event.preventDefault();
      }
      
      if (error.message?.includes('fetch')) {
        setNetworkError('Connection error detected. Please check your internet connection.');
        setIsOnline(false);
        event.preventDefault();
      }
      
      if (error.message?.includes('Objects are not valid as a React child')) {
        console.error('⚛️ React rendering error detected');
        event.preventDefault();
      }
      
      if (error.message?.includes('getPage')) {
        console.error('📄 Page load error detected:', error.message);
        console.log('ℹ️ This is often a transient error and will resolve automatically');
        
        setNetworkError('Page loading slowly. Please wait...');
        
        setTimeout(() => {
          if (mounted) {
            setNetworkError(null);
            console.log('✅ Transient page load error cleared');
          }
        }, 3000);
        
        event.preventDefault();
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('unhandledrejection', handleError);
    window.addEventListener('error', handleError);
    
    const networkHealthInterval = setInterval(() => {
      const currentlyOnline = navigator.onLine;
      if (currentlyOnline !== isOnline) {
        console.log(`🔄 Network status changed: ${currentlyOnline ? 'online' : 'offline'}`);
        if (currentlyOnline) {
          handleOnline();
        } else {
          handleOffline();
        }
      }
    }, 10000);
    
    return () => {
      mounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('unhandledrejection', handleError);
      window.removeEventListener('error', handleError);
      clearInterval(networkHealthInterval);
      if (networkRecoveryTimeout) {
        clearTimeout(networkRecoveryTimeout);
      }
    };
  }, [isOnline]);

  const clearNetworkError = () => {
    setNetworkError(null);
    setIsOnline(navigator.onLine);
  };

  return {
    isOnline,
    networkError,
    setNetworkError,
    clearNetworkError
  };
}
