import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2, Calculator, Zap, Eye, EyeOff, Copy, Package, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { ClientSelector } from './ClientSelector';

interface Client {
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

interface Article {
  id: string;
  nom: string;
  description?: string;
  type: string;
  prix_achat: number;
  prix_vente: number;
  tva: number;
  unite?: string;
  fournisseur_id?: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

interface DevisLine {
  id: string;
  designation: string;
  description?: string;
  quantite: number;
  prix_unitaire: number;
  prix_achat: number;
  tva: number;
  prix_total: number;
  marge_brute: number;
  remarques?: string;
  article_id?: string;
  ordre: number;
}

interface DevisZone {
  id: string;
  nom: string;
  lignes: DevisLine[];
  visible_pdf: boolean;
  ordre: number;
  collapsed?: boolean;
}

interface CEECalculation {
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

interface CEEIntegration {
  mode: 'deduction' | 'information';
  afficher_bloc: boolean;
}

interface OXADevis {
  id?: string;
  numero?: string;
  date_devis: string;
  objet: string;
  client_id: string;
  client?: Client;
  description_operation: string;
  zones: DevisZone[];
  cee_calculation?: CEECalculation;
  cee_integration: CEEIntegration;
  total_ht: number;
  tva_taux: number;
  total_tva: number;
  total_ttc: number;
  total_marge: number;
  prime_cee_deduite: number;
  net_a_payer: number;
  remarques?: string;
  modalites_paiement: string;
  garantie: string;
  penalites: string;
  clause_juridique: string;
  statut?: string;
  commercial_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface OXADevisGeneratorProps {
  clients: Client[];
  articles: Article[];
  onClientCreated: (client: Client) => void;
  onSave: (devisData: any) => void;
  onCancel: () => void;
  existingDevis?: OXADevis | null;
}

const PROFILS_FONCTIONNEMENT = [
  { value: '1x8h', label: '1×8h (8h/jour)', coefficient: 1 },
  { value: '2x8h', label: '2×8h (16h/jour)', coefficient: 2 },
  { value: '3x8h_weekend_off', label: '3×8h week-end off', coefficient: 2.5 },
  { value: '3x8h_24_7', label: '3×8h 24/7', coefficient: 3 },
  { value: 'continu_24_7', label: 'Continu 24/7', coefficient: 3.5 }
];

const DUREES_CONTRAT = [
  { value: 1, label: '1 an', facteur: 1 },
  { value: 2, label: '2 ans', facteur: 1.8 },
  { value: 3, label: '3 ans', facteur: 2.5 },
  { value: 4, label: '4 ans', facteur: 3.1 },
  { value: 5, label: '5 ans', facteur: 3.6 },
  { value: 6, label: '6 ans', facteur: 4.0 }
];

export default function OXADevisGenerator({ 
  clients, 
  articles, 
  onClientCreated, 
  onSave, 
  onCancel, 
  existingDevis 
}: OXADevisGeneratorProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [showCatalogueModal, setShowCatalogueModal] = useState(false);
  const [selectedLineForCatalogue, setSelectedLineForCatalogue] = useState<{zoneId: string, lineId: string} | null>(null);
  const [catalogueSearch, setCatalogueSearch] = useState('');
  const [catalogueFilter, setCatalogueFilter] = useState('all');
  const [newZoneName, setNewZoneName] = useState('');
  const [showNewZoneInput, setShowNewZoneInput] = useState(false);
  
  const [devisData, setDevisData] = useState<OXADevis>({
    date_devis: new Date().toISOString().split('T')[0],
    objet: 'Mise en place d\'un système de mesurage IPE',
    client_id: '',
    description_operation: '',
    zones: [],
    cee_integration: {
      mode: 'deduction',
      afficher_bloc: true
    },
    total_ht: 0,
    tva_taux: 20.00,
    total_tva: 0,
    total_ttc: 0,
    total_marge: 0,
    prime_cee_deduite: 0,
    net_a_payer: 0,
    modalites_paiement: '30% à la commande, 70% à la livraison',
    garantie: '2 ans pièces et main d\'œuvre',
    penalites: 'Pénalités de retard : 0,1% par jour de retard',
    clause_juridique: 'Tout litige relève de la compétence du Tribunal de Commerce de Paris'
  });

  const [ceeCalculation, setCeeCalculation] = useState<CEECalculation>({
    profil_fonctionnement: '1x8h',
    puissance_nominale: 0,
    duree_contrat: 1,
    coefficient_activite: 1,
    facteur_f: 1,
    kwh_cumac: 0,
    tarif_kwh: 0.002,
    prime_estimee: 0,
    operateur_nom: 'OXA Groupe'
  });

  // Initialize with existing devis data if editing
  useEffect(() => {
    if (existingDevis) {
      setDevisData(existingDevis);
      
      // Find and set the client
      const client = clients.find(c => c.id === existingDevis.client_id);
      if (client) {
        setSelectedClient(client);
      }

      // Set CEE calculation if exists
      if (existingDevis.cee_calculation) {
        setCeeCalculation(existingDevis.cee_calculation);
      }
    }
  }, [existingDevis, clients]);

  // Calculate totals when zones change
  useEffect(() => {
    calculateTotals();
  }, [devisData.zones, devisData.tva_taux, ceeCalculation.prime_estimee, devisData.cee_integration.mode]);

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setDevisData(prev => ({ ...prev, client_id: client.id }));
    setShowClientSelector(false);
  };

  const calculateTotals = () => {
    let total_ht = 0;
    let total_marge = 0;

    devisData.zones.forEach(zone => {
      zone.lignes.forEach(ligne => {
        total_ht += ligne.prix_total;
        total_marge += ligne.marge_brute;
      });
    });

    const total_tva = (total_ht * devisData.tva_taux) / 100;
    const total_ttc = total_ht + total_tva;
    
    const prime_cee_deduite = devisData.cee_integration.mode === 'deduction' ? ceeCalculation.prime_estimee : 0;
    const net_a_payer = total_ttc - prime_cee_deduite;

    setDevisData(prev => ({
      ...prev,
      total_ht,
      total_tva,
      total_ttc,
      total_marge,
      prime_cee_deduite,
      net_a_payer
    }));
  };

  const calculateCEE = () => {
    const profil = PROFILS_FONCTIONNEMENT.find(p => p.value === ceeCalculation.profil_fonctionnement);
    const duree = DUREES_CONTRAT.find(d => d.value === ceeCalculation.duree_contrat);
    
    if (profil && duree && ceeCalculation.puissance_nominale > 0) {
      const coefficient_activite = profil.coefficient;
      const facteur_f = duree.facteur;
      const kwh_cumac = 29.4 * coefficient_activite * ceeCalculation.puissance_nominale * facteur_f;
      const prime_estimee = kwh_cumac * ceeCalculation.tarif_kwh;

      setCeeCalculation(prev => ({
        ...prev,
        coefficient_activite,
        facteur_f,
        kwh_cumac,
        prime_estimee
      }));
    }
  };

  const addZone = () => {
    if (newZoneName.trim()) {
      const newZone: DevisZone = {
        id: Date.now().toString(),
        nom: newZoneName.trim(),
        lignes: [],
        visible_pdf: true,
        ordre: devisData.zones.length + 1
      };
      
      setDevisData(prev => ({
        ...prev,
        zones: [...prev.zones, newZone]
      }));
      
      setNewZoneName('');
      setShowNewZoneInput(false);
    }
  };

  const duplicateZone = (zoneId: string) => {
    const zone = devisData.zones.find(z => z.id === zoneId);
    if (zone) {
      const duplicatedZone: DevisZone = {
        ...zone,
        id: Date.now().toString(),
        nom: `${zone.nom} (Copie)`,
        ordre: devisData.zones.length + 1,
        lignes: zone.lignes.map(ligne => ({
          ...ligne,
          id: `${Date.now()}-${Math.random()}`,
          ordre: ligne.ordre
        }))
      };
      
      setDevisData(prev => ({
        ...prev,
        zones: [...prev.zones, duplicatedZone]
      }));
    }
  };

  const updateZone = (zoneId: string, field: keyof DevisZone, value: any) => {
    setDevisData(prev => ({
      ...prev,
      zones: prev.zones.map(zone => 
        zone.id === zoneId ? { ...zone, [field]: value } : zone
      )
    }));
  };

  const removeZone = (zoneId: string) => {
    setDevisData(prev => ({
      ...prev,
      zones: prev.zones.filter(zone => zone.id !== zoneId)
    }));
  };

  const addLineToZone = (zoneId: string) => {
    const zone = devisData.zones.find(z => z.id === zoneId);
    if (zone) {
      const newLine: DevisLine = {
        id: Date.now().toString(),
        designation: '',
        description: '',
        quantite: 1,
        prix_unitaire: 0,
        prix_achat: 0,
        tva: 20,
        prix_total: 0,
        marge_brute: 0,
        remarques: '',
        ordre: zone.lignes.length + 1
      };
      
      updateZone(zoneId, 'lignes', [...zone.lignes, newLine]);
    }
  };

  const updateLine = (zoneId: string, lineId: string, field: keyof DevisLine, value: any) => {
    setDevisData(prev => ({
      ...prev,
      zones: prev.zones.map(zone => {
        if (zone.id === zoneId) {
          return {
            ...zone,
            lignes: zone.lignes.map(ligne => {
              if (ligne.id === lineId) {
                const updated = { ...ligne, [field]: value };
                
                // Recalculate totals when quantity or price changes
                if (field === 'quantite' || field === 'prix_unitaire') {
                  updated.prix_total = updated.quantite * updated.prix_unitaire;
                  updated.marge_brute = updated.prix_total - (updated.quantite * updated.prix_achat);
                }
                
                return updated;
              }
              return ligne;
            })
          };
        }
        return zone;
      })
    }));
  };

  const removeLine = (zoneId: string, lineId: string) => {
    setDevisData(prev => ({
      ...prev,
      zones: prev.zones.map(zone => 
        zone.id === zoneId 
          ? { ...zone, lignes: zone.lignes.filter(ligne => ligne.id !== lineId) }
          : zone
      )
    }));
  };

  const openCatalogueModal = (zoneId: string, lineId: string) => {
    setSelectedLineForCatalogue({ zoneId, lineId });
    setShowCatalogueModal(true);
  };

  const selectArticleFromCatalogue = (article: Article) => {
    if (selectedLineForCatalogue) {
      const { zoneId, lineId } = selectedLineForCatalogue;
      updateLine(zoneId, lineId, 'designation', article.nom);
      updateLine(zoneId, lineId, 'description', article.description || '');
      updateLine(zoneId, lineId, 'prix_unitaire', article.prix_vente);
      updateLine(zoneId, lineId, 'prix_achat', article.prix_achat);
      updateLine(zoneId, lineId, 'tva', article.tva);
      updateLine(zoneId, lineId, 'article_id', article.id);
      
      setShowCatalogueModal(false);
      setSelectedLineForCatalogue(null);
    }
  };

  const createNewArticle = (designation: string, prix: number) => {
    // Simulate article creation - in real app, this would call the API
    const newArticle: Article = {
      id: Date.now().toString(),
      nom: designation,
      description: `Article créé depuis le devis`,
      type: 'MATERIEL',
      prix_achat: prix * 0.7, // Estimate 30% margin
      prix_vente: prix,
      tva: 20,
      unite: 'unité',
      actif: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    alert(`Article "${designation}" créé dans le catalogue`);
    return newArticle;
  };

  const handleSave = () => {
    if (!selectedClient) {
      alert('Veuillez sélectionner un client');
      return;
    }

    if (devisData.zones.length === 0) {
      alert('Veuillez ajouter au moins une zone au devis');
      return;
    }

    const hasLines = devisData.zones.some(zone => zone.lignes.length > 0);
    if (!hasLines) {
      alert('Veuillez ajouter au moins une ligne de prestation');
      return;
    }

    const finalData = {
      ...devisData,
      client_id: selectedClient.id,
      cee_calculation: ceeCalculation,
      // Convert zones to database format
      lignes_data: devisData.zones.flatMap(zone => 
        zone.lignes.map(ligne => ({
          description: ligne.designation,
          zone: zone.nom,
          quantite: ligne.quantite,
          prix_unitaire: ligne.prix_unitaire,
          prix_achat: ligne.prix_achat,
          tva: ligne.tva,
          total_ht: ligne.prix_total,
          total_tva: ligne.prix_total * (ligne.tva / 100),
          total_ttc: ligne.prix_total * (1 + ligne.tva / 100),
          marge: ligne.marge_brute,
          ordre: ligne.ordre,
          remarques: ligne.remarques || '',
          article_id: ligne.article_id
        }))
      )
    };

    onSave(finalData);
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.nom.toLowerCase().includes(catalogueSearch.toLowerCase()) ||
                         article.description?.toLowerCase().includes(catalogueSearch.toLowerCase());
    const matchesFilter = catalogueFilter === 'all' || article.type === catalogueFilter;
    return matchesSearch && matchesFilter && article.actif;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  if (showClientSelector) {
    return (
      <ClientSelector
        clients={clients}
        selectedClient={selectedClient}
        onSelectClient={handleClientSelect}
        onCreateClient={onClientCreated}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Zap className="h-8 w-8 mr-3 text-yellow-600" />
              {existingDevis ? 'Modifier le devis CEE' : 'Nouveau devis CEE'}
            </h1>
            <p className="text-gray-600 mt-1">
              Générateur de devis avec zones modulaires et calcul CEE intégré
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Selection */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Client</h3>
              <button
                onClick={() => setShowClientSelector(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                {selectedClient ? 'Changer' : 'Sélectionner'}
              </button>
            </div>
            
            {selectedClient ? (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Nom:</span>
                    <span className="ml-2 text-gray-900">{selectedClient.nom}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Entreprise:</span>
                    <span className="ml-2 text-gray-900">{selectedClient.entreprise}</span>
                  </div>
                  {selectedClient.email && (
                    <div>
                      <span className="font-medium text-gray-700">Email:</span>
                      <span className="ml-2 text-gray-900">{selectedClient.email}</span>
                    </div>
                  )}
                  {selectedClient.telephone && (
                    <div>
                      <span className="font-medium text-gray-700">Téléphone:</span>
                      <span className="ml-2 text-gray-900">{selectedClient.telephone}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Aucun client sélectionné</p>
                <button
                  onClick={() => setShowClientSelector(true)}
                  className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sélectionner un client
                </button>
              </div>
            )}
          </div>

          {/* Devis Information */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations du devis</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Objet</label>
                <input
                  type="text"
                  value={devisData.objet}
                  onChange={(e) => setDevisData(prev => ({ ...prev, objet: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date du devis</label>
                <input
                  type="date"
                  value={devisData.date_devis}
                  onChange={(e) => setDevisData(prev => ({ ...prev, date_devis: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description de l'opération</label>
              <textarea
                value={devisData.description_operation}
                onChange={(e) => setDevisData(prev => ({ ...prev, description_operation: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Décrivez l'opération à réaliser..."
              />
            </div>
          </div>

          {/* CEE Calculation Module */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calculator className="h-5 w-5 mr-2 text-yellow-600" />
                Module de Calcul CEE IND-UT-134
              </h3>
              <button
                onClick={calculateCEE}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm"
              >
                Calculer
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profil de fonctionnement</label>
                <select
                  value={ceeCalculation.profil_fonctionnement}
                  onChange={(e) => setCeeCalculation(prev => ({ ...prev, profil_fonctionnement: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PROFILS_FONCTIONNEMENT.map((profil) => (
                    <option key={profil.value} value={profil.value}>
                      {profil.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Puissance nominale P (kW)</label>
                <input
                  type="number"
                  step="0.01"
                  value={ceeCalculation.puissance_nominale}
                  onChange={(e) => setCeeCalculation(prev => ({ ...prev, puissance_nominale: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Durée de contrat logiciel</label>
                <select
                  value={ceeCalculation.duree_contrat}
                  onChange={(e) => setCeeCalculation(prev => ({ ...prev, duree_contrat: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {DUREES_CONTRAT.map((duree) => (
                    <option key={duree.value} value={duree.value}>
                      {duree.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tarif CEE (€/kWh cumac)</label>
                <input
                  type="number"
                  step="0.001"
                  value={ceeCalculation.tarif_kwh}
                  onChange={(e) => setCeeCalculation(prev => ({ ...prev, tarif_kwh: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'opérateur</label>
                <input
                  type="text"
                  value={ceeCalculation.operateur_nom}
                  onChange={(e) => setCeeCalculation(prev => ({ ...prev, operateur_nom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* CEE Results */}
            <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Résultats du calcul</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-yellow-700">kWh cumac:</span>
                  <span className="ml-2 font-medium text-yellow-900">
                    {ceeCalculation.kwh_cumac.toLocaleString('fr-FR')}
                  </span>
                </div>
                <div>
                  <span className="text-yellow-700">Coefficient activité:</span>
                  <span className="ml-2 font-medium text-yellow-900">
                    {ceeCalculation.coefficient_activite}
                  </span>
                </div>
                <div>
                  <span className="text-yellow-700">Prime estimée:</span>
                  <span className="ml-2 font-medium text-green-700">
                    {formatCurrency(ceeCalculation.prime_estimee)}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-xs text-yellow-600">
                Formule: kWh cumac = 29.4 × {ceeCalculation.coefficient_activite} × {ceeCalculation.puissance_nominale} × {ceeCalculation.facteur_f}
              </div>
            </div>

            {/* CEE Integration Options */}
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Intégration de la prime CEE</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="cee_mode"
                    value="deduction"
                    checked={devisData.cee_integration.mode === 'deduction'}
                    onChange={(e) => setDevisData(prev => ({
                      ...prev,
                      cee_integration: { ...prev.cee_integration, mode: 'deduction' }
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm">En déduction directe du TTC</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="cee_mode"
                    value="information"
                    checked={devisData.cee_integration.mode === 'information'}
                    onChange={(e) => setDevisData(prev => ({
                      ...prev,
                      cee_integration: { ...prev.cee_integration, mode: 'information' }
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm">En note d'information (non déduite)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={devisData.cee_integration.afficher_bloc}
                    onChange={(e) => setDevisData(prev => ({
                      ...prev,
                      cee_integration: { ...prev.cee_integration, afficher_bloc: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Afficher le bloc CEE dans le PDF</span>
                </label>
              </div>
            </div>
          </div>

          {/* Zones Management */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Zones modulaires</h3>
              <div className="flex space-x-2">
                {showNewZoneInput && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newZoneName}
                      onChange={(e) => setNewZoneName(e.target.value)}
                      placeholder="Nom de la zone (ex: Zone AT1011)"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && addZone()}
                    />
                    <button
                      onClick={addZone}
                      className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
                    >
                      Ajouter
                    </button>
                    <button
                      onClick={() => setShowNewZoneInput(false)}
                      className="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600"
                    >
                      Annuler
                    </button>
                  </div>
                )}
                {!showNewZoneInput && (
                  <button
                    onClick={() => setShowNewZoneInput(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle zone
                  </button>
                )}
              </div>
            </div>

            {/* Zones List */}
            <div className="space-y-4">
              {devisData.zones.map((zone) => (
                <div key={zone.id} className="border border-gray-200 rounded-lg">
                  {/* Zone Header */}
                  <div className="bg-blue-50 p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateZone(zone.id, 'collapsed', !zone.collapsed)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {zone.collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      </button>
                      <input
                        type="text"
                        value={zone.nom}
                        onChange={(e) => updateZone(zone.id, 'nom', e.target.value)}
                        className="font-medium text-blue-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                      />
                      <span className="text-sm text-blue-700">
                        ({zone.lignes.length} ligne{zone.lignes.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center text-sm text-blue-700">
                        <input
                          type="checkbox"
                          checked={zone.visible_pdf}
                          onChange={(e) => updateZone(zone.id, 'visible_pdf', e.target.checked)}
                          className="mr-1"
                        />
                        Visible PDF
                      </label>
                      <button
                        onClick={() => duplicateZone(zone.id)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Dupliquer la zone"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => addLineToZone(zone.id)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        <Plus className="h-3 w-3 mr-1 inline" />
                        Ligne
                      </button>
                      <button
                        onClick={() => removeZone(zone.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Supprimer la zone"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Zone Content */}
                  {!zone.collapsed && (
                    <div className="p-4">
                      {zone.lignes.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p>Aucune ligne dans cette zone</p>
                          <button
                            onClick={() => addLineToZone(zone.id)}
                            className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Ajouter la première ligne
                          </button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Désignation</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qté</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Prix unit. HT</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total HT</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Marge</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {zone.lignes.map((ligne) => (
                                <tr key={ligne.id}>
                                  <td className="px-3 py-2">
                                    <div className="space-y-2">
                                      <div className="flex items-center space-x-2">
                                        <input
                                          list="articles-list"
                                          type="text"
                                          value={ligne.designation}
                                          onChange={(e) => updateLine(zone.id, ligne.id, 'designation', e.target.value)}
                                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                          placeholder="Désignation"
                                        />
                                        <button
                                          onClick={() => openCatalogueModal(zone.id, ligne.id)}
                                          className="bg-blue-100 text-blue-600 p-1 rounded hover:bg-blue-200"
                                          title="Choisir depuis le catalogue"
                                        >
                                          <Package className="h-4 w-4" />
                                        </button>
                                      </div>
                                      <textarea
                                        value={ligne.description || ''}
                                        onChange={(e) => updateLine(zone.id, ligne.id, 'description', e.target.value)}
                                        rows={2}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                        placeholder="Description détaillée (markdown supporté)"
                                      />
                                    </div>
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      value={ligne.quantite}
                                      onChange={(e) => updateLine(zone.id, ligne.id, 'quantite', parseFloat(e.target.value) || 0)}
                                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                      min="0"
                                      step="0.01"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      value={ligne.prix_unitaire}
                                      onChange={(e) => updateLine(zone.id, ligne.id, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                                      className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                      min="0"
                                      step="0.01"
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-sm font-medium">
                                    {formatCurrency(ligne.prix_total)}
                                  </td>
                                  <td className="px-3 py-2 text-sm">
                                    <span className={ligne.marge_brute >= 0 ? 'text-green-600' : 'text-red-600'}>
                                      {formatCurrency(ligne.marge_brute)}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex items-center space-x-1">
                                      <button
                                        onClick={() => removeLine(zone.id, ligne.id)}
                                        className="text-red-600 hover:text-red-800 p-1"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                      {ligne.designation && !ligne.article_id && (
                                        <button
                                          onClick={() => createNewArticle(ligne.designation, ligne.prix_unitaire)}
                                          className="text-green-600 hover:text-green-800 p-1"
                                          title="Ajouter au catalogue"
                                        >
                                          <Plus className="h-4 w-4" />
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {devisData.zones.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Aucune zone créée</p>
                <button
                  onClick={() => setShowNewZoneInput(true)}
                  className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Créer la première zone
                </button>
              </div>
            )}
          </div>

          {/* Datalist for autocomplete */}
          <datalist id="articles-list">
            {articles.map((article) => (
              <option key={article.id} value={article.nom}>
                {formatCurrency(article.prix_vente)} - {article.description}
              </option>
            ))}
          </datalist>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          {/* CEE Summary */}
          {devisData.cee_integration.afficher_bloc && (
            <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                DISPOSITIF CEE – PRIME ÉNERGÉTIQUE
              </h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-yellow-700 mb-2">
                    Montant estimé de la prime CEE versée par {ceeCalculation.operateur_nom}:
                  </p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(ceeCalculation.prime_estimee)}
                  </p>
                </div>
                <div className="text-xs text-yellow-600 space-y-1">
                  <p>Prime nette de taxes, versée conformément aux paramètres décrits sur :</p>
                  <a href="https://ecologie.gouv.fr" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    ecologie.gouv.fr
                  </a>
                  <p>Fiche standardisée IND-UT-134</p>
                </div>
              </div>
            </div>
          )}

          {/* Financial Summary */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé financier</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total HT:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(devisData.total_ht)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">TVA ({devisData.tva_taux}%):</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(devisData.total_tva)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total TTC:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(devisData.total_ttc)}
                </span>
              </div>
              
              {devisData.cee_integration.mode === 'deduction' && ceeCalculation.prime_estimee > 0 && (
                <>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Prime CEE:</span>
                      <span className="font-medium text-green-600">
                        -{formatCurrency(devisData.prime_cee_deduite)}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-800">Net à payer:</span>
                      <span className="font-bold text-gray-900">
                        {formatCurrency(devisData.net_a_payer)}
                      </span>
                    </div>
                  </div>
                </>
              )}
              
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Marge totale:</span>
                  <span className={`font-medium ${devisData.total_marge >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(devisData.total_marge)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="space-y-3">
              <button
                onClick={handleSave}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center font-medium"
              >
                <Save className="h-4 w-4 mr-2" />
                {existingDevis ? 'Mettre à jour' : 'Enregistrer le devis'}
              </button>
              
              <button
                onClick={onCancel}
                className="w-full border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Catalogue Modal */}
      {showCatalogueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Catalogue des articles</h3>
              <button
                onClick={() => setShowCatalogueModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Catalogue Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-grow">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher un article..."
                      value={catalogueSearch}
                      onChange={(e) => setCatalogueSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <select
                    value={catalogueFilter}
                    onChange={(e) => setCatalogueFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Tous les types</option>
                    <option value="IPE">IPE</option>
                    <option value="ELEC">ELEC</option>
                    <option value="MATERIEL">MATERIEL</option>
                    <option value="MAIN_OEUVRE">Main d'œuvre</option>
                  </select>
                </div>
              </div>

              {/* Articles List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredArticles.map((article) => (
                  <div
                    key={article.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => selectArticleFromCatalogue(article)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{article.nom}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        article.type === 'IPE' ? 'bg-blue-100 text-blue-800' :
                        article.type === 'ELEC' ? 'bg-yellow-100 text-yellow-800' :
                        article.type === 'MATERIEL' ? 'bg-green-100 text-green-800' :
                        article.type === 'MAIN_OEUVRE' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {article.type}
                      </span>
                    </div>
                    {article.description && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{article.description}</p>
                    )}
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(article.prix_vente)}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">/ {article.unite}</span>
                      </div>
                      <div className="text-xs text-green-600">
                        Marge: {formatCurrency(article.prix_vente - article.prix_achat)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredArticles.length === 0 && (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun article trouvé</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Aucun article ne correspond à vos critères de recherche.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}