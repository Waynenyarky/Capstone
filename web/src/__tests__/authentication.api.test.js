import { describe, it, expect } from 'vitest'

// Root authentication barrel
import * as auth from '@/features/authentication'
// Validations barrel
import * as validations from '@/features/authentication/validations'

describe('Authentication public API', () => {
  it('exposes expected components and flows', () => {
    const expectedExports = [
      'LoginForm',
      'LogoutForm',
      'UserSignUpForm',
      'LoginVerificationForm',
      'SignUpVerificationForm',
      'ChangeEmailForm',
      'ChangePasswordForm',
      'ForgotPasswordForm',
      'VerificationForm',
      'SendCodeForCurrentUser',
      'PasswordResetFlow',
      'DeleteAccountFlow',
      'LoggedInEmailChangeFlow',
      'LoggedInPasswordChangeFlow',
    ]
    expect(Object.keys(auth)).toEqual(expect.arrayContaining(expectedExports))
  })

  it('exposes expected hooks', () => {
    const expectedHooks = [
      'useAuthSession',
      'useLogin',
      'useLogoutForm',
      'useRememberedEmail',
      'useChangeEmailForm',
      'useChangePasswordForm',
      'useForgotPasswordForm',
      'useLoginVerificationForm',
      'useSendVerificationCode',
      'useSignUpVerificationForm',
      'useUserSignUp',
      'useUserSignUpFlow',
      'usePasswordResetFlow',
      'useLoggedInEmailChangeFlow',
      'useLoggedInPasswordChangeFlow',
      'useConfirmDeleteAccountForm',
      'useCancelDeleteAccount',
      'useLoggedInDeleteAccountFlow',
      'useSendDeleteAccountCode',
      'useVerifyDeleteAccountCode',
    ]
    expect(Object.keys(auth)).toEqual(expect.arrayContaining(expectedHooks))
  })
})


describe('Authentication validations API', () => {
  it('exposes expected rule sets', () => {
    const expectedRuleExports = [
      'firstNameRules', 'lastNameRules', 'phoneNumberRules', 'emailRules', 'termsRules',
      'signUpPasswordRules', 'signUpConfirmPasswordRules',
      'changePasswordRules', 'changeConfirmPasswordRules',
      'loginEmailRules', 'loginPasswordRules',
      'forgotPasswordEmailRules',
    ]
    expect(Object.keys(validations)).toEqual(expect.arrayContaining(expectedRuleExports))
  })

  it('provides arrays for common rules', () => {
    expect(Array.isArray(validations.emailRules)).toBe(true)
    expect(Array.isArray(validations.loginEmailRules)).toBe(true)
    expect(Array.isArray(validations.loginPasswordRules)).toBe(true)
    expect(Array.isArray(validations.signUpPasswordRules)).toBe(true)
  })
})
