import React, { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured, Client } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Phone,
  Mail,
  Building,
  MapPin,
  Calendar
} from 'lucide-react'
import { ClientForm } from './ClientForm'
import { ClientDetails } from './ClientDetails'

export function ClientsPage() {
  const { profile } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
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
            notes: 'Client premium, projets récurrents',
            commercial_id: profile?.id,
            prospect_id: '1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            nom: 'Marie Martin',
            entreprise: 'EcoTech Solutions',
            siret: '98765432109876',
            email: 'marie.martin@ecotech.com',
            telephone: '01 98 76 54 32',
            adresse: '456 Avenue des Champs',
            ville: 'Lyon',
            code_postal: '69000',
            pays: 'France',
            contact_principal: 'Marie Martin - Responsable Achats',
            notes: 'Spécialisé dans les solutions énergétiques',
            commercial_id: profile?.id,
            prospect_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
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
        setShowForm(false)
        return
      }

      const { data, error } = await supabase
        .from('clients')
        .insert([{ ...clientData, commercial_id: profile?.id }])
        .select()
        .single()

      if (error) throw error
      setClients([data, ...clients])
      setShowForm(false)
    } catch (error) {
      console.error('Error creating client:', error)
    }
  }

  const handleUpdateClient = async (id: string, clientData: Partial<Client>) => {
    try {
      if (!isSupabaseConfigured()) {
        setClients(clients.map(c => 
          c.id === id ? { ...c, ...clientData, updated_at: new Date().toISOString() } : c
        ))
        setEditingClient(null)
        setShowForm(false)
        return
      }

      const { data, error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setClients(clients.map(c => c.id === id ? data : c))
      setEditingClient(null)
      setShowForm(false)
    } catch (error) {
      console.error('Error updating client:', error)
    }
  }

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return

    try {
      if (!isSupabaseConfigured()) {
        setClients(clients.filter(c => c.id !== id))
        return
      }

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)

      if (error) throw error
      setClients(clients.filter(c => c.id !== id))
    } catch (error) {
      console.error('Error deleting client:', error)
    }
  }

  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase()
    return client.nom.toLowerCase().includes(searchLower) ||
           client.entreprise.toLowerCase().includes(searchLower) ||
           client.email?.toLowerCase().includes(searchLower) ||
           client.ville?.toLowerCase().includes(searchLower)
  })

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
              <Users className="h-8 w-8 mr-3 text-blue-600" />
              Clients
            </h1>
            <p className="text-gray-600 mt-1">
              Gérez votre portefeuille clients
            </p>
          </div>
          <button
            onClick={() => {
              setEditingClient(null)
              setShowForm(true)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau client
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total clients</p>
              <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Nouveaux ce mois</p>
              <p className="text-2xl font-bold text-gray-900">
                {clients.filter(c => {
                  const created = new Date(c.created_at)
                  const now = new Date()
                  return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
                }).length}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Villes couvertes</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(clients.map(c => c.ville).filter(Boolean)).size}
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <MapPin className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, entreprise, email ou ville..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entreprise
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Localisation
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
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{client.nom}</div>
                    {client.siret && (
                      <div className="text-xs text-gray-500">SIRET: {client.siret}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{client.entreprise}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {client.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-3 w-3 mr-1" />
                          {client.email}
                        </div>
                      )}
                      {client.telephone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-3 w-3 mr-1" />
                          {client.telephone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {client.ville && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-3 w-3 mr-1" />
                        {client.ville} {client.code_postal && `(${client.code_postal})`}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(client.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedClient(client)
                          setShowDetails(true)
                        }}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="Voir les détails"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingClient(client)
                          setShowForm(true)
                        }}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun client</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm 
                ? 'Aucun client ne correspond à votre recherche.'
                : 'Commencez par ajouter votre premier client.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <ClientForm
          client={editingClient}
          onSubmit={editingClient 
            ? (data) => handleUpdateClient(editingClient.id, data)
            : handleCreateClient
          }
          onCancel={() => {
            setShowForm(false)
            setEditingClient(null)
          }}
        />
      )}

      {showDetails && selectedClient && (
        <ClientDetails
          client={selectedClient}
          onClose={() => {
            setShowDetails(false)
            setSelectedClient(null)
          }}
          onEdit={() => {
            setEditingClient(selectedClient)
            setShowForm(true)
            setShowDetails(false)
          }}
        />
      )}
    </div>
  )
}