-- Update investment_plans table structure and data

-- First, change duration_days to support decimal values for hours
ALTER TABLE investment_plans 
ALTER COLUMN duration_days TYPE numeric;

-- Mark all existing plans as inactive (keep them for historical investment references)
UPDATE investment_plans 
SET is_active = false;

-- Insert the 4 new investment plans with exact specifications
INSERT INTO investment_plans (name, description, min_amount, max_amount, roi_percentage, duration_days, is_active)
VALUES
  (
    'Starter Plan',
    'Perfect for beginners with hourly returns',
    200,
    999,
    12,
    0.5,  -- 12 hours = 0.5 days
    true
  ),
  (
    'Platinum Plan',
    'Premium hourly returns for growing investors',
    1000,
    4999,
    36,
    1,  -- 24 hours = 1 day
    true
  ),
  (
    'Executive Plan',
    'High-yield daily returns for serious investors',
    5000,
    10000,
    50,
    2,  -- 2 days
    true
  ),
  (
    'Apex Plan',
    'Ultimate daily returns for elite investors',
    10000,
    NULL,  -- Unlimited
    90,
    3,  -- 3 days
    true
  );