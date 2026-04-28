-- Add admin UPDATE policies for notifications table
CREATE POLICY "Admins can update notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add admin DELETE policies
CREATE POLICY "Admins can delete deposits"
ON public.deposits
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete withdrawals"
ON public.withdrawals
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete investments"
ON public.investments
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete KYC documents"
ON public.kyc_documents
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete referrals"
ON public.referrals
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete wallet transfers"
ON public.wallet_transfers
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete withdrawal accounts"
ON public.withdrawal_accounts
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add user policies for investment_plans (public read)
CREATE POLICY "Anyone can view active investment plans"
ON public.investment_plans
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage investment plans"
ON public.investment_plans
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add user policies for website_settings
CREATE POLICY "Anyone can view website settings"
ON public.website_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage website settings"
ON public.website_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));