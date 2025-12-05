import { useCallback, useEffect, useState } from 'react'
import { getCurrentUser, setCurrentUser, subscribeAuth } from "@/features/authentication/lib/authEvents.js"

const LOCAL_KEY = 'auth__currentUser'
const SESSION_KEY = 'auth__sessionUser'
const DEFAULT_TTL_MS = 2 * 60 * 60 * 1000 // 2 hours
const REMEMBER_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

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

export function useAuthSession() {
  const [currentUser, setUserState] = useState(getCurrentUser() || readStored())

  useEffect(() => {
    // If we loaded from storage but event bus wasn't set, sync it
    const existing = getCurrentUser()
    if (!existing) {
      const fromStorage = readStored()
      if (fromStorage) setCurrentUser(fromStorage)
    }

    const unsubscribe = subscribeAuth(setUserState)
    return unsubscribe
  }, [])

  const login = useCallback((user, options = {}) => {
    const remember = options.remember === true
    const ttl = remember ? REMEMBER_TTL_MS : DEFAULT_TTL_MS
    const expiresAt = Date.now() + ttl
    setCurrentUser(user)
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
    setCurrentUser(null)
    try {
      localStorage.removeItem(LOCAL_KEY)
      sessionStorage.removeItem(SESSION_KEY)
    } catch (err) { void err }
  }, [])

  const role = currentUser?.role

  return { currentUser, role, login, logout }
}