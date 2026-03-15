import dayjs from 'dayjs'

// Alaminos City, Pangasinan – PSGC codes for test data (full address shape for PhilippineAddressFields)
export const ALAMINOS_TEST_ADDRESS = {
  streetAddress: '123 Rizal Street',
  province: '015500000',
  provinceName: 'Pangasinan',
  city: '015503000',
  cityName: 'City of Alaminos',
  barangay: '015503021',
  barangayName: 'Poblacion',
  postalCode: '2404',
}

export function createMockFile(fieldName) {
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
  }
}

/** Convert date fields in formData to dayjs so Ant Design DatePicker does not throw .isValid is not a function */
export function formDataWithDayjs(formData, definition) {
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

export function generateTestDataForField(field) {
  const fieldName = field.key || field.label

  switch (field.type) {
    case 'text':
      if (fieldName.toLowerCase().includes('name')) return 'Juan Dela Cruz'
      if (fieldName.toLowerCase().includes('email')) return 'juan.delacruz@example.com'
      if (fieldName.toLowerCase().includes('phone') || fieldName.toLowerCase().includes('contact')) return '09171234567'
      if (fieldName.toLowerCase().includes('tin')) return '123-456-789-000'
      if (fieldName.toLowerCase().includes('business') && fieldName.toLowerCase().includes('name')) return 'ABC Trading Corp.'
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
      if (key.includes('start') || key.includes('commencement')) {
        return dayjs().subtract(1, 'year')
      }
      if (key.includes('established')) {
        return dayjs().subtract(2, 'year')
      }
      return dayjs()
    }

    case 'select':
    case 'radio':
      if (field.options && field.options.length > 0) {
        return field.options[0].value
      }
      return 'option1'

    case 'checkbox':
      if (field.options && field.options.length > 0) {
        return [field.options[0].value]
      }
      return ['option1']

    case 'address':
    case 'address_alaminos':
      return ALAMINOS_TEST_ADDRESS

    default:
      return null
  }
}

export function generateTestDataForDefinition(definition, category = null) {
  const testData = {}

  if (category) {
    testData.category = category
  }

  if (!definition?.sections) return testData

  definition.sections.forEach((section) => {
    if (!section.items) return

    section.items.forEach((item) => {
      const key = item.key || item.label
      if (!key) return

      const testValue = generateTestDataForField(item)
      if (testValue !== null) {
        testData[key] = testValue
      }
    })
  })

  return testData
}
