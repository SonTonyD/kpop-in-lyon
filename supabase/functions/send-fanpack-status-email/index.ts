import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return jsonResponse({ error: 'Missing orderId' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';
    const emailFrom = Deno.env.get('FANPACK_EMAIL_FROM') ?? 'Kpop in Lyon <onboarding@resend.dev>';

    if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
      return jsonResponse({ error: 'Missing Edge Function environment variables' }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return jsonResponse({ error: 'Authentication required' }, 401);
    }

    const { data: order, error } = await supabase
      .from('fanpack_orders')
      .select('*, fanpack_order_items(*)')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return jsonResponse({ error: 'Order not found' }, 404);
    }

    const lines = (order.fanpack_order_items ?? [])
      .map((item: { quantity: number; member_name: string }) => `${item.quantity} x ${item.member_name}`)
      .join(', ');

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: order.customer_email,
        subject: 'Votre commande fanpack est en cours de traitement',
        html: `
          <p>Bonjour ${escapeHtml(order.customer_full_name)},</p>
          <p>Votre preuve de paiement a ete validee. Votre commande fanpack ${escapeHtml(
            order.campaign_name,
          )} est maintenant en cours de traitement.</p>
          <p><strong>Panier :</strong> ${escapeHtml(lines)}</p>
          <p>Merci pour votre commande,<br>Kpop in Lyon</p>
        `,
      }),
    });

    const responseText = await response.text();
    const resendResult = parseJson(responseText);

    if (!response.ok) {
      return jsonResponse({
        ok: false,
        emailSent: false,
        error: 'Resend request failed',
        resendStatus: response.status,
        detail: responseText,
      });
    }

    if (!resendResult?.id) {
      return jsonResponse({
        ok: false,
        emailSent: false,
        error: 'Resend did not return an email id',
        detail: responseText,
      });
    }

    return jsonResponse({ ok: true, emailSent: true, resendId: resendResult.id });
  } catch (error) {
    return jsonResponse({ error: String(error) }, 500);
  }
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseJson(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value);

    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}
