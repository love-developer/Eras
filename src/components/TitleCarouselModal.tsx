import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sunrise } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HorizonGallery } from './HorizonGallery';
import { useTitles } from '../contexts/TitlesContext';

interface TitleCarouselModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 🌅 HORIZON GALLERY MODAL
 * 
 * Full-screen immersive title selector with:
 * - Live HeaderBackground gradient preview
 * - Titles grouped by rarity tiers
 * - Activate/Deactivate terminology (Horizon theme)
 * - Sunrise/Sunset animations
 */
export function TitleCarouselModal({ isOpen, onClose }: TitleCarouselModalProps) {
  const { availableTitles, equipTitle, equipping, refresh, loading } = useTitles();

  // 🔄 Refresh titles when modal opens to ensure latest data
  // CRITICAL FIX: Only depend on isOpen to prevent infinite re-fetching loop
  // Do NOT include refresh, loading, or availableTitles as dependencies
  useEffect(() => {
    if (isOpen) {
      console.log('🔄 [Horizon Gallery] Modal opened - refreshing titles');
      console.log('📊 [Horizon Gallery] Current state:', { 
        loading, 
        hasAvailableTitles: !!availableTitles,
        titlesCount: availableTitles?.titles?.length || 0 
      });
      refresh();
    }
  }, [isOpen]); // Only re-run when modal opens/closes, not when data changes

  // Auto-close after activating or deactivating
  const handleActivateWithClose = async (achievementId: string | null) => {
    await equipTitle(achievementId);
    // Wait for animation to complete, then close
    setTimeout(() => {
      onClose();
    }, achievementId === null ? 1500 : 3000); // Shorter delay for deactivate, full animation for activate
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ 
              type: 'spring', 
              damping: 30, 
              stiffness: 300,
              opacity: { duration: 0.3 }
            }}
            className="relative w-full max-w-6xl max-h-[90vh] overflow-hidden"
          >
            {/* Card */}
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-purple-800/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-900/50 relative z-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
                    <Sunrise className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                      Horizon Gallery
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                      Activate your Legacy Titles to showcase your achievements
                    </p>
                  </div>
                </div>
                
                {/* Close Button - Enhanced visibility */}
                <button
                  onClick={onClose}
                  className="p-2.5 hover:bg-slate-700/70 rounded-xl transition-all group ring-2 ring-slate-600/30 hover:ring-slate-500/50 relative z-50"
                  aria-label="Close Horizon Gallery"
                >
                  <X className="w-6 h-6 text-slate-300 group-hover:text-white transition-colors" />
                </button>
              </div>

              {/* Gallery - Clipped container to prevent content bleeding into header */}
              <div className="flex-1 overflow-hidden relative z-0" style={{ isolation: 'isolate' }}>
                {/* ✅ FIX: Show loading state while titles are being fetched */}
                {loading && (!availableTitles || !availableTitles.titles || availableTitles.titles.length === 0) ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="text-purple-400"
                    >
                      <Sunrise className="w-12 h-12" />
                    </motion.div>
                    <p className="text-slate-400 text-lg">Loading your horizons...</p>
                  </div>
                ) : (
                  <HorizonGallery
                    titles={availableTitles?.titles || []}
                    equippedAchievementId={availableTitles?.equippedAchievementId || null}
                    onActivate={handleActivateWithClose}
                    activating={equipping}
                  />
                )}
              </div>
            </div>

            {/* Decorative glow */}
            <div 
              className="absolute -inset-1 rounded-2xl -z-10 opacity-50"
              style={{
                background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(236, 72, 153, 0.3), rgba(147, 51, 234, 0.3))',
                filter: 'blur(20px)'
              }}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}