import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft, Folder, Image as ImageIcon, Video, Mic, Trash2, Wand2, Sparkles, Check, FolderOpen, Grid3x3, FolderPlus, FileText, Upload, Loader2, CheckCircle, ChevronDown, Download, Edit3 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger } from './ui/select';
import { Input } from './ui/input';
import { useIsMobile } from './ui/use-mobile';

interface LibraryItem {
  id: string;
  type: 'photo' | 'video' | 'audio' | 'document';
  base64Data: string;
  timestamp: number;
  thumbnail?: string;
  mimeType: string;
  duration?: number;
  fileName?: string; // Custom filename for documents
  name?: string; // Name property for media items
}

interface FolderData {
  id: string;
  name: string;
  color?: string;
  mediaIds?: string[];
  icon?: string; // Emoji or icon identifier
  description?: string; // Folder description
  isTemplateFolder?: boolean; // Whether this was created from a template
}

interface FolderOverlayProps {
  folder: FolderData;
  items: LibraryItem[];
  onClose: () => void;
  onItemPreview: (item: LibraryItem) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onUseMedia?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onClearSelection?: () => void;
  onMoveToFolder?: (folderId: string | null) => void;
  folders?: FolderData[];
  onUploadToFolder?: (files: FileList | null, folderId: string) => void;
  isUploading?: boolean;
  importedMediaIds?: Set<string>; // IDs of media already imported to current capsule
  onExportFolder?: () => void; // NEW: Download folder handler
  onSaveMediaName?: (itemId: string, newName: string) => Promise<boolean>; // NEW: Save media name handler
}

const COLOR_SCHEMES = {
  blue: { bg: 'from-blue-500/20 to-blue-600/20', border: 'border-blue-400/30', text: 'text-blue-400' },
  purple: { bg: 'from-purple-500/20 to-purple-600/20', border: 'border-purple-400/30', text: 'text-purple-400' },
  pink: { bg: 'from-pink-500/20 to-pink-600/20', border: 'border-pink-400/30', text: 'text-pink-400' },
  green: { bg: 'from-green-500/20 to-green-600/20', border: 'border-green-400/30', text: 'text-green-400' },
  yellow: { bg: 'from-yellow-500/20 to-yellow-600/20', border: 'border-yellow-400/30', text: 'text-yellow-400' },
  orange: { bg: 'from-orange-500/20 to-orange-600/20', border: 'border-orange-400/30', text: 'text-orange-400' },
  red: { bg: 'from-red-500/20 to-red-600/20', border: 'border-red-400/30', text: 'text-red-400' },
  slate: { bg: 'from-slate-500/20 to-slate-600/20', border: 'border-slate-400/30', text: 'text-slate-400' },
};

function FolderOverlayContent({
  folder,
  items,
  onClose,
  onItemPreview,
  selectedIds = new Set(),
  onToggleSelect,
  onUseMedia,
  onEdit,
  onDelete,
  onClearSelection,
  onMoveToFolder,
  folders = [],
  onUploadToFolder,
  isUploading = false,
  importedMediaIds,
  onExportFolder,
  onSaveMediaName
}: FolderOverlayProps) {
  const isMobile = useIsMobile();
  const colorScheme = COLOR_SCHEMES[folder.color as keyof typeof COLOR_SCHEMES] || COLOR_SCHEMES.blue;
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [showFolderMenu, setShowFolderMenu] = React.useState(false);
  const folderMenuRef = React.useRef<HTMLDivElement>(null);
  
  // State for inline editing
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  // 🐛 DEBUG: Log when items change
  useEffect(() => {
    console.log('📁 [FOLDER OVERLAY] Received items changed!');
    console.log('📁 Items count:', items.length);
    console.log('📁 Item IDs:', items.map(i => i.id));
  }, [items]);

  // Prevent body scroll when overlay is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Close folder menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (folderMenuRef.current && !folderMenuRef.current.contains(event.target as Node)) {
        setShowFolderMenu(false);
      }
    }

    if (showFolderMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFolderMenu]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'photo': return <ImageIcon className="w-3.5 h-3.5 text-white" />;
      case 'video': return <Video className="w-3.5 h-3.5 text-white" />;
      case 'audio': return <Mic className="w-3.5 h-3.5 text-white" />;
      case 'document': return <FileText className="w-3.5 h-3.5 text-white" />;
      default: return null;
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handler for saving renamed media
  const handleSaveRename = async (itemId: string, newName: string) => {
    if (!onSaveMediaName) return;
    
    const saved = await onSaveMediaName(itemId, newName);
    if (saved) {
      setEditingItemId(null);
      setEditingName('');
    }
  };
  
  // Auto-focus input when editing starts
  useEffect(() => {
    if (editingItemId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingItemId]);

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col"
      style={{ colorScheme: 'dark' }}
    >
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-fuchsia-900/15 rounded-full blur-3xl" />
      </div>

      {/* Header - AGGRESSIVE POSITIONING: Close button ALWAYS on right with X icon */}
      <div className="relative z-10 flex items-center gap-3 p-4 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${colorScheme.bg} border ${colorScheme.border}`}>
          {folder.icon ? (
            // Custom emoji icon for template/permanent folders
            <span className="text-2xl leading-none block" role="img" aria-label={folder.name}>
              {folder.icon}
            </span>
          ) : (
            // Default folder icon
            <Folder className={`w-5 h-5 ${colorScheme.text}`} />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-white truncate">{folder.name}</h2>
          <p className="text-xs text-slate-400">
            {items.length === 0 ? 'Empty folder' : `${items.length} ${items.length === 1 ? 'item' : 'items'}`}
          </p>
        </div>
        
        {/* Upload button for folder */}
        {onUploadToFolder && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/webm,video/ogg,audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm,audio/aac"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  onUploadToFolder(e.target.files, folder.id);
                  // Reset input so same file can be selected again
                  e.target.value = '';
                }
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              title={`Upload to ${folder.name}`}
              className="shrink-0 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                width: '40px',
                height: '40px',
                padding: 0,
                border: 'none',
                borderRadius: '8px',
                backgroundColor: isUploading ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
                color: 'white',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                if (!isUploading) {
                  e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isUploading) {
                  e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                }
              }}
            >
              {isUploading ? (
                <svg 
                  className="animate-spin" 
                  style={{ width: '20px', height: '20px' }}
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg
                  style={{ width: '20px', height: '20px', strokeWidth: '2' }}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
              )}
            </button>
          </>
        )}
        
        {/* Download button for folder */}
        {onExportFolder && items.length > 0 && (
          <button
            onClick={onExportFolder}
            title={`Download ${folder.name}`}
            className="shrink-0 flex items-center justify-center"
            style={{
              width: '40px',
              height: '40px',
              padding: 0,
              border: 'none',
              borderRadius: '8px',
              backgroundColor: 'rgba(99, 102, 241, 0.2)',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.2)';
            }}
          >
            <Download className="w-5 h-5" />
          </button>
        )}
        
        {/* CLOSE BUTTON - NUCLEAR FIX: RAW BUTTON WITH EXPLICIT STYLES */}
        <button
          onClick={onClose}
          title="Close"
          className="shrink-0 ml-auto flex items-center justify-center"
          style={{
            width: '40px',
            height: '40px',
            padding: 0,
            border: 'none',
            borderRadius: '8px',
            backgroundColor: 'transparent',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(127, 29, 29, 0.3)';
            e.currentTarget.style.color = '#fb7185';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'white';
          }}
        >
          <X 
            className="shrink-0" 
            style={{ 
              width: '24px', 
              height: '24px', 
              strokeWidth: '2.5',
              display: 'block'
            }} 
          />
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="inline-flex p-6 rounded-full bg-slate-800/50 border border-slate-700 mb-4">
              {folder.icon ? (
                <span className="text-5xl leading-none block" role="img" aria-label={folder.name}>
                  {folder.icon}
                </span>
              ) : (
                <Folder className="w-12 h-12 text-slate-500" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Empty Folder</h3>
            <p className="text-sm text-slate-400 mb-4">
              {onUploadToFolder 
                ? 'Upload files directly to this folder or move items from your vault' 
                : 'Move media items here to organize your vault'}
            </p>
            {onUploadToFolder && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload Files</span>
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
            {items.map((item) => (
              <Card
                key={item.id}
                className={`relative overflow-hidden backdrop-blur-md transition-all duration-200 cursor-pointer group/item ${
                  selectedIds.has(item.id)
                    ? 'ring-2 ring-purple-400 shadow-lg shadow-purple-500/40 bg-slate-800 border-purple-400'
                    : 'hover:ring-2 hover:ring-purple-400/50 hover:shadow-lg hover:shadow-purple-500/30 bg-slate-900 border-slate-800 shadow-sm'
                }`}
                onClick={() => {
                  console.log('🖼️ Opening preview for item from folder:', item.id);
                  onItemPreview(item);
                }}
              >
                <CardContent className="p-0">
                  {/* ✅ REMOVED: Already Imported Badge - Left checkbox already shows imported status */}
                  
                  {/* Media Preview - SMALLER THUMBNAILS */}
                  <div className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden relative">
                    {/* Thumbnail - FORCED CONTAINMENT */}
                    {item.thumbnail ? (
                      <img 
                        src={item.thumbnail}
                        alt={item.type}
                        className="w-full h-full object-cover"
                        style={{ objectFit: 'cover', maxWidth: '100%', maxHeight: '100%' }}
                      />
                    ) : item.type === 'photo' ? (
                      <img 
                        src={item.base64Data}
                        alt="Photo"
                        className="w-full h-full object-cover"
                        style={{ objectFit: 'cover', maxWidth: '100%', maxHeight: '100%' }}
                      />
                    ) : item.type === 'video' ? (
                      <video 
                        src={item.base64Data}
                        className="w-full h-full object-cover"
                        style={{ objectFit: 'cover', maxWidth: '100%', maxHeight: '100%' }}
                        muted
                      />
                    ) : item.type === 'document' ? (
                      <div className="w-full h-full flex items-center justify-center bg-amber-600">
                        <FileText className="w-5 h-5 text-white drop-shadow-lg" />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-purple-600">
                        <Mic className="w-5 h-5 text-white drop-shadow-lg" />
                      </div>
                    )}

                    {/* Duration Badge */}
                    {item.duration && (
                      <div className="absolute bottom-1 left-1 z-10">
                        <Badge 
                          variant="secondary" 
                          className="text-[10px] px-1 py-0 bg-black/70 text-white border-white/30 backdrop-blur-sm"
                        >
                          {formatDuration(item.duration)}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Item Info */}
                  <div className="p-1.5 bg-gradient-to-t from-black/95 via-black/70 to-transparent backdrop-blur-sm">
                    {/* Display mode - Always show, no inline editing */}
                    <div className="text-[10px] text-white space-y-0.5">
                      {/* Title Row */}
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="font-medium truncate flex-1 min-w-0" title={item.fileName || item.name || item.type}>
                          {item.fileName || item.name || item.type}
                        </span>
                        {/* Desktop: Pencil inline on hover */}
                        {onSaveMediaName && !isMobile && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingItemId(item.id);
                              setEditingName(item.fileName || item.name || item.type);
                            }}
                            className="opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0 p-0.5 hover:bg-white/20 rounded"
                            title="Rename"
                          >
                            <Edit3 className="w-2.5 h-2.5 text-white stroke-2" />
                          </button>
                        )}
                      </div>
                      {/* Mobile: Pencil on separate row */}
                      {onSaveMediaName && isMobile && (
                        <div className="flex items-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingItemId(item.id);
                              setEditingName(item.fileName || item.name || item.type);
                            }}
                            className="shrink-0 px-0.5 py-0 h-2 hover:bg-white/20 rounded flex items-center justify-center"
                            title="Rename"
                          >
                            <Edit3 className="w-2 h-2 text-purple-400" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selection Checkbox */}
                  {onToggleSelect && (
                    <div 
                      className="absolute top-1 left-1 z-10 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelect(item.id);
                      }}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all backdrop-blur-sm shadow-lg ${
                        selectedIds.has(item.id) || importedMediaIds?.has(item.id)
                          ? 'bg-gradient-to-br from-purple-500 to-fuchsia-600 border-purple-400 shadow-purple-500/50'
                          : 'bg-slate-900/80 border-purple-400/60 shadow-purple-500/30'
                      }`}>
                        {(selectedIds.has(item.id) || importedMediaIds?.has(item.id)) && (
                          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Action Menu - Sticky Bottom Bar */}
      {selectedIds.size > 0 && (
        <div className="relative z-20 p-4 border-t border-slate-700/50 bg-slate-900/98 backdrop-blur-md">
          <Card className="bg-slate-900/98 border-slate-700 shadow-2xl">
            <CardContent className="p-2.5">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <p className="text-sm font-bold">{selectedIds.size} Selected</p>
                    <p className="text-xs text-slate-300">Choose an action</p>
                  </div>
                  {onClearSelection && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClearSelection}
                      className="text-white shrink-0 hover:bg-slate-800"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  {/* First Row - Use Media and Move to */}
                  <div className={`grid gap-2 ${onUseMedia ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {onUseMedia && (
                      <Button
                        onClick={onUseMedia}
                        className="h-10 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/50 transition-all hover:scale-105"
                      >
                        <Sparkles className="w-4 h-4 mr-1.5 shrink-0" />
                        <span className="text-xs whitespace-nowrap">Use Media</span>
                      </Button>
                    )}
                    
                    {onMoveToFolder && (
                      <div ref={folderMenuRef} className="relative">
                        <button
                          onClick={() => setShowFolderMenu(!showFolderMenu)}
                          className="flex items-center justify-center gap-0 shadow-md transition-all w-full"
                          style={{
                            height: '40px',
                            minHeight: '40px',
                            maxHeight: '40px',
                            paddingLeft: '12px',
                            paddingRight: '12px',
                            paddingTop: '0',
                            paddingBottom: '0',
                            color: 'white',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: 'rgba(34, 211, 238, 0.5)',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(6, 182, 212, 0.2)',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.3)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.2)';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          <div className="flex items-center justify-between gap-2 w-full">
                            <div className="flex items-center gap-1.5">
                              <FolderOpen style={{ width: '16px', height: '16px', color: 'white' }} className="shrink-0" />
                              <span style={{ fontSize: '12px', whiteSpace: 'nowrap', fontWeight: '500', color: 'white' }}>
                                {folders.length > 0 ? 'Move to' : 'Create folder'}
                              </span>
                            </div>
                            <ChevronDown 
                              style={{ 
                                width: '16px', 
                                height: '16px', 
                                color: 'white',
                                transition: 'transform 0.2s',
                                transform: showFolderMenu ? 'rotate(180deg)' : 'rotate(0deg)'
                              }} 
                              className="shrink-0" 
                            />
                          </div>
                        </button>

                        {/* Custom Dropdown Menu */}
                        {showFolderMenu && (
                          <div
                            className="absolute bottom-full left-0 right-0 mb-2 rounded-md shadow-lg overflow-hidden"
                            style={{
                              maxHeight: '200px',
                              overflowY: 'auto',
                              backgroundColor: 'rgb(30, 41, 59)',
                              border: '1px solid rgb(51, 65, 85)',
                              zIndex: 1000,
                            }}
                          >
                            {folders.length > 0 ? (
                              <>
                                {folders.map((f) => {
                                  // Check if this is a PERMANENT system folder (Photos, Videos, Audio, Documents)
                                  const PERMANENT_FOLDERS = ['Photos', 'Videos', 'Audio', 'Documents'];
                                  const isPermanentFolder = PERMANENT_FOLDERS.includes(f.name);
                                  
                                  let folderType = '';
                                  if (isPermanentFolder) {
                                    if (f.name === 'Photos') folderType = '📷 Photos only';
                                    else if (f.name === 'Videos') folderType = '🎥 Videos only';
                                    else if (f.name === 'Audio') folderType = '🎵 Audio only';
                                    else if (f.name === 'Documents') folderType = '📄 Documents only';
                                  }
                                  
                                  return (
                                    <button
                                      key={f.id}
                                      onClick={() => {
                                        onMoveToFolder(f.id);
                                        setShowFolderMenu(false);
                                      }}
                                      className="w-full text-left transition-colors"
                                      style={{
                                        padding: '8px 12px',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        color: 'white',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        display: 'block',
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                      }}
                                    >
                                      <div className="flex items-center justify-between gap-3 w-full">
                                        <div className="flex items-center gap-2">
                                          <Folder className="w-4 h-4" />
                                          {f.name}
                                        </div>
                                        {isPermanentFolder && (
                                          <span style={{ fontSize: '12px', color: 'rgb(148, 163, 184)' }}>
                                            {folderType}
                                          </span>
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                                <button
                                  onClick={() => {
                                    onMoveToFolder(null);
                                    setShowFolderMenu(false);
                                  }}
                                  className="w-full text-left transition-colors"
                                  style={{
                                    padding: '8px 12px',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderTop: '1px solid rgb(51, 65, 85)',
                                    color: 'white',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    display: 'block',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <Grid3x3 className="w-4 h-4" />
                                    Unsorted
                                  </div>
                                </button>
                              </>
                            ) : (
                              <div
                                className="w-full text-center"
                                style={{
                                  padding: '12px',
                                  color: 'rgb(148, 163, 184)',
                                  fontSize: '14px',
                                }}
                              >
                                <div className="flex items-center justify-center gap-2">
                                  <FolderPlus className="w-4 h-4" />
                                  Create a folder first
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Second Row - Enhance and Delete */}
                  <div className={`grid gap-2 ${onEdit ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {onEdit && (
                      <Button
                        onClick={onEdit}
                        variant="outline"
                        disabled={selectedIds.size === 0}
                        className="h-10 disabled:opacity-50 shadow-md transition-all hover:scale-105 border-purple-400/50 bg-purple-500/20 text-white hover:bg-purple-500/30"
                      >
                        <Wand2 className="w-4 h-4 mr-1.5 shrink-0" />
                        <span className="text-xs whitespace-nowrap">
                          {selectedIds.size > 1 ? `Enhance (${selectedIds.size})` : 'Enhance'}
                        </span>
                      </Button>
                    )}
                    
                    {onDelete && (
                      <Button
                        onClick={onDelete}
                        variant="outline"
                        className="h-10 shadow-md shadow-red-500/30 transition-all hover:scale-105 border-red-400/60 bg-red-500/20 text-red-100 hover:bg-red-500/30"
                      >
                        <Trash2 className="w-4 h-4 mr-1.5 shrink-0" />
                        <span className="text-xs whitespace-nowrap">Delete</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Centered Editing Modal - Mobile + Desktop */}
      {editingItemId && onSaveMediaName && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              // Click outside - save changes
              const item = items.find(i => i.id === editingItemId);
              if (item && editingName.trim() && editingName !== (item.fileName || item.name || item.type)) {
                handleSaveRename(editingItemId, editingName);
              } else {
                setEditingItemId(null);
                setEditingName('');
              }
            }
          }}
        >
          <div className="w-full max-w-md bg-slate-800 rounded-lg border border-purple-400 shadow-2xl shadow-purple-500/50 p-4">
            <label className="block text-sm text-slate-300 mb-2">Edit Name</label>
            <input
              ref={inputRef}
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveRename(editingItemId, editingName);
                } else if (e.key === 'Escape') {
                  setEditingItemId(null);
                  setEditingName('');
                }
                e.stopPropagation();
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full px-3 py-2 text-base bg-slate-700 text-white border border-purple-400 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveRename(editingItemId, editingName);
                }}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white rounded-lg hover:from-purple-600 hover:to-fuchsia-700 transition-all"
              >
                Save
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingItemId(null);
                  setEditingName('');
                }}
                className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export function FolderOverlay(props: FolderOverlayProps) {
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <FolderOverlayContent {...props} />,
    document.body
  );
}