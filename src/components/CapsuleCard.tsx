import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { CheckCircle, Clock, User, Mail, Phone, Instagram, Twitter, Facebook, MoreVertical, Edit, Wand2, Trash2, Eye, Mic, AlertCircle } from 'lucide-react';
import { format } from 'date-fns@4.1.0';
import { toast } from 'sonner';

// ✅ EXACT SAME PROPS INTERFACE - NO CHANGES
interface CapsuleCardProps {
  capsule: any;
  isSelected: boolean;
  onToggleSelect: () => void;
  onClick?: () => void;
  formatRelativeDeliveryTime: (date: string, time: string, timezone: string, status: string) => string;
  getRecipientInfo: (capsule: any) => any;
  getStatusDisplay: (status: string) => any;
  expandedMediaCapsules: Set<string>;
  onToggleMediaExpand: (id: string) => void;
  onMediaClick: (media: any, index: number, allMedia: any[]) => void;
  onEditDetails?: (capsule: any) => void;
  onEditCapsule?: (capsule: any) => void;
  onDelete?: (id: string) => void;
  canEditCapsule?: (capsule: any) => boolean;
  onFavoriteToggle?: () => void;
  isFavorite?: boolean;
  currentFolder?: string | null; // Add currentFolder prop
}

// ✅ KEPT: React.memo for performance
export const CapsuleCard = React.memo<CapsuleCardProps>(({
  capsule,
  isSelected,
  onToggleSelect,
  onClick,
  formatRelativeDeliveryTime,
  getRecipientInfo,
  getStatusDisplay,
  expandedMediaCapsules,
  onToggleMediaExpand,
  onMediaClick,
  onEditDetails,
  onEditCapsule,
  onDelete,
  canEditCapsule,
  onFavoriteToggle,
  isFavorite,
  currentFolder
}) => {
  // ✅ KEPT: All computed values
  const statusDisplay = getStatusDisplay(capsule.status);
  const StatusIcon = statusDisplay.icon;
  const isExpanded = expandedMediaCapsules.has(capsule.id);
  
  // ✅ NEW: Detect failed drafts (capsules that failed delivery)
  const isFailedDraft = capsule.failure_reason != null;
  
  // ✅ NEW: Simplified status colors (SOLID ONLY - NO GRADIENTS)
  const getStatusColor = (status: string) => {
    // ✅ Override color for failed drafts
    if (isFailedDraft) return 'red-500';
    
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return 'blue-500';
      case 'delivered':
        return 'emerald-500';
      case 'received':
        return 'yellow-400'; // Gold for treasure! ✨
      case 'draft':
        return 'purple-500';
      default:
        return 'slate-500';
    }
  };

  const statusColor = getStatusColor(capsule.status);
  
  // ✅ KEPT: isNew logic (exact same)
  const isNew = capsule.isReceived && 
    !capsule.viewed_at && 
    capsule.delivery_date &&
    (Date.now() - new Date(capsule.delivery_date).getTime()) < (14 * 24 * 60 * 60 * 1000);

  // ✅ NEW: Helper for media type detection (copied from original)
  const detectMediaType = (media: any) => {
    let type = media.type || media.media_type || media.content_type || '';
    
    if (!type || type === 'application/octet-stream' || type === 'unknown') {
      const url = media.url || media.file_url || media.name || '';
      const urlLower = url.toLowerCase();
      
      if (urlLower.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg|heic|heif)(\?|$)/i)) {
        type = 'image/jpeg';
      } else if (urlLower.match(/\.(mp4|mov|avi|webm|mkv|m4v|3gp)(\?|$)/i)) {
        type = 'video/mp4';
      } else if (urlLower.match(/\.(mp3|wav|m4a|aac|ogg|flac|wma)(\?|$)/i)) {
        type = 'audio/mpeg';
      }
    }
    
    return type;
  };

  return (
    <Card 
      data-capsule-card
      className={`
        relative overflow-hidden flex min-h-[140px]
        transition-all duration-200 ease-out cursor-pointer
        bg-slate-800/90 hover:bg-slate-800/95
        border border-slate-700/50
        ${isFailedDraft ? 'border-l-4 border-l-red-500' : ''} 
        rounded-lg
        ${isSelected ? 'ring-2 ring-offset-2 ring-offset-slate-950' : 'hover:shadow-lg'}
      `}
      style={{
        touchAction: 'pan-y',
        ...(isSelected && {
          '--tw-ring-color': statusColor === 'blue-500' ? '#3b82f6' :
                             statusColor === 'emerald-500' ? '#10b981' :
                             statusColor === 'yellow-400' ? '#facc15' :
                             statusColor === 'purple-500' ? '#a855f7' : '#64748b',
          boxShadow: `0 0 0 2px var(--tw-ring-offset-color, #0a0a0f), 0 0 0 calc(2px + 2px) var(--tw-ring-color)`
        } as React.CSSProperties)
      }}
      onClick={(e) => {
        // ✅ KEPT: Exact same onClick logic
        if (onClick) {
          onClick();
        } else {
          onToggleSelect();
        }
      }}
    >
      {/* ✅ NEW: Status Panel - Left side solid color */}
      <div 
        className="w-[60px] flex-shrink-0 flex items-center justify-center transition-all duration-200"
        style={{
          // Inline styles for dynamic colors (Tailwind can't do dynamic)
          backgroundColor: statusColor === 'blue-500' ? '#3b82f6' :
                          statusColor === 'emerald-500' ? '#10b981' :
                          statusColor === 'yellow-400' ? '#facc15' :
                          statusColor === 'purple-500' ? '#a855f7' : '#64748b'
        }}
      >
        <StatusIcon className="w-7 h-7 text-white drop-shadow-md" />
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 relative flex flex-col justify-between min-w-0">
        {/* ✅ KEPT: Quick Actions Menu - TOP RIGHT */}
        {!isSelected && (
          <div 
            className="absolute top-2 right-2 z-10"
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger 
                asChild 
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg bg-black/60 hover:bg-black/80 border border-white/20 hover:border-white/40 shadow-lg transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                >
                  <MoreVertical className="h-4 w-4 text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-44 bg-slate-900/95 border-slate-700/50 z-[9999]"
                onClick={(e) => e.stopPropagation()}
                sideOffset={8}
              >
                {/* ✅ KEPT: View Details */}
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onClick) {
                      onClick();
                    } else {
                      onToggleSelect();
                    }
                  }}
                  className="cursor-pointer hover:bg-slate-800/80 text-white focus:bg-slate-800 focus:text-white"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                
                {/* ✅ KEPT: Edit options (exact same conditional logic) */}
                {!capsule.isReceived && (
                  <>
                    {canEditCapsule?.(capsule) ? (
                      <>
                        <DropdownMenuSeparator className="bg-slate-700/50" />
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditDetails?.(capsule);
                          }}
                          className="cursor-pointer hover:bg-slate-800/80 text-white focus:bg-slate-800 focus:text-white"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      </>
                    ) : capsule.status === 'scheduled' && (
                      <>
                        <DropdownMenuSeparator className="bg-slate-700/50" />
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.error('Cannot edit capsule within 1 minute of scheduled delivery time', {
                              description: 'This capsule is locked and will be delivered soon.'
                            });
                          }}
                          className="cursor-not-allowed opacity-50 text-slate-500"
                          disabled
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit (Locked)
                        </DropdownMenuItem>
                      </>
                    )}
                  </>
                )}
                
                {/* ✅ KEPT: Delete/Remove */}
                <DropdownMenuSeparator className="bg-slate-700/50" />
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(capsule.id);
                  }}
                  className="cursor-pointer hover:bg-red-950/50 text-red-400 hover:text-red-300 focus:bg-red-950/50 focus:text-red-300"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {capsule.isReceived ? 'Remove' : 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Title */}
        <div>
          <h3 className="text-base font-semibold text-white line-clamp-2 pr-8 mb-1">
            {(() => {
              const title = capsule.title || 'Untitled Capsule';
              if (typeof window !== 'undefined' && window.innerWidth < 640) {
                const words = title.trim().split(/\s+/);
                if (words.length <= 10) return title;
                return words.slice(0, 10).join(' ') + '...';
              }
              return title;
            })()}
          </h3>
          
          {/* ✅ NEW: Failed Draft Error Box */}
          {isFailedDraft && (
            <div className="mb-3 p-2.5 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0 text-xs">
                  <p className="font-semibold text-red-900 dark:text-red-100 mb-0.5">
                    Delivery Failed
                  </p>
                  <p className="text-red-700 dark:text-red-300 mb-1">
                    {/* User-friendly error message */}
                    {(() => {
                      const error = capsule.failure_reason || '';
                      if (error.includes('invalid email') || error.includes('recipient')) {
                        return "Invalid recipient email address";
                      } else if (error.includes('network') || error.includes('timeout')) {
                        return "Network connection issue";
                      } else if (error.includes('sandbox') || error.includes('domain')) {
                        return "Email service configuration issue";
                      } else {
                        return error.length > 60 ? error.substring(0, 60) + '...' : error;
                      }
                    })()}
                  </p>
                  
                  {/* ✅ Show media preservation status */}
                  {capsule.media_files?.length > 0 && (
                    <p className="text-green-700 dark:text-green-400 mb-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {capsule.media_files.length} media file{capsule.media_files.length > 1 ? 's' : ''} preserved
                    </p>
                  )}
                  
                  {capsule.original_delivery_date && (
                    <p className="text-red-600 dark:text-red-400">
                      Was scheduled: {format(new Date(capsule.original_delivery_date), 'MMM d, h:mm a')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ✅ KEPT: Metadata */}
          <div className="flex flex-col gap-1 text-xs text-slate-400">
            {/* Date */}
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                {(() => {
                  if (!capsule.delivery_date) return 'No delivery date';
                  
                  if (capsule.status === 'scheduled') {
                    try {
                      const deliveryDateTime = new Date(capsule.delivery_date);
                      const userTimeZone = capsule.time_zone || Intl.DateTimeFormat().resolvedOptions().timeZone;
                      
                      return deliveryDateTime.toLocaleString('en-US', {
                        timeZone: userTimeZone,
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      });
                    } catch (error) {
                      return format(new Date(capsule.delivery_date), 'MMM d, yyyy');
                    }
                  }
                  
                  const relativeTime = formatRelativeDeliveryTime(capsule.delivery_date, capsule.delivery_time, capsule.timezone, capsule.status);
                  return relativeTime || format(new Date(capsule.delivery_date), 'MMM d, yyyy');
                })()}
              </span>
            </div>

            {/* Recipient/Sender */}
            {capsule.isReceived ? (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">From: {capsule.sender_name || 'Unknown'}</span>
              </div>
            ) : (() => {
              const recipientInfo = getRecipientInfo(capsule);
              if (!recipientInfo) return null;
              
              return (
                <div className="flex items-center gap-1">
                  <span className="flex-shrink-0">{recipientInfo.icon}</span>
                  <span className="truncate" title={recipientInfo.allRecipients?.join(', ') || recipientInfo.display}>
                    To: {recipientInfo.display}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* ✅ KEPT: Stats */}
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {(capsule.media_files?.length || capsule.attachments?.length) ? (
              <span>📎 {capsule.media_files?.length || capsule.attachments?.length}</span>
            ) : null}
            {capsule.echoes?.length ? (
              <span>💬 {capsule.echoes.length}</span>
            ) : null}
            {capsule.voice_note_url && (
              <span>🎤</span>
            )}
          </div>

          {/* ✅ Only show NEW badge in footer - removed status badge */}
          <div className="flex items-center gap-2">
            {isNew && (
              <Badge 
                variant="secondary" 
                className="text-[10px] px-2 py-0.5 text-white border-0 animate-pulse"
                style={{ background: 'linear-gradient(135deg, #ec4899, #f43f5e)' }}
              >
                🆕 NEW
              </Badge>
            )}
          </div>
        </div>

        {/* ✅ KEPT: Media Thumbnails Preview */}
        {(() => {
          const mediaToShow = capsule.media_files || capsule.attachments || [];
          if (mediaToShow.length > 0) {
            const maxPreview = 1;  // ⚡ OPTIMIZED: Show only 1 thumbnail initially (was 3) - 3x faster loading!
            const previewMedia = mediaToShow.slice(0, maxPreview);
            const remaining = mediaToShow.length - maxPreview;
            
            return (
              <div className="mt-2 flex gap-1.5 flex-wrap">
                {previewMedia.map((media: any, index: number) => {
                  const mediaType = detectMediaType(media);
                  const mediaUrl = media.url || media.file_url;
                  
                  return (
                    <div
                      key={index}
                      className="w-12 h-12 rounded-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-white/50 transition-all bg-slate-800/50 relative"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMediaClick(media, index, mediaToShow);
                      }}
                    >
                      {mediaType?.startsWith('image/') ? (
                        <img 
                          src={mediaUrl} 
                          alt={`Attachment ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : mediaType?.startsWith('video/') ? (
                        <div className="relative w-full h-full bg-slate-900">
                          <video
                            src={mediaUrl}
                            className="w-full h-full object-cover"
                            preload="metadata"
                            muted
                            playsInline
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                            <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
                              <div className="w-0 h-0 border-l-[8px] border-l-black border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent ml-0.5" />
                            </div>
                          </div>
                        </div>
                      ) : mediaType?.startsWith('audio/') ? (
                        <div 
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 50%, #c026d3 100%)' }}
                        >
                          <Mic className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                          <span className="text-xs">📄</span>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {remaining > 0 && (
                  <div 
                    className="w-12 h-12 rounded-md cursor-pointer hover:ring-2 hover:ring-yellow-400/50 transition-all bg-slate-800/80 flex items-center justify-center border border-yellow-400/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleMediaExpand(capsule.id);
                    }}
                    title={`Click to see ${remaining} more attachment${remaining > 1 ? 's' : ''}`}
                  >
                    <span className="text-sm font-semibold text-yellow-400">+{remaining}</span>
                  </div>
                )}
              </div>
            );
          }
          return null;
        })()}

        {/* ✅ KEPT: Expanded Media View */}
        {(() => {
          if (!isExpanded) return null;
          
          const mediaToShow = capsule.media_files || capsule.attachments || [];
          const maxPreview = 1;  // ✅ FIX: Must match the initial preview count above!
          const expandedMedia = mediaToShow.slice(maxPreview);
          
          if (expandedMedia.length === 0) return null;
          
          return (
            <div className="mt-2 pt-2 border-t border-slate-700/50 flex gap-1.5 flex-wrap">
              {expandedMedia.map((media: any, index: number) => {
                const mediaType = detectMediaType(media);
                const mediaUrl = media.url || media.file_url;
                const actualIndex = maxPreview + index;
                
                return (
                  <div
                    key={actualIndex}
                    className="w-12 h-12 rounded-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-white/50 transition-all bg-slate-800/50 relative"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMediaClick(media, actualIndex, mediaToShow);
                    }}
                  >
                    {mediaType?.startsWith('image/') ? (
                      <img 
                        src={mediaUrl} 
                        alt={`Attachment ${actualIndex + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : mediaType?.startsWith('video/') ? (
                      <div className="relative w-full h-full bg-slate-900">
                        <video
                          src={mediaUrl}
                          className="w-full h-full object-cover"
                          preload="metadata"
                          muted
                          playsInline
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                          <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[8px] border-l-black border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent ml-0.5" />
                          </div>
                        </div>
                      </div>
                    ) : mediaType?.startsWith('audio/') ? (
                      <div 
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 50%, #c026d3 100%)' }}
                      >
                        <Mic className="w-3 h-3 text-white" />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                        <span className="text-xs">📄</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </Card>
  );
});

CapsuleCard.displayName = 'CapsuleCard';