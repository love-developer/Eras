# 🚨 **SERVER DOWN - 30-SECOND FIX**

## **The Problem:**
All backend calls failing with `Failed to fetch`

## **The Cause:**
Supabase Edge Function not deployed or crashed

---

## **INSTANT CHECK (Do This First!):**

### **Option 1: Use Built-in Health Check**
1. Go to **Settings** (⚙️)
2. Scroll to **Developer Tools**
3. See **Server Health Check**
4. Check status:
   - ✅ Green = Server UP (different issue)
   - ❌ Red = Server DOWN (redeploy needed)

### **Option 2: Test in Browser**
Open this URL:
```
https://apdfvpgaznpqlordkipw.supabase.co/functions/v1/make-server-f9be53a7/health
```

**If you see JSON:** Server is running ✅  
**If "Failed to fetch":** Server is down ❌

---

## **THE FIX (5 minutes):**

### **1. Go to Supabase Dashboard**
```
https://supabase.com/dashboard/project/apdfvpgaznpqlordkipw
```

### **2. Check Edge Functions**
- Sidebar → **Edge Functions**
- Look for `make-server-f9be53a7`
- Is it there? Check status (green/red)
- Not there? Need to deploy

### **3. Redeploy** (via Terminal)
```bash
# Login (one time)
supabase login

# Link project (one time)
supabase link --project-ref apdfvpgaznpqlordkipw

# Deploy function
supabase functions deploy make-server-f9be53a7
```

### **4. Verify**
- Refresh health check in Settings
- Or visit health URL again
- Should see green status ✅

### **5. Refresh App**
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Errors should be gone!

---

## **Visual Guide:**

### **Health Check (in Settings):**
```
┌─────────────────────────────────┐
│ 🏥 Server Health Check          │
├─────────────────────────────────┤
│ Status: ❌ Server is DOWN       │ ← This means redeploy
│ Response Time: 10000ms          │
│                                 │
│ ❌ Server is Not Responding     │
│                                 │
│ Possible Causes:                │
│ • Edge Function not deployed    │ ← Most likely!
│ • Edge Function crashed         │
│ • Environment variables missing │
│ • Network connectivity issue    │
│                                 │
│ 🔧 How to Fix:                  │
│ 1. Go to Supabase Dashboard     │
│ 2. Check Edge Functions         │
│ 3. Redeploy if needed           │
└─────────────────────────────────┘
```

### **After Fix:**
```
┌─────────────────────────────────┐
│ 🏥 Server Health Check          │
├─────────────────────────────────┤
│ Status: ✅ Server is UP         │ ← Success!
│ Response Time: 234ms            │
│                                 │
│ ✅ Server is Running            │
│                                 │
│ {                               │
│   "status": "ok",               │
│   "service": "Eras Backend",    │
│   "version": "1.0.2"            │
│ }                               │
│                                 │
│ ✅ Server version: 1.0.2        │
│ ✅ Environment configured: Yes  │
│ ✅ Service keys present: Yes    │
└─────────────────────────────────┘
```

---

## **Quick Checklist:**

- [ ] Use health check in Settings
- [ ] Note the error message
- [ ] Go to Supabase Dashboard
- [ ] Check if function exists
- [ ] Redeploy if missing/crashed
- [ ] Check logs for errors
- [ ] Verify environment variables
- [ ] Test health endpoint
- [ ] Refresh app
- [ ] Verify errors gone

---

## **Common Scenarios:**

### **Scenario 1: Function Not Listed**
**Problem:** `make-server-f9be53a7` doesn't appear  
**Fix:** Deploy it!
```bash
supabase functions deploy make-server-f9be53a7
```

### **Scenario 2: Function Shows Red**
**Problem:** Crashed on startup  
**Fix:** Check logs, fix error, redeploy
```bash
supabase functions logs make-server-f9be53a7
```

### **Scenario 3: 502 Bad Gateway**
**Problem:** Server crashes immediately  
**Fix:** Check for syntax/import errors in logs

---

## **Environment Variables (If Needed):**

Go to: **Project Settings → Edge Functions → Environment Variables**

Add these if missing:
- `SUPABASE_URL` = Your project URL
- `SUPABASE_SERVICE_ROLE_KEY` = From API settings
- `SUPABASE_ANON_KEY` = From API settings

---

## **What You'll See When Fixed:**

### **Before:**
```
❌ Achievement definitions request timed out
❌ Database request error: Failed to fetch
❌ Failed to fetch available titles
❌ Failed to load folders
```

### **After:**
```
✅ Achievements loaded (30 total)
✅ Titles loaded (8 available)
✅ Folders loaded (3 folders)
✅ Backend sync active
```

---

## **Still Not Working?**

### **Collect This Info:**
1. Screenshot of health check result
2. Screenshot of Edge Functions dashboard
3. Output of deployment command
4. Recent server logs

### **Then:**
Let me know what you see and I'll help debug further!

---

## **Success Criteria:**

✅ Health check shows **green**  
✅ Health endpoint returns **JSON**  
✅ No more **"Failed to fetch"** errors  
✅ App loads **achievements/titles/folders**  
✅ Backend **sync working**  

---

**Most likely you just need to run:**
```bash
supabase functions deploy make-server-f9be53a7
```

**That's it!** 🚀

---

**Quick Card v1.0** | **Fixes 99% of cases** ✅
