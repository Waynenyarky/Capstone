
export function resolveAvatarUrl(url) {
  if (!url) return undefined
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url
  }
  const backend = import.meta.env.VITE_BACKEND_ORIGIN || 'http://localhost:5000'
  // Remove leading slash if both backend ends with slash and url starts with slash, or ensure one slash
  const cleanBackend = backend.replace(/\/$/, '')
  const cleanUrl = url.startsWith('/') ? url : `/${url}`
  
  return `${cleanBackend}${cleanUrl}`
}
