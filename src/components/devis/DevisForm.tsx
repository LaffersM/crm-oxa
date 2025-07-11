import React, { useState, useEffect } from 'react'
import { OXADevis, Client } from '../../lib/supabase'
import { X, Save, FileText, User, Calendar, Euro, Percent } from 'lucide-react'

interface DevisFormProps {
  devis?: OXADevis | null
  clients: Client[]
  onSubmit: (data: Partial<OXADevis>) => void
  onCancel: () => void
}

export function DevisForm({ devis, clients, onSubmit, onCancel }: DevisFormProps) {
  const [formData, setFormData] = useState({
    client_id: '',
    statut: 'brouillon' as const,
    date_devis: new Date().toISOString().split('T')[0],
    objet: '',
    description_operation: '',
    total_ht: 0,
    total_tva: 0,
    total_ttc: 0,
    cee_montant_total: 0,
    remarques: '',
    type: 'IPE' as const,
    modalites_paiement: '30% à la commande, 70% à la livraison',
    garantie: '2 ans pièces et main d\'œuvre',
    penalites: 'Pénalités de retard : 0,1% par jour',
    clause_juridique: 'Tribunal de Commerce de Paris'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (devis) {
      setFormData({
        client_id: devis.client_id,
        statut: devis.statut,
        date_devis: devis.date_devis,
        objet: devis.objet,
        description_operation: devis.description_operation,
        total_ht: devis.total_ht,
        total_tva: devis.total_tva,
        total_ttc: devis.total_ttc,
        cee_montant_total: devis.cee_montant_total,
        remarques: devis.remarques || '',
        type: devis.type,
        modalites_paiement: devis.modalites_paiement,
        garantie: devis.garantie,
        penalites: devis.penalites,
        clause_juridique: devis.clause_juridique
      })
    }
  }, [devis])

  const statusOptions = [
    { value: 'brouillon', label: 'Brouillon' },
    { value: 'envoye', label: 'Envoyé' },
    { value: 'accepte', label: 'Accepté' },
    { value: 'refuse', label: 'Refusé' },
    { value: 'expire', label: 'Expiré' }
  ]

  const typeOptions = [
    { value: 'IPE', label: 'IPE' },
    { value: 'ELEC', label: 'ELEC' },
    { value: 'MATERIEL', label: 'MATERIEL' },
    { value: 'MAIN_OEUVRE', label: 'Main d\'œuvre' }
  ]

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.client_id) {
      newErrors.client_id = 'Le client est requis'
    }

    if (!formData.objet.trim()) {
      newErrors.objet = 'L\'objet est requis'
    }

    if (formData.total_ht < 0) {
      newErrors.total_ht = 'Le montant HT doit être positif'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const handleChange = (field: string, value: string | number) => {
    const updatedData = { ...formData, [field]: value }
    
    // Auto-calculate totals when HT amount changes
    if (field === 'total_ht') {
      const ht = Number(value)
      const tva = ht * 0.20 // 20% TVA by default
      const ttc = ht + tva
      updatedData.total_tva = tva
      updatedData.total_ttc = ttc
    }
    
    setFormData(updatedData)
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {devis ? 'Modifier le devis' : 'Nouveau devis'}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4 inline mr-1" />
                  Client *
                </label>
                <select
                  value={formData.client_id}
                  onChange={(e) => handleChange('client_id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.client_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.nom} - {client.entreprise}
                    </option>
                  ))}
                </select>
                {errors.client_id && <p className="mt-1 text-sm text-red-600">{errors.client_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  value={formData.statut}
                  onChange={(e) => handleChange('statut', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Date du devis *
                </label>
                <input
                  type="date"
                  value={formData.date_devis}
                  onChange={(e) => handleChange('date_devis', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
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
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Objet *
              </label>
              <input
                type="text"
                value={formData.objet}
                onChange={(e) => handleChange('objet', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.objet ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ex: Mise en place d'un système de mesurage IPE"
              />
              {errors.objet && <p className="mt-1 text-sm text-red-600">{errors.objet}</p>}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-1" />
              Description de l'opération
            </label>
            <textarea
              value={formData.description_operation}
              onChange={(e) => handleChange('description_operation', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Description détaillée de l'opération à réaliser..."
            />
          </div>

          {/* Montants */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Montants</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Euro className="h-4 w-4 inline mr-1" />
                  Montant HT *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.total_ht}
                  onChange={(e) => handleChange('total_ht', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.total_ht ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.total_ht && <p className="mt-1 text-sm text-red-600">{errors.total_ht}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Percent className="h-4 w-4 inline mr-1" />
                  TVA
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.total_tva}
                  onChange={(e) => handleChange('total_tva', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Euro className="h-4 w-4 inline mr-1" />
                  Montant TTC
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.total_ttc}
                  onChange={(e) => handleChange('total_ttc', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prime CEE
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cee_montant_total}
                  onChange={(e) => handleChange('cee_montant_total', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Conditions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Modalités de paiement</label>
                <input
                  type="text"
                  value={formData.modalites_paiement}
                  onChange={(e) => handleChange('modalites_paiement', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Garantie</label>
                <input
                  type="text"
                  value={formData.garantie}
                  onChange={(e) => handleChange('garantie', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pénalités</label>
                <input
                  type="text"
                  value={formData.penalites}
                  onChange={(e) => handleChange('penalites', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Clause juridique</label>
                <input
                  type="text"
                  value={formData.clause_juridique}
                  onChange={(e) => handleChange('clause_juridique', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-1" />
              Remarques
            </label>
            <textarea
              value={formData.remarques}
              onChange={(e) => handleChange('remarques', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Remarques particulières..."
            />
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
              {devis ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}