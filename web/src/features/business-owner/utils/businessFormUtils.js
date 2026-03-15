import dayjs from 'dayjs'
import { LINE_OF_BUSINESS } from '@/constants/lineOfBusiness'
import { ALAMINOS_TEST_ADDRESS } from '../constants/businessFormConstants'

function createMockFile(fieldName) {
  const fileName = `${fieldName.replace(/[^a-zA-Z0-9]/g, '_')}_sample.pdf`
  const mockContent = new Blob(['Mock PDF content for testing'], { type: 'application/pdf' })
  const file = new File([mockContent], fileName, { type: 'application/pdf' })

  return {
    uid: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: fileName,
    status: 'done',
    originFileObj: file,
    type: 'application/pdf',
    size: mockContent.size,
    isTestFile: true, // Flag to identify test files
  }
}

function formDataWithDayjs(formData, definition) {
  if (!formData || typeof formData !== 'object') return formData
  const dateKeys = new Set()
  const repeatableDateKeys = {}
  ;(definition?.sections || []).forEach((section) => {
    (section.items || []).forEach((item) => {
      const key = item.key || item.label
      if (item.type === 'date') dateKeys.add(key)
      if (item.type === 'repeatable_group' && item.groupFields?.length) {
        const groupDateKeys = new Set()
        item.groupFields.forEach((gf) => {
          if (gf.type === 'date') groupDateKeys.add(gf.key || gf.label)
        })
        if (groupDateKeys.size) repeatableDateKeys[key] = groupDateKeys
      }
    })
  })
  const out = { ...formData }
  dateKeys.forEach((k) => {
    const v = out[k]
    if (v != null && v !== '' && !dayjs.isDayjs(v)) {
      const d = dayjs(v)
      out[k] = d.isValid() ? d : undefined
    }
  })
  Object.keys(repeatableDateKeys).forEach((listKey) => {
    if (!Array.isArray(out[listKey])) return
    out[listKey] = out[listKey].map((row) => {
      if (!row || typeof row !== 'object') return row
      const r = { ...row }
      repeatableDateKeys[listKey].forEach((fk) => {
        const v = r[fk]
        if (v != null && v !== '' && !dayjs.isDayjs(v)) {
          const d = dayjs(v)
          r[fk] = d.isValid() ? d : undefined
        }
      })
      return r
    })
  })
  return out
}

function generateTestDataForField(field) {
  const fieldName = field.key || field.label

  switch (field.type) {
    case 'text':
      if (fieldName.toLowerCase().includes('business') && fieldName.toLowerCase().includes('name')) return 'ABC Trading Corp.'
      if (fieldName.toLowerCase().includes('name')) return 'Juan Dela Cruz'
      if (fieldName.toLowerCase().includes('email')) return 'juan.delacruz@example.com'
      if (fieldName.toLowerCase().includes('phone') || fieldName.toLowerCase().includes('contact')) return '09171234567'
      if (fieldName.toLowerCase().includes('tin')) return '123-456-789-000'
      return `Test ${field.label || 'Value'}`

    case 'textarea':
      return `This is sample text for ${field.label || 'this field'}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`

    case 'number':
      if (fieldName.toLowerCase().includes('capital')) return 500000
      if (fieldName.toLowerCase().includes('employee')) return 10
      if (fieldName.toLowerCase().includes('gross')) return 1200000
      if (fieldName.toLowerCase().includes('area') || fieldName.toLowerCase().includes('sqm')) return 150
      return 100

    case 'date': {
      const key = (fieldName || '').toLowerCase()
      if (key.includes('birth') || key.includes('dob')) {
        return dayjs().subtract(30, 'year')
      }
      if (key.includes('registration') || key.includes('application') || key.includes('dateofapplication')) {
        return dayjs().subtract(1, 'year')
      }
      return dayjs().subtract(1, 'month')
    }

    case 'select':
      if (field.dropdownOptions?.length > 0) {
        return field.dropdownOptions[0]
      }
      return null

    case 'multiselect':
      if (field.dropdownOptions?.length > 0) {
        return field.dropdownOptions.slice(0, Math.min(2, field.dropdownOptions.length))
      }
      return []

    case 'checkbox':
      return true

    case 'file':
      // Skip file fields - mock files can't be uploaded to IPFS without user interaction
      // User must manually upload files after filling test data
      return undefined

    case 'download':
      return undefined

    case 'address':
    case 'address_alaminos':
      return undefined

    case 'repeatable_group':
      const groupFields = field.groupFields || []
      if (groupFields.length === 0) return [{}]
      const row = {}
      groupFields.forEach(gf => {
        const gfName = gf.key || gf.label
        if (gf.type === 'select' && gf.dropdownOptions?.length > 0) {
          row[gfName] = gf.dropdownOptions[0]
        } else if (gf.type === 'date') {
          row[gfName] = dayjs().subtract(1, 'month')
        } else if (gf.type === 'number') {
          row[gfName] = 100
        } else {
          row[gfName] = `Test ${gf.label || 'Value'}`
        }
      })
      return [row]

    default:
      return `Test ${field.label || 'Value'}`
  }
}

function generateTestDataForDefinition(definition, category = null) {
  const testData = {}

  if (category) {
    testData.category = category
  }

  const sections = definition?.sections || []

  sections.forEach(section => {
    const items = section.items || []
    items.forEach(field => {
      const fieldName = field.key || field.label
      if (field.type === 'address') {
        testData[fieldName] = { ...ALAMINOS_TEST_ADDRESS }
        return
      }
      if (field.type === 'address_alaminos') {
        testData[fieldName] = {
          streetAddress: ALAMINOS_TEST_ADDRESS.streetAddress,
          barangay: ALAMINOS_TEST_ADDRESS.barangay,
          barangayName: ALAMINOS_TEST_ADDRESS.barangayName,
          postalCode: ALAMINOS_TEST_ADDRESS.postalCode,
        }
        return
      }
      if (field.type === 'ai_lob_recommendation') {
        const firstLob = LINE_OF_BUSINESS[0]
        const firstDetailed = firstLob?.detailedLines?.[0]
        const firstPsic = firstLob?.psicCodes?.[0] || ''
        testData.businessDescriptionText = 'Retail store selling groceries and general merchandise.'
        testData.hasAnalyzedBusinessDescription = true
        testData.businessActivities = firstLob && firstDetailed
          ? [{ taxCode: firstLob.taxCode, lineOfBusiness: firstLob.lineOfBusiness, detailedLineOfBusiness: firstDetailed, psicCode: firstPsic }]
          : []
        return
      }
      const value = generateTestDataForField(field)
      if (value !== undefined) {
        testData[fieldName] = value
      }
    })
  })

  return testData
}

export { createMockFile, formDataWithDayjs, generateTestDataForField, generateTestDataForDefinition }
