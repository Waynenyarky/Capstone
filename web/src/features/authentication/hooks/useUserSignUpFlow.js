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

    notifyUserSignedUp(created)
    const role = String(withToken?.role?.slug ?? withToken?.role ?? '').toLowerCase()

    if (role === 'business_owner') {
      // Do NOT call login() here — we are still on /sign-up which is wrapped
      // by PublicRoute. If we set the user in auth state, PublicRoute re-renders
      // and redirects to /owner before our navigate() takes effect.
      // Pass the token via route state; the MFA page will call login() on mount.
      navigate('/signup/mfa-setup', { replace: true, state: { pendingUser: withToken } })
      return
    }

    try {
      login(withToken, { remember: false })
    } catch { /* ignore */ }

    if (role === 'admin') {
      navigate('/admin/dashboard', { replace: true })
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
