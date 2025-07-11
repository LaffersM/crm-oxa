import React, { useState, useEffect } from 'react'
import { Prospect } from '../../lib/supabase'
import { X, Save, User, Building, Mail, Phone, FileText, Tag } from 'lucide-react'

interface ProspectFormProps {
  prospect?: Prospect | null
  onSubmit: (data: Partial<Prospect>) => void
  onCancel: () => void
}

export function ProspectForm({ prospect, onSubmit, onCancel }: ProspectFormProps) {
  const [formData, setFormData] = useState({
    nom: '',
    entreprise: '',
    email: '',
    telephone: '',
    statut: 'nouveau' as const,
    source: '',
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (prospect) {
      setFormData({
        nom: prospect.nom,
        entreprise: prospect.entreprise,
        email: prospect.email || '',
        telephone: prospect.telephone || '',
        statut: prospect.statut,
        source: prospect.source || '',
        notes: prospect.notes || ''
      })
    }
  }, [prospect])

  const statusOptions = [
    { value: 'nouveau', label: 'Nouveau' },
    { value: 'contacte', label: 'Contacté' },
    { value: 'qualifie', label: 'Qualifié' },
    { value: 'converti', label: 'Converti' },
    { value: 'perdu', label: 'Perdu' }
  ]

  const sourceOptions = [
    'Site web',
    'Salon professionnel',
    'Recommandation',
    'Publicité',
    'Réseaux sociaux',
    'Appel à froid',
    'Partenaire',
    'Autre'
  ]

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis'
    }

    if (!formData.entreprise.trim()) {
      newErrors.entreprise = 'L\'entreprise est requise'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {prospect ? 'Modifier le prospect' : 'Nouveau prospect'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 p-1 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Nom *
              </label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => handleChange('nom', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.nom ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Nom du contact"
              />
              {errors.nom && <p className="mt-1 text-sm text-red-600">{errors.nom}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="h-4 w-4 inline mr-1" />
                Entreprise *
              </label>
              <input
                type="text"
                value={formData.entreprise}
                onChange={(e) => handleChange('entreprise', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.entreprise ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Nom de l'entreprise"
              />
              {errors.entreprise && <p className="mt-1 text-sm text-red-600">{errors.entreprise}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="h-4 w-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="email@entreprise.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="h-4 w-4 inline mr-1" />
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={(e) => handleChange('telephone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="01 23 45 67 89"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={formData.statut}
                onChange={(e) => handleChange('statut', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="h-4 w-4 inline mr-1" />
                Source
              </label>
              <select
                value={formData.source}
                onChange={(e) => handleChange('source', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner une source</option>
                {sourceOptions.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-1" />
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Notes sur le prospect, besoins identifiés, historique des échanges..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {prospect ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}