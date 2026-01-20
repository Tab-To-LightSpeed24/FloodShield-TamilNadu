import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Thermometer, Droplets, Wind, Sunrise, Sunset } from "lucide-react";
import { WeatherIcon } from "@/components/WeatherIcon";
import { format } from "date-fns";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

const DEFAULT_LOCATION = "Chennai";

const fetchDetailedForecast = async (location: string) => {
  const { data, error } = await supabase.functions.invoke("get-weather-forecast", {
    body: { location },
  });

  if (error) {
    const errorJson = await error.context?.json();
    throw new Error(errorJson?.error || `Function invocation failed.`);
  }
  return data;
};

const processDailyForecast = (list: any[]) => {
  if (!list) return [];
  const dailyData: { [key: string]: any } = {};

  list.forEach(item => {
    const day = format(new Date(item.dt * 1000), "yyyy-MM-dd");
    if (!dailyData[day]) {
      dailyData[day] = {
        temps: [],
        icons: {},
        descriptions: {},
      };
    }
    dailyData[day].temps.push(item.main.temp);
    const icon = item.weather[0].icon;
    const desc = item.weather[0].description;
    dailyData[day].icons[icon] = (dailyData[day].icons[icon] || 0) + 1;
    dailyData[day].descriptions[desc] = (dailyData[day].descriptions[desc] || 0) + 1;
  });

  return Object.entries(dailyData).map(([day, data]) => {
    const mostCommonIcon = Object.keys(data.icons).reduce((a, b) => data.icons[a] > data.icons[b] ? a : b);
    const mostCommonDesc = Object.keys(data.descriptions).reduce((a, b) => data.descriptions[a] > data.descriptions[b] ? a : b);
    return {
      date: day,
      temp_max: Math.round(Math.max(...data.temps)),
      temp_min: Math.round(Math.min(...data.temps)),
      icon: mostCommonIcon,
      description: mostCommonDesc,
    };
  });
};

const DetailedForecast = () => {
  const { session } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useProfile();

  const location = (session && profile?.home_location) ? profile.home_location : DEFAULT_LOCATION;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["detailedForecast", location],
    queryFn: () => fetchDetailedForecast(location),
    enabled: !isProfileLoading,
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: false,
  });

  const effectiveIsLoading = isLoading || isProfileLoading;
  const current = data?.list?.[0];
  const hourly = data?.list?.slice(0, 8);
  const daily = processDailyForecast(data?.list);

  if (effectiveIsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="bg-destructive/10 border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Failed to load weather forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive/80">{error?.message}</p>
          <p className="text-sm text-muted-foreground mt-2">Please try again later or check if the location in your profile is valid.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Weather Forecast</h1>
        <p className="text-muted-foreground">Detailed forecast for {data.city.name}, {data.city.country}.</p>
      </div>

      {/* Current Weather */}
      <Card>
        <CardHeader>
          <CardTitle>Current Conditions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="flex gap-4 items-center">
            <WeatherIcon iconCode={current.weather[0].icon} className="w-24 h-24 text-yellow-500" />
            <div>
              <p className="text-6xl font-bold">{Math.round(current.main.temp)}°C</p>
              <p className="text-lg capitalize text-muted-foreground">{current.weather[0].description}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2"><Thermometer className="w-4 h-4 text-muted-foreground" /> Feels like: {Math.round(current.main.feels_like)}°C</div>
            <div className="flex items-center gap-2"><Droplets className="w-4 h-4 text-muted-foreground" /> Humidity: {current.main.humidity}%</div>
            <div className="flex items-center gap-2"><Wind className="w-4 h-4 text-muted-foreground" /> Wind: {current.wind.speed.toFixed(1)} m/s</div>
            <div className="flex items-center gap-2"><Sunrise className="w-4 h-4 text-muted-foreground" /> Sunrise: {format(new Date(data.city.sunrise * 1000), "p")}</div>
            <div className="flex items-center gap-2"><Sunset className="w-4 h-4 text-muted-foreground" /> Sunset: {format(new Date(data.city.sunset * 1000), "p")}</div>
          </div>
        </CardContent>
      </Card>

      {/* Hourly Forecast */}
      <Card>
        <CardHeader>
          <CardTitle>Next 24 Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea>
            <div className="flex space-x-4 pb-4">
              {hourly.map((item: any, index: number) => (
                <div key={index} className="flex flex-col items-center justify-center gap-2 p-2 rounded-lg min-w-[80px] bg-muted/50">
                  <p className="text-sm text-muted-foreground">{format(new Date(item.dt * 1000), "ha")}</p>
                  <WeatherIcon iconCode={item.weather[0].icon} className="w-8 h-8" />
                  <p className="font-bold">{Math.round(item.main.temp)}°C</p>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* 5-Day Forecast */}
      <Card>
        <CardHeader>
          <CardTitle>5-Day Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              {daily.map((day: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{format(new Date(day.date), "EEEE")}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <WeatherIcon iconCode={day.icon} className="w-6 h-6" />
                      <span className="capitalize hidden sm:inline">{day.description}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{day.temp_max}° / {day.temp_min}°</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DetailedForecast; 