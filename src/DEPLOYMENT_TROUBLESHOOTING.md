# 🚨 Edge Function Deployment Troubleshooting Guide

## Current Issue
The Edge Function `make-server-f9be53a7` is returning "Failed to fetch" errors, indicating the server is not responding.

---

## ✅ Step-by-Step Resolution

### 1. **Verify the Function Exists**
```bash
# In Supabase Dashboard:
# Go to: Edge Functions → Check if "make-server-f9be53a7" is listed
```

**Expected**: Function should be listed and show status "Active" or "Deployed"

---

### 2. **Redeploy the Function**
The function MUST be redeployed after code changes.

```bash
# Using Supabase CLI:
supabase functions deploy make-server-f9be53a7

# Or via Supabase Dashboard:
# Edge Functions → make-server-f9be53a7 → Deploy button
```

---

### 3. **Check Function Logs**
```bash
# View real-time logs:
supabase functions logs make-server-f9be53a7 --stream

# Or in Dashboard:
# Edge Functions → make-server-f9be53a7 → Logs tab
```

**Look for**:
- ✅ `🚀 [Startup] Server starting - all systems ready`
- ✅ `✅ [Startup] Server started successfully`
- ❌ Any error messages during startup
- ❌ `💥 CRITICAL: Failed to start server`

---

### 4. **Test Health Endpoints**

#### Option A: Browser Test
Open in browser:
```
https://apdfvpgaznpqlordkipw.supabase.co/functions/v1/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "message": "Eras server is running",
  "timestamp": "2024-12-30T..."
}
```

#### Option B: curl Test
```bash
curl https://apdfvpgaznpqlordkipw.supabase.co/functions/v1/make-server-f9be53a7/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "service": "Eras Backend Server",
  "version": "1.0.2",
  "timestamp": "2024-12-30T..."
}
```

---

### 5. **Check Environment Variables**
In Supabase Dashboard → Edge Functions → make-server-f9be53a7 → Settings

**Required Variables:**
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `FROM_EMAIL` = "Eras <noreply@erastimecapsule.com>"
- ✅ `RESEND_API_KEY`
- ✅ `OPENAI_API_KEY` (or `openai_api_key`)
- ⚠️ `FRONTEND_URL` = "https://found-shirt-81691824.figma.site" (optional but recommended)

---

## 🔍 Common Causes & Fixes

### Issue 1: Function Not Deployed
**Symptoms**: All endpoints return "Failed to fetch"
**Fix**: Redeploy the function (Step 2 above)

### Issue 2: Startup Crash
**Symptoms**: Logs show errors immediately after startup
**Fix**: Check logs for specific error, likely missing environment variable or import issue

### Issue 3: Timeout During Startup
**Symptoms**: Function appears to deploy but never responds
**Fix**: Check for infinite loops or blocking operations in module imports

### Issue 4: CORS Issues
**Symptoms**: Browser shows CORS errors in console
**Fix**: Already configured correctly in code, but verify deployment

### Issue 5: Wrong Project ID
**Symptoms**: 404 or "Function not found"
**Fix**: Verify project ID matches:
- Code: `apdfvpgaznpqlordkipw`
- URL should be: `https://apdfvpgaznpqlordkipw.supabase.co/functions/v1/...`

---

## 📊 Diagnostic Checklist

Run through this checklist:

- [ ] Function exists in Supabase Dashboard
- [ ] Function status shows "Active" or "Deployed"
- [ ] Function was redeployed after latest code changes
- [ ] Deployment logs show no errors
- [ ] Health endpoint returns 200 OK
- [ ] All required environment variables are set
- [ ] Project ID matches in code and URLs
- [ ] No startup errors in function logs

---

## 🆘 If Still Not Working

### Check Network/DNS
```bash
# Verify Supabase is reachable:
curl https://apdfvpgaznpqlordkipw.supabase.co/

# Should return HTML or JSON, not a connection error
```

### Check Browser Console
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try loading the app
4. Click on failed requests
5. Check:
   - **Status**: Should be 200, not 0 or 503
   - **Response**: Should be JSON, not empty
   - **Headers**: Check if CORS headers present

### Contact Supabase Support
If function logs show errors that aren't clear, contact Supabase support with:
- Project ID: `apdfvpgaznpqlordkipw`
- Function name: `make-server-f9be53a7`
- Error logs from function logs
- Steps you've already tried

---

## ✅ Success Indicators

You'll know it's working when:
1. ✅ Health endpoint returns valid JSON
2. ✅ App loads without "Failed to fetch" errors
3. ✅ Function logs show successful requests
4. ✅ Dashboard shows API request counts increasing

---

## 📝 Notes for Deployment Team

**Critical Information:**
- Function name: `make-server-f9be53a7`
- Project: `apdfvpgaznpqlordkipw`
- Main file: `/supabase/functions/server/index.tsx`
- Recent changes: Added beneficiary reminder cron endpoint
- Health checks: `/health` and `/make-server-f9be53a7/health`

**Deployment Command:**
```bash
cd /path/to/project
supabase functions deploy make-server-f9be53a7
```

**Verify Deployment:**
```bash
# Should return JSON with status "ok":
curl https://apdfvpgaznpqlordkipw.supabase.co/functions/v1/health
```

---

## 🔄 After Successful Deployment

Once deployed and working:
1. ✅ Test the app in browser - errors should be gone
2. ✅ Configure the beneficiary reminder cron job (see main conversation)
3. ✅ Monitor function logs for first few hours
4. ✅ Test key user flows (create capsule, send to beneficiary, etc.)

---

**Last Updated**: December 30, 2024
**Status**: Awaiting redeployment
