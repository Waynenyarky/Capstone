import React from 'react'
import { Card, Button, Space, Typography } from 'antd'
import { useAuthSession } from '@/features/authentication/hooks'
import { mfaStatus, mfaDisable } from '@/features/authentication/services/mfaService'
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

  React.useEffect(() => {
    let mounted = true
    if (!email) return
    ;(async () => {
      try {
        const res = await mfaStatus(email)
        if (!mounted) return
        setEnabled(!!res?.enabled)
      } catch (err) {
        if (!mounted) return
        setStatusFetchFailed(true)
        // Non-blocking notice to user
        error('Could not retrieve MFA status — continuing offline; some actions may fail.')
      }
    })()
    return () => { mounted = false }
  }, [email])

  if (!currentUser) return null
  // Do not render for admin accounts
  if (String(role || '').toLowerCase() === 'admin') return null

  const handleOpenSetup = () => navigate('/mfa/setup')

  const handleDisable = async () => {
    if (!email) return error('Signed-in email missing')
    setLoading(true)
    try {
      await mfaDisable(email)
      setEnabled(false)
      success('MFA disabled')
    } catch (err) {
      console.error('Disable MFA error', err)
      error(err, 'Failed to disable MFA')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="Two-factor Authentication">
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
        <Button danger onClick={handleDisable} disabled={loading || !enabled}>Disable MFA</Button>
      </Space>
      <div style={{ marginTop: 12 }}>
        <strong>Status:</strong> {enabled ? 'Enabled' : 'Disabled'}
      </div>
    </Card>
  )
}
