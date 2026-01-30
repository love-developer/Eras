/**
 * Export History Modal
 * Shows the last 5 exports with timestamps and allows re-export
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { FileArchive, Clock, Download, Trash2, RefreshCcw } from 'lucide-react';
import { useIsMobile } from './ui/use-mobile';
import { getExportHistory, clearExportHistory, formatExportTimestamp, ExportHistoryItem } from '../utils/export-history';
import { motion, AnimatePresence } from 'motion/react';

interface ExportHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReExport: (folderName: string) => void;
}

export function ExportHistoryModal({
  open,
  onOpenChange,
  onReExport
}: ExportHistoryModalProps) {
  const isMobile = useIsMobile();
  const [history, setHistory] = useState<ExportHistoryItem[]>([]);

  useEffect(() => {
    if (open) {
      setHistory(getExportHistory());
    }
  }, [open]);

  const handleClearHistory = () => {
    if (confirm('Clear all export history? This cannot be undone.')) {
      clearExportHistory();
      setHistory([]);
    }
  };

  const content = (
    <div className="space-y-4">
      {history.length === 0 ? (
        // Empty State
        <div className="text-center py-12">
          <FileArchive className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 text-sm">No export history yet</p>
          <p className="text-slate-500 text-xs mt-2">
            Your recent exports will appear here
          </p>
        </div>
      ) : (
        <>
          {/* History List */}
          <AnimatePresence mode="popLayout">
            {history.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-lg border border-slate-700 bg-slate-800/30 p-4 hover:border-purple-500/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <FileArchive className="w-4 h-4 text-purple-400 shrink-0" />
                      <h4 className="font-semibold text-white truncate">{item.folderName}</h4>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                        {item.fileCount} files
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                        ~{item.estimatedSize}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatExportTimestamp(item.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Re-export Button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      onReExport(item.folderName);
                      onOpenChange(false);
                    }}
                    title="Re-export this folder"
                    className="hover:bg-purple-500/20 hover:text-purple-400"
                  >
                    <RefreshCcw className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Clear History Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearHistory}
            className="w-full text-red-400 border-red-500/20 hover:bg-red-500/10 hover:border-red-500/30"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear History
          </Button>
        </>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[70vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              Export History
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" style={{ zIndex: 9999 }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Export History
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            View your recent capsule exports and download again if needed
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}