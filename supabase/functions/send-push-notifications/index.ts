import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
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

    const { title, message } = await req.json()
    if (!title || !message || title.trim() === '' || message.trim() === '') {
        return new Response(JSON.stringify({ error: 'Title and message are required.' }), { status: 400, headers: corsHeaders })
    }

    const fcmServerKey = Deno.env.get("FCM_SERVER_KEY");
    if (!fcmServerKey) {
      console.error("FCM_SERVER_KEY not found.");
      return new Response(JSON.stringify({ error: "Server configuration error: FCM Server Key is not set." }), { status: 500, headers: corsHeaders });
    }

    // Fetch all Android device tokens
    const { data: deviceTokens, error: tokensError } = await supabaseAdmin
      .from('device_tokens')
      .select('token')
      .eq('platform', 'android'); // Targeting Android devices

    if (tokensError) throw tokensError;

    const tokens = deviceTokens.map(dt => dt.token);

    if (tokens.length === 0) {
      return new Response(JSON.stringify({ message: "No Android devices registered for push notifications." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const fcmEndpoint = 'https://fcm.googleapis.com/fcm/send';
    const notificationPromises = [];

    // FCM allows sending to multiple tokens in one request (up to 500)
    // For simplicity, we'll send one by one here, but batching is more efficient for large scale.
    for (const token of tokens) {
      const payload = {
        to: token,
        notification: {
          title: title,
          body: message,
        },
        data: {
          // Optional: custom data for your app to handle
          type: 'alert',
          message: message,
        },
      };

      notificationPromises.push(
        fetch(fcmEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `key=${fcmServerKey}`,
          },
          body: JSON.stringify(payload),
        }).then(res => res.json())
      );
    }

    const results = await Promise.allSettled(notificationPromises);
    const successfulSends = results.filter(r => r.status === 'fulfilled' && r.value.success === 1).length;
    const failedSends = results.filter(r => r.status === 'rejected' || r.value.failure === 1).length;

    if (failedSends > 0) {
      console.error("Some push notifications failed to send:", results.filter(r => r.status === 'rejected' || r.value.failure === 1));
    }

    return new Response(
        JSON.stringify({ message: `Push notification broadcast complete. Successful sends: ${successfulSends}. Failed: ${failedSends}.` }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("Error in send-push-notifications function:", error);
    return new Response(
        JSON.stringify({ error: error.message }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})