export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      invoices: {
        Row: {
          id: string
          user_id: string
          client_name: string
          client_email: string
          description: string
          amount: number
          currency: string
          issue_date: string
          due_date: string
          status: 'draft' | 'sent' | 'paid' | 'overdue'
          pdf_url: string | null
          stripe_session_id: string | null
          payment_link: string | null
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_name: string
          client_email: string
          description: string
          amount: number
          currency?: string
          issue_date: string
          due_date: string
          status?: 'draft' | 'sent' | 'paid' | 'overdue'
          pdf_url?: string | null
          stripe_session_id?: string | null
          payment_link?: string | null
          paid_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_name?: string
          client_email?: string
          description?: string
          amount?: number
          currency?: string
          issue_date?: string
          due_date?: string
          status?: 'draft' | 'sent' | 'paid' | 'overdue'
          pdf_url?: string | null
          stripe_session_id?: string | null
          payment_link?: string | null
          paid_at?: string | null
          created_at?: string
        }
      }
      reminder_schedules: {
        Row: {
          id: string
          invoice_id: string
          days_after_due: number
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          days_after_due: number
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          days_after_due?: number
          sent_at?: string | null
          created_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          reminder_days: number[]
          company_name: string | null
          company_address: string | null
          company_logo: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          reminder_days?: number[]
          company_name?: string | null
          company_address?: string | null
          company_logo?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          reminder_days?: number[]
          company_name?: string | null
          company_address?: string | null
          company_logo?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}