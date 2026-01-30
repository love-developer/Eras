import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { GripVertical, Eye, Trash2, RotateCw } from 'lucide-react';
import { MediaThumbnail } from './MediaThumbnail';
import { MediaPreviewModal } from './MediaPreviewModal';
import { DatabaseService } from '../utils/supabase/database';
import { MediaFile } from '../utils/supabase/client';

const ItemType = 'MEDIA_FILE';

interface DraggableMediaItemProps {
  mediaFile: MediaFile;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  onPreview: (mediaFile: MediaFile) => void;
  onRemove?: (mediaFileId: string) => void;
  showRemove?: boolean;
}

function DraggableMediaItem({ 
  mediaFile, 
  index, 
  moveItem, 
  onPreview, 
  onRemove,
  showRemove = false 
}: DraggableMediaItemProps) {
  // Drag-and-drop disabled to prevent HMR conflicts
  const isDragging = false;
  const isOver = false;
  const drag = useRef(null);
  const drop = useRef(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileTypeColor = (fileType: string) => {
    if (fileType.startsWith('video/')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    if (fileType.startsWith('audio/')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (fileType.startsWith('image/')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  };

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-105' : ''
      } ${isOver ? 'scale-102' : ''}`}
    >
      <Card className={`group hover:shadow-md transition-shadow cursor-move ${
        isOver ? 'ring-2 ring-primary' : ''
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Drag Handle */}
            <div className="flex-shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">
              <GripVertical className="w-5 h-5" />
            </div>

            {/* Thumbnail */}
            <div className="flex-shrink-0">
              <MediaThumbnail 
                mediaFile={mediaFile} 
                size="md" 
                showOverlay={false}
                className="border border-border"
              />
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium truncate">{mediaFile.file_name}</h4>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getFileTypeColor(mediaFile.file_type)}`}
                >
                  {mediaFile.file_type.split('/')[0].toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(mediaFile.file_size)}
              </p>
              <p className="text-xs text-muted-foreground">
                Added {new Date(mediaFile.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onPreview(mediaFile)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Eye className="w-4 h-4" />
              </Button>
              
              {showRemove && onRemove && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemove(mediaFile.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface DraggableMediaListProps {
  capsuleId: string;
  onReorder?: (newOrder: MediaFile[]) => void;
  showRemove?: boolean;
  allowReorder?: boolean;
}

export function DraggableMediaList({ 
  capsuleId, 
  onReorder, 
  showRemove = false,
  allowReorder = true 
}: DraggableMediaListProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  const moveItem = (dragIndex: number, hoverIndex: number) => {
    if (!allowReorder) return;
    
    const draggedItem = mediaFiles[dragIndex];
    const newOrder = [...mediaFiles];
    newOrder.splice(dragIndex, 1);
    newOrder.splice(hoverIndex, 0, draggedItem);
    
    setMediaFiles(newOrder);
    
    if (onReorder) {
      onReorder(newOrder);
    }
  };

  const handleRemove = async (mediaFileId: string) => {
    try {
      await DatabaseService.deleteMediaFile(mediaFileId);
      setMediaFiles(prev => prev.filter(file => file.id !== mediaFileId));
    } catch (error) {
      console.error('Failed to remove media file:', error);
    }
  };

  const handlePreview = (mediaFile: MediaFile) => {
    setPreviewFile(mediaFile);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RotateCw className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading media files...</span>
      </div>
    );
  }

  if (mediaFiles.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No media files found</p>
      </div>
    );
  }

  const content = (
    <div className="space-y-3">
      {mediaFiles.map((mediaFile, index) => (
        <DraggableMediaItem
          key={mediaFile.id}
          mediaFile={mediaFile}
          index={index}
          moveItem={moveItem}
          onPreview={handlePreview}
          onRemove={showRemove ? handleRemove : undefined}
          showRemove={showRemove}
        />
      ))}
    </div>
  );

  return (
    <>
      {content}

      {previewFile && (
        <MediaPreviewModal
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
          mediaFile={previewFile}
        />
      )}
    </>
  );
}