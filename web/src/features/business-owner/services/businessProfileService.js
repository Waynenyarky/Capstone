import { get, post, put, del } from '@/lib/http'

export const getBusinessProfile = async () => {
  return get('/api/business/profile')
}

export const updateBusinessProfile = async (step, data) => {
  return post('/api/business/profile', { step, data })
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

export const deleteBusiness = async (businessId) => {
  return del(`/api/business/businesses/${businessId}`)
}

export const setPrimaryBusiness = async (businessId) => {
  return post(`/api/business/businesses/${businessId}/primary`)
}

export const updateBusinessRiskProfile = async (businessId, data) => {
  return put(`/api/business/businesses/${businessId}/risk-profile`, data)
}
