/*
  # Fix Plaintext Password Storage Security Issue

  1. Purpose
    - Convert existing plaintext passwords to bcrypt hashes
    - Enable secure password storage using PostgreSQL's pgcrypto extension
    - Add audit logging for the security fix

  2. Security
    - Uses bcrypt with cost factor 12 (equivalent to bcryptjs salt rounds 12)
    - Only hashes passwords that aren't already hashed
    - Maintains data integrity during migration

  3. Changes
    - Updates all plaintext passwords in both users and profiles tables
    - Creates password hashing and verification functions
    - Adds maintenance log entry for audit purposes
    - Ensures proper permissions are granted
*/

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create function to hash passwords using bcrypt
CREATE OR REPLACE FUNCTION hash_password(plain_password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use bcrypt with cost factor 12 (equivalent to bcryptjs salt rounds 12)
  RETURN crypt(plain_password, gen_salt('bf', 12));
END;
$$;

-- Create function to verify passwords
CREATE OR REPLACE FUNCTION verify_password(plain_password text, hashed_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify password using crypt
  RETURN crypt(plain_password, hashed_password) = hashed_password;
END;
$$;

-- Update all existing passwords in users table that are not already hashed
-- Bcrypt hashes start with $2a$, $2b$, $2x$, or $2y$
UPDATE users 
SET password = hash_password(password)
WHERE password IS NOT NULL 
  AND password != ''
  AND NOT (password ~ '^\$2[abxy]\$[0-9]{2}\$');

-- Update all existing passwords in profiles table that are not already hashed
UPDATE profiles 
SET password = hash_password(password)
WHERE password IS NOT NULL 
  AND password != ''
  AND NOT (password ~ '^\$2[abxy]\$[0-9]{2}\$');

-- Add comments to track when this migration was run using DO blocks
DO $$
BEGIN
  EXECUTE 'COMMENT ON TABLE users IS ''Password hashing security fix applied on ' || NOW()::text || '''';
  EXECUTE 'COMMENT ON TABLE profiles IS ''Password hashing security fix applied on ' || NOW()::text || '''';
END
$$;

-- Create audit log entries for this security fix
INSERT INTO maintenance_log (operation, details) 
VALUES (
  'password_security_fix',
  jsonb_build_object(
    'timestamp', NOW(),
    'description', 'Fixed plaintext password storage by implementing bcrypt hashing',
    'users_affected', (SELECT COUNT(*) FROM users WHERE password IS NOT NULL),
    'profiles_affected', (SELECT COUNT(*) FROM profiles WHERE password IS NOT NULL),
    'security_level', 'CRITICAL_FIX'
  )
);

-- Grant execute permissions on password functions
GRANT EXECUTE ON FUNCTION hash_password(text) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_password(text, text) TO authenticated;