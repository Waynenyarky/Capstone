export const firstNameRules = [{ required: true, message: 'Please enter your first name' }]

export const lastNameRules = [{ required: true, message: 'Please enter your last name' }]

export const phoneNumberRules = [
  { required: true, message: 'Please enter your phone number' },
  () => ({
    validator(_, value) {
      const v = String(value || '').trim()
      if (!v) return Promise.resolve()
      if (!/^\d{11}$/.test(v)) {
        return Promise.reject(new Error('Phone number must be exactly 11 digits'))
      }
      if (!v.startsWith('09')) {
        return Promise.reject(new Error('Phone number must start with 09'))
      }
      return Promise.resolve()
    }
  })
]

// Strength/requirements feedback is shown by PasswordStrengthIndicator only (no duplicate validation text)
export const passwordRules = [
  { required: true, message: 'Please enter your password' },
]

export const confirmPasswordRules = [
    { required: true, message: 'Please confirm your password' },
    ({ getFieldValue }) => ({
        validator(_, value) {
            if (!value || getFieldValue('password') === value) {
                return Promise.resolve()
            }
            return Promise.reject(new Error('Passwords do not match'))
        },
    }),
]

export const emailRules = [
  { required: true, message: 'Please enter your email' },
  { type: 'email', message: 'The is not a valid email' },
]

export const serviceCategoriesRules = [{ required: true, message: 'Please select at least one service category' }]

export const businessNameRules = [{ required: true, message: 'Please enter your business name' }]

export const businessTypeRules = [{ required: true, message: 'Please select your business type' }]

export const yearsInBusinessRules = [{ required: true, message: 'Please enter years in business' }]

export const serviceAreasRules = [{ required: true, message: 'Please specify your service areas' }]

// Builds a rule ensuring entered service areas only include supported cities.
// Pass an array of allowed city names (case-insensitive match).
export function createServiceAreasSupportedRule(allowedCities = []) {
  const allowedLower = Array.isArray(allowedCities)
    ? allowedCities.map((c) => String(c || '').trim().toLowerCase())
    : []
  return {
    validator(_, value) {
      const cities = Array.isArray(value) ? value : []
      const unsupported = cities.filter(
        (c) => !allowedLower.includes(String(c || '').trim().toLowerCase())
      )
      if (unsupported.length > 0) {
        return Promise.reject(new Error(`Unsupported city/cities: ${unsupported.join(', ')}`))
      }
      return Promise.resolve()
    },
  }
}

export const businessPhoneRules = [{ required: true, message: 'Please enter your business phone' }]

export const businessEmailRules = [
  { required: true, message: 'Please enter your business email' },
  { type: 'email', message: 'This is not a valid email' },
]

export const businessDescriptionRules = [{ required: true, message: 'Please describe your business' }]

export const businessAddressRules = [{ required: true, message: 'Please enter your street address' }]

export const cityRules = [{ required: true, message: 'Please enter your city' }]

export const provinceRules = [{ required: true, message: 'Please enter your province' }]

export const zipCodeRules = [{ required: true, message: 'Please enter your zip code' }]

export const termsRules = [
  {
    validator: (_, value) =>
      value ? Promise.resolve() : Promise.reject(new Error('Please accept the terms and conditions')),
  },
]

export const businessOwnerRequiredRules = [
  {
    validator: (_, value) =>
      value ? Promise.resolve() : Promise.reject(new Error('You must check this box to continue')),
  },
]
