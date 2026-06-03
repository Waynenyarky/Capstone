// SignUp.jsx — BizClear themed two-column signup page
import { UserSignUpForm, AuthLayout } from '@/features/authentication'

export default function SignUp() {
  return (
    <AuthLayout formMaxWidth={500}>
      <UserSignUpForm />
    </AuthLayout>
  )
}
