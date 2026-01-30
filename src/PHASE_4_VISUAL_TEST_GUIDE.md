# 🎨 **PHASE 4: VISUAL TEST GUIDE**

## ⚡ **30-SECOND TEST - DRAGGABLE CROP**

1. Open Vault → Select photo
2. Click "Enhance"
3. Visual Tab → Advanced Editing → Crop
4. Click "1:1" aspect ratio
5. **✅ VERIFY:** Crop overlay appears
6. **✅ TRY:** Drag center of crop → Moves entire region
7. **✅ TRY:** Drag any corner handle → Resizes crop
8. **✅ VERIFY:** Badge shows "↔️ Move" or "↗️ Resize"
9. Save as New → Cropped image created!

---

## ⚡ **30-SECOND TEST - TEXT LAYERS**

1. Open Vault → Select photo
2. Click "Enhance"
3. **Overlays Tab** (third tab)
4. **✅ VERIFY:** "Text Layers" section at top
5. Click **"Add Text"** button
6. **✅ VERIFY:** Text appears on photo ("Double-click to edit")
7. **✅ TRY:** Drag text → Moves position
8. **✅ TRY:** Double-click text → Edit prompt
9. **✅ TRY:** Change size/color in panel
10. Save as New → Photo with text created!

---

## 🎯 **WHAT YOU SHOULD SEE**

### **Draggable Crop:**

```
┌────────────────────────────────────────────────┐
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓▓▓▓▓▓┌──────────────────────┐▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓▓▓▓▓▓│ ⚪ <- DRAG ME      ⚪│▓▓▓▓▓▓▓▓▓▓▓▓  │ ← Top corners
│  ▓▓▓▓▓▓│      (resize)        │▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓▓▓▓▓▓│                       │▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓▓▓▓▓▓│    DRAG CENTER TO    │▓▓▓▓▓▓▓▓▓▓▓▓  │ ← Drag center
│  ▓▓▓▓▓▓│        MOVE  ↔️       │▓▓▓▓▓▓▓▓▓▓▓▓  │   to move
│  ▓▓▓▓▓▓│                       │▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓▓▓▓▓▓│ ⚪                  ⚪│▓▓▓▓▓▓▓▓▓▓▓▓  │ ← Bottom corners
│  ▓▓▓▓▓▓│      (resize)        │▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓▓▓▓▓▓└──────────────────────┘▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
└────────────────────────────────────────────────┘
         ↑
   Badge shows drag mode
   "↔️ Move" or "↗️ Resize"
```

**Handle Cursors:**
- **NW (top-left):** ↖ `cursor-nwse-resize`
- **NE (top-right):** ↗ `cursor-nesw-resize`
- **SW (bottom-left):** ↙ `cursor-nesw-resize`
- **SE (bottom-right):** ↘ `cursor-nwse-resize`
- **Center:** ✋ `cursor-move`

---

### **Text Layers Panel:**

```
┌─────────────────────────────────────────┐
│ 📝 Text Layers            [3]  [Add Text]│ ← Header
├─────────────────────────────────────────┤
│ ┌───────────────────────────────────┐   │
│ │ "SUMMER VIBES"          [🗑️]     │   │ ← Layer 1
│ │ 48px • Sans                        │   │   (selected)
│ │ ┌─────────────────────────────┐   │   │
│ │ │ Text: [SUMMER VIBES_____]  │   │   │ ← Edit panel
│ │ │ Font: [Sans ▼] Size: [48]  │   │   │
│ │ │ Color: [🎨] Rotate: 0°     │   │   │
│ │ │ Shadow: ████░░░░ 10px       │   │   │
│ │ │ Outline: ██░░░░░░ 2px       │   │   │
│ │ └─────────────────────────────┘   │   │
│ └───────────────────────────────────┘   │
│ ┌───────────────────────────────────┐   │
│ │ "2023"                   [🗑️]     │   │ ← Layer 2
│ │ 72px • Serif                       │   │
│ └───────────────────────────────────┘   │
│ ┌───────────────────────────────────┐   │
│ │ "Beach Life"            [🗑️]     │   │ ← Layer 3
│ │ 32px • Cursive                     │   │
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

### **Text on Canvas:**

```
┌────────────────────────────────────────────────┐
│                                                 │
│     ╔═══════════════════════════╗              │ ← Text layer
│     ║   SUMMER VIBES            ║              │   with purple
│     ╚═══════════════════════════╝              │   selection ring
│            ↑                                    │
│      [Selected • Drag to move] ← Badge         │
│                                                 │
│                  🖼️                            │ ← Photo
│              PHOTO HERE                         │
│                                                 │
│                                                 │
│                    2023                         │ ← Another text
│                                                 │   (not selected)
│                                                 │
│                                 Beach Life~     │ ← Rotated text
│                                                 │
└────────────────────────────────────────────────┘
```

---

## 🎬 **INTERACTION DEMO**

### **Drag Corner Handle:**

**Before:**
```
┌──────────┐
│  PHOTO   │  100x100px
└──────────┘
```

**Dragging SE Corner:**
```
┌──────────────┐
│  PHOTO       │  ← Expanding
│              │
│          🟣  │  ← Dragging this corner
└──────────────┘
```

**After:**
```
┌──────────────┐
│  PHOTO       │  150x150px
│              │
└──────────────┘
```

---

### **Drag Center:**

**Before:**
```
     ┌────────┐
     │ PHOTO  │
     └────────┘
```

**Dragging:**
```
           ┌────────┐
           │ PHOTO  │  ← Moving entire crop
           └────────┘
```

**After:**
```
                  ┌────────┐
                  │ PHOTO  │
                  └────────┘
```

---

### **Add Text Layer:**

**Step 1: Click "Add Text"**
```
[Add Text] ← Click this
    ↓
Text appears on photo
```

**Step 2: Text Appears**
```
┌────────────────────────┐
│                         │
│  Double-click to edit   │ ← New text (centered)
│                         │
│        PHOTO            │
└────────────────────────┘
```

**Step 3: Drag to Position**
```
┌────────────────────────┐
│  Double-click to edit   │ ← Drag here
│                         │
│        PHOTO            │
└────────────────────────┘
```

**Step 4: Edit Text**
```
Double-click text:
┌─────────────────────┐
│ Edit text:          │
│ [SUMMER 2023_____]  │
│ [OK]    [Cancel]    │
└─────────────────────┘
```

**Final Result:**
```
┌────────────────────────┐
│    SUMMER 2023          │ ← Custom text
│                         │
│        PHOTO            │
└────────────────────────┘
```

---

## 🎨 **VISUAL EFFECTS PREVIEW**

### **Text with Shadow:**
```
   SUMMER
   ▒▒▒▒▒▒  ← Shadow behind
```

### **Text with Outline:**
```
╔═══════════╗
║  SUMMER   ║ ← Outlined text
╚═══════════╝
```

### **Rotated Text:**
```
       S
      U
     M  ← Rotated 45°
    M
   E
  R
```

### **Combined Effects:**
```
   ╔═══════════╗
   ║  SUMMER   ║ ← Outline
   ╚═══════════╝
   ▒▒▒▒▒▒▒▒▒▒▒▒  ← Shadow
```

---

## ✅ **QUICK CHECKLIST**

### **Draggable Crop:**
- [ ] Corner handles visible (white circles with purple border)
- [ ] Corner handles scale on hover
- [ ] Cursor changes on hover (resize arrows)
- [ ] Drag corner → Crop resizes
- [ ] Drag center → Crop moves
- [ ] Badge updates during drag
- [ ] Aspect ratio maintained (when preset selected)
- [ ] Crop stays within image bounds

### **Text Layers:**
- [ ] "Text Layers" section visible in Overlays tab
- [ ] "Add Text" button present (purple-pink gradient)
- [ ] Layer count badge shows "0" initially
- [ ] Click "Add Text" → Text appears on canvas
- [ ] Text has selection ring (purple) when selected
- [ ] Drag text → Position updates
- [ ] Double-click text → Edit prompt appears
- [ ] Edit panel shows when layer selected
- [ ] Font dropdown works
- [ ] Size input works
- [ ] Color picker works
- [ ] Rotation slider works
- [ ] Shadow slider works
- [ ] Outline slider works
- [ ] Delete button removes layer
- [ ] Multiple layers can be added

---

## 🎯 **EXPECTED BEHAVIOR**

### **Crop Drag Scenarios:**

| Action | Expected Result |
|--------|-----------------|
| Click center | Badge: "1:1 • Drag to adjust" |
| Start drag center | Badge: "↔️ Move" |
| Drag center | Crop moves with cursor |
| Release | Crop stays in new position |
| Click corner | Cursor: Resize arrow |
| Start drag corner | Badge: "↗️ Resize" |
| Drag corner | Crop resizes maintaining aspect |
| Drag beyond bounds | Crop stops at edge |

### **Text Drag Scenarios:**

| Action | Expected Result |
|--------|-----------------|
| Click text | Purple selection ring appears |
| Badge shows | "Selected • Drag to move" |
| Start drag text | Text follows cursor |
| Drag text | Position updates smoothly |
| Release | Text stays in new position |
| Double-click text | Edit prompt appears |
| Type new text | Text updates on canvas |
| Click "Add Text" | New layer added to list |
| Delete layer | Text removed from canvas & list |

---

## 🐛 **TROUBLESHOOTING VISUAL ISSUES**

### **Crop handles not appearing?**
**Check:**
- Crop mode enabled (aspect ratio selected)
- `cropRegion` state has values
- Corner handle divs rendering
- Z-index not blocked by other elements

**Expected:**
- 4 white circles at corners
- Purple border on circles
- Scale effect on hover

---

### **Crop not dragging?**
**Check:**
- Console for `handleCropDragStart` called
- `cropDragHandle` state updates
- Mouse/touch events firing
- `previewContainerRef` has element

**Expected:**
- Cursor changes on hover
- Badge updates during drag
- Crop position/size changes smoothly

---

### **Text not visible?**
**Check:**
- `textLayers` array has items
- Text color not same as background
- Text size not too small
- Text position within canvas bounds

**Expected:**
- Text visible on canvas
- Text follows cursor when dragging
- Selection ring when selected

---

### **Text effects not showing?**
**Check:**
- Shadow blur > 0 to see shadow
- Outline width > 0 to see outline
- Color values valid (not transparent)
- Canvas export applies effects

**Expected:**
- Shadow appears as blur behind text
- Outline appears as stroke around text
- Rotation tilts text
- Font changes appearance

---

## 📸 **SCREENSHOT GUIDE**

### **Take Screenshots Of:**

1. **Crop with all handles visible**
   - Show corner handles
   - Show badge
   - Show cursor change

2. **Dragging crop center**
   - Show badge: "↔️ Move"
   - Show crop in motion

3. **Dragging crop corner**
   - Show badge: "↗️ Resize"
   - Show crop resizing

4. **Text Layers panel**
   - Show "Add Text" button
   - Show layer list
   - Show selected layer with edit panel

5. **Text on canvas**
   - Show selection ring
   - Show drag badge
   - Show multiple text layers

6. **Text with effects**
   - Show shadow effect
   - Show outline effect
   - Show rotated text

7. **Final export**
   - Show cropped + text result
   - Compare original vs enhanced

---

## 🎉 **SUCCESS!**

If you can do all of these, **Phase 4 is working perfectly:**

### **Crop:**
✅ Drag center to move crop region  
✅ Drag corners to resize crop region  
✅ Aspect ratio maintained (when preset selected)  
✅ Badge shows drag feedback  
✅ Handles scale on hover  
✅ Works on mobile with touch  

### **Text:**
✅ Add multiple text layers  
✅ Drag text to position  
✅ Edit text content  
✅ Change font, size, color  
✅ Rotate text  
✅ Add shadow and outline effects  
✅ Delete layers  
✅ Export with all effects  

---

## 🚀 **READY FOR TESTING!**

Follow this guide to verify everything works.  
Report any issues you find!  
Enjoy your new editing powers! 🎨✨
