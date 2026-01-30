# 📧 Priority 1 Email Examples & Triggering Mechanisms

## Table of Contents
1. [Email #4: Beneficiary Invitation Email](#email-4-beneficiary-invitation)
2. [Email #5: Inactivity Warning Email](#email-5-inactivity-warning)
3. [Email #6: Beneficiary Access Granted](#email-6-beneficiary-access-granted)
4. [Email #7: Folder Sharing Invitation](#email-7-folder-sharing-invitation)

---

## Email #4: Beneficiary Invitation Email

### 📋 **EMAIL PREVIEW**

**Subject:** `"You've Been Named as a Legacy Beneficiary by [User Name]"`

**Visual Design:** Same Eclipse-branded template as capsule delivery email

**Email Content:**

```
Hi [Beneficiary Name],

[User Name] has named you as a trusted beneficiary for their ERAS Digital Time Capsule account.

This means that in the event they become inactive for an extended period, you'll be able to access their time capsules, memories, and important digital legacy they've preserved.

[User Name] wrote a personal message for you:

┌─────────────────────────────────────┐
│ "[Personal message from user, or    │
│  default: 'I trust you to preserve  │
│  these memories and share them with │
│  those who matter.']"                │
└─────────────────────────────────────┘

To accept this responsibility and verify your email address, please click below:

[Accept & Verify] (gradient button)

This verification link will expire in 14 days. If you don't wish to be a beneficiary, you can decline by clicking here.

---
What does this mean?
• You won't have access to their account unless specific conditions are met
• If [User Name] becomes inactive for [X] months, a 30-day grace period begins
• Only after the grace period can you access their digital legacy
• All access is logged for security and transparency

---
Need help? Contact us at support@erastimecapsule.com
```

### 🎯 **TRIGGERING MECHANISM**

**When:** Immediately when user adds a beneficiary

**Where to trigger:**
- `/supabase/functions/server/legacy-access-service.tsx` → `addBeneficiary()` function
- **Line 127-128** (currently has TODO comment)

**Exact Implementation:**

```typescript
// CURRENT CODE (Line 127-128):
// TODO: Send verification email via email-service
// await sendBeneficiaryVerificationEmail(newBeneficiary, verificationToken);

// NEW CODE:
await EmailService.sendBeneficiaryInvitationEmail(
  newBeneficiary.email,
  {
    beneficiaryName: newBeneficiary.name,
    userName: userProfile.first_name + ' ' + userProfile.last_name, // Need to fetch this
    personalMessage: newBeneficiary.personalMessage,
    verificationUrl: `${FRONTEND_URL}/verify-beneficiary?token=${verificationToken}`,
    inactivityThreshold: config.trigger.inactivityMonths || 3,
    expiresInDays: 14
  }
);
```

**Required Changes:**
1. Add `sendBeneficiaryInvitationEmail()` method to `EmailService` class
2. Fetch user profile in `addBeneficiary()` to get user's name
3. Create frontend route `/verify-beneficiary` to handle verification link clicks
4. Backend endpoint to process verification token

**Deduplication Strategy:**
- Track via KV: `email_sent:beneficiary_invite:${beneficiaryId}`
- Prevent duplicate invites for same beneficiary within 24 hours
- Allow resend after 24 hours if still pending

---

## Email #5: Inactivity Warning Email (30-Day Grace Period)

### 📋 **EMAIL PREVIEW**

**Subject:** `"⏰ Important: Your ERAS Account Shows Inactivity - Action Required"`

**Visual Design:** Same Eclipse template but with **AMBER/WARNING accent colors** instead of purple/pink gradient

**Email Content:**

```
Hi [User Name],

We noticed you haven't logged into your ERAS account in [X] months.

To protect your digital legacy, we're starting a 30-day grace period before granting access to your designated beneficiaries.

⏱️ Grace Period Ends: [DATE] at [TIME]

What happens next?
• You have 30 days to log in and cancel this unlock
• If you don't take action, your beneficiaries will be granted access on [DATE]
• Your beneficiaries: [Name 1], [Name 2], [Name 3]

This is NOT a security breach — it's the Legacy Access feature you configured.

[Cancel Unlock - Keep Account Locked] (BIG gradient button)

Or simply log in to your account:
[Log In to ERAS] (secondary button)

---
Why am I receiving this?
You configured Legacy Access with a [X]-month inactivity trigger. This ensures your digital memories are preserved and accessible to people you trust if something happens.

Cancel this unlock: [One-click cancel link with token]

If you didn't set this up or have security concerns, contact us immediately at support@erastimecapsule.com
```

**Visual Treatment:**
- **Warning badge** at top: "⚠️ Grace Period Active"
- **Countdown timer visualization** (static, not dynamic)
- **Amber/orange gradient** for CTA buttons instead of purple/pink
- **Bold date/time display** for when unlock happens

### 🎯 **TRIGGERING MECHANISM**

**When:** Exactly when inactivity threshold is reached (e.g., 3, 6, or 12 months)

**How:** Cron job (same architecture as capsule delivery system)

**Implementation Plan:**

#### 1. **Create New Cron Job Function** (runs every 6 hours)
Location: `/supabase/functions/server/index.tsx` (add new route)

```typescript
// New route in index.tsx:
app.get('/make-server-f9be53a7/cron/check-legacy-inactivity', async (c) => {
  console.log('⏰ [CRON] Legacy inactivity check started');
  
  const result = await LegacyAccessService.checkAndTriggerInactivityWarnings();
  
  return c.json({
    success: true,
    warnings_sent: result.warningsSent,
    unlocks_triggered: result.unlocksTriggered,
    checked_at: new Date().toISOString()
  });
});
```

#### 2. **New Method in Legacy Access Service**
Location: `/supabase/functions/server/legacy-access-service.tsx`

```typescript
export async function checkAndTriggerInactivityWarnings(): Promise<{
  warningsSent: number;
  unlocksTriggered: number;
}> {
  console.log('🔍 Checking all users for inactivity triggers...');
  
  let warningsSent = 0;
  let unlocksTriggered = 0;
  
  // Get all legacy access configs
  const allConfigs = await kv.getByPrefix<LegacyAccessConfig>('legacy_access_');
  
  for (const config of allConfigs) {
    if (config.trigger.type !== 'inactivity') continue;
    
    const monthsInactive = Math.floor(
      (Date.now() - config.trigger.lastActivityAt) / (30 * 24 * 60 * 60 * 1000)
    );
    
    const thresholdMonths = config.trigger.inactivityMonths || 3;
    
    // SCENARIO 1: Just reached inactivity threshold → SEND WARNING EMAIL
    if (monthsInactive >= thresholdMonths && !config.trigger.warningEmailSentAt) {
      console.log(`⚠️ User ${config.userId} reached ${monthsInactive} months inactivity → Sending warning email`);
      
      // Schedule unlock for 30 days from now
      config.trigger.unlockScheduledAt = Date.now() + (30 * 24 * 60 * 60 * 1000);
      config.trigger.warningEmailSentAt = Date.now();
      
      await kv.set(getLegacyAccessKey(config.userId), config);
      
      // Send warning email
      const cancelToken = generateCancelToken(config.userId);
      await EmailService.sendInactivityWarningEmail(
        userEmail, // Need to fetch from Supabase auth
        {
          userName: userProfile.first_name,
          monthsInactive: monthsInactive,
          gracePeriodEndsAt: config.trigger.unlockScheduledAt,
          beneficiaryNames: config.beneficiaries
            .filter(b => b.status === 'verified')
            .map(b => b.name),
          cancelUrl: `${FRONTEND_URL}/cancel-unlock?token=${cancelToken}`,
          loginUrl: `${FRONTEND_URL}/signin`
        }
      );
      
      warningsSent++;
    }
    
    // SCENARIO 2: Grace period expired → TRIGGER UNLOCK
    else if (
      config.trigger.unlockScheduledAt && 
      Date.now() >= config.trigger.unlockScheduledAt &&
      !config.trigger.unlockTriggeredAt &&
      !config.trigger.unlockCanceledAt
    ) {
      console.log(`🔓 User ${config.userId} grace period expired → Triggering legacy unlock`);
      
      config.trigger.unlockTriggeredAt = Date.now();
      await kv.set(getLegacyAccessKey(config.userId), config);
      
      // Generate unlock tokens for all verified beneficiaries
      for (const beneficiary of config.beneficiaries) {
        if (beneficiary.status === 'verified') {
          const unlockToken = await generateUnlockToken(config.userId, beneficiary.id);
          
          // Send access granted email
          await EmailService.sendBeneficiaryAccessGrantedEmail(
            beneficiary.email,
            {
              beneficiaryName: beneficiary.name,
              userName: userProfile.first_name + ' ' + userProfile.last_name,
              personalMessage: beneficiary.personalMessage,
              accessUrl: `${FRONTEND_URL}/legacy-access?token=${unlockToken}`,
              unlockReason: 'inactivity',
              gracePeriodDays: 30
            }
          );
        }
      }
      
      unlocksTriggered++;
    }
  }
  
  return { warningsSent, unlocksTriggered };
}
```

#### 3. **Activity Tracking** (Update lastActivityAt)
Update `lastActivityAt` whenever user:
- Signs in
- Creates/edits capsule
- Views capsule
- Makes any action in the app

Add to existing endpoints:
```typescript
// In index.tsx, add middleware or update in each protected endpoint:
async function updateUserActivity(userId: string) {
  const config = await getLegacyAccessConfig(userId);
  config.trigger.lastActivityAt = Date.now();
  
  // If they were in grace period, cancel it
  if (config.trigger.unlockScheduledAt && !config.trigger.unlockTriggeredAt) {
    console.log(`✅ User ${userId} logged in during grace period → Canceling unlock`);
    config.trigger.unlockCanceledAt = Date.now();
    delete config.trigger.unlockScheduledAt;
    delete config.trigger.warningEmailSentAt;
  }
  
  await kv.set(getLegacyAccessKey(userId), config);
}
```

#### 4. **Supabase Cron Setup**
Use Supabase Edge Function Cron (pg_cron):
```sql
-- Run every 6 hours
SELECT cron.schedule(
  'legacy-inactivity-check',
  '0 */6 * * *',
  $$
  SELECT net.http_get(
    url := 'https://[PROJECT_ID].supabase.co/functions/v1/make-server-f9be53a7/cron/check-legacy-inactivity',
    headers := '{"Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb
  ) AS request_id;
  $$
);
```

**Deduplication Strategy:**
- Only send warning email once per inactivity cycle (tracked via `warningEmailSentAt`)
- If user logs in, reset flags and allow new cycle
- Grace period cancellation clears all flags

---

## Email #6: Beneficiary Access Granted

### 📋 **EMAIL PREVIEW**

**Subject:** `"Legacy Access Granted: [User Name]'s ERAS Time Capsules Are Now Available"`

**Visual Design:** Same Eclipse template with **GREEN/SUCCESS accent colors**

**Email Content:**

```
Hi [Beneficiary Name],

This is a significant moment. [User Name]'s digital legacy is now available to you.

After a 30-day grace period with no account activity, you've been granted access to their ERAS time capsules and memories as their designated beneficiary.

[User Name]'s message to you:

┌─────────────────────────────────────┐
│ "[Personal message from user]"      │
└─────────────────────────────────────┐

What you can access:
• All time capsules they created
• Media files and photos
• Text messages and memories
• Shared folders and collections

[Access Legacy Account] (BIG gradient button)

---
Important Information:

✅ All access is logged for security
✅ This access was granted automatically after [X] months of inactivity
✅ [User Name] was notified 30 days ago and did not cancel
✅ You're viewing this as a beneficiary, not taking ownership

Please handle these memories with care and respect [User Name]'s wishes.

---
Questions? Contact us at support@erastimecapsule.com
```

**Visual Treatment:**
- **Success badge** at top: "✅ Access Granted"
- **Green gradient** for CTA button
- **Respectful, solemn tone** (this is a significant moment)
- **Security note** about access logging

### 🎯 **TRIGGERING MECHANISM**

**When:** Exactly 30 days after warning email is sent (grace period expires)

**Where:** Same cron job as Email #5 (scenario 2 in the code above)

**Exact Flow:**

1. **Warning Email Sent** → Set `warningEmailSentAt` and `unlockScheduledAt` (now + 30 days)
2. **Cron Checks Every 6 Hours** → Looks for `unlockScheduledAt` timestamps that have passed
3. **Grace Period Expired** → If `unlockScheduledAt <= now` AND user didn't cancel:
   - Set `unlockTriggeredAt`
   - Generate unlock tokens for each verified beneficiary
   - Send Email #6 to all verified beneficiaries
4. **User Logs In During Grace Period** → Automatically cancel unlock, clear flags

**Implementation:** Already included in the `checkAndTriggerInactivityWarnings()` function above (Scenario 2)

**Deduplication Strategy:**
- Only send once per unlock cycle (tracked via `unlockTriggeredAt`)
- Each beneficiary gets unique unlock token (one-time use)
- Track via KV: `email_sent:beneficiary_access:${beneficiaryId}:${unlockTimestamp}`

---

## Email #7: Folder Sharing Invitation

### 📋 **EMAIL PREVIEW**

**Subject:** `"[User Name] Shared a Legacy Vault Folder with You"`

**Visual Design:** Same Eclipse template

**Email Content:**

```
Hi there,

[User Name] has shared a special collection of memories with you from their ERAS Legacy Vault.

Folder: "[Folder Name]"
Contains: [X] time capsules, [Y] photos, [Z] videos

[User Name]'s note:
┌─────────────────────────────────────┐
│ "[Optional message from user, or    │
│  default: 'I wanted to share these  │
│  memories with you.']"               │
└─────────────────────────────────────┘

[View Shared Folder] (gradient button)

---
What is ERAS Legacy Vault?
ERAS is a digital time capsule platform that lets people preserve and share their most important memories. [User Name] has chosen to share this folder with you.

Don't have an ERAS account? You can still view the folder using the link above.

---
Need help? Contact us at support@erastimecapsule.com
```

### 🎯 **TRIGGERING MECHANISM**

**When:** Immediately when user shares a folder and clicks "Send Email Invitation"

**Where to trigger:**
Currently, I need to check if folder sharing exists in your codebase. Let me search:

**Likely Implementation Location:**
- Frontend: Folder sharing modal/component
- Backend: `/supabase/functions/server/index.tsx` → New route `/api/folders/share`

**Exact Implementation:**

#### 1. **Frontend Change** (Share Folder Modal)
When user enters email addresses and clicks "Share":
```typescript
// In LegacyVaultFolders component or similar
async function handleShareFolder(folderId: string, emails: string[], message?: string) {
  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/folders/share`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        folder_id: folderId,
        emails: emails,
        message: message
      })
    }
  );
  
  if (response.ok) {
    toast.success(`Folder shared with ${emails.length} recipient(s)`);
  }
}
```

#### 2. **Backend Route** (New endpoint)
Location: `/supabase/functions/server/index.tsx`

```typescript
app.post('/make-server-f9be53a7/api/folders/share', async (c) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return c.json({ error: 'Unauthorized' }, 401);
  
  const { folder_id, emails, message } = await c.req.json();
  
  // Validate folder ownership
  const folder = await kv.get(`legacy_folder:${user.id}:${folder_id}`);
  if (!folder) return c.json({ error: 'Folder not found' }, 404);
  
  // Get user profile for sender name
  const userProfile = await DatabaseService.getUserProfile(user.id);
  const senderName = `${userProfile.first_name} ${userProfile.last_name}`;
  
  // Get folder contents count
  const capsules = await kv.get(`folder_capsules:${folder_id}`) || [];
  const mediaCount = capsules.reduce((sum, c) => sum + (c.media_urls?.length || 0), 0);
  
  // Generate sharing token
  const shareToken = generateSecureToken();
  await kv.set(`folder_share:${shareToken}`, {
    folder_id,
    user_id: user.id,
    shared_at: Date.now(),
    expires_at: Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 year
  });
  
  // Send email to each recipient
  let successCount = 0;
  for (const email of emails) {
    const shareUrl = `${FRONTEND_URL}/shared-folder/${shareToken}`;
    
    const emailSent = await EmailService.sendFolderSharingInvitation(
      email,
      {
        senderName,
        folderName: folder.name,
        capsuleCount: capsules.length,
        mediaCount,
        personalMessage: message,
        shareUrl
      }
    );
    
    if (emailSent) successCount++;
  }
  
  return c.json({
    success: true,
    emails_sent: successCount,
    total_recipients: emails.length
  });
});
```

**Deduplication Strategy:**
- Track via KV: `email_sent:folder_share:${shareToken}:${recipientEmail}`
- Prevent duplicate emails for same share link + recipient within 24 hours
- Allow resend if user explicitly clicks "Resend Invitation"

---

## 🔧 **UNIFIED TRIGGERING SUMMARY**

| Email | Trigger Type | Trigger Location | Frequency | Deduplication |
|-------|--------------|------------------|-----------|---------------|
| **#4 Beneficiary Invite** | Immediate | `legacy-access-service.tsx` → `addBeneficiary()` | On demand | 24h cooldown per beneficiary |
| **#5 Inactivity Warning** | Cron Job | New cron endpoint (every 6h) | Automatic | Once per inactivity cycle |
| **#6 Access Granted** | Cron Job | Same as #5 (scenario 2) | Automatic | Once per unlock event |
| **#7 Folder Sharing** | Immediate | New `/api/folders/share` endpoint | On demand | 24h per share link + recipient |

---

## 🚀 **IMPLEMENTATION CHECKLIST**

### Phase 1: Email Service Methods
- [ ] Add `sendBeneficiaryInvitationEmail()` to EmailService
- [ ] Add `sendInactivityWarningEmail()` to EmailService
- [ ] Add `sendBeneficiaryAccessGrantedEmail()` to EmailService
- [ ] Add `sendFolderSharingInvitation()` to EmailService

### Phase 2: Backend Integration
- [ ] Update `addBeneficiary()` to call Email #4
- [ ] Create `checkAndTriggerInactivityWarnings()` function
- [ ] Add activity tracking middleware
- [ ] Create `/cron/check-legacy-inactivity` endpoint
- [ ] Create `/api/folders/share` endpoint

### Phase 3: Frontend Routes
- [ ] Create `/verify-beneficiary` page
- [ ] Create `/cancel-unlock` page (one-click cancel)
- [ ] Create `/legacy-access` page (beneficiary view)
- [ ] Create `/shared-folder/:token` page
- [ ] Add email sharing UI to folder modal

### Phase 4: Cron Setup
- [ ] Configure Supabase pg_cron for legacy inactivity checks
- [ ] Test cron job execution
- [ ] Monitor cron logs

### Phase 5: Testing
- [ ] Test beneficiary invite flow end-to-end
- [ ] Test inactivity warning with short threshold (1 day for testing)
- [ ] Test grace period cancellation
- [ ] Test access granted flow
- [ ] Test folder sharing
- [ ] Verify email deduplication works
- [ ] Load test email rate limiting

---

## ⚡ **CRITICAL IMPLEMENTATION NOTES**

1. **Activity Tracking is ESSENTIAL**
   - Must update `lastActivityAt` on EVERY user action
   - Login, capsule create/edit/view, folder actions, settings changes
   - Consider adding middleware to all protected routes

2. **Grace Period Cancellation**
   - User login during grace period should auto-cancel unlock
   - One-click cancel link in email should work without login
   - Frontend should show grace period status if active

3. **Email Rate Limiting**
   - Current system handles 600ms between emails (1.67/sec)
   - With multiple beneficiaries, expect delays
   - Example: 10 beneficiaries = ~6 seconds to send all emails

4. **Timezone Handling**
   - Warning emails should show grace period end time in USER'S timezone
   - Store timezone in legacy access config
   - Use same timezone logic as capsule delivery

5. **Security**
   - All unlock tokens should be one-time use
   - Verification tokens expire after 14 days
   - Share tokens expire after 1 year (configurable)
   - All access must be logged (already in your security config)

6. **Beneficiary UX**
   - They may not have ERAS accounts → emails must work without login
   - Provide option to create account during beneficiary verification
   - Legacy access view should be read-only for beneficiaries

---

## 📊 **MONITORING & ANALYTICS**

Track these metrics:
- Beneficiary invite acceptance rate
- Grace period cancellation rate (how many users log in after warning)
- Email delivery success rate per type
- Average time from warning to unlock
- Folder sharing engagement rate

---

**Ready to implement?** Let me know and I'll start building these email templates and triggering mechanisms! 🚀
