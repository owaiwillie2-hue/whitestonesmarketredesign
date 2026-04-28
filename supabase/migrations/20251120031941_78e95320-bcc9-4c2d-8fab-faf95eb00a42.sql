-- Drop duplicate policies first
DROP POLICY IF EXISTS "Admins can update notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can delete deposits" ON public.deposits;
DROP POLICY IF EXISTS "Admins can delete withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Admins can delete investments" ON public.investments;
DROP POLICY IF EXISTS "Admins can delete KYC documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "Admins can delete notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can delete referrals" ON public.referrals;
DROP POLICY IF EXISTS "Admins can delete wallet transfers" ON public.wallet_transfers;
DROP POLICY IF EXISTS "Admins can delete withdrawal accounts" ON public.withdrawal_accounts;
DROP POLICY IF EXISTS "Anyone can view active investment plans" ON public.investment_plans;
DROP POLICY IF EXISTS "Admins can manage investment plans" ON public.investment_plans;
DROP POLICY IF EXISTS "Anyone can view website settings" ON public.website_settings;
DROP POLICY IF EXISTS "Admins can manage website settings" ON public.website_settings;

-- Now create the policies with correct format matching the images
-- Format: TO authenticated, USING for SELECT/DELETE/UPDATE, WITH CHECK for INSERT

-- Notifications policies
CREATE POLICY "Admins can update notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Deposits policies
CREATE POLICY "Admins can delete deposits"
ON public.deposits
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Withdrawals policies
CREATE POLICY "Admins can delete withdrawals"
ON public.withdrawals
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Investments policies
CREATE POLICY "Admins can delete investments"
ON public.investments
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- KYC documents policies
CREATE POLICY "Admins can delete KYC documents"
ON public.kyc_documents
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Referrals policies
CREATE POLICY "Admins can delete referrals"
ON public.referrals
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Wallet transfers policies
CREATE POLICY "Admins can delete wallet transfers"
ON public.wallet_transfers
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Withdrawal accounts policies
CREATE POLICY "Admins can delete withdrawal accounts"
ON public.withdrawal_accounts
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Investment plans policies (public viewing)
CREATE POLICY "Anyone can view active investment plans"
ON public.investment_plans
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage investment plans"
ON public.investment_plans
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Website settings policies (public viewing)
CREATE POLICY "Anyone can view website settings"
ON public.website_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage website settings"
ON public.website_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));