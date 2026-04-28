-- Create deposit-proofs storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('deposit-proofs', 'deposit-proofs', false);

-- Allow authenticated users to upload their own deposit proofs
CREATE POLICY "Users can upload their own deposit proofs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'deposit-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own deposit proofs
CREATE POLICY "Users can view their own deposit proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'deposit-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to view all deposit proofs
CREATE POLICY "Admins can view all deposit proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'deposit-proofs'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Allow users to update their own deposit proofs
CREATE POLICY "Users can update their own deposit proofs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'deposit-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own deposit proofs
CREATE POLICY "Users can delete their own deposit proofs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'deposit-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);