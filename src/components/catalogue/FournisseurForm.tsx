import React, { useState, useEffect } from 'react'
import { Fournisseur } from '../../lib/supabase'
import { X, Save, User, Building, Mail, Phone, MapPin } from 'lucide-react'

interface FournisseurFormProps {
  fournisseur?: Fournisseur | null
  onSubmit: (data: Partial<Fournisseur>) => void
  onCancel: () => void
}

export function FournisseurForm({ fournisseur, onSubmit, onCancel }: FournisseurFormProps) {
  const [formData, setFormData] = useState({
    nom: '',
    entreprise: '',
    email: '',
    telephone: '',
    adresse: '',
    ville: '',
    code_postal: '',
    pays: 'France',
    actif: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (fournisseur) {
      setFormData({
        nom: fournisseur.nom,
        entreprise: fournisseur.entreprise,
        email: fournisseur.email || '',
        telephone: fournisseur.telephone || '',
        adresse: fournisseur.adresse || '',
        ville: fournisseur.ville || '',
        code_postal: fournisseur.code_postal || '',
        pays: fournisseur.pays,
        actif: fournisseur.actif
      })
    }
  }, [fournisseur])

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

    if (formData.code_postal && !/^\d{5}$/.test(formData.code_postal)) {
      newErrors.code_postal = 'Code postal invalide (5 chiffres)'
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

  const handleChange = (field: string, value: string | boolean) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {fournisseur ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 p-1 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informations principales */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations principales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4 inline mr-1" />
                  Nom du contact *
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => handleChange('nom', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.nom ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Nom du contact principal"
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
            </div>
          </div>

          {/* Informations de contact */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>
          </div>

          {/* Adresse */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Adresse</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Adresse
                </label>
                <input
                  type="text"
                  value={formData.adresse}
                  onChange={(e) => handleChange('adresse', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123 Rue de la Paix"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={formData.ville}
                    onChange={(e) => handleChange('ville', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Paris"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code postal
                  </label>
                  <input
                    type="text"
                    value={formData.code_postal}
                    onChange={(e) => handleChange('code_postal', e.target.value.replace(/\D/g, '').slice(0, 5))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.code_postal ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="75001"
                  />
                  {errors.code_postal && <p className="mt-1 text-sm text-red-600">{errors.code_postal}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pays
                  </label>
                  <select
                    value={formData.pays}
                    onChange={(e) => handleChange('pays', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          {/* Statut */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.actif}
                onChange={(e) => handleChange('actif', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Fournisseur actif</span>
            </label>
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
              {fournisseur ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}