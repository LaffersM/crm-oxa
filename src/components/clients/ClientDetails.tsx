import React from 'react'
import { Client } from '../../lib/supabase'
import { X, Edit, User, Building, Mail, Phone, MapPin, FileText, Calendar, Hash } from 'lucide-react'

interface ClientDetailsProps {
  client: Client
  onClose: () => void
  onEdit: () => void
}

export function ClientDetails({ client, onClose, onEdit }: ClientDetailsProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Détails du client</h2>
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
              <h3 className="text-2xl font-bold text-gray-900">{client.nom}</h3>
              <p className="text-lg text-gray-600 flex items-center mt-1">
                <Building className="h-5 w-5 mr-2" />
                {client.entreprise}
              </p>
              {client.siret && (
                <p className="text-sm text-gray-500 flex items-center mt-1">
                  <Hash className="h-4 w-4 mr-1" />
                  SIRET: {client.siret}
                </p>
              )}
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Client actif
              </span>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 mb-4">Informations de contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {client.contact_principal && (
                <div className="flex items-start">
                  <User className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Contact principal</p>
                    <p className="font-medium text-gray-900">{client.contact_principal}</p>
                  </div>
                </div>
              )}

              {client.email && (
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <a 
                      href={`mailto:${client.email}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {client.email}
                    </a>
                  </div>
                </div>
              )}
              
              {client.telephone && (
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Téléphone</p>
                    <a 
                      href={`tel:${client.telephone}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {client.telephone}
                    </a>
                  </div>
                </div>
              )}

              {(client.adresse || client.ville) && (
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Adresse</p>
                    <div className="font-medium text-gray-900">
                      {client.adresse && <p>{client.adresse}</p>}
                      {(client.ville || client.code_postal) && (
                        <p>
                          {client.code_postal && `${client.code_postal} `}
                          {client.ville}
                        </p>
                      )}
                      {client.pays && client.pays !== 'France' && <p>{client.pays}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Dates importantes
              </h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Client depuis le : {new Date(client.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
                <p>Dernière modification : {new Date(client.updated_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              </div>
            </div>

            {client.prospect_id && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Historique</h4>
                <p className="text-sm text-gray-600">
                  Converti depuis un prospect
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          {client.notes && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Notes
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{client.notes}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3">Actions rapides</h4>
            <div className="flex flex-wrap gap-2">
              {client.email && (
                <a
                  href={`mailto:${client.email}`}
                  className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Envoyer un email
                </a>
              )}
              {client.telephone && (
                <a
                  href={`tel:${client.telephone}`}
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