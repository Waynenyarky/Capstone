import React from 'react'
import { Button, Alert, Space, Typography, Modal, theme, Grid, Form, Input, Steps } from 'antd'
import { SafetyCertificateOutlined, CheckCircleOutlined, MobileOutlined } from '@ant-design/icons'
import useWebAuthn from '../../hooks/useWebAuthn.js'
import { useAuthSession } from '../../hooks'
import { useNotifier } from '@/shared/notifications.js'
import { authenticateStart } from '../../services/webauthnService.js'

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
  const [checkingPasskeys, setCheckingPasskeys] = React.useState(false)
  const [currentEmail, setCurrentEmail] = React.useState('')
  const [registrationForm] = Form.useForm()
  
  // Listen for email changes to check if user has passkeys
  React.useEffect(() => {
    if (!form) return
    
    let isCancelled = false
    
    const checkPasskeys = async () => {
      // Use currentEmail state which is updated by the polling effect
      // Normalize email to lowercase for consistent backend matching
      const email = currentEmail ? String(currentEmail).trim().toLowerCase() : undefined
      
      // Only check if we have a valid, complete email address
      // Basic email validation: must contain @ and have characters before and after @
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!email || !emailRegex.test(email)) {
        // Invalid or incomplete email - don't show registration option (user can still use userless auth)
        if (!isCancelled) {
          setNeedsRegistration(false)
          setCheckingPasskeys(false)
        }
        return
      }
      
      if (!isCancelled) {
        setCheckingPasskeys(true)
      }
      
      try {
        // Try to start authentication - if it fails with no_passkeys, show registration
        // Normalize email before sending to backend
        await authenticateStart({ email: email.toLowerCase() })
        // If successful, user has passkeys - hide registration option
        if (!isCancelled) {
          console.log('[PasskeySignInOptions] User has passkeys registered for:', email)
          setNeedsRegistration(false)
        }
      } catch (e) {
        if (isCancelled) return
        
        const errorCode = e?.code || 
                         e?.originalError?.error?.code || 
                         e?.originalError?.code ||
                         (e?.originalError?.error && typeof e.originalError.error === 'object' ? e.originalError.error.code : null)
        
        const errorMsg = (e?.message || '').toLowerCase()
        const statusCode = e?.status || 0
        
        // Silently handle expected errors (user_not_found, validation_error) - these are informational
        // Only log unexpected errors
        if (errorCode !== 'user_not_found' && errorCode !== 'validation_error' && statusCode !== 400 && statusCode !== 404) {
          console.log('[PasskeySignInOptions] Unexpected error checking passkeys for', email, ':', {
            errorCode,
            message: e?.message,
            statusCode
          })
        }
        
        // Check for no_passkeys error code or message
        if (errorCode === 'no_passkeys' || 
            errorMsg.includes('no passkeys registered') ||
            errorMsg.includes('no passkey') ||
            errorMsg.includes('register a passkey first')) {
          console.log('[PasskeySignInOptions] No passkeys found for', email, '- showing registration option')
          setNeedsRegistration(true)
        } else if (errorCode === 'user_not_found' || statusCode === 404) {
          // User doesn't exist - don't show registration (they need to sign up first)
          // This is expected and not an error - handle silently
          setNeedsRegistration(false)
        } else if (errorCode === 'validation_error' || (statusCode === 400 && errorMsg.includes('invalid'))) {
          // Validation error (e.g., invalid email format) - don't show registration
          // This is expected when email is incomplete - handle silently
          setNeedsRegistration(false)
        } else {
          // Other errors - assume user might have passkeys, don't show registration
          setNeedsRegistration(false)
        }
      } finally {
        if (!isCancelled) {
          setCheckingPasskeys(false)
        }
      }
    }
    
    // Debounce the check to avoid too many requests
    const timer = setTimeout(checkPasskeys, 800)
    return () => {
      isCancelled = true
      clearTimeout(timer)
    }
  }, [form, currentEmail])
  
  // Watch for email field changes by polling (since Ant Design Form doesn't expose onChange easily)
  // This ensures we re-check when email is entered or changed
  React.useEffect(() => {
    if (!form) return
    
    const pollEmail = () => {
      const email = form?.getFieldValue('email') || ''
      setCurrentEmail(prev => {
        // Only update if email actually changed
        if (email !== prev) {
          return email
        }
        return prev
      })
    }
    
    // Check immediately
    pollEmail()
    
    // Poll every 800ms to detect email changes
    const interval = setInterval(pollEmail, 800)
    
    return () => clearInterval(interval)
  }, [form])

  const handlePasskeyAuth = async () => {
    try {
      setLoading(true)
      // Don't reset needsRegistration here - let the error handling determine it

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
      // Following FIDO2/WebAuthn standard flow: if no passkeys exist, offer registration
      const originalErrorMsg = (e?.message || '').toLowerCase()
      const isNoPasskeysError = errorCode === 'no_passkeys' || 
                                originalErrorMsg.includes('no passkeys registered') ||
                                originalErrorMsg.includes('no passkey') ||
                                originalErrorMsg.includes('no passkeys found') ||
                                (originalErrorMsg.includes('passkey') && originalErrorMsg.includes('register') && originalErrorMsg.includes('first'))
      
      // Also check for credential_not_found when no email was provided (userless auth with no matching passkey)
      const isCredentialNotFound = errorCode === 'credential_not_found' || 
                                   originalErrorMsg.includes('credential not recognized') ||
                                   originalErrorMsg.includes('credential not found')
      
      // Check if this is a "no passkeys" scenario
      // This can happen when:
      // 1. Email provided but user has no passkeys (no_passkeys error) - Standard FIDO2 flow
      // 2. No email provided and credential not found in any user (userless auth) - Standard FIDO2 flow
      // 3. 404 status with credential_not_found error
      const emailProvided = form?.getFieldValue('email') ? String(form.getFieldValue('email')).trim() : undefined
      const statusCode = e?.status || e?.originalError?.status
      
      // Determine if we should show registration option
      // Per FIDO2 standard: if authentication fails due to no passkeys, offer registration
      const shouldShowRegistration = isNoPasskeysError || 
                                     (isCredentialNotFound && !emailProvided) ||
                                     (statusCode === 404 && (isCredentialNotFound || originalErrorMsg.includes('credential')) && !emailProvided) ||
                                     (errorCode === 'credential_not_found' && !emailProvided && originalErrorMsg.includes('no passkeys'))
      
      if (shouldShowRegistration) {
        // Show registration option instead of error - this follows FIDO2 standard UX
        console.log('[PasskeySignInOptions] No passkeys detected, showing registration option (FIDO2 standard flow)', {
          errorCode,
          originalErrorMsg,
          isNoPasskeysError,
          isCredentialNotFound,
          emailProvided,
          statusCode,
          error: e
        })
        setNeedsRegistration(true)
        setLoading(false) // Make sure loading is reset so button is clickable
        return
      }
      // Handle specific backend error codes
      else if (errorCode === 'credential_not_found') {
        // If email was provided, this means the passkey doesn't belong to this account
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
      
      // Additional check: if we get credential_not_found with no email, it likely means no passkeys exist
      // This happens in userless mode when the credential doesn't match any user
      if (isCredentialNotFound && !emailProvided) {
        console.log('[PasskeySignInOptions] Credential not found in userless mode - showing registration')
        setNeedsRegistration(true)
        setLoading(false)
        return
      }
      
      // If credential not found and no email was provided, this likely means no passkeys exist
      if ((errorMsgLower.includes('credential not recognized') || 
           errorMsgLower.includes('credential not found') ||
           errorMsgLower.includes('no passkeys found')) && 
          !emailProvided && 
          !errorMsgLower.includes('no passkeys')) {
        // This is likely a "no passkeys" scenario in userless mode
        console.log('[PasskeySignInOptions] No passkeys detected from error message - showing registration')
        setNeedsRegistration(true)
        setLoading(false)
        return
      }
      
      if (errorMsgLower.includes('credential not recognized') || 
          (errorMsgLower.includes('credential not found') && !errorMsgLower.includes('no passkeys'))) {
        // Only show this error if email was provided (means wrong passkey for this account)
        if (emailProvided) {
          errMsg = 'The passkey on this device is not registered for this account. Please use a different passkey or register a new one.'
        } else {
          // No email and credential not found - likely no passkeys exist
          setNeedsRegistration(true)
          setLoading(false)
          return
        }
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
    // Show guide modal first - user will enter email in the modal
    // Pre-fill email from login form if available, but allow them to change it
    const loginFormEmail = form?.getFieldValue('email') ? String(form.getFieldValue('email')).trim() : ''
    registrationForm.setFieldsValue({ email: loginFormEmail })
    setGuideModalVisible(true)
  }

  const handleStartRegistration = async () => {
    try {
      // Validate email from registration form
      await registrationForm.validateFields(['email'])
      const email = registrationForm.getFieldValue('email') ? String(registrationForm.getFieldValue('email')).trim() : undefined
      
      if (!email || !email.includes('@')) {
        notifyError('Please enter a valid email address to register a passkey.')
        return
      }

      setGuideModalVisible(false)
      setLoading(true)
      setNeedsRegistration(false)

      // Register a new passkey using platform authenticator
      // Email comes from registration form, not login form
      // Normalize email to lowercase for consistency
      const normalizedEmail = email.toLowerCase().trim()
      await register({ email: normalizedEmail })
      success('Passkey registered successfully!')

      // Update currentEmail state to trigger passkey check refresh
      setCurrentEmail(normalizedEmail)
      
      // After registration, try to authenticate the user
      // Note: There might be a brief delay for the database to update, so we handle errors gracefully
      try {
        // Use normalized email from registration form for authentication
        const res = await authenticateWithPlatform({ email: normalizedEmail })

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
        {needsRegistration && !checkingPasskeys && (
          <Alert
            message="Register Your Passkey"
            description={
              <div>
                <Text style={{ display: 'block', marginBottom: 8 }}>
                  You don't have a passkey registered yet. Register one now to enable passwordless sign-in with Windows Hello, Touch ID, Face ID, or a security key.
                </Text>
                <Text style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                  <strong>What to expect:</strong> When you click "Register Passkey", you'll be asked to enter your email address, then you'll see a step-by-step guide. Your browser will then prompt you to select where to save your passkey.
                </Text>
                <Text style={{ fontSize: 12, display: 'block' }}>
                  After registration, you'll be automatically signed in and can use your passkey for future logins (with or without entering your email).
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
          loading={loading || checkingPasskeys}
          disabled={loading || checkingPasskeys}
          icon={<SafetyCertificateOutlined />}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          {checkingPasskeys 
            ? 'Checking for passkeys...'
            : loading 
              ? (needsRegistration ? 'Registering passkey...' : 'Signing in...')
              : (needsRegistration ? 'Register Passkey' : 'Sign in with Passkey')
          }
        </Button>
        
        {!needsRegistration && !checkingPasskeys && (
          <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center', display: 'block', marginTop: '8px' }}>
            {currentEmail 
              ? 'Use your passkey to sign in quickly and securely'
              : 'You can sign in with your passkey without entering your email'}
          </Text>
        )}
        
        {needsRegistration && !checkingPasskeys && (
          <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center', display: 'block', marginTop: '8px' }}>
            Register a passkey to enable passwordless sign-in
          </Text>
        )}
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
        onCancel={() => {
          setGuideModalVisible(false)
          registrationForm.resetFields()
        }}
        footer={[
          <Button 
            key="cancel" 
            onClick={() => {
              setGuideModalVisible(false)
              registrationForm.resetFields()
            }}
            disabled={loading}
          >
            Cancel
          </Button>,
          <Button 
            key="start" 
            type="primary" 
            onClick={handleStartRegistration} 
            loading={loading}
            disabled={loading}
          >
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
        <div style={{ padding: '8px 0' }}>
          <Form
            form={registrationForm}
            layout="vertical"
            requiredMark={false}
            style={{ marginBottom: 20 }}
          >
            <Form.Item
              name="email"
              label={<Text strong style={{ fontSize: 14 }}>Email Address</Text>}
              rules={[
                { required: true, message: 'Please enter your email address' },
                { type: 'email', message: 'Please enter a valid email address' }
              ]}
              style={{ marginBottom: 0 }}
            >
              <Input 
                placeholder="Enter your email address"
                size="large"
                autoComplete="email"
                disabled={loading}
              />
            </Form.Item>
          </Form>
          
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 10, color: token.colorText }}>
              Quick Steps
            </Text>
            <Steps
              direction="vertical"
              size="small"
              items={[
                {
                  title: <Text strong style={{ fontSize: 12 }}>Enter Email & Start</Text>,
                  description: (
                    <Text type="secondary" style={{ fontSize: 11, lineHeight: 1.4 }}>
                      Enter your email above and click "Start Registration". Your browser will prompt you to create a passkey.
                    </Text>
                  ),
                  status: 'process',
                  icon: <SafetyCertificateOutlined style={{ color: token.colorPrimary, fontSize: 14 }} />
                },
                {
                  title: <Text strong style={{ fontSize: 12 }}>Choose Authenticator</Text>,
                  description: (
                    <Text type="secondary" style={{ fontSize: 11, lineHeight: 1.4 }}>
                      Select <strong>This device</strong> (biometrics) or <strong>Security key</strong> (USB/NFC).
                    </Text>
                  ),
                  status: 'wait'
                },
                {
                  title: <Text strong style={{ fontSize: 12 }}>Complete & Sign In</Text>,
                  description: (
                    <Text type="secondary" style={{ fontSize: 11, lineHeight: 1.4 }}>
                      Authenticate with your device's biometrics or PIN. You'll be signed in automatically.
                    </Text>
                  ),
                  status: 'wait'
                }
              ]}
            />
          </div>

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${token.colorBorderSecondary}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <MobileOutlined style={{ fontSize: 15, color: token.colorPrimary }} />
              <Text strong style={{ fontSize: 13, color: token.colorText }}>
                ID Melon Authenticator
              </Text>
            </div>
            
            <Space direction="vertical" size={6} style={{ width: '100%', marginBottom: 10 }}>
              <Text type="secondary" style={{ fontSize: 11, lineHeight: 1.5, display: 'block' }}>
                <strong>1. Install:</strong> Download from <a href="https://play.google.com/store/apps/details?id=com.idmelon.authenticator" target="_blank" rel="noopener noreferrer" style={{ color: token.colorPrimary }}>Google Play</a> or <a href="https://apps.apple.com/la/app/idmelon-authenticator/id1511376376" target="_blank" rel="noopener noreferrer" style={{ color: token.colorPrimary }}>App Store</a>.
              </Text>
              <Text type="secondary" style={{ fontSize: 11, lineHeight: 1.5, display: 'block' }}>
                <strong>2. Optional Pairing:</strong> Install <a href="https://www.idmelon.com" target="_blank" rel="noopener noreferrer" style={{ color: token.colorPrimary }}>Pairing Tool</a> for Bluetooth authentication (not required for QR code).
              </Text>
              <Text type="secondary" style={{ fontSize: 11, lineHeight: 1.5, display: 'block' }}>
                <strong>3. Use:</strong> On login page, click "Use a phone or tablet" and scan QR code with ID Melon app to register or sign in.
              </Text>
            </Space>
          </div>
        </div>
      </Modal>
    </>
  )
}
