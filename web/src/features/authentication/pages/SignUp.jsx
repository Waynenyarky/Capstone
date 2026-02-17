// SignUp.jsx — BizClear themed two-column signup page
import React from 'react'
import { UserSignUpForm, AuthLayout } from '@/features/authentication'

export default function SignUp() {
  return (
    <AuthLayout formMaxWidth={800}>
      <UserSignUpForm />
    </AuthLayout>
  )
}
