-- Add missing columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Update wallets table structure to match code expectations
ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS main_balance DECIMAL(20, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS investment_balance DECIMAL(20, 2) DEFAULT 0;

-- Rename balance to match if needed (keep both for backward compatibility)
-- The code uses: main_balance, investment_balance, profit_balance, referral_balance

-- Create website_settings table
CREATE TABLE IF NOT EXISTS public.website_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create admin_notes table
CREATE TABLE IF NOT EXISTS public.admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create account_balances table (if needed by dashboard)
CREATE TABLE IF NOT EXISTS public.account_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  main_balance DECIMAL(20, 2) DEFAULT 0,
  investment_balance DECIMAL(20, 2) DEFAULT 0,
  profit_balance DECIMAL(20, 2) DEFAULT 0,
  referral_balance DECIMAL(20, 2) DEFAULT 0,
  account_active_since TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add expected_profit column to investments
ALTER TABLE public.investments 
ADD COLUMN IF NOT EXISTS expected_profit DECIMAL(20, 2) DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_balances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for website_settings
CREATE POLICY "Anyone can view settings"
  ON public.website_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage settings"
  ON public.website_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for admin_notes
CREATE POLICY "Admins can view all notes"
  ON public.admin_notes FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create notes"
  ON public.admin_notes FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update notes"
  ON public.admin_notes FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete notes"
  ON public.admin_notes FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for account_balances
CREATE POLICY "Users can view their own balance"
  ON public.account_balances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all balances"
  ON public.account_balances FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create function to generate unique referral codes
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character alphanumeric code
    new_code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = new_code) INTO code_exists;
    
    -- If code doesn't exist, return it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

-- Update the handle_new_user function to include referral code generation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile with referral code
  INSERT INTO public.profiles (user_id, full_name, email, referral_code)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name', 
    NEW.email,
    public.generate_referral_code()
  );
  
  -- Create wallet
  INSERT INTO public.wallets (user_id, balance, profit_balance, referral_balance, main_balance, investment_balance)
  VALUES (NEW.id, 0, 0, 0, 0, 0);
  
  -- Create account_balances
  INSERT INTO public.account_balances (user_id, main_balance, investment_balance, profit_balance, referral_balance)
  VALUES (NEW.id, 0, 0, 0, 0);
  
  -- Assign user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_admin_notes_user_id ON public.admin_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_account_balances_user_id ON public.account_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_website_settings_key ON public.website_settings(key);