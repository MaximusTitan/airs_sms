-- Run this script to update your database with the new lead status options

-- Step 1: Drop the existing check constraint
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- Step 2: Add the new check constraint with all status options
ALTER TABLE public.leads ADD CONSTRAINT leads_status_check 
CHECK (status IN (
  'new_lead',
  'qualified', 
  'pilot_ready', 
  'running_pilot', 
  'pilot_done', 
  'sale_done', 
  'implementation', 
  'not_interested', 
  'unqualified', 
  'trash'
));

-- Step 3: Update default value for new leads
ALTER TABLE public.leads ALTER COLUMN status SET DEFAULT 'new_lead';

-- Optional: Update existing 'unqualified' leads to 'new_lead' (uncomment if desired)
-- UPDATE public.leads SET status = 'new_lead' WHERE status = 'unqualified';

-- Verify the changes
SELECT DISTINCT status FROM public.leads;
