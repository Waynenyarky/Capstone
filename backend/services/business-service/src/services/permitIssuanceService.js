const mongoose = require('mongoose')
const BusinessProfile = require('../models/BusinessProfile')
const Permit = require('../models/Permit')
const PDFDocument = require('pdfkit')
const QRCode = require('qrcode')
const { logAuditEvent } = require('../lib/auditClient')

// Helper: build query that matches either businessId or subdoc _id
function buildBusinessLookupQuery(identifier) {
  const target = String(identifier || '')
  const clauses = [{ 'businesses.businessId': target }]
  if (mongoose.Types.ObjectId.isValid(target)) {
    clauses.push({ 'businesses._id': new mongoose.Types.ObjectId(target) })
  }
  return clauses.length === 1 ? clauses[0] : { $or: clauses }
}

/**
 * Generate unique permit number
 */
function generatePermitNumber(year = new Date().getFullYear()) {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `MP-${year}-${timestamp.toString().slice(-5)}${random}`
}

/**
 * Calculate permit expiry date (1 year from issuance)
 */
function calculateExpiryDate(issuedDate = new Date()) {
  const expiry = new Date(issuedDate)
  expiry.setFullYear(expiry.getFullYear() + 1)
  return expiry
}

/**
 * Generate QR code for permit verification
 */
async function generateQRCode(permitNumber, permitData) {
  const verificationData = {
    permitNumber,
    businessId: permitData.businessId,
    businessName: permitData.businessName,
    issuedDate: permitData.issuedDate,
    expiryDate: permitData.expiryDate,
    verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-permit/${permitNumber}`
  }
  
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(verificationData), {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 200
    })
    return qrCodeDataUrl
  } catch (error) {
    console.error('QR code generation failed:', error)
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Issue a new permit
 */
async function issuePermit(businessId, permitType = 'initial', userId) {
  // Get business profile
  const profile = await BusinessProfile.findOne(buildBusinessLookupQuery(businessId))
  
  if (!profile) {
    throw new Error('Business not found')
  }
  
  const business = profile.businesses.find(b => b.businessId === businessId || String(b._id) === businessId)
  if (!business) {
    throw new Error('Business not found')
  }
  
  // Check if business is approved
  if (business.applicationStatus !== 'approved') {
    throw new Error('Business must be approved before permit issuance')
  }
  
  // Generate permit data
  const permitNumber = generatePermitNumber()
  const issuedDate = new Date()
  const expiryDate = calculateExpiryDate(issuedDate)
  
  // Build address from available fields
  const addressParts = [
    business.businessAddress,
    business.location?.address,
    business.location?.street,
    business.location?.barangay,
    business.location?.city || business.location?.municipality,
    business.location?.province
  ].filter(Boolean)
  const address = addressParts.length > 0 ? addressParts.join(', ') : 'Address not specified'

  const permitData = {
    permitNumber,
    businessId,
    businessName: business.businessName || business.registeredBusinessName || 'Business',
    ownerName: profile.ownerName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Owner',
    address,
    lineOfBusiness: business.primaryLineOfBusiness || business.lineOfBusiness || 'General Business',
    permitType,
    issuedDate,
    expiryDate,
    status: 'active',
    issuedBy: userId
  }
  
  // Generate QR code
  permitData.qrCode = await generateQRCode(permitNumber, permitData)
  
  // Create permit record
  const permit = await Permit.create(permitData)
  
  // Update business profile with permit reference
  await BusinessProfile.updateOne(
    buildBusinessLookupQuery(businessId),
    {
      $set: {
        'businesses.$.permitNumber': permitNumber,
        'businesses.$.permitIssuedDate': issuedDate,
        'businesses.$.permitExpiryDate': expiryDate,
        'businesses.$.permitStatus': 'active'
      }
    }
  )
  
  // Audit log
  logAuditEvent('permit_issued', userId, 'Permit', permit._id.toString(), {
    businessId,
    permitNumber,
    permitType
  })
  
  return permit
}

/**
 * Get permit by ID
 */
async function getPermit(permitId) {
  const permit = await Permit.findById(permitId)
  if (!permit) {
    throw new Error('Permit not found')
  }
  return permit
}

/**
 * Get all permits for a business
 */
async function getBusinessPermits(businessId) {
  const permits = await Permit.find({ businessId }).sort({ issuedDate: -1 })
  return permits
}

/**
 * Verify permit authenticity
 */
async function verifyPermit(permitNumber) {
  const permit = await Permit.findOne({ permitNumber })
  
  if (!permit) {
    return {
      valid: false,
      message: 'Permit not found'
    }
  }
  
  const now = new Date()
  const isExpired = now > new Date(permit.expiryDate)
  const isActive = permit.status === 'active'
  
  return {
    valid: isActive && !isExpired,
    permit,
    message: isActive && !isExpired 
      ? 'Permit is valid' 
      : isExpired 
        ? 'Permit has expired' 
        : 'Permit is not active'
  }
}

/**
 * Generate permit PDF
 */
async function generatePermitPDF(permitId) {
  const permit = await getPermit(permitId)
  
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'LETTER', margin: 50 })
      const chunks = []
      
      doc.on('data', chunk => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)
      
      // Header
      doc.fontSize(20).font('Helvetica-Bold')
         .text('REPUBLIC OF THE PHILIPPINES', { align: 'center' })
      doc.fontSize(16)
         .text('City of Alaminos, Pangasinan', { align: 'center' })
      doc.fontSize(14)
         .text('BUSINESS PERMIT AND LICENSING OFFICE', { align: 'center' })
      
      doc.moveDown(2)
      
      // Title
      doc.fontSize(24).font('Helvetica-Bold')
         .fillColor('#1890ff')
         .text("MAYOR'S PERMIT", { align: 'center' })
      
      doc.moveDown(1)
      
      // Permit Number
      doc.fontSize(16).fillColor('#000000')
         .text(`Permit No: ${permit.permitNumber}`, { align: 'center' })
      
      doc.moveDown(2)
      
      // Business Information
      doc.fontSize(12).font('Helvetica')
      
      const leftMargin = 100
      let y = doc.y
      
      doc.text('Business Name:', leftMargin, y, { continued: true })
         .font('Helvetica-Bold')
         .text(` ${permit.businessName}`)
      
      y += 25
      doc.font('Helvetica')
         .text('Owner/Proprietor:', leftMargin, y, { continued: true })
         .font('Helvetica-Bold')
         .text(` ${permit.ownerName}`)
      
      y += 25
      doc.font('Helvetica')
         .text('Business Address:', leftMargin, y, { continued: true })
         .font('Helvetica-Bold')
         .text(` ${permit.address}`)
      
      y += 25
      doc.font('Helvetica')
         .text('Line of Business:', leftMargin, y, { continued: true })
         .font('Helvetica-Bold')
         .text(` ${permit.lineOfBusiness}`)
      
      y += 25
      doc.font('Helvetica')
         .text('Permit Type:', leftMargin, y, { continued: true })
         .font('Helvetica-Bold')
         .text(` ${permit.permitType === 'initial' ? 'Initial' : 'Renewal'}`)
      
      y += 25
      doc.font('Helvetica')
         .text('Date Issued:', leftMargin, y, { continued: true })
         .font('Helvetica-Bold')
         .text(` ${new Date(permit.issuedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`)
      
      y += 25
      doc.font('Helvetica')
         .text('Valid Until:', leftMargin, y, { continued: true })
         .font('Helvetica-Bold')
         .text(` ${new Date(permit.expiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`)
      
      doc.moveDown(3)
      
      // QR Code
      if (permit.qrCode) {
        const qrImageData = permit.qrCode.replace(/^data:image\/png;base64,/, '')
        const qrBuffer = Buffer.from(qrImageData, 'base64')
        
        doc.image(qrBuffer, doc.page.width / 2 - 75, doc.y, { width: 150, height: 150 })
        doc.moveDown(10)
        doc.fontSize(10).font('Helvetica')
           .text('Scan QR code to verify authenticity', { align: 'center' })
      }
      
      doc.moveDown(2)
      
      // Footer
      doc.fontSize(10).font('Helvetica-Oblique')
         .text('This permit must be posted in a conspicuous place within the business premises.', { align: 'center' })
      doc.text('Not valid without the official seal and signature.', { align: 'center' })
      
      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Suspend permit
 */
async function suspendPermit(permitId, reason, userId) {
  const permit = await Permit.findByIdAndUpdate(
    permitId,
    {
      status: 'suspended',
      suspendedAt: new Date(),
      suspensionReason: reason,
      suspendedBy: userId
    },
    { new: true }
  )
  
  if (!permit) {
    throw new Error('Permit not found')
  }
  
  // Update business profile
  await BusinessProfile.updateOne(
    buildBusinessLookupQuery(permit.businessId),
    { $set: { 'businesses.$.permitStatus': 'suspended' } }
  )
  
  logAuditEvent('permit_suspended', userId, 'Permit', permitId, { reason })
  
  return permit
}

/**
 * Revoke permit
 */
async function revokePermit(permitId, reason, userId) {
  const permit = await Permit.findByIdAndUpdate(
    permitId,
    {
      status: 'revoked',
      revokedAt: new Date(),
      revocationReason: reason,
      revokedBy: userId
    },
    { new: true }
  )
  
  if (!permit) {
    throw new Error('Permit not found')
  }
  
  // Update business profile
  await BusinessProfile.updateOne(
    buildBusinessLookupQuery(permit.businessId),
    { $set: { 'businesses.$.permitStatus': 'revoked' } }
  )
  
  logAuditEvent('permit_revoked', userId, 'Permit', permitId, { reason })
  
  return permit
}

module.exports = {
  generatePermitNumber,
  calculateExpiryDate,
  generateQRCode,
  issuePermit,
  getPermit,
  getBusinessPermits,
  verifyPermit,
  generatePermitPDF,
  suspendPermit,
  revokePermit
}
