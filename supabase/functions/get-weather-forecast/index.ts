import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { lat, lng } = await req.json();
    if (!lat || !lng) {
      return new Response(
        JSON.stringify({ error: "Latitude and longitude are required." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = Deno.env.get("OPENWEATHERMAP_API_KEY");
    if (!apiKey) {
      console.error("OPENWEATHERMAP_API_KEY not found in environment variables.");
      return new Response(
        JSON.stringify({ error: "Server configuration error: Weather API key is not set." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;

    const weatherResponse = await fetch(weatherUrl);
    const responseBody = await weatherResponse.text(); // Read body as text to handle both success and error cases

    if (!weatherResponse.ok) {
      console.error(`OpenWeatherMap API error: ${weatherResponse.status} ${weatherResponse.statusText}`, responseBody);
      // Try to parse the error response from OpenWeatherMap
      let errorMessage = `Failed to fetch weather data: ${weatherResponse.statusText}`;
      try {
        const errorJson = JSON.parse(responseBody);
        if (errorJson.message) {
          errorMessage = `OpenWeatherMap API Error: ${errorJson.message}`;
        }
      } catch (e) {
        // Ignore if parsing fails, use the original status text
      }
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: weatherResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // If response is OK, parse the JSON and send it back
    const weatherData = JSON.parse(responseBody);

    return new Response(
      JSON.stringify(weatherData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error("Unhandled error in get-weather-forecast function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred." }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})