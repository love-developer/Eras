# ✅ SMTP CONFIGURATION CHECKLIST

**Check off each step as you complete it:**

---

## PREPARATION

- [ ] I have my Resend API key ready (starts with `re_`)
- [ ] I'm logged into Supabase Dashboard
- [ ] I can see my Eras project

---

## NAVIGATION

- [ ] Clicked "Authentication" in left sidebar
- [ ] Scrolled down to "SMTP Settings" section
- [ ] Can see the configuration form

---

## CONFIGURATION

- [ ] Toggled "Enable Custom SMTP" to ON (should be blue/green)
- [ ] Entered Sender name: `Eras`
- [ ] Entered Sender email: `noreply@erastimecapsule.com`
- [ ] Entered Host: `smtp.resend.com`
- [ ] Entered Port: `465`
- [ ] Entered Username: `resend`
- [ ] Pasted Password: My full Resend API key (starts with `re_`)
- [ ] Clicked "Save" button
- [ ] Saw success message

---

## VERIFICATION

- [ ] Refreshed the page
- [ ] "Enable Custom SMTP" is still ON
- [ ] All fields still show correct values
- [ ] No error messages visible

---

## TESTING

- [ ] Opened incognito browser window
- [ ] Went to my Eras app
- [ ] Clicked "Sign Up"
- [ ] Entered test email: `________________@gmail.com`
- [ ] Entered password and name
- [ ] Clicked Sign Up button
- [ ] Saw "Check Your Email" screen
- [ ] **CHECKED EMAIL INBOX**
- [ ] Email arrived within 60 seconds
- [ ] Email is from "Eras <noreply@erastimecapsule.com>"
- [ ] Clicked verification link in email
- [ ] App opened and I'm logged in
- [ ] No errors in browser console

---

## 🎉 SUCCESS CRITERIA

**ALL boxes above checked = SMTP CONFIGURED PERFECTLY! 🚀**

---

## ❌ IF SOMETHING FAILED

**Which step failed?**
- Configuration step → Double-check values in SMTP_QUICK_REFERENCE.md
- Email didn't arrive → Check Supabase Logs for error message
- Email in spam → Check domain verification at resend.com/domains
- Other error → See SMTP_SETUP_WALKTHROUGH.md troubleshooting section

---

**Completed on:** _______________  
**Tested by:** _______________  
**Status:** 🟢 READY FOR PRODUCTION
