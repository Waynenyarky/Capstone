import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AuthLayout } from '@/features/authentication'
import SignUpMfaSetupStep from '@/features/authentication/signup/components/SignUpMfaSetupStep.jsx'
import { useAuthSession } from '@/features/authentication/hooks'

export default function SignUpMfaSetup() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, currentUser } = useAuthSession()
  const loggedInRef = React.useRef(false)

  const pendingUser = location.state?.pendingUser

  React.useEffect(() => {
    if (loggedInRef.current) return
    if (pendingUser?.token) {
      loggedInRef.current = true
      try {
        login(pendingUser, { remember: false })
      } catch { /* ignore */ }
    } else if (!currentUser?.token) {
      navigate('/sign-up', { replace: true })
    }
  }, [pendingUser, currentUser, login, navigate])

  const goToDashboard = React.useCallback(() => {
    navigate('/owner', { replace: true })
  }, [navigate])

  if (!pendingUser?.token && !currentUser?.token) return null

  return (
    <AuthLayout>
      <SignUpMfaSetupStep onSkip={goToDashboard} onComplete={goToDashboard} />
    </AuthLayout>
  )
}
