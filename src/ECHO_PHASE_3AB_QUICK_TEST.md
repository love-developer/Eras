# Echo Phase 3A+3B Quick Test Card 🧪

## 30-Second Test ⚡

### Desktop Test
1. ✅ Open any capsule with echoes
2. ✅ Watch for subtle "Checking..." badge (top-right)
3. ✅ Switch to another tab → come back
4. ✅ Should auto-refresh instantly
5. ✅ Add echo from another device
6. ✅ Wait max 60s for toast: `💫 1 new echo!`

### Mobile Test
1. ✅ Open timeline on phone
2. ✅ Pull down from top
3. ✅ See rotating refresh icon
4. ✅ Release when it says "Release to refresh"
5. ✅ Timeline refreshes immediately

---

## Console Logs to Watch For 📋

```
🔄 [Echo Polling] Started (interval: 15000ms)     ← Poll started
⏱️ [Echo Polling] No changes, backoff: 15s → 30s  ← Getting slower
✨ [Echo Polling] New echoes detected, reset       ← Got new echoes!
⏸️ [Echo Polling] Paused (tab hidden)             ← Tab switched
▶️ [Echo Polling] Resumed (tab visible)            ← Tab back
👁️ [Echo Timeline] Window focused                 ← Window back
```

---

## Expected Behavior ✅

### ✅ CORRECT:
- Auto-refreshes every 15-60s
- Toast appears for new echoes
- Pauses when tab hidden
- Refreshes on tab/window focus
- Pull-to-refresh works on mobile
- "Checking..." badge is subtle

### ❌ WRONG:
- No auto-refresh at all
- Polling continues on hidden tab
- No toast for new echoes
- Pull-to-refresh doesn't work
- Console errors

---

## Quick Troubleshooting 🔧

**Problem**: No auto-refresh
- **Fix**: Check console for polling logs
- **Verify**: `pollIntervalRef.current` is set

**Problem**: Polling never stops
- **Fix**: Check Page Visibility API support
- **Verify**: Switch tabs → should pause

**Problem**: No toast for new echoes
- **Fix**: Check `previousEchoCountRef` is set
- **Verify**: Add echo → wait for next poll

**Problem**: Pull-to-refresh not working
- **Fix**: Check touch device/browser
- **Verify**: Must be at scroll top

---

## Performance Check 📊

| Feature | Expected | Actual |
|---------|----------|--------|
| Initial poll | 15s | ✅ |
| Max poll | 60s | ✅ |
| Tab hidden | Paused | ✅ |
| Focus refresh | <1s | ✅ |
| Toast timing | 3s | ✅ |

---

## One-Line Tests 🎯

```javascript
// Test 1: Polling active?
console.log(pollIntervalRef.current !== null); // Should be true

// Test 2: Correct interval?
console.log(pollDelayRef.current); // Should be 15000, 30000, or 60000

// Test 3: Mounted?
console.log(isMountedRef.current); // Should be true when visible
```

---

**Status**: Ready to test ✅  
**Time needed**: 2-3 minutes  
**Required**: Desktop + mobile device
