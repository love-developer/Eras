# Legacy Vault Folder Permissions Debug Guide

## Issue
Beneficiaries are being granted access to 1 folder (3 pics), but:
- Email shows "0 folders, 0 total items"
- Vault access page shows "0 Folders, 0 Total Items"
- Folders not displaying

## Debug Logging Added

### 1. When Unlock Email is Sent (`legacy-access-service.tsx:868-877`)
```typescript
console.log(`📧 [Phase 5] Preparing unlock email for ${beneficiary.email}`);
console.log(`🔍 [Phase 5] Beneficiary object:`, JSON.stringify(beneficiary, null, 2));
console.log(`🔍 [Phase 5] Folder permissions:`, JSON.stringify(folderPermissions, null, 2));
console.log(`🔍 [Phase 5] Loading ${Object.keys(folderPermissions).length} permitted folders individually...`);
```

### 2. When Vault Access Page Loads (`index.tsx:10104-10110`)
```typescript
console.log(`🔍 [Phase 3] Loading vault folders for owner ${ownerUserId}...`);
console.log(`📊 [Phase 3] Unlock token object:`, JSON.stringify(matchingUnlock, null, 2));
console.log(`📊 [Phase 3] Folder permissions from token:`, JSON.stringify(folderPermissions, null, 2));
console.log(`📊 [Phase 3] Beneficiary has permissions for ${Object.keys(folderPermissions).length} folders`);
```

## Testing Steps

### Step 1: Add Beneficiary with Folder Permissions
1. Go to Settings → Legacy Access
2. Add a beneficiary (e.g., "Lenny")
3. **Select 1 folder with 3 items**
4. Check server logs for beneficiary creation:
   ```
   Look for: "Adding beneficiary with folder permissions: {...}"
   ```

### Step 2: Verify Beneficiary Object Stored Correctly
Check KV store entry `legacy_access_{userId}` should contain:
```json
{
  "beneficiaries": [
    {
      "id": "ben_...",
      "name": "Lenny",
      "email": "lenny@example.com",
      "status": "pending",
      "folderPermissions": {
        "folder_abc123": "view"  // ← Should NOT be empty!
      }
    }
  ]
}
```

### Step 3: Verify Beneficiary Email & Verify
1. Beneficiary receives verification email
2. Clicks "Accept Role" button
3. Status changes to "verified"
4. **folderPermissions should persist** in beneficiary object

### Step 4: Trigger Unlock
Manually trigger unlock (or wait for inactivity):
```
Check logs for:
🔑 [Phase 5] Creating unlock token with X folder permissions
```

### Step 5: Check Unlock Token Created
Unlock token in KV store `unlock_token_{tokenId}` should contain:
```json
{
  "tokenId": "tok_...",
  "userId": "...",
  "beneficiaryId": "ben_...",
  "folderPermissions": {
    "folder_abc123": "view"  // ← Must match beneficiary permissions!
  }
}
```

### Step 6: Check Email Sent
When unlock email is sent, logs should show:
```
🔍 [Phase 5] Beneficiary object: {...}
🔍 [Phase 5] Folder permissions: {"folder_abc123": "view"}
🔍 [Phase 5] Loading 1 permitted folders individually...
  ✅ Folder: My Photos (folder_abc123), Permission: view, Items: 3
```

Expected email variables:
```json
{
  "folderCount": 1,
  "itemCount": 3,
  "folders": [
    {
      "name": "My Photos",
      "icon": "📁",
      "itemCount": 3,
      "permission": "view"
    }
  ]
}
```

### Step 7: Beneficiary Clicks Access Link
When beneficiary visits vault access page, logs should show:
```
📊 [Phase 3] Unlock token object: {...}
📊 [Phase 3] Folder permissions from token: {"folder_abc123": "view"}
📊 [Phase 3] Beneficiary has permissions for 1 folders
  ✅ Folder: My Photos (folder_abc123), Permission: view, Items: 3
✅ [Phase 3] Vault access validated: 1 folders, 3 items
```

## Common Issues & Fixes

### Issue 1: `folderPermissions` is `{}` in Beneficiary Object
**Cause**: Frontend not passing folderPermissions when adding beneficiary

**Fix**: Check frontend Settings component - ensure it's calling:
```typescript
await fetch('/api/legacy-access/beneficiaries', {
  method: 'POST',
  body: JSON.stringify({
    name: "Lenny",
    email: "lenny@example.com",
    folderPermissions: {
      "folder_abc123": "view"  // ← Must include this!
    }
  })
});
```

### Issue 2: `folderPermissions` Lost After Verification
**Cause**: Verification endpoint overwrites beneficiary object

**Fix**: Ensure `verifyBeneficiary` only updates status fields, not entire object

### Issue 3: `folderPermissions` Not Copied to Unlock Token
**Cause**: Token creation missing folderPermissions

**Already Fixed**: Line 692 in `legacy-access-service.tsx`:
```typescript
folderPermissions: beneficiary.folderPermissions || {}
```

### Issue 4: Folder Not Found in KV Store
**Symptom**: Log shows "Folder {folderId} not found in vault"

**Fix**: Check folder exists in KV as `vault_folder:{userId}:{folderId}`

### Issue 5: Folder Has No Media Items
**Symptom**: Folder found but `mediaItems` array is empty

**Fix**: Verify folder.mediaItems is properly populated when folder is created

## Next Steps If Still Broken

1. **Check the logs** - Run the flow and copy all console logs showing:
   - Beneficiary creation
   - Unlock token creation  
   - Email sending
   - Vault access validation

2. **Check KV Store** - Use admin endpoint to view:
   - `legacy_access_{userId}` - Check beneficiary.folderPermissions
   - `unlock_token_{tokenId}` - Check token.folderPermissions
   - `vault_folder:{userId}:{folderId}` - Check folder exists and has items

3. **Check Frontend** - Verify Settings component is sending folderPermissions in API call

4. **Check Email Template** - Ensure template uses {{folderCount}}, {{itemCount}}, {{folders}}

## Status

✅ Backend code fixed (KV iteration + folder permissions storage)
🔍 Debug logging added to trace the full flow
⏳ Awaiting test results to identify where data is lost
