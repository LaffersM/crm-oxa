/*
  # Add zone column to lignes_devis table

  1. Changes
    - Add `zone` column to `lignes_devis` table
    - Set default value to empty string for consistency
    - Allow null values for backward compatibility

  2. Notes
    - This column is used to group line items by zones in devis
    - Existing records will have null zone values initially
*/

-- Add zone column to lignes_devis table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lignes_devis' AND column_name = 'zone'
  ) THEN
    ALTER TABLE lignes_devis ADD COLUMN zone text DEFAULT '';
  END IF;
END $$;