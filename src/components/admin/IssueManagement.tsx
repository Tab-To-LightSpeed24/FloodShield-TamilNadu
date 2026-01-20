import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { showSuccess, showError } from "@/utils/toast";

type IssueWithProfile = {
  id: string;
  created_at: string;
  issue_type: string;
  location: string;
  status: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
};

const fetchAllIssues = async (): Promise<IssueWithProfile[]> => {
  const { data, error } = await supabase
    .from("issues")
    .select(`
      id,
      created_at,
      issue_type,
      location,
      status,
      profiles (
        first_name,
        last_name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data as IssueWithProfile[];
};

const IssueManagement = () => {
  const queryClient = useQueryClient();
  const {
    data: issues,
    isLoading,
    isError,
    error,
  } = useQuery<IssueWithProfile[]>({
    queryKey: ["allAdminIssues"],
    queryFn: fetchAllIssues,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ issueId, status }: { issueId: string; status: string }) => {
      const { error } = await supabase
        .from("issues")
        .update({ status })
        .eq("id", issueId);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      showSuccess("Issue status updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["allAdminIssues"] });
      queryClient.invalidateQueries({ queryKey: ["recentIssues"] });
    },
    onError: (error) => {
      showError(`Failed to update status: ${error.message}`);
    },
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
        <CardTitle>Manage Reported Issues</CardTitle>
        <CardDescription>
          View and update the status of all issues reported by users.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
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
                <TableHead className="hidden sm:table-cell">Reporter</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Reported</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell>
                    <div className="font-medium capitalize">
                      {issue.issue_type.replace("-", " ")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {issue.location}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {issue.profiles ? `${issue.profiles.first_name || ''} ${issue.profiles.last_name || ''}`.trim() : 'Unknown User'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(issue.status) as any} className="capitalize">
                      {issue.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDistanceToNow(new Date(issue.created_at), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => updateStatusMutation.mutate({ issueId: issue.id, status: 'reported' })}
                          disabled={issue.status === 'reported'}
                        >
                          Reported
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateStatusMutation.mutate({ issueId: issue.id, status: 'in_progress' })}
                          disabled={issue.status === 'in_progress'}
                        >
                          In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => updateStatusMutation.mutate({ issueId: issue.id, status: 'resolved' })}
                          disabled={issue.status === 'resolved'}
                        >
                          Resolved
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {issues && !isLoading && issues.length === 0 && (
          <div className="text-center text-muted-foreground p-8">
            <p>No issues have been reported yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IssueManagement; 