import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RegisterDeviceRequest {
  deviceId: string;
  platform: 'android' | 'ios';
  deviceName?: string;
  appVersion?: string;
  consents: {
    steps: boolean;
    heart_rate: boolean;
    sleep: boolean;
    calories: boolean;
  };
}

// Generate random HMAC secret
function generateHmacSecret(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get auth token from request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create authenticated client
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    )

    // Get user from auth token
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST') {
      const body: RegisterDeviceRequest = await req.json()
      
      // Validate required fields
      if (!body.deviceId || !body.platform || !body.consents) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: deviceId, platform, consents' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Validate platform
      if (!['android', 'ios'].includes(body.platform)) {
        return new Response(
          JSON.stringify({ error: 'Platform must be "android" or "ios"' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Registering device for user ${user.id}: ${body.deviceId} (${body.platform})`)

      // Generate HMAC secret
      const hmacSecret = generateHmacSecret()

      // Check if device already exists and update or create
      const { data: existingDevice, error: existingError } = await supabaseAuth
        .from('device_keys')
        .select('id')
        .eq('user_id', user.id)
        .eq('device_id', body.deviceId)
        .eq('platform', body.platform)
        .single()

      if (existingError && existingError.code !== 'PGRST116') {
        console.error('Error checking existing device:', existingError)
        return new Response(
          JSON.stringify({ error: 'Database error checking existing device' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      let deviceResult
      if (existingDevice) {
        // Update existing device
        const { data: updatedDevice, error: updateError } = await supabaseAuth
          .from('device_keys')
          .update({
            hmac_secret: hmacSecret,
            device_name: body.deviceName,
            app_version: body.appVersion,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingDevice.id)
          .select()
          .single()

        if (updateError) {
          console.error('Error updating device:', updateError)
          return new Response(
            JSON.stringify({ error: 'Failed to update device registration' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        deviceResult = updatedDevice
      } else {
        // Create new device
        const { data: newDevice, error: insertError } = await supabaseAuth
          .from('device_keys')
          .insert({
            user_id: user.id,
            device_id: body.deviceId,
            platform: body.platform,
            hmac_secret: hmacSecret,
            device_name: body.deviceName,
            app_version: body.appVersion,
            is_active: true
          })
          .select()
          .single()

        if (insertError) {
          console.error('Error creating device:', insertError)
          return new Response(
            JSON.stringify({ error: 'Failed to register device' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        deviceResult = newDevice
      }

      // Store health consents
      const consentEntries = Object.entries(body.consents).map(([type, granted]) => ({
        user_id: user.id,
        device_id: body.deviceId,
        platform: body.platform,
        consent_type: type,
        granted,
        granted_at: granted ? new Date().toISOString() : null,
        revoked_at: !granted ? new Date().toISOString() : null
      }))

      // Delete existing consents for this device and create new ones
      await supabaseAuth
        .from('health_consents')
        .delete()
        .eq('user_id', user.id)
        .eq('device_id', body.deviceId)
        .eq('platform', body.platform)

      const { error: consentError } = await supabaseAuth
        .from('health_consents')
        .insert(consentEntries)

      if (consentError) {
        console.error('Error storing consents:', consentError)
        return new Response(
          JSON.stringify({ error: 'Failed to store health consents' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Device registered successfully: ${deviceResult.id}`)

      return new Response(
        JSON.stringify({ 
          success: true,
          deviceId: deviceResult.id,
          hmacSecret: hmacSecret,
          message: 'Device registered successfully'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET method - retrieve device registration status
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const deviceId = url.searchParams.get('deviceId')
      const platform = url.searchParams.get('platform')

      if (!deviceId || !platform) {
        return new Response(
          JSON.stringify({ error: 'Missing deviceId or platform parameters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: device, error: deviceError } = await supabaseAuth
        .from('device_keys')
        .select('id, device_name, app_version, is_active, created_at, last_used_at')
        .eq('user_id', user.id)
        .eq('device_id', deviceId)
        .eq('platform', platform)
        .single()

      if (deviceError && deviceError.code !== 'PGRST116') {
        console.error('Error fetching device:', deviceError)
        return new Response(
          JSON.stringify({ error: 'Database error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!device) {
        return new Response(
          JSON.stringify({ registered: false }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get consents
      const { data: consents, error: consentError } = await supabaseAuth
        .from('health_consents')
        .select('consent_type, granted')
        .eq('user_id', user.id)
        .eq('device_id', deviceId)
        .eq('platform', platform)

      if (consentError) {
        console.error('Error fetching consents:', consentError)
      }

      const consentMap = consents?.reduce((acc, consent) => {
        acc[consent.consent_type] = consent.granted
        return acc
      }, {} as Record<string, boolean>) || {}

      return new Response(
        JSON.stringify({
          registered: true,
          device: {
            id: device.id,
            deviceName: device.device_name,
            appVersion: device.app_version,
            isActive: device.is_active,
            createdAt: device.created_at,
            lastUsedAt: device.last_used_at
          },
          consents: consentMap
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})