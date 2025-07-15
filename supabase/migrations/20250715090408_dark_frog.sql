/*
  # Add Email Confirmation Columns to Users Table

  1. Purpose
    - Add email_confirmed flag to users table
    - Add email_confirmation_token column for storing tokens
    - Add confirmation_sent_at timestamp for tracking when confirmation emails were sent

  2. Changes
    - Add email_confirmed boolean column with default false
    - Add email_confirmation_token column for storing tokens
    - Add confirmation_sent_at timestamp for tracking when confirmation emails were sent
    - Add index on email_confirmation_token for faster lookups
*/

-- Add email confirmation columns to users table if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_confirmed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS email_confirmation_token text,
ADD COLUMN IF NOT EXISTS confirmation_sent_at timestamptz;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_users_email_confirmation_token ON users(email_confirmation_token);

-- Add maintenance log entry
INSERT INTO maintenance_log (operation, details) 
VALUES (
  'add_email_confirmation_columns',
  jsonb_build_object(
    'timestamp', NOW(),
    'description', 'Added email confirmation tracking to users table',
    'changes', jsonb_build_array(
      'Added email_confirmed boolean column',
      'Added email_confirmation_token column',
      'Added confirmation_sent_at timestamp',
      'Created index on email_confirmation_token'
    ),
    'security_level', 'MEDIUM'
  )
);