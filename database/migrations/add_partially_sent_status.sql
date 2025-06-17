-- Add 'partially_sent' status to emails table
ALTER TABLE emails DROP CONSTRAINT IF EXISTS emails_status_check;
ALTER TABLE emails ADD CONSTRAINT emails_status_check CHECK (status IN ('draft', 'sending', 'sent', 'failed', 'partially_sent'));
