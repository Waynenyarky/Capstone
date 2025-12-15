import React from 'react'
import { Card, Button, Space, Typography, Modal, Input } from 'antd'
import { useAuthSession } from '@/features/authentication/hooks'
import { mfaStatus, mfaDisable, mfaDisableRequest, mfaDisableUndo, mfaVerify } from '@/features/authentication/services/mfaService'
import { useNotifier } from '@/shared/notifications'
import { useNavigate } from 'react-router-dom'

export default function LoggedInMfaManager() {
  const { currentUser, role } = useAuthSession()
  const navigate = useNavigate()
  const { success, error } = useNotifier()
  const email = currentUser?.email

  const [loading, setLoading] = React.useState(false)
  const [enabled, setEnabled] = React.useState(false)
  const [statusFetchFailed, setStatusFetchFailed] = React.useState(false)
  const [disablePending, setDisablePending] = React.useState(false)
  const [scheduledFor, setScheduledFor] = React.useState(null)
  const [countdown, setCountdown] = React.useState('')
  const [confirmModalVisible, setConfirmModalVisible] = React.useState(false)
  const [confirmCode, setConfirmCode] = React.useState('')
  const [undoModalVisible, setUndoModalVisible] = React.useState(false)
  const [undoCode, setUndoCode] = React.useState('')

  React.useEffect(() => {
    let mounted = true
    if (!email) return
    ;(async () => {
      try {
        const res = await mfaStatus(email)
        if (!mounted) return
        setEnabled(!!res?.enabled)
        setDisablePending(!!res?.disablePending)
        setScheduledFor(res?.scheduledFor || null)
      } catch (err) {
        if (!mounted) return
        setStatusFetchFailed(true)
        // Non-blocking notice to user
        error('Could not retrieve MFA status — continuing offline; some actions may fail.')
      }
    })()
    return () => { mounted = false }
  }, [email])

  // Countdown for scheduled disable
  React.useEffect(() => {
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
        (async () => {
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

  if (!currentUser) return null
  // Do not render for admin accounts
  if (String(role || '').toLowerCase() === 'admin') return null

  const handleOpenSetup = () => navigate('/mfa/setup')

  // Start the confirm flow (show modal to enter current TOTP code)
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

  return (
    <Card title="Two-factor Authentication">
      {disablePending && scheduledFor ? (
        <div style={{ marginBottom: 12 }}>
          <Typography.Text type="danger">Disable requested — scheduled for: {new Date(scheduledFor).toLocaleString()}</Typography.Text>
          <div>{countdown}</div>
        </div>
      ) : null}
      {statusFetchFailed ? (
        <Typography.Paragraph type="warning" style={{ marginBottom: 12 }}>
          Could not retrieve MFA status — continuing offline; some actions may fail.
        </Typography.Paragraph>
      ) : null}
      <Typography.Paragraph>
        Manage two-factor authentication for your account. We support TOTP (Google Authenticator, Authy).
      </Typography.Paragraph>
      <Space>
        <Button type="primary" onClick={handleOpenSetup} disabled={loading || enabled}>Setup / Manage MFA</Button>
        <Button danger onClick={handleDisable} disabled={loading || !enabled || disablePending}>Disable MFA</Button>
        {disablePending ? (
          <Button onClick={() => setUndoModalVisible(true)}>Undo Disable</Button>
        ) : null}
      </Space>
      <div style={{ marginTop: 12 }}>
        <strong>Status:</strong> {enabled ? 'Enabled' : 'Disabled'}
      </div>
      <Modal
        title="Confirm disable MFA"
        visible={confirmModalVisible}
        onOk={confirmDisable}
        onCancel={() => setConfirmModalVisible(false)}
        okText="Confirm"
        cancelText="Cancel"
      >
        <p>Enter your current authenticator code to confirm disabling MFA. This will schedule disable in 24 hours.</p>
        <Input
          value={confirmCode}
          onChange={(e) => setConfirmCode((e.target.value || '').replace(/\D+/g, '').slice(0,6))}
          placeholder="123456"
          maxLength={6}
        />
      </Modal>

      <Modal
        title="Undo disable request"
        visible={undoModalVisible}
        onOk={confirmUndo}
        onCancel={() => setUndoModalVisible(false)}
        okText="Undo"
        cancelText="Cancel"
      >
        <p>Enter your current authenticator code to cancel the pending disable.</p>
        <Input
          value={undoCode}
          onChange={(e) => setUndoCode((e.target.value || '').replace(/\D+/g, '').slice(0,6))}
          placeholder="123456"
          maxLength={6}
        />
      </Modal>
    </Card>
  )
}

