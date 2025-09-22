import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info, ShieldCheck } from "lucide-react";

const alerts = [
  {
    level: "Warning",
    title: "Severe Waterlogging in T. Nagar",
    description: "Heavy rainfall has caused severe waterlogging around the T. Nagar bus depot. Avoid the area. Authorities have been dispatched.",
    time: "30 minutes ago",
    variant: "destructive",
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  {
    level: "Watch",
    title: "Potential Flooding in Velachery",
    description: "Water levels in Velachery Lake are rising. Residents in low-lying areas should be prepared for potential flooding in the next 6 hours.",
    time: "2 hours ago",
    variant: "default",
    icon: <Info className="h-5 w-5" />,
  },
  {
    level: "Resolved",
    title: "Blocked Drain Cleared in Adyar",
    description: "The blocked drain reported on Sardar Patel Road has been cleared. Water has receded.",
    time: "5 hours ago",
    variant: "secondary",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
];

const Alerts = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
        <p className="text-muted-foreground">
          Stay updated with the latest flood-related warnings and information.
        </p>
      </div>
      <div className="space-y-4">
        {alerts.map((alert, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {alert.icon}
                  {alert.title}
                </CardTitle>
                <Badge variant={alert.variant as any}>{alert.level}</Badge>
              </div>
              <CardDescription>{alert.time}</CardDescription>
            </CardHeader>
            <CardContent>
              <p>{alert.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Alerts;