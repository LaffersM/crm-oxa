import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Types consolidés
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
  created_at: string;
  updated_at: string;
}

export interface LigneDevis {
  id: string;
  devis_id: string;
  article_id: string;
  quantite: number;
  prix_unitaire: number;
  total_ht: number;
  ordre: number;
  created_at: string;
  updated_at: string;
  article?: Article;
}

export interface OXADevis {
  id: string;
  numero: string;
  date_devis: string;
  objet: string;
  client_id: string;
  description_operation: string;
  zone?: string;
  lignes_data: any[];
  lignes?: LigneDevis[];
  cee_kwh_cumac: number;
  cee_prix_unitaire: number;
  cee_montant_total: number;
  total_ht: number;
  tva_taux: number;
  total_tva: number;
  total_ttc: number;
  reste_a_payer_ht: number;
  remarques?: string;
  type: 'IPE' | 'ELEC' | 'MATERIEL' | 'MAIN_OEUVRE';
  modalites_paiement: string;
  garantie: string;
  penalites: string;
  clause_juridique: string;
  statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire';
  commercial_id?: string;
  created_at: string;
  updated_at: string;
}

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

// Configuration des variables d'environnement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validation de la configuration
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey && 
    supabaseUrl.startsWith('https://') && 
    supabaseAnonKey.length > 20);
};

// Créer le client Supabase seulement si configuré
let supabaseClient: SupabaseClient | null = null;

if (isSupabaseConfigured()) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      autoRefreshToken: true,
      storage: window.localStorage,
    },
    global: {
      headers: {
        'X-Client-Info': 'oxa-groupe-crm',
      },
    },
    db: {
      schema: 'public',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
} else {
  console.warn('Supabase non configuré - Mode démo activé');
}

// Export du client avec vérification
export const supabase = supabaseClient as SupabaseClient;

// Fonction utilitaire pour tester la connexion
export const testSupabaseConnection = async (): Promise<boolean> => {
  if (!isSupabaseConfigured() || !supabaseClient) {
    return false;
  }

  try {
    const { error } = await supabaseClient
      .from('profiles')
      .select('id')
      .limit(1);
    
    return !error;
  } catch {
    return false;
  }
};

// Fonction pour récupérer le profil utilisateur de manière optimisée
export const getUserProfile = async (userId: string): Promise<Profile | null> => {
  if (!isSupabaseConfigured() || !supabaseClient) {
    return null;
  }

  try {
    const { data, error } = await supabaseClient
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