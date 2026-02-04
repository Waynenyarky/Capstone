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
    // API may return user at top level (id, role, token, ...) or as created.user
    const rawUser = created?.user ?? created
    const token = rawUser?.token ?? created?.token
    const withToken = rawUser && token
      ? { ...rawUser, token }
      : created && token
        ? { ...created, token }
        : null

    if (!withToken || !withToken.token) {
      notifyUserSignedUp(created)
      navigate('/login', { replace: true })
      return
    }
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
      // /owner dashboard shows BusinessRegistrationWizard when profile is missing or draft
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
