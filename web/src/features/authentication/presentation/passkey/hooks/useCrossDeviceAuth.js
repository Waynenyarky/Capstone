/**
 * Presentation Layer Hook: useCrossDeviceAuth
 * Handles cross-device authentication flow
 */
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CrossDeviceAuthUseCase } from '@/features/authentication/domain/passkey/useCases/CrossDeviceAuthUseCase'
import { WebAuthnRepository } from '@/features/authentication/application/passkey'
import * as webauthnService from '@/features/authentication/services/webauthnService'
import { useNotifier } from '@/shared/notifications'

export function useCrossDeviceAuth() {
  const [searchParams] = useSearchParams()
  const { success, error: notifyError } = useNotifier()
  
  const [status, setStatus] = useState('pending')
  const [error, setError] = useState(null)
  const [sessionId, setSessionId] = useState(null)

  // Initialize repository and use case
  const webauthnRepo = new WebAuthnRepository(webauthnService)
  const crossDeviceUseCase = new CrossDeviceAuthUseCase({ webauthnRepository: webauthnRepo })

  // Extract session ID from URL
  useEffect(() => {
    let extractedSessionId = searchParams.get('sessionId') || 
                             searchParams.get('session_id') || 
                             searchParams.get('session')
    
    // Check for JSON pairing data in hash
    if (!extractedSessionId) {
      const hash = window.location.hash
      if (hash && hash.startsWith('#') && hash.length > 1) {
        try {
          const jsonData = JSON.parse(decodeURIComponent(hash.substring(1)))
          extractedSessionId = jsonData.sessionId || jsonData.session_id || jsonData.session
        } catch {
          // Not JSON, ignore
        }
      }
    }
    
    // Check query parameter 'data'
    if (!extractedSessionId) {
      const dataParam = searchParams.get('data')
      if (dataParam) {
        try {
          const jsonData = JSON.parse(decodeURIComponent(dataParam))
          extractedSessionId = jsonData.sessionId || jsonData.session_id || jsonData.session
        } catch {
          // Not JSON, ignore
        }
      }
    }
    
    setSessionId(extractedSessionId)
  }, [searchParams])

  // Auto-start authentication when sessionId is available
  useEffect(() => {
    if (!sessionId) {
      setError('Invalid session. Please scan the QR code again.')
      setStatus('error')
      return
    }
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

      const result = await crossDeviceUseCase.execute({ sessionId })

      if (result.success && result.result?.authenticated && result.result?.user) {
        setStatus('success')
        if (result.result?.registered) {
          success('Passkey registered and signed in successfully!')
        } else {
          success('Authentication approved')
        }
        
        setTimeout(() => {
          window.close()
        }, 2000)
      } else if (result.cancelled) {
        setError('Authentication was cancelled. No worries! You can try again whenever you\'re ready.')
        setStatus('error')
        notifyError('Authentication was cancelled')
      } else {
        throw new Error(result.error || 'Authentication failed')
      }
    } catch (e) {
      const errorMsg = extractErrorMessage(e)
      setError(errorMsg)
      setStatus('error')
      notifyError(errorMsg)
    }
  }

  const extractErrorMessage = (error) => {
    if (error.name === 'NotAllowedError') {
      return 'Authentication was cancelled or timed out. Please try again and approve the prompt when it appears.'
    }
    if (error.name === 'InvalidStateError' || error.name === 'NotFoundError') {
      return 'No passkey found. Please register a passkey first.'
    }
    if (error.name === 'SecurityError') {
      return 'Security error. Please make sure you\'re using a supported browser and try again.'
    }
    if (error.name === 'NotSupportedError') {
      return 'Passkeys are not supported on this device or browser. Please use a different device or browser.'
    }
    
    // Extract from error structure
    if (error?.message && typeof error.message === 'string') {
      const msg = error.message.trim()
      if (msg && !msg.toLowerCase().includes('something went wrong')) {
        return msg
      }
    }
    
    return 'Failed to authenticate. Please try again.'
  }

  return {
    status,
    error,
    sessionId,
    handleAuthenticate,
    handleDeny: () => {
      setStatus('error')
      setError('Sign-in request denied')
      notifyError('Sign-in request denied')
      setTimeout(() => window.close(), 2000)
    }
  }
}
