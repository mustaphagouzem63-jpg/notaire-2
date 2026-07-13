// ============================================================
// PDF SERVICE — Generate contract PDFs with pdfmake
// ============================================================

import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import PdfPrinter from 'pdfmake'
import QRCode from 'qrcode'
import crypto from 'crypto'
import type { IContractWithClients } from '@shared/types/entities'
import { getSetting } from '../database/repositories/settings'

// Define font files (assuming they are placed in assets or using standard fonts for now)
const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  },
  Amiri: {
    // Fallback to standard fonts if Amiri is not bundled in Node env
    // In a real production app, we would point to actual .ttf files
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
}

  // @ts-expect-error - pdfmake exports a constructor but types mismatch
  const printer = new PdfPrinter(fonts)

export async function generateContractPdf(contract: IContractWithClients, templateContentFr: string, templateContentAr: string): Promise<string> {
  const officeNameFr = getSetting('office_name') || 'Office Notarial'
  const officeNameAr = getSetting('office_name_ar') || 'مكتب التوثيق'
  
  // Generate a document hash for verification
  const hashContent = `${contract.contract_number}-${contract.created_at}`
  const documentHash = crypto.createHash('sha256').update(hashContent).digest('hex').substring(0, 16)
  
  // Generate QR Code as Data URI
  const qrCodeDataUrl = await QRCode.toDataURL(`NOTARY-VERIFY:${documentHash}`, { width: 100, margin: 1 })
  
  // Replace placeholders in template content
  // Note: A real app would use a more robust templating engine, but this works for our basic needs
  const replacePlaceholders = (text: string) => {
    return text
      .replace(/{{contract_number}}/g, contract.contract_number)
      .replace(/{{date}}/g, contract.signed_date || new Date().toLocaleDateString())
      .replace(/{{office_name}}/g, officeNameFr)
      .replace(/{{office_name_ar}}/g, officeNameAr)
      .replace(/{{client_a_name}}/g, contract.client_a_name)
      .replace(/{{client_b_name}}/g, contract.client_b_name || '')
      .replace(/{{client_a_name_ar}}/g, contract.client_a_name) // Using name for now, normally we'd pull full_name_ar
      .replace(/{{client_b_name_ar}}/g, contract.client_b_name || '')
      .replace(/{{property_details}}/g, contract.property_details || '')
      .replace(/{{property_details_ar}}/g, contract.property_details || '')
      .replace(/{{notary_fees}}/g, contract.notary_fees.toString())
      .replace(/{{government_tax}}/g, contract.government_tax.toString())
      .replace(/{{stamp_duty}}/g, contract.stamp_duty.toString())
      // Provide defaults for missing ones
      .replace(/{{[a-zA-Z0-9_]+}}/g, '__________________')
  }

  const contentFrReplaced = replacePlaceholders(templateContentFr)
  const contentArReplaced = replacePlaceholders(templateContentAr)

  const docDefinition = {
    content: [
      // Header
      {
        columns: [
          { text: officeNameFr, style: 'header', alignment: 'left' },
          { text: officeNameAr, style: 'header', alignment: 'right' } // Arabic
        ]
      },
      { text: `Réf: ${contract.contract_number}`, margin: [0, 10, 0, 20] },
      
      // QR Code
      { image: qrCodeDataUrl, width: 80, alignment: 'center', margin: [0, 0, 0, 20] },
      
      // Body (Side-by-side or sequential depending on layout preference, here we do sequential for simplicity)
      { text: 'VERSION FRANÇAISE', style: 'subheader', alignment: 'center', margin: [0, 0, 0, 10] },
      { text: contentFrReplaced, style: 'body' },
      
      { text: '', pageBreak: 'before' },
      
      { text: 'النسخة العربية', style: 'subheader', alignment: 'center', margin: [0, 0, 0, 10] },
      // Note: pdfmake support for RTL requires specific fonts and text direction settings
      // We set alignment to right for Arabic content
      { text: contentArReplaced, style: 'body', alignment: 'right' }
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true
      },
      subheader: {
        fontSize: 14,
        bold: true
      },
      body: {
        fontSize: 11,
        lineHeight: 1.5
      }
    },
    defaultStyle: {
      font: 'Roboto'
    }
  }

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = printer.createPdfKitDocument(docDefinition as any)
      
      const userDataPath = app.getPath('userData')
      const fileName = `${contract.contract_number}.pdf`.replace(/\//g, '-')
      const outputPath = path.join(userDataPath, 'documents', 'contracts', fileName)
      
      const writeStream = fs.createWriteStream(outputPath)
      pdfDoc.pipe(writeStream)
      pdfDoc.end()
      
      writeStream.on('finish', () => {
        resolve(outputPath)
      })
      
      writeStream.on('error', (err) => {
        reject(err)
      })
    } catch (err) {
      reject(err)
    }
  })
}
