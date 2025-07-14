/*
  # Grant Service Role Permissions for Edge Functions

  1. Purpose
    - Grant necessary permissions for Edge Functions to access auth.users
    - Enable service role to create and manage auth users
    - Ensure proper RLS bypass for service operations

  2. Security
    - Service role gets elevated permissions for auth operations
    - Maintains security through proper function isolation
    - Enables hybrid auth system functionality

  3. Changes
    - Grant service role access to auth schema
    - Enable auth user management from Edge Functions
    - Add proper permissions for token generation
*/

-- Grant service role access to auth schema and functions
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO service_role;

-- Grant service role access to public schema for profile management
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Enable service role to bypass RLS when needed
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE solutions FORCE ROW LEVEL SECURITY;
ALTER TABLE interests FORCE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

-- Create policy to allow service role full access
CREATE POLICY "Service role bypass" ON profiles
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role bypass" ON solutions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role bypass" ON interests
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role bypass" ON users
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role bypass" ON audit_log
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role bypass" ON rate_limits
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role bypass" ON maintenance_log
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant execute permissions on all functions to service role
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO service_role;

-- Add maintenance log entry
INSERT INTO maintenance_log (operation, details) 
VALUES (
  'grant_service_role_permissions',
  jsonb_build_object(
    'timestamp', NOW(),
    'description', 'Granted service role permissions for Edge Function auth operations',
    'security_level', 'CRITICAL'
  )
);