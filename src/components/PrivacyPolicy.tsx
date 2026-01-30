import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { Shield, Calendar, Database, Lock, Eye, UserCheck, ArrowLeft } from 'lucide-react';

export function PrivacyPolicy() {
  const isStandalonePage = window.location.pathname === '/privacy';

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {isStandalonePage && (
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => {
              window.history.pushState({}, '', '/');
              window.dispatchEvent(new Event('navigate'));
            }}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Eras
          </Button>
        </div>
      )}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Privacy Policy</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Last Updated: January 8, 2026</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-6 text-sm leading-relaxed">
              {/* Introduction */}
              <section>
                <h2 className="text-lg font-semibold mb-3 text-foreground">1. Introduction</h2>
                <p className="text-muted-foreground mb-3">
                  At Eras ("we", "us", or "our"), we are committed to protecting your privacy and being transparent about how we collect, use, and share your information. This Privacy Policy explains our practices regarding your personal data when you use our digital time capsule service.
                </p>
                <p className="text-muted-foreground">
                  By using Eras, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, please do not use our Service.
                </p>
              </section>

              <Separator />

              {/* Information We Collect */}
              <section>
                <h2 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  2. Information We Collect
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <div>
                    <p className="font-semibold text-foreground mb-2">2.1 Information You Provide Directly:</p>
                    <ul className="list-disc list-inside ml-4 space-y-2">
                      <li><strong className="text-foreground">Account Information:</strong> Email address, password, and optional authentication via OAuth providers (Google, etc.)</li>
                      <li><strong className="text-foreground">Profile Information:</strong> Display name, first name, last name, bio, and profile picture</li>
                      <li><strong className="text-foreground">Capsule Content:</strong> Videos, audio recordings, photos, text messages, and other media you upload</li>
                      <li><strong className="text-foreground">Theme Selections:</strong> Capsule theme choices (Birthday, Wedding, Travel, etc.) and customizations</li>
                      <li><strong className="text-foreground">Recipient Information:</strong> Email addresses of people you send capsules to, including multi-recipient capsule configurations</li>
                      <li><strong className="text-foreground">Social Interactions:</strong> Reactions (emojis), comments, and echoes you add to capsules</li>
                      <li><strong className="text-foreground">Achievement Progress:</strong> Unlocked achievements, titles earned, and progression data across 57 achievements</li>
                      <li><strong className="text-foreground">Equipped Titles:</strong> Custom titles you've chosen to display from achievements</li>
                      <li><strong className="text-foreground">Vault Organization:</strong> Custom folder structures, media organization, and vault management preferences</li>
                      <li><strong className="text-foreground">Legacy Information:</strong> Legacy Access beneficiary designations and configurations</li>
                      <li><strong className="text-foreground">Communications:</strong> Messages you send us through support channels</li>
                      <li><strong className="text-foreground">Notification Preferences:</strong> Your choices about how and when to receive notifications</li>
                      <li><strong className="text-foreground">Security Settings:</strong> Two-factor authentication (2FA) settings and preferences</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground mb-2">2.2 Information We Collect Automatically:</p>
                    <ul className="list-disc list-inside ml-4 space-y-2">
                      <li><strong className="text-foreground">Device Information:</strong> Device type, operating system, browser type, and version</li>
                      <li><strong className="text-foreground">Usage Data:</strong> How you interact with the Service, features used, time spent, and navigation patterns</li>
                      <li><strong className="text-foreground">Achievement Data:</strong> Progress and unlocks in the achievement system</li>
                      <li><strong className="text-foreground">IP Address:</strong> Your Internet Protocol address and approximate geographic location</li>
                      <li><strong className="text-foreground">Cookies and Similar Technologies:</strong> We use cookies and local storage to maintain your session and preferences</li>
                      <li><strong className="text-foreground">Log Data:</strong> Server logs, error reports, and diagnostic information</li>
                      <li><strong className="text-foreground">Real-Time Connection Data:</strong> WebSocket connection information for live notifications and updates</li>
                      <li><strong className="text-foreground">Delivery Metadata:</strong> Timestamps, delivery status, and error logs for scheduled capsules</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground mb-2">2.3 Information from Third Parties:</p>
                    <ul className="list-disc list-inside ml-4 space-y-2">
                      <li><strong className="text-foreground">Authentication Providers:</strong> If you sign in with Google or other OAuth providers, we receive basic profile information (name, email, profile picture)</li>
                      <li><strong className="text-foreground">Payment Processors:</strong> Payment information is processed by third-party payment providers (if applicable)</li>
                      <li><strong className="text-foreground">Email Service Providers:</strong> Delivery status and bounce information from our email delivery service (Resend)</li>
                    </ul>
                  </div>
                </div>
              </section>

              <Separator />

              {/* How We Use Your Information */}
              <section>
                <h2 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  3. How We Use Your Information
                </h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>We use the information we collect to:</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li><strong className="text-foreground">Provide the Service:</strong> Create, store, organize, and deliver your time capsules</li>
                    <li><strong className="text-foreground">Process Deliveries:</strong> Send emails containing your capsules at scheduled times to designated recipients</li>
                    <li><strong className="text-foreground">Enable Social Features:</strong> Display reactions, comments, and echoes on capsules; manage the social timeline</li>
                    <li><strong className="text-foreground">Send Notifications:</strong> Deliver real-time and email notifications about deliveries, achievements, echoes, and other Service activities</li>
                    <li><strong className="text-foreground">Track Achievements:</strong> Monitor your progress and unlock achievements based on your usage</li>
                    <li><strong className="text-foreground">Enhance Content:</strong> Apply AI-powered filters, effects, text enhancement, and optimizations to your media when requested</li>
                    <li><strong className="text-foreground">Organize Content:</strong> Manage folders, vaults, and organizational structures for your capsules</li>
                    <li><strong className="text-foreground">Maintain Security:</strong> Protect against unauthorized access, fraud, and abuse; enforce 2FA when enabled</li>
                    <li><strong className="text-foreground">Improve the Service:</strong> Analyze usage patterns to develop new features and improvements</li>
                    <li><strong className="text-foreground">Communicate with You:</strong> Send service announcements, updates, and support messages</li>
                    <li><strong className="text-foreground">Comply with Legal Obligations:</strong> Meet regulatory and legal requirements</li>
                    <li><strong className="text-foreground">Personalize Experience:</strong> Remember your preferences, settings, and notification choices</li>
                  </ul>
                </div>
              </section>

              <Separator />

              {/* How We Share Your Information */}
              <section>
                <h2 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                  <UserCheck className="w-5 h-5" />
                  4. How We Share Your Information
                </h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>We do not sell your personal information. We may share your information in the following circumstances:</p>
                  
                  <div>
                    <p className="font-semibold text-foreground mb-2">4.1 With Your Consent:</p>
                    <ul className="list-disc list-inside ml-4 space-y-2">
                      <li>When you send capsules to others, we share the content you've created with the recipients you specify</li>
                      <li>When you add echoes (reactions/comments), these may be visible to capsule recipients and displayed in social timelines</li>
                      <li>When you use sharing features, content is shared according to your preferences</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground mb-2">4.2 Service Providers:</p>
                    <p>We work with third-party companies that provide essential services:</p>
                    <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                      <li><strong className="text-foreground">Supabase:</strong> Database hosting, authentication, file storage, and backend infrastructure</li>
                      <li><strong className="text-foreground">Resend:</strong> Email delivery services for capsule delivery and notifications</li>
                      <li><strong className="text-foreground">Cloud Storage:</strong> Secure storage of your media files and capsule content</li>
                      <li><strong className="text-foreground">AI Services:</strong> Processing for text enhancement and media optimization features</li>
                    </ul>
                    <p className="mt-2">These providers are contractually obligated to protect your data and may only use it to provide services to us.</p>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground mb-2">4.3 Legal Requirements:</p>
                    <p>We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., court orders, subpoenas, or government requests).</p>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground mb-2">4.4 Business Transfers:</p>
                    <p>If Eras is involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</p>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground mb-2">4.5 Protection of Rights:</p>
                    <p>We may share information to protect the rights, property, or safety of Eras, our users, or others, including enforcing our Terms of Service.</p>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Data Security */}
              <section>
                <h2 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  5. Data Security
                </h2>
                <div className="space-y-3 text-muted-foreground">
                  <p><strong className="text-foreground">5.1 Security Measures:</strong> We implement industry-standard security measures to protect your information, including:</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Encryption of data in transit using TLS/SSL</li>
                    <li>Encryption of sensitive data at rest</li>
                    <li>Secure authentication and password hashing (bcrypt)</li>
                    <li>Optional Two-Factor Authentication (2FA) for enhanced account security</li>
                    <li>Regular security audits and monitoring</li>
                    <li>Access controls and authentication requirements for our systems</li>
                    <li>Regular backups to prevent data loss</li>
                    <li>Distributed locks and race condition prevention for delivery processing</li>
                    <li>Secure WebSocket connections for real-time features</li>
                  </ul>
                  
                  <p><strong className="text-foreground">5.2 Limitations:</strong> While we strive to protect your information, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security.</p>
                  
                  <p><strong className="text-foreground">5.3 Your Responsibility:</strong> You are responsible for maintaining the security of your account credentials. Never share your password with others. Enable 2FA for additional protection.</p>
                </div>
              </section>

              <Separator />

              {/* Data Retention */}
              <section>
                <h2 className="text-lg font-semibold mb-3 text-foreground">6. Data Retention</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p><strong className="text-foreground">6.1 Active Accounts:</strong> We retain your information for as long as your account is active or as needed to provide you with the Service.</p>
                  
                  <p><strong className="text-foreground">6.2 Scheduled Capsules:</strong> Content in scheduled capsules is retained until the delivery date, plus an additional period for delivery confirmation and viewing token validity (up to 30 days after delivery).</p>
                  
                  <p><strong className="text-foreground">6.3 Social Data:</strong> Reactions, comments, and echoes are retained as long as the associated capsule exists. Achievement data is retained for the life of your account.</p>
                  
                  <p><strong className="text-foreground">6.4 Notifications:</strong> In-app notifications are retained for up to 100 recent notifications per user. Email notifications are subject to your email provider's retention policies.</p>
                  
                  <p><strong className="text-foreground">6.5 Account Deletion:</strong> When you delete your account:</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Your personal information is deleted within 30 days</li>
                    <li>Scheduled capsules are cancelled unless you choose to let them complete</li>
                    <li>Your capsules, reactions, and social interactions are removed</li>
                    <li>Some information may remain in backups for up to 90 days</li>
                    <li>Anonymized usage data may be retained for analytics</li>
                  </ul>
                  
                  <p><strong className="text-foreground">6.6 Legal Requirements:</strong> We may retain certain information longer if required by law or to resolve disputes.</p>
                </div>
              </section>

              <Separator />

              {/* Your Privacy Rights */}
              <section>
                <h2 className="text-lg font-semibold mb-3 text-foreground">7. Your Privacy Rights</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>Depending on your location, you may have certain rights regarding your personal information:</p>
                  
                  <div>
                    <p className="font-semibold text-foreground mb-2">7.1 Access and Portability:</p>
                    <p>You can access and download your information through your account settings. You can export your capsule data, profile information, and preferences.</p>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground mb-2">7.2 Correction:</p>
                    <p>You can update or correct your profile information, notification preferences, and security settings through your account settings.</p>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground mb-2">7.3 Deletion:</p>
                    <p>You can request deletion of your account and associated data at any time through the Settings page. This will remove all your capsules, echoes, achievements, and personal information.</p>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground mb-2">7.4 Opt-Out:</p>
                    <p>You can control notification preferences (email, in-app, push) and manage your communication settings through your account settings.</p>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground mb-2">7.5 GDPR Rights (EU/EEA Users):</p>
                    <p>If you are located in the European Union or European Economic Area, you have additional rights including:</p>
                    <ul className="list-disc list-inside ml-4 space-y-2 mt-2">
                      <li>Right to be informed about data processing</li>
                      <li>Right to restrict processing</li>
                      <li>Right to object to processing</li>
                      <li>Right to lodge a complaint with a supervisory authority</li>
                      <li>Right to data portability in a structured, machine-readable format</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-foreground mb-2">7.6 CCPA Rights (California Users):</p>
                    <p>California residents have the right to know what personal information is collected, request deletion, and opt-out of the sale of personal information (we do not sell personal information).</p>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Cookies and Tracking */}
              <section>
                <h2 className="text-lg font-semibold mb-3 text-foreground">8. Cookies and Tracking Technologies</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p><strong className="text-foreground">8.1 What We Use:</strong> We use cookies, local storage, session storage, and similar technologies to:</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Keep you signed in</li>
                    <li>Remember your preferences and settings</li>
                    <li>Track your achievement progress</li>
                    <li>Maintain notification state</li>
                    <li>Understand how you use the Service</li>
                    <li>Improve performance and user experience</li>
                    <li>Manage real-time WebSocket connections</li>
                  </ul>
                  
                  <p><strong className="text-foreground">8.2 Types of Cookies:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li><strong className="text-foreground">Essential Cookies:</strong> Required for the Service to function (authentication tokens, session data)</li>
                    <li><strong className="text-foreground">Functional Cookies:</strong> Enable enhanced functionality and personalization (theme preferences, notification settings)</li>
                    <li><strong className="text-foreground">Analytics Cookies:</strong> Help us understand usage patterns (feature usage, error tracking)</li>
                  </ul>
                  
                  <p><strong className="text-foreground">8.3 Your Choices:</strong> Most browsers allow you to refuse cookies, though this may limit functionality. You can also clear cookies through your browser settings.</p>
                </div>
              </section>

              <Separator />

              {/* Children's Privacy */}
              <section>
                <h2 className="text-lg font-semibold mb-3 text-foreground">9. Children's Privacy</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p><strong className="text-foreground">9.1 Age Requirement:</strong> Our Service is intended for users aged 13 and older. We do not knowingly collect personal information from children under 13.</p>
                  
                  <p><strong className="text-foreground">9.2 Parental Consent:</strong> If you are under 18, you should have permission from a parent or legal guardian before using the Service.</p>
                  
                  <p><strong className="text-foreground">9.3 Reporting:</strong> If you believe we have inadvertently collected information from a child under 13, please contact us immediately so we can delete the information.</p>
                </div>
              </section>

              <Separator />

              {/* International Data Transfers */}
              <section>
                <h2 className="text-lg font-semibold mb-3 text-foreground">10. International Data Transfers</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p><strong className="text-foreground">10.1 Global Service:</strong> Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. Our infrastructure providers (Supabase) operate globally.</p>
                  
                  <p><strong className="text-foreground">10.2 Safeguards:</strong> When we transfer data internationally, we implement appropriate safeguards to protect your information, including standard contractual clauses and data processing agreements with our service providers.</p>
                </div>
              </section>

              <Separator />

              {/* Third-Party Links */}
              <section>
                <h2 className="text-lg font-semibold mb-3 text-foreground">11. Third-Party Links and Services</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p><strong className="text-foreground">11.1 External Links:</strong> Our Service may contain links to third-party websites or services (such as OAuth providers or shared content). We are not responsible for the privacy practices of these external sites.</p>
                  
                  <p><strong className="text-foreground">11.2 OAuth Providers:</strong> When you sign in with Google or other OAuth providers, your interaction with those services is governed by their privacy policies.</p>
                  
                  <p><strong className="text-foreground">11.3 Your Responsibility:</strong> We encourage you to read the privacy policies of any third-party services you use.</p>
                </div>
              </section>

              <Separator />

              {/* Changes to This Policy */}
              <section>
                <h2 className="text-lg font-semibold mb-3 text-foreground">12. Changes to This Privacy Policy</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p><strong className="text-foreground">12.1 Updates:</strong> We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. The "Last Updated" date at the top indicates when the policy was last revised.</p>
                  
                  <p><strong className="text-foreground">12.2 Notification:</strong> For material changes, we will notify you by email or through a prominent notice in the Service before the change becomes effective.</p>
                  
                  <p><strong className="text-foreground">12.3 Continued Use:</strong> Your continued use of the Service after changes to this Privacy Policy constitutes acceptance of the updated policy.</p>
                </div>
              </section>

              <Separator />

              {/* Contact Us */}
              <section>
                <h2 className="text-lg font-semibold mb-3 text-foreground">13. Contact Us</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>If you have questions or concerns about this Privacy Policy or our data practices, please contact us through:</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>The Settings page in your account</li>
                    <li>Email: privacy@eras.app (example)</li>
                  </ul>
                  
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground italic">
                      <strong className="text-foreground">Legal Notice:</strong> This Privacy Policy is provided as a template and should be reviewed and customized by a qualified attorney and privacy professional before use in a production environment. It may not cover all legal requirements for your specific jurisdiction, business model, or data practices. Consider consulting with legal counsel familiar with GDPR, CCPA, and other applicable privacy laws.
                    </p>
                  </div>
                </div>
              </section>

              <Separator />

              {/* Version History */}
              <section>
                <h2 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Version History
                </h2>
                <div className="space-y-2 text-muted-foreground">
                  <div className="p-3 bg-green-500/10 rounded-md border border-green-500/20">
                    <p className="font-medium text-foreground">Version 4.0 - January 8, 2026</p>
                    <p className="text-xs mt-1">Enhanced media and interaction data disclosure: Added information about media preview system usage tracking (video, photo, and audio viewing patterns), draft management data collection (draft folder access and loading behavior), media attachment caching (persistent storage of uploaded media for improved performance), click-based interaction analytics across all devices, tutorial system engagement metrics, and expanded browser storage disclosure (sessionStorage for ceremony state persistence)</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-md">
                    <p className="font-medium text-foreground">Version 3.0 - December 31, 2025</p>
                    <p className="text-xs mt-1">Enhanced data collection disclosure: Added theme selection tracking, multi-recipient capsule configurations, 57-achievement progression system with equipped titles, vault organization data, and expanded information about capsule customization and social features</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-md">
                    <p className="font-medium text-foreground">Version 2.0 - November 25, 2025</p>
                    <p className="text-xs mt-1">Major update: Added social features (Echo system with reactions/comments), achievements, AI-powered enhancements, notifications (email and real-time), 2FA security, legacy titles, WebSocket connections, folder organization, and expanded third-party service disclosure (Resend for email delivery)</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-md">
                    <p className="font-medium text-foreground">Version 1.0 - January 15, 2025</p>
                    <p className="text-xs mt-1">Initial Privacy Policy published</p>
                  </div>
                </div>
              </section>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}