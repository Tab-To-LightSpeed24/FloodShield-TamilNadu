import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

type Issue = {
  id: string;
  created_at: string;
  issue_type: string;
  location: string;
  status: string;
};

const fetchIssues = async (): Promise<Issue[]> => {
  const { data, error } = await supabase
    .from("issues")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const RecentIssues = () => {
  const {
    data: issues,
    isLoading,
    isError,
    error,
  } = useQuery<Issue[]>({
    queryKey: ["recentIssues"],
    queryFn: fetchIssues,
  });

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "reported":
        return "destructive";
      case "in_progress":
        return "default";
      case "resolved":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recently Reported Issues</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        )}
        {isError && (
          <div className="flex flex-col items-center justify-center text-destructive p-4">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p className="font-semibold">Failed to load issues</p>
            <p className="text-sm text-muted-foreground">{error?.message}</p>
          </div>
        )}
        {issues && !isLoading && issues.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead className="hidden sm:table-cell">Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Reported</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((issue) => (
                <TableRow key={issue.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Link to={`/issue/${issue.id}`} className="w-full h-full block">
                      <div className="font-medium capitalize">
                        {issue.issue_type.replace("-", " ")}
                      </div>
                      <div className="text-sm text-muted-foreground sm:hidden">
                        {issue.location}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Link to={`/issue/${issue.id}`} className="w-full h-full block">{issue.location}</Link>
                  </TableCell>
                  <TableCell>
                    <Link to={`/issue/${issue.id}`} className="w-full h-full block">
                      <Badge variant={getStatusVariant(issue.status) as any} className="capitalize">
                        {issue.status}
                      </Badge>
                    </Link>
                  </TableCell>
                  <TableCell className="text-right hidden sm:table-cell">
                    <Link to={`/issue/${issue.id}`} className="w-full h-full block">
                      {formatDistanceToNow(new Date(issue.created_at), {
                        addSuffix: true,
                      })}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {issues && !isLoading && issues.length === 0 && (
          <div className="text-center text-muted-foreground p-8">
            <p>No issues reported yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentIssues;