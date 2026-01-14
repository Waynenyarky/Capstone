import { getCurrentUser } from '@/features/authentication/lib/authEvents.js'
import { authHeaders } from './authHeaders.js'

export async function fetchWithFallback(path, options = {}) {
  const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_ORIGIN

  // Clone options so we don't mutate the caller's object
  const opts = { ...(options || {}) }

  // Merge and normalize headers
  const incomingHeaders = opts.headers || {}
  const headers = { ...incomingHeaders }

  // If no Authorization header provided, attach stored token (if any)
  const hasAuthHeader = Object.keys(headers).some((k) => k.toLowerCase() === 'authorization')
  try {
    if (!hasAuthHeader) {
      let current = getCurrentUser()
      
      // Fallback: try reading from storage if not in memory (e.g. on fresh page load)
      if (!current) {
        const LOCAL_KEY = 'auth__currentUser'
        const SESSION_KEY = 'auth__sessionUser'
        try {
          let raw = localStorage.getItem(LOCAL_KEY)
          if (!raw) raw = sessionStorage.getItem(SESSION_KEY)
          if (raw) {
            const parsed = JSON.parse(raw)
            // Handle { user, expiresAt } wrapper or direct user object
            current = parsed.user || parsed
          }
        } catch { /* ignore storage errors */ }
      }

      const token = current?.token
      if (token) headers['Authorization'] = `Bearer ${token}`
    }
  } catch { /* ignore errors reading storage */ }

  opts.headers = headers

  let res
  try {
    res = await fetch(path, opts)
  } catch {
    res = null
  }

  // Fallback when request fails, returns non-ok, or dev server blocks (e.g., 403)
  const shouldFallback = (!res || !res.ok) || (res && res.status === 403)
  if (shouldFallback && BACKEND_ORIGIN) {
    try {
      res = await fetch(`${BACKEND_ORIGIN}${path}`, opts)
    } catch {
      res = null
    }
  }

  return res
}

export async function fetchJsonWithFallback(path, options = {}) {
  const res = await fetchWithFallback(path, options)
  if (!res || !res.ok) {
    let errMsg = `Request failed: ${res?.status || 'network'}`
    try {
      const err = await res?.json()
      // Normalize common error response shapes into a string message
      let errorCode = null
      if (err) {
        if (typeof err.error === 'string') {
          errMsg = err.error
        } else if (typeof err.message === 'string') {
          errMsg = err.message
        } else if (err.error && typeof err.error.message === 'string') {
          errMsg = err.error.message
          // Extract error code from nested error structure (backend format: { ok: false, error: { code, message } })
          if (err.error.code) {
            errorCode = err.error.code
          }
        } else if (err.error && typeof err.error === 'object' && err.error.code) {
          // Also check if error is an object with code property
          errMsg = err.error.message || errMsg
          errorCode = err.error.code
        } else if (Array.isArray(err.errors) && err.errors.length > 0) {
          const first = err.errors[0]
          if (typeof first === 'string') errMsg = first
          else if (typeof first?.message === 'string') errMsg = first.message
        }
        // Check for code at top level
        if (!errorCode && err.code) errorCode = err.code
      }
      
      const errorObj = new Error(String(errMsg))
      if (err && err.details) errorObj.details = err.details
      if (errorCode) {
        errorObj.code = errorCode
      }
      // Store the original error for more detailed inspection
      if (err) {
        errorObj.originalError = err
        // Also try to extract code from originalError if not already set
        if (!errorObj.code && err.error && typeof err.error === 'object' && err.error.code) {
          errorObj.code = err.error.code
        }
      }
      throw errorObj
    } catch (e) {
      if (e.details) throw e // re-throw if it's the error we just created
      // ignore JSON parse errors and fall back to status text
    }
    throw new Error(String(errMsg))
  }
  return res.json()
}

export const get = (path, options) => fetchJsonWithFallback(path, { ...options, method: 'GET' })

export const post = (path, body, options) => fetchJsonWithFallback(path, { 
  ...options, 
  method: 'POST', 
  body: JSON.stringify(body),
  headers: {
    'Content-Type': 'application/json',
    ...options?.headers
  }
})

export const put = (path, body, options) => fetchJsonWithFallback(path, { 
  ...options, 
  method: 'PUT', 
  body: JSON.stringify(body),
  headers: {
    'Content-Type': 'application/json',
    ...options?.headers
  }
})

export const del = (path, options) => fetchJsonWithFallback(path, { ...options, method: 'DELETE' })

// Re-export shared header helper for convenience across feature services
export { authHeaders }