import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecipeRequest {
  objetivo: string;
  tempo_minutos: number;
  porcoes: number;
  restricoes?: string[];
  preferencias?: string[];
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

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const requestData: RecipeRequest = await req.json();
    const {
      objetivo,
      tempo_minutos,
      porcoes,
      restricoes = [],
      preferencias = []
    } = requestData;

    console.log('Gerando receita para usuário:', user.id);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    // Use the specified prompt format
    const userPrompt = `Crie uma receita saudável para ${objetivo} com até ${tempo_minutos} minutos, rendimento ${porcoes} porções. Incluir ingredientes com medidas, modo de preparo passo-a-passo e valores aproximados de calorias e macros por porção. Indicar tags (ex: rápido, vegetariano).
${restricoes.length > 0 ? `Restrições: ${restricoes.join(', ')}` : ''}
${preferencias.length > 0 ? `Preferências: ${preferencias.join(', ')}` : ''}
Retornar em JSON.`;

    // Call OpenAI with structured output
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você é um chef e nutricionista especializado. Retorne apenas JSON válido com receitas saudáveis e balanceadas.' },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'criar_receita',
            description: 'Cria uma nova receita saudável',
            parameters: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Nome da receita' },
                description: { type: 'string', description: 'Descrição breve da receita' },
                prep_time_minutes: { type: 'number', description: 'Tempo de preparo em minutos' },
                servings: { type: 'number', description: 'Número de porções' },
                difficulty: { type: 'string', enum: ['facil', 'medio', 'dificil'] },
                ingredients: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Lista de ingredientes com medidas'
                },
                instructions: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Passos de preparo'
                },
                calories_per_serving: { type: 'number', description: 'Calorias por porção' },
                protein_per_serving: { type: 'number', description: 'Proteínas em gramas por porção' },
                carbs_per_serving: { type: 'number', description: 'Carboidratos em gramas por porção' },
                fat_per_serving: { type: 'number', description: 'Gorduras em gramas por porção' },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Tags da receita (ex: vegetariano, rápido, sem glúten)'
                }
              },
              required: [
                'name', 'description', 'prep_time_minutes', 'servings',
                'difficulty', 'ingredients', 'instructions',
                'calories_per_serving', 'protein_per_serving',
                'carbs_per_serving', 'fat_per_serving', 'tags'
              ]
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'criar_receita' } },
        temperature: 0.8,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('Erro OpenAI:', errorText);
      throw new Error(`Erro na API OpenAI: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    console.log('Resposta OpenAI recebida');

    const toolCall = openAIData.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('OpenAI não retornou dados estruturados');
    }

    const recipe = JSON.parse(toolCall.function.arguments);

    // Optionally save to database
    const { data: savedRecipe, error: saveError } = await supabaseClient
      .from('recipes')
      .insert({
        ...recipe,
        created_by: user.id,
        is_published: false
      })
      .select()
      .single();

    if (saveError) {
      console.error('Erro ao salvar receita:', saveError);
    }

    console.log('Receita gerada com sucesso');

    return new Response(
      JSON.stringify({
        success: true,
        recipe: savedRecipe || recipe
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro ao gerar receita:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
