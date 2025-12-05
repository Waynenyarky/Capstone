import { useAuthSession } from "@/features/authentication"
import { useCallback, useEffect, useState } from 'react'

export function useLoggedInDeleteAccountFlow() {
  const { currentUser } = useAuthSession()
  const [step, setStep] = useState('send')
  const [email, setEmail] = useState(currentUser?.email || '')
  const [deleteToken, setDeleteToken] = useState('')

  useEffect(() => {
    setEmail(currentUser?.email || '')
  }, [currentUser])

  const handleSent = useCallback(() => {
    setStep('verify')
  }, [])

  const handleVerifySubmit = useCallback(({ email: e, deleteToken: token }) => {
    setEmail(e)
    setDeleteToken(token)
    setStep('confirm')
  }, [])

  const handleConfirmSubmit = useCallback(() => {
    setStep('done')
  }, [])

  const reset = useCallback(() => {
    setStep('send')
    setDeleteToken('')
  }, [])

  const sendProps = { email, onSent: handleSent }
  const verifyProps = { email, onSubmit: handleVerifySubmit }
  const confirmProps = { email, deleteToken, onSubmit: handleConfirmSubmit }

  return { step, sendProps, verifyProps, confirmProps, email, deleteToken, reset }
}