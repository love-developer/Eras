# 🚪 ErasGate Quick Reference Card

**TL;DR:** Universal authentication gate ensures Eclipse animation plays on every fresh login.

---

## 🎯 What Is It?

**ErasGate** = Mandatory checkpoint between authentication and Dashboard

```
Auth → ErasGate → Eclipse (if fresh) → Dashboard
```

---

## ✅ When Eclipse Plays

| Scenario | isFreshLogin | Eclipse? |
|----------|--------------|----------|
| Manual email/password login | `true` | ✅ YES |
| Google OAuth redirect | `true` | ✅ YES |
| Email verification auto-login | `true` | ✅ YES |
| Logout → Re-login | `true` | ✅ YES |
| Page refresh (session restore) | `false` | ❌ NO |

---

## 📊 Flow Diagram

```
User Signs In
      ↓
Auth.tsx: onAuthenticated(userData, token, { isFreshLogin: true })
      ↓
App.tsx: onAuthenticationSuccess()
      ↓
🚪 ErasGate Activates
      ↓
isFreshLogin? 
  ├─ true → 🌙 Play Eclipse (~4.9s) → Dashboard
  └─ false → Dashboard (immediate)
```

---

## 🔍 Console Logs to Watch

### ✅ Success (Fresh Login)
```
🚪 [ERAS GATE] ✅ Activating ErasGate
🌙 [ERAS GATE] ✅ FRESH LOGIN DETECTED
🌙 [ERAS GATE] → Lunar Eclipse animation WILL PLAY
🎬🎬🎬 LoadingAnimation component RENDERING
🌙 [ERAS GATE] ✅ Lunar Eclipse animation completed
🚪 [ERAS GATE] ✅ Gate opened - transitioning to Dashboard
```

### ✅ Success (Session Restore)
```
🚪 [ERAS GATE] ℹ️ Session restore detected
🚪 [ERAS GATE] → Skipping Eclipse animation
🚪 [ERAS GATE] ✅ Gate opened - passing through to Dashboard
```

### ❌ Problem Indicators
```
❌ "User will be routed..." but no Eclipse renders
❌ Dashboard renders before Eclipse
❌ Eclipse plays on page refresh
❌ Eclipse doesn't play on Google OAuth
```

---

## 🐛 Quick Troubleshooting

### Eclipse Doesn't Play on OAuth
1. Check Auth.tsx line 59: `isOAuthCallback` detection
2. Verify line 147: `{ isFreshLogin: true }` is passed
3. Check console for "OAuth callback detected"

### Eclipse Plays on Page Refresh
1. Check that `isFreshLogin: false` for session restore
2. Verify useAuth hook's getSession logic
3. Look for "Session restore detected" in console

### Dashboard Visible Before Eclipse
1. Check ErasGate z-index (should be 99999)
2. Verify `showErasGate` state is true
3. Ensure LoadingAnimation has opaque background

---

## 📝 Code Snippets

### Check if Gate is Active
```typescript
// In App.tsx
if (showErasGate && gateAuthData) {
  return <ErasGate {...props} />;
}
```

### Trigger Authentication
```typescript
// From ANY auth handler
onAuthenticated(userData, accessToken, { 
  isFreshLogin: true  // ← This determines Eclipse
});
```

### Handle Gate Completion
```typescript
// In App.tsx
const handleGateComplete = (userData, accessToken) => {
  setPendingAuthData({ userData, accessToken });
  setShowErasGate(false);
  // Dashboard now renders
};
```

---

## 🎯 Key Rules

1. **All auth goes through ErasGate** - No exceptions
2. **isFreshLogin = true** → Eclipse plays
3. **isFreshLogin = false** → Skip to Dashboard
4. **No cooldowns** - Gate doesn't remember past logins
5. **Gate decides** - Not Auth, not App, just Gate

---

## 📚 Full Docs

See: `/ERAS_GATE_UNIVERSAL_INTERCEPTOR_COMPLETE.md`

---

**Need Help?**
- Check console logs (🚪 and 🌙 prefixes)
- Review authentication flow in Auth.tsx
- Verify isFreshLogin flag is correct
- Ensure ErasGate is rendering before Dashboard
