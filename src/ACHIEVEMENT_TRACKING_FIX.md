# Achievement Tracking Fix - Capsule Creation

## Problem
When users sent their first capsule, they weren't seeing the achievement unlock animation/modal for the "First Capsule" achievement.

## Root Cause
1. **Missing Server-Side Tracking**: The capsule creation endpoints (`/api/capsules` POST and PUT) were not calling the achievement tracking service
2. **No Polling**: The frontend only checked for achievements on mount, not continuously
3. **Disconnected Flow**: Achievement tracking was added to `database.tsx` but capsules are actually created via server endpoints

## Solution Implemented

### 1. Server-Side Achievement Tracking ✅

**File:** `/supabase/functions/server/index.tsx`

#### CREATE Capsule Endpoint (Line ~1347)
```typescript
// 🏆 TRACK ACHIEVEMENT: Capsule created
let newlyUnlockedAchievements = [];
try {
  const userCapsules = await kv.get(`user_capsules:${user.id}`);
  const isFirstCapsule = !userCapsules || userCapsules.length === 1;
  
  const achievementResult = await AchievementService.checkAndUnlockAchievements(
    user.id,
    'capsule_created',
    {
      capsuleId: capsuleId,
      isFirstCapsule: isFirstCapsule,
      hasMedia: false,
      mediaCount: 0,
      createdAt: new Date().toISOString()
    }
  );
  
  newlyUnlockedAchievements = achievementResult.newlyUnlocked || [];
}
```

#### UPDATE Capsule Endpoint (Line ~1840)
Tracks achievements when a draft is converted to scheduled:
```typescript
const wasConvertedFromDraft = capsule.status === 'draft' && updatedCapsule.status === 'scheduled';

if (wasConvertedFromDraft) {
  // Track achievement for first capsule
  const achievementResult = await AchievementService.checkAndUnlockAchievements(...);
}
```

### 2. Frontend Polling for Achievements ✅

**File:** `/components/AchievementUnlockManager.tsx`

Added automatic polling every 5 seconds to check for pending achievements:

```typescript
// 🔄 Poll for pending achievements every 5 seconds
useEffect(() => {
  if (!session?.access_token || Object.keys(definitions).length === 0) {
    return;
  }

  // Check immediately
  checkPendingNotifications(session.access_token);

  // Then poll every 5 seconds
  const pollInterval = setInterval(() => {
    if (session?.access_token && Object.keys(definitions).length > 0) {
      checkPendingNotifications(session.access_token);
    }
  }, 5000);

  return () => clearInterval(pollInterval);
}, [session, definitions, checkPendingNotifications]);
```

### 3. Response Enhancement ✅

Both CREATE and UPDATE endpoints now return `newlyUnlockedAchievements` in the response:

```typescript
return c.json({ 
  success: true, 
  capsule: { ... },
  newlyUnlockedAchievements: newlyUnlockedAchievements // New field
});
```

## Achievement Flow

### Complete Flow
1. **User creates/schedules capsule** → Frontend calls `/api/capsules` (POST or PUT)
2. **Server saves capsule** → Stores in KV database
3. **Server tracks achievement** → Calls `AchievementService.checkAndUnlockAchievements()`
4. **Achievement service checks criteria** → Evaluates if "First Capsule" (A002) is unlocked
5. **Achievement marked as pending** → Stored with `notificationShown: false`
6. **Frontend polls** → AchievementUnlockManager checks every 5 seconds
7. **Pending achievement detected** → Frontend calls `/achievements/pending`
8. **Modal displays** → AchievementUnlockModal shows celebration
9. **User interacts** → Can view details, share, or close
10. **Marked as shown** → `notificationShown: true` set via `/achievements/mark-shown`

## Achievements That Can Unlock

### From Capsule Creation:
- **A002: "First Capsule"** - Send your first time capsule (Common, 50 pts)
- **A009: "Prolific"** - Create 100 time capsules (Epic, 500 pts)
- **A017: "Time Traveler"** - Send capsule 10+ years in future (Rare, 200 pts)
- **A018: "Time Lord"** - Send capsule 25+ years in future (Epic, 500 pts)
- **A019: "Daily Ritual"** - Create capsule 7 days in a row (Uncommon, 150 pts)
- **A020: "Monthly Milestone"** - Create at least 1 capsule for 12 consecutive months (Rare, 300 pts)

## Testing

To test the fix:
1. Create a new user account
2. Create and schedule your first capsule
3. Within 5 seconds, you should see:
   - Achievement toast notification
   - Confetti celebration (for epic+ rarities)
   - Clicking the toast opens the full modal
4. The modal shows:
   - Achievement icon and title
   - Points earned
   - Title reward (if applicable)
   - Share options

## Debugging

If achievements don't show:
1. Check server logs for `🏆 Tracking capsule_created achievement`
2. Check for `🎉 Unlocked X achievement(s)`
3. Check frontend console for `🏆 Fetching achievement definitions`
4. Verify polling is active: should see requests to `/achievements/pending` every 5s
5. Check Settings → Developer Tools → "Test Achievement Unlock" button

## Related Files Modified
- `/supabase/functions/server/index.tsx` - Added tracking to CREATE and UPDATE endpoints
- `/components/AchievementUnlockManager.tsx` - Added 5-second polling
- `/utils/supabase/database.tsx` - Already had tracking (but not used for main flow)

## Status: ✅ COMPLETE

Achievement tracking is now fully integrated into the capsule creation flow with automatic detection and notification within 5 seconds.
