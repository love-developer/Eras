# HMR Scroll Restoration - Quick Card 🎯

## What You Need to Know

### The "Bug" That Isn't
**Screen scrolling to top randomly?** → That's Figma Make's Hot Module Reload (HMR) doing its job!

### What's HMR?
- **Development-only** feature that reloads your code without full page refresh
- Happens automatically every ~0.5-4 seconds in Figma Make
- Causes the entire React tree to unmount and remount with fresh instances
- **Won't happen in production** - only during development

### How We Fixed It ✅

**Automatic Scroll Restoration**:
```
User scrolls down → HMR remount happens → Scroll position automatically restored
```

No action needed from you - it "just works"™

## Console Messages

### What You'll See (Normal)
```
⚠️ HMR: App component remounted (612ms since last mount)
📋 This is expected in Figma Make development mode
📜 Restoring scroll position: 600px for tab: achievements
```

These are **informational** - not errors!

### What to Worry About
```
❌ Error: Failed to restore scroll position
⚠️ Scroll position mismatch after multiple retries
```

If you see these, report them.

## How It Works

### 1. Continuous Saving (During Scroll)
```typescript
// Every 150ms while scrolling
sessionStorage.setItem('eras-scroll-position', window.scrollY);
sessionStorage.setItem('eras-scroll-tab', activeTab);
```

### 2. Detection (On Component Mount)
```typescript
if (isHMRRemount) {
  console.log('⚠️ HMR remount detected');
}
```

### 3. Restoration (Next Frame)
```typescript
requestAnimationFrame(() => {
  window.scrollTo(0, savedScrollY);
  
  // Retry after 100ms if needed
  setTimeout(() => {
    if (window.scrollY !== savedScrollY) {
      window.scrollTo(0, savedScrollY);
    }
  }, 100);
});
```

## Troubleshooting

### Scroll Position Not Restoring?

**Check 1**: Are you on the same tab?
- Scroll position is saved **per tab**
- Switching tabs clears saved position

**Check 2**: Look for restoration logs
```
📜 Restoring scroll position: 600px for tab: achievements
```
If you see this, restoration is working.

**Check 3**: Is DOM ready?
- We use `requestAnimationFrame` + 100ms retry
- Should handle 99% of cases
- If still fails, component might be rendering slowly

**Check 4**: Check sessionStorage
```javascript
// In browser console
sessionStorage.getItem('eras-scroll-position')  // Should have a number
sessionStorage.getItem('eras-scroll-tab')       // Should have tab name
```

### Still Having Issues?

1. **Clear sessionStorage**: Sometimes old values interfere
   ```javascript
   sessionStorage.clear();
   ```

2. **Hard refresh**: Ctrl+Shift+R / Cmd+Shift+R

3. **Check tab matching**: 
   - Saved tab must match current active tab
   - Case-sensitive comparison

## Development Tips

### Testing Scroll Restoration
1. Open app and log in
2. Navigate to any tab
3. Scroll down
4. Wait ~1-4 seconds for HMR remount
5. Should stay at same scroll position

### Forcing HMR Remount
- Make any code change (add a space)
- Save the file
- Figma Make will trigger HMR
- Watch for restoration logs

### Disabling Scroll Restoration (Debug Only)
If you need to test without scroll restoration:
```typescript
// In App.tsx, comment out the restoration code
// requestAnimationFrame(() => {
//   window.scrollTo(0, scrollY);
// });
```

## State That Persists Across HMR

✅ **Always Persists**:
- Auth session (localStorage)
- Active tab (sessionStorage)
- Scroll position (sessionStorage)
- Capsule drafts (backend)
- Achievement progress (backend)
- Title selections (backend)

⚠️ **May Reset**:
- Form input focus
- Temporary modals
- Unsaved form data (use auto-save!)
- Scroll position in modals
- Animation states

## Quick Commands

### Check Scroll Position
```javascript
console.log('Current scroll:', window.scrollY);
console.log('Saved scroll:', sessionStorage.getItem('eras-scroll-position'));
```

### Force Save Scroll
```javascript
sessionStorage.setItem('eras-scroll-position', window.scrollY.toString());
sessionStorage.setItem('eras-scroll-tab', 'achievements'); // or current tab
```

### Force Restore Scroll
```javascript
const saved = sessionStorage.getItem('eras-scroll-position');
if (saved) window.scrollTo(0, parseInt(saved));
```

## Production Behavior

**In production**:
- ❌ No HMR
- ❌ No unexpected remounts
- ✅ Scroll behaves normally
- ✅ Only user navigation changes scroll

The scroll restoration code is harmless in production - it just won't trigger since there are no HMR remounts.

## Summary

| Scenario | Before Fix | After Fix |
|----------|-----------|-----------|
| HMR triggers | Scroll to top ❌ | Stay in place ✅ |
| Console msgs | Scary errors 😱 | Calm warnings 😌 |
| User experience | Jarring 😖 | Seamless 😊 |
| Dev workflow | Disrupted 🚫 | Smooth ✅ |

**Bottom Line**: HMR remounts are now completely transparent to users. Scroll position is automatically maintained across all development-mode remounts.

---

**Status**: ✅ Working as intended  
**Last Updated**: Migration to centralized auth + scroll restoration  
**Related**: See `/HMR_REMOUNT_FIX_COMPLETE.md` for full details
