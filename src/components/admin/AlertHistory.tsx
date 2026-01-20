import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, History, MessageSquare, Bell } from "lucide-react";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type AlertHistoryEntry = {
  id: string;
  created_at: string;
  sender_id: string;
  title: string | null;
  message: string;
  channels_sent: string[];
  status: string;
  details: any;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
};

const fetchAlertHistory = async (): Promise<AlertHistoryEntry[]> => {
  const { data, error } = await supabase.rpc('get_alert_history_with_profiles');

  if (error) {
    throw new Error(error.message);
  }
  
  // The RPC returns a flat structure, so we need to map it back 
  // to the nested structure the component expects.
  return data.map((item: any) => ({
    ...item,
    profiles: {
      first_name: item.profile_first_name,
      last_name: item.profile_last_name,
    }
  })) as AlertHistoryEntry[];
};

const AlertHistory = () => {
  const {
    data: alertHistory,
    isLoading,
    isError,
    error,
  } = useQuery<AlertHistoryEntry[]>({
    queryKey: ["alertHistory"],
    queryFn: fetchAlertHistory,
  });

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "sent":
        return "default";
      case "partial_success":
        return "warning";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'sms':
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />;
      case 'push':
        return <Bell className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alert Broadcast History</CardTitle>
        <CardDescription>
          Review all past alerts sent to users.
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
            <p className="font-semibold">Failed to load alert history</p>
            <p className="text-sm text-muted-foreground">{error?.message}</p>
          </div>
        )}
        {alertHistory && !isLoading && alertHistory.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="hidden sm:table-cell">Sender</TableHead>
                <TableHead>Channels</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alertHistory.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(entry.created_at), "MMM dd, yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">
                            {entry.title ? `${entry.title}: ` : ''}{entry.message}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="font-bold">{entry.title}</p>
                          <p>{entry.message}</p>
                          {entry.details?.errors && entry.details.errors.length > 0 && (
                            <div className="mt-2 text-destructive">
                              <p className="font-semibold">Errors:</p>
                              <ul className="list-disc list-inside">
                                {entry.details.errors.map((err: string, i: number) => (
                                  <li key={i} className="text-sm">{err}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {entry.profiles ? `${entry.profiles.first_name || ''} ${entry.profiles.last_name || ''}`.trim() : 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {entry.channels_sent.map(channel => (
                        <TooltipProvider key={channel}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="secondary" className="capitalize p-1">
                                {getChannelIcon(channel)}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              {channel}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(entry.status) as any} className="capitalize">
                      {entry.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center text-muted-foreground p-8">
            <p>No alerts have been broadcasted yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertHistory; 