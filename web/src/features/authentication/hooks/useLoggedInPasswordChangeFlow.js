import { useAuthSession } from '@/features/authentication/hooks'
import { useCallback, useState, useEffect } from 'react'
import { changePasswordAuthenticated } from '@/features/authentication/services'
import { useAuthNotification, useNotifier } from '@/shared/notifications'

export function useLoggedInPasswordChangeFlow() {
  const { currentUser } = useAuthSession()
  const { error } = useNotifier()
  const { notificationSuccess } = useAuthNotification()
  const [step, setStep] = useState('password')
  const [email, setEmail] = useState(currentUser?.email || '')

  useEffect(() => {
    setEmail(currentUser?.email || '')
  }, [currentUser])

  const handlePasswordSubmit = useCallback(async (values) => {
    if (!values?.currentPassword || !values?.password || values.password !== values.confirmPassword) return
    try {
      await changePasswordAuthenticated({
        currentPassword: values.currentPassword,
        newPassword: values.password,
      })
      setStep('done')
      notificationSuccess('Password changed', 'Your password has been updated successfully.')
    } catch (err) {
      console.error('Change password error:', err)
      error(err, 'Failed to change password')
    }
  }, [notificationSuccess, error])

  const reset = useCallback(() => {
    setStep('password')
  }, [])

  const goBack = useCallback(() => {
    setStep('password')
  }, [step])

  const changeProps = {
    email,
    onSubmit: handlePasswordSubmit,
  }

  return { step, changeProps, email, reset, goBack }
}
