import { get, post, put, del } from '@/lib/http.js'

// Fee API
export const getFees = async (params = {}) => {
  const { category, isActive } = params
  const queryParams = new URLSearchParams()
  if (category) queryParams.append('category', category)
  if (isActive !== undefined) queryParams.append('isActive', isActive)
  
  const res = await get(`/api/business/admin/fees?${queryParams.toString()}`)
  return res?.data || []
}

export const getFee = async (id) => {
  const res = await get(`/api/business/admin/fees/${id}`)
  return res?.data
}

export const createFee = async (data, options = {}) => {
  const res = await post('/api/business/admin/fees', data, options)
  return res?.data
}

export const updateFee = async (id, data, options = {}) => {
  const res = await put(`/api/business/admin/fees/${id}`, data, options)
  return res?.data
}

export const disableFee = async (id, options = {}) => {
  const res = await del(`/api/business/admin/fees/${id}`, options)
  return res?.data
}

// Fee Group API
export const getFeeGroups = async (params = {}) => {
  const { isActive } = params
  const queryParams = new URLSearchParams()
  if (isActive !== undefined) queryParams.append('isActive', isActive)
  
  const res = await get(`/api/business/admin/fee-groups?${queryParams.toString()}`)
  return res?.data || []
}

export const getFeeGroup = async (id) => {
  const res = await get(`/api/business/admin/fee-groups/${id}`)
  return res?.data
}

export const createFeeGroup = async (data, options = {}) => {
  const res = await post('/api/business/admin/fee-groups', data, options)
  return res?.data
}

export const updateFeeGroup = async (id, data, options = {}) => {
  const res = await put(`/api/business/admin/fee-groups/${id}`, data, options)
  return res?.data
}

export const disableFeeGroup = async (id, options = {}) => {
  const res = await del(`/api/business/admin/fee-groups/${id}`, options)
  return res?.data
}

// Penalty Rule API
export const getPenaltyRules = async (params = {}) => {
  const { category, isActive } = params
  const queryParams = new URLSearchParams()
  if (category) queryParams.append('category', category)
  if (isActive !== undefined) queryParams.append('isActive', isActive)
  
  const res = await get(`/api/business/admin/penalty-rules?${queryParams.toString()}`)
  return res?.data || []
}

export const getPenaltyRule = async (id) => {
  const res = await get(`/api/business/admin/penalty-rules/${id}`)
  return res?.data
}

export const createPenaltyRule = async (data, options = {}) => {
  const res = await post('/api/business/admin/penalty-rules', data, options)
  return res?.data
}

export const updatePenaltyRule = async (id, data, options = {}) => {
  const res = await put(`/api/business/admin/penalty-rules/${id}`, data, options)
  return res?.data
}

export const disablePenaltyRule = async (id, options = {}) => {
  const res = await del(`/api/business/admin/penalty-rules/${id}`, options)
  return res?.data
}
