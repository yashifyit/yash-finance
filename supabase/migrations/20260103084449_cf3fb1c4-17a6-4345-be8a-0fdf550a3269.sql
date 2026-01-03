-- Create device_id based identification for personal expense tracking
-- No authentication required - uses browser-generated device ID

-- Create categories table with default categories
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'circle',
    color TEXT DEFAULT '#6B7280',
    budget_limit DECIMAL(12, 2),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create settings table for user preferences
CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT UNIQUE NOT NULL,
    currency TEXT DEFAULT 'INR',
    currency_symbol TEXT DEFAULT '₹',
    monthly_budget DECIMAL(12, 2) DEFAULT 50000,
    dark_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
    amount DECIMAL(12, 2) NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    note TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_recurring BOOLEAN DEFAULT false,
    recurring_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create recurring transactions table
CREATE TABLE public.recurring_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
    amount DECIMAL(12, 2) NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    note TEXT,
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    next_due_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_processed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for categories (public access based on device_id in queries)
CREATE POLICY "Anyone can read categories" ON public.categories
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert categories" ON public.categories
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update their categories" ON public.categories
    FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete their categories" ON public.categories
    FOR DELETE USING (true);

-- Create policies for settings
CREATE POLICY "Anyone can read settings" ON public.settings
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert settings" ON public.settings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update settings" ON public.settings
    FOR UPDATE USING (true);

-- Create policies for transactions
CREATE POLICY "Anyone can read transactions" ON public.transactions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert transactions" ON public.transactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update transactions" ON public.transactions
    FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete transactions" ON public.transactions
    FOR DELETE USING (true);

-- Create policies for recurring_transactions
CREATE POLICY "Anyone can read recurring_transactions" ON public.recurring_transactions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert recurring_transactions" ON public.recurring_transactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update recurring_transactions" ON public.recurring_transactions
    FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete recurring_transactions" ON public.recurring_transactions
    FOR DELETE USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recurring_transactions_updated_at
    BEFORE UPDATE ON public.recurring_transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_categories_device_id ON public.categories(device_id);
CREATE INDEX idx_settings_device_id ON public.settings(device_id);
CREATE INDEX idx_transactions_device_id ON public.transactions(device_id);
CREATE INDEX idx_transactions_date ON public.transactions(date);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_recurring_transactions_device_id ON public.recurring_transactions(device_id);
CREATE INDEX idx_recurring_transactions_next_due ON public.recurring_transactions(next_due_date);
