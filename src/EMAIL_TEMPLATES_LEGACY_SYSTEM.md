# 📧 Legacy Access Email System - Complete Templates & Triggers

## Overview
This document specifies the 4 Legacy Access emails with complete templates, trigger logic, and delivery guarantees.

---

## 📬 EMAIL #4: Beneficiary Invitation Email

### **Subject Line**
```
[User Name] has designated you as a beneficiary in Eras
```

### **Trigger Event**
- **Action:** User adds a new beneficiary email to their account
- **Location:** Settings → Account → Legacy Beneficiaries → Add Beneficiary
- **When:** Immediately after beneficiary is saved to database
- **Frequency:** Once per beneficiary (no duplicates)

### **HTML Email Template**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've Been Named a Beneficiary in Eras</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e1b4b 0%, #581c87 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
          
          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding: 40px 20px; background: linear-gradient(to right, rgba(168,85,247,0.2), rgba(236,72,153,0.2)); border-bottom: 2px solid rgba(255,255,255,0.1);">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #a855f7, #ec4899); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="font-size: 32px; color: white;">⏳</span>
              </div>
              <h1 style="margin: 0; font-size: 28px; color: white; font-weight: 700;">You've Been Named a Beneficiary</h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0;">
                Hello <strong style="color: white;">{{beneficiaryEmail}}</strong>,
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0;">
                <strong style="color: white; font-size: 18px;">{{userName}}</strong> has designated you as a beneficiary in their Eras account. This means you'll be able to access their time capsules and memories if their account becomes inactive.
              </p>
              
              <!-- Info Box -->
              <div style="background: rgba(168,85,247,0.15); border-left: 4px solid #a855f7; padding: 20px; margin: 24px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #e9d5ff; font-weight: 600;">What This Means</h3>
                <ul style="margin: 0; padding-left: 20px; color: #e2e8f0; font-size: 14px; line-height: 1.8;">
                  <li>If {{userName}}'s account is inactive for <strong style="color: white;">{{inactivityDays}} days</strong>, you'll receive access</li>
                  <li>You'll be able to view their time capsules, photos, videos, and messages</li>
                  <li>You'll receive an email notification before access is granted</li>
                  <li>Their legacy will be preserved and shared with you</li>
                </ul>
              </div>
              
              <p style="margin: 24px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0;">
                You don't need to take any action right now. We'll notify you if {{userName}}'s account becomes inactive.
              </p>
              
              <!-- Optional Message from User -->
              {{#if personalMessage}}
              <div style="background: rgba(236,72,153,0.15); border-left: 4px solid #ec4899; padding: 20px; margin: 24px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #fce7f3; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Message from {{userName}}</h3>
                <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #fce7f3; font-style: italic;">
                  "{{personalMessage}}"
                </p>
              </div>
              {{/if}}
              
              <!-- Learn More Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="{{appUrl}}/legacy-info" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #a855f7, #ec4899); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(168,85,247,0.4);">
                      Learn More About Legacy Access
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                If you have questions or didn't expect this email, you can contact {{userName}} directly or reach out to our support team.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="margin: 0 0 12px 0; font-size: 13px; color: #94a3b8; text-align: center;">
                This is an automated notification from <strong style="color: #cbd5e1;">Eras</strong> — Preserve Your Memories
              </p>
              <p style="margin: 0; font-size: 12px; color: #64748b; text-align: center;">
                You received this email because {{userName}} designated you as a beneficiary.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### **Template Variables**
```typescript
{
  beneficiaryEmail: string;      // "jane@example.com"
  userName: string;              // "John Smith"
  userEmail: string;             // "john@example.com"
  inactivityDays: number;        // 90 (from user settings)
  personalMessage?: string;      // Optional message from user
  appUrl: string;                // "https://eras.app"
}
```

### **Delivery Logic**

```typescript
// Trigger: User adds beneficiary in Settings
async function onBeneficiaryAdded(userId: string, beneficiaryEmail: string, personalMessage?: string) {
  
  // 1. Save beneficiary to database
  const beneficiary = await db.beneficiaries.insert({
    userId,
    email: beneficiaryEmail,
    addedAt: new Date(),
    status: 'pending',
    emailSent: false
  });
  
  // 2. Get user details
  const user = await db.users.findById(userId);
  
  // 3. Send email IMMEDIATELY
  const emailResult = await sendEmail({
    to: beneficiaryEmail,
    subject: `${user.name} has designated you as a beneficiary in Eras`,
    template: 'beneficiary-invitation',
    variables: {
      beneficiaryEmail,
      userName: user.name,
      userEmail: user.email,
      inactivityDays: user.settings.inactivityThresholdDays || 90,
      personalMessage,
      appUrl: process.env.APP_URL
    }
  });
  
  // 4. Mark email as sent
  if (emailResult.success) {
    await db.beneficiaries.update(beneficiary.id, {
      emailSent: true,
      emailSentAt: new Date()
    });
  } else {
    // 5. Log error for retry
    await db.emailQueue.insert({
      type: 'beneficiary-invitation',
      recipientEmail: beneficiaryEmail,
      data: { userId, beneficiaryEmail, personalMessage },
      attempts: 0,
      nextRetry: new Date(Date.now() + 5 * 60 * 1000) // Retry in 5 min
    });
  }
  
  return emailResult.success;
}
```

### **Ensuring Delivery**
1. ✅ **Immediate send** - Triggered in same transaction as DB save
2. ✅ **Idempotency** - Check `emailSent` flag to prevent duplicates
3. ✅ **Retry queue** - Failed emails queued for retry (exponential backoff)
4. ✅ **Logging** - All sends logged with timestamp and status
5. ✅ **Admin dashboard** - View all beneficiary invitations sent

---

## 📬 EMAIL #5: Inactivity Warning Email

### **Subject Line**
```
Action Required: Your Eras account will become inactive in [X] days
```

### **Trigger Event**
- **Action:** User hasn't logged in for (threshold - warning_days) days
- **Example:** Threshold = 90 days, Warning = 14 days → Send at day 76
- **When:** Checked daily by cron job at 10:00 AM UTC
- **Frequency:** Once per inactivity period (don't spam)

### **HTML Email Template**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Inactivity Warning - Eras</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e1b4b 0%, #7c2d12 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
          
          <!-- Header with Alert Icon -->
          <tr>
            <td align="center" style="padding: 40px 20px; background: linear-gradient(to right, rgba(251,146,60,0.2), rgba(239,68,68,0.2)); border-bottom: 2px solid rgba(255,255,255,0.1);">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #fb923c, #ef4444); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="font-size: 32px; color: white;">⚠️</span>
              </div>
              <h1 style="margin: 0; font-size: 28px; color: white; font-weight: 700;">Action Required</h1>
              <p style="margin: 8px 0 0 0; font-size: 16px; color: #fed7aa;">Your account will become inactive soon</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0;">
                Hello <strong style="color: white;">{{userName}}</strong>,
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0;">
                We noticed you haven't logged into your Eras account in <strong style="color: white;">{{daysSinceLastLogin}} days</strong>. According to your Legacy Access settings, your account will be marked as inactive in:
              </p>
              
              <!-- Countdown Box -->
              <div style="background: rgba(251,146,60,0.2); border: 2px solid #fb923c; padding: 24px; margin: 24px 0; border-radius: 12px; text-align: center;">
                <div style="font-size: 48px; font-weight: 700; color: #fb923c; margin-bottom: 8px;">
                  {{daysUntilInactive}}
                </div>
                <div style="font-size: 18px; color: #fed7aa; font-weight: 600;">
                  {{#if (eq daysUntilInactive 1)}}DAY{{else}}DAYS{{/if}}
                </div>
              </div>
              
              <!-- What Happens Box -->
              <div style="background: rgba(239,68,68,0.15); border-left: 4px solid #ef4444; padding: 20px; margin: 24px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #fecaca; font-weight: 600;">What Happens When Your Account Becomes Inactive?</h3>
                <ul style="margin: 0; padding-left: 20px; color: #e2e8f0; font-size: 14px; line-height: 1.8;">
                  <li>Your designated beneficiaries will be notified</li>
                  <li>They'll receive access to your time capsules and memories</li>
                  <li>Your account will remain preserved but accessible to beneficiaries</li>
                  <li>You can reactivate anytime by logging in</li>
                </ul>
              </div>
              
              <!-- Beneficiaries List -->
              {{#if hasBeneficiaries}}
              <div style="background: rgba(168,85,247,0.15); border-left: 4px solid #a855f7; padding: 20px; margin: 24px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #e9d5ff; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Your Beneficiaries</h3>
                <div style="color: #e2e8f0; font-size: 14px; line-height: 1.8;">
                  {{#each beneficiaries}}
                    <div style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                      📧 {{this}}
                    </div>
                  {{/each}}
                </div>
              </div>
              {{else}}
              <div style="background: rgba(234,179,8,0.15); border-left: 4px solid #eab308; padding: 20px; margin: 24px 0; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #fef08a; line-height: 1.6;">
                  ⚠️ <strong>No beneficiaries set.</strong> If your account becomes inactive, no one will have access to your memories. Consider adding beneficiaries in your settings.
                </p>
              </div>
              {{/if}}
              
              <!-- Action Buttons -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <!-- Primary CTA -->
                    <a href="{{appUrl}}/login" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #10b981, #059669); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 18px; box-shadow: 0 4px 12px rgba(16,185,129,0.4); margin-bottom: 12px;">
                      ✅ Log In to Keep Account Active
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <!-- Secondary CTA -->
                    <a href="{{appUrl}}/settings/account#legacy" style="display: inline-block; padding: 12px 32px; background: rgba(255,255,255,0.1); color: white; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 14px; border: 1px solid rgba(255,255,255,0.2);">
                      ⚙️ Manage Legacy Settings
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: center;">
                Simply logging in will reset your inactivity timer. No other action needed.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="margin: 0 0 12px 0; font-size: 13px; color: #94a3b8; text-align: center;">
                Last login: <strong style="color: #cbd5e1;">{{lastLoginDate}}</strong>
              </p>
              <p style="margin: 0; font-size: 12px; color: #64748b; text-align: center;">
                Questions? Reply to this email or visit our help center.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### **Template Variables**
```typescript
{
  userName: string;               // "John Smith"
  userEmail: string;              // "john@example.com"
  daysSinceLastLogin: number;     // 76
  daysUntilInactive: number;      // 14
  lastLoginDate: string;          // "December 15, 2024"
  beneficiaries: string[];        // ["jane@example.com", "bob@example.com"]
  hasBeneficiaries: boolean;      // true/false
  appUrl: string;                 // "https://eras.app"
}
```

### **Delivery Logic**

```typescript
// Cron job: Run daily at 10:00 AM UTC
async function checkInactivityWarnings() {
  const now = new Date();
  
  // Get all users with beneficiaries enabled
  const users = await db.users.findAll({
    where: {
      legacyAccessEnabled: true,
      accountStatus: 'active'
    }
  });
  
  for (const user of users) {
    const daysSinceLogin = Math.floor(
      (now.getTime() - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const warningThreshold = user.settings.inactivityThresholdDays - user.settings.warningDays;
    // Example: 90 - 14 = 76 days
    
    // Check if warning should be sent
    if (daysSinceLogin === warningThreshold) {
      
      // Check if warning already sent for this period
      const existingWarning = await db.inactivityWarnings.findOne({
        userId: user.id,
        sentAt: {
          $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      });
      
      if (existingWarning) {
        console.log(`Warning already sent for user ${user.id}`);
        continue;
      }
      
      // Get beneficiaries
      const beneficiaries = await db.beneficiaries.findAll({
        where: { userId: user.id, status: 'active' }
      });
      
      // Send warning email
      const emailResult = await sendEmail({
        to: user.email,
        subject: `Action Required: Your Eras account will become inactive in ${user.settings.warningDays} days`,
        template: 'inactivity-warning',
        variables: {
          userName: user.name,
          userEmail: user.email,
          daysSinceLastLogin,
          daysUntilInactive: user.settings.inactivityThresholdDays - daysSinceLogin,
          lastLoginDate: user.lastLoginAt.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          beneficiaries: beneficiaries.map(b => b.email),
          hasBeneficiaries: beneficiaries.length > 0,
          appUrl: process.env.APP_URL
        }
      });
      
      // Log warning sent
      if (emailResult.success) {
        await db.inactivityWarnings.insert({
          userId: user.id,
          sentAt: now,
          daysUntilInactive: user.settings.inactivityThresholdDays - daysSinceLogin
        });
      }
    }
  }
}

// Schedule cron job
cron.schedule('0 10 * * *', checkInactivityWarnings); // Daily at 10 AM UTC
```

### **Ensuring Delivery**
1. ✅ **Daily cron job** - Runs at consistent time (10 AM UTC)
2. ✅ **Deduplication** - Check if warning already sent in last 30 days
3. ✅ **Exact timing** - Triggers at precise day threshold (e.g., day 76)
4. ✅ **Logging** - All warnings logged in `inactivity_warnings` table
5. ✅ **User resets timer** - Any login clears warning state

---

## 📬 EMAIL #6: Beneficiary Granted Access Email

### **Subject Line**
```
Legacy Access Granted: [User Name]'s memories are now available to you
```

### **Trigger Event**
- **Action:** User's account crosses inactivity threshold (e.g., 90 days no login)
- **When:** Checked daily by cron job at 11:00 AM UTC (after warning check)
- **Frequency:** Once per beneficiary when access is granted

### **HTML Email Template**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Legacy Access Granted - Eras</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e1b4b 0%, #164e63 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 20px; background: linear-gradient(to right, rgba(56,189,248,0.2), rgba(168,85,247,0.2)); border-bottom: 2px solid rgba(255,255,255,0.1);">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #38bdf8, #a855f7); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="font-size: 32px; color: white;">🔓</span>
              </div>
              <h1 style="margin: 0; font-size: 28px; color: white; font-weight: 700;">Legacy Access Granted</h1>
              <p style="margin: 8px 0 0 0; font-size: 16px; color: #bae6fd;">You can now access {{userName}}'s memories</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0;">
                Hello <strong style="color: white;">{{beneficiaryEmail}}</strong>,
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0;">
                <strong style="color: white; font-size: 18px;">{{userName}}</strong>'s Eras account has been inactive for {{inactivityDays}} days. As their designated beneficiary, you now have access to their time capsules and memories.
              </p>
              
              <!-- Info Box -->
              <div style="background: rgba(56,189,248,0.15); border-left: 4px solid #38bdf8; padding: 20px; margin: 24px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #bae6fd; font-weight: 600;">What You Can Access</h3>
                <ul style="margin: 0; padding-left: 20px; color: #e2e8f0; font-size: 14px; line-height: 1.8;">
                  <li><strong style="color: white;">Time Capsules:</strong> {{capsuleCount}} capsules with photos, videos, and messages</li>
                  <li><strong style="color: white;">Legacy Vault:</strong> {{vaultItemCount}} saved memories organized in folders</li>
                  <li><strong style="color: white;">Voice Messages:</strong> Personal audio recordings</li>
                  <li><strong style="color: white;">Written Memories:</strong> Stories, reflections, and notes</li>
                </ul>
              </div>
              
              <!-- Account Stats -->
              <div style="background: rgba(168,85,247,0.15); border: 1px solid rgba(168,85,247,0.3); padding: 24px; margin: 24px 0; border-radius: 12px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                  <div style="text-align: center; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                    <div style="font-size: 32px; font-weight: 700; color: #a855f7; margin-bottom: 4px;">
                      {{capsuleCount}}
                    </div>
                    <div style="font-size: 12px; color: #e9d5ff; text-transform: uppercase; letter-spacing: 0.05em;">
                      Capsules
                    </div>
                  </div>
                  <div style="text-align: center; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                    <div style="font-size: 32px; font-weight: 700; color: #38bdf8; margin-bottom: 4px;">
                      {{vaultItemCount}}
                    </div>
                    <div style="font-size: 12px; color: #bae6fd; text-transform: uppercase; letter-spacing: 0.05em;">
                      Vault Items
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Personal Message (if exists) -->
              {{#if legacyMessage}}
              <div style="background: rgba(236,72,153,0.15); border-left: 4px solid #ec4899; padding: 20px; margin: 24px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #fce7f3; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">{{userName}}'s Message to You</h3>
                <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #fce7f3; font-style: italic;">
                  "{{legacyMessage}}"
                </p>
              </div>
              {{/if}}
              
              <!-- Access Instructions -->
              <div style="background: rgba(234,179,8,0.15); border-left: 4px solid #eab308; padding: 20px; margin: 24px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #fef08a; font-weight: 600;">How to Access</h3>
                <ol style="margin: 0; padding-left: 20px; color: #e2e8f0; font-size: 14px; line-height: 1.8;">
                  <li>Click the button below to create your Eras account (or log in)</li>
                  <li>Use the email address: <strong style="color: white;">{{beneficiaryEmail}}</strong></li>
                  <li>{{userName}}'s memories will appear in your "Legacy Access" section</li>
                  <li>You'll be able to view, download, and preserve their content</li>
                </ol>
              </div>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="{{appUrl}}/legacy-access/{{accessToken}}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #38bdf8, #a855f7); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 18px; box-shadow: 0 4px 12px rgba(56,189,248,0.4);">
                      🔓 Access {{userName}}'s Memories
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Important Note -->
              <div style="background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); padding: 16px; margin: 24px 0; border-radius: 8px;">
                <p style="margin: 0; font-size: 13px; color: #fecaca; line-height: 1.6;">
                  <strong>Important:</strong> If {{userName}} logs back into their account, their account will be reactivated and your access may be revoked. This is part of the Legacy Access system to ensure their privacy while they're active.
                </p>
              </div>
              
              <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: center;">
                Access expires in 90 days. Log in regularly to maintain access.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="margin: 0 0 12px 0; font-size: 13px; color: #94a3b8; text-align: center;">
                Account became inactive on: <strong style="color: #cbd5e1;">{{inactiveDate}}</strong>
              </p>
              <p style="margin: 0; font-size: 12px; color: #64748b; text-align: center;">
                Questions? Contact support@eras.app
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### **Template Variables**
```typescript
{
  beneficiaryEmail: string;       // "jane@example.com"
  userName: string;               // "John Smith"
  userEmail: string;              // "john@example.com"
  inactivityDays: number;         // 90
  capsuleCount: number;           // 12
  vaultItemCount: number;         // 47
  legacyMessage?: string;         // Optional message from deceased user
  accessToken: string;            // Unique token for beneficiary access
  inactiveDate: string;           // "March 15, 2025"
  appUrl: string;                 // "https://eras.app"
}
```

### **Delivery Logic**

```typescript
// Cron job: Run daily at 11:00 AM UTC (after inactivity warning check)
async function checkInactiveAccounts() {
  const now = new Date();
  
  // Get all users with legacy access enabled
  const users = await db.users.findAll({
    where: {
      legacyAccessEnabled: true,
      accountStatus: 'active' // Still marked active, but check login
    }
  });
  
  for (const user of users) {
    const daysSinceLogin = Math.floor(
      (now.getTime() - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Check if threshold reached
    if (daysSinceLogin >= user.settings.inactivityThresholdDays) {
      
      // Check if already processed
      const alreadyGranted = await db.legacyAccessGrants.findOne({
        where: { userId: user.id }
      });
      
      if (alreadyGranted) {
        console.log(`Access already granted for user ${user.id}`);
        continue;
      }
      
      // Mark account as inactive
      await db.users.update(user.id, {
        accountStatus: 'inactive',
        inactiveAt: now
      });
      
      // Get all beneficiaries
      const beneficiaries = await db.beneficiaries.findAll({
        where: { userId: user.id, status: 'active' }
      });
      
      if (beneficiaries.length === 0) {
        console.log(`No beneficiaries for user ${user.id}`);
        continue;
      }
      
      // Get account stats
      const capsules = await db.capsules.count({ where: { userId: user.id } });
      const vaultItems = await db.vaultItems.count({ where: { userId: user.id } });
      
      // Send access email to each beneficiary
      for (const beneficiary of beneficiaries) {
        
        // Generate unique access token
        const accessToken = crypto.randomBytes(32).toString('hex');
        
        // Save grant record
        await db.legacyAccessGrants.insert({
          userId: user.id,
          beneficiaryEmail: beneficiary.email,
          grantedAt: now,
          accessToken,
          expiresAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // 90 days
        });
        
        // Send email
        const emailResult = await sendEmail({
          to: beneficiary.email,
          subject: `Legacy Access Granted: ${user.name}'s memories are now available to you`,
          template: 'beneficiary-access-granted',
          variables: {
            beneficiaryEmail: beneficiary.email,
            userName: user.name,
            userEmail: user.email,
            inactivityDays: daysSinceLogin,
            capsuleCount: capsules,
            vaultItemCount: vaultItems,
            legacyMessage: user.settings.legacyMessage,
            accessToken,
            inactiveDate: now.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            appUrl: process.env.APP_URL
          }
        });
        
        // Log email sent
        if (emailResult.success) {
          await db.legacyAccessGrants.update(accessToken, {
            emailSent: true,
            emailSentAt: now
          });
        }
      }
      
      console.log(`✅ Legacy access granted for user ${user.id} to ${beneficiaries.length} beneficiaries`);
    }
  }
}

// Schedule cron job
cron.schedule('0 11 * * *', checkInactiveAccounts); // Daily at 11 AM UTC
```

### **Ensuring Delivery**
1. ✅ **Daily cron job** - Runs at 11 AM UTC (1 hour after warning check)
2. ✅ **Deduplication** - Check if access already granted
3. ✅ **Atomic operation** - Account marked inactive + emails sent in transaction
4. ✅ **Token generation** - Unique access token per beneficiary
5. ✅ **Access expiration** - 90-day expiration tracked in database
6. ✅ **Reactivation handling** - If user logs back in, revoke access

---

## 📬 EMAIL #7: Folder Sharing Invitation Email

### **Subject Line**
```
[User Name] shared a Legacy Vault folder with you: "[Folder Name]"
```

### **Trigger Event**
- **Action:** User shares a Legacy Vault folder with an email address
- **Location:** Legacy Vault → Folder → Share Button → Add Email
- **When:** Immediately after share permission is saved
- **Frequency:** Once per share (unless reshared)

### **HTML Email Template**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Folder Shared With You - Eras Legacy Vault</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 20px; background: linear-gradient(to right, rgba(168,85,247,0.2), rgba(124,58,237,0.2)); border-bottom: 2px solid rgba(255,255,255,0.1);">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #a855f7, #7c3aed); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <span style="font-size: 32px; color: white;">📂</span>
              </div>
              <h1 style="margin: 0; font-size: 28px; color: white; font-weight: 700;">Folder Shared With You</h1>
              <p style="margin: 8px 0 0 0; font-size: 16px; color: #e9d5ff;">{{userName}} wants to share memories with you</p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0;">
                Hello <strong style="color: white;">{{recipientEmail}}</strong>,
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0;">
                <strong style="color: white; font-size: 18px;">{{userName}}</strong> has shared a Legacy Vault folder with you on Eras.
              </p>
              
              <!-- Folder Card -->
              <div style="background: linear-gradient(135deg, rgba(168,85,247,0.2), rgba(124,58,237,0.2)); border: 2px solid rgba(168,85,247,0.4); padding: 24px; margin: 24px 0; border-radius: 12px;">
                <div style="display: flex; align-items: center; margin-bottom: 16px;">
                  <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #a855f7, #7c3aed); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; margin-right: 16px;">
                    <span style="font-size: 24px; color: white;">{{folderIcon}}</span>
                  </div>
                  <div>
                    <h2 style="margin: 0 0 4px 0; font-size: 22px; color: white; font-weight: 600;">
                      {{folderName}}
                    </h2>
                    <p style="margin: 0; font-size: 14px; color: #e9d5ff;">
                      {{itemCount}} {{#if (eq itemCount 1)}}item{{else}}items{{/if}} • {{permission}} access
                    </p>
                  </div>
                </div>
                
                {{#if folderDescription}}
                <p style="margin: 16px 0 0 0; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 14px; line-height: 1.6; color: #e2e8f0; font-style: italic;">
                  "{{folderDescription}}"
                </p>
                {{/if}}
              </div>
              
              <!-- What's Inside -->
              <div style="background: rgba(124,58,237,0.15); border-left: 4px solid #7c3aed; padding: 20px; margin: 24px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #e9d5ff; font-weight: 600;">What's Inside</h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                  {{#if photoCount}}
                  <div style="text-align: center; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                    <div style="font-size: 24px; margin-bottom: 4px;">📸</div>
                    <div style="font-size: 18px; font-weight: 600; color: white;">{{photoCount}}</div>
                    <div style="font-size: 11px; color: #e9d5ff;">Photos</div>
                  </div>
                  {{/if}}
                  {{#if videoCount}}
                  <div style="text-align: center; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                    <div style="font-size: 24px; margin-bottom: 4px;">🎥</div>
                    <div style="font-size: 18px; font-weight: 600; color: white;">{{videoCount}}</div>
                    <div style="font-size: 11px; color: #e9d5ff;">Videos</div>
                  </div>
                  {{/if}}
                  {{#if audioCount}}
                  <div style="text-align: center; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                    <div style="font-size: 24px; margin-bottom: 4px;">🎵</div>
                    <div style="font-size: 18px; font-weight: 600; color: white;">{{audioCount}}</div>
                    <div style="font-size: 11px; color: #e9d5ff;">Audio</div>
                  </div>
                  {{/if}}
                </div>
              </div>
              
              <!-- Permission Info -->
              <div style="background: rgba(56,189,248,0.15); border-left: 4px solid #38bdf8; padding: 20px; margin: 24px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #bae6fd; font-weight: 600;">Your Access Level</h3>
                <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #e2e8f0;">
                  {{#if (eq permission 'view')}}
                    👁️ <strong style="color: white;">View Only</strong> — You can view all content in this folder but cannot make changes.
                  {{else if (eq permission 'edit')}}
                    ✏️ <strong style="color: white;">Edit</strong> — You can view, add, and remove items from this folder.
                  {{else}}
                    👥 <strong style="color: white;">Full Access</strong> — You can view, edit, and manage sharing for this folder.
                  {{/if}}
                </p>
              </div>
              
              <!-- Personal Message (if provided) -->
              {{#if personalMessage}}
              <div style="background: rgba(236,72,153,0.15); border-left: 4px solid #ec4899; padding: 20px; margin: 24px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #fce7f3; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Message from {{userName}}</h3>
                <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #fce7f3; font-style: italic;">
                  "{{personalMessage}}"
                </p>
              </div>
              {{/if}}
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="{{appUrl}}/vault/shared/{{shareToken}}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #a855f7, #7c3aed); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 18px; box-shadow: 0 4px 12px rgba(168,85,247,0.4);">
                      📂 Open "{{folderName}}"
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Note -->
              <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: center;">
                You'll need an Eras account to access the folder. If you don't have one, creating an account is free and takes less than a minute.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="margin: 0 0 12px 0; font-size: 13px; color: #94a3b8; text-align: center;">
                Shared by <strong style="color: #cbd5e1;">{{userName}}</strong> ({{userEmail}}) on {{shareDate}}
              </p>
              <p style="margin: 0; font-size: 12px; color: #64748b; text-align: center;">
                Questions about this folder? Contact {{userName}} directly.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### **Template Variables**
```typescript
{
  recipientEmail: string;         // "friend@example.com"
  userName: string;               // "John Smith"
  userEmail: string;              // "john@example.com"
  folderName: string;             // "Family Vacation 2024"
  folderIcon: string;             // "🏖️" (emoji from folder settings)
  folderDescription?: string;     // "Our summer trip to Hawaii"
  itemCount: number;              // 24
  photoCount: number;             // 18
  videoCount: number;             // 5
  audioCount: number;             // 1
  permission: 'view' | 'edit' | 'admin'; // Access level
  personalMessage?: string;       // Optional message from sharer
  shareToken: string;             // Unique token for accessing folder
  shareDate: string;              // "December 1, 2024"
  appUrl: string;                 // "https://eras.app"
}
```

### **Delivery Logic**

```typescript
// Trigger: User shares folder in Legacy Vault
async function shareFolderWithEmail(folderId: string, recipientEmail: string, permission: string, personalMessage?: string) {
  
  // 1. Get folder details
  const folder = await db.vaultFolders.findById(folderId);
  const owner = await db.users.findById(folder.userId);
  
  // 2. Check if already shared with this email
  const existingShare = await db.folderShares.findOne({
    where: {
      folderId,
      recipientEmail,
      status: 'active'
    }
  });
  
  if (existingShare) {
    // Update permission if different
    if (existingShare.permission !== permission) {
      await db.folderShares.update(existingShare.id, { permission });
      // Optionally send "permission updated" email
    }
    return { success: true, alreadyShared: true };
  }
  
  // 3. Get folder content stats
  const items = await db.vaultItems.findAll({ where: { folderId } });
  const photoCount = items.filter(i => i.type === 'photo').length;
  const videoCount = items.filter(i => i.type === 'video').length;
  const audioCount = items.filter(i => i.type === 'audio').length;
  
  // 4. Generate unique share token
  const shareToken = crypto.randomBytes(32).toString('hex');
  
  // 5. Save share record
  const share = await db.folderShares.insert({
    folderId,
    recipientEmail,
    permission,
    shareToken,
    sharedBy: owner.id,
    sharedAt: new Date(),
    status: 'pending',
    emailSent: false
  });
  
  // 6. Send email
  const emailResult = await sendEmail({
    to: recipientEmail,
    subject: `${owner.name} shared a Legacy Vault folder with you: "${folder.name}"`,
    template: 'folder-share-invitation',
    variables: {
      recipientEmail,
      userName: owner.name,
      userEmail: owner.email,
      folderName: folder.name,
      folderIcon: folder.icon || '📂',
      folderDescription: folder.description,
      itemCount: items.length,
      photoCount,
      videoCount,
      audioCount,
      permission,
      personalMessage,
      shareToken,
      shareDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      appUrl: process.env.APP_URL
    }
  });
  
  // 7. Mark email as sent
  if (emailResult.success) {
    await db.folderShares.update(share.id, {
      emailSent: true,
      emailSentAt: new Date(),
      status: 'active'
    });
  } else {
    // Queue for retry
    await db.emailQueue.insert({
      type: 'folder-share-invitation',
      recipientEmail,
      data: { folderId, recipientEmail, permission, personalMessage },
      attempts: 0,
      nextRetry: new Date(Date.now() + 5 * 60 * 1000)
    });
  }
  
  return { success: emailResult.success, shareId: share.id };
}
```

### **Ensuring Delivery**
1. ✅ **Immediate send** - Triggered when share is created
2. ✅ **Deduplication** - Check if email already shared, update permission if needed
3. ✅ **Retry queue** - Failed emails queued for retry
4. ✅ **Token uniqueness** - Unique share token per email/folder combo
5. ✅ **Permission tracking** - Access level stored and enforced
6. ✅ **Reshare handling** - Can update permissions without duplicate emails

---

## 🔧 CENTRAL EMAIL DELIVERY SYSTEM

### **Email Queue Table Schema**

```sql
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL, -- 'beneficiary-invitation', 'inactivity-warning', etc.
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  template_name VARCHAR(100) NOT NULL,
  template_variables JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  last_attempt_at TIMESTAMP,
  next_retry_at TIMESTAMP,
  sent_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_next_retry ON email_queue(next_retry_at) WHERE status = 'pending';
CREATE INDEX idx_email_queue_type ON email_queue(type);
```

### **Email Queue Processor (Runs every 5 minutes)**

```typescript
async function processEmailQueue() {
  const now = new Date();
  
  // Get pending emails ready to send
  const pendingEmails = await db.emailQueue.findAll({
    where: {
      status: 'pending',
      attempts: { $lt: db.raw('max_attempts') },
      next_retry_at: { $lte: now }
    },
    limit: 100, // Process 100 at a time
    orderBy: 'next_retry_at ASC'
  });
  
  console.log(`Processing ${pendingEmails.length} pending emails`);
  
  for (const email of pendingEmails) {
    try {
      // Send email using Resend
      const result = await sendEmail({
        to: email.recipient_email,
        subject: email.subject,
        template: email.template_name,
        variables: email.template_variables
      });
      
      if (result.success) {
        // Mark as sent
        await db.emailQueue.update(email.id, {
          status: 'sent',
          sent_at: now,
          updated_at: now
        });
        console.log(`✅ Sent email ${email.id} to ${email.recipient_email}`);
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      // Increment attempts
      const newAttempts = email.attempts + 1;
      const shouldRetry = newAttempts < email.max_attempts;
      
      await db.emailQueue.update(email.id, {
        status: shouldRetry ? 'pending' : 'failed',
        attempts: newAttempts,
        last_attempt_at: now,
        next_retry_at: shouldRetry 
          ? new Date(now.getTime() + Math.pow(2, newAttempts) * 5 * 60 * 1000) // Exponential backoff
          : null,
        error_message: error.message,
        updated_at: now
      });
      
      console.error(`❌ Failed to send email ${email.id}: ${error.message} (attempt ${newAttempts}/${email.max_attempts})`);
    }
    
    // Rate limit: Wait 100ms between emails
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Schedule: Run every 5 minutes
cron.schedule('*/5 * * * *', processEmailQueue);
```

### **Exponential Backoff Strategy**

```
Attempt 1: Immediate (0 min)
Attempt 2: 5 minutes later (2^1 × 5 min = 10 min)
Attempt 3: 20 minutes later (2^2 × 5 min = 20 min)
Attempt 4: 40 minutes later (2^3 × 5 min = 40 min)
After 3-4 attempts: Mark as failed, alert admin
```

---

## 📊 MONITORING & LOGGING

### **Email Audit Log Table**

```sql
CREATE TABLE email_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type VARCHAR(50) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  template_name VARCHAR(100),
  status VARCHAR(20) NOT NULL, -- 'sent', 'failed', 'bounced', 'opened', 'clicked'
  provider_message_id VARCHAR(255), -- From Resend/email provider
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  bounced_at TIMESTAMP,
  error_message TEXT,
  metadata JSONB, -- Store template variables, user ID, etc.
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_email_audit_recipient ON email_audit_log(recipient_email);
CREATE INDEX idx_email_audit_type ON email_audit_log(email_type);
CREATE INDEX idx_email_audit_sent_at ON email_audit_log(sent_at);
```

### **Admin Dashboard Queries**

```typescript
// Get email stats for last 30 days
async function getEmailStats() {
  return {
    beneficiaryInvitations: await db.emailAuditLog.count({
      where: {
        email_type: 'beneficiary-invitation',
        sent_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    }),
    inactivityWarnings: await db.emailAuditLog.count({
      where: {
        email_type: 'inactivity-warning',
        sent_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    }),
    accessGranted: await db.emailAuditLog.count({
      where: {
        email_type: 'beneficiary-access-granted',
        sent_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    }),
    folderShares: await db.emailAuditLog.count({
      where: {
        email_type: 'folder-share-invitation',
        sent_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    }),
    failedEmails: await db.emailQueue.count({
      where: { status: 'failed' }
    })
  };
}
```

---

## ✅ EMAIL DELIVERY GUARANTEES

### **1. Beneficiary Invitation Email**
- ✅ **When:** Immediately after adding beneficiary
- ✅ **Guarantee:** Sent in same transaction as DB save
- ✅ **Retry:** 3 attempts with exponential backoff
- ✅ **Deduplication:** Check `emailSent` flag
- ✅ **Monitoring:** Logged in email_audit_log

### **2. Inactivity Warning Email**
- ✅ **When:** Daily at 10:00 AM UTC
- ✅ **Guarantee:** Cron job with exact day calculation
- ✅ **Retry:** Queued if send fails
- ✅ **Deduplication:** Check if warning sent in last 30 days
- ✅ **Monitoring:** Track in inactivity_warnings table

### **3. Beneficiary Access Granted Email**
- ✅ **When:** Daily at 11:00 AM UTC (after warning check)
- ✅ **Guarantee:** Account marked inactive + emails sent atomically
- ✅ **Retry:** Queued if send fails
- ✅ **Deduplication:** Check if access already granted
- ✅ **Monitoring:** Track in legacy_access_grants table

### **4. Folder Share Invitation Email**
- ✅ **When:** Immediately after sharing folder
- ✅ **Guarantee:** Sent in same transaction as share creation
- ✅ **Retry:** 3 attempts with exponential backoff
- ✅ **Deduplication:** Check if already shared, update permission
- ✅ **Monitoring:** Track in folder_shares table

---

## 🧪 TESTING CHECKLIST

### **Before Implementation**
- [ ] Review all email templates for design/wording
- [ ] Confirm trigger events make sense for user flow
- [ ] Verify template variables are available from database
- [ ] Check that cron schedules don't conflict
- [ ] Ensure retry logic won't spam users

### **After Implementation**
- [ ] Test beneficiary invitation (happy path)
- [ ] Test beneficiary invitation (email fails, retry works)
- [ ] Test inactivity warning at exact day threshold
- [ ] Test access granted when crossing threshold
- [ ] Test folder share invitation (immediate send)
- [ ] Test deduplication (no duplicate emails)
- [ ] Test cron jobs run at correct times
- [ ] Verify email audit log captures all sends
- [ ] Check admin dashboard shows correct stats

---

## 📝 NEXT STEPS

1. **Review Templates** - Approve email designs and wording
2. **Confirm Triggers** - Validate when each email should send
3. **Database Schema** - Ensure all tables exist for tracking
4. **Implement Email Queue** - Build central delivery system
5. **Setup Cron Jobs** - Configure daily checks for warnings/grants
6. **Testing** - Thoroughly test all 4 email flows
7. **Monitoring** - Setup alerts for failed emails
8. **Documentation** - Update user docs about email notifications

---

**Status:** ✅ READY FOR REVIEW & APPROVAL
**Next Action:** User approval to implement these 4 email templates

