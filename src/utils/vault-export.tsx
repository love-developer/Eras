// Vault Export & Download Utilities
// Allows users to download entire folders or selections as ZIP files

import JSZip from 'jszip';
import saveAs from 'file-saver';

export interface ExportableMedia {
  id: string;
  type: 'photo' | 'video' | 'audio' | 'document';
  url: string;
  name?: string;
  size?: number;
  timestamp: number;
}

export interface ExportOptions {
  folderName?: string;
  includeMetadata?: boolean;
  format?: 'zip' | 'json';
}

/**
 * Download a single media file
 */
export async function downloadSingleFile(media: ExportableMedia): Promise<void> {
  try {
    const response = await fetch(media.url);
    const blob = await response.blob();
    
    const fileName = media.name || `${media.type}_${media.id}`;
    const extension = getFileExtension(media.type, blob.type);
    const fullName = `${fileName}${extension}`;
    
    saveAs(blob, fullName);
  } catch (error) {
    console.error('Failed to download file:', error);
    throw new Error(`Failed to download ${media.name || 'file'}`);
  }
}

/**
 * Download multiple media files as a ZIP
 */
export async function downloadAsZip(
  mediaItems: ExportableMedia[],
  options: ExportOptions = {}
): Promise<void> {
  const { folderName = 'Eras_Vault_Export', includeMetadata = true } = options;
  
  if (mediaItems.length === 0) {
    throw new Error('No media items to export');
  }
  
  try {
    const zip = new JSZip();
    const errors: string[] = [];
    
    // Create folder structure
    const mediaFolder = zip.folder('media');
    if (!mediaFolder) throw new Error('Failed to create media folder');
    
    // Track file names to avoid duplicates
    const fileNames = new Set<string>();
    
    // Add media files
    for (const media of mediaItems) {
      try {
        // Validate URL exists
        if (!media.url) {
          console.error(`❌ No URL for media item:`, media);
          errors.push(`${media.name || media.id}: Missing URL`);
          continue;
        }
        
        console.log(`📦 Adding to ZIP: ${media.name || media.id}`, {
          type: media.type,
          urlType: media.url.startsWith('data:') ? 'base64' : media.url.startsWith('http') ? 'http' : 'unknown',
          urlPreview: media.url.substring(0, 100)
        });
        
        const response = await fetch(media.url);
        if (!response.ok) {
          errors.push(`${media.name || media.id}: Network error`);
          continue;
        }
        
        // Get the blob and ensure it's valid
        const blob = await response.blob();
        
        // Verify blob has content
        if (!blob || blob.size === 0) {
          errors.push(`${media.name || media.id}: Empty or invalid file`);
          continue;
        }
        
        // CRITICAL: Convert blob to ArrayBuffer for proper binary handling in ZIP
        const arrayBuffer = await blob.arrayBuffer();
        
        // Get the proper extension from the blob's MIME type or URL
        let extension = getFileExtension(media.type, blob.type);
        
        // If no extension found from MIME, try to extract from URL
        if (!extension) {
          const urlMatch = media.url.match(/\.(jpg|jpeg|png|gif|webp|mp4|webm|mov|mp3|wav|ogg|weba)(\?|$)/i);
          if (urlMatch) {
            extension = `.${urlMatch[1].toLowerCase()}`;
          } else {
            // Final fallback based on type
            extension = media.type === 'photo' ? '.jpg' : 
                       media.type === 'video' ? '.mp4' : 
                       media.type === 'audio' ? '.mp3' : '';
          }
        }
        
        // Clean the name to remove any existing extension
        let baseName = media.name || media.id;
        baseName = baseName.replace(/\.(jpg|jpeg|png|gif|webp|mp4|webm|mov|mp3|wav|ogg|weba)$/i, '');
        
        let fileName = `${baseName}${extension}`;
        
        // Handle duplicate names
        let counter = 1;
        const originalBaseName = baseName;
        while (fileNames.has(fileName)) {
          fileName = `${originalBaseName}_${counter}${extension}`;
          counter++;
        }
        fileNames.add(fileName);
        
        // Add to appropriate subfolder with proper binary data
        const subfolder = mediaFolder.folder(media.type + 's');
        if (subfolder) {
          // Add as blob with proper binary handling
          subfolder.file(fileName, arrayBuffer, { binary: true });
        } else {
          mediaFolder.file(fileName, arrayBuffer, { binary: true });
        }
      } catch (err) {
        console.error(`Failed to add ${media.name || media.id}:`, err);
        errors.push(`${media.name || media.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
    
    // Add metadata file if requested
    if (includeMetadata) {
      const metadata = {
        exportedAt: new Date().toISOString(),
        folderName,
        totalItems: mediaItems.length,
        successfulItems: mediaItems.length - errors.length,
        errors: errors.length > 0 ? errors : undefined,
        items: mediaItems.map(m => ({
          id: m.id,
          type: m.type,
          name: m.name,
          size: m.size,
          timestamp: m.timestamp,
          date: new Date(m.timestamp).toISOString()
        }))
      };
      
      zip.file('metadata.json', JSON.stringify(metadata, null, 2));
      
      // Add a README
      const readme = generateReadme(folderName, mediaItems.length, errors);
      zip.file('README.txt', readme);
    }
    
    // Generate and download ZIP
    const content = await zip.generateAsync(
      { type: 'blob' },
      (metadata: { percent: number }) => {
        // Progress callback could be used for UI updates
        console.log(`Generating ZIP: ${Math.round(metadata.percent)}%`);
      }
    );
    
    const zipFileName = `${folderName}_${new Date().toISOString().split('T')[0]}.zip`;
    saveAs(content, zipFileName);
    
    if (errors.length > 0) {
      console.warn(`Export completed with ${errors.length} errors:`, errors);
      return Promise.reject(new Error(`${errors.length} files failed to export`));
    }
  } catch (error) {
    console.error('Failed to create ZIP:', error);
    throw error;
  }
}

/**
 * Download folder metadata as JSON
 */
export async function downloadMetadataAsJson(
  mediaItems: ExportableMedia[],
  folderName: string
): Promise<void> {
  const metadata = {
    exportedAt: new Date().toISOString(),
    folderName,
    totalItems: mediaItems.length,
    items: mediaItems.map(m => ({
      id: m.id,
      type: m.type,
      name: m.name,
      size: m.size,
      timestamp: m.timestamp,
      date: new Date(m.timestamp).toISOString(),
      url: m.url
    }))
  };
  
  const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
  const fileName = `${folderName}_metadata_${new Date().toISOString().split('T')[0]}.json`;
  saveAs(blob, fileName);
}

/**
 * Get file extension based on media type and MIME type
 */
function getFileExtension(mediaType: string, mimeType: string): string {
  // Try to get extension from MIME type first
  const mimeExtensions: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'audio/ogg': '.ogg',
    'audio/webm': '.weba',
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/vnd.ms-powerpoint': '.ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    'text/plain': '.txt',
    'application/rtf': '.rtf',
    'text/csv': '.csv'
  };
  
  if (mimeExtensions[mimeType]) {
    return mimeExtensions[mimeType];
  }
  
  // Fallback to media type
  const typeExtensions: Record<string, string> = {
    photo: '.jpg',
    video: '.mp4',
    audio: '.mp3',
    document: '.pdf'
  };
  
  return typeExtensions[mediaType] || '';
}

/**
 * Generate README file content
 */
function generateReadme(folderName: string, totalItems: number, errors: string[]): string {
  const date = new Date().toLocaleDateString();
  const time = new Date().toLocaleTimeString();
  
  return `
╔════════════════════════════════════════════════════════════╗
║                    ERAS VAULT EXPORT                       ║
╚════════════════════════════════════════════════════════════╝

Folder Name: ${folderName}
Exported On: ${date} at ${time}
Total Items: ${totalItems}
${errors.length > 0 ? `Failed Items: ${errors.length}` : 'Status: All items exported successfully ✓'}

═══════════════════════════════════════════════════════════════

FOLDER STRUCTURE:
├── media/
│   ├── photos/     - All photo files
│   ├── videos/     - All video files
│   └── audios/     - All audio files
├── metadata.json   - Detailed item information
└── README.txt      - This file

═══════════════════════════════════════════════════════════════

ABOUT ERAS:
Eras is your digital time capsule application for preserving
memories across the timeline of your life. This export contains
media from your Vault folder.

═══════════════════════════════════════════════════════════════

${errors.length > 0 ? `
EXPORT ERRORS:
The following items could not be exported:

${errors.map(e => `• ${e}`).join('\n')}

═══════════════════════════════════════════════════════════════
` : ''}

PRIVACY & SECURITY:
This export was generated locally in your browser. Your media
files remain private and secure.

═══════════════════════════════════════════════════════════════

Thank you for using Eras! 🌌

`.trim();
}

/**
 * Calculate total size of media items
 */
export function calculateTotalSize(mediaItems: ExportableMedia[]): number {
  return mediaItems.reduce((total, item) => total + (item.size || 0), 0);
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Estimate ZIP file size (approximately 95% of total for media files)
 */
export function estimateZipSize(mediaItems: ExportableMedia[]): number {
  const totalSize = calculateTotalSize(mediaItems);
  return Math.round(totalSize * 0.95); // Media files don't compress much
}