# 🧪 Phase 2 Quick Test Guide

## ⚡ 5-Minute Verification Checklist

### Test 1: Video No Longer Auto-Plays ✅
**Time: 30 seconds**

1. Go to **Record** tab
2. Record a video (any length)
3. Press **Stop Recording**

**✅ EXPECTED:**
- Video is **PAUSED** (not playing)
- Large white play button visible in center
- No audio playing automatically

**❌ FAIL IF:**
- Video starts playing automatically
- Audio plays without user action
- No play button visible

---

### Test 2: Enhance Button Works ✅
**Time: 1 minute**

1. Record video → Press Stop
2. Look at button layout

**✅ EXPECTED:**
```
┌─────────────┬─────────────┐
│ Send to     │ Save to     │
│ Capsule     │ Vault       │
└─────────────┴─────────────┘
┌─────────────┬─────────────┐
│ Enhance ✨  │ Retake      │
└─────────────┴─────────────┘
```

3. Click **Enhance** button
4. Verify MediaEnhancementOverlay opens

**✅ EXPECTED:**
- 4 buttons visible (not 3)
- Enhance button has pink/rose gradient
- Clicking opens enhancement overlay
- Can apply filters and use in capsule

---

### Test 3: Loading States Show ✅
**Time: 1 minute**

1. Record video → Enhance → Apply filter
2. Click **"Use in Capsule"**
3. Watch for toasts

**✅ EXPECTED:**
```
[Toast 1] "Preparing media for capsule..." (loading)
  ↓
[Toast 2] "Media ready for capsule!" (success)
  ↓
[Navigate to Create tab]
  ↓
[Toast 3] "Processing 1 media file..." (loading)
  ↓
[Toast 4] "1 media file added to capsule!" (success)
```

**❌ FAIL IF:**
- No loading toasts appear
- Silent processing (no feedback)
- Success toast doesn't show

---

### Test 4: Error Messages Are Clear ✅
**Time: 1 minute**

**Test with Console:**

1. Open browser console (F12)
2. Record any media
3. Watch console logs for validation

**✅ EXPECTED IN CONSOLE:**
```
✅ Blob validation passed: { size: "X.XX MB", type: "video/webm" }
✅ Converted to File object: { fileName: "...", fileSize: ... }
✅ Media handoff complete, navigating to Create tab
📥 Processing initialMedia from workflow: { count: 1, items: [...] }
✅ Media item 1 validation passed: { size: "X.XX MB" }
✅ Processed initialMedia item: { id: "...", fileName: "..." }
✅ Added 1 media items from initialMedia to capsule
```

**❌ FAIL IF:**
- No validation logs
- Silent errors
- Generic error messages only

---

### Test 5: Manual Video Playback ✅
**Time: 1 minute**

1. Record video → Press Stop
2. See paused video with play button
3. Click **Play button** (center of screen)

**✅ EXPECTED:**
- Video starts playing
- Play button disappears
- Video controls work (pause, seek, volume)
- Can pause and replay as needed

4. Click video controls → Pause
5. Play button reappears

**❌ FAIL IF:**
- Can't manually start video
- Play button doesn't disappear when playing
- Controls don't work properly

---

### Test 6: Multiple Files Validation ✅
**Time: 1.5 minutes**

**Test Scenario:** Record 2 videos and send both

1. Record video 1 → Send to Capsule
2. Return to Record tab
3. Record video 2 → Enhance → Apply filter
4. Use in Capsule

**✅ EXPECTED:**
```
[Toast] "Processing 2 media files..."
  ↓
[Toast] "2 media files added to capsule!"
  ↓
Create tab shows BOTH videos
```

**IN CONSOLE:**
```
📥 Processing initialMedia from workflow: { count: 2 }
✅ Media item 1 validation passed
✅ Media item 2 validation passed
✅ Added 2 media items from initialMedia to capsule
```

**❌ FAIL IF:**
- Only 1 video appears
- No validation logs for both files
- Error with multiple files

---

## 🎯 Quick Pass/Fail Summary

| Test | Feature | Expected | Pass/Fail |
|------|---------|----------|-----------|
| 1 | Video Auto-Play | PAUSED by default | ☐ |
| 2 | Enhance Button | 4-button layout visible | ☐ |
| 3 | Loading States | Toast appears during processing | ☐ |
| 4 | Error Messages | Specific console logs | ☐ |
| 5 | Manual Playback | Play button works | ☐ |
| 6 | Multi-File | Both videos validate and appear | ☐ |

---

## 🐛 Common Issues & Fixes

### Issue: Video still auto-plays
**Cause:** Browser cached old version  
**Fix:** Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: No loading toasts
**Cause:** Toast library not initialized  
**Fix:** Check for `toast.loading()` in code

### Issue: Enhance button missing
**Cause:** `onEnhance` prop not passed  
**Fix:** Verify RecordInterface passes `onEnhance={handleEnhance}` to RecordingModal

### Issue: No console logs
**Cause:** Console filtering active  
**Fix:** Set console filter to "All levels" (not just errors)

---

## ✅ All Tests Pass?

If all 6 tests pass:
- ✅ **Phase 2 is production ready**
- ✅ No auto-replay issue
- ✅ Loading states work
- ✅ Validation working
- ✅ Error handling comprehensive

If any test fails:
- Check browser console for errors
- Verify hard refresh was done
- Review specific fix above
- Check files were saved correctly

---

## 📊 Visual Checklist

### Recording Modal Should Look Like:
```
╔════════════════════════════════════╗
║                                    ║
║     [VIDEO PAUSED WITH LARGE       ║
║      WHITE PLAY BUTTON ▶]          ║
║                                    ║
╠════════════════════════════════════╣
║  ┌──────────────┬──────────────┐  ║
║  │ Send to      │ Save to      │  ║
║  │ Capsule      │ Vault        │  ║
║  │ (Emerald)    │ (Purple)     │  ║
║  └──────────────┴──────────────┘  ║
║  ┌──────────────┬──────────────┐  ║
║  │ Enhance ✨   │ Retake       │  ║
║  │ (Pink)       │ (Gray)       │  ║
║  └──────────────┴──────────────┘  ║
╚════════════════════════════════════╝
```

### Toast Sequence Should Be:
```
1. "Preparing media for capsule..." 
   (spinner icon, blue background)

2. "Media ready for capsule!" 
   (checkmark icon, green background)

3. "Processing 1 media file..." 
   (spinner icon, blue background)

4. "1 media file added to capsule!" 
   (checkmark icon, green background)
```

---

**Total Test Time: ~5 minutes**  
**All tests passing = Phase 2 Complete ✅**
