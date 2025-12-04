import { fetchJsonWithFallback } from '@/lib/http.js'
import { authHeaders } from '@/lib/authHeaders.js'

export async function listAddresses(currentUser, role) {
  const headers = authHeaders(currentUser, role)
  return fetchJsonWithFallback('/api/customer-addresses', { headers })
}

export async function getActiveAddress(currentUser, role) {
  const headers = authHeaders(currentUser, role)
  return fetchJsonWithFallback('/api/customer-addresses/active', { headers })
}

export async function createAddress(payload, currentUser, role) {
  const headers = authHeaders(currentUser, role, { 'Content-Type': 'application/json' })
  return fetchJsonWithFallback('/api/customer-addresses', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
}

export async function updateAddress(id, payload, currentUser, role) {
  const headers = authHeaders(currentUser, role, { 'Content-Type': 'application/json' })
  return fetchJsonWithFallback(`/api/customer-addresses/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(payload),
  })
}

export async function deleteAddress(id, currentUser, role) {
  const headers = authHeaders(currentUser, role)
  return fetchJsonWithFallback(`/api/customer-addresses/${id}`, {
    method: 'DELETE',
    headers,
  })
}

export async function setPrimaryAddress(id, currentUser, role) {
  const headers = authHeaders(currentUser, role)
  return fetchJsonWithFallback(`/api/customer-addresses/${id}/set-primary`, {
    method: 'PATCH',
    headers,
  })
}