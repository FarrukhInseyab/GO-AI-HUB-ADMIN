/*
  # Add evaluator columns to solutions table

  1. New Columns
    - technical_eval_id: UUID to track who performed the technical evaluation
    - business_eval_id: UUID to track who performed the business evaluation
    - Both columns reference the profiles table

  2. Changes
    - Add foreign key constraints to profiles table
    - Make columns nullable for backward compatibility
*/

DO $$ 
BEGIN
  -- Add technical_eval_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solutions' AND column_name = 'technical_eval_id'
  ) THEN
    ALTER TABLE solutions ADD COLUMN technical_eval_id uuid REFERENCES profiles(id);
  END IF;

  -- Add business_eval_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'solutions' AND column_name = 'business_eval_id'
  ) THEN
    ALTER TABLE solutions ADD COLUMN business_eval_id uuid REFERENCES profiles(id);
  END IF;
END $$;