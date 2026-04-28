-- Make max_amount nullable to support unlimited plans
ALTER TABLE investment_plans ALTER COLUMN max_amount DROP NOT NULL;

-- Clear existing plans first
TRUNCATE investment_plans CASCADE;

-- Insert the new plans
INSERT INTO investment_plans (name, description, min_amount, max_amount, profit_percentage, duration_days, is_active) VALUES
('Starter Plan', 'Perfect for beginners with hourly returns', 100, 999, 12, 0.5, true),
('Platinum Plan', 'Premium hourly returns for growing investors', 1000, 4999, 36, 1, true),
('Executive Plan', 'High-yield daily returns for serious investors', 5000, 10000, 50, 2, true),
('Apex Plan', 'Ultimate daily returns for elite investors', 10000, NULL, 90, 3, true);