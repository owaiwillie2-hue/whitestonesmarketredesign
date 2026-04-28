-- Create table to track contact form submissions for rate limiting
CREATE TABLE IF NOT EXISTS public.contact_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  email TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_contact_submissions_ip_time ON public.contact_form_submissions(ip_address, submitted_at);

-- Enable RLS (but allow public inserts for rate limiting)
ALTER TABLE public.contact_form_submissions ENABLE ROW LEVEL SECURITY;

-- Policy to allow edge function to insert and query
CREATE POLICY "Allow public to insert contact submissions"
  ON public.contact_form_submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public to read own submissions"
  ON public.contact_form_submissions
  FOR SELECT
  TO anon
  USING (true);

-- Function to clean up old submissions (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_contact_submissions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.contact_form_submissions
  WHERE submitted_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Create a scheduled job comment (actual scheduling would be done via Supabase dashboard)
COMMENT ON FUNCTION public.cleanup_old_contact_submissions IS 'Run this daily to clean up old contact form submissions for rate limiting';
