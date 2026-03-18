import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 5;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { full_name, email, whatsapp, usage_type, payment_method, plan, password } = await req.json();

    if (!full_name || !email || !whatsapp || !password || !plan) {
      throw new Error('Campos obrigatórios não preenchidos.');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 255) {
      throw new Error('Email inválido.');
    }

    // Validate field lengths
    if (full_name.length > 200) throw new Error('Nome muito longo.');
    if (whatsapp.length > 30) throw new Error('WhatsApp inválido.');
    if (password.length < 6 || password.length > 128) throw new Error('Senha deve ter entre 6 e 128 caracteres.');

    const ALLOWED_PLANS = ['basico', 'pro'];
    if (!ALLOWED_PLANS.includes(plan)) {
      throw new Error('Plano inválido.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Rate limiting by IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     req.headers.get('cf-connecting-ip') || 'unknown';

    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_SECONDS * 1000).toISOString();
    const { count: recentCount } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', windowStart);

    // Simple global rate limit as a safety net
    if ((recentCount ?? 0) > RATE_LIMIT_MAX_REQUESTS) {
      return new Response(JSON.stringify({ success: false, error: 'Muitas tentativas. Tente novamente em alguns minutos.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if email already exists using profiles table (avoids listUsers pagination issues)
    const { count: emailCount } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('email', email);

    if ((emailCount ?? 0) > 0) {
      throw new Error('Este email já está cadastrado.');
    }

    // Create auth user (auto-confirm email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) throw new Error(authError.message);

    const userId = authData.user.id;

    // Create profile with pending status
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: userId,
        full_name: full_name.trim().slice(0, 200),
        email: email.trim().toLowerCase(),
        whatsapp: whatsapp.trim().slice(0, 30),
        usage_type,
        payment_method,
        plan,
        status: 'pending',
      });

    if (profileError) throw new Error(profileError.message);

    // Assign user role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: userId, role: 'user' });

    if (roleError) throw new Error(roleError.message);

    return new Response(JSON.stringify({ success: true, userId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
