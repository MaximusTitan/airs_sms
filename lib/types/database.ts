export interface Database {
  public: {
    Tables: {
      forms: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          fields: FormField[]
          is_active: boolean
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description?: string | null
          fields: FormField[]
          is_active?: boolean
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string | null
          fields?: FormField[]
          is_active?: boolean
          user_id?: string
        }
      }
      leads: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          email: string
          phone: string | null
          source: string | null
          status: LeadStatus
          form_id: string
          notes: string | null
          tags: string[]
          user_id: string
          form_data: Record<string, string | boolean | number>
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          email: string
          phone?: string | null
          source?: string | null
          status?: LeadStatus
          form_id: string
          notes?: string | null
          tags?: string[]
          user_id: string
          form_data?: Record<string, string | boolean | number>
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          email?: string
          phone?: string | null
          source?: string | null
          status?: LeadStatus
          form_id?: string
          notes?: string | null
          tags?: string[]
          user_id?: string
          form_data?: Record<string, string | boolean | number>
        }
      }
      emails: {
        Row: {
          id: string
          created_at: string
          subject: string
          content: string
          template_id: string | null
          sent_at: string | null
          status: EmailStatus
          recipient_emails: string[]
          lead_ids: string[]
          user_id: string
          resend_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          subject: string
          content: string
          template_id?: string | null
          sent_at?: string | null
          status?: EmailStatus
          recipient_emails: string[]
          lead_ids: string[]
          user_id: string
          resend_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          subject?: string
          content?: string
          template_id?: string | null
          sent_at?: string | null
          status?: EmailStatus
          recipient_emails?: string[]
          lead_ids?: string[]
          user_id?: string
          resend_id?: string | null
        }
      }
      email_templates: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          subject: string
          content: string
          variables: string[]
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          subject: string
          content: string
          variables?: string[]
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          subject?: string
          content?: string
          variables?: string[]
          user_id?: string
        }
      }
      lead_groups: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description?: string | null
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string | null
          user_id?: string
        }
      }
      group_memberships: {
        Row: {
          id: string
          created_at: string
          group_id: string
          lead_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          group_id: string
          lead_id: string
        }
        Update: {
          id?: string
          created_at?: string
          group_id?: string
          lead_id?: string
        }
      }
    }
  }
}

export type LeadStatus = 'new_lead' | 'qualified' | 'pilot_ready' | 'running_pilot' | 'pilot_done' | 'sale_done' | 'implementation' | 'not_interested' | 'unqualified' | 'trash'
export type EmailStatus = 'draft' | 'sending' | 'sent' | 'failed' | 'partially_sent'

export interface FormField {
  id: string
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox'
  label: string
  placeholder?: string
  required: boolean
  options?: string[] // for select fields
}

export interface Lead {
  id: string
  created_at: string
  updated_at: string
  name: string
  email: string
  phone: string | null
  source: string | null
  status: LeadStatus
  form_id: string
  notes: string | null
  tags: string[]
  user_id: string
  form_data: Record<string, string | boolean | number>
  groups?: { id: string; name: string }[]
}

export interface Form {
  id: string
  created_at: string
  updated_at: string
  name: string
  description: string | null
  fields: FormField[]
  is_active: boolean
  user_id: string
}

export interface EmailTemplate {
  id: string
  created_at: string
  updated_at: string
  name: string
  subject: string
  content: string
  variables: string[]
  user_id: string
}

export interface Email {
  id: string
  created_at: string
  subject: string
  content: string
  template_id: string | null
  sent_at: string | null
  status: EmailStatus
  recipient_emails: string[]
  lead_ids: string[]
  user_id: string
  resend_id: string | null
}

export interface LeadGroup {
  id: string
  created_at: string
  updated_at: string
  name: string
  description: string | null
  user_id: string
}

export interface GroupMembership {
  id: string
  created_at: string
  group_id: string
  lead_id: string
}
