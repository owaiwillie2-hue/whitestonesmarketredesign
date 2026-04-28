-- Change duration_days from integer to numeric to support fractional days (for hours)
ALTER TABLE investment_plans 
ALTER COLUMN duration_days TYPE numeric USING duration_days::numeric;