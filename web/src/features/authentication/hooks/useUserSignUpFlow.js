import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthSession } from '@/features/authentication'
import { notifyUserSignedUp } from '@/features/admin/users/lib/usersEvents.js'

export function useUserSignUpFlow() {
  const navigate = useNavigate()
  const { login } = useAuthSession()
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
    const user = created?.user ?? created
    if (!user) {
      notifyUserSignedUp(created)
      navigate('/login', { replace: true })
      return
    }
    const withToken = user.token ? user : { ...user, token: created?.token }
    try {
      login(withToken, { remember: false })
    } catch { /* ignore */ }
    notifyUserSignedUp(created)
    const role = String(withToken?.role?.slug ?? withToken?.role ?? '').toLowerCase()
    if (role === 'admin') {
      navigate('/admin/dashboard', { replace: true })
      return
    }
    if (role === 'business_owner') {
      navigate('/owner', { replace: true })
      return
    }
    const staffRoles = ['staff', 'lgu_manager', 'lgu_officer', 'inspector', 'cso']
    if (staffRoles.includes(role)) {
      navigate(withToken?.mustChangeCredentials || withToken?.mustSetupMfa ? '/staff/onboarding' : '/staff', { replace: true })
      return
    }
    navigate('/owner', { replace: true })
  }, [navigate, login])

  return { step, emailForVerify, devCodeForVerify, verifyEmail, resetFlow, handleVerificationSubmit }
}
