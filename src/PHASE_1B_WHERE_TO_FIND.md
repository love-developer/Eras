# 📍 PHASE 1B - WHERE TO FIND EACH FEATURE

## Quick Visual Guide

```
HOME SCREEN
├─ Stats Cards (top)
│  └─ Click any card → Opens Dialog
│
└─ Dialog/Overlay (full screen)
   ├─ Header
   │  └─ Title + Close button
   │
   ├─ Search/Filter Toolbar
   │  ├─ Search input
   │  ├─ Media filter dropdown
   │  ├─ Date picker
   │  ├─ Clear filters button
   │  └─ [Grid/List Toggle] ← NEW! (desktop only)
   │
   ├─ Selection Toolbar (if selecting)
   │  ├─ Bulk delete
   │  ├─ Select All/Recent buttons
   │
   ├─ Capsules Area (scrollable)
   │  ├─ [Loading Skeleton] ← NEW! (while loading)
   │  │  └─ 8 cosmic shimmer cards
   │  │
   │  ├─ Capsule Cards Grid/List
   │  │  └─ Each Card:
   │  │     ├─ [⋮ Quick Actions Menu] ← NEW! (top-left, hover to show)
   │  │     │  ├─ View Details
   │  │     │  ├─ Edit Details
   │  │     │  ├─ Enhance
   │  │     │  └─ Delete
   │  │     │
   │  │     ├─ Status icon (center)
   │  │     ├─ Title (Orbitron)
   │  │     ├─ Recipient/Metadata
   │  │     └─ Message preview
   │  │
   │  └─ [Empty State] ← NEW! (when no capsules)
   │     ├─ Twinkling stars
   │     ├─ Gradient icon
   │     ├─ Title (Orbitron)
   │     └─ CTA button
   │
   └─ [Batch Actions Toolbar] ← NEW! (bottom, when selected)
      ├─ Count badge
      ├─ Select All
      ├─ Clear
      ├─ Add to Vault
      ├─ Export
      └─ Delete (X)
```

---

## Feature Locations - Detailed

### 1. Quick Actions Menu (⋮)

**Path**: 
```
Home → Click Status Card → Hover Capsule Card → Top-Left Corner
```

**Exact Location**:
- Top-left corner of each capsule card
- 8x8 rounded button
- Slate-gray background

**States**:
- **Desktop**: Hidden by default, appears on card hover
- **Mobile**: Always visible (no hover state)
- **Selected**: Hidden (checkmark takes priority)
- **Received capsules**: Hidden (can't edit)

**Visual Cues**:
```
┌─────────────────────┐
│ ⋮  [button here]    │ ← Top-left
│                     │
│    [Status Icon]    │
│                     │
│       Title         │
└─────────────────────┘
```

---

### 2. Batch Actions Toolbar

**Path**:
```
Home → Click Status Card → Select Capsules → Bottom of Dialog
```

**Exact Location**:
- Fixed at bottom-center of dialog
- Inside DialogContent (NOT outside on main page!)
- Above dialog bottom edge by ~24px

**States**:
- **Hidden**: When 0 capsules selected
- **Visible**: When 1+ capsules selected
- **Animates**: Slides up from bottom (spring physics)
- **Not shown**: In "Received" tab (can't edit received)

**Visual Cues**:
```
Dialog Overlay:
┌──────────────────────────────┐
│ Header                       │
│ ─────────────────────────── │
│                              │
│ [Capsule Cards]              │
│                              │
│ [More Cards]                 │
│                              │
│ ┌─────────────────────────┐ │ ← Toolbar here
│ │ 3 selected | All | Clear│ │    (bottom-center)
│ │ Vault | Export | Delete  │ │
│ └─────────────────────────┘ │
└──────────────────────────────┘
```

---

### 3. Cosmic Grid Skeleton

**Path**:
```
Home → Click Status Card → (Loading State)
```

**Exact Location**:
- Same position as final capsule grid
- Replaces the grid during loading
- Inside the scrollable area

**States**:
- **Visible**: When `isLoading=true` AND tab is open
- **Hidden**: Once capsules load
- **Duration**: Usually < 500ms (brief flash)

**Visual Cues**:
```
Loading State:
┌─────────┬─────────┬─────────┬─────────┐
│ [....] │ [....] │ [....] │ [....] │
│ [....] │ [....] │ [....] │ [....] │
│ shimmer shimmer shimmer shimmer   │
└─────────┴─────────┴─────────┴─────────┘
         ↑ Shimmer sweeps left→right
```

---

### 4. Enhanced Empty States

**Path**:
```
Home → Click Status Card → (When no capsules match)
```

**Exact Location**:
- Centered in dialog content area
- Replaces the capsule grid
- Max-width container (lg breakpoint)

**Trigger Conditions**:
- **No Capsules**: First-time user, no capsules created
- **No Results**: Search/filter returns 0 results
- **No Status**: Specific status tab has 0 capsules

**Visual Cues**:
```
Empty State:
       ┌──────────────────┐
       │   ✨ ✨ ✨ ✨    │ ← Twinkling stars
       │                  │
       │   🌌 [Icon]      │ ← Gradient circle
       │                  │
       │   No Capsules    │ ← Title (Orbitron)
       │   Yet            │
       │                  │
       │   Description    │
       │   text here      │
       │                  │
       │  [Create CTA]    │ ← Action button
       │   ✨ ✨ ✨ ✨    │
       └──────────────────┘
```

---

### 5. Grid/List View Toggle

**Path**:
```
Home → Click Status Card → Filter Toolbar → Right Side
```

**Exact Location**:
- Filter toolbar (where search/filters are)
- Right side, after Clear Filters button
- Two-button toggle (Grid | List)

**States**:
- **Visible**: Desktop only (>= 640px)
- **Hidden**: Mobile (< 640px)
- **Active**: Button with blue/violet gradient
- **Inactive**: Ghost variant with hover state

**Visual Cues**:
```
Filter Toolbar:
[Search] [Media▼] [Date▼] [Clear] │ [#][≡] │
                                      ↑  ↑
                                   Grid List
                                   (Toggle here)
```

---

## Component Files Reference

### Where the Code Lives

```
/components/
├─ CapsuleCard.tsx
│  └─ Quick Actions Menu (lines ~100-150)
│     - DropdownMenu component
│     - 4 menu items
│     - Conditional rendering based on canEditCapsule
│
├─ BatchActionsToolbar.tsx ✨ NEW FILE
│  └─ Floating toolbar component
│     - Selection count badge
│     - 6 action buttons
│     - Motion spring animation
│
├─ CapsuleGridSkeleton.tsx ✨ NEW FILE
│  └─ Loading skeleton grid
│     - 8 skeleton cards
│     - Shimmer animation
│     - Responsive grid layout
│
├─ CosmicEmptyState.tsx ✨ NEW FILE
│  └─ Empty state variants
│     - 3 types: no-capsules, no-results, no-status
│     - Animated stars
│     - Contextual CTAs
│
└─ Dashboard.tsx (MODIFIED)
   ├─ Line ~370: viewMode state
   ├─ Line ~1230: canEditCapsule function
   ├─ Line ~1470: onEditCapsuleDetails handler
   ├─ Line ~1760: Grid/List toggle buttons
   ├─ Line ~1960: Skeleton integration
   ├─ Line ~2000: CapsuleCard with new props
   ├─ Line ~2080: CosmicEmptyState integration
   └─ Line ~2105: BatchActionsToolbar (inside dialog)
```

---

## CSS Classes Reference

### Quick Actions Menu
```css
/* Button */
.quick-actions-btn {
  h-8 w-8 rounded-full
  bg-slate-900/80 backdrop-blur-sm
  border border-slate-700/50
  hover:bg-slate-800/90
  opacity-0 group-hover:opacity-100
  transition-opacity duration-200
}

/* Dropdown */
.quick-actions-menu {
  w-44 bg-slate-900/95 backdrop-blur-xl
  border-slate-700/50
}
```

### Batch Toolbar
```css
.batch-toolbar {
  bg-slate-900/95 backdrop-blur-xl
  border border-slate-700/50
  rounded-2xl shadow-2xl
  px-4 py-3
}

.batch-toolbar-glow {
  bg-gradient-to-r 
    from-blue-500/20 
    via-violet-500/20 
    to-purple-500/20
  blur-xl
}
```

### Skeleton
```css
.skeleton-card {
  bg-slate-800/70 backdrop-blur-xl
  border-slate-700/50
  animate-pulse
}

.skeleton-shimmer {
  bg-gradient-to-r 
    from-transparent 
    via-slate-700/20 
    to-transparent
  animation: shimmer 2s infinite
}
```

### Empty State
```css
.empty-state-card {
  bg-slate-800/70 backdrop-blur-xl
  border-slate-700/50
  shadow-2xl
  max-w-lg
}

.empty-state-stars {
  /* 20 absolute positioned divs */
  w-1 h-1 bg-white rounded-full
  animate: twinkle 2-4s infinite
}
```

---

## Interactive States

### Quick Actions Menu
| State | Visual | Trigger |
|-------|--------|---------|
| Hidden | No button visible | Default (desktop) |
| Hover | Button fades in | Hover card |
| Open | Dropdown visible | Click button |
| Active | Item highlighted | Hover item |
| Selected | Button hidden | Card selected |

### Batch Toolbar
| State | Visual | Animation |
|-------|--------|-----------|
| Hidden | Not rendered | - |
| Entering | Slide up | Spring (y: 100→0) |
| Active | Floating bar | - |
| Exiting | Slide down | Spring (y: 0→100) |

### Skeleton
| State | Visual | Duration |
|-------|--------|----------|
| Loading | 8 shimmer cards | < 500ms |
| Loaded | Capsule cards | - |

### Empty State
| State | Visual | Animation |
|-------|--------|-----------|
| Entrance | Fade + slide up | 500ms |
| Active | Stars twinkling | Infinite |
| Icon | Scale from 0 | Spring delay 200ms |

---

## Z-Index Hierarchy

```
Layer Stack (bottom → top):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
z-50: Batch Toolbar          ← Highest
z-40: Dialog overlay
z-30: Empty state
z-20: Capsule cards
z-10: Quick actions (when open)
z-0:  Skeleton, background
```

---

## Responsive Breakpoints

### Mobile (< 640px)
- Quick actions: Always visible
- Batch toolbar: Compact labels
- Skeleton: 1 column
- Empty state: Smaller padding
- View toggle: Hidden (always grid)

### Tablet (640px - 1024px)
- Quick actions: Hover to show
- Batch toolbar: Full labels
- Skeleton: 2-3 columns
- Empty state: Full size
- View toggle: Visible

### Desktop (>= 1024px)
- Quick actions: Hover to show
- Batch toolbar: Full labels + spacing
- Skeleton: 3-4 columns
- Empty state: Max-width lg
- View toggle: Visible

---

## Testing Checklist

- [ ] Quick actions appear in top-left corner
- [ ] Batch toolbar appears at bottom of DIALOG (not main page)
- [ ] Skeleton shows briefly when opening tab
- [ ] Empty state centered when no matches
- [ ] View toggle in filter toolbar (desktop)

---

**QUICK TIPS**:
- 🔍 Can't find quick actions? → Hover over a card!
- 🔍 Toolbar on main page? → Check inside the dialog!
- 🔍 No skeleton? → Might be loading too fast (good!)
- 🔍 Wrong empty state? → Check search/filters
- 🔍 No view toggle? → Check screen size (desktop only)

---

**ALL FEATURES ARE INSIDE THE DIALOG/OVERLAY, NOT ON THE MAIN HOME SCREEN!**
