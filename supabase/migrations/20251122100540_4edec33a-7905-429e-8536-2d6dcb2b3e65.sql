-- Update Starter Plan max amount to 999
UPDATE investment_plans 
SET max_amount = 999 
WHERE name = 'Starter Plan';