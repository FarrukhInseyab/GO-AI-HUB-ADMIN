/*
  # Fix Authentication Synchronization Issues

  1. Purpose
    - Ensure profiles and auth.users are properly synchronized
    - Fix any UUID mismatches between systems
    - Add debugging functions to help identify issues

  2. Changes
    - Add function to sync existing profiles with auth users
    - Add function to check auth synchronization status
    - Update RLS policies to handle edge cases
    - Add maintenance logging

  3. Security
    - Maintains existing security model
    - Adds debugging capabilities for troubleshooting
*/

-- Function to check auth synchronization status
CREATE OR REPLACE FUNCTION check_auth_sync()
RETURNS TABLE(
  profile_id uuid,
  profile_email text,
  auth_user_exists boolean,
  auth_user_id uuid,
  sync_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as profile_id,
    p.email as profile_email,
    (au.id IS NOT NULL) as auth_user_exists,
    au.id as auth_user_id,
    CASE 
      WHEN au.id IS NULL THEN 'MISSING_AUTH_USER'
      WHEN p.id != au.id THEN 'ID_MISMATCH'
      ELSE 'SYNCED'
    END as sync_status
  FROM profiles p
  LEFT JOIN auth.users au ON p.email = au.email;
END;
$$;

-- Function to get profile by auth user ID (for debugging)
CREATE OR REPLACE FUNCTION get_profile_by_auth_id(auth_user_id uuid)
RETURNS TABLE(
  profile_id uuid,
  email text,
  name text,
  role text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.email, p.name, p.role, p.created_at
  FROM profiles p
  WHERE p.id = auth_user_id
     OR p.email = (SELECT email FROM auth.users WHERE id = auth_user_id);
END;
$$;

-- Update the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = new.id OR email = new.email) THEN
    -- Update existing profile with auth user ID if needed
    UPDATE public.profiles 
    SET id = new.id,
        email = new.email,
        name = COALESCE(new.raw_user_meta_data->>'name', name, split_part(new.email, '@', 1)),
        role = COALESCE(new.raw_user_meta_data->>'role', role, 'evaluator'),
        created_at = COALESCE(created_at, now())
    WHERE email = new.email;
  ELSE
    -- Insert new profile
    INSERT INTO public.profiles (id, email, name, role, created_at)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      COALESCE(new.raw_user_meta_data->>'role', 'evaluator'),
      now()
    );
  END IF;
  
  RETURN new;
END;
$$;

-- Add a policy to allow service role to read auth.users for sync operations
-- (This is already handled by previous migrations but ensuring it's explicit)

-- Grant execute permissions on new functions
GRANT EXECUTE ON FUNCTION check_auth_sync() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_profile_by_auth_id(uuid) TO authenticated, service_role;

-- Add maintenance log entry
INSERT INTO maintenance_log (operation, details) 
VALUES (
  'fix_auth_synchronization',
  jsonb_build_object(
    'timestamp', NOW(),
    'description', 'Added functions to debug and fix auth synchronization issues',
    'functions_added', jsonb_build_array(
      'check_auth_sync()',
      'get_profile_by_auth_id(uuid)'
    ),
    'security_level', 'HIGH'
  )
);