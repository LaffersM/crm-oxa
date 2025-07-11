import React, { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured, Prospect } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { 
  UserPlus, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Phone,
  Mail,
  Building,
  Calendar,
  TrendingUp
} from 'lucide-react'
import { ProspectForm } from './ProspectForm'
import { ProspectDetails } from './ProspectDetails'

export function ProspectsPage() {
  const { profile } = useAuth()
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null)

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts', color: 'gray' },
    { value: 'nouveau', label: 'Nouveau', color: 'blue' },
    { value: 'contacte', label: 'Contacté', color: 'yellow' },
    { value: 'qualifie', label: 'Qualifié', color: 'purple' },
    { value: 'converti', label: 'Converti', color: 'green' },
    { value: 'perdu', label: 'Perdu', color: 'red' }
  ]

  useEffect(() => {
    fetchProspects()
  }, [])

  const fetchProspects = async () => {
    try {
      if (!isSupabaseConfigured()) {
        // Demo data
        setProspects([
          {
            id: '1',
            nom: 'Martin Dubois',
            entreprise: 'TechCorp Industries',
            email: 'martin.dubois@techcorp.fr',
            telephone: '01 23 45 67 89',
            statut: 'nouveau',
            source: 'Site web',
            notes: 'Intéressé par nos solutions de décarbonation',
            commercial_id: profile?.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            nom: 'Sophie Laurent',
            entreprise: 'GreenFactory',
            email: 'sophie.laurent@greenfactory.com',
            telephone: '01 98 76 54 32',
            statut: 'contacte',
            source: 'Salon professionnel',
            notes: 'Demande de devis pour installation 500kW',
            commercial_id: profile?.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProspects(data || [])
    } catch (error) {
      console.error('Error fetching prospects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProspect = async (prospectData: Partial<Prospect>) => {
    try {
      if (!isSupabaseConfigured()) {
        const newProspect: Prospect = {
          id: Date.now().toString(),
          ...prospectData,
          commercial_id: profile?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Prospect
        setProspects([newProspect, ...prospects])
        setShowForm(false)
        return
      }

      const { data, error } = await supabase
        .from('prospects')
        .insert([{ ...prospectData, commercial_id: profile?.id }])
        .select()
        .single()

      if (error) throw error
      setProspects([data, ...prospects])
      setShowForm(false)
    } catch (error) {
      console.error('Error creating prospect:', error)
    }
  }

  const handleUpdateProspect = async (id: string, prospectData: Partial<Prospect>) => {
    try {
      if (!isSupabaseConfigured()) {
        setProspects(prospects.map(p => 
          p.id === id ? { ...p, ...prospectData, updated_at: new Date().toISOString() } : p
        ))
        setEditingProspect(null)
        setShowForm(false)
        return
      }

      const { data, error } = await supabase
        .from('prospects')
        .update(prospectData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      setProspects(prospects.map(p => p.id === id ? data : p))
      setEditingProspect(null)
      setShowForm(false)
    } catch (error) {
      console.error('Error updating prospect:', error)
    }
  }

  const handleDeleteProspect = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce prospect ?')) return

    try {
      if (!isSupabaseConfigured()) {
        setProspects(prospects.filter(p => p.id !== id))
        return
      }

      const { error } = await supabase
        .from('prospects')
        .delete()
        .eq('id', id)

      if (error) throw error
      setProspects(prospects.filter(p => p.id !== id))
    } catch (error) {
      console.error('Error deleting prospect:', error)
    }
  }

  const filteredProspects = prospects.filter(prospect => {
    const matchesSearch = prospect.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prospect.entreprise.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prospect.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || prospect.statut === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status)
    return statusOption?.color || 'gray'
  }

  const getStatusBadgeClass = (color: string) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      purple: 'bg-purple-100 text-purple-800',
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800',
      gray: 'bg-gray-100 text-gray-800'
    }
    return colorClasses[color as keyof typeof colorClasses] || colorClasses.gray
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
              <UserPlus className="h-8 w-8 mr-3 text-blue-600" />
              Prospects
            </h1>
            <p className="text-gray-600 mt-1">
              Gérez vos prospects et suivez leur progression
            </p>
          </div>
          <button
            onClick={() => {
              setEditingProspect(null)
              setShowForm(true)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau prospect
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {statusOptions.slice(1).map((status) => {
          const count = prospects.filter(p => p.statut === status.value).length
          return (
            <div key={status.value} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{status.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${status.color}-50`}>
                  <TrendingUp className={`h-6 w-6 text-${status.color}-600`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, entreprise ou email..."
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

      {/* Prospects Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prospect
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entreprise
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
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
              {filteredProspects.map((prospect) => (
                <tr key={prospect.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{prospect.nom}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{prospect.entreprise}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {prospect.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-3 w-3 mr-1" />
                          {prospect.email}
                        </div>
                      )}
                      {prospect.telephone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-3 w-3 mr-1" />
                          {prospect.telephone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(getStatusColor(prospect.statut))}`}>
                      {statusOptions.find(s => s.value === prospect.statut)?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {prospect.source || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(prospect.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedProspect(prospect)
                          setShowDetails(true)
                        }}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="Voir les détails"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingProspect(prospect)
                          setShowForm(true)
                        }}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProspect(prospect.id)}
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

        {filteredProspects.length === 0 && (
          <div className="text-center py-12">
            <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun prospect</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Aucun prospect ne correspond à vos critères de recherche.'
                : 'Commencez par ajouter votre premier prospect.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <ProspectForm
          prospect={editingProspect}
          onSubmit={editingProspect 
            ? (data) => handleUpdateProspect(editingProspect.id, data)
            : handleCreateProspect
          }
          onCancel={() => {
            setShowForm(false)
            setEditingProspect(null)
          }}
        />
      )}

      {showDetails && selectedProspect && (
        <ProspectDetails
          prospect={selectedProspect}
          onClose={() => {
            setShowDetails(false)
            setSelectedProspect(null)
          }}
          onEdit={() => {
            setEditingProspect(selectedProspect)
            setShowForm(true)
            setShowDetails(false)
          }}
        />
      )}
    </div>
  )
}