import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const LiveMap = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Live Flood Risk Map</h1>
        <p className="text-muted-foreground">
          Real-time visualization of flood risk across Chennai.
        p>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="h-[60vh] bg-gray-200 dark:bg-gray-800 rounded-md flex items-center justify-center">
            <p className="text-gray-500">Interactive map will be displayed here</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Map Legend</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 rounded-full bg-red-500" />
            <span className="text-sm">High Risk</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 rounded-full bg-yellow-500" />
            <span className="text-sm">Moderate Risk</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 rounded-full bg-green-500" />
            <span className="text-sm">Low Risk</span>
          </div>
           <div className="flex items-center space-x-2">
            <div className="h-4 w-4 rounded-full bg-blue-500" />
            <span className="text-sm">Relief Shelter</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveMap;