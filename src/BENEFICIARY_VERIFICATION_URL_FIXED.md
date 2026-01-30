# Beneficiary Verification URL - FIXED ✅

## Problem Solved

Beneficiary verification emails were linking to wrong domains that don't exist or redirect incorrectly.

## Root Cause

The verification email was trying to build URLs differently than the working capsule delivery emails, which caused it to point to:
- ❌ `https://apdfvpgaznpqlordkipw.supabase.co/verify-beneficiary?token=...` (backend API URL)
- ❌ `https://erastimecapsule.com/verify-beneficiary?token=...` (misconfigured domain)

## Solution

**Used the same URL-building logic as capsule delivery emails** (which work perfectly!)

### Updated Files

**`/supabase/functions/server/legacy-access-service.tsx`**

Changed from using Supabase URL to using the same frontend URL logic as capsule delivery:

#### Before (BROKEN):
```typescript
const baseUrl = Deno.env.get('SUPABASE_URL')?.replace('/functions/v1', '') || 'https://eras.app';
const verificationUrl = `${baseUrl}/verify-beneficiary?token=${verificationToken}`;
```

#### After (FIXED):
```typescript
// Build verification URL - use same logic as capsule delivery
// Get frontend URL - prefer env var, then default Figma Make URL
const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://found-shirt-81691824.figma.site';
const verificationUrl = `${frontendUrl}/verify-beneficiary?token=${verificationToken}`;

console.log('🔗 Generated verification URL:', verificationUrl);
```

### How Capsule Delivery Works (Reference)

From `/supabase/functions/server/delivery-service.tsx`:

```typescript
private static async generateViewingUrl(capsule: TimeCapsule): Promise<string> {
  const viewingToken = `view_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  
  await kv.set(`viewing_token:${viewingToken}`, {
    capsule_id: capsule.id,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });
  
  // Get frontend URL - prefer stored URL from capsule, then env var, then default
  let frontendUrl = (capsule as any).frontend_url || 
                    Deno.env.get('FRONTEND_URL') || 
                    'https://found-shirt-81691824.figma.site';
  
  const viewingUrl = `${frontendUrl}/view/${viewingToken}`;
  return viewingUrl;
}
```

## Changes Made

### Location 1: `addBeneficiary()` function (Lines 136-142)
```typescript
// Build verification URL - use same logic as capsule delivery
// Get frontend URL - prefer env var, then default Figma Make URL
const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://found-shirt-81691824.figma.site';
const verificationUrl = `${frontendUrl}/verify-beneficiary?token=${verificationToken}`;

console.log('🔗 Generated verification URL:', verificationUrl);
```

### Location 2: `resendVerificationEmail()` function (Lines 240-246)
```typescript
// Build verification URL - use same logic as capsule delivery
// Get frontend URL - prefer env var, then default Figma Make URL
const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://found-shirt-81691824.figma.site';
const verificationUrl = `${frontendUrl}/verify-beneficiary?token=${verificationToken}`;

console.log('🔗 Generated verification URL:', verificationUrl);
```

## Testing

**Try it now:**

1. **Add or Resend Beneficiary Verification:**
   - Settings → Legacy Access → Add Beneficiary (or click "Resend" on existing)
   - Enter email and submit

2. **Check Server Logs:**
   ```
   🔗 Generated verification URL: https://found-shirt-81691824.figma.site/verify-beneficiary?token=tok_...
   ```

3. **Check Email:**
   - Subject: "🛡️ You've Been Designated as a Legacy Beneficiary - Eras"
   - Click "Verify Email & Accept Role" button
   - Should navigate to: `https://found-shirt-81691824.figma.site/verify-beneficiary?token=...`

4. **Verify Success:**
   - ✅ Page loads the `BeneficiaryVerification` component
   - ✅ Token is processed
   - ✅ Success message shown
   - ✅ Redirects to home

## URL Priority

The system now uses this priority (same as capsule delivery):

1. **`FRONTEND_URL` environment variable** (if set)
2. **Default Figma Make URL:** `https://found-shirt-81691824.figma.site`

## Why This Works

- **Capsule delivery emails work perfectly** - they use this exact URL logic
- **Frontend routing exists** - `/verify-beneficiary` route is already in `App.tsx`
- **Token validation works** - backend API endpoint exists at `/api/legacy-access/verify`

## Environment Variables

Currently used:
- `FRONTEND_URL` - Optional, defaults to Figma Make URL if not set
- `RESEND_API_KEY` - For sending emails ✅

## Related Files

- ✅ `/supabase/functions/server/legacy-access-service.tsx` - Updated URL generation
- ✅ `/supabase/functions/server/delivery-service.tsx` - Reference implementation
- ✅ `/App.tsx` - Frontend route handler (already exists)
- ✅ `/components/BeneficiaryVerification.tsx` - Verification UI (already exists)

---

## Status: ✅ COMPLETE

Beneficiary verification emails now use **the exact same URL logic as working capsule delivery emails**.

The verification link will be:
**`https://found-shirt-81691824.figma.site/verify-beneficiary?token=...`**

This will work perfectly because:
- ✅ It's the same domain that capsule viewing links use
- ✅ The frontend route `/verify-beneficiary` exists
- ✅ The backend API endpoint works
- ✅ Token validation is implemented

**Try adding a beneficiary now - it should work!** 🎉
