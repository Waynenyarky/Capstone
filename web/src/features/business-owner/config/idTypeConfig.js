/**
 * ID Type Configuration
 * 
 * Defines the fields required for each government-issued ID type.
 * Used for dynamic form rendering and OCR field mapping.
 * 
 * Based on actual Philippine government ID formats as of 2024.
 */

// Common name pattern for validation
const NAME_PATTERN = /^[A-Za-z\s.\-'ÑñÀ-ÿ]+$/
const NAME_PATTERN_MESSAGE = 'Name should only contain letters, spaces, and common punctuation'

export const ID_TYPES = {
  // ========================================
  // 1. Driver's License (LTO)
  // ========================================
  drivers_license: {
    label: "Driver's License",
    code: 'drivers_license',
    hasBack: true,
    fields: [
      { 
        name: 'licenseNumber', 
        label: 'License No.', 
        required: true, 
        placeholder: 'e.g., A12-23-003519',
        pattern: /^[A-Z]\d{2}[-\s]?\d{2}[-\s]?\d{5,6}$/,
        patternMessage: 'License number format: X00-00-000000 (e.g., A12-23-003519)',
      },
      { 
        name: 'lastName', 
        label: 'Last Name', 
        required: true, 
        placeholder: 'e.g., DELA CRUZ',
        pattern: NAME_PATTERN,
        patternMessage: NAME_PATTERN_MESSAGE,
      },
      { 
        name: 'firstName', 
        label: 'First Name', 
        required: true, 
        placeholder: 'e.g., JUAN',
        pattern: NAME_PATTERN,
        patternMessage: NAME_PATTERN_MESSAGE,
      },
      { 
        name: 'middleName', 
        label: 'Middle Name', 
        required: false, 
        placeholder: 'e.g., SANTOS',
        pattern: NAME_PATTERN,
        patternMessage: NAME_PATTERN_MESSAGE,
      },
      { name: 'nationality', label: 'Nationality', required: false, defaultValue: 'PHL' },
      { name: 'sex', label: 'Sex', type: 'select', options: ['M', 'F'], required: false },
      { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
      // Address fields - structured for Philippine addresses
      { name: 'streetAddress', label: 'House/Bldg No. & Street', required: false, placeholder: 'e.g., 133 ROXAS BOULEVARD' },
      { name: 'barangay', label: 'Barangay', required: false, placeholder: 'e.g., POBLACION' },
      { name: 'city', label: 'City/Municipality', required: false, placeholder: 'e.g., SAN CARLOS CITY' },
      { name: 'province', label: 'Province', required: false, placeholder: 'e.g., PANGASINAN' },
      { name: 'postalCode', label: 'Postal Code', required: false, placeholder: 'e.g., 2420', pattern: /^\d{4}$/, patternMessage: 'Postal code must be 4 digits' },
      { name: 'expiryDate', label: 'Expiration Date', type: 'date', required: true },
      { name: 'agencyCode', label: 'Agency Code', required: false, placeholder: 'e.g., A12' },
      { name: 'bloodType', label: 'Blood Type', required: false, placeholder: 'e.g., O+' },
      { name: 'dlCodes', label: 'DL Codes', required: false, placeholder: 'e.g., A, A1, B, B1, B2' },
      { name: 'conditions', label: 'Conditions', required: false, placeholder: 'e.g., NONE' },
    ],
    ocrMapping: {
      licenseNumber: ['license no', 'license number', 'dl no', 'no.'],
      lastName: ['last name', 'surname', 'apelyido'],
      firstName: ['first name', 'given name', 'pangalan'],
      middleName: ['middle name', 'gitnang pangalan'],
      nationality: ['nationality', 'nasyonalidad'],
      sex: ['sex', 'kasarian'],
      dateOfBirth: ['date of birth', 'birthdate', 'dob', 'petsa ng kapanganakan'],
      streetAddress: ['address', 'street', 'house', 'bldg'],
      barangay: ['barangay', 'brgy'],
      city: ['city', 'municipality'],
      province: ['province'],
      postalCode: ['postal', 'zip'],
      expiryDate: ['expiration date', 'expiry', 'valid until', 'exp'],
      agencyCode: ['agency code'],
      bloodType: ['blood type'],
      dlCodes: ['dl codes', 'restrictions'],
      conditions: ['conditions'],
    }
  },

  // ========================================
  // 2. PhilSys ID (National ID)
  // ========================================
  philsys_id: {
    label: 'PhilSys ID (National ID)',
    code: 'philsys_id',
    hasBack: true,
    fields: [
      { 
        name: 'pcn', 
        label: 'PhilSys Card Number (PCN)', 
        required: true, 
        placeholder: 'XXXX-XXXX-XXXX',
        pattern: /^\d{4}[-\s]?\d{4}[-\s]?\d{4}$/,
        patternMessage: 'PCN must be 12 digits (e.g., 1234-5678-9012)',
      },
      { 
        name: 'lastName', 
        label: 'Last Name', 
        required: true, 
        placeholder: 'As shown on ID',
        pattern: NAME_PATTERN,
        patternMessage: NAME_PATTERN_MESSAGE,
      },
      { 
        name: 'givenName', 
        label: 'Given Name', 
        required: true, 
        placeholder: 'As shown on ID',
        pattern: NAME_PATTERN,
        patternMessage: NAME_PATTERN_MESSAGE,
      },
      { 
        name: 'middleName', 
        label: 'Middle Name', 
        required: false, 
        placeholder: 'As shown on ID',
        pattern: NAME_PATTERN,
        patternMessage: NAME_PATTERN_MESSAGE,
      },
      { 
        name: 'suffix', 
        label: 'Suffix', 
        required: false, 
        placeholder: 'e.g., JR, SR, III',
      },
      { name: 'sex', label: 'Sex', type: 'select', options: ['Male', 'Female'], required: false },
      { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
      { name: 'placeOfBirth', label: 'Place of Birth', required: false },
      { name: 'bloodType', label: 'Blood Type', required: false, placeholder: 'e.g., O+' },
      { name: 'maritalStatus', label: 'Marital Status', type: 'select', options: ['Single', 'Married', 'Widowed', 'Separated', 'Annulled'], required: false },
      // Address fields - structured for Philippine addresses
      { name: 'streetAddress', label: 'House/Bldg No. & Street', required: false, placeholder: 'e.g., 123 Main Street' },
      { name: 'barangay', label: 'Barangay', required: false, placeholder: 'e.g., Poblacion' },
      { name: 'city', label: 'City/Municipality', required: false, placeholder: 'e.g., Quezon City' },
      { name: 'province', label: 'Province', required: false, placeholder: 'e.g., Metro Manila' },
      { name: 'postalCode', label: 'Postal Code', required: false, placeholder: 'e.g., 1100', pattern: /^\d{4}$/, patternMessage: 'Postal code must be 4 digits' },
    ],
    ocrMapping: {
      pcn: ['pcn', 'philsys number', 'psn', 'card number'],
      lastName: ['last name', 'surname', 'apelyido'],
      givenName: ['given name', 'first name', 'pangalan'],
      middleName: ['middle name', 'gitnang pangalan'],
      suffix: ['suffix', 'ext'],
      sex: ['sex', 'kasarian'],
      dateOfBirth: ['date of birth', 'birthdate', 'dob'],
      placeOfBirth: ['place of birth', 'pob', 'birthplace'],
      bloodType: ['blood type'],
      maritalStatus: ['marital status', 'civil status'],
      address: ['address', 'residence', 'tirahan'],
    }
  },

  // ========================================
  // 3. Passport (DFA)
  // ========================================
  passport: {
    label: 'Passport',
    code: 'passport',
    hasBack: false,
    fields: [
      { 
        name: 'passportNumber', 
        label: 'Passport No.', 
        required: true, 
        placeholder: 'e.g., P1234567A',
        pattern: /^[A-Z][A-Z0-9]{7,8}$/,
        patternMessage: 'Passport number format: Letter followed by 7-8 alphanumeric characters',
      },
      { 
        name: 'surname', 
        label: 'Surname', 
        required: true, 
        placeholder: 'As shown on passport',
        pattern: NAME_PATTERN,
        patternMessage: NAME_PATTERN_MESSAGE,
      },
      { 
        name: 'givenNames', 
        label: 'Given Names', 
        required: true, 
        placeholder: 'First and middle names',
        pattern: NAME_PATTERN,
        patternMessage: NAME_PATTERN_MESSAGE,
      },
      { name: 'nationality', label: 'Nationality', required: false, defaultValue: 'FILIPINO' },
      { name: 'sex', label: 'Sex', type: 'select', options: ['M', 'F'], required: false },
      { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
      { name: 'placeOfBirth', label: 'Place of Birth', required: false },
      { name: 'dateOfIssue', label: 'Date of Issue', type: 'date', required: false },
      { name: 'expiryDate', label: 'Date of Expiry', type: 'date', required: true },
    ],
    ocrMapping: {
      passportNumber: ['passport no', 'document no', 'no.'],
      surname: ['surname', 'last name', 'apelyido'],
      givenNames: ['given names', 'first name', 'pangalan'],
      nationality: ['nationality', 'nasyonalidad'],
      sex: ['sex', 'kasarian'],
      dateOfBirth: ['date of birth', 'dob'],
      placeOfBirth: ['place of birth', 'pob'],
      dateOfIssue: ['date of issue', 'issued'],
      expiryDate: ['date of expiry', 'expiry', 'valid until', 'exp'],
    }
  },

  // ========================================
  // 4. SSS ID
  // ========================================
  sss_id: {
    label: 'SSS ID',
    code: 'sss_id',
    hasBack: true,
    fields: [
      { 
        name: 'sssNumber', 
        label: 'SS Number', 
        required: true, 
        placeholder: 'XX-XXXXXXX-X',
        pattern: /^\d{2}[-\s]?\d{7}[-\s]?\d{1}$/,
        patternMessage: 'SS Number format: XX-XXXXXXX-X (e.g., 12-3456789-0)',
      },
      { 
        name: 'lastName', 
        label: 'Last Name', 
        required: true, 
        placeholder: 'As shown on ID',
        pattern: NAME_PATTERN,
        patternMessage: NAME_PATTERN_MESSAGE,
      },
      { 
        name: 'firstName', 
        label: 'First Name', 
        required: true, 
        placeholder: 'As shown on ID',
        pattern: NAME_PATTERN,
        patternMessage: NAME_PATTERN_MESSAGE,
      },
      { 
        name: 'middleName', 
        label: 'Middle Name', 
        required: false, 
        placeholder: 'As shown on ID',
        pattern: NAME_PATTERN,
        patternMessage: NAME_PATTERN_MESSAGE,
      },
      { 
        name: 'suffix', 
        label: 'Suffix', 
        required: false, 
        placeholder: 'e.g., JR, SR, III',
      },
      { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
      // Address fields - structured for Philippine addresses
      { name: 'streetAddress', label: 'House/Bldg No. & Street', required: false, placeholder: 'e.g., 123 Main Street' },
      { name: 'barangay', label: 'Barangay', required: false, placeholder: 'e.g., Poblacion' },
      { name: 'city', label: 'City/Municipality', required: false, placeholder: 'e.g., Quezon City' },
      { name: 'province', label: 'Province', required: false, placeholder: 'e.g., Metro Manila' },
      { name: 'postalCode', label: 'Postal Code', required: false, placeholder: 'e.g., 1100', pattern: /^\d{4}$/, patternMessage: 'Postal code must be 4 digits' },
    ],
    ocrMapping: {
      sssNumber: ['ss number', 'sss no', 'ss no', 'sss number'],
      lastName: ['last name', 'surname'],
      firstName: ['first name', 'given name'],
      middleName: ['middle name'],
      suffix: ['suffix', 'ext'],
      dateOfBirth: ['date of birth', 'dob', 'birthdate'],
      address: ['address', 'residence'],
    }
  },

  // ========================================
  // 5. UMID (Unified Multi-Purpose ID)
  // ========================================
  umid: {
    label: 'UMID (Unified Multi-Purpose ID)',
    code: 'umid',
    hasBack: true,
    fields: [
      { 
        name: 'crnNumber', 
        label: 'CRN (Common Reference Number)', 
        required: true, 
        placeholder: 'XXXX-XXXXXXX-X',
        pattern: /^\d{4}[-\s]?\d{7}[-\s]?\d{1}$/,
        patternMessage: 'CRN format: XXXX-XXXXXXX-X (e.g., 1234-5678901-2)',
      },
      { 
        name: 'ssNumber', 
        label: 'SS Number', 
        required: false, 
        placeholder: 'XX-XXXXXXX-X',
      },
      { 
        name: 'lastName', 
        label: 'Last Name', 
        required: true, 
        placeholder: 'As shown on ID',
        pattern: NAME_PATTERN,
        patternMessage: NAME_PATTERN_MESSAGE,
      },
      { 
        name: 'firstName', 
        label: 'First Name', 
        required: true, 
        placeholder: 'As shown on ID',
        pattern: NAME_PATTERN,
        patternMessage: NAME_PATTERN_MESSAGE,
      },
      { 
        name: 'middleName', 
        label: 'Middle Name', 
        required: false, 
        placeholder: 'As shown on ID',
        pattern: NAME_PATTERN,
        patternMessage: NAME_PATTERN_MESSAGE,
      },
      { 
        name: 'suffix', 
        label: 'Suffix', 
        required: false, 
        placeholder: 'e.g., JR, SR, III',
      },
      { 
        name: 'maidenName', 
        label: 'Maiden Name', 
        required: false, 
        placeholder: 'For married females',
        pattern: NAME_PATTERN,
        patternMessage: NAME_PATTERN_MESSAGE,
      },
      { name: 'sex', label: 'Sex', type: 'select', options: ['Male', 'Female'], required: false },
      { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
      { name: 'placeOfBirth', label: 'Place of Birth', required: false },
      { name: 'maritalStatus', label: 'Marital Status', type: 'select', options: ['Single', 'Married', 'Widowed', 'Separated', 'Annulled'], required: false },
      // Address fields - structured for Philippine addresses
      { name: 'streetAddress', label: 'House/Bldg No. & Street', required: false, placeholder: 'e.g., 123 Main Street' },
      { name: 'barangay', label: 'Barangay', required: false, placeholder: 'e.g., Poblacion' },
      { name: 'city', label: 'City/Municipality', required: false, placeholder: 'e.g., Quezon City' },
      { name: 'province', label: 'Province', required: false, placeholder: 'e.g., Metro Manila' },
      { name: 'postalCode', label: 'Postal Code', required: false, placeholder: 'e.g., 1100', pattern: /^\d{4}$/, patternMessage: 'Postal code must be 4 digits' },
    ],
    ocrMapping: {
      crnNumber: ['crn', 'crn no', 'common reference number'],
      ssNumber: ['ss number', 'sss no'],
      lastName: ['last name', 'surname'],
      firstName: ['first name', 'given name'],
      middleName: ['middle name'],
      suffix: ['suffix', 'ext'],
      maidenName: ['maiden name'],
      sex: ['sex'],
      dateOfBirth: ['date of birth', 'dob'],
      placeOfBirth: ['place of birth', 'pob'],
      maritalStatus: ['marital status', 'civil status'],
      address: ['address'],
    }
  },

  // ========================================
  // 6. PRC ID (Professional)
  // ========================================
  prc_id: {
    label: 'PRC ID (Professional)',
    code: 'prc_id',
    hasBack: true,
    fields: [
      { 
        name: 'registrationNumber', 
        label: 'Registration Number', 
        required: true, 
        placeholder: 'e.g., 0123456',
      },
      { 
        name: 'lastName', 
        label: 'Last Name', 
        required: true, 
        placeholder: 'As shown on ID',
        pattern: NAME_PATTERN,
        patternMessage: NAME_PATTERN_MESSAGE,
      },
      { 
        name: 'firstName', 
        label: 'First Name', 
        required: true, 
        placeholder: 'As shown on ID',
        pattern: NAME_PATTERN,
        patternMessage: NAME_PATTERN_MESSAGE,
      },
      { 
        name: 'middleName', 
        label: 'Middle Name', 
        required: false, 
        placeholder: 'As shown on ID',
        pattern: NAME_PATTERN,
        patternMessage: NAME_PATTERN_MESSAGE,
      },
      { name: 'profession', label: 'Profession', required: true, placeholder: 'e.g., Nurse, Engineer, Architect' },
      { name: 'registrationDate', label: 'Registration Date', type: 'date', required: false },
      { name: 'expiryDate', label: 'Validity Period (Expiry)', type: 'date', required: true },
    ],
    ocrMapping: {
      registrationNumber: ['registration no', 'license no', 'prc no', 'reg no'],
      lastName: ['last name', 'surname'],
      firstName: ['first name', 'given name'],
      middleName: ['middle name'],
      profession: ['profession', 'title', 'specialization'],
      registrationDate: ['registration date', 'date of registration', 'issued'],
      expiryDate: ['valid until', 'validity', 'expiry', 'exp'],
    }
  },

  // ========================================
  // 7. Voter's ID (COMELEC)
  // ========================================
  voters_id: {
    label: "Voter's ID",
    code: 'voters_id',
    hasBack: true,
    fields: [
      { 
        name: 'vinNumber', 
        label: "Voter's Identification Number (VIN)", 
        required: true, 
        placeholder: 'As shown on ID',
      },
      { 
        name: 'lastName', 
        label: 'Last Name', 
        required: true, 
        placeholder: 'As shown on ID',
        pattern: NAME_PATTERN,
        patternMessage: NAME_PATTERN_MESSAGE,
      },
      { 
        name: 'firstName', 
        label: 'First Name', 
        required: true, 
        placeholder: 'As shown on ID',
        pattern: NAME_PATTERN,
        patternMessage: NAME_PATTERN_MESSAGE,
      },
      { 
        name: 'middleName', 
        label: 'Middle Name', 
        required: false, 
        placeholder: 'As shown on ID',
        pattern: NAME_PATTERN,
        patternMessage: NAME_PATTERN_MESSAGE,
      },
      { name: 'precinct', label: 'Precinct Number', required: false },
      // Address fields - structured for Philippine addresses
      { name: 'streetAddress', label: 'House/Bldg No. & Street', required: false, placeholder: 'e.g., 123 Main Street' },
      { name: 'barangay', label: 'Barangay', required: false, placeholder: 'e.g., Poblacion' },
      { name: 'city', label: 'City/Municipality', required: false, placeholder: 'e.g., Quezon City' },
      { name: 'province', label: 'Province', required: false, placeholder: 'e.g., Metro Manila' },
      { name: 'postalCode', label: 'Postal Code', required: false, placeholder: 'e.g., 1100', pattern: /^\d{4}$/, patternMessage: 'Postal code must be 4 digits' },
    ],
    ocrMapping: {
      vinNumber: ['vin', 'voter id no', 'id no', 'voter identification number'],
      lastName: ['last name', 'surname'],
      firstName: ['first name', 'given name'],
      middleName: ['middle name'],
      precinct: ['precinct', 'precinct no'],
      address: ['address', 'residence'],
    }
  },

  // ========================================
  // 8. Postal ID (PHLPost)
  // ========================================
  postal_id: {
    label: 'Postal ID',
    code: 'postal_id',
    hasBack: true,
    fields: [
      { 
        name: 'postalIdNumber', 
        label: 'Postal ID Number', 
        required: true,
        placeholder: 'As shown on ID',
      },
      { 
        name: 'lastName', 
        label: 'Last Name', 
        required: true, 
        placeholder: 'As shown on ID',
        pattern: NAME_PATTERN,
        patternMessage: NAME_PATTERN_MESSAGE,
      },
      { 
        name: 'firstName', 
        label: 'First Name', 
        required: true, 
        placeholder: 'As shown on ID',
        pattern: NAME_PATTERN,
        patternMessage: NAME_PATTERN_MESSAGE,
      },
      { 
        name: 'middleName', 
        label: 'Middle Name', 
        required: false, 
        placeholder: 'As shown on ID',
        pattern: NAME_PATTERN,
        patternMessage: NAME_PATTERN_MESSAGE,
      },
      { 
        name: 'suffix', 
        label: 'Suffix', 
        required: false, 
        placeholder: 'e.g., JR, SR, III',
      },
      { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: false },
      { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female'], required: false },
      { name: 'placeOfBirth', label: 'Place of Birth', required: false },
      { name: 'nationality', label: 'Nationality', required: false, defaultValue: 'Filipino' },
      { name: 'civilStatus', label: 'Civil Status', type: 'select', options: ['Single', 'Married', 'Widowed', 'Separated', 'Annulled'], required: false },
      // Address fields - structured for Philippine addresses
      { name: 'streetAddress', label: 'House/Bldg No. & Street', required: false, placeholder: 'e.g., 123 Main Street' },
      { name: 'barangay', label: 'Barangay', required: false, placeholder: 'e.g., Poblacion' },
      { name: 'city', label: 'City/Municipality', required: false, placeholder: 'e.g., Quezon City' },
      { name: 'province', label: 'Province', required: false, placeholder: 'e.g., Metro Manila' },
      { name: 'postalCode', label: 'Postal Code', required: false, placeholder: 'e.g., 1100', pattern: /^\d{4}$/, patternMessage: 'Postal code must be 4 digits' },
    ],
    ocrMapping: {
      postalIdNumber: ['postal id no', 'id no', 'control no'],
      lastName: ['last name', 'surname'],
      firstName: ['first name', 'given name'],
      middleName: ['middle name'],
      suffix: ['suffix', 'ext'],
      dateOfBirth: ['date of birth', 'dob'],
      gender: ['gender', 'sex'],
      placeOfBirth: ['place of birth', 'pob'],
      nationality: ['nationality'],
      civilStatus: ['civil status', 'marital status'],
      address: ['address', 'residence'],
    }
  },

  // ========================================
  // 9. TIN ID (BIR)
  // ========================================
  tin_id: {
    label: 'TIN ID',
    code: 'tin_id',
    hasBack: false,
    fields: [
      { 
        name: 'tinNumber', 
        label: 'TIN (Tax Identification Number)', 
        required: true, 
        placeholder: 'XXX-XXX-XXX or XXX-XXX-XXX-XXX',
        pattern: /^\d{3}[-\s]?\d{3}[-\s]?\d{3}([-\s]?\d{3})?$/,
        patternMessage: 'TIN format: XXX-XXX-XXX or XXX-XXX-XXX-XXX',
      },
      { 
        name: 'lastName', 
        label: 'Last Name', 
        required: true, 
        placeholder: 'As shown on ID',
        pattern: NAME_PATTERN,
        patternMessage: NAME_PATTERN_MESSAGE,
      },
      { 
        name: 'firstName', 
        label: 'First Name', 
        required: true, 
        placeholder: 'As shown on ID',
        pattern: NAME_PATTERN,
        patternMessage: NAME_PATTERN_MESSAGE,
      },
      { 
        name: 'middleName', 
        label: 'Middle Name', 
        required: false, 
        placeholder: 'As shown on ID',
        pattern: NAME_PATTERN,
        patternMessage: NAME_PATTERN_MESSAGE,
      },
      { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: false },
      // Address fields - structured for Philippine addresses
      { name: 'streetAddress', label: 'House/Bldg No. & Street', required: false, placeholder: 'e.g., 123 Main Street' },
      { name: 'barangay', label: 'Barangay', required: false, placeholder: 'e.g., Poblacion' },
      { name: 'city', label: 'City/Municipality', required: false, placeholder: 'e.g., Quezon City' },
      { name: 'province', label: 'Province', required: false, placeholder: 'e.g., Metro Manila' },
      { name: 'postalCode', label: 'Postal Code', required: false, placeholder: 'e.g., 1100', pattern: /^\d{4}$/, patternMessage: 'Postal code must be 4 digits' },
    ],
    ocrMapping: {
      tinNumber: ['tin', 'tin no', 'taxpayer id', 'tax identification number'],
      lastName: ['last name', 'surname'],
      firstName: ['first name', 'given name'],
      middleName: ['middle name'],
      dateOfBirth: ['date of birth', 'dob'],
      address: ['address'],
    }
  },
}

// Get list of ID types for dropdown
export const getIdTypeOptions = () => {
  return Object.values(ID_TYPES).map(type => ({
    value: type.code,
    label: type.label,
  }))
}

// Get config for a specific ID type
export const getIdTypeConfig = (idType) => {
  return ID_TYPES[idType] || null
}

// Get the primary ID number field name for an ID type
export const getPrimaryIdField = (idType) => {
  const config = ID_TYPES[idType]
  if (!config) return 'idNumber'
  
  // Return the first required field that contains 'number' or common ID field names
  const primaryField = config.fields.find(f => 
    f.required && (
      f.name.toLowerCase().includes('number') || 
      f.name.toLowerCase().includes('pcn') ||
      f.name === 'licenseNumber' ||
      f.name === 'passportNumber' ||
      f.name === 'registrationNumber'
    )
  )
  return primaryField ? primaryField.name : config.fields[0]?.name || 'idNumber'
}

// Helper to get full name from separate name fields
export const getFullNameFromFields = (formData, idType) => {
  const config = ID_TYPES[idType]
  if (!config) return ''
  
  const parts = []
  
  // Check for different name field combinations
  if (formData.lastName) parts.push(formData.lastName)
  if (formData.firstName) parts.push(formData.firstName)
  if (formData.givenName) parts.push(formData.givenName)
  if (formData.givenNames) parts.push(formData.givenNames)
  if (formData.middleName) parts.push(formData.middleName)
  if (formData.surname) parts.unshift(formData.surname) // Surname first for passport
  if (formData.suffix) parts.push(formData.suffix)
  
  return parts.filter(Boolean).join(' ')
}

export default ID_TYPES
