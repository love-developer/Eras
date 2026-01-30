# Remount Investigation and Fix

## Issue
Unexpected remount detected approximately 3.3 seconds after app load, causing scroll position loss and state reset.

**Error Log:**
```
❌ 🚨 UNEXPECTED REMOUNT DETECTED! Time since last mount: 3341ms
❌ 🚨 Previous mount ID: ggagsj, Current mount ID: wqjdy
```

## Root Cause Analysis

### 1. **useAuth Hook - userString Not Memoized**
The `userString` variable in `useAuth.tsx` was being recreated on every render, potentially causing the `authObject` to be recreated unnecessarily.

**Fixed:** Wrapped `userString` in `useMemo` to ensure it only changes when `user` actually changes.

```typescript
// BEFORE
const userString = user ? JSON.stringify(user) : null;

// AFTER
const userString = useMemo(() => user ? JSON.stringify(user) : null, [user]);
```

### 2. **useTitles Hook - Incomplete Dependencies**
The memoized return object included `equipTitle` and `refresh` functions but didn't include them in the dependency array. This created inconsistency where the object would be recreated with new function references even though the functions themselves were stable.

**Fixed:** Added `equipTitle` and `refresh` to the dependency array.

```typescript
// BEFORE
return useMemo(() => ({
  titleProfile,
  availableTitles,
  loading,
  equipping,
  equipTitle,
  updateTrigger,
  refresh
}), [titleProfile, availableTitles, loading, equipping, updateTrigger]);

// AFTER
return useMemo(() => ({
  titleProfile,
  availableTitles,
  loading,
  equipping,
  equipTitle,
  updateTrigger,
  refresh
}), [titleProfile, availableTitles, loading, equipping, equipTitle, updateTrigger, refresh]);
```

### 3. **TitlesContext - Incomplete Dependencies**
Same issue as useTitles - the context value didn't include `equipTitle` and `refresh` in dependencies.

**Fixed:** Added all dependencies to the context value memoization.

### 4. **3-Second Timeout in useAuth**
There's a 3-second timeout in useAuth that changes `isCheckingAuth` from `true` to `false`:

```typescript
if (!isAuthenticated) {
  pageLoadTimeout = setTimeout(() => {
    if (mounted && isCheckingAuth && !isAuthenticated) {
      console.log('⏱️ Initial auth check completed - ready for login');
      setIsCheckingAuth(false);  // ← This triggers at ~3 seconds
    }
  }, 3000);
}
```

This timing (3000ms) aligns perfectly with the remount timing (3341ms). When `isCheckingAuth` changes, it recreates the `authObject`, which could trigger re-renders in components using `useAuth()`.

**Note:** This is expected behavior for the loading state. The question is whether it's causing unnecessary remounts.

## Enhanced Diagnostic Logging

Added comprehensive logging to track component lifecycle:

### App Component
- Logs component ID and render count on every render
- Tracks mounts and unmounts

### MainApp Component  
- Logs component ID and render count on every render
- Tracks mounts and unmounts

### MainAppContent Component
- Already has robust remount detection
- Compares mount IDs to distinguish remounts from re-renders

## What to Watch For

### 1. **Normal Re-render (OK)**
```
🔄 MainApp rendering (ID: abc123, Render #2)
```
Same ID, increasing render count = normal re-render

### 2. **Unexpected Remount (BAD)**
```
🎬 MainApp unmounting (ID: abc123)
🎬 MainApp mounted (ID: xyz789, Render #1)
```
Different ID, render count reset to 1 = unexpected remount

### 3. **Expected State Change**
```
⏱️ Initial auth check completed - ready for login
🔄 MainApp rendering (ID: abc123, Render #2)
```
Same ID, just re-rendering due to auth state change = OK

## Testing Checklist

- [ ] Load app and watch console for 5 seconds
- [ ] Check that MainApp and MainAppContent keep the same IDs
- [ ] Verify no "UNEXPECTED REMOUNT DETECTED" errors
- [ ] Confirm scroll position is preserved
- [ ] Check that tab state is maintained

## Expected Behavior After Fix

1. **Initial Load (0-100ms)**
   - App component mounts
   - TitlesProvider mounts
   - MainApp mounts (ID: abc123)
   - MainAppContent mounts (ID: xyz789)

2. **3-Second Mark (~3000ms)**
   - useAuth timeout triggers
   - `setIsCheckingAuth(false)` called
   - MainApp re-renders (same ID, Render #2)
   - MainAppContent may re-render (same ID)
   - **NO remounting** - IDs stay the same

3. **User Interaction**
   - Tab changes cause re-renders
   - State updates cause re-renders
   - **NO unexpected remounts**

## Files Modified

1. `/hooks/useAuth.tsx` - Memoized userString
2. `/hooks/useTitles.tsx` - Added equipTitle and refresh to dependencies
3. `/contexts/TitlesContext.tsx` - Added all dependencies to context value
4. `/App.tsx` - Enhanced diagnostic logging

## Additional Notes

### Why React.memo Doesn't Prevent Hook Re-renders

`React.memo` on MainAppContent only prevents re-renders from **parent prop changes**. It does NOT prevent re-renders from:
- Internal hooks (useState, useEffect, useContext)
- Context value changes
- Hook return value changes

When `useAuth()` returns a new object (because `isCheckingAuth` changed), MainAppContent will re-render even with React.memo, because the re-render is triggered by the hook, not by props.

### Memoization Strategy

For hooks that return objects:
1. ✅ Use `useMemo` for all computed values
2. ✅ Use `useCallback` for all functions
3. ✅ Include ALL values in the return object in the dependency array
4. ✅ Don't skip stable functions - include them too for consistency

### When Remounts Are OK

- Initial app load
- Route changes (different pages)
- Intentional component key changes
- Error boundary recovery

### When Remounts Are BAD

- ❌ After 3 seconds of loading
- ❌ On state changes (auth, tab, etc.)
- ❌ On user interaction
- ❌ Multiple times within a few seconds
