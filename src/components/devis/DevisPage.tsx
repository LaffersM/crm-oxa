import React, { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured, OXADevis, Client, Article } from '../../lib/supabase'
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
  TrendingUp,
  Send,
  Check,
  X,
  Clock,
  Zap
} from 'lucide-react'
import OXADevisGenerator from './OXADevisGenerator'
import { StandardDevisGenerator } from './StandardDevisGenerator'
import { DevisDetails } from './DevisDetails'

export function DevisPage() {
  const { profile } = useAuth()
  const [devis, setDevis] = useState<OXADevis[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showOXAGenerator, setShowOXAGenerator] = useState(false)
  const [showStandardGenerator, setShowStandardGenerator] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedDevis, setSelectedDevis] = useState<OXADevis | null>(null)
  const [editingDevis, setEditingDevis] = useState<OXADevis | null>(null)

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts', color: 'gray' },
    { value: 'brouillon', label: 'Brouillon', color: 'gray' },
    { value: 'envoye', label: 'Envoyé', color: 'blue' },
    { value: 'accepte', label: 'Accepté', color: 'green' },
    { value: 'refuse', label: 'Refusé', color: 'red' },
    { value: 'expire', label: 'Expiré', color: 'orange' }
  ]

  const typeOptions = [
    { value: 'all', label: 'Tous les types' },
    { value: 'IPE', label: 'IPE' },
    { value: 'ELEC', label: 'ELEC' },
    { value: 'MATERIEL', label: 'MATERIEL' },
    { value: 'MAIN_OEUVRE', label: 'Main d\'œuvre' }
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      if (!isSupabaseConfigured()) {
        // Demo data avec les nouvelles structures
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
            fournisseur_id: undefined,
            actif: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            nom: 'Installation et mise en service',
            description: 'Service d\'installation et de mise en service',
            type: 'MAIN_OEUVRE',
            prix_achat: 0,
            prix_vente: 2500,
            tva: 20,
            unite: 'jour',
            fournisseur_id: undefined,
            actif: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        
        setDevis([
          {
            id: '1',
            numero: 'OXA-2024-IND-001',
            date_devis: new Date().toISOString().split('T')[0],
            objet: 'Mise en place d\'un système de mesurage IPE',
            client_id: '1',
            description_operation: 'Installation d\'un système de récupération de chaleur pour optimiser l\'efficacité énergétique',
            zone: 'Zone production',
            lignes: [
              {
                id: '1',
                designation: 'Récupérateur de chaleur industriel',
                zone: 'Zone production',
                quantite: 1,
                prix_unitaire: 12000,
                prix_total: 12000,
                remarques: 'Installation incluse',
                type: 'materiel'
              }
            ],
            lignes_data: [
              {
                id: '1',
                designation: 'Récupérateur de chaleur industriel',
                zone: 'Zone production',
                quantite: 1,
                prix_unitaire: 12000,
                prix_total: 12000,
                remarques: 'Installation incluse',
                type: 'materiel'
              }
            ],
            cee_kwh_cumac: 1500,
            cee_prix_unitaire: 7.30,
            cee_montant_total: 10950,
            total_ht: 12000,
            tva_taux: 20,
            total_tva: 240,
            total_ttc: 1440,
            reste_a_payer_ht: 1050,
            remarques: 'Projet pilote pour la décarbonation',
            type: 'IPE',
            modalites_paiement: '30% à la commande, 70% à la livraison',
            garantie: '2 ans pièces et main d\'œuvre',
            penalites: 'Pénalités de retard : 0,1% par jour',
            clause_juridique: 'Tribunal de Commerce de Paris',
            statut: 'envoye',
            commercial_id: profile?.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        setLoading(false)
        return
      }

      const [devisData, clientsData, articlesData] = await Promise.all([
        supabase.from('devis').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('*'),
        supabase.from('articles').select('*')
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

  const handleCreateDevis = async (devisData: any) => {
    try {
      console.log('=== DÉBUT CRÉATION DEVIS ===')
      console.log('Données reçues:', devisData)
      
      if (!isSupabaseConfigured()) {
        const newDevis: OXADevis = {
          id: Date.now().toString(),
          ...devisData,
          commercial_id: profile?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setDevis([newDevis, ...devis])
        setShowOXAGenerator(false)
        setShowStandardGenerator(false)
        return
      }

      // Validation des données obligatoires
      if (!devisData.client?.id && !devisData.client_id) {
        throw new Error('Client requis pour créer un devis')
      }
      
      if (!devisData.objet || devisData.objet.trim() === '') {
        throw new Error('L\'objet du devis est requis')
      }
      
      // Transform data for Supabase - only keep valid database columns
      const supabaseData = {
        numero: devisData.numero || `DEV-${Date.now()}`,
        client_id: devisData.client?.id || devisData.client_id,
        statut: devisData.statut || 'brouillon',
        date_devis: devisData.date_devis || new Date().toISOString().split('T')[0],
        objet: devisData.objet.trim(),
        description_operation: devisData.description_operation,
        total_ht: devisData.total_ht || 0,
        total_tva: devisData.total_tva || 0,
        total_ttc: devisData.total_ttc || 0,
        tva_taux: devisData.tva_taux || 20,
        marge_totale: devisData.marge_totale || 0,
        cee_kwh_cumac: devisData.cee_kwh_cumac || 0,
        cee_prix_unitaire: devisData.cee_prix_unitaire || 0.002000,
        cee_montant_total: devisData.cee_montant_total || 0,
        reste_a_payer_ht: devisData.reste_a_payer_ht || devisData.total_ht || 0,
        remarques: devisData.remarques,
        type: devisData.type || 'MATERIEL',
        modalites_paiement: devisData.modalites_paiement || '30% à la commande, 70% à la livraison',
        garantie: devisData.garantie || '2 ans pièces et main d\'œuvre',
        penalites: devisData.penalites || 'Pénalités de retard : 0,1% par jour de retard',
        clause_juridique: devisData.clause_juridique || 'Tout litige relève de la compétence du Tribunal de Commerce de Paris',
        delais: devisData.delais || '4 à 6 semaines après validation du devis',
        lignes_data: devisData.lignes_data || [],
        commercial_id: profile?.id
      }

      // Nettoyer les valeurs undefined et null
      Object.keys(supabaseData).forEach(key => {
        if (supabaseData[key] === undefined) {
          delete supabaseData[key]
        }
      })
      
      console.log('Données nettoyées pour Supabase:', supabaseData)
      console.log('Profile ID:', profile?.id)
      
      const { data, error } = await supabase
        .from('devis')
        .insert([supabaseData])
        .select()
        .single()

      if (error) {
        console.error('Erreur Supabase détaillée:', error)
        console.error('Code erreur:', error.code)
        console.error('Message:', error.message)
        console.error('Détails:', error.details)
        console.error('Hint:', error.hint)
        throw error
      }
      
      console.log('Devis créé avec succès:', data)
      setDevis([data, ...devis])
      setShowOXAGenerator(false)
      setShowStandardGenerator(false)
    } catch (error) {
      console.error('Error creating devis:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      alert('Erreur lors de la création du devis: ' + errorMessage)
    }
  }

  const handleUpdateDevis = async (id: string, devisData: any) => {
    try {
      console.log('=== DÉBUT MISE À JOUR DEVIS ===')
      console.log('ID:', id)
      console.log('Données reçues:', devisData)
      
      if (!isSupabaseConfigured()) {
        setDevis(devis.map(d => 
          d.id === id ? { ...d, ...devisData, updated_at: new Date().toISOString() } : d
        ))
        setEditingDevis(null)
        setShowOXAGenerator(false)
        setShowStandardGenerator(false)
        return
      }

      // Validation des données obligatoires
      if (!devisData.client?.id && !devisData.client_id) {
        throw new Error('Client requis pour mettre à jour le devis')
      }
      
      if (!devisData.objet || devisData.objet.trim() === '') {
        throw new Error('L\'objet du devis est requis')
      }
      
      // Transform data for Supabase - only keep valid database columns
      const supabaseData = {
        numero: devisData.numero || `DEV-${Date.now()}`,
        client_id: devisData.client?.id || devisData.client_id,
        statut: devisData.statut,
        date_devis: devisData.date_devis || new Date().toISOString().split('T')[0],
        objet: devisData.objet.trim(),
        description_operation: devisData.description_operation,
        total_ht: devisData.total_ht,
        total_tva: devisData.total_tva,
        total_ttc: devisData.total_ttc,
        tva_taux: devisData.tva_taux,
        marge_totale: devisData.marge_totale,
        cee_kwh_cumac: devisData.cee_kwh_cumac,
        cee_prix_unitaire: devisData.cee_prix_unitaire,
        cee_montant_total: devisData.cee_montant_total,
        reste_a_payer_ht: devisData.reste_a_payer_ht,
        remarques: devisData.remarques,
        type: devisData.type,
        modalites_paiement: devisData.modalites_paiement,
        garantie: devisData.garantie,
        penalites: devisData.penalites,
        clause_juridique: devisData.clause_juridique,
        delais: devisData.delais,
        lignes_data: devisData.lignes_data,
        updated_at: new Date().toISOString()
      }

      // Nettoyer les valeurs undefined et null
      Object.keys(supabaseData).forEach(key => {
        if (supabaseData[key] === undefined) {
          delete supabaseData[key]
        }
      })
      
      console.log('Données nettoyées pour Supabase:', supabaseData)
      
      const { data, error } = await supabase
        .from('devis')
        .update(supabaseData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erreur Supabase détaillée:', error)
        console.error('Code erreur:', error.code)
        console.error('Message:', error.message)
        console.error('Détails:', error.details)
        console.error('Hint:', error.hint)
        throw error
      }
      
      console.log('Devis mis à jour avec succès:', data)
      setDevis(devis.map(d => d.id === id ? data : d))
      setEditingDevis(null)
      setShowOXAGenerator(false)
      setShowStandardGenerator(false)
    } catch (error) {
      console.error('Error updating devis:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      alert('Erreur lors de la mise à jour du devis: ' + errorMessage)
    }
  }

  const handleDeleteDevis = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) return

    try {
      if (!isSupabaseConfigured()) {
        setDevis(devis.filter(d => d.id !== id))
        return
      }

      const { error } = await supabase
        .from('devis')
        .delete()
        .eq('id', id)

      if (error) throw error
      setDevis(devis.filter(d => d.id !== id))
    } catch (error) {
      console.error('Error deleting devis:', error)
    }
  }

  const handleClientCreated = (newClient: Client) => {
    setClients([newClient, ...clients])
  }

  const handleArticleCreated = async (articleData: Partial<Article>) => {
    try {
      if (!isSupabaseConfigured()) {
        const newArticle: Article = {
          id: Date.now().toString(),
          ...articleData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Article
        setArticles([newArticle, ...articles])
        return
      }

      const { data, error } = await supabase
        .from('articles')
        .insert([articleData])
        .select()
        .single()

      if (error) throw error
      setArticles([data, ...articles])
    } catch (error) {
      console.error('Error creating article from devis:', error)
      throw error
    }
  }
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    return client ? `${client.nom} - ${client.entreprise}` : 'Client inconnu'
  }

  const filteredDevis = devis.filter(devis => {
    const client = clients.find(c => c.id === devis.client_id)
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = devis.numero.toLowerCase().includes(searchLower) ||
                         client?.nom.toLowerCase().includes(searchLower) ||
                         client?.entreprise.toLowerCase().includes(searchLower) ||
                         devis.objet.toLowerCase().includes(searchLower)
    const matchesStatus = statusFilter === 'all' || devis.statut === statusFilter
    const matchesType = typeFilter === 'all' || devis.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status)
    return statusOption?.color || 'gray'
  }

  const getStatusBadgeClass = (color: string) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800',
      orange: 'bg-orange-100 text-orange-800',
      gray: 'bg-gray-100 text-gray-800'
    }
    return colorClasses[color as keyof typeof colorClasses] || colorClasses.gray
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      brouillon: Clock,
      envoye: Send,
      accepte: Check,
      refuse: X,
      expire: Calendar
    }
    return icons[status as keyof typeof icons] || Clock
  }

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

  // Affichage des générateurs
  if (showOXAGenerator) {
    return (
      <OXADevisGenerator
        clients={clients}
        articles={articles}
        onClientCreated={handleClientCreated}
        onArticleCreated={handleArticleCreated}
        onSave={editingDevis 
          ? (data) => handleUpdateDevis(editingDevis.id, data)
          : handleCreateDevis
        }
        onCancel={() => {
          setShowOXAGenerator(false)
          setEditingDevis(null)
        }}
        existingDevis={editingDevis}
      />
    )
  }

  if (showStandardGenerator) {
    return (
      <StandardDevisGenerator
        clients={clients}
        articles={articles}
        onClientCreated={handleClientCreated}
        onArticleCreated={handleArticleCreated}
        onSave={editingDevis 
          ? (data) => handleUpdateDevis(editingDevis.id, data)
          : handleCreateDevis
        }
        onCancel={() => {
          setShowStandardGenerator(false)
          setEditingDevis(null)
        }}
        existingDevis={editingDevis}
      />
    )
  }

  if (showDetails && selectedDevis) {
    const client = clients.find(c => c.id === selectedDevis.client_id)
    return (
      <DevisDetails
        devis={selectedDevis}
        client={client}
        onClose={() => {
          setShowDetails(false)
          setSelectedDevis(null)
        }}
        onEdit={() => {
          setEditingDevis(selectedDevis)
          if (selectedDevis.cee_montant_total > 0) {
            setShowOXAGenerator(true)
          } else {
            setShowStandardGenerator(true)
          }
          setShowDetails(false)
        }}
      />
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
              Devis
            </h1>
            <p className="text-gray-600 mt-1">
              Gérez vos devis et propositions commerciales
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setEditingDevis(null)
                setShowStandardGenerator(true)
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Devis Standard
            </button>
            <button
              onClick={() => {
                setEditingDevis(null)
                setShowOXAGenerator(true)
              }}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center"
            >
              <Zap className="h-4 w-4 mr-2" />
              Devis CEE
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total devis</p>
              <p className="text-2xl font-bold text-gray-900">{devis.length}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">CA potentiel</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(devis.reduce((sum, d) => sum + d.total_ttc, 0))}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <Euro className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Primes CEE</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(devis.reduce((sum, d) => sum + (d.cee_montant_total || 0), 0))}
              </p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <Zap className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Acceptés</p>
              <p className="text-2xl font-bold text-gray-900">
                {devis.filter(d => d.statut === 'accepte').length}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <Check className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par numéro, client, objet..."
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
          <div className="sm:w-48">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {typeOptions.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
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
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant TTC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prime CEE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date création
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDevis.map((devis) => {
                const StatusIcon = getStatusIcon(devis.statut)
                return (
                  <tr key={devis.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{devis.numero}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getClientName(devis.client_id)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{devis.objet}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        devis.type === 'IPE' ? 'bg-blue-100 text-blue-800' :
                        devis.type === 'ELEC' ? 'bg-yellow-100 text-yellow-800' :
                        devis.type === 'MATERIEL' ? 'bg-green-100 text-green-800' :
                        devis.type === 'MAIN_OEUVRE' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {devis.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(getStatusColor(devis.statut))}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusOptions.find(s => s.value === devis.statut)?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(devis.total_ttc)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {devis.cee_montant_total ? formatCurrency(devis.cee_montant_total) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(devis.date_devis).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedDevis(devis)
                            setShowDetails(true)
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingDevis(devis)
                            if (devis.cee_montant_total > 0) {
                              setShowOXAGenerator(true)
                            } else {
                              setShowStandardGenerator(true)
                            }
                          }}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDevis(devis.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredDevis.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun devis</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Aucun devis ne correspond à vos critères de recherche.'
                : 'Commencez par créer votre premier devis.'
              }
            </p>
            <div className="mt-6 flex justify-center space-x-3">
              <button
                onClick={() => setShowStandardGenerator(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Devis Standard
              </button>
              <button
                onClick={() => setShowOXAGenerator(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
              >
                <Zap className="h-4 w-4 mr-2" />
                Devis CEE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}