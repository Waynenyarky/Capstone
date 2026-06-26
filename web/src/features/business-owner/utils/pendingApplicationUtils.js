export function formatFieldKey(fieldKey) {
  if (!fieldKey || typeof fieldKey !== 'string') return 'Requested update'
  return fieldKey
    .replace(/^\d+\./, '') // Remove numeric prefix like "0."
    .replace(/^section_\d+_/i, '')
    .replace(/^lob_/i, '')
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim()
}

export function getRejectedFieldItems(fieldReviewDecisions, sections) {
  if (!fieldReviewDecisions || typeof fieldReviewDecisions !== 'object') return []

  return Object.entries(fieldReviewDecisions)
    .filter(([, decision]) => decision?.status === 'rejected')
    .map(([fieldKey, decision]) => {
      // Get field label from form definition (same logic as LGU officer side)
      let fieldLabel = null
      const parts = String(fieldKey).split('.')
      if (parts.length >= 2 && sections && sections.length > 0) {
        const sectionIdx = parseInt(parts[0])
        const itemKey = parts.slice(1).join('.')
        const section = sections?.[sectionIdx]
        if (section?.items) {
          // Try exact match first
          let item = section.items.find(it => (it.key || it.label) === itemKey)
          // Try startsWith match
          if (!item) {
            item = section.items.find(it => itemKey.startsWith(it.key || it.label))
          }
          // Try matching by key without section prefix
          if (!item) {
            item = section.items.find(it => {
              const itKey = it.key || it.label
              return itKey && (itemKey.includes(itKey) || itKey.includes(itemKey))
            })
          }
          if (item) {
            fieldLabel = item.label || item.key
          }
        }
      }
      
      // If still no label, try searching all sections
      if (!fieldLabel && sections && sections.length > 0) {
        for (const section of sections) {
          if (section?.items) {
            const itemKey = parts.length >= 2 ? parts.slice(1).join('.') : fieldKey
            const item = section.items.find(it => {
              const itKey = it.key || it.label
              return itKey === itemKey || (itKey && itemKey.includes(itKey))
            })
            if (item) {
              fieldLabel = item.label || item.key
              break
            }
          }
        }
      }
      
      // Fallback to formatFieldKey if no label found from form definition
      if (!fieldLabel) {
        fieldLabel = formatFieldKey(fieldKey)
      }
      
      // Get reason using free-text (reasonOther) or fallback to reasonCode
      const reason = decision?.reasonOther || decision?.reasonCode || 'Needs correction'
      
      return {
        fieldKey,
        label: fieldLabel,
        reason,
      }
    })
}
