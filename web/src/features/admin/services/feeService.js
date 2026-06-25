import { get, post, put, del, fetchJsonWithFallback } from '@/lib/http.js'
import { authHeaders } from '@/lib/authHeaders.js'
import { getCurrentUser } from '@/features/authentication/lib/authEvents.js'

// Fee API
export const getFees = async (params = {}) => {
  const { category, isActive, includeDrafts } = params
  const queryParams = new URLSearchParams()
  if (category) queryParams.append('category', category)
  if (isActive !== undefined) queryParams.append('isActive', isActive)
  if (includeDrafts) queryParams.append('includeDrafts', 'true')
  
  const res = await get(`/api/business/admin/fees?${queryParams.toString()}`)
  return res?.data || []
}

export const getFee = async (id) => {
  const res = await get(`/api/business/admin/fees/${id}`)
  return res?.data
}

export const getFeeDraft = async (id) => {
  const res = await get(`/api/business/admin/fees/${id}/draft`)
  return res?.data
}

export const saveFeeDraft = async (id, data, options = {}) => {
  const res = await post(`/api/business/admin/fees/${id}/draft`, data, options)
  return res?.data
}

export const publishFeeDraft = async (id, options = {}) => {
  const current = getCurrentUser()
  const headers = authHeaders(current, 'admin', {
    'Content-Type': 'application/json',
    ...(options.stepUpToken && { stepUpToken: options.stepUpToken }),
  })
  const res = await fetchJsonWithFallback(`/api/business/admin/fees/${id}/publish`, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  })
  return res?.data
}

export const createFee = async (data, options = {}) => {
  const current = getCurrentUser()
  const headers = authHeaders(current, 'admin', {
    'Content-Type': 'application/json',
    ...(options.stepUpToken && { stepUpToken: options.stepUpToken }),
  })
  const res = await fetchJsonWithFallback('/api/business/admin/fees', {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })
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
  const { isActive, includeDrafts } = params
  const queryParams = new URLSearchParams()
  if (isActive !== undefined) queryParams.append('isActive', isActive)
  if (includeDrafts) queryParams.append('includeDrafts', 'true')
  
  const res = await get(`/api/business/admin/fee-groups?${queryParams.toString()}`)
  return res?.data || []
}

export const getFeeGroup = async (id) => {
  const res = await get(`/api/business/admin/fee-groups/${id}`)
  return res?.data
}

export const getFeeGroupDraft = async (id) => {
  const res = await get(`/api/business/admin/fee-groups/${id}/draft`)
  return res?.data
}

export const saveFeeGroupDraft = async (id, data, options = {}) => {
  const res = await post(`/api/business/admin/fee-groups/${id}/draft`, data, options)
  return res?.data
}

export const publishFeeGroupDraft = async (id, options = {}) => {
  const current = getCurrentUser()
  const headers = authHeaders(current, 'admin', {
    'Content-Type': 'application/json',
    ...(options.stepUpToken && { stepUpToken: options.stepUpToken }),
  })
  const res = await fetchJsonWithFallback(`/api/business/admin/fee-groups/${id}/publish`, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  })
  return res?.data
}

export const createFeeGroup = async (data, options = {}) => {
  const current = getCurrentUser()
  const headers = authHeaders(current, 'admin', {
    'Content-Type': 'application/json',
    ...(options.stepUpToken && { stepUpToken: options.stepUpToken }),
  })
  const res = await fetchJsonWithFallback('/api/business/admin/fee-groups', {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })
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
  const { category, isActive, includeDrafts } = params
  const queryParams = new URLSearchParams()
  if (category) queryParams.append('category', category)
  if (isActive !== undefined) queryParams.append('isActive', isActive)
  if (includeDrafts) queryParams.append('includeDrafts', 'true')
  
  const res = await get(`/api/business/admin/penalty-rules?${queryParams.toString()}`)
  return res?.data || []
}

export const getPenaltyRule = async (id) => {
  const res = await get(`/api/business/admin/penalty-rules/${id}`)
  return res?.data
}

export const getPenaltyRuleDraft = async (id) => {
  const res = await get(`/api/business/admin/penalty-rules/${id}/draft`)
  return res?.data
}

export const savePenaltyRuleDraft = async (id, data, options = {}) => {
  const res = await post(`/api/business/admin/penalty-rules/${id}/draft`, data, options)
  return res?.data
}

export const publishPenaltyRuleDraft = async (id, options = {}) => {
  const current = getCurrentUser()
  const headers = authHeaders(current, 'admin', {
    'Content-Type': 'application/json',
    ...(options.stepUpToken && { stepUpToken: options.stepUpToken }),
  })
  const res = await fetchJsonWithFallback(`/api/business/admin/penalty-rules/${id}/publish`, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  })
  return res?.data
}

export const createPenaltyRule = async (data, options = {}) => {
  const current = getCurrentUser()
  const headers = authHeaders(current, 'admin', {
    'Content-Type': 'application/json',
    ...(options.stepUpToken && { stepUpToken: options.stepUpToken }),
  })
  const res = await fetchJsonWithFallback('/api/business/admin/penalty-rules', {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })
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

// Audit History API
export const getFeeAuditHistory = async (id, params = {}) => {
  const { page = 1, limit = 20 } = params
  const res = await get(`/api/business/admin/fees/${id}/audit?page=${page}&limit=${limit}`)
  return res?.logs || []
}

export const getFeeGroupAuditHistory = async (id, params = {}) => {
  const { page = 1, limit = 20 } = params
  const res = await get(`/api/business/admin/fee-groups/${id}/audit?page=${page}&limit=${limit}`)
  return res?.logs || []
}

export const getPenaltyRuleAuditHistory = async (id, params = {}) => {
  const { page = 1, limit = 20 } = params
  const res = await get(`/api/business/admin/penalty-rules/${id}/audit?page=${page}&limit=${limit}`)
  return res?.logs || []
}
