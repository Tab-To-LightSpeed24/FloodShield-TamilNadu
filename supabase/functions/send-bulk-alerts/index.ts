import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import twilio from "npm:twilio";

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

    const { message } = await req.json()
    if (!message || typeof message !== 'string' || message.trim() === '') {
        return new Response(JSON.stringify({ error: 'Message is required.' }), { status: 400, headers: corsHeaders })
    }

    const { data: profilesWithPhones, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('phone')
      .not('phone', 'is', null)
      .neq('phone', '')

    if (profilesError) throw profilesError

    const phoneNumbers = profilesWithPhones
      .map(p => {
        if (!p.phone) return null;
        // Clean the number by removing all non-digit characters
        let cleaned = p.phone.replace(/\D/g, '');
        
        // If it's a 10-digit number (common for India), prepend +91
        if (cleaned.length === 10) {
          return `+91${cleaned}`;
        }
        // If it's 12 digits and starts with 91, it's just missing the +
        if (cleaned.length === 12 && cleaned.startsWith('91')) {
          return `+${cleaned}`;
        }
        // If the original number already starts with a +, assume it's correctly formatted
        if (p.phone.startsWith('+')) {
          return p.phone;
        }
        
        // If we can't determine a valid format, return null to filter it out
        return null;
      })
      .filter(Boolean) as string[]; // Filter out any nulls

    if (phoneNumbers.length === 0) {
      return new Response(JSON.stringify({ message: "No users with valid phone numbers to send alerts to." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Get Twilio credentials
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const smsFromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    const whatsappFromNumber = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

    if (!accountSid || !authToken) {
        console.error("Twilio credentials are not configured.");
        return new Response(JSON.stringify({ error: "Server configuration error: Twilio is not set up." }), { status: 500, headers: corsHeaders })
    }

    const client = twilio(accountSid, authToken);
    const allPromises = [];

    // Add SMS promises
    if (smsFromNumber) {
      phoneNumbers.forEach(number => {
        allPromises.push(client.messages.create({ to: number, from: smsFromNumber, body: message }));
      });
    }

    // Add WhatsApp promises
    if (whatsappFromNumber) {
      phoneNumbers.forEach(number => {
        // For WhatsApp, Twilio expects the number in the format 'whatsapp:+[number]'
        allPromises.push(client.messages.create({ to: `whatsapp:${number}`, from: `whatsapp:${whatsappFromNumber}`, body: message }));
      });
    }

    if (allPromises.length === 0) {
      return new Response(JSON.stringify({ error: "No notification channels (SMS or WhatsApp) are configured in secrets." }), { status: 500, headers: corsHeaders });
    }

    const results = await Promise.allSettled(allPromises);
    const successfulSends = results.filter(r => r.status === 'fulfilled').length;
    const failedSends = results.filter(r => r.status === 'rejected').length;

    if (failedSends > 0) {
      console.error("Some messages failed to send:", results.filter(r => r.status === 'rejected'));
    }

    return new Response(
        JSON.stringify({ message: `Broadcast complete. Successful sends: ${successfulSends}. Failed: ${failedSends}.` }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("Error in send-bulk-alerts function:", error);
    return new Response(
        JSON.stringify({ error: error.message }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})