import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { AlertTriangle, CheckCircle, HardDrive } from 'lucide-react';

interface FileSizeWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: Array<{
    name: string;
    size: number;
    canCompress: boolean;
  }>;
  onConfirm: (compress: boolean) => void;
  onCancel: () => void;
}

export const FileSizeWarningDialog: React.FC<FileSizeWarningDialogProps> = ({
  open,
  onOpenChange,
  files,
  onConfirm,
  onCancel,
}) => {
  const formatFileSize = (bytes: number): string => {
    const MB = 1024 * 1024;
    const GB = 1024 * 1024 * 1024;
    
    if (bytes >= GB) {
      return `${(bytes / GB).toFixed(2)} GB`;
    }
    return `${(bytes / MB).toFixed(1)} MB`;
  };

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB per file
  const hasOversizedFiles = files.some(f => f.size > MAX_FILE_SIZE);
  
  // Check if we have any images that could benefit from compression
  const compressableImages = files.filter((f) => 
    f.canCompress && f.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)
  );
  const hasCompressableImages = compressableImages.length > 0;
  
  // Estimate compression for images only (we don't compress videos anymore)
  const estimatedCompressedSize = files.reduce((sum, f) => {
    if (f.canCompress && f.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return sum + f.size * 0.3; // Image ~70% reduction
    }
    return sum + f.size;
  }, 0);
  
  const estimatedSavings = totalSize - estimatedCompressedSize;
  const estimatedSavingsPercent = hasCompressableImages ? Math.round((estimatedSavings / totalSize) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${hasOversizedFiles ? 'from-red-500 to-red-700' : 'from-blue-500 to-blue-600'} flex items-center justify-center`}>
              {hasOversizedFiles ? (
                <AlertTriangle className="w-5 h-5 text-white" />
              ) : (
                <HardDrive className="w-5 h-5 text-white" />
              )}
            </div>
            {hasOversizedFiles ? 'Files Too Large' : 'Large Files Detected'}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-base">
            {hasOversizedFiles ? (
              <>
                Some files exceed the 500MB limit and cannot be uploaded.
              </>
            ) : (
              <>
                You're about to upload {files.length} file{files.length > 1 ? 's' : ''} totaling{' '}
                <span className="font-semibold text-blue-400">{formatFileSize(totalSize)}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File List */}
          <div className="max-h-[200px] overflow-y-auto space-y-2 bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            {files.map((file, index) => {
              const isOversized = file.size > MAX_FILE_SIZE;
              return (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className={`truncate flex-1 ${isOversized ? 'text-red-400' : 'text-slate-300'}`}>
                    {file.name}
                    {isOversized && ' ⚠️'}
                  </span>
                  <span className={`ml-2 flex-shrink-0 ${isOversized ? 'text-red-400 font-semibold' : 'text-slate-500'}`}>
                    {formatFileSize(file.size)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Warning for oversized files */}
          {hasOversizedFiles && (
            <div className="bg-red-950/30 border border-red-800/50 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-300">
                  <p className="font-semibold mb-1">Maximum file size: 500MB per file</p>
                  <p className="text-red-400/80">
                    Please reduce file sizes or select different files. Videos over 500MB should be compressed or trimmed using your phone's video editor before uploading.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Compression option for images */}
          {!hasOversizedFiles && hasCompressableImages && (
            <div className="bg-blue-950/30 border border-blue-800/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-300 mb-1">
                    Compression Available
                  </p>
                  <p className="text-xs text-blue-400/80 mb-2">
                    {compressableImages.length} image{compressableImages.length > 1 ? 's' : ''} can be compressed to save space
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400">Estimated size after compression:</span>
                    <span className="font-semibold text-green-400">{formatFileSize(estimatedCompressedSize)}</span>
                    <span className="text-green-500">({estimatedSavingsPercent}% smaller)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info: Videos not compressed */}
          {!hasOversizedFiles && files.some(f => f.name.toLowerCase().match(/\.(mp4|mov|avi|mkv|webm)$/)) && (
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
              <p className="text-xs text-slate-400">
                ℹ️ Videos will be uploaded in their original quality. Modern phones already compress videos efficiently.
                Maximum size: 500MB per video.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-600"
          >
            Cancel
          </Button>
          
          {hasOversizedFiles ? (
            <Button
              onClick={onCancel}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white"
            >
              Go Back
            </Button>
          ) : (
            <>
              {hasCompressableImages && (
                <Button
                  onClick={() => onConfirm(true)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white"
                >
                  Compress & Upload
                </Button>
              )}
              <Button
                onClick={() => onConfirm(false)}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white"
              >
                {hasCompressableImages ? 'Upload Original' : 'Upload'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
