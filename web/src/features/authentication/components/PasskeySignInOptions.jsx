import React from 'react'
import { Button, Alert, Space, Typography, Modal, Steps, Divider, theme, Grid } from 'antd'
import { SafetyCertificateOutlined, CheckCircleOutlined, CheckCircleFilled, MobileOutlined, AppleOutlined, WindowsOutlined } from '@ant-design/icons'
import useWebAuthn from '../hooks/useWebAuthn.js'
import { useAuthSession } from '../hooks/index.js'
import { useNotifier } from '@/shared/notifications.js'

const { Text, Title } = Typography

const { useBreakpoint } = Grid

export default function PasskeySignInOptions({ form, onAuthenticated } = {}) {
  const { token } = theme.useToken()
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const { authenticateWithPlatform, register } = useWebAuthn()
  const { login } = useAuthSession()
  const { success, error: notifyError, info } = useNotifier()
  const [loading, setLoading] = React.useState(false)
  const [needsRegistration, setNeedsRegistration] = React.useState(false)
  const [guideModalVisible, setGuideModalVisible] = React.useState(false)

  const handlePasskeyAuth = async () => {
    try {
      setLoading(true)
      setNeedsRegistration(false)

      const email = String(form?.getFieldValue('email') || '').trim()
      if (!email) {
        const errMsg = 'Enter your email before using a passkey'
        notifyError(errMsg)
        return
      }

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
        notifyError(errMsg)
      }
    } catch (e) {
      // Only log as error if it's not a user cancellation
      if (e?.name !== 'NotAllowedError' && e?.code !== 'user_cancelled') {
        console.error('Passkey authentication failed', e)
      }
      
      // Handle WebAuthn-specific errors
      let errMsg = 'Passkey authentication failed. Please try again.'
      
      // Check for backend error codes first (they're more specific)
      // Extract error code from multiple possible locations
      const errorCode = e?.code || 
                       e?.originalError?.error?.code || 
                       e?.originalError?.code ||
                       (e?.originalError?.error && typeof e.originalError.error === 'object' ? e.originalError.error.code : null) ||
                       (e?.originalError && e.originalError.error && typeof e.originalError.error === 'object' ? e.originalError.error.code : null)
      
      // Debug logging to help diagnose error structure
      if (errorCode === 'no_passkeys' || (e?.message || '').toLowerCase().includes('no passkey')) {
        console.log('[PasskeySignInOptions] Error details:', {
          errorCode,
          message: e?.message,
          originalError: e?.originalError,
          errorStructure: {
            hasCode: !!e?.code,
            hasOriginalError: !!e?.originalError,
            originalErrorCode: e?.originalError?.code,
            originalErrorErrorCode: e?.originalError?.error?.code
          }
        })
      }
      
      // Handle user cancellation first (this is expected behavior, not really an error)
      if (e?.name === 'NotAllowedError' || errorCode === 'user_cancelled') {
        // User cancelled or timed out - this is expected behavior, show info message instead of error
        console.log('[PasskeySignInOptions] User cancelled or timed out WebAuthn prompt')
        // Don't show error notification for user cancellation - it's expected behavior
        // Just silently return, or show an info message if needed
        return
      }
      
      // Handle no_passkeys error - show registration option instead of error
      // Check both error code and error message content (check original error message before modification)
      const originalErrorMsg = (e?.message || '').toLowerCase()
      const isNoPasskeysError = errorCode === 'no_passkeys' || 
                                originalErrorMsg.includes('no passkeys registered') ||
                                originalErrorMsg.includes('no passkey') ||
                                (originalErrorMsg.includes('passkey') && originalErrorMsg.includes('register') && originalErrorMsg.includes('first'))
      
      if (isNoPasskeysError) {
        // Show registration option instead of error
        console.log('[PasskeySignInOptions] No passkeys detected, showing registration option', {
          errorCode,
          originalErrorMsg,
          error: e
        })
        setNeedsRegistration(true)
        setLoading(false) // Make sure loading is reset so button is clickable
        return
      }
      // Handle specific backend error codes
      else if (errorCode === 'credential_not_found') {
        errMsg = 'The passkey on this device is not registered for this account. Please use a different passkey or register a new one.'
      } else if (errorCode === 'challenge_missing') {
        errMsg = 'Authentication session expired. Please try again.'
      } else if (errorCode === 'user_not_found') {
        errMsg = 'Account not found. Please check your email and try again.'
      } else if (errorCode === 'webauthn_auth_failed') {
        errMsg = 'Passkey verification failed. Please try again.'
      }
      // Check for WebAuthn error types (browser-level errors)
      else if (e?.name === 'InvalidStateError') {
        errMsg = 'No passkey found. Please register a passkey first by signing in with your email and password.'
      } else if (e?.name === 'NotFoundError') {
        errMsg = 'No passkey found on this device. Please register a passkey first.'
      } else if (e?.name === 'SecurityError') {
        errMsg = 'Security error. Please make sure you\'re using a supported browser and try again.'
      } else if (e?.name === 'NotSupportedError') {
        errMsg = 'Passkeys are not supported on this device or browser. Please use a different device or browser.'
      } else if (e?.message && typeof e.message === 'string') {
        const msg = e.message.trim()
        // Don't use generic messages
        if (msg && !msg.toLowerCase().includes('something went wrong')) {
          errMsg = msg
        }
      }
      
      // Check error message content for additional clues
      const errorMsgLower = errMsg.toLowerCase()
      if (errorMsgLower.includes('credential not recognized') || 
          (errorMsgLower.includes('credential not found') && !errorMsgLower.includes('no passkeys'))) {
        errMsg = 'The passkey on this device is not registered for this account. Please use a different passkey or register a new one.'
      } else if (errorMsgLower.includes('not found') && !errorMsgLower.includes('passkey')) {
        if (errorMsgLower.includes('user')) {
          errMsg = 'Account not found. Please check your email and try again.'
        }
      }
      
      // Ensure we pass a string, not an error object
      // Use the error message directly to avoid "Something went wrong" fallback
      const finalErrorMsg = String(errMsg).trim() || 'Passkey authentication failed. Please try again.'
      
      // Ensure we never show "Something went wrong"
      if (finalErrorMsg.toLowerCase().includes('something went wrong')) {
        notifyError('Passkey authentication failed. Please try again.')
      } else {
        notifyError(finalErrorMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    const email = String(form?.getFieldValue('email') || '').trim()
    if (!email) {
      const errMsg = 'Enter your email before registering a passkey'
      notifyError(errMsg)
      return
    }

    // Show guide modal first
    setGuideModalVisible(true)
  }

  const handleStartRegistration = async () => {
    setGuideModalVisible(false)
    
    try {
      setLoading(true)
      setNeedsRegistration(false)

      const email = String(form?.getFieldValue('email') || '').trim()
      if (!email) {
        const errMsg = 'Enter your email before registering a passkey'
        notifyError(errMsg)
        return
      }

      // Register a new passkey using platform authenticator
      await register({ email })
      success('Passkey registered successfully!')
      
      // After registration, try to authenticate the user
      // Note: There might be a brief delay for the database to update, so we handle errors gracefully
      try {
        const res = await authenticateWithPlatform({ email })
        
        if (res && typeof res === 'object') {
          const remember = !!form?.getFieldValue('rememberMe')
          login(res, { remember })
          success('Logged in with passkey')
          
          if (typeof onAuthenticated === 'function') {
            onAuthenticated(res)
          }
        } else {
          // If authentication response is invalid, prompt user to sign in with password
          notifyError('Passkey registered. Please sign in with your email and password to complete setup.')
        }
      } catch (authError) {
        // If authentication fails after registration, it's okay - registration was successful
        // The user can now use their passkey on the next login attempt
        console.warn('[PasskeySignInOptions] Authentication after registration failed:', authError)
        notifyError('Passkey registered successfully! You can now use it to sign in. Please try signing in again with your passkey.')
      }
    } catch (e) {
      // Handle user cancellation with a friendly message
      const errorCode = e?.code || 
                       e?.originalError?.error?.code || 
                       e?.originalError?.code
      
      if (e?.name === 'NotAllowedError' || errorCode === 'user_cancelled') {
        // User cancelled - this is expected behavior, show friendly info message
        console.log('[PasskeySignInOptions] User cancelled passkey registration')
        info('Registration was cancelled. No worries! You can try again whenever you\'re ready.')
        return
      }
      
      console.error('Passkey registration failed', e)
      const errMsg = e?.message || 'Failed to register passkey. Please try again.'
      notifyError(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {needsRegistration && (
          <Alert
            message="Register Your Passkey"
            description={
              <div>
                <Text style={{ display: 'block', marginBottom: 8 }}>
                  You don't have a passkey registered yet. Register one now to enable passwordless sign-in with Windows Hello, Touch ID, Face ID, or a security key.
                </Text>
                <Text style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                  <strong>What to expect:</strong> When you click "Register Passkey", you'll see a step-by-step guide first, then your browser will prompt you to select where to save your passkey.
                </Text>
                <Text style={{ fontSize: 12, display: 'block' }}>
                  After registration, you'll be automatically signed in and can use your passkey for future logins.
                </Text>
              </div>
            }
            type="info"
            showIcon
            closable
            onClose={() => setNeedsRegistration(false)}
          />
        )}
        
        <Button
          onClick={needsRegistration ? handleRegister : handlePasskeyAuth}
          type={needsRegistration ? "primary" : "default"}
          block
          size="large"
          loading={loading}
          disabled={loading}
          icon={<span role="img" aria-label="passkey">🔑</span>}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          {loading 
            ? (needsRegistration ? 'Registering...' : 'Authenticating...')
            : (needsRegistration ? 'Register Passkey' : 'Sign in with a passkey')
          }
        </Button>
      </Space>

      {/* Registration Guide Modal */}
      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
            <span>Register Your Passkey</span>
          </Space>
        }
        open={guideModalVisible}
        onCancel={() => setGuideModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setGuideModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="start" type="primary" onClick={handleStartRegistration} loading={loading}>
            Start Registration
          </Button>
        ]}
        width={isMobile ? '90%' : 520}
        centered
        styles={{
          body: {
            padding: '12px 0'
          }
        }}
      >
        <div style={{ padding: '4px 0' }}>
          <Alert
            type="info"
            showIcon
            message="Before You Begin"
            description="Ensure your device supports passkeys (Windows Hello, Touch ID, Face ID, or security keys) and you're using a compatible browser."
            style={{ marginBottom: 12, fontSize: 13 }}
            size="small"
          />

          <Title level={5} style={{ marginBottom: 10, fontSize: 15 }}>Quick Guide</Title>
          
          <Steps
            direction="vertical"
            size="small"
            items={[
              {
                title: <Text strong style={{ fontSize: 13 }}>Device Compatibility</Text>,
                description: (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Supported: Windows Hello • Mac Touch ID/Face ID • Mobile biometrics • Security keys
                  </Text>
                ),
                icon: <CheckCircleOutlined style={{ color: token.colorPrimary, fontSize: 16 }} />
              },
              {
                title: <Text strong style={{ fontSize: 13 }}>Start Registration</Text>,
                description: (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Click "Start Registration" below. Your browser will prompt you to create a passkey.
                  </Text>
                ),
                icon: <CheckCircleOutlined style={{ color: token.colorPrimary, fontSize: 16 }} />
              },
              {
                title: <Text strong style={{ fontSize: 13 }}>Select Save Location</Text>,
                description: (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Choose <strong>This device</strong> (personal) or <strong>Security key</strong> (shared). You can register multiple passkeys later.
                  </Text>
                ),
                icon: <CheckCircleOutlined style={{ color: token.colorPrimary, fontSize: 16 }} />
              },
              {
                title: <Text strong style={{ fontSize: 13 }}>Authenticate</Text>,
                description: (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Use your device's biometrics, PIN, or security key to complete registration.
                  </Text>
                ),
                icon: <CheckCircleOutlined style={{ color: token.colorPrimary, fontSize: 16 }} />
              },
              {
                title: <Text strong style={{ fontSize: 13 }}>Done!</Text>,
                description: (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    You'll be automatically signed in after successful registration.
                  </Text>
                ),
                icon: <CheckCircleFilled style={{ color: '#52c41a', fontSize: 16 }} />
              }
            ]}
          />

          <Divider style={{ margin: '12px 0' }} />

          <Alert
            type="success"
            showIcon={false}
            message={<Text strong style={{ fontSize: 13 }}>Benefits: No passwords • More secure • Works across devices • Fast authentication</Text>}
            style={{ background: '#f6ffed', border: '1px solid #b7eb8f', padding: '8px 12px', margin: 0 }}
            size="small"
          />
        </div>
      </Modal>
    </>
  )
}
