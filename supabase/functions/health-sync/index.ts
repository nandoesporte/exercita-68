import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HealthDataInput {
  date: string;
  steps?: number;
  heart_rate?: number;
  sleep_hours?: number;
  calories?: number;
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

    // Set auth token
    supabaseClient.auth.setAuth(authHeader.replace('Bearer ', ''))

    // Get user from auth token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST') {
      // Sync health data
      const body = await req.json()
      const healthData: HealthDataInput[] = Array.isArray(body) ? body : [body]

      console.log(`Syncing ${healthData.length} health data entries for user ${user.id}`)

      const results = []
      
      for (const data of healthData) {
        // Validate required fields
        if (!data.date) {
          results.push({ error: 'Date is required', data })
          continue
        }

        // Insert or update health data
        const { data: existingData, error: selectError } = await supabaseClient
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
          const { data: updatedData, error: updateError } = await supabaseClient
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
          const { data: insertedData, error: insertError } = await supabaseClient
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

      return new Response(
        JSON.stringify({ 
          message: 'Health data sync completed',
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

      let query = supabaseClient
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