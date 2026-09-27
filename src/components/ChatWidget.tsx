import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, RotateCcw, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { useCategories } from '@/hooks/useCategories';
import { useSavingsGoals } from '@/hooks/useSavingsGoals';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED = [
  'How much did I spend this month?',
  "What's my biggest expense category?",
  'Am I on track with my budget?',
  'How are my savings goals doing?',
];

function buildSystemPrompt(opts: {
  userName?: string | null;
  currencySymbol: string;
  monthlyBudget: number;
  categories: { name: string; budget_limit: number | null }[];
  goals: { name: string; target_amount: number; current_amount: number; is_completed: boolean }[];
  txSummary: string;
}) {
  const { userName, currencySymbol, monthlyBudget, categories, goals, txSummary } = opts;
  return `You are the BALANCIO Spending Assistant, a helpful finance chatbot inside a personal expense tracker app.
Answer questions about the user's spending using ONLY the data below. Be concise, friendly, and use ${currencySymbol} for amounts.
If the data doesn't contain the answer, say so honestly. Never invent transactions.

USER: ${userName || 'Unknown'}
MONTHLY BUDGET: ${currencySymbol}${monthlyBudget}
CATEGORIES (with optional monthly budget limits):
${categories.map(c => `- ${c.name}${c.budget_limit ? ` (limit ${currencySymbol}${c.budget_limit})` : ''}`).join('\n') || '- none'}
SAVINGS GOALS:
${goals.map(g => `- ${g.name}: ${currencySymbol}${g.current_amount} of ${currencySymbol}${g.target_amount}${g.is_completed ? ' (completed)' : ''}`).join('\n') || '- none'}
TRANSACTIONS (last 12 months):
${txSummary}`;
}

export function ChatWidget() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { categories } = useCategories();
  const { goals } = useSavingsGoals();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load history when opened
  useEffect(() => {
    if (!open || !user) return;
    setLoadingHistory(true);
    supabase
      .from('chat_messages')
      .select('id, role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        setMessages((data as ChatMessage[]) || []);
        setLoadingHistory(false);
      });
  }, [open, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streaming]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const fetchTxSummary = useCallback(async () => {
    if (!user) return 'No transactions.';
    const since = new Date();
    since.setMonth(since.getMonth() - 12);
    const { data } = await supabase
      .from('transactions')
      .select('type, amount, date, note, categories(name)')
      .eq('user_id', user.id)
      .gte('date', since.toISOString().slice(0, 10))
      .order('date', { ascending: false })
      .limit(300);
    if (!data || data.length === 0) return 'No transactions recorded yet.';
    return data
      .map((t: any) => `${t.date} | ${t.type} | ${settings?.currency_symbol || '₹'}${t.amount} | ${t.categories?.name || 'Uncategorized'}${t.note ? ` | ${t.note}` : ''}`)
      .join('\n');
  }, [user, settings?.currency_symbol]);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || streaming || !user) return;

    const userMsg: ChatMessage = { role: 'user', content: question };
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '' }]);
    setInput('');
    setStreaming(true);

    // Persist user message
    supabase.from('chat_messages').insert({ user_id: user.id, role: 'user', content: question }).then(() => {});

    try {
      const txSummary = await fetchTxSummary();
      const system = buildSystemPrompt({
        userName: settings?.user_name,
        currencySymbol: settings?.currency_symbol || '₹',
        monthlyBudget: settings?.monthly_budget || 0,
        categories,
        goals,
        txSummary,
      });

      const history = [...messages, userMsg].slice(-20).map(m => ({ role: m.role, content: m.content }));
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/spending-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ system, messages: history }),
        }
      );

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }

      // Parse SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let full = '';

      const appendDelta = (delta: string) => {
        full += delta;
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', content: full };
          return next;
        });
      };

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') continue;
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) appendDelta(delta);
          } catch {
            // partial chunk — ignore
          }
        }
      }

      if (full) {
        supabase.from('chat_messages').insert({ user_id: user.id, role: 'assistant', content: full }).then(() => {});
      } else {
        throw new Error('Empty reply');
      }
    } catch (err: any) {
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = {
          role: 'assistant',
          content: `Sorry, I couldn't answer that right now. ${err?.message?.includes('429') ? 'The free AI model is rate-limited — please try again in a moment.' : 'Please try again.'}`,
        };
        return next;
      });
    } finally {
      setStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const newChat = async () => {
    if (!user) return;
    await supabase.from('chat_messages').delete().eq('user_id', user.id);
    setMessages([]);
    inputRef.current?.focus();
  };

  if (!user) return null;

  return (
    <>
      {/* Floating chat button — bottom right, above the bottom nav */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open spending assistant"
          className="fixed bottom-24 right-4 z-40 flex h-13 w-13 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform hover:scale-105 active:scale-95 p-3.5"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div
          className={cn(
            'fixed z-50 flex flex-col border border-border bg-card shadow-2xl',
            'inset-0 sm:inset-auto sm:bottom-24 sm:right-4 sm:h-[34rem] sm:w-[24rem] sm:rounded-2xl'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Spending Assistant</p>
              <p className="text-xs text-muted-foreground">Ask about your money</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={newChat}
                aria-label="New chat"
                className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {loadingHistory ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <MessageCircle className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Hi{settings?.user_name ? ` ${settings.user_name}` : ''}! Ask me anything about your spending.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTED.map(q => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={m.id ?? i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm',
                      m.role === 'user'
                        ? 'bg-foreground text-background'
                        : 'text-foreground'
                    )}
                  >
                    {m.role === 'assistant' ? (
                      m.content === '' && streaming && i === messages.length - 1 ? (
                        <span className="flex gap-1 py-1">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.15s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.3s]" />
                        </span>
                      ) : (
                        <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      )
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Ask about your spending…"
                rows={1}
                className="max-h-28 flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-foreground/20"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || streaming}
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-opacity disabled:opacity-40"
              >
                {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
