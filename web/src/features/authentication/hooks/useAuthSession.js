import { useCallback, useEffect, useState, useRef } from 'react'
import {
  setIsLoggingOut,
  setCurrentUser as setAuthEventCurrentUser,
  getCurrentUser as getAuthEventCurrentUser,
  subscribeAuth,
} from "@/features/authentication/lib/authEvents.js"
import { getMe } from "@/features/authentication/services/authService.js"

const LOCAL_KEY = 'auth__currentUser'
const SESSION_KEY = 'auth__sessionUser'
const DEFAULT_TTL_MS = 2 * 60 * 60 * 1000 // 2 hours
const REMEMBER_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
const TOKEN_REFRESH_THRESHOLD_MS = 15 * 60 * 1000 // 15 minutes before expiration
const TOKEN_VALIDATION_INTERVAL_MS = 5 * 60 * 1000 // Check every 5 minutes

function readStored() {
  try {
    // Prefer remembered local storage (longer-lived)
    const localRaw = localStorage.getItem(LOCAL_KEY)
    if (localRaw) {
      const parsed = JSON.parse(localRaw)
      const user = parsed?.user ?? parsed // backward compat if plain user is stored
      const expiresAt = parsed?.expiresAt ?? 0
      if (!expiresAt || Date.now() < expiresAt) {
        return user
      }
      localStorage.removeItem(LOCAL_KEY)
    }
  } catch (err) { void err }
  try {
    // Then check session storage (shorter-lived, tab-bound)
    const sessionRaw = sessionStorage.getItem(SESSION_KEY)
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw)
      const user = parsed?.user ?? parsed
      const expiresAt = parsed?.expiresAt ?? 0
      if (!expiresAt || Date.now() < expiresAt) {
        return user
      }
      sessionStorage.removeItem(SESSION_KEY)
    }
  } catch (err) { void err }
  return null
}

function updateStoredUser(nextUser) {
  try {
    const localRaw = localStorage.getItem(LOCAL_KEY)
    if (localRaw) {
      const parsed = JSON.parse(localRaw)
      const expiresAt = parsed?.expiresAt ?? 0
      localStorage.setItem(LOCAL_KEY, JSON.stringify({ user: nextUser, expiresAt }))
      return
    }
  } catch { /* ignore */ }
  try {
    const sessionRaw = sessionStorage.getItem(SESSION_KEY)
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw)
      const expiresAt = parsed?.expiresAt ?? 0
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user: nextUser, expiresAt }))
      return
    }
  } catch { /* ignore */ }
}

export function useAuthSession() {
  const [currentUser, setCurrentUserState] = useState(() => {
    const fromAuthEvents = getAuthEventCurrentUser()
    if (fromAuthEvents) return fromAuthEvents
    // Initialize from storage on mount
    const fromStorage = readStored()
    return fromStorage
  })
  const [isLoading, setIsLoading] = useState(true)
  const validationIntervalRef = useRef(null)
  const currentUserRef = useRef(null)

  // Update ref when currentUser changes
  useEffect(() => {
    currentUserRef.current = currentUser
    setAuthEventCurrentUser(currentUser || null)
  }, [currentUser])

  // Keep all useAuthSession hook instances in sync (e.g., onboarding page and ProtectedRoute)
  useEffect(() => {
    const unsubscribe = subscribeAuth((user) => {
      setCurrentUserState(user || null)
    })
    return unsubscribe
  }, [])

  // Validate token with backend
  const validateToken = useCallback(async () => {
    const user = currentUserRef.current || readStored()
    if (!user?.token) return false

    try {
      // Use /api/auth/me endpoint to validate token (it requires JWT)
      const freshUser = await getMe()
      if (freshUser) {
        const nextUser = { ...freshUser }
        // Preserve token if backend doesn't return one
        if (user?.token && !nextUser.token) {
          nextUser.token = user.token
        }
        setCurrentUserState(nextUser)
        updateStoredUser(nextUser)
        setAuthEventCurrentUser(nextUser)
      }
      return true
    } catch (err) {
      // Token is invalid (401) or other error
      if (err?.status === 401 || err?.code === 'unauthorized') {
        // Clear invalid token
        setCurrentUserState(null)
        setAuthEventCurrentUser(null)
        try {
          localStorage.removeItem(LOCAL_KEY)
          sessionStorage.removeItem(SESSION_KEY)
        } catch { /* ignore */ }
        return false
      }
      // Other errors (network, etc.) - don't clear token
      return true
    }
  }, [])

  // Check if token needs refresh (expiring soon)
  const checkTokenExpiration = useCallback(() => {
    const user = currentUserRef.current || readStored()
    if (!user?.token) return false

    try {
      // Try to get expiration from stored data
      let expiresAt = null
      try {
        const localRaw = localStorage.getItem(LOCAL_KEY)
        if (localRaw) {
          const parsed = JSON.parse(localRaw)
          expiresAt = parsed?.expiresAt || null
        } else {
          const sessionRaw = sessionStorage.getItem(SESSION_KEY)
          if (sessionRaw) {
            const parsed = JSON.parse(sessionRaw)
            expiresAt = parsed?.expiresAt || null
          }
        }
      } catch { /* ignore */ }

      if (expiresAt) {
        const timeUntilExpiration = expiresAt - Date.now()
        // If token expires within refresh threshold, validate it
        if (timeUntilExpiration > 0 && timeUntilExpiration < TOKEN_REFRESH_THRESHOLD_MS) {
          // Token is expiring soon, validate it
          validateToken()
        }
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    // Validate token on app load with fail-safe timeout
    const initialValidation = async () => {
      const user = currentUserRef.current || readStored()
      if (user?.token) {
        // Fail-safe: if validation takes too long, render with the stored user
        const timeout = setTimeout(() => { setIsLoading(false) }, 6000)
        try {
          await validateToken()
          checkTokenExpiration()
        } catch { /* ignore – stored user will be used */ }
        clearTimeout(timeout)
      }
      setIsLoading(false)
    }
    initialValidation()

    // Set up periodic token validation
    validationIntervalRef.current = setInterval(() => {
      const user = currentUserRef.current || readStored()
      if (user?.token) {
        checkTokenExpiration()
        // Periodically validate token (less frequent than expiration check)
        if (Math.random() < 0.2) { // 20% chance each interval to reduce server load
          validateToken()
        }
      }
    }, TOKEN_VALIDATION_INTERVAL_MS)

    return () => {
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current)
      }
    }
  }, [])

  const login = useCallback((user, options = {}) => {
    const remember = options.remember === true
    const ttl = remember ? REMEMBER_TTL_MS : DEFAULT_TTL_MS
    const expiresAt = Date.now() + ttl
    setCurrentUserState(user)
    setAuthEventCurrentUser(user || null)
    try {
      if (remember) {
        localStorage.setItem(LOCAL_KEY, JSON.stringify({ user, expiresAt }))
        sessionStorage.removeItem(SESSION_KEY)
      } else {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user, expiresAt }))
        localStorage.removeItem(LOCAL_KEY)
      }
    } catch (err) { void err }
  }, [])

  const logout = useCallback(() => {
    setIsLoggingOut(true)
    setCurrentUserState(null)
    setAuthEventCurrentUser(null)
    try {
      localStorage.removeItem(LOCAL_KEY)
      sessionStorage.removeItem(SESSION_KEY)
    } catch (err) { void err }
    setTimeout(() => setIsLoggingOut(false), 0)
  }, [])

  const role = currentUser?.role
  const roleSlug = String(role?.slug || role || '').toLowerCase()

  return { currentUser, role, roleSlug, login, logout, isLoading }
}
