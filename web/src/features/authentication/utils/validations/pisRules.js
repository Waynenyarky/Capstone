/**
 * PIS (Personal Information Sheet) validation rules for signup step 2.
 * All fields are required for PIS completion but optional at signup
 * (user can skip and complete later from profile).
 */

export const pisStreetRules = [
  { required: true, message: 'Please enter your street address' },
  { max: 200, message: 'Street address must be at most 200 characters' },
]

export const pisBarangayRules = [
  { required: true, message: 'Please enter your barangay' },
  { max: 100, message: 'Barangay must be at most 100 characters' },
]

export const pisCityRules = [
  { required: true, message: 'Please enter your city/municipality' },
  { max: 100, message: 'City must be at most 100 characters' },
]

export const pisProvinceRules = [
  { required: true, message: 'Please enter your province' },
  { max: 100, message: 'Province must be at most 100 characters' },
]

export const pisZipCodeRules = [
  { required: true, message: 'Please enter your zip code' },
  { pattern: /^\d{4}$/, message: 'Zip code must be exactly 4 digits' },
]

export const pisSexRules = []

export const pisMaritalStatusRules = [
  { required: true, message: 'Please select your marital status' },
]

export const pisDateOfBirthRules = [
  { required: true, message: 'Please select your date of birth' },
  () => ({
    validator(_, value) {
      if (!value) return Promise.resolve()
      const dob = value.toDate ? value.toDate() : new Date(value)
      const now = new Date()
      const age = now.getFullYear() - dob.getFullYear()
      const monthDiff = now.getMonth() - dob.getMonth()
      const actualAge = monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate()) ? age - 1 : age
      if (actualAge < 18) {
        return Promise.reject(new Error('You must be at least 18 years old'))
      }
      return Promise.resolve()
    },
  }),
]

export const pisPlaceOfBirthRules = [
  { required: true, message: 'Please enter your place of birth' },
  { max: 200, message: 'Place of birth must be at most 200 characters' },
]

export const pisNationalityRules = [
  { required: true, message: 'Please enter your nationality' },
  { max: 50, message: 'Nationality must be at most 50 characters' },
]

export const pisSpouseNameRules = [
  { required: true, message: 'Please enter your spouse name' },
  { max: 100, message: 'Spouse name must be at most 100 characters' },
]

export const pisFatherNameRules = [
  { required: true, message: "Please enter your father's name" },
  { max: 100, message: "Father's name must be at most 100 characters" },
]

export const pisMotherNameRules = [
  { required: true, message: "Please enter your mother's name" },
  { max: 100, message: "Mother's name must be at most 100 characters" },
]

export const pisEducationRules = [
  { required: true, message: 'Please select your highest educational attainment' },
]
