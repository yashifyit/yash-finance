-- Add user_id column to all tables (nullable initially for migration)
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.recurring_transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Anyone can read transactions" ON public.transactions;
DROP POLICY IF EXISTS "Anyone can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Anyone can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Anyone can delete transactions" ON public.transactions;

DROP POLICY IF EXISTS "Anyone can read categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can update their categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can delete their categories" ON public.categories;

DROP POLICY IF EXISTS "Anyone can read settings" ON public.settings;
DROP POLICY IF EXISTS "Anyone can insert settings" ON public.settings;
DROP POLICY IF EXISTS "Anyone can update settings" ON public.settings;

DROP POLICY IF EXISTS "Anyone can read savings_goals" ON public.savings_goals;
DROP POLICY IF EXISTS "Anyone can insert savings_goals" ON public.savings_goals;
DROP POLICY IF EXISTS "Anyone can update savings_goals" ON public.savings_goals;
DROP POLICY IF EXISTS "Anyone can delete savings_goals" ON public.savings_goals;

DROP POLICY IF EXISTS "Anyone can read recurring_transactions" ON public.recurring_transactions;
DROP POLICY IF EXISTS "Anyone can insert recurring_transactions" ON public.recurring_transactions;
DROP POLICY IF EXISTS "Anyone can update recurring_transactions" ON public.recurring_transactions;
DROP POLICY IF EXISTS "Anyone can delete recurring_transactions" ON public.recurring_transactions;

-- Create secure RLS policies using auth.uid()

-- Transactions policies
CREATE POLICY "Users can read own transactions" ON public.transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.transactions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON public.transactions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON public.transactions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Categories policies
CREATE POLICY "Users can read own categories" ON public.categories
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON public.categories
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON public.categories
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON public.categories
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Settings policies
CREATE POLICY "Users can read own settings" ON public.settings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.settings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.settings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Savings goals policies
CREATE POLICY "Users can read own savings_goals" ON public.savings_goals
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own savings_goals" ON public.savings_goals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings_goals" ON public.savings_goals
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own savings_goals" ON public.savings_goals
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Recurring transactions policies
CREATE POLICY "Users can read own recurring_transactions" ON public.recurring_transactions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring_transactions" ON public.recurring_transactions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring_transactions" ON public.recurring_transactions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring_transactions" ON public.recurring_transactions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);