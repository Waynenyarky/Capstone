import { useState, useEffect } from 'react'
import { listCredentials } from '@/features/authentication/services/webauthnService.js'

export function usePasskeyStatus(currentUser) {
  const [passkeyEnabled, setPasskeyEnabled] = useState(false)
  const [passkeyLoading, setPasskeyLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const checkPasskeyStatus = async () => {
      if (!currentUser?.email) {
        setPasskeyLoading(false)
        return
      }
      try {
        const mfaMethod = String(currentUser?.mfaMethod || '').toLowerCase()
        const isPasskeyMethod = mfaMethod === 'passkey'
        if (isPasskeyMethod) {
          setPasskeyEnabled(true)
          setPasskeyLoading(false)
        } else {
          try {
            const response = await listCredentials()
            if (mounted) {
              setPasskeyEnabled((response.credentials || []).length > 0)
              setPasskeyLoading(false)
            }
          } catch {
            if (mounted) {
              setPasskeyEnabled(false)
              setPasskeyLoading(false)
            }
          }
        }
      } catch {
        if (mounted) {
          setPasskeyEnabled(false)
          setPasskeyLoading(false)
        }
      }
    }
    checkPasskeyStatus()
    return () => { mounted = false }
  }, [currentUser?.email, currentUser?.mfaMethod])

  return { passkeyEnabled, passkeyLoading }
}
