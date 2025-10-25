import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'Configuração da API não encontrada' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create prompt for OpenAI
    const prompt = `Crie um plano de corrida/caminhada personalizado para pessoas com Lipedema:
- Idade: ${age} anos
- Peso: ${weight} kg
- Nível de condicionamento: ${fitness_level}
- Objetivo: ${goal}
- Disponibilidade: ${available_time}

O plano deve ter duração de 4 semanas, ser progressivo e seguro. 

⚠️ CRÍTICO: Este plano é para pessoas com LIPEDEMA. Priorize exercícios de BAIXO IMPACTO:
- PREFIRA: Caminhada em ritmo leve a moderado
- LIMITE: Trote muito leve e controlado (apenas para níveis intermediário/avançado)
- EVITE: Corridas de alta intensidade ou alto impacto
- FOCO: Duração e constância ao invés de intensidade máxima

IMPORTANTE: Retorne APENAS um array JSON válido no seguinte formato, sem texto adicional:
[
  { "semana": 1, "dia": "Segunda-feira", "atividade": "Caminhada leve", "duracao_min": 30, "intensidade": "Leve" },
  { "semana": 1, "dia": "Quarta-feira", "atividade": "Caminhada moderada", "duracao_min": 35, "intensidade": "Moderada" },
  { "semana": 1, "dia": "Sexta-feira", "atividade": "Caminhada leve com alongamento", "duracao_min": 30, "intensidade": "Leve" }
]

Considere:
- Para iniciantes: APENAS caminhada leve a moderada, sem corrida
- Para intermediários: caminhada com possibilidade de trote MUITO leve em intervalos curtos
- Para avançados: caminhada em ritmo mais acelerado, trote leve controlado (máximo intensidade "Moderada")
- Intensidades: Use principalmente "Leve" e "Moderada". Evite "Intensa"
- Inclua 3-4 dias de treino por semana com dias de descanso intercalados
- Cada semana deve ter progressão gradual e segura, focando em duração antes de intensidade
- Inclua variações como caminhada em diferentes terrenos, caminhada com alongamento, etc.`;

    console.log('Calling OpenAI API...');
    
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um especialista em treinamento físico especializado em exercícios de baixo impacto para pessoas com Lipedema. Priorize sempre a segurança e bem-estar, focando em caminhada e exercícios leves. Responda sempre com um JSON válido contendo um plano de corrida/caminhada estruturado e seguro para Lipedema.' 
          },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar plano de treino' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI response structure:', data);
      return new Response(
        JSON.stringify({ error: 'Resposta inválida da API' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const generatedText = data.choices[0].message.content;
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