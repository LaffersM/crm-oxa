import React, { useState, useEffect } from 'react'
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Calculator,
  Send,
  Check,
  X,
  Clock,
  AlertCircle,
  Download,
  Copy,
  Zap,
  Euro,
  Calendar,
  User,
  Building,
  Save,
  RefreshCw,
  List // <-- import ajouté !
} from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

// ==================== TYPES ====================

interface Client {
  id: string
  nom: string
  entreprise: string
  siret?: string
  email?: string
  telephone?: string
  adresse?: string
  ville?: string
  code_postal?: string
  contact_principal?: string
  created_at: string
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
}

interface CEEDevis {
  id: string
  numero: string
  date_devis: string
  date_validite: string
  client_id: string
  client?: Client
  objet: string
  description_operation: string
  statut: 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire'
  cee_data: CEECalculation
  lignes: DevisLine[]
  total_ht: number
  total_tva: number
  total_ttc: number
  prime_cee: number
  reste_a_payer: number
  commercial_id: string
  created_at: string
  updated_at: string
  notes?: string
}

// ==================== COMPOSANT PRINCIPAL ====================

export function CEEDevisManager() {
  const { profile } = useAuth()
  
  // États principaux
  const [devis, setDevis] = useState<CEEDevis[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // États UI
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showGenerator, setShowGenerator] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedDevis, setSelectedDevis] = useState<CEEDevis | null>(null)
  const [editingDevis, setEditingDevis] = useState<CEEDevis | null>(null)

  // ==================== CHARGEMENT DES DONNÉES ====================

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      if (isSupabaseConfigured()) {
        // Charger depuis Supabase
        const [devisResult, clientsResult] = await Promise.all([
          supabase.from('devis').select(`
            *,
            client:clients(*)
          `).eq('type', 'cee'),
          supabase.from('clients').select('*')
        ])

        if (devisResult.error) throw devisResult.error
        if (clientsResult.error) throw clientsResult.error

        setDevis(devisResult.data || [])
        setClients(clientsResult.data || [])
      } else {
        // Mode démo avec données factices
        setClients([
          {
            id: '1',
            nom: 'Martin Durand',
            entreprise: 'Industrie ABC',
            email: 'martin@abc.com',
            telephone: '01 23 45 67 89',
            ville: 'Lyon',
            created_at: new Date().toISOString()
          }
        ])
        
        setDevis([
          {
            id: '1',
            numero: 'CEE-2025-ABC-001',
            date_devis: '2025-08-03',
            date_validite: '2025-09-03',
            client_id: '1',
            objet: 'Installation système efficacité énergétique',
            description_operation: 'Installation d\'un système de récupération de chaleur',
            statut: 'brouillon',
            cee_data: {
              profil_fonctionnement: '2x8h',
              puissance_nominale: 50,
              duree_contrat: 3,
              coefficient_activite: 2,
              facteur_f: 3,
              kwh_cumac: 8820,
              tarif_kwh: 0.002,
              prime_estimee: 17.64,
              operateur_nom: 'TotalEnergies'
            },
            lignes: [
              {
                id: '1',
                designation: 'Étude technique préalable',
                zone: 'Étude',
                quantite: 1,
                prix_unitaire: 1500,
                prix_total: 1500,
                tva: 20,
                type: 'etude',
                ordre: 1
              },
              {
                id: '2',
                designation: 'Échangeur de chaleur haute performance',
                zone: 'Matériel',
                quantite: 1,
                prix_unitaire: 8500,
                prix_total: 8500,
                tva: 20,
                type: 'materiel',
                ordre: 2
              }
            ],
            total_ht: 10000,
            total_tva: 2000,
            total_ttc: 12000,
            prime_cee: 17.64,
            reste_a_payer: 11982.36,
            commercial_id: profile?.id || '1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
      }
    } catch (err: any) {
      setError(err.message)
      console.error('Erreur chargement données:', err)
    } finally {
      setLoading(false)
    }
  }

  // ==================== FILTRAGE ====================

  const filteredDevis = devis.filter(d => {
    const matchesSearch = d.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         d.objet.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         d.client?.entreprise?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || d.statut === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // ==================== ACTIONS ====================

  const handleCreateDevis = () => {
    setEditingDevis(null)
    setShowGenerator(true)
  }

  const handleEditDevis = (devis: CEEDevis) => {
    setEditingDevis(devis)
    setShowGenerator(true)
  }

  const handleViewDevis = (devis: CEEDevis) => {
    setSelectedDevis(devis)
    setShowDetails(true)
  }

  const handleDeleteDevis = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) return
    
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.from('devis').delete().eq('id', id)
        if (error) throw error
      }
      
      setDevis(devis.filter(d => d.id !== id))
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSaveDevis = async (devisData: CEEDevis) => {
    try {
      if (isSupabaseConfigured()) {
        if (editingDevis) {
          // Mise à jour
          const { error } = await supabase
            .from('devis')
            .update({
              ...devisData,
              updated_at: new Date().toISOString()
            })
            .eq('id', editingDevis.id)
          
          if (error) throw error
          
          setDevis(devis.map(d => d.id === editingDevis.id ? devisData : d))
        } else {
          // Création
          const { data, error } = await supabase
            .from('devis')
            .insert([{
              ...devisData,
              type: 'cee',
              commercial_id: profile?.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
            .select()
            .single()
          
          if (error) throw error
          
          setDevis([data, ...devis])
        }
      } else {
        // Mode démo
        if (editingDevis) {
          setDevis(devis.map(d => d.id === editingDevis.id ? devisData : d))
        } else {
          const newDevis = {
            ...devisData,
            id: Date.now().toString(),
            created_at: new Date().toISOString()
          }
          setDevis([newDevis, ...devis])
        }
      }
      
      setShowGenerator(false)
      setEditingDevis(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  // ==================== HELPERS ====================

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'brouillon': return 'bg-gray-100 text-gray-800'
      case 'envoye': return 'bg-blue-100 text-blue-800'
      case 'accepte': return 'bg-green-100 text-green-800'
      case 'refuse': return 'bg-red-100 text-red-800'
      case 'expire': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'brouillon': return Clock
      case 'envoye': return Send
      case 'accepte': return Check
      case 'refuse': return X
      case 'expire': return AlertCircle
      default: return Clock
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  // ==================== RENDU ====================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Zap className="h-8 w-8 mr-3 text-yellow-600" />
            Devis CEE
          </h1>
          <p className="text-gray-600 mt-1">
            Gestion des devis avec calculateur CEE intégré (IND-UT-134)
          </p>
        </div>
        
        <button
          onClick={handleCreateDevis}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nouveau devis CEE
        </button>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filtres et recherche */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Rechercher par numéro, objet ou client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Filtre statut */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="brouillon">Brouillon</option>
              <option value="envoye">Envoyé</option>
              <option value="accepte">Accepté</option>
              <option value="refuse">Refusé</option>
              <option value="expire">Expiré</option>
            </select>
          </div>
          
          {/* Bouton actualiser */}
          <button
            onClick={loadData}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Liste des devis */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredDevis.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'Aucun devis trouvé' : 'Aucun devis CEE'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Essayez de modifier vos critères de recherche'
                : 'Créez votre premier devis CEE avec le calculateur intégré'
              }
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <button
                onClick={handleCreateDevis}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
              >
                <Plus className="h-5 w-5 mr-2" />
                Créer un devis CEE
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Devis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CEE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDevis.map((devis) => {
                  const StatusIcon = getStatusIcon(devis.statut)
                  const client = clients.find(c => c.id === devis.client_id) || devis.client
                  
                  return (
                    <tr key={devis.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {devis.numero}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(devis.date_devis)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {client?.entreprise}
                          </div>
                          <div className="text-sm text-gray-500">
                            {client?.nom}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(devis.total_ttc)}
                          </div>
                          <div className="text-sm text-gray-500">
                            HT: {formatCurrency(devis.total_ht)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-green-600">
                            {formatCurrency(devis.prime_cee)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {devis.cee_data.kwh_cumac.toLocaleString()} kWh
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(devis.statut)}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {devis.statut}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewDevis(devis)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Voir"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditDevis(devis)}
                            className="text-yellow-600 hover:text-yellow-900 p-1 rounded"
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
        )}
      </div>

      {/* Modales */}
      {showGenerator && (
        <CEEDevisGenerator
          editingDevis={editingDevis}
          clients={clients}
          onSave={handleSaveDevis}
          onCancel={() => {
            setShowGenerator(false)
            setEditingDevis(null)
          }}
        />
      )}

      {showDetails && selectedDevis && (
        <CEEDevisDetails
          devis={selectedDevis}
          client={clients.find(c => c.id === selectedDevis.client_id)}
          onClose={() => {
            setShowDetails(false)
            setSelectedDevis(null)
          }}
          onEdit={() => {
            setShowDetails(false)
            handleEditDevis(selectedDevis)
          }}
        />
      )}
    </div>
  )
}

// ==================== GÉNÉRATEUR DE DEVIS CEE ====================

interface CEEDevisGeneratorProps {
  editingDevis: CEEDevis | null
  clients: Client[]
  onSave: (devis: CEEDevis) => void
  onCancel: () => void
}

function CEEDevisGenerator({ editingDevis, clients, onSave, onCancel }: CEEDevisGeneratorProps) {
  const [formData, setFormData] = useState<CEEDevis>(() => {
    if (editingDevis) return editingDevis
    
    return {
      id: '',
      numero: '',
      date_devis: new Date().toISOString().split('T')[0],
      date_validite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      client_id: '',
      objet: '',
      description_operation: '',
      statut: 'brouillon',
      cee_data: {
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
      lignes: [],
      total_ht: 0,
      total_tva: 0,
      total_ttc: 0,
      prime_cee: 0,
      reste_a_payer: 0,
      commercial_id: '',
      created_at: '',
      updated_at: ''
    }
  })

  const [activeTab, setActiveTab] = useState<'general' | 'cee' | 'lignes' | 'resume'>('general')

  // Calcul automatique des totaux
  useEffect(() => {
    const total_ht = formData.lignes.reduce((sum, ligne) => sum + ligne.prix_total, 0)
    const total_tva = formData.lignes.reduce((sum, ligne) => sum + (ligne.prix_total * ligne.tva / 100), 0)
    const total_ttc = total_ht + total_tva
    const prime_cee = formData.cee_data.prime_estimee
    const reste_a_payer = total_ttc - prime_cee

    setFormData(prev => ({
      ...prev,
      total_ht,
      total_tva,
      total_ttc,
      prime_cee,
      reste_a_payer
    }))
  }, [formData.lignes, formData.cee_data.prime_estimee])

  // Calcul CEE automatique
  useEffect(() => {
    const { puissance_nominale, coefficient_activite, facteur_f, tarif_kwh } = formData.cee_data
    const kwh_cumac = 29.4 * coefficient_activite * puissance_nominale * facteur_f
    const prime_estimee = kwh_cumac * tarif_kwh

    setFormData(prev => ({
      ...prev,
      cee_data: {
        ...prev.cee_data,
        kwh_cumac,
        prime_estimee
      }
    }))
  }, [formData.cee_data.puissance_nominale, formData.cee_data.coefficient_activite, formData.cee_data.facteur_f, formData.cee_data.tarif_kwh])

  // Génération du numéro automatique
  useEffect(() => {
    if (formData.client_id && !editingDevis) {
      const client = clients.find(c => c.id === formData.client_id)
      if (client) {
        const year = new Date().getFullYear()
        const clientCode = client.entreprise.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')
        const timestamp = Date.now().toString().slice(-4)
        const numero = `CEE-${year}-${clientCode}-${timestamp}`
        
        setFormData(prev => ({ ...prev, numero }))
      }
    }
  }, [formData.client_id, clients, editingDevis])

  const addLigne = () => {
    const newLigne: DevisLine = {
      id: Date.now().toString(),
      designation: '',
      zone: 'Général',
      quantite: 1,
      prix_unitaire: 0,
      prix_total: 0,
      tva: 20,
      type: 'materiel',
      ordre: formData.lignes.length + 1
    }
    
    setFormData(prev => ({
      ...prev,
      lignes: [...prev.lignes, newLigne]
    }))
  }

  const updateLigne = (id: string, updates: Partial<DevisLine>) => {
    setFormData(prev => ({
      ...prev,
      lignes: prev.lignes.map(ligne => {
        if (ligne.id === id) {
          const updated = { ...ligne, ...updates }
          updated.prix_total = updated.quantite * updated.prix_unitaire
          return updated
        }
        return ligne
      })
    }))
  }

  const deleteLigne = (id: string) => {
    setFormData(prev => ({
      ...prev,
      lignes: prev.lignes.filter(ligne => ligne.id !== id)
    }))
  }

  const handleSave = () => {
    // Validation
    if (!formData.client_id) {
      alert('Veuillez sélectionner un client')
      return
    }
    if (!formData.objet.trim()) {
      alert('Veuillez saisir un objet')
      return
    }
    if (formData.lignes.length === 0) {
      alert('Veuillez ajouter au moins une ligne')
      return
    }

    onSave({
      ...formData,
      id: editingDevis?.id || Date.now().toString()
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const profilOptions = [
    { value: '1x8h', label: '1×8h (8h/jour)', coefficient: 1 },
    { value: '2x8h', label: '2×8h (16h/jour)', coefficient: 2 },
    { value: '3x8h_weekend_off', label: '3×8h sans weekend', coefficient: 2.5 },
    { value: '3x8h_24_7', label: '3×8h continu', coefficient: 3 },
    { value: 'continu_24_7', label: 'Continu 24h/7j', coefficient: 3 }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-yellow-100">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-lg flex items-center justify-center mr-4">
              <Zap className="text-white h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {editingDevis ? 'Modifier le devis CEE' : 'Nouveau devis CEE'}
              </h2>
              <p className="text-gray-600">Avec calculateur IND-UT-134 intégré</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {[
            { id: 'general', label: 'Informations générales', icon: FileText },
            { id: 'cee', label: 'Calcul CEE', icon: Calculator },
            { id: 'lignes', label: 'Lignes du devis', icon: List },
            { id: 'resume', label: 'Résumé', icon: Eye }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 text-sm font-medium flex items-center transition-colors ${
                  activeTab === tab.id
                    ? 'text-yellow-600 border-b-2 border-yellow-600 bg-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Tab: Informations générales */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client *
                  </label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    required
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.entreprise} - {client.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de devis
                  </label>
                  <input
                    type="text"
                    value={formData.numero}
                    onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder="Généré automatiquement"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date du devis
                  </label>
                  <input
                    type="date"
                    value={formData.date_devis}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_devis: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objet du devis *
                </label>
                <input
                  type="text"
                  value={formData.objet}
                  onChange={(e) => setFormData(prev => ({ ...prev, objet: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Ex: Installation système efficacité énergétique"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description de l'opération
                </label>
                <textarea
                  value={formData.description_operation}
                  onChange={(e) => setFormData(prev => ({ ...prev, description_operation: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Décrivez l'opération d'efficacité énergétique à réaliser..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  value={formData.statut}
                  onChange={(e) => setFormData(prev => ({ ...prev, statut: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="brouillon">Brouillon</option>
                  <option value="envoye">Envoyé</option>
                  <option value="accepte">Accepté</option>
                  <option value="refuse">Refusé</option>
                  <option value="expire">Expiré</option>
                </select>
              </div>
            </div>
          )}

          {/* Tab: Calcul CEE */}
          {activeTab === 'cee' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Calculateur CEE - Fiche IND-UT-134
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profil de fonctionnement
                    </label>
                    <select
                      value={formData.cee_data.profil_fonctionnement}
                      onChange={(e) => {
                        const profil = profilOptions.find(p => p.value === e.target.value)
                        setFormData(prev => ({
                          ...prev,
                          cee_data: {
                            ...prev.cee_data,
                            profil_fonctionnement: e.target.value as any,
                            coefficient_activite: profil?.coefficient || 1
                          }
                        }))
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      {profilOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
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
                      value={formData.cee_data.puissance_nominale}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        cee_data: { ...prev.cee_data, puissance_nominale: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Durée d'engagement (années)
                    </label>
                    <select
                      value={formData.cee_data.duree_contrat}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        cee_data: {
                          ...prev.cee_data,
                          duree_contrat: parseFloat(e.target.value),
                          facteur_f: parseFloat(e.target.value)
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="1">1 an</option>
                      <option value="2">2 ans</option>
                      <option value="3">3 ans</option>
                      <option value="4">4 ans</option>
                      <option value="5">5 ans</option>
                      <option value="5.45">5,45 ans (max)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tarif CEE (€/kWh cumac)
                    </label>
                    <input
                      type="number"
                      value={formData.cee_data.tarif_kwh}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        cee_data: { ...prev.cee_data, tarif_kwh: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      step="0.001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Opérateur CEE
                    </label>
                    <input
                      type="text"
                      value={formData.cee_data.operateur_nom}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        cee_data: { ...prev.cee_data, operateur_nom: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="TotalEnergies, EDF, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes CEE
                    </label>
                    <textarea
                      value={formData.cee_data.notes || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        cee_data: { ...prev.cee_data, notes: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      rows={3}
                      placeholder="Commentaires sur le calcul CEE..."
                    />
                  </div>
                </div>

                {/* Résultats du calcul */}
                <div className="mt-6 bg-white p-4 rounded-lg border border-yellow-300">
                  <h4 className="font-medium text-gray-900 mb-3">Résultats du calcul CEE</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {formData.cee_data.kwh_cumac.toLocaleString('fr-FR')}
                      </div>
                      <div className="text-sm text-gray-600">kWh cumac</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(formData.cee_data.prime_estimee)}
                      </div>
                      <div className="text-sm text-gray-600">Prime CEE</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg text-gray-700">
                        Coefficient: {formData.cee_data.coefficient_activite}
                      </div>
                      <div className="text-sm text-gray-600">Activité</div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-500 text-center">
                    Formule: kWh cumac = 29.4 × {formData.cee_data.coefficient_activite} × {formData.cee_data.puissance_nominale} × {formData.cee_data.facteur_f}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Lignes du devis */}
          {activeTab === 'lignes' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Lignes du devis</h3>
                <button
                  onClick={addLigne}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une ligne
                </button>
              </div>

              {formData.lignes.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucune ligne ajoutée</p>
                  <button
                    onClick={addLigne}
                    className="mt-4 text-blue-600 hover:text-blue-800"
                  >
                    Ajouter la première ligne
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.lignes.map((ligne, index) => (
                    <div key={ligne.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Désignation
                          </label>
                          <input
                            type="text"
                            value={ligne.designation}
                            onChange={(e) => updateLigne(ligne.id, { designation: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Nom de l'article"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Zone
                          </label>
                          <select
                            value={ligne.zone}
                            onChange={(e) => updateLigne(ligne.id, { zone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Général">Général</option>
                            <option value="Étude">Étude</option>
                            <option value="Matériel">Matériel</option>
                            <option value="Installation">Installation</option>
                            <option value="Mise en service">Mise en service</option>
                            <option value="Formation">Formation</option>
                            <option value="Maintenance">Maintenance</option>
                          </select>
                        </div>

                        <div className="md:col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Qté
                          </label>
                          <input
                            type="number"
                            value={ligne.quantite}
                            onChange={(e) => updateLigne(ligne.id, { quantite: parseFloat(e.target.value) || 1 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="1"
                            step="0.1"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prix unitaire HT
                          </label>
                          <input
                            type="number"
                            value={ligne.prix_unitaire}
                            onChange={(e) => updateLigne(ligne.id, { prix_unitaire: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            step="0.01"
                          />
                        </div>

                        <div className="md:col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            TVA %
                          </label>
                          <select
                            value={ligne.tva}
                            onChange={(e) => updateLigne(ligne.id, { tva: parseFloat(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="0">0%</option>
                            <option value="5.5">5,5%</option>
                            <option value="10">10%</option>
                            <option value="20">20%</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Total HT
                          </label>
                          <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-right font-medium">
                            {formatCurrency(ligne.prix_total)}
                          </div>
                        </div>

                        <div className="md:col-span-1 flex justify-end">
                          <button
                            onClick={() => deleteLigne(ligne.id)}
                            className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
                            title="Supprimer la ligne"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Description optionnelle */}
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description (optionnelle)
                        </label>
                        <textarea
                          value={ligne.description || ''}
                          onChange={(e) => updateLigne(ligne.id, { description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={2}
                          placeholder="Description détaillée de l'article..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Résumé */}
          {activeTab === 'resume' && (
            <div className="space-y-6">
              {/* Informations client */}
              {formData.client_id && (
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Client
                  </h3>
                  {(() => {
                    const client = clients.find(c => c.id === formData.client_id)
                    return client ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="font-medium">{client.entreprise}</div>
                          <div className="text-sm text-blue-700">{client.nom}</div>
                        </div>
                        <div>
                          {client.email && <div className="text-sm">{client.email}</div>}
                          {client.telephone && <div className="text-sm">{client.telephone}</div>}
                        </div>
                      </div>
                    ) : null
                  })()}
                </div>
              )}

              {/* Résumé CEE */}
              <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Calcul CEE (IND-UT-134)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">
                      {formData.cee_data.kwh_cumac.toLocaleString('fr-FR')}
                    </div>
                    <div className="text-sm text-gray-600">kWh cumac</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {formatCurrency(formData.prime_cee)}
                    </div>
                    <div className="text-sm text-gray-600">Prime CEE</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg text-gray-700">
                      {formData.cee_data.puissance_nominale} kW
                    </div>
                    <div className="text-sm text-gray-600">Puissance</div>
                  </div>
                </div>
              </div>

              {/* Totaux financiers */}
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                  <Euro className="h-5 w-5 mr-2" />
                  Résumé financier
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total HT</span>
                    <span className="font-medium">{formatCurrency(formData.total_ht)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TVA</span>
                    <span className="font-medium">{formatCurrency(formData.total_tva)}</span>
                  </div>
                  <div className="flex justify-between border-t border-green-200 pt-3">
                    <span className="font-semibold">Total TTC</span>
                    <span className="font-bold text-lg">{formatCurrency(formData.total_ttc)}</span>
                  </div>
                  <div className="flex justify-between text-green-700">
                    <span>Prime CEE</span>
                    <span className="font-medium">- {formatCurrency(formData.prime_cee)}</span>
                  </div>
                  <div className="flex justify-between border-t border-green-300 pt-3 text-lg">
                    <span className="font-bold">Reste à payer</span>
                    <span className="font-bold text-green-800">{formatCurrency(formData.reste_a_payer)}</span>
                  </div>
                </div>
              </div>

              {/* Lignes par zone */}
              {formData.lignes.length > 0 && (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Détail des prestations
                  </h3>
                  {Object.entries(
                    formData.lignes.reduce((acc, ligne) => {
                      if (!acc[ligne.zone]) acc[ligne.zone] = []
                      acc[ligne.zone].push(ligne)
                      return acc
                    }, {} as Record<string, DevisLine[]>)
                  ).map(([zone, lignes]) => (
                    <div key={zone} className="mb-4">
                      <h4 className="font-medium text-gray-800 mb-2">{zone}</h4>
                      <div className="space-y-1">
                        {lignes.map(ligne => (
                          <div key={ligne.id} className="flex justify-between text-sm">
                            <span>{ligne.designation}</span>
                            <span className="font-medium">{formatCurrency(ligne.prix_total)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
            </div>
    </div>
    </div>
  )}