import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const EmergencyAlertBanner = () => {
  const { isFloodSeasonActive } = useSiteConfig();

  if (!isFloodSeasonActive) {
    return null;
  }

  return (
    <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Emergency Alert Mode Active</AlertTitle>
      <AlertDescription>
        An emergency, such as a high probability of floods, is currently active. Please stay vigilant and report any critical issues immediately.
      </AlertDescription>
    </Alert>
  );
};

export default EmergencyAlertBanner; 