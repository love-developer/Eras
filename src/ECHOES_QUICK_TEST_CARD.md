# 💫 Echoes System - Quick Test Card

## ✅ **5-Minute Test Flow**

### **Setup (1 min)**
1. Sign in as User A
2. Create capsule, set delivery "Now"
3. Add recipient (use different email/test account)
4. Send capsule

### **Test as Recipient (2 min)**
1. Sign in as User B (recipient)
2. Go to "Received" tab
3. Click capsule → Opens portal modal
4. Scroll down → See **Echo Panel** with 6 emoji buttons
5. Click ❤️ emoji → Watch particle animation fly up
6. See toast: "Echo sent! 💫"
7. Click "Write a Note" button
8. Choose template OR write custom message
9. Click "Send Echo" → See success toast

### **Test as Sender (2 min)**
1. Sign back in as User A (sender)
2. Go to "Dashboard" tab
3. Click same capsule → Opens portal modal
4. Scroll down → See **Echo Timeline**
5. See echoes from User B:
   - ❤️ emoji reaction (big display)
   - Text note with content
   - Sender name & timestamp
   - Pulsing timeline dots
6. Check email → Should have notification

---

## 🎯 **What to Look For**

### **Visual Quality**
- [ ] Echo Panel has cosmic gradient background
- [ ] Floating star particles animate
- [ ] Emoji buttons glow on hover
- [ ] Timeline dots pulse
- [ ] Everything matches portal style

### **Functionality**
- [ ] Emoji reactions send immediately
- [ ] Text modal opens/closes smoothly
- [ ] Templates clickable
- [ ] Custom text respects 500 char limit
- [ ] Success toasts appear
- [ ] Timeline auto-updates after sending

### **Achievements**
- [ ] First echo → "Echo Initiate" unlocks
- [ ] 10th echo → "Warm Wave" unlocks
- [ ] Achievement toast appears
- [ ] Dashboard shows new achievements

### **Email**
- [ ] Sender receives email notification
- [ ] Email shows echo content preview
- [ ] "View in Eras" button works

---

## 🐛 **Common Issues**

### "Please sign in to send an echo"
- **Fix**: Sign in first, then open capsule

### No Echo Panel visible
- **Check**: Must be a **received** capsule (not your own)
- **Check**: Capsule status must be "received"

### No Echo Timeline visible
- **Check**: Must be viewing **your own capsule** (canEdit = true)

### Email not received
- **Check**: Spam folder
- **Note**: Email failures don't break echo sending (by design)

---

## 📊 **Expected Behavior**

### **Recipients See:**
```
┌─────────────────────────────────────┐
│  [Capsule content displayed above]  │
│                                      │
│  ✨ Send an Echo                     │
│                                      │
│  Quick Reactions:                    │
│  [❤️] [😂] [😢] [🎉] [😮] [✨]      │
│                                      │
│  [✍️ Write a Note]                   │
└─────────────────────────────────────┘
```

### **Senders See:**
```
┌─────────────────────────────────────┐
│  💬 Echoes (2)                       │
│                                      │
│  ● Nov 17, 10:02 AM                  │
│    ❤️ Alice reacted                  │
│                                      │
│  ● Nov 17, 10:10 AM                  │
│    ✍️ Alice sent a note              │
│    "This made my day! Thank you!"    │
└─────────────────────────────────────┘
```

---

## 🚀 **Quick Commands**

### View Backend Logs
```bash
# Check echo service logs
grep "💫" logs/server.log

# Check email logs
grep "📧" logs/server.log

# Check achievement logs
grep "🏆" logs/server.log
```

### Test Data
```bash
# Check KV store
echo_{capsuleId}_*        # Individual echoes
echo_meta_{capsuleId}     # Metadata cache
```

---

## ✅ **Success Criteria**

All these should work:
- ✅ Emoji reactions send with animation
- ✅ Text echoes use templates or custom
- ✅ Timeline shows echoes chronologically
- ✅ Email notification delivered
- ✅ Achievements unlock correctly
- ✅ Mobile and desktop both work
- ✅ No console errors
- ✅ Loading states show properly

---

## 📝 **Quick Debugging**

### Check Console for:
```
✅ Echo sent: emoji for capsule abc123
📧 Echo notification sent to user@example.com
🏆 Tracked echo_sent achievement for user xyz
```

### Check Network Tab:
```
POST /echoes/send → 200 OK
GET /echoes/{id} → 200 OK
```

---

## 🎉 **Ready to Ship?**

If all items above work, Phase 1 is complete and ready for production! 🚀

---

*Test Duration: ~5 minutes*
*Last Updated: November 2024*
