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
    const { lat, lng } = await req.json();
    const apiKey = Deno.env.get("OPENWEATHERMAP_API_KEY");

    if (!apiKey) {
      throw new Error("OpenWeatherMap API key not set in Supabase secrets.");
    }
    
    if (!lat || !lng) {
      throw new Error("Latitude and longitude are required.");
    }

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;

    const weatherResponse = await fetch(weatherUrl);
    if (!weatherResponse.ok) {
      throw new Error(`Failed to fetch weather data: ${weatherResponse.statusText}`);
    }
    const weatherData = await weatherResponse.json();

    return new Response(
      JSON.stringify(weatherData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})