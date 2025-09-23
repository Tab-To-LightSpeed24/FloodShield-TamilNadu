import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Droplets, AlertCircle } from "lucide-react";

// Using Chennai as the default location for the forecast
const DEFAULT_LAT = 13.0827;
const DEFAULT_LNG = 80.2707;

const fetchWeatherForecast = async () => {
  const { data, error } = await supabase.functions.invoke("get-weather-forecast", {
    body: { lat: DEFAULT_LAT, lng: DEFAULT_LNG },
  });

  if (error) {
    // For non-2xx responses, error.context is the original Response object.
    // We need to await its JSON to get the detailed error message.
    if (error.context && typeof error.context.json === 'function') {
      const errorJson = await error.context.json();
      throw new Error(errorJson.error || `Function returned an unhandled error.`);
    }
    throw new Error(`Function invocation failed: ${error.message}`);
  }
  
  return data;
};

const WeatherForecast = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["weatherForecast"],
    queryFn: fetchWeatherForecast,
    staleTime: 10 * 60 * 1000, // Refetch every 10 minutes
    retry: false, // Disable retries to see the specific error immediately
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-base font-semibold">
          <Droplets className="mr-2 h-5 w-5 text-cyan-500" />
          Rainfall Forecast
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}
        {isError && (
          <div className="flex items-center text-sm text-destructive">
            <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0" />
            <p>{error.message}</p>
          </div>
        )}
        {data && !isLoading && (
          <>
            <div className="text-2xl font-bold capitalize">
              {data.weather[0].description}
            </div>
            <p className="text-sm text-muted-foreground">
              In Chennai, for the next few hours
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default WeatherForecast;