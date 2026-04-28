-- Create settings storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('settings', 'settings', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for settings bucket
CREATE POLICY "Settings images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'settings');

CREATE POLICY "Admins can upload settings images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'settings' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update settings images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'settings' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete settings images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'settings' 
  AND has_role(auth.uid(), 'admin'::app_role)
);