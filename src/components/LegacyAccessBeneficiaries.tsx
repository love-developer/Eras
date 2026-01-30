/**
 * Legacy Access - Simplified Two-Step Flow
 * 
 * Two-step flow:
 * 1. Beneficiaries (who gets access)
 * 2. Unlock Timing (when they get access)
 * 
 * Key improvements:
 * - Streamlined 2-step process (was 3)
 * - Consolidated trigger configuration
 * - Security info always visible in footer
 * - No cryptographic complexity
 * - Email verification only
 * - Automatic security (no toggles)
 * - 30-day grace period built-in
 * - Clean Eras glassmorphic design
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Shield, 
  Clock, 
  Mail, 
  Phone, 
  UserPlus, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  Timer,
  Send,
  Trash2,
  Info,
  Lock,
  Sparkles,
  ChevronRight,
  Edit3,
  Folder,
  Download,
  Eye,
  Activity,
  XCircle,
  Loader2,
  Search,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { LegacyAccessDisclaimer } from './LegacyAccessDisclaimer';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useAuth } from '../contexts/AuthContext';

// Types matching backend
interface Beneficiary {
  id: string;
  name: string;
  email: string;
  phone?: string;
  personalMessage?: string;
  status: 'pending_unlock' | 'pending' | 'verified' | 'rejected' | 'revoked'; // ✅ NEW: Added pending_unlock
  verifiedAt?: number;
  addedAt: number;
  folderPermissions?: Record<string, 'view' | 'download'>;
  notificationTiming?: 'immediate' | 'deferred'; // ✅ NEW
  notificationSentAt?: number; // ✅ NEW
}

interface LegacyAccessTrigger {
  type: 'inactivity' | 'date';
  inactivityMonths?: number;
  manualUnlockDate?: number;
  gracePeriodDays: number;
  lastActivityAt: number;
  unlockScheduledAt?: number;
  warningEmailSentAt?: number;
}

interface LegacyAccessConfig {
  beneficiaries: Beneficiary[];
  trigger: LegacyAccessTrigger;
  security: {
    enabled: boolean;
    encryptedAtRest: boolean;
    requireEmailVerification: boolean;
    accessLogged: boolean;
  };
}

interface VaultFolder {
  id: string;
  name: string;
  icon?: string;
  description?: string | null;
  itemCount?: number;
  createdAt: string | number;
  isPrivate?: boolean;
}

export function LegacyAccessBeneficiaries() {
  const { session } = useAuth();
  const [config, setConfig] = useState<LegacyAccessConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [daysUntilUnlock, setDaysUntilUnlock] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState<1 | 2>(1);

  // PHASE 7: Folder Permissions State
  const [vaultFolders, setVaultFolders] = useState<VaultFolder[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<Record<string, 'view' | 'download'>>({});
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [folderSearchQuery, setFolderSearchQuery] = useState('');

  // PHASE 7: Edit Beneficiary State
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    personalMessage: '',
    notificationTiming: 'deferred' as 'immediate' | 'deferred' // ✅ NEW: Default to deferred (safer)
  });

  // Load config on mount and when session changes
  useEffect(() => {
    if (session?.access_token) {
      loadConfig();
    }
  }, [session]);

  // PHASE 7: Load vault folders when form is shown
  useEffect(() => {
    if (showAddForm && session?.access_token && vaultFolders.length === 0) {
      loadVaultFolders();
    }
  }, [showAddForm, session]);

  const loadConfig = async () => {
    if (!session?.access_token) {
      console.error('🔐 [Legacy Access] No access token available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔐 [Legacy Access] Loading config...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-access/config`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('🔐 [Legacy Access] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔐 [Legacy Access] Error response:', errorText);
        throw new Error(`Failed to load Legacy Access configuration: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔐 [Legacy Access] Config loaded:', data);
      setConfig(data.config);
      setDaysUntilUnlock(data.daysUntilUnlock);
    } catch (error: any) {
      console.error('🔐 [Legacy Access] Error loading config:', error);
      toast.error('Failed to load Legacy Access settings');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBeneficiary = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }

    if (!session?.access_token) {
      toast.error('Authentication required');
      return;
    }

    try {
      // PHASE 7: Support both add and edit
      const url = editingBeneficiary
        ? `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-access/beneficiary/${editingBeneficiary.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-access/beneficiary`;
      
      const method = editingBeneficiary ? 'PUT' : 'POST';
      
      const payload = {
        ...formData,
        folderPermissions: Object.keys(selectedFolders).length > 0 ? selectedFolders : undefined
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${editingBeneficiary ? 'update' : 'add'} beneficiary`);
      }

      // ✅ NEW: More accurate success message based on notification timing
      if (editingBeneficiary) {
        toast.success('Beneficiary updated!');
      } else {
        toast.success(
          formData.notificationTiming === 'immediate' 
            ? 'Beneficiary added! Verification email sent.' 
            : 'Beneficiary added! They\'ll be notified when the vault unlocks.'
        );
      }
      setFormData({ name: '', email: '', phone: '', personalMessage: '', notificationTiming: 'deferred' });
      setSelectedFolders({});
      setFolderSearchQuery('');
      setShowAddForm(false);
      setEditingBeneficiary(null);
      await loadConfig();
    } catch (error: any) {
      console.error(`Error ${editingBeneficiary ? 'updating' : 'adding'} beneficiary:`, error);
      toast.error(error.message || `Failed to ${editingBeneficiary ? 'update' : 'add'} beneficiary`);
    }
  };

  const handleResendVerification = async (beneficiaryId: string) => {
    if (!session?.access_token) {
      toast.error('Authentication required');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-access/beneficiary/${beneficiaryId}/resend`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Check if it's the Resend testing mode error
        if (data.error === 'EMAIL_TESTING_MODE') {
          toast.error('📧 Email Testing Mode Active', {
            description: `Resend is in testing mode and can only send to ${data.testingEmail}. To send to other recipients, you need to verify a custom domain at resend.com/domains. For now, you can test with your own email address.`,
            duration: 10000
          });
        } else {
          throw new Error(data.error || 'Failed to resend verification');
        }
        return;
      }

      toast.success('Verification email sent!');
    } catch (error: any) {
      console.error('Error resending verification:', error);
      toast.error(error.message || 'Failed to resend verification email');
    }
  };

  // ✅ NEW: Send notification to pending_unlock beneficiary
  const handleSendNotification = async (beneficiaryId: string) => {
    if (!session?.access_token) {
      toast.error('Authentication required');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-access/beneficiary/${beneficiaryId}/notify`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send notification');
      }

      toast.success('Notification sent! Beneficiary will receive verification email.');
      await loadConfig();
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast.error(error.message || 'Failed to send notification');
    }
  };

  const handleRemoveBeneficiary = async (beneficiaryId: string) => {
    if (!confirm('Are you sure you want to remove this beneficiary?')) {
      return;
    }

    if (!session?.access_token) {
      toast.error('Authentication required');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-access/beneficiary/${beneficiaryId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to remove beneficiary');
      }

      toast.success('Beneficiary removed');
      await loadConfig();
    } catch (error) {
      console.error('Error removing beneficiary:', error);
      toast.error('Failed to remove beneficiary');
    }
  };

  const handleUpdateInactivityTrigger = async (months: number) => {
    if (!session?.access_token) {
      toast.error('Authentication required');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-access/trigger/inactivity`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ inactivityMonths: months })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update trigger');
      }

      toast.success(`Inactivity period set to ${months} months`);
      await loadConfig();
    } catch (error) {
      console.error('Error updating trigger:', error);
      toast.error('Failed to update trigger');
    }
  };

  const handleUpdateDateTrigger = async (dateString: string) => {
    if (!session?.access_token) {
      toast.error('Authentication required');
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/legacy-access/trigger/date`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ unlockDate: dateString })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update trigger');
      }

      toast.success('Unlock date updated');
      await loadConfig();
    } catch (error) {
      console.error('Error updating trigger:', error);
      toast.error('Failed to update trigger');
    }
  };

  // PHASE 7: Load vault folders
  const loadVaultFolders = async () => {
    if (!session?.access_token) {
      toast.error('Authentication required');
      return;
    }

    try {
      setLoadingFolders(true);
      console.log('🔐 [Legacy Access] Loading vault folders...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/vault/folders`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('🔐 [Legacy Access] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔐 [Legacy Access] Error response:', errorText);
        throw new Error(`Failed to load vault folders: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔐 [Legacy Access] Vault folders loaded:', data);
      setVaultFolders(data.folders);
    } catch (error: any) {
      console.error('🔐 [Legacy Access] Error loading vault folders:', error);
      toast.error('Failed to load vault folders');
    } finally {
      setLoadingFolders(false);
    }
  };

  // Show auth required message if no session
  if (!session) {
    return (
      <div className="text-center py-12">
        <Lock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Please sign in to access Legacy Access settings</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Failed to load Legacy Access settings</p>
        <Button 
          onClick={() => loadConfig()} 
          variant="outline" 
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  const verifiedBeneficiaries = config.beneficiaries.filter(b => b.status === 'verified').length;
  const pendingBeneficiaries = config.beneficiaries.filter(b => b.status === 'pending' || b.status === 'pending_unlock').length;
  const totalBeneficiaries = config.beneficiaries.filter(b => b.status !== 'revoked').length;

  // Helper: Filter folders with content and apply search
  const getFilteredFolders = () => {
    // Filter out empty folders
    const foldersWithContent = vaultFolders.filter(folder => (folder.itemCount || 0) > 0);
    
    // Apply search query
    if (!folderSearchQuery.trim()) {
      return foldersWithContent;
    }
    
    const query = folderSearchQuery.toLowerCase();
    return foldersWithContent.filter(folder => {
      const nameMatch = folder.name?.toLowerCase().includes(query);
      const descMatch = folder.description?.toLowerCase().includes(query);
      return nameMatch || descMatch;
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header - Mobile Optimized */}
      <div>
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <div className="p-1.5 sm:p-2 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex-shrink-0">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-2xl font-semibold">Legacy Access</h2>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 sm:line-clamp-none">
              Secure digital inheritance for your time capsules
            </p>
          </div>
        </div>
      </div>

      {/* Legal Disclaimer */}
      <LegacyAccessDisclaimer />

      {/* Progress Steps - 2 Steps */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 p-2 sm:p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
        {[
          { num: 1, label: 'Who Gets Access', shortLabel: 'Who', icon: UserPlus, color: 'purple' },
          { num: 2, label: 'When They Get It', shortLabel: 'When', icon: Timer, color: 'cyan' }
        ].map((step) => (
          <button
            key={step.num}
            onClick={() => setActiveStep(step.num as 1 | 2)}
            className={`flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-lg transition-all ${
              activeStep === step.num
                ? step.color === 'purple'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-cyan-500 text-white shadow-lg'
                : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 ${
              activeStep === step.num
                ? 'bg-white/20'
                : 'bg-slate-100 dark:bg-slate-700'
            }`}>
              <step.icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="text-center w-full">
              <div className="text-[10px] sm:text-xs opacity-75 whitespace-nowrap">Step {step.num}</div>
              <div className="text-xs sm:text-sm font-medium px-1 truncate sm:hidden">{step.shortLabel}</div>
              <div className="hidden sm:block text-xs sm:text-sm font-medium px-1 truncate">{step.label}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Step 1: Beneficiaries */}
      {activeStep === 1 && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Add Beneficiary Card */}
          <Card className="border-2 border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                {editingBeneficiary ? (
                  <Edit3 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                ) : (
                  <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                )}
                <span>{editingBeneficiary ? 'Edit Beneficiary' : 'Add Beneficiary'}</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {editingBeneficiary 
                  ? 'Update beneficiary information and permissions' 
                  : 'Designate a trusted person to receive access'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showAddForm ? (
                <Button 
                  onClick={() => setShowAddForm(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm"
                >
                  <UserPlus className="w-4 h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                  <span className="whitespace-nowrap">Add Beneficiary</span>
                </Button>
              ) : (
                <form onSubmit={handleAddBeneficiary} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Jane Doe"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="jane@example.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Personal Message (Optional)</Label>
                    <Textarea
                      id="message"
                      value={formData.personalMessage}
                      onChange={(e) => setFormData({ ...formData, personalMessage: e.target.value })}
                      placeholder="A message they'll see when accessing your legacy content..."
                      rows={3}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      This message will be shown to your beneficiary when they access your content
                    </p>
                  </div>

                  {/* ✅ NEW: Notification Timing Selector */}
                  <div className="space-y-3 p-4 border border-cyan-200 dark:border-cyan-800 rounded-lg bg-cyan-50/30 dark:bg-cyan-950/20">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <Label className="text-sm font-semibold">When should {formData.name || 'they'} be notified?</Label>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Option 1: Notify at Unlock (Deferred) */}
                      <label 
                        className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.notificationTiming === 'deferred'
                            ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/50'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="notificationTiming"
                          value="deferred"
                          checked={formData.notificationTiming === 'deferred'}
                          onChange={(e) => setFormData({ ...formData, notificationTiming: e.target.value as 'immediate' | 'deferred' })}
                          className="mt-1 w-4 h-4 text-cyan-600 focus:ring-cyan-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Notify when vault unlocks</span>
                            <Badge variant="outline" className="text-[10px] bg-cyan-100 dark:bg-cyan-900 border-cyan-300 dark:border-cyan-700">
                              Default
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            They won't know until the vault becomes available. More private, but they won't be able to verify their email until then.
                          </p>
                        </div>
                      </label>

                      {/* Option 2: Notify Immediately */}
                      <label 
                        className={`flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.notificationTiming === 'immediate'
                            ? 'border-green-500 bg-green-50 dark:bg-green-950/50'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="notificationTiming"
                          value="immediate"
                          checked={formData.notificationTiming === 'immediate'}
                          onChange={(e) => setFormData({ ...formData, notificationTiming: e.target.value as 'immediate' | 'deferred' })}
                          className="mt-1 w-4 h-4 text-green-600 focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Notify immediately</span>
                            <Badge variant="outline" className="text-[10px] bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700">
                              Recommended
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            They'll receive a verification email now and can prepare. Ensures their email is valid when needed.
                          </p>
                        </div>
                      </label>
                    </div>
                    
                    <div className="flex items-start gap-2 p-2 bg-blue-50/50 dark:bg-blue-950/30 rounded border border-blue-200/50 dark:border-blue-800/50">
                      <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-blue-900 dark:text-blue-200">
                        <strong>Tip:</strong> Immediate notification is safer - it confirms the email works and lets them verify now while the address is active.
                      </p>
                    </div>
                  </div>

                  {/* PHASE 7: Enhanced Folder Permissions Selector */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <Label>Vault Folders Access</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Select which folders this beneficiary can access. Leave empty for time capsules only.
                    </p>
                    
                    {loadingFolders ? (
                      <div className="flex items-center justify-center py-6 border border-border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                        <span className="ml-2 text-sm text-muted-foreground">Loading folders...</span>
                      </div>
                    ) : vaultFolders.length === 0 ? (
                      <div className="p-4 border border-border rounded-lg bg-slate-50 dark:bg-slate-900/50 text-center">
                        <Folder className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                        <p className="text-xs text-muted-foreground">
                          No vault folders with content yet. Folders will appear here once you add media to them.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Search and Bulk Actions */}
                        <div className="flex items-center gap-2 p-2 border border-border rounded-lg bg-white dark:bg-slate-900">
                          <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input
                              placeholder="Search folders..."
                              value={folderSearchQuery}
                              onChange={(e) => setFolderSearchQuery(e.target.value)}
                              className="pl-8 pr-8 h-8 text-xs bg-transparent border-0 focus-visible:ring-0"
                            />
                            {folderSearchQuery && (
                              <button
                                onClick={() => setFolderSearchQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                              >
                                <X className="w-3 h-3 text-muted-foreground" />
                              </button>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newSelected: Record<string, 'view' | 'download'> = {};
                                getFilteredFolders().forEach(folder => {
                                  newSelected[folder.id] = 'view';
                                });
                                setSelectedFolders(newSelected);
                              }}
                              className="h-8 text-[10px] px-2"
                            >
                              Select All
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedFolders({})}
                              className="h-8 text-[10px] px-2"
                            >
                              Clear
                            </Button>
                          </div>
                        </div>

                        {/* Folder List */}
                        <div className="max-h-80 overflow-y-auto border border-border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                          {getFilteredFolders().length === 0 ? (
                            <div className="p-6 text-center">
                              <Search className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                              <p className="text-xs text-muted-foreground">
                                No folders match "{folderSearchQuery}"
                              </p>
                            </div>
                          ) : (
                            <div className="p-2 space-y-1">
                              {getFilteredFolders().map(folder => (
                                <div 
                                  key={folder.id} 
                                  className="flex items-start gap-2.5 p-2.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors group"
                                >
                                  <Checkbox 
                                    checked={!!selectedFolders[folder.id]}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedFolders({...selectedFolders, [folder.id]: 'view'});
                                      } else {
                                        const newFolders = {...selectedFolders};
                                        delete newFolders[folder.id];
                                        setSelectedFolders(newFolders);
                                      }
                                    }}
                                    className="flex-shrink-0 mt-0.5"
                                  />
                                  <div className="flex-shrink-0 mt-0.5">
                                    <span className="text-base">{folder.icon || '📁'}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm truncate" title={folder.name || 'Untitled Folder'}>
                                        {folder.name || 'Untitled Folder'}
                                      </span>
                                      {folder.isPrivate && (
                                        <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                                      )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground truncate">
                                      {folder.itemCount || 0} {folder.itemCount === 1 ? 'item' : 'items'}
                                      {folder.description && ` • ${folder.description}`}
                                    </p>
                                  </div>
                                  {selectedFolders[folder.id] && (
                                    <Select 
                                      value={selectedFolders[folder.id]}
                                      onValueChange={(val) => setSelectedFolders({
                                        ...selectedFolders, 
                                        [folder.id]: val as 'view' | 'download'
                                      })}
                                    >
                                      <SelectTrigger className="w-24 h-7 text-[10px] bg-white dark:bg-slate-900 flex-shrink-0">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="view">
                                          <div className="flex items-center gap-1.5">
                                            <Eye className="w-3 h-3" />
                                            <span>View Only</span>
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="download">
                                          <div className="flex items-center gap-1.5">
                                            <Download className="w-3 h-3" />
                                            <span>Download</span>
                                          </div>
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    
                    {/* Selected Summary - Enhanced Cards */}
                    {Object.keys(selectedFolders).length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                          <span className="text-xs text-muted-foreground">
                            {Object.keys(selectedFolders).length} {Object.keys(selectedFolders).length === 1 ? 'folder' : 'folders'} selected
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(selectedFolders).map(([folderId, permission]) => {
                            const folder = vaultFolders.find(f => f.id === folderId);
                            if (!folder) return null;
                            
                            const permissionConfig = {
                              view: { icon: Eye, label: 'View', color: 'text-blue-600 dark:text-blue-400' },
                              download: { icon: Download, label: 'Download', color: 'text-purple-600 dark:text-purple-400' }
                            }[permission];
                            
                            const PermIcon = permissionConfig.icon;
                            
                            return (
                              <div 
                                key={folderId}
                                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-border rounded-lg text-xs group hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                              >
                                <span className="text-sm">{folder.icon || '📁'}</span>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-medium truncate max-w-[120px]" title={folder.name}>
                                    {folder.name}
                                  </span>
                                  <div className={`flex items-center gap-1 text-[10px] ${permissionConfig.color}`}>
                                    <PermIcon className="w-2.5 h-2.5" />
                                    <span>{permissionConfig.label}</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newFolders = {...selectedFolders};
                                    delete newFolders[folderId];
                                    setSelectedFolders(newFolders);
                                  }}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Helpful Tip */}
                    {vaultFolders.length > 0 && Object.keys(selectedFolders).length === 0 && (
                      <div className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg">
                        <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-900 dark:text-amber-200">
                          <strong>Tip:</strong> If no folders selected, beneficiary will have <strong>no vault access</strong>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      type="submit" 
                      className="flex-1 bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                    >
                      {editingBeneficiary ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                          <span className="whitespace-nowrap">Update Beneficiary</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                          <span className="whitespace-nowrap">Send Verification</span>
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowAddForm(false);
                        setFormData({ name: '', email: '', phone: '', personalMessage: '' });
                        setSelectedFolders({});
                        setFolderSearchQuery('');
                        setEditingBeneficiary(null);
                      }}
                      className="sm:w-auto text-xs sm:text-sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Beneficiary List */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="truncate">Beneficiaries ({totalBeneficiaries})</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {verifiedBeneficiaries > 0 ? (
                  <span className="text-green-600 dark:text-green-400">
                    ✓ {verifiedBeneficiaries} verified
                  </span>
                ) : (
                  'No verified yet'
                )}
                {pendingBeneficiaries > 0 && (
                  <span className="ml-1 sm:ml-2 text-amber-600 dark:text-amber-400">
                    • {pendingBeneficiaries} pending
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {totalBeneficiaries === 0 ? (
                <div className="text-center py-8">
                  <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    No beneficiaries added yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add a trusted person to enable Legacy Access
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {config.beneficiaries
                    .filter(b => b.status !== 'revoked')
                    .map((beneficiary) => (
                      <div
                        key={beneficiary.id}
                        className="p-3 sm:p-4 border-2 border-border rounded-xl bg-card hover:shadow-md transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                              <h4 className="font-medium text-sm sm:text-base truncate">{beneficiary.name}</h4>
                              <Badge 
                                variant={beneficiary.status === 'verified' ? 'default' : 'outline'}
                                className={`text-[10px] sm:text-xs whitespace-nowrap ${
                                  beneficiary.status === 'verified' 
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                    : beneficiary.status === 'pending'
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400'
                                }`}
                              >
                                {beneficiary.status === 'verified' ? (
                                  <><CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" /> Verified</>
                                ) : beneficiary.status === 'pending' ? (
                                  <><AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" /> Pending</>
                                ) : (
                                  <><Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" /> Not Notified</>
                                )}
                              </Badge>
                            </div>
                            
                            <div className="space-y-1 text-[10px] sm:text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <Mail className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{beneficiary.email}</span>
                              </div>
                              {beneficiary.phone && (
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                  <Phone className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{beneficiary.phone}</span>
                                </div>
                              )}
                              <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[9px] sm:text-[10px]">
                                <Clock className="w-3 h-3 flex-shrink-0" />
                                <span className="whitespace-nowrap">Added {new Date(beneficiary.addedAt).toLocaleDateString()}</span>
                                {beneficiary.verifiedAt && (
                                  <span className="text-green-600 dark:text-green-400 whitespace-nowrap">
                                    • Verified {new Date(beneficiary.verifiedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              {beneficiary.personalMessage && (
                                <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded text-[10px] sm:text-xs italic line-clamp-2 sm:line-clamp-none">
                                  "{beneficiary.personalMessage}"
                                </div>
                              )}
                              {beneficiary.folderPermissions && Object.keys(beneficiary.folderPermissions).length > 0 && (
                                <div className="mt-2 flex flex-wrap items-center gap-1">
                                  <Folder className="w-3 h-3 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                  <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                                    Access to {Object.keys(beneficiary.folderPermissions).length} folder{Object.keys(beneficiary.folderPermissions).length === 1 ? '' : 's'}
                                  </span>
                                  {Object.entries(beneficiary.folderPermissions).slice(0, 2).map(([folderId, permission]) => (
                                    <Badge 
                                      key={folderId}
                                      variant="outline"
                                      className="text-[8px] sm:text-[9px] bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 px-1 py-0"
                                    >
                                      {permission}
                                    </Badge>
                                  ))}
                                  {Object.keys(beneficiary.folderPermissions).length > 2 && (
                                    <span className="text-[8px] sm:text-[9px] text-muted-foreground">
                                      +{Object.keys(beneficiary.folderPermissions).length - 2} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-row sm:flex-col gap-2 self-end sm:self-start">
                            {/* ✅ NEW: Send Notification Now button for pending_unlock */}
                            {beneficiary.status === 'pending_unlock' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSendNotification(beneficiary.id)}
                                className="text-[10px] sm:text-xs whitespace-nowrap px-2 sm:px-3 border-cyan-600 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/20"
                              >
                                <Send className="w-3 h-3 mr-1 flex-shrink-0" />
                                Send Notification
                              </Button>
                            )}
                            {beneficiary.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResendVerification(beneficiary.id)}
                                className="text-[10px] sm:text-xs whitespace-nowrap px-2 sm:px-3"
                              >
                                <Send className="w-3 h-3 mr-1 flex-shrink-0" />
                                Resend
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingBeneficiary(beneficiary);
                                setFormData({
                                  name: beneficiary.name,
                                  email: beneficiary.email,
                                  phone: beneficiary.phone || '',
                                  personalMessage: beneficiary.personalMessage || '',
                                  notificationTiming: beneficiary.notificationTiming || 'deferred'
                                });
                                setSelectedFolders(beneficiary.folderPermissions || {});
                                setShowAddForm(true);
                                // Scroll to form
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="text-[10px] sm:text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 whitespace-nowrap px-2 sm:px-3"
                            >
                              <Edit3 className="w-3 h-3 mr-1 flex-shrink-0" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveBeneficiary(beneficiary.id)}
                              className="text-[10px] sm:text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 whitespace-nowrap px-2 sm:px-3"
                            >
                              <Trash2 className="w-3 h-3 mr-1 flex-shrink-0" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Unlock Timing (Consolidated) */}
      {activeStep === 2 && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Grace Period Warning Banner (if active) - ALWAYS ON TOP */}
          {config.trigger.unlockScheduledAt && (
            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-300 dark:border-orange-700 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30 flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-orange-900 dark:text-orange-200 mb-1 text-sm sm:text-base">
                    ⚠️ Grace Period Active
                  </p>
                  <p className="text-xs sm:text-sm text-orange-800 dark:text-orange-300 mb-3">
                    Your vault will unlock in{' '}
                    <strong className="text-orange-600 dark:text-orange-400 text-base sm:text-lg">
                      {Math.max(0, Math.ceil((config.trigger.unlockScheduledAt - Date.now()) / (24 * 60 * 60 * 1000)))} days
                    </strong>
                    {' '}on{' '}
                    {new Date(config.trigger.unlockScheduledAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-xs text-orange-700 dark:text-orange-400 mb-3">
                    Log in to Eras to cancel the scheduled unlock and maintain access to your vault.
                  </p>
                  <Button 
                    size="sm"
                    variant="outline"
                    className="w-full sm:w-auto bg-white dark:bg-slate-900 border-orange-300 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/20 text-orange-700 dark:text-orange-300 text-xs sm:text-sm"
                    onClick={async () => {
                      if (!confirm('Cancel the scheduled unlock? You will need to remain inactive again to trigger it.')) {
                        return;
                      }
                      
                      try {
                        toast.info('Cancel unlock feature requires the email link. Check your email for the cancel button.');
                      } catch (error) {
                        toast.error('Failed to cancel unlock');
                        console.error(error);
                      }
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Scheduled Unlock
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* CONSOLIDATED CARD: Unlock Timing */}
          <Card className="border-2 border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-950/20">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Timer className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span>Unlock Timing</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Configure when beneficiaries can access your content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Last Activity Display */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Last Activity</p>
                  <p className="text-sm sm:text-base font-medium">
                    {new Date(config.trigger.lastActivityAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-xs whitespace-nowrap">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </div>

              {/* Days Since Last Activity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-muted-foreground mb-1">Days Since Login</p>
                  <p className="text-xl sm:text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                    {Math.floor((Date.now() - config.trigger.lastActivityAt) / (24 * 60 * 60 * 1000))}
                  </p>
                </div>
                
                {config.trigger.type === 'inactivity' && daysUntilUnlock !== null && (
                  <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-muted-foreground mb-1">Days Until Unlock</p>
                    <p className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {daysUntilUnlock > 0 ? daysUntilUnlock : 0}
                    </p>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-slate-200 dark:border-slate-700"></div>

              {/* Inactivity Progress (only if no grace period) */}
              {config.trigger.type === 'inactivity' && !config.trigger.unlockScheduledAt && daysUntilUnlock !== null && daysUntilUnlock > 0 && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-200">
                      Inactivity Threshold Progress
                    </p>
                    <Badge variant="outline" className="bg-white dark:bg-slate-900 text-xs">
                      {Math.floor(((config.trigger.inactivityMonths || 6) * 30 - daysUntilUnlock) / ((config.trigger.inactivityMonths || 6) * 30) * 100)}%
                    </Badge>
                  </div>
                  <Progress 
                    value={Math.max(0, 100 - (daysUntilUnlock / ((config.trigger.inactivityMonths || 6) * 30)) * 100)} 
                    className="h-2 mb-2"
                  />
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    <Info className="w-3 h-3 inline mr-1" />
                    {daysUntilUnlock} days remaining before 30-day grace period begins
                  </p>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-slate-200 dark:border-slate-700"></div>

              {/* Trigger Configuration Section */}
              <div className="space-y-4">
                <h3 className="font-medium text-sm">When should beneficiaries receive access?</h3>

                {/* Trigger Type Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (config.trigger.type !== 'inactivity') {
                        handleUpdateInactivityTrigger(6);
                      }
                    }}
                    className={`p-4 border-2 rounded-xl transition-all ${
                      config.trigger.type === 'inactivity'
                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/20 shadow-lg'
                        : 'border-border hover:border-cyan-300'
                    }`}
                  >
                    <Clock className="w-6 h-6 mx-auto mb-2 text-cyan-600 dark:text-cyan-400" />
                    <div className="text-sm font-medium">Inactivity Period</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      After verified inactivity
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      if (config.trigger.type !== 'date') {
                        const dateStr = prompt('Enter unlock date (YYYY-MM-DD):');
                        if (dateStr) {
                          handleUpdateDateTrigger(dateStr);
                        }
                      }
                    }}
                    className={`p-4 border-2 rounded-xl transition-all ${
                      config.trigger.type === 'date'
                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/20 shadow-lg'
                        : 'border-border hover:border-cyan-300'
                    }`}
                  >
                    <Calendar className="w-6 h-6 mx-auto mb-2 text-cyan-600 dark:text-cyan-400" />
                    <div className="text-sm font-medium">Specific Date</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      On scheduled date
                    </div>
                  </button>
                </div>

                {/* Inactivity Period Configuration */}
                {config.trigger.type === 'inactivity' && (
                  <div className="space-y-3">
                    <Label>Inactivity Period</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[3, 6, 12, 24].map((months) => (
                        <button
                          key={months}
                          type="button"
                          onClick={() => handleUpdateInactivityTrigger(months)}
                          className={`p-3 border-2 rounded-lg transition-all ${
                            config.trigger.inactivityMonths === months
                              ? 'border-cyan-500 bg-cyan-100 dark:bg-cyan-900/30 font-medium'
                              : 'border-border hover:border-cyan-300'
                          }`}
                        >
                          <div className="text-lg font-bold">{months}</div>
                          <div className="text-xs text-muted-foreground">
                            {months === 1 ? 'month' : 'months'}
                          </div>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <Info className="w-3 h-3 inline mr-1" />
                      30-day grace period applies after threshold
                    </p>
                  </div>
                )}

                {/* Specific Date Configuration */}
                {config.trigger.type === 'date' && (
                  <div className="space-y-3">
                    <Label htmlFor="unlock-date">Unlock Date</Label>
                    <Input
                      id="unlock-date"
                      type="date"
                      value={config.trigger.manualUnlockDate 
                        ? new Date(config.trigger.manualUnlockDate).toISOString().split('T')[0]
                        : ''
                      }
                      onChange={(e) => {
                        if (e.target.value) {
                          handleUpdateDateTrigger(e.target.value);
                        }
                      }}
                      min={new Date().toISOString().split('T')[0]}
                    />

                    {/* Date Preview */}
                    {config.trigger.manualUnlockDate && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium">Scheduled Unlock</span>
                          </div>
                          <Badge variant="outline" className="bg-white dark:bg-gray-900">
                            {new Date(config.trigger.manualUnlockDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </Badge>
                        </div>
                        
                        {daysUntilUnlock !== null && daysUntilUnlock > 0 && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Days until unlock</span>
                              <span className="font-medium text-orange-600 dark:text-orange-400">
                                {daysUntilUnlock} days
                              </span>
                            </div>
                            <Progress 
                              value={Math.max(0, 100 - (daysUntilUnlock / 365) * 100)} 
                              className="h-2"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Persistent Security Badge */}
      <Card className="border-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20 flex-shrink-0">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
                Automatic Security Active
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span>AES-256 Encryption</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span>Email Verification</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span>Access Logging</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span>30-Day Grace Period</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                <Info className="w-3 h-3 inline mr-1" />
                No configuration required - security is handled automatically
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}