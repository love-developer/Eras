# Achievement System - Quick Reference Guide

## 🚀 Quick Start

### Track a User Action
```typescript
import { useAchievements } from './hooks/useAchievements';

const { trackAction } = useAchievements();

// Example: User created a capsule
await trackAction('create_capsule', {
  capsuleId: '123',
  hasMedia: true
});
```

### Check Unlocked Achievements
```typescript
const { achievements, definitions } = useAchievements();

// achievements = array of unlocked achievements
// definitions = all achievement definitions
```

### Run Retroactive Migration
```typescript
const { runRetroactiveMigration } = useAchievements();
const { session } = useAuth();

const result = await runRetroactiveMigration(session.access_token);
console.log(`Unlocked ${result.newUnlocks} achievements`);
```

## 📊 API Endpoints

### Base URL
```
https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/achievements/
```

### Public Endpoints (No Auth)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/definitions` | GET | Get all achievement definitions |
| `/rarity` | GET | Get rarity percentages |
| `/global-stats` | GET | Get global statistics |

### Protected Endpoints (Require Bearer Token)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/user` | GET | Get user's achievements |
| `/stats` | GET | Get user's stats |
| `/pending` | GET | Get pending notifications |
| `/track` | POST | Track action & check unlocks |
| `/insights` | GET | Get user insights |
| `/retroactive-migration` | POST | Run retroactive check |
| `/retroactive-status` | GET | Check migration status |
| `/mark-shown` | POST | Mark notifications shown |
| `/mark-shared` | POST | Mark achievement shared |

## 🎯 Available Actions

Track these actions to unlock achievements:

- `create_capsule` - User creates a time capsule
- `send_capsule` - User sends a capsule
- `receive_capsule` - User receives a capsule
- `upload_media` - User uploads media
- `use_filter` - User applies a filter (pass filter name in metadata)
- `use_enhancement` - User uses an enhancement
- `daily_login` - User logs in (for streak tracking)

## 🏆 Achievement Categories

- **starter** - Beginner achievements (first capsule, first media, etc.)
- **era_themed** - Era-specific achievements (yesterday filter, future light, etc.)
- **time_based** - Time-related achievements (late night creator, early bird, etc.)
- **volume** - Volume-based achievements (10 capsules, 50 media files, etc.)
- **enhance** - Enhancement-related achievements (filter master, enhancement pro, etc.)
- **special** - Special rare achievements (time capsule legend, etc.)

## 💎 Rarity Levels

- **common** - Easy to get (most users will unlock)
- **uncommon** - Moderate difficulty
- **rare** - Harder to get (fewer users)
- **epic** - Very difficult (special actions required)
- **legendary** - Extremely rare (1-5% of users)

## 🎨 UI Components

### Display Achievement Badge
```typescript
import { AchievementBadge } from './components/AchievementBadge';

<AchievementBadge
  achievement={achievement}
  locked={false}
  size="md"
  rarityPercentage={15.3}
  onClick={() => console.log('Clicked!')}
/>
```

### Show Achievement Dashboard
```typescript
import { AchievementsDashboard } from './components/AchievementsDashboard';

<AchievementsDashboard />
```

### Global Unlock Manager (Already in App.tsx)
```typescript
import { AchievementUnlockManager } from './components/AchievementUnlockManager';

<AchievementUnlockManager 
  onNavigateToAchievements={() => handleTabChange('achievements')}
/>
```

## 🔧 Common Patterns

### Pattern 1: Track Action After Success
```typescript
const handleCreateCapsule = async () => {
  // Create capsule
  const capsule = await createCapsule(data);
  
  // Track achievement action
  if (session?.access_token) {
    trackAction('create_capsule', {
      capsuleId: capsule.id,
      hasMedia: data.media.length > 0
    });
  }
};
```

### Pattern 2: Display Rarity on Achievement
```typescript
const { fetchRarityPercentages } = useAchievements();
const [rarities, setRarities] = useState({});

useEffect(() => {
  fetchRarityPercentages().then(setRarities);
}, []);

// Use rarities[achievementId] to get percentage
```

### Pattern 3: Check for Pending Notifications
```typescript
const { checkPendingNotifications } = useAchievements();
const { session } = useAuth();

useEffect(() => {
  if (session?.access_token) {
    checkPendingNotifications(session.access_token);
  }
}, [session]);
```

## 🐛 Debugging

### Check Server Logs
```bash
# Look for these log patterns:
🏆 [Achievement] Tracking action 'create_capsule'
✅ [Achievement] Unlocked: First Steps
⚠️ [Rate Limit] Action is on cooldown
🔄 [Retroactive] Running migration
```

### Check Client Logs
```bash
# Open browser console and look for:
🔄 [Retroactive] Starting migration...
✅ [Retroactive] Unlocked 3 achievements
```

### Verify API Calls
```javascript
// Check if token is being sent
fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}` // Should be JWT, not anon key
  }
});
```

## ⚡ Performance Tips

1. **Cache rarity data** - Only fetch once per session
2. **Batch track actions** - Don't track every single event
3. **Use pending notifications** - Check once on load, not continuously
4. **Lazy load dashboard** - Load achievements tab on-demand

## 🔐 Security Notes

- Never expose achievement unlock logic to client
- All unlock checks happen server-side
- Use rate limiting to prevent abuse (10-second cooldowns)
- Validate user ownership before unlocking

## 📈 Analytics

Track these metrics:
- Total achievements unlocked (global)
- Average completion percentage per user
- Most/least common achievements
- Time to first achievement
- Achievement unlock velocity

## 🎉 Common Issues & Solutions

### Issue: Achievements not unlocking
**Solution:** Check that:
1. User is authenticated (have access token)
2. Action name matches definition exactly
3. Unlock criteria are met
4. No rate limit active (check cooldowns)

### Issue: Retroactive migration not running
**Solution:** Check that:
1. localStorage key hasn't been set yet
2. User has existing activity (stats > 0)
3. Access token is valid
4. Server is responsive

### Issue: Rarity percentages not showing
**Solution:** Check that:
1. `fetchRarityPercentages()` is being called
2. Data is being passed to `AchievementBadge`
3. Achievement is unlocked (locked badges don't show rarity)

## 📚 Additional Resources

- Full Implementation: `/ACHIEVEMENT_ENHANCEMENTS_COMPLETE.md`
- Service Functions: `/supabase/functions/server/achievement-service.tsx`
- API Routes: `/supabase/functions/server/index.tsx`
- React Hook: `/hooks/useAchievements.tsx`
- Dashboard: `/components/AchievementsDashboard.tsx`

---

**Questions?** Check the complete documentation or review the achievement-service.tsx file for detailed implementation.
