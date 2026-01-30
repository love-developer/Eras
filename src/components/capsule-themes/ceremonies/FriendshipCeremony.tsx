import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Music, Volume2 } from 'lucide-react';

interface FriendshipCeremonyProps {
  isVisible: boolean;
  onComplete: () => void;
}

export function FriendshipCeremony({ isVisible, onComplete }: FriendshipCeremonyProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reelRotation, setReelRotation] = useState(0);
  const [vuMeterLevel, setVuMeterLevel] = useState([0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    if (!isPlaying) return;

    // Progress timer
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 1;
        if (next >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            onComplete();
          }, 500);
          return 100;
        }
        return next;
      });
    }, 50); // 5 seconds total

    // Reel rotation
    const reelInterval = setInterval(() => {
      setReelRotation(prev => prev + 10);
    }, 50);

    // VU meters bouncing
    const vuInterval = setInterval(() => {
      setVuMeterLevel(prev => 
        prev.map(() => Math.random() * 100)
      );
    }, 100);

    return () => {
      clearInterval(progressInterval);
      clearInterval(reelInterval);
      clearInterval(vuInterval);
    };
  }, [isPlaying, onComplete]);

  const handlePlay = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(50);
    }
  };

  const handlePause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(50);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full relative overflow-hidden">
      {/* Retro background pattern */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 10px, #2dd4bf 10px, #2dd4bf 11px)',
      }} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6 w-full max-w-md z-10"
      >
        {/* Title */}
        <div className="space-y-2">
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Music className="w-12 h-12 text-teal-400 mx-auto" />
          </motion.div>
          <h2 className="text-3xl font-mono text-teal-400 font-bold tracking-tighter">BOOMBOX</h2>
          <div className="bg-teal-900/30 p-2 rounded border border-teal-500/30 inline-block px-4">
            <p className="text-teal-300 font-mono text-xs uppercase">
              {isPlaying ? '♫ NOW PLAYING ♫' : 'Press PLAY ▶'}
            </p>
          </div>
        </div>

        {/* Cassette Player Body */}
        <div className="relative bg-slate-900 rounded-2xl p-6 border-4 border-slate-700 shadow-2xl">
          {/* VU Meters */}
          <div className="flex justify-center gap-1 mb-4">
            {vuMeterLevel.map((level, i) => (
              <div key={i} className="w-4 h-16 bg-slate-800 rounded-sm overflow-hidden border border-slate-700">
                <motion.div
                  className="w-full bg-gradient-to-t from-teal-500 to-teal-300"
                  style={{ 
                    height: isPlaying ? `${level}%` : '0%',
                    transformOrigin: 'bottom'
                  }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            ))}
          </div>

          {/* Cassette Tape */}
          <div className="relative bg-gradient-to-b from-amber-100 to-amber-200 rounded-lg p-4 border-2 border-amber-300 shadow-lg">
            {/* Label */}
            <div className="text-center mb-3 font-handwriting">
              <p className="text-xs text-slate-700 font-bold">FRIENDSHIP MIX</p>
              <p className="text-[10px] text-slate-600">For my bestie 💛</p>
            </div>

            {/* Tape Reels */}
            <div className="flex justify-center gap-8 items-center">
              {/* Left Reel */}
              <motion.div
                animate={{ rotate: isPlaying ? reelRotation : 0 }}
                transition={{ duration: 0.1, ease: 'linear' }}
                className="relative"
              >
                <div className="w-16 h-16 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center shadow-inner">
                  {/* Reel spokes */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-6 bg-slate-600 rounded"
                        style={{ transform: `rotate(${angle}deg)` }}
                      />
                    ))}
                  </div>
                  <div className="w-3 h-3 bg-slate-900 rounded-full z-10" />
                </div>
              </motion.div>

              {/* Tape visible section */}
              <div className="relative">
                <motion.div
                  animate={{ scaleX: isPlaying ? [1, 0.95, 1] : 1 }}
                  transition={{ duration: 0.5, repeat: isPlaying ? Infinity : 0 }}
                  className="w-20 h-1 bg-amber-800/60"
                />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-700 font-mono">
                  {progress}%
                </div>
              </div>

              {/* Right Reel */}
              <motion.div
                animate={{ rotate: isPlaying ? reelRotation : 0 }}
                transition={{ duration: 0.1, ease: 'linear' }}
                className="relative"
              >
                <div className="w-16 h-16 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center shadow-inner">
                  {/* Reel spokes */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-6 bg-slate-600 rounded"
                        style={{ transform: `rotate(${angle}deg)` }}
                      />
                    ))}
                  </div>
                  <div className="w-3 h-3 bg-slate-900 rounded-full z-10" />
                </div>
              </motion.div>
            </div>

            {/* Tape window */}
            <div className="mt-2 flex justify-center gap-4 text-[8px] text-slate-600 font-mono">
              <span>SIDE A</span>
              <span>C-90</span>
              <span>CHROME</span>
            </div>
          </div>

          {/* Speaker Grilles */}
          <div className="flex justify-between mt-4 gap-4">
            {[0, 1].map((side) => (
              <div key={side} className="flex-1 grid grid-cols-4 gap-1 p-2 bg-slate-800 rounded border border-slate-700">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-slate-700" />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center gap-4">
          <motion.button
            onClick={handlePlay}
            disabled={isPlaying}
            whileTap={{ scale: 0.95 }}
            className={`w-16 h-16 rounded-lg flex items-center justify-center border-2 transition-all ${
              isPlaying 
                ? 'bg-teal-500/20 border-teal-500/50 cursor-not-allowed' 
                : 'bg-slate-800 border-slate-700 hover:border-teal-500 hover:bg-slate-750 shadow-lg'
            }`}
          >
            <Play className={`w-8 h-8 ${isPlaying ? 'text-teal-500/50' : 'text-teal-400'}`} fill={isPlaying ? 'currentColor' : 'none'} />
          </motion.button>

          <motion.button
            onClick={handlePause}
            disabled={!isPlaying}
            whileTap={{ scale: 0.95 }}
            className={`w-16 h-16 rounded-lg flex items-center justify-center border-2 transition-all ${
              !isPlaying 
                ? 'bg-slate-800/50 border-slate-700/50 cursor-not-allowed' 
                : 'bg-slate-800 border-slate-700 hover:border-teal-500 hover:bg-slate-750 shadow-lg'
            }`}
          >
            <Pause className={`w-8 h-8 ${!isPlaying ? 'text-teal-500/50' : 'text-teal-400'}`} />
          </motion.button>

          <motion.div
            animate={isPlaying ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="w-16 h-16 rounded-lg flex items-center justify-center bg-slate-800 border-2 border-slate-700"
          >
            <Volume2 className={`w-8 h-8 ${isPlaying ? 'text-teal-400' : 'text-slate-600'}`} />
          </motion.div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
          <motion.div
            className="h-full bg-gradient-to-r from-teal-500 to-teal-300"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* Song Complete Message */}
        <AnimatePresence>
          {progress >= 100 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-teal-900/50 p-4 rounded-lg border border-teal-500/50"
            >
              <p className="text-teal-300 font-mono font-bold">
                🎵 Track Complete! Opening... 🎵
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}