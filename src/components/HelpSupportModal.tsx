import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { ChevronDown, ChevronRight, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
  userId?: string;
}

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: "When will my capsule be delivered?",
    answer: "Your capsule will be delivered at the exact date and time you scheduled during creation. You'll receive a notification when it's delivered. You can check the delivery status in your Vault."
  },
  {
    question: "Can I edit or reschedule a capsule after creating it?",
    answer: "Yes! You can edit scheduled capsules from your Vault. Tap any capsule to view details, then use the edit options to change the message, media, recipients, or delivery date. Once a capsule is delivered, you can view it but not edit it."
  },
  {
    question: "Why can't I attach media to my capsule?",
    answer: "If media won't attach, try these steps: 1) Check your file size (max 50MB per file), 2) Ensure you have a stable internet connection, 3) Try a different file format, 4) Clear your browser cache and try again. If the issue persists, contact support."
  },
  {
    question: "How do I set up Legacy Access beneficiaries?",
    answer: "Go to Settings → Legacy Access from the gear menu. You can add beneficiaries who will receive access to your vault if your account becomes inactive for an extended period. Beneficiaries must verify their email to be confirmed."
  },
  {
    question: "I can't find a capsule I created. Where did it go?",
    answer: "Check these locations: 1) Vault tab for scheduled/draft capsules, 2) Home tab for delivered capsules, 3) Use the search feature, 4) Check if you archived it in the Archive section. Capsules are never deleted unless you explicitly delete them."
  }
];

export function HelpSupportModal({ isOpen, onClose, userEmail, userName, userId }: HelpSupportModalProps) {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill out both subject and message');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/support-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            subject: subject.trim(),
            message: message.trim(),
            userName: userName || 'Not provided',
            userEmail: userEmail || 'Not provided',
            userId: userId || 'Not available'
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send support request');
      }

      // Show success state
      setSubmitSuccess(true);
      toast.success('Support request sent successfully!');
      
      // Wait 2 seconds, then close modal and reset
      setTimeout(() => {
        setSubject('');
        setMessage('');
        setShowContactForm(false);
        setSubmitSuccess(false);
        onClose();
      }, 2000);

    } catch (error) {
      console.error('❌ Failed to submit support request:', error);
      toast.error('Failed to send support request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !submitSuccess) {
      setShowContactForm(false);
      setSubject('');
      setMessage('');
      setExpandedFAQ(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            {submitSuccess ? '✅ Request Sent!' : 'Help & Support'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {submitSuccess 
              ? 'Your support request has been submitted successfully.' 
              : 'Find answers to common questions or contact our support team.'}
          </DialogDescription>
        </DialogHeader>

        {submitSuccess ? (
          // Success state
          <div className="py-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Thanks for your feedback!
            </h3>
            <p className="text-slate-400">
              We'll get right back to you as soon as possible.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Message Section */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-300 mb-1">All Systems Operational</h3>
                  <p className="text-sm text-green-200/80">
                    Eras is running smoothly. If you're experiencing issues, check the FAQs below or contact support.
                  </p>
                </div>
              </div>
            </div>

            {/* FAQs Section */}
            {!showContactForm && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Quick Answers</h3>
                <div className="space-y-2">
                  {faqs.map((faq, index) => (
                    <div
                      key={index}
                      className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-slate-600 transition-colors"
                    >
                      <button
                        onClick={() => toggleFAQ(index)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-750 transition-colors"
                      >
                        <span className="font-medium text-slate-200">{faq.question}</span>
                        {expandedFAQ === index ? (
                          <ChevronDown className="w-5 h-5 text-purple-400 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        )}
                      </button>
                      {expandedFAQ === index && (
                        <div className="px-4 pb-4 pt-2 bg-slate-800/50 border-t border-slate-700">
                          <p className="text-slate-300 text-sm leading-relaxed">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Form or Button */}
            {showContactForm ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Contact Support</h3>
                  <button
                    onClick={() => setShowContactForm(false)}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    ← Back to FAQs
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief description of your issue"
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={isSubmitting}
                      maxLength={200}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Message
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Please describe your issue or question in detail..."
                      rows={6}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      disabled={isSubmitting}
                      maxLength={2000}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      {message.length}/2000 characters
                    </p>
                  </div>

                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                    <p className="text-xs text-slate-400">
                      <strong className="text-slate-300">Your info:</strong> {userName || 'Anonymous'} ({userEmail || 'No email'})
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || !subject.trim() || !message.trim()}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Support Request
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-slate-500">
                    We typically respond within 24 hours
                  </p>
                </form>
              </div>
            ) : (
              <div className="pt-2">
                <Button
                  onClick={() => setShowContactForm(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 rounded-lg transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}