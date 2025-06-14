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
    }
  }
}

export type LeadStatus = 'qualified' | 'unqualified' | 'trash'
export type EmailStatus = 'draft' | 'sending' | 'sent' | 'failed'

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
