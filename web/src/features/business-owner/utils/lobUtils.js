import { LINE_OF_BUSINESS } from '@/constants/lineOfBusiness.js'

export const TAX_CODE_OPTIONS = LINE_OF_BUSINESS.map(l => ({
  value: l.taxCode,
  label: `${l.taxCode} — ${l.label || l.lineOfBusiness}`,
}))

export function getDetailedLinesForTaxCode(taxCode) {
  const lob = LINE_OF_BUSINESS.find(l => l.taxCode === taxCode)
  if (!lob) return []
  return lob.detailedLines.map((dl, idx) => ({
    value: dl,
    label: dl,
    psicCode: lob.psicCodes[idx] || '',
    lineOfBusiness: lob.lineOfBusiness,
  }))
}

export function normalizeActivityFromForm(a) {
  if (!a || !a.taxCode) return null
  const lob = LINE_OF_BUSINESS.find(l => l.taxCode === a.taxCode)
  const detailedLine = a.detailedLine || a.detailedLineOfBusiness
  if (!detailedLine) return null
  const idx = lob ? lob.detailedLines.indexOf(detailedLine) : -1
  const psicCode = (lob && idx >= 0 && lob.psicCodes[idx]) ? lob.psicCodes[idx] : (a.psicCode || '')
  return {
    taxCode: a.taxCode,
    lineOfBusiness: a.lineOfBusiness || (lob && lob.lineOfBusiness) || '',
    detailedLine,
    psicCode,
    source: a.source === 'ai' ? 'ai' : 'manual',
  }
}

/** Normalize API recommendation to a plain object (avoids circular refs / proxy from response). */
export function normalizeRecommendation(r) {
  if (!r || !r.taxCode || !r.detailedLine) return null
  return {
    taxCode: String(r.taxCode),
    lineOfBusiness: String(r.lineOfBusiness ?? ''),
    detailedLine: String(r.detailedLine),
    psicCode: r.psicCode != null ? String(r.psicCode) : '',
    source: 'ai',
  }
}
