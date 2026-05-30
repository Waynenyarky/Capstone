import { useState, useCallback } from 'react'
import { useAuthSession } from '@/features/authentication/hooks'
import { useLoggedInMfaManager } from '@/features/authentication/hooks'

export function usePasswordResetFlow() {
  const { currentUser } = useAuthSession()
  const { enabled: totpEnabled, hasPasskeys } = useLoggedInMfaManager()
  const [step, setStep] = useState('forgot')
  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [requiresMfa, setRequiresMfa] = useState(false)
  const [warning, setWarning] = useState('')
  const [totpVerified, setTotpVerified] = useState(false)
  
  const handleForgotSubmit = useCallback(({ email: e, requiresMfa: mfa, warning: warn }) => {
    setEmail(e)
    setRequiresMfa(mfa || false)
    setWarning(warn || '')
    
    // Check if user has TOTP enabled and this is a logged-in user reset
    if (currentUser && totpEnabled) {
      setStep('verify-totp')
    } else if (mfa) {
      setStep('verify-mfa')
    } else {
      setStep('verify')
    }
  }, [currentUser, totpEnabled])

  const handleTotpSubmit = useCallback(({ email: e, resetToken: token, allowedToReset }) => {
    setEmail(e)
    setResetToken(token)
    setTotpVerified(true)
    setStep(allowedToReset === false ? 'not_allowed' : 'change')
  }, [])

  const handleMfaSubmit = useCallback(({ email: e, resetToken: token, allowedToReset }) => {
    setEmail(e)
    setResetToken(token)
    setStep(allowedToReset === false ? 'not_allowed' : 'change')
  }, [])

  const handleVerifySubmit = useCallback(({ email: e, resetToken: token, allowedToReset }) => {
    setEmail(e)
    setResetToken(token)
    setStep(allowedToReset === false ? 'not_allowed' : 'change')
  }, [])

  const handleChangeSubmit = useCallback(() => {
    setStep('done')
  }, [])

  const reset = useCallback(() => {
    setStep('forgot')
    setEmail('')
    setResetToken('')
    setRequiresMfa(false)
    setWarning('')
    setTotpVerified(false)
  }, [])

  const goBack = useCallback(() => {
    if (step === 'verify' || step === 'verify-mfa' || step === 'verify-totp') setStep('forgot')
    else if (step === 'change') {
      if (totpVerified) setStep('verify-totp')
      else if (requiresMfa) setStep('verify-mfa')
      else setStep('verify')
    }
    else if (step === 'not_allowed') setStep('verify')
  }, [step, requiresMfa, totpVerified])

  const forgotProps = { onSubmit: handleForgotSubmit }
  const verifyProps = { onSubmit: handleVerifySubmit, email }
  const mfaProps = { onSubmit: handleMfaSubmit, email, warning }
  const totpProps = { onSubmit: handleTotpSubmit, email }
  const changeProps = { onSubmit: handleChangeSubmit, email, resetToken }

  return { step, forgotProps, verifyProps, mfaProps, totpProps, changeProps, email, resetToken, requiresMfa, warning, totpEnabled, hasPasskeys, reset, goBack }
}