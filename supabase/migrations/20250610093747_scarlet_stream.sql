/*
  # Migrate to Users Table Structure

  1. Purpose
    - Update system to use users table instead of deleted profiles table
    - Set default role as 'Evaluator' for new signups
    - Update all RLS policies to work with users table structure

  2. Changes
    - Update handle_new_user() function to create records in users table
    - Update helper functions to work with users.user_id → auth.uid() mapping
    - Update all RLS policies to use users table
    - Maintain proper role-based access control

  3. Security
    - Evaluators can see all data
    - Users can only see their own data
    - Public can see approved solutions
*/

-- Update function to handle new user creation in users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM public.users WHERE user_id = new.id OR email = new.email) THEN
    -- Update existing user with auth user ID if needed
    UPDATE public.users 
    SET user_id = new.id,
        email = new.email,
        contact_name = COALESCE(new.raw_user_meta_data->>'name', contact_name, split_part(new.email, '@', 1)),
        role = COALESCE(new.raw_user_meta_data->>'role', role, 'Evaluator'),
        country = COALESCE(new.raw_user_meta_data->>'country', country, 'Saudi Arabia'),
        updated_at = now()
    WHERE email = new.email;
  ELSE
    -- Insert new user with Evaluator role by default
    INSERT INTO public.users (user_id, email, contact_name, company_name, country, role, created_at, updated_at)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      COALESCE(new.raw_user_meta_data->>'company_name', 'GO AI HUB'),
      COALESCE(new.raw_user_meta_data->>'country', 'Saudi Arabia'),
      'Evaluator',
      now(),
      now()
    );
  END IF;
  
  RETURN new;
END;
$$;

-- Update helper function to get user ID from auth
CREATE OR REPLACE FUNCTION get_user_id_from_auth()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return the internal users.id based on auth.uid() mapping to users.user_id
  RETURN (SELECT id FROM users WHERE user_id = auth.uid());
END;
$$;

-- Update is_evaluator function to use users table
CREATE OR REPLACE FUNCTION is_evaluator()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get role from users table using auth.uid() mapped to user_id
  SELECT role INTO user_role 
  FROM users 
  WHERE user_id = auth.uid();
  
  RETURN user_role = 'Evaluator';
END;
$$;

-- Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Evaluators can read all profiles" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can read user data" ON users;
DROP POLICY IF EXISTS "Service role bypass users" ON users;

DROP POLICY IF EXISTS "Users can read solutions" ON solutions;
DROP POLICY IF EXISTS "Users can insert their own solutions" ON solutions;
DROP POLICY IF EXISTS "Users can update solutions" ON solutions;
DROP POLICY IF EXISTS "Users can read accessible solutions" ON solutions;
DROP POLICY IF EXISTS "Users can update accessible solutions" ON solutions;
DROP POLICY IF EXISTS "Users can delete accessible solutions" ON solutions;
DROP POLICY IF EXISTS "Public can read approved solutions" ON solutions;
DROP POLICY IF EXISTS "Service role bypass solutions" ON solutions;

DROP POLICY IF EXISTS "Users can read interests" ON interests;
DROP POLICY IF EXISTS "Users can insert interests" ON interests;
DROP POLICY IF EXISTS "Users can update interests" ON interests;
DROP POLICY IF EXISTS "Users can read accessible interests" ON interests;
DROP POLICY IF EXISTS "Users can update accessible interests" ON interests;
DROP POLICY IF EXISTS "Users can delete accessible interests" ON interests;
DROP POLICY IF EXISTS "Public can read interests for approved solutions" ON interests;
DROP POLICY IF EXISTS "Service role bypass interests" ON interests;

-- Users table policies
CREATE POLICY "Evaluators can read all profiles" ON users
  FOR SELECT USING (is_evaluator());

CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Solutions policies updated to use users table
CREATE POLICY "Users can read accessible solutions" ON solutions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      -- Evaluators can see all solutions
      is_evaluator() OR
      -- Users can see their own solutions
      user_id = get_user_id_from_auth() OR
      -- Approved solutions are visible to all
      (status = 'approved' AND COALESCE(tech_approval_status, '') = 'approved' AND COALESCE(business_approval_status, '') = 'approved')
    )
  );

CREATE POLICY "Users can insert their own solutions" ON solutions
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    user_id = get_user_id_from_auth()
  );

CREATE POLICY "Users can update accessible solutions" ON solutions
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      -- Evaluators can update any solution
      is_evaluator() OR
      -- Users can update their own solutions
      user_id = get_user_id_from_auth()
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      -- Evaluators can update any solution
      is_evaluator() OR
      -- Users can update their own solutions
      user_id = get_user_id_from_auth()
    )
  );

CREATE POLICY "Users can delete accessible solutions" ON solutions
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND (
      -- Users can delete their own solutions
      user_id = get_user_id_from_auth() OR
      -- Evaluators can delete any solution
      is_evaluator()
    )
  );

-- Interests policies updated to use users table
CREATE POLICY "Users can read accessible interests" ON interests
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      -- Evaluators can see all interests
      is_evaluator() OR
      -- Users can see their own interests
      user_id = get_user_id_from_auth() OR
      -- Solution owners can see interests for their solutions
      EXISTS (
        SELECT 1 FROM solutions 
        WHERE solutions.id = interests.solution_id 
        AND solutions.user_id = get_user_id_from_auth()
      )
    )
  );

CREATE POLICY "Users can insert interests" ON interests
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    user_id = get_user_id_from_auth()
  );

CREATE POLICY "Users can update accessible interests" ON interests
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      -- Evaluators can update any interest
      is_evaluator() OR
      -- Users can update their own interests
      user_id = get_user_id_from_auth()
    )
  );

CREATE POLICY "Users can delete accessible interests" ON interests
  FOR DELETE USING (
    auth.uid() IS NOT NULL AND (
      -- Users can delete their own interests
      user_id = get_user_id_from_auth() OR
      -- Evaluators can delete any interest
      is_evaluator()
    )
  );

-- Public can read approved solutions
CREATE POLICY "Public can read approved solutions" ON solutions
  FOR SELECT TO public
  USING (
    status = 'approved' AND 
    COALESCE(tech_approval_status, '') = 'approved' AND 
    COALESCE(business_approval_status, '') = 'approved'
  );

-- Public can read interests for approved solutions
CREATE POLICY "Public can read interests for approved solutions" ON interests
  FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM solutions 
      WHERE solutions.id = interests.solution_id 
      AND solutions.status = 'approved' 
      AND COALESCE(solutions.tech_approval_status, '') = 'approved' 
      AND COALESCE(solutions.business_approval_status, '') = 'approved'
    )
  );

-- Service role bypass policies
CREATE POLICY "Service role bypass users" ON users
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role bypass solutions" ON solutions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role bypass interests" ON interests
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION get_user_id_from_auth() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION is_evaluator() TO authenticated, service_role;

-- Add maintenance log entry
INSERT INTO maintenance_log (operation, details) 
VALUES (
  'migrate_to_users_table',
  jsonb_build_object(
    'timestamp', NOW(),
    'description', 'Migrated from profiles to users table with role-based access',
    'changes', jsonb_build_array(
      'Updated handle_new_user() to use users table',
      'Set default role as Evaluator for new signups',
      'Updated all RLS policies to use users table',
      'Maintained users.user_id as auth reference'
    ),
    'security_level', 'HIGH'
  )
);