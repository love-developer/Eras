import React, { useState, useRef, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog@1.1.6';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden@1.1.1';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Play, Pause, Volume2, VolumeX, Download, RotateCw, X, FileText } from 'lucide-react';

interface MediaPreviewModalProps {
  // Support both interfaces for flexibility
  isOpen?: boolean;
  onClose: () => void;
  mediaFile?: {
    id: string;
    file_name: string;
    file_type: string;
    file_size: number;
    url?: string;
    created_at: string;
  } | null | undefined;
  // Alternative interface from CreateCapsule
  media?: {
    id: string;
    file: File;
    type: 'image' | 'video' | 'audio' | 'document';
    mimeType?: string;
    url: string;
    size: number;
  } | null | undefined;
}

export function MediaPreviewModal({ isOpen, onClose, mediaFile, media }: MediaPreviewModalProps) {
  // Normalize the media object to match expected interface
  const normalizedMedia = media ? {
    id: media.id,
    file_name: media.file.name,
    file_type: media.mimeType || media.file.type,
    file_size: media.size,
    url: media.url,
    created_at: new Date().toISOString()
  } : mediaFile;
  
  // Auto-determine isOpen if media is provided
  const isModalOpen = isOpen !== undefined ? isOpen : !!media;
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([0.7]);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Early return if no media file
  if (!normalizedMedia) {
    return null;
  }

  useEffect(() => {
    if (isModalOpen) {
      setIsLoading(true);
      setError(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [isModalOpen, normalizedMedia?.id]);

  // NEW: Actively check for duration on video/audio elements
  useEffect(() => {
    if (!isModalOpen) return;
    
    // Continuous polling until duration is found
    const intervalId = setInterval(() => {
      const media = videoRef.current || audioRef.current;
      if (media && isFinite(media.duration) && media.duration > 0) {
        console.log('🔍 Duration detected via polling:', media.duration);
        setDuration(media.duration);
        clearInterval(intervalId); // Stop polling once found
      }
    }, 50); // Check every 50ms
    
    // Stop polling after 3 seconds to avoid infinite checking
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      console.log('⏱️ Duration polling stopped after 3 seconds');
    }, 3000);
    
    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [isModalOpen, normalizedMedia?.id]);

  const handlePlayPause = () => {
    const media = videoRef.current || audioRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
    } else {
      media.play();
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(value);
    const media = videoRef.current || audioRef.current;
    if (media) {
      media.volume = newVolume;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const media = videoRef.current || audioRef.current;
    if (!media) return;

    if (isMuted) {
      const restoredVolume = volume[0] > 0 ? volume[0] : 0.7;
      media.volume = restoredVolume;
      setVolume([restoredVolume]);
      setIsMuted(false);
    } else {
      media.volume = 0;
      setIsMuted(true);
    }
  };

  const handleSeek = (value: number[]) => {
    const media = videoRef.current || audioRef.current;
    if (media) {
      media.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleDownload = async () => {
    if (!normalizedMedia.url) {
      console.error('No URL available for download');
      return;
    }

    try {
      // Fetch the file with proper credentials
      const response = await fetch(normalizedMedia.url);
      const blob = await response.blob();
      
      // Create blob URL and download
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = normalizedMedia.file_name || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up blob URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      
      console.log('✅ Download initiated:', normalizedMedia.file_name);
    } catch (error) {
      console.error('❌ Download failed:', error);
      // Fallback to direct link
      const a = document.createElement('a');
      a.href = normalizedMedia.url;
      a.download = normalizedMedia.file_name;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
      return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const renderImagePreview = () => (
    <div className="relative flex items-center justify-center bg-black rounded-lg overflow-hidden" style={{ minHeight: '200px', maxHeight: '60vh', width: '100%' }}>
      <img
        src={normalizedMedia.url || ''}
        alt={normalizedMedia.file_name}
        className="object-contain"
        style={{ maxWidth: '100%', maxHeight: '60vh' }}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setError('Failed to load image');
          setIsLoading(false);
        }}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <RotateCw className="w-8 h-8 animate-spin text-white" />
        </div>
      )}
    </div>
  );

  const renderVideoPreview = () => (
    <div className="flex flex-col bg-black rounded-lg overflow-hidden">
      <div className="relative flex items-center justify-center" style={{ minHeight: '200px', maxHeight: '50vh', width: '100%' }}>
        <video
          ref={(element) => {
            videoRef.current = element;
            // CRITICAL: Check duration immediately when element is mounted
            if (element && isFinite(element.duration) && element.duration > 0) {
              console.log('🎬 Duration found on mount via ref callback:', element.duration);
              setDuration(element.duration);
            }
          }}
          src={normalizedMedia.url || ''}
          className="object-contain"
          style={{ maxWidth: '100%', maxHeight: '50vh' }}
          playsInline
          preload="auto"
          onLoadStart={() => {
            console.log('🎬 Video load start:', normalizedMedia.url?.substring(0, 100));
            console.log('🎬 Video file type:', normalizedMedia.file_type);
          }}
          onLoadedMetadata={(e) => {
            const video = e.currentTarget;
            console.log('🎬 Video metadata loaded, duration:', video.duration, 'isFinite:', isFinite(video.duration));
            setIsLoading(false);
            if (video && isFinite(video.duration) && video.duration > 0) {
              console.log('✅ Setting duration from loadedmetadata:', video.duration);
              setDuration(video.duration);
              video.volume = volume[0];
            }
          }}
          onLoadedData={(e) => {
            const video = e.currentTarget;
            console.log('🎬 Video data loaded, duration:', video.duration);
            setIsLoading(false);
            if (video && isFinite(video.duration) && video.duration > 0) {
              console.log('✅ Setting duration from loadeddata:', video.duration);
              setDuration(video.duration);
            }
          }}
          onCanPlay={() => {
            const video = videoRef.current;
            console.log('🎬 Video can play, duration:', video?.duration);
            setIsLoading(false);
            if (video && isFinite(video.duration) && video.duration > 0) {
              console.log('✅ Setting duration from canplay:', video.duration);
              setDuration(video.duration);
            }
          }}
          onDurationChange={(e) => {
            const video = e.currentTarget;
            console.log('🎬 Duration changed:', video.duration);
            if (video && isFinite(video.duration) && video.duration > 0) {
              console.log('✅ Setting duration from durationchange:', video.duration);
              setDuration(video.duration);
            }
          }}
          onTimeUpdate={(e) => {
            const video = e.currentTarget;
            if (video) {
              setCurrentTime(video.currentTime);
              // Fallback: if duration is still 0 but video is playing, set it now
              if (duration === 0 && isFinite(video.duration) && video.duration > 0) {
                console.log('✅ Setting duration from timeupdate (fallback):', video.duration);
                setDuration(video.duration);
              }
            }
          }}
          onPlay={() => {
            const video = videoRef.current;
            console.log('🎬 Video playing, duration:', video?.duration);
            setIsPlaying(true);
            setIsLoading(false);
            // One more check when play starts
            if (video && isFinite(video.duration) && video.duration > 0) {
              console.log('✅ Setting duration from play event:', video.duration);
              setDuration(video.duration);
            }
          }}
          onPause={() => {
            console.log('🎬 Video paused');
            setIsPlaying(false);
          }}
          onError={(e) => {
            const video = e.currentTarget;
            console.error('❌ Video error:', {
              url: normalizedMedia.url,
              fileName: normalizedMedia.file_name,
              fileType: normalizedMedia.file_type,
              errorCode: video.error?.code,
              errorMessage: video.error?.message,
              networkState: video.networkState,
              readyState: video.readyState
            });
            setError('Failed to load video - check browser console for details');
            setIsLoading(false);
          }}
        />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <RotateCw className="w-8 h-8 animate-spin text-white" />
          </div>
        )}
      </div>
      
      <div className="bg-slate-900/95 backdrop-blur-sm p-4 space-y-3 border-t border-white/10">
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={handlePlayPause} className="text-white hover:bg-white/10">
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          
          <div className="flex-1">
            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="cursor-pointer [&_[data-slot=slider-track]]:bg-white/20 [&_[data-slot=slider-range]]:bg-purple-500 [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:border-purple-500"
              disabled={!duration || duration === 0}
            />
          </div>
          
          <span className="text-sm text-white/80 tabular-nums min-w-[80px] text-right">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={toggleMute} className="text-white hover:bg-white/10">
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
          
          <div className="w-24">
            <Slider
              value={isMuted ? [0] : volume}
              min={0}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="cursor-pointer [&_[data-slot=slider-track]]:bg-white/20 [&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:border-white"
              dir="ltr"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderAudioPreview = () => (
    <div className="flex flex-col items-center justify-center bg-black rounded-lg p-8" style={{ minHeight: '300px' }}>
      <div className="w-full max-w-md bg-slate-900/95 backdrop-blur-sm rounded-lg p-8 space-y-6">
        <div className="flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Volume2 className="w-12 h-12 text-purple-400" />
          </div>
        </div>
        
        <audio
          ref={(element) => {
            audioRef.current = element;
            // CRITICAL: Check duration immediately when element is mounted
            if (element && isFinite(element.duration) && element.duration > 0) {
              console.log('🎵 Duration found on mount via ref callback:', element.duration);
              setDuration(element.duration);
            }
          }}
          src={normalizedMedia.url || ''}
          preload="auto"
        />
        
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" onClick={handlePlayPause} className="text-white hover:bg-white/10">
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>
            
            <div className="flex-1">
              <Slider
                value={[currentTime]}
                min={0}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="cursor-pointer [&_[data-slot=slider-track]]:bg-white/20 [&_[data-slot=slider-range]]:bg-purple-500 [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:border-purple-500"
                disabled={!duration || duration === 0}
              />
            </div>
            
            <span className="text-sm text-white/80 tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" onClick={toggleMute} className="text-white hover:bg-white/10">
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
            
            <div className="flex-1">
              <Slider
                value={isMuted ? [0] : volume}
                min={0}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="cursor-pointer [&_[data-slot=slider-track]]:bg-white/20 [&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:border-white"
                dir="ltr"
              />
            </div>
          </div>
        </div>
        
        {isLoading && (
          <div className="flex items-center justify-center">
            <RotateCw className="w-6 h-6 animate-spin text-white" />
          </div>
        )}
      </div>
    </div>
  );

  const renderDocumentPreview = () => (
    <div className="flex flex-col items-center justify-center bg-black rounded-lg p-8" style={{ minHeight: '300px' }}>
      <div className="w-full max-w-md bg-slate-900/95 backdrop-blur-sm rounded-lg p-8 space-y-6">
        <div className="flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-amber-500/20 flex items-center justify-center">
            <FileText className="w-12 h-12 text-amber-400" />
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-white">
            {normalizedMedia.file_name}
          </h3>
          <p className="text-sm text-white/60">
            {formatFileSize(normalizedMedia.file_size)}
          </p>
        </div>
        
        <Button 
          onClick={handleDownload}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-2"
        >
          <Download className="w-4 h-4" />
          Download to View
        </Button>
      </div>
    </div>
  );

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex items-center justify-center bg-black rounded-lg p-8" style={{ minHeight: '300px' }}>
          <div className="text-center text-white">
            <p className="mb-4">{error}</p>
            <Button variant="outline" onClick={onClose} className="border-white/20 text-white hover:bg-white/10">
              Close
            </Button>
          </div>
        </div>
      );
    }

    const fileType = normalizedMedia.file_type?.toLowerCase() || '';
    
    if (fileType.includes('image')) {
      return renderImagePreview();
    } else if (fileType.includes('video')) {
      return renderVideoPreview();
    } else if (fileType.includes('audio')) {
      return renderAudioPreview();
    } else if (fileType.includes('application') || fileType.includes('text/')) {
      return renderDocumentPreview();
    }

    return (
      <div className="flex items-center justify-center bg-black rounded-lg p-8" style={{ minHeight: '300px' }}>
        <div className="text-center text-white">
          <p className="mb-4">Preview not available for this file type</p>
          <Button variant="outline" onClick={handleDownload} className="border-white/20 text-white hover:bg-white/10">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    );
  };

  console.log('🎭 MediaPreviewModal FINAL render check:', { isOpen: isModalOpen, mediaFileName: normalizedMedia?.file_name });
  
  if (!isModalOpen) {
    console.log('⛔ MediaPreviewModal NOT rendering - isOpen is false');
    return null;
  }

  console.log('✅ MediaPreviewModal IS rendering - creating Dialog');

  return (
    <DialogPrimitive.Root open={isModalOpen} onOpenChange={(open) => {
      // Only allow closing via explicit user actions (X button or Escape key)
      // Do NOT allow closing by clicking outside - this prevents mobile touch issues
      console.log('🔔 MediaPreviewModal onOpenChange:', { open });
      if (!open) {
        onClose();
      }
    }}>
      <DialogPrimitive.Portal>
        {/* Dark overlay - click to close disabled to prevent mobile issues */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-[10100] bg-black/80 backdrop-blur-sm pointer-events-auto" />
        
        {/* Modal content - centered with max width */}
        <DialogPrimitive.Content 
          className="fixed left-1/2 top-1/2 z-[10200] w-[90vw] max-w-4xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 bg-slate-950 rounded-lg shadow-xl focus:outline-none pointer-events-auto overflow-hidden"
          onPointerDownOutside={(e) => {
            // CRITICAL: Always prevent outside clicks from closing modal on mobile
            console.log('🚫 Pointer down outside - BLOCKING');
            e.preventDefault();
          }}
          onInteractOutside={(e) => {
            // CRITICAL: Always prevent outside interactions from closing modal
            console.log('🚫 Interact outside - BLOCKING');
            e.preventDefault();
          }}
        >
          {/* Accessible title and description - visually hidden */}
          <DialogPrimitive.Title asChild>
            <VisuallyHidden.Root>{normalizedMedia.file_name}</VisuallyHidden.Root>
          </DialogPrimitive.Title>
          <DialogPrimitive.Description asChild>
            <VisuallyHidden.Root>
              Media preview - {normalizedMedia.file_type} - {formatFileSize(normalizedMedia.file_size)}
            </VisuallyHidden.Root>
          </DialogPrimitive.Description>

          {/* Header */}
          <div className="relative z-[10001] flex items-center justify-between gap-4 bg-slate-900/95 backdrop-blur-sm border-b border-white/10 p-4 rounded-t-lg">
            <div className="flex-1 min-w-0">
              <h3 className="text-white truncate font-medium">{normalizedMedia.file_name}</h3>
              <div className="flex items-center gap-2 text-xs text-white/60 mt-1">
                <span>{formatFileSize(normalizedMedia.file_size)}</span>
                <span>•</span>
                <span className="truncate">{normalizedMedia.file_type}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 relative z-[10002]">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Download button clicked');
                  handleDownload();
                }}
                className="flex items-center gap-2 h-9 px-3 rounded-md bg-transparent hover:bg-white/10 text-white transition-colors cursor-pointer whitespace-nowrap flex-shrink-0"
              >
                <Download className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">Download</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('✖️ Close button clicked - closing modal');
                  onClose();
                }}
                className="flex items-center justify-center h-9 w-9 rounded-md bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-white/20 cursor-pointer text-xl"
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>
          
          {/* Media content */}
          <div className="p-4 overflow-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
            {renderContent()}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}