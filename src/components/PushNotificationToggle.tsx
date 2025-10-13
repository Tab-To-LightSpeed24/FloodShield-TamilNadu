import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getMessaging, getToken, deleteToken } from 'firebase/messaging';
import { initializeApp } from 'firebase/app';
import { Skeleton } from '@/components/ui/skeleton';
import { firebaseConfig, areAllFirebaseConfigValuesPresent } from '@/firebase-config';

// Initialize Firebase
let app;
let messaging;
if (areAllFirebaseConfigValuesPresent) {
  try {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
}

const PushNotificationToggle = () => {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator && messaging) {
      setIsSupported(true);
      checkSubscriptionStatus();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const checkSubscriptionStatus = async () => {
    if (!user) {
      setIsEnabled(false);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('device_tokens')
        .select('token')
        .eq('user_id', user.id)
        .eq('platform', 'android') // Assuming web push acts like Android for now
        .single();

      setIsEnabled(!!data);
    } catch (error) {
      console.error("Error checking subscription status:", error);
      setIsEnabled(false);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToPushNotifications = async () => {
    if (!user) {
      showError("You must be logged in to enable push notifications.");
      return;
    }
    if (!messaging) {
      showError("Push notification service is not available due to configuration issues.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        showError("Permission denied for push notifications.");
        return;
      }

      const currentToken = await getToken(messaging, { vapidKey: import.meta.env.VITE_VAPID_PUBLIC_KEY });
      if (currentToken) {
        const { error } = await supabase.from('device_tokens').upsert(
          { user_id: user.id, token: currentToken, platform: 'android' },
          { onConflict: 'token' }
        );

        if (error) throw error;
        showSuccess("Push notifications enabled!");
        setIsEnabled(true);
      } else {
        showError("No registration token available. Request permission to generate one.");
      }
    } catch (error: any) {
      console.error("Error subscribing to push notifications:", error);
      showError(`Failed to enable push notifications: ${error.message}`);
      setIsEnabled(false);
    }
  };

  const unsubscribeFromPushNotifications = async () => {
    if (!user || !messaging) return;

    try {
      await deleteToken(messaging);
      const { error } = await supabase
        .from('device_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('platform', 'android'); // Assuming web push acts like Android for now

      if (error) throw error;
      showSuccess("Push notifications disabled.");
      setIsEnabled(false);
    } catch (error: any) {
      console.error("Error unsubscribing from push notifications:", error);
      showError(`Failed to disable push notifications: ${error.message}`);
    }
  };

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      await subscribeToPushNotifications();
    } else {
      await unsubscribeFromPushNotifications();
    }
  };

  if (!areAllFirebaseConfigValuesPresent) {
    return (
      <div className="text-sm text-muted-foreground">
        Push notifications are unavailable due to a missing configuration. Please contact support.
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="text-sm text-muted-foreground">
        Push notifications are not supported by your browser or device.
      </div>
    );
  }

  if (isLoading) {
    return <Skeleton className="h-8 w-full" />;
  }

  return (
    <div className="flex items-center space-x-4">
      <Switch
        id="push-notifications"
        checked={isEnabled}
        onCheckedChange={handleToggle}
        disabled={!user}
      />
      <Label htmlFor="push-notifications" className="text-base">
        Enable Push Notifications
      </Label>
    </div>
  );
};

export default PushNotificationToggle;