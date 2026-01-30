import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

interface EmailVerificationProps {
  email: string;
  onBack: () => void;
}

export function EmailVerification({ email, onBack }: EmailVerificationProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'checking' | 'verified' | 'error'>('pending');
  const [lastResendTime, setLastResendTime] = useState(0);

  // Start cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Check verification status periodically
  useEffect(() => {
    const checkVerification = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email_confirmed_at) {
          setVerificationStatus('verified');
          toast.success('Email verified successfully!');
          // Refresh the page to log in the user
          setTimeout(() => window.location.reload(), 1500);
        }
      } catch (error) {
        console.error('Error checking verification:', error);
      }
    };

    // Check every 3 seconds
    const interval = setInterval(checkVerification, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;

    // Duplicate request prevention
    const now = Date.now();
    const timeSinceLastResend = now - lastResendTime;
    if (timeSinceLastResend < 3000) {
      const remainingWait = Math.ceil((3000 - timeSinceLastResend) / 1000);
      toast.info(`Please wait ${remainingWait} second${remainingWait > 1 ? 's' : ''} before trying again`, {
        description: 'This prevents accidental duplicate submissions',
        duration: 3000
      });
      return;
    }
    setLastResendTime(now);

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
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
          setResendCooldown(60); // Set cooldown to prevent immediate retry
        } else if (error.message.includes('rate_limit') || error.message.includes('too many')) {
          toast.error('Too many resend attempts. Please wait a moment and try again.', {
            duration: 6000
          });
          setResendCooldown(60);
        } else if (error.message.includes('already confirmed')) {
          toast.success('Your email is already verified! Please try signing in.', {
            duration: 6000
          });
        } else {
          throw error;
        }
        return;
      }

      toast.success('Verification email sent! Check your inbox.');
      setResendCooldown(60); // 60 second cooldown
    } catch (error: any) {
      console.error('Resend error:', error);
      toast.error(error.message || 'Failed to resend email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  if (verificationStatus === 'verified') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">Email Verified!</CardTitle>
            <CardDescription>
              Your email has been successfully verified. Redirecting you to Eras...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="animate-spin mx-auto w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center animate-pulse">
            <Mail className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">Check Your Email</CardTitle>
          <CardDescription>
            We've sent a verification link to:
          </CardDescription>
          <p className="font-medium text-foreground mt-2">{email}</p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Next Steps:
            </h4>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-decimal list-inside">
              <li>Open your email inbox</li>
              <li>Find the email from Eras (check spam/junk if needed)</li>
              <li>Click the verification link</li>
              <li>You'll be automatically logged in</li>
            </ol>
          </div>

          {/* Resend Email Button */}
          <div className="space-y-3">
            <Button
              onClick={handleResendEmail}
              disabled={isResending || resendCooldown > 0}
              variant="outline"
              className="w-full"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : resendCooldown > 0 ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend in {resendCooldown}s
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Didn't receive the email? Check your spam folder or click above to resend.
            </p>
          </div>

          {/* Back to Login */}
          <div className="pt-4 border-t">
            <Button
              onClick={onBack}
              variant="ghost"
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
