import { App } from 'antd'
import { useMemo } from 'react'

// Extract a human-friendly error message with sensible fallback
export function extractErrorMessage(err, fallback = 'An error occurred. Please try again.') {
  if (!err) return String(fallback)
  
  // Handle string errors directly
  if (typeof err === 'string') {
    const trimmed = err.trim()
    // Never return "Something went wrong" - use a better fallback
    if (trimmed && !trimmed.toLowerCase().includes('something went wrong')) {
      return trimmed
    }
    return String(fallback)
  }
  
  // Handle Error objects
  if (err instanceof Error) {
    if (err.message && typeof err.message === 'string' && err.message.trim()) {
      const msg = err.message.trim()
      // Never return "Something went wrong"
      if (!msg.toLowerCase().includes('something went wrong')) {
        return msg
      }
    }
    // For WebAuthn errors, use the error name if message is not helpful
    if (err.name && err.name !== 'Error') {
      return `${err.name}: ${err.message || 'An error occurred'}`
    }
  }
  
  // Handle objects with message property
  if (typeof err?.message === 'string' && err.message.trim()) {
    const msg = err.message.trim()
    if (!msg.toLowerCase().includes('something went wrong')) {
      return msg
    }
  }
  
  // Handle nested error structures (common in API responses)
  // Backend format: { ok: false, error: { code, message } }
  if (err?.error) {
    if (typeof err.error === 'string') {
      const msg = err.error.trim()
      if (msg && !msg.toLowerCase().includes('something went wrong')) {
        return msg
      }
    }
    if (err.error?.message && typeof err.error.message === 'string') {
      const msg = err.error.message.trim()
      if (msg && !msg.toLowerCase().includes('something went wrong')) {
        return msg
      }
    }
    // Try error code mapping for better messages
    if (err.error?.code) {
      const codeMap = {
        'webauthn_verification_failed': 'Passkey verification failed. Please try again.',
        'webauthn_verification_exception': 'Registration failed. Please try again.',
        'webauthn_auth_failed': 'Authentication failed. Please try again.',
        'webauthn_invalid_publickey': 'Invalid passkey format. Please try again.',
        'credential_not_found': 'Passkey not found. Please register a passkey first.',
        'session_not_found': 'Session expired. Please scan the QR code again.',
        'session_expired': 'Session expired. Please scan the QR code again.',
        'challenge_missing': 'Session error. Please scan the QR code again.',
        'cross_device_complete_failed': 'Failed to complete authentication. Please try again.',
        'user_not_found': 'User not found. Please check your email and try again.',
      }
      const mappedMsg = codeMap[err.error.code]
      if (mappedMsg) return mappedMsg
    }
  }
  
  // Check originalError (from http.js error structure)
  if (err?.originalError) {
    const orig = err.originalError
    if (orig?.error) {
      if (typeof orig.error === 'string') {
        const msg = orig.error.trim()
        if (msg && !msg.toLowerCase().includes('something went wrong')) {
          return msg
        }
      }
      if (orig.error?.message) {
        const msg = orig.error.message.trim()
        if (msg && !msg.toLowerCase().includes('something went wrong')) {
          return msg
        }
      }
      if (orig.error?.code) {
        const codeMap = {
          'webauthn_verification_failed': 'Passkey verification failed. Please try again.',
          'webauthn_verification_exception': 'Registration failed. Please try again.',
          'webauthn_auth_failed': 'Authentication failed. Please try again.',
          'webauthn_invalid_publickey': 'Invalid passkey format. Please try again.',
          'credential_not_found': 'Passkey not found. Please register a passkey first.',
          'session_not_found': 'Session expired. Please scan the QR code again.',
          'session_expired': 'Session expired. Please scan the QR code again.',
          'challenge_missing': 'Session error. Please scan the QR code again.',
          'cross_device_complete_failed': 'Failed to complete authentication. Please try again.',
        }
        const mappedMsg = codeMap[orig.error.code]
        if (mappedMsg) return mappedMsg
      }
    }
  }
  
  // Try to stringify as last resort (but avoid "Something went wrong")
  try {
    const s = JSON.stringify(err)
    if (s && s.length < 200 && s !== '{}' && !s.toLowerCase().includes('something went wrong')) {
      return s
    }
  } catch (e) { void e }
  
  return String(fallback)
}

// Create a notifier from a provided antd message api
export function createNotifier(messageApi) {
  const success = (text, duration) => {
    if (!messageApi?.success) return
    messageApi.success(String(text), duration)
  }
  const info = (text, duration) => {
    if (!messageApi?.info) return
    messageApi.info(String(text), duration)
  }
  const warning = (text, duration) => {
    if (!messageApi?.warning) return
    messageApi.warning(String(text), duration)
  }
  const error = (err, fallback = 'An error occurred. Please try again.', duration) => {
    if (!messageApi?.error) return
    // Ensure fallback is never "Something went wrong"
    const safeFallback = fallback && !fallback.toLowerCase().includes('something went wrong') 
      ? fallback 
      : 'An error occurred. Please try again.'
    const msg = extractErrorMessage(err, safeFallback)
    // Double-check the extracted message is safe
    const finalMsg = msg && !msg.toLowerCase().includes('something went wrong') 
      ? msg 
      : safeFallback
    messageApi.error(finalMsg, duration)
  }
  return { success, info, warning, error }
}

// Convenience hook to access notifier in React components/hooks
export function useNotifier() {
  const { message } = App.useApp()
  return useMemo(() => createNotifier(message), [message])
}