-- Create security definer function to check admin role (if not exists)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Admin policies for account_balances
DROP POLICY IF EXISTS "Admins can manage all balances" ON public.account_balances;
CREATE POLICY "Admins can manage all balances" ON public.account_balances
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin policies for activity_logs  
DROP POLICY IF EXISTS "Admins can view all activity" ON public.activity_logs;
CREATE POLICY "Admins can view all activity" ON public.activity_logs
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin policies for admin_notes
DROP POLICY IF EXISTS "Admins can manage admin notes" ON public.admin_notes;
DROP POLICY IF EXISTS "Admins can view notes for a user" ON public.admin_notes;
CREATE POLICY "Admins can manage admin notes" ON public.admin_notes
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin policies for deposits
DROP POLICY IF EXISTS "Admins can manage all deposits" ON public.deposits;
CREATE POLICY "Admins can manage all deposits" ON public.deposits
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin policies for investment_plans
DROP POLICY IF EXISTS "Admins can manage plans" ON public.investment_plans;
CREATE POLICY "Admins can manage plans" ON public.investment_plans
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin policies for investments
DROP POLICY IF EXISTS "Admins can manage all investments" ON public.investments;
CREATE POLICY "Admins can manage all investments" ON public.investments
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin policies for kyc_documents
DROP POLICY IF EXISTS "Admins can view all KYC" ON public.kyc_documents;
DROP POLICY IF EXISTS "Admins can update all KYC" ON public.kyc_documents;
CREATE POLICY "Admins can manage all KYC" ON public.kyc_documents
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin policies for notifications
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
CREATE POLICY "Admins can manage notifications" ON public.notifications
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin policies for profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin policies for referrals
DROP POLICY IF EXISTS "Admins can manage all referrals" ON public.referrals;
CREATE POLICY "Admins can manage all referrals" ON public.referrals
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin policies for transactions
DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.transactions;
CREATE POLICY "Admins can manage all transactions" ON public.transactions
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin policies for user_roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" ON public.user_roles
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin policies for wallet_transfers
DROP POLICY IF EXISTS "Admins can manage transfers" ON public.wallet_transfers;
CREATE POLICY "Admins can manage transfers" ON public.wallet_transfers
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin policies for website_settings
DROP POLICY IF EXISTS "Admins can manage settings" ON public.website_settings;
CREATE POLICY "Admins can manage settings" ON public.website_settings
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin policies for withdrawal_accounts
DROP POLICY IF EXISTS "Admins can view all withdrawal accounts" ON public.withdrawal_accounts;
CREATE POLICY "Admins can manage all withdrawal accounts" ON public.withdrawal_accounts
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin policies for withdrawals
DROP POLICY IF EXISTS "Admins can manage all withdrawals" ON public.withdrawals;
CREATE POLICY "Admins can manage all withdrawals" ON public.withdrawals
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));