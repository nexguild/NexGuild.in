-- migrations_v15.sql
-- Pay per task INR amount + project client payment INR

-- Store the original INR amount entered by admin (pay_per_task remains NC as source of truth)
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS pay_per_task_inr DECIMAL(10,2);

-- Store client payment in INR for margin calculations
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS client_payment_inr DECIMAL(10,2);
