/** Get a single displayable file URL from form value (string CID/URL or fileList item with cid/url) */
export function getFileUrlFromFormValue(value) {
  if (value == null) return ''
  if (typeof value === 'string' && value.trim() !== '') return value.trim()
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0]
    if (first && typeof first === 'object') {
      // Try multiple possible property names for CID/URL
      const cid = first.cid || first.ipfsCid || first.response?.cid || first.response?.ipfsCid
      const url = first.url || first.response?.url
      if (url && typeof url === 'string') return url
      if (cid && typeof cid === 'string') return cid
      // Debug: log the structure if we can't find CID/URL
      console.log('Debug - file object structure:', first)
    }
  }
  return ''
}
