# ✅ Supabase SMTP Configuration - Use Your Existing Resend Account

You already have Resend configured for capsule emails! Now let's use the **same account** for verification emails.

---

## 📋 Configuration Values

Use these **exact values** in Supabase SMTP settings:

```
✅ Sender name:      Eras
✅ Sender email:     noreply@erastimecapsule.com
✅ Host:             smtp.resend.com
✅ Port number:      465
✅ Username:         resend
✅ Password:         [Your RESEND_API_KEY from environment variables]
```

**Note:** Your Resend API key is already stored in your environment as `RESEND_API_KEY`. You're using it to send capsule delivery emails, and it will work perfectly for verification emails too!

---

## 🚀 Step-by-Step Setup

### Step 1: Get Your API Key

Your API key is already in the system (environment variable `RESEND_API_KEY`).

**To see it:**

1. Go to your Supabase project
2. Click **⚙️ Project Settings** (bottom left)
3. Click **Edge Functions** tab
4. Under **Environment Variables**, find `RESEND_API_KEY`
5. Click the **👁️ eye icon** to reveal the value
6. Copy it (starts with `re_`)

**OR** go directly to [resend.com/api-keys](https://resend.com/api-keys) to see your keys.

---

### Step 2: Configure Supabase SMTP

1. **Stay in Project Settings**
   - If you left, go back to **⚙️ Project Settings**

2. **Go to Authentication Tab**
   - Click **Authentication** at the top

3. **Scroll to SMTP Settings**
   - Scroll down until you see **SMTP Settings** section

4. **Enable Custom SMTP**
   - Toggle **"Enable Custom SMTP"** to ON (should turn blue)

5. **Fill in the Form** (copy-paste these values):

   | Field | Value |
   |-------|-------|
   | Sender name | `Eras` |
   | Sender email | `noreply@erastimecapsule.com` |
   | Host | `smtp.resend.com` |
   | Port number | `465` |
   | Minimum interval between emails (seconds) | `1` (default is fine) |
   | Maximum emails per hour | `100` (or leave default) |
   | Username | `resend` |
   | Password | `[Your re_xxxxx API key]` |

6. **Click Save**
   - Scroll to bottom
   - Click the **Save** button
   - Look for success confirmation

---

### Step 3: Verify Email Confirmation is Enabled

1. **Go to Authentication → Providers**
   - In left sidebar, click **Authentication**
   - Click **Providers** tab at top

2. **Check Email Provider**
   - Click on **Email** in the list

3. **Enable Confirm Email**
   - Find **"Confirm email"** toggle
   - Make sure it's **ON** (blue)
   - If it's OFF (gray), toggle it ON

4. **Click Save**

---

### Step 4: (Optional) Customize Email Template

Make the verification email beautiful:

1. **Go to Authentication → Email Templates**
   - Click **Email Templates** tab

2. **Edit Confirm Signup Template**
   - Click **"Confirm signup"** template

3. **Paste This Beautiful Template**:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white;">
    
    <!-- Header with Eclipse Logo -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #1e293b 0%, #312e81 50%, #4c1d95 100%);">
      <tr>
        <td align="center" style="padding: 50px 20px;">
          <!-- Eclipse Logo -->
          <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto 25px auto;">
            <circle cx="40" cy="40" r="36" fill="none" stroke="#a855f7" stroke-width="1" opacity="0.3"/>
            <circle cx="48" cy="40" r="28" fill="#f59e0b" stroke="#d97706" stroke-width="1.5" opacity="0.95"/>
            <circle cx="43" cy="35" r="8" fill="#fef3c7" opacity="0.6"/>
            <circle cx="44" cy="36" r="5" fill="#ffffff" opacity="0.4"/>
            <circle cx="32" cy="40" r="26" fill="#2d3748" stroke="#4a5568" stroke-width="1"/>
            <circle cx="27" cy="35" r="7" fill="#475569" opacity="0.6"/>
            <circle cx="64" cy="16" r="1.5" fill="#ffffff" opacity="0.7"/>
            <circle cx="72" cy="24" r="1" fill="#ffffff" opacity="0.6"/>
            <circle cx="70" cy="34" r="0.8" fill="#ffffff" opacity="0.5"/>
          </svg>
          
          <!-- Brand Name -->
          <span style="color: #ffffff; font-size: 42px; font-weight: 800; letter-spacing: 4px; text-transform: uppercase; display: block; margin-bottom: 15px;">ERAS</span>
          
          <!-- Tagline -->
          <span style="color: rgba(255, 255, 255, 0.9); font-size: 13px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; display: block;">Digital Time Capsule</span>
        </td>
      </tr>
    </table>
    
    <!-- Content -->
    <div style="padding: 40px;">
      <h2 style="color: #1f2937; font-size: 24px; font-weight: 700; margin: 0 0 20px 0;">Welcome to Eras! 🎉</h2>
      
      <p style="color: #1f2937; font-size: 16px; line-height: 1.7; margin: 0 0 15px 0;">Thank you for joining Eras — your personal digital time capsule for preserving memories across time.</p>
      
      <p style="color: #6b7280; font-size: 16px; line-height: 1.7; margin: 0 0 30px 0;">To get started, please verify your email address by clicking the button below:</p>
      
      <!-- Call to Action Button -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 30px 0;">
        <tr>
          <td align="center">
            <a href="{{ .ConfirmationURL }}" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 16px 50px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 17px;">
              Verify Email Address
            </a>
          </td>
        </tr>
      </table>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">Or copy and paste this link into your browser:</p>
      <p style="color: #667eea; font-size: 14px; word-break: break-all; margin: 0 0 30px 0;">{{ .ConfirmationURL }}</p>
      
      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0 0 25px 0;">⏰ This link will expire in 24 hours for security.</p>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">If you didn't create an account with Eras, you can safely ignore this email.</p>
      
      <p style="color: #6b7280; font-size: 16px; line-height: 1.7; margin: 30px 0 10px 0;">Best regards,</p>
      <p style="color: #1f2937; font-size: 16px; font-weight: 600; margin: 0;">— The Eras Team</p>
    </div>
    
    <!-- Footer -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background-color: #f9fafb; padding: 25px 40px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
            Need help? Contact us at <a href="mailto:support@erastimecapsule.com" style="color: #667eea; text-decoration: none;">support@erastimecapsule.com</a>
          </p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
```

4. **Click Save**

---

## ✅ Test It!

### Method 1: Quick Test

1. Open your app in **incognito/private mode**
2. Sign up with a **new email address** (not one you used before)
3. Check your inbox - email should arrive in **5-30 seconds**
4. Click the verification link
5. You should be auto-logged in! 🎉

### Method 2: Check Resend Dashboard

1. Go to [resend.com/emails](https://resend.com/emails)
2. You should see the verification email in the list
3. Status should show ✅ **Delivered**

---

## 🐛 Troubleshooting

### "Still not receiving emails"

**Double-check:**

1. ✅ Custom SMTP toggle is **ON** (blue, not gray)
2. ✅ You clicked **Save** after entering settings
3. ✅ API key starts with `re_` and has no extra spaces
4. ✅ Port is `465` (NOT 587)
5. ✅ Username is exactly `resend` (lowercase)
6. ✅ Sender email is `noreply@erastimecapsule.com`

**Test in Resend:**

1. Go to [resend.com/emails](https://resend.com/emails)
2. Do you see any failed attempts?
3. Click on failed email to see the error

**Check Supabase Logs:**

1. Supabase Dashboard → **Logs** → **Auth Logs**
2. Filter by your email address
3. Look for email-related errors

### "Email goes to spam"

✅ **Good news!** You're using `erastimecapsule.com` which is already verified in Resend (you're using it for capsule emails). This means your emails should have excellent deliverability!

### "Wrong confirmation URL"

**Check Supabase Site URL:**

1. Go to **Authentication** → **URL Configuration**
2. Make sure **Site URL** is set to your app's URL
3. Should be something like `https://your-project.make.dev` or your custom domain

---

## 📊 What This Gives You

✅ **Professional emails** from your verified domain  
✅ **Same account** as capsule delivery emails (no extra cost)  
✅ **High deliverability** (verified domain = no spam)  
✅ **Beautiful branding** (matches your app design)  
✅ **Fast delivery** (5-30 seconds typically)  
✅ **Detailed tracking** in Resend dashboard  

---

## 💡 Pro Tips

1. **Monitor in Resend**
   - Check [resend.com/emails](https://resend.com/emails) regularly
   - Track open rates and bounces
   - Set up webhooks for delivery status

2. **Rate Limits**
   - Your paid Resend plan has higher limits
   - Supabase has built-in rate limiting too
   - Current settings should handle hundreds of signups/hour

3. **Testing Addresses**
   - Don't test with the same email repeatedly
   - Use different emails or wait 60 seconds between attempts
   - Supabase has anti-spam rate limiting

---

## ✅ Checklist

Before you're done, verify:

- [ ] Custom SMTP is **enabled** (toggle is blue)
- [ ] All fields are filled in correctly
- [ ] Clicked **Save** button
- [ ] Email confirmation is **enabled**
- [ ] Tested signup with new email
- [ ] Received email in inbox (not spam)
- [ ] Verification link works
- [ ] Email shows in Resend dashboard as delivered

---

## 🎉 You're Done!

Your email verification is now fully configured using your existing Resend account. Users will receive beautiful, branded verification emails from `noreply@erastimecapsule.com` - the same domain you use for capsule deliveries!

**Next:** Test thoroughly and you're ready to launch! 🚀
