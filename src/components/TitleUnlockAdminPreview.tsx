import React, { useState } from 'react';
import { Crown, Play, Sparkles } from 'lucide-react';
import { TitleRewardModalEnhanced } from './TitleRewardModalEnhanced';

/**
 * 👑 Title Unlock Admin Preview Tool
 * 
 * Allows testing the ENHANCED title unlock sequences with all rarities
 * Shows the spectacular new animations for each rarity level
 */

interface PreviewTitle {
  title: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  achievementName: string;
  description: string;
}

const previewTitles: PreviewTitle[] = [
  {
    title: 'Time Novice',
    rarity: 'common',
    achievementName: 'First Step',
    description: 'Gentle circular bloom animation'
  },
  {
    title: 'Golden Hour Guardian',
    rarity: 'uncommon',
    achievementName: 'Yesterday',
    description: 'Hexagonal wave spread pattern'
  },
  {
    title: 'Midnight Chronicler',
    rarity: 'rare',
    achievementName: 'Night Owl',
    description: '12-point star explosion with light rays'
  },
  {
    title: 'Archive Master',
    rarity: 'epic',
    achievementName: 'Grand Historian',
    description: 'Octagonal power beams + screen shake'
  },
  {
    title: 'Time Lord',
    rarity: 'legendary',
    achievementName: 'Master of Time',
    description: 'PRISMATIC SUPERNOVA + Eclipse orbital'
  }
];

export function TitleUnlockAdminPreview() {
  const [showModal, setShowModal] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState<PreviewTitle | null>(null);

  const handlePreview = (title: PreviewTitle) => {
    console.log('✨ [Admin Preview] Starting preview for:', title.title, title.rarity);
    setSelectedTitle(title);
    setShowModal(true);
  };

  const handleClose = () => {
    console.log('✨ [Admin Preview] Closing preview');
    setShowModal(false);
    // Delay clearing selectedTitle to allow exit animation
    setTimeout(() => setSelectedTitle(null), 300);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600">
          <Crown className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Title Unlock Sequence Preview
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Test enhanced unlock animations for all rarity levels
          </p>
        </div>
      </div>

      {/* Preview Grid */}
      <div className="grid gap-3">
        {previewTitles.map((title, index) => {
          // Rarity colors
          const rarityConfig = {
            common: {
              gradient: 'from-slate-500 to-slate-600',
              border: 'border-slate-400/30',
              glow: 'hover:shadow-slate-400/20',
              icon: '⚪'
            },
            uncommon: {
              gradient: 'from-emerald-500 to-green-600',
              border: 'border-emerald-400/30',
              glow: 'hover:shadow-emerald-400/30',
              icon: '🟢'
            },
            rare: {
              gradient: 'from-purple-500 to-violet-600',
              border: 'border-purple-400/30',
              glow: 'hover:shadow-purple-400/40',
              icon: '🟣'
            },
            epic: {
              gradient: 'from-amber-500 to-yellow-600',
              border: 'border-amber-400/30',
              glow: 'hover:shadow-amber-400/50',
              icon: '🟡'
            },
            legendary: {
              gradient: 'from-rose-500 via-pink-500 to-purple-500',
              border: 'border-pink-400/40',
              glow: 'hover:shadow-pink-400/60 hover:shadow-lg',
              icon: '🌈'
            }
          }[title.rarity];

          return (
            <button
              key={index}
              onClick={() => handlePreview(title)}
              className={`group relative flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border ${rarityConfig.border} ${rarityConfig.glow} hover:scale-[1.02] transition-all duration-200 text-left`}
            >
              {/* Icon Badge */}
              <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${rarityConfig.gradient} flex items-center justify-center shadow-lg`}>
                <Crown className="w-7 h-7 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{rarityConfig.icon}</span>
                  <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                    {title.title}
                  </h4>
                  <span className={`ml-auto px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-gradient-to-r ${rarityConfig.gradient} text-white`}>
                    {title.rarity}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-1">
                  from: {title.achievementName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                  {title.description}
                </p>
              </div>

              {/* Play Icon */}
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${rarityConfig.gradient} flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg`}>
                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                </div>
              </div>

              {/* Sparkle indicator for legendary */}
              {title.rarity === 'legendary' && (
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="w-5 h-5 text-pink-500 drop-shadow-lg animate-pulse" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Enhancement Note */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-800">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-indigo-900 dark:text-indigo-100 mb-1">
              ✨ Enhanced Animations
            </p>
            <ul className="space-y-1 text-indigo-700 dark:text-indigo-300 text-xs">
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
      {selectedTitle && (
        <TitleRewardModalEnhanced
          title={selectedTitle.title}
          rarity={selectedTitle.rarity}
          achievementName={selectedTitle.achievementName}
          isOpen={showModal}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
