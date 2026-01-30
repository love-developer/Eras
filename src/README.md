# Eras - Digital Time Capsule App

**A comprehensive AI-powered time capsule application** that allows users to send video, text, and audio messages to themselves or others at a future time of their choosing.

---

## 🎯 Core Features

### 📱 Media Creation & Enhancement
- **Full-Screen Media Capture**: Camera and audio recording with AI-powered editing
- **AI Enhancement Overlay**: CapCut-style editing with filters, effects, text overlays
- **Era-Themed Filters**: "Yesterday," "Future Light," "Echo," "Dream," and more
- **Web Audio API**: 8 custom audio filters for immersive sound design
- **Unlimited Sticker System**: Canvas-based sticker rendering with export to final media
- **Video Compression**: Automatic optimization for web delivery

### 🗓️ Time Capsule Management
- **Create Tab**: Ultra-vibrant UI with morphing gradient blobs and particle effects
- **Dashboard**: Clean navigation with capsule overview and statistics
- **Calendar View**: Visual timeline of scheduled capsules with dark theme
- **Vault Tab**: Access to legacy capsules and beneficiary management
- **Draft Auto-Save**: Automatic saving with instant recovery

### 🏆 Achievement System (35 Total)
- **7x5 Desktop Grid Layout**: Perfectly organized achievement dashboard
- **5 Rarity Tiers**: Common, Uncommon, Rare, Epic, Legendary
- **Progress Tracking**: Real-time unlock notifications and percentage tracking
- **Achievement Categories**: Creation, Social, Mastery, Discovery, Legacy
- **Sports Card Modal**: Cinematic 3D flip animations with achievement details
- **React Portal Rendering**: Perfectly centered modals on all devices

### 📧 Production-Ready Delivery
- **Email Service**: Resend API integration with rate limiting and sandbox mode
- **SMS Support**: Twilio integration for text message delivery
- **Scheduled Delivery**: Automatic time capsule delivery at chosen dates
- **Duplicate Prevention**: Intelligent deduplication system
- **Delivery Status Tracking**: Real-time status updates and notifications

### 🔐 Authentication & Security
- **Supabase Auth**: Email/password and OAuth (Google) authentication
- **Email Verification**: Required verification flow with password reset
- **Session Management**: Secure token handling with refresh support
- **User Preferences**: Notification settings and privacy controls

---

## 🗂️ Project Structure

```
├── App.tsx                          # Main application entry point
├── components/
│   ├── AIEditor.tsx                 # AI-powered media editing interface
│   ├── AchievementsDashboard.tsx    # 35 achievements in 7x5 grid
│   ├── AchievementDetailModal.tsx   # Sports card modal with Portal
│   ├── AchievementBadge.tsx         # Rarity-based badge component
│   ├── AchievementUnlockManager.tsx # Real-time unlock detection
│   ├── Auth.tsx                     # Authentication UI
│   ├── CalendarView.tsx             # Timeline calendar with dark theme
│   ├── CameraRecorder.tsx           # Full-screen camera capture
│   ├── CreateCapsule.tsx            # Capsule creation workflow
│   ├── Dashboard.tsx                # Main dashboard view
│   ├── LegacyVault.tsx              # Beneficiary & legacy management
│   ├── MediaEnhancementOverlay.tsx  # CapCut-style editing overlay
│   ├── MediaPreview.tsx             # Media playback and preview
│   ├── ReceivedCapsules.tsx         # Inbox for received capsules
│   └── Settings.tsx                 # User settings and preferences
│
├── hooks/
│   ├── useAchievements.tsx          # Achievement state management
│   ├── useActivityTracking.tsx      # User activity monitoring
│   ├── useAuth.tsx                  # Authentication state
│   ├── useDraftAutoSave.tsx         # Auto-save functionality
│   └── useTabNavigation.tsx         # Tab state management
│
├── supabase/functions/server/
│   ├── index.tsx                    # Hono web server (main entry)
│   ├── achievement-service.tsx      # Achievement logic & unlocks
│   ├── delivery-service.tsx         # Capsule delivery scheduler
│   ├── email-service.tsx            # Resend email integration
│   ├── sms-service.tsx              # Twilio SMS integration
│   └── kv_store.tsx                 # Key-value database utilities
│
├── utils/
│   ├── supabase/
│   │   ├── client.tsx               # Supabase client singleton
│   │   ├── database.tsx             # Database helper functions
│   │   └── info.tsx                 # Project ID & keys
│   ├── cache.tsx                    # Client-side caching
│   ├── error-handler.tsx            # Global error handling
│   ├── timezone.tsx                 # Timezone utilities
│   └── video-compression.tsx        # Video optimization
│
└── styles/
    ├── globals.css                  # Tailwind v4 + custom tokens
    └── legacy-access-animations.css # Vault animations
```

---

## 🚀 Key Technologies

- **React 18** with TypeScript
- **Tailwind CSS v4** with custom design tokens
- **Supabase**: Database, Auth, Storage, Edge Functions
- **Hono**: Lightweight web server for backend API
- **Motion (Framer Motion)**: Advanced animations
- **Resend**: Production email delivery
- **Twilio**: SMS delivery
- **Web Audio API**: Advanced audio processing
- **Canvas API**: Sticker rendering and export

---

## 📚 Essential Documentation

### Achievement System
- **ACHIEVEMENT_EXPANSION_35_COMPLETE.md** - Full 35-achievement system overview
- **ACHIEVEMENT_SYSTEM_FINAL_SUMMARY.md** - Architecture and implementation details
- **ACHIEVEMENT_UNLOCK_QUICKSTART.md** - How to add new achievements
- **ACHIEVEMENT_QUICK_REFERENCE.md** - Quick lookup guide
- **ACHIEVEMENT_MODAL_FINAL_FIX_COMPLETE.md** - Mobile modal fix with React Portal

### Mobile Optimizations
- **MOBILE_ACHIEVEMENT_MODAL_COMPLETE_FIX.md** - Portal-based modal centering fix

### Email & Delivery
- **EMAIL_RATE_LIMIT_FIX_COMPLETE.md** - Rate limiting and sandbox mode
- **EMAIL_VERIFICATION_SETUP.md** - Email verification flow

### Production Setup
- **PRODUCTION_READINESS_CHECKLIST.md** - Deployment checklist

### Guidelines
- **guidelines/Guidelines.md** - Development best practices

---

## 🎨 Design System

### Color Tokens (globals.css)
- **Primary**: Purple/Indigo gradient theme
- **Surface**: White/Slate with dark mode support
- **Accent**: Rainbow gradients for Create tab
- **Typography**: Inter font with responsive scaling

### Achievement Rarity Colors
- **Common**: Green (#10b981)
- **Uncommon**: Blue (#3b82f6)
- **Rare**: Purple (#a855f7)
- **Epic**: Orange (#f59e0b)
- **Legendary**: Gold (#eab308)

---

## 🔧 Environment Variables

Required in Supabase Edge Function:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

---

## 📱 Mobile Support

- **Responsive Design**: Optimized for all screen sizes
- **Touch Gestures**: Native touch interactions
- **Dynamic Viewport**: Uses `dvh` units for mobile browsers
- **Portal Modals**: Guaranteed centering on all devices
- **Optimized Media**: Automatic compression for mobile networks

---

## 🏗️ Database Schema

### Key Tables
- **kv_store_f9be53a7**: Key-value store for flexible data
  - Stores: user stats, achievements, capsules, drafts, pending deliveries

### Storage Buckets
- **make-f9be53a7-media**: Private bucket for media files
- Signed URLs for secure access

---

## 🎯 Recent Major Updates

### ✅ November 4, 2025
- **Achievement System Expansion**: 25 → 35 achievements (7x5 grid)
- **Mobile Modal Fix**: React Portal implementation for perfect centering
- **Documentation Cleanup**: Consolidated 100+ files to essential docs
- **Calendar View**: Dark theme makeover
- **Sticker System**: Canvas-based rendering with export

### ✅ October 2024
- **MediaEnhancementOverlay**: Full CapCut-style editing suite
- **Web Audio API**: 8 era-themed audio filters
- **Email Delivery**: Production-ready with Resend integration
- **Dashboard Redesign**: Clean navigation with loading skeletons
- **Vault Tab**: Legacy access and beneficiary management

---

## 📞 Support

For issues or questions:
- Check existing documentation in root directory
- Review component comments for implementation details
- Verify environment variables are set correctly

---

**Built with ❤️ for preserving memories across time**
