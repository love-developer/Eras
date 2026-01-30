import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { FileText as FileTextIcon, Mic, Image as ImageIcon, FileText, Download, Eye, EyeOff, Play, Pause, Volume2, VolumeX, RotateCw, GripVertical } from 'lucide-react';
import { DatabaseService } from '../utils/supabase/database';
import { MediaFile } from '../utils/supabase/client';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MediaThumbnail } from './MediaThumbnail';
import { MediaPreviewModal } from './MediaPreviewModal';

interface MediaPreviewProps {
  capsuleId: string;
  showCount?: boolean;
  maxPreview?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function MediaPreview({ capsuleId, showCount = true, maxPreview = 3, size = 'sm' }: MediaPreviewProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);

  useEffect(() => {
    loadMediaFiles();
  }, [capsuleId]);

  const loadMediaFiles = async () => {
    try {
      const files = await DatabaseService.getCapsuleMediaFiles(capsuleId);
      setMediaFiles(files);
    } catch (error) {
      console.error('Failed to load media files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFileIcon = (fileType: string, className = "w-4 h-4") => {
    if (fileType.startsWith('video/')) return <FileTextIcon className={className} />;
    if (fileType.startsWith('audio/')) return <Mic className={className} />;
    if (fileType.startsWith('image/')) return <ImageIcon className={className} />;
    return <FileText className={className} />;
  };

  const getFileTypeColor = (fileType: string) => {
    if (fileType.startsWith('video/')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    if (fileType.startsWith('audio/')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (fileType.startsWith('image/')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handlePreview = (mediaFile: MediaFile) => {
    setPreviewFile(mediaFile);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
        Loading media...
      </div>
    );
  }

  if (mediaFiles.length === 0) {
    return showCount ? (
      <div className="text-sm text-muted-foreground">
        No media files
      </div>
    ) : null;
  }

  const displayFiles = showAll ? mediaFiles : mediaFiles.slice(0, maxPreview);
  const hiddenCount = mediaFiles.length - maxPreview;

  if (size === 'sm') {
    return (
      <div className="space-y-3">
        {/* Primary thumbnail display */}
        {mediaFiles.length === 1 ? (
          // Single media file - featured thumbnail
          <div className="relative">
            <MediaThumbnail
              mediaFile={mediaFiles[0]}
              size="lg"
              showOverlay={true}
              className="cursor-pointer hover:scale-105 transition-transform shadow-sm border border-border/50"
              onClick={() => handlePreview(mediaFiles[0])}
            />
            {/* File type indicator */}
            <div className="absolute -top-1 -right-1">
              <Badge 
                variant="secondary" 
                className={`text-xs p-1 shadow-sm ${getFileTypeColor(mediaFiles[0].file_type)}`}
              >
                {getFileIcon(mediaFiles[0].file_type, "w-3 h-3")}
              </Badge>
            </div>
          </div>
        ) : mediaFiles.length === 2 ? (
          // Two files - side by side
          <div className="flex gap-2">
            {mediaFiles.map((file, index) => (
              <div key={file.id} className="relative">
                <MediaThumbnail
                  mediaFile={file}
                  size="md"
                  showOverlay={true}
                  className="cursor-pointer hover:scale-105 transition-transform shadow-sm border border-border/50"
                  onClick={() => handlePreview(file)}
                />
                {/* File type indicator */}
                <div className="absolute -top-1 -right-1">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs p-1 shadow-sm ${getFileTypeColor(file.file_type)}`}
                  >
                    {getFileIcon(file.file_type, "w-3 h-3")}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Multiple files - compact grid
          <div className="grid grid-cols-3 gap-2">
            {mediaFiles.slice(0, 2).map((file, index) => (
              <div key={file.id} className="relative">
                <MediaThumbnail
                  mediaFile={file}
                  size="md"
                  showOverlay={true}
                  className="cursor-pointer hover:scale-105 transition-transform shadow-sm border border-border/50"
                  onClick={() => handlePreview(file)}
                />
                {/* File type indicator */}
                <div className="absolute -top-1 -right-1">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs p-1 shadow-sm ${getFileTypeColor(file.file_type)}`}
                  >
                    {getFileIcon(file.file_type, "w-3 h-3")}
                  </Badge>
                </div>
              </div>
            ))}
            {mediaFiles.length > 2 && (
              <div 
                className="w-20 h-20 rounded-lg bg-gradient-to-br from-muted to-muted/70 border border-border/50 shadow-sm flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                onClick={() => handlePreview(mediaFiles[2])}
              >
                <div className="text-center">
                  <span className="text-sm font-medium text-muted-foreground">+{mediaFiles.length - 2}</span>
                  <p className="text-xs text-muted-foreground">more</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {showCount && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {getFileIcon(mediaFiles[0]?.file_type || '')}
            <span>{mediaFiles.length} media file{mediaFiles.length !== 1 ? 's' : ''}</span>
          </div>
        )}
        
        {!showCount && (
          <div className="flex flex-wrap gap-1">
            {displayFiles.map((file, index) => (
              <Badge 
                key={file.id} 
                variant="secondary" 
                className={`text-xs ${getFileTypeColor(file.file_type)}`}
              >
                {getFileIcon(file.file_type, "w-3 h-3")}
                <span className="ml-1 truncate max-w-20">{file.file_name}</span>
              </Badge>
            ))}
            {hiddenCount > 0 && !showAll && (
              <Badge variant="outline" className="text-xs">
                +{hiddenCount} more
              </Badge>
            )}
          </div>
        )}
        
        {/* Preview Modal */}
        {previewFile && (
          <MediaPreviewModal
            isOpen={!!previewFile}
            onClose={() => setPreviewFile(null)}
            mediaFile={previewFile}
          />
        )}
      </div>
    );
  }

  if (size === 'md') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Media Files ({mediaFiles.length})</h4>
          {hiddenCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
              {showAll ? 'Show Less' : `Show All (${mediaFiles.length})`}
            </Button>
          )}
        </div>
        
        <div className="grid gap-2">
          {displayFiles.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-3 bg-muted rounded-lg group hover:bg-muted/80 transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <MediaThumbnail 
                  mediaFile={file} 
                  size="sm" 
                  showOverlay={false}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.file_size)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePreview(file)}
                disabled={!file.url}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
        
        {/* Preview Modal */}
        {previewFile && (
          <MediaPreviewModal
            isOpen={!!previewFile}
            onClose={() => setPreviewFile(null)}
            mediaFile={previewFile}
          />
        )}
      </div>
    );
  }

  // Large size - full display with preview
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Media Files ({mediaFiles.length})</h3>
      
      <div className="grid gap-4">
        {mediaFiles.map((file) => (
          <Card key={file.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex-shrink-0">
                    {getFileIcon(file.file_type, "w-8 h-8")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{file.file_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.file_size)} • {file.file_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Added {new Date(file.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview(file)}
                    disabled={!file.url}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                </div>
              </div>
              
              {/* Preview for images */}
              {file.file_type.startsWith('image/') && file.url && (
                <div className="mt-4">
                  <img 
                    src={file.url} 
                    alt={file.file_name}
                    className="max-h-64 rounded-lg object-cover"
                    loading="lazy"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <MediaPreviewModal
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
          mediaFile={previewFile}
        />
      )}
    </div>
  );
}