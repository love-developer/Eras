import { sendEmail, queueEmail } from './email-service.tsx';
import * as kv from './kv_store.tsx';
import * as LegacyAccessService from './legacy-access-service.tsx';

// Check for users who need inactivity warnings
export async function checkInactivityWarnings() {
  console.log('🔍 Checking for inactivity warnings...');
  
  const now = new Date();
  let warningsSent = 0;

  try {
    // Get all users with their last login info
    const usersData = await kv.getByPrefix('user:');
    
    for (const { key, value: user } of usersData) {
      // Skip if legacy access not enabled
      if (!user.legacyAccessEnabled) continue;
      
      // Skip if account already inactive
      if (user.accountStatus === 'inactive') continue;

      // Calculate days since last login
      const lastLogin = new Date(user.lastLoginAt || user.createdAt);
      const daysSinceLogin = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
      
      // Get user's inactivity settings (default to 90 days threshold, 14 days warning)
      const inactivityThreshold = user.inactivityThresholdDays || 90;
      const warningDays = user.warningDays || 14;
      const warningThreshold = inactivityThreshold - warningDays;
      
      // Check if warning should be sent (exact day match)
      if (daysSinceLogin === warningThreshold) {
        // Check if warning already sent recently
        const warningKey = `inactivity_warning:${user.id}:${now.toISOString().split('T')[0]}`;
        const existingWarning = await kv.get(warningKey);
        
        if (existingWarning) {
          console.log(`⏭️ Warning already sent for user ${user.id}`);
          continue;
        }

        // Get beneficiaries
        const beneficiariesData = await kv.getByPrefix(`beneficiary:${user.id}:`);
        const beneficiaries = beneficiariesData.map(b => b.value.email);

        // Prepare email variables
        const appUrl = Deno.env.get('APP_URL') || 'https://eras.app';
        const emailVars = {
          userName: user.name || user.email,
          userEmail: user.email,
          daysSinceLastLogin: daysSinceLogin,
          daysUntilInactive: inactivityThreshold - daysSinceLogin,
          lastLoginDate: lastLogin.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          hasBeneficiaries: beneficiaries.length > 0,
          beneficiaries: beneficiaries,
          loginUrl: `${appUrl}/login`,
          settingsUrl: `${appUrl}/settings/account#legacy`,
          appUrl: appUrl,
        };

        // Send warning email
        const result = await sendEmail({
          to: user.email,
          subject: `Action Required: Your Eras account will become inactive in ${warningDays} days`,
          template: 'inactivity-warning',
          variables: emailVars,
        });

        if (result.success) {
          // Mark warning as sent
          await kv.set(warningKey, {
            userId: user.id,
            sentAt: now.toISOString(),
            daysUntilInactive: inactivityThreshold - daysSinceLogin,
          });
          warningsSent++;
          console.log(`✅ Inactivity warning sent to ${user.email}`);
        } else {
          // Queue for retry
          await queueEmail({
            type: 'inactivity-warning',
            recipientEmail: user.email,
            subject: `Action Required: Your Eras account will become inactive in ${warningDays} days`,
            template: 'inactivity-warning',
            variables: emailVars,
          }, kv);
        }
      }
    }

    console.log(`✅ Inactivity warnings check complete: ${warningsSent} warnings sent`);
    return { warningsSent };
  } catch (error) {
    console.error('❌ Error checking inactivity warnings:', error);
    throw error;
  }
}

// Check for accounts that should be marked inactive and grant access to beneficiaries
export async function checkInactiveAccounts() {
  console.log('🔍 Checking for inactive accounts...');
  
  const now = new Date();
  let accountsMarkedInactive = 0;
  let accessGrantsIssued = 0;

  try {
    // Get all users
    const usersData = await kv.getByPrefix('user:');
    
    for (const { key, value: user } of usersData) {
      // Skip if legacy access not enabled
      if (!user.legacyAccessEnabled) continue;
      
      // Skip if already inactive
      if (user.accountStatus === 'inactive') continue;

      // Calculate days since last login
      const lastLogin = new Date(user.lastLoginAt || user.createdAt);
      const daysSinceLogin = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
      
      // Get user's inactivity threshold (default 90 days)
      const inactivityThreshold = user.inactivityThresholdDays || 90;
      
      // Check if threshold reached
      if (daysSinceLogin >= inactivityThreshold) {
        // Check if already processed
        const accessGrantKey = `legacy_access_grant:${user.id}`;
        const existingGrant = await kv.get(accessGrantKey);
        
        if (existingGrant) {
          console.log(`⏭️ Access already granted for user ${user.id}`);
          continue;
        }

        // Mark account as inactive
        await kv.set(key, {
          ...user,
          accountStatus: 'inactive',
          inactiveAt: now.toISOString(),
        });
        accountsMarkedInactive++;
        console.log(`⚠️ Account marked inactive: ${user.email}`);

        // Get beneficiaries
        const beneficiariesData = await kv.getByPrefix(`beneficiary:${user.id}:`);
        
        if (beneficiariesData.length === 0) {
          console.log(`ℹ️ No beneficiaries for user ${user.id}`);
          continue;
        }

        // Get account stats
        const capsulesData = await kv.getByPrefix(`capsule:${user.id}:`);
        const vaultItemsData = await kv.getByPrefix(`vault_item:${user.id}:`);

        const capsuleCount = capsulesData.length;
        const vaultItemCount = vaultItemsData.length;

        // Send access granted email to each beneficiary
        for (const { value: beneficiary } of beneficiariesData) {
          const accessToken = crypto.randomUUID();
          
          // Store access grant
          const grantKey = `legacy_access_grant:${user.id}:${beneficiary.email}`;
          await kv.set(grantKey, {
            userId: user.id,
            beneficiaryEmail: beneficiary.email,
            grantedAt: now.toISOString(),
            accessToken: accessToken,
            expiresAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
          });

          // Prepare email variables
          const appUrl = Deno.env.get('APP_URL') || 'https://eras.app';
          const emailVars = {
            beneficiaryEmail: beneficiary.email,
            userName: user.name || user.email,
            userEmail: user.email,
            inactivityDays: daysSinceLogin,
            capsuleCount: capsuleCount,
            vaultItemCount: vaultItemCount,
            legacyMessage: user.legacyMessage || null,
            accessUrl: `${appUrl}/legacy-access/${accessToken}`,
            inactiveDate: now.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            appUrl: appUrl,
          };

          // Send email
          const result = await sendEmail({
            to: beneficiary.email,
            subject: `Legacy Access Granted: ${user.name || user.email}'s memories are now available to you`,
            template: 'beneficiary-access-granted',
            variables: emailVars,
          });

          if (result.success) {
            // Update grant with email sent status
            await kv.set(grantKey, {
              ...(await kv.get(grantKey)),
              emailSent: true,
              emailSentAt: now.toISOString(),
            });
            accessGrantsIssued++;
            console.log(`✅ Legacy access granted to ${beneficiary.email}`);
          } else {
            // Queue for retry
            await queueEmail({
              type: 'beneficiary-access-granted',
              recipientEmail: beneficiary.email,
              subject: `Legacy Access Granted: ${user.name || user.email}'s memories are now available to you`,
              template: 'beneficiary-access-granted',
              variables: emailVars,
            }, kv);
          }

          // Rate limit: 100ms between sends
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Mark overall grant as processed
        await kv.set(accessGrantKey, {
          userId: user.id,
          processedAt: now.toISOString(),
          beneficiaryCount: beneficiariesData.length,
        });
      }
    }

    console.log(`✅ Inactive accounts check complete: ${accountsMarkedInactive} accounts marked inactive, ${accessGrantsIssued} access grants issued`);
    return { accountsMarkedInactive, accessGrantsIssued };
  } catch (error) {
    console.error('❌ Error checking inactive accounts:', error);
    throw error;
  }
}

// ✅ NEW: Check and send reminder emails to pending beneficiaries
// Called weekly by cron to remind beneficiaries who haven't verified after vault unlock
export async function checkBeneficiaryReminders() {
  console.log('📧 Checking for beneficiary reminders...');
  
  try {
    const result = await LegacyAccessService.checkBeneficiaryReminders();
    
    console.log(`✅ Beneficiary reminders check complete: ${result.remindersSent} reminders sent (${result.configsChecked} configs checked)`);
    return result;
  } catch (error) {
    console.error('❌ Error checking beneficiary reminders:', error);
    throw error;
  }
}

// Handle user login - reset inactivity timer
export async function handleUserLogin(userId: string) {
  try {
    const userKey = `user:${userId}`;
    const user = await kv.get(userKey);
    
    if (!user) return;

    const now = new Date();
    
    // Update last login time
    await kv.set(userKey, {
      ...user,
      lastLoginAt: now.toISOString(),
    });

    // If account was inactive, reactivate it
    if (user.accountStatus === 'inactive') {
      await kv.set(userKey, {
        ...user,
        accountStatus: 'active',
        lastLoginAt: now.toISOString(),
        reactivatedAt: now.toISOString(),
      });

      // Optionally revoke beneficiary access
      // (You may want to notify beneficiaries that access has been revoked)
      console.log(`🔄 Account reactivated: ${user.email}`);
    }

    console.log(`✅ Login recorded for user: ${user.email}`);
  } catch (error) {
    console.error('❌ Error handling user login:', error);
  }
}
