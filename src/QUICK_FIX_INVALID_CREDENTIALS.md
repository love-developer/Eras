# QUICK FIX: "Invalid login credentials" Error

## 🚨 Problem
Sign up → Verify email → Try to sign in → **"Invalid login credentials"** error

## ⚡ 1-Minute Fix

### Step 1: Configure Supabase URL
1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project
2. **Authentication** → **URL Configuration**
3. Set **Site URL** to: `https://your-project.make.dev` (your actual domain)
4. Add **Redirect URLs**: 
   - `https://your-project.make.dev`
   - `https://your-project.make.dev/*`
5. **Save**

### Step 2: Test with NEW Email
- ⚠️ **MUST use a NEW email** (not one that already failed)
- Sign up → Check email → Click verify link
- Should auto-login (no manual sign-in needed)

## 🎯 Why This Works

**Without Site URL:** Verification link doesn't create a session → Email stays unverified → Sign-in fails

**With Site URL:** Verification link creates session → Email verified → Auto-login works

## 🔍 How to Verify It's Working

After clicking verification link, console should show:
```
✅ [AUTH MOUNT] Found active session!
🎉 Email verified! Welcome to Eras!
```

## 📝 What I Changed

1. **Better error messages** - Now suggests resending verification email
2. **Resend email button** - Click to get a new verification link
3. **Auto-detection** - Detects when verification link is clicked
4. **Helpful tips** - Guides users if verification fails

## 🆘 Still Not Working?

### If you see: "ℹ️ No active session found"
→ Site URL not configured correctly

### If you see: "⚠️ Verification link in URL but no session"  
→ Redirect URLs not added

### If sign-in still fails after configuring:
1. Clear browser cache/cookies
2. Use incognito mode
3. Test with completely NEW email
4. Wait 5-10 seconds after clicking verify link

## 📖 Full Guide

See `/INVALID_CREDENTIALS_FIX.md` for:
- Detailed troubleshooting steps
- Console log explanations
- Advanced debugging
- Supabase auth logs guide

---

**TL;DR:** Configure Supabase Site URL, test with NEW email, should auto-login after clicking verification link.
