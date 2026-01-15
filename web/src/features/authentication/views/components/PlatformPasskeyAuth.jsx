import React from 'react'
import { Button, Space, Typography, Spin, Alert } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import useWebAuthn from '../../hooks/useWebAuthn.js'
import { useAuthSession } from '../../hooks'
import { useNotifier } from '@/shared/notifications.js'

const { Text } = Typography

export default function PlatformPasskeyAuth({ form, onAuthenticated, onCancel } = {}) {
  const { authenticateWithPlatform, register } = useWebAuthn()
  const { login } = useAuthSession()
  const { success, error: notifyError, info } = useNotifier()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [needsRegistration, setNeedsRegistration] = React.useState(false)

  const handleAuthenticate = async () => {
    try {
      setLoading(true)
      setError(null)
      setNeedsRegistration(false)

      // Email is optional for passkey authentication
      // If email is provided, use it; otherwise, pass undefined for userless authentication
      const email = form?.getFieldValue('email') ? String(form.getFieldValue('email')).trim() : undefined

      // Use platform authenticator (Windows Hello, Touch ID, external security keys, etc.)
      // This will prompt for any FIDO2-compatible authenticator
      const res = await authenticateWithPlatform({ email })
      
      // Expect server to return user object on successful authentication
      if (res && typeof res === 'object') {
        const remember = !!form?.getFieldValue('rememberMe')
        login(res, { remember })
        success('Logged in with passkey')
        
        if (typeof onAuthenticated === 'function') {
          onAuthenticated(res)
        }
      } else {
        const errMsg = 'Passkey login did not return a valid user'
        setError(errMsg)
        notifyError(errMsg)
      }
    } catch (e) {
      console.error('Platform passkey authentication failed', e)
      let errMsg = e?.message || 'Passkey authentication failed. Please try again.'
      
      // Check for specific error types
      const errorCode = e?.code || 
                       e?.originalError?.error?.code || 
                       e?.originalError?.code ||
                       (e?.originalError?.error && typeof e.originalError.error === 'object' ? e.originalError.error.code : null)
      const errorMsgLower = errMsg.toLowerCase()
      
      if (errorCode === 'no_passkeys' || 
          errorMsgLower.includes('no passkey') || 
          errorMsgLower.includes('no passkeys registered') ||
          errorMsgLower.includes('credential not found')) {
        // Show registration option instead of error
        setNeedsRegistration(true)
        setError(null) // Clear error to show registration option
        return
      } else if (errorMsgLower.includes('not found') || 
                 errorMsgLower.includes('user_not_found')) {
        errMsg = 'No passkeys found for this account. Please sign in with your email and password first, then register a passkey.'
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

      // Email is optional for passkey registration
      // If email is provided, use it; otherwise, pass undefined
      const email = form?.getFieldValue('email') ? String(form.getFieldValue('email')).trim() : undefined

      // Register a new passkey using platform authenticator
      await register({ email })
      success('Passkey registered successfully! Logging you in...')
      
      // After registration, authenticate the user
      const res = await authenticateWithPlatform({ email })
      
      if (res && typeof res === 'object') {
        const remember = !!form?.getFieldValue('rememberMe')
        login(res, { remember })
        success('Logged in with passkey')
        
        if (typeof onAuthenticated === 'function') {
          onAuthenticated(res)
        }
      } else {
        // If authentication after registration fails, user needs to sign in with password
        setError('Passkey registered. Please sign in with your email and password to complete setup.')
        notifyError('Passkey registered. Please sign in with your email and password.')
      }
    } catch (e) {
      // Handle user cancellation with a friendly message
      const errorCode = e?.code || 
                       e?.originalError?.error?.code || 
                       e?.originalError?.code
      
      if (e?.name === 'NotAllowedError' || errorCode === 'user_cancelled') {
        // User cancelled - this is expected behavior, show friendly info message
        console.log('[PlatformPasskeyAuth] User cancelled passkey registration')
        info('Registration was cancelled. No worries! You can try again whenever you\'re ready.')
        return
      }
      
      console.error('Platform passkey registration failed', e)
      const errMsg = e?.message || 'Failed to register passkey. Please try again.'
      setError(errMsg)
      notifyError(errMsg)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    // Automatically trigger authentication when component mounts
    handleAuthenticate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {error && (
        <Alert
          message="Authentication Failed"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
        />
      )}

      {needsRegistration && !error && (
        <Alert
          message="Register Your Passkey"
          description={
            <div>
              <Text style={{ display: 'block', marginBottom: 8 }}>
                You don't have a passkey registered yet. Register one now to enable passwordless sign-in with Windows Hello or a security key.
              </Text>
              <Text style={{ fontSize: 12, display: 'block' }}>
                After registration, you'll be automatically signed in and can use your passkey for future logins.
              </Text>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        {loading ? (
          <>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">
                {needsRegistration ? 'Registering your passkey...' : 'Waiting for your saved passkey authentication...'}
                <br />
                <strong>Check your device:</strong>
                <br />
                • Windows Hello (fingerprint, face, or PIN)
                <br />
                • External security key (USB/NFC/Bluetooth)
                <br />
                • Touch ID (Mac) / Face ID (Mac)
              </Text>
            </div>
          </>
        ) : needsRegistration ? (
          <>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              Click the button below to register a passkey. You can use:
            </Text>
            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
              • Windows Hello (fingerprint, face, or PIN)
              <br />
              • External security key (USB/NFC/Bluetooth)
              <br />
              • Touch ID (Mac) / Face ID (Mac)
            </Text>
          </>
        ) : (
          <>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              Use your saved passkey to sign in. You can authenticate using:
            </Text>
            <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
              • Windows Hello (fingerprint, face, or PIN)
              <br />
              • External security key (USB/NFC/Bluetooth)
              <br />
              • Touch ID (Mac) / Face ID (Mac)
            </Text>
          </>
        )}
      </div>

      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={onCancel}
          disabled={loading}
        >
          Back
        </Button>
        {needsRegistration ? (
          <Button
            type="primary"
            onClick={handleRegister}
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register Passkey'}
          </Button>
        ) : (
          <Button
            type="primary"
            onClick={handleAuthenticate}
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Authenticate'}
          </Button>
        )}
      </Space>
    </Space>
  )
}
