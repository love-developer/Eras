/**
 * Echo Text Modal Component
 * Modal for writing text echoes with templates
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Send, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface EchoTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
}

const TEXT_TEMPLATES = [
  '❤️ This made my day! Thank you so much.',
  '🌟 What a beautiful memory. So grateful for this.',
  '😊 This brought the biggest smile to my face!',
  '🙏 Thank you for remembering. This means everything.',
  '✨ Absolutely perfect timing. Love this!',
  '💫 This is so special. Thank you for sharing.',
];

export const EchoTextModal: React.FC<EchoTextModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [text, setText] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const handleTemplateClick = (template: string) => {
    onSubmit(template);
    setText('');
    setIsCustom(false);
  };

  const handleCustomSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim());
      setText('');
      setIsCustom(false);
    }
  };

  const handleClose = () => {
    setText('');
    setIsCustom(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-700 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-violet-400" />
            Write an Echo
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Send a heartfelt note to let them know how this capsule made you feel
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {!isCustom ? (
            <>
              {/* Template options */}
              <div className="space-y-2">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">
                  Quick Messages
                </p>
                <div className="grid gap-2">
                  {TEXT_TEMPLATES.map((template, index) => (
                    <motion.button
                      key={index}
                      onClick={() => handleTemplateClick(template)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="text-left p-3 rounded-lg bg-slate-800/70 hover:bg-slate-700/70 border border-slate-700/50 hover:border-slate-600 transition-all text-sm text-slate-200"
                    >
                      {template}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Custom message button */}
              <div className="pt-4 border-t border-slate-700/50">
                <Button
                  onClick={() => setIsCustom(true)}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-200 hover:bg-slate-700/50"
                >
                  Write Custom Message
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Custom text area */}
              <div>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Write your heartfelt message here..."
                  maxLength={500}
                  rows={6}
                  className="bg-slate-800/70 border-slate-700 text-slate-100 placeholder:text-slate-500 resize-none focus:border-violet-500 focus:ring-violet-500/20"
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-2 text-right">
                  {text.length}/500 characters
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsCustom(false)}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-200 hover:bg-slate-700/50"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCustomSubmit}
                  disabled={!text.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Echo
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};