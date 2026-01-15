/**
 * Presentation Layer Hook: usePasskeyManager
 * Connects UI to use cases following Clean Architecture
 * This hook is in the presentation layer and depends on application layer
 */
import { useState, useCallback, useEffect, useMemo } from 'react'
import { RegisterPasskeyUseCase, ListPasskeysUseCase, DeletePasskeyUseCase, DeleteAllPasskeysUseCase } from '@/features/authentication/application/passkey'
import { WebAuthnRepository, UserRepository } from '@/features/authentication/application/passkey'
import * as webauthnService from '@/features/authentication/services/webauthnService'
import { getProfile } from '@/features/authentication/services/authService'
import { useAuthSession } from '@/features/authentication/hooks'
import { useNotifier } from '@/shared/notifications'

export function usePasskeyManager() {
  const { currentUser, login } = useAuthSession()
  const { success, error: notifyError, info } = useNotifier()
  
  const [credentials, setCredentials] = useState([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Initialize repositories (dependency injection) - memoized to prevent recreation
  const webauthnRepo = useMemo(() => new WebAuthnRepository(webauthnService), [])
  const userRepo = useMemo(() => new UserRepository(getProfile, { currentUser, login }), [currentUser, login])
  
  // Initialize use cases - memoized to prevent recreation on every render
  const registerUseCase = useMemo(() => new RegisterPasskeyUseCase({
    webauthnRepository: webauthnRepo,
    userRepository: userRepo,
    notifier: { success, error: notifyError, info }
  }), [webauthnRepo, userRepo, success, notifyError, info])
  
  const listUseCase = useMemo(() => new ListPasskeysUseCase({ webauthnRepository: webauthnRepo }), [webauthnRepo])
  const deleteUseCase = useMemo(() => new DeletePasskeyUseCase({ 
    webauthnRepository: webauthnRepo,
    userRepository: userRepo
  }), [webauthnRepo, userRepo])
  const deleteAllUseCase = useMemo(() => new DeleteAllPasskeysUseCase({
    webauthnRepository: webauthnRepo,
    userRepository: userRepo
  }), [webauthnRepo, userRepo])

  const email = currentUser?.email

  // Fetch credentials using use case
  const fetchCredentials = useCallback(async () => {
    if (!email) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const result = await listUseCase.execute({ email })
      setCredentials(result.credentials || [])
    } catch (err) {
      console.error('Failed to fetch credentials:', err)
      setCredentials([])
    } finally {
      setLoading(false)
    }
  }, [email, listUseCase])

  useEffect(() => {
    fetchCredentials()
  }, [fetchCredentials])

  // Register passkey using use case
  const handleRegister = useCallback(async () => {
    if (!email) {
      notifyError('Email is required to register a passkey')
      return
    }

    try {
      setRegistering(true)
      const result = await registerUseCase.execute({ email })
      
      if (result.success) {
        success('Passkey registered successfully!')
        await fetchCredentials()
      } else if (result.cancelled) {
        info('Registration was cancelled. No worries! You can try again whenever you\'re ready.')
      } else {
        notifyError(result.error || 'Failed to register passkey')
      }
    } catch (e) {
      console.error('Passkey registration failed', e)
      notifyError(e.message || 'Failed to register passkey. Please try again.')
    } finally {
      setRegistering(false)
    }
  }, [email, registerUseCase, fetchCredentials, success, notifyError, info])

  // Delete single passkey using use case
  const handleDelete = useCallback(async (credId) => {
    if (!credId) return

    try {
      setDeleting(true)
      const result = await deleteUseCase.execute({ credId })
      
      if (result.success) {
        success('Passkey deleted successfully')
        await fetchCredentials()
      } else {
        notifyError(result.error || 'Failed to delete passkey')
      }
    } catch (e) {
      console.error('Failed to delete passkey:', e)
      notifyError(e.message || 'Failed to delete passkey. Please try again.')
    } finally {
      setDeleting(false)
    }
  }, [deleteUseCase, fetchCredentials, success, notifyError])

  // Delete all passkeys using use case
  const handleDeleteAll = useCallback(async () => {
    try {
      setDeleting(true)
      const result = await deleteAllUseCase.execute()
      
      if (result.success) {
        success('Passkey authentication disabled successfully')
        await fetchCredentials()
      } else {
        notifyError(result.error || 'Failed to disable passkeys')
      }
    } catch (e) {
      console.error('Failed to disable passkey authentication:', e)
      notifyError(e.message || 'Failed to disable passkey authentication. Please try again.')
    } finally {
      setDeleting(false)
    }
  }, [deleteAllUseCase, fetchCredentials, success, notifyError])

  return {
    credentials,
    loading,
    registering,
    deleting,
    hasPasskeys: credentials.length > 0,
    handleRegister,
    handleDelete,
    handleDeleteAll,
    refreshCredentials: fetchCredentials
  }
}
