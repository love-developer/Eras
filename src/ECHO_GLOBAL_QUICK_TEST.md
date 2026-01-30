# 🔒 Echo Global Setting - 2-Minute Test

## ✅ Quick Test (2 Minutes)

### Test 1: Find the Setting
1. Click **Settings** (gear icon in top right)
2. Scroll to **"Notification Preferences"** card
3. Look for **💬 Echo Responses** section (at bottom, before Save button)
4. ✅ Should see toggle: "Allow Echo Responses"
5. ✅ Should be **ON** by default

---

### Test 2: Create with Echoes Enabled
1. Leave toggle **ON**
2. Go to **Record** tab → Create capsule
3. Fill in title, message, select date
4. Send to someone (or yourself with "To: Others")
5. Recipient views capsule
6. ✅ Should see **"Send an Echo"** panel with emoji reactions

---

### Test 3: Disable Echoes
1. Go to **Settings** → **Notification Preferences**
2. Toggle **OFF** "Allow Echo Responses"
3. Click **"Save Notification Preferences"**
4. ✅ Should see success toast
5. Create NEW capsule and send it
6. Recipient views capsule
7. ✅ Should **NOT** see echo panel at all

---

### Test 4: Sender Always Sees Timeline
1. While echoes are disabled in Settings
2. Go to **Dashboard** → click any capsule you SENT
3. ✅ Should still see **Echo Timeline** (if you're the sender)
4. This is correct! Sender always sees echoes received

---

## 🎯 Visual Checklist

### Settings UI Should Look Like:
```
┌────────────────────────────────────┐
│ 🔔 Notification Preferences        │
├────────────────────────────────────┤
│ ...email notifications...          │
│ ...in-app notifications...         │
│                                     │
│ 💬 Echo Responses                  │
│   ┌──────────────────────────────┐│
│   │ Allow Echo Responses  [ON ✓]││
│   │ Let recipients send...       ││
│   └──────────────────────────────┘│
│                                     │
│ [Save Notification Preferences]    │
└────────────────────────────────────┘
```

### Echo Panel (When Enabled):
```
Recipient sees:
┌──────────────────────────┐
│ 💬 Send an Echo          │
│ ┌──────────────────────┐ │
│ │ 😊 🎉 ❤️ 🔥 👍        │ │
│ │ [Add note...      ]   │ │
│ │ [Send Echo]           │ │
│ └──────────────────────┘ │
└──────────────────────────┘
```

### No Panel (When Disabled):
```
Recipient sees:
┌──────────────────────────┐
│ My Capsule               │
│ ──────────────────────── │
│ Message content here...  │
│                          │
│ (No echo panel)          │
└──────────────────────────┘
```

---

## ✅ Pass Criteria

Must see:
- [ ] Toggle appears in Settings → Notification Preferences
- [ ] Default is ON
- [ ] Save button works (shows success toast)
- [ ] Enabled = recipients see echo panel
- [ ] Disabled = recipients see NO echo panel
- [ ] Senders always see timeline regardless

---

## 🚀 Quick Links

- Full documentation: `/ECHO_GLOBAL_SETTING_COMPLETE.md`
- Phase 1 Echoes: `/PHASE_1_ECHOES_SYSTEM_COMPLETE.md`
- Visual guide: `/ECHOES_VISUAL_GUIDE.md`

---

**Total Test Time**: 2 minutes  
**Expected Result**: Clean global toggle, no clutter in Create flow ✨
