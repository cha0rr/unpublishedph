import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PLAN_PRICES: Record<string, { title: string; price: number }> = {
  basico: { title: 'PH Studio - Plano Básico', price: 49.90 },
  pro: { title: 'PH Studio - Plano Pro', price: 79.90 },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { userId, plan, email, origin } = await req.json()

    if (!userId || !plan || !email || !origin) {
      throw new Error('Parâmetros obrigatórios: userId, plan, email, origin')
    }

    const planInfo = PLAN_PRICES[plan]
    if (!planInfo) {
      throw new Error('Plano inválido.')
    }

    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado.')
    }

    // Verify user exists
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) {
      throw new Error('Usuário não encontrado.')
    }

    // Create Mercado Pago preference
    const preference = {
      items: [
        {
          title: planInfo.title,
          quantity: 1,
          unit_price: planInfo.price,
          currency_id: 'BRL',
        },
      ],
      external_reference: userId,
      back_urls: {
        success: `${origin}/pagamento-status?status=approved`,
        failure: `${origin}/pagamento-status?status=failure`,
        pending: `${origin}/pagamento-status?status=pending`,
      },
      auto_return: 'approved',
      payer: {
        email,
      },
      metadata: {
        plan,
        user_id: userId,
      },
    }

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preference),
    })

    if (!mpResponse.ok) {
      const errorBody = await mpResponse.text()
      console.error('Mercado Pago error:', errorBody)
      throw new Error('Erro ao criar preferência no Mercado Pago.')
    }

    const mpData = await mpResponse.json()

    return new Response(
      JSON.stringify({
        success: true,
        sandbox_init_point: mpData.sandbox_init_point,
        init_point: mpData.init_point,
        preference_id: mpData.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
