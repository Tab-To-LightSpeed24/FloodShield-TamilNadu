import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import * as jose from "npm:jose"; // Import jose for JWT signing

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to get an FCM access token using the service account key
async function getFCMToken(serviceAccountKey: any): Promise<string> {
  const privateKey = serviceAccountKey.private_key;
  const clientEmail = serviceAccountKey.client_email;

  const jwt = await new jose.SignJWT({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('1h') // Token valid for 1 hour
    .sign(await jose.importPKCS8(privateKey, 'RS256'));

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get FCM access token: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
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

    const fcmServiceAccountKeyJson = Deno.env.get("FCM_SERVICE_ACCOUNT_KEY");
    if (!fcmServiceAccountKeyJson) {
      console.error("FCM_SERVICE_ACCOUNT_KEY not found.");
      return new Response(JSON.stringify({ error: "Server configuration error: FCM Service Account Key is not set." }), { status: 500, headers: corsHeaders });
    }

    let serviceAccountKey;
    try {
      serviceAccountKey = JSON.parse(fcmServiceAccountKeyJson);
    } catch (e) {
      console.error("Failed to parse FCM_SERVICE_ACCOUNT_KEY:", e);
      return new Response(JSON.stringify({ error: "Server configuration error: Invalid FCM Service Account Key format." }), { status: 500, headers: corsHeaders });
    }

    const accessToken = await getFCMToken(serviceAccountKey);

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

    const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${serviceAccountKey.project_id}/messages:send`;
    const notificationPromises = [];

    for (const token of tokens) {
      const payload = {
        message: {
          token: token,
          notification: {
            title: title,
            body: message,
          },
          data: {
            type: 'alert',
            message: message,
          },
        },
      };

      notificationPromises.push(
        fetch(fcmEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        }).then(res => res.json())
      );
    }

    const results = await Promise.allSettled(notificationPromises);
    const successfulSends = results.filter(r => r.status === 'fulfilled' && !r.value.error).length;
    const failedSends = results.filter(r => r.status === 'rejected' || r.value.error).length;

    if (failedSends > 0) {
      console.error("Some push notifications failed to send:", results.filter(r => r.status === 'rejected' || r.value.error));
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