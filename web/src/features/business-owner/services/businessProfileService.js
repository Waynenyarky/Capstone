import { get, post, put, patch, del } from '@/lib/http'
import { fetchWithFallback } from '@/lib/http'

export const getBusinessProfile = async () => {
  return get('/api/business/profile')
}

export const updateBusinessProfile = async (step, data) => {
  return post('/api/business/profile', { step, data })
}

/**
 * Upload owner ID image (front or back) during business registration.
 * Returns { url, ipfsCid } for use in form submission.
 */
export const uploadOwnerIdImage = async (file, side = 'front') => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('side', side)
  const res = await fetchWithFallback('/api/business/profile/owner-id/upload', {
    method: 'POST',
    body: formData,
    // Don't set Content-Type - browser sets it with boundary for multipart
  })
  if (!res?.ok) {
    const err = await res?.json().catch(() => ({}))
    throw new Error(err?.error?.message || err?.message || 'Failed to upload ID image')
  }
  return res.json()
}

// Multiple Business Management
export const getBusinesses = async () => {
  return get('/api/business/businesses')
}

export const getPrimaryBusiness = async () => {
  return get('/api/business/businesses/primary')
}

export const getBusiness = async (businessId) => {
  const { businesses } = await getBusinesses()
  return businesses?.find(b => b.businessId === businessId) || null
}

export const addBusiness = async (data) => {
  return post('/api/business/businesses', data)
}

export const updateBusiness = async (businessId, data) => {
  return put(`/api/business/businesses/${businessId}`, data)
}

export const updateBusinessStatus = async (businessId, { businessStatus }) => {
  return patch(`/api/business/businesses/${businessId}`, { businessStatus })
}

export const deleteBusiness = async (businessId) => {
  return del(`/api/business/businesses/${businessId}`)
}

export const setPrimaryBusiness = async (businessId) => {
  return post(`/api/business/businesses/${businessId}/primary`)
}

export const updateBusinessRiskProfile = async (businessId, data) => {
  return put(`/api/business/businesses/${businessId}/risk-profile`, data)
}
