import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NutritionInput {
  peso_kg: number;
  altura_cm: number;
  idade: number;
  sexo: 'M' | 'F';
  atividade_fisica: 'sedentarismo' | 'leve' | 'moderada' | 'alta';
  objetivo?: 'perda_peso' | 'manutencao' | 'ganho_massa';
}

/**
 * Calculates BMI
 * Formula: IMC = peso_kg / (altura_m)^2
 */
function calcularIMC(peso_kg: number, altura_cm: number): number {
  const altura_m = altura_cm / 100;
  return Math.round((peso_kg / (altura_m * altura_m)) * 10) / 10;
}

/**
 * Calculate TMB using Mifflin-St Jeor equation
 * Men: TMB = 10*peso + 6.25*altura_cm - 5*idade + 5
 * Women: TMB = 10*peso + 6.25*altura_cm - 5*idade - 161
 */
function calcularTMB(peso_kg: number, altura_cm: number, idade: number, sexo: string): number {
  if (sexo === 'M') {
    return Math.round((10 * peso_kg) + (6.25 * altura_cm) - (5 * idade) + 5);
  } else {
    return Math.round((10 * peso_kg) + (6.25 * altura_cm) - (5 * idade) - 161);
  }
}

/**
 * Get activity factor
 */
function getFatorAtividade(atividade_fisica: string): number {
  const fatores: Record<string, number> = {
    'sedentarismo': 1.2,
    'leve': 1.375,
    'moderada': 1.55,
    'alta': 1.725
  };
  return fatores[atividade_fisica] || 1.2;
}

/**
 * Calculate target calories based on goal
 * perda_peso: -500 kcal (or -15% if < 2000kcal)
 * ganho_massa: +300 kcal
 * manutencao: same as maintenance
 */
function calcularCaloriasAlvo(calorias_manutencao: number, objetivo: string): number {
  if (objetivo === 'perda_peso') {
    if (calorias_manutencao < 2000) {
      return Math.round(calorias_manutencao * 0.85);
    } else {
      return calorias_manutencao - 500;
    }
  } else if (objetivo === 'ganho_massa') {
    return calorias_manutencao + 300;
  } else {
    return calorias_manutencao;
  }
}

/**
 * Calculate macronutrients
 * perda_peso: P 30% / C 35% / G 35%
 * ganho_massa: P 25% / C 50% / G 25%
 * manutencao: P 20% / C 50% / G 30%
 */
function calcularMacros(calorias_alvo: number, objetivo: string) {
  let protein_percent: number, carb_percent: number, fat_percent: number;
  
  if (objetivo === 'perda_peso') {
    protein_percent = 0.30;
    carb_percent = 0.35;
    fat_percent = 0.35;
  } else if (objetivo === 'ganho_massa') {
    protein_percent = 0.25;
    carb_percent = 0.50;
    fat_percent = 0.25;
  } else {
    protein_percent = 0.20;
    carb_percent = 0.50;
    fat_percent = 0.30;
  }

  // Convert to grams: proteina_g = (calorias*P%)/4
  const proteina_g = Math.round((calorias_alvo * protein_percent) / 4);
  const carboidrato_g = Math.round((calorias_alvo * carb_percent) / 4);
  const gordura_g = Math.round((calorias_alvo * fat_percent) / 9);

  // Calculate kcal
  const proteina_kcal = Math.round(proteina_g * 4);
  const carboidrato_kcal = Math.round(carboidrato_g * 4);
  const gordura_kcal = Math.round(gordura_g * 9);
  
  return {
    proteina: {
      gramas: proteina_g,
      kcal: proteina_kcal,
      percentual: Math.round(protein_percent * 100)
    },
    carboidrato: {
      gramas: carboidrato_g,
      kcal: carboidrato_kcal,
      percentual: Math.round(carb_percent * 100)
    },
    gordura: {
      gramas: gordura_g,
      kcal: gordura_kcal,
      percentual: Math.round(fat_percent * 100)
    }
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

    // Validate required fields
    if (!input.peso_kg || !input.altura_cm || !input.idade || !input.sexo || !input.atividade_fisica) {
      throw new Error('Campos obrigatórios faltando: peso_kg, altura_cm, idade, sexo, atividade_fisica');
    }

    const objetivo = input.objetivo || 'manutencao';

    // Calculate IMC
    const imc = calcularIMC(input.peso_kg, input.altura_cm);

    // Calculate TMB
    const tmb = calcularTMB(input.peso_kg, input.altura_cm, input.idade, input.sexo);

    // Calculate maintenance calories
    const fator_atividade = getFatorAtividade(input.atividade_fisica);
    const calorias_manutencao = Math.round(tmb * fator_atividade);

    // Calculate target calories based on goal
    const calorias_alvo = calcularCaloriasAlvo(calorias_manutencao, objetivo);

    // Calculate macros
    const macros = calcularMacros(calorias_alvo, objetivo);

    const result = {
      imc,
      tmb,
      calorias_alvo,
      macros
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