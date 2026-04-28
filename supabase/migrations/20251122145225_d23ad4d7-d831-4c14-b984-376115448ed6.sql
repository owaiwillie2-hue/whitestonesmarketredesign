-- Create wallet_transfers table
CREATE TABLE IF NOT EXISTS public.wallet_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  from_wallet TEXT NOT NULL,
  to_wallet TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT wallet_transfers_amount_positive CHECK (amount > 0)
);

-- Enable Row Level Security
ALTER TABLE public.wallet_transfers ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own transfers" 
ON public.wallet_transfers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transfers" 
ON public.wallet_transfers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policy for admins
CREATE POLICY "Admins can view all transfers" 
ON public.wallet_transfers 
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for better query performance
CREATE INDEX idx_wallet_transfers_user_id ON public.wallet_transfers(user_id);
CREATE INDEX idx_wallet_transfers_created_at ON public.wallet_transfers(created_at DESC);