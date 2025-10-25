import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NutritionInput {
  weight: number;
  height: number;
  age: number;
  gender: 'masculino' | 'feminino' | 'outro';
  activityLevel: 'sedentario' | 'leve' | 'moderado' | 'intenso' | 'muito_intenso';
  goal: 'perder_peso' | 'ganhar_massa' | 'manter_peso' | 'saude_geral';
}

function calculateBMI(weight: number, heightInCm: number): number {
  const heightInM = heightInCm / 100;
  return weight / (heightInM * heightInM);
}

function calculateBMR(weight: number, heightInCm: number, age: number, gender: string): number {
  // Fórmula de Harris-Benedict revisada
  if (gender === 'masculino') {
    return 88.362 + (13.397 * weight) + (4.799 * heightInCm) - (5.677 * age);
  } else {
    return 447.593 + (9.247 * weight) + (3.098 * heightInCm) - (4.330 * age);
  }
}

function getActivityMultiplier(activityLevel: string): number {
  const multipliers: Record<string, number> = {
    sedentario: 1.2,
    leve: 1.375,
    moderado: 1.55,
    intenso: 1.725,
    muito_intenso: 1.9
  };
  return multipliers[activityLevel] || 1.2;
}

function calculateDailyCalories(bmr: number, activityLevel: string, goal: string): number {
  const tdee = bmr * getActivityMultiplier(activityLevel);
  
  // Ajustar calorias baseado no objetivo
  switch (goal) {
    case 'perder_peso':
      return tdee - 500; // Déficit de 500 calorias
    case 'ganhar_massa':
      return tdee + 300; // Superávit de 300 calorias
    case 'manter_peso':
    case 'saude_geral':
    default:
      return tdee;
  }
}

function calculateMacros(dailyCalories: number, goal: string) {
  let proteinPercent, carbsPercent, fatsPercent;
  
  switch (goal) {
    case 'perder_peso':
      proteinPercent = 0.35;
      carbsPercent = 0.35;
      fatsPercent = 0.30;
      break;
    case 'ganhar_massa':
      proteinPercent = 0.30;
      carbsPercent = 0.45;
      fatsPercent = 0.25;
      break;
    case 'manter_peso':
    case 'saude_geral':
    default:
      proteinPercent = 0.30;
      carbsPercent = 0.40;
      fatsPercent = 0.30;
      break;
  }
  
  return {
    protein: (dailyCalories * proteinPercent) / 4, // 4 cal/g
    carbs: (dailyCalories * carbsPercent) / 4, // 4 cal/g
    fats: (dailyCalories * fatsPercent) / 9 // 9 cal/g
  };
}

serve(async (req) => {
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

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Não autorizado');
    }

    const input: NutritionInput = await req.json();

    // Calcular métricas
    const bmi = calculateBMI(input.weight, input.height);
    const bmr = calculateBMR(input.weight, input.height, input.age, input.gender);
    const dailyCalories = calculateDailyCalories(bmr, input.activityLevel, input.goal);
    const macros = calculateMacros(dailyCalories, input.goal);

    const result = {
      bmi: Math.round(bmi * 10) / 10,
      bmr: Math.round(bmr),
      dailyCalories: Math.round(dailyCalories),
      dailyProtein: Math.round(macros.protein),
      dailyCarbs: Math.round(macros.carbs),
      dailyFats: Math.round(macros.fats)
    };

    console.log('Nutrition metrics calculated:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error calculating nutrition metrics:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});