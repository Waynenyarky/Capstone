import React from 'react'
import { LoginForm, AuthLayout } from '@/features/authentication'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()

  const handleLoginSuccess = React.useCallback((user) => {
    const role = String(user?.role || '').toLowerCase()
    
    if (role === 'admin') {
      navigate('/admin/dashboard')
      return
    }
    
    if (role === 'business_owner') {
      navigate('/owner')
      return
    }

    const staffRoles = ['staff', 'lgu_manager', 'lgu_officer', 'inspector', 'cso']
    if (staffRoles.includes(role)) {
      navigate('/staff')
      return
    }

    navigate('/owner')
  }, [navigate])

  return (
    <AuthLayout formMaxWidth={800}>
       <LoginForm onSubmit={handleLoginSuccess} />
    </AuthLayout>
  )
}
