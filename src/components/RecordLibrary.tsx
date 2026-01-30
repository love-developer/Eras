import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { ArrowLeft, CheckCircle, Trash2, Image, Video, Mic, AlertTriangle } from 'lucide-react';
import { Badge } from './ui/badge';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

interface LibraryItem {
  id: string;
  type: 'photo' | 'video' | 'audio';
  base64Data: string;
  timestamp: number;
  thumbnail?: string;
  mimeType: string;
}

interface MediaItem {
  id: string;
  type: 'photo' | 'video' | 'audio';
  url: string;
  blob: Blob;
  timestamp: number;
  thumbnail?: string;
}

interface RecordLibraryProps {
  onSelect: (selectedMedia: MediaItem[]) => void;
  onBack: () => void;
}

export function RecordLibrary({ onSelect, onBack }: RecordLibraryProps) {
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    setIsLoading(true);
    
    // Always load localStorage first to ensure users can access their media
    let localItems: LibraryItem[] = [];
    try {
      const stored = localStorage.getItem('recordLibrary');
      if (stored) {
        localItems = JSON.parse(stored);
        console.log(`📱 Loaded ${localItems.length} records from localStorage`);
        // Show localStorage items immediately
        setLibraryItems(localItems);
      }
    } catch (localErr) {
      console.error('Failed to load from localStorage:', localErr);
    }
    
    // Try to sync with backend (but don't block on it)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('☁️ Syncing with backend record library...');
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/record-library`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Synced ${data.records.length} records from backend`);
          
          // Convert backend records to LibraryItem format
          const backendItems: LibraryItem[] = data.records.map(record => ({
            id: record.id,
            type: record.type,
            base64Data: record.url, // Store the signed URL instead of base64
            timestamp: record.timestamp,
            thumbnail: record.thumbnail,
            mimeType: record.file_type
          }));
          
          // Merge backend items with local items (backend takes precedence)
          const mergedItems = [...backendItems];
          localItems.forEach(localItem => {
            if (!backendItems.find(item => item.id === localItem.id)) {
              mergedItems.push(localItem);
            }
          });
          
          setLibraryItems(mergedItems);
          console.log(`📚 Total records after sync: ${mergedItems.length}`);
        } else if (response.status === 401 || response.status === 403) {
          console.warn('⚠️ Backend sync permission denied - using localStorage only');
          // Keep showing localStorage items
        } else {
          console.warn(`⚠️ Backend sync failed (${response.status}) - using localStorage only`);
        }
      } else {
        console.log('📱 No session - using localStorage only');
      }
    } catch (err) {
      console.warn('⚠️ Backend sync error - using localStorage only:', err);
      // Keep showing localStorage items
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleUseSelected = async () => {
    if (selectedIds.size === 0) return;

    // Check if there are unselected items
    const hasUnselected = libraryItems.some(item => !selectedIds.has(item.id));
    
    if (hasUnselected) {
      setShowDeleteWarning(true);
    } else {
      proceedWithSelection();
    }
  };

  const proceedWithSelection = async () => {
    console.log('📤 [LIBRARY] RecordLibrary.proceedWithSelection starting...');
    console.log('📤 [LIBRARY] Selected IDs:', Array.from(selectedIds));
    console.log('📤 [LIBRARY] Total library items:', libraryItems.length);
    
    // Convert selected items back to MediaItem format with blobs
    const selectedItems = libraryItems.filter(item => selectedIds.has(item.id));
    console.log('📤 [LIBRARY] Selected items to convert:', selectedItems.length, selectedItems.map(i => ({ id: i.id, type: i.type })));
    
    // Helper to infer MIME type from media type
    const inferMimeType = (type: string, existingMime?: string): string => {
      if (existingMime && existingMime !== 'application/octet-stream') {
        return existingMime;
      }
      
      switch (type) {
        case 'video':
          return 'video/mp4';
        case 'audio':
          return 'audio/mpeg';
        case 'photo':
          return 'image/jpeg';
        default:
          return 'application/octet-stream';
      }
    };
    
    // Helper to convert base64 to blob
    const base64ToBlob = (base64: string, mediaType: string): Blob => {
      const arr = base64.split(',');
      let mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
      
      // If MIME type couldn't be detected, infer from media type
      mime = inferMimeType(mediaType, mime);
      
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    };

    // Helper to fetch blob from URL
    const urlToBlob = async (url: string, mimeType: string): Promise<Blob> => {
      const response = await fetch(url);
      return await response.blob();
    };

    const mediaItems: MediaItem[] = await Promise.all(
      selectedItems.map(async (item) => {
        try {
          let blob: Blob;
          let url: string;
          
          // Check if base64Data is actually a URL (from backend) or base64 (from localStorage)
          if (item.base64Data.startsWith('http')) {
            // It's a URL from backend - fetch it
            blob = await urlToBlob(item.base64Data, item.mimeType);
            url = item.base64Data; // Use the URL directly
          } else {
            // It's base64 from localStorage - convert it
            blob = base64ToBlob(item.base64Data, item.type);
            url = URL.createObjectURL(blob);
          }
          
          return {
            id: item.id,
            type: item.type,
            url,
            blob,
            timestamp: item.timestamp,
            thumbnail: item.thumbnail
          } as MediaItem;
        } catch (err) {
          console.error('Failed to convert item to MediaItem:', item.id, err);
          return null;
        }
      })
    );

    const validMediaItems = mediaItems.filter(item => item !== null) as MediaItem[];

    console.log('✅ [LIBRARY] Converted library items to media items:', validMediaItems.length);
    console.log('✅ [LIBRARY] Valid media items:', validMediaItems.map(i => ({ id: i.id, type: i.type, hasUrl: !!i.url, hasBlob: !!i.blob })));

    // Delete unselected items
    const unselectedItems = libraryItems.filter(item => !selectedIds.has(item.id));
    if (unselectedItems.length > 0) {
      console.log('🗑️ [LIBRARY] Deleting', unselectedItems.length, 'unselected items');
      await deleteItems(unselectedItems.map(item => item.id));
    }

    console.log('📤 [LIBRARY] Calling onSelect with', validMediaItems.length, 'items');
    onSelect(validMediaItems);
    console.log('✅ [LIBRARY] onSelect called successfully');
  };

  const deleteItems = async (recordIds: string[]) => {
    if (recordIds.length === 0) return;

    // Always delete from localStorage first
    try {
      const stored = localStorage.getItem('recordLibrary');
      if (stored) {
        const library = JSON.parse(stored);
        const filtered = library.filter(item => !recordIds.includes(item.id));
        localStorage.setItem('recordLibrary', JSON.stringify(filtered));
        console.log(`✅ Deleted ${recordIds.length} items from localStorage`);
      }
    } catch (localErr) {
      console.error('Failed to delete from localStorage:', localErr);
    }

    // Try to delete from backend (but don't block on it)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log(`☁️ Syncing deletion of ${recordIds.length} items to backend...`);
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/record-library`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ recordIds })
          }
        );

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Synced deletion of ${result.deleted} items to backend`);
        } else if (response.status === 401 || response.status === 403) {
          console.warn('⚠️ Backend deletion permission denied - localStorage deletion completed');
        } else {
          console.warn(`⚠️ Backend deletion failed (${response.status}) - localStorage deletion completed`);
        }
      }
    } catch (err) {
      console.warn('⚠️ Backend deletion error - localStorage deletion completed:', err);
      // Don't throw - localStorage deletion already succeeded
      try {
        const stored = localStorage.getItem('recordLibrary');
        if (stored) {
          const library = JSON.parse(stored);
          const filtered = library.filter(item => !recordIds.includes(item.id));
          localStorage.setItem('recordLibrary', JSON.stringify(filtered));
        }
      } catch (localErr) {
        console.error('Failed to delete from localStorage:', localErr);
      }
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'photo':
        return <Image className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'audio':
        return <Mic className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Record Library</h1>
            <p className="text-sm text-muted-foreground">
              Select media to use, unselected items will be permanently deleted
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {libraryItems.length} {libraryItems.length === 1 ? 'item' : 'items'}
          </Badge>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card className="py-16">
            <CardContent className="text-center space-y-4">
              <div className="inline-block p-6 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse">
                <Image className="w-12 h-12 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Loading library...</h3>
                <p className="text-sm text-muted-foreground">
                  Syncing your media across devices
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && libraryItems.length === 0 && (
          <Card className="py-16">
            <CardContent className="text-center space-y-4">
              <div className="inline-block p-6 rounded-full bg-gray-100 dark:bg-gray-800">
                <Image className="w-12 h-12 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">No saved media</h3>
                <p className="text-sm text-muted-foreground">
                  Record something and choose "Keep Recording" to save it here
                </p>
              </div>
              <Button onClick={onBack} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Camera
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Library Grid */}
        {!isLoading && libraryItems.length > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {libraryItems.map((item) => (
                <Card
                  key={item.id}
                  className={`relative cursor-pointer transition-all hover:shadow-lg ${
                    selectedIds.has(item.id) 
                      ? 'ring-2 ring-purple-500 shadow-lg' 
                      : 'hover:ring-2 hover:ring-gray-300'
                  }`}
                  onClick={() => toggleSelect(item.id)}
                >
                  <CardContent className="p-0">
                    {/* Checkbox */}
                    <div className="absolute top-2 left-2 z-10">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedIds.has(item.id)
                          ? 'bg-purple-600 border-purple-600'
                          : 'bg-white/80 border-white backdrop-blur-sm'
                      }`}>
                        {selectedIds.has(item.id) && (
                          <CheckCircle className="w-5 h-5 text-white" />
                        )}
                      </div>
                    </div>

                    {/* Media Preview */}
                    <div className="aspect-square bg-gray-900 overflow-hidden rounded-t-lg">
                      {item.type === 'photo' && (
                        <img
                          src={item.thumbnail || item.base64Data}
                          alt="Photo thumbnail"
                          className="w-full h-full object-cover"
                        />
                      )}
                      
                      {item.type === 'video' && item.thumbnail && (
                        <div className="relative w-full h-full">
                          <img
                            src={item.thumbnail}
                            alt="Video thumbnail"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <div className="p-3 rounded-full bg-white/90">
                              <Video className="w-6 h-6 text-gray-900" />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {item.type === 'audio' && (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
                          <Mic className="w-12 h-12 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Item Info */}
                    <div className="p-3 space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        {getIcon(item.type)}
                        <span className="font-medium capitalize">{item.type}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(item.timestamp)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Action Buttons */}
            <Card className="sticky bottom-4 shadow-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 text-sm">
                    <p className="font-medium">
                      {selectedIds.size} selected
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {libraryItems.length - selectedIds.size} will be deleted
                    </p>
                  </div>
                  
                  <Button
                    onClick={handleUseSelected}
                    disabled={selectedIds.size === 0}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Use Selected ({selectedIds.size})
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Delete Warning Dialog */}
      <AlertDialog open={showDeleteWarning} onOpenChange={setShowDeleteWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Permanently Delete Unused Media?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  You have selected <strong>{selectedIds.size}</strong> item(s) to use.
                </p>
                <p className="text-orange-600 dark:text-orange-400 font-medium">
                  The remaining <strong>{libraryItems.length - selectedIds.size}</strong> unselected item(s) will be permanently deleted and cannot be recovered.
                </p>
                <p className="text-sm">
                  Are you sure you want to continue?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={proceedWithSelection}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete & Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
