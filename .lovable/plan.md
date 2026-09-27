# BALANCIO Spending Assistant

## What you'll get
- A round chat button fixed in the bottom-right corner (above the bottom menu) on every signed-in page.
- Tapping it opens a chat window (full-screen on phones, floating panel on larger screens) in the same monochrome style.
- A close (X) button in the top-right corner of the window; a "New chat" button clears the conversation.
- Ask things like "How much did I spend on food last month?", "What's my biggest expense category?", "Am I on track with my budget?" — answers are based on your real transactions, budgets and savings goals.
- One ongoing conversation, saved to your account, so it's still there after reloading or on another device.
- Suggested starter questions shown when the chat is empty; replies stream in live with a typing indicator.

## How it works
1. You send a question from the chat window.
2. A secure backend function checks you're signed in, loads your recent transactions (last 12 months), categories, budget, currency and savings goals.
3. It sends a summary of that data plus the conversation to Lovable AI, and streams the answer back.
4. Both your message and the reply are saved to your account.

## Technical details
- DB: `chat_messages` table (id uuid, user_id, role, parts jsonb, created_at) with GRANTs + RLS scoped to `auth.uid()`.
- Edge function `spending-chat`: verifies JWT, fetches user data server-side, builds a compact aggregated context (monthly totals, per-category totals, recent 200 transactions), uses AI SDK `streamText` via Lovable AI Gateway Responses API with `openai/gpt-6-astra`, `toUIMessageStreamResponse({ originalMessages, onFinish })` to persist the assistant message.
- Frontend: `ChatWidget` (floating button + panel) mounted in protected layout, `useChat` from AI SDK with auth header, AI Elements for messages/composer, markdown rendering, textarea autofocus.
- Errors (rate limits, out of credits) shown as friendly messages in the chat.
- Button placed so it doesn't overlap the center "+" button of the bottom menu.
