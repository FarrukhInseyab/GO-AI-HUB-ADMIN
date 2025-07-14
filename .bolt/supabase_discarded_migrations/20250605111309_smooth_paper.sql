/*
  # Add contact initiation details to interests table

  1. New Columns
    - comments: Text field to store contact initiation notes
    - profile_id: UUID to link to the profiles table
    - initiated_at: Timestamp to track when contact was initiated

  2. Security
    - No changes to RLS policies needed
    - Columns inherit existing table permissions
*/

DO $$ 
BEGIN
  -- Add comments column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'interests' AND column_name = 'comments'
  ) THEN
    ALTER TABLE interests ADD COLUMN comments text;
  END IF;

  -- Add profile_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'interests' AND column_name = 'profile_id'
  ) THEN
    ALTER TABLE interests ADD COLUMN profile_id uuid REFERENCES profiles(id);
  END IF;

  -- Add initiated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'interests' AND column_name = 'initiated_at'
  ) THEN
    ALTER TABLE interests ADD COLUMN initiated_at timestamptz;
  END IF;
END $$;