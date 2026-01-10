import { fetchJsonWithFallback, fetchWithFallback } from "@/lib/http.js"
import { authHeaders } from '@/lib/authHeaders.js'
import { getCurrentUser } from '@/features/authentication/lib/authEvents.js'

/**
 * Authentication service layer — centralizes HTTP calls used by
 * forms, hooks, and multi-step flows within the authentication feature.
 */

// Sign up (customer/provider)
export async function signupStart(payload) {
  return await fetchJsonWithFallback('/api/auth/signup/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function signup(payload) {
  return await fetchJsonWithFallback('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function verifySignupCode(payload) {
  return await fetchJsonWithFallback('/api/auth/signup/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function resendSignupCode(payload) {
  return await fetchJsonWithFallback('/api/auth/signup/resend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

// Login
export async function loginStart(payload) {
  return await fetchJsonWithFallback('/api/auth/login/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function loginPost(payload) {
  return await fetchJsonWithFallback('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function verifyLoginCode(payload) {
  return await fetchJsonWithFallback('/api/auth/login/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function verifyLoginTotp(payload) {
  return await fetchJsonWithFallback('/api/auth/login/verify-totp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

// Admin login (two-step) — reuse standard login endpoints
export async function adminLoginStart(payload) {
  const res = await fetchWithFallback('/api/auth/login/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res || !res.ok) {
    let body = null
    try { body = await res.json() } catch { /* ignore */ }
    return Promise.reject({ status: res?.status || 0, body })
  }
  return res.json()
}

export async function adminVerifyLoginCode(payload) {
  const res = await fetchWithFallback('/api/auth/login/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res || !res.ok) {
    let body = null
    try { body = await res.json() } catch { /* ignore */ }
    return Promise.reject({ status: res?.status || 0, body })
  }
  return res.json()
}

// Password reset
export async function sendForgotPassword(payload) {
  return await fetchJsonWithFallback('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function verifyResetCode(payload) {
  // Return Response to allow callers to inspect status codes
  return await fetchWithFallback('/api/auth/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function changePassword(payload) {
  return await fetchJsonWithFallback('/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

// Change password for an authenticated user by verifying current password
export async function changePasswordAuthenticated(payload) {
  const current = getCurrentUser()
  const headers = authHeaders(current, null, { 'Content-Type': 'application/json' })
  return await fetchJsonWithFallback('/api/auth/change-password-authenticated', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
}

export async function changeEmail(payload) {
  return await fetchJsonWithFallback('/api/auth/change-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

// Start change email flow (send OTP to the new email)
export async function changeEmailStart(payload) {
  const current = getCurrentUser()
  const headers = authHeaders(current, null, { 'Content-Type': 'application/json' })
  return await fetchJsonWithFallback('/api/auth/change-email/start', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
}

// Verify the OTP sent to the new email and finalize change
export async function changeEmailVerify(payload) {
  const current = getCurrentUser()
  const headers = authHeaders(current, null, { 'Content-Type': 'application/json' })
  return await fetchJsonWithFallback('/api/auth/change-email/verify', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
}

// Send OTP to current email to confirm identity before allowing change
export async function changeEmailConfirmStart(payload) {
  const current = getCurrentUser()
  const headers = authHeaders(current, null, { 'Content-Type': 'application/json' })
  return await fetchJsonWithFallback('/api/auth/change-email/confirm/start', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
}

// Verify OTP sent to current email
export async function changeEmailConfirmVerify(payload) {
  const current = getCurrentUser()
  const headers = authHeaders(current, null, { 'Content-Type': 'application/json' })
  return await fetchJsonWithFallback('/api/auth/change-email/confirm/verify', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
}

export async function getProfile() {
  const current = getCurrentUser()
  const headers = authHeaders(current, null, { 'Content-Type': 'application/json' })
  return await fetchJsonWithFallback('/api/auth/me', {
    method: 'GET',
    headers,
  })
}
