import React, { useState, useRef } from 'react';
import { FileBox, Mic, Send, RotateCcw, Play, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface MediaItem {
  id: string;
  type: 'photo' | 'video' | 'audio';
  url: string;
  blob: Blob;
  timestamp: number;
  thumbnail?: string;
}

interface RecordingModalProps {
  media: MediaItem;
  onSendToCapsule: () => void;
  onRetake: () => void;
  isSaving?: boolean;
  onEnhance?: () => void;
}

export function RecordingModal({ media, onSendToCapsule, onRetake, isSaving = false, onEnhance }: RecordingModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  return (
    <div className="fixed inset-0 z-[100] bg-black" style={{ height: '100vh', width: '100vw', overflow: 'auto' }}>
      {/* Scrollable content */}
      <div className="relative min-h-screen pb-48">
        {/* Media Preview - Fixed height section */}
        <div className="relative w-full bg-black" style={{ height: '65vh', minHeight: '400px' }}>
          {media.type === 'photo' && (
            <img
              src={media.url}
              alt="Captured photo"
              className="absolute inset-0 w-full h-full object-contain"
            />
          )}
          
          {media.type === 'video' && (
            <>
              <video
                ref={videoRef}
                src={media.url}
                playsInline
                muted={false}
                preload="auto"
                poster={media.thumbnail}
                className="absolute inset-0 w-full h-full object-contain bg-black"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                onLoadedData={() => {
                  console.log('✅ Video loaded successfully');
                }}
                onError={(e) => {
                  console.error('❌ Video load error:', e);
                  toast.error('Failed to load video');
                }}
              />
              
              {/* CENTERED white play button - only when paused */}
              {!isPlaying && (
                <button
                  onClick={handlePlayPause}
                  className="absolute inset-0 w-full h-full flex items-center justify-center bg-transparent"
                  style={{ zIndex: 100 }}
                >
                  <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl">
                    <Play className="w-10 h-10 text-black ml-1" fill="currentColor" />
                  </div>
                </button>
              )}
              
              {/* Tap to pause when playing */}
              {isPlaying && (
                <button
                  onClick={handlePlayPause}
                  className="absolute inset-0 w-full h-full bg-transparent"
                  style={{ zIndex: 50 }}
                  aria-label="Pause video"
                />
              )}
            </>
          )}
          
          {media.type === 'audio' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
              <div className="p-8 rounded-full bg-white/10 backdrop-blur-sm">
                <Mic className="w-16 h-16 text-white" />
              </div>
              <audio src={media.url} controls className="w-full max-w-md px-4" />
            </div>
          )}
        </div>

        {/* Action Buttons - Positioned below video */}
        <div className="relative w-full p-4 bg-gradient-to-t from-slate-950 via-slate-900 to-black border-t border-purple-500/20">
          <div className="flex flex-col gap-3 max-w-2xl mx-auto">
            {/* Single Row: All 3 Actions */}
            <div className="grid grid-cols-3 gap-3">
              {/* 🟢 Send to Capsule - Premium emerald gradient with glow */}
              <button
                onClick={onSendToCapsule}
                disabled={isSaving}
                className="group relative h-20 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 disabled:opacity-50 disabled:saturate-50 flex flex-col items-center justify-center gap-2 border-2 border-emerald-300/40 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 overflow-hidden"
              >
                {/* Animated shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                {/* Icon with subtle pulse */}
                <div className="relative z-10">
                  <Send className="w-6 h-6 text-white drop-shadow-md group-hover:rotate-12 transition-transform duration-300" />
                </div>
                
                {/* Text with better typography */}
                <span className="relative z-10 text-xs font-semibold text-white drop-shadow-md tracking-wide">
                  {isSaving ? 'Saving...' : 'Send to Capsule'}
                </span>
                
                {/* Subtle inner glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
              </button>

              {/* 🎬 HIDE ENHANCE FOR VIDEOS: Videos cannot be enhanced */}
              {onEnhance && media.type !== 'video' && (
                /* 🎨 Enhance - Vibrant pink/orange gradient with sparkle */
                <button
                  onClick={onEnhance}
                  disabled={isSaving}
                  className="group relative h-20 rounded-2xl bg-gradient-to-br from-pink-400 via-rose-500 to-orange-500 disabled:opacity-50 disabled:saturate-50 flex flex-col items-center justify-center gap-2 border-2 border-pink-300/40 shadow-lg shadow-pink-500/25 hover:shadow-pink-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 overflow-hidden"
                >
                  {/* Animated shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  
                  {/* Icon with sparkle animation */}
                  <div className="relative z-10">
                    <Sparkles className="w-6 h-6 text-white drop-shadow-md group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  
                  {/* Text with better typography */}
                  <span className="relative z-10 text-xs font-semibold text-white drop-shadow-md tracking-wide">
                    Enhance
                  </span>
                  
                  {/* Subtle inner glow */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                </button>
              )}

              {/* 🔄 Retake - Premium gradient to match the others */}
              <button
                onClick={onRetake}
                disabled={isSaving}
                className="group relative h-20 rounded-2xl bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700 disabled:opacity-50 disabled:saturate-50 flex flex-col items-center justify-center gap-2 border-2 border-slate-400/40 shadow-lg shadow-slate-500/25 hover:shadow-slate-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 overflow-hidden"
              >
                {/* Animated shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                {/* Icon with rotation animation */}
                <div className="relative z-10">
                  <RotateCcw className="w-6 h-6 text-white drop-shadow-md group-hover:rotate-[-180deg] transition-transform duration-500" />
                </div>
                
                {/* Text with better typography */}
                <span className="relative z-10 text-xs font-semibold text-white drop-shadow-md tracking-wide">
                  Retake
                </span>
                
                {/* Subtle inner glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}