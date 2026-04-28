-- Clear existing plans
TRUNCATE investment_plans CASCADE;

-- Insert the corrected plans with accurate values
INSERT INTO investment_plans (name, description, min_amount, max_amount, profit_percentage, duration_days, is_active) VALUES
('STARTER PLAN', '1.00% Hourly Interest - 12 Term Hours', 200, 999, 12, 0.5, true),
('PLATINUM PLAN', '1.50% Hourly Interest - 24 Term Hours', 1000, 4999, 36, 1, true),
('EXECUTIVE PLAN', '25.00% Daily Interest - 2 Term Days', 5000, 10000, 50, 2, true),
('APEX PLAN', '30.00% Daily Interest - 3 Term Days', 10000, NULL, 90, 3, true);