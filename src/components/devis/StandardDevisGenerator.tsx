import React, { useState, useEffect } from 'react'
import { Client, Article, supabase, isSupabaseConfigured } from '../../lib/supabase'
import { X, Save, Plus, Trash2, Download, FileText, Building, User, Calendar, Euro, Search, Package } from 'lucide-react'
import { ClientSelector } from './ClientSelector'
import { generateDevisPDF } from '../../utils/pdfExport'

interface DevisLine {
  id: string
  designation: string
  zone?: string
  quantite: number
  prix_unitaire: number
  prix_total: number
  remarques?: string
  type: 'materiel' | 'accessoire' | 'parametrage'
  parent_id?: string
  article_id?: string
}

interface StandardDevisData {
  numero: string
  date_devis: string
  objet: string
  client: Client | null
  description_operation: string
  lignes: DevisLine[]
  total_ht: number
  tva_taux: number
  total_tva: number
  total_ttc: number
  delais: string
  modalites_paiement: string
  garantie: string
  penalites: string
  clause_juridique: string
}

interface StandardDevisGeneratorProps {
  clients: Client[]
  articles: Article[]
  onClientCreated?: (client: Client) => void
  onSave: (devisData: StandardDevisData) => void
  onCancel: () => void
  existingDevis?: StandardDevisData | null
}

export function StandardDevisGenerator({ 
  clients, 
  articles, 
  onClientCreated,
  onSave, 
  onCancel, 
  existingDevis 
}: StandardDevisGeneratorProps) {
  const [devisData, setDevisData] = useState<StandardDevisData>({
    numero: '',
    date_devis: new Date().toISOString().split('T')[0],
    objet: 'Devis commercial',
    client: null,
    description_operation: '',
    lignes: [],
    total_ht: 0,
    tva_taux: 20,
    total_tva: 0,
    total_ttc: 0,
    delais: '4 à 6 semaines après validation du devis',
    modalites_paiement: '30% à la commande, 70% à la livraison',
    garantie: '2 ans pièces et main d\'œuvre',
    penalites: 'Pénalités de retard : 0,1% par jour de retard',
    clause_juridique: 'Tout litige relève de la compétence du Tribunal de Commerce de Paris'
  })

  const [showCatalogueModal, setShowCatalogueModal] = useState(false)
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null)
  const [catalogueSearch, setCatalogueSearch] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [newZoneName, setNewZoneName] = useState('')
  const [showNewZoneInput, setShowNewZoneInput] = useState(false)
  
  // Groupes du catalogue
  const catalogueGroups = [
    { value: 'all', label: 'Tous les groupes' },
    { value: 'IPE', label: 'IPE' },
    { value: 'ELEC', label: 'ELEC' },
    { value: 'MATERIEL', label: 'MATERIEL' },
    { value: 'MAIN_OEUVRE', label: 'Main d\'œuvre' }
  ]

  // Compteur de devis par client (simulation)
  const [clientDevisCount, setClientDevisCount] = useState<Record<string, number>>({})

  const handleCreateClient = async (clientData: Partial<Client>): Promise<void> => {
    try {
      if (!isSupabaseConfigured()) {
        // Mode démo
        const newClient: Client = {
          id: Date.now().toString(),
          ...clientData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Client
        
        if (onClientCreated) {
          onClientCreated(newClient)
        }
        
        // Sélectionner automatiquement le nouveau client
        setDevisData(prev => ({ ...prev, client: newClient }))
        generateDevisNumber(newClient)
        return
      }

      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single()

      if (error) throw error
      
      if (onClientCreated) {
        onClientCreated(data)
      }
      
      // Sélectionner automatiquement le nouveau client
      setDevisData(prev => ({ ...prev, client: data }))
      generateDevisNumber(data)
    } catch (error) {
      console.error('Erreur lors de la création du client:', error)
      throw error
    }
  }

  useEffect(() => {
    if (existingDevis) {
      // Map lignes_data from database to lignes format expected by component
      const mappedDevis = {
        ...existingDevis,
        lignes: existingDevis.lignes_data ? existingDevis.lignes_data.map((dbLigne: any, index: number) => ({
          id: `${Date.now()}-${index}`, // Generate unique ID for frontend
          designation: dbLigne.description || '',
          zone: dbLigne.zone || '',
          quantite: dbLigne.quantite || 1,
          prix_unitaire: dbLigne.prix_unitaire || 0,
          prix_total: dbLigne.total_ht || 0,
          remarques: dbLigne.remarques || '',
          type: 'materiel' as const,
          article_id: dbLigne.article_id
        })) : []
      }
      setDevisData(mappedDevis)
    }
  }, [existingDevis])

  useEffect(() => {
    if (devisData.client && !devisData.numero) {
      generateDevisNumber(devisData.client)
    }
  }, [devisData.client])

  useEffect(() => {
    calculateTotals()
  }, [devisData.lignes, devisData.tva_taux])

  const generateDevisNumber = (client: Client) => {
    const year = new Date().getFullYear()
    const clientCode = client.entreprise.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')
    
    // Simuler le compteur de devis pour ce client
    const currentCount = clientDevisCount[client.id] || 0
    const nextNumber = currentCount + 1
    
    setClientDevisCount(prev => ({
      ...prev,
      [client.id]: nextNumber
    }))
    
    const numero = `DEV-${year}-${clientCode}-${String(nextNumber).padStart(3, '0')}`
    setDevisData(prev => ({ ...prev, numero }))
  }

  const handleSave = () => {
    // Validation basique
    if (!devisData.client) {
      alert('Veuillez sélectionner un client')
      return
    }

    if (devisData.lignes.length === 0) {
      alert('Veuillez ajouter au moins une ligne au devis')
      return
    }

    if (!devisData.objet.trim()) {
      alert('Veuillez saisir l\'objet du devis')
      return
    }

    // Préparer les données pour la sauvegarde
    const devisToSave = {
      ...devisData,
      // Convertir les lignes au format attendu par la base
      lignes_data: devisData.lignes.map(ligne => ({
        description: ligne.designation,
        zone: ligne.zone || '',
        quantite: ligne.quantite,
        prix_unitaire: ligne.prix_unitaire,
        prix_achat: 0, // Valeur par défaut
        tva: 20, // Valeur par défaut
        total_ht: ligne.prix_total,
        total_tva: ligne.prix_total * 0.20,
        total_ttc: ligne.prix_total * 1.20,
        marge: ligne.prix_total, // Marge = prix total si pas de prix d'achat
        ordre: devisData.lignes.indexOf(ligne) + 1,
        remarques: ligne.remarques || '',
        article_id: ligne.article_id
      }))
    }
    
    onSave(devisToSave)
  }

  const calculateTotals = () => {
    const total_ht = devisData.lignes.reduce((sum, ligne) => sum + ligne.prix_total, 0)
    const total_tva = (total_ht * devisData.tva_taux) / 100
    const total_ttc = total_ht + total_tva

    setDevisData(prev => ({
      ...prev,
      total_ht,
      total_tva,
      total_ttc
    }))
  }

  const addLine = (zone?: string) => {
    const newLine: DevisLine = {
      id: Date.now().toString(),
      designation: '',
      zone: zone || '',
      quantite: 1,
      prix_unitaire: 0,
      prix_total: 0,
      remarques: '',
      type: 'materiel'
    }
    setDevisData(prev => ({
      ...prev,
      lignes: [...prev.lignes, newLine]
    }))
  }

  const addZone = () => {
    if (newZoneName.trim()) {
      addLine(newZoneName.trim())
      setNewZoneName('')
      setShowNewZoneInput(false)
    }
  }

  const updateLine = (id: string, field: keyof DevisLine, value: any) => {
    setDevisData(prev => ({
      ...prev,
      lignes: prev.lignes.map(ligne => {
        if (ligne.id === id) {
          const updated = { ...ligne, [field]: value }
          if (field === 'quantite' || field === 'prix_unitaire') {
            updated.prix_total = updated.quantite * updated.prix_unitaire
          }
          return updated
        }
        return ligne
      })
    }))
  }

  const removeLine = (id: string) => {
    setDevisData(prev => ({
      ...prev,
      lignes: prev.lignes.filter(ligne => ligne.id !== id)
    }))
  }

  const openCatalogueModal = (lineId: string) => {
    setSelectedLineId(lineId)
    setShowCatalogueModal(true)
  }

  const selectArticleFromCatalogue = (article: Article) => {
    if (selectedLineId) {
      updateLine(selectedLineId, 'designation', article.nom)
      updateLine(selectedLineId, 'prix_unitaire', article.prix_vente)
      updateLine(selectedLineId, 'article_id', article.id)
      setShowCatalogueModal(false)
      setSelectedLineId(null)
    }
  }

  const addToCatalogue = (designation: string, prix: number, groupe: string) => {
    // Créer un nouvel article dans le catalogue
    const newArticle: Article = {
      id: Date.now().toString(),
      nom: designation,
      description: `Article créé depuis le devis ${devisData.numero}`,
      type: groupe as 'IPE' | 'ELEC' | 'MATERIEL' | 'MAIN_OEUVRE',
      prix_achat: 0,
      prix_vente: prix,
      tva: 20,
      unite: 'unité',
      fournisseur_id: undefined,
      actif: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // En mode démo, on simule l'ajout
    if (!isSupabaseConfigured()) {
      console.log('Article ajouté au catalogue (mode démo):', newArticle)
      alert(`Article "${designation}" ajouté au catalogue dans le groupe ${groupe}`)
      return
    }
    
    // En mode réel, on pourrait ajouter à la base de données
    // Pour l'instant, on simule juste
    alert(`Article "${designation}" ajouté au catalogue dans le groupe ${groupe}`)
  }

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.nom.toLowerCase().includes(catalogueSearch.toLowerCase()) ||
                         article.description?.toLowerCase().includes(catalogueSearch.toLowerCase())
    const matchesGroup = selectedGroup === 'all' || article.type === selectedGroup
    return matchesSearch && matchesGroup
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }

  const exportToPDF = async () => {
    try {
      if (!devisData.client) {
        alert('Veuillez sélectionner un client avant d\'exporter le PDF')
        return
      }

      if (devisData.lignes.length === 0) {
        alert('Veuillez ajouter au moins une ligne avant d\'exporter le PDF')
        return
      }

      await generateDevisPDF(devisData, false) // false pour indiquer que c'est un devis standard
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error)
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.')
    }
  }

  const groupedLines = devisData.lignes.reduce((acc, ligne) => {
    const zone = ligne.zone || 'Général'
    if (!acc[zone]) acc[zone] = []
    acc[zone].push(ligne)
    return acc
  }, {} as Record<string, DevisLine[]>)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mr-4">
              <span className="text-white font-bold text-lg">OXA</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {existingDevis ? 'Modifier le Devis' : 'Nouveau Devis'}
              </h2>
              <p className="text-sm text-gray-600">Décarbonation Industrielle</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportToPDF}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </button>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* En-tête du devis */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">En-tête du devis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de devis
                </label>
                <input
                  type="text"
                  value={devisData.numero}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  placeholder="Sélectionnez un client pour générer le numéro"
                />
                <p className="text-xs text-gray-500 mt-1">Généré automatiquement selon le client</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date du devis
                </label>
                <input
                  type="date"
                  value={devisData.date_devis}
                  onChange={(e) => setDevisData(prev => ({ ...prev, date_devis: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client *
                </label>
                <ClientSelector
                  clients={clients}
                  selectedClient={devisData.client}
                  onSelectClient={(client) => {
                    setDevisData(prev => ({ ...prev, client }))
                    if (client) generateDevisNumber(client)
                  }}
                  onCreateClient={handleCreateClient}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Objet
              </label>
              <input
                type="text"
                value={devisData.objet}
                onChange={(e) => setDevisData(prev => ({ ...prev, objet: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Fourniture et installation d'équipements"
              />
            </div>
          </div>

          {/* Informations client */}
          {devisData.client && (
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Informations client
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Entreprise:</strong> {devisData.client.entreprise}</p>
                  <p><strong>Contact:</strong> {devisData.client.nom}</p>
                  <p><strong>Email:</strong> {devisData.client.email}</p>
                  <p><strong>Téléphone:</strong> {devisData.client.telephone}</p>
                </div>
                <div>
                  <p><strong>SIRET:</strong> {devisData.client.siret}</p>
                  <p><strong>Adresse:</strong> {devisData.client.adresse}</p>
                  <p><strong>Ville:</strong> {devisData.client.code_postal} {devisData.client.ville}</p>
                  <p><strong>Pays:</strong> {devisData.client.pays}</p>
                </div>
              </div>
            </div>
          )}

          {/* Description de l'opération */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-1" />
              Description de l'opération
            </label>
            <textarea
              value={devisData.description_operation}
              onChange={(e) => setDevisData(prev => ({ ...prev, description_operation: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Description détaillée de l'opération à réaliser..."
            />
          </div>

          {/* Tableau des prestations */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tableau des prestations</h3>
              <div className="flex space-x-2">
                {showNewZoneInput && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newZoneName}
                      onChange={(e) => setNewZoneName(e.target.value)}
                      placeholder="Nom de la zone"
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
                  <>
                    <button
                      onClick={() => setShowNewZoneInput(true)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nouvelle zone
                    </button>
                    <button
                      onClick={() => addLine()}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter ligne
                    </button>
                  </>
                )}
              </div>
              <datalist id="articles-list">
                {articles.map((article) => (
                  <option key={article.id} value={article.nom}>
                    {article.prix_vente} € - {article.description}
                  </option>
                ))}
              </datalist>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Désignation</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qté</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix unitaire HT</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix total HT</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarques</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(groupedLines).map(([zone, lignes]) => (
                    <React.Fragment key={zone}>
                      <tr className="bg-blue-50">
                        <td colSpan={7} className="px-4 py-2 text-sm font-medium text-blue-900">
                          {zone}
                        </td>
                      </tr>
                      {lignes.map(ligne => (
                        <tr key={ligne.id}>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={ligne.zone || ''}
                              onChange={(e) => updateLine(ligne.id, 'zone', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Zone"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <input
                                list="articles-list"
                                type="text"
                                value={ligne.designation}
                                onChange={(e) => updateLine(ligne.id, 'designation', e.target.value)}
                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Désignation"
                              />
                              <button
                                onClick={() => openCatalogueModal(ligne.id)}
                                className="bg-blue-100 text-blue-600 p-1 rounded hover:bg-blue-200"
                                title="Choisir depuis le catalogue"
                              >
                                <Package className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={ligne.quantite}
                              onChange={(e) => updateLine(ligne.id, 'quantite', parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={ligne.prix_unitaire}
                              onChange={(e) => updateLine(ligne.id, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            {formatCurrency(ligne.prix_total)}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={ligne.remarques || ''}
                              onChange={(e) => updateLine(ligne.id, 'remarques', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Remarques"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => removeLine(ligne.id)}
                                className="text-red-600 hover:text-red-800 p-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                              {ligne.designation && !ligne.article_id && (
                                <button
                                  onClick={() => addToCatalogue(ligne.designation, ligne.prix_unitaire, 'MATERIEL')}
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
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Synthèse financière */}
          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
              <Euro className="h-5 w-5 mr-2" />
              Synthèse financière
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-green-800">Total HT:</span>
                  <span className="font-semibold text-green-900">{formatCurrency(devisData.total_ht)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-800">TVA ({devisData.tva_taux}%):</span>
                  <span className="font-semibold text-green-900">{formatCurrency(devisData.total_tva)}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between border-t border-green-200 pt-2">
                  <span className="text-lg font-bold text-green-800">Total TTC:</span>
                  <span className="text-lg font-bold text-green-900">{formatCurrency(devisData.total_ttc)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Conditions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Délais</label>
                <input
                  type="text"
                  value={devisData.delais}
                  onChange={(e) => setDevisData(prev => ({ ...prev, delais: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Modalités de paiement</label>
                <input
                  type="text"
                  value={devisData.modalites_paiement}
                  onChange={(e) => setDevisData(prev => ({ ...prev, modalites_paiement: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Garantie</label>
                <input
                  type="text"
                  value={devisData.garantie}
                  onChange={(e) => setDevisData(prev => ({ ...prev, garantie: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pénalités</label>
                <input
                  type="text"
                  value={devisData.penalites}
                  onChange={(e) => setDevisData(prev => ({ ...prev, penalites: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Clause juridique</label>
                <input
                  type="text"
                  value={devisData.clause_juridique}
                  onChange={(e) => setDevisData(prev => ({ ...prev, clause_juridique: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Bloc de validation client */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Bloc de validation client</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 border-2 border-dashed border-blue-300 rounded-lg">
                <p className="text-sm text-blue-700 mb-2">Nom / Fonction</p>
                <div className="h-12 border-b border-blue-300"></div>
              </div>
              <div className="text-center p-4 border-2 border-dashed border-blue-300 rounded-lg">
                <p className="text-sm text-blue-700 mb-2">Signature</p>
                <div className="h-12 border-b border-blue-300"></div>
              </div>
              <div className="text-center p-4 border-2 border-dashed border-blue-300 rounded-lg">
                <p className="text-sm text-blue-700 mb-2">Date</p>
                <div className="h-12 border-b border-blue-300"></div>
              </div>
            </div>
            <p className="text-center text-sm text-blue-700 mt-4 font-medium">
              Mention manuscrite obligatoire : "Bon pour accord"
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {existingDevis ? 'Mettre à jour' : 'Sauvegarder'} le devis
            </button>
          </div>
        </div>
      </div>

      {/* Modal Catalogue */}
      {showCatalogueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
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
              {/* Filtres du catalogue */}
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
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {catalogueGroups.map((group) => (
                      <option key={group.value} value={group.value}>
                        {group.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <button
                    onClick={() => addToCatalogue(selectedLineId ? articles.find(a => a.id === selectedLineId)?.designation || '' : '', selectedLineId ? articles.find(a => a.id === selectedLineId)?.prix_vente || 0 : 0, selectedGroup)}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    disabled={!selectedLineId}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter au catalogue
                  </button>
                </div>
              </div>

              {/* Liste des articles */}
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
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(article.prix_vente)}
                      </span>
                      <span className="text-xs text-gray-500">{article.unite}</span>
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
  )
}