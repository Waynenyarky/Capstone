import { fetchJsonWithFallback} from "@/lib/http.js"

export async function mfaSetup(email) {
  return await fetchJsonWithFallback('/api/auth/mfa/setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-email': String(email || '') },
    body: JSON.stringify({ method: 'authenticator' }),
  })
}

export async function mfaVerify(email, code) {
  return await fetchJsonWithFallback('/api/auth/mfa/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-email': String(email || '') },
    body: JSON.stringify({ code }),
  })
}

export async function mfaDisable(email) {
  return await fetchJsonWithFallback('/api/auth/mfa/disable', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-email': String(email || '') },
  })
}

export async function mfaDisableRequest(email) {
  return await fetchJsonWithFallback('/api/auth/mfa/disable-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-email': String(email || '') },
  })
}

export async function mfaDisableUndo(email, code) {
  return await fetchJsonWithFallback('/api/auth/mfa/disable-undo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-email': String(email || '') },
    body: JSON.stringify({ code }),
  })
}

export async function mfaStatus(email) {
  return await fetchJsonWithFallback('/api/auth/mfa/status', {
    method: 'GET',
    headers: { 'x-user-email': String(email || '') },
  })
}

export default { mfaSetup, mfaVerify, mfaDisable, mfaStatus }
