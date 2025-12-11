import { useState, useCallback } from 'react'

export function usePasswordResetFlow() {
  const [step, setStep] = useState('forgot')
  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  
  const handleForgotSubmit = useCallback(({ email: e }) => {
    setEmail(e)
    setStep('verify')
  }, [])

  const handleVerifySubmit = useCallback(({ email: e, resetToken: token }) => {
    setEmail(e)
    setResetToken(token)
    setStep('change')
  }, [])

  const handleChangeSubmit = useCallback(() => {
    setStep('done')
  }, [])

  const reset = useCallback(() => {
    setStep('forgot')
    setEmail('')
    setResetToken('')
    
  }, [])

  const forgotProps = { onSubmit: handleForgotSubmit }
  const verifyProps = { onSubmit: handleVerifySubmit, email }
  const changeProps = { onSubmit: handleChangeSubmit, email, resetToken }

  return { step, forgotProps, verifyProps, changeProps, email, resetToken, reset }
}