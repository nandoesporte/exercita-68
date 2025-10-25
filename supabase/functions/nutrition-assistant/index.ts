import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: Message[];
  user_profile?: {
    peso_kg?: number;
    altura_cm?: number;
    idade?: number;
    objetivo?: string;
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

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const requestData: ChatRequest = await req.json();
    const { messages, user_profile } = requestData;

    console.log('Chat com assistente nutricional:', user.id);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    // System prompt conforme especificado
    const systemPrompt = `Você é o Assistente NutriEx (nutricionista virtual): responda de forma empática, objetiva e segura.

REGRAS IMPORTANTES:
- Pergunte sempre o peso/altura/idade/objetivo se não informados.
- Para pedidos de dietas completas, avise que é sugestão e recomende procurar nutricionista para casos clínicos.
- Para perguntas simples (substituição de alimentos, calorias), responda com dados práticos.

${user_profile ? `
PERFIL DO USUÁRIO:
${user_profile.peso_kg ? `- Peso: ${user_profile.peso_kg} kg` : ''}
${user_profile.altura_cm ? `- Altura: ${user_profile.altura_cm} cm` : ''}
${user_profile.idade ? `- Idade: ${user_profile.idade} anos` : ''}
${user_profile.objetivo ? `- Objetivo: ${user_profile.objetivo}` : ''}
` : 'O usuário ainda não forneceu dados completos de perfil. Pergunte educadamente por peso, altura, idade e objetivo quando relevante.'}

EXEMPLO DE INSTRUÇÃO:
Se o usuário pedir: "o que posso almoçar com 400 kcal e 25g de proteína?"
Responda com 3 opções e uma receita rápida para cada.

Mantenha respostas objetivas, práticas e empáticas. Seja um assistente útil e confiável.`;

    // Call OpenAI
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
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('Erro OpenAI:', errorText);
      throw new Error(`Erro na API OpenAI: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    const assistantMessage = openAIData.choices[0].message.content;

    console.log('Resposta do assistente gerada');

    return new Response(
      JSON.stringify({
        success: true,
        message: assistantMessage,
        usage: openAIData.usage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro no assistente nutricional:', error);
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
