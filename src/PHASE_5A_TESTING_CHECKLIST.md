# Phase 5A Testing Checklist

## ✅ Backend API Tests

### Share Link Creation
- [ ] Create share link with view-only permission, 24h expiry
- [ ] Create share link with download permission, 7d expiry
- [ ] Create share link with never expires option
- [ ] Create share link with password protection
- [ ] Create share link without password
- [ ] Create multiple share links for the same folder
- [ ] Verify shareId is cryptographically secure (64 chars)
- [ ] Verify share URL format is correct (`https://eras.app/s/{shareId}`)

### Share Link Validation
- [ ] Validate active share link (should succeed)
- [ ] Validate expired share link (should fail with "Share link has expired")
- [ ] Validate revoked share link (should fail with "Share link has been revoked")
- [ ] Validate with correct password (should succeed)
- [ ] Validate with wrong password (should fail with "Invalid password")
- [ ] Validate without password when required (should fail with "Password required")
- [ ] Validate non-existent share link (should fail with "Share link not found")
- [ ] Verify view count increments on each validation

### Share Link Revocation
- [ ] Revoke link as owner (should succeed)
- [ ] Attempt to revoke link as non-owner (should fail with 401)
- [ ] Attempt to revoke already-revoked link (should fail gracefully)
- [ ] Access share link after revocation (should fail)

### Folder Shares Retrieval
- [ ] Get all shares for a folder with multiple shares
- [ ] Get shares for folder with no shares (should return empty array)
- [ ] Get shares as folder owner (should succeed)
- [ ] Attempt to get shares as non-owner (should return empty or 401)
- [ ] Verify only active (non-revoked) shares are returned

### Permission Checks
- [ ] View permission allows viewing
- [ ] View permission blocks downloading
- [ ] Download permission allows both viewing and downloading
- [ ] Check expired link permission (should fail)
- [ ] Check revoked link permission (should fail)

---

## 🖥️ Frontend Desktop Tests

### Share Button & Dialog
- [ ] Share button visible on folder card hover
- [ ] Share button hidden when folder has 0 media items
- [ ] Share button click opens FolderShareManager dialog
- [ ] Dialog displays folder name correctly
- [ ] Dialog shows existing shares (if any)

### Create Share Link
- [ ] Select "View Only" permission (button shows active state)
- [ ] Select "Download" permission (button shows active state)
- [ ] Select "24 Hours" expiry
- [ ] Select "7 Days" expiry
- [ ] Select "Never" expiry
- [ ] Enable password protection checkbox
- [ ] Enter password (input field appears)
- [ ] Disable password protection (input field disappears)
- [ ] Click "Generate Share Link" (shows loading state)
- [ ] Link created successfully (toast notification appears)
- [ ] Link copied to clipboard automatically
- [ ] Active shares list updates with new link

### Active Shares List
- [ ] Displays all active share links
- [ ] Shows correct permission badge (View Only / Download)
- [ ] Shows password protected icon (🔒) when applicable
- [ ] Shows expiry information correctly
- [ ] Shows view count for each link
- [ ] Copy link button works (copies to clipboard + toast)
- [ ] Revoke button shows confirmation prompt
- [ ] Revoke succeeds and updates list

### Empty States
- [ ] Shows "No active share links yet" when folder has no shares
- [ ] Shows placeholder icon and helper text

### Validation & Error Handling
- [ ] Cannot generate link with password protection if password field is empty
- [ ] Shows error toast if backend API fails
- [ ] Shows loading spinner during link creation
- [ ] Handles network errors gracefully

---

## 📱 Frontend Mobile Tests

### Bottom Sheet Behavior
- [ ] Share button accessible on folder card
- [ ] Tapping Share opens bottom sheet (not dialog)
- [ ] Bottom sheet slides up from bottom
- [ ] Bottom sheet height is 90vh
- [ ] Bottom sheet is scrollable
- [ ] Swipe down to close works

### Mobile UI Elements
- [ ] Permission buttons are large enough (44x44px min)
- [ ] Expiry buttons are finger-friendly
- [ ] Password checkbox and input are easily tappable
- [ ] "Generate Share Link" button is full-width
- [ ] Active shares cards are easy to tap
- [ ] Copy and Revoke buttons are large enough

### Mobile-Specific Tests
- [ ] Keyboard pushes content up (doesn't cover input)
- [ ] Share list scrolls smoothly
- [ ] Toast notifications appear correctly
- [ ] Landscape mode works correctly
- [ ] Safe area insets respected (iPhone notch, etc.)

---

## 🔒 Security Tests

### Token Security
- [ ] Share tokens are 64 characters (32 bytes in hex)
- [ ] Share tokens are unique (generate 100, check for duplicates)
- [ ] Share tokens use crypto.getRandomValues (not Math.random)

### Password Security
- [ ] Passwords are hashed before storage (never plain text)
- [ ] Password hashes are consistent (same password → same hash)
- [ ] Passwords are verified correctly
- [ ] Wrong password fails validation

### Authorization
- [ ] Cannot create share without authentication
- [ ] Cannot view others' shares
- [ ] Cannot revoke others' shares
- [ ] Session expiry handled correctly

### Data Privacy
- [ ] Share link validation doesn't reveal folder contents
- [ ] Error messages don't leak sensitive info
- [ ] Revoked links don't show metadata

---

## ⚡ Performance Tests

### Backend
- [ ] Share link creation < 500ms
- [ ] Share link validation < 200ms
- [ ] Get folder shares < 300ms
- [ ] Revoke link < 200ms

### Frontend
- [ ] Dialog opens < 100ms
- [ ] Shares list renders < 200ms
- [ ] Link copy to clipboard instant
- [ ] No memory leaks with 20+ shares

### Load Testing
- [ ] Create 50 shares for same folder (should succeed)
- [ ] Validate 100 share links concurrently (should handle)
- [ ] List folder with 100 shares (UI should remain responsive)

---

## 🌐 Cross-Browser Tests

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] iOS Safari
- [ ] iOS Chrome
- [ ] Android Chrome
- [ ] Android Firefox

### Browser Features
- [ ] Clipboard API works in all browsers
- [ ] Dialog/Sheet animations smooth
- [ ] Hover states work (desktop)
- [ ] Touch interactions work (mobile)

---

## 🐛 Edge Cases

### Unusual Scenarios
- [ ] Create share while offline → online (should queue and retry)
- [ ] Revoke share while someone is viewing it
- [ ] Create share with emoji in password
- [ ] Create share with very long password (100+ chars)
- [ ] Rapidly click "Generate Share Link" 10 times (should debounce)
- [ ] Open multiple share dialogs for different folders
- [ ] Delete folder that has active shares

### Data Integrity
- [ ] Create share → refresh page → shares persist
- [ ] Revoke share → validate link → fails correctly
- [ ] Expire share naturally → validation fails at correct time
- [ ] View count increments even with page refreshes

### Network Issues
- [ ] Handle 500 Internal Server Error gracefully
- [ ] Handle 401 Unauthorized gracefully
- [ ] Handle timeout errors (20s+)
- [ ] Handle malformed API responses
- [ ] Handle CORS errors

---

## 📊 Analytics & Monitoring

### Logging
- [ ] Backend logs share creation with userId and folderId
- [ ] Backend logs validation attempts
- [ ] Backend logs revocation events
- [ ] Frontend logs errors to console
- [ ] No sensitive data (passwords, tokens) in logs

### Metrics to Track
- [ ] Total shares created per day
- [ ] Average shares per user
- [ ] Share creation success rate
- [ ] Share validation success rate
- [ ] Most common expiry option
- [ ] Percentage of shares with passwords

---

## 🎯 Acceptance Criteria

Phase 5A is considered **COMPLETE** when:

1. ✅ All backend endpoints return correct responses
2. ✅ All frontend UI tests pass on desktop
3. ✅ All frontend UI tests pass on mobile
4. ✅ All security tests pass
5. ✅ No console errors or warnings
6. ✅ Share link creation success rate > 99%
7. ✅ Average share creation time < 500ms
8. ✅ User can create, view, copy, and revoke shares without issues
9. ✅ Code is reviewed and approved
10. ✅ Documentation is updated (API docs, user guide)

---

## 🔄 Rollback Plan

If critical bugs are found:

1. Comment out share endpoints in `/supabase/functions/server/index.tsx`
2. Remove Share button from `VaultFolder.tsx`
3. Hide `FolderShareManager` component
4. Deploy hotfix
5. Investigate and fix issues
6. Re-deploy with fixes

**Data Loss Risk**: ❌ **NONE** (all share data isolated in `share_*` KV keys)

---

## 📝 Test Log

| Date | Tester | Browser/Device | Pass/Fail | Notes |
|------|--------|----------------|-----------|-------|
| | | | | |
| | | | | |
| | | | | |

---

## ✅ Sign-Off

- [ ] Backend Developer: ________________ Date: ________
- [ ] Frontend Developer: ________________ Date: ________
- [ ] QA Tester: ________________ Date: ________
- [ ] Product Owner: ________________ Date: ________

---

**Phase 5A Status**: 🟡 **IN PROGRESS**

**Next Phase**: Phase 5B - Legacy Vault Integration
