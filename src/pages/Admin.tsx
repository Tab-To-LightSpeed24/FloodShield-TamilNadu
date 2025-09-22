import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

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
      <Card>
        <CardHeader>
          <CardTitle>Welcome, Admin!</CardTitle>
          <CardDescription>
            This is your central hub for managing the FloodShield application. More management tools will be added here soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>You have administrative privileges.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;