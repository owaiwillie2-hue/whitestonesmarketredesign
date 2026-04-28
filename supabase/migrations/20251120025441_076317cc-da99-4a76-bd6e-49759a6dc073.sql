-- Fix function search paths to address security warnings

-- Update generate_referral_code function with search_path
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
  code_exists BOOLEAN;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = result) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN result;
END;
$function$;

-- Update set_referral_code function with search_path
CREATE OR REPLACE FUNCTION public.set_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$function$;

-- Update update_updated_at_column function with search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;