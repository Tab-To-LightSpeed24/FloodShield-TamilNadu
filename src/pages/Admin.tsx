import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import IssueManagement from "@/components/admin/IssueManagement";
import AlertBroadcaster from "@/components/admin/AlertBroadcaster";

const Admin = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <ShieldCheck className="mr-3 h-8 w-8 text-primary" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage site settings, user reports, and alerts.
        </p>
      </div>
      
      <AlertBroadcaster />
      <IssueManagement />
      
    </div>
  );
};

export default Admin;