import { LGU_DOCUMENT_FIELDS, BIR_DOCUMENT_FIELDS } from '../constants/documentFields'

export function setRegistrationFormValues(editForm, business, record, profile, buildUploadFileList) {
  const businessData = business || {}
  const resolvedStreet = businessData?.location?.street || businessData?.street || businessData?.businessAddress || ''
  const resolvedBarangay = businessData?.location?.barangay || businessData?.barangay || ''
  const resolvedCity = businessData?.location?.city || businessData?.location?.cityMunicipality || businessData?.city || businessData?.cityMunicipality || ''
  const resolvedProvince = businessData?.location?.province || businessData?.province || ''
  const resolvedPostalCode = businessData?.location?.zipCode || businessData?.location?.postalCode || businessData?.zipCode || businessData?.postalCode || ''
  const resolvedBirRegistrationNumber = businessData?.birRegistration?.registrationNumber || businessData?.birRegistrationNumber || ''
  const resolvedBirCertificateUrl = businessData?.birRegistration?.certificateUrl || businessData?.certificateUrl || ''
  const resolvedBirBooksUrl = businessData?.birRegistration?.booksOfAccountsUrl || businessData?.booksOfAccountsUrl || ''
  const resolvedBirAuthorityUrl = businessData?.birRegistration?.authorityToPrintUrl || businessData?.authorityToPrintUrl || ''
  const resolvedBirReceiptUrl = businessData?.birRegistration?.paymentReceiptUrl || businessData?.paymentReceiptUrl || ''
  const resolvedSssProofUrl = businessData?.otherAgencyRegistrations?.sss?.proofUrl || ''
  const resolvedPhilhealthProofUrl = businessData?.otherAgencyRegistrations?.philhealth?.proofUrl || ''
  const resolvedPagibigProofUrl = businessData?.otherAgencyRegistrations?.pagibig?.proofUrl || ''

  editForm.setFieldsValue({
    businessName: businessData?.businessName || record.businessName,
    isPrimary: businessData?.isPrimary || record.isPrimary,
    ownerFullName: businessData?.ownerFullName || businessData?.businessRegistration?.ownerFullName || profile?.ownerIdentity?.fullName || '',
    ownerTin: businessData?.ownerTin || businessData?.businessRegistration?.ownerTin || '',
    governmentIdType: businessData?.governmentIdType || businessData?.businessRegistration?.governmentIdType || '',
    governmentIdNumber: businessData?.governmentIdNumber || businessData?.businessRegistration?.governmentIdNumber || '',
    registeredBusinessName: businessData?.registeredBusinessName || businessData?.businessRegistration?.registeredBusinessName || businessData?.businessName || '',
    businessTradeName: businessData?.businessTradeName || businessData?.businessRegistration?.businessTradeName || '',
    businessRegistrationType: businessData?.businessRegistrationType || businessData?.businessRegistration?.businessRegistrationType || '',
    businessRegistrationNumber: businessData?.businessRegistrationNumber || businessData?.businessRegistration?.businessRegistrationNumber || '',
    primaryLineOfBusiness: businessData?.primaryLineOfBusiness || businessData?.businessRegistration?.primaryLineOfBusiness || '',
    businessType: businessData?.businessType || businessData?.businessRegistration?.businessType || '',
    businessClassification: businessData?.businessClassification || businessData?.businessRegistration?.businessClassification || '',
    street: resolvedStreet,
    barangay: resolvedBarangay,
    city: resolvedCity,
    province: resolvedProvince,
    postalCode: resolvedPostalCode,
    birRegistrationNumber: resolvedBirRegistrationNumber,
    certificateUrl: buildUploadFileList(resolvedBirCertificateUrl, 'certificateUrl'),
    booksOfAccountsUrl: buildUploadFileList(resolvedBirBooksUrl, 'booksOfAccountsUrl'),
    authorityToPrintUrl: buildUploadFileList(resolvedBirAuthorityUrl, 'authorityToPrintUrl'),
    paymentReceiptUrl: buildUploadFileList(resolvedBirReceiptUrl, 'paymentReceiptUrl'),
    idPicture: buildUploadFileList(businessData?.lguDocuments?.idPicture, 'idPicture', true),
    ctc: buildUploadFileList(businessData?.lguDocuments?.ctc, 'ctc'),
    barangayClearance: buildUploadFileList(businessData?.lguDocuments?.barangayClearance, 'barangayClearance'),
    dtiSecCda: buildUploadFileList(businessData?.lguDocuments?.dtiSecCda, 'dtiSecCda'),
    leaseOrLandTitle: buildUploadFileList(businessData?.lguDocuments?.leaseOrLandTitle, 'leaseOrLandTitle'),
    occupancyPermit: buildUploadFileList(businessData?.lguDocuments?.occupancyPermit, 'occupancyPermit'),
    healthCertificate: buildUploadFileList(businessData?.lguDocuments?.healthCertificate, 'healthCertificate'),
    hasEmployees: businessData?.otherAgencyRegistrations?.hasEmployees || false,
    sssRegistered: businessData?.otherAgencyRegistrations?.sss?.registered || false,
    philhealthRegistered: businessData?.otherAgencyRegistrations?.philhealth?.registered || false,
    pagibigRegistered: businessData?.otherAgencyRegistrations?.pagibig?.registered || false,
    sssProofUrl: buildUploadFileList(resolvedSssProofUrl, 'sssProofUrl'),
    philhealthProofUrl: buildUploadFileList(resolvedPhilhealthProofUrl, 'philhealthProofUrl'),
    pagibigProofUrl: buildUploadFileList(resolvedPagibigProofUrl, 'pagibigProofUrl')
  })
}
