# Legacy Vault: Complete Drag & Drop and Preview Modal Fix

## Issues Identified and Resolved

### Issue #1: Drag and Drop Not Working ✅
**Symptoms**: Files weren't moving into folders when dragged; they stayed in place
**Root Causes**:
1. **Drag wrapper blocking clicks**: The `DraggableWrapper` component was wrapping the entire Card, causing react-dnd to intercept ALL mouse events
2. **No folder filtering**: The `getFilteredAndSortedItems()` function wasn't filtering items based on `selectedFolderId`, so moved items remained visible in all views

**Solutions**:
1. **Removed DraggableWrapper**: Instead of wrapping the entire Card in a draggable div, we now apply the `drag` ref directly to the info section (bottom part of each card)
2. **Added folder filtering**: Updated `getFilteredAndSortedItems()` to:
   - When a folder is selected: Show only items in that folder's `mediaIds` array
   - When no folder is selected (Unsorted view): Show only items NOT in any folder
3. **Fixed auto-organize**: Updated `autoOrganizeByType()` to correctly identify unsorted media by checking against all folder `mediaIds`

### Issue #2: Media Preview Modal Not Opening ✅
**Symptoms**: Clicking on media items didn't open the preview modal
**Root Cause**: The `DraggableWrapper` div with the `drag` ref was intercepting all clicks within the Card, preventing the preview modal's onClick handler from firing

**Solution**: By moving the drag ref to only the info section and removing the wrapper, clicks on the media preview area now work correctly

## Technical Implementation

### New Drag Handle Approach
```jsx
// Old approach - WRONG (blocked all clicks)
<DraggableWrapper>
  <Card>
    <MediaPreview onClick={openModal} /> {/* ❌ Click blocked */}
    <InfoSection />
  </Card>
</DraggableWrapper>

// New approach - CORRECT
const [{ isDragging }, drag] = useDrag(...)
<Card opacity={isDragging ? 0.4 : 1}>
  <MediaPreview onClick={openModal} /> {/* ✅ Click works! */}
  <InfoSection ref={drag} /> {/* ✅ Drag handle here */}
</Card>
```

### Folder Filtering Logic
```jsx
const getFilteredAndSortedItems = (): LibraryItem[] => {
  let filtered = vaultItems;

  // Apply folder filter FIRST
  if (selectedFolderId) {
    // Show only items in the selected folder
    const selectedFolder = folders.find(f => f.id === selectedFolderId);
    const folderMediaIds = selectedFolder?.mediaIds || [];
    filtered = filtered.filter(item => folderMediaIds.includes(item.id));
  } else {
    // Show only items NOT in any folder (unsorted)
    const allFolderMediaIds = folders.flatMap(f => f.mediaIds || []);
    filtered = filtered.filter(item => !allFolderMediaIds.includes(item.id));
  }

  // Then apply type filter and sorting...
}
```

## User Experience

### Desktop Drag & Drop
- **Drag Handle**: Grab the info section at the bottom of any media card
- **Visual Feedback**: 
  - Cursor changes to "grab" when hovering over the info section
  - Item becomes 40% opacity while dragging
  - Folders highlight with green glow when hovering with a dragged item
- **Drop Zones**: Drop onto any folder or the "Unsorted" card
- **Immediate Update**: Items disappear from current view and appear in the target folder

### Media Preview
- **Click Area**: Click anywhere on the main media preview (image/video/audio visualization)
- **Opens Modal**: Shows full-size preview with playback controls
- **No Interference**: Clicking the preview does NOT toggle selection or start a drag

### Selection
- **Checkbox**: Click the checkbox in the corner to toggle selection
- **Info Section**: Click (not drag) the info section to toggle selection
- **Multiple Selection**: Use checkboxes or info sections to build up a selection set

## Code Changes Summary

### 1. Removed DraggableWrapper Component
**File**: `/components/LegacyVault.tsx`
```diff
- const DraggableWrapper = ({ children }) => {
-   const [{ isDragging }, drag] = useDrag(...)
-   return <div ref={drag}>{children}</div>
- }

+ const [{ isDragging }, drag] = useDrag(...)
```

### 2. Applied drag ref to info sections
```diff
- <div className="info-section">
+ <div ref={!isMobile ? drag : undefined} 
+      className="info-section cursor-grab active:cursor-grabbing">
```

### 3. Updated Card opacity
```diff
- <Card style={{ zIndex: ..., cursor: 'grab' }}>
+ <Card style={{ zIndex: ..., opacity: isDragging ? 0.4 : 1 }}>
```

### 4. Fixed folder filtering
```diff
  const getFilteredAndSortedItems = (): LibraryItem[] => {
    let filtered = vaultItems;
+   
+   // Apply folder filter first
+   if (selectedFolderId) {
+     const selectedFolder = folders.find(f => f.id === selectedFolderId);
+     filtered = filtered.filter(item => selectedFolder?.mediaIds?.includes(item.id));
+   } else {
+     const allFolderMediaIds = folders.flatMap(f => f.mediaIds || []);
+     filtered = filtered.filter(item => !allFolderMediaIds.includes(item.id));
+   }
    
    // Apply type filter...
  }
```

### 5. Fixed auto-organize
```diff
  const autoOrganizeByType = async () => {
-   const unsortedMedia = vaultItems.filter(item => !item.folderId);
+   const allFolderMediaIds = folders.flatMap(f => f.mediaIds || []);
+   const unsortedMedia = vaultItems.filter(item => !allFolderMediaIds.includes(item.id));
  }
```

## Testing Checklist ✅

- [x] Drag media item by grabbing info section (desktop)
- [x] Drop media item onto folder
- [x] Drop media item onto "Unsorted" zone
- [x] Click media preview opens modal
- [x] Click checkbox toggles selection
- [x] Click info section toggles selection (without dragging)
- [x] Items disappear from view after moving to folder
- [x] Items appear in target folder view when selected
- [x] Auto-organize correctly identifies unsorted items
- [x] Cursor changes to "grab" over drag handle
- [x] Visual feedback during drag (40% opacity)

## Key Insights

1. **react-dnd intercepts ALL mouse events** on elements with the `drag` ref, making clicks unreliable
2. **Drag handles are the solution**: Only apply the drag ref to a specific drag handle area, not the entire element
3. **Folder data structure**: Items don't have a `folderId` property; instead, folders have a `mediaIds` array
4. **Filtering is essential**: Without filtering by folder, moved items appear to not move because they're still visible
5. **Event propagation**: Use `e.stopPropagation()` on all interactive sub-elements to prevent unwanted parent handlers from firing

## Status: ✅ COMPLETE

Both drag-and-drop functionality and media preview modal are now working correctly with proper folder filtering!
