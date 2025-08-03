import React, { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured, Client, Article } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { 
  FileText, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  Euro,
  Save,
  X,
  User,
  Package,
  Calculator,
  Zap
} from 'lucide-react'
import { ClientSelector } from './ClientSelector'
import { ArticleSelector } from './ArticleSelector'
import { generateDevisPDF } from '../../utils/pdfExport'

interface CEEDevis {
  id?: string
  numero?: string
  client_id: string
  client?: Client
  statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire'
  date_devis: string
  date_validite: string
  objet: string
  description_operation: string
  total_ht: number
  total_tva: number
  total_ttc: number
  tva_taux: number
  cee_kwh_cumac: number
  cee_prix_unitaire: number
  cee_montant_total: number
  reste_a_payer_ht: number
  remarques?: string
  type: string
  modalites_paiement: string
  garantie: string
  penalites: string
  clause_juridique: string
  delais: string
  lignes_data: DevisLine[]
  commercial_id?: string
  created_at?: string
  updated_at?: string
}

interface DevisLine {
  id: string
  designation: string
  description?: string
  zone: string
  quantite: number
  prix_unitaire: number
  prix_total: number
  tva: number
  type: 'materiel' | 'service' | 'parametrage' | 'etude'
  ordre: number
  article_id?: string
}

interface CEECalculation {
  profil_fonctionnement: '1x8h' | '2x8h' | '3x8h_weekend_off' | '3x8h_24_7' | 'continu_24_7'
  puissance_nominale: number
  duree_contrat: number
  coefficient_activite: number
  facteur_f: number
  kwh_cumac: number
  tarif_kwh: number
  prime_estimee: number
  operateur_nom: string
  notes?: string
}

export function CEEDevisManager() {
  const { profile } = useAuth()
  const [devis, setDevis] = useState<CEEDevis[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingDevis, setEditingDevis] = useState<CEEDevis | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState<CEEDevis>({
    client_id: '',
    statut: 'brouillon',
    date_devis: new Date().toISOString().split('T')[0],
    date_validite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    objet: 'Devis CEE - Décarbonation industrielle',
    description_operation: '',
    total_ht: 0,
    total_tva: 0,
    total_ttc: 0,
    tva_taux: 20,
    cee_kwh_cumac: 0,
    cee_prix_unitaire: 0.002,
    cee_montant_total: 0,
    reste_a_payer_ht: 0,
    remarques: '',
    type: 'CEE',
    modalites_paiement: '30% à la commande, 70% à la livraison',
    garantie: '2 ans pièces et main d\'œuvre',
    penalites: 'Pénalités de retard : 0,1% par jour de retard',
    clause_juridique: 'Tout litige relève de la compétence du Tribunal de Commerce de Paris',
    delais: '4 à 6 semaines après validation du devis',
    lignes_data: []
  })

  const [ceeData, setCeeData] = useState<CEECalculation>({
    profil_fonctionnement: '2x8h',
    puissance_nominale: 0,
    duree_contrat: 3,
    coefficient_activite: 2,
    facteur_f: 3,
    kwh_cumac: 0,
    tarif_kwh: 0.002,
    prime_estimee: 0,
    operateur_nom: 'TotalEnergies',
    notes: ''
  })

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'brouillon', label: 'Brouillon' },
    { value: 'envoye', label: 'Envoyé' },
    { value: 'accepte', label: 'Accepté' },
    { value: 'refuse', label: 'Refusé' },
    { value: 'expire', label: 'Expiré' }
  ]

  const profilsOptions = [
    { value: '1x8h', label: '1×8h (8h/jour)', coefficient: 1 },
    { value: '2x8h', label: '2×8h (16h/jour)', coefficient: 2 },
    { value: '3x8h_weekend_off', label: '3×8h sans weekend', coefficient: 2.5 },
    { value: '3x8h_24_7', label: '3×8h continu', coefficient: 3 },
    { value: 'continu_24_7', label: 'Continu 24h/7j', coefficient: 3 }
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      if (!isSupabaseConfigured()) {
        // Demo data
        setClients([
          {
            id: '1',
            nom: 'Jean Dupont',
            entreprise: 'Industrie Verte SA',
            siret: '12345678901234',
            email: 'jean.dupont@industrie-verte.fr',
            telephone: '01 23 45 67 89',
            adresse: '123 Rue de la Paix',
            ville: 'Paris',
            code_postal: '75001',
            pays: 'France',
            contact_principal: 'Jean Dupont - Directeur Technique',
            notes: 'Client premium',
            commercial_id: profile?.id,
            prospect_id: '1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        
        setArticles([
          {
            id: '1',
            nom: 'Récupérateur de chaleur industriel',
            description: 'Système de récupération de chaleur haute performance',
            type: 'IPE',
            prix_achat: 8000,
            prix_vente: 12000,
            tva: 20,
            unite: 'unité',
            fournisseur_id: '1',
            actif: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        
        setDevis([])
        setLoading(false)
        return
      }

      const [devisData, clientsData, articlesData] = await Promise.all([
        supabase.from('devis').select(`
          *,
          client:clients(*)
        `).eq('type', 'CEE').order('created_at', { ascending: false }),
        supabase.from('clients').select('*').order('entreprise'),
        supabase.from('articles').select('*').eq('actif', true).order('nom')
      ])

      if (devisData.error) throw devisData.error
      if (clientsData.error) throw clientsData.error
      if (articlesData.error) throw articlesData.error

      setDevis(devisData.data || [])
      setClients(clientsData.data || [])
      setArticles(articlesData.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateCEE = () => {
    const kwh_cumac = 29.4 * ceeData.coefficient_activite * ceeData.puissance_nominale * ceeData.facteur_f
    const prime_estimee = kwh_cumac * ceeData.tarif_kwh
    
    setCeeData(prev => ({
      ...prev,
      kwh_cumac,
      prime_estimee
    }))

    setFormData(prev => ({
      ...prev,
      cee_kwh_cumac: kwh_cumac,
      cee_prix_unitaire: ceeData.tarif_kwh,
      cee_montant_total: prime_estimee,
      reste_a_payer_ht: prev.total_ht - prime_estimee
    }))
  }

  const calculateTotals = () => {
    const total_ht = formData.lignes_data.reduce((sum, ligne) => sum + ligne.prix_total, 0)
    const total_tva = total_ht * (formData.tva_taux / 100)
    const total_ttc = total_ht + total_tva
    const reste_a_payer_ht = total_ht - formData.cee_montant_total

    setFormData(prev => ({
      ...prev,
      total_ht,
      total_tva,
      total_ttc,
      reste_a_payer_ht
    }))
  }

  const addLigne = (article?: Article) => {
    const newLigne: DevisLine = {
      id: Date.now().toString(),
      designation: article?.nom || '',
      description: article?.description || '',
      zone: 'Zone 1',
      quantite: 1,
      prix_unitaire: article?.prix_vente || 0,
      prix_total: article?.prix_vente || 0,
      tva: article?.tva || 20,
      type: 'materiel',
      ordre: formData.lignes_data.length + 1,
      article_id: article?.id
    }

    setFormData(prev => ({
      ...prev,
      lignes_data: [...prev.lignes_data, newLigne]
    }))
  }

  const updateLigne = (id: string, updates: Partial<DevisLine>) => {
    setFormData(prev => ({
      ...prev,
      lignes_data: prev.lignes_data.map(ligne => {
        if (ligne.id === id) {
          const updated = { ...ligne, ...updates }
          if ('quantite' in updates || 'prix_unitaire' in updates) {
            updated.prix_total = updated.quantite * updated.prix_unitaire
          }
          return updated
        }
        return ligne
      })
    }))
  }

  const removeLigne = (id: string) => {
    setFormData(prev => ({
      ...prev,
      lignes_data: prev.lignes_data.filter(ligne => ligne.id !== id)
    }))
  }

  const handleSaveDevis = async () => {
    if (!formData.client_id) {
      alert('Veuillez sélectionner un client')
      return
    }

    if (formData.lignes_data.length === 0) {
      alert('Veuillez ajouter au moins une ligne au devis')
      return
    }

    setSaving(true)
    try {
      console.log('=== DÉBUT SAUVEGARDE DEVIS ===')
      console.log('Données du formulaire:', formData)
      console.log('Données CEE:', ceeData)

      // Préparer les données pour Supabase
      const devisData = {
        numero: formData.numero || `DEV-${Date.now()}`,
        client_id: formData.client_id,
        statut: formData.statut,
        date_devis: formData.date_devis,
        date_validite: formData.date_validite,
        objet: formData.objet,
        description_operation: formData.description_operation,
        total_ht: formData.total_ht,
        total_tva: formData.total_tva,
        total_ttc: formData.total_ttc,
        tva_taux: formData.tva_taux,
        cee_kwh_cumac: formData.cee_kwh_cumac,
        cee_prix_unitaire: formData.cee_prix_unitaire,
        cee_montant_total: formData.cee_montant_total,
        reste_a_payer_ht: formData.reste_a_payer_ht,
        remarques: formData.remarques,
        type: 'CEE',
        modalites_paiement: formData.modalites_paiement,
        garantie: formData.garantie,
        penalites: formData.penalites,
        clause_juridique: formData.clause_juridique,
        delais: formData.delais,
        lignes_data: formData.lignes_data,
        cee_data: ceeData,
        commercial_id: profile?.id
      }

      console.log('Données nettoyées pour Supabase:', devisData)

      if (!isSupabaseConfigured()) {
        const newDevis = {
          ...devisData,
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setDevis([newDevis, ...devis])
        setShowForm(false)
        resetForm()
        alert('Devis sauvegardé avec succès (mode démo)')
        return
      }

      let result
      if (editingDevis?.id) {
        // Mise à jour
        result = await supabase
          .from('devis')
          .update(devisData)
          .eq('id', editingDevis.id)
          .select(`
            *,
            client:clients(*)
          `)
          .single()
      } else {
        // Création
        result = await supabase
          .from('devis')
          .insert([devisData])
          .select(`
            *,
            client:clients(*)
          `)
          .single()
      }

      if (result.error) {
        console.error('Erreur Supabase:', result.error)
        throw result.error
      }

      console.log('Devis sauvegardé:', result.data)

      // Mettre à jour la liste
      if (editingDevis?.id) {
        setDevis(devis.map(d => d.id === editingDevis.id ? result.data : d))
      } else {
        setDevis([result.data, ...devis])
      }

      setShowForm(false)
      resetForm()
      alert('Devis sauvegardé avec succès')

    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      alert(`Erreur lors de la sauvegarde: ${error.message || 'Erreur inconnue'}`)
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      client_id: '',
      statut: 'brouillon',
      date_devis: new Date().toISOString().split('T')[0],
      date_validite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      objet: 'Devis CEE - Décarbonation industrielle',
      description_operation: '',
      total_ht: 0,
      total_tva: 0,
      total_ttc: 0,
      tva_taux: 20,
      cee_kwh_cumac: 0,
      cee_prix_unitaire: 0.002,
      cee_montant_total: 0,
      reste_a_payer_ht: 0,
      remarques: '',
      type: 'CEE',
      modalites_paiement: '30% à la commande, 70% à la livraison',
      garantie: '2 ans pièces et main d\'œuvre',
      penalites: 'Pénalités de retard : 0,1% par jour de retard',
      clause_juridique: 'Tout litige relève de la compétence du Tribunal de Commerce de Paris',
      delais: '4 à 6 semaines après validation du devis',
      lignes_data: []
    })
    setCeeData({
      profil_fonctionnement: '2x8h',
      puissance_nominale: 0,
      duree_contrat: 3,
      coefficient_activite: 2,
      facteur_f: 3,
      kwh_cumac: 0,
      tarif_kwh: 0.002,
      prime_estimee: 0,
      operateur_nom: 'TotalEnergies',
      notes: ''
    })
    setEditingDevis(null)
  }

  const handleCreateClient = async (clientData: Partial<Client>) => {
    try {
      if (!isSupabaseConfigured()) {
        const newClient: Client = {
          id: Date.now().toString(),
          ...clientData,
          commercial_id: profile?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Client
        setClients([newClient, ...clients])
        return
      }

      const { data, error } = await supabase
        .from('clients')
        .insert([{ ...clientData, commercial_id: profile?.id }])
        .select()
        .single()

      if (error) throw error
      setClients([data, ...clients])
    } catch (error) {
      console.error('Error creating client:', error)
      throw error
    }
  }

  const handleCreateArticle = async (articleData: Partial<Article>) => {
    try {
      if (!isSupabaseConfigured()) {
        const newArticle: Article = {
          id: Date.now().toString(),
          ...articleData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Article
        setArticles([newArticle, ...articles])
        return newArticle
      }

      const { data, error } = await supabase
        .from('articles')
        .insert([articleData])
        .select()
        .single()

      if (error) throw error
      setArticles([data, ...articles])
      return data
    } catch (error) {
      console.error('Error creating article:', error)
      throw error
    }
  }

  // Recalculer les totaux quand les lignes changent
  useEffect(() => {
    calculateTotals()
  }, [formData.lignes_data, formData.tva_taux, formData.cee_montant_total])

  const filteredDevis = devis.filter(d => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = d.numero?.toLowerCase().includes(searchLower) ||
                         d.objet?.toLowerCase().includes(searchLower) ||
                         d.client?.entreprise?.toLowerCase().includes(searchLower)
    const matchesStatus = statusFilter === 'all' || d.statut === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FileText className="h-8 w-8 mr-3 text-blue-600" />
              Devis CEE
            </h1>
            <p className="text-gray-600 mt-1">
              Gestion des devis Certificats d'Économies d'Énergie
            </p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau devis CEE
          </button>
        </div>
      </div>

      {!showForm ? (
        <>
          {/* Filters */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par numéro, objet ou client..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Devis Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Numéro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Objet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant HT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prime CEE
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDevis.map((devisItem) => (
                    <tr key={devisItem.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{devisItem.numero}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(devisItem.date_devis || '').toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{devisItem.client?.entreprise}</div>
                        <div className="text-sm text-gray-500">{devisItem.client?.nom}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{devisItem.objet}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(devisItem.total_ht || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(devisItem.cee_montant_total || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          devisItem.statut === 'brouillon' ? 'bg-gray-100 text-gray-800' :
                          devisItem.statut === 'envoye' ? 'bg-blue-100 text-blue-800' :
                          devisItem.statut === 'accepte' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {statusOptions.find(s => s.value === devisItem.statut)?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingDevis(devisItem)
                              setFormData(devisItem)
                              setShowForm(true)
                            }}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredDevis.length === 0 && (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun devis CEE</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Commencez par créer votre premier devis CEE.
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Formulaire de devis */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingDevis ? 'Modifier le devis CEE' : 'Nouveau devis CEE'}
            </h2>
            <button
              onClick={() => {
                setShowForm(false)
                resetForm()
              }}
              className="text-gray-400 hover:text-gray-600 p-1 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-8">
            {/* Sélection du client */}
            <ClientSelector
              clients={clients}
              selectedClient={clients.find(c => c.id === formData.client_id) || null}
              onSelectClient={(client) => setFormData(prev => ({ ...prev, client_id: client.id }))}
              onCreateClient={handleCreateClient}
            />

            {/* Informations générales */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informations générales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date du devis
                  </label>
                  <input
                    type="date"
                    value={formData.date_devis}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_devis: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de validité
                  </label>
                  <input
                    type="date"
                    value={formData.date_validite}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_validite: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objet du devis
                  </label>
                  <input
                    type="text"
                    value={formData.objet}
                    onChange={(e) => setFormData(prev => ({ ...prev, objet: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Objet du devis"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description de l'opération
                  </label>
                  <textarea
                    value={formData.description_operation}
                    onChange={(e) => setFormData(prev => ({ ...prev, description_operation: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Description détaillée de l'opération"
                  />
                </div>
              </div>
            </div>

            {/* Calculateur CEE */}
            <div className="bg-yellow-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-yellow-600" />
                Calculateur CEE
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profil de fonctionnement
                  </label>
                  <select
                    value={ceeData.profil_fonctionnement}
                    onChange={(e) => {
                      const profil = profilsOptions.find(p => p.value === e.target.value)
                      setCeeData(prev => ({
                        ...prev,
                        profil_fonctionnement: e.target.value as any,
                        coefficient_activite: profil?.coefficient || 2
                      }))
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {profilsOptions.map(profil => (
                      <option key={profil.value} value={profil.value}>
                        {profil.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Puissance nominale (kW)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={ceeData.puissance_nominale}
                    onChange={(e) => setCeeData(prev => ({ ...prev, puissance_nominale: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée d'engagement (années)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="5.45"
                    value={ceeData.duree_contrat}
                    onChange={(e) => setCeeData(prev => ({ ...prev, duree_contrat: parseFloat(e.target.value) || 3, facteur_f: parseFloat(e.target.value) || 3 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tarif CEE (€/kWh cumac)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={ceeData.tarif_kwh}
                    onChange={(e) => setCeeData(prev => ({ ...prev, tarif_kwh: parseFloat(e.target.value) || 0.002 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={calculateCEE}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Calculer les CEE
                  </button>
                </div>
              </div>
              
              {ceeData.kwh_cumac > 0 && (
                <div className="mt-4 p-4 bg-white rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">kWh cumac:</span>
                      <span className="ml-2 font-medium">{ceeData.kwh_cumac.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Prime estimée:</span>
                      <span className="ml-2 font-medium text-green-600">{formatCurrency(ceeData.prime_estimee)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Opérateur:</span>
                      <span className="ml-2 font-medium">{ceeData.operateur_nom}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Lignes du devis */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Lignes du devis</h3>
                <div className="flex space-x-2">
                  <ArticleSelector
                    articles={articles}
                    onSelectArticle={addLigne}
                    onCreateArticle={handleCreateArticle}
                  />
                  <button
                    type="button"
                    onClick={() => addLigne()}
                    className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ligne vide
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Désignation</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qté</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix unit.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.lignes_data.map((ligne) => (
                      <tr key={ligne.id}>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={ligne.designation}
                            onChange={(e) => updateLigne(ligne.id, { designation: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Désignation"
                          />
                          {ligne.description && (
                            <input
                              type="text"
                              value={ligne.description}
                              onChange={(e) => updateLigne(ligne.id, { description: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs mt-1"
                              placeholder="Description"
                            />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={ligne.zone}
                            onChange={(e) => updateLigne(ligne.id, { zone: e.target.value })}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            value={ligne.quantite}
                            onChange={(e) => updateLigne(ligne.id, { quantite: parseFloat(e.target.value) || 0 })}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            value={ligne.prix_unitaire}
                            onChange={(e) => updateLigne(ligne.id, { prix_unitaire: parseFloat(e.target.value) || 0 })}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium">{formatCurrency(ligne.prix_total)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => removeLigne(ligne.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totaux */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Récapitulatif financier</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total HT:</span>
                    <span className="font-medium">{formatCurrency(formData.total_ht)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TVA ({formData.tva_taux}%):</span>
                    <span className="font-medium">{formatCurrency(formData.total_tva)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total TTC:</span>
                    <span>{formatCurrency(formData.total_ttc)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-green-600">
                    <span>Prime CEE:</span>
                    <span className="font-medium">- {formatCurrency(formData.cee_montant_total)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Reste à payer HT:</span>
                    <span>{formatCurrency(formData.reste_a_payer_ht)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveDevis}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? 'Sauvegarde...' : 'Enregistrer le devis'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}