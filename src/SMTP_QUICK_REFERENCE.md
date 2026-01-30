# ⚡ SMTP SETUP - QUICK REFERENCE CARD

**Print this or keep it open while you configure:**

---

## 📍 WHERE TO GO

**URL:** https://supabase.com/dashboard  
**Location:** Authentication → Email Templates → Scroll to "SMTP Settings"

---

## 📝 WHAT TO ENTER

| Field | Value | Notes |
|-------|-------|-------|
| **Enable Custom SMTP** | ☑️ ON | Toggle to enable |
| **Sender name** | `Eras` | Exactly as shown |
| **Sender email** | `noreply@erastimecapsule.com` | Must match verified domain |
| **Host** | `smtp.resend.com` | Copy exactly |
| **Port** | `465` | NOT 587! Must be 465 |
| **Username** | `resend` | Literally just "resend" |
| **Password** | `re_[YOUR_API_KEY]` | Get from resend.com/api-keys |

---

## ✅ AFTER SAVING

**Test immediately:**
1. Open incognito browser
2. Go to your app
3. Sign up with: `youremail+test@gmail.com`
4. Check inbox in 30 seconds
5. Should receive verification email

---

## 🚨 COMMON MISTAKES

❌ Port `587` → ✅ Must be `465`  
❌ Username is your email → ✅ Must be exactly `resend`  
❌ Partial API key → ✅ Must include `re_` prefix  
❌ Sender email doesn't match domain → ✅ Must use verified domain  

---

## 📞 GET YOUR RESEND API KEY

**URL:** https://resend.com/api-keys  
**Look for:** Key starting with `re_`  
**Length:** ~40-50 characters  

---

## 🎯 SUCCESS = EMAIL ARRIVES IN 10-30 SECONDS

If no email after 60 seconds:
- Check Supabase → Logs for errors
- Verify API key is correct
- Check spam folder
- Verify domain at resend.com/domains

---

**Done? Test signup and you're 100% ready to launch! 🚀**
