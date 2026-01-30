import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Bell,
  Mail, 
  Phone, 
  Smartphone,
  Save,
  Loader2
} from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { toast } from 'sonner';
import { PushNotificationService } from '../utils/push-notifications';

interface NotificationPreferencesProps {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface NotificationPrefs {
  emailDeliveryConfirmations: boolean;
  emailCapsuleReceived: boolean;
  inAppNotifications: boolean;
  notificationSound: boolean;
  echoNotifications: boolean;
  echoSound: boolean;
  echoHaptic: boolean;
}

export function NotificationPreferences({ user }: NotificationPreferencesProps) {
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>({
    emailDeliveryConfirmations: true,
    emailCapsuleReceived: true,
    inAppNotifications: false,
    notificationSound: true,
    echoNotifications: true,
    echoSound: true,
    echoHaptic: true,
  });
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pushSupported, setPushSupported] = useState(false);

  useEffect(() => {
    loadNotificationPreferences();
    loadPhoneNumber();
    setPushSupported(PushNotificationService.isSupported());
  }, []);

  const loadNotificationPreferences = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser?.user_metadata?.notificationPreferences) {
        setNotificationPrefs({
          ...notificationPrefs,
          ...currentUser.user_metadata.notificationPreferences
        });
      }
      
      // Also check actual browser permission status if push is supported
      if (PushNotificationService.isSupported() && currentUser?.id) {
        const isSubscribed = PushNotificationService.isSubscribed(currentUser.id);
        const permission = PushNotificationService.getPermissionStatus();
        
        if (permission === 'denied' && isSubscribed) {
          // If denied at browser level but we thought subscribed, sync it
          setNotificationPrefs(prev => ({ ...prev, inAppNotifications: false }));
        }
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  const loadPhoneNumber = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser?.user_metadata?.phone || currentUser?.phone) {
        setPhoneNumber(currentUser.user_metadata?.phone || currentUser.phone || '');
      }
    } catch (error) {
      console.error('Error loading phone number:', error);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSavingNotifications(true);
    try {
      console.log('💾 Updating notification preferences...');
      
      // Handle Push Notifications Subscription
      if (notificationPrefs.inAppNotifications) {
        // User wants push notifications
        const permission = await PushNotificationService.requestPermission();
        if (permission === 'granted') {
          await PushNotificationService.subscribeToPush(user.id);
        } else {
          toast.error('Browser permission denied for push notifications');
          setNotificationPrefs(prev => ({ ...prev, inAppNotifications: false }));
        }
      } else {
        // User disabled push notifications
        if (PushNotificationService.isSubscribed(user.id)) {
          await PushNotificationService.unsubscribe(user.id);
        }
      }

      const { error } = await supabase.auth.updateUser({
        data: {
          notificationPreferences: notificationPrefs
        }
      });

      if (error) throw error;

      toast.success('Notification preferences saved successfully!');
    } catch (error: any) {
      console.error('❌ Error saving notification preferences:', error);
      toast.error(error.message || 'Failed to save notification preferences');
    } finally {
      setIsSavingNotifications(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2">Notification Preferences</h2>
        <p className="text-muted-foreground">
          Manage how you receive updates about your capsules
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Choose how you want to stay informed</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-medium">Email Notifications</h4>
            </div>
            <div className="space-y-3 ml-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailDeliveryConfirmations" className="cursor-pointer">
                    Delivery Confirmations
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified when your capsules are delivered
                  </p>
                </div>
                <Switch
                  id="emailDeliveryConfirmations"
                  checked={notificationPrefs.emailDeliveryConfirmations}
                  onCheckedChange={(checked) =>
                    setNotificationPrefs({ ...notificationPrefs, emailDeliveryConfirmations: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailCapsuleReceived" className="cursor-pointer">
                    Capsule Received
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Receive notification when someone sends you a capsule
                  </p>
                </div>
                <Switch
                  id="emailCapsuleReceived"
                  checked={notificationPrefs.emailCapsuleReceived}
                  onCheckedChange={(checked) =>
                    setNotificationPrefs({ ...notificationPrefs, emailCapsuleReceived: checked })
                  }
                />
              </div>
            </div>
          </div>

          {/* In-App Notifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-medium">In-App Notifications</h4>
            </div>
            <div className="space-y-3 ml-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="inAppNotifications" className="cursor-pointer">
                    Push Notifications
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Browser push notifications
                  </p>
                </div>
                <Switch
                  id="inAppNotifications"
                  checked={notificationPrefs.inAppNotifications}
                  disabled={!pushSupported}
                  onCheckedChange={(checked) =>
                    setNotificationPrefs({ ...notificationPrefs, inAppNotifications: checked })
                  }
                />
              </div>
              {!pushSupported && (
                 <p className="text-xs text-amber-500 mt-1 ml-1">
                   Browser push notifications are not supported in this browser environment.
                 </p>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notificationSound" className="cursor-pointer">
                    Notification Sounds
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Play sound for notifications
                  </p>
                </div>
                <Switch
                  id="notificationSound"
                  checked={notificationPrefs.notificationSound}
                  onCheckedChange={(checked) =>
                    setNotificationPrefs({ ...notificationPrefs, notificationSound: checked })
                  }
                />
              </div>
            </div>
          </div>

          {/* Echo Notification Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-violet-500" />
              <h3 className="text-lg font-semibold">Echo Notifications</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="echoNotifications" className="cursor-pointer">
                    Echo Notifications
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified when someone reacts to your capsules
                  </p>
                </div>
                <Switch
                  id="echoNotifications"
                  checked={notificationPrefs.echoNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationPrefs({ ...notificationPrefs, echoNotifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="echoSound" className="cursor-pointer">
                    Echo Sounds
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Play a gentle chime when you receive an echo
                  </p>
                </div>
                <Switch
                  id="echoSound"
                  checked={notificationPrefs.echoSound}
                  onCheckedChange={(checked) =>
                    setNotificationPrefs({ ...notificationPrefs, echoSound: checked })
                  }
                  disabled={!notificationPrefs.echoNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="echoHaptic" className="cursor-pointer">
                    Echo Haptic Feedback
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Gentle vibration on mobile when you receive an echo
                  </p>
                </div>
                <Switch
                  id="echoHaptic"
                  checked={notificationPrefs.echoHaptic}
                  onCheckedChange={(checked) =>
                    setNotificationPrefs({ ...notificationPrefs, echoHaptic: checked })
                  }
                  disabled={!notificationPrefs.echoNotifications}
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleSaveNotifications}
            disabled={isSavingNotifications}
            className="w-full md:w-auto"
          >
            {isSavingNotifications ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Notification Preferences
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
