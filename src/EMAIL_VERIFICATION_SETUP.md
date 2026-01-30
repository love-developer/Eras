# Email Verification Setup Guide for Eras

## Overview

Your Eras app now has **proper email verification** implemented! Users will receive a verification email after signing up and must click the link to verify their account before they can use the app.

---

## ✅ What's Been Implemented

### 1. **Server-Side Changes**
- ✅ Removed `email_confirm: true` bypass
- ✅ Email verification is now **required** for all new signups
- ✅ Users receive verification emails automatically

### 2. **Frontend Components**
- ✅ **EmailVerification Component** (`/components/EmailVerification.tsx`)
  - Beautiful "Check your email" screen
  - Resend verification email button (60s cooldown)
  - Auto-checks verification status every 3 seconds
  - Automatically redirects after verification
  
- ✅ **Updated Auth Component** (`/components/Auth.tsx`)
  - Integrated EmailVerification component
  - Shows verification screen after signup
  - Handles email verification flow

### 3. **User Experience**
- ✅ Clear instructions for users
- ✅ Spam folder reminder
- ✅ Resend email functionality
- ✅ Back to login option
- ✅ Success confirmation screen

---

## 🚀 Next Steps: SMTP Configuration

To enable email sending, you need to configure SMTP in your Supabase project:

### Option 1: Use Supabase's Built-in Email Service (Recommended for Testing)

**Supabase provides limited free email sending** for testing:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Verify that email templates are enabled
4. Test by creating a new account in your app

**Limitations:**
- Limited to ~100 emails per day
- May be flagged as spam
- Not suitable for production

---

### Option 2: Configure Custom SMTP (Recommended for Production)

Use a professional email service like **Resend**, **SendGrid**, or **AWS SES**:

#### **Using Resend (Recommended - Easy Setup)**

1. **Create a Resend Account**
   - Go to [resend.com](https://resend.com)
   - Sign up for free account
   - Verify your email

2. **Get Your API Key**
   - In Resend dashboard, go to **API Keys**
   - Click **Create API Key**
   - Copy the key (starts with `re_`)

3. **Configure Supabase**
   - Go to Supabase Dashboard
   - Navigate to **Project Settings** → **Authentication**
   - Scroll to **SMTP Settings**
   - Fill in:
     ```
     Host: smtp.resend.com
     Port: 465
     Username: resend
     Password: [Your Resend API Key]
     Sender email: noreply@yourdomain.com
     Sender name: Eras
     ```
   - Enable **Enable Custom SMTP**
   - Click **Save**

4. **Verify Domain (Optional but Recommended)**
   - In Resend, go to **Domains**
   - Add your domain
   - Follow DNS verification steps
   - This improves deliverability and removes "via resend.com"

---

#### **Using SendGrid**

1. **Create SendGrid Account**
   - Go to [sendgrid.com](https://sendgrid.com)
   - Sign up (100 emails/day free)

2. **Create API Key**
   - Navigate to **Settings** → **API Keys**
   - Create new API Key with full access
   - Copy the key

3. **Configure Supabase SMTP**
   ```
   Host: smtp.sendgrid.net
   Port: 465
   Username: apikey
   Password: [Your SendGrid API Key]
   Sender email: noreply@yourdomain.com
   Sender name: Eras
   ```

---

#### **Using Gmail (Not Recommended for Production)**

**For testing only** - use an app-specific password:

1. Enable 2-Factor Authentication on your Google account
2. Go to Google Account → Security → App Passwords
3. Generate an app password
4. Configure Supabase:
   ```
   Host: smtp.gmail.com
   Port: 465
   Username: your-email@gmail.com
   Password: [App Password]
   Sender email: your-email@gmail.com
   Sender name: Eras
   ```

**⚠️ Warning:** Gmail has daily sending limits (100-500 emails/day) and may mark your emails as spam.

---

## 📧 Email Template Customization

Customize the verification email in Supabase:

1. Go to **Authentication** → **Email Templates**
2. Click on **Confirm signup**
3. Customize the template:

```html
<h2>Welcome to Eras! 🎉</h2>

<p>Hi there!</p>

<p>Thank you for signing up for Eras, your digital time capsule experience.</p>

<p>Please confirm your email address by clicking the link below:</p>

<p>
  <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
    Verify Email Address
  </a>
</p>

<p>Or copy and paste this URL into your browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p>This link will expire in 24 hours.</p>

<p>If you didn't create an account with Eras, you can safely ignore this email.</p>

<p>Best regards,<br>The Eras Team</p>
```

---

## 🧪 Testing Email Verification

### 1. **Test Signup Flow**

```javascript
// In your browser console or test:
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'SecurePass123!',
  options: {
    data: {
      first_name: 'Test',
      last_name: 'User'
    }
  }
});

console.log('Signup result:', { data, error });
// Should see: data.user exists but data.session is null (requires verification)
```

### 2. **Check Email Delivery**

- Check your test email inbox
- Look in spam/junk folders
- Verify the link works
- Check that clicking the link logs you in

### 3. **Test Resend Functionality**

- On the "Check Your Email" screen
- Wait for 60s cooldown
- Click "Resend Verification Email"
- Verify new email arrives

---

## 🔐 Security Best Practices

### 1. **Link Expiration**
- Verification links expire in 24 hours by default
- Configure in Supabase: **Authentication** → **URL Configuration**

### 2. **Rate Limiting**
- Supabase has built-in rate limiting
- Prevents spam signups
- Monitor in **Authentication** → **Rate Limits**

### 3. **Email Validation**
- The system validates email format
- Checks for existing accounts
- Prevents duplicate signups

---

## 🐛 Troubleshooting

### **Emails Not Sending**

**Check:**
1. ✅ SMTP credentials are correct
2. ✅ Sender email is valid
3. ✅ SMTP settings are saved and enabled
4. ✅ No rate limit errors in Supabase logs

**Test SMTP:**
```sql
-- In Supabase SQL Editor
SELECT auth.send_magic_link('test@example.com');
```

---

### **Emails Going to Spam**

**Solutions:**
1. ✅ Verify your sending domain (SPF, DKIM, DMARC)
2. ✅ Use a professional email service (Resend/SendGrid)
3. ✅ Avoid spam trigger words in email content
4. ✅ Include unsubscribe link
5. ✅ Warm up your sending domain gradually

---

### **Users Can't Verify**

**Check:**
1. ✅ Verification link hasn't expired
2. ✅ User clicked the correct link
3. ✅ Email template has `{{ .ConfirmationURL }}` variable
4. ✅ Redirect URL is configured correctly

---

## 📊 Monitoring

### **Check Email Delivery Logs**

1. Go to Supabase Dashboard
2. Navigate to **Logs** → **Auth Logs**
3. Filter by "email" events
4. Monitor for errors

### **Track Verification Rates**

```sql
-- In Supabase SQL Editor
SELECT 
  COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as verified_users,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NULL) as unverified_users,
  ROUND(
    COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) * 100.0 / COUNT(*),
    2
  ) as verification_rate_percent
FROM auth.users;
```

---

## 🎯 Production Checklist

Before launching to production:

- [ ] SMTP is configured with a professional service (Resend/SendGrid)
- [ ] Sending domain is verified
- [ ] Email templates are customized and tested
- [ ] Verification emails arrive in inbox (not spam)
- [ ] Links work correctly
- [ ] Resend functionality tested
- [ ] Rate limits configured appropriately
- [ ] Monitoring is set up
- [ ] Tested on multiple email providers (Gmail, Outlook, Yahoo)

---

## 🆘 Support Resources

- **Supabase Email Auth Docs:** https://supabase.com/docs/guides/auth/auth-email
- **Resend Documentation:** https://resend.com/docs
- **SendGrid SMTP Setup:** https://docs.sendgrid.com/for-developers/sending-email/integrating-with-the-smtp-api

---

## 📝 Summary

✅ **Email verification is now REQUIRED** for all new users  
✅ **EmailVerification component** provides beautiful UX  
✅ **Resend functionality** with cooldown  
✅ **Auto-verification detection** for seamless login  
✅ **Ready for SMTP configuration**

**Next Action:** Configure SMTP in Supabase to start sending verification emails!

---

**Questions?** Check the Supabase Auth documentation or review the EmailVerification component code in `/components/EmailVerification.tsx`.
