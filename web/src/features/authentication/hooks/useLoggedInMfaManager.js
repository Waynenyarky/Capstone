import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthSession } from './useAuthSession'
import {
  mfaStatus,
  mfaDisableRequest,
  mfaDisableRequestStart,
  mfaDisableUndo,
  mfaDisableUndoStart,
  mfaVerify,
} from '@/features/authentication/services/mfaService'
import { authenticateComplete } from '@/features/authentication/services/webauthnService'
import { base64ToBuffer, bufferToBase64 } from '@/features/authentication/lib/webauthnBuffers'
import { useAuthNotification, useNotifier } from '@/shared/notifications'

async function verifyWithPasskeyForDisable() {
  const start = await mfaDisableRequestStart()
  const pub = start?.publicKey
  if (!pub?.challenge) throw new Error('Invalid response')
  const publicKey = { ...pub, challenge: base64ToBuffer(pub.challenge) }
  if (pub.allowCredentials?.length) {
    publicKey.allowCredentials = pub.allowCredentials.map((c) => ({ ...c, id: base64ToBuffer(c.id) }))
  }
  const cred = await navigator.credentials.get({ publicKey })
  if (!cred?.response) throw new Error('Authentication was cancelled or timed out')
  const resp = cred.response
  await authenticateComplete({
    credential: {
      id: cred.id,
      rawId: bufferToBase64(cred.rawId),
      type: cred.type,
      response: {
        clientDataJSON: bufferToBase64(resp.clientDataJSON),
        authenticatorData: bufferToBase64(resp.authenticatorData),
        signature: bufferToBase64(resp.signature),
        userHandle: resp.userHandle ? bufferToBase64(resp.userHandle) : null,
      },
    },
    purpose: 'mfa_disable',
  })
}

async function verifyWithPasskeyForUndo() {
  const start = await mfaDisableUndoStart()
  const pub = start?.publicKey
  if (!pub?.challenge) throw new Error('Invalid response')
  const publicKey = { ...pub, challenge: base64ToBuffer(pub.challenge) }
  if (pub.allowCredentials?.length) {
    publicKey.allowCredentials = pub.allowCredentials.map((c) => ({ ...c, id: base64ToBuffer(c.id) }))
  }
  const cred = await navigator.credentials.get({ publicKey })
  if (!cred?.response) throw new Error('Authentication was cancelled or timed out')
  const resp = cred.response
  await authenticateComplete({
    credential: {
      id: cred.id,
      rawId: bufferToBase64(cred.rawId),
      type: cred.type,
      response: {
        clientDataJSON: bufferToBase64(resp.clientDataJSON),
        authenticatorData: bufferToBase64(resp.authenticatorData),
        signature: bufferToBase64(resp.signature),
        userHandle: resp.userHandle ? bufferToBase64(resp.userHandle) : null,
      },
    },
    purpose: 'mfa_disable_undo',
  })
}

export function useLoggedInMfaManager() {
  const { currentUser, role } = useAuthSession()
  const navigate = useNavigate()
  const { success, error } = useNotifier()
  const { notificationSuccess } = useAuthNotification()
  const email = currentUser?.email

  const [loading, setLoading] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [statusFetchFailed, setStatusFetchFailed] = useState(false)
  const [disablePending, setDisablePending] = useState(false)
  const [scheduledFor, setScheduledFor] = useState(null)
  const [countdown, setCountdown] = useState('')
  const [confirmModalVisible, setConfirmModalVisible] = useState(false)
  const [confirmCode, setConfirmCode] = useState('')
  const [undoModalVisible, setUndoModalVisible] = useState(false)
  const [undoCode, setUndoCode] = useState('')

  // Sync from session so Settings shows correct state right after onboarding (before/without waiting for API)
  React.useEffect(() => {
    if (currentUser?.mfaEnabled === true) {
      setEnabled(true)
    }
  }, [currentUser?.mfaEnabled])

  const refetchMfaStatus = React.useCallback(async () => {
    if (!email) return
    try {
      const res = await mfaStatus(email)
      setEnabled(!!res?.enabled)
      setDisablePending(!!res?.disablePending)
      setScheduledFor(res?.scheduledFor || null)
    } catch {
      setStatusFetchFailed(true)
    }
  }, [email])

  useEffect(() => {
    let mounted = true
    if (!email) return
    ;(async () => {
      try {
        const res = await mfaStatus(email)
        if (!mounted) return
        setEnabled(!!res?.enabled)
        setDisablePending(!!res?.disablePending)
        setScheduledFor(res?.scheduledFor || null)
      } catch {
        if (!mounted) return
        setStatusFetchFailed(true)
        // Non-blocking notice to user
        error('Could not retrieve MFA status — continuing offline; some actions may fail.')
      }
    })()
    return () => { mounted = false }
  }, [email, currentUser?.mfaEnabled, error])

  // Countdown for scheduled disable
  useEffect(() => {
    if (!scheduledFor) {
      setCountdown('')
      return
    }
    let cancelled = false
    const tick = () => {
      const until = new Date(scheduledFor).getTime() - Date.now()
      if (until <= 0) {
        setCountdown('Finalizing disable...')
        // refresh status once
        ;(async () => {
          try {
            const res = await mfaStatus(email)
            if (cancelled) return
            setEnabled(!!res?.enabled)
            setDisablePending(!!res?.disablePending)
            setScheduledFor(res?.scheduledFor || null)
          } catch {
            // ignore
          }
        })()
        return
      }
      const seconds = Math.floor(until / 1000)
      const days = Math.floor(seconds / (24 * 3600))
      const hrs = Math.floor((seconds % (24 * 3600)) / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      const parts = []
      if (days > 0) parts.push(`${days}d`)
      parts.push(String(hrs).padStart(2, '0') + 'h')
      parts.push(String(mins).padStart(2, '0') + 'm')
      parts.push(String(secs).padStart(2, '0') + 's')
      setCountdown(parts.join(' '))
    }
    tick()
    const iv = setInterval(tick, 1000)
    return () => { cancelled = true; clearInterval(iv) }
  }, [scheduledFor, email])

  const confirmUndo = async (passkeyOnly = false) => {
    if (!email) return error('Signed-in email missing')
    setLoading(true)
    try {
      if (passkeyOnly) {
        await verifyWithPasskeyForUndo()
      }
      const res = await mfaDisableUndo(email, passkeyOnly ? '' : undoCode)
      if (res?.canceled) {
        setDisablePending(false)
        setScheduledFor(null)
        notificationSuccess('MFA disable cancelled', 'MFA will remain enabled on your account.')
      } else {
        const s = await mfaStatus(email)
        setDisablePending(!!s?.disablePending)
        setScheduledFor(s?.scheduledFor || null)
      }
    } catch (err) {
      console.error('Undo disable error', err)
      error(err, err?.message?.includes('cancelled') ? 'Verification was cancelled' : 'Failed to cancel disable')
    } finally {
      setLoading(false)
      setUndoModalVisible(false)
    }
  }

  const handleOpenSetup = () => navigate('/account/security')

  const handleDisable = () => {
    setConfirmCode('')
    setConfirmModalVisible(true)
  }

  const confirmDisable = async () => {
    if (!email) return error('Signed-in email missing')
    setLoading(true)
    try {
      // Verify TOTP code first to ensure holder intends to disable
      await mfaVerify(email, confirmCode)
      const res = await mfaDisableRequest(email)
      setDisablePending(!!res?.disablePending)
      setScheduledFor(res?.scheduledFor || null)
      success('MFA disable scheduled — will be disabled in 24 hours')
    } catch (err) {
      console.error('Disable MFA request error', err)
      error(err, 'Failed to schedule MFA disable')
    } finally {
      setLoading(false)
      setConfirmModalVisible(false)
    }
  }

  const confirmDisableWithoutVerify = async () => {
    if (!email) return error('Signed-in email missing')
    setLoading(true)
    try {
      await verifyWithPasskeyForDisable()
      const res = await mfaDisableRequest(email)
      setDisablePending(!!res?.disablePending)
      setScheduledFor(res?.scheduledFor || null)
      notificationSuccess('MFA disable scheduled', 'MFA will be disabled in 24 hours.')
    } catch (err) {
      console.error('Disable MFA request error', err)
      error(err, err?.message?.includes('cancelled') ? 'Verification was cancelled' : 'Failed to schedule MFA disable')
    } finally {
      setLoading(false)
      setConfirmModalVisible(false)
    }
  }

  return {
    currentUser,
    role,
    loading,
    enabled,
    statusFetchFailed,
    disablePending,
    scheduledFor,
    countdown,
    confirmModalVisible,
    setConfirmModalVisible,
    confirmCode,
    setConfirmCode,
    undoModalVisible,
    setUndoModalVisible,
    undoCode,
    setUndoCode,
    handleOpenSetup,
    handleDisable,
    confirmDisable,
    confirmDisableWithoutVerify,
    confirmUndo,
    refetchMfaStatus
  }
}
