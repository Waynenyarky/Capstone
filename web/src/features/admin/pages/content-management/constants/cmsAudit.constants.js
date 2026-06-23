export const CMS_AUDIT_PAGE_SIZE = 20

export const CMS_AUDIT_EVENT_TYPES = [
  { value: 'faq_updated', label: 'FAQ Updated' },
  { value: 'instruction_updated', label: 'Instruction Updated' },
  { value: 'page_updated', label: 'Page Updated' },
  { value: 'announcement_created', label: 'Announcement Created' },
  { value: 'announcement_updated', label: 'Announcement Updated' },
  { value: 'announcement_deleted', label: 'Announcement Deleted' },
]

export const CMS_AUDIT_FIELD_LABELS = {
  title: 'Title',
  description: 'Description',
  subtitle: 'Subtitle',
  items: 'FAQ Items',
  bulletPoints: 'Bullet Points',
  faqItems: 'FAQ Items',
}

/**
 * Format a CMS audit log entry for display
 * @param {Object} log - Audit log entry
 * @returns {string} Display string
 */
export function formatCmsAuditRow(log) {
  const eventType = log.eventType || log.action || 'Unknown'
  const eventLabel = CMS_AUDIT_EVENT_TYPES.find((e) => e.value === eventType)?.label || eventType

  // Add optional context from metadata
  const slotId = log.metadata?.slotId
  const fieldChanged = log.fieldChanged

  let context = ''
  if (slotId) context += ` (${slotId})`
  if (fieldChanged) context += ` · ${fieldChanged}`

  return `${eventLabel}${context}`
}
