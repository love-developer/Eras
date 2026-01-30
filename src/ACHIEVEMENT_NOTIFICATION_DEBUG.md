# Achievement Notification Debugging Guide

## Problem
The "Into the Future" achievement (A002) was unlocked when you sent your first capsule, but the unlock modal/animation sequence didn't appear. The achievement shows as unlocked on the Achievements page, but you never saw the celebration.

## What I've Added

### 1. Enhanced Logging Throughout the System

#### Frontend Logging (useAchievements.tsx)
- ✅ Added detailed logs to `checkPendingNotifications()` function
- ✅ Logs when polling checks for pending achievements
- ✅ Logs when achievements are found in the queue
- ✅ Logs when modals are shown
- ✅ Logs when achievements are marked as shown

#### Achievement Polling Manager (AchievementUnlockManager.tsx)
- ✅ Logs when polling starts/stops
- ✅ Logs polling status every 5 seconds
- ✅ Confirms session and definitions are loaded

#### Backend Logging (achievement-service.tsx)
- ✅ Added logs to `queueAchievementNotifications()` function
- ✅ Logs when achievements are added to the queue
- ✅ Shows queue length before and after
- ✅ Enhanced `getPendingNotifications()` with detailed queue state logging
- ✅ Shows all queue items and their 'shown' status

### 2. Debug Endpoint

Created a new server endpoint: `/achievements/debug/queue`

Returns:
- User ID
- Total queue items
- Number of pending (unshown) notifications
- Total unlocked achievements
- Current stats (capsules_created, capsules_sent, capsules_received)
- Full queue with each item's status

### 3. Debug Button Component

Created `AchievementDebugButton.tsx` - a floating button in the bottom-right corner that:
- Shows a "Debug Achievements" button (only when logged in)
- Calls the debug endpoint
- Displays the achievement queue state in a popup
- Shows which achievements are pending vs. already shown
- Shows current user stats

## How to Debug

### Step 1: Open Browser Console
Press F12 to open Developer Tools and go to the Console tab.

### Step 2: Click the Debug Button
You'll see a floating "Debug Achievements" button in the bottom-right corner. Click it.

### Step 3: Review the Queue State
The popup will show:
- **Total Queue Items**: How many achievements are in your notification queue
- **Pending (Not Shown)**: How many are waiting to be shown
- **Unlocked Achievements**: Total achievements you've unlocked
- **Stats**: Your current capsule counts
- **Queue Items**: List of all queued achievements and whether they're shown or pending

### Step 4: Check Console Logs

Look for these log patterns:

**Polling Status:**
```
▶️ [Achievement Polling] Starting achievement polling (every 5s)
🔍 [Achievement] Checking for pending notifications...
```

**Queue State:**
```
[Achievements] Total queue items: X
[Achievements] ✅ Found Y pending (unshown) notifications: [A002, ...]
```

**Modal Display:**
```
🏆 [Achievement] Showing toast for: Into the Future (A002)
```

## Common Issues and Solutions

### Issue 1: Achievement in queue but marked as "shown: true"
**Cause**: The achievement was queued but the modal displayed and was marked as shown in a previous session.
**Solution**: This is expected behavior - achievements only show once.

### Issue 2: Achievement NOT in queue
**Cause**: The achievement was unlocked but never queued properly.
**Solution**: 
- Check server logs for the queueing message when you created the capsule
- Look for `📬 [Achievement Queue] Adding to queue: Into the Future (A002)`

### Issue 3: Polling not running
**Symptom**: No polling logs every 5 seconds
**Cause**: Session or definitions not loaded
**Solution**:
- Check that you're logged in
- Refresh the page
- Look for the log: `▶️ [Achievement Polling] Starting achievement polling (every 5s)`

### Issue 4: `capsules_sent` is 0 but achievement is unlocked
**Cause**: Achievement tracking might be using `capsules_created` instead of `capsules_sent`
**Solution**: This is a data inconsistency issue - check which action was tracked when the capsule was created

## Testing the Fix

### To manually test if notifications work:

1. Open browser console
2. Click the Debug button to see current queue state
3. Create a new capsule (this should trigger  "First Step" if you haven't unlocked it)
4. Watch the console for:
   - Server logs: `📬 [Achievement Queue] Adding to queue:`
   - Frontend logs: `🔍 [Achievement] Found X pending notification(s)`
   - Modal display: `🏆 [Achievement] Showing toast for:`
5. Click Debug button again to confirm the achievement was marked as shown

## Next Steps

1. **Check your current queue state** using the Debug button
2. **Share the queue state** with me so I can see:
   - Is A002 in the queue?
   - Is it marked as shown?
   - What's your `capsules_sent` count?
3. **Monitor console logs** when creating a new capsule to see the full flow

## Removing the Debug Button

Once we've fixed the issue, remove the debug button by editing `/App.tsx`:

Find this line (around line 1811):
```tsx
{auth.isAuthenticated && <AchievementDebugButton />}
```

And remove it or comment it out:
```tsx
{/* {auth.isAuthenticated && <AchievementDebugButton />} */}
```

## Expected Log Flow for a New Achievement

When an achievement unlocks, you should see:

1. **Server-side** (when capsule is created):
```
🏆 Tracking capsule_created achievement for user: [user-id]
[Achievements] Checking achievements for user [user-id], action: capsule_created
📬 [Achievement Queue] Queueing 1 achievement(s) for user [user-id]
📬 [Achievement Queue] Adding to queue: Into the Future (A002)
📬 [Achievement Queue] ✅ Saved queue with 2 total items
🎉 Unlocked 1 achievement(s): Into the Future
```

2. **Client-side** (within 5 seconds):
```
🔍 [Achievement] Checking for pending notifications...
[Achievements] Total queue items: 2
[Achievements] ✅ Found 1 pending (unshown) notifications: A002
🎉 [Achievement] Showing pending notification modal(s)
🏆 [Achievement] Showing toast for: Into the Future (A002)
✅ [Achievement] Marking achievements as shown: [A002]
```

If you see this flow, the system is working correctly!
