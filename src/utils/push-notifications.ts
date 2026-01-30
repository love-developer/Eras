/**
 * Utility for handling Browser Push Notifications
 * Uses the Push API and Service Workers
 */

import { supabase } from './supabase/client';

const PUBLIC_VAPID_KEY = 'YOUR_PUBLIC_VAPID_KEY'; // In a real app, this comes from backend

export type NotificationPermissionStatus = 'default' | 'granted' | 'denied';

export const PushNotificationService = {
  // Check if push notifications are supported
  isSupported: (): boolean => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  },

  // Get current permission status
  getPermissionStatus: (): NotificationPermissionStatus => {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  },

  // Request permission
  requestPermission: async (): Promise<NotificationPermissionStatus> => {
    if (!('Notification' in window)) return 'denied';
    const permission = await Notification.requestPermission();
    return permission;
  },

  // Register service worker and subscribe to push
  subscribeToPush: async (userId: string) => {
    if (!PushNotificationService.isSupported()) return null;

    try {
      // We assume service worker is registered in index.html or main entry point
      // But we can double check here
      const registration = await navigator.serviceWorker.ready;

      // Subscribe
      // Note: Since we don't have a real VAPID key in this environment,
      // we'll mock the subscription process for the UI flow
      
      // In a real implementation:
      /*
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      });
      
      // Send subscription to backend
      await supabase.from('push_subscriptions').insert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
        auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
      });
      */
     
      console.log('🔔 Simulated Push Subscription for user:', userId);
      localStorage.setItem(`push_subscription_${userId}`, 'true');
      
      return true;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      return false;
    }
  },
  
  // Unsubscribe
  unsubscribe: async (userId: string) => {
    // Mock unsubscribe
    localStorage.removeItem(`push_subscription_${userId}`);
    return true;
  },
  
  // Check if subscribed (mock)
  isSubscribed: (userId: string) => {
    return localStorage.getItem(`push_subscription_${userId}`) === 'true';
  }
};

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
