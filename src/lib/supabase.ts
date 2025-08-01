import { createClient } from '@supabase/supabase-js';

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

// Créer le client Supabase
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