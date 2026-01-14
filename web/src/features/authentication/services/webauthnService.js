import { fetchJsonWithFallback } from '@/lib/http.js'

export async function registerStart(payload) {
  return await fetchJsonWithFallback('/api/auth/webauthn/register/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function registerComplete(payload) {
  return await fetchJsonWithFallback('/api/auth/webauthn/register/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function authenticateStart(payload) {
  return await fetchJsonWithFallback('/api/auth/webauthn/authenticate/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function authenticateComplete(payload) {
  return await fetchJsonWithFallback('/api/auth/webauthn/authenticate/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function crossDeviceStart(payload) {
  return await fetchJsonWithFallback('/api/auth/webauthn/cross-device/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function crossDeviceAuthOptions(payload) {
  // payload can include { sessionId, type?: 'register' | 'authenticate' }
  return await fetchJsonWithFallback('/api/auth/webauthn/cross-device/auth-options', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function crossDeviceStatus(payload) {
  const { sessionId } = payload
  return await fetchJsonWithFallback(`/api/auth/webauthn/cross-device/status/${sessionId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function crossDeviceComplete(payload) {
  return await fetchJsonWithFallback('/api/auth/webauthn/cross-device/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

// Passkey credential management (requires authentication)
export async function listCredentials() {
  return await fetchJsonWithFallback('/api/auth/webauthn/credentials', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function deleteCredential(credId) {
  return await fetchJsonWithFallback(`/api/auth/webauthn/credentials/${encodeURIComponent(credId)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function deleteAllCredentials() {
  return await fetchJsonWithFallback('/api/auth/webauthn/credentials', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })
}

export default { 
  registerStart, 
  registerComplete, 
  authenticateStart, 
  authenticateComplete,
  crossDeviceStart,
  crossDeviceAuthOptions,
  crossDeviceStatus,
  crossDeviceComplete,
  listCredentials,
  deleteCredential,
  deleteAllCredentials
}
