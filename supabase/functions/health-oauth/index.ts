import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OAuthRequest {
  provider: 'apple_health' | 'google_fit' | 'samsung_health';
  connection_id?: string;
  action: 'initiate' | 'callback' | 'revoke';
  code?: string;
  state?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const { provider, action, connection_id, code, state }: OAuthRequest = await req.json();

    console.log(`Processing ${action} request for ${provider}`);

    // Get provider settings
    const { data: providerSettings, error: settingsError } = await supabase
      .from('health_provider_settings')
      .select('*')
      .eq('provider', provider)
      .single();

    if (settingsError || !providerSettings?.is_enabled) {
      throw new Error('Provider not enabled or configured');
    }

    if (action === 'initiate') {
      // Generate OAuth URL based on provider
      let authUrl = '';
      const baseUrl = `${req.url.split('/functions')[0]}`;
      const redirectUri = `${baseUrl}/functions/v1/health-oauth`;

      switch (provider) {
        case 'google_fit':
          const googleScopes = providerSettings.scopes.join(' ');
          authUrl = `https://accounts.google.com/oauth/v2/auth?` +
            `client_id=${providerSettings.client_id}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `scope=${encodeURIComponent(googleScopes)}&` +
            `response_type=code&` +
            `access_type=offline&` +
            `state=${provider}_${connection_id}`;
          break;

        case 'apple_health':
          // Apple Health uses a different flow (requires iOS app)
          // For web, we'll return instructions instead
          return new Response(
            JSON.stringify({
              success: false,
              message: 'Apple Health requer um aplicativo iOS. Use o app móvel para conectar.',
              requires_mobile_app: true
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400
            }
          );

        case 'samsung_health':
          const samsungScopes = providerSettings.scopes.join(',');
          authUrl = `https://developer.samsung.com/oauth/v2.0/authorize?` +
            `client_id=${providerSettings.client_id}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `scope=${encodeURIComponent(samsungScopes)}&` +
            `response_type=code&` +
            `state=${provider}_${connection_id}`;
          break;
      }

      return new Response(
        JSON.stringify({ auth_url: authUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'callback') {
      // Handle OAuth callback
      if (!code || !state) {
        throw new Error('Missing code or state parameter');
      }

      const [providerFromState, connectionId] = state.split('_');
      if (providerFromState !== provider) {
        throw new Error('Invalid state parameter');
      }

      // Exchange code for tokens
      let tokenData;
      const redirectUri = `${req.url.split('/functions')[0]}/functions/v1/health-oauth`;

      switch (provider) {
        case 'google_fit':
          const googleTokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: providerSettings.client_id!,
              client_secret: providerSettings.client_secret!,
              code,
              grant_type: 'authorization_code',
              redirect_uri: redirectUri
            })
          });
          tokenData = await googleTokenResponse.json();
          break;

        case 'samsung_health':
          const samsungTokenResponse = await fetch('https://developer.samsung.com/oauth/v2.0/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: providerSettings.client_id!,
              client_secret: providerSettings.client_secret!,
              code,
              grant_type: 'authorization_code',
              redirect_uri: redirectUri
            })
          });
          tokenData = await samsungTokenResponse.json();
          break;
      }

      if (!tokenData?.access_token) {
        throw new Error('Failed to obtain access token');
      }

      // Update connection with tokens
      const expiresAt = tokenData.expires_in 
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null;

      const { error: updateError } = await supabase
        .from('health_connections')
        .update({
          status: 'connected',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: expiresAt,
          error_message: null
        })
        .eq('id', connectionId);

      if (updateError) {
        throw updateError;
      }

      // Trigger initial sync
      await supabase.functions.invoke('health-sync', {
        body: { 
          provider,
          sync_type: 'initial',
          connection_id: connectionId
        }
      });

      // Redirect back to app
      const appUrl = `${req.url.split('/functions')[0]}/health?connected=${provider}`;
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, 'Location': appUrl }
      });
    }

    if (action === 'revoke') {
      // Revoke tokens on provider side
      const { data: connection } = await supabase
        .from('health_connections')
        .select('access_token')
        .eq('user_id', user.id)
        .eq('provider', provider)
        .single();

      if (connection?.access_token) {
        switch (provider) {
          case 'google_fit':
            await fetch(`https://oauth2.googleapis.com/revoke?token=${connection.access_token}`, {
              method: 'POST'
            });
            break;

          case 'samsung_health':
            await fetch('https://developer.samsung.com/oauth/v2.0/revoke', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                client_id: providerSettings.client_id!,
                client_secret: providerSettings.client_secret!,
                token: connection.access_token
              })
            });
            break;
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('OAuth error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});