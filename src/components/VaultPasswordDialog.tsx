import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Lock, Unlock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useIsMobile } from './ui/use-mobile';
import { toast } from 'sonner';

interface VaultPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderName: string;
  onConfirm: (password: string) => void;
  isLoading?: boolean;
}

export function VaultPasswordDialog({
  open,
  onOpenChange,
  folderName,
  onConfirm,
  isLoading = false
}: VaultPasswordDialogProps) {
  const [password, setPassword] = useState('');
  const isMobile = useIsMobile();

  // Reset when dialog opens/closes
  useEffect(() => {
    if (open) {
      setPassword('');
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      onConfirm(password);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!open) return null;

  const portalContent = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop with vault-style cosmic blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9998]"
            onClick={() => onOpenChange(false)}
          />

          {/* Dialog Content */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 22,
                duration: 0.35
              }}
              className={`relative w-full pointer-events-auto ${
                isMobile ? 'max-w-md' : 'max-w-lg'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Vault-Style Cosmic Container */}
              <div className={`relative overflow-hidden ${
                isMobile ? 'rounded-2xl' : 'rounded-3xl'
              }`}>
                {/* Outer glow matching vault folders */}
                <div className={`absolute -inset-1 bg-gradient-to-br from-purple-500/40 via-red-500/40 to-orange-500/40 blur-2xl opacity-60 ${
                  isMobile ? 'rounded-2xl' : 'rounded-3xl'
                }`} />
                
                {/* Main card with vault folder styling */}
                <div className={`relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 backdrop-blur-2xl border-2 border-purple-500/40 shadow-2xl shadow-purple-900/60 ${
                  isMobile ? 'rounded-2xl' : 'rounded-3xl'
                }`}>
                  {/* Cosmic Background Effects */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-600/15 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Floating close button */}
                  <button
                    onClick={() => onOpenChange(false)}
                    className={`absolute z-10 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-600/50 text-slate-300 hover:text-white transition-all group shadow-lg ${
                      isMobile ? 'top-3 right-3 p-2' : 'top-5 right-5 p-2.5'
                    }`}
                    aria-label="Close dialog"
                  >
                    <X className={`group-hover:rotate-90 transition-transform duration-300 ${
                      isMobile ? 'w-4 h-4' : 'w-5 h-5'
                    }`} />
                  </button>

                  <div className={isMobile ? 'relative p-5' : 'relative p-8 sm:p-10'}>
                    {/* Icon and Title Section */}
                    <div className={`flex items-start mb-6 ${
                      isMobile ? 'gap-3' : 'gap-5 mb-8'
                    }`}>
                      <div className="relative flex-shrink-0">
                        <div className={`absolute inset-0 bg-gradient-to-br from-purple-500/40 to-red-500/40 blur-2xl ${
                          isMobile ? 'rounded-xl' : 'rounded-2xl'
                        }`} />
                        <div className={`relative bg-gradient-to-br from-purple-600/30 via-red-600/30 to-orange-600/30 border-2 border-purple-400/40 shadow-xl backdrop-blur-sm ${
                          isMobile ? 'p-3 rounded-xl' : 'p-5 rounded-2xl'
                        }`}>
                          <Lock className={`text-purple-200 ${
                            isMobile ? 'w-6 h-6' : 'w-8 h-8'
                          }`} strokeWidth={2.5} />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-10">
                        <h2 className={`font-bold bg-gradient-to-r from-purple-200 via-red-200 to-orange-200 bg-clip-text text-transparent leading-tight ${
                          isMobile ? 'text-xl mb-1' : 'text-2xl sm:text-3xl mb-2'
                        }`}>
                          Protected Folder
                        </h2>
                        <p className={`text-slate-400 ${
                          isMobile ? 'text-xs' : 'text-sm'
                        }`}>
                          Enter password to access "{folderName}"
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className={isMobile ? 'space-y-5' : 'space-y-7'}>
                      {/* Password Input */}
                      <div className="space-y-3">
                        <Label htmlFor="folder-password" className={`font-semibold text-slate-200 flex items-center gap-2 ${
                          isMobile ? 'text-xs' : 'text-sm'
                        }`}>
                          <Lock className="w-4 h-4 text-purple-400" />
                          Password
                        </Label>
                        <div className="relative group">
                          <Input
                            id="folder-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter folder password"
                            className={`bg-slate-800/80 border-2 border-slate-700/80 focus:border-purple-500/80 focus:ring-4 focus:ring-purple-500/20 text-white placeholder:text-slate-500 rounded-xl transition-all shadow-inner ${
                              isMobile ? 'pl-4 h-12 text-sm' : 'pl-4 h-14'
                            }`}
                            autoFocus
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className={`flex gap-3 ${isMobile ? 'pt-4' : 'pt-6'}`}>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => onOpenChange(false)}
                          disabled={isLoading}
                          className={`flex-1 border-2 border-slate-700 bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-all rounded-xl font-semibold shadow-lg ${
                            isMobile ? 'h-11 text-sm' : 'h-12'
                          }`}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={!password || isLoading}
                          className={`flex-1 bg-gradient-to-r from-purple-600 via-red-600 to-orange-600 hover:from-purple-500 hover:via-red-500 hover:to-orange-500 text-white border-0 shadow-xl shadow-purple-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold ${
                            isMobile ? 'h-11 text-sm' : 'h-12'
                          }`}
                        >
                          {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className={`border-3 border-white/30 border-t-white rounded-full animate-spin ${
                                isMobile ? 'w-4 h-4' : 'w-5 h-5'
                              }`} />
                              <span>Unlocking...</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <Unlock className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
                              <span>Unlock Folder</span>
                            </div>
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(portalContent, document.body);
}
