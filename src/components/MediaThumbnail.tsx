import React, { useState, useRef, useEffect } from 'react';
import { Play, Mic, FileText, AlertCircle, RotateCw } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

// 🎯 THUMBNAIL CACHE: Store generated thumbnails to avoid regeneration
// - In-memory cache: Fast lookup for current session
// - Indexed by video URL for instant retrieval
const thumbnailCache = new Map<string, string>();

// 🔥 GLOBAL QUEUE: Prevent concurrent video thumbnail generation on mobile
// Mobile devices struggle when multiple videos load simultaneously
const videoThumbnailQueue: Array<() => Promise<void>> = [];
let isProcessingQueue = false;

async function processVideoThumbnailQueue() {
  if (isProcessingQueue || videoThumbnailQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (videoThumbnailQueue.length > 0) {
    const task = videoThumbnailQueue.shift();
    if (task) {
      try {
        await task();
        // Small delay between videos to prevent overwhelming the device
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error('Video thumbnail generation failed:', error);
      }
    }
  }
  
  isProcessingQueue = false;
}

interface MediaFile {
  id?: string;
  file_name?: string;
  filename?: string; // Support both field names
  file_type?: string;
  type?: string;
  file_size?: number;
  url?: string;
  thumbnail?: string; // Pre-generated thumbnail URL for videos
  created_at?: string;
}

interface MediaThumbnailProps {
  mediaFile?: MediaFile | null;
  size?: 'sm' | 'md' | 'lg';
  showOverlay?: boolean;
  className?: string;
  onClick?: () => void;
}

export function MediaThumbnail({ 
  mediaFile, 
  size = 'md', 
  showOverlay = true, 
  className = '',
  onClick
}: MediaThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20', 
    lg: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  // Early return if mediaFile is not provided
  if (!mediaFile) {
    console.warn('MediaThumbnail: mediaFile is null or undefined');
    return (
      <div className={`${sizeClasses[size]} rounded-lg overflow-hidden bg-slate-700/50 flex items-center justify-center ${className}`}>
        <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
          <FileText className={`${iconSizes[size]} text-slate-400`} />
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!mediaFile) return;
    
    // Support both field name conventions
    const fileName = mediaFile.file_name || mediaFile.filename || '';
    
    console.log('🔍 MediaThumbnail processing:', {
      file_name: fileName,
      url: mediaFile.url?.substring(0, 150),
      file_type: mediaFile.file_type,
      type: mediaFile.type
    });
    
    // Support both 'type' and 'file_type' field names
    let fileType = mediaFile.file_type || mediaFile.type;
    
    // Detect media type from file extension if type is unknown or generic
    const detectTypeFromExtension = (filename: string, url: string) => {
      // Combine filename and URL to maximize chances of finding extension
      const source = `${filename || ''} ${url || ''}`.toLowerCase();
      
      if (source.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg|heic|heif)(\?|$)/i)) {
        return 'image/jpeg';
      } else if (source.match(/\.(mp4|mov|avi|webm|mkv|m4v|3gp)(\?|$)/i)) {
        return 'video/mp4';
      } else if (source.match(/\.(mp3|wav|m4a|aac|ogg|flac|wma)(\?|$)/i)) {
        return 'audio/mpeg';
      } else if (source.match(/\.(pdf|doc|docx|txt|csv|xls|xlsx)(\?|$)/i)) {
        return 'application/pdf';
      }
      return null;
    };
    
    // 🔥 CRITICAL FIX: ALWAYS check URL for extension to match useEffect logic
    const detectedType = detectTypeFromExtension(fileName, mediaFile.url || '');
    if (detectedType) {
      if (!fileType || fileType === 'application/octet-stream' || fileType === 'unknown') {
        fileType = detectedType;
      }
    }
    
    // Check if we have a valid specific MIME type (audio, video, image, or known doc type)
    const hasSpecificMimeType = fileType && (
      fileType.startsWith('audio/') ||
      fileType.startsWith('video/') ||
      fileType.startsWith('image/') ||
      fileType.startsWith('application/pdf') ||
      fileType.includes('word') ||
      fileType.includes('document') ||
      fileType.includes('text')
    );
    
    // ONLY check for custom extensions if we don't have a specific MIME type
    if (!hasSpecificMimeType) {
      const extensionMatch = (fileName || mediaFile.url || '').match(/\.([^.?]+)(\?|$)/i);
      const extension = extensionMatch ? extensionMatch[1].toLowerCase() : '';
      
      const knownImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic', 'heif'];
      const knownVideoExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'm4v', '3gp'];
      const knownAudioExtensions = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'wma'];
      const knownDocExtensions = ['pdf', 'doc', 'docx', 'txt', 'csv', 'xls', 'xlsx'];
      
      const allKnownExtensions = [
        ...knownImageExtensions,
        ...knownVideoExtensions, 
        ...knownAudioExtensions,
        ...knownDocExtensions
      ];
      
      // If extension is unknown AND no specific MIME type, treat as document
      if (extension && !allKnownExtensions.includes(extension)) {
        console.log('📎 Custom extension detected:', extension, '- treating as document for file:', fileName);
        setError(false);
        setThumbnailUrl(null);
        return;
      }
    } else {
      // We have a specific MIME type - trust it regardless of extension
      console.log('✅ Using MIME type:', fileType, '- ignoring extension for file:', fileName);
    }
    
    console.log('🔍 Final fileType:', fileType);
    
    if (!fileType) {
      console.warn('MediaThumbnail: No file type found', mediaFile);
      setError(false);
      setThumbnailUrl(null);
      return;
    }
    
    // Handle both url and blob (for local files not yet uploaded)
    if (!mediaFile.url) {
      console.warn('MediaThumbnail: No URL found', mediaFile);
      // Set error state to show fallback UI instead of rendering nothing
      setError(true);
      return;
    }
    
    if (fileType.startsWith('image/')) {
      // Reset error state when URL changes
      setError(false);
      setThumbnailUrl(mediaFile.url);
    } else if (fileType.startsWith('video/')) {
      // 🎬 PERFORMANCE FIX: Use pre-generated thumbnail if available (INSTANT loading)
      if (mediaFile.thumbnail) {
        console.log('✅ Using pre-generated thumbnail for instant display:', mediaFile.thumbnail);
        setError(false);
        setThumbnailUrl(mediaFile.thumbnail);
        setIsGenerating(false);
        return; // Skip client-side generation entirely
      }
      
      // 💾 CHECK CACHE: Use cached thumbnail if available
      const cachedThumbnail = thumbnailCache.get(mediaFile.url);
      if (cachedThumbnail) {
        console.log('💾 Using cached thumbnail (instant):', mediaFile.url.substring(0, 50));
        setError(false);
        setThumbnailUrl(cachedThumbnail);
        setIsGenerating(false);
        return; // Skip generation entirely
      }
      
      // FALLBACK: Generate thumbnail on client (slow, downloads full video)
      console.warn('⚠️ No pre-generated thumbnail - falling back to client-side generation (slow)');
      setError(false);
      setThumbnailUrl(null);
      
      // 🔥 FIX: On mobile, queue thumbnail generation to prevent concurrent video loads
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
      
      if (isMobile) {
        // Add to queue for sequential processing
        videoThumbnailQueue.push(generateVideoThumbnail);
        processVideoThumbnailQueue(); // Start processing if not already running
      } else {
        // Desktop can handle concurrent loads
        generateVideoThumbnail();
      }
    } else {
      // For audio or other file types, don't try to load as image
      setError(false);
      setThumbnailUrl(null);
    }
  }, [mediaFile?.url, mediaFile?.file_type, mediaFile?.type, mediaFile?.file_name, mediaFile?.filename]);

  const generateVideoThumbnail = async () => {
    if (!mediaFile?.url) {
      console.warn('Cannot generate thumbnail: no URL');
      setError(true);
      setIsGenerating(false);
      return;
    }
    
    if (isGenerating) {
      console.log('Already generating thumbnail, skipping...');
      return;
    }
    
    setIsGenerating(true);
    setError(false);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!video || !canvas) {
        console.error('Video or canvas ref not available');
        setError(true);
        setIsGenerating(false);
        return;
      }

      console.log('🎬 Generating video thumbnail for:', mediaFile.url?.substring(0, 50));

      // CRITICAL FIX: Validate URL before attempting to load
      let urlToTest = mediaFile.url;
      if (!urlToTest.startsWith('blob:') && !urlToTest.startsWith('http')) {
        console.error('❌ Invalid video URL format:', urlToTest);
        setError(true);
        setIsGenerating(false);
        return;
      }

      // 🔥 CRITICAL FIX: Convert cross-origin URLs to blob URLs to prevent canvas tainting
      // - Cross-origin resources drawn to canvas will taint it, causing SecurityError on toBlob()
      // - Fetch the video and convert to blob URL (same-origin, canvas-safe)
      const isSupabaseUrl = urlToTest.includes('supabase.co') || urlToTest.includes('supabase.in');
      const isCrossOrigin = urlToTest.startsWith('http') && !urlToTest.startsWith(window.location.origin);
      
      if (isSupabaseUrl || isCrossOrigin) {
        console.log('🔄 Cross-origin video URL detected, fetching and converting to blob...');
        try {
          const response = await fetch(urlToTest);
          const blob = await response.blob();
          urlToTest = URL.createObjectURL(blob);
          console.log('✅ Converted cross-origin video URL to blob URL');
        } catch (fetchError) {
          console.error('❌ Failed to fetch cross-origin video:', fetchError);
          setError(true);
          setIsGenerating(false);
          return;
        }
      }

      // Set up video element
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';
      
      try {
        // 🔥 CRITICAL: Do NOT set crossOrigin
        // - We've already converted cross-origin URLs to blob URLs above
        // - Setting crossOrigin on blob URLs is unnecessary and can cause issues
        
        // CRITICAL: Clear previous src before setting new one
        video.src = '';
        video.load(); // Reset video element
        
        // Small delay to ensure clean state (helps with mobile)
        await new Promise(resolve => setTimeout(resolve, 50));
        
        video.src = urlToTest;
        console.log('✅ Video src set successfully');
      } catch (err) {
        console.error('❌ Video setup error:', err);
        setError(true);
        setIsGenerating(false);
        return;
      }
      
      await new Promise((resolve, reject) => {
        let resolved = false;
        
        video.onloadedmetadata = () => {
          console.log('Video metadata loaded, duration:', video.duration);
          // Seek to a frame (0.1 seconds or 10% into video)
          video.currentTime = Math.min(0.1, video.duration * 0.1);
        };
        
        video.onseeked = () => {
          if (resolved) return;
          resolved = true;
          
          console.log('Video seeked, generating thumbnail...');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Set canvas dimensions to match video
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          
          // Draw the video frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert to blob
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              console.log('Thumbnail generated successfully:', url);
              
              // 💾 STORE IN CACHE: Save for instant reuse on re-renders
              if (mediaFile?.url) {
                thumbnailCache.set(mediaFile.url, url);
                console.log('💾 Cached thumbnail for:', mediaFile.url.substring(0, 50));
              }
              
              setThumbnailUrl(url);
              resolve(url);
            } else {
              reject(new Error('Could not generate thumbnail blob'));
            }
          }, 'image/jpeg', 0.85);
        };
        
        video.onerror = (e) => {
          if (resolved) return;
          resolved = true;
          console.error('❌ Video load error:', e);
          console.error('❌ Video URL that failed:', urlToTest);
          console.error('❌ Video error details:', {
            networkState: video.networkState,
            readyState: video.readyState,
            error: video.error
          });
          // 🔥 CRITICAL FIX: Do NOT call video.remove() on a React-managed ref!
          // This causes "Failed to execute 'insertBefore' on 'Node'" errors when React tries to reconcile
          video.pause();
          video.removeAttribute('src');
          video.load();
          reject(new Error(`Video load error: ${video.error?.message || 'Unknown error'}`));
        };
        
        // 🔥 FIX: Increase timeout significantly for better reliability
        // - Desktop: 30s (was 10s) - allows time for cross-origin fetch + decode
        // - Mobile: 45s (was 20s) - mobile devices are much slower at video processing
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
        const timeout = isMobile ? 45000 : 30000;
        
        const timeoutId = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            console.warn(`⏱️ Thumbnail generation timeout after ${timeout/1000}s (${isMobile ? 'mobile' : 'desktop'}), using video fallback`);
            // 🔥 CRITICAL FIX: Do NOT remove node
            video.pause();
            video.removeAttribute('src');
            video.load();
            reject(new Error(`Thumbnail generation timeout (${timeout/1000}s)`));
          }
        }, timeout);
        
        // Clean up timeout if video loads successfully
        const cleanup = () => {
          clearTimeout(timeoutId);
          // 🔥 CRITICAL FIX: Do NOT remove node
          // just stop loading/playing
          if (video) {
            video.pause();
            video.removeAttribute('src');
            video.load();
          }
        };
        
        const originalResolve = resolve;
        resolve = (value: any) => {
          cleanup();
          originalResolve(value);
        };
        
        const originalReject = reject;
        reject = (error: any) => {
          cleanup();
          originalReject(error);
        };
      });
    } catch (err) {
      console.error('Thumbnail generation failed, will use video element fallback:', err);
      setError(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderContent = () => {
    // Support both field name conventions
    const fileName = mediaFile?.file_name || mediaFile?.filename || '';
    const fileUrl = mediaFile?.url || '';
    
    // Support both 'type' and 'file_type' field names
    let fileType = mediaFile?.file_type || mediaFile?.type;
    
    // Detect media type from file extension if type is unknown or generic
    const detectTypeFromExtension = (filename: string, url: string) => {
      // Combine filename and URL to maximize chances of finding extension
      const source = `${filename || ''} ${url || ''}`.toLowerCase();
      
      if (source.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg|heic|heif)(\?|$)/i)) {
        return 'image/jpeg';
      } else if (source.match(/\.(mp4|mov|avi|webm|mkv|m4v|3gp)(\?|$)/i)) {
        return 'video/mp4';
      } else if (source.match(/\.(mp3|wav|m4a|aac|ogg|flac|wma)(\?|$)/i)) {
        return 'audio/mpeg';
      } else if (source.match(/\.(pdf|doc|docx|txt|csv|xls|xlsx)(\?|$)/i)) {
        return 'application/pdf';
      }
      return null;
    };
    
    // 🔥 CRITICAL FIX: ALWAYS check URL for extension to match useEffect logic
    const detectedType = detectTypeFromExtension(fileName, fileUrl);
    if (detectedType) {
      if (!fileType || fileType === 'application/octet-stream' || fileType === 'unknown') {
        fileType = detectedType;
      }
    }
    
    // Check if we have a valid specific MIME type (audio, video, image, or known doc type)
    const hasSpecificMimeType = fileType && (
      fileType.startsWith('audio/') ||
      fileType.startsWith('video/') ||
      fileType.startsWith('image/') ||
      fileType.startsWith('application/pdf') ||
      fileType.includes('word') ||
      fileType.includes('document') ||
      fileType.includes('text')
    );
    
    // ONLY check for custom extensions if we don't have a specific MIME type
    if (!hasSpecificMimeType) {
      const extensionMatch = (fileName || fileUrl).match(/\.([^.?]+)(\?|$)/i);
      const extension = extensionMatch ? extensionMatch[1].toLowerCase() : '';
      
      const knownImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic', 'heif'];
      const knownVideoExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'm4v', '3gp'];
      const knownAudioExtensions = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'wma'];
      const knownDocExtensions = ['pdf', 'doc', 'docx', 'txt', 'csv', 'xls', 'xlsx'];
      
      const allKnownExtensions = [
        ...knownImageExtensions,
        ...knownVideoExtensions, 
        ...knownAudioExtensions,
        ...knownDocExtensions
      ];
      
      // If extension is unknown AND no specific MIME type, treat as document
      if (extension && !allKnownExtensions.includes(extension)) {
        console.log('📎 Custom extension in render:', extension, '- treating as document for file:', fileName);
        return (
          <div 
            className={`${sizeClasses[size]} rounded-lg overflow-hidden relative ${className} ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
            style={{
              background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <FileText className={`${iconSizes[size]} text-white drop-shadow-lg`} />
            </div>
            {showOverlay && (
              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                <FileText className="w-4 h-4 text-white drop-shadow-lg" />
              </div>
            )}
          </div>
        );
      }
    } else {
      // We have a specific MIME type - trust it regardless of extension
      console.log('✅ Using MIME type in render:', fileType, '- ignoring extension for file:', fileName);
    }
    
    if (!fileType) {
      console.warn('MediaThumbnail: No file_type or type field found', mediaFile);
      // Show as document if no type can be determined
      return (
        <div 
          className={`${sizeClasses[size]} rounded-lg overflow-hidden relative ${className} ${onClick ? 'cursor-pointer' : ''}`}
          onClick={onClick}
          style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <FileText className={`${iconSizes[size]} text-white drop-shadow-lg`} />
          </div>
          {showOverlay && (
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <FileText className="w-4 h-4 text-white drop-shadow-lg" />
            </div>
          )}
        </div>
      );
    }

    if (fileType.startsWith('image/')) {
      return (
        <div 
          className={`${sizeClasses[size]} rounded-lg overflow-hidden bg-slate-700/50 relative ${className} ${onClick ? 'cursor-pointer' : ''}`}
          onClick={onClick}
        >
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt={mediaFile?.file_name || 'Media file'}
              className="w-full h-full object-cover object-center"
              loading="lazy"
              onError={(e) => {
                console.warn('Image load error for:', thumbnailUrl, 'File:', mediaFile?.file_name);
                setError(true);
                setThumbnailUrl(null);
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', mediaFile?.file_name);
              }}
            />
          ) : error ? (
            <div className="w-full h-full bg-gradient-to-br from-red-900 to-red-800 flex items-center justify-center">
              <AlertCircle className={`${iconSizes[size]} text-red-300`} />
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
              <FileText className={`${iconSizes[size]} text-slate-400`} />
            </div>
          )}
          {showOverlay && thumbnailUrl && !error && (
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <Play className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      );
    }

    if (fileType.startsWith('video/')) {
      return (
        <div 
          className={`${sizeClasses[size]} rounded-lg overflow-hidden bg-slate-700/50 relative ${className} ${onClick ? 'cursor-pointer' : ''}`}
          onClick={onClick}
        >
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt={mediaFile?.file_name || 'Video file'}
              className="w-full h-full object-cover object-center"
              loading="lazy"
            />
          ) : isGenerating ? (
            <div className="w-full h-full bg-gradient-to-br from-blue-900 to-blue-800 flex flex-col items-center justify-center gap-1">
              <RotateCw className={`${iconSizes[size]} animate-spin text-blue-300`} />
              {size !== 'sm' && <span className="text-[10px] text-blue-300">Loading...</span>}
            </div>
          ) : error ? (
            // FALLBACK: Use video element directly with preload="metadata" if canvas failed
            <div className="w-full h-full bg-gradient-to-br from-blue-900 to-blue-800 relative">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                <Play className={`${iconSizes[size]} text-white drop-shadow-lg`} />
                {size !== 'sm' && (
                  <span className="text-[10px] text-white/80 font-semibold">
                    Video
                  </span>
                )}
              </div>
            </div>
          ) : (
            // Initial loading state - show gradient background with play icon
            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 relative">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                <Play className={`${iconSizes[size]} text-white/70 drop-shadow-lg`} />
                {size !== 'sm' && (
                  <span className="text-[10px] text-white/50 font-semibold">
                    Video
                  </span>
                )}
              </div>
            </div>
          )}
          {showOverlay && thumbnailUrl && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <Play className="w-6 h-6 text-white drop-shadow-lg" />
            </div>
          )}
          {/* Hidden elements for thumbnail generation */}
          <video ref={videoRef} className="hidden" />
          <canvas ref={canvasRef} className="hidden" />
        </div>
      );
    }

    if (fileType.startsWith('audio/')) {
      return (
        <div 
          className={`${sizeClasses[size]} rounded-lg overflow-hidden relative ${className} ${onClick ? 'cursor-pointer' : ''}`}
          onClick={onClick}
          style={{
            background: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 50%, #c026d3 100%)',
            boxShadow: '0 2px 8px rgba(168, 85, 247, 0.3)'
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <Mic className={`${iconSizes[size]} text-white drop-shadow-lg`} />
          </div>
          {showOverlay && (
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <Play className="w-4 h-4 text-white drop-shadow-lg" />
            </div>
          )}
        </div>
      );
    }

    // Document files (PDF, Word, text, etc.) and unknown types
    return (
      <div 
        className={`${sizeClasses[size]} rounded-lg overflow-hidden relative ${className} ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
        style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <FileText className={`${iconSizes[size]} text-white drop-shadow-lg`} />
        </div>
        {showOverlay && (
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
            <FileText className="w-4 h-4 text-white drop-shadow-lg" />
          </div>
        )}
      </div>
    );
  };

  return renderContent();
}