# Storage Upload RLS Error - Fix Guide

## Problem
Users are getting this error when uploading media files:
```
Failed to upload media file
Failed to upload-enhanced-photo-*.jpg: new row violates row-level security policy
```

## Root Cause
The Supabase Storage bucket has Row-Level Security (RLS) policies enabled that are blocking uploads, even though the server is using the service role key.

## Solution

### Option 1: Disable RLS on Storage Bucket (Recommended)
1. Go to your Supabase Dashboard
2. Navigate to **Storage** → **Policies**
3. Find the `make-f9be53a7-media` bucket
4. Click on **Policies** tab
5. If there are any INSERT policies, **delete them** or **disable RLS entirely** for the bucket
6. Alternatively, create a permissive policy:
   - Policy name: `Allow service role uploads`
   - Target: `INSERT`
   - Policy: `true` (allows all inserts when using service role)

### Option 2: Recreate the Bucket
If Option 1 doesn't work, recreate the bucket:

1. **Backup any existing media files** (if any)
2. Go to Storage → Buckets
3. Delete the `make-f9be53a7-media` bucket
4. The app will automatically recreate it on next upload with correct settings
5. OR manually create it with these settings:
   - Name: `make-f9be53a7-media`
   - Public: `true`
   - File Size Limit: `52428800` (50MB)
   - RLS: **Disabled** or set to allow all for service role

### Option 3: SQL Fix (Advanced)
Run this SQL in the Supabase SQL Editor:

```sql
-- Disable RLS on storage.objects for this bucket
-- (Service role will bypass RLS anyway, but this ensures no conflicts)

-- First, check if there are any restrictive policies
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- Option A: Drop all INSERT policies for the bucket (safest)
-- Replace 'your_policy_name' with actual policy name from above query
DROP POLICY IF EXISTS "your_policy_name" ON storage.objects;

-- Option B: Create a permissive policy for service role
CREATE POLICY "Service role can upload to media bucket"
ON storage.objects FOR INSERT
TO authenticated, service_role
USING (bucket_id = 'make-f9be53a7-media')
WITH CHECK (bucket_id = 'make-f9be53a7-media');
```

## Verification
After applying the fix:
1. Try uploading media to a capsule again
2. Check the browser console for any errors
3. Check the server logs for successful upload messages:
   ```
   ✅ File uploaded successfully: [path]
   ```

## Code Changes Made
The server code has been updated to:
1. Convert files to ArrayBuffer before upload (better compatibility)
2. Add explicit contentType to prevent MIME type issues
3. Add detailed error logging for RLS issues
4. Provide clearer error messages to users

## Prevention
For future buckets, always create them with:
- `public: true` 
- No restrictive RLS policies
- Or use service role key (which bypasses RLS when properly configured)
