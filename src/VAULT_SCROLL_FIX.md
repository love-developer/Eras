# Vault Folder Exit Scroll Fix

## 🐛 Problem

When users exited a folder in the vault, they were taken back to the **bottom of the vault page** instead of the **top**, making it disorienting and requiring manual scrolling to see their folders.

---

## 🔍 Root Cause

**Location:** `/components/LegacyVault.tsx` line 5255-5258

The `onClose` handler for the `FolderOverlay` component was closing the folder overlay but **not resetting the scroll position**.

**Original Code:**
```typescript
onClose={() => {
  setMobileOpenFolder(null);
  setPreviousFolder(null);
}}
```

When the folder closed, the scroll position remained wherever the user was scrolling inside the folder (often at the bottom if they scrolled through media).

---

## ✅ Fix Applied

**Change:**
```typescript
onClose={() => {
  setMobileOpenFolder(null);
  setPreviousFolder(null);
  // 🔥 FIX: Scroll to top when exiting folder
  window.scrollTo({ top: 0, behavior: 'smooth' });
}}
```

**What this does:**
- Adds `window.scrollTo({ top: 0, behavior: 'smooth' })` after clearing folder state
- Smoothly scrolls the vault page back to the top
- User sees their folder grid immediately upon closing a folder

---

## 🎯 Result

**Before:**
- ❌ User closes folder → lands at bottom of vault page
- ❌ Must manually scroll up to see folders
- ❌ Disorienting UX

**After:**
- ✅ User closes folder → smoothly scrolls to top
- ✅ Folder grid immediately visible
- ✅ Clean, expected navigation behavior

---

## 📄 Files Modified

- `/components/LegacyVault.tsx` (line 5259) - Added scroll-to-top on folder close
- `/VAULT_SCROLL_FIX.md` - This documentation

---

## 🧪 Test Scenario

1. Open vault
2. Click on a folder
3. Scroll down inside the folder to view media
4. Click back/close button
5. ✅ **Vault page smoothly scrolls to top**
6. ✅ **Folder grid is immediately visible**

---

**Result: Folder navigation is now smooth and intuitive!** 🎉
