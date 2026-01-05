import { useAuthSession } from "@/features/authentication/hooks"
import { useCallback, useEffect, useState } from 'react'

export function useLoggedInEmailChangeFlow() {
  const { currentUser } = useAuthSession()
  const [step, setStep] = useState('send')
  const [email, setEmail] = useState(currentUser?.email || '')
  const [newEmail, setNewEmail] = useState('')
  const [resetToken, setResetToken] = useState('')

  useEffect(() => {
    setEmail(currentUser?.email || '')
  }, [currentUser])

  const handleSent = useCallback(() => {
    setStep('verify')
  }, [])

  const handleVerifySubmit = useCallback(({ email: e, resetToken: token }) => {
    setEmail(e)
    setResetToken(token)
    setStep('change')
  }, [])

  const handleChangeStart = useCallback(({ newEmail: ne }) => {
    setNewEmail(ne)
    setStep('verifyNew')
  }, [])

  const handleVerifyNewSubmit = useCallback(() => {
    setStep('done')
  }, [])

  const reset = useCallback(() => {
    setStep('send')
    setResetToken('')
  }, [])

  const sendProps = { email, onSent: handleSent }
  const verifyProps = { email, onSubmit: handleVerifySubmit }
  const changeProps = { email, resetToken, onSubmit: handleChangeStart }
  const verifyNewProps = { email: newEmail, currentEmail: email, onSubmit: handleVerifyNewSubmit }

  return { step, sendProps, verifyProps, changeProps, verifyNewProps, email, newEmail, resetToken, reset }
}