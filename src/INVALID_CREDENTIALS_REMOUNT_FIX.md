# Invalid Credentials Causing Unnecessary Remount - FIXED ✅

## Problem
When users entered invalid login credentials, the app would:
1. Show "Invalid login credentials" error (correct) ✅
2. Incorrectly call `onAuthenticationSuccess` (wrong) ❌
3. Trigger the loading animation (wrong) ❌
4. Cause MainAppContent to remount (wrong) ❌
5. Reset scroll position and state (wrong) ❌

## Error Logs
```
❌ Sign in error: AuthApiError: Invalid login credentials
❌ Error details: {"message": "Invalid login credentials", "status": 400, "name": "AuthApiError"}
⚠️ Invalid credentials - checking if email verification is pending...
🚨 onAuthenticationSuccess called - This should only happen during initial login!
🚨 REMOUNT TRIGGER: showLoadingAnimation changed to TRUE
🚨 REMOUNT TRIGGER: isTransitioning changed to TRUE
🚨 MainAppContent props changed - will re-render
```

## Root Cause
The Auth component had a `useEffect` that runs on mount (lines 40-180) to check for existing sessions from email verification flows. However, it was calling `onAuthenticated` for **ANY** existing session, not just sessions from email verification.

### The Flow (BEFORE FIX):
1. User previously signed in → Session exists in Supabase
2. User logs out (or session expires) → Auth screen shows
3. User tries to sign in with wrong password
4. Sign-in fails with "Invalid login credentials" ✅
5. BUT the Auth mount effect detects the OLD session
6. Calls `onAuthenticated(userData, accessToken)` ❌
7. Triggers loading animation and causes remount ❌

## Solution
Modified `/components/Auth.tsx` (lines 39-75) to only auto-authenticate from existing sessions when:
- The URL hash contains email verification tokens (`type=signup`, `type=email`, or `type=recovery`)
- This indicates the user just clicked an email verification link

### Changes Made:
```typescript
// BEFORE:
const { data: { session }, error } = await supabase.auth.getSession();
if (session?.user) {
  // Auto-login for ANY existing session ❌
  onAuthenticated(userData, session.access_token);
}

// AFTER:
const hash = window.location.hash;
const isEmailVerificationFlow = hash && (
  hash.includes('type=signup') || 
  hash.includes('type=email') || 
  hash.includes('type=recovery')
);

if (!isEmailVerificationFlow) {
  console.log('ℹ️ Not an email verification flow - skipping session check');
  return; // User must sign in manually ✅
}

const { data: { session }, error } = await supabase.auth.getSession();
if (session?.user) {
  // Only auto-login for email verification flows ✅
  onAuthenticated(userData, session.access_token);
}
```

## Benefits
1. ✅ Invalid credentials now only show an error (no remount)
2. ✅ Loading animation only triggers on successful authentication
3. ✅ No unexpected remounts during failed sign-in attempts
4. ✅ Scroll position and state preserved during failed sign-ins
5. ✅ Email verification flows still work correctly

## Testing
To verify the fix:
1. Sign in to the app
2. Sign out
3. Try signing in with WRONG password
4. Should see only: "Invalid login credentials" error
5. Should NOT see: Loading animation or remount logs
6. Try signing in with CORRECT password
7. Should see: Loading animation and successful login ✅

## Related Files Modified
- `/components/Auth.tsx` (lines 39-75)

## Related Issues Fixed
- ❌ 401 errors in Titles endpoint (separate issue, fixed separately)
- ✅ Invalid credentials causing remount (this fix)
- ✅ onAuthenticationSuccess being called incorrectly (this fix)
- ✅ Loading animation triggering on failed sign-in (this fix)
