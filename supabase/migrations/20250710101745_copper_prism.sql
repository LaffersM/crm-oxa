/*
  # Add remarques column to lignes_devis table

  1. Changes
    - Add `remarques` column to `lignes_devis` table
    - Column type: text (nullable)
    - Default value: null

  2. Security
    - No changes to RLS policies needed as existing policies cover all columns
*/

-- Add remarques column to lignes_devis table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lignes_devis' AND column_name = 'remarques'
  ) THEN
    ALTER TABLE lignes_devis ADD COLUMN remarques text;
  END IF;
END $$;