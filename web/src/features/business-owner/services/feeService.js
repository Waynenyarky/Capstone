import { get } from '@/lib/http.js'

export async function getFeePreview(lob) {
  if (!lob) return null
  return get(`/api/business/fee-preview?lob=${encodeURIComponent(lob)}`)
}
