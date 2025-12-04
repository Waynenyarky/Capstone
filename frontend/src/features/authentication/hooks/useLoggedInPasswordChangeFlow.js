import { useAuthSession } from "@/features/authentication/hooks"
import { useCallback, useState, useEffect } from 'react'

export function useLoggedInPasswordChangeFlow() {
  const { currentUser } = useAuthSession()
  const [step, setStep] = useState('send')
  const [email, setEmail] = useState(currentUser?.email || '')
  const [resetToken, setResetToken] = useState('')
  const [devCode, setDevCode] = useState('')

  useEffect(() => {
    setEmail(currentUser?.email || '')
  }, [currentUser])

  const handleSent = useCallback((data) => {
    setDevCode(String(data?.devCode || ''))
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
    setStep('send')
    setResetToken('')
    setDevCode('')
  }, [])

  const sendProps = { email, onSent: handleSent }
  const verifyProps = { email, onSubmit: handleVerifySubmit, devCode }
  const changeProps = { email, resetToken, onSubmit: handleChangeSubmit }

  return { step, sendProps, verifyProps, changeProps, email, resetToken, reset }
}