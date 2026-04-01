import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';
const DAILY_LIMIT = 25;

function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT');
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    // ── 1. Verify the JWT ────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return json({ error: 'Missing Authorization header.' }, 401);
    }

    const token = authHeader.slice(7);
    let payload: Record<string, unknown>;
    try {
      payload = decodeJwtPayload(token);
    } catch {
      return json({ error: 'Invalid token.' }, 401);
    }

    if (payload.role !== 'authenticated') {
      return json({ error: 'You must be signed in to use this feature.' }, 401);
    }

    const userId = payload.sub as string;

    // ── 2. Rate-limit check ──────────────────────────────────────────────
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const { data: row } = await supabaseAdmin
      .from('usage_limits')
      .select('count')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    const currentCount: number = (row?.count as number) ?? 0;

    if (currentCount >= DAILY_LIMIT) {
      return json(
        { error: `Daily limit of ${DAILY_LIMIT} AI requests reached. Resets at midnight UTC.` },
        429,
      );
    }

    // Upsert incremented count
    if (row) {
      await supabaseAdmin
        .from('usage_limits')
        .update({ count: currentCount + 1 })
        .eq('user_id', userId)
        .eq('date', today);
    } else {
      await supabaseAdmin
        .from('usage_limits')
        .insert({ user_id: userId, date: today, count: 1 });
    }

    // ── 3. Forward to Groq ───────────────────────────────────────────────
    const apiKey = Deno.env.get('GROQ_API_KEY');
    if (!apiKey) {
      return json({ error: 'GROQ_API_KEY secret is not configured.' }, 500);
    }

    const { messages, response_format, temperature } = await req.json();

    const groqRes = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: temperature ?? 0.1,
        ...(response_format ? { response_format } : {}),
      }),
    });

    const data = await groqRes.json();

    return new Response(JSON.stringify(data), {
      status: groqRes.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
