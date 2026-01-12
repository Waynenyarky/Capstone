import useWebAuthn from './useWebAuthn.js'
import { useAuthSession } from './useAuthSession.js'
import { useNotifier } from '@/shared/notifications.js'

export function usePasskeyLogin(form) {
  const { authenticate } = useWebAuthn()
  const { login } = useAuthSession()
  const { success, error } = useNotifier()

  const handlePasskeyLogin = async () => {
    try {
      const email = String(form.getFieldValue('email') || '').trim()
      if (!email) {
        error('Enter your email before using a passkey')
        return
      }
      const res = await authenticate({ email })
      // Expect server to return user object on successful authentication
      if (res && typeof res === 'object') {
        const remember = !!form.getFieldValue('rememberMe')
        login(res, { remember })
        success('Logged in with passkey')
      } else {
        error('Passkey login did not return a valid user')
      }
    } catch (e) {
      console.error('Passkey login failed', e)
      error(e)
    }
  }

  return { handlePasskeyLogin }
}
