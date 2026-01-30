# Connect Your Resend Account to Supabase (5 minutes)

You already have Resend - great! Now let's connect it so your users receive verification emails.

---

## Step 1: Get Your Resend API Key

1. Go to [resend.com/api-keys](https://resend.com/api-keys)
2. Sign in to your account
3. You should see existing API keys or click **"Create API Key"**
4. Copy the API key (starts with `re_`)
   - ⚠️ It only shows once, so copy it now!
   - If you have an existing key, you can use that

---

## Step 2: Configure Supabase SMTP

1. **Open Supabase Dashboard**
   - Go to [supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your **Eras project**

2. **Navigate to SMTP Settings**
   - Click **⚙️ Project Settings** (bottom left)
   - Click **Authentication** tab
   - Scroll down to **SMTP Settings** section

3. **Enable Custom SMTP**
   - Toggle **"Enable Custom SMTP"** to ON (blue)

4. **Fill in Resend Configuration**
   ```
   Sender name:      Eras
   Sender email:     noreply@yourdomain.com
   Host:             smtp.resend.com
   Port number:      465
   Username:         resend
   Password:         [Paste your Resend API key: re_xxxxx]
   ```

   **Important Details:**
   - **Sender email**: Use your verified domain (e.g., `noreply@eras.app`)
     - If you haven't verified a domain in Resend, use `onboarding@resend.dev` for testing
   - **Username**: Must be exactly `resend` (lowercase)
   - **Password**: Your Resend API key (starts with `re_`)
   - **Port**: Use `465` (not 587)

5. **Click Save**
   - Scroll to bottom
   - Click **Save** button
   - Wait for success confirmation

---

## Step 3: Enable Email Confirmation (If Disabled)

1. In Supabase, go to **Authentication** → **Providers**
2. Click on **Email** provider
3. Make sure **"Confirm email"** is toggled **ON** (blue)
4. Click **Save**

---

## Step 4: Customize Email Templates (Optional but Recommended)

Make the verification email match your brand:

1. In Supabase, go to **Authentication** → **Email Templates**
2. Click **"Confirm signup"**
3. Customize the template:

```html
<h2>Welcome to Eras! 🎉</h2>

<p>Hi there!</p>

<p>Thank you for joining Eras, your digital time capsule for preserving memories.</p>

<p>Please verify your email address to get started:</p>

<p>
  <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
    Verify Email Address
  </a>
</p>

<p>Or copy and paste this link:</p>
<p style="color: #667eea;">{{ .ConfirmationURL }}</p>

<p style="color: #666; font-size: 14px;">This link expires in 24 hours.</p>

<p style="color: #666; font-size: 14px;">If you didn't sign up for Eras, you can safely ignore this email.</p>

<p>Best,<br>The Eras Team</p>
```

4. Click **Save**

---

## Step 5: Test It!

### Test Signup Flow:

1. **Clear your browser data** (or use incognito/private mode)
2. **Go to your app** and sign up with a NEW email
3. **Check your inbox** - email should arrive within 5-30 seconds
4. **Click the verification link**
5. **You should be auto-logged in** to the app

### Check Resend Dashboard:

1. Go to [resend.com/emails](https://resend.com/emails)
2. You should see the email that was just sent
3. Check status: Should show ✅ **Delivered**

---

## 🐛 Troubleshooting

### "Still not receiving emails"

**Check these common issues:**

1. **Is Custom SMTP enabled?**
   - Supabase → Settings → Authentication → SMTP Settings
   - Toggle should be blue (ON)

2. **Did you click Save?**
   - After filling in SMTP settings
   - Look for success message

3. **Is the API key correct?**
   - Should start with `re_`
   - No extra spaces
   - Copy-paste directly from Resend

4. **Check Resend dashboard**
   - Go to [resend.com/emails](https://resend.com/emails)
   - Do you see failed attempts?
   - Click on failed email to see error

5. **Check Supabase Logs**
   - Supabase → Logs → Auth Logs
   - Filter for "email" events
   - Look for SMTP errors

### "Emails going to spam"

**Solutions:**

1. **Verify your domain in Resend**
   - Resend Dashboard → Domains
   - Add your domain (e.g., `eras.app`)
   - Add DNS records (SPF, DKIM, DMARC)
   - This significantly improves deliverability

2. **Use proper sender email**
   - Don't use: `test@gmail.com`
   - Use: `noreply@yourdomain.com`

3. **Warm up your domain** (if brand new)
   - Send gradually increasing volume
   - Resend handles this automatically

### "Wrong sender email showing"

**Fix:**
- In Supabase SMTP settings, make sure **Sender email** matches a verified domain in Resend
- If testing, use `onboarding@resend.dev`
- For production, verify your domain first

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Custom SMTP is enabled in Supabase
- [ ] Resend API key is configured correctly
- [ ] Email confirmation is enabled
- [ ] Test signup receives email within 30 seconds
- [ ] Verification link works and logs user in
- [ ] Email appears in Resend dashboard as "Delivered"
- [ ] Email doesn't go to spam
- [ ] Email template looks good

---

## 🎯 Next Steps

### For Development:
- ✅ SMTP configured
- ✅ Test thoroughly with multiple emails
- ✅ Check spam folders

### For Production:

1. **Verify Your Domain in Resend** (Highly Recommended)
   - Improves deliverability by 50%+
   - Removes "via resend.com" from sender
   - Adds SPF/DKIM authentication
   - Steps: Resend → Domains → Add Domain → Add DNS records

2. **Customize All Email Templates**
   - Confirm signup ✅ (already done)
   - Magic Link (if you add that feature)
   - Password Reset
   - Email Change

3. **Set Up Email Analytics**
   - Monitor open rates in Resend
   - Track bounces and complaints
   - Adjust templates based on performance

4. **Configure Rate Limits**
   - Supabase → Authentication → Rate Limits
   - Prevent spam signups
   - Default limits are usually fine

---

## 📊 Expected Performance

With Resend properly configured:

- **Delivery time**: 5-30 seconds
- **Deliverability**: 95%+ (99% with verified domain)
- **Spam rate**: <1% (with verified domain)
- **Cost**: Included in your Resend plan

---

## 🆘 Still Having Issues?

### Quick Diagnosis:

**Run this test in Supabase SQL Editor:**

```sql
-- Check if SMTP is configured
SELECT 
  current_setting('app.settings.smtp_host') as smtp_host,
  current_setting('app.settings.smtp_port') as smtp_port;
```

**Check auth settings:**

```sql
SELECT * FROM auth.config;
```

### Get Help:

1. **Check Resend Status**: [resend.com/status](https://resend.com/status)
2. **Supabase Auth Docs**: [supabase.com/docs/guides/auth/auth-email](https://supabase.com/docs/guides/auth/auth-email)
3. **Resend Support**: [resend.com/support](https://resend.com/support)

---

## 📝 Summary

You've successfully connected your Resend account to Supabase! 

**What you configured:**
- ✅ SMTP credentials in Supabase
- ✅ Resend API key for email sending
- ✅ Email verification enabled
- ✅ Custom email template (optional)

**What happens now:**
- Users sign up → Receive email in seconds
- Click link → Auto-login to app
- Professional emails from your domain
- Detailed delivery tracking in Resend

**Production checklist:**
- [ ] Verify your domain in Resend (for better deliverability)
- [ ] Test with multiple email providers (Gmail, Outlook, Yahoo)
- [ ] Monitor Resend dashboard for delivery stats
- [ ] Set up bounce/complaint handling

---

**You're all set! 🎉** Try signing up with a new account to test it.
