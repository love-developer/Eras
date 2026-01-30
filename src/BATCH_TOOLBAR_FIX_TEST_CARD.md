# Batch Toolbar Fix - Quick Test Card

## 🎯 Quick Verification Steps

### Test 1: Desktop View (≥640px)
1. Open app on desktop browser
2. Select 1-3 capsules
3. **Expected Toolbar Text:**
   - "3 selected"
   - "Select All (10)" (if 10 total)
   - "Clear"
   - "Add to Vault"
   - "Export"
   - "Delete (3)"
4. **Verify:** NO duplicate text, all buttons visible in one row

### Test 2: Mobile View (<640px) - **NOW 2 ROWS**
1. Open app on mobile device OR resize browser to <640px
2. Select 1-3 capsules
3. **Expected Toolbar Layout:**
   - **ROW 1:** "3" badge, "All" button, "Clear" button
   - **ROW 2:** "Vault" button, "Export" button, "Delete" button ✅
4. **Expected Text (All READABLE):**
   - Row 1: "3", "All", "Clear"
   - Row 2: "Vault", "Export", "Delete"
5. **Verify:** 
   - ✅ **2 ROWS showing** (not 1 row)
   - ✅ **DELETE BUTTON VISIBLE** in row 2 ✅
   - ✅ Text appears as **WORDS**, not dots or ellipsis
   - ✅ Text is clearly readable (14px font)
   - ✅ Icons are clearly visible (16px)
   - ✅ NO duplicate text
   - ✅ Buttons have proper touch targets (36px tall)
   - ✅ **NO horizontal scroll needed** (all fits in viewport)
   - ✅ Buttons have equal width in each row

### Test 3: Font Check
1. View any capsule card
2. Look at the title text
3. **Verify:** Title uses default system font (NOT Orbitron)

### Test 4: Resize Behavior
1. Start in desktop view with toolbar visible
2. Slowly resize browser to mobile width
3. **Verify:** Text changes from long to short format smoothly

## ✅ Pass Criteria
- [ ] Desktop shows full text in 1 row (e.g., "Select All (10)")
- [ ] Mobile shows short text in 2 rows (e.g., "All")
- [ ] **Mobile Row 1:** Count badge, "All", "Clear"
- [ ] **Mobile Row 2:** "Vault", "Export", "Delete" ✅
- [ ] **DELETE button clearly visible on mobile** ✅
- [ ] NO text appearing twice (e.g., NO "All Select All (10)")
- [ ] Toolbar fits in viewport on mobile (no horizontal scroll needed)
- [ ] Capsule titles use default font (not Orbitron)

## ❌ Fail Indicators
- Text duplication (both versions showing)
- **Text appearing as dots/ellipsis instead of words**
- **Text too small to read comfortably (looks like 12px or smaller)**
- Orbitron font still showing on titles
- Text not changing when resizing
- Icons too small to identify clearly

## 🔧 If Issues Persist
This implementation uses JavaScript instead of CSS, so if duplication still occurs:
1. Check browser console for errors
2. Verify `window.innerWidth` is being read correctly
3. Check if `isMobile` state is updating properly
4. Clear browser cache and hard reload

## 📱 Recommended Test Devices
- Desktop: 1920px, 1440px, 1024px
- Tablet: 768px, 820px
- Mobile: 375px, 390px, 430px

## 🎨 Visual Confirmation
**Cosmic Glassmorphic Cards:** Dark frosted glass background with backdrop blur - ✅ Working as intended

**Status Gradient Borders:** Color-coded borders based on capsule status - ✅ Working as intended
