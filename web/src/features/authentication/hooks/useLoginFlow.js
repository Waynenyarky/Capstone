import React from 'react'
import { useLogin } from './useLogin.js'
import { useAuthSession } from './useAuthSession.js'
import { useRememberedEmail } from './useRememberedEmail.js'
import { mfaStatus } from '@/features/authentication/services/mfaService'
import { useNotifier } from '@/shared/notifications.js'

// Orchestrates the login UI flow (login -> verify) and keeps
// business logic out of the component.
export function useLoginFlow({ onSubmit } = {}) {
  const { success } = useNotifier()
  const { login } = useAuthSession()
  const { initialEmail, rememberEmail, clearRememberedEmail } = useRememberedEmail()

  const [step, setStep] = React.useState('login')
  const [emailForVerify, setEmailForVerify] = React.useState(initialEmail || '')
  const [rememberMe, setRememberMe] = React.useState(!!initialEmail)
  const [otpExpiresAt, setOtpExpiresAt] = React.useState(null)
  const [serverLockedUntil, setServerLockedUntil] = React.useState(null)

  const { form, handleFinish, isSubmitting } = useLogin({
    onBegin: async ({ email, rememberMe: rm, serverData } = {}) => {
      // Called after loginStart succeeds. Decide which verification UI to show.
      setEmailForVerify(email || '')
      setRememberMe(!!rm)
      // capture OTP expiry info from server response if present
      try {
        if (serverData) {
          if (serverData.expiresAt) {
            setOtpExpiresAt(Number(serverData.expiresAt))
          } else if (serverData.expires_in || serverData.expiresIn) {
            const secs = Number(serverData.expires_in || serverData.expiresIn)
            if (!Number.isNaN(secs)) setOtpExpiresAt(Date.now() + secs * 1000)
          }
        }
      } catch { /* ignore */ }
      try {
        const status = await mfaStatus(email)
        if (status && status.enabled === true) {
          setStep('verify-totp')
        } else {
          // MFA not enabled for this account — signal caller to complete
          // the server-side login. We return proceedWithLogin here; the
          // `useLogin` hook will delegate final login to the caller so
          // completion is centralized and validated in one place.
          return { proceedWithLogin: true }
        }
      } catch {
        // If status check fails, fall back to email verification
        setStep('verify')
      }
    },
    onError: (err) => {
      // Try to parse structured lock info from the error object
      try {
        const maybe = err?.body || err?.response || err?.data || err
        const locked = maybe?.lockedUntil || maybe?.adminLockedUntil || maybe?.locked_until || maybe?.locked_at || maybe?.lockedUntilMs || maybe?.lockedUntilMs || maybe?.locked_until_ms
        if (locked) {
          const lu = Number(locked) || Date.parse(locked)
          if (!Number.isNaN(lu)) setServerLockedUntil(Number(lu))
        }
      } catch { /* ignore */ }
    },
    onSubmit: async (user, values, opts = {}) => {
      // If the call was a delegation request (no user, but caller asked us
      // to finish server login), perform the server call here so we can
      // validate the server response before calling `login()`.
      if (opts && opts.serverLoginPayload) {
        try {
          const payload = opts.serverLoginPayload
          const serverUser = await import('@/features/authentication/services').then(mod => mod.loginPost(payload))

          // Strict validation: ensure the server returned an actual user-like
          // object (not an error wrapper). We accept if it contains at least
          // one commonly expected field: id, userId, email, role, or a token.
          const isValidServerUser = (u) => {
            if (!u || typeof u !== 'object') return false
            const hasId = !!(u.id || u.userId || u._id)
            const hasEmail = !!u.email
            const hasRole = typeof u.role === 'string'
            const hasToken = !!(u.token || u.accessToken || u.sessionToken)
            return hasId || hasEmail || hasRole || hasToken
          }

          if (!isValidServerUser(serverUser)) {
            console.error('Server returned unexpected login response:', serverUser)
            form.setFields([
              { name: 'email', errors: ['Invalid server response'] },
              { name: 'password', errors: ['Invalid server response'] },
            ])
            return
          }

          const role = String(serverUser?.role || '').toLowerCase()
          if (role === 'admin') {
            form.setFields([
              { name: 'email', errors: ['Invalid credentials'] },
              { name: 'password', errors: ['Invalid credentials'] },
            ])
            return
          }

          // Complete login centrally only after a successful server response
          const remember = values?.rememberMe === true
          login(serverUser, { remember })
          // Show success toast on final login completion
          success('Logged in successfully')
          const emailToRemember = values?.email
          if (remember) rememberEmail(emailToRemember)
          else clearRememberedEmail()
          if (typeof onSubmit === 'function') onSubmit(serverUser)
          return
        } catch (err) {
          console.error('Delegated server login failed:', err)
          throw err
        }
      }

      // Normal path: caller provided a full server-validated `user` object.
      const remember = values?.rememberMe === true
      login(user, { remember })
      // Show success toast on final login completion
      success('Logged in successfully')
      const emailToRemember = values?.email
      if (remember) rememberEmail(emailToRemember)
      else clearRememberedEmail()
      if (typeof onSubmit === 'function') onSubmit(user)
    }
  })

  const handleVerificationSubmit = React.useCallback((user) => {
    // Complete login after verification
    login(user, { remember: rememberMe })
    // Show success toast on final login completion
    success('Logged in successfully')
    if (rememberMe) rememberEmail(emailForVerify)
    else clearRememberedEmail()
    if (typeof onSubmit === 'function') onSubmit(user)
    // Reset step for next time
    setStep('login')
  }, [login, rememberMe, emailForVerify, rememberEmail, clearRememberedEmail, success, onSubmit])

  const prefillAdmin = React.useCallback(() => {
    form.setFieldsValue({ email: '1', password: '1', rememberMe: true })
    success('Admin credentials prefilled')
  }, [form, success])

  const prefillUser = React.useCallback(() => {
    form.setFieldsValue({ email: 'jane@example.com', password: 'password123', rememberMe: true })
    success('User credentials prefilled')
  }, [form, success])

  const initialValues = React.useMemo(() => ({ rememberMe: !!initialEmail, email: initialEmail }), [initialEmail])

  const verificationProps = {
    email: emailForVerify,
    title: 'Login Verification',
    onSubmit: handleVerificationSubmit,
    otpExpiresAt,
    serverLockedUntil,
  }

  return {
    step,
    form,
    handleFinish,
    isSubmitting,
    initialValues,
    prefillAdmin,
    prefillUser,
    verificationProps,
    serverLockedUntil,
  }
}
