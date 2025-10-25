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

    // GET /nutrition-recipes?tags=...&dificuldade=...
    if (req.method === 'GET') {
      const tags = url.searchParams.get('tags')?.split(',').filter(Boolean) || [];
      const dificuldade = url.searchParams.get('dificuldade');

      console.log('Fetching recipes with filters:', { tags, dificuldade });

      let query = supabaseClient
        .from('receitas')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by difficulty
      if (dificuldade) {
        query = query.eq('nivel_dificuldade', dificuldade);
      }

      // Filter by tags (contains any of the specified tags)
      if (tags.length > 0) {
        query = query.overlaps('tags', tags);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching recipes:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ recipes: data, count: data?.length || 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /nutrition-recipes - Create recipe (admin only)
    if (req.method === 'POST') {
      // Check if user is admin
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        return new Response(
          JSON.stringify({ error: 'Forbidden: Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      console.log('Creating recipe:', body);

      // Validate required fields
      if (!body.titulo || !body.ingredientes || !body.modo_preparo || !body.tempo_minutos || !body.rendimento) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate difficulty level
      if (body.nivel_dificuldade && !['fácil', 'médio', 'difícil'].includes(body.nivel_dificuldade)) {
        return new Response(
          JSON.stringify({ error: 'Invalid difficulty level' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const recipeData = {
        titulo: body.titulo,
        descricao_curta: body.descricao_curta || null,
        ingredientes: body.ingredientes,
        modo_preparo: body.modo_preparo,
        tempo_minutos: body.tempo_minutos,
        rendimento: body.rendimento,
        calorias_por_porcao: body.calorias_por_porcao || null,
        macros_por_porcao: body.macros_por_porcao || { proteina: 0, gordura: 0, carboidrato: 0 },
        tags: body.tags || [],
        nivel_dificuldade: body.nivel_dificuldade || null,
        imagem_url: body.imagem_url || null,
        criado_por: user.id
      };

      const { data, error } = await supabaseClient
        .from('receitas')
        .insert(recipeData)
        .select()
        .single();

      if (error) {
        console.error('Error creating recipe:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Recipe created successfully');
      return new Response(
        JSON.stringify(data),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
