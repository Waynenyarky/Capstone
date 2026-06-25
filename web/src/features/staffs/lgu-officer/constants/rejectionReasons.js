/**
 * Generic rejection reasons for field-level review (officer accept/reject).
 * Used in dropdown when officer rejects a field; "Other" allows free-text reason.
 */
export const REJECTION_REASON_OPTIONS = [
  { value: 'incorrect_format', label: 'Incorrect or invalid format' },
  { value: 'missing_incomplete', label: 'Missing or incomplete information' },
  { value: 'does_not_match_document', label: 'Does not match supporting document' },
  { value: 'document_unclear', label: 'Document unclear or unreadable' },
  { value: 'other', label: 'Other' },
]

export const REASON_OTHER_CODE = 'other'

/**
 * Generic comment options for officer comments.
 * Used in dropdown when officer adds comments; "Other" allows free-text comments.
 */
export const COMMENT_OPTIONS = [
  { value: 'application_complete', label: 'Application appears complete and ready for processing' },
  { value: 'minor_clarifications_needed', label: 'Minor clarifications needed from applicant' },
  { value: 'documents_verified', label: 'All supporting documents have been verified' },
  { value: 'business_information_confirmed', label: 'Business information has been confirmed' },
  { value: 'follow_up_required', label: 'Follow-up required for additional verification' },
  { value: 'other', label: 'Other' },
]

export const COMMENT_OTHER_CODE = 'other'

/**
 * Request options for Request Changes decision.
 * Used when officer needs applicant to make corrections.
 */
export const REQUEST_OPTIONS = [
  { value: 'update_documents', label: 'Please update or resubmit required documents' },
  { value: 'correct_information', label: 'Please correct the information provided' },
  { value: 'provide_additional_info', label: 'Please provide additional information' },
  { value: 'clarify_details', label: 'Please clarify specific details' },
  { value: 'complete_missing_fields', label: 'Please complete missing fields' },
  { value: 'other', label: 'Other' },
]

export const REQUEST_OTHER_CODE = 'other'

/**
 * Build a stable field key for field-level review decisions.
 * - Normal item: sectionIdx + '.' + (item.key || item.label)
 * - Repeatable group row: sectionIdx + '.' + itemKey + '.' + rowIndex
 * - LOB: use 'lob_description' for description; 'lob_activity_0', 'lob_activity_1', ... for each activity
 *
 * @param {number} sectionIdx - Section index
 * @param {object} item - Form definition item
 * @param {number} [rowIndex] - For repeatable_group, row index
 * @returns {string} Field key
 */
export function getFieldKey(sectionIdx, item, rowIndex = undefined) {
  const itemKey = item.key || item.label || 'field'
  if (item.type === 'repeatable_group' && rowIndex !== undefined) {
    return `${sectionIdx}.${itemKey}.${rowIndex}`
  }
  return `${sectionIdx}.${itemKey}`
}

/**
 * LOB field keys (used when section is the LOB section)
 */
export const LOB_FIELD_DESCRIPTION = 'businessDescriptionText'
export function getLobActivityFieldKey(index) {
  return `businessActivities.${index}`
}

/**
 * Build list of all reviewable field keys from form definition sections and form data.
 * Used to enforce "all fields reviewed" before submit and for progress.
 * Skips download-type items; for repeatable_group uses row count from formData; for LOB section uses lob_description + lob_activity_0, ...
 *
 * @param {Array<{ items: Array }>} sections - Form definition sections (after filterSectionsByFormValues)
 * @param {object} formData - Current form data (for repeatable row counts and businessActivities length)
 * @returns {{ keys: string[], lobSectionIndex: number | null }} All field keys and LOB section index if any
 */
export function getReviewableFieldKeys(sections, formData) {
  const keys = []
  let lobSectionIndex = null
  const activities = Array.isArray(formData?.businessActivities) ? formData.businessActivities : []

  ;(sections || []).forEach((section, sectionIdx) => {
    const items = section?.items || []
    const isLobSection = items.some(
      (it) => it.type === 'ai_lob_recommendation' || (it.key || it.label) === 'aiLobRecommendation'
    )
    if (isLobSection) {
      lobSectionIndex = sectionIdx
      keys.push(LOB_FIELD_DESCRIPTION)
      activities.forEach((_, i) => keys.push(getLobActivityFieldKey(i)))
      return
    }
    items.forEach((item) => {
      if (item.type === 'download') return
      const itemKey = item.key || item.label
      if (!itemKey) return
      if (item.type === 'repeatable_group') {
        const value = formData?.[itemKey]
        const rows = Array.isArray(value) ? value : []
        rows.forEach((_, rowIndex) => keys.push(getFieldKey(sectionIdx, item, rowIndex)))
      } else {
        keys.push(getFieldKey(sectionIdx, item))
      }
    })
  })

  return { keys, lobSectionIndex }
}
