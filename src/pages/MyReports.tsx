import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { showSuccess, showError } from "@/utils/toast";
import { Link, useNavigate } from "react-router-dom";

type Issue = {
  id: string;
  created_at: string;
  issue_type: string;
  location: string;
  status: string;
};

const MyReports = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const fetchMyReports = async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from("issues")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  };

  const { data: reports, isLoading, isError, error } = useQuery<Issue[]>({
    queryKey: ["myReports", user?.id],
    queryFn: fetchMyReports,
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (issueId: string) => {
      const { error } = await supabase.from("issues").delete().eq("id", issueId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myReports", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["allIssues"] });
      queryClient.invalidateQueries({ queryKey: ["recentIssues"] });
      showSuccess("Report deleted successfully.");
    },
    onError: (error) => {
      showError(`Failed to delete report: ${error.message}`);
    },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>My Reported Issues</CardTitle>
          <CardDescription>Here you can view and manage the issues you've reported.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          )}
          {isError && (
            <div className="flex flex-col items-center justify-center text-destructive p-4">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p className="font-semibold">Failed to load your reports</p>
              <p className="text-sm text-muted-foreground">{error?.message}</p>
            </div>
          )}
          {reports && !isLoading && reports.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Issue</TableHead>
                  <TableHead className="hidden sm:table-cell">Location</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id} onClick={() => navigate(`/issue/${report.id}`)} className="cursor-pointer">
                    <TableCell>
                      <div className="font-medium capitalize">{report.issue_type.replace("-", " ")}</div>
                      <div className="text-sm text-muted-foreground sm:hidden">{report.location}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{report.location}</TableCell>
                    <TableCell className="hidden md:table-cell">{format(new Date(report.created_at), "PPP")}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{report.status}</Badge></TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your issue report.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(report.id)} className="bg-destructive hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {reports && !isLoading && reports.length === 0 && (
            <div className="text-center text-muted-foreground p-8">
              <p>You haven't reported any issues yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyReports;