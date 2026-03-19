import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('Webhook received:', JSON.stringify(body))

    // Mercado Pago sends different notification types
    if (body.type !== 'payment' && body.action !== 'payment.created' && body.action !== 'payment.updated') {
      // Not a payment notification, acknowledge and ignore
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const paymentId = body.data?.id
    if (!paymentId) {
      console.error('No payment ID in webhook body')
      return new Response(JSON.stringify({ error: 'No payment ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')
    if (!accessToken) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado.')
    }

    // Fetch payment details from Mercado Pago
    const paymentResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }
    )

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text()
      console.error('Failed to fetch payment:', errorText)
      throw new Error('Erro ao consultar pagamento no Mercado Pago.')
    }

    const payment = await paymentResponse.json()
    console.log('Payment details:', JSON.stringify({
      id: payment.id,
      status: payment.status,
      external_reference: payment.external_reference,
      metadata: payment.metadata,
    }))

    const userId = payment.external_reference
    if (!userId) {
      console.error('No external_reference in payment')
      return new Response(JSON.stringify({ error: 'No user reference' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    if (payment.status === 'approved') {
      // Calculate subscription expiry (30 days from now)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      const plan = payment.metadata?.plan || null

      const updateData: Record<string, unknown> = {
        status: 'approved',
        payment_method: payment.payment_method_id || 'mercadopago',
        subscription_expires_at: expiresAt.toISOString(),
      }

      if (plan) {
        updateData.plan = plan
      }

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('user_id', userId)

      if (updateError) {
        console.error('Failed to update profile:', updateError)
        throw new Error('Erro ao atualizar perfil.')
      }

      console.log(`User ${userId} approved with plan ${plan}, expires ${expiresAt.toISOString()}`)
    } else {
      console.log(`Payment ${paymentId} status: ${payment.status} — no action taken`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Webhook error:', message)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
