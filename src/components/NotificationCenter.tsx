import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Heart, Package, Eye, Trophy, AlertCircle, Sparkles, MessageCircle, Mail, Shield, ThumbsUp } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns@4.1.0';
import '../styles/notification-center.css';

interface Notification {
  id: string;
  type: 'echo' | 'delivered' | 'received' | 'delivery_failed' | 'opened' | 'achievement' | 'error' | 'welcome' | 'delivery_failed';
  title: string;
  content: string;
  timestamp: number;
  isRead: boolean;
  metadata?: {
    capsuleName?: string;
    senderName?: string;
    recipientName?: string;
    achievementName?: string;
    emoji?: string;
    capsuleId?: string;
    echoText?: string;
    openedBy?: string;
    reactionEmoji?: string;
    grantedBy?: string;
    errorMessage?: string; // ✅ NEW: Failure error message
    originalDeliveryDate?: string; // ✅ NEW: Original scheduled date
    mediaCount?: number; // ✅ NEW: Number of media files preserved
  };
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNotificationClick?: (capsuleId: string, notificationType?: 'received' | 'delivered' | 'echo') => void;
}

export function NotificationCenter({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationClick
}: NotificationCenterProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5); // Start with 5 notifications

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset visible count when opening
  useEffect(() => {
    if (isOpen) {
      setVisibleCount(5);
    }
  }, [isOpen]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Group notifications by date
  const groupedNotifications = groupByDate(notifications);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  // Get flat list of sorted notifications for pagination
  const sortedNotifications = [...notifications].sort((a, b) => b.timestamp - a.timestamp);
  const visibleNotifications = sortedNotifications.slice(0, visibleCount);
  const hasMore = sortedNotifications.length > visibleCount;
  
  // Group only visible notifications
  const visibleGroupedNotifications = groupByDate(visibleNotifications);

  if (!isOpen) return null;

  console.log('🔔 [NOTIFICATION CENTER] Rendering, isOpen:', isOpen);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            onClick={onClose}
          />

          {/* Notification Card - Mobile: Full-screen modal, Desktop: centered modal */}
          <motion.div
            initial={isMobile ? { y: '100%', opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
            animate={isMobile ? { y: 0, opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={isMobile ? { y: '100%', opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`
              relative w-full bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 
              border-purple-500/30 shadow-2xl overflow-hidden flex flex-col z-10
              ${isMobile 
                ? 'h-[85vh] max-h-[85vh] rounded-2xl border mx-4' 
                : 'max-w-md md:max-w-lg max-h-[70vh] rounded-2xl border'
              }
            `}
            style={{
              boxShadow: '0 0 40px rgba(167, 139, 250, 0.4), 0 20px 60px rgba(0, 0, 0, 0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile: Drag indicator */}
            {isMobile && (
              <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
                <div className="w-12 h-1 bg-slate-600 rounded-full" />
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-purple-500/20 bg-gradient-to-r from-purple-900/30 via-purple-800/20 to-purple-900/30 flex-shrink-0">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 rounded-full bg-purple-500/20">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-semibold text-white">
                    Notifications
                  </h2>
                  {unreadCount > 0 && (
                    <p className="text-xs md:text-xs text-purple-300">
                      {unreadCount} new
                    </p>
                  )}
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-1.5 md:p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors text-slate-300 hover:text-white"
                aria-label="Close notifications"
              >
                <X className="w-5 h-5 md:w-5 md:h-5" />
              </button>
            </div>

            {/* Notifications List - FIXED: flex-1 for proper scrolling */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="p-4 rounded-full bg-purple-500/10 mb-4">
                    <Sparkles className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    All caught up!
                  </h3>
                  <p className="text-sm text-slate-400 text-center">
                    No new notifications
                  </p>
                </div>
              ) : (
                Object.entries(visibleGroupedNotifications).map(([dateLabel, items]) => (
                  <div key={dateLabel}>
                    {/* Date Section Header */}
                    <div className="sticky top-0 z-10 px-4 md:px-6 py-2 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {dateLabel}
                      </h3>
                    </div>

                    {/* Notification Items */}
                    {items.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={onMarkAsRead}
                        isMobile={isMobile}
                        onNotificationClick={onNotificationClick}
                      />
                    ))}
                  </div>
                ))
              )}
              
              {/* Show More Button - Centered at bottom of all notifications */}
              {hasMore && notifications.length > 0 && (
                <div className="px-4 sm:px-6 py-4 flex items-center justify-center">
                  <button
                    onClick={() => setVisibleCount(visibleCount + 5)}
                    className="py-2.5 px-8 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-purple-200 font-medium transition-colors shadow-lg"
                  >
                    Show More
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && unreadCount > 0 && (
              <div className="px-4 md:px-6 py-3 border-t border-purple-500/20 bg-gradient-to-r from-slate-900/50 via-slate-800/50 to-slate-900/50 flex-shrink-0">
                <button
                  onClick={onMarkAllAsRead}
                  className="w-full py-2 px-4 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-purple-200 text-sm font-medium transition-colors"
                >
                  Mark All as Read
                </button>
              </div>
            )}
            
            {/* Mobile: Bottom safe area */}
            {isMobile && (
              <div className="flex-shrink-0 bg-slate-900" style={{ height: 'env(safe-area-inset-bottom, 12px)' }} />
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Notification Item Component
function NotificationItem({
  notification,
  onMarkAsRead,
  isMobile,
  onNotificationClick
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  isMobile: boolean;
  onNotificationClick?: (capsuleId: string, notificationType?: 'received' | 'delivered' | 'echo') => void;
}) {
  const icon = getNotificationIcon(notification.type, notification.metadata);
  const accentColor = getAccentColor(notification.type);

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    
    // Open capsule if this notification has a capsuleId
    if (notification.metadata?.capsuleId && onNotificationClick) {
      console.log('🔔 [NOTIFICATION CLICK] Opening capsule:', notification.metadata.capsuleId);
      onNotificationClick(notification.metadata.capsuleId, notification.type);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`
        relative px-4 sm:px-6 py-4 border-b border-slate-700/50 cursor-pointer
        transition-all duration-200 hover:bg-slate-800/30
        ${!notification.isRead ? 'bg-purple-900/10' : ''}
      `}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: accentColor }}
        />
      )}

      <div className="flex gap-3">
        {/* Icon - Fixed size, doesn't expand */}
        <div 
          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full"
          style={{ backgroundColor: `${accentColor}20` }}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Badge */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 
              className="font-semibold text-white text-sm sm:text-base leading-snug"
              style={{
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'normal',
                hyphens: 'none'
              }}
            >
              {notification.title}
            </h4>
            {!notification.isRead && (
              <span 
                className="shrink-0 px-2 py-0.5 text-[10px] sm:text-xs font-bold rounded-full text-white whitespace-nowrap"
                style={{ backgroundColor: accentColor }}
              >
                NEW
              </span>
            )}
          </div>

          {/* Content Text */}
          <div 
            className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-2"
            style={{
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              whiteSpace: 'normal',
              orphans: 2,
              widows: 2
            }}
          >
            {renderNotificationContent(notification, onNotificationClick)}
          </div>

          {/* Timestamp */}
          <p className="text-xs text-slate-500 whitespace-nowrap">
            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Helper: Render notification content with proper formatting
function renderNotificationContent(
  notification: Notification, 
  onNotificationClick?: (capsuleId: string, notificationType?: 'received' | 'delivered' | 'echo') => void
) {
  const { content, metadata } = notification;

  // For echo notifications with emoji
  if (notification.type === 'echo' && metadata?.emoji && metadata?.senderName) {
    return (
      <>
        <span className="font-medium text-white">{metadata.senderName}</span>
        {' sent '}
        <span className="text-base">{metadata.emoji}</span>
        {metadata.capsuleName && (
          <>
            {' on your capsule '}
            {metadata.capsuleId && onNotificationClick ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNotificationClick(metadata.capsuleId!);
                }}
                className="font-medium text-purple-300 italic hover:text-purple-200 underline decoration-purple-400/50 hover:decoration-purple-300 transition-colors"
                style={{
                  display: 'inline',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}
              >
                "{metadata.capsuleName}"
              </button>
            ) : (
              <span 
                className="font-medium text-purple-300 italic"
                style={{
                  display: 'inline',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}
              >
                "{metadata.capsuleName}"
              </span>
            )}
          </>
        )}
      </>
    );
  }

  // For echo notifications with text comment
  if (notification.type === 'echo' && metadata?.echoText && metadata?.senderName) {
    return (
      <>
        <div className="mb-2">
          <span className="font-medium text-white">{metadata.senderName}</span>
          {' commented on '}
          {metadata.capsuleName && (
            <>
              {metadata.capsuleId && onNotificationClick ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNotificationClick(metadata.capsuleId!);
                  }}
                  className="font-medium text-purple-300 italic hover:text-purple-200 underline decoration-purple-400/50 hover:decoration-purple-300 transition-colors"
                  style={{
                    display: 'inline',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word'
                  }}
                >
                  "{metadata.capsuleName}"
                </button>
              ) : (
                <span 
                  className="font-medium text-purple-300 italic"
                  style={{
                    display: 'inline',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word'
                  }}
                >
                  "{metadata.capsuleName}"
                </span>
              )}
            </>
          )}
        </div>
        <div className="pl-3 border-l-2 border-purple-500/30 italic text-slate-200">
          "{metadata.echoText}"
        </div>
      </>
    );
  }

  // For capsule opened notifications (echo type with openedBy metadata)
  if (notification.type === 'echo' && metadata?.openedBy && metadata?.capsuleName) {
    return (
      <>
        <span className="font-medium text-white">{metadata.openedBy}</span>
        {' has opened '}
        {metadata.capsuleId && onNotificationClick ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNotificationClick(metadata.capsuleId!);
            }}
            className="font-medium text-blue-300 italic hover:text-blue-200 underline decoration-blue-400/50 hover:decoration-blue-300 transition-colors"
            style={{
              display: 'inline',
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            "{metadata.capsuleName}"
          </button>
        ) : (
          <span 
            className="font-medium text-blue-300 italic"
            style={{
              display: 'inline',
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            "{metadata.capsuleName}"
          </span>
        )}
      </>
    );
  }

  // For delivery notifications
  if (notification.type === 'delivered' && metadata?.capsuleName && metadata?.recipientName) {
    return (
      <>
        {metadata.capsuleId && onNotificationClick ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNotificationClick(metadata.capsuleId!);
            }}
            className="font-medium text-emerald-300 italic hover:text-emerald-200 underline decoration-emerald-400/50 hover:decoration-emerald-300 transition-colors"
            style={{
              display: 'inline',
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            "{metadata.capsuleName}"
          </button>
        ) : (
          <span 
            className="font-medium text-emerald-300 italic"
            style={{
              display: 'inline',
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            "{metadata.capsuleName}"
          </span>
        )}
        {' was successfully delivered to '}
        <span className="font-medium text-white">{metadata.recipientName}</span>
      </>
    );
  }

  // For received notifications (self-sent capsules - yellow/gold theme)
  if (notification.type === 'received' && metadata?.capsuleName) {
    return (
      <>
        {'Your time capsule '}
        {metadata.capsuleId && onNotificationClick ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNotificationClick(metadata.capsuleId!);
            }}
            className="font-medium text-yellow-300 italic hover:text-yellow-200 underline decoration-yellow-400/50 hover:decoration-yellow-300 transition-colors"
            style={{
              display: 'inline',
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            "{metadata.capsuleName}"
          </button>
        ) : (
          <span 
            className="font-medium text-yellow-300 italic"
            style={{
              display: 'inline',
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            "{metadata.capsuleName}"
          </span>
        )}
        {' has been delivered!'}
        {metadata.senderName && metadata.senderName.includes('Past Self') && (
          <span className="block mt-1 text-slate-400 text-xs">From {metadata.senderName}</span>
        )}
      </>
    );
  }

  // For delivery FAILED notifications
  if (notification.type === 'delivery_failed' && metadata?.capsuleName) {
    return (
      <>
        {'Your time capsule '}
        {metadata.capsuleId && onNotificationClick ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNotificationClick(metadata.capsuleId!);
            }}
            className="font-medium text-red-300 italic hover:text-red-200 underline decoration-red-400/50 hover:decoration-red-300 transition-colors"
            style={{
              display: 'inline',
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            "{metadata.capsuleName}"
          </button>
        ) : (
          <span 
            className="font-medium text-red-300 italic"
            style={{
              display: 'inline',
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            "{metadata.capsuleName}"
          </span>
        )}
        {' couldn\'t be delivered and is back in '}
        <span className="font-semibold text-yellow-300">Drafts</span>
        {'.'}
        
        {/* ✅ NEW: Confirm media preserved */}
        {metadata.mediaCount != null && metadata.mediaCount > 0 && (
          <span className="block mt-1 text-green-400 text-xs">
            ✅ {metadata.mediaCount} media file{metadata.mediaCount > 1 ? 's' : ''} preserved
          </span>
        )}
        
        {metadata.errorMessage && (
          <span className="block mt-1 text-slate-400 text-xs">
            Reason: {(() => {
              const error = metadata.errorMessage;
              if (error.includes('invalid email')) return "Invalid recipient email address";
              if (error.includes('network')) return "Network connection issue";
              if (error.includes('sandbox')) return "Email service configuration issue";
              return error.length > 80 ? error.substring(0, 80) + '...' : error;
            })()}
          </span>
        )}
        
        {metadata.originalDeliveryDate && (
          <span className="block mt-0.5 text-slate-400 text-xs">
            Was scheduled: {format(new Date(metadata.originalDeliveryDate), 'MMM d, yyyy h:mm a')}
          </span>
        )}
      </>
    );
  }

  // For opened notifications
  if (notification.type === 'opened' && metadata?.recipientName && metadata?.capsuleName) {
    return (
      <>
        <span className="font-medium text-white">{metadata.recipientName}</span>
        {' opened your capsule '}
        {metadata.capsuleId && onNotificationClick ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNotificationClick(metadata.capsuleId!);
            }}
            className="font-medium text-blue-300 italic hover:text-blue-200 underline decoration-blue-400/50 hover:decoration-blue-300 transition-colors"
            style={{
              display: 'inline',
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            "{metadata.capsuleName}"
          </button>
        ) : (
          <span 
            className="font-medium text-blue-300 italic"
            style={{
              display: 'inline',
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            "{metadata.capsuleName}"
          </span>
        )}
      </>
    );
  }

  // For achievement notifications
  if (notification.type === 'achievement' && metadata?.achievementName) {
    return (
      <>
        <span 
          className="font-medium text-amber-300 italic"
          style={{
            display: 'inline',
            wordWrap: 'break-word',
            overflowWrap: 'break-word'
          }}
        >
          "{metadata.achievementName}"
        </span>
        <br />
        <span className="text-slate-400">{content}</span>
      </>
    );
  }

  // Default: just render content
  return content;
}

// Helper: Get notification icon
function getNotificationIcon(type: Notification['type'], metadata?: Notification['metadata']) {
  const iconClass = "w-5 h-5";
  
  switch (type) {
    case 'echo':
      // Different icons for different echo types
      if (metadata?.emoji) {
        // Emoji reaction notification
        return <Heart className={`${iconClass} text-purple-400`} />;
      } else if (metadata?.echoText) {
        // Text comment notification
        return <MessageCircle className={`${iconClass} text-purple-400`} />;
      } else if (metadata?.openedBy) {
        // Capsule opened notification
        return <Eye className={`${iconClass} text-blue-400`} />;
      } else if (metadata?.reactionEmoji) {
        // Facebook-style reaction notification
        return <ThumbsUp className={`${iconClass} text-purple-400`} />;
      } else if (metadata?.grantedBy) {
        // Legacy access granted notification
        return <Shield className={`${iconClass} text-amber-400`} />;
      } else {
        // Default echo icon
        return <Heart className={`${iconClass} text-purple-400`} />;
      }
    case 'delivered':
      return <Mail className={`${iconClass} text-emerald-400`} />;
    case 'received':
      return <Package className={`${iconClass} text-yellow-400`} />;
    case 'delivery_failed':
      return <AlertCircle className={`${iconClass} text-red-400`} />;
    case 'opened':
      return <Eye className={`${iconClass} text-blue-400`} />;
    case 'achievement':
      return <Trophy className={`${iconClass} text-amber-400`} />;
    case 'error':
      return <AlertCircle className={`${iconClass} text-red-400`} />;
    case 'welcome':
      return <Sparkles className={`${iconClass} text-purple-400`} />;
    default:
      return <Sparkles className={`${iconClass} text-purple-400`} />;
  }
}

// Helper: Get accent color
function getAccentColor(type: Notification['type']): string {
  switch (type) {
    case 'echo':
      return '#a855f7'; // purple-500
    case 'delivered':
      return '#10b981'; // emerald-500
    case 'received':
      return '#eab308'; // yellow-500
    case 'delivery_failed':
      return '#ef4444'; // red-500
    case 'opened':
      return '#3b82f6'; // blue-500
    case 'achievement':
      return '#f59e0b'; // amber-500
    case 'error':
      return '#ef4444'; // red-500
    case 'welcome':
      return '#a855f7'; // purple-500
    default:
      return '#a855f7';
  }
}

// Helper: Group notifications by date
function groupByDate(notifications: Notification[]): Record<string, Notification[]> {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;

  const groups: Record<string, Notification[]> = {
    'Today': [],
    'Yesterday': [],
    'This Week': [],
    'Earlier': []
  };

  // FIRST: Sort all notifications by timestamp (newest first)
  const sortedNotifications = [...notifications].sort((a, b) => b.timestamp - a.timestamp);

  sortedNotifications.forEach(notification => {
    const age = now - notification.timestamp;
    
    if (age < oneDay) {
      groups['Today'].push(notification);
    } else if (age < 2 * oneDay) {
      groups['Yesterday'].push(notification);
    } else if (age < oneWeek) {
      groups['This Week'].push(notification);
    } else {
      groups['Earlier'].push(notification);
    }
  });

  // Remove empty groups
  Object.keys(groups).forEach(key => {
    if (groups[key].length === 0) {
      delete groups[key];
    }
  });

  return groups;
}