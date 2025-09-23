import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Map, Megaphone } from "lucide-react";
import { Link } from "react-router-dom";
import RecentIssues from "@/components/RecentIssues";
import DashboardMap from "@/components/DashboardMap";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import WeatherForecast from "@/components/WeatherForecast";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import ProfileCompletionPrompt from "@/components/ProfileCompletionPrompt";

const fetchActiveAlertsCount = async () => {
  const { count, error } = await supabase
    .from("alerts")
    .select("*", { count: "exact", head: true })
    .neq("level", "Resolved");

  if (error) {
    throw new Error(error.message);
  }
  return count ?? 0;
};

const Index = () => {
  const { data: activeAlertsCount, isLoading: isLoadingAlerts } = useQuery<
    number
  >({
    queryKey: ["activeAlertsCount"],
    queryFn: fetchActiveAlertsCount,
  });

  const { isFloodSeasonActive } = useSiteConfig();
  const riskLevel = isFloodSeasonActive ? "High" : "Low";
  const riskColor = isFloodSeasonActive ? "text-red-600" : "text-green-600";

  return (
    <div className="space-y-6">
      <div className="text-left">
        <h1 className="text-3xl font-bold tracking-tight">
          FloodShield Dashboard
        </h1>
        <p className="text-muted-foreground">
          Real-time flood risk and alerts for Tamil Nadu
        </p>
      </div>

      <ProfileCompletionPrompt />

      <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-6 space-y-6 lg:space-y-0">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Map className="mr-2 h-5 w-5 text-primary" />
                Live Flood Risk Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DashboardMap />
            </CardContent>
          </Card>
          <RecentIssues />
        </div>

        {/* Side column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base font-semibold">
                  <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />
                  Current Risk Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-4xl font-bold ${riskColor}`}>{riskLevel}</div>
                <p className="text-sm text-muted-foreground">
                  Based on official alerts
                </p>
              </CardContent>
            </Card>

            <WeatherForecast />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base font-semibold">
                  <Megaphone className="mr-2 h-5 w-5 text-red-500" />
                  Active Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAlerts ? (
                  <Skeleton className="h-10 w-12" />
                ) : (
                  <div className="text-4xl font-bold">{activeAlertsCount}</div>
                )}
                <p className="text-sm text-muted-foreground">
                  {activeAlertsCount === 0
                    ? "No active alerts"
                    : "Requiring attention"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Community Reporting</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-start gap-4">
              <p className="text-muted-foreground">
                See waterlogging or a blocked drain? Let us know.
              </p>
              <Button asChild>
                <Link to="/report">Report an Issue</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;