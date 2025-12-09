import { useCallback, useState } from 'react'
import { useAuthSession } from '@/features/authentication'
import { notifyUserSignedUp } from '@/features/admin/users/lib/usersEvents.js'

export function useUserSignUpFlow() {
  const { login } = useAuthSession()
  const [step, setStep] = useState('form')
  const [emailForVerify, setEmailForVerify] = useState('')
  const [devCodeForVerify, setDevCodeForVerify] = useState('')

  const verifyEmail = useCallback(({ email, devCode }) => {
    setEmailForVerify(String(email || ''))
    setDevCodeForVerify(String(devCode || ''))
    setStep('verify')
  }, [])

  const resetFlow = useCallback(() => {
    setStep('form')
    setEmailForVerify('')
    setDevCodeForVerify('')
  }, [])

  const handleVerificationSubmit = useCallback((created) => {
    try {
      const user = created?.user || created
      if (user) login(user, { remember: false })
    } catch { /* ignore */ }
    notifyUserSignedUp(created)
    resetFlow()
  }, [login, resetFlow])

  return { step, emailForVerify, devCodeForVerify, verifyEmail, resetFlow, handleVerificationSubmit }
}
