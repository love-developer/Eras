# 👑 Achievement → Title Mapping - CORRECT (22 Titles Total)

## Overview
**22 out of 35 achievements** award unique Legacy Titles. The other 13 achievements award points only.

## ✅ Title Reward Sequence

### Is the Title Modal Configured?
**YES!** The Title Reward Modal is already configured to appear AFTER the Achievement Unlock Modal.

### The Sequence
```
1. User unlocks achievement (e.g., A001 "First Step")
2. 🎬 Achievement Unlock Modal opens immediately
   - Shows achievement details
   - User closes modal
3. Modal checks: "Does this achievement have a title?"
   - If YES → Calls onTitleUnlock()
4. AU Modal closes
5. ⏱️ 600ms delay
6. 👑 Title Reward Modal opens automatically
   - Shows "New Title Unlocked!"
   - Shows the title name
7. Complete! ✨
```

### Code Location
**File**: `/components/AchievementUnlockModal.tsx` (Lines 385-388)
```typescript
if (achievement?.rewards?.title && onTitleUnlock) {
  // Trigger title reward modal AFTER this modal closes
  onTitleUnlock(achievement.rewards.title, achievement.rarity, achievement.title);
}
```

---

## 🏆 Complete Achievement → Title Mapping (22 Titles)

### ⭐ Starter Achievements (1 Title)

| Achievement ID | Achievement Name | Rarity | Title Awarded |
|----------------|------------------|--------|---------------|
| **A001** | First Step | Common | **"Time Novice"** |

**Note**: A002-A010 do NOT award titles (just points)

---

### 🎨 Era-Themed Achievements (5 Titles)

| Achievement ID | Achievement Name | Rarity | Title Awarded |
|----------------|------------------|--------|---------------|
| **B001** | Yesterday's Echo | Uncommon | **"Nostalgia Weaver"** |
| **B002** | Future Light | Uncommon | **"Futurist"** |
| **B003** | Dream Weaver | Uncommon | **"Dream Weaver"** |
| **B004** | Effect Master | Rare | **"Audio Alchemist"** |
| **B005** | Sticker Collector | Rare | **"Sticker Master"** |

**Note**: B006-B007 do NOT award titles

---

### ⏰ Time-Based Achievements (4 Titles)

| Achievement ID | Achievement Name | Rarity | Title Awarded |
|----------------|------------------|--------|---------------|
| **C001** | Time Traveler | Rare | **"Chrononaut"** |
| **C002** | Weekly Ritual | Uncommon | **"Chronicler"** |
| **C003** | Monthly Chronicle | Rare | **"Chronicler"** (duplicate) |
| **C004** | Anniversary | Rare | **"Veteran"** |

---

### 📦 Volume Achievements (3 Titles)

| Achievement ID | Achievement Name | Rarity | Title Awarded |
|----------------|------------------|--------|---------------|
| **D002** | Archivist (50 capsules) | Rare | **"Master Archivist"** |
| **D003** | Historian (100 capsules) | Rare | **"Grand Historian"** |
| **D004** | Legend (500 capsules) | Legendary | **"Legend"** |

**Note**: D001 (10 capsules) and D005 (100 media) do NOT award titles

---

### 🌟 Special/Legendary Achievements (9 Titles)

| Achievement ID | Achievement Name | Rarity | Title Awarded |
|----------------|------------------|--------|---------------|
| **E001** | Night Owl | Rare | **"Midnight Chronicler"** |
| **E002** | Birthday Surprise | Rare | **"Birthday Planner"** |
| **E003** | Vault Guardian | Rare | **"Legacy Guardian"** |
| **E004** | Cinematic | Rare | **"Cinematographer"** |
| **E005** | Globe Trotter | Rare | **"Social Connector"** |
| **E006** | Time Lord | Legendary | **"Time Lord"** |
| **E007** | Master Curator | Legendary | **"Master Curator"** |
| **E008** | Archive Master | Legendary | **"Archive Master"** |
| **E009** | Perfect Chronicle | Legendary | **"Perfect Chronicler"** |

---

## 📊 Breakdown by Category

### Achievements WITH Titles: **22 total**
- Starter: 1
- Era-Themed: 5
- Time-Based: 4
- Volume: 3
- Special/Legendary: 9

### Achievements WITHOUT Titles: **13 total**
- **A002-A010**: Into the Future, From the Past, Captured Moment, Motion Picture, Voice of Time, AI Wordsmith, AI Visual, Future Planner, Sentimental Sender
- **B006-B007**: Text Overlay Artist, Social Butterfly
- **D001, D005**: Capsule Collector (10), Media Mogul (100 media)

---

## 🎯 Which Achievements Show Title Modal?

### ✅ These 22 Achievements Show Full AU → Title Sequence:

1. **A001** (First Step) → AU Modal → Title Modal: "Time Novice"
2. **B001** (Yesterday's Echo) → AU Modal → Title Modal: "Nostalgia Weaver"
3. **B002** (Future Light) → AU Modal → Title Modal: "Futurist"
4. **B003** (Dream Weaver) → AU Modal → Title Modal: "Dream Weaver"
5. **B004** (Effect Master) → AU Modal → Title Modal: "Audio Alchemist"
6. **B005** (Sticker Collector) → AU Modal → Title Modal: "Sticker Master"
7. **C001** (Time Traveler) → AU Modal → Title Modal: "Chrononaut"
8. **C002** (Weekly Ritual) → AU Modal → Title Modal: "Chronicler"
9. **C003** (Monthly Chronicle) → AU Modal → Title Modal: "Chronicler"
10. **C004** (Anniversary) → AU Modal → Title Modal: "Veteran"
11. **D002** (Archivist) → AU Modal → Title Modal: "Master Archivist"
12. **D003** (Historian) → AU Modal → Title Modal: "Grand Historian"
13. **D004** (Legend) → AU Modal → Title Modal: "Legend"
14. **E001** (Night Owl) → AU Modal → Title Modal: "Midnight Chronicler"
15. **E002** (Birthday Surprise) → AU Modal → Title Modal: "Birthday Planner"
16. **E003** (Vault Guardian) → AU Modal → Title Modal: "Legacy Guardian"
17. **E004** (Cinematic) → AU Modal → Title Modal: "Cinematographer"
18. **E005** (Globe Trotter) → AU Modal → Title Modal: "Social Connector"
19. **E006** (Time Lord) → AU Modal → Title Modal: "Time Lord"
20. **E007** (Master Curator) → AU Modal → Title Modal: "Master Curator"
21. **E008** (Archive Master) → AU Modal → Title Modal: "Archive Master"
22. **E009** (Perfect Chronicle) → AU Modal → Title Modal: "Perfect Chronicler"

### ❌ These 13 Achievements Show ONLY AU Modal (No Title):

- A002, A003, A004, A005, A006, A007, A008, A009, A010
- B006, B007
- D001, D005

---

## 🧪 Testing the Sequence

### Test with "First Step" (A001)

1. Create your first capsule
2. **Expected**:
   ```
   🎬 AU Modal: "First Step" achievement
   (User closes it)
   👑 Title Modal: "Time Novice" title
   ```

3. **Console logs**:
   ```
   🎉 [Achievement] 1 new achievement(s) unlocked!
   🏆 [Achievement] Opening unlock modal for: First Step
   🎯 [Achievement Modal] Has title reward: true
   ✅ [Achievement Modal] Calling onTitleUnlock with: Time Novice common First Step
   👑 [Title Reward Manager] Showing title: Time Novice
   ```

### Test with "Into the Future" (A002)

1. Send your first capsule
2. **Expected**:
   ```
   🎬 AU Modal: "Into the Future" achievement
   (User closes it)
   ❌ NO Title Modal (this achievement doesn't award a title)
   ```

3. **Console logs**:
   ```
   🎉 [Achievement] 1 new achievement(s) unlocked!
   🏆 [Achievement] Opening unlock modal for: Into the Future
   ⏭️ [Achievement Modal] No title unlock for this achievement
   ```

---

## 💡 Important Notes

### Duplicate Title Name
**C002 and C003** both award the title **"Chronicler"**. This is intentional - users can unlock it through either:
- **C002**: 7-day streak
- **C003**: 6-month monthly streak

Once unlocked via either achievement, the title is available.

### Title Collection Progress
Settings shows: **"X of 22 titles unlocked"** (not 35!)

### Backend Storage
Titles are stored in KV store:
```json
{
  "equipped_title": "Time Novice",
  "equipped_achievement_id": "A001",
  "unlocked_titles": [
    {
      "title": "Time Novice",
      "achievementId": "A001",
      "rarity": "common",
      "unlockedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## 🎭 Rarity Distribution of Titles

| Rarity | Count | Examples |
|--------|-------|----------|
| **Legendary** | 4 | Legend, Master Curator, Archive Master, Perfect Chronicler |
| **Rare** | 11 | Chrononaut, Audio Alchemist, Midnight Chronicler, etc. |
| **Uncommon** | 5 | Nostalgia Weaver, Futurist, Dream Weaver, Chronicler (x2) |
| **Common** | 1 | Time Novice |

---

## ✅ Status

🟢 **FULLY OPERATIONAL**

The Achievement → Title sequence is working correctly:
- ✅ 22 achievements properly configured with title rewards
- ✅ Title modal auto-opens after AU modal for these 22
- ✅ 13 achievements correctly show only AU modal (no title)
- ✅ All backend endpoints functional
- ✅ Queue system handles multiple unlocks
- ✅ 600ms delay ensures smooth transition

---

## 📝 Quick Reference

**Want to see the full sequence?** Unlock any of these easy achievements:
- **A001**: Create first capsule → "Time Novice"
- **B001**: Use Yesterday filter 10x → "Nostalgia Weaver"
- **C002**: 7-day streak → "Chronicler"

**Won't show title modal:** A002-A010, B006-B007, D001, D005
