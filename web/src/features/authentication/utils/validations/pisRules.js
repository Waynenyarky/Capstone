/**
 * PIS (Personal Information Sheet) validation rules for signup step 2.
 * All fields are required for PIS completion but optional at signup
 * (user can skip and complete later from profile).
 */

import { namePatternRule } from './namePattern.js'

export const pisStreetRules = [
  {
    validator: (_, value) => {
      if (value === undefined || value === null || value === '') {
        return Promise.reject(new Error('Please enter your street address'))
      }
      return Promise.resolve()
    }
  },
  { max: 200, message: 'Street address must be at most 200 characters' },
]

export const pisBarangayRules = [
  {
    validator: (_, value) => {
      if (value === undefined || value === null || value === '') {
        return Promise.reject(new Error('Please enter your barangay'))
      }
      return Promise.resolve()
    }
  },
  { max: 100, message: 'Barangay must be at most 100 characters' },
]

export const pisCityRules = [
  {
    validator: (_, value) => {
      if (value === undefined || value === null || value === '') {
        return Promise.reject(new Error('Please enter your city/municipality'))
      }
      return Promise.resolve()
    }
  },
  { max: 100, message: 'City must be at most 100 characters' },
]

export const pisProvinceRules = [
  {
    validator: (_, value) => {
      if (value === undefined || value === null || value === '') {
        return Promise.reject(new Error('Please enter your province'))
      }
      return Promise.resolve()
    }
  },
  { max: 100, message: 'Province must be at most 100 characters' },
]

export const pisZipCodeRules = [
  {
    validator: (_, value) => {
      if (value === undefined || value === null || value === '') {
        return Promise.reject(new Error('Please enter your zip code'))
      }
      return Promise.resolve()
    }
  },
  { pattern: /^\d{4}$/, message: 'Zip code must be exactly 4 digits' },
]

export const pisSexRules = [
  {
    validator: (_, value) => {
      if (value === undefined || value === null || value === '') {
        return Promise.reject(new Error('Please select your sex'))
      }
      return Promise.resolve()
    }
  },
]

export const pisMaritalStatusRules = [
  {
    validator: (_, value) => {
      if (value === undefined || value === null || value === '') {
        return Promise.reject(new Error('Please select your marital status'))
      }
      return Promise.resolve()
    }
  },
]

export const pisDateOfBirthRules = [
  {
    validator: (_, value) => {
      if (value === undefined || value === null || value === '') {
        return Promise.reject(new Error('Please select your date of birth'))
      }
      return Promise.resolve()
    }
  },
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
  {
    validator: (_, value) => {
      if (value === undefined || value === null || value === '') {
        return Promise.reject(new Error('Please enter your place of birth'))
      }
      return Promise.resolve()
    }
  },
  { max: 200, message: 'Place of birth must be at most 200 characters' },
  namePatternRule,
]

export const pisNationalityRules = [
  {
    validator: (_, value) => {
      if (value === undefined || value === null || value === '') {
        return Promise.reject(new Error('Please enter your nationality'))
      }
      return Promise.resolve()
    }
  },
  { max: 50, message: 'Nationality must be at most 50 characters' },
  namePatternRule,
]

export const pisFatherNameRules = [
  {
    validator: (_, value) => {
      if (value === undefined || value === null || value === '') {
        return Promise.reject(new Error("Please enter your father's name"))
      }
      return Promise.resolve()
    }
  },
  { max: 100, message: "Father's name must be at most 100 characters" },
  namePatternRule,
]

export const pisMotherNameRules = [
  {
    validator: (_, value) => {
      if (value === undefined || value === null || value === '') {
        return Promise.reject(new Error("Please enter your mother's name"))
      }
      return Promise.resolve()
    }
  },
  { max: 100, message: "Mother's name must be at most 100 characters" },
  namePatternRule,
]

export const pisEducationRules = [
  {
    validator: (_, value) => {
      if (value === undefined || value === null || value === '') {
        return Promise.reject(new Error('Please select your highest educational attainment'))
      }
      return Promise.resolve()
    }
  },
]
