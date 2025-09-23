import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { Twilio } from "https://deno.land/x/twilio@0.10.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Use the Service Role Key to verify the user is an admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify the calling user is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Missing authorization header' }), { status: 401, headers: corsHeaders })
    }
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt)
    if (userError) throw userError

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profileError) throw profileError
    
    if (profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: User is not an admin' }), { status: 403, headers: corsHeaders })
    }

    // Get the message from the request body
    const { message } = await req.json()
    if (!message || typeof message !== 'string' || message.trim() === '') {
        return new Response(JSON.stringify({ error: 'Message is required and must be a non-empty string.' }), { status: 400, headers: corsHeaders })
    }

    // Get all users with phone numbers
    const { data: profilesWithPhones, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('phone')
      .not('phone', 'is', null)
      .neq('phone', '')

    if (profilesError) throw profilesError

    const phoneNumbers = profilesWithPhones.map(p => p.phone).filter(Boolean);
    if (phoneNumbers.length === 0) {
      return new Response(JSON.stringify({ message: "No users with phone numbers to send alerts to." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Get Twilio credentials from environment variables
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!accountSid || !authToken || !twilioPhoneNumber) {
        console.error("Twilio credentials are not configured in Supabase secrets.");
        return new Response(JSON.stringify({ error: "Server configuration error: Twilio is not set up." }), { status: 500, headers: corsHeaders })
    }

    const twilio = new Twilio(accountSid, authToken);

    // Send messages to all numbers
    const messagePromises = phoneNumbers.map(number => {
      return twilio.messages.create({
        to: number,
        from: twilioPhoneNumber,
        body: message,
      });
    });

    await Promise.all(messagePromises);

    return new Response(
        JSON.stringify({ message: `Successfully sent alert to ${phoneNumbers.length} user(s).` }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("Error in send-bulk-sms function:", error);
    return new Response(
        JSON.stringify({ error: error.message }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})