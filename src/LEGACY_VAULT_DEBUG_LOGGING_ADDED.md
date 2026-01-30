# Legacy Vault - Complete Debug Logging Added ✅

## Date: December 26, 2024

## Debug Logging Locations

### 1. When Beneficiary is Created (Server Endpoint)
**File**: `/supabase/functions/server/index.tsx:9305-9307`
```typescript
console.log(`👤 [Legacy Access] Adding beneficiary for user: ${user.id}`);
console.log(`📁 [Legacy Access] Folder permissions provided: ${folderPermissions ? Object.keys(folderPermissions).length : 0} folders`);
console.log(`📁 [Legacy Access] Full folder permissions:`, JSON.stringify(folderPermissions, null, 2));
```

### 2. When Beneficiary is Stored (Legacy Access Service)
**File**: `/supabase/functions/server/legacy-access-service.tsx:136`
```typescript
folderPermissions: beneficiaryData.folderPermissions || {} // ✅ ADD: Store folder permissions on creation
```

### 3. When Unlock Email is Sent (Legacy Access Service)
**File**: `/supabase/functions/server/legacy-access-service.tsx:868-877`
```typescript
console.log(`📧 [Phase 5] Preparing unlock email for ${beneficiary.email}`);
console.log(`🔍 [Phase 5] Beneficiary object:`, JSON.stringify(beneficiary, null, 2));
console.log(`🔍 [Phase 5] Folder permissions:`, JSON.stringify(folderPermissions, null, 2));
console.log(`🔍 [Phase 5] Loading ${Object.keys(folderPermissions).length} permitted folders individually...`);
```

### 4. When Vault Access Page is Loaded (Server Endpoint)
**File**: `/supabase/functions/server/index.tsx:10104-10110`
```typescript
console.log(`🔍 [Phase 3] Loading vault folders for owner ${ownerUserId}...`);
console.log(`📊 [Phase 3] Unlock token object:`, JSON.stringify(matchingUnlock, null, 2));
console.log(`📊 [Phase 3] Folder permissions from token:`, JSON.stringify(folderPermissions, null, 2));
console.log(`📊 [Phase 3] Beneficiary has permissions for ${Object.keys(folderPermissions).length} folders`);
```

---

## Testing Flow & Expected Logs

### Step 1: Add Beneficiary with Folders
1. Go to Settings → Legacy Access
2. Click "Add Beneficiary"
3. Fill in name: "Lenny", email: "lenny@example.com"
4. **Select 1 folder with 3 items** (checkbox + permission level)
5. Click "Add Beneficiary"

**Expected Logs**:
```
👤 [Legacy Access] Adding beneficiary for user: abc-123
📁 [Legacy Access] Folder permissions provided: 1 folders
📁 [Legacy Access] Full folder permissions: {
  "folder_xyz789": "view"
}
```

### Step 2: Beneficiary Verifies Email
1. Beneficiary receives email
2. Clicks "Accept Role"  
3. Status changes to "verified"

**Expected**: folderPermissions should persist in beneficiary object

### Step 3: Manually Trigger Unlock (For Testing)
You need to either:
- Wait for inactivity trigger, OR
- Set a manual date trigger and wait, OR  
- **Create a test endpoint to trigger unlock immediately**

When unlock triggers:
```
🔓 [Phase 5] Unlocking vault for 1 beneficiaries
🔑 [Phase 5] Creating unlock token with 1 folder permissions
```

### Step 4: Unlock Email Sent
```
📧 [Phase 5] Preparing unlock email for lenny@example.com
🔍 [Phase 5] Beneficiary object: {
  "id": "ben_...",
  "name": "Lenny",
  "email": "lenny@example.com",
  "status": "verified",
  "folderPermissions": {
    "folder_xyz789": "view"  ← Should be here!
  }
}
🔍 [Phase 5] Folder permissions: {
  "folder_xyz789": "view"
}
🔍 [Phase 5] Loading 1 permitted folders individually...
  ✅ Folder: My Photos (folder_xyz789), Permission: view, Items: 3
```

Email should show:
- 1 folder
- 3 total items

### Step 5: Beneficiary Accesses Vault
1. Beneficiary clicks link in email
2. Taken to `/legacy-vault/access?token=tok_...`

**Expected Logs**:
```
🔓 [Phase 3] Validating vault access token: tok_1234...
🔍 [Phase 3] Checking token: tok_1234567890_abcdef
✅ [Phase 3] Found matching unlock for user abc-123
📊 [Phase 3] Unlock token object: {
  "tokenId": "tok_1234567890_abcdef",
  "userId": "abc-123",
  "beneficiaryId": "ben_...",
  "folderPermissions": {
    "folder_xyz789": "view"  ← Must be here!
  }
}
📊 [Phase 3] Folder permissions from token: {
  "folder_xyz789": "view"
}
📊 [Phase 3] Beneficiary has permissions for 1 folders
  ✅ Folder: My Photos (folder_xyz789), Permission: view, Items: 3
✅ [Phase 3] Vault access validated: 1 folders, 3 items
```

Vault access page should show:
- 1 Folder
- 3 Total Items
- "My Photos" folder visible

---

## If Still Showing 0 Folders/0 Items

Check the logs at each step. The issue will be one of:

### Issue A: Frontend not sending folderPermissions
**Symptom**: First log shows `"Full folder permissions: undefined"` or `{}`

**Fix**: Check that frontend is selecting folders and sending them in API call

### Issue B: Beneficiary object doesn't have folderPermissions after creation
**Symptom**: Step 4 logs show `"folderPermissions": {}`

**Fix**: Check `addBeneficiary` function is storing the permissions (line 136)

### Issue C: folderPermissions lost after email verification
**Symptom**: Beneficiary object has permissions before verification, but not after

**Fix**: Check `verifyBeneficiary` function doesn't overwrite the object

### Issue D: folderPermissions not copied to unlock token
**Symptom**: Step 4 shows beneficiary has permissions, but unlock token doesn't

**Already Fixed**: Line 692 copies permissions to token

### Issue E: Folder doesn't exist in vault
**Symptom**: Log shows "Folder {folderId} not found in vault"

**Fix**: Verify folder exists in KV as `vault_folder:{userId}:{folderId}`

### Issue F: Folder has no media items
**Symptom**: Folder found but shows 0 items

**Fix**: Check that folder.mediaItems array is populated when folder is created/updated

---

## Next Steps

1. **Run the full flow** with debug logging enabled
2. **Copy all console logs** from browser and server
3. **Compare actual logs** to expected logs above  
4. **Identify where data is lost** (which step shows empty folderPermissions)
5. **Report findings** with specific log snippets

---

## Files Modified

1. `/supabase/functions/server/index.tsx` - Added folder permissions logging to beneficiary creation endpoint
2. `/supabase/functions/server/legacy-access-service.tsx` - Added detailed logging to email sending function
3. `/supabase/functions/server/index.tsx` - Added folder permissions logging to vault access validation endpoint

---

## Status: Ready for Testing 🧪

All debug logging is in place. The next test run will reveal exactly where the folder permissions data is being lost.
