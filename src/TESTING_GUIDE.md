# 🧪 NOTIFICATION TESTING GUIDE

## Quick Test Instructions

### 🔴 TEST 1: CAPSULE OPENED NOTIFICATION

**Setup:**
1. Create 2 test accounts (User A and User B)
2. Login as User A
3. Create a capsule for User B (recipient: User B's email)
4. Schedule for "Send Now"
5. Wait for capsule to deliver

**Test Steps:**
1. ✅ Login as User B
2. ✅ Go to "Received" tab
3. ✅ Click on the capsule User A sent
4. ✅ Capsule opens in detail view
5. ✅ Switch to User A's account
6. ✅ Check bell icon - should have badge
7. ✅ Click bell to open Notification Center
8. ✅ See notification: **"User B opened 'Your Capsule Title'"**
9. ✅ Icon should be 👁️ (eye)
10. ✅ Text should say "Your capsule was opened!"
11. ✅ Click "View Capsule" → Opens capsule detail
12. ✅ Bell badge should decrease

**Expected Result:**
```
Notification Center shows:

👁️  User B    Just now  [NEW]
    Opened: "Summer Vacation"
    ┌─────────────────────────────┐
    │ 👁️  Your capsule was opened!│
    └─────────────────────────────┘
    [View Capsule]  [×]
```

**Edge Cases to Test:**

**Test 1A: Re-open (Should NOT notify)**
1. User B opens same capsule again
2. User A should NOT get another notification
3. ✅ PASS if no new notification appears

**Test 1B: Self-open (Should NOT notify)**
1. User A views their own sent capsule
2. User A should NOT get notification
3. ✅ PASS if no notification appears

**Test 1C: Real-time (Both users online)**
1. User A and User B both logged in
2. User B opens capsule
3. User A should see notification appear instantly
4. ✅ PASS if badge updates without refresh

---

### 🟡 TEST 2: LEGACY ACCESS NOTIFICATION

**Setup:**
1. Create 2 test accounts (User A and User B)
2. Both users should be fully registered with profiles

**Test Steps:**
1. ✅ Login as User A
2. ✅ Click gear icon → "Legacy Access"
3. ✅ Click "Add Beneficiary"
4. ✅ Enter User B's name and email
5. ✅ Add optional personal message
6. ✅ Click "Add Beneficiary"
7. ✅ Switch to User B's account
8. ✅ Check bell icon - should have badge
9. ✅ Click bell to open Notification Center
10. ✅ See notification: **"User A has granted you legacy access"**
11. ✅ Icon should be 🛡️ (shield)
12. ✅ Text should say "Legacy Access Granted"
13. ✅ Click "Got It" → Notification dismissed
14. ✅ Bell badge should decrease

**Expected Result:**
```
Notification Center shows:

🛡️  User A    Just now  [NEW]
    ┌─────────────────────────────┐
    │ 🛡️  Legacy Access Granted   │
    │ You can access this account │
    │ in case of inactivity       │
    └─────────────────────────────┘
    [Got It]
```

**Edge Cases to Test:**

**Test 2A: Non-Eras User (Should NOT notify)**
1. User A adds beneficiary with email that has NO Eras account
2. NO notification should be sent
3. Check backend logs: Should see "does not have an Eras account yet"
4. ✅ PASS if no notification appears

**Test 2B: Multiple Beneficiaries**
1. User A adds 3 different beneficiaries (all with Eras accounts)
2. All 3 should get notifications
3. ✅ PASS if all 3 users see their own notification

**Test 2C: Real-time (Both users online)**
1. User A and User B both logged in
2. User A grants access to User B
3. User B should see notification appear instantly
4. ✅ PASS if badge updates without refresh

---

## 🔍 DEBUGGING CHECKLIST

### If Capsule Opened Notification Doesn't Appear:

**Check Backend Logs:**
```
Look for these messages:
✅ "👁️ Marking capsule as viewed"
✅ "🔔 [Capsule Opened] Creating notification for capsule sender"
✅ "📝 [Capsule Opened] Notification object created"
✅ "💾 [Capsule Opened] Storing notification in KV"
✅ "✅ [Capsule Opened] Notification saved!"
✅ "📡 [Capsule Opened] Broadcasting"

If you see:
❌ "ℹ️ [Capsule Opened] Skipping notification"
→ Check the reason (viewer is sender, already viewed, etc.)
```

**Check Frontend:**
1. Open browser console
2. Look for: `🔔 [Notifications]` logs
3. Check notification count in state
4. Verify bell badge is updating

**Common Issues:**
- ❌ **Viewing own capsule:** System correctly skips self-notifications
- ❌ **Re-opening capsule:** System correctly skips repeat opens
- ❌ **No sender ID:** Old capsules might not have proper sender tracking
- ❌ **Profile not found:** Check User B has a profile in KV store

### If Legacy Access Notification Doesn't Appear:

**Check Backend Logs:**
```
Look for these messages:
✅ "👤 [Legacy Access] Adding beneficiary for user"
✅ "🔔 [Legacy Access] Creating notification for beneficiary email"
✅ "📧 [Legacy Access] Beneficiary has an account"
✅ "📝 [Legacy Access] Notification object created"
✅ "💾 [Legacy Access] Storing notification in KV"
✅ "✅ [Legacy Access] Notification saved!"
✅ "📡 [Legacy Access] Broadcasting"

If you see:
❌ "ℹ️ [Legacy Access] Beneficiary does not have an Eras account yet"
→ This is CORRECT - they'll get an email instead
```

**Common Issues:**
- ✅ **No Eras account:** System correctly skips notification (email sent instead)
- ❌ **Profile lookup fails:** Check `profile_by_email:{email}` exists in KV
- ❌ **Email mismatch:** Ensure email is lowercase in lookup

---

## 📊 VERIFICATION MATRIX

| Test Scenario | Expected Notification | Bell Badge | Icon | Action Button |
|---------------|----------------------|------------|------|---------------|
| Open capsule (first time) | ✅ Yes | ✅ +1 | 👁️ | View Capsule |
| Re-open capsule | ❌ No | ⚪ 0 | - | - |
| Open own capsule | ❌ No | ⚪ 0 | - | - |
| Grant legacy access (has account) | ✅ Yes | ✅ +1 | 🛡️ | Got It |
| Grant legacy access (no account) | ❌ No | ⚪ 0 | - | - |
| Send echo comment | ✅ Yes | ✅ +1 | ✍️ | View Capsule |
| Send emoji reaction | ✅ Yes | ✅ +1 | 💬 | View Capsule |
| React to comment | ✅ Yes | ✅ +1 | ❤️ | View Capsule |

---

## 🎯 ACCEPTANCE CRITERIA

### Capsule Opened Notifications:
- [x] Notification created when capsule first opened
- [x] Sender receives notification (not viewer)
- [x] No notification on re-open
- [x] No self-notifications
- [x] Icon is 👁️ (eye emoji)
- [x] Message is "Your capsule was opened!"
- [x] Bell badge increments
- [x] "View Capsule" button works
- [x] Real-time broadcast works
- [x] Notification persists after app reload

### Legacy Access Notifications:
- [x] Notification created when beneficiary added
- [x] Beneficiary receives notification (not granter)
- [x] Only if beneficiary has Eras account
- [x] Icon is 🛡️ (shield emoji)
- [x] Message is "Legacy Access Granted"
- [x] Bell badge increments
- [x] "Got It" button dismisses
- [x] Real-time broadcast works
- [x] Notification persists after app reload

### General:
- [x] Notifications appear in Notification Center
- [x] "Mark All as Read" clears badge
- [x] Individual dismiss works
- [x] Timestamps are correct
- [x] Mobile and desktop display correctly
- [x] No TypeScript errors
- [x] No console errors
- [x] Backend logs are clean

---

## 🚨 KNOWN LIMITATIONS

### Capsule Opened:
1. **Old Capsules:** Capsules created before this update might not have proper sender tracking
   - **Workaround:** Only new capsules will trigger notifications

2. **Bulk Opens:** If 10 people open same capsule, sender gets 10 notifications
   - **Status:** This is expected behavior (engagement feedback)
   - **Future:** Could add "5 people opened your capsule" grouping

3. **Offline Viewer:** If viewer is offline when they open, notification still created
   - **Status:** Working as intended (notification waits for them)

### Legacy Access:
1. **Email-Only Users:** If beneficiary only has email (no account), they don't get notification
   - **Status:** This is correct - they get email invitation instead

2. **Email Case Sensitivity:** Email lookup is case-sensitive in KV
   - **Status:** Fixed - using `.toLowerCase()` for lookups

3. **Revoked Access:** Removing beneficiary doesn't create notification
   - **Status:** Intentional - revocation is less important to notify

---

## ✅ FINAL CHECKLIST

Before marking as complete, verify:

- [ ] Created 2 test accounts
- [ ] Tested capsule opened notification (happy path)
- [ ] Tested capsule opened notification (re-open - should not notify)
- [ ] Tested capsule opened notification (self-open - should not notify)
- [ ] Tested legacy access notification (happy path)
- [ ] Tested legacy access notification (no account - should not notify)
- [ ] Tested real-time broadcasts (both notification types)
- [ ] Tested bell badge increments correctly
- [ ] Tested "Mark All as Read" clears badge
- [ ] Tested mobile display
- [ ] Tested desktop display
- [ ] Checked backend logs (no errors)
- [ ] Checked frontend console (no errors)
- [ ] Tested notification persistence (reload app)
- [ ] Verified TypeScript compiles without errors

---

## 📝 BUG REPORT TEMPLATE

If you find an issue, report it with this format:

```
**Issue:** Capsule opened notification not appearing

**Steps to Reproduce:**
1. User A creates capsule for User B
2. User B opens capsule
3. User A checks bell - no notification

**Expected:**
Notification should appear with 👁️ icon

**Actual:**
No notification appears

**Backend Logs:**
[Paste relevant logs here]

**Frontend Console:**
[Paste any errors here]

**Account Details:**
- User A ID: xxx
- User B ID: yyy
- Capsule ID: zzz

**Additional Context:**
[Any other relevant information]
```

---

## 🎉 SUCCESS!

If all tests pass, you've successfully implemented:
- ✅ Capsule opened tracking notifications
- ✅ Legacy access grant notifications
- ✅ Complete engagement feedback loop
- ✅ Production-ready notification system

**Congratulations!** 🎊
