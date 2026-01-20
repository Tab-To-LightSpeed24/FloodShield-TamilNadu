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
    const { location } = await req.json();
    if (!location) {
      return new Response(JSON.stringify({ error: "Location query is required." }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Bounding box for Tamil Nadu, India
    const viewbox = "76.2,8.0,80.4,13.6";

    const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&countrycodes=in&viewbox=${viewbox}&bounded=1&limit=1`;

    const geocodeResponse = await fetch(geocodeUrl, {
      headers: {
        // Nominatim API requires a User-Agent header for identification
        'User-Agent': 'FloodShieldApp/1.0 (https://lalhotmhfmxyfwxmqrtq.supabase.co)'
      }
    });

    if (!geocodeResponse.ok) {
      throw new Error("Failed to connect to the geocoding service.");
    }

    const geocodeData = await geocodeResponse.json();

    if (geocodeData.length > 0) {
      const result = geocodeData[0];
      return new Response(JSON.stringify({
        isValid: true,
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        displayName: result.display_name,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else {
      return new Response(JSON.stringify({
        isValid: false,
        message: "Could not find this location within Tamil Nadu. Please be more specific."
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

  } catch (error) {
    console.error("Error in validate-location function:", error);
    return new Response(JSON.stringify({ error: error.message || "An unexpected error occurred." }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}) 