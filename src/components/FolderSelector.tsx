import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Folder, FolderOpen, Camera, Video, Mic, Loader2, CheckCircle, X } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner';
import { useIsMobile } from './ui/use-mobile';

interface FolderSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFolderSelect: (folderId: string, folderName: string, mediaCount: number) => void;
  userId: string;
}

const FOLDER_COLORS = {
  blue: 'from-blue-500 via-blue-600 to-cyan-600',
  purple: 'from-purple-500 via-purple-600 to-fuchsia-600',
  pink: 'from-pink-500 via-pink-600 to-rose-600',
  green: 'from-green-500 via-emerald-600 to-teal-600',
  yellow: 'from-yellow-500 via-amber-500 to-orange-500',
  orange: 'from-orange-500 via-orange-600 to-red-600',
  red: 'from-red-500 via-red-600 to-pink-600',
  slate: 'from-slate-500 via-slate-600 to-gray-600',
};

export function FolderSelector({
  open,
  onOpenChange,
  onFolderSelect,
  userId
}: FolderSelectorProps) {
  const [folders, setFolders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const isMobile = useIsMobile();

  // Load folders when dialog opens
  useEffect(() => {
    if (open && userId) {
      loadFolders();
    }
  }, [open, userId]);

  const loadFolders = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No valid session');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/vault/media`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load vault data');
      }

      const data = await response.json();
      
      // Filter folders that have media
      const foldersWithMedia = (data.folders || []).filter(
        (folder: any) => folder.mediaIds && folder.mediaIds.length > 0
      );
      
      setFolders(foldersWithMedia);
    } catch (error) {
      console.error('Error loading folders:', error);
      toast.error('Failed to load folders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFolderClick = (folder: any) => {
    if (selectedFolder?.id === folder.id) {
      setSelectedFolder(null);
    } else {
      setSelectedFolder(folder);
    }
  };

  const handleConfirm = () => {
    if (selectedFolder) {
      const mediaCount = selectedFolder.mediaIds?.length || 0;
      onFolderSelect(selectedFolder.id, selectedFolder.name, mediaCount);
      onOpenChange(false);
      setSelectedFolder(null);
    }
  };

  const content = (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Folder className="w-6 h-6 text-purple-500" />
          <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
            Select a Folder
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          All media from the selected folder will be attached to your capsule
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading folders...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && folders.length === 0 && (
        <div className="text-center py-12 space-y-3">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-purple-100 dark:bg-purple-900/20">
              <Folder className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div>
            <p className="font-medium text-foreground">No Folders with Media</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create folders and add media to them first
            </p>
          </div>
        </div>
      )}

      {/* Folders Grid */}
      {!isLoading && folders.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto p-1">
          {folders.map((folder: any) => {
            const isSelected = selectedFolder?.id === folder.id;
            const gradient = FOLDER_COLORS[folder.color] || FOLDER_COLORS.blue;
            const mediaCount = folder.mediaIds?.length || 0;

            return (
              <button
                key={folder.id}
                onClick={() => handleFolderClick(folder)}
                className={`relative group p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg scale-105'
                    : 'border-border hover:border-purple-300 bg-background hover:shadow-md'
                }`}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute -top-2 -right-2 bg-purple-500 rounded-full p-1 shadow-lg">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                )}

                {/* Folder Icon */}
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${gradient} shadow-md`}>
                    {isSelected ? (
                      <FolderOpen className="w-6 h-6 text-white" />
                    ) : (
                      <Folder className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground truncate">
                      {folder.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {mediaCount} {mediaCount === 1 ? 'file' : 'files'}
                    </p>
                  </div>
                </div>

                {/* Media Type Preview */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* This is a simplified preview - you could enhance it by showing actual media types */}
                  <Badge variant="outline" className="text-xs gap-1">
                    <Camera className="w-3 h-3" />
                    Photos
                  </Badge>
                  <Badge variant="outline" className="text-xs gap-1">
                    <Video className="w-3 h-3" />
                    Videos
                  </Badge>
                  <Badge variant="outline" className="text-xs gap-1">
                    <Mic className="w-3 h-3" />
                    Audio
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Action Buttons */}
      {!isLoading && folders.length > 0 && (
        <div className="flex gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedFolder}
            className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white shadow-lg"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Attach {selectedFolder ? `(${selectedFolder.mediaIds?.length || 0} files)` : 'Folder'}
          </Button>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="bottom" 
          className="h-[85vh] bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border-t border-purple-500/20"
        >
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl bg-gradient-to-r from-white via-purple-100 to-fuchsia-100 bg-clip-text text-transparent">
              Attach Folder to Capsule
            </SheetTitle>
            <SheetDescription className="text-slate-300">
              Select a folder to attach all its media at once
            </SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-purple-500/20 shadow-2xl shadow-purple-900/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl bg-gradient-to-r from-white via-purple-100 to-fuchsia-100 bg-clip-text text-transparent">
              Attach Folder to Capsule
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Select a folder to attach all its media at once
            </DialogDescription>
          </DialogHeader>
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}
