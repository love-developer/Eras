# 🏆 Achievement & Title Unlock Trigger Reference

**Complete guide to what triggers each of the 35 achievements and their associated title unlocks in Eras**

---

## 📋 Table of Contents
- [Trigger Mechanism](#trigger-mechanism)
- [Starter Achievements (A001-A010)](#starter-achievements-common)
- [Era-Themed Achievements (B001-B007)](#era-themed-achievements-uncommon--rare)
- [Time-Based Achievements (C001-C004)](#time-based-achievements-rare)
- [Volume Achievements (D001-D005)](#volume-achievements-uncommon--legendary)
- [Special Achievements (E001-E005)](#special-achievements-rare--hidden)
- [Legendary Achievements (E006-E009)](#legendary-achievements-legendary)
- [Title Unlock Sequence](#title-unlock-sequence)

---

## 🔧 Trigger Mechanism

### How Achievements Unlock:

1. **User performs an action** (create capsule, add media, use filter, etc.)
2. **Frontend calls `trackAction()`** from `useAchievements` hook
3. **Backend API endpoint** (`/achievements/track`) receives the action
4. **Stats are updated** in the key-value store
5. **Achievement definitions are checked** against new stats
6. **If criteria met**, achievement unlocks
7. **Frontend displays**:
   - Achievement toast notification (6 seconds)
   - Achievement unlock modal (click toast or auto-open)
   - Title unlock modal (if achievement has a title reward - appears after closing achievement modal with 600ms delay)
   - Confetti animation (for Epic/Legendary achievements)

### Important Action Codes:
- `capsule_created` - Creating/scheduling a capsule
- `capsule_sent` - Capsule is scheduled/sent
- `capsule_received` - User receives a capsule
- `media_uploaded` - Adding media (photo/video/audio)
- `filter_used` - Applying visual filter
- `audio_filter_used` - Applying audio filter
- `sticker_added` - Adding sticker
- `visual_effect_added` - Adding visual effect
- `capsule_edited` - Editing existing capsule

---

## 🌟 Starter Achievements (Common)

### A001: First Step 🎬
- **Title:** "Time Novice"
- **Points:** 10
- **Trigger:** Create your FIRST capsule
- **Action:** `trackAction('capsule_created', {...})`
- **Location:** CreateCapsule.tsx line 2317
- **Stat:** `capsules_created >= 1`
- **Note:** This title is also auto-granted during sign-up via `/titles/initialize` endpoint

### A002: Into the Future 📤
- **Title:** None
- **Points:** 15
- **Trigger:** Send/schedule your FIRST capsule
- **Action:** `trackAction('capsule_sent', {})`
- **Location:** CreateCapsule.tsx line 2329
- **Stat:** `capsules_sent >= 1`

### A003: From the Past 📥
- **Title:** None
- **Points:** 20
- **Trigger:** Receive your FIRST capsule
- **Action:** Auto-tracked when capsule delivery date arrives
- **Stat:** `capsules_received >= 1`

### A004: Captured Moment 📸
- **Title:** None
- **Points:** 10
- **Trigger:** Add your FIRST photo
- **Action:** `trackAction('media_uploaded', { type: 'photo' })`
- **Location:** CreateCapsule.tsx line 2334
- **Stat:** `media_by_type.photo >= 1`

### A005: Motion Picture 🎥
- **Title:** None
- **Points:** 10
- **Trigger:** Add your FIRST video
- **Action:** `trackAction('media_uploaded', { type: 'video' })`
- **Location:** CreateCapsule.tsx line 2334
- **Stat:** `media_by_type.video >= 1`

### A006: Voice of Time 🎤
- **Title:** None
- **Points:** 10
- **Trigger:** Record your FIRST audio message
- **Action:** `trackAction('media_uploaded', { type: 'audio' })`
- **Location:** CreateCapsule.tsx line 2334
- **Stat:** `media_by_type.audio >= 1`

### A007: Enhanced Memory ✨
- **Title:** None
- **Points:** 10
- **Trigger:** Use ANY enhancement feature 5 TIMES (filters, stickers, effects)
- **Actions:** Any combination of:
  - `trackAction('filter_used', {...})` - MediaEnhancementOverlay.tsx line 2245
  - `trackAction('audio_filter_used', {...})` - MediaEnhancementOverlay.tsx line 2427
  - `trackAction('sticker_added', {...})` - MediaEnhancementOverlay.tsx line 650
  - `trackAction('visual_effect_added', {...})` - MediaEnhancementOverlay.tsx line 621
- **Stat:** `enhancements_used >= 5`

### A008: Multimedia Creator 🎨
- **Title:** None
- **Points:** 15
- **Trigger:** Create a capsule with 3+ DIFFERENT content types (e.g., text + photo + video)
- **Action:** Automatically detected when `trackAction('capsule_created', { contentTypes: [...] })` is called
- **Stat:** Checked via `multimedia_capsule_created` specific action

### A009: Future Planner 📅
- **Title:** None
- **Points:** 10
- **Trigger:** Schedule a capsule 30+ DAYS in advance
- **Action:** `trackAction('capsule_created', { scheduleDays: X })`
- **Location:** CreateCapsule.tsx line 2317
- **Stat:** `max_schedule_days >= 30`

### A010: Consistent Creator 📆
- **Title:** None
- **Points:** 10
- **Trigger:** Create capsules on 3 DIFFERENT DAYS (not consecutive)
- **Action:** Auto-tracked via creation timestamp
- **Stat:** `unique_creation_days >= 3`

---

## 🎨 Era-Themed Achievements (Uncommon & Rare)

### B001: Yesterday's Echo 🌅
- **Title:** "Nostalgia Weaver"
- **Points:** 25
- **Trigger:** Use "Yesterday" filter 10 TIMES
- **Action:** `trackAction('filter_used', { filterName: 'yesterday' })`
- **Location:** MediaEnhancementOverlay.tsx line 2245
- **Stat:** `filter_usage.yesterday >= 10`

### B002: Future Light 💫
- **Title:** "Futurist"
- **Points:** 25
- **Trigger:** Use "Future Light" filter 10 TIMES
- **Action:** `trackAction('filter_used', { filterName: 'future_light' })`
- **Location:** MediaEnhancementOverlay.tsx line 2245
- **Stat:** `filter_usage.future_light >= 10`

### B003: Dream Weaver 🎨
- **Title:** "Dream Weaver"
- **Points:** 25
- **Trigger:** Use "Dream" filter 10 TIMES
- **Action:** `trackAction('filter_used', { filterName: 'dream' })`
- **Location:** MediaEnhancementOverlay.tsx line 2245
- **Stat:** `filter_usage.dream >= 10`

### B004: Effect Master ✨
- **Title:** "Audio Alchemist"
- **Points:** 75
- **Trigger:** Use ALL 8 audio filters AT LEAST ONCE
  1. Yesterday
  2. Future Light
  3. Echo
  4. Dream
  5. Vintage
  6. Cosmic
  7. Underwater
  8. Cathedral
- **Action:** `trackAction('audio_filter_used', { filterName: X })`
- **Location:** MediaEnhancementOverlay.tsx line 2427
- **Stat:** Combo requirement - all 8 filter stats >= 1

### B005: Sticker Collector 🎭
- **Title:** "Sticker Master"
- **Points:** 50
- **Trigger:** Use 50+ STICKERS across all capsules
- **Action:** `trackAction('sticker_added', { stickerType: X })`
- **Location:** MediaEnhancementOverlay.tsx line 650
- **Stat:** `stickers_used >= 50`

### B006: Memory Revisited 🔄
- **Title:** None
- **Points:** 30
- **Trigger:** Edit 5 EXISTING CAPSULES after creation
- **Action:** `trackAction('capsule_edited', {})`
- **Location:** CreateCapsule.tsx line 2420
- **Stat:** `capsules_edited >= 5`

### B007: Social Butterfly 🦋
- **Title:** None
- **Points:** 35
- **Trigger:** Send capsules to 5 DIFFERENT RECIPIENTS
- **Action:** Auto-tracked when capsule is sent to unique email
- **Stat:** `unique_recipients >= 5`

---

## ⏰ Time-Based Achievements (Rare)

### C001: Time Traveler 🕐
- **Title:** "Chrononaut"
- **Points:** 100
- **Trigger:** Successfully schedule a capsule 1+ YEAR (365+ days) in advance
- **Action:** `trackAction('capsule_created', { scheduleDays: 365+ })`
- **Stat:** `max_schedule_days >= 365`

### C002: Weekly Ritual 📅
- **Title:** "Chronicler"
- **Points:** 50
- **Trigger:** Create capsules for 7 CONSECUTIVE DAYS
- **Action:** Auto-tracked via creation dates
- **Stat:** `current_streak >= 7`

### C003: Monthly Chronicle 🗓️
- **Title:** "Chronicler"
- **Points:** 75
- **Trigger:** Create at least 1 capsule per month for 6 CONSECUTIVE MONTHS
- **Action:** Backend checks `monthly_streak_check`
- **Stat:** Requires backend monthly validation

### C004: Anniversary 🎂
- **Title:** "Veteran"
- **Points:** 100
- **Trigger:** Use Eras for 1 FULL YEAR (365+ days)
- **Action:** Backend checks `account_age_check`
- **Stat:** `days_since_signup >= 365`

---

## 📦 Volume Achievements (Uncommon → Legendary)

### D001: Capsule Collector 📦
- **Title:** None
- **Points:** 30
- **Trigger:** Create 10 CAPSULES total
- **Action:** `trackAction('capsule_created', {...})`
- **Stat:** `capsules_created >= 10`

### D002: Archivist 🗃️
- **Title:** "Master Archivist"
- **Points:** 100
- **Trigger:** Create 50 CAPSULES total
- **Action:** `trackAction('capsule_created', {...})`
- **Stat:** `capsules_created >= 50`

### D003: Historian 🏛️
- **Title:** "Grand Historian"
- **Points:** 200
- **Trigger:** Create 100 CAPSULES total
- **Action:** `trackAction('capsule_created', {...})`
- **Stat:** `capsules_created >= 100`

### D004: Legend 🌟
- **Title:** "Legend"
- **Points:** 500
- **Trigger:** Create 500 CAPSULES total
- **Action:** `trackAction('capsule_created', {...})`
- **Stat:** `capsules_created >= 500`

### D005: Media Mogul 💎
- **Title:** None
- **Points:** 75
- **Trigger:** Upload 100 MEDIA FILES total (photos + videos + audio)
- **Action:** `trackAction('media_uploaded', {...})`
- **Stat:** `media_uploaded >= 100`

---

## 🎯 Special Achievements (Rare & Hidden)

### E001: Night Owl 🌙 (HIDDEN)
- **Title:** "Midnight Chronicler"
- **Points:** 50
- **Trigger:** Create a capsule AT 3:00 AM (exact hour)
- **Action:** Backend detects hour from `capsule_created_at_hour`
- **Stat:** Creation timestamp hour === 3

### E002: Birthday Surprise 🎉 (HIDDEN)
- **Title:** "Birthday Planner"
- **Points:** 60
- **Trigger:** Send a capsule scheduled for someone's birthday
- **Action:** Backend detects via `birthday_capsule_sent`
- **Stat:** Requires birthday detection logic (currently manual trigger)

### E003: Vault Guardian 🔮
- **Title:** "Legacy Guardian"
- **Points:** 100
- **Trigger:** Set up Legacy Vault with beneficiaries
- **Action:** Backend tracks `legacy_vault_setup`
- **Location:** LegacyVault component
- **Stat:** `legacy_vault_setup === true`

### E004: Cinematic 📺
- **Title:** "Cinematographer"
- **Points:** 75
- **Trigger:** Create a capsule with 10+ MEDIA FILES
- **Action:** Backend detects via `capsule_with_10_media`
- **Stat:** Checked when capsule is created

### E005: Globe Trotter 🌍
- **Title:** "Social Connector"
- **Points:** 80
- **Trigger:** Send capsules to 10+ DIFFERENT RECIPIENTS
- **Action:** Auto-tracked when capsule is sent
- **Stat:** `unique_recipients >= 10`

---

## 👑 Legendary Achievements (Legendary)

### E006: Time Lord ⏳
- **Title:** "Time Lord"
- **Points:** 100
- **Trigger:** Have ACTIVE capsules scheduled across 5+ DIFFERENT YEARS
- **Action:** Backend checks `capsules_across_years`
- **Stat:** Requires checking active capsule years

### E007: Master Curator 👑
- **Title:** "Master Curator"
- **Points:** 100
- **Trigger:** Apply 100+ TOTAL ENHANCEMENTS (filters + stickers + effects)
- **Action:** All enhancement actions combined
- **Stat:** `enhancements_used >= 100`

### E008: Archive Master 🏆
- **Title:** "Archive Master"
- **Points:** 150
- **Trigger:** Create 1,000 CAPSULES total
- **Action:** `trackAction('capsule_created', {...})`
- **Stat:** `capsules_created >= 1000`

### E009: Perfect Chronicle 🎯
- **Title:** "Perfect Chronicler"
- **Points:** 100
- **Trigger:** Create 30 CONSECUTIVE DAYS of capsules, EACH with media
- **Action:** Backend checks `consecutive_media_capsules`
- **Stat:** Requires daily streak + media validation

---

## 🔄 Title Unlock Sequence

### What Happens When a Title is Unlocked:

1. **Achievement unlocks** (e.g., A001: First Step)
2. **Achievement modal appears** with full-screen unlock animation
3. **User reads achievement details** and sees they unlocked a title
4. **User clicks "Continue" button**
5. **Achievement modal closes**
6. **600ms delay** (allows achievement modal to fully exit)
7. **Title unlock modal appears** with title card animation
8. **Title is automatically equipped** and saved to backend
9. **User clicks "Continue"** to close title modal
10. **Title appears in profile** and can be changed in Settings

### Achievements That Grant Titles (13 Total):

| Achievement | Title Granted |
|------------|---------------|
| A001: First Step | Time Novice |
| B001: Yesterday's Echo | Nostalgia Weaver |
| B002: Future Light | Futurist |
| B003: Dream Weaver | Dream Weaver |
| B004: Effect Master | Audio Alchemist |
| B005: Sticker Collector | Sticker Master |
| C001: Time Traveler | Chrononaut |
| C002: Weekly Ritual | Chronicler |
| C003: Monthly Chronicle | Chronicler |
| C004: Anniversary | Veteran |
| D002: Archivist | Master Archivist |
| D003: Historian | Grand Historian |
| D004: Legend | Legend |
| E001: Night Owl | Midnight Chronicler |
| E002: Birthday Surprise | Birthday Planner |
| E003: Vault Guardian | Legacy Guardian |
| E004: Cinematic | Cinematographer |
| E005: Globe Trotter | Social Connector |
| E006: Time Lord | Time Lord |
| E007: Master Curator | Master Curator |
| E008: Archive Master | Archive Master |
| E009: Perfect Chronicle | Perfect Chronicler |

---

## 🧪 Testing Achievements

### For Developers:

Use the `<AchievementUnlockTestButton />` component in Dashboard to manually trigger achievement unlocks for testing.

**Test sequence for new users:**
1. Sign up → A001 auto-unlocks with "Time Novice" title
2. Create first capsule → A001 triggers again (already have it)
3. Click through achievement modal → Title unlock modal appears after 600ms
4. Title is equipped → Can be viewed in Settings

**Debug logging:**
- 🏆 Achievement unlock flow
- 👑 Title unlock flow
- All logs visible in browser console

---

## 📝 Summary

**Total Achievements:** 35  
**Auto-Unlocked on Signup:** 1 (A001 - First Step)  
**Titles Available:** 21  
**Hidden Achievements:** 2 (E001, E002)  
**Legendary Tier:** 5 achievements  

**Easiest to unlock:**
- A001-A006 (first actions)
- A007 (5 enhancements)

**Hardest to unlock:**
- E008 (1,000 capsules)
- E009 (30-day perfect streak with media)
- E006 (capsules across 5+ years)
- C004 (1-year anniversary)

---

**Last Updated:** November 6, 2025  
**Achievement System Version:** 2.0.0
