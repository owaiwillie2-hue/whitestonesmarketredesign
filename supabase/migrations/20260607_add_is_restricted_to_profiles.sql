-- Add is_restricted column to profiles table
-- This allows admins to restrict user accounts (block transactions while still allowing login)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_restricted boolean DEFAULT false;
