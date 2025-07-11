import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Zap, Calculator } from 'lucide-react';
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
  zone: string;
  quantite: number;
  prix_unitaire: number;
  prix_total: number;
  remarques?: string;
  type: 'materiel' | 'main_oeuvre';
}

interface OXADevis {
  id?: string;
  numero?: string;
  date_devis: string;
  objet: string;
  client_id: string;
  client?: Client;
  description_operation: string;
  zone?: string;
  lignes: DevisLine[];
  lignes_data: DevisLine[];
  cee_kwh_cumac: number;
  cee_prix_unitaire: number;
  cee_montant_total: number;
  total_ht: number;
  tva_taux: number;
  total_tva: number;
  total_ttc: number;
  reste_a_payer_ht: number;
  remarques?: string;
  type: string;
  modalites_paiement: string;
  garantie: string;
  penalites: string;
  clause_juridique: string;
  statut?: string;
  commercial_id?: string;
  created_at?: string;
  updated_at?: string;
  cee_coefficient_activite?: number;
  cee_duree_engagement?: number;
  cee_puissance?: number;
}

interface OXADevisGeneratorProps {
  clients: Client[];
  articles: Article[];
  onClientCreated: (client: Client) => void;
  onSave: (devisData: any) => void;
  onCancel: () => void;
  existingDevis?: OXADevis | null;
}

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
  
  const [devisData, setDevisData] = useState<OXADevis>({
    date_devis: new Date().toISOString().split('T')[0],
    objet: 'Mise en place d\'un système de mesurage IPE',
    client_id: '',
    description_operation: '',
    zone: '',
    lignes: [],
    lignes_data: [],
    cee_kwh_cumac: 0,
    cee_prix_unitaire: 7.30,
    cee_montant_total: 0,
    total_ht: 0,
    tva_taux: 20.00,
    total_tva: 0,
    total_ttc: 0,
    reste_a_payer_ht: 0,
    remarques: '',
    type: 'IPE',
    modalites_paiement: '30% à la commande, 70% à la livraison',
    garantie: '2 ans pièces et main d\'œuvre',
    penalites: 'Pénalités de retard : 0,1% par jour de retard',
    clause_juridique: 'Tout litige relève de la compétence du Tribunal de Commerce de Paris',
    cee_coefficient_activite: 1.0,
    cee_duree_engagement: 10,
    cee_puissance: 0
  });

  // Initialize with existing devis data if editing
  useEffect(() => {
    if (existingDevis) {
      setDevisData({
        ...existingDevis,
        lignes: existingDevis.lignes_data || existingDevis.lignes || []
      });
      
      // Find and set the client
      const client = clients.find(c => c.id === existingDevis.client_id);
      if (client) {
        setSelectedClient(client);
      }
    }
  }, [existingDevis, clients]);

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setDevisData(prev => ({ ...prev, client_id: client.id }));
    setShowClientSelector(false);
  };

  const addLigne = () => {
    const newLigne: DevisLine = {
      id: Date.now().toString(),
      designation: '',
      zone: devisData.zone || '',
      quantite: 1,
      prix_unitaire: 0,
      prix_total: 0,
      remarques: '',
      type: 'materiel'
    };
    
    const updatedLignes = [...devisData.lignes, newLigne];
    setDevisData(prev => ({ 
      ...prev, 
      lignes: updatedLignes,
      lignes_data: updatedLignes
    }));
  };

  const updateLigne = (index: number, field: keyof DevisLine, value: any) => {
    const updatedLignes = devisData.lignes.map((ligne, i) => {
      if (i === index) {
        const updatedLigne = { ...ligne, [field]: value };
        if (field === 'quantite' || field === 'prix_unitaire') {
          updatedLigne.prix_total = updatedLigne.quantite * updatedLigne.prix_unitaire;
        }
        return updatedLigne;
      }
      return ligne;
    });
    
    setDevisData(prev => ({ 
      ...prev, 
      lignes: updatedLignes,
      lignes_data: updatedLignes
    }));
    calculateTotals(updatedLignes);
  };

  const removeLigne = (index: number) => {
    const updatedLignes = devisData.lignes.filter((_, i) => i !== index);
    setDevisData(prev => ({ 
      ...prev, 
      lignes: updatedLignes,
      lignes_data: updatedLignes
    }));
    calculateTotals(updatedLignes);
  };

  const calculateTotals = (lignes: DevisLine[]) => {
    const total_ht = lignes.reduce((sum, ligne) => sum + ligne.prix_total, 0);
    const total_tva = total_ht * (devisData.tva_taux / 100);
    const total_ttc = total_ht + total_tva;
    
    setDevisData(prev => ({
      ...prev,
      total_ht,
      total_tva,
      total_ttc,
      reste_a_payer_ht: total_ht - (prev.cee_montant_total || 0)
    }));
  };

  const calculateCEE = () => {
    if (devisData.cee_puissance && devisData.cee_coefficient_activite && devisData.cee_duree_engagement) {
      const kwh_cumac = devisData.cee_puissance * devisData.cee_coefficient_activite * devisData.cee_duree_engagement * 8760;
      const montant_total = kwh_cumac * devisData.cee_prix_unitaire;
      
      setDevisData(prev => ({
        ...prev,
        cee_kwh_cumac: kwh_cumac,
        cee_montant_total: montant_total,
        reste_a_payer_ht: prev.total_ht - montant_total
      }));
    }
  };

  const handleSave = () => {
    if (!selectedClient) {
      alert('Veuillez sélectionner un client');
      return;
    }

    if (devisData.lignes.length === 0) {
      alert('Veuillez ajouter au moins une ligne au devis');
      return;
    }

    const finalData = {
      ...devisData,
      client_id: selectedClient.id,
      lignes_data: devisData.lignes
    };

    // Remove the lignes field as it's not a database column
    delete finalData.lignes;

    onSave(finalData);
  };

  if (showClientSelector) {
    return (
      <ClientSelector
        clients={clients}
        onClientSelect={handleClientSelect}
        onClientCreated={onClientCreated}
        onCancel={() => setShowClientSelector(false)}
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
              Créez un devis avec calcul automatique des primes CEE
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

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Zone d'intervention</label>
              <input
                type="text"
                value={devisData.zone || ''}
                onChange={(e) => setDevisData(prev => ({ ...prev, zone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Zone production, Atelier 1..."
              />
            </div>
          </div>

          {/* CEE Calculation */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calculator className="h-5 w-5 mr-2 text-yellow-600" />
                Calcul CEE
              </h3>
              <button
                onClick={calculateCEE}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm"
              >
                Calculer
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Puissance (kW)</label>
                <input
                  type="number"
                  step="0.01"
                  value={devisData.cee_puissance || ''}
                  onChange={(e) => setDevisData(prev => ({ ...prev, cee_puissance: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Coefficient d'activité</label>
                <input
                  type="number"
                  step="0.01"
                  value={devisData.cee_coefficient_activite || ''}
                  onChange={(e) => setDevisData(prev => ({ ...prev, cee_coefficient_activite: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Durée engagement (années)</label>
                <input
                  type="number"
                  step="0.1"
                  value={devisData.cee_duree_engagement || ''}
                  onChange={(e) => setDevisData(prev => ({ ...prev, cee_duree_engagement: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prix unitaire CEE (€/kWh cumac)</label>
                <input
                  type="number"
                  step="0.001"
                  value={devisData.cee_prix_unitaire}
                  onChange={(e) => setDevisData(prev => ({ ...prev, cee_prix_unitaire: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">kWh cumac calculés</label>
                <input
                  type="number"
                  value={devisData.cee_kwh_cumac}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Lines */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Lignes du devis</h3>
              <button
                onClick={addLigne}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une ligne
              </button>
            </div>

            <div className="space-y-4">
              {devisData.lignes.map((ligne, index) => (
                <div key={ligne.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Désignation</label>
                      <input
                        type="text"
                        value={ligne.designation}
                        onChange={(e) => updateLigne(index, 'designation', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                      <input
                        type="text"
                        value={ligne.zone}
                        onChange={(e) => updateLigne(index, 'zone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ligne.quantite}
                        onChange={(e) => updateLigne(index, 'quantite', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prix unitaire</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ligne.prix_unitaire}
                        onChange={(e) => updateLigne(index, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                      <input
                        type="number"
                        value={ligne.prix_total}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={ligne.type}
                        onChange={(e) => updateLigne(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="materiel">Matériel</option>
                        <option value="main_oeuvre">Main d'œuvre</option>
                      </select>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Remarques</label>
                      <input
                        type="text"
                        value={ligne.remarques || ''}
                        onChange={(e) => updateLigne(index, 'remarques', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Remarques optionnelles..."
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() => removeLigne(index)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {devisData.lignes.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Aucune ligne ajoutée</p>
                <button
                  onClick={addLigne}
                  className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Ajouter la première ligne
                </button>
              </div>
            )}
          </div>

          {/* Remarques */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Remarques</h3>
            <textarea
              value={devisData.remarques || ''}
              onChange={(e) => setDevisData(prev => ({ ...prev, remarques: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Remarques additionnelles sur le devis..."
            />
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          {/* CEE Summary */}
          <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Résumé CEE
            </h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-yellow-700">kWh cumac:</span>
                <span className="font-medium text-yellow-900">
                  {devisData.cee_kwh_cumac.toLocaleString('fr-FR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-700">Prix unitaire:</span>
                <span className="font-medium text-yellow-900">
                  {devisData.cee_prix_unitaire.toFixed(3)} €/kWh
                </span>
              </div>
              <div className="border-t border-yellow-200 pt-3">
                <div className="flex justify-between">
                  <span className="font-medium text-yellow-800">Prime CEE:</span>
                  <span className="font-bold text-yellow-900">
                    {devisData.cee_montant_total.toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'EUR'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé financier</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total HT:</span>
                <span className="font-medium text-gray-900">
                  {devisData.total_ht.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'EUR'
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">TVA ({devisData.tva_taux}%):</span>
                <span className="font-medium text-gray-900">
                  {devisData.total_tva.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'EUR'
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total TTC:</span>
                <span className="font-medium text-gray-900">
                  {devisData.total_ttc.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'EUR'
                  })}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Prime CEE:</span>
                  <span className="font-medium text-green-600">
                    -{devisData.cee_montant_total.toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'EUR'
                    })}
                  </span>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-800">Reste à payer HT:</span>
                  <span className="font-bold text-gray-900">
                    {devisData.reste_a_payer_ht.toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'EUR'
                    })}
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
    </div>
  );
}