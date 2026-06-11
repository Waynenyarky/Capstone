import dayjs from 'dayjs'

export function normalizeFormDataForRenderer(formData, definition) {
  if (!formData || typeof formData !== 'object') return {}

  const normalized = { ...formData }
  const sections = definition?.sections || []

  sections.forEach((section) => {
    ;(section.items || []).forEach((item) => {
      const key = item.key || item.label
      if (!key) return

      if (item.type === 'date') {
        const value = normalized[key]
        if (value != null && value !== '' && !dayjs.isDayjs(value)) {
          try {
            const parsed = dayjs(value)
            // Only set if it's a valid dayjs object
            if (parsed && typeof parsed.isValid === 'function' && parsed.isValid()) {
              normalized[key] = parsed
            } else {
              // Keep original value if it's not a valid date
              normalized[key] = value
            }
          } catch {
            // Keep original value if dayjs parsing fails
            normalized[key] = value
          }
        }
      }

      if (item.type === 'repeatable_group' && Array.isArray(normalized[key]) && item.groupFields?.length) {
        const groupDateKeys = (item.groupFields || [])
          .filter((field) => field.type === 'date')
          .map((field) => field.key || field.label)
          .filter(Boolean)

        if (!groupDateKeys.length) return

        normalized[key] = normalized[key].map((row) => {
          if (!row || typeof row !== 'object') return row
          const next = { ...row }
          groupDateKeys.forEach((groupKey) => {
            const value = next[groupKey]
            if (value != null && value !== '' && !dayjs.isDayjs(value)) {
              try {
                const parsed = dayjs(value)
                // Only set if it's a valid dayjs object
                if (parsed && typeof parsed.isValid === 'function' && parsed.isValid()) {
                  next[groupKey] = parsed
                } else {
                  // Keep original value if it's not a valid date
                  next[groupKey] = value
                }
              } catch {
                // Keep original value if dayjs parsing fails
                next[groupKey] = value
              }
            }
          })
          return next
        })
      }
    })
  })

  return normalized
}
