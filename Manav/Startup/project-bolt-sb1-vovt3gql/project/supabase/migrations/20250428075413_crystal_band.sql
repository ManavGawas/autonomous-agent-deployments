/*
  # Create initial database schema for AutoInvoice-Remind

  1. New Tables
    - `invoices` - Stores all invoice data
    - `reminder_schedules` - Stores reminder settings for invoices
    - `user_settings` - Stores user preferences

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
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Users can view their own invoices'
  ) THEN
    CREATE POLICY "Users can view their own invoices"
      ON invoices
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Users can insert their own invoices'
  ) THEN
    CREATE POLICY "Users can insert their own invoices"
      ON invoices
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Users can update their own invoices'
  ) THEN
    CREATE POLICY "Users can update their own invoices"
      ON invoices
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Users can delete their own invoices'
  ) THEN
    CREATE POLICY "Users can delete their own invoices"
      ON invoices
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create policies for reminder_schedules table
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reminder_schedules' AND policyname = 'Users can view their own reminders'
  ) THEN
    CREATE POLICY "Users can view their own reminders"
      ON reminder_schedules
      FOR SELECT
      TO authenticated
      USING (invoice_id IN (
        SELECT id FROM invoices WHERE user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reminder_schedules' AND policyname = 'Users can insert their own reminders'
  ) THEN
    CREATE POLICY "Users can insert their own reminders"
      ON reminder_schedules
      FOR INSERT
      TO authenticated
      WITH CHECK (invoice_id IN (
        SELECT id FROM invoices WHERE user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reminder_schedules' AND policyname = 'Users can update their own reminders'
  ) THEN
    CREATE POLICY "Users can update their own reminders"
      ON reminder_schedules
      FOR UPDATE
      TO authenticated
      USING (invoice_id IN (
        SELECT id FROM invoices WHERE user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reminder_schedules' AND policyname = 'Users can delete their own reminders'
  ) THEN
    CREATE POLICY "Users can delete their own reminders"
      ON reminder_schedules
      FOR DELETE
      TO authenticated
      USING (invoice_id IN (
        SELECT id FROM invoices WHERE user_id = auth.uid()
      ));
  END IF;
END $$;

-- Create policies for user_settings table
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can view their own settings'
  ) THEN
    CREATE POLICY "Users can view their own settings"
      ON user_settings
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can insert their own settings'
  ) THEN
    CREATE POLICY "Users can insert their own settings"
      ON user_settings
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can update their own settings'
  ) THEN
    CREATE POLICY "Users can update their own settings"
      ON user_settings
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;