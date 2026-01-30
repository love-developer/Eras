import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import { Clock, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, Shield, AlertCircle, Check, Settings, Mail } from 'lucide-react';
import { MomentPrismLogo } from './MomentPrismLogo';
import { EmailVerification } from './EmailVerification';
import { toast } from 'sonner';
import { supabase } from '../utils/supabase/client';
import { DatabaseService } from '../utils/supabase/database';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { logger } from '../utils/logger';

export function Auth({ onAuthenticated }) {
  const [currentView, setCurrentView] = useState('signin'); // 'signin', 'signup', 'forgot', 'reset-sent', 'reset-password', 'verify-email'
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });

  // Request deduplication tracking
  const [lastRequestTimestamps, setLastRequestTimestamps] = useState({
    signin: 0,
    signup: 0,
    forgot: 0,
    resend: 0
  });

  // Cleanup on unmount to prevent stuck loading states
  React.useEffect(() => {
    return () => {
      setIsLoading(false);
    };
  }, []);

  // Check for forgot password query parameter
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('forgot') === 'true') {
      console.log('🔐 [AUTH] Forgot password query parameter detected');
      setCurrentView('forgot');
      // Clear the query parameter
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // Check for existing session from email verification on mount
  React.useEffect(() => {
    const checkExistingSession = async () => {
      try {
        console.log('🔍 [AUTH MOUNT] ========================================');
        console.log('🔍 [AUTH MOUNT] Auth component mounted - checking for callbacks');
        console.log('🔍 [AUTH MOUNT] Current URL:', window.location.href);
        console.log('🔍 [AUTH MOUNT] URL Hash:', window.location.hash);
        console.log('🔍 [AUTH MOUNT] ========================================');
        
        // CRITICAL: Check if this is from an authentication callback (email verification OR OAuth OR password reset)
        // Check URL hash for authentication tokens
        const hash = window.location.hash;
        const oauthCallbackReady = sessionStorage.getItem('eras-oauth-callback-ready');
        const oauthExpectsGate = sessionStorage.getItem('eras-oauth-expects-gate');
        const isPasswordResetFlow = hash && hash.includes('type=recovery');
        const isEmailVerificationFlow = hash && (hash.includes('type=signup') || hash.includes('type=email'));
        // CRITICAL: Check for OAuth via hash OR callback-ready flag OR expects-gate flag
        // The expects-gate flag is set when user clicks "Sign in with Google" and ensures we detect OAuth even if Supabase consumed the hash
        const isOAuthCallback = (hash && hash.includes('access_token')) || oauthCallbackReady === 'true' || oauthExpectsGate === 'true';
        const isAuthCallback = isEmailVerificationFlow || isOAuthCallback || isPasswordResetFlow;
        
        console.log('🔍 [AUTH MOUNT] Callback detection:', {
          isPasswordResetFlow,
          isEmailVerificationFlow,
          isOAuthCallback,
          oauthCallbackReady,
          oauthExpectsGate,
          isAuthCallback
        });
        
        if (!isAuthCallback) {
          console.log('ℹ️ [AUTH MOUNT] Not an auth callback - skipping session check');
          console.log('ℹ️ [AUTH MOUNT] User should sign in manually via the form');
          return;
        }
        
        // SPECIAL HANDLING: Password Reset Flow
        if (isPasswordResetFlow && !isOAuthCallback) {
          console.log('🔐 [AUTH MOUNT] Password reset flow detected - showing reset form');
          // Show password reset form instead of auto-logging in
          setCurrentView('reset-password');
          // Clear the hash from URL to prevent re-triggering
          window.history.replaceState(null, '', window.location.pathname);
          return;
        }
        
        if (isOAuthCallback && !isEmailVerificationFlow) {
          console.log('✅ [AUTH MOUNT] OAuth callback detected - will process immediately');
          console.log('🚪 [AUTH MOUNT → ERAS GATE] OAuth redirect detected - will activate ErasGate');
          
          // CRITICAL FIX: For OAuth, Supabase has already processed the callback
          // We need to get the session SYNCHRONOUSLY to avoid race conditions
          // The session is already available, so getSession() will return it immediately
        } else if (isEmailVerificationFlow) {
          console.log('✅ [AUTH MOUNT] Email verification flow detected - checking for session');
        }
        
        // Add a small delay for OAuth to ensure Supabase has fully processed the callback
        if (isOAuthCallback && !isEmailVerificationFlow) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('🔍 [AUTH MOUNT] Session check result:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          hasError: !!error,
          errorMessage: error?.message
        });
        
        if (error) {
          console.error('❌ [AUTH MOUNT] Session check error:', error);
          
          console.log('⚠️ [AUTH MOUNT] Verification link detected but session check failed');
          console.log('🔗 [AUTH MOUNT] This might indicate a Supabase configuration issue');
          
          toast.error('Email verification link processed, but session creation failed. Please try signing in manually.', {
            duration: 8000
          });
          return;
        }
        
        if (session?.user) {
          console.log('✅ [AUTH MOUNT] Found active session from email verification! Auto-logging in user:', session.user.email);
          console.log('📊 [AUTH MOUNT] Session user metadata:', session.user.user_metadata);
          
          // Fetch or create user profile
          try {
            let profile = await DatabaseService.getUserProfile(session.user.id);
            console.log('📊 [AUTH MOUNT] Profile fetch result:', profile);
            
            // If no profile exists, create one from user_metadata
            if (!profile) {
              console.log('⚠️ [AUTH MOUNT] No profile found, creating from metadata...');
              
              const firstName = session.user.user_metadata?.first_name || 
                              session.user.user_metadata?.firstName || 
                              session.user.email?.split('@')[0] || 
                              'User';
              const lastName = session.user.user_metadata?.last_name || 
                             session.user.user_metadata?.lastName || 
                             '';
              const displayName = `${firstName} ${lastName}`.trim();
              
              try {
                await DatabaseService.updateUserProfile(session.user.id, {
                  first_name: firstName,
                  last_name: lastName,
                  display_name: displayName,
                  email: session.user.email
                });
                console.log('✅ [AUTH MOUNT] Profile created successfully with display_name:', displayName);
                
                // Fetch the newly created profile
                profile = await DatabaseService.getUserProfile(session.user.id);
              } catch (createError) {
                console.error('❌ [AUTH MOUNT] Failed to create profile:', createError);
                // Continue anyway with metadata
              }
            }
            
            const userData = {
              id: session.user.id,
              email: session.user.email,
              firstName: profile?.first_name || session.user.user_metadata?.first_name || session.user.user_metadata?.firstName || 'User',
              lastName: profile?.last_name || session.user.user_metadata?.last_name || session.user.user_metadata?.lastName || '',
              verified: true
            };
            
            // Determine if this is OAuth or email verification
            const provider = session.user.app_metadata?.provider || 'email';
            const authType = provider !== 'email' ? `OAuth (${provider})` : 'email verification';
            
            console.log(`🌙 [AUTH MOUNT → ANIMATION] Calling onAuthenticated for ${authType} with user data:`, userData);
            console.log('🌙 [AUTH MOUNT → ANIMATION] This should trigger the lunar eclipse opening animation');
            console.log('🚪 [AUTH MOUNT → ERAS GATE] Passing isFreshLogin: true to activate ErasGate');
            console.log('🚪 [AUTH MOUNT → ERAS GATE] Provider:', provider, '| Auth Type:', authType);
            
            // Clear OAuth flow markers since we're handling the callback
            try {
              const oauthExpectsGate = sessionStorage.getItem('eras-oauth-expects-gate');
              if (oauthExpectsGate) {
                console.log('🚪 [AUTH MOUNT → ERAS GATE] OAuth callback confirmed - clearing markers');
                sessionStorage.removeItem('eras-oauth-flow');
                sessionStorage.removeItem('eras-oauth-timestamp');
                sessionStorage.removeItem('eras-oauth-expects-gate');
                sessionStorage.removeItem('eras-oauth-callback-ready');
              }
            } catch (e) {
              console.warn('Could not clear OAuth markers:', e);
            }
            
            onAuthenticated(userData, session.access_token, { isFreshLogin: true });
            console.log('🌙 [AUTH MOUNT → ANIMATION] onAuthenticated called successfully');
            console.log('🚪 [AUTH MOUNT → ERAS GATE] ErasGate should now activate and show Eclipse animation');
            
            toast.success('Email verified! Welcome to Eras! 🎉', {
              duration: 4000
            });
          } catch (error) {
            console.error('❌ [AUTH MOUNT] Profile error:', error);
            
            // Fallback to user metadata even if everything fails
            const userData = {
              id: session.user.id,
              email: session.user.email,
              firstName: session.user.user_metadata?.first_name || session.user.user_metadata?.firstName || 'User',
              lastName: session.user.user_metadata?.last_name || session.user.user_metadata?.lastName || '',
              verified: true
            };
            
            // Determine if this is OAuth or email verification
            const provider = session.user.app_metadata?.provider || 'email';
            const authType = provider !== 'email' ? `OAuth (${provider})` : 'email verification';
            
            console.log(`🎉 [AUTH MOUNT] Using fallback for ${authType}, calling onAuthenticated:`, userData);
            
            // Clear OAuth flow markers since we're handling the callback (fallback path)
            try {
              const oauthExpectsGate = sessionStorage.getItem('eras-oauth-expects-gate');
              if (oauthExpectsGate) {
                console.log('🚪 [AUTH MOUNT → ERAS GATE] OAuth callback confirmed (fallback) - clearing markers');
                sessionStorage.removeItem('eras-oauth-flow');
                sessionStorage.removeItem('eras-oauth-timestamp');
                sessionStorage.removeItem('eras-oauth-expects-gate');
                sessionStorage.removeItem('eras-oauth-callback-ready');
              }
            } catch (e) {
              console.warn('Could not clear OAuth markers:', e);
            }
            
            onAuthenticated(userData, session.access_token, { isFreshLogin: true });
            
            toast.success('Email verified! Welcome to Eras! 🎉', {
              duration: 4000
            });
          }
        } else {
          console.log('ℹ️ [AUTH MOUNT] No active session found, user needs to sign in');
          
          // Check if URL has verification tokens (user just clicked email link but no session)
          const hash = window.location.hash;
          if (hash && (hash.includes('type=signup') || hash.includes('type=email'))) {
            console.warn('⚠️ [AUTH MOUNT] Verification link in URL but no session created!');
            console.warn('⚠️ [AUTH MOUNT] This indicates Supabase Site URL might not be configured correctly');
            
            // Show helpful message
            toast.info('Email verification link detected. Please sign in with your credentials.', {
              duration: 6000
            });
            
            // Pre-fill email if available in the URL hash
            try {
              const params = new URLSearchParams(hash.substring(1));
              const email = params.get('email');
              if (email) {
                console.log('📧 [AUTH MOUNT] Pre-filling email from URL:', email);
                setFormData(prev => ({
                  ...prev,
                  email: email
                }));
              }
            } catch (e) {
              console.warn('Could not extract email from URL:', e);
            }
          }
        }
      } catch (error) {
        console.error('❌ [AUTH MOUNT] Error checking session:', error);
        
        // Still check for verification link in URL
        const hash = window.location.hash;
        if (hash && (hash.includes('type=signup') || hash.includes('type=email'))) {
          toast.info('Email verification detected. Please sign in with your credentials.', {
            duration: 6000
          });
        }
      }
    };
    
    checkExistingSession();
  }, [onAuthenticated]);

  // Load saved email from localStorage on mount (Remember Me)
  React.useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('eras-remember-email');
      if (savedEmail) {
        console.log('📧 Found saved email from Remember Me');
        setFormData(prev => ({
          ...prev,
          email: savedEmail
        }));
        setRememberMe(true);
      }
    } catch (storageError) {
      console.warn('Could not load saved email:', storageError);
    }
  }, []);

  // iPhone debugging state
  const [debugInfo, setDebugInfo] = useState({
    attempts: 0,
    lastError: null,
    lastStep: null,
    userAgent: navigator.userAgent,
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
    timestamp: null
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Duplicate request prevention helper
  const canMakeRequest = (requestType, minIntervalMs = 2000) => {
    const now = Date.now();
    const lastRequest = lastRequestTimestamps[requestType] || 0;
    const timeSinceLastRequest = now - lastRequest;
    
    if (timeSinceLastRequest < minIntervalMs) {
      const remainingWait = Math.ceil((minIntervalMs - timeSinceLastRequest) / 1000);
      console.log(`🛡️ [DUPLICATE PREVENTION] ${requestType} request blocked - ${remainingWait}s remaining`);
      toast.info(`Please wait ${remainingWait} second${remainingWait > 1 ? 's' : ''} before trying again`, {
        description: 'This prevents accidental duplicate submissions',
        duration: 3000
      });
      return false;
    }
    
    // Update timestamp
    setLastRequestTimestamps(prev => ({
      ...prev,
      [requestType]: now
    }));
    
    return true;
  };

  const validatePassword = (password) => {
  const requirements = {
    minLength: password.length >= 8,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*]/.test(password)
  };
  
  return {
    isValid: Object.values(requirements).every(Boolean),
    requirements
  };
};

  const handleVerificationCodeChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.querySelector(`input[name="code-${index + 1}"]`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const code = verificationCode.join('');
    if (code.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: code,
        type: 'signup'
      });

      if (error) {
        console.error('Email verification error:', error);
        
        // Handle specific error cases
        if (error.message.includes('expired') || error.message.includes('invalid')) {
          toast.error('Verification code has expired. Please request a new code.', {
            action: {
              label: 'Resend Code',
              onClick: () => resendVerificationCode(),
            },
          });
          // Clear the code inputs
          setVerificationCode(['', '', '', '', '', '']);
        } else if (error.message.includes('already confirmed')) {
          toast.error('This email is already verified. Please sign in instead.');
          setCurrentView('signin');
        } else {
          toast.error(error.message || 'Invalid verification code');
        }
        
        setIsLoading(false);
        return;
      }

      console.log('✅ Email verified, session data:', {
        hasUser: !!data.user,
        hasSession: !!data.session,
        sessionToken: data.session?.access_token?.substring(0, 20)
      });

      if (data.user && data.session) {
        // Wait for Supabase to persist the session to localStorage
        console.log('⏳ Waiting for session to persist...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify the session is persisted
        const { data: { session: persistedSession } } = await supabase.auth.getSession();
        console.log('✅ Session persisted:', !!persistedSession);
        
        // Create profile after successful verification
        try {
          const displayName = `${formData.firstName} ${formData.lastName}`.trim();
          await DatabaseService.updateUserProfile(data.user.id, {
            first_name: formData.firstName,
            last_name: formData.lastName,
            display_name: displayName,
            email: data.user.email
          });
        } catch (profileError) {
          console.error('Profile creation error:', profileError);
        }

        // Check for capsule redirect before calling onAuthenticated
        const capsuleRedirect = sessionStorage.getItem('capsule_redirect');
        const viewToken = sessionStorage.getItem('capsule_view_token');
        const capsulePendingTitle = sessionStorage.getItem('capsule_pending_title');

        console.log('🌙 [EMAIL VERIFICATION → ANIMATION] Calling onAuthenticated after email verification');
        console.log('🌙 [EMAIL VERIFICATION → ANIMATION] NEW USER should see lunar eclipse animation');
        onAuthenticated({
          id: data.user.id,
          email: data.user.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          verified: true
        }, data.session.access_token, { isFreshLogin: true }); // Pass the access token
        console.log('🌙 [EMAIL VERIFICATION → ANIMATION] onAuthenticated called');
        
        // Handle capsule redirect after successful auth
        if (capsuleRedirect && viewToken) {
          console.log('📬 Processing capsule after email verification');
          
          // Mark the capsule as received and go straight to dashboard
          try {
            // Fetch the capsule data to get the ID
            const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/view/${viewToken}`, {
              headers: {
                'Authorization': `Bearer ${data.session.access_token}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (response.ok) {
              const capsuleData = await response.json();
              if (capsuleData.capsule?.id) {
                // Mark as received
                await DatabaseService.markCapsuleAsReceived(capsuleData.capsule.id);
                
                // Store flags for dashboard to show toast
                sessionStorage.setItem('capsule_just_received', capsuleData.capsule.id);
                sessionStorage.setItem('capsule_just_received_title', capsuleData.capsule.title || capsulePendingTitle || 'Time Capsule');
                
                console.log('✅ Capsule marked as received, redirecting to dashboard');
              }
            }
          } catch (error) {
            console.warn('Could not mark capsule as received:', error);
          }
          
          // Clean up session storage
          sessionStorage.removeItem('capsule_redirect');
          sessionStorage.removeItem('capsule_view_token');
          sessionStorage.removeItem('capsule_pending_title');
          sessionStorage.removeItem('capsule_redirect_timestamp');
          
          toast.success('Email verified successfully! Opening your capsule... 🎉');
          
          // Redirect to dashboard after a brief delay
          setTimeout(() => {
            window.location.href = '/';
          }, 500);
          
          return; // Exit early
        }
        
        toast.success('Email verified successfully! Welcome to Eras! 🎉');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      
      // Handle network errors specifically
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error('Network error: Please check your internet connection and try again.');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationCode = async () => {
    // Check for duplicate requests (prevent rapid resubmissions)
    if (!canMakeRequest('resend', 3000)) {
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email
      });

      if (error) {
        console.error('Resend verification error:', error);
        
        // Handle specific resend errors
        if (error.message.toLowerCase().includes('email rate limit') || error.message.includes('once every 60 seconds')) {
          toast.error('⏱️ Email Rate Limit Exceeded', {
            description: 'For security, we can only send one verification email every 60 seconds. Please wait a moment and try again.',
            duration: 12000,
            action: {
              label: 'Why?',
              onClick: () => {
                toast.info('Security Feature', {
                  description: 'Rate limits prevent spam and protect your account. Check your spam folder while you wait!',
                  duration: 8000
                });
              }
            }
          });
        } else if (error.message.includes('rate_limit') || error.message.includes('too many')) {
          toast.error('Too many resend attempts. Please wait a moment and try again.', {
            duration: 6000
          });
        } else {
          toast.error(error.message || 'Failed to resend verification code');
        }
      } else {
        toast.success('Verification code resent!');
        setVerificationCode(['', '', '', '', '', '']);
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      
      // Handle network errors specifically
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error('Network error: Please check your internet connection and try again.');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    
    // Detect iPhone/iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Prevent multiple submissions
    if (isLoading) {
      console.log('🔄 Sign-in already in progress, preventing duplicate');
      return;
    }
    
    // Check for duplicate requests (prevent rapid resubmissions)
    if (!canMakeRequest('signin', 2000)) {
      return;
    }
    
    console.log('🔐 Starting sign-in process...', { isIOS, email: formData.email });
    setIsLoading(true);

    // Safety timeout to ensure loading state never gets stuck
    const loadingTimeout = setTimeout(() => {
      console.warn('⏰ Sign-in timeout - forcing loading state reset');
      setIsLoading((currentLoading) => {
        // Only show error if we're actually still loading
        if (currentLoading) {
          toast.error('Sign-in timed out. Please try again.');
          return false;
        }
        return currentLoading;
      });
    }, 30000); // 30 second timeout (increased from 15s for slower connections)

    // Brief delay to prevent rapid-fire taps on mobile
    if (isIOS) {
      console.log('📱 iOS device detected, adding brief delay');
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Enhanced validation
    if (!formData.email?.trim() || !formData.password) {
      toast.error('Please fill in all fields', {
        description: 'Both email and password are required'
      });
      clearTimeout(loadingTimeout);
      setIsLoading(false);
      return;
    }

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Invalid email format', {
        description: 'Please enter a valid email address'
      });
      clearTimeout(loadingTimeout);
      setIsLoading(false);
      return;
    }

    logger.auth('Attempting sign-in');

    try {
      // Update debug info
      setDebugInfo(prev => ({
        ...prev,
        attempts: prev.attempts + 1,
        timestamp: new Date().toISOString(),
        lastError: null,
        lastStep: 'attempting-sign-in'
      }));

      // Configure auth options with Remember Me support
      const authOptions = {
        email,
        password,
        options: {
          // Store Remember Me preference in user metadata for reference
          data: {
            remember_me: rememberMe
          }
        }
      };

      if (isIOS) {
        console.log('📱 Using iOS-optimized sign-in flow');
      }
      
      console.log('💾 Remember Me enabled:', rememberMe);

      const { data, error } = await supabase.auth.signInWithPassword(authOptions);

      console.log('🔍 Sign-in response:', { 
        hasData: !!data, 
        hasUser: !!data?.user, 
        hasSession: !!data?.session, 
        hasError: !!error,
        errorMessage: error?.message 
      });

      if (error) {
        console.error('❌ Sign in error:', error.message);
        console.error('🔍 Full error details:', JSON.stringify(error, null, 2));
        console.error('🔍 Error type:', error.name);
        console.error('🔍 Error status:', error.status);
        
        // Update debug info with error
        setDebugInfo(prev => ({
          ...prev,
          lastError: error.message,
          timestamp: new Date().toISOString(),
          lastStep: 'sign-in-error'
        }));
        
        // Handle specific sign-in errors with better messaging
        if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
          // ENHANCED: Check if this email exists in the system to give more specific feedback
          try {
            const checkResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/auth/check-user-exists`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicAnonKey}`
              },
              body: JSON.stringify({ 
                email: formData.email.trim().toLowerCase() 
              })
            });
            
            console.log('📦 📦 📦 FETCH COMPLETED! Response status:', checkResponse.status);
            
            if (checkResponse.ok) {
              const { exists } = await checkResponse.json();
              console.log('✅ ✅ ✅ User exists check result:', exists);
              
              if (exists) {
                // Email exists, so password is wrong
                console.log('🔴 🔴 🔴 SHOWING WRONG PASSWORD TOAST NOW!');
                toast.error('❌ Incorrect Password', {
                  description: 'The password you entered is incorrect. Please try again or reset your password.',
                  duration: 10000,
                  action: {
                    label: 'Forgot Password?',
                    onClick: () => setCurrentView('forgot')
                  }
                });
              } else {
                // Email doesn't exist
                console.log('🔵 🔵 🔵 SHOWING ACCOUNT NOT FOUND TOAST NOW!');
                toast.error('❌ Account Not Found', {
                  description: 'No account exists with this email address. Please check your email or create a new account.',
                  duration: 10000,
                  action: {
                    label: 'Sign Up',
                    onClick: () => setCurrentView('signup')
                  }
                });
              }
            } else {
              // Fallback to generic message if check endpoint fails
              throw new Error('Check endpoint unavailable');
            }
          } catch (checkError) {
            // Fallback to generic but helpful message
            console.error('🟡 🟡 🟡 FETCH FAILED! Error:', checkError);
            console.warn('⚠️ Unable to check user existence, showing generic helpful error');
            console.log('🟡 🟡 🟡 SHOWING FALLBACK TOAST NOW!');
            toast.error('❌ Sign-In Failed', {
              description: 'The email or password you entered is incorrect. Please double-check both fields.',
              duration: 10000,
              action: {
                label: 'Forgot Password?',
                onClick: () => setCurrentView('forgot')
              }
            });
          }
          
          // CRITICAL: Clear loading state AFTER async check completes
          clearTimeout(loadingTimeout);
          setIsLoading(false);
          return;
          
        } else if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
          console.warn('⚠️ Email not confirmed - user needs to verify their email first');
          
          // Switch to the email verification view
          setCurrentView('verify-email');
          
          toast.error('⚠️ Email Not Verified', {
            description: 'You must verify your email before signing in. Check your inbox for the verification link.',
            duration: 10000,
            action: {
              label: 'Resend Email',
              onClick: async () => {
                try {
                  const { error: resendError } = await supabase.auth.resend({
                    type: 'signup',
                    email: formData.email.trim().toLowerCase()
                  });
                  
                  if (resendError) {
                    if (resendError.message.includes('already confirmed')) {
                      toast.error('Your email is already verified. Please try signing in again.');
                    } else if (resendError.message.toLowerCase().includes('email rate limit') || resendError.message.includes('once every 60 seconds')) {
                      toast.error('Email rate limit exceeded', {
                        description: 'Please wait 60 seconds before requesting another verification email.',
                        duration: 10000
                      });
                    } else if (resendError.message.includes('rate_limit') || resendError.message.includes('rate limit') || resendError.message.includes('too many')) {
                      toast.error('Too many attempts. Please wait a moment and try again.', {
                        duration: 6000
                      });
                    } else {
                      toast.error('Failed to resend: ' + resendError.message);
                    }
                  } else {
                    toast.success('✅ Verification email resent!', {
                      description: 'Check your inbox and spam folder.',
                      duration: 5000
                    });
                  }
                } catch (e) {
                  console.error('Resend error:', e);
                  toast.error('Failed to resend email. Please try again.');
                }
              }
            }
          });
          
          clearTimeout(loadingTimeout);
          setIsLoading(false);
          return;
          
        } else if (error.message.includes('too many requests') || error.message.includes('rate_limit')) {
          toast.error('Too many sign-in attempts. Please wait a moment and try again.');
          clearTimeout(loadingTimeout);
          setIsLoading(false);
          return;
          
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          toast.error('Network error. Please check your connection and try again.');
          clearTimeout(loadingTimeout);
          setIsLoading(false);
          return;
          
        } else {
          toast.error(`Sign-in failed: ${error.message}`);
          clearTimeout(loadingTimeout);
          setIsLoading(false);
          return;
        }
      }

      if (data?.user) {
        console.log('✅ Sign-in successful for user:', data.user.email);
        
        // Handle Remember Me functionality - Extended Session Persistence
        if (rememberMe) {
          console.log('💾 Remember Me enabled - configuring extended session (30 days)');
          try {
            // Save email for convenience
            localStorage.setItem('eras-remember-email', formData.email.trim().toLowerCase());
            
            // Set a flag indicating long-term session is desired
            localStorage.setItem('eras-remember-me', 'true');
            
            // Store session timestamp for reference
            localStorage.setItem('eras-session-created', new Date().toISOString());
            
            console.log('✅ Extended session configured - you will stay signed in for 30 days');
            
            // Show user-friendly message
            toast.success('Session saved! You\'ll stay signed in for 30 days.', {
              duration: 3000,
              description: 'Your email has been saved for convenience.'
            });
          } catch (storageError) {
            console.warn('Could not save Remember Me preferences:', storageError);
          }
        } else {
          // Clear saved email and remember me flag if unchecked
          try {
            localStorage.removeItem('eras-remember-email');
            localStorage.removeItem('eras-remember-me');
            console.log('🔒 Standard session configured - you will be signed out when you close the browser');
          } catch (storageError) {
            console.warn('Could not clear Remember Me preferences:', storageError);
          }
        }
        
        // Handle profile fetch with better error handling
        let userData = null;
        
        try {
          console.log('👤 Fetching user profile...');
          const profile = await DatabaseService.getUserProfile(data.user.id);
          
          if (profile) {
            console.log('✅ Profile found:', profile);
            userData = {
              id: profile.id,
              email: profile.email || data.user.email,
              firstName: profile.first_name || 'User',
              lastName: profile.last_name || '',
              provider: data.user.app_metadata?.provider
            };
          } else {
            console.log('⚠️ No profile found, using user metadata');
            const firstName = data.user.user_metadata?.first_name || 
                            data.user.user_metadata?.firstName || 
                            data.user.email?.split('@')[0] || 'User';
            const lastName = data.user.user_metadata?.last_name || 
                           data.user.user_metadata?.lastName || '';
            
            userData = {
              id: data.user.id,
              email: data.user.email,
              firstName,
              lastName,
              provider: data.user.app_metadata?.provider
            };
          }
        } catch (profileError) {
          console.error('⚠️ Profile fetch failed, using fallback:', profileError);
          
          // Fallback to user metadata
          const firstName = data.user.user_metadata?.first_name || 
                          data.user.user_metadata?.firstName || 
                          data.user.email?.split('@')[0] || 'User';
          const lastName = data.user.user_metadata?.last_name || 
                         data.user.user_metadata?.lastName || '';
          
          userData = {
            id: data.user.id,
            email: data.user.email,
            firstName,
            lastName,
            provider: data.user.app_metadata?.provider
          };
        }

        console.log('🎉 Calling onAuthenticated with:', userData);
        
        // Update debug info
        setDebugInfo(prev => ({
          ...prev,
          lastStep: 'calling-callback',
          timestamp: new Date().toISOString()
        }));
        
        // Check for capsule redirect before calling onAuthenticated
        const capsuleRedirect = sessionStorage.getItem('capsule_redirect');
        const viewToken = sessionStorage.getItem('capsule_view_token');
        const capsulePendingTitle = sessionStorage.getItem('capsule_pending_title');
        
        // Call the authentication callback
        try {
          // IMPORTANT: Keep loading state active to prevent flash
          console.log('🎬 Calling onAuthenticated, keeping loading screen visible');
          console.log('📊 User data being passed:', JSON.stringify(userData, null, 2));
          console.log('🔑 Access token exists:', !!data.session.access_token);
          
          // IMPORTANT: Pass the access token so pending capsules can be claimed
          console.log('🌙 [SIGN-IN → ANIMATION] Calling onAuthenticated after successful sign-in');
          console.log('🌙 [SIGN-IN → ANIMATION] User should see lunar eclipse animation');
          onAuthenticated(userData, data.session.access_token, { isFreshLogin: true });
          console.log('✅ onAuthenticated callback completed successfully');
          console.log('🌙 [SIGN-IN → ANIMATION] Check console for "LUNAR ECLIPSE ANIMATION WILL SHOW" message');
          console.log('⏳ Waiting for auth state to update UI...');
          
          // Handle capsule redirect after successful auth
          if (capsuleRedirect && viewToken) {
            console.log('📬 Processing capsule after authentication');
            
            // Mark the capsule as received and go straight to dashboard
            try {
              // Fetch the capsule data to get the ID
              const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/view/${viewToken}`, {
                headers: {
                  'Authorization': `Bearer ${data.session.access_token}`,
                  'Content-Type': 'application/json',
                },
              });
              
              if (response.ok) {
                const capsuleData = await response.json();
                if (capsuleData.capsule?.id) {
                  // Mark as received
                  await DatabaseService.markCapsuleAsReceived(capsuleData.capsule.id);
                  
                  // Store flags for dashboard to show toast
                  sessionStorage.setItem('capsule_just_received', capsuleData.capsule.id);
                  sessionStorage.setItem('capsule_just_received_title', capsuleData.capsule.title || capsulePendingTitle || 'Time Capsule');
                  
                  console.log('✅ Capsule marked as received, redirecting to dashboard');
                }
              }
            } catch (error) {
              console.warn('Could not mark capsule as received:', error);
            }
            
            // Clean up session storage
            sessionStorage.removeItem('capsule_redirect');
            sessionStorage.removeItem('capsule_view_token');
            sessionStorage.removeItem('capsule_pending_title');
            sessionStorage.removeItem('capsule_redirect_timestamp');
            
            // Redirect to dashboard after a brief delay
            setTimeout(() => {
              window.location.href = '/';
            }, 500);
            
            return; // Exit early to avoid duplicate toast
          }
          
          // Update debug info
          setDebugInfo(prev => ({
            ...prev,
            lastStep: 'callback-success',
            timestamp: new Date().toISOString()
          }));
        } catch (callbackError) {
          console.error('❌ onAuthenticated callback failed:', callbackError);
          setDebugInfo(prev => ({
            ...prev,
            lastStep: 'callback-error',
            lastError: callbackError.message,
            timestamp: new Date().toISOString()
          }));
          toast.error('Authentication callback failed. Please try again.');
          clearTimeout(loadingTimeout);
          setIsLoading(false);
          return;
        }
        
        // Show success message with Remember Me info
        if (rememberMe) {
          toast.success('Welcome back! You\'ll stay signed in for 30 days. 🎉');
        } else {
          toast.success('Welcome back to Eras! 🎉');
        }
        
        // Clear timeout (loading state handled by auth animation)
        clearTimeout(loadingTimeout);
        
      } else {
        console.error('❌ Sign-in succeeded but no user data returned');
        toast.error('Authentication failed - no user data received');
        clearTimeout(loadingTimeout);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ Authentication exception:', error);
      
      // Handle network errors specifically
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error('Network error: Please check your internet connection and try again.');
        clearTimeout(loadingTimeout);
        setIsLoading(false);
        setDebugInfo(prev => ({
          ...prev,
          lastError: 'Network fetch error',
          lastStep: 'network-error',
          timestamp: new Date().toISOString()
        }));
      } else {
        toast.error('Something went wrong. Please try again.');
        setDebugInfo(prev => ({
          ...prev,
          lastError: error.message,
          lastStep: 'unknown-error',
          timestamp: new Date().toISOString()
        }));
        clearTimeout(loadingTimeout);
        setIsLoading(false);
      }
    } finally {
      // NOTE: Loading state cleanup is now handled in each individual error/success branch
      // This ensures async operations (like user existence checks) complete before cleanup
      console.log('🔄 Sign-in attempt completed (cleanup handled by individual branches)');
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isLoading) {
      console.log('🔄 Sign-up already in progress, preventing duplicate');
      toast.info('Please wait, your account is being created...');
      return;
    }
    
    // Check for duplicate requests (prevent rapid resubmissions)
    if (!canMakeRequest('signup', 3000)) {
      return;
    }
    
    console.log('📝 Starting sign-up process...');
    setIsLoading(true);

    // Safety timeout to ensure loading state never gets stuck
    const loadingTimeout = setTimeout(() => {
      console.warn('⏰ Sign-up timeout - forcing loading state reset');
      toast.dismiss('signup-progress');
      setIsLoading((currentLoading) => {
        // Only show error if we're actually still loading
        if (currentLoading) {
          toast.error('Sign-up is taking longer than expected. Please check your connection and try again.', {
            duration: 6000
          });
          return false;
        }
        return currentLoading;
      });
    }, 40000); // 40 second timeout for sign-up (increased from 20s for slower connections)

    try {
      // Validation
      if (!formData.email || !formData.password || !formData.firstName) {
        toast.error('Please fill in all required fields');
        clearTimeout(loadingTimeout);
        setIsLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        clearTimeout(loadingTimeout);
        setIsLoading(false);
        return;
      }

      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        toast.error('Password does not meet security requirements');
        clearTimeout(loadingTimeout);
        setIsLoading(false);
        return;
      }

      console.log('📧 Creating account for:', formData.email);
      
      // Show progress feedback for users
      toast.loading('Creating your account...', {
        id: 'signup-progress',
        duration: 15000
      });

      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName.trim(),
            last_name: formData.lastName?.trim() || '',
            agreed_to_terms: true,
            terms_agreed_at: new Date().toISOString()
          },
          // IMPORTANT: Disable Supabase's built-in confirmation email
          // We'll send our own custom verification email via our backend
          emailRedirectTo: undefined
        }
      });

      // Dismiss loading toast
      toast.dismiss('signup-progress');

      if (error) {
        console.error('❌ Sign up error:', error);
        
        // Handle specific signup errors
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          toast.error('An account with this email already exists. Please sign in instead.', {
            action: {
              label: 'Sign In',
              onClick: () => setCurrentView('signin')
            }
          });
        } else if (error.message.includes('invalid email') || error.message.includes('Invalid email')) {
          toast.error('Please enter a valid email address.');
        } else if (error.message.includes('weak password') || error.message.includes('Password') || error.message.includes('AuthWeakPasswordError')) {
          toast.error('Password is too weak or commonly used', {
            description: 'Please choose a unique password with 8+ characters, letters, numbers, and special characters (!@#$)',
            duration: 8000
          });
        } else if (error.message.toLowerCase().includes('email rate limit') || error.message.includes('once every 60 seconds')) {
          toast.error('⏱️ Email Rate Limit Exceeded', {
            description: 'For security, we can only send one verification email every 60 seconds. This prevents spam and protects your account. Please wait a moment and try again.',
            duration: 12000,
            action: {
              label: 'Why?',
              onClick: () => {
                toast.info('Security Feature', {
                  description: 'Rate limits prevent automated bots from spamming accounts and help keep Eras secure for everyone. Thank you for your patience!',
                  duration: 8000
                });
              }
            }
          });
        } else if (error.message.includes('rate_limit') || error.message.includes('too many')) {
          toast.error('Too many sign-up attempts. Please wait a moment and try again.', {
            duration: 6000
          });
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          toast.error('Network error. Please check your connection and try again.', {
            duration: 6000
          });
        } else {
          toast.error(error.message || 'Failed to create account. Please try again.', {
            duration: 6000
          });
        }
        
        clearTimeout(loadingTimeout);
        setIsLoading(false);
        return;
      }

      if (data.user) {
        console.log('✅ Account created successfully for:', data.user.email);
        
        // Mark account creation time for welcome notification
        try {
          localStorage.setItem(`eras_account_created_${data.user.id}`, Date.now().toString());
          console.log('📝 Account creation marker set for welcome notification');
        } catch (e) {
          console.warn('Could not set account creation marker:', e);
        }
        
        // Check if email confirmation is required
        if (!data.session) {
          console.log('📨 Email verification required - sending custom verification email via backend...');
          
          try {
            const verificationResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/auth/send-verification-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicAnonKey}`
              },
              body: JSON.stringify({
                email: data.user.email,
                firstName: formData.firstName.trim(),
                userId: data.user.id
              })
            });

            const verificationResult = await verificationResponse.json();
            
            if (verificationResult.success) {
              console.log('✅ Verification email sent successfully');
              toast.success('Account created! Please check your email for verification link.', {
                duration: 8000,
                description: 'Check your inbox and spam folder for "Welcome to Eras!"'
              });
            } else {
              console.error('❌ Failed to send verification email:', verificationResult.error);
              toast.warning('Account created, but verification email may be delayed.', {
                duration: 8000,
                description: 'If you don\'t receive it, contact support.'
              });
            }
          } catch (emailError) {
            console.error('❌ Exception sending verification email:', emailError);
            toast.warning('Account created, but verification email may be delayed.', {
              duration: 8000
            });
          }
          
          clearTimeout(loadingTimeout);
          setIsLoading(false);
          setCurrentView('verify-email');
        } else {
          console.log('✅ Auto-signed in, creating profile...');
          
          // Auto-signed in, create profile
          try {
            const displayName = `${formData.firstName.trim()} ${formData.lastName?.trim() || ''}`.trim();
            await DatabaseService.updateUserProfile(data.user.id, {
              first_name: formData.firstName.trim(),
              last_name: formData.lastName?.trim() || '',
              display_name: displayName,
              email: data.user.email
            });
            console.log('✅ Profile created successfully with display_name:', displayName);
            
            // Initialize user with Time Novice title as a freebie
            try {
              const initResponse = await fetch(
                `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/titles/initialize`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${data.session.access_token}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
              
              if (initResponse.ok) {
                console.log('✅ Time Novice title initialized for new user');
              } else {
                console.warn('⚠️ Failed to initialize Time Novice title, but continuing');
              }
            } catch (titleError) {
              console.error('⚠️ Title initialization error:', titleError);
              // Non-critical error - continue with authentication
            }
          } catch (profileError) {
            console.error('⚠️ Profile creation error:', profileError);
            // Non-critical error - continue with authentication
          }

          clearTimeout(loadingTimeout);
          setIsLoading(false);
          
          // Check for capsule redirect before calling onAuthenticated
          const capsuleRedirect = sessionStorage.getItem('capsule_redirect');
          const viewToken = sessionStorage.getItem('capsule_view_token');
          
          // IMPORTANT: Pass the access token so pending capsules can be claimed
          console.log('🌙 [SIGN-UP → ANIMATION] Calling onAuthenticated after successful sign-up');
          console.log('🌙 [SIGN-UP → ANIMATION] NEW USER should see lunar eclipse animation');
          onAuthenticated({
            id: data.user.id,
            email: data.user.email,
            firstName: formData.firstName.trim(),
            lastName: formData.lastName?.trim() || ''
          }, data.session.access_token, { isFreshLogin: true });
          console.log('🌙 [SIGN-UP → ANIMATION] onAuthenticated called');
          
          // Handle capsule redirect after successful auth
          // Only redirect if we're NOT already on a view route
          if (capsuleRedirect && viewToken && !window.location.pathname.startsWith('/view/')) {
            console.log('📬 Redirecting to received capsule after sign-up');
            sessionStorage.removeItem('capsule_redirect');
            sessionStorage.removeItem('capsule_view_token');
            sessionStorage.removeItem('capsule_redirect_timestamp');
            
            // Add a small delay to ensure auth is fully set up
            setTimeout(() => {
              window.location.href = `/view/${viewToken}`;
            }, 500);
          } else if (window.location.pathname.startsWith('/view/')) {
            // Clear stale tokens if already on view route
            sessionStorage.removeItem('capsule_redirect');
            sessionStorage.removeItem('capsule_view_token');
            sessionStorage.removeItem('capsule_redirect_timestamp');
          }
          
          toast.success('Welcome to Eras! 🎉', {
            duration: 5000,
            description: 'Your account has been created successfully'
          });
        }
      } else {
        console.error('❌ Sign-up succeeded but no user data returned');
        toast.error('Account creation failed - no user data received. Please try again.');
        clearTimeout(loadingTimeout);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ Sign up exception:', error);
      
      // Dismiss any loading toasts
      toast.dismiss('signup-progress');
      
      // Handle network errors specifically
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error('Network error: Please check your internet connection and try again.', {
          duration: 6000,
          description: 'Make sure you have a stable internet connection'
        });
      } else if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
        toast.error('Request timed out. Please check your connection and try again.', {
          duration: 6000
        });
      } else {
        toast.error('Something went wrong. Please try again.', {
          duration: 6000,
          description: error.message || 'Unknown error occurred'
        });
      }
      
      clearTimeout(loadingTimeout);
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast.error('Please enter your email address');
      return;
    }

    // Check for duplicate requests (prevent rapid resubmissions)
    if (!canMakeRequest('forgot', 3000)) {
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 Sending password reset request via custom server endpoint...');
      
      // Call our custom server endpoint that uses Resend for fast delivery
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/auth/request-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ 
          email: formData.email.trim().toLowerCase() 
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Password reset error:', result);
        
        // Handle specific password reset errors
        if (result.type === 'rate_limit' || response.status === 429) {
          toast.error('⏱️ Email Rate Limit Exceeded', {
            description: 'For security, we can only send one password reset email every 60 seconds. Please wait a moment and try again.',
            duration: 12000,
            action: {
              label: 'Why?',
              onClick: () => {
                toast.info('Security Feature', {
                  description: 'Rate limits protect your account from automated attacks and ensure email delivery reliability.',
                  duration: 8000
                });
              }
            }
          });
        } else {
          toast.error(result.error || 'Failed to send reset email');
        }
      } else {
        console.log('✅ Password reset email sent successfully via Resend');
        setCurrentView('reset-sent');
        toast.success('Password reset email sent! 📧', {
          description: 'Check your inbox for the reset link. It should arrive within seconds.',
          duration: 6000
        });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      
      // Handle network errors specifically
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error('Network error: Please check your internet connection and try again.');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!formData.password) {
      toast.error('Please enter a new password');
      return;
    }
    
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 Updating password...');
      
      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (error) {
        console.error('❌ Password reset error:', error);
        
        if (error.message.includes('same as the old password')) {
          toast.error('New password must be different from your old password');
        } else if (error.message.includes('Auth session missing') || error.message.includes('not authenticated')) {
          toast.error('Session expired. Please request a new password reset link.', {
            duration: 8000,
            action: {
              label: 'Request New Link',
              onClick: () => setCurrentView('forgot')
            }
          });
        } else {
          toast.error(error.message || 'Failed to reset password');
        }
        return;
      }

      console.log('✅ Password reset successful');
      
      // Clear form
      setFormData({
        ...formData,
        password: '',
        confirmPassword: ''
      });
      
      toast.success('🎉 Password Reset Successful!', {
        description: 'You can now sign in with your new password.',
        duration: 6000
      });
      
      // Redirect to sign-in after 2 seconds
      setTimeout(() => {
        setCurrentView('signin');
      }, 2000);
      
    } catch (error) {
      console.error('💥 Password reset exception:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      console.log('🔐 Attempting Google OAuth sign-in...');
      console.log('🚪 [OAUTH START] Marking OAuth flow start - ErasGate should activate on callback');
      
      // Mark that we're starting an OAuth flow to prevent App.tsx from resetting
      try {
        sessionStorage.setItem('eras-oauth-flow', 'google');
        sessionStorage.setItem('eras-oauth-timestamp', Date.now().toString());
        sessionStorage.setItem('eras-oauth-expects-gate', 'true'); // NEW: Explicit gate expectation
        console.log('🚪 [OAUTH START] Set eras-oauth-expects-gate flag');
      } catch (storageError) {
        console.warn('Could not set OAuth flow marker:', storageError);
      }
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account', // Allow account selection without forcing full consent every time
          },
          // Skip email confirmation since Google already verified the email
          skipBrowserRedirect: false
        }
      });

      if (error) {
        console.error('❌ Google sign in error:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText
        });
        
        // Clear OAuth flow marker on error
        try {
          sessionStorage.removeItem('eras-oauth-flow');
          sessionStorage.removeItem('eras-oauth-timestamp');
        } catch (storageError) {
          console.warn('Could not clear OAuth flow marker:', storageError);
        }
        
        // Handle specific OAuth configuration errors with detailed messages
        if (error.message.includes('provider is not enabled')) {
          toast.error('Google OAuth is not enabled in Supabase. Please configure it first.', {
            duration: 8000,
            description: 'Go to Authentication > Providers in your Supabase dashboard'
          });
        } else if (error.message.includes('OAuth')) {
          toast.error('Google OAuth configuration error. Please check your setup.', {
            duration: 8000,
            description: 'Verify your Google Client ID and redirect URLs match'
          });
        } else if (error.message.includes('refused to connect') || error.message.includes('CORS')) {
          toast.error('Google OAuth connection blocked. Please complete the setup.', {
            duration: 8000,
            description: 'Check your Google Cloud Console OAuth configuration'
          });
        } else {
          toast.error(`Google Sign In failed: ${error.message}`, {
            duration: 6000,
            description: 'Please use email/password authentication instead'
          });
        }
        setIsLoading(false);
      } else {
        console.log('✅ Google OAuth redirect initiated successfully');
        // The redirect will happen automatically, keep loading state
        // Don't reset loading - the page will redirect
      }
    } catch (error) {
      console.error('❌ Google sign in exception:', error);
      
      // Clear OAuth flow marker on error
      try {
        sessionStorage.removeItem('eras-oauth-flow');
        sessionStorage.removeItem('eras-oauth-timestamp');
      } catch (storageError) {
        console.warn('Could not clear OAuth flow marker:', storageError);
      }
      
      // Handle network errors specifically
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error('Network error: Please check your internet connection and try again.', {
          duration: 5000,
          description: 'Google Sign In requires an internet connection'
        });
      } else {
        toast.error('Google Sign In is not available right now.', {
          duration: 5000,
          description: 'Please use email/password authentication'
        });
      }
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) {
        console.error('Apple sign in error:', error);
        
        // Handle specific OAuth configuration errors
        if (error.message.includes('provider is not enabled') || error.message.includes('OAuth')) {
          toast.error('Apple Sign In is not configured yet. Please use email/password or contact support.', {
            duration: 5000
          });
        } else {
          toast.error('Failed to sign in with Apple. Please try email/password instead.');
        }
        setIsLoading(false);
      }
      // The redirect will happen automatically, so we don't need to handle success here
    } catch (error) {
      console.error('Apple sign in error:', error);
      toast.error('Apple Sign In is not available. Please use email/password.');
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: ''
    });
    setShowPassword(false);
    setVerificationCode(['', '', '', '', '', '']);
  };

  const switchView = (view) => {
    resetForm();
    setCurrentView(view);
  };

  if (currentView === 'reset-sent') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mb-6">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full w-fit mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Check Your Email</h2>
              <p className="text-muted-foreground mb-3">
                We've sent a password reset link to <strong>{formData.email}</strong>
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-full">
                <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  Delivered via Resend • Should arrive instantly
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The email should arrive within seconds. If you don't see it, check your spam folder.
              </p>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleForgotPassword({ preventDefault: () => {} })}
                  disabled={isLoading}
                >
                  Resend Email
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => switchView('signin')}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sign In
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentView === 'reset-password') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <MomentPrismLogo size={120} forceAuthLayout={true} />
            </div>
            <CardTitle>Create New Password</CardTitle>
            <p className="text-muted-foreground">
              Enter your new password below
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4" name="reset-password-form">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    id="new-password"
                    name="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    autoComplete="new-password"
                    minLength={8}
                    style={{
                      width: '100%',
                      minHeight: '44px',
                      paddingLeft: '40px',
                      paddingRight: '48px',
                      fontSize: '16px',
                      color: 'rgb(0, 0, 0)',
                      background: '#f3f3f5',
                      border: '1px solid rgb(229, 231, 235)',
                      borderRadius: '6px',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgb(0, 0, 0)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgb(229, 231, 235)';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle-btn"
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      padding: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {showPassword ? (
                      <EyeOff style={{ width: '20px', height: '20px', color: 'rgb(113, 113, 130)' }} />
                    ) : (
                      <Eye style={{ width: '20px', height: '20px', color: 'rgb(113, 113, 130)' }} />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters long
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    id="confirm-new-password"
                    name="confirm-new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    autoComplete="new-password"
                    style={{
                      width: '100%',
                      minHeight: '44px',
                      paddingLeft: '40px',
                      paddingRight: '12px',
                      fontSize: '16px',
                      color: 'rgb(0, 0, 0)',
                      background: '#f3f3f5',
                      border: '1px solid rgb(229, 231, 235)',
                      borderRadius: '6px',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgb(0, 0, 0)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgb(229, 231, 235)';
                    }}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full min-h-[48px]" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button 
                variant="link" 
                onClick={() => switchView('signin')}
                className="text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentView === 'verify-email') {
    return (
      <EmailVerification 
        email={formData.email}
        onBack={() => switchView('signin')}
      />
    );
  }



  if (currentView === 'forgot') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <MomentPrismLogo size={120} forceAuthLayout={true} />
            </div>
            <CardTitle>Reset Your Password</CardTitle>
            <p className="text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4" name="forgot-password-form" autoComplete="on">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  placeholder="Enter your email"
                  className="min-h-[44px]"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onFocus={(e) => {
                    e.target.style.fontSize = '16px';
                  }}
                  required
                  autoComplete="username email"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full min-h-[48px] touch-manipulation" 
                disabled={isLoading}
                onTouchStart={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'scale(0.98)';
                  }
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <Button 
                type="button" 
                variant="ghost" 
                className="w-full"
                onClick={() => switchView('signin')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <Card className="w-full max-w-md my-4 md:my-8">
        <CardHeader className="text-center">
          <div className="flex justify-center">
            <MomentPrismLogo size={120} forceAuthLayout={true} />
          </div>
        </CardHeader>
        <CardContent className="px-6">
          <Tabs value={currentView} onValueChange={setCurrentView}>
            <TabsList className="!w-full grid grid-cols-2 h-10 md:h-[34px] !flex-none !bg-transparent !p-0 gap-2">
              <TabsTrigger value="signin" className="!rounded-lg data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=inactive]:!bg-muted">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="!rounded-lg data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=inactive]:!bg-muted">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-6">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // For iPhone, ensure keyboard is dismissed
                  if (debugInfo.isIOS && document.activeElement) {
                    document.activeElement.blur();
                  }
                  
                  // Small delay to ensure form state is stable
                  setTimeout(() => {
                    handleSignIn(e);
                  }, debugInfo.isIOS ? 100 : 0);
                }}
                className="space-y-4 auth-form"
                name="signin-form"
                autoComplete="on"
                noValidate
              >
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    placeholder="Enter your email"
                    className="min-h-[44px]"
                    style={{ fontSize: '16px' }}
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    autoComplete="username email"
                    autoFocus={false}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="min-h-[44px] pr-12"
                      style={{ fontSize: '16px' }}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                      autoComplete="current-password"
                      autoFocus={false}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle-btn"
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10
                      }}
                    >
                      {showPassword ? (
                        <EyeOff style={{ width: '20px', height: '20px', color: 'rgb(113, 113, 130)' }} />
                      ) : (
                        <Eye style={{ width: '20px', height: '20px', color: 'rgb(113, 113, 130)' }} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox - Now below password field */}
                <div className="remember-me-container" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  height: '20px'
                }}>
                  <Checkbox 
                    id="remember-me" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => {
                      setRememberMe(checked);
                      console.log('🔐 Remember Me toggled:', checked);
                    }}
                    style={{
                      width: '16px',
                      height: '16px',
                      minWidth: '16px',
                      minHeight: '16px',
                      flexShrink: 0,
                      margin: 0,
                      padding: 0
                    }}
                  />
                  <label
                    htmlFor="remember-me"
                    className="text-sm cursor-pointer select-none"
                    style={{
                      WebkitUserSelect: 'none',
                      userSelect: 'none',
                      touchAction: 'manipulation',
                      fontWeight: 600,
                      lineHeight: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      margin: 0,
                      padding: 0
                    }}
                    title="Stay signed in for 30 days and save your email for next time"
                  >
                    Remember me for 30 days
                  </label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full min-h-[48px] auth-button active:scale-[0.98] transition-all" 
                  disabled={isLoading}
                  style={{
                    fontSize: '16px', // Prevent iOS zoom
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    opacity: isLoading ? 0.7 : 1,
                    cursor: isLoading ? 'not-allowed' : 'pointer'
                  }}
                  onClick={(e) => {
                    // For iPhone compatibility, handle both click and submit
                    if (isLoading) {
                      e.preventDefault();
                      return;
                    }
                  }}
                  onKeyDown={(e) => {
                    // Allow Enter key to submit
                    if (e.key === 'Enter' && !isLoading) {
                      e.currentTarget.click();
                    }
                  }}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>

                {/* Forgot Password - Centered below Sign In button */}
                <div className="flex justify-center">
                  <Button 
                    type="button" 
                    variant="link" 
                    className="px-0 h-auto text-sm touch-manipulation"
                    style={{ fontSize: '14px' }}
                    onClick={() => switchView('forgot')}
                  >
                    Forgot password?
                  </Button>
                </div>

                {/* iPhone Fallback Button */}
                {debugInfo.isIOS && debugInfo.attempts >= 2 && debugInfo.lastError && (
                  <div className="mt-4 space-y-2">
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <p className="text-xs text-amber-800 dark:text-amber-200">
                        <strong>Having trouble?</strong> Try the button below or refresh the page and try again.
                      </p>
                    </div>
                    <Button 
                      type="button"
                      variant="outline" 
                      className="w-full auth-button" 
                      disabled={isLoading}
                      style={{
                        fontSize: '16px',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                      onClick={async () => {
                        console.log('🔄 iPhone fallback sign-in attempt');
                        // Clear any existing sessions first
                        try {
                          await supabase.auth.signOut();
                          await new Promise(resolve => setTimeout(resolve, 500));
                        } catch (e) {
                          console.log('Signout failed, continuing...');
                        }
                        
                        // Try sign-in again with fresh state
                        handleSignIn({ preventDefault: () => {} });
                      }}
                    >
                      Try Alternative Sign-In
                    </Button>
                  </div>
                )}
              </form>

              {/* Social Login Section */}
              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full min-h-[48px] touch-manipulation"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    onTouchStart={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.transform = 'scale(0.98)';
                      }
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {isLoading ? 'Connecting...' : 'Continue with Google'}
                  </Button>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    By continuing, you agree to our<br />
                    <span style={{ whiteSpace: 'nowrap', display: 'inline-block' }}>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          window.history.pushState({}, '', '/terms');
                          window.dispatchEvent(new Event('navigate'));
                        }}
                        style={{ display: 'inline' }}
                        className="underline hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0 font-inherit"
                      >
                        Terms of Service
                      </button>
                      {' & '}
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          window.history.pushState({}, '', '/privacy');
                          window.dispatchEvent(new Event('navigate'));
                        }}
                        style={{ display: 'inline' }}
                        className="underline hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0 font-inherit"
                      >
                        Privacy Policy
                      </button>
                    </span>
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-6">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  // Blur active element to hide keyboard on mobile
                  if (document.activeElement && document.activeElement.blur) {
                    document.activeElement.blur();
                  }
                  handleSignUp(e);
                }} 
                className="space-y-4"
                name="signup-form"
                autoComplete="on"
                noValidate
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="First name"
                      className="min-h-[44px]"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      onFocus={(e) => {
                        e.target.style.fontSize = '16px';
                      }}
                      required
                      autoComplete="given-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Last name"
                      className="min-h-[44px]"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      onFocus={(e) => {
                        e.target.style.fontSize = '16px';
                      }}
                      required
                      autoComplete="family-name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email Address</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    placeholder="Enter your email"
                    className="min-h-[44px]"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    onFocus={(e) => {
                      e.target.style.fontSize = '16px';
                    }}
                    required
                    autoComplete="username email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      id="signup-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a unique password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                      autoComplete="new-password"
                      style={{
                        width: '100%',
                        minHeight: '44px',
                        paddingLeft: '12px',
                        paddingRight: '48px',
                        fontSize: '16px',
                        color: 'rgb(0, 0, 0)',
                        background: '#f3f3f5',
                        border: '1px solid rgb(229, 231, 235)',
                        borderRadius: '6px',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'rgb(0, 0, 0)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgb(229, 231, 235)';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle-btn"
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {showPassword ? (
                        <EyeOff style={{ width: '20px', height: '20px', color: 'rgb(113, 113, 130)' }} />
                      ) : (
                        <Eye style={{ width: '20px', height: '20px', color: 'rgb(113, 113, 130)' }} />
                      )}
                    </button>
                  </div>
                  
                  {/* Password Requirements */}
                  {formData.password && (
                    <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground">Password Requirements:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className={`flex items-center gap-1 ${
                          validatePassword(formData.password).requirements.minLength 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-muted-foreground'
                        }`}>
                          {validatePassword(formData.password).requirements.minLength ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          8+ characters
                        </div>
                        <div className={`flex items-center gap-1 ${
                          validatePassword(formData.password).requirements.hasLetter 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-muted-foreground'
                        }`}>
                          {validatePassword(formData.password).requirements.hasLetter ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          Letters (A-Z)
                        </div>
                        <div className={`flex items-center gap-1 ${
                          validatePassword(formData.password).requirements.hasNumber 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-muted-foreground'
                        }`}>
                          {validatePassword(formData.password).requirements.hasNumber ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          Numbers (0-9)
                        </div>
                        <div className={`flex items-center gap-1 ${
                          validatePassword(formData.password).requirements.hasSpecial 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-muted-foreground'
                        }`}>
                          {validatePassword(formData.password).requirements.hasSpecial ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          Special chars (!@#$)
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      required
                      autoComplete="new-password"
                      style={{
                        width: '100%',
                        minHeight: '44px',
                        paddingLeft: '12px',
                        paddingRight: '48px',
                        fontSize: '16px',
                        color: 'rgb(0, 0, 0)',
                        background: '#f3f3f5',
                        border: '1px solid rgb(229, 231, 235)',
                        borderRadius: '6px',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'rgb(0, 0, 0)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'rgb(229, 231, 235)';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle-btn"
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {showPassword ? (
                        <EyeOff style={{ width: '20px', height: '20px', color: 'rgb(113, 113, 130)' }} />
                      ) : (
                        <Eye style={{ width: '20px', height: '20px', color: 'rgb(113, 113, 130)' }} />
                      )}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full min-h-[48px] touch-manipulation transition-all" 
                  disabled={isLoading}
                  style={{
                    opacity: isLoading ? 0.7 : 1,
                    cursor: isLoading ? 'not-allowed' : 'pointer'
                  }}
                  onTouchStart={(e) => {
                    if (!isLoading) {
                      e.currentTarget.style.transform = 'scale(0.98)';
                    }
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>

              <div className="mt-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full min-h-[48px] touch-manipulation"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    onTouchStart={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.transform = 'scale(0.98)';
                      }
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {isLoading ? 'Connecting...' : 'Continue with Google'}
                  </Button>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    By continuing, you agree to our<br />
                    <span style={{ whiteSpace: 'nowrap', display: 'inline-block' }}>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          window.history.pushState({}, '', '/terms');
                          window.dispatchEvent(new Event('navigate'));
                        }}
                        style={{ display: 'inline' }}
                        className="underline hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0 font-inherit"
                      >
                        Terms of Service
                      </button>
                      {' & '}
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          window.history.pushState({}, '', '/privacy');
                          window.dispatchEvent(new Event('navigate'));
                        }}
                        style={{ display: 'inline' }}
                        className="underline hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0 font-inherit"
                      >
                        Privacy Policy
                      </button>
                    </span>
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}