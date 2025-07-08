-- Migration: Add personalized column to emails table
-- Date: 2025-07-09
-- Description: Add a boolean column to track whether emails are personalized

-- Add personalized column to emails table
ALTER TABLE emails 
ADD COLUMN IF NOT EXISTS personalized BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN emails.personalized IS 'Indicates if the email was sent with personalized content (individual sends vs bulk sends)';

-- Create index for performance when filtering by personalization type
CREATE INDEX IF NOT EXISTS idx_emails_personalized ON emails(personalized);
