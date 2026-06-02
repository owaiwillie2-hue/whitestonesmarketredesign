-- Drop the old generic ALL policy that does not have explicit WITH CHECK clause
DROP POLICY IF EXISTS "Admins can manage plans" ON public.investment_plans;
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.investment_plans;

-- Create explicit SELECT policy for active plans and admins
CREATE POLICY "Admins and public can view plans" ON public.investment_plans
  FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

-- Create explicit INSERT policy for admins
CREATE POLICY "Admins can insert plans" ON public.investment_plans
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create explicit UPDATE policy for admins
CREATE POLICY "Admins can update plans" ON public.investment_plans
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create explicit DELETE policy for admins
CREATE POLICY "Admins can delete plans" ON public.investment_plans
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
