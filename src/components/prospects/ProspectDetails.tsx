import React from 'react'
import { Prospect } from '../../lib/supabase'
import { X, Edit, User, Building, Mail, Phone, Tag, FileText, Calendar, TrendingUp } from 'lucide-react'

interface ProspectDetailsProps {
  prospect: Prospect
  onClose: () => void
  onEdit: () => void
}

export function ProspectDetails({ prospect, onClose, onEdit }: ProspectDetailsProps) {
  const getStatusColor = (status: string) => {
    const colors = {
      nouveau: 'bg-blue-100 text-blue-800',
      contacte: 'bg-yellow-100 text-yellow-800',
      qualifie: 'bg-purple-100 text-purple-800',
      converti: 'bg-green-100 text-green-800',
      perdu: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      nouveau: 'Nouveau',
      contacte: 'Contacté',
      qualifie: 'Qualifié',
      converti: 'Converti',
      perdu: 'Perdu'
    }
    return labels[status as keyof typeof labels] || status
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Détails du prospect</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={onEdit}
              className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
              title="Modifier"
            >
              <Edit className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{prospect.nom}</h3>
              <p className="text-lg text-gray-600 flex items-center mt-1">
                <Building className="h-5 w-5 mr-2" />
                {prospect.entreprise}
              </p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(prospect.statut)}`}>
              <TrendingUp className="h-4 w-4 mr-1" />
              {getStatusLabel(prospect.statut)}
            </span>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Informations de contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prospect.email && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <a 
                      href={`mailto:${prospect.email}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {prospect.email}
                    </a>
                  </div>
                </div>
              )}
              
              {prospect.telephone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Téléphone</p>
                    <a 
                      href={`tel:${prospect.telephone}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {prospect.telephone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {prospect.source && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Tag className="h-4 w-4 mr-2" />
                  Source
                </h4>
                <p className="text-gray-600">{prospect.source}</p>
              </div>
            )}

            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Dates importantes
              </h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Créé le : {new Date(prospect.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
                <p>Modifié le : {new Date(prospect.updated_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {prospect.notes && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Notes
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{prospect.notes}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3">Actions rapides</h4>
            <div className="flex flex-wrap gap-2">
              {prospect.email && (
                <a
                  href={`mailto:${prospect.email}`}
                  className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer un email
                </a>
              )}
              {prospect.telephone && (
                <a
                  href={`tel:${prospect.telephone}`}
                  className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Appeler
                </a>
              )}
              <button
                onClick={onEdit}
                className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}