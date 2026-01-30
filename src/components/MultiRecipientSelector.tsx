import React, { useState, KeyboardEvent } from 'react';
import { X, Mail, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';

interface Recipient {
  id: string;
  type: 'email' | 'phone';
  value: string;
  name?: string;
}

interface MultiRecipientSelectorProps {
  recipients: Recipient[];
  onRecipientsChange: (recipients: Recipient[]) => void;
  maxRecipients?: number;
  className?: string;
}

export function MultiRecipientSelector({
  recipients,
  onRecipientsChange,
  maxRecipients = 10,
  className = ''
}: MultiRecipientSelectorProps) {
  const [inputValue, setInputValue] = useState('');
  const [inputName, setInputName] = useState('');
  const [error, setError] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check if recipient already exists
  const isDuplicate = (email: string): boolean => {
    return recipients.some(
      (r) => r.value.toLowerCase().trim() === email.toLowerCase().trim()
    );
  };

  // Add recipient from input
  const addRecipient = () => {
    const email = inputValue.trim().toLowerCase();
    
    // Clear previous errors
    setError('');

    // Validation
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (isDuplicate(email)) {
      setError('This recipient has already been added');
      return;
    }

    if (recipients.length >= maxRecipients) {
      setError(`Maximum ${maxRecipients} recipients allowed`);
      return;
    }

    // Add new recipient
    const newRecipient: Recipient = {
      id: `recipient-${Date.now()}-${Math.random()}`,
      type: 'email',
      value: email,
      name: inputName.trim() || undefined
    };

    onRecipientsChange([...recipients, newRecipient]);
    
    // Clear inputs
    setInputValue('');
    setInputName('');
    setShowNameInput(false);
  };

  // Remove recipient
  const removeRecipient = (id: string) => {
    onRecipientsChange(recipients.filter((r) => r.id !== id));
    setError('');
  };

  // Handle Enter key
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addRecipient();
    }
  };

  // Get recipient count color
  const getCountColor = () => {
    const count = recipients.length;
    if (count === 0) return 'text-white/40';
    if (count >= 5 && count < 10) return 'text-blue-400'; // Circle of Trust territory
    if (count >= 10) return 'text-purple-400'; // Grand Broadcast territory
    return 'text-white/70';
  };

  // Get achievement hint
  const getAchievementHint = () => {
    const count = recipients.length;
    if (count >= 10) {
      return (
        <div className="flex items-center gap-2 text-purple-400 text-sm">
          <CheckCircle2 className="h-4 w-4" />
          <span>Grand Broadcast achievement ready! 🎉</span>
        </div>
      );
    }
    if (count >= 5) {
      return (
        <div className="flex items-center gap-2 text-blue-400 text-sm">
          <CheckCircle2 className="h-4 w-4" />
          <span>Circle of Trust achievement ready! ⭐</span>
        </div>
      );
    }
    if (count >= 3) {
      return (
        <div className="text-white/50 text-sm">
          Add {5 - count} more for "Circle of Trust" achievement
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Label className="text-base text-white/90 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recipients
          </Label>
          <span className={`text-sm font-medium ${getCountColor()}`}>
            {recipients.length} / {maxRecipients}
          </span>
        </div>
        {getAchievementHint()}
      </div>

      {/* Input section */}
      <Card className="bg-white/10 border-white/20">
        <CardContent className="p-4 space-y-3">
          <div className="space-y-2">
            <Label className="text-sm text-white/70">Email Address</Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  type="email"
                  placeholder="recipient@example.com"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/30"
                  disabled={recipients.length >= maxRecipients}
                />
              </div>
              <Button
                type="button"
                onClick={addRecipient}
                disabled={recipients.length >= maxRecipients}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
              >
                Add
              </Button>
            </div>
          </div>

          {/* Optional name input toggle */}
          {!showNameInput && inputValue && (
            <button
              type="button"
              onClick={() => setShowNameInput(true)}
              className="text-sm text-white/50 hover:text-white/80 transition-colors"
            >
              + Add name (optional)
            </button>
          )}

          {/* Name input */}
          {showNameInput && (
            <div className="space-y-2">
              <Label className="text-sm text-white/70">Name (Optional)</Label>
              <Input
                type="text"
                placeholder="e.g., John Doe"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/30"
              />
            </div>
          )}

          {/* Error message */}
          {error && (
            <Alert className="bg-red-500/10 border-red-500/30">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400 text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Recipients list */}
      {recipients.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-white/70">Added Recipients</Label>
          <div className="flex flex-wrap gap-2">
            {recipients.map((recipient) => (
              <Badge
                key={recipient.id}
                variant="secondary"
                className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-white pl-3 pr-2 py-2 text-sm group hover:from-pink-500/30 hover:to-purple-500/30 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-pink-400" />
                  <span className="max-w-[200px] truncate">
                    {recipient.name ? (
                      <>
                        <span className="font-medium">{recipient.name}</span>
                        <span className="text-white/50 ml-1 text-xs">
                          ({recipient.value})
                        </span>
                      </>
                    ) : (
                      recipient.value
                    )}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => removeRecipient(recipient.id)}
                  className="ml-2 hover:bg-red-500/20 rounded-full p-0.5 transition-colors"
                  aria-label="Remove recipient"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Info message */}
      {recipients.length === 0 && (
        <div className="text-center py-6 text-white/40 text-sm">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Add up to {maxRecipients} recipients to share this capsule</p>
          <p className="text-xs mt-1">
            Unlock achievements: 5 recipients = Circle of Trust, 10 = Grand Broadcast
          </p>
        </div>
      )}

      {/* Limit reached message */}
      {recipients.length >= maxRecipients && (
        <Alert className="bg-purple-500/10 border-purple-500/30">
          <CheckCircle2 className="h-4 w-4 text-purple-400" />
          <AlertDescription className="text-purple-400 text-sm">
            Maximum recipients reached! You've unlocked the Grand Broadcast achievement 🎉
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
