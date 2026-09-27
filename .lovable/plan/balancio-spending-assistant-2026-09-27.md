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
2. The app collects your recent transactions, categories, budget, currency and savings goals from the data it already loads, and builds a short summary.
3. That summary plus the conversation is sent to an OpenRouter free model through a minimal key-holding relay (no custom logic — it just forwards the request to OpenRouter's chat API), and the answer streams back.
4. Both your message and the reply are saved to your account.

## Technical details
- DB: `chat_messages` table (id uuid, user_id, role, parts jsonb, created_at) with GRANTs + RLS scoped to `auth.uid()`.
- Thin relay function `spending-chat`: no business logic — it only holds the AI API key securely and forwards the chat request to the model, streaming the reply back. A raw API key cannot be placed in browser code because anyone could open the app and steal it; the relay is the minimum safe way to use a key. Spending data is gathered in the app from hooks it already uses and sent along with the question.
- Frontend: `ChatWidget` (floating button + panel) mounted in protected layout, `useChat` from AI SDK with auth header, AI Elements for messages/composer, markdown rendering, textarea autofocus.
- Errors (rate limits, out of credits) shown as friendly messages in the chat.
- Button placed so it doesn't overlap the center "+" button of the bottom menu.
