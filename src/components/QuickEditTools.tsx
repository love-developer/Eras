import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { 
  Scissors, 
  RotateCw, 
  FlipHorizontal,
  FlipVertical,
  Crop,
  Palette,
  Type,
  Sparkles,
  Download,
  Save,
  RotateCcw,
  Sun,
  Contrast,
  Volume2,
  VolumeX,
  Zap,
  Filter,
  Image,
  Video,
  Mic,
  Edit3,
  Wand2,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';

const QUICK_ENHANCEMENTS = {
  video: [
    { id: 'stabilize', name: 'Stabilize', icon: Sparkles, description: 'Reduce camera shake' },
    { id: 'brighten', name: 'Auto Brighten', icon: Sun, description: 'Optimize lighting' },
    { id: 'enhance', name: 'Smart Enhance', icon: Wand2, description: 'AI enhancement' },
    { id: 'noise', name: 'Reduce Noise', icon: Filter, description: 'Clean up video' }
  ],
  audio: [
    { id: 'denoise', name: 'Remove Noise', icon: Volume2, description: 'Clean background noise' },
    { id: 'normalize', name: 'Normalize', icon: Settings, description: 'Balance audio levels' },
    { id: 'enhance', name: 'Voice Enhance', icon: Mic, description: 'Improve voice clarity' },
    { id: 'bass', name: 'Bass Boost', icon: Sparkles, description: 'Enhance low frequencies' }
  ],
  photo: [
    { id: 'auto', name: 'Auto Enhance', icon: Sparkles, description: 'Smart corrections' },
    { id: 'portrait', name: 'Portrait Mode', icon: Eye, description: 'Background blur' },
    { id: 'hdr', name: 'HDR Effect', icon: Sun, description: 'High dynamic range' },
    { id: 'sharpen', name: 'Sharpen', icon: Filter, description: 'Improve clarity' }
  ]
};

const TEXT_STYLES = [
  { id: 'modern', name: 'Modern', preview: 'Clean and minimal' },
  { id: 'bold', name: 'Bold', preview: 'Strong impact' },
  { id: 'elegant', name: 'Elegant', preview: 'Sophisticated' },
  { id: 'playful', name: 'Playful', preview: 'Fun and casual' },
  { id: 'vintage', name: 'Vintage', preview: 'Classic style' },
  { id: 'neon', name: 'Neon', preview: 'Glowing effect' }
];

export function QuickEditTools({ media, mediaType, onSave, onRetake, isFullscreen }) {
  console.log('🎨 QuickEditTools rendered with:', { 
    hasMedia: !!media, 
    mediaType, 
    isFullscreen,
    mediaUrl: media?.url
  });
  
  const [editSettings, setEditSettings] = useState({
    brightness: [50],
    contrast: [50],
    saturation: [50],
    warmth: [50],
    sharpness: [50],
    volume: [50],
    rotation: [0],
    flipH: false,
    flipV: false
  });
  
  const [textOverlays, setTextOverlays] = useState([]);
  const [selectedEnhancements, setSelectedEnhancements] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [newTextOverlay, setNewTextOverlay] = useState({
    text: '',
    style: 'modern',
    color: '#ffffff',
    size: 24,
    x: 50,
    y: 50
  });
  
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const previewRef = useRef(null);

  useEffect(() => {
    if (media && showPreview) {
      generatePreview();
    }
  }, [media, editSettings, textOverlays, showPreview]);

  const generatePreview = () => {
    if (!media || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (mediaType === 'photo') {
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Apply transformations
        ctx.save();
        
        // Apply rotation
        const rotation = editSettings.rotation[0];
        if (rotation !== 0) {
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.translate(-canvas.width / 2, -canvas.height / 2);
        }
        
        // Apply flips
        if (editSettings.flipH || editSettings.flipV) {
          ctx.scale(editSettings.flipH ? -1 : 1, editSettings.flipV ? -1 : 1);
          if (editSettings.flipH) ctx.translate(-canvas.width, 0);
          if (editSettings.flipV) ctx.translate(0, -canvas.height);
        }
        
        // Apply filters
        ctx.filter = getFilterString();
        
        // Draw image
        ctx.drawImage(img, 0, 0);
        
        ctx.restore();
        
        // Draw text overlays
        drawTextOverlays(ctx);
      };
      img.src = media.url;
    }
  };

  const getFilterString = () => {
    const brightness = editSettings.brightness[0];
    const contrast = editSettings.contrast[0];
    const saturation = editSettings.saturation[0];
    const warmth = editSettings.warmth[0];
    const sharpness = editSettings.sharpness[0];
    
    let filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    
    // Add warmth (sepia + hue rotation)
    if (warmth !== 50) {
      const warmthAmount = ((warmth - 50) / 50) * 20;
      filter += ` sepia(${Math.abs(warmthAmount)}%) hue-rotate(${warmthAmount}deg)`;
    }
    
    // Add sharpness (contrast adjustment)
    if (sharpness !== 50) {
      const sharpnessAmount = 100 + ((sharpness - 50) / 50) * 50;
      filter += ` contrast(${sharpnessAmount}%)`;
    }
    
    return filter;
  };

  const drawTextOverlays = (ctx) => {
    textOverlays.forEach(overlay => {
      ctx.save();
      
      // Set text properties
      const fontSize = overlay.size || 24;
      ctx.font = `${fontSize}px ${getTextStyleFont(overlay.style)}`;
      ctx.fillStyle = overlay.color || '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Apply text style effects
      applyTextStyleEffects(ctx, overlay.style);
      
      // Calculate position
      const x = (overlay.x / 100) * ctx.canvas.width;
      const y = (overlay.y / 100) * ctx.canvas.height;
      
      // Draw text with effects
      if (overlay.style === 'neon') {
        ctx.shadowColor = overlay.color;
        ctx.shadowBlur = 20;
        ctx.fillText(overlay.text, x, y);
        ctx.shadowBlur = 40;
        ctx.fillText(overlay.text, x, y);
      } else if (overlay.style === 'bold') {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(overlay.text, x, y);
        ctx.fillText(overlay.text, x, y);
      } else {
        ctx.fillText(overlay.text, x, y);
      }
      
      ctx.restore();
    });
  };

  const getTextStyleFont = (style) => {
    const fonts = {
      modern: 'system-ui, -apple-system, sans-serif',
      bold: 'Arial Black, sans-serif',
      elegant: 'Georgia, serif',
      playful: 'Comic Sans MS, cursive',
      vintage: 'Times New Roman, serif',
      neon: 'Impact, sans-serif'
    };
    return fonts[style] || fonts.modern;
  };

  const applyTextStyleEffects = (ctx, style) => {
    switch (style) {
      case 'bold':
        ctx.font = ctx.font.replace(/\d+px/, match => `${parseInt(match) * 1.2}px`);
        break;
      case 'elegant':
        ctx.letterSpacing = '2px';
        break;
      case 'vintage':
        ctx.filter = 'sepia(50%) contrast(120%)';
        break;
      default:
        break;
    }
  };

  const toggleEnhancement = (enhancementId) => {
    const newSelected = new Set(selectedEnhancements);
    if (newSelected.has(enhancementId)) {
      newSelected.delete(enhancementId);
    } else {
      newSelected.add(enhancementId);
    }
    setSelectedEnhancements(newSelected);
  };

  const addTextOverlay = () => {
    if (!newTextOverlay.text.trim()) return;
    
    setTextOverlays(prev => [...prev, {
      ...newTextOverlay,
      id: Date.now()
    }]);
    
    setNewTextOverlay({
      text: '',
      style: 'modern',
      color: '#ffffff',
      size: 24,
      x: 50,
      y: 50
    });
  };

  const removeTextOverlay = (id) => {
    setTextOverlays(prev => prev.filter(overlay => overlay.id !== id));
  };

  const handleSave = async () => {
    setIsProcessing(true);
    
    try {
      let processedMedia = { ...media };
      
      // Apply enhancements and edits
      if (mediaType === 'photo' && canvasRef.current) {
        // Convert canvas to blob
        canvasRef.current.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          processedMedia = {
            ...media,
            url,
            blob,
            edited: true,
            settings: editSettings,
            textOverlays,
            enhancements: Array.from(selectedEnhancements)
          };
          onSave(processedMedia);
        }, 'image/jpeg', 0.9);
      } else {
        // For video and audio, just pass the settings
        processedMedia = {
          ...media,
          edited: true,
          settings: editSettings,
          textOverlays,
          enhancements: Array.from(selectedEnhancements)
        };
        onSave(processedMedia);
      }
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetEdits = () => {
    setEditSettings({
      brightness: [50],
      contrast: [50],
      saturation: [50],
      warmth: [50],
      sharpness: [50],
      volume: [50],
      rotation: [0],
      flipH: false,
      flipV: false
    });
    setTextOverlays([]);
    setSelectedEnhancements(new Set());
  };

  const enhancements = QUICK_ENHANCEMENTS[mediaType] || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Quick Edit Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="enhance" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="enhance">Enhance</TabsTrigger>
              <TabsTrigger value="adjust">Adjust</TabsTrigger>
              <TabsTrigger value="text">Text</TabsTrigger>
              <TabsTrigger value="transform">Transform</TabsTrigger>
            </TabsList>
            
            <TabsContent value="enhance" className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {enhancements.map((enhancement) => (
                  <button
                    key={enhancement.id}
                    onClick={() => toggleEnhancement(enhancement.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedEnhancements.has(enhancement.id)
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <enhancement.icon className={`w-5 h-5 ${
                        selectedEnhancements.has(enhancement.id) ? 'text-purple-600' : 'text-gray-600'
                      }`} />
                      <span className="font-medium">{enhancement.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{enhancement.description}</p>
                  </button>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="adjust" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(mediaType === 'photo' || mediaType === 'video') && (
                  <>
                    <div>
                      <Label className="text-sm font-medium">Brightness</Label>
                      <Slider
                        value={editSettings.brightness}
                        onValueChange={(value) => setEditSettings(prev => ({
                          ...prev,
                          brightness: value
                        }))}
                        min={0}
                        max={200}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Contrast</Label>
                      <Slider
                        value={editSettings.contrast}
                        onValueChange={(value) => setEditSettings(prev => ({
                          ...prev,
                          contrast: value
                        }))}
                        min={0}
                        max={200}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Saturation</Label>
                      <Slider
                        value={editSettings.saturation}
                        onValueChange={(value) => setEditSettings(prev => ({
                          ...prev,
                          saturation: value
                        }))}
                        min={0}
                        max={200}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Warmth</Label>
                      <Slider
                        value={editSettings.warmth}
                        onValueChange={(value) => setEditSettings(prev => ({
                          ...prev,
                          warmth: value
                        }))}
                        min={0}
                        max={100}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  </>
                )}
                
                {(mediaType === 'audio' || mediaType === 'video') && (
                  <div>
                    <Label className="text-sm font-medium">Volume</Label>
                    <Slider
                      value={editSettings.volume}
                      onValueChange={(value) => setEditSettings(prev => ({
                        ...prev,
                        volume: value
                      }))}
                      min={0}
                      max={200}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="text" className="space-y-4">
              {(mediaType === 'photo' || mediaType === 'video') && (
                <>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Add Text</Label>
                      <Input
                        placeholder="Enter text..."
                        value={newTextOverlay.text}
                        onChange={(e) => setNewTextOverlay(prev => ({
                          ...prev,
                          text: e.target.value
                        }))}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium">Style</Label>
                        <select
                          value={newTextOverlay.style}
                          onChange={(e) => setNewTextOverlay(prev => ({
                            ...prev,
                            style: e.target.value
                          }))}
                          className="w-full mt-1 p-2 border rounded-md"
                        >
                          {TEXT_STYLES.map(style => (
                            <option key={style.id} value={style.id}>
                              {style.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Color</Label>
                        <Input
                          type="color"
                          value={newTextOverlay.color}
                          onChange={(e) => setNewTextOverlay(prev => ({
                            ...prev,
                            color: e.target.value
                          }))}
                          className="mt-1 h-10"
                        />
                      </div>
                    </div>
                    
                    <Button onClick={addTextOverlay} className="w-full">
                      <Type className="w-4 h-4 mr-2" />
                      Add Text
                    </Button>
                  </div>
                  
                  {textOverlays.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Text Overlays</Label>
                      {textOverlays.map(overlay => (
                        <div key={overlay.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <div>
                            <span className="font-medium">{overlay.text}</span>
                            <span className="text-sm text-muted-foreground ml-2">({overlay.style})</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTextOverlay(overlay.id)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="transform" className="space-y-4">
              {(mediaType === 'photo' || mediaType === 'video') && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Rotation</Label>
                    <Slider
                      value={editSettings.rotation}
                      onValueChange={(value) => setEditSettings(prev => ({
                        ...prev,
                        rotation: value
                      }))}
                      min={-180}
                      max={180}
                      step={15}
                      className="mt-2"
                    />
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="flipH"
                        checked={editSettings.flipH}
                        onCheckedChange={(checked) => setEditSettings(prev => ({
                          ...prev,
                          flipH: checked
                        }))}
                      />
                      <Label htmlFor="flipH" className="text-sm">Flip Horizontal</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="flipV"
                        checked={editSettings.flipV}
                        onCheckedChange={(checked) => setEditSettings(prev => ({
                          ...prev,
                          flipV: checked
                        }))}
                      />
                      <Label htmlFor="flipV" className="text-sm">Flip Vertical</Label>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Preview */}
      {showPreview && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Preview</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
              {mediaType === 'photo' && (
                <canvas
                  ref={canvasRef}
                  className="max-w-full h-auto"
                  style={{ maxHeight: '300px' }}
                />
              )}
              {mediaType === 'video' && media && (
                <video
                  src={media.url}
                  controls
                  className="w-full h-auto rounded-lg"
                  style={{ maxHeight: '400px' }}
                />
              )}
              {mediaType === 'audio' && media && (
                <div className="p-8 flex flex-col items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
                    <Mic className="w-12 h-12 text-white" />
                  </div>
                  <audio
                    src={media.url}
                    controls
                    className="w-full max-w-md"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onRetake}
          className="flex-1"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Retake
        </Button>
        <Button
          variant="outline"
          onClick={resetEdits}
          className="flex-1"
        >
          Reset Edits
        </Button>
        <Button
          onClick={handleSave}
          disabled={isProcessing}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save & Use
            </>
          )}
        </Button>
      </div>
    </div>
  );
}