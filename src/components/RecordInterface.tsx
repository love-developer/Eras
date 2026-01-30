import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { 
  Camera, 
  Video, 
  Mic, 
  Maximize, 
  Minimize,
  RotateCw,
  Circle,
  Square,
  X
} from 'lucide-react';
import { RecordingModal } from './RecordingModal';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { uploadWithTUS } from '../utils/tus-upload';

// ZOOM FIX v10: 1x=20%, 2x=40% native zoom + condensed spacing
// LIBRARY PREVIEW v2: Background-image fill fix
type RecordingMode = 'photo' | 'video' | 'audio';

interface MediaItem {
  id: string;
  type: RecordingMode;
  url: string;
  blob: Blob;
  timestamp: number;
  thumbnail?: string;
  filename?: string;
}

export function RecordInterface({ onMediaCaptured, onOpenVault, onEnhance, onClose, onRegisterRestoreCallback }) {
  const [mode, setMode] = useState<RecordingMode>('video');
  const onMediaCapturedRef = React.useRef(onMediaCaptured);
  const onEnhanceRef = React.useRef(onEnhance);
  const enhancingMediaRef = React.useRef<MediaItem | null>(null); // Store media while in enhancement mode
  
  React.useEffect(() => {
    onMediaCapturedRef.current = onMediaCaptured;
  }, [onMediaCaptured]);
  
  React.useEffect(() => {
    onEnhanceRef.current = onEnhance;
  }, [onEnhance]);
  
  // Register restore callback on mount
  React.useEffect(() => {
    if (onRegisterRestoreCallback) {
      const restoreMedia = (media: MediaItem) => {
        console.log('🔄 Restoring media to RecordInterface after enhancement cancel:', media.id);
        setCurrentMedia(media);
        setShowModal(true);
        enhancingMediaRef.current = null;
      };
      onRegisterRestoreCallback(restoreMedia);
    }
  }, [onRegisterRestoreCallback]);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isRecording, setIsRecording] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<MediaItem | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastThumbnail, setLastThumbnail] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [supportsNativeZoom, setSupportsNativeZoom] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const initializingRef = useRef<boolean>(false);
  const zoomLevels = [0.5, 1, 2];

  // COMPREHENSIVE LAYOUT RESET FUNCTION
  const resetAllLayoutState = () => {
    console.log('🔄 RecordInterface: Comprehensive layout reset starting...');
    
    // Exit fullscreen if somehow still active
    if (document.fullscreenElement) {
      try {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      } catch (err) {
        console.error('Error exiting fullscreen on mount:', err);
      }
    }
    
    // Reset fullscreen state
    setIsFullscreen(false);
    
    // Reset zoom to default (1x)
    setZoomLevel(1);
    
    // Reset video element - ALL styles
    if (videoRef.current) {
      videoRef.current.style.transform = '';
      videoRef.current.style.transformOrigin = '';
      videoRef.current.style.width = '100%';
      videoRef.current.style.height = '100%';
      videoRef.current.style.objectFit = 'cover';
      videoRef.current.style.position = '';
      videoRef.current.style.left = '';
      videoRef.current.style.right = '';
      videoRef.current.style.top = '';
      videoRef.current.style.bottom = '';
    }
    
    // Reset container - ALL inline styles
    if (containerRef.current) {
      containerRef.current.style.transform = '';
      containerRef.current.style.left = '';
      containerRef.current.style.right = '';
      containerRef.current.style.top = '';
      containerRef.current.style.bottom = '';
      containerRef.current.style.width = '';
      containerRef.current.style.height = '';
    }
    
    // Force a reflow to ensure styles are applied
    if (containerRef.current) {
      void containerRef.current.offsetHeight;
    }
    
    console.log('✅ Layout state reset complete');
  };

  // CRITICAL FIX: Reset layout state when component mounts or mode changes
  useEffect(() => {
    resetAllLayoutState();
  }, [mode]);

  // Initialize camera/microphone
  useEffect(() => {
    // Prevent multiple simultaneous initializations
    if (initializingRef.current) {
      console.log('⏳ Camera initialization already in progress, skipping...');
      return;
    }

    const initMedia = async () => {
      try {
        initializingRef.current = true;
        
        // Clean up any existing stream first
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        // Small delay to ensure cleanup is complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (mode === 'audio') {
          await initAudio();
        } else {
          await initCamera();
        }
      } catch (err) {
        console.error('Error during media initialization:', err);
      } finally {
        initializingRef.current = false;
      }
    };

    initMedia();

    return () => {
      cleanup();
    };
  }, [mode, facingMode]);

  // Pre-set video element size to prevent loading glitch
  useEffect(() => {
    if (videoRef.current && mode !== 'audio') {
      videoRef.current.style.width = '100%';
      videoRef.current.style.height = '100%';
      videoRef.current.style.objectFit = 'cover';
    }
  }, [mode]);

  // Load last thumbnail from library
  useEffect(() => {
    loadLastThumbnail();
  }, []);

  // Auto-scroll to center camera on screen when component mounts
  useEffect(() => {
    const scrollToCamera = () => {
      if (containerRef.current) {
        containerRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(scrollToCamera, 100);
    return () => clearTimeout(timer);
  }, []);

  const loadLastThumbnail = async () => {
    try {
      // Try to load from backend Vault first
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-vault`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.records && data.records.length > 0) {
            // Find the most recent video or image (skip audio)
            const lastMediaRecord = data.records.find(
              (record: any) => record.type === 'video' || record.type === 'photo'
            );
            if (lastMediaRecord) {
              setLastThumbnail(lastMediaRecord.thumbnail || lastMediaRecord.url);
              return;
            }
          }
        }
      }
      
      // Fallback to localStorage
      const stored = localStorage.getItem('legacyVault');
      if (stored) {
        const vault = JSON.parse(stored);
        // Find the most recent video or image (skip audio)
        const lastMediaItem = vault.slice().reverse().find(
          (item: any) => item.type === 'video' || item.type === 'photo'
        );
        if (lastMediaItem) {
          setLastThumbnail(lastMediaItem.thumbnail || lastMediaItem.base64Data);
        }
      }
    } catch (err) {
      console.error('Failed to load last thumbnail:', err);
    }
  };

  const initCamera = async () => {
    try {
      setError(null);
      setCameraReady(false);

      console.log('🎥 Initializing camera...');
      
      // Detect platform
      const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
      const isDesktop = !/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      console.log(`Platform: ${isMac ? 'macOS/iOS' : 'Other'}, Desktop: ${isDesktop}`);

      // Request the widest field of view possible
      // For desktop (especially macOS), use simpler constraints to ensure compatibility
      const constraints: any = {
        video: isDesktop ? {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } : {
          facingMode: facingMode,
          width: { ideal: 1920, max: 3840 },
          height: { ideal: 1080, max: 2160 }
        },
        audio: mode === 'video'
      };

      console.log('📹 Requesting camera with constraints:', constraints);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Check zoom capabilities
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities();
        
        // Check if native zoom is supported
        if ('zoom' in capabilities && capabilities.zoom) {
          setSupportsNativeZoom(true);
        } else {
          setSupportsNativeZoom(false);
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (err: any) {
      console.error('❌ Camera error:', err);
      
      // Don't show error for aborted operations (happens during rapid mode switching)
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        console.log('⚠️ Camera initialization was aborted (likely due to mode switch)');
        return;
      }
      
      setError(err.message || 'Failed to access camera');
    }
  };

  // Apply zoom to video track when zoom level changes
  useEffect(() => {
    const applyZoom = async () => {
      // Safety check: Don't apply zoom if modal is showing
      if (showModal) {
        console.log('⏭️ Skipping zoom application - modal is visible');
        return;
      }
      
      if (!streamRef.current || mode === 'audio') {
        return;
      }
      
      if (!cameraReady) {
        return;
      }
      
      if (!videoRef.current) {
        return;
      }

      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (!videoTrack) {
        return;
      }

      console.log('🔍 Applying zoom level:', zoomLevel);

      try {
        const capabilities = videoTrack.getCapabilities();
        
        // Check if the device supports native zoom
        if (supportsNativeZoom && 'zoom' in capabilities && capabilities.zoom) {
          const maxZoom = capabilities.zoom.max || 4;
          const minZoom = capabilities.zoom.min || 1;
          
          // Strategy: Map UI zoom to actual camera zoom
          // 0.5x = minZoom (widest angle available)
          // 1x = minZoom * 1.33 (zoomed in from wide)
          // 2x = minZoom * 1.75 (more zoomed in)
          let targetZoom = minZoom;
          
          if (zoomLevel === 0.5) {
            // 0.5x: Wide-angle - use minimum zoom (widest field of view)
            targetZoom = minZoom;
          } else if (zoomLevel === 1) {
            // 1x: Normal view - zoom in 33% from minimum
            targetZoom = Math.min(minZoom * 1.33, maxZoom);
          } else if (zoomLevel === 2) {
            // 2x: Portrait zoom - zoom in 75% from minimum
            targetZoom = Math.min(minZoom * 1.75, maxZoom);
          }
          
          await videoTrack.applyConstraints({
            advanced: [{ zoom: targetZoom }]
          });
          
          // Reset any CSS transforms when using native zoom - CRITICAL
          videoRef.current.style.transform = 'none';
          videoRef.current.style.transformOrigin = 'center center';
          
          console.log('✅ Native zoom applied:', targetZoom);
        } else {
          // Use CSS-based zoom fallback for devices without native zoom support
          // Camera scaling: 0.5x=100% (baseline), 1x=133%, 2x=175%
          let scale = 1;
          
          if (zoomLevel === 0.5) {
            // 0.5x: Wide view - no scale (full frame)
            scale = 1;
          } else if (zoomLevel === 1) {
            // 1x: Normal view - 133% zoom
            scale = 1.33;
          } else if (zoomLevel === 2) {
            // 2x: Portrait zoom - 175% zoom
            scale = 1.75;
          }
          
          // CRITICAL: Apply transform safely with overflow protection
          videoRef.current.style.transform = `scale(${scale})`;
          videoRef.current.style.transformOrigin = 'center center';
          
          // Ensure parent container can contain the scaled video
          const parentDiv = videoRef.current.parentElement;
          if (parentDiv) {
            parentDiv.style.overflow = 'hidden';
          }
          
          console.log('✅ CSS zoom applied:', scale);
        }
      } catch (err) {
        console.warn('⚠️ Zoom application failed, using fallback:', err.message);
        // Fallback to CSS zoom on error
        let scale = 1;
        
        if (zoomLevel === 0.5) {
          scale = 0.75; // 75% - wide view
        } else if (zoomLevel === 1) {
          scale = 1; // 100% - baseline
        } else if (zoomLevel === 2) {
          scale = 1.4; // 140% - portrait zoom
        }
        
        videoRef.current.style.transform = `scale(${scale})`;
        videoRef.current.style.transformOrigin = 'center center';
      }
    };

    // Add a small delay to ensure camera is fully initialized
    const timeoutId = setTimeout(() => {
      applyZoom();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [zoomLevel, mode, cameraReady, supportsNativeZoom, showModal]);

  // CRITICAL: Reset layout and ensure video plays when modal is closed
  useEffect(() => {
    if (!showModal && videoRef.current && streamRef.current && mode !== 'audio') {
      console.log('🎥 Modal closed - resetting video layout and ensuring playback');
      
      // IMMEDIATE reset of transforms before video becomes visible
      if (videoRef.current) {
        videoRef.current.style.transform = '';
        videoRef.current.style.transformOrigin = '';
        videoRef.current.style.width = '100%';
        videoRef.current.style.height = '100%';
        videoRef.current.style.objectFit = 'cover';
      }
      
      // Force a reflow
      if (videoRef.current) {
        void videoRef.current.offsetHeight;
      }
      
      // Then ensure video is playing
      videoRef.current.play().catch(err => {
        console.warn('Video play failed:', err);
      });
      
      console.log('✅ Video layout reset and playback resumed');
    }
  }, [showModal, mode]);

  const initAudio = async () => {
    try {
      setError(null);
      setCameraReady(false);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setCameraReady(true);
    } catch (err: any) {
      console.error('Microphone error:', err);
      
      // Don't show error for aborted operations (happens during rapid mode switching)
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        console.log('⚠️ Audio initialization was aborted (likely due to mode switch)');
        return;
      }
      
      setError(err.message || 'Failed to access microphone');
    }
  };

  const cleanup = () => {
    console.log('🧹 Cleanup called - stopping all streams and resetting layout');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    
    // CRITICAL: Reset layout on cleanup
    resetAllLayoutState();
  };

  // CRITICAL: Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting - final cleanup');
      cleanup();
    };
  }, []);

  // CRITICAL: Lock body scroll to prevent horizontal/vertical scroll issues
  useEffect(() => {
    // Save original overflow
    const originalOverflow = document.body.style.overflow;
    const originalOverflowX = document.body.style.overflowX;
    
    // Lock scroll
    document.body.style.overflow = 'hidden';
    document.body.style.overflowX = 'hidden';
    
    console.log('🔒 Body scroll locked');
    
    return () => {
      // Restore original overflow
      document.body.style.overflow = originalOverflow;
      document.body.style.overflowX = originalOverflowX;
      console.log('🔓 Body scroll unlocked');
    };
  }, []);

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const timestamp = Date.now();
      const media: MediaItem = {
        id: timestamp.toString(),
        type: 'photo',
        url,
        blob,
        timestamp,
        thumbnail: url,
        filename: `photo-${timestamp}.jpg`
      };

      setCurrentMedia(media);
      setShowModal(true);
    }, 'image/jpeg', 0.95);
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    setRecordingDuration(0);

    const options = mode === 'video' 
      ? { mimeType: 'video/webm;codecs=vp8,opus' }
      : { mimeType: 'audio/webm;codecs=opus' };

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: options.mimeType });
        const url = URL.createObjectURL(blob);

        // Generate thumbnail for video
        let thumbnail: string | undefined;
        if (mode === 'video' && videoRef.current) {
          const canvas = document.createElement('canvas');
          canvas.width = 200;
          canvas.height = 150;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, 200, 150);
            thumbnail = canvas.toDataURL('image/jpeg', 0.7);
          }
        }

        const timestamp = Date.now();
        const fileExtension = mode === 'video' ? 'webm' : 'webm';
        const media: MediaItem = {
          id: timestamp.toString(),
          type: mode,
          url,
          blob,
          timestamp,
          thumbnail,
          filename: `${mode}-${timestamp}.${fileExtension}`
        };

        setCurrentMedia(media);
        setShowModal(true);
      };

      mediaRecorder.start(1000); // Capture in 1-second chunks
      setIsRecording(true);
    } catch (err) {
      console.error('Recording error:', err);
      setError('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingDuration(0);
    }
  };

  // Timer for recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const toggleFullscreen = async () => {
    try {
      if (!containerRef.current) {
        console.warn('⚠️ Container ref not available');
        return;
      }

      if (!isFullscreen) {
        // Try different fullscreen methods for cross-browser compatibility
        const elem = containerRef.current;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
          console.log('✅ Entered fullscreen mode');
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
          console.log('✅ Entered fullscreen mode (webkit)');
        } else if (elem.mozRequestFullScreen) {
          await elem.mozRequestFullScreen();
          console.log('✅ Entered fullscreen mode (moz)');
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
          console.log('✅ Entered fullscreen mode (ms)');
        } else {
          console.warn('⚠️ Fullscreen API not supported on this browser');
          toast.error('Fullscreen not supported on this browser');
          return;
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          console.log('✅ Exited fullscreen mode');
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
          console.log('✅ Exited fullscreen mode (webkit)');
        } else if (document.mozCancelFullScreen) {
          await document.mozCancelFullScreen();
          console.log('✅ Exited fullscreen mode (moz)');
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
          console.log('✅ Exited fullscreen mode (ms)');
        }
      }
    } catch (err) {
      console.error('❌ Fullscreen error:', err);
      // Some browsers require user gesture - show helpful message
      if (err.name === 'TypeError' || err.message.includes('user gesture')) {
        toast.error('Please click the button directly to enable fullscreen');
      }
    }
  };

  // Listen for fullscreen changes to keep state in sync
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      console.log('🖥️ Fullscreen state changed:', isCurrentlyFullscreen);
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Save media to Vault (backend or localStorage)
  const saveMediaToVault = async (media: MediaItem): Promise<void> => {
    // Helper to timeout a promise
    const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
        )
      ]);
    };

    try {
      console.log('🏛️ Uploading media to backend Vault...');
      
      // Get auth token with timeout
      const { data: { session } } = await withTimeout(
        supabase.auth.getSession(),
        3000
      );
      
      if (!session) {
        console.error('No active session - saving to localStorage as fallback');
        // Fallback to localStorage if not authenticated
        await saveToLocalStorage(media);
        return;
      }

      // Determine upload strategy based on file size
      const TUS_THRESHOLD = 50 * 1024 * 1024; // 50MB
      const useTUS = media.blob.size >= TUS_THRESHOLD;

      if (useTUS) {
        // 🚀 LARGE FILES: Use TUS protocol for reliable chunked uploads
        const sizeMB = (media.blob.size / (1024 * 1024)).toFixed(1);
        console.log(`📦 Large file (${sizeMB}MB) - using TUS protocol for vault upload`);
        
        // Convert blob to File object for TUS
        const fileName = media.filename || `${media.type}-${media.timestamp}.${getFileExtension(media.blob.type)}`;
        const file = new File([media.blob], fileName, {
          type: media.blob.type
        });
        
        try {
          // Upload using TUS protocol with progress tracking
          let toastId: string | number | undefined;
          const result = await uploadWithTUS(
            file,
            session.user.id,
            'vault_direct', // Special capsule ID for direct vault uploads
            session.access_token,
            {
              onProgress: (progress) => {
                console.log(`📤 Vault upload progress: ${progress}%`);
                // 🚀 UX IMPROVEMENT: Show non-blocking progress toast
                if (progress < 100) {
                  if (!toastId) {
                    toastId = toast.info(`Backing up to vault: ${progress}%`, { 
                      duration: Infinity,
                      description: 'You can continue using the app'
                    });
                  } else {
                    toast.info(`Backing up to vault: ${progress}%`, { 
                      id: toastId, 
                      duration: Infinity,
                      description: 'You can continue using the app'
                    });
                  }
                }
              }
            }
          );
          
          // Dismiss progress toast
          if (toastId) {
            toast.dismiss(toastId);
          }
          
          console.log('✅ TUS upload completed:', result.mediaId);
          
          // 🎬 CRITICAL FIX: Upload thumbnail separately for large video files
          let thumbnailPath = null;
          if (media.type === 'video' && media.thumbnail) {
            try {
              console.log('📸 Uploading video thumbnail for large file...');
              const thumbnailBlob = await fetch(media.thumbnail).then(r => r.blob());
              const thumbnailFileName = `thumb-${result.mediaId}.jpg`;
              const thumbnailStoragePath = `vault/${session.user.id}/${thumbnailFileName}`;
              
              // Upload thumbnail to Supabase Storage
              const { data: thumbData, error: thumbError } = await supabase.storage
                .from('make-f9be53a7-media')
                .upload(thumbnailStoragePath, thumbnailBlob, {
                  contentType: 'image/jpeg',
                  upsert: false
                });
              
              if (!thumbError && thumbData) {
                thumbnailPath = thumbnailStoragePath;
                console.log('✅ Thumbnail uploaded:', thumbnailPath);
              } else {
                console.warn('⚠️ Thumbnail upload failed:', thumbError);
              }
            } catch (thumbErr) {
              console.warn('⚠️ Thumbnail upload error:', thumbErr);
            }
          }
          
          // Now create vault entry using the uploaded file
          const vaultRecord = {
            id: result.mediaId,
            user_id: session.user.id,
            type: media.type,
            storage_path: result.filePath,
            thumbnail_path: thumbnailPath, // ✅ Include thumbnail path if uploaded
            file_name: fileName,
            file_type: media.blob.type,
            file_size: media.blob.size,
            timestamp: media.timestamp
          };
          
          // Create vault entry via metadata endpoint
          const vaultResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-vault/create-from-storage`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(vaultRecord)
            }
          );
          
          if (!vaultResponse.ok) {
            const errorData = await vaultResponse.json().catch(() => ({}));
            throw new Error(`Failed to create vault entry: ${errorData.error || vaultResponse.statusText}`);
          }
          
          const vaultResult = await vaultResponse.json();
          console.log('✅ Media uploaded to backend Vault via TUS:', result.mediaId);
          
          // Update thumbnail display - only for video/photo
          if (media.type === 'video' || media.type === 'photo') {
            setLastThumbnail(media.thumbnail || vaultResult.record?.url);
          }
          
        } catch (error) {
          console.error('❌ TUS vault upload failed:', error);
          toast.error('Vault backup failed - media will be saved locally');
          // Fallback to localStorage
          await saveToLocalStorage(media);
        }
        
      } else {
        // 📦 SMALL FILES: Use existing FormData upload (faster for small files)
        console.log(`📦 Small file (${(media.blob.size / (1024 * 1024)).toFixed(1)}MB) - using FormData upload`);
        
        const formData = new FormData();
        formData.append('file', media.blob, `${media.type}-${media.timestamp}.${getFileExtension(media.blob.type)}`);
        formData.append('type', media.type);
        
        // Add thumbnail if available
        if (media.thumbnail) {
          const thumbnailBlob = await fetch(media.thumbnail).then(r => r.blob());
          formData.append('thumbnail', thumbnailBlob, `thumb-${media.timestamp}.jpg`);
        }

        // Upload to backend with 8 second timeout
        const response = await withTimeout(
          fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-vault/upload`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`
              },
              body: formData
            }
          ),
          8000
        );

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            console.warn('⚠️ Backend upload permission denied - using localStorage');
          } else if (response.status === 413) {
            console.warn('⚠️ File too large - using localStorage');
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.warn(`⚠️ Backend upload failed (${response.status}) - using localStorage:`, errorData.error);
          }
          // Don't throw, just fall through to localStorage fallback
          throw new Error('Backend upload failed');
        }

        const result = await response.json();
        console.log('✅ Media uploaded to backend Vault:', result.record.id);
        
        // Update the thumbnail display - only for video/photo
        if (media.type === 'video' || media.type === 'photo') {
          setLastThumbnail(media.thumbnail || result.record.thumbnail);
        }
      }
      
    } catch (err) {
      console.warn('⚠️ Using localStorage for media storage:', err.message);
      // Always fallback to localStorage on any error
      await saveToLocalStorage(media);
    }
  };

  const handleSendToCapsule = React.useCallback(async () => {
    if (!currentMedia) return;
    
    console.log('📤 [SEND TO CAPSULE] Starting - media:', currentMedia.id);
    
    // 🚀 UX IMPROVEMENT: Start vault backup in background, don't block user
    const vaultBackupPromise = (async () => {
      try {
        console.log('🏛️ [VAULT BACKUP] Saving media to vault in background...');
        
        // Save current media to vault
        await saveMediaToVault(currentMedia);
        
        console.log('✅ [VAULT BACKUP] Media safely backed up to vault');
        
        // Show success toast
        toast.success('Backed up to Vault!', { duration: 2000 });
        
      } catch (err) {
        console.error('❌ [VAULT BACKUP] Failed to save to vault:', err);
        
        // Show error toast but don't block user workflow
        toast.error('Vault backup failed - media still sent to capsule', { duration: 4000 });
      }
    })();
    
    // Don't await vault backup - continue immediately
    
    // Prepare for capsule creation immediately
    setIsSaving(true);
    const mediaItem = {
      id: currentMedia.id,
      type: currentMedia.type, // Keep as 'photo'/'video'/'audio' - CreateCapsule expects this format
      url: currentMedia.url,
      blob: currentMedia.blob,
      thumbnail: currentMedia.thumbnail,
      timestamp: currentMedia.timestamp,
      filename: currentMedia.filename
    };
    
    console.log('📤 [SEND TO CAPSULE] Prepared mediaItem:', {
      id: mediaItem.id,
      type: mediaItem.type,
      hasBlob: !!mediaItem.blob,
      blobSize: mediaItem.blob?.size,
      blobType: mediaItem.blob?.type
    });
    
    // Call callback IMMEDIATELY with media data
    const callback = onMediaCapturedRef.current;
    if (callback) {
      console.log('📤 [SEND TO CAPSULE] Calling callback with 1 item array');
      callback([mediaItem]);
    } else {
      console.error('❌ [SEND TO CAPSULE] No callback registered!');
    }
    
    // Update thumbnail for camera UI - only for video/photo
    if (currentMedia.type === 'video' || currentMedia.type === 'photo') {
      setLastThumbnail(currentMedia.thumbnail || currentMedia.url);
    }
    
    // CRITICAL FIX: Exit fullscreen if active to prevent layout corruption
    if (isFullscreen) {
      try {
        console.log('🖥️ Exiting fullscreen mode before navigation...');
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          await document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        }
        setIsFullscreen(false);
        console.log('✅ Fullscreen exited successfully');
      } catch (err) {
        console.error('❌ Error exiting fullscreen:', err);
        // Force state reset even if exit fails
        setIsFullscreen(false);
      }
    }
    
    // Close modal and clear current media
    setShowModal(false);
    setCurrentMedia(null);
    setIsSaving(false); // Reset saving state
    
    // CRITICAL FIX: Complete reset for next recording
    console.log('🧹 Resetting RecordInterface state after media sent');
    setIsRecording(false);
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    
    // COMPREHENSIVE LAYOUT RESET
    resetAllLayoutState();
    
    // Keep camera/microphone active for next recording
    // Don't stop the stream - let it stay ready for next capture
    console.log('✅ RecordInterface ready for next recording');
  }, [currentMedia, isFullscreen]);

  const handleRetake = async () => {
    console.log('🔄 Retake requested, mode:', mode);
    
    // Close modal and discard media
    setShowModal(false);
    setCurrentMedia(null);
    
    // COMPREHENSIVE LAYOUT RESET
    resetAllLayoutState();
    
    // Always reinitialize the camera/audio to ensure it's fresh
    try {
      // Stop current stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Reset camera ready state
      setCameraReady(false);
      
      // Wait a tiny bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Reinitialize based on mode
      if (mode === 'audio') {
        await initAudio();
      } else {
        await initCamera();
      }
      
      console.log('✅ Camera/audio reinitialized after retake');
    } catch (err) {
      console.error('❌ Failed to reinitialize after retake:', err);
      toast.error('Failed to restart camera');
    }
  };

  const handleEnhance = async () => {
    if (!currentMedia) {
      toast.error('No media to enhance');
      return;
    }
    
    if (!onEnhanceRef.current) {
      toast.error('Enhancement feature not available');
      return;
    }
    
    console.log('🎨 Sending media to enhancement:', currentMedia.id);
    
    const mediaToEnhance = currentMedia;
    
    // Store media in ref so it can be restored if user cancels enhancement
    enhancingMediaRef.current = currentMedia;
    
    // CRITICAL FIX: Exit fullscreen if active to prevent layout corruption
    if (isFullscreen) {
      try {
        console.log('🖥️ Exiting fullscreen mode before enhancement...');
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          await document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        }
        setIsFullscreen(false);
        console.log('✅ Fullscreen exited successfully');
      } catch (err) {
        console.error('❌ Error exiting fullscreen:', err);
        setIsFullscreen(false);
      }
    }
    
    // Hide modal but DON'T clear media yet (keep it for restore on cancel)
    setShowModal(false);
    
    // Send to enhancement overlay
    setTimeout(() => {
      onEnhanceRef.current(mediaToEnhance);
    }, 50);
    
    console.log('✅ Media sent to enhancement, stored for potential restore');
  };

  // Helper function to save to localStorage as fallback
  const saveToLocalStorage = async (media: MediaItem) => {
    try {
      const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      };

      const base64Data = await blobToBase64(media.blob);
      
      const vault = JSON.parse(localStorage.getItem('legacyVault') || '[]');
      vault.push({
        id: media.id,
        type: media.type,
        base64Data,
        timestamp: media.timestamp,
        thumbnail: media.thumbnail,
        mimeType: media.blob.type
      });
      localStorage.setItem('legacyVault', JSON.stringify(vault));
      console.log('✅ Saved media to localStorage Vault (fallback):', media.id);
      
      // Update thumbnail - only for video/photo
      if (media.type === 'video' || media.type === 'photo') {
        setLastThumbnail(media.thumbnail || base64Data);
      }
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  };

  // Helper function to get file extension from MIME type
  const getFileExtension = (mimeType: string): string => {
    const mimeMap = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'audio/webm': 'webm',
      'audio/mp4': 'm4a',
      'audio/mpeg': 'mp3'
    };
    return mimeMap[mimeType] || 'bin';
  };



  return (
    <>
      {/* Recording Modal - MUST BE OUTSIDE to not be blocked by z-50 */}
      {showModal && currentMedia && (
        <RecordingModal
          media={currentMedia}
          onSendToCapsule={handleSendToCapsule}
          onEnhance={handleEnhance}
          onRetake={handleRetake}
          isSaving={isSaving}
        />
      )}

      {/* Full-screen backdrop overlay to prevent background interaction */}
      <div className="fixed inset-0 z-40 bg-black" />
      
      <div 
        ref={containerRef}
        className="fixed inset-0 z-50 bg-black overflow-hidden"
      >
        <div className="w-full h-full overflow-hidden">
          {/* Camera/Audio View - Full Screen */}
          <div className="relative w-full h-full bg-black overflow-hidden">
          {/* Video Preview */}
          {mode !== 'audio' && !error && (
            <div 
              className={`absolute inset-0 overflow-hidden ${showModal ? 'invisible' : 'visible'}`}
              style={{ 
                width: '100%', 
                height: '100%',
                maxWidth: '100vw',
                maxHeight: '100vh'
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
              />
            </div>
          )}

          {/* Audio Mode Visual - ERAS COSMIC ENHANCEMENT */}
          {mode === 'audio' && !error && (
            <div className={`absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 z-0 ${showModal ? 'invisible' : 'visible'}`}>
              {/* Animated Cosmic Background Glow */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
              </div>

              {/* Idle State - Soundwave Visualizer - CENTERED */}
              {!isRecording && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="flex flex-col items-center justify-center gap-6 sm:gap-8 px-4">
                    {/* Cosmic Mic Icon */}
                    <div className="relative flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full blur-2xl opacity-60 animate-pulse" />
                      <div className="relative p-6 sm:p-8 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
                        <Mic className="w-14 h-14 sm:w-20 sm:h-20 text-white" />
                      </div>
                    </div>
                    
                    {/* Idle Waveform */}
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2 h-12 sm:h-16">
                      {[...Array(12)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 sm:w-1.5 bg-gradient-to-t from-violet-400 to-purple-400 rounded-full animate-pulse"
                          style={{
                            height: `${20 + (i % 3) * 15}%`,
                            animationDelay: `${i * 0.15}s`,
                            animationDuration: '1.5s'
                          }}
                        />
                      ))}
                    </div>
                    
                    <p className="text-white/60 text-base sm:text-lg font-medium text-center">Tap to record</p>
                  </div>
                </div>
              )}

              {/* Recording Bar - Center */}
              {isRecording && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="bg-black/40 backdrop-blur-xl rounded-3xl px-8 py-6 shadow-2xl border border-white/20">
                    <div className="flex items-center gap-6">
                      {/* Pulsing Red Dot with Glow */}
                      <div className="relative flex items-center justify-center">
                        <div className="absolute w-6 h-6 bg-red-500 rounded-full blur-lg opacity-60 animate-ping" />
                        <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
                      </div>
                      
                      {/* Timer */}
                      <div className="text-white font-mono text-3xl sm:text-4xl tracking-wider font-bold">
                        {formatTime(recordingDuration)}
                      </div>
                      
                      {/* Enhanced Audio Waveform Animation */}
                      <div className="flex items-center gap-1.5 h-12">
                        {[...Array(8)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1.5 bg-gradient-to-t from-red-500 via-red-400 to-pink-400 rounded-full animate-pulse shadow-lg shadow-red-500/30"
                            style={{
                              height: `${Math.random() * 100 + 30}%`,
                              animationDelay: `${i * 0.1}s`,
                              animationDuration: '0.6s'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Error State */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
              <div className="text-center space-y-4 p-6 max-w-md mx-auto relative">
                {/* Close button in error state */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (onClose) onClose();
                  }}
                  className="absolute -top-2 -right-2 rounded-full bg-red-500/80 hover:bg-red-600 text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
                
                <p className="text-white text-lg">{error}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={() => mode === 'audio' ? initAudio() : initCamera()}
                    variant="default"
                  >
                    Try Again
                  </Button>
                  <Button 
                    onClick={() => {
                      if (onClose) onClose();
                    }}
                    variant="outline"
                    className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                  >
                    Go Back
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Top Controls - ERAS COSMIC STYLE - ALWAYS VISIBLE with highest z-index */}
          {!showModal && (
            <div className="absolute top-4 left-0 right-0 z-[60] px-4 pointer-events-none">
              <div className="flex items-center justify-between">
                {/* Left: Fullscreen toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all shadow-lg pointer-events-auto"
                >
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </Button>
                
                {/* Right: Close button - ALWAYS VISIBLE */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    console.log('🚪 Close button clicked - cleaning up and exiting');
                    resetAllLayoutState();
                    if (onClose) onClose();
                  }}
                  className="rounded-full bg-black/30 hover:bg-red-500/80 text-white backdrop-blur-xl border-2 border-white/20 hover:border-red-400/50 transition-all shadow-lg hover:shadow-red-500/30 pointer-events-auto"
                  style={{ 
                    minWidth: '44px', 
                    minHeight: '44px',
                    touchAction: 'manipulation' 
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Zoom Controls - ERAS COSMIC STYLE - DESKTOP ONLY - Always accessible */}
          {!showModal && mode !== 'audio' && (
            <div 
              className="hidden sm:flex absolute bottom-[192px] sm:bottom-[185px] left-0 right-0 z-[55] px-4 pointer-events-none"
            >
              <div className="flex items-center justify-center gap-2 sm:gap-4 w-full">
                {zoomLevels.map((level) => (
                  <button
                    key={level}
                    onClick={() => {
                      console.log('🔍 Zoom button clicked:', level);
                      setZoomLevel(level);
                    }}
                    className={`
                      min-w-[44px] min-h-[44px] h-11 px-3 rounded-xl font-medium 
                      transition-all duration-300 pointer-events-auto
                      ${zoomLevel === level
                        ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white scale-110 shadow-lg shadow-cyan-400/40 border border-white/30'
                        : 'bg-black/30 text-white/70 hover:text-white hover:bg-black/50 backdrop-blur-md border border-white/10'
                    }`}
                    style={{ touchAction: 'manipulation' }}
                  >
                    {level === 0.5 ? '.5' : level}×
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mode Selector - ERAS COSMIC STYLE - Hide when modal is showing - Mobile: raised 20% */}
          {!showModal && (
            <div 
              className="absolute bottom-[140px] sm:bottom-[130px] left-0 right-0 z-15 px-4"
            >
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {/* Photo Mode */}
                <button
                  onClick={() => setMode('photo')}
                  className={`
                    flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl
                    font-medium text-sm sm:text-base whitespace-nowrap
                    transition-all duration-200
                    ${mode === 'photo' 
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30 scale-105 backdrop-blur-md border border-white/20' 
                      : 'bg-black/30 text-white/70 hover:text-white hover:bg-black/50 backdrop-blur-md border border-white/10'
                    }
                  `}
                >
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>PHOTO</span>
                </button>
                
                {/* Video Mode */}
                <button
                  onClick={() => setMode('video')}
                  className={`
                    flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl
                    font-medium text-sm sm:text-base whitespace-nowrap
                    transition-all duration-200
                    ${mode === 'video' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 scale-105 backdrop-blur-md border border-white/20' 
                      : 'bg-black/30 text-white/70 hover:text-white hover:bg-black/50 backdrop-blur-md border border-white/10'
                    }
                  `}
                >
                  <Video className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>VIDEO</span>
                </button>
                
                {/* Audio Mode */}
                <button
                  onClick={() => setMode('audio')}
                  className={`
                    flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl
                    font-medium text-sm sm:text-base whitespace-nowrap
                    transition-all duration-200
                    ${mode === 'audio' 
                      ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/30 scale-105 backdrop-blur-md border border-white/20' 
                      : 'bg-black/30 text-white/70 hover:text-white hover:bg-black/50 backdrop-blur-md border border-white/10'
                    }
                  `}
                >
                  <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>AUDIO</span>
                </button>
              </div>
            </div>
          )}

          {/* Recording Controls - Hide when modal is showing - Mobile: raised to avoid address bar */}
          {!showModal && (
          <div 
            className="absolute bottom-20 sm:bottom-6 left-0 right-0 z-10 px-6 sm:px-4"
          >
            <div className="flex items-center justify-center gap-6 sm:gap-8 md:gap-12 max-w-md mx-auto">
              {/* Vault Button - ERAS COSMIC STYLE with Status Glow */}
              <button
                onClick={() => {
                  if (onOpenVault) {
                    console.log('🏛️ Opening Vault from camera view');
                    onOpenVault();
                  }
                }}
                className={`
                  relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 
                  transition-all shrink-0 overflow-hidden bg-black/20 block
                  backdrop-blur-sm
                  ${mode === 'photo' 
                    ? 'border-blue-400/60 hover:border-blue-400 shadow-lg shadow-blue-400/30' 
                    : mode === 'video'
                    ? 'border-purple-400/60 hover:border-purple-400 shadow-lg shadow-purple-400/30'
                    : 'border-violet-400/60 hover:border-violet-400 shadow-lg shadow-violet-400/30'
                  }
                `}
                style={{
                  WebkitAppearance: 'none',
                  padding: 0,
                  margin: 0
                }}
              >
                {lastThumbnail ? (
                  <>
                    {/* Full-coverage thumbnail using img tag for iOS compatibility */}
                    <img 
                      src={lastThumbnail} 
                      alt="Last media"
                      className="absolute top-0 left-0 w-full h-full object-cover"
                      style={{
                        display: 'block',
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        margin: 0,
                        padding: 0,
                        border: 'none'
                      }}
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all pointer-events-none" />
                  </>
                ) : (
                  /* Fallback Grid Icon */
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-0.5 w-6 h-6">
                      <div className="bg-white/70 rounded-sm" />
                      <div className="bg-white/70 rounded-sm" />
                      <div className="bg-white/70 rounded-sm" />
                      <div className="bg-white/70 rounded-sm" />
                    </div>
                  </div>
                )}
              </button>

              {/* Capture/Record Button - ERAS COSMIC STYLE */}
              <div className="relative shrink-0">
                {mode === 'photo' ? (
                  <button
                    onClick={takePhoto}
                    disabled={!cameraReady}
                    className="
                      relative w-20 h-20 sm:w-24 sm:h-24 rounded-full 
                      bg-gradient-to-br from-blue-500 via-cyan-400 to-teal-500
                      transition-all active:scale-95 disabled:opacity-50 
                      flex items-center justify-center
                      shadow-lg shadow-blue-500/40
                      before:absolute before:inset-0 before:rounded-full 
                      before:bg-gradient-to-br before:from-blue-400 before:to-cyan-500
                      before:opacity-0 hover:before:opacity-100 before:transition-opacity
                      after:absolute after:inset-[3px] after:rounded-full after:bg-white
                    "
                  >
                    <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 relative z-10" />
                  </button>
                ) : mode === 'audio' ? (
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={!cameraReady}
                    className={`
                      relative w-20 h-20 sm:w-24 sm:h-24 rounded-full 
                      transition-all active:scale-95 disabled:opacity-50 
                      flex items-center justify-center
                      ${isRecording 
                        ? 'bg-red-500 shadow-lg shadow-red-500/60 animate-pulse' 
                        : 'bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 shadow-lg shadow-violet-500/40'
                      }
                    `}
                  >
                    <Mic className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  </button>
                ) : (
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={!cameraReady}
                    className={`
                      relative w-20 h-20 sm:w-24 sm:h-24 rounded-full 
                      transition-all active:scale-95 disabled:opacity-50
                      flex items-center justify-center
                      ${isRecording
                        ? 'bg-red-500 shadow-lg shadow-red-500/60'
                        : 'bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 shadow-lg shadow-purple-500/40'
                      }
                      before:absolute before:inset-0 before:rounded-full 
                      before:bg-gradient-to-br before:from-purple-400 before:to-pink-500
                      before:opacity-0 hover:before:opacity-100 before:transition-opacity
                      after:absolute after:inset-[3px] after:rounded-full after:bg-white
                    `}
                  >
                    {isRecording ? (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-white rounded-[4px] relative z-10 animate-pulse" />
                    ) : (
                      <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full relative z-10" />
                    )}
                  </button>
                )}

                {/* Recording indicator - Only for video */}
                {isRecording && mode === 'video' && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                    REC
                  </div>
                )}
              </div>

              {/* Flip Camera Button - ERAS COSMIC STYLE */}
              {mode !== 'audio' && (
                <button
                  onClick={toggleCamera}
                  className="
                    w-12 h-12 sm:w-14 sm:h-14 rounded-full 
                    bg-black/40 hover:bg-gradient-to-br hover:from-cyan-500/20 hover:to-blue-500/20
                    backdrop-blur-xl border border-white/20 hover:border-cyan-400/50
                    flex items-center justify-center 
                    transition-all active:scale-95
                    shadow-lg hover:shadow-cyan-400/20
                  "
                >
                  <RotateCw className="w-6 h-6 text-white" />
                </button>
              )}
              {mode === 'audio' && (
                <div className="w-12 h-12 sm:w-14 sm:h-14" />
              )}
            </div>
          </div>
          )}
          </div>
        </div>
      </div>
    </>
  );
}