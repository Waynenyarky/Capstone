/**
 * Configurable checklist template for inspections.
 * Each item has: id, label, defaultSeverity.
 * Inspections copy this template and inspectors fill in result, remarks.
 */
const DEFAULT_CHECKLIST = [
  { id: 'sanitation', label: 'Sanitation and cleanliness standards', defaultSeverity: 'high' },
  { id: 'fire_safety', label: 'Fire safety equipment and exits', defaultSeverity: 'critical' },
  { id: 'structural', label: 'Structural integrity of premises', defaultSeverity: 'high' },
  { id: 'electrical', label: 'Electrical wiring and fixtures', defaultSeverity: 'high' },
  { id: 'permits_display', label: 'Permits and licenses displayed', defaultSeverity: 'medium' },
  { id: 'waste_disposal', label: 'Waste disposal compliance', defaultSeverity: 'medium' },
  { id: 'occupancy', label: 'Occupancy limits compliance', defaultSeverity: 'medium' },
  { id: 'health_cert', label: 'Health certificates (if applicable)', defaultSeverity: 'high' },
  { id: 'signage', label: 'Required signage and notices', defaultSeverity: 'low' },
  { id: 'records', label: 'Business records availability', defaultSeverity: 'low' }
]

/**
 * Get the default checklist template.
 * @returns {Array<{id: string, label: string, defaultSeverity: string}>}
 */
function getChecklistTemplate() {
  return DEFAULT_CHECKLIST.map((item) => ({
    id: item.id,
    label: item.label,
    defaultSeverity: item.defaultSeverity
  }))
}

/**
 * Create checklist items for a new inspection from the template.
 * @returns {Array<{id: string, label: string, result: string, remarks: string, severity: string}>}
 */
function createChecklistFromTemplate() {
  return DEFAULT_CHECKLIST.map((item) => ({
    id: item.id,
    label: item.label,
    result: 'pending',
    remarks: '',
    severity: item.defaultSeverity
  }))
}

module.exports = {
  getChecklistTemplate,
  createChecklistFromTemplate,
  DEFAULT_CHECKLIST
}
