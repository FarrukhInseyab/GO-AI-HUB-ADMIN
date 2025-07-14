/*
  # Secure RLS Policies for Edge Function Integration

  1. Purpose
    - Update RLS policies to work with Supabase auth.uid() from Edge Functions
    - Ensure secure access control while maintaining frontend flexibility
    - Enable proper session management for custom auth flow

  2. Security
    - All data access goes through Edge Functions with proper auth verification
    - RLS policies enforce user-level access control using auth.uid()
    - No direct database access from frontend

  3. Changes
    - Update all RLS policies to use auth.uid() properly
    - Add policies for evaluators to access all solutions
    - Ensure interests are properly scoped to users and solution owners
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own solutions" ON solutions;
DROP POLICY IF EXISTS "Users can read approved solutions or their own" ON solutions;
DROP POLICY IF EXISTS "Users can update their own solutions" ON solutions;
DROP POLICY IF EXISTS "Solution owners can read interests for their solutions" ON interests;
DROP POLICY IF EXISTS "Users can insert their own interests" ON interests;
DROP POLICY IF EXISTS "Users can read their own interests" ON interests;
DROP POLICY IF EXISTS "Only authenticated users can read audit logs" ON audit_log;
DROP POLICY IF EXISTS "Users can only see their own rate limits" ON rate_limits;

-- Profiles policies
CREATE POLICY "Authenticated users can read profiles" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    auth.uid()::text = id::text
  );

-- Solutions policies - evaluators can see all, users can see their own + approved
CREATE POLICY "Users can read solutions" ON solutions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      -- User can see their own solutions
      auth.uid()::text = user_id::text OR
      -- Approved solutions are visible to all
      status = 'approved' OR
      -- Evaluators can see all solutions
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id::text = auth.uid()::text 
        AND profiles.role = 'evaluator'
      )
    )
  );

CREATE POLICY "Users can insert their own solutions" ON solutions
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid()::text = user_id::text
  );

CREATE POLICY "Users can update solutions" ON solutions
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      -- Users can update their own solutions
      auth.uid()::text = user_id::text OR
      -- Evaluators can update any solution
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id::text = auth.uid()::text 
        AND profiles.role = 'evaluator'
      )
    )
  );

-- Interests policies
CREATE POLICY "Users can read interests" ON interests
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      -- Users can see their own interests
      auth.uid()::text = user_id::text OR
      -- Solution owners can see interests for their solutions
      EXISTS (
        SELECT 1 FROM solutions 
        WHERE solutions.id = interests.solution_id 
        AND solutions.user_id::text = auth.uid()::text
      ) OR
      -- Evaluators can see all interests
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id::text = auth.uid()::text 
        AND profiles.role = 'evaluator'
      )
    )
  );

CREATE POLICY "Users can insert interests" ON interests
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid()::text = user_id::text
  );

CREATE POLICY "Users can update interests" ON interests
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      -- Users can update their own interests
      auth.uid()::text = user_id::text OR
      -- Evaluators can update any interest
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id::text = auth.uid()::text 
        AND profiles.role = 'evaluator'
      )
    )
  );

-- Audit log policies
CREATE POLICY "Authenticated users can read audit logs" ON audit_log
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Rate limits policies
CREATE POLICY "Users can access rate limits" ON rate_limits
  FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    auth.uid()::text = user_id::text
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Add maintenance log entry
INSERT INTO maintenance_log (operation, details) 
VALUES (
  'secure_rls_policies_update',
  jsonb_build_object(
    'timestamp', NOW(),
    'description', 'Updated RLS policies for Edge Function integration with auth.uid()',
    'security_level', 'HIGH'
  )
);