# 🧪 TAGLINE QUICK TEST GUIDE

## ✅ 3-MINUTE VERIFICATION

---

### **TEST 1: Desktop Logo (30 seconds)**

1. Open the app on desktop browser (width ≥640px)
2. Watch the logo area in the top-left

**EXPECT TO SEE:**
```
[🌙☀️] ERAS
       Capture Today, Unlock Tomorrow  ← Single line
                ↑
           Fades in with purple glow after 0.5s
```

**Check:**
- [ ] Tagline appears on ONE line
- [ ] Fades in with purple shimmer effect
- [ ] Text is slate-600 color (gray)
- [ ] Loads about 0.5s after logo icon

---

### **TEST 2: Mobile Logo (30 seconds)**

1. Resize browser to mobile width (<640px) or use DevTools mobile view
2. Check the logo area

**EXPECT TO SEE:**
```
[🌙☀️] ERAS
       Capture Today,  ← Line break after comma
       Unlock Tomorrow
```

**Check:**
- [ ] Tagline wraps after "Today,"
- [ ] Same fade-in animation works
- [ ] No awkward text overflow
- [ ] Readable on small screens

---

### **TEST 3: Loading Animation (30 seconds)**

1. Clear cache or hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)
2. Watch the opening eclipse animation

**EXPECT TO SEE:**
During the eclipse merge:
```
     ☀️  🌑
   
     ERAS
Capture Today, Unlock Tomorrow  ← Should say this
```

**Check:**
- [ ] Shows "Capture Today, Unlock Tomorrow"
- [ ] NOT "Digital Time Capsule"
- [ ] Text appears during merge phase
- [ ] Fades out as eclipse settles to corner

---

### **TEST 4: Footer (30 seconds)**

1. Scroll to bottom of any tab (except Record tab)
2. Check footer text

**EXPECT TO SEE:**

**Desktop (≥640px):**
```
© 2025 Eras. Capture Today, Unlock Tomorrow.
```

**Mobile (<640px):**
```
© 2025 Eras
```

**Check:**
- [ ] Desktop shows full tagline
- [ ] Mobile shows short version
- [ ] Footer hidden on Record tab ✅

---

### **TEST 5: Animation Timing (1 minute)**

1. Hard refresh page
2. Time the tagline appearance

**TIMELINE:**
```
0.0s  │ ☀️🌙 Logo icon appears
      │
0.5s  │ ⏱️ Tagline STARTS fading in
      │    (barely visible, no glow)
      │
0.9s  │ ✨ Peak purple glow
      │    (50% opacity, bright shimmer)
      │
1.3s  │ ✅ Fully visible
      │    (100% opacity, subtle glow remains)
```

**Check:**
- [ ] Tagline doesn't appear instantly with logo
- [ ] Smooth fade-in effect (not abrupt)
- [ ] Purple glow visible during fade
- [ ] Settles into readable text

---

## 🎯 COMMON ISSUES

### **Issue 1: "Digital Time Capsule" still shows**
**Solution:** Hard refresh (Cmd+Shift+R) - browser cached old version

### **Issue 2: No animation / appears instantly**
**Solution:** Check globals.css loaded - look in DevTools Network tab

### **Issue 3: Text wrapping wrong on mobile**
**Solution:** Verify screen width <640px - use DevTools mobile emulator

### **Issue 4: Purple glow not visible**
**Solution:** Check against white background - glow is subtle by design

---

## ✅ ALL TESTS PASSED?

If all 5 tests pass, your tagline is **PERFECTLY IMPLEMENTED**! 🎉

**Final confirmation:**
```
✓ Desktop logo: Single line with fade-in
✓ Mobile logo: Wrapped after comma
✓ Loading screen: Shows new tagline
✓ Footer: Shows new tagline
✓ Animation: Smooth 0.8s fade with glow
```

---

## 🆘 NEED HELP?

**Can't see the tagline at all?**
- Clear browser cache completely
- Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)
- Check JavaScript console for errors

**Animation not working?**
- Verify `/styles/globals.css` loaded
- Check for CSS errors in DevTools
- Confirm `fadeInWithGlow` keyframe exists

**Wrong text showing?**
- Component might not have rebuilt
- Try closing and reopening app
- Check file saved correctly

---

## 🎨 BONUS: Inspect Animation in DevTools

1. Right-click tagline text
2. Click "Inspect Element"
3. Look for this in Styles panel:

```css
animation: fadeInWithGlow 0.8s ease-out 0.5s both;
```

4. Toggle it on/off to see the effect
5. Watch the purple drop-shadow value change

---

**YOU'RE ALL SET!** 🚀

The tagline "Capture Today, Unlock Tomorrow" is now live across your entire app with a beautiful animated entrance!
