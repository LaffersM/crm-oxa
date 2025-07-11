/*
  # Schéma complet OXA Groupe CRM

  1. Tables principales
    - `profiles` - Profils utilisateurs avec rôles
    - `prospects` - Gestion des prospects
    - `clients` - Clients convertis
    - `fournisseurs` - Catalogue fournisseurs
    - `articles` - Produits et services
    - `devis` - Devis et propositions
    - `lignes_devis` - Lignes de devis détaillées
    - `commandes` - Commandes validées
    - `factures` - Facturation
    - `cee_calculs` - Historique des calculs CEE
    - `activites` - Journal d'activité

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Politiques d'accès par rôle
    - Audit trail complet

  3. Fonctionnalités
    - Numérotation automatique
    - Calculs de marges
    - Traçabilité complète
*/

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  nom text NOT NULL,
  prenom text NOT NULL,
  role text NOT NULL DEFAULT 'commercial' CHECK (role IN ('admin', 'commercial')),
  actif boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des prospects
CREATE TABLE IF NOT EXISTS prospects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom text NOT NULL,
  entreprise text NOT NULL,
  email text,
  telephone text,
  statut text DEFAULT 'nouveau' CHECK (statut IN ('nouveau', 'contacte', 'qualifie', 'converti', 'perdu')),
  source text,
  notes text,
  commercial_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des clients
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom text NOT NULL,
  entreprise text NOT NULL,
  siret text,
  email text,
  telephone text,
  adresse text,
  ville text,
  code_postal text,
  pays text DEFAULT 'France',
  contact_principal text,
  notes text,
  commercial_id uuid REFERENCES profiles(id),
  prospect_id uuid REFERENCES prospects(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des fournisseurs
CREATE TABLE IF NOT EXISTS fournisseurs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom text NOT NULL,
  entreprise text NOT NULL,
  email text,
  telephone text,
  adresse text,
  ville text,
  code_postal text,
  pays text DEFAULT 'France',
  actif boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des articles
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('bien', 'service')),
  prix_achat decimal(10,2) DEFAULT 0,
  prix_vente decimal(10,2) NOT NULL,
  tva decimal(5,2) DEFAULT 20.00,
  unite text DEFAULT 'unité',
  fournisseur_id uuid REFERENCES fournisseurs(id),
  actif boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des devis
CREATE TABLE IF NOT EXISTS devis (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero text UNIQUE NOT NULL,
  client_id uuid REFERENCES clients(id) NOT NULL,
  statut text DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'envoye', 'accepte', 'refuse', 'expire')),
  date_creation timestamptz DEFAULT now(),
  date_validite timestamptz,
  total_ht decimal(10,2) DEFAULT 0,
  total_tva decimal(10,2) DEFAULT 0,
  total_ttc decimal(10,2) DEFAULT 0,
  marge_totale decimal(10,2) DEFAULT 0,
  prime_cee decimal(10,2) DEFAULT 0,
  notes text,
  commercial_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des lignes de devis
CREATE TABLE IF NOT EXISTS lignes_devis (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  devis_id uuid REFERENCES devis(id) ON DELETE CASCADE,
  article_id uuid REFERENCES articles(id),
  description text NOT NULL,
  quantite decimal(10,2) NOT NULL DEFAULT 1,
  prix_unitaire decimal(10,2) NOT NULL,
  prix_achat decimal(10,2) DEFAULT 0,
  tva decimal(5,2) DEFAULT 20.00,
  total_ht decimal(10,2) NOT NULL,
  total_tva decimal(10,2) NOT NULL,
  total_ttc decimal(10,2) NOT NULL,
  marge decimal(10,2) DEFAULT 0,
  ordre integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Table des commandes
CREATE TABLE IF NOT EXISTS commandes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero text UNIQUE NOT NULL,
  devis_id uuid REFERENCES devis(id) NOT NULL,
  client_id uuid REFERENCES clients(id) NOT NULL,
  statut text DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'expediee', 'livree', 'annulee')),
  date_commande timestamptz DEFAULT now(),
  date_livraison_prevue timestamptz,
  date_livraison timestamptz,
  total_ht decimal(10,2) NOT NULL,
  total_tva decimal(10,2) NOT NULL,
  total_ttc decimal(10,2) NOT NULL,
  notes text,
  commercial_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des factures
CREATE TABLE IF NOT EXISTS factures (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero text UNIQUE NOT NULL,
  commande_id uuid REFERENCES commandes(id),
  client_id uuid REFERENCES clients(id) NOT NULL,
  statut text DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'envoyee', 'payee', 'en_retard', 'annulee')),
  date_facture timestamptz DEFAULT now(),
  date_echeance timestamptz,
  date_paiement timestamptz,
  total_ht decimal(10,2) NOT NULL,
  total_tva decimal(10,2) NOT NULL,
  total_ttc decimal(10,2) NOT NULL,
  notes text,
  commercial_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des calculs CEE
CREATE TABLE IF NOT EXISTS cee_calculs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  devis_id uuid REFERENCES devis(id),
  puissance decimal(10,2) NOT NULL,
  coefficient_activite decimal(5,2) NOT NULL,
  duree_engagement decimal(5,2) NOT NULL,
  kwh_cumac decimal(15,2) NOT NULL,
  tarif_kwh decimal(8,6) DEFAULT 0.002,
  prime_estimee decimal(10,2) NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Table des activités (journal)
CREATE TABLE IF NOT EXISTS activites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type text NOT NULL,
  description text NOT NULL,
  entite_type text NOT NULL,
  entite_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  donnees jsonb,
  created_at timestamptz DEFAULT now()
);

-- Fonctions pour numérotation automatique
CREATE OR REPLACE FUNCTION generate_devis_numero()
RETURNS text AS $$
DECLARE
  next_num integer;
  year_prefix text;
BEGIN
  year_prefix := 'DEV' || to_char(now(), 'YY');
  
  SELECT COALESCE(MAX(CAST(RIGHT(numero, 4) AS integer)), 0) + 1
  INTO next_num
  FROM devis
  WHERE numero LIKE year_prefix || '%';
  
  RETURN year_prefix || LPAD(next_num::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_commande_numero()
RETURNS text AS $$
DECLARE
  next_num integer;
  year_prefix text;
BEGIN
  year_prefix := 'CMD' || to_char(now(), 'YY');
  
  SELECT COALESCE(MAX(CAST(RIGHT(numero, 4) AS integer)), 0) + 1
  INTO next_num
  FROM commandes
  WHERE numero LIKE year_prefix || '%';
  
  RETURN year_prefix || LPAD(next_num::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_facture_numero()
RETURNS text AS $$
DECLARE
  next_num integer;
  year_prefix text;
BEGIN
  year_prefix := 'FAC' || to_char(now(), 'YY');
  
  SELECT COALESCE(MAX(CAST(RIGHT(numero, 4) AS integer)), 0) + 1
  INTO next_num
  FROM factures
  WHERE numero LIKE year_prefix || '%';
  
  RETURN year_prefix || LPAD(next_num::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Triggers pour numérotation automatique
CREATE OR REPLACE FUNCTION set_devis_numero()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := generate_devis_numero();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER devis_numero_trigger
  BEFORE INSERT ON devis
  FOR EACH ROW
  EXECUTE FUNCTION set_devis_numero();

CREATE OR REPLACE FUNCTION set_commande_numero()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := generate_commande_numero();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER commande_numero_trigger
  BEFORE INSERT ON commandes
  FOR EACH ROW
  EXECUTE FUNCTION set_commande_numero();

CREATE OR REPLACE FUNCTION set_facture_numero()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero IS NULL OR NEW.numero = '' THEN
    NEW.numero := generate_facture_numero();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER facture_numero_trigger
  BEFORE INSERT ON factures
  FOR EACH ROW
  EXECUTE FUNCTION set_facture_numero();

-- Fonction pour calculer les totaux de devis
CREATE OR REPLACE FUNCTION update_devis_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE devis SET
    total_ht = (
      SELECT COALESCE(SUM(total_ht), 0)
      FROM lignes_devis
      WHERE devis_id = COALESCE(NEW.devis_id, OLD.devis_id)
    ),
    total_tva = (
      SELECT COALESCE(SUM(total_tva), 0)
      FROM lignes_devis
      WHERE devis_id = COALESCE(NEW.devis_id, OLD.devis_id)
    ),
    total_ttc = (
      SELECT COALESCE(SUM(total_ttc), 0)
      FROM lignes_devis
      WHERE devis_id = COALESCE(NEW.devis_id, OLD.devis_id)
    ),
    marge_totale = (
      SELECT COALESCE(SUM(marge), 0)
      FROM lignes_devis
      WHERE devis_id = COALESCE(NEW.devis_id, OLD.devis_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.devis_id, OLD.devis_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_devis_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON lignes_devis
  FOR EACH ROW
  EXECUTE FUNCTION update_devis_totals();

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE fournisseurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE lignes_devis ENABLE ROW LEVEL SECURITY;
ALTER TABLE commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE cee_calculs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activites ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can read all prospects"
  ON prospects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage prospects"
  ON prospects FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can read all clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage clients"
  ON clients FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can read all fournisseurs"
  ON fournisseurs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage fournisseurs"
  ON fournisseurs FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can read all articles"
  ON articles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage articles"
  ON articles FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can read all devis"
  ON devis FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage devis"
  ON devis FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can read all lignes_devis"
  ON lignes_devis FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage lignes_devis"
  ON lignes_devis FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can read all commandes"
  ON commandes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage commandes"
  ON commandes FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can read all factures"
  ON factures FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage factures"
  ON factures FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can read all cee_calculs"
  ON cee_calculs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage cee_calculs"
  ON cee_calculs FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can read all activities"
  ON activites FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create activities"
  ON activites FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());