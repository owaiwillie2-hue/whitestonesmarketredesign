-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
);

-- RLS policies for kyc-documents bucket
CREATE POLICY "Users can upload their own KYC documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own KYC documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all KYC documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can update their own KYC documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own KYC documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'kyc-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Function to send KYC status change notification
CREATE OR REPLACE FUNCTION notify_kyc_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Only send notification if status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'approved' THEN
        notification_title := 'KYC Verification Approved';
        notification_message := 'Congratulations! Your KYC verification has been approved. You can now access all features.';
      WHEN 'rejected' THEN
        notification_title := 'KYC Verification Rejected';
        notification_message := 'Your KYC verification was rejected. Reason: ' || COALESCE(NEW.rejection_reason, 'Please resubmit with correct documents.');
      WHEN 'pending' THEN
        notification_title := 'KYC Under Review';
        notification_message := 'Your KYC documents are being reviewed. We will notify you once the review is complete.';
      ELSE
        RETURN NEW;
    END CASE;

    -- Insert notification
    INSERT INTO notifications (user_id, title, message, type, is_read)
    VALUES (NEW.user_id, notification_title, notification_message, 'kyc_status', false);
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger for KYC status change notifications
DROP TRIGGER IF EXISTS kyc_status_notification ON kyc_documents;
CREATE TRIGGER kyc_status_notification
  AFTER UPDATE ON kyc_documents
  FOR EACH ROW
  EXECUTE FUNCTION notify_kyc_status_change();

-- Function to process referral bonus on first deposit
CREATE OR REPLACE FUNCTION process_referral_bonus()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_user_id UUID;
  bonus_amount NUMERIC;
  kyc_approved BOOLEAN;
BEGIN
  -- Only process if deposit is approved
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Check if user has approved KYC
    SELECT EXISTS(
      SELECT 1 FROM kyc_documents 
      WHERE user_id = NEW.user_id AND status = 'approved'
    ) INTO kyc_approved;

    -- Only process referral if KYC is approved
    IF kyc_approved THEN
      -- Get referrer ID from referrals table
      SELECT referrer_id INTO referrer_user_id
      FROM referrals
      WHERE referred_id = NEW.user_id AND bonus_paid = false
      LIMIT 1;

      -- If referrer exists, process bonus
      IF referrer_user_id IS NOT NULL THEN
        bonus_amount := NEW.amount * 0.10; -- 10% bonus

        -- Update referral record
        UPDATE referrals
        SET bonus_amount = bonus_amount, bonus_paid = true
        WHERE referrer_id = referrer_user_id AND referred_id = NEW.user_id;

        -- Add bonus to referrer's referral balance
        UPDATE account_balances
        SET referral_balance = referral_balance + bonus_amount
        WHERE user_id = referrer_user_id;

        UPDATE wallets
        SET referral_balance = referral_balance + bonus_amount
        WHERE user_id = referrer_user_id;

        -- Create transaction record
        INSERT INTO transactions (user_id, type, amount, status, description)
        VALUES (
          referrer_user_id,
          'referral_bonus',
          bonus_amount,
          'completed',
          'Referral bonus from user deposit'
        );

        -- Send notification to referrer
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (
          referrer_user_id,
          'Referral Bonus Received',
          'You earned $' || bonus_amount || ' referral bonus from your referral''s first deposit!',
          'referral_bonus'
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger for referral bonus on deposit approval
DROP TRIGGER IF EXISTS process_deposit_referral_bonus ON deposits;
CREATE TRIGGER process_deposit_referral_bonus
  AFTER UPDATE ON deposits
  FOR EACH ROW
  EXECUTE FUNCTION process_referral_bonus();