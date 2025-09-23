import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { lat, lng, location } = await req.json();
    const apiKey = Deno.env.get("OPENWEATHERMAP_API_KEY");

    if (!apiKey) {
      console.error("OPENWEATHERMAP_API_KEY not found.");
      return new Response(JSON.stringify({ error: "Server configuration error." }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let latitude = lat;
    let longitude = lng;

    // If location string is provided and lat/lng are not, geocode it first.
    if (location && (!lat || !lng)) {
      const geocodeUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`;
      const geocodeResponse = await fetch(geocodeUrl);
      if (!geocodeResponse.ok) {
        throw new Error("Failed to geocode location.");
      }
      const geocodeData = await geocodeResponse.json();
      if (geocodeData.length === 0) {
        return new Response(JSON.stringify({ error: `Could not find location: ${location}` }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      latitude = geocodeData[0].lat;
      longitude = geocodeData[0].lon;
    }

    if (!latitude || !longitude) {
      return new Response(JSON.stringify({ error: "Latitude and longitude or a location name are required." }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
    const weatherResponse = await fetch(weatherUrl);
    const responseBody = await weatherResponse.text();

    if (!weatherResponse.ok) {
      console.error(`OpenWeatherMap API error: ${weatherResponse.status}`, responseBody);
      let errorMessage = `Failed to fetch weather data: ${weatherResponse.statusText}`;
      try {
        const errorJson = JSON.parse(responseBody);
        if (errorJson.message) errorMessage = `OpenWeatherMap API Error: ${errorJson.message}`;
      } catch (e) { /* ignore */ }
      return new Response(JSON.stringify({ error: errorMessage }), { status: weatherResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    const weatherData = JSON.parse(responseBody);

    return new Response(JSON.stringify(weatherData), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("Error in get-weather-forecast function:", error);
    return new Response(JSON.stringify({ error: error.message || "An unexpected error occurred." }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})