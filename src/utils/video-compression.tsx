/**
 * Media File Utility
 * Handles file validation and returns original files
 * 
 * NOTE: Client-side video compression was removed because:
 * - Browser-based re-encoding was unreliable and often increased file sizes
 * - Modern phones already compress videos efficiently (H.264/HEVC)
 * - Server has 500MB limit which handles typical user videos
 * - Future: Implement server-side transcoding with FFmpeg if needed
 */

interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  quality: number;
  onProgress?: (progress: number) => void;
}

/**
 * Returns the original video file without compression
 * Modern phones already compress videos efficiently
 * 
 * @param file - The original video file
 * @param options - Options (for compatibility, mostly ignored)
 * @returns Original video file
 */
export async function compressVideo(
  file: File,
  options: CompressionOptions = {
    maxSizeMB: 500,
    maxWidthOrHeight: 1920,
    quality: 0.8,
  }
): Promise<File> {
  const sizeMB = file.size / (1024 * 1024);
  console.log(`📹 Video file size: ${sizeMB.toFixed(2)}MB (max: ${options.maxSizeMB}MB)`);
  
  // Report progress immediately
  options.onProgress?.(10);
  
  // Validate file size
  if (sizeMB > options.maxSizeMB) {
    console.warn(`⚠️ Video exceeds ${options.maxSizeMB}MB limit`);
    options.onProgress?.(100);
    // Return file anyway - server will handle rejection with proper error
    return file;
  }
  
  // Simulate brief processing for UX (so progress bar shows)
  await new Promise(resolve => setTimeout(resolve, 100));
  options.onProgress?.(100);
  
  console.log(`✅ Video ready for upload: ${sizeMB.toFixed(2)}MB`);
  return file;
}

/**
 * Compresses an image file using canvas resizing
 * This actually works well for images (unlike video)
 * 
 * @param file - The original image file
 * @param options - Compression options
 * @returns Compressed image file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {
    maxSizeMB: 50,
    maxWidthOrHeight: 2048,
    quality: 0.85,
  }
): Promise<File> {
  const sizeMB = file.size / (1024 * 1024);
  console.log(`🖼️ Image file size: ${sizeMB.toFixed(2)}MB`);
  
  // If image is already small enough, return original
  if (sizeMB <= options.maxSizeMB) {
    console.log('✅ Image is already optimally sized');
    options.onProgress?.(100);
    return file;
  }
  
  console.log(`🔄 Starting image compression for ${file.name}...`);
  options.onProgress?.(10);
  
  try {
    const img = new Image();
    const imgLoadPromise = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image'));
    });
    
    img.src = URL.createObjectURL(file);
    await imgLoadPromise;
    
    options.onProgress?.(30);
    
    let { width, height } = img;
    
    // Calculate new dimensions
    if (width > options.maxWidthOrHeight || height > options.maxWidthOrHeight) {
      const ratio = Math.min(
        options.maxWidthOrHeight / width,
        options.maxWidthOrHeight / height
      );
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
      console.log(`📐 Resizing image to: ${width}x${height}`);
    }
    
    options.onProgress?.(50);
    
    // Create canvas and draw resized image
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    ctx.drawImage(img, 0, 0, width, height);
    options.onProgress?.(70);
    
    // Convert to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        file.type,
        options.quality
      );
    });
    
    options.onProgress?.(95);
    
    // Clean up
    URL.revokeObjectURL(img.src);
    
    const compressedFile = new File([blob], file.name, { type: file.type });
    const compressedSizeMB = compressedFile.size / (1024 * 1024);
    
    console.log(`✅ Image compressed: ${sizeMB.toFixed(2)}MB → ${compressedSizeMB.toFixed(2)}MB (${((1 - compressedSizeMB / sizeMB) * 100).toFixed(1)}% reduction)`);
    
    options.onProgress?.(100);
    
    // Return compressed file if it's actually smaller, otherwise original
    return compressedSizeMB < sizeMB ? compressedFile : file;
    
  } catch (error) {
    console.error('❌ Image compression failed:', error);
    options.onProgress?.(100);
    return file;
  }
}

/**
 * Determines if a file should be compressed
 * Videos: No (phones already compress well)
 * Images: Yes, if over threshold
 */
export function shouldCompress(file: File, thresholdMB: number = 50): boolean {
  const sizeMB = file.size / (1024 * 1024);
  const isImage = file.type.startsWith('image/');
  
  // Only compress large images
  // Don't compress videos (phones already do this well)
  return isImage && sizeMB > thresholdMB;
}
