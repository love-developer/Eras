# 🔍 Unexpected Home Navigation - Diagnostic System

## Issue Description
App suddenly refreshes/resets to Home screen seconds after a fresh restart.

## Root Cause Investigation

### Primary Suspects

1. **Auth Effect (Most Likely)**
   - **Location**: `/App.tsx` line 764-808
   - **Trigger**: `pendingAuthData` state change + `auth.isAuthenticated` change
   - **Behavior**: Automatically navigates to home when processing pending auth data
   - **When it runs**: After ErasGate animation completes and auth data needs processing
   
2. **ErasGate Completion Flow**
   - **Location**: `/App.tsx` line 369-410 (`handleGateComplete`)
   - **Trigger**: When user completes sign-in through ErasGate
   - **Behavior**: Sets `pendingAuthData`, which triggers Auth Effect
   - **Issue**: If this is being called unexpectedly, it would cause home navigation

3. **Tab Validation Effect**
   - **Location**: `/App.tsx` line 885-907
   - **Trigger**: When authenticated and tab hasn't been validated yet
   - **Behavior**: Validates current tab is in allowed list, redirects to home if invalid
   - **Guard**: Only runs once per session (checks `sessionStorage.getItem('eras-tab-validated')`)

## Diagnostic Logging Added

### 🎯 Enhanced Logging Points

1. **pendingAuthData State Changes** (line 304-316)
   - Logs when `pendingAuthData` is set
   - Includes stack trace to identify caller
   - **Critical Warning**: When pendingAuthData is set, logs "THIS WILL NAVIGATE TO HOME"

2. **handleGateComplete Calls** (line 369-376)
   - Logs every time gate completion is triggered
   - Includes full stack trace
   - Shows user email and timestamp

3. **Auth Effect Execution** (line 764-792)
   - Logs current auth state
   - Shows if effect will navigate to home
   - Includes stack trace when navigation occurs
   - Shows time since last mount

4. **setActiveTab Calls** (useTabNavigation.tsx line 77-92)
   - Logs every direct tab change
   - **Special Alert**: When navigating to home, logs full stack trace
   - Shows before/after tab state

## How to Use This Diagnostic

### Step 1: Reproduce the Issue
1. Restart the app
2. Navigate away from home (e.g., go to Settings)
3. Wait a few seconds
4. Observe if app resets to home

### Step 2: Check Console Logs
Look for these specific patterns:

#### Pattern A: Unexpected Auth Processing
```
🎯 [STATE CHANGE] pendingAuthData: { hasValue: true, ... }
⚠️ [CRITICAL] pendingAuthData was SET - this will trigger home navigation!
📊 [AUTH EFFECT] State check: { hasPendingAuthData: true, ... }
🎬 [AUTH EFFECT] ⚠️ THIS WILL NAVIGATE TO HOME TAB
🏠 [AUTH EFFECT] Navigating to Home tab after successful sign-in
```
**Diagnosis**: pendingAuthData is being set when it shouldn't be

#### Pattern B: ErasGate Being Triggered
```
🚪 [ERAS GATE] Gate completion received
🚪 [ERAS GATE] ⚠️ CRITICAL - This will set pendingAuthData and navigate to home!
```
**Diagnosis**: handleGateComplete is being called unexpectedly

#### Pattern C: Tab Validation Redirect
```
📋 Tab validation check: { ... }
⚠️ Invalid tab detected on initial load, redirecting to home
```
**Diagnosis**: Current tab is not in valid tabs list

#### Pattern D: Direct Tab Change
```
⚠️ NAVIGATING TO HOME - Stack trace: ...
```
**Diagnosis**: Something is directly calling setActiveTab('home')

### Step 3: Identify the Root Cause

Based on the logs, determine which pattern appears:

- **If Pattern A**: pendingAuthData is being set unexpectedly
  - Check if auth state is changing
  - Check if session is expiring/refreshing
  
- **If Pattern B**: handleGateComplete is being called
  - Check if auth callback is happening
  - Check if OAuth is being re-triggered
  
- **If Pattern C**: Tab validation is failing
  - Check what tab you were on
  - Check sessionStorage for 'eras-tab-validated'
  
- **If Pattern D**: Direct navigation is happening
  - Use stack trace to find the caller
  - Check for any automated navigation logic

## Quick Fixes

### Fix 1: Prevent Auth Effect from Running on Remount
If the issue is the auth effect running on HMR remount:

```typescript
// Add session flag to prevent re-running
const authEffectRan = useRef(sessionStorage.getItem('eras-auth-effect-ran') === 'true');

React.useEffect(() => {
  if (pendingAuthData && !isAuthenticated && !pendingAuthProcessedRef.current && !authEffectRan.current) {
    authEffectRan.current = true;
    sessionStorage.setItem('eras-auth-effect-ran', 'true');
    // ... rest of logic
  }
}, [pendingAuthData, auth.isAuthenticated]);
```

### Fix 2: Guard Against handleGateComplete Re-triggers
If handleGateComplete is being called multiple times:

```typescript
const gateCompletedRef = useRef(false);

const handleGateComplete = React.useCallback((userData: any, accessToken: string) => {
  if (gateCompletedRef.current) {
    console.warn('🚪 handleGateComplete already called, ignoring duplicate');
    return;
  }
  gateCompletedRef.current = true;
  // ... rest of logic
}, []);
```

### Fix 3: Clear Tab Validation on Logout
Ensure the validation flag is cleared appropriately:

```typescript
// In logout handler
sessionStorage.removeItem('eras-tab-validated');
```

## Console Commands for Manual Testing

### Check Current State
```javascript
console.log({
  activeTab: sessionStorage.getItem('eras-active-tab'),
  tabValidated: sessionStorage.getItem('eras-tab-validated'),
  authState: localStorage.getItem('eras-auth-state'),
  explicitLogout: sessionStorage.getItem('eras-explicit-logout')
});
```

### Force Clear All Navigation Flags
```javascript
sessionStorage.removeItem('eras-tab-validated');
sessionStorage.removeItem('eras-active-tab');
console.log('✅ Navigation flags cleared');
```

### Monitor for pendingAuthData Changes
```javascript
// Already built into the enhanced logging
// Watch console for: "🎯 [STATE CHANGE] pendingAuthData"
```

## Expected Behavior

### Normal Flow on Fresh Load
1. App mounts
2. `activeTab` initializes from sessionStorage (or defaults to 'home')
3. Auth check runs once
4. Tab validation runs once (if authenticated)
5. App stays on current tab

### Normal Flow After Sign-In
1. User signs in through ErasGate
2. `handleGateComplete` is called
3. `pendingAuthData` is set
4. Auth effect processes data
5. **Navigation to home is EXPECTED** (this is intended behavior)
6. Flag `pendingAuthProcessedRef` prevents re-running

### Abnormal Flow (Bug)
1. App already loaded and authenticated
2. User navigates to Settings (or any non-home tab)
3. Seconds later: App suddenly navigates back to home
4. **This is the bug we're diagnosing**

## Status

✅ Enhanced diagnostic logging deployed
🔍 Waiting for reproduction with new logs
📊 Console will show exact cause with stack traces

## Next Steps

1. **Reproduce the issue** with diagnostic logging active
2. **Capture console logs** showing the exact sequence
3. **Share logs** to identify which pattern is occurring
4. **Apply appropriate fix** based on root cause identified
