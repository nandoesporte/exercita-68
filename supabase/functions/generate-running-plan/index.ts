import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { age, weight, fitness_level, goal, available_time } = await req.json();

    // Validate required fields
    if (!age || !weight || !fitness_level || !goal || !available_time) {
      return new Response(
        JSON.stringify({ error: 'Todos os campos são obrigatórios' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'Configuração da API não encontrada' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create prompt for Gemini
    const prompt = `
Crie um plano de corrida/caminhada personalizado para:
- Idade: ${age} anos
- Peso: ${weight} kg
- Nível de condicionamento: ${fitness_level}
- Objetivo: ${goal}
- Disponibilidade: ${available_time}

O plano deve ter duração de 4 semanas, ser progressivo e seguro. 

IMPORTANTE: Retorne APENAS um JSON válido no seguinte formato, sem texto adicional:
[
  { "semana": 1, "dia": "Segunda-feira", "atividade": "Caminhada leve", "duracao_min": 30, "intensidade": "Leve" },
  { "semana": 1, "dia": "Quarta-feira", "atividade": "Caminhada moderada", "duracao_min": 35, "intensidade": "Moderada" },
  { "semana": 1, "dia": "Sexta-feira", "atividade": "Caminhada leve", "duracao_min": 30, "intensidade": "Leve" },
  ...continue para as 4 semanas...
]

Considere:
- Para iniciantes: começar com caminhada e introduzir corrida gradualmente
- Para intermediários: combinar caminhada e corrida
- Para avançados: mais foco em corrida e intervalos
- Intensidades: "Leve", "Moderada", "Intensa"
- Inclua dias de descanso quando necessário
- Cada semana deve ter progressão adequada
`;

    console.log('Calling Gemini API...');
    
    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar plano de treino' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    console.log('Gemini response:', data);

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid Gemini response structure:', data);
      return new Response(
        JSON.stringify({ error: 'Resposta inválida da API' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    console.log('Generated text:', generatedText);

    // Parse the JSON from the response
    let plan;
    try {
      // Remove any markdown formatting or extra text
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        plan = JSON.parse(jsonMatch[0]);
      } else {
        // Try to parse the entire response
        plan = JSON.parse(generatedText);
      }
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError, 'Generated text:', generatedText);
      return new Response(
        JSON.stringify({ error: 'Erro ao processar plano gerado' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Successfully generated plan:', plan);

    return new Response(
      JSON.stringify({ plan }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in generate-running-plan function:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});