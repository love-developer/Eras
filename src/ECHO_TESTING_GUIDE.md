# Echo System Testing Guide 🧪

## Changes Made
✅ **DISABLED WebSocket system** - was causing infinite reconnection loops
✅ **Using 5-second polling only** - reliable and sufficient for near real-time updates
✅ **Comprehensive logging** added throughout echo flow

---

## How to Test Echo Sending

### Step 1: User A (Sender) - Send a Capsule
1. Login as User A (capsule sender)
2. Create and send a capsule to User B (recipient)
3. Note the capsule ID from the URL or console

### Step 2: User B (Recipient) - Send Echo Reaction
1. Login as User B (capsule recipient)
2. Open the received capsule
3. Click an emoji reaction (e.g., ❤️)
4. **Watch browser console for these logs:**

```
🚀 [EchoPanel] Starting echo send: type="emoji", content="❤️", capsuleId="..."
🔑 [EchoPanel] Session found, sending request to server...
📡 [EchoPanel] Server response status: 200 OK
📦 [EchoPanel] Server response data: {success: true}
✅ [EchoPanel] Echo sent successfully!
🎉 [EchoPanel] Emoji reaction "❤️" sent and UI updated
```

### Step 3: Check Server Logs (Edge Function Logs)
Look for:
```
✅ [Echo] Authorization passed for user xyz...
👤 [Echo] User profile loaded: senderName="..."
💾 [Echo] Saving echo to storage: echoId="..."
✅ [Echo] Echo successfully saved to database!
📧 [Notification] Creating notification for recipient: user@example.com
✅ [Notification] Notification saved to KV!
```

### Step 4: User A - Check for Notification
1. Stay logged in as User A (original capsule sender)
2. Within 5 seconds, you should see in console:
```
📡 [Echo Notifications] Fetching notifications...
📦 [Echo Notifications] Received 1 notifications from server
📬 [Echo Notifications] Latest notification: {...}
🎯 [Modal Trigger] Total notifications: 1, Unseen: 1
💫💫💫 [Modal Trigger] TRIGGERING MODAL
```

3. **Modal should appear** with notification details
4. **Sound should play** (two-tone chime)
5. **Haptic feedback** (if on mobile)

---

## Common Issues & What to Look For

### Issue: "Echo being sent" message but no server response
**Look for:**
- ❌ `[EchoPanel] Server response status: 403` or `500`
- ❌ `[EchoPanel] FAILED to send echo: Error...`

**Cause:** Authorization error or server issue

---

### Issue: Echo sent successfully but no notification created
**Look for in server logs:**
- ✅ Echo saved successfully
- ⚠️ `[Notification] Could not find user data for recipient`

**Cause:** Recipient user not found in auth system

---

### Issue: Notification created but modal not appearing
**Look for:**
- ✅ `📦 [Echo Notifications] Received 1 notifications`
- ❌ `🔕 Echo notifications disabled by user preference`
- ❌ `ℹ️ [Modal Trigger] No unseen notifications to show`

**Cause:** Notification preferences disabled OR notification already marked as seen

---

### Issue: Reaction doesn't appear on timeline
**Look for:**
- Check if echo was saved with correct `capsuleId`
- Check if Social Echo Timeline is fetching echoes correctly
- Look for errors in timeline fetch

---

## Manual Test: Check KV Storage

Open browser console and run:

```javascript
// Get your access token
const {data: {session}} = await supabase.auth.getSession();
const token = session.access_token;

// Fetch notifications
const response = await fetch(
  'https://apdfvpgaznpqlordkipw.supabase.co/functions/v1/make-server-f9be53a7/api/echo-notifications',
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const data = await response.json();
console.log('📬 Notifications:', data.notifications);
```

---

## Expected Console Output Timeline

**When User B sends reaction:**
```
[User B Console]
🚀 Starting echo send...
✅ Echo sent successfully!

[Server Logs]
✅ Echo saved to database
✅ Notification saved to KV

[User A Console - within 5s]
📡 Fetching notifications...
📦 Received 1 notifications
💫 TRIGGERING MODAL
```

---

## Quick Diagnostic Checklist

- [ ] WebSocket reconnection logs stopped (should only see polling logs)
- [ ] User B can click emoji and see "Echo sent!" toast
- [ ] Server logs show echo + notification creation
- [ ] User A receives notification within 5 seconds
- [ ] Modal appears with correct content
- [ ] Sound plays
- [ ] Reaction appears on Social Echo Timeline

---

## If Nothing Works

1. Clear browser cache and reload
2. Check notification preferences in Settings → Developer Tools
3. Verify both users are logged in with active sessions
4. Check Network tab for failed API calls
5. Verify Edge Function is running (check Supabase dashboard)

---

## Success Criteria ✅

- ✅ No WebSocket reconnection spam in logs
- ✅ Clean polling every 5 seconds
- ✅ Echo sent within 1 second
- ✅ Notification received within 5 seconds
- ✅ Modal appears with proper styling
- ✅ Sound and haptic feedback work
- ✅ Timeline shows reaction immediately after send
