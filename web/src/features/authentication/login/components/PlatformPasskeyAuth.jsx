import React from 'react'
import { Button, Space, Typography } from 'antd'
import useWebAuthn from '@/features/authentication/hooks/useWebAuthn.js'
import { useAuthSession } from '@/features/authentication/hooks'
import { useNotifier } from '@/shared/notifications.js'
import { isDevLoggingEnabled } from '@/lib/utils.js'

const { Text } = Typography

export default function PlatformPasskeyAuth({ form, onAuthenticated, onCancel } = {}) {
  const { authenticateWithPlatform, register } = useWebAuthn()
  const { login } = useAuthSession()
  const { error: notifyError, info, success } = useNotifier()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [needsRegistration, setNeedsRegistration] = React.useState(false)

  const handleAuthenticate = async () => {
    try {
      setLoading(true)
      setError(null)
      setNeedsRegistration(false)

      const email = form?.getFieldValue('email') ? String(form.getFieldValue('email')).trim() : undefined
      const res = await authenticateWithPlatform({ email })
      
      if (res && typeof res === 'object') {
        const remember = !!form?.getFieldValue('rememberMe')
        login(res, { remember })
        
        if (typeof onAuthenticated === 'function') {
          onAuthenticated(res)
        }
      } else {
        const errMsg = 'Passkey login did not return a valid user'
        setError(errMsg)
        notifyError(errMsg)
      }
    } catch (e) {
      if (isDevLoggingEnabled) console.error('Platform passkey authentication failed', e)
      let errMsg = e?.message || 'Passkey authentication failed. Please try again.'
      
      const errorCode = e?.code || 
                       e?.originalError?.error?.code || 
                       e?.originalError?.code ||
                       (e?.originalError?.error && typeof e.originalError.error === 'object' ? e.originalError.error.code : null)
      const errorMsgLower = errMsg.toLowerCase()
      
      if (errorCode === 'no_passkeys' || 
          errorMsgLower.includes('no passkey') || 
          errorMsgLower.includes('no passkeys registered') ||
          errorMsgLower.includes('credential not found')) {
        setNeedsRegistration(true)
        setError(null)
        return
      } else if (errorMsgLower.includes('not found') || 
                 errorMsgLower.includes('user_not_found')) {
        errMsg = 'No passkeys found for this account. Please sign in with your email and password first, then register a passkey.'
      }
      
      if (!isDevLoggingEnabled) {
        const generic = 'Passkey authentication failed. Please try again.'
        if (errMsg.length > 80 || errorMsgLower.includes('challenge') || errorMsgLower.includes('abortsignal') || errorMsgLower.includes('credential')) {
          errMsg = generic
        }
      }
      
      setError(errMsg)
      notifyError(errMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    try {
      setLoading(true)
      setError(null)

      const email = form?.getFieldValue('email') ? String(form.getFieldValue('email')).trim() : undefined

      await register({ email })
      const res = await authenticateWithPlatform({ email })
      
      if (res && typeof res === 'object') {
        const remember = !!form?.getFieldValue('rememberMe')
        login(res, { remember })
        success('Logged in with passkey')
        
        if (typeof onAuthenticated === 'function') {
          onAuthenticated(res)
        }
      } else {
        setError('Passkey registered. Please sign in with your email and password to complete setup.')
        notifyError('Passkey registered. Please sign in with your email and password.')
      }
    } catch (e) {
      const errorCode = e?.code || 
                       e?.originalError?.error?.code || 
                       e?.originalError?.code
      
      if (e?.name === 'NotAllowedError' || errorCode === 'user_cancelled') {
        if (isDevLoggingEnabled) console.log('[PlatformPasskeyAuth] User cancelled passkey registration')
        info('Registration was cancelled. No worries! You can try again whenever you\'re ready.')
        return
      }
      
      if (isDevLoggingEnabled) console.error('Platform passkey registration failed', e)
      const errMsg = !isDevLoggingEnabled
        ? 'Failed to register passkey. Please try again.'
        : (e?.message || 'Failed to register passkey. Please try again.')
      setError(errMsg)
      notifyError(errMsg)
    } finally {
      setLoading(false)
    }
  }

  // Auto-trigger passkey auth when component mounts (after credential submission)
  // This is expected behavior for the verify-passkey step in the login flow
  React.useEffect(() => {
    const controller = new AbortController()
    const t = setTimeout(() => {
      handleAuthenticate()
    }, 100)
    return () => {
      clearTimeout(t)
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {error && (
        <Text type="danger" style={{ display: 'block', textAlign: 'center', marginBottom: 16 }}>
          {error}
        </Text>
      )}

      {needsRegistration && !error && (
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 16 }}>
          You don&apos;t have a passkey registered yet. Register one to enable passwordless sign-in.
        </Text>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
            {needsRegistration ? 'Registering your passkey...' : 'Authenticating...'}
          </Text>
        </div>
      )}

      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {needsRegistration ? (
          <Button
            type="primary"
            onClick={handleRegister}
            loading={loading}
            disabled={loading}
            block
          >
            Register Passkey
          </Button>
        ) : (
          <Button
            type="primary"
            onClick={handleAuthenticate}
            loading={loading}
            disabled={loading}
            block
          >
            {loading ? '' : 'Try again'}
          </Button>
        )}
        <div style={{ textAlign: 'center' }}>
          <Button type="text" onClick={onCancel} disabled={loading}>
            Back to Login
          </Button>
        </div>
      </Space>
    </Space>
  )
}
