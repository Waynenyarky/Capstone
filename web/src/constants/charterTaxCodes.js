/**
 * City of General Trias — Mayor's Permit Fee categories (Charter Section 4A.01).
 * Each number is the tax code; the label is the industry category from the
 * Citizen's Charter — OCBPLO 2025.
 *
 * Reference: https://www.generaltrias.gov.ph/storage/pdf_files/Citizen%27s%20Charter%20-%20OCBPLO%202025..pdf
 */
export const CHARTER_TAX_CODES = [
  { code: '1', label: 'Heavy Industries' },
  { code: '2', label: 'Medium Industries' },
  { code: '3', label: 'Institutional Establishments' },
  { code: '4', label: 'Public Market Stalls' },
  { code: '5', label: 'Rentals' },
  { code: '6', label: 'Food Industries' },
  { code: '7', label: 'Banks and Other Financial Institutions' },
  { code: '8', label: 'Agricultural' },
  { code: '9', label: 'Contractor' },
  { code: '10', label: 'Amusement Places' },
  { code: '11', label: 'Services' },
  { code: '12', label: 'Trading/Retail/Wholesale' },
]

export const CHARTER_TAX_CODE_OPTIONS = CHARTER_TAX_CODES.map(({ code, label }) => ({
  value: code,
  label: `${code} — ${label}`,
}))

export function getCharterTaxCodeLabel(code) {
  const found = CHARTER_TAX_CODES.find((c) => c.code === String(code))
  return found ? `${found.code} — ${found.label}` : code || '—'
}
