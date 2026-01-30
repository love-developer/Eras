import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Play, X } from 'lucide-react';
import { CeremonyOverlay } from './capsule-themes/CeremonyOverlay';

interface ThemePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// All 14 themed capsules (excluding 'standard')
const THEMES = [
  { id: 'pet', name: 'Furry Friends', icon: '🐾', color: 'from-amber-700 to-amber-400' },
  { id: 'gratitude', name: 'Grateful Heart', icon: '🙏', color: 'from-red-600 to-red-300' },
  { id: 'new_home', name: 'New Nest', icon: '🏡', color: 'from-green-600 to-green-300' },
  { id: 'travel', name: 'Voyage', icon: '🗺️', color: 'from-orange-500 to-orange-300' },
  { id: 'first_day', name: 'Fresh Start', icon: '☀️', color: 'from-orange-600 to-orange-200' },
  { id: 'anniversary', name: 'Eternal Flame', icon: '💌', color: 'from-pink-600 to-pink-200' },
  { id: 'career', name: 'Career Summit', icon: '🚀', color: 'from-blue-900 to-blue-400' },
  { id: 'graduation', name: 'Launchpad', icon: '🎓', color: 'from-blue-400 to-cyan-400' },
  { id: 'wedding', name: 'Golden Hour', icon: '💍', color: 'from-amber-500 to-amber-300' },
  { id: 'new_life', name: 'New Life', icon: '👶', color: 'from-purple-400 to-pink-300' },
  { id: 'friendship', name: 'Mixtape', icon: '📷', color: 'from-teal-600 to-teal-200' },
  { id: 'new_year', name: 'New Year\'s Eve', icon: '🎆', color: 'from-purple-600 to-yellow-400' },
  { id: 'birthday', name: 'Solar Return', icon: '🎁', color: 'from-red-500 to-yellow-400' },
  { id: 'future', name: 'Time Traveler', icon: '⚡', color: 'from-green-400 to-blue-600' },
];

export function ThemePreviewModal({ isOpen, onClose }: ThemePreviewModalProps) {
  const [previewingTheme, setPreviewingTheme] = useState<string | null>(null);
  const [ceremonyVisible, setCeremonyVisible] = useState(false);

  const handlePreviewTheme = (themeId: string) => {
    setPreviewingTheme(themeId);
    // Small delay to ensure the overlay is mounted before showing ceremony
    setTimeout(() => {
      setCeremonyVisible(true);
    }, 100);
  };

  const handleCeremonyComplete = () => {
    setCeremonyVisible(false);
    setTimeout(() => {
      setPreviewingTheme(null);
    }, 300);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              🎬 Theme Preview Tool
            </DialogTitle>
            <DialogDescription>
              Preview opening animations for all 14 themed capsules. Click the play button to watch each ceremony.
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable theme grid */}
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4">
              {THEMES.map((theme) => (
                <div
                  key={theme.id}
                  className="group relative overflow-hidden rounded-lg border border-slate-700 bg-gradient-to-br from-slate-800/50 to-slate-900/50 hover:border-slate-500 transition-all duration-300"
                >
                  {/* Theme gradient background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${theme.color} opacity-10 group-hover:opacity-20 transition-opacity`}
                  />

                  {/* Content */}
                  <div className="relative p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{theme.icon}</div>
                      <div>
                        <h3 className="font-semibold text-white">{theme.name}</h3>
                        <p className="text-xs text-slate-400">{theme.id}</p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handlePreviewTheme(theme.id)}
                      className={`bg-gradient-to-r ${theme.color} text-white border-0 hover:shadow-lg hover:scale-105 transition-all`}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-700 pt-4 flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Developer Tool • {THEMES.length} Themes Available
            </p>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ceremony Overlay Preview */}
      {previewingTheme && (
        <div className="fixed inset-0 z-[10002] bg-black">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCeremonyComplete}
            className="absolute top-4 right-4 z-[10003] h-12 w-12 rounded-full bg-slate-800/80 hover:bg-slate-700/90 text-white shadow-lg"
          >
            <X className="w-6 h-6" />
          </Button>

          <CeremonyOverlay
            themeId={previewingTheme}
            isVisible={ceremonyVisible}
            isNewReceived={true}
            onComplete={handleCeremonyComplete}
          />
        </div>
      )}
    </>
  );
}