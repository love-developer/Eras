# 📧 Request Verification Page - User Guide

## What is it?

The **Request Verification Page** is a self-service tool for legacy beneficiaries who have lost or can't find their original verification email. It allows them to request a new verification link without needing to contact the account owner (who may be deceased or unreachable).

---

## 🌐 How to Access

**URL**: `https://found-shirt-81691824.figma.site/request-verification`

**Who can use it**: Anyone who has been designated as a legacy beneficiary

**When to use it**:
- Lost the original verification email
- Email went to spam and was deleted
- Verification link was on old device/computer
- Changed email providers
- Just need a fresh link

---

## 🎨 Page Design & User Experience

### Initial State - Request Form

```
┌─────────────────────────────────────────────┐
│         [Mail Icon in Purple Circle]        │
│                                             │
│       Request Verification Link             │
│                                             │
│  Enter your email to receive a new          │
│  legacy beneficiary verification link       │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ ℹ️ WHY AM I HERE?                    │ │
│  │ If you've been designated as a        │ │
│  │ legacy beneficiary and lost your      │ │
│  │ verification email, use this page     │ │
│  │ to request a new link.                │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  Email Address                              │
│  ┌───────────────────────────────────────┐ │
│  │ your.email@example.com               │ │
│  └───────────────────────────────────────┘ │
│  Enter the email associated with your role  │
│                                             │
│      [Send Verification Link Button]        │
│                                             │
│  ──────────────────────────────────────────│
│                                             │
│  ✅ No expiration - verify anytime         │
│  ✅ Secure rate limiting (3 requests/day)  │
│  ✅ Privacy protected                       │
│                                             │
│         ← Back to Homepage                  │
└─────────────────────────────────────────────┘
```

### Success State - Confirmation

```
┌─────────────────────────────────────────────┐
│      [Green Checkmark in Circle]            │
│                                             │
│           Check Your Email                  │
│                                             │
│  If your email is registered as a           │
│  beneficiary, you'll receive a new          │
│  verification link shortly.                 │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ 🕐 WHAT HAPPENS NEXT?                │ │
│  │                                       │ │
│  │ • Check inbox (and spam folder)      │ │
│  │ • Click verification link            │ │
│  │ • Link never expires - verify anytime│ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ ⚠️ RATE LIMIT                        │ │
│  │ You can request up to 3 links per day│ │
│  │ If you need help, contact support    │ │
│  └───────────────────────────────────────┘ │
│                                             │
│      [← Request Another Link]               │
│      [Go to Homepage]                       │
│                                             │
│  Need help? Contact Support                 │
└─────────────────────────────────────────────┘
```

---

## 🔄 Complete User Flow

### Step-by-Step Journey:

```
1. Beneficiary receives initial email
   ↓
2. Email lost/deleted/can't find
   ↓
3. Remembers (or is told) about request-verification page
   ↓
4. Visits: found-shirt-81691824.figma.site/request-verification
   ↓
5. Sees clean form with explanation
   ↓
6. Enters email address: "john@example.com"
   ↓
7. Clicks "Send Verification Link"
   ↓
8. Loading state shows (spinner + "Sending...")
   ↓
9. Success! Confirmation screen appears
   ↓
10. Checks email inbox (arrives within 1-2 minutes)
   ↓
11. Finds new verification email
   ↓
12. Clicks link → Taken to verify-beneficiary page
   ↓
13. Verification successful! ✅
```

---

## 🛡️ Privacy & Security Features

### What the Page DOES:

✅ Validates email format before submitting  
✅ Shows loading state during request  
✅ Displays success message (generic for security)  
✅ Enforces 3 requests per day limit  
✅ Shows clear error if rate limit exceeded  
✅ Provides support contact info  

### What the Page DOESN'T DO:

❌ **Doesn't reveal if email exists** in system (privacy protection)  
❌ **Doesn't show beneficiary details** (who added them, when, etc.)  
❌ **Doesn't allow unlimited requests** (rate limiting prevents abuse)  
❌ **Doesn't require login** (public endpoint for accessibility)  

---

## 🎯 Integration with Existing System

### Backend Connection:

```typescript
// Frontend makes POST request to:
POST /make-server-f9be53a7/api/public/legacy-access/request-verification

// Request body:
{
  "email": "beneficiary@example.com"
}

// Response (always 200 unless rate limited):
{
  "success": true,
  "message": "If your email is registered..."
}
```

### What Happens on Backend:

1. **Rate limit check**: Has this email made 3+ requests today?
2. **Search for beneficiary**: Scan all legacy access configs
3. **Match found?**: 
   - ✅ YES: Generate new token, send email
   - ❌ NO: Return generic success message (privacy)
4. **Token generation**: Preserves original `notificationContext`
   - Unlock context → NO EXPIRATION
   - Immediate/manual → 30 days
5. **Email sent**: Uses same template as original notification
6. **Increment counter**: Track request for rate limiting

---

## 📧 Email That Gets Sent

When a beneficiary requests a new link, they receive the **same verification email template** they originally received, with these key points:

### Subject Line:
"🛡️ New Verification Link - Legacy Beneficiary - Eras"

### Key Sections:
1. **Header**: You've Been Designated as a Legacy Beneficiary
2. **Intro**: Who designated them and when
3. **Personal Message**: If owner left one
4. **Big Button**: "Verify Email & Accept Role"
5. **Important Note**: Link expiration info (or lack thereof)
6. **Footer**: Designated date

---

## 🚨 Error Handling

### Scenario 1: Invalid Email Format
```
User enters: "notanemail"
→ Frontend validation catches it
→ Red toast: "Please enter a valid email address"
→ Form not submitted
```

### Scenario 2: Rate Limit Exceeded (4th request in a day)
```
User clicks submit 4th time
→ Backend returns 429 status
→ Red toast: "Too many requests. You can request up to 3 links per day. Please try again tomorrow."
→ Form remains active (can try tomorrow)
```

### Scenario 3: Network Error
```
Request fails due to connectivity
→ Catch block triggers
→ Red toast: "Failed to send request. Please try again."
→ Form remains active (can retry)
```

### Scenario 4: Email Not Found (But Doesn't Tell User)
```
User enters: "notabeneficiary@example.com"
→ Backend searches, finds nothing
→ Returns: 200 OK with success message
→ Green toast: "Request sent! Check your email."
→ User sees success screen
→ No email arrives (they'll realize it's not registered)
```

---

## 💡 User Education & Discovery

### How Beneficiaries Learn About This Page:

1. **Reminder emails** include a link to `/request-verification`
2. **Verification email footer** can include this as a backup option
3. **Support documentation** links to this page
4. **Direct URL** shared by account owners or support team
5. **Error page** when clicking expired link (future enhancement)

### Recommended Communication:

**To beneficiaries**:
> "Lost your verification email? No problem! Visit our self-service page to request a new link anytime: https://found-shirt-81691824.figma.site/request-verification"

**In reminder emails**:
> "💡 Lost the link? You can request a new verification link anytime at: [link]"

**In support responses**:
> "You can request a new verification link yourself at [link]. You're allowed 3 requests per day."

---

## 📱 Responsive Design

### Mobile Experience:
- Full-width form on small screens
- Touch-optimized button sizes (48px minimum)
- Readable text (16px base font size)
- No horizontal scrolling
- Comfortable padding for thumb zones

### Desktop Experience:
- Centered card (max-width: 600px)
- Comfortable reading width
- Spacious layout
- Hover states on interactive elements

---

## 🔗 Related Pages & Features

### From Request-Verification Page, Users Can:
- Go to homepage (button at bottom)
- Contact support (email link)
- Submit another request (after success)

### Request-Verification Page Links TO:
- **Homepage**: `/` (back button)
- **Support email**: `mailto:support@erastimecapsule.com`

### Request-Verification Page Links FROM:
- **Reminder emails**: Direct link in email body
- **Support articles**: Documentation references
- **Error pages**: Future enhancement (expired link notice)

---

## 🧪 Testing Scenarios

### Manual Testing Checklist:

✅ **Basic Flow**:
1. Navigate to `/request-verification`
2. Enter valid email
3. Click submit
4. Verify success screen appears
5. Check email inbox
6. Verify email received

✅ **Validation**:
1. Enter invalid email format
2. Verify frontend blocks submission
3. See error toast

✅ **Rate Limiting**:
1. Submit 3 requests quickly
2. All succeed
3. 4th request fails with 429
4. Error toast shows limit message

✅ **Responsive**:
1. Test on mobile (375px width)
2. Test on tablet (768px width)
3. Test on desktop (1440px width)
4. Verify no layout breaks

✅ **Email Delivery**:
1. Request link with real email
2. Check inbox within 2 minutes
3. Verify email arrives
4. Verify link works

---

## 📊 Success Metrics

### What to Track:

1. **Usage Rate**: How many requests per day?
2. **Conversion Rate**: % who verify after requesting?
3. **Rate Limit Hits**: How often do users hit the 3/day limit?
4. **Support Tickets**: Has this reduced "lost email" tickets?
5. **Error Rate**: How often does the request fail?

### Expected Behavior:

- **Low usage** = Good (means original emails are working)
- **High conversion** = Good (means self-service works)
- **Few rate limit hits** = Good (not being abused)
- **Reduced tickets** = Great (achieving goal)

---

## 🎉 Summary

### What This Page Solves:

**Problem**: Beneficiaries lose verification emails and can't complete the process. When vault unlocks after owner's death, there's no way to resend.

**Solution**: Self-service page where beneficiaries can request new verification links anytime, with no expiration on unlock-context tokens.

### Key Benefits:

🎯 **24/7 availability** - No need to wait for support  
❤️ **Respectful design** - No pressure, clear instructions  
🛡️ **Privacy-first** - Doesn't leak information  
📧 **Preserves intent** - Token policies stay the same  
🚀 **Zero friction** - Simple 2-field form  

### Integration Summary:

| Component | Status | Location |
|-----------|--------|----------|
| **Frontend Page** | ✅ Complete | `/pages/RequestVerification.tsx` |
| **Backend Endpoint** | ✅ Complete | `/api/public/legacy-access/request-verification` |
| **Email Template** | ✅ Complete | `beneficiary-verification` (reused) |
| **Rate Limiting** | ✅ Complete | Server-side (3/day) |
| **Routing** | ✅ Complete | `/App.tsx` route handler |

---

**Status**: ✅ **Production Ready**  
**User-Facing**: ✅ **Yes**  
**Support Documentation**: ✅ **This Document**

🎊 The request-verification page is a perfect example of empathetic design - it anticipates real-world problems and provides a respectful, privacy-conscious solution.
