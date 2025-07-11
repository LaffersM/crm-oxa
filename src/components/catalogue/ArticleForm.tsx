import React, { useState, useEffect } from 'react'
import { Article, Fournisseur } from '../../lib/supabase'
import { X, Save, Package, Euro, Percent, FileText, Building } from 'lucide-react'

interface ArticleFormProps {
  article?: Article | null
  fournisseurs: Fournisseur[]
  onSubmit: (data: Partial<Article>) => void
  onCancel: () => void
}

export function ArticleForm({ article, fournisseurs, onSubmit, onCancel }: ArticleFormProps) {
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    type: 'bien' as const,
    prix_achat: 0,
    prix_vente: 0,
    tva: 20,
    unite: 'unité',
    fournisseur_id: '',
    actif: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (article) {
      setFormData({
        nom: article.nom,
        description: article.description || '',
        type: article.type,
        prix_achat: article.prix_achat,
        prix_vente: article.prix_vente,
        tva: article.tva,
        unite: article.unite,
        fournisseur_id: article.fournisseur_id || '',
        actif: article.actif
      })
    } else {
      // Reset to default values for new article
      setFormData({
        nom: '',
        description: '',
        type: 'bien',
        prix_achat: 0,
        prix_vente: 0,
        tva: 20,
        unite: 'unité',
        fournisseur_id: '',
        actif: true
      })
    }
  }, [article])

  const typeOptions = [
    { value: 'bien', label: 'Bien (Legacy)' },
    { value: 'service', label: 'Service (Legacy)' },
    { value: 'IPE', label: 'IPE' },
    { value: 'ELEC', label: 'ELEC' },
    { value: 'MATERIEL', label: 'MATERIEL' },
    { value: 'MAIN_OEUVRE', label: 'Main d\'œuvre' }
  ]

  const uniteOptions = [
    'unité',
    'mètre',
    'mètre carré',
    'mètre cube',
    'kilogramme',
    'tonne',
    'litre',
    'heure',
    'jour',
    'forfait'
  ]

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis'
    }

    if (formData.prix_vente <= 0) {
      newErrors.prix_vente = 'Le prix de vente doit être positif'
    }

    if (formData.prix_achat < 0) {
      newErrors.prix_achat = 'Le prix d\'achat ne peut pas être négatif'
    }

    if (formData.tva < 0 || formData.tva > 100) {
      newErrors.tva = 'La TVA doit être entre 0 et 100%'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      const submitData = {
        ...formData,
        fournisseur_id: formData.fournisseur_id || undefined
      }
      onSubmit(submitData)
    }
  }

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const calculateMargin = () => {
    if (formData.prix_vente === 0) return 0
    return ((formData.prix_vente - formData.prix_achat) / formData.prix_vente * 100)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {article ? 'Modifier l\'article' : 'Nouvel article'}
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
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Package className="h-4 w-4 inline mr-1" />
                  Nom de l'article *
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => handleChange('nom', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.nom ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Nom de l'article ou du service"
                />
                {errors.nom && <p className="mt-1 text-sm text-red-600">{errors.nom}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type/Groupe *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {typeOptions.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unité
                </label>
                <select
                  value={formData.unite}
                  onChange={(e) => handleChange('unite', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {uniteOptions.map((unite) => (
                    <option key={unite} value={unite}>
                      {unite}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building className="h-4 w-4 inline mr-1" />
                  Fournisseur
                </label>
                <select
                  value={formData.fournisseur_id}
                  onChange={(e) => handleChange('fournisseur_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Aucun fournisseur</option>
                  {fournisseurs.filter(f => f.actif).map((fournisseur) => (
                    <option key={fournisseur.id} value={fournisseur.id}>
                      {fournisseur.entreprise} - {fournisseur.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Prix et marges */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Prix et marges</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Euro className="h-4 w-4 inline mr-1" />
                  Prix d'achat
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.prix_achat}
                  onChange={(e) => handleChange('prix_achat', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.prix_achat ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.prix_achat && <p className="mt-1 text-sm text-red-600">{errors.prix_achat}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Euro className="h-4 w-4 inline mr-1" />
                  Prix de vente *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.prix_vente}
                  onChange={(e) => handleChange('prix_vente', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.prix_vente ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.prix_vente && <p className="mt-1 text-sm text-red-600">{errors.prix_vente}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Percent className="h-4 w-4 inline mr-1" />
                  TVA (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.tva}
                  onChange={(e) => handleChange('tva', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.tva ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="20.00"
                />
                {errors.tva && <p className="mt-1 text-sm text-red-600">{errors.tva}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marge calculée
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">
                    {calculateMargin().toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Résumé des calculs */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Résumé des calculs</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Marge unitaire:</span>
                  <span className="ml-2 font-medium text-blue-900">
                    {(formData.prix_vente - formData.prix_achat).toFixed(2)} €
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Prix TTC:</span>
                  <span className="ml-2 font-medium text-blue-900">
                    {(formData.prix_vente * (1 + formData.tva / 100)).toFixed(2)} €
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Taux de marge:</span>
                  <span className="ml-2 font-medium text-blue-900">
                    {calculateMargin().toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-1" />
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Description détaillée de l'article ou du service..."
            />
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
              <span className="ml-2 text-sm text-gray-700">Article actif</span>
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
              {article ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}