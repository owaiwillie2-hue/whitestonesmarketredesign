-- Alter profiles table to add suspension and plan override columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_plan_override_id UUID REFERENCES public.investment_plans(id) DEFAULT NULL;
