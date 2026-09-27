import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

// Thin relay: holds the OpenRouter key server-side, builds the assistant's
// system prompt from the signed-in user's own data (server-side, so callers
// cannot inject instructions), and streams OpenRouter's reply back.

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'nvidia/nemotron-3-super-120b-a12b:free'

type UserClient = ReturnType<typeof createClient>

async function buildSystemPrompt(supabase: UserClient, userId: string): Promise<string> {
  const since = new Date()
  since.setMonth(since.getMonth() - 12)
  const sinceDate = since.toISOString().slice(0, 10)

  const [settingsRes, categoriesRes, goalsRes, txRes] = await Promise.all([
    supabase.from('settings').select('user_name, currency_symbol, monthly_budget').eq('user_id', userId).maybeSingle(),
    supabase.from('categories').select('name, budget_limit').eq('user_id', userId).limit(50),
    supabase.from('savings_goals').select('name, target_amount, current_amount, is_completed').eq('user_id', userId).limit(20),
    supabase
      .from('transactions')
      .select('type, amount, date, note, categories(name)')
      .eq('user_id', userId)
      .gte('date', sinceDate)
      .order('date', { ascending: false })
      .limit(300),
  ])

  const settings = settingsRes.data
  const currency = settings?.currency_symbol || '₹'
  const categories = categoriesRes.data || []
  const goals = goalsRes.data || []
  const txs = txRes.data || []

  const txSummary = txs.length === 0
    ? 'No transactions recorded yet.'
    : txs
        .map((t: any) => `${t.date} | ${t.type} | ${currency}${t.amount} | ${t.categories?.name || 'Uncategorized'}${t.note ? ` | ${t.note}` : ''}`)
        .join('\n')

  return `You are the BALANCIO Spending Assistant, a helpful finance chatbot inside a personal expense tracker app.
Answer questions about the user's spending using ONLY the data below. Be concise, friendly, and use ${currency} for amounts.
If the data doesn't contain the answer, say so honestly. Never invent transactions.

USER: ${settings?.user_name || 'Unknown'}
MONTHLY BUDGET: ${currency}${settings?.monthly_budget || 0}
CATEGORIES (with optional monthly budget limits):
${categories.map((c: any) => `- ${c.name}${c.budget_limit ? ` (limit ${currency}${c.budget_limit})` : ''}`).join('\n') || '- none'}
SAVINGS GOALS:
${goals.map((g: any) => `- ${g.name}: ${currency}${g.current_amount} of ${currency}${g.target_amount}${g.is_completed ? ' (completed)' : ''}`).join('\n') || '- none'}
TRANSACTIONS (last 12 months):
${txSummary}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate the user's JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not signed in' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('OPENROUTER_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const messages = body?.messages
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 60) {
      return new Response(JSON.stringify({ error: 'Invalid messages' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    // Only plain user/assistant text messages are accepted — no system or
    // tool roles, so callers cannot steer the assistant's instructions.
    for (const m of messages) {
      if (
        (m?.role !== 'user' && m?.role !== 'assistant') ||
        typeof m?.content !== 'string' ||
        m.content.length === 0 ||
        m.content.length > 8000
      ) {
        return new Response(JSON.stringify({ error: 'Invalid message format' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const system = await buildSystemPrompt(supabase, user.id)

    const upstream = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://balancio.app',
        'X-Title': 'BALANCIO Spending Assistant',
      },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        messages: [
          { role: 'system', content: system },
          ...messages,
        ],
      }),
    })

    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => '')
      const status = upstream.status === 429 ? 429 : upstream.status >= 500 ? 502 : upstream.status
      return new Response(JSON.stringify({ error: `AI request failed (${upstream.status})`, detail: detail.slice(0, 300) }), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Stream the OpenRouter SSE straight through to the browser
    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Unexpected error', detail: String(err).slice(0, 200) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
