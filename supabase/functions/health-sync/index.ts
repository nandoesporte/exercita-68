import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature, x-idempotency-key',
}

interface HealthDataInput {
  date: string;
  steps?: number;
  heart_rate?: number;
  sleep_hours?: number;
  calories?: number;
}

interface CompanionAppSyncData {
  deviceId: string;
  platform: 'android' | 'ios';
  window: {
    from: string;
    to: string;
  };
  data: HealthDataInput[];
}

// Verify HMAC signature
async function verifyHmacSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const expectedSignature = signature.replace('sha256=', '')
    
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const messageData = encoder.encode(body)
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signature_buffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
    const actualSignature = Array.from(new Uint8Array(signature_buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    return actualSignature === expectedSignature
  } catch (error) {
    console.error('HMAC verification error:', error)
    return false
  }
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
      // Get request body as text first for HMAC verification
      const bodyText = await req.text()
      let body: HealthDataInput[] | CompanionAppSyncData
      
      try {
        body = JSON.parse(bodyText)
      } catch {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON body' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if this is a companion app sync (has deviceId and platform)
      const isCompanionSync = 'deviceId' in body && 'platform' in body
      let deviceId: string | null = null
      let platform: string | null = null
      let idempotencyKey: string | null = null
      let hmacValid = false

      if (isCompanionSync) {
        const syncData = body as CompanionAppSyncData
        deviceId = syncData.deviceId
        platform = syncData.platform
        idempotencyKey = req.headers.get('X-Idempotency-Key')
        
        // Verify HMAC signature for companion app sync
        const signature = req.headers.get('X-Signature')
        if (!signature) {
          return new Response(
            JSON.stringify({ error: 'Missing X-Signature header for companion app sync' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (!idempotencyKey) {
          return new Response(
            JSON.stringify({ error: 'Missing X-Idempotency-Key header for companion app sync' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Get device HMAC secret
        const { data: deviceData, error: deviceError } = await supabaseAuth
          .from('device_keys')
          .select('hmac_secret, is_active')
          .eq('user_id', user.id)
          .eq('device_id', deviceId)
          .eq('platform', platform)
          .single()

        if (deviceError || !deviceData) {
          console.error('Device not found or error:', deviceError)
          return new Response(
            JSON.stringify({ error: 'Device not registered or inactive' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (!deviceData.is_active) {
          return new Response(
            JSON.stringify({ error: 'Device is inactive' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Verify HMAC
        hmacValid = await verifyHmacSignature(bodyText, signature, deviceData.hmac_secret)
        if (!hmacValid) {
          console.error('HMAC verification failed')
          return new Response(
            JSON.stringify({ error: 'Invalid signature' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Check for duplicate idempotency key
        const { data: existingSync, error: idempotencyError } = await supabaseAuth
          .from('health_sync_logs')
          .select('id')
          .eq('user_id', user.id)
          .eq('idempotency_key', idempotencyKey)
          .single()

        if (existingSync) {
          return new Response(
            JSON.stringify({ 
              message: 'Request already processed',
              syncLogId: existingSync.id
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Update device last used timestamp
        await supabaseAuth
          .from('device_keys')
          .update({ last_used_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('device_id', deviceId)
          .eq('platform', platform)
      }

      const healthData: HealthDataInput[] = isCompanionSync 
        ? (body as CompanionAppSyncData).data 
        : (Array.isArray(body) ? body : [body])

      console.log(`Syncing ${healthData.length} health data entries for user ${user.id}${isCompanionSync ? ` from ${platform} device ${deviceId}` : ''}`)

      // Create sync log entry
      const syncLogData = {
        user_id: user.id,
        provider: isCompanionSync ? platform : 'web',
        sync_type: isCompanionSync ? 'companion_app' : 'manual',
        sync_started_at: new Date().toISOString(),
        device_id: deviceId,
        platform: platform,
        hmac_valid: hmacValid,
        idempotency_key: idempotencyKey,
        data_range_start: healthData.length > 0 ? healthData[0].date : null,
        data_range_end: healthData.length > 0 ? healthData[healthData.length - 1].date : null
      }

      const { data: syncLog, error: syncLogError } = await supabaseAuth
        .from('health_sync_logs')
        .insert(syncLogData)
        .select()
        .single()

      if (syncLogError) {
        console.error('Error creating sync log:', syncLogError)
      }

      const results = []
      
      for (const data of healthData) {
        // Validate required fields
        if (!data.date) {
          results.push({ error: 'Date is required', data })
          continue
        }

        // Insert or update health data
        const { data: existingData, error: selectError } = await supabaseAuth
          .from('health_data')
          .select('id')
          .eq('user_id', user.id)
          .eq('date', data.date)
          .single()

        if (selectError && selectError.code !== 'PGRST116') {
          console.error('Select error:', selectError)
          results.push({ error: selectError.message, data })
          continue
        }

        let result
        if (existingData) {
          // Update existing record
          const { data: updatedData, error: updateError } = await supabaseAuth
            .from('health_data')
            .update({
              steps: data.steps,
              heart_rate: data.heart_rate,
              sleep_hours: data.sleep_hours,
              calories: data.calories
            })
            .eq('id', existingData.id)
            .select()
            .single()

          if (updateError) {
            console.error('Update error:', updateError)
            results.push({ error: updateError.message, data })
          } else {
            results.push({ success: true, data: updatedData, action: 'updated' })
          }
        } else {
          // Insert new record
          const { data: insertedData, error: insertError } = await supabaseAuth
            .from('health_data')
            .insert({
              user_id: user.id,
              date: data.date,
              steps: data.steps,
              heart_rate: data.heart_rate,
              sleep_hours: data.sleep_hours,
              calories: data.calories
            })
            .select()
            .single()

          if (insertError) {
            console.error('Insert error:', insertError)
            results.push({ error: insertError.message, data })
          } else {
            results.push({ success: true, data: insertedData, action: 'created' })
          }
        }
      }

      // Update sync log with results
      if (syncLog) {
        await supabaseAuth
          .from('health_sync_logs')
          .update({
            sync_completed_at: new Date().toISOString(),
            status: results.filter(r => r.error).length > 0 ? 'partial_success' : 'success',
            records_synced: results.filter(r => r.success).length,
            error_message: results.filter(r => r.error).length > 0 
              ? `${results.filter(r => r.error).length} records failed` 
              : null
          })
          .eq('id', syncLog.id)
      }

      return new Response(
        JSON.stringify({ 
          message: 'Health data sync completed',
          syncLogId: syncLog?.id,
          results,
          summary: {
            total: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => r.error).length
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'GET') {
      // Get health data for user
      const url = new URL(req.url)
      const startDate = url.searchParams.get('start_date')
      const endDate = url.searchParams.get('end_date')
      const limit = parseInt(url.searchParams.get('limit') || '30')

      let query = supabaseAuth
        .from('health_data')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(limit)

      if (startDate) {
        query = query.gte('date', startDate)
      }
      if (endDate) {
        query = query.lte('date', endDate)
      }

      const { data, error } = await query

      if (error) {
        console.error('Query error:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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