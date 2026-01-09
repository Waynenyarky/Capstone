import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, Typography, Spin, Button, Result } from 'antd'
import { post } from '@/lib/http'
import { useAuthSession } from '@/features/authentication/hooks'

const { Title, Paragraph } = Typography

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('verifying') // verifying, success, error
  const [message, setMessage] = useState('')
  const { login, role } = useAuthSession()
  const verificationAttempted = React.useRef(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Missing verification token.')
      return
    }

    if (verificationAttempted.current) return
    verificationAttempted.current = true

    post('/api/auth/verify-email-token', { token })
      .then((data) => {
        if (data.user) {
          login(data.user)
          try {
            const bc = new BroadcastChannel('auth_channel')
            bc.postMessage({ type: 'email-verified' })
            bc.close()
          } catch (e) { /* ignore */ }
        }
        setStatus('success')
        // No auto-redirect so user can choose to close tab
      })
      .catch(err => {
        setStatus('error')
        setMessage(err.message || 'Failed to verify email.')
      })
  }, [token, navigate, login])

  if (status === 'verifying') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f7fb' }}>
        <Spin size="large" tip="Verifying your email..." />
      </div>
    )
  }

  const handleClose = () => {
    // Try to focus the opener (original tab) if accessible
    if (window.opener) {
      try { window.opener.focus() } catch (_) {}
    }

    // Determine target path based on role
    const target = (role === 'business_owner') ? '/business' : '/dashboard'

    // Attempt to close this tab
    // Note: This often fails if the tab wasn't opened by a script
    try {
      window.close()
    } catch (e) {
      // ignore
    }
    
    // Immediately redirect if the window is still open (close failed or blocked)
    navigate(target)
  }

  if (status === 'success') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f7fb' }}>
        <Card style={{ maxWidth: 500, width: '100%', textAlign: 'center' }}>
          <Result
            status="success"
            title="Email Verified Successfully!"
            subTitle={
              <span>
                Your dashboard has been updated in your original tab.<br />
                You can safely close this tab and proceed with registration.
              </span>
            }
            extra={[
              <Button type="primary" key="close" onClick={handleClose}>
                Close This Tab & Return to Original Tab
              </Button>,
              <div key="link" style={{ marginTop: 16 }}>
                <Button type="link" onClick={() => role === 'business_owner' ? navigate('/business') : navigate('/dashboard')}>
                  Or continue in this tab
                </Button>
              </div>,
            ]}
          />
        </Card>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f7fb' }}>
      <Card style={{ maxWidth: 500, width: '100%', textAlign: 'center' }}>
        <Result
          status="error"
          title="Verification Failed"
          subTitle={message}
          extra={[
            <Button type="primary" key="home" onClick={() => navigate('/')}>
              Go Home
            </Button>,
          ]}
        />
      </Card>
    </div>
  )
}
