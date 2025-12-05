export const serviceNameRules = [
  { required: true, message: 'Please input a name' },
]

export const serviceDescriptionRules = [
  { required: true, message: 'Please input a description' },
]

export const serviceStatusRules = [
  { required: true, message: 'Please select a status' },
]

export const serviceImageRules = [
  {
    validator: (_, value) => {
      const files = Array.isArray(value) ? value : []
      return files.length > 0
        ? Promise.resolve()
        : Promise.reject(new Error('Please upload an image'))
    },
  },
]

export const serviceCategoryRules = [
  { required: true, message: 'Please select a category' },
]

export const servicePriceMinRules = [
  { required: true, message: 'Please input a minimum price' },
  {
    validator: (_, value) => {
      const num = Number(value)
      if (Number.isNaN(num)) return Promise.reject(new Error('Minimum price must be a number'))
      if (num < 0) return Promise.reject(new Error('Minimum price must be 0 or higher'))
      return Promise.resolve()
    },
  },
]

export const servicePriceMaxRules = [
  { required: true, message: 'Please input a maximum price' },
  {
    validator: (_, value) => {
      const num = Number(value)
      if (Number.isNaN(num)) return Promise.reject(new Error('Maximum price must be a number'))
      if (num < 0) return Promise.reject(new Error('Maximum price must be 0 or higher'))
      return Promise.resolve()
    },
  },
]