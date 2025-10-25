import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MealPlanRequest {
  user_profile: {
    peso_kg: number;
    altura_cm: number;
    idade: number;
    sexo: 'M' | 'F';
    atividade_fisica: string;
    objetivo: string;
  };
  preferencias?: string[];
  restricoes?: string[];
  calorias_alvo: number;
  macros: {
    proteina: { gramas: number; percentual: number };
    carboidrato: { gramas: number; percentual: number };
    gordura: { gramas: number; percentual: number };
  };
  refeicoes_por_dia?: number;
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

    const requestData: MealPlanRequest = await req.json();
    const {
      user_profile,
      preferencias = [],
      restricoes = [],
      calorias_alvo,
      macros,
      refeicoes_por_dia = 4
    } = requestData;

    console.log('Gerando plano semanal para usuário:', user.id);

    // Fetch available recipes
    const { data: recipes, error: recipesError } = await supabaseClient
      .from('recipes')
      .select('*')
      .eq('is_published', true);

    if (recipesError) {
      console.error('Erro ao buscar receitas:', recipesError);
      throw recipesError;
    }

    console.log(`Encontradas ${recipes?.length || 0} receitas disponíveis`);

    // Prepare prompt for OpenAI
    const systemPrompt = `Você é um nutricionista especializado em criar planos alimentares personalizados.
Crie um plano semanal (7 dias) com ${refeicoes_por_dia} refeições por dia.

REGRAS IMPORTANTES:
- Calorias diárias: ${calorias_alvo} kcal (±5% = ${Math.round(calorias_alvo * 0.95)}-${Math.round(calorias_alvo * 1.05)} kcal)
- Proteína diária: ${macros.proteina.gramas}g (±10% = ${Math.round(macros.proteina.gramas * 0.9)}-${Math.round(macros.proteina.gramas * 1.1)}g)
- Carboidrato diário: ${macros.carboidrato.gramas}g (±10% = ${Math.round(macros.carboidrato.gramas * 0.9)}-${Math.round(macros.carboidrato.gramas * 1.1)}g)
- Gordura diária: ${macros.gordura.gramas}g (±10% = ${Math.round(macros.gordura.gramas * 0.9)}-${Math.round(macros.gordura.gramas * 1.1)}g)
- Não repetir a mesma receita mais de 2x na semana
- Variar os tipos de refeição e ingredientes
${restricoes.length > 0 ? `- Restrições alimentares: ${restricoes.join(', ')}` : ''}
${preferencias.length > 0 ? `- Preferências: ${preferencias.join(', ')}` : ''}`;

    const userPrompt = `Perfil do usuário:
- Sexo: ${user_profile.sexo === 'M' ? 'Masculino' : 'Feminino'}
- Idade: ${user_profile.idade} anos
- Peso: ${user_profile.peso_kg} kg
- Altura: ${user_profile.altura_cm} cm
- Atividade física: ${user_profile.atividade_fisica}
- Objetivo: ${user_profile.objetivo}

Receitas disponíveis no banco de dados:
${recipes?.slice(0, 50).map(r => `- ${r.name} (${r.calories_per_serving}kcal, P:${r.protein_per_serving}g, C:${r.carbs_per_serving}g, G:${r.fat_per_serving}g) - Tags: ${r.tags?.join(', ') || 'nenhuma'}`).join('\n')}

Gere um plano alimentar semanal completo e balanceado.`;

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'criar_plano_semanal',
            description: 'Cria um plano alimentar semanal completo',
            parameters: {
              type: 'object',
              properties: {
                dias: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      dia: { type: 'string', description: 'Nome do dia da semana' },
                      refeicoes: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            tipo: { type: 'string', enum: ['cafe_manha', 'lanche_manha', 'almoco', 'lanche_tarde', 'jantar', 'ceia'] },
                            nome: { type: 'string' },
                            recipe_id: { type: 'string', description: 'ID da receita do banco de dados, se usar uma existente' },
                            porcoes: { type: 'number', description: 'Número de porções' },
                            calorias: { type: 'number' },
                            proteina: { type: 'number' },
                            carboidrato: { type: 'number' },
                            gordura: { type: 'number' },
                            ingredientes: { type: 'array', items: { type: 'string' } },
                            preparo: { type: 'string' }
                          },
                          required: ['tipo', 'nome', 'calorias', 'proteina', 'carboidrato', 'gordura']
                        }
                      },
                      totais: {
                        type: 'object',
                        properties: {
                          calorias: { type: 'number' },
                          proteina: { type: 'number' },
                          carboidrato: { type: 'number' },
                          gordura: { type: 'number' }
                        }
                      }
                    },
                    required: ['dia', 'refeicoes', 'totais']
                  }
                }
              },
              required: ['dias']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'criar_plano_semanal' } },
        temperature: 0.7,
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

    const planoSemanal = JSON.parse(toolCall.function.arguments);

    // Calculate totals and validate
    const totaisSemana = planoSemanal.dias.reduce((acc: any, dia: any) => ({
      calorias: acc.calorias + dia.totais.calorias,
      proteina: acc.proteina + dia.totais.proteina,
      carboidrato: acc.carboidrato + dia.totais.carboidrato,
      gordura: acc.gordura + dia.totais.gordura,
    }), { calorias: 0, proteina: 0, carboidrato: 0, gordura: 0 });

    const mediasDiarias = {
      calorias: Math.round(totaisSemana.calorias / 7),
      proteina: Math.round(totaisSemana.proteina / 7),
      carboidrato: Math.round(totaisSemana.carboidrato / 7),
      gordura: Math.round(totaisSemana.gordura / 7),
    };

    console.log('Plano gerado com sucesso. Médias diárias:', mediasDiarias);

    return new Response(
      JSON.stringify({
        success: true,
        plano: planoSemanal,
        totais_semana: totaisSemana,
        medias_diarias: mediasDiarias,
        metas: {
          calorias_alvo,
          macros
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro ao gerar plano semanal:', error);
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
