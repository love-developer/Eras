import React, { useState } from 'react';
import { Trophy, Play, Sparkles } from 'lucide-react';
import { AchievementUnlockModal } from './AchievementUnlockModal';

/**
 * 🏆 Achievement Unlock Admin Preview Tool
 * 
 * Allows testing achievement unlock animations with all rarities
 * Shows the spectacular animations for each rarity level
 */

interface PreviewAchievement {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  icon: string;
  category: string;
  animationDescription: string;
}

const previewAchievements: PreviewAchievement[] = [
  {
    id: 'preview_common',
    name: 'First Steps',
    description: 'Create your first time capsule',
    rarity: 'common',
    icon: '🌱',
    category: 'Getting Started',
    animationDescription: 'Gentle circular bloom animation'
  },
  {
    id: 'preview_uncommon',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    rarity: 'uncommon',
    icon: '📅',
    category: 'Consistency',
    animationDescription: 'Hexagonal wave spread pattern'
  },
  {
    id: 'preview_rare',
    name: 'Memory Keeper',
    description: 'Store 25 precious memories',
    rarity: 'rare',
    icon: '💎',
    category: 'Collection',
    animationDescription: '12-point star explosion with light rays'
  },
  {
    id: 'preview_epic',
    name: 'Time Master',
    description: 'Create capsules across all time zones',
    rarity: 'epic',
    icon: '⏰',
    category: 'Expertise',
    animationDescription: 'Octagonal power beams + screen shake'
  },
  {
    id: 'preview_legendary',
    name: 'Eternal Chronicler',
    description: 'Reach the pinnacle of time capsule mastery',
    rarity: 'legendary',
    icon: '👑',
    category: 'Mastery',
    animationDescription: 'PRISMATIC SUPERNOVA + Eclipse orbital'
  }
];

export function AchievementUnlockAdminPreview() {
  const [showModal, setShowModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<PreviewAchievement | null>(null);

  const handlePreview = (achievement: PreviewAchievement) => {
    console.log('🏆 [Admin Preview] Starting preview for:', achievement.name, achievement.rarity);
    setSelectedAchievement(achievement);
    setShowModal(true);
  };

  const handleClose = () => {
    console.log('🏆 [Admin Preview] Closing preview');
    setShowModal(false);
    // Delay clearing selectedAchievement to allow exit animation
    setTimeout(() => setSelectedAchievement(null), 300);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Achievement Unlock Preview
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Test achievement unlock animations for all rarity levels
          </p>
        </div>
      </div>

      {/* Preview Grid */}
      <div className="grid gap-3">
        {previewAchievements.map((achievement, index) => {
          // Rarity colors
          const rarityConfig = {
            common: {
              gradient: 'from-slate-500 to-slate-600',
              border: 'border-slate-400/30',
              glow: 'hover:shadow-slate-400/20',
              badge: '⚪'
            },
            uncommon: {
              gradient: 'from-emerald-500 to-green-600',
              border: 'border-emerald-400/30',
              glow: 'hover:shadow-emerald-400/30',
              badge: '🟢'
            },
            rare: {
              gradient: 'from-purple-500 to-violet-600',
              border: 'border-purple-400/30',
              glow: 'hover:shadow-purple-400/40',
              badge: '🟣'
            },
            epic: {
              gradient: 'from-amber-500 to-yellow-600',
              border: 'border-amber-400/30',
              glow: 'hover:shadow-amber-400/50',
              badge: '🟡'
            },
            legendary: {
              gradient: 'from-rose-500 via-pink-500 to-purple-500',
              border: 'border-pink-400/40',
              glow: 'hover:shadow-pink-400/60 hover:shadow-lg',
              badge: '🌈'
            }
          }[achievement.rarity];

          return (
            <button
              key={index}
              onClick={() => handlePreview(achievement)}
              className={`group relative flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border ${rarityConfig.border} ${rarityConfig.glow} hover:scale-[1.02] transition-all duration-200 text-left`}
            >
              {/* Icon Badge */}
              <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${rarityConfig.gradient} flex items-center justify-center shadow-lg text-2xl`}>
                {achievement.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{rarityConfig.badge}</span>
                  <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                    {achievement.name}
                  </h4>
                  <span className={`ml-auto px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-gradient-to-r ${rarityConfig.gradient} text-white`}>
                    {achievement.rarity}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-1">
                  {achievement.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                  {achievement.animationDescription}
                </p>
              </div>

              {/* Play Icon */}
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${rarityConfig.gradient} flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg`}>
                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                </div>
              </div>

              {/* Sparkle indicator for legendary */}
              {achievement.rarity === 'legendary' && (
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="w-5 h-5 text-pink-500 drop-shadow-lg animate-pulse" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Enhancement Note */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
              ✨ Achievement Animations
            </p>
            <ul className="space-y-1 text-yellow-700 dark:text-yellow-300 text-xs">
              <li>• <strong>Common:</strong> Gentle bloom with dual colors (80 particles)</li>
              <li>• <strong>Uncommon:</strong> Hexagonal waves with extra color (120 particles)</li>
              <li>• <strong>Rare:</strong> Star burst + 4 light rays (150 particles)</li>
              <li>• <strong>Epic:</strong> Octagonal power beams + screen shake (200 particles)</li>
              <li>• <strong>Legendary:</strong> Prismatic supernova + dual eclipse rings + heavy shake (250+ particles!) 🎆</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedAchievement && (
        <AchievementUnlockModal
          achievement={{
            id: selectedAchievement.id,
            title: selectedAchievement.name,
            description: selectedAchievement.description,
            icon: 'Trophy',
            rarity: selectedAchievement.rarity,
            category: selectedAchievement.category,
            rewards: {
              points: selectedAchievement.rarity === 'common' ? 10 
                : selectedAchievement.rarity === 'uncommon' ? 25 
                : selectedAchievement.rarity === 'rare' ? 50 
                : selectedAchievement.rarity === 'epic' ? 100 
                : 200,
              title: selectedAchievement.rarity === 'legendary' ? 'Grand Master' 
                : selectedAchievement.rarity === 'epic' ? 'Elite Champion'
                : undefined
            },
            unlockedBy: 0,
            percentage: 0
          }}
          isOpen={showModal}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
