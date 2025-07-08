-- Migration to update lead status options
-- Date: 2025-07-08

-- Drop the existing check constraint
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- Add the new check constraint with all status options
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

-- Update default value for new leads
ALTER TABLE public.leads ALTER COLUMN status SET DEFAULT 'new_lead';

-- Optionally update existing 'unqualified' leads to 'new_lead' if desired
-- UPDATE public.leads SET status = 'new_lead' WHERE status = 'unqualified';
