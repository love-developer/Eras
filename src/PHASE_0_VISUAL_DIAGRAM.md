# 🎨 PHASE 0 VISUAL ARCHITECTURE DIAGRAM

---

## 🔒 LOGGER SYSTEM FLOW

```
┌─────────────────────────────────────────────────────────┐
│                    APPLICATION CODE                      │
│                                                          │
│  logger.auth('User sign in attempt')                    │
│  logger.capsule('Capsule created')                      │
│  logger.error('API failed', error)                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              LOGGER.TSX (Enhanced)                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  1. Check Environment                             │  │
│  │     • localhost? → Debug Level                    │  │
│  │     • production? → Info Level                    │  │
│  └──────────────────┬───────────────────────────────┘  │
│                     │                                   │
│  ┌──────────────────▼───────────────────────────────┐  │
│  │  2. Scrub Sensitive Data                          │  │
│  │     • user@email.com → [EMAIL_REDACTED]          │  │
│  │     • eyJhbGc... → [JWT_REDACTED]                │  │
│  │     • Bearer token → Bearer [TOKEN_REDACTED]      │  │
│  │     • password: "x" → password: [REDACTED]       │  │
│  └──────────────────┬───────────────────────────────┘  │
│                     │                                   │
│  ┌──────────────────▼───────────────────────────────┐  │
│  │  3. Format & Output                               │  │
│  │     • Add timestamp                               │  │
│  │     • Add emoji prefix (dev only)                 │  │
│  │     • Add context tag [AUTH], [CAPSULE], etc.    │  │
│  └──────────────────┬───────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
       ┌─────────────┴─────────────┐
       │                           │
       ▼                           ▼
┌──────────────┐          ┌──────────────────┐
│ DEVELOPMENT  │          │   PRODUCTION     │
├──────────────┤          ├──────────────────┤
│ console.log  │          │ console.log      │
│ ✅ Shows:    │          │ ✅ Shows:        │
│ - Debug      │          │ - Info           │
│ - Info       │          │ - Warn           │
│ - Warn       │          │ - Error          │
│ - Error      │          │                  │
│ - All emails │          │ ❌ Hides:        │
│ - All tokens │          │ - Debug          │
│ - Emojis ✨  │          │ - Emails         │
│              │          │ - Tokens         │
│              │          │ - Passwords      │
│              │          │ - Emojis         │
└──────────────┘          └──────────────────┘
```

---

## 🗑️ TRASH SYSTEM FLOW

```
┌─────────────────────────────────────────────────────────┐
│                   USER CLICKS DELETE                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           softDeleteCapsule(capsuleId, userId)          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  1. Update Database                               │  │
│  │     DELETE FROM capsules...                       │  │
│  │       → UPDATE capsules SET                       │  │
│  │           deleted_at = NOW(),                     │  │
│  │           trashed_by = userId                     │  │
│  └──────────────────┬───────────────────────────────┘  │
│                     │                                   │
│  ┌──────────────────▼───────────────────────────────┐  │
│  │  2. Show Toast with Undo                          │  │
│  │     ┌─────────────────────────────────────────┐  │  │
│  │     │ Capsule moved to trash   [Undo] button  │  │  │
│  │     │ (5 second timer)                         │  │  │
│  │     └─────────────────────────────────────────┘  │  │
│  └──────────────────┬───────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
       ┌─────────────┴─────────────┐
       │                           │
       ▼ (within 5 sec)            ▼ (after 5 sec)
┌──────────────────┐      ┌──────────────────────────┐
│ USER CLICKS UNDO │      │  CAPSULE IN TRASH       │
├──────────────────┤      ├──────────────────────────┤
│ UPDATE capsules  │      │ deleted_at: 2024-12-11  │
│ SET deleted_at = │      │ status: In Trash        │
│     NULL         │      │ auto-delete: 30 days    │
└────────┬─────────┘      └─────────┬────────────────┘
         │                          │
         ▼                          ▼
┌──────────────────┐      ┌──────────────────────────┐
│ ✅ RESTORED      │      │   TRASH MANAGER UI       │
│                  │      ├──────────────────────────┤
│ Back in main     │      │ • View deleted items     │
│ capsule list     │      │ • Restore button         │
└──────────────────┘      │ • Permanent delete       │
                          │ • Days until auto-delete │
                          │ • Empty trash button     │
                          └─────────┬────────────────┘
                                    │
                                    ▼ (after 30 days)
                          ┌──────────────────────────┐
                          │  AUTO-CLEANUP CRON       │
                          ├──────────────────────────┤
                          │ Runs: Daily at 2 AM UTC  │
                          │                          │
                          │ 1. Find capsules where   │
                          │    deleted_at < NOW()-30 │
                          │                          │
                          │ 2. Delete media files    │
                          │    from storage          │
                          │                          │
                          │ 3. DELETE FROM capsules  │
                          │    (permanent)           │
                          └──────────────────────────┘
```

---

## 🛡️ ERROR BOUNDARY FLOW

```
┌─────────────────────────────────────────────────────────┐
│                  COMPONENT TREE                          │
│                                                          │
│  <App>                                                   │
│    <DashboardErrorBoundary> ← Catches errors below      │
│      <Dashboard>                                         │
│        <CapsuleCard>                                     │
│          <MediaThumbnail>  ⚠️ ERROR THROWN HERE         │
│        </CapsuleCard>                                    │
│      </Dashboard>                                        │
│    </DashboardErrorBoundary>                             │
│  </App>                                                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼ Error bubbles up
┌─────────────────────────────────────────────────────────┐
│          ENHANCED ERROR BOUNDARY CATCHES                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │  1. componentDidCatch(error, errorInfo)           │  │
│  │     • Log error details                           │  │
│  │     • Log component stack                         │  │
│  │     • Log context (Dashboard)                     │  │
│  │     • Report to backend (optional)                │  │
│  └──────────────────┬───────────────────────────────┘  │
│                     │                                   │
│  ┌──────────────────▼───────────────────────────────┐  │
│  │  2. Set hasError = true                           │  │
│  │     • Store error object                          │  │
│  │     • Store error info                            │  │
│  │     • Increment error count                       │  │
│  └──────────────────┬───────────────────────────────┘  │
│                     │                                   │
│  ┌──────────────────▼───────────────────────────────┐  │
│  │  3. Render Fallback UI                            │  │
│  │     ┌────────────────────────────────────────┐   │  │
│  │     │  ⚠️  Dashboard Error                   │   │  │
│  │     │                                        │   │  │
│  │     │  We encountered an issue loading      │   │  │
│  │     │  your capsules. Your data is safe.    │   │  │
│  │     │                                        │   │  │
│  │     │  [Reload Page]  [Go Home]             │   │  │
│  │     │  [Try Again]                          │   │  │
│  │     │                                        │   │  │
│  │     │  📧 Report this issue                 │   │  │
│  │     └────────────────────────────────────────┘   │  │
│  └──────────────────┬───────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
       ┌─────────────┴─────────────┬─────────────────┐
       │                           │                  │
       ▼                           ▼                  ▼
┌──────────────┐          ┌──────────────┐  ┌────────────────┐
│ Reload Page  │          │   Go Home    │  │   Try Again    │
├──────────────┤          ├──────────────┤  ├────────────────┤
│ window.      │          │ navigate('/') │  │ Reset error    │
│ location.    │          │              │  │ boundary state │
│ reload()     │          │              │  │                │
└──────────────┘          └──────────────┘  └────────────────┘
```

---

## 🔄 COMPLETE SYSTEM INTEGRATION

```
┌───────────────────────────────────────────────────────────────┐
│                     ERAS APPLICATION                           │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    USER INTERFACE                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │  │
│  │  │Dashboard │  │  Vault   │  │ Settings │  │  Trash  │ │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │  │
│  │       │             │             │             │        │  │
│  │       └─────────────┴─────────────┴─────────────┘        │  │
│  │                          │                                │  │
│  │  ┌───────────────────────▼──────────────────────────┐    │  │
│  │  │         ENHANCED ERROR BOUNDARIES                │    │  │
│  │  │  Wraps: Dashboard, Vault, Settings, etc.        │    │  │
│  │  └───────────────────────┬──────────────────────────┘    │  │
│  └────────────────────────────────────────────────────────┬──┘  │
│                             │                             │     │
│  ┌──────────────────────────▼──────────────────┐         │     │
│  │         APPLICATION LOGIC                    │         │     │
│  │  • Create Capsule                            │         │     │
│  │  • Delete Capsule (soft)                     │         │     │
│  │  • Restore Capsule                           │         │     │
│  │  • Load Data                                 │         │     │
│  └──────────────────────────┬───────────────────┘         │     │
│                             │                             │     │
│  ┌──────────────────────────▼──────────────────┐         │     │
│  │              LOGGER SYSTEM                   │         │     │
│  │  • Scrubs sensitive data                     │         │     │
│  │  • Environment-aware                         │         │     │
│  │  • Structured logging                        │◄────────┘     │
│  └──────────────────────────┬───────────────────┘               │
│                             │                                   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌──────────────────────────┐      ┌──────────────────────────┐
│   SUPABASE DATABASE      │      │   SUPABASE STORAGE       │
├──────────────────────────┤      ├──────────────────────────┤
│ capsules                 │      │ capsule-media/           │
│ ├─ id                    │      │ ├─ user_id/              │
│ ├─ title                 │      │ │  ├─ image1.jpg         │
│ ├─ message               │      │ │  ├─ video1.mp4         │
│ ├─ delivery_date         │      │ │  └─ audio1.mp3         │
│ ├─ deleted_at ⭐ NEW     │      │ └─ ...                   │
│ ├─ trashed_by ⭐ NEW     │      └──────────────────────────┘
│ └─ ...                   │
│                          │      ┌──────────────────────────┐
│ Indexes ⭐ NEW:          │      │   CRON JOB (Daily 2 AM)  │
│ • idx_capsules_deleted_at│      ├──────────────────────────┤
│ • idx_capsules_active    │      │ auto_cleanup_trash()     │
│                          │      │ • Find deleted_at < -30d │
│ RLS Policies ⭐ UPDATED: │      │ • Delete media files     │
│ • Active capsules only   │      │ • Delete capsule rows    │
│ • Trash view separate    │      │ • Log cleanup results    │
└──────────────────────────┘      └──────────────────────────┘
```

---

## 📊 DATA FLOW: DELETE OPERATION

```
USER ACTION                 APPLICATION                DATABASE
    │                           │                         │
    │  1. Click Delete          │                         │
    ├──────────────────────────>│                         │
    │                           │                         │
    │                           │  2. softDeleteCapsule() │
    │                           ├────────────────────────>│
    │                           │     UPDATE capsules     │
    │                           │     SET deleted_at=NOW()│
    │                           │                         │
    │                           │<────────────────────────┤
    │                           │  3. Success             │
    │                           │                         │
    │<──────────────────────────┤                         │
    │  4. Show Toast            │                         │
    │  ┌─────────────────────┐  │                         │
    │  │ Moved to trash      │  │                         │
    │  │ [Undo (5s)]         │  │                         │
    │  └─────────────────────┘  │                         │
    │                           │                         │
    │  IF UNDO CLICKED          │                         │
    ├──────────────────────────>│  5. Restore             │
    │                           ├────────────────────────>│
    │                           │     UPDATE capsules     │
    │                           │     SET deleted_at=NULL │
    │<──────────────────────────┤                         │
    │  6. Restored!             │                         │
    │                           │                         │
    │                           │                         │
    │  IF NO UNDO (AFTER 30d)   │                         │
    │                           │  CRON: auto_cleanup()   │
    │                           │<────────────────────────┤
    │                           │  • Delete media         │
    │                           │  • DELETE capsule       │
    │                           │                         │
```

---

## 🎨 UI COMPONENT HIERARCHY

```
App.tsx
│
├─ EnhancedErrorBoundary (Top Level)
│  └─ Catches fatal app errors
│
├─ DashboardErrorBoundary
│  └─ Dashboard
│     ├─ CapsuleCard
│     ├─ CapsuleCard
│     └─ CapsuleCard
│
├─ VaultErrorBoundary
│  └─ LegacyVault
│     ├─ VaultFolder
│     ├─ VaultFolder
│     └─ TrashManager ⭐ NEW
│        ├─ Trashed Capsule List
│        ├─ Restore Button
│        ├─ Permanent Delete Button
│        └─ Empty Trash Button
│
├─ CapsuleCreationErrorBoundary
│  └─ CreateCapsule
│     └─ MediaEnhancementOverlay
│
└─ Settings
   ├─ Profile Tab
   ├─ Notifications Tab
   ├─ Legacy Access Tab
   └─ Trash Tab ⭐ NEW
      └─ TrashManager Component
```

---

## 🔍 LOGGER OUTPUT COMPARISON

### BEFORE (Insecure)
```
console.log('📧 Attempting sign-in for:', user@example.com)
console.log('🔑 Access token:', eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)
console.log('User password:', 'MyP@ssw0rd!')
console.log('User ID:', a1b2c3d4-e5f6-7890-abcd-ef1234567890)
```

### AFTER (Secure)
```
[2024-12-11T10:30:15.123Z] 🔐 [AUTH] User sign-in attempt
[2024-12-11T10:30:15.456Z] ℹ️ [INFO] Authentication successful
[2024-12-11T10:30:15.789Z] 👤 [USER-ACTION] create_capsule { hasMedia: true }
```

---

**This visual diagram is your map through Phase 0!** 🗺️
