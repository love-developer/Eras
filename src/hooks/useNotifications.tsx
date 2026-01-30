import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Notification {
  id: string;
  type: 'echo' | 'delivered' | 'received' | 'error' | 'welcome' | 'achievement' | 'opened' | 'delivery_failed';
  title: string;
  content: string;
  timestamp: number;
  isRead: boolean;
  metadata?: {
    capsuleName?: string;
    senderName?: string;
    recipientName?: string;
    emoji?: string;
    echoText?: string;
    echoId?: string;
    capsuleId?: string;
  };
}

export function useNotifications() {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load notifications from localStorage on mount
  useEffect(() => {
    if (!session?.user?.id || !session?.access_token) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    const loadNotifications = async () => {
      const storageKey = `eras_notifications_${session.user.id}`;
      let localNotifications: any[] = [];
      
      // Load from localStorage first
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          localNotifications = JSON.parse(stored);
        } catch (error) {
          console.error('Failed to parse local notifications:', error);
        }
      }
      
      // Fetch from backend KV store using user's access token
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/notifications`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}` // Use user's access token, not anon key
            }
          }
        );
        
        if (response.ok) {
          const backendNotifications = await response.json();
          console.log(`🔔 [NOTIFICATION] Loaded ${backendNotifications.length} notifications from backend`);
          
          // Convert backend format to frontend format
          const convertedBackendNotifs = backendNotifications.map((n: any) => {
            // ✅ CRITICAL: Convert 'received_capsule' based on whether it's self-sent or not
            // Self-sent = 'received' (yellow), Others = 'delivered' (keep old behavior for backward compat)
            let notifType = n.type;
            if (n.type === 'received_capsule') {
              // Check if this is a self-sent capsule (sender name contains "Past Self")
              if (n.senderName && (n.senderName.includes('Past Self') || n.senderName.includes('You ('))) {
                notifType = 'received'; // Yellow/gold color for self-sent
              } else {
                notifType = 'delivered'; // Green color for capsules from others (backward compat)
              }
            }
            
            const converted = {
              id: n.id,
              type: notifType,
              title: n.message || n.title || 'Notification',
              content: n.message || n.title || '',
              timestamp: new Date(n.timestamp).getTime(),
              isRead: n.read || false,
              metadata: {
                capsuleName: n.capsuleTitle,
                senderName: n.senderName,
                capsuleId: n.capsuleId,
                echoId: n.echoId, // IMPORTANT: Include echoId for deduplication
                emoji: n.emoji,
                echoText: n.echoContent, // Map echoContent to echoText
                ...n.metadata
              }
            };
            console.log(`🔄 [NOTIFICATION CONVERT] Backend notification:`, { 
              id: n.id, 
              type: n.type, 
              convertedType: notifType,
              echoType: n.echoType,
              title: converted.title,
              content: converted.content,
              senderName: n.senderName
            });
            return converted;
          });
          
          // Merge and deduplicate - prefer read status from local if available
          const deduped: Notification[] = [];
          const seen = new Map<string, Notification>();
          
          console.log(`🔍 [DEDUP] Starting deduplication with ${convertedBackendNotifs.length} backend + ${localNotifications.length} local = ${convertedBackendNotifs.length + localNotifications.length} total`);
          
          // First add all notifications to map
          for (const notif of [...convertedBackendNotifs, ...localNotifications]) {
            let key = `${notif.type}|${notif.title}|${notif.content}|${notif.metadata?.capsuleName}|${notif.metadata?.senderName}|${notif.metadata?.echoText}|${notif.metadata?.emoji}`;
            
            // CRITICAL FIX: Use echoId for robust deduplication (handles variations in sender name/formatting)
            if (notif.type === 'echo' && notif.metadata?.echoId) {
              key = `echo:${notif.metadata.echoId}`;
            } else if (notif.type === 'delivered' && notif.metadata?.capsuleId) {
              // Also enhance delivered capsule deduplication
              key = `delivered:${notif.metadata.capsuleId}`;
            }
            
            const existing = seen.get(key);
            if (!existing) {
              // New notification
              console.log(`✅ [DEDUP] New notification added:`, { id: notif.id, type: notif.type, title: notif.title, key });
              seen.set(key, notif);
            } else if (notif.isRead && !existing.isRead) {
              // Prefer the version that's marked as read
              console.log(`🔄 [DEDUP] Replacing with read version:`, { id: notif.id, oldId: existing.id });
              seen.set(key, notif);
            } else {
              console.log(`⏭️ [DEDUP] Skipping duplicate:`, { id: notif.id, existingId: existing.id, key });
            }
            // Otherwise keep existing (first occurrence)
          }
          
          // Convert map back to array
          const tempArray = Array.from(seen.values());
          
          // CRITICAL FIX: Deduplicate by ID to prevent React key warnings
          const idMap = new Map<string, Notification>();
          for (const notif of tempArray) {
            if (!idMap.has(notif.id)) {
              idMap.set(notif.id, notif);
            }
          }
          deduped.push(...idMap.values());
          
          // Sort by timestamp (newest first)
          deduped.sort((a, b) => b.timestamp - a.timestamp);
          
          console.log(`🔔 [NOTIFICATION] Total notifications after merge: ${deduped.length}`);
          console.log(`📊 [NOTIFICATION] Unread count: ${deduped.filter(n => !n.isRead).length}`);
          if (deduped.length > 0) {
            console.log(`📬 [NOTIFICATION] Latest 3 notifications:`, deduped.slice(0, 3).map(n => ({ 
              id: n.id, 
              type: n.type, 
              title: n.title, 
              isRead: n.isRead,
              senderName: n.metadata?.senderName
            })));
          }
          setNotifications(deduped);
        } else {
          // Silently fall back to local notifications (this is expected behavior)
          const deduped: Notification[] = [];
          const seen = new Set<string>();
          
          for (const notif of localNotifications) {
            const key = `${notif.type}|${notif.title}|${notif.content}|${notif.metadata?.capsuleName}|${notif.metadata?.senderName}|${notif.metadata?.echoText}|${notif.metadata?.emoji}`;
            
            if (!seen.has(key)) {
              seen.add(key);
              deduped.push(notif);
            }
          }
          
          setNotifications(deduped);
        }
      } catch (error) {
        console.error('Error loading notifications from backend:', error);
        
        // Fallback to local only
        const deduped: Notification[] = [];
        const seen = new Set<string>();
        
        for (const notif of localNotifications) {
          const key = `${notif.type}|${notif.title}|${notif.content}|${notif.metadata?.capsuleName}|${notif.metadata?.senderName}|${notif.metadata?.echoText}|${notif.metadata?.emoji}`;
          
          if (!seen.has(key)) {
            seen.add(key);
            deduped.push(notif);
          }
        }
        
        setNotifications(deduped);
      }
      
      setIsLoading(false);
    };
    
    loadNotifications();
  }, [session?.user?.id, session?.access_token]);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (!session?.user?.id || isLoading) return;

    const storageKey = `eras_notifications_${session.user.id}`;
    localStorage.setItem(storageKey, JSON.stringify(notifications));
  }, [notifications, session?.user?.id, isLoading]);

  // Add a new notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'> & { timestamp?: number }) => {
    // Check for duplicate notifications based on type, title, and content
    // This prevents the same notification from appearing multiple times
    const isDuplicate = notifications.some(existing => {
      // Must match basic fields
      if (existing.type !== notification.type) return false;
      if (existing.title !== notification.title) return false;
      
      // For echo notifications, use echoId for duplicate detection if available
      if (notification.type === 'echo' && notification.metadata?.echoId && existing.metadata?.echoId) {
        return existing.metadata.echoId === notification.metadata.echoId;
      }
      
      // Fallback to content-based duplicate detection
      if (existing.content !== notification.content) return false;
      if (existing.metadata?.capsuleName !== notification.metadata?.capsuleName) return false;
      if (existing.metadata?.senderName !== notification.metadata?.senderName) return false;
      if (existing.metadata?.recipientName !== notification.metadata?.recipientName) return false;
      
      // For echo notifications, also check the echo content (text or emoji)
      if (notification.type === 'echo') {
        if (existing.metadata?.echoText !== notification.metadata?.echoText) return false;
        if (existing.metadata?.emoji !== notification.metadata?.emoji) return false;
      }
      
      // If all fields match, it's a duplicate (no time limit for echoes to prevent migration duplicates)
      return true;
    });

    if (isDuplicate) {
      console.log('🔔 [NOTIFICATION] Duplicate detected, skipping:', notification);
      return null;
    }

    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: notification.timestamp || Date.now(), // Use provided timestamp or create new one
      isRead: false
    };

    console.log('🔔 [NOTIFICATION] Adding new notification:', {
      type: newNotification.type,
      title: newNotification.title,
      timestamp: new Date(newNotification.timestamp).toISOString()
    });

    setNotifications(prev => [newNotification, ...prev]);
    return newNotification.id;
  }, [notifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    // Update local state immediately
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
    
    // Try to update backend (if it's an echo notification)
    // Legacy delivered notifications don't have individual mark-as-read endpoints yet
    if (session?.access_token) {
      try {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/echo-notifications/${id}/read`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );
      } catch (error) {
        // Silently fail - notification is marked locally anyway
        console.warn('⚠️ Could not sync read status to backend:', error);
      }
    }
  }, [session?.access_token]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    console.log('🔔 [NOTIFICATION] Marking all notifications as read');
    console.log('🔔 [NOTIFICATION] Current unread count:', notifications.filter(n => !n.isRead).length);
    
    // Update local state immediately for instant feedback
    setNotifications(prev => {
      const updated = prev.map(notif => ({ ...notif, isRead: true }));
      console.log('🔔 [NOTIFICATION] Updated notifications:', updated.length, 'all read');
      console.log('🔔 [NOTIFICATION] New unread count:', updated.filter(n => !n.isRead).length);
      return updated;
    });
    
    // Also update backend so notifications stay marked as read on refresh
    if (session?.access_token) {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/echo-notifications/mark-all-read`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (response.ok) {
          console.log('✅ [NOTIFICATION] Backend notifications marked as read');
        } else {
          console.warn('⚠️ [NOTIFICATION] Failed to mark backend notifications as read');
        }
      } catch (error) {
        console.warn('⚠️ [NOTIFICATION] Error marking backend notifications as read:', error);
      }
    }
  }, [notifications, session?.access_token]);

  // Remove a notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  // Clear old notifications (older than 30 days)
  const clearOldNotifications = useCallback(() => {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    setNotifications(prev =>
      prev.filter(notif => notif.timestamp > thirtyDaysAgo)
    );
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Get unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    addNotification, // Returns notification ID or null if duplicate
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearOldNotifications,
    clearAll
  };
}