import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { CheckCircle, X, Loader2 } from 'lucide-react';
import { MomentPrismLogo } from './MomentPrismLogo';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function VerifyEmail({ onSuccess }: { onSuccess?: () => void }) {
  const [isVerifying, setIsVerifying] = useState<boolean | null>(null);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const verifyToken = async () => {
      console.log('🔍 [EMAIL VERIFICATION] Starting verification...');
      console.log('🔍 [EMAIL VERIFICATION] Full URL:', window.location.href);
      
      // Get token from URL query parameter
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      console.log('🔍 [EMAIL VERIFICATION] Token from URL:', token ? 'Present' : 'Missing');
      
      if (!token) {
        console.warn('⚠️ [EMAIL VERIFICATION] No token in URL query parameters');
        setIsVerifying(false);
        setErrorMessage('No verification token found in URL');
        toast.error('Invalid verification link', {
          description: 'Please use the link from your email.',
          duration: 8000
        });
        return;
      }
      
      setIsVerifying(true);
      console.log('✅ [EMAIL VERIFICATION] Token found, verifying with server...');
      
      try {
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/auth/verify-email-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ token })
        });

        const result = await response.json();
        
        console.log('🔍 [EMAIL VERIFICATION] Verification result:', result);
        
        if (result.valid) {
          console.log('✅ [EMAIL VERIFICATION] Email verified successfully!');
          setIsVerifying(false);
          setVerifySuccess(true);
          
          toast.success('Email verified successfully! 🎉', {
            description: 'You can now sign in to your account.',
            duration: 5000
          });
          
          // Redirect to sign in after a brief delay
          setTimeout(() => {
            if (onSuccess) {
              onSuccess();
            } else {
              window.location.href = '/';
            }
          }, 2000);
        } else {
          console.warn('⚠️ [EMAIL VERIFICATION] Verification failed:', result.error);
          setIsVerifying(false);
          setErrorMessage(result.error || 'Verification failed');
          
          if (result.error?.includes('expired')) {
            toast.error('Verification link has expired', {
              description: 'Please request a new verification link.',
              duration: 10000
            });
          } else if (result.error?.includes('already verified')) {
            toast.success('Email already verified!', {
              description: 'You can sign in to your account.',
              duration: 8000
            });
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
          } else {
            toast.error('Verification failed', {
              description: result.error || 'Please try again or contact support.',
              duration: 10000
            });
          }
        }
      } catch (error) {
        console.error('❌ [EMAIL VERIFICATION] Exception:', error);
        setIsVerifying(false);
        setErrorMessage('Network error during verification');
        toast.error('Verification error', {
          description: 'Please check your connection and try again.',
          duration: 10000
        });
      }
    };
    
    verifyToken();
  }, [onSuccess]);

  // Loading state
  if (isVerifying === null || isVerifying === true) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mb-4">
              <MomentPrismLogo size={120} className="mx-auto mb-6" />
            </div>
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Verifying your email...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (verifySuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mb-6">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full w-fit mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Email Verified!</h2>
              <p className="text-muted-foreground mb-4">
                Your email has been verified successfully. Redirecting you to sign in...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="mb-6">
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full w-fit mx-auto mb-4">
              <X className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Verification Failed</h2>
            <p className="text-muted-foreground mb-4">
              {errorMessage || 'Unable to verify your email.'}
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4 text-left">
              <h3 className="text-sm font-semibold mb-2 text-blue-900 dark:text-blue-200">Common reasons:</h3>
              <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                <li>• The link has expired (links expire after 24 hours)</li>
                <li>• The link was already used</li>
                <li>• You're using an old verification link</li>
              </ul>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button onClick={() => window.location.href = '/'}>
                Return to Sign In
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
