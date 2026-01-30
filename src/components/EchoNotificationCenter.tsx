/**
 * Echo Notification Center Modal
 * 
 * UNIFIED DESIGN - ONE VERSION FOR BOTH DESKTOP AND MOBILE
 * 
 * Desktop: Centered modal (600px wide)
 * Mobile: Full-screen modal (slides up from bottom)
 * 
 * Z-index: 60 (above regular modals, below AU/TU)
 */

import { X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { EchoNotification } from '../hooks/useEchoNotifications';
import { formatDistanceToNow } from 'date-fns';

interface EchoNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: EchoNotification[];
  onViewCapsule: (capsuleId: string, notificationId: string) => void;
  onDismiss: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

export function EchoNotificationCenter({
  isOpen,
  onClose,
  notifications,
  onViewCapsule,
  onDismiss,
  onMarkAllAsRead,
  onClearAll,
}: EchoNotificationCenterProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />

          {/* UNIFIED MODAL - RESPONSIVE */}
          <motion.div
            // Desktop: Scale from center
            // Mobile: Slide up from bottom
            initial={{ 
              opacity: 0, 
              scale: 0.95, 
              y: 20 
            }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0 
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.95, 
              y: 20 
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="
              fixed z-[60]
              
              /* DESKTOP: Centered modal with fixed width */
              md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
              md:w-[600px] md:max-w-[calc(100vw-2rem)] md:max-h-[80vh]
              md:rounded-2xl
              
              /* MOBILE: Full-screen from bottom */
              max-md:inset-x-0 max-md:bottom-0 max-md:top-[60px]
              max-md:rounded-t-2xl
              
              /* Shared styles */
              bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 
              border border-purple-500/30 
              shadow-2xl 
              overflow-hidden
              flex flex-col
            "
            style={{
              boxShadow: '0 0 40px rgba(167, 139, 250, 0.4), 0 20px 60px rgba(0, 0, 0, 0.6)',
            }}
          >
            {/* MOBILE ONLY: Drag handle */}
            <div className="md:hidden flex justify-center pt-2 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-600" />
            </div>

            {/* Header - Responsive padding */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-700/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-2xl md:text-3xl">🔔</span>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-white">Notifications</h2>
                  {unreadCount > 0 && (
                    <p className="text-xs md:text-sm text-slate-400">
                      {unreadCount} unread
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white active:text-white transition-colors p-2 rounded-lg hover:bg-white/10 active:bg-white/10"
                aria-label="Close notifications"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bulk actions - Responsive padding */}
            {notifications.length > 0 && (
              <div className="flex gap-2 p-3 md:p-4 border-b border-slate-700/50 bg-slate-800/50 flex-shrink-0">
                <button
                  onClick={onMarkAllAsRead}
                  className="flex-1 px-3 md:px-4 py-1.5 md:py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 active:bg-slate-700 hover:text-white active:text-white transition-colors text-xs md:text-sm font-medium"
                >
                  Mark All as Read
                </button>
                <button
                  onClick={onClearAll}
                  className="flex-1 px-3 md:px-4 py-1.5 md:py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 active:bg-red-500/10 hover:text-red-300 active:text-red-300 transition-colors text-xs md:text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-3 md:w-4 h-3 md:h-4" />
                  <span className="hidden md:inline">Clear All</span>
                  <span className="md:hidden">Clear</span>
                </button>
              </div>
            )}

            {/* Notifications list - Scrollable with flex-1 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 md:p-12 text-center h-full flex flex-col items-center justify-center">
                  <div className="text-5xl md:text-6xl mb-3 md:mb-4 opacity-50">📭</div>
                  <p className="text-slate-400 text-base md:text-lg">No notifications yet</p>
                  <p className="text-slate-500 text-xs md:text-sm mt-2">
                    When someone sends you an echo, you'll see it here
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700/50">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 md:p-4 hover:bg-slate-800/50 transition-colors ${
                        !notification.read ? 'bg-purple-500/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2 md:gap-3">
                        {/* Icon - Responsive size */}
                        <div className="flex-shrink-0 w-8 md:w-10 h-8 md:h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                          <span className="text-base md:text-xl">
                            {notification.echoType === 'legacy_access' 
                              ? '🛡️' 
                              : notification.echoType === 'capsule_opened' 
                                ? '👁️' 
                                : notification.echoType === 'reaction' 
                                  ? '❤️' 
                                  : notification.echoType === 'emoji' 
                                    ? '💬' 
                                    : '✍️'}
                          </span>
                        </div>

                        {/* Content - Full width */}
                        <div className="flex-1 min-w-0">
                          {/* Sender and time */}
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-white text-sm md:text-base">
                              {notification.senderName}
                            </span>
                            <span className="text-slate-500 text-[10px] md:text-xs">
                              {formatTimestamp(notification.createdAt)}
                            </span>
                            {!notification.read && (
                              <span className="px-1.5 md:px-2 py-0.5 rounded-full bg-purple-500 text-white text-[10px] md:text-xs font-medium">
                                NEW
                              </span>
                            )}
                          </div>

                          {/* Capsule title - Full text on mobile (hidden for legacy_access) */}
                          {notification.echoType !== 'legacy_access' && (
                            <p className="text-xs md:text-sm text-slate-400 mb-2">
                              {notification.echoType === 'capsule_opened' ? 'Opened: ' : 'On: '}
                              <span className="text-purple-300">
                                <span className="hidden md:inline">"{truncateText(notification.capsuleTitle, 40)}"</span>
                                <span className="md:hidden">"{notification.capsuleTitle}"</span>
                              </span>
                            </p>
                          )}

                          {/* Echo preview - Full width, no truncation on mobile */}
                          <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-2 mb-3">
                            {notification.echoType === 'legacy_access' ? (
                              <div className="flex flex-col items-center gap-2 text-center">
                                <div className="flex items-center gap-2 text-amber-400">
                                  <span className="text-2xl md:text-3xl">🛡️</span>
                                  <p className="text-xs md:text-sm font-medium">
                                    Legacy Access Granted
                                  </p>
                                </div>
                                <p className="text-slate-400 text-[10px] md:text-xs">
                                  You can access this account in case of inactivity
                                </p>
                              </div>
                            ) : notification.echoType === 'capsule_opened' ? (
                              <div className="flex items-center gap-2 justify-center text-green-400">
                                <span className="text-2xl md:text-3xl">👁️</span>
                                <p className="text-xs md:text-sm font-medium">
                                  Your capsule was opened!
                                </p>
                              </div>
                            ) : notification.echoType === 'reaction' ? (
                              <div className="flex items-center gap-2 justify-center">
                                <span className="text-2xl md:text-3xl">{(notification as any).emoji}</span>
                                <p className="text-slate-300 text-xs md:text-sm">
                                  {(notification as any).emojiLabel || 'reacted'}
                                </p>
                              </div>
                            ) : notification.echoType === 'emoji' ? (
                              <p className="text-2xl md:text-2xl text-center">
                                {notification.echoContent}
                              </p>
                            ) : (
                              <p className="text-slate-300 text-xs md:text-sm break-words whitespace-pre-wrap">
                                {/* Desktop: Truncated */}
                                <span className="hidden md:inline">{truncateText(notification.echoContent, 80)}</span>
                                {/* Mobile: Full text */}
                                <span className="md:hidden">{notification.echoContent}</span>
                              </p>
                            )}
                          </div>

                          {/* Actions - Responsive */}
                          <div className="flex gap-2">
                            {notification.echoType === 'legacy_access' ? (
                              <button
                                onClick={() => onDismiss(notification.id)}
                                className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 active:from-purple-600 active:to-purple-700 text-white text-xs md:text-sm font-medium py-1.5 md:py-1.5 px-2 md:px-3 rounded-lg transition-all duration-200"
                              >
                                Got It
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => onViewCapsule(notification.capsuleId, notification.id)}
                                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 active:from-purple-600 active:to-purple-700 text-white text-xs md:text-sm font-medium py-1.5 md:py-1.5 px-2 md:px-3 rounded-lg transition-all duration-200"
                                >
                                  View Capsule
                                </button>
                                <button
                                  onClick={() => onDismiss(notification.id)}
                                  className="p-1.5 rounded-lg border border-slate-600 text-slate-400 hover:bg-slate-800 active:bg-slate-800 hover:text-white active:text-white transition-colors"
                                  aria-label="Dismiss notification"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* MOBILE ONLY: Bottom safe area */}
            <div className="md:hidden flex-shrink-0 bg-slate-900" style={{ height: 'env(safe-area-inset-bottom, 12px)' }} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
