# 🧪 Vault Import Tracking - Quick Test Guide

## ⚡ 2-Minute Quick Test

### Setup:
1. Make sure you have at least 5 media items in your Vault
2. Navigate to Create tab

### Test Steps:

**Step 1: First Import** ⏱️ 30 seconds
```
1. Click "Vault" button in Create tab
2. Select 2 media items (e.g., Photo A and Photo B)
3. Click "Use Media"
4. ✅ VERIFY: Back in Create tab with 2 media items
```

**Step 2: Check Badges** ⏱️ 30 seconds
```
1. Click "Vault" button again
2. ✅ VERIFY: Photo A has GREEN CHECKMARK badge (top-right)
3. ✅ VERIFY: Photo B has GREEN CHECKMARK badge (top-right)
4. ✅ VERIFY: Other photos have NO badges
5. ✅ VERIFY: Badge is pulsing/animated
```

**Step 3: Duplicate Prevention** ⏱️ 30 seconds
```
1. Select Photo A (already imported)
2. Click "Use Media"
3. ✅ VERIFY: Error toast appears
4. ✅ VERIFY: Message says "already imported"
5. ✅ VERIFY: No duplicate added to capsule
```

**Step 4: Mixed Selection** ⏱️ 30 seconds
```
1. Select Photo A (imported) + Photo C (new)
2. Click "Use Media"
3. ✅ VERIFY: Warning toast appears
4. ✅ VERIFY: Only Photo C is imported
5. ✅ VERIFY: Now have 3 total items (A, B, C)
6. ✅ VERIFY: No duplicate of Photo A
```

---

## ✅ Success Criteria

All 4 steps pass = Feature working perfectly! ✨

---

## 🐛 If Something Fails

### Issue: No green badges showing
**Check:**
- Browser console for errors
- React DevTools → LegacyVault → Props → importedMediaIds
- Should see Set with media IDs

**Fix:** Hard refresh (Ctrl+Shift+R)

### Issue: Badges showing on wrong items
**Check:**
- Console logs for "📌 Tracking imported media ID"
- IDs should match imported items

### Issue: Duplicate prevention not working
**Check:**
- Console logs in handleUseMedia
- Toast messages appearing

### Issue: Badges not visible
**Check:**
- z-index conflicts
- Badge should have z-20
- Try different view modes (2x2, 3x3, 4x4, list)

---

## 📱 Mobile Test (Optional)

1. Open Vault on mobile
2. Import Photo A
3. Return to Vault
4. Open a folder containing Photo A
5. ✅ VERIFY: Badge shows in folder overlay

---

## 🎯 Visual Reference

### What You Should See:

```
VAULT GRID VIEW
┌─────────────┬─────────────┬─────────────┐
│ Photo A  [✓]│ Photo B  [✓]│ Photo C     │
│ [Thumbnail] │ [Thumbnail] │ [Thumbnail] │
│ [□]         │ [□]         │ [□]         │
└─────────────┴─────────────┴─────────────┘
     ↑              ↑
  Imported      Imported
  (green)       (green)
```

### Badge Details:
- **Color:** Green gradient (emerald → teal)
- **Icon:** White checkmark
- **Animation:** Gentle pulsing
- **Position:** Top-right corner
- **Size:** ~28px diameter (desktop), ~20px (mobile)

---

## ✨ Feature Complete!

If all tests pass, the Vault Import Tracking feature is working perfectly.

Users can now:
- ✅ See which media is already imported
- ✅ Avoid accidental duplicates
- ✅ Confidently import more media
- ✅ Create clean, organized capsules
