# 🚨 RESEND API KEY ERROR - QUICK FIX

## Error You're Seeing:
```
401 Unauthorized - API key is invalid
```

## What This Means:
Your Resend API key in the Supabase environment variables is either:
- **Expired** (Resend API keys can expire)
- **Invalid** (incorrect key was entered)
- **Deleted** (key was deleted from Resend dashboard)

---

## ✅ SOLUTION - Update Your API Key

### Step 1: Get a New API Key from Resend
1. Go to https://resend.com/api-keys
2. Sign in to your Resend account
3. Click **"Create API Key"**
4. Give it a name like "Eras Time Capsule"
5. Click **"Create"**
6. **Copy the API key immediately** (it starts with `re_`)

### Step 2: Update the Environment Variable in Supabase
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions** → **Secrets**
3. Find `RESEND_API_KEY` in the list
4. Click **"Edit"** or **"Update"**
5. Paste your new API key
6. Click **"Save"**

### Step 3: Restart the Edge Function
The Edge Function should automatically pick up the new key. To ensure it's updated:
1. Navigate to **Edge Functions** in Supabase
2. Find the `make-server-f9be53a7` function
3. Click **"Redeploy"** or make any small change to trigger a restart

---

## 🔍 How to Verify It's Fixed

### Test the Email System:
1. Try sending a test email through your app
2. Check the Edge Function logs for:
   - ✅ `[EMAIL] Email sent successfully!`
   - ❌ No more `401 Unauthorized` errors

### Check the Logs:
Look for this in the Edge Function logs:
```
[EMAIL] Checking API key...
API key exists in env: true
API key starts with re_: true
[EMAIL] Email sent successfully! ID: <some-id>
```

---

## 🎯 Common Issues

### Issue: Still getting 401 after updating
**Solution:** Wait 30-60 seconds for the Edge Function to restart, then try again

### Issue: API key doesn't start with `re_`
**Solution:** Make sure you copied the entire key from Resend. It should look like:
```
re_ABC123xyz_RandomCharactersHere
```

### Issue: "validation_error" instead of 401
**Solution:** This might be a domain verification issue. Check:
1. Your domain is verified at https://resend.com/domains
2. The "from" email address uses your verified domain
3. Example: `noreply@yourdomain.com` (not `@resend.dev` for production)

---

## 📝 Prevention Tips

1. **Save Your API Key**: Store it in a password manager when you create it
2. **Monitor Expiration**: Some API keys have expiration dates
3. **Use Environment Variables**: Never hardcode API keys in your code
4. **Regular Testing**: Test email delivery monthly to catch issues early

---

## 🆘 Still Having Issues?

If you're still seeing 401 errors after following these steps:

1. **Double-check the key**: Make sure there are no extra spaces
2. **Verify Resend account**: Ensure your Resend account is active
3. **Check billing**: Expired payment methods can cause API issues
4. **Contact Resend**: support@resend.com if you think it's a Resend issue

---

## ✅ What Was Fixed in This Update

### 1. Media Upload Error Fixed
- **Issue**: `Cannot read properties of undefined (reading 'startsWith')`
- **Fix**: Added null safety check for `file.type`
- **Location**: `/supabase/functions/server/index.tsx` line 615

### 2. Better Error Messages for API Key Issues
- **Enhancement**: Added detailed logging for 401 errors
- **Added**: Step-by-step fix instructions in console logs
- **Location**: `/supabase/functions/server/email-service.tsx` line 274-282

### 3. Improved Error Handling
- **Enhancement**: 401 errors no longer retry (they're config issues, not transient errors)
- **Added**: Better retry logic for other error types
- **Location**: `/supabase/functions/server/email-service.tsx` line 295-308

---

**Last Updated**: November 6, 2025
**Status**: ✅ Errors Fixed
**Next Action**: Update your RESEND_API_KEY environment variable
