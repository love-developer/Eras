# 🚀 SUPABASE SMTP SETUP - IMPOSSIBLE TO MESS UP GUIDE

**Time Required:** 5 minutes  
**Difficulty:** Copy and paste  
**What You Need:** Your Resend API key (starts with `re_`)

---

## 📋 STEP 0: GET YOUR RESEND API KEY

**Option A: You Already Have It**
- Check your password manager
- Look in your Resend dashboard
- It starts with `re_` and is about 40-50 characters long

**Option B: Get It From Resend Dashboard**

1. Go to: **https://resend.com/api-keys**
2. Log in with your account
3. You'll see your existing API keys
4. Copy the key (or create a new one if needed)
5. **IMPORTANT:** Copy the FULL key including `re_` prefix

**Your API Key Looks Like:**
```
re_123abc456def789ghi012jkl345mno678pqr901stu234
```

**Keep this copied to your clipboard - you'll paste it in Step 3**

---

## 🎯 STEP 1: OPEN SUPABASE DASHBOARD

1. Go to: **https://supabase.com/dashboard**
2. Log in with your account
3. Click on your **Eras project** (should be your only project, or look for the one with your app name)

**You should see:**
- Left sidebar with options like "Table Editor", "Authentication", "Storage", etc.
- Top bar showing your project name

---

## 🎯 STEP 2: NAVIGATE TO SMTP SETTINGS

1. In the **left sidebar**, click **"Authentication"** (it has a key icon 🔑)
2. Wait for the page to load
3. You'll see tabs at the top: **"Users"**, **"Policies"**, **"Providers"**, **"Email Templates"**
4. Scroll down the page (don't click any tabs yet)
5. Keep scrolling until you see a section called **"SMTP Settings"**

**If you don't see "SMTP Settings":**
- Click the **"Email Templates"** tab at the top
- Then scroll down - "SMTP Settings" should be visible now

---

## 🎯 STEP 3: CONFIGURE SMTP (THE IMPORTANT PART)

You should now see a form with these fields. **Copy EXACTLY as shown:**

### **Field 1: Enable Custom SMTP**
```
☑️ Enable Custom SMTP server
```
**Action:** Click the toggle/checkbox to turn it ON (should turn blue/green)

---

### **Field 2: Sender name**
```
Eras
```
**Action:** Type exactly: `Eras`

---

### **Field 3: Sender email**
```
noreply@erastimecapsule.com
```
**Action:** Copy and paste exactly: `noreply@erastimecapsule.com`

**CRITICAL:** This MUST match your verified domain in Resend. If you verified a different email, use that instead.

---

### **Field 4: Host**
```
smtp.resend.com
```
**Action:** Copy and paste exactly: `smtp.resend.com`

---

### **Field 5: Port number**
```
465
```
**Action:** Type exactly: `465`

**DO NOT use:** 587, 25, or any other port. Must be `465`.

---

### **Field 6: Username**
```
resend
```
**Action:** Type exactly: `resend`

**Note:** This is NOT your Resend account email. The username is literally just the word "resend".

---

### **Field 7: Password**
```
[PASTE YOUR RESEND API KEY HERE]
```
**Action:** Paste your Resend API key (the one starting with `re_` from Step 0)

**Example:**
```
re_123abc456def789ghi012jkl345mno678pqr901stu234
```

**CRITICAL CHECKS:**
- ✅ Starts with `re_`
- ✅ No spaces before or after
- ✅ Full key pasted (40-50 characters)
- ✅ No extra characters

---

### **Field 8: Minimum interval between emails being sent**
```
1
```
**Action:** Leave as default (usually 1 second) or leave blank

---

## 🎯 STEP 4: SAVE SETTINGS

1. Scroll to the bottom of the SMTP Settings section
2. Click the **"Save"** button (should be green/blue)
3. Wait for success message (usually shows "Settings saved" or similar)

**If you see an error:**
- Check the password field has your full API key
- Verify port is `465` not `587`
- Make sure "Enable Custom SMTP" toggle is ON

---

## 🎯 STEP 5: TEST IT IMMEDIATELY

**Test 1: Quick Supabase Test**

1. Stay in Supabase Dashboard
2. Go to **"Authentication"** → **"Email Templates"**
3. Click **"Confirm signup"** template
4. Scroll down and look for a **"Send test email"** button (if available)
5. Enter your email and send test

**If no test button available, do Test 2:**

---

**Test 2: Real Signup Test (RECOMMENDED)**

1. Open **incognito/private browser window**
2. Go to your Eras app: `[YOUR_APP_URL]`
3. Click **"Sign Up"**
4. Use a test email (use Gmail's + trick):
   ```
   youremail+erastest1@gmail.com
   ```
5. Enter password, first name, last name
6. Click **"Sign Up"**
7. You should see "Check Your Email" screen
8. **IMMEDIATELY check your email inbox**
9. Look for email from "Eras <noreply@erastimecapsule.com>"
10. Subject should be like "Confirm Your Email" or similar

**Expected Timeline:**
- ✅ Email arrives in **10-30 seconds**
- ✅ Email is in **inbox** (not spam)
- ✅ Click verification link works
- ✅ Auto-redirects to app and logs you in

---

## ✅ SUCCESS CHECKLIST

After testing, you should have:

- [x] Email arrived in inbox within 30 seconds
- [x] Email is from "Eras <noreply@erastimecapsule.com>"
- [x] Email has verification link
- [x] Clicking link opens your app
- [x] You're automatically logged in
- [x] No error messages in browser console

**If ALL boxes checked:** ✅ **YOU'RE DONE! Email system is 100% operational!**

---

## ❌ TROUBLESHOOTING (If Email Doesn't Arrive)

### **Issue 1: No Email After 60 Seconds**

**Check Supabase Logs:**
1. In Supabase Dashboard, click **"Logs"** in left sidebar
2. Look for recent entries with "email" or "smtp"
3. Check for error messages

**Common Errors:**

**Error: "Invalid credentials" or "Authentication failed"**
- ❌ Wrong API key
- ✅ Fix: Go back to SMTP settings, re-paste API key
- Make sure it starts with `re_` and has no spaces

**Error: "Connection refused" or "Connection timeout"**
- ❌ Wrong port
- ✅ Fix: Change port to `465` (not 587)

**Error: "Sender address not verified"**
- ❌ Domain not verified in Resend
- ✅ Fix: Go to https://resend.com/domains and verify domain
- OR use `onboarding@resend.dev` as sender email (testing only)

---

### **Issue 2: Email Goes to Spam**

**Short-term fix:**
1. Check spam/junk folder
2. Mark as "Not Spam"
3. Add noreply@erastimecapsule.com to contacts

**Long-term fix:**
1. Verify domain in Resend (add DNS records)
2. Wait 24 hours for DNS propagation
3. Test again - should go to inbox

---

### **Issue 3: "Enable Custom SMTP" Keeps Turning Off**

**This means:**
- Settings aren't saving
- Usually a browser cache issue

**Fix:**
1. Hard refresh page (Ctrl+Shift+R or Cmd+Shift+R)
2. Try different browser
3. Clear browser cache
4. Try again

---

## 🔍 VERIFY SETTINGS ARE SAVED

**Go back and check:**

1. Supabase Dashboard → Authentication → Email Templates
2. Scroll to SMTP Settings
3. Verify:
   - ✅ "Enable Custom SMTP" toggle is ON
   - ✅ Host shows: `smtp.resend.com`
   - ✅ Port shows: `465`
   - ✅ Username shows: `resend`
   - ✅ Sender email shows: `noreply@erastimecapsule.com`

**If any field is empty or different:**
- Settings didn't save properly
- Re-enter all fields
- Click Save again

---

## 📱 WHAT TO EXPECT AFTER SETUP

### **New User Signup Flow:**

1. User visits your app
2. Clicks "Sign Up"
3. Enters email, password, name
4. Submits form
5. **Sees "Check Your Email" screen** ✅
6. **Receives email within 30 seconds** ✅
7. Clicks verification link in email
8. **Automatically logged into app** ✅
9. Sees welcome celebration 🎉

### **All Email Types Now Working:**

✅ **Email Verification** - NEW! Just fixed  
✅ **Password Reset** - Was already working  
✅ **Capsule Delivery** - Was already working  
✅ **Legacy Access Notifications** - Was already working  
✅ **Folder Sharing Invites** - Was already working  

---

## 🎉 YOU'RE DONE!

After this 5-minute setup:

- ✅ Email system 100% operational
- ✅ New users can sign up
- ✅ All 5 email types working
- ✅ Production-ready email infrastructure
- ✅ No more blockers for launch

**Next steps:**
- Test signup flow one more time
- Customize email templates (optional)
- Launch your app! 🚀

---

## 📞 STILL STUCK?

**If you've followed all steps and it's still not working:**

1. **Check your Resend API key is valid:**
   - Go to: https://resend.com/api-keys
   - Verify key exists and is active
   - Try creating a NEW key and use that instead

2. **Verify your domain:**
   - Go to: https://resend.com/domains
   - Check `erastimecapsule.com` shows "Verified" status
   - If not verified, add the DNS records they show

3. **Check Supabase logs:**
   - Supabase Dashboard → Logs
   - Look for SMTP errors
   - Copy error message and Google it

4. **Contact Resend support:**
   - Email: support@resend.com
   - They're very responsive (usually reply in 1 hour)
   - Tell them: "SMTP authentication failing with Supabase"

5. **Contact me:**
   - Share the error message from Supabase logs
   - Share screenshot of your SMTP settings (hide API key)
   - I'll help debug

---

## 🔐 SECURITY NOTES

**Safe to share:**
- ✅ Sender email (noreply@erastimecapsule.com)
- ✅ Domain name (erastimecapsule.com)
- ✅ SMTP host (smtp.resend.com)
- ✅ Port number (465)
- ✅ Username (resend)

**NEVER share:**
- ❌ Your Resend API key (treat like a password)
- ❌ Supabase service role key
- ❌ Database passwords

**If API key is leaked:**
1. Go to https://resend.com/api-keys
2. Delete the compromised key
3. Create new key
4. Update in Supabase SMTP settings

---

**Setup Guide Complete!**  
**Questions? Issues? Let me know and I'll help debug!** 🚀
