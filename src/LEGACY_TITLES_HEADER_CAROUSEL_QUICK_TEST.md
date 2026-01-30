# 👑 Legacy Titles Header Carousel - Quick Test

## ✅ 90-Second Test

Test all three requirements:
1. Only NAME is clickable (not "Welcome,")
2. Title displays on ONE ROW
3. Opens TitleCarousel modal (from Settings)

---

## 🧪 Test 1: Only Name Clickable (30 sec)

**Look at header**:
```
Welcome, Alex!
        ^^^^
    Only this part should be blue
```

### Must See:
- [ ] "Welcome," is **gray** (not clickable)
- [ ] "Alex" is **BLUE** (#3b82f6)
- [ ] "Alex" is **underlined**
- [ ] "!" is **gray** (not clickable)

### Hover Test:
1. Hover over "Welcome," 
   - [ ] Nothing happens (gray, not interactive)
2. Hover over "Alex"
   - [ ] Becomes lighter blue
   - [ ] Underline gets brighter
   - [ ] Cursor shows pointer (hand)
3. Hover over "!"
   - [ ] Nothing happens (gray, not interactive)

### Click Test:
1. Click "Alex"
   - [ ] Modal opens
   - [ ] Shows carousel (arrows, not grid)

---

## 🧪 Test 2: Title Single Row (20 sec)

**If you have a title equipped**:

### Must See:
```
✦ Nostalgia Weaver ✦  ← All on ONE horizontal row
```

**NOT this** (wrapping):
```
   ✦              ❌ Icon on row 1
Nostalgia         ❌ Text on row 2
  Weaver          ❌ More text on row 3
      ✦           ❌ Icon on row 4
```

### Check:
- [ ] Icon - Text - Icon all on **one horizontal row**
- [ ] No wrapping (even on mobile)
- [ ] Badge stays inline
- [ ] Looks professional

### Mobile Test:
1. Resize browser to <400px
   - [ ] Title **still** one row
   - [ ] May be small but doesn't wrap
   - [ ] Icons stay inline

---

## 🧪 Test 3: Opens TitleCarousel (40 sec)

### Open Modal:
1. Click name OR title badge
2. Modal opens

### Must See:
```
┌──────────────────────────┐
│ ✨ Title Collection    X │
│ Showcase your...         │
├──────────────────────────┤
│                           │
│   ←  [Title Badge]  →    │  ← Carousel with arrows!
│                           │
│      ⚔️ The First Step   │
│      Common • Equipped    │
│                           │
│      [Remove Title]       │
│                           │
└──────────────────────────┘
```

**This is the CAROUSEL (correct!)** ✅

**NOT this (grid selector)** ❌:
```
┌──────────────────────────┐
│ Legacy Titles          X │
├──────────────────────────┤
│ [Badge] [Badge] [Badge]  │  ← Grid of badges
│ [Badge] [Badge] [Badge]  │
│ [Badge] [Badge] [Badge]  │
└──────────────────────────┘
```

### Carousel Features:
- [ ] **Left arrow** to navigate
- [ ] **Right arrow** to navigate
- [ ] Title badge in center
- [ ] Description text below
- [ ] "Equipped" or "Equip" button
- [ ] "Remove Title" button (if equipped)

### Compare with Settings:
1. Close modal
2. Go to Settings (gear icon)
3. Scroll to "Title Collection"
4. ✅ **Same carousel layout!**
5. ✅ Same arrows, same badges
6. ✅ Same functionality

---

## ✅ Pass Criteria

### Name Appearance:
- [ ] Only "Alex" is blue
- [ ] "Welcome," and "!" are gray
- [ ] Blue part is underlined
- [ ] Looks like a hyperlink

### Name Interaction:
- [ ] Hover on "Alex" → lighter blue
- [ ] Hover on "Welcome," → nothing
- [ ] Click "Alex" → modal opens
- [ ] Cursor shows pointer on "Alex" only

### Title Display:
- [ ] All on one row (horizontal)
- [ ] Icon - Text - Icon inline
- [ ] No wrapping on any screen size
- [ ] Clickable (cursor pointer)

### Modal Content:
- [ ] Carousel layout (NOT grid)
- [ ] Left/right arrows visible
- [ ] Title in center
- [ ] Can navigate between titles
- [ ] Same as Settings carousel
- [ ] Can equip/remove titles

---

## 🚨 Fail Indicators

### Name Issues:
- [ ] Entire "Welcome, Alex!" is blue (WRONG - only name should be)
- [ ] Name is not underlined
- [ ] Name is gray (should be blue)
- [ ] Clicking name does nothing

### Title Issues:
- [ ] Title wraps to multiple rows
- [ ] Icons on different rows than text
- [ ] Clicking title does nothing

### Modal Issues:
- [ ] Grid layout shows (WRONG - should be carousel)
- [ ] No arrows visible
- [ ] Different from Settings carousel
- [ ] Modal doesn't open

---

## 📱 Quick Mobile Test (20 sec)

1. Open on phone or resize to <400px
2. **Name**:
   - [ ] Still only name part is blue
   - [ ] Smaller but still readable
   - [ ] Tap works
3. **Title**:
   - [ ] Still ONE ROW (no wrapping!)
   - [ ] Smaller badge
   - [ ] Tap works
4. **Modal**:
   - [ ] Full-width
   - [ ] Carousel works
   - [ ] Touch-friendly

---

## 🎯 Visual Quick Check

### Header Should Look Like:
```
Desktop:
┌─────────────────────────────────┐
│ 🌙 Eras   Welcome, Alex! ⚙️    │
│                    ^^^^          │ ← Only this blue
│           ✦ Nostalgia Weaver ✦ │ ← One row
└─────────────────────────────────┘

Mobile:
┌──────────────────┐
│ 🌙  Welcome, Alex! │ ← Only name blue
│    ✦ Nostalgia Weaver ✦ │ ← One row
└──────────────────┘
```

### Modal Should Look Like:
```
┌────────────────────────────┐
│ ✨ Title Collection      X │
├────────────────────────────┤
│        ←  [Badge]  →       │ ← Carousel!
│      ⚔️ The First Step     │
│      Common • Equipped      │
│      [Remove Title]         │
└────────────────────────────┘
```

---

## ⏱️ Time Breakdown

- **Test 1** (Name clickable): 30 seconds
- **Test 2** (Single row): 20 seconds
- **Test 3** (Carousel modal): 40 seconds

**Total**: 90 seconds ⏱️

---

## ✅ Quick Summary

If you see:
1. ✅ Only name is blue (not "Welcome,")
2. ✅ Title all on one row
3. ✅ Carousel modal (with arrows, like Settings)

**Then it's working perfectly!** 🎉

If you see:
1. ❌ Entire "Welcome, Alex!" is blue
2. ❌ Title wrapping to multiple rows
3. ❌ Grid modal instead of carousel

**Then something's wrong** - check console for errors.

---

**Expected Result**: Fast, clear access to the **same carousel** from Settings, with **only your name** being clickable and titles **always on one row**! 👑✨
