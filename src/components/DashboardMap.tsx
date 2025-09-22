import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

type Issue = {
  id: string;
  lat: number;
  lng: number;
};

const fetchAllIssuesForMap = async (): Promise<Issue[]> => {
  const { data, error } = await supabase.from("issues").select("id");

  if (error) {
    throw new Error(error.message);
  }

  // NOTE: This is a placeholder for real geocoding.
  // We are adding random coordinates around Tamil Nadu for visualization.
  return data.map((issue) => ({
    ...issue,
    lat: 11.1271 + (Math.random() - 0.5) * 4,
    lng: 78.6569 + (Math.random() - 0.5) * 4,
  }));
};

const DashboardMap = () => {
  const {
    data: issues,
    isLoading,
    isError,
  } = useQuery<Issue[]>({
    queryKey: ["allIssuesForMap"],
    queryFn: fetchAllIssuesForMap,
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (isError) {
    return (
      <div className="h-64 w-full bg-destructive/10 rounded-md flex flex-col items-center justify-center text-destructive">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p className="font-semibold">Failed to load map</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full rounded-md overflow-hidden">
      <MapContainer
        center={[11.1271, 78.6569]}
        zoom={7}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={false}
        touchZoom={false}
        doubleClickZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {issues?.map((issue) => (
          <Marker key={issue.id} position={[issue.lat, issue.lng]} />
        ))}
      </MapContainer>
    </div>
  );
};

export default DashboardMap;