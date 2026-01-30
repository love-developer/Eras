# Comprehensive Remount Debugging

## Issue
Unexpected remount occurring at 446ms after app load, causing scroll position loss and state reset.

**Error:**
```
🚨 UNEXPECTED REMOUNT DETECTED! Time since last mount: 446ms
🚨 Previous mount ID: 4nfr6g, Current mount ID: 2q8jth
```

## Debugging Strategy

Added comprehensive remount detection at every level of the component tree to identify where the remount originates.

### Component Hierarchy
```
App (root)
  └─ TitlesProvider (context)
      └─ MainApp
          └─ MainAppContent (memoized)
```

### Diagnostic Logging Added

#### 1. App Component
- **Render logging:** Shows component ID and render count on every render
- **Mount detection:** Detects if App is remounting unexpectedly
- **Session storage:** Tracks `eras-app-last-mount-time` and `eras-app-last-mount-id`

#### 2. TitlesProvider
- **Render logging:** Shows component ID and render count on every render
- **Mount detection:** Detects if TitlesProvider is remounting unexpectedly
- **Session storage:** Tracks `eras-titlesprovider-last-mount-time` and `eras-titlesprovider-last-mount-id`

#### 3. MainApp
- **Render logging:** Shows component ID and render count on every render
- **Mount detection:** Detects if MainApp is remounting unexpectedly
- **Session storage:** Tracks `eras-mainapp-last-mount-time` and `eras-mainapp-last-mount-id`
- **State change logging:** Logs every state change for ErasGate-related state

#### 4. MainAppContent
- **Already has robust remount detection**
- **Session storage:** Tracks `eras-last-mount-time` and `eras-last-mount-id`

### State Change Tracking

Added logging for all MainApp state changes:
- `showErasGate` - ErasGate visibility
- `gateAuthData` - Auth data for ErasGate
- `pendingAuthData` - Pending auth data for MainAppContent
- `isTransitioning` - Transition state
- `triggerSlideAnimation` - Animation trigger

## Expected Console Output

### Normal Initial Load (No Remounts)
```
✅ App.tsx loaded successfully
✅ App component rendering (ID: abc123, Render #1)
🎬 App component mounted (ID: abc123)
🔄 TitlesProvider rendering (ID: xyz789, Render #1)
🎬 TitlesProvider mounted (ID: xyz789)
🔄 MainApp rendering (ID: def456, Render #1)
🎬 MainApp mounted (ID: def456)
🎬 MainAppContent mounted (ID: ghi789)
```

### Remount at Different Levels

#### If App Remounts (causes all children to remount):
```
🚨 APP COMPONENT REMOUNT DETECTED! Time since last mount: 446ms
🚨 Previous mount ID: abc123, Current mount ID: abc456
🚨 TITLESPROVIDER REMOUNT DETECTED! Time since last mount: 446ms
🚨 MAINAPP REMOUNT DETECTED! Time since last mount: 446ms
🚨 UNEXPECTED REMOUNT DETECTED! Time since last mount: 446ms
```

#### If TitlesProvider Remounts (causes MainApp and MainAppContent to remount):
```
✅ App component rendering (ID: abc123, Render #2)  [same ID = re-render]
🚨 TITLESPROVIDER REMOUNT DETECTED! Time since last mount: 446ms
🚨 MAINAPP REMOUNT DETECTED! Time since last mount: 446ms
🚨 UNEXPECTED REMOUNT DETECTED! Time since last mount: 446ms
```

#### If MainApp Remounts (causes MainAppContent to remount):
```
✅ App component rendering (ID: abc123, Render #2)  [same ID = re-render]
🔄 TitlesProvider rendering (ID: xyz789, Render #2)  [same ID = re-render]
🚨 MAINAPP REMOUNT DETECTED! Time since last mount: 446ms
🚨 UNEXPECTED REMOUNT DETECTED! Time since last mount: 446ms
```

#### If Only MainAppContent Remounts (this shouldn't happen):
```
✅ App component rendering (ID: abc123, Render #2)  [same ID = re-render]
🔄 TitlesProvider rendering (ID: xyz789, Render #2)  [same ID = re-render]
🔄 MainApp rendering (ID: def456, Render #2)  [same ID = re-render]
🚨 UNEXPECTED REMOUNT DETECTED! Time since last mount: 446ms
[This would be very strange - MainAppContent is wrapped in React.memo]
```

## What to Look For

### 1. Check Component IDs
- **Same ID across renders** = normal re-render ✅
- **Different ID** = unexpected remount ❌

### 2. Check Render Counts
- **Incrementing render count with same ID** = normal re-renders ✅
- **Render count reset to #1 with different ID** = remount ❌

### 3. Check Timing
- **446ms** matches the reported remount timing
- Check what happens at that exact time:
  - State changes?
  - Auth effects?
  - Title fetches?
  - Effect cleanup/execution?

### 4. Check Stack Traces
- Each remount detection includes a stack trace
- This will show exactly what code path led to the remount

## Potential Root Causes

### 1. Context Value Recreation
If TitlesContext value is being recreated with a new object reference, it could trigger cascading re-renders. However, we've memoized the context value, so this should be fixed.

### 2. useAuth Hook Changes
If the `session` object from useAuth changes reference early on (e.g., when auth completes), it could trigger effects in useTitles hook that cause state updates. We've memoized `userString` and `sessionObject`, but there could be other issues.

### 3. Early Effect Execution
The useTitles hook has a 100ms delay before fetching:
```typescript
const timeoutId = setTimeout(() => {
  fetchTitleProfile();
  fetchAvailableTitles();
}, 100);
```

If the session changes around 346ms (446ms - 100ms), it could trigger this effect.

### 4. State Updates in Effects
If any effect in the component tree calls setState during the mount phase, it could cause a remount. Look for:
- useEffect with missing dependencies
- useLayoutEffect that updates state
- Effects that call setState based on props/context

## Next Steps

1. **Run the app and check console logs**
   - Look for which remount error appears first (App, TitlesProvider, MainApp, or MainAppContent)
   - This will tell us where the remount originates

2. **Check state change logs**
   - Look for state changes around 346-446ms
   - See if any ErasGate state is being set unexpectedly

3. **Check session object changes**
   - Look for the `🔴 [useTitles] SESSION OBJECT REFERENCE CHANGED!` log
   - See if the session object is being recreated around that time

4. **Check auth object changes**
   - Look for the `🔴 [useAuth] AUTH OBJECT RECREATED!` log
   - See what dependencies are changing

5. **Trace the causality chain**
   - Use the timestamps and sequence of logs to understand what triggers what
   - Work backwards from the MainAppContent remount to find the root cause

## Files Modified

1. `/App.tsx` - Added remount detection to App and MainApp
2. `/contexts/TitlesContext.tsx` - Added remount detection to TitlesProvider
3. All state changes in MainApp now have logging

## Testing Checklist

- [ ] App loads without any remount errors
- [ ] Component IDs stay consistent across re-renders
- [ ] No "REMOUNT DETECTED" errors in console
- [ ] Scroll position is preserved
- [ ] Tab state is maintained
- [ ] Authentication works without triggering remounts
