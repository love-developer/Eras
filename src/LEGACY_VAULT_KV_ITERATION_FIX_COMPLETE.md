# Legacy Vault KV Iteration & Folder Permissions Fix - COMPLETE ✅

## Date: December 26, 2024

## Issues Fixed

### 1. KV Store Iteration Bug - Token Validation Endpoints
**Problem**: Three endpoints were incorrectly iterating over KV data expecting `{key, value}` objects when `getByPrefix` returns an array of values directly.

**Root Cause**: The `kv.getByPrefix()` function returns an **array of values**, not an array of `{key, value}` objects.

**Fixed Endpoints**:
1. ✅ `/api/legacy-access/log-access` (Line 10273-10307)
   - Changed from: `for (const { key, value } of unlockData)`
   - Changed to: `for (const unlockToken of unlockData)`
   - Now properly reconstructs the key: `unlock_token_${matchingTokenId}`

2. ✅ Beneficiary revoke endpoint (Line 10513-10523)
   - Changed from: `for (const { key, value: token } of allTokens)`
   - Changed to: `for (const token of allTokens)`
   - Now properly reconstructs the key: `unlock_token_${token.tokenId}`

3. ✅ Beneficiary decline endpoint (Line 9571-9597)
   - Changed from: `for (const { key, value } of beneficiaryData)`
   - Changed to: `for (const beneficiary of beneficiaryData)`
   - Now properly reconstructs the key: `legacy_beneficiary:${matchingBeneficiaryId}`

**Impact**: 
- ❌ Before: "Invalid access token" errors when beneficiaries tried to view vaults
- ❌ Before: KV Store timeout errors from incorrect iteration
- ✅ After: Beneficiaries can successfully access their designated vaults
- ✅ After: Access logging works properly
- ✅ After: Revoke/decline operations work correctly

---

### 2. Folder Permissions Not Passed to Beneficiaries
**Problem**: When creating beneficiaries with folder permissions, the permissions weren't being stored or passed to unlock tokens, causing emails to show "0 folders/0 items".

**Root Cause**: The `addBeneficiary` function wasn't accepting or storing `folderPermissions` parameter.

**Fixes Applied**:

#### A. ✅ Accept folder permissions on beneficiary creation (Line 95-136)
```typescript
export async function addBeneficiary(
  userId: string,
  beneficiaryData: {
    name: string;
    email: string;
    phone?: string;
    personalMessage?: string;
    folderPermissions?: { [folderId: string]: 'view' | 'edit' }; // ✅ NEW
  }
)
```

#### B. ✅ Store folder permissions in beneficiary record (Line 136)
```typescript
const newBeneficiary: Beneficiary = {
  id: `ben_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  name: beneficiaryData.name,
  email: beneficiaryData.email.toLowerCase(),
  // ... other fields ...
  folderPermissions: beneficiaryData.folderPermissions || {} // ✅ STORED
};
```

#### C. ✅ Copy permissions to unlock tokens (Line 692)
```typescript
const unlockToken: UnlockToken = {
  tokenId,
  userId,
  beneficiaryId: beneficiary.id,
  unlockType,
  createdAt: Date.now(),
  expiresAt: Date.now() + (100 * 365 * 24 * 60 * 60 * 1000),
  folderPermissions: beneficiary.folderPermissions || {} // ✅ COPIED TO TOKEN
};
```

**Impact**:
- ❌ Before: Beneficiary emails showed "0 folders/0 items" even when folders were selected
- ❌ Before: Beneficiaries couldn't see any content in their vault access
- ✅ After: Folder selections are preserved from creation through to vault access
- ✅ After: Emails show correct folder/item counts
- ✅ After: Beneficiaries can access exactly the folders they were granted

---

## Testing Checklist

### Token Validation
- [x] Beneficiary can validate unlock token successfully
- [x] Access logging works without "Invalid access token" errors
- [x] Token revocation works properly
- [x] Beneficiary decline flow works

### Folder Permissions
- [x] Creating beneficiary with folder permissions stores them correctly
- [x] Unlock tokens include folder permissions
- [x] Beneficiary emails show correct folder/item counts
- [x] Beneficiary vault access displays only permitted folders

---

## Files Modified

1. `/supabase/functions/server/index.tsx`
   - Line 10273-10307: Fixed log-access endpoint iteration
   - Line 10513-10523: Fixed revoke endpoint iteration
   - Line 9571-9597: Fixed decline endpoint iteration

2. `/supabase/functions/server/legacy-access-service.tsx`
   - Line 95: Added `folderPermissions` parameter to `addBeneficiary`
   - Line 136: Store `folderPermissions` in beneficiary record
   - Line 692: Copy `folderPermissions` to unlock tokens (already present)

---

## Related Endpoints (Already Fixed Previously)

These endpoints were already correctly using the proper iteration pattern:
- ✅ `/api/legacy-access/unlock/validate-full` (Line 10064-10078)
- ✅ `/api/legacy-access/folder/:folderId` (Line 10177-10189)

---

## Key Learnings

### KV Store `getByPrefix()` Behavior
```typescript
// ❌ INCORRECT (expects {key, value} objects)
const data = await kv.getByPrefix('unlock_token_');
for (const { key, value } of data) {
  // This will fail!
}

// ✅ CORRECT (array of values)
const data = await kv.getByPrefix('unlock_token_');
for (const item of data) {
  // Use item.tokenId to reconstruct key: `unlock_token_${item.tokenId}`
}
```

### Folder Permissions Flow
1. **Creation**: User selects folders when adding beneficiary
2. **Storage**: `folderPermissions` stored in `Beneficiary` object
3. **Token Generation**: When vault unlocks, permissions copied to `UnlockToken`
4. **Vault Access**: Beneficiary sees only permitted folders
5. **Email**: Counts calculated from `folderPermissions` keys

---

## Status: ✅ COMPLETE

All Legacy Vault access issues are now resolved:
- ✅ Token validation works correctly
- ✅ Folder permissions persist through entire flow
- ✅ Emails show accurate folder/item counts
- ✅ Beneficiaries can access their designated content
- ✅ No more KV Store timeout errors
- ✅ No more "Invalid access token" errors
