import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Folder, FolderPlus, Edit3, Sparkles, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useIsMobile } from './ui/use-mobile';

// REMOVED: Switch, Lock, Unlock

interface VaultFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'rename';
  initialName?: string;
  initialColor?: string;
  initialIsPrivate?: boolean;
  initialIcon?: string; // NEW: Preserve original icon when renaming
  onConfirm: (name: string, color?: string, icon?: string, isPrivate?: boolean, password?: string) => void;
  isLoading?: boolean;
}

// EXCLUSIVE NEW FOLDER ICONS - Totally different from Template icons
// These are specific to common use cases for custom user folders
const FOLDER_COLORS = [
  { 
    name: ['Personal', 'Projects'], 
    displayName: 'Personal Projects', 
    value: 'blue', 
    gradient: 'from-blue-500 via-blue-600 to-cyan-600', 
    ring: 'ring-blue-400', 
    icon: '🎯' 
  },
  { 
    name: ['Creative', 'Work'], 
    displayName: 'Creative Work', 
    value: 'purple', 
    gradient: 'from-purple-500 via-purple-600 to-fuchsia-600', 
    ring: 'ring-purple-400', 
    icon: '🎨' 
  },
  { 
    name: ['Celebrations'], 
    displayName: 'Celebrations', 
    value: 'pink', 
    gradient: 'from-pink-500 via-pink-600 to-rose-600', 
    ring: 'ring-pink-400', 
    icon: '🎉' 
  },
  { 
    name: ['Nature', '& Travel'], 
    displayName: 'Nature & Travel', 
    value: 'green', 
    gradient: 'from-green-500 via-emerald-600 to-teal-600', 
    ring: 'ring-green-400', 
    icon: '🌍' 
  },
  { 
    name: ['Learning', '& Courses'], 
    displayName: 'Learning & Courses', 
    value: 'yellow', 
    gradient: 'from-yellow-500 via-amber-500 to-orange-500', 
    ring: 'ring-yellow-400', 
    icon: '📚' 
  },
  { 
    name: ['Fitness', '& Health'], 
    displayName: 'Fitness & Health', 
    value: 'orange', 
    gradient: 'from-orange-500 via-orange-600 to-red-600', 
    ring: 'ring-orange-400', 
    icon: '💪' 
  },
  { 
    name: ['Collections'], 
    displayName: 'Collections', 
    value: 'red', 
    gradient: 'from-red-500 via-red-600 to-pink-600', 
    ring: 'ring-red-400', 
    icon: '⭐' 
  },
  { 
    name: ['Archive'], 
    displayName: 'Archive', 
    value: 'slate', 
    gradient: 'from-slate-500 via-slate-600 to-gray-600', 
    ring: 'ring-slate-400', 
    icon: '📦' 
  },
];

export function VaultFolderDialog({
  open,
  onOpenChange,
  mode,
  initialName = '',
  initialColor = 'blue',
  initialIsPrivate = false,
  initialIcon, // NEW: Preserve original icon when renaming
  onConfirm,
  isLoading = false
}: VaultFolderDialogProps) {
  const [folderName, setFolderName] = useState(initialName);
  const [folderColor, setFolderColor] = useState(initialColor);
  // REMOVED: isPrivate, password, confirmPassword - no longer needed with Legacy Access
  const isMobile = useIsMobile();

  // Reset when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFolderName(initialName);
      setFolderColor(initialColor);
    }
  }, [open, initialName, initialColor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderName.trim()) {
      // When renaming, preserve the original icon instead of using the color-based icon
      const iconToUse = mode === 'rename' && initialIcon ? initialIcon : selectedColorData.icon;
      // REMOVED: isPrivate and password parameters - no longer needed with Legacy Access
      onConfirm(folderName.trim(), folderColor, iconToUse, false, '');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const selectedColorData = FOLDER_COLORS.find(c => c.value === folderColor) || FOLDER_COLORS[0];

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
                isMobile ? 'max-w-md' : 'max-w-2xl'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Vault-Style Cosmic Container */}
              <div className={`relative overflow-hidden ${
                isMobile ? 'rounded-2xl' : 'rounded-3xl'
              }`}>
                {/* Outer glow matching vault folders */}
                          <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/40 via-purple-500/40 to-pink-500/40 blur-2xl opacity-60 ${
                  isMobile ? 'rounded-2xl' : 'rounded-3xl'
                }`} />
                
                {/* Main card with vault folder styling */}
                <div className={`relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 backdrop-blur-2xl border-2 border-purple-500/40 shadow-2xl shadow-purple-900/60 ${
                  isMobile ? 'rounded-2xl' : 'rounded-3xl'
                }`}>
                  {/* Cosmic Background Effects */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-600/15 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
                  
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
                      {mode === 'create' ? (
                        <div className="relative flex-shrink-0">
                          <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/40 to-purple-500/40 blur-2xl ${
                            isMobile ? 'rounded-xl' : 'rounded-2xl'
                          }`} />
                          <div className={`relative bg-gradient-to-br from-blue-600/30 via-purple-600/30 to-pink-600/30 border-blue-400/40 border-2 shadow-xl backdrop-blur-sm ${
                            isMobile ? 'p-3 rounded-xl' : 'p-5 rounded-2xl'
                          }`}>
                            <FolderPlus className={`text-blue-200 ${
                              isMobile ? 'w-6 h-6' : 'w-8 h-8'
                            }`} strokeWidth={2.5} />
                          </div>
                        </div>
                      ) : (
                        <div className="relative flex-shrink-0">
                          <div className={`absolute inset-0 bg-gradient-to-br from-amber-500/40 to-orange-500/40 blur-2xl ${
                            isMobile ? 'rounded-xl' : 'rounded-2xl'
                          }`} />
                          <div className={`relative bg-gradient-to-br from-amber-600/30 via-orange-600/30 to-red-600/30 border-2 border-amber-400/40 shadow-xl backdrop-blur-sm ${
                            isMobile ? 'p-3 rounded-xl' : 'p-5 rounded-2xl'
                          }`}>
                            <Edit3 className={`text-amber-200 ${
                              isMobile ? 'w-6 h-6' : 'w-8 h-8'
                            }`} strokeWidth={2.5} />
                          </div>
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0 pr-10">
                        <h2 className={`font-bold bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent leading-tight ${
                          isMobile ? 'text-xl mb-1' : 'text-2xl sm:text-3xl mb-2'
                        }`}>
                          {mode === 'create' ? 'Create New Folder' : 'Rename Folder'}
                        </h2>
                        <p className={`text-slate-400 ${
                          isMobile ? 'text-xs' : 'text-sm'
                        }`}>
                          {mode === 'create' 
                            ? 'Organize your memories' 
                            : 'Update folder details'
                          }
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className={isMobile ? 'space-y-5' : 'space-y-7'}>
                      {/* Folder Name Input */}
                      <div className="space-y-3">
                        <Label htmlFor="folder-name" className={`font-semibold text-slate-200 flex items-center gap-2 ${
                          isMobile ? 'text-xs' : 'text-sm'
                        }`}>
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          Folder Name
                        </Label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                            <Folder className={`text-slate-400 group-focus-within:text-purple-400 transition-colors duration-200 ${
                              isMobile ? 'w-4 h-4' : 'w-5 h-5'
                            }`} />
                          </div>
                          <Input
                            id="folder-name"
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={isMobile ? 'e.g., Summer 2024' : 'e.g., Summer Adventures, Wedding Memories, Recipes'}
                            className={`bg-slate-800/80 border-2 border-slate-700/80 focus:border-purple-500/80 focus:ring-4 focus:ring-purple-500/20 text-white placeholder:text-slate-500 rounded-xl transition-all shadow-inner ${
                              isMobile ? 'pl-10 pr-16 h-12 text-sm' : 'pl-12 pr-20 h-14'
                            }`}
                            autoFocus
                            disabled={isLoading}
                            maxLength={50}
                          />
                          <div className={`absolute right-3 top-1/2 -translate-y-1/2 font-semibold tabular-nums transition-colors ${
                            isMobile ? 'text-[10px]' : 'text-xs'
                          } ${ 
                            folderName.length > 45 
                              ? 'text-amber-400' 
                              : folderName.length > 35
                              ? 'text-yellow-500'
                              : folderName.length > 0
                              ? 'text-purple-400/60'
                              : 'text-slate-600'
                          }`}>
                            {folderName.length}/50
                          </div>
                        </div>
                      </div>

                      {/* Color/Theme Picker - MOBILE vs DESKTOP */}
                      <div className={isMobile ? 'space-y-3' : 'space-y-4'}>
                        <div className="flex items-center justify-between">
                          <Label className={`font-semibold text-slate-200 flex items-center gap-2 ${
                            isMobile ? 'text-xs' : 'text-sm'
                          }`}>
                            <div className={`rounded-full bg-gradient-to-br ${selectedColorData.gradient} shadow-xl ring-2 ring-white/30 ${
                              isMobile ? 'w-3 h-3' : 'w-4 h-4'
                            }`} />
                            {isMobile ? 'Theme' : 'Folder Theme'}
                          </Label>
                          <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/50 ${
                            isMobile ? 'text-[10px]' : 'text-xs px-3 py-1.5'
                          }`}>
                            <span className={isMobile ? 'text-lg leading-none' : 'text-2xl leading-none'}>{selectedColorData.icon}</span>
                            {!isMobile && <span className="text-slate-300 font-medium">{selectedColorData.displayName}</span>}
                          </div>
                        </div>
                        
                        {/* UNIFIED GRID - Same 4-column layout for mobile and desktop, just scaled */}
                        <div className={`grid grid-cols-3 ${isMobile ? 'gap-2' : 'gap-3'}`}>
                          {FOLDER_COLORS.map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => setFolderColor(color.value)}
                              disabled={isLoading}
                              className={`
                                group relative aspect-square rounded-2xl transition-all duration-300 transform overflow-hidden
                                ${folderColor === color.value 
                                  ? `ring-4 ${color.ring} ${isMobile ? 'ring-offset-2' : 'ring-offset-4'} ring-offset-slate-950 scale-105 shadow-2xl` 
                                  : `${isMobile ? 'hover:scale-105' : 'hover:scale-[1.08]'} shadow-xl hover:shadow-2xl border-2 border-slate-700/60 hover:border-slate-600`
                                }
                                disabled:opacity-40 disabled:cursor-not-allowed
                              `}
                              title={color.displayName}
                            >
                              {/* Folder gradient background */}
                              <div className={`absolute inset-0 bg-gradient-to-br ${color.gradient}`} />
                              
                              {/* Shimmer overlay on hover */}
                              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              
                              {/* Centered content: icon + text with spacing */}
                              <div className="absolute inset-0 flex flex-col items-center justify-start px-1 -mt-2.5">
                                {folderColor === color.value ? (
                                  <>
                                    <div className="flex items-center justify-center mb-0.5">
                                      <motion.div 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className={`rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center border-3 border-white shadow-2xl ${
                                          color.name.length > 1
                                            ? (isMobile ? 'w-6 h-6' : 'w-9 h-9')
                                            : (isMobile ? 'w-8 h-8' : 'w-12 h-12')
                                        }`}
                                      >
                                        <Check className={`text-white font-bold ${
                                          color.name.length > 1
                                            ? (isMobile ? 'w-3.5 h-3.5' : 'w-5 h-5')
                                            : (isMobile ? 'w-5 h-5' : 'w-7 h-7')
                                        }`} strokeWidth={3.5} />
                                      </motion.div>
                                    </div>
                                    <div className={`text-center ${color.name.length > 1 ? 'leading-[1.1]' : 'leading-tight'}`}>
                                      {color.name.map((line, idx) => (
                                        <div 
                                          key={idx}
                                          className={`font-bold text-white uppercase tracking-wide drop-shadow-lg ${
                                            isMobile ? 'text-[8px]' : 'text-xs'
                                          }`}
                                        >
                                          {line}
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className={`opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200 drop-shadow-lg mb-0.5 ${
                                      color.name.length > 1 
                                        ? (isMobile ? 'text-2xl' : 'text-3xl')
                                        : (isMobile ? 'text-3xl' : 'text-4xl')
                                    }`}>
                                      {color.icon}
                                    </div>
                                    <div className={`text-center ${color.name.length > 1 ? 'leading-[1.1]' : 'leading-tight'}`}>
                                      {color.name.map((line, idx) => (
                                        <div 
                                          key={idx}
                                          className={`font-bold text-slate-300 group-hover:text-white uppercase tracking-wide ${
                                            isMobile ? 'text-[8px]' : 'text-xs'
                                          }`}
                                        >
                                          {line}
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                        
                        {/* Helper text */}
                        {!isMobile && (
                          <p className="text-xs text-slate-500 text-center pt-1">
                            Choose a theme that matches your folder's purpose
                          </p>
                        )}
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
                          disabled={!folderName.trim() || isLoading}
                          className={`flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white border-0 shadow-xl shadow-purple-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold ${
                            isMobile ? 'h-11 text-sm' : 'h-12'
                          }`}
                        >
                          {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className={`border-3 border-white/30 border-t-white rounded-full animate-spin ${
                                isMobile ? 'w-4 h-4' : 'w-5 h-5'
                              }`} />
                              <span>{mode === 'create' ? 'Creating...' : 'Saving...'}</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              {mode === 'create' ? (
                                <FolderPlus className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
                              ) : (
                                <Check className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
                              )}
                              <span>{mode === 'create' ? 'Create' : 'Save'}</span>
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