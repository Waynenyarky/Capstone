import { AuthLayout, PasswordResetFlow } from '@/features/authentication'

export default function ForgotPassword() {
  return (
    <AuthLayout>
      <PasswordResetFlow />
    </AuthLayout>
  )
}
