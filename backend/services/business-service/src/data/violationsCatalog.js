/**
 * Searchable violations catalog for inspector legal reference.
 * Structure: { code, label, ordinanceRef, severity }
 */
const VIOLATIONS_CATALOG = [
  { code: 'SAN-001', label: 'Poor sanitation and cleanliness', ordinanceRef: 'ORD-002', severity: 'high' },
  { code: 'SAN-002', label: 'Improper waste disposal', ordinanceRef: 'ORD-006', severity: 'medium' },
  { code: 'FIRE-001', label: 'Missing or defective fire extinguisher', ordinanceRef: 'ORD-003', severity: 'critical' },
  { code: 'FIRE-002', label: 'Blocked fire exits', ordinanceRef: 'ORD-003', severity: 'critical' },
  { code: 'STR-001', label: 'Structural defects or hazards', ordinanceRef: 'ORD-004', severity: 'high' },
  { code: 'ELEC-001', label: 'Exposed or faulty electrical wiring', ordinanceRef: 'ORD-005', severity: 'high' },
  { code: 'ELEC-002', label: 'Overloaded circuits', ordinanceRef: 'ORD-005', severity: 'medium' },
  { code: 'PERM-001', label: 'Permits not displayed', ordinanceRef: 'ORD-001', severity: 'medium' },
  { code: 'PERM-002', label: 'Expired business permit', ordinanceRef: 'ORD-001', severity: 'major' },
  { code: 'OCC-001', label: 'Exceeding occupancy limits', ordinanceRef: 'ORD-007', severity: 'high' },
  { code: 'HEALTH-001', label: 'Missing health certificates', ordinanceRef: 'ORD-008', severity: 'high' },
  { code: 'HEALTH-002', label: 'Expired health certificates', ordinanceRef: 'ORD-008', severity: 'medium' },
  { code: 'SIGN-001', label: 'Missing required signage', ordinanceRef: 'ORD-009', severity: 'low' },
  { code: 'REC-001', label: 'Business records not available', ordinanceRef: 'ORD-010', severity: 'low' },
  { code: 'GEN-001', label: 'Other violation (specify in description)', ordinanceRef: 'ORD-001', severity: 'minor' }
]

function searchViolationsCatalog(query = '') {
  const q = String(query || '').toLowerCase().trim()
  if (!q) return VIOLATIONS_CATALOG
  return VIOLATIONS_CATALOG.filter(
    (v) =>
      v.code.toLowerCase().includes(q) ||
      v.label.toLowerCase().includes(q) ||
      (v.ordinanceRef && v.ordinanceRef.toLowerCase().includes(q))
  )
}

module.exports = { searchViolationsCatalog, VIOLATIONS_CATALOG }
