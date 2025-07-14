/*
  # Password Hashing Migration

  1. Purpose
    - Convert existing plaintext passwords to bcrypt hashes
    - Enable secure password storage using PostgreSQL's pgcrypto extension
    - Add audit logging for the migration

  2. Security
    - Uses bcrypt with cost factor 12 (equivalent to bcryptjs salt rounds 12)
    - Only hashes passwords that aren't already hashed
    - Maintains data integrity during migration

  3. Changes
    - Updates all plaintext passwords in profiles table
    - Adds maintenance log entry for audit purposes
    - Ensures proper permissions are granted
*/

-- Enable pgcrypto extension for password hashing (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a function to hash passwords using crypt (bcrypt)
CREATE OR REPLACE FUNCTION hash_password_bcrypt(plain_password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use bcrypt with cost factor 12 (equivalent to bcryptjs salt rounds 12)
  RETURN crypt(plain_password, gen_salt('bf', 12));
END;
$$;

-- Update all existing passwords that are not already hashed
-- Bcrypt hashes start with $2a$, $2b$, $2x$, or $2y$
UPDATE profiles 
SET password = hash_password_bcrypt(password)
WHERE password IS NOT NULL 
  AND password != ''
  AND NOT (password ~ '^\$2[abxy]\$[0-9]{2}\$');

-- Add a comment to track when this migration was run
DO $$
BEGIN
  EXECUTE 'COMMENT ON TABLE profiles IS ''Password hashing migration completed on ' || NOW()::text || '''';
END
$$;

-- Create an audit log entry for this migration
INSERT INTO maintenance_log (operation, details) 
VALUES (
  'password_hashing_migration',
  jsonb_build_object(
    'timestamp', NOW(),
    'description', 'Converted plaintext passwords to bcrypt hashes',
    'affected_rows', (SELECT COUNT(*) FROM profiles WHERE password IS NOT NULL)
  )
);

-- Drop the temporary function
DROP FUNCTION hash_password_bcrypt(text);

-- Grant necessary permissions
GRANT SELECT, UPDATE ON profiles TO authenticated;