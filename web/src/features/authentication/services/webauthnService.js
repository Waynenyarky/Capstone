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

export default { registerStart, registerComplete, authenticateStart, authenticateComplete }
