# Echo System: Two-Way Conversation Feature

## Overview
The Echo system now supports **full two-way conversations** between capsule senders and recipients. Both parties can send emoji reactions and text notes to each other, creating an interactive dialogue around delivered capsules.

---

## 🎯 Key Features

### **1. Recipients Can Send Echoes**
- When viewing a **received capsule**, recipients see the EchoPanel
- Can send emoji reactions (❤️ 😂 😢 🎉 😮 ✨)
- Can send text notes (up to 500 characters)
- Sender gets email notification

### **2. Senders Can Respond**
- When viewing a **delivered capsule**, senders see the EchoPanel
- Same capabilities: emoji reactions and text notes
- All recipients get email notifications
- Creates ongoing conversation

### **3. Social Timeline Shows All**
- Both senders and recipients see all echoes in chronological order
- Real-time updates via Supabase Broadcast Channels
- Facebook/Instagram-style emoji grouping
- Shows sender names and timestamps

---

## 🔧 Technical Implementation

### **Frontend Changes**

#### **CapsuleDetailModal.tsx**
Two EchoPanel instances based on user role:

**For Recipients (viewing received capsules):**
```typescript
{!canEdit && capsule.id && capsule.status?.toLowerCase() === 'received' && capsule.allow_echoes !== false && (
  <div className="animate-content-fade-in" style={{ animationDelay: '900ms' }}>
    <EchoPanel capsuleId={capsule.id} />
  </div>
)}
```

**For Senders (viewing delivered capsules):**
```typescript
{canEdit && capsule.id && capsule.status?.toLowerCase() === 'delivered' && capsule.allow_echoes !== false && (
  <div className="animate-content-fade-in" style={{ animationDelay: '900ms' }}>
    <Card className="border-blue-500/30 bg-gradient-to-br from-blue-950/20 to-indigo-950/20 overflow-hidden"
      style={{ backdropFilter: 'blur(10px)' }}>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2 text-blue-300">
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Respond to your recipients' echoes</span>
        </div>
        <EchoPanel capsuleId={capsule.id} />
      </CardContent>
    </Card>
  </div>
)}
```

**Visual Distinction:**
- Recipients: Standard EchoPanel styling
- Senders: Blue gradient card with helper text for context

---

### **Backend Changes**

#### **Updated Authorization Logic** (`/supabase/functions/server/index.tsx`)

**Before:**
```typescript
// Verify user is a recipient (not the sender)
const isRecipient = capsule.recipients?.some((r: any) => 
  r.email === user.email || r.phone === user.phone_number
) || (capsule.recipient_type === 'self' && capsule.userId === user.id);

if (!isRecipient) {
  console.error(`💫 [Echo] User ${user.id} is not a recipient of capsule ${capsuleId}`);
  return c.json({ error: "You must be a recipient to send an echo" }, 403);
}
```

**After:**
```typescript
// Verify user is EITHER the sender OR a recipient (both can send echoes for two-way conversation)
const isSender = capsule.userId === user.id;
const isRecipient = capsule.recipients?.some((r: any) => 
  r.email === user.email || r.phone === user.phone_number
) || (capsule.recipient_type === 'self' && capsule.userId === user.id);

if (!isSender && !isRecipient) {
  console.error(`💫 [Echo] User ${user.id} is neither sender nor recipient of capsule ${capsuleId}`);
  return c.json({ error: "You must be a sender or recipient to send an echo" }, 403);
}
```

**Key Change:** Now allows BOTH senders and recipients to send echoes

---

#### **Smart Email Notifications**

**When Recipient Sends Echo:**
- Notifies the capsule **sender** only
- Email shows who sent the echo and preview

**When Sender Responds:**
- Notifies **ALL recipients**
- Each recipient gets individual notification
- Creates group conversation dynamic

**Implementation:**
```typescript
// Send email notifications based on who sent the echo
try {
  const echoPreview = type === 'emoji' ? content : 
    content.length > 100 ? `${content.substring(0, 100)}...` : content;
  
  if (isSender) {
    // If capsule SENDER sent the echo, notify ALL recipients
    console.log(`📧 Sender sent echo, notifying recipients`);
    
    if (capsule.recipients && capsule.recipients.length > 0) {
      for (const recipient of capsule.recipients) {
        if (recipient.email) {
          try {
            await EmailService.sendEchoNotification({
              recipientEmail: recipient.email,
              recipientName: recipient.name || 'there',
              echoerName: senderName,
              capsuleTitle: capsule.title || 'Your capsule',
              echoType: type,
              echoContent: echoPreview,
              capsuleId
            });
            console.log(`📧 Echo notification sent to recipient ${recipient.email}`);
          } catch (err) {
            console.error(`📧 Failed to notify recipient ${recipient.email}:`, err);
          }
        }
      }
    }
  } else {
    // If RECIPIENT sent the echo, notify the capsule sender
    console.log(`📧 Recipient sent echo, notifying sender`);
    const capsuleSenderId = capsule.userId;
    const senderProfile = await kv.get(`user:${capsuleSenderId}:profile`) || {};
    const senderEmail = senderProfile.email || capsule.userEmail;
    
    if (senderEmail) {
      await EmailService.sendEchoNotification({
        recipientEmail: senderEmail,
        recipientName: senderProfile.name || 'there',
        echoerName: senderName,
        capsuleTitle: capsule.title || 'Your capsule',
        echoType: type,
        echoContent: echoPreview,
        capsuleId
      });
      
      console.log(`📧 Echo notification sent to sender ${senderEmail}`);
    }
  }
} catch (emailError) {
  console.error("📧 Failed to send echo notification email:", emailError);
  // Don't fail the request if email fails
}
```

---

## 📱 User Experience

### **Conversation Flow Example**

1. **Day 1:** Sender creates capsule, schedules for future delivery
2. **Delivery Day:** Capsule delivered to recipient
3. **Recipient's Turn:**
   - Opens received capsule
   - Sees message/media
   - Sends echo: "❤️ This brought tears to my eyes!"
   - Sender gets email notification
4. **Sender's Turn:**
   - Opens delivered capsule
   - Sees recipient's echo in timeline
   - Sees blue "Respond to your recipients' echoes" panel
   - Sends echo: "😊 I'm so glad! That memory means a lot to me too"
   - Recipient gets email notification
5. **Ongoing Dialogue:**
   - Both parties can continue responding
   - Timeline shows full conversation history
   - Real-time updates for both parties

---

## 🎨 Visual Design

### **Recipient View (Received Capsule)**
- Standard EchoPanel with cosmic gradient background
- "Send an Echo" heading with Sparkles icon
- 6 quick emoji buttons (3x2 grid)
- "Add a Note" button for text echoes

### **Sender View (Delivered Capsule)**
- **Blue gradient wrapper card** for visual distinction
- **MessageCircle icon** + helper text
- Same EchoPanel inside
- Signals "this is your response area"

### **Social Timeline (Both Views)**
- Shows ALL echoes from all participants
- Emoji grouping (e.g., "❤️ 3 | Sarah, John, You")
- Text notes with sender names and timestamps
- Real-time animation when new echoes arrive

---

## 🔐 Security & Privacy

### **Authorization Checks**
- ✅ Only capsule sender can respond on delivered capsules
- ✅ Only recipients can respond on received capsules
- ✅ Cannot send echoes on capsules with `allow_echoes: false`
- ✅ Email verification via Supabase auth

### **Data Validation**
- Emoji reactions: Must be from predefined set
- Text notes: Max 500 characters
- Capsule must exist and be delivered/received
- User must be authenticated

---

## 🚀 Real-Time Updates

### **Supabase Broadcast Channels**
- Channel per capsule: `echoes:${capsuleId}`
- Broadcasts when new echo sent
- All viewers (sender + recipients) get instant updates
- Fallback to polling if broadcast fails

### **Event Flow**
1. User sends echo → POST `/echoes/send`
2. Backend validates, stores in KV
3. Backend broadcasts to channel `echoes:${capsuleId}`
4. All connected clients receive broadcast
5. EchoSocialTimeline updates in real-time
6. Email notifications sent asynchronously

---

## 📊 Achievement Tracking

- `echo_sent` achievement tracked for both senders and recipients
- Counts toward "Social Butterfly" and similar achievements
- No distinction between sender/recipient echoes for tracking

---

## 🐛 Edge Cases Handled

1. **Capsule with no recipients:** Sender sees timeline but panel is informational only
2. **Recipient without profile:** Uses email prefix as display name
3. **Email notification failure:** Logs error but doesn't fail echo send
4. **Broadcast failure:** Falls back to polling mechanism
5. **Duplicate echo prevention:** Frontend disables after first emoji reaction

---

## 🔮 Future Enhancements

### **Potential Features:**
- [ ] Reply directly to specific echoes (threaded conversations)
- [ ] Photo/video echoes (not just emoji + text)
- [ ] Reaction analytics (most popular emoji, etc.)
- [ ] "Mark all as read" functionality
- [ ] Echo notifications in-app (not just email)
- [ ] @mentions in text echoes
- [ ] Echo search/filter

---

## ✅ Testing Checklist

- [x] Recipient can send emoji echo on received capsule
- [x] Recipient can send text echo on received capsule
- [x] Sender receives email when recipient sends echo
- [x] Sender can send emoji echo on delivered capsule
- [x] Sender can send text echo on delivered capsule
- [x] Recipients receive email when sender responds
- [x] Social timeline shows all echoes for both parties
- [x] Real-time updates work for both sender and recipients
- [x] Allow_echoes: false prevents all echo sending
- [x] Authorization prevents non-participants from sending echoes

---

## 📝 Summary

The Echo system now enables **genuine two-way conversations** between capsule creators and recipients. This transforms time capsules from static deliveries into living, interactive experiences where both parties can share reactions, memories, and ongoing dialogue around meaningful moments.

**Key Benefits:**
- ✨ More engaging recipient experience
- 💬 Senders can respond to feedback
- 🔄 Continuous conversation thread
- 📧 Smart email notifications for both parties
- ⚡ Real-time updates via broadcast channels

The implementation maintains the original Echo system's simplicity while opening up rich conversational possibilities!
