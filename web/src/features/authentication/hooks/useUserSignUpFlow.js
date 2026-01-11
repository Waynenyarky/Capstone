import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { notifyUserSignedUp } from '@/features/admin/users/lib/usersEvents.js'

export function useUserSignUpFlow() {
  const navigate = useNavigate()
  const [step, setStep] = useState('form')
  const [emailForVerify, setEmailForVerify] = useState('')
  const [devCodeForVerify, setDevCodeForVerify] = useState('')

  const verifyEmail = useCallback(({ email, devCode }) => {
    setEmailForVerify(String(email || '').trim())
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
      // We do not auto-login here because the user explicitly requested
      // to be redirected to the Login page after verification.
      // If we called login(user), they might be redirected to the dashboard instead.
      /*
      let user = created?.user || created
      if (created?.token && user && !user.token) {
        user = { ...user, token: created.token }
      }
      if (user) login(user, { remember: false })
      */
    } catch { /* ignore */ }
    notifyUserSignedUp(created)
    navigate('/login')
  }, [navigate])

  return { step, emailForVerify, devCodeForVerify, verifyEmail, resetFlow, handleVerificationSubmit }
}
