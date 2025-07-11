import React, { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured, Commande, Client, Devis } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  Euro,
  Truck,
  Package,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'

export function CommandesPage() {
  const { profile } = useAuth()
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts', color: 'gray' },
    { value: 'en_cours', label: 'En cours', color: 'blue' },
    { value: 'expediee', label: 'Expédiée', color: 'orange' },
    { value: 'livree', label: 'Livrée', color: 'green' },
    { value: 'annulee', label: 'Annulée', color: 'red' }
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
        
        setCommandes([
          {
            id: '1',
            numero: 'CMD-2024-001',
            devis_id: '1',
            client_id: '1',
            statut: 'en_cours',
            date_commande: new Date().toISOString(),
            date_livraison_prevue: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            date_livraison: undefined,
            total_ht: 15000,
            total_tva: 3000,
            total_ttc: 18000,
            notes: 'Installation système de récupération de chaleur',
            commercial_id: profile?.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            numero: 'CMD-2024-002',
            devis_id: '2',
            client_id: '1',
            statut: 'livree',
            date_commande: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            date_livraison_prevue: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            date_livraison: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            total_ht: 8000,
            total_tva: 1600,
            total_ttc: 9600,
            notes: 'Maintenance préventive',
            commercial_id: profile?.id,
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        setLoading(false)
        return
      }

      const [commandesData, clientsData] = await Promise.all([
        supabase.from('commandes').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('*')
      ])

      if (commandesData.error) throw commandesData.error
      if (clientsData.error) throw clientsData.error

      setCommandes(commandesData.data || [])
      setClients(clientsData.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    return client ? `${client.nom} - ${client.entreprise}` : 'Client inconnu'
  }

  const filteredCommandes = commandes.filter(commande => {
    const client = clients.find(c => c.id === commande.client_id)
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = commande.numero.toLowerCase().includes(searchLower) ||
                         client?.nom.toLowerCase().includes(searchLower) ||
                         client?.entreprise.toLowerCase().includes(searchLower)
    const matchesStatus = statusFilter === 'all' || commande.statut === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status)
    return statusOption?.color || 'gray'
  }

  const getStatusBadgeClass = (color: string) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-800',
      orange: 'bg-orange-100 text-orange-800',
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800',
      gray: 'bg-gray-100 text-gray-800'
    }
    return colorClasses[color as keyof typeof colorClasses] || colorClasses.gray
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      en_cours: Clock,
      expediee: Truck,
      livree: CheckCircle,
      annulee: XCircle
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <ShoppingCart className="h-8 w-8 mr-3 text-blue-600" />
              Commandes
            </h1>
            <p className="text-gray-600 mt-1">
              Suivi et gestion des commandes clients
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total commandes</p>
              <p className="text-2xl font-bold text-gray-900">{commandes.length}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En cours</p>
              <p className="text-2xl font-bold text-gray-900">
                {commandes.filter(c => c.statut === 'en_cours').length}
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Livrées</p>
              <p className="text-2xl font-bold text-gray-900">
                {commandes.filter(c => c.statut === 'livree').length}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">CA réalisé</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(commandes.filter(c => c.statut === 'livree').reduce((sum, c) => sum + c.total_ttc, 0))}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <Euro className="h-6 w-6 text-green-600" />
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
                placeholder="Rechercher par numéro, client..."
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

      {/* Commandes Table */}
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
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant TTC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date commande
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Livraison prévue
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCommandes.map((commande) => {
                const StatusIcon = getStatusIcon(commande.statut)
                return (
                  <tr key={commande.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{commande.numero}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getClientName(commande.client_id)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(getStatusColor(commande.statut))}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusOptions.find(s => s.value === commande.statut)?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(commande.total_ttc)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(commande.date_commande).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {commande.date_livraison_prevue && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Truck className="h-3 w-3 mr-1" />
                          {new Date(commande.date_livraison_prevue).toLocaleDateString('fr-FR')}
                        </div>
                      )}
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
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredCommandes.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune commande</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Aucune commande ne correspond à vos critères de recherche.'
                : 'Les commandes apparaîtront ici une fois créées depuis les devis acceptés.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}