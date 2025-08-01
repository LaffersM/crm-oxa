import { createClient } from '@supabase/supabase-js';

// ==================== TYPES UNIFIÉS ====================

// Client unifié
export interface Client {
  id: string;
  nom: string;
  entreprise: string;
  siret?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  code_postal?: string;
  pays?: string;
  contact_principal?: string;
  notes?: string;
  commercial_id?: string;
  prospect_id?: string;
  created_at: string;
  updated_at: string;
}

// Article unifié
export interface Article {
  id: string;
  nom: string;
  description?: string;
  type: 'bien' | 'service' | 'IPE' | 'ELEC' | 'MATERIEL' | 'MAIN_OEUVRE';
  prix_achat: number;
  prix_vente: number;
  tva: number;
  stock?: number;
  seuil_alerte?: number;
  fournisseur?: string;
  reference_fournisseur?: string;
  unite?: string;
  fournisseur_id?: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

// Ligne de devis unifiée (format base de données)
export interface LigneDevis {
  id: string;
  devis_id: string;
  article_id?: string;
  description: string;
  zone?: string;
  quantite: number;
  prix_unitaire: number;
  prix_achat: number;
  tva: number;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  marge: number;
  ordre: number;
  remarques?: string;
  created_at: string;
  updated_at: string;
  article?: Article;
}

// Ligne de devis (format frontend)
export interface DevisLine {
  id: string;
  designation: string;
  description?: string;
  zone?: string;
  quantite: number;
  prix_unitaire: number;
  prix_achat?: number;
  tva?: number;
  prix_total: number;
  marge_brute?: number;
  remarques?: string;
  type?: 'materiel' | 'accessoire' | 'parametrage' | 'service';
  parent_id?: string;
  article_id?: string;
  ordre: number;
}

// Devis unifié (structure principale)
export interface Devis {
  id: string;
  numero: string;
  date_devis?: string;
  date_creation: string;
  date_validite?: string;
  objet?: string;
  client_id: string;
  description_operation?: string;
  notes?: string;
  statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire';
  type?: 'standard' | 'cee';
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  marge_totale: number;
  prime_cee: number;
  tva_taux?: number;
  modalites_paiement?: string;
  garantie?: string;
  penalites?: string;
  clause_juridique?: string;
  delais?: string;
  commercial_id?: string;
  created_at: string;
  updated_at: string;
  // Relations
  lignes?: LigneDevis[];
  client?: Client;
}

// Format OXA étendu (hérite de Devis)
export interface OXADevis extends Devis {
  lignes_data: any[]; // Format JSON stocké en base
  zone?: string;
  cee_kwh_cumac: number;
  cee_prix_unitaire: number;
  cee_montant_total: number;
  reste_a_payer_ht: number;
}

// Profil utilisateur
export interface Profile {
  id: string;
  user_id: string;
  email: string;
  nom: string;
  prenom: string;
  role: 'admin' | 'commercial' | 'manager';
  actif: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== CONFIGURATION ====================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validation de la configuration
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey && 
    supabaseUrl.startsWith('https://') && 
    supabaseAnonKey.length > 20);
};

// Client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'oxa-groupe-crm',
    },
  },
});

// ==================== UTILITAIRES ====================

// Fonction pour récupérer le profil utilisateur
export const getUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Erreur récupération profil:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erreur getUserProfile:', error);
    return null;
  }
};

// Convertisseur : Devis DB → Format Frontend
export const convertDevisToFrontend = (dbDevis: any): Devis => {
  return {
    ...dbDevis,
    date_creation: dbDevis.created_at,
    marge_totale: dbDevis.marge_totale || 0,
    prime_cee: dbDevis.cee_montant_total || 0,
    tva_taux: dbDevis.tva_taux || 20,
  };
};

// Convertisseur : Format Frontend → Devis DB
export const convertDevisToDatabase = (frontendDevis: any): any => {
  const dbData = { ...frontendDevis };
  
  // Nettoyer les champs frontend
  delete dbData.client;
  delete dbData.lignes;
  delete dbData.date_creation;
  delete dbData.marge_totale;
  delete dbData.prime_cee;
  
  // Mapper les champs
  if (frontendDevis.client?.id) {
    dbData.client_id = frontendDevis.client.id;
  }
  
  return dbData;
};

// Fonctions de compatibilité (pour éviter les erreurs d'import)
export const testSupabaseConnection = async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};