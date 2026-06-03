-- Create generate_referral_code function if not exists
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

-- Create handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile with referral code if not exists
  INSERT INTO public.profiles (user_id, full_name, email, referral_code)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 
    NEW.email,
    public.generate_referral_code()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create wallet if not exists
  INSERT INTO public.wallets (user_id, balance, profit_balance, referral_balance, main_balance, investment_balance)
  VALUES (NEW.id, 0, 0, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create account_balances if not exists
  INSERT INTO public.account_balances (user_id, main_balance, investment_balance, profit_balance, referral_balance)
  VALUES (NEW.id, 0, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Assign user role if not exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill missing data for existing users (using pure SQL to avoid DO block variable declaration issues)
INSERT INTO public.profiles (user_id, full_name, email, referral_code)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', ''), 
  COALESCE(email, ''),
  public.generate_referral_code()
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.wallets (user_id, balance, profit_balance, referral_balance, main_balance, investment_balance)
SELECT id, 0, 0, 0, 0, 0
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.account_balances (user_id, main_balance, investment_balance, profit_balance, referral_balance)
SELECT id, 0, 0, 0, 0
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'
FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

-- Create diagnostic function to check triggers and tables status
CREATE OR REPLACE FUNCTION public.diagnose_database()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  trigger_info JSON;
  user_count INT;
  profile_count INT;
  wallet_count INT;
  balance_count INT;
  role_count INT;
  result JSON;
BEGIN
  -- 1. Check triggers on auth.users
  SELECT json_agg(t) INTO trigger_info FROM (
    SELECT 
        tgname AS trigger_name,
        tgenabled AS trigger_enabled,
        proname AS function_name
    FROM pg_trigger
    JOIN pg_proc ON pg_proc.oid = tgfoid
    WHERE tgrelid = 'auth.users'::regclass
  ) t;

  -- 2. Count users in auth.users
  SELECT count(*) INTO user_count FROM auth.users;

  -- 3. Count rows in public tables
  SELECT count(*) INTO profile_count FROM public.profiles;
  SELECT count(*) INTO wallet_count FROM public.wallets;
  SELECT count(*) INTO balance_count FROM public.account_balances;
  SELECT count(*) INTO role_count FROM public.user_roles;

  -- 4. Combine into result
  result := json_build_object(
    'triggers', trigger_info,
    'auth_users_count', user_count,
    'profiles_count', profile_count,
    'wallets_count', wallet_count,
    'account_balances_count', balance_count,
    'user_roles_count', role_count
  );

  RETURN result;
END;
$$;

-- Create diagnostic function for a specific user by email
CREATE OR REPLACE FUNCTION public.diagnose_user_by_email(_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  u_id UUID;
  has_profile BOOLEAN;
  has_wallet BOOLEAN;
  has_balance BOOLEAN;
  role_name TEXT;
  two_fa_enabled BOOLEAN;
  is_suspended BOOLEAN;
BEGIN
  -- Get user ID from auth.users
  SELECT id INTO u_id FROM auth.users WHERE email = _email;
  
  IF u_id IS NULL THEN
    RETURN json_build_object('exists_in_auth', false);
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = u_id) INTO has_profile;
  SELECT EXISTS(SELECT 1 FROM public.wallets WHERE user_id = u_id) INTO has_wallet;
  SELECT EXISTS(SELECT 1 FROM public.account_balances WHERE user_id = u_id) INTO has_balance;
  SELECT role INTO role_name FROM public.user_roles WHERE user_id = u_id LIMIT 1;
  SELECT COALESCE(two_factor_enabled, false), COALESCE(profiles.is_suspended, false) INTO two_fa_enabled, is_suspended FROM public.profiles WHERE user_id = u_id;

  RETURN json_build_object(
    'exists_in_auth', true,
    'user_id', u_id,
    'has_profile', has_profile,
    'has_wallet', has_wallet,
    'has_balance', has_balance,
    'role', role_name,
    'two_fa_enabled', two_fa_enabled,
    'is_suspended', is_suspended
  );
END;
$$;
