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
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-white font-bold text-2xl">OXA</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Mode Démonstration</h2>
            <div className="bg-white rounded-xl shadow-sm p-6 text-left">
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h3 className="font-medium text-blue-900 mb-2">Application en mode démo</h3>
                <p className="text-sm text-blue-700">
                  L'application fonctionne avec des données de démonstration. 
                  Pour utiliser toutes les fonctionnalités, configurez Supabase.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Configuration Supabase :</h3>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Créez un projet sur <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">supabase.com</a></li>
                  <li>Copiez l'URL et la clé publique</li>
                  <li>Créez un fichier .env avec :</li>
                </ol>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded font-mono overflow-x-auto">
VITE_SUPABASE_URL=votre_url_supabase{'\n'}
VITE_SUPABASE_ANON_KEY=votre_cle_publique
                </pre>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button 
                  onClick={() => window.location.reload()} 
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Recharger
                </button>
                <button 
                  onClick={() => window.location.hash = '#dashboard'} 
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <img src="/logo-couleur.svg" alt="OXA Groupe" className="h-8 w-8" />
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