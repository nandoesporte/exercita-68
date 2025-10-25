import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    console.log('Processando solicitação de nutricionista para:', user.id);

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    // Get nutrition profile
    const { data: nutritionProfile, error: nutritionError } = await supabaseClient
      .from('nutrition_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get last 7 days of food diary
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: diaryEntries, error: diaryError } = await supabaseClient
      .from('food_diary')
      .select('*')
      .eq('user_id', user.id)
      .gte('entry_date', sevenDaysAgo.toISOString())
      .order('entry_date', { ascending: false });

    if (diaryError) console.error('Erro ao buscar diário:', diaryError);

    // Calculate summary stats
    const totalCalories = diaryEntries?.reduce((sum, entry) => sum + (entry.calories || 0), 0) || 0;
    const avgCalories = diaryEntries?.length ? Math.round(totalCalories / diaryEntries.length) : 0;

    // Create lead/ticket in database
    const { data: lead, error: leadError } = await supabaseClient
      .from('nutritionist_requests')
      .insert({
        user_id: user.id,
        status: 'pending',
        profile_data: profile,
        nutrition_data: nutritionProfile,
        diary_summary: {
          total_entries: diaryEntries?.length || 0,
          total_calories: totalCalories,
          avg_calories_per_day: avgCalories,
          last_7_days: diaryEntries
        }
      })
      .select()
      .single();

    if (leadError) throw leadError;

    // Generate PDF summary
    const pdfData = generatePDFData(profile, nutritionProfile, diaryEntries);

    // Send email to nutritionist
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    const nutritionistEmail = Deno.env.get('NUTRITIONIST_EMAIL') || 'nutricionista@exemplo.com';
    const appUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://app.exemplo.com';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .section { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .label { font-weight: bold; color: #4F46E5; }
            .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            .stats { display: flex; justify-content: space-around; margin: 15px 0; }
            .stat { text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #4F46E5; }
            .stat-label { font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nova Solicitação de Avaliação Nutricional</h1>
            </div>
            <div class="content">
              <div class="section">
                <h2>Dados do Paciente</h2>
                <p><span class="label">Nome:</span> ${profile.first_name} ${profile.last_name}</p>
                <p><span class="label">Email:</span> ${user.email}</p>
                <p><span class="label">ID da Solicitação:</span> ${lead.id}</p>
              </div>

              <div class="section">
                <h2>Informações Nutricionais</h2>
                ${nutritionProfile ? `
                  <div class="stats">
                    <div class="stat">
                      <div class="stat-value">${nutritionProfile.bmi?.toFixed(1) || '-'}</div>
                      <div class="stat-label">IMC</div>
                    </div>
                    <div class="stat">
                      <div class="stat-value">${nutritionProfile.bmr || '-'}</div>
                      <div class="stat-label">TMB (kcal)</div>
                    </div>
                    <div class="stat">
                      <div class="stat-value">${nutritionProfile.daily_calories || '-'}</div>
                      <div class="stat-label">Calorias Alvo</div>
                    </div>
                  </div>
                  <p><span class="label">Objetivo:</span> ${nutritionProfile.goal || 'Não informado'}</p>
                  <p><span class="label">Nível de Atividade:</span> ${nutritionProfile.activity_level || 'Não informado'}</p>
                ` : '<p>Perfil nutricional não preenchido.</p>'}
              </div>

              <div class="section">
                <h2>Resumo do Diário Alimentar (últimos 7 dias)</h2>
                <p><span class="label">Total de Registros:</span> ${diaryEntries?.length || 0}</p>
                <p><span class="label">Média de Calorias/dia:</span> ${avgCalories} kcal</p>
                ${diaryEntries?.length ? `
                  <h3>Últimas Refeições:</h3>
                  <ul>
                    ${diaryEntries.slice(0, 5).map(entry => `
                      <li>
                        <strong>${new Date(entry.entry_date).toLocaleDateString('pt-BR')}</strong> - 
                        ${entry.food_name}: ${entry.calories} kcal
                      </li>
                    `).join('')}
                  </ul>
                ` : '<p>Nenhum registro no diário alimentar.</p>'}
              </div>

              <div class="section">
                <h2>Próximos Passos</h2>
                <p>Por favor, entre em contato com o paciente para agendar uma consulta.</p>
                <a href="${appUrl}/admin/nutritionist-requests/${lead.id}" class="button">
                  Ver Detalhes Completos
                </a>
              </div>

              <div class="section" style="background: #fff3cd; border-left: 4px solid #ffc107;">
                <p><strong>⚠️ Atenção:</strong> Este é um resumo automatizado. Recomenda-se uma avaliação completa antes de qualquer prescrição nutricional.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const { error: emailError } = await resend.emails.send({
      from: 'NutriEx <onboarding@resend.dev>',
      to: [nutritionistEmail],
      subject: `Nova Solicitação: ${profile.first_name} ${profile.last_name}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error('Erro ao enviar email:', emailError);
      throw emailError;
    }

    console.log('Email enviado com sucesso para:', nutritionistEmail);

    // Update user profile to mark request
    await supabaseClient
      .from('profiles')
      .update({ nutritionist_request_sent: true })
      .eq('id', user.id);

    return new Response(
      JSON.stringify({
        success: true,
        lead_id: lead.id,
        message: 'Solicitação enviada com sucesso. O nutricionista entrará em contato em breve.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro ao processar solicitação:', error);
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

function generatePDFData(profile: any, nutritionProfile: any, diaryEntries: any[]) {
  // This would generate actual PDF in production
  // For now, returning structured data
  return {
    profile,
    nutrition: nutritionProfile,
    diary: diaryEntries,
    generated_at: new Date().toISOString()
  };
}
