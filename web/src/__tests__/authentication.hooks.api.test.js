import { describe, it, expect } from 'vitest'

import * as hooks from '@/features/authentication/hooks'

describe('Authentication hooks barrel API', () => {
  it('exposes expected hooks', () => {
    const expected = [
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
      'useVerificationForm',
      // Consolidated account hooks available via authentication barrel
      'useLoggedInEmailChangeFlow',
      'useLoggedInPasswordChangeFlow',
      'useConfirmDeleteAccountForm',
      'useCancelDeleteAccount',
      'useLoggedInDeleteAccountFlow',
      'useSendDeleteAccountCode',
      'useVerifyDeleteAccountCode',
    ]
    expect(Object.keys(hooks)).toEqual(expect.arrayContaining(expected))
  })

  it('each hook is a function', () => {
    for (const key of Object.keys(hooks)) {
      expect(typeof hooks[key]).toBe('function')
    }
  })
})
