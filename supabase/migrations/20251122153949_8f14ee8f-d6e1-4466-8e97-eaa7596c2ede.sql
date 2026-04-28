-- Create redeemable_bonuses table
CREATE TABLE IF NOT EXISTS public.redeemable_bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  admin_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  message TEXT NOT NULL,
  is_redeemed BOOLEAN DEFAULT FALSE,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.redeemable_bonuses ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own redeemable bonuses
CREATE POLICY "Users can view their own redeemable bonuses"
ON public.redeemable_bonuses
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy for users to update their own redeemable bonuses (for redemption)
CREATE POLICY "Users can redeem their own bonuses"
ON public.redeemable_bonuses
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Policy for admins to manage all redeemable bonuses
CREATE POLICY "Admins can manage all redeemable bonuses"
ON public.redeemable_bonuses
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_redeemable_bonuses_user_id ON public.redeemable_bonuses(user_id);
CREATE INDEX idx_redeemable_bonuses_is_redeemed ON public.redeemable_bonuses(is_redeemed);