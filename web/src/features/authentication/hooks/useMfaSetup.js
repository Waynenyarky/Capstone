import React from 'react'
import { useAuthSession } from './useAuthSession.js'
import { mfaSetup, mfaVerify, mfaStatus, mfaDisable } from '@/features/authentication/services/mfaService'
import { useNotifier } from '@/shared/notifications'

// Hook that encapsulates MFA setup/verify/disable logic for the MfaSetup page
export default function useMfaSetup() {
  const { currentUser } = useAuthSession()
  const email = currentUser?.email
  const { success, error } = useNotifier()

  const [loading, setLoading] = React.useState(false)
  const [qrDataUrl, setQrDataUrl] = React.useState('')
  const [uri, setUri] = React.useState('')
  const [secret, setSecret] = React.useState('')
  const [code, setCode] = React.useState('')
  const [enabled, setEnabled] = React.useState(false)
  const [statusFetchFailed, setStatusFetchFailed] = React.useState(false)

  React.useEffect(() => {
    if (!email) return
    let mounted = true
    ;(async () => {
      try {
        const res = await mfaStatus(email)
        if (!mounted) return
        setEnabled(!!res?.enabled)
      } catch (e) {
        console.error('MFA status fetch error:', e)
        if (!mounted) return
        setStatusFetchFailed(true)
        try { error('Could not retrieve MFA status — continuing offline; some actions may fail.') } catch { /* ignore */ }
      }
    })()
    return () => { mounted = false }
  }, [email, error])

  // Ensure secret is not persisted anywhere when the hook/component unmounts.
  // Clear in-memory secret on unmount to avoid accidental retention in long-lived SPA sessions.
  React.useEffect(() => {
    return () => {
      try { setSecret('') } catch { /* ignore */ }
    }
  }, [])

  const handleSetup = React.useCallback(async () => {
    if (!email) return error('You must be signed in to setup MFA')
    setLoading(true)
    try {
      const data = await mfaSetup(email)
      setSecret(data?.secret || '')
      const u = data?.otpauthUri || data?.otpauth || ''
      setUri(u)
      setQrDataUrl('')
      success('MFA setup initialized — scan QR with your authenticator app')
    } catch (e) {
      console.error('MFA setup error:', e)
      try { error(e, 'Failed to initialize MFA setup') } catch { /* ignore */ }
    } finally {
      setLoading(false)
    }
  }, [email, error, success])

  const handleVerify = React.useCallback(async () => {
    if (!email) return error('Signed-in email missing')
    if (!code || !/^[0-9]{6}$/.test(code)) return error('Enter a valid 6-digit code')
    setLoading(true)
    try {
      await mfaVerify(email, code)
      success('MFA enabled')
      setEnabled(true)
    } catch (e) {
      console.error('MFA verify error:', e)
      try { error(e, 'Failed to verify code') } catch { /* ignore */ }
    } finally {
      setLoading(false)
    }
  }, [email, code, error, success])

  const handleDisable = React.useCallback(async () => {
    if (!email) return error('Signed-in email missing')
    setLoading(true)
    try {
      await mfaDisable(email)
      success('MFA disabled')
      setEnabled(false)
      setQrDataUrl('')
      setSecret('')
      setCode('')
    } catch (e) {
      console.error('MFA disable error:', e)
      try { error(e, 'Failed to disable MFA') } catch { /* ignore */ }
    } finally {
      setLoading(false)
    }
  }, [email, error, success])

  return {
    loading,
    qrDataUrl,
    setQrDataUrl,
    uri,
    secret,
    code,
    setCode,
    enabled,
    statusFetchFailed,
    handleSetup,
    handleVerify,
    handleDisable,
  }
}
