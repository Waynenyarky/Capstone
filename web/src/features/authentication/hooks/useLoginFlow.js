import React from 'react'
import { useLogin, useAuthSession, useRememberedEmail } from '@/features/authentication/hooks'
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
    onBegin: ({ email, rememberMe: remember, devCode }) => {
      setEmailForVerify(email)
      setRememberMe(!!remember)
      setDevCodeForVerify(String(devCode || ''))
      setStep('verify')
    },
    onSubmit: (user, values) => {
      // Fallback immediate login behavior (if two-step not used)
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

  const prefillProvider = React.useCallback(() => {
    form.setFieldsValue({ email: 'provider@gmail.com', password: 'bhj680CFD531$', rememberMe: true })
    success('Provider credentials prefilled')
  }, [form, success])

  const prefillCustomer = React.useCallback(() => {
    form.setFieldsValue({ email: 'customer@gmail.com', password: 'bhj680CFD531$', rememberMe: true })
    success('Customer credentials prefilled')
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
    prefillProvider,
    prefillCustomer,
    verificationProps,
  }
}