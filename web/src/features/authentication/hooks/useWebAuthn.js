import React from 'react'
import { 
  registerStart, 
  registerComplete, 
  authenticateStart, 
  authenticateComplete,
  crossDeviceStart,
  crossDeviceStatus,
  crossDeviceComplete
} from '@/features/authentication/services/webauthnService'
import { useAuthNotification } from '@/shared/notifications'
import { isDevLoggingEnabled } from '@/lib/utils'

// Only one navigator.credentials.get() can be in progress at a time (browser limitation).
// Shared across all hook instances to avoid "A request is already pending" when e.g.
// conditional UI is still active and PlatformPasskeyAuth starts another get().
let credentialsGetPending = null

async function withCredentialsGetMutex(fn) {
  while (credentialsGetPending) {
    await credentialsGetPending.catch(() => {})
    credentialsGetPending = null
    await new Promise((r) => setTimeout(r, 150))
  }
  const p = Promise.resolve().then(fn)
  credentialsGetPending = p
  try {
    return await p
  } finally {
    if (credentialsGetPending === p) credentialsGetPending = null
  }
}

// Helpers to convert between base64url and ArrayBuffer
function base64ToBuffer(b64) {
  if (!b64 || typeof b64 !== 'string') {
    throw new Error('Invalid base64 input: expected a string')
  }
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

export default function useWebAuthn() {
  const { notificationSuccess } = useAuthNotification()

  const register = React.useCallback(async ({ email } = {}) => {
    if (!('credentials' in navigator)) throw new Error('WebAuthn not supported')
    
    try {
      // Email is optional - pass empty object if email is not provided
      const start = await registerStart(email ? { email } : {})
      
      // server should return publicKeyCredentialCreationOptions in base64url fields
      // The backend wraps it in { publicKey: options }
      const pub = start?.publicKey || start
      if (!pub) {
        throw new Error('Invalid registration response: missing publicKey. Response: ' + JSON.stringify(start))
      }
      
      // convert challenge and user.id
      const publicKey = { ...pub }
      
      // Handle challenge - simplewebauthn returns it as a base64url string
      if (isDevLoggingEnabled) {
        console.log('Full registration response:', JSON.stringify({ start, pub }, null, 2))
        console.log('pub.challenge:', pub.challenge, 'type:', typeof pub.challenge)
        console.log('pub keys:', Object.keys(pub))
        console.log('pub.user:', pub.user)
      }
      
      if (!pub.challenge) {
        if (isDevLoggingEnabled) {
          console.error('Registration response structure:', { start, pub })
          console.error('Full start object:', start)
        }
        throw new Error('Invalid registration response: missing challenge field. Available keys: ' + Object.keys(pub).join(', '))
      }
      
      // Challenge should be a base64url string from simplewebauthn
      if (typeof pub.challenge !== 'string') {
        if (isDevLoggingEnabled) console.error('Unexpected challenge type:', typeof pub.challenge, pub.challenge)
        throw new Error(`Invalid challenge format: expected string, got ${typeof pub.challenge}`)
      }
      
      publicKey.challenge = base64ToBuffer(pub.challenge)
      
      // Handle user.id - simplewebauthn returns it as a base64url string
      if (pub.user) {
        if (!pub.user.id) {
          throw new Error('Invalid registration response: user object missing id')
        }
        
        if (typeof pub.user.id !== 'string') {
          if (isDevLoggingEnabled) console.error('Unexpected user.id type:', typeof pub.user.id, pub.user.id)
          throw new Error(`Invalid user.id format: expected string, got ${typeof pub.user.id}`)
        }
        
        publicKey.user = { ...pub.user, id: base64ToBuffer(pub.user.id) }
      } else {
        throw new Error('Invalid registration response: missing user object')
      }

      // excludeCredentials: browser expects each descriptor id as ArrayBuffer, not base64url string
      if (Array.isArray(pub.excludeCredentials) && pub.excludeCredentials.length > 0) {
        publicKey.excludeCredentials = pub.excludeCredentials.map((c) => ({
          ...c,
          id: typeof c.id === 'string' ? base64ToBuffer(c.id) : c.id
        }))
      }

      let cred
      try {
        cred = await navigator.credentials.create({ publicKey })
      } catch (webauthnErr) {
        // If user cancelled (NotAllowedError), this is expected behavior - show friendly message
        if (webauthnErr.name === 'NotAllowedError') {
          if (isDevLoggingEnabled) console.log('[useWebAuthn] User cancelled or timed out WebAuthn registration prompt')
          const error = new Error('Registration was cancelled. No worries! You can try again whenever you\'re ready.')
          error.name = webauthnErr.name
          error.originalError = webauthnErr
          error.code = 'user_cancelled'
          throw error
        }
        
        // Preserve WebAuthn error details for better error handling
        if (isDevLoggingEnabled) console.error('[useWebAuthn] WebAuthn create() failed:', webauthnErr)
        // Re-throw with preserved error name and message
        const error = new Error(webauthnErr.message || 'WebAuthn registration failed')
        error.name = webauthnErr.name
        error.originalError = webauthnErr
        throw error
      }
      
      // Prepare attestation response for server
      const att = cred.response
      const payload = {
        id: cred.id,
        rawId: bufferToBase64(cred.rawId),
        type: cred.type,
        response: {
          clientDataJSON: bufferToBase64(att.clientDataJSON),
          attestationObject: bufferToBase64(att.attestationObject),
        }
      }
      // Email is optional - pass empty object if email is not provided
      const res = await registerComplete(email ? { email, credential: payload } : { credential: payload })
      notificationSuccess('Passkey registered', 'Your passkey has been added successfully.')
      return res
    } catch (error) {
      // Re-throw with more context if it's not already a well-formed error
      if (error instanceof Error) {
        throw error
      }
      throw new Error(`Passkey registration failed: ${String(error)}`)
    }
  }, [notificationSuccess])

  const authenticate = React.useCallback(async ({ email, publicKeyOptions = {}, signal } = {}) => {
    if (!('credentials' in navigator)) throw new Error('WebAuthn not supported')
    
    let start
    try {
      // Email is optional - pass empty object if email is not provided
      start = await authenticateStart(email ? { email } : {})
    } catch (startError) {
      // Abort before start: don't surface as user error
      if (signal?.aborted) return
      // Handle "no_passkeys" error from authenticateStart
      const errorCode = startError?.code || 
                       startError?.originalError?.error?.code || 
                       startError?.originalError?.code
      
      if (errorCode === 'no_passkeys') {
        const error = new Error('No passkeys registered for this account. Please sign in with your email and password first, then register a passkey.')
        error.code = errorCode
        error.originalError = startError
        throw error
      }
      
      // Re-throw other errors
      throw startError
    }
    
    if (signal?.aborted) return
    
    const pub = start.publicKey
    if (!pub) {
      throw new Error('Invalid authentication response: missing publicKey')
    }
    const publicKey = { ...pub, ...publicKeyOptions }
    if (!pub.challenge) {
      throw new Error('Invalid authentication response: missing challenge')
    }
    publicKey.challenge = base64ToBuffer(pub.challenge)
    if (pub.allowCredentials) {
      publicKey.allowCredentials = pub.allowCredentials.map(c => {
        if (!c.id) {
          throw new Error('Invalid authentication response: credential missing id')
        }
        return { ...c, id: base64ToBuffer(c.id) }
      })
    }
    const getOptions = { publicKey }
    if (signal != null && typeof AbortSignal !== 'undefined' && signal instanceof AbortSignal) getOptions.signal = signal
    let cred
    try {
      cred = await withCredentialsGetMutex(() => navigator.credentials.get(getOptions))
    } catch (webauthnErr) {
      // AbortError from cleanup (e.g. React Strict Mode remount) - don't surface as user error
      if (webauthnErr.name === 'AbortError') {
        throw webauthnErr
      }
      // If user cancelled (NotAllowedError), this is expected behavior - log as info, not error
      if (webauthnErr.name === 'NotAllowedError') {
        if (isDevLoggingEnabled) console.log('[useWebAuthn] User cancelled or timed out WebAuthn prompt')
        const error = new Error('Authentication was cancelled or timed out. Please try again and approve the prompt when it appears.')
        error.name = webauthnErr.name
        error.originalError = webauthnErr
        error.code = 'user_cancelled'
        throw error
      }
      
      // For other errors, log as error (dev only)
      if (isDevLoggingEnabled) console.error('[useWebAuthn] WebAuthn get() failed:', webauthnErr)
      
      // For other errors, re-throw with preserved error name and message
      const error = new Error(webauthnErr.message || 'WebAuthn authentication failed')
      error.name = webauthnErr.name
      error.originalError = webauthnErr
      throw error
    }
    
    if (signal?.aborted) return
    
    // Only proceed if we got a credential (user didn't cancel)
    if (!cred || !cred.response) {
      throw new Error('No credential received from device')
    }
    
    const resp = cred.response
    const payload = {
      id: cred.id,
      rawId: bufferToBase64(cred.rawId),
      type: cred.type,
      response: {
        clientDataJSON: bufferToBase64(resp.clientDataJSON),
        authenticatorData: bufferToBase64(resp.authenticatorData),
        signature: bufferToBase64(resp.signature),
        userHandle: resp.userHandle ? bufferToBase64(resp.userHandle) : null,
      }
    }
    
    try {
      // Email is optional - pass empty object if email is not provided
      const result = await authenticateComplete(email ? { email, credential: payload } : { credential: payload })
      // Login success shown on destination via navigate state (Option A)
      return result
    } catch (completeError) {
      // Handle backend errors from authenticateComplete (log in dev only)
      if (isDevLoggingEnabled) console.error('[useWebAuthn] authenticateComplete failed:', completeError)
      
      // Extract error code and message
      const errorCode = completeError?.code || 
                       completeError?.originalError?.error?.code || 
                       completeError?.originalError?.code
      
      // If credential not found and no email was provided, it might mean no passkeys exist
      if ((errorCode === 'credential_not_found' || errorCode === 'no_passkeys') && !email) {
        const error = new Error('No passkeys found. Please register a passkey first.')
        error.code = 'no_passkeys'
        error.originalError = completeError
        throw error
      }
      
      // Re-throw with better context
      if (errorCode === 'credential_not_found') {
        const error = new Error('The passkey on this device is not registered for this account. Please use a different passkey or register a new one.')
        error.code = errorCode
        error.originalError = completeError
        throw error
      }
      
      // Re-throw the error as-is (it should already have a good message)
      throw completeError
    }
  }, [])

  // Detect available authenticator types
  const detectAuthenticatorTypes = React.useCallback(async () => {
    if (!('credentials' in navigator)) {
      return { supported: false, platform: false, crossDevice: false }
    }

    try {
      // Check if conditional UI is available (indicates better passkey support)
      const conditionalAvailable = window.PublicKeyCredential?.isConditionalMediationAvailable
        ? await window.PublicKeyCredential.isConditionalMediationAvailable()
        : false

      // Check if platform authenticator is available
      // This is a best-effort check - actual availability depends on device
      const platformAvailable = conditionalAvailable || 
        (navigator.userAgent.includes('Windows') && navigator.userAgent.includes('Chrome')) ||
        (navigator.userAgent.includes('Mac') && navigator.userAgent.includes('Safari')) ||
        (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad'))

      return {
        supported: true,
        platform: platformAvailable,
        crossDevice: true, // Cross-device is generally supported via QR codes
        conditional: conditionalAvailable
      }
    } catch (e) {
      if (isDevLoggingEnabled) console.error('Error detecting authenticator types', e)
      return { supported: true, platform: true, crossDevice: true, conditional: false }
    }
  }, [])

  // Authenticate with platform authenticator (Windows Hello, Touch ID, etc.)
  const authenticateWithPlatform = React.useCallback(async ({ email, signal } = {}) => {
    return authenticate({
      email,
      signal,
      publicKeyOptions: {
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'preferred'
        }
      }
    })
  }, [authenticate])

  /**
   * Conditional UI: start a passkey request that shows as autofill when the user
   * focuses the username/email field. No email is sent — discoverable credentials
   * only. Pass an AbortSignal to cancel when starting a modal passkey (e.g. button).
   * Returns a Promise that resolves when the user selects a passkey (with the user
   * object) or null if cancelled/unsupported/aborted.
   */
  const authenticateConditional = React.useCallback(async (signal) => {
    if (!('credentials' in navigator)) return null
    const isCMA = window.PublicKeyCredential?.isConditionalMediationAvailable
      ? await window.PublicKeyCredential.isConditionalMediationAvailable()
      : false
    if (!isCMA) return null

    let start
    try {
      start = await authenticateStart({})
    } catch (err) {
      if (err?.code === 'no_passkeys' || (err?.message || '').toLowerCase().includes('no passkey')) {
        return null
      }
      throw err
    }

    const pub = start?.publicKey
    if (!pub?.challenge) throw new Error('Invalid authentication response')
    const publicKey = { ...pub, challenge: base64ToBuffer(pub.challenge) }
    if (pub.allowCredentials?.length) {
      publicKey.allowCredentials = pub.allowCredentials.map(c => ({
        ...c,
        id: base64ToBuffer(c.id)
      }))
    }

    const getOptions = { publicKey, mediation: 'conditional' }
    if (signal != null && typeof AbortSignal !== 'undefined' && signal instanceof AbortSignal) getOptions.signal = signal

    let cred
    try {
      cred = await withCredentialsGetMutex(() => navigator.credentials.get(getOptions))
    } catch (webauthnErr) {
      if (webauthnErr.name === 'NotAllowedError' || webauthnErr.name === 'AbortError') return null
      throw webauthnErr
    }

    if (!cred?.response) return null
    const resp = cred.response
    const payload = {
      id: cred.id,
      rawId: bufferToBase64(cred.rawId),
      type: cred.type,
      response: {
        clientDataJSON: bufferToBase64(resp.clientDataJSON),
        authenticatorData: bufferToBase64(resp.authenticatorData),
        signature: bufferToBase64(resp.signature),
        userHandle: resp.userHandle ? bufferToBase64(resp.userHandle) : null
      }
    }

    try {
      const result = await authenticateComplete({ credential: payload })
      // Login success shown on destination via navigate state (Option A)
      return result
    } catch (completeErr) {
      if (isDevLoggingEnabled) console.error('[useWebAuthn] authenticateConditional complete failed', completeErr)
      throw completeErr
    }
  }, [])

  // Start cross-device authentication
  const authenticateCrossDevice = React.useCallback(async ({ email, allowRegistration = false } = {}) => {
    // Email is optional - pass empty object if email is not provided
    // Start cross-device authentication session (or registration if allowRegistration is true)
    const result = await crossDeviceStart(email ? { email, allowRegistration } : { allowRegistration })
    
    // Accept either qrCodeImage (preferred, Microsoft-compatible) or qrCode/qrCodeUrl (fallback)
    const hasQrCode = result?.qrCodeImage || result?.qrCode || result?.qrCodeUrl
    if (!hasQrCode || !result?.sessionId) {
      throw new Error('Failed to start cross-device authentication')
    }
    
    return result
  }, [])

  // Check cross-device authentication status
  const checkCrossDeviceStatus = React.useCallback(async ({ sessionId } = {}) => {
    if (!sessionId) throw new Error('Session ID is required')
    return await crossDeviceStatus({ sessionId })
  }, [])

  // Complete cross-device authentication (called from mobile device)
  const completeCrossDeviceAuth = React.useCallback(async ({ sessionId, credential } = {}) => {
    if (!sessionId || !credential) {
      throw new Error('Session ID and credential are required')
    }
    return await crossDeviceComplete({ sessionId, credential })
  }, [])

  return { 
    register, 
    authenticate,
    authenticateConditional,
    detectAuthenticatorTypes,
    authenticateWithPlatform,
    authenticateCrossDevice,
    checkCrossDeviceStatus,
    completeCrossDeviceAuth
  }
}
