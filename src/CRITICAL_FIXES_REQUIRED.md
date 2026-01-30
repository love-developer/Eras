# 🚨 CRITICAL ISSUES DIAGNOSED

## Issue 1: Home Screen Slow Load + Empty Folders ❌

**Problem:** Dashboard takes long to load and folders show as empty even though capsules exist.

**Root Cause:**
1. Dashboard fetches capsules but may not be filtering correctly by `folder_id`
2. Capsules might be stored without proper folder associations
3. The Legacy Vault folder system is separate from capsule organization

**Current Behavior:**
- Dashboard loads all user capsules via `/api/capsules`
- No folder filtering happens on server side
- Frontend tries to filter but capsules may not have `folder_id` field

**Fix Required:**
1. Add `folder_id` field to capsule schema
2. Update capsule creation to save `folder_id`
3. Add folder filtering to Dashboard component
4. Update server endpoint to support folder filtering

---

## Issue 2: Capsules Delivered Early (CRITICAL) ❌

**Problem:** Capsules are being delivered before the user-specified delivery time.

**Root Cause Analysis:**

Looking at the code flow:
1. **CreateCapsule.tsx (Line 818-822)**: Converts user's local time to UTC correctly
2. **Server receives UTC timestamp** in `delivery_date` field
3. **BUT**: Server-side delivery checker may not be respecting the exact delivery_date

**Let me check the delivery service logic:**

The delivery service needs to:
- ✅ Check if current time >= delivery_date
- ❌ May be checking only DATE not DATE+TIME
- ❌ May have timezone conversion issues

**Fix Required:**
Check `/supabase/functions/server/delivery-service.tsx` for the delivery time comparison logic.

---

## Issue 3: Received Capsules Not Updating in Real-Time ❌

**Problem:** Recipients don't see new received capsules until they refresh or check email.

**Root Cause:**
1. Dashboard polls every 30s for user's OWN capsules
2. BUT: Does NOT poll for received capsules automatically
3. `refreshReceivedCount()` function exists but isn't called on a regular interval

**Current Code (Dashboard.tsx Line 831-858):**
```typescript
// Polling for updates (30 seconds)
useEffect(() => {
  if (!user?.id || activeTab !== 'home') return;
  
  const pollInterval = setInterval(async () => {
    console.log('🔄 Polling for real-time updates...');
    
    // Fetch fresh capsules data silently (no loading state)
    const result = await DatabaseService.getUserTimeCapsules(user.id, PAGE_SIZE, 0);
    
    // Update capsules...
    setCapsules(result.capsules || []);
    
    // BUT: Never calls refreshReceivedCount()!
  }, 30000);
```

**Missing:** `await refreshReceivedCount();` inside the polling interval

**Fix Required:**
Add received capsules polling to the Dashboard polling effect.

---

## 🔧 IMPLEMENTATION PLAN

### Priority 1: Fix Early Delivery (HIGHEST)
1. Check delivery-service.tsx line ~2606
2. Ensure delivery time comparison includes BOTH date AND time
3. Verify UTC handling is correct
4. Add logging to see what time comparisons are happening

### Priority 2: Fix Real-Time Received Capsules
1. Update Dashboard polling (line ~839)
2. Add `await refreshReceivedCount();` after updating sent capsules
3. Test with two users: send capsule, verify recipient sees count update within 30s

### Priority 3: Fix Folder System (Lower Priority)
1. Add `folder_id` to capsule schema
2. Update create capsule flow
3. Add folder filtering to Dashboard
4. This is a bigger refactor - can be done separately

---

## Next Steps

I will now:
1. ✅ Fix the delivery time logic
2. ✅ Fix the received capsules real-time updates
3. Document the folder system issue for future implementation
