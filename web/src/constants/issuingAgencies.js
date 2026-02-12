/**
 * Issuing Agencies / Offices – government offices that issue permits and clearances.
 * Used for form definitions, staff assignments, and permit workflows.
 *
 * Matches office codes used in:
 * - web/src/features/shared/services/officeService.js (FALLBACK_OFFICES)
 * - web/src/features/admin/hooks/useStaffManagement.js (officeGroups)
 */

export const ISSUING_AGENCY_GROUPS = [
  {
    label: 'Core Offices',
    options: [
      { value: 'OSBC', label: 'OSBC – One Stop Business Center' },
      { value: 'CHO', label: 'CHO – City Health Office' },
      { value: 'BFP', label: 'BFP – Bureau of Fire Protection' },
      { value: 'CEO / ZC', label: 'CEO / ZC – City Engineering Office / Zoning Clearance' },
      { value: 'BH', label: 'BH – Barangay Hall / Barangay Business Clearance' },
    ],
  },
  {
    label: 'Preneed / Inter-Govt Clearances',
    options: [
      { value: 'BIR', label: 'BIR – Bureau of Internal Revenue' },
      { value: 'DTI', label: 'DTI – Department of Trade and Industry' },
      { value: 'SEC', label: 'SEC – Securities and Exchange Commission' },
      { value: 'CDA', label: 'CDA – Cooperative Development Authority' },
    ],
  },
  {
    label: 'Specialized / Conditional Offices',
    options: [
      { value: 'PNP-FEU', label: 'PNP‑FEU – Firearms & Explosives Unit' },
      { value: 'FDA / BFAD / DOH', label: 'FDA / BFAD / DOH – Food & Drug Administration / Bureau of Food & Drugs / Department of Health' },
      { value: 'PRC / PTR', label: 'PRC / PTR – Professional Regulatory Commission / Professional Tax Registration Boards' },
      { value: 'NTC', label: 'NTC – National Telecommunications Commission' },
      { value: 'POEA', label: 'POEA – Philippine Overseas Employment Administration' },
      { value: 'NIC', label: 'NIC – National Insurance Commission' },
      { value: 'ECC / ENV', label: 'ECC / ENV – Environmental Compliance Certificate / Environmental Office' },
    ],
  },
  {
    label: 'Support / Coordination Offices',
    options: [
      { value: 'CTO', label: "CTO – City Treasurer's Office" },
      { value: 'MD', label: 'MD – Market Division / Sector-Specific Divisions' },
      { value: 'CLO', label: 'CLO – City Legal Office' },
    ],
  },
]

/** Flat list of all agency options for simple Select */
export const ISSUING_AGENCY_OPTIONS = ISSUING_AGENCY_GROUPS.flatMap(
  (group) => group.options.map((opt) => ({ ...opt, group: group.label }))
)
