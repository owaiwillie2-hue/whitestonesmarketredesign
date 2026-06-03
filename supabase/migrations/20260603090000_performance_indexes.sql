-- SQL Migration: performance optimization indexes

-- Missing foreign key index for withdrawal accounts
CREATE INDEX IF NOT EXISTS idx_withdrawal_accounts_user_id ON public.withdrawal_accounts(user_id);

-- Filtering indexes for transactional statuses
CREATE INDEX IF NOT EXISTS idx_investments_status ON public.investments(status);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON public.deposits(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);

-- Sorting indexes for timelines and logs
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- Referral referred ID index
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_id);
