import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Droplets, AlertCircle } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const DEFAULT_LOCATION = "Chennai";

const fetchWeatherForecast = async (location: string) => {
  const { data, error } = await supabase.functions.invoke("get-weather-forecast", {
    body: { location },
  });

  if (error) {
    if (error.context && typeof error.context.json === 'function') {
      const errorJson = await error.context.json();
      throw new Error(errorJson.error || `Function returned an unhandled error.`);
    }
    throw new Error(`Function invocation failed: ${error.message}`);
  }
  
  return data;
};

const WeatherForecast = () => {
  const { session } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useProfile();

  const location = (session && profile?.home_location) ? profile.home_location : DEFAULT_LOCATION;
  const displayLocation = (session && profile?.home_location) ? profile.home_location.split(',')[0] : DEFAULT_LOCATION;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["weatherForecast", location],
    queryFn: () => fetchWeatherForecast(location),
    enabled: !isProfileLoading,
    staleTime: 10 * 60 * 1000, // Refetch every 10 minutes
    retry: false,
  });

  const effectiveIsLoading = isLoading || isProfileLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-base font-semibold">
          <Droplets className="mr-2 h-5 w-5 text-cyan-500" />
          Rainfall Forecast
        </CardTitle>
      </CardHeader>
      <CardContent>
        {effectiveIsLoading && (
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
        {data && !effectiveIsLoading && (
          <>
            <div className="text-2xl font-bold capitalize">
              {data.list?.[0]?.weather?.[0]?.description}
            </div>
            <p className="text-sm text-muted-foreground">
              In {displayLocation}, for the next few hours.
            </p>
            <Link to="/forecast" className="text-sm text-primary hover:underline mt-2 inline-block">
              View detailed forecast &rarr;
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default WeatherForecast;