# Vault Media Selection Persistence Fix

## 🐛 Problem Summary

When users selected media from vault and added it to a capsule, then reopened the vault:
1. ❌ Vault items showed as **unselected** (no checkmarks)
2. ❌ When closing vault and returning to capsule, **media disappeared**

## 🔍 Root Cause

The issue occurred because of an **ID mismatch** in the vault media tracking system:

### The Flow:
1. User selects vault items with **original vault IDs**:
   - `e47f2429-357c-4d88-92ca-f05288eb2d3d` (video)
   - `d94648a8-5dff-4ebe-9d18-ace4f30ac5ee` (photo)

2. Server-side copy creates **NEW MediaFile IDs**:
   - `d8b6bb14-d4c3-4ca4-8198-6c8e1eadd4aa` (new ID for photo)
   - `b6072b15-9eef-4944-acfc-df7c1bbbf0de` (new ID for video)

3. When user clicks "From Vault":
   - `handleOpenVault` updates `importedVaultMediaIds` with the **NEW IDs**
   - Vault checks against **ORIGINAL IDs** → ❌ No match → Items show as unselected

4. When user closes vault:
   - `workflowMedia` contains items with empty File objects (size 0)
   - Validation fails → Media gets cleared

## ✅ The Fix

**Preserve the original vault ID throughout the entire lifecycle** using a new `vault_id` property.

### Changes Made:

#### 1. **MediaItem Interface** (`CreateCapsule.tsx` line 78-94)
```typescript
interface MediaItem {
  // ... existing properties ...
  vault_id?: string; // 🔥 NEW: Original vault ID for checkbox tracking
}
```

#### 2. **Server-Side Copy** (`CreateCapsule.tsx` line 584-597)
```typescript
const mediaItem: MediaItem = {
  id: serverCopiedMedia.id, // NEW MediaFile ID
  // ... other properties ...
  vault_id: item.vaultMediaId // 🔥 Preserve original vault ID
};
```

#### 3. **Draft Hydration** (`CreateCapsule.tsx` line 1455-1467)
```typescript
restoredMedia.push({
  id: item.id,
  // ... other properties ...
  vault_id: item.vault_id // 🔥 Preserve vault_id from draft
});
```

#### 4. **Vault Checkbox Tracking** (App.tsx line 2279 - Already Implemented!)
```typescript
const vaultId = item.vault_id || item.id;
if (vaultId && item.fromVault) {
  currentImportedIds.add(vaultId);
}
```

## 🎯 How It Works Now

1. ✅ User selects vault media → Original vault IDs tracked
2. ✅ Server-side copy creates new MediaFiles → **Preserves** `vault_id`
3. ✅ User clicks "From Vault" → Uses `vault_id` for tracking
4. ✅ Vault shows checkmarks for selected items (ID match!)
5. ✅ User closes vault → Media persists with correct `vault_id`
6. ✅ Draft saves with `vault_id` → Restored correctly on reload

## 🧪 Testing

**Test Flow:**
1. Go to Vault
2. Select 2+ media items from different folders
3. Press "Use Media"
4. Choose theme → See media in Step 2 ✅
5. Click "From Vault" button
6. **Verify:** Selected items show checkmarks ✅
7. Unselect one item
8. Close vault
9. **Verify:** Remaining item still in capsule ✅
10. Click "From Vault" again
11. **Verify:** Only 1 item selected ✅

## 📊 Technical Details

**Key Insight:** The `vault_id` acts as a **stable identifier** that survives:
- Server-side copying (new MediaFile creation)
- Draft saving/loading
- Workflow transitions (Create → Vault → Create)

**Why This Works:**
- Original vault ID: `e47f2429...` (stored in `vault_id`)
- New MediaFile ID: `d8b6bb14...` (stored in `id`)
- Vault checkbox check: Uses `vault_id` → Matches original ID ✅

## 🔧 Related Files

- `/components/CreateCapsule.tsx` - Media interface, server copy, draft hydration
- `/App.tsx` - `handleOpenVault` (already had vault_id support!)
- `/components/LegacyVault.tsx` - Checkbox rendering (no changes needed)

## 🎉 Result

✅ Vault media selection **persists across navigation**  
✅ Checkmarks show correctly when reopening vault  
✅ Users can **add/remove** vault media seamlessly  
✅ Draft saves preserve all vault metadata
