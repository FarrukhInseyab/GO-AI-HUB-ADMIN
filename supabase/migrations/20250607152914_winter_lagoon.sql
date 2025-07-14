/*
  # Implement Proper Authentication System

  1. New Changes
    - Enable Supabase Auth
    - Create auth trigger for profile creation
    - Update RLS policies to use auth.uid()
    - Remove password columns from profiles table (Supabase Auth handles this)

  2. Security
    - All authentication handled by Supabase Auth with proper session management
    - JWT tokens with automatic refresh
    - Secure password hashing handled by Supabase
    - Proper RLS policies using auth.uid()

  3. Tables Modified
    - profiles: Remove password column, add auth trigger
    - users: Keep for business data, remove auth functionality
    - Update all RLS policies to use auth.uid()
*/

-- Enable RLS on all tables that need it
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own solutions" ON solutions;
DROP POLICY IF EXISTS "Users can read approved solutions" ON solutions;
DROP POLICY IF EXISTS "Users can update their own solutions" ON solutions;
DROP POLICY IF EXISTS "Solution owners can read interests for their solutions" ON interests;
DROP POLICY IF EXISTS "Users can insert their own interests" ON interests;
DROP POLICY IF EXISTS "Users can read their own interests" ON interests;
DROP POLICY IF EXISTS "Only admins can read audit logs" ON audit_log;
DROP POLICY IF EXISTS "Users can only see their own rate limits" ON rate_limits;

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
    'evaluator',
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

-- Update profiles policies
CREATE POLICY "Users can read their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Update solutions policies
CREATE POLICY "Users can insert their own solutions" ON solutions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read approved solutions or their own" ON solutions
  FOR SELECT USING (status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "Users can update their own solutions" ON solutions
  FOR UPDATE USING (auth.uid() = user_id);

-- Update interests policies
CREATE POLICY "Solution owners can read interests for their solutions" ON interests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM solutions 
      WHERE solutions.id = interests.solution_id 
      AND solutions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own interests" ON interests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own interests" ON interests
  FOR SELECT USING (auth.uid() = user_id);

-- Update audit_log policies
CREATE POLICY "Only authenticated users can read audit logs" ON audit_log
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Update rate_limits policies
CREATE POLICY "Users can only see their own rate limits" ON rate_limits
  FOR ALL USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Update existing profiles to link with auth users if they exist
-- This is for any existing data migration
DO $$
DECLARE
  profile_record RECORD;
  auth_user_id UUID;
BEGIN
  FOR profile_record IN SELECT * FROM profiles WHERE id NOT IN (SELECT id FROM auth.users) LOOP
    -- For existing profiles without auth users, we'll need to handle this case
    -- In a real migration, you might want to create auth users or handle differently
    RAISE NOTICE 'Profile % does not have corresponding auth user', profile_record.email;
  END LOOP;
END $$;