const fs = require('fs')
const path = require('path')

// Lazy load pdfkit to avoid crashing if not installed
let PDFDocument = null
function getPDFDocument() {
  if (!PDFDocument) {
    try {
      PDFDocument = require('pdfkit')
    } catch (error) {
      throw new Error('PDFKit is not installed. Please run: npm install pdfkit')
    }
  }
  return PDFDocument
}

class PDFService {
  /**
   * Generate Requirements Checklist PDF
   * @returns {Promise<Buffer>} PDF buffer
   */
  async generateRequirementsChecklistPDF() {
    return new Promise((resolve, reject) => {
      try {
        const PDFDocClass = getPDFDocument()
        // Optimized margins for better space utilization while maintaining professionalism
        const margin = 50
        const doc = new PDFDocClass({
          size: 'LETTER',
          margins: { top: margin, bottom: margin, left: margin, right: margin }
        })

        const chunks = []
        doc.on('data', chunk => chunks.push(chunk))
        doc.on('end', () => resolve(Buffer.concat(chunks)))
        doc.on('error', reject)

        const pageWidth = doc.page.width
        const pageHeight = doc.page.height
        const contentWidth = pageWidth - (margin * 2)

        // Generate document reference number
        const now = new Date()
        const docDate = now.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit'
        })
        const docTime = now.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true
        })
        const docNumber = `BRC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

        // Draw top border line (double line effect)
        doc.strokeColor('#000000')
        doc.lineWidth(2)
        doc.moveTo(margin, margin - 15)
          .lineTo(pageWidth - margin, margin - 15)
          .stroke()
        doc.lineWidth(1)
        doc.moveTo(margin, margin - 13)
          .lineTo(pageWidth - margin, margin - 13)
          .stroke()

        // Official Header - Optimized spacing
        doc.fontSize(14)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('REPUBLIC OF THE PHILIPPINES', { align: 'center' })
          .moveDown(0.2)

        doc.fontSize(16)
          .font('Helvetica-Bold')
          .text('LOCAL GOVERNMENT UNIT', { align: 'center' })
          .moveDown(0.2)

        doc.fontSize(14)
          .font('Helvetica-Bold')
          .text('BUSINESS PERMIT AND LICENSING OFFICE', { align: 'center' })
          .moveDown(0.5)

        // Document Title Box - Reduced height with precise text positioning
        const titleY = doc.y
        const titleBoxX = margin + 15
        const titleBoxWidth = contentWidth - 30
        const titleBoxHeight = 40
        
        // Draw the box first
        doc.roundedRect(titleBoxX, titleY, titleBoxWidth, titleBoxHeight, 3)
          .strokeColor('#000000')
          .lineWidth(1.5)
          .stroke()
        
        // Calculate centered positions for text inside the box
        const titleTextY = titleY + 10
        const subtitleTextY = titleY + 26
        
        doc.fontSize(16)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('REQUIREMENTS CHECKLIST', titleBoxX, titleTextY, {
            align: 'center',
            width: titleBoxWidth
          })

        doc.fontSize(11)
          .font('Helvetica')
          .fillColor('#000000')
          .text('For New Business Registration Application', titleBoxX, subtitleTextY, {
            align: 'center',
            width: titleBoxWidth
          })

        doc.y = titleY + titleBoxHeight + 4
        doc.moveDown(0.4)

        // Document Metadata - Optimized spacing
        doc.fontSize(8.5)
          .font('Helvetica')
          .fillColor('#333333')
          .text(`Document No.: ${docNumber}`, margin + 15, doc.y, { continued: true })
          .text(`Date Issued: ${docDate}`, { align: 'right' })
          
        doc.moveDown(0.2)
        doc.text(`Time Generated: ${docTime}`, margin + 15, doc.y, { continued: true })
        doc.text(`Page 1 of 1`, { align: 'right' })

        // Horizontal separator line
        doc.moveDown(0.4)
        doc.strokeColor('#000000')
        doc.lineWidth(1)
        doc.moveTo(margin, doc.y)
          .lineTo(pageWidth - margin, doc.y)
          .stroke()
        doc.moveDown(0.8)

        // Section A: LGU Requirements
        const sectionAY = doc.y
        doc.fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('A. LOCAL GOVERNMENT UNIT (LGU) REQUIREMENTS', { indent: 0 })
          .moveDown(0.2)

        // Underline section heading
        const sectionAEndY = doc.y - 4
        doc.lineWidth(1)
        doc.moveTo(margin + 10, sectionAEndY)
          .lineTo(pageWidth - margin - 10, sectionAEndY)
          .stroke()

        doc.moveDown(0.4)
        doc.fontSize(9.5)
          .font('Helvetica')
          .fillColor('#000000')
        
        const lguRequirements = [
          'Duly Accomplished Application Form',
          'One (1) 2×2 ID Picture',
          'Valid IDs of the business owner',
          'Occupancy Permit (if applicable)',
          'Fire Safety Inspection Certificate from the Bureau of Fire Protection',
          'Sanitary Permit from the Local Health Office',
          'Community Tax Certificate (CTC)',
          'Barangay Business Clearance',
          'DTI / SEC / CDA Registration',
          'Lease Contract or Land Title (if applicable)',
          'Certificate of Occupancy',
          'Health Certificate (for food-related businesses)',
          'Other applicable national or sectoral requirements'
        ]
        
        lguRequirements.forEach((item, index) => {
          const checkBoxX = margin + 18
          const checkBoxY = doc.y + 2
          // Draw checkbox - smaller size
          doc.rect(checkBoxX, checkBoxY, 7, 7)
            .strokeColor('#000000')
            .lineWidth(0.7)
            .stroke()
          
          // Item text
          doc.fontSize(9.5)
            .font('Helvetica')
            .fillColor('#000000')
            .text(`${index + 1}. ${item}`, { indent: 32, width: contentWidth - 50 })
        })

        doc.moveDown(0.8)

        // Section B: BIR Requirements
        const sectionBY = doc.y
        doc.fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('B. BUREAU OF INTERNAL REVENUE (BIR) REQUIREMENTS', { indent: 0 })
          .moveDown(0.2)

        // Underline section heading
        const sectionBEndY = doc.y - 4
        doc.lineWidth(1)
        doc.moveTo(margin + 10, sectionBEndY)
          .lineTo(pageWidth - margin - 10, sectionBEndY)
          .stroke()

        doc.moveDown(0.4)
        doc.fontSize(9.5)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('Required Documents:', { indent: 0 })
          .moveDown(0.2)

        doc.fontSize(9.5)
          .font('Helvetica')
        
        const birDocuments = [
          "Mayor's Permit or proof of ongoing LGU application",
          'DTI / SEC / CDA Registration',
          'Barangay Clearance',
          'Valid government-issued ID of the business owner',
          'Lease Contract or Land Title'
        ]
        
        birDocuments.forEach((item, index) => {
          const checkBoxX = margin + 18
          const checkBoxY = doc.y + 2
          doc.rect(checkBoxX, checkBoxY, 7, 7)
            .strokeColor('#000000')
            .lineWidth(0.7)
            .stroke()
          
          doc.fontSize(9.5)
            .font('Helvetica')
            .fillColor('#000000')
            .text(`${index + 1}. ${item}`, { indent: 32, width: contentWidth - 50 })
        })

        doc.moveDown(0.6)

        doc.fontSize(9.5)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('BIR Fees:', { indent: 0 })
          .moveDown(0.2)

        doc.fontSize(9.5)
          .font('Helvetica')
          .fillColor('#000000')
        
        const birFees = [
          'Registration Fee: ₱500.00',
          'Documentary Stamp Tax: Varies depending on business capital'
        ]
        
        birFees.forEach((item, index) => {
          const checkBoxX = margin + 18
          const checkBoxY = doc.y + 2
          doc.rect(checkBoxX, checkBoxY, 7, 7)
            .strokeColor('#000000')
            .lineWidth(0.7)
            .stroke()
          
          doc.fontSize(9.5)
            .font('Helvetica')
            .fillColor('#000000')
            .text(`${index + 1}. ${item}`, { indent: 32, width: contentWidth - 50 })
        })

        doc.moveDown(0.6)

        doc.fontSize(9.5)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('Additional BIR Compliance:', { indent: 0 })
          .moveDown(0.2)

        doc.fontSize(9.5)
          .font('Helvetica')
          .fillColor('#000000')
        
        const birCompliance = [
          'Registration of Books of Accounts',
          'Authority to Print Official Receipts and Invoices'
        ]
        
        birCompliance.forEach((item, index) => {
          const checkBoxX = margin + 18
          const checkBoxY = doc.y + 2
          doc.rect(checkBoxX, checkBoxY, 7, 7)
            .strokeColor('#000000')
            .lineWidth(0.7)
            .stroke()
          
          doc.fontSize(9.5)
            .font('Helvetica')
            .fillColor('#000000')
            .text(`${index + 1}. ${item}`, { indent: 32, width: contentWidth - 50 })
        })

        doc.moveDown(0.8)

        // Section C: Other Government Agencies
        const sectionCY = doc.y
        doc.fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('C. OTHER GOVERNMENT AGENCIES (If Applicable – With Employees)', { indent: 0 })
          .moveDown(0.2)

        // Underline section heading
        const sectionCEndY = doc.y - 4
        doc.lineWidth(1)
        doc.moveTo(margin + 10, sectionCEndY)
          .lineTo(pageWidth - margin - 10, sectionCEndY)
          .stroke()

        doc.moveDown(0.4)
        doc.fontSize(9.5)
          .font('Helvetica')
          .fillColor('#000000')
          .text('If your business has employees, you must register with:', { indent: 0 })
          .moveDown(0.2)
        
        const agencies = [
          'Social Security System (SSS)',
          'PhilHealth (Philippine Health Insurance Corporation)',
          'Pag-IBIG Fund (Home Development Mutual Fund)'
        ]
        
        agencies.forEach((item, index) => {
          const checkBoxX = margin + 18
          const checkBoxY = doc.y + 2
          doc.rect(checkBoxX, checkBoxY, 7, 7)
            .strokeColor('#000000')
            .lineWidth(0.7)
            .stroke()
          
          doc.fontSize(9.5)
            .font('Helvetica')
            .fillColor('#000000')
            .text(`${index + 1}. ${item}`, { indent: 32, width: contentWidth - 50 })
        })

        doc.moveDown(1.0)

        // Important Notice Box - Reduced height
        const noticeY = doc.y
        doc.roundedRect(margin + 10, noticeY, contentWidth - 20, 32, 3)
          .strokeColor('#000000')
          .lineWidth(1)
          .fillColor('#f8f8f8')
          .fill()
          .stroke()
        
        doc.fontSize(9.5)
          .font('Helvetica-Bold')
          .fillColor('#000000')
          .text('IMPORTANT NOTICE', { 
            align: 'center',
            y: noticeY + 6,
            width: contentWidth - 20
          })
        
        doc.fontSize(8.5)
          .font('Helvetica')
          .fillColor('#333333')
          .text('Please prepare all required documents before proceeding with the online application.', { 
            align: 'center',
            y: noticeY + 18,
            width: contentWidth - 40
          })

        doc.y = noticeY + 38
        doc.moveDown(0.8)

        // Horizontal separator line before footer
        doc.strokeColor('#000000')
        doc.lineWidth(1)
        doc.moveTo(margin, doc.y)
          .lineTo(pageWidth - margin, doc.y)
          .stroke()
        doc.moveDown(0.5)

        // Official Footer - Optimized for single page
        doc.fontSize(7.5)
          .font('Helvetica')
          .fillColor('#666666')
          .text('This is an official document generated by the Local Government Unit', { align: 'center' })
          .moveDown(0.2)
          .text('For inquiries, please contact the Business Permit and Licensing Office', { align: 'center' })
          .moveDown(0.2)
          .text(`Document Reference: ${docNumber} | Generated: ${docDate} at ${docTime}`, { align: 'center' })

        // Draw bottom border line - Ensure it fits within page
        const footerY = Math.min(doc.y + 8, pageHeight - margin - 2)
        doc.lineWidth(1)
        doc.moveTo(margin, footerY)
          .lineTo(pageWidth - margin, footerY)
          .stroke()
        doc.lineWidth(2)
        doc.moveTo(margin, footerY + 2)
          .lineTo(pageWidth - margin, footerY + 2)
          .stroke()

        doc.end()
      } catch (error) {
        reject(error)
      }
    })
  }
}

module.exports = new PDFService()
