import { useState } from 'react';
import { Mail, Send, CheckCircle, AlertCircle, ArrowLeft, Clock } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export default function RequestVerification() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/public/legacy-access/request-verification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast.error(data.error || 'Too many requests. Please try again tomorrow.');
        } else {
          toast.error(data.error || 'Failed to send verification link');
        }
        return;
      }

      // Success
      setRequestSent(true);
      toast.success('Request sent! Check your email.');
    } catch (error) {
      console.error('Error requesting verification:', error);
      toast.error('Failed to send request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (requestSent) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 p-8">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>

            {/* Success Message */}
            <h1 className="text-center text-white mb-3">
              Check Your Email
            </h1>
            <p className="text-center text-slate-400 mb-6">
              If your email is registered as a beneficiary, you'll receive a new verification link shortly.
            </p>

            {/* Info Card */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-300 mb-2">
                    <strong>What happens next?</strong>
                  </p>
                  <ul className="text-sm text-slate-400 space-y-1">
                    <li>• Check your inbox (and spam folder)</li>
                    <li>• Click the verification link in the email</li>
                    <li>• Your link never expires - verify anytime</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Rate Limit Info */}
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-200">
                  You can request a new link up to <strong>3 times per day</strong>. If you need additional help, please contact support.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setRequestSent(false)}
                className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Request Another Link
              </button>
              <a
                href="/"
                className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-center"
              >
                Go to Homepage
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 p-8">
          {/* Header */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-indigo-400" />
            </div>
          </div>

          <h1 className="text-center text-white mb-3">
            Request Verification Link
          </h1>
          <p className="text-center text-slate-400 mb-8">
            Enter your email to receive a new legacy beneficiary verification link
          </p>

          {/* Info Card */}
          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-indigo-200 mb-2">
                  <strong>Why am I here?</strong>
                </p>
                <p className="text-sm text-indigo-300/80">
                  If you've been designated as a legacy beneficiary and lost your verification email, use this page to request a new link.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={isLoading}
                autoFocus
              />
              <p className="mt-2 text-xs text-slate-500">
                Enter the email address associated with your beneficiary role
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Verification Link
                </>
              )}
            </button>
          </form>

          {/* Features */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-slate-400">No expiration - verify anytime</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-slate-400">Secure rate limiting (3 requests/day)</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-slate-400">Privacy protected - we don't reveal if email exists</span>
              </div>
            </div>
          </div>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Homepage
            </a>
          </div>
        </div>

        {/* Additional Help */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Need help?{' '}
            <a href="mailto:support@erastimecapsule.com" className="text-indigo-400 hover:text-indigo-300">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
