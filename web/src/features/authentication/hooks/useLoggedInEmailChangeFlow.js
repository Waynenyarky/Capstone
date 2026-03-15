import { useAuthSession } from "@/features/authentication/hooks"
import { useLoggedInMfaManager } from "@/features/authentication/hooks"
import { useCallback, useEffect, useState } from 'react'

export function useLoggedInEmailChangeFlow() {
  const { currentUser } = useAuthSession()
  const { effectiveEnabled, enabled: totpEnabled, hasPasskeys } = useLoggedInMfaManager()
  const [step, setStep] = useState('send')
  const [email, setEmail] = useState(currentUser?.email || '')
  const [newEmail, setNewEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [totpVerified, setTotpVerified] = useState(false)

  useEffect(() => {
    setEmail(currentUser?.email || '')
  }, [currentUser])

  const handleSent = useCallback(() => {
    setStep('verify')
  }, [])

  const handleTotpVerified = useCallback(() => {
    // After TOTP verification, proceed to email change
    setTotpVerified(true)
    setStep('change')
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
    setTotpVerified(false)
  }, [])

  const sendProps = { email, onSent: handleSent, totpEnabled }
  const totpVerifyProps = { email, onVerified: handleTotpVerified }
  const verifyProps = { email, onSubmit: handleVerifySubmit }
  const changeProps = { email, resetToken, onSubmit: handleChangeStart }
  const verifyNewProps = { email: newEmail, currentEmail: email, onSubmit: handleVerifyNewSubmit }

  return { step, setStep, sendProps, totpVerifyProps, verifyProps, changeProps, verifyNewProps, email, newEmail, resetToken, totpEnabled, hasPasskeys, reset }
}