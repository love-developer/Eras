import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { 
  User, 
  Lock, 
  Shield, 
  Mail, 
  Phone, 
  CheckCircle, 
  AlertCircle,
  Key,
  Smartphone,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  Check,
  Database,
  Trash2,
  AlertTriangle,
  FileText,
  ExternalLink,
  Bell,
  ChevronUp,
  Calendar,
  Sparkles,
  Download,
  PackageOpen,
  Upload,
  Image as ImageIcon,
  Camera,
  X
} from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner@2.0.3';
import { projectId } from '../utils/supabase/info';
import { DatabaseService } from '../utils/supabase/database';
import { motion, AnimatePresence } from 'motion/react';
import { TitleUnlockAdminPreview } from './TitleUnlockAdminPreview';
import { AchievementUnlockAdminPreview } from './AchievementUnlockAdminPreview';
import { EpicHorizonPreview } from './EpicHorizonPreview';
import { Avatar } from './Avatar';
import { ProfilePictureUploadModal } from './ProfilePictureUploadModal';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../hooks/useAuth';


interface SettingsProps {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  onProfileUpdate?: (userData: { firstName: string; lastName: string }) => void;
  onDataChange?: () => void; // Callback when capsule data changes (restore, etc.)
  initialSection?: 'profile' | 'password' | 'security' | 'storage' | 'notifications' | 'account';
  onReplayOnboarding?: (moduleId: string) => void; // Trigger onboarding replay
}

export function Settings({ user, onProfileUpdate, onDataChange, initialSection, onReplayOnboarding }: SettingsProps) {
  // Section refs for scrolling
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // Scroll to top visibility state
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  
  // Profile picture state
  const { session } = useAuth();
  const { profile, uploading, deleteAvatar, refetchProfile } = useProfile();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false); // New hybrid modal
  
  // Profile state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);

  // Account deletion state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailDeliveryConfirmations: true,
    emailCapsuleReceived: true,
    emailDeliveryReminders: true,
    emailWeeklySummary: false,
    inAppNotifications: true,
    notificationSound: true,
    allowEchoResponses: true,
  });
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  // Data export state
  const [isExportingData, setIsExportingData] = useState(false);
  
  // Access token for Archive
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Demo dialog states
  const [showUploadDemo, setShowUploadDemo] = useState(false);
  const [showSearchDemo, setShowSearchDemo] = useState(false);
  const [showEchoNotificationTest, setShowEchoNotificationTest] = useState(false);
  
  // Developer Tools
  const [showEpicHorizonPreview, setShowEpicHorizonPreview] = useState(false);

  // Load user metadata on mount
  useEffect(() => {
    loadUserMetadata();
    check2FAStatus();
    loadNotificationPreferences();
    loadAccessToken();
  }, []);
  
  // Load access token for TrashManager
  const loadAccessToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      setAccessToken(session.access_token);
    }
  };

  // Scroll detection for back-to-top button
  useEffect(() => {
    const findScrollableParent = (element: HTMLElement | null): HTMLElement | null => {
      if (!element) return null;
      
      let parent = element.parentElement;
      while (parent && parent !== document.body) {
        const overflowY = window.getComputedStyle(parent).overflowY;
        const hasScroll = parent.scrollHeight > parent.clientHeight;
        
        if ((overflowY === 'auto' || overflowY === 'scroll') && hasScroll) {
          return parent;
        }
        parent = parent.parentElement;
      }
      return null;
    };

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      const scrollY = target === window || target === document ? 
        (window.scrollY || window.pageYOffset) : 
        target.scrollTop;
      
      const shouldShow = scrollY > 400;
      setShowScrollTop(shouldShow);
    };

    let scrollableParent: HTMLElement | null = null;
    const timer = setTimeout(() => {
      scrollableParent = findScrollableParent(containerRef.current);
      
      if (scrollableParent) {
        scrollableParent.addEventListener('scroll', handleScroll, { passive: true });
      } else {
        window.addEventListener('scroll', handleScroll, { passive: true });
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scrollableParent) {
        scrollableParent.removeEventListener('scroll', handleScroll);
      } else {
        window.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    if (isScrolling) return;
    
    setIsScrolling(true);
    
    const findScrollableParent = (element: HTMLElement | null): HTMLElement | null => {
      if (!element) return null;
      
      let parent = element.parentElement;
      while (parent && parent !== document.body) {
        const overflowY = window.getComputedStyle(parent).overflowY;
        const hasScroll = parent.scrollHeight > parent.clientHeight;
        
        if ((overflowY === 'auto' || overflowY === 'scroll') && hasScroll) {
          return parent;
        }
        parent = parent.parentElement;
      }
      return null;
    };
    
    const scrollableParent = findScrollableParent(containerRef.current);
    
    if (scrollableParent) {
      scrollableParent.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
    
    setTimeout(() => {
      setIsScrolling(false);
    }, 1000);
  };



  const loadUserMetadata = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser?.user_metadata) {
        setFirstName(currentUser.user_metadata.firstName || currentUser.user_metadata.first_name || '');
        setLastName(currentUser.user_metadata.lastName || currentUser.user_metadata.last_name || '');
        setPhoneNumber(currentUser.user_metadata.phone || currentUser.phone || '');
      }
    } catch (error) {
      console.error('Error loading user metadata:', error);
    }
  };

  const loadNotificationPreferences = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser?.user_metadata?.notificationPreferences) {
        setNotificationPrefs({
          ...notificationPrefs,
          ...currentUser.user_metadata.notificationPreferences
        });
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  const check2FAStatus = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        setTwoFactorEnabled(factors && factors.totp && factors.totp.length > 0);
      }
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!firstName.trim()) {
      toast.error('First name is required');
      return;
    }

    setIsUpdatingProfile(true);
    setProfileSuccess(false);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phoneNumber.trim()
        }
      });

      if (error) throw error;

      try {
        await DatabaseService.updateUserProfile(user.id, {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          display_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          email: user.email
        });
        
        const receivedCacheKey = `received_capsules_${user.id}`;
        try {
          localStorage.removeItem(receivedCacheKey);
        } catch (error) {
          console.warn('Could not clear cache:', error);
        }
      } catch (profileError) {
        console.error('⚠️ Failed to update KV profile:', profileError);
      }

      setProfileSuccess(true);
      toast.success('Profile updated successfully!');
      
      if (onProfileUpdate) {
        onProfileUpdate({ firstName: firstName.trim(), lastName: lastName.trim() });
      }

      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    if (newPassword === currentPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    setIsChangingPassword(true);
    setPasswordSuccess(false);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (signInError) {
        toast.error('Current password is incorrect');
        setIsChangingPassword(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      setPasswordSuccess(true);
      toast.success('Password changed successfully!');
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleEnable2FA = async () => {
    setIsEnabling2FA(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Eras Time Capsule'
      });

      if (error) throw error;

      if (data) {
        setQrCode(data.totp.qr_code);
        setTotpSecret(data.totp.secret);
        setShow2FASetup(true);
        toast.success('Scan the QR code with your authenticator app');
      }
    } catch (error: any) {
      console.error('Error enabling 2FA:', error);
      toast.error(error.message || 'Failed to enable two-factor authentication');
    } finally {
      setIsEnabling2FA(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setIsVerifying2FA(true);
    try {
      const factors = await supabase.auth.mfa.listFactors();
      if (!factors.data?.totp?.[0]) {
        throw new Error('No TOTP factor found');
      }

      const factorId = factors.data.totp[0].id;

      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verificationCode
      });

      if (error) throw error;

      setTwoFactorEnabled(true);
      setShow2FASetup(false);
      setVerificationCode('');
      toast.success('Two-factor authentication enabled successfully!');
    } catch (error: any) {
      console.error('Error verifying 2FA:', error);
      toast.error(error.message || 'Invalid verification code');
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      return;
    }

    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors?.totp?.[0]) {
        const { error } = await supabase.auth.mfa.unenroll({
          factorId: factors.totp[0].id
        });

        if (error) throw error;

        setTwoFactorEnabled(false);
        toast.success('Two-factor authentication disabled');
      }
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      toast.error(error.message || 'Failed to disable two-factor authentication');
    }
  };

  const copySecretToClipboard = () => {
    navigator.clipboard.writeText(totpSecret);
    setSecretCopied(true);
    toast.success('Secret copied to clipboard');
    setTimeout(() => setSecretCopied(false), 2000);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    if (!deleteConfirmPassword) {
      toast.error('Please enter your password');
      return;
    }

    setIsDeletingAccount(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: deleteConfirmPassword
      });

      if (signInError) {
        toast.error('Incorrect password');
        setIsDeletingAccount(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No access token available');
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/delete-account`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete account data');
      }

      await supabase.auth.signOut();
      
      toast.success('Account scheduled for deletion. Sign in within 30 days to reactivate!');
      
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);

    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error(error.message || 'Failed to delete account');
      setIsDeletingAccount(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSavingNotifications(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          notificationPreferences: notificationPrefs
        }
      });

      if (error) throw error;

      toast.success('Notification preferences saved!');
    } catch (error: any) {
      console.error('Error saving notification preferences:', error);
      toast.error(error.message || 'Failed to save notification preferences');
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleExportData = async () => {
    setIsExportingData(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No access token available');
      }

      toast.info('Generating your data export...', { duration: 3000 });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-f9be53a7/api/user-data-export`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const data = await response.json();
      
      // Create a downloadable JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `eras-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully! Check your downloads.');
    } catch (error: any) {
      console.error('Error exporting data:', error);
      toast.error(error.message || 'Failed to export data');
    } finally {
      setIsExportingData(false);
    }
  };

  // Profile picture handlers
  const handleDeleteAvatar = async () => {
    try {
      await deleteAvatar();
      toast.success('Profile picture removed!', { icon: '🗑️' });
      setShowDeleteConfirm(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete profile picture');
    }
  };

  const handleUploadSuccess = () => {
    toast.success('Profile picture updated!', { icon: '✅' });
    refetchProfile();
    setShowUploadModal(false);
  };

  const userEmail = session?.user?.email || '';
  const userName = session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || '';

  return (
    <div ref={containerRef} className="max-w-5xl mx-auto space-y-6 md:space-y-8 px-4 md:px-6 pb-24">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">
          Settings
        </h1>
        <p className="text-black text-base md:text-lg">
          Manage your account and preferences
        </p>
      </motion.div>

      {/* Profile Information - Merged with Avatar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="border-purple-500/20 bg-slate-900/40 backdrop-blur-xl shadow-2xl shadow-purple-500/10 hover:shadow-purple-500/20 hover:border-purple-500/30 transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-purple-600 md:bg-gradient-to-br md:from-purple-600 md:to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/50 shrink-0">
                <User className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl md:text-2xl font-bold text-white">Profile Information</CardTitle>
                <CardDescription className="text-white text-sm md:text-base">Update your account details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6">
            {/* Avatar and Form Fields - Horizontal Layout */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left: Profile Picture */}
              <div className="flex flex-col items-center md:items-start gap-3 md:w-48 shrink-0">
                <div 
                  onClick={() => setShowProfileModal(true)}
                  className="cursor-pointer group relative"
                >
                  <Avatar
                    src={profile?.avatar_url}
                    name={userName}
                    email={userEmail}
                    size="xl"
                    alt="Your profile picture"
                    className="w-32 h-32 ring-4 ring-purple-500/30 group-hover:ring-purple-500/50 transition-all duration-200"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                </div>
                <p className="text-xs text-black text-center md:text-left">
                  Click photo to update. Square image, 400×400px min. Max 5MB.
                </p>
              </div>

              {/* Right: Form Fields */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-white text-sm md:text-base">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter your first name"
                      className="bg-slate-800/50 border-purple-500/20 text-white placeholder:text-slate-500 focus:border-purple-500/50 h-11 md:h-12 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-white text-sm md:text-base">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter your last name"
                      className="bg-slate-800/50 border-purple-500/20 text-white placeholder:text-slate-500 focus:border-purple-500/50 h-11 md:h-12 text-base"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white text-sm md:text-base">Email</Label>
                  <Input
                    id="email"
                    value={userEmail}
                    disabled
                    className="bg-slate-800/30 border-purple-500/10 text-slate-400 h-11 md:h-12 text-base cursor-not-allowed"
                  />
                </div>

                {profileSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  >
                    <Alert className="bg-green-500/10 border-green-500/30 shadow-lg shadow-green-500/20">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <AlertDescription className="text-green-200 font-medium">
                        ✓ Profile updated successfully!
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                <Button
                  onClick={handleUpdateProfile}
                  disabled={isUpdatingProfile}
                  className="w-full md:w-auto bg-purple-600 md:bg-gradient-to-r md:from-purple-600 md:to-violet-600 hover:bg-purple-700 md:hover:from-purple-700 md:hover:to-violet-700 text-white font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 min-h-[44px] px-6 transition-all duration-200 active:scale-95"
                >
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Profile
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Password Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-orange-500/20 bg-slate-900/40 backdrop-blur-xl shadow-2xl shadow-orange-500/10 hover:shadow-orange-500/20 hover:border-orange-500/30 transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-orange-600 md:bg-gradient-to-br md:from-orange-600 md:to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/50 shrink-0">
                <Lock className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl md:text-2xl font-bold text-white">Change Password</CardTitle>
                <CardDescription className="text-white text-sm md:text-base">Keep your account secure</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-black text-sm md:text-base">Enter current password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="bg-slate-800/50 border-orange-500/20 text-white placeholder:text-slate-500 focus:border-orange-500/50 h-11 md:h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-black text-sm md:text-base">Enter new password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="bg-slate-800/50 border-orange-500/20 text-white placeholder:text-slate-500 focus:border-orange-500/50 h-11 md:h-12 text-base"
              />
              <p className="text-xs md:text-sm text-black">Must be at least 8 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-black text-sm md:text-base">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="bg-slate-800/50 border-orange-500/20 text-white placeholder:text-slate-500 focus:border-orange-500/50 h-11 md:h-12 text-base"
              />
            </div>

            {passwordSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
              >
                <Alert className="bg-green-500/10 border-green-500/30 shadow-lg shadow-green-500/20">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <AlertDescription className="text-green-200 font-medium">
                    ✓ Password changed successfully!
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="w-full md:w-auto bg-orange-600 md:bg-gradient-to-r md:from-orange-600 md:to-red-600 hover:bg-orange-700 md:hover:from-orange-700 md:hover:to-red-700 text-white font-semibold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 min-h-[44px] px-6 transition-all duration-200 active:scale-95"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Two-Factor Authentication */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-green-500/20 bg-slate-900/40 backdrop-blur-xl shadow-2xl shadow-green-500/10 hover:shadow-green-500/20 hover:border-green-500/30 transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-600 md:bg-gradient-to-br md:from-green-600 md:to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/50 shrink-0">
                <Shield className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-xl md:text-2xl font-bold text-white">Two-Factor Authentication</CardTitle>
                  {twoFactorEnabled && (
                    <Badge className="bg-green-600 text-white shadow-lg shadow-green-500/30">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Enabled
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-white text-sm md:text-base">
                  {twoFactorEnabled ? 'Your account is protected with 2FA' : 'Add an extra layer of security'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6">
            {!twoFactorEnabled ? (
              <>
                <div className="p-4 md:p-5 rounded-xl bg-blue-500/10 border border-blue-500/30">
                  <div className="flex items-start gap-3">
                    <Smartphone className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm md:text-base font-medium text-blue-300 mb-1">
                        Enhance Your Security
                      </p>
                      <p className="text-sm text-white">
                        Two-factor authentication adds an extra layer of protection by requiring a code from your phone in addition to your password.
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleEnable2FA}
                  disabled={isEnabling2FA}
                  className="w-full md:w-auto bg-green-600 md:bg-gradient-to-r md:from-green-600 md:to-emerald-600 hover:bg-green-700 md:hover:from-green-700 md:hover:to-emerald-700 text-white font-semibold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 min-h-[44px] px-6 transition-all duration-200 active:scale-95"
                >
                  {isEnabling2FA ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Enable 2FA
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 md:p-5 rounded-xl bg-green-500/10 border border-green-500/30">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                    <div>
                      <p className="text-sm md:text-base font-medium text-green-300">
                        2FA is Active
                      </p>
                      <p className="text-sm text-white">
                        Your account is protected with two-factor authentication
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleDisable2FA}
                  variant="outline"
                  className="border-red-500/30 text-red-300 bg-red-900/20 hover:bg-red-900/30 hover:border-red-500/50 hover:text-red-200 min-h-[44px] px-6 w-full md:w-auto"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Disable 2FA
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Data Export */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        <Card className="border-indigo-500/20 bg-slate-900/40 backdrop-blur-xl shadow-2xl shadow-indigo-500/10 hover:shadow-indigo-500/20 hover:border-indigo-500/30 transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-indigo-600 md:bg-gradient-to-br md:from-indigo-600 md:to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/50 shrink-0">
                <PackageOpen className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl md:text-2xl font-bold text-white">Data Export</CardTitle>
                <CardDescription className="text-white text-sm md:text-base">
                  Download all your data in JSON format
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6">
            {/* Info Box */}
            <div className="p-4 md:p-5 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
              <div className="flex items-start gap-3">
                <Download className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm md:text-base font-semibold text-indigo-300">
                    Your Export Includes:
                  </p>
                  <ul className="text-sm text-white space-y-1.5 ml-1">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400 mt-0.5">•</span>
                      <span>All sent and received capsules with metadata</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400 mt-0.5">•</span>
                      <span>Vault media files with 24-hour download links</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400 mt-0.5">•</span>
                      <span>Record library items with signed URLs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400 mt-0.5">•</span>
                      <span>Achievement progress and unlocked achievements</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-400 mt-0.5">•</span>
                      <span>Profile information and settings</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Technical Details */}
            <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700">
              <p className="text-xs md:text-sm text-white">
                <strong className="text-indigo-300">Note:</strong> Media files are exported as signed URLs valid for 24 hours. 
                Download them promptly after exporting. The JSON file contains all your capsule data, messages, and metadata.
              </p>
            </div>

            {/* Export Button */}
            <Button
              onClick={handleExportData}
              disabled={isExportingData}
              className="w-full md:w-auto bg-indigo-600 md:bg-gradient-to-r md:from-indigo-600 md:to-purple-600 hover:bg-indigo-700 md:hover:from-indigo-700 md:hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 min-h-[44px] px-6 transition-all duration-200 active:scale-95"
            >
              {isExportingData ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting Data...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export All Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete Account - Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="border-red-500/30 bg-slate-900/40 backdrop-blur-xl shadow-2xl shadow-red-500/10 hover:shadow-red-500/20 hover:border-red-500/40 transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-red-600 md:bg-gradient-to-br md:from-red-600 md:to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/50 shrink-0">
                <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl md:text-2xl font-bold text-white">Danger Zone</CardTitle>
                <CardDescription className="text-white text-sm md:text-base">Account deletion and recovery options</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main warning box */}
            <div className="p-4 md:p-5 rounded-xl bg-red-500/10 border border-red-500/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                <div className="space-y-3">
                  <div>
                    <p className="text-sm md:text-base font-semibold text-red-300 mb-1">
                      Account Deletion Process
                    </p>
                    <p className="text-sm text-white">
                      When you delete your account, we understand you might change your mind.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 30-Day Grace Period Info */}
            <div className="p-4 md:p-5 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm md:text-base font-semibold text-blue-300">
                    30-Day Grace Period
                  </p>
                  <ul className="text-sm text-white space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>Your account will be <strong className="text-white">scheduled for deletion</strong>, not immediately deleted</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>You can <strong className="text-white">sign back in any time within 30 days</strong> to reactivate</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>Your capsules, media, and data will be <strong className="text-white">fully restored</strong> upon reactivation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">•</span>
                      <span><strong className="text-red-300">After exactly 30 days</strong>, your account and all data will be <strong className="text-red-300">permanently deleted</strong></span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Final tip */}
            <div className="p-3 md:p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-xs md:text-sm text-white text-center">
                💡 <strong className="text-white">Pro Tip:</strong> If you're unsure, just sign out. 
                Your account will remain safe and ready whenever you return.
              </p>
            </div>
            
            {/* Delete button */}
            <Button
              onClick={() => setShowDeleteDialog(true)}
              variant="outline"
              className="border-red-500/30 text-red-300 bg-red-900/20 hover:bg-red-900/30 hover:border-red-500/50 hover:text-red-200 min-h-[44px] px-6 w-full md:w-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Floating Back to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 w-12 h-12 md:w-14 md:h-14 rounded-full bg-purple-500 md:bg-gradient-to-r md:from-purple-500 md:to-pink-500 shadow-2xl shadow-purple-500/50 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-200 cursor-pointer"
            aria-label="Scroll to top"
          >
            <ChevronUp className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Dialogs */}
      <Dialog open={show2FASetup} onOpenChange={setShow2FASetup}>
        <DialogContent className="bg-slate-900 border-purple-500/30">
          <DialogTitle className="text-white">Set Up Two-Factor Authentication</DialogTitle>
          <DialogDescription className="text-slate-300">
            Scan the QR code below with your authenticator app (Google Authenticator, Authy, etc.)
          </DialogDescription>
          <div className="space-y-4 mt-4">
            {qrCode && (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            )}
            {totpSecret && (
              <div className="space-y-2">
                <Label className="text-slate-100">Or enter this code manually:</Label>
                <div className="flex gap-2">
                  <Input
                    value={totpSecret}
                    readOnly
                    className="font-mono bg-slate-800/50 text-white"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copySecretToClipboard}
                    className="min-h-[44px] min-w-[44px]"
                  >
                    {secretCopied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="verificationCode" className="text-slate-100">Verification Code</Label>
              <Input
                id="verificationCode"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="bg-slate-800/50 text-white h-12"
              />
            </div>
            <Button
              onClick={handleVerify2FA}
              disabled={isVerifying2FA}
              className="w-full bg-green-600 md:bg-gradient-to-r md:from-green-600 md:to-emerald-600 hover:bg-green-700 md:hover:from-green-700 md:hover:to-emerald-700 text-white min-h-[44px]"
            >
              {isVerifying2FA ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Enable'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-slate-900 border-red-500/30 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400 text-xl flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Schedule Account Deletion?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-slate-300">
              <p>
                Your account will be scheduled for deletion and you'll be signed out.
              </p>
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <p className="text-sm text-blue-300 font-medium mb-1">
                  ⏰ 30-Day Recovery Window
                </p>
                <p className="text-xs text-slate-300">
                  Simply sign back in within 30 days and your account will be fully restored. 
                  After 30 days, deletion is permanent.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Label htmlFor="deleteConfirmPassword" className="text-slate-100">
                Enter your password to confirm
              </Label>
              <Input
                id="deleteConfirmPassword"
                type="password"
                value={deleteConfirmPassword}
                onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                className="bg-slate-800/50 border-red-500/20 text-white h-12"
                placeholder="Password"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deleteConfirmText" className="text-slate-100">
                Type <span className="font-mono font-bold text-red-400">DELETE</span> to confirm
              </Label>
              <Input
                id="deleteConfirmText"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="bg-slate-800/50 border-red-500/20 text-white h-12"
                placeholder="DELETE"
              />
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel className="text-white min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount}
              className="bg-red-600 hover:bg-red-700 text-white min-h-[44px]"
            >
              {isDeletingAccount ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Schedule Deletion'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Demo Dialogs */}
      {showUploadDemo && (
        <Dialog open={showUploadDemo} onOpenChange={setShowUploadDemo}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900">
            <UploadSystemDemo />
          </DialogContent>
        </Dialog>
      )}

      {showSearchDemo && (
        <Dialog open={showSearchDemo} onOpenChange={setShowSearchDemo}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900">
            <SearchDiscoveryDemo />
          </DialogContent>
        </Dialog>
      )}

      {showEchoNotificationTest && (
        <EchoNotificationModal
          isOpen={showEchoNotificationTest}
          onClose={() => setShowEchoNotificationTest(false)}
          notification={{
            id: 'test-notification',
            type: echoTestType,
            capsuleId: 'test-capsule',
            capsuleTitle: 'My Summer Vacation Memories',
            fromUserId: 'test-user',
            fromUserName: 'Sarah Johnson',
            timestamp: new Date().toISOString(),
            reactionType: echoTestType === 'reaction' ? 'heart' : undefined,
            noteContent: echoTestType === 'note' ? 'This capsule brought back so many wonderful memories! Thank you for sharing this special moment with me. 🌟' : undefined,
            read: false
          }}
        />
      )}

      {/* Profile Picture Upload Modal */}
      <ProfilePictureUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Epic Horizon Preview Modal */}
      {showEpicHorizonPreview && (
        <EpicHorizonPreview
          onClose={() => setShowEpicHorizonPreview(false)}
        />
      )}

      {/* Hybrid Profile Picture Modal - Preview + Options */}
      {showProfileModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" style={{ margin: 0 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative"
            style={{ maxHeight: '90vh', overflow: 'auto' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Profile Picture</h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Preview Section */}
              <div className="flex justify-center">
                <Avatar
                  src={profile?.avatar_url}
                  name={userName}
                  email={userEmail}
                  size="xl"
                  alt="Your profile picture"
                  className="w-40 h-40 ring-4 ring-purple-500/20"
                />
              </div>

              {/* Update Options */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700 mb-3">Update your photo:</p>
                
                {/* Choose from Gallery */}
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    setShowUploadModal(true);
                  }}
                  className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:scale-110 transition-transform">
                      <ImageIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-slate-900">Choose from Gallery</p>
                      <p className="text-xs text-slate-600">Select an existing photo</p>
                    </div>
                  </div>
                </button>

                {/* Take New Photo */}
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    setShowUploadModal(true);
                  }}
                  className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg group-hover:scale-110 transition-transform">
                      <Camera className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-slate-900">Take New Photo</p>
                      <p className="text-xs text-slate-600">Use your camera to capture</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Remove Button - Centered */}
              {profile?.avatar_url && (
                <div className="pt-2 border-t border-slate-200">
                  <Button
                    onClick={() => {
                      setShowProfileModal(false);
                      setShowDeleteConfirm(true);
                    }}
                    disabled={uploading}
                    variant="outline"
                    className="w-full bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Photo
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style={{ margin: 0 }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-800 rounded-2xl p-6 max-w-sm w-full border border-slate-700 shadow-2xl relative"
          >
            <h3 className="text-lg text-white font-semibold mb-2">
              Remove Profile Picture?
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              Your profile will show your initials instead. You can always upload a new picture later.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="flex-1 bg-slate-700 hover:bg-slate-600 border-slate-600 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAvatar}
                disabled={uploading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {uploading ? 'Removing...' : 'Remove'}
              </Button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
}
