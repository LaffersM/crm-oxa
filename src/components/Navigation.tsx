import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { 
  Home, 
  Users, 
  UserPlus, 
  FileText, 
  ShoppingCart, 
  CreditCard, 
  Package, 
  Calculator,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react'

export function Navigation() {
  const { profile, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '#dashboard' },
    { icon: UserPlus, label: 'Prospects', href: '#prospects' },
    { icon: Users, label: 'Clients', href: '#clients' },
    { icon: FileText, label: 'Devis', href: '#devis' },
    { icon: ShoppingCart, label: 'Commandes', href: '#commandes' },
    { icon: CreditCard, label: 'Factures', href: '#factures' },
    { icon: Package, label: 'Catalogue', href: '#catalogue' },
    { icon: Calculator, label: 'Calculateur CEE', href: '#cee' },
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo et titre */}
          <div className="flex items-center flex-shrink-0">
            <div className="flex-shrink-0 flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">OXA</span>
              </div>
              <span className="ml-2 text-lg font-bold text-gray-900 hidden sm:block">OXA Groupe CRM</span>
              <span className="ml-2 text-lg font-bold text-gray-900 sm:hidden">OXA</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center px-2 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors whitespace-nowrap"
              >
                <item.icon className="h-4 w-4 mr-2" />
                <span className="hidden xl:inline">{item.label}</span>
              </a>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex items-center space-x-3">
              <span className="text-sm text-gray-700 truncate max-w-32">
                {profile?.prenom} {profile?.nom}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {profile?.role}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center px-2 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden lg:inline">Déconnexion</span>
            </button>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.label}
              </a>
            ))}
          </div>
          <div className="border-t border-gray-200 pt-4 pb-3">
            <div className="px-3 space-y-1">
              <div className="text-base font-medium text-gray-900">
                {profile?.prenom} {profile?.nom}
              </div>
              <div className="text-sm text-gray-500">{profile?.email}</div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}