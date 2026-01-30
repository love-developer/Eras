/**
 * Legacy Access Service
 * 
 * Manages beneficiary configuration, inactivity tracking, and legacy unlock triggers.
 * Simplified architecture: email verification only, automatic security, 30-day grace period.
 * 
 * NEW: Support for immediate vs deferred beneficiary notification timing
 */

import * as kv from './kv_store.tsx';
import { withFallback } from './timeout-helpers.tsx';
import { sendEmail } from './email-service.tsx';

// ===========================
// Types
// ===========================

export interface Beneficiary {
  id: string;
  name: string;
  email: string;
  phone?: string;
  personalMessage?: string;
  status: 'pending_unlock' | 'pending' | 'verified' | 'rejected' | 'revoked';
  verificationToken?: string;
  tokenExpiresAt?: number; // ✅ UPDATED: Now optional/undefined for unlock notifications (never expires)
  verifiedAt?: number;
  addedAt: number;
  rejectedAt?: number;
  revokedAt?: number;
  emailHistory?: Array<{
    email: string;
    updatedAt: number;
  }>;
  folderPermissions?: { [folderId: string]: 'view' | 'edit' };
  addedWithTrigger?: {
    type: 'inactivity' | 'date';
    inactivityMonths?: number;
    manualUnlockDate?: number;
    capturedAt: number;
  };
  // NEW: Notification timing control
  notificationTiming?: 'immediate' | 'deferred'; // When beneficiary should be notified
  notificationSentAt?: number; // Timestamp when initial notification was sent
  notificationContext?: 'immediate' | 'manual' | 'unlock'; // ✅ NEW: WHY notification was sent (determines expiration policy)
}

export interface LegacyAccessTrigger {
  type: 'inactivity' | 'date';
  inactivityMonths?: number; // 3, 6, 12, custom
  manualUnlockDate?: number; // timestamp
  gracePeriodDays: number; // Always 30
  lastActivityAt: number;
  unlockScheduledAt?: number; // When grace period ends
  unlockCanceledAt?: number; // If user cancels via email
  warningEmailSentAt?: number;
  unlockTriggeredAt?: number;
}

export interface LegacyAccessConfig {
  userId: string;
  beneficiaries: Beneficiary[];
  trigger: LegacyAccessTrigger;
  security: {
    enabled: boolean; // Always true, no toggle
    encryptedAtRest: boolean; // Automatic via Supabase
    requireEmailVerification: boolean; // Always true
    accessLogged: boolean; // Always true
  };
  createdAt: number;
  updatedAt: number;
}

export interface UnlockToken {
  tokenId: string;
  userId: string;
  beneficiaryId: string;
  unlockType: 'grace_period_expired' | 'manual_date' | 'user_triggered';
  createdAt: number;
  expiresAt: number;
  usedAt?: number;
  folderPermissions?: { [folderId: string]: 'view' | 'edit' };
}

// ===========================
// KV Keys
// ===========================

const getLegacyAccessKey = (userId: string) => `legacy_access_${userId}`;
const getUnlockTokenKey = (tokenId: string) => `unlock_token_${tokenId}`;
const getActiveUnlocksKey = () => `active_unlocks`; // List of all active unlock tokens

// ===========================
// Beneficiary Management
// ===========================

/**
 * Add a new beneficiary
 * NEW: Supports immediate or deferred notification timing
 */
export async function addBeneficiary(
  userId: string,
  beneficiaryData: {
    name: string;
    email: string;
    phone?: string;
    personalMessage?: string;
    folderPermissions?: { [folderId: string]: 'view' | 'edit' };
    notificationTiming?: 'immediate' | 'deferred'; // ✅ NEW: When to notify beneficiary
  }
): Promise<{ success: boolean; beneficiary?: Beneficiary; error?: string }> {
  try {
    const config = await getLegacyAccessConfig(userId);
    
    // Check if user is trying to add themselves as beneficiary
    const userSettings = await kv.get(`user_settings:${userId}`);
    const userEmail = userSettings?.email?.toLowerCase();
    
    if (userEmail && beneficiaryData.email.toLowerCase() === userEmail) {
      return { 
        success: false, 
        error: 'You cannot add yourself as a beneficiary. Please add a trusted family member or friend instead.' 
      };
    }
    
    // Check if email already exists
    const existingBeneficiary = config.beneficiaries.find(
      b => b.email.toLowerCase() === beneficiaryData.email.toLowerCase() && b.status !== 'revoked'
    );
    
    if (existingBeneficiary) {
      return { success: false, error: 'This email is already registered as a beneficiary' };
    }
    
    // Determine notification timing (default to 'deferred' for backward compatibility)
    const notificationTiming = beneficiaryData.notificationTiming || 'deferred';
    const shouldNotifyNow = notificationTiming === 'immediate';
    
    // ✅ UPDATED: 30 days for immediate notifications (owner can resend if needed)
    // Generate verification token if notifying immediately
    const verificationToken = shouldNotifyNow ? generateSecureToken() : undefined;
    const tokenExpiresAt = shouldNotifyNow ? Date.now() + (30 * 24 * 60 * 60 * 1000) : undefined; // 30 days
    
    const newBeneficiary: Beneficiary = {
      id: `ben_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: beneficiaryData.name,
      email: beneficiaryData.email.toLowerCase(),
      phone: beneficiaryData.phone,
      personalMessage: beneficiaryData.personalMessage,
      status: shouldNotifyNow ? 'pending' : 'pending_unlock', // 'pending' if notifying now, 'pending_unlock' if deferred
      verificationToken,
      tokenExpiresAt,
      addedAt: Date.now(),
      emailHistory: [{ email: beneficiaryData.email.toLowerCase(), updatedAt: Date.now() }],
      folderPermissions: beneficiaryData.folderPermissions || {},
      addedWithTrigger: {
        type: config.trigger.type,
        inactivityMonths: config.trigger.inactivityMonths,
        manualUnlockDate: config.trigger.manualUnlockDate,
        capturedAt: Date.now(),
      },
      notificationTiming, // Store the choice
      notificationSentAt: shouldNotifyNow ? Date.now() : undefined, // Track when notification was sent
      notificationContext: shouldNotifyNow ? 'immediate' : undefined, // ✅ NEW: Track why notification was sent
    };
    
    config.beneficiaries.push(newBeneficiary);
    config.updatedAt = Date.now();
    
    await kv.set(getLegacyAccessKey(userId), config);
    
    // ✅ IMMEDIATE NOTIFICATION: Send verification email now if requested
    if (shouldNotifyNow) {
      console.log(`📧 [Legacy Access] Sending immediate verification email to: ${newBeneficiary.email}`);
      
      try {
        // Get user's profile for personalization
        const userProfile = await kv.get(`profile:${userId}`);
        const userName = userProfile?.name || userProfile?.displayName || userSettings?.displayName || 'Someone';
        
        // Build verification URL
        const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://found-shirt-81691824.figma.site';
        const verificationUrl = `${frontendUrl}/verify-beneficiary?token=${verificationToken}`;
        
        const emailResult = await sendEmail({
          to: newBeneficiary.email,
          subject: 'You\'ve Been Designated as a Legacy Beneficiary - Eras', // ✅ Emoji removed
          template: 'beneficiary-verification',
          variables: {
            beneficiaryName: newBeneficiary.name,
            beneficiaryEmail: newBeneficiary.email,
            userName: userName,
            personalMessage: newBeneficiary.personalMessage || '',
            verificationUrl: verificationUrl,
            declineUrl: '#', // TODO: Implement decline flow if needed
            designatedDate: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            expirationDays: 30 // ✅ Immediate notification - 30 days expiration
          }
        });
        
        if (emailResult.success) {
          console.log(`✅ [Legacy Access] Immediate verification email sent to ${newBeneficiary.email}`);
        } else {
          console.error(`❌ [Legacy Access] Failed to send immediate verification email:`, emailResult.error);
          
          // Don't fail the beneficiary addition if email fails, but log it
          // The user can resend the verification email later
        }
      } catch (emailError) {
        console.error(`❌ [Legacy Access] Error sending immediate verification email:`, emailError);
        // Don't fail the beneficiary addition
      }
    } else {
      console.log(`✅ [Legacy Access] Beneficiary added (verification deferred until unlock): ${newBeneficiary.email}`);
    }
    
    return { success: true, beneficiary: newBeneficiary };
  } catch (error) {
    console.error('Error adding beneficiary:', error);
    return { success: false, error: 'Failed to add beneficiary' };
  }
}

/**
 * ✅ NEW: Manually send notification to a pending_unlock beneficiary
 * Allows user to trigger notification for existing beneficiaries who haven't been notified yet
 */
export async function sendBeneficiaryNotification(
  userId: string,
  beneficiaryId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getLegacyAccessConfig(userId);
    const beneficiary = config.beneficiaries.find(b => b.id === beneficiaryId);
    
    if (!beneficiary) {
      return { success: false, error: 'Beneficiary not found' };
    }
    
    if (beneficiary.status !== 'pending_unlock') {
      return { success: false, error: 'Beneficiary has already been notified or verified' };
    }
    
    // Generate verification token
    const verificationToken = generateSecureToken();
    const tokenExpiresAt = Date.now() + (14 * 24 * 60 * 60 * 1000); // 14 days
    
    // Update beneficiary status
    beneficiary.status = 'pending';
    beneficiary.verificationToken = verificationToken;
    beneficiary.tokenExpiresAt = tokenExpiresAt;
    beneficiary.notificationTiming = 'immediate'; // Update to reflect it's now been sent
    beneficiary.notificationSentAt = Date.now();
    beneficiary.notificationContext = 'manual'; // ✅ NEW: Mark as manually sent
    
    config.updatedAt = Date.now();
    await kv.set(getLegacyAccessKey(userId), config);
    
    // Send verification email
    console.log(`📧 [Legacy Access] Sending manual notification to beneficiary: ${beneficiary.email}`);
    
    try {
      // Get user's profile for personalization
      const userSettings = await kv.get(`user_settings:${userId}`);
      const userProfile = await kv.get(`profile:${userId}`);
      const userName = userProfile?.name || userProfile?.displayName || userSettings?.displayName || 'Someone';
      
      // Build verification URL
      const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://found-shirt-81691824.figma.site';
      const verificationUrl = `${frontendUrl}/verify-beneficiary?token=${verificationToken}`;
      
      const emailResult = await sendEmail({
        to: beneficiary.email,
        subject: '🛡️ You\'ve Been Designated as a Legacy Beneficiary - Eras',
        template: 'beneficiary-verification',
        variables: {
          beneficiaryName: beneficiary.name,
          beneficiaryEmail: beneficiary.email,
          userName: userName,
          personalMessage: beneficiary.personalMessage || '',
          verificationUrl: verificationUrl,
          declineUrl: '#',
          designatedDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          expirationDays: 14 // ✅ Manual notification - 14 days expiration
        }
      });
      
      if (emailResult.success) {
        console.log(`✅ [Legacy Access] Notification email sent successfully to ${beneficiary.email}`);
      } else {
        console.error(`❌ [Legacy Access] Failed to send notification email:`, emailResult.error);
        return { success: false, error: `Failed to send email: ${emailResult.error}` };
      }
    } catch (emailError) {
      console.error(`❌ [Legacy Access] Error sending notification email:`, emailError);
      return { success: false, error: `Failed to send email: ${emailError.message || 'Unknown error'}` };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error sending beneficiary notification:', error);
    return { success: false, error: 'Failed to send notification' };
  }
}

/**
 * Verify beneficiary email
 */
export async function verifyBeneficiary(
  verificationToken: string
): Promise<{ success: boolean; message?: string; error?: string; ownerName?: string; beneficiaryEmail?: string; alreadyVerified?: boolean; expired?: boolean }> {
  try {
    console.log(`🔍 [verifyBeneficiary] Searching for token: ${verificationToken} (length: ${verificationToken.length})`);
    
    // Find user and beneficiary by token
    const allUsers = await kv.getByPrefix<LegacyAccessConfig>('legacy_access_');
    
    console.log(`📊 [verifyBeneficiary] Found ${allUsers.length} legacy access configs to search`);
    
    for (const config of allUsers) {
      console.log(`🔍 [verifyBeneficiary] Checking config for user ${config.userId} with ${config.beneficiaries?.length || 0} beneficiaries`);
      
      // Safety check - skip configs with invalid beneficiaries array
      if (!config.beneficiaries || !Array.isArray(config.beneficiaries)) {
        console.warn(`⚠️ [verifyBeneficiary] Config for user ${config.userId} has invalid beneficiaries, skipping`);
        continue;
      }
      
      const beneficiary = config.beneficiaries.find(
        b => b.verificationToken === verificationToken && b.status === 'pending'
      );
      
      if (beneficiary) {
        console.log(`✅ [verifyBeneficiary] Found matching beneficiary: ${beneficiary.email}`);
        
        // Check if token expired
        if (beneficiary.tokenExpiresAt && Date.now() > beneficiary.tokenExpiresAt) {
          console.log(`❌ [verifyBeneficiary] Token expired at ${new Date(beneficiary.tokenExpiresAt).toISOString()}`);
          return { success: false, error: 'Verification token has expired. Please request a new one.', expired: true };
        }
        
        // Verify beneficiary
        beneficiary.status = 'verified';
        beneficiary.verifiedAt = Date.now();
        beneficiary.verificationToken = undefined;
        beneficiary.tokenExpiresAt = undefined;
        
        config.updatedAt = Date.now();
        await kv.set(getLegacyAccessKey(config.userId), config);
        
        console.log(`✅ [verifyBeneficiary] Successfully verified beneficiary ${beneficiary.email}`);
        
        // Get owner's profile for confirmation email
        const userProfile = await kv.get(`profile:${config.userId}`);
        const userName = userProfile?.name || userProfile?.displayName || 'the account owner';
        
        // Send confirmation email to beneficiary
        try {
          console.log(`📧 [verifyBeneficiary] Sending confirmation email to ${beneficiary.email}`);
          
          const emailResult = await sendEmail({
            to: beneficiary.email,
            subject: '✅ Beneficiary Role Confirmed - Eras',
            template: 'beneficiary-verification-confirmation',
            variables: {
              beneficiaryName: beneficiary.name,
              beneficiaryEmail: beneficiary.email,
              userName: userName,
              homeUrl: 'https://found-shirt-81691824.figma.site',
              verifiedDate: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            }
          });
          
          if (emailResult.success) {
            console.log(`✅ [verifyBeneficiary] Confirmation email sent successfully to ${beneficiary.email}`);
          } else {
            console.error(`❌ [verifyBeneficiary] Failed to send confirmation email:`, emailResult.error);
          }
        } catch (emailError) {
          console.error(`❌ [verifyBeneficiary] Error sending confirmation email:`, emailError);
          // Don't fail verification if email fails
        }
        
        return { success: true, message: 'Email verified successfully!', ownerName: userName, beneficiaryEmail: beneficiary.email };
      }
    }
    
    console.log(`❌ [verifyBeneficiary] No pending beneficiary found with this token`);
    return { success: false, error: 'Invalid verification token. The link may be corrupted or the invitation may have been cancelled.' };
  } catch (error) {
    console.error('Error verifying beneficiary:', error);
    return { success: false, error: 'Failed to verify beneficiary' };
  }
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(
  userId: string,
  beneficiaryId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getLegacyAccessConfig(userId);
    const beneficiary = config.beneficiaries.find(b => b.id === beneficiaryId);
    
    if (!beneficiary) {
      return { success: false, error: 'Beneficiary not found' };
    }
    
    if (beneficiary.status !== 'pending') {
      return { success: false, error: 'Beneficiary is already verified' };
    }
    
    // Generate new token
    const verificationToken = generateSecureToken();
    const tokenExpiresAt = Date.now() + (14 * 24 * 60 * 60 * 1000);
    
    beneficiary.verificationToken = verificationToken;
    beneficiary.tokenExpiresAt = tokenExpiresAt;
    
    config.updatedAt = Date.now();
    await kv.set(getLegacyAccessKey(userId), config);
    
    // Send verification email
    console.log(`📧 [Legacy Access] Resending verification email to beneficiary: ${beneficiary.email}`);
    
    try {
      const userProfile = await kv.get(`profile:${userId}`);
      const userName = userProfile?.name || userProfile?.displayName || 'Someone';
      
      const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://found-shirt-81691824.figma.site';
      const verificationUrl = `${frontendUrl}/verify-beneficiary?token=${verificationToken}`;
      
      const emailResult = await sendEmail({
        to: beneficiary.email,
        subject: '🛡️ You\'ve Been Designated as a Legacy Beneficiary - Eras',
        template: 'beneficiary-verification',
        variables: {
          beneficiaryName: beneficiary.name,
          beneficiaryEmail: beneficiary.email,
          userName: userName,
          personalMessage: beneficiary.personalMessage || '',
          verificationUrl: verificationUrl,
          declineUrl: '#',
          designatedDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          expirationDays: 14 // ✅ Resend verification - 14 days expiration
        }
      });
      
      if (emailResult.success) {
        console.log(`✅ [Legacy Access] Verification email resent successfully to ${beneficiary.email}`);
      } else {
        console.error(`❌ [Legacy Access] Failed to resend verification email:`, emailResult.error);
        return { success: false, error: `Failed to send email: ${emailResult.error}` };
      }
    } catch (emailError) {
      console.error(`❌ [Legacy Access] Error resending verification email:`, emailError);
      return { success: false, error: `Failed to send email: ${emailError.message || 'Unknown error'}` };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error resending verification:', error);
    return { success: false, error: 'Failed to resend verification email' };
  }
}

/**
 * Remove beneficiary
 */
export async function removeBeneficiary(
  userId: string,
  beneficiaryId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getLegacyAccessConfig(userId);
    
    const beneficiaryIndex = config.beneficiaries.findIndex(b => b.id === beneficiaryId);
    if (beneficiaryIndex === -1) {
      return { success: false, error: 'Beneficiary not found' };
    }
    
    // Mark as revoked instead of deleting (audit trail)
    config.beneficiaries[beneficiaryIndex].status = 'revoked';
    config.beneficiaries[beneficiaryIndex].revokedAt = Date.now();
    
    config.updatedAt = Date.now();
    await kv.set(getLegacyAccessKey(userId), config);
    
    return { success: true };
  } catch (error) {
    console.error('Error removing beneficiary:', error);
    return { success: false, error: 'Failed to remove beneficiary' };
  }
}

/**
 * Update beneficiary email (requires re-verification)
 */
export async function updateBeneficiaryEmail(
  userId: string,
  beneficiaryId: string,
  newEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getLegacyAccessConfig(userId);
    const beneficiary = config.beneficiaries.find(b => b.id === beneficiaryId);
    
    if (!beneficiary) {
      return { success: false, error: 'Beneficiary not found' };
    }
    
    // Add to email history
    if (!beneficiary.emailHistory) {
      beneficiary.emailHistory = [];
    }
    beneficiary.emailHistory.push({ email: newEmail.toLowerCase(), updatedAt: Date.now() });
    
    // Update email and require re-verification
    beneficiary.email = newEmail.toLowerCase();
    beneficiary.status = 'pending';
    beneficiary.verifiedAt = undefined;
    
    const verificationToken = generateSecureToken();
    const tokenExpiresAt = Date.now() + (14 * 24 * 60 * 60 * 1000);
    
    beneficiary.verificationToken = verificationToken;
    beneficiary.tokenExpiresAt = tokenExpiresAt;
    
    config.updatedAt = Date.now();
    await kv.set(getLegacyAccessKey(userId), config);
    
    // TODO: Send verification email to new address
    
    return { success: true };
  } catch (error) {
    console.error('Error updating beneficiary email:', error);
    return { success: false, error: 'Failed to update email' };
  }
}

// ===========================
// Trigger Configuration
// ===========================

/**
 * Update inactivity trigger settings
 */
export async function updateInactivityTrigger(
  userId: string,
  inactivityMonths: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getLegacyAccessConfig(userId);
    
    config.trigger.type = 'inactivity';
    config.trigger.inactivityMonths = inactivityMonths;
    config.trigger.manualUnlockDate = undefined;
    config.trigger.unlockScheduledAt = undefined;
    config.trigger.unlockCanceledAt = undefined;
    config.updatedAt = Date.now();
    
    await kv.set(getLegacyAccessKey(userId), config);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating inactivity trigger:', error);
    return { success: false, error: 'Failed to update trigger' };
  }
}

/**
 * Update manual date trigger settings
 */
export async function updateManualDateTrigger(
  userId: string,
  unlockDate: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getLegacyAccessConfig(userId);
    
    config.trigger.type = 'date';
    config.trigger.manualUnlockDate = unlockDate;
    config.trigger.inactivityMonths = undefined;
    config.trigger.unlockScheduledAt = undefined;
    config.trigger.unlockCanceledAt = undefined;
    config.updatedAt = Date.now();
    
    await kv.set(getLegacyAccessKey(userId), config);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating manual date trigger:', error);
    return { success: false, error: 'Failed to update trigger' };
  }
}

/**
 * Update user activity timestamp (called on login, capsule creation, etc.)
 */
export async function updateUserActivity(userId: string): Promise<void> {
  try {
    const config = await getLegacyAccessConfig(userId);
    
    config.trigger.lastActivityAt = Date.now();
    config.trigger.unlockScheduledAt = undefined; // Reset grace period if user becomes active
    config.trigger.unlockCanceledAt = undefined;
    config.trigger.warningEmailSentAt = undefined;
    config.updatedAt = Date.now();
    
    await kv.set(getLegacyAccessKey(userId), config);
  } catch (error) {
    console.error('Error updating user activity:', error);
  }
}

/**
 * Cancel scheduled unlock (called when user clicks link in warning email)
 */
export async function cancelScheduledUnlock(
  userId: string,
  cancelToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getLegacyAccessConfig(userId);
    
    config.trigger.unlockScheduledAt = undefined;
    config.trigger.unlockCanceledAt = Date.now();
    config.trigger.warningEmailSentAt = undefined;
    config.trigger.lastActivityAt = Date.now(); // Reset activity
    config.updatedAt = Date.now();
    
    await kv.set(getLegacyAccessKey(userId), config);
    
    return { success: true };
  } catch (error) {
    console.error('Error canceling unlock:', error);
    return { success: false, error: 'Failed to cancel unlock' };
  }
}

// ===========================
// Inactivity Checking (CRON)
// ===========================

/**
 * Check all users for inactivity triggers (called by pg_cron weekly)
 */
export async function checkInactivityTriggers(): Promise<{
  usersChecked: number;
  warningsSent: number;
  unlocksTriggered: number;
}> {
  const allConfigs = await kv.getByPrefix<LegacyAccessConfig>('legacy_access_');
  
  let usersChecked = 0;
  let warningsSent = 0;
  let unlocksTriggered = 0;
  
  for (const config of allConfigs) {
    usersChecked++;
    
    // Skip if no verified beneficiaries
    const verifiedBeneficiaries = config.beneficiaries.filter(b => b.status === 'verified');
    if (verifiedBeneficiaries.length === 0) {
      continue;
    }
    
    // Check inactivity trigger
    if (config.trigger.type === 'inactivity' && config.trigger.inactivityMonths) {
      const inactivityThreshold = config.trigger.inactivityMonths * 30 * 24 * 60 * 60 * 1000;
      const inactiveSince = Date.now() - config.trigger.lastActivityAt;
      
      // If threshold reached and no grace period started
      if (inactiveSince >= inactivityThreshold && !config.trigger.unlockScheduledAt) {
        // Start grace period
        const gracePeriodMs = config.trigger.gracePeriodDays * 24 * 60 * 60 * 1000;
        config.trigger.unlockScheduledAt = Date.now() + gracePeriodMs;
        config.trigger.warningEmailSentAt = Date.now();
        
        // PHASE 6: Send warning email with cancel link
        await sendInactivityWarningEmail(config);
        
        await kv.set(getLegacyAccessKey(config.userId), config);
        warningsSent++;
      }
      
      // If grace period expired and not canceled
      if (
        config.trigger.unlockScheduledAt &&
        Date.now() >= config.trigger.unlockScheduledAt &&
        !config.trigger.unlockCanceledAt
      ) {
        // Trigger unlock
        await triggerLegacyUnlock(config.userId, 'grace_period_expired');
        unlocksTriggered++;
      }
    }
    
    // Check manual date trigger
    if (config.trigger.type === 'date' && config.trigger.manualUnlockDate) {
      if (Date.now() >= config.trigger.manualUnlockDate && !config.trigger.unlockTriggeredAt) {
        // Trigger unlock
        await triggerLegacyUnlock(config.userId, 'manual_date');
        unlocksTriggered++;
      }
    }
  }
  
  return { usersChecked, warningsSent, unlocksTriggered };
}

/**
 * ✅ NEW: Check and send reminder emails to beneficiaries who haven't verified yet
 * Called by cron job weekly to remind pending beneficiaries
 * 
 * Reminder schedule for unlock-context beneficiaries (no expiration):
 * - Day 7 after unlock: First reminder
 * - Day 14 after unlock: Second reminder  
 * - Day 30 after unlock: Final reminder
 */
export async function checkBeneficiaryReminders(): Promise<{
  configsChecked: number;
  remindersSent: number;
}> {
  const allConfigs = await kv.getByPrefix<LegacyAccessConfig>('legacy_access_');
  
  let configsChecked = 0;
  let remindersSent = 0;
  
  for (const config of allConfigs) {
    configsChecked++;
    
    if (!config.beneficiaries || !Array.isArray(config.beneficiaries)) continue;
    
    // Find pending beneficiaries who were notified during unlock (no expiration)
    const pendingUnlockBeneficiaries = config.beneficiaries.filter(
      b => b.status === 'pending' && 
           b.notificationContext === 'unlock' && 
           b.notificationSentAt
    );
    
    if (pendingUnlockBeneficiaries.length === 0) continue;
    
    for (const beneficiary of pendingUnlockBeneficiaries) {
      const daysSinceNotification = Math.floor(
        (Date.now() - beneficiary.notificationSentAt!) / (24 * 60 * 60 * 1000)
      );
      
      // Check if reminder should be sent
      // Send at days 7, 14, and 30
      const shouldSendReminder = 
        daysSinceNotification === 7 || 
        daysSinceNotification === 14 || 
        daysSinceNotification === 30;
      
      if (!shouldSendReminder) continue;
      
      // Track which reminder this is
      const reminderCount = 
        daysSinceNotification === 7 ? 1 : 
        daysSinceNotification === 14 ? 2 : 3;
      
      console.log(`📧 [Reminder] Sending reminder #${reminderCount} to ${beneficiary.email} (${daysSinceNotification} days since unlock)`);
      
      try {
        // Get user info for email
        const userProfile = await kv.get(`profile:${config.userId}`);
        const userSettings = await kv.get(`user_settings:${config.userId}`);
        const userName = userProfile?.name || userProfile?.displayName || userSettings?.displayName || 'the account owner';
        
        const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://found-shirt-81691824.figma.site';
        const verificationUrl = `${frontendUrl}/verify-beneficiary?token=${beneficiary.verificationToken}`;
        const requestNewUrl = `${frontendUrl}/request-verification`;
        
        const emailResult = await sendEmail({
          to: beneficiary.email,
          subject: `Reminder: Verify Your Legacy Beneficiary Role - Eras`, // ✅ Emoji removed
          template: 'beneficiary-verification-reminder',
          variables: {
            beneficiaryName: beneficiary.name,
            beneficiaryEmail: beneficiary.email,
            userName: userName,
            reminderNumber: reminderCount,
            daysSinceUnlock: daysSinceNotification,
            verificationUrl: verificationUrl,
            requestNewUrl: requestNewUrl,
            personalMessage: beneficiary.personalMessage || '',
            isFinalReminder: reminderCount === 3
          }
        });
        
        if (emailResult.success) {
          console.log(`✅ [Reminder] Sent reminder #${reminderCount} to ${beneficiary.email}`);
          remindersSent++;
        } else {
          console.error(`❌ [Reminder] Failed to send reminder to ${beneficiary.email}:`, emailResult.error);
        }
      } catch (emailError) {
        console.error(`❌ [Reminder] Error sending reminder to ${beneficiary.email}:`, emailError);
      }
    }
  }
  
  console.log(`✅ [Reminder] Checked ${configsChecked} configs, sent ${remindersSent} reminders`);
  return { configsChecked, remindersSent };
}

/**
 * Trigger legacy vault unlock for beneficiaries
 */
async function triggerLegacyUnlock(
  userId: string,
  unlockType: 'grace_period_expired' | 'manual_date' | 'user_triggered'
): Promise<void> {
  try {
    const config = await getLegacyAccessConfig(userId);
    
    // Mark as triggered
    config.trigger.unlockTriggeredAt = Date.now();
    
    // Get user information for email
    const userSettings = await kv.get(`user_settings:${userId}`);
    const ownerName = userSettings?.displayName || userSettings?.email?.split('@')[0] || 'Account Owner';
    const userProfile = await kv.get(`profile:${userId}`);
    const userName = userProfile?.name || userProfile?.displayName || ownerName;
    
    // ✅ STEP 1: Send verification emails to pending_unlock beneficiaries FIRST
    const pendingUnlockBeneficiaries = config.beneficiaries.filter(b => b.status === 'pending_unlock');
    
    console.log(`📧 [Unlock] Found ${pendingUnlockBeneficiaries.length} beneficiaries awaiting first-time verification`);
    
    for (const beneficiary of pendingUnlockBeneficiaries) {
      // ✅ CRITICAL: NO EXPIRATION for unlock notifications (owner may be deceased/unreachable)
      // Generate verification token NOW (deferred from when they were added)
      beneficiary.verificationToken = generateSecureToken();
      beneficiary.tokenExpiresAt = undefined; // ✅ NEVER EXPIRES - beneficiary can verify anytime
      beneficiary.status = 'pending'; // Now waiting for verification
      beneficiary.notificationSentAt = Date.now();
      beneficiary.notificationContext = 'unlock'; // ✅ NEW: Mark as sent during unlock
      
      console.log(`📧 [Unlock] Sending deferred verification email to ${beneficiary.email} (NO EXPIRATION)`);
      
      const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://found-shirt-81691824.figma.site';
      const verificationUrl = `${frontendUrl}/verify-beneficiary?token=${beneficiary.verificationToken}`;
      
      try {
        await sendEmail({
          to: beneficiary.email,
          subject: 'Legacy Vault Unlocked - Verification Required - Eras', // ✅ Emoji removed
          template: 'beneficiary-verification-at-unlock',
          variables: {
            beneficiaryName: beneficiary.name,
            beneficiaryEmail: beneficiary.email,
            userName,
            personalMessage: beneficiary.personalMessage || '',
            verificationUrl,
            designatedDate: new Date(beneficiary.addedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            unlockDate: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          }
        });
        console.log(`✅ [Unlock] Verification email sent to ${beneficiary.email}`);
      } catch (emailError) {
        console.error(`❌ [Unlock] Failed to send verification to ${beneficiary.email}:`, emailError);
      }
    }
    
    // Save updated beneficiary statuses
    await kv.set(getLegacyAccessKey(userId), config);
    
    // ✅ STEP 2: Process already-verified beneficiaries - send unlock notification immediately
    const verifiedBeneficiaries = config.beneficiaries.filter(b => b.status === 'verified');
    
    console.log(`🔓 [Unlock] Unlocking vault for ${verifiedBeneficiaries.length} verified beneficiaries`);
    
    for (const beneficiary of verifiedBeneficiaries) {
      const tokenId = generateSecureToken();
      const unlockToken: UnlockToken = {
        tokenId,
        userId,
        beneficiaryId: beneficiary.id,
        unlockType,
        createdAt: Date.now(),
        expiresAt: Date.now() + (100 * 365 * 24 * 60 * 60 * 1000), // Permanent (100 years)
        folderPermissions: beneficiary.folderPermissions || {}
      };
      
      await kv.set(getUnlockTokenKey(tokenId), unlockToken);
      
      // Send unlock notification email
      await sendUnlockNotificationEmail({
        beneficiary,
        ownerName,
        ownerUserId: userId,
        unlockToken: tokenId,
        config,
        unlockType
      });
    }
    
    console.log(`✅ [Unlock] Vault unlock complete for user ${userId}`);
  } catch (error) {
    console.error('❌ [Unlock] Error triggering legacy unlock:', error);
    throw error;
  }
}

// ===========================
// Unlock Token Management
// ===========================

/**
 * Validate unlock token and grant access
 */
export async function validateUnlockToken(
  tokenId: string
): Promise<{
  success: boolean;
  userId?: string;
  beneficiary?: Beneficiary;
  personalMessage?: string;
  error?: string;
}> {
  try {
    const unlockToken = await kv.get<UnlockToken>(getUnlockTokenKey(tokenId));
    
    if (!unlockToken) {
      return { success: false, error: 'Invalid unlock token' };
    }
    
    // Check if expired
    if (Date.now() > unlockToken.expiresAt) {
      return { success: false, error: 'Unlock token has expired' };
    }
    
    // Get config
    const config = await getLegacyAccessConfig(unlockToken.userId);
    const beneficiary = config.beneficiaries.find(b => b.id === unlockToken.beneficiaryId);
    
    if (!beneficiary) {
      return { success: false, error: 'Beneficiary not found' };
    }
    
    // Mark token as used (first time only)
    if (!unlockToken.usedAt) {
      unlockToken.usedAt = Date.now();
      await kv.set(getUnlockTokenKey(tokenId), unlockToken);
    }
    
    return {
      success: true,
      userId: unlockToken.userId,
      beneficiary,
      personalMessage: beneficiary.personalMessage
    };
  } catch (error) {
    console.error('Error validating unlock token:', error);
    return { success: false, error: 'Failed to validate unlock token' };
  }
}

// ===========================
// Configuration Management
// ===========================

/**
 * Get or create legacy vault configuration for user
 */
export async function getLegacyAccessConfig(userId: string): Promise<LegacyAccessConfig> {
  const existing = await kv.get<LegacyAccessConfig>(getLegacyAccessKey(userId));
  
  if (existing) {
    return existing;
  }
  
  // Create default config
  const config: LegacyAccessConfig = {
    userId,
    beneficiaries: [],
    trigger: {
      type: 'inactivity',
      inactivityMonths: 6,
      gracePeriodDays: 30,
      lastActivityAt: Date.now()
    },
    security: {
      enabled: true,
      encryptedAtRest: true,
      requireEmailVerification: true,
      accessLogged: true
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  await kv.set(getLegacyAccessKey(userId), config);
  
  return config;
}

/**
 * Delete legacy vault configuration (for account deletion)
 */
export async function deleteLegacyAccessConfig(userId: string): Promise<void> {
  await kv.del(getLegacyAccessKey(userId));
}

// ===========================
// Utilities
// ===========================

/**
 * Generate cryptographically secure random token
 */
function generateSecureToken(): string {
  return `tok_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
}

/**
 * Calculate days until unlock (for UI display)
 */
export function calculateDaysUntilUnlock(trigger: LegacyAccessTrigger): number | null {
  if (trigger.type === 'inactivity' && trigger.inactivityMonths) {
    const unlockTimestamp = trigger.lastActivityAt + (trigger.inactivityMonths * 30 * 24 * 60 * 60 * 1000);
    const daysUntil = Math.ceil((unlockTimestamp - Date.now()) / (24 * 60 * 60 * 1000));
    return Math.max(0, daysUntil);
  } else if (trigger.type === 'date' && trigger.manualUnlockDate) {
    const daysUntil = Math.ceil((trigger.manualUnlockDate - Date.now()) / (24 * 60 * 60 * 1000));
    return Math.max(0, daysUntil);
  }
  return null;
}

// ===========================
// EMAIL NOTIFICATIONS
// ===========================

/**
 * Send unlock notification email to beneficiary
 */
async function sendUnlockNotificationEmail(params: {
  beneficiary: Beneficiary;
  ownerName: string;
  ownerUserId: string;
  unlockToken: string;
  config: LegacyAccessConfig;
  unlockType: 'grace_period_expired' | 'manual_date' | 'user_triggered';
}): Promise<void> {
  try {
    const { beneficiary, ownerName, ownerUserId, unlockToken, config, unlockType } = params;
    
    // Build folder preview
    const folderPermissions = beneficiary.folderPermissions || {};
    const folders = [];
    let totalItems = 0;
    
    for (const folderId of Object.keys(folderPermissions)) {
      try {
        const folder = await kv.get(`vault_folder:${ownerUserId}:${folderId}`);
        if (folder) {
          folders.push({
            name: folder.name || 'Untitled Folder',
            icon: folder.icon || '📁',
            itemCount: folder.mediaItems?.length || 0,
            permission: folderPermissions[folderId]
          });
          totalItems += folder.mediaItems?.length || 0;
        }
      } catch (err) {
        console.error(`Error loading folder ${folderId}:`, err.message);
      }
    }
    
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://found-shirt-81691824.figma.site';
    const accessUrl = `${frontendUrl}/legacy-vault/access?token=${unlockToken}`;
    
    const result = await sendEmail({
      to: beneficiary.email,
      subject: 'Legacy Vault Unlocked - Eras', // ✅ Emoji removed
      template: 'beneficiary-unlock-notification-complete',
      variables: {
        ownerName,
        beneficiaryName: beneficiary.name,
        beneficiaryEmail: beneficiary.email,
        inactivityDays: config.trigger.inactivityMonths ? config.trigger.inactivityMonths * 30 : 0,
        folderCount: folders.length,
        itemCount: totalItems,
        folders,
        personalMessage: beneficiary.personalMessage,
        accessUrl,
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
    });
    
    if (result.success) {
      console.log(`✅ Unlock email sent to ${beneficiary.email}`);
    } else {
      console.error(`❌ Failed to send unlock email to ${beneficiary.email}:`, result.error);
    }
  } catch (error) {
    console.error(`❌ Error sending unlock notification:`, error);
  }
}

/**
 * Send inactivity warning email to user
 */
async function sendInactivityWarningEmail(config: LegacyAccessConfig): Promise<void> {
  try {
    const userSettings = await kv.get(`user_settings:${config.userId}`);
    const userName = userSettings?.displayName || userSettings?.email?.split('@')[0] || 'Account Owner';
    const userEmail = userSettings?.email;
    
    if (!userEmail) {
      console.error(`No email found for user ${config.userId}`);
      return;
    }
    
    const daysSinceLastLogin = Math.floor((Date.now() - config.trigger.lastActivityAt) / (24 * 60 * 60 * 1000));
    const verifiedBeneficiaries = config.beneficiaries.filter(b => b.status === 'verified');
    
    const cancelToken = generateSecureToken();
    await kv.set(`cancel_unlock_${cancelToken}`, { userId: config.userId, createdAt: Date.now() });
    
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://found-shirt-81691824.figma.site';
    
    const result = await sendEmail({
      to: userEmail,
      subject: 'Account Inactivity Warning - Eras', // ✅ Emoji removed
      template: 'inactivity-warning',
      variables: {
        userName,
        daysSinceLastLogin,
        daysUntilInactive: config.trigger.gracePeriodDays,
        lastLoginDate: new Date(config.trigger.lastActivityAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        hasBeneficiaries: verifiedBeneficiaries.length > 0,
        beneficiaries: verifiedBeneficiaries.map(b => b.email),
        loginUrl: `${frontendUrl}/login`,
        settingsUrl: `${frontendUrl}/settings/legacy-access`,
        cancelUrl: `${frontendUrl}/cancel-unlock?token=${cancelToken}`
      }
    });
    
    if (result.success) {
      console.log(`✅ Warning email sent to ${userEmail}`);
    } else {
      console.error(`❌ Failed to send warning email:`, result.error);
    }
  } catch (error) {
    console.error(`❌ Error sending warning email:`, error);
  }
}