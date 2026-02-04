import { fetchJsonWithFallback } from '@/lib/http.js'

// Admin endpoints (require authentication)
export async function getLGUs(params = {}) {
  const query = new URLSearchParams()
  if (params.region) query.set('region', params.region)
  if (params.type) query.set('type', params.type)
  if (params.isActive !== undefined) query.set('isActive', params.isActive)
  if (params.search) query.set('search', params.search)
  if (params.page) query.set('page', params.page)
  if (params.limit) query.set('limit', params.limit)

  const queryString = query.toString()
  const url = `/api/admin/lgus${queryString ? `?${queryString}` : ''}`
  return await fetchJsonWithFallback(url, { method: 'GET' })
}

export async function getLGU(code) {
  return await fetchJsonWithFallback(`/api/admin/lgus/${code}`, { method: 'GET' })
}

export async function createLGU(data) {
  return await fetchJsonWithFallback('/api/admin/lgus', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function updateLGU(code, data) {
  return await fetchJsonWithFallback(`/api/admin/lgus/${code}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function deleteLGU(code) {
  return await fetchJsonWithFallback(`/api/admin/lgus/${code}`, {
    method: 'DELETE',
  })
}

// Public endpoints (no authentication required)
export async function getActiveLGUs(params = {}) {
  const query = new URLSearchParams()
  if (params.region) query.set('region', params.region)
  if (params.type) query.set('type', params.type)

  const queryString = query.toString()
  const url = `/api/lgus/public/active${queryString ? `?${queryString}` : ''}`
  return await fetchJsonWithFallback(url, { method: 'GET' })
}

export async function getLGURegions() {
  return await fetchJsonWithFallback('/api/lgus/public/regions', { method: 'GET' })
}
