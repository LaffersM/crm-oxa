import React, { useState } from 'react'
import { Calculator, Zap, FileText, Save } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

interface CEECalculation {
  puissance: number
  coefficient_activite: number
  duree_engagement: number
  kwh_cumac: number
  tarif_kwh: number
  prime_estimee: number
  notes: string
}

export function CEECalculator() {
  const [calculation, setCalculation] = useState<CEECalculation>({
    puissance: 0,
    coefficient_activite: 1,
    duree_engagement: 1,
    kwh_cumac: 0,
    tarif_kwh: 0.002,
    prime_estimee: 0,
    notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const coefficients = [
    { value: 1, label: '1×8h (8h/jour)' },
    { value: 2, label: '2×8h (16h/jour)' },
    { value: 3, label: '3×8h (24h/jour)' }
  ]

  const durees = [
    { value: 1, label: '1 an' },
    { value: 1.5, label: '1,5 ans' },
    { value: 2, label: '2 ans' },
    { value: 2.5, label: '2,5 ans' },
    { value: 3, label: '3 ans' },
    { value: 3.5, label: '3,5 ans' },
    { value: 4, label: '4 ans' },
    { value: 4.5, label: '4,5 ans' },
    { value: 5, label: '5 ans' },
    { value: 5.45, label: '5,45 ans (max)' }
  ]

  const calculateCEE = () => {
    // Formule CEE selon fiche IND UT 134
    // kWh cumac = 29.4 × coefficient activité × P × F
    const kwh_cumac = 29.4 * calculation.coefficient_activite * calculation.puissance * calculation.duree_engagement
    const prime_estimee = kwh_cumac * calculation.tarif_kwh

    setCalculation({
      ...calculation,
      kwh_cumac,
      prime_estimee
    })
  }

  const handleInputChange = (field: keyof CEECalculation, value: number | string) => {
    const updatedCalculation = {
      ...calculation,
      [field]: value
    }
    setCalculation(updatedCalculation)
    
    // Auto-calculate when key values change
    if (['puissance', 'coefficient_activite', 'duree_engagement', 'tarif_kwh'].includes(field)) {
      const kwh_cumac = 29.4 * updatedCalculation.coefficient_activite * updatedCalculation.puissance * updatedCalculation.duree_engagement
      const prime_estimee = kwh_cumac * updatedCalculation.tarif_kwh
      
      setCalculation({
        ...updatedCalculation,
        kwh_cumac,
        prime_estimee
      })
    }
  }

  const saveCalculation = async () => {
    if (!isSupabaseConfigured()) {
      alert('Supabase n\'est pas configuré. La sauvegarde n\'est pas disponible.')
      return
    }
    
    setSaving(true)
    try {
      const { error } = await supabase
        .from('cee_calculs')
        .insert([calculation])

      if (error) throw error

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving calculation:', error)
    } finally {
      setSaving(false)
    }
  }

  const resetCalculation = () => {
    setCalculation({
      puissance: 0,
      coefficient_activite: 1,
      duree_engagement: 1,
      kwh_cumac: 0,
      tarif_kwh: 0.002,
      prime_estimee: 0,
      notes: ''
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 2
    }).format(value)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Calculator className="h-8 w-8 mr-3 text-blue-600" />
          Calculateur CEE
        </h1>
        <p className="text-gray-600 mt-1">
          Calcul des primes CEE selon la fiche standardisée IND UT 134
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulaire de calcul */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            Paramètres de calcul
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Puissance (P) en kW
              </label>
              <input
                type="number"
                value={calculation.puissance}
                onChange={(e) => handleInputChange('puissance', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: 100"
                min="0"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coefficient d'activité
              </label>
              <select
                value={calculation.coefficient_activite}
                onChange={(e) => handleInputChange('coefficient_activite', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {coefficients.map((coef) => (
                  <option key={coef.value} value={coef.value}>
                    {coef.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée d'engagement (F)
              </label>
              <select
                value={calculation.duree_engagement}
                onChange={(e) => handleInputChange('duree_engagement', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {durees.map((duree) => (
                  <option key={duree.value} value={duree.value}>
                    {duree.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tarif CEE (€/kWh cumac)
              </label>
              <input
                type="number"
                value={calculation.tarif_kwh}
                onChange={(e) => handleInputChange('tarif_kwh', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: 0.002"
                min="0"
                step="0.001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={calculation.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Notes ou commentaires sur le calcul..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={calculateCEE}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Calculer
              </button>
              <button
                onClick={resetCalculation}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Résultats */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-600" />
            Résultats CEE
          </h2>

          <div className="space-y-6">
            {/* Formule */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Formule CEE (IND UT 134)</h3>
              <p className="text-sm text-blue-700 font-mono">
                kWh cumac = 29.4 × {calculation.coefficient_activite} × {calculation.puissance} × {calculation.duree_engagement}
              </p>
            </div>

            {/* Résultats */}
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">kWh cumac</span>
                <span className="text-lg font-semibold text-gray-900">
                  {formatNumber(calculation.kwh_cumac)} kWh
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">Tarif appliqué</span>
                <span className="text-lg font-semibold text-gray-900">
                  {calculation.tarif_kwh} €/kWh
                </span>
              </div>

              <div className="flex justify-between items-center py-3 bg-green-50 px-4 rounded-lg">
                <span className="text-base font-medium text-green-800">Prime CEE estimée</span>
                <span className="text-2xl font-bold text-green-900">
                  {formatCurrency(calculation.prime_estimee)}
                </span>
              </div>
            </div>

            {/* Détails du calcul */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Détails du calcul</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div>Puissance installée: {calculation.puissance} kW</div>
                <div>Coefficient d'activité: {calculation.coefficient_activite}</div>
                <div>Durée d'engagement: {calculation.duree_engagement} ans</div>
                <div>Facteur de calcul: 29.4 (fiche IND UT 134)</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={saveCalculation}
                disabled={saving || calculation.prime_estimee === 0}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>

            {saved && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-600">✓ Calcul sauvegardé avec succès</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Informations sur la fiche CEE */}
      <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          À propos de la fiche IND UT 134
        </h2>
        <div className="prose prose-sm text-gray-600">
          <p>
            La fiche standardisée IND UT 134 concerne les installations industrielles et permet de calculer 
            les économies d'énergie en kWh cumac (cumulés actualisés) selon la formule:
          </p>
          <ul className="mt-4 space-y-2">
            <li>• <strong>29.4</strong> : Facteur de conversion standardisé</li>
            <li>• <strong>Coefficient d'activité</strong> : Nombre d'équipes de travail par jour</li>
            <li>• <strong>P</strong> : Puissance installée en kW</li>
            <li>• <strong>F</strong> : Durée d'engagement (1 à 5,45 ans)</li>
          </ul>
          <p className="mt-4">
            Le montant de la prime CEE dépend du marché et varie selon les obligés. 
            Le tarif par défaut de 0,002 €/kWh cumac est indicatif.
          </p>
        </div>
      </div>
    </div>
  )
}