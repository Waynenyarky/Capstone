import { describe, it, expect } from 'vitest'

import * as hooks from '@/features/authentication/hooks'

describe('Authentication hooks barrel API', () => {
  it('exposes expected hooks', () => {
    const expected = [
      'useAuthSession',
      'useLogin',
      'useLoginFlow',
      'useLogoutForm',
      'useRememberedEmail',
      'useMfaVerificationForm',
      'useLoginVerificationForm',
      'useTotpVerificationForm',
      'useMfaSetup',
      'useCooldown',
      'useResendLoginCode',
      'useResendSignupCode',
      'useSignUpVerificationForm',
      'useVerificationForm',
      'useUserSignUp',
      'useUserSignUpFlow',
      'useConfirmLogoutModal',
      'useVerifyChangeEmailForm',
      'useVerifyDeleteAccountCode',
      'useEmailChangeTotpVerification',
      'usePasswordChangeTotpVerification',
      'useDeleteAccountTotpVerification',
      'useAuthSync',
      'useSidebar',
      'useNavigationNotifications',
      'useLoggedInMfaManager',
      'usePasskeyLogin',
      'useWebAuthn',
      'useSessionActivity',
      'useSessionTimeout',
      'useMaintenanceStatus',
      'usePasswordResetFlow',
      'useForgotPasswordForm',
      'usePasswordResetTotpVerification',
      'useResendForgotPasswordCode',
    ]
    expect(Object.keys(hooks)).toEqual(expect.arrayContaining(expected))
  })

  it('each hook is a function', () => {
    for (const key of Object.keys(hooks)) {
      expect(typeof hooks[key]).toBe('function')
    }
  })
})
