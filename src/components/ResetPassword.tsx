import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Lock, Eye, EyeOff, CheckCircle, X, Check } from 'lucide-react';
import { MomentPrismLogo } from './MomentPrismLogo';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function ResetPassword({ onSuccess }: { onSuccess?: () => void }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [hasValidToken, setHasValidToken] = useState<boolean | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  // Check if we have a valid reset token (custom token system)
  useEffect(() => {
    const checkToken = async () => {
      console.log('🔍 [PASSWORD RESET] ==========================================');
      console.log('🔍 [PASSWORD RESET] Checking for password reset token...');
      console.log('🔍 [PASSWORD RESET] Full URL:', window.location.href);
      
      // Get token from URL query parameter
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      console.log('🔍 [PASSWORD RESET] Token from URL:', token ? 'Present' : 'Missing');
      
      if (!token) {
        console.warn('⚠️ [PASSWORD RESET] No token in URL query parameters');
        setHasValidToken(false);
        toast.error('No valid reset link found', {
          description: 'Please use the password reset link from your email.',
          duration: 8000
        });
        return;
      }
      
      setResetToken(token);
      console.log('✅ [PASSWORD RESET] Token found, verifying with server...');
      
      try {
        // Verify token with server
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/auth/verify-reset-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ token })
        });

        const result = await response.json();
        
        console.log('🔍 [PASSWORD RESET] Verification result:', result);
        
        if (result.valid) {
          console.log('✅ [PASSWORD RESET] Token is valid');
          console.log('✅ [PASSWORD RESET] User email:', result.email);
          setHasValidToken(true);
          setUserEmail(result.email);
        } else {
          console.warn('⚠️ [PASSWORD RESET] Token is invalid:', result.error);
          setHasValidToken(false);
          toast.error('Invalid or expired reset link', {
            description: result.error || 'Please request a new password reset.',
            duration: 10000
          });
        }
      } catch (error) {
        console.error('❌ [PASSWORD RESET] Exception during token verification:', error);
        setHasValidToken(false);
        toast.error('Error validating reset link', {
          description: 'Please try again or request a new password reset link.',
          duration: 10000
        });
      }
      
      console.log('🔍 [PASSWORD RESET] ==========================================');
    };
    
    checkToken();
  }, []);

  const validatePassword = (password: string) => {
    const requirements = {
      minLength: password.length >= 8,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    return {
      isValid: Object.values(requirements).every(Boolean),
      requirements
    };
  };

  const validation = validatePassword(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) {
      console.log('🔄 Password reset already in progress');
      return;
    }
    
    // Validation
    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (!validation.isValid) {
      toast.error('Password does not meet requirements', {
        description: 'Please ensure your password is at least 8 characters and contains letters, numbers, and special characters.'
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (!resetToken) {
      toast.error('Reset token missing');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('🔐 [PASSWORD RESET] Updating password via custom endpoint...');
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          token: resetToken,
          newPassword: password
        })
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        console.error('❌ [PASSWORD RESET] Password update failed:', result.error);
        
        if (result.error?.includes('expired')) {
          toast.error('Reset link has expired', {
            description: 'Please request a new password reset link.',
            duration: 8000
          });
        } else if (result.error?.includes('used')) {
          toast.error('Reset link has already been used', {
            description: 'Please request a new password reset link.',
            duration: 8000
          });
        } else {
          toast.error(result.error || 'Failed to reset password');
        }
        setIsLoading(false);
        return;
      }
      
      console.log('✅ [PASSWORD RESET] Password updated successfully');
      setResetSuccess(true);
      
      toast.success('Password reset successfully! 🎉', {
        description: 'You can now sign in with your new password.',
        duration: 5000
      });
      
      // Wait a moment, then redirect or call success callback
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          // Redirect to home page (will show auth screen)
          window.location.href = '/';
        }
      }, 2000);
      
    } catch (error) {
      console.error('❌ [PASSWORD RESET] Exception:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error('Network error: Please check your internet connection and try again.');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
      setIsLoading(false);
    }
  };

  // Loading state while checking token
  if (hasValidToken === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mb-4">
              <MomentPrismLogo size={120} className="mx-auto" />
            </div>
            <p className="text-muted-foreground">Verifying reset link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid token
  if (!hasValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mb-6">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full w-fit mx-auto mb-4">
                <X className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Invalid Reset Link</h2>
              <p className="text-muted-foreground mb-4">
                This password reset link is invalid or has expired.
              </p>
              
              {/* Troubleshooting info */}
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4 text-left">
                <h3 className="text-sm font-semibold mb-2 text-blue-900 dark:text-blue-200">Common reasons:</h3>
                <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                  <li>• The link has expired (links expire after 1 hour)</li>
                  <li>• The link was already used</li>
                  <li>• You're using an old reset link</li>
                </ul>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button onClick={() => {
                  // Go to forgot password page
                  window.location.href = '/?forgot=true';
                }}>
                  Request New Reset Link
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/'}>
                  Return to Sign In
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (resetSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mb-6">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full w-fit mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Password Reset Successful!</h2>
              <p className="text-muted-foreground mb-4">
                Your password has been updated. Redirecting you to sign in...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <MomentPrismLogo size={120} />
          </div>
          <CardTitle>Create New Password</CardTitle>
          <p className="text-muted-foreground">
            {userEmail && <span className="block text-xs mt-1">for {userEmail}</span>}
            Enter a strong password for your account
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div style={{ position: 'relative', width: '100%' }}>
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
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
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div style={{ position: 'relative', width: '100%' }}>
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
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
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                  {showConfirmPassword ? (
                    <EyeOff style={{ width: '20px', height: '20px', color: 'rgb(113, 113, 130)' }} />
                  ) : (
                    <Eye style={{ width: '20px', height: '20px', color: 'rgb(113, 113, 130)' }} />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            {password && (
              <div className="space-y-2 text-sm">
                <p className="font-medium">Password Requirements:</p>
                <div className="space-y-1">
                  <div className={`flex items-center gap-2 ${validation.requirements.minLength ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                    {validation.requirements.minLength ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-2 ${validation.requirements.hasLetter ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                    {validation.requirements.hasLetter ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    <span>Contains letters</span>
                  </div>
                  <div className={`flex items-center gap-2 ${validation.requirements.hasNumber ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                    {validation.requirements.hasNumber ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    <span>Contains numbers</span>
                  </div>
                  <div className={`flex items-center gap-2 ${validation.requirements.hasSpecial ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                    {validation.requirements.hasSpecial ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    <span>Contains special characters (!@#$%...)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Passwords Match Indicator */}
            {confirmPassword && (
              <div className={`flex items-center gap-2 text-sm ${passwordsMatch ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {passwordsMatch ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Passwords match</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    <span>Passwords do not match</span>
                  </>
                )}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !validation.isValid || !passwordsMatch}
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
