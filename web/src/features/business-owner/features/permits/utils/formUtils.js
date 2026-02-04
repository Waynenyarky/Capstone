import { resolveAvatarUrl } from '@/lib/utils'

export function buildUploadFileList(url, fieldKey, isImageOverride = false) {
  if (!url) return []
  const urlString = typeof url === 'string' ? url : (url?.url || url?.response?.url || '')
  if (!urlString || urlString.trim() === '') return []
  const displayUrl = resolveAvatarUrl(urlString)
  if (!displayUrl) return []
  const urlParts = urlString.split('/')
  const filename = urlParts[urlParts.length - 1] || `${fieldKey}_document`
  const isImage = isImageOverride || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(urlString) || /image/i.test(urlString)
  return [{
    uid: `-${fieldKey}-${Date.now()}`,
    name: filename,
    status: 'done',
    url: displayUrl,
    thumbUrl: isImage ? displayUrl : undefined,
    response: { url: urlString }
  }]
}

export function normFile(e) {
  if (Array.isArray(e)) return e
  if (e?.fileList) return Array.isArray(e.fileList) ? e.fileList : []
  return []
}

export function extractUploadUrl(fileList) {
  if (!fileList || !Array.isArray(fileList) || fileList.length === 0) return ''
  const file = fileList[0]
  return file.response?.url || file.url || file.thumbUrl || (typeof file.response === 'string' ? file.response : null) || ''
}
