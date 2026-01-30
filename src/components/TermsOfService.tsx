import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { FileText, Calendar, ArrowLeft } from 'lucide-react';

export function TermsOfService() {
  const isStandalonePage = window.location.pathname === '/terms';

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
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Terms of Service</CardTitle>
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
                  Welcome to Eras ("Service", "we", "us", or "our"). By accessing or using our digital time capsule service, you agree to be bound by these Terms of Service ("Terms"). Please read them carefully.
                </p>
                <p className="text-muted-foreground">
                  If you do not agree to these Terms, you may not use the Service. We reserve the right to modify these Terms at any time, and your continued use of the Service constitutes acceptance of any changes.
                </p>
              </section>

              <Separator />

              {/* Account Requirements */}
              <section>
                <h2 className="text-lg font-semibold mb-3 text-foreground">2. Account Requirements</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p><strong className="text-foreground">2.1 Age Requirement:</strong> You must be at least 13 years of age to use the Service. If you are under 18, you must have permission from a parent or legal guardian.</p>
                  
                  <p><strong className="text-foreground">2.2 Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized access or use of your account. We offer optional Two-Factor Authentication (2FA) for enhanced security.</p>
                  
                  <p><strong className="text-foreground">2.3 Accurate Information:</strong> You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.</p>
                  
                  <p><strong className="text-foreground">2.4 One Account Per Person:</strong> You may only create and maintain one account. Creating multiple accounts may result in termination of all your accounts.</p>
                </div>
              </section>

              <Separator />

              {/* Content and Usage */}
              <section>
                <h2 className="text-lg font-semibold mb-3 text-foreground">3. Content and Usage Rights</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p><strong className="text-foreground">3.1 Your Content:</strong> You retain all ownership rights to the content you upload to Eras (videos, audio, photos, text). By uploading content, you grant us a limited license to store, process, and deliver your content as necessary to provide the Service, including applying AI-powered enhancements, filters, and optimizations when requested.</p>
                  
                  <p><strong className="text-foreground">3.2 Content Restrictions:</strong> You agree not to upload or share content that:</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Is illegal, harmful, threatening, abusive, harassing, or defamatory</li>
                    <li>Contains viruses, malware, or other harmful code</li>
                    <li>Infringes on intellectual property rights of others</li>
                    <li>Contains nudity, pornography, or sexually explicit material</li>
                    <li>Promotes violence, discrimination, or illegal activities</li>
                    <li>Violates the privacy or publicity rights of others</li>
                    <li>Contains false or misleading information</li>
                  </ul>
                  
                  <p><strong className="text-foreground">3.3 Content Review:</strong> We reserve the right (but have no obligation) to review, monitor, or remove content that violates these Terms or is otherwise objectionable.</p>
                  
                  <p><strong className="text-foreground">3.4 Storage Limits:</strong> We may impose limits on the size and number of capsules you can create, the file sizes you can upload, and the total storage space allocated to your account.</p>
                  
                  <p><strong className="text-foreground">3.5 AI-Generated Content:</strong> When using AI-powered features (such as text enhancement or media processing), you acknowledge that AI-generated suggestions are provided as-is and should be reviewed before use.</p>
                </div>
              </section>

              <Separator />

              {/* Time Capsule Delivery */}
              <section>
                <h2 className="text-lg font-semibold mb-3 text-foreground">4. Time Capsule Delivery</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p><strong className="text-foreground">4.1 Scheduled Delivery:</strong> You can schedule capsules for future delivery to yourself or others via email. We will make reasonable efforts to deliver capsules at the scheduled time, but delivery is not guaranteed and may be delayed due to technical issues or factors beyond our control.</p>
                  
                  <p><strong className="text-foreground">4.2 Delivery Failures:</strong> We are not responsible for delivery failures due to incorrect contact information, recipient email blocking or filtering, network issues, email service provider restrictions, or other factors beyond our control. Failed deliveries will not be automatically retried.</p>
                  
                  <p><strong className="text-foreground">4.3 Cancellation:</strong> You may edit or cancel scheduled capsules at least 1 minute before the scheduled delivery time. Once delivered, capsules cannot be recalled.</p>
                  
                  <p><strong className="text-foreground">4.4 Recipient Responsibility:</strong> When sending capsules to others, you are responsible for ensuring you have permission to contact them and that the content is appropriate. You must comply with anti-spam laws and regulations.</p>
                  
                  <p><strong className="text-foreground">4.5 Email Limitations:</strong> Email delivery is subject to rate limits and may be restricted for unverified email addresses depending on our email service provider's policies.</p>
                </div>
              </section>

              <Separator />

              {/* Social Features */}
              <section>
                <h2 className="text-lg font-semibold mb-3 text-foreground">5. Social Features and Community</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p><strong className="text-foreground">5.1 Echo System:</strong> The Service includes social features called "Capsule Echoes" that allow you to react to, comment on, and share delivered capsules. All Echoes are visible to you and may be shared with capsule recipients as configured.</p>
                  
                  <p><strong className="text-foreground">5.2 Reactions and Comments:</strong> When you add reactions or comments to capsules, you represent that your content complies with these Terms and community standards.</p>
                  
                  <p><strong className="text-foreground">5.3 Sharing:</strong> You may share capsules through the Service's sharing features. When sharing, you agree to respect the original creator's intent and content ownership.</p>
                  
                  <p><strong className="text-foreground">5.4 Legacy Titles:</strong> You may assign legacy titles and beneficiaries to your account. These designations do not create legal obligations or transfer ownership of your account.</p>
                  
                  <p><strong className="text-foreground">5.5 Community Conduct:</strong> You agree to interact respectfully with other users and not to harass, abuse, or spam others through social features.</p>
                </div>
              </section>

              <Separator />

              {/* Achievements and Gamification */}
              <section>
                <h2 className="text-lg font-semibold mb-3 text-foreground">6. Achievements and Gamification</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p><strong className="text-foreground">6.1 Achievement System:</strong> The Service includes a comprehensive achievement system with 57 unique achievements across multiple tiers (Common, Uncommon, Rare, Epic, Legendary) that track your usage milestones, creative activities, and engagement patterns. Achievements have no monetary value and cannot be transferred, sold, or redeemed for cash or prizes.</p>
                  
                  <p><strong className="text-foreground">6.2 Title Rewards:</strong> Unlocking achievements may grant special titles that you can equip and display throughout the Service. Titles are cosmetic badges of honor and have no functional impact on your account capabilities. You may only display one title at a time.</p>
                  
                  <p><strong className="text-foreground">6.3 Horizon Visual Effects:</strong> Unlocking achievements may grant access to special visual effects called "Horizons" that enhance your experience. These are cosmetic features provided at our discretion.</p>
                  
                  <p><strong className="text-foreground">6.4 No Guarantees:</strong> We reserve the right to modify, remove, add, or recategorize achievements at any time without notice. Achievement progress may reset if we determine improper usage.</p>
                  
                  <p><strong className="text-foreground">6.5 Fair Use:</strong> Attempting to game or exploit the achievement system through automated means, account sharing, or other forms of abuse may result in achievement revocation, account suspension, or termination.</p>
                </div>
              </section>

              <Separator />

              {/* Themed Capsules and Visual Features */}
              <section>
                <h2 className="text-lg font-semibold mb-3 text-foreground">7. Themed Capsules and Visual Features</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p><strong className="text-foreground">7.1 Theme System:</strong> The Service offers 15+ themed capsule experiences (including Birthday, Wedding, Graduation, Travel, and others) with custom visual ceremonies for sealing and opening capsules. Themes are provided for creative expression and user experience enhancement.</p>
                  
                  <p><strong className="text-foreground">7.2 Opening and Closing Ceremonies:</strong> Themed capsules include interactive animations and visual effects during creation and viewing. These ceremonies may use device resources (CPU, GPU) and are optimized for performance but may vary based on your device capabilities.</p>
                  
                  <p><strong className="text-foreground">7.3 Mobile Optimization:</strong> Visual effects are automatically optimized for mobile devices using solid colors instead of gradients to ensure performance and battery efficiency.</p>
                  
                  <p><strong className="text-foreground">7.4 Session Persistence:</strong> Opening ceremonies are shown once per browser session per capsule. Ceremony state is stored locally in your browser's sessionStorage and clears when you close your browser.</p>
                  
                  <p><strong className="text-foreground">7.5 Performance Considerations:</strong> Complex visual effects (such as particle systems, canvas animations, and special ceremonies) may impact device performance. You can skip ceremonies or use reduced motion settings in your device preferences.</p>
                  
                  <p><strong className="text-foreground">7.6 Browser Compatibility:</strong> Some visual features require modern browser capabilities (Canvas API, CSS animations, WebGL). We make reasonable efforts to provide fallback experiences, but full functionality may not be available on all devices or browsers.</p>
                </div>
              </section>

              <Separator />

              {/* Notifications */}
              <section>
                <h2 className="text-lg font-semibold mb-3 text-foreground">8. Notifications and Communications</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p><strong className="text-foreground">8.1 Service Notifications:</strong> We may send you notifications about your capsules, deliveries, achievements, and other Service activities. You can control notification preferences in your account settings.</p>
                  
                  <p><strong className="text-foreground">8.2 Email Communications:</strong> By creating an account, you agree to receive transactional emails necessary for the Service, including delivery confirmations and security alerts. You cannot opt out of critical service emails.</p>
                  
                  <p><strong className="text-foreground">8.3 Real-Time Features:</strong> The Service uses WebSocket connections for real-time notifications and updates. Your use of the Service constitutes consent to these connections.</p>
                </div>
              </section>

              <Separator />

              {/* Service Availability */}
              <section>
                <h2 className="text-lg font-semibold mb-3 text-foreground">9. Service Availability and Changes</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p><strong className="text-foreground">9.1 "As Is" Service:</strong> The Service is provided "as is" without warranties of any kind. We do not guarantee uninterrupted, error-free, or secure operation.</p>
                  
                  <p><strong className="text-foreground">9.2 Modifications:</strong> We reserve the right to modify, suspend, or discontinue any part of the Service at any time, with or without notice, including features like AI enhancements, social features, or delivery methods.</p>
                  
                  <p><strong className="text-foreground">9.3 Maintenance:</strong> We may perform scheduled or emergency maintenance that temporarily interrupts access to the Service.</p>
                  
                  <p><strong className="text-foreground">9.4 Beta Features:</strong> We may offer beta or experimental features that may not work as intended. Use of such features is at your own risk.</p>
                </div>
              </section>

              <Separator />

              {/* Data and Privacy */}
              <section>
                <h2 className="text-lg font-semibold mb-3 text-foreground">10. Data and Privacy</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p><strong className="text-foreground">10.1 Privacy Policy:</strong> Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.</p>
                  
                  <p><strong className="text-foreground">10.2 Data Backup:</strong> While we implement backup procedures, you are solely responsible for maintaining backup copies of your content.</p>
                  
                  <p><strong className="text-foreground">10.3 Data Retention:</strong> We will retain your content for as long as your account is active or as needed to provide the Service. You may request deletion of your data at any time.</p>
                  
                  <p><strong className="text-foreground">10.4 Third-Party Services:</strong> The Service uses third-party providers (Supabase for storage, Resend for email delivery) who process your data in accordance with their own privacy policies and our data processing agreements.</p>
                </div>
              </section>

              <Separator />

              {/* Limitation of Liability */}
              <section>
                <h2 className="text-lg font-semibold mb-3 text-foreground">11. Limitation of Liability</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p><strong className="text-foreground">11.1 No Liability:</strong> TO THE MAXIMUM EXTENT PERMITTED BY LAW, ERAS AND ITS AFFILIATES, OFFICERS, EMPLOYEES, AGENTS, AND LICENSORS WILL NOT BE LIABLE FOR:</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Any indirect, incidental, special, consequential, or punitive damages</li>
                    <li>Loss of profits, data, use, goodwill, or other intangible losses</li>
                    <li>Unauthorized access to or alteration of your content</li>
                    <li>Statements or conduct of any third party on the Service</li>
                    <li>Any matter beyond our reasonable control</li>
                    <li>Failed or delayed deliveries of time capsules</li>
                    <li>Loss of sentimental value or emotional distress</li>
                    <li>Errors in AI-generated content or suggestions</li>
                  </ul>
                  
                  <p><strong className="text-foreground">11.2 Maximum Liability:</strong> Our total liability for any claims arising from or related to the Service is limited to the amount you paid us in the 12 months prior to the claim, or $100, whichever is greater.</p>
                </div>
              </section>

              <Separator />

              {/* Termination */}
              <section>
                <h2 className="text-lg font-semibold mb-3 text-foreground">12. Termination</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p><strong className="text-foreground">12.1 Termination by You:</strong> You may terminate your account at any time through the Settings page. Upon termination, your scheduled capsules will still be delivered unless you cancel them first.</p>
                  
                  <p><strong className="text-foreground">12.2 Termination by Us:</strong> We may suspend or terminate your account at any time if:</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>You violate these Terms</li>
                    <li>Your use of the Service poses a security or legal risk</li>
                    <li>We are required to do so by law</li>
                    <li>You have been inactive for an extended period</li>
                    <li>You abuse Service features or engage in fraudulent activity</li>
                  </ul>
                  
                  <p><strong className="text-foreground">12.3 Effect of Termination:</strong> Upon termination, your right to use the Service immediately ceases. We may delete your content, though some information may remain in backups for a limited time. Notifications, achievements, and social interactions will be removed.</p>
                </div>
              </section>

              <Separator />

              {/* Dispute Resolution */}
              <section>
                <h2 className="text-lg font-semibold mb-3 text-foreground">13. Dispute Resolution</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p><strong className="text-foreground">13.1 Informal Resolution:</strong> If you have a dispute with us, please contact us first to attempt to resolve it informally.</p>
                  
                  <p><strong className="text-foreground">13.2 Governing Law:</strong> These Terms are governed by the laws of the jurisdiction in which Eras is incorporated, without regard to conflict of law principles.</p>
                  
                  <p><strong className="text-foreground">13.3 Arbitration:</strong> Any disputes that cannot be resolved informally will be resolved through binding arbitration, rather than in court, except that you may assert claims in small claims court if they qualify.</p>
                </div>
              </section>

              <Separator />

              {/* Miscellaneous */}
              <section>
                <h2 className="text-lg font-semibold mb-3 text-foreground">14. Miscellaneous</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p><strong className="text-foreground">14.1 Entire Agreement:</strong> These Terms constitute the entire agreement between you and Eras regarding the Service.</p>
                  
                  <p><strong className="text-foreground">14.2 Severability:</strong> If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full effect.</p>
                  
                  <p><strong className="text-foreground">14.3 No Waiver:</strong> Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.</p>
                  
                  <p><strong className="text-foreground">14.4 Assignment:</strong> You may not assign or transfer these Terms without our prior written consent. We may assign these Terms without restriction.</p>
                  
                  <p><strong className="text-foreground">14.5 Third-Party Services:</strong> The Service may contain links to third-party websites or services. We are not responsible for the content, terms, or privacy practices of any third-party services.</p>
                  
                  <p><strong className="text-foreground">14.6 Force Majeure:</strong> We are not liable for any failure to perform our obligations due to circumstances beyond our reasonable control, including network outages, natural disasters, or third-party service disruptions.</p>
                </div>
              </section>

              <Separator />

              {/* Contact */}
              <section>
                <h2 className="text-lg font-semibold mb-3 text-foreground">15. Contact Information</h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>If you have any questions about these Terms, please contact us through the Settings page or by email.</p>
                  
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground italic">
                      <strong className="text-foreground">Legal Notice:</strong> These Terms of Service are provided as a template and should be reviewed and customized by a qualified attorney before use in a production environment. They may not cover all legal requirements for your specific jurisdiction or business model.
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
                  <div className="p-3 bg-blue-500/10 rounded-md border border-blue-500/20">
                    <p className="font-medium text-foreground">Version 5.0 - January 8, 2026</p>
                    <p className="text-xs mt-1">Enhanced media features and user experience improvements: Added comprehensive media preview system for videos, photos, and audio with full-screen viewing capabilities; improved draft management with dedicated Draft folder for easy access and loading; expanded media attachment support in capsule creation with persistent caching; optimized click-based interactions across all devices replacing touch-only controls; improved tutorial system integration; and refined notification display system with better mobile z-index handling</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-md border border-blue-500/20">
                    <p className="font-medium text-foreground">Version 4.0 - December 31, 2025</p>
                    <p className="text-xs mt-1">Enhanced achievement disclosures: Specified 57 total achievements, clarified title reward mechanics (cosmetic only, one displayed at a time), expanded fair use policy for achievement system, and added provisions for achievement recategorization</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-md">
                    <p className="font-medium text-foreground">Version 3.0 - December 19, 2025</p>
                    <p className="text-xs mt-1">Added: Themed capsule system (15+ themes), multi-tier achievement system (Common/Uncommon/Rare/Epic/Legendary), Horizon visual effects, custom opening/closing ceremonies, mobile performance optimizations, session-based ceremony persistence, and browser compatibility disclosures</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-md">
                    <p className="font-medium text-foreground">Version 2.0 - November 25, 2025</p>
                    <p className="text-xs mt-1">Added: Social features (Echo system), achievements, AI enhancements, notifications, real-time features, 2FA, legacy titles, and updated delivery policies</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-md">
                    <p className="font-medium text-foreground">Version 1.0 - January 15, 2025</p>
                    <p className="text-xs mt-1">Initial Terms of Service published</p>
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