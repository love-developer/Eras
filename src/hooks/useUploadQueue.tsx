import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: 'image' | 'video' | 'audio' | 'document';
  status: 'queued' | 'compressing' | 'uploading' | 'completed' | 'failed' | 'paused';
  progress: number;
  compressedSize?: number;
  error?: string;
  url?: string;
  thumbnailUrl?: string;
}

export interface UploadQueueResult {
  files: UploadFile[];
  isUploading: boolean;
  addFiles: (files: File[]) => Promise<void>;
  removeFile: (id: string) => void;
  pauseFile: (id: string) => void;
  resumeFile: (id: string) => void;
  retryFile: (id: string) => void;
  clearCompleted: () => void;
  clearAll: () => void;
}

// Helper: Detect file type from extension and MIME
const detectFileType = (file: File): 'image' | 'video' | 'audio' | 'document' => {
  const mimeType = file.type.toLowerCase();
  const extension = file.name.toLowerCase().split('.').pop() || '';
  
  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'].includes(extension)) {
    return 'image';
  }
  if (mimeType.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'].includes(extension)) {
    return 'video';
  }
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'webm'].includes(extension)) {
    return 'audio';
  }
  
  // Document detection
  if (mimeType.startsWith('application/pdf') ||
      mimeType.startsWith('application/msword') ||
      mimeType.startsWith('application/vnd.openxmlformats-officedocument') ||
      mimeType.startsWith('application/vnd.ms-') ||
      mimeType.startsWith('text/') ||
      mimeType.startsWith('application/rtf') ||
      ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'csv'].includes(extension)) {
    return 'document';
  }
  
  // Default to image if unclear
  return 'image';
};

// Helper: Check if file should be compressed
// NOTE: Only compress large images. Videos are NOT compressed (phones already do this well)
const shouldCompress = (file: File): boolean => {
  const MB = 1024 * 1024;
  const type = detectFileType(file);
  
  // Only compress images over 10MB
  // Videos are uploaded as-is (max 500MB per file)
  if (type === 'image' && file.size > 10 * MB) return true;
  
  return false;
};

// Helper: Compress image
const compressImage = async (file: File, onProgress?: (progress: number) => void): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        onProgress?.(30);
        
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Resize if too large
        const MAX_WIDTH = 2000;
        const MAX_HEIGHT = 2000;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        onProgress?.(60);
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        onProgress?.(80);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            onProgress?.(100);
            
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            
            resolve(compressedFile);
          },
          'image/jpeg',
          0.85
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

// Helper: Create thumbnail for video
const createVideoThumbnail = async (file: File): Promise<string> => {
  // 🎥 MEMORY FIX: Skip thumbnail generation for very large videos (>100MB)
  const isLargeVideo = file.size > 100 * 1024 * 1024;
  if (isLargeVideo) {
    console.log('⏭️ Skipping thumbnail generation for large video in upload queue:', file.name, 
               'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    // Return empty thumbnail URL for large videos
    return '';
  }
  
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true; // Ensure video is muted
    
    // 🔥 FIX: Increase timeout from 5s to 15s for better reliability
    // - Larger videos (even under 100MB) can take time to load metadata
    // - Mobile devices are slower at video processing
    const timeoutId = setTimeout(() => {
      console.warn('⏱️ Upload queue thumbnail generation timeout after 15s for:', file.name);
      URL.revokeObjectURL(video.src); // Clean up blob URL
      video.remove();
      reject(new Error('Thumbnail generation timeout'));
    }, 15000); // 15 second timeout (was 5s)
    
    video.onloadedmetadata = () => {
      // Seek to 1 second or 10% of duration, whichever is shorter
      video.currentTime = Math.min(1, video.duration * 0.1);
    };
    
    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          clearTimeout(timeoutId);
          URL.revokeObjectURL(video.src); // Clean up blob URL
          video.remove();
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(
          (blob) => {
            clearTimeout(timeoutId);
            URL.revokeObjectURL(video.src); // Clean up blob URL
            video.remove();
            
            if (!blob) {
              reject(new Error('Failed to create thumbnail'));
              return;
            }
            resolve(URL.createObjectURL(blob));
          },
          'image/jpeg',
          0.7
        );
      } catch (error) {
        clearTimeout(timeoutId);
        URL.revokeObjectURL(video.src); // Clean up blob URL
        video.remove();
        reject(error);
      }
    };
    
    video.onerror = (e) => {
      clearTimeout(timeoutId);
      URL.revokeObjectURL(video.src); // Clean up blob URL
      video.remove();
      reject(new Error('Failed to load video'));
    };
    
    try {
      // Use file directly - don't create new File objects to avoid memory issues with large videos
      // The MIME type conversion for QuickTime happens when creating blobs for playback
      video.src = URL.createObjectURL(file);
    } catch (error) {
      clearTimeout(timeoutId);
      video.remove();
      reject(error);
    }
  });
};

export const useUploadQueue = (): UploadQueueResult => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const addFiles = useCallback(async (newFiles: File[]) => {
    // Create upload file objects
    const uploadFiles: UploadFile[] = newFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      type: detectFileType(file),
      status: 'queued',
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...uploadFiles]);

    // Check for large files and warn
    const largeFiles = uploadFiles.filter((f) => f.size > 100 * 1024 * 1024); // 100MB
    if (largeFiles.length > 0) {
      toast.warning(
        `${largeFiles.length} large file${largeFiles.length > 1 ? 's' : ''} detected. Compression recommended.`,
        { duration: 5000 }
      );
    }

    // Start processing
    setIsUploading(true);
    
    for (const uploadFile of uploadFiles) {
      await processFile(uploadFile);
    }
    
    setIsUploading(false);
  }, []);

  const processFile = async (uploadFile: UploadFile) => {
    const updateFile = (updates: Partial<UploadFile>) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === uploadFile.id ? { ...f, ...updates } : f))
      );
    };

    try {
      let processedFile = uploadFile.file;
      let compressedSize: number | undefined;

      // Compression phase
      if (shouldCompress(uploadFile.file)) {
        updateFile({ status: 'compressing', progress: 0 });

        if (uploadFile.type === 'image') {
          processedFile = await compressImage(uploadFile.file, (progress) => {
            updateFile({ progress });
          });
          compressedSize = processedFile.size;
          
          const savedPercent = Math.round((1 - compressedSize / uploadFile.size) * 100);
          toast.success(`${uploadFile.name} compressed (saved ${savedPercent}%)`, { duration: 3000 });
        }
      }

      // Create URL for preview
      const url = URL.createObjectURL(processedFile);
      
      // Generate thumbnail for videos
      let thumbnailUrl: string | undefined;
      if (uploadFile.type === 'video') {
        try {
          thumbnailUrl = await createVideoThumbnail(processedFile);
        } catch (error) {
          console.warn('Failed to create video thumbnail:', error);
        }
      }

      // Simulate upload phase (replace with actual upload logic)
      updateFile({ status: 'uploading', progress: 0 });
      
      // In real implementation, this would upload to Supabase Storage
      await new Promise((resolve) => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          updateFile({ progress });
          
          if (progress >= 100) {
            clearInterval(interval);
            resolve(null);
          }
        }, 100);
      });

      // Mark as completed
      updateFile({
        status: 'completed',
        progress: 100,
        compressedSize,
        url,
        thumbnailUrl,
      });

    } catch (error) {
      console.error('Upload failed:', error);
      updateFile({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Upload failed',
      });
      toast.error(`Failed to upload ${uploadFile.name}`);
    }
  };

  const removeFile = useCallback((id: string) => {
    // Abort if uploading
    const controller = abortControllers.current.get(id);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(id);
    }
    
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const pauseFile = useCallback((id: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id && f.status === 'uploading' ? { ...f, status: 'paused' } : f))
    );
    
    const controller = abortControllers.current.get(id);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(id);
    }
  }, []);

  const resumeFile = useCallback((id: string) => {
    const file = files.find((f) => f.id === id);
    if (file && file.status === 'paused') {
      processFile(file);
    }
  }, [files]);

  const retryFile = useCallback((id: string) => {
    const file = files.find((f) => f.id === id);
    if (file && file.status === 'failed') {
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: 'queued', progress: 0, error: undefined } : f))
      );
      processFile(file);
    }
  }, [files]);

  const clearCompleted = useCallback(() => {
    setFiles((prev) => prev.filter((f) => f.status !== 'completed'));
  }, []);

  const clearAll = useCallback(() => {
    // Abort all uploads
    abortControllers.current.forEach((controller) => controller.abort());
    abortControllers.current.clear();
    
    setFiles([]);
    setIsUploading(false);
  }, []);

  return {
    files,
    isUploading,
    addFiles,
    removeFile,
    pauseFile,
    resumeFile,
    retryFile,
    clearCompleted,
    clearAll,
  };
};