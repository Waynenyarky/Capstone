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
    let errorCode = null
    let statusCode = res?.status
    
    // Handle 401 Unauthorized - session invalidated (e.g., after password change)
    if (statusCode === 401) {
      try {
        const err = await res?.json()
        const errMsgLower = String(err?.error?.message || err?.message || '').toLowerCase()
        
        // Check if this is a session invalidation error
        // Skip auto-logout for login/signup endpoints to avoid redirect loops
        const isAuthEndpoint = path.includes('/login') || path.includes('/signup') || path.includes('/sign-up') || path.includes('/forgot-password')
        
        if (!isAuthEndpoint && (errMsgLower.includes('session') && errMsgLower.includes('invalidated'))) {
          // Import auth functions dynamically to avoid circular dependencies
          const { setCurrentUser } = await import('@/features/authentication/lib/authEvents.js')
          
          // Clear user session
          setCurrentUser(null)
          try {
            localStorage.removeItem('auth__currentUser')
            sessionStorage.removeItem('auth__sessionUser')
          } catch { /* ignore */ }
          
          // Redirect to login after a short delay to allow error to propagate
          setTimeout(() => {
            if (window.location.pathname !== '/login' && window.location.pathname !== '/sign-up') {
              window.location.href = '/login?reason=session_invalidated'
            }
          }, 100)
        }
      } catch { /* ignore JSON parse errors */ }
    }
    
    try {
      const err = await res?.json()
      // Normalize common error response shapes into a string message
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
      
      // Map error codes to user-friendly messages
      const codeMap = {
        'invalid_credentials': 'The email address or password you entered is incorrect. Please check your credentials and try again.',
        'webauthn_verification_failed': 'Passkey verification failed. Please try again.',
        'webauthn_verification_exception': 'Registration failed. Please try again.',
        'webauthn_auth_failed': 'Authentication failed. Please try again.',
        'webauthn_invalid_publickey': 'Invalid passkey format. Please try again.',
        'credential_not_found': 'Passkey not found. Please register a passkey first.',
        'session_not_found': 'Session expired. Please scan the QR code again.',
        'session_expired': 'Session expired. Please scan the QR code again.',
        'challenge_missing': 'Session error. Please scan the QR code again.',
        'cross_device_complete_failed': 'Failed to complete authentication. Please try again.',
      }
      
      if (errorCode && codeMap[errorCode]) {
        errMsg = codeMap[errorCode]
      }
      
      // For 401 errors on login endpoints, assume invalid credentials if not already handled
      if (statusCode === 401 && path.includes('/login')) {
        // If we have an error code, use the mapped message
        if (errorCode && codeMap[errorCode]) {
          errMsg = codeMap[errorCode]
        } else if (!errorCode || errMsg.toLowerCase().includes('request failed')) {
          // No error code or generic message - assume invalid credentials
          errMsg = 'The email address or password you entered is incorrect. Please check your credentials and try again.'
          errorCode = 'invalid_credentials'
        }
      }
      
      // Ensure error message is never "Something went wrong"
      if (errMsg.toLowerCase().includes('something went wrong')) {
        // Try to extract a better message from the error structure
        if (err?.error?.message && !err.error.message.toLowerCase().includes('request failed')) {
          errMsg = err.error.message
        } else if (errorCode && codeMap[errorCode]) {
          errMsg = codeMap[errorCode]
        } else if (!errorCode) {
          errMsg = `Request failed: ${res?.status || 'network'}`
        }
      }
      
      const errorObj = new Error(String(errMsg))
      if (err && err.details) errorObj.details = err.details
      if (errorCode) {
        errorObj.code = errorCode
      }
      // Store status code and original error for more detailed inspection
      if (statusCode) {
        errorObj.status = statusCode
      }
      if (err) {
        errorObj.originalError = { ...err, status: statusCode }
        // Also try to extract code from originalError if not already set
        if (!errorObj.code && err.error && typeof err.error === 'object' && err.error.code) {
          errorObj.code = err.error.code
        }
      }
      throw errorObj
    } catch (e) {
      if (e.details || e.code || e.status) throw e // re-throw if it's the error we just created
      // If JSON parsing failed, create error with status code
      const errorObj = new Error(String(errMsg))
      if (statusCode) {
        errorObj.status = statusCode
        errorObj.code = statusCode === 404 ? 'not_found' : statusCode === 400 ? 'bad_request' : null
      }
      throw errorObj
    }
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