/*
  # Add status column to interests table

  1. Changes
    - Add status column to interests table with default value 'New Interest'
    - Update existing rows to have the default status
  
  2. Security
    - No changes to RLS policies
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

    -- Update existing rows to have the default status
    UPDATE interests 
    SET status = 'New Interest' 
    WHERE status IS NULL;
  END IF;
END $$;