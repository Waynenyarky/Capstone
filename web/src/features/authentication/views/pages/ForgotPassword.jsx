import React from 'react'
import { AuthLayout, PasswordResetFlow } from '@/features/authentication'

export default function ForgotPassword() {
  return (
    <AuthLayout formMaxWidth={800}>
      <PasswordResetFlow />
    </AuthLayout>
  )
}
