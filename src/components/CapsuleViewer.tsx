import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Gift } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { DatabaseService } from '../utils/supabase/database';
import { supabase } from '../utils/supabase/client';

interface CapsuleViewerProps {
  viewingToken: string;
}

export function CapsuleViewer({ viewingToken }: CapsuleViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    handleViewingTokenRedirect();
  }, [viewingToken]);

  const handleViewingTokenRedirect = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔗 Processing viewing token:', viewingToken);

      // IMPORTANT: Check for existing session FIRST before making API calls
      // This prevents unnecessary redirects when user is already logged in
      // Retry session check multiple times to handle slow initialization
      console.log('🔐 Checking for existing session...');
      
      // First, check localStorage to see if there's any session data at all
      const localStorageKeys = Object.keys(localStorage);
      const supabaseSessionKeys = localStorageKeys.filter(key => key.includes('supabase') || key.includes('auth'));
      console.log('🔐 Found Supabase session keys in localStorage:', supabaseSessionKeys.length > 0 ? supabaseSessionKeys : 'None');
      
      if (supabaseSessionKeys.length > 0) {
        console.log('🔐 ✅ Session data exists in localStorage - forcing session refresh...');
        // Force the Supabase client to refresh its session from localStorage
        try {
          await supabase.auth.refreshSession();
          console.log('🔐 Session refresh attempted');
        } catch (refreshError) {
          console.warn('🔐 Session refresh error (non-fatal):', refreshError);
        }
      }
      
      let session = null;
      // Try up to 7 times with increasing delays to catch session initialization
      // Total max wait time: ~4.5 seconds
      const delays = [200, 400, 600, 800, 1000, 1200, 1500];
      for (let i = 0; i < delays.length; i++) {
        console.log(`🔐 Session check attempt ${i + 1}/${delays.length}`);
        await new Promise(resolve => setTimeout(resolve, delays[i]));
        
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession?.user) {
          session = currentSession;
          console.log('🔐 ✅ Found active session on attempt', i + 1);
          console.log('🔐 User ID:', session.user.id);
          console.log('🔐 User email:', session.user.email);
          console.log('🔐 Access token exists:', !!currentSession.access_token);
          setHasSession(true);
          break;
        } else {
          console.log(`🔐 ❌ No session found on attempt ${i + 1}`);
        }
      }
      
      if (!session) {
        console.log('🔐 ❌ No session found after all attempts');
      }

      // Then verify the token is valid by calling the API
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/view/${viewingToken}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('This viewing link is invalid or has expired.');
        } else {
          setError('Failed to load time capsule.');
        }
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      console.log('✅ Valid capsule token:', data.capsule?.id);

      // Use the session we already found (or didn't find) from the retry logic above
      console.log('🔐 Final session check:', session ? '✅ Logged in' : '❌ Not logged in');

      // Now check if we have a valid session
      if (session?.user) {
        // User is authenticated - mark capsule as received and redirect to dashboard
        console.log('✅ User is authenticated, marking capsule as received...');
        
        try {
          if (data.capsule?.id) {
            await DatabaseService.markCapsuleAsReceived(data.capsule.id);
            console.log('✅ Capsule marked as received');
            
            // Store a flag to show a toast when dashboard loads
            sessionStorage.setItem('capsule_just_received', data.capsule.id);
            sessionStorage.setItem('capsule_just_received_title', data.capsule.title || 'Time Capsule');
          }
        } catch (error) {
          console.warn('Could not mark capsule as received:', error);
        }
        
        // Redirect to dashboard
        setRedirecting(true);
        console.log('🔄 Redirecting to dashboard...');
        window.location.href = '/';
      } else {
        // User is not authenticated - store token and redirect to sign-in
        console.log('🔐 User not authenticated, redirecting to sign-in...');
        sessionStorage.setItem('capsule_view_token', viewingToken);
        sessionStorage.setItem('capsule_pending_title', data.capsule?.title || 'Time Capsule');
        sessionStorage.setItem('capsule_redirect', 'received'); // Set redirect target
        sessionStorage.setItem('capsule_redirect_timestamp', Date.now().toString()); // Timestamp to prevent stale redirects
        
        // Redirect to home page which will show the Auth component
        setRedirecting(true);
        window.location.href = '/?auth=signin&redirect=capsule';
      }
    } catch (error) {
      console.error('Error processing viewing token:', error);
      setError('Failed to load time capsule. Please try again.');
      setIsLoading(false);
    }
  };

  if (isLoading || redirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground mb-2">
              {redirecting ? (hasSession ? 'Opening your Eras dashboard...' : 'Please sign in to view your capsule...') : 'Verifying your time capsule...'}
            </p>
            <p className="text-xs text-muted-foreground/70">
              {redirecting ? (hasSession ? 'You are already logged in' : 'Please wait while we redirect you') : 'This will only take a moment'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Gift className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Unable to Open Capsule</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
              <Button onClick={() => window.location.href = '/'} variant="outline">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Should never reach here since we always redirect
  return null;
}
