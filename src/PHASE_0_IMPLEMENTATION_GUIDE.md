# 🛠️ PHASE 0 IMPLEMENTATION GUIDE

**Quick reference for integrating Phase 0 components**

---

## 🗑️ STEP 1: Set Up Trash System (15 minutes)

### 1.1 Run Database Migration

```sql
-- Go to Supabase Dashboard → SQL Editor → New Query
-- Copy and paste the entire contents of PHASE_0_DATABASE_MIGRATION.sql
-- Click "Run"
-- Verify success (should see "Success. No rows returned")
```

### 1.2 Set Up Daily Cleanup Cron Job

**Option A: Using pg_cron (Recommended)**
```sql
-- In Supabase SQL Editor:
SELECT cron.schedule(
  'trash-cleanup',
  '0 2 * * *',  -- 2 AM UTC daily
  $$SELECT auto_cleanup_trash()$$
);

-- Verify it was created:
SELECT * FROM cron.job WHERE jobname = 'trash-cleanup';
```

**Option B: Using Supabase Edge Function**
Create `/supabase/functions/trash-cleanup/index.tsx`:
```typescript
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { error } = await supabase.rpc('auto_cleanup_trash');
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  
  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
```

Then schedule it in Supabase Dashboard → Edge Functions → Cron Jobs.

### 1.3 Add Trash Tab to Settings

In `/components/Settings.tsx`, add a new tab:

```tsx
import { TrashManager } from './TrashManager';

// In your tabs array, add:
{
  id: 'trash',
  label: 'Trash',
  icon: Trash2,
  content: <TrashManager userId={userId} accessToken={accessToken} />
}
```

### 1.4 Replace Delete Functions

Find all instances of capsule deletion and replace:

**Before (Permanent Delete):**
```typescript
await supabase
  .from('capsules')
  .delete()
  .eq('id', capsuleId);
```

**After (Soft Delete with Undo):**
```typescript
import { softDeleteCapsule } from './components/TrashManager';

await softDeleteCapsule(capsuleId, userId);
// Automatically shows toast with "Undo" button for 5 seconds
```

### 1.5 Update All Queries

Add `deleted_at IS NULL` filter to all capsule queries:

**Before:**
```typescript
const { data } = await supabase
  .from('capsules')
  .select('*')
  .eq('user_id', userId);
```

**After:**
```typescript
const { data } = await supabase
  .from('capsules')
  .select('*')
  .eq('user_id', userId)
  .is('deleted_at', null);  // ← ADD THIS LINE
```

**Files to Update:**
- `/components/Dashboard.tsx`
- `/components/ReceivedCapsules.tsx`
- `/components/LegacyVault.tsx`
- `/components/MemoryFeed.tsx`
- `/hooks/useAchievements.tsx` (capsule counting)

---

## 🛡️ STEP 2: Integrate Error Boundaries (10 minutes)

### 2.1 Wrap Main App Sections

In `/App.tsx`, wrap major sections:

```tsx
import {
  DashboardErrorBoundary,
  CapsuleCreationErrorBoundary,
  MediaErrorBoundary,
  VaultErrorBoundary,
  AchievementsErrorBoundary,
  ProfileErrorBoundary
} from './components/EnhancedErrorBoundary';

// Then wrap each major component:

{activeTab === 'home' && (
  <DashboardErrorBoundary>
    <Dashboard />
  </DashboardErrorBoundary>
)}

{showCreateCapsule && (
  <CapsuleCreationErrorBoundary>
    <CreateCapsule />
  </CapsuleCreationErrorBoundary>
)}

{showMediaEnhancement && (
  <MediaErrorBoundary>
    <MediaEnhancementOverlay />
  </MediaErrorBoundary>
)}

{activeTab === 'vault' && (
  <VaultErrorBoundary>
    <LegacyVault />
  </VaultErrorBoundary>
)}

{showAchievements && (
  <AchievementsErrorBoundary>
    <AchievementsDashboard />
  </AchievementsErrorBoundary>
)}

{activeTab === 'settings' && (
  <ProfileErrorBoundary>
    <Settings />
  </ProfileErrorBoundary>
)}
```

### 2.2 Test Error Boundaries

Add a test button (development only):

```tsx
{process.env.NODE_ENV === 'development' && (
  <Button onClick={() => { throw new Error('Test Error Boundary'); }}>
    Test Error
  </Button>
)}
```

Click it to verify the error boundary shows a nice fallback UI.

---

## 📝 STEP 3: Clean Up Console Logs (Ongoing)

### 3.1 Replace Console.log Patterns

Use find-and-replace in your editor:

**Pattern 1: Simple logs**
```typescript
// Find:
console.log('✅ Something happened');

// Replace:
logger.debug('Something happened');
```

**Pattern 2: Logs with email/user data**
```typescript
// Find:
console.log('User email:', user.email);

// Replace:
logger.auth('User authentication event');  // Don't log email!
```

**Pattern 3: Error logs**
```typescript
// Find:
console.error('Error:', error);

// Replace:
logger.error('Error occurred:', error);  // Logger scrubs sensitive data
```

### 3.2 Context-Specific Logging

Use specialized logger methods:

```typescript
logger.auth('Sign in attempt');        // Authentication events
logger.capsule('Capsule created');     // Capsule operations
logger.media('Media uploaded');        // Media operations
logger.achievement('Achievement unlocked'); // Achievements
logger.database('Query executed');     // Database operations
logger.performance('Operation took 2.3s'); // Performance
```

### 3.3 User Action Tracking

For analytics-safe logging:

```typescript
logger.userAction('create_capsule', { 
  hasMedia: true,
  recipientCount: 2,
  // ❌ DON'T include: email, name, content
  // ✅ DO include: counts, flags, types
});
```

### 3.4 Priority Order

Clean up these files first (highest sensitivity):
1. `/components/Auth.tsx` ← Has emails, passwords, tokens
2. `/components/CapsuleViewer.tsx` ← Has tokens
3. `/supabase/functions/server/index.tsx` ← Backend logs
4. `/App.tsx` ← Already partially done
5. `/components/Dashboard.tsx`
6. Everything else

---

## 🎨 STEP 4: Loading State Audit (Bonus)

### 4.1 Standard Loading Pattern

Use this pattern everywhere:

```tsx
function MyComponent() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await fetchData();
      setData(result);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <MyComponentSkeleton />;  // ← Always have a skeleton
  }

  return <div>{/* Actual content */}</div>;
}
```

### 4.2 Reuse Existing Skeletons

Already available:
- `<DashboardSkeleton />` - Dashboard loading
- `<CapsuleGridSkeleton />` - Capsule grid
- `<CreateCapsuleSkeleton />` - Create form
- `<AIEditorSkeleton />` - AI editor

Create new ones as needed following the same pattern.

---

## ✅ VERIFICATION CHECKLIST

After completing all steps, verify:

### Trash System
- [ ] Database migration ran successfully
- [ ] Cron job is scheduled (check Supabase logs tomorrow)
- [ ] Deleting a capsule shows "Undo" toast
- [ ] Clicking "Undo" restores the capsule
- [ ] Trash tab shows deleted capsules
- [ ] Can restore from trash
- [ ] Can permanently delete from trash
- [ ] Days-until-deletion warning shows correctly

### Error Boundaries
- [ ] Test button triggers error boundary
- [ ] Error boundary shows user-friendly message
- [ ] "Reload Page" button works
- [ ] "Go Home" button works
- [ ] "Try Again" button works
- [ ] Error details hidden in production
- [ ] Error details visible in development

### Logger
- [ ] No console.log in Auth.tsx
- [ ] No email addresses in logs
- [ ] No tokens in logs
- [ ] No passwords in logs
- [ ] Development mode shows debug logs
- [ ] Production mode hides debug logs (test in build)

### Loading States
- [ ] Dashboard doesn't show blank screen
- [ ] Vault doesn't flash blank
- [ ] Settings loads smoothly
- [ ] All async operations have loading states

---

## 🐛 TROUBLESHOOTING

### "Function auto_cleanup_trash() doesn't exist"
**Solution**: You forgot to run the database migration. Run `PHASE_0_DATABASE_MIGRATION.sql`.

### "Undo button doesn't appear"
**Solution**: Make sure you're using `softDeleteCapsule()` function, not direct database delete.

### "Error boundary not showing"
**Solution**: Make sure you wrapped the component that's throwing the error, not the parent.

### "Still seeing console.log in production"
**Solution**: 
1. Check that `window.location.hostname !== 'localhost'`
2. Rebuild the app (logger caches environment detection)
3. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

### "Deleted capsules still showing"
**Solution**: Add `.is('deleted_at', null)` to your query.

---

## 📞 SUPPORT

If you're stuck:
1. Check `/PHASE_0_PRODUCTION_STABILIZATION_STATUS.md` for progress
2. Review error messages in browser console
3. Check Supabase logs (Dashboard → Logs)
4. Verify database schema matches migration

---

**Happy implementing! You've got this! 🚀**
