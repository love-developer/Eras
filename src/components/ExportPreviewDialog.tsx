/**
 * Export Preview Dialog
 * Shows what will be exported before starting the ZIP export
 * 
 * Features:
 * - File count and estimated size
 * - List of files to be exported
 * - Export options (metadata, folder structure)
 * - Cancel or proceed
 */

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { FileArchive, Image, Video, Music, File, AlertCircle, Download, X } from 'lucide-react';
import { useIsMobile } from './ui/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';

interface ExportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  folderName: string;
  fileCount: number;
  estimatedSize: string;
  files: Array<{
    type: 'photo' | 'video' | 'audio' | 'document';
    name: string;
    timestamp: number;
  }>;
}

export function ExportPreviewDialog({
  open,
  onOpenChange,
  onConfirm,
  folderName,
  fileCount,
  estimatedSize,
  files
}: ExportPreviewDialogProps) {
  const isMobile = useIsMobile();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'photo': return <Image className="w-4 h-4 text-blue-400" />;
      case 'video': return <Video className="w-4 h-4 text-purple-400" />;
      case 'audio': return <Music className="w-4 h-4 text-green-400" />;
      default: return <File className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTypeCounts = () => {
    const counts = { photo: 0, video: 0, audio: 0, document: 0 };
    files.forEach(file => {
      if (file.type in counts) {
        counts[file.type as keyof typeof counts]++;
      }
    });
    return counts;
  };

  const typeCounts = getTypeCounts();

  const content = (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="rounded-lg border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
            <FileArchive className="w-6 h-6 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-black dark:text-white truncate">{folderName}</h4>
            <p className="text-sm text-slate-700 dark:text-slate-400 mt-1">
              {fileCount} {fileCount === 1 ? 'file' : 'files'} • ~{estimatedSize}
            </p>
          </div>
        </div>

        {/* File Type Breakdown */}
        <div className="flex flex-wrap gap-2">
          {typeCounts.photo > 0 && (
            <Badge variant="outline" className="text-xs bg-blue-500/10 border-blue-400/20 text-blue-400">
              <Image className="w-3 h-3 mr-1" />
              {typeCounts.photo} Photo{typeCounts.photo !== 1 ? 's' : ''}
            </Badge>
          )}
          {typeCounts.video > 0 && (
            <Badge variant="outline" className="text-xs bg-purple-500/10 border-purple-400/20 text-purple-400">
              <Video className="w-3 h-3 mr-1" />
              {typeCounts.video} Video{typeCounts.video !== 1 ? 's' : ''}
            </Badge>
          )}
          {typeCounts.audio > 0 && (
            <Badge variant="outline" className="text-xs bg-green-500/10 border-green-400/20 text-green-400">
              <Music className="w-3 h-3 mr-1" />
              {typeCounts.audio} Audio
            </Badge>
          )}
          {typeCounts.document > 0 && (
            <Badge variant="outline" className="text-xs bg-slate-500/10 border-slate-400/20 text-slate-400">
              <File className="w-3 h-3 mr-1" />
              {typeCounts.document} Doc{typeCounts.document !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>

      {/* Export Details */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-black dark:text-slate-300">What's included:</h4>
        <ul className="text-xs text-slate-700 dark:text-slate-400 space-y-1 list-disc list-inside">
          <li>All media files organized by type</li>
          <li>metadata.json with export details</li>
          <li>README.txt with instructions</li>
        </ul>
      </div>

      {/* Warning if large export */}
      {fileCount > 50 && (
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <div className="text-xs text-yellow-900 dark:text-yellow-200">
            <p className="font-medium">Large export</p>
            <p className="text-yellow-800 dark:text-yellow-300/80 mt-1">This export contains many files and may take a moment to complete.</p>
          </div>
        </div>
      )}

      {/* File List Preview (first 10) */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-black dark:text-slate-300">Files to export:</h4>
        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2">
          {files.slice(0, 10).map((file, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 text-xs text-black dark:text-slate-300 bg-slate-200/50 dark:bg-slate-800/30 rounded p-2"
            >
              {getTypeIcon(file.type)}
              <span className="flex-1 truncate">{file.name}</span>
            </div>
          ))}
          {files.length > 10 && (
            <p className="text-xs text-slate-600 dark:text-slate-500 text-center py-2">
              + {files.length - 10} more file{files.length - 10 !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const actions = (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={() => onOpenChange(false)}
        className="flex-1"
      >
        <X className="w-4 h-4 mr-2" />
        Cancel
      </Button>
      <Button
        onClick={() => {
          onConfirm();
          onOpenChange(false);
        }}
        className="flex-1 bg-purple-600 hover:bg-purple-700"
      >
        <Download className="w-4 h-4 mr-2" />
        Export ZIP
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileArchive className="w-5 h-5 text-purple-400" />
              Export Preview
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {content}
            {actions}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" style={{ zIndex: 9999 }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileArchive className="w-5 h-5 text-purple-400" />
            Export Preview
          </DialogTitle>
        </DialogHeader>
        {content}
        <DialogFooter>
          {actions}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}