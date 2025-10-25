import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
  if (sexo === 'M' || sexo === 'masculino') {
    return Math.round((10 * weight) + (6.25 * height) - (5 * age) + 5);
  } else {
    return Math.round((10 * weight) + (6.25 * height) - (5 * age) - 161);
  }
}

// Calculate daily calories based on activity level
function calculateDailyCalories(bmr: number, activityLevel: string): number {
  const multipliers: Record<string, number> = {
    'sedentarismo': 1.2,
    'sedentario': 1.2,
    'leve': 1.375,
    'moderada': 1.55,
    'moderado': 1.55,
    'alta': 1.725,
    'alto': 1.725,
    'muito_alta': 1.9
  };
  return Math.round(bmr * (multipliers[activityLevel.toLowerCase()] || 1.2));
}

// Calculate macronutrients (balanced distribution)
function calculateMacros(dailyCalories: number) {
  // Standard balanced distribution: 30% protein, 25% fat, 45% carbs
  const proteinPercent = 0.30;
  const fatPercent = 0.25;
  const carbPercent = 0.45;

  return {
    proteinas_g: Math.round((dailyCalories * proteinPercent) / 4), // 4 cal/g
    gorduras_g: Math.round((dailyCalories * fatPercent) / 9), // 9 cal/g
    carboidratos_g: Math.round((dailyCalories * carbPercent) / 4) // 4 cal/g
  };
}

// Get BMI classification
function getBMIClassification(bmi: number): string {
  if (bmi < 18.5) return 'Abaixo do peso';
  if (bmi < 25) return 'Peso normal';
  if (bmi < 30) return 'Sobrepeso';
  if (bmi < 35) return 'Obesidade grau I';
  if (bmi < 40) return 'Obesidade grau II';
  return 'Obesidade grau III';
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // POST /nutrition-assessment - Quick assessment
    if (req.method === 'POST') {
      const body = await req.json();
      console.log('Performing nutrition assessment:', body);

      // Validate required fields
      if (!body.peso || !body.altura || !body.idade || !body.sexo || !body.atividade) {
        return new Response(
          JSON.stringify({ 
            error: 'Missing required fields: peso, altura, idade, sexo, atividade' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate input ranges
      if (body.peso <= 0 || body.peso > 300) {
        return new Response(
          JSON.stringify({ error: 'Invalid weight: must be between 1 and 300 kg' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (body.altura <= 0 || body.altura > 250) {
        return new Response(
          JSON.stringify({ error: 'Invalid height: must be between 1 and 250 cm' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (body.idade <= 0 || body.idade > 120) {
        return new Response(
          JSON.stringify({ error: 'Invalid age: must be between 1 and 120 years' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate metrics
      const imc = calculateBMI(body.peso, body.altura);
      const tmb = calculateBMR(body.peso, body.altura, body.idade, body.sexo);
      const calorias_alvo = calculateDailyCalories(tmb, body.atividade);
      const macros = calculateMacros(calorias_alvo);
      const classificacao_imc = getBMIClassification(imc);

      // Use OpenAI to generate personalized assessment
      const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
      let aiAssessment = null;

      if (openAIApiKey) {
        try {
          const userPrompt = `Usuário: ${body.peso} kg, ${body.altura} cm, ${body.idade} anos, sexo ${body.sexo}, atividade ${body.atividade}, objetivo ${body.objetivo || 'manutenção'}, restrições ${body.restricoes || 'nenhuma'}. 
Gere:
1) Resumo curto (1-2 frases) sobre estado atual (IMC, interpretação).
2) TMB calculada e calorias alvo.
3) Macro targets em kcal e gramas.
4) 3 dicas práticas e rápidas (máx 35 palavras cada).
Formato JSON: { "resumo": "...", "imc": ${imc}, "tmb": ${tmb}, "calorias_alvo": ${calorias_alvo}, "macros": {"proteinas_g": ${macros.proteinas_g}, "carboidratos_g": ${macros.carboidratos_g}, "gorduras_g": ${macros.gorduras_g}}, "dicas":["dica1", "dica2", "dica3"]}`;

          const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAIApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: 'Você é um nutricionista especializado. Retorne apenas JSON válido.' },
                { role: 'user', content: userPrompt }
              ],
              temperature: 0.7,
            }),
          });

          if (openAIResponse.ok) {
            const openAIData = await openAIResponse.json();
            const content = openAIData.choices[0].message.content;
            // Extract JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              aiAssessment = JSON.parse(jsonMatch[0]);
            }
          }
        } catch (error) {
          console.error('Error calling OpenAI:', error);
        }
      }

      const assessment = {
        imc: {
          valor: imc,
          classificacao: classificacao_imc
        },
        tmb: {
          valor: tmb,
          descricao: 'Taxa Metabólica Basal - calorias queimadas em repouso'
        },
        calorias_alvo: {
          valor: calorias_alvo,
          descricao: 'Calorias diárias recomendadas para manutenção'
        },
        macronutrientes: {
          proteinas: {
            gramas: macros.proteinas_g,
            calorias: macros.proteinas_g * 4,
            percentual: 30
          },
          gorduras: {
            gramas: macros.gorduras_g,
            calorias: macros.gorduras_g * 9,
            percentual: 25
          },
          carboidratos: {
            gramas: macros.carboidratos_g,
            calorias: macros.carboidratos_g * 4,
            percentual: 45
          }
        },
        resumo: aiAssessment?.resumo || `IMC ${imc} (${classificacao_imc}). Calorias diárias recomendadas: ${calorias_alvo} kcal.`,
        dicas: aiAssessment?.dicas || [
          'Mantenha uma hidratação adequada (2-3 litros de água por dia)',
          'Pratique atividade física regularmente',
          'Evite alimentos ultraprocessados'
        ]
      };

      console.log('Assessment completed:', assessment);

      return new Response(
        JSON.stringify(assessment),
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
