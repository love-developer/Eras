# Vault Media Selection Persistence - FINAL FIX

## 🐛 Problem Summary

**Issue:** After selecting vault media, choosing a theme, and viewing attachments in step 2, when user clicks "From Vault" button to modify their selection, the media disappears after closing the vault and returning to the capsule.

**Symptoms:**
1. ❌ User selects vault media → "Use Media" → works ✅
2. ❌ User selects theme → goes to step 2 → media displays ✅
3. ❌ User clicks "From Vault" → vault opens with items unselected ❌
4. ❌ User closes vault → returns to step 1 (theme selection) ❌
5. ❌ User selects theme again → goes to step 2 → **NO MEDIA** ❌

---

## 🔍 Root Cause Analysis

The issue occurred across **THREE critical failure points**:

### **Failure Point 1: Empty File Objects in Draft**
**Location:** `CreateCapsule.tsx` line 1451

**Problem:**
```typescript
// Creates empty File object (size: 0) for vault items
file = new File([""], item.name, { type: item.type, lastModified: Date.now() });
```

When vault items are saved to draft and later restored, they get empty File objects with `size: 0`.

---

### **Failure Point 2: Validation Rejection**
**Location:** `CreateCapsule.tsx` lines 1010-1026

**Problem:**
```typescript
if (!isExistingItem && !isVaultItemNeedingConversion) {
  if (item.file && item.file.size === 0) {
    throw new Error(`Media item ${index + 1}: Empty file (size: 0)`);
  }
}
```

The validation logic had two skip conditions:
- `isExistingItem` - for editing existing capsules
- `isVaultItemNeedingConversion` - for vault items being converted

**BUT** it was **missing** a third condition:
- `isAlreadyUploadedVaultItem` - for vault items that were already uploaded to server

When CreateCapsule remounted after vault navigation, draft was restored with empty File objects. These items had:
- `fromVault: true` ✅
- `alreadyUploaded: true` ✅
- `file.size: 0` ❌

Since they didn't have `needsConversion: true`, they hit validation and were rejected for having empty files.

---

### **Failure Point 3: Missing Metadata in Draft Cycle**
**Location:** `CreateCapsule.tsx` lines 1501-1508 (save) and 1455-1467 (restore)

**Problem:**

**Draft Save:**
```typescript
mediaFiles: media.map(m => ({
  id: m.id,
  name: m.file.name,
  type: m.file.type,
  size: m.size,
  url: m.url,
  fromVault: m.fromVault
  // ❌ Missing: alreadyUploaded
  // ❌ Missing: vault_id
}))
```

**Draft Restore:**
```typescript
alreadyUploaded: !!item.fromVault || (!!url && url.startsWith('http'))
// ✅ Inferred from fromVault, but...
// ❌ Lost if draft save didn't include it
// ❌ Lost vault_id
```

The draft save/restore cycle wasn't preserving:
1. `alreadyUploaded` flag - needed to skip validation
2. `vault_id` - needed for checkbox tracking in vault

---

## ✅ The Complete Fix

### **Fix 1: Skip Validation for Already-Uploaded Vault Items**
**File:** `CreateCapsule.tsx` lines 1006-1027

```typescript
// Phase 2: Comprehensive validation
// 🔥 FIX: Skip validation for vault items with needsConversion - they'll be validated after async conversion
// 🔥 FIX: Skip validation for already-uploaded vault items - they're already validated on server
const isVaultItemNeedingConversion = item.fromVault && (item as any).needsConversion;
const isAlreadyUploadedVaultItem = item.fromVault && (item as any).alreadyUploaded;

if (!isExistingItem && !isVaultItemNeedingConversion && !isAlreadyUploadedVaultItem) {
  // Run validation checks...
}
```

**What this does:**
- Adds new condition `isAlreadyUploadedVaultItem` to skip validation
- Prevents rejection of vault items that were already uploaded to server
- Allows empty File objects (placeholders) for vault items since they have URLs

---

### **Fix 2: Preserve Vault Metadata in Draft Save**
**File:** `CreateCapsule.tsx` lines 1501-1510

```typescript
mediaFiles: media.map(m => ({
  id: m.id,
  name: m.file.name,
  type: m.file.type || `${m.type}/unknown`,
  size: m.size,
  url: m.url,
  fromVault: m.fromVault,
  alreadyUploaded: m.alreadyUploaded, // 🔥 FIX: Preserve vault upload status
  vault_id: m.vault_id // 🔥 FIX: Preserve original vault ID
}))
```

**What this does:**
- Saves `alreadyUploaded` flag to draft
- Saves `vault_id` (original vault item ID) to draft
- Ensures metadata survives draft save/restore cycle

---

### **Fix 3: Restore Vault Metadata from Draft**
**File:** `CreateCapsule.tsx` lines 1455-1470

```typescript
restoredMedia.push({
  id: item.id || `restored-${Date.now()}-${index}`,
  file: file,
  type: item.type.includes('video') ? 'video' 
      : item.type.includes('audio') ? 'audio' 
      : item.type.includes('application') || item.type.includes('text') ? 'document'
      : 'image',
  mimeType: item.type,
  url: url,
  size: item.size,
  fromVault: item.fromVault,
  alreadyUploaded: item.alreadyUploaded || !!item.fromVault || (!!url && url.startsWith('http')), // 🔥 FIX: Restore alreadyUploaded flag
  vault_id: item.vault_id // 🔥 FIX: Preserve vault_id from draft
});
```

**What this does:**
- Restores `alreadyUploaded` from draft (with fallback inference)
- Restores `vault_id` from draft
- Ensures metadata is available after CreateCapsule remount

---

### **Existing Fix: Server-Side Copy Preserves vault_id**
**File:** `CreateCapsule.tsx` lines 586-598 (already implemented)

```typescript
const mediaItem: MediaItem = {
  id: serverCopiedMedia.id,
  file: file,
  type: item.type as any,
  mimeType: serverCopiedMedia.mimeType,
  url: serverCopiedMedia.url,
  thumbnail: serverCopiedMedia.thumbnail,
  size: serverCopiedMedia.size || 0,
  fromVault: true,
  alreadyUploaded: true,
  uploading: false,
  vault_id: item.vaultMediaId // 🔥 FIX: Preserve original vault ID for checkbox tracking
};
```

**What this does:**
- When server copies vault media, preserves original `vaultMediaId` as `vault_id`
- Ensures checkbox tracking works in vault

---

### **Existing Fix: handleOpenVault Uses vault_id**
**File:** `App.tsx` lines 2277-2284 (already implemented)

```typescript
const currentImportedIds = new Set<string>();
currentMedia.forEach(item => {
  // Check for vault_id (media from vault) or id (media with vault ID tracked)
  const vaultId = item.vault_id || item.id;
  if (vaultId && item.fromVault) {
    currentImportedIds.add(vaultId);
    console.log('📌 Keeping imported media ID:', vaultId);
  }
});
```

**What this does:**
- Uses `vault_id` (if present) for tracking imported vault media
- Falls back to `id` if `vault_id` not present
- Ensures checkboxes show correctly when reopening vault

---

## 🎯 Complete Flow (Fixed)

### **Stage 1: Initial "Use Media"**
1. User selects vault media (`e47f2429...` video, `d94648a8...` photo)
2. Server-side copy creates NEW MediaFile IDs (`d4618ec0...`, `d7f86e5c...`)
3. **Sets `vault_id`** to original vault IDs ✅
4. **Sets `alreadyUploaded: true`** ✅
5. Media displays in capsule ✅

### **Stage 2: User Selects Theme**
1. User selects "gratitude" theme
2. Advances to step 2 (attachments view)
3. Media displays correctly ✅
4. **Draft auto-saves** with `vault_id` and `alreadyUploaded` ✅

### **Stage 3: User Clicks "From Vault"**
1. `handleOpenVault` saves media to workflow
2. Uses `vault_id` to track imported IDs ✅
3. Navigates to vault tab
4. Vault shows checkmarks for selected items ✅

### **Stage 4: User Closes Vault**
1. CreateCapsule **remounts** (component lifecycle)
2. Draft is **restored** with `vault_id` and `alreadyUploaded` ✅
3. `initialMedia` contains items with empty File objects (size 0)
4. Validation runs:
   - Checks `isAlreadyUploadedVaultItem` → **TRUE** ✅
   - **SKIPS validation** ✅
5. Media passes validation ✅
6. Media displays in step 2 ✅

### **Stage 5: User Can Modify Selection**
1. User clicks "From Vault" again
2. Vault shows correct checkboxes ✅
3. User can select/unselect items ✅
4. Changes persist correctly ✅

---

## 🧪 Testing Checklist

- [x] **Fix 1**: Validation skip for already-uploaded vault items
- [x] **Fix 2**: Draft save preserves `alreadyUploaded` and `vault_id`
- [x] **Fix 3**: Draft restore retrieves `alreadyUploaded` and `vault_id`
- [x] **Integration**: Server-side copy sets `vault_id`
- [x] **Integration**: `handleOpenVault` uses `vault_id` for tracking

**Test Scenario:**
1. Go to Vault → Select 2 media items → "Use Media"
2. Select theme → See media in step 2 ✅
3. Click "From Vault" → See checkmarks ✅
4. Close vault → Return to capsule → See media ✅
5. Click "From Vault" again → See checkmarks ✅
6. Unselect 1 item → Close vault → See 1 item in capsule ✅
7. Select different theme → See 1 item persist ✅

---

## 📝 Summary

The fix addresses **three critical points**:

1. **Validation Logic** - Skip validation for already-uploaded vault items
2. **Draft Persistence** - Save/restore `alreadyUploaded` and `vault_id`
3. **ID Tracking** - Use `vault_id` for vault checkbox tracking

All vault media metadata now **survives**:
- ✅ Server-side copy
- ✅ Draft save
- ✅ Component remount
- ✅ Draft restore
- ✅ Validation
- ✅ Display

**Result:** Vault media persists correctly across all navigation and component lifecycle events! 🎉
