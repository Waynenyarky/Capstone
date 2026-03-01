import { useAuthSession } from "@/features/authentication"
import { useCallback, useEffect, useState } from 'react'
import { deleteAccountAuthenticated } from '@/features/authentication/services'
import { useNotifier } from '@/shared/notifications'

export function useLoggedInDeleteAccountFlow() {
  const { currentUser } = useAuthSession()
  const { error } = useNotifier()
  const [step, setStep] = useState('confirm')
  const [email, setEmail] = useState(currentUser?.email || '')

  useEffect(() => {
    setEmail(currentUser?.email || '')
  }, [currentUser])

  const handleConfirmSubmit = useCallback(async ({ password }) => {
    try {
      await deleteAccountAuthenticated({ password })
      setStep('done')
    } catch (err) {
      console.error('Delete account error:', err)
      error(err, 'Failed to delete account')
    }
  }, [error])

  const reset = useCallback(() => {
    setStep('confirm')
  }, [])

  const confirmProps = { email, onSubmit: handleConfirmSubmit }

  return { step, confirmProps, email, reset }
}