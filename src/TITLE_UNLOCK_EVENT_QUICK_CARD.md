# 🎯 TITLE UNLOCK EVENT SYSTEM - QUICK CARD

## 🚀 **HOW IT WORKS**

```
USER CLOSES ACHIEVEMENT MODAL
         ↓
📡 Event: "achievementClosed" 
         ↓
👂 AchievementUnlockManager receives
         ↓
⏳ Wait 2000ms
         ↓
👑 Title Unlock Modal opens
```

---

## 💻 **CODE LOCATIONS**

### **Event Dispatch:**
**File:** `/components/AchievementUnlockModal.tsx`  
**Line:** ~264-282  
**Function:** `handleClose()`

```typescript
window.dispatchEvent(new CustomEvent('achievementClosed', {
  detail: { title, rarity, achievementName, timestamp }
}));
```

### **Event Listener:**
**File:** `/components/AchievementUnlockManager.tsx`  
**Line:** ~103-141  
**Hook:** `useEffect(() => { ... }, [])`

```typescript
window.addEventListener('achievementClosed', handleAchievementClosed);
```

---

## 🎯 **KEY FEATURES**

✅ **User-driven** (not time-based)  
✅ **No animation dependencies**  
✅ **Works across all auth flows**  
✅ **Handles all edge cases**  
✅ **Auto-cleanup on unmount**  
✅ **2s breathing space delay**  
✅ **Queue system for multiple titles**

---

## 🧪 **TESTING**

### **Quick Test:**
1. Create first capsule → Unlocks "First Step" achievement
2. Close Achievement Modal (any method)
3. Wait 2s → "Time Novice" Title Modal appears

### **Console Logs:**
```
🔒 [AU Modal] User initiated close
📡 [AU Modal] Dispatching achievementClosed event
🎯 [Title Sequence] achievementClosed event received
✅ [Title Sequence] Title reward detected: Time Novice
⏳ [Title Sequence] Waiting 2s...
🎬 [Title Sequence] Triggering Title Unlock Modal
👑 [Title Queue] Showing title: Time Novice
```

---

## 🔧 **DEBUGGING**

### **Title Not Showing?**

1. ✅ Check achievement has `rewards.title` defined
2. ✅ Look for event dispatch log
3. ✅ Verify listener registered log
4. ✅ Check for queue processing log

### **Common Issues:**

| Issue | Solution |
|-------|----------|
| No event fired | Check `handleClose()` is called |
| Event fired but no modal | Check `rewards.title` exists |
| Multiple modals overlap | Shouldn't happen (queue system) |
| Title shows immediately | Check 2s delay is present |

---

## 📊 **ACHIEVEMENTS WITH TITLES**

Quick reference for achievements that unlock titles:

- A001 → Time Novice
- A003 → Chrononaut  
- A004 → Temporal Tactician
- A005 → Capsule Apprentice
- A006 → Master Archivist
- A008 → Memory Guardian
- A009 → Pristine Moment
- A010 → Grand Historian
- A011 → Multimedia Maestro
- A013 → Visual Poet
- D003 → Time Bender
- D004 → Patience Virtuoso
- D005 → Decade Dreamer
- E001 → Delivery Master
- E002 → Punctual
- E004 → Archive Opener
- E005 → Revelation Seeker
- F001 → Era Pioneer
- F003 → Time's Champion
- F004 → Founding Visionary
- F007 → Achievement Hunter
- F008 → Chronicle Master

---

## 🎨 **Z-INDEX**

Both modals: **z-index: 2147483647**  
(They never overlap due to event system)

---

## 📝 **ADDING NEW TITLE**

In `/supabase/functions/server/achievement-service.tsx`:

```typescript
{
  id: 'AXXX',
  title: 'Achievement Name',
  // ... other properties
  rewards: {
    points: 50,
    title: 'Your New Title'  // ← Add this
  }
}
```

That's it! Event system handles the rest.

---

**Status:** ✅ Production Ready  
**Last Updated:** November 8, 2025
