-- Add profile fields to settings table
ALTER TABLE public.settings
ADD COLUMN user_name text,
ADD COLUMN user_age integer,
ADD COLUMN user_occupation text;

-- Create savings_goals table
CREATE TABLE public.savings_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id text NOT NULL,
  name text NOT NULL,
  target_amount numeric NOT NULL,
  current_amount numeric NOT NULL DEFAULT 0,
  deadline date,
  color text DEFAULT '#3B82F6',
  icon text DEFAULT 'target',
  is_completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

-- RLS policies for savings_goals
CREATE POLICY "Anyone can read savings_goals"
ON public.savings_goals FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert savings_goals"
ON public.savings_goals FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update savings_goals"
ON public.savings_goals FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete savings_goals"
ON public.savings_goals FOR DELETE
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_savings_goals_updated_at
BEFORE UPDATE ON public.savings_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();