import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Calendar, User, MapPin } from "lucide-react";
import { format } from "date-fns";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default Leaflet icon
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

type IssueDetails = {
  id: string;
  created_at: string;
  issue_type: string;
  location: string;
  description: string | null;
  photo_url: string | null;
  status: string;
  lat: number | null;
  lng: number | null;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
};

const fetchIssueDetails = async (issueId: string): Promise<IssueDetails> => {
  const { data, error } = await supabase
    .from("issues")
    .select(`*, profiles (first_name, last_name)`)
    .eq("id", issueId)
    .single();

  if (error) throw new Error(error.message);
  return data as IssueDetails;
};

const IssueDetails = () => {
  const { id } = useParams<{ id: string }>();

  const { data: issue, isLoading, isError, error } = useQuery<IssueDetails>({
    queryKey: ["issueDetails", id],
    queryFn: () => fetchIssueDetails(id!),
    enabled: !!id,
  });

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "reported": return "destructive";
      case "in_progress": return "default";
      case "resolved": return "secondary";
      default: return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-96 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center text-destructive p-4 max-w-4xl mx-auto">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p className="font-semibold">Failed to load issue details</p>
        <p className="text-sm text-muted-foreground">{error?.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight capitalize">{issue.issue_type.replace("-", " ")}</h1>
        <p className="text-muted-foreground">Details for report #{issue.id.substring(0, 8)}</p>
      </div>
      <div className="grid md:grid-cols-5 gap-6">
        <div className="md:col-span-3 space-y-6">
          {issue.photo_url && (
            <Card>
              <CardContent className="p-0">
                <img src={issue.photo_url} alt={`Issue report for ${issue.location}`} className="w-full h-auto object-cover rounded-lg" />
              </CardContent>
            </Card>
          )}
          {issue.lat && issue.lng && (
            <Card>
              <CardContent className="p-0 h-64 rounded-lg overflow-hidden">
                <MapContainer center={[issue.lat, issue.lng]} zoom={15} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[issue.lat, issue.lng]} />
                </MapContainer>
              </CardContent>
            </Card>
          )}
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Status</Label>
                <div className="flex items-center">
                  <Badge variant={getStatusVariant(issue.status) as any} className="capitalize text-base">{issue.status}</Badge>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 mt-1 text-muted-foreground" />
                <div>
                  <Label className="text-sm text-muted-foreground">Location</Label>
                  <p>{issue.location}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 mt-1 text-muted-foreground" />
                <div>
                  <Label className="text-sm text-muted-foreground">Reported On</Label>
                  <p>{format(new Date(issue.created_at), "PPP p")}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 mt-1 text-muted-foreground" />
                <div>
                  <Label className="text-sm text-muted-foreground">Reported By</Label>
                  <p>{issue.profiles ? `${issue.profiles.first_name || ''} ${issue.profiles.last_name || ''}`.trim() : 'Anonymous'}</p>
                </div>
              </div>
              {issue.description && (
                <div>
                  <Label className="text-sm text-muted-foreground">Description</Label>
                  <p className="whitespace-pre-wrap">{issue.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IssueDetails;