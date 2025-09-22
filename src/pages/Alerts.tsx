import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Info, ShieldCheck, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Alert = {
  id: string;
  created_at: string;
  level: string;
  title: string;
  description: string;
};

const fetchAlerts = async (): Promise<Alert[]> => {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

const getAlertProps = (level: string) => {
  switch (level.toLowerCase()) {
    case "warning":
      return {
        variant: "destructive",
        icon: <AlertTriangle className="h-5 w-5" />,
      };
    case "watch":
      return {
        variant: "default",
        icon: <Info className="h-5 w-5" />,
      };
    case "resolved":
      return {
        variant: "secondary",
        icon: <ShieldCheck className="h-5 w-5" />,
      };
    default:
      return {
        variant: "outline",
        icon: <Info className="h-5 w-5" />,
      };
  }
};

const Alerts = () => {
  const {
    data: alerts,
    isLoading,
    isError,
    error,
  } = useQuery<Alert[]>({
    queryKey: ["alerts"],
    queryFn: fetchAlerts,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
        <p className="text-muted-foreground">
          Stay updated with the latest flood-related warnings and information.
        </p>
      </div>
      <div className="space-y-4">
        {isLoading &&
          [...Array(3)].map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-1/4 mt-1" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6 mt-2" />
              </CardContent>
            </Card>
          ))}

        {isError && (
          <Card className="bg-destructive/10 border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Failed to load alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive/80">{error?.message}</p>
            </CardContent>
          </Card>
        )}

        {alerts?.map((alert) => {
          const { variant, icon } = getAlertProps(alert.level);
          return (
            <Card key={alert.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {icon}
                    {alert.title}
                  </CardTitle>
                  <Badge variant={variant as any}>{alert.level}</Badge>
                </div>
                <CardDescription>
                  {formatDistanceToNow(new Date(alert.created_at), {
                    addSuffix: true,
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>{alert.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Alerts;