import React from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Button, Card, Typography, Spin, Alert, Space } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { AuthLayout } from '@/features/authentication'
import useWebAuthn from '../hooks/useWebAuthn.js'
import { crossDeviceComplete, crossDeviceAuthOptions } from '../services/webauthnService.js'
import { useNotifier } from '@/shared/notifications.js'

const { Title, Text } = Typography

// Helper to convert between base64url and ArrayBuffer
function base64ToBuffer(b64) {
  const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'))
  const len = bin.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i)
  return bytes.buffer
}

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export default function PasskeyMobileAuth() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { success, error: notifyError } = useNotifier()
  const { authenticate } = useWebAuthn()
  
  const [status, setStatus] = React.useState('pending') // 'pending' | 'authenticating' | 'success' | 'error'
  const [error, setError] = React.useState(null)
  const [sessionId, setSessionId] = React.useState(null)
  
  // Extract session ID from URL parameters (browser-based flow)
  // Check multiple possible parameter names for compatibility
  React.useEffect(() => {
    let extractedSessionId = searchParams.get('sessionId') || 
                             searchParams.get('session_id') || 
                             searchParams.get('session')
    
    const challengeFromUrl = searchParams.get('challenge')
    const rpIdFromUrl = searchParams.get('rpId') || searchParams.get('rp_id')
    const typeFromUrl = searchParams.get('type')
    
    // If session ID not in URL, check if we have JSON pairing data in hash or query
    // (ID Melon might pass JSON data differently)
    if (!extractedSessionId) {
      // Check for JSON pairing data in URL hash (some apps use this)
      const hash = window.location.hash
      if (hash && hash.startsWith('#') && hash.length > 1) {
        try {
          const jsonData = JSON.parse(decodeURIComponent(hash.substring(1)))
          if (jsonData.sessionId) {
            extractedSessionId = jsonData.sessionId
            console.log('[PasskeyMobileAuth] Extracted sessionId from JSON in hash:', jsonData.sessionId)
          }
          if (jsonData.challenge || jsonData.rpId || jsonData.rp_id) {
            console.log('[PasskeyMobileAuth] Pairing data from JSON:', {
              challenge: jsonData.challenge ? 'present' : 'missing',
              rpId: jsonData.rpId || jsonData.rp_id || 'missing',
              type: jsonData.type || 'missing',
              sessionId: jsonData.sessionId || 'missing'
            })
          }
        } catch (e) {
          // Not JSON, ignore
        }
      }
      
      // Also check query parameter 'data' which might contain JSON
      const dataParam = searchParams.get('data')
      if (!extractedSessionId && dataParam) {
        try {
          const jsonData = JSON.parse(decodeURIComponent(dataParam))
          if (jsonData.sessionId || jsonData.session_id || jsonData.session) {
            extractedSessionId = jsonData.sessionId || jsonData.session_id || jsonData.session
            console.log('[PasskeyMobileAuth] Extracted sessionId from data parameter:', extractedSessionId)
          }
        } catch (e) {
          // Not JSON, ignore
        }
      }
    }
    
    // Log pairing fields for debugging (especially useful for ID Melon)
    if (challengeFromUrl || rpIdFromUrl || typeFromUrl) {
      console.log('[PasskeyMobileAuth] Pairing fields from URL parameters:', {
        challenge: challengeFromUrl ? 'present' : 'missing',
        rpId: rpIdFromUrl || 'missing',
        type: typeFromUrl || 'missing',
        sessionId: extractedSessionId || 'missing'
      })
    }
    
    setSessionId(extractedSessionId)
  }, [searchParams])
  
  React.useEffect(() => {
    if (!sessionId) {
      setError('Invalid session. Please scan the QR code again.')
      setStatus('error')
      return
    }

    // Automatically start authentication when sessionId is available
    handleAuthenticate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  const handleAuthenticate = async () => {
    if (!sessionId) {
      setError('Session ID is missing')
      setStatus('error')
      return
    }

    try {
      setStatus('authenticating')
      setError(null)

      // First, get authentication options from backend using the session
      // We need to get the email from the session, but for now we'll use a workaround
      // The backend should provide a way to get session info
      const sessionInfoResponse = await fetch(`/api/auth/webauthn/cross-device/status/${sessionId}`)
      if (!sessionInfoResponse.ok) {
        throw new Error('Session not found or expired')
      }

      // For cross-device, we need to get the authentication options
      // Since we don't have email in the session, we'll need to modify the backend
      // For now, let's try to authenticate with the session
      // The backend should store the email in the session
      
      // Get authentication options - we need email, but session should have it
      // Let's call authenticateStart with a placeholder and see if backend can use session
      // Actually, we need to modify the flow - the backend should return email in status check
      
      // Get auth options from backend using session
      // ID Melon can request either registration or authentication
      // Try authentication first (if ID Melon has account), then fall back to registration
      console.log('[PasskeyMobileAuth] Getting auth options for sessionId:', sessionId?.substring(0, 20) + '...')
      
      let pub, email, type
      let cred
      
      // First, try to get authentication options (if ID Melon already has account)
      try {
        const authResult = await crossDeviceAuthOptions({ sessionId, type: 'authenticate' })
        pub = authResult.publicKey
        email = authResult.email
        type = authResult.type || 'authenticate'
        
        console.log('[PasskeyMobileAuth] Auth options received (authentication):', {
          hasPublicKey: !!pub,
          email: email,
          type: type,
          hasChallenge: !!pub?.challenge,
          hasAllowCredentials: !!pub?.allowCredentials,
          allowCredentialsCount: pub?.allowCredentials?.length || 0
        })
      } catch (authErr) {
        // If authentication fails (e.g., no passkeys), try registration
        console.log('[PasskeyMobileAuth] Authentication not available, trying registration:', authErr?.message)
        
        try {
          const regResult = await crossDeviceAuthOptions({ sessionId, type: 'register' })
          pub = regResult.publicKey
          email = regResult.email
          type = regResult.type || 'register'
          
          console.log('[PasskeyMobileAuth] Auth options received (registration):', {
            hasPublicKey: !!pub,
            email: email,
            type: type,
            hasChallenge: !!pub?.challenge,
            hasUser: !!pub?.user
          })
        } catch (regErr) {
          console.error('[PasskeyMobileAuth] Both authentication and registration failed:', {
            authError: authErr?.message,
            regError: regErr?.message
          })
          throw new Error('Failed to get authentication options. Please try scanning the QR code again.')
        }
      }
      
      if (!pub || !pub.challenge) {
        throw new Error('Invalid authentication options received from server')
      }
      
      if (type === 'register') {
        // Handle registration flow
        console.log('[PasskeyMobileAuth] Starting registration flow')
        const publicKey = { ...pub }
        publicKey.challenge = base64ToBuffer(pub.challenge)
        if (pub.user && pub.user.id) {
          publicKey.user = { ...pub.user, id: base64ToBuffer(pub.user.id) }
        }
        
        // Trigger WebAuthn registration on mobile device
        try {
          cred = await navigator.credentials.create({ publicKey })
          console.log('[PasskeyMobileAuth] Registration credential created successfully')
        } catch (webauthnErr) {
          console.error('[PasskeyMobileAuth] WebAuthn registration failed:', webauthnErr)
          if (webauthnErr.name === 'NotAllowedError') {
            throw new Error('Registration was cancelled. No worries! You can try again whenever you\'re ready.')
          } else if (webauthnErr.name === 'InvalidStateError') {
            throw new Error('Passkey already exists. Please use a different device or remove the existing passkey.')
          } else {
            throw new Error(`Registration failed: ${webauthnErr.message || 'Unknown error'}`)
          }
        }
      } else {
        // Handle authentication flow
        console.log('[PasskeyMobileAuth] Starting authentication flow')
        const publicKey = { ...pub }
        publicKey.challenge = base64ToBuffer(pub.challenge)
        if (pub.allowCredentials) {
          publicKey.allowCredentials = pub.allowCredentials.map(c => ({ 
            ...c, 
            id: base64ToBuffer(c.id) 
          }))
        }

        // Trigger WebAuthn authentication on mobile device
        try {
          cred = await navigator.credentials.get({ publicKey })
          console.log('[PasskeyMobileAuth] Authentication credential retrieved successfully')
        } catch (webauthnErr) {
          console.error('[PasskeyMobileAuth] WebAuthn authentication failed:', webauthnErr)
          
          // If authentication fails because no passkey found, try registration instead
          // This allows ID Melon to register if it doesn't have an account yet (like Google Lens)
          if (webauthnErr.name === 'NotFoundError' || webauthnErr.name === 'InvalidStateError') {
            console.log('[PasskeyMobileAuth] No passkey found for authentication, trying registration instead...')
            
            try {
              // Try to get registration options
              const regResult = await crossDeviceAuthOptions({ sessionId, type: 'register' })
              pub = regResult.publicKey
              email = regResult.email
              type = 'register'
              
              console.log('[PasskeyMobileAuth] Registration options received:', {
                hasPublicKey: !!pub,
                email: email,
                type: type,
                hasChallenge: !!pub?.challenge,
                hasUser: !!pub?.user
              })
              
              if (!pub || !pub.challenge) {
                throw new Error('Invalid registration options received from server')
              }
              
              // Continue with registration flow below
            } catch (regErr) {
              console.error('[PasskeyMobileAuth] Registration also failed:', regErr)
              throw new Error('No passkey found. Please register a passkey first.')
            }
          } else if (webauthnErr.name === 'NotAllowedError') {
            throw new Error('Authentication was cancelled. No worries! You can try again whenever you\'re ready.')
          } else {
            throw new Error(`Authentication failed: ${webauthnErr.message || 'Unknown error'}`)
          }
        }
      }
      const resp = cred.response

      // Prepare credential payload (different for registration vs authentication)
      let credentialPayload
      
      if (type === 'register') {
        // Registration payload
        credentialPayload = {
          id: cred.id,
          rawId: bufferToBase64(cred.rawId),
          type: cred.type,
          response: {
            clientDataJSON: bufferToBase64(resp.clientDataJSON),
            attestationObject: bufferToBase64(resp.attestationObject),
          }
        }
      } else {
        // Authentication payload
        // Ensure all fields are properly formatted for ID Melon and other authenticators
        credentialPayload = {
          id: cred.id, // base64url string
          rawId: bufferToBase64(cred.rawId), // base64url string from ArrayBuffer
          type: cred.type || 'public-key',
          response: {
            clientDataJSON: bufferToBase64(resp.clientDataJSON),
            authenticatorData: bufferToBase64(resp.authenticatorData),
            signature: bufferToBase64(resp.signature),
            userHandle: resp.userHandle ? bufferToBase64(resp.userHandle) : null,
          }
        }
        
        // Log credential format for debugging (especially for ID Melon)
        console.log('[PasskeyMobileAuth] Credential payload prepared:', {
          id: credentialPayload.id?.substring(0, 20) + '...',
          rawId: credentialPayload.rawId?.substring(0, 20) + '...',
          type: credentialPayload.type,
          hasClientDataJSON: !!credentialPayload.response.clientDataJSON,
          hasAuthenticatorData: !!credentialPayload.response.authenticatorData,
          hasSignature: !!credentialPayload.response.signature,
        })
      }

      // Complete cross-device authentication
      console.log('[PasskeyMobileAuth] Completing cross-device authentication with sessionId:', sessionId?.substring(0, 20) + '...')
      
      let result
      try {
        console.log('[PasskeyMobileAuth] Calling crossDeviceComplete with:', {
          sessionId: sessionId?.substring(0, 20) + '...',
          hasCredential: !!credentialPayload,
          credentialType: credentialPayload?.type,
          hasResponse: !!credentialPayload?.response
        })
        
        result = await crossDeviceComplete({
          sessionId,
          credential: credentialPayload,
        })
        
        console.log('[PasskeyMobileAuth] crossDeviceComplete response received:', {
          type: typeof result,
          isObject: typeof result === 'object',
          authenticated: result?.authenticated,
          hasUser: !!result?.user,
          registered: result?.registered,
          ok: result?.ok,
          error: result?.error,
          keys: result ? Object.keys(result) : []
        })
      } catch (completeError) {
        console.error('[PasskeyMobileAuth] crossDeviceComplete threw error:', {
          error: completeError,
          name: completeError?.name,
          message: completeError?.message,
          code: completeError?.code,
          originalError: completeError?.originalError,
          stack: completeError?.stack
        })
        
        // Extract error message from the thrown error
        let errorMsg = 'Failed to complete authentication. Please try again.'
        
        // Check error message first
        if (completeError?.message && typeof completeError.message === 'string') {
          const msg = completeError.message.trim()
          if (msg && !msg.toLowerCase().includes('something went wrong')) {
            errorMsg = msg
          }
        }
        
        // Check originalError structure (backend format: { ok: false, error: { code, message } })
        if (errorMsg === 'Failed to complete authentication. Please try again.' && completeError?.originalError) {
          const orig = completeError.originalError
          if (orig?.error) {
            if (typeof orig.error === 'string') {
              errorMsg = orig.error
            } else if (orig.error?.message) {
              errorMsg = orig.error.message
            } else if (orig.error?.code) {
              // Map error codes to user-friendly messages
              const codeMap = {
                'cross_device_complete_failed': 'Failed to complete authentication. Please try again.',
                'webauthn_verification_failed': 'Passkey verification failed. Please try again.',
                'webauthn_auth_failed': 'Authentication failed. Please try again.',
                'credential_not_found': 'Passkey not found. Please register a passkey first.',
                'session_not_found': 'Session expired. Please scan the QR code again.',
                'session_expired': 'Session expired. Please scan the QR code again.',
              }
              errorMsg = codeMap[orig.error.code] || `Authentication error: ${orig.error.code}`
            }
          } else if (orig?.message) {
            errorMsg = orig.message
          }
        }
        
        // Ensure we never show "Something went wrong"
        if (errorMsg.toLowerCase().includes('something went wrong')) {
          errorMsg = 'Failed to complete authentication. Please try again.'
        }
        
        throw new Error(errorMsg)
      }

      console.log('[PasskeyMobileAuth] Cross-device complete result:', {
        authenticated: result?.authenticated,
        hasUser: !!result?.user,
        registered: result?.registered,
        error: result?.error,
        ok: result?.ok,
        fullResult: result
      })

      // Check if result indicates success
      if (result?.authenticated && result?.user) {
        setStatus('success')
        if (result?.registered) {
          success('Passkey registered and signed in successfully!')
        } else {
          success('Authentication approved')
        }
        
        // Close the page after a short delay
        setTimeout(() => {
          window.close()
          // If window.close doesn't work (some browsers block it), show a message
          if (!document.hidden) {
            // Page is still visible, show success message
          }
        }, 2000)
      } else if (result?.ok === false || result?.error) {
        // Backend returned an error response
        const errorMsg = result?.error?.message || 
                        (typeof result?.error === 'string' ? result.error : null) ||
                        result?.message || 
                        'Authentication failed. Please try again.'
        throw new Error(errorMsg)
      } else {
        // Unexpected response format
        throw new Error('Unexpected response from server. Please try again.')
      }
    } catch (e) {
      console.error('[PasskeyMobileAuth] Authentication failed with full error:', {
        error: e,
        message: e?.message,
        code: e?.code,
        originalError: e?.originalError,
        stack: e?.stack
      })
      
      // Extract meaningful error message from various error formats
      let errMsg = 'Failed to authenticate. Please try again.'
      
      // Handle WebAuthn-specific errors first
      if (e?.name === 'NotAllowedError') {
        errMsg = 'Authentication was cancelled or timed out. Please try again and approve the prompt when it appears.'
      } else if (e?.name === 'InvalidStateError') {
        errMsg = 'No passkey found. Please register a passkey first by signing in with your email and password.'
      } else if (e?.name === 'NotFoundError') {
        errMsg = 'No passkey found on this device. Please register a passkey first.'
      } else if (e?.name === 'SecurityError') {
        errMsg = 'Security error. Please make sure you\'re using a supported browser and try again.'
      } else if (e?.name === 'NotSupportedError') {
        errMsg = 'Passkeys are not supported on this device or browser. Please use a different device or browser.'
      } else if (e?.name === 'AbortError') {
        errMsg = 'Authentication was cancelled. Please try again.'
      } else {
        // Try to extract error message from different error structures
        // Backend error format: { ok: false, error: { code, message } }
        // The http.js already extracts this, so e.message should have it
        if (e?.message && typeof e.message === 'string' && e.message.trim()) {
          const trimmed = e.message.trim()
          // Don't use generic messages
          if (trimmed && !trimmed.toLowerCase().includes('something went wrong')) {
            errMsg = trimmed
          }
        }
        
        // Check originalError for nested structures
        if (errMsg === 'Failed to authenticate. Please try again.' && e?.originalError) {
          const orig = e.originalError
          
          // Backend format: { ok: false, error: { code, message } }
          if (orig?.error) {
            if (typeof orig.error === 'string') {
              errMsg = orig.error
            } else if (orig.error?.message) {
              errMsg = orig.error.message
            } else if (orig.error?.code) {
              // Map error codes to user-friendly messages
              const codeMessages = {
                'cross_device_complete_failed': 'Failed to complete authentication. Please try again.',
                'webauthn_verification_failed': 'Passkey verification failed. Please try again.',
                'webauthn_auth_failed': 'Authentication failed. Please try again.',
                'credential_not_found': 'Passkey not found. Please register a passkey first.',
                'session_not_found': 'Session expired. Please scan the QR code again.',
                'session_expired': 'Session expired. Please scan the QR code again.',
              }
              errMsg = codeMessages[orig.error.code] || `Authentication error: ${orig.error.code}`
            }
          } else if (orig?.message) {
            errMsg = orig.message
          } else if (typeof orig === 'string') {
            errMsg = orig
          }
        }
      }
      
      // Check for specific error types from backend
      const errorCode = e?.code || 
                       e?.originalError?.error?.code || 
                       e?.originalError?.code ||
                       (e?.originalError?.error && typeof e.originalError.error === 'object' ? e.originalError.error.code : null)
      
      // Provide more helpful error messages based on error code
      if (errorCode === 'session_not_found' || errorCode === 'session_expired') {
        errMsg = 'Session expired. Please scan the QR code again.'
      } else if (errorCode === 'credential_not_found') {
        errMsg = 'Passkey not found. Please register a passkey first.'
      } else if (errorCode === 'webauthn_verification_failed' || errorCode === 'webauthn_auth_failed') {
        errMsg = 'Passkey verification failed. Please try again.'
      } else if (errorCode === 'cross_device_complete_failed') {
        errMsg = 'Failed to complete authentication. Please try again.'
      } else if (errMsg.toLowerCase().includes('network') || errMsg.toLowerCase().includes('fetch')) {
        errMsg = 'Network error. Please check your connection and try again.'
      } else if (errMsg.toLowerCase().includes('session')) {
        errMsg = 'Session error. Please scan the QR code again.'
      } else if (errMsg.toLowerCase().includes('request failed')) {
        errMsg = 'Server error. Please try again later.'
      } else if (errMsg.toLowerCase().includes('something went wrong')) {
        // Replace generic "Something went wrong" with more specific message
        errMsg = 'Authentication failed. Please check your passkey and try again.'
      }
      
      // Ensure we have a user-friendly message
      if (errMsg === 'Failed to authenticate. Please try again.' && e?.message) {
        // If we still have the generic message, try to use the original error message
        const originalMsg = String(e.message || '').trim()
        if (originalMsg && originalMsg.length < 200 && !originalMsg.toLowerCase().includes('something went wrong')) {
          errMsg = originalMsg
        }
      }
      
      // Ensure we never show "Something went wrong"
      if (errMsg.toLowerCase().includes('something went wrong')) {
        errMsg = 'Authentication failed. Please try again.'
      }
      
      console.log('[PasskeyMobileAuth] Final error message:', errMsg)
      
      // Ensure we never pass "Something went wrong" to the notifier
      let finalErrorMsg = String(errMsg).trim() || 'Authentication failed. Please try again.'
      
      if (finalErrorMsg.toLowerCase().includes('something went wrong')) {
        finalErrorMsg = 'Authentication failed. Please try scanning the QR code again.'
      }
      
      // Log the full error for debugging (especially for ID Melon issues)
      console.error('[PasskeyMobileAuth] Error details for debugging:', {
        finalErrorMsg,
        originalError: e,
        errorCode: e?.code,
        originalErrorStructure: e?.originalError,
        errorMessage: e?.message,
        errorName: e?.name,
        errorStack: e?.stack,
        fullError: JSON.stringify(e, Object.getOwnPropertyNames(e), 2)
      })
      
      // Ensure finalErrorMsg never contains "Something went wrong"
      let safeErrorMsg = finalErrorMsg
      if (safeErrorMsg.toLowerCase().includes('something went wrong')) {
        safeErrorMsg = 'Authentication failed. Please try scanning the QR code again.'
        console.warn('[PasskeyMobileAuth] Replaced "Something went wrong" with:', safeErrorMsg)
      }
      
      setError(safeErrorMsg)
      setStatus('error')
      // Pass the error message string directly, not the error object
      notifyError(safeErrorMsg)
    }
  }

  const handleDeny = () => {
    setStatus('error')
    setError('Sign-in request denied')
    notifyError('Sign-in request denied')
    
    // Close the page after a short delay
    setTimeout(() => {
      window.close()
    }, 2000)
  }

  if (!sessionId) {
    return (
      <AuthLayout>
        <Card>
          <Alert
            message="Invalid Session"
            description="The authentication session is invalid or expired. Please scan the QR code again."
            type="error"
            showIcon
          />
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <Card style={{ maxWidth: 400, margin: '0 auto' }}>
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <Title level={3}>Approve Sign-In</Title>
          
          {status === 'pending' && (
            <>
              <Text type="secondary" style={{ marginBottom: 16 }}>
                A sign-in request is waiting for your approval on another device.
              </Text>
              <Text type="secondary" style={{ fontSize: 12, marginBottom: 24 }}>
                This page will automatically prompt you to authenticate using your device's passkey.
              </Text>
              <Spin size="large" />
            </>
          )}

          {status === 'authenticating' && (
            <>
              <Text type="secondary" style={{ marginBottom: 24 }}>
                Please use your device's biometric authentication or passcode to {sessionId ? 'approve the sign-in' : 'complete setup'}.
                <br />
                <strong>Your browser will show a prompt</strong> - use Face ID, Touch ID, fingerprint, or your device PIN.
              </Text>
              <Spin size="large" style={{ marginBottom: 24 }} />
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Space size="middle">
                  <Button onClick={handleDeny} danger size="large" style={{ minWidth: 120 }}>
                    Deny
                  </Button>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    You can cancel at any time
                  </Text>
                </Space>
                <Alert
                  message="Using Your Browser for Passkey Authentication"
                  description="Passkeys work through your browser (Safari/Chrome). You can use built-in features or password managers like 1Password or Bitwarden that support passkeys."
                  type="info"
                  showIcon
                  style={{ fontSize: 12 }}
                />
              </Space>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a' }} />
              <Title level={4} style={{ color: '#52c41a' }}>Approved</Title>
              <Text type="secondary">
                You can close this page. The sign-in will complete on the other device.
              </Text>
            </>
          )}

          {status === 'error' && (
            <>
              <CloseCircleOutlined style={{ fontSize: 64, color: '#ff4d4f' }} />
              <Title level={4} style={{ color: '#ff4d4f' }}>Authentication Failed</Title>
              {error && (
                <Alert
                  message="Error"
                  description={error}
                  type="error"
                  showIcon
                  style={{ marginBottom: 16, textAlign: 'left' }}
                />
              )}
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Button type="primary" onClick={handleAuthenticate} block size="large">
                  Try Again
                </Button>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Make sure you're using a supported browser (Safari on iOS, Chrome on Android) and have a passkey registered for this account.
                </Text>
              </Space>
            </>
          )}
        </Space>
      </Card>
    </AuthLayout>
  )
}
