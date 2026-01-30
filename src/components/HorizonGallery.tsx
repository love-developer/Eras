import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Check, ChevronLeft, ChevronRight, Sparkles, Crown } from 'lucide-react';
import { TitleData } from '../hooks/useTitles';
import { getTitleConfig } from '../utils/titleConfigs';
import { 
  sunriseVariants, 
  textFloatVariants, 
  cardHoverVariants, 
  previewGradientVariants 
} from '../utils/horizonAnimations';
import { HeaderBackground } from './HeaderBackground';
import { HorizonActivationSequence } from './HorizonActivationSequence';

interface HorizonGalleryProps {
  titles: TitleData[];
  equippedAchievementId: string | null;
  onActivate: (achievementId: string | null) => Promise<void>;
  activating: boolean;
}

interface TitlesByRarity {
  legendary: TitleData[];
  epic: TitleData[];
  rare: TitleData[];
  uncommon: TitleData[];
  common: TitleData[];
}

/**
 * 🌅 HORIZON GALLERY - Full-screen immersive title selector
 * 
 * Features:
 * - Live HeaderBackground gradient preview at top
 * - Titles grouped by rarity tiers in horizontal scrolling rows
 * - Large preview cards with gradient backgrounds
 * - Activate/Deactivate terminology (Horizon theme)
 * - Epic activation sequence with Journey Between Eras
 */
export function HorizonGallery({ titles, equippedAchievementId, onActivate, activating }: HorizonGalleryProps) {
  const [selectedTitle, setSelectedTitle] = useState<TitleData | null>(null);
  const [hoveredTitle, setHoveredTitle] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'activate' | 'deactivate' | null>(null);
  const [showActivationSequence, setShowActivationSequence] = useState(false);
  const [oldTitleData, setOldTitleData] = useState<{ name: string; rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'; colors: string[] } | null>(null);
  const [newTitleData, setNewTitleData] = useState<{ name: string; rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'; colors: string[] } | null>(null);
  const scrollRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Find equipped title on mount
  useEffect(() => {
    if (equippedAchievementId) {
      const equipped = titles.find(t => t.achievementId === equippedAchievementId);
      if (equipped) {
        setSelectedTitle(equipped);
      }
    }
  }, [equippedAchievementId, titles]);

  // Group titles by rarity
  const titlesByRarity: TitlesByRarity = {
    legendary: titles.filter(t => t.rarity === 'legendary'),
    epic: titles.filter(t => t.rarity === 'epic'),
    rare: titles.filter(t => t.rarity === 'rare'),
    uncommon: titles.filter(t => t.rarity === 'uncommon'),
    common: titles.filter(t => t.rarity === 'common'),
  };

  // Display order: Common first, then up to Legendary
  const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const;
  const rarityLabels = {
    legendary: 'Legendary Horizons',
    epic: 'Epic Horizons',
    rare: 'Rare Horizons',
    uncommon: 'Uncommon Horizons',
    common: 'Common Horizons',
  };

  const handleScroll = (rarity: string, direction: 'left' | 'right') => {
    const container = scrollRefs.current[rarity];
    if (!container) return;

    const scrollAmount = 300;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const handleActivate = async () => {
    if (!selectedTitle || !selectedTitle.isUnlocked || activating) return;
    
    // Prepare data for activation sequence
    const oldEquipped = equippedAchievementId 
      ? titles.find(t => t.achievementId === equippedAchievementId)
      : null;
    
    if (oldEquipped) {
      const oldConfig = getTitleConfig(oldEquipped.title);
      setOldTitleData({
        name: oldEquipped.title,
        rarity: oldEquipped.rarity,
        colors: oldConfig.colors
      });
    }
    
    const newConfig = getTitleConfig(selectedTitle.title);
    setNewTitleData({
      name: selectedTitle.title,
      rarity: selectedTitle.rarity,
      colors: newConfig.colors
    });
    
    // Show epic activation sequence
    setShowActivationSequence(true);
    setActionType('activate');
    
    // Perform the actual activation
    await onActivate(selectedTitle.achievementId);
  };

  const handleActivationComplete = () => {
    setShowActivationSequence(false);
    setActionType(null);
    setOldTitleData(null);
    setNewTitleData(null);
  };

  const handleDeactivate = async () => {
    if (activating || !equippedAchievementId) return;
    setActionType('deactivate');
    await onActivate(null);
    setSelectedTitle(null);
    setActionType(null);
  };

  // Reset action type when activating state changes
  useEffect(() => {
    if (!activating) {
      setActionType(null);
    }
  }, [activating]);

  const isEquipped = (achievementId: string) => achievementId === equippedAchievementId;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Epic Activation Sequence Overlay */}
      {showActivationSequence && newTitleData && (
        <HorizonActivationSequence
          isActivating={showActivationSequence}
          oldTitle={oldTitleData}
          newTitle={newTitleData}
          onComplete={handleActivationComplete}
        />
      )}

      {/* LIVE PREVIEW - HeaderBackground gradient at top */}
      <AnimatePresence mode="wait">
        {selectedTitle && selectedTitle.isUnlocked && (
          <motion.div
            key={selectedTitle.achievementId}
            variants={previewGradientVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative h-32 sm:h-40 overflow-hidden z-0"
            style={{ isolation: 'isolate' }}
          >
            {/* HeaderBackground gradient preview - Contained within this box, clipped to prevent bleeding */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute inset-0" style={{ clipPath: 'inset(0)' }}>
                <HeaderBackground 
                  titleName={selectedTitle.title} 
                  titleRarity={selectedTitle.rarity}
                  preview={true}
                />
              </div>
            </div>
            
            {/* Title name overlay */}
            <motion.div 
              variants={textFloatVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="relative z-10 h-full flex items-center justify-center"
            >
              <div className="text-center px-4">
                <h3 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
                  {selectedTitle.title}
                </h3>
                <p className="text-sm sm:text-base text-white/80 mt-1 drop-shadow-md">
                  {selectedTitle.description}
                </p>
              </div>
            </motion.div>

            {/* Gradient overlay for better text contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/90 pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons - only show if a title is selected */}
      {selectedTitle && selectedTitle.isUnlocked && (
        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-center gap-3">
          {isEquipped(selectedTitle.achievementId) && actionType !== 'activate' ? (
            <>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-600/20 border border-green-500/30 text-green-300 text-sm font-semibold">
                <Check className="w-4 h-4" />
                Active Horizon
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDeactivate}
                disabled={activating}
                className="px-6 py-2 rounded-full bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 text-white text-sm font-semibold transition-all flex items-center gap-2"
              >
                {activating && actionType === 'deactivate' ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="w-4 h-4" />
                    </motion.div>
                    Deactivating...
                  </>
                ) : (
                  'Deactivate Horizon'
                )}
              </motion.button>
            </>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleActivate}
              disabled={activating}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 border border-purple-400/30 text-white text-base font-bold transition-all flex items-center gap-2 shadow-xl"
              style={{
                boxShadow: '0 0 30px rgba(147, 51, 234, 0.5)'
              }}
            >
              {activating && actionType === 'activate' ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                  Activating Horizon...
                </>
              ) : (
                <>
                  <Crown className="w-5 h-5" />
                  Activate Horizon
                </>
              )}
            </motion.button>
          )}
        </div>
      )}

      {/* RARITY TIERS - Horizontal scrolling rows */}
      <div 
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-8 relative z-0"
        style={{
          WebkitOverflowScrolling: 'touch', // Enable momentum scrolling on iOS
          overscrollBehaviorY: 'contain' // Prevent parent scroll interference
        }}
      >
        {/* ✅ FIX: Show message if no titles are available */}
        {titles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
            <div className="text-6xl">🌅</div>
            <h3 className="text-xl font-bold text-white">No Horizons Yet</h3>
            <p className="text-slate-400 max-w-md">
              Complete achievements to unlock Legacy Titles and showcase them in your Horizon Gallery!
            </p>
          </div>
        ) : (
          rarityOrder.map(rarity => {
            const tierTitles = titlesByRarity[rarity];
            if (tierTitles.length === 0) return null;

            return (
              <div key={rarity} className="space-y-3">
                {/* Tier label */}
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">
                    {rarity === 'legendary' ? '👑' : 
                     rarity === 'epic' ? '💎' : 
                     rarity === 'rare' ? '✨' : 
                     rarity === 'uncommon' ? '⚡' : '🌟'}
                  </span>
                  {rarityLabels[rarity]}
                  <span className="text-sm text-slate-400 font-normal">({tierTitles.length})</span>
                </h3>

                {/* Horizontal scrolling row */}
                <div className="relative group">
                  {/* Left scroll button */}
                  <button
                    onClick={() => handleScroll(rarity, 'left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-slate-900/90 border border-slate-700/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-800/90"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Scrollable container - Enhanced for responsive mobile scrolling */}
                  <div
                    ref={el => scrollRefs.current[rarity] = el}
                    className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      scrollBehavior: 'auto', // Changed from 'smooth' for instant mobile response
                      WebkitOverflowScrolling: 'touch', // Enable momentum scrolling on iOS
                      overscrollBehaviorX: 'contain' // Prevent parent scroll interference
                    }}
                  >
                    {tierTitles.map(title => {
                      const titleConfig = getTitleConfig(title.title);
                      const isSelected = selectedTitle?.achievementId === title.achievementId;
                      const isHovered = hoveredTitle === title.achievementId;
                      const equipped = isEquipped(title.achievementId);

                      return (
                        <motion.div
                          key={title.achievementId}
                          variants={cardHoverVariants}
                          initial="rest"
                          whileHover={title.isUnlocked ? "hover" : "rest"}
                          animate="rest"
                          onClick={() => title.isUnlocked && setSelectedTitle(title)}
                          onMouseEnter={() => setHoveredTitle(title.achievementId)}
                          onMouseLeave={() => setHoveredTitle(null)}
                          className={`flex-shrink-0 w-40 sm:w-48 rounded-xl overflow-hidden cursor-pointer relative transition-all duration-300 ${
                            isSelected ? 'ring-4 ring-purple-500' : ''
                          } ${
                            !title.isUnlocked ? 'opacity-50' : ''
                          }`}
                          style={{
                            background: title.isUnlocked
                              ? `linear-gradient(135deg, ${titleConfig.colors[0]}, ${titleConfig.colors[1]})`
                              : 'linear-gradient(135deg, #2a2a2a, #1a1a1a)'
                          }}
                        >
                          {/* Card content */}
                          <div className="relative aspect-[3/4] p-4 flex flex-col items-center justify-center">
                            {/* Gradient overlay for depth */}
                            {title.isUnlocked && (
                              <div 
                                className="absolute inset-0"
                                style={{
                                  background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.15) 0%, transparent 60%)'
                                }}
                              />
                            )}

                            {/* 🎨 SPECTACULAR UNCOMMON EFFECTS - Animated particles & glows */}
                            {title.isUnlocked && title.rarity === 'uncommon' && (
                              <>
                                {/* Floating particles based on particle count */}
                                {Array.from({ length: titleConfig.particleCount }).map((_, i) => (
                                  <motion.div
                                    key={i}
                                    className="absolute w-1 h-1 rounded-full"
                                    style={{
                                      background: titleConfig.colors[i % 2],
                                      left: `${(i * 23) % 100}%`,
                                      top: `${(i * 37) % 100}%`,
                                    }}
                                    animate={{
                                      y: [0, -20, 0],
                                      x: [0, Math.sin(i) * 10, 0],
                                      opacity: [0.3, 0.8, 0.3],
                                      scale: [0.8, 1.2, 0.8]
                                    }}
                                    transition={{
                                      duration: 3 + (i % 3),
                                      repeat: Infinity,
                                      delay: i * 0.2,
                                      ease: 'easeInOut'
                                    }}
                                  />
                                ))}

                                {/* Pulsing glow ring */}
                                <motion.div
                                  className="absolute inset-0 rounded-xl"
                                  animate={{
                                    boxShadow: [
                                      `0 0 20px ${titleConfig.colors[0]}40`,
                                      `0 0 40px ${titleConfig.colors[1]}60`,
                                      `0 0 20px ${titleConfig.colors[0]}40`
                                    ]
                                  }}
                                  transition={{
                                    duration: 2.5,
                                    repeat: Infinity,
                                    ease: 'easeInOut'
                                  }}
                                />

                                {/* Shimmer effect sweep */}
                                <motion.div
                                  className="absolute inset-0"
                                  style={{
                                    background: `linear-gradient(90deg, transparent 0%, ${titleConfig.colors[0]}30 50%, transparent 100%)`
                                  }}
                                  animate={{
                                    x: ['-100%', '200%']
                                  }}
                                  transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: 'linear',
                                    repeatDelay: 2
                                  }}
                                />
                              </>
                            )}

                            {/* Emoji icon or Lock */}
                            <div className="relative z-10 mb-3">
                              {title.isUnlocked ? (
                                <span 
                                  className="text-6xl sm:text-7xl drop-shadow-2xl"
                                  style={{
                                    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.6))'
                                  }}
                                >
                                  {titleConfig.icon}
                                </span>
                              ) : (
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-900/50 border-2 border-gray-700/30 flex items-center justify-center">
                                  <Lock className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600" />
                                </div>
                              )}
                            </div>

                            {/* Title name */}
                            <h4 className="text-sm sm:text-base font-bold text-white text-center drop-shadow-lg relative z-10">
                              {title.title}
                            </h4>

                            {/* Equipped badge */}
                            {equipped && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-green-500 border-2 border-white flex items-center justify-center shadow-lg z-20"
                              >
                                <Check className="w-5 h-5 text-white" />
                              </motion.div>
                            )}

                            {/* Lock badge for locked titles */}
                            {!title.isUnlocked && (
                              <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-gray-900/90 border border-gray-700/50 flex items-center justify-center z-20">
                                <Lock className="w-3.5 h-3.5 text-gray-500" />
                              </div>
                            )}

                            {/* Selection ring glow */}
                            {isSelected && title.isUnlocked && (
                              <motion.div
                                className="absolute inset-0"
                                animate={{
                                  opacity: [0.3, 0.6, 0.3],
                                  scale: [1, 1.02, 1]
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: 'easeInOut'
                                }}
                                style={{
                                  background: `radial-gradient(circle at center, ${titleConfig.colors[0]}80 0%, transparent 70%)`,
                                  filter: 'blur(20px)'
                                }}
                              />
                            )}
                          </div>

                          {/* Hover tooltip for locked titles */}
                          {!title.isUnlocked && isHovered && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-lg bg-gray-900/95 border border-gray-700/50 backdrop-blur-sm text-xs text-gray-300 whitespace-nowrap shadow-xl"
                            >
                              🔒 {title.description}
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Right scroll button */}
                  <button
                    onClick={() => handleScroll(rarity, 'right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-slate-900/90 border border-slate-700/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-800/90"
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Helper text at bottom */}
      <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-900/50">
        <p className="text-xs sm:text-sm text-slate-400 text-center">
          {selectedTitle 
            ? 'Click "Activate Horizon" to set this title as your active horizon' 
            : 'Select a title to preview its horizon and activate it'}
        </p>
      </div>
    </div>
  );
}