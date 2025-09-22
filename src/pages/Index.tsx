import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Map, Megaphone, Droplets } from "lucide-react";
import { Link } from "react-router-dom";
import RecentIssues from "@/components/RecentIssues";
import DashboardMap from "@/components/DashboardMap";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

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

  return (
    <div className="space-y-6">
      <div className="text-left">
        <h1 className="text-3xl font-bold tracking-tight">
          FloodShield Dashboard
        </h1>
        <p className="text-muted-foreground">
          Real-time flood risk and alerts for Chennai
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Map className="mr-2 h-5 w-5 text-blue-500" />
            Live Flood Risk Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardMap />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />
              Current Risk Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">Low</div>
            <p className="text-sm text-muted-foreground">
              Last updated: 2 minutes ago
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Droplets className="mr-2 h-5 w-5 text-cyan-500" />
              Rainfall Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Light showers expected</div>
            <p className="text-sm text-muted-foreground">Next 6 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
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
                ? "No active alerts in your zone"
                : "Active alerts requiring attention"}
            </p>
          </CardContent>
        </Card>
      </div>

      <RecentIssues />

      <Card>
        <CardHeader>
          <CardTitle>Community Reporting</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground">
            See waterlogging or a blocked drain? Let us know.
          </p>
          <Button asChild>
            <Link to="/report">Report an Issue</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;