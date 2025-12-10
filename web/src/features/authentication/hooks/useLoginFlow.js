import React from 'react'
import { useLogin, useAuthSession, useRememberedEmail } from '@/features/authentication/hooks'
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
  const [devCodeForVerify, setDevCodeForVerify] = React.useState('')

  const { form, handleFinish, isSubmitting } = useLogin({
    onBegin: async ({ email, rememberMe: rm, devCode } = {}) => {
      // Called after loginStart succeeds. Decide which verification UI to show.
      setEmailForVerify(email || '')
      setRememberMe(!!rm)
      setDevCodeForVerify(String(devCode || ''))
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
      } catch (err) {
        // If status check fails, fall back to email verification
        setStep('verify')
      }
    },
    onSubmit: async (user, values, opts = {}) => {
      // If the call was a delegation request (no user, but caller asked us
      // to finish server login), perform the server call here so we can
      // validate the server response before calling `login()`.
      if (opts && opts.serverLoginPayload) {
        try {
          const payload = opts.serverLoginPayload
          const serverUser = await import('@/features/authentication/services').then(mod => mod.loginPost(payload))
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
    setDevCodeForVerify('')
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
    devCode: devCodeForVerify,
    title: 'Login Verification',
    onSubmit: handleVerificationSubmit,
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
  }
}
