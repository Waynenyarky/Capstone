export function fixedMinRules(form) {
  return [
    {
      validator: (_, value) => {
        const mode = form?.getFieldValue?.('pricingMode')
        const requiresFixed = mode === 'fixed' || mode === 'both'
        if (!requiresFixed) {
          if (value === undefined || value === null || value === '') return Promise.resolve()
        }
        if (value === undefined || value === null || value === '') {
          return Promise.reject(new Error('Please input a minimum price'))
        }
        const num = Number(value)
        if (Number.isNaN(num)) return Promise.reject(new Error('Minimum price must be a number'))
        if (num < 0) return Promise.reject(new Error('Minimum price must be 0 or higher'))
        return Promise.resolve()
      },
    },
  ]
}

export function fixedMaxRules(form) {
  return [
    {
      validator: (_, value) => {
        const mode = form?.getFieldValue?.('pricingMode')
        const requiresFixed = mode === 'fixed' || mode === 'both'
        const min = form?.getFieldValue?.('priceMin')
        if (!requiresFixed) {
          if (value === undefined || value === null || value === '') return Promise.resolve()
        }
        if (value === undefined || value === null || value === '') {
          return Promise.reject(new Error('Please input a maximum price'))
        }
        const num = Number(value)
        if (Number.isNaN(num)) return Promise.reject(new Error('Maximum price must be a number'))
        if (num < 0) return Promise.reject(new Error('Maximum price must be 0 or higher'))
        if (min !== undefined && min !== null && Number(min) > Number(value)) {
          return Promise.reject(new Error('Maximum must be greater than or equal to minimum'))
        }
        return Promise.resolve()
      },
    },
  ]
}

export function hourlyMinRules(form) {
  return [
    {
      validator: (_, value) => {
        const mode = form?.getFieldValue?.('pricingMode')
        const requiresHourly = mode === 'hourly' || mode === 'both'
        if (!requiresHourly) {
          if (value === undefined || value === null || value === '') return Promise.resolve()
        }
        if (value === undefined || value === null || value === '') {
          return Promise.reject(new Error('Please input a minimum hourly rate'))
        }
        const num = Number(value)
        if (Number.isNaN(num)) return Promise.reject(new Error('Minimum hourly rate must be a number'))
        if (num < 0) return Promise.reject(new Error('Minimum hourly rate must be 0 or higher'))
        return Promise.resolve()
      },
    },
  ]
}

export function hourlyMaxRules(form) {
  return [
    {
      validator: (_, value) => {
        const mode = form?.getFieldValue?.('pricingMode')
        const requiresHourly = mode === 'hourly' || mode === 'both'
        const min = form?.getFieldValue?.('hourlyRateMin')
        if (!requiresHourly) {
          if (value === undefined || value === null || value === '') return Promise.resolve()
        }
        if (value === undefined || value === null || value === '') {
          return Promise.reject(new Error('Please input a maximum hourly rate'))
        }
        const num = Number(value)
        if (Number.isNaN(num)) return Promise.reject(new Error('Maximum hourly rate must be a number'))
        if (num < 0) return Promise.reject(new Error('Maximum hourly rate must be 0 or higher'))
        if (min !== undefined && min !== null && Number(min) > Number(value)) {
          return Promise.reject(new Error('Maximum hourly rate must be greater than or equal to minimum'))
        }
        return Promise.resolve()
      },
    },
  ]
}