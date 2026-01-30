// ============================================================================
// EPIC HORIZON PREVIEW - Developer Tool for Testing Epic Tier Horizons
// ============================================================================

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Eye, Sparkles, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { HeaderBackground } from './HeaderBackground';

interface EpicHorizon {
  id: string;
  titleName: string;
  displayName: string;
  achievement: string;
  rarity: 'epic' | 'legendary';
  description: string;
  unlockCondition: string;
  implemented: boolean;
}

// Epic horizons registry
const EPIC_HORIZONS: EpicHorizon[] = [
  {
    id: 'genesis-eternal',
    titleName: 'Genesis Eternal',
    displayName: 'Genesis Eternal',
    achievement: 'Eternal Keeper (A048)',
    rarity: 'epic',
    description: 'Cosmic Big Bang cycle with star implosion and galaxy formation every 30 seconds. Features 200+ stars, planets, nebulae, and advanced particle physics with massive explosion effects.',
    unlockCondition: 'Use Eras for 3 consecutive years',
    implemented: true,
  },
  {
    id: 'prismatic-dusk',
    titleName: 'Prismatic Dusk',
    displayName: 'Prismatic Dusk',
    achievement: 'Theme Connoisseur (A049)',
    rarity: 'epic',
    description: 'Rotating 3D prism that refracts all 15 theme colors with orbiting theme icons. Rainbow supernova burst every 20 seconds.',
    unlockCondition: 'Create at least 1 capsule with all 15 themes',
    implemented: true,
  },
  {
    id: 'dawn-eternal',
    titleName: 'Dawn Eternal',
    displayName: 'Dawn Eternal',
    achievement: 'Golden Hour Guardian (A050)',
    rarity: 'epic',
    description: 'Perpetual sunrise with volumetric god rays, 3-layer parallax clouds, flying birds, and divine golden burst with lens flare every 45 seconds.',
    unlockCondition: 'Create 50 capsules between 5-7 AM',
    implemented: true,
  },
  {
    id: 'creative-nexus',
    titleName: 'Creative Nexus',
    displayName: 'Creative Nexus',
    achievement: 'Multimedia Master (A051)',
    rarity: 'epic',
    description: 'Tri-media convergence with holographic photo/video/audio icons that orbit and collide in a creative explosion every 25 seconds.',
    unlockCondition: 'Upload 50 photos, 50 videos, and 50 audio files',
    implemented: true,
  },
  {
    id: 'nostalgia-weaver',
    titleName: 'Nostalgia Weaver',
    displayName: 'Nostalgia Weaver',
    achievement: 'Memory Weaver (A052)',
    rarity: 'epic',
    description: 'Memory fragments (photos) float like leaves in the wind as golden threads weave them into a beautiful glowing tapestry every 30 seconds.',
    unlockCondition: 'Create 100 capsules with nostalgic themes',
    implemented: true,
  },
];

interface EpicHorizonPreviewProps {
  onClose: () => void;
}

export function EpicHorizonPreview({ onClose }: EpicHorizonPreviewProps) {
  const [selectedHorizon, setSelectedHorizon] = useState<EpicHorizon | null>(null);
  const [isMobile] = useState(window.innerWidth < 640);

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        className="bg-slate-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-slate-700"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Epic Horizon Gallery</h2>
              <p className="text-sm text-violet-100">Developer Preview Tool</p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {!selectedHorizon ? (
            // Grid view of all epic horizons
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EPIC_HORIZONS.map((horizon) => (
                <motion.div
                  key={horizon.id}
                  className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden cursor-pointer hover:border-violet-500 transition-all"
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedHorizon(horizon)}
                >
                  {/* Preview thumbnail */}
                  <div className="relative h-40 bg-slate-950 overflow-hidden">
                    {horizon.implemented ? (
                      <div className="relative w-full h-full">
                        <HeaderBackground
                          titleName={horizon.titleName}
                          titleRarity={horizon.rarity}
                          preview={true}
                        />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                          <p className="text-sm text-slate-500">Coming Soon</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Status badge */}
                    <div className="absolute top-2 right-2">
                      <Badge
                        variant={horizon.implemented ? 'default' : 'secondary'}
                        className={horizon.implemented ? 'bg-green-600' : 'bg-slate-600'}
                      >
                        {horizon.implemented ? 'Implemented' : 'Planned'}
                      </Badge>
                    </div>

                    {/* Rarity badge */}
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-violet-600">
                        {horizon.rarity.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-bold text-white mb-1">{horizon.displayName}</h3>
                    <p className="text-sm text-violet-400 mb-2">
                      Achievement: {horizon.achievement}
                    </p>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {horizon.description}
                    </p>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Preview Full
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            // Full preview view
            <div className="space-y-6">
              {/* Back button */}
              <Button
                onClick={() => setSelectedHorizon(null)}
                variant="outline"
                size="sm"
              >
                ← Back to Gallery
              </Button>

              {/* Full preview */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                {/* Large preview */}
                <div className="relative h-[300px] bg-slate-950 overflow-hidden">
                  {selectedHorizon.implemented ? (
                    <div className="relative w-full h-full">
                      <HeaderBackground
                        titleName={selectedHorizon.titleName}
                        titleRarity={selectedHorizon.rarity}
                        preview={true}
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Sparkles className="w-20 h-20 text-slate-600 mx-auto mb-4" />
                        <p className="text-lg text-slate-400">Coming Soon</p>
                        <p className="text-sm text-slate-500 mt-2">
                          This horizon is planned for Phase 2
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-6 space-y-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-white">
                        {selectedHorizon.displayName}
                      </h3>
                      <Badge className="bg-violet-600">
                        {selectedHorizon.rarity.toUpperCase()}
                      </Badge>
                      <Badge
                        variant={selectedHorizon.implemented ? 'default' : 'secondary'}
                        className={selectedHorizon.implemented ? 'bg-green-600' : 'bg-slate-600'}
                      >
                        {selectedHorizon.implemented ? 'Implemented' : 'Planned'}
                      </Badge>
                    </div>
                    <p className="text-violet-400">
                      Achievement: {selectedHorizon.achievement}
                    </p>
                  </div>

                  <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-white mb-1">Description</p>
                        <p className="text-sm text-slate-300">
                          {selectedHorizon.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-white mb-1">Unlock Condition</p>
                        <p className="text-sm text-slate-300">
                          {selectedHorizon.unlockCondition}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedHorizon.implemented && (
                    <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                      <p className="text-sm text-green-300">
                        ✅ This horizon is fully implemented and animating above in real-time.
                        {selectedHorizon.id === 'genesis-eternal' && (
                          <span className="block mt-2">
                            <strong>⏱️ Wait 30 seconds:</strong> A star will implode into a black hole, then EXPLODE in a MASSIVE screen-filling white flash with SEVEN expanding shockwave rings (white/cyan/blue/purple/magenta/orange/gold), 1200+ particles, a huge colored energy sphere, and a delayed secondary explosion wave! The shockwaves expand at 1000px/s on desktop!
                          </span>
                        )}
                        {selectedHorizon.id === 'prismatic-dusk' && (
                          <span className="block mt-2">
                            <strong>⏱️ Wait 20 seconds:</strong> The prism spins faster, builds energy, then releases a spectacular rainbow supernova burst with 300 particles cycling through all 15 theme colors!
                          </span>
                        )}
                        {selectedHorizon.id === 'dawn-eternal' && (
                          <span className="block mt-2">
                            <strong>⏱️ Wait 45 seconds:</strong> The sun pulses with power, then creates a divine golden burst with massive lens flare as golden particles rain down like blessings!
                          </span>
                        )}
                        {selectedHorizon.id === 'creative-nexus' && (
                          <span className="block mt-2">
                            <strong>⏱️ Wait 25 seconds:</strong> Photo, video, and audio icons orbit faster, converge to the center, COLLIDE in a white flash, then explode with CMY color mixing rings!
                          </span>
                        )}
                        {selectedHorizon.id === 'nostalgia-weaver' && (
                          <span className="block mt-2">
                            <strong>⏱️ Wait 30 seconds:</strong> Memory fragments drift peacefully, then golden threads spiral inward, weaving them into a glowing tapestry that pulses with warm energy!
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}