import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthSession } from './useAuthSession'
import { mfaStatus, mfaDisableRequest, mfaDisableUndo, mfaVerify } from '@/features/authentication/services/mfaService'
import { useNotifier } from '@/shared/notifications'

export function useLoggedInMfaManager() {
  const { currentUser, role } = useAuthSession()
  const navigate = useNavigate()
  const { success, error } = useNotifier()
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
  }, [email, error])

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

  const confirmUndo = async () => {
    if (!email) return error('Signed-in email missing')
    setLoading(true)
    try {
      const res = await mfaDisableUndo(email, undoCode)
      if (res?.canceled) {
        setDisablePending(false)
        setScheduledFor(null)
        success('MFA disable canceled')
      } else {
        // if backend returned no canceled flag, just refresh
        const s = await mfaStatus(email)
        setDisablePending(!!s?.disablePending)
        setScheduledFor(s?.scheduledFor || null)
      }
    } catch (err) {
      console.error('Undo disable error', err)
      error(err, 'Failed to cancel disable')
    } finally {
      setLoading(false)
      setUndoModalVisible(false)
    }
  }

  const handleOpenSetup = () => navigate('/mfa/setup')

  const handleDisable = () => {
    setConfirmCode('')
    setConfirmModalVisible(true)
  }

  const confirmDisable = async () => {
    if (!email) return error('Signed-in email missing')
    setLoading(true)
    try {
      // Verify code first to ensure holder intends to disable
      await mfaVerify(email, confirmCode)
      // Request disable which schedules it 24 hours from now
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
    confirmUndo
  }
}
