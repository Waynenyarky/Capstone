import { fetchJsonWithFallback, fetchWithFallback } from "@/lib/http.js"

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

export async function changeEmail(payload) {
  return await fetchJsonWithFallback('/api/auth/change-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}