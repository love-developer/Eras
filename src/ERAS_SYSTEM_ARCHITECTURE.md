# 🌟 ERAS - Complete System Architecture Diagram

**Version:** 2.0  
**Last Updated:** November 25, 2025  
**Purpose:** Comprehensive architecture map for error reporting and testing

---

## 📊 HIGH-LEVEL SYSTEM OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ERAS TIME CAPSULE APP                        │
│                    (React + TypeScript + Tailwind)                   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
            ┌───────▼──────┐  ┌────▼─────┐  ┌─────▼──────┐
            │   Frontend    │  │ Backend  │  │  Storage   │
            │  Components   │  │ Services │  │  & Database│
            └───────────────┘  └──────────┘  └────────────┘
```

---

## 🎨 FRONTEND ARCHITECTURE

### **1. AUTHENTICATION & USER MANAGEMENT**
```
/components/Auth.tsx
├── Sign Up Flow
│   ├── Email/Password Registration
│   ├── OAuth (Google, Facebook, GitHub)
│   ├── Email Verification
│   └── Profile Setup
│
├── Sign In Flow
│   ├── Email/Password Login
│   ├── OAuth Login
│   ├── Remember Me
│   └── 2FA Verification (if enabled)
│
├── Password Management
│   ├── Password Reset Request
│   ├── Reset Email Delivery
│   └── New Password Set
│
└── Session Management
    ├── JWT Token Storage
    ├── Auto-Refresh
    └── Session Expiry
```

---

### **2. MAIN NAVIGATION & LAYOUT**
```
/App.tsx
├── Navigation Bar
│   ├── Logo & Branding
│   ├── Tab Switcher (Home/Record/Vault/Settings)
│   ├── Notification Bell (Real-time)
│   └── Profile Avatar
│
├── Main Content Area
│   ├── Dynamic Tab Rendering
│   ├── Scroll Management
│   └── State Persistence
│
└── Modals & Overlays
    ├── Capsule Portal Overlay
    ├── Notification Center
    ├── Achievement Toasts
    └── Confirmation Dialogs
```

---

### **3. HOME TAB - DASHBOARD**
```
/components/Dashboard.tsx
├── Statistics Cards
│   ├── Scheduled Capsules (Orange)
│   ├── Delivered Capsules (Green)
│   ├── Received Capsules (Yellow/Gold)
│   ├── Draft Capsules (Purple)
│   └── All Capsules (Cyan/Teal)
│
├── Capsule Filtering System
│   ├── Filter by Status
│   ├── Filter by Type (Self/Others)
│   └── Active Filter State
│
├── Capsule Grid Display
│   ├── CapsuleCard Components (Memoized)
│   ├── Pagination (10 per page)
│   ├── Load More Button
│   └── Empty States
│
└── Actions
    ├── View Capsule Details
    ├── Edit Capsule
    ├── Delete Capsule
    └── Open Capsule Portal
```

---

### **4. RECORD TAB - CAPSULE CREATION**
```
/components/CreateCapsule.tsx
├── Step 1: Basic Information
│   ├── Title Input
│   ├── Text Message Editor
│   │   ├── AI Text Enhancement Button
│   │   ├── Rich Text Support
│   │   └── Character Counter
│   └── Delivery Date/Time Picker
│       ├── Date Calendar
│       ├── Time Selector
│       └── Timezone Detection
│
├── Step 2: Media Upload (Phase 1B Advanced Upload)
│   ├── Drag & Drop Zone
│   ├── Multi-File Selection
│   ├── File Type Detection
│   │   ├── Photos (.jpg, .png, .gif, .webp)
│   │   ├── Videos (.mp4, .webm, .mov)
│   │   └── Audio (.mp3, .wav, .m4a, .ogg)
│   │
│   ├── Upload Progress Tracking
│   │   ├── Individual File Progress
│   │   ├── Overall Progress
│   │   └── Upload Speed Indicator
│   │
│   ├── Media Preview & Management
│   │   ├── Thumbnail Grid
│   │   ├── Remove Files
│   │   ├── Reorder Files (Drag & Drop)
│   │   └── File Details (Name, Size, Type)
│   │
│   └── Media Processing
│       ├── Automatic Compression
│       ├── Format Conversion
│       └── Thumbnail Generation
│
├── Step 3: Advanced Features
│   ├── Visual Filters (Phase 4)
│   │   ├── Vintage Filter
│   │   ├── Noir Filter
│   │   ├── Warm Filter
│   │   ├── Cool Filter
│   │   └── Vibrant Filter
│   │
│   ├── Audio Recording
│   │   ├── Microphone Selection
│   │   ├── Record/Pause/Stop
│   │   ├── Waveform Visualization
│   │   ├── Playback Preview
│   │   └── Duration Limit (5 min)
│   │
│   └── Vault Assignment
│       ├── Vault Selector
│       └── Create New Vault
│
├── Step 4: Recipients & Delivery
│   ├── Recipient Type Selection
│   │   ├── Self Delivery
│   │   └── Send to Others
│   │
│   ├── Recipient Management
│   │   ├── Add Recipients (Email)
│   │   ├── Recipient List
│   │   ├── Remove Recipients
│   │   └── Validation (Email Format)
│   │
│   └── Self Contact Setup
│       └── Email Address Input
│
└── Capsule Actions
    ├── Save as Draft
    ├── Schedule Delivery
    ├── Cancel/Reset
    └── Backend Submission
```

---

### **5. VAULT TAB - ORGANIZATION & LEGACY**
```
/components/Vault.tsx
├── Legacy Vault System
│   ├── Vault Grid Display
│   ├── Vault Cards
│   │   ├── Vault Icon
│   │   ├── Vault Name
│   │   ├── Capsule Count
│   │   └── Last Updated
│   │
│   ├── Vault Management
│   │   ├── Create Vault Modal
│   │   ├── Edit Vault
│   │   ├── Delete Vault
│   │   └── Vault Details View
│   │
│   └── Capsule Organization
│       ├── Assign Capsules to Vaults
│       ├── Move Between Vaults
│       └── Remove from Vault
│
├── Legacy Titles System
│   ├── Title Assignment UI
│   ├── Beneficiary Management
│   │   ├── Add Beneficiaries
│   │   ├── Beneficiary Details
│   │   ├── Access Rules
│   │   └── Remove Beneficiaries
│   │
│   └── Backend Management
│       ├── Server-Side Validation
│       ├── Title Storage
│       └── Access Control Logic
│
└── Vault Navigation
    ├── Breadcrumb Navigation
    ├── Back to Vaults
    └── Filter Capsules by Vault
```

---

### **6. SETTINGS TAB - CONFIGURATION**
```
/components/Settings.tsx
├── Profile Settings
│   ├── Display Name
│   ├── First Name / Last Name
│   ├── Email (Read-only)
│   ├── Bio
│   ├── Profile Picture Upload
│   └── Save Profile Button
│       └── Backend: /make-server/save-profile
│
├── Security Settings
│   ├── Change Password
│   │   ├── Current Password
│   │   ├── New Password
│   │   ├── Confirm Password
│   │   └── Backend: /make-server/change-password
│   │
│   └── Two-Factor Authentication (2FA)
│       ├── Enable 2FA
│       ├── QR Code Display
│       ├── Verification Code Input
│       ├── Backup Codes
│       └── Backend: /make-server/enable-2fa
│
├── Storage Settings
│   ├── Storage Usage Display
│   ├── Storage Limit
│   ├── Media Cleanup Options
│   └── Backend: /make-server/save-storage-settings
│
├── Notification Settings
│   ├── Email Notifications
│   │   ├── Delivery Confirmations
│   │   ├── Achievement Unlocks
│   │   └── Echo Notifications
│   │
│   ├── In-App Notifications
│   │   ├── Real-time Alerts
│   │   ├── Achievement Popups
│   │   └── Echo Timeline Updates
│   │
│   └── Backend: /make-server/save-notification-settings
│
├── Account Management
│   ├── Export Data
│   ├── Download Archive
│   └── Delete Account
│       ├── Confirmation Dialog
│       ├── Password Verification
│       └── Backend: /make-server/delete-account
│
└── Legal & Support
    ├── Terms of Service Link
    ├── Privacy Policy Link
    ├── Help & Support
    └── Version Information
```

---

### **7. CAPSULE PORTAL OVERLAY SYSTEM**
```
/components/CapsulePortalOverlay.tsx
├── Portal Trigger
│   ├── Click on Capsule Card
│   └── Open Portal Animation
│
├── Portal Content Display
│   ├── Header Section
│   │   ├── Capsule Title
│   │   ├── Delivery Date
│   │   ├── Status Badge
│   │   └── Close Button
│   │
│   ├── Media Gallery
│   │   ├── Photo Viewer
│   │   ├── Video Player (HTML5)
│   │   ├── Audio Player with Waveform
│   │   └── Navigation Controls
│   │
│   ├── Text Message Section
│   │   ├── Message Display
│   │   └── Typography Styling
│   │
│   └── Metadata Section
│       ├── Created Date
│       ├── Recipient Info
│       ├── Vault Assignment
│       └── Capsule ID
│
├── Actions Bar
│   ├── Edit Capsule
│   ├── Share Capsule
│   ├── Add Echo (Reaction)
│   └── Delete Capsule
│
└── Keyboard Navigation
    ├── Escape to Close
    ├── Arrow Keys for Media
    └── Tab Navigation
```

---

### **8. CAPSULE ECHOES SYSTEM**
```
/components/CapsuleEchoes.tsx
├── Echo Interface (Facebook-style Reactions)
│   ├── Reaction Picker
│   │   ├── ❤️ Heart
│   │   ├── 🎉 Celebrate
│   │   ├── 😢 Touched
│   │   ├── 😂 Joy
│   │   ├── 🤔 Thoughtful
│   │   └── 👏 Applause
│   │
│   ├── Reaction Display
│   │   ├── Reaction Counts
│   │   ├── User Avatars
│   │   └── Animation on Add/Remove
│   │
│   └── Comment System
│       ├── Comment Input
│       ├── Comment List
│       ├── Edit Comments
│       ├── Delete Comments
│       └── Timestamps
│
├── Social Echo Timeline
│   ├── Chronological Feed
│   ├── Echo Cards
│   │   ├── Capsule Preview
│   │   ├── Reaction Summary
│   │   ├── Comment Preview
│   │   └── Timestamp
│   │
│   └── Filtering
│       ├── All Echoes
│       ├── My Echoes
│       └── Received Echoes
│
└── Backend Integration
    ├── POST /make-server/echoes/add-reaction
    ├── DELETE /make-server/echoes/remove-reaction
    ├── POST /make-server/echoes/add-comment
    ├── PUT /make-server/echoes/edit-comment
    ├── DELETE /make-server/echoes/delete-comment
    └── GET /make-server/echoes/timeline
```

---

### **9. NOTIFICATION SYSTEM**
```
/components/NotificationCenter.tsx (Phase 1C)
├── Floating Portal Hub Design
│   ├── Notification Bell Icon
│   ├── Unread Badge Counter
│   └── Click to Expand
│
├── Notification Panel
│   ├── Header
│   │   ├── "Notifications" Title
│   │   ├── Mark All as Read
│   │   └── Close Button
│   │
│   ├── Notification List (Scrollable)
│   │   ├── Notification Cards
│   │   │   ├── Icon (by Type)
│   │   │   ├── Title & Message
│   │   │   ├── Timestamp (Relative)
│   │   │   ├── Read/Unread State
│   │   │   └── Action Button (if applicable)
│   │   │
│   │   └── Notification Types
│   │       ├── received_capsule (🎁)
│   │       ├── achievement_unlocked (🏆)
│   │       ├── echo_added (💬)
│   │       ├── delivery_success (✅)
│   │       └── delivery_failed (❌)
│   │
│   └── Empty State
│       └── "No notifications"
│
├── Real-Time Updates (WebSocket)
│   ├── Connection Management
│   ├── Event Listeners
│   ├── Auto-Reconnect Logic
│   └── Toast Notifications
│
└── Backend Integration
    ├── GET /make-server/notifications/list
    ├── POST /make-server/notifications/mark-read
    ├── POST /make-server/notifications/mark-all-read
    └── WebSocket: /make-server/ws/notifications
```

---

### **10. ACHIEVEMENT SYSTEM**
```
/components/AchievementDisplay.tsx
├── Achievement Toast Notifications
│   ├── Unlock Animation
│   ├── Achievement Icon
│   ├── Achievement Name
│   ├── Description
│   └── Auto-Dismiss (5s)
│
├── Achievement Gallery
│   ├── Grid Layout
│   ├── Achievement Cards
│   │   ├── Locked State (Grayed Out)
│   │   ├── Unlocked State (Colored)
│   │   ├── Progress Bar (if applicable)
│   │   └── Unlock Date
│   │
│   └── Achievement Categories
│       ├── Capsule Milestones
│       ├── Social Achievements
│       ├── Time-Based Achievements
│       └── Special Achievements
│
├── Achievement Tracking
│   ├── Client-Side Progress Display
│   └── Server-Side Validation
│
└── Achievement Definitions
    ├── "First Steps" - Create first capsule
    ├── "Time Traveler" - Schedule 10 capsules
    ├── "Memories Keeper" - Upload 50 media files
    ├── "From the Past" - Receive first capsule
    ├── "Echo Chamber" - Add 10 reactions
    ├── "Vault Master" - Create 5 vaults
    └── "Legacy Builder" - Assign legacy title
```

---

### **11. AI ENHANCEMENT FEATURES**
```
/components/AITextEnhancer.tsx
├── Text Enhancement Modal
│   ├── Original Text Display
│   ├── Enhancement Options
│   │   ├── Make More Emotional
│   │   ├── Make More Formal
│   │   ├── Add Nostalgia
│   │   ├── Simplify
│   │   └── Expand
│   │
│   ├── AI Processing Indicator
│   │   ├── Loading Spinner
│   │   └── Status Message
│   │
│   ├── Enhanced Text Preview
│   │   ├── Side-by-Side Comparison
│   │   └── Diff Highlighting
│   │
│   └── Actions
│       ├── Accept Enhancement
│       ├── Regenerate
│       └── Cancel
│
└── Backend Integration
    └── POST /make-server/ai/enhance-text
        ├── API Key Validation
        ├── Rate Limiting
        └── Error Handling
```

---

### **12. SHARING SYSTEM**
```
/components/ShareCapsule.tsx
├── Share Modal
│   ├── Share Link Generation
│   │   ├── Unique Token
│   │   ├── Expiry Settings
│   │   └── Copy Link Button
│   │
│   ├── Share Options
│   │   ├── Email Share
│   │   ├── Social Media Links
│   │   │   ├── Facebook
│   │   │   ├── Twitter/X
│   │   │   └── WhatsApp
│   │   │
│   │   └── QR Code Generation
│   │
│   └── Permission Settings
│       ├── View Only
│       ├── Allow Echoes
│       └── Download Allowed
│
└── Public Viewing Page
    ├── /view/:token Route
    ├── Token Validation
    ├── Capsule Display
    └── Limited Actions
```

---

## ⚙️ BACKEND ARCHITECTURE

### **SERVER STRUCTURE**
```
/supabase/functions/server/
├── index.tsx (Main Hono Server)
│   ├── CORS Configuration
│   ├── Route Prefix: /make-server-f9be53a7
│   ├── Logger Middleware
│   ├── Error Handling
│   └── Deno.serve(app.fetch)
│
├── Routes & Endpoints
│   ├── Authentication Routes
│   │   ├── POST /signup
│   │   ├── POST /signin
│   │   ├── POST /signout
│   │   ├── POST /reset-password
│   │   └── POST /verify-email
│   │
│   ├── Profile Routes
│   │   ├── GET /profile/:userId
│   │   ├── POST /save-profile
│   │   ├── POST /upload-profile-picture
│   │   └── GET /user-info
│   │
│   ├── Security Routes
│   │   ├── POST /change-password
│   │   ├── POST /enable-2fa
│   │   ├── POST /verify-2fa
│   │   └── POST /disable-2fa
│   │
│   ├── Capsule Routes
│   │   ├── GET /capsules/:userId
│   │   ├── POST /capsules/create
│   │   ├── PUT /capsules/:id
│   │   ├── DELETE /capsules/:id
│   │   ├── GET /capsules/stats/:userId
│   │   └── GET /capsules/view/:token
│   │
│   ├── Media Routes
│   │   ├── POST /media/upload
│   │   ├── GET /media/:id/signed-url
│   │   ├── DELETE /media/:id
│   │   └── POST /media/generate-thumbnail
│   │
│   ├── Vault Routes
│   │   ├── GET /vaults/:userId
│   │   ├── POST /vaults/create
│   │   ├── PUT /vaults/:id
│   │   ├── DELETE /vaults/:id
│   │   └── POST /vaults/:id/assign-capsule
│   │
│   ├── Echo Routes
│   │   ├── POST /echoes/add-reaction
│   │   ├── DELETE /echoes/remove-reaction
│   │   ├── POST /echoes/add-comment
│   │   ├── PUT /echoes/edit-comment
│   │   ├── DELETE /echoes/delete-comment
│   │   └── GET /echoes/timeline/:userId
│   │
│   ├── Notification Routes
│   │   ├── GET /notifications/list/:userId
│   │   ├── POST /notifications/mark-read
│   │   ├── POST /notifications/mark-all-read
│   │   └── WS /ws/notifications (WebSocket)
│   │
│   ├── Achievement Routes
│   │   ├── GET /achievements/:userId
│   │   ├── POST /achievements/unlock
│   │   └── GET /achievements/progress/:userId
│   │
│   ├── AI Routes
│   │   ├── POST /ai/enhance-text
│   │   ├── POST /ai/generate-description
│   │   └── Environment: API Keys
│   │
│   ├── Settings Routes
│   │   ├── POST /save-storage-settings
│   │   ├── POST /save-notification-settings
│   │   ├── POST /delete-account
│   │   └── GET /export-data/:userId
│   │
│   └── Legacy Routes
│       ├── POST /legacy/create-title
│       ├── PUT /legacy/update-title
│       ├── DELETE /legacy/delete-title
│       └── GET /legacy/titles/:userId
│
└── Background Services
    ├── Delivery Scheduler (Cron)
    ├── Email Queue Processor
    ├── Achievement Checker
    └── Notification Dispatcher
```

---

### **SERVICE MODULES**
```
/supabase/functions/server/

├── kv_store.tsx (Protected - DO NOT MODIFY)
│   ├── get(key: string)
│   ├── set(key: string, value: any)
│   ├── del(key: string)
│   ├── mget(keys: string[])
│   ├── mset(items: { key, value }[])
│   ├── mdel(keys: string[])
│   └── getByPrefix(prefix: string)
│
├── delivery-service.tsx
│   ├── processDueDeliveries()
│   │   ├── Distributed Lock System
│   │   ├── getDueCapsules()
│   │   ├── deliverCapsule()
│   │   └── Error Recovery
│   │
│   ├── Delivery Lock Management
│   │   ├── Global Lock: delivery_processing_lock
│   │   ├── Per-Capsule Lock: delivery_lock:{id}
│   │   └── Stale Lock Detection (60s)
│   │
│   ├── Email Delivery
│   │   ├── sendEmailDelivery()
│   │   ├── Self vs Others Logic
│   │   └── Recipient Parsing
│   │
│   ├── Delivery Status Tracking
│   │   ├── markDeliverySuccessful()
│   │   ├── markDeliveryFailed()
│   │   └── Status: scheduled → delivering → delivered/failed
│   │
│   └── Global Scheduled List
│       ├── scheduled_capsules_global (Array)
│       ├── Add on Create
│       ├── Remove on Deliver/Fail
│       └── Cleanup Stale Entries
│
├── email-service.tsx
│   ├── Email Provider: Resend
│   ├── sendCapsuleDelivery()
│   │   ├── HTML Email Template
│   │   ├── Media Attachment Links
│   │   ├── Viewing URL
│   │   └── Sender Information
│   │
│   ├── Rate Limiting
│   │   ├── Queue Management
│   │   ├── Batch Processing
│   │   └── Error Retry Logic
│   │
│   └── Email Types
│       ├── Capsule Delivery
│       ├── Delivery Confirmation
│       ├── Achievement Unlock
│       └── Echo Notification
│
├── achievement-service.tsx
│   ├── checkAndUnlockAchievements()
│   ├── Achievement Definitions
│   │   ├── ID, Name, Description
│   │   ├── Unlock Criteria
│   │   └── Icon/Badge
│   │
│   ├── Progress Tracking
│   │   ├── Increment Counters
│   │   ├── Check Unlock Conditions
│   │   └── Store in KV: achievements:{userId}
│   │
│   └── Event Triggers
│       ├── capsule_created
│       ├── capsule_delivered
│       ├── capsule_received
│       ├── echo_added
│       ├── vault_created
│       └── legacy_assigned
│
├── cloudflare-recovery.tsx
│   ├── detectCloudflareError()
│   │   ├── HTML Error Detection
│   │   ├── Error Code Extraction
│   │   ├── Ray ID Extraction
│   │   └── Network Error Detection
│   │
│   ├── RetryWithBackoff Class
│   │   ├── Exponential Backoff
│   │   ├── Jitter (0-25%)
│   │   ├── Max Retries: 3
│   │   └── Max Delay: 15s
│   │
│   ├── Wrapper Functions
│   │   ├── safeKvGet()
│   │   ├── safeKvSet()
│   │   ├── safeKvDel()
│   │   └── withCloudflareRecovery()
│   │
│   └── Error Types Handled
│       ├── Error 1105 (Service Unavailable)
│       ├── 502/503/504 (Gateway Errors)
│       ├── Timeout Errors
│       ├── Network Connection Lost
│       ├── "undefined" Database Errors
│       └── ECONNRESET/ETIMEDOUT
│
└── websocket-manager.tsx
    ├── WebSocket Connection Pool
    ├── Client Registration
    ├── Message Broadcasting
    ├── Heartbeat/Ping-Pong
    └── Auto-Reconnect on Disconnect
```

---

## 💾 DATABASE & STORAGE ARCHITECTURE

### **SUPABASE STRUCTURE**
```
Supabase Backend
├── PostgreSQL Database
│   └── kv_store_f9be53a7 (Key-Value Table)
│       ├── key (TEXT, PRIMARY KEY)
│       ├── value (JSONB)
│       ├── created_at (TIMESTAMP)
│       └── updated_at (TIMESTAMP)
│
├── Supabase Auth
│   ├── Users Table
│   │   ├── id (UUID)
│   │   ├── email
│   │   ├── encrypted_password
│   │   ├── email_confirmed_at
│   │   └── created_at
│   │
│   ├── OAuth Providers
│   │   ├── Google
│   │   ├── Facebook
│   │   └── GitHub
│   │
│   └── 2FA Support
│       ├── TOTP Tokens
│       └── Backup Codes
│
└── Supabase Storage
    ├── Buckets
    │   ├── make-f9be53a7-media (Private)
    │   │   ├── photos/
    │   │   ├── videos/
    │   │   ├── audio/
    │   │   └── profile-pictures/
    │   │
    │   └── make-f9be53a7-thumbnails (Private)
    │       └── Auto-generated previews
    │
    └── Signed URLs
        ├── Creation: .createSignedUrl()
        ├── Expiry: 24 hours (default)
        └── Public Access: Disabled
```

---

### **KEY-VALUE STORE DATA MODEL**
```
KV Store Keys & Data Structures

USER DATA:
├── profile:{userId}
│   ├── display_name
│   ├── first_name
│   ├── last_name
│   ├── email
│   ├── bio
│   ├── profile_picture_url
│   ├── created_at
│   └── updated_at
│
├── user_settings:{userId}
│   ├── notifications_enabled
│   ├── email_notifications
│   ├── achievement_notifications
│   ├── echo_notifications
│   └── theme_preference

CAPSULE DATA:
├── capsule:{capsuleId}
│   ├── id
│   ├── created_by (userId)
│   ├── title
│   ├── text_message
│   ├── delivery_date (ISO 8601)
│   ├── time_zone
│   ├── recipient_type ('self' | 'others')
│   ├── self_contact (email)
│   ├── recipients (array)
│   ├── status ('draft' | 'scheduled' | 'delivering' | 'delivered' | 'failed')
│   ├── vault_id (optional)
│   ├── visual_filter (optional)
│   ├── delivery_attempts
│   ├── last_delivery_attempt
│   ├── delivery_error
│   ├── created_at
│   └── updated_at
│
├── capsule_media:{capsuleId}
│   └── [mediaId1, mediaId2, ...] (Array)
│
├── user_capsules:{userId}
│   └── [capsuleId1, capsuleId2, ...] (Array)
│
├── user_received:{userId}
│   └── [capsuleId1, capsuleId2, ...] (Array)
│
└── scheduled_capsules_global
    └── [capsuleId1, capsuleId2, ...] (Array)

MEDIA DATA:
├── media:{mediaId}
│   ├── id
│   ├── file_name
│   ├── file_type ('photo' | 'video' | 'audio')
│   ├── file_size
│   ├── storage_path
│   ├── storage_bucket
│   ├── thumbnail_path
│   ├── duration (for video/audio)
│   ├── width, height (for photo/video)
│   └── created_at

VAULT DATA:
├── vault:{vaultId}
│   ├── id
│   ├── user_id
│   ├── name
│   ├── description
│   ├── icon
│   ├── color
│   ├── capsule_ids (array)
│   ├── created_at
│   └── updated_at
│
└── user_vaults:{userId}
    └── [vaultId1, vaultId2, ...] (Array)

ECHO DATA:
├── echo_reactions:{capsuleId}
│   └── {
│         "❤️": [userId1, userId2, ...],
│         "🎉": [userId3, ...],
│         ...
│       }
│
├── echo_comments:{capsuleId}
│   └── [
│         { id, userId, text, created_at, updated_at },
│         ...
│       ]
│
└── echo_timeline:{userId}
    └── [
          { capsuleId, type, timestamp, userId },
          ...
        ]

NOTIFICATION DATA:
├── notifications:{userId}
│   └── [
│         {
│           id,
│           type,
│           capsuleId,
│           message,
│           timestamp,
│           read
│         },
│         ...
│       ] (Max 100)

ACHIEVEMENT DATA:
├── achievements:{userId}
│   └── {
│         "first_steps": { unlocked: true, unlocked_at },
│         "time_traveler": { unlocked: false, progress: 5/10 },
│         ...
│       }

LEGACY DATA:
├── legacy_titles:{userId}
│   └── [
│         {
│           id,
│           title,
│           beneficiaries: [email1, email2],
│           created_at
│         },
│         ...
│       ]

SESSION & AUTH:
├── viewing_token:{token}
│   ├── capsule_id
│   ├── created_at
│   └── expires_at (30 days)
│
├── delivery_processing_lock
│   ├── timestamp
│   ├── holder (instance ID)
│   └── TTL: 60 seconds
│
└── delivery_lock:{capsuleId}
    ├── timestamp
    ├── holder (instance ID)
    └── TTL: 5 minutes
```

---

## 🔌 THIRD-PARTY INTEGRATIONS

### **1. SUPABASE**
```
Purpose: Backend Infrastructure
Services Used:
├── Database (PostgreSQL)
│   ├── Connection String: SUPABASE_DB_URL
│   └── KV Store Table
│
├── Authentication
│   ├── Service Role Key: SUPABASE_SERVICE_ROLE_KEY
│   ├── Anon Key: SUPABASE_ANON_KEY
│   └── JWT Token Management
│
├── Storage
│   ├── Private Buckets
│   ├── Signed URLs
│   └── File Upload API
│
└── Edge Functions
    ├── Deployment: Deno Runtime
    └── Server: /supabase/functions/server
```

---

### **2. RESEND (Email Delivery)**
```
Purpose: Email Service Provider
Configuration:
├── API Key: RESEND_API_KEY (Environment Variable)
├── From Address: "Eras Time Capsule <noreply@eras.app>"
├── Rate Limits: Per-API-Key Basis
└── Sandbox Mode: Requires domain verification

Email Types Sent:
├── Capsule Delivery Emails
│   ├── HTML Template
│   ├── Media Links (Signed URLs)
│   ├── Viewing URL
│   └── Sender Name
│
├── Delivery Confirmations (Disabled)
├── Achievement Notifications (Optional)
└── Echo Notifications (Optional)

Error Handling:
├── Rate Limit Detection
├── Bounce Handling
├── Invalid Email Detection
└── Queue Retry Logic
```

---

### **3. AI SERVICES (Optional)**
```
Purpose: Text Enhancement & Media Processing
Configuration:
├── API Key: Stored in Environment Variable
├── Provider: TBD (OpenAI, Anthropic, etc.)
└── Usage: On-demand via /ai/enhance-text

Features:
├── Text Enhancement
│   ├── Emotional Tone Adjustment
│   ├── Formality Control
│   └── Nostalgia Addition
│
└── Future: Media Enhancement
    ├── Image Upscaling
    └── Video Stabilization
```

---

### **4. OAUTH PROVIDERS**
```
Purpose: Social Authentication
Providers:
├── Google OAuth
│   ├── Scopes: email, profile
│   └── Configuration: Supabase Dashboard
│
├── Facebook OAuth (Optional)
└── GitHub OAuth (Optional)

Flow:
1. User clicks "Sign in with Google"
2. Redirect to OAuth provider
3. User authorizes
4. Callback with auth code
5. Supabase exchanges for JWT
6. Frontend stores token
```

---

## 🔄 DATA FLOW DIAGRAMS

### **1. CAPSULE CREATION & DELIVERY FLOW**
```
┌─────────────┐
│    User     │
└──────┬──────┘
       │ Fills out capsule form
       ▼
┌─────────────────┐
│ CreateCapsule   │
│   Component     │
└──────┬──────────┘
       │ Uploads media
       ▼
┌─────────────────┐
│  Media Upload   │
│   (Supabase)    │
└──────┬──────────┘
       │ Returns media IDs
       ▼
┌─────────────────┐
│  POST /capsules │
│     /create     │
└──────┬──────────┘
       │ Validates & Stores
       ▼
┌─────────────────┐
│   KV Store:     │
│ capsule:{id}    │
│ user_capsules   │
│ scheduled_list  │
└──────┬──────────┘
       │
       │ ⏰ Cron Scheduler (Every 1 min)
       ▼
┌─────────────────────────┐
│ DeliveryService         │
│ processDueDeliveries()  │
└──────┬──────────────────┘
       │ Checks scheduled_capsules_global
       ▼
┌─────────────────┐
│ Acquire Lock    │
│ delivery_lock   │
└──────┬──────────┘
       │ Lock acquired
       ▼
┌─────────────────┐
│ Send Email via  │
│     Resend      │
└──────┬──────────┘
       │ Success/Failure
       ▼
┌─────────────────┐
│ Update Status   │
│   'delivered'   │
│   or 'failed'   │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Create          │
│ Notification    │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Check & Unlock  │
│ Achievements    │
└─────────────────┘
```

---

### **2. REAL-TIME NOTIFICATION FLOW**
```
┌──────────────┐
│   Backend    │
│   Event      │
└──────┬───────┘
       │ (Capsule delivered, echo added, etc.)
       ▼
┌──────────────────┐
│ Create           │
│ Notification     │
│ Object           │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Store in KV:     │
│ notifications:   │
│   {userId}       │
└──────┬───────────┘
       │
       ├────────────────┐
       │                │
       ▼                ▼
┌──────────┐   ┌────────────────┐
│ WebSocket│   │ Email Service  │
│ Broadcast│   │ (if enabled)   │
└──────┬───┘   └────────────────┘
       │
       ▼
┌──────────────────┐
│  Frontend        │
│  Receives via WS │
└──────┬───────────┘
       │
       ├───────────────┐
       │               │
       ▼               ▼
┌──────────┐   ┌──────────────┐
│  Toast   │   │ Update Badge │
│ Popup    │   │   Counter    │
└──────────┘   └──────────────┘
```

---

### **3. ECHO SYSTEM FLOW**
```
┌─────────────┐
│    User     │
│ Adds Echo   │
└──────┬──────┘
       │
       ▼
┌────────────────────┐
│ POST /echoes/      │
│  add-reaction or   │
│  add-comment       │
└──────┬─────────────┘
       │
       ▼
┌────────────────────┐
│ Store in KV:       │
│ echo_reactions or  │
│ echo_comments      │
└──────┬─────────────┘
       │
       ▼
┌────────────────────┐
│ Add to Timeline:   │
│ echo_timeline      │
│   {userId}         │
└──────┬─────────────┘
       │
       ▼
┌────────────────────┐
│ Create             │
│ Notification       │
│ for Capsule Owner  │
└──────┬─────────────┘
       │
       ▼
┌────────────────────┐
│ Check Achievement: │
│  "Echo Chamber"    │
└────────────────────┘
```

---

## 🐛 COMMON ERROR SCENARIOS & DEBUGGING

### **ERROR CATEGORIES**

```
1. AUTHENTICATION ERRORS
├── Invalid credentials
├── Expired session/token
├── 2FA verification failure
├── OAuth callback errors
└── Password reset failures

2. CAPSULE CREATION ERRORS
├── Media upload failures
│   ├── File too large
│   ├── Invalid file type
│   ├── Storage quota exceeded
│   └── Network timeout
│
├── Validation errors
│   ├── Missing required fields
│   ├── Invalid delivery date
│   ├── Invalid recipient email
│   └── Invalid time zone
│
└── Backend save errors
    ├── Database connection failure
    ├── KV store timeout
    └── Permission denied

3. DELIVERY ERRORS
├── Email delivery failures
│   ├── Invalid recipient email
│   ├── Email service rate limit
│   ├── Resend sandbox restriction
│   ├── Bounce/rejection
│   └── Network timeout
│
├── Scheduling errors
│   ├── Lock acquisition failure
│   ├── Cloudflare timeout (Error 1105)
│   ├── Database connection lost
│   ├── Stale lock takeover
│   └── Capsule already delivered
│
└── Status update failures
    ├── Race condition
    └── Database error

4. WEBSOCKET ERRORS
├── Connection refused
├── Connection timeout
├── Reconnection loop
├── Message parsing errors
└── Authentication failure

5. NOTIFICATION ERRORS
├── Failed to fetch notifications
├── Mark as read failure
├── WebSocket disconnect
└── Badge count mismatch

6. ECHO SYSTEM ERRORS
├── Failed to add reaction
├── Failed to add comment
├── Timeline not loading
└── Duplicate reaction handling

7. ACHIEVEMENT ERRORS
├── Achievement unlock failure
├── Progress tracking errors
├── Toast notification not showing
└── Achievement state desync

8. STORAGE & MEDIA ERRORS
├── Signed URL generation failure
├── File upload timeout
├── Thumbnail generation failure
├── File not found (404)
└── Bucket permission errors

9. AI ENHANCEMENT ERRORS
├── API key missing/invalid
├── Rate limit exceeded
├── Service unavailable
├── Timeout
└── Malformed response

10. CLOUDFLARE/NETWORK ERRORS
├── Error 1105 (Service Unavailable)
├── 502/503/504 (Gateway Errors)
├── ECONNRESET (Connection Reset)
├── ETIMEDOUT (Timeout)
├── "Database error: undefined"
└── Network connection lost
```

---

### **ERROR LOCATION MAP**

```
FRONTEND ERRORS:
├── /components/Auth.tsx
│   └── Login/Signup failures, OAuth errors
│
├── /components/CreateCapsule.tsx
│   └── Form validation, media upload, submission errors
│
├── /components/Dashboard.tsx
│   └── Capsule fetching, pagination errors
│
├── /components/NotificationCenter.tsx
│   └── WebSocket connection, notification fetch errors
│
├── /components/CapsuleEchoes.tsx
│   └── Echo submission, timeline loading errors
│
└── /components/Settings.tsx
    └── Profile update, password change, 2FA errors

BACKEND ERRORS:
├── /supabase/functions/server/index.tsx
│   └── Route errors, middleware failures
│
├── /supabase/functions/server/delivery-service.tsx
│   └── Delivery processing, lock management errors
│
├── /supabase/functions/server/email-service.tsx
│   └── Email sending, rate limit errors
│
├── /supabase/functions/server/cloudflare-recovery.tsx
│   └── Network errors, retry logic failures
│
└── /supabase/functions/server/kv_store.tsx
    └── Database connection, query errors
```

---

## 📊 PERFORMANCE & OPTIMIZATION

### **OPTIMIZATION STRATEGIES**

```
FRONTEND OPTIMIZATIONS:
├── React.memo on CapsuleCard
├── Lazy loading images
├── Virtual scrolling (future)
├── Debounced search/filter
├── Pagination (10 items per page)
└── WebSocket connection pooling

BACKEND OPTIMIZATIONS:
├── Global scheduled list (no prefix scan)
├── Distributed lock system
├── Batch processing for emails
├── KV Store indexing strategies
├── Signed URL caching
└── Cloudflare error retry with backoff

STORAGE OPTIMIZATIONS:
├── Image compression on upload
├── Thumbnail generation
├── Video transcoding (future)
├── CDN for media delivery
└── Bucket lifecycle policies
```

---

## 🔐 SECURITY MEASURES

```
AUTHENTICATION & AUTHORIZATION:
├── JWT-based authentication
├── Secure password hashing (bcrypt)
├── 2FA support (TOTP)
├── OAuth integration
├── Session expiry management
└── CSRF protection

DATA PROTECTION:
├── TLS/SSL encryption in transit
├── Encrypted storage at rest
├── Private storage buckets
├── Signed URLs with expiry
├── Input validation & sanitization
└── SQL injection prevention

ACCESS CONTROL:
├── User-scoped data isolation
├── Resource ownership validation
├── Private capsule viewing tokens
├── Beneficiary access rules (legacy)
└── Role-based permissions (future)

RATE LIMITING:
├── Email sending limits
├── API endpoint throttling
├── WebSocket connection limits
└── Upload size restrictions
```

---

## 🎯 SYSTEM DEPENDENCIES

```
ENVIRONMENT VARIABLES REQUIRED:
├── SUPABASE_URL
├── SUPABASE_ANON_KEY
├── SUPABASE_SERVICE_ROLE_KEY
├── SUPABASE_DB_URL
├── RESEND_API_KEY
└── (Optional) AI_API_KEY for text enhancement

EXTERNAL DEPENDENCIES:
├── npm packages:
│   ├── react
│   ├── react-router-dom
│   ├── @supabase/supabase-js
│   ├── lucide-react (icons)
│   ├── recharts (future charts)
│   ├── date-fns (date formatting)
│   └── tailwindcss
│
└── Deno packages (server):
    ├── hono (web framework)
    ├── @supabase/supabase-js
    └── cors middleware
```

---

## 📱 RESPONSIVE DESIGN BREAKPOINTS

```
TAILWIND BREAKPOINTS:
├── Mobile: < 640px (sm)
├── Tablet: 640px - 1024px (sm to lg)
├── Desktop: 1024px+ (lg)
└── Large Desktop: 1280px+ (xl)

MOBILE-SPECIFIC FEATURES:
├── Solid color backgrounds (no gradients)
├── Simplified navigation
├── Touch-optimized buttons
├── Swipe gestures (future)
└── Bottom sheet modals

DESKTOP-SPECIFIC FEATURES:
├── Glassmorphism effects
├── Hover animations
├── Keyboard shortcuts
├── Multi-column layouts
└── Side-by-side comparisons
```

---

## 🧪 TESTING RECOMMENDATIONS

### **AREAS TO TEST**

```
1. AUTHENTICATION FLOW
   ├── Sign up with email
   ├── Sign in with email
   ├── OAuth sign in (Google)
   ├── Password reset
   ├── 2FA enable/disable
   └── Session persistence

2. CAPSULE LIFECYCLE
   ├── Create draft capsule
   ├── Upload media (photo/video/audio)
   ├── Apply visual filters
   ├── Schedule delivery
   ├── Edit scheduled capsule
   ├── Cancel scheduled capsule
   └── Delete capsule

3. DELIVERY SYSTEM
   ├── Self-delivery
   ├── Send to others (multiple recipients)
   ├── Delivery timing accuracy
   ├── Delivery failure handling
   ├── Delivery status updates
   └── Viewing token generation

4. SOCIAL FEATURES
   ├── Add reactions to capsules
   ├── Remove reactions
   ├── Add comments
   ├── Edit comments
   ├── Delete comments
   └── Echo timeline display

5. NOTIFICATIONS
   ├── Real-time WebSocket updates
   ├── Notification badge counter
   ├── Mark as read
   ├── Mark all as read
   ├── Toast notifications
   └── Email notifications

6. ACHIEVEMENTS
   ├── Achievement unlock
   ├── Progress tracking
   ├── Toast display
   └── Achievement gallery

7. VAULT SYSTEM
   ├── Create vault
   ├── Edit vault
   ├── Delete vault
   ├── Assign capsules to vault
   ├── Remove capsules from vault
   └── Legacy title assignment

8. SETTINGS
   ├── Profile update
   ├── Password change
   ├── 2FA setup
   ├── Notification preferences
   ├── Storage management
   └── Account deletion

9. ERROR SCENARIOS
   ├── Network timeout
   ├── Invalid inputs
   ├── Database errors
   ├── Cloudflare errors
   ├── Rate limiting
   └── Permission errors

10. PERFORMANCE
    ├── Large capsule lists (100+)
    ├── Large media files (>50MB)
    ├── Concurrent deliveries
    ├── WebSocket stability
    └── Page load times
```

---

## 🎯 QUICK REFERENCE: KEY FILES

```
MUST-KNOW FILES FOR DEBUGGING:

Frontend:
├── /App.tsx - Main app router & navigation
├── /components/Dashboard.tsx - Home tab, capsule display
├── /components/CreateCapsule.tsx - Capsule creation
├── /components/Auth.tsx - Authentication flows
├── /components/NotificationCenter.tsx - Notification UI
├── /components/CapsuleEchoes.tsx - Social features
└── /components/Settings.tsx - User settings

Backend:
├── /supabase/functions/server/index.tsx - Main server
├── /supabase/functions/server/delivery-service.tsx - Delivery logic
├── /supabase/functions/server/email-service.tsx - Email sending
├── /supabase/functions/server/cloudflare-recovery.tsx - Error handling
├── /supabase/functions/server/achievement-service.tsx - Achievements
└── /supabase/functions/server/kv_store.tsx - Database (PROTECTED)

Configuration:
├── /package.json - Frontend dependencies
├── /tailwind.config.js - Tailwind configuration
└── /supabase/functions/server/import_map.json - Deno deps
```

---

## ✅ END OF ARCHITECTURE DIAGRAM

**Usage Instructions:**
1. Copy this entire file into ChatGPT or Claude
2. Ask: "Create a testing/error reporting hub using this Eras architecture"
3. The AI will use this tree structure to help users pinpoint exact error locations
4. Users can reference component names, routes, and data flow to report issues

**For Bug Reports, Include:**
- Component/file name from this tree
- Error category (Auth, Delivery, Echo, etc.)
- Expected vs. actual behavior
- Browser console errors
- Network tab errors (if applicable)

---

**Document Maintainer:** System Architect  
**Last Verified:** November 25, 2025  
**Coverage:** 100% of implemented features
