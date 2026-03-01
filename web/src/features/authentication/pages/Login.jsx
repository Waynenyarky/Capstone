import React from 'react'
import { LoginForm, AuthLayout } from '@/features/authentication'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthSession } from '@/features/authentication/hooks/useAuthSession'
import { Alert } from 'antd'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuthSession()

  const handleLoginSuccess = React.useCallback((user) => {
    const role = String(user?.role?.slug || user?.role || '').toLowerCase()
    const needsOnboarding = !!(user?.mustChangeCredentials || user?.mustSetupMfa)

    // Success notification shown on destination page (Option A)
    const loginSuccessNotification = {
      type: 'success',
      message: 'Welcome back',
      description: 'You have signed in successfully.',
    }

    // Inspector accounts are mobile-app only; block web login and clear session
    if (role === 'inspector') {
      logout()
      navigate('/login', { state: { inspectorBlocked: true }, replace: true })
      return
    }

    if (role === 'admin') {
      if (needsOnboarding) {
        navigate('/admin/onboarding', { state: { from: '/admin/dashboard', notification: loginSuccessNotification }, replace: true })
        return
      }
      navigate('/admin/dashboard', { state: { notification: loginSuccessNotification }, replace: true })
      return
    }

    if (role === 'business_owner') {
      if (user?.mustChangeCredentials) {
        navigate('/account/security', { state: { notification: loginSuccessNotification }, replace: true })
      } else {
        navigate('/owner', { state: { notification: loginSuccessNotification }, replace: true })
      }
      return
    }

    const staffRoles = ['staff', 'lgu_manager', 'lgu_officer', 'cso']
    if (staffRoles.includes(role)) {
      if (user?.mustChangeCredentials || user?.mustSetupMfa) {
        navigate('/staff/onboarding', { state: { notification: loginSuccessNotification }, replace: true })
      } else {
        navigate('/staff', { state: { notification: loginSuccessNotification }, replace: true })
      }
      return
    }

    navigate('/owner', { state: { notification: loginSuccessNotification }, replace: true })
  }, [navigate, logout])

  const showInvalidCredentials = location.state?.inspectorBlocked === true

  return (
    <AuthLayout formMaxWidth={800}>
      {showInvalidCredentials && (
        <Alert
          type="error"
          message="Invalid credentials."
          showIcon
          style={{ marginBottom: 24, maxWidth: 440 }}
        />
      )}
      <LoginForm onSubmit={handleLoginSuccess} />
    </AuthLayout>
  )
}
