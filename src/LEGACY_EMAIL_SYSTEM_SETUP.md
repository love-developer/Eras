# 📧 Legacy Email System - Setup & Configuration

## ✅ Implementation Complete

All 3 email templates have been implemented:

1. **Email #5** - Inactivity Warning
2. **Email #6** - Beneficiary Access Granted  
3. **Email #7** - Folder Sharing Invitation

---

## 📁 Files Created

### Email Templates
- `/email-templates/inactivity-warning.html`
- `/email-templates/beneficiary-access-granted.html`
- `/email-templates/folder-share-invitation.html`

### Server-Side Services
- `/supabase/functions/server/email-service.tsx` - Email sending & queue processing
- `/supabase/functions/server/legacy-cron.tsx` - Inactivity checks & access granting
- `/supabase/functions/server/folder-sharing.tsx` - Folder share email logic

### Server Routes Added
- Updated `/supabase/functions/server/index.tsx` with new endpoints

---

## 🔧 Setup Instructions

### 1. Resend API Key (Already Configured)
Your Resend API key is already configured as `RESEND_API_KEY`. No action needed.

### 2. Set Up Cron Jobs

You need to configure **3 cron jobs** to trigger the email system:

#### Cron Job #1: Inactivity Warnings (Daily at 10 AM UTC)
```bash
curl -X POST https://your-project-id.supabase.co/functions/v1/make-server-f9be53a7/cron/check-inactivity-warnings \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Cron Schedule:** `0 10 * * *` (Every day at 10:00 AM UTC)

#### Cron Job #2: Inactive Accounts Check (Daily at 11 AM UTC)
```bash
curl -X POST https://your-project-id.supabase.co/functions/v1/make-server-f9be53a7/cron/check-inactive-accounts \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Cron Schedule:** `0 11 * * *` (Every day at 11:00 AM UTC)

#### Cron Job #3: Email Queue Processor (Every 5 Minutes)
```bash
curl -X POST https://your-project-id.supabase.co/functions/v1/make-server-f9be53a7/cron/process-email-queue \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Cron Schedule:** `*/5 * * * *` (Every 5 minutes)

---

## ⚙️ Cron Job Setup Options

### Option 1: GitHub Actions (Recommended)

Create `.github/workflows/email-cron.yml`:

```yaml
name: Email System Cron Jobs

on:
  schedule:
    # Inactivity warnings - Daily at 10 AM UTC
    - cron: '0 10 * * *'
    # Inactive accounts - Daily at 11 AM UTC
    - cron: '0 11 * * *'
    # Email queue - Every 5 minutes
    - cron: '*/5 * * * *'

jobs:
  inactivity-warnings:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 10 * * *'
    steps:
      - name: Check Inactivity Warnings
        run: |
          curl -X POST ${{ secrets.SUPABASE_URL }}/functions/v1/make-server-f9be53a7/cron/check-inactivity-warnings \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"

  inactive-accounts:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 11 * * *'
    steps:
      - name: Check Inactive Accounts
        run: |
          curl -X POST ${{ secrets.SUPABASE_URL }}/functions/v1/make-server-f9be53a7/cron/check-inactive-accounts \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"

  email-queue:
    runs-on: ubuntu-latest
    if: github.event.schedule == '*/5 * * * *'
    steps:
      - name: Process Email Queue
        run: |
          curl -X POST ${{ secrets.SUPABASE_URL }}/functions/v1/make-server-f9be53a7/cron/process-email-queue \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

**GitHub Secrets to Add:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon key

### Option 2: Supabase Cron Extension

If using Supabase pg_cron extension:

```sql
-- Inactivity warnings (10 AM UTC daily)
SELECT cron.schedule(
  'check-inactivity-warnings',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project-id.supabase.co/functions/v1/make-server-f9be53a7/cron/check-inactivity-warnings',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);

-- Inactive accounts (11 AM UTC daily)
SELECT cron.schedule(
  'check-inactive-accounts',
  '0 11 * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project-id.supabase.co/functions/v1/make-server-f9be53a7/cron/check-inactive-accounts',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);

-- Email queue (every 5 minutes)
SELECT cron.schedule(
  'process-email-queue',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project-id.supabase.co/functions/v1/make-server-f9be53a7/cron/process-email-queue',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

### Option 3: External Cron Service (cron-job.org, EasyCron, etc.)

Set up 3 jobs with the curl commands above.

---

## 🎯 API Endpoints

### Folder Sharing Email
```typescript
POST /api/folder/share
{
  "folderId": "folder-uuid",
  "userId": "user-uuid",
  "recipientEmail": "friend@example.com",
  "permission": "View" | "Edit" | "Full Access",
  "personalMessage": "Check out these vacation photos!" // Optional
}
```

### Get Shared Folder
```typescript
GET /api/folder/shared/:shareToken
```

### Remove Folder Share
```typescript
DELETE /api/folder/share
{
  "folderId": "folder-uuid",
  "recipientEmail": "friend@example.com"
}
```

### List Folder Shares
```typescript
GET /api/folder/:folderId/shares
```

### User Login Hook (Call on every login)
```typescript
POST /api/user/login-hook
{
  "userId": "user-uuid"
}
```

---

## 📊 How It Works

### Inactivity Warning Flow

1. **Daily Cron (10 AM UTC)** triggers `/cron/check-inactivity-warnings`
2. System checks all users with `legacyAccessEnabled: true`
3. Calculates days since last login
4. If `daysSinceLogin === (threshold - warningDays)` (e.g., day 76 if 90-day threshold with 14-day warning):
   - Sends inactivity warning email
   - Stores warning record to prevent duplicates
5. Email includes:
   - Countdown to inactivity
   - List of beneficiaries (or warning if none)
   - Login button to reset timer

### Beneficiary Access Grant Flow

1. **Daily Cron (11 AM UTC)** triggers `/cron/check-inactive-accounts`
2. System checks all users with `legacyAccessEnabled: true`
3. If `daysSinceLogin >= threshold` (e.g., 90 days):
   - Marks account as `inactive`
   - Gets all beneficiaries
   - Generates unique access token for each
   - Sends access granted email to each beneficiary
   - Stores access grant records
4. Email includes:
   - Account stats (capsule count, vault items)
   - Personal legacy message (if set)
   - Access link with token

### Folder Sharing Flow

1. User clicks "Share Folder" and enters email
2. Frontend calls `POST /api/folder/share`
3. Server:
   - Generates unique share token
   - Stores share record in KV
   - Counts folder contents (photos/videos/audio)
   - Sends invitation email immediately
4. Email includes:
   - Folder preview with icon & name
   - Content stats
   - Permission level (View/Edit/Full Access)
   - Personal message (if provided)
   - Share link with token

### Email Queue & Retry

1. If email send fails, it's added to `email_queue:`
2. **Every 5 minutes**, cron triggers `/cron/process-email-queue`
3. System:
   - Gets pending emails ready for retry
   - Sends each email
   - Uses exponential backoff (5min, 10min, 20min)
   - Marks as `sent` or `failed` after 3 attempts

---

## 🗄️ Data Storage (KV Store)

### User Data
```typescript
kv.set('user:userId', {
  id: string,
  email: string,
  name: string,
  legacyAccessEnabled: boolean,
  inactivityThresholdDays: number, // Default 90
  warningDays: number, // Default 14
  legacyMessage?: string,
  accountStatus: 'active' | 'inactive',
  lastLoginAt: string,
  inactiveAt?: string,
  createdAt: string,
})
```

### Beneficiary Data
```typescript
kv.set('beneficiary:userId:beneficiaryEmail', {
  userId: string,
  email: string,
  addedAt: string,
  status: 'active' | 'revoked',
})
```

### Inactivity Warning Record
```typescript
kv.set('inactivity_warning:userId:YYYY-MM-DD', {
  userId: string,
  sentAt: string,
  daysUntilInactive: number,
})
```

### Legacy Access Grant
```typescript
kv.set('legacy_access_grant:userId:beneficiaryEmail', {
  userId: string,
  beneficiaryEmail: string,
  grantedAt: string,
  accessToken: string,
  expiresAt: string,
  emailSent: boolean,
  emailSentAt?: string,
})
```

### Folder Share
```typescript
kv.set('folder_share:folderId:recipientEmail', {
  id: string,
  folderId: string,
  recipientEmail: string,
  permission: 'View' | 'Edit' | 'Full Access',
  shareToken: string,
  sharedBy: string, // userId
  sharedAt: string,
  status: 'pending' | 'active' | 'revoked',
  emailSent: boolean,
  emailSentAt?: string,
})
```

### Email Queue
```typescript
kv.set('email_queue:emailId', {
  id: string,
  type: string,
  recipientEmail: string,
  subject: string,
  template: string,
  variables: any,
  status: 'pending' | 'sent' | 'failed',
  attempts: number,
  maxAttempts: number,
  nextRetry: string,
  createdAt: string,
})
```

---

## 🧪 Testing

### Manual Testing

1. **Test Inactivity Warning:**
```bash
curl -X POST https://your-project-id.supabase.co/functions/v1/make-server-f9be53a7/cron/check-inactivity-warnings \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

2. **Test Inactive Account Check:**
```bash
curl -X POST https://your-project-id.supabase.co/functions/v1/make-server-f9be53a7/cron/check-inactive-accounts \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

3. **Test Email Queue:**
```bash
curl -X POST https://your-project-id.supabase.co/functions/v1/make-server-f9be53a7/cron/process-email-queue \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

4. **Test Folder Share:**
```bash
curl -X POST https://your-project-id.supabase.co/functions/v1/make-server-f9be53a7/api/folder/share \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "folderId": "test-folder-123",
    "userId": "user-123",
    "recipientEmail": "test@example.com",
    "permission": "View",
    "personalMessage": "Check this out!"
  }'
```

### Test User Setup

To test inactivity warnings, create a test user with:
- `lastLoginAt`: 76 days ago (if threshold is 90 days, warning is 14 days)
- `legacyAccessEnabled`: true
- `inactivityThresholdDays`: 90
- `warningDays`: 14

---

## 📝 Integration Checklist

### Frontend Integration

- [ ] Add beneficiary management UI in Settings → Account → Legacy
- [ ] Add folder share button in Legacy Vault
- [ ] Call `/api/user/login-hook` on every successful login
- [ ] Display shared folders in "Shared With Me" section
- [ ] Add legacy access view for beneficiaries with access token

### Backend Integration

- [ ] Set up cron jobs (GitHub Actions, Supabase pg_cron, or external)
- [ ] Verify Resend API key is working
- [ ] Test all 3 cron endpoints manually
- [ ] Test folder sharing flow end-to-end
- [ ] Monitor email queue for failed sends

### Email Domain Setup (Optional but Recommended)

For production, set up custom email domain in Resend:
1. Go to Resend dashboard → Domains
2. Add your domain (e.g., `eras.app`)
3. Add DNS records (SPF, DKIM, DMARC)
4. Update email `from` field in `/email-service.tsx`:
   ```typescript
   from: 'Eras <noreply@yourdomain.com>',
   ```

---

## 🚨 Monitoring & Alerts

### Check Email Queue Status
```bash
# Get all queued emails
curl https://your-project-id.supabase.co/functions/v1/make-server-f9be53a7/api/kv/prefix?prefix=email_queue: \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Check Recent Warnings
```bash
# Get inactivity warnings from today
curl https://your-project-id.supabase.co/functions/v1/make-server-f9be53a7/api/kv/prefix?prefix=inactivity_warning: \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Check Access Grants
```bash
# Get legacy access grants
curl https://your-project-id.supabase.co/functions/v1/make-server-f9be53a7/api/kv/prefix?prefix=legacy_access_grant: \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## 🎨 Email Template Customization

All email templates are in `/email-templates/`. You can customize:

- Colors (change gradient colors in styles)
- Icons (change emoji in headers)
- Wording (edit text content)
- Layout (modify HTML structure)
- Branding (add logo, change footer)

After editing templates, restart the server for changes to take effect.

---

## ✅ Deployment Checklist

1. **Verify Environment Variables:**
   - [x] `RESEND_API_KEY` is set
   - [x] `APP_URL` is set (e.g., `https://eras.app`)
   - [x] `SUPABASE_URL` is set
   - [x] `SUPABASE_SERVICE_ROLE_KEY` is set

2. **Deploy Server:**
   - [ ] Push code to repository
   - [ ] Verify Supabase Edge Function deploys successfully
   - [ ] Test server health endpoint

3. **Set Up Cron Jobs:**
   - [ ] Configure inactivity warnings cron (10 AM UTC daily)
   - [ ] Configure inactive accounts cron (11 AM UTC daily)
   - [ ] Configure email queue cron (every 5 minutes)

4. **Test End-to-End:**
   - [ ] Test inactivity warning email
   - [ ] Test access granted email
   - [ ] Test folder share email
   - [ ] Verify email queue retry works

5. **Monitor:**
   - [ ] Set up logging/monitoring for cron jobs
   - [ ] Set up alerts for failed emails
   - [ ] Monitor KV storage usage

---

**Status:** ✅ IMPLEMENTATION COMPLETE
**Next Steps:** Set up cron jobs and test all 3 email flows

