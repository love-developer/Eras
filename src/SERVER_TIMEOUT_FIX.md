# Server Timeout Fix Guide

## Problem
The Supabase Edge Function server is timing out or unreachable, causing all API calls to fail with:
```
TypeError: Failed to fetch
Request to /api/capsules timed out after 25000ms
```

## Root Causes & Solutions

### 1. **Edge Function Not Deployed (Most Likely)**
The Edge Function may not be deployed or needs redeployment after code changes.

**Solution:**
```bash
# Redeploy the Edge Function
supabase functions deploy make-server-f9be53a7

# Or deploy with specific version
supabase functions deploy make-server-f9be53a7 --no-verify-jwt
```

### 2. **Edge Function Crashed During Startup**
Check the Edge Function logs for errors:

**In Supabase Dashboard:**
1. Go to **Edge Functions** → **make-server-f9be53a7**
2. Click **Logs** tab
3. Look for:
   - `💥 CRITICAL` errors
   - Import/syntax errors
   - Missing environment variables
   - KV connection errors

**Expected startup logs:**
```
🛡️ Global error handlers installed
🚀 [Startup] Initializing Hono app...
✅ [Startup] Hono app created
🔧 [Startup] Initializing Supabase client...
✅ [Startup] Supabase client initialized
📦 [Startup] Starting storage initialization (background)...
📝 [Startup] Enabling request logger...
✅ [Startup] Request logger enabled
📡 [Startup] Calling Deno.serve()...
✅ [Startup] Server started successfully - ready to accept connections
```

### 3. **Environment Variables Missing**
The Edge Function requires these environment variables:

- `SUPABASE_URL` ✓
- `SUPABASE_SERVICE_ROLE_KEY` ✓
- `SUPABASE_ANON_KEY` ✓

**Check in Supabase Dashboard:**
1. Go to **Project Settings** → **Edge Functions**
2. Verify all secrets are set
3. Redeploy if you added new secrets

### 4. **KV Store Table Missing**
The Edge Function requires the `kv_store_f9be53a7` table.

**Check:**
1. Go to **Database** → **Tables**
2. Look for `kv_store_f9be53a7` table
3. If missing, create it:

```sql
CREATE TABLE kv_store_f9be53a7 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);

-- Create index for better performance
CREATE INDEX idx_kv_store_key ON kv_store_f9be53a7(key);
```

### 5. **Network/CORS Issues**
If the function is deployed but not accessible:

**Check:**
- Project URL is correct: `https://apdfvpgaznpqlordkipw.supabase.co`
- No firewall/proxy blocking requests
- Browser DevTools Network tab shows request reaching server

### 6. **Function Timeout Configuration**
Edge Functions have a default 60s timeout, but our app uses 25s client-side timeout.

**If server is slow but not crashing:**
- Check for slow KV operations in logs
- Look for blocking operations
- Consider adding more timeouts/error handling

## Quick Fix Steps

### Step 1: Check Health Endpoint
Try accessing the health endpoint directly:
```
https://apdfvpgaznpqlordkipw.supabase.co/functions/v1/make-server-f9be53a7/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-11T...",
  "service": "Eras Backend Server",
  "version": "1.0.2"
}
```

### Step 2: Check Edge Function Logs
1. Supabase Dashboard → Edge Functions → make-server-f9be53a7 → Logs
2. Look for startup sequence or errors
3. Check timestamp of last successful request

### Step 3: Redeploy Edge Function
```bash
# In your terminal/CLI
supabase login
supabase link --project-ref apdfvpgaznpqlordkipw
supabase functions deploy make-server-f9be53a7
```

### Step 4: Verify Database Connection
Run in SQL Editor:
```sql
SELECT COUNT(*) FROM kv_store_f9be53a7;
```
Should return a count (even 0 is fine).

### Step 5: Test API Endpoint
After redeployment, test an endpoint:
```bash
curl -X GET \
  'https://apdfvpgaznpqlordkipw.supabase.co/functions/v1/make-server-f9be53a7/health' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

## Code Changes Made

I've added extensive logging and error handling to help debug:

1. **Startup Logging**: Every initialization step now logs to console
2. **Non-blocking Operations**: Storage init and flag clearing won't block startup
3. **Better Error Messages**: More context in error logs
4. **Health Check**: Enhanced health endpoint with diagnostics

## Prevention

To prevent this in the future:
1. Always check Edge Function logs after deployment
2. Use health endpoint to verify server is running
3. Monitor startup sequence in logs
4. Keep timeout values reasonable (25s client, 60s server)
5. Make non-critical operations non-blocking

## Still Not Working?

If none of the above works:
1. Check Supabase status page: https://status.supabase.com/
2. Try creating a minimal test function to isolate the issue
3. Contact Supabase support with function logs
4. Check if other Supabase services (Auth, Database) are working
