# Vault Mobile "MOVE TO" UI Update Fix

## Problem
On mobile, when using the "MOVE TO" button in the Vault to move media between folders, the media would successfully move in the backend, but the UI wouldn't reflect the change. Users had to manually navigate to the destination folder to see that the move worked. On desktop, this worked fine.

## Root Cause
Two issues caused this problem:

1. **Non-reactive `displayedItems`**: The `displayedItems` variable was computed as a constant, not a reactive value. When `loadFolders()` was called after a move operation and updated the `folders` state, the component didn't re-compute which items to display.

2. **Stale `mobileOpenFolder` state**: When viewing a folder on mobile via FolderOverlay, the `mobileOpenFolder` state object contained a snapshot of the folder data. After moving items, even though the `folders` array was updated, `mobileOpenFolder` still had the old `mediaIds` array, causing the overlay to show stale data.

## Solution

### Fix 1: Made `displayedItems` reactive with `useMemo`
**File**: `/components/LegacyVault.tsx`

Changed from:
```tsx
const displayedItems = getFilteredAndSortedItems();
```

To:
```tsx
// MOBILE FIX: Make displayedItems reactive so UI updates after MOVE TO operations
const displayedItems = useMemo(() => {
  return getFilteredAndSortedItems();
}, [vaultItems, selectedFolderId, folders, filterBy, debouncedSearchQuery, dateFilter, sortBy]);
```

**Impact**: Now when `loadFolders()` updates the `folders` state after a move operation, React automatically re-computes `displayedItems`, and the UI updates to show the correct items in each folder.

### Fix 2: Auto-update `mobileOpenFolder` when folders change
**File**: `/components/LegacyVault.tsx`

Added a new `useEffect`:
```tsx
// MOBILE FIX: Update mobileOpenFolder when folders change (after MOVE TO operations)
useEffect(() => {
  if (isMobile && mobileOpenFolder) {
    // Find the updated folder from the newly loaded folders
    const updatedFolder = folders.find(f => f.id === mobileOpenFolder.id);
    if (updatedFolder) {
      // Update mobileOpenFolder to reflect the latest mediaIds
      setMobileOpenFolder(updatedFolder);
      console.log('📱 Updated mobile open folder with latest data');
    }
  }
}, [folders, isMobile, mobileOpenFolder?.id]); // Don't include mobileOpenFolder itself to avoid infinite loop
```

**Impact**: When `folders` array is updated (e.g., after a move operation), the `useEffect` automatically finds the updated version of the currently open folder and updates `mobileOpenFolder` state. This ensures the FolderOverlay component receives the latest `mediaIds` and displays the correct items.

## Testing
To verify the fix works:

1. **On mobile**:
   - Open the Vault tab
   - Open a folder
   - Select one or more media items
   - Tap "Move to" and select another folder
   - **Expected**: The items should immediately disappear from the current folder view
   - Navigate to the destination folder
   - **Expected**: The moved items should appear in the destination folder

2. **On desktop**:
   - Same test as above
   - **Expected**: Should continue to work as before (already working)

## Files Modified
- `/components/LegacyVault.tsx`

## Related Systems
- Folder management (Phase 4A-4C)
- Mobile batch operations
- Vault media organization
