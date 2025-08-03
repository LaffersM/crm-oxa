import React, { useState } from 'react'
import { Article } from '../../lib/supabase'
import { Search, Plus, Package, Euro, X } from 'lucide-react'

interface ArticleSelectorProps {
  articles: Article[]
  onSelectArticle: (article: Article) => void
  onCreateArticle: (articleData: Partial<Article>) => Promise<Article>
}

interface NewArticleData {
  nom: string
  description: string
  type: 'IPE' | 'ELEC' | 'MATERIEL' | 'MAIN_OEUVRE'
  prix_achat: number
  prix_vente: number
  tva: number
  unite: string
}

export function ArticleSelector({ articles, onSelectArticle, onCreateArticle }: ArticleSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([])
  const [newArticleData, setNewArticleData] = useState<NewArticleData>({
    nom: '',
    description: '',
    type: 'MATERIEL',
    prix_achat: 0,
    prix_vente: 0,
    tva: 20,
    unite: 'unité'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [creating, setCreating] = useState(false)

  // Recherche intelligente
  React.useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredArticles([])
      setShowDropdown(false)
      return
    }

    const searchLower = searchTerm.toLowerCase()
    const filtered = articles.filter(article => {
      const searchFields = [
        article.nom,
        article.description || '',
        article.type
      ].map(field => field.toLowerCase())

      return searchFields.some(field => field.includes(searchLower))
    })

    setFilteredArticles(filtered.slice(0, 10)) // Limiter à 10 résultats
    setShowDropdown(filtered.length > 0)
  }, [searchTerm, articles])

  const handleSelectArticle = (article: Article) => {
    onSelectArticle(article)
    setSearchTerm('')
    setShowDropdown(false)
  }

  const validateNewArticle = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!newArticleData.nom.trim()) {
      newErrors.nom = 'Le nom est requis'
    }

    if (newArticleData.prix_vente <= 0) {
      newErrors.prix_vente = 'Le prix de vente doit être positif'
    }

    if (newArticleData.prix_achat < 0) {
      newErrors.prix_achat = 'Le prix d\'achat ne peut pas être négatif'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreateArticle = async () => {
    if (!validateNewArticle()) return

    setCreating(true)
    try {
      const newArticle = await onCreateArticle({
        ...newArticleData,
        actif: true
      })
      
      // Ajouter l'article créé au devis
      onSelectArticle(newArticle)
      
      // Reset form
      setNewArticleData({
        nom: '',
        description: '',
        type: 'MATERIEL',
        prix_achat: 0,
        prix_vente: 0,
        tva: 20,
        unite: 'unité'
      })
      setShowCreateForm(false)
      setErrors({})
    } catch (error) {
      console.error('Erreur lors de la création de l\'article:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleNewArticleChange = (field: keyof NewArticleData, value: string | number) => {
    setNewArticleData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const typeOptions = [
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

  return (
    <div className="relative">
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => {
                if (filteredArticles.length > 0) {
                  setShowDropdown(true)
                }
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Rechercher un article..."
            />
          </div>

          {/* Dropdown des résultats */}
          {showDropdown && filteredArticles.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => handleSelectArticle(article)}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900 text-sm">{article.nom}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          article.type === 'IPE' ? 'bg-blue-100 text-blue-800' :
                          article.type === 'ELEC' ? 'bg-yellow-100 text-yellow-800' :
                          article.type === 'MATERIEL' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {article.type}
                        </span>
                      </div>
                      {article.description && (
                        <div className="mt-1 text-sm text-gray-600 truncate">
                          {article.description}
                        </div>
                      )}
                      <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                        <span>Prix: {article.prix_vente.toFixed(2)} €</span>
                        <span>Unité: {article.unite}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Message si aucun résultat */}
          {searchTerm.trim() && filteredArticles.length === 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center">
              <p className="text-gray-500 text-sm">Aucun article trouvé</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Créer un nouvel article
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
          title="Créer un nouvel article"
        >
          <Plus className="h-4 w-4 mr-1" />
          Nouvel article
        </button>
      </div>

      {/* Modal de création d'article */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Créer un nouvel article</h3>
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
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom de l'article *
                    </label>
                    <input
                      type="text"
                      value={newArticleData.nom}
                      onChange={(e) => handleNewArticleChange('nom', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.nom ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Nom de l'article"
                    />
                    {errors.nom && <p className="mt-1 text-sm text-red-600">{errors.nom}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type/Groupe *
                    </label>
                    <select
                      value={newArticleData.type}
                      onChange={(e) => handleNewArticleChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {typeOptions.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unité
                    </label>
                    <select
                      value={newArticleData.unite}
                      onChange={(e) => handleNewArticleChange('unite', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {uniteOptions.map((unite) => (
                        <option key={unite} value={unite}>
                          {unite}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newArticleData.description}
                      onChange={(e) => handleNewArticleChange('description', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Description de l'article"
                    />
                  </div>
                </div>
              </div>

              {/* Prix */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Prix et marges</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix d'achat
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newArticleData.prix_achat}
                      onChange={(e) => handleNewArticleChange('prix_achat', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.prix_achat ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                    />
                    {errors.prix_achat && <p className="mt-1 text-sm text-red-600">{errors.prix_achat}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix de vente *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newArticleData.prix_vente}
                      onChange={(e) => handleNewArticleChange('prix_vente', parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.prix_vente ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                    />
                    {errors.prix_vente && <p className="mt-1 text-sm text-red-600">{errors.prix_vente}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      TVA (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newArticleData.tva}
                      onChange={(e) => handleNewArticleChange('tva', parseFloat(e.target.value) || 20)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="20.00"
                    />
                  </div>
                </div>

                {/* Résumé des calculs */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Marge unitaire:</span>
                      <span className="ml-2 font-medium text-blue-900">
                        {(newArticleData.prix_vente - newArticleData.prix_achat).toFixed(2)} €
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">Prix TTC:</span>
                      <span className="ml-2 font-medium text-blue-900">
                        {(newArticleData.prix_vente * (1 + newArticleData.tva / 100)).toFixed(2)} €
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">Taux de marge:</span>
                      <span className="ml-2 font-medium text-blue-900">
                        {newArticleData.prix_vente > 0 ? 
                          (((newArticleData.prix_vente - newArticleData.prix_achat) / newArticleData.prix_vente) * 100).toFixed(1) : 0
                        }%
                      </span>
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
                  onClick={handleCreateArticle}
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                >
                  {creating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {creating ? 'Création...' : 'Créer l\'article'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}