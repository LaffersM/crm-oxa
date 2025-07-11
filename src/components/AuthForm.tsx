import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Eye, EyeOff, LogIn, UserPlus, AlertCircle } from 'lucide-react'

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nom: '',
    prenom: ''
  })
  const [error, setError] = useState('')

  const { signIn, signUp, error: authError } = useAuth()

  // Show auth error if Supabase is not configured
  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Erreur de connexion
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                    {error.includes('Supabase') && (
                      <div className="mt-2">
                        <p className="font-medium">Solutions possibles :</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Vérifiez votre connexion internet</li>
                          <li>Contactez l'administrateur système</li>
                          <li>Réessayez dans quelques minutes</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">!</span>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Configuration requise</h2>
            <p className="mt-2 text-sm text-gray-600">{authError}</p>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password)
        if (error) throw error
      } else {
        const { error } = await signUp(
          formData.email,
          formData.password,
          formData.nom,
          formData.prenom
        )
        if (error) throw error
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center">
            <img src="/logo-couleur.svg" alt="OXA Groupe" className="h-16 w-16" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {isLogin ? 'Connexion' : 'Inscription'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            OXA Groupe CRM - Décarbonation Industrielle
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom
                  </label>
                  <input
                    name="prenom"
                    type="text"
                    required={!isLogin}
                    value={formData.prenom}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Prénom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom
                  </label>
                  <input
                    name="nom"
                    type="text"
                    required={!isLogin}
                    value={formData.nom}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nom"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : isLogin ? (
                <LogIn className="h-4 w-4 mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              {isLogin ? 'Pas de compte ? S\'inscrire' : 'Déjà un compte ? Se connecter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}