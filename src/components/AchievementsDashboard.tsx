import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Filter, SortDesc, Award, TrendingUp, X, Crown } from 'lucide-react';
import { AchievementBadge } from './AchievementBadge';
import { AchievementDetailModal } from './AchievementDetailModal';
import { AchievementUnlockModal } from './AchievementUnlockModal';
import { useAchievements } from '../hooks/useAchievements';
import { useAuth } from '../contexts/AuthContext';
import { Progress } from './ui/progress';
import { TitleDisplay } from './TitleDisplay';
import { useTitles } from '../contexts/TitlesContext';

export function AchievementsDashboard() {
  const { session } = useAuth();
  const { 
    achievements, 
    definitions, 
    userStats, 
    loading,
    fetchUserAchievements,
    fetchUserStats,
    fetchRarityPercentages
  } = useAchievements();
  
  const { titleProfile, availableTitles } = useTitles();

  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'rarity' | 'category'>('rarity'); // Default to rarity sort for 5x5 grid
  const [showProgress, setShowProgress] = useState(true);
  const [rarityPercentages, setRarityPercentages] = useState<Record<string, number>>({});

  // Load data on mount
  useEffect(() => {
    if (session?.access_token) {
      fetchUserAchievements(session.access_token);
      fetchUserStats(session.access_token);
      
      // Load rarity percentages
      fetchRarityPercentages().then(rarity => {
        console.log('🎯 Fetched rarity percentages:', rarity);
        console.log('🎯 Type:', typeof rarity, 'Keys:', rarity ? Object.keys(rarity) : 'null');
        if (rarity && Object.keys(rarity).length > 0) {
          setRarityPercentages(rarity);
          console.log('✅ Rarity percentages set:', Object.keys(rarity).length, 'achievements');
          // Log a few sample values
          const samples = Object.entries(rarity).slice(0, 3);
          console.log('📊 Sample percentages:', samples);
        } else {
          console.warn('⚠️ No rarity data returned from backend - empty object or null');
        }
      }).catch(error => {
        console.error('❌ Error fetching rarity percentages:', error);
      });
    }
  }, [session, fetchUserAchievements, fetchUserStats, fetchRarityPercentages]);

  // Get unlocked achievement IDs
  const unlockedIds = useMemo(() => 
    achievements.map(a => a.achievementId),
    [achievements]
  );

  // Calculate progress for locked achievements
  const getProgress = (achievement: any): number => {
    if (!userStats || !achievement.unlockCriteria.stat || !achievement.unlockCriteria.threshold) {
      return 0;
    }

    const stat = achievement.unlockCriteria.stat;
    const threshold = achievement.unlockCriteria.threshold;

    // Handle nested stats (e.g., "filter_usage.yesterday")
    const value = stat.split('.').reduce((obj: any, key: string) => obj?.[key], userStats) || 0;
    
    return Math.min(100, (value / threshold) * 100);
  };

  // Prepare achievement list with locked/unlocked status
  const achievementList = useMemo(() => {
    if (!definitions) return [];

    const list = Object.values(definitions).map((def: any) => {
      const isUnlocked = unlockedIds.includes(def.id);
      const unlockRecord = achievements.find(a => a.achievementId === def.id);
      const progress = isUnlocked ? 100 : getProgress(def);
      
      // Mark as "New" if unlocked within last 3 days
      const isNew = isUnlocked && unlockRecord?.unlockedAt 
        ? (Date.now() - new Date(unlockRecord.unlockedAt).getTime()) < 3 * 24 * 60 * 60 * 1000
        : false;

      return {
        ...def,
        isUnlocked,
        unlockedAt: unlockRecord?.unlockedAt,
        progress,
        isNew
      };
    });

    // Apply filter
    let filtered = list;
    if (filter === 'unlocked') {
      filtered = list.filter(a => a.isUnlocked);
    } else if (filter === 'locked') {
      filtered = list.filter(a => !a.isUnlocked);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'recent') {
        // Unlocked achievements by date, then locked by progress
        if (a.isUnlocked && b.isUnlocked) {
          return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
        }
        if (a.isUnlocked) return -1;
        if (b.isUnlocked) return 1;
        return b.progress - a.progress;
      } else if (sortBy === 'rarity') {
        // For rarity sort, group by rarity level first, then by order
        const rarityOrder: Record<string, number> = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
        const aRarity = rarityOrder[a.rarity?.toLowerCase()] || 0;
        const bRarity = rarityOrder[b.rarity?.toLowerCase()] || 0;
        const rarityDiff = aRarity - bRarity;
        
        // Debug logging
        if (filtered.indexOf(a) < 3) {
          console.log('Rarity sort:', {
            aId: a.id,
            aRarity: a.rarity,
            aOrder: aRarity,
            bId: b.id,
            bRarity: b.rarity,
            bOrder: bRarity,
            diff: rarityDiff
          });
        }
        
        if (rarityDiff !== 0) return rarityDiff;
        // Within same rarity, sort by order
        return (a.order || 0) - (b.order || 0);
      } else if (sortBy === 'category') {
        const aCategory = a.category || '';
        const bCategory = b.category || '';
        
        // Debug logging
        if (filtered.indexOf(a) < 3) {
          console.log('Category sort:', {
            aId: a.id,
            aCategory: aCategory,
            bId: b.id,
            bCategory: bCategory,
            compare: aCategory.localeCompare(bCategory)
          });
        }
        
        return aCategory.localeCompare(bCategory);
      }
      return 0;
    });

    return filtered;
  }, [definitions, unlockedIds, achievements, filter, sortBy, userStats]);

  // Calculate overall completion
  const totalAchievements = Object.keys(definitions || {}).length;
  const unlockedCount = achievements.length;
  const completionPercentage = totalAchievements > 0 
    ? Math.round((unlockedCount / totalAchievements) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-indigo-600 dark:text-indigo-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600 dark:text-slate-400 mb-2">Loading achievements...</p>
          <p className="text-xs text-slate-500 dark:text-slate-600">This should only take a moment</p>
        </div>
      </div>
    );
  }

  // Show error state if definitions failed to load
  if (!definitions || Object.keys(definitions).length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-center max-w-md">
          <Award className="w-16 h-16 text-orange-600 dark:text-orange-400 mx-auto mb-4" />
          <h2 className="text-2xl text-slate-900 dark:text-white mb-2">
            Achievement System Unavailable
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            We couldn't load the achievement definitions. This might be a temporary server issue.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-3">
              <Trophy className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
              <h1 className="text-4xl text-slate-900 dark:text-white">
                Achievements
              </h1>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 mb-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-3 sm:gap-0">
            <div className="text-center sm:text-left w-full sm:w-auto">
              <h2 className="text-2xl text-slate-900 dark:text-white">
                Overall Progress
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                {unlockedCount} of {totalAchievements} achievements unlocked
              </p>
            </div>
            <div className="text-center sm:text-right w-full sm:w-auto">
              <div className="text-4xl text-indigo-600 dark:text-indigo-400">
                {completionPercentage}%
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {userStats?.achievement_points || 0} points
              </div>
            </div>
          </div>
          
          <Progress value={completionPercentage} className="h-3" />
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 sm:p-4 text-center">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Capsules</div>
              <div className="text-2xl text-slate-900 dark:text-white">
                {userStats?.capsules_created || 0}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 sm:p-4 text-center">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Media</div>
              <div className="text-2xl text-slate-900 dark:text-white">
                {userStats?.media_uploaded || 0}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 sm:p-4 text-center">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Streak</div>
              <div className="text-2xl text-slate-900 dark:text-white whitespace-nowrap">
                {userStats?.current_streak || 0} days
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 sm:p-4 text-center">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1 truncate">Enhancements</div>
              <div className="text-2xl text-slate-900 dark:text-white">
                {userStats?.enhancements_used || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Sorting - Centered on Desktop */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 justify-center items-center">
          {/* Filter */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg p-2 shadow border border-slate-200 dark:border-slate-700 w-full sm:w-auto justify-center">
            <Filter className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0" />
            <button
              onClick={() => setFilter('all')}
              className={`px-3 sm:px-4 py-2 rounded-md transition-colors text-sm ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unlocked')}
              className={`px-3 sm:px-4 py-2 rounded-md transition-colors text-sm ${
                filter === 'unlocked'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Unlocked
            </button>
            <button
              onClick={() => setFilter('locked')}
              className={`px-3 sm:px-4 py-2 rounded-md transition-colors text-sm ${
                filter === 'locked'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Locked
            </button>
          </div>

          {/* Sort - with debug logging */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg p-2 shadow border border-slate-200 dark:border-slate-700 w-full sm:w-auto justify-center">
            <SortDesc className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0" />
            <button
              onClick={() => {
                console.log('Switching to Recent sort');
                setSortBy('recent');
              }}
              className={`px-2 sm:px-3 py-2 rounded-md transition-colors text-sm ${
                sortBy === 'recent'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => {
                console.log('Switching to Rarity sort');
                setSortBy('rarity');
              }}
              className={`px-2 sm:px-3 py-2 rounded-md transition-colors text-sm ${
                sortBy === 'rarity'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Rarity
            </button>
            <button
              onClick={() => {
                console.log('Switching to Category sort');
                setSortBy('category');
              }}
              className={`px-2 sm:px-3 py-2 rounded-md transition-colors text-sm ${
                sortBy === 'category'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Category
            </button>
          </div>

          {/* Show Progress Toggle */}
          <button
            onClick={() => setShowProgress(!showProgress)}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors w-full sm:w-auto"
          >
            <TrendingUp className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0" />
            <span className="text-slate-900 dark:text-white text-sm whitespace-nowrap">
              {showProgress ? 'Hide' : 'Show'} Progress
            </span>
          </button>
        </div>

        {/* Achievement Grid - Enhanced spacing with visual rhythm */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-5 sm:gap-6 lg:gap-x-8 lg:gap-y-10">
          {achievementList.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              locked={!achievement.isUnlocked}
              size="md"
              progress={showProgress ? achievement.progress : 0}
              rarityPercentage={rarityPercentages[achievement.id]}
              isNew={achievement.isNew} // NEW: Show "New" badge for recently unlocked
              unlockedAt={achievement.unlockedAt}
              onClick={() => setSelectedAchievement(achievement)}
            />
          ))}
        </div>

        {/* Empty State */}
        {achievementList.length === 0 && (
          <div className="text-center py-16">
            <Award className="w-16 h-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl text-slate-900 dark:text-white mb-2">
              No achievements found
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Try changing your filters
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal - Trophy Case for unlocked, detail view for locked */}
      {selectedAchievement && (
        selectedAchievement.isUnlocked ? (
          <AchievementUnlockModal
            achievement={selectedAchievement}
            isOpen={!!selectedAchievement}
            onClose={() => setSelectedAchievement(null)}
          />
        ) : (
          <AchievementDetailModal
            achievement={selectedAchievement}
            isOpen={!!selectedAchievement}
            onClose={() => setSelectedAchievement(null)}
            accessToken={session?.access_token}
            rarityPercentage={rarityPercentages[selectedAchievement.id]}
          />
        )
      )}
    </div>
  );
}