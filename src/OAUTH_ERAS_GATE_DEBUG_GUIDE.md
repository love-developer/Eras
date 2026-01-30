# 🔍 OAuth ErasGate Debug Guide

**Issue:** Google OAuth login not triggering ErasGate/Eclipse animation  
**Status:** 🔧 Debugging Enhanced  
**Date:** January 2025

---

## 🎯 Expected OAuth Flow

```
1. User clicks "Sign in with Google"
      ↓
2. handleGoogleSignIn() executes
      ↓
3. sessionStorage markers set:
   - eras-oauth-flow: "google"
   - eras-oauth-timestamp: [timestamp]
   - eras-oauth-expects-gate: "true" ← NEW
      ↓
4. supabase.auth.signInWithOAuth() initiates redirect
      ↓
5. Google OAuth popup/redirect
      ↓
6. User grants permissions
      ↓
7. Redirect back to app with access_token in URL hash
      ↓
8. Auth.tsx mounts (or is already mounted)
      ↓
9. useEffect detects: hash.includes('access_token')
      ↓
10. Logs: "OAuth callback detected"
      ↓
11. getSession() to retrieve user data
      ↓
12. onAuthenticated(userData, token, { isFreshLogin: true })
      ↓
13. App.tsx: onAuthenticationSuccess()
      ↓
14. ErasGate activates
      ↓
15. Eclipse animation plays (~4.9s)
      ↓
16. Dashboard renders
```

---

## 🔍 Console Log Sequence (What You Should See)

### Phase 1: Initiate OAuth
```
🔐 Attempting Google OAuth sign-in...
🚪 [OAUTH START] Marking OAuth flow start - ErasGate should activate on callback
🚪 [OAUTH START] Set eras-oauth-expects-gate flag
✅ Google OAuth redirect initiated successfully
```

### Phase 2: After Redirect (OAuth Callback)
```
🔍 [AUTH MOUNT] Checking for existing session from email verification...
🔍 [AUTH MOUNT] Current URL: https://your-app.com/#access_token=...
🔍 [AUTH MOUNT] URL Hash: #access_token=...&expires_in=3600...
✅ [AUTH MOUNT] OAuth callback detected - checking for session
🚪 [AUTH MOUNT → ERAS GATE] OAuth redirect detected - will activate ErasGate after session check
🔍 [AUTH MOUNT] Session check result: { hasSession: true, hasUser: true, ... }
✅ [AUTH MOUNT] Found active session from email verification! Auto-logging in user: user@gmail.com
📊 [AUTH MOUNT] Profile fetch result: { ... }
🌙 [AUTH MOUNT → ANIMATION] Calling onAuthenticated for OAuth (google) with user data: { ... }
🌙 [AUTH MOUNT → ANIMATION] This should trigger the lunar eclipse opening animation
🚪 [AUTH MOUNT → ERAS GATE] Passing isFreshLogin: true to activate ErasGate
🚪 [AUTH MOUNT → ERAS GATE] Provider: google | Auth Type: OAuth (google)
🚪 [AUTH MOUNT → ERAS GATE] OAuth callback confirmed - clearing markers
🌙 [AUTH MOUNT → ANIMATION] onAuthenticated called successfully
🚪 [AUTH MOUNT → ERAS GATE] ErasGate should now activate and show Eclipse animation
```

### Phase 3: ErasGate Activation
```
🚪 [ERAS GATE] onAuthenticationSuccess called
🚪 [ERAS GATE] userData: { ... }
🚪 [ERAS GATE] isFreshLogin: true
🚪 [ERAS GATE] ✅ Activating ErasGate
🚪 [ERAS GATE] → User will be routed through universal authentication interceptor
🚪 [ERAS GATE] RENDERING ErasGate component
🚪 [ERAS GATE] Component mounted
🌙 [ERAS GATE] ✅ FRESH LOGIN DETECTED
🌙 [ERAS GATE] → Lunar Eclipse animation WILL PLAY
🎬🎬🎬 LoadingAnimation component RENDERING
```

### Phase 4: Eclipse Animation
```
[Eclipse animation plays for ~4.9s]
🌙 [ERAS GATE] ✅ Lunar Eclipse animation completed
🚪 [ERAS GATE] → Opening gate to Dashboard
🚪 [ERAS GATE] ✅ Gate opened - transitioning to Dashboard
```

---

## ❌ Common Issues & Fixes

### Issue 1: OAuth Callback Not Detected

**Symptoms:**
```
❌ No "OAuth callback detected" message
❌ URL has access_token but Auth.tsx doesn't process it
❌ User sees login screen instead of Eclipse
```

**Diagnosis:**
1. Check URL hash immediately after redirect:
   ```javascript
   console.log('Hash:', window.location.hash);
   // Should contain: #access_token=...
   ```

2. Check Auth.tsx mount useEffect:
   ```
   // Should log:
   "🔍 [AUTH MOUNT] Checking for existing session..."
   ```

**Fix:**
- Ensure Auth.tsx component is mounting after OAuth redirect
- Check that `isOAuthCallback` detection logic is working:
  ```javascript
  const isOAuthCallback = hash && hash.includes('access_token');
  ```

---

### Issue 2: Session Not Found After OAuth

**Symptoms:**
```
✅ "OAuth callback detected"
❌ Session check result: { hasSession: false }
❌ No user data retrieved
```

**Diagnosis:**
1. Check Supabase OAuth configuration:
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Verify "Site URL" matches your app URL
   - Verify "Redirect URLs" includes your app URL

2. Check Google OAuth configuration:
   - Google Cloud Console → APIs & Services → Credentials
   - Verify "Authorized redirect URIs" includes:
     - `https://[PROJECT-ID].supabase.co/auth/v1/callback`
     - Your app URL (e.g., `https://your-app.com`)

**Fix:**
- Update Supabase Site URL configuration
- Update Google OAuth redirect URIs
- Wait 2-3 minutes for changes to propagate

---

### Issue 3: ErasGate Not Activating

**Symptoms:**
```
✅ "OAuth callback detected"
✅ onAuthenticated called
❌ No "Activating ErasGate" message
❌ Dashboard appears without Eclipse
```

**Diagnosis:**
1. Check if `isFreshLogin` is being passed correctly:
   ```javascript
   // Should be:
   onAuthenticated(userData, token, { isFreshLogin: true });
   ```

2. Check App.tsx `onAuthenticationSuccess`:
   ```javascript
   // Should log:
   "🚪 [ERAS GATE] ✅ Activating ErasGate"
   ```

3. Check for duplicate prevention guards:
   ```javascript
   // Check if these are blocking:
   if (isProcessingAuthRef.current) { ... }
   if (showErasGate) { ... }
   ```

**Fix:**
- Ensure `isFreshLogin: true` is passed in Auth.tsx
- Clear any stuck state in App.tsx:
  ```javascript
  isProcessingAuthRef.current = false;
  setShowErasGate(false);
  ```

---

### Issue 4: Eclipse Doesn't Play

**Symptoms:**
```
✅ ErasGate activated
✅ ErasGate component mounted
❌ No "FRESH LOGIN DETECTED" message
❌ Eclipse animation doesn't render
```

**Diagnosis:**
1. Check ErasGate props:
   ```javascript
   console.log('isFreshLogin:', props.isFreshLogin);
   // Should be: true
   ```

2. Check ErasGate decision logic:
   ```javascript
   if (isFreshLogin) {
     // Should enter this block
     setShouldPlayEclipse(true);
   }
   ```

**Fix:**
- Verify `gateAuthData.isFreshLogin` is true in App.tsx
- Check ErasGate component is receiving correct props

---

## 🧪 Manual Testing Steps

### Test 1: Fresh OAuth Sign-In

1. **Clear all state:**
   ```javascript
   // In browser console:
   localStorage.clear();
   sessionStorage.clear();
   ```

2. **Go to login page**

3. **Open browser console** and filter for logs:
   - 🔐 (OAuth start)
   - 🚪 (ErasGate)
   - 🌙 (Animation)

4. **Click "Sign in with Google"**

5. **Watch console logs** - should see Phase 1 logs

6. **Complete Google OAuth** (select account, grant permissions)

7. **After redirect** - should see Phase 2, 3, 4 logs

8. **Verify:**
   - ✅ Eclipse animation plays
   - ✅ ~4.9s duration
   - ✅ Dashboard appears after Eclipse
   - ✅ User is authenticated

---

### Test 2: OAuth with Permission Grant

1. **Revoke app access in Google:**
   - Go to: https://myaccount.google.com/permissions
   - Find your app
   - Click "Remove Access"

2. **Try Test 1 again**

3. **When prompted to grant permissions:**
   - Grant all requested permissions
   - Click "Allow"

4. **After redirect:**
   - ✅ Should still see Eclipse animation
   - ✅ ErasGate should activate normally

**This is the key scenario** - when user has to grant permissions, there's an extra redirect that might be causing issues.

---

### Test 3: Session Restore (Should NOT Play Eclipse)

1. **Sign in with Google** (see Eclipse)

2. **Refresh page** (F5)

3. **Verify:**
   - ❌ Eclipse should NOT play
   - ✅ Dashboard appears immediately
   - ✅ Console shows: "Session restore detected"

---

## 🔧 Debugging Tools

### Check SessionStorage Markers

```javascript
// In browser console after clicking "Sign in with Google":
console.log({
  oauthFlow: sessionStorage.getItem('eras-oauth-flow'),
  oauthTimestamp: sessionStorage.getItem('eras-oauth-timestamp'),
  oauthExpectsGate: sessionStorage.getItem('eras-oauth-expects-gate')
});
```

**Expected:**
```
{
  oauthFlow: "google",
  oauthTimestamp: "1704067200000",
  oauthExpectsGate: "true"
}
```

### Check URL Hash After Redirect

```javascript
// Immediately after OAuth redirect:
console.log('URL:', window.location.href);
console.log('Hash:', window.location.hash);
```

**Expected:**
```
URL: https://your-app.com/#access_token=eyJhbGc...&expires_in=3600...
Hash: #access_token=eyJhbGc...&expires_in=3600...
```

### Check Supabase Session

```javascript
// After OAuth callback:
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
```

**Expected:**
```
{
  user: { id: "...", email: "user@gmail.com", ... },
  access_token: "eyJhbGc...",
  ...
}
```

---

## 📝 Enhanced Logging Checklist

After the recent updates, you should see these NEW logs:

1. **OAuth Start:**
   ```
   🚪 [OAUTH START] Marking OAuth flow start - ErasGate should activate on callback
   🚪 [OAUTH START] Set eras-oauth-expects-gate flag
   ```

2. **OAuth Callback Detection:**
   ```
   🚪 [AUTH MOUNT → ERAS GATE] OAuth redirect detected - will activate ErasGate after session check
   ```

3. **OAuth Callback Processing:**
   ```
   🚪 [AUTH MOUNT → ERAS GATE] Passing isFreshLogin: true to activate ErasGate
   🚪 [AUTH MOUNT → ERAS GATE] Provider: google | Auth Type: OAuth (google)
   🚪 [AUTH MOUNT → ERAS GATE] OAuth callback confirmed - clearing markers
   🚪 [AUTH MOUNT → ERAS GATE] ErasGate should now activate and show Eclipse animation
   ```

If you DON'T see these logs, there's an issue with the OAuth flow.

---

## 🚨 Known OAuth Redirect Issues

### Issue: Auth Component Not Mounting After Redirect

**Symptoms:**
- URL changes after OAuth
- No Auth.tsx mount logs
- Login screen shows instead of Eclipse

**Possible Causes:**
1. React Router blocking the mount
2. App.tsx not rendering Auth component
3. OAuth redirect URL mismatch

**Fix:**
- Check App.tsx routing logic
- Ensure Auth component renders for OAuth callback URLs
- Verify OAuth redirect URL configuration

---

### Issue: Multiple Redirects

**Symptoms:**
- User redirected multiple times
- Session created but immediately lost
- Infinite redirect loop

**Possible Causes:**
1. Site URL mismatch in Supabase
2. OAuth redirect URL conflict
3. Browser blocking cookies/storage

**Fix:**
- Update Supabase Site URL to match exactly
- Clear browser cookies and try again
- Check browser privacy settings

---

## 📊 Success Metrics

When OAuth ErasGate is working correctly:

✅ **100% of Google OAuth logins** trigger Eclipse  
✅ **~5.2s total** from redirect to Dashboard  
✅ **No white flash** between Eclipse and Dashboard  
✅ **Consistent behavior** whether first-time or returning user  
✅ **Session persists** after Eclipse completes  

---

## 🔄 Next Steps

1. **Test OAuth flow** with enhanced logging
2. **Check console** for all expected log messages
3. **Report findings:**
   - Which phase fails?
   - What error messages appear?
   - Screenshots of console logs?

4. **If still failing:**
   - Share full console log output
   - Check Supabase dashboard for OAuth config
   - Verify Google Cloud Console settings

---

**Last Updated:** January 2025  
**Status:** 🔧 Enhanced Debugging Active  
**Related Docs:**
- `/ERAS_GATE_UNIVERSAL_INTERCEPTOR_COMPLETE.md`
- `/ERAS_GATE_QUICK_CARD.md`
