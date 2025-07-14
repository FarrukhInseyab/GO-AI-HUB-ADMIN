/*
  # Add RLS Policies for Users Table

  1. Purpose
    - Allow authenticated evaluators to read user data
    - Enable customer management functionality
    - Maintain security while providing necessary access

  2. Security
    - Only authenticated users can read user data
    - Evaluators get full read access to user information
    - Service role maintains bypass access

  3. Changes
    - Add policy for authenticated users to read users table
    - Ensure proper access control for customer management
*/

-- Add policy to allow authenticated users to read user data
CREATE POLICY "Authenticated users can read user data" ON users
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Add maintenance log entry
INSERT INTO maintenance_log (operation, details) 
VALUES (
  'add_user_read_policies',
  jsonb_build_object(
    'timestamp', NOW(),
    'description', 'Added RLS policies to allow authenticated evaluators to read user data',
    'security_level', 'MEDIUM',
    'affected_tables', jsonb_build_array('users'),
    'policies_added', jsonb_build_array(
      'Authenticated users can read user data'
    )
  )
);