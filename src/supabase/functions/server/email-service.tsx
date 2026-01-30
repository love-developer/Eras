import { Resend } from 'npm:resend@4.0.0';
import { resendRateLimiter } from './rate-limiter.tsx';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

// Get verified "from" email from environment variable
// Default to Resend test domain for development
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'Eras <onboarding@resend.dev>';

console.log(`📧 [Email Service] Using FROM_EMAIL: ${FROM_EMAIL}`);

// Email template renderers
async function renderInactivityWarning(vars: any): Promise<string> {
  const beneficiariesSection = vars.hasBeneficiaries
    ? `
      <div style="background: rgba(168,85,247,0.15); border-left: 4px solid #a855f7; padding: 20px; margin: 24px 0; border-radius: 8px;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #e9d5ff; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Your Beneficiaries</h3>
        <div style="color: #e2e8f0; font-size: 14px; line-height: 1.8;">
          ${vars.beneficiaries.map((email: string) => `
            <div style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
              📧 ${email}
            </div>
          `).join('')}
        </div>
      </div>
    `
    : `
      <div style="background: rgba(234,179,8,0.15); border-left: 4px solid #eab308; padding: 20px; margin: 24px 0; border-radius: 8px;">
        <p style="margin: 0; font-size: 14px; color: #fef08a; line-height: 1.6;">
          ⚠️ <strong>No beneficiaries set.</strong> If your account becomes inactive, no one will have access to your memories. Consider adding beneficiaries in your settings.
        </p>
      </div>
    `;

  const daysText = vars.daysUntilInactive === 1 ? 'DAY' : 'DAYS';

  // Try to read the template file, fall back to inline template
  let html = '';
  
  try {
    const templatePath = new URL('../../../email-templates/inactivity-warning.html', import.meta.url);
    html = await Deno.readTextFile(templatePath);
  } catch (error) {
    console.warn('⚠️ Template file not found, using inline template:', error.message);
    // Inline fallback template
    html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Inactivity Warning - Eras</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">⚠️ Account Inactivity Warning</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                Hi {{userName}},
              </p>
              
              <p style="margin: 0 0 20px 0; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                We noticed you haven't logged into your Eras account in <strong>{{daysSinceLastLogin}} days</strong> (last login: {{lastLoginDate}}).
              </p>
              
              <div style="background: rgba(239,68,68,0.15); border-left: 4px solid #ef4444; padding: 20px; margin: 24px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #fca5a5; font-weight: 600;">⏰ ACTION REQUIRED</h3>
                <p style="margin: 0; font-size: 15px; color: #fecaca; line-height: 1.6;">
                  Your account will become inactive in <strong>{{daysUntilInactive}} {{daysText}}</strong> if you don't log in.
                </p>
              </div>
              
              {{beneficiariesSection}}
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://found-shirt-81691824.figma.site/login" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Log In to Your Account
                </a>
              </div>
              
              <p style="margin: 24px 0 0 0; color: #94a3b8; font-size: 14px; line-height: 1.6; text-align: center;">
                Questions? Visit your <a href="{{settingsUrl}}" style="color: #a855f7; text-decoration: none;">Legacy Access Settings</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                © 2026 Eras. Capture Today, Unlock Tomorrow
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  // Replace all variables
  html = html
    .replace(/{{userName}}/g, vars.userName)
    .replace(/{{daysSinceLastLogin}}/g, vars.daysSinceLastLogin)
    .replace(/{{daysUntilInactive}}/g, vars.daysUntilInactive)
    .replace(/{{daysText}}/g, daysText)
    .replace(/{{beneficiariesSection}}/g, beneficiariesSection)
    .replace(/{{loginUrl}}/g, vars.loginUrl)
    .replace(/{{settingsUrl}}/g, vars.settingsUrl)
    .replace(/{{lastLoginDate}}/g, vars.lastLoginDate)
    .replace(/© 2026 Eras/g, '© 2025 Eras');

  return html;
}

async function renderBeneficiaryVerification(vars: any): Promise<string> {
  const personalMessageSection = vars.personalMessage
    ? `
      <div style="background: rgba(236,72,153,0.15); border-left: 4px solid #ec4899; padding: 20px; margin: 24px 0; border-radius: 8px;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #fce7f3; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">${vars.userName}'s Message to You</h3>
        <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #fce7f3; font-style: italic;">
          "${vars.personalMessage}"
        </p>
      </div>
    `
    : '';

  // ✅ Dynamic expiration notice based on context
  let expirationNotice = '';
  if (vars.expirationDays === null || vars.expirationDays === undefined || vars.expirationDays === 0) {
    // Unlock notification - never expires
    expirationNotice = `
      <div style="background: rgba(99,102,241,0.1); border-left: 4px solid #6366f1; padding: 16px; margin: 24px 0; border-radius: 8px;">
        <p style="margin: 0; color: #c7d2fe; font-size: 14px; line-height: 1.6;">
          ✨ <strong>No Rush:</strong> This verification link never expires. You can verify your email anytime - ${vars.userName}'s legacy vault is waiting for you.
        </p>
      </div>
    `;
  } else if (vars.expirationDays === 30) {
    // Immediate notification - 30 days
    expirationNotice = `
      <div style="background: rgba(248,113,113,0.1); border-left: 4px solid #f87171; padding: 16px; margin: 24px 0; border-radius: 8px;">
        <p style="margin: 0; color: #fca5a5; font-size: 14px; line-height: 1.6;">
          ⏰ <strong>Important:</strong> This verification link expires in 30 days. Please verify soon to accept this responsibility.
        </p>
      </div>
    `;
  } else {
    // Manual resend - 14 days (or other custom period)
    expirationNotice = `
      <div style="background: rgba(248,113,113,0.1); border-left: 4px solid #f87171; padding: 16px; margin: 24px 0; border-radius: 8px;">
        <p style="margin: 0; color: #fca5a5; font-size: 14px; line-height: 1.6;">
          ⏰ <strong>Important:</strong> This verification link expires in ${vars.expirationDays} days. Please verify soon to accept this responsibility.
        </p>
      </div>
    `;
  }

  // Try to read the template file, fall back to inline template
  let html = '';
  
  try {
    const templatePath = new URL('../../../email-templates/beneficiary-verification.html', import.meta.url);
    html = await Deno.readTextFile(templatePath);
  } catch (error) {
    console.warn('⚠️ Template file not found, using inline template:', error.message);
    // Inline fallback template
    html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Legacy Beneficiary Verification - Eras</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: #6366f1; padding: 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🛡️</div>
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">You've Been Designated as a Legacy Beneficiary</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">{{userName}} has chosen you to protect their digital memories</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                Hi {{beneficiaryName}},
              </p>
              
              <p style="margin: 0 0 20px 0; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                <strong>{{userName}}</strong> has designated you as a beneficiary for their Eras Legacy Vault. This is a significant responsibility — if they become inactive, you'll gain access to precious memories they want preserved.
              </p>
              
              <div style="background: rgba(99,102,241,0.15); border-left: 4px solid #6366f1; padding: 20px; margin: 24px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #c7d2fe; font-weight: 600;">What This Means</h3>
                <ul style="margin: 0; padding-left: 20px; color: #e2e8f0; font-size: 15px; line-height: 1.8;">
                  <li>You're trusted to preserve their digital legacy</li>
                  <li>You'll only gain access if they become inactive (based on their settings)</li>
                  <li>You must verify your email to accept this role</li>
                  <li>You can decline at any time</li>
                </ul>
              </div>
              
              {{personalMessageSection}}
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{verificationUrl}}" style="display: inline-block; background: #6366f1; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Verify Email & Accept Role
                </a>
              </div>
              
              {{expirationNotice}}
              
              <p style="margin: 24px 0 0 0; color: #94a3b8; font-size: 14px; line-height: 1.6; text-align: center;">
                Designated on {{designatedDate}}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                © 2026 Eras. Capture Today, Unlock Tomorrow
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  html = html
    .replace(/{{beneficiaryName}}/g, vars.beneficiaryName || vars.beneficiaryEmail.split('@')[0])
    .replace(/{{beneficiaryEmail}}/g, vars.beneficiaryEmail)
    .replace(/{{userName}}/g, vars.userName)
    .replace(/{{personalMessageSection}}/g, personalMessageSection)
    .replace(/{{expirationNotice}}/g, expirationNotice)
    .replace(/{{verificationUrl}}/g, vars.verificationUrl)
    .replace(/{{declineUrl}}/g, vars.declineUrl || '#')
    .replace(/{{designatedDate}}/g, vars.designatedDate)
    .replace(/© 2026 Eras/g, '© 2025 Eras');

  return html;
}

// Beneficiary verification AT UNLOCK email (deferred verification sent when vault unlocks)
async function renderBeneficiaryVerificationAtUnlock(vars: any): Promise<string> {
  const personalMessageSection = vars.personalMessage
    ? `
      <div style="background: rgba(236,72,153,0.15); border-left: 4px solid #ec4899; padding: 20px; margin: 24px 0; border-radius: 8px;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #fce7f3; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">${vars.userName}'s Message to You</h3>
        <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #fce7f3; font-style: italic;">
          "${vars.personalMessage}"
        </p>
      </div>
    `
    : '';

  // Refined inline template matching other Eras templates
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Legacy Vault Unlocked - Verification Required - Eras</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); padding: 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🔓</div>
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">Legacy Vault Unlocked</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Verification Required to Access</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                Hi {{beneficiaryName}},
              </p>
              
              <p style="margin: 0 0 20px 0; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                <strong>{{userName}}'s Legacy Vault has been unlocked.</strong> As a designated beneficiary, you now have access to their precious memories and time capsules.
              </p>
              
              <div style="background: rgba(168,85,247,0.15); border-left: 4px solid #a855f7; padding: 20px; margin: 24px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #e9d5ff; font-weight: 600;">🔐 Action Required</h3>
                <p style="margin: 0; color: #e2e8f0; font-size: 15px; line-height: 1.7;">
                  To protect {{userName}}'s privacy, you must verify your email address before accessing the vault. This ensures that only trusted beneficiaries can view these memories.
                </p>
              </div>
              
              {{personalMessageSection}}
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{verificationUrl}}" style="display: inline-block; background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(168,85,247,0.4);">
                  Verify Email & Access Vault
                </a>
              </div>
              
              <div style="background: rgba(99,102,241,0.1); border-left: 4px solid #6366f1; padding: 16px; margin: 24px 0; border-radius: 8px;">
                <p style="margin: 0; color: #c7d2fe; font-size: 14px; line-height: 1.6;">
                  ✨ <strong>No Rush:</strong> This verification link never expires. You can verify your email anytime — {{userName}}'s legacy vault is waiting for you.
                </p>
              </div>
              
              <div style="background: rgba(59,130,246,0.1); border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 8px;">
                <p style="margin: 0; color: #93c5fd; font-size: 14px; line-height: 1.6;">
                  🔒 <strong>Privacy & Security:</strong><br>
                  • Your access is logged for transparency<br>
                  • All vault content is read-only<br>
                  • Only verified beneficiaries can view memories
                </p>
              </div>
              
              <p style="margin: 24px 0 0 0; color: #94a3b8; font-size: 14px; line-height: 1.6; text-align: center;">
                Vault unlocked on {{unlockDate}}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                © 2025 Eras. Capture Today, Unlock Tomorrow
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return html
    .replace(/{{beneficiaryName}}/g, vars.beneficiaryName || vars.beneficiaryEmail.split('@')[0])
    .replace(/{{beneficiaryEmail}}/g, vars.beneficiaryEmail)
    .replace(/{{userName}}/g, vars.userName)
    .replace(/{{personalMessageSection}}/g, personalMessageSection)
    .replace(/{{verificationUrl}}/g, vars.verificationUrl)
    .replace(/{{designatedDate}}/g, vars.designatedDate)
    .replace(/{{unlockDate}}/g, vars.unlockDate)
    .replace(/{{unlockContext}}/g, vars.unlockContext || '');
}

// Beneficiary verification CONFIRMATION email (sent after successful verification)
async function renderBeneficiaryVerificationConfirmation(vars: any): Promise<string> {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Beneficiary Role Confirmed - Eras</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: #10b981; padding: 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">Email Verified Successfully!</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">You're now confirmed as a legacy beneficiary</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                Hi {{beneficiaryName}},
              </p>
              
              <p style="margin: 0 0 20px 0; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                Thank you for verifying your email. You are now confirmed as a legacy beneficiary for <strong>{{userName}}'s</strong> Eras account.
              </p>
              
              <div style="background: rgba(16,185,129,0.15); border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #6ee7b7; font-weight: 600;">🛡️ Your Role & Responsibilities</h3>
                <ul style="margin: 0; padding-left: 20px; color: #e2e8f0; font-size: 15px; line-height: 1.8;">
                  <li><strong>Right now:</strong> Nothing changes. {{userName}} still has full control of their account.</li>
                  <li><strong>If inactive:</strong> You'll be notified and granted access to view their time capsules and vault.</li>
                  <li><strong>Your privacy:</strong> {{userName}} cannot see if/when you access their content.</li>
                  <li><strong>Your choice:</strong> You can remove yourself from this role at any time from your account settings.</li>
                </ul>
              </div>
              
              <div style="background: rgba(59,130,246,0.1); border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 8px;">
                <p style="margin: 0; color: #93c5fd; font-size: 14px; line-height: 1.6;">
                  💡 <strong>What happens next?</strong><br>
                  You'll receive an email notification if {{userName}}'s account becomes inactive based on their configured settings. At that time, you'll be granted access to their vault.
                </p>
              </div>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{homeUrl}}" style="display: inline-block; background: #6366f1; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Go to Eras
                </a>
              </div>
              
              <p style="margin: 24px 0 0 0; color: #94a3b8; font-size: 14px; line-height: 1.6; text-align: center;">
                Verified on {{verifiedDate}}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                © 2026 Eras. Capture Today, Unlock Tomorrow
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return html
    .replace(/{{beneficiaryName}}/g, vars.beneficiaryName || vars.beneficiaryEmail.split('@')[0])
    .replace(/{{beneficiaryEmail}}/g, vars.beneficiaryEmail)
    .replace(/{{userName}}/g, vars.userName)
    .replace(/{{homeUrl}}/g, vars.homeUrl || 'https://found-shirt-81691824.figma.site')
    .replace(/{{verifiedDate}}/g, vars.verifiedDate)
    .replace(/© 2026 Eras/g, '© 2025 Eras');
}

// ✅ NEW: Beneficiary verification REMINDER email (sent at days 7, 14, 30 after unlock)
async function renderBeneficiaryVerificationReminder(vars: any): Promise<string> {
  const reminderMessages = {
    1: {
      urgency: 'low',
      color: '#3b82f6',
      message: 'This is a friendly reminder to verify your email and accept your role as a legacy beneficiary.'
    },
    2: {
      urgency: 'medium',
      color: '#f59e0b',
      message: 'We noticed you haven\'t verified your email yet. Please take a moment to complete this important step.'
    },
    3: {
      urgency: 'high',
      color: '#ef4444',
      message: 'This is the final reminder. Please verify your email as soon as possible to ensure you can access the vault when needed.'
    }
  };

  const reminder = reminderMessages[vars.reminderNumber as 1 | 2 | 3] || reminderMessages[1];
  
  const personalMessageSection = vars.personalMessage
    ? `
      <div style="background: rgba(236,72,153,0.15); border-left: 4px solid #ec4899; padding: 20px; margin: 24px 0; border-radius: 8px;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #fce7f3; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">${vars.userName}'s Message to You</h3>
        <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #fce7f3; font-style: italic;">
          "${vars.personalMessage}"
        </p>
      </div>
    `
    : '';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reminder: Verify Your Legacy Beneficiary Role - Eras</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: ${reminder.color}; padding: 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">⏰</div>
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">Reminder: Verify Your Email</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Legacy Beneficiary Role - Reminder #${vars.reminderNumber}</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                Hi ${vars.beneficiaryName},
              </p>
              
              <p style="margin: 0 0 20px 0; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                ${reminder.message}
              </p>
              
              <div style="background: rgba(${reminder.urgency === 'low' ? '59,130,246' : reminder.urgency === 'medium' ? '245,158,11' : '239,68,68'},0.15); border-left: 4px solid ${reminder.color}; padding: 20px; margin: 24px 0; border-radius: 8px;">
                <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #e2e8f0; font-weight: 600;">📋 Quick Summary</h3>
                <ul style="margin: 0; padding-left: 20px; color: #e2e8f0; font-size: 15px; line-height: 1.8;">
                  <li><strong>${vars.userName}'s vault has been unlocked</strong> (${vars.daysSinceUnlock} days ago)</li>
                  <li>You were designated as a legacy beneficiary</li>
                  <li>You need to verify your email to access the vault</li>
                  <li><strong>No expiration</strong> - Verify anytime, no deadline</li>
                </ul>
              </div>
              
              ${personalMessageSection}
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${vars.verificationUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Verify Email & Access Vault
                </a>
              </div>
              
              ${vars.isFinalReminder ? `
              <div style="background: rgba(239,68,68,0.1); border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 8px;">
                <p style="margin: 0; color: #fca5a5; font-size: 14px; line-height: 1.6;">
                  ⚠️ <strong>This is the final automated reminder.</strong> You can still verify anytime - there's no deadline. However, ${vars.userName} trusted you with this important responsibility. Please complete verification when you have a moment.
                </p>
              </div>
              ` : ''}
              
              <p style="margin: 24px 0 0 0; color: #94a3b8; font-size: 14px; line-height: 1.6; text-align: center;">
                You can verify your email anytime - this link never expires
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                © 2026 Eras. Capture Today, Unlock Tomorrow
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return html.replace(/© 2026 Eras/g, '© 2025 Eras');
}

async function renderBeneficiaryUnlockNotification(vars: any): Promise<string> {
  // Build folders preview
  let foldersPreview = '';
  if (vars.folders && vars.folders.length > 0) {
    foldersPreview = vars.folders.map((folder: any) => {
      const permissionBadge = folder.permission === 'view' 
        ? '👁️ View Only' 
        : folder.permission === 'download' 
        ? '⬇️ Download' 
        : '🔓 Full Access';
      
      return `
        <div style="background: rgba(59,130,246,0.1); border-left: 3px solid #3b82f6; padding: 12px 16px; margin-bottom: 8px; border-radius: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span style="font-size: 18px; margin-right: 8px;">${folder.icon || '📁'}</span>
              <strong style="color: white; font-size: 15px;">${folder.name}</strong>
              <span style="color: #94a3b8; font-size: 13px; margin-left: 8px;">${folder.itemCount || 0} items</span>
            </div>
            <div style="background: rgba(59,130,246,0.3); padding: 4px 12px; border-radius: 4px; font-size: 12px; color: #93c5fd;">
              ${permissionBadge}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Try to read template, fall back to inline version
  let html = '';
  try {
    const templatePath = new URL('../../../email-templates/beneficiary-unlock-notification.html', import.meta.url);
    html = await Deno.readTextFile(templatePath);
  } catch (error) {
    console.warn('⚠️ Template file not found, using inline template for unlock notification');
    // Fallback to basic template if file not found
    html = `<!DOCTYPE html><html><body>{{beneficiaryName}}, you have access to {{userName}}'s vault. <a href="{{accessUrl}}">Access Now</a></body></html>`;
  }

  html = html
    .replace(/{{beneficiaryName}}/g, vars.beneficiaryName || vars.beneficiaryEmail.split('@')[0])
    .replace(/{{beneficiaryEmail}}/g, vars.beneficiaryEmail)
    .replace(/{{userName}}/g, vars.userName)
    .replace(/{{inactivityDays}}/g, vars.inactivityDays)
    .replace(/{{folderCount}}/g, vars.folderCount || 0)
    .replace(/{{mediaCount}}/g, vars.mediaCount || 0)
    .replace(/{{foldersPreview}}/g, foldersPreview)
    .replace(/{{accessUrl}}/g, vars.accessUrl)
    .replace(/{{expirationDate}}/g, vars.expirationDate)
    .replace(/{{inactiveDate}}/g, vars.inactiveDate);

  return html;
}

// PHASE 4: Enhanced unlock notification with complete template
async function renderBeneficiaryUnlockNotificationComplete(vars: any): Promise<string> {
  // Build folders section with proper HTML
  let foldersSection = '';
  if (vars.folders && vars.folders.length > 0) {
    const folderRows = vars.folders.map((folder: any) => {
      let permissionBadge = '';
      if (folder.permission === 'view') {
        permissionBadge = '<span style="display: inline-block; padding: 4px 10px; background-color: rgba(59, 130, 246, 0.2); color: #60a5fa; border-radius: 6px; font-size: 11px; font-weight: 600;">👁️ VIEW</span>';
      } else if (folder.permission === 'download') {
        permissionBadge = '<span style="display: inline-block; padding: 4px 10px; background-color: rgba(16, 185, 129, 0.2); color: #34d399; border-radius: 6px; font-size: 11px; font-weight: 600;">⬇️ DOWNLOAD</span>';
      } else if (folder.permission === 'full') {
        permissionBadge = '<span style="display: inline-block; padding: 4px 10px; background-color: rgba(168, 85, 247, 0.2); color: #a855f7; border-radius: 6px; font-size: 11px; font-weight: 600;">🔓 FULL</span>';
      }

      return `
        <tr>
          <td style="padding: 12px; background-color: rgba(30, 41, 59, 0.5); border: 1px solid #334155; border-radius: 8px; margin-bottom: 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="40" valign="middle">
                  <span style="font-size: 24px;">${folder.icon || '📁'}</span>
                </td>
                <td valign="middle" style="padding-left: 12px;">
                  <div style="font-size: 15px; font-weight: 600; color: #e2e8f0; margin-bottom: 2px;">${folder.name}</div>
                  <div style="font-size: 13px; color: #94a3b8;">${folder.itemCount || 0} items • ${folder.permission}</div>
                </td>
                <td width="80" align="right" valign="middle">
                  ${permissionBadge}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr><td style="height: 8px;"></td></tr>
      `;
    }).join('');

    foldersSection = `
      <div style="margin: 30px 0;">
        <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #e2e8f0;">
          What's Inside
        </h3>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${folderRows}
        </table>
      </div>
    `;
  }

  // Personal message section
  let personalMessageSection = '';
  if (vars.personalMessage) {
    personalMessageSection = `
      <tr>
        <td style="padding: 30px; background: linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%); border-bottom: 1px solid rgba(168, 85, 247, 0.2);">
          <div style="text-align: center;">
            <div style="font-size: 24px; margin-bottom: 12px;">💌</div>
            <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #f472b6;">
              Personal Message
            </h3>
            <p style="margin: 0; font-size: 15px; font-style: italic; color: #cbd5e1; line-height: 1.6;">
              "${vars.personalMessage}"
            </p>
          </div>
        </td>
      </tr>
    `;
  }

  // Try to read the template file, fall back to inline template
  let html = '';
  
  try {
    const templatePath = new URL('../../../email-templates/beneficiary-unlock-notification-complete.html', import.meta.url);
    html = await Deno.readTextFile(templatePath);
  } catch (error) {
    console.warn('⚠️ Template file not found, using inline template:', error.message);
    // Inline fallback template
    html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Legacy Vault Unlocked - Eras</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 40px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🔓</div>
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">Legacy Vault Unlocked</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">{{ownerName}}'s memories are now accessible</p>
            </td>
          </tr>
          
          {{#if personalMessage}}
          {{/if}}
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                Hi {{beneficiaryName}},
              </p>
              
              <p style="margin: 0 0 20px 0; color: #e2e8f0; font-size: 16px; line-height: 1.6;">
                You have been granted access to <strong>{{ownerName}}'s Legacy Vault</strong>. This is a collection of precious memories they wanted to preserve and share with you.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{accessUrl}}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                  Access Legacy Vault
                </a>
              </div>
              
              <div style="background: rgba(59,130,246,0.1); border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 8px;">
                <p style="margin: 0; color: #93c5fd; font-size: 14px; line-height: 1.6;">
                  🔒 <strong>Security & Privacy:</strong><br>
                  • Your access is logged for transparency<br>
                  • Downloads are private<br>
                  • The vault is read-only - content cannot be modified
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                © 2026 Eras. Capture Today, Unlock Tomorrow
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  html = html
    .replace(/{{ownerName}}/g, vars.ownerName || vars.userName)
    .replace(/{{beneficiaryName}}/g, vars.beneficiaryName || vars.beneficiaryEmail.split('@')[0])
    .replace(/{{beneficiaryEmail}}/g, vars.beneficiaryEmail)
    .replace(/{{inactivityDays}}/g, vars.inactivityDays || '90')
    .replace(/{{folderCount}}/g, String(vars.folderCount || 0))
    .replace(/{{itemCount}}/g, String(vars.itemCount || vars.mediaCount || 0))
    .replace(/{{accessUrl}}/g, vars.accessUrl)
    .replace(/{{expirationDate}}/g, vars.expirationDate)
    .replace(/{{#if personalMessage}}[\s\S]*?{{\/if}}/g, personalMessageSection)
    .replace(/{{#if folders}}[\s\S]*?{{\/if}}/g, foldersSection);

  return html;
}

async function renderFolderShareInvitation(vars: any): Promise<string> {
  const folderDescriptionSection = vars.folderDescription
    ? `
      <p style="margin: 16px 0 0 0; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 14px; line-height: 1.6; color: #e2e8f0; font-style: italic;">
        "${vars.folderDescription}"
      </p>
    `
    : '';

  const personalMessageSection = vars.personalMessage
    ? `
      <div style="background: rgba(236,72,153,0.15); border-left: 4px solid #ec4899; padding: 20px; margin: 24px 0; border-radius: 8px;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #fce7f3; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Message from ${vars.userName}</h3>
        <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #fce7f3; font-style: italic;">
          "${vars.personalMessage}"
        </p>
      </div>
    `
    : '';

  // Build content stats columns
  const contentColumns = [];
  if (vars.photoCount > 0) {
    contentColumns.push(`
      <td width="33%" style="padding: 4px;">
        <div style="text-align: center; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px;">
          <div style="font-size: 24px; margin-bottom: 4px;">📸</div>
          <div style="font-size: 18px; font-weight: 600; color: white;">${vars.photoCount}</div>
          <div style="font-size: 11px; color: #e9d5ff;">Photos</div>
        </div>
      </td>
    `);
  }
  if (vars.videoCount > 0) {
    contentColumns.push(`
      <td width="33%" style="padding: 4px;">
        <div style="text-align: center; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px;">
          <div style="font-size: 24px; margin-bottom: 4px;">🎥</div>
          <div style="font-size: 18px; font-weight: 600; color: white;">${vars.videoCount}</div>
          <div style="font-size: 11px; color: #e9d5ff;">Videos</div>
        </div>
      </td>
    `);
  }
  if (vars.audioCount > 0) {
    contentColumns.push(`
      <td width="33%" style="padding: 4px;">
        <div style="text-align: center; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px;">
          <div style="font-size: 24px; margin-bottom: 4px;">🎵</div>
          <div style="font-size: 18px; font-weight: 600; color: white;">${vars.audioCount}</div>
          <div style="font-size: 11px; color: #e9d5ff;">Audio</div>
        </div>
      </td>
    `);
  }

  const contentStatsColumns = contentColumns.join('');

  // Permission description
  let permissionDescription = '';
  if (vars.permission === 'View') {
    permissionDescription = '👁️ <strong style="color: white;">View Only</strong> — You can view all content in this folder but cannot make changes.';
  } else if (vars.permission === 'Edit') {
    permissionDescription = '✏️ <strong style="color: white;">Edit</strong> — You can view, add, and remove items from this folder.';
  } else {
    permissionDescription = '👥 <strong style="color: white;">Full Access</strong> — You can view, edit, and manage sharing for this folder.';
  }

  const itemsText = vars.itemCount === 1 ? 'item' : 'items';

  // Try to read the template file, fall back to inline template
  let html = '';
  
  try {
    const templatePath = new URL('../../../email-templates/folder-share-invitation.html', import.meta.url);
    html = await Deno.readTextFile(templatePath);
  } catch (error) {
    console.warn('⚠️ Template file not found, using inline template:', error.message);
    // Inline fallback template - folder sharing is not currently implemented in production
    // This is a placeholder for future use
    html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Folder Shared - Eras</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="background: #6366f1; padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">Folder Shared With You</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0; color: #e2e8f0; font-size: 16px;">
                {{userName}} has shared a folder with you.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  html = html
    .replace(/{{recipientEmail}}/g, vars.recipientEmail)
    .replace(/{{userName}}/g, vars.userName)
    .replace(/{{userEmail}}/g, vars.userEmail)
    .replace(/{{folderName}}/g, vars.folderName)
    .replace(/{{folderIcon}}/g, vars.folderIcon)
    .replace(/{{itemCount}}/g, vars.itemCount)
    .replace(/{{itemsText}}/g, itemsText)
    .replace(/{{permission}}/g, vars.permission)
    .replace(/{{folderDescriptionSection}}/g, folderDescriptionSection)
    .replace(/{{contentStatsColumns}}/g, contentStatsColumns)
    .replace(/{{permissionDescription}}/g, permissionDescription)
    .replace(/{{personalMessageSection}}/g, personalMessageSection)
    .replace(/{{shareUrl}}/g, vars.shareUrl)
    .replace(/{{shareDate}}/g, vars.shareDate);

  return html;
}

// Main email sending function
export async function sendEmail(params: {
  to: string;
  subject: string;
  template: 'inactivity-warning' | 'folder-share-invitation' | 'beneficiary-verification' | 'beneficiary-verification-at-unlock' | 'beneficiary-verification-confirmation' | 'beneficiary-unlock-notification' | 'beneficiary-unlock-notification-complete' | 'beneficiary-verification-reminder';
  variables: any;
}) {
  try {
    let html = '';

    // Render the appropriate template
    switch (params.template) {
      case 'inactivity-warning':
        html = await renderInactivityWarning(params.variables);
        break;
      case 'folder-share-invitation':
        html = await renderFolderShareInvitation(params.variables);
        break;
      case 'beneficiary-verification':
        html = await renderBeneficiaryVerification(params.variables);
        break;
      case 'beneficiary-verification-at-unlock':
        html = await renderBeneficiaryVerificationAtUnlock(params.variables);
        break;
      case 'beneficiary-verification-confirmation':
        html = await renderBeneficiaryVerificationConfirmation(params.variables);
        break;
      case 'beneficiary-unlock-notification':
        html = await renderBeneficiaryUnlockNotification(params.variables);
        break;
      case 'beneficiary-unlock-notification-complete':
        html = await renderBeneficiaryUnlockNotificationComplete(params.variables);
        break;
      case 'beneficiary-verification-reminder':
        html = await renderBeneficiaryVerificationReminder(params.variables);
        break;
      default:
        throw new Error(`Unknown template: ${params.template}`);
    }

    // RATE LIMIT: Wait for rate limiter before sending
    await resendRateLimiter.waitForNextSlot();
    
    // ✅ Generate plain text version from HTML for better deliverability
    const plainText = html
      .replace(/<style[^>]*>.*?<\/style>/gs, '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
    
    // Send email via Resend
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: html,
      text: plainText, // ✅ Plain text version added
      headers: {
        'List-Unsubscribe': '<mailto:unsubscribe@yourdomain.com>' // ✅ Required for inbox placement
      }
    });

    console.log(`📧 [Email Service] Resend API response:`, JSON.stringify(result, null, 2));
    console.log(`📧 [Email Service] Result type:`, typeof result);
    console.log(`📧 [Email Service] Has error?`, !!result.error);
    console.log(`📧 [Email Service] Has data?`, !!result.data);
    console.log(`📧 [Email Service] Error details:`, result.error);
    console.log(`📧 [Email Service] Data details:`, result.data);

    // CRITICAL: Check if Resend returned an error
    // Resend returns { data: {...}, error: null } on success
    // or { data: null, error: {...} } on failure
    if (result.error) {
      console.error(`❌ [Email Service] Resend API returned an error!`);
      console.error(`❌ [Email Service] Error:`, JSON.stringify(result.error, null, 2));
      console.error(`❌ [Email Service] Error message:`, result.error.message);
      console.error(`❌ [Email Service] Error name:`, result.error.name);
      console.error(`❌ [Email Service] FROM_EMAIL used:`, FROM_EMAIL);
      console.error(`❌ [Email Service] TO email:`, params.to);
      return {
        success: false,
        error: result.error.message || 'Resend API error',
        errorDetails: result.error,
      };
    }

    console.log(`✅ Email sent successfully to ${params.to}. Message ID: ${result.data?.id}`);

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    console.error(`❌ Failed to send email:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Queue email for retry
export async function queueEmail(params: {
  type: string;
  recipientEmail: string;
  subject: string;
  template: string;
  variables: any;
}, kv: any) {
  const emailId = crypto.randomUUID();
  const queueData = {
    id: emailId,
    type: params.type,
    recipientEmail: params.recipientEmail,
    subject: params.subject,
    template: params.template,
    variables: params.variables,
    status: 'pending',
    attempts: 0,
    maxAttempts: 3,
    nextRetry: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
    createdAt: new Date().toISOString(),
  };

  await kv.set(`email_queue:${emailId}`, queueData);
  console.log(`📬 Email queued for retry: ${emailId}`);

  return emailId;
}

// Process email queue (called by cron)
export async function processEmailQueue(kv: any) {
  const now = new Date();
  
  // Get all pending emails
  const queuedEmails = await kv.getByPrefix('email_queue:');
  
  let processed = 0;
  let sent = 0;
  let failed = 0;

  for (const { value: email } of queuedEmails) {
    // Skip if not ready for retry
    if (email.status !== 'pending' || new Date(email.nextRetry) > now) {
      continue;
    }

    // Skip if max attempts reached
    if (email.attempts >= email.maxAttempts) {
      await kv.set(`email_queue:${email.id}`, { ...email, status: 'failed' });
      failed++;
      continue;
    }

    processed++;

    // Try to send
    const result = await sendEmail({
      to: email.recipientEmail,
      subject: email.subject,
      template: email.template,
      variables: email.variables,
    });

    if (result.success) {
      // Mark as sent
      await kv.set(`email_queue:${email.id}`, {
        ...email,
        status: 'sent',
        sentAt: new Date().toISOString(),
      });
      sent++;
      console.log(`✅ Queued email sent: ${email.id}`);
    } else {
      // Increment attempts and schedule retry
      const newAttempts = email.attempts + 1;
      const backoffMinutes = Math.pow(2, newAttempts) * 5; // Exponential backoff
      
      await kv.set(`email_queue:${email.id}`, {
        ...email,
        attempts: newAttempts,
        lastAttemptAt: new Date().toISOString(),
        nextRetry: new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString(),
        errorMessage: result.error,
      });
      console.log(`❌ Email retry failed (attempt ${newAttempts}/${email.maxAttempts}): ${email.id}`);
    }

    // Rate limit: 100ms between sends
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`📊 Email queue processed: ${processed} emails, ${sent} sent, ${failed} failed`);
  return { processed, sent, failed };
}

// EmailService class for capsule delivery emails
export class EmailService {
  static async sendCapsuleDelivery(recipientEmail: string, capsuleData: any) {
    try {
      console.log(`📧 [EMAIL SERVICE] Starting capsule delivery to ${recipientEmail}`);
      console.log(`📧 [EMAIL SERVICE] Capsule data:`, JSON.stringify({
        title: capsuleData.capsuleTitle,
        isSelfDelivery: capsuleData.isSelfDelivery,
        isSelfRecipient: capsuleData.isSelfRecipient,
        hasTextMessage: !!capsuleData.textMessage,
        mediaFilesCount: capsuleData.mediaFiles?.length || 0
      }));
      
      // Check if API key exists
      const apiKey = Deno.env.get('RESEND_API_KEY');
      if (!apiKey) {
        console.error('❌ [EMAIL SERVICE] RESEND_API_KEY not found in environment!');
        return { success: false, error: 'RESEND_API_KEY not configured' };
      }
      console.log(`🔑 [EMAIL SERVICE] API key found: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
      
      const isSelf = capsuleData.isSelfDelivery || capsuleData.isSelfRecipient;
      const senderName = capsuleData.senderName || 'Someone Special';
      const capsuleTitle = capsuleData.capsuleTitle || 'A Memory from the Past';
      
      // Safely format date
      let dateString = 'a recent date';
      try {
        const dateVal = capsuleData.deliveryDate ? new Date(capsuleData.deliveryDate) : new Date();
        if (!isNaN(dateVal.getTime())) {
          dateString = dateVal.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        }
      } catch (e) {
        console.warn('Date formatting error:', e);
      }
      
      // Build specific template based on recipient type
      let subject = '';
      let headline = '';
      let subheadline = '';
      let introText = '';
      
      if (isSelf) {
        // SELF DELIVERY TEMPLATE
        subject = `You've Received A Message from Your Past Self`; // ✅ Emoji removed for deliverability
        headline = 'Your Time Capsule is Ready';
        subheadline = 'Your Future Self';
        introText = `Your Eras capsule has just been unlocked — a message from you, sent across time.<br><br>Take a deep breath and open it when you're ready — this is a moment you created for yourself.<br><br>Welcome back to your own story.<br><br><em style="color: #9ca3af;">— The Eras Team</em>`;
      } else {
        // OTHERS DELIVERY TEMPLATE
        subject = `A Memory Awaits — You've Received a Time Capsule from ${senderName}`; // ✅ Emoji removed for deliverability
        headline = `${senderName} sent you a Time Capsule`;
        subheadline = '';
        introText = `Someone from another moment in time has sent you a message through Eras.<br><br>Inside is something they wanted you to see, hear, or feel. Open it when you're ready. Some moments are meant to arrive right on time.<br><br><em style=\"color: #9ca3af;\">— The Eras Team</em>`;
      }

      // Build simple HTML email for capsule delivery
      const mediaItems = capsuleData.mediaFiles?.map((file: any) => {
        const icon = file.file_type.startsWith('image/') ? '📸' : 
                     file.file_type.startsWith('video/') ? '🎥' : '🎵';
        return `<li style="padding: 8px 0;">${icon} ${file.file_name}</li>`;
      }).join('') || '';

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Time Capsule Delivered</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #1e1b4b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
    <tr>
      <td style="padding: 40px 32px; text-align: center; background: linear-gradient(135deg, rgba(167,139,250,0.3) 0%, rgba(139,92,246,0.3) 100%); border-bottom: 2px solid rgba(167,139,250,0.3);">
        <h1 style="margin: 0; font-size: ${isSelf ? '32px' : '28px'}; font-weight: 900; color: white; letter-spacing: -0.02em;">
          ${headline}
        </h1>
        <p style="margin: 12px 0 0 0; font-size: 16px; color: #e9d5ff; font-weight: 500; letter-spacing: 0.05em;">
          ${subheadline}
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0; text-align: center;">
          ${introText}
        </p>

        <div style="text-align: center; margin-top: 32px;">
          <a href="${capsuleData.viewUrl || capsuleData.viewingUrl || '#'}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; letter-spacing: 0.02em; box-shadow: 0 4px 12px rgba(168,85,247,0.4);">
            Open Time Capsule →
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 32px; background: rgba(0,0,0,0.2); text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 13px; color: #9ca3af;">
          Sent via <strong style="color: #e9d5ff;">Eras</strong> • Capture Today, Unlock Tomorrow
        </p>
        <p style="margin: 0; font-size: 11px; color: #6b7280;">
          <strong style="color: #9ca3af;">ERAS Digital Time Capsule</strong> • Capture Today, Unlock Tomorrow
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

      console.log(`📧 [EMAIL SERVICE] Sending email with Resend API...`);
      console.log(`📧 [EMAIL SERVICE] To: ${recipientEmail}`);
      console.log(`📧 [EMAIL SERVICE] Subject: ${subject}`);
      console.log(`📧 [EMAIL SERVICE] From: ${FROM_EMAIL}`);
      
      // RATE LIMIT: Wait for rate limiter before sending
      const waitStartTime = Date.now();
      await resendRateLimiter.waitForNextSlot();
      const waitDuration = Date.now() - waitStartTime;
      if (waitDuration > 0) {
        console.log(`⏳ [EMAIL SERVICE] Rate limiter delayed email by ${waitDuration}ms`);
      }
      
      // Log exact timestamp when email is submitted to Resend
      const emailSubmitTime = new Date();
      console.log(`🕐 [EMAIL SERVICE] Submitting email to Resend at: ${emailSubmitTime.toISOString()}`);
      console.log(`🕐 [EMAIL SERVICE] Local time: ${emailSubmitTime.toLocaleString()}`);
      
      // ✅ Create plain text version for better deliverability
      const plainIntroText = introText.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
      const plainText = `${headline}\n\n${plainIntroText}\n\nCapsule: ${capsuleTitle}${!isSelf ? `\nFrom: ${senderName}` : ''}\nDelivery Date: ${dateString}\n\nOpen your capsule:\n${capsuleData.viewUrl || capsuleData.viewingUrl || '#'}`;
      
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: recipientEmail,
        subject: subject,
        html: html,
        text: plainText, // ✅ Plain text version added
        // Add headers to prioritize immediate delivery and improve deliverability
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high',
          'List-Unsubscribe': '<mailto:unsubscribe@yourdomain.com>', // ✅ Required for inbox placement
          'X-Entity-Ref-ID': capsuleData.capsule_id || capsuleData.id || '' // ✅ Tracking header
        }
      });

      console.log(`📧 [EMAIL SERVICE] Resend API response:`, JSON.stringify(result, null, 2));
      console.log(`🕐 [EMAIL SERVICE] Email submitted successfully at ${new Date().toISOString()}`);
      
      // CRITICAL FIX: Check if Resend returned an error
      // Resend returns { data: {...}, error: null } on success
      // or { data: null, error: {...} } on failure
      if (result.error) {
        console.error(`❌ [EMAIL SERVICE] Resend API returned an error!`);
        console.error(`❌ [EMAIL SERVICE] Error:`, JSON.stringify(result.error, null, 2));
        console.error(`❌ [EMAIL SERVICE] Error message: ${result.error.message}`);
        
        // Special handling for domain verification errors
        if (result.error.message?.includes('domain is not verified')) {
          console.error(`❌ [EMAIL SERVICE] DOMAIN VERIFICATION ERROR!`);
          console.error(`❌ [EMAIL SERVICE] You need to verify eras.app domain at https://resend.com/domains`);
          console.error(`❌ [EMAIL SERVICE] Or use a different "from" email domain`);
        }
        
        return { success: false, error: result.error.message || 'Resend API error' };
      }
      
      console.log(`✅ [EMAIL SERVICE] Capsule delivery email sent successfully!`);
      console.log(`✅ [EMAIL SERVICE] Message ID: ${result.data?.id}`);
      return { success: true, messageId: result.data?.id };
    } catch (error) {
      console.error(`❌ [EMAIL SERVICE] Failed to send capsule delivery email!`);
      console.error(`❌ [EMAIL SERVICE] Error type: ${error?.constructor?.name || 'Unknown'}`);
      console.error(`❌ [EMAIL SERVICE] Error message:`, error?.message || String(error));
      console.error(`❌ [EMAIL SERVICE] Error details:`, error);
      
      // Try to extract more details from the error
      if (error?.response) {
        console.error(`❌ [EMAIL SERVICE] API Response:`, error.response);
      }
      if (error?.statusCode) {
        console.error(`❌ [EMAIL SERVICE] Status Code:`, error.statusCode);
      }
      
      return { success: false, error: error?.message || String(error) };
    }
  }

  static async sendWarningEmail(recipientEmail: string, userName: string) {
    try {
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Inactivity Warning</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; overflow: hidden;">
    <tr>
      <td style="padding: 40px 32px; text-align: center; background: #ef4444;">
        <h1 style="margin: 0; font-size: 32px; font-weight: 900; color: white;">
          ⚠️ Account Inactivity Warning
        </h1>
        <p style="margin: 12px 0 0 0; font-size: 16px; color: white;">
          Your account needs attention
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0;">
          Hi ${userName},
        </p>
        
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0;">
          We noticed you haven't logged into your Eras account in a while. Your account will become inactive in <strong style="color: white;">30 days</strong> if you don't log in.
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://found-shirt-81691824.figma.site/login" style="display: inline-block; padding: 14px 32px; background: #a855f7; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Log In to Your Account →
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 32px; background: rgba(0,0,0,0.2); text-align: center;">
        <p style="margin: 0; font-size: 13px; color: #9ca3af;">
          <strong style="color: #e9d5ff;">ERAS Digital Time Capsule</strong> • Capture Today, Unlock Tomorrow
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

      // RATE LIMIT: Wait for rate limiter before sending
      await resendRateLimiter.waitForNextSlot();
      
      // ✅ Create plain text version
      const plainText = `Account Inactivity Warning\n\nHi ${userName},\n\nWe noticed you haven't logged into your Eras account in a while.\n\nYour account will become inactive in 30 days if you don't log in.\n\nLog in now:\nhttps://found-shirt-81691824.figma.site/login\n\n— The Eras Team`;
      
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: recipientEmail,
        subject: 'Account Inactivity Warning - Eras', // ✅ Emoji removed
        html: html,
        text: plainText, // ✅ Plain text added
        headers: {
          'List-Unsubscribe': '<mailto:unsubscribe@yourdomain.com>',
          'X-Priority': '1'
        }
      });

      if (result.error) {
        return { success: false, error: result.error.message };
      }

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async sendDeliveryNotification(userEmail: string, capsuleTitle: string, recipientEmail: string) {
    try {
      console.log(`📧 Sending delivery notification to ${userEmail}`);
      
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Capsule Delivered</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 40px 16px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #1e1b4b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
    <!-- Header -->
    <tr>
      <td style="padding: 48px 32px; text-align: center; background: linear-gradient(135deg, rgba(16,185,129,0.4) 0%, rgba(5,150,105,0.4) 100%); border-bottom: 3px solid rgba(16,185,129,0.5);">
        <div style="font-size: 56px; margin-bottom: 12px;">📦</div>
        <h1 style="margin: 0; font-size: 32px; font-weight: 900; color: white; letter-spacing: -0.02em;">
          Mission Complete!
        </h1>
        <p style="margin: 8px 0 0 0; font-size: 16px; color: #a7f3d0; font-weight: 500;">
          Your capsule has arrived at its destination
        </p>
      </td>
    </tr>
    
    <!-- Main Content -->
    <tr>
      <td style="padding: 40px 32px;">
        <!-- Capsule Info Card -->
        <div style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%); border: 2px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 24px; margin-bottom: 28px;">
          <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #a78bfa;">
            Time Capsule
          </p>
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: white; line-height: 1.3;">
            "${capsuleTitle}"
          </p>
        </div>

        <!-- Delivery Details -->
        <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 24px; margin-bottom: 28px;">
          <p style="margin: 0 0 12px 0; font-size: 14px; color: #94a3b8;">
            <span style="display: inline-block; width: 20px; text-align: center; margin-right: 8px;">✅</span>
            <strong style="color: #10b981;">Successfully delivered</strong>
          </p>
          <p style="margin: 0; font-size: 14px; color: #94a3b8;">
            <span style="display: inline-block; width: 20px; text-align: center; margin-right: 8px;">📧</span>
            Sent to <strong style="color: #c084fc;">${recipientEmail}</strong>
          </p>
        </div>

        <!-- Success Message -->
        <div style="background: linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.15) 100%); border-left: 4px solid #10b981; padding: 24px; border-radius: 8px;">
          <p style="margin: 0; font-size: 15px; color: #d1fae5; line-height: 1.6;">
            ✨ <strong>Your memory has been delivered!</strong> The recipient can now open and experience your time capsule whenever they're ready.
          </p>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 32px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
        <p style="margin: 0; font-size: 13px; color: #9ca3af;">
          <strong style="color: #e9d5ff;">ERAS Digital Time Capsule</strong> • Capture Today, Unlock Tomorrow
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

      // RATE LIMIT: Wait for rate limiter before sending
      await resendRateLimiter.waitForNextSlot();
      
      // ✅ Create plain text version
      const plainText = `Capsule Successfully Delivered!\n\nYour time capsule "${capsuleTitle}" has been delivered to ${recipientEmail}.\n\nDelivery Details:\n- Capsule: ${capsuleTitle}\n- Delivered to: ${recipientEmail}\n- Delivered at: ${new Date().toLocaleString()}\n\n— The Eras Team`;
      
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: userEmail,
        subject: `Capsule Delivered: ${capsuleTitle}`, // ✅ Emoji removed
        html: html,
        text: plainText, // ✅ Plain text added
        headers: {
          'List-Unsubscribe': '<mailto:unsubscribe@yourdomain.com>'
        }
      });

      console.log(`✅ Delivery notification sent:`, result);
      return { success: true, messageId: result.id };
    } catch (error) {
      console.error(`❌ Failed to send delivery notification:`, error);
      return { success: false, error: error.message };
    }
  }

  static async sendPasswordResetEmail(email: string, resetUrl: string, userName: string | null) {
    try {
      console.log(`📧 Sending password reset email to ${email}`);
      const name = userName || 'Eras User';
      
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; overflow: hidden;">
    <tr>
      <td style="padding: 40px 32px; text-align: center; background: #6366f1;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: white;">
          Reset Your Password
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0;">
          Hi ${name},
        </p>
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0;">
          You requested a password reset for your Eras account. Click the button below to set a new password.
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
            Reset Password →
          </a>
        </div>

        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
          If you didn't request this, you can safely ignore this email. Your password won't change until you create a new one.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 32px; background: rgba(0,0,0,0.2); text-align: center;">
        <p style="margin: 0; font-size: 13px; color: #9ca3af;">
          <strong style="color: #e9d5ff;">ERAS Digital Time Capsule</strong> • Capture Today, Unlock Tomorrow
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

      // RATE LIMIT: Wait for rate limiter before sending
      await resendRateLimiter.waitForNextSlot();
      
      // ✅ Create plain text version
      const plainText = `Reset Your Password\n\nHi ${name},\n\nYou requested a password reset for your Eras account.\n\nReset your password:\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.\n\n— The Eras Team`;
      
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'Reset your Eras password', // ✅ Already good
        html: html,
        text: plainText, // ✅ Plain text added
        headers: {
          'List-Unsubscribe': '<mailto:unsubscribe@yourdomain.com>'
        }
      });

      if (result.error) {
        console.error('❌ [Password Reset] Resend API error:', result.error);
        return false;
      }

      console.log(`✅ [Password Reset] Email sent via Resend. ID: ${result.data?.id}`);
      return true;
    } catch (error) {
      console.error('❌ [Password Reset] Failed to send email:', error);
      return false;
    }
  }

  static async sendWelcomeEmail(email: string, firstName: string, verifyUrl: string) {
    try {
      console.log(`📧 [Welcome Email] Sending to ${email}`);
      
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Eras! 🎉</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #1e1b4b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
    <tr>
      <td style="padding: 48px 32px; text-align: center; background: linear-gradient(135deg, rgba(167,139,250,0.4) 0%, rgba(139,92,246,0.4) 100%); border-bottom: 3px solid rgba(167,139,250,0.5);">
        <div style="font-size: 56px; margin-bottom: 12px;">🎉</div>
        <h1 style="margin: 0; font-size: 32px; font-weight: 900; color: white; letter-spacing: -0.02em;">
          Welcome to Eras!
        </h1>
        <p style="margin: 12px 0 0 0; font-size: 16px; color: #e9d5ff; font-weight: 500; letter-spacing: 0.05em;">
          Your time capsule journey begins now
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0;">
          Hi ${firstName}!
        </p>
        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #e2e8f0;">
          Thank you for joining Eras — where today's moments become tomorrow's treasures. To get started, please verify your email address by clicking the button below.
        </p>

        <div style="background: rgba(167,139,250,0.15); border-left: 4px solid #a78bfa; padding: 20px; margin: 24px 0; border-radius: 8px;">
          <p style="margin: 0; color: #e9d5ff; font-size: 15px; line-height: 1.6;">
            ✨ <strong>What you can do with Eras:</strong>
          </p>
          <ul style="margin: 12px 0 0 0; padding-left: 24px; color: #e2e8f0; font-size: 14px; line-height: 1.8;">
            <li>Create time capsules to your future self</li>
            <li>Send messages that unlock on special dates</li>
            <li>Preserve memories with photos, videos & audio</li>
            <li>Share moments with loved ones across time</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${verifyUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; letter-spacing: 0.02em; box-shadow: 0 4px 16px rgba(168,85,247,0.5); text-transform: uppercase;">
            Verify Email & Get Started →
          </a>
        </div>

        <div style="background: rgba(59,130,246,0.1); border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 8px;">
          <p style="margin: 0; color: #93c5fd; font-size: 14px; line-height: 1.6;">
            ⏰ <strong>This link will expire in 24 hours.</strong> Please verify soon to access your account.
          </p>
        </div>

        <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: #94a3b8; text-align: center;">
          If you didn't create this account, you can safely ignore this email.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px 32px; background: rgba(0,0,0,0.3); text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 13px; color: #9ca3af;">
          <strong style="color: #e9d5ff;">ERAS Digital Time Capsule</strong> • Capture Today, Unlock Tomorrow
        </p>
        <p style="margin: 0; font-size: 12px; color: #6b7280;">
          © 2025 Eras. Capture Today, Unlock Tomorrow
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

      // RATE LIMIT: Wait for rate limiter before sending
      await resendRateLimiter.waitForNextSlot();
      
      // ✅ Create plain text version
      const plainText = `Welcome to Eras!\n\nHi ${firstName}!\n\nThank you for joining Eras — where today's moments become tomorrow's treasures.\n\nTo get started, please verify your email:\n${verifyUrl}\n\n(This link will expire in 24 hours)\n\nWhat you can do with Eras:\n• Create time capsules to your future self\n• Send messages that unlock on special dates\n• Preserve memories with photos, videos & audio\n• Share moments with loved ones across time\n\nIf you didn't create this account, you can safely ignore this email.\n\n— The Eras Team`;
      
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: 'Welcome to Eras! Please verify your email', // ✅ Emoji removed
        html: html,
        text: plainText, // ✅ Plain text added
        headers: {
          'List-Unsubscribe': '<mailto:unsubscribe@yourdomain.com>'
        }
      });

      console.log(`📧 [Welcome Email] Resend API response:`, JSON.stringify(result, null, 2));

      if (result.error) {
        console.error('❌ [Welcome Email] Resend API error:', result.error);
        console.error('❌ [Welcome Email] FROM_EMAIL used:', FROM_EMAIL);
        console.error('❌ [Welcome Email] TO email:', email);
        return false;
      }

      console.log(`✅ [Welcome Email] Email sent successfully! ID: ${result.data?.id}`);
      return true;
    } catch (error) {
      console.error('❌ [Welcome Email] Failed to send email:', error);
      return false;
    }
  }
}