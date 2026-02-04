import { fetchJsonWithFallback } from '@/lib/http.js'

// Admin endpoints (require authentication)

export async function getFormGroups(params = {}) {
  const query = new URLSearchParams()
  if (params.formType) query.set('formType', params.formType)
  if (params.industryScope) query.set('industryScope', params.industryScope)
  if (params.search) query.set('search', params.search)
  if (params.page) query.set('page', params.page)
  if (params.limit) query.set('limit', params.limit)
  if (params.includeRetired) query.set('includeRetired', params.includeRetired)

  const queryString = query.toString()
  const url = `/api/admin/forms/groups${queryString ? `?${queryString}` : ''}`
  return await fetchJsonWithFallback(url, { method: 'GET' })
}

export async function getFormGroupStats() {
  return await fetchJsonWithFallback('/api/admin/forms/groups/stats', { method: 'GET' })
}

export async function getFormDefinitionsAuditLog(params = {}) {
  const query = new URLSearchParams()
  if (params.limit) query.set('limit', params.limit)
  const queryString = query.toString()
  const url = `/api/admin/forms/audit-log${queryString ? `?${queryString}` : ''}`
  return await fetchJsonWithFallback(url, { method: 'GET' })
}

export async function getFormGroup(groupId) {
  return await fetchJsonWithFallback(`/api/admin/forms/groups/${groupId}`, { method: 'GET' })
}

export async function createFormGroup(data) {
  return await fetchJsonWithFallback('/api/admin/forms/groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function getFormGroupVersions(groupId) {
  return await fetchJsonWithFallback(`/api/admin/forms/groups/${groupId}/versions`, { method: 'GET' })
}

export async function createFormGroupVersion(groupId) {
  return await fetchJsonWithFallback(`/api/admin/forms/groups/${groupId}/versions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
}

export async function setFormVersionActive(definitionId) {
  return await fetchJsonWithFallback(`/api/admin/forms/${definitionId}/set-active`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
}

export async function retireFormGroup(groupId) {
  return await fetchJsonWithFallback(`/api/admin/forms/groups/${groupId}/retire`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
}

export async function deactivateFormGroup(groupId, { deactivatedUntil, reason = '' }) {
  return await fetchJsonWithFallback(`/api/admin/forms/groups/${groupId}/deactivate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deactivatedUntil, reason }),
  })
}

export async function reactivateFormGroup(groupId) {
  return await fetchJsonWithFallback(`/api/admin/forms/groups/${groupId}/reactivate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
}

export async function getFormDefinitions(params = {}) {
  const query = new URLSearchParams()
  if (params.formType) query.set('formType', params.formType)
  if (params.status) query.set('status', params.status)
  if (params.search) query.set('search', params.search)
  if (params.page) query.set('page', params.page)
  if (params.limit) query.set('limit', params.limit)

  const queryString = query.toString()
  const url = `/api/admin/forms${queryString ? `?${queryString}` : ''}`
  return await fetchJsonWithFallback(url, { method: 'GET' })
}

export async function getFormDefinition(id) {
  return await fetchJsonWithFallback(`/api/admin/forms/${id}`, { method: 'GET' })
}

export async function createFormDefinition(data) {
  return await fetchJsonWithFallback('/api/admin/forms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function updateFormDefinition(id, data) {
  return await fetchJsonWithFallback(`/api/admin/forms/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function deleteFormDefinition(id) {
  return await fetchJsonWithFallback(`/api/admin/forms/${id}`, {
    method: 'DELETE',
  })
}

export async function archiveFormDefinition(id) {
  return await fetchJsonWithFallback(`/api/admin/forms/${id}/archive`, {
    method: 'POST',
  })
}

export async function duplicateFormDefinition(id) {
  return await fetchJsonWithFallback(`/api/admin/forms/${id}/duplicate`, {
    method: 'POST',
  })
}

export async function submitForApproval(id) {
  return await fetchJsonWithFallback(`/api/admin/forms/${id}/submit-for-approval`, {
    method: 'POST',
  })
}

export async function cancelApproval(id) {
  return await fetchJsonWithFallback(`/api/admin/forms/${id}/cancel-approval`, {
    method: 'POST',
  })
}

export async function uploadFormTemplate(id, file, label = '') {
  const formData = new FormData()
  formData.append('file', file)
  if (label) formData.append('label', label)

  return await fetchJsonWithFallback(`/api/admin/forms/${id}/upload`, {
    method: 'POST',
    body: formData,
  })
}

export async function removeFormDownload(id, downloadIndex) {
  return await fetchJsonWithFallback(`/api/admin/forms/${id}/downloads/${downloadIndex}`, {
    method: 'DELETE',
  })
}

// Public endpoints
export async function getActiveFormDefinition(type, businessType, lgu) {
  const query = new URLSearchParams()
  query.set('type', type)
  if (businessType) query.set('businessType', businessType)
  if (lgu) query.set('lgu', lgu)

  return await fetchJsonWithFallback(`/api/forms/active?${query.toString()}`, { method: 'GET' })
}

export async function getPublicFormDefinition(id) {
  return await fetchJsonWithFallback(`/api/forms/${id}`, { method: 'GET' })
}
