-- Add CHECK constraints for input validation at the database level

-- Transactions table
ALTER TABLE public.transactions
ADD CONSTRAINT check_transaction_amount 
CHECK (amount > 0 AND amount < 10000000);

ALTER TABLE public.transactions
ADD CONSTRAINT check_transaction_note_length 
CHECK (note IS NULL OR length(note) <= 500);

-- Categories table
ALTER TABLE public.categories
ADD CONSTRAINT check_category_name_length 
CHECK (length(name) > 0 AND length(name) <= 50);

ALTER TABLE public.categories
ADD CONSTRAINT check_category_budget_limit 
CHECK (budget_limit IS NULL OR (budget_limit > 0 AND budget_limit < 10000000));

-- Settings table
ALTER TABLE public.settings
ADD CONSTRAINT check_user_age_range 
CHECK (user_age IS NULL OR (user_age >= 0 AND user_age <= 150));

ALTER TABLE public.settings
ADD CONSTRAINT check_monthly_budget_range 
CHECK (monthly_budget IS NULL OR (monthly_budget >= 0 AND monthly_budget < 100000000));

ALTER TABLE public.settings
ADD CONSTRAINT check_user_name_length 
CHECK (user_name IS NULL OR length(user_name) <= 100);

ALTER TABLE public.settings
ADD CONSTRAINT check_user_occupation_length 
CHECK (user_occupation IS NULL OR length(user_occupation) <= 100);

-- Savings goals table
ALTER TABLE public.savings_goals
ADD CONSTRAINT check_savings_target_amount 
CHECK (target_amount > 0 AND target_amount < 10000000);

ALTER TABLE public.savings_goals
ADD CONSTRAINT check_savings_current_amount 
CHECK (current_amount >= 0 AND current_amount < 10000000);

ALTER TABLE public.savings_goals
ADD CONSTRAINT check_savings_name_length 
CHECK (length(name) > 0 AND length(name) <= 100);

-- Recurring transactions table
ALTER TABLE public.recurring_transactions
ADD CONSTRAINT check_recurring_amount 
CHECK (amount > 0 AND amount < 10000000);

ALTER TABLE public.recurring_transactions
ADD CONSTRAINT check_recurring_note_length 
CHECK (note IS NULL OR length(note) <= 500);