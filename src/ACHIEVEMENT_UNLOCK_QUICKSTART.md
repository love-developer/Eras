# ⚡ Achievement Unlock Flow - Quick Start Guide

## 🚀 5-Minute Integration

### Step 1: Add the Manager to Your App

```tsx
// App.tsx
import { AchievementUnlockManager } from './components/AchievementUnlockManager';

function App() {
  return (
    <div>
      {/* Your existing app content */}
      
      {/* Add this at the root level - that's it! */}
      <AchievementUnlockManager 
        onNavigateToAchievements={() => {
          // Optional: Navigate to achievements page
          setCurrentTab('vault');
        }}
      />
    </div>
  );
}
```

**That's it!** The system now automatically:
- ✅ Detects new achievement unlocks
- ✅ Shows beautiful unlock animations
- ✅ Plays tier-appropriate sounds
- ✅ Triggers haptic feedback (mobile)
- ✅ Adds "New" badges to dashboard
- ✅ Handles share functionality

---

## 🎯 Triggering Achievement Unlocks

### Any Action in Your App

```tsx
import { useAchievements } from './hooks/useAchievements';
import { useAuth } from './hooks/useAuth';

function YourComponent() {
  const { trackAction } = useAchievements();
  const { session } = useAuth();
  
  const handleUserAction = async () => {
    // ... your existing code ...
    
    // Track the action (achievements unlock automatically!)
    await trackAction('capsule_created', {
      recipientEmail: 'friend@email.com',
      scheduleDays: 30
    }, session.access_token);
  };
}
```

**Available Actions:**
- `capsule_created`
- `capsule_sent`
- `capsule_received`
- `media_uploaded`
- `filter_used`
- `sticker_used`
- `legacy_vault_setup`
- And more...

---

## 🎨 Customizing the Experience

### Change Animation Duration

```tsx
// In AchievementUnlockModal.tsx, adjust timing:
setTimeout(() => setAnimationPhase('fill'), 500);    // Faster
setTimeout(() => setAnimationPhase('glow'), 1000);   // Standard
setTimeout(() => setAnimationPhase('complete'), 1500); // Slower
```

### Change "New" Badge Duration

```tsx
// In AchievementsDashboard.tsx
const isNew = isUnlocked && unlockRecord?.unlockedAt 
  ? (Date.now() - new Date(unlockRecord.unlockedAt).getTime()) < 3 * 24 * 60 * 60 * 1000 // 3 days
  : false;
```

### Disable Sound/Haptics

```tsx
// Comment out these lines in AchievementUnlockModal.tsx:
// playAchievementSound(achievement.category);
// triggerHaptic();
```

---

## 📱 Testing the Flow

### Test in Development

```tsx
// Manually trigger an unlock for testing
const { showUnlockModal, setCurrentUnlock } = useAchievements();

const testUnlock = () => {
  const testAchievement = {
    id: 'A001',
    title: 'First Step',
    description: 'Creating your Eras account!',
    icon: '🎬',
    category: 'starter',
    rarity: 'common',
    rewards: { points: 10 }
  };
  
  setCurrentUnlock(testAchievement);
};
```

### Create Your First Capsule

The easiest way to test:
1. Create a capsule
2. Achievement "A001 - First Step" unlocks
3. Modal appears with animation
4. "New" badge shows on dashboard

---

## 🔊 Sound System Overview

### How It Works
```tsx
playAchievementSound('starter')    → Soft pop (C5)
playAchievementSound('era_themed') → Gentle chime (E5)
playAchievementSound('time_based') → Soft bell (G5)
playAchievementSound('volume')     → Deep tone (G4)
playAchievementSound('special')    → Shimmer (A5) + harmonic
```

### Browser Compatibility
- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support
- ✅ Safari: Full support
- ✅ Mobile: Full support
- ⚠️ User must interact with page first (autoplay policy)

---

## 📳 Haptic Feedback

### Pattern
```
Vibrate: 50ms
Pause:  100ms
Vibrate: 50ms
```

### Device Support
- ✅ Android: Full support
- ✅ iOS: Full support (Safari)
- ❌ Desktop: No effect (gracefully ignored)

---

## 🏷️ "New" Badge System

### Automatic Display
Achievements unlocked within **7 days** automatically show a "NEW" badge:

```
┌──────────────┐
│  ╔═══╗       │
│  ║NEW║  🎬   │
│  ╚═══╝       │
│  First Step  │
└──────────────┘
```

### How It Works
```tsx
const isNew = (Date.now() - new Date(unlockDate).getTime()) < 7 * 24 * 60 * 60 * 1000;
```

---

## 🎯 Common Use Cases

### 1. Create First Capsule
```tsx
await trackAction('capsule_created', {
  recipientEmail: 'user@example.com',
  scheduleDays: 7
}, accessToken);
// → Unlocks: A001 - First Step
```

### 2. Upload First Photo
```tsx
await trackAction('media_uploaded', {
  type: 'photo',
  sizeMB: 2.5
}, accessToken);
// → Unlocks: A004 - Captured Moment
```

### 3. Use a Filter
```tsx
await trackAction('filter_used', {
  filter: 'yesterday'
}, accessToken);
// → Progress toward: B001 - Yesterday's Echo
```

### 4. Create at 3 AM
```tsx
await trackAction('capsule_created', {
  recipientEmail: 'user@example.com',
  createdAt: new Date().toISOString(), // System checks hour
  scheduleDays: 7
}, accessToken);
// → If 2:45-3:15 AM: Unlocks E001 - Night Owl
```

---

## 🐛 Troubleshooting

### Modal Not Appearing?

**Check:**
1. Is `AchievementUnlockManager` mounted?
2. Is user logged in? (`session.access_token`)
3. Check browser console for errors
4. Run `checkPendingNotifications()` manually

**Solution:**
```tsx
const { checkPendingNotifications } = useAchievements();

useEffect(() => {
  if (session?.access_token) {
    checkPendingNotifications(session.access_token);
  }
}, [session]);
```

### Sound Not Playing?

**Issue:** Browser autoplay policy

**Solution:** User must interact with page first
```tsx
// Play on first user click
document.addEventListener('click', () => {
  const ctx = new AudioContext();
  ctx.close(); // Just wake up audio system
}, { once: true });
```

### Haptic Not Working?

**Check:**
1. Testing on mobile device?
2. Not in silent/DND mode?
3. Browser supports `navigator.vibrate`?

**Test:**
```tsx
if ('vibrate' in navigator) {
  navigator.vibrate([50, 100, 50]);
}
```

### "New" Badge Not Showing?

**Check:**
1. Achievement unlocked within 7 days?
2. `isNew` prop passed to `AchievementBadge`?
3. Check unlock timestamp: `console.log(achievement.unlockedAt)`

---

## 🎨 Visual Customization

### Change Badge Colors

```tsx
// In AchievementUnlockModal.tsx
const rarityColors = {
  common: 'from-blue-400 to-blue-600',     // Change to your colors
  uncommon: 'from-green-400 to-green-600', // Custom green
  rare: 'from-purple-400 to-purple-600',   // Custom purple
  // ...
};
```

### Change Background Gradients

```tsx
const categoryBackgrounds = {
  starter: 'from-indigo-50/80 to-purple-50/80',  // Custom gradient
  era_themed: 'from-rose-50/80 to-pink-50/80',   // Custom gradient
  // ...
};
```

### Change Confetti Colors

```tsx
const confettiColors = {
  starter: ['#FF0000', '#00FF00', '#0000FF'],    // RGB
  era_themed: ['#FF1493', '#FFD700'],            // Pink/Gold
  // ...
};
```

---

## 📊 Analytics Integration

### Track Unlock Events

```tsx
// In AchievementUnlockManager.tsx or useAchievements hook
useEffect(() => {
  if (currentUnlock) {
    // Send to analytics
    analytics.track('Achievement Unlocked', {
      achievementId: currentUnlock.id,
      title: currentUnlock.title,
      category: currentUnlock.category,
      rarity: currentUnlock.rarity,
      points: currentUnlock.rewards.points
    });
  }
}, [currentUnlock]);
```

### Track Share Events

```tsx
// In handleShare function
const handleShare = () => {
  // ... existing share code ...
  
  analytics.track('Achievement Shared', {
    achievementId: achievement.id,
    platform: navigator.share ? 'native' : 'clipboard'
  });
};
```

---

## 🚦 Performance Tips

### Reduce Confetti Particles on Low-End Devices

```tsx
const isMobile = window.innerWidth < 768;
const particleCount = isMobile ? 40 : 80; // Half on mobile

confetti({
  particleCount,
  // ... other options
});
```

### Throttle Animation Frame Rate

```tsx
// Reduce to 30fps on low battery
const isLowBattery = navigator.getBattery?.().then(b => b.level < 0.2);

if (isLowBattery) {
  // Use CSS animations instead of Motion
  // Reduce confetti particles
  // Disable haptic
}
```

---

## ✅ Quick Checklist

**Setup:**
- [ ] Added `AchievementUnlockManager` to app root
- [ ] Imported `useAchievements` hook where needed
- [ ] Verified user authentication works

**Features:**
- [ ] Unlock modal appears on achievement unlock
- [ ] Sound plays (tier-appropriate)
- [ ] Haptic feedback works (mobile)
- [ ] "New" badge appears on dashboard
- [ ] Share button works
- [ ] Confetti animation plays

**Testing:**
- [ ] Created first capsule → A001 unlocks
- [ ] Uploaded media → A004/A005/A006 unlock
- [ ] Used filters → B001-B004 progress
- [ ] Tested on mobile device
- [ ] Tested in dark mode

---

## 🎯 Next Steps

1. **Customize colors** to match your brand
2. **Add analytics** to track engagement
3. **Test all 25 achievements** systematically
4. **Gather user feedback** on animation timing
5. **Monitor performance** on various devices

---

## 📚 Additional Resources

- **Full Implementation Guide:** `/ACHIEVEMENT_UNLOCK_FLOW_IMPLEMENTATION.md`
- **Visual Comparison:** `/ACHIEVEMENT_UNLOCK_VISUAL_COMPARISON.md`
- **Achievement List:** `/ACHIEVEMENT_SYSTEM_V2_COMPLETE.md`
- **Tracking Guide:** `/ACHIEVEMENT_TRACKING_GUIDE.md`
- **Progression Map:** `/ACHIEVEMENT_PROGRESSION_MAP.md`

---

**Need Help?**

Check the console logs:
```
🏆 [Route] POST /achievements/track
[Stats] Updating user stats for user_123
[Achievements] Checking achievements for user user_123
✅ [Route] Returning 1 newly unlocked achievements
```

The system logs every step, making debugging straightforward.

---

**Status:** ✅ Ready to Use  
**Complexity:** Low  
**Setup Time:** < 5 minutes  
**Dependencies:** All included  

Enjoy your new achievement unlock flow! 🎉
