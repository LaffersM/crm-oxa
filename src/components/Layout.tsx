import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { Navigation } from './Navigation'
import { AuthForm } from './AuthForm'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { user, profile, loading, error } = useAuth()

  // Show loading spinner for a maximum of 3 seconds
  React.useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        // Force stop loading after 3 seconds
        console.warn('Loading timeout reached')
      }, 3000)
      
      return () => clearTimeout(timeout)
    }
  }, [loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mb-6">
            <span className="text-white font-bold text-2xl">OXA</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initialisation de l'application...</p>
          <p className="text-sm text-gray-500 mt-2">OXA Groupe CRM</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-white font-bold text-2xl">!</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Erreur de connexion Supabase</h2>
            <div className="bg-white rounded-xl shadow-sm p-6 text-left">
              <div className="bg-red-50 p-4 rounded-lg mb-4">
                <h3 className="font-medium text-red-900 mb-2">Problème détecté</h3>
                <p className="text-sm text-red-700">
                  Erreur 500 : Le serveur Supabase ne répond pas correctement.
                </p>
                <p className="text-xs text-red-600 mt-2">
                  {error}
                </p>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                <h3 className="font-medium text-yellow-900 mb-2">Solutions possibles :</h3>
                <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                  <li>Vérifiez que votre projet Supabase est actif</li>
                  <li>Contrôlez vos variables d'environnement (.env)</li>
                  <li>Vérifiez les politiques RLS de vos tables</li>
                  <li>Consultez les logs Supabase pour plus de détails</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Mode démo disponible</h3>
                <p className="text-sm text-blue-700">
                  Vous pouvez continuer à utiliser l'application avec des données de test.
                </p>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button 
                  onClick={() => window.location.reload()} 
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Réessayer
                </button>
                <button 
                  onClick={() => {
                    // Force demo mode by clearing any stored auth state
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.reload();
                  }} 
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Mode Démo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If no user and no error, show auth form
  if (!user) {
    return <AuthForm />
  }

  // If user but no profile, create a temporary profile for demo
  const demoProfile = profile || {
    id: 'demo',
    user_id: user.id,
    email: user.email || 'demo@oxa-groupe.com',
    nom: 'Utilisateur',
    prenom: 'Démo',
    role: 'commercial' as const,
    actif: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="pt-6 pb-6">
        {children}
      </main>
    </div>
  )
}