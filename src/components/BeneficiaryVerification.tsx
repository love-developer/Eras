import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, Shield, Heart } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface BeneficiaryVerificationProps {
  token?: string;
  onComplete?: () => void;
}

type VerificationState = 'loading' | 'success' | 'error' | 'declined' | 'expired' | 'already-verified';

export function BeneficiaryVerification({ token, onComplete }: BeneficiaryVerificationProps) {
  const [state, setState] = useState<VerificationState>('loading');
  const [ownerName, setOwnerName] = useState('');
  const [beneficiaryEmail, setBeneficiaryEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (token) {
      verifyToken(token);
    } else {
      setState('error');
      setErrorMessage('No verification token provided');
    }
  }, [token]);

  const verifyToken = async (verificationToken: string) => {
    try {
      setState('loading');
      
      console.log('🔐 [Frontend] Verifying token:', {
        token: verificationToken,
        length: verificationToken.length,
        fullUrl: window.location.href,
        search: window.location.search,
        projectId,
        publicAnonKey: publicAnonKey?.substring(0, 20) + '...'
      });

      // Use GET with query parameter to bypass Supabase JWT verification
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-access/beneficiary/verify?token=${encodeURIComponent(verificationToken)}`;

      console.log('📡 [Frontend] Request details (GET):', {
        url,
        method: 'GET'
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          // Send anon key for public access - Supabase requires some auth header
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      const data = await response.json();
      
      console.log('📩 [Frontend] Verification response:', {
        ok: response.ok,
        status: response.status,
        data
      });

      if (response.ok && data.success) {
        setState('success');
        setOwnerName(data.ownerName || 'the account owner');
        setBeneficiaryEmail(data.beneficiaryEmail || '');
      } else if (data.alreadyVerified) {
        setState('already-verified');
        setOwnerName(data.ownerName || 'the account owner');
      } else if (data.expired) {
        setState('expired');
      } else {
        setState('error');
        setErrorMessage(data.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setState('error');
      setErrorMessage('Unable to connect to the server. Please try again later.');
    }
  };

  const handleDecline = async () => {
    if (!token) return;

    setIsProcessing(true);

    try {
      // Use GET with query parameter to bypass Supabase JWT verification
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-access/beneficiary/decline?token=${encodeURIComponent(token)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          // Send anon key for public access - Supabase requires some auth header
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setState('declined');
      } else {
        setErrorMessage(data.error || 'Failed to decline beneficiary role');
        setState('error');
      }
    } catch (error) {
      console.error('Decline error:', error);
      setErrorMessage('Unable to process your request. Please try again.');
      setState('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderContent = () => {
    switch (state) {
      case 'loading':
        return (
          <div className="text-center py-12">
            <Loader2 className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-6" />
            <h2 className="text-2xl text-white mb-2">Verifying Your Email...</h2>
            <p className="text-slate-400">Please wait while we confirm your beneficiary status</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-12">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-emerald-500/30 blur-xl animate-pulse" />
              <CheckCircle className="relative w-20 h-20 text-emerald-400 mx-auto" />
            </div>
            
            <h2 className="text-3xl text-white mb-4">
              ✅ Email Verified Successfully!
            </h2>
            
            <p className="text-slate-300 text-lg mb-6">
              You are now confirmed as a beneficiary for <strong className="text-purple-300">{ownerName}'s</strong> Eras account.
            </p>

            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 mb-8 max-w-2xl mx-auto">
              <h3 className="text-purple-300 font-semibold mb-3 flex items-center justify-center gap-2">
                <Shield className="w-5 h-5" />
                What This Means
              </h3>
              <div className="text-slate-300 text-sm space-y-2 text-left">
                <p>✓ <strong className="text-white">Right now:</strong> Nothing changes. {ownerName} still has full control of their account.</p>
                <p>✓ <strong className="text-white">If inactive:</strong> You'll be notified and granted access to view their time capsules and vault.</p>
                <p>✓ <strong className="text-white">Your privacy:</strong> {ownerName} cannot see if/when you access their content.</p>
                <p>✓ <strong className="text-white">Your choice:</strong> You can remove yourself from this role at any time.</p>
              </div>
            </div>

            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 mb-8 max-w-2xl mx-auto">
              <p className="text-cyan-200 text-sm">
                📧 A confirmation email has been sent to <strong className="text-white">{beneficiaryEmail}</strong>
              </p>
            </div>

            <button
              onClick={() => window.location.href = '/'}
              className="px-8 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-all shadow-lg hover:shadow-purple-500/50"
            >
              Go to Eras Home
            </button>
          </div>
        );

      case 'already-verified':
        return (
          <div className="text-center py-12">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-blue-500/30 blur-xl" />
              <CheckCircle className="relative w-20 h-20 text-blue-400 mx-auto" />
            </div>
            
            <h2 className="text-3xl text-white mb-4">
              Already Verified
            </h2>
            
            <p className="text-slate-300 text-lg mb-8">
              You've already verified your beneficiary status for <strong className="text-purple-300">{ownerName}'s</strong> account.
            </p>

            <button
              onClick={() => window.location.href = '/'}
              className="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-500/50"
            >
              Go to Eras Home
            </button>
          </div>
        );

      case 'declined':
        return (
          <div className="text-center py-12">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-slate-500/30 blur-xl" />
              <Heart className="relative w-20 h-20 text-slate-400 mx-auto" />
            </div>
            
            <h2 className="text-3xl text-white mb-4">
              Beneficiary Role Declined
            </h2>
            
            <p className="text-slate-300 text-lg mb-6">
              You've declined the beneficiary role. This is completely understandable.
            </p>

            <div className="bg-slate-500/10 border border-slate-500/30 rounded-xl p-6 mb-8 max-w-2xl mx-auto">
              <p className="text-slate-300 text-sm">
                The account owner will be notified that you declined. If you change your mind later, they can send you a new invitation.
              </p>
            </div>

            <button
              onClick={() => window.location.href = '/'}
              className="px-8 py-3 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition-all"
            >
              Go to Eras Home
            </button>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center py-12">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-orange-500/30 blur-xl" />
              <XCircle className="relative w-20 h-20 text-orange-400 mx-auto" />
            </div>
            
            <h2 className="text-3xl text-white mb-4">
              Verification Link Expired
            </h2>
            
            <p className="text-slate-300 text-lg mb-8">
              This verification link has expired. Verification links are valid for 14 days.
            </p>

            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6 mb-8 max-w-2xl mx-auto">
              <p className="text-orange-200 text-sm mb-4">
                <strong>What to do:</strong>
              </p>
              <p className="text-slate-300 text-sm">
                Contact the person who designated you as a beneficiary and ask them to resend the invitation from their Eras account settings.
              </p>
            </div>

            <button
              onClick={() => window.location.href = '/'}
              className="px-8 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-all shadow-lg hover:shadow-orange-500/50"
            >
              Go to Eras Home
            </button>
          </div>
        );

      case 'error':
      default:
        return (
          <div className="text-center py-12">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-red-500/30 blur-xl" />
              <XCircle className="relative w-20 h-20 text-red-400 mx-auto" />
            </div>
            
            <h2 className="text-3xl text-white mb-4">
              Verification Failed
            </h2>
            
            <p className="text-slate-300 text-lg mb-6">
              {errorMessage || 'We couldn\'t verify your email. Please try again.'}
            </p>

            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-8 max-w-2xl mx-auto">
              <p className="text-red-200 text-sm mb-4">
                <strong>Possible reasons:</strong>
              </p>
              <ul className="text-slate-300 text-sm text-left space-y-1">
                <li>• The verification link is invalid or corrupted</li>
                <li>• The link has already been used</li>
                <li>• The beneficiary invitation was cancelled</li>
                <li>• There was a network connection issue</li>
              </ul>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-all"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-all shadow-lg hover:shadow-purple-500/50"
              >
                Go to Home
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background Effects - MOBILE SAFE: Using solid colors instead of gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main Content Card */}
      <div className="relative w-full max-w-4xl">
        <div className="absolute inset-0 bg-purple-500/10 rounded-2xl blur-xl" />
        
        <div className="relative bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-purple-500/20 rounded-2xl mb-4">
              <Shield className="w-12 h-12 text-purple-400" />
            </div>
            <h1 className="text-4xl text-white mb-2">
              Legacy Beneficiary Verification
            </h1>
            <p className="text-slate-400">
              Eras • Secure Memory Inheritance
            </p>
          </div>

          {/* Dynamic Content */}
          {renderContent()}

          {/* Decline Option (only show on success or loading states) */}
          {(state === 'success' || state === 'loading') && (
            <div className="mt-8 pt-8 border-t border-slate-700/50">
              <p className="text-center text-slate-400 text-sm mb-4">
                Don't want this responsibility?
              </p>
              <button
                onClick={handleDecline}
                disabled={isProcessing}
                className="mx-auto block px-6 py-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Declining...
                  </span>
                ) : (
                  'Decline Beneficiary Role'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}