/**
 * Dashboard Stats Component
 * 
 * Shows statistics view (moved from Home tab to hamburger menu)
 * This is the old Dashboard component content, now accessible via menu
 */

import React from 'react';
import { Dashboard } from './Dashboard';

interface DashboardStatsProps {
  onEditCapsule?: (capsuleId: string) => void;
  onEditCapsuleDetails?: (capsuleId: string) => void;
  onCreateCapsule?: () => void;
  onNavigateToAchievements?: () => void;
  onBackToFeed?: () => void;
}

export function DashboardStats({
  onEditCapsule,
  onEditCapsuleDetails,
  onCreateCapsule,
  onNavigateToAchievements,
  onBackToFeed
}: DashboardStatsProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/60 via-blue-50/50 to-pink-50/60 dark:from-purple-950/30 dark:via-blue-950/25 dark:to-pink-950/30">
      {/* Back Button */}
      {onBackToFeed && (
        <div className="max-w-7xl mx-auto px-4 pt-6 pb-4">
          <button
            onClick={onBackToFeed}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back to Feed</span>
          </button>
        </div>
      )}

      {/* Dashboard Component */}
      <Dashboard
        onEditCapsule={onEditCapsule}
        onEditCapsuleDetails={onEditCapsuleDetails}
        onCreateCapsule={onCreateCapsule}
        onNavigateToAchievements={onNavigateToAchievements}
      />
    </div>
  );
}
