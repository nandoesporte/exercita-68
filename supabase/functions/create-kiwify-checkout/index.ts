import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { planId } = await req.json();
    
    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Autenticar usuário
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error('Usuário não autenticado');
    }

    // Buscar plano
    const { data: plan, error: planError } = await supabaseClient
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();
      
    if (planError || !plan) {
      throw new Error('Plano não encontrado');
    }

    // Buscar admin do usuário
    const { data: admin, error: adminError } = await supabaseClient
      .from('admins')
      .select('*')
      .eq('user_id', userData.user.id)
      .single();
      
    if (adminError || !admin) {
      throw new Error('Admin não encontrado');
    }

    // Aqui você integraria com a API da Kiwify
    // Por agora, retornamos uma URL de exemplo
    const kiwifyApiKey = Deno.env.get('KIWIFY_API_KEY');
    
    // Exemplo de integração com Kiwify (adapte conforme a documentação da Kiwify)
    const checkoutData = {
      product_id: plan.kiwify_product_id,
      customer_email: userData.user.email,
      customer_name: admin.name,
      amount: plan.price,
      currency: 'BRL'
    };

    // URL de checkout da Kiwify (substitua pela URL real da API)
    const checkoutUrl = `https://kiwify.com.br/checkout/${plan.kiwify_product_id}?email=${userData.user.email}`;

    // Criar registro de assinatura pendente
    const { error: subscriptionError } = await supabaseClient
      .from('admin_subscriptions')
      .upsert({
        admin_id: admin.id,
        plan_id: planId,
        status: 'pending',
        payment_url: checkoutUrl
      });

    if (subscriptionError) {
      console.error('Erro ao criar assinatura:', subscriptionError);
    }

    return new Response(
      JSON.stringify({ checkout_url: checkoutUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});