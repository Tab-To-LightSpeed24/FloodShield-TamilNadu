import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Droplets } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import MarkerClusterGroup from "@changey/react-leaflet-markercluster";
import ReactDOMServer from "react-dom/server";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const FloodIcon = L.divIcon({
  html: ReactDOMServer.renderToString(
    <div className="p-1 bg-red-600 rounded-full shadow-lg border-2 border-white">
      <Droplets className="h-5 w-5 text-white" />
    </div>
  ),
  className: 'bg-transparent border-0',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

L.Marker.prototype.options.icon = DefaultIcon;

type Issue = {
  id: string;
  issue_type: string;
  location: string;
  description: string;
  lat: number;
  lng: number;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
};

const fetchAllIssues = async (): Promise<Issue[]> => {
  const { data, error } = await supabase
    .from("issues")
    .select(`
      *,
      profiles (
        first_name,
        last_name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data.filter(issue => issue.lat && issue.lng) as Issue[];
};

const LiveMap = () => {
  const {
    data: issues,
    isLoading,
    isError,
    error,
  } = useQuery<Issue[]>({
    queryKey: ["allIssues"],
    queryFn: fetchAllIssues,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Live Flood Risk Map
        </h1>
        <p className="text-muted-foreground">
          Real-time visualization of reported issues across Tamil Nadu.
        </p>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="h-[60vh] rounded-md">
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <Skeleton className="h-full w-full" />
              </div>
            )}
            {isError && (
              <div className="flex flex-col items-center justify-center h-full text-destructive">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p className="font-semibold">Failed to load map data</p>
                <p className="text-sm text-muted-foreground">{error?.message}</p>
              </div>
            )}
            {issues && (
              <MapContainer
                center={[11.1271, 78.6569]}
                zoom={7}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%", borderRadius: "inherit" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MarkerClusterGroup>
                  {issues.map((issue) => (
                    <Marker 
                      key={issue.id} 
                      position={[issue.lat, issue.lng]}
                      icon={issue.issue_type === 'flood' ? FloodIcon : DefaultIcon}
                    >
                      <Popup>
                        <div className="font-bold capitalize">
                          {issue.issue_type.replace("-", " ")}
                        </div>
                        <div className="text-sm">{issue.location}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          By: {issue.profiles ? `${issue.profiles.first_name || ''} ${issue.profiles.last_name || ''}`.trim() : 'Anonymous'}
                        </div>
                        <Button asChild variant="link" className="p-0 h-auto mt-2 text-xs">
                          <Link to={`/issue/${issue.id}`}>View Full Report</Link>
                        </Button>
                      </Popup>
                    </Marker>
                  ))}
                </MarkerClusterGroup>
              </MapContainer>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Map Legend</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <img src={icon} alt="Issue marker" className="h-6" />
            <span className="text-sm">Standard Issue</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="p-1 bg-red-600 rounded-full shadow-lg border-2 border-white inline-block">
              <Droplets className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold">Flood Report</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveMap;