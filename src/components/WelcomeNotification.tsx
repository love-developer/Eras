import { useEffect } from 'react';

interface WelcomeNotificationProps {
  userId: string | null;
  addNotification: (notification: {
    type: 'echo' | 'delivered' | 'opened' | 'achievement' | 'error' | 'welcome';
    title: string;
    content: string;
    metadata?: Record<string, string>;
  }) => void;
}

export function WelcomeNotification({ userId, addNotification }: WelcomeNotificationProps) {
  useEffect(() => {
    if (!userId) return;

    // IMPORTANT: Only show welcome notification if this is a brand new account
    // Check multiple conditions to ensure this is truly first-time use:
    // 1. Welcome notification hasn't been shown before (localStorage check)
    // 2. Account creation marker exists (set during signup)
    const storageKey = `eras_welcome_notification_shown_${userId}`;
    const accountCreationKey = `eras_account_created_${userId}`;
    
    const hasShown = localStorage.getItem(storageKey);
    const accountCreationTime = localStorage.getItem(accountCreationKey);
    
    // Only show if:
    // - Notification hasn't been shown before
    // - Account was created in the last 5 minutes (fresh signup)
    if (!hasShown && accountCreationTime) {
      const createdAt = parseInt(accountCreationTime);
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (now - createdAt < fiveMinutes) {
        console.log('🎉 [Welcome] Showing welcome notification for new user');
        
        // Add welcome notification
        addNotification({
          type: 'welcome',
          title: 'Welcome to Eras!',
          content: 'Your digital time capsule journey begins now. Create your first capsule to get started!'
        });

        // Mark as shown
        localStorage.setItem(storageKey, 'true');
      } else {
        console.log('⏰ [Welcome] Account created more than 5 minutes ago, skipping welcome notification');
        // Mark as shown anyway so we don't check again
        localStorage.setItem(storageKey, 'true');
      }
    } else if (!hasShown && !accountCreationTime) {
      console.log('👤 [Welcome] Existing user without creation marker, skipping welcome notification');
      // Mark as shown so we don't show it for existing users
      localStorage.setItem(storageKey, 'true');
    }
  }, [userId, addNotification]);

  return null;
}