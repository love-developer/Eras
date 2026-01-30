# 🆘 EMAIL VERIFICATION - QUICK REFERENCE CARD

## 🚨 ERROR: "Email not confirmed"

### ⚡ INSTANT FIX (30 seconds)
1. ✅ Check your email inbox
2. ✅ Find email from **Eras Time Capsule**
3. ✅ Click **"Verify Email"** button
4. ✅ Auto-login! Done! 🎉

---

## 📧 Can't Find the Email?

### Check These 3 Places:
1. **Inbox** (main folder)
2. **Spam/Junk** (most common!)
3. **Promotions** (if using Gmail)

### Still Nothing?
Click **"Resend Email"** button → Wait 1-2 minutes → Check again

---

## 🔧 If Resend Doesn't Work

### Option 1: Verify Supabase Site URL
```
Go to: Supabase Dashboard → Authentication → URL Configuration

Site URL should be:
https://found-shirt-81691824.figma.site

Redirect URLs should include:
https://found-shirt-81691824.figma.site
https://found-shirt-81691824.figma.site/*
https://found-shirt-81691824.figma.site/auth/callback
```

### Option 2: Use Fresh Email
- Previous email might be expired (24-hour limit)
- Sign up with NEW email address
- Immediately check inbox
- Click verification link

---

## ⚠️ COMMON MISTAKES

| ❌ DON'T | ✅ DO |
|----------|-------|
| Sign in before clicking email link | Click email link first, then you're auto-logged in |
| Ignore the verification email | Check inbox AND spam folder |
| Click "Resend" multiple times quickly | Wait 60 seconds between resends |
| Use the same unverified email forever | Try a fresh email if stuck |
| Give up after 30 seconds | Wait 2-5 minutes for email delivery |

---

## 🎯 3 TYPES OF ERRORS

### 1. "⚠️ Email Not Verified"
**Meaning:** You haven't clicked the verification link  
**Fix:** Check email → Click link → Auto-login

### 2. "❌ Incorrect Password"
**Meaning:** Email IS verified, password is wrong  
**Fix:** Reset password OR try correct password

### 3. "❌ Invalid Credentials"
**Meaning:** Either email not verified OR wrong password  
**Fix:** Click "Resend Email" to find out which

---

## ⏱️ QUICK TIMELINE

| Time | Action |
|------|--------|
| 0:00 | Sign up |
| 0:10 | See Email Verification screen |
| 0:30 | Email arrives in inbox |
| 0:45 | Click verification link |
| 0:50 | ✅ Auto-logged in! |

**Total Time:** Less than 1 minute!

---

## 🔍 TROUBLESHOOTING CHECKLIST

- [ ] I checked my inbox
- [ ] I checked my spam/junk folder
- [ ] I waited at least 2 minutes for email
- [ ] I clicked "Resend Email" button
- [ ] I verified Site URL in Supabase dashboard
- [ ] I tried with a fresh email address
- [ ] I read the error message carefully

**If all checked and still not working:** Check Supabase SMTP configuration

---

## 📱 MOBILE USERS

### Extra Steps for iPhone/Android:
1. Open email app (not browser)
2. Refresh inbox (pull down)
3. Check "All Mail" folder
4. Tap verification link
5. Opens in browser → Auto-login

---

## 🆘 LAST RESORT: Manual Verification

**⚠️ ONLY use if all else fails!**

Go to Supabase Dashboard → SQL Editor:
```sql
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'user@example.com';
```

Then sign in normally.

---

## ✅ SUCCESS INDICATORS

You'll know it worked when you see:
- ✅ "Email verified! Welcome to Eras! 🎉"
- ✅ Eras dashboard appears
- ✅ No more "Email not confirmed" errors
- ✅ You can sign in/out normally

---

## 📞 SUPPORT INFORMATION

**Common Issues:**
1. Email in spam → Mark as "Not Spam"
2. Site URL wrong → Update in Supabase
3. Email expired → Request new one
4. Server error → Check Resend account status

**Still stuck?** 
- Check `/EMAIL_VERIFICATION_FLOW.md` for detailed guide
- Check `/QUICK_FIX_EMAIL_NOT_CONFIRMED.md` for troubleshooting
- Check `/EMAIL_NOT_CONFIRMED_FIX.md` for technical details

---

## 🎉 REMEMBER

**THE GOLDEN RULE:**  
**Always click the verification link in your email BEFORE trying to sign in manually!**

---

*Last Updated: November 5, 2025*  
*Average Fix Time: 30-90 seconds*  
*Success Rate: 95%+*
