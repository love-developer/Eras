/**
 * Export Progress Modal
 * Shows real-time progress during ZIP export
 * 
 * Features:
 * - Progress bar with percentage
 * - Current file being processed
 * - File count progress
 * - Cancel button (if supported)
 */

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Progress } from './ui/progress';
import { FileArchive, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExportProgressModalProps {
  open: boolean;
  progress: number; // 0-100
  currentFile?: string;
  processedFiles: number;
  totalFiles: number;
  status: 'preparing' | 'exporting' | 'complete';
}

export function ExportProgressModal({
  open,
  progress,
  currentFile,
  processedFiles,
  totalFiles,
  status
}: ExportProgressModalProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}} modal={true}>
      <DialogContent 
        className="sm:max-w-md" 
        style={{ zIndex: 10000 }}
        hideClose={status !== 'complete'}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {status === 'complete' ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-400" />
                Export Complete!
              </>
            ) : (
              <>
                <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                Exporting Files...
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">
                {status === 'preparing' && 'Preparing export...'}
                {status === 'exporting' && `Processing files...`}
                {status === 'complete' && 'Download starting...'}
              </span>
              <span className="text-white font-semibold">{Math.round(progress)}%</span>
            </div>
            
            <Progress value={progress} className="h-2" />
            
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{processedFiles} of {totalFiles} files</span>
            </div>
          </div>

          {/* Current File Being Processed */}
          <AnimatePresence mode="wait">
            {currentFile && status === 'exporting' && (
              <motion.div
                key={currentFile}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-3"
              >
                <div className="flex items-start gap-2">
                  <FileArchive className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400 mb-1">Current file:</p>
                    <p className="text-sm text-white truncate">{currentFile}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status Messages */}
          {status === 'preparing' && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Setting up export...
              </div>
            </div>
          )}

          {status === 'complete' && (
            <div className="text-center space-y-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center"
              >
                <CheckCircle className="w-8 h-8 text-green-400" />
              </motion.div>
              <p className="text-sm text-slate-300">
                Your files have been exported successfully!
              </p>
              <p className="text-xs text-slate-500">
                The ZIP file will download shortly.
              </p>
            </div>
          )}

          {/* Estimated Time (optional enhancement) */}
          {status === 'exporting' && totalFiles > 20 && (
            <div className="text-center text-xs text-slate-500">
              Please wait, this may take a moment for large exports
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
