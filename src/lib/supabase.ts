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

// Ligne de devis (format frontend pour les générateurs)
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

// Interface de base pour tous les devis
export interface BaseDevis {
  id: string;
  numero: string;
  date_devis: string;
  date_creation: string;
  date_validite?: string;
  objet: string;
  client_id: string;
  description_operation?: string;
  notes?: string;
  remarques?: string;
  statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire';
  type?: 'standard' | 'cee' | 'IPE' | 'ELEC' | 'MATERIEL' | 'MAIN_OEUVRE';
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  tva_taux?: number;
  marge_totale: number;
  modalites_paiement?: string;
  garantie?: string;
  penalites?: string;
  clause_juridique?: string;
  delais?: string;
  commercial_id?: string;
  created_at: string;
  updated_at: string;
  // Relations
  client?: Client;
}

// Devis standard (hérite de BaseDevis)
export interface Devis extends BaseDevis {
  lignes?: LigneDevis[];
  prime_cee: number; // Compatible avec l'ancien code
}

// Devis OXA/CEE (hérite de BaseDevis avec extensions CEE)
export interface OXADevis extends BaseDevis {
  // Format base de données
  lignes_data: any[];
  
  // Format frontend (pour les générateurs)
  lignes?: DevisLine[];
  
  // Zone pour compatibilité
  zone?: string;
  
  // Données CEE étendues
  cee_kwh_cumac: number;
  cee_prix_unitaire: number;
  cee_montant_total: number;
  reste_a_payer_ht: number;
  prime_cee: number; // Alias pour cee_montant_total
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

// Types pour les calculs CEE
export interface CEECalculation {
  profil_fonctionnement: '1x8h' | '2x8h' | '3x8h_weekend_off' | '3x8h_24_7' | 'continu_24_7';
  puissance_nominale: number;
  duree_contrat: number;
  coefficient_activite: number;
  facteur_f: number;
  kwh_cumac: number;
  tarif_kwh: number;
  prime_estimee: number;
  operateur_nom: string;
}

export interface CEEIntegration {
  mode: 'deduction' | 'information';
  afficher_bloc: boolean;
}

// Types pour les zones modulaires (générateur CEE)
export interface DevisZone {
  id: string;
  nom: string;
  lignes: DevisLine[];
  visible_pdf: boolean;
  ordre: number;
  collapsed?: boolean;
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

// Convertisseur : OXADevis → Devis standard (pour compatibilité)
export const oxaDevisToDevis = (oxaDevis: OXADevis): Devis => {
  return {
    ...oxaDevis,
    lignes: oxaDevis.lignes?.map(line => ({
      id: line.id,
      devis_id: oxaDevis.id,
      article_id: line.article_id,
      description: line.designation,
      zone: line.zone,
      quantite: line.quantite,
      prix_unitaire: line.prix_unitaire,
      prix_achat: line.prix_achat || 0,
      tva: line.tva || 20,
      total_ht: line.prix_total,
      total_tva: line.prix_total * ((line.tva || 20) / 100),
      total_ttc: line.prix_total * (1 + (line.tva || 20) / 100),
      marge: line.marge_brute || 0,
      ordre: line.ordre,
      remarques: line.remarques,
      created_at: oxaDevis.created_at,
      updated_at: oxaDevis.updated_at
    })) || [],
    prime_cee: oxaDevis.cee_montant_total
  };
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

// Générateur de numéro de devis
export const generateDevisNumber = (client: Client, type: 'standard' | 'cee' = 'standard'): string => {
  const year = new Date().getFullYear();
  const clientCode = client.entreprise.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const typePrefix = type === 'cee' ? 'CEE' : 'STD';
  const timestamp = Date.now().toString().slice(-4);
  
  return `${typePrefix}-${year}-${clientCode}-${timestamp}`;
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