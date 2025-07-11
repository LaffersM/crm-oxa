import React, { useState, useEffect } from 'react'
import { Client } from '../../lib/supabase'
import { Search, Plus, User, Building, Mail, Phone, MapPin, X } from 'lucide-react'

interface ClientSelectorProps {
  clients: Client[]
  selectedClient: Client | null
  onSelectClient: (client: Client) => void
  onCreateClient: (clientData: Partial<Client>) => Promise<void>
}

interface NewClientData {
  nom: string
  entreprise: string
  email: string
  telephone: string
  adresse: string
  ville: string
  code_postal: string
  pays: string
  siret: string
}

export function ClientSelector({ clients, selectedClient, onSelectClient, onCreateClient }: ClientSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [newClientData, setNewClientData] = useState<NewClientData>({
    nom: '',
    entreprise: '',
    email: '',
    telephone: '',
    adresse: '',
    ville: '',
    code_postal: '',
    pays: 'France',
    siret: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [creating, setCreating] = useState(false)

  // Recherche intelligente
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredClients([])
      setShowDropdown(false)
      return
    }

    const searchLower = searchTerm.toLowerCase()
    const filtered = clients.filter(client => {
      // Recherche dans nom, entreprise, email, ville, SIRET
      const searchFields = [
        client.nom,
        client.entreprise,
        client.email || '',
        client.ville || '',
        client.siret || '',
        client.telephone || ''
      ].map(field => field.toLowerCase())

      // Recherche exacte ou partielle
      return searchFields.some(field => 
        field.includes(searchLower) || 
        searchLower.split(' ').every(term => field.includes(term))
      )
    })

    // Tri par pertinence
    const sorted = filtered.sort((a, b) => {
      const aScore = calculateRelevanceScore(a, searchLower)
      const bScore = calculateRelevanceScore(b, searchLower)
      return bScore - aScore
    })

    setFilteredClients(sorted.slice(0, 10)) // Limiter à 10 résultats
    setShowDropdown(sorted.length > 0)
  }, [searchTerm, clients])

  const calculateRelevanceScore = (client: Client, searchTerm: string): number => {
    let score = 0
    const fields = [
      { value: client.nom, weight: 3 },
      { value: client.entreprise, weight: 3 },
      { value: client.email || '', weight: 2 },
      { value: client.ville || '', weight: 1 },
      { value: client.siret || '', weight: 1 }
    ]

    fields.forEach(field => {
      const fieldLower = field.value.toLowerCase()
      if (fieldLower.startsWith(searchTerm)) {
        score += field.weight * 3 // Bonus pour correspondance au début
      } else if (fieldLower.includes(searchTerm)) {
        score += field.weight
      }
    })

    return score
  }

  const handleSelectClient = (client: Client) => {
    onSelectClient(client)
    setSearchTerm(`${client.nom} - ${client.entreprise}`)
    setShowDropdown(false)
  }

  const validateNewClient = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!newClientData.nom.trim()) {
      newErrors.nom = 'Le nom est requis'
    }

    if (!newClientData.entreprise.trim()) {
      newErrors.entreprise = 'L\'entreprise est requise'
    }

    if (newClientData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newClientData.email)) {
      newErrors.email = 'Email invalide'
    }

    if (newClientData.siret && newClientData.siret.length !== 14) {
      newErrors.siret = 'Le SIRET doit contenir 14 chiffres'
    }

    if (newClientData.code_postal && !/^\d{5}$/.test(newClientData.code_postal)) {
      newErrors.code_postal = 'Code postal invalide (5 chiffres)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreateClient = async () => {
    if (!validateNewClient()) return

    setCreating(true)
    try {
      await onCreateClient(newClientData)
      
      // Reset form
      setNewClientData({
        nom: '',
        entreprise: '',
        email: '',
        telephone: '',
        adresse: '',
        ville: '',
        code_postal: '',
        pays: 'France',
        siret: ''
      })
      setShowCreateForm(false)
      setErrors({})
    } catch (error) {
      console.error('Erreur lors de la création du client:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleNewClientChange = (field: keyof NewClientData, value: string) => {
    setNewClientData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <User className="h-4 w-4 inline mr-1" />
          Client *
        </label>
        
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                if (selectedClient && e.target.value !== `${selectedClient.nom} - ${selectedClient.entreprise}`) {
                  onSelectClient(null as any) // Reset selection si on modifie la recherche
                }
              }}
              onFocus={() => {
                if (filteredClients.length > 0) {
                  setShowDropdown(true)
                }
              }}
              className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Rechercher par nom, entreprise, email, ville..."
            />
            <button
              onClick={() => setShowCreateForm(true)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-1 rounded hover:bg-blue-700 transition-colors"
              title="Créer un nouveau client"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Dropdown des résultats */}
          {showDropdown && filteredClients.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => handleSelectClient(client)}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{client.entreprise}</span>
                      </div>
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <User className="h-3 w-3" />
                          <span>{client.nom}</span>
                        </div>
                        {client.email && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail className="h-3 w-3" />
                            <span>{client.email}</span>
                          </div>
                        )}
                        {client.ville && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <MapPin className="h-3 w-3" />
                            <span>{client.ville} {client.code_postal && `(${client.code_postal})`}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {client.siret && (
                      <div className="text-xs text-gray-500">
                        SIRET: {client.siret}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Message si aucun résultat */}
          {searchTerm.trim() && filteredClients.length === 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center">
              <p className="text-gray-500 text-sm">Aucun client trouvé</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Créer un nouveau client
              </button>
            </div>
          )}
        </div>

        {/* Client sélectionné */}
        {selectedClient && (
          <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-blue-900">{selectedClient.entreprise}</h4>
                <p className="text-sm text-blue-700">{selectedClient.nom}</p>
                {selectedClient.email && (
                  <p className="text-sm text-blue-600">{selectedClient.email}</p>
                )}
                {selectedClient.ville && (
                  <p className="text-sm text-blue-600">
                    {selectedClient.ville} {selectedClient.code_postal && `(${selectedClient.code_postal})`}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  onSelectClient(null as any)
                  setSearchTerm('')
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de création de client */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Créer un nouveau client</h3>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setErrors({})
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Informations principales */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Informations principales</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom du contact *
                    </label>
                    <input
                      type="text"
                      value={newClientData.nom}
                      onChange={(e) => handleNewClientChange('nom', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.nom ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Nom du contact principal"
                    />
                    {errors.nom && <p className="mt-1 text-sm text-red-600">{errors.nom}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Entreprise *
                    </label>
                    <input
                      type="text"
                      value={newClientData.entreprise}
                      onChange={(e) => handleNewClientChange('entreprise', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.entreprise ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Nom de l'entreprise"
                    />
                    {errors.entreprise && <p className="mt-1 text-sm text-red-600">{errors.entreprise}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SIRET
                    </label>
                    <input
                      type="text"
                      value={newClientData.siret}
                      onChange={(e) => handleNewClientChange('siret', e.target.value.replace(/\D/g, '').slice(0, 14))}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.siret ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="12345678901234"
                    />
                    {errors.siret && <p className="mt-1 text-sm text-red-600">{errors.siret}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newClientData.email}
                      onChange={(e) => handleNewClientChange('email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="email@entreprise.com"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={newClientData.telephone}
                      onChange={(e) => handleNewClientChange('telephone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="01 23 45 67 89"
                    />
                  </div>
                </div>
              </div>

              {/* Adresse */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Adresse</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adresse
                    </label>
                    <input
                      type="text"
                      value={newClientData.adresse}
                      onChange={(e) => handleNewClientChange('adresse', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="123 Rue de la Paix"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ville
                      </label>
                      <input
                        type="text"
                        value={newClientData.ville}
                        onChange={(e) => handleNewClientChange('ville', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Paris"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Code postal
                      </label>
                      <input
                        type="text"
                        value={newClientData.code_postal}
                        onChange={(e) => handleNewClientChange('code_postal', e.target.value.replace(/\D/g, '').slice(0, 5))}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.code_postal ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="75001"
                      />
                      {errors.code_postal && <p className="mt-1 text-sm text-red-600">{errors.code_postal}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pays
                      </label>
                      <select
                        value={newClientData.pays}
                        onChange={(e) => handleNewClientChange('pays', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="France">France</option>
                        <option value="Belgique">Belgique</option>
                        <option value="Suisse">Suisse</option>
                        <option value="Luxembourg">Luxembourg</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowCreateForm(false)
                    setErrors({})
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateClient}
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                >
                  {creating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {creating ? 'Création...' : 'Créer le client'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}