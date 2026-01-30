# ⚡ APPLY TIMEOUT FIX - Quick Guide

**Goal**: Fix the 120-second timeout errors on claim-pending endpoint

---

## 🚀 OPTION 1: Quick Fix (5 minutes)

### Step 1: Update Backend Endpoint

Open `/supabase/functions/server/index.tsx` and find the claim-pending endpoint (around line 6266).

**Add these imports at the top of the file**:
```typescript
import { withKVTimeout, withFallback } from './timeout-helpers.tsx';
```

**Replace the entire endpoint** with this optimized version:

```typescript
app.post("/make-server-f9be53a7/api/capsules/claim-pending", async (c) => {
  try {
    console.log('🔍 Claim pending capsules request received');
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized', claimed: 0, capsuleIds: [] }, 401);
    }

    const { user, error: authError } = await verifyUserToken(accessToken);
    if (authError || !user) {
      return c.json({ error: 'Unauthorized', claimed: 0, capsuleIds: [] }, 401);
    }

    const userId = user.id;
    const userEmail = user.email?.toLowerCase();
    
    if (!userEmail) {
      return c.json({ error: 'User email required', claimed: 0, capsuleIds: [] });
    }

    console.log(`📧 Claiming pending capsules for user`);

    // Get pending capsules with timeout (10s max)
    const pendingKey = `pending_capsules:${userEmail}`;
    const pendingCapsuleIds = await withFallback(kv.get(pendingKey), [], 10000);
    
    if (!Array.isArray(pendingCapsuleIds) || pendingCapsuleIds.length === 0) {
      console.log('ℹ️ No pending capsules found');
      return c.json({ claimed: 0, capsuleIds: [] });
    }

    console.log(`📦 Found ${pendingCapsuleIds.length} pending capsule(s)`);

    // Get received list with timeout (10s max)
    const receivedKey = `user_received:${userId}`;
    const receivedList = await withFallback(kv.get(receivedKey), [], 10000);
    
    let claimedCount = 0;
    const claimedIds = [];

    // Process in memory (fast)
    for (const capsuleId of pendingCapsuleIds) {
      if (!receivedList.includes(capsuleId)) {
        receivedList.push(capsuleId);
        claimedIds.push(capsuleId);
        claimedCount++;
      }
    }

    // Update received list (10s max)
    if (claimedCount > 0) {
      await withKVTimeout(kv.set(receivedKey, receivedList), 10000);
      console.log(`✅ Updated received list with ${claimedCount} capsules`);
    }

    // Clear pending (10s max)
    await withKVTimeout(kv.del(pendingKey), 10000);

    // Background tasks (async, non-blocking)
    if (claimedIds.length > 0) {
      Promise.all(claimedIds.map(capsuleId => 
        Promise.resolve().then(async () => {
          try {
            // Notifications
            const capsule = await withKVTimeout(kv.get(`capsule:${capsuleId}`), 5000);
            if (capsule) {
              let senderName = 'Someone Special';
              if (capsule.created_by) {
                const profile = await withKVTimeout(kv.get(`profile:${capsule.created_by}`), 5000);
                if (profile?.display_name) senderName = profile.display_name.trim();
              }
              
              const notification = {
                id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: 'received_capsule',
                capsuleId,
                capsuleTitle: capsule.title || 'Untitled Capsule',
                senderName,
                message: `${senderName} sent you: "${capsule.title || 'Untitled'}"`,
                timestamp: new Date().toISOString(),
                read: false
              };
              
              const notificationsKey = `notifications:${userId}`;
              const notifications = await withFallback(kv.get(notificationsKey), [], 5000);
              notifications.unshift(notification);
              if (notifications.length > 100) notifications.splice(100);
              await withKVTimeout(kv.set(notificationsKey, notifications), 5000);
            }
            
            // Achievements
            await AchievementService.checkAndUnlockAchievements(userId, 'capsule_received', {
              capsuleId,
              deliveryType: 'claimed',
              claimedAt: new Date().toISOString()
            });
          } catch (err) {
            console.error(`Background task error for ${capsuleId}:`, err);
          }
        })
      ));
    }

    return c.json({
      claimed: claimedCount,
      capsuleIds: claimedIds,
      message: claimedCount > 0 ? `Claimed ${claimedCount} capsule${claimedCount > 1 ? 's' : ''}!` : 'No new capsules'
    });

  } catch (error) {
    console.error('❌ Error claiming:', error);
    return c.json({ 
      error: 'Failed to claim', 
      details: error.message,
      claimed: 0, 
      capsuleIds: [] 
    }, 500);
  }
});
```

### Step 2: Deploy

```bash
supabase functions deploy make-server-f9be53a7
```

### Step 3: Test

Log in and check console - should see:
```
✅ Claimed X pending capsule(s) (took ~5-10s)
```

---

## 🔧 OPTION 2: Full Implementation (10 minutes)

If you want the complete optimized version:

### Step 1: Verify Files Exist

Check that these files were created:
- ✅ `/supabase/functions/server/timeout-helpers.tsx`
- ✅ `/supabase/functions/server/claim-pending-optimized.tsx`
- ✅ `/utils/supabase/database.tsx` (already modified)

### Step 2: Import in index.tsx

Add at the top of `/supabase/functions/server/index.tsx`:

```typescript
import { handleClaimPending } from './claim-pending-optimized.tsx';
```

### Step 3: Replace Endpoint

Find the claim-pending endpoint and replace with:

```typescript
app.post("/make-server-f9be53a7/api/capsules/claim-pending", async (c) => {
  return await handleClaimPending(c, verifyUserToken);
});
```

### Step 4: Deploy

```bash
supabase functions deploy make-server-f9be53a7
```

---

## ✅ VERIFICATION

After deployment, check:

1. **Browser Console** - Should show faster response:
   ```
   ✅ Claimed X pending capsule(s)
   ```

2. **No Timeout Errors**:
   ```
   ❌ AbortError  ← Should NOT see this anymore
   ❌ timed out after 120014ms  ← Should NOT see this
   ```

3. **Faster Login**:
   - Before: 60-120 seconds
   - After: 5-10 seconds

4. **Supabase Logs**:
   ```bash
   supabase functions logs make-server-f9be53a7
   ```
   Should show successful claims with timestamps.

---

## 🐛 TROUBLESHOOTING

### "withKVTimeout is not defined"

**Fix**: Make sure you created `/supabase/functions/server/timeout-helpers.tsx` and it exports the functions:
```typescript
export async function withKVTimeout(...) { ... }
export async function withFallback(...) { ... }
```

### "handleClaimPending is not a function"

**Fix**: Use Option 1 (inline code) instead of Option 2 (import).

### Still seeing timeouts

**Check**:
1. Did you deploy? `supabase functions deploy make-server-f9be53a7`
2. Check Edge Function logs for errors
3. Verify timeout helpers are working (should see logs)

### Notifications not appearing

**This is normal** - they run in background. Wait 30-60 seconds.

---

## 🎯 EXPECTED TIMELINE

| Action | Time |
|--------|------|
| Code update | 3-5 min |
| Deploy | 2-3 min |
| Test | 2 min |
| **Total** | **7-10 min** |

---

## 📞 NEED HELP?

1. Check `/TIMEOUT_ERRORS_FIXED.md` for full technical details
2. Check Supabase logs: `supabase functions logs make-server-f9be53a7`
3. Verify files exist and are deployed correctly

---

**Ready to fix?** Choose Option 1 for quick fix, Option 2 for complete solution.
