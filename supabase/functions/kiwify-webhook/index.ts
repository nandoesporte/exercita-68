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
    const payload = await req.json();
    
    // Criar cliente Supabase com service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Log do webhook
    await supabaseClient
      .from('kiwify_webhook_logs')
      .insert({
        event_type: payload.event_type || 'unknown',
        order_id: payload.order_id,
        customer_id: payload.customer_id,
        status: payload.status,
        payload: payload
      });

    // Processar eventos específicos
    if (payload.event_type === 'payment_approved' || payload.status === 'paid') {
      // Buscar assinatura pelo email do cliente
      const { data: admin, error: adminError } = await supabaseClient
        .from('admins')
        .select('id')
        .eq('email', payload.customer_email)
        .single();

      if (admin) {
        // Calcular data de término baseada no plano
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30); // Assumindo 30 dias por padrão

        // Atualizar assinatura
        await supabaseClient
          .from('admin_subscriptions')
          .update({
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: endDate.toISOString(),
            kiwify_order_id: payload.order_id,
            kiwify_customer_id: payload.customer_id
          })
          .eq('admin_id', admin.id);
      }
    } else if (payload.event_type === 'payment_cancelled' || payload.status === 'cancelled') {
      // Marcar assinatura como cancelada
      const { data: admin } = await supabaseClient
        .from('admins')
        .select('id')
        .eq('email', payload.customer_email)
        .single();

      if (admin) {
        await supabaseClient
          .from('admin_subscriptions')
          .update({ status: 'cancelled' })
          .eq('admin_id', admin.id);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});