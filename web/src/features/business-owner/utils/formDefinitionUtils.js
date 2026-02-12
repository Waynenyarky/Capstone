/**
 * Shared helpers for deriving document fields from form definitions.
 * Used by business registration wizard and EditRegistrationModal.
 */

export function slugifyKey(label) {
  if (!label || typeof label !== 'string') return ''
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join('') || ''
}

/**
 * @param {object} definition - Active form definition with sections[].items[]
 * @returns {Array<{ key: string, label: string, required: boolean, validation: object }>}
 */
export function deriveDocumentFieldsFromDefinition(definition) {
  if (!definition?.sections || !Array.isArray(definition.sections)) return []
  const fields = []
  for (const section of definition.sections) {
    if (!section.items || !Array.isArray(section.items)) continue
    for (const item of section.items) {
      if (item.type === 'file') {
        const key = (item.key && String(item.key).trim()) || slugifyKey(item.label) || `file_${fields.length}`
        fields.push({
          key,
          label: item.label || key,
          required: item.required !== false,
          validation: item.validation || {}
        })
      }
    }
  }
  return fields
}
