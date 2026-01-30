# 🧪 **TEXT DROPDOWN - QUICK TEST CARD**

## ⚡ **30-Second Test with Console**

### **Setup:**
1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Clear logs (click 🚫)

---

## **Test 1: Font Dropdown**

1. Vault → Photo → Enhance → Overlays
2. Click "Add Text"
3. **Click Font dropdown** (left dropdown)

**✅ Expected:**
- Dropdown opens
- See 5 options:
  - Sans Serif ✓
  - Serif
  - Monospace
  - Cursive
  - Display

4. **Click "Cursive"**

**✅ Expected:**
- Console: `Font changed to: cursive for layer: text-0`
- Dropdown closes
- Text on canvas becomes cursive

---

## **Test 2: Size Dropdown**

1. **Click Size dropdown** (right dropdown)

**✅ Expected:**
- Dropdown opens
- See 14 sizes (12px to 100px)
- Current size has checkmark (32px)

2. **Click "100px (Huge)"**

**✅ Expected:**
- Console: `Size changed to: 100 for layer: text-0`
- Dropdown closes
- Text on canvas becomes huge

---

## **Test 3: Multiple Changes**

1. Change Font → Serif
2. Change Size → 64px (XL)
3. Change Font → Monospace
4. Change Size → 16px (Small)

**✅ Expected:**
- Each change logs to console
- Text updates immediately
- No errors

---

## 🚨 **If Dropdown Won't Open**

### **Check 1: Is it rendered?**
1. Open DevTools → Elements tab
2. Search for: `select-content`
3. Should find Portal element

### **Check 2: Z-index issue?**
1. Right-click dropdown trigger
2. Inspect element
3. Look for `z-index: 9999` in styles

### **Check 3: Overflow hidden?**
1. Check parent containers
2. Look for `overflow: hidden`
3. Should be `overflow: visible` or `overflow-y: auto`

---

## 🚨 **If Dropdown Opens But Won't Select**

### **Check Console:**
- No logs when clicking? → Event handler issue
- Logs appear? → State update issue
- Errors shown? → Check error message

### **Check DevTools:**
1. Elements tab → Find `<select>` element
2. Look at `value` attribute
3. Should match current layer font/size

---

## 📊 **Success Indicators**

| Test | Expected Result | Status |
|------|-----------------|--------|
| Font dropdown opens | See 5 fonts | ⬜ |
| Font selection works | Console log + text changes | ⬜ |
| Size dropdown opens | See 14 sizes | ⬜ |
| Size selection works | Console log + text grows | ⬜ |
| No console errors | Clean console | ⬜ |

---

## 🎯 **Quick Diagnostic**

**Problem:** Dropdown won't open
**Check:** Z-index (should be 9999)

**Problem:** Dropdown opens, can't select
**Check:** Console logs (should show "changed to:")

**Problem:** Selection works, text doesn't change
**Check:** Canvas rendering (should use layer.font/size)

---

## 🔧 **What Was Fixed**

### **Before:**
```typescript
<Select value={layer.font} onValueChange={...}>
  <SelectContent>  // ❌ Low z-index, might be hidden
```

### **After:**
```typescript
<Select 
  key={`font-${layer.id}`}  // ✅ Unique key
  value={layer.font} 
  onValueChange={(value) => {
    console.log('Font changed to:', value);  // ✅ Debug log
    updateTextLayer(layer.id, { font: value });
  }}
>
  <SelectContent 
    className="z-[9999] bg-slate-900"  // ✅ High z-index, dark bg
    sideOffset={5}                     // ✅ Spacing
  >
```

---

## 📞 **Report Format**

When reporting back:

**Dropdown Opens?**
- [ ] Yes, see all options clearly
- [ ] Opens but options hidden/clipped
- [ ] Doesn't open at all

**Selection Works?**
- [ ] Yes, console logs appear
- [ ] No logs, nothing happens
- [ ] Logs appear but text doesn't change

**Console Output:**
```
Paste any console logs here
```

**Screenshots:**
- Screenshot of dropdown open (if possible)
- Screenshot of console logs

---

## ✅ **All Tests Pass? You're Done!**

If all 3 tests work:
- ✅ Dropdown opens
- ✅ Console logs appear
- ✅ Text changes on canvas

**Success!** Font and size dropdowns are working! 🎉

---

**Quick Test Card v1.0** | **Test with console open!** 🧪
