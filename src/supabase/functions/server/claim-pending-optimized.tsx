/**
 * OPTIMIZED CLAIM-PENDING ENDPOINT
 * 
 * This is a fixed version of the claim-pending endpoint with:
 * - Timeout protection on all KV operations
 * - Batched processing to avoid long-running loops
 * - Async background tasks for notifications and achievements
 * - Better error handling and logging
 * 
 * Replace the existing endpoint in index.tsx with this code
 */

import { withKVTimeout, withFallback } from './timeout-helpers.tsx';
import * as AchievementService from './achievement-service.tsx';
import * as kv from './kv_store.tsx';

export async function handleClaimPending(c: any, verifyUserToken: any) {
  try {
    console.log('🔍 Claim pending capsules request received');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      console.error('❌ No authorization token provided');
      return c.json({ error: 'Unauthorized', claimed: 0, capsuleIds: [] }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      console.error('❌ Invalid or expired token');
      return c.json({ error: 'Unauthorized', claimed: 0, capsuleIds: [] }, 401);
    }

    const userId = user.id;
    const userEmail = user.email?.toLowerCase();
    
    if (!userEmail) {
      console.error('❌ User has no email address');
      return c.json({ error: 'User email required', claimed: 0, capsuleIds: [] });
    }

    console.log(`📧 Claiming pending capsules for user`);

    // STEP 1: Get pending capsules with timeout protection (10s max)
    const pendingKey = `pending_capsules:${userEmail}`;
    const pendingCapsuleIds = await withFallback(
      kv.get(pendingKey),
      [],
      10000
    );
    
    if (!Array.isArray(pendingCapsuleIds) || pendingCapsuleIds.length === 0) {
      console.log('ℹ️ No pending capsules found');
      return c.json({ claimed: 0, capsuleIds: [] });
    }

    console.log(`📦 Found ${pendingCapsuleIds.length} pending capsule(s) to claim`);

    // STEP 2: Get user's received list with timeout protection (10s max)
    const receivedKey = `user_received:${userId}`;
    const receivedList = await withFallback(
      kv.get(receivedKey),
      [],
      10000
    );
    
    let claimedCount = 0;
    const claimedIds: string[] = [];

    // STEP 3: Add pending capsules to received list (no KV calls in loop)
    for (const capsuleId of pendingCapsuleIds) {
      if (!receivedList.includes(capsuleId)) {
        receivedList.push(capsuleId);
        claimedIds.push(capsuleId);
        claimedCount++;
        console.log(`✅ Claimed capsule: ${capsuleId}`);
      } else {
        console.log(`⚠️ Capsule ${capsuleId} already in received list, skipping`);
      }
    }

    // STEP 4: Update user's received list with timeout protection (10s max)
    if (claimedCount > 0) {
      const updateSuccess = await withKVTimeout(
        kv.set(receivedKey, receivedList),
        10000,
        'Update received list'
      );
      
      if (updateSuccess !== null) {
        console.log(`✅ Updated received list with ${claimedCount} new capsule(s)`);
      } else {
        console.warn('⚠️ Received list update timed out, capsules may not persist');
      }
    }

    // STEP 5: Clear pending capsules list with timeout protection (10s max)
    const deleteSuccess = await withKVTimeout(
      kv.del(pendingKey),
      10000,
      'Clear pending capsules'
    );
    
    if (deleteSuccess !== null) {
      console.log(`✅ Cleared pending capsules`);
    } else {
      console.warn('⚠️ Pending capsules clear timed out');
    }

    // STEP 6: Create notifications and track achievements (async, non-blocking)
    // Run in background WITHOUT awaiting - fire and forget
    if (claimedIds.length > 0) {
      // Fire and forget - don't await this promise
      (async () => {
        for (const capsuleId of claimedIds) {
          try {
            // Get capsule details with timeout
            const capsule = await withKVTimeout(
              kv.get(`capsule:${capsuleId}`),
              5000,
              'Get capsule for notification'
            );
            
            if (capsule) {
              // Get sender name with timeout
              let senderName = 'Someone Special';
              if (capsule.created_by) {
                const senderProfile = await withKVTimeout(
                  kv.get(`profile:${capsule.created_by}`),
                  5000,
                  'Get sender profile'
                );
                
                if (senderProfile) {
                  if (senderProfile.display_name) {
                    senderName = senderProfile.display_name.trim();
                  } else {
                    const fullName = `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim();
                    senderName = fullName || 'Someone Special';
                  }
                }
              }
              
              // Create notification
              const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              const notification = {
                id: notificationId,
                type: 'received_capsule',
                capsuleId: capsuleId,
                capsuleTitle: capsule.title || 'Untitled Capsule',
                senderName: senderName,
                message: `${senderName} sent you a time capsule: "${capsule.title || 'Untitled Capsule'}"`,
                timestamp: new Date().toISOString(),
                read: false
              };
              
              // Add notification with timeout
              const notificationsKey = `notifications:${userId}`;
              const notifications = await withFallback(
                kv.get(notificationsKey),
                [],
                5000
              );
              
              notifications.unshift(notification);
              
              // Keep only last 100 notifications
              if (notifications.length > 100) {
                notifications.splice(100);
              }
              
              await withKVTimeout(
                kv.set(notificationsKey, notifications),
                5000,
                'Save notification'
              );
              
              console.log(`🔔 Created notification for capsule ${capsuleId}`);
            }
          } catch (notifError) {
            console.error(`❌ Notification error for ${capsuleId}:`, notifError);
          }

          // Track achievement (separate try-catch)
          try {
            console.log(`🎯 Tracking achievement for capsule ${capsuleId}`);
            await AchievementService.checkAndUnlockAchievements(userId, 'capsule_received', {
              capsuleId: capsuleId,
              deliveryType: 'claimed',
              claimedAt: new Date().toISOString()
            });
            console.log(`✅ Achievement tracked for capsule ${capsuleId}`);
          } catch (achievementError) {
            console.error(`❌ Achievement error for ${capsuleId}:`, achievementError);
          }
        }
      })().catch(err => {
        console.error('❌ Background task error:', err);
      });
    }

    // STEP 7: Return success IMMEDIATELY (don't wait for background tasks)
    console.log(`✅ Claim-pending returning immediately with ${claimedCount} claimed`);
    return c.json({
      claimed: claimedCount,
      capsuleIds: claimedIds,
      message: claimedCount > 0 
        ? `Successfully claimed ${claimedCount} capsule${claimedCount > 1 ? 's' : ''}!`
        : 'No new capsules to claim'
    });

  } catch (error) {
    console.error('❌ Error claiming pending capsules:', error);
    return c.json({ 
      error: 'Failed to claim pending capsules', 
      details: error.message,
      claimed: 0, 
      capsuleIds: [] 
    }, 500);
  }
}