import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface DevisData {
  numero: string
  date_devis: string
  objet: string
  client: any
  description_operation: string
  lignes: any[]
  total_ht: number
  total_tva: number
  total_ttc: number
  cee_kwh_cumac?: number
  cee_prix_unitaire?: number
  cee_montant_total?: number
  reste_a_payer_ht?: number
  delais: string
  modalites_paiement: string
  garantie: string
  penalites: string
  clause_juridique: string
}

export const generateDevisPDF = async (devisData: DevisData, isCEE: boolean = false) => {
  try {
    // Créer un élément HTML temporaire pour le PDF
    const pdfElement = document.createElement('div')
    pdfElement.style.position = 'absolute'
    pdfElement.style.left = '-9999px'
    pdfElement.style.width = '210mm'
    pdfElement.style.backgroundColor = 'white'
    pdfElement.style.padding = '20mm'
    pdfElement.style.fontFamily = 'Arial, sans-serif'
    pdfElement.style.fontSize = '12px'
    pdfElement.style.lineHeight = '1.4'

    // Générer le contenu HTML du devis
    pdfElement.innerHTML = generateDevisHTML(devisData, isCEE)

    // Ajouter l'élément au DOM temporairement
    document.body.appendChild(pdfElement)

    // Générer le canvas à partir de l'élément HTML
    const canvas = await html2canvas(pdfElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    })

    // Supprimer l'élément temporaire
    document.body.removeChild(pdfElement)

    // Créer le PDF
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgWidth = 210
    const pageHeight = 295
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight

    let position = 0

    // Ajouter la première page
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    // Ajouter des pages supplémentaires si nécessaire
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // Télécharger le PDF
    const fileName = `${devisData.numero || 'devis'}_${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(fileName)

    return true
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error)
    throw new Error('Impossible de générer le PDF')
  }
}

const generateDevisHTML = (devisData: DevisData, isCEE: boolean): string => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Grouper les lignes par zone
  const groupedLines = devisData.lignes.reduce((acc, ligne) => {
    const zone = ligne.zone || 'Général'
    if (!acc[zone]) acc[zone] = []
    acc[zone].push(ligne)
    return acc
  }, {} as Record<string, any[]>)

  return `
    <div style="max-width: 100%; margin: 0 auto; color: #333;">
      <!-- En-tête OXA -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 3px solid #2563eb; padding-bottom: 20px;">
        <div style="display: flex; align-items: center;">
          <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #2563eb, #1d4ed8); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-right: 20px;">
            <span style="color: white; font-weight: bold; font-size: 24px;">OXA</span>
          </div>
          <div>
            <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #1f2937;">OXA GROUPE</h1>
            <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Décarbonation Industrielle</p>
          </div>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; font-size: 24px; font-weight: bold; color: #2563eb;">
            ${isCEE ? 'DEVIS CEE' : 'DEVIS'}
          </h2>
          <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: 600;">${devisData.numero}</p>
        </div>
      </div>

      <!-- Informations devis et client -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
        <div>
          <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">
            Informations du devis
          </h3>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${formatDate(devisData.date_devis)}</p>
          <p style="margin: 5px 0;"><strong>Objet:</strong> ${devisData.objet}</p>
          <p style="margin: 5px 0;"><strong>Délais:</strong> ${devisData.delais}</p>
        </div>
        
        ${devisData.client ? `
        <div>
          <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">
            Client
          </h3>
          <p style="margin: 5px 0;"><strong>${devisData.client.entreprise}</strong></p>
          <p style="margin: 5px 0;">${devisData.client.nom}</p>
          ${devisData.client.email ? `<p style="margin: 5px 0;">${devisData.client.email}</p>` : ''}
          ${devisData.client.telephone ? `<p style="margin: 5px 0;">${devisData.client.telephone}</p>` : ''}
          ${devisData.client.adresse ? `<p style="margin: 5px 0;">${devisData.client.adresse}</p>` : ''}
          ${devisData.client.ville ? `<p style="margin: 5px 0;">${devisData.client.code_postal || ''} ${devisData.client.ville}</p>` : ''}
          ${devisData.client.siret ? `<p style="margin: 5px 0; font-size: 11px; color: #6b7280;">SIRET: ${devisData.client.siret}</p>` : ''}
        </div>
        ` : ''}
      </div>

      <!-- Description de l'opération -->
      ${devisData.description_operation ? `
      <div style="margin-bottom: 30px;">
        <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">
          Description de l'opération
        </h3>
        <p style="margin: 0; line-height: 1.6; text-align: justify;">${devisData.description_operation}</p>
      </div>
      ` : ''}

      <!-- Tableau des prestations -->
      <div style="margin-bottom: 30px;">
        <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">
          Détail des prestations
        </h3>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: bold;">Désignation</th>
              <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-weight: bold; width: 60px;">Qté</th>
              <th style="border: 1px solid #d1d5db; padding: 8px; text-align: right; font-weight: bold; width: 80px;">Prix unit. HT</th>
              <th style="border: 1px solid #d1d5db; padding: 8px; text-align: right; font-weight: bold; width: 80px;">Total HT</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(groupedLines).map(([zone, lignes]) => `
              <tr style="background-color: #dbeafe;">
                <td colspan="4" style="border: 1px solid #d1d5db; padding: 8px; font-weight: bold; color: #1e40af;">
                  ${zone}
                </td>
              </tr>
              ${lignes.map(ligne => `
                <tr>
                  <td style="border: 1px solid #d1d5db; padding: 8px;">
                    ${ligne.designation}
                    ${ligne.remarques ? `<br><small style="color: #6b7280; font-style: italic;">${ligne.remarques}</small>` : ''}
                  </td>
                  <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">${ligne.quantite}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">${formatCurrency(ligne.prix_unitaire)}</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right; font-weight: 600;">${formatCurrency(ligne.prix_total)}</td>
                </tr>
              `).join('')}
            `).join('')}
          </tbody>
        </table>
      </div>

      ${isCEE && devisData.cee_montant_total ? `
      <!-- Section CEE -->
      <div style="margin-bottom: 30px; background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
        <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #92400e;">
          Certificats d'Économies d'Énergie (CEE)
        </h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; font-size: 12px;">
          <div>
            <p style="margin: 0; color: #92400e;"><strong>kWh cumac:</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 14px; font-weight: bold;">${devisData.cee_kwh_cumac?.toFixed(2) || 0} MWh</p>
          </div>
          <div>
            <p style="margin: 0; color: #92400e;"><strong>Prix unitaire:</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 14px; font-weight: bold;">${devisData.cee_prix_unitaire?.toFixed(2) || 0} €/MWh</p>
          </div>
          <div>
            <p style="margin: 0; color: #92400e;"><strong>Prime CEE:</strong></p>
            <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold; color: #059669;">${formatCurrency(devisData.cee_montant_total)}</p>
          </div>
        </div>
      </div>
      ` : ''}

      <!-- Récapitulatif financier -->
      <div style="margin-bottom: 30px;">
        <div style="display: flex; justify-content: flex-end;">
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; min-width: 300px;">
            <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #374151; text-align: center;">
              Récapitulatif
            </h3>
            
            <div style="space-y: 8px;">
              <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                <span>Total HT:</span>
                <span style="font-weight: 600;">${formatCurrency(devisData.total_ht)}</span>
              </div>
              
              ${isCEE && devisData.cee_montant_total ? `
              <div style="display: flex; justify-content: space-between; padding: 5px 0; color: #059669;">
                <span>Prime CEE:</span>
                <span style="font-weight: 600;">- ${formatCurrency(devisData.cee_montant_total)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 5px 0; border-top: 1px solid #d1d5db;">
                <span>Reste à payer HT:</span>
                <span style="font-weight: 600;">${formatCurrency(devisData.reste_a_payer_ht || 0)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                <span>TVA (20%):</span>
                <span style="font-weight: 600;">${formatCurrency(devisData.total_tva)}</span>
              </div>
              ` : `
              <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                <span>TVA (20%):</span>
                <span style="font-weight: 600;">${formatCurrency(devisData.total_tva)}</span>
              </div>
              `}
              
              <div style="display: flex; justify-content: space-between; padding: 10px 0; border-top: 2px solid #374151; font-size: 16px; font-weight: bold;">
                <span>TOTAL TTC:</span>
                <span>${formatCurrency(devisData.total_ttc)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Conditions -->
      <div style="margin-bottom: 30px;">
        <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">
          Conditions
        </h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 11px;">
          <div>
            <p style="margin: 0 0 10px 0;"><strong>Modalités de paiement:</strong></p>
            <p style="margin: 0 0 15px 0;">${devisData.modalites_paiement}</p>
            
            <p style="margin: 0 0 10px 0;"><strong>Garantie:</strong></p>
            <p style="margin: 0;">${devisData.garantie}</p>
          </div>
          <div>
            <p style="margin: 0 0 10px 0;"><strong>Pénalités:</strong></p>
            <p style="margin: 0 0 15px 0;">${devisData.penalites}</p>
            
            <p style="margin: 0 0 10px 0;"><strong>Clause juridique:</strong></p>
            <p style="margin: 0;">${devisData.clause_juridique}</p>
          </div>
        </div>
      </div>

      <!-- Signature -->
      <div style="margin-top: 40px; border: 2px solid #dbeafe; border-radius: 8px; padding: 20px; background-color: #eff6ff;">
        <h3 style="margin: 0 0 20px 0; font-size: 16px; font-weight: bold; color: #1e40af; text-align: center;">
          Validation client
        </h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; text-align: center;">
          <div>
            <p style="margin: 0 0 10px 0; font-size: 12px; color: #1e40af; font-weight: 600;">Nom / Fonction</p>
            <div style="height: 60px; border-bottom: 1px solid #93c5fd;"></div>
          </div>
          <div>
            <p style="margin: 0 0 10px 0; font-size: 12px; color: #1e40af; font-weight: 600;">Signature</p>
            <div style="height: 60px; border-bottom: 1px solid #93c5fd;"></div>
          </div>
          <div>
            <p style="margin: 0 0 10px 0; font-size: 12px; color: #1e40af; font-weight: 600;">Date</p>
            <div style="height: 60px; border-bottom: 1px solid #93c5fd;"></div>
          </div>
        </div>
        <p style="text-align: center; margin: 20px 0 0 0; font-size: 12px; font-weight: bold; color: #1e40af;">
          Mention manuscrite obligatoire : "Bon pour accord"
        </p>
      </div>

      <!-- Pied de page -->
      <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px;">
        <p style="margin: 0;">OXA GROUPE - Décarbonation Industrielle</p>
        <p style="margin: 5px 0 0 0;">Ce devis est valable 30 jours à compter de sa date d'émission</p>
      </div>
    </div>
  `
}