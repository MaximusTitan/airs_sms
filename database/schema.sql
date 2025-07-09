create table public.email_events (
  id uuid not null default gen_random_uuid (),
  email_id text not null,
  event_type text not null,
  created_at timestamp with time zone not null,
  data jsonb null,
  processed_at timestamp with time zone null default now(),
  constraint email_events_pkey primary key (id),
  constraint email_events_email_id_event_type_created_at_key unique (email_id, event_type, created_at)
) TABLESPACE pg_default;

create index IF not exists idx_email_events_email_id on public.email_events using btree (email_id) TABLESPACE pg_default;

create index IF not exists idx_email_events_type on public.email_events using btree (event_type) TABLESPACE pg_default;

create index IF not exists idx_email_events_created_at on public.email_events using btree (created_at) TABLESPACE pg_default;

create table public.email_metrics (
  id uuid not null default gen_random_uuid (),
  date date not null,
  event_type text not null,
  count integer null default 1,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint email_metrics_pkey primary key (id),
  constraint email_metrics_date_event_type_key unique (date, event_type)
) TABLESPACE pg_default;

create index IF not exists idx_email_metrics_date on public.email_metrics using btree (date) TABLESPACE pg_default;

create index IF not exists idx_email_metrics_type on public.email_metrics using btree (event_type) TABLESPACE pg_default;

create table public.email_templates (
  id uuid not null default extensions.uuid_generate_v4 (),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  name text not null,
  subject text not null,
  content text not null,
  variables text[] null default '{}'::text[],
  user_id uuid not null,
  constraint email_templates_pkey primary key (id),
  constraint email_templates_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_email_templates_user_id on public.email_templates using btree (user_id) TABLESPACE pg_default;

create trigger update_email_templates_updated_at BEFORE
update on email_templates for EACH row
execute FUNCTION update_updated_at_column ();

create table public.emails (
  id uuid not null default extensions.uuid_generate_v4 (),
  created_at timestamp with time zone null default now(),
  subject text not null,
  content text not null,
  template_id uuid null,
  sent_at timestamp with time zone null,
  status text not null default 'draft'::text,
  recipient_emails text[] not null default '{}'::text[],
  lead_ids uuid[] null default '{}'::uuid[],
  user_id uuid not null,
  resend_id text null,
  delivered_at timestamp with time zone null,
  bounced_at timestamp with time zone null,
  complained_at timestamp with time zone null,
  failed_at timestamp with time zone null,
  bounce_type text null,
  complaint_type text null,
  failure_reason text null,
  personalized boolean null default false,
  constraint emails_pkey primary key (id),
  constraint emails_template_id_fkey foreign KEY (template_id) references email_templates (id) on delete set null,
  constraint emails_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint emails_status_check check (
    (
      status = any (
        array[
          'draft'::text,
          'sending'::text,
          'sent'::text,
          'failed'::text,
          'partially_sent'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_emails_resend_id on public.emails using btree (resend_id) TABLESPACE pg_default
where
  (resend_id is not null);

create index IF not exists idx_emails_personalized on public.emails using btree (personalized) TABLESPACE pg_default;

create index IF not exists idx_emails_user_id on public.emails using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_emails_status on public.emails using btree (status) TABLESPACE pg_default;

create index IF not exists idx_emails_created_at on public.emails using btree (created_at) TABLESPACE pg_default;

create table public.forms (
  id uuid not null default extensions.uuid_generate_v4 (),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  name text not null,
  description text null,
  fields jsonb not null default '[]'::jsonb,
  is_active boolean null default true,
  user_id uuid not null,
  constraint forms_pkey primary key (id),
  constraint forms_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_forms_user_id on public.forms using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_forms_active on public.forms using btree (is_active) TABLESPACE pg_default;

create trigger update_forms_updated_at BEFORE
update on forms for EACH row
execute FUNCTION update_updated_at_column ();

create table public.group_memberships (
  id uuid not null default extensions.uuid_generate_v4 (),
  created_at timestamp with time zone null default now(),
  group_id uuid not null,
  lead_id uuid not null,
  constraint group_memberships_pkey primary key (id),
  constraint group_memberships_group_id_lead_id_key unique (group_id, lead_id),
  constraint group_memberships_group_id_fkey foreign KEY (group_id) references lead_groups (id) on delete CASCADE,
  constraint group_memberships_lead_id_fkey foreign KEY (lead_id) references leads (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_group_memberships_group_id on public.group_memberships using btree (group_id) TABLESPACE pg_default;

create index IF not exists idx_group_memberships_lead_id on public.group_memberships using btree (lead_id) TABLESPACE pg_default;

create table public.lead_groups (
  id uuid not null default extensions.uuid_generate_v4 (),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  name text not null,
  description text null,
  user_id uuid not null,
  constraint lead_groups_pkey primary key (id),
  constraint lead_groups_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_lead_groups_user_id on public.lead_groups using btree (user_id) TABLESPACE pg_default;

create trigger update_lead_groups_updated_at BEFORE
update on lead_groups for EACH row
execute FUNCTION update_updated_at_column ();

create table public.leads (
  id uuid not null default extensions.uuid_generate_v4 (),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  name text not null,
  email text null,
  phone text null,
  source text null,
  status text not null default 'new_lead'::text,
  form_id uuid not null,
  notes text null,
  tags text[] null default '{}'::text[],
  user_id uuid not null,
  form_data jsonb null default '{}'::jsonb,
  engagement_score integer null default 0,
  last_engagement_at timestamp with time zone null,
  email_valid boolean null default true,
  unsubscribed boolean null default false,
  unsubscribed_at timestamp with time zone null,
  unsubscribe_reason text null,
  constraint leads_pkey primary key (id),
  constraint leads_form_id_fkey foreign KEY (form_id) references forms (id) on delete CASCADE,
  constraint leads_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint leads_status_check check (
    (
      status = any (
        array[
          'new_lead'::text,
          'qualified'::text,
          'pilot_ready'::text,
          'running_pilot'::text,
          'pilot_done'::text,
          'sale_done'::text,
          'implementation'::text,
          'not_interested'::text,
          'unqualified'::text,
          'trash'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_leads_user_id on public.leads using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_leads_form_id on public.leads using btree (form_id) TABLESPACE pg_default;

create index IF not exists idx_leads_status on public.leads using btree (status) TABLESPACE pg_default;

create index IF not exists idx_leads_created_at on public.leads using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_leads_engagement_score on public.leads using btree (engagement_score) TABLESPACE pg_default;

create index IF not exists idx_leads_email_valid on public.leads using btree (email_valid) TABLESPACE pg_default;

create index IF not exists idx_leads_unsubscribed on public.leads using btree (unsubscribed) TABLESPACE pg_default;

create trigger update_leads_updated_at BEFORE
update on leads for EACH row
execute FUNCTION update_updated_at_column ();

create table public.unsubscribes (
  id uuid not null default gen_random_uuid (),
  email text not null,
  reason text null,
  created_at timestamp with time zone null default now(),
  ip_address text null,
  user_agent text null,
  constraint unsubscribes_pkey primary key (id),
  constraint unsubscribes_email_key unique (email)
) TABLESPACE pg_default;

create index IF not exists idx_unsubscribes_email on public.unsubscribes using btree (email) TABLESPACE pg_default;

-- Function to upsert email metrics (used by webhook handlers)
CREATE OR REPLACE FUNCTION upsert_email_metrics(
  p_date date,
  p_event_type text
) RETURNS void AS $$
BEGIN
  INSERT INTO email_metrics (date, event_type, count)
  VALUES (p_date, p_event_type, 1)
  ON CONFLICT (date, event_type)
  DO UPDATE SET 
    count = email_metrics.count + 1,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for better performance on email analytics queries
CREATE INDEX IF NOT EXISTS idx_email_events_email_id_type_created ON public.email_events 
USING btree (email_id, event_type, created_at);

-- Add GIN index for JSONB data in email_events for better performance on data queries
CREATE INDEX IF NOT EXISTS idx_email_events_data_gin ON public.email_events 
USING gin (data);

-- Email metrics table for daily analytics tracking
CREATE TABLE IF NOT EXISTS email_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    event_type TEXT NOT NULL,
    count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(date, event_type)
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_email_metrics_date_event ON email_metrics(date, event_type);

-- Unsubscribes table for tracking user unsubscriptions
CREATE TABLE IF NOT EXISTS unsubscribes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ip_address TEXT,
    user_agent TEXT
);

-- Index for efficient email lookups
CREATE INDEX IF NOT EXISTS idx_unsubscribes_email ON unsubscribes(email);

-- Webhook events tracking table for idempotency
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    svix_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_webhook_events_svix_id ON webhook_events(svix_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at ON webhook_events(processed_at);

-- Enable RLS
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS policy for webhook_events
CREATE POLICY "webhook_events_policy" ON webhook_events
FOR ALL USING (true);

-- Cleanup function to remove old webhook events (older than 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events() RETURNS VOID AS $$
BEGIN
    DELETE FROM webhook_events 
    WHERE processed_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;