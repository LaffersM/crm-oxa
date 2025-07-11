import React, { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { 
  Users, 
  UserPlus, 
  FileText, 
  ShoppingCart, 
  CreditCard, 
  TrendingUp,
  DollarSign,
  Zap,
  Calendar
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface DashboardStats {
  prospects: number
  clients: number
  devis: number
  commandes: number
  factures: number
  ca_total: number
  marge_totale: number
  prime_cee_totale: number
}

export function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    prospects: 0,
    clients: 0,
    devis: 0,
    commandes: 0,
    factures: 0,
    ca_total: 0,
    marge_totale: 0,
    prime_cee_totale: 0
  })
  const [loading, setLoading] = useState(true)
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [statusData, setStatusData] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        // Set demo data if Supabase is not configured
        setStats({
          prospects: 12,
          clients: 8,
          devis: 15,
          commandes: 6,
          factures: 4,
          ca_total: 45000,
          marge_totale: 12000,
          prime_cee_totale: 3500
        })
        setMonthlyData([
          { month: 'Janvier', ca: 15000 },
          { month: 'Février', ca: 18000 },
          { month: 'Mars', ca: 12000 }
        ])
        setStatusData([
          { name: 'brouillon', value: 5 },
          { name: 'envoye', value: 7 },
          { name: 'accepte', value: 3 }
        ])
        setLoading(false)
        return
      }

      // Fetch basic counts
      const [prospects, clients, devis, commandes, factures] = await Promise.all([
        supabase.from('prospects').select('id', { count: 'exact' }),
        supabase.from('clients').select('id', { count: 'exact' }),
        supabase.from('devis').select('id', { count: 'exact' }),
        supabase.from('commandes').select('id', { count: 'exact' }),
        supabase.from('factures').select('id', { count: 'exact' })
      ])

      // Fetch financial data
      const { data: devisData } = await supabase
        .from('devis')
        .select('total_ttc, marge_totale, prime_cee, statut')

      const { data: facturesData } = await supabase
        .from('factures')
        .select('total_ttc, date_facture')
        .eq('statut', 'payee')

      // Calculate totals
      const ca_total = facturesData?.reduce((sum, f) => sum + f.total_ttc, 0) || 0
      const marge_totale = devisData?.reduce((sum, d) => sum + d.marge_totale, 0) || 0
      const prime_cee_totale = devisData?.reduce((sum, d) => sum + d.prime_cee, 0) || 0

      // Prepare monthly data
      const monthlyStats = facturesData?.reduce((acc: any, facture) => {
        const month = new Date(facture.date_facture).toLocaleString('fr-FR', { month: 'long' })
        acc[month] = (acc[month] || 0) + facture.total_ttc
        return acc
      }, {})

      const monthlyArray = Object.entries(monthlyStats || {}).map(([month, ca]) => ({
        month,
        ca
      }))

      // Prepare status data
      const statusStats = devisData?.reduce((acc: any, devis) => {
        acc[devis.statut] = (acc[devis.statut] || 0) + 1
        return acc
      }, {})

      const statusArray = Object.entries(statusStats || {}).map(([status, count]) => ({
        name: status,
        value: count
      }))

      setStats({
        prospects: prospects.count || 0,
        clients: clients.count || 0,
        devis: devis.count || 0,
        commandes: commandes.count || 0,
        factures: factures.count || 0,
        ca_total,
        marge_totale,
        prime_cee_totale
      })

      setMonthlyData(monthlyArray)
      setStatusData(statusArray)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Tableau de bord
        </h1>
        <p className="text-gray-600 mt-1">
          Bienvenue {profile?.prenom}, voici un aperçu de votre activité
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Prospects</p>
              <p className="text-2xl font-bold text-gray-900">{stats.prospects}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <UserPlus className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clients</p>
              <p className="text-2xl font-bold text-gray-900">{stats.clients}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Devis</p>
              <p className="text-2xl font-bold text-gray-900">{stats.devis}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Commandes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.commandes}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.ca_total)}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Marge totale</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.marge_totale)}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Primes CEE</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.prime_cee_totale)}</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <Zap className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">CA mensuel</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Bar dataKey="ca" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statut des devis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}