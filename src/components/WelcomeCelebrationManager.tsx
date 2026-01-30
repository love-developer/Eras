import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { projectId } from '../utils/supabase/info';
import { AchievementUnlockModal } from './AchievementUnlockModal';

/**
 * Welcome Celebration Manager
 * Checks if existing users need to see the First Step achievement celebration
 * Shows the modal ONCE on their next login after the feature was implemented
 */
export function WelcomeCelebrationManager() {
  const { session, isAuthenticated } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [achievement, setAchievement] = useState<any>(null);
  const hasCheckedRef = useRef(false);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    // Only check once per session
    if (!isAuthenticated || !session?.access_token || hasCheckedRef.current || isCheckingRef.current) {
      return;
    }

    const checkWelcomeCelebration = async () => {
      isCheckingRef.current = true;
      
      try {
        console.log('🎉 [Welcome Manager] Checking welcome celebration status');
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/achievements/check-welcome`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          // Silently fail if endpoint doesn't exist (404) or auth fails (401)
          // This is expected for existing users before the welcome system was implemented
          if (response.status === 404 || response.status === 401) {
            console.log('🎉 [Welcome Manager] Welcome endpoint not available (expected for existing users)');
          } else {
            console.error('❌ 🎉 [Welcome Manager] Failed to check welcome celebration:', response.status);
          }
          hasCheckedRef.current = true; // Don't retry
          return;
        }

        const data = await response.json();
        console.log('🎉 [Welcome Manager] Response:', data);

        if (data.shouldShowCelebration && data.achievement) {
          console.log('🎉 [Welcome Manager] Showing welcome celebration!');
          setAchievement(data.achievement);
          
          // Small delay to ensure smooth transition
          setTimeout(() => {
            setShowModal(true);
          }, 1000);
        } else {
          console.log('🎉 [Welcome Manager] No celebration to show');
        }

        hasCheckedRef.current = true;
      } catch (error) {
        console.error('🎉 [Welcome Manager] Error checking welcome celebration:', error);
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Delay check slightly to allow app to load
    const timeoutId = setTimeout(checkWelcomeCelebration, 2000);

    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, session]);

  const handleClose = async () => {
    setShowModal(false);
    
    // Mark as seen in backend
    if (session?.access_token) {
      try {
        console.log('🎉 [Welcome Manager] Marking welcome celebration as seen');
        
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/achievements/mark-welcome-seen`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('🎉 [Welcome Manager] ✅ Welcome celebration marked as seen');
      } catch (error) {
        console.error('🎉 [Welcome Manager] Error marking as seen:', error);
      }
    }
  };

  if (!achievement) {
    return null;
  }

  return (
    <AchievementUnlockModal
      achievement={achievement}
      isOpen={showModal}
      onClose={handleClose}
    />
  );
}
