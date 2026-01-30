# Vault Media Persistence Fix - Complete Solution

## 🐛 Problem Summary

Users experienced media disappearing when:
1. Selecting vault media → "Use Media" → Choose theme → Go to step 2 (attachments visible ✅)
2. Click "From Vault" again → Close vault → Return to capsule
3. **Result**: Attachments gone ❌, user taken back to step 1

## 🔍 Root Cause Analysis

### The Complete Problem Chain:

#### Stage 1: Initial Flow (Working)
1. User selects vault media (IDs: `e47f2429...`, `d94648a8...`)
2. Server-side copy creates NEW MediaFile IDs with `vault_id` preserved
3. Media displays correctly in capsule ✅

#### Stage 2: "From Vault" Navigation (Working)
1. User at step 2 (attachments), clicks "From Vault"
2. `handleOpenVault` correctly tracks original vault IDs ✅
3. Vault opens with correct checkmarks ✅

#### Stage 3: Return from Vault (FAILING)
1. CreateCapsule unmounts when navigating to vault
2. Draft auto-saves current media state
3. **PROBLEM**: Draft saves empty File objects (size 0) for vault items
4. When returning, CreateCapsule remounts
5. Draft is hydrated with these empty File objects
6. Validation at lines 1006-1026 checks file size
7. **REJECTION**: Items with size 0 fail validation
8. All media cleared → User sees empty attachments

### Specific Code Issues:

**Issue 1: Draft Save Missing Critical Properties**
```typescript
// OLD CODE (lines 1501-1508)
mediaFiles: media.map(m => ({
  id: m.id,
  name: m.file.name,
  type: m.file.type || `${m.type}/unknown`,
  size: m.size,
  url: m.url,
  fromVault: m.fromVault
  // ❌ Missing: alreadyUploaded, vault_id
}))
```

**Issue 2: Validation Rejecting Already-Uploaded Items**
```typescript
// OLD CODE (lines 1006-1026)
const isVaultItemNeedingConversion = item.fromVault && item.needsConversion;

if (!isExistingItem && !isVaultItemNeedingConversion) {
  // Checks file size - FAILS for empty File placeholders
  if (item.file && item.file.size === 0) {
    throw new Error(`Media item ${index + 1}: Empty file (size: 0)`);
  }
}
```

**Issue 3: Empty File Objects in Draft Hydration**
```typescript
// Line 1451
// Remote URL (Vault) - Create a dummy file object
file = new File([""], item.name, { type: item.type, lastModified: Date.now() });
// ❌ This creates size = 0, which fails validation later
```

## ✅ The Complete Fix

### Fix 1: Preserve Vault Metadata in Draft Save

**Location**: Lines 1501-1508 AND 1630-1635

**Manual Save** (used when clicking "From Vault"):
```typescript
mediaFiles: media.map(m => ({
  id: m.id,
  name: m.file.name,
  type: m.file.type || `${m.type}/unknown`,
  size: m.size,
  url: m.url,
  fromVault: m.fromVault,
  alreadyUploaded: m.alreadyUploaded, // 🔥 FIX: Preserve upload status
  vault_id: m.vault_id // 🔥 FIX: Preserve original vault ID
}))
```

**Auto-Save** (periodic background saves):
```typescript
mediaFiles: media.map(m => ({
  id: m.id, // 🔥 FIX: Added id
  name: m.file.name,
  type: m.file.type || `${m.type}/unknown`,
  size: m.size,
  url: m.url,
  fromVault: m.fromVault, // 🔥 FIX: Added fromVault
  alreadyUploaded: m.alreadyUploaded, // 🔥 FIX: Preserve upload status
  vault_id: m.vault_id // 🔥 FIX: Preserve original vault ID
}))
```

### Fix 2: Restore Metadata from Draft

**Location**: Line 1466

```typescript
// OLD
alreadyUploaded: !!item.fromVault || (!!url && url.startsWith('http')),

// NEW
alreadyUploaded: item.alreadyUploaded !== undefined 
  ? item.alreadyUploaded 
  : (!!item.fromVault || (!!url && url.startsWith('http'))),
```

**Why**: Use the saved `alreadyUploaded` value from draft if available, otherwise fall back to inference.

### Fix 3: Skip Validation for Already-Uploaded Items

**Location**: Lines 1006-1012

```typescript
// Phase 2: Comprehensive validation
const isVaultItemNeedingConversion = item.fromVault && item.needsConversion;
const isAlreadyUploadedItem = item.alreadyUploaded === true; // 🔥 NEW

if (!isExistingItem && !isVaultItemNeedingConversion && !isAlreadyUploadedItem) {
  // Validation logic...
  if (item.file && item.file.size === 0) {
    throw new Error(`Media item ${index + 1}: Empty file (size: 0)`);
  }
}
```

**Why**: Items that are `alreadyUploaded` don't need validation because they're already in storage. Empty File objects are just placeholders for the URL reference.

## 🔄 How It Works Now

### Complete Flow:

1. ✅ User selects vault media → Server copies with `vault_id` preserved
2. ✅ Media appears in capsule with `alreadyUploaded: true`
3. ✅ User clicks "From Vault" → Draft saves with `alreadyUploaded` and `vault_id`
4. ✅ CreateCapsule unmounts → Draft persisted
5. ✅ Vault opens → Checkmarks show correctly (using `vault_id`)
6. ✅ User closes vault → CreateCapsule remounts
7. ✅ Draft loads → Restores `alreadyUploaded` and `vault_id`
8. ✅ Validation sees `alreadyUploaded: true` → **SKIPS size check**
9. ✅ Media persists → Attachments still visible!

### Key Insight:

The fix recognizes that **already-uploaded vault items don't need file size validation** because:
- They're already in Supabase Storage
- The File object is just a placeholder for metadata
- The actual media is referenced by URL
- Size validation is only needed for NEW uploads

## 🧪 Testing Scenarios

### Scenario 1: Basic Vault Media Flow
1. Select 2 vault items → "Use Media" → Choose theme
2. **Verify**: Step 2 shows 2 attachments ✅
3. Click "From Vault"
4. **Verify**: Vault shows 2 items with checkmarks ✅
5. Close vault
6. **Verify**: Step 2 still shows 2 attachments ✅

### Scenario 2: Add/Remove Media
1. Select 2 vault items → "Use Media" → Choose theme → Step 2
2. Click "From Vault" → Unselect 1 item → Select 1 different item → "Use Media"
3. **Verify**: Step 2 shows 2 attachments (1 old + 1 new) ✅

### Scenario 3: Draft Persistence
1. Select vault items → "Use Media" → Choose theme → Step 2
2. Refresh browser (force draft load)
3. **Verify**: Attachments still present ✅

### Scenario 4: Multiple Vault Visits
1. Vault → Select items → Use → Theme → Step 2
2. "From Vault" → Close → **Verify**: Items persist ✅
3. "From Vault" again → Close → **Verify**: Items still persist ✅
4. Repeat multiple times → **Verify**: No data loss ✅

## 📊 Safety Guarantees

### What This Fix Does NOT Break:

1. ✅ **New uploads**: Non-vault media still goes through full validation
2. ✅ **Vault items needing conversion**: Skip validation correctly
3. ✅ **Existing capsule edits**: `alreadyUploaded` flag works for edit mode
4. ✅ **File size limits**: 500MB check still applies (line 1029)
5. ✅ **Empty new files**: Still get rejected if not already uploaded

### Additional Safety Checks:

```typescript
// Validation only skipped when ALL conditions met:
- Item is marked `alreadyUploaded: true`
- OR item is `fromVault` with `needsConversion`
- OR item is from `editingCapsule` (isExistingItem)

// New uploads WITHOUT these flags still get full validation
```

## 🎯 Related Files Modified

1. `/components/CreateCapsule.tsx` - 3 changes:
   - Lines 1501-1508: Manual draft save
   - Lines 1630-1638: Auto-save draft
   - Line 1466: Draft restore
   - Lines 1006-1012: Validation skip logic

## 🔗 Related Issues Fixed

- ✅ Empty file errors when returning from vault
- ✅ Media disappearing after vault navigation
- ✅ User forced back to theme selection
- ✅ Lost work when navigating between vault and create
- ✅ Draft not preserving vault item metadata

## 🎉 Result

Users can now seamlessly:
- Select vault media → Choose theme → View attachments ✅
- Click "From Vault" multiple times → Media persists ✅
- Add/remove vault items → Changes reflected correctly ✅
- Refresh browser → Draft restores perfectly ✅
- Complete entire capsule creation without data loss ✅
