/**
 * Read-only ordinances list for inspector legal reference helper.
 * Structure: { id, title, reference, category }
 */
const ORDINANCES = [
  { id: 'ORD-001', title: 'Business Permit and Licensing', reference: 'Local Government Code Sec. 444-447', category: 'Permits' },
  { id: 'ORD-002', title: 'Sanitation and Cleanliness', reference: 'Sanitation Code of the Philippines', category: 'Health & Safety' },
  { id: 'ORD-003', title: 'Fire Safety Requirements', reference: 'Fire Code of the Philippines (RA 9514)', category: 'Safety' },
  { id: 'ORD-004', title: 'Structural Integrity', reference: 'National Building Code (PD 1096)', category: 'Construction' },
  { id: 'ORD-005', title: 'Electrical Standards', reference: 'Philippine Electrical Code', category: 'Safety' },
  { id: 'ORD-006', title: 'Waste Disposal', reference: 'Ecological Solid Waste Management Act (RA 9003)', category: 'Environment' },
  { id: 'ORD-007', title: 'Occupancy Limits', reference: 'Building Code Occupancy Standards', category: 'Safety' },
  { id: 'ORD-008', title: 'Health Certificates', reference: 'Food Safety Act (RA 10611)', category: 'Health' },
  { id: 'ORD-009', title: 'Signage and Notices', reference: 'Local Zoning Ordinance', category: 'Compliance' },
  { id: 'ORD-010', title: 'Business Records', reference: 'Tax Code Record Keeping', category: 'Compliance' }
]

function getOrdinances() {
  return ORDINANCES
}

module.exports = { getOrdinances, ORDINANCES }
