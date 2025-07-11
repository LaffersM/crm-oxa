import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  );
}

export interface Article {
  id: string
  nom: string
  description?: string
  type: 'bien' | 'service' | 'IPE' | 'ELEC' | 'MATERIEL' | 'MAIN_OEUVRE'
  prix_achat: number
  prix_vente: number
  tva: number
  stock?: number
  seuil_alerte?: number
  fournisseur?: string
  reference_fournisseur?: string
  created_at: string
  updated_at: string
}

export interface LigneDevis {
  id: string
  devis_id: string
  article_id: string
  quantite: number
  prix_unitaire: number
  total_ht: number
  ordre: number
  created_at: string
  updated_at: string
  article?: Article
}

export interface OXADevis {
  id: string
  numero: string
  date_devis: string
  objet: string
  client_id: string
  description_operation: string
  zone?: string
  lignes_data: any[] // JSON array of DevisLine stored in database
  lignes?: any[] // For compatibility with frontend display
  cee_kwh_cumac: number
  cee_prix_unitaire: number
  cee_montant_total: number
  total_ht: number
  tva_taux: number
  total_tva: number
  total_ttc: number
  reste_a_payer_ht: number
  remarques?: string
  type: 'IPE' | 'ELEC' | 'MATERIEL' | 'MAIN_OEUVRE'
  modalites_paiement: string
  garantie: string
  penalites: string
  clause_juridique: string
  statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire'
  commercial_id?: string
  created_at: string
  updated_at: string
  lignes?: LigneDevis[] // Ajouter les lignes pour la récupération
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
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

export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};