export async function fetchWithFallback(path, options = {}) {
  const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_ORIGIN

  let res
  try {
    res = await fetch(path, options)
  } catch {
    res = null
  }

  // Fallback when request fails, returns non-ok, or dev server blocks (e.g., 403)
  const shouldFallback = (!res || !res.ok) || (res && res.status === 403)
  if (shouldFallback && BACKEND_ORIGIN) {
    try {
      res = await fetch(`${BACKEND_ORIGIN}${path}`, options)
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
      if (err) {
        if (typeof err.error === 'string') {
          errMsg = err.error
        } else if (typeof err.message === 'string') {
          errMsg = err.message
        } else if (err.error && typeof err.error.message === 'string') {
          errMsg = err.error.message
        } else if (Array.isArray(err.errors) && err.errors.length > 0) {
          const first = err.errors[0]
          if (typeof first === 'string') errMsg = first
          else if (typeof first?.message === 'string') errMsg = first.message
        }
      }
    } catch {
      // ignore JSON parse errors and fall back to status text
    }
    throw new Error(String(errMsg))
  }
  return res.json()
}