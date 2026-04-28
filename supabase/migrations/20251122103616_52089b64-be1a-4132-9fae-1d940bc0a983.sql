-- Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.kyc_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.transaction_type AS ENUM ('deposit', 'withdrawal', 'profit', 'referral_bonus', 'investment');
CREATE TYPE public.transaction_status AS ENUM ('pending', 'completed', 'rejected', 'processing');
CREATE TYPE public.investment_status AS ENUM ('active', 'completed', 'cancelled');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  country TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  date_of_birth DATE,
  avatar_url TEXT,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- KYC documents table
CREATE TABLE public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  status kyc_status DEFAULT 'pending',
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Investment plans table
CREATE TABLE public.investment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  min_amount DECIMAL(20, 2) NOT NULL,
  max_amount DECIMAL(20, 2) NOT NULL,
  profit_percentage DECIMAL(5, 2) NOT NULL,
  duration_days INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User investments table
CREATE TABLE public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.investment_plans(id),
  amount DECIMAL(20, 2) NOT NULL,
  profit DECIMAL(20, 2) DEFAULT 0,
  status investment_status DEFAULT 'active',
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Wallets table
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(20, 2) DEFAULT 0,
  profit_balance DECIMAL(20, 2) DEFAULT 0,
  referral_balance DECIMAL(20, 2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Deposits table
CREATE TABLE public.deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(20, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_hash TEXT,
  proof_url TEXT,
  status transaction_status DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id)
);

-- Withdrawal accounts table
CREATE TABLE public.withdrawal_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL,
  account_details JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Withdrawals table
CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.withdrawal_accounts(id),
  amount DECIMAL(20, 2) NOT NULL,
  wallet_type TEXT NOT NULL,
  status transaction_status DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id)
);

-- Transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount DECIMAL(20, 2) NOT NULL,
  status transaction_status DEFAULT 'completed',
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Referrals table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bonus_amount DECIMAL(20, 2) DEFAULT 0,
  bonus_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT,
  is_read BOOLEAN DEFAULT false,
  is_global BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activity logs table
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);
  
  -- Create wallet
  INSERT INTO public.wallets (user_id, balance, profit_balance, referral_balance)
  VALUES (NEW.id, 0, 0, 0);
  
  -- Assign user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for kyc_documents
CREATE POLICY "Users can view their own KYC"
  ON public.kyc_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own KYC"
  ON public.kyc_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all KYC"
  ON public.kyc_documents FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for investment_plans
CREATE POLICY "Anyone can view active plans"
  ON public.investment_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage plans"
  ON public.investment_plans FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for investments
CREATE POLICY "Users can view their own investments"
  ON public.investments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own investments"
  ON public.investments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all investments"
  ON public.investments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for wallets
CREATE POLICY "Users can view their own wallet"
  ON public.wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets"
  ON public.wallets FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for deposits
CREATE POLICY "Users can view their own deposits"
  ON public.deposits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deposits"
  ON public.deposits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all deposits"
  ON public.deposits FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for withdrawal_accounts
CREATE POLICY "Users can manage their own accounts"
  ON public.withdrawal_accounts FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all accounts"
  ON public.withdrawal_accounts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for withdrawals
CREATE POLICY "Users can view their own withdrawals"
  ON public.withdrawals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own withdrawals"
  ON public.withdrawals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all withdrawals"
  ON public.withdrawals FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for referrals
CREATE POLICY "Users can view their referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Admins can view all referrals"
  ON public.referrals FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id OR is_global = true);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications"
  ON public.notifications FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for activity_logs
CREATE POLICY "Users can view their own logs"
  ON public.activity_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all logs"
  ON public.activity_logs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for better performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_kyc_user_id ON public.kyc_documents(user_id);
CREATE INDEX idx_investments_user_id ON public.investments(user_id);
CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX idx_deposits_user_id ON public.deposits(user_id);
CREATE INDEX idx_withdrawals_user_id ON public.withdrawals(user_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);