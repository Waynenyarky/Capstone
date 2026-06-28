/**
 * Filter fee items by search query
 */
export function filterItemsBySearch(items, query) {
  if (!query || query.trim() === '') return items
  const q = query.trim().toLowerCase()
  return items.filter((item) => {
    const name = (item.name || '').toLowerCase()
    const description = (item.description || '').toLowerCase()
    return name.includes(q) || description.includes(q)
  })
}

/**
 * Filter fee items by status (active/disabled)
 */
export function filterItemsByStatus(items, statusFilter) {
  if (!statusFilter) return items
  return items.filter((item) => {
    if (statusFilter === 'active') return item.isActive
    if (statusFilter === 'disabled') return !item.isActive
    return true
  })
}

/**
 * Get add button label by fee type
 */
export function getAddButtonLabel(_feeType) {
  return 'Add'
}
