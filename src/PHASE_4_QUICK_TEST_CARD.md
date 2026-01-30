# 🎯 **PHASE 4 - QUICK TEST CARD**

## ⚡ **30-SECOND TEST (Part A: Draggable Crop)**

1. **Open Vault** → Select ANY photo
2. **Click "Enhance"** → Visual tab
3. **Advanced Editing** → Click **"1:1"** (square crop)
4. **✅ VERIFY:** Crop overlay appears
5. **Drag a corner handle** (white circle with purple border)
6. **✅ VERIFY:** Crop resizes, stays square
7. **Drag center** of crop region
8. **✅ VERIFY:** Entire crop moves
9. **Watch badge** → Shows "↗️ Resize" or "↔️ Move"
10. **Click "Save as New"**
11. **✅ VERIFY:** Cropped image created!

---

## ⚡ **30-SECOND TEST (Part B: Text Layers)**

1. **Open Vault** → Select ANY photo
2. **Click "Enhance"** → **Overlays tab**
3. **Click "Add Text"** button (purple gradient)
4. **✅ VERIFY:** Text layer appears on image (center)
5. **Drag text** to reposition
6. **✅ VERIFY:** Text moves smoothly
7. **Double-click text** → Edit in prompt
8. **Type "Summer 2024"** → Click OK
9. **✅ VERIFY:** Text updates
10. **Select layer** from list below → Editing panel opens
11. **Change size** to 48px
12. **Change color** to yellow
13. **Drag rotation** slider to 15°
14. **✅ VERIFY:** Text rotates diagonally
15. **Click "Save as New"**
16. **✅ VERIFY:** Image with text created!

---

## 🎨 **WHAT TO SEE**

### **Part A: Draggable Crop**
```
Crop Overlay:
┌────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ ← Darkened outside
│ ▓▓▓┌──────────────┐▓▓▓▓▓▓▓ │
│ ▓▓▓│ 🖱️         🖱️ │▓▓▓▓▓▓▓ │ ← Draggable corners
│ ▓▓▓│  [1:1 • Drag to adjust]│
│ ▓▓▓│   CROP       │▓▓▓▓▓▓▓ │ ← Draggable center
│ ▓▓▓│   REGION     │▓▓▓▓▓▓▓ │
│ ▓▓▓│ 🖱️         🖱️ │▓▓▓▓▓▓▓ │
│ ▓▓▓└──────────────┘▓▓▓▓▓▓▓ │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└────────────────────────────┘

Drag Behaviors:
- Corner drag → ↗️ Resize (badge shows "Resize")
- Center drag → ↔️ Move (badge shows "Move")
- Maintains aspect ratio if preset selected
```

### **Part B: Text Layers**
```
Overlays Tab UI:
┌─────────────────────────────────┐
│ 🎨 Text Layers [1]  [+ Add Text]│ ← Click to add
├─────────────────────────────────┤
│ ┌─ Summer 2024 ────────────┐   │
│ │ Summer 2024 🗑️            │   │ ← Layer item
│ │ 48px • Sans Serif         │   │
│ │ ──────────────────────    │   │
│ │ Text: [Summer 2024____]   │   │ ← Editing panel
│ │ Font: [Sans ▼] Size: [48] │   │
│ │ Color: [🟡] Rotate: 15°   │   │
│ │ Shadow: ●────○ 4px        │   │
│ │ Outline: ○────○ 0px       │   │
│ └──────────────────────────┘   │
└─────────────────────────────────┘

Text on Image:
┌────────────────────────────────┐
│                                │
│     Summer 2024                │ ← Draggable text
│     (rotated 15°, yellow)      │
│                                │
│         [PHOTO]                │
│                                │
└────────────────────────────────┘
```

---

## ✅ **5 TESTS TO RUN**

### **Test 1: Drag Corner Handle (Crop)**
- Enable crop (any aspect ratio)
- Drag **SE corner** (bottom-right)
- **Expected:** Crop resizes, aspect ratio maintained
- **Badge shows:** "↗️ Resize"

### **Test 2: Drag Center (Crop)**
- Crop active
- Drag **center** of crop region
- **Expected:** Entire crop moves within bounds
- **Badge shows:** "↔️ Move"

### **Test 3: Add Text Layer**
- Overlays tab → Click "Add Text"
- **Expected:** New layer appears on image
- **Verify:** Text says "Double-click to edit"
- **Verify:** Layer appears in list below

### **Test 4: Drag Text Layer**
- Text layer on image
- Click and drag text
- **Expected:** Text follows cursor
- **Verify:** Purple "Selected" badge appears
- **Verify:** Purple ring around text

### **Test 5: Edit Text Layer**
- Select layer from list
- Change size to 64px
- Change color to red
- Rotate to -30°
- Add shadow (10px)
- Add outline (2px black)
- **Expected:** All changes visible immediately

---

## 🎯 **CURSORS TO LOOK FOR**

| Action | Cursor | Icon |
|--------|--------|------|
| **Hover crop center** | Move | ✋ (hand) |
| **Hover NW/SE corner** | Resize NW-SE | ↖️↘️ |
| **Hover NE/SW corner** | Resize NE-SW | ↗️↙️ |
| **Hover text layer** | Move | ✋ (hand) |
| **Hover handle (not drag)** | Default + scale | 🖱️ (larger) |

---

## 📍 **WHERE TO FIND**

### **Part A: Draggable Crop**
```
Vault → Select Photo → Enhance
  ↓
Visual Tab
  ↓
Advanced Editing (expand)
  ↓
Crop Section
  ↓
Select aspect ratio (e.g., 1:1)
  ↓
Crop overlay appears with draggable handles
```

### **Part B: Text Layers**
```
Vault → Select Photo → Enhance
  ↓
Overlays Tab (3rd tab)
  ↓
Top section: "Text Layers"
  ↓
Click [+ Add Text] button
  ↓
Text layer appears on image
  ↓
Select from list to edit properties
```

---

## 🐛 **COMMON ISSUES**

### **Crop handle not dragging?**
- Make sure crop mode is enabled (overlay visible)
- Click directly on white circle handle
- Try different corner if one isn't responding

### **Text layer not appearing?**
- Check Overlays tab is selected (not Visual/Audio)
- Look for text at center of image
- May be hidden behind other layers

### **Text changes not applying?**
- Make sure layer is selected (purple background in list)
- Editing panel should be visible below layer
- Try clicking layer again to select

### **Can't drag text?**
- Click on the text itself (not near it)
- Make sure you're not clicking the delete button
- Try double-click to edit first, then drag

---

## 📊 **WHAT PHASE 4 ADDS**

| Feature | Phase 3 | Phase 4 |
|---------|---------|---------|
| **Crop overlay** | ✅ Static | ✅ **Draggable** |
| **Crop handles** | ✅ Visual only | ✅ **Interactive** |
| **Move crop** | ❌ No | ✅ **Drag center** |
| **Resize crop** | ❌ No | ✅ **Drag corners** |
| **Text on photos** | ✅ Single caption | ✅ **Multiple layers** |
| **Text customization** | ✅ Basic | ✅ **Full control** |
| **Text effects** | ✅ Shadow only | ✅ **Shadow + Outline** |
| **Text rotation** | ❌ No | ✅ **-180° to 180°** |
| **Font options** | ✅ 5 fonts | ✅ **5 fonts + effects** |

---

## 🏆 **SUCCESS CRITERIA**

**Phase 4A is working if:**
1. ✅ Crop handles are draggable (corner + center)
2. ✅ Drag corner → Crop resizes
3. ✅ Drag center → Crop moves
4. ✅ Badge shows "Move" or "Resize" while dragging
5. ✅ Aspect ratio maintained when preset selected
6. ✅ Cursors change correctly (move, resize)
7. ✅ Cropped image exports correctly

**Phase 4B is working if:**
1. ✅ "Add Text" button creates new layer
2. ✅ Text layer appears on image (draggable)
3. ✅ Double-click opens edit prompt
4. ✅ Layer list shows all layers
5. ✅ Select layer → Editing panel opens
6. ✅ Font/size/color changes apply immediately
7. ✅ Rotation slider works
8. ✅ Shadow slider creates glow effect
9. ✅ Outline slider creates text border
10. ✅ Delete button removes layer
11. ✅ Text layers export to saved image

---

## 🚀 **ADVANCED TEST**

**The Ultimate Enhancement Workflow:**

1. Select photo in Vault
2. Click "Enhance"
3. **Filter:** Select "Golden Memory" (sepia)
4. **Brightness:** 120%
5. **Contrast:** 110%
6. **Crop:** 16:9 aspect ratio
7. **Drag crop handles** to frame subject perfectly
8. **Add Text Layer 1:** "Summer Vacation"
9. Font: Display, 56px, white
10. Rotate: -5°
11. Shadow: 8px blur
12. Outline: 3px black
13. Drag to top-left
14. **Add Text Layer 2:** "2024"
15. Font: Mono, 32px, yellow
16. Rotate: 0°
17. Shadow: 4px blur
18. Drag to bottom-right
19. **Before/After:** Toggle to see difference
20. **Save as New**

**Expected Result:**
- ✅ 16:9 cropped photo
- ✅ Sepia filter + brighter/more contrast
- ✅ Two text layers with different styles
- ✅ Rotated title text with outline
- ✅ Yellow date text with shadow
- ✅ Professional-looking memory card!

---

## 🎨 **VISUAL INDICATORS**

### **When Dragging Crop:**
- ✅ Badge pulses and scales
- ✅ Badge text changes ("Move" or "Resize")
- ✅ Cursor changes (move, nwse-resize, nesw-resize)
- ✅ Handles stay visible while dragging

### **When Dragging Text:**
- ✅ Text opacity drops to 70%
- ✅ Text scales to 105%
- ✅ Purple "Selected • Drag to move" badge appears
- ✅ Purple ring around text (2px)

---

## ⏱️ **PERFORMANCE CHECK**

- **Crop drag:** Real-time, no lag
- **Text drag:** Real-time, no lag
- **Property changes:** Instant (<50ms)
- **Add text layer:** Instant (<50ms)
- **Canvas export:** 1-3 seconds (depends on layers)

---

## 🎉 **YOU'RE DONE!**

If all tests pass, **Phase 4 is complete!** 🚀

You now have:
- ✅ Draggable crop handles (resize + move)
- ✅ Multiple text layers with full styling
- ✅ Professional photo editing in Eras!

Ready to test? Let me know if you see any issues! 🎨✨
