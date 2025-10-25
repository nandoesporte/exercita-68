import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Calculate BMI
function calculateBMI(weight: number, height: number): number {
  const heightInMeters = height / 100;
  return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
}

// Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation
function calculateBMR(weight: number, height: number, age: number, sexo: string): number {
  if (sexo === 'M') {
    return Math.round((10 * weight) + (6.25 * height) - (5 * age) + 5);
  } else {
    return Math.round((10 * weight) + (6.25 * height) - (5 * age) - 161);
  }
}

// Calculate daily calories based on activity level
function calculateDailyCalories(bmr: number, activityLevel: string): number {
  const multipliers: Record<string, number> = {
    'sedentarismo': 1.2,
    'leve': 1.375,
    'moderada': 1.55,
    'alta': 1.725
  };
  return Math.round(bmr * (multipliers[activityLevel] || 1.2));
}

// Calculate macronutrients based on goal
function calculateMacros(dailyCalories: number, objetivo: string) {
  let proteinPercent = 0.30;
  let fatPercent = 0.25;
  let carbPercent = 0.45;

  if (objetivo === 'ganho_massa') {
    proteinPercent = 0.35;
    fatPercent = 0.25;
    carbPercent = 0.40;
  } else if (objetivo === 'perda_peso') {
    proteinPercent = 0.35;
    fatPercent = 0.30;
    carbPercent = 0.35;
  }

  return {
    calorias: dailyCalories,
    proteinas: Math.round((dailyCalories * proteinPercent) / 4),
    gorduras: Math.round((dailyCalories * fatPercent) / 9),
    carboidratos: Math.round((dailyCalories * carbPercent) / 4)
  };
}

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
    const pathParts = url.pathname.split('/').filter(Boolean);
    const userId = pathParts[pathParts.length - 1];

    // GET /nutrition-profile/{user_id}
    if (req.method === 'GET') {
      console.log('Fetching nutrition profile for user:', userId);
      
      const { data, error } = await supabaseClient
        .from('nutricao_users')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!data) {
        return new Response(
          JSON.stringify({ error: 'Profile not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /nutrition-profile/{user_id}
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('Creating/updating nutrition profile:', body);

      // Validate required fields
      if (!body.altura_cm || !body.peso_kg || !body.data_nascimento || !body.sexo || !body.objetivo || !body.atividade_fisica) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate age from birthdate
      const birthDate = new Date(body.data_nascimento);
      const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

      // Calculate metrics
      const imc = calculateBMI(body.peso_kg, body.altura_cm);
      const tmb = calculateBMR(body.peso_kg, body.altura_cm, age, body.sexo);
      const dailyCalories = calculateDailyCalories(tmb, body.atividade_fisica);
      const macros = calculateMacros(dailyCalories, body.objetivo);

      const profileData = {
        user_id: userId,
        altura_cm: body.altura_cm,
        peso_kg: body.peso_kg,
        data_nascimento: body.data_nascimento,
        sexo: body.sexo,
        alergias: body.alergias || [],
        restricoes: body.restricoes || [],
        objetivo: body.objetivo,
        atividade_fisica: body.atividade_fisica,
        imc,
        tmb,
        macronutrientes: macros
      };

      // Upsert profile
      const { data, error } = await supabaseClient
        .from('nutricao_users')
        .upsert(profileData, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        console.error('Error upserting profile:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Profile created/updated successfully');
      return new Response(
        JSON.stringify(data),
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
