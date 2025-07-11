/*
  # Add missing columns to devis table

  1. New Columns
    - `cee_kwh_cumac` (numeric) - kWh cumac for CEE calculations
    - `cee_prix_unitaire` (numeric) - Unit price for CEE
    - `cee_montant_total` (numeric) - Total CEE amount
    - `reste_a_payer_ht` (numeric) - Remaining amount to pay excluding tax
    - `remarques` (text) - Additional remarks
    - `type` (text) - Type of devis (IPE, ELEC, MATERIEL, MAIN_OEUVRE)
    - `modalites_paiement` (text) - Payment terms
    - `garantie` (text) - Warranty information
    - `penalites` (text) - Penalty clauses
    - `clause_juridique` (text) - Legal clauses
    - `lignes_data` (jsonb) - Line items data
    - `date_devis` (date) - Quote date
    - `objet` (text) - Quote subject
    - `description_operation` (text) - Operation description
    - `delais` (text) - Delivery timeframes
    - `tva_taux` (numeric) - VAT rate

  2. Security
    - No changes to existing RLS policies
*/

-- Add missing columns to devis table
DO $$
BEGIN
  -- Add cee_kwh_cumac column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devis' AND column_name = 'cee_kwh_cumac'
  ) THEN
    ALTER TABLE devis ADD COLUMN cee_kwh_cumac numeric(15,2) DEFAULT 0;
  END IF;

  -- Add cee_prix_unitaire column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devis' AND column_name = 'cee_prix_unitaire'
  ) THEN
    ALTER TABLE devis ADD COLUMN cee_prix_unitaire numeric(8,6) DEFAULT 0.002;
  END IF;

  -- Add cee_montant_total column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devis' AND column_name = 'cee_montant_total'
  ) THEN
    ALTER TABLE devis ADD COLUMN cee_montant_total numeric(10,2) DEFAULT 0;
  END IF;

  -- Add reste_a_payer_ht column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devis' AND column_name = 'reste_a_payer_ht'
  ) THEN
    ALTER TABLE devis ADD COLUMN reste_a_payer_ht numeric(10,2) DEFAULT 0;
  END IF;

  -- Add remarques column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devis' AND column_name = 'remarques'
  ) THEN
    ALTER TABLE devis ADD COLUMN remarques text;
  END IF;

  -- Add type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devis' AND column_name = 'type'
  ) THEN
    ALTER TABLE devis ADD COLUMN type text DEFAULT 'MATERIEL';
  END IF;

  -- Add modalites_paiement column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devis' AND column_name = 'modalites_paiement'
  ) THEN
    ALTER TABLE devis ADD COLUMN modalites_paiement text DEFAULT '30% à la commande, 70% à la livraison';
  END IF;

  -- Add garantie column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devis' AND column_name = 'garantie'
  ) THEN
    ALTER TABLE devis ADD COLUMN garantie text DEFAULT '2 ans pièces et main d''œuvre';
  END IF;

  -- Add penalites column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devis' AND column_name = 'penalites'
  ) THEN
    ALTER TABLE devis ADD COLUMN penalites text DEFAULT 'Pénalités de retard : 0,1% par jour de retard';
  END IF;

  -- Add clause_juridique column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devis' AND column_name = 'clause_juridique'
  ) THEN
    ALTER TABLE devis ADD COLUMN clause_juridique text DEFAULT 'Tout litige relève de la compétence du Tribunal de Commerce de Paris';
  END IF;

  -- Add lignes_data column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devis' AND column_name = 'lignes_data'
  ) THEN
    ALTER TABLE devis ADD COLUMN lignes_data jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Add date_devis column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devis' AND column_name = 'date_devis'
  ) THEN
    ALTER TABLE devis ADD COLUMN date_devis date DEFAULT CURRENT_DATE;
  END IF;

  -- Add objet column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devis' AND column_name = 'objet'
  ) THEN
    ALTER TABLE devis ADD COLUMN objet text DEFAULT 'Devis commercial';
  END IF;

  -- Add description_operation column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devis' AND column_name = 'description_operation'
  ) THEN
    ALTER TABLE devis ADD COLUMN description_operation text;
  END IF;

  -- Add delais column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devis' AND column_name = 'delais'
  ) THEN
    ALTER TABLE devis ADD COLUMN delais text DEFAULT '4 à 6 semaines après validation du devis';
  END IF;

  -- Add tva_taux column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devis' AND column_name = 'tva_taux'
  ) THEN
    ALTER TABLE devis ADD COLUMN tva_taux numeric(5,2) DEFAULT 20.00;
  END IF;
END $$;

-- Add constraint for type column to ensure valid values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'devis' AND constraint_name = 'devis_type_check'
  ) THEN
    ALTER TABLE devis ADD CONSTRAINT devis_type_check 
    CHECK (type = ANY (ARRAY['IPE'::text, 'ELEC'::text, 'MATERIEL'::text, 'MAIN_OEUVRE'::text]));
  END IF;
END $$;