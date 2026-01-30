# Remount Diagnostic Logging Added

## Issue Status
The unexpected remount issue persists after fixing the TitlesContext memoization. The component is still unmounting and remounting after ~4 seconds.

## Diagnostic Logging Added (UPDATED)

### 1. Component Lifecycle Tracking
**Locations:** `/App.tsx`, `/contexts/TitlesContext.tsx`

Added mount/unmount tracking for ALL components in the hierarchy:

```typescript
// App component
const appIdRef = React.useRef(Math.random().toString(36).substring(7));
React.useEffect(() => {
  console.log(`🎬 App component mounted (ID: ${appIdRef.current})`);
  return () => console.log(`🎬 App component unmounting (ID: ${appIdRef.current})`);
}, []);

// TitlesProvider
const providerIdRef = React.useRef(Math.random().toString(36).substring(7));
React.useEffect(() => {
  console.log(`🎬 TitlesProvider mounted (ID: ${providerIdRef.current})`);
  return () => console.log(`🎬 TitlesProvider unmounting (ID: ${providerIdRef.current})`);
}, []);

// MainApp
const mainAppIdRef = React.useRef(Math.random().toString(36).substring(7));
React.useEffect(() => {
  console.log(`🎬 MainApp mounted (ID: ${mainAppIdRef.current})`);
  return () => console.log(`🎬 MainApp unmounting (ID: ${mainAppIdRef.current})`);
}, []);
```

**Purpose:** Track the complete component hierarchy to see which parent is causing the remount.

### 2. Props Change Detection
**Location:** `/App.tsx` - MainAppContent memo comparison

Added detailed logging for prop changes:

```typescript
}, (prevProps, nextProps) => {
  const propsEqual = (...comparison logic...);
  
  if (!propsEqual) {
    console.error('🚨 MainAppContent props changed - will re-render:');
    // Logs which specific props changed
  }
  
  return propsEqual;
});
```

**Purpose:** Shows which props are changing and triggering re-renders.

### 3. Loading Animation Trigger Detection
**Location:** `/App.tsx` - MainApp function

```typescript
// DIAGNOSTIC: Log state changes that trigger loading animation
React.useEffect(() => {
  if (showLoadingAnimation) {
    console.error('🚨 REMOUNT TRIGGER: showLoadingAnimation changed to TRUE');
    console.trace('Trace:');
  }
}, [showLoadingAnimation]);
```

**Purpose:** Detect if loading animation states are changing.

### 2. Authentication Success Callback Logging
**Location:** `/App.tsx` - onAuthenticationSuccess callback

Added detailed logging to track when `onAuthenticationSuccess` is called:

```typescript
const onAuthenticationSuccess = React.useCallback((userData: any, accessToken: string) => {
  console.error('🚨 onAuthenticationSuccess called - This should only happen during initial login!');
  console.log('📋 userData:', userData);
  console.log('📋 Current state:', { 
    showLoadingAnimation_current: showLoadingAnimation, 
    isTransitioning_current: isTransitioning
  });
  console.trace('Call stack:');
  
  // ... rest of function
}, []);
```

**Purpose:** This callback is the only thing that sets `showLoadingAnimation` to `true`. If it's being called unexpectedly, we'll see it in the console.

## How the Remount Happens

### Current Flow:
1. App loads → MainApp renders → MainAppContent mounts ✅
2. ~4 seconds pass...
3. Something triggers `showLoadingAnimation = true` or `isTransitioning = true` ❌
4. MainApp's conditional render switches to `<LoadingAnimation />` ❌
5. MainAppContent **unmounts** ❌
6. Loading animation completes
7. States reset to `false`
8. MainApp switches back to `<MainAppContent />` ❌
9. MainAppContent **remounts** with new ID ❌

### The Problem:
Lines 210-212 in MainApp:
```typescript
if (showLoadingAnimation || isTransitioning) {
  return <LoadingAnimation onComplete={handleLoadingComplete} />;
}
```

When either state becomes `true`, MainAppContent is completely unmounted (not just re-rendered).

## Possible Causes

### 1. Unexpected Auth Callback
The `onAuthenticationSuccess` callback is passed to the Auth component. If Auth component calls this callback when it shouldn't (e.g., on session refresh), it would trigger the remount.

**Location:** Line 1075 in App.tsx
```typescript
<Auth onAuthenticated={(userData, accessToken) => {
  onAuthenticationSuccess(userData, accessToken);
}} />
```

### 2. State Updates from Hooks
If any hook (useAuth, useTitles, etc.) is triggering a state change that cascades to auth callbacks, it could cause the issue.

### 3. Session Restoration Logic
The useAuth hook has logic to restore cached sessions and show toasts. If this is somehow triggering the auth success flow, it could cause remounts.

**Location:** `/hooks/useAuth.tsx` lines 156-167
```typescript
if (age < maxAge && authData.isAuthenticated && authData.user) {
  console.log('📦 Found cached auth state...');
  setUser(authData.user);
  setIsAuthenticated(true);
  toast.success('Welcome back! Restoring your session...', {
    duration: 2000,
    id: 'session-restore'
  });
}
```

## Next Steps for User

### What to Check in Console:
When the remount happens, you'll now see one of these messages:

1. **If you see:**
   ```
   🚨 onAuthenticationSuccess called - This should only happen during initial login!
   ```
   Then something is incorrectly calling the auth success callback after the user is already logged in.

2. **If you see:**
   ```
   🚨 REMOUNT TRIGGER: showLoadingAnimation changed to TRUE
   ```
   or
   ```
   🚨 REMOUNT TRIGGER: isTransitioning changed to TRUE
   ```
   Then we know which state changed, and the stack trace will show why.

### How to Fix Based on Console Output:

**Scenario A: Auth callback is being called**
- Check if Auth component is calling `onAuthenticated` when it shouldn't
- Check if session restoration is incorrectly triggering auth flow
- Add guard to prevent callback if user is already authenticated

**Scenario B: State change from unknown source**
- Follow the stack trace to find the source
- Add guards to prevent state changes during normal operation
- Consider using a ref to track if initial auth is complete

## Files Modified
- ✅ `/App.tsx` - Added diagnostic logging for remount triggers

## Expected Console Output

### During Normal Operation (NO remounts):
```
✅ App.tsx loaded successfully
✅ App component rendering
🎬 MainAppContent mounted (ID: abc123)
📦 SessionStorage state on mount: {...}
🔑 Auth tokens on mount: {...}
✅ Component transition complete (visible)
// ... normal app logs, no remount warnings ...
```

### During Problematic Remount:
```
✅ App.tsx loaded successfully  
✅ App component rendering
🎬 MainAppContent mounted (ID: abc123)
// ... ~4 seconds pass ...
🚨 onAuthenticationSuccess called - This should only happen during initial login!
📋 userData: {...}
📋 Current state: {...}
Call stack:
    at onAuthenticationSuccess (App.tsx:xxx)
    at ...
🚨 REMOUNT TRIGGER: showLoadingAnimation changed to TRUE
Trace:
    at ...
🎬 MainAppContent unmounting (ID: abc123)
❌ 🚨 UNEXPECTED REMOUNT DETECTED! Time since last mount: 4244ms
🎬 MainAppContent mounted (ID: xyz789)
```

## Conclusion

The diagnostic logging is now in place to help identify the root cause of the remount issue. Once we see the console output showing which path is being triggered, we can implement the appropriate fix.

**Status:** ⏳ DIAGNOSTIC LOGGING ACTIVE - Awaiting user console output
