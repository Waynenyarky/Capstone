import { useCallback, useMemo } from 'react'

const EMAIL_KEY = 'auth__rememberedEmail'

export function useRememberedEmail() {
  const initialEmail = useMemo(() => {
    try {
      return localStorage.getItem(EMAIL_KEY) || ''
    } catch {
      return ''
    }
  }, [])

  const rememberEmail = useCallback((email) => {
    try { localStorage.setItem(EMAIL_KEY, String(email || '')) } catch (err) { void err }
  }, [])

  const clearRememberedEmail = useCallback(() => {
    try { localStorage.removeItem(EMAIL_KEY) } catch (err) { void err }
  }, [])

  return { initialEmail, rememberEmail, clearRememberedEmail }
}