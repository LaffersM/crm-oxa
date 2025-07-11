import React, { useState } from 'react'
import { Layout } from './components/Layout'
import { Dashboard } from './components/Dashboard'
import { CEECalculator } from './components/CEECalculator'
import { ProspectsPage } from './components/prospects/ProspectsPage'
import { ClientsPage } from './components/clients/ClientsPage'
import { DevisPage } from './components/devis/DevisPage'
import { CommandesPage } from './components/commandes/CommandesPage'
import { FacturesPage } from './components/factures/FacturesPage'
import { CataloguePage } from './components/catalogue/CataloguePage'

function App() {
  const [currentView, setCurrentView] = useState('dashboard')

  // Listen for hash changes to navigate
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1)
      if (hash) {
        setCurrentView(hash)
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    handleHashChange() // Handle initial load

    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />
      case 'cee':
        return <CEECalculator />
      case 'prospects':
        return <ProspectsPage />
      case 'clients':
        return <ClientsPage />
      case 'devis':
        return <DevisPage />
      case 'commandes':
        return <CommandesPage />
      case 'factures':
        return <FacturesPage />
      case 'catalogue':
        return <CataloguePage />
      default:
        return <Dashboard />
    }
  }

  return (
    <Layout>
      {renderContent()}
    </Layout>
  )
}

export default App