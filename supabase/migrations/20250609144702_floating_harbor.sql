/*
  # Remove Password Encryption

  1. Purpose
    - Remove bcrypt password hashing and store passwords in plain text
    - Simplify authentication flow while keeping Edge Function integration
    - Remove password hashing functions

  2. Changes
    - Drop password hashing functions
    - Add maintenance log entry for the change

  3. Security Note
    - This removes password encryption for development purposes
    - NOT recommended for production use
*/

-- Drop password hashing functions
DROP FUNCTION IF EXISTS hash_password(text);
DROP FUNCTION IF EXISTS verify_password(text, text);

-- Add maintenance log entry
INSERT INTO maintenance_log (operation, details) 
VALUES (
  'remove_password_encryption',
  jsonb_build_object(
    'timestamp', NOW(),
    'description', 'Removed password encryption - passwords now stored in plain text',
    'security_level', 'WARNING',
    'note', 'This is for development purposes only - not recommended for production'
  )
);