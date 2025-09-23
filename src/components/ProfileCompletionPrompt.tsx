import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Info, X } from 'lucide-react';

const ProfileCompletionPrompt = () => {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const [isVisible, setIsVisible] = useState(false);

  const storageKey = `promptDismissed_${user?.id}`;

  useEffect(() => {
    if (user && profile && !isLoading) {
      const isDismissed = localStorage.getItem(storageKey);
      if (!isDismissed && (!profile.home_location || !profile.phone)) {
        setIsVisible(true);
      }
    }
  }, [user, profile, isLoading, storageKey]);

  const handleDismiss = () => {
    localStorage.setItem(storageKey, 'true');
    setIsVisible(false);
  };

  if (!isVisible || !user) {
    return null;
  }

  return (
    <Alert>
      <Info className="h-4 w-4" />
      <div className="flex justify-between items-start">
        <div>
          <AlertTitle>Complete Your Profile</AlertTitle>
          <AlertDescription>
            Add your phone number and home location to receive targeted SMS alerts and personalized weather forecasts.
          </AlertDescription>
        </div>
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          <Button asChild size="sm">
            <Link to="/profile">Go to Profile</Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDismiss} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  );
};

export default ProfileCompletionPrompt;