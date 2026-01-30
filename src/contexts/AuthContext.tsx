import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth as useAuthHook } from '../hooks/useAuth';

interface AuthContextValue {
  user: any;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  isLoggingOut: boolean;
  showOnboarding: boolean;
  accessToken: string | null;
  session: { access_token: string; user: any } | null;
  isLoading: boolean;
  setShowOnboarding: (show: boolean) => void;
  handleAuthenticated: (userData: any, accessToken?: string | null) => void;
  handleLogout: () => Promise<void>;
  setUser: (user: any) => void;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Single source of truth for auth state - only ONE instance of useAuth
  const auth = useAuthHook();
  
  // DIAGNOSTIC: Track AuthProvider lifecycle
  const providerIdRef = React.useRef(Math.random().toString(36).substring(7));
  const renderCountRef = React.useRef(0);
  renderCountRef.current++;
  
  console.log(`🔐 AuthProvider rendering (ID: ${providerIdRef.current}, Render #${renderCountRef.current})`);
  
  React.useEffect(() => {
    console.log(`🔐 AuthProvider mounted (ID: ${providerIdRef.current})`);
    return () => {
      console.log(`🔐 AuthProvider unmounting (ID: ${providerIdRef.current})`);
    };
  }, []);
  
  // Direct pass-through - no memoization
  // Re-renders are expected when auth state changes
  // The issue is REMOUNTs, not re-renders
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
