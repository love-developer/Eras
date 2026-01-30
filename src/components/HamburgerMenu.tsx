/**
 * Hamburger Menu Component
 * 
 * Slide-out drawer containing:
 * - User profile
 * - Dashboard (stats moved from Home tab)
 * - Achievements
 * - Legacy Vault access
 * - Settings
 * - Sign out
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Home, BarChart3, Award, Vault, Settings as SettingsIcon, LogOut, User } from 'lucide-react';
import { Dashboard } from './Dashboard';

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onEditCapsule?: (capsule: any) => void;
  onEditCapsuleDetails?: (capsule: any) => void;
  onCreateCapsule?: () => void;
  onNavigateToAchievements?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToVault?: () => void;
  onSignOut?: () => void;
  dashboardRefreshKey?: number;
  initialViewingCapsuleId?: string | null;
  showDashboard?: boolean; // Control whether to show full dashboard or just menu items
  onCloseOverlays?: () => void; // NEW: Callback to close any open overlays (capsule portal, etc.)
}

export function HamburgerMenu({
  isOpen,
  onClose,
  user,
  onEditCapsule,
  onEditCapsuleDetails,
  onCreateCapsule,
  onNavigateToAchievements,
  onNavigateToSettings,
  onNavigateToVault,
  onSignOut,
  dashboardRefreshKey = 0,
  initialViewingCapsuleId = null,
  showDashboard = true,
  onCloseOverlays
}: HamburgerMenuProps) {
  
  // Prevent scroll when menu is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-full sm:w-96 bg-white dark:bg-slate-900 shadow-2xl z-[101] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-b border-slate-200 dark:border-slate-700 p-4 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800 dark:text-slate-200">
                      {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User'}
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {user?.email || ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
              {/* Show full Dashboard if requested */}
              {showDashboard && (
                <div className="space-y-3">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    Dashboard
                  </h3>
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <Dashboard
                      key={dashboardRefreshKey}
                      onEditCapsule={onEditCapsule}
                      onEditCapsuleDetails={onEditCapsuleDetails}
                      onCreateCapsule={onCreateCapsule}
                      onNavigateToAchievements={onNavigateToAchievements}
                      user={user}
                      initialViewingCapsuleId={initialViewingCapsuleId}
                      onCloseHamburgerMenu={onClose}
                      onCloseOverlays={onCloseOverlays}
                    />
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              {!showDashboard && (
                <div className="space-y-2">
                  <h3 className="font-bold text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 mb-3">
                    Menu
                  </h3>

                  <button
                    onClick={() => {
                      onClose();
                      // Already on home
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                  >
                    <Home className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                      Dashboard
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToAchievements?.();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                  >
                    <Award className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                      Achievements & Titles
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToVault?.();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                  >
                    <Vault className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                      Legacy Vault
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToSettings?.();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                  >
                    <SettingsIcon className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                      Settings
                    </span>
                  </button>
                </div>
              )}

              {/* Sign Out */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    onClose();
                    onSignOut?.();
                    onCloseOverlays?.(); // Close any open overlays
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors group"
                >
                  <LogOut className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors">
                    Sign Out
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}