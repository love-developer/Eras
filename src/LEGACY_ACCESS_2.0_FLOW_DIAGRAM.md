# 🔐 Legacy Access 2.0 - Complete Flow Diagram

## 📊 **System Architecture**

```
┌─────────────────────────────────────────────────────────────────┐
│                     LEGACY ACCESS 2.0                            │
│                  (Simplified Architecture)                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   STEP 1:    │─────>│   STEP 2:    │─────>│   STEP 3:    │
│ BENEFICIARIES│      │   TRIGGERS   │      │   SECURITY   │
└──────────────┘      └──────────────┘      └──────────────┘
      │                      │                      │
      │                      │                      │
      v                      v                      v
  [Add Person]          [Set Time]            [Automatic]
  [Verify Email]        [Grace Period]        [No Config]
  [Personal Msg]        [Activity Track]      [Transparent]
```

---

## 🌊 **User Journey**

### **Phase 1: Setup (60 seconds)**

```
USER OPENS SETTINGS
        │
        v
┌───────────────────────────────────────────────────────────┐
│  🔐 Legacy Access 2.0                                     │
│  ⚠️  Legal Disclaimer (read once)                         │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Step 1️⃣  Beneficiaries                              │ │
│  │ Step 2️⃣  Triggers                                   │ │
│  │ Step 3️⃣  Security                                   │ │
│  └─────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
        │
        v
   STEP 1: ADD BENEFICIARY
        │
        ├─> Enter Name: "Jane Doe"
        ├─> Enter Email: "jane@example.com"
        ├─> Enter Phone: "+1 555..." (optional)
        └─> Enter Message: "This is for you..." (optional)
        │
        v
   [Send Verification Email] Button
        │
        v
┌───────────────────────────────────────────────────────────┐
│  ✉️  Verification email sent to jane@example.com          │
│  📧 Token expires in 14 days                              │
└───────────────────────────────────────────────────────────┘
        │
        v
   STEP 2: SET TRIGGER
        │
        ├─> Option A: Inactivity Period
        │   ├─> 3 months
        │   ├─> 6 months ✅ (default)
        │   ├─> 12 months
        │   └─> 24 months
        │
        └─> Option B: Specific Date
            └─> Calendar picker
        │
        v
┌───────────────────────────────────────────────────────────┐
│  ⏱️  Trigger set: 6 months inactivity                     │
│  📊 Days until unlock: 180 days                           │
│  🛡️  30-day grace period automatic                        │
└───────────────────────────────────────────────────────────┘
        │
        v
   STEP 3: REVIEW SECURITY
        │
        v
┌───────────────────────────────────────────────────────────┐
│  ✅ Automatic Security Features:                          │
│  • Encrypted at rest (AES-256)                            │
│  • Email verification required                            │
│  • All access logged                                      │
│  • Grace period with cancel                               │
│  • Secure token-based unlock                              │
│                                                            │
│  ℹ️  No configuration needed!                             │
└───────────────────────────────────────────────────────────┘
        │
        v
   ✅ SETUP COMPLETE! (37 seconds)
```

---

## 📧 **Beneficiary Email Flow**

### **Verification Email**

```
JANE RECEIVES EMAIL
        │
        v
┌───────────────────────────────────────────────────────────┐
│  Subject: Verify Your Legacy Access Invitation            │
│                                                            │
│  Hi Jane,                                                  │
│                                                            │
│  [User Name] has designated you as a trusted beneficiary  │
│  for their Eras Legacy Access.                            │
│                                                            │
│  [ Verify Email ] ← Click here                            │
│                                                            │
│  This link expires in 14 days.                            │
└───────────────────────────────────────────────────────────┘
        │
        v
   JANE CLICKS LINK
        │
        v
   POST /api/legacy-access/verify
        │
        v
┌───────────────────────────────────────────────────────────┐
│  ✅ Email Verified!                                        │
│  You are now a verified beneficiary.                      │
└───────────────────────────────────────────────────────────┘
        │
        v
   JANE'S STATUS: "verified" ✅
```

---

## ⏰ **Inactivity Trigger Flow**

### **CRON Weekly Check**

```
EVERY SUNDAY AT MIDNIGHT (pg_cron)
        │
        v
   POST /api/legacy-access/cron/check-triggers
        │
        v
   FOR EACH USER:
        │
        ├─> Check lastActivityAt
        │
        ├─> If (now - lastActivityAt) >= inactivityMonths:
        │   │
        │   └─> START GRACE PERIOD
        │       │
        │       ├─> Set unlockScheduledAt = now + 30 days
        │       ├─> Set warningEmailSentAt = now
        │       └─> Send warning email to user
        │
        └─> If now >= unlockScheduledAt && !canceled:
            │
            └─> TRIGGER UNLOCK
                │
                ├─> Generate unlock tokens for beneficiaries
                ├─> Send unlock emails to beneficiaries
                └─> Mark unlockTriggeredAt = now
```

### **Warning Email (30 Days Before Unlock)**

```
USER RECEIVES EMAIL
        │
        v
┌───────────────────────────────────────────────────────────┐
│  ⚠️  Subject: Legacy Access Will Unlock in 30 Days        │
│                                                            │
│  You have been inactive for 6 months.                     │
│                                                            │
│  Your Legacy Access will unlock in 30 days unless you     │
│  log in or cancel.                                        │
│                                                            │
│  [ Cancel Unlock ] ← Click to cancel                      │
│  [ Log In Now ]                                           │
└───────────────────────────────────────────────────────────┘
        │
        ├─> USER LOGS IN ────> Activity tracked ─> Unlock canceled
        │
        └─> USER CLICKS "CANCEL UNLOCK"
                │
                v
           POST /api/legacy-access/cancel-unlock
                │
                v
           unlockCanceledAt = now
           unlockScheduledAt = null
```

---

## 🔓 **Unlock Flow (After Grace Period)**

### **Beneficiary Access**

```
GRACE PERIOD EXPIRES (USER INACTIVE)
        │
        v
   SYSTEM TRIGGERS UNLOCK
        │
        ├─> Generate unlock token for each verified beneficiary
        │   └─> tok_1234567890_abcdef123456
        │
        └─> Send unlock email to beneficiaries
        │
        v
┌───────────────────────────────────────────────────────────┐
│  📧 Subject: Legacy Access Unlocked                        │
│                                                            │
│  Hi Jane,                                                  │
│                                                            │
│  [User Name]'s Legacy Access has been unlocked.           │
│                                                            │
│  Personal Message:                                         │
│  "This is for you. Love, [User]"                          │
│                                                            │
│  [ Access Content ] ← Click here                          │
└───────────────────────────────────────────────────────────┘
        │
        v
   JANE CLICKS LINK
        │
        v
   https://eras.app/legacy-access/tok_1234567890_abcdef123456
        │
        v
   POST /api/legacy-access/unlock/validate
        │
        v
┌───────────────────────────────────────────────────────────┐
│  🔓 Legacy Access Unlocked                                 │
│                                                            │
│  Content from: [User Name]                                │
│                                                            │
│  📦 Time Capsules (12)                                     │
│  ├─> "Birthday Message 2025" [Download]                   │
│  ├─> "Wedding Day Memories" [Download]                    │
│  └─> ...                                                   │
│                                                            │
│  🗂️ Vault Folders (5)                                      │
│  ├─> "Family Photos" [Download ZIP]                       │
│  ├─> "Important Documents" [Download ZIP]                 │
│  └─> ...                                                   │
└───────────────────────────────────────────────────────────┘
        │
        v
   JANE DOWNLOADS CONTENT
        │
        v
   [Access logged to audit trail]
```

---

## 🗄️ **Data Flow**

### **Storage Architecture**

```
┌─────────────────────────────────────────────────────────┐
│                    SUPABASE KV STORE                     │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        v                 v                 v
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ legacy_access │  │ unlock_token  │  │ user_activity │
│  _{userId}    │  │  _{tokenId}   │  │   tracking    │
└───────────────┘  └───────────────┘  └───────────────┘
        │                 │                 │
        │                 │                 │
        v                 v                 v
   Config with        Unlock token      Activity logs
   beneficiaries      for verified      for auditing
   and triggers       access
```

### **Read/Write Patterns**

```
USER ACTIONS:
├─> Add Beneficiary
│   └─> WRITE legacy_access_{userId}
│
├─> Update Trigger
│   └─> WRITE legacy_access_{userId}
│
├─> Login/Activity
│   └─> UPDATE legacy_access_{userId}.trigger.lastActivityAt
│
└─> Remove Beneficiary
    └─> UPDATE legacy_access_{userId}.beneficiaries[].status = "revoked"

SYSTEM ACTIONS:
├─> CRON Check
│   └─> READ ALL legacy_access_*
│       └─> WRITE unlock_token_{tokenId} (if triggered)
│
└─> Validate Token
    └─> READ unlock_token_{tokenId}
        └─> UPDATE unlock_token_{tokenId}.usedAt
```

---

## 🔄 **State Machine**

### **Beneficiary Status**

```
    [Add Beneficiary]
            │
            v
    ┌──────────────┐
    │   PENDING    │ ← Initial state
    └──────────────┘
            │
            ├─> Verify Email ────> [VERIFIED] ✅
            │
            ├─> Token Expires ───> [PENDING] (can resend)
            │
            ├─> Reject Invite ───> [REJECTED] ❌
            │
            └─> User Removes ────> [REVOKED] 🚫
```

### **Trigger Status**

```
    [Set Trigger]
            │
            v
    ┌──────────────┐
    │    ACTIVE    │ ← Monitoring activity
    └──────────────┘
            │
            ├─> Threshold Reached ─> [GRACE PERIOD] ⏰
            │                             │
            │                             ├─> User Cancels ─> [ACTIVE]
            │                             │
            │                             └─> 30 Days Pass ─> [UNLOCKED] 🔓
            │
            └─> Manual Date Reached ───> [UNLOCKED] 🔓
```

---

## 📊 **UI Component Tree**

```
<LegacyAccessBeneficiaries>
    │
    ├─> <LegacyAccessDisclaimer />
    │   └─> Legal notice with amber styling
    │
    ├─> Progress Steps (1, 2, 3)
    │   ├─> Step 1: Beneficiaries (purple)
    │   ├─> Step 2: Triggers (orange)
    │   └─> Step 3: Security (green)
    │
    ├─> {activeStep === 1 && (
    │       <Step1Beneficiaries>
    │           ├─> <AddBeneficiaryCard>
    │           │   ├─> showAddForm ? <Form /> : <Button />
    │           │   └─> Name, Email, Phone, Message inputs
    │           │
    │           └─> <BeneficiaryList>
    │               └─> beneficiaries.map(b => (
    │                   <BeneficiaryCard>
    │                       ├─> Name + Status Badge
    │                       ├─> Contact Info
    │                       ├─> Personal Message
    │                       └─> Actions (Resend, Remove)
    │                   </BeneficiaryCard>
    │               ))
    │       </Step1Beneficiaries>
    │   )}
    │
    ├─> {activeStep === 2 && (
    │       <Step2Triggers>
    │           ├─> <TriggerTypeSelector>
    │           │   ├─> Inactivity Button
    │           │   └─> Manual Date Button
    │           │
    │           ├─> {type === 'inactivity' && (
    │           │       <InactivityConfig>
    │           │           ├─> Period Presets (3,6,12,24)
    │           │           └─> Activity Status Card
    │           │       </InactivityConfig>
    │           │   )}
    │           │
    │           └─> {type === 'date' && (
    │                   <DateConfig>
    │                       ├─> Date Input
    │                       └─> Date Preview Card
    │                   </DateConfig>
    │               )}
    │       </Step2Triggers>
    │   )}
    │
    └─> {activeStep === 3 && (
            <Step3Security>
                ├─> <AutoSecurityFeatures>
                │   └─> Checkmarks for all features
                │
                ├─> <NoConfigNeeded>
                │   └─> Info message
                │
                └─> <SetupComplete>
                    ├─> Success icon
                    ├─> Status message
                    └─> Review buttons
                </SetupComplete>
            </Step3Security>
        )}
</LegacyAccessBeneficiaries>
```

---

## 🎨 **Styling Architecture**

```
ERAS GLASSMORPHIC DESIGN
        │
        ├─> Colors:
        │   ├─> Purple (#9b5dfc) - Primary
        │   ├─> Pink (#ff6b9d) - Accent
        │   ├─> Orange (#ff9500) - Warning
        │   ├─> Green (#10b981) - Success
        │   └─> Amber (#f59e0b) - Alert
        │
        ├─> Gradients:
        │   ├─> from-purple-50 to-pink-50 (light)
        │   ├─> from-purple-950/20 to-pink-950/20 (dark)
        │   └─> from-purple-600 to-pink-600 (buttons)
        │
        ├─> Borders:
        │   ├─> border-2 for emphasis
        │   └─> border-purple-200 dark:border-purple-800
        │
        ├─> Shadows:
        │   ├─> shadow-lg for active steps
        │   └─> hover:shadow-md for cards
        │
        └─> Animations:
            ├─> animate-fade-in-up (step transitions)
            ├─> animate-pulse (activity indicator)
            └─> transition-all (hover states)
```

---

## ✅ **Success Indicators**

```
┌─────────────────────────────────────────────────────────┐
│  Setup Complete When:                                    │
│  ✅ At least 1 beneficiary added                         │
│  ✅ At least 1 beneficiary verified (ideal)              │
│  ✅ Trigger configured (inactivity or date)              │
│  ✅ User acknowledges legal disclaimer                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Ready for Unlock When:                                  │
│  ✅ At least 1 verified beneficiary                      │
│  ✅ Trigger conditions met (inactivity threshold)        │
│  ✅ Grace period completed (30 days)                     │
│  ✅ User did not cancel unlock                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Beneficiary Can Access When:                            │
│  ✅ Unlock triggered by system                           │
│  ✅ Valid unlock token received                          │
│  ✅ Token not expired (<1 year)                          │
│  ✅ Email verified                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 **Deployment Checklist**

```
PHASE 1 (Complete ✅):
├─> Backend service
├─> API routes
├─> Frontend component
├─> Legal disclaimer
└─> KV schema

PHASE 2 (TODO ⏳):
├─> Email integration (Resend)
├─> CRON setup (pg_cron)
├─> Beneficiary unlock page
├─> Achievement integration
└─> Warning email system
```

---

**Last Updated:** November 12, 2025
**Status:** ✅ Phase 1 Complete, Ready for Testing!
