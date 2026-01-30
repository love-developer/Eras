import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import {
  X,
  CheckCircle,
  AlertCircle,
  Pause,
  Play,
  RotateCw,
  Trash2,
  Image as ImageIcon,
  Video,
  Mic,
  Loader2,
  FileWarning,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { UploadFile } from '../hooks/useUploadQueue';

interface UploadQueueManagerProps {
  files: UploadFile[];
  onRemove: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onRetry: (id: string) => void;
  onClearCompleted: () => void;
  onClearAll: () => void;
}

export const UploadQueueManager: React.FC<UploadQueueManagerProps> = ({
  files,
  onRemove,
  onPause,
  onResume,
  onRetry,
  onClearCompleted,
  onClearAll,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const prevCompletedCount = React.useRef(0);
  const autoCloseTimer = React.useRef<NodeJS.Timeout | null>(null);

  // Auto-expand when new files are added or uploading
  React.useEffect(() => {
    const activeFiles = files.filter((f) => ['compressing', 'uploading', 'queued'].includes(f.status));
    if (activeFiles.length > 0) {
      setIsExpanded(true);
      // Clear any pending auto-close timer
      if (autoCloseTimer.current) {
        clearTimeout(autoCloseTimer.current);
        autoCloseTimer.current = null;
      }
    }
  }, [files.length, files.filter((f) => ['compressing', 'uploading', 'queued'].includes(f.status)).length]);

  // Auto-close when individual files complete OR when all files are complete
  React.useEffect(() => {
    const completedFiles = files.filter((f) => f.status === 'completed');
    const activeFiles = files.filter((f) => ['compressing', 'uploading', 'queued'].includes(f.status));
    const failedFiles = files.filter((f) => f.status === 'failed');

    // Check if all files are completed (no active or failed files)
    if (completedFiles.length > 0 && activeFiles.length === 0 && failedFiles.length === 0) {
      // All uploads complete - auto-clear after 2 seconds
      if (autoCloseTimer.current) {
        clearTimeout(autoCloseTimer.current);
      }
      autoCloseTimer.current = setTimeout(() => {
        onClearCompleted(); // Clear completed files to hide the queue
      }, 2000);
    }

    prevCompletedCount.current = completedFiles.length;

    return () => {
      if (autoCloseTimer.current) {
        clearTimeout(autoCloseTimer.current);
      }
    };
  }, [files, onClearCompleted]);

  if (files.length === 0) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'audio':
        return <Mic className="w-4 h-4" />;
      default:
        return <FileWarning className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (file: UploadFile) => {
    switch (file.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'compressing':
      case 'uploading':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      default:
        return <Loader2 className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusText = (file: UploadFile): string => {
    switch (file.status) {
      case 'queued':
        return 'Queued';
      case 'compressing':
        return `Compressing... ${file.progress}%`;
      case 'uploading':
        return `Uploading... ${file.progress}%`;
      case 'completed':
        return 'Complete';
      case 'failed':
        return file.error || 'Failed';
      case 'paused':
        return 'Paused';
      default:
        return 'Unknown';
    }
  };

  const totalFiles = files.length;
  const completedFiles = files.filter((f) => f.status === 'completed').length;
  const failedFiles = files.filter((f) => f.status === 'failed').length;
  const activeFiles = files.filter((f) => ['compressing', 'uploading'].includes(f.status)).length;

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const compressedSize = files.reduce((sum, f) => sum + (f.compressedSize || f.size), 0);
  const savedSize = totalSize - compressedSize;
  const savedPercent = totalSize > 0 ? Math.round((savedSize / totalSize) * 100) : 0;

  return (
    <Card className="relative z-10 bg-slate-800/90 backdrop-blur-xl border-slate-700/50 shadow-2xl transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Loader2 className={`w-4 h-4 text-white ${activeFiles > 0 ? 'animate-spin' : ''}`} />
            </div>
            <CardTitle className="text-lg">Upload Queue</CardTitle>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
          <div className="flex items-center gap-2">
            {completedFiles > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearCompleted}
                className="text-xs text-slate-400 hover:text-slate-300"
              >
                Clear Completed
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Clear All
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
          <span>
            {completedFiles}/{totalFiles} completed
          </span>
          {failedFiles > 0 && <span className="text-red-400">{failedFiles} failed</span>}
          {savedPercent > 0 && (
            <span className="text-green-400">
              Saved {formatFileSize(savedSize)} ({savedPercent}%)
            </span>
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700/30 hover:border-slate-600/50 transition-all"
            >
              {/* File Icon & Thumbnail */}
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700/50 overflow-hidden">
                {file.url && file.type === 'image' ? (
                  <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                ) : file.thumbnailUrl && file.type === 'video' ? (
                  <img src={file.thumbnailUrl} alt={file.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-slate-500">{getFileIcon(file.type)}</div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{formatFileSize(file.size)}</span>
                      {file.compressedSize && file.compressedSize < file.size && (
                        <>
                          <span>→</span>
                          <span className="text-green-400">{formatFileSize(file.compressedSize)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {file.status === 'uploading' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onPause(file.id)}
                        className="h-7 w-7 text-slate-400 hover:text-yellow-400"
                      >
                        <Pause className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {file.status === 'paused' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onResume(file.id)}
                        className="h-7 w-7 text-slate-400 hover:text-blue-400"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {file.status === 'failed' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRetry(file.id)}
                        className="h-7 w-7 text-slate-400 hover:text-green-400"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove(file.id)}
                      className="h-7 w-7 text-slate-400 hover:text-red-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                {['compressing', 'uploading'].includes(file.status) && (
                  <div className="space-y-1">
                    <Progress value={file.progress} className="h-1.5" />
                  </div>
                )}

                {/* Status */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  {getStatusIcon(file)}
                  <span className="text-xs text-slate-400">{getStatusText(file)}</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
};