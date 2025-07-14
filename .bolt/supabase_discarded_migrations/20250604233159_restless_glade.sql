/*
  # Add status column to interests table

  1. Changes
    - Add 'status' column to interests table with text type
    - Set default value to 'New Interest'
    - Allow null values for backward compatibility
    - Add comment explaining the column purpose

  2. Security
    - No changes to RLS policies needed
    - Column inherits existing table permissions
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'interests' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE interests 
    ADD COLUMN status text DEFAULT 'New Interest';
  END IF;
END $$;