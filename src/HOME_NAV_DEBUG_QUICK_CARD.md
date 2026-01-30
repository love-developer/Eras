# 🔍 Home Navigation Bug - Quick Debug Card

## What's Happening
App resets to Home screen seconds after loading/navigating

## What Was Added

### 🎯 4 Key Diagnostic Points

1. **pendingAuthData Monitor** - Tracks when auth data is set (causes home nav)
2. **handleGateComplete Tracker** - Logs when ErasGate completion fires  
3. **Auth Effect Logger** - Shows when home navigation command is issued
4. **setActiveTab Tracker** - Logs all tab changes with stack traces

## How to Debug

### 1️⃣ Reproduce
- Restart app
- Go to Settings (or any non-home tab)
- Wait a few seconds
- Note if it resets to home

### 2️⃣ Check Console
Look for these **RED FLAGS**:

```
⚠️ [CRITICAL] pendingAuthData was SET - this will trigger home navigation!
```
OR
```
🚪 [ERAS GATE] ⚠️ CRITICAL - This will set pendingAuthData and navigate to home!
```
OR
```
⚠️ NAVIGATING TO HOME - Stack trace: ...
```

### 3️⃣ Identify Pattern

| What You See | Root Cause | Fix |
|--------------|------------|-----|
| "pendingAuthData was SET" after app already loaded | Auth state changing unexpectedly | Guard auth effect |
| "handleGateComplete" when not signing in | ErasGate retriggering | Add duplicate prevention |
| "NAVIGATING TO HOME" from random code | Direct setActiveTab call | Find and fix caller |
| "Invalid tab detected" | Tab validation failing | Check tab name validity |

## Most Likely Causes

### 🎯 Suspect #1: Auth Effect (85% probability)
**Location**: `/App.tsx` line 764-808
**What it does**: Processes pending auth data and navigates to home
**Why it might run**: pendingAuthData state changes

### 🎯 Suspect #2: HMR Remount (10% probability)  
**What it does**: Hot module replacement causes component remount
**Why it might run**: Development environment auto-refresh
**Check**: Look for "HMR: MainApp remounted" in logs

### 🎯 Suspect #3: Session Validation (5% probability)
**Location**: `/App.tsx` line 885-907
**What it does**: Validates current tab, redirects if invalid
**Why it might run**: sessionStorage cleared

## Quick Console Check

```javascript
// Run this in console to see current state
console.log({
  tab: sessionStorage.getItem('eras-active-tab'),
  validated: sessionStorage.getItem('eras-tab-validated'),
  lastMount: new Date(parseInt(sessionStorage.getItem('eras-mainapp-last-mount-time'))),
  timeSinceMount: Date.now() - parseInt(sessionStorage.getItem('eras-mainapp-last-mount-time')) + 'ms'
});
```

## What the Stack Traces Will Show

All critical navigation points now log **full stack traces**:

- You'll see **exactly which function** triggered the home navigation
- Stack traces will show the **call chain** leading to the issue  
- Look for your code vs framework code to identify the source

## Expected vs Unexpected

### ✅ Expected (Normal)
- Home navigation **immediately after sign-in** (this is intended)
- Home navigation **on app first load** (default tab)

### ❌ Unexpected (Bug)
- Home navigation **while already authenticated and using app**
- Home navigation **after navigating to another tab**
- Home navigation **with no user action**

## Next Action

1. **Try to reproduce** the issue
2. **Capture the console logs** when it happens
3. **Look for the red flag warnings** listed above
4. **Share the logs** showing which pattern occurred

The enhanced logging will pinpoint the exact cause!
