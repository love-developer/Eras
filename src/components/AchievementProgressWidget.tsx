import React, { useEffect, useState } from 'react';
import { Trophy, ChevronRight, Star } from 'lucide-react';
import { useAchievements } from '../hooks/useAchievements';
import { useAuth } from '../contexts/AuthContext';
import { Progress } from './ui/progress';
import { AchievementBadge } from './AchievementBadge';

interface AchievementProgressWidgetProps {
  onNavigate?: () => void;
}

export function AchievementProgressWidget({ onNavigate }: AchievementProgressWidgetProps) {
  const { session } = useAuth();
  const { 
    achievements, 
    definitions, 
    userStats, 
    fetchUserAchievements, 
    fetchUserStats 
  } = useAchievements();

  useEffect(() => {
    if (session?.access_token) {
      fetchUserAchievements(session.access_token);
      fetchUserStats(session.access_token);
    }
  }, [session, fetchUserAchievements, fetchUserStats]);

  const totalAchievements = Object.keys(definitions || {}).length;
  const unlockedCount = achievements.length;
  const completionPercentage = totalAchievements > 0 
    ? Math.round((unlockedCount / totalAchievements) * 100)
    : 0;

  // Get recently unlocked achievements (up to 3)
  const recentlyUnlocked = [...achievements]
    .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
    .slice(0, 3)
    .map(a => definitions?.[a.achievementId])
    .filter(Boolean);

  if (totalAchievements === 0) return null;

  return (
    <div 
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-xl transition-shadow"
      onClick={onNavigate}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <Trophy className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg text-slate-900 dark:text-white">
              Achievements
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {unlockedCount} of {totalAchievements} unlocked
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400" />
      </div>

      {/* Progress Circle */}
      <div className="flex items-center justify-between gap-4 sm:gap-6 mb-6">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
          {/* Background circle */}
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-slate-200 dark:text-slate-700"
            />
            <circle
              cx="50%"
              cy="50%"
              r="40"
              stroke="url(#progress-gradient)"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${completionPercentage * 2.51} 251`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
            <defs>
              <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl sm:text-2xl text-slate-900 dark:text-white">
              {completionPercentage}%
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">Points</span>
            <span className="text-slate-900 dark:text-white">
              {userStats?.achievement_points || 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">Rarest</span>
            <span className="flex items-center gap-1 text-slate-900 dark:text-white capitalize">
              {userStats?.rarest_achievement ? (
                <>
                  <Star className="w-3 h-3 text-purple-500" />
                  {definitions?.[userStats.rarest_achievement]?.rarity || 'None'}
                </>
              ) : (
                'None'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Recently Unlocked */}
      {recentlyUnlocked.length > 0 && (
        <div>
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            Recently Unlocked
          </div>
          <div className="flex gap-4 justify-center">
            {recentlyUnlocked.map((achievement) => (
              <div key={achievement.id} className="flex flex-col items-center">
                <AchievementBadge
                  achievement={achievement}
                  size="sm"
                  locked={false}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View All Link */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <button className="w-full text-center text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
          View All Achievements →
        </button>
      </div>
    </div>
  );
}
