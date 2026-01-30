# How to Get Your Resend API Key

## ✅ Option 1: View Existing Key in Resend (Recommended)

1. **Go to Resend Dashboard**
   - Open [resend.com/api-keys](https://resend.com/api-keys)
   - Sign in to your account

2. **View Your API Keys**
   - You'll see a list of your API keys
   - Look for the one you're currently using
   - **Important:** For security, Resend only shows the full key once when created

3. **Two Options:**

   ### A. Create a New API Key (Easiest)
   
   Since Resend doesn't show the full key after creation, the easiest solution is:
   
   1. Click **"Create API Key"** button
   2. Give it a name like `Eras - Email Verification`
   3. Select permissions: **Full Access** or **Sending Access**
   4. Click **Create**
   5. **Copy the key immediately** (starts with `re_`)
   6. Save it somewhere secure (you won't be able to see it again)
   
   ### B. Use Your Existing Key (If You Have It Saved)
   
   - Check if you saved the key when you first created it
   - Look in password managers, notes, or setup docs
   - The key you're using for capsule emails is the same one
   
---

## ✅ Option 2: Check Your Backend Code (Quick)

Your API key is already in your server code! Let me help you find it:

1. **Check Supabase Edge Function Logs**
   - Go to Supabase Dashboard
   - Click **Edge Functions** → **server**
   - Click **Logs** tab
   - Look for any email-related logs that show the API key preview
   - You might see something like `re_abc123...xyz789`

2. **Test Email Send to Get Preview**
   - Send a test capsule email
   - Check the server logs
   - The logs show API key preview (first 8 + last 4 characters)
   - That gives you clues, but you still need the full key from Resend

---

## 🎯 Recommended Approach

**Just create a new API key in Resend:**

1. Go to [resend.com/api-keys](https://resend.com/api-keys)
2. Click **"Create API Key"**
3. Name: `Eras Email Service` or `Eras Verification Emails`
4. Permissions: **Full Access** (or **Sending Access** minimum)
5. Click **Create**
6. **IMMEDIATELY COPY** the key (it starts with `re_`)
7. Use it in both places:
   - Supabase SMTP Settings (for verification emails)
   - Your existing `RESEND_API_KEY` environment variable (optional - you can keep using the old one for capsules)

---

## ✅ Using the API Key

Once you have the key:

### For Supabase SMTP (Verification Emails):

1. Supabase Dashboard → ⚙️ Project Settings → Authentication
2. Scroll to **SMTP Settings**
3. Enable **Custom SMTP**
4. Fill in:
   ```
   Host:       smtp.resend.com
   Port:       465
   Username:   resend
   Password:   [Paste your re_xxxxx key here]
   ```
5. Save

### For Your Environment Variable (Capsule Emails):

**Note:** You don't need to change this unless you want to use the new key for everything.

If you want to update it:

1. Supabase Dashboard → ⚙️ Project Settings → Edge Functions
2. Under **Environment Variables**
3. Find `RESEND_API_KEY`
4. Click **Edit**
5. Paste new key
6. Save

---

## 💡 Pro Tips

1. **Multiple API Keys Are Fine**
   - You can have multiple API keys in Resend
   - One for SMTP (verification emails)
   - One for programmatic emails (capsule deliveries)
   - Or use the same key for both (simpler)

2. **Save Your Keys Securely**
   - Use a password manager (1Password, LastPass, etc.)
   - Or save in a secure document
   - **Never** commit keys to Git/GitHub

3. **Rotate Keys Periodically**
   - Good security practice
   - Create new key → Update everywhere → Delete old key

4. **Monitor Usage**
   - Resend dashboard shows all emails sent
   - Track which API key sent what
   - Set up alerts for unusual activity

---

## 🔒 Security Note

**Why you can't see the full key in Supabase:**
- Supabase hides secrets for security (good practice!)
- This prevents accidentally exposing keys in screenshots/logs
- Always retrieve keys from the original source (Resend)

---

## ✅ Quick Checklist

- [ ] Go to resend.com/api-keys
- [ ] Click "Create API Key"
- [ ] Name it (e.g., "Eras Email Service")
- [ ] Set permissions (Full Access)
- [ ] Click Create
- [ ] **COPY THE KEY IMMEDIATELY** (you won't see it again!)
- [ ] Paste into Supabase SMTP Settings password field
- [ ] Save settings
- [ ] Test with a new signup

---

## 🆘 Still Stuck?

If you can't access Resend or create a key:

1. **Check if you're logged into the right account**
   - You mentioned having a paid account
   - Make sure you're not on a different/team account

2. **Check account permissions**
   - Some team accounts restrict API key creation
   - You may need admin access

3. **Contact Resend Support**
   - [resend.com/support](https://resend.com/support)
   - They can help retrieve or reset keys

---

## 🎉 Ready to Go!

Once you have the key:
1. Add to Supabase SMTP Settings
2. Enable email confirmation
3. Test signup
4. Verification emails will work! ✅

The key is the same format you're already using for capsule emails - starts with `re_` and is about 40-50 characters long.
