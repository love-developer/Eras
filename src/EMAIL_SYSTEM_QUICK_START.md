# 📧 Legacy Email System - Quick Start Guide

## ✅ What Was Implemented

**3 Email Templates:**
1. ⚠️ **Inactivity Warning** - Sent 14 days before account becomes inactive
2. 🔓 **Beneficiary Access Granted** - Sent when beneficiaries get access
3. 📂 **Folder Share Invitation** - Sent when user shares a vault folder

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Set Up Cron Jobs

You need to configure 3 cron jobs to trigger the automated emails:

**Option A: GitHub Actions (Easiest)**

1. Create file: `.github/workflows/email-cron.yml`
2. Copy the GitHub Actions config from `/LEGACY_EMAIL_SYSTEM_SETUP.md`
3. Add secrets to your GitHub repo:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

**Option B: Manual Cron Service**

Use cron-job.org or similar to call these URLs:

```bash
# Every day at 10 AM UTC
https://YOUR-PROJECT.supabase.co/functions/v1/make-server-f9be53a7/cron/check-inactivity-warnings

# Every day at 11 AM UTC  
https://YOUR-PROJECT.supabase.co/functions/v1/make-server-f9be53a7/cron/check-inactive-accounts

# Every 5 minutes
https://YOUR-PROJECT.supabase.co/functions/v1/make-server-f9be53a7/cron/process-email-queue
```

### Step 2: Frontend Integration

Add this to your login success handler:

```typescript
// After successful login
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/make-server-f9be53a7/api/user/login-hook`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId: user.id }),
  }
);
```

### Step 3: Test It

**Manual Test - Send Folder Share Email:**

```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/make-server-f9be53a7/api/folder/share`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      folderId: 'test-folder-123',
      userId: 'your-user-id',
      recipientEmail: 'test@example.com',
      permission: 'View',
      personalMessage: 'Check out these memories!',
    }),
  }
);
```

---

## 📋 API Endpoints Reference

### Folder Sharing (Immediate Emails)

```typescript
// Share a folder - sends email immediately
POST /api/folder/share
Body: {
  folderId: string,
  userId: string,
  recipientEmail: string,
  permission: 'View' | 'Edit' | 'Full Access',
  personalMessage?: string
}

// Get shared folder by token
GET /api/folder/shared/:token

// Remove folder share
DELETE /api/folder/share
Body: { folderId: string, recipientEmail: string }

// List all shares for a folder
GET /api/folder/:folderId/shares
```

### Cron Jobs (Automated Emails)

```typescript
// Check for inactivity warnings (10 AM UTC daily)
POST /cron/check-inactivity-warnings

// Check for inactive accounts (11 AM UTC daily)
POST /cron/check-inactive-accounts

// Process email retry queue (every 5 min)
POST /cron/process-email-queue
```

### Login Hook

```typescript
// Call this on every user login
POST /api/user/login-hook
Body: { userId: string }
```

---

## 🧪 Testing Checklist

### Test Folder Share Email (Easiest to Test)

1. Create a test folder in your vault
2. Call the `/api/folder/share` endpoint
3. Check recipient's email inbox
4. ✅ You should receive the folder share invitation

### Test Inactivity Warning

1. Create a test user with these settings:
   ```typescript
   {
     legacyAccessEnabled: true,
     lastLoginAt: new Date(Date.now() - 76 * 24 * 60 * 60 * 1000), // 76 days ago
     inactivityThresholdDays: 90,
     warningDays: 14
   }
   ```
2. Call `/cron/check-inactivity-warnings`
3. ✅ User should receive inactivity warning email

### Test Access Granted

1. Create a test user with these settings:
   ```typescript
   {
     legacyAccessEnabled: true,
     lastLoginAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
     inactivityThresholdDays: 90
   }
   ```
2. Add a beneficiary to the user
3. Call `/cron/check-inactive-accounts`
4. ✅ Beneficiary should receive access granted email

---

## 🎨 Email Preview

### Inactivity Warning Email
```
┌─────────────────────────┐
│    ⚠️ Action Required    │
│ Account inactive in 14  │
│        DAYS             │
├─────────────────────────┤
│ • Your beneficiaries:   │
│   jane@example.com      │
│   bob@example.com       │
├─────────────────────────┤
│ [✅ Log In to Stay Active]│
└─────────────────────────┘
```

### Access Granted Email
```
┌─────────────────────────┐
│  🔓 Legacy Access       │
│      Granted            │
├─────────────────────────┤
│ John's memories now     │
│ available to you:       │
│                         │
│  12 Capsules            │
│  47 Vault Items         │
├─────────────────────────┤
│ [🔓 Access Memories]     │
└─────────────────────────┘
```

### Folder Share Email
```
┌─────────────────────────┐
│  📂 Folder Shared       │
│  🏖️ Family Vacation      │
├─────────────────────────┤
│ What's Inside:          │
│  📸 18 Photos           │
│  🎥 5 Videos            │
│  🎵 1 Audio             │
├─────────────────────────┤
│ 👁️ View Only Access     │
├─────────────────────────┤
│ [📂 Open Folder]         │
└─────────────────────────┘
```

---

## 🔧 Troubleshooting

### Emails Not Sending?

1. **Check Resend API Key:**
   ```bash
   echo $RESEND_API_KEY
   ```

2. **Check Email Queue:**
   ```bash
   curl https://YOUR-PROJECT.supabase.co/functions/v1/make-server-f9be53a7/api/kv/prefix?prefix=email_queue: \
     -H "Authorization: Bearer YOUR_ANON_KEY"
   ```

3. **Check Server Logs:**
   - Go to Supabase Dashboard → Edge Functions → Logs
   - Look for email sending errors

### Cron Jobs Not Running?

1. **Verify GitHub Actions:**
   - Go to your repo → Actions tab
   - Check if workflows are enabled
   - Check workflow run history

2. **Test Manually:**
   ```bash
   curl -X POST https://YOUR-PROJECT.supabase.co/functions/v1/make-server-f9be53a7/cron/check-inactivity-warnings \
     -H "Authorization: Bearer YOUR_ANON_KEY"
   ```

### Folder Share Email Not Sending?

1. **Check folder exists:**
   ```bash
   curl https://YOUR-PROJECT.supabase.co/functions/v1/make-server-f9be53a7/api/kv/get?key=vault_folder:USER_ID:FOLDER_ID \
     -H "Authorization: Bearer YOUR_ANON_KEY"
   ```

2. **Check response for errors:**
   - Should return `{ success: true, shareId: "...", shareToken: "..." }`
   - If error, check server logs

---

## 📊 Monitoring

### Check Email Stats

```bash
# Get all email queue items
curl "https://YOUR-PROJECT.supabase.co/functions/v1/make-server-f9be53a7/api/kv/prefix?prefix=email_queue:" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Get inactivity warnings
curl "https://YOUR-PROJECT.supabase.co/functions/v1/make-server-f9be53a7/api/kv/prefix?prefix=inactivity_warning:" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Get access grants
curl "https://YOUR-PROJECT.supabase.co/functions/v1/make-server-f9be53a7/api/kv/prefix?prefix=legacy_access_grant:" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Get folder shares
curl "https://YOUR-PROJECT.supabase.co/functions/v1/make-server-f9be53a7/api/kv/prefix?prefix=folder_share:" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## 🎯 Next Steps

1. **Set up cron jobs** (GitHub Actions or external service)
2. **Add login hook** to your login success handler
3. **Test folder share** email with a real email address
4. **Monitor email queue** for the first few days
5. **Set up custom domain** in Resend (optional, for production)

---

## 📚 Full Documentation

For complete details, see:
- `/LEGACY_EMAIL_SYSTEM_SETUP.md` - Full setup guide
- `/EMAIL_TEMPLATES_LEGACY_SYSTEM.md` - Template specifications

---

**Status:** ✅ READY TO USE
**Estimated Setup Time:** 15 minutes
**Support:** Check server logs in Supabase Dashboard → Edge Functions

