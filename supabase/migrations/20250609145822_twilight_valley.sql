/*
  # Pure Supabase Auth Integration

  1. Purpose
    - Remove custom auth edge function dependency
    - Use pure Supabase Auth with profile sync
    - Keep users and profiles tables for business logic
    - Create trigger to sync auth users with profiles

  2. Changes
    - Create trigger for automatic profile creation on auth signup
    - Update RLS policies to work with Supabase Auth
    - Remove password columns (handled by Supabase Auth)
    - Add profile sync function

  3. Security
    - All authentication handled by Supabase Auth
    - Profiles table synced automatically
    - Proper RLS policies using auth.uid()
*/

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, created_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'evaluator'),
    now()
  );
  RETURN new;
END;
$$;

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Remove password column from profiles (Supabase Auth handles this)
ALTER TABLE profiles DROP COLUMN IF EXISTS password;

-- Update helper functions to work with direct auth.uid()
CREATE OR REPLACE FUNCTION get_profile_id_from_auth()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- With pure Supabase Auth, auth.uid() IS the profile ID
  RETURN auth.uid();
END;
$$;

-- Update is_evaluator function
CREATE OR REPLACE FUNCTION is_evaluator()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get role from profiles table using auth.uid() directly
  SELECT role INTO user_role 
  FROM profiles 
  WHERE id = auth.uid();
  
  RETURN user_role = 'evaluator';
END;
$$;

-- Drop existing policies and recreate with simplified logic
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read solutions" ON solutions;
DROP POLICY IF EXISTS "Users can insert their own solutions" ON solutions;
DROP POLICY IF EXISTS "Users can update solutions" ON solutions;
DROP POLICY IF EXISTS "Users can read interests" ON interests;
DROP POLICY IF EXISTS "Users can insert interests" ON interests;
DROP POLICY IF EXISTS "Users can update interests" ON interests;

-- Profiles policies
CREATE POLICY "Authenticated users can read profiles" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Solutions policies
CREATE POLICY "Users can read solutions" ON solutions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      -- Evaluators can see all solutions
      is_evaluator() OR
      -- Users can see their own solutions
      user_id = auth.uid() OR
      -- Approved solutions are visible to all
      status = 'approved'
    )
  );

CREATE POLICY "Users can insert their own solutions" ON solutions
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    user_id = auth.uid()
  );

CREATE POLICY "Users can update solutions" ON solutions
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      -- Evaluators can update any solution
      is_evaluator() OR
      -- Users can update their own solutions
      user_id = auth.uid()
    )
  );

-- Interests policies
CREATE POLICY "Users can read interests" ON interests
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      -- Evaluators can see all interests
      is_evaluator() OR
      -- Users can see their own interests
      user_id = auth.uid() OR
      -- Solution owners can see interests for their solutions
      EXISTS (
        SELECT 1 FROM solutions 
        WHERE solutions.id = interests.solution_id 
        AND solutions.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert interests" ON interests
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    user_id = auth.uid()
  );

CREATE POLICY "Users can update interests" ON interests
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      -- Evaluators can update any interest
      is_evaluator() OR
      -- Users can update their own interests
      user_id = auth.uid()
    )
  );

-- Add maintenance log entry
INSERT INTO maintenance_log (operation, details) 
VALUES (
  'pure_supabase_auth_migration',
  jsonb_build_object(
    'timestamp', NOW(),
    'description', 'Migrated to pure Supabase Auth with profile sync',
    'security_level', 'HIGH',
    'changes', jsonb_build_array(
      'Removed custom auth edge function dependency',
      'Added automatic profile creation trigger',
      'Simplified RLS policies to use auth.uid() directly',
      'Removed password columns from profiles table'
    )
  )
);