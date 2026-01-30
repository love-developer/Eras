# 💫 Echo Single Reaction - 2-Minute Test

## ✅ Quick Test (2 Minutes)

### Test 1: First Reaction (30 sec)
1. Open a **received capsule** (not one you sent)
2. Scroll to **"Send an Echo"** panel
3. Click an emoji (e.g., ❤️)
4. ✅ Emoji should **glow** and get a **violet ring**
5. ✅ Toast: "Echo sent! 💫"

---

### Test 2: Change Reaction (30 sec)
1. Click a **different emoji** (e.g., 🎉)
2. ✅ Previous emoji (❤️) should **lose glow**
3. ✅ New emoji (🎉) should **gain glow + ring**
4. ✅ Toast: "Echo sent! 💫"

---

### Test 3: Click Same Emoji (20 sec)
1. Click the **currently selected emoji** (🎉)
2. ✅ Should show toast: **"Reaction already sent"**
3. ✅ No new echo sent (check console)
4. ✅ Emoji stays highlighted

---

### Test 4: Reload Persistence (30 sec)
1. Note which emoji is highlighted
2. **Refresh the page** (F5)
3. ✅ Same emoji should still be **highlighted**
4. ✅ Other emojis normal state

---

### Test 5: Timeline Check (30 sec)
1. Go to sender view (Dashboard → click the capsule you sent)
2. Scroll to **Echo Timeline**
3. ✅ Should see **ONLY ONE emoji** from you
4. ✅ If you changed reactions, only latest shows

---

## 🎯 Visual Checklist

### Unselected Emoji
```
┌─────────┐
│   😊    │  ← Gray background
└─────────┘     Normal border
```

### Selected Emoji
```
┌─────────┐
│  ░😊░   │  ← Glowing background
└─────────┘     Violet ring around it
     ↑
  (this one!)
```

### On Click (Already Selected)
```
🔔 Toast appears:
"Reaction already sent"
"Click a different emoji to change your reaction"
```

---

## ✅ Pass Criteria

Must see:
- [ ] First click: Emoji highlights with ring
- [ ] Different click: Old unhighlights, new highlights
- [ ] Same click: Toast appears, no duplicate sent
- [ ] Reload: Highlight persists
- [ ] Timeline: Only 1 emoji reaction per user

---

## 🎨 Expected Behavior

### Facebook-Style
```
User journey:
1. Click ❤️  → ❤️ selected (highlighted)
2. Click 🔥  → ❤️ removed, 🔥 selected
3. Click 🔥  → Toast (already sent)
4. Result: Only 🔥 in timeline
```

### NOT Like Before
```
Old behavior (fixed):
1. Click ❤️  → Sent
2. Click 🔥  → Sent  
3. Click 🎉  → Sent
4. Result: 3 emojis (spam!) ❌
```

---

## 🚨 Common Issues

### Issue: Emoji Not Highlighting
**Fix**: Make sure you're viewing a **received** capsule (not one you sent)

### Issue: Multiple Emojis in Timeline
**Fix**: Old data may exist - changing reaction should replace going forward

### Issue: Loading Spinner Forever
**Fix**: Check console for auth errors, make sure you're signed in

---

## 📱 Mobile vs Desktop

### Mobile (Grid)
```
┌─────────────┐
│ ❤️  😂  😢  │
│ 🎉  😮  ✨  │  ← One highlighted
└─────────────┘
```

### Desktop (Rows)
```
┌────────────────────────────┐
│ ❤️ Love    😂 Funny   😢  │
│ 🎉 Party   😮 Amazing  ✨  │  ← One highlighted
└────────────────────────────┘
```

---

## 🔗 Related Docs

- Full documentation: `/ECHO_SINGLE_REACTION_COMPLETE.md`
- Global setting: `/ECHO_GLOBAL_SETTING_COMPLETE.md`
- Phase 1 Echoes: `/PHASE_1_ECHOES_SYSTEM_COMPLETE.md`

---

**Total Test Time**: 2 minutes  
**Expected Result**: Clean single-reaction system like Facebook ✨
