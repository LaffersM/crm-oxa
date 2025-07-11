import React, { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured, Article, Fournisseur } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { 
  Package, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Euro,
  Percent,
  Building,
  Settings,
  Filter
} from 'lucide-react'
import { ArticleForm } from './ArticleForm'
import { FournisseurForm } from './FournisseurForm'

export function CataloguePage() {
  const { profile } = useAuth()
  const [articles, setArticles] = useState<Article[]>([])
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [groupFilter, setGroupFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'articles' | 'fournisseurs'>('articles')
  const [showArticleForm, setShowArticleForm] = useState(false)
  const [showFournisseurForm, setShowFournisseurForm] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [editingFournisseur, setEditingFournisseur] = useState<Fournisseur | null>(null)

  const handleUpdateArticle = async (id: string, articleData: Partial<Article>) => {
    try {
      if (!isSupabaseConfigured()) {
        setArticles(articles.map(a => 
          a.id === id ? { ...a, ...articleData, updated_at: new Date().toISOString() } : a
        ));
        setEditingArticle(null);
        setShowArticleForm(false);
        return;
      }

      const { data, error } = await supabase
        .from('articles')
        .update(articleData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setArticles(articles.map(a => a.id === id ? data : a));
      setEditingArticle(null);
      setShowArticleForm(false);
    } catch (error) {
      console.error('Error updating article:', error);
    }
  }

  const groupOptions = [
    { value: 'all', label: 'Tous les groupes' },
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
        // Demo data
        setFournisseurs([
          {
            id: '1',
            nom: 'Pierre Martin',
            entreprise: 'TechnoVert Solutions',
            email: 'pierre.martin@technoverts.fr',
            telephone: '01 23 45 67 89',
            adresse: '456 Avenue de l\'Innovation',
            ville: 'Lyon',
            code_postal: '69000',
            pays: 'France',
            actif: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            nom: 'Sophie Dubois',
            entreprise: 'EcoMat Industries',
            email: 'sophie.dubois@ecomat.com',
            telephone: '01 98 76 54 32',
            adresse: '789 Rue de l\'Écologie',
            ville: 'Marseille',
            code_postal: '13000',
            pays: 'France',
            actif: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        
        setArticles([
          {
            id: '1',
            nom: 'Récupérateur de chaleur industriel',
            description: 'Système de récupération de chaleur haute performance pour industrie',
            type: 'IPE',
            prix_achat: 8000,
            prix_vente: 12000,
            tva: 20,
            unite: 'unité',
            fournisseur_id: '1',
            actif: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            nom: 'Installation et mise en service',
            description: 'Service d\'installation et de mise en service des équipements',
            type: 'MAIN_OEUVRE',
            prix_achat: 0,
            prix_vente: 2500,
            tva: 20,
            unite: 'jour',
            fournisseur_id: undefined,
            actif: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '3',
            nom: 'Échangeur thermique',
            description: 'Échangeur thermique à plaques pour optimisation énergétique',
            type: 'MATERIEL',
            prix_achat: 3500,
            prix_vente: 5500,
            tva: 20,
            unite: 'unité',
            fournisseur_id: '2',
            actif: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '4',
            nom: 'Câblage électrique industriel',
            description: 'Câblage et raccordement électrique pour équipements industriels',
            type: 'ELEC',
            prix_achat: 150,
            prix_vente: 250,
            tva: 20,
            unite: 'mètre',
            fournisseur_id: '1',
            actif: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        setLoading(false)
        return
      }

      const [articlesData, fournisseursData] = await Promise.all([
        supabase.from('articles').select('*').order('created_at', { ascending: false }),
        supabase.from('fournisseurs').select('*').order('created_at', { ascending: false })
      ])

      if (articlesData.error) throw articlesData.error
      if (fournisseursData.error) throw fournisseursData.error

      setArticles(articlesData.data || [])
      setFournisseurs(fournisseursData.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateArticle = async (articleData: Partial<Article>) => {
    try {
      if (!isSupabaseConfigured()) {
        const newArticle: Article = {
          id: Date.now().toString(),
          ...articleData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Article
        setArticles([newArticle, ...articles])
        setShowArticleForm(false)
        return
      }

      const { data, error } = await supabase
        .from('articles')
        .insert([articleData])
        .select()
        .single()

      if (error) throw error
      setArticles([data, ...articles])
      setShowArticleForm(false)
    } catch (error) {
      console.error('Error creating article:', error)
    }
  }

  const handleCreateFournisseur = async (fournisseurData: Partial<Fournisseur>) => {
    try {
      if (!isSupabaseConfigured()) {
        const newFournisseur: Fournisseur = {
          id: Date.now().toString(),
          ...fournisseurData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Fournisseur
        setFournisseurs([newFournisseur, ...fournisseurs])
        setShowFournisseurForm(false)
        return
      }

      const { data, error } = await supabase
        .from('fournisseurs')
        .insert([fournisseurData])
        .select()
        .single()

      if (error) throw error
      setFournisseurs([data, ...fournisseurs])
      setShowFournisseurForm(false)
    } catch (error) {
      console.error('Error creating fournisseur:', error)
    }
  }

  const getFournisseurName = (fournisseurId?: string) => {
    if (!fournisseurId) return 'Aucun'
    const fournisseur = fournisseurs.find(f => f.id === fournisseurId)
    return fournisseur ? fournisseur.entreprise : 'Fournisseur inconnu'
  }

  const filteredArticles = articles.filter(article => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = article.nom.toLowerCase().includes(searchLower) ||
                         article.description?.toLowerCase().includes(searchLower)
    const matchesGroup = groupFilter === 'all' || article.type === groupFilter
    return matchesSearch && matchesGroup
  })

  const filteredFournisseurs = fournisseurs.filter(fournisseur => {
    const searchLower = searchTerm.toLowerCase()
    return fournisseur.nom.toLowerCase().includes(searchLower) ||
           fournisseur.entreprise.toLowerCase().includes(searchLower) ||
           fournisseur.email?.toLowerCase().includes(searchLower)
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }

  const calculateMargin = (prixVente: number, prixAchat: number) => {
    if (prixAchat === 0) return 100
    return ((prixVente - prixAchat) / prixVente * 100)
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
              <Package className="h-8 w-8 mr-3 text-blue-600" />
              Catalogue
            </h1>
            <p className="text-gray-600 mt-1">
              Gestion des articles et fournisseurs
            </p>
          </div>
          <div className="flex space-x-3">
            {activeTab === 'articles' ? (
              <button
                onClick={() => {
                  setEditingArticle(null)
                  setShowArticleForm(true)
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvel article
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditingFournisseur(null)
                  setShowFournisseurForm(true)
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau fournisseur
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('articles')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'articles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="h-4 w-4 inline mr-2" />
              Articles ({articles.length})
            </button>
            <button
              onClick={() => setActiveTab('fournisseurs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'fournisseurs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Building className="h-4 w-4 inline mr-2" />
              Fournisseurs ({fournisseurs.length})
            </button>
          </nav>
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
                placeholder={activeTab === 'articles' ? "Rechercher un article..." : "Rechercher un fournisseur..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          {activeTab === 'articles' && (
            <div className="sm:w-48">
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {groupOptions.map((group) => (
                  <option key={group.value} value={group.value}>
                    {group.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'articles' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Article
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix achat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix vente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marge
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fournisseur
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{article.nom}</div>
                        {article.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">{article.description}</div>
                        )}
                        <div className="text-xs text-gray-400">Unité: {article.unite}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        article.type === 'IPE' ? 'bg-blue-100 text-blue-800' :
                        article.type === 'ELEC' ? 'bg-yellow-100 text-yellow-800' :
                        article.type === 'MATERIEL' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {article.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(article.prix_achat)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(article.prix_vente)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Percent className="h-3 w-3 mr-1 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {calculateMargin(article.prix_vente, article.prix_achat).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getFournisseurName(article.fournisseur_id)}</div>
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
                          onClick={() => {
                            setEditingArticle(article)
                            setShowArticleForm(true)
                          }}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
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

          {filteredArticles.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun article</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || groupFilter !== 'all' 
                  ? 'Aucun article ne correspond à vos critères de recherche.'
                  : 'Commencez par ajouter votre premier article au catalogue.'
                }
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fournisseur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Localisation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFournisseurs.map((fournisseur) => (
                  <tr key={fournisseur.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{fournisseur.nom}</div>
                        <div className="text-sm text-gray-500">{fournisseur.entreprise}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {fournisseur.email && (
                          <div className="text-sm text-gray-600">{fournisseur.email}</div>
                        )}
                        {fournisseur.telephone && (
                          <div className="text-sm text-gray-600">{fournisseur.telephone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {fournisseur.ville && (
                        <div className="text-sm text-gray-600">
                          {fournisseur.ville} {fournisseur.code_postal && `(${fournisseur.code_postal})`}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        fournisseur.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {fournisseur.actif ? 'Actif' : 'Inactif'}
                      </span>
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
                          onClick={() => {
                            setEditingFournisseur(fournisseur)
                            setShowFournisseurForm(true)
                          }}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
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

          {filteredFournisseurs.length === 0 && (
            <div className="text-center py-12">
              <Building className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun fournisseur</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm 
                  ? 'Aucun fournisseur ne correspond à votre recherche.'
                  : 'Commencez par ajouter votre premier fournisseur.'
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showArticleForm && (
        <ArticleForm
          article={editingArticle}
          fournisseurs={fournisseurs}
          onSubmit={editingArticle 
            ? (data) => handleUpdateArticle(editingArticle.id, data)
            : handleCreateArticle
          }
          onCancel={() => {
            setShowArticleForm(false)
            setEditingArticle(null)
          }}
        />
      )}

      {showFournisseurForm && (
        <FournisseurForm
          fournisseur={editingFournisseur}
          onSubmit={editingFournisseur 
            ? (data) => console.log('Update fournisseur:', data)
            : handleCreateFournisseur
          }
          onCancel={() => {
            setShowFournisseurForm(false)
            setEditingFournisseur(null)
          }}
        />
      )}
    </div>
  )
}