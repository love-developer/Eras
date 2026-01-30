/**
 * Echo Notifications Hook - v2.1.0 (Enhanced Reliability)
 * 
 * Manages in-app echo notifications with real-time updates via Supabase Broadcast
 * Tracks read/unread state, provides navigation to capsules, and manages toast dismissal
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';

export interface EchoNotification {
  id: string;
  echoId?: string;
  capsuleId?: string;
  capsuleTitle?: string;
  senderId: string;
  senderName: string;
  echoType: 'emoji' | 'text' | 'reaction' | 'capsule_opened' | 'legacy_access';
  echoContent: string;
  timestamp: string;
  read: boolean;
  seen: boolean; // Seen = dismissed toast but not viewed capsule
  createdAt: string;
  // Optional fields for specific notification types
  emoji?: string;
  emojiLabel?: string;
  openedBy?: string;
  openedByName?: string;
  grantedBy?: string;
  grantedByName?: string;
  metadata?: {
    beneficiaryId?: string;
    personalMessage?: string;
  };
}

interface UseEchoNotificationsResult {
  notifications: EchoNotification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAsSeen: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export function useEchoNotifications(userId: string | null, accessToken: string | null): UseEchoNotificationsResult {
  const [notifications, setNotifications] = useState<EchoNotification[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use ref to store latest fetchNotifications function for polling
  const fetchNotificationsRef = useRef<() => Promise<void>>();

  // Fetch notifications from server
  const fetchNotifications = useCallback(async () => {
    if (!userId || !accessToken) {
      console.log('⏭️ [Echo Notifications] Skipping fetch - no userId or accessToken');
      setNotifications([]);
      setLoading(false);
      return;
    }

    console.log(`📡 [Echo Notifications] Fetching notifications for user: ${userId}`);
    
    // Retry logic with exponential backoff
    const maxRetries = 2;
    let lastError: any = null;
    
    try {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          // Exponential timeout increase for retries
          const timeout = 30000 * Math.pow(1.2, attempt); // 30s, 36s, 43s
          
          if (attempt > 0) {
            console.log(`🔄 [Echo Notifications] Retry ${attempt}/${maxRetries} (timeout: ${Math.round(timeout/1000)}s)`);
          }
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);
          
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/echo-notifications`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              signal: controller.signal,
            }
          ).finally(() => clearTimeout(timeoutId));

          console.log(`📡 [Echo Notifications] Fetch response status: ${response.status}`);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            
            // If 401 Unauthorized (Invalid JWT), the token may have expired
            if (response.status === 401) {
              // Token expired - this is expected behavior, silently skip
              setNotifications([]);
              return;
            }
            
            console.error('❌ [Echo Notifications] Server returned error:', errorData);
            throw new Error(`Failed to fetch notifications: ${response.status} - ${errorData.error || 'Unknown error'}`);
          }

          const data = await response.json();
          console.log(`📦 [Echo Notifications] Received ${data.notifications?.length || 0} notifications from server`);
          
          if (data.notifications && data.notifications.length > 0) {
            console.log('📬 [Echo Notifications] Latest notification:', data.notifications[0]);
          }
          
          setNotifications(data.notifications || []);
          break; // Exit loop on success
        } catch (error) {
          const isLastAttempt = attempt === maxRetries;
          
          // Handle timeout or network errors gracefully
          if (error.name === 'AbortError') {
            console.warn(`⏱️ [Echo Notifications] Request timed out (attempt ${attempt + 1}/${maxRetries + 1}) - server may be cold-starting`);
          } else if (error.message?.includes('Failed to fetch')) {
            console.warn(`⚠️ [Echo Notifications] Network error (attempt ${attempt + 1}/${maxRetries + 1}) - will retry${!isLastAttempt ? '' : ' on next poll'}`);
          } else {
            console.warn('⚠️ [Echo Notifications] Error fetching notifications:', error.message);
          }
          
          lastError = error;
          
          // Wait before retry with exponential backoff
          if (!isLastAttempt) {
            const backoffDelay = 1000 * Math.pow(2, attempt); // 1s, 2s
            console.log(`⏳ [Echo Notifications] Waiting ${backoffDelay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
          }
        }
      }
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
    } finally {
      setLoading(false);
    }
    
    // If all retries failed, set empty array on error to prevent UI issues
    if (lastError) {
      setNotifications([]);
    }
  }, [userId, accessToken]);
  
  // Update ref whenever fetchNotifications changes
  useEffect(() => {
    fetchNotificationsRef.current = fetchNotifications;
  }, [fetchNotifications]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // REAL-TIME: WebSocket + Polling Hybrid System
  // WebSocket for instant updates, polling as reliable fallback
  useEffect(() => {
    if (!userId) return;

    console.log(`🔄 [Echo Notifications] Setting up real-time updates for user: ${userId}`);
    
    // Set up WebSocket channel for real-time notifications
    const channelName = `echo_notifications:${userId}`;
    console.log(`📡 [Echo Notifications] Subscribing to channel: ${channelName}`);
    
    const channel = supabase.channel(channelName);
    
    channel
      .on('broadcast', { event: 'new_echo' }, (payload: any) => {
        console.log('🔔 [Echo Notifications] Received real-time notification via WebSocket:', payload);
        
        if (payload.payload) {
          const newNotification = payload.payload as EchoNotification;
          
          // Add notification to list (avoid duplicates)
          setNotifications(prev => {
            const exists = prev.some(n => n.id === newNotification.id);
            if (exists) {
              console.log('⚠️ [Echo Notifications] Duplicate notification ignored');
              return prev;
            }
            console.log('✅ [Echo Notifications] Adding new notification to list');
            return [newNotification, ...prev];
          });
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ [Echo Notifications] Real-time updates active');
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('⚠️ [Echo Notifications] Using polling mode (real-time unavailable)');
        }
      });
    
    // Polling fallback: Check for new notifications every 30 seconds
    // This ensures notifications are received even if WebSocket fails
    // Reduced frequency to avoid spamming logs if server is unavailable
    const pollingInterval = setInterval(() => {
      if (fetchNotificationsRef.current) {
        fetchNotificationsRef.current();
      }
    }, 30000); // 30 second intervals
    
    // Cleanup
    return () => {
      console.log('🧹 [Echo Notifications] Cleaning up real-time connection');
      clearInterval(pollingInterval);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Mark notification as read (viewed capsule)
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!accessToken) return;
    
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/echo-notifications/${notificationId}/read`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true, seen: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [accessToken]);

  // Mark notification as seen (dismissed toast but not viewed)
  const markAsSeen = useCallback(async (notificationId: string) => {
    if (!accessToken) return;
    
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/echo-notifications/${notificationId}/seen`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, seen: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as seen:', error);
    }
  }, [accessToken]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!accessToken) return;
    
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/echo-notifications/mark-all-read`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setNotifications(prev => prev.map(n => ({ ...n, read: true, seen: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, [accessToken]);

  // Dismiss individual notification (remove from list)
  const dismissNotification = useCallback(async (notificationId: string) => {
    if (!accessToken) return;
    
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/echo-notifications/${notificationId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  }, [accessToken]);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    if (!accessToken) return;
    
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/echo-notifications/clear-all`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setNotifications([]);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  }, [accessToken]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAsSeen,
    markAllAsRead,
    dismissNotification,
    clearAll,
    refreshNotifications: fetchNotifications,
  };
}