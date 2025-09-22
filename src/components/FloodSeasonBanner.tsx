import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const FloodSeasonBanner = () => {
  const { isFloodSeasonActive } = useSiteConfig();

  if (!isFloodSeasonActive) {
    return null;
  }

  return (
    <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Flood Season Alert</AlertTitle>
      <AlertDescription>
        The government has announced a high probability of floods. Please stay vigilant and report any signs of flooding immediately.
      </AlertDescription>
    </Alert>
  );
};

export default FloodSeasonBanner;