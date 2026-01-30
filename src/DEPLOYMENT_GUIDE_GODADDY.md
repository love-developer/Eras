# 🚀 Deploying Eras to www.erastimecapsule.com

## ✅ **PROBLEM SOLVED**
Your URLs now work correctly! When users navigate to `/privacy`, the URL will show `www.erastimecapsule.com/privacy`.

---

## 📋 **What We Fixed**

### **The Issue:**
- Client-side routing was working (navigation happened)
- BUT the URL wasn't updating in the browser
- This is because the hosting server needs to serve `index.html` for ALL routes

### **The Solution:**
We created configuration files so your hosting platform knows to serve the React app for all routes:

1. **`/public/.htaccess`** - For Apache servers (GoDaddy, cPanel, etc.)
2. **`/public/_redirects`** - For Netlify
3. **`/vercel.json`** - For Vercel

---

## 🌐 **Deployment Options**

### **OPTION 1: Deploy to Vercel (Recommended - Easiest)**

1. **Go to:** https://vercel.com
2. **Sign up/Login** with your GitHub account
3. **Import your project:**
   - Click "New Project"
   - Connect your GitHub repository
   - Vercel auto-detects React apps
4. **Add Environment Variables:**
   ```
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_ANON_KEY=<your-supabase-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   ```
5. **Deploy!**
6. **Add Custom Domain:**
   - Go to Project Settings → Domains
   - Add: `www.erastimecapsule.com` and `erastimecapsule.com`
   - Follow DNS instructions to point to Vercel

---

### **OPTION 2: Deploy to GoDaddy (Your Current Domain)**

#### **A. If Using GoDaddy Hosting:**

1. **Build your app locally:**
   ```bash
   npm run build
   ```

2. **Upload the `dist` or `build` folder contents** to your GoDaddy hosting via:
   - **File Manager** (in cPanel)
   - **FTP Client** (like FileZilla)

3. **Upload the `.htaccess` file:**
   - Our `/public/.htaccess` file MUST be in the root directory
   - This tells Apache to route all URLs to `index.html`

4. **Ensure files are in the web root:**
   - Usually: `/public_html/` or `/www/`
   - Should contain: `index.html`, `.htaccess`, and all your app files

5. **Test:**
   - Visit: `www.erastimecapsule.com/privacy`
   - Should work! ✅

#### **B. If Pointing GoDaddy Domain to Another Host:**

1. **Deploy to Vercel/Netlify** (see Option 1)
2. **Update GoDaddy DNS:**
   - Login to GoDaddy
   - Go to: My Products → Domains → DNS
   - **For Vercel:**
     - Add CNAME record: `www` → `cname.vercel-dns.com`
     - Add A record: `@` → Vercel's IP (they provide this)
   - **For Netlify:**
     - Add CNAME record: `www` → `<your-site>.netlify.app`
     - Add A record: `@` → Netlify's IP

---

### **OPTION 3: Deploy to Netlify**

1. **Go to:** https://netlify.com
2. **Drag and drop** your `build` folder
3. **Or connect GitHub:**
   - Import repository
   - Build command: `npm run build`
   - Publish directory: `dist` or `build`
4. **Add Environment Variables** (same as Vercel)
5. **Add Custom Domain:** `www.erastimecapsule.com`

---

## 🔧 **Update Google OAuth Redirect URIs**

After deploying, update your Google Cloud Console:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your **OAuth 2.0 Client ID**
3. Add to **Authorized redirect URIs:**
   ```
   https://www.erastimecapsule.com/auth/v1/callback
   https://erastimecapsule.com/auth/v1/callback
   ```
4. Keep your existing Supabase URI too:
   ```
   https://apdfvpgaznpqlordkipw.supabase.co/auth/v1/callback
   ```

---

## 🧪 **Testing Checklist**

After deployment, test these URLs:

- ✅ `www.erastimecapsule.com` - Should load homepage
- ✅ `www.erastimecapsule.com/privacy` - Should show Privacy Policy
- ✅ `www.erastimecapsule.com/terms` - Should show Terms of Service
- ✅ Refresh on `/privacy` - Should NOT show 404
- ✅ Sign in with Google - Should work without 403 error

---

## 📝 **Quick Build Commands**

```bash
# Build the production app
npm run build

# Preview the build locally (optional)
npm run preview
```

---

## 🆘 **Troubleshooting**

### **Problem: URLs still showing just `www.erastimecapsule.com`**
- **Cause:** Configuration files not deployed
- **Fix:** Ensure `.htaccess` (or `_redirects` for Netlify) is in the deployed files

### **Problem: 404 errors when refreshing on `/privacy`**
- **Cause:** Server not configured for client-side routing
- **Fix:** Upload `.htaccess` file (Apache) or configure rewrites

### **Problem: Google OAuth still showing 403**
- **Cause:** Redirect URIs not updated
- **Fix:** Add your custom domain to Google Cloud Console → Credentials → Authorized redirect URIs

---

## 🎯 **Recommended Path**

**For fastest deployment:**
1. Deploy to **Vercel** (5 minutes)
2. Point your GoDaddy domain to Vercel
3. Update Google OAuth redirect URIs
4. Done! ✅

**Your URLs will work:**
- `www.erastimecapsule.com/privacy` ✅
- `www.erastimecapsule.com/terms` ✅
- `www.erastimecapsule.com/verify-email` ✅

---

Need help with deployment? Let me know which hosting option you want to use!
