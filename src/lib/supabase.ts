// src/lib/supabase.ts - Version mise à jour pour le module CEE

import { createClient } from '@supabase/supabase-js';

// ==================== TYPES UNIFIÉS POUR LE MODULE CEE ====================

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

// Types pour le calculateur CEE
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
  notes?: string;
}

// Ligne de devis CEE (format simplifié)
export interface DevisLine {
  id: string;
  designation: string;
  description?: string;
  zone: string;
  quantite: number;
  prix_unitaire: number;
  prix_total: number;
  tva: number;
  type: 'materiel' | 'service' | 'parametrage' | 'etude';
  ordre: number;
}

// Interface principale pour les devis CEE
export interface CEEDevis {
  id: string;
  numero: string;
  date_devis: string;
  date_validite: string;
  client_id: string;
  client?: Client;
  objet: string;
  description_operation: string;
  statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire';
  type: 'cee'; // Toujours 'cee' pour ce module
  
  // Calculs CEE intégrés
  cee_data: CEECalculation;
  
  // Lignes du devis (stockées en JSON dans la DB)
  lignes_data?: any[]; // Format base de données
  lignes?: DevisLine[]; // Format frontend
  
  // Totaux calculés
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  prime_cee: number;
  reste_a_payer: number;
  
  // Métadonnées
  commercial_id: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

// Article (pour compatibilité future)
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

// ==================== CONFIGURATION SUPABASE ====================

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
      'X-Client-Info': 'oxa-groupe-crm-cee',
    },
  },
});

// ==================== UTILITAIRES POUR LE MODULE CEE ====================

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

// Générateur de numéro de devis CEE
export const generateCEEDevisNumber = (client: Client): string => {
  const year = new Date().getFullYear();
  const clientCode = client.entreprise.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const timestamp = Date.now().toString().slice(-4);
  
  return `CEE-${year}-${clientCode}-${timestamp}`;
};

// Calculateur CEE selon la formule IND-UT-134
export const calculateCEE = (params: {
  puissance_nominale: number;
  coefficient_activite: number;
  facteur_f: number;
  tarif_kwh: number;
}): { kwh_cumac: number; prime_estimee: number } => {
  const kwh_cumac = 29.4 * params.coefficient_activite * params.puissance_nominale * params.facteur_f;
  const prime_estimee = kwh_cumac * params.tarif_kwh;
  
  return { kwh_cumac, prime_estimee };
};

// Profils de fonctionnement prédéfinis
export const CEE_PROFILS = [
  { value: '1x8h', label: '1×8h (8h/jour)', coefficient: 1 },
  { value: '2x8h', label: '2×8h (16h/jour)', coefficient: 2 },
  { value: '3x8h_weekend_off', label: '3×8h sans weekend', coefficient: 2.5 },
  { value: '3x8h_24_7', label: '3×8h continu', coefficient: 3 },
  { value: 'continu_24_7', label: 'Continu 24h/7j', coefficient: 3 }
] as const;

// Convertisseur : Format DB → Format Frontend
export const convertCEEDevisToFrontend = (dbDevis: any): CEEDevis => {
  return {
    ...dbDevis,
    lignes: dbDevis.lignes_data || [],
    cee_data: dbDevis.cee_data || {
      profil_fonctionnement: '2x8h',
      puissance_nominale: 0,
      duree_contrat: 3,
      coefficient_activite: 2,
      facteur_f: 3,
      kwh_cumac: 0,
      tarif_kwh: 0.002,
      prime_estimee: 0,
      operateur_nom: 'TotalEnergies'
    },
    prime_cee: dbDevis.cee_data?.prime_estimee || 0,
    reste_a_payer: (dbDevis.total_ttc || 0) - (dbDevis.cee_data?.prime_estimee || 0)
  };
};

// Convertisseur : Format Frontend → Format DB
export const convertCEEDevisToDatabase = (frontendDevis: CEEDevis): any => {
  const dbData = { ...frontendDevis };
  
  // Nettoyer les champs frontend
  delete dbData.client;
  delete dbData.lignes;
  
  // Assurer que les données CEE sont stockées correctement
  dbData.lignes_data = frontendDevis.lignes || [];
  dbData.type = 'cee';
  
  // Mapper le client
  if (frontendDevis.client?.id) {
    dbData.client_id = frontendDevis.client.id;
  }
  
  return dbData;
};

// Validation d'un devis CEE
export const validateCEEDevis = (devis: Partial<CEEDevis>): string[] => {
  const errors: string[] = [];
  
  if (!devis.client_id) errors.push('Client requis');
  if (!devis.objet?.trim()) errors.push('Objet requis');
  if (!devis.lignes?.length) errors.push('Au moins une ligne requise');
  if (!devis.cee_data?.puissance_nominale || devis.cee_data.puissance_nominale <= 0) {
    errors.push('Puissance nominale requise');
  }
  
  return errors;
};

// Test de connexion Supabase
export const testSupabaseConnection = async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};

// ==================== FONCTIONS CRUD POUR LES DEVIS CEE ====================

// Créer un devis CEE
export const createCEEDevis = async (devisData: CEEDevis): Promise<CEEDevis> => {
  const dbData = convertCEEDevisToDatabase(devisData);
  
  const { data, error } = await supabase
    .from('devis')
    .insert([dbData])
    .select(`
      *,
      client:clients(*)
    `)
    .single();

  if (error) throw error;
  
  return convertCEEDevisToFrontend(data);
};

// Mettre à jour un devis CEE
export const updateCEEDevis = async (id: string, devisData: Partial<CEEDevis>): Promise<CEEDevis> => {
  const dbData = convertCEEDevisToDatabase(devisData as CEEDevis);
  
  const { data, error } = await supabase
    .from('devis')
    .update(dbData)
    .eq('id', id)
    .select(`
      *,
      client:clients(*)
    `)
    .single();

  if (error) throw error;
  
  return convertCEEDevisToFrontend(data);
};

// Récupérer tous les devis CEE
export const getCEEDevis = async (): Promise<CEEDevis[]> => {
  const { data, error } = await supabase
    .from('devis')
    .select(`
      *,
      client:clients(*)
    `)
    .eq('type', 'cee')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data || []).map(convertCEEDevisToFrontend);
};

// Récupérer un devis CEE par ID
export const getCEEDevisById = async (id: string): Promise<CEEDevis | null> => {
  const { data, error } = await supabase
    .from('devis')
    .select(`
      *,
      client:clients(*)
    `)
    .eq('id', id)
    .eq('type', 'cee')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Pas trouvé
    throw error;
  }
  
  return convertCEEDevisToFrontend(data);
};

// Supprimer un devis CEE
export const deleteCEEDevis = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('devis')
    .delete()
    .eq('id', id)
    .eq('type', 'cee');

  if (error) throw error;
};

// Dupliquer un devis CEE
export const duplicateCEEDevis = async (originalId: string): Promise<CEEDevis> => {
  const original = await getCEEDevisById(originalId);
  if (!original) throw new Error('Devis original non trouvé');

  const duplicated: CEEDevis = {
    ...original,
    id: '', // Sera généré par la DB
    numero: '', // Sera régénéré
    statut: 'brouillon',
    date_devis: new Date().toISOString().split('T')[0],
    date_validite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    created_at: '',
    updated_at: ''
  };

  // Régénérer le numéro si on a le client
  if (original.client) {
    duplicated.numero = generateCEEDevisNumber(original.client);
  }

  return createCEEDevis(duplicated);
};

// ==================== STATISTIQUES CEE ====================

export interface CEEStats {
  total_devis: number;
  total_prime_cee: number;
  total_kwh_cumac: number;
  devis_par_statut: Record<string, number>;
  evolution_mensuelle: Array<{
    mois: string;
    count: number;
    prime_total: number;
  }>;
}

export const getCEEStats = async (): Promise<CEEStats> => {
  const { data, error } = await supabase
    .from('devis')
    .select('*')
    .eq('type', 'cee');

  if (error) throw error;

  const devis = (data || []).map(convertCEEDevisToFrontend);
  
  const stats: CEEStats = {
    total_devis: devis.length,
    total_prime_cee: devis.reduce((sum, d) => sum + d.prime_cee, 0),
    total_kwh_cumac: devis.reduce((sum, d) => sum + d.cee_data.kwh_cumac, 0),
    devis_par_statut: {},
    evolution_mensuelle: []
  };

  // Compter par statut
  devis.forEach(d => {
    stats.devis_par_statut[d.statut] = (stats.devis_par_statut[d.statut] || 0) + 1;
  });

  // Évolution mensuelle des 12 derniers mois
  const monthlyData: Record<string, { count: number; prime_total: number }> = {};
  
  devis.forEach(d => {
    const month = new Date(d.created_at).toISOString().slice(0, 7); // YYYY-MM
    if (!monthlyData[month]) {
      monthlyData[month] = { count: 0, prime_total: 0 };
    }
    monthlyData[month].count++;
    monthlyData[month].prime_total += d.prime_cee;
  });

  stats.evolution_mensuelle = Object.entries(monthlyData)
    .map(([mois, data]) => ({ mois, ...data }))
    .sort((a, b) => a.mois.localeCompare(b.mois))
    .slice(-12); // 12 derniers mois

  return stats;
};

// ==================== UTILITAIRES D'EXPORT ====================

// Préparer les données pour export PDF
export const prepareCEEDevisForPDF = (devis: CEEDevis, client: Client) => {
  return {
    // En-tête
    numero: devis.numero,
    date_devis: new Date(devis.date_devis).toLocaleDateString('fr-FR'),
    date_validite: new Date(devis.date_validite).toLocaleDateString('fr-FR'),
    objet: devis.objet,
    
    // Client
    client: {
      entreprise: client.entreprise,
      nom: client.nom,
      adresse: client.adresse,
      ville: client.ville,
      code_postal: client.code_postal,
      email: client.email,
      telephone: client.telephone
    },
    
    // Description
    description_operation: devis.description_operation,
    
    // Calcul CEE
    cee: {
      profil_fonctionnement: devis.cee_data.profil_fonctionnement,
      puissance_nominale: devis.cee_data.puissance_nominale,
      duree_contrat: devis.cee_data.duree_contrat,
      kwh_cumac: devis.cee_data.kwh_cumac,
      prime_estimee: devis.cee_data.prime_estimee,
      operateur_nom: devis.cee_data.operateur_nom,
      formule: `kWh cumac = 29.4 × ${devis.cee_data.coefficient_activite} × ${devis.cee_data.puissance_nominale} × ${devis.cee_data.facteur_f}`
    },
    
    // Lignes groupées par zone
    zones: Object.entries(
      devis.lignes?.reduce((acc, ligne) => {
        if (!acc[ligne.zone]) acc[ligne.zone] = [];
        acc[ligne.zone].push(ligne);
        return acc;
      }, {} as Record<string, DevisLine[]>) || {}
    ).map(([nom, lignes]) => ({
      nom,
      lignes: lignes.map(l => ({
        designation: l.designation,
        description: l.description,
        quantite: l.quantite,
        prix_unitaire: l.prix_unitaire,
        prix_total: l.prix_total,
        tva: l.tva
      }))
    })),
    
    // Totaux
    totaux: {
      total_ht: devis.total_ht,
      total_tva: devis.total_tva,
      total_ttc: devis.total_ttc,
      prime_cee: devis.prime_cee,
      reste_a_payer: devis.reste_a_payer
    },
    
    // Métadonnées
    notes: devis.notes,
    statut: devis.statut
  };
};

// ==================== FONCTIONS DE MIGRATION (si nécessaire) ====================

// Migrer les anciens devis vers le nouveau format
export const migrateLegacyDevis = async (): Promise<void> => {
  if (!isSupabaseConfigured()) return;
  
  try {
    // Récupérer les anciens devis qui n'ont pas le bon format
    const { data: oldDevis, error } = await supabase
      .from('devis')
      .select('*')
      .or('type.is.null,cee_data.is.null');

    if (error) throw error;

    for (const devis of oldDevis || []) {
      // Convertir vers le nouveau format
      const updates: any = {
        type: devis.type || 'cee',
        updated_at: new Date().toISOString()
      };

      // Migrer les données CEE si elles n'existent pas
      if (!devis.cee_data) {
        updates.cee_data = {
          profil_fonctionnement: '2x8h',
          puissance_nominale: 0,
          duree_contrat: 3,
          coefficient_activite: 2,
          facteur_f: 3,
          kwh_cumac: 0,
          tarif_kwh: 0.002,
          prime_estimee: 0,
          operateur_nom: 'TotalEnergies'
        };
      }

      // Migrer les lignes si nécessaire
      if (!devis.lignes_data && devis.lignes) {
        updates.lignes_data = devis.lignes;
      }

      await supabase
        .from('devis')
        .update(updates)
        .eq('id', devis.id);
    }

    console.log(`Migration de ${oldDevis?.length || 0} devis terminée`);
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
    throw error;
  }
};

// ==================== TYPES POUR LA COMPATIBILITÉ ====================

// Types existants pour éviter les erreurs d'import
export interface Devis extends CEEDevis {
  // Alias pour la compatibilité
}

export interface OXADevis extends CEEDevis {
  // Alias pour la compatibilité
}

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

// ==================== EXPORT PAR DÉFAUT ====================

export default {
  // Configuration
  supabase,
  isSupabaseConfigured,
  testSupabaseConnection,
  
  // Utilitaires
  getUserProfile,
  generateCEEDevisNumber,
  calculateCEE,
  
  // CRUD
  createCEEDevis,
  updateCEEDevis,
  getCEEDevis,
  getCEEDevisById,
  deleteCEEDevis,
  duplicateCEEDevis,
  
  // Statistiques
  getCEEStats,
  
  // Export
  prepareCEEDevisForPDF,
  
  // Migration
  migrateLegacyDevis,
  
  // Constantes
  CEE_PROFILS
};