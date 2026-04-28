-- Create deposit-proofs storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('deposit-proofs', 'deposit-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for deposit-proofs bucket
CREATE POLICY "Users can upload their own deposit proofs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'deposit-proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own deposit proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'deposit-proofs' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all deposit proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'deposit-proofs' AND
  has_role(auth.uid(), 'admin'::app_role)
);