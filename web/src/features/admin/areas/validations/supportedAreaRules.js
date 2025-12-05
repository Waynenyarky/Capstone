// Validation rules for Supported Areas forms

export function provinceRules({ form, areaIndex, existingProvincesSet }) {
  return [
    { required: true, message: 'Select province' },
    {
      validator: (_, value) => {
        const all = form.getFieldValue('areas') || []
        const norm = String(value || '').trim().toLowerCase()
        if (!norm) return Promise.resolve()
        const dup = all.some(
          (g, idx) => idx !== areaIndex && String(g?.province || '').trim().toLowerCase() === norm
        )
        if (dup) return Promise.reject(new Error('Province already selected'))
        if (existingProvincesSet?.has(norm)) return Promise.reject(new Error('Province already supported — use Edit form'))
        return Promise.resolve()
      },
    },
  ]
}

export function citiesRules() {
  return [{ required: true, message: 'Select one or more cities' }]
}