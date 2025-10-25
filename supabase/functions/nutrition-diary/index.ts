import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);

    // POST /nutrition-diary - Create diary entry
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('Creating diary entry:', body);

      // Validate required fields
      if (!body.user_id || !body.data || !body.hora || !body.refeicao_tipo || !body.alimentos) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate meal type
      const validMealTypes = ['cafe', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar', 'ceia'];
      if (!validMealTypes.includes(body.refeicao_tipo)) {
        return new Response(
          JSON.stringify({ error: 'Invalid meal type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate total calories from alimentos
      const totalCalorias = body.alimentos.reduce((sum: number, alimento: any) => {
        return sum + (alimento.calorias || 0);
      }, 0);

      const entryData = {
        user_id: body.user_id,
        data: body.data,
        hora: body.hora,
        refeicao_tipo: body.refeicao_tipo,
        alimentos: body.alimentos,
        foto_url: body.foto_url || null,
        anotacao: body.anotacao || null,
        total_calorias: totalCalorias
      };

      const { data, error } = await supabaseClient
        .from('diario_alimentar')
        .insert(entryData)
        .select()
        .single();

      if (error) {
        console.error('Error creating diary entry:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Diary entry created successfully');
      return new Response(
        JSON.stringify(data),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /nutrition-diary/{user_id}?data=YYYY-MM-DD
    if (req.method === 'GET') {
      const pathParts = url.pathname.split('/').filter(Boolean);
      const userId = pathParts[pathParts.length - 1];
      const date = url.searchParams.get('data');

      console.log('Fetching diary entries for user:', userId, 'date:', date);

      let query = supabaseClient
        .from('diario_alimentar')
        .select('*')
        .eq('user_id', userId)
        .order('hora', { ascending: true });

      if (date) {
        query = query.eq('data', date);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching diary entries:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate daily totals if date is provided
      let totals = null;
      if (date && data) {
        totals = {
          total_calorias: data.reduce((sum, entry) => sum + Number(entry.total_calorias || 0), 0),
          total_refeicoes: data.length
        };
      }

      return new Response(
        JSON.stringify({ entries: data, totals }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
