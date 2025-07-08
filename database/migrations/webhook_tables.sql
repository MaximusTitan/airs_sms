-- Migration: Add webhook event tracking tables
-- Run this migration to support webhook event processing

-- Table to store all email events from webhooks
CREATE TABLE IF NOT EXISTS email_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email_id TEXT NOT NULL, -- Resend email ID
  event_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  data JSONB,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email_id, event_type, created_at)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_email_events_email_id ON email_events(email_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_created_at ON email_events(created_at);

-- Table to store daily email metrics for analytics
CREATE TABLE IF NOT EXISTS email_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  event_type TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, event_type)
);

-- Index for faster aggregation queries
CREATE INDEX IF NOT EXISTS idx_email_metrics_date ON email_metrics(date);
CREATE INDEX IF NOT EXISTS idx_email_metrics_type ON email_metrics(event_type);

-- Table to store unsubscribe list
CREATE TABLE IF NOT EXISTS unsubscribes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster unsubscribe checks
CREATE INDEX IF NOT EXISTS idx_unsubscribes_email ON unsubscribes(email);

-- Add new columns to existing emails table to track webhook events
-- (Only add if they don't already exist)
DO $$ 
BEGIN
  -- Add columns for tracking email status from webhooks
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'delivered_at') THEN
    ALTER TABLE emails ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'bounced_at') THEN
    ALTER TABLE emails ADD COLUMN bounced_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'complained_at') THEN
    ALTER TABLE emails ADD COLUMN complained_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'failed_at') THEN
    ALTER TABLE emails ADD COLUMN failed_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'bounce_type') THEN
    ALTER TABLE emails ADD COLUMN bounce_type TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'complaint_type') THEN
    ALTER TABLE emails ADD COLUMN complaint_type TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'failure_reason') THEN
    ALTER TABLE emails ADD COLUMN failure_reason TEXT;
  END IF;
  
  -- Add engagement tracking to leads table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'engagement_score') THEN
    ALTER TABLE leads ADD COLUMN engagement_score INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'last_engagement_at') THEN
    ALTER TABLE leads ADD COLUMN last_engagement_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'email_valid') THEN
    ALTER TABLE leads ADD COLUMN email_valid BOOLEAN DEFAULT TRUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'unsubscribed') THEN
    ALTER TABLE leads ADD COLUMN unsubscribed BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'unsubscribed_at') THEN
    ALTER TABLE leads ADD COLUMN unsubscribed_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'unsubscribe_reason') THEN
    ALTER TABLE leads ADD COLUMN unsubscribe_reason TEXT;
  END IF;
END $$;

-- Create or replace function to automatically update email_metrics
CREATE OR REPLACE FUNCTION upsert_email_metrics(p_date DATE, p_event_type TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO email_metrics (date, event_type, count)
  VALUES (p_date, p_event_type, 1)
  ON CONFLICT (date, event_type)
  DO UPDATE SET 
    count = email_metrics.count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS) for new tables
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE unsubscribes ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (adjust based on your authentication setup)
-- These policies assume you have a user_id column or similar authentication mechanism

-- Email events policy - users can only see events for their emails
CREATE POLICY "Users can view their own email events" ON email_events
  FOR SELECT USING (
    email_id IN (
      SELECT resend_id FROM emails WHERE user_id = auth.uid()
    )
  );

-- Email metrics policy - users can view aggregated metrics
CREATE POLICY "Users can view email metrics" ON email_metrics
  FOR SELECT USING (true); -- Adjust based on your needs

-- Unsubscribes policy - users can view unsubscribes for their leads
CREATE POLICY "Users can view unsubscribes for their leads" ON unsubscribes
  FOR SELECT USING (
    email IN (
      SELECT email FROM leads WHERE user_id = auth.uid()
    )
  );

-- Grant necessary permissions (adjust based on your service role)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_engagement_score ON leads(engagement_score);
CREATE INDEX IF NOT EXISTS idx_leads_email_valid ON leads(email_valid);
CREATE INDEX IF NOT EXISTS idx_leads_unsubscribed ON leads(unsubscribed);
CREATE INDEX IF NOT EXISTS idx_emails_resend_id ON emails(resend_id) WHERE resend_id IS NOT NULL;
