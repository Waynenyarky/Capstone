/**
 * General Permit Categories - per CBPLO-GPI-F06 form
 *
 * Defines the permit types available for general permit applications
 * in the City of General Trias BPLO system.
 */

const GENERAL_PERMIT_CATEGORIES = [
  { value: 'cooperative', label: 'Cooperative' },
  { value: 'association_foundation', label: 'Association / Foundation' },
  { value: 'chainsaw', label: 'Chainsaw Permit' },
  { value: 'firecrackers_stallholders', label: 'Firecrackers Stallholders' },
  { value: 'bazaar_festival_vendors', label: 'Bazaar / Festival Vendors' },
  { value: 'peddlers', label: 'Peddlers' },
  { value: 'promotions_exhibitors', label: 'Promotions / Exhibitors' },
  { value: 'cemetery_stallholders', label: 'Cemetery Stallholders' },
  { value: 'fish_trap_fish_pen', label: 'Fish Trap / Fish Pen' },
  { value: 'fish_pond', label: 'Fish Pond' },
]

// Values array for MongoDB enum validation
const GENERAL_PERMIT_CATEGORY_VALUES = GENERAL_PERMIT_CATEGORIES.map((c) => c.value)

// Labels map for quick lookup
const GENERAL_PERMIT_CATEGORY_LABELS = Object.fromEntries(
  GENERAL_PERMIT_CATEGORIES.map((c) => [c.value, c.label])
)

module.exports = {
  GENERAL_PERMIT_CATEGORIES,
  GENERAL_PERMIT_CATEGORY_VALUES,
  GENERAL_PERMIT_CATEGORY_LABELS,
}
