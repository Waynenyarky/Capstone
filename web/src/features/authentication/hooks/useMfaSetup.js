import React from 'react'
import QRCode from 'qrcode'
import { useAuthSession } from './useAuthSession.js'
import { mfaSetup, mfaVerify, mfaStatus, mfaDisable } from '@/features/authentication/services/mfaService'
import { getProfile } from '@/features/authentication/services/authService.js'
import { useNotifier } from '@/shared/notifications'

// Hook that encapsulates MFA setup/verify/disable logic for the MfaSetup page
export default function useMfaSetup() {
  const { currentUser, login } = useAuthSession()
  const email = currentUser?.email
  const { success, error } = useNotifier()

  const [loading, setLoading] = React.useState(false)
  const [qrDataUrl, setQrDataUrl] = React.useState('')
  const [uri, setUri] = React.useState('')
  const [secret, setSecret] = React.useState('')
  const [code, setCode] = React.useState('')
  const [enabled, setEnabled] = React.useState(false)
  const [statusFetchFailed, setStatusFetchFailed] = React.useState(false)
  const [showSecret, setShowSecret] = React.useState(false)
  const [confirmedSaved, setConfirmedSaved] = React.useState(false)

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
      
      // Generate QR code from the otpauth URI
      if (u) {
        try {
          const qrDataUrl = await QRCode.toDataURL(u, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          })
          setQrDataUrl(qrDataUrl)
        } catch (qrErr) {
          console.error('Failed to generate QR code:', qrErr)
          setQrDataUrl('')
        }
      } else {
        setQrDataUrl('')
      }
      
      success('MFA setup initialized — scan QR with your authenticator app')
    } catch (e) {
      console.error('MFA setup error:', e)
      try { error(e, 'Failed to initialize MFA setup') } catch { /* ignore */ }
    } finally {
      setLoading(false)
    }
  }, [email, error, success])

  const toggleShowSecret = React.useCallback(() => {
    setShowSecret((s) => !s)
  }, [])

  const handleCopy = React.useCallback(async () => {
    try {
      const s = String(secret || '')
      if (!s) return error('Secret not available')
      await navigator.clipboard.writeText(s)
      success('Secret copied to clipboard')
    } catch (e) {
      error(e, 'Failed to copy secret')
    }
  }, [secret, success, error])

  const handleVerify = React.useCallback(async () => {
    if (!email) {
      error('Signed-in email missing')
      return false
    }
    if (!code || !/^[0-9]{6}$/.test(code)) {
      error('Enter a valid 6-digit code')
      return false
    }
    setLoading(true)
    try {
      const res = await mfaVerify(email, code)
      success('MFA enabled')
      setEnabled(true)
      const updatedUser = res?.user
      if (updatedUser && typeof updatedUser === 'object') {
        const raw = localStorage.getItem('auth__currentUser')
        const remember = !!raw
        const merged = { ...currentUser, ...updatedUser }
        login(merged, { remember })
      } else {
        try {
          const fresh = await getProfile()
          const raw = localStorage.getItem('auth__currentUser')
          const remember = !!raw
          const merged = { ...fresh, token: currentUser?.token }
          login(merged, { remember })
        } catch (e) { void e }
      }
      return true
    } catch (e) {
      console.error('MFA verify error:', e)
      try { error(e, 'Failed to verify code') } catch { /* ignore */ }
      return false
    } finally {
      setLoading(false)
    }
  }, [email, code, error, success, currentUser, login])

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

      try {
        const fresh = await getProfile()
        const raw = localStorage.getItem('auth__currentUser')
        const remember = !!raw
        const merged = { ...fresh, token: currentUser?.token }
        login(merged, { remember })
      } catch (e) { console.error('Failed to update session after disabling MFA', e) }
    } catch (e) {
      console.error('MFA disable error:', e)
      try { error(e, 'Failed to disable MFA') } catch { /* ignore */ }
    } finally {
      setLoading(false)
    }
  }, [email, error, success, currentUser?.token, login])

  return {
    loading,
    qrDataUrl,
    setQrDataUrl,
    uri,
    secret,
    showSecret,
    toggleShowSecret,
    code,
    setCode,
    enabled,
    statusFetchFailed,
    confirmedSaved,
    setConfirmedSaved,
    handleCopy,
    handleSetup,
    handleVerify,
    handleDisable,
  }
}
