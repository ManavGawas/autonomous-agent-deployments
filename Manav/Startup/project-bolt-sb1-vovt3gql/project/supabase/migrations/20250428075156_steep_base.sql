/*
  # Create initial database schema for AutoInvoice-Remind

  1. New Tables
    - `invoices` - Stores all invoice data
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Reference to auth.users
      - `client_name` (text) - Name of the client
      - `client_email` (text) - Email of the client
      - `description` (text) - Invoice description
      - `amount` (numeric) - Invoice amount
      - `currency` (text) - Currency code (default: USD)
      - `issue_date` (date) - When the invoice was issued
      - `due_date` (date) - When payment is due
      - `status` (text) - Invoice status: draft, sent, paid, overdue
      - `pdf_url` (text) - URL to the generated PDF
      - `stripe_session_id` (text) - Stripe checkout session ID
      - `payment_link` (text) - Payment link for the invoice
      - `paid_at` (timestamptz) - When the invoice was paid
      - `created_at` (timestamptz) - When the invoice was created
    
    - `reminder_schedules` - Stores reminder settings for invoices
      - `id` (uuid, primary key)
      - `invoice_id` (uuid) - Reference to invoices
      - `days_after_due` (integer) - Days after due date to send reminder
      - `sent_at` (timestamptz) - When the reminder was sent
      - `created_at` (timestamptz) - When the reminder was created
    
    - `user_settings` - Stores user preferences
      - `id` (uuid, primary key)
      - `user_id` (uuid) - Reference to auth.users
      - `reminder_days` (integer[]) - Default reminder days
      - `company_name` (text) - Company name
      - `company_address` (text) - Company address
      - `company_logo` (text) - URL to company logo
      - `created_at` (timestamptz) - When settings were created

  2. Security
    - Enable RLS on all tables
    - Add policies to control access based on user_id
*/

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  client_name text NOT NULL,
  client_email text NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  issue_date date NOT NULL,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  pdf_url text,
  stripe_session_id text,
  payment_link text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create reminder_schedules table
CREATE TABLE IF NOT EXISTS reminder_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  days_after_due integer NOT NULL,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
  reminder_days integer[] DEFAULT '{3,7,14}',
  company_name text,
  company_address text,
  company_logo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for invoices table
CREATE POLICY "Users can view their own invoices"
  ON invoices
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices"
  ON invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
  ON invoices
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices"
  ON invoices
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for reminder_schedules table
CREATE POLICY "Users can view their own reminders"
  ON reminder_schedules
  FOR SELECT
  TO authenticated
  USING (invoice_id IN (
    SELECT id FROM invoices WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own reminders"
  ON reminder_schedules
  FOR INSERT
  TO authenticated
  WITH CHECK (invoice_id IN (
    SELECT id FROM invoices WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own reminders"
  ON reminder_schedules
  FOR UPDATE
  TO authenticated
  USING (invoice_id IN (
    SELECT id FROM invoices WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own reminders"
  ON reminder_schedules
  FOR DELETE
  TO authenticated
  USING (invoice_id IN (
    SELECT id FROM invoices WHERE user_id = auth.uid()
  ));

-- Create policies for user_settings table
CREATE POLICY "Users can view their own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);