import React, { useState, useRef, useEffect } from 'react';
import { useAchievements } from '../hooks/useAchievements';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent } from './ui/card';
import { 
  X,
  Save,
  Sparkles,
  Undo,
  Redo,
  Play,
  Pause,
  RotateCcw,
  Sun,
  Sunset,
  Moon,
  Cloud,
  Zap,
  Type,
  Sticker,
  Clock,
  Volume2,
  Wand2,
  Eye,
  EyeOff,
  Download,
  Film,
  Palette,
  Layers,
  Music,
  Mic,
  Video,
  FileText,
  Calendar,
  Loader2,
  Camera,
  Droplets,
  Wind,
  Flame,
  Snowflake,
  Star,
  Heart,
  Smile,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Aperture,
  Activity,
  Disc3,
  Trash2,
  Crop,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Sliders,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';

// Emotional Filters for Photos & Videos (Eras-themed) - Streamlined to 4 distinctive filters
const EMOTIONAL_FILTERS = [
  { 
    id: 'none', 
    name: 'Original', 
    icon: Eye, 
    description: 'Unedited memory',
    cssFilter: '',
    gradient: 'from-gray-500 to-gray-600'
  },
  { 
    id: 'yesterday', 
    name: 'Yesterday', 
    icon: Sunset, 
    description: 'Warm vintage tones',
    cssFilter: 'sepia(0.5) saturate(1.2) brightness(1.05) contrast(1.1)',
    gradient: 'from-orange-600 to-yellow-700'
  },
  { 
    id: 'echo', 
    name: 'Echo', 
    icon: Moon, 
    description: 'Memory & loss theme',
    cssFilter: 'grayscale(0.7) contrast(1.2) brightness(0.9)',
    gradient: 'from-gray-600 to-slate-500'
  },
  { 
    id: 'dream', 
    name: 'Dream', 
    icon: Cloud, 
    description: 'Soft reminiscence',
    cssFilter: 'brightness(1.1) saturate(0.7) contrast(0.85) blur(0.3px)',
    gradient: 'from-pink-300 to-purple-300'
  }
];

// Audio filter interface
interface AudioFilter {
  id: string;
  name: string;
  description: string;
  lowpass?: number;
  highpass?: number;
  gain?: number;
  reverb?: number;
  delay?: number;
  feedback?: number;
  distortion?: number;
  bright?: boolean;
  normalize?: boolean;
}

// Audio Enhancement Filters - ONLY 6 EXTREME, AUDIBLY DIFFERENT FILTERS
// Each filter must be DRAMATICALLY different or it doesn't exist!
const AUDIO_FILTERS: AudioFilter[] = [
  { 
    id: 'none', 
    name: 'Original', 
    description: 'Unprocessed audio' 
  },
  { 
    id: 'telephone', 
    name: 'Telephone', 
    description: 'Phone call from 1960', 
    lowpass: 3000,      // EXTREME narrow bandwidth
    highpass: 400,      // Cut all bass
    gain: 0.75,         // Quieter/distant
    distortion: 0.15    // Heavy telephone distortion
  },
  { 
    id: 'tape-echo', 
    name: 'Tape Echo', 
    description: 'Vintage delay effect', 
    delay: 0.4,         // LONG delay (400ms)
    feedback: 0.6,      // STRONG feedback (5+ echoes)
    gain: 1.0
  },
  { 
    id: 'cathedral', 
    name: 'Cathedral', 
    description: 'Massive reverb space', 
    reverb: 0.85,       // EXTREME reverb (85%!)
    gain: 0.8           // Quieter for distance
  },
  { 
    id: 'crystal-clear', 
    name: 'Crystal Clear', 
    description: 'Pristine bright clarity', 
    bright: true,       // EXTREME high-shelf boost
    gain: 1.35,         // Louder
    highpass: 30        // Only remove rumble
  },
  { 
    id: 'vinyl-warmth', 
    name: 'Vinyl Warmth', 
    description: 'Warm saturated tone', 
    lowpass: 5000,      // EXTREME warmth
    highpass: 50,       // Keep deep bass
    distortion: 0.25,   // HEAVY saturation (25%!)
    gain: 1.15
  }
];

// Ambient Sounds for Audio - Era-themed atmospheres
const AMBIENT_SOUNDS = [
  { id: 'none', name: 'None' },
  { id: 'rain', name: 'Gentle Rain', icon: Droplets },
  { id: 'wind', name: 'Soft Wind', icon: Wind },
  { id: 'vinyl-crackle', name: 'Vinyl Crackle', icon: Disc3 },
  { id: 'tape-hiss', name: 'Tape Hiss', icon: Music },
  { id: 'piano', name: 'Piano', icon: Music },
  { id: 'fire', name: 'Fireplace', icon: Flame }
];

// Curated Visual Effects - Simple, impactful, Eras-themed
const VISUAL_EFFECTS = [
  // Memory Effects - Vintage & Nostalgia
  { id: 'vignette', name: 'Soft Focus', icon: Aperture, description: 'Dreamy edges', intensity: 50 },
  { id: 'grain', name: 'Film Memory', icon: Film, description: 'Vintage texture', intensity: 30 },
  { id: 'light-leak', name: 'Golden Hour', icon: Sun, description: 'Warm glow', intensity: 60 },
  
  // Atmosphere Effects - Mood & Feeling
  { id: 'bokeh', name: 'Starlight', icon: Sparkles, description: 'Dreamy lights', intensity: 12 },
  { id: 'confetti', name: 'Celebration', icon: Star, description: 'Joyful moments', intensity: 40 },
  
  // Frame Effects - Classic Style
  { id: 'polaroid', name: 'Instant Photo', icon: Camera, description: 'Classic frame', intensity: 100 }
];

// Sticker Icons (Eras themed) - Colorful memories & moments
const ERA_STICKERS = [
  { id: 'heart', name: 'Heart', icon: Heart, color: 'text-rose-500' },
  { id: 'star', name: 'Star', icon: Star, color: 'text-yellow-400' },
  { id: 'sparkles', name: 'Sparkles', icon: Sparkles, color: 'text-purple-400' },
  { id: 'camera', name: 'Camera', icon: Camera, color: 'text-blue-500' },
  { id: 'music', name: 'Music', icon: Music, color: 'text-pink-500' },
  { id: 'clock', name: 'Time', icon: Clock, color: 'text-cyan-500' },
  { id: 'sun', name: 'Sunshine', icon: Sun, color: 'text-orange-400' },
  { id: 'moon', name: 'Moon', icon: Moon, color: 'text-indigo-400' },
  { id: 'cloud', name: 'Dream', icon: Cloud, color: 'text-sky-300' }
];

// Font options for text overlays
const TEXT_FONTS = [
  { id: 'sans', name: 'Sans Serif', style: 'font-sans' },
  { id: 'serif', name: 'Serif', style: 'font-serif' },
  { id: 'mono', name: 'Monospace', style: 'font-mono' },
  { id: 'cursive', name: 'Cursive', style: 'font-cursive' },
  { id: 'display', name: 'Display', style: 'font-display' }
];

// ✨ PHASE 5: AI ENHANCEMENTS + PRESET SYSTEM

// Enhancement Preset Interface
interface EnhancementPreset {
  id: string;
  name: string;
  description: string;
  icon: any;
  gradient: string;
  settings: {
    brightness: number;
    contrast: number;
    saturation: number;
    filter?: string; // Optional filter ID
  };
  category: 'all' | 'portrait' | 'creative' | 'custom'; // Simplified categories
  isCustom?: boolean;
}

// Built-in Enhancement Presets - Streamlined to 6 essential presets
const ENHANCEMENT_PRESETS: EnhancementPreset[] = [
  {
    id: 'auto-enhance',
    name: 'AI Auto-Enhance',
    description: 'Smart automatic enhancement',
    icon: Wand2,
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    settings: { brightness: 105, contrast: 110, saturation: 108 },
    category: 'portrait'
  },
  {
    id: 'portrait-pro',
    name: 'Portrait Pro',
    description: 'Perfect for people',
    icon: Camera,
    gradient: 'from-pink-500 to-rose-500',
    settings: { brightness: 103, contrast: 102, saturation: 95, filter: 'yesterday' },
    category: 'portrait'
  },
  {
    id: 'night-mode',
    name: 'Night Mode',
    description: 'Low light enhancement',
    icon: Moon,
    gradient: 'from-indigo-600 to-purple-700',
    settings: { brightness: 115, contrast: 108, saturation: 90, filter: 'echo' },
    category: 'creative'
  },
  {
    id: 'vintage-film',
    name: 'Vintage Film',
    description: 'Classic analog look',
    icon: Film,
    gradient: 'from-amber-600 to-orange-700',
    settings: { brightness: 98, contrast: 112, saturation: 85, filter: 'yesterday' },
    category: 'creative'
  },
  {
    id: 'black-white',
    name: 'Timeless B&W',
    description: 'Classic monochrome',
    icon: Activity,
    gradient: 'from-gray-600 to-gray-800',
    settings: { brightness: 105, contrast: 120, saturation: 0, filter: 'echo' },
    category: 'creative'
  },
  {
    id: 'dreamy-soft',
    name: 'Dreamy Soft',
    description: 'Soft romantic glow',
    icon: Cloud,
    gradient: 'from-pink-400 to-purple-400',
    settings: { brightness: 110, contrast: 85, saturation: 90, filter: 'dream' },
    category: 'creative'
  }
];

// 🎨 PHASE 3: Crop Aspect Ratios
const CROP_ASPECT_RATIOS = [
  { id: 'free', name: 'Free', ratio: null, icon: Crop },
  { id: '1:1', name: 'Square', ratio: 1 / 1, icon: Crop, description: '1:1' },
  { id: '4:3', name: 'Standard', ratio: 4 / 3, icon: Crop, description: '4:3' },
  { id: '16:9', name: 'Wide', ratio: 16 / 9, icon: Crop, description: '16:9' },
  { id: '9:16', name: 'Portrait', ratio: 9 / 16, icon: Crop, description: '9:16' }
];

// 🔮 PHASE 1: ENHANCEMENT CATEGORIZATION
type EnhancementCategory = 'visual' | 'audio' | 'overlays';
type MediaType = 'photo' | 'video' | 'audio';

interface EnhancementTab {
  id: EnhancementCategory;
  label: string;
  icon: any;
  gradient: string; // Eras cosmic gradients
  description: string;
  compatibleTypes: MediaType[];
}

const ENHANCEMENT_TABS: EnhancementTab[] = [
  {
    id: 'visual',
    label: 'Visual',
    icon: Palette,
    gradient: 'from-blue-600 via-purple-600 to-purple-700',
    description: 'Filters & effects',
    compatibleTypes: ['photo', 'video']
  },
  {
    id: 'audio',
    label: 'Audio',
    icon: Volume2,
    gradient: 'from-violet-600 via-pink-600 to-pink-700',
    description: 'Sound enhancements',
    compatibleTypes: ['audio'] // ✅ Only audio files, not video
  },
  {
    id: 'overlays',
    label: 'Overlays',
    icon: Layers,
    gradient: 'from-amber-500 via-orange-500 to-yellow-500',
    description: 'Text & stickers',
    compatibleTypes: ['photo', 'video'] // ❌ Audio excluded - text/stickers don't make sense for audio
  }
];

interface MediaEnhancementOverlayProps {
  mediaFile?: {
    blob?: Blob;
    url?: string;
    type: 'photo' | 'video' | 'audio';
    filename?: string;
    id?: string; // Original media ID from Vault
    thumbnail?: string; // Video thumbnail for poster
  };
  mediaFiles?: Array<{
    blob?: Blob;
    url?: string;
    type: 'photo' | 'video' | 'audio';
    filename?: string;
    id?: string; // Original media ID from Vault
    thumbnail?: string; // Video thumbnail for poster
  }>;
  onSave: (enhancedMedia: any) => void; // Always creates new vault item
  onReplaceSave?: (enhancedMedia: any, originalMediaId: string) => void; // Replaces existing vault item
  onUseInCapsule: (enhancedMedia: any) => void;
  onCancel: () => void; // Renamed from onDiscard for clarity
}

// Enhancement History State for Undo Functionality
interface StickerInstance {
  id: string; // Unique instance ID
  type: string; // Sticker type (heart, star, etc.)
  x: number;
  y: number;
  size: number;
}

// 🎨 PHASE 4B: Text Layer Interface
interface TextLayer {
  id: string;
  text: string;
  x: number; // percentage
  y: number; // percentage
  font: string;
  size: number;
  color: string;
  rotation: number; // degrees
  shadowBlur: number;
  shadowColor: string;
  outlineWidth: number;
  outlineColor: string;
}

interface EnhancementState {
  selectedFilter: string;
  selectedAudioFilter: string;
  visualEffects: Set<string>;
  captionText: string;
  showDateStamp: boolean;
  dateStampText: string;
  selectedStickers: StickerInstance[];
  textFont: string;
  textSize: number;
  textColor: string;
  textX: number;
  textY: number;
  selectedAmbient: string;
  // 🎨 PHASE 2: Advanced Editing Tools
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  cropAspectRatio: string;
  // 🎨 PHASE 3: Crop Tool
  cropRegion: { x: number; y: number; width: number; height: number } | null;
  showCropMode: boolean;
}

// Helper to ensure filename has proper extension
const ensureProperFilename = (filename: string | undefined, mimeType: string, mediaType: string): string => {
  // Get extension from MIME type
  const getExtension = (mime: string): string => {
    const parts = mime.split('/');
    if (parts.length === 2) {
      const subtype = parts[1].split(';')[0]; // Remove any parameters
      // Map common MIME subtypes to extensions
      if (subtype === 'jpeg') return 'jpg';
      if (subtype === 'mpeg') return 'mp3';
      if (subtype === 'quicktime') return 'mov';
      return subtype;
    }
    return mediaType === 'photo' ? 'jpg' : mediaType === 'video' ? 'mp4' : 'mp3';
  };
  
  if (!filename) {
    // No filename, create one with proper extension
    const ext = getExtension(mimeType);
    return `${mediaType}-${Date.now()}.${ext}`;
  }
  
  // Get the correct extension based on MIME type
  const correctExt = getExtension(mimeType);
  
  // Check if filename has extension
  const hasExtension = /\.[a-zA-Z0-9]{2,4}$/.test(filename);
  
  if (hasExtension) {
    // REPLACE the existing extension with the correct one based on blob type
    // This is critical when converting formats (e.g., video.webm -> photo.jpg)
    const basename = filename.replace(/\.[a-zA-Z0-9]{2,4}$/, '');
    return `${basename}.${correctExt}`;
  }
  
  // Filename exists but no extension - add one
  return `${filename}.${correctExt}`;
};

export function MediaEnhancementOverlay({ mediaFile, mediaFiles, onSave, onReplaceSave, onUseInCapsule, onCancel }: MediaEnhancementOverlayProps) {
  // 🏆 Achievement tracking hooks
  const { trackAction } = useAchievements();
  const { session } = useAuth();
  
  // Carousel state - handle both single and multiple media files
  const files = mediaFiles || (mediaFile ? [mediaFile] : []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoThumbnails, setVideoThumbnails] = useState<Map<number, string>>(new Map());
  const currentMediaFile = files[currentIndex] || mediaFile || files[0];
  const isCarouselMode = files.length > 1;
  
  // 🎯 NEW: Track enhancements per file in carousel mode
  // Map<file index, enhancement settings>
  const [perFileEnhancements, setPerFileEnhancements] = useState<Map<number, {
    filter: string;
    audioFilter: string;
    visualEffects: Set<string>;
    captionText: string;
    stickers: StickerInstance[];
    showDateStamp: boolean;
    dateStampText: string;
    brightness: number;
    contrast: number;
    saturation: number;
    rotation: number;
    flipHorizontal: boolean;
    flipVertical: boolean;
  }>>(new Map());
  
  // Early validation - if no valid media, show error state
  if (!currentMediaFile || (!currentMediaFile.blob && !currentMediaFile.url)) {
    return (
      <div className="fixed inset-0 z-[10010] bg-black/95 flex items-center justify-center">
        <div className="text-center space-y-4 p-6">
          <X className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-xl text-white">Invalid Media</h3>
          <p className="text-gray-400">No valid media source found.</p>
          <Button onClick={onCancel} variant="outline" className="mt-4">
            Close
          </Button>
        </div>
      </div>
    );
  }
  
  // 🎬 VIDEO BLOCK: Safety check - videos should not reach enhancement overlay
  if (currentMediaFile.type === 'video') {
    console.error('🎬 VIDEO BLOCKED: Videos cannot be enhanced (would become single photo frames)');
    return (
      <div className="fixed inset-0 z-[10010] bg-black/95 flex items-center justify-center">
        <div className="text-center space-y-4 p-6">
          <Film className="w-12 h-12 text-yellow-500 mx-auto" />
          <h3 className="text-xl text-white">Videos Cannot Be Enhanced</h3>
          <p className="text-gray-400">Video enhancement would convert your video to a single photo frame.</p>
          <p className="text-sm text-gray-500 mt-2">Videos can be attached to capsules without enhancement.</p>
          <Button onClick={onCancel} variant="outline" className="mt-4">
            Close
          </Button>
        </div>
      </div>
    );
  }
  
  // All state declarations
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [selectedAudioFilter, setSelectedAudioFilter] = useState('none');
  const [selectedAmbient, setSelectedAmbient] = useState('none');
  const [visualEffects, setVisualEffects] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDateStamp, setShowDateStamp] = useState(false);
  const [dateStampText, setDateStampText] = useState(new Date().toLocaleDateString());
  const [captionText, setCaptionText] = useState('');
  const [captionPosition, setCaptionPosition] = useState<'top' | 'bottom'>('bottom');
  const [selectedStickers, setSelectedStickers] = useState<StickerInstance[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showTranscription, setShowTranscription] = useState(false);
  const [activeTab, setActiveTab] = useState<EnhancementCategory>('visual');
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [isPreviewingAudio, setIsPreviewingAudio] = useState(false);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  
  // 🎨 PHASE 2: Advanced Editing Tools State
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);
  const [cropAspectRatio, setCropAspectRatio] = useState('free');
  const [showAdvancedEdit, setShowAdvancedEdit] = useState(false);
  
  // 🎨 PHASE 3: Crop Tool State
  const [showCropMode, setShowCropMode] = useState(false);
  const [cropRegion, setCropRegion] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  
  // 🎨 PHASE 4A: Draggable Crop Handles State
  const [cropDragHandle, setCropDragHandle] = useState<'center' | 'nw' | 'ne' | 'sw' | 'se' | null>(null);
  const [cropDragStart, setCropDragStart] = useState<{ cropRegion: { x: number; y: number; width: number; height: number }, mouseX: number, mouseY: number } | null>(null);
  
  // ✨ PHASE 5: AI Enhancements + Preset System State
  const [customPresets, setCustomPresets] = useState<EnhancementPreset[]>([]);
  const [showPresetManager, setShowPresetManager] = useState(false);
  const [isApplyingPreset, setIsApplyingPreset] = useState(false);
  const [selectedPresetCategory, setSelectedPresetCategory] = useState<'all'>('all'); // Always show all presets

  // Generate video thumbnails for carousel navigation
  useEffect(() => {
    const generateVideoThumbnail = async (file: any, index: number) => {
      try {
        let videoUrl = file.url || (file.blob ? URL.createObjectURL(file.blob) : '');
        if (!videoUrl) return;

        // 🔥 CRITICAL FIX: Convert cross-origin URLs to blob URLs to prevent canvas tainting
        // - Cross-origin resources drawn to canvas will taint it, causing SecurityError on toDataURL()
        const isSupabaseUrl = videoUrl.includes('supabase.co') || videoUrl.includes('supabase.in');
        const isCrossOrigin = videoUrl.startsWith('http') && !videoUrl.startsWith(window.location.origin);
        let convertedToBlobUrl = false;
        
        if ((isSupabaseUrl || isCrossOrigin) && !videoUrl.startsWith('blob:')) {
          console.log('🔄 Cross-origin video URL detected for thumbnail, fetching and converting to blob...');
          try {
            const response = await fetch(videoUrl);
            const blob = await response.blob();
            
            // 🎥 FIX: Convert QuickTime videos to use video/mp4 MIME type for thumbnail generation
            let blobToUse = blob;
            if (blob.type === 'video/quicktime' || videoUrl.toLowerCase().endsWith('.mov')) {
              console.log('🔄 Converting QuickTime blob to video/mp4 MIME type for thumbnail generation');
              blobToUse = new Blob([blob], { type: 'video/mp4' });
            }
            
            videoUrl = URL.createObjectURL(blobToUse);
            convertedToBlobUrl = true;
            console.log('✅ Converted cross-origin video URL to blob URL for thumbnail');
          } catch (fetchError) {
            console.error('❌ Failed to fetch cross-origin video for thumbnail:', fetchError);
            return; // Skip thumbnail generation if we can't fetch the video
          }
        }

        const video = document.createElement('video');
        // Don't set crossOrigin - we've already converted cross-origin URLs to blob URLs
        video.src = videoUrl;
        video.currentTime = 0.1; // Seek to 0.1 seconds to get first frame
        
        await new Promise((resolve, reject) => {
          video.onloadeddata = resolve;
          video.onerror = reject;
        });

        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 160;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Calculate dimensions to cover the square canvas
          const videoAspect = video.videoWidth / video.videoHeight;
          let drawWidth, drawHeight, offsetX, offsetY;
          
          if (videoAspect > 1) {
            // Video is wider - fit height and crop sides
            drawHeight = canvas.height;
            drawWidth = drawHeight * videoAspect;
            offsetX = -(drawWidth - canvas.width) / 2;
            offsetY = 0;
          } else {
            // Video is taller - fit width and crop top/bottom
            drawWidth = canvas.width;
            drawHeight = drawWidth / videoAspect;
            offsetX = 0;
            offsetY = -(drawHeight - canvas.height) / 2;
          }
          
          ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
          
          setVideoThumbnails(prev => {
            const newMap = new Map(prev);
            newMap.set(index, thumbnailUrl);
            return newMap;
          });
        }
        
        // Clean up if we created a blob URL
        if ((file.blob && !file.url) || convertedToBlobUrl) {
          URL.revokeObjectURL(videoUrl);
        }
      } catch (error) {
        console.error('Failed to generate video thumbnail:', error);
      }
    };

    // Generate thumbnails for all video files
    files.forEach((file, index) => {
      if (file.type === 'video' && !videoThumbnails.has(index)) {
        generateVideoThumbnail(file, index);
      }
    });
  }, [files]);

  // Show swipe hint on mobile in carousel mode
  useEffect(() => {
    if (isCarouselMode && window.innerWidth < 768) {
      setShowSwipeHint(true);
      const timer = setTimeout(() => setShowSwipeHint(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isCarouselMode]);

  // Reset tab to compatible tab based on media type
  useEffect(() => {
    const currentTab = ENHANCEMENT_TABS.find(t => t.id === activeTab);
    if (currentTab && !currentTab.compatibleTypes.includes(currentMediaFile.type)) {
      // Find first compatible tab
      const compatibleTab = ENHANCEMENT_TABS.find(t => 
        t.compatibleTypes.includes(currentMediaFile.type)
      );
      if (compatibleTab) {
        setActiveTab(compatibleTab.id);
      }
    }
  }, [currentMediaFile.type, activeTab]);

  // Track changes and save to history when significant changes occur
  useEffect(() => {
    // Only save to history if we have a change (not on initial mount)
    // Skip if this is the first render or if we're navigating in carousel
    const hasChanges = 
      selectedFilter !== 'none' || 
      selectedAudioFilter !== 'none' ||
      visualEffects.size > 0 ||
      captionText !== '' ||
      showDateStamp ||
      selectedStickers.length > 0 ||
      selectedAmbient !== 'none' ||
      brightness !== 100 ||
      contrast !== 100 ||
      saturation !== 100 ||
      rotation !== 0 ||
      flipHorizontal ||
      flipVertical ||
      cropRegion !== null;
    
    if (hasChanges) {
      // Debounce history saves to avoid too many entries
      const timer = setTimeout(() => {
        saveToHistory();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedFilter, selectedAudioFilter, visualEffects, captionText, showDateStamp, selectedStickers, selectedAmbient, brightness, contrast, saturation, rotation, flipHorizontal, flipVertical, cropRegion]);
  
  // Text overlay customization (legacy - keeping for backward compat)
  const [textFont, setTextFont] = useState('sans');
  const [textSize, setTextSize] = useState(24);
  const [textColor, setTextColor] = useState('#ffffff');
  const [textX, setTextX] = useState(50); // percentage
  const [textY, setTextY] = useState(85); // percentage
  const [isDraggingText, setIsDraggingText] = useState(false);
  
  // 🎨 PHASE 4B: Multiple Text Layers System
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [selectedTextLayerId, setSelectedTextLayerId] = useState<string | null>(null);
  const [draggingTextLayerId, setDraggingTextLayerId] = useState<string | null>(null);
  const [textLayerIdCounter, setTextLayerIdCounter] = useState(0);
  const [showTextLayerEditor, setShowTextLayerEditor] = useState(false);
  
  // Sticker customization
  const [draggingSticker, setDraggingSticker] = useState<string | null>(null);
  const [stickerIdCounter, setStickerIdCounter] = useState(0);
  
  // Undo History - Track enhancement changes for undo functionality
  const [history, setHistory] = useState<EnhancementState[]>([]);
  
  // Save current state to history
  const saveToHistory = () => {
    const currentState: EnhancementState = {
      selectedFilter,
      selectedAudioFilter,
      visualEffects: new Set(visualEffects),
      captionText,
      showDateStamp,
      dateStampText,
      selectedStickers: selectedStickers.map(s => ({ ...s })),
      textFont,
      textSize,
      textColor,
      textX,
      textY,
      selectedAmbient,
      // 🎨 PHASE 2: Advanced Editing Tools
      brightness,
      contrast,
      saturation,
      rotation,
      flipHorizontal,
      flipVertical,
      cropAspectRatio,
      // 🎨 PHASE 3: Crop Tool
      cropRegion: cropRegion ? { ...cropRegion } : null,
      showCropMode
    };
    setHistory([...history, currentState]);
  };

  // Undo to previous state
  const handleUndo = () => {
    if (history.length === 0) {
      toast.error('No more changes to undo');
      return;
    }

    const previousState = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    
    // Restore previous state
    setSelectedFilter(previousState.selectedFilter);
    setSelectedAudioFilter(previousState.selectedAudioFilter);
    setVisualEffects(new Set(previousState.visualEffects));
    setCaptionText(previousState.captionText);
    setShowDateStamp(previousState.showDateStamp);
    setDateStampText(previousState.dateStampText);
    setSelectedStickers(previousState.selectedStickers.map(s => ({ ...s })));
    setTextFont(previousState.textFont);
    setTextSize(previousState.textSize);
    setTextColor(previousState.textColor);
    setTextX(previousState.textX);
    setTextY(previousState.textY);
    setSelectedAmbient(previousState.selectedAmbient);
    
    // 🎨 PHASE 2 & 3: Restore advanced editing state
    if (previousState.brightness !== undefined) setBrightness(previousState.brightness);
    if (previousState.contrast !== undefined) setContrast(previousState.contrast);
    if (previousState.saturation !== undefined) setSaturation(previousState.saturation);
    if (previousState.rotation !== undefined) setRotation(previousState.rotation);
    if (previousState.flipHorizontal !== undefined) setFlipHorizontal(previousState.flipHorizontal);
    if (previousState.flipVertical !== undefined) setFlipVertical(previousState.flipVertical);
    if (previousState.cropAspectRatio !== undefined) setCropAspectRatio(previousState.cropAspectRatio);
    if (previousState.cropRegion !== undefined) setCropRegion(previousState.cropRegion);
    if (previousState.showCropMode !== undefined) setShowCropMode(previousState.showCropMode);
    
    setHistory(newHistory);
    toast.success('Undid last change');
  };
  
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [mediaUrl, setMediaUrl] = useState<string>('');
  
  // Touch swipe state for carousel navigation
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Create object URL for media
  useEffect(() => {
    console.log('🔍 Media URL Effect triggered:', {
      hasFile: !!currentMediaFile,
      hasBlob: !!currentMediaFile?.blob,
      blobType: currentMediaFile?.blob?.constructor?.name,
      blobSize: currentMediaFile?.blob?.size,
      hasUrl: !!currentMediaFile?.url,
      url: currentMediaFile?.url,
      type: currentMediaFile?.type
    });
    
    // Validate that we have a currentMediaFile
    if (!currentMediaFile) {
      console.warn('⚠️ No currentMediaFile available');
      setMediaUrl('');
      return;
    }
    
    if (currentMediaFile.blob && currentMediaFile.blob instanceof Blob && currentMediaFile.blob.size > 0) {
      try {
        // 🎥 FIX: Convert QuickTime videos to use video/mp4 MIME type for browser compatibility
        // Modern .mov files use MP4 container format and can be played as MP4
        let blobToUse = currentMediaFile.blob;
        if (currentMediaFile.blob.type === 'video/quicktime' || 
            (currentMediaFile.name && currentMediaFile.name.toLowerCase().endsWith('.mov'))) {
          console.log('🔄 Converting QuickTime blob to video/mp4 MIME type for playback compatibility');
          blobToUse = new Blob([currentMediaFile.blob], { type: 'video/mp4' });
        }
        
        const url = URL.createObjectURL(blobToUse);
        console.log('✅ Created blob URL:', url, 'Original Type:', currentMediaFile.blob.type, 'Final Type:', blobToUse.type, 'Size:', currentMediaFile.blob.size);
        setMediaUrl(url);
        return () => {
          console.log('🧹 Cleaning up blob URL:', url);
          URL.revokeObjectURL(url);
        };
      } catch (error) {
        console.error('❌ Failed to create blob URL:', error);
        setMediaUrl('');
      }
    } else if (currentMediaFile.url && typeof currentMediaFile.url === 'string' && currentMediaFile.url.length > 0) {
      console.log('✅ Using provided URL:', currentMediaFile.url);
      
      // 🔥 CRITICAL FIX: If the URL is from Supabase Storage (cross-origin), we must fetch it and convert to blob
      // This prevents canvas tainting which causes SecurityError on toBlob()
      const isSupabaseUrl = currentMediaFile.url.includes('supabase.co') || currentMediaFile.url.includes('supabase.in');
      const isCrossOrigin = currentMediaFile.url.startsWith('http') && !currentMediaFile.url.startsWith(window.location.origin);
      
      if (isSupabaseUrl || isCrossOrigin) {
        console.log('🔄 Cross-origin URL detected, fetching and converting to blob to prevent canvas tainting...');
        
        // Fetch and convert to blob URL asynchronously
        fetch(currentMediaFile.url)
          .then(response => response.blob())
          .then(blob => {
            // 🎥 FIX: Convert QuickTime videos to use video/mp4 MIME type for browser compatibility
            let blobToUse = blob;
            if (blob.type === 'video/quicktime' || 
                (currentMediaFile.name && currentMediaFile.name.toLowerCase().endsWith('.mov')) ||
                (currentMediaFile.url && currentMediaFile.url.toLowerCase().endsWith('.mov'))) {
              console.log('🔄 Converting QuickTime blob to video/mp4 MIME type for playback compatibility');
              blobToUse = new Blob([blob], { type: 'video/mp4' });
            }
            
            const blobUrl = URL.createObjectURL(blobToUse);
            console.log('✅ Converted cross-origin URL to blob URL:', blobUrl, 'Type:', blobToUse.type);
            setMediaUrl(blobUrl);
          })
          .catch(error => {
            console.error('❌ Failed to fetch cross-origin media:', error);
            // Fallback to original URL if fetch fails
            setMediaUrl(currentMediaFile.url!);
          });
        
        // Return cleanup function
        return () => {
          if (mediaUrl && mediaUrl.startsWith('blob:')) {
            URL.revokeObjectURL(mediaUrl);
          }
        };
      } else {
        // Same-origin or blob URL - safe to use directly
        setMediaUrl(currentMediaFile.url);
      }
    } else {
      // No valid media source
      console.warn('⚠️ No valid media source found. Blob:', !!currentMediaFile.blob, 'Blob type:', typeof currentMediaFile.blob, 'URL:', !!currentMediaFile.url);
      setMediaUrl('');
    }
  }, [currentMediaFile]);

  // Reset playback state when switching media or when media loads
  useEffect(() => {
    console.log('🔄 Media changed:', {
      type: currentMediaFile.type,
      hasMediaUrl: !!mediaUrl,
      mediaUrlLength: mediaUrl?.length,
      hasBlob: !!currentMediaFile.blob,
      hasProvidedUrl: !!currentMediaFile.url,
      blobSize: currentMediaFile.blob?.size,
      currentIndex
    });
    setIsPlaying(false);
    if (mediaRef.current && 'pause' in mediaRef.current) {
      mediaRef.current.pause();
    }
  }, [currentIndex, mediaUrl, currentMediaFile]);

  // CRITICAL FIX: Scroll to top when enhancement overlay opens
  useEffect(() => {
    // Scroll window to top
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // Also scroll the preview container to ensure media is centered
    if (previewContainerRef.current) {
      previewContainerRef.current.scrollTop = 0;
    }
    
    // 🎯 FIX: Initialize carousel mode by saving the current file's state
    // This ensures all files have a Map entry from the start
    if (isCarouselMode) {
      saveCurrentEnhancements();
    }
    
    console.log('📜 Enhancement overlay opened - scrolled to top');
  }, []); // Run only on mount

  // Keyboard navigation for carousel mode
  useEffect(() => {
    if (!isCarouselMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCarouselMode, currentIndex, files.length]);

  // Touch swipe handlers for carousel navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!isCarouselMode) return;
    
    const swipeThreshold = 50; // minimum swipe distance
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swiped left - go to next
        handleNext();
      } else {
        // Swiped right - go to previous
        handlePrevious();
      }
    }
    
    // Reset
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Handle media playback
  const togglePlayback = () => {
    // Only allow playback for video/audio types
    if (currentMediaFile.type !== 'video' && currentMediaFile.type !== 'audio') {
      return;
    }
    
    if (mediaRef.current && ('play' in mediaRef.current)) {
      try {
        if (isPlaying) {
          mediaRef.current.pause();
        } else {
          mediaRef.current.play();
        }
        setIsPlaying(!isPlaying);
      } catch (e) {
        console.error('Playback error:', e);
        toast.error('Could not play media');
      }
    }
  };

  // 🎯 Helper: Save current enhancement state for current file
  const saveCurrentEnhancements = () => {
    if (!isCarouselMode) return;
    
    // 🎯 FIX: ALWAYS save the current state for each file, regardless of whether enhancements exist
    // This ensures we can properly track which files have been modified
    console.log(`💾 Saving enhancements for file ${currentIndex}`);
    setPerFileEnhancements(prev => {
      const updated = new Map(prev);
      updated.set(currentIndex, {
        filter: selectedFilter,
        audioFilter: selectedAudioFilter,
        visualEffects: new Set(visualEffects),
        captionText,
        stickers: [...selectedStickers],
        showDateStamp,
        dateStampText,
        brightness,
        contrast,
        saturation,
        rotation,
        flipHorizontal,
        flipVertical
      });
      return updated;
    });
  };
  
  // 🎯 Helper: Restore enhancement state for target file
  const restoreEnhancements = (targetIndex: number) => {
    if (!isCarouselMode) return;
    
    const saved = perFileEnhancements.get(targetIndex);
    if (saved) {
      console.log(`📂 Restoring enhancements for file ${targetIndex}`);
      setSelectedFilter(saved.filter);
      setSelectedAudioFilter(saved.audioFilter);
      setVisualEffects(new Set(saved.visualEffects));
      setSelectedStickers([...saved.stickers]);
      setCaptionText(saved.captionText);
      setShowDateStamp(saved.showDateStamp);
      setDateStampText(saved.dateStampText);
      setBrightness(saved.brightness);
      setContrast(saved.contrast);
      setSaturation(saved.saturation);
      setRotation(saved.rotation);
      setFlipHorizontal(saved.flipHorizontal);
      setFlipVertical(saved.flipVertical);
    } else {
      console.log(`🔄 No saved enhancements for file ${targetIndex}, resetting to defaults`);
      // Reset to defaults
      setSelectedFilter('none');
      setSelectedAudioFilter('none');
      setVisualEffects(new Set());
      setSelectedStickers([]);
      setCaptionText('');
      setShowDateStamp(false);
      setDateStampText(new Date().toLocaleDateString());
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
      setRotation(0);
      setFlipHorizontal(false);
      setFlipVertical(false);
    }
    setActiveTab('visual'); // Reset to visual tab
    setHistory([]); // Clear undo history for new media
  };

  // Carousel navigation handlers
  const handleNext = () => {
    if (currentIndex < files.length - 1) {
      // Pause any playing media before switching
      if (mediaRef.current && 'pause' in mediaRef.current) {
        try {
          mediaRef.current.pause();
        } catch (e) {
          console.log('Could not pause media:', e);
        }
      }
      setIsPlaying(false);
      
      // 🎯 Save current enhancements before switching
      saveCurrentEnhancements();
      
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      
      // 🎯 Restore enhancements for next file
      restoreEnhancements(nextIndex);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      // Pause any playing media before switching
      if (mediaRef.current && 'pause' in mediaRef.current) {
        try {
          mediaRef.current.pause();
        } catch (e) {
          console.log('Could not pause media:', e);
        }
      }
      setIsPlaying(false);
      
      // 🎯 Save current enhancements before switching
      saveCurrentEnhancements();
      
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      
      // 🎯 Restore enhancements for previous file
      restoreEnhancements(prevIndex);
    }
  };

  // Toggle visual effect
  const toggleVisualEffect = (effectId: string) => {
    // 🔧 FIX: Save current state to history BEFORE toggling effect
    saveToHistory();
    
    const newEffects = new Set(visualEffects);
    const isAdding = !newEffects.has(effectId);
    
    if (newEffects.has(effectId)) {
      newEffects.delete(effectId);
    } else {
      newEffects.add(effectId);
      
      // 🏆 Track achievement - Visual effect added (only when adding, not removing)
      if (session?.access_token) {
        trackAction('visual_effect_added', { effectId }, session.access_token);
      }
    }
    setVisualEffects(newEffects);
  };

  // Add a new sticker instance
  const addSticker = (stickerType: string) => {
    // 🔧 FIX: Save current state to history BEFORE adding sticker
    // This ensures undo will properly remove the newly added sticker
    saveToHistory();
    
    // Generate random position that avoids clustering
    // Use a grid-based approach with random offset to prevent diagonal stacking
    const gridSize = 4; // 4x4 grid of possible positions
    const gridX = Math.floor(Math.random() * gridSize);
    const gridY = Math.floor(Math.random() * gridSize);
    const randomOffsetX = (Math.random() - 0.5) * 15; // Random offset within grid cell
    const randomOffsetY = (Math.random() - 0.5) * 15;
    
    const newSticker: StickerInstance = {
      id: `${stickerType}-${stickerIdCounter}`,
      type: stickerType,
      x: 20 + (gridX * 20) + randomOffsetX, // Spread across canvas width
      y: 20 + (gridY * 20) + randomOffsetY, // Spread across canvas height
      size: 40
    };
    setSelectedStickers([...selectedStickers, newSticker]);
    setStickerIdCounter(stickerIdCounter + 1);
    toast.success('Sticker added! Drag it to move');
    
    // 🏆 Track achievement - Sticker added
    if (session?.access_token) {
      trackAction('sticker_added', { stickerType }, session.access_token);
    }
  };

  // Remove a specific sticker instance
  const removeSticker = (stickerId: string) => {
    // 🔧 FIX: Save current state to history BEFORE removing sticker
    saveToHistory();
    
    setSelectedStickers(selectedStickers.filter(s => s.id !== stickerId));
    toast.success('Sticker removed');
  };

  // Handle sticker drag
  const handleStickerDrag = (e: React.MouseEvent | React.TouchEvent, stickerId: string) => {
    if (draggingSticker !== stickerId || !previewContainerRef.current) return;
    
    const container = previewContainerRef.current;
    const rect = container.getBoundingClientRect();
    
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    
    setSelectedStickers(selectedStickers.map(sticker => 
      sticker.id === stickerId
        ? { ...sticker, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
        : sticker
    ));
  };

  const handleStickerDragStart = (stickerId: string) => {
    setDraggingSticker(stickerId);
  };

  const handleStickerDragEnd = () => {
    setDraggingSticker(null);
  };

  // Handle text drag
  const handleTextDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDraggingText || !previewContainerRef.current) return;
    
    const container = previewContainerRef.current;
    const rect = container.getBoundingClientRect();
    
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    
    setTextX(Math.max(0, Math.min(100, x)));
    setTextY(Math.max(0, Math.min(100, y)));
  };

  const handleTextDragStart = () => {
    setIsDraggingText(true);
  };

  const handleTextDragEnd = () => {
    setIsDraggingText(false);
  };

  // 🎨 PHASE 3: Crop Tool Functions
  const initializeCropRegion = () => {
    if (!mediaRef.current || !previewContainerRef.current) return;
    
    const container = previewContainerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Initialize crop to center 80% of image
    const initialSize = 80;
    const offset = (100 - initialSize) / 2;
    
    setCropRegion({
      x: offset,
      y: offset,
      width: initialSize,
      height: initialSize
    });
  };

  const applyCropAspectRatio = (aspectRatioId: string) => {
    setCropAspectRatio(aspectRatioId);
    
    if (!cropRegion) {
      initializeCropRegion();
      return;
    }
    
    const aspectData = CROP_ASPECT_RATIOS.find(a => a.id === aspectRatioId);
    if (!aspectData?.ratio) return; // Free aspect ratio
    
    // Maintain center and adjust dimensions to match aspect ratio
    const centerX = cropRegion.x + cropRegion.width / 2;
    const centerY = cropRegion.y + cropRegion.height / 2;
    
    let newWidth = cropRegion.width;
    let newHeight = cropRegion.width / aspectData.ratio;
    
    // If height exceeds bounds, adjust width instead
    if (newHeight > 100) {
      newHeight = 100;
      newWidth = newHeight * aspectData.ratio;
    }
    
    setCropRegion({
      x: Math.max(0, Math.min(100 - newWidth, centerX - newWidth / 2)),
      y: Math.max(0, Math.min(100 - newHeight, centerY - newHeight / 2)),
      width: newWidth,
      height: newHeight
    });
  };

  const resetCrop = () => {
    setCropRegion(null);
    setCropAspectRatio('free');
    setShowCropMode(false);
    toast.success('Crop reset');
  };

  // 🎨 PHASE 4A: Draggable Crop Handlers
  const handleCropDragStart = (handle: 'center' | 'nw' | 'ne' | 'sw' | 'se', e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!cropRegion || !previewContainerRef.current) return;
    
    const container = previewContainerRef.current;
    const rect = container.getBoundingClientRect();
    
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const mouseX = ((clientX - rect.left) / rect.width) * 100;
    const mouseY = ((clientY - rect.top) / rect.height) * 100;
    
    setCropDragHandle(handle);
    setCropDragStart({
      cropRegion: { ...cropRegion },
      mouseX,
      mouseY
    });
  };

  const handleCropDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!cropDragHandle || !cropDragStart || !cropRegion || !previewContainerRef.current) return;
    
    const container = previewContainerRef.current;
    const rect = container.getBoundingClientRect();
    
    let clientX: number, clientY: number;
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const mouseX = ((clientX - rect.left) / rect.width) * 100;
    const mouseY = ((clientY - rect.top) / rect.height) * 100;
    
    const deltaX = mouseX - cropDragStart.mouseX;
    const deltaY = mouseY - cropDragStart.mouseY;
    
    let newCrop = { ...cropDragStart.cropRegion };
    
    if (cropDragHandle === 'center') {
      // Move entire crop region
      newCrop.x = Math.max(0, Math.min(100 - newCrop.width, cropDragStart.cropRegion.x + deltaX));
      newCrop.y = Math.max(0, Math.min(100 - newCrop.height, cropDragStart.cropRegion.y + deltaY));
    } else {
      // Resize from corner
      const aspectData = CROP_ASPECT_RATIOS.find(a => a.id === cropAspectRatio);
      const constrainAspect = aspectData?.ratio !== null && aspectData?.ratio !== undefined;
      
      if (cropDragHandle === 'se') {
        // Bottom-right corner
        newCrop.width = Math.max(10, Math.min(100 - newCrop.x, cropDragStart.cropRegion.width + deltaX));
        newCrop.height = Math.max(10, Math.min(100 - newCrop.y, cropDragStart.cropRegion.height + deltaY));
        
        if (constrainAspect && aspectData?.ratio) {
          const avgDelta = (deltaX + deltaY) / 2;
          newCrop.width = Math.max(10, Math.min(100 - newCrop.x, cropDragStart.cropRegion.width + avgDelta));
          newCrop.height = newCrop.width / aspectData.ratio;
          
          if (newCrop.height > 100 - newCrop.y) {
            newCrop.height = 100 - newCrop.y;
            newCrop.width = newCrop.height * aspectData.ratio;
          }
        }
      } else if (cropDragHandle === 'sw') {
        // Bottom-left corner
        const newX = Math.max(0, Math.min(cropDragStart.cropRegion.x + cropDragStart.cropRegion.width - 10, cropDragStart.cropRegion.x + deltaX));
        newCrop.width = cropDragStart.cropRegion.x + cropDragStart.cropRegion.width - newX;
        newCrop.x = newX;
        newCrop.height = Math.max(10, Math.min(100 - newCrop.y, cropDragStart.cropRegion.height + deltaY));
        
        if (constrainAspect && aspectData?.ratio) {
          const avgDelta = (-deltaX + deltaY) / 2;
          newCrop.width = Math.max(10, cropDragStart.cropRegion.width + avgDelta);
          newCrop.height = newCrop.width / aspectData.ratio;
          newCrop.x = cropDragStart.cropRegion.x + cropDragStart.cropRegion.width - newCrop.width;
          
          if (newCrop.height > 100 - newCrop.y) {
            newCrop.height = 100 - newCrop.y;
            newCrop.width = newCrop.height * aspectData.ratio;
            newCrop.x = cropDragStart.cropRegion.x + cropDragStart.cropRegion.width - newCrop.width;
          }
        }
      } else if (cropDragHandle === 'ne') {
        // Top-right corner
        const newY = Math.max(0, Math.min(cropDragStart.cropRegion.y + cropDragStart.cropRegion.height - 10, cropDragStart.cropRegion.y + deltaY));
        newCrop.height = cropDragStart.cropRegion.y + cropDragStart.cropRegion.height - newY;
        newCrop.y = newY;
        newCrop.width = Math.max(10, Math.min(100 - newCrop.x, cropDragStart.cropRegion.width + deltaX));
        
        if (constrainAspect && aspectData?.ratio) {
          const avgDelta = (deltaX - deltaY) / 2;
          newCrop.width = Math.max(10, Math.min(100 - newCrop.x, cropDragStart.cropRegion.width + avgDelta));
          newCrop.height = newCrop.width / aspectData.ratio;
          newCrop.y = cropDragStart.cropRegion.y + cropDragStart.cropRegion.height - newCrop.height;
          
          if (newCrop.y < 0) {
            newCrop.y = 0;
            newCrop.height = cropDragStart.cropRegion.y + cropDragStart.cropRegion.height;
            newCrop.width = newCrop.height * aspectData.ratio;
          }
        }
      } else if (cropDragHandle === 'nw') {
        // Top-left corner
        const newX = Math.max(0, Math.min(cropDragStart.cropRegion.x + cropDragStart.cropRegion.width - 10, cropDragStart.cropRegion.x + deltaX));
        const newY = Math.max(0, Math.min(cropDragStart.cropRegion.y + cropDragStart.cropRegion.height - 10, cropDragStart.cropRegion.y + deltaY));
        newCrop.width = cropDragStart.cropRegion.x + cropDragStart.cropRegion.width - newX;
        newCrop.height = cropDragStart.cropRegion.y + cropDragStart.cropRegion.height - newY;
        newCrop.x = newX;
        newCrop.y = newY;
        
        if (constrainAspect && aspectData?.ratio) {
          const avgDelta = (-deltaX - deltaY) / 2;
          newCrop.width = Math.max(10, cropDragStart.cropRegion.width + avgDelta);
          newCrop.height = newCrop.width / aspectData.ratio;
          newCrop.x = cropDragStart.cropRegion.x + cropDragStart.cropRegion.width - newCrop.width;
          newCrop.y = cropDragStart.cropRegion.y + cropDragStart.cropRegion.height - newCrop.height;
          
          if (newCrop.x < 0) {
            newCrop.x = 0;
            newCrop.width = cropDragStart.cropRegion.x + cropDragStart.cropRegion.width;
            newCrop.height = newCrop.width / aspectData.ratio;
            newCrop.y = cropDragStart.cropRegion.y + cropDragStart.cropRegion.height - newCrop.height;
          }
          if (newCrop.y < 0) {
            newCrop.y = 0;
            newCrop.height = cropDragStart.cropRegion.y + cropDragStart.cropRegion.height;
            newCrop.width = newCrop.height * aspectData.ratio;
            newCrop.x = cropDragStart.cropRegion.x + cropDragStart.cropRegion.width - newCrop.width;
          }
        }
      }
    }
    
    setCropRegion(newCrop);
  };

  const handleCropDragEnd = () => {
    setCropDragHandle(null);
    setCropDragStart(null);
  };

  // 🎨 PHASE 4B: Text Layer Functions
  const addTextLayer = () => {
    // ✅ FIX: Prevent adding multiple text layers if one is already in "edit mode" (has default text)
    const hasIncompleteLayer = textLayers.some(layer => layer.text === 'Double-click to edit' || layer.text === '');
    if (hasIncompleteLayer) {
      toast.error('Please complete the current text layer first');
      return;
    }

    // 🔧 FIX: Save current state to history BEFORE adding text layer
    saveToHistory();

    const newLayer: TextLayer = {
      id: `text-${textLayerIdCounter}`,
      text: 'Double-click to edit',
      x: 50,
      y: 50,
      font: 'sans',
      size: 32,
      color: '#ffffff',
      rotation: 0,
      shadowBlur: 4,
      shadowColor: 'rgba(0,0,0,0.8)',
      outlineWidth: 0,
      outlineColor: '#000000'
    };
    
    setTextLayers([...textLayers, newLayer]);
    setSelectedTextLayerId(newLayer.id);
    setTextLayerIdCounter(textLayerIdCounter + 1);
    setShowTextLayerEditor(true);
    toast.success('Text layer added - click to edit');
  };

  const updateTextLayer = (id: string, updates: Partial<TextLayer>) => {
    setTextLayers(textLayers.map(layer =>
      layer.id === id ? { ...layer, ...updates } : layer
    ));
  };

  const deleteTextLayer = (id: string) => {
    // 🔧 FIX: Save current state to history BEFORE deleting text layer
    saveToHistory();
    
    setTextLayers(textLayers.filter(layer => layer.id !== id));
    if (selectedTextLayerId === id) {
      setSelectedTextLayerId(null);
    }
    toast.success('Text layer removed');
  };

  const handleTextLayerDragStart = (layerId: string) => {
    setDraggingTextLayerId(layerId);
    setSelectedTextLayerId(layerId);
  };

  const handleTextLayerDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggingTextLayerId || !previewContainerRef.current) return;
    
    const container = previewContainerRef.current;
    const rect = container.getBoundingClientRect();
    
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    
    updateTextLayer(draggingTextLayerId, {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    });
  };

  const handleTextLayerDragEnd = () => {
    setDraggingTextLayerId(null);
  };

  // 🎵 PHASE 2: Enhanced Web Audio API processing
  const processAudio = async (audioBlob: Blob, filterOverride?: string): Promise<Blob> => {
    // Use override if provided, otherwise use state (fixes race condition!)
    const filterToUse = filterOverride !== undefined ? filterOverride : selectedAudioFilter;
    const ambientToUse = selectedAmbient;
    
    console.log('🎵 processAudio called with filter:', filterToUse, 'ambient:', ambientToUse);
    
    if (filterToUse === 'none' && ambientToUse === 'none') {
      // No processing needed, return original
      console.log('⏭️ No audio processing needed (both filters are none), returning original');
      return audioBlob;
    }

    try {
      console.log('🎵 Starting audio processing with filter:', filterToUse);
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      console.log(`📊 Audio buffer: ${audioBuffer.duration.toFixed(2)}s, ${audioBuffer.sampleRate}Hz, ${audioBuffer.numberOfChannels} channels`);
      
      // Create offline context for processing
      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );
      
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      
      let lastNode: AudioNode = source;
      
      // Apply filter based on selection (use filterToUse!)
      const filter = AUDIO_FILTERS.find(f => f.id === filterToUse);
      if (filter && filter.id !== 'none') {
        console.log('🔧 Applying audio filter:', filter.name);
        
        // 1. High-pass filter (removes low frequencies)
        if (filter.highpass) {
          console.log(`  🔊 High-pass: ${filter.highpass}Hz`);
          const highpass = offlineContext.createBiquadFilter();
          highpass.type = 'highpass';
          highpass.frequency.value = filter.highpass;
          highpass.Q.value = 0.7; // Moderate resonance
          lastNode.connect(highpass);
          lastNode = highpass;
        }
        
        // 2. Low-pass filter (removes high frequencies)
        if (filter.lowpass) {
          console.log(`  🔊 Low-pass: ${filter.lowpass}Hz`);
          const lowpass = offlineContext.createBiquadFilter();
          lowpass.type = 'lowpass';
          lowpass.frequency.value = filter.lowpass;
          lowpass.Q.value = 0.7; // Moderate resonance
          lastNode.connect(lowpass);
          lastNode = lowpass;
        }
        
        // 3. Brightness (EXTREME high-shelf boost for crystal clarity)
        if (filter.bright) {
          console.log('  ✨ EXTREME Brightness boost');
          
          // High-shelf boost at 2kHz (more presence)
          const highShelf = offlineContext.createBiquadFilter();
          highShelf.type = 'highshelf';
          highShelf.frequency.value = 2000; // Boost above 2kHz
          highShelf.gain.value = 9; // +9dB boost (EXTREME!)
          lastNode.connect(highShelf);
          lastNode = highShelf;
          
          // Additional presence boost at 4kHz
          const presence = offlineContext.createBiquadFilter();
          presence.type = 'peaking';
          presence.frequency.value = 4000;
          presence.Q.value = 1.5;
          presence.gain.value = 6; // +6dB
          lastNode.connect(presence);
          lastNode = presence;
          
          console.log('  ✅ Applied +9dB shelf @ 2kHz + +6dB peak @ 4kHz');
        }
        
        // 4. Distortion effect (EXTREME warmth & saturation)
        if (filter.distortion) {
          console.log(`  🎸 DISTORTION: ${(filter.distortion * 100).toFixed(0)}%`);
          const distortion = offlineContext.createWaveShaper();
          const curve = new Float32Array(22050);
          const amount = filter.distortion;
          
          // EXTREME saturation curve (soft clipping)
          for (let i = 0; i < 22050; i++) {
            const x = (i * 2) / 22050 - 1;
            // Soft clipping curve with adjustable amount
            if (amount > 0.2) {
              // HEAVY saturation (vinyl, telephone)
              curve[i] = Math.tanh(x * (1 + amount * 4));
            } else {
              // Medium saturation
              curve[i] = x * (1 - amount) + Math.tanh(x * 2) * amount;
            }
          }
          
          distortion.curve = curve;
          distortion.oversample = '4x'; // Higher quality
          lastNode.connect(distortion);
          lastNode = distortion;
          
          console.log(`  ✅ Applied ${amount > 0.2 ? 'HEAVY' : 'medium'} saturation`);
        }
        
        // 5. Reverb effect (EXTREME cathedral-like space)
        if (filter.reverb) {
          console.log(`  🎭 EXTREME REVERB: ${(filter.reverb * 100).toFixed(0)}%`);
          
          // Create MANY delay taps for massive reverb
          const delays = [
            0.013, 0.017, 0.021, 0.027, 0.031,  // Early reflections
            0.043, 0.053, 0.067, 0.079, 0.091,  // Mid reflections
            0.109, 0.127, 0.149, 0.173, 0.211   // Late reverb tail (LONG!)
          ];
          
          const wet = offlineContext.createGain();
          wet.gain.value = filter.reverb * 0.85;  // EXTREME wet signal
          const dry = offlineContext.createGain();
          dry.gain.value = 1 - filter.reverb * 0.7;  // EXTREME mix
          
          // Dry signal
          lastNode.connect(dry);
          
          // Create massive reverb network
          delays.forEach((time, index) => {
            const delay = offlineContext.createDelay(1.0);
            delay.delayTime.value = time;
            
            const feedback = offlineContext.createGain();
            // Strong feedback for LONG tail
            feedback.gain.value = filter.reverb * 0.6 * (1 - index * 0.05);
            
            // Low-pass filter (darker reflections)
            const lpf = offlineContext.createBiquadFilter();
            lpf.type = 'lowpass';
            lpf.frequency.value = 4000 - (index * 200); // Progressively darker
            
            lastNode.connect(delay);
            delay.connect(lpf);
            lpf.connect(feedback);
            feedback.connect(delay);
            lpf.connect(wet);
          });
          
          // Merge wet and dry
          const merger = offlineContext.createGain();
          dry.connect(merger);
          wet.connect(merger);
          lastNode = merger;
          
          console.log(`  ✅ Created ${delays.length} reverb taps for massive space`);
        }
        
        // 6. Delay/Echo effect (FIXED - creates audible repeating echoes!)
        if (filter.delay && filter.feedback) {
          console.log(`  ⏱️ DELAY EFFECT: ${(filter.delay * 1000).toFixed(0)}ms, Feedback: ${((filter.feedback) * 100).toFixed(0)}%`);
          
          // FIXED: Create multiple delay taps manually for guaranteed echoes
          const delayTime = filter.delay;
          const feedbackAmount = filter.feedback;
          
          // Create dry/wet mix
          const dry = offlineContext.createGain();
          dry.gain.value = 0.5;
          const wet = offlineContext.createGain();
          wet.gain.value = 0.7;
          
          lastNode.connect(dry);
          
          // Create 5 delay taps (5 audible echoes)
          for (let i = 1; i <= 5; i++) {
            const delayNode = offlineContext.createDelay(2.0);
            delayNode.delayTime.value = delayTime * i;
            
            const tapGain = offlineContext.createGain();
            tapGain.gain.value = Math.pow(feedbackAmount, i); // Exponential decay
            
            // Optional: darken each repeat
            const lpf = offlineContext.createBiquadFilter();
            lpf.type = 'lowpass';
            lpf.frequency.value = 4000 - (i * 400); // Progressively darker
            
            lastNode.connect(delayNode);
            delayNode.connect(lpf);
            lpf.connect(tapGain);
            tapGain.connect(wet);
          }
          
          const merger = offlineContext.createGain();
          dry.connect(merger);
          wet.connect(merger);
          lastNode = merger;
          
          console.log(`  ✅ Created ${5} echo taps`);
        }
        
        // 7. Normalization (dynamic range compression)
        if (filter.normalize) {
          console.log('  📈 Normalizing audio');
          const compressor = offlineContext.createDynamicsCompressor();
          compressor.threshold.value = -24; // dB
          compressor.knee.value = 30; // dB
          compressor.ratio.value = 12; // 12:1
          compressor.attack.value = 0.003; // seconds
          compressor.release.value = 0.25; // seconds
          lastNode.connect(compressor);
          lastNode = compressor;
        }
        
        // 8. Final gain adjustment
        if (filter.gain && filter.gain !== 1.0) {
          console.log(`  🔊 Gain: ${(filter.gain * 100).toFixed(0)}%`);
          const gainNode = offlineContext.createGain();
          gainNode.gain.value = filter.gain;
          lastNode.connect(gainNode);
          lastNode = gainNode;
        }
      }
      
      // Connect to destination
      lastNode.connect(offlineContext.destination);
      source.start(0);
      
      // Render the audio
      console.log('⚡ Rendering audio...');
      const renderedBuffer = await offlineContext.startRendering();
      console.log('✅ Audio rendering complete');
      
      // Convert back to blob
      const wav = audioBufferToWav(renderedBuffer);
      const processedBlob = new Blob([wav], { type: 'audio/wav' });
      
      console.log(`💾 Processed audio: ${(processedBlob.size / 1024).toFixed(2)} KB`);
      
      await audioContext.close();
      
      // Show success toast
      toast.success(`🎵 Applied "${filter?.name || 'filter'}"`, {
        description: filter?.description || 'Audio enhancement applied',
        duration: 2000
      });
      
      // Track achievement
      if (session?.access_token) {
        trackAction('audio_filter_used', { filterName: selectedAudioFilter }, session.access_token);
      }
      
      return processedBlob;
    } catch (error) {
      console.error('❌ Audio processing failed:', error);
      toast.error('Audio processing failed, using original');
      return audioBlob;
    }
  };

  // Helper function to convert AudioBuffer to WAV
  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const length = buffer.length * buffer.numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, buffer.numberOfChannels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * buffer.numberOfChannels * 2, true);
    view.setUint16(32, buffer.numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);
    
    // Write audio data
    const channels = [];
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }
    
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return arrayBuffer;
  };

  // Apply all enhancements and generate enhanced media
  const generateEnhancedMedia = async (): Promise<Blob> => {
    // For photos and videos, render to canvas with all effects
    if (currentMediaFile.type === 'photo' || currentMediaFile.type === 'video') {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not available');
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      // Set canvas size based on media
      let width = 1920;
      let height = 1080;
      
      if (mediaRef.current) {
        if (currentMediaFile.type === 'photo') {
          const img = mediaRef.current as HTMLImageElement;
          width = img.naturalWidth || img.width;
          height = img.naturalHeight || img.height;
        } else if (currentMediaFile.type === 'video') {
          const video = mediaRef.current as HTMLVideoElement;
          width = video.videoWidth || 1920;
          height = video.videoHeight || 1080;
        }
      }

      // 🎨 PHASE 2: Handle rotation - adjust canvas size if needed
      const angleRad = (rotation * Math.PI) / 180;
      const absSin = Math.abs(Math.sin(angleRad));
      const absCos = Math.abs(Math.cos(angleRad));
      const rotatedWidth = Math.round(width * absCos + height * absSin);
      const rotatedHeight = Math.round(width * absSin + height * absCos);
      
      canvas.width = rotation % 180 === 0 ? width : rotatedWidth;
      canvas.height = rotation % 180 === 0 ? height : rotatedHeight;

      // 🎨 PHASE 2: Apply transformations
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(angleRad);
      ctx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1);

      // 🎨 PHASE 2: Build complete filter string with advanced adjustments
      const filterParts: string[] = [];
      
      // Add emotional filter
      const emotionalFilter = EMOTIONAL_FILTERS.find(f => f.id === selectedFilter);
      if (emotionalFilter && emotionalFilter.cssFilter && selectedFilter !== 'none') {
        filterParts.push(emotionalFilter.cssFilter);
      }
      
      // Add advanced editing adjustments
      if (brightness !== 100) filterParts.push(`brightness(${brightness / 100})`);
      if (contrast !== 100) filterParts.push(`contrast(${contrast / 100})`);
      if (saturation !== 100) filterParts.push(`saturate(${saturation / 100})`);
      
      ctx.filter = filterParts.length > 0 ? filterParts.join(' ') : 'none';

      // Draw media
      if (mediaRef.current) {
        ctx.drawImage(mediaRef.current as any, -width / 2, -height / 2, width, height);
      }

      ctx.restore();

      // Reset filter for overlays
      ctx.filter = 'none';
      
      // 🎨 PHASE 3: If crop is active, we need to apply it AFTER all effects
      // Store the current canvas for cropping later
      const shouldApplyCrop = cropRegion && showCropMode;

      // Apply vignette effect
      if (visualEffects.has('vignette')) {
        const vignetteEffect = VISUAL_EFFECTS.find(e => e.id === 'vignette');
        const gradient = ctx.createRadialGradient(
          width / 2, height / 2, 0,
          width / 2, height / 2, Math.max(width, height) / 2
        );
        const intensity = (vignetteEffect?.intensity || 50) / 100;
        gradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
        gradient.addColorStop(0.7, `rgba(0, 0, 0, ${intensity * 0.3})`);
        gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity * 0.7})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      // Apply film grain
      if (visualEffects.has('grain')) {
        const grainEffect = VISUAL_EFFECTS.find(e => e.id === 'grain');
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const intensity = grainEffect?.intensity || 30;
        
        for (let i = 0; i < data.length; i += 4) {
          const noise = (Math.random() - 0.5) * intensity;
          data[i] += noise;     // red
          data[i + 1] += noise; // green
          data[i + 2] += noise; // blue
        }
        ctx.putImageData(imageData, 0, 0);
      }

      // Apply light leak effect
      if (visualEffects.has('light-leak')) {
        const gradient = ctx.createRadialGradient(
          width * 0.8, height * 0.3, 0,
          width * 0.8, height * 0.3, Math.max(width, height) * 0.6
        );
        gradient.addColorStop(0, 'rgba(255, 200, 100, 0.4)');
        gradient.addColorStop(0.5, 'rgba(255, 150, 80, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 100, 50, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      // Apply bokeh effect
      if (visualEffects.has('bokeh')) {
        const bokehEffect = VISUAL_EFFECTS.find(e => e.id === 'bokeh');
        const count = bokehEffect?.intensity || 12;
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < count; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const size = 20 + Math.random() * 40;
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
          gradient.addColorStop(0.5, 'rgba(255, 255, 200, 0.3)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(x - size, y - size, size * 2, size * 2);
        }
        ctx.globalAlpha = 1.0;
      }

      // Apply confetti effect
      if (visualEffects.has('confetti')) {
        const confettiEffect = VISUAL_EFFECTS.find(e => e.id === 'confetti');
        const count = confettiEffect?.intensity || 40;
        const colors = ['#FF6B9D', '#C44569', '#FFA07A', '#FFD700', '#87CEEB', '#9B59B6'];
        for (let i = 0; i < count; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const size = 5 + Math.random() * 10;
          const rotation = Math.random() * Math.PI * 2;
          const color = colors[Math.floor(Math.random() * colors.length)];
          
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(rotation);
          ctx.fillStyle = color;
          ctx.fillRect(-size/2, -size/2, size, size);
          ctx.restore();
        }
      }

      // Apply polaroid frame
      if (visualEffects.has('polaroid')) {
        // Save the current image content
        const imageData = ctx.getImageData(0, 0, width, height);
        
        // Calculate frame dimensions - 4% border on top/sides, 10% on bottom
        const borderTop = Math.round(width * 0.04);
        const borderSide = Math.round(width * 0.04);
        const borderBottom = Math.round(width * 0.10); // Extra space at bottom for classic Polaroid look
        
        // Calculate new canvas dimensions
        const newWidth = width + (borderSide * 2);
        const newHeight = height + borderTop + borderBottom;
        
        // Create temporary canvas to hold original image data
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.putImageData(imageData, 0, 0);
        }
        
        // Resize main canvas to accommodate the frame
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // Fill entire canvas with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, newWidth, newHeight);
        
        // Draw the saved image into the frame area
        if (tempCtx) {
          ctx.drawImage(tempCanvas, borderSide, borderTop, width, height);
        }
        
        // Add subtle inner shadow for depth
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(borderSide, borderTop, width, height);
        
        // Update dimensions for subsequent text/stickers to be positioned correctly
        width = newWidth;
        height = newHeight;
      }

      // Add date stamp
      if (showDateStamp && dateStampText) {
        ctx.font = `${Math.floor(height / 25)}px monospace`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        const x = width * 0.05;
        const y = height * 0.95;
        ctx.strokeText(dateStampText, x, y);
        ctx.fillText(dateStampText, x, y);
      }

      // Add caption with custom styling
      if (captionText) {
        const fontFamily = TEXT_FONTS.find(f => f.id === textFont)?.style.replace('font-', '') || 'sans-serif';
        ctx.font = `${textSize}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillStyle = textColor;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 3;
        const x = (textX / 100) * width;
        const y = (textY / 100) * height;
        ctx.strokeText(captionText, x, y);
        ctx.fillText(captionText, x, y);
      }

      // Render stickers to canvas as emoji/symbols
      if (selectedStickers.length > 0) {
        // Emoji mapping for stickers
        const stickerEmojis: Record<string, string> = {
          'heart': '❤️',
          'star': '⭐',
          'sparkles': '✨',
          'camera': '📷',
          'music': '🎵',
          'clock': '🕐',
          'sun': '☀️',
          'moon': '🌙',
          'cloud': '☁️'
        };

        selectedStickers.forEach(stickerInstance => {
          const emoji = stickerEmojis[stickerInstance.type];
          if (emoji) {
            const x = (stickerInstance.x / 100) * width;
            const y = (stickerInstance.y / 100) * height;
            const size = stickerInstance.size;
            
            // Draw emoji sticker
            ctx.font = `${size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(emoji, x, y);
          }
        });
      }

      // 🎨 PHASE 4B: Render text layers to canvas
      if (textLayers.length > 0) {
        textLayers.forEach(layer => {
          const x = (layer.x / 100) * width;
          const y = (layer.y / 100) * height;
          
          ctx.save();
          
          // Apply rotation
          ctx.translate(x, y);
          ctx.rotate((layer.rotation * Math.PI) / 180);
          
          // Set font
          ctx.font = `${layer.size}px ${TEXT_FONTS.find(f => f.id === layer.font)?.style.replace('font-', '') || 'sans-serif'}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Apply outline (stroke)
          if (layer.outlineWidth > 0) {
            ctx.strokeStyle = layer.outlineColor;
            ctx.lineWidth = layer.outlineWidth * 2; // Scale for better visibility
            ctx.lineJoin = 'round';
            ctx.miterLimit = 2;
            ctx.strokeText(layer.text, 0, 0);
          }
          
          // Apply shadow
          if (layer.shadowBlur > 0) {
            ctx.shadowColor = layer.shadowColor;
            ctx.shadowBlur = layer.shadowBlur * 2; // Scale for better visibility
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
          }
          
          // Draw text
          ctx.fillStyle = layer.color;
          ctx.fillText(layer.text, 0, 0);
          
          ctx.restore();
        });
      }

      // 🎨 PHASE 3: Apply crop if active
      if (shouldApplyCrop && cropRegion) {
        // Get the current canvas image data
        const fullImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Calculate crop dimensions in pixels
        const cropX = Math.round((cropRegion.x / 100) * canvas.width);
        const cropY = Math.round((cropRegion.y / 100) * canvas.height);
        const cropWidth = Math.round((cropRegion.width / 100) * canvas.width);
        const cropHeight = Math.round((cropRegion.height / 100) * canvas.height);
        
        // Create new canvas for cropped image
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = cropWidth;
        croppedCanvas.height = cropHeight;
        const croppedCtx = croppedCanvas.getContext('2d');
        
        if (croppedCtx) {
          // Draw only the cropped region
          croppedCtx.drawImage(
            canvas,
            cropX, cropY, cropWidth, cropHeight,  // Source coordinates
            0, 0, cropWidth, cropHeight           // Destination coordinates
          );
          
          // Replace the main canvas with cropped version
          canvas.width = cropWidth;
          canvas.height = cropHeight;
          ctx.clearRect(0, 0, cropWidth, cropHeight);
          ctx.drawImage(croppedCanvas, 0, 0);
        }
      }

      // Convert canvas to blob
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to generate image'));
          }
        }, 'image/jpeg', 0.92);
      });
    }

    // For audio, apply Web Audio API processing
    if (currentMediaFile.type === 'audio') {
      let audioBlob = currentMediaFile.blob;
      
      // If blob is not available, fetch it from the URL
      if (!audioBlob && currentMediaFile.url) {
        console.log('🎵 Fetching audio blob from URL for processing...');
        try {
          const response = await fetch(currentMediaFile.url);
          audioBlob = await response.blob();
        } catch (error) {
          console.error('Failed to fetch audio from URL:', error);
          throw new Error('Failed to load audio file');
        }
      }
      
      if (!audioBlob) {
        throw new Error('No audio data available');
      }
      
      // Note: processAudio will use selectedAudioFilter from state (no override needed here)
      return await processAudio(audioBlob);
    }
    
    // For video, return original (full video processing requires server-side)
    if (currentMediaFile.type === 'video') {
      if (currentMediaFile.blob) {
        return currentMediaFile.blob;
      }
      
      // If blob is not available, fetch it from the URL
      if (currentMediaFile.url) {
        console.log('🎬 Fetching video blob from URL...');
        try {
          const response = await fetch(currentMediaFile.url);
          return await response.blob();
        } catch (error) {
          console.error('Failed to fetch video from URL:', error);
          throw new Error('Failed to load video file');
        }
      }
    }
    
    throw new Error('No media blob available');
  };

  // ✨ PHASE 5: Preset System Functions
  
  // Apply Enhancement Preset
  const applyPreset = (preset: EnhancementPreset) => {
    setIsApplyingPreset(true);
    
    // Apply preset settings with smooth animation
    setTimeout(() => {
      setBrightness(preset.settings.brightness);
      setContrast(preset.settings.contrast);
      setSaturation(preset.settings.saturation);
      
      // Apply filter if specified
      if (preset.settings.filter) {
        setSelectedFilter(preset.settings.filter);
      }
      
      setIsApplyingPreset(false);
      
      // Show success toast
      toast.success(`✨ Applied "${preset.name}"`, {
        description: preset.description,
        duration: 2000
      });
      
      // Track achievement (only if authenticated)
      if (session?.access_token) {
        trackAction('preset_applied', { presetName: preset.name }, session.access_token);
      }
    }, 100);
  };
  
  // AI Auto-Enhance (simulated intelligent enhancement)
  const applyAIAutoEnhance = () => {
    setIsApplyingPreset(true);
    
    // Simulate AI analysis delay
    setTimeout(() => {
      // Intelligent defaults based on media type
      const mediaType = currentMediaFile.type;
      
      if (mediaType === 'photo') {
        // Photo: Enhance clarity and vibrancy
        setBrightness(105);
        setContrast(110);
        setSaturation(108);
      } else if (mediaType === 'video') {
        // Video: Balanced enhancement
        setBrightness(103);
        setContrast(108);
        setSaturation(105);
      } else {
        // Audio: No visual enhancements
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
      }
      
      setIsApplyingPreset(false);
      
      toast.success('🤖 AI Auto-Enhanced', {
        description: 'Optimized for best quality',
        duration: 2000
      });
      
      // Track achievement (only if authenticated)
      if (session?.access_token) {
        trackAction('ai_enhance_used', { mediaType }, session.access_token);
      }
    }, 800); // Simulate AI processing
  };
  
  // Save Custom Preset
  const saveCustomPreset = () => {
    const presetName = prompt('Enter a name for this preset:');
    if (!presetName) return;
    
    const newPreset: EnhancementPreset = {
      id: `custom-${Date.now()}`,
      name: presetName,
      description: 'Custom preset',
      icon: Wand2,
      gradient: 'from-purple-500 to-pink-500',
      settings: {
        brightness,
        contrast,
        saturation,
        filter: selectedFilter !== 'none' ? selectedFilter : undefined
      },
      category: 'custom',
      isCustom: true
    };
    
    setCustomPresets([...customPresets, newPreset]);
    
    toast.success(`💾 Saved "${presetName}"`, {
      description: 'Preset saved successfully',
      duration: 2000
    });
    
    // Track achievement (only if authenticated)
    if (session?.access_token) {
      trackAction('custom_preset_saved', { presetName }, session.access_token);
    }
  };
  
  // Delete Custom Preset
  const deleteCustomPreset = (presetId: string) => {
    setCustomPresets(customPresets.filter(p => p.id !== presetId));
    
    toast.success('🗑️ Preset deleted', {
      duration: 1500
    });
  };
  
  // Reset to Original
  const resetEnhancements = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setSelectedFilter('none');
    setRotation(0);
    setFlipHorizontal(false);
    setFlipVertical(false);
    
    toast.success('↩️ Reset to original', {
      duration: 1500
    });
  };

  // 🎵 Preview Audio with Filter
  const previewAudioFilter = async () => {
    if (currentMediaFile.type !== 'audio') return;
    
    try {
      setIsPreviewingAudio(true);
      console.log('🎧 Generating audio preview with filter:', selectedAudioFilter);
      
      // Clean up previous preview URL
      if (previewAudioUrl) {
        URL.revokeObjectURL(previewAudioUrl);
      }
      
      const enhancedBlob = await generateEnhancedMedia();
      const url = URL.createObjectURL(enhancedBlob);
      setPreviewAudioUrl(url);
      
      console.log('🎧 Preview ready! New audio URL:', url);
      
      toast.success('🎧 Preview ready!', {
        description: 'Playing filtered audio',
        duration: 2000
      });
      
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Failed to generate preview', {
        description: 'Please try again'
      });
    } finally {
      setIsPreviewingAudio(false);
    }
  };

  // Save to Vault - Creates NEW vault item
  const handleSave = async () => {
    try {
      console.log('💾 ===== SAVE TO VAULT STARTED =====');
      console.log('💾 Current audio filter:', selectedAudioFilter);
      console.log('💾 Media type:', currentMediaFile.type);
      
      setIsSaving(true);
      const enhancedBlob = await generateEnhancedMedia();
      
      console.log('💾 Enhanced blob generated:', {
        size: enhancedBlob.size,
        type: enhancedBlob.type
      });
      
      // Determine final media type (video with filters becomes photo)
      const finalType = (currentMediaFile.type === 'video' && enhancedBlob.type.startsWith('image/'))
        ? 'photo'
        : currentMediaFile.type;
      
      console.log(`💾 Media type: ${currentMediaFile.type} → ${finalType}`);
      
      const enhancedMedia = {
        blob: enhancedBlob,
        type: finalType,
        filename: `enhanced-${ensureProperFilename(currentMediaFile.filename, enhancedBlob.type, finalType)}`,
        metadata: {
          filter: selectedFilter,
          audioFilter: selectedAudioFilter,
          effects: Array.from(visualEffects),
          caption: captionText,
          dateStamp: showDateStamp ? dateStampText : null,
          stickers: selectedStickers.map(s => ({ ...s })),
          timestamp: Date.now()
        }
      };

      // Always create a new vault item
      await onSave(enhancedMedia);
      
      if (isCarouselMode) {
        toast.success(`Enhanced media ${currentIndex + 1} of ${files.length} saved!`);
        // Move to next item if available
        if (currentIndex < files.length - 1) {
          handleNext();
        }
      } else {
        toast.success('Enhanced media saved to Vault!');
      }
    } catch (error) {
      console.error('Failed to save enhanced media:', error);
      toast.error('Failed to save enhanced media');
    } finally {
      setIsSaving(false);
    }
  };

  // Replace & Save - Updates EXISTING vault item without creating duplicate
  const handleReplaceSave = async () => {
    if (!currentMediaFile.id || !onReplaceSave) {
      toast.error('Cannot replace: No original media ID');
      return;
    }

    try {
      console.log('🔄 ===== REPLACE & SAVE STARTED =====');
      console.log('🔄 Current media:', {
        type: currentMediaFile.type,
        id: currentMediaFile.id,
        filename: currentMediaFile.filename,
        audioFilter: selectedAudioFilter
      });
      
      setIsSaving(true);
      const enhancedBlob = await generateEnhancedMedia();
      
      console.log('🔄 Enhanced blob generated:', {
        size: enhancedBlob.size,
        type: enhancedBlob.type
      });
      
      // Determine final media type (video with filters becomes photo)
      const finalType = (currentMediaFile.type === 'video' && enhancedBlob.type.startsWith('image/'))
        ? 'photo'
        : currentMediaFile.type;
      
      console.log(`🔄 Media type: ${currentMediaFile.type} → ${finalType}`);
      
      const enhancedMedia = {
        blob: enhancedBlob,
        type: finalType,
        filename: ensureProperFilename(currentMediaFile.filename, enhancedBlob.type, finalType),
        metadata: {
          filter: selectedFilter,
          audioFilter: selectedAudioFilter,
          effects: Array.from(visualEffects),
          caption: captionText,
          dateStamp: showDateStamp ? dateStampText : null,
          stickers: selectedStickers.map(s => ({ ...s })),
          timestamp: Date.now()
        }
      };

      // Replace existing vault item
      await onReplaceSave(enhancedMedia, currentMediaFile.id);
      
      if (isCarouselMode) {
        toast.success(`Replaced media ${currentIndex + 1} of ${files.length}!`);
        // Move to next item if available
        if (currentIndex < files.length - 1) {
          handleNext();
        }
      } else {
        toast.success('Media replaced in Vault!');
      }
    } catch (error) {
      console.error('Failed to replace media:', error);
      toast.error('Failed to replace media');
    } finally {
      setIsSaving(false);
    }
  };

  // Use in New Capsule
  const handleUseInCapsule = async () => {
    try {
      setIsSaving(true);
      
      // 🎯 CAROUSEL MODE: Process ONLY files that have enhancements
      if (isCarouselMode && files.length > 1) {
        console.log(`🎨 Carousel mode with ${files.length} files - checking for enhanced files...`);
        
        // 🎯 CRITICAL FIX: Build the complete enhancement map INCLUDING current file
        // We need to do this BEFORE we start the loop, because saveCurrentEnhancements()
        // is async and the state won't be updated immediately
        const completeEnhancementMap = new Map(perFileEnhancements);
        
        // Save current file's enhancements directly into the map
        completeEnhancementMap.set(currentIndex, {
          filter: selectedFilter,
          audioFilter: selectedAudioFilter,
          visualEffects: new Set(visualEffects),
          captionText,
          stickers: [...selectedStickers],
          showDateStamp,
          dateStampText,
          brightness,
          contrast,
          saturation,
          rotation,
          flipHorizontal,
          flipVertical
        });
        
        console.log(`💾 Complete enhancement map has ${completeEnhancementMap.size} entries`);
        
        // 🎯 IMPORTANT: Process ALL files in carousel mode
        // - Files WITH enhancements → generate enhanced blob and send to capsule
        // - Files WITHOUT enhancements → use original blob and send to capsule
        // This ensures all selected media goes to the capsule (user selected them all!)
        const enhancedMediaArray = [];
        let vaultSaveCount = 0;
        
        // Process ALL files - some may be enhanced, some may be original
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileEnhancements = completeEnhancementMap.get(i);
          
          // Debug: Log what enhancements are saved for this file
          if (fileEnhancements) {
            console.log(`🔍 File ${i} enhancement details:`, {
              filter: fileEnhancements.filter,
              audioFilter: fileEnhancements.audioFilter,
              visualEffects: Array.from(fileEnhancements.visualEffects),
              brightness: fileEnhancements.brightness,
              contrast: fileEnhancements.contrast,
              saturation: fileEnhancements.saturation,
              rotation: fileEnhancements.rotation,
              flipH: fileEnhancements.flipHorizontal,
              flipV: fileEnhancements.flipVertical,
              hasCaption: fileEnhancements.captionText.trim() !== '',
              hasStickers: fileEnhancements.stickers.length > 0,
              hasDateStamp: fileEnhancements.showDateStamp
            });
          } else {
            console.log(`🔍 File ${i} has NO saved enhancements`);
          }
          
          // Check if this file has actual enhancements applied
          const hasAnyEnhancements = fileEnhancements && (
            fileEnhancements.filter !== 'none' ||
            fileEnhancements.audioFilter !== 'none' ||
            fileEnhancements.visualEffects.size > 0 ||
            fileEnhancements.captionText.trim() !== '' ||
            fileEnhancements.stickers.length > 0 ||
            fileEnhancements.showDateStamp ||
            fileEnhancements.brightness !== 100 ||
            fileEnhancements.contrast !== 100 ||
            fileEnhancements.saturation !== 100 ||
            fileEnhancements.rotation !== 0 ||
            fileEnhancements.flipHorizontal ||
            fileEnhancements.flipVertical
          );
          
          if (hasAnyEnhancements) {
            console.log(`📝 Processing file ${i + 1}/${files.length} WITH enhancements: ${file.filename}`);
          } else {
            console.log(`📝 Processing file ${i + 1}/${files.length} WITHOUT enhancements (using original): ${file.filename}`);
          }
          
          if (!file?.blob && !file?.url) {
            console.warn(`⚠️ Skipping file ${i} - no media available`);
            continue;
          }
          
          try {
            // Use the file's blob/url directly
            let sourceBlob = file.blob;
            
            // If no blob, try to fetch from URL
            if (!sourceBlob && file.url) {
              try {
                console.log(`📥 Fetching blob from URL for file ${i}...`);
                const response = await fetch(file.url);
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                sourceBlob = await response.blob();
                console.log(`✅ Fetched blob:`, { size: sourceBlob.size, type: sourceBlob.type });
              } catch (fetchError) {
                console.error(`❌ Failed to fetch from URL for file ${i}:`, fetchError);
                throw new Error('Failed to load media from URL');
              }
            }
            
            if (!sourceBlob || sourceBlob.size === 0) {
              throw new Error(`No valid media data for file ${i}`);
            }
            
            console.log(`✅ Valid source blob for file ${i}:`, {
              size: sourceBlob.size,
              type: sourceBlob.type
            });
            
            let enhancedBlob: Blob;
            
            // 🎯 CRITICAL: Only generate enhanced blob if file HAS enhancements
            // Otherwise, use the original blob
            if (!hasAnyEnhancements) {
              console.log(`⚡ Using original blob for file ${i} (no enhancements)`);
              enhancedBlob = sourceBlob;
            } else {
              // 🎯 Apply enhancements to generate actual enhanced blob
              console.log(`🎨 Generating enhanced blob for file ${i}...`);
              
              // Load the source media into a temporary element for canvas rendering
              const blobUrl = URL.createObjectURL(sourceBlob);
              
              if (file.type === 'photo') {
              // Create temporary image element
              const tempImg = new Image();
              await new Promise<void>((resolve, reject) => {
                tempImg.onload = () => resolve();
                tempImg.onerror = () => reject(new Error('Failed to load image'));
                tempImg.src = blobUrl;
              });
              
              // Save current mediaRef
              const prevMediaRef = mediaRef.current;
              mediaRef.current = tempImg;
              
              // Generate enhanced blob with this file's enhancements
              const canvas = canvasRef.current;
              if (!canvas) throw new Error('Canvas not available');
              
              const ctx = canvas.getContext('2d');
              if (!ctx) throw new Error('Canvas context not available');
              
              // Apply transformations and render
              const width = tempImg.naturalWidth || tempImg.width;
              const height = tempImg.naturalHeight || tempImg.height;
              
              const angleRad = (fileEnhancements.rotation * Math.PI) / 180;
              const absSin = Math.abs(Math.sin(angleRad));
              const absCos = Math.abs(Math.cos(angleRad));
              const rotatedWidth = Math.round(width * absCos + height * absSin);
              const rotatedHeight = Math.round(width * absSin + height * absCos);
              
              canvas.width = fileEnhancements.rotation % 180 === 0 ? width : rotatedWidth;
              canvas.height = fileEnhancements.rotation % 180 === 0 ? height : rotatedHeight;
              
              ctx.save();
              ctx.translate(canvas.width / 2, canvas.height / 2);
              ctx.rotate(angleRad);
              ctx.scale(fileEnhancements.flipHorizontal ? -1 : 1, fileEnhancements.flipVertical ? -1 : 1);
              
              // Build filter string
              const filterParts: string[] = [];
              const emotionalFilter = EMOTIONAL_FILTERS.find(f => f.id === fileEnhancements.filter);
              if (emotionalFilter && emotionalFilter.cssFilter && fileEnhancements.filter !== 'none') {
                filterParts.push(emotionalFilter.cssFilter);
              }
              if (fileEnhancements.brightness !== 100) filterParts.push(`brightness(${fileEnhancements.brightness / 100})`);
              if (fileEnhancements.contrast !== 100) filterParts.push(`contrast(${fileEnhancements.contrast / 100})`);
              if (fileEnhancements.saturation !== 100) filterParts.push(`saturate(${fileEnhancements.saturation / 100})`);
              
              ctx.filter = filterParts.length > 0 ? filterParts.join(' ') : 'none';
              ctx.drawImage(tempImg, -width / 2, -height / 2, width, height);
              ctx.restore();
              
              // Convert canvas to blob
              enhancedBlob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob(blob => {
                  if (blob) resolve(blob);
                  else reject(new Error('Failed to generate blob'));
                }, 'image/jpeg', 0.95);
              });
              
              // Restore mediaRef
              mediaRef.current = prevMediaRef;
              
              } else if (file.type === 'audio' && fileEnhancements.audioFilter !== 'none') {
                // 🎵 For audio files with audio filters, use processAudio function
                console.log(`🎵 Processing audio file ${i} with filter: ${fileEnhancements.audioFilter}`);
                enhancedBlob = await processAudio(sourceBlob, fileEnhancements.audioFilter);
              } else if (file.type === 'video') {
                // 🎬 For video files with visual filters, capture an enhanced frame
                // Note: Full video processing (all frames) would require server-side processing
                // For now, we capture a single enhanced frame that shows the filters applied
                console.log(`🎬 Processing video file ${i} with filters (single frame capture)`);
                console.warn(`⚠️ Video will be converted to a single enhanced photo frame. Full video filter processing requires server-side processing.`);
                
                // Create temporary video element
                const tempVideo = document.createElement('video');
                tempVideo.crossOrigin = 'anonymous';
                tempVideo.preload = 'metadata';
                
                // Load video and seek to first frame
                await new Promise<void>((resolve, reject) => {
                  tempVideo.onloadedmetadata = () => {
                    tempVideo.currentTime = 0.5; // Seek to 0.5s to get a good frame
                  };
                  tempVideo.onseeked = () => resolve();
                  tempVideo.onerror = () => reject(new Error('Failed to load video'));
                  tempVideo.src = blobUrl;
                });
                
                // Save current mediaRef
                const prevMediaRef = mediaRef.current;
                mediaRef.current = tempVideo;
                
                // Generate enhanced blob with this file's enhancements (similar to photo processing)
                const canvas = canvasRef.current;
                if (!canvas) throw new Error('Canvas not available');
                
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error('Canvas context not available');
                
                // Apply transformations and render
                const width = tempVideo.videoWidth || 1920;
                const height = tempVideo.videoHeight || 1080;
                
                const angleRad = (fileEnhancements.rotation * Math.PI) / 180;
                const absSin = Math.abs(Math.sin(angleRad));
                const absCos = Math.abs(Math.cos(angleRad));
                const rotatedWidth = Math.round(width * absCos + height * absSin);
                const rotatedHeight = Math.round(width * absSin + height * absCos);
                
                canvas.width = fileEnhancements.rotation % 180 === 0 ? width : rotatedWidth;
                canvas.height = fileEnhancements.rotation % 180 === 0 ? height : rotatedHeight;
                
                ctx.save();
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(angleRad);
                ctx.scale(fileEnhancements.flipHorizontal ? -1 : 1, fileEnhancements.flipVertical ? -1 : 1);
                
                // Build filter string
                const filterParts: string[] = [];
                const emotionalFilter = EMOTIONAL_FILTERS.find(f => f.id === fileEnhancements.filter);
                if (emotionalFilter && emotionalFilter.cssFilter && fileEnhancements.filter !== 'none') {
                  filterParts.push(emotionalFilter.cssFilter);
                }
                if (fileEnhancements.brightness !== 100) filterParts.push(`brightness(${fileEnhancements.brightness / 100})`);
                if (fileEnhancements.contrast !== 100) filterParts.push(`contrast(${fileEnhancements.contrast / 100})`);
                if (fileEnhancements.saturation !== 100) filterParts.push(`saturate(${fileEnhancements.saturation / 100})`);
                
                ctx.filter = filterParts.length > 0 ? filterParts.join(' ') : 'none';
                ctx.drawImage(tempVideo, -width / 2, -height / 2, width, height);
                ctx.restore();
                
                // Convert canvas to blob (image)
                enhancedBlob = await new Promise<Blob>((resolve, reject) => {
                  canvas.toBlob(blob => {
                    if (blob) resolve(blob);
                    else reject(new Error('Failed to generate blob'));
                  }, 'image/jpeg', 0.95);
                });
                
                console.log(`📸 Video processed as enhanced image frame: ${(enhancedBlob.size / 1024 / 1024).toFixed(2)}MB`);
                
                // Restore mediaRef
                mediaRef.current = prevMediaRef;
              } else {
                // For audio without filters, use original blob
                enhancedBlob = sourceBlob;
              }
              
              // Clean up blob URL
              URL.revokeObjectURL(blobUrl);
            }
            
            console.log(`✅ ${hasAnyEnhancements ? 'Enhanced' : 'Original'} blob ready for file ${i}:`, {
              size: enhancedBlob.size,
              type: enhancedBlob.type
            });
            
            // 🎯 Determine final media type
            // If video was processed with filters, it becomes a photo (single enhanced frame)
            const finalType = (file.type === 'video' && hasAnyEnhancements && enhancedBlob.type.startsWith('image/')) 
              ? 'photo' 
              : file.type;
            
            console.log(`📋 Media type: ${file.type} → ${finalType} ${finalType !== file.type ? '(video converted to photo frame)' : ''}`);
            
            // 🎯 Build media object (enhanced OR original)
            const enhancedMedia = {
              blob: enhancedBlob,
              type: finalType,
              filename: hasAnyEnhancements 
                ? `enhanced-${ensureProperFilename(file.filename, enhancedBlob.type, finalType)}`
                : ensureProperFilename(file.filename, enhancedBlob.type, finalType),
              originalId: file.originalId, // 🔄 CRITICAL: Preserve originalId for replacement
              vaultId: file.id || file.vaultId, // 🆕 Track which vault item this came from
              fromVault: file.fromVault, // 🆕 Track if it came from vault
              metadata: hasAnyEnhancements && fileEnhancements ? {
                filter: fileEnhancements.filter,
                audioFilter: fileEnhancements.audioFilter,
                effects: Array.from(fileEnhancements.visualEffects),
                caption: fileEnhancements.captionText,
                stickers: fileEnhancements.stickers.map(s => ({ ...s })),
                dateStamp: fileEnhancements.showDateStamp ? fileEnhancements.dateStampText : null,
                brightness: fileEnhancements.brightness,
                contrast: fileEnhancements.contrast,
                saturation: fileEnhancements.saturation,
                rotation: fileEnhancements.rotation,
                flipHorizontal: fileEnhancements.flipHorizontal,
                flipVertical: fileEnhancements.flipVertical,
                timestamp: Date.now()
              } : undefined // No metadata for files without enhancements
            };
            
            // 🔄 CRITICAL: If this is replacing existing media (has originalId), skip vault backup
            // The media is already part of a capsule being edited, so we just enhance and replace
            const isReplacingExisting = !!file.originalId;
            
            if (!isReplacingExisting && !file.id) {
              // Only save to vault if NOT replacing existing media and NOT already a vault item
              try {
                console.log(`🏛️ [VAULT BACKUP] Saving media ${i} to vault...`);
                await onSave(enhancedMedia);
                vaultSaveCount++;
                console.log(`✅ [VAULT BACKUP] Media ${i} backed up to vault`);
              } catch (vaultError) {
                console.error(`❌ [VAULT BACKUP] Failed to save media ${i} to vault:`, vaultError);
                toast.error(`Failed to backup file ${i + 1}. Skipping.`);
                throw vaultError; // Exit - vault save is mandatory
              }
            } else if (isReplacingExisting) {
              console.log(`🔄 Skipping vault backup for replacement media ${i} (originalId: ${file.originalId})`);
            }
            
            enhancedMediaArray.push(enhancedMedia);
            
          } catch (error) {
            console.error(`❌ Failed to process file ${i}:`, error);
            throw error; // Re-throw to be caught by outer try-catch
          }
        }
        
        // Check if any files were processed
        if (enhancedMediaArray.length === 0) {
          console.log('⚠️ No files to send to capsule');
          toast.error('No files to add to capsule.');
          setIsSaving(false);
          return;
        }
        
        // Send all media together (enhanced + original)
        console.log(`📤 Sending ${enhancedMediaArray.length} media file(s) to capsule...`);
        await onUseInCapsule(enhancedMediaArray);
        console.log(`✅ All media successfully added to capsule`);
        
        if (vaultSaveCount > 0) {
          toast.success(`${vaultSaveCount} file(s) backed up to Vault!`, { duration: 2000 });
        }
        
        // Count how many were actually enhanced
        const enhancedCount = enhancedMediaArray.filter(m => m.metadata).length;
        if (enhancedCount > 0 && enhancedCount < enhancedMediaArray.length) {
          toast.success(`${enhancedMediaArray.length} file(s) added to capsule (${enhancedCount} enhanced)!`);
        } else if (enhancedCount > 0) {
          toast.success(`${enhancedCount} enhanced file(s) added to capsule!`);
        } else {
          toast.success(`${enhancedMediaArray.length} file(s) added to capsule!`);
        }
      } else {
        // SINGLE FILE MODE: Process just the current file
        // Validate media before processing
        if (!currentMediaFile?.blob && !currentMediaFile?.url) {
          throw new Error('No media available to process');
        }
        
        console.log('🎨 Generating enhanced media for capsule...', {
          hasBlob: !!currentMediaFile.blob,
          hasUrl: !!currentMediaFile.url,
          type: currentMediaFile.type,
          filename: currentMediaFile.filename
        });
        
        const enhancedBlob = await generateEnhancedMedia();
        
        // Validate generated blob
        if (!enhancedBlob || enhancedBlob.size === 0) {
          throw new Error('Generated media is empty or invalid');
        }
        
        console.log('✅ Enhanced media generated:', {
          size: enhancedBlob.size,
          type: enhancedBlob.type
        });
        
        // Determine final media type (video with filters becomes photo)
        const finalType = (currentMediaFile.type === 'video' && enhancedBlob.type.startsWith('image/'))
          ? 'photo'
          : currentMediaFile.type;
        
        console.log(`✅ Media type: ${currentMediaFile.type} → ${finalType}`);
        
        const enhancedMedia = {
          blob: enhancedBlob,
          type: finalType,
          filename: `enhanced-${ensureProperFilename(currentMediaFile.filename, enhancedBlob.type, finalType)}`,
          originalId: currentMediaFile.originalId, // 🔄 CRITICAL: Preserve originalId for replacement
          vaultId: currentMediaFile.id || currentMediaFile.vaultId, // 🆕 Track which vault item this came from
          fromVault: currentMediaFile.fromVault, // 🆕 Track if it came from vault
          metadata: {
            filter: selectedFilter,
            audioFilter: selectedAudioFilter,
            effects: Array.from(visualEffects),
            caption: captionText,
            stickers: selectedStickers.map(s => ({ ...s })),
            dateStamp: showDateStamp ? dateStampText : null,
            timestamp: Date.now()
          }
        };

        // 🛡️ CRITICAL: Save to vault FIRST as backup (unless it's an existing vault item OR replacing capsule media)
        const isReplacingCapsuleMedia = !!currentMediaFile.originalId;
        
        if (!currentMediaFile.id && !isReplacingCapsuleMedia) {
          try {
            console.log('🏛️ [VAULT BACKUP] Saving media to vault before capsule...');
            await onSave(enhancedMedia);
            console.log('✅ [VAULT BACKUP] Media safely backed up to vault');
            toast.success('Backed up to Vault!', { duration: 2000 });
          } catch (vaultError) {
            console.error('❌ [VAULT BACKUP] CRITICAL: Failed to save to vault:', vaultError);
            setIsSaving(false);
            toast.error('Failed to backup media. Please try again.', { duration: 4000 });
            return; // EXIT - vault save is mandatory
          }
        } else if (isReplacingCapsuleMedia) {
          console.log('🔄 Skipping vault backup for capsule media replacement (originalId:', currentMediaFile.originalId, ')');
        }

        console.log('📤 Sending enhanced media to capsule...');
        await onUseInCapsule(enhancedMedia);
        toast.success('Enhanced media added to capsule!');
        console.log('✅ Media successfully added to capsule');
      }
    } catch (error) {
      console.error('❌ Failed to use enhanced media:', error);
      toast.error(`Failed to add media: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Get current filter CSS (with Phase 2 advanced editing adjustments)
  const getCurrentFilterCSS = () => {
    // 🎨 PHASE 2: Check if showing original (before/after toggle)
    if (showBeforeAfter) {
      return 'none';
    }
    
    const parts: string[] = [];
    
    // Add emotional filter
    if (selectedFilter !== 'none') {
      const filter = EMOTIONAL_FILTERS.find(f => f.id === selectedFilter);
      if (filter?.cssFilter) {
        parts.push(filter.cssFilter);
      }
    }
    
    // 🎨 PHASE 2: Add advanced editing adjustments
    if (brightness !== 100) parts.push(`brightness(${brightness / 100})`);
    if (contrast !== 100) parts.push(`contrast(${contrast / 100})`);
    if (saturation !== 100) parts.push(`saturate(${saturation / 100})`);
    
    return parts.length > 0 ? parts.join(' ') : 'none';
  };

  // Safety check
  if (!currentMediaFile || files.length === 0) {
    return (
      <div className="fixed inset-0 z-[10010] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center p-6">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-lg mb-2">Loading enhancement tools...</p>
          <p className="text-sm text-white/60">Preparing your media...</p>
          <Button 
            onClick={onCancel}
            variant="outline" 
            className="mt-4 text-white border-white/30 hover:bg-white/10"
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[10010] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col overflow-hidden">
      {/* Header - Clean Eras aesthetic */}
      <div className="shrink-0 bg-gradient-to-r from-purple-900/50 via-pink-900/50 to-purple-900/50 backdrop-blur-md border-b-2 border-white/20 shadow-lg relative z-10">
        <div className="flex items-center justify-between px-4 py-3 md:px-3 md:py-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Wand2 className="w-5 h-5 md:w-4 md:h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base md:text-sm font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">Enhance</h1>
            </div>
          </div>
          
          {/* 🎨 PHASE 2: Before/After Toggle */}
          <div className="flex items-center gap-2">
            {(currentMediaFile.type === 'photo' || currentMediaFile.type === 'video') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBeforeAfter(!showBeforeAfter)}
                className={`h-8 px-3 text-xs border-2 transition-all ${
                  showBeforeAfter
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-white/40 shadow-lg'
                    : 'bg-white/10 text-white border-white/30 hover:bg-white/20 hover:border-white/50'
                }`}
              >
                {showBeforeAfter ? (
                  <>
                    <Eye className="w-3 h-3 mr-1" />
                    Original
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3 h-3 mr-1" />
                    Before/After
                  </>
                )}
              </Button>
            )}
            <button
              onClick={onCancel}
            className="flex items-center justify-center text-white hover:text-white bg-white/10 hover:bg-white/20 h-9 w-9 rounded-lg border-2 border-white/30 hover:border-white/50 shadow-lg transition-all shrink-0 relative z-20 cursor-pointer"
            aria-label="Close enhancement overlay"
            type="button"
            style={{
              minHeight: '36px',
              minWidth: '36px',
              padding: 0
            }}
          >
            <span style={{
              fontSize: '28px',
              lineHeight: '1',
              fontWeight: '400',
              color: '#ffffff',
              display: 'block',
              width: '100%',
              height: '100%',
              textAlign: 'center',
              position: 'relative',
              top: '-2px'
            }}>×</span>
            </button>
          </div>
        </div>

        {/* Thumbnail Navigation Strip - Only show on desktop in carousel mode */}
        {isCarouselMode && (
          <div className="hidden md:block px-3 pb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white disabled:from-gray-700/50 disabled:to-gray-800/50 disabled:opacity-50 disabled:cursor-not-allowed h-10 w-10 shrink-0 rounded-lg border-2 border-white/30 shadow-lg transition-all hover:scale-105 flex items-center justify-center"
                title="Previous"
                style={{ fontSize: '24px', lineHeight: '1' }}
              >
                ‹
              </button>

              <ScrollArea className="flex-1">
                <div className="flex gap-2 py-1">
                  {files.map((file, index) => {
                    // Create URL for thumbnail
                    const thumbUrl = file.url || (file.blob ? URL.createObjectURL(file.blob) : '');
                    const videoThumb = videoThumbnails.get(index);
                    const isActive = index === currentIndex;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          // Pause any playing media before switching
                          if (mediaRef.current && 'pause' in mediaRef.current) {
                            try {
                              mediaRef.current.pause();
                            } catch (e) {
                              console.log('Could not pause media:', e);
                            }
                          }
                          setIsPlaying(false);
                          
                          // 🎯 Save current enhancements before switching
                          saveCurrentEnhancements();
                          
                          setCurrentIndex(index);
                          
                          // 🎯 Restore enhancements for selected file
                          restoreEnhancements(index);
                        }}
                        className={`relative shrink-0 rounded-lg overflow-hidden transition-all ${
                          isActive 
                            ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-900 scale-105' 
                            : 'opacity-60 hover:opacity-100 hover:scale-105'
                        }`}
                        title={`${file.type} ${index + 1}`}
                      >
                        {/* Thumbnail */}
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-black/40 flex items-center justify-center">
                          {file.type === 'photo' && thumbUrl && (
                            <img 
                              src={thumbUrl} 
                              alt={`Media ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          )}
                          {file.type === 'video' && (
                            <>
                              {videoThumb ? (
                                <img 
                                  src={videoThumb} 
                                  alt={`Video ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="relative w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                                  <Video className="w-6 h-6 md:w-8 md:h-8 text-white" />
                                </div>
                              )}
                              {/* Video play icon overlay */}
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="bg-black/60 rounded-full p-1">
                                  <Play className="w-4 h-4 text-white fill-white" />
                                </div>
                              </div>
                            </>
                          )}
                          {file.type === 'audio' && (
                            <div className="relative w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                              <Mic className="w-6 h-6 md:w-8 md:h-8 text-white" />
                            </div>
                          )}
                        </div>
                        
                        {/* Active indicator */}
                        {isActive && (
                          <div className="absolute inset-0 border-2 border-purple-400 rounded-lg pointer-events-none" />
                        )}
                        
                        {/* 🎯 Enhancement indicator - shows if this file has enhancements */}
                        {perFileEnhancements.has(index) && (
                          <div className="absolute top-1 left-1 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full p-1 shadow-lg border border-white/50">
                            <Sparkles className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                        
                        {/* Index badge */}
                        <div className={`absolute top-1 right-1 text-xs font-bold px-1.5 py-0.5 rounded ${
                          isActive 
                            ? 'bg-purple-500 text-white' 
                            : 'bg-black/60 text-white/80'
                        }`}>
                          {index + 1}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>

              <button
                onClick={handleNext}
                disabled={currentIndex === files.length - 1}
                className="bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white disabled:from-gray-700/50 disabled:to-gray-800/50 disabled:opacity-50 disabled:cursor-not-allowed h-10 w-10 shrink-0 rounded-lg border-2 border-white/30 shadow-lg transition-all hover:scale-105 flex items-center justify-center"
                title="Next"
                style={{ fontSize: '24px', lineHeight: '1' }}
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content - FULL SCREEN on mobile */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Preview Area - EDGE-TO-EDGE width, optimal height on mobile */}
        <div 
          className="h-[55vh] md:h-full md:flex-1 md:flex-[2] flex items-center justify-center p-0 md:p-3 bg-black md:bg-gradient-to-br md:from-black/30 md:via-black/20 md:to-black/30 overflow-hidden relative"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="relative w-full h-full flex items-center justify-center bg-black md:bg-transparent">
            {/* Canvas for rendering (hidden) */}
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Preview */}
            {currentMediaFile.type === 'photo' && (
              <div 
                ref={previewContainerRef}
                className="relative w-full h-full flex items-center justify-center"
                onMouseMove={(e) => {
                  if (isDraggingText) handleTextDrag(e);
                  if (draggingSticker) handleStickerDrag(e, draggingSticker);
                  if (cropDragHandle) handleCropDrag(e); // 🎨 PHASE 4A
                  if (draggingTextLayerId) handleTextLayerDrag(e); // 🎨 PHASE 4B
                }}
                onMouseUp={() => {
                  handleTextDragEnd();
                  handleStickerDragEnd();
                  handleCropDragEnd(); // 🎨 PHASE 4A
                  handleTextLayerDragEnd(); // 🎨 PHASE 4B
                }}
                onTouchMove={(e) => {
                  if (isDraggingText) handleTextDrag(e);
                  if (draggingSticker) handleStickerDrag(e, draggingSticker);
                  if (cropDragHandle) handleCropDrag(e); // 🎨 PHASE 4A
                  if (draggingTextLayerId) handleTextLayerDrag(e); // 🎨 PHASE 4B
                }}
                onTouchEnd={() => {
                  handleTextDragEnd();
                  handleStickerDragEnd();
                  handleCropDragEnd(); // 🎨 PHASE 4A
                  handleTextLayerDragEnd(); // 🎨 PHASE 4B
                }}
              >
                {mediaUrl && mediaUrl.length > 0 ? (
                  <img
                    key={mediaUrl}
                    ref={mediaRef as React.RefObject<HTMLImageElement>}
                    src={mediaUrl}
                    alt="Preview"
                    className="w-full h-full object-contain md:rounded-lg md:shadow-2xl md:border-2 border-white/10"
                    style={{ 
                      filter: getCurrentFilterCSS(),
                      WebkitFilter: getCurrentFilterCSS(),
                      transform: `rotate(${rotation}deg) scaleX(${flipHorizontal ? -1 : 1}) scaleY(${flipVertical ? -1 : 1})`
                    }}
                    onError={(e) => {
                      console.error('Image load error:', e.type);
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black/20 rounded-lg">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                  </div>
                )}
                
                {/* Active Filter Badge */}
                {selectedFilter !== 'none' && (
                  <div className="absolute top-4 left-4">
                    <Badge className={`bg-gradient-to-r ${EMOTIONAL_FILTERS.find(f => f.id === selectedFilter)?.gradient} text-white border-0`}>
                      {EMOTIONAL_FILTERS.find(f => f.id === selectedFilter)?.name}
                    </Badge>
                  </div>
                )}
                
                {/* Active Effects Badges */}
                {visualEffects.size > 0 && (
                  <div className="absolute top-4 right-4 flex flex-col gap-1">
                    {Array.from(visualEffects).map(effectId => {
                      const effect = VISUAL_EFFECTS.find(e => e.id === effectId);
                      return effect ? (
                        <Badge key={effectId} variant="secondary" className="bg-black/60 text-white border-0 backdrop-blur-sm">
                          {effect.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
                
                {/* Vignette Effect Overlay */}
                {visualEffects.has('vignette') && (
                  <div 
                    className="absolute inset-0 pointer-events-none rounded-lg"
                    style={{
                      background: `radial-gradient(ellipse at center, transparent 0%, transparent 30%, rgba(0,0,0,0.5) 100%)`
                    }}
                  />
                )}
                
                {/* Film Grain Effect Overlay */}
                {visualEffects.has('grain') && (
                  <div 
                    className="absolute inset-0 pointer-events-none rounded-lg mix-blend-overlay"
                    style={{
                      opacity: 0.3,
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
                      backgroundSize: '200px 200px'
                    }}
                  />
                )}

                {/* Light Leak Effect - Golden Hour */}
                {visualEffects.has('light-leak') && (
                  <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden">
                    <div 
                      className="absolute -top-20 -right-20 w-96 h-96 rounded-full mix-blend-screen"
                      style={{
                        background: 'radial-gradient(circle, rgba(255,200,100,0.5) 0%, transparent 70%)',
                        filter: 'blur(40px)'
                      }}
                    />
                  </div>
                )}

                {/* Bokeh Lights Effect - Starlight */}
                {visualEffects.has('bokeh') && (
                  <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute rounded-full mix-blend-screen animate-pulse"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                          width: `${20 + Math.random() * 40}px`,
                          height: `${20 + Math.random() * 40}px`,
                          background: `radial-gradient(circle, ${['rgba(255,200,150,0.6)', 'rgba(150,200,255,0.6)', 'rgba(255,150,200,0.6)'][i % 3]} 0%, transparent 70%)`,
                          filter: 'blur(8px)',
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: `${2 + Math.random() * 2}s`
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Confetti Effect - Celebration */}
                {visualEffects.has('confetti') && (
                  <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute animate-bounce"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${-10 + Math.random() * 30}%`,
                          width: '8px',
                          height: '8px',
                          backgroundColor: ['#FF6B9D', '#C44569', '#FFC312', '#12CBC4', '#A3CB38'][i % 5],
                          transform: `rotate(${Math.random() * 360}deg)`,
                          animationDelay: `${i * 0.05}s`,
                          animationDuration: `${2 + Math.random() * 2}s`
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Polaroid Frame - Instant Photo */}
                {visualEffects.has('polaroid') && (
                  <>
                    {/* Top border */}
                    <div className="absolute top-0 left-0 right-0 bg-white pointer-events-none" style={{ height: '4%' }} />
                    {/* Left border */}
                    <div className="absolute top-0 bottom-0 left-0 bg-white pointer-events-none" style={{ width: '4%' }} />
                    {/* Right border */}
                    <div className="absolute top-0 bottom-0 right-0 bg-white pointer-events-none" style={{ width: '4%' }} />
                    {/* Bottom border (thicker for Polaroid effect) */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white pointer-events-none" style={{ height: '10%' }} />
                    {/* Inner shadow for photo depth */}
                    <div className="absolute pointer-events-none" style={{
                      top: '4%',
                      left: '4%',
                      right: '4%',
                      bottom: '10%',
                      boxShadow: 'inset 0 0 10px rgba(0,0,0,0.15)'
                    }} />
                  </>
                )}
                
                {/* Era Stickers - Draggable & Removable */}
                {selectedStickers.map(stickerInstance => {
                  const stickerDef = ERA_STICKERS.find(s => s.id === stickerInstance.type);
                  if (!stickerDef) return null;
                  const StickerIcon = stickerDef.icon;
                  const isDragging = draggingSticker === stickerInstance.id;
                  
                  return (
                    <div key={stickerInstance.id} className="group absolute" style={{
                      left: `${stickerInstance.x}%`,
                      top: `${stickerInstance.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}>
                      <div
                        className={`relative cursor-move select-none ${isDragging ? 'opacity-70 scale-110' : 'hover:scale-105'} transition-transform`}
                        onMouseDown={() => handleStickerDragStart(stickerInstance.id)}
                        onTouchStart={() => handleStickerDragStart(stickerInstance.id)}
                        title="Drag to move, click trash to remove"
                      >
                        <div className="rounded-full p-2 shadow-xl">
                          <StickerIcon 
                            className={stickerDef.color} 
                            style={{ width: `${stickerInstance.size}px`, height: `${stickerInstance.size}px` }}
                          />
                        </div>
                        {/* Remove button - appears on hover in TOP RIGHT */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSticker(stickerInstance.id);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg cursor-pointer"
                          title="Remove sticker"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {!isDragging && (
                        <div 
                          className="absolute pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity left-1/2 -translate-x-1/2"
                          style={{
                            top: `calc(${stickerInstance.size}px + 30px)`
                          }}
                        >
                          <Badge variant="secondary" className="bg-purple-600/80 text-white text-xs">
                            Drag to move
                          </Badge>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Date Stamp Overlay */}
                {showDateStamp && (
                  <div className="absolute bottom-4 left-4 text-white font-mono text-sm bg-black/50 px-2 py-1 rounded">
                    {dateStampText}
                  </div>
                )}
                
                {/* Caption Overlay - Draggable & Customizable */}
                {captionText && (
                  <div className="group absolute" style={{
                    left: `${textX}%`,
                    top: `${textY}%`,
                    transform: 'translate(-50%, -50%)',
                    maxWidth: '90%'
                  }}>
                    <div 
                      className={`relative cursor-move select-none ${isDraggingText ? 'opacity-70 scale-105' : 'hover:scale-105'} transition-transform`}
                      style={{
                        fontSize: `${textSize}px`,
                        color: textColor,
                        fontFamily: TEXT_FONTS.find(f => f.id === textFont)?.style.replace('font-', '') || 'sans-serif',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.5)',
                        wordWrap: 'break-word'
                      }}
                      onMouseDown={handleTextDragStart}
                      onTouchStart={handleTextDragStart}
                      title="Drag to reposition"
                    >
                      {captionText}
                      {/* Delete button - appears on hover in top right */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCaptionText('');
                          toast.success('Caption removed');
                        }}
                        className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg cursor-pointer"
                        title="Remove caption"
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {!isDraggingText && (
                      <div 
                        className="absolute pointer-events-none left-1/2 -translate-x-1/2"
                        style={{
                          top: `calc(100% + 10px)`
                        }}
                      >
                        <Badge variant="secondary" className="bg-purple-600/80 text-white text-xs animate-pulse">
                          Drag to move
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
                
                {/* 🎨 PHASE 4B: TEXT LAYERS - Multiple draggable text overlays */}
                {textLayers.map(layer => {
                  const isDragging = draggingTextLayerId === layer.id;
                  const isSelected = selectedTextLayerId === layer.id;
                  
                  return (
                    <div 
                      key={layer.id}
                      className="group absolute cursor-move"
                      style={{
                        left: `${layer.x}%`,
                        top: `${layer.y}%`,
                        transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
                        maxWidth: '90%',
                        zIndex: isSelected ? 20 : 10
                      }}
                      onMouseDown={() => handleTextLayerDragStart(layer.id)}
                      onTouchStart={() => handleTextLayerDragStart(layer.id)}
                    >
                      <div
                        className={`relative select-none ${
                          isDragging ? 'opacity-70 scale-105' : 'hover:scale-105'
                        } ${
                          isSelected ? 'ring-2 ring-purple-500 ring-offset-2' : ''
                        } transition-all rounded px-1`}
                        style={{
                          fontSize: `${layer.size}px`,
                          color: layer.color,
                          fontFamily: TEXT_FONTS.find(f => f.id === layer.font)?.style.replace('font-', '') || 'sans-serif',
                          textShadow: layer.shadowBlur > 0 
                            ? `0 0 ${layer.shadowBlur}px ${layer.shadowColor}`
                            : 'none',
                          WebkitTextStroke: layer.outlineWidth > 0 
                            ? `${layer.outlineWidth}px ${layer.outlineColor}`
                            : 'none',
                          wordWrap: 'break-word',
                          textAlign: 'center'
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          const newText = prompt('Edit text:', layer.text);
                          if (newText !== null) {
                            updateTextLayer(layer.id, { text: newText });
                          }
                        }}
                        title="Drag to move • Double-click to edit"
                      >
                        {layer.text}
                        
                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTextLayer(layer.id);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg cursor-pointer"
                          title="Remove text layer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      
                      {isSelected && !isDragging && (
                        <div className="absolute pointer-events-none left-1/2 -translate-x-1/2" style={{ top: 'calc(100% + 10px)' }}>
                          <Badge className="bg-purple-600 text-white text-xs animate-pulse">
                            Selected • Drag to move
                          </Badge>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* 🎨 PHASE 3 & 4A: CROP OVERLAY (with draggable handles) */}
                {showCropMode && cropRegion && (
                  <>
                    {/* Darkened overlay outside crop region */}
                    <div className="absolute inset-0 bg-black/50 pointer-events-none" />
                    
                    {/* Crop region - clear window with draggable center */}
                    <div
                      className="absolute border-2 border-white shadow-2xl cursor-move"
                      style={{
                        left: `${cropRegion.x}%`,
                        top: `${cropRegion.y}%`,
                        width: `${cropRegion.width}%`,
                        height: `${cropRegion.height}%`,
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.3)'
                      }}
                      onMouseDown={(e) => handleCropDragStart('center', e)}
                      onTouchStart={(e) => handleCropDragStart('center', e)}
                    >
                      {/* 🎨 PHASE 4A: Draggable Corner handles */}
                      <div 
                        className="absolute -top-1 -left-1 w-4 h-4 bg-white rounded-full border-2 border-purple-500 cursor-nwse-resize hover:scale-125 transition-transform z-10" 
                        onMouseDown={(e) => handleCropDragStart('nw', e)}
                        onTouchStart={(e) => handleCropDragStart('nw', e)}
                        title="Drag to resize"
                      />
                      <div 
                        className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full border-2 border-purple-500 cursor-nesw-resize hover:scale-125 transition-transform z-10" 
                        onMouseDown={(e) => handleCropDragStart('ne', e)}
                        onTouchStart={(e) => handleCropDragStart('ne', e)}
                        title="Drag to resize"
                      />
                      <div 
                        className="absolute -bottom-1 -left-1 w-4 h-4 bg-white rounded-full border-2 border-purple-500 cursor-nesw-resize hover:scale-125 transition-transform z-10" 
                        onMouseDown={(e) => handleCropDragStart('sw', e)}
                        onTouchStart={(e) => handleCropDragStart('sw', e)}
                        title="Drag to resize"
                      />
                      <div 
                        className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full border-2 border-purple-500 cursor-nwse-resize hover:scale-125 transition-transform z-10" 
                        onMouseDown={(e) => handleCropDragStart('se', e)}
                        onTouchStart={(e) => handleCropDragStart('se', e)}
                        title="Drag to resize"
                      />
                      
                      {/* Rule of thirds grid */}
                      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                        {Array.from({ length: 9 }).map((_, i) => (
                          <div key={i} className="border border-white/20" />
                        ))}
                      </div>
                      
                      {/* Crop dimensions badge with drag hint */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 pointer-events-none">
                        <Badge className={`bg-purple-600 text-white border-0 shadow-lg transition-all ${
                          cropDragHandle ? 'scale-110 animate-pulse' : ''
                        }`}>
                          {cropDragHandle 
                            ? (cropDragHandle === 'center' ? '↔️ Move' : '↗️ Resize')
                            : (cropAspectRatio === 'free' ? 'Free Crop • Drag to adjust' : `${CROP_ASPECT_RATIOS.find(r => r.id === cropAspectRatio)?.name} • Drag to adjust`)
                          }
                        </Badge>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {currentMediaFile.type === 'video' && (
              <div className="relative w-full h-full flex items-center justify-center">
                {mediaUrl && mediaUrl.length > 0 ? (
                  <video
                    key={mediaUrl}
                    ref={mediaRef as React.RefObject<HTMLVideoElement>}
                    src={mediaUrl}
                    poster={currentMediaFile.thumbnail}
                    controls
                    className="max-w-full max-h-full object-contain md:rounded-lg md:shadow-2xl md:border-2 border-white/10"
                    style={{ 
                      filter: getCurrentFilterCSS(),
                      WebkitFilter: getCurrentFilterCSS(),
                      transform: `rotate(${rotation}deg) scaleX(${flipHorizontal ? -1 : 1}) scaleY(${flipVertical ? -1 : 1})`
                    }}
                    playsInline
                    preload="auto"
                    onLoadedMetadata={(e) => {
                      // Ensure video is paused on load
                      const video = e.currentTarget;
                      console.log('✅ Video metadata loaded:', {
                        duration: video.duration,
                        readyState: video.readyState,
                        videoWidth: video.videoWidth,
                        videoHeight: video.videoHeight
                      });
                      if (mediaRef.current && 'pause' in mediaRef.current) {
                        mediaRef.current.pause();
                        setIsPlaying(false);
                      }
                    }}
                    onLoadedData={(e) => {
                      console.log('✅ Video data loaded and ready to play');
                    }}
                    onCanPlay={(e) => {
                      console.log('✅ Video can play (enough data buffered)');
                    }}
                    onPlay={() => {
                      console.log('▶️ Video started playing');
                      setIsPlaying(true);
                    }}
                    onPause={() => {
                      console.log('⏸️ Video paused');
                      setIsPlaying(false);
                    }}
                    onEnded={() => {
                      console.log('⏹️ Video ended');
                      setIsPlaying(false);
                      // Reset video to beginning for replay
                      if (mediaRef.current && 'currentTime' in mediaRef.current) {
                        mediaRef.current.currentTime = 0;
                      }
                    }}
                    onError={(e) => {
                      const videoElement = e.currentTarget as HTMLVideoElement;
                      const videoError = videoElement.error;
                      
                      console.error('❌ Video error:', {
                        errorCode: videoError?.code,
                        errorMsg: videoError?.message,
                        networkState: videoElement.networkState,
                        src: videoElement.src?.substring(0, 100) + '...'
                      });
                      
                      // Show user-friendly error for unsupported formats (excluding QuickTime - now supported)
                      if (videoError?.code === 4 && !videoElement.src.includes('video/quicktime')) {
                        toast.error('Unsupported Video Format', {
                          description: 'This video format is not supported in your browser. Please try converting to MP4.',
                          duration: 6000
                        });
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black/20 rounded-lg">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                  </div>
                )}
                
                {/* Active Filter Badge */}
                {selectedFilter !== 'none' && (
                  <div className="absolute top-4 left-4">
                    <Badge className={`bg-gradient-to-r ${EMOTIONAL_FILTERS.find(f => f.id === selectedFilter)?.gradient} text-white border-0`}>
                      {EMOTIONAL_FILTERS.find(f => f.id === selectedFilter)?.name}
                    </Badge>
                  </div>
                )}
                
                {/* Active Effects Badges */}
                {visualEffects.size > 0 && (
                  <div className="absolute top-4 right-4 flex flex-col gap-1">
                    {Array.from(visualEffects).map(effectId => {
                      const effect = VISUAL_EFFECTS.find(e => e.id === effectId);
                      return effect ? (
                        <Badge key={effectId} variant="secondary" className="bg-black/60 text-white border-0 backdrop-blur-sm">
                          {effect.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
                
                {/* Vignette Effect Overlay */}
                {visualEffects.has('vignette') && (
                  <div 
                    className="absolute inset-0 pointer-events-none rounded-lg"
                    style={{
                      background: `radial-gradient(ellipse at center, transparent 0%, transparent 30%, rgba(0,0,0,0.5) 100%)`
                    }}
                  />
                )}
                
                {/* Film Grain Effect Overlay */}
                {visualEffects.has('grain') && (
                  <div 
                    className="absolute inset-0 pointer-events-none rounded-lg mix-blend-overlay"
                    style={{
                      opacity: 0.3,
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
                      backgroundSize: '200px 200px'
                    }}
                  />
                )}

                {/* Light Leak Effect - Golden Hour */}
                {visualEffects.has('light-leak') && (
                  <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden">
                    <div 
                      className="absolute -top-20 -right-20 w-96 h-96 rounded-full mix-blend-screen"
                      style={{
                        background: 'radial-gradient(circle, rgba(255,200,100,0.5) 0%, transparent 70%)',
                        filter: 'blur(40px)'
                      }}
                    />
                  </div>
                )}

                {/* Bokeh Lights Effect - Starlight */}
                {visualEffects.has('bokeh') && (
                  <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute rounded-full mix-blend-screen animate-pulse"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                          width: `${20 + Math.random() * 40}px`,
                          height: `${20 + Math.random() * 40}px`,
                          background: `radial-gradient(circle, ${['rgba(255,200,150,0.6)', 'rgba(150,200,255,0.6)', 'rgba(255,150,200,0.6)'][i % 3]} 0%, transparent 70%)`,
                          filter: 'blur(8px)',
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: `${2 + Math.random() * 2}s`
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Confetti Effect - Celebration */}
                {visualEffects.has('confetti') && (
                  <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute animate-bounce"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${-10 + Math.random() * 30}%`,
                          width: '8px',
                          height: '8px',
                          backgroundColor: ['#FF6B9D', '#C44569', '#FFC312', '#12CBC4', '#A3CB38'][i % 5],
                          transform: `rotate(${Math.random() * 360}deg)`,
                          animationDelay: `${i * 0.05}s`,
                          animationDuration: `${2 + Math.random() * 2}s`
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Polaroid Frame - Instant Photo */}
                {visualEffects.has('polaroid') && (
                  <>
                    {/* Top border */}
                    <div className="absolute top-0 left-0 right-0 bg-white pointer-events-none" style={{ height: '4%' }} />
                    {/* Left border */}
                    <div className="absolute top-0 bottom-0 left-0 bg-white pointer-events-none" style={{ width: '4%' }} />
                    {/* Right border */}
                    <div className="absolute top-0 bottom-0 right-0 bg-white pointer-events-none" style={{ width: '4%' }} />
                    {/* Bottom border (thicker for Polaroid effect) */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white pointer-events-none" style={{ height: '10%' }} />
                    {/* Inner shadow for photo depth */}
                    <div className="absolute pointer-events-none" style={{
                      top: '4%',
                      left: '4%',
                      right: '4%',
                      bottom: '10%',
                      boxShadow: 'inset 0 0 10px rgba(0,0,0,0.15)'
                    }} />
                  </>
                )}
                
                {/* Era Stickers - Draggable & Removable */}
                {selectedStickers.map(stickerInstance => {
                  const stickerDef = ERA_STICKERS.find(s => s.id === stickerInstance.type);
                  if (!stickerDef) return null;
                  const StickerIcon = stickerDef.icon;
                  const isDragging = draggingSticker === stickerInstance.id;
                  
                  return (
                    <div key={stickerInstance.id} className="group absolute" style={{
                      left: `${stickerInstance.x}%`,
                      top: `${stickerInstance.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}>
                      <div
                        className={`relative cursor-move select-none ${isDragging ? 'opacity-70 scale-110' : 'hover:scale-105'} transition-transform`}
                        onMouseDown={() => handleStickerDragStart(stickerInstance.id)}
                        onTouchStart={() => handleStickerDragStart(stickerInstance.id)}
                        title="Drag to move, click trash to remove"
                      >
                        <div className="rounded-full p-2 shadow-xl">
                          <StickerIcon 
                            className={stickerDef.color} 
                            style={{ width: `${stickerInstance.size}px`, height: `${stickerInstance.size}px` }}
                          />
                        </div>
                        {/* Remove button - appears on hover in TOP RIGHT */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSticker(stickerInstance.id);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg cursor-pointer"
                          title="Remove sticker"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {!isDragging && (
                        <div 
                          className="absolute pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity left-1/2 -translate-x-1/2"
                          style={{
                            top: `calc(${stickerInstance.size}px + 30px)`
                          }}
                        >
                          <Badge variant="secondary" className="bg-purple-600/80 text-white text-xs">
                            Drag to move
                          </Badge>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Play/Pause Button - Always visible with high z-index */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-50">
                  <button
                    onClick={togglePlayback}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-2xl border-2 border-white/30 backdrop-blur-sm transition-all hover:scale-110 active:scale-95"
                    style={{ zIndex: 50 }}
                    title={isPlaying ? 'Pause video' : 'Play video'}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                </div>
                
                {showDateStamp && (
                  <div className="absolute bottom-16 left-4 text-white font-mono text-sm bg-black/50 px-2 py-1 rounded">
                    {dateStampText}
                  </div>
                )}
                
                {captionText && (
                  <div className="group absolute" style={{
                    left: `${textX}%`,
                    top: `${textY}%`,
                    transform: 'translate(-50%, -50%)',
                    maxWidth: '90%'
                  }}>
                    <div 
                      className={`relative cursor-move select-none ${isDraggingText ? 'opacity-70 scale-105' : 'hover:scale-105'} transition-transform`}
                      style={{
                        fontSize: `${textSize}px`,
                        color: textColor,
                        fontFamily: TEXT_FONTS.find(f => f.id === textFont)?.style.replace('font-', '') || 'sans-serif',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.5)',
                        wordWrap: 'break-word'
                      }}
                      onMouseDown={handleTextDragStart}
                      onTouchStart={handleTextDragStart}
                      title="Drag to reposition"
                    >
                      {captionText}
                      {/* Delete button - appears on hover in top right */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCaptionText('');
                          toast.success('Caption removed');
                        }}
                        className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg cursor-pointer"
                        title="Remove caption"
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {!isDraggingText && (
                      <div 
                        className="absolute pointer-events-none left-1/2 -translate-x-1/2"
                        style={{
                          top: `calc(100% + 10px)`
                        }}
                      >
                        <Badge variant="secondary" className="bg-purple-600/80 text-white text-xs animate-pulse">
                          Drag to move
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {currentMediaFile.type === 'audio' && (
              <Card className="w-full h-full md:max-w-lg md:h-auto bg-gradient-to-br from-purple-900/90 to-pink-900/90 md:from-purple-900/40 md:to-pink-900/40 border-0 md:border-2 md:border-white/10 backdrop-blur-sm shadow-2xl rounded-none md:rounded-lg">
                <CardContent className="h-full flex items-center justify-center p-8 md:p-8">
                  <div className="flex flex-col items-center gap-6 md:gap-6">
                    <div className="w-28 h-28 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-xl border-4 border-white/20">
                      <Mic className="w-14 h-14 md:w-12 md:h-12 text-white" />
                    </div>
                    
                    <div className="text-center">
                      <h3 className="text-sm md:text-lg font-semibold text-white mb-2">Audio Message</h3>
                      <Badge variant="secondary" className="bg-white/10 text-white text-xs">
                        {selectedAudioFilter !== 'none' ? AUDIO_FILTERS.find(f => f.id === selectedAudioFilter)?.name : 'Original'}
                      </Badge>
                    </div>
                    
                    {mediaUrl && mediaUrl.length > 0 ? (
                      <audio
                        key={previewAudioUrl || mediaUrl}
                        ref={mediaRef as React.RefObject<HTMLAudioElement>}
                        src={previewAudioUrl || mediaUrl}
                        className="w-full"
                        controls
                        autoPlay={!!previewAudioUrl}
                        onError={(e) => {
                          console.error('Audio load error:', e.type);
                        }}
                      />
                    ) : (
                      <div className="w-full flex items-center justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                      </div>
                    )}
                    
                    {/* Audio Visualization Placeholder - Hidden on mobile to save space */}
                    <div className="hidden md:flex w-full h-12 md:h-16 bg-black/30 rounded-lg items-center justify-center gap-0.5 md:gap-1 px-2 md:px-4">
                      {[...Array(30)].map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full animate-pulse"
                          style={{
                            height: `${Math.random() * 60 + 20}%`,
                            animationDelay: `${i * 0.05}s`
                          }}
                        />
                      ))}
                    </div>
                    
                    {showTranscription && (
                      <div className="w-full p-2 md:p-4 bg-black/30 rounded-lg">
                        <p className="text-[11px] md:text-sm text-white/80 italic">
                          AI transcription would appear here...
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Swipe Hint for Mobile Carousel - Eras styled */}
            {isCarouselMode && showSwipeHint && (
              <div className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 animate-fade-in-up z-10">
                <div className="bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm shadow-2xl border-2 border-white/30 flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4 animate-pulse" />
                  <span className="font-medium">Swipe to navigate</span>
                  <ChevronRight className="w-4 h-4 animate-pulse" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Bottom Navigation Bar - SEPARATED arrows around progress */}
        {isCarouselMode && (
          <div className="md:hidden shrink-0 bg-gradient-to-r from-purple-900/80 via-pink-900/80 to-purple-900/80 backdrop-blur-md border-t-2 border-white/20 px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Previous Arrow - LEFT side */}
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-700/50 disabled:to-gray-800/50 disabled:cursor-not-allowed text-white rounded-full p-4 backdrop-blur-md shadow-2xl border-3 border-white/40 transition-all active:scale-90 flex items-center justify-center"
                aria-label="Previous media"
                style={{ fontSize: '32px', lineHeight: '1', width: '56px', height: '56px' }}
              >
                ‹
              </button>

              {/* Progress Bar - CENTER */}
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="text-white text-sm font-medium">
                  {currentIndex + 1} of {files.length}
                </div>
                <div className="w-full flex gap-1.5">
                  {files.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        // Pause any playing media before switching
                        if (mediaRef.current && 'pause' in mediaRef.current) {
                          try {
                            mediaRef.current.pause();
                          } catch (e) {
                            console.log('Could not pause media:', e);
                          }
                        }
                        setIsPlaying(false);
                        
                        // 🎯 Save current enhancements before switching
                        saveCurrentEnhancements();
                        
                        setCurrentIndex(index);
                        
                        // 🎯 Restore enhancements for selected file
                        restoreEnhancements(index);
                      }}
                      className={`flex-1 h-1.5 rounded-full transition-all ${
                        index === currentIndex 
                          ? 'bg-gradient-to-r from-purple-400 to-pink-400 scale-y-150' 
                          : 'bg-white/30 hover:bg-white/50'
                      }`}
                      aria-label={`Go to item ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Next Arrow - RIGHT side */}
              <button
                onClick={handleNext}
                disabled={currentIndex === files.length - 1}
                className="bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-700/50 disabled:to-gray-800/50 disabled:cursor-not-allowed text-white rounded-full p-4 backdrop-blur-md shadow-2xl border-3 border-white/40 transition-all active:scale-90 flex items-center justify-center"
                aria-label="Next media"
                style={{ fontSize: '32px', lineHeight: '1', width: '56px', height: '56px' }}
              >
                ›
              </button>
            </div>
          </div>
        )}

        {/* Enhancement Tools Panel - Streamlined Single Panel */}
        <div className="flex-1 md:h-auto md:w-80 lg:w-96 bg-gradient-to-b from-black/50 to-black/40 backdrop-blur-md border-t-2 md:border-t-0 md:border-l-2 border-purple-500/20 flex flex-col shrink-0 overflow-hidden min-h-0">
          
          {/* 🔮 PHASE 3: REFINED TAB NAVIGATION with Smooth Transitions */}
          <div className="shrink-0 px-3 pt-3 pb-2 border-b border-white/10">
            {(() => {
              const visibleTabs = ENHANCEMENT_TABS.filter(tab => 
                tab.compatibleTypes.includes(currentMediaFile.type)
              );
              console.log(`🔮 Visible tabs count: ${visibleTabs.length}, Types: ${visibleTabs.map(t => t.id).join(', ')}`);
              return null;
            })()}
            
            {/* Tab Pills - Dashboard Style */}
            <div className="flex gap-2 relative">
              {ENHANCEMENT_TABS.map(tab => {
                const TabIcon = tab.icon;
                const isCompatible = tab.compatibleTypes.includes(currentMediaFile.type);
                const isActive = activeTab === tab.id;
                
                console.log(`🔮 Tab: ${tab.id}, Compatible: ${isCompatible}, Active: ${isActive}, MediaType: ${currentMediaFile.type}`);
                
                // Don't show incompatible tabs
                if (!isCompatible) return null;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      console.log(`🔮 Tab clicked: ${tab.id}`);
                      setActiveTab(tab.id);
                    }}
                    disabled={!isCompatible}
                    className={`
                      relative flex-1 flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-xl 
                      transition-all duration-300 ease-out border-2
                      ${isActive
                        ? `bg-gradient-to-br ${tab.gradient} text-white shadow-2xl border-white/40 transform scale-105`
                        : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border-white/10 hover:border-white/20 hover:scale-102'
                      }
                    `}
                  >
                    <TabIcon className={`w-5 h-5 transition-all duration-300 ${isActive ? 'drop-shadow-lg scale-110' : ''}`} />
                    <div className={`text-xs font-bold transition-all duration-300 ${isActive ? 'scale-105' : ''}`}>
                      {tab.label}
                    </div>
                    
                    {/* Active indicator - animated underline */}
                    {isActive && (
                      <div className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-12 h-1 bg-white rounded-full animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <ScrollArea className="flex-1 px-3 md:px-3 py-1 h-full">
            <div className="space-y-1 pb-0">
              
              {/* 🎨 VISUAL TAB - Filters & Effects */}
              {(() => {
                console.log(`🎨 Rendering tab content. activeTab: ${activeTab}, mediaType: ${currentMediaFile.type}`);
                return null;
              })()}
              
              {activeTab === 'visual' && (
                <>
                  {console.log('🎨 Visual tab content rendering')}
                  
                  {/* ✨ PRESET SYSTEM - Streamlined */}
                  <div className="space-y-1">
                    {/* AI Auto-Enhance Button */}
                    <div className="relative overflow-hidden rounded-xl border-2 border-white/20 bg-gradient-to-br from-violet-600/30 via-purple-600/30 to-fuchsia-600/30 backdrop-blur-sm">
                      <button
                        type="button"
                        onClick={applyAIAutoEnhance}
                        disabled={isApplyingPreset}
                        className="w-full p-2.5 flex items-center justify-between hover:bg-white/10 transition-all disabled:opacity-50"
                      >
                        <div className="flex items-center gap-2">
                          <Wand2 className={`w-4 h-4 text-white ${isApplyingPreset ? 'animate-spin' : ''}`} />
                          <div className="text-left">
                            <div className="text-white font-semibold text-xs">AI Auto-Enhance</div>
                            <div className="text-white/70 text-[9px]">Intelligent optimization</div>
                          </div>
                        </div>
                        <Sparkles className="w-3.5 h-3.5 text-white/60" />
                      </button>
                    </div>
                    
                    {/* Enhancement Presets Grid - Showing all presets */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {[...ENHANCEMENT_PRESETS, ...customPresets]
                        .map(preset => {
                          const Icon = preset.icon;
                          return (
                            <div key={preset.id} className="relative group">
                              <button
                                type="button"
                                onClick={() => applyPreset(preset)}
                                disabled={isApplyingPreset}
                                className={`w-full flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all border-2 bg-gradient-to-br ${preset.gradient} text-white shadow-lg hover:shadow-xl border-white/20 hover:border-white/40 active:scale-95 disabled:opacity-50`}
                              >
                                <Icon className="w-5 h-5" />
                                <div className="text-[10px] font-semibold text-center">{preset.name}</div>
                              </button>
                              
                              {/* Delete button for custom presets */}
                              {preset.isCustom && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteCustomPreset(preset.id);
                                  }}
                                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                    </div>
                    
                    {/* Preset Actions */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={saveCustomPreset}
                        className="flex items-center justify-center gap-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs transition-all"
                      >
                        <Save className="w-4 h-4" />
                        Save Preset
                      </button>
                      <button
                        type="button"
                        onClick={resetEnhancements}
                        className="flex items-center justify-center gap-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs transition-all"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Reset
                      </button>
                    </div>
                  </div>
                  
                  <Separator className="bg-white/10 my-1" />
                  
                  {/* FILTERS - Compact Grid */}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Palette className="w-4 h-4 text-purple-300" />
                      <Label className="text-white text-xs font-semibold">Filters</Label>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-1.5">
                      {EMOTIONAL_FILTERS.map((filter, index) => {
                        const Icon = filter.icon;
                        const isSelected = selectedFilter === filter.id;
                        return (
                          <button
                            key={filter.id}
                            type="button"
                            onClick={() => {
                              // 🔧 FIX: Save current state to history BEFORE changing filter
                              saveToHistory();
                              
                              setSelectedFilter(filter.id);
                              // 🏆 Track achievement - Filter used
                              if (session?.access_token && filter.id !== 'none') {
                                trackAction('filter_used', { 
                                  filterName: filter.id,
                                  mediaType: currentMediaFile.type
                                }, session.access_token);
                              }
                            }}
                            className={`
                              flex flex-col items-center gap-1 p-2 rounded-lg 
                              transition-all border-2
                              ${isSelected 
                                ? `bg-gradient-to-br ${filter.gradient} text-white shadow-lg border-white/40` 
                                : 'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border-white/10 hover:border-white/20'
                              }
                            `}
                          >
                            <Icon className="w-5 h-5" />
                            <div className="text-[10px] font-semibold text-center">{filter.name}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Separator className="bg-white/10 my-1" />

                  {/* EFFECTS SECTION */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-300" />
                        <Label className="text-white text-xs font-semibold">Effects</Label>
                      </div>
                      {visualEffects.size > 0 && (
                        <button
                          onClick={() => setVisualEffects(new Set())}
                          className="text-[10px] text-white/60 hover:text-white transition-colors flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {VISUAL_EFFECTS.map(effect => {
                        const Icon = effect.icon;
                        const isActive = visualEffects.has(effect.id);
                        return (
                          <button
                            type="button"
                            key={effect.id}
                            onClick={() => toggleVisualEffect(effect.id)}
                            className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all border-2 ${
                              isActive 
                                ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white border-white/40 shadow-xl' 
                                : 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white border-white/10 hover:border-white/20 active:scale-95'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <div className="text-[10px] font-semibold text-center">{effect.name}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* 🎨 PHASE 2: ADVANCED EDITING TOOLS */}
                  {(currentMediaFile.type === 'photo' || currentMediaFile.type === 'video') && (
                    <>\n                      <Separator className="bg-white/10 my-1" />
                      
                      <div>
                        <button
                          onClick={() => setShowAdvancedEdit(!showAdvancedEdit)}
                          className="w-full flex items-center justify-between mb-2 p-2 rounded-lg hover:bg-white/5 transition-colors group"
                        >
                          <div className="flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-purple-300" />
                            <Label className="text-white text-sm font-semibold cursor-pointer">Advanced Editing</Label>
                          </div>
                          {showAdvancedEdit ? (
                            <ChevronUp className="w-4 h-4 text-white/60 group-hover:text-white" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-white/60 group-hover:text-white" />
                          )}
                        </button>
                        
                        {showAdvancedEdit && (
                          <div className="space-y-2 mt-2">
                            {/* 🎨 PHASE 3: CROP TOOL */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <Label className="text-white/80 text-xs">Crop</Label>
                                {cropRegion && (
                                  <button
                                    onClick={resetCrop}
                                    className="text-[10px] text-white/60 hover:text-white transition-colors flex items-center gap-1"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    Reset
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-5 gap-2 mb-2">
                                {CROP_ASPECT_RATIOS.map(ratio => {
                                  const isSelected = cropAspectRatio === ratio.id;
                                  return (
                                    <button
                                      key={ratio.id}
                                      onClick={() => {
                                        applyCropAspectRatio(ratio.id);
                                        if (!showCropMode && !cropRegion) {
                                          setShowCropMode(true);
                                          initializeCropRegion();
                                        }
                                      }}
                                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all active:scale-95 ${
                                        isSelected
                                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-white/40'
                                          : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10 hover:border-white/20'
                                      }`}
                                      title={ratio.name}
                                    >
                                      <Crop className="w-4 h-4" />
                                      <span className="text-[9px]">{ratio.id === 'free' ? 'Free' : ratio.description}</span>
                                    </button>
                                  );
                                })}
                              </div>
                              {!showCropMode && !cropRegion && (
                                <button
                                  onClick={() => {
                                    setShowCropMode(true);
                                    initializeCropRegion();
                                    toast.success('Crop mode enabled');
                                  }}
                                  className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 text-white border border-purple-500/50 hover:border-purple-400/70 transition-all active:scale-95"
                                >
                                  <Crop className="w-4 h-4" />
                                  <span className="text-xs">Enable Crop Mode</span>
                                </button>
                              )}
                              {showCropMode && cropRegion && (
                                <div className="p-2 rounded-lg bg-purple-900/20 border border-purple-500/30">
                                  <p className="text-[10px] text-white/70 text-center">
                                    ✨ Crop region active • Will be applied on save
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            <Separator className="bg-white/10 my-1" />
                            
                            {/* Rotate & Flip Controls */}
                            <div>
                              <Label className="text-white/80 text-xs mb-1 block">Transform</Label>
                              <div className="grid grid-cols-3 gap-2">
                                <button
                                  onClick={() => setRotation((rotation - 90 + 360) % 360)}
                                  className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all active:scale-95"
                                  title="Rotate left 90°"
                                >
                                  <RotateCcw className="w-4 h-4 text-purple-300" />
                                  <span className="text-[10px] text-white/80">Rotate L</span>
                                </button>
                                <button
                                  onClick={() => setRotation((rotation + 90) % 360)}
                                  className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all active:scale-95"
                                  title="Rotate right 90°"
                                >
                                  <RotateCw className="w-4 h-4 text-purple-300" />
                                  <span className="text-[10px] text-white/80">Rotate R</span>
                                </button>
                                <button
                                  onClick={() => setRotation(0)}
                                  className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all active:scale-95"
                                  title="Reset rotation"
                                >
                                  <RotateCcw className="w-4 h-4 text-white/60" />
                                  <span className="text-[10px] text-white/80">Reset</span>
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                <button
                                  onClick={() => setFlipHorizontal(!flipHorizontal)}
                                  className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border transition-all active:scale-95 ${
                                    flipHorizontal
                                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-white/40'
                                      : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10 hover:border-white/20'
                                  }`}
                                >
                                  <FlipHorizontal className="w-4 h-4" />
                                  <span className="text-[10px]">Flip H</span>
                                </button>
                                <button
                                  onClick={() => setFlipVertical(!flipVertical)}
                                  className={`flex items-center justify-center gap-1.5 p-2 rounded-lg border transition-all active:scale-95 ${
                                    flipVertical
                                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-white/40'
                                      : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10 hover:border-white/20'
                                  }`}
                                >
                                  <FlipVertical className="w-4 h-4" />
                                  <span className="text-[10px]">Flip V</span>
                                </button>
                              </div>
                            </div>
                            
                            {/* Brightness Slider */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <Label className="text-white/80 text-[11px]">Brightness</Label>
                                <span className="text-[10px] text-white/60">{brightness}%</span>
                              </div>
                              <Slider
                                value={[brightness]}
                                onValueChange={([value]) => setBrightness(value)}
                                min={0}
                                max={200}
                                step={1}
                                className="w-full"
                              />
                            </div>
                            
                            {/* Contrast Slider */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <Label className="text-white/80 text-[11px]">Contrast</Label>
                                <span className="text-[10px] text-white/60">{contrast}%</span>
                              </div>
                              <Slider
                                value={[contrast]}
                                onValueChange={([value]) => setContrast(value)}
                                min={0}
                                max={200}
                                step={1}
                                className="w-full"
                              />
                            </div>
                            
                            {/* Saturation Slider */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <Label className="text-white/80 text-[11px]">Saturation</Label>
                                <span className="text-[10px] text-white/60">{saturation}%</span>
                              </div>
                              <Slider
                                value={[saturation]}
                                onValueChange={([value]) => setSaturation(value)}
                                min={0}
                                max={200}
                                step={1}
                                className="w-full"
                              />
                            </div>
                            
                            {/* Reset All Button */}
                            <button
                              onClick={() => {
                                setBrightness(100);
                                setContrast(100);
                                setSaturation(100);
                                setRotation(0);
                                setFlipHorizontal(false);
                                setFlipVertical(false);
                                setCropRegion(null);
                                setCropAspectRatio('free');
                                setShowCropMode(false);
                                toast.success('Reset all adjustments');
                              }}
                              className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/80 hover:text-white border border-white/10 hover:border-red-500/50 transition-all active:scale-95"
                            >
                              <RotateCcw className="w-4 h-4" />
                              <span className="text-xs">Reset All Adjustments</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* 🎧 AUDIO TAB - Audio Enhancements */}
              {activeTab === 'audio' && (
                <>
                  {/* 🎠 AUDIO FILTERS */}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Volume2 className="w-4 h-4 text-purple-300" />
                      <Label className="text-white text-xs font-semibold">Audio Filters</Label>
                    </div>
                    {(() => {
                      console.log('🎵 Rendering audio filter section. Current value:', selectedAudioFilter);
                      console.log('🎵 Available filters:', AUDIO_FILTERS.map(f => ({ id: f.id, name: f.name })));
                      return null;
                    })()}
                    
                    {/* Compact Grid */}
                    <div className="grid grid-cols-2 gap-2">
                        {AUDIO_FILTERS.map(filter => {
                          const isSelected = selectedAudioFilter === filter.id;
                          const isProcessing = isPreviewingAudio && selectedAudioFilter === filter.id;
                          
                          return (
                            <button
                              key={filter.id}
                              type="button"
                              disabled={isPreviewingAudio}
                              onClick={async () => {
                                console.log('🔥 ===== FILTER BUTTON CLICKED! =====');
                                console.log('🔥 Filter:', filter.id, filter.name);
                                console.log('🔥 Old value:', selectedAudioFilter);
                                
                                // 🔧 FIX: Save current state to history BEFORE changing audio filter
                                saveToHistory();
                                
                                // Update state first
                                setSelectedAudioFilter(filter.id);
                                console.log('🎵 Audio filter state updated to:', filter.id);
                                
                                // If selecting "none", just reset to original
                                if (filter.id === 'none') {
                                  if (previewAudioUrl) {
                                    URL.revokeObjectURL(previewAudioUrl);
                                  }
                                  setPreviewAudioUrl(null);
                                  toast.info('↩️ Reset to original audio', {
                                    duration: 1500
                                  });
                                  return;
                                }
                                
                                // Auto-preview the filter (real-time!)
                                try {
                                  setIsPreviewingAudio(true);
                                  console.log('🎧 Auto-generating preview for:', filter.name);
                                  
                                  // Clean up previous preview
                                  if (previewAudioUrl) {
                                    URL.revokeObjectURL(previewAudioUrl);
                                  }
                                  
                                  // Generate filtered audio WITH THE NEW FILTER (pass it directly!)
                                  const audioBlob = currentMediaFile.blob || 
                                    (currentMediaFile.url ? await fetch(currentMediaFile.url).then(r => r.blob()) : null);
                                  
                                  if (!audioBlob) {
                                    throw new Error('No audio data available');
                                  }
                                  
                                  // Process with the NEW filter.id (not state!)
                                  const enhancedBlob = await processAudio(audioBlob, filter.id);
                                  const url = URL.createObjectURL(enhancedBlob);
                                  setPreviewAudioUrl(url);
                                  
                                  console.log('🎧 Preview ready! Auto-playing...');
                                  
                                  toast.success(`🎵 "${filter.name}" applied`, {
                                    description: 'Now playing filtered audio',
                                    duration: 2000
                                  });
                                  
                                  // 🏆 Track achievement - Audio filter used
                                  if (session?.access_token) {
                                    trackAction('audio_filter_used', { filterName: filter.id }, session.access_token);
                                  }
                                  
                                } catch (error) {
                                  console.error('Preview error:', error);
                                  toast.error('Failed to apply filter', {
                                    description: 'Please try again'
                                  });
                                } finally {
                                  setIsPreviewingAudio(false);
                                }
                              }}
                              className={`
                                flex flex-col items-center gap-1.5 p-2.5 rounded-lg 
                                transition-all border-2
                                ${isProcessing
                                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 border-blue-400 shadow-lg cursor-wait'
                                  : isSelected 
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-white/40 shadow-lg' 
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                }
                                ${isPreviewingAudio && !isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                              `}
                            >
                            <div className={`text-xs font-semibold text-center ${isSelected || isProcessing ? 'text-white' : 'text-white/90'}`}>
                              {filter.name}
                            </div>
                            <div className={`text-[9px] text-center line-clamp-1 ${isSelected || isProcessing ? 'text-white/70' : 'text-white/50'}`}>
                              {isProcessing ? 'Processing...' : filter.description}
                            </div>
                            {isProcessing ? (
                              <Loader2 className="w-4 h-4 text-white animate-spin mt-1" />
                            ) : isSelected ? (
                              <Volume2 className="w-4 h-4 text-white animate-pulse mt-1" />
                            ) : null}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                  
                  {/* RESET TO ORIGINAL - Only show when preview is active */}
                  {previewAudioUrl && selectedAudioFilter !== 'none' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (previewAudioUrl) {
                          URL.revokeObjectURL(previewAudioUrl);
                        }
                        setPreviewAudioUrl(null);
                        setSelectedAudioFilter('none');
                        toast.info('⏮️ Reset to original audio');
                      }}
                      className="w-full p-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-all flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4 text-white" />
                      <span className="text-white text-sm font-medium">Reset to Original</span>
                    </button>
                  )}

                  <Separator className="bg-white/10 my-1" />

                  {/* REMOVED: Ambient Sounds Section - Coming Soon feature */}
                </>
              )}

              {/* 🌟 OVERLAYS TAB - Text & Stickers */}
              {activeTab === 'overlays' && (
                <>
                  {/* 🎨 TEXT LAYERS SECTION */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Type className="w-4 h-4 text-purple-300" />
                        <Label className="text-white text-xs font-semibold">Text Layers</Label>
                        <Badge className="bg-purple-600/50 text-white text-[9px] border-0">{textLayers.length}</Badge>
                      </div>
                      <button
                        onClick={addTextLayer}
                        className="px-3 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-medium hover:from-purple-700 hover:to-pink-700 transition-all active:scale-95 flex items-center gap-1"
                      >
                        <Type className="w-3 h-3" />
                        Add Text
                      </button>
                    </div>
                    
                    {textLayers.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {textLayers.map(layer => {
                          const isSelected = selectedTextLayerId === layer.id;
                          return (
                            <div
                              key={layer.id}
                              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-purple-600/20 border-purple-500/50'
                                  : 'bg-white/5 border-white/10 hover:bg-white/10'
                              }`}
                              onClick={() => setSelectedTextLayerId(layer.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-xs truncate">{layer.text}</p>
                                  <p className="text-white/50 text-[9px]">{layer.size}px • {TEXT_FONTS.find(f => f.id === layer.font)?.name}</p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteTextLayer(layer.id);
                                  }}
                                  className="ml-2 p-1 rounded bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              
                              {isSelected && (
                                <div 
                                  className="mt-2 pt-2 border-t border-white/10 space-y-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* Text input - ✅ FIX: Clear default text on focus */}
                                  <Input
                                    value={layer.text}
                                    onChange={(e) => updateTextLayer(layer.id, { text: e.target.value })}
                                    onFocus={(e) => {
                                      // Clear the default "Double-click to edit" text when focused
                                      if (layer.text === 'Double-click to edit') {
                                        updateTextLayer(layer.id, { text: '' });
                                      }
                                      e.target.select(); // Select all text for easy replacement
                                    }}
                                    placeholder="Enter your text..."
                                    className="bg-white/10 border-white/20 text-white text-xs h-7"
                                  />
                                  
                                  {/* Font & Size - Native HTML select for reliable functionality */}
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <select
                                        value={layer.font}
                                        onChange={(e) => {
                                          console.log('🎨 Font changed to:', e.target.value, 'for layer:', layer.id);
                                          updateTextLayer(layer.id, { font: e.target.value });
                                        }}
                                        className="w-full bg-white/10 border border-white/20 text-white text-xs h-7 rounded px-2 cursor-pointer hover:bg-white/20 transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          console.log('🖱️ Font select clicked');
                                        }}
                                      >
                                        {TEXT_FONTS.map(font => (
                                          <option key={font.id} value={font.id} className="bg-slate-900 text-white">
                                            {font.name}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    
                                    <div>
                                      <select
                                        value={layer.size.toString()}
                                        onChange={(e) => {
                                          console.log('📏 Size changed to:', e.target.value, 'for layer:', layer.id);
                                          updateTextLayer(layer.id, { size: parseInt(e.target.value) });
                                        }}
                                        className="w-full bg-white/10 border border-white/20 text-white text-xs h-7 rounded px-2 cursor-pointer hover:bg-white/20 transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          console.log('🖱️ Size select clicked');
                                        }}
                                      >
                                        <option value="12" className="bg-slate-900 text-white">12px (Tiny)</option>
                                        <option value="16" className="bg-slate-900 text-white">16px (Small)</option>
                                        <option value="20" className="bg-slate-900 text-white">20px</option>
                                        <option value="24" className="bg-slate-900 text-white">24px</option>
                                        <option value="28" className="bg-slate-900 text-white">28px</option>
                                        <option value="32" className="bg-slate-900 text-white">32px (Default)</option>
                                        <option value="36" className="bg-slate-900 text-white">36px</option>
                                        <option value="40" className="bg-slate-900 text-white">40px</option>
                                        <option value="48" className="bg-slate-900 text-white">48px (Large)</option>
                                        <option value="56" className="bg-slate-900 text-white">56px</option>
                                        <option value="64" className="bg-slate-900 text-white">64px (XL)</option>
                                        <option value="72" className="bg-slate-900 text-white">72px (XXL)</option>
                                        <option value="80" className="bg-slate-900 text-white">80px</option>
                                        <option value="100" className="bg-slate-900 text-white">100px (Huge)</option>
                                      </select>
                                    </div>
                                  </div>
                                  
                                  {/* Color & Rotation */}
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <Label className="text-white/60 text-[9px]">Color</Label>
                                      <Input
                                        type="color"
                                        value={layer.color}
                                        onChange={(e) => updateTextLayer(layer.id, { color: e.target.value })}
                                        className="bg-white/10 border-white/20 h-7 p-1"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-white/60 text-[9px]">Rotate {layer.rotation}°</Label>
                                      <Slider
                                        value={[layer.rotation]}
                                        onValueChange={([value]) => updateTextLayer(layer.id, { rotation: value })}
                                        min={-180}
                                        max={180}
                                        step={15}
                                        className="mt-1"
                                      />
                                    </div>
                                  </div>
                                  
                                  {/* Effects */}
                                  <div className="space-y-1.5">
                                    <div>
                                      <Label className="text-white/60 text-[9px]">Shadow {layer.shadowBlur}px</Label>
                                      <Slider
                                        value={[layer.shadowBlur]}
                                        onValueChange={([value]) => updateTextLayer(layer.id, { shadowBlur: value })}
                                        min={0}
                                        max={20}
                                        step={1}
                                        className="mt-1"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-white/60 text-[9px]">Outline {layer.outlineWidth}px</Label>
                                      <Slider
                                        value={[layer.outlineWidth]}
                                        onValueChange={([value]) => updateTextLayer(layer.id, { outlineWidth: value })}
                                        min={0}
                                        max={5}
                                        step={0.5}
                                        className="mt-1"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  <Separator className="bg-white/10 my-1" />
                  
                  {/* TEXT & DATE SECTION (Legacy single caption) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 mb-2">
                      <Type className="w-4 h-4 text-amber-300" />
                      <Label className="text-white text-sm font-semibold">Simple Caption</Label>
                    </div>
                    
                    {/* Caption and Date Stamp in Same Row */}
                    <div className="flex gap-2">
                      {/* Caption Input - LEFT/FIRST */}
                      <Textarea
                        value={captionText}
                        onChange={(e) => setCaptionText(e.target.value)}
                        placeholder="Add caption..."
                        className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-16 text-xs resize-none"
                      />

                      {/* Date Stamp Toggle with Input - RIGHT/SECOND */}
                      <div className="w-24 space-y-1.5">
                        <button
                          onClick={() => setShowDateStamp(!showDateStamp)}
                          className={`w-full px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all border ${
                            showDateStamp 
                              ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-500' 
                              : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10'
                          }`}
                        >
                          Date Stamp
                        </button>
                        {showDateStamp && (
                          <Input
                            value={dateStampText}
                            onChange={(e) => setDateStampText(e.target.value)}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-xs h-8 w-full"
                            placeholder="Date..."
                          />
                        )}
                      </div>
                    </div>

                    {captionText && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-white text-[10px]">Size: {textSize}px</Label>
                          <Slider
                            value={[textSize]}
                            onValueChange={(value) => setTextSize(value[0])}
                            min={12}
                            max={48}
                            step={2}
                            className="w-full"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-white text-[10px]">Color</Label>
                          <input
                            type="color"
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                            className="w-full h-8 rounded-lg cursor-pointer border-2 border-white/30"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator className="bg-white/10 my-1" />

                  {/* STICKERS SECTION */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Sticker className="w-4 h-4 text-orange-300" />
                        <Label className="text-white text-xs font-semibold">Stickers</Label>
                      </div>
                      {selectedStickers.length > 0 && (
                        <Badge variant="secondary" className="bg-amber-600/80 text-white text-[10px]">
                          {selectedStickers.length}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {ERA_STICKERS.map(sticker => {
                        const Icon = sticker.icon;
                        const count = selectedStickers.filter(s => s.type === sticker.id).length;
                        return (
                          <button
                            type="button"
                            key={sticker.id}
                            onClick={() => addSticker(sticker.id)}
                            className="relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all border bg-white/5 text-white/80 hover:bg-white/10 hover:text-white border-white/10 hover:border-white/20 active:scale-95"
                          >
                            <Icon className={`w-5 h-5 ${sticker.color}`} />
                            <span className="text-[9px] font-medium">{sticker.name}</span>
                            {count > 0 && (
                              <Badge className="absolute -top-1 -right-1 bg-gradient-to-br from-orange-600 to-amber-600 text-white border-0 w-4 h-4 p-0 flex items-center justify-center text-[9px]">
                                {count}
                              </Badge>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Footer Actions - Eras-themed with larger touch targets */}
      <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-3 md:p-2 bg-gradient-to-r from-purple-900/50 via-pink-900/50 to-purple-900/50 backdrop-blur-md border-t-2 border-white/20 shadow-2xl">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="bg-white/5 text-white border-2 border-white/20 hover:bg-white/10 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed text-base md:text-xs h-12 md:h-8 shadow-lg active:scale-95 transition-all"
            title={`Undo (${history.length} changes)`}
          >
            <Undo className="w-5 h-5 md:w-4 md:h-4 mr-2 md:mr-1" />
            Undo
          </Button>

          <Button
            variant="outline"
            onClick={onCancel}
            className="bg-white/5 text-white border-2 border-white/20 hover:bg-white/10 hover:border-white/30 text-base md:text-xs h-12 md:h-8 shadow-lg active:scale-95 transition-all"
          >
            <X className="w-5 h-5 md:w-4 md:h-4 mr-2 md:mr-1" />
            Cancel
          </Button>
        </div>

        <div className="flex gap-2">
          {/* Replace & Save - Only show if media has an original ID from vault */}
          {currentMediaFile.id && onReplaceSave && (
            <button
              onClick={handleReplaceSave}
              disabled={isSaving}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 hover:from-emerald-600 hover:to-teal-700 text-base md:text-xs h-12 md:h-8 shadow-xl active:scale-95 transition-all font-medium rounded-md px-4 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Replace the original file without creating a duplicate"
              type="button"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 md:w-4 md:h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-5 h-5 md:w-4 md:h-4" />
              )}
              <span style={{ 
                whiteSpace: 'nowrap', 
                display: 'inline',
                userSelect: 'none'
              }}>Replace & Save</span>
            </button>
          )}

          <Button
            onClick={handleUseInCapsule}
            disabled={isSaving}
            className="flex-1 sm:flex-none bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 text-base md:text-xs h-12 md:h-8 shadow-xl active:scale-95 transition-all font-medium"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 md:w-4 md:h-4 mr-2 md:mr-1 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 md:w-4 md:h-4 mr-2 md:mr-1" />
            )}
            Use in Capsule
          </Button>
        </div>
      </div>
    </div>
  );
}
