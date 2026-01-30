import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Label } from './ui/label';
import { 
  Sparkles, 
  Palette, 
  Volume2, 
  Scissors, 
  Wand2,
  Download,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Filter,
  Contrast,
  Sun,
  Moon,
  Music,
  Sliders,
  FileText,
  Image,
  Type,
  Layers,
  Clock,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Settings,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Move,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Crop,
  Mic,
  FileVideo,
  FileImage,
  FileAudio,
  Upload,
  RefreshCw,
  Undo,
  Redo,
  Save,
  Share,
  Magic,
  Brush,
  Adjust,
  Lightbulb,
  Blend,
  Focus,
  Vibrate,
  Star,
  Clapperboard,
  Aperture,
  Gauge,
  Flame,
  Snowflake,
  Waves,
  Film,
  Camera,
  PaintBucket,
  PlusCircle,
  Plus,
  Edit3
} from 'lucide-react';
import { DatabaseService } from '../utils/supabase/database';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { MediaThumbnail } from './MediaThumbnail';

// AI Filter Presets
const AI_FILTERS = [
  { id: 'none', name: 'Original', icon: Eye, description: 'No effects applied', category: 'basic' },
  { id: 'enhance', name: 'Auto Enhance', icon: Wand2, description: 'AI-powered smart enhancement', category: 'auto' },
  { id: 'cinematic', name: 'Cinematic', icon: Clapperboard, description: 'Hollywood movie style', category: 'style' },
  { id: 'vintage', name: 'Vintage', icon: Clock, description: 'Classic retro film look', category: 'style' },
  { id: 'vibrant', name: 'Vibrant', icon: Palette, description: 'Enhanced colors and saturation', category: 'color' },
  { id: 'moody', name: 'Moody', icon: Moon, description: 'Dark and atmospheric', category: 'mood' },
  { id: 'warm', name: 'Warm', icon: Sun, description: 'Golden hour warmth', category: 'color' },
  { id: 'cool', name: 'Cool', icon: Snowflake, description: 'Cool blue tones', category: 'color' },
  { id: 'dramatic', name: 'Dramatic', icon: Flame, description: 'High contrast and drama', category: 'mood' },
  { id: 'soft', name: 'Soft', icon: Brush, description: 'Gentle and dreamy', category: 'mood' },
  { id: 'sharp', name: 'Sharp', icon: Focus, description: 'Crystal clear details', category: 'enhance' },
  { id: 'artistic', name: 'Artistic', icon: PaintBucket, description: 'Creative artistic style', category: 'style' },
  { id: 'professional', name: 'Professional', icon: Star, description: 'Corporate clean look', category: 'enhance' },
  { id: 'dreamy', name: 'Dreamy', icon: Waves, description: 'Ethereal and magical', category: 'mood' },
  { id: 'noir', name: 'Film Noir', icon: Film, description: 'Classic black and white', category: 'style' }
];

// Audio Enhancement Options
const AUDIO_ENHANCEMENTS = [
  { id: 'noise_reduction', name: 'Noise Reduction', icon: Volume2, description: 'Remove background noise' },
  { id: 'voice_clarity', name: 'Voice Clarity', icon: Mic, description: 'Enhance voice quality' },
  { id: 'bass_boost', name: 'Bass Boost', icon: Vibrate, description: 'Enhance low frequencies' },
  { id: 'treble_enhance', name: 'Treble Enhance', icon: Music, description: 'Boost high frequencies' },
  { id: 'normalize', name: 'Normalize Audio', icon: Gauge, description: 'Balance audio levels' },
  { id: 'reverb', name: 'Add Reverb', icon: Waves, description: 'Add spatial depth' }
];

// Export Quality Options
const EXPORT_QUALITIES = [
  { id: 'low', name: 'Low (480p)', size: 'Small file size', icon: Minimize },
  { id: 'medium', name: 'Medium (720p)', size: 'Balanced quality', icon: FileText },
  { id: 'high', name: 'High (1080p)', size: 'Best quality', icon: Maximize },
  { id: 'ultra', name: 'Ultra (4K)', size: 'Maximum quality', icon: Star }
];

export function AIEditor({ editingCapsule, onCapsuleSelect, initialMedia, workflowStep, onEnhancementComplete, onWorkInProgressChange }) {
  const [selectedCapsule, setSelectedCapsule] = useState(editingCapsule || null);
  const [userCapsules, setUserCapsules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaFiles, setMediaFiles] = useState([]);
  
  // AI Enhancement States
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [filterStrength, setFilterStrength] = useState([100]);
  const [audioEnhancements, setAudioEnhancements] = useState({});
  const [customSettings, setCustomSettings] = useState({
    brightness: [50],
    contrast: [50],
    saturation: [50],
    warmth: [50],
    sharpness: [50],
    vignette: [0],
    grain: [0],
    blur: [0]
  });
  
  // Text Overlay States
  const [textOverlays, setTextOverlays] = useState([]);
  const [newOverlay, setNewOverlay] = useState({
    text: '',
    style: 'modern',
    color: '#ffffff',
    size: 24,
    position: 'center',
    animation: 'none'
  });
  
  // Export States
  const [exportQuality, setExportQuality] = useState('high');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  // Preview States
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [previewWith, setPreviewWith] = useState('filters');
  
  // History for Undo/Redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Media rename state - inline editing
  const [editingMediaId, setEditingMediaId] = useState(null);
  const [editingFileName, setEditingFileName] = useState('');
  const editInputRef = useRef(null);

  // Initialize workflow media
  useEffect(() => {
    if (initialMedia && workflowStep === 'enhance') {
      // Create a temporary media object for editing
      const tempMedia = {
        id: 'workflow_media',
        file_name: initialMedia.filename || 'recorded-media',
        file_type: initialMedia.type,
        file_size: initialMedia.blob?.size || 0,
        url: initialMedia.blob ? URL.createObjectURL(initialMedia.blob) : null,
        created_at: new Date().toISOString(),
        isWorkflowMedia: true,
        originalBlob: initialMedia.blob
      };
      setSelectedMedia(tempMedia);
      setMediaFiles([tempMedia]);
    }
  }, [initialMedia, workflowStep]);

  // Load user capsules on mount (only if no editing capsule provided)
  useEffect(() => {
    if (!initialMedia && !editingCapsule) {
      loadUserCapsules();
    }
  }, [initialMedia, editingCapsule]);

  // Update selected capsule and load media when editingCapsule changes
  useEffect(() => {
    if (editingCapsule && !initialMedia) {
      console.log('🎯 AIEditor: Loading media for editing capsule:', editingCapsule.id, editingCapsule.title);
      setSelectedCapsule(editingCapsule);
      loadCapsuleMedia(editingCapsule.id);
    }
  }, [editingCapsule, initialMedia]);

  // Work-in-progress detection - notify parent when user has made changes
  useEffect(() => {
    // Detect if user has made any changes/enhancements
    const hasWork = !!(
      selectedFilter !== 'none' ||
      filterStrength[0] !== 100 ||
      Object.keys(audioEnhancements).length > 0 ||
      textOverlays.length > 0 ||
      customSettings.brightness[0] !== 50 ||
      customSettings.contrast[0] !== 50 ||
      customSettings.saturation[0] !== 50 ||
      customSettings.warmth[0] !== 50 ||
      customSettings.sharpness[0] !== 50 ||
      customSettings.vignette[0] !== 0 ||
      customSettings.grain[0] !== 0 ||
      customSettings.blur[0] !== 0 ||
      processing
    );
    
    // Notify parent component about work status
    if (onWorkInProgressChange) {
      onWorkInProgressChange(hasWork);
    }
  }, [selectedFilter, filterStrength, audioEnhancements, textOverlays, customSettings, processing, onWorkInProgressChange]);

  const loadUserCapsules = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const result = await DatabaseService.getUserTimeCapsules(user.id);
        const capsules = result.capsules || result;
        setUserCapsules(capsules);
        
        // Show breakdown by status
        const scheduled = capsules.filter(c => c.status === 'scheduled').length;
        const delivered = capsules.filter(c => c.status === 'delivered').length;
        const drafts = capsules.filter(c => c.status === 'draft').length;
        
        toast.success(
          `Loaded ${capsules.length} capsule${capsules.length !== 1 ? 's' : ''} ` +
          `(${scheduled} scheduled, ${delivered} delivered, ${drafts} drafts)`
        );
      } else {
        toast.error('Please sign in to load capsules');
      }
    } catch (error) {
      console.error('Error loading capsules:', error);
      toast.error('Failed to load capsules. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadCapsuleMedia = async (capsuleId) => {
    try {
      setLoading(true);
      console.log('🎬 Loading media for capsule:', capsuleId);
      const media = await DatabaseService.getCapsuleMediaFiles(capsuleId);
      console.log('📂 Media files loaded:', media.length, 'files');
      console.log('📋 Media file details:', media);
      setMediaFiles(media);
      if (media.length > 0) {
        setSelectedMedia(media[0]);
        console.log('✅ Selected first media file:', media[0].file_name);
        toast.success(`Loaded ${media.length} media file${media.length !== 1 ? 's' : ''}`);
      } else {
        console.warn('⚠️ No media files found for capsule:', capsuleId);
        toast.warning('No media files found. Try clicking "Repair Media Links" below.', {
          duration: 5000
        });
      }
    } catch (error) {
      console.error('❌ Error loading media:', error);
      toast.error('Failed to load media files: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCapsuleSelect = (capsuleId) => {
    const capsule = userCapsules.find(c => c.id === capsuleId);
    if (capsule) {
      setSelectedCapsule(capsule);
      loadCapsuleMedia(capsule.id);
      if (onCapsuleSelect) {
        onCapsuleSelect(capsule);
      }
    }
  };

  // Generate CSS filter style from current settings
  const getFilterStyle = () => {
    if (!selectedMedia || !isPreviewMode) return {};
    
    const strength = filterStrength[0] / 100;
    const settings = customSettings;
    
    // Base adjustments from manual settings
    const brightness = ((settings.brightness[0] - 50) / 50) * 0.5 + 1; // 0.5 to 1.5
    const contrast = ((settings.contrast[0] - 50) / 50) * 0.5 + 1; // 0.5 to 1.5
    const saturation = ((settings.saturation[0] - 50) / 50) * 0.5 + 1; // 0.5 to 1.5
    const blur = (settings.blur[0] / 100) * 10; // 0 to 10px
    
    let filterString = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`;
    
    // Add blur if set
    if (blur > 0) {
      filterString += ` blur(${blur}px)`;
    }
    
    // Apply preset filter effects
    switch (selectedFilter) {
      case 'enhance':
        filterString += ` contrast(${1.1 * strength}) saturate(${1.2 * strength})`;
        break;
      case 'cinematic':
        filterString += ` contrast(${1.2 * strength}) saturate(${0.9 * strength}) sepia(${0.1 * strength})`;
        break;
      case 'vintage':
        filterString += ` sepia(${0.5 * strength}) contrast(${0.9 * strength}) brightness(${1.1 * strength})`;
        break;
      case 'vibrant':
        filterString += ` saturate(${1.5 * strength}) contrast(${1.1 * strength}) brightness(${1.05 * strength})`;
        break;
      case 'moody':
        filterString += ` brightness(${0.8 * strength}) contrast(${1.3 * strength}) saturate(${0.8 * strength})`;
        break;
      case 'warm':
        filterString += ` sepia(${0.2 * strength}) saturate(${1.2 * strength}) brightness(${1.05 * strength}) hue-rotate(${-10 * strength}deg)`;
        break;
      case 'cool':
        filterString += ` saturate(${1.1 * strength}) brightness(${1.05 * strength}) hue-rotate(${10 * strength}deg)`;
        break;
      case 'dramatic':
        filterString += ` contrast(${1.5 * strength}) brightness(${0.95 * strength}) saturate(${0.9 * strength})`;
        break;
      case 'soft':
        filterString += ` contrast(${0.9 * strength}) brightness(${1.1 * strength}) blur(${0.5 * strength}px)`;
        break;
      case 'sharp':
        filterString += ` contrast(${1.2 * strength}) brightness(${1.05 * strength})`;
        break;
      case 'blackwhite':
        filterString += ` grayscale(${1 * strength}) contrast(${1.1 * strength})`;
        break;
      case 'neon':
        filterString += ` saturate(${2 * strength}) contrast(${1.3 * strength}) brightness(${1.2 * strength})`;
        break;
    }
    
    // Add custom adjustments
    const warmth = ((settings.warmth[0] - 50) / 50) * 20; // -20 to +20 degrees
    if (warmth !== 0) {
      filterString += ` hue-rotate(${-warmth}deg)`;
    }
    
    const sharpness = ((settings.sharpness[0] - 50) / 50) * 0.2 + 1; // 0.8 to 1.2
    if (sharpness !== 1) {
      filterString += ` contrast(${sharpness})`;
    }
    
    // Add vignette effect (simulated with box-shadow)
    const vignetteStyle = {};
    if (settings.vignette[0] > 0) {
      const vignetteStrength = settings.vignette[0] / 100;
      vignetteStyle.boxShadow = `inset 0 0 ${100 * vignetteStrength}px ${50 * vignetteStrength}px rgba(0,0,0,${0.5 * vignetteStrength})`;
    }
    
    return {
      filter: filterString,
      ...vignetteStyle
    };
  };

  const applyFilter = async (filterId) => {
    if (!selectedMedia) return;
    
    // Immediate preview - no processing
    saveToHistory();
    setSelectedFilter(filterId);
    
    // Show instant feedback
    toast.success(`${AI_FILTERS.find(f => f.id === filterId)?.name || 'Filter'} applied`, {
      duration: 1500
    });
    
    return; // Skip processing - real-time CSS preview is enough
    
    setProcessing(true);
    try {
      // Save current state to history
      saveToHistory();
      
      setSelectedFilter(filterId);
      
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success(`${AI_FILTERS.find(f => f.id === filterId)?.name} filter applied!`);
    } catch (error) {
      console.error('Error applying filter:', error);
      toast.error('Failed to apply filter');
    } finally {
      setProcessing(false);
    }
  };

  const applyAudioEnhancement = async (enhancementId) => {
    if (!selectedMedia || !selectedMedia.file_type.startsWith('audio/') && !selectedMedia.file_type.startsWith('video/')) {
      toast.error('Audio enhancement is only available for audio and capsule files');
      return;
    }
    
    setProcessing(true);
    try {
      saveToHistory();
      
      setAudioEnhancements(prev => ({
        ...prev,
        [enhancementId]: !prev[enhancementId]
      }));
      
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const enhancement = AUDIO_ENHANCEMENTS.find(e => e.id === enhancementId);
      toast.success(`${enhancement?.name} ${audioEnhancements[enhancementId] ? 'removed' : 'applied'}!`);
    } catch (error) {
      console.error('Error applying audio enhancement:', error);
      toast.error('Failed to apply audio enhancement');
    } finally {
      setProcessing(false);
    }
  };

  const autoEnhance = async () => {
    if (!selectedMedia) return;
    
    setProcessing(true);
    try {
      saveToHistory();
      
      // Simulate AI auto-enhancement
      setSelectedFilter('enhance');
      setCustomSettings({
        brightness: [60],
        contrast: [65],
        saturation: [70],
        warmth: [55],
        sharpness: [75],
        vignette: [15],
        grain: [5],
        blur: [0]
      });
      
      // Apply relevant audio enhancements for capsule/audio files
      if (selectedMedia.file_type.startsWith('video/') || selectedMedia.file_type.startsWith('audio/')) {
        setAudioEnhancements({
          noise_reduction: true,
          voice_clarity: true,
          normalize: true
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast.success('🎉 Auto-enhancement complete! Your media has been optimized.');
    } catch (error) {
      console.error('Error in auto-enhancement:', error);
      toast.error('Failed to auto-enhance');
    } finally {
      setProcessing(false);
    }
  };

  const addTextOverlay = () => {
    if (!newOverlay.text.trim()) {
      toast.error('Please enter text for the overlay');
      return;
    }
    
    saveToHistory();
    
    const overlay = {
      id: Date.now(),
      ...newOverlay,
      timestamp: Date.now()
    };
    
    setTextOverlays(prev => [...prev, overlay]);
    setNewOverlay({
      text: '',
      style: 'modern',
      color: '#ffffff',
      size: 24,
      position: 'center',
      animation: 'none'
    });
    
    toast.success('Text overlay added!');
  };

  const removeTextOverlay = (overlayId) => {
    saveToHistory();
    setTextOverlays(prev => prev.filter(o => o.id !== overlayId));
    toast.success('Text overlay removed');
  };

  const exportMedia = async () => {
    if (!selectedMedia) return;
    
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      // Simulate export progress
      for (let i = 0; i <= 100; i += 10) {
        setExportProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      const quality = EXPORT_QUALITIES.find(q => q.id === exportQuality);
      
      // If this is workflow media, complete the enhancement workflow
      if (selectedMedia.isWorkflowMedia && onEnhancementComplete) {
        const enhancedMedia = {
          ...selectedMedia,
          // Add enhancement metadata
          enhancements: {
            filter: selectedFilter,
            filterStrength: filterStrength[0],
            audioEnhancements,
            customSettings,
            textOverlays,
            exportQuality
          },
          isEnhanced: true
        };
        
        toast.success(`🎉 Media enhanced successfully! Proceeding to create capsule...`);
        onEnhancementComplete(enhancedMedia);
        return;
      }
      
      toast.success(`🎉 Media exported successfully in ${quality?.name} quality!`);
      
    } catch (error) {
      console.error('Error exporting media:', error);
      toast.error('Failed to export media');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const saveToHistory = () => {
    const state = {
      filter: selectedFilter,
      filterStrength: [...filterStrength],
      audioEnhancements: { ...audioEnhancements },
      customSettings: { ...customSettings },
      textOverlays: [...textOverlays],
      timestamp: Date.now()
    };
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(state);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      
      setSelectedFilter(state.filter);
      setFilterStrength(state.filterStrength);
      setAudioEnhancements(state.audioEnhancements);
      setCustomSettings(state.customSettings);
      setTextOverlays(state.textOverlays);
      setHistoryIndex(newIndex);
      
      toast.success('Undone');
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      
      setSelectedFilter(state.filter);
      setFilterStrength(state.filterStrength);
      setAudioEnhancements(state.audioEnhancements);
      setCustomSettings(state.customSettings);
      setTextOverlays(state.textOverlays);
      setHistoryIndex(newIndex);
      
      toast.success('Redone');
    }
  };

  const resetAll = () => {
    saveToHistory();
    
    setSelectedFilter('none');
    setFilterStrength([100]);
    setAudioEnhancements({});
    setCustomSettings({
      brightness: [50],
      contrast: [50],
      saturation: [50],
      warmth: [50],
      sharpness: [50],
      vignette: [0],
      grain: [0],
      blur: [0]
    });
    setTextOverlays([]);
    
    toast.success('All effects reset');
  };

  const togglePreview = () => {
    setIsPreviewMode(!isPreviewMode);
    toast.success(isPreviewMode ? 'Preview disabled' : 'Preview mode enabled');
  };

  // Handle inline rename - start editing
  const startRenaming = (media) => {
    const currentName = media.file_name || 'Untitled';
    // Remove file extension for editing
    const nameWithoutExt = currentName.replace(/\.[^/.]+$/, '');
    
    setEditingMediaId(media.id);
    setEditingFileName(nameWithoutExt);
    
    // Focus the input after state updates
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
      }
    }, 50);
  };

  // Cancel inline rename
  const cancelRenaming = () => {
    setEditingMediaId(null);
    setEditingFileName('');
  };

  // Save inline rename
  const saveInlineRename = async (media) => {
    if (!editingFileName.trim()) {
      toast.error('Please enter a valid name');
      return;
    }
    
    try {
      const fileExt = (media.file_name || '').split('.').pop();
      const newFileName = `${editingFileName.trim()}.${fileExt}`;
      
      // Don't save if name hasn't changed
      if (newFileName === media.file_name) {
        cancelRenaming();
        return;
      }
      
      // Update in database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to rename media');
        cancelRenaming();
        return;
      }

      // Get access token for authenticated request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/media/${media.id}/rename`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            userId: user.id,
            newFileName: newFileName
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to rename media');
      }

      // Update local state
      const updatedFiles = mediaFiles.map(f => 
        f.id === media.id ? { ...f, file_name: newFileName } : f
      );
      setMediaFiles(updatedFiles);
      
      // Update selected media if it's the one being renamed
      if (selectedMedia?.id === media.id) {
        setSelectedMedia({
          ...selectedMedia,
          file_name: newFileName
        });
      }
      
      setEditingMediaId(null);
      setEditingFileName('');
      toast.success('Media renamed successfully');
    } catch (error) {
      console.error('Error renaming media:', error);
      toast.error('Failed to rename media: ' + error.message);
      cancelRenaming();
    }
  };

  const groupedFilters = AI_FILTERS.reduce((acc, filter) => {
    if (!acc[filter.category]) acc[filter.category] = [];
    acc[filter.category].push(filter);
    return acc;
  }, {});

  if (!selectedCapsule) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">AI-Powered Media Editor</h2>
                <p className="text-muted-foreground mb-4">
                  Select a time capsule to enhance your capsules, audio, and images with professional AI tools
                </p>
              </div>
              
              {userCapsules.length > 0 ? (
                <div className="w-full max-w-md">
                  <Label className="text-sm font-medium mb-2 block">Select a Time Capsule</Label>
                  <Select onValueChange={handleCapsuleSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a capsule to edit..." />
                    </SelectTrigger>
                    <SelectContent>
                      {userCapsules.map((capsule) => (
                        <SelectItem key={capsule.id} value={capsule.id}>
                          <div className="flex items-center justify-between gap-3 w-full">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <FileText className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{capsule.title}</span>
                            </div>
                            <Badge 
                              variant={
                                capsule.status === 'scheduled' ? 'default' : 
                                capsule.status === 'delivered' ? 'secondary' : 
                                'outline'
                              }
                              className="flex-shrink-0 text-xs"
                            >
                              {capsule.status === 'scheduled' && '📅 Scheduled'}
                              {capsule.status === 'delivered' && '✅ Delivered'}
                              {capsule.status === 'draft' && '📝 Draft'}
                              {!capsule.status && '📦 Capsule'}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    💡 You can enhance media from any capsule, including scheduled ones
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">No time capsules found</p>
                  <Button 
                    variant="outline" 
                    onClick={loadUserCapsules}
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Loading...' : 'Refresh'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">AI Media Editor</h1>
                <p className="text-muted-foreground">
                  Editing: <span className="font-medium">{selectedCapsule.title}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
                <Undo className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
                <Redo className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={togglePreview}>
                {isPreviewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {isPreviewMode ? 'Disable Preview' : 'Preview'}
              </Button>
              <Button variant="outline" size="sm" onClick={resetAll}>
                <RotateCcw className="w-4 h-4" />
                Reset All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Media Files Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layers className="w-5 h-5" />
                Media Files
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="text-center py-4">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading media...</p>
                </div>
              ) : mediaFiles.length > 0 ? (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {mediaFiles.map((media, index) => {
                      const isEditing = editingMediaId === media.id;
                      const fileExt = (media.file_name || '').split('.').pop();
                      
                      return (
                        <div
                          key={media.id}
                          className={`group relative p-3 rounded-lg transition-colors ${
                            selectedMedia?.id === media.id
                              ? 'bg-primary/10 border border-primary/20'
                              : 'bg-muted hover:bg-muted/80'
                          } ${!isEditing ? 'cursor-pointer' : ''}`}
                          onClick={() => !isEditing && setSelectedMedia(media)}
                        >
                          <div className="flex items-center gap-3">
                            <MediaThumbnail 
                              mediaFile={media}
                              size="sm"
                              showOverlay={false}
                            />
                            <div className="flex-1 min-w-0">
                              {isEditing ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    ref={editInputRef}
                                    type="text"
                                    value={editingFileName}
                                    onChange={(e) => setEditingFileName(e.target.value)}
                                    onBlur={() => saveInlineRename(media)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        saveInlineRename(media);
                                      } else if (e.key === 'Escape') {
                                        cancelRenaming();
                                      }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-sm font-medium bg-background border border-primary rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-primary/50 flex-1 min-w-0"
                                    placeholder="Enter file name"
                                  />
                                  <span className="text-xs text-muted-foreground">.{fileExt}</span>
                                </div>
                              ) : (
                                <p 
                                  className="text-sm font-medium truncate hover:text-primary transition-colors cursor-text"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startRenaming(media);
                                  }}
                                  title="Click to rename"
                                >
                                  {media.file_name}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {media.file_type.split('/')[0]}
                              </p>
                            </div>
                            
                            {/* Rename hint icon - only show when not editing */}
                            {!isEditing && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startRenaming(media);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-md"
                                title="Click filename to rename"
                              >
                                <Edit3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-4">
                  <FileVideo className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No media files found</p>
                  {selectedCapsule && (
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={async () => {
                          try {
                            setLoading(true);
                            console.log('🔧 Attempting to repair media associations...');
                            
                            // Get access token for authenticated request
                            const { data: { session } } = await supabase.auth.getSession();
                            if (!session?.access_token) {
                              throw new Error('Authentication required');
                            }
                            
                            const response = await fetch(
                              `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/repair/capsule/${selectedCapsule.id}`,
                              {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${session.access_token}`,
                                },
                              }
                            );
                            
                            const result = await response.json();
                            console.log('🔧 Repair result:', result);
                            
                            if (result.success) {
                              toast.success(`Repaired! Found ${result.after.total_media_files} media file(s)`);
                              // Reload media
                              await loadCapsuleMedia(selectedCapsule.id);
                            } else {
                              toast.error('Repair failed: ' + (result.error || 'Unknown error'));
                            }
                          } catch (error) {
                            console.error('❌ Repair failed:', error);
                            toast.error('Repair failed: ' + error.message);
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Repairing...' : 'Repair Media Links'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            // Get access token for authenticated request
                            const { data: { session } } = await supabase.auth.getSession();
                            if (!session?.access_token) {
                              throw new Error('Authentication required');
                            }

                            const response = await fetch(
                              `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/debug/capsule/${selectedCapsule.id}`,
                              {
                                headers: {
                                  'Authorization': `Bearer ${session.access_token}`,
                                },
                              }
                            );
                            const debug = await response.json();
                            console.log('🔍 Debug info for capsule:', debug);
                            toast.info('Debug info logged to console');
                          } catch (error) {
                            console.error('Debug failed:', error);
                            toast.error('Debug failed');
                          }
                        }}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Debug Info
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                onClick={autoEnhance} 
                disabled={!selectedMedia || processing}
                className="w-full justify-start"
                variant="outline"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Auto Enhance
              </Button>
              <Button 
                onClick={() => applyFilter('cinematic')} 
                disabled={!selectedMedia || processing}
                className="w-full justify-start"
                variant="outline"
              >
                <Clapperboard className="w-4 h-4 mr-2" />
                Make Cinematic
              </Button>
              <Button 
                onClick={() => applyFilter('vibrant')} 
                disabled={!selectedMedia || processing}
                className="w-full justify-start"
                variant="outline"
              >
                <Palette className="w-4 h-4 mr-2" />
                Enhance Colors
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Editor Panel */}
        <div className="lg:col-span-3 space-y-4">
          {/* Real-Time Media Preview */}
          {selectedMedia && (
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Eye className="w-5 h-5" />
                    Live Preview
                    {isPreviewMode && (
                      <Badge variant="secondary" className="ml-2">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Real-Time
                      </Badge>
                    )}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative bg-black/5 dark:bg-black/20 rounded-lg overflow-hidden">
                  {selectedMedia.file_type.startsWith('image/') && (
                    <img
                      src={selectedMedia.url}
                      alt={selectedMedia.file_name}
                      className="w-full max-h-[500px] object-contain mx-auto transition-all duration-300"
                      style={getFilterStyle()}
                    />
                  )}
                  {selectedMedia.file_type.startsWith('video/') && (
                    <video
                      src={selectedMedia.url}
                      controls
                      className="w-full max-h-[500px] object-contain mx-auto transition-all duration-300"
                      style={getFilterStyle()}
                    />
                  )}
                  {selectedMedia.file_type.startsWith('audio/') && (
                    <div className="p-12 text-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Volume2 className="w-12 h-12 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="font-medium mb-2">{selectedMedia.file_name}</h3>
                      <audio src={selectedMedia.url} controls className="mx-auto mt-4" />
                      <p className="text-sm text-muted-foreground mt-4">
                        Audio filters will be applied during export
                      </p>
                    </div>
                  )}
                  
                  {/* Preview Mode Indicator */}
                  {!isPreviewMode && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                      <div className="bg-white/90 dark:bg-gray-900/90 px-6 py-3 rounded-lg">
                        <p className="text-sm font-medium">Click "Enable Preview" to see real-time effects</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Active Filter Badge */}
                  {isPreviewMode && selectedFilter !== 'none' && (
                    <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      <Sparkles className="w-3 h-3" />
                      {AI_FILTERS.find(f => f.id === selectedFilter)?.name}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardContent className="p-6">
              {selectedMedia ? (
                <Tabs defaultValue="filters" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="filters">
                      <Filter className="w-4 h-4 mr-2" />
                      AI Filters
                    </TabsTrigger>
                    <TabsTrigger value="audio">
                      <Volume2 className="w-4 h-4 mr-2" />
                      Audio
                    </TabsTrigger>
                    <TabsTrigger value="adjust">
                      <Sliders className="w-4 h-4 mr-2" />
                      Adjust
                    </TabsTrigger>
                    <TabsTrigger value="text">
                      <Type className="w-4 h-4 mr-2" />
                      Text
                    </TabsTrigger>
                    <TabsTrigger value="export">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </TabsTrigger>
                  </TabsList>

                  {/* AI Filters Tab */}
                  <TabsContent value="filters" className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Professional AI Filters</h3>
                        <Badge variant={selectedFilter !== 'none' ? 'default' : 'secondary'}>
                          {selectedFilter !== 'none' ? 'Filter Applied' : 'No Filter'}
                        </Badge>
                      </div>

                      {Object.entries(groupedFilters).map(([category, filters]) => (
                        <div key={category} className="mb-6">
                          <h4 className="text-sm font-medium text-muted-foreground mb-3 capitalize">
                            {category.replace('_', ' ')} Filters
                          </h4>
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filters.map((filter) => {
                              const Icon = filter.icon;
                              return (
                                <Button
                                  key={filter.id}
                                  variant={selectedFilter === filter.id ? 'default' : 'outline'}
                                  className="h-auto p-4 flex flex-col items-center gap-2"
                                  onClick={() => applyFilter(filter.id)}
                                  disabled={processing}
                                >
                                  <Icon className="w-6 h-6" />
                                  <div className="text-center">
                                    <div className="font-medium">{filter.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {filter.description}
                                    </div>
                                  </div>
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {selectedFilter !== 'none' && (
                        <div className="space-y-4 p-4 bg-muted rounded-lg">
                          <div className="flex items-center justify-between">
                            <Label>Filter Strength</Label>
                            <span className="text-sm text-muted-foreground">{filterStrength[0]}%</span>
                          </div>
                          <Slider
                            value={filterStrength}
                            onValueChange={setFilterStrength}
                            max={150}
                            min={0}
                            step={5}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Audio Enhancement Tab */}
                  <TabsContent value="audio" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Audio Enhancement</h3>
                      
                      {selectedMedia?.file_type.startsWith('audio/') || selectedMedia?.file_type.startsWith('video/') ? (
                        <div className="grid sm:grid-cols-2 gap-4">
                          {AUDIO_ENHANCEMENTS.map((enhancement) => {
                            const Icon = enhancement.icon;
                            const isActive = audioEnhancements[enhancement.id];
                            
                            return (
                              <Card
                                key={enhancement.id}
                                className={`cursor-pointer transition-colors ${
                                  isActive ? 'bg-primary/5 border-primary/20' : ''
                                }`}
                                onClick={() => applyAudioEnhancement(enhancement.id)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${
                                      isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                    }`}>
                                      <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <h4 className="font-medium">{enhancement.name}</h4>
                                        <Switch 
                                          checked={isActive} 
                                          disabled={processing}
                                        />
                                      </div>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {enhancement.description}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <h4 className="font-medium mb-2">Audio enhancement not available</h4>
                          <p className="text-sm text-muted-foreground">
                            Select an audio or capsule file to access audio enhancement tools
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Manual Adjustments Tab */}
                  <TabsContent value="adjust" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Manual Adjustments</h3>
                      
                      <div className="grid sm:grid-cols-2 gap-6">
                        {Object.entries(customSettings).map(([setting, value]) => (
                          <div key={setting} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="capitalize">{setting.replace('_', ' ')}</Label>
                              <span className="text-sm text-muted-foreground">{value[0]}%</span>
                            </div>
                            <Slider
                              value={value}
                              onValueChange={(newValue) => {
                                setCustomSettings(prev => ({
                                  ...prev,
                                  [setting]: newValue
                                }));
                              }}
                              max={100}
                              min={0}
                              step={1}
                              className="w-full"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Text Overlays Tab */}
                  <TabsContent value="text" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Text Overlays</h3>
                      
                      {/* Add New Text Overlay */}
                      <Card className="mb-6">
                        <CardHeader>
                          <CardTitle className="text-base">Add Text Overlay</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Text</Label>
                              <Input
                                placeholder="Enter your text..."
                                value={newOverlay.text}
                                onChange={(e) => setNewOverlay(prev => ({ ...prev, text: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Style</Label>
                              <Select
                                value={newOverlay.style}
                                onValueChange={(value) => setNewOverlay(prev => ({ ...prev, style: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="modern">Modern</SelectItem>
                                  <SelectItem value="classic">Classic</SelectItem>
                                  <SelectItem value="bold">Bold</SelectItem>
                                  <SelectItem value="elegant">Elegant</SelectItem>
                                  <SelectItem value="playful">Playful</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Position</Label>
                              <Select
                                value={newOverlay.position}
                                onValueChange={(value) => setNewOverlay(prev => ({ ...prev, position: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="top">Top</SelectItem>
                                  <SelectItem value="center">Center</SelectItem>
                                  <SelectItem value="bottom">Bottom</SelectItem>
                                  <SelectItem value="top-left">Top Left</SelectItem>
                                  <SelectItem value="top-right">Top Right</SelectItem>
                                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Animation</Label>
                              <Select
                                value={newOverlay.animation}
                                onValueChange={(value) => setNewOverlay(prev => ({ ...prev, animation: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  <SelectItem value="fade-in">Fade In</SelectItem>
                                  <SelectItem value="slide-up">Slide Up</SelectItem>
                                  <SelectItem value="bounce">Bounce</SelectItem>
                                  <SelectItem value="typewriter">Typewriter</SelectItem>
                                  <SelectItem value="glow">Glow</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <Button onClick={addTextOverlay} className="w-full">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Text Overlay
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Existing Overlays */}
                      {textOverlays.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium">Active Overlays</h4>
                          {textOverlays.map((overlay) => (
                            <Card key={overlay.id}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium">{overlay.text}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {overlay.style} • {overlay.position} • {overlay.animation}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeTextOverlay(overlay.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Export Tab */}
                  <TabsContent value="export" className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Export Media</h3>
                      
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-medium mb-3">Export Quality</h4>
                          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {EXPORT_QUALITIES.map((quality) => {
                              const Icon = quality.icon;
                              return (
                                <Button
                                  key={quality.id}
                                  variant={exportQuality === quality.id ? 'default' : 'outline'}
                                  className="h-auto p-4 flex flex-col items-center gap-2"
                                  onClick={() => setExportQuality(quality.id)}
                                >
                                  <Icon className="w-5 h-5" />
                                  <div className="text-center">
                                    <div className="font-medium text-sm">{quality.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {quality.size}
                                    </div>
                                  </div>
                                </Button>
                              );
                            })}
                          </div>
                        </div>

                        {isExporting && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>Export Progress</Label>
                              <span className="text-sm text-muted-foreground">{exportProgress}%</span>
                            </div>
                            <Progress value={exportProgress} className="w-full" />
                          </div>
                        )}

                        <Button 
                          onClick={exportMedia} 
                          disabled={isExporting || !selectedMedia}
                          className={`w-full h-12 ${
                            selectedMedia?.isWorkflowMedia 
                              ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' 
                              : ''
                          }`}
                        >
                          {isExporting ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              {selectedMedia?.isWorkflowMedia ? 'Finalizing...' : 'Exporting...'}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {selectedMedia?.isWorkflowMedia ? (
                                <>
                                  <PlusCircle className="w-5 h-5" />
                                  Continue to Create Capsule
                                </>
                              ) : (
                                <>
                                  <Download className="w-5 h-5" />
                                  Export Enhanced Media
                                </>
                              )}
                            </div>
                          )}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Media Selected</h3>
                  <p className="text-muted-foreground">
                    Select a media file from the left panel to start editing
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Processing Overlay */}
      {processing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Processing with AI</h3>
            <p className="text-sm text-muted-foreground">
              Applying enhancements to your media...
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}