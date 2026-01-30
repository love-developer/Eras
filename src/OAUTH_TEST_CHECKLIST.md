# ✅ OAuth ErasGate Test Checklist

**Purpose:** Verify Google OAuth triggers ErasGate and Eclipse animation  
**Date:** January 2025

---

## 🎯 Quick Test (5 minutes)

### Step 1: Clear State
```
1. Open browser console (F12)
2. Run: localStorage.clear(); sessionStorage.clear();
3. Refresh page
```

### Step 2: Start OAuth Flow
```
1. Click "Sign in with Google"
2. Watch console - should see:
   ✅ "🚪 [OAUTH START] Marking OAuth flow start"
   ✅ "🚪 [OAUTH START] Set eras-oauth-expects-gate flag"
```

### Step 3: Complete OAuth
```
1. Select Google account
2. Grant permissions (if prompted)
3. Wait for redirect back to app
```

### Step 4: Verify Callback
```
After redirect, check console for:
   ✅ "✅ [AUTH MOUNT] OAuth callback detected"
   ✅ "🚪 [AUTH MOUNT → ERAS GATE] OAuth redirect detected"
   ✅ "🚪 [AUTH MOUNT → ERAS GATE] Provider: google"
```

### Step 5: Verify ErasGate
```
Should see:
   ✅ "🚪 [ERAS GATE] ✅ Activating ErasGate"
   ✅ "🌙 [ERAS GATE] ✅ FRESH LOGIN DETECTED"
   ✅ "🎬🎬🎬 LoadingAnimation component RENDERING"
```

### Step 6: Verify Eclipse
```
Should see:
   ✅ Eclipse animation plays (~4.9s)
   ✅ Smooth transition to Dashboard
   ✅ User is authenticated
```

---

## ❌ If Test Fails

### Check #1: OAuth Callback Detection

**In console, immediately after redirect:**
```javascript
console.log('Hash:', window.location.hash);
// Should contain: #access_token=...
```

**Expected:** URL hash with access_token  
**If missing:** OAuth redirect failed - check Supabase config

---

### Check #2: Session Storage Markers

**After clicking "Sign in with Google":**
```javascript
console.log({
  flow: sessionStorage.getItem('eras-oauth-flow'),
  gate: sessionStorage.getItem('eras-oauth-expects-gate')
});
```

**Expected:** `{ flow: "google", gate: "true" }`  
**If missing:** handleGoogleSignIn not executing properly

---

### Check #3: Session Retrieval

**After OAuth redirect:**
```javascript
const { data } = await supabase.auth.getSession();
console.log('Session:', data.session);
```

**Expected:** Session object with user data  
**If null:** Supabase OAuth config issue

---

## 🐛 Common Problems

### Problem 1: No Console Logs After Redirect

**Cause:** Auth component not mounting  
**Fix:** Check App.tsx routing for OAuth callback

---

### Problem 2: "OAuth callback detected" but No Session

**Cause:** Supabase Site URL mismatch  
**Fix:** 
1. Go to Supabase Dashboard
2. Authentication → URL Configuration
3. Set "Site URL" to your app URL exactly
4. Wait 2-3 minutes for propagation

---

### Problem 3: ErasGate Not Activating

**Cause:** `isFreshLogin` not being passed  
**Fix:** Check Auth.tsx line 147-154 for `isFreshLogin: true`

---

### Problem 4: Eclipse Doesn't Play

**Cause:** ErasGate decision logic issue  
**Fix:** Check ErasGate.tsx props - `isFreshLogin` should be `true`

---

## 📸 What to Report

If test fails, provide:

1. **Console logs** (copy/paste full output)
2. **URL after redirect** (with access_token redacted)
3. **Which step failed** (1-6 above)
4. **Browser & OS** (Chrome/Safari, Windows/Mac)
5. **Screenshots** of console at failure point

---

## ✅ Success Criteria

Test passes if:

1. ✅ Console shows all expected logs
2. ✅ Eclipse animation plays
3. ✅ Dashboard appears after ~5s
4. ✅ User is authenticated
5. ✅ No error messages
6. ✅ No white flash or flicker

---

**Estimated Time:** 5 minutes  
**Requires:** Google account for OAuth testing  
**Cleanup:** Run `localStorage.clear(); sessionStorage.clear();` after test
