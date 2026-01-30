# 🐛 Vault Media Flow Bug Diagnosis & Fix Plan

## Issue Summary

**Scenario:** User in Create tab → Add Media → Vault → Picks 2 images from Folder A → Picks 1 video from Folder B → Presses "Use in Capsule"

**Problems:**
1. ❌ Video shows "Retry" on mobile but doesn't load and retry doesn't work
2. ✅ When user goes back to vault to add another video, all 4 media items appear (correct)
3. ✅ BUT now the original video loads correctly (why?)
4. ❌ No Enhance or Remove/Delete buttons visible on mobile for added media

---

## Root Causes

### 🎯 Problem 1: Video "Retry" Button Doesn't Work on Mobile

**Location:** `/components/MediaThumbnail.tsx` lines 270-282

**Current Code:**
```tsx
<div 
  className="... group/retry"
  onClick={(e) => {
    e.stopPropagation();
    generateVideoThumbnail();
  }}
>
  <AlertCircle className="..." />
  <span className="... group-hover/retry:underline">
    Retry
  </span>
</div>
```

**Issue:** 
- The onClick handler IS present and should work
- But `group-hover/retry:underline` requires hover state (desktop only)
- On mobile, user can tap the retry area, but there's no visual feedback
- The real issue is likely that the video URL/blob is not ready yet when MediaThumbnail tries to load it

**Why it fails:**
1. Vault media is selected and passed to CreateCapsule
2. Video blob URL is created in CreateCapsule's `useEffect` (lines 187-410)
3. MediaThumbnail receives the mediaFile but the blob URL might be revoked or not fully ready
4. Video fails to load → shows "Retry"
5. User taps "Retry" → tries to regenerate thumbnail from same broken URL → fails again

---

### 🎯 Problem 2: Video Loads Correctly on Second Vault Visit

**Location:** `/components/CreateCapsule.tsx` lines 187-410 (initialMedia processing)

**Current Flow:**
```
First vault visit:
1. User selects video from vault
2. CreateCapsule receives initialMedia with video blob
3. Creates File object from blob (line 303-310)
4. Creates preview URL with URL.createObjectURL (line 319)
5. Adds to media state
6. MediaThumbnail tries to load video from blob URL
7. FAILS (race condition? blob URL timing issue?)

Second vault visit:
1. User selects another video
2. CreateCapsule processes NEW initialMedia
3. OLD media is still in state (deduplication on line 388)
4. NEW media is added
5. BOTH videos now load correctly
```

**Why it works the second time:**
- The blob URL from the first load is now "settled" and cached
- OR the second processing cycle gives enough time for the first video to become ready
- This suggests an ASYNC TIMING issue with blob URL creation/readiness

---

### 🎯 Problem 3: No Enhance/Remove Buttons on Mobile

**Location:** `/components/CreateCapsule.tsx` lines 1574-1601

**Current Code:**
```tsx
{!isMultiSelectMode && (
  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
    {onEnhance && (item.type === 'image' || item.type === 'video' || item.type === 'audio') && (
      <Button variant="secondary" className="h-8 w-8 p-0 bg-purple-600 hover:bg-purple-700" onClick={(e) => { ... }}>
        <Palette className="h-4 w-4" />
      </Button>
    )}
    <Button variant="destructive" className="h-8 w-8 p-0" onClick={(e) => { ... }}>
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
)}
```

**Issue:**
- `opacity-0 group-hover:opacity-100` = buttons are hidden by default, only show on hover
- Mobile has NO hover state
- Buttons are completely invisible and unusable on mobile

---

## Fix Strategy

### ✅ Fix 1: Make Retry Button Work on Mobile

**Changes needed:**
1. Add visual feedback for mobile taps (active state)
2. Ensure video blob URL is fully loaded before MediaThumbnail tries to use it
3. Add better error handling and logging

### ✅ Fix 2: Fix Video Loading Timing Issue

**Changes needed:**
1. Ensure blob URLs are created and ready before adding media to state
2. Add `onload` event listener to verify video is loadable before creating thumbnail
3. Add retry mechanism with exponential backoff
4. Potentially preload video metadata before adding to media state

### ✅ Fix 3: Show Enhance/Remove Buttons on Mobile

**Options:**

**Option A: Always show buttons on mobile** (RECOMMENDED)
```tsx
<div className={`absolute top-2 right-2 flex gap-1 transition-opacity ${
  isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
}`}>
```

**Option B: Add long-press or tap-to-show menu**
- More complex, but cleaner UI
- Requires state management

**Option C: Use the existing multi-select mode**
- Already works on mobile
- Users must enter multi-select mode first
- Less intuitive for single deletions

**RECOMMENDATION: Option A** - Simple, effective, consistent with mobile UX patterns

---

## Implementation Plan

### Phase 1: Mobile Button Visibility (Immediate Fix)
1. ✅ Detect mobile device
2. ✅ Always show enhance/remove buttons on mobile
3. ✅ Keep hover behavior on desktop

### Phase 2: Video Loading Reliability
1. ✅ Add video preload verification before creating thumbnail
2. ✅ Improve error handling in MediaThumbnail
3. ✅ Add retry with exponential backoff
4. ✅ Better logging for debugging

### Phase 3: Vault-to-Create Media Flow
1. ✅ Ensure blob URLs are stable before adding to media state
2. ✅ Add validation that video is loadable before passing to MediaThumbnail
3. ✅ Consider using data URLs instead of blob URLs for vault media

---

## Testing Checklist

After fixes:
- [ ] Mobile: Add single image from vault → enhance/remove buttons visible
- [ ] Mobile: Add video from vault → video loads correctly (no retry)
- [ ] Mobile: If video fails → retry button tappable and works
- [ ] Mobile: Add media from different folders → all media loads correctly
- [ ] Desktop: Hover behavior still works for enhance/remove buttons
- [ ] Desktop: Video loading still works
- [ ] Both: Multi-select mode still works
- [ ] Both: Media deduplication prevents duplicates
