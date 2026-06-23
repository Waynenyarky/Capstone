/**
 * Filter announcements to only published, active, and within date window
 * @param {Array} list - Array of announcement objects
 * @param {Object} options - Filter options
 * @param {string} options.audience - 'public' or 'staff'
 * @returns {Array} Filtered announcements
 */
export function filterPublishedActiveAnnouncements(list, { audience }) {
  if (!Array.isArray(list)) return []

  const now = new Date()

  return list.filter((ann) => {
    // Must be published
    if (ann.status !== 'published') return false

    // Must be active (isActive !== false)
    if (ann.isActive === false) return false

    // Audience match - treat missing audience as 'public' for backward compatibility
    if (audience && ann.audience && ann.audience !== audience) return false

    // Date window: publishAt null or <= now
    if (ann.publishAt && new Date(ann.publishAt) > now) return false

    // Date window: expiresAt null or > now
    if (ann.expiresAt && new Date(ann.expiresAt) <= now) return false

    return true
  })
}
