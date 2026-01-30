import React, { useState } from 'react';
import { Button } from './ui/button';
import { Crown, Play } from 'lucide-react';
import { TitleRewardModal } from './TitleRewardModal';
import { toast } from 'sonner@2.0.3';

/**
 * 👑 Title Unlock Preview Component
 * 
 * Allows previewing the title unlock sequence with various rarities
 * Shows the Title Reward Modal with sample titles
 */

interface PreviewTitle {
  title: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  achievementName: string;
}

const SAMPLE_TITLES: PreviewTitle[] = [
  {
    title: 'Chronicle Keeper',
    rarity: 'common',
    achievementName: 'First Steps Achievement'
  },
  {
    title: 'Memory Architect',
    rarity: 'uncommon',
    achievementName: 'Memory Milestone'
  },
  {
    title: 'Midnight Chronicler',
    rarity: 'rare',
    achievementName: 'Night Owl Achievement'
  },
  {
    title: 'Time Lord',
    rarity: 'epic',
    achievementName: 'Master of Time'
  },
  {
    title: 'Legacy Guardian',
    rarity: 'legendary',
    achievementName: 'Ultimate Legacy Achievement'
  }
];

export function TitleUnlockPreview() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleStartPreview = () => {
    console.log('👑 [Preview] Starting title unlock sequence preview');
    setCurrentIndex(0);
    setShowModal(true);
    setIsPlaying(true);
    
    toast.success('Title Preview Started!', {
      description: `Previewing ${SAMPLE_TITLES.length} titles in sequence`,
      duration: 2000
    });
  };

  const handleNextTitle = () => {
    console.log(`👑 [Preview] Moving to next title (${currentIndex + 1}/${SAMPLE_TITLES.length})`);
    
    if (currentIndex < SAMPLE_TITLES.length - 1) {
      // Close current modal, then open next one after a short delay
      setShowModal(false);
      
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setShowModal(true);
      }, 300); // Brief pause between modals
    } else {
      // End of preview sequence
      console.log('👑 [Preview] Preview sequence complete');
      setShowModal(false);
      setIsPlaying(false);
      setCurrentIndex(0);
      
      toast.success('Preview Complete!', {
        description: 'You\'ve seen all title rarities',
        duration: 2000
      });
    }
  };

  const handleClose = () => {
    console.log('👑 [Preview] Preview closed by user');
    setShowModal(false);
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  const currentTitle = SAMPLE_TITLES[currentIndex];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-300">Title Unlock Preview</h3>
          <p className="text-xs text-gray-500 mt-1">
            Test the title reward modal with all rarities
          </p>
        </div>
        
        <Button
          onClick={handleStartPreview}
          disabled={isPlaying}
          className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white border-0"
        >
          <Play className="w-4 h-4 mr-2" />
          {isPlaying ? 'Playing...' : 'Preview Titles'}
        </Button>
      </div>

      {isPlaying && (
        <div className="p-3 rounded-lg bg-purple-900/20 border border-purple-800/30">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">
              Showing: <span className="text-purple-400 font-medium">{currentTitle.rarity}</span> rarity
            </span>
            <span className="text-gray-500">
              {currentIndex + 1} of {SAMPLE_TITLES.length}
            </span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-800 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / SAMPLE_TITLES.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Title Reward Modal */}
      {showModal && currentTitle && (
        <TitleRewardModal
          title={currentTitle.title}
          rarity={currentTitle.rarity}
          achievementName={currentTitle.achievementName}
          isOpen={showModal}
          onClose={handleNextTitle} // Auto-advance to next title on close
        />
      )}
    </div>
  );
}
