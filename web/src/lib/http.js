import { getCurrentUser, setCurrentUser } from '@/features/authentication/lib/authEvents.js'
import { authHeaders } from './authHeaders.js'

const MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']
let authCsrfTokenCache = null

/** Get CSRF token for auth API (double-submit cookie). Uses cache; refetches on 403 csrf_invalid. */
async function getAuthCsrfToken(authBaseUrl) {
  if (authCsrfTokenCache) return authCsrfTokenCache
  const base = (authBaseUrl || '').replace(/\/$/, '')
  const url = base ? `${base}/api/auth/csrf-token` : '/api/auth/csrf-token'
  const res = await fetch(url, { method: 'GET', credentials: 'include' })
  if (!res.ok) throw new Error('Failed to get security token')
  const data = await res.json()
  const token = data?.csrfToken
  if (!token) throw new Error('Invalid security token response')
  authCsrfTokenCache = token
  return token
}

/** Clear cached CSRF token (e.g. after 403 csrf_invalid so next request refetches). */
export function clearAuthCsrfToken() {
  authCsrfTokenCache = null
}

// In production build, pick the correct backend origin per path (auth=3001, business=3002, admin/maintenance=3003, audit=3004).
function getProductionApiOrigin(path) {
  const env = import.meta.env || {}
  const auth = env.VITE_BACKEND_ORIGIN || env.VITE_AUTH_ORIGIN || 'http://localhost:3001'
  if (!auth) return null
  const admin = env.VITE_ADMIN_ORIGIN
  const business = env.VITE_BUSINESS_ORIGIN
  const audit = env.VITE_AUDIT_ORIGIN
  // Derive admin/business/audit from auth origin if not set (e.g. http://localhost:3001 -> 3003, 3002, 3004)
  const base = auth.replace(/:\d+(\/?)$/, '')
  const adminOrigin = admin || `${base}:3003`
  const businessOrigin = business || `${base}:3002`
  const auditOrigin = audit || `${base}:3004`
  const authOrigin = auth.replace(/\/$/, '')
  if (path.startsWith('/api/admin') || path.startsWith('/api/maintenance') || path.startsWith('/api/lgu-officer') || path.startsWith('/api/lgus') || path.startsWith('/api/forms')) return adminOrigin
  if (path.startsWith('/api/business')) return businessOrigin
  if (path.startsWith('/api/audit')) return auditOrigin
  return authOrigin
}

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

  // In production build (e.g. preview on 4173), there is no Vite proxy — use the correct backend origin per path.
  const isProductionBuild = import.meta.env.PROD === true
  const pathStr = path.startsWith('/') ? path : `/${path}`
  const origin = isProductionBuild && path.startsWith('/api') ? getProductionApiOrigin(path) : null
  const apiUrl = origin ? `${origin.replace(/\/$/, '')}${pathStr}` : path

  // CSRF: for mutating auth requests (except csrf-token), fetch token and send header; send cookies so double-submit works.
  const isMutating = MUTATING_METHODS.includes((opts.method || 'GET').toUpperCase())
  const isAuthPath = path.startsWith('/api/auth') && !path.includes('/api/auth/csrf-token')
  if (isMutating && isAuthPath) {
    opts.credentials = opts.credentials ?? 'include'
    try {
      const authBase = origin || (isProductionBuild && path.startsWith('/api') ? getProductionApiOrigin('/api/auth/login/start') : '')
      const csrfToken = await getAuthCsrfToken(authBase)
      headers['X-CSRF-Token'] = csrfToken
    } catch (_) {
      // Proceed without token; backend will return 403 and we map to generic message
    }
  }
  opts.headers = headers

  let res
  try {
    res = await fetch(apiUrl, opts)
  } catch {
    res = null
  }

  // Fallback when request fails (e.g. dev server not proxying)
  const isAuthEndpoint = path.includes('/login') || path.includes('/signup') || path.includes('/sign-up') || path.includes('/forgot-password')
  const isAdminOrMaintenanceApi = path.includes('/api/admin') || path.includes('/api/maintenance')
  const has4xxResponse = res && res.status >= 400 && res.status < 500
  const fallbackOrigin = isProductionBuild && path.startsWith('/api') ? getProductionApiOrigin(path) : BACKEND_ORIGIN
  const shouldFallback = (!res || !res.ok) && !has4xxResponse && !(isAuthEndpoint && res?.status === 500) && !isAdminOrMaintenanceApi && fallbackOrigin && apiUrl !== `${fallbackOrigin.replace(/\/$/, '')}${pathStr}`

  if (shouldFallback) {
    try {
      res = await fetch(`${fallbackOrigin.replace(/\/$/, '')}${pathStr}`, opts)
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
        }
        // Backend validation: error.details is array of { message, path }
        const details = err?.error?.details ?? err?.details
        if (Array.isArray(details) && details.length > 0) {
          const first = details[0]
          const detailMsg = typeof first === 'string' ? first : first?.message
          if (detailMsg && (errorCode === 'validation_error' || res?.status === 400)) {
            errMsg = detailMsg
          }
        }
        if (Array.isArray(err.errors) && err.errors.length > 0 && !errMsg) {
          const first = err.errors[0]
          if (typeof first === 'string') errMsg = first
          else if (typeof first?.message === 'string') errMsg = first.message
        }
        // Check for code at top level
        if (!errorCode && err.code) errorCode = err.code
      }

      // On CSRF 403, clear cached token so next request refetches; never surface raw CSRF message to user
      if (statusCode === 403 && errorCode === 'csrf_invalid') {
        clearAuthCsrfToken()
      }

      // Map error codes to user-friendly messages (never expose internal security details like CSRF)
      const codeMap = {
        'csrf_invalid': 'Request could not be completed. Please refresh the page and try again.',
        'forgot_password_not_available': 'Password reset is not available for your account type. If you are staff, use Request Recovery from the staff portal. If you are an administrator, contact another administrator.',
        'invalid_code': 'Incorrect verification code. Please check the code and try again.',
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

      // Login endpoints: never expose validation details (password length, email format, etc.) — show generic invalid credentials only.
      const isLoginPath = path.includes('/login')
      if (isLoginPath && (statusCode === 400 || statusCode === 422 || errorCode === 'validation_error')) {
        errMsg = 'The email address or password you entered is incorrect. Please check your credentials and try again.'
        errorCode = 'invalid_credentials'
      }
      
      // For 401 errors on login endpoints, assume invalid credentials if not already handled
      if (statusCode === 401 && isLoginPath) {
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
      const errDetails = err?.error?.details ?? err?.details
      if (errDetails) errorObj.details = errDetails
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

export const patch = (path, body, options) => fetchJsonWithFallback(path, {
  ...options,
  method: 'PATCH',
  body: JSON.stringify(body),
  headers: {
    'Content-Type': 'application/json',
    ...options?.headers
  }
})

// Re-export shared header helper for convenience across feature services
export { authHeaders }