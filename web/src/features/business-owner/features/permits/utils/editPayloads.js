import { extractUploadUrl } from './formUtils'
import { LGU_DOCUMENT_FIELDS, BIR_DOCUMENT_FIELDS } from '../constants/documentFields'

export function buildRegistrationUpdatePayload(values, modalData, options = {}) {
  const { resubmit = false } = options
  const existingBusiness = modalData?.businessDetails || {}
  const lguDocuments = LGU_DOCUMENT_FIELDS.reduce((acc, field) => {
    const url = extractUploadUrl(values[field.key])
    if (url) acc[field.key] = url
    return acc
  }, {})
  const birDocuments = BIR_DOCUMENT_FIELDS.reduce((acc, field) => {
    const url = extractUploadUrl(values[field.key])
    if (url) acc[field.key] = url
    return acc
  }, {})
  const otherAgencyProofs = {
    sssProofUrl: extractUploadUrl(values.sssProofUrl),
    philhealthProofUrl: extractUploadUrl(values.philhealthProofUrl),
    pagibigProofUrl: extractUploadUrl(values.pagibigProofUrl)
  }
  const mergedBirRegistration = {
    ...(existingBusiness.birRegistration || {}),
    registrationNumber: values.birRegistrationNumber || existingBusiness.birRegistration?.registrationNumber || '',
    ...birDocuments
  }

  const resolvedRegistrationType = values.businessRegistrationType || existingBusiness.businessRegistrationType
  const resolvedPrimaryLine = values.primaryLineOfBusiness || existingBusiness.primaryLineOfBusiness
  const resolvedBusinessType = values.businessType || existingBusiness.businessType
  const resolvedBusinessClassification = values.businessClassification || existingBusiness.businessClassification
  const base = {
    registeredBusinessName: values.registeredBusinessName || existingBusiness.registeredBusinessName || existingBusiness.businessName,
    businessTradeName: values.businessTradeName || '',
    businessRegistrationNumber: values.businessRegistrationNumber || modalData?.businessDetails?.businessRegistrationNumber || '',
    ...(resolvedRegistrationType ? { businessRegistrationType: resolvedRegistrationType } : {}),
    ...(resolvedPrimaryLine ? { primaryLineOfBusiness: resolvedPrimaryLine } : {}),
    ...(resolvedBusinessType ? { businessType: resolvedBusinessType } : {}),
    ...(resolvedBusinessClassification ? { businessClassification: resolvedBusinessClassification } : {}),
    street: values.street || '',
    barangay: values.barangay || '',
    cityMunicipality: values.city || '',
    ownerFullName: values.ownerFullName || '',
    ownerTin: values.ownerTin || '',
    governmentIdType: values.governmentIdType || '',
    governmentIdNumber: values.governmentIdNumber || '',
    location: {
      street: values.street || '',
      barangay: values.barangay || '',
      city: values.city || '',
      cityMunicipality: values.city || '',
      province: values.province || '',
      zipCode: values.postalCode || ''
    },
    birRegistration: mergedBirRegistration,
    ...(Object.keys(lguDocuments).length > 0 ? { lguDocuments: { ...(existingBusiness.lguDocuments || {}), ...lguDocuments } } : {}),
    otherAgencyRegistrations: {
      hasEmployees: values.hasEmployees || false,
      sss: { registered: values.sssRegistered || false, ...(otherAgencyProofs.sssProofUrl ? { proofUrl: otherAgencyProofs.sssProofUrl } : {}) },
      philhealth: { registered: values.philhealthRegistered || false, ...(otherAgencyProofs.philhealthProofUrl ? { proofUrl: otherAgencyProofs.philhealthProofUrl } : {}) },
      pagibig: { registered: values.pagibigRegistered || false, ...(otherAgencyProofs.pagibigProofUrl ? { proofUrl: otherAgencyProofs.pagibigProofUrl } : {}) }
    },
    applicationStatus: resubmit ? 'resubmit' : 'needs_revision'
  }

  if (resubmit) {
    base.reviewComments = null
    base.rejectionReason = null
    base.reviewedBy = null
    base.reviewedAt = null
  }

  return base
}
