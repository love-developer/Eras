# 🧪 PHASE 1 - Email Infrastructure Testing

## ✅ PHASE 1 COMPLETE!

### What Was Built:
1. ✅ Email template: `beneficiary-verification.html`
2. ✅ Email template: `beneficiary-unlock-notification.html`
3. ✅ Rendering function: `renderBeneficiaryVerification()`
4. ✅ Rendering function: `renderBeneficiaryUnlockNotification()`
5. ✅ Updated TypeScript types in `sendEmail()`
6. ✅ Test endpoint: `/api/legacy-access/test-email`

---

## 🧪 HOW TO TEST

### Test Verification Email

**Using cURL:**
```bash
curl -X POST \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-access/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "verification",
    "recipientEmail": "your-test-email@example.com"
  }'
```

**Using Postman/Insomnia:**
- Method: `POST`
- URL: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-access/test-email`
- Headers:
  - `Content-Type: application/json`
- Body (JSON):
  ```json
  {
    "type": "verification",
    "recipientEmail": "your-test-email@example.com"
  }
  ```

---

### Test Unlock Notification Email

**Using cURL:**
```bash
curl -X POST \
  https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-access/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "unlock",
    "recipientEmail": "your-test-email@example.com"
  }'
```

**Using Postman/Insomnia:**
- Method: `POST`
- URL: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-access/test-email`
- Headers:
  - `Content-Type: application/json`
- Body (JSON):
  ```json
  {
    "type": "unlock",
    "recipientEmail": "your-test-email@example.com"
  }
  ```

---

## ✅ SUCCESS CRITERIA

### For Verification Email:
- [ ] Email arrives in inbox within 1 minute
- [ ] Subject line: "🛡️ You've Been Designated as a Legacy Beneficiary - Eras"
- [ ] Email displays correctly in Gmail
- [ ] Email displays correctly in Outlook
- [ ] Email displays correctly in Apple Mail
- [ ] "Verify My Email" button is clickable
- [ ] All text is readable (good contrast)
- [ ] Mobile responsive (check on phone)
- [ ] Purple/pink gradient header displays correctly
- [ ] Personal message section appears
- [ ] Decline link is present

### For Unlock Notification Email:
- [ ] Email arrives in inbox within 1 minute
- [ ] Subject line: "🔓 A Legacy Vault Has Been Unlocked for You - Eras"
- [ ] Email displays correctly in Gmail
- [ ] Email displays correctly in Outlook
- [ ] Email displays correctly in Apple Mail
- [ ] "Access Vault" button is clickable
- [ ] Folder preview list displays correctly
- [ ] Permission badges show (View Only, Download, Full Access)
- [ ] All stats display (folder count, media count, etc.)
- [ ] Mobile responsive (check on phone)
- [ ] Green/blue gradient header displays correctly
- [ ] Security notice is visible

---

## 🐛 TROUBLESHOOTING

### Email Not Arriving:
1. Check spam/junk folder
2. Check Supabase logs for errors:
   ```bash
   supabase functions logs make-server-f9be53a7 --tail
   ```
3. Verify RESEND_API_KEY is set
4. Check API response for error messages

### Email Looks Broken:
1. Check specific email client (Gmail vs Outlook behave differently)
2. Verify HTML tables are rendering (email clients don't support modern CSS)
3. Test on both desktop and mobile
4. Check browser console for errors

### API Returns Error:
1. Check request body is valid JSON
2. Verify endpoint URL is correct
3. Check that `type` is either "verification" or "unlock"
4. Check Supabase function is deployed and running

---

## 📊 EXPECTED API RESPONSES

### Success Response:
```json
{
  "success": true,
  "message": "verification email sent to test@example.com",
  "messageId": "abc123..."
}
```

### Error Response:
```json
{
  "error": "recipientEmail is required"
}
```

---

## 🔄 NEXT STEPS AFTER PHASE 1

Once all tests pass:
1. ✅ Mark Phase 1 as complete
2. 📝 Document any issues found
3. 🚀 Proceed to Phase 2: Beneficiary Verification Page
4. 🔒 Keep test endpoint available for regression testing

---

## 🛡️ SAFETY NOTES

- ✅ Test endpoint has NO authentication (for easy testing)
- ⚠️ Only send test emails to your own email addresses
- ⚠️ Do NOT enable auto-sending yet (that's Phase 7)
- ✅ This is isolated from production users
- ✅ No database writes occur
- ✅ No real beneficiaries are affected

---

**Ready for Phase 2?** Only proceed when all Phase 1 success criteria are met! 🎯
