import { useMemo } from 'react'

export function useDocuments(business, formData) {
  return useMemo(() => {
    const lguDocs = business?.lguDocuments || business?.documentCids || {}
    const resolved = { ...lguDocs }
    // Resolve *IpfsCid keys to base keys (e.g. dtiSecCdaCertificateIpfsCid -> dtiSecCdaCertificate)
    Object.keys(lguDocs).forEach((k) => {
      if (k.endsWith('IpfsCid')) {
        const baseKey = k.replace(/IpfsCid$/, '')
        if (!resolved[baseKey] && lguDocs[k]) {
          resolved[baseKey] = lguDocs[k]
        }
      }
    })
    // Also include document CIDs from formData
    if (formData && typeof formData === 'object') {
      Object.keys(formData).forEach((k) => {
        const val = formData[k]
        // Check if it looks like a CID (string starting with Qm or bafy)
        if (typeof val === 'string' && (val.startsWith('Qm') || val.startsWith('bafy'))) {
          if (!resolved[k]) {
            resolved[k] = val
          }
        }
      })
    }
    return resolved
  }, [business?.lguDocuments, business?.documentCids, formData])
}
