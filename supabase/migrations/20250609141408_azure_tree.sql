/*
  # Fix RLS Policies for Direct Supabase Access

  1. Purpose
    - Update RLS policies to work with direct Supabase access
    - Ensure proper auth.uid() mapping to profile IDs
    - Allow evaluators to access all data while restricting regular users

  2. Security
    - Uses auth.uid() for proper RLS enforcement
    - Maps auth users to profile IDs through user metadata
    - Maintains data isolation between users

  3. Changes
    - Updates all RLS policies to use proper auth.uid() checks
    - Adds helper function to get profile ID from auth.uid()
    - Ensures evaluators have full access while users see only their data
*/

-- Create helper function to get profile ID from auth user
CREATE OR REPLACE FUNCTION get_profile_id_from_auth()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_uuid uuid;
BEGIN
  -- First try to get profile_id from user metadata
  SELECT (auth.jwt() -> 'user_metadata' ->> 'profile_id')::uuid INTO profile_uuid;
  
  -- If not found, try to match by email
  IF profile_uuid IS NULL THEN
    SELECT id INTO profile_uuid 
    FROM profiles 
    WHERE email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    );
  END IF;
  
  -- If still not found, use auth.uid() directly (for internal auth users)
  IF profile_uuid IS NULL THEN
    profile_uuid := auth.uid();
  END IF;
  
  RETURN profile_uuid;
END;
$$;

-- Create helper function to check if user is evaluator
CREATE OR REPLACE FUNCTION is_evaluator()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
  profile_uuid uuid;
BEGIN
  -- Get profile ID
  profile_uuid := get_profile_id_from_auth();
  
  -- Get role from profiles table
  SELECT role INTO user_role 
  FROM profiles 
  WHERE id = profile_uuid;
  
  RETURN user_role = 'evaluator';
END;
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read solutions" ON solutions;
DROP POLICY IF EXISTS "Users can insert their own solutions" ON solutions;
DROP POLICY IF EXISTS "Users can update solutions" ON solutions;
DROP POLICY IF EXISTS "Users can read interests" ON interests;
DROP POLICY IF EXISTS "Users can insert interests" ON interests;
DROP POLICY IF EXISTS "Users can update interests" ON interests;
DROP POLICY IF EXISTS "Authenticated users can read audit logs" ON audit_log;
DROP POLICY IF EXISTS "Users can access rate limits" ON rate_limits;

-- Profiles policies
CREATE POLICY "Authenticated users can read profiles" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    id = get_profile_id_from_auth()
  );

-- Solutions policies
CREATE POLICY "Users can read solutions" ON solutions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      -- Evaluators can see all solutions
      is_evaluator() OR
      -- Users can see their own solutions
      user_id = get_profile_id_from_auth() OR
      -- Approved solutions are visible to all
      status = 'approved'
    )
  );

CREATE POLICY "Users can insert their own solutions" ON solutions
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    user_id = get_profile_id_from_auth()
  );

CREATE POLICY "Users can update solutions" ON solutions
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      -- Evaluators can update any solution
      is_evaluator() OR
      -- Users can update their own solutions
      user_id = get_profile_id_from_auth()
    )
  );

-- Interests policies
CREATE POLICY "Users can read interests" ON interests
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      -- Evaluators can see all interests
      is_evaluator() OR
      -- Users can see their own interests
      user_id = get_profile_id_from_auth() OR
      -- Solution owners can see interests for their solutions
      EXISTS (
        SELECT 1 FROM solutions 
        WHERE solutions.id = interests.solution_id 
        AND solutions.user_id = get_profile_id_from_auth()
      )
    )
  );

CREATE POLICY "Users can insert interests" ON interests
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    user_id = get_profile_id_from_auth()
  );

CREATE POLICY "Users can update interests" ON interests
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      -- Evaluators can update any interest
      is_evaluator() OR
      -- Users can update their own interests
      user_id = get_profile_id_from_auth()
    )
  );

-- Audit log policies
CREATE POLICY "Authenticated users can read audit logs" ON audit_log
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Rate limits policies
CREATE POLICY "Users can access rate limits" ON rate_limits
  FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    user_id = get_profile_id_from_auth()
  );

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION get_profile_id_from_auth() TO authenticated;
GRANT EXECUTE ON FUNCTION is_evaluator() TO authenticated;

-- Add maintenance log entry
INSERT INTO maintenance_log (operation, details) 
VALUES (
  'fix_rls_policies_for_direct_access',
  jsonb_build_object(
    'timestamp', NOW(),
    'description', 'Fixed RLS policies for direct Supabase access with proper auth.uid() mapping',
    'security_level', 'HIGH'
  )
);