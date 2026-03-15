import { useAuthSession } from "@/features/authentication"
import { useLoggedInMfaManager } from "@/features/authentication/hooks"
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteAccountConfirm } from '@/features/authentication/services'
import { useNotifier } from '@/shared/notifications'

export function useLoggedInDeleteAccountFlow() {
  const { currentUser, login } = useAuthSession()
  const { enabled: totpEnabled, hasPasskeys } = useLoggedInMfaManager()
  const { error, success } = useNotifier()
  const navigate = useNavigate()
  const [step, setStep] = useState('send')
  const [email, setEmail] = useState(currentUser?.email || '')
  const [deleteToken, setDeleteToken] = useState('')

  useEffect(() => {
    setEmail(currentUser?.email || '')
  }, [currentUser])

  const handleSent = useCallback((result) => {
    if (result?.mfaRequired) {
      setStep('totp-verify')
    } else if (result?.sent) {
      setStep('verify')
    } else {
      setStep('confirm')
    }
  }, [])

  const handleTotpVerified = useCallback(({ email: verifiedEmail, deleteToken: token } = {}) => {
    if (verifiedEmail) setEmail(verifiedEmail)
    setDeleteToken(token || '')
    setStep('confirm')
  }, [])

  const handleVerifySubmit = useCallback(async ({ email: e, deleteToken: token }) => {
    setEmail(e)
    setDeleteToken(token || '')
    setStep('confirm')
  }, [])

  const handleConfirmSubmit = useCallback(async () => {
    try {
      const data = await deleteAccountConfirm({
        email,
        deleteToken,
        legalAcknowledgment: true, // User acknowledges the action is irreversible
      })
      const updatedUser = data?.user
      if (updatedUser) {
        const mergedUser = {
          ...currentUser,
          ...updatedUser,
          token: updatedUser.token || currentUser?.token,
        }
        login(mergedUser, { remember: true })
      }
      setStep('done')
      success('Account deletion scheduled', 'Your account access is scheduled for removal after the 30-day grace period.')
      navigate('/deletion-pending', { replace: true })
    } catch (err) {
      console.error('Delete account error:', err)
      error(err, 'Failed to delete account')
    }
  }, [email, deleteToken, currentUser, login, navigate, success, error])

  const reset = useCallback(() => {
    setStep('send')
    setDeleteToken('')
  }, [])

  const sendProps = { email, onSent: handleSent, totpEnabled }
  const totpVerifyProps = { email, onVerified: handleTotpVerified }
  const verifyProps = { email, onSubmit: handleVerifySubmit }
  const confirmProps = { email, deleteToken, onSubmit: handleConfirmSubmit }

  return { step, setStep, sendProps, totpVerifyProps, verifyProps, confirmProps, email, deleteToken, totpEnabled, hasPasskeys, reset }
}